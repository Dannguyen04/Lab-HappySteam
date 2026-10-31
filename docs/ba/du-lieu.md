# Thiết kế dữ liệu — bước 7 (tài khoản & dữ liệu tập trung)

Bản nháp 0.1 · 2026-10-31 · Claude. Cài đặt BRD (`docs/ba/BRD.md`) trên Supabase (Postgres + Auth + RLS).
Mã GD-xx, BR-xx, F-xx tham chiếu BRD. Tên bảng/cột viết tiếng Anh cho mã; ghi chú tiếng Việt.

## 1. Danh tính — ai là `auth.uid()`

| Người | Cách đăng nhập | Quyền đến từ |
|---|---|---|
| Giáo viên | Email (magic link hoặc Google) | `class_staff` (chủ lớp / phụ, đang hiệu lực) |
| Phụ huynh | Email (magic link hoặc Google) | `guardian_links` |
| Học sinh trên lớp | **Phiên ẩn danh** (anonymous sign-in) của máy | `device_sessions`: máy đã vào Buổi học + chọn tên (F-02) |
| Học sinh ở nhà | Dùng phiên của phụ huynh, giao diện "chế độ con" | `guardian_links` (F-03 bước 4) |

Một người có thể vừa là giáo viên vừa là phụ huynh → chỉ một bảng `profiles`, vai trò suy ra từ quan hệ, **không** có cột `role`.

> **Vì sao học sinh không có tài khoản (GD-03).** Trẻ Lớp 1 không nhớ mật khẩu. Máy trên lớp dùng phiên ẩn danh gắn tạm với một em qua Buổi học; buổi đóng thì xoá `device_sessions` → máy mất quyền (F-02 bước 4).

## 2. Bảng

```sql
-- Người dùng có tài khoản (giáo viên, phụ huynh)
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  full_name text not null check (length(full_name) between 1 and 80),
  created_at timestamptz not null default now()
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
create view current_evaluations as
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
```

## 3. Hàm (RPC, `security definer`, kiểm quyền bên trong)

| Hàm | Làm gì | Luật |
|---|---|---|
| `current_week(class_id, on date)` | Tuần học theo BRD 6.1 (trừ `class_breaks`) | — |
| `lesson_open(class_id, lesson_id)` | `week ≤ current_week` hoặc có `class_unlocks` | BR-BA-01 |
| `suggested_level(attempt_id)` | BRD 6.2 từ `missions` của phiên bản đóng băng | GD-06 |
| `open_session(class_id)` | Tạo mã 4 số chưa trùng, trả mã | BR-LP-01 |
| `join_session(code, student_id)` | Kiểm buổi còn hạn + em có ghi danh active trong lớp đó → ghi `device_sessions` cho `auth.uid()`; trả cảnh báo nếu em đang ở máy khác | BR-BH-01 (chặn), BR-BH-02 (cảnh báo) |
| `close_session(id)` | Đặt `closed_at`, xoá `device_sessions` của buổi | F-02 bước 4 |
| `save_attempt(student_id, lesson_id, missions, program, upgrades, mode)` | Tạo nếu chưa có (đóng băng `current_version`); **gộp** `missions_done` (giữ thời điểm sớm nhất); ghi đè program/upgrades | GD-05, BR-BL-01 |
| `remove_mission(attempt_id, code)` | Chỉ giáo viên của lớp | BR-BL-03 |
| `grade(attempt_id, level, comment)` | Chép `suggested_level`, trả cảnh báo nếu khác gợi ý; chặn comment khi chưa đồng ý | BR-DG-01/02/03, BR-DY-02 |
| `grade_group(group_id, level, comment)` | Chép cho thành viên chưa rời (`left_on is null`), `source='group'` | F-06 bước 4 |
| `redeem_invite(code)` | Tạo `guardian_links`; chặn mã thu hồi / đủ 2 phụ huynh | BR-PH-01 |
| `give_consent(student_id, full_name, birth_date, terms_version)` | Ghi `consents` + điền `students.full_name` | F-03 bước 2 |
| `withdraw_consent(student_id)` | Rút; nếu không còn đồng ý nào → xoá full_name, birth_date, mọi `evaluations.comment` | Mục 3 BRD |

**Chặn vs cảnh báo:** hàm *chặn* bằng `raise exception` với mã lỗi riêng (`ZM_BLOCK_BR_BH_01`…); *cảnh báo* trả `{"ok":true,"warnings":["BR-BH-02"]}` để giao diện hỏi lại. Đây là hai loại khác nhau, không cài giống nhau (BRD mục 7).

## 4. Phân quyền hàng (RLS) — tóm tắt

Hàm trợ giúp: `is_staff(class_id)`, `is_owner(class_id)`, `is_guardian(student_id)`, `device_student()` (em gắn với `auth.uid()` qua buổi còn hiệu lực).

| Bảng | Đọc | Ghi trực tiếp |
|---|---|---|
| classes, class_breaks, class_unlocks | staff của lớp | owner (classes, breaks); staff (unlocks) |
| class_staff | staff của lớp | owner (mời/gỡ); assistant tự đặt `to_date` của mình |
| students, enrollments | staff của lớp có ghi danh; phụ huynh của em; máy: chỉ `nickname, avatar` của em cùng buổi (view `session_roster`) | owner |
| invite_codes | staff | owner |
| guardian_links, consents | phụ huynh của chính mình; staff đọc trạng thái đồng ý (không đọc `terms_text`) | chỉ qua RPC |
| class_sessions | staff | chỉ qua RPC |
| attempts | staff của lớp; phụ huynh của em; máy của em | chỉ qua `save_attempt` |
| evaluations | staff; phụ huynh của em | chỉ qua `grade*` |
| project_groups, group_members | staff; thành viên (qua máy hoặc phụ huynh) | staff; học sinh tạo nhóm trong buổi (F-05) qua RPC |
| notebook_revisions | staff; thành viên | thành viên (insert) |
| lessons, lesson_versions | mọi người | chỉ khoá dịch vụ (đội phát triển) |

## 5. Ví dụ = test đầu tiên (pgTAP hoặc test Node gọi RPC)

Lấy nguyên bảng ví dụ BRD 6.3 (4 ca `current_week`, 5 ca `suggested_level`) + các ca:
1. Hai máy cùng gọi `save_attempt` với `{m1}` và `{m2}` → kết quả `{m1, m2}`.
2. `join_session` với buổi hết hạn 1 phút → lỗi `ZM_BLOCK_BR_BH_01`.
3. `grade` có comment cho em chưa đồng ý → lỗi `ZM_BLOCK_BR_DY_02`; không comment → lưu được.
4. `withdraw_consent` của phụ huynh duy nhất → `full_name` null, comment null, `level` giữ nguyên.
5. Giáo viên phụ đã có `to_date` hôm qua → không đọc được `attempts` của lớp.

## 6. Còn mở

- Thời gian thực cho màn giáo viên S-06 ("18/28 đã vào"): đăng ký thay đổi `device_sessions` (Realtime) — cần kiểm giới hạn gói miễn phí.
- Dữ liệu hiện ở localStorage của máy đã dùng (Bài 3/9/10): **không** chuyển lên (không biết là em nào) — ghi rõ trong thông báo phát hành.
- Khu vực máy chủ: chọn vùng gần Việt Nam (Singapore).
- Văn bản điều khoản đồng ý (BRD 12.6) phải có trước khi bật F-03 cho phụ huynh thật.
