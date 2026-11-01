// node tests/lop3-bai12.test.js – kiểm thử độc lập, dùng Node.js built-in.
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const load3D = require('./helpers/lesson-3d');
const root = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
const context = { window: { addEventListener() {} }, document: { getElementById() { return null; } }, performance: { now: () => 0 }, Math };
for (const f of ['js/blocks-engine.js', 'js/lop3-bai12/lesson.js', 'js/lesson-engine.js', 'js/lop3-bai12/plant-engine.js'])
  vm.runInNewContext(read(f), context, { filename: f });
const { LESSON: L, BLOCK_TEMPLATES: T, PlantEngine } = context.window;
function blocks() {
  return L.blocks.sample.map(s => {
    const [key, props] = Array.isArray(s) ? s : [s, {}];
    return { ...T[key], ...props };
  });
}
function run({ advanced = false, reverse = 3, waitClear = false, early = false, upgrades = [] } = {}) {
  const s = new PlantEngine();
  if (advanced) s.setAdvanced(true);
  if (upgrades.length) s.setUpgrades(upgrades);
  const program = blocks();
  program[10].duration = reverse;
  if (early) program[3] = { ...T.wait, duration: .1 };
  if (waitClear) program.splice(2, 0, { ...T.waitClear });
  const events = [];
  s.onEvent = (type, data) => events.push({ type, data });
  s.setProgram(program);
  s.start();
  for (let t = 0; t < 100 && s.running; t += .05) s.advance(.05);
  assert.equal(s.running, false, 'Vòng lặp kết thúc');
  return { s, events, program };
}
async function main() {
  assert.equal(L.id, 'lop3-bai12');
  assert.equal(L.defaultMode, 'pro');
  assert.deepEqual([...L.missions.core], ['m1', 'm2', 'm3', 'm4']);
  assert.deepEqual([...L.missions.pro], ['m5']);
  assert.equal(L.blocks.sample.length, 13);
  const sig = b => b.type === 'motor' ? `motor:${b.port}:${b.speed}:${b.dir}`
    : b.type === 'melody' ? `melody:${b.tune}`
      : b.type === 'wait' ? `wait:${b.duration}` : b.type;
  assert.deepEqual([...blocks().map(sig)], [
    'start', 'repeatStart', 'motor:M1:low:cw', 'sensor_obstacle', 'stop',
    'melody:A', 'motor:M2:low:cw', 'wait:1', 'stop',
    'motor:M1:low:ccw', 'wait:3', 'stop', 'repeatEnd'
  ], '13 khối đúng KHGD và cổng M1/M2');
  assert.ok(Math.abs(PlantEngine.SPEED(6) / PlantEngine.SPEED(4) - 1.5) < 1e-8);
  assert.ok(Math.abs(PlantEngine.SPEED(8) / PlantEngine.SPEED(4) - 2) < 1e-8);

  const build = JSON.parse(read('content/lop3/bai12/build.json'));
  assert.equal(build.steps, 31);
  assert.equal(build.instances.length, 70);
  assert.equal(build.meshes.length, 42);
  assert.deepEqual(Object.keys(build.drive).sort(), ['output', 'tilt']);
  assert.ok(build.drive.output.parts.length >= 2 && build.drive.tilt.parts.length >= 5);
  assert.deepEqual(Object.keys(build.creative).sort(), ['lamp', 'solar', 'watering', 'wideArm']);
  for (const mesh of build.meshes) assert.ok(fs.existsSync(path.join(root, mesh)), `Thiếu mesh ${mesh}`);
  for (let i = 1; i <= 31; i++) {
    const f = path.join(root, 'assets/lop3-bai12', `step-${String(i).padStart(2, '0')}.jpg`);
    assert.ok(fs.existsSync(f));
    const b = fs.readFileSync(f);
    assert.ok(b.length > 3000 && b[0] === 255 && b[1] === 216 && b.at(-2) === 255 && b.at(-1) === 217, `JPEG bước ${i}`);
    assert.equal(L.book({ step: i, page: i }).src, `assets/lop3-bai12/step-${String(i).padStart(2, '0')}.jpg`);
  }
  assert.ok(fs.existsSync(path.join(root, 'assets/covers/lop3-bai12.jpg')));
  const dataCtx = { window: {}, Math };
  await load3D(dataCtx, 'lop3/bai12');
  assert.equal(dataCtx.window.LESSON_3D_DATA.instances.length, 70);

  const m = new PlantEngine();
  m.setProgram([]);
  m.start();
  m.power = 4;
  m.onMotor({ port: 'M2', speed: 'low', dir: 'cw' });
  m.integrate(1);
  assert.equal(m.x, 0, 'M2 hạ khung, không chạy bánh');
  assert.equal(m.armDown, 1);
  assert.equal(m.pose3d().tilt, -Math.PI / 2, 'M2 gắn đúng trục 3D');
  m.motorOn = false;
  m.motorPort = null;
  m.power = 4;
  m.onMotor({ port: 'M1', speed: 'low', dir: 'cw' });
  m.integrate(1);
  assert.ok(m.x > 15 && m.armDown === 1, 'M1 chạy bánh không nâng/hạ khung');
  assert.ok(m.pose3d().output !== 0);
  m.stop(true);

  const sample = run();
  assert.equal(sample.s.done.m2, true, 'Mẫu đủ vòng đạt M2');
  assert.ok(sample.s.loops >= 1 && sample.s.melodies >= 1);
  assert.equal(sample.s.done.m3, false, 'Mẫu chưa trồng đủ ba chậu');
  const kid = run({ reverse: 4 });
  assert.equal(kid.s.got(), 3, 'Chỉnh lùi 4s trồng đủ ba cây');
  assert.equal(kid.s.done.m3, true);
  assert.equal(kid.s.failed, false);
  const early = run({ early: true });
  assert.equal(early.s.reason, 'early', 'Hạ gắp sớm làm đổ chậu');
  assert.equal(early.s.pots[0].state, 'fallen');
  const landing = run({ reverse: 5 });
  assert.equal(landing.s.reason, 'landing', 'Lùi sai làm đổ chậu');
  const storm = run({ advanced: true, reverse: 4 });
  assert.equal(storm.s.reason, 'storm', 'Chạy M1 lúc bão bị lỗi');
  assert.equal(storm.s.done.m5, false);
  for (const r of [3, 5]) assert.equal(run({ advanced: true, reverse: r, waitClear: true }).s.failed, true, `Lùi ${r}s phải sai`);
  const safe = run({ advanced: true, reverse: 4, waitClear: true });
  assert.equal(safe.s.failed, false, safe.s.reason + " " + safe.s.logs.map(l=>l.text).join("|"));
  assert.equal(safe.s.got(), 3);
  assert.equal(safe.s.done.m5, true, 'Chờ tan bão đạt M5');
  assert.equal(safe.s.stormNumber, 2);
  assert.equal(safe.events.filter(e => e.type === 'stormStart').length, 2);
  const upgraded = run({ upgrades: ['wideArm', 'watering', 'lamp', 'solar'], reverse: 4 });
  assert.equal(upgraded.s.done.m3, true);
  assert.equal(upgraded.s.upgradeRun, true);
  const g = ups => { const e = new PlantEngine(); if (ups.length) e.setUpgrades(ups); e.setProgram([]); e.start(); e.pots[0].state = 'planted'; e.integrate(1); return e.pots[0].grow; };
  assert.ok(g(['watering', 'lamp']) > g([]), 'Tưới, đèn tăng tốc độ sinh trưởng');
  assert.equal(L.creative.presets.length, 4);
  assert.equal(L.creative.slots.length, 4);
  console.log('PASS: lop3-bai12 – 31 ảnh, 70 chi tiết, 42 mesh, M1/M2 3D, mẫu 13 khối, M2/M3/M5, gắp sớm, sai luống, bão và nâng cấp.');
}
main().catch(e => { console.error(e); process.exitCode = 1; });
