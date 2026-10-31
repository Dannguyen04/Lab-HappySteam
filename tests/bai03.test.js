// Chạy: node tests/bai03.test.js – dữ liệu 3D và bộ mô phỏng Bài 3 (Robot thám hiểm Milo), chỉ dùng Node.js built-in.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const plan = require('../scripts/bai03-plan');

const root = path.join(__dirname, '..');
const context = {
  window: { addEventListener() {} },
  document: { getElementById() { return null; } },
  performance: { now: () => 0 },
  setTimeout: fn => fn(),
  Math
};
vm.runInNewContext(fs.readFileSync(path.join(root, 'js/data-bai-03.js'), 'utf8'), context);
const model = context.window.LESSON_3D_DATA;
assert.equal(model.instances.length, 40, 'Robot Milo có 40 linh kiện');
assert.equal(model.steps, 22, 'Sách hướng dẫn có 22 bước');
assert.equal(model.label, 'Bài 3');
const counts = model.instances.reduce((m, p) => ((m[p.step] = (m[p.step] || 0) + 1), m), {});
// Số linh kiện mỗi bước theo ô linh kiện của sách (13, 14, 20, 21, 22 không thêm linh kiện)
const book = [4, 1, 1, 1, 2, 2, 4, 1, 2, 1, 2, 1, 0, 0, 5, 4, 1, 2, 6, 0, 0, 0];
book.forEach((n, i) => assert.equal(counts[i + 1] || 0, n, `Bước ${i + 1}: sách có ${n} linh kiện`));
assert.equal(model.instances.filter(p => p.groupPath === 'Main/Head').length, 18, 'Cụm đầu 18 linh kiện');
assert.equal(model.stepInfo[20].joins.join(), 'đầu robot', 'Bước 21 ghép cụm đầu');
assert.ok(model.instances.every(p => model.labels.names[p.name]), 'Mọi mã đều có tên tiếng Việt');
assert.equal(model.instances.find(p => p.originalPart === 'be-6313.dat').name, 'BE-6313');
assert.equal(JSON.stringify(model.drive.output.axis), '[0,0,1]', 'Bánh xe quay quanh trục ngang');
assert.equal(model.drive.output.radius, 0.025, 'Bán kính lốp 25 mm');
for (const k of ['bin', 'solar', 'antenna', 'arm']) assert.ok(model.creative[k].length, 'Thiếu hình gói ' + k);
for (let i = 0; i < 40; i++) assert.equal(model.instances[i].step, plan.byPart.get(i).step);

vm.runInNewContext(fs.readFileSync(path.join(root, 'js/bai03/rover-engine.js'), 'utf8'), context);
const Rover = context.window.RoverEngine;
assert.ok(Math.abs(Rover.SPEED(8) - 39.27) < 0.01, 'Mức 8 ≈ 39,3 cm/giây');

const B = {
  start: { type: 'start' },
  obstacle: { type: 'sensor_obstacle' },
  high: { type: 'motor', speed: 'high' },
  p: n => ({ type: 'motor_power', power: n }),
  wait: s => ({ type: 'wait', duration: s }),
  stop: { type: 'stop' }
};
function run(program, seconds, { upgrades = [], hand = 0.5, advanced = false } = {}) {
  const sim = new Rover();
  const states = [], events = [];
  sim.onMissionUpdate = s => states.push(s);
  sim.onEvent = t => events.push(t);
  if (advanced) sim.setAdvanced(true);
  sim.setUpgrades(upgrades);
  sim.setProgram(program);
  sim.start();
  for (let t = 0; t < seconds; t += 0.02) {
    if (hand != null && Math.abs(t - hand) < 0.01) sim.putHand();
    sim.advance(0.02);
  }
  sim.checkMissions();
  return { sim, state: states.at(-1), events };
}

// Chương trình mẫu: chờ tay → chạy nhanh 3 giây → dừng (≈118 cm, quá điểm B 80 cm; mẫu cây rơi vì chạy nhanh)
const sample = [B.start, B.obstacle, B.high, B.wait(3), B.stop];
const noHand = run(sample, 3, { hand: null });
assert.equal(noHand.sim.x, 0, 'Chưa có tay trước cảm biến thì robot đứng yên');
assert.ok(noHand.sim.waitingHand, 'Robot đang chờ vật cản');
const s = run(sample, 5);
assert.ok(Math.abs(s.sim.x - 117.8) < 1.5, 'Mẫu: 3 giây × 39,3 cm/giây ≈ 118 cm, được ' + s.sim.x);
assert.ok(s.state.m2, 'Chạy đúng chương trình mẫu đạt NV2');
assert.ok(!s.state.m3 && s.events.includes('over') && s.events.includes('drop'), 'Mẫu chạy quá B và làm rơi mẫu cây: ' + s.events);
// NV3: mức 4 × 4 giây ≈ 78,5 cm, chậm nên mẫu không rơi
const slow = run([B.start, B.obstacle, B.p(4), B.wait(4), B.stop], 7);
assert.ok(slow.state.m3 && slow.events.includes('deliver'), 'Mức 4, 4 giây: chở mẫu tới B: ' + slow.events);
assert.equal(JSON.stringify(slow.state.lastRun), JSON.stringify({ power: 4, secs: 4, b: 80 }));
// Nhanh + có thùng chở: mức 8 × 2 giây ≈ 78,5 cm
assert.ok(run([B.start, B.obstacle, B.high, B.wait(2), B.stop], 4, { upgrades: ['bin'] }).state.m3, 'Có thùng chở thì chạy nhanh vẫn giữ được mẫu');
const fastNoBin = run([B.start, B.obstacle, B.high, B.wait(2), B.stop], 4);
assert.ok(!fastNoBin.state.m3 && fastNoBin.events.includes('emptyArrive'), 'Tới B nhưng mẫu đã rơi thì chưa đạt NV3');
// Chạy quá xa thì đụng đá cuối đường
const far = run([B.start, B.high, B.wait(5), B.stop], 6, { hand: null });
assert.ok(far.events.includes('crash') && far.sim.x === Rover.TRACK_END, 'Chạy quá 150 cm đụng đá');
// NV4: có gói sáng tạo và chạy động cơ
assert.ok(run([B.start, B.p(2), B.wait(1)], 2, { upgrades: ['antenna'], hand: null }).state.m4);
// Sửa chương trình thì không tự chạy
const idle = new Rover();
idle.setProgram(sample);
idle.advance(0.5);
assert.equal(idle.running, false, 'Sửa chương trình không tự chạy');
// Nâng cao: B đổi chỗ, ba lần dừng đúng ba vị trí khác nhau đạt NV5
const pro = new Rover();
const ps = [];
pro.onMissionUpdate = x => ps.push(x);
pro.setAdvanced(true);
for (let k = 0; k < 3; k++) {
  const b = pro.bPos;
  const secs = b / Rover.SPEED(4); // mức 4, không làm rơi mẫu
  pro.setProgram([B.start, B.p(4), { type: 'wait', duration: secs }, B.stop]);
  pro.start();
  for (let t = 0; t < secs + 1; t += 0.02) pro.advance(0.02);
  assert.ok(pro.bHits.has(b), `Dừng đúng B = ${b} cm`);
  assert.notEqual(pro.bPos, b, 'Điểm B đổi chỗ sau khi chở đúng');
}
assert.ok(ps.at(-1).m5, 'Ba vị trí B khác nhau đạt NV5');

console.log('PASS: Bài 3 – 40 linh kiện/22 bước theo sách, bánh quay trục ngang, 4 gói sáng tạo; mô phỏng tốc độ 39,3 cm/giây, chờ tay, rơi mẫu, đụng đá, NV2–NV5.');
