// Chạy: node tests/lop1-bai01.test.js (Node built-in, không cần trình duyệt).
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const window = { addEventListener() {} };
const document = { getElementById() { return null; } };
const ctx = { window, document, performance: { now: () => 0 }, Math, console };
for (const rel of ['js/lop1-bai01/lesson.js', 'js/lesson-engine.js', 'js/lop1-bai01/ramp-engine.js'])
  vm.runInNewContext(fs.readFileSync(path.join(root, rel), 'utf8'), ctx, { filename: rel });
const lesson = window.LESSON;
assert.equal(lesson.id, 'lop1-bai01');
assert.deepEqual(Array.from(lesson.blocks.sample), ['start']); // Bài cơ khí, không có chương trình mẫu thật.
assert.equal(Object.keys(lesson.creative.features).length, 4);
assert.equal(lesson.creative.presets.length, 4);

function run(slope, surface = 'wood', advanced = false, upgrades = []) {
  const sim = new window.RampEngine();
  const progress = [];
  sim.onMissionUpdate = m => progress.push({ ...m });
  sim.setAdvanced(advanced);
  sim.setSlope(slope);
  sim.setSurface(surface);
  if (upgrades.length) sim.setUpgrades(upgrades);
  assert.equal(sim.done.m2, false, 'Chưa thả xe không thể đạt M2');
  assert.equal(!!sim.upgradeRun, false, 'Chọn gói không tự tính đã thử M4');
  sim.start(); // Nút Thả xe, không chạy chương trình.
  assert.equal(sim.released, true);
  assert.equal(sim.done.m2, false, 'M2 không được chấm khi vừa thả');
  for (let i = 0; i < 4000 && sim.running; i++) sim.advance(0.02);
  assert.equal(sim.running, false, 'Lượt xe phải kết thúc hữu hạn');
  assert.equal(sim.done.m2, true, 'M2 đạt khi xe lăn xong');
  assert.equal(progress.at(-1).m2, true);
  return sim;
}
const low = run(1);
assert.equal(low.reachedGoal, false, 'Nấc 1 mặt gỗ phải dừng sớm');
assert.equal(low.done.m3, false);
const medium = run(2);
assert.equal(medium.reachedGoal, true, 'Nấc 2 mặt gỗ phải đến đích');
assert.equal(medium.done.m3, true, 'M3 phải được chấm sau khi tới cờ');
assert.equal(medium.done.m5, false);
const roughMedium = run(2, 'rough', true);
assert.equal(roughMedium.reachedGoal, false, 'Nấc 2 mặt nhám phải trượt');
assert.equal(roughMedium.done.m5, false);
const roughHigh = run(3, 'rough', true);
assert.equal(roughHigh.reachedGoal, true, 'Nấc 3 mặt nhám phải đến cờ');
assert.equal(roughHigh.done.m5, true, 'M5 chỉ chấm trong Nâng cao');
const creative = run(2, 'wood', false, ['spoilerWing']);
assert.equal(creative.upgradeRun, true);
let m4;
creative.onMissionUpdate = state => { m4 = state.m4; };
creative.checkMissions();
assert.equal(m4, true, 'Đã gắn + đã thả xe => M4');
const unused = new window.RampEngine();
unused.setUpgrades(['frontBumper']);
unused.onMissionUpdate = s => { m4 = s.m4; };
unused.checkMissions();
assert.equal(m4, false, 'Chỉ chọn gói chưa đạt M4');
assert.ok(medium.runT > 0 && medium.distance > 0 && medium.velocity >= 0);
const build = JSON.parse(fs.readFileSync(path.join(root, 'content/lop1/bai01/build.json'), 'utf8'));
assert.equal(build.instances.length, 22);
assert.equal(build.steps, 7);
for (let n = 1; n <= 7; n++) {
  const d = lesson.book({ step: n, page: n, total: 7 });
  assert.match(d.cap, /minh họa|Minh họa/);
  assert.ok(fs.statSync(path.join(root, d.src)).size > 1000, 'Thiếu ảnh bước ' + n);
}
assert.ok(fs.statSync(path.join(root, 'assets/covers/lop1-bai01.jpg')).size > 1000);
console.log('PASS: lop1-bai01 · M2 thả xe; M3 đúng/sai; M5 nhám đúng/sai; M4 gắn+chạy; 7 ảnh/22 chi tiết.');
