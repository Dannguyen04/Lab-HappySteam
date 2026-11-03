-- Phiếu 52: BRD PO 01/11/2026. Chỉ bổ sung migration; không sửa lịch sử.
-- Mốc mở đã đạt được tồn tại độc lập với những lần điều chỉnh tuần nghỉ sau này.
create table public.class_lesson_opened (
  class_id uuid not null references public.classes (id) on delete cascade,
  lesson_id text not null references public.lessons (id),
  opened_on date not null default (now() at time zone 'Asia/Ho_Chi_Minh')::date,
  primary key (class_id, lesson_id)
);
alter table public.class_lesson_opened enable row level security;
revoke all on public.class_lesson_opened from public, anon, authenticated;

-- Backfill các bài đã tới tuần tại thời điểm áp migration.
insert into public.class_lesson_opened (class_id, lesson_id)
select c.id, l.id from public.classes c join public.lessons l on l.grade = c.grade
 where l.week <= private.current_week(c.id, (now() at time zone 'Asia/Ho_Chi_Minh')::date)
on conflict do nothing;

-- Chốt lại mọi bài ĐANG mở ngay trước khi sửa tuần nghỉ, kể cả khi sửa qua
-- save_teacher_class (xóa rồi nhập lại danh sách tuần nghỉ trong một giao dịch).
create function private.snapshot_open_lessons_on_break_change() returns trigger
language plpgsql security definer set search_path = '' as $$
declare v_class uuid := coalesce(new.class_id, old.class_id);
begin
  insert into public.class_lesson_opened (class_id, lesson_id)
  select c.id, l.id from public.classes c join public.lessons l on l.grade = c.grade
   where c.id = v_class
     and l.week <= private.current_week(c.id, (now() at time zone 'Asia/Ho_Chi_Minh')::date)
  on conflict do nothing;
  return case when tg_op = 'DELETE' then old else new end;
end $$;
revoke all on function private.snapshot_open_lessons_on_break_change() from public, anon, authenticated;
create trigger snapshot_open_before_break_change
before insert or update or delete on public.class_breaks
for each row execute function private.snapshot_open_lessons_on_break_change();

create or replace function private.lesson_open(p_class_id uuid, p_lesson_id text, p_on date)
returns boolean language sql stable set search_path = '' as $$
  select exists (
    select 1 from public.lessons l join public.classes c on c.id = p_class_id
     where l.id = p_lesson_id and l.grade = c.grade
       and (l.week <= private.current_week(c.id, p_on)
            or exists (select 1 from public.class_unlocks u
                        where u.class_id = c.id and u.lesson_id = l.id)
            or exists (select 1 from public.class_lesson_opened m
                        where m.class_id = c.id and m.lesson_id = l.id and m.opened_on <= p_on)))
$$;

create or replace function public.current_week(
  p_class_id uuid, p_on date default (now() at time zone 'Asia/Ho_Chi_Minh')::date)
returns integer language plpgsql stable security definer set search_path = '' as $$
begin
  perform private.require_uid();
  if not private.can_view_class(p_class_id) then
    raise exception 'ZM_BLOCK_BR_LP_01' using detail = 'Không có quyền xem lớp này.';
  end if;
  return private.current_week(p_class_id, p_on);
end $$;

create or replace function public.lesson_open(p_class_id uuid, p_lesson_id text)
returns boolean language plpgsql stable security definer set search_path = '' as $$
begin
  perform private.require_uid();
  if not private.can_view_class(p_class_id) then
    raise exception 'ZM_BLOCK_BR_LP_01' using detail = 'Không có quyền xem lớp này.';
  end if;
  return private.lesson_open(p_class_id, p_lesson_id, (now() at time zone 'Asia/Ho_Chi_Minh')::date);
end $$;

create or replace function public.open_session(p_class_id uuid) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare
  v_uid uuid := private.require_uid();
  v_code text;
  v_id uuid;
  v_expires timestamptz;
  v_try int := 0;
  v_closed int := 0;
  v_old_codes text[] := '{}'::text[];
begin
  if not public.is_staff(p_class_id) then
    raise exception 'ZM_BLOCK_BR_LP_01' using detail = 'Chỉ giáo viên đang phân công của lớp mới mở buổi học.';
  end if;
  -- Khóa theo lớp để hai giáo viên không thể tạo hai buổi cùng lúc.
  perform 1 from public.classes c where c.id = p_class_id and c.status = 'open' for update;
  if not found then
    raise exception 'ZM_BLOCK_BR_LP_01' using detail = 'Lớp đã kết thúc hoặc không tồn tại.';
  end if;
  perform private.close_expired_sessions();
  with closed as (
    update public.class_sessions s set closed_at = now()
     where s.class_id = p_class_id and s.closed_at is null
    returning s.id, s.join_code
  ), removed as (
    delete from public.device_sessions d using closed c where d.session_id = c.id
    returning d.auth_uid
  ) select count(*)::int, coalesce(array_agg(join_code::text), '{}'::text[])
      into v_closed, v_old_codes from closed;
  loop
    v_code := lpad(floor(random() * 10000)::int::text, 4, '0');
    -- Mã của buổi vừa đóng phải thực sự hết hiệu lực, kể cả khi sinh ngẫu nhiên trùng.
    if v_code = any(v_old_codes) then
      v_try := v_try + 1;
      if v_try >= 50 then
        raise exception 'ZM_NO_FREE_CODE' using detail = 'Không tìm được mã 4 số chưa dùng.';
      end if;
      continue;
    end if;
    begin
      insert into public.class_sessions (class_id, join_code, opened_by)
      values (p_class_id, v_code, v_uid)
      returning id, expires_at into v_id, v_expires;
      exit;
    exception when unique_violation then
      v_try := v_try + 1;
      if v_try >= 50 then
        raise exception 'ZM_NO_FREE_CODE' using detail = 'Không tìm được mã 4 số chưa dùng.';
      end if;
    end;
  end loop;
  return jsonb_build_object('ok', true, 'session_id', v_id, 'join_code', v_code,
           'expires_at', v_expires, 'closed_previous', v_closed > 0, 'warnings', '[]'::jsonb);
end $$;

-- Chỉ máy sở hữu yêu cầu được hủy, không ảnh hưởng yêu cầu máy khác.
-- Chấp nhận tình huống giáo viên vừa duyệt nhưng máy chưa vào để tránh race với polling.
create function public.cancel_join(p_code text) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare
  v_uid uuid := private.require_uid();
  v_session uuid;
  v_open boolean;
  v_deleted int;
begin
  select s.id, s.closed_at is null and s.expires_at > now()
    into v_session, v_open from public.class_sessions s
   where s.join_code = btrim(p_code)
   order by (s.closed_at is null and s.expires_at > now()) desc, s.opened_at desc
   limit 1;
  if v_session is null then
    return jsonb_build_object('ok', true, 'cancelled', false, 'session_open', false);
  end if;
  delete from private.device_approvals a
   where a.auth_uid = v_uid and a.session_id = v_session
     and a.status in ('pending', 'approved')
     and not exists (select 1 from public.device_sessions d
                      where d.auth_uid = v_uid and d.session_id = v_session)
  ;
  get diagnostics v_deleted = row_count;
  return jsonb_build_object('ok', true, 'cancelled', v_deleted > 0,
                            'session_open', v_open);
end $$;
revoke all on function public.cancel_join(text) from public, anon;
grant execute on function public.cancel_join(text) to authenticated;

-- F-09: trả trạng thái buổi trước khi xóa phiên máy để giao diện đổi tên
-- về lưới của cùng mã nếu còn hiệu lực, hoặc về màn nhập mã khi đã đóng.
create or replace function public.leave_session() returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare
  v_uid uuid := private.require_uid();
  v_code text;
begin
  select s.join_code into v_code from public.device_sessions d
    join public.class_sessions s on s.id = d.session_id
   where d.auth_uid = v_uid and s.closed_at is null and s.expires_at > now();
  delete from private.device_approvals a
   using public.class_sessions s
   where a.auth_uid = v_uid and s.id = a.session_id and s.closed_at is null;
  delete from public.device_sessions d where d.auth_uid = v_uid;
  return jsonb_build_object('ok', true, 'session_open', v_code is not null,
                            'join_code', v_code, 'warnings', '[]'::jsonb);
end $$;

-- Trước đó 0004/0006/0007/0008 còn CURRENT_DATE trong các hàm khác nhau.
-- Thay chính xác biểu thức ngày trong định nghĩa đang có (giữ nguyên logic
-- bảo mật 0008 và giới hạn dữ liệu, không tạo bản sao dễ bị lệch về sau).
do $$
declare v_name text; v_oid oid; v_ddl text;
begin
  foreach v_name in array array[
    'public.is_staff(uuid)', 'public.is_owner(uuid)',
    'public.save_attempt(uuid,text,jsonb,jsonb,jsonb,text)',
    'public.student_home_state(uuid,uuid)',
    'public.save_teacher_class_before_unique_names(uuid,text,smallint,text,date,jsonb,jsonb)',
    'public.save_teacher_class(uuid,text,smallint,text,date,jsonb,jsonb)',
    'public.give_consent(uuid,text,date,text)'
  ] loop
    v_oid := to_regprocedure(v_name);
    if v_oid is not null then
      v_ddl := pg_get_functiondef(v_oid);
      v_ddl := regexp_replace(v_ddl, '\mcurrent_date\M',
        '(now() at time zone ''Asia/Ho_Chi_Minh'')::date', 'gi');
      execute v_ddl;
    end if;
  end loop;
end $$;

alter table public.class_staff alter column from_date
  set default (now() at time zone 'Asia/Ho_Chi_Minh')::date;
alter table public.enrollments alter column joined_on
  set default (now() at time zone 'Asia/Ho_Chi_Minh')::date;
alter table public.group_members alter column joined_on
  set default (now() at time zone 'Asia/Ho_Chi_Minh')::date;
