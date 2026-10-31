// Tạo dữ liệu 3D Bài 3 – Robot thám hiểm Milo (js/data-bai-03.js) từ hình CAD nhúng trong file .io.
// Cần references/drive_bai3/model2.ldr (giải nén từ "Bài 3 - Robot thám hiểm.io", chỉ có ở máy).
// Bước theo sách: scripts/bai03-plan.js; mã/tên/màu: scripts/bai03-parts.js.
'use strict';
const path = require('node:path');
const cad = require('./lib/cad-lesson');
const plan = require('./bai03-plan');
const table = require('./bai03-parts');

const ROOT = path.join(__dirname, '..');
const source = path.join(ROOT, 'references', 'drive_bai3', 'model2.ldr');
const target = path.join(ROOT, 'js', 'data-bai-03.js');

const sections = cad.readSections(source);
const rootParts = cad.flattenRoot(sections, 'bài 3 - robot thám hiểm', plan.count);

const { instances, meshes, stats } = cad.buildInstances(sections, rootParts, {
  plan: { byPart: plan.byPart, joinsOf: idx => (idx < plan.headCount ? [plan.joinStep] : []) },
  table,
  tableName: 'scripts/bai03-parts.js'
});

// Bộ truyền cho sa bàn: một động cơ quay trục xuyên qua (trục 4 + trục 3) và cả hai bánh xe.
// Trục quay = đường nối tâm hai vành bánh; mọi linh kiện trong 'output' quay quanh đường đó.
const WHEEL = { axles: [29, 30], hubs: [31, 32], tyres: [33, 34] };
const expect = { 29: 'BP-3991', 30: 'BP-7628', 31: 'BP-8841', 32: 'BP-8841', 33: 'BP-8850', 34: 'BP-8850' };
for (const [i, code] of Object.entries(expect))
  if (instances[i].name !== code) throw Error('Bộ truyền: linh kiện ' + i + ' không phải ' + code);
const [h1, h2] = WHEEL.hubs.map(i => instances[i].pos);
const axis = h2.map((v, k) => v - h1[k]);
const len = Math.hypot(...axis);
const DRIVE = {
  output: {
    parts: [...WHEEL.axles, ...WHEEL.hubs, ...WHEEL.tyres],
    point: h1.map((v, k) => +((v + h2[k]) / 2).toFixed(6)),
    axis: axis.map(v => +(v / len).toFixed(6)),
    // bán kính lốp (m) để đổi số vòng bánh ra quãng đường
    radius: +(Math.max(...meshes[instances[33].meshes[0]].hi.map((v, k) => (v - meshes[instances[33].meshes[0]].lo[k]) / 2))).toFixed(4)
  }
};

// Chi tiết minh họa cho xưởng sáng tạo (không có trong file CAD), đơn vị mét, đáy ở y = 0, mặt trước +X.
// Màu theo linh kiện kit tương ứng; là hình ý tưởng, không phải hình đúng từng linh kiện.
const rgb = c => table.rgb[c].map(v => +(v / 255).toFixed(3));
const proc = (name, tris, color) => {
  meshes.push(cad.encodeMesh(tris, name, 'proc', color));
  return meshes.length - 1;
};
const box = (lo, hi) => cad.boxTris(lo, hi);
const creative = {
  // Thùng chở mẫu: đáy + 4 vách, 54×28×46 mm, xanh ngọc như khung 7×11
  bin: [proc('bin', [
    ...box([-0.027, 0, -0.023], [0.027, 0.003, 0.023]),
    ...box([-0.027, 0, -0.023], [0.027, 0.028, -0.02]), ...box([-0.027, 0, 0.02], [0.027, 0.028, 0.023]),
    ...box([-0.027, 0, -0.023], [-0.024, 0.028, 0.023]), ...box([0.024, 0, -0.023], [0.027, 0.028, 0.023])
  ], rgb('(16)'))],
  // Pin mặt trời: tấm xanh dương 80×3×56 mm trên cột đen 40 mm
  solar: [
    proc('solar-mast', box([-0.003, 0, -0.003], [0.003, 0.04, 0.003]), rgb('(02)')),
    proc('solar-panel', box([-0.04, 0.04, -0.028], [0.04, 0.043, 0.028]), [0.12, 0.28, 0.65]),
    proc('solar-grid', [...box([-0.001, 0.043, -0.028], [0.001, 0.0435, 0.028]), ...box([-0.04, 0.043, -0.001], [0.04, 0.0435, 0.001])], [0.85, 0.9, 0.95])
  ],
  // Ăng-ten dài + đèn đỏ trên đỉnh
  antenna: [
    proc('antenna-rod', box([-0.002, 0, -0.002], [0.002, 0.07, 0.002]), rgb('(02)')),
    proc('antenna-light', box([-0.005, 0.07, -0.005], [0.005, 0.08, 0.005]), [0.9, 0.15, 0.12])
  ],
  // Cánh tay gắp: thanh trắng 60 mm chìa ra trước + 2 ngón kẹp xám
  arm: [
    proc('arm-bar', box([0, 0, -0.004], [0.06, 0.008, 0.004]), rgb('(06)')),
    proc('arm-claw', [...box([0.056, -0.012, -0.014], [0.062, 0.008, -0.01]), ...box([0.056, -0.012, 0.01], [0.062, 0.008, 0.014]),
      ...box([0.056, 0.004, -0.014], [0.062, 0.008, 0.014])], rgb('(01)'))
  ]
};

cad.writeData(target, {
  source: 'Bài 3 - Robot thám hiểm.io (hình CAD gốc, 40 linh kiện); 22 bước theo sách hướng dẫn lắp',
  label: 'Bài 3',
  meshes, textures: [], instances,
  steps: plan.finalStep, stepDescriptions: plan.stepDescriptions, stepInfo: plan.stepInfo,
  warnings: [],
  labels: cad.labelsOf(table),
  creative,
  drive: DRIVE,
}, `CAD gốc: ${sections.size} section, ${rootParts.length} chi tiết, ${meshes.length} mesh, ${stats.triangles} tam giác;`);
