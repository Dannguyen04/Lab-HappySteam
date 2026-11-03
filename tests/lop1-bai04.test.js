// Kiểm tra dữ liệu lắp ráp và chu kỳ nhấn-giữ-thả của máy khoan.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const at = p => path.join(root, p);
const load = (p, ctx) => vm.runInNewContext(fs.readFileSync(at(p), 'utf8'), ctx, { filename: p });
const ctx = { window: {}, document: { getElementById: () => null }, Math };
load('js/blocks-engine.js', ctx);
load('js/lop1-bai04/lesson.js', ctx);
load('js/lesson-engine.js', ctx);
load('js/lop1-bai04/drill-engine.js', ctx);

const lesson = ctx.window.LESSON;
const build = JSON.parse(fs.readFileSync(at('content/lop1/bai04/build.json'), 'utf8'));
assert.equal(lesson.id, 'lop1-bai04');
assert.equal(build.steps, 23);
assert.equal(build.instances.length, 74);
assert.ok(build.instances.some(p => p.name === 'BE-2257'));
assert.ok(build.instances.some(p => p.name === 'BE-5158'));
assert.ok(build.instances.some(p => p.originalPart === 'be-3578.dat'));
assert.deepEqual(Array.from(lesson.sampleSig), [
  'start', 'repeatStart', 'sensor_touch', 'motor:high',
  'sensor_release', 'stop', 'repeatEnd'
]);
for (let step = 1; step <= 23; step++) {
  const img = fs.readFileSync(at(`assets/lop1-bai04/step-${String(step).padStart(2, '0')}.jpg`));
  assert.ok(img.length > 1000 && img[0] === 0xff && img[1] === 0xd8, `Ảnh trang ${step}`);
}
assert.ok(fs.statSync(at('assets/covers/lop1-bai04.jpg')).size > 1000);
assert.match(fs.readFileSync(at('js/catalog.js'), 'utf8'), /bai\.html\?id=lop1-bai04/);
assert.match(fs.readFileSync(at('content/lop1/bai04/page.html'), 'utf8'), /id="scene-press"/);
assert.ok(fs.existsSync(at('js/lop1-bai04/art.js')));
assert.equal(lesson.creative.slots.length, 4);
assert.equal(lesson.creative.presets.length, 4);
const H = {
  by: name => build.instances.filter(p => p.name === name),
  make: (p, pos, rotation) => ({ ...p, pos, rotation })
};
const pieces = lesson.creative.placements(build, H);
assert.equal(Object.keys(pieces).length, 4);
assert.ok(Object.values(pieces).every(list => list.length > 0));

const sample = lesson.blocks.sample;
const program = speed => sample.map(key => ({
  start: { type: 'start' }, repeatStart: { type: 'repeatStart' },
  touch: { type: 'sensor_touch' },
  highSpeed: { type: 'motor', speed },
  release: { type: 'sensor_release' },
  motorStop: { type: 'stop' }, repeatEnd: { type: 'repeatEnd' }
})[key]);

function setup({ speed = 'high', material = 'tile', advanced = false, upgrades = [] } = {}, existing) {
  const engine = existing || new ctx.window.DrillEngine();
  const states = [], events = [];
  engine.onMissionUpdate = state => states.push({ ...state });
  engine.onEvent = (type, data) => events.push({ type, data });
  if (advanced) engine.setAdvanced(true);
  engine.setMaterial(material);
  engine.setUpgrades(upgrades);
  engine.setProgram(program(speed));
  engine.start();
  engine.advance(0.02);
  assert.ok(engine.waitingPress, 'Phải đợi nhấn cảm biến trước khi bật động cơ');
  assert.equal(engine.motorOn, false);
  return { engine, states, events };
}

function run(opts = {}, seconds = 2, existing) {
  const trial = setup(opts, existing);
  const { engine } = trial;
  engine.press();
  engine.advance(0.02);
  assert.equal(engine.motorOn, true, 'Nhấn giữ phải bật động cơ');
  for (let i = 0; i < Math.round(seconds / 0.02); i++) engine.advance(0.02);
  assert.ok(engine.running && engine.held && engine.motorOn, 'Động cơ phải chạy khi giữ');
  engine.release();
  engine.advance(0.02);
  assert.equal(engine.motorOn, false, 'Thả cò phải dừng động cơ');
  assert.equal(engine.running, false, 'Hoàn thành một chu kỳ nhấn-thả');
  assert.ok(trial.states.length, 'Có trạng thái nhiệm vụ');
  return { ...trial, state: trial.states.at(-1) };
}

const idle = setup();
idle.engine.advance(1);
assert.equal(idle.engine.motorOn, false, 'Chưa nhấn thì không quay');
assert.ok(idle.engine.waitingPress);
idle.engine.release();
idle.engine.advance(0.1);
assert.equal(idle.engine.motorOn, false, 'Thả khi chưa nhấn không qua điều kiện');

const book = run({ speed: 'high' }, 0.5);
assert.ok(book.state.m2, 'Mẫu đúng 7 khối phải đạt M2');
assert.equal(book.state.m3, false, 'Mẫu nhanh không đạt M3 trên gạch');
assert.ok(book.engine.cracked, 'Quay nhanh làm nứt gạch');
assert.ok(book.events.some(e => e.type === 'drillFail'));

const tile = run({ speed: 'low' }, 2);
assert.ok(tile.state.m3, 'Quay chậm và nhấn đủ thời gian đạt M3');
assert.equal(tile.state.m2, false, 'Bài sửa chương trình không được tính M2 mẫu');
assert.ok(tile.engine.depth >= 8 && tile.engine.depth <= 11);
assert.equal(tile.engine.lastOutcome, 'pass');
assert.ok(tile.events.some(e => e.type === 'drillPass'));

for (const seconds of [0.5, 3.2]) {
  const failure = run({ speed: 'low' }, seconds);
  assert.equal(failure.state.m3, false, `Giữ ${seconds}s sai độ sâu phải trượt M3`);
  assert.equal(failure.engine.lastOutcome, 'fail');
}
for (const speed of ['medium', 'high']) {
  const failure = run({ speed }, 2);
  assert.equal(failure.state.m3, false, `Tốc độ ${speed} phải trượt M3`);
  assert.equal(failure.engine.cracked, true);
}

const creative = run({ speed: 'low', upgrades: ['sideHandle'] }, 2);
assert.ok(creative.state.m4, 'Gắn gói và chạy động cơ đạt M4');
const proTile = run({ speed: 'low', material: 'tile', advanced: true }, 2);
assert.equal(proTile.state.m5, false, 'Một chất liệu chưa đủ đạt M5');
const wrongWood = run({ speed: 'low', material: 'wood', advanced: true }, 2, proTile.engine);
assert.equal(wrongWood.state.m5, false, 'Gỗ sai tốc độ phải trượt M5');
assert.equal(proTile.engine.passedMaterials.size, 1, 'Lượt sai không được tính thêm chất liệu');
const wood = run({ speed: 'medium', material: 'wood', advanced: true }, 2, proTile.engine);
assert.equal(wood.state.m5, false, 'Hai chất liệu vẫn chưa đủ M5');
const shortPlaster = run({ speed: 'high', material: 'plaster', advanced: true }, 0.5, proTile.engine);
assert.equal(shortPlaster.state.m5, false, 'Thạch cao quá nông phải trượt M5');
assert.equal(proTile.engine.passedMaterials.size, 2, 'Lỗ nông không được tính thành công');
const plaster = run({ speed: 'high', material: 'plaster', advanced: true }, 2, proTile.engine);
assert.ok(plaster.state.m5, 'Nâng cao: cả ba chất liệu đúng tốc độ và độ sâu đạt M5');
assert.equal(proTile.engine.passedMaterials.size, 3);
assert.equal(run({ speed: 'medium', material: 'wood', advanced: true }, 2).state.m5, false,
  'Từng chất liệu riêng lẻ không được tự đạt M5');

console.log('PASS: Lớp 1 Bài 4 – 23 bước/74 chi tiết, 23 ảnh, 4 gói; M2 mẫu, M3 đúng/sai, M4 nâng cấp, M5 đủ 3 vật liệu và ca trượt.');
