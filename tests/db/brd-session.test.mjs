// Phiếu 52: thực thi toàn bộ migration bằng PGlite, không dùng Supabase thật.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const migrationsDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../supabase/migrations');
async function getPGlite() {
  try { return (await import('@electric-sql/pglite')).PGlite; }
  catch (cause) {
    if (!process.env.PGLITE_DIR) throw new Error('Missing temporary PGlite installation', { cause });
    return (await import(pathToFileURL(createRequire(path.join(process.env.PGLITE_DIR, 'package.json'))
      .resolve('@electric-sql/pglite')).href)).PGlite;
  }
}
const db = new (await getPGlite())();
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
for (const filename of readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort()) {
  if (filename.includes('00005_'))
    await db.exec('grant select, insert, update, delete on all tables in schema public to anon, authenticated');
  await db.exec(readFileSync(path.join(migrationsDir, filename), 'utf8'));
}
const U = {
  teacher: '00000000-0000-0000-0000-000000005201',
  device1: '00000000-0000-0000-0000-000000005202',
  device2: '00000000-0000-0000-0000-000000005203',
};
const sql = async (query, params = []) => (await db.query(query, params)).rows;
async function as(uid, query, params = []) {
  await sql("select set_config('request.jwt.claim.sub', $1, false)", [uid]);
  await sql("select set_config('request.jwt.claims', $1, false)", [JSON.stringify({ sub: uid })]);
  await db.exec('set role authenticated');
  try { return await sql(query, params); }
  finally { await db.exec('reset role'); }
}
const val = async (uid, query, params = []) => Object.values((await as(uid, query, params))[0])[0];
await sql('insert into auth.users(id) select unnest($1::uuid[])', [Object.values(U)]);
await sql("insert into public.profiles(id,full_name) values($1,'Giáo viên')", [U.teacher]);
await sql(`insert into public.lessons(id,grade,term,week,title,type,current_version) values
  ('test52-week1',1,1,1,'Tuần 1','model',null),
  ('test52-week5',1,1,5,'Tuần 5','model',1),
  ('test52-week6',1,1,6,'Tuần 6','model',null),
  ('test52-grade3',3,1,5,'Khối 3','model',null)`);
await sql(`insert into public.lesson_versions(lesson_id,version,missions)
  values ('test52-week5',1,'[]'::jsonb)`);
const [cls] = await sql(`insert into public.classes(name,grade,school_year,week1_monday)
  values('Lớp phiếu 52',1,'2026-2027',
    date_trunc('week',(now() at time zone 'Asia/Ho_Chi_Minh')::date)::date - 28)
  returning id, week1_monday`);
await sql(`insert into public.class_staff(class_id,teacher_id,role)
  values ($1,$2,'owner')`, [cls.id,U.teacher]);
const [student] = await sql("insert into public.students(nickname,avatar) values ('An','🐱') returning id");
await sql('insert into public.enrollments(class_id,student_id) values($1,$2)', [cls.id,student.id]);

test('52/5: timezone VN cho mặc định tuần, phép so sánh ngày và các RPC', async () => {
  await db.exec("set time zone 'Pacific/Honolulu'");
  try {
    assert.equal(await val(U.teacher,'select public.current_week($1)',[cls.id]), 5);
    assert.equal(await val(U.teacher,
      "select public.current_week($1, (now() at time zone 'Asia/Ho_Chi_Minh')::date)", [cls.id]), 5);
    const signatures = [
      'public.current_week(uuid,date)', 'public.lesson_open(uuid,text)',
      'public.is_staff(uuid)', 'public.is_owner(uuid)',
      'public.save_attempt(uuid,text,jsonb,jsonb,jsonb,text)',
      'public.student_home_state(uuid,uuid)',
      'public.save_teacher_class(uuid,text,smallint,text,date,jsonb,jsonb)',
      'public.save_teacher_class_before_unique_names(uuid,text,smallint,text,date,jsonb,jsonb)',
      'public.give_consent(uuid,text,date,text)',
    ];
    for (const signature of signatures) {
      const definition = (await sql('select pg_get_functiondef(to_regprocedure($1)) as ddl',[signature]))[0].ddl;
      assert.ok(definition, `Missing ${signature}`);
      assert.doesNotMatch(definition, /\bcurrent_date\b/i, signature);
      assert.match(definition, /Asia\/Ho_Chi_Minh/i, signature);
    }
  } finally { await db.exec('reset time zone'); }
});

test('52/1: đã mở vẫn mở sau khi thêm tuần nghỉ; bài sau vẫn khoá và lưu bài được', async () => {
  assert.equal(await val(U.teacher,"select public.lesson_open($1,'test52-week5')",[cls.id]), true);
  assert.equal(await val(U.teacher,"select public.lesson_open($1,'test52-week6')",[cls.id]), false);
  await sql(`insert into public.class_breaks(class_id,week_monday)
    values ($1, $2::date + 7)`,[cls.id,cls.week1_monday]);
  assert.equal(await val(U.teacher,'select public.current_week($1)',[cls.id]), 4);
  assert.equal(await val(U.teacher,"select public.lesson_open($1,'test52-week5')",[cls.id]), true);
  assert.equal(await val(U.teacher,"select public.lesson_open($1,'test52-week6')",[cls.id]), false);
  assert.equal(await val(U.teacher,"select public.lesson_open($1,'test52-grade3')",[cls.id]), false);
  const [opened] = await sql("select opened_on from public.class_lesson_opened where class_id=$1 and lesson_id='test52-week5'",[cls.id]);
  assert.ok(opened?.opened_on);
  const first = await val(U.teacher,'select public.open_session($1)',[cls.id]);
  assert.equal(first.closed_previous,false);
  await sql('insert into public.device_sessions(auth_uid,session_id,student_id) values($1,$2,$3)',
    [U.device1,first.session_id,student.id]);
  const attempt = await val(U.device1,
    "select public.save_attempt($1,'test52-week5', '[]'::jsonb)",[student.id]);
  assert.equal(attempt.ok,true);
  const second = await val(U.teacher,'select public.open_session($1)',[cls.id]);
  assert.equal(second.closed_previous,true);
  assert.notEqual(second.join_code,first.join_code,'Không được cấp lại mã vừa đóng');
  assert.equal((await sql('select closed_at is not null as closed from public.class_sessions where id=$1',
    [first.session_id]))[0].closed,true);
  assert.equal((await sql('select count(*)::int as n from public.device_sessions where session_id=$1',
    [first.session_id]))[0].n,0);
  assert.equal((await val(U.device2,'select public.session_roster($1)',[first.join_code])).ok,false);
  assert.equal((await val(U.device2,'select public.session_roster($1)',[second.join_code])).ok,true);
  globalThis.currentSession = second;
});

test('52/2: từ chối mở buổi nếu lớp đã kết thúc', async () => {
  await sql("update public.classes set status='ended' where id=$1",[cls.id]);
  await assert.rejects(val(U.teacher,'select public.open_session($1)',[cls.id]),/ZM_BLOCK_BR_LP_01/);
  await sql("update public.classes set status='open' where id=$1",[cls.id]);
});

test('52/3: cancel_join chỉ huỷ yêu cầu đúng máy, không xoá máy khác', async () => {
  const code = globalThis.currentSession.join_code;
  const roster = await val(U.device1,'select public.session_roster($1)',[code]);
  assert.equal(roster.roster.length,1);
  const pick = roster.roster[0].pick;
  assert.equal((await val(U.device1,'select public.request_join($1,$2)',[code,pick])).status,'pending');
  assert.equal((await val(U.device2,'select public.request_join($1,$2)',[code,pick])).status,'pending');
  const cancelled = await val(U.device1,'select public.cancel_join($1)',[code]);
  assert.deepEqual([cancelled.ok,cancelled.cancelled,cancelled.session_open],[true,true,true]);
  const [counts] = await sql(`select
    count(*) filter (where auth_uid=$1)::int as first,
    count(*) filter (where auth_uid=$2)::int as second
    from private.device_approvals where session_id=$3`,
    [U.device1,U.device2,globalThis.currentSession.session_id]);
  assert.deepEqual(counts,{first:0,second:1});
  await val(U.teacher,'select public.approve_device($1,$2)',
    [globalThis.currentSession.session_id,U.device2]);
  assert.equal((await val(U.device2,'select public.join_session($1)',[code])).ok,true);
  assert.equal((await val(U.device2,'select public.cancel_join($1)',[code])).cancelled,false,
    'Không huỷ quyền của máy đã vào; dùng leave_session');
});

test('52/4: leave_session trả mã khi buổi mở, trả trạng thái đóng khi hết buổi', async () => {
  const code = globalThis.currentSession.join_code;
  const left = await val(U.device2,'select public.leave_session()');
  assert.deepEqual([left.ok,left.session_open,left.join_code],[true,true,code]);
  assert.equal((await sql('select count(*)::int as n from public.device_sessions where auth_uid=$1',
    [U.device2]))[0].n,0);
  const again = await val(U.teacher,'select public.open_session($1)',[cls.id]);
  assert.equal(again.closed_previous,true);
  const closed = await val(U.device2,'select public.leave_session()');
  assert.deepEqual([closed.ok,closed.session_open,closed.join_code],[true,false,null]);
});
