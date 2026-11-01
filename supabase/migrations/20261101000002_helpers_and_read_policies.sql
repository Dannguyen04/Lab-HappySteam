-- 0002: hàm trợ giúp quyền + chính sách ĐỌC cơ bản. Ghi trực tiếp chưa mở: sẽ đi qua RPC (du-lieu.md mục 3).
-- Hàm security definer để tránh đệ quy RLS; search_path rỗng để chống chiếm tên.

create function public.is_staff(p_class uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.class_staff s
    where s.class_id = p_class and s.teacher_id = (select auth.uid()) and s.to_date is null)
$$;

create function public.is_owner(p_class uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.class_staff s
    where s.class_id = p_class and s.teacher_id = (select auth.uid()) and s.role = 'owner' and s.to_date is null)
$$;

create function public.is_guardian(p_student uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.guardian_links g
    where g.student_id = p_student and g.guardian_id = (select auth.uid()))
$$;

create function public.device_student() returns uuid
language sql stable security definer set search_path = '' as $$
  select d.student_id from public.device_sessions d
    join public.class_sessions c on c.id = d.session_id
   where d.auth_uid = (select auth.uid()) and c.closed_at is null and c.expires_at > now()
$$;

revoke all on function public.is_staff, public.is_owner, public.is_guardian, public.device_student from public, anon;
grant execute on function public.is_staff, public.is_owner, public.is_guardian, public.device_student to authenticated;

create policy lessons_read on public.lessons for select to authenticated, anon using (true);
create policy lesson_versions_read on public.lesson_versions for select to authenticated, anon using (true);

create policy profiles_self on public.profiles for select to authenticated using (id = (select auth.uid()));
create policy classes_read on public.classes for select to authenticated using (public.is_staff(id));
create policy class_staff_read on public.class_staff for select to authenticated using (public.is_staff(class_id));
create policy class_breaks_read on public.class_breaks for select to authenticated using (public.is_staff(class_id));
create policy class_unlocks_read on public.class_unlocks for select to authenticated using (public.is_staff(class_id));
create policy class_sessions_read on public.class_sessions for select to authenticated using (public.is_staff(class_id));
create policy invite_codes_read on public.invite_codes for select to authenticated
  using (exists (select 1 from public.enrollments e where e.student_id = invite_codes.student_id and public.is_staff(e.class_id)));

create policy enrollments_read on public.enrollments for select to authenticated
  using (public.is_staff(class_id) or public.is_guardian(student_id));
create policy students_read on public.students for select to authenticated
  using (public.is_guardian(id) or exists (select 1 from public.enrollments e where e.student_id = students.id and public.is_staff(e.class_id)));

create policy guardian_links_read on public.guardian_links for select to authenticated using (guardian_id = (select auth.uid()));
create policy consents_read on public.consents for select to authenticated using (guardian_id = (select auth.uid()));

create policy attempts_read on public.attempts for select to authenticated
  using (exists (select 1 from public.enrollments e where e.id = attempts.enrollment_id
    and (public.is_staff(e.class_id) or public.is_guardian(e.student_id) or e.student_id = public.device_student())));
create policy evaluations_read on public.evaluations for select to authenticated
  using (exists (select 1 from public.attempts a join public.enrollments e on e.id = a.enrollment_id
    where a.id = evaluations.attempt_id and (public.is_staff(e.class_id) or public.is_guardian(e.student_id))));

create policy project_groups_read on public.project_groups for select to authenticated using (public.is_staff(class_id));
create policy group_members_read on public.group_members for select to authenticated
  using (exists (select 1 from public.project_groups g where g.id = group_members.group_id and public.is_staff(g.class_id)));
create policy notebook_revisions_read on public.notebook_revisions for select to authenticated
  using (exists (select 1 from public.project_groups g where g.id = notebook_revisions.group_id and public.is_staff(g.class_id)));

-- Chỉ mục cho khoá ngoại hay lọc trong policy
create index on public.class_staff (teacher_id);
create index on public.enrollments (class_id);
create index on public.guardian_links (student_id);
create index on public.attempts (enrollment_id);
create index on public.evaluations (attempt_id);
create index on public.device_sessions (session_id);
