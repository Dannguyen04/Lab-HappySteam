// Phiếu 44: kiểm thử migration S-05/S-06 trên PGlite, không kết nối Supabase thật.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const directory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../supabase/migrations');
async function getPGlite() {
  try { return (await import('@electric-sql/pglite')).PGlite; }
  catch (cause) {
    if (!process.env.PGLITE_DIR) throw new Error('Set PGLITE_DIR to temporary PGlite install', { cause });
    const resolved = createRequire(path.join(process.env.PGLITE_DIR, 'package.json')).resolve('@electric-sql/pglite');
    return (await import(pathToFileURL(resolved).href)).PGlite;
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
const migrations = readdirSync(directory).filter(f => f.endsWith('.sql')).sort();
for (const filename of migrations) {
  if (filename.includes('00005_')) {
    // Supabase tạo grants trước khi bản 0005 thu hồi quyền đọc cột nhạy cảm.
    await db.exec('grant select, insert, update, delete on all tables in schema public to anon, authenticated');
  }
  await db.exec(readFileSync(path.join(directory, filename), 'utf8'));
}
const U = {
  owner: '00000000-0000-0000-0000-000000000011',
  outsider: '00000000-0000-0000-0000-000000000012',
  device: '00000000-0000-0000-0000-000000000013',
};
const sql = async (query, params = []) => (await db.query(query, params)).rows;
async function as(uid, query, params = [], claims = {}) {
  await sql("select set_config('request.jwt.claim.sub', $1, false)", [uid || '']);
  await sql("select set_config('request.jwt.claims', $1, false)", [JSON.stringify({ sub: uid, ...claims })]);
  await db.exec('set role authenticated');
  try { return await sql(query, params); }
  finally { await db.exec('reset role'); }
}
const val = async (uid, query, params = [], claims = {}) =>
  Object.values((await as(uid, query, params, claims))[0])[0];
const save = (uid, classId, names, breaks = [], extra = {}) =>
  val(uid, `select public.save_teacher_class(
    $1::uuid,$2,$3::smallint,$4,$5::date,$6::jsonb,$7::jsonb)`,
  [classId, extra.name || 'Lớp 1A', extra.grade || 1, '2026-2027', '2026-09-07',
    JSON.stringify(breaks), JSON.stringify(names)], extra.claims || {});

await sql('insert into auth.users(id) select unnest($1::uuid[])', [Object.values(U)]);
await sql("insert into public.profiles(id,full_name) values($1,'Cô A'),($2,'Cô B')", [U.owner,U.outsider]);
let classId, studentIds, session, pick;

test('S-05 tạo lớp, tự gán chủ lớp, tuần nghỉ và học sinh với avatar riêng', async () => {
  const result = await save(U.owner, null,
    [{ nickname: 'An', avatar: '🐱' }, { nickname: 'Bình', avatar: '🐶' }],
    [{ monday: '2027-02-08', note: 'Tết' }]);
  assert.equal(result.ok, true);
  classId = result.class_id;
  assert.deepEqual(result.warnings, []);
  assert.equal((await sql('select count(*)::int n from public.class_staff where class_id=$1 and teacher_id=$2 and role=$3',
    [classId,U.owner,'owner']))[0].n, 1);
  assert.equal((await sql('select count(*)::int n from public.class_breaks where class_id=$1', [classId]))[0].n, 1);
  studentIds = (await sql(`select s.id, s.nickname, s.avatar from public.students s
    join public.enrollments e on e.student_id = s.id where e.class_id=$1 order by s.nickname`, [classId]));
  assert.deepEqual(studentIds.map(s => s.avatar), ['🐱', '🐶']);
  assert.equal((await as(U.outsider,'select count(*)::int n from public.classes'))[0].n, 0);
});

test('BR-LP-02 chặn tên trùng khi sửa hoặc tạo lớp, rollback nguyên tử rồi nhận tên phân biệt', async () => {
  await assert.rejects(as(U.owner, `select public.save_teacher_class_before_unique_names(
    null::uuid,'Không được gọi',1::smallint,'2026-2027','2026-09-07'::date,'[]'::jsonb,'[]'::jsonb)`),
    /permission denied/i, 'RPC cũ không được gọi trực tiếp để bỏ qua kiểm tra trùng tên');
  await assert.rejects(save(U.owner, classId, [
    { id: studentIds[0].id, nickname: ' An  ', avatar: '🐻' },
    { nickname: 'an', avatar: '🦊' }
  ], [], { name: 'Không được lưu' }), /ZM_BLOCK_BR_LP_02/);
  assert.equal((await sql('select name from public.classes where id=$1',[classId]))[0].name, 'Lớp 1A');
  assert.equal((await sql('select count(*)::int n from public.class_breaks where class_id=$1',[classId]))[0].n, 1);
  await assert.rejects(save(U.owner, null, [
    { nickname: 'Bình', avatar: '🐻' }, { nickname: ' bình ', avatar: '🦊' }
  ]), /ZM_BLOCK_BR_LP_02/);
  const edited = await save(U.owner, classId, [
    { id: studentIds[0].id, nickname: 'An B.', avatar: '🐻' },
    { nickname: 'An T.', avatar: '🦊' }
  ], [], { name: 'Lớp 1A mới' });
  assert.deepEqual(edited.warnings, []);
  assert.equal((await sql('select name from public.classes where id=$1',[classId]))[0].name,'Lớp 1A mới');
  assert.equal((await sql("select count(*)::int n from public.enrollments where class_id=$1 and status='left'",
    [classId]))[0].n,1);
  assert.equal((await sql('select count(*)::int n from public.class_breaks where class_id=$1',[classId]))[0].n,0);
  assert.equal((await sql('select avatar from public.students where id=$1',[studentIds[0].id]))[0].avatar,'🐻');
});

test('S-05 chặn người ngoài, máy ẩn danh, dữ liệu avatar trùng và lịch sai', async () => {
  await assert.rejects(save(U.outsider, classId, []), /ZM_BLOCK_BR_LP_04/);
  await assert.rejects(save(U.device, null, [], [], { claims: { is_anonymous: true }}), /ZM_BLOCK_BR_LP_01/);
  await assert.rejects(save(U.owner, null, [
    { nickname:'A', avatar:'🐱' }, { nickname:'B', avatar:'🐱' }]), /ZM_INVALID_INPUT/);
  await assert.rejects(save(U.owner, null, [], [{ monday:'2026-09-09' }]), /ZM_INVALID_INPUT/);
  assert.equal((await sql('select count(*)::int n from public.classes'))[0].n, 1,
    'Failed saves must roll back the class creation');
});

test('S-06 màn chiếu đọc danh sách máy đã duyệt; học sinh/người ngoài bị chặn', async () => {
  session = await val(U.owner,'select public.open_session($1)',[classId]);
  const roster = await val(U.device,'select public.session_roster($1)',[session.join_code]);
  pick = roster.roster[0].pick;
  assert.equal((await val(U.device,'select public.request_join($1,$2)',[session.join_code,pick])).status,'pending');
  assert.equal((await as(U.owner,'select * from public.session_attendees($1)',[session.session_id])).length,0);
  await val(U.owner,'select public.approve_device($1,$2)',[session.session_id,U.device]);
  assert.equal((await val(U.device,'select public.join_session($1)',[session.join_code])).ok,true);
  await sql(`insert into public.lessons(id,grade,term,week,title,type) values
    ('lop1-bai01',1,1,1,'Bài mở','model'),('lop1-bai35',1,2,35,'Bài khóa','model'),
    ('lop3-bai01',3,1,1,'Khác lớp','model')`);
  const state = await val(U.device,'select public.student_home_state($1,$2)',[studentIds[0].id,session.session_id]);
  assert.equal(state.class_id, classId);
  assert.equal(state.grade, 1);
  assert.equal(state.lessons['lop1-bai01'], true);
  assert.equal(state.lessons['lop1-bai35'], false);
  assert.equal(state.lessons['lop3-bai01'], undefined);
  await assert.rejects(val(U.outsider,'select public.student_home_state($1,$2)',
    [studentIds[0].id,session.session_id]), /ZM_BLOCK_DEVICE_NOT_APPROVED/);
  await assert.rejects(val(U.device,'select public.student_home_state($1,$2)',
    [studentIds[1].id,session.session_id]), /ZM_BLOCK_DEVICE_NOT_APPROVED/);
  const attendees = await as(U.owner,'select * from public.session_attendees($1)',[session.session_id]);
  assert.equal(attendees.length,1);
  assert.equal(attendees[0].nickname,roster.roster[0].nickname);
  assert.ok(attendees[0].device_tag);
  await assert.rejects(as(U.outsider,'select * from public.session_attendees($1)',[session.session_id]), /ZM_BLOCK_BR_LP_01/);
  await assert.rejects(as(U.device,'select * from public.session_attendees($1)',[session.session_id],{ is_anonymous: true }), /ZM_BLOCK_BR_LP_01/);
});

test('Phiếu 51/2: join_session sai mã và máy chưa duyệt cùng lỗi, đều ghi lượt sai', async () => {
  const wrong = session.join_code === '9999' ? '9998' : '9999';
  const bad = await val(U.outsider, 'select public.join_session($1)', [wrong]);
  const unapproved = await val(U.outsider, 'select public.join_session($1)', [session.join_code]);
  assert.deepEqual([bad.ok, bad.error], [false, 'ZM_BLOCK_BR_BH_01']);
  assert.deepEqual(unapproved, bad, 'Không phân biệt mã hợp lệ chưa được duyệt');
  assert.equal((await sql('select count(*)::int n from private.join_failures where auth_uid=$1',[U.outsider]))[0].n,2);
  for (let i = 0; i < 3; i++) {
    assert.equal((await val(U.outsider,'select public.join_session($1)',[wrong])).ok,false);
  }
  await assert.rejects(val(U.outsider,'select public.join_session($1)',[session.join_code]), /ZM_BLOCK_RATE_LIMIT/);
  assert.equal((await val(U.device,'select public.join_session($1)',[session.join_code])).ok,true,
    'Máy đã duyệt vẫn vào được khi một UID khác bị khóa');
});

test('Phiếu 51/1: roster chỉ hiện với mã buổi đang mở; chặn 31 lần sai từ UID luân phiên', async () => {
  await sql("update private.join_failures set attempted_at=now()-interval '6 minutes'");
  const expired = session.join_code === '9999' ? '9998' : '9999';
  await sql(`insert into public.class_sessions(class_id,join_code,opened_by,opened_at,expires_at)
    values($1,$2,$3,now()-interval '90 minutes',now()-interval '1 minute')`,[classId,expired,U.owner]);
  const hidden = await val(U.device,'select public.session_roster($1)',[expired]);
  assert.equal(hidden.ok,false);
  assert.equal(Object.hasOwn(hidden,'roster'),false);
  assert.equal((await val(U.device,'select public.session_roster($1)',[session.join_code])).roster.length,2);
  await sql("update private.join_failures set attempted_at=now()-interval '6 minutes'");
  const wrong = session.join_code === '0000' ? '0001' : '0000';
  for (let i = 0; i < 31; i++) {
    const uid = `00000000-0000-0000-0000-${String(4000+i).padStart(12,'0')}`;
    const result = await val(uid,'select public.session_roster($1)',[wrong]);
    assert.equal(result.error, 'ZM_BLOCK_BR_BH_01');
  }
  const [state] = await sql('select blocked_until > now() as blocked from private.join_global_rate');
  assert.equal(state.blocked,true);
  await assert.rejects(val(U.device,'select public.session_roster($1)',[session.join_code]), /ZM_BLOCK_RATE_LIMIT/);
  await assert.rejects(val(U.owner,'select public.join_session($1)',[session.join_code]), /ZM_BLOCK_RATE_LIMIT/);
  await sql("update private.join_global_rate set blocked_until=now()-interval '1 second'");
  await sql("update private.join_failures set attempted_at=now()-interval '6 minutes'");
  assert.equal((await val(U.device,'select public.session_roster($1)',[session.join_code])).ok,true);
});

test('Phiếu 51/3: NULL grade, JSON không phải mảng, >60 nghỉ, nghỉ trùng báo ZM_INVALID_INPUT', async () => {
  const call = (grade, students, breaks) => val(U.owner, `select public.save_teacher_class(
    null::uuid,'Lớp thử',$1::smallint,'2026-2027','2026-09-07'::date,$2::jsonb,$3::jsonb)`,
    [grade,JSON.stringify(breaks),JSON.stringify(students)]);
  await assert.rejects(call(null,[],[]), /ZM_INVALID_INPUT/);
  await assert.rejects(call(1,{ nickname:'A' },[]), /ZM_INVALID_INPUT/);
  await assert.rejects(call(1,[],{ monday:'2026-09-14' }), /ZM_INVALID_INPUT/);
  await assert.rejects(call(1,[],Array.from({length:61},(_,i)=>({ monday:'2026-09-14',note:String(i) }))),/ZM_INVALID_INPUT/);
  await assert.rejects(call(1,[],[{monday:'2026-09-14'},{monday:'2026-09-14'}]), /ZM_INVALID_INPUT/);
  assert.equal((await sql('select count(*)::int n from public.classes'))[0].n,1,'Không lưu lớp lỗi');
});

test('Phiếu 51/4: chặn lớp hoạt động thứ 21, vẫn cho sửa lớp hoặc tạo sau khi kết thúc', async () => {
  await sql(`insert into public.classes(name,grade,school_year,week1_monday)
    select 'Lớp thêm ' || n,1,'2026-2027','2026-09-07'::date from generate_series(1,19) n`);
  await sql(`insert into public.class_staff(class_id,teacher_id,role)
    select id,$1,'owner' from public.classes where name like 'Lớp thêm %'`,[U.owner]);
  assert.equal((await sql(`select count(*)::int n from public.class_staff cs join public.classes c
    on c.id=cs.class_id where cs.teacher_id=$1 and c.status='open'`,[U.owner]))[0].n,20);
  await assert.rejects(save(U.owner,null,[]), /ZM_LIMIT/);
  assert.equal((await save(U.owner,classId,[],[],{name:'Lớp được sửa'})).ok,true);
  await sql("update public.classes set status='ended' where name='Lớp thêm 1'");
  assert.equal((await save(U.owner,null,[],[],{name:'Lớp thứ 20 mới'})).ok,true);
});
