// Mã linh kiện ZMROBO/RoboBuilder cho từng linh kiện LDraw trong file .io Bài 1 (xe trượt dốc, 22 linh kiện).
// Nguồn: RBB_Studio/io2rbb match (io2rbb/out/bai1/match.json, 31/10/2026); màu theo màu CAD. Hình 3D vẫn là hình CAD gốc.
'use strict';
const bai9 = require('./bai9-parts');

const parts = {
  '32278.dat': { code: 'BP-7528', color: 'm', name: 'Thanh 15 lỗ', type: 'Thanh' },
  '2780.dat': { code: 'BP-7012', color: '(02)', name: 'Chốt đen', type: 'Chốt' },
  // 3707 (trục 8 đen): BP-7630 khớp hình ×1,06
  '3707.dat': { code: 'BP-7630', color: '(02)', name: 'Trục 8 đen', type: 'Trục' },
  // 4185 (bánh đai, xám đậm): BP-7095 khớp hình ×1,32 (ứng viên kế tiếp ×2,37) – cũng là bánh nhỏ đuôi xe Bài 2
  '4185.dat': { code: 'BP-7095', color: '(03)', name: 'Bánh đai nhỏ', type: 'Bánh xe' },
  // 3713 (bạc trục, xám nhạt): BP-7023 khớp hình ×1,61
  '3713.dat': { code: 'BP-7023', color: '(01)', name: 'Bạc trục', type: 'Trục' },
  'bp-8841(06).dat': { code: 'BP-8841', color: '(06)', name: 'Vành bánh xe', type: 'Bánh xe' },
  'bp-8850(16).dat': { code: 'BP-8850', color: '(16)', name: 'Lốp xe xanh ngọc', type: 'Bánh xe' }
};

module.exports = { parts, colors: bai9.colors, rgb: bai9.rgb };
