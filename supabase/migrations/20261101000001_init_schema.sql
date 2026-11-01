-- 0001: lược đồ ban đầu theo docs/ba/du-lieu.md (bản nháp 0.1). CHƯA chạy thử trên DB thật.
-- RPC (mục 3) và trigger (GD-12, BR-DA-01, BR-DY-01/02) sẽ ở migration sau.

-- Người dùng có tài khoản (giáo viên, phụ huynh)
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  full_name text not null check (length(full_name) between 1 and 80),
  created_at timestamptz not null default now()
);

-- Nội dung chương trình (đồng bộ từ js/catalog.js + content/ khi phát hành, chỉ đội phát triển ghi)
create table lessons (
  id text primary key,                                  -- 'lop1-bai09'
  grade smallint not null, term smallint not null, week smallint not null,
  title text not null,
  type text not null check (type in ('model', 'project', 'showcase', 'theory', 'test')),
  current_version int,                                  -- null = "Sắp có"
  unique (grade, week)
);
create table lesson_versions (
  lesson_id text references lessons,
  version int,
  missions jsonb not null,                              -- [{"code":"m1","title":"…","kind":"core|pro"}]
  released_at timestamptz not null default now(),
  primary key (lesson_id, version)
);

create table classes (
  id uuid primary key default gen_random_uuid(),
  name text not null,                                   -- "1A – 2026"
  grade smallint not null check (grade in (1, 3)),
  school_year text not null,                            -- "2026-2027"
  org_id uuid,                                          -- để trống trong MVP (BRD 11)
  week1_monday date not null check (extract(isodow from week1_monday) = 1),
  status text not null default 'open' check (status in ('open', 'ended')),
  created_at timestamptz not null default now()
);

-- Thực thể nối theo thời gian Giáo viên ↔ Lớp (GD-01)
create table class_staff (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references classes on delete cascade,
  teacher_id uuid not null references profiles,
  role text not null check (role in ('owner', 'assistant')),
  from_date date not null default current_date,
  to_date date                                          -- null = đang hiệu lực
);
create unique index one_active_owner on class_staff (class_id) where role = 'owner' and to_date is null;
create unique index one_active_role on class_staff (class_id, teacher_id) where to_date is null;

create table class_breaks (                             -- Tuần nghỉ
  class_id uuid references classes on delete cascade,
  week_monday date check (extract(isodow from week_monday) = 1),
  note text,
  primary key (class_id, week_monday)
);

create table class_unlocks (                            -- Giáo viên mở sớm một bài (mục 4 BRD)
  class_id uuid references classes on delete cascade,
  lesson_id text references lessons,
  unlocked_by uuid not null references profiles,
  unlocked_at timestamptz not null default now(),
  primary key (class_id, lesson_id)
);

create table students (
  id uuid primary key default gen_random_uuid(),
  nickname text not null check (length(nickname) between 1 and 12),
  avatar text not null,                                 -- mã con vật, không trùng trong lớp (kiểm ở F-01)
  full_name text check (length(full_name) <= 60),       -- chỉ khi có đồng ý (BR-DY-01, trigger)
  birth_date date,                                      -- chỉ khi có đồng ý
  status text not null default 'active' check (status in ('active', 'deleted')),
  created_at timestamptz not null default now()
);

-- Thực thể nối theo thời gian Học sinh ↔ Lớp
create table enrollments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students on delete cascade,
  class_id uuid not null references classes on delete cascade,
  joined_on date not null default current_date,
  left_on date,
  status text not null default 'active' check (status in ('active', 'left'))
);
create unique index one_active_enrollment on enrollments (student_id) where status = 'active';  -- GD-04

create table invite_codes (
  code text primary key check (code ~ '^[A-HJ-NP-Z2-9]{8}$'),   -- bỏ 0/O, 1/I/L
  student_id uuid not null references students on delete cascade,
  created_by uuid not null references profiles,
  status text not null default 'valid' check (status in ('valid', 'revoked')),
  uses int not null default 0
);

create table guardian_links (
  guardian_id uuid references profiles on delete cascade,
  student_id uuid references students on delete cascade,
  invite_code text references invite_codes,
  linked_at timestamptz not null default now(),
  primary key (guardian_id, student_id)
);                                                      -- tối đa 2 phụ huynh / em: trigger (GD-12)

create table consents (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students on delete cascade,
  guardian_id uuid not null references profiles,
  terms_version text not null,
  terms_text text not null,                             -- sao chép nguyên văn lúc đồng ý
  agreed_at timestamptz not null default now(),
  withdrawn_at timestamptz
);

create table class_sessions (                           -- Buổi học
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references classes on delete cascade,
  join_code char(4) not null check (join_code ~ '^[0-9]{4}$'),
  opened_by uuid not null references profiles,
  opened_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '90 minutes',  -- GD-11
  closed_at timestamptz
);
create unique index active_join_code on class_sessions (join_code) where closed_at is null;
-- mã hết hạn nhưng chưa đóng: join_session() coi như đã đóng và đóng luôn

create table device_sessions (                          -- máy (phiên ẩn danh) đang là em nào
  auth_uid uuid primary key,
  session_id uuid not null references class_sessions on delete cascade,
  student_id uuid not null references students,
  started_at timestamptz not null default now()
);


-- Thực thể nối theo thời gian Ghi danh × Bài
create table attempts (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references enrollments on delete cascade,
  lesson_id text not null,
  version int not null,                                 -- đóng băng lúc mở bài lần đầu
  missions_done jsonb not null default '{}',            -- {"m1":"2026-11-04T08:12:00Z", …} chỉ thêm (GD-05)
  modes_used text[] not null default '{}',              -- {'kid','pro'}
  program jsonb,                                        -- chương trình khối lệnh gần nhất
  upgrades jsonb,                                       -- gói sáng tạo đã chọn
  started_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (lesson_id, version) references lesson_versions,
  unique (enrollment_id, lesson_id)
);

create table evaluations (                              -- giữ lịch sử: lần chấm sau là bản ghi mới
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references attempts on delete cascade,
  level text not null check (level in ('HTT', 'HT', 'CHT')),       -- BR-DG-02
  suggested_level text check (suggested_level in ('HTT', 'HT', 'CHT')),  -- sao chép lúc chấm
  comment text check (length(comment) <= 500),          -- chỉ khi có đồng ý (BR-DY-02, trigger)
  graded_by uuid not null references profiles,
  graded_at timestamptz not null default now(),
  source text not null default 'direct' check (source in ('direct', 'group'))
);
create view current_evaluations with (security_invoker = true) as
  select distinct on (attempt_id) * from evaluations order by attempt_id, graded_at desc;

create table project_groups (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references classes on delete cascade,
  lesson_id text not null references lessons,           -- tuần mở đầu đợt dự án
  name text not null,
  created_by_kind text not null check (created_by_kind in ('teacher', 'student')),
  status text not null default 'working' check (status in ('working', 'submitted'))
);
create table group_members (
  group_id uuid references project_groups on delete cascade,
  student_id uuid references students,
  role text,
  joined_on date not null default current_date,
  left_on date,
  primary key (group_id, student_id, joined_on)
);                                                      -- BR-DA-01: trigger chặn em ở 2 nhóm cùng đợt
create table notebook_revisions (                       -- Sổ dự án = bản mới nhất; GD-07 bản sau thắng
  id bigint generated always as identity primary key,
  group_id uuid not null references project_groups on delete cascade,
  stage text not null check (stage in ('idea', 'build', 'poster', 'share')),
  content jsonb not null,
  saved_by_student uuid references students,
  saved_at timestamptz not null default now()
);

-- RLS bật cho mọi bảng. Chưa có policy = từ chối hết (an toàn mặc định).
alter table public.profiles enable row level security;
alter table public.lessons enable row level security;
alter table public.lesson_versions enable row level security;
alter table public.classes enable row level security;
alter table public.class_staff enable row level security;
alter table public.class_breaks enable row level security;
alter table public.class_unlocks enable row level security;
alter table public.students enable row level security;
alter table public.enrollments enable row level security;
alter table public.invite_codes enable row level security;
alter table public.guardian_links enable row level security;
alter table public.consents enable row level security;
alter table public.class_sessions enable row level security;
alter table public.device_sessions enable row level security;
alter table public.attempts enable row level security;
alter table public.evaluations enable row level security;
alter table public.project_groups enable row level security;
alter table public.group_members enable row level security;
alter table public.notebook_revisions enable row level security;
