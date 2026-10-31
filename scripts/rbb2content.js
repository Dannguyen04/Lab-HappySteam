// Chuyển một dự án RoboBuilder (.rbb, ví dụ do RBB_Studio/pdf2rbb dựng từ sách PDF) thành dữ liệu bài học trong content/,
// dùng hình chi tiết CAD có sẵn trong thư viện kit (không dùng hình của RoboBuilder).
//
// Chạy: node scripts/rbb2content.js <file.rbb> <lop1/bai02> [--label "Bài 2"] [--source "..."] [--dry]
//   RBB_STUDIO=<thư mục RBB_Studio> (mặc định ../RBB_Studio) – lấy bộ đọc .rbb và bảng ghép mã io2rbb/out/*/match.json.
//
// Phép đổi (xem RBB_Studio/io2rbb/lib/build.cjs):
//   io2rbb:  R_rbb = F·R_L·F·Q,   pos_rbb(mm) = F·R_L·F·t + 0,5·F·p_L
//   content: rot   = F·R_L·F,     pos(m)      = 0,0005·F·p_L  rồi căn giữa X/Z, đáy Y = 0 (scripts/lib/cad-lesson.js)
//   ⇒ rot = R_rbb·Qᵀ,  pos = (pos_rbb − rot·t)/1000, cùng cách căn giữa.
// Q, t của mỗi chi tiết CAD lấy từ bảng ghép io2rbb; hình lấy từ mục lục chi tiết của kit (content/kits/<kit>/parts.json).
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const STUDIO = path.resolve(process.env.RBB_STUDIO || path.join(ROOT, '..', 'RBB_Studio'));

// Ma trận 3×3: row = theo hàng (io2rbb), col = theo cột (core.js của RBB Studio và content/)
const rowFromCol = c => [c[0], c[3], c[6], c[1], c[4], c[7], c[2], c[5], c[8]];
const colFromRow = rowFromCol;
const mulRow = (A, B) => [0, 1, 2].flatMap(r => [0, 1, 2].map(c => A[r * 3] * B[c] + A[r * 3 + 1] * B[3 + c] + A[r * 3 + 2] * B[6 + c]));
const vecRow = (A, v) => [0, 1, 2].map(r => A[r * 3] * v[0] + A[r * 3 + 1] * v[1] + A[r * 3 + 2] * v[2]);
const transposeRow = rowFromCol;
const round = (v, d = 6) => { const r = +v.toFixed(d); return Object.is(r, -0) ? 0 : r; };

// Chỉ mục chi tiết của kit: "BP-7012|(02)" → { originalPart, meshes } (content/kits/<kit>/parts.json, scripts/lib/kit-library.js)
function kitIndex(kit) {
  return new Map(Object.entries(require('./lib/kit-library').readPartsIndex(kit)));
}

// Chi tiết chưa có hình CAD: lấy hình RoboBuilder (RBB_Studio/assets/parts/<mã>.js – được phép dùng mọi nơi),
// tô màu theo mã màu, ghi vào thư viện kit + mục lục với frame "rbb" (hình đã ở hệ trục riêng RoboBuilder → Q = I, t = 0).
function roboBuilderPart(kit, code, colorCode) {
  const file = path.join(STUDIO, 'assets', 'parts', code + '.js');
  if (!fs.existsSync(file)) return null;
  let asset;
  require('node:vm').runInNewContext(fs.readFileSync(file, 'utf8'), { window: { RBB_ASSETS: { register: (_, a) => (asset = a) } } });
  const variant = asset && asset.variants && (asset.variants[''] || Object.values(asset.variants)[0]);
  if (!variant || !variant.meshes.length) return null;
  const rgb = colorCode && require('./bai9-parts').rgb[colorCode];
  const meshes = variant.meshes.map(m => ({
    ...m,
    name: 'rbb-' + code + '/' + (colorCode ?? m.material),
    ...(rgb && variant.meshes.length === 1 ? { color: rgb.map(v => +(v / 255).toFixed(3)), material: colorCode } : {})
  }));
  const lib = require('./lib/kit-library');
  const { refs } = lib.storeMeshes(kit, meshes);
  const entry = { originalPart: 'rbb:' + code, meshes: refs, from: 'RoboBuilder', frame: 'rbb' };
  lib.indexEntry(kit, code + '|' + (colorCode ?? ''), entry);
  return entry;
}

// Bảng ghép io2rbb: tệp LDraw → [{code, Q (theo hàng), t (mm)}]
function matchTables() {
  const out = new Map();
  const dir = path.join(STUDIO, 'io2rbb', 'out');
  for (const lesson of fs.readdirSync(dir)) {
    const file = path.join(dir, lesson, 'match.json');
    if (!fs.existsSync(file)) continue;
    for (const [ldraw, m] of Object.entries(JSON.parse(fs.readFileSync(file, 'utf8'))))
      if (m && m.candidates && !out.has(ldraw)) out.set(ldraw, m.candidates);
  }
  return out;
}

function convert(project, options = {}) {
  const core = require(path.join(STUDIO, 'core.js'));
  const kit = options.kit || 'alpha330';
  const index = kitIndex(kit);
  const tables = matchTables();
  const { records, steps } = core.normalize(project, options.filename || 'model.rbb');
  const warnings = [];

  const placed = records.map((r, i) => {
    const key = r.name + '|' + (r.colorCode ?? '');
    let part = index.get(key) || [...index.entries()].find(([k]) => k.startsWith(r.name + '|'))?.[1];
    if (part && !index.has(key)) warnings.push(`${key}: dùng hình màu khác (${part.from})`);
    if (!part && options.roboBuilderMeshes !== false) {
      part = roboBuilderPart(kit, r.name, r.colorCode ?? null);
      if (part) { index.set(key, part); warnings.push(`${key}: chưa có hình CAD – dùng hình RoboBuilder`); }
    }
    if (!part) throw Error(`Chi tiết ${key} (linh kiện ${i}) chưa có hình trong thư viện kit ${kit} và RoboBuilder`);
    const cand = part.frame === 'rbb' ? { Q: [1, 0, 0, 0, 1, 0, 0, 0, 1], t: [0, 0, 0] } : (tables.get(part.originalPart) || []).find(c => c.code === r.name);
    if (!cand) throw Error(`Bảng ghép io2rbb không có ${r.name} cho ${part.originalPart}`);
    const Rrbb = rowFromCol(r.rotation);
    const rot = mulRow(Rrbb, transposeRow(cand.Q));
    const posMm = r.pos.map(v => v * 1000);
    const raw = vecRow(rot, cand.t).map((v, k) => (posMm[k] - v) / 1000);
    return { r, part, rot, raw };
  });

  // Căn giữa giống cad-lesson: tâm X/Z và đáy Y theo gốc các chi tiết
  const lo = [0, 1, 2].map(k => Math.min(...placed.map(p => p.raw[k])));
  const hi = [0, 1, 2].map(k => Math.max(...placed.map(p => p.raw[k])));
  const shift = [-(lo[0] + hi[0]) / 2, -lo[1], -(lo[2] + hi[2]) / 2];

  const meshes = [], meshIndex = new Map();
  const meshIds = refs => refs.map(ref => {
    if (!meshIndex.has(ref)) { meshIndex.set(ref, meshes.length); meshes.push(ref); }
    return meshIndex.get(ref);
  });
  const instances = placed.map(({ r, part, rot, raw }) => ({
    name: r.name,
    colorCode: r.colorCode ?? null,
    originalPart: part.originalPart,
    step: r.step,
    rotation: colFromRow(rot).map(v => round(v)),
    pos: raw.map((v, k) => round(v + shift[k])),
    groupPath: r.groupPath,
    joins: r.joins,
    meshes: meshIds(part.meshes)
  }));

  return {
    data: {
      source: options.source || 'Dựng lại từ sách lắp PDF (pdf2rbb) – vị trí là giả thuyết, cần kiểm trên kit thật',
      label: options.label || '',
      textures: [],
      instances,
      steps: steps.length,
      stepDescriptions: steps.map(s => s.description || s.des || ''),
      stepInfo: steps.map((s, i) => ({ scope: s.scope || 'Main', group: s.group || '', sub: s.sub || 0, subCount: s.subCount || 0, joins: s.joins || [], page: i + 1 })),
      warnings,
      derivedFrom: 'rbb'
    },
    meshRefs: meshes,
    warnings
  };
}

// Ghi content/: build.json trỏ thẳng tới hình đã có trong thư viện kit (không sinh hình mới)
function writeFromRbb(lesson, result, kit = 'alpha330') {
  const file = path.join(ROOT, 'content', lesson, 'build.json');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const { data, meshRefs } = result;
  const out = {};
  for (const [k, v] of Object.entries(data)) out[k] = v;
  out.meshes = meshRefs;
  out.kit = kit;
  fs.writeFileSync(file, JSON.stringify(out));
  return file;
}

module.exports = { convert, writeFromRbb, kitIndex, matchTables };

if (require.main === module) {
  const args = process.argv.slice(2);
  const opt = name => { const i = args.indexOf(name); return i >= 0 ? args.splice(i, 2)[1] : undefined; };
  const label = opt('--label'), source = opt('--source');
  const dry = args.includes('--dry');
  const [rbbFile, lesson] = args.filter(a => a !== '--dry');
  if (!rbbFile || !lesson) {
    console.error('Cách dùng: node scripts/rbb2content.js <file.rbb> <lop1/bai02> [--label "Bài 2"] [--source "..."] [--dry]');
    process.exit(2);
  }
  const rbb = require(path.join(STUDIO, 'pdf2rbb', 'lib', 'rbb.cjs'));
  const project = rbb.read(fs.readFileSync(rbbFile));
  const result = convert(project, { label, source, filename: path.basename(rbbFile) });
  console.log(`${result.data.instances.length} chi tiết, ${result.data.steps} bước, ${result.meshRefs.length} hình từ thư viện kit`);
  result.warnings.forEach(w => console.log('  cảnh báo:', w));
  if (!dry) console.log('Đã ghi', writeFromRbb(lesson, result));
}
