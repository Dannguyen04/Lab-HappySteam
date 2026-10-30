// Chạy: node tests/mission.test.js (chỉ dùng Node.js built-in).
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const plan = require('../scripts/assembly-plan');

const root = path.join(__dirname, '..');
const context = {
  window: { addEventListener() {} },
  document: { getElementById() { return null; } },
  performance: { now: () => 0 },
};
vm.runInNewContext(fs.readFileSync(path.join(root, 'js/data-bai-09.js'), 'utf8'), context);
const model = context.window.LESSON_3D_DATA;
assert.equal(model.instances.length, 61, 'Mô hình gốc phải có 61 linh kiện');
assert.equal(model.steps, 28, 'Sách hướng dẫn chính thức có 28 bước');
assert.equal(model.stepDescriptions.length, 28);
assert.equal(model.stepInfo.length, 28);
assert.ok(model.stepInfo.every((info, i) => info.page === i + 1), 'Mỗi bước trỏ đúng số bước in trong sách');
assert.match(model.source, /.io/, 'Phải dùng hình học CAD gốc của file .io');
assert.equal(model.meshes.filter(m => !m.name.startsWith('proc/')).length, 32, '32 nhóm mesh CAD sau khi gom cùng mã và màu');
assert.deepEqual(Array.from(model.creative.sensor, i => model.meshes[i].name), ['proc/sensor-body', 'proc/sensor-lens'], 'Mesh cảm biến minh họa cho xưởng sáng tạo');
const byName = n => model.instances.filter(p => p.name === n);
assert.equal(model.instances[23].name, 'BE-3581', 'Động cơ: mã ZMROBO có trong kit (CAD gọi BE-3578)');
assert.equal(model.instances[23].originalPart, 'be-3578.dat');
assert.equal(model.instances[24].name, 'BE-5158', 'CAD instance 24 là M5-RCU');
assert.equal(model.instances[23].meshes.every(i => model.meshes[i].name.startsWith('be-3578.dat')), true);
assert.equal(byName('BP-7012').length, 15, '15 chốt đen');
assert.equal(byName('BP-7011').length, 6, '6 chốt xanh dương');
assert.equal(byName('BP-7045').length, 1, 'Bánh răng 40 răng là BP-7045 (không phải BP-7030)');
assert.ok(model.instances.every(p => model.labels.names[p.name]), 'Mọi mã đều có tên tiếng Việt');
// Màu: chốt xanh dương phải hiện xanh dương (mã màu .io là BrickLink, không phải LDraw)
const blue = model.meshes[byName('BP-7011')[0].meshes[0]].color;
assert.ok(blue[2] > 0.6 && blue[0] < 0.2, 'Chốt BP-7011 phải màu xanh dương');
const zlib = require('node:zlib');
for (const [i, mesh] of model.meshes.entries()) {
  assert.ok(mesh.count > 0 && mesh.count % 3 === 0, `Mesh ${i}: tam giác CAD hợp lệ`);
  assert.ok(mesh.hi.every((hi, axis) => hi >= mesh.lo[axis]), `Mesh ${i}: hình học có giới hạn hợp lệ`);
  const bytes = zlib.gunzipSync(Buffer.from(mesh.z, 'base64'));
  const expected = ((mesh.v * 9 + 3) & ~3) + mesh.count * (mesh.v > 65535 ? 4 : 2);
  assert.equal(bytes.length, expected, `Mesh ${i}: dữ liệu nén tương thích viewer`);
}
assert.equal(model.instances.filter(p => p.groupPath === 'Main').length, 38, 'Thân: 38 linh kiện');
assert.equal(model.instances.filter(p => p.groupPath === 'Main/Head').length, 23, 'Cụm đầu: 23 linh kiện');
assert.equal(model.stepInfo[27].joins.join(), 'đầu vệ tinh', 'Bước 28 ghép cụm đầu');
const counts = model.instances.reduce((m, p) => ((m[p.step] = (m[p.step] || 0) + 1), m), {});
// Số linh kiện mỗi bước theo ô linh kiện của sách (bước 19, 20, 28 không thêm linh kiện)
const book = [1, 4, 1, 2, 2, 1, 4, 2, 3, 3, 1, 2, 2, 3, 2, 2, 2, 1, 0, 0, 3, 2, 6, 6, 2, 2, 2, 0];
book.forEach((n, i) => assert.equal(counts[i + 1] || 0, n, `Bước ${i + 1}: sách có ${n} linh kiện`));
for (let i = 0; i < model.instances.length; i++) {
  const p = model.instances[i];
  assert.ok(p.pos.every(Number.isFinite) && p.rotation.every(Number.isFinite), `Linh kiện ${i}: phép biến đổi hợp lệ`);
  assert.equal(p.step, plan.byPart.get(i).step, `Sai bước linh kiện #${i}`);
  assert.equal(Array.from(p.joins).join(), i < 23 ? '28' : '', `Sai bước ghép #${i}`);
}

vm.runInNewContext(fs.readFileSync(path.join(root, 'js/simulation-engine.js'), 'utf8'), context);
const Sim = context.window.SimulationEngine;
const B = {
  start: { type: 'start' },
  low: { type: 'motor', speed: 'low' },
  high: { type: 'motor', speed: 'high' },
  wait: { type: 'wait', duration: 1 },
  melody: { type: 'melody', tune: 'B' },
  reverse: { type: 'motor_reverse' },
  stop: { type: 'stop' },
  sensor: { type: 'sensor_obstacle' },
};

function run(program, seconds, upgrade = null) {
  const sim = new Sim('none');
  const states = [];
  sim.onMissionUpdate = state => states.push(state);
  sim.setProgram(program);
  sim.activeUpgrade = upgrade;
  sim.checkMissions();
  // Chia ra các frame nhỏ để mô phỏng quét và phát hiện vùng nguy hiểm.
  for (let t = 0; t < seconds; t += 0.02) sim.advance(Math.min(0.02, seconds - t));
  sim.checkMissions();
  return { sim, state: states.at(-1) };
}

assert.equal(run([B.start, B.melody, B.reverse], 0.1).state.m3, false,
  'Có Reverse trong chương trình chưa đủ để được chấm điểm');
assert.equal(run([B.start, B.melody, B.sensor], 0.1).state.m3, false,
  'Có Sensor trong chương trình chưa đủ để được chấm điểm');
assert.equal(run([B.start, B.reverse, B.melody], 1.1).state.m3, false,
  'Đảo chiều khi chưa đến gần thiên thạch không được tính');

const reversed = run([B.start, B.melody, B.low, B.wait, B.reverse, B.stop], 2.4);
assert.equal(reversed.state.m1, false, 'NV1 cần lắp xong 28 bước ở tab lắp ráp');
assert.equal(reversed.state.m2, false, 'Chương trình khác mẫu không đạt NV2');
assert.equal(reversed.state.m3, true);
assert.equal(reversed.state.avoidanceMethod, 'reverse');

const alerted = run([B.start, B.low, B.melody, B.stop], 1.5);
assert.equal(alerted.state.m3, true, 'Phát Melody B và dừng khi 90° phải được tính');
assert.equal(alerted.state.avoidanceMethod, 'melody-stop');

const staleAlert = run([B.start, B.melody, B.low, B.wait, B.stop], 2.5);
assert.equal(staleAlert.state.m3, false,
  'Melody B phát trước khi vệ tinh tiếp cận không được tính là cảnh báo đúng lúc');

const skippedHazard = new Sim('none');
skippedHazard.prog = [B.start, B.high];
skippedHazard.running = true;
skippedHazard.motorOn = true;
skippedHazard.rev = 0;
skippedHazard.integrate(2.2);
assert.equal(skippedHazard.hazardEncountered, true,
  'Frame dài đi qua vành đai vẫn phải nhận diện va chạm');

const restartAlert = run([B.start, B.low, B.melody, B.stop], 1.5);
restartAlert.sim.setProgram([B.start, B.low, B.wait, B.stop]);
assert.equal(restartAlert.sim.melodyAlertRev, null,
  'Thay chương trình phải xóa cảnh báo Melody B lần chạy trước');

const collision = run([B.start, B.high, B.wait, B.melody, B.stop], 2.5);
assert.equal(collision.state.m3, false, 'Đi qua vùng thiên thạch không được công nhận');
assert.equal(collision.sim.hazardEncountered, true);

const sensorWithoutUpgrade = run([B.start, B.low, B.sensor, B.reverse, B.melody], 3);
assert.equal(sensorWithoutUpgrade.state.m3, false, 'Cảm biến chưa lắp chưa thể phát hiện');
const sensorWithUpgrade = run([B.start, B.low, B.sensor, B.reverse, B.melody], 3, 'sensor');
assert.equal(sensorWithUpgrade.state.m3, true, 'Cảm biến đã lắp + đảo chiều phải tránh được');

// NV1: tab lắp ráp báo đã lắp xong 28 bước
const built = new Sim('none');
const builtStates = [];
built.onMissionUpdate = st => builtStates.push(st);
built.setAssemblyDone(true);
assert.equal(builtStates.at(-1).m1, true, 'Lắp xong 28 bước phải đạt NV1');

// NV2: đúng chương trình mẫu trong sách và chạy hết một vòng lặp (1 + 3 + 1 + 3 = 8 giây)
const A = { type: 'melody', tune: 'A' }, W3 = { type: 'wait', duration: 3 };
const RS = { type: 'repeatStart' }, RE = { type: 'repeatEnd' };
const sample = [B.start, RS, A, B.high, W3, B.melody, B.high, W3, RE];
assert.equal(run(sample, 7.5).state.m2, false, 'Chưa chạy hết vòng lặp thì chưa đạt NV2');
assert.equal(run(sample, 8.3).state.m2, true, 'Chương trình mẫu chạy hết vòng phải đạt NV2');
const withPower = [B.start, RS, A, { type: 'motor_power', power: 2 }, W3, B.melody, B.high, W3, RE];
assert.equal(run(withPower, 8.3).state.m2, true, 'Motor Power thay High Speed vẫn đúng mẫu (giáo án đổi 8 → 2)');
const swapped = [B.start, RS, B.melody, B.high, W3, A, B.high, W3, RE];
assert.equal(run(swapped, 8.3).state.m2, false, 'Đổi thứ tự Melody A/B không đúng mẫu');

// Motor Power: tốc độ = 150 × mức / 8, qua bánh răng 8:40
const slow = run([B.start, { type: 'motor_power', power: 2 }, { type: 'wait', duration: 4 }], 4);
assert.ok(Math.abs(slow.sim.rev - 37.5 / 60 / 5 * 4) < 1e-6, 'Mức 2 = 37,5 vòng/phút ở động cơ');

// NV4: có gói nâng cấp và động cơ đã chạy trên sa bàn
const up = new Sim('none');
const upStates = [];
up.onMissionUpdate = st => upStates.push(st);
up.setUpgrades(['solar', 'radar']);
up.setProgram([B.start, B.high, { type: 'wait', duration: 1 }]);
up.checkMissions();
assert.equal(upStates.at(-1).m4, false, 'Chưa chạy động cơ thì chưa đạt NV4');
up.advance(0.1);
assert.equal(upStates.at(-1).m4, true, 'Gói nâng cấp + động cơ chạy phải đạt NV4');
assert.equal(Array.from(upStates.at(-1).upgrades).join(), 'solar,radar');

reversed.sim.setProgram([B.start, B.melody, B.reverse]);
reversed.sim.checkMissions();
assert.equal(reversed.sim.asteroidAvoided, false, 'Sửa chương trình phải xóa chứng nhận lần chạy cũ');

console.log('PASS: hình học CAD gốc 61 linh kiện/32 mesh, 28 bước theo sách, mã/màu ZMROBO, 4 nhiệm vụ + Motor Power, 18 tình huống mô phỏng/chấm điểm.');
