-- Phiếu 51: khóa dò mã qua nhiều UID, đồng nhất lỗi vào buổi, kiểm tra dữ liệu lớp.
-- Mọi thay đổi đều là migration mới; giữ wrapper tên duy nhất từ 0007.

create table private.join_global_rate (
  singleton boolean primary key default true check (singleton),
  blocked_until timestamptz
);
insert into private.join_global_rate (singleton) values (true);
revoke all on private.join_global_rate from public, anon, authenticated;
create index join_failures_time on private.join_failures (attempted_at);

-- Khóa hàng dùng chung giữ lượt kiểm tra + ghi thất bại tuần tự giữa mọi UID.
create or replace function private.assert_join_rate(p_uid uuid) returns void
language plpgsql volatile set search_path = '' as $$
declare v_until timestamptz;
begin
  select blocked_until into v_until from private.join_global_rate where singleton for update;
  if v_until > clock_timestamp() then
    raise exception 'ZM_BLOCK_RATE_LIMIT' using detail = 'Có quá nhiều lần thử mã. Vui lòng thử lại sau.';
  end if;
  if (select count(*) from private.join_failures f
      where f.auth_uid = p_uid and f.attempted_at > clock_timestamp() - interval '5 minutes') >= 5 then
    raise exception 'ZM_BLOCK_RATE_LIMIT' using detail = 'Có quá nhiều lần thử mã. Vui lòng thử lại sau.';
  end if;
end $$;

create or replace function private.record_join_failure(p_uid uuid) returns void
language plpgsql volatile set search_path = '' as $$
begin
  perform 1 from private.join_global_rate where singleton for update;
  delete from private.join_failures f where f.attempted_at < clock_timestamp() - interval '1 day';
  insert into private.join_failures (auth_uid) values (p_uid);
  if (select count(*) from private.join_failures f
      where f.attempted_at > clock_timestamp() - interval '1 minute') > 30 then
    update private.join_global_rate
       set blocked_until = clock_timestamp() + interval '1 minute'
     where singleton;
  end if;
end $$;

-- Chỉ trả roster cho mã đang mở, đã kiểm qua khóa tốc độ ở trên.
-- Giữ nguyên public.session_roster từ 0004 và cơ chế trả JSON lỗi để lưu lượt sai.

create or replace function public.join_session(p_code text) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare
  v_uid uuid := private.require_uid();
  v_session public.class_sessions%rowtype;
  v_appr private.device_approvals%rowtype;
  v_other boolean;
begin
  perform private.assert_join_rate(v_uid);
  select s.* into v_session from public.class_sessions s
   where s.id = private.open_session_by_code(p_code);
  if not found then
    perform private.record_join_failure(v_uid);
    return jsonb_build_object('ok', false, 'error', 'ZM_BLOCK_BR_BH_01', 'warnings', '[]'::jsonb);
  end if;
  select a.* into v_appr from private.device_approvals a
   where a.auth_uid = v_uid and a.session_id = v_session.id;
  if not found or v_appr.status = 'rejected' then
    perform private.record_join_failure(v_uid);
    return jsonb_build_object('ok', false, 'error', 'ZM_BLOCK_BR_BH_01', 'warnings', '[]'::jsonb);
  end if;
  if v_appr.status = 'pending' then
    return jsonb_build_object('ok', false, 'status', 'pending',
                              'device_tag', private.device_tag(v_uid, v_session.id), 'warnings', '[]'::jsonb);
  end if;
  if not exists (select 1 from public.enrollments e join public.students st on st.id = e.student_id
                  where e.student_id = v_appr.student_id and e.class_id = v_session.class_id
                    and e.status = 'active' and st.status = 'active') then
    perform private.record_join_failure(v_uid);
    return jsonb_build_object('ok', false, 'error', 'ZM_BLOCK_BR_BH_01', 'warnings', '[]'::jsonb);
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

-- Lớp: kiểm tra đầu vào trước wrapper 0007, khóa theo giáo viên khi tạo lớp,
-- và để hàm gốc 0006 thực hiện toàn bộ thay đổi trong cùng giao dịch.
create or replace function public.save_teacher_class(
  p_class_id uuid, p_name text, p_grade smallint, p_school_year text,
  p_week1_monday date, p_breaks jsonb, p_students jsonb)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare
  v_uid uuid := private.require_uid();
  v_duplicate text;
  v_break jsonb;
  v_week date;
  v_seen_weeks date[] := '{}';
begin
  if p_grade is null then
    raise exception 'ZM_INVALID_INPUT' using errcode = '22023', detail = 'Khối lớp không được bỏ trống.';
  end if;
  if jsonb_typeof(p_students) is distinct from 'array' then
    raise exception 'ZM_INVALID_INPUT' using errcode = '22023', detail = 'Danh sách học sinh phải là mảng.';
  end if;
  if jsonb_array_length(p_students) > 60 then
    raise exception 'ZM_INVALID_INPUT' using errcode = '22023', detail = 'Lớp tối đa 60 học sinh.';
  end if;
  if jsonb_typeof(p_breaks) is distinct from 'array' then
    raise exception 'ZM_INVALID_INPUT' using errcode = '22023', detail = 'Lịch nghỉ phải là mảng.';
  end if;
  if jsonb_array_length(p_breaks) > 60 then
    raise exception 'ZM_INVALID_INPUT' using errcode = '22023', detail = 'Lịch nghỉ tối đa 60 tuần.';
  end if;

  for v_break in select value from jsonb_array_elements(p_breaks) loop
    if jsonb_typeof(v_break) is distinct from 'object' then
      raise exception 'ZM_INVALID_INPUT' using errcode = '22023', detail = 'Tuần nghỉ không đúng định dạng.';
    end if;
    begin
      v_week := (v_break ->> 'monday')::date;
    exception when others then
      raise exception 'ZM_INVALID_INPUT' using errcode = '22023', detail = 'Ngày tuần nghỉ không đúng.';
    end;
    if v_week is null or v_week = any(v_seen_weeks) then
      raise exception 'ZM_INVALID_INPUT' using errcode = '22023', detail = 'Tuần nghỉ bị trùng hoặc thiếu ngày.';
    end if;
    v_seen_weeks := array_append(v_seen_weeks, v_week);
  end loop;

  select min(n.nickname) into v_duplicate
    from (
      select regexp_replace(btrim(coalesce(s.value ->> 'nickname', '')), '\s+', ' ', 'g') as nickname
        from jsonb_array_elements(p_students) s(value)
    ) n
   group by lower(n.nickname)
  having count(*) > 1
   limit 1;
  if v_duplicate is not null then
    raise exception 'ZM_BLOCK_BR_LP_02' using errcode = '22023',
      detail = 'Tên gọi ngắn trong một lớp phải khác nhau; thêm chữ cái họ.';
  end if;

  if p_class_id is null then
    -- Khóa trên profile có sẵn: hai yêu cầu tạo đồng thời không vượt hạn mức.
    perform 1 from public.profiles where id = v_uid for update;
    if (select count(distinct c.id) from public.classes c
        join public.class_staff cs on cs.class_id = c.id
        where cs.teacher_id = v_uid and cs.from_date <= current_date
          and cs.to_date is null and c.status = 'open') >= 20 then
      raise exception 'ZM_LIMIT' using errcode = '22023', detail = 'Mỗi giáo viên tối đa 20 lớp đang hoạt động.';
    end if;
  end if;
  return public.save_teacher_class_before_unique_names(
    p_class_id,p_name,p_grade,p_school_year,p_week1_monday,p_breaks,p_students);
end $$;

revoke all on function public.join_session(text),
  public.save_teacher_class(uuid,text,smallint,text,date,jsonb,jsonb) from public, anon;
grant execute on function public.join_session(text),
  public.save_teacher_class(uuid,text,smallint,text,date,jsonb,jsonb) to authenticated;
