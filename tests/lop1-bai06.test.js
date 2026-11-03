// Chạy: node tests/lop1-bai06.test.js – cấu hình và bộ mô phỏng Bài 6 lớp 1 (Luật giao thông – Xe thông minh), chỉ dùng Node.js built-in.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const context = { window: { addEventListener() {} }, document: { getElementById() { return null; } }, performance: { now: () => 0 }, Math };
for (const f of ['js/blocks-engine.js', 'js/lop1-bai06/lesson.js', 'js/lesson-engine.js', 'js/lop1-bai06/traffic-engine.js'])
  vm.runInNewContext(fs.readFileSync(path.join(root, f), 'utf8'), context);
const L = context.window.LESSON;
assert.equal(L.id, 'lop1-bai06');
assert.ok(L.blocks.sample.length > 1, 'Có chương trình mẫu');

// Chạy chương trình mẫu đến hết → NV2
const T = context.window.BLOCK_TEMPLATES;
const program = L.blocks.sample.map(s => (Array.isArray(s) ? { ...T[s[0]], ...s[1] } : { ...T[s] }));
const sim = new context.window.TrafficEngine();
let state;
sim.onMissionUpdate = s => (state = s);
sim.setProgram(program);
sim.start();
for (let t = 0; t < 60 && sim.running; t += 0.02) {
  if (sim.waitingPress) sim.press();
  sim.advance(0.02);
}
sim.checkMissions();
assert.equal(state.m2, true, 'Chạy đúng chương trình mẫu thì xong NV2');
const sig = b => b.type === 'motor' ? 'motor:' + b.speed : b.type;
assert.deepEqual([...program.map(sig)], [
  'start', 'repeatStart', 'sensor_green', 'motor:high', 'sensor_yellow',
  'motor:low', 'sensor_red', 'stop', 'repeatEnd'
], 'Đủ 9 khối đúng KHGD');
assert.equal(L.defaultMode || 'kid', 'kid');
assert.deepEqual([...L.missions.core], ['m1', 'm2', 'm3', 'm4']);
assert.deepEqual([...L.missions.pro], ['m5']);
assert.equal(sim.done.m3, true, 'Mẫu chạy nhanh qua vạch khi đèn xanh 3s');
assert.equal(sim.done.m5, false, 'Bé không tự đạt Nâng cao');
assert.equal(sim.loops, 1, 'Repeat chấm xong một chu kỳ');
assert.ok(sim.crossedAt < 3.4, 'Xe qua vạch trước khi xanh hết');

function run({ green = 3, advanced = false, speed = 'high', mutate, upgrades = [] } = {}) {
  const s = new context.window.TrafficEngine();
  s.greenDuration = green;
  s.setAdvanced(advanced);
  if (upgrades.length) s.setUpgrades(upgrades);
  const p = L.blocks.sample.map(k => ({ ...T[k] }));
  p[3] = { ...T[speed + 'Speed'] };
  if (mutate) mutate(p);
  s.setProgram(p);
  s.start();
  for (let t = 0; t < 35 && s.running; t += .02) s.advance(.02);
  assert.equal(s.running, false, 'Không lặp vô hạn');
  return s;
}
async function verify() {
  const slow = run({ speed: 'low' });
  assert.equal(slow.done.m3, false, 'M3 phải trượt khi chọn rùa chậm');
  assert.equal(slow.reason, 'too-slow');
  assert.ok(slow.logs.some(l => /chưa qua vạch/.test(l.text)), 'Có lý do thất bại rõ ràng');
  const wrong = run({ mutate: p => { [p[2], p[4]] = [p[4], p[2]]; } });
  assert.equal(wrong.done.m2, false, 'Đảo tín hiệu đèn không được M2');
  assert.equal(wrong.failed, true);
  for (const green of [3, 4, 5]) {
    const safe = run({ green, advanced: true });
    assert.equal(safe.done.m5, true, 'Nâng cao mức 8 phải qua đèn ' + green + 's');
    assert.equal(safe.reason, '');
  }
  const proFail = run({ advanced: true, green: 3, speed: 'low' });
  assert.equal(proFail.done.m5, false, 'Nâng cao 3s + chậm phải trượt');
  assert.equal(proFail.reason, 'too-slow');
  assert.equal(run({ advanced: true, green: 5, speed: 'low' }).done.m5, true,
    'Nâng cao 5s cho xe chậm qua kịp');
  const d = new context.window.TrafficEngine();
  d.cycleGreenDuration();
  assert.equal(d.greenDuration, 3, 'Bé không đổi thời gian');
  d.setAdvanced(true);
  d.cycleGreenDuration(); assert.equal(d.greenDuration, 4);
  d.cycleGreenDuration(); assert.equal(d.greenDuration, 5);
  d.cycleGreenDuration(); assert.equal(d.greenDuration, 3);
  assert.equal(run({ upgrades: ['beacon'] }).upgradeRun, true, 'Nâng cấp gắn và chạy được');

  const build = JSON.parse(fs.readFileSync(path.join(root, 'content/lop1/bai06/build.json'), 'utf8'));
  assert.equal(build.steps, 14);
  assert.equal(build.instances.length, 33);
  assert.equal(build.meshes.length, 27);
  for (const mesh of build.meshes)
    assert.ok(fs.existsSync(path.join(root, mesh)), 'Thiếu mesh ' + mesh);
  for (let step = 1; step <= 14; step++) {
    const file = path.join(root, 'assets/lop1-bai06', 'step-' + String(step).padStart(2, '0') + '.jpg');
    const bytes = fs.readFileSync(file);
    assert.ok(bytes.length > 3000 && bytes[0] === 255 && bytes[1] === 216 &&
      bytes.at(-2) === 255 && bytes.at(-1) === 217, 'JPEG bước ' + step);
    assert.equal(L.book({ page: step }).src,
      'assets/lop1-bai06/step-' + String(step).padStart(2, '0') + '.jpg');
  }
  assert.ok(fs.existsSync(path.join(root, 'assets/covers/lop1-bai06.jpg')));
  const load3D = require('./helpers/lesson-3d');
  const dataContext = { window: {}, Math };
  await load3D(dataContext, 'lop1/bai06');
  assert.equal(dataContext.window.LESSON_3D_DATA.instances.length, 33);
  assert.equal(L.creative.presets.length, 4);
  assert.equal(L.creative.slots.length, 4);
  const H = {
    by: name => build.instances.filter(i => i.name === name),
    make: (src, pos, rotation) => ({ ...src, pos, rotation })
  };
  const placements = L.creative.placements(build, H);
  for (const slot of L.creative.slots) for (const option of slot.options)
    assert.ok(placements[slot.id + ':' + option.id]?.length,
      'Gói ' + option.id + ' phải lắp được trên 3D');
  assert.ok(fs.readFileSync(path.join(root, 'content/lop1/bai06/page.html'), 'utf8').includes('space-scene'));
  console.log('PASS: lop1-bai06 – 9 thẻ, M2/M3/M5 đạt-trượt, 3/4/5s, 4 gói, 14 JPEG, 33 chi tiết, 27 mesh.');
}
verify().catch(e => { console.error(e); process.exitCode = 1; });
