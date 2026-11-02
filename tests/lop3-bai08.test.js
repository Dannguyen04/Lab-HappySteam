// Chạy: node tests/lop3-bai08.test.js – dữ liệu 3D và bộ mô phỏng Lớp 3 Bài 8 (giải cứu máy bay), chỉ dùng Node.js built-in.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const plan = require('../scripts/lop3-bai08-plan');

const root = path.join(__dirname, '..');
(async () => {
const context = {
  window: { addEventListener() {} },
  document: { getElementById() { return null; } },
  performance: { now: () => 0 },
  Math
};
await require('./helpers/lesson-3d')(context, 'lop3/bai08');
const model = context.window.LESSON_3D_DATA;
assert.equal(model.instances.length, 101, 'Giàn bay có 101 linh kiện');
assert.equal(model.steps, plan.finalStep, 'Số bước theo sách');
assert.equal(model.steps, 30, 'Sách hướng dẫn có 30 bước');
const counts = model.instances.reduce((m, p) => ((m[p.step] = (m[p.step] || 0) + 1), m), {});
// Số linh kiện mỗi bước theo ô linh kiện của sách (9, 10, 22, 23, 30 không có linh kiện mới)
const book = [3, 1, 6, 4, 4, 4, 4, 2, 0, 0, 7, 6, 2, 3, 3, 3, 5, 4, 3, 5, 3, 0, 0, 4, 4, 8, 2, 5, 6, 0];
book.forEach((n, i) => assert.equal(counts[i + 1] || 0, n, `Bước ${i + 1}: sách có ${n} linh kiện`));
assert.equal(model.instances.filter(p => p.groupPath === 'Main/Upper').length, 44, 'Cụm máy bay lắp riêng 44 linh kiện');
assert.ok(model.instances.every(p => model.labels.names[p.name]), 'Mọi mã đều có tên tiếng Việt');
assert.equal(model.instances.filter(p => p.name === 'BE-3581').length, 2, 'Hai động cơ M1, M2');
assert.equal(model.instances.filter(p => p.name === 'BP-7050').length, 1, 'Một trục vít');
// Bộ truyền: cần quay quanh trục đứng, nằm trên cụm nghiêng quanh trục Z
assert.equal(model.drive.output.parent, 'tilt');
assert.deepEqual(Array.from(model.drive.output.axis), [0, 1, 0]);
assert.deepEqual(Array.from(model.drive.tilt.axis), [0, 0, 1]);
const inOutput = new Set(model.drive.output.parts);
for (const i of model.drive.tilt.parts) assert.ok(!inOutput.has(i), 'Linh kiện chỉ thuộc một bộ truyền: ' + i);
for (const code of ['BP-7017', 'BP-7018', 'BP-7075']) {
  const i = model.instances.findIndex(p => p.name === code);
  assert.ok(inOutput.has(i), 'Máy bay quay theo cần: ' + code);
}
for (const k of ['radar', 'light']) assert.ok(model.creative[k].length, 'Thiếu hình gói ' + k);

vm.runInNewContext(fs.readFileSync(path.join(root, 'js/lesson-engine.js'), 'utf8'), context); // trang nạp lớp gốc trước engine (js/lessons.js)
vm.runInNewContext(fs.readFileSync(path.join(root, 'js/lop3-bai08/rescue-engine.js'), 'utf8'), context);
const Rescue = context.window.RescueEngine;
const B = {
  start: { type: 'start' }, rs: { type: 'repeatStart' }, re: { type: 'repeatEnd' }, stop: { type: 'stop' },
  wait: s => ({ type: 'wait', duration: s }),
  m: (port, speed, dir = 'cw') => ({ type: 'motor', port, speed, dir })
};
const sample = [B.start, B.rs,
  B.m('M1', 'low'), B.m('M2', 'low'), B.wait(3), B.m('M1', 'high'), B.m('M2', 'high'), B.wait(3),
  B.m('M1', 'low', 'ccw'), B.m('M2', 'low', 'ccw'), B.wait(3), B.m('M1', 'high', 'ccw'), B.m('M2', 'high', 'ccw'), B.wait(3), B.re];
// Hạ thấp bằng M2 rồi dừng (trục vít giữ độ cao), sau đó bay vòng chậm
const rescue = [B.start, B.m('M2', 'high'), B.wait(4), B.stop, B.rs, B.m('M1', 'low'), B.wait(5), B.re];
function run(program, seconds, { upgrades = [], advanced = false } = {}) {
  const sim = new Rescue();
  const states = [], events = [];
  sim.onMissionUpdate = s => states.push(s);
  sim.onEvent = t => events.push(t);
  if (advanced) sim.setAdvanced(true);
  sim.setUpgrades(upgrades);
  sim.setProgram(program);
  sim.start();
  for (let t = 0; t < seconds; t += 0.05) sim.advance(0.05);
  sim.checkMissions();
  return { sim, state: states.at(-1), events };
}

// Bắt đầu ở độ cao cao nhất; chương trình mẫu: xuống rồi lên lại sau mỗi vòng lặp (đối xứng)
const s0 = new Rescue();
assert.equal(s0.altitude(), 1, 'Bắt đầu ở cao nhất');
const one = run(sample, 6);
assert.ok(one.sim.altitude() < 0.2, 'Sau 6 giây chương trình mẫu, máy bay đã xuống thấp');
const full = run(sample, 12.5);
assert.ok(full.state.m2, 'NV2: chạy hết một vòng lặp của chương trình mẫu');
assert.ok(Math.abs(full.sim.altitude() - 1) < 0.02, 'Đảo chiều M2 đưa máy bay về độ cao ban đầu');
assert.ok(full.events.includes('sampleDone'));
// Chương trình khác mẫu không đạt NV2
assert.ok(!run([B.start, B.rs, B.m('M1', 'low'), B.wait(3), B.re], 10).state.m2);

// NV3: hạ thấp + bay chậm cứu đủ 3 người
const ok = run(rescue, 12);
assert.equal(ok.sim.saved(), 3, 'Cứu đủ 3 người');
assert.ok(ok.state.m3 && ok.events.includes('allSaved'));
// Bay nhanh thì không thả thang được
const fast = run([B.start, B.m('M2', 'high'), B.wait(4), B.stop, B.rs, B.m('M1', 'high'), B.wait(5), B.re], 12);
assert.equal(fast.sim.saved(), 0, 'Bay nhanh: không cứu được');
assert.ok(fast.events.includes('miss'));
// Bay cao thì không thả thang được
const high = run([B.start, B.rs, B.m('M1', 'low'), B.wait(5), B.re], 12);
assert.equal(high.sim.saved(), 0, 'Bay cao: không cứu được');
// Sương mù: chỉ hạ vừa phải (độ cao 0,2) thì không cứu được người trong sương mù, gắn đèn pha thì được
const mid = [B.start, B.m('M2', 'high'), B.wait(3.4), B.stop, B.rs, B.m('M1', 'low'), B.wait(5), B.re];
const midRun = run(mid, 12);
assert.ok(midRun.sim.altitude() > 0.15 && midRun.sim.altitude() <= 0.3, 'Độ cao vừa phải: ' + midRun.sim.altitude());
assert.equal(midRun.sim.saved(), 2, 'Không có đèn pha: người trong sương mù chưa cứu được');
assert.equal(run(mid, 12, { upgrades: ['light'] }).sim.saved(), 3, 'Có đèn pha: cứu được cả người trong sương mù');
// NV4: có gói nâng cấp và chạy động cơ
assert.ok(run(rescue, 1, { upgrades: ['radar'] }).state.m4);
// Radar gắn thêm quét xa gấp đôi
assert.equal(new Rescue().radarReach() * 2, (() => { const s = new Rescue(); s.setUpgrades(['radar']); return s.radarReach(); })());

// Nâng cao: bão lúc 9–17 giây – ở dưới mây thì rơi; bay cao qua bão rồi mới hạ thấp thì cứu được (NV5)
const crash = run(rescue, 20, { advanced: true });
assert.ok(crash.sim.crashed && crash.events.includes('crash'), 'Ở thấp trong bão thì rơi');
const wings = run(rescue, 10.8, { advanced: true, upgrades: ['wings'] });
assert.ok(!wings.sim.crashed, 'Cánh dài chịu bão lâu hơn');
// Chờ qua cơn bão đầu ở trên cao, 17 giây mới hạ (4 giây) rồi bay vòng chậm đến trước cơn bão thứ hai (29 giây)
const storm = [B.start, B.wait(5), B.wait(5), B.wait(5), B.wait(2), B.m('M2', 'high'), B.wait(4), B.stop, B.rs, B.m('M1', 'low'), B.wait(5), B.re];
const st = run(storm, 29, { advanced: true });
assert.ok(!st.sim.crashed, 'Bay cao trong bão: không rơi');
assert.equal(st.sim.saved(), 3);
assert.ok(st.state.m5, 'NV5: cứu đủ 3 người khi có bão');

console.log('PASS: Lớp 3 Bài 8 – 101 linh kiện/30 bước theo sách, cần quay trục đứng trên tháp nghiêng; mẫu M1+M2 lên xuống đối xứng, cứu 3 người khi thấp + chậm, sương mù + đèn pha, radar, bão + cánh dài, NV2–NV5.');
})().catch(e => { console.error(e); process.exit(1); });
