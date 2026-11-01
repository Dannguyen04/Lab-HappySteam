// Sinh supabase/seed/lessons.sql từ danh mục js/catalog.js.
// Chạy: npm run gen:seed
//
// catalog.js là script trình duyệt (gắn vào window.ZM_CATALOG), nên được nạp bằng vm với một window giả.
// Mỗi bài: id = lop{khối}-bai{tuần 2 chữ số}, week = số thứ tự bài trong năm (no), type lấy từ catalog.
// current_version = 1 nếu bài có thư mục content/lop{khối}/bai{tuần}, hoặc có trong js/lessons.js, hoặc có href; còn lại null ("Sắp có").
// Trùng (grade, week) vi phạm unique của bảng lessons: giữ bản đầu tiên, bỏ bản sau và cảnh báo ra console.

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const CATALOG = path.join(ROOT, 'js', 'catalog.js');
const LESSONS_JS = path.join(ROOT, 'js', 'lessons.js');
const OUT_DIR = path.join(ROOT, 'supabase', 'seed');
const OUT = path.join(OUT_DIR, 'lessons.sql');

const ALLOWED_TYPES = ['model', 'project', 'showcase', 'theory', 'test'];

function loadCatalog() {
  const win = {};
  vm.runInNewContext(fs.readFileSync(CATALOG, 'utf8'), { window: win }, { filename: CATALOG });
  if (!win.ZM_CATALOG || !Array.isArray(win.ZM_CATALOG.lessons)) {
    throw new Error('js/catalog.js không xuất window.ZM_CATALOG.lessons');
  }
  return win.ZM_CATALOG.lessons;
}

function sqlText(s) {
  return "'" + String(s).replace(/'/g, "''") + "'";
}

function sqlInt(n) {
  return n === null || n === undefined ? 'null' : String(Number(n));
}

function main() {
  const catalog = loadCatalog();
  const registry = fs.existsSync(LESSONS_JS) ? fs.readFileSync(LESSONS_JS, 'utf8') : '';

  const seen = new Map(); // "grade-week" -> id đã giữ
  const rows = [];
  let skipped = 0;

  for (const lesson of catalog) {
    const id = `lop${lesson.grade}-bai${String(lesson.no).padStart(2, '0')}`;
    const key = `${lesson.grade}-${lesson.no}`;

    if (!ALLOWED_TYPES.includes(lesson.type)) {
      console.warn(`[CẢNH BÁO] ${id}: kiểu "${lesson.type}" không hợp lệ, bỏ qua bài này.`);
      skipped++;
      continue;
    }
    if (seen.has(key)) {
      console.warn(`[CẢNH BÁO] ${id} trùng (grade, week) với ${seen.get(key)} (khối ${lesson.grade}, tuần ${lesson.no}); bỏ bản này.`);
      skipped++;
      continue;
    }
    seen.set(key, id);

    const contentDir = path.join(ROOT, 'content', `lop${lesson.grade}`, `bai${String(lesson.no).padStart(2, '0')}`);
    const inContent = fs.existsSync(contentDir);
    const inJs = registry.includes(`'${id}'`) || registry.includes(`"${id}"`);
    const hasHref = Boolean(lesson.href);
    const currentVersion = inContent || inJs || hasHref ? 1 : null;

    rows.push({
      id,
      grade: lesson.grade,
      term: lesson.term,
      week: lesson.no,
      title: lesson.title,
      type: lesson.type,
      currentVersion,
    });
  }

  rows.sort((a, b) => a.grade - b.grade || a.week - b.week);

  const values = rows.map(
    (r) =>
      `  (${sqlText(r.id)}, ${sqlInt(r.grade)}, ${sqlInt(r.term)}, ${sqlInt(r.week)}, ${sqlText(r.title)}, ${sqlText(r.type)}, ${sqlInt(r.currentVersion)})`
  );

  const sql = [
    '-- Sinh bởi scripts/gen-lessons-seed.js từ js/catalog.js. Không sửa tay; chạy lại: npm run gen:seed',
    `-- ${rows.length} bài${skipped ? `, bỏ ${skipped} bản trùng/không hợp lệ` : ''}.`,
    '',
    'insert into public.lessons (id, grade, term, week, title, type, current_version) values',
    values.join(',\n'),
    'on conflict (id) do update set',
    '  grade = excluded.grade,',
    '  term = excluded.term,',
    '  week = excluded.week,',
    '  title = excluded.title,',
    '  type = excluded.type,',
    '  current_version = excluded.current_version;',
    '',
  ].join('\n');

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(OUT, sql, 'utf8');
  console.log(`Đã ghi ${rows.length} bài vào ${path.relative(ROOT, OUT)}${skipped ? ` (bỏ ${skipped} bản)` : ''}.`);
}

main();
