-- 0003: RPC (docs/ba/du-lieu.md mục 3) + trigger luật nghiệp vụ (GD-12, BR-DA-01, BR-DY-01, BR-DY-02).
--
-- Quy ước:
--   * Chặn    = raise exception với message 'ZM_BLOCK_BR_XX_NN' (BRD mục 7). Giao diện đọc error.message.
--   * Cảnh báo = hàm vẫn ghi và trả {"ok":true,"warnings":["BR-XX-NN",...]} để giao diện hỏi lại.
--   * Lỗi không phải luật nghiệp vụ: 'ZM_BLOCK_AUTH' (chưa đăng nhập / chưa có hồ sơ),
--     'ZM_INVALID_INPUT' (dữ liệu sai dạng), 'ZM_NO_FREE_CODE' (hết mã 4 số).
--   * Hàm public: security definer, search_path rỗng, tự kiểm auth.uid(); chỉ role authenticated gọi được
--     (phiên ẩn danh của máy trên lớp cũng là authenticated).
--   * Hàm trợ giúp nội bộ ở schema private (PostgREST không phơi ra; không ai ngoài chủ sở hữu gọi được).

create schema if not exists private;
revoke all on schema private from public;

-- Văn bản điều khoản đồng ý theo phiên bản (BRD 12.6). give_consent sao chép nguyên văn vào consents.terms_text,
-- nên phụ huynh chỉ gửi số phiên bản, không gửi văn bản (không giả mạo được nội dung đã đồng ý).
create table public.consent_terms (
  version text primary key,
  body text not null check (length(body) > 0),
  published_at timestamptz not null default now()
);
alter table public.consent_terms enable row level security;
create policy consent_terms_read on public.consent_terms for select to authenticated using (true);

-- Chỉ mục cho các truy vấn trong hàm/trigger dưới đây
create index consents_active_student on public.consents (student_id) where withdrawn_at is null;
create index group_members_active_student on public.group_members (student_id) where left_on is null;
create index project_groups_class_lesson on public.project_groups (class_id, lesson_id);
create index class_sessions_open_expiry on public.class_sessions (expires_at) where closed_at is null;
create index invite_codes_student on public.invite_codes (student_id);
create index guardian_links_invite on public.guardian_links (invite_code);

-- ---------------------------------------------------------------------------
-- Trợ giúp nội bộ
-- ---------------------------------------------------------------------------

create function private.require_uid() returns uuid
language plpgsql stable set search_path = '' as $$
declare v_uid uuid := (select auth.uid());
begin
  if v_uid is null then
    raise exception 'ZM_BLOCK_AUTH' using errcode = '28000', detail = 'Cần đăng nhập (kể cả phiên ẩn danh của máy).';
  end if;
  return v_uid;
end $$;

-- BRD 6.1: số tuần thứ Hai từ tuần 1 tới p_on (tính cả tuần đầu) trừ số Tuần nghỉ trong khoảng đó.
create function private.current_week(p_class_id uuid, p_on date) returns integer
language sql stable set search_path = '' as $$
  select case
           when p_on < c.week1_monday then 0
           else greatest(0, ((p_on - c.week1_monday) / 7 + 1)
                 - (select count(*)::int from public.class_breaks b
                     where b.class_id = c.id and b.week_monday >= c.week1_monday and b.week_monday <= p_on))
         end
    from public.classes c where c.id = p_class_id
$$;

-- BR-BA-01: bài MỞ ⇔ cùng khối với lớp và (tuần ≤ tuần học hoặc giáo viên đã mở sớm).
create function private.lesson_open(p_class_id uuid, p_lesson_id text, p_on date) returns boolean
language sql stable set search_path = '' as $$
  select exists (
    select 1 from public.lessons l join public.classes c on c.id = p_class_id
     where l.id = p_lesson_id and l.grade = c.grade
       and (l.week <= private.current_week(c.id, p_on)
            or exists (select 1 from public.class_unlocks u where u.class_id = c.id and u.lesson_id = l.id)))
$$;

-- BRD 6.2 / GD-06: chỉ nhiệm vụ kind = 'core' của phiên bản đóng băng. C = 0 → null (không gợi ý).
create function private.suggested_level(p_attempt_id uuid) returns text
language sql stable set search_path = '' as $$
  select case when s.c = 0 then null
              when s.x = s.c then 'HTT'
              when s.x >= ceil(s.c / 2.0) then 'HT'
              else 'CHT' end
    from (select count(*) as c,
                 count(*) filter (where a.missions_done ? (m.item ->> 'code')) as x
            from public.attempts a
            join public.lesson_versions v on v.lesson_id = a.lesson_id and v.version = a.version
            cross join lateral jsonb_array_elements(v.missions) as m(item)
           where a.id = p_attempt_id and m.item ->> 'kind' = 'core') s
$$;

create function private.has_consent(p_student_id uuid) returns boolean
language sql stable set search_path = '' as $$
  select exists (select 1 from public.consents c where c.student_id = p_student_id and c.withdrawn_at is null)
$$;

-- Ai được xem lịch/bài của lớp: staff đang hiệu lực, phụ huynh hoặc máy của một em đang học lớp đó.
create function private.can_view_class(p_class_id uuid) returns boolean
language sql stable set search_path = '' as $$
  select public.is_staff(p_class_id)
      or exists (select 1 from public.enrollments e
                  where e.class_id = p_class_id and e.status = 'active'
                    and (e.student_id = public.device_student() or public.is_guardian(e.student_id)))
$$;

-- Gộp missions_done: hợp các mã, mỗi mã giữ thời điểm sớm nhất (GD-05).
create function private.merge_missions(p_a jsonb, p_b jsonb) returns jsonb
language sql stable set search_path = '' as $$
  select coalesce(jsonb_object_agg(u.k, u.ts), '{}'::jsonb)
    from (select k, min(ts) as ts
            from (select key as k, value::timestamptz as ts from jsonb_each_text(coalesce(p_a, '{}'::jsonb))
                  union all
                  select key, value::timestamptz from jsonb_each_text(coalesce(p_b, '{}'::jsonb))) x
           group by k) u
$$;

-- Buổi hết hạn nhưng chưa đóng: đóng tại thời điểm hết hạn và cho các máy thoát (F-02 bước 4).
create function private.close_expired_sessions() returns void
language sql volatile set search_path = '' as $$
  with closed as (
    update public.class_sessions s set closed_at = s.expires_at
     where s.closed_at is null and s.expires_at <= now()
    returning s.id)
  delete from public.device_sessions d using closed where d.session_id = closed.id
$$;

revoke all on all functions in schema private from public;

-- ---------------------------------------------------------------------------
-- Hồ sơ người có tài khoản (giáo viên / phụ huynh) — gọi sau khi đăng nhập lần đầu
-- ---------------------------------------------------------------------------

-- Tạo hàng profiles cho auth.uid() nếu chưa có; đã có thì giữ nguyên (không đổi tên). Trả về hàng profiles.
-- Phiên ẩn danh (máy trên lớp, JWT is_anonymous = true) không được có hồ sơ: hồ sơ là điều kiện để
-- redeem_invite / mở buổi / chấm, nên máy dùng chung không được tự cấp.
create function public.ensure_profile(p_full_name text) returns public.profiles
language plpgsql volatile security definer set search_path = '' as $$
declare
  v_uid uuid := private.require_uid();
  v_name text := regexp_replace(btrim(p_full_name), '\s+', ' ', 'g');
  v_row public.profiles%rowtype;
begin
  if coalesce((select auth.jwt() ->> 'is_anonymous'), 'false')::boolean then
    raise exception 'ZM_BLOCK_AUTH' using errcode = '28000', detail = 'Phiên ẩn danh không tạo hồ sơ.';
  end if;
  if v_name is null or length(v_name) not between 1 and 80 then
    raise exception 'ZM_INVALID_INPUT' using errcode = '22023', detail = 'Họ tên 1–80 ký tự.';
  end if;
  insert into public.profiles (id, full_name) values (v_uid, v_name)
  on conflict (id) do nothing;
  select p.* into v_row from public.profiles p where p.id = v_uid;
  return v_row;
end $$;

-- ---------------------------------------------------------------------------
-- Lịch tuần
-- ---------------------------------------------------------------------------

create function public.current_week(p_class_id uuid, p_on date default current_date) returns integer
language plpgsql stable security definer set search_path = '' as $$
begin
  perform private.require_uid();
  if not private.can_view_class(p_class_id) then
    raise exception 'ZM_BLOCK_BR_LP_01' using detail = 'Không có quyền xem lớp này.';
  end if;
  return private.current_week(p_class_id, p_on);
end $$;

create function public.lesson_open(p_class_id uuid, p_lesson_id text) returns boolean
language plpgsql stable security definer set search_path = '' as $$
begin
  perform private.require_uid();
  if not private.can_view_class(p_class_id) then
    raise exception 'ZM_BLOCK_BR_LP_01' using detail = 'Không có quyền xem lớp này.';
  end if;
  return private.lesson_open(p_class_id, p_lesson_id, current_date);
end $$;

create function public.suggested_level(p_attempt_id uuid) returns text
language plpgsql stable security definer set search_path = '' as $$
declare v_class uuid; v_student uuid;
begin
  perform private.require_uid();
  select e.class_id, e.student_id into v_class, v_student
    from public.attempts a join public.enrollments e on e.id = a.enrollment_id
   where a.id = p_attempt_id;
  if not found or not (public.is_staff(v_class) or public.is_guardian(v_student)
                       or coalesce(v_student = public.device_student(), false)) then
    raise exception 'ZM_BLOCK_BR_LP_01' using detail = 'Không có quyền xem bài làm này.';
  end if;
  return private.suggested_level(p_attempt_id);
end $$;

-- ---------------------------------------------------------------------------
-- Buổi học (F-02)
-- ---------------------------------------------------------------------------

create function public.open_session(p_class_id uuid) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare
  v_uid uuid := private.require_uid();
  v_code text;
  v_id uuid;
  v_expires timestamptz;
  v_try int := 0;
begin
  if not public.is_staff(p_class_id) then
    raise exception 'ZM_BLOCK_BR_LP_01' using detail = 'Chỉ giáo viên đang phân công của lớp mới mở buổi học.';
  end if;
  perform private.close_expired_sessions();   -- giải phóng mã của buổi đã hết hạn
  loop
    v_code := lpad(floor(random() * 10000)::int::text, 4, '0');
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
                            'expires_at', v_expires, 'warnings', '[]'::jsonb);
end $$;

create function public.join_session(p_code text, p_student_id uuid) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare
  v_uid uuid := private.require_uid();
  v_session public.class_sessions%rowtype;
  v_other boolean;
begin
  select s.* into v_session from public.class_sessions s
   where s.join_code = btrim(p_code) and s.closed_at is null;
  -- Hết hạn = coi như đã đóng. (Không ghi closed_at ở đây vì raise sẽ rollback; open_session dọn,
  -- và device_student() đã bỏ qua buổi hết hạn.)
  if not found or v_session.expires_at <= now() then
    raise exception 'ZM_BLOCK_BR_BH_01' using detail = 'Mã buổi học đã đóng hoặc hết hạn.';
  end if;
  if not exists (select 1 from public.enrollments e join public.students st on st.id = e.student_id
                  where e.student_id = p_student_id and e.class_id = v_session.class_id
                    and e.status = 'active' and st.status = 'active') then
    raise exception 'ZM_BLOCK_BR_BA_02' using detail = 'Em không có ghi danh đang học trong lớp của buổi này.';
  end if;

  v_other := exists (select 1 from public.device_sessions d
                      where d.session_id = v_session.id and d.student_id = p_student_id and d.auth_uid <> v_uid);

  insert into public.device_sessions (auth_uid, session_id, student_id)
  values (v_uid, v_session.id, p_student_id)
  on conflict (auth_uid) do update
    set session_id = excluded.session_id, student_id = excluded.student_id, started_at = now();

  return jsonb_build_object('ok', true, 'session_id', v_session.id, 'expires_at', v_session.expires_at,
           'warnings', case when v_other then '["BR-BH-02"]'::jsonb else '[]'::jsonb end);
end $$;

create function public.close_session(p_session_id uuid) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare v_class uuid;
begin
  perform private.require_uid();
  select s.class_id into v_class from public.class_sessions s where s.id = p_session_id for update;
  if not found or not public.is_staff(v_class) then
    raise exception 'ZM_BLOCK_BR_LP_01' using detail = 'Chỉ giáo viên của lớp mới đóng buổi học.';
  end if;
  update public.class_sessions s set closed_at = coalesce(s.closed_at, now()) where s.id = p_session_id;
  delete from public.device_sessions d where d.session_id = p_session_id;
  return jsonb_build_object('ok', true, 'warnings', '[]'::jsonb);
end $$;

-- ---------------------------------------------------------------------------
-- Bài làm (F-04, F-09)
-- ---------------------------------------------------------------------------

-- p_missions: mảng mã ["m1","m2"] (thời điểm = now()) hoặc đối tượng {"m1":"2026-11-04T08:12:00Z"}
-- (máy gửi lại sau khi mất mạng — GD-13; thời điểm tương lai bị kẹp về now()). Mã không có trong
-- phiên bản đóng băng bị bỏ qua. p_program / p_upgrades null = giữ bản cũ; gửi giá trị = ghi đè.
create function public.save_attempt(
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
begin
  if p_mode is not null and p_mode not in ('kid', 'pro') then
    raise exception 'ZM_INVALID_INPUT' using errcode = '22023', detail = 'mode phải là kid hoặc pro.';
  end if;
  -- coalesce: device_student() là null khi máy không ở buổi nào → so sánh ra null, "not null" sẽ bỏ qua chặn.
  if not (coalesce(p_student_id = public.device_student(), false) or public.is_guardian(p_student_id)) then
    raise exception 'ZM_BLOCK_BR_PH_02' using detail = 'Chỉ máy đang là em này (trong buổi học) hoặc phụ huynh của em mới lưu được.';
  end if;

  select e.id, e.class_id into v_enrollment, v_class
    from public.enrollments e join public.students st on st.id = e.student_id
   where e.student_id = p_student_id and e.status = 'active' and st.status = 'active';
  if not found then
    raise exception 'ZM_BLOCK_BR_BA_02' using detail = 'Em không còn ghi danh đang học.';
  end if;
  if not private.lesson_open(v_class, p_lesson_id, current_date) then
    raise exception 'ZM_BLOCK_BR_BA_01' using detail = 'Bài đang khoá với lớp này.';
  end if;

  -- Đóng băng phiên bản: Bài làm đã có giữ phiên bản cũ; chưa có thì lấy phiên bản hiện hành.
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

  -- Một câu upsert: hai máy lưu cùng lúc sẽ tuần tự hoá trên khoá dòng, không mất nhiệm vụ (GD-05, BR-BL-01).
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

create function public.remove_mission(p_attempt_id uuid, p_code text) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare v_class uuid; v_done jsonb;
begin
  perform private.require_uid();
  select e.class_id into v_class
    from public.attempts a join public.enrollments e on e.id = a.enrollment_id
   where a.id = p_attempt_id;
  if not found or not public.is_staff(v_class) then
    raise exception 'ZM_BLOCK_BR_BL_03' using detail = 'Chỉ giáo viên của lớp mới gỡ được nhiệm vụ.';
  end if;
  update public.attempts a set missions_done = a.missions_done - p_code, updated_at = now()
   where a.id = p_attempt_id
  returning a.missions_done into v_done;
  return jsonb_build_object('ok', true, 'missions_done', v_done, 'warnings', '[]'::jsonb);
end $$;

-- ---------------------------------------------------------------------------
-- Đánh giá (F-06)
-- ---------------------------------------------------------------------------

create function public.grade(p_attempt_id uuid, p_level text, p_comment text default null) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare
  v_uid uuid := private.require_uid();
  v_class uuid; v_student uuid; v_status text;
  v_comment text := nullif(btrim(p_comment), '');
  v_sugg text;
  v_id uuid;
begin
  select e.class_id, e.student_id, e.status into v_class, v_student, v_status
    from public.attempts a join public.enrollments e on e.id = a.enrollment_id
   where a.id = p_attempt_id;
  if not found or not public.is_staff(v_class) then
    raise exception 'ZM_BLOCK_BR_LP_01' using detail = 'Chỉ giáo viên đang phân công của lớp mới chấm.';
  end if;
  if p_level is null or p_level not in ('HTT', 'HT', 'CHT') then
    raise exception 'ZM_BLOCK_BR_DG_02' using detail = 'Đánh giá phải có mức HTT / HT / CHT.';
  end if;
  if v_status <> 'active' then
    raise exception 'ZM_BLOCK_BR_DG_03' using detail = 'Bài làm thuộc ghi danh đã rời.';
  end if;
  if v_comment is not null and not private.has_consent(v_student) then
    raise exception 'ZM_BLOCK_BR_DY_02' using detail = 'Chờ phụ huynh đồng ý: chỉ lưu được mức, chưa lưu nhận xét.';
  end if;
  if length(v_comment) > 500 then
    raise exception 'ZM_INVALID_INPUT' using errcode = '22023', detail = 'Nhận xét tối đa 500 ký tự.';
  end if;

  v_sugg := private.suggested_level(p_attempt_id);
  insert into public.evaluations (attempt_id, level, suggested_level, comment, graded_by, source)
  values (p_attempt_id, p_level, v_sugg, v_comment, v_uid, 'direct')
  returning id into v_id;

  return jsonb_build_object('ok', true, 'evaluation_id', v_id, 'suggested_level', v_sugg,
           'warnings', case when v_sugg is not null and v_sugg <> p_level then '["BR-DG-01"]'::jsonb
                            else '[]'::jsonb end);
end $$;

-- Chép mức (+ nhận xét) cho từng thành viên chưa rời nhóm, source = 'group' (F-06 bước 4, BRD 9).
-- Thành viên chưa có Bài làm cho bài dự án: tạo Bài làm rỗng (phiên bản hiện hành) để gắn đánh giá.
-- Thành viên có ghi danh đã rời: bỏ qua (BR-DG-03), liệt kê trong "skipped".
-- Thành viên chưa có đồng ý: chỉ chép mức, không chép nhận xét (BR-DY-02), kèm cảnh báo "BR-DY-02".
create function public.grade_group(p_group_id uuid, p_level text, p_comment text default null) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare
  v_uid uuid := private.require_uid();
  v_class uuid; v_lesson text; v_current int;
  v_comment text := nullif(btrim(p_comment), '');
  r record;
  v_attempt uuid; v_sugg text;
  v_graded int := 0;
  v_skipped uuid[] := '{}';
  v_comment_dropped boolean := false;
  v_differs boolean := false;
  v_warnings jsonb := '[]'::jsonb;
begin
  select g.class_id, g.lesson_id into v_class, v_lesson from public.project_groups g where g.id = p_group_id;
  if not found or not public.is_staff(v_class) then
    raise exception 'ZM_BLOCK_BR_LP_01' using detail = 'Chỉ giáo viên đang phân công của lớp mới chấm.';
  end if;
  if p_level is null or p_level not in ('HTT', 'HT', 'CHT') then
    raise exception 'ZM_BLOCK_BR_DG_02' using detail = 'Đánh giá phải có mức HTT / HT / CHT.';
  end if;
  if length(v_comment) > 500 then
    raise exception 'ZM_INVALID_INPUT' using errcode = '22023', detail = 'Nhận xét tối đa 500 ký tự.';
  end if;
  select l.current_version into v_current from public.lessons l where l.id = v_lesson;

  for r in
    select m.student_id, e.id as enrollment_id
      from public.group_members m
      left join public.enrollments e
        on e.student_id = m.student_id and e.class_id = v_class and e.status = 'active'
     where m.group_id = p_group_id and m.left_on is null
  loop
    if r.enrollment_id is null then
      v_skipped := v_skipped || r.student_id;
      continue;
    end if;
    select a.id into v_attempt from public.attempts a
     where a.enrollment_id = r.enrollment_id and a.lesson_id = v_lesson;
    if v_attempt is null then
      if v_current is null then
        v_skipped := v_skipped || r.student_id;
        continue;
      end if;
      insert into public.attempts as a (enrollment_id, lesson_id, version)
      values (r.enrollment_id, v_lesson, v_current)
      on conflict (enrollment_id, lesson_id) do update set updated_at = a.updated_at
      returning a.id into v_attempt;
    end if;

    if v_comment is not null and not private.has_consent(r.student_id) then
      v_comment_dropped := true;
    end if;
    v_sugg := private.suggested_level(v_attempt);
    if v_sugg is not null and v_sugg <> p_level then v_differs := true; end if;

    insert into public.evaluations (attempt_id, level, suggested_level, comment, graded_by, source)
    values (v_attempt, p_level, v_sugg,
            case when private.has_consent(r.student_id) then v_comment end, v_uid, 'group');
    v_graded := v_graded + 1;
  end loop;

  if v_differs then v_warnings := v_warnings || '"BR-DG-01"'::jsonb; end if;
  if v_comment_dropped then v_warnings := v_warnings || '"BR-DY-02"'::jsonb; end if;
  return jsonb_build_object('ok', true, 'graded', v_graded, 'skipped', to_jsonb(v_skipped), 'warnings', v_warnings);
end $$;

-- ---------------------------------------------------------------------------
-- Phụ huynh (F-03)
-- ---------------------------------------------------------------------------

create function public.redeem_invite(p_code text) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare
  v_uid uuid := private.require_uid();
  v_invite public.invite_codes%rowtype;
begin
  if not exists (select 1 from public.profiles p where p.id = v_uid) then
    raise exception 'ZM_BLOCK_AUTH' using errcode = '28000', detail = 'Cần tài khoản phụ huynh (email), không dùng phiên ẩn danh.';
  end if;
  select i.* into v_invite from public.invite_codes i
   where i.code = upper(btrim(p_code)) for update;
  if not found or v_invite.status <> 'valid'
     or not exists (select 1 from public.students s where s.id = v_invite.student_id and s.status = 'active') then
    raise exception 'ZM_BLOCK_BR_PH_01' using detail = 'Mã mời không đúng hoặc đã thu hồi.';
  end if;

  if exists (select 1 from public.guardian_links g where g.guardian_id = v_uid and g.student_id = v_invite.student_id) then
    return jsonb_build_object('ok', true, 'student_id', v_invite.student_id, 'already_linked', true,
                              'warnings', '[]'::jsonb);
  end if;

  -- Trigger guardian_links_max_two bảo đảm GD-12 (kể cả khi hai phụ huynh nhập mã cùng lúc).
  insert into public.guardian_links (guardian_id, student_id, invite_code)
  values (v_uid, v_invite.student_id, v_invite.code);
  update public.invite_codes i set uses = i.uses + 1 where i.code = v_invite.code;

  return jsonb_build_object('ok', true, 'student_id', v_invite.student_id, 'already_linked', false,
                            'warnings', '[]'::jsonb);
end $$;

create function public.give_consent(p_student_id uuid, p_full_name text, p_birth_date date, p_terms_version text)
returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare
  v_uid uuid := private.require_uid();
  v_name text := regexp_replace(btrim(p_full_name), '\s+', ' ', 'g');   -- BRD 8: bỏ khoảng trắng thừa
  v_terms text;
begin
  if not public.is_guardian(p_student_id) then
    raise exception 'ZM_BLOCK_BR_PH_02' using detail = 'Chỉ phụ huynh đã liên kết với em.';
  end if;
  if v_name is null or length(v_name) not between 1 and 60 then
    raise exception 'ZM_INVALID_INPUT' using errcode = '22023', detail = 'Họ tên 1–60 ký tự.';
  end if;
  if p_birth_date is not null and p_birth_date > current_date then
    raise exception 'ZM_INVALID_INPUT' using errcode = '22023', detail = 'Ngày sinh không hợp lệ.';
  end if;
  select t.body into v_terms from public.consent_terms t where t.version = p_terms_version;
  if not found then
    raise exception 'ZM_INVALID_INPUT' using errcode = '22023', detail = 'Phiên bản điều khoản không tồn tại.';
  end if;

  -- Khoá dòng học sinh: tuần tự hoá với withdraw_consent của phụ huynh kia.
  perform 1 from public.students s where s.id = p_student_id for no key update;

  insert into public.consents (student_id, guardian_id, terms_version, terms_text)
  select p_student_id, v_uid, p_terms_version, v_terms
   where not exists (select 1 from public.consents c
                      where c.student_id = p_student_id and c.guardian_id = v_uid
                        and c.terms_version = p_terms_version and c.withdrawn_at is null);

  update public.students s set full_name = v_name, birth_date = coalesce(p_birth_date, s.birth_date)
   where s.id = p_student_id;

  return jsonb_build_object('ok', true, 'consent_active', true, 'warnings', '[]'::jsonb);
end $$;

create function public.withdraw_consent(p_student_id uuid) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare
  v_uid uuid := private.require_uid();
  v_active boolean;
begin
  if not public.is_guardian(p_student_id) then
    raise exception 'ZM_BLOCK_BR_PH_02' using detail = 'Chỉ phụ huynh đã liên kết với em.';
  end if;
  perform 1 from public.students s where s.id = p_student_id for no key update;

  update public.consents c set withdrawn_at = now()
   where c.student_id = p_student_id and c.guardian_id = v_uid and c.withdrawn_at is null;

  v_active := private.has_consent(p_student_id);
  if not v_active then
    -- Về CHƯA (BRD mục 3): xoá dữ liệu định danh và mọi nhận xét (kể cả lịch sử); giữ tiến độ và mức.
    update public.students s set full_name = null, birth_date = null where s.id = p_student_id;
    update public.evaluations ev set comment = null
      from public.attempts a join public.enrollments e on e.id = a.enrollment_id
     where ev.attempt_id = a.id and e.student_id = p_student_id and ev.comment is not null;
  end if;
  return jsonb_build_object('ok', true, 'consent_active', v_active, 'warnings', '[]'::jsonb);
end $$;

-- ---------------------------------------------------------------------------
-- Trigger: luật phải đúng cả khi ghi không qua RPC (khoá dịch vụ, chính sách ghi sau này)
-- ---------------------------------------------------------------------------

-- GD-12 / BR-PH-01: tối đa 2 phụ huynh mỗi em.
create function private.trg_guardian_links_max_two() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  perform 1 from public.students s where s.id = new.student_id for no key update;   -- tuần tự hoá theo em
  if (select count(*) from public.guardian_links g
       where g.student_id = new.student_id and g.guardian_id <> new.guardian_id) >= 2 then
    raise exception 'ZM_BLOCK_BR_PH_01' using detail = 'Em đã có đủ 2 phụ huynh liên kết (GD-12).';
  end if;
  return new;
end $$;
create trigger guardian_links_max_two
  before insert or update of student_id, guardian_id on public.guardian_links
  for each row execute function private.trg_guardian_links_max_two();

-- BR-DA-01: một em không ở hai nhóm (đang tham gia) của cùng một đợt dự án (cùng lớp + cùng bài dự án).
create function private.trg_group_members_one_per_round() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.left_on is not null then
    return new;
  end if;
  perform 1 from public.students s where s.id = new.student_id for no key update;
  if exists (
    select 1
      from public.group_members m
      join public.project_groups g on g.id = m.group_id
      join public.project_groups ng on ng.id = new.group_id
     where m.student_id = new.student_id and m.left_on is null
       and g.class_id = ng.class_id and g.lesson_id = ng.lesson_id
       and not (tg_op = 'UPDATE' and m.group_id = old.group_id
                and m.student_id = old.student_id and m.joined_on = old.joined_on)) then
    raise exception 'ZM_BLOCK_BR_DA_01' using detail = 'Em đang ở một nhóm khác của cùng đợt dự án.';
  end if;
  return new;
end $$;
create trigger group_members_one_per_round
  before insert or update of group_id, student_id, left_on on public.group_members
  for each row execute function private.trg_group_members_one_per_round();

-- BR-DY-01: họ tên đầy đủ / ngày sinh chỉ lưu khi có đồng ý còn hiệu lực. Xoá (đặt null) luôn được.
create function private.trg_students_identity_consent() returns trigger
language plpgsql security definer set search_path = '' as $$
declare v_changed boolean;
begin
  if tg_op = 'INSERT' then
    v_changed := new.full_name is not null or new.birth_date is not null;
  else
    v_changed := (new.full_name is not null and new.full_name is distinct from old.full_name)
              or (new.birth_date is not null and new.birth_date is distinct from old.birth_date);
  end if;
  if v_changed and not private.has_consent(new.id) then
    raise exception 'ZM_BLOCK_BR_DY_01' using detail = 'Chưa có đồng ý của phụ huynh: không lưu họ tên đầy đủ / ngày sinh.';
  end if;
  return new;
end $$;
create trigger students_identity_consent
  before insert or update of full_name, birth_date on public.students
  for each row execute function private.trg_students_identity_consent();

-- BR-DY-02: nhận xét chỉ lưu khi em có đồng ý còn hiệu lực.
create function private.trg_evaluations_comment_consent() returns trigger
language plpgsql security definer set search_path = '' as $$
declare v_student uuid;
begin
  if nullif(btrim(new.comment), '') is null then
    return new;
  end if;
  if tg_op = 'UPDATE' and new.comment is not distinct from old.comment then
    return new;
  end if;
  select e.student_id into v_student
    from public.attempts a join public.enrollments e on e.id = a.enrollment_id
   where a.id = new.attempt_id;
  if not private.has_consent(v_student) then
    raise exception 'ZM_BLOCK_BR_DY_02' using detail = 'Chưa có đồng ý của phụ huynh: không lưu nhận xét.';
  end if;
  return new;
end $$;
create trigger evaluations_comment_consent
  before insert or update of comment on public.evaluations
  for each row execute function private.trg_evaluations_comment_consent();

revoke all on all functions in schema private from public;

-- ---------------------------------------------------------------------------
-- Quyền gọi: không cho public/anon; chỉ authenticated (gồm phiên ẩn danh của máy).
-- ---------------------------------------------------------------------------

revoke all on function
  public.ensure_profile(text),
  public.current_week(uuid, date),
  public.lesson_open(uuid, text),
  public.suggested_level(uuid),
  public.open_session(uuid),
  public.join_session(text, uuid),
  public.close_session(uuid),
  public.save_attempt(uuid, text, jsonb, jsonb, jsonb, text),
  public.remove_mission(uuid, text),
  public.grade(uuid, text, text),
  public.grade_group(uuid, text, text),
  public.redeem_invite(text),
  public.give_consent(uuid, text, date, text),
  public.withdraw_consent(uuid)
from public, anon;

grant execute on function
  public.ensure_profile(text),
  public.current_week(uuid, date),
  public.lesson_open(uuid, text),
  public.suggested_level(uuid),
  public.open_session(uuid),
  public.join_session(text, uuid),
  public.close_session(uuid),
  public.save_attempt(uuid, text, jsonb, jsonb, jsonb, text),
  public.remove_mission(uuid, text),
  public.grade(uuid, text, text),
  public.grade_group(uuid, text, text),
  public.redeem_invite(text),
  public.give_consent(uuid, text, date, text),
  public.withdraw_consent(uuid)
to authenticated;
