// Tạo dữ liệu 3D Lớp 1 · Bài 2 – Động cơ (content/lop1/bai02/build.json) từ mô hình RoboBuilder dựng lại từ sách PDF.
// Nguồn: RBB_Studio/pdf2rbb/out/bai2/Bai2_dong_co.rbb (Codex, 14/14 bước IoU ≥ 0,85) → scripts/rbb2content.js,
// rồi thêm tên tiếng Việt, bộ truyền cho sa bàn và hình gói sáng tạo. Vị trí là giả thuyết: chờ kiểm trên kit thật.
// Hệ trục mô hình: trục bánh sau theo X, xe dài theo Z; đuôi (động cơ, bánh lớn) ở −Z, mũi (tay đòn, bánh nhỏ) ở +Z.
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const cad = require('./lib/cad-lesson');
const lib = require('./lib/kit-library');
const { convert } = require('./rbb2content');
const bai9 = require('./bai9-parts');

const ROOT = path.join(__dirname, '..');
const STUDIO = path.resolve(process.env.RBB_STUDIO || path.join(ROOT, '..', 'RBB_Studio'));
const rbbFile = path.join(STUDIO, 'pdf2rbb', 'out', 'bai2', 'Bai2_dong_co.rbb');
const rbb = require(path.join(STUDIO, 'pdf2rbb', 'lib', 'rbb.cjs'));
const { data, meshRefs } = convert(rbb.read(fs.readFileSync(rbbFile)), {
  label: 'Bài 2',
  source: 'Bài 2 – Động cơ: dựng lại từ sách lắp PDF 14 bước (pdf2rbb), 30 linh kiện; vị trí là giả thuyết, chờ kiểm trên kit thật',
  filename: path.basename(rbbFile)
});
const inst = data.instances;
if (inst.length !== 30) throw Error('Bài 2 phải có 30 linh kiện, đang có ' + inst.length);

// Tên tiếng Việt cho các mã có trong mô hình
const PARTS = {
  'BE-3581': ['Động cơ', 'Động cơ'],
  'BE-5158': ['Bộ não M5-RCU', 'Bộ điều khiển'],
  'BP-7523A': ['Thanh 3 lỗ', 'Thanh'],
  'BP-7525A': ['Thanh 7 lỗ', 'Thanh'],
  'BP-7021': ['Thanh 15 lỗ', 'Thanh'],
  'BP-8818': ['Khung đế 7×11', 'Thanh'],
  'BP-7012': ['Chốt đen', 'Chốt'],
  'BP-7549': ['Chốt có lỗ ngang', 'Chốt'],
  'BP-7553': ['Khớp nối chốt vuông góc', 'Chốt'],
  'BP-7006': ['Khối nối 4 chốt', 'Chốt'],
  'BP-3991': ['Trục 3', 'Trục'],
  'BP-7628': ['Trục 4', 'Trục'],
  'BP-8841': ['Vành bánh xe', 'Bánh xe'],
  'BP-8850': ['Lốp xe', 'Bánh xe'],
  'BP-7095': ['Bánh nhỏ', 'Bánh xe']
};
const labels = { types: {}, colors: bai9.colors, names: {}, defaults: {} };
for (const p of inst) {
  if (!PARTS[p.name]) throw Error('Chưa có tên tiếng Việt cho ' + p.name);
  [labels.names[p.name], labels.types[p.name]] = PARTS[p.name];
}

// Bộ truyền cho sa bàn: động cơ quay hai trục (trục 3 bên trái, trục 4 bên phải) và hai bánh lớn phía sau
const expect = { 5: 'BP-3991', 6: 'BP-7628', 7: 'BP-8841', 8: 'BP-8850', 9: 'BP-8841', 10: 'BP-8850' };
for (const [i, code] of Object.entries(expect)) if (inst[i].name !== code) throw Error('Bộ truyền: linh kiện ' + i + ' không phải ' + code);
const [h1, h2] = [7, 9].map(i => inst[i].pos);
const axis = h2.map((v, k) => v - h1[k]);
const len = Math.hypot(...axis);
const tyre = JSON.parse(fs.readFileSync(path.join(ROOT, meshRefs[inst[8].meshes[0]]), 'utf8'));
const drive = {
  output: {
    parts: [5, 6, 7, 8, 9, 10],
    point: h1.map((v, k) => +((v + h2[k]) / 2).toFixed(6)),
    axis: axis.map(v => +(v / len).toFixed(6)),
    radius: +((tyre.hi[1] - tyre.lo[1]) / 2).toFixed(4) // lốp Ø50 mm
  }
};

// Chi tiết minh họa cho xưởng sáng tạo (không có trong sách), đơn vị mét, đáy y = 0, mũi xe hướng +Z.
// Là hình ý tưởng, không phải hình đúng từng linh kiện; màu theo linh kiện kit tương ứng.
const rgb = c => bai9.rgb[c].map(v => +(v / 255).toFixed(3));
const procMeshes = [];
const proc = (name, tris, color) => (procMeshes.push(cad.encodeMesh(tris, name, 'proc', color)), meshRefs.length + procMeshes.length - 1);
const box = (lo, hi) => cad.boxTris(lo, hi);
// Đĩa nằm trong mặt YZ (trục theo X) để làm bánh: discTris dựng đĩa trong mặt XY nên đổi trục x ↔ z
const wheelX = (c, r, w) => cad.discTris([c[2], c[1], c[0]], r, w, 28).map(({ point: [a, b, d], normal: [na, nb, nd] }) => ({ point: [d, b, a], normal: [nd, nb, na] }));
const creative = {
  // Cánh gió đuôi: tấm đen 90×3×24 mm trên hai cột 30 mm
  wing: [
    proc('wing-posts', [...box([-0.03, 0, -0.003], [-0.024, 0.03, 0.003]), ...box([0.024, 0, -0.003], [0.03, 0.03, 0.003])], rgb('(02)')),
    proc('wing-plate', box([-0.045, 0.03, -0.012], [0.045, 0.034, 0.012]), [0.9, 0.18, 0.15])
  ],
  // Bánh to: lốp Ø66 mm bọc ngoài bánh cũ (gốc đặt ở tâm trục, mỗi bên một cái)
  bigwheel: [proc('bigwheel-tyre', wheelX([0, 0, 0], 0.033, 0.018).map(t => ({ ...t, point: [t.point[0] - 0.009, t.point[1], t.point[2]] })), rgb('(16)'))],
  // Mũi xe nhọn: nêm trắng dài 40 mm thu nhỏ dần về phía trước
  nose: [proc('nose', [
    ...box([-0.02, 0, 0], [0.02, 0.012, 0.012]),
    ...box([-0.014, 0, 0.012], [0.014, 0.009, 0.024]),
    ...box([-0.008, 0, 0.024], [0.008, 0.006, 0.036]),
    ...box([-0.003, 0, 0.036], [0.003, 0.004, 0.042])
  ], rgb('(06)'))],
  // Đèn pha vàng hai bên + biển số đua trắng ở giữa
  lights: [
    proc('lights-lamps', [...box([-0.026, 0, 0], [-0.016, 0.01, 0.005]), ...box([0.016, 0, 0], [0.026, 0.01, 0.005])], [1, 0.82, 0.2]),
    proc('lights-plate', box([-0.012, 0, 0], [0.012, 0.014, 0.003]), [0.97, 0.97, 0.97])
  ]
};

const { refs, added } = lib.storeMeshes('alpha330', procMeshes);
const out = { ...data, labels, creative, drive, meshes: [...meshRefs, ...refs], kit: 'alpha330' };
const file = path.join(ROOT, 'content', 'lop1', 'bai02', 'build.json');
fs.writeFileSync(file, JSON.stringify(out));
console.log(`Bài 2: ${inst.length} linh kiện, ${data.steps} bước, ${out.meshes.length} hình (${added} hình sáng tạo mới)`);
data.warnings.forEach(w => console.log('  cảnh báo:', w));
console.log('  ' + path.relative(ROOT, file), (fs.statSync(file).size / 1024).toFixed(1), 'KiB');
