-- Phiếu 45: giữ nguyên migration cũ, bọc RPC lớp để chặn tên trùng một cách nguyên tử.
alter function public.save_teacher_class(uuid,text,smallint,text,date,jsonb,jsonb)
  rename to save_teacher_class_before_unique_names;

revoke all on function public.save_teacher_class_before_unique_names(uuid,text,smallint,text,date,jsonb,jsonb)
  from public, anon, authenticated;

create function public.save_teacher_class(
  p_class_id uuid, p_name text, p_grade smallint, p_school_year text,
  p_week1_monday date, p_breaks jsonb, p_students jsonb)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare v_duplicate text;
begin
  if jsonb_typeof(p_students) = 'array' then
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
        detail = 'Tên gọi ngắn trong một lớp phải khác nhau; thêm chữ cái họ, ví dụ An B. và An T.';
    end if;
  end if;
  return public.save_teacher_class_before_unique_names(
    p_class_id,p_name,p_grade,p_school_year,p_week1_monday,p_breaks,p_students);
end $$;

revoke all on function public.save_teacher_class(uuid,text,smallint,text,date,jsonb,jsonb)
  from public, anon;
grant execute on function public.save_teacher_class(uuid,text,smallint,text,date,jsonb,jsonb)
  to authenticated;

-- Máy đã được duyệt chỉ được xem lớp của chính em. Gọi lesson_open phía server
-- để một lần tải trả đủ trạng thái cả năm, kể cả các bài giáo viên mở sớm.
create function public.student_home_state(p_student_id uuid, p_session_id uuid)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  v_uid uuid := private.require_uid();
  v_class public.classes%rowtype;
  v_week integer;
  v_lessons jsonb;
begin
  select c.* into v_class
    from public.device_sessions d
    join public.class_sessions s on s.id = d.session_id
    join public.classes c on c.id = s.class_id
    join public.enrollments e on e.class_id = c.id and e.student_id = d.student_id
    join public.students st on st.id = d.student_id
   where d.auth_uid = v_uid and d.session_id = p_session_id and d.student_id = p_student_id
     and s.closed_at is null and s.expires_at > now()
     and c.status = 'open' and e.status = 'active' and st.status = 'active';
  if not found then
    raise exception 'ZM_BLOCK_DEVICE_NOT_APPROVED'
      using detail = 'Máy không có phiên được duyệt đang hoạt động cho lớp này.';
  end if;
  v_week := private.current_week(v_class.id, current_date);
  select coalesce(jsonb_object_agg(l.id, private.lesson_open(v_class.id, l.id, current_date)), '{}'::jsonb)
    into v_lessons from public.lessons l where l.grade = v_class.grade;
  return jsonb_build_object('ok', true, 'class_id', v_class.id,
    'class_name', v_class.name, 'grade', v_class.grade,
    'current_week', v_week, 'lessons', v_lessons);
end $$;

revoke all on function public.student_home_state(uuid,uuid) from public, anon;
grant execute on function public.student_home_state(uuid,uuid) to authenticated;
