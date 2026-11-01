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

let readyScene, nextFrame = 0;
const cancelled = [], cleared = [], timers = [], callbacks = new Map();
const nodes = {
  'space-scene': { clientWidth: 600, getContext: () => ({}), addEventListener() {} },
  'scene-toast': { hidden: true, dataset: {} },
  'scene-toast-btn': { hidden: true },
  'scene-toast-title': {}, 'scene-toast-text': {}
};
const liveScene = {
  window: {}, document: { getElementById: id => nodes[id] || null },
  performance: { now: () => 1000 },
  requestAnimationFrame(fn) { callbacks.set(++nextFrame, fn); return nextFrame; },
  cancelAnimationFrame(id) { cancelled.push(id); callbacks.delete(id); },
  setTimeout(fn) { timers.push(fn); return timers.length; },
  clearTimeout(id) { cleared.push(id); },
  zmReady(fn) { readyScene = fn; }
};
vm.runInNewContext(fs.readFileSync(path.join(root, 'js/bai13/snow-scene.js'), 'utf8'), liveScene);
readyScene();
liveScene.window.ZMScene.enter();
assert.equal(nextFrame, 1, 'Vào chặng phải khởi động vẽ');
liveScene.window.ZMScene.onEvent('short', { left: 2 });
assert.equal(nodes['scene-toast'].hidden, false, 'Thông báo được hiển thị khi đang ở chặng');
liveScene.window.ZMScene.setMode('robot');
assert.ok(cancelled.includes(1), 'Xem mô hình 3D phải dừng vẽ 2D');
liveScene.window.ZMScene.setMode('story');
assert.equal(nextFrame, 2, 'Quay lại câu chuyện phải vẽ tiếp');
liveScene.window.ZMScene.leave();
assert.ok(cancelled.includes(2), 'Rời chặng phải cancelAnimationFrame');
assert.equal(nodes['scene-toast'].hidden, true, 'Rời chặng phải ẩn thông báo');
assert.ok(cleared.includes(1), 'Rời chặng phải xóa timer');
callbacks.get(2)?.(1200);
assert.equal(nextFrame, 2, 'Callback còn sót không được tạo vòng vẽ mới');
liveScene.window.ZMScene.onEvent('short', { left: 2 });
assert.equal(timers.length, 1, 'Rời chặng không được tạo timer mới');
const artContext = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(root, 'js/bai13/art.js'), 'utf8'), artContext);
for (const method of ['drawBackground', 'drawStation', 'drawPile', 'drawWall', 'drawPlow', 'drawHand']) {
  assert.equal(typeof artContext.window.SnowArt[method], 'function', 'Hình vẽ thiếu ' + method);
}

vm.runInNewContext(fs.readFileSync(path.join(root, 'js/bai13/plow-engine.js'), 'utf8'), context);
const Plow = context.window.PlowEngine;
assert.ok(Math.abs(Plow.SPEED(8) - 39.27) < 0.01, 'Mức 8 ≈ 39,3 cm/giây');
assert.ok(Math.abs(Plow.SPEED(4) - 19.63) < 0.01, 'Mức 4 ≈ 19,6 cm/giây');

const B = {
  start: { type: 'start' },
  rs: { type: 'repeatStart' },
  re: { type: 'repeatEnd' },
  obs: { type: 'sensor_obstacle' },
  high: { type: 'motor', speed: 'high' },
  low: { type: 'motor', speed: 'low' },
  p: n => ({ type: 'motor_power', power: n }),
  wait: s => ({ type: 'wait', duration: s }),
  stop: { type: 'stop' }
};
function run(program, seconds, { upgrades = [], advanced = false, hands = [] } = {}) {
  const sim = new Plow();
  const states = [], events = [];
  sim.onMissionUpdate = s => states.push(s);
  sim.onEvent = t => events.push(t);
  if (advanced) sim.setAdvanced(true);
  sim.setUpgrades(upgrades);
  sim.setProgram(program);
  sim.start();
  for (let t = 0; t < seconds; t += 0.02) {
    if (hands.some(h => Math.abs(h - t) < 0.01)) sim.putHand();
    sim.advance(0.02);
  }
  sim.checkMissions();
  return { sim, state: states.at(-1), events };
}
const near = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg}: ${a} ≠ ${b}`);
const cycle = (power, w) => [B.start, B.rs, B.obs, power, B.wait(w), B.stop, B.re];
const sample = cycle(B.high, 1);

// Chương trình mẫu: thấy tuyết → chạy nhanh 1 giây → dừng, lặp lại. 3 chu kỳ: 39,3 · 78,5 · 115 cm (đến đống cuối là xong)
const s = run(sample, 10);
near(s.sim.x, 115, 0.6, 'Dừng ngay khi đẩy tới đống cuối (115 cm)');
assert.equal(s.sim.left(), 0);
assert.equal(s.sim.cycles, 3);
assert.ok(s.state.m2 && s.state.m3 && !s.state.m5, 'Mẫu đạt NV2 và NV3: ' + JSON.stringify(s.state));
assert.ok(s.events.includes('deliver') && !s.events.includes('crash'));
assert.equal(s.state.lastRun.cycles, 3);
const firstCycle = run(sample, 1.2);
assert.ok(firstCycle.state.m2 && !firstCycle.state.m3 && firstCycle.sim.left() === 2,
  'NV2 phải đạt ngay sau một chu kỳ đúng mẫu, trước khi dọn sạch đường');
// Sai mẫu thì không đạt NV2
assert.ok(!run(cycle(B.low, 1), 15, { upgrades: [] }).state.m2, 'Quay chậm không phải mẫu');
assert.ok(!run(cycle(B.low, 1), 15, { upgrades: ['blade'] }).state.m2,
  'Lưỡi gạt giúp mức chậm dọn sạch nhưng không được tính đúng chương trình mẫu');
assert.ok(!run(cycle(B.p(5), 1), 15, { upgrades: ['blade'] }).state.m2,
  'Motor Power 5 với lưỡi gạt vẫn sai chữ ký High Speed');
assert.ok(!run(cycle(B.high, 2), 10).state.m2, 'Wait 2 giây không phải mẫu');
assert.ok(!run([B.start, B.obs, B.high, B.wait(1), B.stop], 10).state.m2, 'Thiếu khối Lặp không phải mẫu');
assert.ok(run(cycle(B.p(8), 1), 10).state.m3, 'Motor Power 8 vẫn dọn sạch tuyết (chỉ NV2 mới đòi High Speed)');
assert.ok(run(cycle(B.p(8), 1), 10).state.m2, 'Motor Power cũng tính là khối chạy (giống Bài 3)');

// Không lặp: chỉ một lần chạy thì còn tuyết
const once = run([B.start, B.obs, B.high, B.wait(1), B.stop], 5);
assert.equal(once.sim.left(), 2);
assert.ok(once.events.includes('short') && !once.state.m3, 'Chạy một lần còn tuyết: ' + once.events);
// Wait 3 giây mỗi lần: 118 cm đẩy sạch cả 3 đống ngay lần đầu
const w3 = run(cycle(B.high, 3), 6);
assert.ok(w3.state.m3 && w3.sim.cycles === 1, 'Wait 3 giây dọn sạch trong một lần');
// Chạy quá xa: đâm tường 150 cm
const crash = run([B.start, B.high, B.wait(6), B.stop], 8);
assert.ok(crash.events.includes('crash') && crash.sim.x === 150 && !crash.state.m3, 'Đụng tường cuối đường');
// Cảm biến không thấy gì thì chờ mãi, đưa tay thì chạy
const lone = run([B.start, B.rs, B.obs, B.high, B.wait(1), B.stop, B.re], 2, { hands: [] });
assert.ok(lone.sim.x > 0, 'Đống tuyết đầu trong tầm 40 cm nên cảm biến tự thấy');
const far = new Plow();
far.setProgram(sample);
far.start();
far.piles[0].x = 100; // thay đổi sa bàn sau khi start() thiết lập lại trạng thái
for (let t = 0; t < 2; t += 0.02) far.advance(0.02);
assert.ok(far.waitingHand && far.x === 0, 'Đống tuyết xa thì xe đứng chờ vật cản');
far.putHand();
for (let t = 0; t < 1.2; t += 0.02) far.advance(0.02);
assert.ok(far.x > 30 && !far.waitingHand, 'Đưa tay thì xe chạy');

// Tuyết dày: mức thấp bị kẹt, lưỡi gạt giúp đẩy từ mức 3
const slow = run(cycle(B.low, 1), 15);
assert.ok(slow.events.includes('stuck') && !slow.state.m3, 'Mức 4 kẹt ở đống đầu: ' + slow.events);
near(slow.sim.x, 31, 0.1, 'Kẹt ngay trước đống tuyết (35 − 4 cm)');
const blade = run(cycle(B.low, 1), 15, { upgrades: ['blade'] });
assert.ok(blade.state.m3 && !blade.events.includes('stuck') && blade.state.m4, 'Lưỡi gạt đẩy được ở mức 4');
assert.ok(run(cycle(B.p(3), 1), 25, { upgrades: ['blade'] }).state.m3, 'Lưỡi gạt đẩy được ở mức 3');
assert.ok(run(cycle(B.p(2), 1), 25, { upgrades: ['blade'] }).events.includes('stuck'), 'Mức 2 vẫn kẹt');
assert.ok(run(cycle(B.p(5), 1), 25).state.m3, 'Không lưỡi gạt thì mức 5 đẩy được');
assert.ok(run(cycle(B.p(4), 1), 25).events.includes('stuck'), 'Không lưỡi gạt thì mức 4 kẹt');
// NV4: có gói và động cơ chạy; đèn chỉ trang trí vẫn tính
assert.ok(run(sample, 1, { upgrades: ['beacon'] }).state.m4, 'Gói đèn và động cơ chạy đạt NV4');
assert.ok(!run([B.start, B.stop], 1, { upgrades: ['salt'] }).state.m4, 'Chưa bật động cơ thì chưa đạt NV4');
assert.ok(!s.state.m4, 'Không gắn gói thì chưa đạt NV4');
assert.equal(run(sample, 10, { upgrades: ['salt'] }).sim.x.toFixed(1), s.sim.x.toFixed(1), 'Thùng muối không đổi tốc độ');

// NV1: lắp xong
const asm = new Plow();
let seen;
asm.onMissionUpdate = st => (seen = st);
asm.setAssemblyDone(true);
assert.ok(seen.m1 && !seen.allDone);

// Sửa chương trình thì không tự chạy
const idle = new Plow();
idle.setProgram(sample);
idle.advance(0.5);
assert.equal(idle.running, false, 'Sửa chương trình không tự chạy');
assert.equal(JSON.stringify(idle.pose3d().offset), '[0,0,0]');
const moved = run(sample, 0.8).sim.pose3d();
assert.ok(moved.offset[0] > 0 && moved.output < 0, 'Xe tiến theo +X, bánh quay');

// Nâng cao: bão tuyết, đường 230 cm, 5 đống, tối đa 4 lần chạy
const adv = { advanced: true };
const sw = new Plow();
assert.equal(sw.trackEnd(), 150);
sw.setAdvanced(true);
assert.equal(sw.trackEnd(), 230);
assert.equal(sw.piles.length, 5);
const slowAdv = run(sample, 20, adv);
assert.equal(slowAdv.sim.cycles, 5, 'Mẫu cần 5 lần chạy trên đường Nâng cao');
assert.ok(slowAdv.state.m3 && !slowAdv.state.m5, 'Đạt NV3 nhưng quá 4 lần chạy thì chưa đạt NV5');
const tuned = run(cycle(B.high, 1.3), 20, adv);
assert.equal(tuned.sim.cycles, 4);
assert.ok(tuned.state.m5 && tuned.state.m3 && tuned.events.includes('deliver'), 'Wait 1,3 giây dọn sạch trong 4 lần: ' + tuned.events);
assert.ok(!run(cycle(B.high, 1.3), 20).state.m5, 'Đường Bé không tính NV5');
const over = run(cycle(B.high, 3), 40, { ...adv, hands: [3.5] });
assert.ok(over.events.includes('crash') && !over.state.m5, 'Wait 3 giây: lần 2 đụng tường 230 cm');

console.log('PASS: Lớp 1 Bài 13 – 22 ảnh sách, giao diện, cảnh/art, mô hình 3D và mô phỏng NV1–NV5.');

})().catch(err => { console.error(err); process.exit(1); });
