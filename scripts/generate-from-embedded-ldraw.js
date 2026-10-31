// Tạo dữ liệu 3D Bài 9 từ hình học CAD nhúng trong model2.ldr (file .io của BrickLink Studio).
// Hình 3D giữ nguyên CAD gốc; mã/tên/màu theo bảng scripts/bai9-parts.js; bước theo sách (scripts/assembly-plan.js).
// Phần đọc CAD/dựng mesh dùng chung ở scripts/lib/cad-lesson.js.
'use strict';
const path = require('node:path');
const cad = require('./lib/cad-lesson');
const plan = require('./assembly-plan');
const table = require('./bai9-parts');

const ROOT = path.join(__dirname, '..');
const source = path.join(ROOT, 'references', 'original_models', 'model2.ldr');
const target = path.join(ROOT, 'js', 'data-bai-09.js');

const sections = cad.readSections(source);
const rootParts = cad.flattenRoot(sections, 'bài 9 -thông tin liên lạc vũ trụ', 61);

// Cột anten (bước 16–17): file CAD dùng trục 9 (60485, 180 LDU) nhưng sách và kit thật dùng trục 7 (140 LDU,
// người dùng xác nhận 30/10/2026). Thay bằng trục 7: đầu dưới giữ nguyên trong lỗ, phần phía trên cột hạ theo trục.
// Chuỗi: khớp nối 44 → trục 47 → khớp góc 45 → trục 48 → khớp góc 46 → trục 49 → cụm đầu (0–22).
const AXLE_SHORTEN = 40; // LDU
for (const [axle, below, above] of [
  [47, 44, [45, 46, 48, 49]],
  [48, 45, [46, 49]],
]) {
  const p = rootParts[axle];
  if (p.file !== '60485.dat') throw Error('Linh kiện ' + axle + ' không phải trục 9');
  let u = [p.rot[0], p.rot[1], p.rot[2]]; // cột 0 (rot lưu theo cột) = trục X cục bộ = chiều dài trục
  const toBelow = rootParts[below].pos.map((v, k) => v - p.pos[k]);
  if (toBelow[0] * u[0] + toBelow[1] * u[1] + toBelow[2] * u[2] > 0) u = u.map(v => -v); // u hướng lên đầu trên
  p.pos = p.pos.map((v, k) => v - u[k] * AXLE_SHORTEN / 2);
  p.axle7 = true;
  const moved = [...above, ...Array.from({ length: plan.headCount }, (_, i) => i)];
  for (const i of moved) rootParts[i].pos = rootParts[i].pos.map((v, k) => v - u[k] * AXLE_SHORTEN);
}

const { instances, meshes, stats } = cad.buildInstances(sections, rootParts, {
  plan: { byPart: plan.byPart, joinsOf: idx => (idx < plan.headCount ? [plan.finalStep] : []) },
  table,
  tableName: 'scripts/bai9-parts.js',
  meshKey: p => (p.axle7 ? '|7' : ''),
  // Trục 7 từ hình trục 9: co theo chiều dài (trục X cục bộ), tiết diện giữ nguyên
  shape: (p, buckets) => {
    if (p.axle7) for (const list of buckets.values()) for (const v of list) v.point = [v.point[0] * 140 / 180, v.point[1], v.point[2]];
  }
});

// Mô-đun cảm biến minh họa cho xưởng sáng tạo (không có trong file CAD): khối trắng 30 mm, mắt đọc tròn
// màu tối ở mặt trước (+Z). Đơn vị mét, đáy ở y = 0. Không phải hình của một mã cảm biến cụ thể.
const creativeMeshes = { sensor: [] };
creativeMeshes.sensor.push(meshes.length);
meshes.push(cad.encodeMesh(cad.boxTris([-0.015, 0, -0.015], [0.015, 0.028, 0.015]), 'sensor-body', 'proc', [0.9, 0.91, 0.9]));
creativeMeshes.sensor.push(meshes.length);
meshes.push(cad.encodeMesh(cad.discTris([0, 0.016, 0.015], 0.006, 0.0015), 'sensor-lens', 'proc', [0.08, 0.09, 0.12]));

// Bộ truyền động cho sa bàn (Tab 2): bánh răng 8 răng (động cơ) dẫn bánh răng 40 răng; mọi thứ gắn trên trục
// bánh răng 40 (trục, bạc, khớp nối, cột anten, cụm đầu) quay cùng nhau quanh trục đứng qua tâm bánh răng.
const DRIVE = {
  output: { gear: 40, parts: [37, 40, 41, 44, 45, 46, 47, 48, 49, ...Array.from({ length: plan.headCount }, (_, i) => i)] },
  motor: { gear: 43, parts: [36, 43] }
};
for (const [key, d] of Object.entries(DRIVE)) {
  const expect = key === 'output' ? 'BP-7045' : 'BP-7054';
  if (instances[d.gear].name !== expect) throw Error('Bộ truyền: linh kiện ' + d.gear + ' không phải ' + expect);
  d.point = instances[d.gear].pos;
  d.axis = [0, 1, 0];
}
for (const i of DRIVE.output.parts)
  if (Math.abs(instances[i].pos[0] - DRIVE.output.point[0]) > 0.2) throw Error('Bộ truyền: linh kiện lạ ' + i);

cad.writeData(target, {
  source: 'Bài 9 -Thông tin liên lạc vũ trụ.io (hình CAD gốc, 61 linh kiện); 28 bước theo sách hướng dẫn chính thức',
  meshes, textures: [], instances,
  steps: plan.finalStep, stepDescriptions: plan.stepDescriptions, stepInfo: plan.stepInfo,
  warnings: [],
  labels: cad.labelsOf(table),
  creative: creativeMeshes,
  drive: DRIVE,
}, `CAD gốc: ${sections.size} section, ${rootParts.length} chi tiết, ${meshes.length} mesh, ${stats.triangles} tam giác;`);
