-- 0004: vá các phát hiện trong docs/giao-viec/10-bao-cao-rls.md. Không sửa 0001–0003 (có thể đã áp lên DB thật):
-- hàm cũ được thay bằng create or replace (giữ nguyên quyền EXECUTE), policy cũ drop rồi tạo lại.
--
--   RLS-01  Giáo viên duyệt máy: máy gửi yêu cầu (request_join) → giáo viên duyệt (approve_device) →
--           máy gọi join_session(code) mới được ghi device_sessions. join_session(code, student_id) cũ bị xoá.
--   RLS-05  session_roster(code): chỉ nickname + avatar + "pick" (mã tạm theo buổi, không phải UUID học sinh).
--   F-09    leave_session(): nút "Không phải em".
--   Đoán mã session_roster / request_join: tối đa 5 lần sai / 5 phút / auth.uid().
--   RLS-02  device_in_class(student, class): máy–em–lớp–ghi danh active–buổi còn hạn; dùng trong attempts_read,
--           save_attempt, suggested_level, current_week/lesson_open.
--   RLS-03  is_staff / is_owner kiểm thêm from_date <= hôm nay.
--   RLS-06  Thành viên nhóm (qua máy hợp lệ hoặc phụ huynh) đọc nhóm, thành viên, sổ dự án của nhóm mình.
--
-- Mã lỗi mới (không phải luật BRD): 'ZM_BLOCK_DEVICE_NOT_APPROVED', 'ZM_BLOCK_RATE_LIMIT'.

-- ---------------------------------------------------------------------------
-- Bảng nội bộ
-- ---------------------------------------------------------------------------

-- Một máy (auth_uid) có tối đa một yêu cầu trong mỗi buổi; chọn lại tên khác = yêu cầu mới, về 'pending'.
create table private.device_approvals (
  auth_uid uuid not null,
  session_id uuid not null references public.class_sessions (id) on delete cascade,
  student_id uuid not null references public.students (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  requested_at timestamptz not null default now(),
  decided_at timestamptz,
  decided_by uuid references public.profiles (id),
  primary key (auth_uid, session_id)
);
create index device_approvals_session_status on private.device_approvals (session_id, status);
create index device_approvals_student on private.device_approvals (student_id);

-- Lần nhập mã buổi sai (chỉ ghi lần sai). Hàm ghi KHÔNG raise sau khi ghi, để dòng không bị rollback.
create table private.join_failures (
  id bigint generated always as identity primary key,
  auth_uid uuid not null,
  attempted_at timestamptz not null default now()
);
create index join_failures_uid_time on private.join_failures (auth_uid, attempted_at);

revoke all on private.device_approvals, private.join_failures from public;

-- ---------------------------------------------------------------------------
-- RLS-03: phân công chưa tới ngày bắt đầu thì chưa có quyền
-- ---------------------------------------------------------------------------

create or replace function public.is_staff(p_class uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.class_staff s
    where s.class_id = p_class and s.teacher_id = (select auth.uid())
      and s.from_date <= current_date and s.to_date is null)
$$;

create or replace function public.is_owner(p_class uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.class_staff s
    where s.class_id = p_class and s.teacher_id = (select auth.uid()) and s.role = 'owner'
      and s.from_date <= current_date and s.to_date is null)
$$;

-- ---------------------------------------------------------------------------
-- RLS-02: quyền của máy gói trong đúng lớp của buổi còn hạn
-- ---------------------------------------------------------------------------

create function public.device_in_class(p_student uuid, p_class uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.device_sessions d
      join public.class_sessions s on s.id = d.session_id
      join public.enrollments e on e.student_id = d.student_id and e.class_id = s.class_id and e.status = 'active'
     where d.auth_uid = (select auth.uid()) and d.student_id = p_student and s.class_id = p_class
       and s.closed_at is null and s.expires_at > now())
$$;
revoke all on function public.device_in_class(uuid, uuid) from public, anon;
grant execute on function public.device_in_class(uuid, uuid) to authenticated;

-- Policy cũ (0002) tra enrollments trong subquery: RLS của enrollments ẩn hàng với máy, nên máy KHÔNG BAO GIỜ
-- đọc được bài làm của chính em. Tra qua hàm definer để tránh điều đó (và tránh đệ quy RLS).
create function public.can_read_enrollment(p_enrollment uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.enrollments e where e.id = p_enrollment
    and (public.is_staff(e.class_id) or public.is_guardian(e.student_id)
         or public.device_in_class(e.student_id, e.class_id)))
$$;
revoke all on function public.can_read_enrollment(uuid) from public, anon;
grant execute on function public.can_read_enrollment(uuid) to authenticated;

drop policy attempts_read on public.attempts;
create policy attempts_read on public.attempts for select to authenticated
  using (public.can_read_enrollment(enrollment_id));

create or replace function private.can_view_class(p_class_id uuid) returns boolean
language sql stable set search_path = '' as $$
  select public.is_staff(p_class_id)
      or exists (select 1 from public.enrollments e
                  where e.class_id = p_class_id and e.status = 'active'
                    and (public.device_in_class(e.student_id, p_class_id) or public.is_guardian(e.student_id)))
$$;

create or replace function public.suggested_level(p_attempt_id uuid) returns text
language plpgsql stable security definer set search_path = '' as $$
declare v_class uuid; v_student uuid;
begin
  perform private.require_uid();
  select e.class_id, e.student_id into v_class, v_student
    from public.attempts a join public.enrollments e on e.id = a.enrollment_id
   where a.id = p_attempt_id;
  if not found or not (public.is_staff(v_class) or public.is_guardian(v_student)
                       or public.device_in_class(v_student, v_class)) then
    raise exception 'ZM_BLOCK_BR_LP_01' using detail = 'Không có quyền xem bài làm này.';
  end if;
  return private.suggested_level(p_attempt_id);
end $$;

-- Như 0003, chỉ đổi phần kiểm quyền: máy phải gắn với em trong ĐÚNG lớp của ghi danh active.
create or replace function public.save_attempt(
  p_student_id uuid, p_lesson_id text, p_missions jsonb default null,
  p_program jsonb default null, p_upgrades jsonb default null, p_mode text default null)
returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare
  v_uid uuid := private.require_uid();
  v_enrollment uuid;
  v_class uuid;
  v_version int;
  v_codes text[];
  v_new jsonb;
  v_row public.attempts%rowtype;
  v_guardian boolean := public.is_guardian(p_student_id);
begin
  if p_mode is not null and p_mode not in ('kid', 'pro') then
    raise exception 'ZM_INVALID_INPUT' using errcode = '22023', detail = 'mode phải là kid hoặc pro.';
  end if;
  if not v_guardian and not exists (select 1 from public.device_sessions d
                                     where d.auth_uid = v_uid and d.student_id = p_student_id) then
    raise exception 'ZM_BLOCK_BR_PH_02' using detail = 'Chỉ máy đang là em này (trong buổi học) hoặc phụ huynh của em mới lưu được.';
  end if;

  select e.id, e.class_id into v_enrollment, v_class
    from public.enrollments e join public.students st on st.id = e.student_id
   where e.student_id = p_student_id and e.status = 'active' and st.status = 'active';
  if not found then
    raise exception 'ZM_BLOCK_BR_BA_02' using detail = 'Em không còn ghi danh đang học.';
  end if;
  if not (v_guardian or public.device_in_class(p_student_id, v_class)) then
    raise exception 'ZM_BLOCK_BR_PH_02' using detail = 'Máy không ở buổi học còn hạn của lớp em đang học.';
  end if;
  if not private.lesson_open(v_class, p_lesson_id, current_date) then
    raise exception 'ZM_BLOCK_BR_BA_01' using detail = 'Bài đang khoá với lớp này.';
  end if;

  select a.version into v_version from public.attempts a
   where a.enrollment_id = v_enrollment and a.lesson_id = p_lesson_id;
  if v_version is null then
    select l.current_version into v_version from public.lessons l where l.id = p_lesson_id;
    if v_version is null then
      raise exception 'ZM_BLOCK_BR_BA_01' using detail = 'Bài chưa có nội dung (sắp có).';
    end if;
  end if;

  select coalesce(array_agg(m.item ->> 'code'), '{}') into v_codes
    from public.lesson_versions lv cross join lateral jsonb_array_elements(lv.missions) as m(item)
   where lv.lesson_id = p_lesson_id and lv.version = v_version;

  if p_missions is null or jsonb_typeof(p_missions) = 'null' then
    v_new := '{}'::jsonb;
  elsif jsonb_typeof(p_missions) = 'array' then
    select coalesce(jsonb_object_agg(t.code, now()), '{}'::jsonb) into v_new
      from (select distinct x.code from jsonb_array_elements_text(p_missions) as x(code)
             where x.code = any (v_codes)) t;
  elsif jsonb_typeof(p_missions) = 'object' then
    select coalesce(jsonb_object_agg(x.key, least(x.value::timestamptz, now())), '{}'::jsonb) into v_new
      from jsonb_each_text(p_missions) x where x.key = any (v_codes);
  else
    raise exception 'ZM_INVALID_INPUT' using errcode = '22023', detail = 'missions phải là mảng mã hoặc đối tượng mã → thời điểm.';
  end if;

  insert into public.attempts as a (enrollment_id, lesson_id, version, missions_done, modes_used, program, upgrades)
  values (v_enrollment, p_lesson_id, v_version, v_new,
          case when p_mode is null then '{}'::text[] else array[p_mode] end, p_program, p_upgrades)
  on conflict (enrollment_id, lesson_id) do update set
    missions_done = private.merge_missions(a.missions_done, excluded.missions_done),
    modes_used = case when p_mode is null or p_mode = any (a.modes_used) then a.modes_used
                      else a.modes_used || p_mode end,
    program  = coalesce(excluded.program, a.program),
    upgrades = coalesce(excluded.upgrades, a.upgrades),
    updated_at = now()
  returning a.* into v_row;

  return jsonb_build_object('ok', true, 'attempt_id', v_row.id, 'version', v_row.version,
                            'missions_done', v_row.missions_done, 'warnings', '[]'::jsonb);
end $$;

-- ---------------------------------------------------------------------------
-- Trợ giúp cho luồng vào buổi
-- ---------------------------------------------------------------------------

-- Mã tạm của một em trong một buổi: 12 ký tự hex, một chiều, hết nghĩa khi buổi đóng.
create function private.roster_pick(p_session uuid, p_student uuid) returns text
language sql immutable set search_path = '' as $$
  select substr(md5(p_session::text || ':' || p_student::text), 1, 12)
$$;

-- Nhãn 4 ký tự của máy trong buổi: máy hiện nhãn này, giáo viên thấy cùng nhãn trong danh sách chờ duyệt.
create function private.device_tag(p_uid uuid, p_session uuid) returns text
language sql immutable set search_path = '' as $$
  select upper(substr(md5(p_uid::text || ':' || p_session::text), 1, 4))
$$;

create function private.assert_join_rate(p_uid uuid) returns void
language plpgsql volatile set search_path = '' as $$
begin
  if (select count(*) from private.join_failures f
       where f.auth_uid = p_uid and f.attempted_at > now() - interval '5 minutes') >= 5 then
    raise exception 'ZM_BLOCK_RATE_LIMIT' using detail = 'Nhập sai mã quá 5 lần trong 5 phút. Đợi rồi thử lại.';
  end if;
end $$;

create function private.record_join_failure(p_uid uuid) returns void
language sql volatile set search_path = '' as $$
  delete from private.join_failures f where f.auth_uid = p_uid and f.attempted_at < now() - interval '1 day';
  insert into private.join_failures (auth_uid) values (p_uid);
$$;

-- Buổi đang mở + còn hạn theo mã; null nếu không có.
create function private.open_session_by_code(p_code text) returns uuid
language sql stable set search_path = '' as $$
  select s.id from public.class_sessions s
   where s.join_code = btrim(p_code) and s.closed_at is null and s.expires_at > now()
$$;

revoke all on all functions in schema private from public;

-- ---------------------------------------------------------------------------
-- Luồng máy (F-02, F-09)
-- ---------------------------------------------------------------------------

-- Mã sai / hết hạn: TRẢ {"ok":false,"error":"ZM_BLOCK_BR_BH_01"} thay vì raise, để lần sai được đếm (raise sẽ
-- rollback dòng đếm). Quá số lần: raise ZM_BLOCK_RATE_LIMIT.
create function public.session_roster(p_code text) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare
  v_uid uuid := private.require_uid();
  v_session uuid;
  v_class uuid;
begin
  perform private.assert_join_rate(v_uid);
  v_session := private.open_session_by_code(p_code);
  if v_session is null then
    perform private.record_join_failure(v_uid);
    return jsonb_build_object('ok', false, 'error', 'ZM_BLOCK_BR_BH_01', 'warnings', '[]'::jsonb);
  end if;
  select s.class_id into v_class from public.class_sessions s where s.id = v_session;
  return jsonb_build_object('ok', true, 'device_tag', private.device_tag(v_uid, v_session), 'warnings', '[]'::jsonb,
    'roster', coalesce((
      select jsonb_agg(jsonb_build_object('pick', private.roster_pick(v_session, st.id),
                                          'nickname', st.nickname, 'avatar', st.avatar)
                       order by st.nickname, st.avatar)
        from public.enrollments e join public.students st on st.id = e.student_id
       where e.class_id = v_class and e.status = 'active' and st.status = 'active'), '[]'::jsonb));
end $$;

create function public.request_join(p_code text, p_pick text) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare
  v_uid uuid := private.require_uid();
  v_session uuid;
  v_class uuid;
  v_student uuid;
  v_prev private.device_approvals%rowtype;
  v_status text;
begin
  perform private.assert_join_rate(v_uid);
  v_session := private.open_session_by_code(p_code);
  if v_session is null then
    perform private.record_join_failure(v_uid);
    return jsonb_build_object('ok', false, 'error', 'ZM_BLOCK_BR_BH_01', 'warnings', '[]'::jsonb);
  end if;
  select s.class_id into v_class from public.class_sessions s where s.id = v_session;

  select e.student_id into v_student
    from public.enrollments e join public.students st on st.id = e.student_id
   where e.class_id = v_class and e.status = 'active' and st.status = 'active'
     and private.roster_pick(v_session, e.student_id) = lower(btrim(p_pick));
  if v_student is null then
    raise exception 'ZM_INVALID_INPUT' using errcode = '22023', detail = 'Tên đã chọn không có trong buổi này.';
  end if;

  select a.* into v_prev from private.device_approvals a
   where a.auth_uid = v_uid and a.session_id = v_session for update;
  if found and v_prev.student_id = v_student and v_prev.status in ('pending', 'approved') then
    v_status := v_prev.status;                       -- gửi lại cùng tên: giữ nguyên
  else
    -- Tên mới (hoặc bị từ chối rồi chọn lại): về chờ duyệt, máy mất quyền em cũ ngay.
    delete from public.device_sessions d where d.auth_uid = v_uid;
    insert into private.device_approvals (auth_uid, session_id, student_id)
    values (v_uid, v_session, v_student)
    on conflict (auth_uid, session_id) do update
      set student_id = excluded.student_id, status = 'pending', requested_at = now(),
          decided_at = null, decided_by = null;
    v_status := 'pending';
  end if;
  return jsonb_build_object('ok', true, 'status', v_status,
                            'device_tag', private.device_tag(v_uid, v_session), 'warnings', '[]'::jsonb);
end $$;

-- Máy gọi lặp lại (poll) sau request_join. Chỉ ghi device_sessions khi giáo viên đã duyệt.
drop function public.join_session(text, uuid);
create function public.join_session(p_code text) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare
  v_uid uuid := private.require_uid();
  v_session public.class_sessions%rowtype;
  v_appr private.device_approvals%rowtype;
  v_other boolean;
begin
  select s.* into v_session from public.class_sessions s
   where s.join_code = btrim(p_code) and s.closed_at is null;
  if not found or v_session.expires_at <= now() then
    raise exception 'ZM_BLOCK_BR_BH_01' using detail = 'Mã buổi học đã đóng hoặc hết hạn.';
  end if;
  select a.* into v_appr from private.device_approvals a
   where a.auth_uid = v_uid and a.session_id = v_session.id;
  if not found or v_appr.status = 'rejected' then
    raise exception 'ZM_BLOCK_DEVICE_NOT_APPROVED' using detail = 'Máy chưa được giáo viên duyệt cho buổi này.';
  end if;
  if v_appr.status = 'pending' then
    return jsonb_build_object('ok', false, 'status', 'pending',
                              'device_tag', private.device_tag(v_uid, v_session.id), 'warnings', '[]'::jsonb);
  end if;
  if not exists (select 1 from public.enrollments e join public.students st on st.id = e.student_id
                  where e.student_id = v_appr.student_id and e.class_id = v_session.class_id
                    and e.status = 'active' and st.status = 'active') then
    raise exception 'ZM_BLOCK_BR_BA_02' using detail = 'Em không có ghi danh đang học trong lớp của buổi này.';
  end if;

  v_other := exists (select 1 from public.device_sessions d
                      where d.session_id = v_session.id and d.student_id = v_appr.student_id and d.auth_uid <> v_uid);
  insert into public.device_sessions (auth_uid, session_id, student_id)
  values (v_uid, v_session.id, v_appr.student_id)
  on conflict (auth_uid) do update
    set session_id = excluded.session_id, student_id = excluded.student_id, started_at = now();

  return jsonb_build_object('ok', true, 'status', 'approved', 'session_id', v_session.id,
           'student_id', v_appr.student_id, 'expires_at', v_session.expires_at,
           'warnings', case when v_other then '["BR-BH-02"]'::jsonb else '[]'::jsonb end);
end $$;

-- "Không phải em" (F-09): máy rời em hiện tại, phải chọn tên và chờ duyệt lại.
create function public.leave_session() returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare v_uid uuid := private.require_uid();
begin
  delete from private.device_approvals a
   using public.class_sessions s
   where a.auth_uid = v_uid and s.id = a.session_id and s.closed_at is null;
  delete from public.device_sessions d where d.auth_uid = v_uid;
  return jsonb_build_object('ok', true, 'warnings', '[]'::jsonb);
end $$;

-- ---------------------------------------------------------------------------
-- Luồng giáo viên duyệt máy (S-06)
-- ---------------------------------------------------------------------------

create function private.assert_session_staff(p_session_id uuid) returns uuid
language plpgsql stable set search_path = '' as $$
declare v_class uuid;
begin
  select s.class_id into v_class from public.class_sessions s where s.id = p_session_id;
  if not found or not public.is_staff(v_class) then
    raise exception 'ZM_BLOCK_BR_LP_01' using detail = 'Chỉ giáo viên đang phân công của lớp mới duyệt máy.';
  end if;
  return v_class;
end $$;
revoke all on function private.assert_session_staff(uuid) from public;

create function public.list_pending_devices(p_session_id uuid)
returns table (device_id uuid, device_tag text, student_id uuid, nickname text, avatar text,
               requested_at timestamptz, in_use_elsewhere boolean)
language plpgsql stable security definer set search_path = '' as $$
#variable_conflict use_column
begin
  perform private.require_uid();
  perform private.assert_session_staff(p_session_id);
  return query
    select a.auth_uid, private.device_tag(a.auth_uid, a.session_id), a.student_id, st.nickname, st.avatar,
           a.requested_at,
           exists (select 1 from public.device_sessions d
                    where d.session_id = a.session_id and d.student_id = a.student_id and d.auth_uid <> a.auth_uid)
           or exists (select 1 from private.device_approvals o
                       where o.session_id = a.session_id and o.student_id = a.student_id
                         and o.auth_uid <> a.auth_uid and o.status in ('pending', 'approved'))
      from private.device_approvals a join public.students st on st.id = a.student_id
     where a.session_id = p_session_id and a.status = 'pending'
     order by a.requested_at;
end $$;

-- p_device_id null = duyệt hết yêu cầu đang chờ KHÔNG trùng em (trùng thì để giáo viên duyệt từng máy).
-- Duyệt một máy mà em đang/đồng thời ở máy khác: vẫn duyệt, kèm cảnh báo BR-BH-02.
create function public.approve_device(p_session_id uuid, p_device_id uuid default null) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare
  v_uid uuid := private.require_uid();
  v_n int;
  v_conflicts jsonb;
  v_other boolean := false;
  v_student uuid;
begin
  perform private.assert_session_staff(p_session_id);
  if not exists (select 1 from public.class_sessions s
                  where s.id = p_session_id and s.closed_at is null and s.expires_at > now()) then
    raise exception 'ZM_BLOCK_BR_BH_01' using detail = 'Buổi học đã đóng hoặc hết hạn.';
  end if;

  if p_device_id is not null then
    update private.device_approvals a set status = 'approved', decided_at = now(), decided_by = v_uid
     where a.session_id = p_session_id and a.auth_uid = p_device_id and a.status = 'pending'
    returning a.student_id into v_student;
    if v_student is null then
      raise exception 'ZM_INVALID_INPUT' using errcode = '22023', detail = 'Không có yêu cầu chờ duyệt của máy này.';
    end if;
    v_other := exists (select 1 from private.device_approvals o
                        where o.session_id = p_session_id and o.student_id = v_student
                          and o.auth_uid <> p_device_id and o.status = 'approved')
            or exists (select 1 from public.device_sessions d
                        where d.session_id = p_session_id and d.student_id = v_student and d.auth_uid <> p_device_id);
    return jsonb_build_object('ok', true, 'approved', 1, 'conflicts', '[]'::jsonb,
             'warnings', case when v_other then '["BR-BH-02"]'::jsonb else '[]'::jsonb end);
  end if;

  with dup as (
    select a.student_id from private.device_approvals a
     where a.session_id = p_session_id and a.status in ('pending', 'approved')
     group by a.student_id having count(*) > 1)
  select coalesce(jsonb_agg(distinct dup.student_id), '[]'::jsonb) into v_conflicts from dup
   where exists (select 1 from private.device_approvals p
                  where p.session_id = p_session_id and p.student_id = dup.student_id and p.status = 'pending');

  with ok as (
    update private.device_approvals a set status = 'approved', decided_at = now(), decided_by = v_uid
     where a.session_id = p_session_id and a.status = 'pending'
       and not exists (select 1 from private.device_approvals o
                        where o.session_id = a.session_id and o.student_id = a.student_id
                          and o.auth_uid <> a.auth_uid and o.status in ('pending', 'approved'))
       and not exists (select 1 from public.device_sessions d
                        where d.session_id = a.session_id and d.student_id = a.student_id and d.auth_uid <> a.auth_uid)
    returning 1)
  select count(*) into v_n from ok;

  return jsonb_build_object('ok', true, 'approved', v_n, 'conflicts', v_conflicts,
           'warnings', case when jsonb_array_length(v_conflicts) > 0 then '["BR-BH-02"]'::jsonb else '[]'::jsonb end);
end $$;

-- Từ chối yêu cầu đang chờ, hoặc đá một máy đã duyệt ra khỏi buổi.
create function public.reject_device(p_session_id uuid, p_device_id uuid) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare v_uid uuid := private.require_uid();
begin
  perform private.assert_session_staff(p_session_id);
  update private.device_approvals a set status = 'rejected', decided_at = now(), decided_by = v_uid
   where a.session_id = p_session_id and a.auth_uid = p_device_id;
  if not found then
    raise exception 'ZM_INVALID_INPUT' using errcode = '22023', detail = 'Không có yêu cầu của máy này.';
  end if;
  delete from public.device_sessions d where d.session_id = p_session_id and d.auth_uid = p_device_id;
  return jsonb_build_object('ok', true, 'warnings', '[]'::jsonb);
end $$;

-- ---------------------------------------------------------------------------
-- RLS-06: thành viên đọc nhóm / thành viên / sổ dự án của nhóm mình
-- ---------------------------------------------------------------------------

create function public.can_read_group(p_group uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.group_members m
      join public.project_groups g on g.id = m.group_id
      join public.enrollments e on e.student_id = m.student_id and e.class_id = g.class_id and e.status = 'active'
     where m.group_id = p_group and m.left_on is null
       and (public.is_guardian(m.student_id) or public.device_in_class(m.student_id, g.class_id)))
$$;
revoke all on function public.can_read_group(uuid) from public, anon;
grant execute on function public.can_read_group(uuid) to authenticated;

create policy project_groups_member_read on public.project_groups
  for select to authenticated using (public.can_read_group(id));
create policy group_members_member_read on public.group_members
  for select to authenticated using (public.can_read_group(group_id));
create policy notebook_revisions_member_read on public.notebook_revisions
  for select to authenticated using (public.can_read_group(group_id));

-- ---------------------------------------------------------------------------
-- Quyền gọi RPC mới
-- ---------------------------------------------------------------------------

revoke all on function
  public.session_roster(text),
  public.request_join(text, text),
  public.join_session(text),
  public.leave_session(),
  public.list_pending_devices(uuid),
  public.approve_device(uuid, uuid),
  public.reject_device(uuid, uuid)
from public, anon;

grant execute on function
  public.session_roster(text),
  public.request_join(text, text),
  public.join_session(text),
  public.leave_session(),
  public.list_pending_devices(uuid),
  public.approve_device(uuid, uuid),
  public.reject_device(uuid, uuid)
to authenticated;
