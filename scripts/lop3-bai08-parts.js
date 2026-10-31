// Mã linh kiện ZMROBO/RoboBuilder cho từng linh kiện LDraw trong file .io Lớp 3 Bài 8 (giàn bay máy bay cứu hộ).
// Nguồn: RBB_Studio/io2rbb match (01/11/2026, io2rbb/out/lop3-bai08/match.log) + bảng kit set2321A. Hình 3D vẫn là hình CAD gốc.
// "?" trong ghi chú = khớp yếu hoặc không dò được, cần kiểm trên kit thật.
'use strict';
const bai9 = require('./bai9-parts');

const parts = {
  'be-3578.dat': { code: 'BE-3581', color: null, name: 'Động cơ', type: 'Động cơ' },
  'be-5158.dat': { code: 'BE-5158', color: null, name: 'Bộ não M5-RCU', type: 'Bộ điều khiển' },
  'bp-7017m.dat': { code: 'BP-7017', color: 'M', name: 'Cánh máy bay trái', type: 'Khác' },
  'bp-7018m.dat': { code: 'BP-7018', color: 'M', name: 'Cánh máy bay phải', type: 'Khác' },
  'bp-7075(16).dat': { code: 'BP-7075', color: '(16)', name: 'Khung thân máy bay', type: 'Thanh' },
  'bp-7021(16).dat': { code: 'BP-7021', color: '(16)', name: 'Thanh dài 13 lỗ', type: 'Thanh' },
  'bp-7526a(16).dat': { code: 'BP-7526A', color: '(16)', name: 'Thanh 9 lỗ', type: 'Thanh' },
  'bp-7079(16).dat': { code: 'BP-7079', color: '(16)', name: 'Thanh khung đế', type: 'Thanh' },
  'bp-7525a(16).dat': { code: 'BP-7525A', color: '(06)', name: 'Thanh 7 lỗ', type: 'Thanh' },
  'bp-3976(16).dat': { code: 'BP-3976', color: '(16)', name: 'Khung 5×7', type: 'Thanh' },
  '32278.dat': { code: 'BP-7528', color: 'm', name: 'Thanh 15 lỗ', type: 'Thanh' },
  '32523.dat': { code: 'BP-7523A', color: '(12)', name: 'Thanh 3 lỗ', type: 'Thanh' },
  '2780.dat': { code: 'BP-7012', color: '(02)', name: 'Chốt đen', type: 'Chốt' },
  // 3673 (chốt xám không ma sát): khớp BP-7012 ×1,51 nhưng màu xám → BP-7015, kit có đúng 8 = số dùng trong mô hình
  '3673.dat': { code: 'BP-7015', color: 'a', name: 'Chốt xám', type: 'Chốt' },
  '6558.dat': { code: 'BP-7011', color: '(09)', name: 'Chốt dài xanh dương', type: 'Chốt' },
  // 32556 (chốt dài không ma sát, màu be): BP-7011 ×1,40 nhưng màu be → BP-7014 "t"
  '32556.dat': { code: 'BP-7014', color: 't', name: 'Chốt dài màu be', type: 'Chốt' },
  '43093.dat': { code: 'BP-7013', color: '(09)', name: 'Chốt trục xanh dương', type: 'Chốt' },
  // 32054 (chốt dài có bạc): io2rbb không dò được ?
  '32054.dat': { code: 'BP-7009', color: '(01)', name: 'Chốt trục xám', type: 'Chốt' },
  '87082.dat': { code: 'BP-7549', color: 'B', name: 'Chốt có lỗ ngang', type: 'Chốt' },
  '48989.dat': { code: 'BP-7006', color: '(01)', name: 'Khối nối 4 chốt', type: 'Chốt' },
  '99773.dat': { code: 'BP-7080', color: '(01)', name: 'Khớp chốt xám', type: 'Chốt' },
  '4519.dat': { code: 'BP-3991', color: '(01)', name: 'Trục 3', type: 'Trục' },
  '87083.dat': { code: 'BP-7090', color: '(03)', name: 'Trục 4 có gờ chặn', type: 'Trục' },
  '3707.dat': { code: 'BP-7630', color: '(02)', name: 'Trục 8 đen', type: 'Trục' },
  '60485.dat': { code: 'BP-3994', color: 'H', name: 'Trục 9', type: 'Trục' },
  '3737.dat': { code: 'BP-7631', color: '(02)', name: 'Trục 10 đen', type: 'Trục' },
  '3713.dat': { code: 'BP-7023', color: '(01)', name: 'Bạc chặn trục', type: 'Trục' },
  '4265c.dat': { code: 'BP-7024', color: '(12)', name: 'Bạc nửa', type: 'Trục' },
  '32013.dat': { code: 'BP-7027', color: '(02)', name: 'Khớp góc', type: 'Khớp nối' },
  '32034.dat': { code: 'BP-7030', color: '(02)', name: 'Khớp nối thẳng', type: 'Khớp nối' },
  '6538c.dat': { code: 'BP-7099', color: '(02)', name: 'Khớp nối trục', type: 'Khớp nối' },
  '32184.dat': { code: 'BP-7001', color: '(16)', name: 'Khối nối trục 3 lỗ', type: 'Khớp nối' },
  // 62462 (khớp nối tròn 2 lỗ): BP-7093 ×1,48 nhưng kit chỉ có 2, mô hình dùng 4 ?
  '62462.dat': { code: 'BP-7093', color: '(01)', name: 'Khớp nối tròn', type: 'Khớp nối' },
  // 60483 (thanh 1×2 có lỗ trục, tay quay): io2rbb thiếu hình gốc, chưa dò được ?
  '60483.dat': { code: 'BP-7022', color: '(02)', name: 'Tay quay 2 lỗ', type: 'Thanh' },
  '3648.dat': { code: 'BP-7047', color: '(03)', name: 'Bánh răng 24 răng', type: 'Bánh răng' },
  '10928.dat': { code: 'BP-7054', color: '(03)', name: 'Bánh răng 8 răng', type: 'Bánh răng' },
  '4716.dat': { code: 'BP-7050', color: '(01)', name: 'Trục vít', type: 'Bánh răng' }
};

module.exports = {
  parts,
  colors: { ...bai9.colors, M: 'trắng', a: 'xám', t: 'be' },
  rgb: { ...bai9.rgb, M: [235, 235, 230], a: [159, 164, 168], t: [222, 198, 156] }
};
