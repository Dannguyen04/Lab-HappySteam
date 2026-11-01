// Chạy: node tests/kit-library.test.js – dữ liệu 3D tách sang content/ (thư viện hình theo kit + build.json)
// ghép lại qua trình nạp js/lesson-data.js phải giống hệt js/data-bai-XX.js cũ (so bằng SHA-256 đã chốt ngày 2026-10-31,
// trước khi bỏ các tệp data-bai-XX.js). Sinh lại CAD làm đổi dữ liệu thì cập nhật mã băm ở đây sau khi kiểm tra bằng mắt.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');

const ROOT = path.resolve(__dirname, '..');
const LESSONS = {
  'lop1/bai03': 'e37f45a6821b7a0727911a40be8adb9ce9cb69da1fae07c68566fc79595530d7',
  'lop1/bai09': 'a1689c20d1f5279f763e298833cc58c850640ca253f28f76006437c7f1c57724',
  'lop1/bai10': '4aac0748bd58cd22461a93883dabc07208ba9045f0ac2fbeba4cb1ed235d1075',
  // Bài mới, chưa chốt mã băm (null): chỉ kiểm cách nạp + hình theo kit
  'lop1/bai02': null,
  'lop3/bai08': null,
  'lop1/bai11': null,
  'lop1/bai12': null,
  'lop1/bai13': null,
  'lop3/bai09': null,
  'lop3/bai10': null,
  'lop3/bai11': null
};

const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
// fetch giả: đọc tệp trong thư mục dự án, đếm số lần tải
function makeFetch(log) {
  return async url => {
    log.push(url);
    const file = path.join(ROOT, url);
    if (!fs.existsSync(file)) return { ok: false, status: 404 };
    return { ok: true, status: 200, json: async () => JSON.parse(fs.readFileSync(file, 'utf8')) };
  };
}

// Bài mới (có content/<lop>/<bai>/build.json) tự vào danh sách, không cần mã băm cố định
for (const lop of fs.readdirSync(path.join(ROOT, 'content')).filter(d => /^lop\d+$/.test(d))) {
  for (const bai of fs.readdirSync(path.join(ROOT, 'content', lop))) {
    const key = `${lop}/${bai}`;
    if (!(key in LESSONS) && fs.existsSync(path.join(ROOT, 'content', key, 'build.json'))) LESSONS[key] = null;
  }
}

(async () => {
  const kitFiles = new Set();
  for (const [lesson, sha256] of Object.entries(LESSONS)) {
    const fetched = [];
    const ctx = { window: {}, fetch: makeFetch(fetched) };
    vm.runInNewContext(read('js/lesson-data.js'), ctx);
    const data = await ctx.window.loadLesson3D(lesson);
    if (sha256) assert.equal(crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex'), sha256, `${lesson}: ghép lại giống hệt bản cũ`);
    assert.equal(ctx.window.LESSON_3D_DATA, data, `${lesson}: gán window.LESSON_3D_DATA`);
    const meshUrls = fetched.slice(1);
    assert.equal(new Set(meshUrls).size, meshUrls.length, `${lesson}: mỗi hình chỉ tải một lần`);
    for (const u of meshUrls) {
      assert.match(u, /^content\/kits\/alpha330\/meshes\/[a-z0-9-]+-[0-9a-f]{8}\.json$/, 'đường dẫn hình theo kit');
      kitFiles.add(u);
    }
    assert.ok(fs.statSync(path.join(ROOT, 'content', lesson, 'build.json')).size < 64 * 1024, `${lesson}: build.json nhỏ hơn 64 KiB`);
  }
  // Mục lục chi tiết (cho bài dựng từ .rbb): mọi hình nó trỏ tới phải có; hình trong kit = hình của các bài ∪ hình của mục lục
  const index = JSON.parse(read('content/kits/alpha330/parts.json'));
  for (const [key, part] of Object.entries(index)) {
    assert.ok(part.originalPart && part.meshes.length, `mục lục ${key}: có tệp CAD gốc và hình`);
    for (const ref of part.meshes) {
      assert.ok(fs.existsSync(path.join(ROOT, ref)), `mục lục ${key}: có hình ${ref}`);
      kitFiles.add(ref);
    }
  }
  const onDisk = fs.readdirSync(path.join(ROOT, 'content/kits/alpha330/meshes'));
  assert.equal(onDisk.length, kitFiles.size, 'thư viện kit không có hình thừa');

  const ctx = { window: {}, fetch: makeFetch([]) };
  vm.runInNewContext(read('js/lesson-data.js'), ctx);
  await assert.rejects(ctx.window.loadLesson3D('lop1/bai99'), /Không tải được content\/lop1\/bai99\/build\.json \(404\)/);

  console.log(`PASS: content/ – 3 bài ghép lại giống hệt dữ liệu cũ (+ ${Object.values(LESSONS).filter(v => !v).length} bài mới), thư viện alpha330 ${kitFiles.size} hình dùng chung (${Object.keys(index).length} mã+màu trong mục lục), báo lỗi khi thiếu bài.`);
})().catch(e => { console.error(e); process.exit(1); });
