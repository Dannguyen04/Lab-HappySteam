// Tạo dữ liệu 3D Bài 10 – cối xoay gió (js/data-bai-10.js) từ hình CAD nhúng trong file .io.
// Cần references/drive_bai10/model2.ldr (giải nén từ "Bài 10 - Bạn gió tinh nghịch, gió ở đâu.io", chỉ có ở máy).
// File này không chia mô hình con (flat). Bước theo sách: scripts/bai10-plan.js; mã/tên/màu: scripts/bai10-parts.js.
'use strict';
const path = require('node:path');
const cad = require('./lib/cad-lesson');
const plan = require('./bai10-plan');
const table = require('./bai10-parts');

const ROOT = path.join(__dirname, '..');
const source = path.join(ROOT, 'references', 'drive_bai10', 'model2.ldr');
const target = path.join(ROOT, 'js', 'data-bai-10.js');

const sections = cad.readSections(source);
const rootParts = cad.flattenRoot(sections, 'bài 10 - bạn gió tinh nghịch, gió ở đâu', plan.count, true);

const { instances, meshes, stats } = cad.buildInstances(sections, rootParts, {
  plan: { byPart: plan.byPart, joinsOf: () => [] },
  table,
  tableName: 'scripts/bai10-parts.js'
});

// Bộ truyền cho sa bàn: động cơ quay thẳng cụm cánh quạt quanh trục đỏ (trục X cục bộ của trục = chiều dài trục)
const axle = instances[23];
if (axle.name !== 'BP-3990') throw Error('Bộ truyền: linh kiện 23 không phải trục đỏ');
for (const i of plan.rotor) if (!instances[i]) throw Error('Thiếu linh kiện cụm cánh ' + i);
const hub = instances[24];
const a = [axle.rotation[0], axle.rotation[1], axle.rotation[2]];
const len = Math.hypot(...a);
const DRIVE = {
  output: {
    parts: plan.rotor,
    point: hub.pos,
    axis: a.map(v => +(v / len).toFixed(6))
  }
};

// Chi tiết minh họa cho xưởng sáng tạo, đơn vị mét, gốc ở tâm bầu cánh quạt, mặt phẳng cánh ⟂ trục quay.
// Cánh dài / thêm cánh lấy lại hình thanh 7 lỗ thật; đèn và đuôi là khối đơn giản.
const rgb = c => table.rgb[c].map(v => +(v / 255).toFixed(3));
const proc = (name, tris, color) => {
  meshes.push(cad.encodeMesh(tris, name, 'proc', color));
  return meshes.length - 1;
};
const creative = {
  // Đèn: trụ đen 30 mm + khối đèn đỏ 12 mm
  light: [
    proc('light-pole', cad.boxTris([-0.003, 0, -0.003], [0.003, 0.03, 0.003]), rgb('(02)')),
    proc('light-lamp', cad.boxTris([-0.006, 0.03, -0.006], [0.006, 0.042, 0.006]), [0.9, 0.15, 0.12])
  ],
  // Đuôi lái gió: thanh 50 mm + cánh tam giác (hai hộp) màu xanh ngọc, hướng −Z (phía sau động cơ)
  tail: [
    proc('tail-bar', cad.boxTris([-0.003, -0.003, -0.05], [0.003, 0.003, 0]), rgb('(06)')),
    proc('tail-fin', [...cad.boxTris([-0.0015, -0.02, -0.07], [0.0015, 0.02, -0.045]), ...cad.boxTris([-0.0015, -0.012, -0.045], [0.0015, 0.012, -0.035])], rgb('(16)'))
  ]
};

cad.writeData(target, {
  source: 'Bài 10 - Bạn gió tinh nghịch, gió ở đâu.io (hình CAD gốc, 41 linh kiện); 15 bước theo sách hướng dẫn lắp',
  label: 'Bài 10',
  meshes, textures: [], instances,
  steps: plan.finalStep, stepDescriptions: plan.stepDescriptions, stepInfo: plan.stepInfo,
  warnings: [],
  labels: cad.labelsOf(table),
  creative,
  drive: DRIVE,
}, `CAD gốc: ${sections.size} section, ${rootParts.length} chi tiết, ${meshes.length} mesh, ${stats.triangles} tam giác;`);
