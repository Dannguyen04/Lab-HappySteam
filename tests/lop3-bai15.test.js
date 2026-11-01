// Chạy: node tests/lop3-bai15.test.js – cấu hình, 3D và bộ mô phỏng Bài 15 lớp 3 (Robot đẩy xe), chỉ dùng Node.js built-in.
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const load3D = require('./helpers/lesson-3d');

const root = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
const context = { window: { addEventListener() {} }, document: { getElementById() { return null; } }, performance: { now: () => 0 }, Math };
for (const f of ['js/blocks-engine.js', 'js/lop3-bai15/lesson.js', 'js/lesson-engine.js', 'js/lop3-bai15/push-engine.js'])
  vm.runInNewContext(read(f), context, { filename: f });
const { LESSON: L, BLOCK_TEMPLATES: T, PushEngine } = context.window;
const sig = b => (b.type === 'motor' ? `motor:${b.speed}` : b.type === 'wait' ? `wait:${b.duration}` : b.type);

function sampleBlocks() {
  return L.blocks.sample.map(s => (Array.isArray(s) ? { ...T[s[0]], ...s[1] } : { ...T[s] }));
}
// Chương trình giao hàng: Start, Quay (mức), Chờ n giây, Dừng
function deliver(speed, secs) {
  return [{ ...T.start }, { ...T[speed + 'Speed'] }, { ...T.wait, duration: secs }, { ...T.motorStop }];
}
function run(program, { sim = new PushEngine(), advanced, upgrades } = {}) {
  if (advanced !== undefined) sim.setAdvanced(advanced);
  if (upgrades) sim.setUpgrades(upgrades);
  const events = [];
  sim.onEvent = (type, data) => events.push({ type, data });
  sim.setProgram(program);
  sim.start();
  for (let t = 0; t < 60 && sim.running; t += 0.05) sim.advance(0.05);
  assert.equal(sim.running, false, 'Chương trình kết thúc');
  return { s: sim, events };
}

async function main() {
  assert.equal(L.id, 'lop3-bai15');
  assert.equal(L.defaultMode, 'pro');
  assert.deepEqual([...L.missions.core], ['m1', 'm2', 'm3', 'm4']);
  assert.deepEqual([...L.missions.pro], ['m5']);
  assert.deepEqual([...sampleBlocks().map(sig)], ['start', 'repeatStart', 'motor:high', 'repeatEnd'], 'Mẫu 4 khối đúng ảnh lập trình');
  assert.ok(Math.abs(PushEngine.STEP * 8 - 20) < 1e-9);

  const build = JSON.parse(read('content/lop3/bai15/build.json'));
  assert.equal(build.steps, 27);
  assert.equal(build.instances.length, 70);
  assert.deepEqual(Object.keys(build.drive).sort(), ['output', 'wheel']);
  assert.deepEqual(Object.keys(build.creative).sort(), ['backStop', 'brace', 'tray', 'wideHead']);
  for (const mesh of build.meshes) assert.ok(fs.existsSync(path.join(root, mesh)), `Thiếu mesh ${mesh}`);
  for (let i = 1; i <= 27; i++) {
    const f = path.join(root, 'assets/lop3-bai15', `step-${String(i).padStart(2, '0')}.jpg`);
    const b = fs.readFileSync(f);
    assert.ok(b.length > 3000 && b[0] === 255 && b[1] === 216 && b.at(-2) === 255 && b.at(-1) === 217, `JPEG bước ${i}`);
    assert.equal(L.book({ step: i, page: i }).src, `assets/lop3-bai15/step-${String(i).padStart(2, '0')}.jpg`);
  }
  assert.ok(fs.existsSync(path.join(root, 'assets/covers/lop3-bai15.jpg')));
  const dataCtx = { window: {}, Math };
  await load3D(dataCtx, 'lop3/bai15');
  assert.equal(dataCtx.window.LESSON_3D_DATA.instances.length, 70);

  // Chạy mẫu: đạt M2, nhưng xe lao quá vạch nên chưa đạt M3
  const sample = run(sampleBlocks());
  assert.equal(sample.s.done.m2, true, 'Mẫu đạt M2');
  assert.equal(sample.s.done.m3, false, 'Mẫu không tự dừng nên chưa đạt M3');
  assert.equal(sample.s.result, 'over');
  assert.ok(sample.s.pose3d().output !== 0 && sample.s.pose3d().wheel !== 0 && sample.s.pose3d().offset[0] > 0, 'Chân, bánh xe và xe dịch chuyển trong 3D');

  // M3: nhanh 4 giây = 80 cm
  const ok = run(deliver('high', 4));
  assert.equal(ok.s.done.m3, true);
  assert.equal(ok.s.result, 'ok');
  assert.ok(Math.abs(ok.s.stopX - 80) < 0.5);
  assert.ok(ok.events.some(e => e.type === 'arrived'));
  assert.equal(ok.s.done.m2, false, 'Chương trình tự viết không phải mẫu');
  // Sai: thiếu, thừa, quên Dừng, tốc độ vừa 5 giây (75 cm, trong sai số)
  assert.equal(run(deliver('high', 3)).s.result, 'short');
  assert.equal(run(deliver('high', 3)).s.done.m3, false);
  assert.equal(run(deliver('high', 5)).s.result, 'over');
  assert.equal(run(deliver('medium', 5)).s.done.m3, true);
  const noStop = run(deliver('high', 4).slice(0, 3));
  assert.equal(noStop.s.result, 'nostop');
  assert.equal(noStop.s.done.m3, false);

  // Nâng cao: ba lượt, mỗi lượt phải chỉnh lại
  const adv = new PushEngine();
  assert.equal(run(deliver('high', 3), { sim: adv, advanced: true }).s.result, 'short', 'Lượt 1: 3 giây chưa tới 80 cm');
  assert.equal(adv.round, 0, 'Trượt thì làm lại lượt đó');
  assert.equal(run(deliver('high', 4), { sim: adv }).s.result, 'ok');
  assert.equal(adv.round, 1);
  assert.equal(adv.done.m3, true);
  assert.equal(adv.done.m5, false);
  assert.equal(run(deliver('high', 4), { sim: adv }).s.result, 'over', 'Lượt 2 tải nặng: giữ nguyên 4 giây là quá vạch 45 cm');
  assert.equal(adv.round, 1);
  assert.equal(run(deliver('high', 3), { sim: adv }).s.result, 'ok', 'Tải nặng 15 cm/giây × 3 giây = 45 cm');
  assert.equal(adv.round, 2);
  assert.equal(run(deliver('high', 5), { sim: adv }).s.result, 'ok', 'Lượt 3: 100 cm');
  assert.equal(adv.done.m5, true, 'Đủ ba lượt đạt M5');

  // Gói sáng tạo
  const up = run(deliver('high', 4), { upgrades: ['wideHead', 'brace', 'backStop', 'tray'] });
  assert.equal(up.s.upgradeRun, true);
  assert.equal(up.s.tolerance(), 6);
  const heavy = new PushEngine();
  heavy.setAdvanced(true);
  heavy.round = 1;
  assert.equal(heavy.course().k, 0.75);
  heavy.setUpgrades(['brace']);
  assert.equal(heavy.course().k, 0.85);
  assert.equal(L.creative.presets.length, 4);
  assert.equal(L.creative.slots.length, 4);
  console.log('PASS: lop3-bai15 – 27 ảnh, 70 chi tiết, 3D chân/bánh, mẫu 4 khối M2, M3 dừng 80 cm (thiếu/thừa/quên Dừng), Nâng cao 3 lượt, gói sáng tạo.');
}
main().catch(e => { console.error(e); process.exitCode = 1; });
