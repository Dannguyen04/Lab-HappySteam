// Tách dữ liệu 3D một bài thành: thư viện hình chi tiết dùng chung theo bộ kit + tệp build.json riêng của bài.
//   content/kits/<kit>/meshes/<tên>-<băm>.json   một hình (một chi tiết × một màu), dùng chung giữa các bài
//   content/kits/<kit>/parts.json                mục lục: "BP-7012|(02)" → { originalPart, meshes } (cho bài dựng từ .rbb)
//   content/<lop>/<bai>/build.json               mọi thứ còn lại của LESSON_3D_DATA; "meshes" là danh sách đường dẫn hình
// Tên tệp hình có mã băm nội dung → tệp không bao giờ đổi nội dung, trình duyệt giữ bộ nhớ đệm an toàn.
// Trình nạp phía trình duyệt: js/lesson-data.js (ghép lại đúng y LESSON_3D_DATA cũ).
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const ROOT = path.resolve(__dirname, '..', '..');
// Lớp 1 và Lớp 3 cùng kit ZM Alpha Set A = Alpha 330 (mã JMC-NY-2321AE, RoboBuilder set2321A)
const KIT_OF_GRADE = { 1: 'alpha330', 3: 'alpha330' };

const slug = name => name.replace(/\.dat\b/gi, '').replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '').toLowerCase();
const partKey = inst => inst.name + '|' + (inst.colorCode ?? '');
const indexFile = kit => path.join(ROOT, 'content', 'kits', kit, 'parts.json');

function meshRef(kit, mesh) {
  const json = JSON.stringify(mesh);
  const hash = crypto.createHash('sha1').update(json).digest('hex').slice(0, 8);
  return { ref: `content/kits/${kit}/meshes/${slug(mesh.name)}-${hash}.json`, json };
}

// Ghi các hình còn thiếu vào thư viện kit; trả về đường dẫn theo đúng thứ tự + số hình mới
function storeMeshes(kit, meshes) {
  let added = 0;
  const refs = meshes.map(mesh => {
    const { ref, json } = meshRef(kit, mesh);
    const file = path.join(ROOT, ref);
    if (!fs.existsSync(file)) {
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, json);
      added++;
    }
    return ref;
  });
  return { refs, added };
}

function readPartsIndex(kit) {
  const file = indexFile(kit);
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {};
}

// Thêm vào mục lục kit các chi tiết (mã + màu) chưa có; chi tiết đã có thì giữ nguyên (bài dựng trước thắng)
function indexParts(kit, instances, refs, from) {
  const index = readPartsIndex(kit);
  let added = 0;
  for (const inst of instances) {
    const key = partKey(inst);
    if (index[key]) continue;
    index[key] = { originalPart: inst.originalPart, meshes: inst.meshes.map(i => refs[i]), from };
    added++;
  }
  const sorted = Object.fromEntries(Object.keys(index).sort().map(k => [k, index[k]]));
  fs.mkdirSync(path.dirname(indexFile(kit)), { recursive: true });
  fs.writeFileSync(indexFile(kit), JSON.stringify(sorted, null, 1) + '\n');
  return added;
}

const kitOf = lesson => {
  const kit = KIT_OF_GRADE[Number(/^lop(\d+)\//.exec(lesson)?.[1])];
  if (!kit) throw new Error(`Chưa biết bộ kit của ${lesson}`);
  return kit;
};

// lesson: 'lop1/bai09' → ghi build.json + các hình còn thiếu trong thư viện kit + mục lục chi tiết. Trả về thống kê.
function writeLessonContent(lesson, data) {
  const kit = kitOf(lesson);
  const { refs, added } = storeMeshes(kit, data.meshes);
  indexParts(kit, data.instances, refs, lesson);
  const build = path.join(ROOT, 'content', lesson, 'build.json');
  fs.mkdirSync(path.dirname(build), { recursive: true });
  fs.writeFileSync(build, JSON.stringify({ ...data, kit, meshes: refs }));
  return { kit, build, meshes: refs.length, added, buildKiB: fs.statSync(build).size / 1024 };
}

// Ghi một mục vào mục lục kit (ví dụ chi tiết lấy hình RoboBuilder: originalPart "rbb:<mã>", frame "rbb")
function indexEntry(kit, key, entry) {
  const index = readPartsIndex(kit);
  index[key] = entry;
  const sorted = Object.fromEntries(Object.keys(index).sort().map(k => [k, index[k]]));
  fs.writeFileSync(indexFile(kit), JSON.stringify(sorted, null, 1) + '\n');
}

// Chỉ bổ sung chi tiết vào thư viện kit (ví dụ từ file .io của một bài chưa dựng): không tạo build.json
function writeKitParts(kit, instances, meshes, from) {
  const { refs, added } = storeMeshes(kit, meshes);
  return { added, indexed: indexParts(kit, instances, refs, from) };
}

module.exports = { writeLessonContent, writeKitParts, readPartsIndex, storeMeshes, indexEntry, KIT_OF_GRADE };
