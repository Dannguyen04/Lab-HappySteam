// Mã linh kiện ZMROBO/RoboBuilder cho từng linh kiện LDraw trong file .io Bài 3 (Robot thám hiểm Milo).
// Nguồn: RBB_Studio/io2rbb match (31/10/2026, so hình học với thư viện RoboBuilder); màu theo sách hướng dẫn lắp.
// Hình 3D vẫn là hình CAD gốc của file .io; bảng này chỉ dùng cho mã, tên và màu hiển thị.
'use strict';
const bai9 = require('./bai9-parts');

const parts = {
  '2780.dat': { code: 'BP-7012', color: '(02)', name: 'Chốt đen', type: 'Chốt' },
  '6558.dat': { code: 'BP-7011', color: '(09)', name: 'Chốt dài xanh dương', type: 'Chốt' },
  'bp-7553b.dat': { code: 'BP-7553', color: 'B', name: 'Khớp nối chốt vuông góc', type: 'Chốt' },
  // 87082 (chốt dài có lỗ giữa) và bp-7549b cùng khớp hình BP-7549
  '87082.dat': { code: 'BP-7549', color: 'B', name: 'Chốt có lỗ ngang', type: 'Chốt' },
  'bp-7549b.dat': { code: 'BP-7549', color: 'B', name: 'Chốt có lỗ ngang', type: 'Chốt' },
  '48989.dat': { code: 'BP-7006', color: '(01)', name: 'Khối nối 4 chốt', type: 'Chốt' },
  '32009.dat': { code: 'BP-7073', color: 'm', name: 'Thanh cong', type: 'Thanh' },
  '32523.dat': { code: 'BP-7523A', color: '(12)', name: 'Thanh 3 lỗ', type: 'Thanh' },
  'bp-7525a(16).dat': { code: 'BP-7525A', color: '(06)', name: 'Thanh 7 lỗ', type: 'Thanh' },
  'bp-8818(16).dat': { code: 'BP-8818', color: '(16)', name: 'Khung đế 7×11', type: 'Thanh' },
  '32013.dat': { code: 'BP-7027', color: '(02)', name: 'Khớp góc', type: 'Khớp nối' },
  '4519.dat': { code: 'BP-3991', color: '(01)', name: 'Trục 3', type: 'Trục' },
  '3705.dat': { code: 'BP-7628', color: '(02)', name: 'Trục 4', type: 'Trục' },
  // Bạc nửa màu vàng: khớp hình kém hơn (×1,72) – cần đối chiếu kit thật
  '4265c.dat': { code: 'BP-7024', color: '(12)', name: 'Bạc nửa', type: 'Trục' },
  'bp-8841(06).dat': { code: 'BP-8841', color: '(06)', name: 'Vành bánh xe', type: 'Bánh xe' },
  'bp-8850(16).dat': { code: 'BP-8850', color: '(16)', name: 'Lốp xe', type: 'Bánh xe' },
  'bp-8840(06).dat': { code: 'BP-8840', color: '(06)', name: 'Bánh bi', type: 'Bánh xe' },
  'be-3578.dat': { code: 'BE-3581', color: null, name: 'Động cơ', type: 'Động cơ' },
  'be-5158.dat': { code: 'BE-5158', color: null, name: 'Bộ não M5-RCU', type: 'Bộ điều khiển' },
  'be-6313.dat': { code: 'BE-6313', color: null, name: 'Cảm biến siêu âm', type: 'Cảm biến' }
};

module.exports = { parts, colors: bai9.colors, rgb: bai9.rgb };
