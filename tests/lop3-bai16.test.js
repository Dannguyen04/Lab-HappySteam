// Chạy: node tests/lop3-bai16.test.js – cấu hình và bộ mô phỏng Bài 16 lớp 3 (Xe chở tên lửa vũ trụ), chỉ dùng Node.js built-in.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const context = { window: { addEventListener() {} }, document: { getElementById() { return null; } }, performance: { now: () => 0 }, Math };
for (const f of ['js/blocks-engine.js', 'js/lop3-bai16/lesson.js', 'js/lesson-engine.js', 'js/lop3-bai16/launch-transport-engine.js'])
  vm.runInNewContext(fs.readFileSync(path.join(root, f), 'utf8'), context);
const L = context.window.LESSON;
const T = context.window.BLOCK_TEMPLATES;
const Engine = context.window.LaunchTransportEngine;
assert.equal(L.id, 'lop3-bai16');
assert.equal(L.blocks.sample.length, 10, 'Mẫu có đúng 10 khối');

const tpl = s => (Array.isArray(s) ? { ...T[s[0]], ...s[1] } : { ...T[s] });
// Chương trình mẫu, thay thời gian Chờ (wait) và khối hiển thị sau khi dừng
const program = (wait, face = 'displaySad') => L.blocks.sample.map(s => {
  if (Array.isArray(s)) return tpl(['wait', { duration: wait }]);
  if (s === 'displaySad') return tpl(face);
  return tpl(s);
});
function run(prog, { advanced = false, seconds = 20, sim = new Engine() } = {}) {
  let state;
  sim.onMissionUpdate = s => (state = s);
  if (advanced) sim.setAdvanced(true);
  sim.setProgram(prog);
  sim.start();
  const events = [];
  sim.emit = (type, data) => events.push(type);
  for (let t = 0; t < seconds && sim.running; t += 0.02) sim.advance(0.02);
  sim.checkMissions();
  return { sim, state, events };
}

// Khối lệnh hiển thị mặt cười / mặt buồn có trong bộ khối và mẫu
assert.equal(T.displaySmile.icon, 'smile');
assert.equal(T.displaySad.icon, 'sad');

// 1. Mẫu nguyên bản (Chờ 3 giây) đạt M2 nhưng KHÔNG đạt M3: xe chạy quá bệ phóng ở cự ly Vừa
let r = run(program(3), { seconds: 12 });
assert.equal(r.state.m2, true, 'Chạy đúng chương trình mẫu thì xong NV2');
assert.equal(r.state.m3, false, 'Mẫu 3 giây chạy quá bệ nên chưa đạt NV3');
assert.ok(r.events.includes('miss'), 'Chạy quá bệ có thông báo thất bại');
assert.equal(r.sim.skid || r.sim.failed || r.events.includes('miss'), true);

// 2. Chỉnh Chờ 2 giây: dừng đúng ô, tên lửa phóng, đạt M3
r = run(program(2));
assert.equal(r.state.m3, true, 'Chờ 2 giây thì dừng đúng ô bệ phóng');
assert.ok(r.events.includes('launch'), 'Tên lửa phóng');
assert.equal(r.sim.launched, true);
assert.ok(r.sim.launchProgress(r.sim.launchAt + 5) === 1);

// 3. Dừng thiếu (1 giây) cũng thất bại, màn LED báo mặt buồn
r = run(program(1), { seconds: 5 });
assert.equal(r.state.m3, false);
assert.equal(r.sim.led, 'sad');
assert.equal(r.sim.reason, 'short');

// 4. Đổi mặt buồn thành mặt cười khi đúng: vẫn đạt M3
const sim2 = new Engine();
r = run(program(2, 'displaySmile'), { sim: sim2 });
assert.equal(r.state.m3, true);
assert.equal(sim2.led, 'smile');

// 5. Thiếu khối Dừng: xe chạy hết đường lăn
const noStop = program(3).filter(b => b.type !== 'stop');
r = run(noStop, { seconds: 12 });
assert.equal(r.state.m3, false);
assert.equal(r.sim.reason, 'boundary');

// 6. Nâng cao: bệ phóng gần/vừa/xa mỗi lượt chạy; chạy sai cự ly thì trượt, tính đúng cả ba thì đạt M5
const adv = new Engine();
adv.onMissionUpdate = () => {};
const go = wait => run(program(wait), { advanced: true, sim: adv });
r = go(2); // lượt 1: Vừa
assert.equal(adv.padKey, 'mid');
assert.equal(adv.launched, true);
assert.equal(r.state.m5, false);
r = go(2); // lượt 2: Xa – dùng lại 2 giây thì trượt
assert.equal(adv.padKey, 'far');
assert.equal(adv.launched, false, 'Cự ly Xa mà chỉ chờ 2 giây thì chưa tới bệ');
assert.equal(adv.reason, 'short');
r = go(3); // lượt 3: Gần – chờ 3 giây thì quá bệ
assert.equal(adv.padKey, 'near');
assert.equal(adv.reason, 'over');
assert.equal(r.state.m5, false);
r = go(3); // lượt 4: Vừa lần nữa
r = go(3); // lượt 5: Xa – đúng
assert.equal(adv.padKey, 'far');
assert.equal(adv.launched, true);
r = go(1); // lượt 6: Gần – đúng
assert.equal(adv.padKey, 'near');
assert.equal(r.state.m5, true, 'Dừng đúng cả ba cự ly thì xong NV5');

console.log('PASS: lop3-bai16 – cấu hình, mẫu đạt M2, M3 chỉnh Chờ 2 giây, Nâng cao gần/vừa/xa.');

// Mẫu nguyên bản nhưng đổi mặt buồn thành mặt cười vẫn tính là đúng mẫu (M2)
r = run(program(3, 'displaySmile'), { seconds: 12 });
assert.equal(r.state.m2, true, 'Đổi mặt cười/buồn vẫn là chương trình mẫu');
