// Chạy: node tests/lop3-bai01.test.js – giáo án, 3D, ảnh và các nhiệm vụ.
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const context = {
  window: { addEventListener() {} },
  document: { getElementById() { return null; } },
  performance: { now: () => 0 }, Math
};
for (const file of ['js/blocks-engine.js', 'js/lop3-bai01/lesson.js',
  'js/lesson-engine.js', 'js/lop3-bai01/quake-engine.js']) {
  vm.runInNewContext(read(file), context, { filename: file });
}
const { LESSON: L, BLOCK_TEMPLATES: T, QuakeEngine } = context.window;
const program = () => Array.from(L.blocks.sample, item => {
  const [name, settings] = Array.isArray(item) ? item : [item, {}];
  assert.ok(T[name], 'Thiếu khối ' + name);
  return { ...T[name], ...settings };
});

function run({ advanced = false, upgrades = [], rounds = 1, mutate } = {}) {
  const sim = new QuakeEngine();
  if (advanced) sim.setAdvanced(true);
  if (upgrades.length) sim.setUpgrades(upgrades);
  let state = {};
  const events = [], outcomes = [];
  sim.onMissionUpdate = current => { state = current; };
  sim.onEvent = (type, data) => events.push({ type, data });
  for (let i = 0; i < rounds; i++) {
    const blocks = program();
    if (mutate) mutate(blocks, i);
    sim.setProgram(blocks);
    sim.start();
    for (let t = 0; t < 500 && sim.running; t++) sim.advance(.05);
    assert.equal(sim.running, false, 'Bài phải kết thúc lượt hữu hạn');
    sim.checkMissions();
    outcomes.push({ failed: sim.failed, reason: sim.reason, stability: sim.stability });
  }
  return { sim, state, events, outcomes };
}

function main() {
  assert.equal(L.id, 'lop3-bai01');
  assert.equal(L.defaultMode, 'pro');
  assert.equal(L.blocks.motorDirections, true, 'Phải chỉnh được chiều quay trong giao diện');
  assert.equal(L.creative.slots.length, 4);
  assert.equal(L.creative.presets.length, 4);
  assert.deepEqual(Object.keys(L.creative.features).sort(), ['brace', 'columns', 'damper', 'pads']);
  assert.deepEqual(program().map(b => b.type === 'motor'
    ? `${b.type}:${b.speed}:${b.dir}` : b.type === 'wait' ? `wait:${b.duration}` : b.type), [
    'start', 'repeatStart', 'motor:low:ccw', 'wait:3', 'motor:medium:ccw',
    'wait:3', 'motor:high:ccw', 'wait:3', 'repeatEnd'
  ]);

  const build = JSON.parse(read('content/lop3/bai01/build.json'));
  assert.equal(build.steps, 27);
  assert.equal(build.instances.length, 74);
  assert.equal(build.meshes.length, 24);
  assert.ok(build.instances.some(i => i.name === 'BE-3581'), 'Nhận diện mô-tơ 3D');
  for (const file of build.meshes) assert.ok(fs.existsSync(path.join(root, file)), 'Thiếu mesh: ' + file);
  const place = L.creative.placements(build, { make: (src, pos, rot, meshes, name) => ({ pos, rot, meshes, name }) });
  for (const slot of L.creative.slots) {
    const list = place[`${slot.id}:${slot.options[0].id}`];
    assert.ok(list?.length, 'Thiếu 3D gói ' + slot.id);
    for (const part of list) {
      assert.ok(part.meshes.every(index => Number.isInteger(index) && index >= 0 && index < build.meshes.length));
    }
  }
  for (let i = 1; i <= 27; i++) {
    const n = String(i).padStart(2, '0');
    const rel = `assets/lop3-bai01/step-${n}.jpg`;
    const data = fs.readFileSync(path.join(root, rel));
    assert.ok(data.length > 3000 && data[0] === 255 && data[1] === 216 && data.at(-2) === 255 && data.at(-1) === 217, 'JPEG ' + n);
    assert.equal(L.book({ page: i }).src, rel);
  }
  const cover = fs.readFileSync(path.join(root, 'assets/covers/lop3-bai01.jpg'));
  assert.ok(cover.length > 3000 && cover[0] === 255 && cover[1] === 216);

  const sample = run();
  assert.equal(sample.state.m2, true, 'M2: chương trình mẫu đạt');
  assert.notEqual(sample.state.m3, true, 'M3: mẫu chưa qua tải');
  assert.equal(sample.outcomes[0].failed, true);
  assert.equal(sample.outcomes[0].reason, 'overload');
  assert.ok(sample.events.some(e => e.type === 'sampleDone'));
  assert.ok(sample.events.some(e => e.type === 'miss'));

  const corrected = run({ mutate: p => { p[7].duration = 1; } });
  assert.equal(corrected.state.m3, true, 'M3: giảm Wait mạnh từ 3 xuống 1 giây');
  assert.notEqual(corrected.state.m2, true, 'Không tính chương trình đã sửa thành mẫu');
  assert.equal(corrected.outcomes[0].failed, false);
  assert.ok(corrected.events.some(e => e.type === 'safe'));
  assert.equal(run({ mutate: p => { p[7].duration = 2; } }).outcomes[0].reason, 'overload');
  assert.equal(run({ mutate: p => { p[2].dir = 'cw'; p[7].duration = 1; } }).outcomes[0].reason, 'sequence');
  assert.equal(run({ mutate: p => { p[4].speed = 'high'; p[7].duration = 1; } }).outcomes[0].reason, 'sequence');

  for (const upgrade of ['brace', 'damper', 'columns', 'pads']) {
    const enhanced = run({ upgrades: [upgrade], mutate: p => { p[7].duration = 1; } });
    assert.equal(enhanced.state.m4, true, 'M4: gắn và chạy ' + upgrade);
    assert.ok(enhanced.outcomes[0].stability > corrected.outcomes[0].stability, 'Phụ kiện có tác dụng ' + upgrade);
  }

  const advanced = run({ advanced: true, rounds: 3, mutate: (p, i) => { p[7].duration = [1, 2, 1][i]; } });
  assert.equal(advanced.state.m3, true);
  assert.equal(advanced.state.m5, true, 'Nâng cao: đủ ba lượt 1-2-1');
  assert.equal(advanced.sim.proRound, 3);
  assert.ok(advanced.outcomes.every(o => !o.failed));
  assert.deepEqual(advanced.events.filter(e => e.type === 'roundPass').map(e => e.data.round), [1, 2, 3]);
  const wrong = run({ advanced: true, rounds: 3, mutate: p => { p[7].duration = 1; } });
  assert.notEqual(wrong.state.m5, true, 'Nâng cao: sai lượt giữa phải trượt');
  assert.equal(wrong.sim.proRound, 1);
  assert.equal(wrong.outcomes[1].reason, 'insufficient');
  console.log('PASS: lop3-bai01 – 27 ảnh, 74 linh kiện, 24 mesh, M2/M3/M4, nâng cao đạt và trượt.');
}

main();
