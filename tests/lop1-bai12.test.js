// Chạy: node tests/lop1-bai12.test.js – bài Đê ngăn lũ, dữ liệu 3D, nhiệm vụ, cảnh canvas.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const B = {
  start: { type: 'start' },
  rs: { type: 'repeatStart' },
  re: { type: 'repeatEnd' },
  touch: { type: 'sensor_touch' },
  low: { type: 'motor', speed: 'low' },
  high: { type: 'motor', speed: 'high' },
  p: n => ({ type: 'motor_power', power: n }),
  reverse: { type: 'motor_reverse' },
  stop: { type: 'stop' },
  wait: s => ({ type: 'wait', duration: s })
};

(async () => {
  const context = {
    window: { addEventListener() {} },
    document: { getElementById() { return null; } },
    performance: { now: () => 0 },
    setTimeout: fn => fn(),
    clearTimeout() {},
    cancelAnimationFrame() {},
    requestAnimationFrame() { return 0; },
    Math
  };
  await require('./helpers/lesson-3d')(context, 'lop1/bai12');
  const model = context.window.LESSON_3D_DATA;
  assert.equal(model.label, 'Bài 12');
  assert.equal(model.steps, 24, 'Đê có 24 bước lắp ráp');
  assert.equal(model.instances.length, 57, 'Đê có 57 linh kiện CAD');
  assert.equal(model.stepDescriptions.length, 24);
  assert.ok(model.instances.every(p => model.labels.names[p.name]), 'Linh kiện có tên tiếng Việt');
  assert.ok(model.instances.every(p => p.step >= 1 && p.step <= 24));

  vm.runInNewContext(read('js/bai12/lesson.js'), context);
  const L = context.window.LESSON;
  assert.equal(L.id, 'lop1-bai12');
  assert.equal(L.Engine, 'DamEngine');
  assert.deepEqual(Array.from(L.missions.core), ['m1', 'm2', 'm3', 'm4']);
  assert.deepEqual(Array.from(L.missions.pro), ['m5']);
  assert.ok(!L.creative, 'Bài này cải tiến chương trình, không tự thêm linh kiện');
  for (const id of [...L.missions.core, ...L.missions.pro]) assert.ok(L.cards[id], `Thiếu nhiệm vụ ${id}`);
  const page = read('content/lop1/bai12/page.html');
  const shell = read('bai.html');
  const slots = [...shell.matchAll(/<template\s+data-slot="([^"]+)"/g)].map(m => m[1]);
  for (const slot of slots) assert.ok(page.includes(`data-slot="${slot}"`), `Thiếu vị trí giao diện ${slot}`);
  for (const id of ['space-scene', 'scene-hand', 'm-speed', 'm-dist', 'm-target', 'm-sample', 'calc-eq1', 'calc-eq2']) {
    assert.ok(page.includes(`id="${id}"`), `Thiếu phần tử ${id}`);
  }
  assert.ok(page.includes('max="24"'));
  const bookLast = L.book({ page: 24 });
  assert.equal(bookLast.src, 'assets/lop1-bai12/step-24.jpg');
  assert.equal(L.book({ step: 7 }).src, 'assets/lop1-bai12/step-07.jpg');
  for (let step = 1; step <= 24; step++) {
    const image = path.join(root, `assets/lop1-bai12/step-${String(step).padStart(2, '0')}.jpg`);
    assert.ok(fs.existsSync(image), `Thiếu ảnh sách bước ${step}`);
    assert.ok(fs.statSync(image).size < 80 * 1024, `Ảnh sách bước ${step} quá lớn`);
  }
  assert.match(bookLast.alt, /bước 24/);
  assert.equal(bookLast.loc, 'Bước 24 / 24');
  assert.equal(bookLast.pdf, bookLast.src);
  assert.ok(page.includes('href="assets/lop1-bai12/step-01.jpg"'), 'Trang có liên kết hình lớn bước đầu');
  assert.ok(page.includes('src="assets/lop1-bai12/step-01.jpg"'), 'Ảnh mặc định phải hiện ngay khi nạp trang');
  const sampleBlocks = L.blocks.sample.map(item => Array.isArray(item) ? item.join(':') : item);
  assert.equal(sampleBlocks.filter(k => k.includes('wait:')).length, 2);
  assert.ok(sampleBlocks.every(k => !k.includes('duration:1')));
  assert.equal(L.blocks.sample[4][1].duration, 0.5);
  assert.equal(L.blocks.sample[9][1].duration, 0.5);

  vm.runInNewContext(read('js/lesson-engine.js'), context);
  vm.runInNewContext(read('js/bai12/dam-engine.js'), context);
  const Dam = context.window.DamEngine;
  const near = (actual, expected, tolerance = 0.3) => assert.ok(
    Math.abs(actual - expected) <= tolerance, `Góc ${actual}° cần gần ${expected}°`
  );
  near(Dam.RATE(4), 45, 0.001);
  near(Dam.RATE(8), 90, 0.001);
  assert.equal(Dam.FLOOD_AT, 5);
  assert.equal(Dam.FLOOD_END, 9);

  function simulate(program, { seconds = 9.2, presses = [], advanced = false, level } = {}) {
    const sim = new Dam();
    const events = [], states = [];
    sim.onEvent = kind => events.push(kind);
    sim.onMissionUpdate = state => states.push(state);
    if (advanced) sim.setAdvanced(true);
    if (level !== undefined) sim.level = level;
    sim.setProgram(program);
    sim.start();
    for (let i = 0; i < seconds / 0.02; i++) {
      const t = i * 0.02;
      if (presses.some(p => Math.abs(p - t) < 0.005)) sim.pressTouch();
      sim.advance(0.02);
    }
    sim.checkMissions();
    return { sim, events, state: states.at(-1) };
  }
  const sample = [B.start, B.rs, B.touch, B.low, B.wait(.5), B.stop,
    B.touch, B.reverse, B.low, B.wait(.5), B.stop, B.re];
  const sampleRun = simulate(sample, { presses: [.1, 1.1] });
  assert.ok(sampleRun.state.m2 && sampleRun.events.includes('sample'), 'Hai lần nhấn theo đúng mẫu đạt NV2');
  assert.ok(!sampleRun.state.m3 && sampleRun.events.includes('flood'), 'Mẫu nâng/hạ chỉ dạy điều khiển, không chống lũ');
  near(sampleRun.sim.angle, 0);
  assert.ok(!simulate(sample, { presses: [.1] }).state.m2, 'Một lần nhấn chưa đạt NV2');
  assert.ok(!simulate([B.start, B.rs, B.touch, B.low, B.wait(1), B.stop,
    B.touch, B.reverse, B.low, B.wait(1), B.stop, B.re], { presses: [.1, 1.5] }).state.m2,
  'Đổi thời gian so với mẫu không đạt NV2');
  assert.ok(!simulate([B.start, B.rs, B.touch, B.high, B.wait(.5), B.stop,
    B.touch, B.reverse, B.low, B.wait(.5), B.stop, B.re], { presses: [.1, 1.1] }).state.m2,
  'Đổi Quay chậm thành Quay nhanh không đạt NV2');

  const safe = [B.start, B.touch, B.high, B.wait(.5), B.stop];
  const saved = simulate(safe, { presses: [.1] });
  near(saved.sim.angle, 45);
  assert.ok(saved.state.m3 && saved.events.includes('saved') && !saved.sim.flooded, 'NV3: dựng đê trước khi lũ tới');
  assert.ok(!saved.state.m2, 'Không đạt NV2 nếu không đúng chương trình mẫu');
  assert.ok(!simulate(safe).state.m3, 'Không nhấn cảm biến thì lũ tràn');
  assert.ok(simulate([B.start, B.touch, B.low, B.wait(.5), B.stop], { presses: [.1] }).sim.flooded,
    'Đê dưới 40° bị ngập ở chế độ Bé');
  const lowered = simulate([B.start, B.touch, B.high, B.wait(.5), B.stop,
    B.touch, B.reverse, B.high, B.wait(.5), B.stop], { presses: [.1, 1.1] });
  assert.ok(lowered.sim.flooded && !lowered.state.m3, 'Hạ đê trước khi nước rút không bảo vệ được làng');

  const campaign = new Dam();
  let campaignState;
  campaign.onMissionUpdate = state => { campaignState = state; };
  campaign.setAssemblyDone(true);
  assert.ok(campaignState.m1, 'Hoàn tất 24 bước đạt NV1');
  function playOn(sim, program, { level, presses = [.1] } = {}) {
    sim.setProgram(program);
    if (level !== undefined) sim.level = level;
    sim.start();
    for (let i = 0; i < 470; i++) {
      if (presses.some(p => Math.abs(p - i * 0.02) < 0.005)) sim.pressTouch();
      sim.advance(0.02);
    }
    sim.checkMissions();
  }
  playOn(campaign, safe);
  assert.equal(campaign.wins, 1);
  playOn(campaign, safe);
  assert.equal(campaign.wins, 2);
  assert.ok(!campaignState.m4, 'Thi đấu 2 lần bằng cùng chương trình chưa đạt NV4');
  playOn(campaign, [B.start, B.touch, B.low, B.wait(1), B.stop]);
  assert.equal(campaign.wins, 3);
  assert.ok(campaignState.m4, 'Cải tiến chương trình và thắng thêm lượt đạt NV4');

  const pro = new Dam();
  pro.setAdvanced(true);
  assert.ok(pro.advanced && [30, 45, 60, 75].includes(pro.level));
  let proState;
  pro.onMissionUpdate = s => { proState = s; };
  for (const [level, seconds] of [[30, .8], [45, 1.1], [60, 1.4]]) {
    playOn(pro, [B.start, B.touch, B.low, B.wait(seconds), B.stop], { level });
    assert.ok(pro.bHits.has(level), `Mức lũ ${level}° phải được chặn đúng`);
  }
  assert.ok(proState.m5 && pro.bHits.size === 3, 'NV5: chặn đủ 3 mức lũ khác nhau');
  const tooHigh = simulate([B.start, B.touch, B.high, B.wait(1), B.stop], {
    advanced: true, level: 30, presses: [.1]
  });
  assert.ok(tooHigh.sim.tooHigh && !tooHigh.state.m3 && tooHigh.events.includes('tooHigh'),
    'Nâng quá mức khiến thuyền không qua được');
  const tooLow = simulate([B.start, B.touch, B.low, B.wait(.5), B.stop], {
    advanced: true, level: 60, presses: [.1]
  });
  assert.ok(tooLow.sim.flooded && !tooLow.state.m5, 'Nâng thiếu so với mức lũ thì bị ngập');

  // Callback đổi mức đã lên lịch không được ghi đè trạng thái sau khi đổi chế độ.
  const pendingTimers = new Map(), clearedTimers = [];
  let nextTimer = 0;
  context.setTimeout = fn => { pendingTimers.set(++nextTimer, fn); return nextTimer; };
  context.clearTimeout = id => { clearedTimers.push(id); pendingTimers.delete(id); };
  const delayed = simulate(safe, { advanced: true, level: 30, presses: [.1] }).sim;
  assert.equal(pendingTimers.size, 1, 'Thắng mức Nâng cao đặt hẹn đổi mức');
  const [oldTimerId, oldCallback] = [...pendingTimers.entries()][0];
  delayed.setAdvanced(false);
  assert.ok(clearedTimers.includes(oldTimerId), 'Chuyển về Bé phải hủy timer');
  assert.equal(delayed.level, 40);
  oldCallback(); // kể cả callback cũ đã lọt vào hàng đợi, phải tự kiểm tra chế độ
  assert.equal(delayed.level, 40, 'Timer cũ không được sửa mức lũ Bé');
  const another = simulate(safe, { advanced: true, level: 30, presses: [.1] }).sim;
  assert.equal(pendingTimers.size, 1);
  another.reset();
  assert.equal(pendingTimers.size, 0, 'Reset phải dọn timer đổi mức còn treo');
  pro.setAdvanced(false);
  assert.equal(pro.need(), Dam.NEED_KID, 'Trở về chế độ Bé cần 40°');
  const idle = new Dam();
  idle.setProgram(safe);
  idle.advance(1);
  assert.equal(idle.running, false, 'Thay khối không tự chạy');
  near(idle.pose3d().output, 0);

  // Khởi tạo scene và vẽ đúng API FloodArt, kiểm tra mực nước chuẩn hóa 0..1.
  const handlers = {};
  const drawCalls = [];
  const canvasContext = new Proxy({}, { get(target, key) {
    if (key in target) return target[key];
    return () => {};
  } });
  const sceneCanvas = {
    clientWidth: 900,
    getContext: () => canvasContext,
    addEventListener(name, fn) { handlers[name] = fn; }
  };
  const rafCallbacks = [], cancelledFrames = [], keyHandlers = [], stageTransitions = [];
  let stageActive = false;
  const art = {};
  for (const name of ['drawBackground', 'drawLevee', 'drawWater', 'drawFloodgate',
    'drawWaterLevelMarker', 'drawVillage', 'drawTouchSensor', 'drawRescueBoat']) {
    art[name] = (...args) => drawCalls.push({ name, args });
  }
  const sceneContext = {
    window: {
      FloodArt: art, simEngine: saved.sim, addEventListener() {},
      ZMStages: { go(stage, focus) { stageTransitions.push([stage, focus]); } }
    },
    document: {
      getElementById: id => id === 'space-scene' ? sceneCanvas
        : id === 'stage-sim' ? { classList: { contains: () => stageActive } } : null,
      addEventListener(name, fn, capture) { if (name === 'keydown') keyHandlers.push({ fn, capture }); }, activeElement: null
    },
    zmReady: cb => cb(),
    ResizeObserver: class { observe() {} },
    requestAnimationFrame: cb => { rafCallbacks.push(cb); return rafCallbacks.length; },
    cancelAnimationFrame: id => { cancelledFrames.push(id); },
    clearTimeout() {}, setTimeout: () => 1,
    performance: { now: () => 0 }, Math
  };
  vm.runInNewContext(read('js/scene-kit.js'), sceneContext);
  vm.runInNewContext(read('js/bai12/flood-scene.js'), sceneContext);
  const scene = sceneContext.window.ZMScene;
  assert.ok(scene && typeof scene.enter === 'function' && typeof scene.setMode === 'function');
  scene.enter();
  stageActive = true;
  rafCallbacks.shift()(100);
  const marker = drawCalls.find(call => call.name === 'drawWaterLevelMarker');
  assert.ok(marker && marker.args[3] >= 0 && marker.args[3] <= 1, 'Mực nước API art phải trong 0..1');
  assert.equal(typeof handlers.click, 'function', 'Nhấn canvas kích hoạt cảm biến');
  handlers.click();
  assert.ok(saved.sim.touch, 'Cảnh chuyển thao tác nhấn tới động cơ');
  scene.setMode('robot');
  assert.equal(scene.mode(), 'robot');
  const stageHandler = keyHandlers.find(item => item.capture === true);
  assert.ok(stageHandler, 'Listener chuyển chặng phải được đăng ký');
  let blocked = 0;
  stageHandler.fn({ key: 'ArrowRight', target: { dataset: { stage: 'assembly' } }, preventDefault() { blocked++; }, stopPropagation() {} });
  assert.equal(blocked, 1, 'Phím mũi tên chuyển chặng khi sa bàn đang mở');
  assert.deepEqual(stageTransitions, [['sim', true]]);
  scene.leave();
  stageActive = false;
  assert.ok(cancelledFrames.length > 0, 'Rời scene phải hủy frame đang đợi');
  const pendingCount = rafCallbacks.length;
  rafCallbacks.at(-1)(200);
  assert.equal(rafCallbacks.length, pendingCount, 'Callback trễ không tạo frame sau leave');
  blocked = 0;
  stageHandler.fn({ key: 'ArrowRight', target: { dataset: { stage: 'assembly' } }, preventDefault() { blocked++; }, stopPropagation() {} });
  assert.equal(blocked, 0, 'Phím mũi tên không bị chặn khi scene đã rời');

  console.log('PASS: lop1-bai12 – 57 linh kiện/24 bước, trang bài, NV1–NV5, cảm biến chạm, lũ Bé/Nâng cao, 3 mức nước, API cảnh canvas.');
})().catch(err => { console.error(err); process.exitCode = 1; });
