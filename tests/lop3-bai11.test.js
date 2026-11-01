// Chạy: node tests/lop3-bai11.test.js – kiểm tra CAD, nhiệm vụ và sa bàn Lớp 3 Bài 11.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');

(async () => {
  const context = {
    window: { addEventListener() {} },
    document: { getElementById() { return null; } },
    performance: { now: () => 0 },
    requestAnimationFrame: () => 1,
    cancelAnimationFrame() {},
    Math
  };
  await require('./helpers/lesson-3d')(context, 'lop3/bai11');
  const model = context.window.LESSON_3D_DATA;
  const build = JSON.parse(read('content/lop3/bai11/build.json'));
  assert.equal(model.steps, 15, '15 bước lắp ráp');
  assert.equal(model.instances.length, 29, '29 linh kiện CAD');
  assert.equal(model.meshes.length, 30, '27 mesh CAD và 3 mesh nâng cấp');
  for (const [kind, expected] of Object.entries({ tank: 2, solar: 2, pump: 2 })) {
    assert.equal(model.creative[kind].length, expected, `Creative ${kind} có mesh riêng`);
    assert.ok(model.creative[kind].some(id => id >= 27), `Creative ${kind} dùng mesh bổ sung`);
    assert.ok(model.creative[kind].every(id => id >= 0 && id < model.meshes.length), `Creative ${kind} đúng chỉ số mesh`);
    assert.ok(model.creative[kind].every(id => fs.existsSync(path.join(root, build.meshes[id]))),
      `Creative ${kind} phải có dữ liệu mesh thực tế`);
  }
  const counts = model.instances.reduce((acc, p) => ((acc[p.step] = (acc[p.step] || 0) + 1), acc), {});
  [3, 1, 1, 2, 2, 2, 1, 4, 2, 5, 1, 2, 2, 1, 0].forEach((n, i) =>
    assert.equal(counts[i + 1] || 0, n, `Số linh kiện bước ${i + 1}`));
  assert.ok(model.instances.every(p => model.labels.names[p.name]), 'Mỗi mã linh kiện có tên tiếng Việt');
  for (const [code, count] of [['BE-3581', 1], ['BE-5158', 1], ['BE-1153', 1], ['BP-8841', 2], ['BP-8850', 2]])
    assert.equal(model.instances.filter(p => p.name === code).length, count, `Linh kiện ${code}`);

  vm.runInNewContext(read('js/lop3-bai11/lesson.js'), context);
  const lesson = context.window.LESSON;
  assert.equal(lesson.id, 'lop3-bai11');
  assert.equal(lesson.Engine, 'WaterEngine');
  assert.equal(lesson.defaultMode, 'pro');
  assert.deepEqual(Array.from(lesson.missions.core), ['m1', 'm2', 'm3', 'm4']);
  assert.deepEqual(Array.from(lesson.missions.pro), ['m5']);
  assert.equal(lesson.creative.slots.length, 3);
  assert.ok(lesson.creative.pics.tank.includes('<svg'), 'Có hình minh họa dự phòng');
  // Mỗi gói nâng cấp dùng các mesh sáng tạo đã khai báo trong build.json.
  const placementBox = list => {
    const lo = [0, 1, 2].map(i => Math.min(...list.map(p => p.pos[i])));
    const hi = [0, 1, 2].map(i => Math.max(...list.map(p => p.pos[i])));
    return { lo, hi, center: lo.map((v, i) => (v + hi[i]) / 2) };
  };
  const placed = lesson.creative.placements(model, {
    by: code => model.instances.filter(p => p.name === code),
    box: placementBox,
    make: (_src, pos, rotation, meshes, name) => ({ pos, rotation, meshes, name })
  });
  for (const key of ['back:tank', 'front:pump', 'roof:solar']) {
    assert.ok(placed[key]?.length, `Gói ${key} phải có hình 3D`);
    assert.ok(placed[key].every(p => p.meshes.every(id => id >= 0 && id < model.meshes.length)),
      `Gói ${key} phải dùng mesh CAD đã nạp`);
    const kind = key.split(':')[1];
    assert.ok(placed[key].some(p => p.meshes.some(id => model.creative[kind].includes(id))),
      `Gói ${key} phải lấy mesh sáng tạo, không dùng hình thay thế`);
  }
  assert.ok(placed['front:pump'][0].pos[2] < model.instances.find(p => p.name === 'BE-1153').pos[2],
    'Đầu bơm đặt phía trước (-Z), cùng hướng cảm biến');
  const page = read('content/lop3/bai11/page.html');
  for (const slot of ['header-copy', 'mission-chips', 'assembly-canvas', 'book-image', 'book-link', 'creative-canvas', 'sim-scene', 'sim-meters', 'sim-hint'])
    assert.ok(page.includes(`data-slot="${slot}"`), `Thiếu slot ${slot}`);
  for (const id of ['space-scene', 'chip-m1', 'chip-m2', 'chip-m3', 'chip-m4', 'chip-m5', 'm-speed', 'm-dist', 'm-water', 'm-time'])
    assert.ok(page.includes(`id="${id}"`), `Thiếu ${id}`);
  const book = lesson.book({ step: 14, page: 14, total: 15 });
  assert.equal(book.src, 'assets/lop3-bai11/step-14.jpg');
  assert.match(page, /id="book-img" src="assets\/lop3-bai11\/step-01\.jpg"/);
  for (let step = 1; step <= 15; step++) {
    const info = lesson.book({ step, page: step, total: 15 });
    const img = path.join(root, info.src);
    assert.ok(fs.existsSync(img), `Thiếu JPEG bước ${step}`);
    const data = fs.readFileSync(img);
    assert.ok(data.length > 1000 && data.length < 80 * 1024, `JPEG bước ${step} phải đủ dữ liệu và <80 KB`);
    assert.equal(data.subarray(0, 3).toString('hex'), 'ffd8ff', `JPEG bước ${step} phải đúng định dạng`);
    assert.equal(data.subarray(-2).toString('hex'), 'ffd9', `JPEG bước ${step} phải hoàn chỉnh`);
    assert.equal(info.pdf, `references/lop3/bai11/bai11.pdf#page=${step}`);
  }
  assert.equal(book.pdf, 'references/lop3/bai11/bai11.pdf#page=14');
  assert.ok(fs.existsSync(path.join(root, 'references/lop3/bai11/bai11.pdf')));

  vm.runInNewContext(read('js/lop3-bai11/water-engine.js'), context);
  const Water = context.window.WaterEngine;
  const B = {
    start: { type: 'start' }, rs: { type: 'repeatStart' }, re: { type: 'repeatEnd' },
    low: { type: 'motor', speed: 'low' }, high: { type: 'motor', speed: 'high' },
    power: { type: 'motor_power', power: 8 },
    sensor: { type: 'sensor_obstacle' }, stop: { type: 'stop' },
    wait: n => ({ type: 'wait', duration: n })
  };
  const sample = [B.start, B.rs, B.low, B.sensor, B.stop, B.wait(3), B.re];
  const speedrun = [B.start, B.rs, B.power, B.sensor, B.stop, B.wait(3), B.re];
  const run = (program, seconds, { advanced = false, upgrades = [], assembly = false } = {}) => {
    const sim = new Water();
    const states = [], events = [];
    sim.onMissionUpdate = state => states.push(state);
    sim.onEvent = (event, payload) => events.push({ event, payload });
    sim.setAdvanced(advanced);
    sim.setUpgrades(upgrades);
    if (assembly) sim.setAssemblyDone(true);
    sim.setProgram(program);
    sim.start();
    for (let t = 0; t < seconds && sim.running; t += 0.05) sim.advance(0.05);
    sim.checkMissions();
    return { sim, state: states.at(-1), events: events.map(e => e.event) };
  };
  assert.equal(new Water().course().sites.length, 3);
  assert.equal(Water.SENSE, 15);
  assert.equal(new Water().pumpTime(), 3);
  const first = run(sample, 7);
  assert.ok(first.events.includes('found'), 'Cảm biến nhận mỏm băng');
  assert.equal(first.sim.got(), 1, 'Đã bơm mỏm thứ nhất');
  assert.ok(first.state.m2, 'NV2: hoàn thành vòng đầu của chương trình mẫu');
  assert.ok(!run([B.start, B.rs, B.high, B.sensor, B.stop, B.wait(3), B.re], 8).state.m2,
    'Motor High không được tính là chương trình mẫu Motor Low');
  assert.ok(!run(speedrun, 8).state.m2, 'motor_power mức 8 không được tính là mẫu Motor Low');
  const atSite = new Water();
  atSite.x = atSite.sites[0].a;
  assert.equal(atSite.seen(), atSite.sites[0], 'Cảm biến phải phát hiện vật cản tại đúng tọa độ (0 cm)');
  const full = run(sample, 30, { assembly: true });
  assert.equal(full.sim.got(), 3, 'NV3: đủ 3 mẫu nước');
  assert.equal(full.sim.liters(), 6, 'Mỗi mẫu 2 lít');
  assert.ok(full.state.m1 && full.state.m2 && full.state.m3);
  assert.ok(full.events.includes('allSampled'));
  assert.ok(!run([B.start, B.rs, B.low, B.wait(3), B.re], 8).state.m2, 'Sai mẫu không đạt NV2');
  assert.equal(run([B.start, B.rs, B.low, B.sensor, B.stop, B.wait(1), B.re], 30).sim.got(), 0,
    'Bơm 1 giây rồi chạy lại thì chưa lấy được nước');
  assert.equal(run([B.start, B.low, B.wait(20), B.stop], 30).sim.got(), 0,
    'Không dùng cảm biến để dừng sẽ đi qua mỏm băng');
  const upgraded = run(sample, 30, { upgrades: ['tank', 'pump'] });
  assert.equal(upgraded.sim.got(), 3);
  assert.equal(upgraded.sim.liters(), 9, 'Bồn chứa thêm một lít mỗi mẫu');
  assert.equal(upgraded.sim.pumpTime(), 1.5, 'Máy bơm mạnh giảm nửa thời gian');
  assert.ok(upgraded.state.m4, 'NV4: gắn thêm chi tiết và chạy động cơ');
  assert.equal(new Water().course().end, 220);
  const slowPro = run(sample, 30, { advanced: true });
  assert.equal(slowPro.sim.got(), 3);
  assert.ok(slowPro.events.includes('late') && !slowPro.state.m5, 'Chế độ Nâng cao: quá 18 giây');
  const fastPro = run(speedrun, 18, { advanced: true, upgrades: ['pump'] });
  assert.ok(fastPro.state.m5, 'NV5: bơm đủ ba mỏm trước 18 giây');
  assert.ok(fastPro.sim.runT <= 18, `Thời gian ${fastPro.sim.runT}`);
  assert.ok(fastPro.events.includes('allSampled'));

  // Vẽ canvas: khởi động không có art.js rồi nạp art.js sau, scene phải tự dùng đồ họa mới.
  const draws = [], frames = new Map(), canceled = [];
  let nextId = 0, observes = 0, disconnects = 0;
  const ctx = new Proxy({}, { get(target, prop) { return prop in target ? target[prop] : (...args) => draws.push([prop, ...args]); } });
  const nodes = {};
  const missing = new Set();
  const node = id => nodes[id] ||= { hidden: false, dataset: {}, clientWidth: 900, addEventListener() {}, setAttribute() {}, getContext: () => ctx };
  const sceneCtx = {
    window: { simEngine: full.sim, devicePixelRatio: 1 },
    document: { getElementById: id => missing.has(id) ? null : node(id) },
    zmReady(fn) { fn(); },
    requestAnimationFrame(fn) { frames.set(++nextId, fn); return nextId; },
    cancelAnimationFrame(id) { canceled.push(id); frames.delete(id); },
    ResizeObserver: class { observe() { observes++; } disconnect() { disconnects++; } },
    clearTimeout() {}, setTimeout() { return 1; },
    performance: { now: () => 1000 }, Math
  };
  const stepFrame = ts => {
    assert.equal(frames.size, 1, 'Chỉ có một khung hình được xếp lịch');
    const [id, fn] = frames.entries().next().value;
    frames.delete(id);
    fn(ts);
  };
  vm.runInNewContext(read('js/lop3-bai11/water-scene.js'), sceneCtx);
  const scene = sceneCtx.window.ZMScene;
  assert.ok(scene && typeof scene.enter === 'function' && typeof scene.onEvent === 'function');
  assert.equal(frames.size, 0, 'Không chạy rAF khi chưa vào chặng');
  scene.enter();
  assert.equal(observes, 1);
  stepFrame(1000);
  assert.ok(draws.some(d => d[0] === 'fillRect'), 'Fallback canvas vẽ khi thiếu art.js');
  let called = 0;
  sceneCtx.window.WaterArt = { drawBackground() { called++; } };
  stepFrame(1100);
  assert.ok(called > 0, 'Hình art.js nạp muộn được dùng, các hàm còn thiếu có fallback');
  scene.onEvent('found', {});
  scene.onEvent('pumped', { site: full.sim.sites[0], count: 1 });
  scene.setMode('robot');
  assert.equal(scene.mode(), 'robot');
  assert.equal(frames.size, 0, 'Chuyển sang xem robot phải hủy rAF của câu chuyện');
  scene.setMode('story');
  assert.equal(frames.size, 1, 'Quay về câu chuyện phải chạy lại rAF');
  missing.add('scene-toast-title');
  missing.add('scene-toast-text');
  missing.add('scene-toast-btn');
  assert.doesNotThrow(() => scene.onEvent('wall'), 'Thông báo an toàn khi thiếu DOM con');
  scene.leave();
  assert.equal(frames.size, 0, 'Rời chặng phải hủy hoàn toàn rAF');
  assert.ok(canceled.length >= 2, 'Thực sự gọi cancelAnimationFrame khi chuyển chế độ/rời chặng');
  assert.equal(disconnects, 1, 'Rời chặng phải ngắt ResizeObserver');
  scene.enter();
  assert.equal(frames.size, 1, 'Vào lại chặng phải khôi phục một rAF');
  assert.equal(observes, 2, 'Vào lại chặng phải quan sát resize');
  scene.leave();
  assert.equal(frames.size, 0);

  console.log('PASS: Lớp 3 Bài 11 – 29 linh kiện/15 JPEG, mesh nâng cấp, cảm biến 0 cm, tốc độ mẫu, bơm 3 điểm, 18 giây, null DOM, rAF/ResizeObserver và PDF; NV1–NV5.');
})().catch(e => { console.error(e); process.exitCode = 1; });
