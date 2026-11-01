// Chạy: node tests/lop1-bai13.test.js – kiểm thử hoàn thiện bài học, chỉ dùng Node.js built-in.
// Phần dữ liệu 3D chỉ kiểm khi content/lop1/bai13/build.json đã có.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
(async () => {
const context = {
  window: { addEventListener() {} },
  document: { getElementById() { return null; } },
  performance: { now: () => 0 },
  cancelAnimationFrame() {},
  requestAnimationFrame() { return 0; },
  setTimeout: fn => fn(),
  Math
};

let model;
if (fs.existsSync(path.join(root, 'content/lop1/bai13/build.json'))) {
  await require('./helpers/lesson-3d')(context, 'lop1/bai13');
  model = context.window.LESSON_3D_DATA;
  assert.equal(model.label, 'Bài 13');
  assert.equal(model.steps, 22, 'Sách lắp ráp có đủ 22 bước');
  assert.equal(model.instances.length, 58, 'Mô hình CAD gồm 58 linh kiện');
  assert.equal(model.instances.filter(p => p.step === 22).length, 0, 'Bước 22 chỉ quan sát');
  assert.ok(model.instances.length > 0 && model.steps > 0, 'Mô hình có linh kiện và bước');
  assert.ok(model.instances.every(p => model.labels.names[p.name]), 'Mọi mã đều có tên tiếng Việt');
  const source = JSON.parse(fs.readFileSync(path.join(root, 'content/lop1/bai13/build.json'), 'utf8'));
  for (const [name, count] of Object.entries({ blade: 2, beacon: 2, salt: 1, chain: 1 })) {
    const refs = model.creative?.[name];
    assert.equal(refs?.length, count, `Thiếu mesh sáng tạo ${name}`);
    for (const i of refs) {
      assert.ok(Number.isInteger(i) && i >= 0 && i < model.meshes.length, `Chỉ số mesh sai: ${name}:${i}`);
      assert.ok(model.meshes[i]?.v > 0 && model.meshes[i]?.z?.length > 0, `Mesh ${name}:${i} chưa tải được hình học`);
      assert.ok(fs.existsSync(path.join(root, source.meshes[i])), `Thiếu tệp mesh ${name}:${i}`);
    }
  }
}

// Cấu hình bài
vm.runInNewContext(fs.readFileSync(path.join(root, 'js/bai13/lesson.js'), 'utf8'), context);
const L = context.window.LESSON;
assert.equal(L.id, 'lop1-bai13');
assert.equal(L.Engine, 'PlowEngine');
assert.equal(JSON.stringify(L.missions), '{"core":["m1","m2","m3","m4"],"pro":["m5"]}');
for (const m of [...L.missions.core, ...L.missions.pro]) assert.ok(L.cards[m], 'Thiếu thẻ ' + m);
assert.equal(L.creative.slots.length, 4);
for (const p of L.creative.presets) assert.ok(L.creative.pics[p.id].startsWith('<svg'), 'Thiếu hình gói ' + p.id);
assert.ok(fs.existsSync(path.join(root, 'content/lop1/bai13/page.html')), 'Thiếu page.html');
const page = fs.readFileSync(path.join(root, 'content/lop1/bai13/page.html'), 'utf8');
for (const slot of ['header-copy', 'assembly-canvas', 'book-image', 'book-link', 'creative-canvas', 'sim-scene', 'sim-meters']) {
  assert.ok(page.includes(`data-slot="${slot}"`), 'Thiếu vị trí trang ' + slot);
}
assert.ok(page.includes('js/bai13/book/step-01.jpg'), 'Ảnh mở đầu phải dùng đường dẫn thực');
for (let i = 1; i <= 22; i++) {
  const src = `js/bai13/book/step-${String(i).padStart(2, '0')}.jpg`;
  const bytes = fs.readFileSync(path.join(root, src));
  assert.ok(bytes.length > 1000 && bytes[0] === 0xff && bytes[1] === 0xd8, 'Ảnh PDF lắp ráp thiếu hoặc lỗi: ' + src);
  assert.equal(L.book({ page: i }).src, src, 'Đường dẫn sách bước ' + i);
}
assert.ok(L.book({ page: 22 }).cap.includes('quan sát'), 'Bước 22 phải là bước quan sát');
assert.equal(L.book({ step: 1 }).src, L.book({ page: 1 }).src, 'Sự kiện chỉ có step phải hiển thị đúng trang');
assert.equal(L.book({ step: 22 }).src, L.book({ page: 22 }).src);
assert.ok(L.book({}).src.endsWith('step-01.jpg'), 'Không có dữ liệu trang phải về bước 1');
assert.ok(L.book({ page: 999 }).src.endsWith('step-22.jpg'), 'Trang vượt giới hạn phải được chặn');
assert.ok(L.book().src.endsWith('step-01.jpg'), 'Thiếu object trang phải an toàn');
if (model) {
  const box = list => {
    assert.ok(list.length, 'Điểm neo 3D phải có linh kiện thực');
    const p = list[0].pos;
    return { lo: p.map(v => v - 0.01), hi: p.map(v => v + 0.01), center: p.slice() };
  };
  const by = name => model.instances.filter(i => i.name === name);
  const make = (src, pos, rotation, meshes, name) => ({ pos, rotation, meshes, name });
  const placements = L.creative.placements(model, { box, by, make });
  for (const [key, expected] of Object.entries({ 'front:blade': 1, 'roof:beacon': 1, 'back:salt': 1, 'wheel:chain': 2 })) {
    assert.equal(placements[key].length, expected, `Gói ${key} phải có chi tiết 3D`);
    for (const p of placements[key]) {
      assert.ok(p.meshes.length && p.meshes.every(i => model.meshes[i]), `Lỗi hình học gói ${key}`);
      assert.ok(p.pos.every(Number.isFinite), `Lỗi vị trí gói ${key}`);
    }
  }
  const wheels = by('BP-8850');
  assert.equal(JSON.stringify(placements['wheel:chain'].map(p => p.rotation)), JSON.stringify(wheels.map(w => w.rotation)), 'Vòng xích phải theo trục bánh thực');
}

// Chạy thật vòng đời Scene khi DOM thiếu hoặc sẵn sàng; kiểm tra dừng rAF/timer.
const sceneContext = {
  window: {}, document: { getElementById() { return null; } },
  performance: { now: () => 0 }, requestAnimationFrame: () => 1,
  cancelAnimationFrame() {}, clearTimeout() {}, setTimeout: () => 1,
  zmReady(fn) { fn(); }
};
vm.runInNewContext(fs.readFileSync(path.join(root, 'js/scene-kit.js'), 'utf8'), sceneContext);
vm.runInNewContext(fs.readFileSync(path.join(root, 'js/bai13/snow-scene.js'), 'utf8'), sceneContext);
for (const method of ['enter', 'leave', 'onEvent', 'setMode']) {
  assert.equal(typeof sceneContext.window.ZMScene[method], 'function', 'Cảnh thiếu ' + method);
}
sceneContext.window.ZMScene.enter();
sceneContext.window.ZMScene.onEvent('short', { left: 2 });
sceneContext.window.ZMScene.onEvent('start');
sceneContext.window.ZMScene.setMode('robot');
sceneContext.window.ZMScene.setMode('story');
sceneContext.window.ZMScene.leave();

let readyScene, nextFrame = 0, hands = 0;
const cancelled = [], cleared = [], timers = [], callbacks = new Map();
const clickHandlers = {};
const nodes = {
  'space-scene': { clientWidth: 600, getContext: () => ({}), addEventListener(type, fn) { clickHandlers[`canvas:${type}`] = fn; } },
  'scene-hand': { addEventListener(type, fn) { clickHandlers[`hand:${type}`] = fn; }, classList: { toggle() {} } },
  'scene-toast': { hidden: true, dataset: {} },
  'scene-toast-btn': { hidden: true },
  'scene-toast-title': {}, 'scene-toast-text': {}
};
const liveScene = {
  window: { simEngine: { press() {}, putHand() { hands++; } } },
  document: { getElementById: id => nodes[id] || null, addEventListener() {} },
  performance: { now: () => 1000 },
  requestAnimationFrame(fn) { callbacks.set(++nextFrame, fn); return nextFrame; },
  cancelAnimationFrame(id) { cancelled.push(id); callbacks.delete(id); },
  setTimeout(fn) { timers.push(fn); return timers.length; },
  clearTimeout(id) { cleared.push(id); },
  ResizeObserver: class { observe() {} disconnect() {} },
  zmReady(fn) { readyScene = fn; }
};
vm.runInNewContext(fs.readFileSync(path.join(root, 'js/scene-kit.js'), 'utf8'), liveScene);
vm.runInNewContext(fs.readFileSync(path.join(root, 'js/bai13/snow-scene.js'), 'utf8'), liveScene);
readyScene();
clickHandlers['hand:click']();
clickHandlers['canvas:click']();
assert.equal(hands, 2, 'Nút bàn tay và chạm cảnh phải kích hoạt cảm biến siêu âm');
liveScene.window.ZMScene.enter();
assert.equal(nextFrame, 1, 'Vào chặng phải khởi động vẽ');
liveScene.window.ZMScene.onEvent('short', { left: 2 });
assert.equal(nodes['scene-toast'].hidden, false, 'Thông báo được hiển thị khi đang ở chặng');
liveScene.window.ZMScene.setMode('robot');
assert.equal(nextFrame, 1, 'Đổi sang 3D không khởi tạo thêm vòng vẽ');
liveScene.window.ZMScene.setMode('story');
assert.equal(nextFrame, 1, 'Quay về 2D tái sử dụng vòng vẽ của kit');
liveScene.window.ZMScene.leave();
assert.ok(cancelled.includes(1), 'Rời chặng phải cancelAnimationFrame');
assert.equal(nodes['scene-toast'].hidden, true, 'Rời chặng phải ẩn thông báo');
assert.ok(cleared.includes(1), 'Rời chặng phải xóa timer');
callbacks.get(1)?.(1200);
assert.equal(nextFrame, 1, 'Callback còn sót không được tạo vòng vẽ mới');
liveScene.window.ZMScene.onEvent('short', { left: 2 });
assert.equal(timers.length, 1, 'Rời chặng không được tạo timer mới');
const artContext = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(root, 'js/bai13/art.js'), 'utf8'), artContext);
for (const method of ['drawBackground', 'drawStation', 'drawPile', 'drawWall', 'drawPlow', 'drawHand']) {
  assert.equal(typeof artContext.window.SnowArt[method], 'function', 'Hình vẽ thiếu ' + method);
}

vm.runInNewContext(fs.readFileSync(path.join(root, 'js/lesson-engine.js'), 'utf8'), context);
vm.runInNewContext(fs.readFileSync(path.join(root, 'js/bai13/plow-engine.js'), 'utf8'), context);
const Plow = context.window.PlowEngine;
assert.ok(Math.abs(Plow.SPEED(8) - 39.27) < 0.01, 'Mức 8 ≈ 39,3 cm/giây');
assert.ok(Math.abs(Plow.SPEED(4) - 19.63) < 0.01, 'Mức 4 ≈ 19,6 cm/giây');

const B = {
  start: { type: 'start' },
  rs: { type: 'repeatStart' },
  re: { type: 'repeatEnd' },
  obs: { type: 'sensor_obstacle' },
  fw: { type: 'drive', move: 'forward', speed: 'high' },
  turn: { type: 'drive', move: 'left', speed: 'high' },
  high: { type: 'motor', speed: 'high' },
  low: { type: 'motor', speed: 'low' },
  power: n => ({ type: 'motor_power', power: n }),
  wait: s => ({ type: 'wait', duration: s }),
  stop: { type: 'stop' }
};
function cycle(waitTime = 1, turn = true) {
  return [B.start, B.rs, B.obs, B.fw, B.wait(waitTime), B.obs, B.stop,
    ...(turn ? [B.turn, B.wait(.2)] : []), B.re];
}
function run(program, seconds, { upgrades = [], advanced = false, hands = [] } = {}) {
  const sim = new Plow(), states = [], events = [];
  sim.onMissionUpdate = s => states.push(s);
  sim.onEvent = type => events.push(type);
  if (advanced) sim.setAdvanced(true);
  sim.setUpgrades(upgrades);
  sim.setProgram(program);
  sim.start();
  for (let t = 0; t < seconds && sim.running; t += .02) {
    if (hands.some(h => Math.abs(h - t) < .01)) sim.putHand();
    sim.advance(.02);
  }
  sim.checkMissions();
  return { sim, state: states.at(-1), events };
}
const near = (a, b, tol, message) => assert.ok(Math.abs(a - b) <= tol,
  message + ': got ' + a + ', expected ' + b);
const sample = cycle(1);
assert.deepEqual(sample.map(b => b.type), [
  'start', 'repeatStart', 'sensor_obstacle', 'drive', 'wait', 'sensor_obstacle',
  'stop', 'drive', 'wait', 'repeatEnd'
], 'Mẫu KHGD phải đúng thứ tự 10 khối');
assert.equal(L.blocks.sample.length, 10);
assert.ok(L.blocks.toolbox.includes('moveForward') && L.blocks.toolbox.includes('turnLeft'));
assert.ok(page.includes('Chờ 0,2 giây'), 'Chip NV2 thiếu thời gian rẽ 0,2s');
assert.equal(new Plow().matchesSample(), false);
const s = run(sample, 10);
assert.ok(s.sim.matchesSample(), '10 khối đúng chữ ký KHGD');
assert.equal(s.sim.left(), 0, 'Mẫu phải dọn sạch 3 đống trên sân Bé');
assert.equal(s.sim.cycles, 3);
assert.ok(s.state.m2 && s.state.m3 && !s.state.m5,
  'NV2, NV3 đạt theo mẫu: ' + JSON.stringify(s.state));
assert.ok(s.events.includes('deliver') && !s.events.includes('crash'));
assert.equal(s.state.lastRun.cycles, 3);
assert.ok(s.sim.theta > .3 && s.sim.y > 0, 'Xe thực sự rẽ trên sa bàn 2D');
assert.ok(s.sim.wheelLeft !== s.sim.wheelRight, 'Hai bánh phải có quãng quay khác nhau khi rẽ');
const first = run(sample, 1.5);
assert.ok(first.state.m2 && !first.state.m3 && first.sim.left() >= 1,
  'NV2 đạt sau một vòng lặp, trước khi dọn sạch toàn sân');
assert.ok(!run(cycle(2), 8).state.m2, 'Chỉnh Wait 2 giây không còn đúng mẫu NV2');
assert.ok(!run(cycle(1, false), 8).state.m2, 'Thiếu rẽ trái không đạt NV2');
const noTurn = run(cycle(1, false), 10);
assert.ok(noTurn.sim.left() > 0 && !noTurn.state.m3,
  'Thiếu Rẽ trái phải còn tuyết: ' + noTurn.sim.left());
const lone = run([B.start, B.obs, B.fw, B.wait(1), B.stop], 3);
assert.ok(lone.sim.x > 0 && lone.sim.left() > 0, 'Không Lặp thì không dọn hết');
const turn = run([B.start, B.turn, B.wait(.2), B.stop], .5);
near(turn.sim.theta, .2, .01, 'Rẽ 0,2s ≈ 0,2 rad');
near(turn.sim.x, 0, .01, 'Rẽ tại chỗ không dịch X');
near(turn.sim.y, 0, .01, 'Rẽ tại chỗ không dịch Y');
assert.ok(turn.sim.wheelLeft < 0 && turn.sim.wheelRight > 0,
  'Trái lùi / phải tiến khi rẽ trái');
const straight = run([B.start, B.fw, B.wait(.5), B.stop], 1);
near(straight.sim.x, Plow.SPEED(8) * .5, .02, 'Tiến thẳng hai bánh');
near(straight.sim.wheelLeft, straight.sim.wheelRight, 1e-8, 'Hai bánh cùng quay khi tiến');
near(straight.sim.theta, 0, 1e-8, 'Không đổi hướng khi tiến thẳng');
const legacy = run([B.start, B.high, B.wait(.5), B.stop], 1);
near(legacy.sim.x, straight.sim.x, .01, 'Khối Quay nhanh cũ vẫn tiến');
const legacyPower = run([B.start, B.power(8), B.wait(.5), B.stop], 1);
near(legacyPower.sim.x, straight.sim.x, .01, 'Motor Power cũ vẫn tiến');
const pose = turn.sim.pose3d();
assert.ok(pose.wheelLeft > 0 && pose.wheelRight < 0 && Number.isFinite(pose.heading),
  'pose3d trả góc quay của cả hai bánh và heading');
assert.equal(JSON.stringify(new Plow().pose3d().offset), '[0,0,0]');
const blocked = new Plow();
blocked.setProgram(sample);
blocked.start();
blocked.piles.forEach(p => { p.x = -40; });
blocked.advance(.05);
assert.ok(blocked.waitingHand && blocked.x === 0, 'Không có vật phía trước thì chờ');
blocked.putHand();
blocked.advance(.05);
assert.ok(blocked.x > 0, 'Nút tay mở chờ cảm biến');
const behind = new Plow();
behind.setProgram(sample);
behind.start();
behind.piles.forEach(p => { p.x = -10; });
assert.equal(behind.seesObstacle(), false, 'Cảm biến không nhìn phía sau');
behind.piles[0].x = 20;
behind.piles[0].y = 50;
assert.equal(behind.seesObstacle(), false, 'Cảm biến không nhìn lệch khỏi hướng xe');
const slow = run([B.start, B.low, B.wait(1), B.stop], 2);
assert.ok(slow.events.includes('stuck') && !slow.state.m3, 'Mức thấp phải kẹt ở tuyết dày');
const blade = run([B.start, B.low, B.wait(1), B.stop], 2, { upgrades: ['blade'] });
assert.ok(!blade.events.includes('stuck') && blade.state.m4, 'Lưỡi gạt giúp mức 4');
assert.ok(run([B.start, B.power(2), B.wait(2), B.stop], 3,
  { upgrades: ['blade'] }).events.includes('stuck'), 'Lưỡi gạt mức 2 vẫn kẹt');
assert.ok(run(sample, 1, { upgrades: ['beacon'] }).state.m4, 'Gắn đèn rồi chạy đạt NV4');
assert.ok(!run([B.start, B.stop], 1, { upgrades: ['salt'] }).state.m4,
  'Không chạy bánh thì không đạt NV4');
const asm = new Plow();
let seen;
asm.onMissionUpdate = state => (seen = state);
asm.setAssemblyDone(true);
assert.ok(seen.m1 && !seen.allDone, 'Đánh dấu hoàn tất lắp ráp đạt NV1');
const idle = new Plow();
idle.setProgram(sample);
idle.advance(.5);
assert.equal(idle.running, false, 'Ghép chương trình không tự chạy');
const advanced = new Plow();
advanced.setAdvanced(true);
assert.equal(advanced.piles.length, 5);
assert.equal(advanced.trackEnd(), 235);
const proSample = run(sample, 10, { advanced: true });
assert.equal(proSample.state.m5, false, 'Mẫu không tự đạt thử thách Nâng cao');
const tuned = run(cycle(2), 12, { advanced: true });
assert.ok(tuned.state.m5 && tuned.state.m3 && tuned.sim.cycles <= 4,
  'Đổi Chờ đầu thành 2s đạt NV5: ' + JSON.stringify(tuned.state));
assert.equal(tuned.sim.left(), 0);
assert.ok(tuned.events.includes('deliver'));
assert.equal(run(cycle(2), 12).state.m5, false, 'Chế độ Bé không cấp NV5');
const unsafe = run(cycle(3), 15, { advanced: true });
assert.ok(unsafe.events.includes('crash') && !unsafe.state.m5,
  'Chạy quá xa phải báo va chạm và không đạt NV5');
console.log('PASS: Bài 13 – 22 hình sách, scene/3D, đúng mẫu 10 khối, 2 bánh, cảm biến, NV1–NV5.');
})().catch(err => { console.error(err); process.exit(1); });
