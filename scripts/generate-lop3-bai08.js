// Tạo dữ liệu 3D Lớp 3 Bài 8 – Giải cứu máy bay (content/lop3/bai08/build.json) từ hình CAD nhúng trong file .io.
// Cần references/lop3/bai08/x/io/model2.ldr (giải nén từ "Bài 8 - Giải cứu máy bay.io", chỉ có ở máy).
// Mô hình chính trộn 2 nhóm con + linh kiện rời: chỉ số 0–43 = SubModel Group 1 (cụm trên: động cơ M1, cần, máy bay),
// 44–71 = SubModel Group 2 (cụm dưới: động cơ M2, trục vít, bánh răng, tay quay), 72–100 = đế + bộ não.
// Bước theo sách: scripts/lop3-bai08-plan.js; mã/tên/màu: scripts/lop3-bai08-parts.js.
'use strict';
const path = require('node:path');
const cad = require('./lib/cad-lesson');
const plan = require('./lop3-bai08-plan');
const table = require('./lop3-bai08-parts');

const ROOT = path.join(__dirname, '..');
const source = path.join(ROOT, 'references', 'lop3', 'bai08', 'x', 'io', 'model2.ldr');

const sections = cad.readSections(source);
const rootParts = cad.flattenRoot(sections, 'bài 8 - giải cứu máy bay', plan.count);

const { instances, meshes, stats } = cad.buildInstances(sections, rootParts, {
  plan: { byPart: plan.byPart, joinsOf: plan.joinsOf },
  table,
  tableName: 'scripts/lop3-bai08-parts.js'
});

// Bộ truyền cho sa bàn (js/lop3-bai08/rescue-engine.js → pose3d { output, tilt }):
// - output (M1): trục 10 đứng (29) quay cần ngang, máy bay treo ở đầu cần; quay quanh trục đứng qua trục 29.
// - tilt (M2): trục vít → bánh răng 24 → tay quay 1×2 → cụm trên bập bênh. Mô phỏng gần đúng: cụm trên + 2 thanh
//   BP-7021 nghiêng quanh chốt đế (72) theo trục Z. Cần quay nằm trên cụm này nên output.parent = 'tilt'.
const expect = { 29: 'BP-7631', 72: 'BP-7015', 0: 'BE-3581', 45: 'BE-3581', 46: 'BP-7050' };
for (const [i, code] of Object.entries(expect))
  if (instances[i].name !== code) throw Error('Bộ truyền: linh kiện ' + i + ' là ' + instances[i].name + ', không phải ' + code);
const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
const DRIVE = {
  output: { parts: [...range(1, 10), ...range(16, 31)], point: instances[29].pos, axis: [0, 1, 0], parent: 'tilt' },
  tilt: { parts: [0, ...range(11, 15), ...range(32, 43), 70, 71, 74, 75], point: instances[72].pos, axis: [0, 0, 1] }
};

// Chi tiết minh họa cho xưởng sáng tạo, đơn vị mét, gốc ở điểm gắn
const rgb = c => table.rgb[c].map(v => +(v / 255).toFixed(3));
const proc = (name, tris, color) => {
  meshes.push(cad.encodeMesh(tris, name, 'proc', color));
  return meshes.length - 1;
};
const creative = {
  // Radar: cột đen 12 mm + đĩa đỏ Ø24 mm đứng
  radar: [
    proc('radar-mast', cad.boxTris([-0.002, 0, -0.002], [0.002, 0.012, 0.002]), rgb('(02)')),
    proc('radar-dish', cad.boxTris([-0.012, 0.012, -0.002], [0.012, 0.03, 0.002]), [0.9, 0.2, 0.18])
  ],
  // Đèn pha: 2 bạc vàng dưới bụng
  light: [
    proc('light-l', cad.boxTris([-0.012, -0.008, -0.004], [-0.004, 0, 0.004]), rgb('(12)')),
    proc('light-r', cad.boxTris([0.004, -0.008, -0.004], [0.012, 0, 0.004]), rgb('(12)'))
  ]
};

cad.writeData({
  source: 'Bài 8 - Giải cứu máy bay.io (hình CAD gốc, 101 linh kiện); 30 bước theo sách hướng dẫn lắp',
  label: 'Bài 8',
  meshes, textures: [], instances,
  steps: plan.finalStep, stepDescriptions: plan.stepDescriptions, stepInfo: plan.stepInfo,
  warnings: [],
  labels: cad.labelsOf(table),
  creative,
  drive: DRIVE,
}, `CAD gốc: ${sections.size} section, ${rootParts.length} chi tiết, ${meshes.length} mesh, ${stats.triangles} tam giác;`, 'lop3/bai08');
