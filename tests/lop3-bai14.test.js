// Chạy: node tests/lop3-bai14.test.js – cấu hình, 3D, ảnh và cảm biến hai trạng thái.
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const load3D = require('./helpers/lesson-3d');

const root = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
const context = { window: { addEventListener() {} }, document: { getElementById() { return null; } }, performance: { now: () => 0 }, Math };
for (const f of ['js/blocks-engine.js', 'js/lop3-bai14/lesson.js', 'js/lesson-engine.js', 'js/lop3-bai14/guitar-engine.js'])
  vm.runInNewContext(read(f), context, { filename: f });
const { LESSON: L, BLOCK_TEMPLATES: T, GuitarEngine } = context.window;
const makeProgram = () => L.blocks.sample.map(s => {
  const [key, props] = Array.isArray(s) ? s : [s, {}];
  return { ...T[key], ...props };
});
function run({ mode = 'AB', rounds = 1, advanced = false, upgrades = [], mutate } = {}) {
  const sim = new GuitarEngine();
  if (advanced) sim.setAdvanced(true);
  if (upgrades.length) sim.setUpgrades(upgrades);
  let state = {};
  const events = [], results = [];
  sim.onEvent = (type, data) => events.push({ type, data });
  sim.onMissionUpdate = x => (state = x);
  for (let i = 0; i < rounds; i++) {
    const p = makeProgram();
    if (mode === 'BA') [p[3], p[5]] = [p[5], p[3]];
    if (mutate) mutate(p, i);
    sim.setProgram(p);
    sim.start();
    for (let n = 0; n < 1500 && sim.running; n++) sim.advance(0.02);
    assert.equal(sim.running, false, 'Mỗi lượt phải hoàn tất hoặc báo lỗi');
    sim.checkMissions();
    results.push({ notes: [...sim.notes], reason: sim.reason, failed: sim.failed, hold: sim.holdTime });
  }
  return { sim, state, events, results };
}

async function main() {
  assert.equal(L.id, 'lop3-bai14');
  assert.equal(L.defaultMode, 'pro', 'Lớp 3 mặc định nâng cao');
  assert.deepEqual([...L.missions.core], ['m1', 'm2', 'm3', 'm4']);
  assert.deepEqual([...L.missions.pro], ['m5']);
  const p = makeProgram();
  assert.deepEqual([...p.map(b => b.type === 'melody' ? b.type + ':' + b.tune : b.type)], [
    'start', 'repeatStart', 'sensor_obstacle', 'melody:A', 'wait_clear', 'melody:B', 'repeatEnd'
  ]);
  assert.equal(L.creative.slots.length, 4);
  assert.equal(L.creative.presets.length, 4);
  assert.deepEqual(Object.keys(L.creative.features).sort(), ['glowStrings', 'resonator', 'stageLights', 'stand']);
  const build = JSON.parse(read('content/lop3/bai14/build.json'));
  assert.equal(build.steps, 23);
  assert.equal(build.instances.length, 73);
  assert.equal(build.meshes.length, 23);
  assert.equal(build.instances.filter(x => x.name === 'BE-6313').length, 1, 'Có cảm biến siêu âm');
  assert.ok(!build.instances.some(x => /motor/i.test(x.name)), 'Không có động cơ');
  for (const mesh of build.meshes) assert.ok(fs.existsSync(path.join(root, mesh)), 'Thiếu mesh ' + mesh);
  for (let i = 1; i <= 23; i++) {
    const n = String(i).padStart(2, '0');
    const file = path.join(root, 'assets/lop3-bai14', 'step-' + n + '.jpg');
    assert.ok(fs.existsSync(file), 'Thiếu ảnh bước ' + n);
    const b = fs.readFileSync(file);
    assert.ok(b.length > 3000 && b[0] === 255 && b[1] === 216 && b.at(-2) === 255 && b.at(-1) === 217, 'JPEG bước ' + n);
    assert.equal(L.book({ page: i }).src, 'assets/lop3-bai14/step-' + n + '.jpg');
  }
  assert.ok(fs.existsSync(path.join(root, 'assets/covers/lop3-bai14.jpg')));
  const data = { window: {}, Math };
  await load3D(data, 'lop3/bai14');
  assert.equal(data.window.LESSON_3D_DATA.instances.length, 73);
  const H = { make: (src, pos) => ({ ...src, pos }) };
  const placements = L.creative.placements(build, H);
  for (const slot of L.creative.slots) {
    const option = slot.options[0];
    assert.ok(placements[slot.id + ':' + option.id].length > 0, 'Thiếu phụ kiện 3D ' + option.id);
  }

  const sample = run();
  assert.equal(sample.state.m2, true, 'NV2: mẫu A–B đạt');
  assert.notEqual(sample.state.m3, true, 'Mẫu A–B chưa đạt NV3');
  assert.deepEqual(sample.results[0].notes, ['A', 'B']);
  assert.equal(sample.results[0].failed, false);
  assert.ok(sample.events.some(x => x.type === 'sampleDone'));
  assert.ok(!sample.events.some(x => x.type === 'mistake'));
  assert.equal(sample.sim.sensorNear, false, 'Nốt cuối khi tay đã rời cảm biến');

  const swapped = run({ mode: 'BA' });
  assert.equal(swapped.state.m3, true, 'NV3: đổi B–A đạt');
  assert.notEqual(swapped.state.m2, true, 'B–A không tính sai thành mẫu A–B');
  assert.deepEqual(swapped.results[0].notes, ['B', 'A']);

  const sameNotes = run({ mutate: a => { a[5] = { ...T.melodyA }; } });
  assert.equal(sameNotes.results[0].failed, true, 'A–A trượt');
  assert.notEqual(sameNotes.state.m3, true);
  assert.ok(sameNotes.events.some(x => x.type === 'mistake'));

  const noObstacle = run({ mode: 'BA', mutate: a => a.splice(2, 1) });
  assert.equal(noObstacle.results[0].failed, true, 'Thiếu chờ vật cản phải trượt');
  assert.notEqual(noObstacle.state.m3, true);
  const noClear = run({ mode: 'BA', mutate: a => a.splice(4, 1) });
  assert.equal(noClear.results[0].failed, true, 'Thiếu chờ đường trống phải trượt');
  const swappedWait = run({ mode: 'BA', mutate: a => [a[2], a[4]] = [a[4], a[2]] });
  assert.equal(swappedWait.results[0].failed, true, 'Đảo hai chờ phải trượt');

  const stage = run({ upgrades: ['stageLights'] });
  assert.equal(stage.state.m4, true, 'NV4: gắn phụ kiện và chạy');
  const advanced = run({ advanced: true, mode: 'BA', rounds: 3 });
  assert.equal(advanced.state.m5, true, 'Nâng cao: B–A đúng cả ba lượt');
  assert.equal(advanced.state.m3, true);
  assert.deepEqual(advanced.results.map(x => x.hold), [1.8, 2.6, 3.4], 'Ba lượt giữ tay khác nhau');
  assert.ok(advanced.results.every(x => !x.failed && x.notes.join('') === 'BA'));
  const advancedWrong = run({ advanced: true, mode: 'BA', rounds: 3, mutate: (a, i) => {
    if (i === 1) a.splice(4, 1);
  } });
  assert.notEqual(advancedWrong.state.m5, true, 'Một lượt sai điều kiện chờ trượt nâng cao');
  assert.ok(advancedWrong.events.some(x => x.type === 'mistake'));
  const advancedNotes = run({ advanced: true, mode: 'AB', rounds: 3 });
  assert.notEqual(advancedNotes.state.m5, true, 'A–B không tính thành B–A nâng cao');
  console.log('PASS: lop3-bai14 – 23 bước/73 parts, 3D, JPEG, NV2–NV4, điều kiện chờ, NV5 đạt và trượt.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
