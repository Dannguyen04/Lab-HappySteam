-- S-05/S-06: ghi lớp + phân công chủ lớp nguyên tử, chỉ chủ lớp được sửa roster.
-- Không cấp quyền ghi trực tiếp lên các bảng; trả danh sách máy đã vào qua RPC giới hạn staff.
create function public.save_teacher_class(
  p_class_id uuid, p_name text, p_grade smallint, p_school_year text,
  p_week1_monday date, p_breaks jsonb, p_students jsonb)
returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare
  v_uid uuid := private.require_uid();
  v_class uuid := p_class_id;
  v_name text := btrim(coalesce(p_name, ''));
  v_year text := btrim(coalesce(p_school_year, ''));
  v_break jsonb;
  v_student jsonb;
  v_student_id uuid;
  v_nickname text;
  v_avatar text;
  v_seen_avatars text[] := '{}';
  v_seen_names text[] := '{}';
  v_kept uuid[] := '{}';
  v_warnings text[] := '{}';
  v_week date;
begin
  if coalesce((select auth.jwt() ->> 'is_anonymous'), 'false')::boolean
     or not exists (select 1 from public.profiles where id = v_uid) then
    raise exception 'ZM_BLOCK_BR_LP_01' using detail = 'Cần tài khoản giáo viên.';
  end if;
  if length(v_name) not between 1 and 80 or length(v_year) not between 4 and 20
     or p_grade not in (1, 3) or p_week1_monday is null
     or extract(isodow from p_week1_monday) <> 1
     or jsonb_typeof(p_breaks) is distinct from 'array'
     or jsonb_typeof(p_students) is distinct from 'array'
     or jsonb_array_length(p_students) > 60 then
    raise exception 'ZM_INVALID_INPUT' using errcode = '22023', detail = 'Thông tin lớp, lịch hoặc sĩ số không hợp lệ.';
  end if;

  if v_class is null then
    insert into public.classes(name, grade, school_year, week1_monday)
      values (v_name, p_grade, v_year, p_week1_monday) returning id into v_class;
    insert into public.class_staff(class_id, teacher_id, role)
      values (v_class, v_uid, 'owner');
  else
    if not public.is_owner(v_class) then
      raise exception 'ZM_BLOCK_BR_LP_04' using detail = 'Chỉ chủ lớp được sửa lớp.';
    end if;
    perform 1 from public.classes where id = v_class and status = 'open' for update;
    if not found then
      raise exception 'ZM_INVALID_INPUT' using errcode = '22023', detail = 'Lớp không tồn tại hoặc đã kết thúc.';
    end if;
    update public.classes set name = v_name, grade = p_grade,
      school_year = v_year, week1_monday = p_week1_monday where id = v_class;
  end if;

  delete from public.class_breaks where class_id = v_class;
  for v_break in select value from jsonb_array_elements(p_breaks) loop
    if jsonb_typeof(v_break) <> 'object' then
      raise exception 'ZM_INVALID_INPUT' using errcode = '22023';
    end if;
    begin
      v_week := (v_break ->> 'monday')::date;
    exception when others then
      raise exception 'ZM_INVALID_INPUT' using errcode = '22023', detail = 'Ngày tuần nghỉ không đúng.';
    end;
    if v_week <= p_week1_monday or extract(isodow from v_week) <> 1 then
      raise exception 'ZM_INVALID_INPUT' using errcode = '22023', detail = 'Tuần nghỉ phải là thứ Hai sau tuần 1.';
    end if;
    insert into public.class_breaks(class_id,week_monday,note)
      values (v_class,v_week,left(btrim(coalesce(v_break ->> 'note','')),120));
  end loop;

  for v_student in select value from jsonb_array_elements(p_students) loop
    if jsonb_typeof(v_student) <> 'object' then
      raise exception 'ZM_INVALID_INPUT' using errcode = '22023';
    end if;
    v_nickname := regexp_replace(btrim(coalesce(v_student ->> 'nickname','')), '\s+', ' ', 'g');
    v_avatar := btrim(coalesce(v_student ->> 'avatar',''));
    if length(v_nickname) not between 1 and 12 or length(v_avatar) not between 1 and 32
       or v_avatar = any(v_seen_avatars) then
      raise exception 'ZM_INVALID_INPUT' using errcode = '22023', detail = 'Tên hoặc con vật không hợp lệ / bị trùng.';
    end if;
    if lower(v_nickname) = any(v_seen_names) then
      v_warnings := array_append(v_warnings, 'BR-LP-02: Trùng tên ' || v_nickname);
    end if;
    v_seen_names := array_append(v_seen_names, lower(v_nickname));
    v_seen_avatars := array_append(v_seen_avatars, v_avatar);
    if nullif(v_student ->> 'id','') is not null then
      begin
        v_student_id := (v_student ->> 'id')::uuid;
      exception when others then
        raise exception 'ZM_INVALID_INPUT' using errcode = '22023', detail = 'Mã học sinh không đúng.';
      end;
      if v_student_id = any(v_kept) or not exists (
        select 1 from public.enrollments e where e.student_id = v_student_id
          and e.class_id = v_class and e.status = 'active') then
        raise exception 'ZM_BLOCK_BR_LP_04' using detail = 'Không thể sửa học sinh ngoài lớp.';
      end if;
      update public.students set nickname = v_nickname, avatar = v_avatar
        where id = v_student_id and status = 'active';
      if not found then
        raise exception 'ZM_INVALID_INPUT' using errcode = '22023', detail = 'Học sinh không còn hoạt động.';
      end if;
    else
      insert into public.students(nickname,avatar) values (v_nickname,v_avatar)
        returning id into v_student_id;
      insert into public.enrollments(student_id,class_id) values(v_student_id,v_class);
    end if;
    v_kept := array_append(v_kept, v_student_id);
  end loop;
  -- Bỏ tên khỏi lớp: đóng ghi danh, giữ bài làm và danh tính theo lịch sử.
  update public.enrollments set status = 'left', left_on = current_date
    where class_id = v_class and status = 'active' and not (student_id = any(v_kept));

  return jsonb_build_object('ok', true, 'class_id', v_class,
    'warnings', to_jsonb(v_warnings));
end $$;

create function public.session_attendees(p_session_id uuid)
returns table (device_tag text, nickname text, avatar text, started_at timestamptz)
language plpgsql stable security definer set search_path = '' as $$
begin
  perform private.require_uid();
  perform private.assert_session_staff(p_session_id);
  return query
    select private.device_tag(d.auth_uid, d.session_id), st.nickname, st.avatar, d.started_at
      from public.device_sessions d join public.students st on st.id = d.student_id
     where d.session_id = p_session_id order by d.started_at;
end $$;

revoke all on function public.save_teacher_class(uuid,text,smallint,text,date,jsonb,jsonb),
  public.session_attendees(uuid) from public, anon;
grant execute on function public.save_teacher_class(uuid,text,smallint,text,date,jsonb,jsonb),
  public.session_attendees(uuid) to authenticated;
