// Mã linh kiện ZMROBO/RoboBuilder cho từng linh kiện LDraw trong file .io Bài 9.
// Nguồn: RBB_Studio/io2rbb (so hình học với thư viện 268 linh kiện RoboBuilder, ưu tiên mã có trong kit set2321A).
// Hình 3D trong app vẫn là hình CAD gốc của file .io; bảng này chỉ dùng cho mã, tên và màu hiển thị.
'use strict';

const parts = {
  '6558.dat': { code: 'BP-7011', color: '(09)', name: 'Chốt dài xanh dương', type: 'Chốt' },
  '63869.dat': { code: 'BP-7004', color: '(01)', name: 'Khối nối 3 lỗ', type: 'Khớp nối' },
  '42003.dat': { code: 'BP-7002', color: '(16)', name: 'Khối nối chữ thập', type: 'Khớp nối' },
  '6536.dat': { code: 'BP-7094', color: '(01)', name: 'Khối nối 2 lỗ', type: 'Khớp nối' },
  '4519.dat': { code: 'BP-3991', color: '(01)', name: 'Trục 3', type: 'Trục' },
  '48989.dat': { code: 'BP-7006', color: '(01)', name: 'Khối nối 4 chốt', type: 'Chốt' },
  'bp-7524a(16).dat': { code: 'BP-7524A', color: '(16)', name: 'Thanh 5 lỗ', type: 'Thanh' },
  '32523.dat': { code: 'BP-7523A', color: '(12)', name: 'Thanh 3 lỗ', type: 'Thanh' },
  'bp-3976(16).dat': { code: 'BP-3976', color: '(16)', name: 'Khung 5×7 (cánh pin)', type: 'Thanh' },
  'be-3578.dat': { code: 'BE-3581', color: null, name: 'Động cơ', type: 'Động cơ' },
  'be-5158.dat': { code: 'BE-5158', color: null, name: 'Bộ điều khiển M5-RCU', type: 'Bộ điều khiển' },
  'bp-8818(16).dat': { code: 'BP-8818', color: '(16)', name: 'Khung đế 7×11', type: 'Thanh' },
  '2780.dat': { code: 'BP-7012', color: '(02)', name: 'Chốt đen', type: 'Chốt' },
  'bp-7548b.dat': { code: 'BP-7548', color: 'B', name: 'Chốt vuông', type: 'Chốt' },
  '87083.dat': { code: 'BP-7090', color: '(03)', name: 'Trục 4 có gờ chặn', type: 'Trục' },
  '3649.dat': { code: 'BP-7045', color: '(01)', name: 'Bánh răng 40 răng', type: 'Bánh răng' },
  '3713.dat': { code: 'BP-7023', color: '(01)', name: 'Bạc chặn trục', type: 'Trục' },
  'bp-7525a(16).dat': { code: 'BP-7525A', color: '(06)', name: 'Thanh 7 lỗ', type: 'Thanh' },
  '10928.dat': { code: 'BP-7054', color: '(03)', name: 'Bánh răng 8 răng', type: 'Bánh răng' },
  '6538c.dat': { code: 'BP-7099', color: '(02)', name: 'Khớp nối trục', type: 'Khớp nối' },
  // Kit thật: khớp góc ~157,5° (người dùng xác nhận 30/10/2026). RoboBuilder không có mã này; BP-7029 là khớp 135°.
  '32016.dat': { code: 'BP-7029', color: '(02)', name: 'Khớp góc', type: 'Khớp nối' },
  // File CAD vẽ trục 9 (BP-3994); sách và kit thật dùng trục 7 – generator co hình và hạ phần cột phía trên
  '60485.dat': { code: 'BP-3993', color: '(01)', name: 'Trục 7', type: 'Trục' },
  '32073.dat': { code: 'BP-3992', color: 'H', name: 'Trục 5', type: 'Trục' },
  '32278.dat': { code: 'BP-7528', color: 'm', name: 'Thanh 15 lỗ', type: 'Thanh' },
  '55615.dat': { code: 'BP-7096', color: '(01)', name: 'Khớp chữ L', type: 'Chốt' },
  'bp-7620(16).dat': { code: 'BP-7620', color: '(16)', name: 'Khung chữ H 5×11', type: 'Thanh' }
};

const colors = {
  '(01)': 'xám nhạt',
  '(02)': 'đen',
  '(03)': 'xám đậm',
  '(06)': 'trắng',
  '(09)': 'xanh dương',
  '(12)': 'vàng',
  '(16)': 'xanh ngọc',
  B: 'đen',
  H: 'xám',
  m: 'trắng'
};

// Màu hiển thị (RGB 0–1) theo bảng màu RoboBuilder
const rgb = {
  '(01)': [159, 164, 168],
  '(02)': [10, 10, 10],
  '(03)': [65, 65, 65],
  '(06)': [220, 220, 215],
  '(09)': [0, 0, 192],
  '(12)': [255, 192, 0],
  '(16)': [61, 193, 220],
  B: [10, 10, 10],
  H: [159, 164, 168],
  m: [220, 220, 215]
};

module.exports = { parts, colors, rgb };
