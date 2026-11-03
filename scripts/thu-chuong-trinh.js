#!/usr/bin/env node
// Chạy thử các chương trình mẫu đúng/sai của một bài trên bộ mô phỏng thật (không cần trình duyệt).
//   node scripts/thu-chuong-trinh.js lop1-bai09          → bảng kết quả, thoát 1 nếu ca nào khác điều mong đợi
//   node scripts/thu-chuong-trinh.js lop1-bai09 --md     → bảng Markdown để dán vào tài liệu
// Danh sách ca: content/<bài>/mau-lap-trinh.json (dữ liệu, không có code riêng của bài).
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const [id, flag] = process.argv.slice(2);
if (!id) throw new Error('Cách dùng: node scripts/thu-chuong-trinh.js <id bài> [--md]');

const reg = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'js/lessons.js'), 'utf8'), reg);
const entry = reg.window.ZM_LESSONS[id];
if (!entry) throw new Error('Chưa đăng ký bài ' + id);
const caseFile = path.join(ROOT, 'content', entry.content, 'mau-lap-trinh.json');
const { cases } = JSON.parse(fs.readFileSync(caseFile, 'utf8'));

const noop = () => {};
const el = () => ({ textContent: '', innerHTML: '', hidden: false, dataset: {}, style: {}, classList: { toggle: noop, add: noop, remove: noop }, setAttribute: noop, addEventListener: noop });
const ctx = {
  window: { addEventListener: noop, SFX: null }, Math, JSON, Proxy, Set, Map, Number, String, Array, Object, Infinity, NaN, isFinite,
  document: { getElementById: () => null, querySelector: () => null, querySelectorAll: () => [], createElement: el, addEventListener: noop, body: el() },
  performance: { now: () => 0 }, requestAnimationFrame: () => 0, cancelAnimationFrame: noop, setTimeout: () => 0, clearTimeout: noop, console
};
ctx.window.window = ctx.window;
for (const f of ['js/blocks-engine.js', entry.scripts[0], 'js/lesson-engine.js', entry.scripts[2]])
  if (fs.existsSync(path.join(ROOT, f))) vm.runInNewContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx);
const L = ctx.window.LESSON, T = ctx.window.BLOCK_TEMPLATES, E = ctx.window[L.Engine];
const mk = s => (Array.isArray(s) ? { ...T[s[0]], ...s[1] } : { ...T[s] });
const label = s => {
  const b = mk(s);
  const base = b.label || b.name || b.type;
  if (b.type === 'wait') return `${base} ${b.duration}s`;
  if (b.type === 'motor_power') return `${base} ${b.power}`;
  return base;
};

let bad = 0;
const rows = cases.map(c => {
  const sim = new E('sim-canvas-2d');
  const events = [];
  let missions = {};
  sim.onEvent = (t, d) => events.push(d === undefined ? t : `${t}:${typeof d === 'object' ? JSON.stringify(d) : d}`);
  sim.onMissionUpdate = s => (missions = s);
  sim.onActiveBlockUpdate = noop;
  if (sim.setAssemblyDone) sim.setAssemblyDone(true);
  sim.setProgram(c.program.map(mk));
  sim.start();
  const dt = 0.02;
  for (let t = 0; t < (c.seconds || 10); t += dt) sim.advance(dt);
  if (sim.checkMissions) sim.checkMissions();
  const got = {
    m2: !!missions.m2,
    m3: !!missions.m3,
    crash: events.some(e => e.startsWith('crash')),
    method: missions.avoidanceMethod || null,
    deg: sim.headingDegrees ? Math.round(sim.headingDegrees()) : null,
    rev: typeof sim.rev === 'number' ? +sim.rev.toFixed(2) : null,
    running: !!sim.running
  };
  const diff = Object.entries(c.expect || {}).filter(([k, v]) => got[k] !== v).map(([k, v]) => `${k}: mong ${v}, ra ${got[k]}`);
  if (diff.length) bad++;
  return { c, got, diff, logs: sim.logs.map(l => l.msg || l.text || l.message || JSON.stringify(l)) };
});

const yes = b => (b ? '✅' : '—');
if (flag === '--md') {
  console.log('| Ca | Chương trình | Kết quả trên robot ảo | NV2 | NV3 | Đúng như mong đợi |');
  console.log('|---|---|---|---|---|---|');
  for (const { c, got, diff } of rows) {
    const what = `${got.crash ? 'đụng thiên thạch' : 'không đụng'}; dừng ở ${got.deg}° (${got.rev} vòng)${got.method ? '; tránh bằng ' + (got.method === 'reverse' ? 'đảo chiều' : 'Melody B + dừng') : ''}`;
    console.log(`| ${c.kind === 'dung' ? '✔ Đúng' : '✘ Sai'}: ${c.title} | ${c.program.map(label).join(' → ')} | ${what} | ${yes(got.m2)} | ${yes(got.m3)} | ${diff.length ? '❌ ' + diff.join('; ') : '✅'} |`);
  }
} else {
  for (const { c, got, diff, logs } of rows) {
    console.log(`\n[${c.kind.toUpperCase()}] ${c.title}  ${diff.length ? '❌ ' + diff.join('; ') : '✓ như mong đợi'}`);
    console.log('  ' + c.program.map(label).join(' → '));
    console.log('  ' + JSON.stringify(got));
    for (const l of logs.slice(0, 8)) console.log('    · ' + l);
  }
}
console.log(`\n${rows.length - bad}/${rows.length} ca đúng như mong đợi`);
process.exit(bad ? 1 : 0);
