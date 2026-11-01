// Chạy: node tests/lop3-bai13.test.js – cấu hình, 3D, ảnh sách và bộ mô phỏng Bài 13 lớp 3 (Phi thuyền không gian), chỉ dùng Node.js built-in.
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const load3D = require('./helpers/lesson-3d');

const root = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
const context = { window: { addEventListener() {} }, document: { getElementById() { return null; } }, performance: { now: () => 0 }, Math };
for (const f of ['js/blocks-engine.js', 'js/lop3-bai13/lesson.js', 'js/lesson-engine.js', 'js/lop3-bai13/rocket-engine.js'])
  vm.runInNewContext(read(f), context, { filename: f });
const { LESSON: L, BLOCK_TEMPLATES: T, RocketEngine } = context.window;

// waits = [giây cấp chậm, giây cấp vừa, giây cấp nhanh]; hoặc mảng theo từng lượt khi rounds > 1
function run({ waits = [3, 3, 3], advanced = false, rounds = 1, upgrades = [], mutate } = {}) {
  const s = new RocketEngine();
  if (advanced) s.setAdvanced(true);
  if (upgrades.length) s.setUpgrades(upgrades);
  const events = [];
  s.onEvent = (type, data) => events.push({ type, data });
  let state = {};
  s.onMissionUpdate = m => (state = m);
  const results = [];
  for (let r = 0; r < rounds; r++) {
    const program = L.blocks.sample.map(x => {
      const [key, props] = Array.isArray(x) ? x : [x, {}];
      return { ...T[key], ...props };
    });
    [4, 6, 8].forEach((idx, i) => (program[idx].duration = Array.isArray(waits[0]) ? waits[r][i] : waits[i]));
    if (mutate) mutate(program, r);
    s.setProgram(program);
    s.start();
    for (let t = 0; t < 120 && s.running; t += 0.02) s.advance(0.02);
    assert.equal(s.running, false, 'Chương trình phải kết thúc (cất cánh hoặc phanh)');
    s.checkMissions();
    results.push({ stage: s.stage, reason: s.reason, world: s.world.name, v: s.v, x: s.x });
  }
  return { s, events, state, results };
}

async function main() {
  assert.equal(L.id, 'lop3-bai13');
  assert.equal(L.defaultMode, 'pro');
  assert.deepEqual([...L.missions.core], ['m1', 'm2', 'm3', 'm4']);
  assert.deepEqual([...L.missions.pro], ['m5']);
  assert.equal(L.blocks.sample.length, 10, '10 khối đúng ảnh lập trình');
  const sig = b => b.type === 'motor' ? `motor:${b.speed}:${b.dir}` : b.type === 'melody' ? `melody:${b.tune}`
    : b.type === 'wait' ? `wait:${b.duration}` : b.type;
  const prog = L.blocks.sample.map(x => { const [k, p] = Array.isArray(x) ? x : [x, {}]; return { ...T[k], ...p }; });
  assert.deepEqual([...prog.map(sig)], [
    'start', 'melody:B', 'repeatStart', 'motor:low:ccw', 'wait:3', 'motor:medium:ccw', 'wait:3', 'motor:high:ccw', 'wait:3', 'repeatEnd'
  ]);

  // 3D, ảnh sách, ảnh bìa
  const build = JSON.parse(read('content/lop3/bai13/build.json'));
  assert.equal(build.steps, 41);
  assert.equal(build.instances.length, 92);
  assert.deepEqual(Object.keys(build.creative).sort(), ['boosters', 'legs', 'radar', 'wings']);
  assert.ok(build.drive.output.parts.length >= 4);
  for (const mesh of build.meshes) assert.ok(fs.existsSync(path.join(root, mesh)), `Thiếu mesh ${mesh}`);
  for (let i = 1; i <= 41; i++) {
    const n = String(i).padStart(2, '0');
    const f = path.join(root, 'assets/lop3-bai13', `step-${n}.jpg`);
    assert.ok(fs.existsSync(f), `Thiếu ảnh bước ${i}`);
    const b = fs.readFileSync(f);
    assert.ok(b.length > 3000 && b[0] === 255 && b[1] === 216 && b.at(-2) === 255 && b.at(-1) === 217, `JPEG bước ${i}`);
    assert.equal(L.book({ step: i, page: i }).src, `assets/lop3-bai13/step-${n}.jpg`);
  }
  assert.ok(fs.existsSync(path.join(root, 'assets/covers/lop3-bai13.jpg')));
  const dataCtx = { window: {}, Math };
  await load3D(dataCtx, 'lop3/bai13');
  assert.equal(dataCtx.window.LESSON_3D_DATA.instances.length, 92);

  // M2: mẫu nguyên bản chạy hết một vòng; chưa đủ tốc nên phanh trước hàng rào, chưa đạt M3
  const sample = run();
  assert.equal(sample.state.m2, true, 'Mẫu 3-3-3 xong NV2');
  assert.ok(!sample.state.m3, 'Mẫu chưa đạt NV3');
  assert.equal(sample.results[0].stage, 'braking');
  assert.equal(sample.results[0].reason, 'slow');
  assert.ok(sample.results[0].v >= 0);
  assert.ok(sample.events.some(e => e.type === 'sampleDone'));
  assert.ok(sample.events.some(e => e.type === 'brake'));

  // M3: chỉnh một khối Chờ (cấp Nhanh 3 -> 4 giây) thì cất cánh trước hàng rào
  const fixed = run({ waits: [3, 3, 4] });
  assert.equal(fixed.results[0].stage, 'airborne');
  assert.ok(fixed.results[0].x < 41 && fixed.results[0].v >= 10.5);
  assert.equal(fixed.state.m3, true);
  assert.ok(fixed.events.some(e => e.type === 'takeoff'));
  // Các cấp quá ngắn: không đủ tốc, phải phanh
  const short = run({ waits: [1, 1, 1] });
  assert.equal(short.results[0].stage, 'braking');
  assert.ok(!short.state.m3);
  // Ở cấp Chậm quá lâu: tới hàng rào mà chưa đủ tốc -> phanh gấp tại hàng rào
  const fence = run({ waits: [30, 3, 3] });
  assert.equal(fence.results[0].stage, 'braking');
  assert.equal(fence.results[0].reason, 'fence');
  assert.ok(fence.results[0].x < 41 && fence.results[0].x > 40);
  assert.ok(fence.events.some(e => e.type === 'brake' && e.data.reason === 'fence'));
  // Sai chiều quay: không nhích khỏi vạch xuất phát
  const wrong = run({ mutate: p => { p[3].dir = 'cw'; p[5].dir = 'cw'; p[7].dir = 'cw'; } });
  assert.equal(wrong.s.x, 0);
  assert.equal(wrong.results[0].stage, 'braking');

  // M4: gói sáng tạo đổi gia tốc nhẹ
  assert.ok(Math.abs(new RocketEngine().boost() - 1) < 1e-9);
  const boosted = run({ upgrades: ['boosters'] });
  assert.ok(Math.abs(boosted.s.boost() - 1.08) < 1e-9);
  assert.equal(boosted.state.m4, true);
  assert.equal(boosted.state.m3, true, 'Cụm đẩy giúp mẫu 3-3-3 vừa đủ cất cánh');
  assert.equal(boosted.state.m2, true, 'Cất cánh ở khối Chờ cuối vẫn tính đã chạy hết vòng mẫu');
  assert.ok(Math.abs(run({ upgrades: ['radar'] }).s.boost() - 0.98) < 1e-9);
  assert.ok(Math.abs(run({ upgrades: ['legs'] }).s.boost() - 0.97) < 1e-9);
  assert.ok(Math.abs(run({ upgrades: ['wings'] }).s.boost() - 1.02) < 1e-9);
  assert.equal(run({ waits: [3, 3, 4], upgrades: ['legs', 'radar'] }).results[0].stage, 'airborne', 'Nặng thêm nhưng 4 giây vẫn đủ');

  // Nâng cao: ba lượt = Mặt Trăng, sao Hỏa, tiểu hành tinh. Một bộ số giây cố định không đạt cả ba.
  const same = run({ advanced: true, rounds: 3, waits: [3, 3, 4] });
  assert.deepEqual([...same.results.map(r => r.world)], ['Mặt Trăng', 'Sao Hỏa', 'Tiểu hành tinh']);
  assert.equal(same.results[0].stage, 'airborne');
  assert.equal(same.results[1].stage, 'airborne');
  assert.equal(same.results[2].stage, 'braking', 'Tiểu hành tinh: cùng số giây thì thiếu tốc');
  assert.notEqual(same.state.m5, true, 'Chưa đủ ba thiên thể thì chưa đạt NV5');
  // Chỉnh lại thời gian theo từng lượt thì đạt cả ba
  const tuned = run({ advanced: true, rounds: 3, waits: [[3, 3, 3], [3, 3, 4], [3, 3, 5]] });
  assert.deepEqual([...tuned.results.map(r => r.stage)], ['airborne', 'airborne', 'airborne']);
  assert.equal(tuned.state.m5, true);
  assert.equal(tuned.state.m3, true);
  // Chế độ thường không đổi môi trường
  assert.deepEqual([...run({ rounds: 2, waits: [3, 3, 4] }).results.map(r => r.world)], ['Đường băng chuẩn', 'Đường băng chuẩn']);

  console.log('PASS: lop3-bai13 – cấu hình, 3D, ảnh sách, mẫu NV2, NV3 đạt/trượt, gói sáng tạo, Nâng cao.');
}
main().catch(e => { console.error(e); process.exit(1); });
