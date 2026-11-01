// PGlite regression for RLS-04/07 and the RLS-01/02/03/05/06 migration.
// Run with PGLITE_DIR set when @electric-sql/pglite is installed outside this repo.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const directory = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'supabase', 'migrations');
async function loadPGlite() {
  try {
    return (await import('@electric-sql/pglite')).PGlite;
  } catch (cause) {
    if (!process.env.PGLITE_DIR) throw new Error('Install PGlite or set PGLITE_DIR', { cause });
    const resolved = createRequire(path.join(process.env.PGLITE_DIR, 'package.json')).resolve('@electric-sql/pglite');
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
const files = readdirSync(directory).filter(f => f.endsWith('.sql')).sort();
const aclFile = '20261101000005_consent_read_acl.sql';
assert.ok(files.includes(aclFile), 'Expected the consent ACL migration');
for (const f of files.filter(f => f < aclFile)) await db.exec(readFileSync(path.join(directory, f), 'utf8'));
// Simulate the real Supabase broad default table grants BEFORE applying the ACL fix.
await db.exec('grant select, insert, update, delete on all tables in schema public to anon, authenticated');
for (const f of files.filter(f => f >= aclFile)) await db.exec(readFileSync(path.join(directory, f), 'utf8'));

const U = {
  teacher: '00000000-0000-0000-0000-000000000001',
  future: '00000000-0000-0000-0000-000000000002',
  ended: '00000000-0000-0000-0000-000000000003',
  parent: '00000000-0000-0000-0000-000000000004',
  otherParent: '00000000-0000-0000-0000-000000000005',
  device: '00000000-0000-0000-0000-000000000006',
  stranger: '00000000-0000-0000-0000-000000000007',
};
const X = '10000000-0000-0000-0000-000000000001';
const Y = '10000000-0000-0000-0000-000000000002';
const S1 = '20000000-0000-0000-0000-000000000001';
const S2 = '20000000-0000-0000-0000-000000000002';
const S3 = '20000000-0000-0000-0000-000000000003';
const sql = async (query, params = []) => (await db.query(query, params)).rows;
async function as(uid, query, params = []) {
  await sql(`select set_config('request.jwt.claim.sub', $1, false)`, [uid ?? '']);
  await sql(`select set_config('request.jwt.claims', $1, false)`, [JSON.stringify({ sub: uid })]);
  await db.exec('set role authenticated');
  try {
    return await sql(query, params);
  } finally {
    await db.exec('reset role');
  }
}
const value = async (uid, query, params = []) => Object.values((await as(uid, query, params))[0])[0];
const denied = (promise, code = /permission denied/) => assert.rejects(promise, code);

await sql('insert into auth.users (id) select unnest($1::uuid[])', [Object.values(U)]);
await sql(`insert into public.profiles (id, full_name) select id, 'Profile' from auth.users
  where id not in ($1,$2)`, [U.device, U.stranger]);
await sql(`insert into public.classes (id, name, grade, school_year, week1_monday)
  values ($1,'Class X',1,'2026-27',date_trunc('week',current_date)::date - 8*7),
         ($2,'Class Y',1,'2026-27',date_trunc('week',current_date)::date - 8*7)`, [X,Y]);
await sql(`insert into public.class_staff (class_id,teacher_id,role,from_date,to_date) values
  ($1,$2,'owner',current_date - 7,null),
  ($1,$3,'assistant',current_date + 7,null),
  ($1,$4,'assistant',current_date - 14,current_date - 1)`, [X,U.teacher,U.future,U.ended]);
await sql(`insert into public.students (id,nickname,avatar) values
  ($1,'One','cat'),($2,'Two','dog'),($3,'Three','owl')`, [S1,S2,S3]);
await sql(`insert into public.enrollments (student_id,class_id) values
  ($1,$4),($2,$4),($3,$5)`, [S1,S2,S3,X,Y]);
await sql(`insert into public.guardian_links (guardian_id,student_id) values
  ($1,$3),($2,$4)`, [U.parent,U.otherParent,S1,S2]);
await sql(`insert into public.lessons (id,grade,term,week,title,type,current_version)
  values ('lop1-bai01',1,1,1,'Test','model',1)`);
await sql(`insert into public.lesson_versions (lesson_id,version,missions) values ('lop1-bai01',1,
  '[{"code":"m1","title":"M1","kind":"core"}]'::jsonb)`);
const [a1] = await sql(`insert into public.attempts (enrollment_id,lesson_id,version)
  select id,'lop1-bai01',1 from public.enrollments where student_id=$1 returning id`, [S1]);
const [a2] = await sql(`insert into public.attempts (enrollment_id,lesson_id,version)
  select id,'lop1-bai01',1 from public.enrollments where student_id=$1 returning id`, [S2]);
// Simulate a privileged legacy import that left protected data with no active consent.
await db.exec('alter table public.students disable trigger students_identity_consent');
await sql(`update public.students set full_name='Legacy One',birth_date='2019-01-02' where id=$1`, [S1]);
await db.exec('alter table public.students enable trigger students_identity_consent');
await db.exec('alter table public.evaluations disable trigger evaluations_comment_consent');
const [e1] = await sql(`insert into public.evaluations (attempt_id,level,comment,graded_by)
  values ($1,'HT','Private feedback',$2) returning id`, [a1.id,U.teacher]);
const [e2] = await sql(`insert into public.evaluations (attempt_id,level,comment,graded_by)
  values ($1,'CHT','Two private feedback',$2) returning id`, [a2.id,U.teacher]);
await db.exec('alter table public.evaluations enable trigger evaluations_comment_consent');
const [g1] = await sql(`insert into public.project_groups (class_id,lesson_id,name,created_by_kind)
  values ($1,'lop1-bai01','Group One','teacher') returning id`, [X]);
const [g2] = await sql(`insert into public.project_groups (class_id,lesson_id,name,created_by_kind)
  values ($1,'lop1-bai01','Group Two','teacher') returning id`, [X]);
await sql(`insert into public.group_members (group_id,student_id) values ($1,$3),($2,$4)`, [g1.id,g2.id,S1,S2]);
await sql(`insert into public.notebook_revisions (group_id,stage,content) values
  ($1,'idea','{}'),($2,'idea','{}')`, [g1.id,g2.id]);
await sql(`insert into public.invite_codes (code,student_id,created_by) values ('ABCD2345',$1,$2)`, [S1,U.teacher]);

test('RLS-07: privileged rows expose only safe columns and view projections', async () => {
  for (const [table, allowed, secret] of [
    ['students','nickname','full_name'],
    ['students','avatar','birth_date'],
    ['evaluations','level','comment'],
    ['consents','terms_version','terms_text'],
    ['invite_codes','status','code'],
    ['class_sessions','class_id','join_code'],
    ['guardian_links','student_id','invite_code'],
  ]) {
    const [check] = await sql(`select
      has_column_privilege('authenticated',$1,$2,'select') allowed,
      has_column_privilege('authenticated',$1,$3,'select') secret`, [`public.${table}`,allowed,secret]);
    assert.equal(check.allowed, true, `${table}.${allowed} should be readable`);
    assert.equal(check.secret, false, `${table}.${secret} must be restricted`);
  }
  await denied(as(U.teacher, 'select full_name from public.students'));
  await denied(as(U.teacher, 'select birth_date from public.students'));
  await denied(as(U.teacher, 'select comment from public.evaluations'));
  await denied(as(U.teacher, 'select code from public.invite_codes'));
  assert.equal(await value(U.teacher, 'select count(*)::int from public.students'), 2);
  assert.equal(await value(U.parent, 'select count(*)::int from public.students'), 1);
  assert.equal(await value(U.stranger, 'select count(*)::int from public.students'), 0);
  const rows = await as(U.teacher, 'select * from public.current_evaluations');
  assert.equal(rows.length, 2);
  assert.ok(rows.every(e => !Object.hasOwn(e,'comment')));
  await denied(as(U.teacher, 'select comment from public.current_evaluations'), /does not exist/);
  await db.exec('set role anon');
  try {
    await denied(db.query(`select * from public.current_evaluations`));
    await denied(db.query(`select public.read_student_identity($1)`, [S1]));
  } finally {
    await db.exec('reset role');
  }
});

test('RLS-04: legacy values masked until consent, read only by linked guardian or active staff', async () => {
  assert.deepEqual(await as(U.teacher, 'select * from public.read_student_identity($1)',[S1]),
    [{id:S1,nickname:'One',avatar:'cat',full_name:null,birth_date:null}]);
  assert.equal(await value(U.parent,'select public.read_evaluation_comment($1)',[e1.id]),null);
  assert.equal(await value(U.teacher,'select public.read_evaluation_comment($1)',[e1.id]),null);
  assert.equal(await value(U.otherParent,'select public.read_evaluation_comment($1)',[e2.id]),null);
  await denied(as(U.stranger,'select public.read_student_identity($1)',[S1]),/ZM_BLOCK_BR_LP_01/);
  await denied(as(U.device,'select public.read_student_identity($1)',[S2]),/ZM_BLOCK_BR_LP_01/);
  await denied(as(U.future,'select public.read_evaluation_comment($1)',[e1.id]),/ZM_BLOCK_BR_LP_01/);
  await denied(as(U.ended,'select public.read_student_identity($1)',[S1]),/ZM_BLOCK_BR_LP_01/);
  await denied(as(U.parent,'select public.read_evaluation_comment($1)',[e2.id]),/ZM_BLOCK_BR_LP_01/);

  const [consent] = await sql(`insert into public.consents (student_id,guardian_id,terms_version,terms_text)
    values ($1,$2,'v1','Snapshot terms') returning id`, [S1,U.parent]);
  assert.equal((await as(U.parent,'select * from public.read_student_identity($1)',[S1]))[0].full_name,'Legacy One');
  assert.equal((await as(U.teacher,'select * from public.read_student_identity($1)',[S1]))[0].birth_date.toISOString().slice(0,10),'2019-01-02');
  assert.equal(await value(U.parent,'select public.read_evaluation_comment($1)',[e1.id]),'Private feedback');
  assert.equal(await value(U.parent,'select public.read_consent_terms($1)',[consent.id]),'Snapshot terms');
  await denied(as(U.otherParent,'select public.read_consent_terms($1)',[consent.id]),/ZM_BLOCK_BR_PH_02/);
  await denied(as(U.teacher,'select public.read_consent_terms($1)',[consent.id]),/ZM_BLOCK_BR_PH_02/);
  await denied(as(U.parent,'select terms_text from public.consents'),/permission denied/);
  await sql(`update public.consents set withdrawn_at=now() where id=$1`,[consent.id]);
  // Simulate an out-of-band withdrawal that DID NOT clear old identity/comment values.
  assert.equal((await sql('select full_name from public.students where id=$1',[S1]))[0].full_name,'Legacy One');
  assert.equal((await as(U.parent,'select * from public.read_student_identity($1)',[S1]))[0].full_name,null);
  assert.equal(await value(U.teacher,'select public.read_evaluation_comment($1)',[e1.id]),null);
  assert.equal((await as(U.parent,'select level from public.current_evaluations')).length,1);
  assert.equal(await value(U.parent,'select public.read_consent_terms($1)',[consent.id]),'Snapshot terms');
});

test('RLS-01/02/03/05/06: unapproved devices, roster, groups and class transfer', async () => {
  assert.equal(await value(U.future,'select count(*)::int from public.students'),0);
  assert.equal(await value(U.ended,'select count(*)::int from public.attempts'),0);
  const session = await value(U.teacher,'select public.open_session($1)',[X]);
  const roster = await value(U.device,'select public.session_roster($1)',[session.join_code]);
  assert.equal(roster.ok,true);
  assert.deepEqual(roster.roster.map(s=>s.nickname).sort(),['One','Two']);
  assert.ok(!JSON.stringify(roster).includes(S1));
  assert.ok(!JSON.stringify(roster).includes(S2));
  const pick = roster.roster.find(r=>r.nickname==='Two').pick;
  assert.equal((await value(U.device,'select public.request_join($1,$2)',[session.join_code,pick])).status,'pending');
  assert.equal((await value(U.device,'select public.join_session($1)',[session.join_code])).status,'pending');
  assert.equal(await value(U.device,'select count(*)::int from public.attempts'),0);
  await denied(as(U.device,"select public.save_attempt($1,'lop1-bai01','[\"m1\"]')",[S2]),/ZM_BLOCK_BR_PH_02/);
  await denied(as(U.device,'select public.approve_device($1,$2)',[session.session_id,U.device]),/ZM_BLOCK_BR_LP_01/);
  await value(U.teacher,'select public.approve_device($1,$2)',[session.session_id,U.device]);
  assert.equal((await value(U.device,'select public.join_session($1)',[session.join_code])).status,'approved');
  assert.equal(await value(U.device,'select count(*)::int from public.attempts'),1);
  assert.equal(await value(U.device,'select count(*)::int from public.project_groups'),1);
  assert.equal(await value(U.device,'select count(*)::int from public.notebook_revisions'),1);
  assert.equal(await value(U.parent,'select count(*)::int from public.project_groups'),1);
  assert.equal(await value(U.parent,'select count(*)::int from public.notebook_revisions'),1);
  assert.equal(await value(U.stranger,'select count(*)::int from public.project_groups'),0);
  await denied(as(U.device,'select public.read_evaluation_comment($1)',[e2.id]),/ZM_BLOCK_BR_LP_01/);

  await sql(`update public.enrollments set status='left',left_on=current_date where student_id=$1 and class_id=$2`,[S2,X]);
  await sql(`insert into public.enrollments (student_id,class_id) values ($1,$2)`,[S2,Y]);
  assert.equal(await value(U.device,'select count(*)::int from public.attempts'),0);
  assert.equal(await value(U.device,'select count(*)::int from public.project_groups'),0);
  await denied(as(U.device,"select public.save_attempt($1,'lop1-bai01','[\"m1\"]')",[S2]),/ZM_BLOCK_BR_PH_02/);
  assert.equal(await value(U.otherParent,'select count(*)::int from public.attempts'),1);
});
