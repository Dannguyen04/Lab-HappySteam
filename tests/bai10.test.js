// Chạy: node tests/bai10.test.js – dữ liệu 3D và bộ mô phỏng Bài 10 (cối xoay gió), chỉ dùng Node.js built-in.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const plan = require('../scripts/bai10-plan');

const root = path.join(__dirname, '..');
const context = {
  window: { addEventListener() {} },
  document: { getElementById() { return null; } },
  performance: { now: () => 0 },
  Math
};
vm.runInNewContext(fs.readFileSync(path.join(root, 'js/data-bai-10.js'), 'utf8'), context);
const model = context.window.LESSON_3D_DATA;
assert.equal(model.instances.length, 41, 'Cối xoay gió có 41 linh kiện');
assert.equal(model.steps, 15, 'Sách hướng dẫn có 15 bước');
const counts = model.instances.reduce((m, p) => ((m[p.step] = (m[p.step] || 0) + 1), m), {});
// Số linh kiện mỗi bước theo ô linh kiện của sách (bước 15 chỉ quan sát)
const book = [1, 4, 1, 6, 4, 2, 4, 2, 2, 6, 3, 2, 3, 1, 0];
book.forEach((n, i) => assert.equal(counts[i + 1] || 0, n, `Bước ${i + 1}: sách có ${n} linh kiện`));
assert.ok(model.instances.every(p => model.labels.names[p.name]), 'Mọi mã đều có tên tiếng Việt');
assert.equal(model.instances[35].name, 'BE-2257', 'Cảm biến chạm');
assert.equal(model.instances.filter(p => p.name === 'BP-7525A').length, 3, '3 cánh quạt');
assert.equal(JSON.stringify(Array.from(model.drive.output.parts)), JSON.stringify(plan.rotor));
assert.ok(Math.abs(Math.abs(model.drive.output.axis[2]) - 1) < 1e-3, 'Cánh quạt quay quanh trục nằm ngang (Z)');
for (const k of ['light', 'tail']) assert.ok(model.creative[k].length, 'Thiếu hình gói ' + k);

vm.runInNewContext(fs.readFileSync(path.join(root, 'js/bai10/wind-engine.js'), 'utf8'), context);
const Wind = context.window.WindEngine;
const T = n => Array.from({ length: n }, () => null);
const B = {
  start: { type: 'start' }, rs: { type: 'repeatStart' }, re: { type: 'repeatEnd' }, touch: { type: 'sensor_touch' },
  low: { type: 'motor', speed: 'low' }, med: { type: 'motor', speed: 'medium' }, high: { type: 'motor', speed: 'high' },
  stop: { type: 'stop' }
};
const sample = [B.start, B.rs, B.touch, B.low, B.touch, B.med, B.touch, B.high, B.touch, B.stop, B.re];
// Chạy: presses = các thời điểm (giây) nhấn nút
function run(program, seconds, presses = [], { upgrades = [], advanced = false } = {}) {
  const sim = new Wind();
  const states = [], events = [];
  sim.onMissionUpdate = s => states.push(s);
  sim.onEvent = t => events.push(t);
  if (advanced) sim.setAdvanced(true);
  sim.setUpgrades(upgrades);
  sim.setProgram(program);
  sim.start();
  for (let t = 0; t < seconds; t += 0.02) {
    if (presses.some(p => Math.abs(t - p) < 0.01)) sim.press();
    sim.advance(0.02);
  }
  sim.checkMissions();
  return { sim, state: states.at(-1), events };
}

const idle = run(sample, 2);
assert.equal(idle.sim.rpm(), 0, 'Chưa nhấn nút thì cánh quạt chưa quay');
assert.ok(idle.sim.waitingPress);
const s = run(sample, 4, [0.2, 1, 2, 3]);
assert.ok(s.state.m2 && s.events.includes('sampleDone'), 'Nhấn 4 lần: chậm → vừa → nhanh → dừng đạt NV2: ' + s.events);
assert.equal(s.sim.rpm(), 0, 'Lần nhấn thứ 4 dừng cánh quạt');
const r = run(sample, 1.5, [0.2, 1]);
assert.equal(r.sim.rpm(), 93.75, 'Lần 2: quay vừa (mức 5) = 93,75 vòng/phút');
// NV3: quay nhanh ~8,3 giây là đầy pin
const fast = run(sample, 12, [0.1, 0.3, 0.5]);
assert.ok(fast.state.m3 && fast.events.includes('full'), 'Quay nhanh đủ lâu thì pin đầy');
assert.ok(fast.sim.best.secs > 8 && fast.sim.best.secs < 9.5, 'Đầy pin ≈ 8–9 giây: ' + fast.sim.best.secs);
const slow = run(sample, 12, [0.1]);
assert.ok(!slow.state.m3 && slow.sim.battery < 60, 'Quay chậm sạc chậm hơn: ' + slow.sim.battery);
// Gói sáng tạo: cánh dài + thêm cánh sạc nhanh hơn, và đạt NV4
const boosted = run(sample, 12, [0.1, 0.3, 0.5], { upgrades: ['long', 'more'] });
assert.ok(boosted.sim.best.secs < fast.sim.best.secs * 0.6, 'Cánh dài + 6 cánh sạc nhanh hơn');
assert.ok(boosted.state.m4, 'Gói sáng tạo + chạy động cơ đạt NV4');
// Nâng cao: quay trong bão (giây 14–20) thì gãy cánh
const storm = run(sample, 22, [0.1, 0.3, 0.5], { advanced: true });
assert.ok(storm.events.includes('broken') && !storm.state.m5, 'Không dừng khi bão thì gãy cánh');
// Dừng trước bão (nhấn lần 4 lúc 13,8 s), hết bão nhấn tiếp 3 lần → sạc đầy sau bão: đạt NV5
const safe = run(sample, 40, [0.1, 0.3, 0.5, 13.8, 20.2, 20.4, 20.6], { advanced: true });
assert.ok(!safe.events.includes('broken') && safe.state.m5, 'Dừng khi bão rồi sạc đầy đạt NV5: ' + safe.events);
// Sửa chương trình thì không tự chạy
const w = new Wind();
w.setProgram(sample);
w.advance(0.5);
assert.equal(w.running, false);

console.log('PASS: Bài 10 – 41 linh kiện/15 bước theo sách, cánh quạt quay trục ngang; nút bấm chậm/vừa/nhanh/dừng, sạc pin, gói sáng tạo, bão gãy cánh, NV2–NV5.');
