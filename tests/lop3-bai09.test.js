// Chạy: node tests/lop3-bai09.test.js — kiểm tra bài 09, sa bàn và nhiệm vụ M1–M5.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const context = {
  window: { addEventListener() {} },
  document: { getElementById() { return null; } },
  performance: { now: () => 0 }, Math
};
const B = {
  start: { type: 'start' }, rs: { type: 'repeatStart' }, re: { type: 'repeatEnd' },
  wait: s => ({ type: 'wait', duration: s }),
  motor: (speed, dir = 'cw') => ({ type: 'motor', port: 'M1', speed, dir })
};
const sample = [B.start, B.rs, B.motor('low'), B.wait(3), B.motor('medium'), B.wait(3), B.motor('high'), B.wait(3), B.re];
const safe = [B.start, B.motor('high'), B.wait(5.5), B.motor('low'), B.wait(8.5), B.motor('high'), B.wait(1)];
const medium = [B.start, B.motor('high'), B.wait(5.5), B.motor('medium'), B.wait(5), B.motor('high'), B.wait(1)];
function drive(Engine, program, secs, { upgrades = [], advanced = false, assembly = false } = {}) {
  const sim = new Engine(), states = [], events = [];
  sim.onMissionUpdate = s => states.push(s);
  sim.onEvent = t => events.push(t);
  sim.setAssemblyDone(assembly);
  sim.setAdvanced(advanced);
  sim.setUpgrades(upgrades);
  sim.setProgram(program);
  sim.start();
  for (let t = 0; t < secs && sim.running; t += 0.05) sim.advance(0.05);
  sim.checkMissions();
  return { sim, state: states.at(-1), events };
}

(async () => {
  await require('./helpers/lesson-3d')(context, 'lop3/bai09');
  const data = context.window.LESSON_3D_DATA;
  assert.equal(data.steps, 27, 'Bài 09 phải có 27 bước lắp ráp');
  assert.equal(data.instances.length, 69, 'Mô hình có 69 linh kiện');
  assert.ok(data.instances.every(p => p.step >= 1 && p.step <= 27));
  vm.runInNewContext(read('js/lop3-bai09/lesson.js'), context);
  const lesson = context.window.LESSON;
  assert.equal(lesson.id, 'lop3-bai09');
  assert.equal(lesson.Engine, 'StormEngine');
  assert.equal(lesson.defaultMode, 'pro');
  assert.equal(lesson.code, 'ZM3-09');
  assert.deepEqual(Array.from(lesson.missions.core), ['m1', 'm2', 'm3', 'm4']);
  assert.deepEqual(Array.from(lesson.missions.pro), ['m5']);
  assert.deepEqual(Array.from(lesson.blocks.sample), ['start', 'repeatStart', 'lowSpeed', 'wait', 'mediumSpeed', 'wait', 'highSpeed', 'wait', 'repeatEnd']);
  assert.match(lesson.book({ page: 9, step: 9, total: 27 }).src, /lop3-bai09\/step-09\.jpg$/);
  for (let step = 1; step <= 27; step++) {
    const src = lesson.book({ page: step, step, total: 27 }).src;
    const imagePath = path.join(root, src);
    assert.ok(fs.existsSync(imagePath), `Thiếu ảnh sách bước ${step}: ${src}`);
    const jpeg = fs.readFileSync(imagePath);
    assert.ok(jpeg.length < 80000, `Ảnh sách bước ${step} vượt 80 KB`);
    assert.equal(jpeg.subarray(0, 2).toString('hex'), 'ffd8', `Ảnh bước ${step} thiếu JPEG header`);
    assert.equal(jpeg.subarray(-2).toString('hex'), 'ffd9', `Ảnh bước ${step} thiếu JPEG trailer`);
  }
  assert.deepEqual(Array.from(lesson.creative.presets, x => x.id), ['float', 'light', 'sail']);
  assert.equal(lesson.creative.slots.length, 3);
  for (const id of ['float', 'light', 'sail']) {
    assert.ok(data.creative[id]?.length, `Gói ${id} thiếu dữ liệu mesh`);
    for (const index of data.creative[id]) {
      assert.ok(Number.isInteger(index) && data.meshes[index], `Gói ${id} trỏ mesh không tồn tại: ${index}`);
    }
  }
  const make = (src, pos, rotation, meshes, name) => ({ pos, rotation, meshes, name });
  const extra = lesson.creative.placements(data, {
    make, add: (a, b) => a.map((n, i) => n + b[i]),
    box: () => ({ center: [0, 0.1, 0], lo: [-0.1, 0, -0.05], hi: [0.1, 0.2, 0.05] })
  });
  for (const [slot, name] of [['side:float', 'float'], ['bow:light', 'light'], ['mast:sail', 'sail']]) {
    assert.equal(extra[slot].length, 2, `${name} phải gắn thành cặp lên mô hình 3D`);
    assert.ok(extra[slot].every(p => p.name === name && p.meshes.every(i => data.meshes[i])));
    assert.notDeepEqual(Array.from(extra[slot][0].pos), Array.from(extra[slot][1].pos), `${name} phải có hai vị trí riêng`);
  }
  const page = read('content/lop3/bai09/page.html');
  for (const id of ['chip-m1', 'chip-m2', 'chip-m3', 'chip-m4', 'chip-m5', 'slider', 'space-scene', 'sim-stage', 'm-speed', 'm-dist', 'm-tilt', 'm-weather', 'calc-eq1', 'calc-eq2']) {
    assert.ok(page.includes(`id="${id}"`), 'Trang thiếu ' + id);
  }
  assert.match(page, /max="27"/);
  assert.match(page, /đá ngầm/i);
  assert.match(page, /<dl class="meters">/, 'Đồng hồ không được ẩn hết ở chế độ Cơ bản');
  for (const name of ['Góc nghiêng', 'Thời tiết']) {
    assert.match(page, new RegExp(`<div class="meter pro-only"><dt>${name}</dt>`), `${name} chỉ hiển thị nâng cao`);
  }

  vm.runInNewContext(read('js/lesson-engine.js'), context);
  vm.runInNewContext(read('js/lop3-bai09/storm-engine.js'), context);
  const Engine = context.window.StormEngine;
  assert.equal(typeof Engine, 'function');
  assert.ok(new Engine() instanceof context.window.LessonEngine, 'Engine kế thừa lớp gốc');
  assert.deepEqual(Array.from(Engine.LIMITS.REEF), [20, 27]);
  assert.equal(Engine.LIMITS.LEN, 30);
  const assembly = new Engine();
  let assemblyState;
  assembly.onMissionUpdate = s => { assemblyState = s; };
  assembly.setAssemblyDone(true);
  assert.equal(assemblyState.m1, true, 'M1 cần xác nhận lắp xong');

  const example = drive(Engine, sample, 9.1);
  assert.ok(example.state.m2 && example.events.includes('sampleDone'), 'M2: đúng một vòng Low → Medium → High, chờ 3 giây');
  const implicitWait = new Engine();
  implicitWait.setProgram(sample.map(b => b.type === 'wait' ? { type: 'wait' } : b));
  assert.ok(implicitWait.matchesSample(), 'Wait không ghi thời lượng phải mặc định đúng 3 giây');
  const wrongSpeed = new Engine();
  wrongSpeed.setProgram(sample.map((b, i) => i === 4 ? B.motor('high') : b));
  assert.ok(!wrongSpeed.matchesSample(), 'Sai tốc độ Medium phải trượt mẫu M2');
  const wrongWait = new Engine();
  wrongWait.setProgram(sample.map((b, i) => i === 3 ? B.wait(4) : b));
  assert.ok(!wrongWait.matchesSample(), 'Wait 4 giây không được nhận như Wait 3 giây');
  assert.ok(!drive(Engine, [B.start, B.rs, B.motor('low'), B.wait(2), B.motor('high'), B.wait(3), B.re], 12).state.m2, 'Sai thời gian/thứ tự không đạt M2');

  const harbour = drive(Engine, safe, 17);
  assert.ok(harbour.sim.arrived && harbour.state.m3, 'M3: giảm tốc qua đá và đến cảng 30 m');
  assert.equal(harbour.sim.x, 30);
  assert.ok(harbour.events.includes('arrive'));
  const slowOnly = drive(Engine, [B.start, B.motor('low'), B.wait(20)], 20);
  assert.ok(slowOnly.sim.arrived && slowOnly.state.m3 && !slowOnly.sim.crashed, 'Mức Low = 4 qua đá ngầm và cập cảng');
  const p4 = drive(Engine, [B.start, { type: 'motor_power', power: 4 }, B.wait(20)], 20);
  assert.ok(p4.sim.arrived && p4.state.m3, 'Motor Power 4 qua đá ngầm giống Low');
  assert.equal(drive(Engine, [B.start, { type: 'motor_power', power: 5 }, B.wait(15)], 15).sim.crashWhy,
    'reef', 'Motor Power 5 vượt ngưỡng an toàn khi chưa có đèn');
  const reefCrash = drive(Engine, [B.start, B.motor('high'), B.wait(11)], 10);
  assert.equal(reefCrash.sim.crashWhy, 'reef', 'Đi High trong đá ngầm sẽ va đá');
  assert.ok(!reefCrash.state.m3);
  assert.equal(drive(Engine, medium, 15).sim.crashWhy, 'reef', 'Không có đèn thì Medium qua đá vẫn va');
  const withLight = drive(Engine, medium, 15, { upgrades: ['light'] });
  assert.ok(withLight.sim.arrived && withLight.state.m3, 'Có đèn thì Medium vượt đá ngầm được');
  assert.ok(withLight.state.m4, 'M4: gắn nâng cấp và cho M1 chạy');
  assert.equal(drive(Engine, [B.start, B.motor('high'), B.wait(11)], 10, { upgrades: ['light'] }).sim.crashWhy,
    'reef', 'High = 8 vẫn va đá khi có đèn (ngưỡng Medium = 6)');
  const speedLabels = new Engine();
  const ui = { 'calc-eq1': { textContent: '' }, 'calc-eq2': { textContent: '' } };
  const getById = context.document.getElementById;
  context.document.getElementById = id => ui[id] || null;
  try {
    speedLabels.updateUI();
    assert.match(ui['calc-eq1'].textContent, /Low 1\.6 · Medium 2\.4 · High 3\.2/, 'Hướng dẫn tốc độ chuẩn 4\/6\/8');
    speedLabels.setProgram([B.start, B.motor('low'), B.wait(1)]);
    speedLabels.start(); speedLabels.advance(0.05);
    assert.equal(speedLabels.m.M1.power, 4);
    speedLabels.updateUI();
    assert.match(ui['calc-eq2'].textContent, /tối đa Low/, 'Không có đèn: giới hạn Low');
  } finally {
    context.document.getElementById = getById;
  }

  const plain = new Engine();
  plain.setProgram([B.start, B.motor('medium'), B.wait(1)]); plain.start(); plain.advance(0.1);
  const sail = new Engine();
  sail.setUpgrades(['sail']); sail.setProgram([B.start, B.motor('medium'), B.wait(1)]); sail.start(); sail.advance(0.1);
  assert.ok(Math.abs(sail.x / plain.x - 1.25) < 0.001, 'Buồm chạy nhanh thêm 25% khi trời quang');

  const stormFast = [B.start, B.wait(6), B.motor('high'), B.wait(2)];
  assert.equal(drive(Engine, stormFast, 9, { advanced: true }).sim.crashWhy, 'wave', 'High trong bão quá 1,5 giây gây lật');
  assert.ok(!drive(Engine, stormFast, 8, { advanced: true, upgrades: ['float'] }).sim.crashed, 'Phao chịu bão 2 giây');
  // M3 cũng đạt ở Nâng cao: chỉ Low suốt đường qua hai đợt bão
  const lowAdv = drive(Engine, [B.start, B.motor('low'), B.wait(60)], 60, { advanced: true });
  assert.ok(lowAdv.sim.arrived && lowAdv.state.m3 && !lowAdv.sim.crashed, 'M3 đạt ở Nâng cao khi chạy Low');
  assert.ok(drive(Engine, sample, 9.1, { advanced: true }).state.m2, 'Bão Nâng cao không làm chương trình mẫu trượt M2');
  assert.ok(/bão/.test(lesson.cards.m3.text) && /Wait/.test(lesson.cards.m3.text), 'Thẻ M3 nêu bão ở Nâng cao và gợi ý khối Wait');
  const afterStorm = [B.start, B.wait(32), ...safe.slice(1)];
  const stormArrive = drive(Engine, afterStorm, 50, { advanced: true });
  assert.ok(stormArrive.sim.arrived && stormArrive.state.m5 && stormArrive.events.includes('arrive'), 'M5: trải qua bão và cập cảng');

  // M1–M4 cùng một phiên: thành tích đã đạt vẫn được giữ qua lần chạy mới.
  const all = new Engine();
  let allState;
  all.onMissionUpdate = s => { allState = s; };
  all.setAssemblyDone(true); all.setUpgrades(['light']); all.setProgram(sample); all.start();
  for (let t = 0; t < 9.1; t += 0.05) all.advance(0.05);
  all.setProgram(medium); all.start();
  for (let t = 0; t < 16 && all.running; t += 0.05) all.advance(0.05);
  assert.ok(allState.allDone, 'Hoàn thành M1–M4 trong cùng hồ sơ');

  // Scene phải đăng ký đúng hợp đồng kể cả khi chưa có art.js/canvas.
  context.zmReady = fn => fn();
  vm.runInNewContext(read('js/scene-kit.js'), context);
  vm.runInNewContext(read('js/lop3-bai09/storm-scene.js'), context);
  assert.equal(typeof context.window.ZMScene.enter, 'function');
  assert.equal(typeof context.window.ZMScene.onEvent, 'function');
  assert.equal(typeof context.window.ZMScene.setMode, 'function');
  // Chạy lifecycle trên DOM giả để bắt lỗi rAF chạy nền, timeout tồn đọng và scene thiếu phần tử.
  const pendingFrames = new Map(), pendingTimers = new Set();
  let nextFrame = 0, nextTimer = 0, observeCount = 0;
  const toast = { dataset: {}, hidden: true }, toastBtn = { hidden: true, onclick: null };
  const elements = {
    'space-scene': { clientWidth: 500, getContext: () => ({}), addEventListener() {} },
    'scene-toast': toast, 'scene-toast-btn': toastBtn,
    'scene-toggle': { addEventListener() {}, setAttribute() {} },
    'scene-toast-title': { textContent: '' }, 'scene-toast-text': { textContent: '' }
  };
  const sceneContext = {
    window: { devicePixelRatio: 1 },
    document: { getElementById: id => elements[id] || null, addEventListener() {}, activeElement: { tagName: 'BODY' } },
    performance: { now: () => 0 }, Math,
    zmReady: fn => fn(),
    requestAnimationFrame: cb => { const id = ++nextFrame; pendingFrames.set(id, cb); return id; },
    cancelAnimationFrame: id => pendingFrames.delete(id),
    setTimeout: () => { const id = ++nextTimer; pendingTimers.add(id); return id; },
    clearTimeout: id => pendingTimers.delete(id),
    ResizeObserver: class {
      observe() { observeCount++; }
    }
  };
  vm.runInNewContext(read('js/scene-kit.js'), sceneContext);
  vm.runInNewContext(read('js/lop3-bai09/storm-scene.js'), sceneContext);
  const scene = sceneContext.window.ZMScene;
  assert.equal(pendingFrames.size, 0, 'Chưa vào sa bàn không được chạy rAF');
  scene.enter();
  assert.equal(pendingFrames.size, 1, 'Vào sa bàn cần khởi động rAF');
  const [frameId, frame] = pendingFrames.entries().next().value;
  pendingFrames.delete(frameId);
  frame(1000);
  assert.equal(pendingFrames.size, 1, 'Khung hình tiếp theo chỉ được lập lịch một lần');
  scene.onEvent('warn', 'reef');
  assert.equal(pendingTimers.size, 1, 'Thông báo cần một timer');
  scene.leave();
  assert.equal(pendingFrames.size, 0, 'Rời sa bàn phải hủy rAF');
  assert.equal(pendingTimers.size, 0, 'Rời sa bàn phải hủy timer');
  scene.onEvent('start');
  assert.equal(toast.hidden, true, 'Khởi động lại cần ẩn thông báo cũ');
  frame(1100);
  assert.equal(pendingFrames.size, 0, 'Callback đã rời sa bàn không được tự lập lịch lại');
  scene.enter();
  scene.setMode('robot');
  assert.equal(pendingFrames.size, 1, 'Kit giữ lịch khung hình, không vẽ 2D trong chế độ robot');
  scene.setMode('story');
  assert.equal(pendingFrames.size, 1, 'Quay lại cảnh 2D phải tiếp tục vẽ');
  scene.leave();
  assert.equal(observeCount, 1, 'Kit đăng ký ResizeObserver một lần');
  scene.enter();
  assert.doesNotThrow(() => scene.onEvent('warn', 'reef'), 'Toast hoạt động khi vào lại sa bàn');
  scene.leave();
  console.log('PASS: Lớp 3 Bài 09 — 27 bước/69 linh kiện; page, scene, M1–M5, chương trình mẫu, đá ngầm, đèn, phao, buồm và hai đợt bão.');
})().catch(e => { console.error(e); process.exitCode = 1; });
