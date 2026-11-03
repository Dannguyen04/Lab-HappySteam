// Chạy: node tests/lop3-bai05.test.js – cấu hình và bộ mô phỏng Bài 5 lớp 3 (Xe đổ rác), chỉ dùng Node.js built-in.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const context = { window: { addEventListener() {} }, document: { getElementById() { return null; } }, performance: { now: () => 0 }, Math };
for (const f of ['js/blocks-engine.js', 'js/lop3-bai05/lesson.js', 'js/lesson-engine.js', 'js/lop3-bai05/truck-engine.js'])
  vm.runInNewContext(fs.readFileSync(path.join(root, f), 'utf8'), context);
const L = context.window.LESSON;
assert.equal(L.id, 'lop3-bai05');
assert.ok(L.blocks.sample.length > 1, 'Có chương trình mẫu');

// Chạy chương trình mẫu đến hết → NV2
const T = context.window.BLOCK_TEMPLATES;
const program = L.blocks.sample.map(s => (Array.isArray(s) ? { ...T[s[0]], ...s[1] } : { ...T[s] }));
const sim = new context.window.GarbageTruckEngine();
let state;
sim.onMissionUpdate = s => (state = s);
sim.setProgram(program);
sim.start();
for (let t = 0; t < 60 && sim.running; t += 0.02) {
  if (sim.waitingPress) sim.press();
  sim.advance(0.02);
}
sim.checkMissions();
assert.equal(state.m2, true, 'Chạy đúng chương trình mẫu thì xong NV2');

// Chạy một chương trình tự lắp: mảng [khối, thời gian chờ]
function run(adv, steps, prior) {
  const e = new context.window.GarbageTruckEngine();
  let st;
  e.onMissionUpdate = s => (st = s);
  if (adv) e.setAdvanced(true);
  if (prior) Object.assign(e.done, prior);
  e.setProgram(steps.map(s => (Array.isArray(s) ? { ...T[s[0]], duration: s[1] } : { ...T[s] })));
  e.start();
  for (let t = 0; t < 40 && e.running; t += 0.02) e.advance(0.02);
  e.checkMissions();
  return { e, st };
}
const park = secs => ['start', 'highSpeed', ['wait', secs], 'motorStop'];
// M3 (tải nhẹ): 3 giây đạt, 2 giây chưa tới, 4 giây đâm dải chắn, thiếu khối Dừng cũng đâm
let r = run(false, park(3));
assert.equal(r.st.m3, true, '3 giây đỗ đúng ô');
assert.ok(r.e.parked && !r.e.crashed);
r = run(false, park(2));
assert.ok(!r.st.m3 && !r.e.crashed && r.e.x < 5.5, '2 giây xe chưa tới ô');
r = run(false, park(4));
assert.ok(!r.st.m3 && r.e.crashed, '4 giây xe vượt ô và đâm dải chắn');
r = run(false, ['start', 'highSpeed', ['wait', 3]]);
assert.ok(!r.st.m3 && r.e.crashed, 'Không có khối Dừng: xe chạy tiếp và đâm');
// Chế độ cơ bản không bao giờ chở nặng
r = run(false, park(2), { m3: true });
assert.equal(r.e.heavy, false);
// Nâng cao: chưa đạt NV3 thì lượt đầu nhẹ; sau NV3 là lượt nặng
let adv = run(true, park(3));
assert.equal(adv.st.m3, true);
assert.equal(adv.e.heavy, false, 'Lượt đầu tải nhẹ');
r = run(true, park(3), { m3: true });
assert.equal(r.e.heavy, true, 'Sau NV3 là lượt nặng');
assert.ok(r.e.crashed && !r.st.m5, 'Tải nặng chạy 3 giây thì trôi quá ô');
r = run(true, park(1), { m3: true });
assert.ok(!r.st.m5 && !r.e.crashed, 'Tải nặng 1 giây thì chưa tới ô');
r = run(true, park(2), { m3: true });
assert.equal(r.st.m5, true, 'Tải nặng 2 giây thì vừa ô');
assert.ok(Math.abs(r.e.x - 6) < 0.05);
// Vòng lặp mẫu: xe đâm dải chắn nhưng NV2 vẫn giữ
r = run(false, ['start', 'repeatStart', 'highSpeed', 'repeatEnd']);
assert.ok(r.st.m2 && r.e.crashed);

console.log('PASS: lop3-bai05 – cấu hình, chương trình mẫu, NV2.');
