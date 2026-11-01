// Chạy: node tests/lop3-bai10.test.js – bộ mô phỏng + cấu hình Lớp 3 Bài 10 (robot thám hiểm sao Hỏa), chỉ dùng Node.js built-in.
// Dữ liệu 3D (content/lop3/bai10/build.json do công cụ khác tạo) chỉ kiểm khi đã có.
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
  Math
};
context.window.window = context.window;

// Cấu hình bài
vm.runInNewContext(fs.readFileSync(path.join(root, 'js/lop3-bai10/lesson.js'), 'utf8'), context);
const L = context.window.LESSON;
assert.equal(L.id, 'lop3-bai10');
assert.equal(L.Engine, 'RoverEngine');
for (const id of [...L.missions.core, ...L.missions.pro]) assert.ok(L.cards[id], 'Thiếu thẻ nhiệm vụ ' + id);
for (const id of [...L.cardOrder.kid, ...L.cardOrder.pro]) assert.ok(L.cards[id], 'cardOrder trỏ thẻ không có: ' + id);
assert.deepEqual(Array.from(L.missions.core), ['m1', 'm2', 'm3', 'm4']);
assert.deepEqual(Array.from(L.missions.pro), ['m5']);
assert.ok(L.blocks.toolbox.includes('obstacle') && L.blocks.toolbox.includes('motorStop'), 'Có khối cảm biến + dừng');
assert.ok(L.blocks.sample.includes('obstacle'));
// Trang bài học phải lấp đủ vị trí của khuôn Bài 08.
const slots = file => Array.from(fs.readFileSync(path.join(root, file), 'utf8').matchAll(/<template\s+data-slot="([^"]+)"/g), m => m[1]).sort();
const pageSlots = slots('content/lop3/bai10/page.html');
assert.deepEqual(pageSlots, slots('content/lop3/bai08/page.html'), 'Thiếu hoặc thừa data-slot so với Bài 08');
assert.equal(pageSlots.length, new Set(pageSlots).size, 'Trùng data-slot trong trang Bài 10');
for (let p = 1; p <= 15; p++) {
  const info = L.book({ page: p, step: p, total: 15 });
  assert.ok(fs.existsSync(path.join(root, info.src)), `Thiếu ảnh sách hướng dẫn trang ${p}`);
  assert.equal(info.pdf, info.src, `Liên kết ảnh sách sai ở trang ${p}`);
}
const names = new Set(Object.keys(L.creative.features));
for (const s of L.creative.slots) for (const o of s.options) {
  assert.ok(names.has(o.feature), 'Tính năng không có mô tả: ' + o.feature);
  for (const [code, n] of Object.entries(o.parts)) assert.ok(n <= L.creative.kit[code], 'Không đủ linh kiện ' + code);
}
for (const p of L.creative.presets) for (const [slot, opt] of Object.entries(p.pick))
  assert.ok(L.creative.slots.find(s => s.id === slot).options.some(o => o.id === opt), 'Gói gợi ý trỏ sai: ' + p.id);

// Dữ liệu 3D (nếu đã có)
const buildFile = path.join(root, 'content/lop3/bai10/build.json');
if (fs.existsSync(buildFile)) {
  await require('./helpers/lesson-3d')(context, 'lop3/bai10');
  const model = context.window.LESSON_3D_DATA;
  assert.equal(model.steps, 15, 'Sách hướng dẫn có 15 bước');
  assert.ok(model.instances.every(p => model.labels.names[p.name]), 'Mọi mã đều có tên tiếng Việt');
  for (const [key, count] of Object.entries({ dish: 2, lamp: 1, wheels: 1 })) {
    assert.equal(model.creative?.[key]?.length, count, `Chưa đăng ký mesh nâng cấp ${key}`);
    for (const i of model.creative[key]) assert.ok(model.meshes[i], `Mesh ${key} không tồn tại: ${i}`);
  }
  const add = (a, b) => a.map((x, i) => x + b[i]);
  const sub = (a, b) => a.map((x, i) => x - b[i]);
  const scale = (a, n) => a.map(x => x * n);
  const box = () => ({ center: [0, 0, 0], lo: [-0.1, -0.1, -0.1], hi: [0.1, 0.1, 0.1] });
  const added = L.creative.placements(model, {
    add, sub, scale, norm: a => scale(a, 1 / (Math.hypot(...a) || 1)), box,
    make: (_, pos, rotation, meshes, name) => ({ pos, rotation, meshes, name })
  });
  for (const [key, count] of Object.entries({ 'top:dish': 2, 'front:lamp': 2, 'wheel:wheels': 8 })) {
    assert.equal(added[key].length, count, `Gói ${key} phải có ${count} chi tiết CAD`);
    for (const part of added[key]) {
      assert.ok(part.meshes.every(i => model.meshes[i]), `Gói ${key} dùng mesh không hợp lệ`);
      assert.ok(part.pos.every(Number.isFinite), `Vị trí của ${key} không hợp lệ`);
    }
  }
}

vm.runInNewContext(fs.readFileSync(path.join(root, 'js/lesson-engine.js'), 'utf8'), context);
vm.runInNewContext(fs.readFileSync(path.join(root, 'js/lop3-bai10/rover-engine.js'), 'utf8'), context);
const Rover = context.window.RoverEngine;
const B = {
  start: { type: 'start' }, rs: { type: 'repeatStart' }, re: { type: 'repeatEnd' }, stop: { type: 'stop' }, obs: { type: 'sensor_obstacle' },
  wait: s => ({ type: 'wait', duration: s }),
  m: (speed, dir = 'cw') => ({ type: 'motor', speed, dir })
};
const sample = [B.start, B.rs, B.m('low'), B.obs, B.stop, B.wait(3), B.re];
function run(program, seconds, { upgrades = [], advanced = false } = {}) {
  const sim = new Rover();
  const states = [], events = [];
  sim.onMissionUpdate = s => states.push(s);
  sim.onEvent = t => events.push(t);
  if (advanced) sim.setAdvanced(true);
  sim.setUpgrades(upgrades);
  sim.setProgram(program);
  sim.start();
  for (let t = 0; t < seconds; t += 0.05) sim.advance(0.05);
  sim.checkMissions();
  return { sim, state: states.at(-1), events };
}

// NV2: chương trình mẫu – chạy hết một vòng lặp, thu được mẫu đầu tiên
const one = run(sample, 7);
assert.ok(one.state.m2 && one.events.includes('sampleDone'), 'NV2: chạy hết một vòng lặp của chương trình mẫu');
assert.equal(one.sim.got(), 1);
const firstRockDistance = one.sim.rocks[0].x - one.sim.x;
assert.ok(firstRockDistance > 3 && firstRockDistance <= 15, 'Xe dừng cách đá đầu tiên 3–15 cm: ' + firstRockDistance);
assert.ok(!run([B.start, B.rs, B.m('medium'), B.obs, B.stop, B.wait(3), B.re], 7).state.m2, 'Khác mẫu (tốc độ) không đạt NV2');
assert.ok(!run([B.start, B.rs, B.m('low'), B.wait(3), B.re], 7).state.m2, 'Thiếu khối cảm biến không đạt NV2');

// NV3: thu đủ 3 mẫu
const full = run(sample, 30);
assert.equal(full.sim.got(), 3, 'Thu đủ 3 mẫu');
assert.ok(full.state.m3 && full.events.includes('allSaved') && !full.sim.crashed);
assert.ok(full.state.best && full.state.best.secs > 20 && full.state.best.secs < 30);
// Chạy nhanh phanh xa hơn nhưng vẫn dừng được trước đá
const fast = run([B.start, B.rs, B.m('high'), B.obs, B.stop, B.wait(3), B.re], 30);
assert.ok(!fast.sim.crashed && fast.sim.got() === 3, 'Chạy nhanh vẫn dừng kịp nhờ cảm biến');
assert.ok(fast.state.best.secs < full.state.best.secs, 'Chạy nhanh thu đủ mẫu sớm hơn');
// Không dùng cảm biến thì đâm vào đá
const hit = run([B.start, B.m('low'), B.wait(5), B.wait(5), B.wait(5)], 15);
assert.ok(hit.sim.crashed && hit.sim.crashWhy === 'hit' && hit.events.includes('crash'), 'Không dừng thì đâm đá');
assert.equal(hit.sim.got(), 0);
// Có cảm biến nhưng không dừng xe cũng đâm
assert.ok(run([B.start, B.m('low'), B.obs, B.wait(5), B.wait(5)], 12).sim.crashed, 'Thấy đá mà không dừng thì đâm');
// Dừng rồi nhưng không đứng đủ lâu thì chưa thu được mẫu (chương trình kết thúc sớm)
assert.equal(run([B.start, B.m('low'), B.obs, B.stop, B.wait(1)], 12).sim.got(), 0, 'Đứng chưa đủ 2 giây thì chưa thu mẫu');
// Lùi lại: về căn cứ, không vượt quá vạch xuất phát
const back = run([B.start, B.m('low'), B.wait(2), B.m('low', 'ccw'), B.wait(5)], 8);
assert.equal(back.sim.x, 0, 'Lùi về tới căn cứ thì dừng');
// Ăng-ten: tầm cảm biến gấp đôi
assert.equal(new Rover().reach() * 2, (() => { const s = new Rover(); s.setUpgrades(['dish']); return s.reach(); })());
const dish = run(sample, 7, { upgrades: ['dish'] });
assert.ok(dish.sim.distance() > 15, 'Có ăng-ten: dừng xa hơn khi thấy đá');
// NV4: có gói nâng cấp và chạy động cơ
assert.ok(run(sample, 1, { upgrades: ['lamp'] }).state.m4);
assert.ok(!run(sample, 1).state.m4);

// Nâng cao: bão bụi 10–18 giây – cảm biến mù, chạy trong bão thì lún kẹt
const sim0 = new Rover();
sim0.setAdvanced(true);
sim0.runT = 12;
assert.ok(sim0.blind(), 'Trong bão cảm biến mù');
sim0.setUpgrades(['lamp']);
assert.ok(!sim0.blind(), 'Đèn pha giúp thấy trong bão');
const stuck = run(sample, 14, { advanced: true });
assert.ok(stuck.sim.crashed && stuck.sim.crashWhy === 'stuck' && stuck.events.includes('crash'), 'Chạy trong bão thì kẹt');
assert.ok(run(sample, 12.4, { advanced: true }).sim.crashed);
assert.ok(!run(sample, 12.4, { advanced: true, upgrades: ['wheels'] }).sim.crashed, 'Bánh gai chịu lún lâu hơn');
// Quét đá phải dừng khi cảm biến mù, khôi phục khi trời quang hoặc có đèn pha.
function scanAtStorm(upgrades = []) {
  const s = new Rover();
  s.setAdvanced(true);
  s.setUpgrades(upgrades);
  s.running = true;
  s.x = 40; // cách tảng đá đầu tiên 10 cm, xe đứng yên
  s.runT = 12;
  for (let i = 0; i < 45; i++) s.tick(0.05);
  return s;
}
const blindScan = scanAtStorm();
assert.equal(blindScan.rocks[0].scanT, 0, 'Bão bụi phải chặn tiến độ quét đá');
assert.equal(blindScan.got(), 0, 'Cảm biến mù không được thu mẫu đá');
blindScan.runT = 18;
for (let i = 0; i < 45; i++) blindScan.tick(0.05);
assert.equal(blindScan.got(), 1, 'Trời quang phải tiếp tục quét được đá');
assert.equal(scanAtStorm(['lamp']).got(), 1, 'Đèn pha phải cho phép quét trong bão');
// Chờ bão tan rồi mới chạy: không kẹt, thu đủ mẫu, NV5
const waitStorm = [B.start, B.wait(5), B.wait(5), B.wait(5), B.wait(3), B.rs, B.m('low'), B.obs, B.stop, B.wait(3), B.re];
const st = run(waitStorm, 48, { advanced: true });
assert.ok(!st.sim.crashed, 'Đứng yên trong bão: không kẹt');
assert.equal(st.sim.got(), 3);
assert.ok(st.state.m5 && st.state.m3, 'NV5: thu đủ mẫu sau khi qua bão bụi');
// Thẻ NV3 phải nói rõ điều kiện bão ở Nâng cao và gợi ý khối chờ; NV3 đạt được ở cả hai chế độ
assert.ok(/bão/.test(L.cards.m3.text) && /Wait/.test(L.cards.m3.text), 'Thẻ NV3 nêu bão bụi và khối Wait');
assert.ok(run(sample, 30).state.m3 && st.state.m3, 'NV3 đạt ở cả Bé và Nâng cao');
// Chế độ Bé không có bão: thu đủ mẫu không tính NV5
assert.ok(!run(sample, 30).state.m5);

// Scene dùng kit chung: toast có đầy đủ thành phần DOM và rAF/timer dừng sau leave().
{
  const frames = new Map(), timers = new Map(), events = {};
  let nextId = 0, observed = 0;
  const box = { dataset: {}, hidden: true };
  const canvas = { clientWidth: 900, getContext: () => ({}), addEventListener() {} };
  const elements = { 'space-scene': canvas, 'scene-toast': box,
    'scene-toast-title': { textContent: '' }, 'scene-toast-text': { textContent: '' },
    'scene-toast-btn': { hidden: true } };
  const sceneContext = {
    window: { addEventListener() {}, removeEventListener() {} },
    document: { getElementById: id => elements[id] || null, addEventListener() {}, activeElement: { tagName: 'BODY' } },
    performance: { now: () => 0 },
    zmReady: fn => fn(),
    requestAnimationFrame: fn => { const id = ++nextId; frames.set(id, fn); return id; },
    cancelAnimationFrame: id => frames.delete(id),
    setTimeout: fn => { const id = ++nextId; timers.set(id, fn); return id; },
    clearTimeout: id => timers.delete(id),
    ResizeObserver: class { observe() { observed++; } disconnect() {} },
    Math
  };
  sceneContext.window.window = sceneContext.window;
  vm.runInNewContext(fs.readFileSync(path.join(root, 'js/scene-kit.js'), 'utf8'), sceneContext);
  vm.runInNewContext(fs.readFileSync(path.join(root, 'js/lop3-bai10/rover-scene.js'), 'utf8'), sceneContext);
  const scene = sceneContext.window.ZMScene;
  scene.enter();
  assert.equal(frames.size, 1, 'Vào sa bàn phải bắt đầu vòng vẽ');
  const scheduled = [...frames.values()][0];
  frames.clear(); scheduled(100); // vòng tiếp theo phải được đăng ký khi đang active
  assert.equal(frames.size, 1);
  assert.doesNotThrow(() => scene.onEvent('sample', { rock: { x: 50, name: 'đá đỏ' }, count: 1 }),
    'Cảnh chung phải hiển thị thông báo thu mẫu');
  assert.equal(box.hidden, false);
  assert.equal(timers.size, 1);
  scene.leave();
  assert.equal(frames.size, 0, 'Rời sa bàn phải hủy requestAnimationFrame');
  assert.equal(timers.size, 0, 'Rời sa bàn phải dọn timeout thông báo');
  assert.equal(observed, 1, 'Khung chung quản lý ResizeObserver của canvas');
  scene.onEvent('start');
  assert.equal(box.hidden, true, 'Chạy lại phải ẩn thông báo cũ');
  scene.enter();
  assert.equal(frames.size, 1, 'Trở lại sa bàn phải khởi chạy lại khung hình');
  scene.leave();
}

console.log('PASS: Lớp 3 Bài 10 – cấu hình bài, xe thám hiểm + cảm biến sóng âm: mẫu M1 chờ vật cản → dừng, thu 3 mẫu đá, đâm đá khi không dừng, ăng-ten, bão bụi + đèn pha + bánh gai, NV2–NV5.');
})().catch(e => { console.error(e); process.exit(1); });
