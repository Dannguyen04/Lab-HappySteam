#!/usr/bin/env node
// Cổng kiểm tra bài học – chạy TRƯỚC khi giao việc / gửi duyệt, mất vài giây:
//   node scripts/check-lessons.js              – mọi bài trong js/lessons.js
//   node scripts/check-lessons.js lop1-bai11   – một hoặc vài bài
// Lỗi (✗) làm lệnh thoát mã 1; lưu ý (!) chỉ để biết. Kiểm: file trang + 3D, mesh, số bước trang ↔ 3D,
// script nạp, cấu hình LESSON, khối lệnh có thật, ảnh sách từng bước có trên đĩa, test riêng, lesson.json khớp.
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const has = p => fs.existsSync(path.join(ROOT, p));
const read = p => fs.readFileSync(path.join(ROOT, p), 'utf8');
// Vite chỉ đưa lên mạng các thư mục này (vite.config.js) – file ngoài đó chạy được trên máy nhưng 404 trên GitHub Pages
const DEPLOYED = ['js/', 'content/', 'css/', 'assets/', 'references/official/'];
const deployed = p => DEPLOYED.some(d => p.startsWith(d));

function registry() {
  const ctx = { window: {} };
  vm.runInNewContext(read('js/lessons.js'), ctx);
  return ctx.window.ZM_LESSONS;
}
function blockTemplates() {
  const ctx = { window: {}, document: {} };
  vm.runInNewContext(read('js/blocks-engine.js'), ctx);
  return ctx.window.BLOCK_TEMPLATES;
}

async function checkLesson(id, entry, T) {
  const err = [], warn = [], info = {};
  const c = entry.content;
  // 1. Trang và mô hình 3D
  if (!has(`content/${c}/page.html`)) err.push(`thiếu content/${c}/page.html`);
  if (!has(`content/${c}/build.json`)) err.push(`thiếu content/${c}/build.json (mô hình 3D)`);
  let model = null;
  if (has(`content/${c}/build.json`)) {
    try {
      const build = JSON.parse(read(`content/${c}/build.json`));
      const missing = (build.meshes || []).filter(m => !has(m));
      if (missing.length) err.push(`${missing.length} mesh không có trên đĩa: ${missing.slice(0, 3).join(', ')}`);
      else {
        const ctx = { window: {}, Math };
        model = await require('../tests/helpers/lesson-3d')(ctx, c).then(() => ctx.window.LESSON_3D_DATA);
      }
    } catch (e) {
      err.push('không nạp được 3D: ' + e.message);
    }
  }
  if (model) {
    info.parts = model.instances.length;
    info.steps = model.steps;
    if (!model.instances.length) err.push('mô hình 3D không có linh kiện');
    const unnamed = new Set(model.instances.map(p => p.name).filter(n => !(model.labels && model.labels.names && model.labels.names[n])));
    if (unnamed.size) warn.push(`${unnamed.size} mã chưa có tên tiếng Việt: ${[...unnamed].slice(0, 4).join(', ')}`);
    const empty = [];
    for (let s = 1; s <= model.steps; s++) if (!model.instances.some(p => p.step === s || (p.joins && p.joins.includes(s)))) empty.push(s);
    if (empty.length > 1) warn.push(`các bước không có linh kiện mới: ${empty.join(', ')}`);
    if (has(`content/${c}/page.html`)) {
      const max = /id="slider"[^>]*max="(\d+)"/.exec(read(`content/${c}/page.html`));
      if (max && +max[1] !== model.steps) err.push(`page.html ghi ${max[1]} bước nhưng 3D có ${model.steps} bước`);
    }
  }
  // Mọi đường dẫn trong page.html phải có thật và nằm trong thư mục được deploy
  if (has(`content/${c}/page.html`)) {
    for (const [, url] of read(`content/${c}/page.html`).matchAll(/(?:src|href)="([^"#?]+)/g)) {
      if (/^(https?:|data:|mailto:|\/\/)/.test(url)) continue;
      if (!has(url)) err.push(`page.html trỏ tới file không có: ${url}`);
      else if (!deployed(url)) err.push(`page.html trỏ ra ngoài thư mục được deploy (404 trên GitHub Pages): ${url}`);
    }
  }
  // 2. Script nạp theo thứ tự
  const optional = new Set(entry.optional || []);
  for (const s of entry.order) if (!optional.has(s) && !has(s)) err.push('thiếu script ' + s);
  const art = (entry.optional || []).find(s => /art\.js$/.test(s));
  if (art && !has(art)) warn.push('chưa có hình vẽ cảnh ' + art + ' (đang dùng hình đơn giản)');
  // 3. Cấu hình LESSON
  const lessonFile = entry.scripts[0];
  let L = null;
  try {
    const ctx = { window: {}, Proxy, Math };
    vm.runInNewContext(read(lessonFile), ctx);
    L = ctx.window.LESSON;
  } catch (e) {
    err.push(`không chạy được ${lessonFile}: ${e.message}`);
  }
  if (L) {
    if (L.id !== id) err.push(`LESSON.id là "${L.id}", sổ đăng ký là "${id}"`);
    const name = b => (Array.isArray(b) ? b[0] : b);
    const engineSrc = entry.scripts.map(s => (has(s) ? read(s) : '')).join('\n');
    // Khối bài tự thêm vào BLOCK_TEMPLATES: chạy được, nhưng nên chuyển vào blocks-engine để bài khác dùng chung
    const local = new Set([...engineSrc.matchAll(/BLOCK_TEMPLATES\.(\w+)\s*=/g)].map(m => m[1]));
    const used = [...(L.blocks?.sample || []), ...(L.blocks?.toolbox || []), ...(L.blocks?.pro || [])].map(name);
    const bad = used.filter(b => !T[b] && !local.has(b));
    if (bad.length) err.push('khối không có trong blocks-engine: ' + [...new Set(bad)].join(', '));
    if (local.size) warn.push('khối khai báo riêng trong bài (nên chuyển vào blocks-engine): ' + [...local].join(', '));
    if (!(L.blocks?.sample || []).length) err.push('chưa có chương trình mẫu (blocks.sample)');
    if (L.Engine && !new RegExp(`window\\.${L.Engine}\\s*=`).test(engineSrc)) err.push(`không thấy window.${L.Engine} trong script của bài`);
    info.base = /extends window\.LessonEngine/.test(engineSrc) ? 'chung' : 'riêng';
    info.sceneKit = /ZMSceneKit\.create/.test(engineSrc) ? 'chung' : 'riêng';
    for (const k of [...(L.missions?.core || []), ...(L.missions?.pro || [])]) if (!L.cards?.[k]) err.push(`nhiệm vụ ${k} chưa có thẻ (cards.${k})`);
    // 4. Ảnh sách từng bước
    if (model && typeof L.book === 'function') {
      const lost = [], offline = new Set();
      for (let s = 1; s <= model.steps; s++) {
        const st = (model.stepInfo && model.stepInfo[s - 1]) || {};
        let b;
        try {
          b = L.book({ step: s, page: st.page || s, total: model.steps, ...st });
        } catch (e) {
          err.push(`book() lỗi ở bước ${s}: ${e.message}`);
          break;
        }
        for (const src of new Set([b.src, b.pdf].filter(Boolean))) {
          const file = String(src).split('#')[0];
          if (/^(https?:|data:)/.test(file)) continue;
          if (!has(file)) lost.push(s);
          else if (!deployed(file)) offline.add(file.replace(/\/[^/]*$/, '/'));
        }
      }
      if (offline.size) err.push(`ảnh/PDF sách nằm ngoài thư mục được deploy, sẽ 404 trên GitHub Pages: ${[...offline].join(', ')}`);
      const uniq = [...new Set(lost)];
      if (uniq.length) err.push(`thiếu ảnh sách ở ${uniq.length}/${model.steps} bước (vd. ${L.book({ step: uniq[0], page: uniq[0], total: model.steps }).src})`);
    }
  }
  // 5. Test riêng và lesson.json
  const folder = path.basename(path.dirname(lessonFile));
  const named = [`tests/${id}.test.js`, `tests/${folder}.test.js`].some(has);
  const mentioned = fs.readdirSync(path.join(ROOT, 'tests')).some(f => /\.test\.js$/.test(f) && [`js/${folder}/`, entry.scripts[2]].some(k => read('tests/' + f).includes(k)));
  if (!named && !mentioned) err.push(`chưa có test riêng tests/${id}.test.js`);
  if (has(`content/${c}/lesson.json`)) {
    const g = require('./new-lesson.js');
    const S = g.load(id);
    if (read(`content/${c}/page.html`) !== g.page(S)) err.push('page.html lệch với lesson.json – chạy node scripts/new-lesson.js ' + id);
  }
  return { id, err, warn, info };
}

(async () => {
  const R = registry(), T = blockTemplates();
  const ids = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(R);
  let bad = 0;
  for (const id of ids) {
    if (!R[id]) {
      console.log(`✗ ${id}: chưa đăng ký trong js/lessons.js`);
      bad++;
      continue;
    }
    const r = await checkLesson(id, R[id], T);
    const i = r.info;
    const head = `${r.err.length ? '✗' : '✓'} ${id}` + (i.steps ? ` · ${i.parts} linh kiện/${i.steps} bước` : '') + (i.base ? ` · engine ${i.base}, cảnh ${i.sceneKit}` : '');
    console.log(head);
    for (const e of r.err) console.log('    ✗ ' + e);
    for (const w of r.warn) console.log('    ! ' + w);
    if (r.err.length) bad++;
  }
  console.log(`\n${ids.length - bad}/${ids.length} bài đạt cổng kiểm tra.`);
  process.exit(bad ? 1 : 0);
})();
