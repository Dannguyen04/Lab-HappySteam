// Phiếu 53: thực thi migration và RPC trên PGlite cục bộ, không chạm Supabase thật.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const migrationPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../supabase/migrations');
async function loadPGlite() {
  try { return (await import('@electric-sql/pglite')).PGlite; }
  catch (cause) {
    if (!process.env.PGLITE_DIR) throw new Error('Thiếu PGlite tạm', { cause });
    return (await import(pathToFileURL(createRequire(path.join(process.env.PGLITE_DIR, 'package.json'))
      .resolve('@electric-sql/pglite')).href)).PGlite;
  }
}
const db = new (await loadPGlite())();
await db.exec(`
  create schema auth;
  create table auth.users(id uuid primary key, email text);
  create function auth.uid() returns uuid language sql stable as
    $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  create function auth.jwt() returns jsonb language sql stable as
    $$ select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb $$;
  create role anon nologin;
  create role authenticated nologin;
  grant usage on schema auth to anon, authenticated;
`);
for (const filename of readdirSync(migrationPath).filter(f => f.endsWith('.sql')).sort()) {
  if (filename.includes('00005_'))
    await db.exec('grant select, insert, update, delete on all tables in schema public to anon, authenticated');
  await db.exec(readFileSync(path.join(migrationPath, filename), 'utf8'));
}
const U = {
  owner: ['00000000-0000-0000-0000-000000005301', 'owner@example.org'],
  assistant: ['00000000-0000-0000-0000-000000005302', 'assistant@example.org'],
  stranger: ['00000000-0000-0000-0000-000000005303', 'stranger@example.org'],
};
const sql = async (query, params = []) => (await db.query(query, params)).rows;
async function as(actor, query, params = []) {
  const [uid, email] = U[actor];
  await sql("select set_config('request.jwt.claim.sub',$1,false)", [uid]);
  await sql("select set_config('request.jwt.claims',$1,false)", [JSON.stringify({ sub: uid, email })]);
  await db.exec('set role authenticated');
  try { return await sql(query, params); }
  finally { await db.exec('reset role'); }
}
const val = async (actor, query, params = []) => Object.values((await as(actor, query, params))[0])[0];
for (const [uid, email] of Object.values(U)) {
  await sql('insert into auth.users(id,email) values($1,$2)', [uid,email]);
  await sql('insert into public.profiles(id,full_name) values($1,$2)', [uid,email.split('@')[0]]);
}
const mkClass = async (name, grade = 1) => (await sql(`insert into public.classes(name,grade,school_year,week1_monday)
  values($1,$2,'2026-2027',date_trunc('week',now())::date) returning id`, [name,grade]))[0].id;
const source = await mkClass('53-A');
const target = await mkClass('53-B');
const otherGrade = await mkClass('53-C',3);
for (const id of [source,target,otherGrade]) {
  await sql("insert into public.class_staff(class_id,teacher_id,role) values($1,$2,'owner')", [id,U.owner[0]]);
}
const student = (await sql("insert into public.students(nickname,avatar) values('Bình','🐰') returning id"))[0].id;
const oldEnrollment = (await sql('insert into public.enrollments(student_id,class_id) values($1,$2) returning id',
  [student,source]))[0].id;
await sql(`insert into public.lessons(id,grade,term,week,title,type,current_version) values
  ('test53-core',1,1,5,'Bài chính','model',1),('test53-next',1,1,6,'Bài mở sớm','model',1),
  ('test53-grade3',3,1,5,'Bài lớp 3','model',1),
  ('test53-soon',1,1,20,'Chưa có nội dung','model',null)`);
await sql(`insert into public.lesson_versions(lesson_id,version,missions) values
 ('test53-core',1,'[{"code":"m1","kind":"core"},{"code":"m2","kind":"core"}]'),
 ('test53-next',1,'[]'),('test53-grade3',1,'[]')`);

test('53/S-09: mỗi ghi danh tự có mã 8 ký tự, phiếu in chỉ có tên ngắn và con vật', async () => {
  const [code] = await sql("select code from public.invite_codes where student_id=$1 and status='valid'", [student]);
  assert.match(code.code, /^[A-HJKMNP-Z2-9]{8}$/);
  const slips = await val('owner','select public.class_invite_slips($1)',[source]);
  assert.deepEqual(slips,[{ avatar:'🐰', nickname:'Bình', code:code.code }]);
  await val('owner','select public.class_invite_slips($1)',[source]);
  assert.equal((await sql('select count(*)::int n from public.invite_codes where student_id=$1',[student]))[0].n,1);
  await assert.rejects(val('stranger','select public.class_invite_slips($1)',[source]),/ZM_BLOCK_BR_LP_01/);
});

test('53/BR-LP-04: mời, thu hồi, từ chối, nhận theo email; chặn người ngoài', async () => {
  await assert.rejects(val('stranger',"select public.invite_class_assistant($1,'assistant@example.org')",[source]),/ZM_BLOCK_BR_LP_04/);
  const first = await val('owner',"select public.invite_class_assistant($1,'assistant@example.org')",[source]);
  const duplicate = await val('owner',"select public.invite_class_assistant($1,'ASSISTANT@example.org')",[source]);
  assert.equal(first.invitation_id,duplicate.invitation_id);
  const inbox = await val('assistant','select public.my_class_invitations()');
  assert.equal(inbox[0].id,first.invitation_id);
  assert.deepEqual(await val('stranger','select public.my_class_invitations()'),[]);
  await assert.rejects(val('stranger','select public.respond_class_invitation($1,true)',[first.invitation_id]),/ZM_INVITE_UNAVAILABLE/);
  await val('owner','select public.revoke_class_invitation($1)',[first.invitation_id]);
  await assert.rejects(val('assistant','select public.respond_class_invitation($1,true)',[first.invitation_id]),/ZM_INVITE_UNAVAILABLE/);
  const declined = await val('owner',"select public.invite_class_assistant($1,'assistant@example.org')",[source]);
  assert.equal((await val('assistant','select public.respond_class_invitation($1,false)',[declined.invitation_id])).accepted,false);
  const accepted = await val('owner',"select public.invite_class_assistant($1,'assistant@example.org')",[source]);
  assert.equal((await val('assistant','select public.respond_class_invitation($1,true)',[accepted.invitation_id])).accepted,true);
  assert.equal(await val('assistant','select public.is_staff($1)',[source]),true);
  const assistantState = await val('assistant','select public.class_management_state($1)',[source]);
  assert.equal(assistantState.owner,false);
  assert.deepEqual(assistantState.invitations,[]);
  await assert.rejects(val('owner',"select public.invite_class_assistant($1,'assistant@example.org')",[source]),/ZM_ALREADY_STAFF/);
});

test('53/BR-LP-03: cảnh báo bài core chưa chấm, đóng buổi và khóa mở buổi', async () => {
  await sql(`insert into public.attempts(enrollment_id,lesson_id,version,missions_done)
    values($1,'test53-core',1,'{"m1":"x","m2":"x"}')`,[oldEnrollment]);
  const state = await val('owner','select public.class_management_state($1)',[source]);
  assert.equal(state.ungraded_core,1);
  assert.equal(state.owner,true);
  assert.equal(state.students[0].nickname,'Bình');
  await assert.rejects(val('stranger','select public.class_management_state($1)',[source]),/ZM_BLOCK_BR_LP_01/);
  const session = await val('owner','select public.open_session($1)',[source]);
  const result = await val('owner',"select public.set_teacher_class_status($1,'ended')",[source]);
  assert.deepEqual([result.status,result.ungraded_core,result.warnings],[ 'ended',1,['BR-LP-03'] ]);
  assert.equal((await sql('select closed_at is not null as closed from public.class_sessions where id=$1',[session.session_id]))[0].closed,true);
  await assert.rejects(val('owner','select public.open_session($1)',[source]),/ZM_BLOCK_BR_LP_01/);
  await assert.rejects(val('assistant',"select public.set_teacher_class_status($1,'open')",[source]),/ZM_BLOCK_BR_LP_04/);
  assert.equal((await val('owner',"select public.set_teacher_class_status($1,'open')",[source])).status,'open');
  const attemptId = (await sql('select id from public.attempts where enrollment_id=$1',[oldEnrollment]))[0].id;
  await sql("insert into public.evaluations(attempt_id,level,graded_by) values($1,'HT',$2)",[attemptId,U.owner[0]]);
  assert.equal((await val('owner','select public.class_management_state($1)',[source])).ungraded_core,0);
});

test('53/mở sớm: đúng khối, chỉ giáo viên lớp và lớp đang mở', async () => {
  await assert.rejects(val('stranger',"select public.unlock_class_lesson($1,'test53-next')",[source]),/ZM_BLOCK_BR_LP_01/);
  await assert.rejects(val('owner',"select public.unlock_class_lesson($1,'test53-grade3')",[source]),/ZM_INVALID_INPUT/);
  await assert.rejects(val('owner',"select public.unlock_class_lesson($1,'test53-soon')",[source]),/ZM_INVALID_INPUT/);
  assert.equal((await val('assistant',"select public.unlock_class_lesson($1,'test53-next')",[source])).ok,true);
  await val('assistant',"select public.unlock_class_lesson($1,'test53-next')",[source]);
  assert.equal((await sql("select count(*)::int n from public.class_unlocks where class_id=$1 and lesson_id='test53-next'",[source]))[0].n,1);
  await val('owner',"select public.set_teacher_class_status($1,'ended')",[source]);
  await assert.rejects(val('owner',"select public.unlock_class_lesson($1,'test53-next')",[source]),/ZM_INVALID_INPUT/);
  await val('owner',"select public.set_teacher_class_status($1,'open')",[source]);
});

test('53/§9: chuyển cùng khối tạo ghi danh mới và chép tiến độ, không sao chép đánh giá', async () => {
  await assert.rejects(val('assistant','select public.transfer_class_student($1,$2)',[student,target]),/ZM_BLOCK_BR_LP_04/);
  await assert.rejects(val('owner','select public.transfer_class_student($1,$2)',[student,otherGrade]),/ZM_INVALID_INPUT/);
  const result = await val('owner','select public.transfer_class_student($1,$2)',[student,target]);
  assert.notEqual(result.enrollment_id,oldEnrollment);
  const old = (await sql('select status from public.enrollments where id=$1',[oldEnrollment]))[0];
  assert.equal(old.status,'left');
  const [copied] = await sql('select missions_done,lesson_id from public.attempts where enrollment_id=$1',[result.enrollment_id]);
  assert.deepEqual(copied.missions_done,{m1:'x',m2:'x'});
  assert.equal((await sql('select count(*)::int n from public.evaluations ev join public.attempts a on a.id=ev.attempt_id where a.enrollment_id=$1',[result.enrollment_id]))[0].n,0);
  assert.equal((await sql('select count(*)::int n from public.evaluations ev join public.attempts a on a.id=ev.attempt_id where a.enrollment_id=$1',[oldEnrollment]))[0].n,1);
  assert.match((await sql('select code from public.invite_codes where student_id=$1 and status=\'valid\'',[student]))[0].code,/^[A-Z2-9]{8}$/);
});

test('53/§9: học sinh rời lớp được thêm lại, chặn trùng ghi danh đang học', async () => {
  await assert.rejects(val('owner','select public.reenroll_class_student($1,$2)',[source,student]),/ZM_INVALID_INPUT/);
  await sql("update public.enrollments set status='left',left_on=current_date where student_id=$1 and status='active'",[student]);
  const reentry = await val('owner','select public.reenroll_class_student($1,$2)',[source,student]);
  assert.equal(reentry.enrollment_id,oldEnrollment);
  assert.equal((await sql('select status from public.enrollments where id=$1',[oldEnrollment]))[0].status,'active');
  await assert.rejects(val('assistant','select public.reenroll_class_student($1,$2)',[source,student]),/ZM_BLOCK_BR_LP_04/);
});

test('53/BR-LP-04/05: chủ không tự rời, chuyển vai nguyên tử, phụ được rời hoặc bị gỡ', async () => {
  await assert.rejects(val('owner',"select public.manage_class_staff($1,$2,'leave')",[source,U.owner[0]]),/ZM_BLOCK_BR_LP_05/);
  await assert.rejects(val('assistant',"select public.manage_class_staff($1,$2,'transfer')",[source,U.owner[0]]),/ZM_BLOCK_BR_LP_04/);
  await val('owner',"select public.manage_class_staff($1,$2,'transfer')",[source,U.assistant[0]]);
  assert.equal(await val('assistant','select public.is_owner($1)',[source]),true);
  assert.equal(await val('owner','select public.is_owner($1)',[source]),false);
  assert.equal((await sql("select count(*)::int n from public.class_staff where class_id=$1 and role='owner' and to_date is null",[source]))[0].n,1);
  await val('owner',"select public.manage_class_staff($1,$2,'leave')",[source,U.owner[0]]);
  assert.equal(await val('owner','select public.is_staff($1)',[source]),false);
  const invite = await val('assistant',"select public.invite_class_assistant($1,'owner@example.org')",[source]);
  await val('owner','select public.respond_class_invitation($1,true)',[invite.invitation_id]);
  await val('assistant',"select public.manage_class_staff($1,$2,'remove')",[source,U.owner[0]]);
  assert.equal(await val('owner','select public.is_staff($1)',[source]),false);
});
