// Chạy: node tests/rbb2content.test.js – bộ chuyển .rbb → content/ (scripts/rbb2content.js).
// Khứ hồi Bài 9: CAD → (io2rbb) .rbb → (rbb2content) phải ra đúng vị trí/phép quay như content/lop1/bai09 dựng thẳng từ CAD.
// Cần thư mục RBB_Studio (biến RBB_STUDIO hoặc ../RBB_Studio); không có thì bỏ qua (ví dụ trên máy CI).
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const STUDIO = path.resolve(process.env.RBB_STUDIO || path.join(ROOT, '..', 'RBB_Studio'));
const RBB = path.join(STUDIO, 'io2rbb/out/bai9/Bai9_thong_tin_lien_lac_vu_tru.rbb');
if (!fs.existsSync(RBB)) {
  console.log('BỎ QUA: không có RBB_Studio (' + STUDIO + ')');
  process.exit(0);
}

const { convert } = require('../scripts/rbb2content.js');
const rbb = require(path.join(STUDIO, 'pdf2rbb/lib/rbb.cjs'));
const { data, meshRefs, warnings } = convert(rbb.read(fs.readFileSync(RBB)));
const ref = JSON.parse(fs.readFileSync(path.join(ROOT, 'content/lop1/bai09/build.json'), 'utf8'));

assert.equal(data.instances.length, ref.instances.length, 'đủ 61 chi tiết');
assert.equal(data.steps, ref.steps, 'đủ 28 bước');
assert.deepEqual(warnings, [], 'không phải dùng hình màu khác');
for (const ref of meshRefs) assert.ok(fs.existsSync(path.join(ROOT, ref)), 'hình có trong thư viện kit: ' + ref);

const used = new Set();
let worstMm = 0, worstRot = 0;
for (const p of data.instances) {
  let best = -1, dist = Infinity;
  ref.instances.forEach((q, j) => {
    if (used.has(j) || q.originalPart !== p.originalPart) return;
    const d = Math.hypot(...p.pos.map((v, k) => v - q.pos[k]));
    if (d < dist) (dist = d), (best = j);
  });
  assert.ok(best >= 0, `tìm được chi tiết tương ứng cho ${p.name} ${p.originalPart}`);
  used.add(best);
  const q = ref.instances[best];
  assert.equal(p.step, q.step, `${p.name}: cùng bước`);
  assert.equal(p.colorCode, q.colorCode, `${p.name}: cùng màu`);
  worstMm = Math.max(worstMm, dist * 1000);
  worstRot = Math.max(worstRot, ...p.rotation.map((v, k) => Math.abs(v - q.rotation[k])));
}
assert.ok(worstMm < 0.01, 'lệch vị trí < 0,01 mm: ' + worstMm);
assert.ok(worstRot < 1e-4, 'lệch phép quay < 1e-4: ' + worstRot);

console.log(`PASS: .rbb → content/ – khứ hồi Bài 9: 61 chi tiết, 28 bước, lệch tối đa ${worstMm.toFixed(3)} mm, hình lấy từ thư viện kit.`);
