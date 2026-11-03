// node tests/lop3-bai03.test.js — luật M2/M3/M5, mẫu cơ khí, trang lắp và gói 3D.
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..');
const window = { addEventListener() {} };
const document = { getElementById() { return null; } };
const ctx = { window, document, performance: { now: () => 0 }, Math, console };
for (const rel of ['js/lop3-bai03/lesson.js', 'js/lesson-engine.js', 'js/lop3-bai03/lever-engine.js'])
  vm.runInNewContext(fs.readFileSync(path.join(root, rel), 'utf8'), ctx, { filename: rel });

const lesson = window.LESSON;
assert.equal(lesson.id, 'lop3-bai03');
assert.equal(lesson.defaultMode, 'pro');
assert.deepEqual(Array.from(lesson.blocks.sample), ['start'], 'Mô hình không có chương trình điện tử');
assert.equal(lesson.creative.presets.length, 4);
assert.equal(Object.keys(lesson.creative.features).length, 4);
const build = JSON.parse(fs.readFileSync(path.join(root, 'content/lop3/bai03/build.json'), 'utf8'));
assert.equal(build.steps, 24);
assert.equal(build.instances.length, 75);
assert.equal(build.meshes.length, 19);
const placements = lesson.creative.placements(build, {
  by: name => build.instances.filter(p => p.name === name),
  make: (src, pos, rotation) => ({ ...src, pos, rotation })
});
for (const key of ['side:basket', 'front:sign', 'base:marks', 'wheels:brake'])
  assert.ok(placements[key]?.length > 0 && placements[key].every(p => p.name && p.pos), `Gói 3D ${key} thiếu linh kiện`);
for (let n = 1; n <= 24; n++) {
  const img = lesson.book({ page: n });
  assert.ok(fs.statSync(path.join(root, img.src)).size > 1000, `Thiếu trang sách ${n}`);
}
assert.ok(fs.statSync(path.join(root, 'assets/covers/lop3-bai03.png')).size > 1000);

function make() {
  const sim = new window.LeverEngine();
  sim.onMissionUpdate = state => (sim.lastMission = state);
  return sim;
}
function trial(sim, level) {
  sim.setLevel(level);
  sim.start();
  assert.equal(sim.landed, false, 'Không tính lượt khi vừa bấm Thả bóng');
  for (let i = 0; i < 100 && sim.running; i++) sim.advance(.02);
  assert.equal(sim.running, false, 'Mỗi lượt phải kết thúc hữu hạn');
  assert.equal(sim.landed, true);
  assert.ok(sim.runT > 0);
  return sim.lastOutcome;
}

const low = make();
assert.equal(low.done.m2, false);
assert.equal(trial(low, 1), 'short');
assert.equal(low.done.m2, true, 'M2: mẫu ở nấc 1 kết thúc');
assert.equal(low.done.m3, false, 'M3: nấc 1 hụt vòng giữa');
assert.equal(low.lastMission.m2, true);

const high = make();
assert.equal(trial(high, 3), 'long');
assert.equal(high.done.m3, false, 'M3: nấc 3 vượt vòng giữa');

const center = make();
assert.equal(trial(center, 2), 'hit');
assert.equal(center.done.m3, true, 'M3: nấc 2 đến vòng giữa');
assert.equal(center.done.m2, false, 'Chưa thả mẫu mức 1 chưa chấm M2');

const enhanced = make();
enhanced.setUpgrades(['teamSign']);
enhanced.checkMissions();
assert.equal(enhanced.lastMission.m4, false, 'Chỉ chọn gói không chấm M4');
trial(enhanced, 1);
assert.equal(enhanced.lastMission.m4, true, 'Phải hoàn tất lượt sau khi triển khai gói');

const advanced = make();
const events = [];
advanced.onEvent = (type, data) => events.push({ type, data });
advanced.setAdvanced(true);
assert.equal(advanced.target, 1);
assert.equal(trial(advanced, 2), 'long');
assert.equal(advanced.done.m3, false, 'Nấc 2 trượt vòng mục tiêu không được tính M3');
assert.equal(trial(advanced, 1), 'hit');
assert.equal(advanced.progress, 1);
assert.equal(advanced.target, 3);
assert.equal(trial(advanced, 2), 'short');
assert.equal(advanced.progress, 0, 'Nâng cao sai phải về lượt đầu');
assert.equal(advanced.done.m5, false);
assert.equal(trial(advanced, 1), 'hit');
assert.equal(trial(advanced, 3), 'hit');
assert.equal(advanced.target, 2);
assert.equal(trial(advanced, 2), 'hit');
assert.equal(advanced.done.m5, true, 'Nâng cao 1–3–2 liên tiếp đạt M5');
assert.equal(advanced.lastMission.m5, true);
assert.ok(events.some(e => e.type === 'miss' && e.data.progress === 0));
assert.ok(events.some(e => e.type === 'hit' && e.data.complete));
console.log('PASS: lop3-bai03 · 24 ảnh / 75 chi tiết / 4 gói 3D · M2/M3/M4/M5 đúng và sai.');
