// node tests/lop3-bai02.test.js – sách, 3D, 16 khối, cơ học, M2/M3/M5 và sáng tạo.
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
const context = { window: { addEventListener() {} }, document: { getElementById() { return null; } }, performance: { now: () => 0 }, Math };
for (const f of ['js/blocks-engine.js', 'js/lop3-bai02/lesson.js', 'js/lesson-engine.js', 'js/lop3-bai02/forklift-engine.js'])
  vm.runInNewContext(read(f), context, { filename: f });
const { LESSON: L, BLOCK_TEMPLATES: T, ForkliftEngine } = context.window;
const sig = b => b.type === 'motor' ? `motor:${b.port}:${b.speed}:${b.dir}`
  : b.type === 'wait' ? `wait:${b.duration}` : b.type;
function sample() {
  return L.blocks.sample.map(spec => {
    const [key, props] = Array.isArray(spec) ? spec : [spec, {}];
    return { ...T[key], ...props };
  });
}
function run({ insert = 1, advanced = false, clear = false, upgrades = [], wrong = false } = {}) {
  const sim = new ForkliftEngine();
  if (advanced) sim.setAdvanced(true);
  if (upgrades.length) sim.setUpgrades(upgrades);
  const program = sample();
  program[8].duration = insert; // Chờ M1 tiến vào gầm pallet
  if (wrong) program[7].dir = 'cw';
  if (clear) program.splice(13, 0, { ...T.waitClear }); // trước M1 lùi
  const events = [];
  sim.onEvent = (type, data) => events.push({ type, data });
  sim.setProgram(program);
  sim.start();
  for (let elapsed = 0; elapsed < 65 && sim.running; elapsed += .05) sim.advance(.05);
  assert.equal(sim.running, false, 'Mô phỏng phải kết thúc');
  return { sim, events, program };
}

async function main() {
  assert.equal(L.id, 'lop3-bai02');
  assert.equal(L.defaultMode, 'pro', 'Lớp 3 mặc định Nâng cao');
  assert.deepEqual([...L.missions.core], ['m1', 'm2', 'm3', 'm4']);
  assert.deepEqual([...L.missions.pro], ['m5']);
  assert.equal(L.blocks.sample.length, 16);
  assert.deepEqual([...sample().map(sig)], [
    'start', 'motor:M1:low:ccw', 'sensor_obstacle', 'stop',
    'motor:M2:low:ccw', 'wait:1', 'stop', 'motor:M1:low:ccw',
    'wait:1', 'stop', 'motor:M2:low:cw', 'wait:1',
    'stop', 'motor:M1:low:cw', 'wait:3', 'stop'
  ], '16 khối phải đúng cổng/chiều/thời gian trong giáo án');
  assert.ok(Math.abs(ForkliftEngine.SPEED(4) - 9.817477) < .001);

  const build = JSON.parse(read('content/lop3/bai02/build.json'));
  assert.equal(build.steps, 31);
  assert.equal(build.instances.length, 81);
  assert.equal(build.meshes.length, 34);
  for (const inst of build.instances) {
    assert.ok(inst.meshes.length, 'Chi tiết 3D phải có mesh');
    for (const i of inst.meshes) assert.ok(Number.isInteger(i) && i >= 0 && i < build.meshes.length);
  }
  for (const mesh of build.meshes)
    assert.ok(fs.existsSync(path.join(root, mesh)), `Thiếu mesh 3D: ${mesh}`);
  for (let i = 1; i <= 31; i++) {
    const f = path.join(root, 'assets/lop3-bai02', `step-${String(i).padStart(2, '0')}.jpg`);
    const b = fs.readFileSync(f);
    assert.ok(b.length > 2500 && b[0] === 255 && b[1] === 216 && b.at(-2) === 255 && b.at(-1) === 217, `JPEG bước ${i}`);
    assert.equal(L.book({ step: i, page: i }).src, `assets/lop3-bai02/step-${String(i).padStart(2, '0')}.jpg`);
  }
  for (let n = 25; n <= 31; n++) assert.ok(L.book({ step: n }).cap.length > 20, `Lời dẫn riêng bước ${n}`);
  assert.ok(fs.existsSync(path.join(root, 'assets/covers/lop3-bai02.png')));

  assert.equal(L.creative.presets.length, 4);
  assert.equal(L.creative.slots.length, 4);
  const H = {
    by: name => build.instances.filter(x => x.name === name),
    make: (src, pos) => ({ ...src, pos, extra: true })
  };
  const placements = L.creative.placements(build, H);
  assert.deepEqual(Object.keys(placements).sort(), [
    'fork:wideFork', 'mast:backRest', 'rear:twinWheels', 'roof:warning'
  ]);
  for (const list of Object.values(placements)) {
    assert.ok(list.length > 0, 'Mỗi gói sáng tạo phải gắn được chi tiết 3D');
    assert.ok(list.every(x => x.extra && x.meshes.every(i => i < build.meshes.length)));
  }
  const physical = new ForkliftEngine();
  physical.setProgram([]); physical.start();
  physical.power = 4; physical.motorOn = true;
  physical.onMotor({ type: 'motor', port: 'M2', speed: 'low', dir: 'ccw' });
  physical.integrate(1);
  assert.equal(physical.x, 0, 'M2 không làm xe chạy bánh');
  assert.equal(physical.forkDown, 1, 'M2 ngược chiều hạ càng');
  physical.onMotor({ type: 'motor', port: 'M1', speed: 'low', dir: 'ccw' });
  physical.integrate(1);
  assert.ok(physical.x > 9 && physical.forkDown === 1, 'M1 tiến mà không nâng càng');

  const book = run();
  assert.equal(book.sim.done.m2, true, 'Mẫu 16 khối đạt M2');
  assert.equal(book.sim.done.m3, false, 'Mẫu 1s chưa lấy được pallet');
  assert.equal(book.sim.reason, 'short', 'Tiến 1s thất bại vì càng còn thiếu');
  const good = run({ insert: 2 });
  assert.equal(good.sim.failed, false, good.sim.reason);
  assert.equal(good.sim.done.m3, true, 'Đổi 2s nâng thành công, về ô tập kết');
  assert.ok(good.sim.delivered && good.sim.loaded && good.sim.x >= 44 && good.sim.x <= 56);
  assert.ok(good.events.some(x => x.type === 'picked') && good.events.some(x => x.type === 'delivered'));
  const deep = run({ insert: 3 });
  assert.equal(deep.sim.reason, 'deep', 'Tiến 3s phải báo quá sâu');
  assert.equal(deep.sim.done.m3, false);
  const wrongPortDirection = run({ wrong: true });
  assert.equal(wrongPortDirection.sim.done.m2, false, 'Chương trình sai chiều không được tính mẫu');
  assert.equal(wrongPortDirection.sim.done.m3, false);
  const danger = run({ insert: 2, advanced: true });
  assert.equal(danger.sim.reason, 'hazard', 'Lùi ngay khi có xe cản phải thất bại');
  assert.equal(danger.sim.done.m5, false);
  const safe = run({ insert: 2, advanced: true, clear: true });
  assert.equal(safe.sim.failed, false, safe.sim.reason);
  assert.equal(safe.sim.done.m5, true, 'Đợi đường trống trước lùi mới đạt M5');
  assert.ok(safe.events.some(x => x.type === 'hazard') && safe.events.some(x => x.type === 'clear'));
  const upgraded = run({ insert: 2, upgrades: ['wideFork'] });
  assert.equal(upgraded.sim.done.m4, undefined); // trường nhiệm vụ tính qua checkMissions
  assert.equal(upgraded.sim.upgradeRun, true, 'Chạy có gắn nâng cấp được tính M4');
  console.log('PASS: lop3-bai02 – 31 ảnh, 81 chi tiết/34 mesh, 4 gói sáng tạo, 16 khối, M2/M3/M5, thiếu/quá sâu, sai chiều, vật cản và cảnh chờ.');
}
main().catch(e => { console.error(e); process.exitCode = 1; });
