// Chạy: node tests/lop1-bai11.test.js – dữ liệu 3D, chương trình M5, cối xoay nước và NV1–NV5.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const near = (actual, expected, tolerance, label) =>
  assert.ok(Math.abs(actual - expected) <= tolerance, `${label}: ${actual} khác ${expected}`);

(async () => {
  const context = {
    window: { addEventListener() {} },
    document: { getElementById() { return null; } },
    performance: { now: () => 0 },
    setTimeout: fn => fn(),
    Math,
    zmReady() {}
  };
  await require('./helpers/lesson-3d')(context, 'lop1/bai11');
  const data = context.window.LESSON_3D_DATA;
  assert.equal(data.label, 'Bài 11');
  assert.equal(data.steps, 31, 'Sách gồm 31 bước');
  assert.equal(data.instances.length, 75, 'Mô hình có 75 linh kiện');
  assert.ok(data.instances.every(part => part.step >= 1 && part.step <= 30), 'Bước 31 chỉ xem mô hình hoàn thành');
  assert.ok(data.instances.every(part => typeof part.name === 'string' && part.name.length > 0), 'Mỗi linh kiện có mã phụ tùng');
  const rawBuild = JSON.parse(read('content/lop1/bai11/build.json'));
  assert.ok(rawBuild.meshes.every(mesh => fs.existsSync(path.join(root, mesh))), 'Đủ tệp hình học của mô hình');
  assert.ok(data.meshes.every(mesh => mesh != null), 'Trình nạp 3D đọc được các hình học');
  assert.deepEqual(Object.keys(rawBuild.creative).sort(), ['cover', 'filter', 'pipe', 'scoop']);
  for (const [name, meshes] of Object.entries(rawBuild.creative))
    assert.ok(meshes.length && meshes.every(i => Number.isInteger(i) && data.meshes[i]), `Nâng cấp ${name} có mesh 3D hợp lệ`);
  assert.equal(rawBuild.drive.output.axis.length, 3);
  assert.ok(rawBuild.drive.output.parts.every(i => data.instances[i] && data.instances[i].groupPath === 'Main/1'));
  assert.ok(data.instances.some(part => part.groupPath === 'Main/1' && part.joins.includes(29)), 'Cụm bánh răng ghép ở bước 29');
  for (let s = 22; s <= 28; s++) assert.equal(data.stepInfo[s - 1].group, 'Cụm bánh răng');
  assert.ok(data.stepInfo[28].joins.includes('Cụm bánh răng'));
  // PDF trong references/ chỉ có trên máy soạn bài (không đưa lên git), nên CI bỏ qua phần kiểm tệp
  if (fs.existsSync(path.join(root, 'references/lop1/bai11'))) assert.ok(fs.existsSync(path.join(root, 'references/lop1/bai11/bai11.pdf')), 'Sách PDF gốc có tồn tại');

  for (const f of ['js/blocks-engine.js', 'js/bai11/lesson.js', 'js/bai11/water-engine.js', 'js/bai11/water-scene.js']) {
    vm.runInNewContext(read(f), context, { filename: f });
  }
  const L = context.window.LESSON;
  const Water = context.window.WaterEngine;
  assert.equal(L.id, 'lop1-bai11');
  assert.equal(L.Engine, 'WaterEngine');
  assert.equal(Water.CAP.kid, 100);
  assert.equal(Water.CAP.pro, 150);
  assert.equal(Water.PER_REV, 5);
  near(Water.SPEED(8), 150, 1e-8, 'Động cơ mức 8');
  near(Water.SPEED(4), 75, 1e-8, 'Động cơ mức 4');
  assert.deepEqual(Array.from(L.missions.core), ['m1', 'm2', 'm3', 'm4']);
  assert.deepEqual(Array.from(L.missions.pro), ['m5']);
  assert.deepEqual(Object.keys(L.creative.features).sort(), ['cover', 'filter', 'pipe', 'scoop']);
  assert.equal(L.creative.slots.length, 4);
  const book1 = L.book({ step: 1, page: 1 });
  const book31 = L.book({ step: 31, page: 31 });
  assert.equal(book1.src, 'assets/lop1-bai11/step-01.jpg');
  assert.equal(L.book({ step: 17 }).src, 'assets/lop1-bai11/step-17.jpg');
  assert.equal(book31.src, 'assets/lop1-bai11/step-31.jpg');
  for (let step = 1; step <= 31; step++) {
    const image = path.join(root, `assets/lop1-bai11/step-${String(step).padStart(2, '0')}.jpg`);
    assert.ok(fs.existsSync(image), `Thiếu ảnh sách bước ${step}`);
    assert.ok(fs.statSync(image).size < 80 * 1024, `Ảnh bước ${step} vượt 80 KiB`);
  }
  assert.match(book1.pdf, /bai11\.pdf#page=1$/);
  assert.match(book31.pdf, /bai11\.pdf#page=31$/);
  assert.match(book31.cap, /hoàn thành/i);

  const blocks = new context.window.BlockEngine('none', 'none', L.blocks);
  const sample = Array.from(blocks.sampleProgram());
  assert.deepEqual(sample.map(b => b.type), [
    'start', 'repeatStart', 'display', 'melody', 'motor', 'wait', 'display', 'melody', 'wait', 'repeatEnd'
  ]);
  assert.equal(sample[2].icon, 'heart');
  assert.equal(sample[3].tune, 'A');
  assert.equal(sample[4].speed, 'high');
  assert.equal(sample[5].duration, 3);
  assert.equal(sample[6].icon, 'smile');
  assert.equal(sample[7].tune, 'B');
  assert.equal(sample[8].duration, 3);
  assert.ok(context.window.ZMScene && ['enter', 'leave', 'onEvent', 'setMode', 'mode'].every(key => typeof context.window.ZMScene[key] === 'function'));

  // Tất cả gói sáng tạo tạo instance 3D và các gầu quay theo trục output.
  const box = { lo: [0, 0, -0.05], hi: [0.07, 0.14, 0.05], center: [0.01, 0.06, 0] };
  const layout = L.creative.placements(data, {
    make: (_, pos, rotation, meshes, name) => ({ name, pos, rotation, meshes }),
    by: name => data.instances.filter(p => p.name === name),
    box: () => box
  });
  for (const name of ['wheel:scoop', 'side:pipe', 'roof:cover', 'front:filter'])
    assert.ok(layout[name]?.length > 0, `${name} phải hiện linh kiện 3D`);
  assert.equal(layout['wheel:scoop'].length, 3, 'Ba gầu được bố trí quanh trục');
  assert.ok(layout['wheel:scoop'].every(p => p.drive === 'output'));
  assert.equal(layout['side:pipe'][0].name, 'pipe');

  // Kiểm rAF và DOM thiếu thật bằng vm chạy callback zmReady (test cũ bỏ qua init).
  const pending = new Map(), cancelled = [];
  let sequence = 0;
  const timers = new Map(), cleared = [];
  const draw = new Proxy({}, { get: (obj, prop) => prop === 'createLinearGradient'
    ? () => ({ addColorStop() {} }) : () => {} });
  const canvas = { clientWidth: 900, getContext: () => draw };
  const toast = { dataset: {}, hidden: true };
  const sceneContext = {
    window: { simEngine: new Water(), addEventListener() {} },
    document: { getElementById: id => ({ 'space-scene': canvas, 'scene-toast': toast })[id] || null },
    zmReady: fn => fn(), performance: { now: () => 10000 }, Math,
    requestAnimationFrame(fn) { pending.set(++sequence, fn); return sequence; },
    cancelAnimationFrame(id) { cancelled.push(id); pending.delete(id); },
    setTimeout(fn) { timers.set(++sequence, fn); return sequence; },
    clearTimeout(id) { cleared.push(id); timers.delete(id); }
  };
  vm.runInNewContext(read('js/bai11/water-scene.js'), sceneContext);
  const scene = sceneContext.window.ZMScene;
  assert.doesNotThrow(() => scene.onEvent('wrongWay'), 'Thiếu DOM nút/tiêu đề vẫn thông báo được');
  assert.ok(timers.size > 0, 'Thông báo tạo timer để tự đóng');
  scene.onEvent('start');
  assert.equal(timers.size, 0, 'Start phải xóa timeout thông báo cũ');
  assert.doesNotThrow(() => scene.onEvent('full', { secs: 8, fills: 1 }));
  scene.enter();
  assert.equal(pending.size, 1, 'Enter phải khởi tạo một frame');
  const frame = [...pending.values()][0];
  pending.clear();
  frame(100);
  assert.equal(pending.size, 1, 'Frame đang active lên lịch frame kế');
  scene.setMode('robot');
  scene.setMode('story');
  scene.leave();
  assert.equal(pending.size, 0, 'Leave phải hủy rAF');
  assert.ok(cancelled.length > 0 && cleared.length > 0, 'Leave dọn rAF và timer');
  frame(200);
  assert.equal(pending.size, 0, 'Callback cũ sau Leave không được tạo frame mới');
  scene.enter();
  assert.equal(pending.size, 1, 'Quay lại mô phỏng khởi động một vòng vẽ');
  scene.leave();

  const B = {
    start: { type: 'start' },
    high: { type: 'motor', speed: 'high' },
    low: { type: 'motor', speed: 'low' },
    stop: { type: 'stop' },
    reverse: { type: 'motor_reverse' },
    wait: n => ({ type: 'wait', duration: n })
  };
  function run(program, seconds, { advanced = false, upgrades = [], assembled = false } = {}) {
    const sim = new Water();
    const states = [], events = [];
    sim.onMissionUpdate = state => states.push(state);
    sim.onEvent = (event, data) => events.push({ event, data });
    sim.setAssemblyDone(assembled);
    if (advanced) sim.setAdvanced(true);
    sim.setUpgrades(upgrades);
    sim.setProgram(program);
    sim.start();
    for (let t = 0; t < seconds && sim.running; t += 0.02) sim.advance(0.02);
    sim.checkMissions();
    return { sim, state: states.at(-1), events: events.map(e => e.event), log: events };
  }

  // M1 cần học sinh đánh dấu đủ bước, các nhiệm vụ còn lại không tự hoàn tất.
  const m1 = new Water();
  let last;
  m1.onMissionUpdate = state => { last = state; };
  m1.setAssemblyDone(true);
  assert.equal(last.m1, true);
  m1.setAssemblyDone(false);
  assert.equal(last.m1, false);

  // M2: phải đúng cả chuỗi lẫn một vòng lặp đã thực thi.
  const exact = run(sample, 10);
  assert.ok(exact.state.m2, 'Hoàn thành một vòng lặp chương trình mẫu đạt M2');
  assert.ok(exact.events.includes('face') && exact.events.includes('melody'));
  assert.ok(!run(sample, 2).state.m2, 'Chưa xong một vòng chưa đạt M2');
  assert.ok(!run(sample.slice(0, -1), 10).state.m2, 'Thiếu Repeat End không đạt M2');
  assert.ok(!run(sample.map((b, i) => i === 4 ? B.low : b), 10).state.m2, 'Low khác High');
  assert.ok(!run(sample.map((b, i) => i === 2 ? { ...b, icon: 'smile' } : b), 10).state.m2, 'Trái tim khác mặt cười');

  // M3: 150 rpm × 5 L/vòng = 12,5 L/s; 100 L đầy sau khoảng 8 giây.
  const fill = run([B.start, B.high, B.wait(12), B.stop], 13);
  assert.ok(fill.state.m3 && fill.events.includes('full'), 'M3: nước lên đầy 100 L');
  near(fill.state.lastRun.secs, 8, 0.1, 'Thời gian đầy bể cơ bản');
  assert.equal(fill.state.lastRun.liters, 100);
  assert.ok(!run([B.start, B.high, B.wait(4), B.stop], 6).state.m3, 'Chạy 4 giây chưa đủ nước');
  const stopped = run([B.start, B.high, B.stop, B.wait(12)], 13);
  assert.equal(stopped.sim.water, 0, 'Dừng động cơ trước Wait thì không bơm');
  const reverse = run([B.start, B.high, B.reverse, B.wait(12)], 13);
  assert.ok(reverse.events.includes('wrongWay') && !reverse.state.m3 && reverse.sim.water === 0, 'Quay ngược không đưa nước lên bể');
  assert.ok(reverse.sim.pose3d().output < 0, 'Trục 3D quay ngược');
  assert.ok(fill.sim.pose3d().output > 0, 'Trục 3D quay đúng chiều');
  assert.equal(new Water().running, false, 'Không tự chạy khi khởi tạo');

  // M4: gói nâng cấp chỉ đạt khi có vòng quay thực, kiểm tra hiệu ứng và lượt chạy mới.
  const idle = run([B.start, B.high, B.stop], 2, { upgrades: ['filter'] });
  assert.equal(idle.state.m4, false, 'Có bộ lọc mà chưa quay thật không đạt M4');
  const creative = run([B.start, B.high, B.wait(0.5), B.stop], 2, { upgrades: ['filter'] });
  assert.equal(creative.state.m4, true, 'Bộ lọc trang trí vẫn đạt M4 khi cối đã quay');
  assert.equal(run([B.start, B.high, B.wait(1)], 2).state.m4, false, 'Không gắn gói không đạt M4');
  near(run([B.start, B.high, B.wait(1)], 2, { upgrades: ['scoop'] }).sim.water, 17.5, 0.01, 'Gầu lớn +40%');
  near(run([B.start, B.high, B.wait(1)], 2, { upgrades: ['pipe'] }).sim.water, 13.75, 0.01, 'Máng dẫn +10%');
  near(run([B.start, B.high, B.wait(1)], 2, { upgrades: ['filter'] }).sim.water, 12.5, 0.01, 'Bộ lọc không tăng lượng nước');
  creative.sim.start();
  creative.sim.checkMissions();
  assert.equal(creative.state.m4, true, 'Trạng thái snapshot cũ không bị thay đổi');
  let fresh;
  creative.sim.onMissionUpdate = state => { fresh = state; };
  creative.sim.checkMissions();
  assert.equal(fresh.m4, false, 'Lượt mới cần quay lại để đạt M4');

  // M5: chế độ nâng cao bể 150 L, bay hơi 2 L/s, ba lần đầy LIÊN TIẾP trong một lượt.
  const pro = run(sample, 60, { advanced: true });
  assert.equal(pro.sim.cap(), 150);
  near(pro.sim.evapRate(), 2, 1e-9, 'Bay hơi nâng cao');
  assert.ok(pro.state.m5 && pro.sim.proFills >= 3, 'M5: ba lần đầy trong một lượt');
  assert.ok(pro.log.filter(item => item.event === 'full').length >= 3, 'Có ba sự kiện đầy bể');
  assert.equal(pro.state.lastRun.advanced, true);
  assert.equal(run(sample, 60).state.m5, false, 'Bé không được tính M5');
  assert.ok(!run([B.start, B.high, B.wait(18)], 19, { advanced: true }).state.m5, 'Một lần đầy không đạt M5');
  near(run([B.start, B.high, B.wait(1)], 2, { advanced: true }).sim.water, 10.5, 0.01, '12,5 - 2 = 10,5 L/s');
  near(run([B.start, B.high, B.wait(1)], 2, { advanced: true, upgrades: ['cover'] }).sim.water, 11.9, 0.01, 'Mái che giảm bay hơi 70%');
  const restart = new Water();
  restart.setProgram(sample);
  restart.setAdvanced(true);
  restart.start();
  for (let t = 0; t < 18; t += 0.02) restart.advance(0.02);
  assert.equal(restart.proFills, 1, 'Lượt đầu mới đầy một lần');
  restart.start();
  assert.equal(restart.proFills, 0, 'Lượt mới xóa số lần đầy của lượt cũ');
  restart.setAdvanced(false);
  assert.equal(restart.proFills, 0, 'Đổi về chế độ Bé xóa tiến độ M5');

  // Trang HTML dùng các khe mà khung ứng dụng dùng chung nạp vào.
  const page = read('content/lop1/bai11/page.html');
  const slots = [...page.matchAll(/<template data-slot="([^"]+)"/g)].map(m => m[1]);
  assert.equal(slots.length, 20, 'Đủ 20 khe nội dung cho trang bài học');
  assert.equal(new Set(slots).size, 20, 'Không trùng khe nội dung');
  for (const id of ['chip-m1', 'chip-m2', 'chip-m3', 'chip-m4', 'chip-m5', 'book-img', 'book-pdf', 'space-scene', 'sim-stage', 'creative-stage', 'm-rpm', 'm-water', 'm-flow', 'calc-eq1', 'calc-eq2']) {
    assert.ok(page.includes(`id="${id}"`), 'Thiếu ID giao diện ' + id);
  }
  assert.match(page, /max="31"/);
  assert.match(page, /<dl class="meters">/, 'Đồng hồ bể nước hiển thị ở chế độ Bé');
  assert.match(page, /<template data-slot="sim-calculation">\s*<div class="pro-only">/, 'Công thức chỉ dành cho Nâng cao');
  console.log('PASS: Lớp 1 Bài 11 – 75 linh kiện/31 bước, PDF, khối mẫu, cảnh vẽ, Bé/Nâng cao, đủ NV1–NV5, sáng tạo, bay hơi, 3 lần đầy bể.');
})().catch(err => { console.error(err); process.exitCode = 1; });
