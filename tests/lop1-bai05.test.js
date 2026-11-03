// node tests/lop1-bai05.test.js – Spy Robot, đúng giáo án và nghiệm thu M2/M3/M5.
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const load3D = require('./helpers/lesson-3d');
const root = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
const context = { window: {}, document: { getElementById: () => null }, performance: { now: () => 0 }, Math };
for (const f of ['js/blocks-engine.js', 'js/lop1-bai05/lesson.js',
  'js/lesson-engine.js', 'js/lop1-bai05/spy-engine.js']) {
  vm.runInNewContext(read(f), context, { filename: f });
}
const { LESSON: L, BLOCK_TEMPLATES: T, SpyEngine } = context.window;
const blocks = () => L.blocks.sample.map(item => {
  const [name, props] = Array.isArray(item) ? item : [item, {}];
  return { ...T[name], ...props };
});
const sig = b => b.type === 'display' ? 'display:' + b.icon
  : b.type === 'melody' ? 'melody:' + b.tune
    : b.type === 'motor' ? 'motor:' + b.speed + ':' + b.dir
      : b.type === 'wait' ? 'wait:' + b.duration : b.type;
function run({ advanced = false, wait = 1, ranges = [30, 30], mutate, upgrades = [] } = {}) {
  const s = new SpyEngine();
  if (advanced) s.setAdvanced(true);
  if (upgrades.length) s.setUpgrades(upgrades);
  const prog = blocks();
  prog[6].duration = wait;
  prog[2].range = ranges[0];
  prog[7].range = ranges[1];
  if (mutate) mutate(prog);
  const events = [];
  s.onEvent = (type, data) => events.push({ type, data });
  s.setProgram(prog);
  s.start();
  for (let t = 0; t < 40 && s.running; t += .05) s.advance(.05);
  assert.equal(s.running, false, 'Mô phỏng phải dừng, không lặp vô hạn');
  return { s, events, prog };
}
async function main() {
  assert.equal(L.id, 'lop1-bai05');
  assert.equal(L.blocks.sensorRange, true, 'Nâng cao cho chỉnh cự ly');
  assert.equal(L.defaultMode || 'kid', 'kid', 'Lớp 1 mặc định chế độ Bé');
  assert.deepEqual([...L.missions.core], ['m1', 'm2', 'm3', 'm4']);
  assert.deepEqual([...L.missions.pro], ['m5']);
  assert.deepEqual([...blocks().map(sig)], [
    'start', 'repeatStart', 'sensor_obstacle', 'display:smile', 'melody:A',
    'motor:high:cw', 'wait:1', 'sensor_obstacle', 'display:wink', 'melody:B',
    'motor:high:ccw', 'wait:1', 'repeatEnd'
  ], '13 khối đúng KHGD, hai biểu cảm, hai âm thanh, hai chiều quay');

  const sample = run();
  assert.equal(sample.s.done.m2, true, 'Mẫu phải đạt M2 sau một vòng');
  assert.equal(sample.s.done.m3, false, 'Wait 1s chưa đạt M3');
  assert.equal(sample.s.done.m5, false, 'Bé không đạt nhiệm vụ Nâng cao');
  assert.equal(sample.s.detected, 2, 'Hai lượt cảm biến');
  assert.equal(sample.s.loops, 1);
  assert.equal(sample.events.filter(e => e.type === 'face').length, 2);
  assert.deepEqual(sample.events.filter(e => e.type === 'melody').map(e => e.data), ['A', 'B']);
  assert.deepEqual(sample.events.filter(e => e.type === 'wave').map(e => e.data.dir), [1, -1]);
  assert.ok(sample.events.some(e => e.type === 'sampleDone'));
  assert.ok(sample.s.rev !== 0, 'Động cơ quay thực sự');

  const slowGreeting = run({ wait: 2 });
  assert.equal(slowGreeting.s.done.m2, true);
  assert.equal(slowGreeting.s.done.m3, true, 'Chờ 2s cho lời chào đầu đạt M3');
  assert.ok(slowGreeting.events.some(e => e.type === 'friendlyWave'));
  const tooShort = run({ wait: 1 });
  assert.equal(tooShort.s.done.m3, false);
  assert.ok(tooShort.s.logs.some(l => /quá vội/.test(l.text)), 'Sai 1s có lời giải thích');
  const tooLong = run({ wait: 3 });
  assert.equal(tooLong.s.done.m3, false, 'Tham số phải đúng thử thách 2s');
  for (const [name, mutate] of [
    ['biểu cảm', p => { p[8].icon = 'smile'; }],
    ['giai điệu', p => { p[9].tune = 'A'; }],
    ['chiều quay', p => { p[10].dir = 'cw'; }]
  ]) assert.equal(run({ mutate }).s.done.m2, false, 'Sai ' + name + ' không đạt M2');

  const safe = run({ advanced: true, wait: 2 });
  assert.equal(safe.s.failed, false);
  assert.equal(safe.s.done.m3, true);
  assert.equal(safe.s.done.m5, true, '30cm bỏ qua người ở 45cm và nhận bạn ở 28cm');
  assert.equal(safe.s.detected, 2);
  assert.ok(safe.events.some(e => e.type === 'sensorMaster'));
  const tooNear = run({ advanced: true, wait: 2, ranges: [20, 30] });
  assert.equal(tooNear.s.reason, 'missed-friend', '20cm không thấy bạn ở 28cm');
  assert.equal(tooNear.s.done.m5, false);
  const tooFar = run({ advanced: true, wait: 2, ranges: [50, 30] });
  assert.equal(tooFar.s.reason, 'false-positive', '50cm nhận nhầm người đi ngang');
  assert.equal(tooFar.s.done.m5, false);
  assert.ok(tooFar.events.some(e => e.type === 'miss'));
  const upgraded = run({ wait: 2, upgrades: ['glasses'] });
  assert.equal(upgraded.s.upgradeRun, true, 'Đã lắp gói và chạy');
  assert.equal(upgraded.s.done.m3, true);

  const build = JSON.parse(read('content/lop1/bai05/build.json'));
  assert.equal(build.steps, 21);
  assert.equal(build.instances.length, 61);
  assert.equal(build.meshes.length, 30);
  for (const mesh of build.meshes) assert.ok(fs.existsSync(path.join(root, mesh)), 'Thiếu mesh ' + mesh);
  for (let step = 1; step <= 21; step++) {
    const file = path.join(root, 'assets/lop1-bai05', 'step-' + String(step).padStart(2, '0') + '.jpg');
    assert.ok(fs.existsSync(file), 'Thiếu ảnh bước ' + step);
    const bytes = fs.readFileSync(file);
    assert.ok(bytes.length > 3000 && bytes[0] === 255 && bytes[1] === 216 &&
      bytes.at(-2) === 255 && bytes.at(-1) === 217, 'JPEG bước ' + step);
    assert.equal(L.book({ page: step }).src, 'assets/lop1-bai05/step-' + String(step).padStart(2, '0') + '.jpg');
  }
  assert.ok(fs.existsSync(path.join(root, 'assets/covers/lop1-bai05.jpg')));
  const dataCtx = { window: {}, Math };
  await load3D(dataCtx, 'lop1/bai05');
  assert.equal(dataCtx.window.LESSON_3D_DATA.instances.length, 61);
  assert.equal(L.creative.presets.length, 4);
  assert.equal(L.creative.slots.length, 4);
  const H = {
    by: name => build.instances.filter(i => i.name === name),
    make: (src, pos, rotation) => ({ ...src, pos, rotation })
  };
  const locations = L.creative.placements(build, H);
  for (const slot of L.creative.slots) for (const option of slot.options) {
    assert.ok(locations[slot.id + ':' + option.id]?.length,
      'Gói ' + option.id + ' phải gắn được vào 3D');
  }
  assert.ok(read('content/lop1/bai05/page.html').includes('scene-hand'));
  console.log('PASS: lop1-bai05 – 13 khối, 21 JPEG, 61 chi tiết, 30 mesh, 4 gói 3D, M2/M3/M5 và ca sai.');
}
main().catch(e => { console.error(e); process.exitCode = 1; });
