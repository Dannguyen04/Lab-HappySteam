// Chạy: node tests/bai02.test.js – dữ liệu 3D và bộ mô phỏng Bài 2 (Xe đua Động cơ), chỉ dùng Node.js built-in.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
(async () => {
const context = {
  window: { addEventListener() {} },
  document: { getElementById() { return null; } },
  performance: { now: () => 0 },
  setTimeout: fn => fn(),
  Math
};
await require('./helpers/lesson-3d')(context, 'lop1/bai02');
const model = context.window.LESSON_3D_DATA;
assert.equal(model.instances.length, 30, 'Xe đua có 30 linh kiện');
assert.equal(model.steps, 14, 'Sách hướng dẫn có 14 bước');
assert.equal(model.label, 'Bài 2');
assert.ok(model.instances.every(p => model.labels.names[p.name]), 'Mọi mã đều có tên tiếng Việt');
assert.equal(model.instances.filter(p => p.step === 14).length, 0, 'Bước 14 chỉ xem');
assert.equal(JSON.stringify(model.drive.output.axis), '[1,0,0]', 'Trục sau nằm ngang theo X');
assert.equal(JSON.stringify(model.drive.output.parts), '[5,6,7,8,9,10]');
assert.equal(model.drive.output.radius, 0.025, 'Bán kính lốp 25 mm');
for (const k of ['wing', 'bigwheel', 'nose', 'lights']) assert.ok(model.creative[k].length, 'Thiếu hình gói ' + k);
for (let i = 1; i <= 14; i++) assert.ok(fs.existsSync(path.join(root, `assets/bai02/step-${String(i).padStart(2, '0')}.png`)), 'Thiếu hình sách bước ' + i);

vm.runInNewContext(fs.readFileSync(path.join(root, 'js/bai02/race-engine.js'), 'utf8'), context);
const Race = context.window.RaceEngine;
assert.ok(Math.abs(Race.SPEED(8) - 39.27) < 0.01, 'Mức 8 ≈ 39,3 cm/giây');
assert.ok(Math.abs(Race.SPEED(4) - 19.63) < 0.01, 'Mức 4 ≈ 19,6 cm/giây');

const B = {
  start: { type: 'start' },
  high: { type: 'motor', speed: 'high' },
  low: { type: 'motor', speed: 'low' },
  p: n => ({ type: 'motor_power', power: n }),
  wait: s => ({ type: 'wait', duration: s }),
  stop: { type: 'stop' }
};
function run(program, seconds, { upgrades = [], advanced = false } = {}) {
  const sim = new Race();
  const states = [], events = [];
  sim.onMissionUpdate = s => states.push(s);
  sim.onEvent = t => events.push(t);
  if (advanced) sim.setAdvanced(true);
  sim.setUpgrades(upgrades);
  sim.setProgram(program);
  sim.start();
  for (let t = 0; t < seconds; t += 0.02) sim.advance(0.02);
  sim.checkMissions();
  return { sim, state: states.at(-1), events };
}
const near = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg}: ${a} ≠ ${b}`);

// Chương trình mẫu: 50 cm phẳng (1,27 s) + 40 cm dốc x0,6 (1,70 s) + 1,2 cm → ≈ 91 cm, ngay sau đỉnh dốc
const sample = [B.start, B.high, B.wait(3), B.stop];
const s = run(sample, 5);
near(s.sim.x, 91.1, 1, 'Mẫu dừng quanh đỉnh dốc');
assert.ok(s.state.m2, 'Chạy tới cuối chương trình mẫu đạt NV2');
assert.ok(!s.state.m3 && s.events.includes('short'), 'Mẫu chưa tới vạch đích: ' + s.events);
assert.ok(!run([B.start, B.high, B.wait(3)], 5).state.m2, 'Thiếu khối Dừng thì chưa đúng mẫu');
assert.ok(!run([B.start, B.low, B.wait(3), B.stop], 5).state.m2, 'Quay chậm không được tính là đúng mẫu Quay nhanh');
assert.ok(!run([B.start, { type: 'motor', speed: 'medium' }, B.wait(3), B.stop], 5).state.m2, 'Quay vừa không được tính là đúng mẫu');
assert.ok(!run([B.start, B.p(8), B.wait(3), B.stop], 5).state.m2, 'Motor Power khác khối High Speed trong mẫu');

// NV3: Wait 5 giây → ≈ 170 cm, giữa ô đỗ 160–180
const tuned = run([B.start, B.high, B.wait(5), B.stop], 8);
near(tuned.sim.x, 169.7, 1, 'Wait 5 giây');
assert.ok(tuned.state.m3 && tuned.events.includes('park'), 'Đỗ gọn trong ô: ' + tuned.events);
assert.equal(tuned.state.lastRun.power, 8);
// Chạy lâu hơn thì quá ô, rất lâu thì đâm tường lốp
const over = run([B.start, B.high, B.wait(6), B.stop], 9);
assert.ok(!over.state.m3 && over.events.includes('over'), 'Wait 6 giây đỗ quá ô: ' + over.sim.x);
const wall = run([B.start, B.high, B.wait(8), B.stop], 10);
assert.ok(wall.events.includes('crash') && wall.sim.x === 220 && !wall.state.m3, 'Đâm tường lốp ở 220 cm');
const before = run([B.start, B.high, B.wait(4.5), B.stop], 7);
assert.ok(before.sim.x < 160 && !before.state.m3, 'Chưa tới ô đỗ: ' + before.sim.x);

// Tốc độ chậm không leo nổi dốc: trôi ngược về chân dốc (50 cm)
const low = run([B.start, B.low, B.wait(6), B.stop], 9);
assert.ok(low.events.includes('slide') && !low.events.includes('park'), 'Mức 4 trôi ngược: ' + low.events);
near(low.sim.x, 50, 0.1, 'Trôi về chân dốc');
near(low.sim.rev * 2 * Math.PI * 2.5, low.sim.x, 0.01, 'Bánh chỉ quay đúng quãng đường thực khi trôi về chân dốc');
const p5 = run([B.start, B.p(5), B.wait(8), B.stop], 11);
assert.ok(!p5.events.includes('slide') && p5.sim.x > 90, 'Mức 5 leo được dốc');
assert.ok(run([B.start, B.p(4), B.wait(8), B.stop], 11).events.includes('slide'), 'Mức 4 không leo được');
// Dừng giữa dốc cũng trôi ngược
const mid = run([B.start, B.high, B.wait(2), B.stop], 5);
assert.ok(mid.events.includes('slide') && mid.sim.x === 50, 'Dừng giữa dốc thì tụt xuống chân dốc');

// Gói sáng tạo
const wing = run([B.start, B.p(4), B.wait(6), B.stop], 9, { upgrades: ['wing'] });
assert.ok(!wing.events.includes('slide') && wing.sim.x > 90, 'Có cánh gió thì mức 4 leo được dốc: ' + wing.sim.x);
assert.ok(wing.state.m4, 'NV4: có gói và động cơ chạy');
assert.ok(run([B.start, B.p(3), B.wait(9), B.stop], 12, { upgrades: ['wing'] }).sim.x > 90, 'Cánh gió leo được từ mức 3');
assert.ok(run([B.start, B.p(2), B.wait(9), B.stop], 12, { upgrades: ['wing'] }).events.includes('slide'), 'Mức 2 vẫn không leo');
const big = run([B.start, B.p(5), B.wait(9), B.stop], 12, { upgrades: ['bigwheel'] });
assert.ok(big.events.includes('slide'), 'Bánh to cần mức 6 để leo dốc');
near(run([B.start, B.high, B.wait(0.9), B.stop], 3, { upgrades: ['bigwheel'] }).sim.x, 39.27 * 1.3 * 0.9, 0.8, 'Bánh to nhanh x1,3 trên đường phẳng');
const bigUp = run([B.start, B.high, B.wait(3.5), B.stop], 6, { upgrades: ['bigwheel'] });
near(bigUp.sim.x, 90 + (3.5 - 50 / (39.27 * 1.3) - 40 / (39.27 * 0.45)) * 39.27 * 1.3, 1.5, 'Bánh to leo dốc x0,45 rồi chạy nhanh x1,3');
near(run([B.start, B.high, B.wait(1), B.stop], 3, { upgrades: ['nose'] }).sim.x, 39.27 * 1.1, 0.8, 'Mũi nhọn x1,1');
// Mũi nhọn chỉ nhanh trên đường phẳng: lên dốc vẫn x0,6 (đo giữa lúc chạy, 1 giây sau khi vào dốc)
near(run([B.start, B.high, B.wait(10)], 50 / (39.27 * 1.1) + 1, { upgrades: ['nose'] }).sim.x, 50 + 39.27 * 0.6, 0.8, 'Mũi nhọn không đổi tốc độ lên dốc');
assert.ok(run([B.start, B.p(2), B.wait(1)], 2, { upgrades: ['lights'] }).state.m4, 'Đèn pha chỉ trang trí vẫn tính NV4');
assert.ok(!run([B.start, B.high, B.stop], 1, { upgrades: ['lights'] }).state.m4, 'Không có chuyển động thực tế thì chưa đạt NV4');
assert.equal(run(sample, 5, { upgrades: ['lights'] }).sim.x.toFixed(1), s.sim.x.toFixed(1), 'Đèn pha không đổi tốc độ');

// Sửa chương trình thì không tự chạy
const idle = new Race();
idle.setProgram(sample);
idle.advance(0.5);
assert.equal(idle.running, false, 'Sửa chương trình không tự chạy');
assert.equal(JSON.stringify(idle.pose3d().offset), '[0,0,0]');
const moved = run(sample, 1.0).sim.pose3d();
assert.ok(moved.offset[2] > 0 && moved.output > 0, 'Xe tiến theo +Z, bánh quay');

// Nâng cao: đường có dốc xuống
const adv = { advanced: true };
const high = run([B.start, B.high, B.wait(6), B.stop], 8, adv);
assert.ok(high.events.includes('flip') && high.sim.flipped && !high.state.m5, 'High cả đoạn xuống dốc thì lật xe');
near(high.sim.x, 100, 0.5, 'Lật ngay đầu dốc xuống');
const chain = w => run([B.start, B.high, B.wait(3), B.low, B.wait(w), B.stop], 12, adv);
const ok = chain(4.8);
near(ok.sim.x, 200.4, 1, 'Chuỗi High 3 s rồi Low 4,8 s');
assert.ok(ok.state.m5 && ok.events.includes('park') && ok.state.m3, 'Đỗ trên đường Nâng cao đạt cả NV3 và NV5: ' + ok.events);
assert.ok(ok.state.lastRun.advanced, 'Chỉ chạy đường Nâng cao vẫn được ghi nhận đỗ thành công');
assert.ok(!tuned.state.m5, 'Đỗ trên đường Bé chưa đạt NV5');
assert.ok(!chain(5.5).state.m5 && chain(5.5).events.includes('over'), 'Quá ô đỗ Nâng cao');
assert.ok(!chain(4).state.m5, 'Chưa tới ô đỗ Nâng cao');
assert.ok(run([B.start, B.high, B.wait(3), B.low, B.wait(12), B.stop], 17, adv).events.includes('crash'), 'Đâm tường ở 240 cm');
assert.ok(run([B.start, B.low, B.wait(9), B.stop], 11, adv).events.includes('slide'), 'Chỉ Low không lên nổi dốc Nâng cao');
// Chuyển Bé và Nâng cao đổi đường
const sw = new Race();
assert.equal(sw.track().park[0], 160);
sw.setAdvanced(true);
assert.equal(sw.track().park[0], 190);

console.log('PASS: Bài 2 – 30 linh kiện/14 bước, trục sau X, 4 gói sáng tạo; mô phỏng 39,3 cm/giây, dốc lên/xuống, trôi ngược, lật xe, tường lốp, NV2-NV5.');

})().catch(err => { console.error(err); process.exit(1); });
