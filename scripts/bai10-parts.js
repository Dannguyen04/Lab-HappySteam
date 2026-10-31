// Mã linh kiện ZMROBO/RoboBuilder cho từng linh kiện LDraw trong file .io Bài 10 (cối xoay gió).
// Nguồn: RBB_Studio/io2rbb match (31/10/2026); màu theo sách hướng dẫn lắp. Hình 3D vẫn là hình CAD gốc.
'use strict';
const bai9 = require('./bai9-parts');

const parts = {
  '2780.dat': { code: 'BP-7012', color: '(02)', name: 'Chốt đen', type: 'Chốt' },
  // 43093 (chốt trục xanh dương): BP-7013 khớp hình ×1,35, ngang BP-7016; BP-7013 có 10 cái trong kit
  '43093.dat': { code: 'BP-7013', color: '(09)', name: 'Chốt trục xanh dương', type: 'Chốt' },
  'bp-7009(01).dat': { code: 'BP-7009', color: '(01)', name: 'Chốt trục xám', type: 'Chốt' },
  '48989.dat': { code: 'BP-7006', color: '(01)', name: 'Khối nối 4 chốt', type: 'Chốt' },
  '87082.dat': { code: 'BP-7549', color: 'B', name: 'Chốt có lỗ ngang', type: 'Chốt' },
  '32526.dat': { code: 'BP-7078', color: '(06)', name: 'Thanh chữ L 3×5', type: 'Thanh' },
  '32278.dat': { code: 'BP-7528', color: 'm', name: 'Thanh 15 lỗ', type: 'Thanh' },
  'bp-7525a(16).dat': { code: 'BP-7525A', color: '(06)', name: 'Thanh 7 lỗ (cánh quạt)', type: 'Thanh' },
  'bp-8818(16).dat': { code: 'BP-8818', color: '(16)', name: 'Khung đế 7×11', type: 'Thanh' },
  'bp-8813(06).dat': { code: 'BP-8813', color: '(06)', name: 'Khối 3 cánh (bầu cánh quạt)', type: 'Khớp nối' },
  // Trục 2 có khía màu đỏ: khớp hình BP-3990 (trục 2)
  '32062.dat': { code: 'BP-3990', color: '(05)', name: 'Trục 2 màu đỏ', type: 'Trục' },
  'be-3578.dat': { code: 'BE-3581', color: null, name: 'Động cơ', type: 'Động cơ' },
  'be-5158.dat': { code: 'BE-5158', color: null, name: 'Bộ não M5-RCU', type: 'Bộ điều khiển' },
  'be-2257.dat': { code: 'BE-2257', color: null, name: 'Cảm biến chạm (nút bấm)', type: 'Cảm biến' }
};

module.exports = {
  parts,
  colors: { ...bai9.colors, '(05)': 'đỏ' },
  rgb: { ...bai9.rgb, '(05)': [200, 30, 30] }
};
