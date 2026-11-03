// Chạy: node tests/lop3-bai04.test.js – kiểm tra Bài 4 lớp 3 bằng Node.js built-in.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const window = { addEventListener() {} };
const context = {
  window,
  document: { getElementById() { return null; }, documentElement: { dataset: { mode: 'pro' } } },
  performance: { now: () => 0 },
  Math
};

for (const file of [
  'js/blocks-engine.js',
  'js/lesson-engine.js',
  'js/lop3-bai04/lesson.js',
  'js/lop3-bai04/sorter-engine.js'
]) vm.runInNewContext(fs.readFileSync(path.join(root, file), 'utf8'), context, { filename: file });

const lesson = window.LESSON;
const templates = window.BLOCK_TEMPLATES;
const SorterEngine = window.SorterEngine;
const build = JSON.parse(fs.readFileSync(path.join(root, 'content/lop3/bai04/build.json'), 'utf8'));
const read = file => fs.readFileSync(path.join(root, file));
const exists = file => fs.existsSync(path.join(root, file));

assert.equal(lesson.id, 'lop3-bai04');
assert.equal(lesson.defaultMode, 'pro', 'Lớp 3 mở chế độ Nâng cao mặc định');
assert.deepEqual(Array.from(lesson.blocks.waits), [0.5]);
assert.equal(lesson.blocks.sample.length, 13, 'Mẫu KHGD có đúng 13 khối');
assert.deepEqual(Array.from(lesson.blocks.sample, item => Array.isArray(item) ? item[0] : item), [
  'start', 'repeatStart', 'sensorColorRed', 'noteDo', 'm1Motor', 'wait', 'motorStop',
  'sensorColorBlue', 'noteMi', 'm1Motor', 'wait', 'motorStop', 'repeatEnd'
]);

const sampleProgram = () => lesson.blocks.sample.map(item => {
  const id = Array.isArray(item) ? item[0] : item;
  return { ...templates[id], ...(Array.isArray(item) ? item[1] : {}) };
});
const signatures = sampleProgram().map(SorterEngine.sig);
assert.deepEqual(Array.from(signatures), Array.from(SorterEngine.SAMPLE), '13 chữ ký mẫu khớp tuyệt đối');
assert.deepEqual(Array.from(SorterEngine.SAMPLE), [
  'start', 'repeatStart', 'sensor_color_red', 'melody:Do', 'motor:M1:low:ccw', 'wait:1', 'stop',
  'sensor_color_blue', 'melody:Mi', 'motor:M1:low:cw', 'wait:1', 'stop', 'repeatEnd'
]);

function makeProgram({ red = 1, blue = 1, redDir = 'ccw', blueDir = 'cw', wrongFirstSensor = false } = {}) {
  let waitIndex = 0;
  let motorIndex = 0;
  const program = sampleProgram();
  for (const block of program) {
    if (block.type === 'wait') block.duration = waitIndex++ === 0 ? red : blue;
    if (block.type === 'motor') block.dir = motorIndex++ === 0 ? redDir : blueDir;
  }
  if (wrongFirstSensor) program.find(b => b.type === 'sensor_color_red').type = 'sensor_color_blue';
  return program;
}

function runCase(options = {}) {
  const sim = new SorterEngine();
  sim.setAdvanced(!!options.advanced);
  sim.setUpgrades(options.upgrades || []);
  sim.setProgram(makeProgram(options));
  sim.start();
  let frames = 0;
  while (sim.running && frames++ < 2500) sim.advance(0.02);
  sim.checkMissions();
  assert.ok(frames < 2500, 'Mô phỏng phải kết thúc trong giới hạn thời gian');
  return {
    done: { ...sim.done },
    failed: sim.failed,
    reason: sim.reason,
    got: sim.got(),
    missed: sim.missed(),
    bags: sim.bags.map(b => ({ state: b.state, color: b.color, angle: b.angle })),
    armAngle: sim.armAngle,
    matchesSample: sim.matchesSample(),
    sim
  };
}

// Mẫu nguyên bản đạt M2 dù thời gian xanh 1 giây làm túi trượt.
const sample = runCase({ advanced: true });
assert.equal(sample.matchesSample, true);
assert.equal(sample.done.m2, true, 'Chạy trọn mẫu 13 khối đạt M2');
assert.equal(sample.done.m3, false, 'Mẫu nguyên bản chưa đạt phân loại chính xác');
assert.equal(sample.done.m5, false, 'Mẫu 1 giây không đạt Nâng cao');
assert.ok(sample.failed);

// M3: chế độ thường giữ đỏ 1 giây, chỉnh riêng xanh về 0,5 giây.
const m3 = runCase({ red: 1, blue: 0.5 });
assert.equal(m3.failed, false);
assert.equal(m3.got, 4);
assert.equal(m3.missed, 0);
assert.equal(m3.done.m3, true, 'Đỏ 1 giây + xanh 0,5 giây đạt M3');

const normalRedTooFast = runCase({ red: 0.5, blue: 0.5 });
assert.equal(normalRedTooFast.done.m3, false, 'Đỏ 0,5 giây quá ngắn ở chế độ thường');
assert.equal(normalRedTooFast.reason, 'timing');
assert.ok(normalRedTooFast.failed);
assert.ok(normalRedTooFast.bags[0].angle < 0, 'Cần gạt sai thời gian vẫn quay theo chiều thực tế');

const wrongBlueTime = runCase({ red: 1, blue: 1 });
assert.equal(wrongBlueTime.done.m3, false, 'Xanh 1 giây bị gạt quá đà');
assert.equal(wrongBlueTime.reason, 'timing');
assert.ok(wrongBlueTime.failed);

const wrongDirection = runCase({ red: 1, blue: 0.5, redDir: 'cw' });
assert.equal(wrongDirection.done.m3, false, 'Đỏ quay sai chiều không được tính điểm');
assert.equal(wrongDirection.reason, 'direction');
assert.ok(wrongDirection.bags[0].angle > 0, 'Góc cần gạt phản ánh chiều quay thực tế khi làm sai');

// Nâng cao: dòng rác nhanh, cả hai thời gian 0,5 giây mới đạt M5.
const pro = runCase({ advanced: true, red: 0.5, blue: 0.5 });
assert.equal(pro.done.m3, true);
assert.equal(pro.done.m5, true);
assert.equal(pro.got, 4);
assert.equal(pro.failed, false);

const proRedTooSlow = runCase({ advanced: true, red: 1, blue: 0.5 });
assert.equal(proRedTooSlow.done.m5, false, 'Nâng cao không chấp nhận đỏ 1 giây');
assert.equal(proRedTooSlow.reason, 'timing');
assert.ok(proRedTooSlow.failed);

// Khay hứng chỉ giữ túi trượt, tuyệt đối không biến túi sai thành túi phân loại đúng.
const tray = runCase({ advanced: true, red: 1, blue: 1, upgrades: ['tray'] });
assert.equal(tray.got, 0);
assert.equal(tray.missed, 4);
assert.equal(tray.bags.every(b => b.state === 'caught'), true);
assert.equal(tray.done.m3, false);

const sensorTimeout = runCase({ wrongFirstSensor: true });
assert.equal(sensorTimeout.done.m3, false);
assert.equal(sensorTimeout.reason, 'sensor');
assert.ok(sensorTimeout.failed, 'Cảm biến chờ sai màu phải báo lỗi rõ ràng');

const assembly = new SorterEngine();
let missionState;
assembly.onMissionUpdate = state => { missionState = state; };
assembly.setAssemblyDone(true);
assert.equal(missionState.m1, true, 'Đánh dấu lắp ráp hoàn thành mở M1');

// Mức Chờ 0,5 giây phải xuất hiện trong danh sách tham số có thể chọn.
const blockEngine = Object.create(window.BlockEngine.prototype);
blockEngine.opts = { waits: lesson.blocks.waits };
blockEngine.sampleProgram = sampleProgram;
assert.deepEqual(Array.from(blockEngine.waitSteps()), [0.5, 1, 2, 3, 4, 5]);

// 4 gói sáng tạo có preset, vị trí và chi tiết 3D hợp lệ.
assert.equal(lesson.creative.slots.length, 4);
assert.equal(lesson.creative.presets.length, 4);
assert.deepEqual(Array.from(lesson.creative.presets, p => p.id), ['funnel', 'paddedArm', 'lids', 'tray']);
const made = [];
const placements = lesson.creative.placements(build, {
  make(_data, pos, rotation, meshes, kind) {
    const item = { pos, rotation, meshes, kind };
    made.push(item);
    return item;
  }
});
assert.deepEqual(Object.keys(placements).sort(), ['arm:paddedArm', 'bottom:tray', 'bins:lids', 'mouth:funnel'].sort());
assert.ok(Object.values(placements).every(items => items.length > 0));
assert.equal(placements['bins:lids'].length, 2, 'Hai ngăn có hai nắp');
assert.equal(made.length, 5);
for (const item of made) {
  assert.ok(item.meshes.length > 0);
  assert.ok(item.meshes.every(index => index >= 0 && index < build.meshes.length));
}

// Dữ liệu 3D dựng sẵn và 18 ảnh lắp ráp được giữ nguyên, đủ để trang dùng trực tiếp.
assert.equal(build.steps, 18);
assert.equal(build.instances.length, 34);
assert.equal(build.meshes.length, 26);
assert.deepEqual(build.warnings, []);
assert.equal(fs.readdirSync(path.join(root, 'assets/lop3-bai04')).filter(n => /^step-\d{2}\.jpg$/.test(n)).length, 18);
for (let step = 1; step <= 18; step++) {
  const name = `assets/lop3-bai04/step-${String(step).padStart(2, '0')}.jpg`;
  const image = read(name);
  assert.equal(image[0], 0xff, `${name}: JPEG SOI`);
  assert.equal(image[1], 0xd8, `${name}: JPEG SOI`);
  assert.equal(image.at(-2), 0xff, `${name}: JPEG EOI`);
  assert.equal(image.at(-1), 0xd9, `${name}: JPEG EOI`);
  assert.equal(lesson.book({ page: step }).src, name);
}
const cover = read('assets/covers/lop3-bai04.jpg');
assert.equal(cover[0], 0xff);
assert.equal(cover[1], 0xd8);
assert.ok(exists('content/lop3/bai04/page.html'));
assert.ok(exists('js/lop3-bai04/sorter-scene.js'));
assert.equal(fs.readFileSync(path.join(root, 'js/lessons.js'), 'utf8').match(/'lop3-bai04'\s*:/g)?.length, 1);
assert.equal(fs.readFileSync(path.join(root, 'js/catalog.js'), 'utf8').match(/bai\.html\?id=lop3-bai04/g)?.length, 1);

console.log('PASS: lop3-bai04 – mẫu M2, M3 thường, M5 nâng cao, sai thời gian/chiều/cảm biến, khay hứng, 4 gói 3D, 18 JPEG, đăng ký bài.');
