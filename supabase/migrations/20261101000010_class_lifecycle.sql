-- Phiếu 53: vòng đời lớp, phân công, mã mời, mở sớm và chuyển ghi danh.
-- Mọi thao tác nhạy cảm đi qua security definer với search_path rỗng.

create table public.teacher_invitations (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes on delete cascade,
  email text not null check (length(email) between 3 and 254),
  invited_by uuid not null references public.profiles,
  status text not null default 'pending' check (status in ('pending','accepted','declined','revoked')),
  invited_at timestamptz not null default now(),
  responded_at timestamptz
);
create unique index one_pending_teacher_invite on public.teacher_invitations(class_id, lower(email)) where status='pending';
alter table public.teacher_invitations enable row level security;
revoke all on public.teacher_invitations from public, anon, authenticated;

-- Sinh 8 ký tự trong bảng chữ 32 ký tự, lấy entropy từ UUID ngẫu nhiên của PostgreSQL.
create function private.ensure_student_invite(p_student uuid, p_creator uuid) returns text
language plpgsql volatile security definer set search_path = '' as $$
declare
  v_code text;
  v_hex text;
  v_alphabet constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  v_i integer;
  v_try integer;
begin
  select code into v_code from public.invite_codes
   where student_id=p_student and status='valid' order by code limit 1;
  if v_code is not null then return v_code; end if;
  for v_try in 1..12 loop
    v_hex := replace(gen_random_uuid()::text, '-', '');
    v_code := '';
    for v_i in 0..7 loop
      v_code := v_code || substr(v_alphabet,
        (('x' || substr(v_hex, v_i*2+1, 2))::bit(8)::integer % length(v_alphabet)) + 1, 1);
    end loop;
    begin
      insert into public.invite_codes(code,student_id,created_by) values(v_code,p_student,p_creator);
      return v_code;
    exception when unique_violation then
      -- Trùng mã do hai yêu cầu đồng thời: dùng lại mã hợp lệ đã tạo.
      select code into v_code from public.invite_codes
       where student_id=p_student and status='valid' order by code limit 1;
      if v_code is not null then return v_code; end if;
    end;
  end loop;
  raise exception 'ZM_NO_FREE_CODE' using detail='Không tạo được mã mời mới.';
end $$;
revoke all on function private.ensure_student_invite(uuid,uuid) from public, anon, authenticated;

create function private.autocode_on_enrollment() returns trigger
language plpgsql security definer set search_path = '' as $$
declare v_owner uuid;
begin
  select teacher_id into v_owner from public.class_staff
   where class_id=new.class_id and role='owner' and to_date is null limit 1;
  if v_owner is not null then
    perform private.ensure_student_invite(new.student_id,v_owner);
  end if;
  return new;
end $$;
revoke all on function private.autocode_on_enrollment() from public, anon, authenticated;
create trigger auto_student_invite after insert on public.enrollments
for each row execute function private.autocode_on_enrollment();

-- Cấp mã cho ghi danh tạo trước migration, không thay mã đang còn hiệu lực.
do $$ declare r record; begin
  for r in select distinct on (e.student_id) e.student_id, s.teacher_id
    from public.enrollments e join public.class_staff s on s.class_id=e.class_id
    where e.status='active' and s.role='owner' and s.to_date is null
    order by e.student_id, e.joined_on desc loop
    perform private.ensure_student_invite(r.student_id,r.teacher_id);
  end loop;
end $$;

create function private.ungraded_core_count(p_class_id uuid) returns integer
language sql stable security definer set search_path = '' as $$
  select count(*)::integer
    from public.attempts a
    join public.enrollments e on e.id=a.enrollment_id
    join public.lesson_versions lv on lv.lesson_id=a.lesson_id and lv.version=a.version
    where e.class_id=p_class_id
      and exists (select 1 from jsonb_array_elements(lv.missions) m where m->>'kind'='core')
      and not exists (select 1 from jsonb_array_elements(lv.missions) m
                      where m->>'kind'='core' and not (a.missions_done ? (m->>'code')))
      and not exists (select 1 from public.evaluations ev where ev.attempt_id=a.id);
$$;
revoke all on function private.ungraded_core_count(uuid) from public, anon, authenticated;

create function public.set_teacher_class_status(p_class_id uuid, p_status text) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare v_pending integer := 0;
begin
  perform private.require_uid();
  if not public.is_owner(p_class_id) then raise exception 'ZM_BLOCK_BR_LP_04'; end if;
  if p_status not in ('open','ended') or p_status is null then raise exception 'ZM_INVALID_INPUT'; end if;
  perform 1 from public.classes where id=p_class_id for update;
  if not found then raise exception 'ZM_INVALID_INPUT'; end if;
  if p_status='ended' then
    v_pending := private.ungraded_core_count(p_class_id);
    -- Kết thúc năm học cũng đóng các buổi đang hoạt động và thu hồi máy.
    delete from public.device_sessions d using public.class_sessions s
      where d.session_id=s.id and s.class_id=p_class_id and s.closed_at is null;
    update public.class_sessions set closed_at=now() where class_id=p_class_id and closed_at is null;
  end if;
  update public.classes set status=p_status where id=p_class_id;
  return jsonb_build_object('ok',true,'status',p_status,'ungraded_core',v_pending,
    'warnings', case when v_pending>0 then jsonb_build_array('BR-LP-03') else '[]'::jsonb end);
end $$;

create function public.invite_class_assistant(p_class_id uuid, p_email text) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare v_uid uuid := private.require_uid(); v_email text := lower(btrim(coalesce(p_email,''))); v_id uuid;
begin
  if not public.is_owner(p_class_id) then raise exception 'ZM_BLOCK_BR_LP_04'; end if;
  if v_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' or length(v_email)>254
     then raise exception 'ZM_INVALID_INPUT'; end if;
  perform 1 from public.classes where id=p_class_id for update;
  if exists (select 1 from public.class_staff s join auth.users u on u.id=s.teacher_id
      where s.class_id=p_class_id and s.to_date is null and lower(u.email)=v_email) then
    raise exception 'ZM_ALREADY_STAFF';
  end if;
  insert into public.teacher_invitations(class_id,email,invited_by) values(p_class_id,v_email,v_uid)
    on conflict (class_id,lower(email)) where status='pending'
    do update set invited_at=now(), invited_by=excluded.invited_by
    returning id into v_id;
  return jsonb_build_object('ok',true,'invitation_id',v_id);
end $$;

create function public.my_class_invitations() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare v_uid uuid := private.require_uid(); v_email text;
begin
  if not exists (select 1 from public.profiles where id=v_uid) then raise exception 'ZM_BLOCK_BR_LP_01'; end if;
  v_email := lower(coalesce((select auth.jwt()->>'email'),''));
  return coalesce((select jsonb_agg(jsonb_build_object('id',i.id,'class_name',c.name,'invited_at',i.invited_at)
      order by i.invited_at desc)
    from public.teacher_invitations i join public.classes c on c.id=i.class_id
    where i.email=v_email and i.status='pending'), '[]'::jsonb);
end $$;

create function public.respond_class_invitation(p_invitation_id uuid, p_accept boolean) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare v_uid uuid := private.require_uid(); v_inv public.teacher_invitations%rowtype; v_email text;
begin
  if not exists (select 1 from public.profiles where id=v_uid) or p_accept is null then raise exception 'ZM_INVALID_INPUT'; end if;
  v_email := lower(coalesce(auth.jwt()->>'email',''));
  select * into v_inv from public.teacher_invitations where id=p_invitation_id for update;
  if not found or v_inv.status <> 'pending' or v_inv.email <> v_email then raise exception 'ZM_INVITE_UNAVAILABLE'; end if;
  perform 1 from public.classes where id=v_inv.class_id for update;
  if p_accept then
    if exists(select 1 from public.class_staff where class_id=v_inv.class_id and teacher_id=v_uid and to_date is null)
      then raise exception 'ZM_ALREADY_STAFF'; end if;
    insert into public.class_staff(class_id,teacher_id,role) values(v_inv.class_id,v_uid,'assistant');
  end if;
  update public.teacher_invitations set status=case when p_accept then 'accepted' else 'declined' end,
    responded_at=now() where id=v_inv.id;
  return jsonb_build_object('ok',true,'class_id',v_inv.class_id,'accepted',p_accept);
end $$;

create function public.manage_class_staff(p_class_id uuid, p_teacher_id uuid, p_action text) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare v_uid uuid := private.require_uid(); v_role text;
begin
  perform 1 from public.classes where id=p_class_id for update;
  if not found then raise exception 'ZM_INVALID_INPUT'; end if;
  select role into v_role from public.class_staff where class_id=p_class_id
    and teacher_id=p_teacher_id and from_date <= (now() at time zone 'Asia/Ho_Chi_Minh')::date
    and to_date is null for update;
  if v_role is null then raise exception 'ZM_INVALID_INPUT'; end if;
  if p_action='leave' then
    if v_uid<>p_teacher_id then raise exception 'ZM_BLOCK_BR_LP_04'; end if;
    if v_role='owner' then raise exception 'ZM_BLOCK_BR_LP_05'; end if;
    update public.class_staff set to_date=(now() at time zone 'Asia/Ho_Chi_Minh')::date
      where class_id=p_class_id and teacher_id=p_teacher_id and to_date is null;
  elsif p_action='remove' then
    if not public.is_owner(p_class_id) or v_role='owner' then raise exception 'ZM_BLOCK_BR_LP_04'; end if;
    update public.class_staff set to_date=(now() at time zone 'Asia/Ho_Chi_Minh')::date
      where class_id=p_class_id and teacher_id=p_teacher_id and to_date is null;
  elsif p_action='transfer' then
    if not public.is_owner(p_class_id) or v_role<>'assistant' then raise exception 'ZM_BLOCK_BR_LP_04'; end if;
    update public.class_staff set to_date=(now() at time zone 'Asia/Ho_Chi_Minh')::date
      where class_id=p_class_id and to_date is null and (teacher_id=v_uid or teacher_id=p_teacher_id);
    insert into public.class_staff(class_id,teacher_id,role) values
      (p_class_id,p_teacher_id,'owner'),(p_class_id,v_uid,'assistant');
  else raise exception 'ZM_INVALID_INPUT'; end if;
  return jsonb_build_object('ok',true,'action',p_action);
end $$;

create function public.revoke_class_invitation(p_invitation_id uuid) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare v_class uuid;
begin
  perform private.require_uid();
  select class_id into v_class from public.teacher_invitations where id=p_invitation_id and status='pending' for update;
  if v_class is null or not public.is_owner(v_class) then raise exception 'ZM_BLOCK_BR_LP_04'; end if;
  update public.teacher_invitations set status='revoked',responded_at=now() where id=p_invitation_id;
  return jsonb_build_object('ok',true);
end $$;

create function public.class_management_state(p_class_id uuid) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare v_owner boolean;
begin
  perform private.require_uid();
  if not public.is_staff(p_class_id) then raise exception 'ZM_BLOCK_BR_LP_01'; end if;
  v_owner := public.is_owner(p_class_id);
  return jsonb_build_object(
    'owner',v_owner,
    'ungraded_core',private.ungraded_core_count(p_class_id),
    'staff',coalesce((select jsonb_agg(jsonb_build_object('teacher_id',s.teacher_id,'role',s.role,'name',p.full_name))
      from public.class_staff s join public.profiles p on p.id=s.teacher_id
      where s.class_id=p_class_id and s.to_date is null
        and s.from_date <= (now() at time zone 'Asia/Ho_Chi_Minh')::date),'[]'::jsonb),
    'invitations',case when v_owner then coalesce((select jsonb_agg(jsonb_build_object('id',i.id,'email',i.email))
      from public.teacher_invitations i where i.class_id=p_class_id and i.status='pending'),'[]'::jsonb)
      else '[]'::jsonb end,
    'students',coalesce((select jsonb_agg(jsonb_build_object('id',st.id,'nickname',st.nickname,'avatar',st.avatar,
      'status',e.status) order by st.nickname)
      from public.enrollments e join public.students st on st.id=e.student_id
      where e.class_id=p_class_id and e.id=(select e2.id from public.enrollments e2
        where e2.class_id=e.class_id and e2.student_id=e.student_id
        order by case when e2.status='active' then 0 else 1 end,
                 e2.joined_on desc,e2.id desc limit 1)), '[]'::jsonb));
end $$;

create function public.class_invite_slips(p_class_id uuid) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare v_uid uuid := private.require_uid(); v_student record; v_slips jsonb := '[]'::jsonb; v_code text;
begin
  if not public.is_staff(p_class_id) then raise exception 'ZM_BLOCK_BR_LP_01'; end if;
  for v_student in select st.id,st.nickname,st.avatar from public.enrollments e
    join public.students st on st.id=e.student_id
    where e.class_id=p_class_id and e.status='active' and st.status='active' order by st.nickname loop
    v_code := private.ensure_student_invite(v_student.id,v_uid);
    v_slips := v_slips || jsonb_build_array(jsonb_build_object('nickname',v_student.nickname,
      'avatar',v_student.avatar,'code',v_code));
  end loop;
  return v_slips;
end $$;

create function public.unlock_class_lesson(p_class_id uuid, p_lesson_id text) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare v_uid uuid := private.require_uid();
begin
  if not public.is_staff(p_class_id) then raise exception 'ZM_BLOCK_BR_LP_01'; end if;
  if not exists(select 1 from public.classes c join public.lessons l on c.grade=l.grade
      where c.id=p_class_id and c.status='open' and l.id=p_lesson_id
        and l.current_version is not null) then raise exception 'ZM_INVALID_INPUT'; end if;
  insert into public.class_unlocks(class_id,lesson_id,unlocked_by) values(p_class_id,p_lesson_id,v_uid)
    on conflict (class_id,lesson_id) do nothing;
  return jsonb_build_object('ok',true);
end $$;

create function public.reenroll_class_student(p_class_id uuid, p_student_id uuid) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare v_enrollment uuid; v_name text; v_avatar text;
begin
  perform private.require_uid();
  if not public.is_owner(p_class_id) then raise exception 'ZM_BLOCK_BR_LP_04'; end if;
  perform 1 from public.classes where id=p_class_id and status='open' for update;
  if not found then raise exception 'ZM_INVALID_INPUT'; end if;
  perform 1 from public.students where id=p_student_id and status='active' for update;
  if not found or exists(select 1 from public.enrollments where student_id=p_student_id and status='active') then
    raise exception 'ZM_INVALID_INPUT'; end if;
  select nickname,avatar into v_name,v_avatar from public.students where id=p_student_id;
  if (select count(*) from public.enrollments where class_id=p_class_id and status='active')>=60
    or exists(select 1 from public.enrollments e join public.students s on s.id=e.student_id
      where e.class_id=p_class_id and e.status='active' and (lower(s.nickname)=lower(v_name) or s.avatar=v_avatar))
    then raise exception 'ZM_BLOCK_BR_LP_02'; end if;
  select id into v_enrollment from public.enrollments where class_id=p_class_id and student_id=p_student_id
    and status='left' order by joined_on desc,id desc limit 1 for update;
  if v_enrollment is null then raise exception 'ZM_INVALID_INPUT'; end if;
  update public.enrollments set status='active',left_on=null where id=v_enrollment;
  return jsonb_build_object('ok',true,'enrollment_id',v_enrollment);
end $$;

create function public.transfer_class_student(p_student_id uuid, p_target_class uuid) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare v_source uuid; v_src_enrollment uuid; v_new_enrollment uuid; v_name text; v_avatar text;
begin
  perform private.require_uid();
  select class_id into v_source from public.enrollments where student_id=p_student_id and status='active';
  if v_source is null or v_source=p_target_class or not public.is_owner(v_source) or not public.is_owner(p_target_class)
    then raise exception 'ZM_BLOCK_BR_LP_04'; end if;
  -- Cố định thứ tự khóa hai lớp để tránh deadlock khi chuyển đồng thời.
  perform 1 from public.classes where id in (v_source,p_target_class) order by id for update;
  if (select count(*) from public.classes where id in (v_source,p_target_class) and status='open')<>2
    or (select grade from public.classes where id=v_source)<>(select grade from public.classes where id=p_target_class)
    then raise exception 'ZM_INVALID_INPUT'; end if;
  perform 1 from public.students where id=p_student_id and status='active' for update;
  if not found then raise exception 'ZM_INVALID_INPUT'; end if;
  select id into v_src_enrollment from public.enrollments where student_id=p_student_id and class_id=v_source
    and status='active' for update;
  if v_src_enrollment is null then raise exception 'ZM_INVALID_INPUT'; end if;
  select nickname,avatar into v_name,v_avatar from public.students where id=p_student_id;
  if (select count(*) from public.enrollments where class_id=p_target_class and status='active')>=60
    or exists(select 1 from public.enrollments e join public.students s on s.id=e.student_id
      where e.class_id=p_target_class and e.status='active' and (lower(s.nickname)=lower(v_name) or s.avatar=v_avatar))
    then raise exception 'ZM_BLOCK_BR_LP_02'; end if;
  update public.enrollments set status='left',left_on=(now() at time zone 'Asia/Ho_Chi_Minh')::date
    where id=v_src_enrollment;
  insert into public.enrollments(class_id,student_id) values(p_target_class,p_student_id)
    returning id into v_new_enrollment;
  insert into public.attempts(enrollment_id,lesson_id,version,missions_done,modes_used,program,upgrades,started_at,updated_at)
    select v_new_enrollment,lesson_id,version,missions_done,modes_used,program,upgrades,started_at,updated_at
    from public.attempts where enrollment_id=v_src_enrollment;
  delete from public.device_sessions d using public.class_sessions s
    where d.session_id=s.id and s.class_id=v_source and d.student_id=p_student_id;
  return jsonb_build_object('ok',true,'old_enrollment_id',v_src_enrollment,'enrollment_id',v_new_enrollment);
end $$;

revoke all on function public.set_teacher_class_status(uuid,text), public.invite_class_assistant(uuid,text),
 public.my_class_invitations(), public.respond_class_invitation(uuid,boolean), public.manage_class_staff(uuid,uuid,text),
 public.revoke_class_invitation(uuid), public.class_management_state(uuid), public.class_invite_slips(uuid),
 public.unlock_class_lesson(uuid,text), public.reenroll_class_student(uuid,uuid), public.transfer_class_student(uuid,uuid)
 from public, anon;
grant execute on function public.set_teacher_class_status(uuid,text), public.invite_class_assistant(uuid,text),
 public.my_class_invitations(), public.respond_class_invitation(uuid,boolean), public.manage_class_staff(uuid,uuid,text),
 public.revoke_class_invitation(uuid), public.class_management_state(uuid), public.class_invite_slips(uuid),
 public.unlock_class_lesson(uuid,text), public.reenroll_class_student(uuid,uuid), public.transfer_class_student(uuid,uuid)
 to authenticated;
