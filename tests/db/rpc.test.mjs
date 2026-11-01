// Kiểm thử RPC + trigger (supabase/migrations/*.sql) trên PGlite (Postgres chạy trong Node, không cần máy chủ).
// Chạy: node --test tests/db/rpc.test.mjs
// PGlite chưa là devDependency của repo: nếu `import '@electric-sql/pglite'` không thấy, đặt
// PGLITE_DIR = thư mục có node_modules/@electric-sql/pglite.
// Giả lập Supabase: schema auth + auth.uid() đọc request.jwt.claim.sub (giống bản thật), role anon/authenticated,
// quyền bảng mặc định cho authenticated. Mỗi lời gọi chạy dưới `set role authenticated` để RLS và grant có hiệu lực.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.join(here, '..', '..', 'supabase', 'migrations');

async function loadPGlite() {
  try {
    return (await import('@electric-sql/pglite')).PGlite;
  } catch (err) {
    const dir = process.env.PGLITE_DIR;
    if (!dir) throw new Error('Không tìm thấy @electric-sql/pglite. Cài vào repo hoặc đặt PGLITE_DIR.', { cause: err });
    const resolved = createRequire(path.join(dir, 'package.json')).resolve('@electric-sql/pglite');
    return (await import(pathToFileURL(resolved).href)).PGlite;
  }
}

const PGlite = await loadPGlite();
const db = new PGlite();

await db.exec(`
  create schema auth;
  create table auth.users (id uuid primary key);
  create function auth.uid() returns uuid language sql stable as
    $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  create function auth.jwt() returns jsonb language sql stable as
    $$ select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb $$;
  create role anon nologin;
  create role authenticated nologin;
  grant usage on schema auth to anon, authenticated;
`);
for (const f of readdirSync(migrationsDir).filter(n => n.endsWith('.sql')).sort()) {
  await db.exec(readFileSync(path.join(migrationsDir, f), 'utf8'));
}
// Supabase mặc định cấp quyền bảng cho anon/authenticated; RLS mới là lớp chặn.
await db.exec(`grant select, insert, update, delete on all tables in schema public to anon, authenticated;`);

// ---------- trợ giúp ----------
const U = {
  owner: '00000000-0000-0000-0000-0000000000a1',
  assistantOld: '00000000-0000-0000-0000-0000000000a2',
  g1: '00000000-0000-0000-0000-0000000000b1',
  g2: '00000000-0000-0000-0000-0000000000b2',
  g3: '00000000-0000-0000-0000-0000000000b3',
  d1: '00000000-0000-0000-0000-0000000000d1',   // máy (phiên ẩn danh)
  d2: '00000000-0000-0000-0000-0000000000d2',
  stranger: '00000000-0000-0000-0000-0000000000e1',
  attacker: '00000000-0000-0000-0000-0000000000e2',  // máy mạo danh
  guesser: '00000000-0000-0000-0000-0000000000e3',   // máy đoán mã
  future: '00000000-0000-0000-0000-0000000000a3',    // giáo viên phụ bắt đầu tuần sau (RLS-03)
};
const C1A = '10000000-0000-0000-0000-000000000001';   // lớp ví dụ BRD 6.3
const LIVE = '10000000-0000-0000-0000-000000000002';  // lớp đang học (tuần 1 = 25 tuần trước)
const S = {
  s1: '20000000-0000-0000-0000-000000000001',
  s2: '20000000-0000-0000-0000-000000000002',
  s3: '20000000-0000-0000-0000-000000000003',
  s4: '20000000-0000-0000-0000-000000000004',
};

async function as(uid, sql, params = [], claims = {}) {
  await db.query(`select set_config('request.jwt.claim.sub', $1, false)`, [uid ?? '']);
  await db.query(`select set_config('request.jwt.claims', $1, false)`, [JSON.stringify({ sub: uid, ...claims })]);
  await db.exec('set role authenticated');
  try {
    return (await db.query(sql, params)).rows;
  } finally {
    await db.exec('reset role');
  }
}
const one = async (uid, sql, params) => Object.values((await as(uid, sql, params))[0])[0];
const su = async (sql, params = []) => (await db.query(sql, params)).rows;
const blocked = (promise, code) => assert.rejects(promise, err => {
  assert.match(err.message, new RegExp(`^${code}$`));
  return true;
});

// ---------- dữ liệu mẫu ----------
const core = n => Array.from({ length: n }, (_, i) => ({ code: `m${i + 1}`, title: `M${i + 1}`, kind: 'core' }));
await su(`insert into auth.users (id) select unnest($1::uuid[])`, [Object.values(U)]);
await su(`insert into public.profiles (id, full_name) values
  ($1,'Cô Lan'), ($2,'Thầy Minh'), ($3,'Bố Nam'), ($4,'Mẹ Nam'), ($5,'Bác Nam'), ($6,'Cô Hạnh')`,
  [U.owner, U.assistantOld, U.g1, U.g2, U.g3, U.future]);
await su(`insert into public.lessons (id, grade, term, week, title, type, current_version) values
  ('lop1-bai05',1,1,5,'Không có nhiệm vụ cơ bản','showcase',1),
  ('lop1-bai09',1,1,9,'Bài 9','model',1),
  ('lop1-bai10',1,1,10,'Lý thuyết','theory',1),
  ('lop1-bai14',1,1,14,'Dự án','project',1),
  ('lop1-bai30',1,2,30,'Bài 30','model',1)`);
await su(`insert into public.lesson_versions (lesson_id, version, missions) values
  ('lop1-bai05',1,$1), ('lop1-bai09',1,$2), ('lop1-bai10',1,$3), ('lop1-bai14',1,'[]'), ('lop1-bai30',1,$4)`,
  [JSON.stringify([{ code: 'p1', title: 'P1', kind: 'pro' }]),
   JSON.stringify([...core(4), { code: 'm5', title: 'M5', kind: 'pro' }, { code: 'm6', title: 'M6', kind: 'pro' }]),
   JSON.stringify(core(3)), JSON.stringify(core(2))]);
await su(`insert into public.classes (id, name, grade, school_year, week1_monday) values
  ($1,'1A – 2026',1,'2026-2027','2026-09-07'),
  ($2,'1B – live',1,'2026-2027', date_trunc('week', current_date)::date - 25 * 7)`, [C1A, LIVE]);
await su(`insert into public.class_breaks (class_id, week_monday, note) values ($1,'2027-02-08','Tết'), ($1,'2027-02-15','Tết')`, [C1A]);
await su(`insert into public.class_staff (class_id, teacher_id, role, from_date, to_date) values
  ($1,$3,'owner','2026-09-01',null), ($2,$3,'owner','2026-09-01',null),
  ($2,$4,'assistant','2026-09-01', current_date - 1),
  ($2,$5,'assistant', current_date + 7, null)`, [C1A, LIVE, U.owner, U.assistantOld, U.future]);
await su(`insert into public.students (id, nickname, avatar) values
  ($1,'Nam B.','cat'), ($2,'An','dog'), ($3,'Mai','fox'), ($4,'Tú','owl')`, Object.values(S));
// S4 từng học lớp OLD (đã rời) và có bài làm ở đó: máy của S4 ở lớp LIVE không được đọc (RLS-02)
const OLD = '10000000-0000-0000-0000-000000000003';
await su(`insert into public.classes (id, name, grade, school_year, week1_monday) values ($1,'1C – cũ',1,'2026-2027','2026-09-07')`, [OLD]);
const [oldEnr] = await su(`insert into public.enrollments (student_id, class_id, status, left_on)
  values ($1,$2,'left',current_date - 30) returning id`, [S.s4, OLD]);
await su(`insert into public.attempts (enrollment_id, lesson_id, version) values ($1,'lop1-bai09',1)`, [oldEnr.id]);
await su(`insert into public.enrollments (student_id, class_id) select unnest($1::uuid[]), $2`, [Object.values(S), LIVE]);
await su(`insert into public.invite_codes (code, student_id, created_by, status) values
  ('ABCD2345',$1,$2,'valid'), ('RVKD2345',$1,$2,'revoked')`, [S.s1, U.owner]);
await su(`insert into public.consent_terms (version, body) values ('v1','Điều khoản thử nghiệm')`);

const enr = async sid => (await su(`select id from public.enrollments where student_id = $1 and status = 'active'`, [sid]))[0].id;
async function seedAttempt(sid, lesson, done) {
  const missions = Object.fromEntries(done.map(c => [c, '2026-11-04T08:00:00Z']));
  return (await su(`insert into public.attempts (enrollment_id, lesson_id, version, missions_done)
    values ($1,$2,1,$3) returning id`, [await enr(sid), lesson, JSON.stringify(missions)]))[0].id;
}

// ---------- BRD 6.3: tuần học ----------
test('BRD 6.3 current_week: 4 ca', async () => {
  const cw = d => one(U.owner, `select public.current_week($1, $2::date)`, [C1A, d]);
  assert.equal(await cw('2026-11-04'), 9);    // #1
  assert.equal(await cw('2027-02-22'), 23);   // #2: 25 tuần lịch − 2 tuần Tết
  assert.equal(await cw('2026-09-06'), 0);    // #3: trước tuần 1
  assert.equal(await cw('2026-11-16'), 11);   // #4: lớp tạo muộn, tuần 1–11 mở ngay
  // "Bài mở tới": tuần N mở ⇔ N ≤ tuần học
  const open = (l, d) => su(`select private.lesson_open($1,$2,$3::date) v`, [C1A, l, d]).then(r => r[0].v);
  assert.equal(await open('lop1-bai09', '2026-11-04'), true);
  assert.equal(await open('lop1-bai10', '2026-11-04'), false);
  assert.equal(await open('lop1-bai05', '2026-09-06'), false);
  assert.equal(await open('lop1-bai14', '2026-11-16'), false);
  // người ngoài lớp không xem được
  await blocked(as(U.stranger, `select public.current_week($1)`, [C1A]), 'ZM_BLOCK_BR_LP_01');
});

test('lesson_open: lịch tuần + mở sớm (BR-BA-01)', async () => {
  assert.equal(await one(U.owner, `select public.lesson_open($1,'lop1-bai09')`, [LIVE]), true);
  assert.equal(await one(U.owner, `select public.lesson_open($1,'lop1-bai30')`, [LIVE]), false);
  await su(`insert into public.class_unlocks (class_id, lesson_id, unlocked_by) values ($1,'lop1-bai30',$2)`, [LIVE, U.owner]);
  assert.equal(await one(U.owner, `select public.lesson_open($1,'lop1-bai30')`, [LIVE]), true);
  await su(`delete from public.class_unlocks where class_id = $1`, [LIVE]);
});

// ---------- BRD 6.3: mức gợi ý ----------
test('BRD 6.3 suggested_level: 5 ca', async () => {
  const sl = id => one(U.owner, `select public.suggested_level($1)`, [id]);
  assert.equal(await sl(await seedAttempt(S.s1, 'lop1-bai09', ['m1', 'm2', 'm3', 'm4', 'm5'])), 'HTT'); // #1
  assert.equal(await sl(await seedAttempt(S.s2, 'lop1-bai09', ['m1', 'm2'])), 'HT');                    // #2
  assert.equal(await sl(await seedAttempt(S.s3, 'lop1-bai09', [])), 'CHT');                             // #3
  assert.equal(await sl(await seedAttempt(S.s1, 'lop1-bai10', ['m1'])), 'CHT');                         // #4
  assert.equal(await sl(await seedAttempt(S.s1, 'lop1-bai05', ['p1'])), null);                          // #5 C = 0
  // người không phải staff/phụ huynh/máy của em (device_student() = null) bị chặn
  const any = (await su(`select id from public.attempts limit 1`))[0].id;
  await blocked(as(U.stranger, `select public.suggested_level($1)`, [any]), 'ZM_BLOCK_BR_LP_01');
});

// ---------- du-lieu.md mục 5 ----------
let liveCode, liveSession, pick;

test('Ca 1: hai máy save_attempt {m1} và {m2} → {m1, m2}', async () => {
  const opened = await one(U.owner, `select public.open_session($1)`, [LIVE]);
  assert.match(opened.join_code, /^\d{4}$/);
  liveCode = opened.join_code; liveSession = opened.session_id;

  // Luồng mới (RLS-01): roster → request_join → giáo viên duyệt → join_session
  const roster = await one(U.d1, `select public.session_roster($1)`, [liveCode]);
  assert.equal(roster.ok, true);
  assert.deepEqual(roster.roster.map(x => x.nickname).sort(), ['An', 'Mai', 'Nam B.', 'Tú']);
  assert.ok(roster.roster.every(x => Object.keys(x).sort().join() === 'avatar,nickname,pick' && /^[0-9a-f]{12}$/.test(x.pick)));
  assert.ok(!Object.values(S).some(id => JSON.stringify(roster).includes(id)));   // không lộ UUID học sinh
  pick = Object.fromEntries(roster.roster.map(x => [x.nickname, x.pick]));

  const q1 = await one(U.d1, `select public.request_join($1,$2)`, [liveCode, pick['Tú']]);
  assert.equal(q1.status, 'pending');
  assert.equal(q1.device_tag, roster.device_tag);
  assert.equal((await one(U.d1, `select public.join_session($1)`, [liveCode])).status, 'pending');
  await blocked(as(U.d1, `select public.save_attempt($1,'lop1-bai09','["m1"]')`, [S.s4]), 'ZM_BLOCK_BR_PH_02');

  const pending = await as(U.owner, `select * from public.list_pending_devices($1)`, [liveSession]);
  assert.equal(pending.length, 1);
  assert.equal(pending[0].device_tag, q1.device_tag);
  assert.equal(pending[0].nickname, 'Tú');
  await blocked(as(U.d1, `select public.approve_device($1,$2)`, [liveSession, U.d1]), 'ZM_BLOCK_BR_LP_01');   // máy không tự duyệt
  assert.deepEqual((await one(U.owner, `select public.approve_device($1,$2)`, [liveSession, U.d1])).warnings, []);
  const j1 = await one(U.d1, `select public.join_session($1)`, [liveCode]);
  assert.equal(j1.ok, true);
  assert.deepEqual(j1.warnings, []);

  // máy thứ hai chọn cùng tên: duyệt hàng loạt bỏ qua ca trùng; duyệt riêng → cảnh báo BR-BH-02
  await one(U.d2, `select public.request_join($1,$2)`, [liveCode, pick['Tú']]);
  assert.equal((await as(U.owner, `select * from public.list_pending_devices($1)`, [liveSession]))[0].in_use_elsewhere, true);
  const bulk = await one(U.owner, `select public.approve_device($1)`, [liveSession]);
  assert.equal(bulk.approved, 0);
  assert.deepEqual(bulk.conflicts, [S.s4]);
  assert.deepEqual((await one(U.owner, `select public.approve_device($1,$2)`, [liveSession, U.d2])).warnings, ['BR-BH-02']);
  const j2 = await one(U.d2, `select public.join_session($1)`, [liveCode]);
  assert.deepEqual(j2.warnings, ['BR-BH-02']);   // cảnh báo, vẫn vào được

  // RLS-02: máy của S4 không đọc bài làm của S4 ở lớp cũ đã rời
  assert.equal(await one(U.d1, `select count(*)::int from public.attempts`), 0);

  await one(U.d1, `select public.save_attempt($1,'lop1-bai09','["m1"]','{"v":1}',null,'kid')`, [S.s4]);
  const r = await one(U.d2, `select public.save_attempt($1,'lop1-bai09','["m2","zz"]','{"v":2}',null,'pro')`, [S.s4]);
  assert.deepEqual(Object.keys(r.missions_done).sort(), ['m1', 'm2']);   // gộp; mã lạ "zz" bị bỏ
  const [row] = await su(`select missions_done, program, modes_used, version from public.attempts where id = $1`, [r.attempt_id]);
  assert.deepEqual(row.program, { v: 2 });      // chương trình: bản lưu sau thắng
  assert.deepEqual(row.modes_used.sort(), ['kid', 'pro']);
  assert.equal(row.version, 1);

  // giữ thời điểm sớm nhất; thời điểm tương lai bị kẹp về now()
  const before = row.missions_done.m1;
  const later = await one(U.d1, `select public.save_attempt($1,'lop1-bai09',$2)`,
    [S.s4, JSON.stringify({ m1: '2099-01-01T00:00:00Z' })]);
  assert.equal(later.missions_done.m1, before);
  const earlier = await one(U.d1, `select public.save_attempt($1,'lop1-bai09',$2)`,
    [S.s4, JSON.stringify({ m1: '2026-09-08T01:00:00Z' })]);
  assert.equal(new Date(earlier.missions_done.m1).toISOString(), '2026-09-08T01:00:00.000Z');

  // chặn
  await blocked(as(U.d1, `select public.save_attempt($1,'lop1-bai30','["m1"]')`, [S.s4]), 'ZM_BLOCK_BR_BA_01');
  await blocked(as(U.stranger, `select public.save_attempt($1,'lop1-bai09','["m3"]')`, [S.s4]), 'ZM_BLOCK_BR_PH_02');
  await blocked(as(U.d1, `select public.save_attempt($1,'lop1-bai09','["m3"]')`, [S.s1]), 'ZM_BLOCK_BR_PH_02');

  // BR-BL-03: chỉ giáo viên gỡ nhiệm vụ
  await blocked(as(U.d1, `select public.remove_mission($1,'m2')`, [r.attempt_id]), 'ZM_BLOCK_BR_BL_03');
  const rm = await one(U.owner, `select public.remove_mission($1,'m2')`, [r.attempt_id]);
  assert.deepEqual(Object.keys(rm.missions_done), ['m1']);
  assert.equal(await one(U.d1, `select count(*)::int from public.attempts`), 1);   // chỉ bài ở lớp LIVE
});

test('RLS-01: máy mạo danh biết mã buổi + chọn tên bạn → không có quyền tới khi giáo viên duyệt', async () => {
  await assert.rejects(as(U.attacker, `select public.join_session($1,$2::uuid)`, [liveCode, S.s1]), /does not exist/);   // hàm cũ đã xoá
  const q = await one(U.attacker, `select public.request_join($1,$2)`, [liveCode, pick['Nam B.']]);
  assert.equal(q.status, 'pending');
  assert.equal((await one(U.attacker, `select public.join_session($1)`, [liveCode])).ok, false);
  await blocked(as(U.attacker, `select public.save_attempt($1,'lop1-bai09','["m1"]')`, [S.s1]), 'ZM_BLOCK_BR_PH_02');
  assert.equal(await one(U.attacker, `select count(*)::int from public.attempts`), 0);
  await blocked(as(U.attacker, `select public.request_join($1,'ffffffffffff')`, [liveCode]), 'ZM_INVALID_INPUT');
  await one(U.owner, `select public.reject_device($1,$2)`, [liveSession, U.attacker]);
  assert.equal((await one(U.attacker, `select public.join_session($1)`, [liveCode])).error, 'ZM_BLOCK_BR_BH_01');
  assert.equal((await one(U.stranger, `select public.join_session($1)`, [liveCode])).error, 'ZM_BLOCK_BR_BH_01');
});

test('Giới hạn đoán mã: 5 lần sai / 5 phút', async () => {
  const wrong = ['0000', '1111', '2222', '3333', '4444', '5555'].filter(c => c !== liveCode).slice(0, 5);
  for (const c of wrong) {
    const r = await one(U.guesser, `select public.session_roster($1)`, [c]);
    assert.deepEqual([r.ok, r.error], [false, 'ZM_BLOCK_BR_BH_01']);
  }
  assert.equal((await su(`select count(*)::int n from private.join_failures where auth_uid = $1`, [U.guesser]))[0].n, 5);
  await blocked(as(U.guesser, `select public.session_roster($1)`, [liveCode]), 'ZM_BLOCK_RATE_LIMIT');   // kể cả mã đúng
  await blocked(as(U.guesser, `select public.request_join($1,$2)`, [liveCode, pick['An']]), 'ZM_BLOCK_RATE_LIMIT');
  await su(`update private.join_failures set attempted_at = now() - interval '6 minutes' where auth_uid = $1`, [U.guesser]);
  assert.equal((await one(U.guesser, `select public.session_roster($1)`, [liveCode])).ok, true);   // hết 5 phút
  assert.equal((await one(U.d1, `select public.session_roster($1)`, [liveCode])).ok, true);        // máy khác không bị ảnh hưởng
});

test('leave_session ("Không phải em", F-09)', async () => {
  await one(U.d2, `select public.leave_session()`);
  assert.equal((await su(`select count(*)::int n from public.device_sessions where auth_uid = $1`, [U.d2]))[0].n, 0);
  await blocked(as(U.d2, `select public.save_attempt($1,'lop1-bai09','["m3"]')`, [S.s4]), 'ZM_BLOCK_BR_PH_02');
  assert.equal((await one(U.d2, `select public.join_session($1)`, [liveCode])).error, 'ZM_BLOCK_BR_BH_01'); // chọn tên + duyệt lại
  assert.equal((await one(U.d2, `select public.request_join($1,$2)`, [liveCode, pick['Mai']])).status, 'pending');
  assert.equal((await one(U.d1, `select public.save_attempt($1,'lop1-bai09','["m3"]')`, [S.s4])).ok, true);   // d1 không ảnh hưởng
});

test('RLS-03: giáo viên phụ có from_date tuần sau chưa có quyền', async () => {
  assert.equal(await one(U.future, `select count(*)::int from public.classes`), 0);
  await blocked(as(U.future, `select public.open_session($1)`, [LIVE]), 'ZM_BLOCK_BR_LP_01');
  await blocked(as(U.future, `select * from public.list_pending_devices($1)`, [liveSession]), 'ZM_BLOCK_BR_LP_01');
});

test('Ca 2: join_session buổi hết hạn 1 phút → ZM_BLOCK_BR_BH_01', async () => {
  const code = liveCode === '0042' ? '0043' : '0042';
  await su(`insert into public.class_sessions (class_id, join_code, opened_by, opened_at, expires_at)
    values ($1,$2,$3, now() - interval '91 minutes', now() - interval '1 minute')`, [LIVE, code, U.owner]);
  assert.equal((await one(U.d1, `select public.join_session($1)`, [code])).error, 'ZM_BLOCK_BR_BH_01');
  assert.equal((await one(U.d1, `select public.join_session($1)`, [liveCode === '9999' ? '9998' : '9999'])).error, 'ZM_BLOCK_BR_BH_01');
  assert.equal((await one(U.d2, `select public.session_roster($1)`, [code])).ok, false);   // buổi hết hạn: không có roster

  // close_session: máy mất quyền
  await blocked(as(U.d1, `select public.close_session($1)`, [liveSession]), 'ZM_BLOCK_BR_LP_01');
  await one(U.owner, `select public.close_session($1)`, [liveSession]);
  assert.equal((await su(`select count(*)::int n from public.device_sessions`))[0].n, 0);
  await blocked(as(U.d1, `select public.save_attempt($1,'lop1-bai09','["m3"]')`, [S.s4]), 'ZM_BLOCK_BR_PH_02');
  assert.equal((await one(U.d1, `select public.join_session($1)`, [liveCode])).error, 'ZM_BLOCK_BR_BH_01');
  await blocked(as(U.owner, `select public.approve_device($1,$2)`, [liveSession, U.d2]), 'ZM_BLOCK_BR_BH_01');
});

let s1Bai09;
test('Ca 3: grade có nhận xét khi chưa đồng ý → ZM_BLOCK_BR_DY_02; không nhận xét → lưu', async () => {
  s1Bai09 = (await su(`select id from public.attempts where lesson_id = 'lop1-bai09' and enrollment_id = $1`, [await enr(S.s1)]))[0].id;
  await blocked(as(U.owner, `select public.grade($1,'HT','Em lắp nhanh')`, [s1Bai09]), 'ZM_BLOCK_BR_DY_02');
  const g = await one(U.owner, `select public.grade($1,'HT')`, [s1Bai09]);
  assert.equal(g.ok, true);
  assert.equal(g.suggested_level, 'HTT');
  assert.deepEqual(g.warnings, ['BR-DG-01']);   // khác mức gợi ý → cảnh báo, vẫn lưu
  const [ev] = await su(`select level, suggested_level, comment, source from public.evaluations where id = $1`, [g.evaluation_id]);
  assert.deepEqual(ev, { level: 'HT', suggested_level: 'HTT', comment: null, source: 'direct' });

  await blocked(as(U.owner, `select public.grade($1, null)`, [s1Bai09]), 'ZM_BLOCK_BR_DG_02');
  await blocked(as(U.assistantOld, `select public.grade($1,'HT')`, [s1Bai09]), 'ZM_BLOCK_BR_LP_01');
  // trigger BR-DY-02 cả khi ghi thẳng (khoá dịch vụ)
  await blocked(su(`insert into public.evaluations (attempt_id, level, comment, graded_by) values ($1,'HT','x',$2)`,
    [s1Bai09, U.owner]), 'ZM_BLOCK_BR_DY_02');
});

test('Ca 4: withdraw_consent của phụ huynh duy nhất → full_name null, comment null, level giữ', async () => {
  const r = await one(U.g1, `select public.redeem_invite(' abcd2345 ')`);
  assert.equal(r.student_id, S.s1);
  await one(U.g1, `select public.give_consent($1,'  Nguyễn   Văn  Nam ','2019-05-01','v1')`, [S.s1]);
  const [st] = await su(`select full_name, birth_date::text b from public.students where id = $1`, [S.s1]);
  assert.deepEqual(st, { full_name: 'Nguyễn Văn Nam', b: '2019-05-01' });
  const [c] = await su(`select terms_text from public.consents where student_id = $1`, [S.s1]);
  assert.equal(c.terms_text, 'Điều khoản thử nghiệm');

  const g = await one(U.owner, `select public.grade($1,'HTT','Em lắp nhanh')`, [s1Bai09]);
  assert.deepEqual(g.warnings, []);

  const w = await one(U.g1, `select public.withdraw_consent($1)`, [S.s1]);
  assert.equal(w.consent_active, false);
  const [st2] = await su(`select full_name, birth_date from public.students where id = $1`, [S.s1]);
  assert.deepEqual(st2, { full_name: null, birth_date: null });
  const evs = await su(`select level, comment from public.evaluations where attempt_id = $1 order by graded_at, level`, [s1Bai09]);
  assert.equal(evs.length, 2);
  assert.ok(evs.every(e => e.comment === null));
  assert.deepEqual(evs.map(e => e.level).sort(), ['HT', 'HTT']);
  const [cur] = await su(`select level from public.current_evaluations where attempt_id = $1`, [s1Bai09]);
  assert.equal(cur.level, 'HTT');

  await blocked(as(U.g2, `select public.withdraw_consent($1)`, [S.s1]), 'ZM_BLOCK_BR_PH_02');
});

test('Ca 5: giáo viên phụ có to_date hôm qua → không đọc được attempts của lớp', async () => {
  assert.equal(await one(U.assistantOld, `select count(*)::int from public.attempts`), 0);
  assert.equal(await one(U.assistantOld, `select count(*)::int from public.classes`), 0);
  assert.ok(await one(U.owner, `select count(*)::int from public.attempts`) > 0);   // đối chứng
});

// ---------- trigger ----------
test('GD-12 / BR-PH-01: tối đa 2 phụ huynh, mã thu hồi bị chặn', async () => {
  await blocked(as(U.g2, `select public.redeem_invite('RVKD2345')`), 'ZM_BLOCK_BR_PH_01');
  assert.equal((await one(U.g2, `select public.redeem_invite('ABCD2345')`)).already_linked, false);
  assert.equal((await one(U.g2, `select public.redeem_invite('ABCD2345')`)).already_linked, true);
  await blocked(as(U.g3, `select public.redeem_invite('ABCD2345')`), 'ZM_BLOCK_BR_PH_01');
  await blocked(su(`insert into public.guardian_links (guardian_id, student_id) values ($1,$2)`, [U.g3, S.s1]), 'ZM_BLOCK_BR_PH_01');
  assert.equal((await su(`select uses from public.invite_codes where code = 'ABCD2345'`))[0].uses, 2);
  await blocked(as(U.d1, `select public.redeem_invite('ABCD2345')`), 'ZM_BLOCK_AUTH');   // máy ẩn danh không có hồ sơ
});

test('BR-DY-01: họ tên / ngày sinh chỉ khi có đồng ý', async () => {
  await blocked(su(`update public.students set full_name = 'Trần An' where id = $1`, [S.s2]), 'ZM_BLOCK_BR_DY_01');
  await blocked(su(`update public.students set birth_date = '2019-01-01' where id = $1`, [S.s2]), 'ZM_BLOCK_BR_DY_01');
  await blocked(su(`insert into public.students (nickname, avatar, full_name) values ('Bi','bee','Lê Bi')`), 'ZM_BLOCK_BR_DY_01');
  await su(`update public.students set nickname = 'An T.' where id = $1`, [S.s2]);   // sửa tên gọi ngắn vẫn được
});

test('BR-DA-01 + grade_group', async () => {
  const [g1] = await su(`insert into public.project_groups (class_id, lesson_id, name, created_by_kind) values ($1,'lop1-bai14','Nhóm 1','teacher') returning id`, [LIVE]);
  const [g2] = await su(`insert into public.project_groups (class_id, lesson_id, name, created_by_kind) values ($1,'lop1-bai14','Nhóm 2','teacher') returning id`, [LIVE]);
  await su(`insert into public.group_members (group_id, student_id) values ($1,$2)`, [g1.id, S.s2]);
  await blocked(su(`insert into public.group_members (group_id, student_id) values ($1,$2)`, [g2.id, S.s2]), 'ZM_BLOCK_BR_DA_01');
  await su(`update public.group_members set left_on = current_date where group_id = $1 and student_id = $2`, [g1.id, S.s2]);
  await su(`insert into public.group_members (group_id, student_id) values ($1,$2), ($1,$3), ($1,$4)`, [g2.id, S.s2, S.s1, S.s3]);
  await su(`update public.enrollments set status = 'left', left_on = current_date where student_id = $1`, [S.s3]);

  // S1 đã có đồng ý lại (G2), S2 chưa → nhận xét chỉ chép cho S1
  await one(U.g2, `select public.give_consent($1,'Nguyễn Văn Nam',null,'v1')`, [S.s1]);
  const r = await one(U.owner, `select public.grade_group($1,'HT','Nhóm làm tốt')`, [g2.id]);
  assert.equal(r.graded, 2);
  assert.deepEqual(r.skipped, [S.s3]);   // ghi danh đã rời
  assert.deepEqual(r.warnings, ['BR-DY-02']);
  const evs = await su(`select e.student_id, ev.comment, ev.source from public.evaluations ev
    join public.attempts a on a.id = ev.attempt_id join public.enrollments e on e.id = a.enrollment_id
    where a.lesson_id = 'lop1-bai14' order by e.student_id`);
  assert.deepEqual(evs, [
    { student_id: S.s1, comment: 'Nhóm làm tốt', source: 'group' },
    { student_id: S.s2, comment: null, source: 'group' },
  ]);
  // RLS-06: phụ huynh của thành viên (S1 ∈ Nhóm 2) đọc đúng nhóm của con, không thấy Nhóm 1
  await su(`insert into public.notebook_revisions (group_id, stage, content) values ($1,'idea','{}'), ($2,'idea','{}')`, [g1.id, g2.id]);
  assert.deepEqual((await as(U.g2, `select name from public.project_groups`)).map(x => x.name), ['Nhóm 2']);
  assert.equal(await one(U.g2, `select count(*)::int from public.notebook_revisions`), 1);
  assert.equal(await one(U.g2, `select count(*)::int from public.group_members`), 3);   // S2, S1, S3 của Nhóm 2
  assert.equal(await one(U.g3, `select count(*)::int from public.project_groups`), 0);   // không liên kết
  // S1 bị chặn chấm sau khi giáo viên phụ hết hạn — đã thử ở Ca 3; ghi danh đã rời → BR-DG-03
  const s3att = (await su(`select a.id from public.attempts a join public.enrollments e on e.id = a.enrollment_id where e.student_id = $1 limit 1`, [S.s3]))[0].id;
  await blocked(as(U.owner, `select public.grade($1,'HT')`, [s3att]), 'ZM_BLOCK_BR_DG_03');
});

test('ensure_profile: tạo hồ sơ cho người mới, gọi lại không đổi', async () => {
  const newbie = '00000000-0000-0000-0000-0000000000f1';
  await su(`insert into auth.users (id) values ($1)`, [newbie]);
  const p = await one(newbie, `select to_jsonb(public.ensure_profile('  Cô   Hoa '))`);
  assert.equal(p.id, newbie);
  assert.equal(p.full_name, 'Cô Hoa');
  const again = await one(newbie, `select to_jsonb(public.ensure_profile('Tên khác'))`);
  assert.equal(again.full_name, 'Cô Hoa');            // on conflict do nothing
  assert.equal((await one(newbie, `select count(*)::int from public.profiles`)), 1);   // RLS: chỉ thấy mình
  await blocked(as(newbie, `select public.ensure_profile('   ')`), 'ZM_INVALID_INPUT');
  await blocked(as(newbie, `select public.ensure_profile($1)`, ['x'.repeat(81)]), 'ZM_INVALID_INPUT');
  await blocked(as(null, `select public.ensure_profile('Ai đó')`), 'ZM_BLOCK_AUTH');
  await blocked(as(U.d1, `select public.ensure_profile('Máy 1')`, [], { is_anonymous: true }), 'ZM_BLOCK_AUTH');
  await db.exec('set role anon');
  try {
    await assert.rejects(db.query(`select public.ensure_profile('x')`), /permission denied/);
  } finally {
    await db.exec('reset role');
  }
});

test('Quyền gọi: anon không gọi được RPC; chưa đăng nhập bị chặn', async () => {
  await db.exec('set role anon');
  try {
    await assert.rejects(db.query(`select public.current_week($1)`, [C1A]), /permission denied/);
    await assert.rejects(db.query(`select public.join_session('1234')`), /permission denied/);
    await assert.rejects(db.query(`select public.session_roster('1234')`), /permission denied/);
    await assert.rejects(db.query(`select public.approve_device(gen_random_uuid())`), /permission denied/);
  } finally {
    await db.exec('reset role');
  }
  await blocked(as(null, `select public.open_session($1)`, [LIVE]), 'ZM_BLOCK_AUTH');
  await blocked(as(U.assistantOld, `select public.open_session($1)`, [LIVE]), 'ZM_BLOCK_BR_LP_01');
  await assert.rejects(as(U.owner, `select private.current_week($1, current_date)`, [LIVE]), /permission denied/);
});
