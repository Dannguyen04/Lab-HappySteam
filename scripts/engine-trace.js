#!/usr/bin/env node
// "Ảnh chụp hành vi" của một bộ mô phỏng – dùng khi chuyển engine sang js/lesson-engine.js mà không đổi cách chạy.
//   node scripts/engine-trace.js <id> > truoc.json     (trước khi sửa)
//   node scripts/engine-trace.js <id> > sau.json       (sau khi sửa)
//   node scripts/engine-trace.js --diff truoc.json sau.json   → "khác: 0" là đạt
// Chạy mọi chương trình (mẫu trong sách + vài chương trình chung) × chế độ Bé/Nâng cao × có/không gói nâng cấp,
// nhấn nút ở vài thời điểm, ghi lại sự kiện, khối đang chạy, nhiệm vụ, nhật ký và trạng thái cuối.
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const args = process.argv.slice(2);

if (args[0] === '--diff') {
  const [a, b] = args.slice(1).map(f => JSON.parse(fs.readFileSync(f, 'utf8')));
  let bad = 0;
  a.forEach((x, i) => {
    for (const k of Object.keys(x)) {
      const p = JSON.stringify(x[k]), q = JSON.stringify(b[i] && b[i][k]);
      if (p !== q && ++bad <= 5) console.log(`#${i} ${x.name} · ${k}\n  TRƯỚC ${p.slice(0, 300)}\n  SAU   ${q.slice(0, 300)}`);
    }
  });
  console.log(`khác: ${bad} (trên ${a.length} kịch bản)`);
  process.exit(bad ? 1 : 0);
}

const id = args[0];
const ctx0 = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'js/lessons.js'), 'utf8'), ctx0);
const entry = ctx0.window.ZM_LESSONS[id];
if (!entry) throw new Error('Chưa đăng ký bài ' + id);
const noop = () => {};
// Số ngẫu nhiên cố định (đặt lại đầu mỗi kịch bản) – bài có lũ/bão/vật cản ngẫu nhiên vẫn so được trước/sau
let seed = 1;
const MathSeeded = Object.create(Math);
MathSeeded.random = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
const el = () => ({ textContent: '', innerHTML: '', hidden: false, dataset: {}, style: {}, classList: { toggle: noop, add: noop, remove: noop }, setAttribute: noop, addEventListener: noop });
const ctx = {
  window: { addEventListener: noop, SFX: null }, Math: MathSeeded, JSON, Proxy, Set, Map, Number, String, Array, Object, Infinity, NaN, isFinite,
  document: { getElementById: () => null, querySelector: () => null, querySelectorAll: () => [], createElement: el, addEventListener: noop, body: el() },
  performance: { now: () => 0 }, requestAnimationFrame: () => 0, cancelAnimationFrame: noop, setTimeout: () => 0, clearTimeout: noop, console
};
ctx.window.window = ctx.window;
// Chỉ nạp phần logic: khối lệnh, cấu hình bài, lớp gốc (nếu có) và engine – không nạp cảnh/3D
const engineFile = entry.scripts[2];
for (const f of ['js/blocks-engine.js', entry.scripts[0], 'js/lesson-engine.js', engineFile])
  if (fs.existsSync(path.join(ROOT, f))) vm.runInNewContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx);
const L = ctx.window.LESSON, T = ctx.window.BLOCK_TEMPLATES, E = ctx.window[L.Engine];
const mk = s => (Array.isArray(s) ? { ...T[s[0]], ...s[1] } : { ...T[s] });
const programs = [
  ['mẫu trong sách', L.blocks.sample],
  ['lúc mở trang', L.blocks.empty || ['start']],
  ['nhanh 3 giây', ['start', 'highSpeed', ['wait', { duration: 3 }], 'motorStop']],
  ['chậm, đổi chiều', ['start', 'lowSpeed', ['wait', { duration: 2 }], 'motorReverse', ['wait', { duration: 2 }], 'motorStop']],
  ['lặp nhanh/dừng', ['start', 'repeatStart', 'highSpeed', ['wait', { duration: 1 }], 'motorStop', ['wait', { duration: 1 }], 'repeatEnd']],
  ['lặp rỗng', ['start', 'repeatStart', 'repeatEnd']],
  ['Motor Power 4', ['start', ['motorPower', { power: 4 }], ['wait', { duration: 5 }]]],
  ['chạy mãi', ['start', 'highSpeed', ['wait', { duration: 60 }]]]
];
const upgradeSets = [[], ...((L.creative && L.creative.presets) || []).slice(0, 2).map(p => [p.id]), ((L.creative && L.creative.presets) || []).map(p => p.id)];
const sortKeys = o => (Array.isArray(o) ? o.map(sortKeys) : o && typeof o === 'object' ? Object.keys(o).sort().reduce((r, k) => ((r[k] = sortKeys(o[k])), r), {}) : o);
const out = [];
for (const [name, prog] of programs)
  for (const adv of [false, true])
    for (const up of upgradeSets) {
      seed = 1 + out.length;
      const sim = new E('sim-canvas-2d');
      const ev = [], st = [];
      sim.onEvent = (t, d) => ev.push([t, d === undefined ? null : JSON.stringify(d)]);
      sim.onMissionUpdate = s => st.push(JSON.stringify(sortKeys(s)));
      sim.onActiveBlockUpdate = i => ev.push(['khối', i]);
      if (adv && sim.setAdvanced) sim.setAdvanced(true);
      if (sim.setUpgrades) sim.setUpgrades(up);
      if (sim.setAssemblyDone) sim.setAssemblyDone(true);
      sim.setProgram(prog.map(mk));
      sim.start();
      for (let i = 0; i < 1500; i++) {
        const t = i * 0.02;
        if (sim.press && [0.5, 1.5, 2.5, 3.5, 6, 12, 19, 21].some(p => Math.abs(t - p) < 0.01)) sim.press();
        sim.advance(0.02);
      }
      if (sim.checkMissions) sim.checkMissions();
      // Trạng thái cuối: mọi thuộc tính số/chữ/đúng-sai của engine (bỏ hàm, đối tượng DOM)
      const state = {};
      for (const [k, v] of Object.entries(sim)) if (['number', 'string', 'boolean'].includes(typeof v) && k !== 'rafId') state[k] = typeof v === 'number' ? +v.toFixed(6) : v;
      out.push({ name, adv, up, ev, st, logs: sim.logs, state, pose: sim.pose3d ? sortKeys(sim.pose3d()) : null });
    }

// Các ca biên trong duyệt chéo Phiếu 72. Giữ chung trong trace để cùng một
// kịch bản chạy được trên commit chuẩn và cây hiện tại.
const stateOf = sim => {
  const state = {};
  for (const [k, v] of Object.entries(sim))
    if (['number', 'string', 'boolean'].includes(typeof v) && k !== 'rafId')
      state[k] = typeof v === 'number' ? +v.toFixed(6) : v;
  return state;
};
const makeCase = (name, program) => {
  seed = 1 + out.length;
  const sim = new E('sim-canvas-2d');
  const ev = [], st = [];
  sim.onEvent = (t, d) => ev.push([t, d === undefined ? null : JSON.stringify(d)]);
  sim.onMissionUpdate = s => st.push(JSON.stringify(sortKeys(s)));
  sim.onActiveBlockUpdate = i => ev.push(['khối', i]);
  sim.setProgram(program.map(b => typeof b === 'string' || Array.isArray(b) ? mk(b) : { ...b }));
  if (sim.setAssemblyDone) sim.setAssemblyDone(true);
  return { name, sim, ev, st };
};
const saveCase = c => out.push({
  name: c.name, scenario: c.name, adv: false, up: [], ev: c.ev, st: c.st,
  logs: c.sim.logs, state: stateOf(c.sim), pose: c.sim.pose3d ? sortKeys(c.sim.pose3d()) : null
});
const step = (sim, count, dt = 0.02, untilStopped = false) => {
  for (let i = 0; i < count && (!untilStopped || sim.running); i++) sim.advance(dt);
};
const tap = sim => {
  if (sim.press) sim.press();
  if (sim.pressTouch) sim.pressTouch();
  else if (sim.putHand) sim.putHand();
};

for (const duration of [0.1, 0.4, 0.7, 1.4]) {
  const c = makeCase(`biên:chờ:${duration}`, ['start', { type: 'wait', duration }, 'stop']);
  c.sim.start();
  step(c.sim, 100, 0.02, true);
  saveCase(c);
}

{
  const c = makeCase('biên:nút-trước-khi-chạy-và-sau-khi-dừng', ['start', { type: 'wait', duration: 0.4 }, 'stop']);
  tap(c.sim);
  c.sim.advance(1.3); // nút phải tự hết hạn dù chương trình chưa chạy
  c.st.push(JSON.stringify({ phase: 'before-start', state: stateOf(c.sim) }));
  c.sim.start();
  step(c.sim, 1);
  c.sim.stop();
  tap(c.sim);
  c.sim.advance(1.3); // và cả sau khi chương trình đã dừng
  c.st.push(JSON.stringify({ phase: 'after-stop', state: stateOf(c.sim) }));
  saveCase(c);
}

{
  const c = makeCase('biên:chạy-lại-hai-lượt-liên-tiếp', ['start', { type: 'wait', duration: 0.7 }, 'stop']);
  c.sim.start();
  step(c.sim, 60, 0.02, true);
  c.st.push(JSON.stringify({ phase: 'run-1', state: stateOf(c.sim) }));
  c.sim.start();
  step(c.sim, 60, 0.02, true);
  c.st.push(JSON.stringify({ phase: 'run-2', state: stateOf(c.sim) }));
  saveCase(c);
}

{
  const c = makeCase('biên:dừng-giữa-khối-chờ-cảm-biến', ['start', { type: 'sensor_obstacle' }]);
  const sensorType = ['sensor_obstacle', 'wait_clear', 'sensor_touch'].find(type =>
    (c.sim.isConditionWait && c.sim.isConditionWait({ type })) ||
    (type === 'sensor_touch' && c.sim.touchTypes && c.sim.touchTypes.has(type))) || 'sensor_obstacle';
  c.sim.setProgram(['start', { type: sensorType }]);
  c.sim.start();
  // Đưa cảm biến ra xa vật cản để bảo đảm kịch bản thật sự đứng trong trạng thái chờ.
  if (typeof c.sim.x === 'number') c.sim.x = -1000;
  step(c.sim, 5, 0.02, true);
  c.st.push(JSON.stringify({ phase: 'waiting', state: stateOf(c.sim) }));
  c.sim.stop();
  c.sim.advance(0.02);
  c.st.push(JSON.stringify({ phase: 'stopped', state: stateOf(c.sim) }));
  saveCase(c);
}

{
  const c = makeCase('biên:giới-hạn-thời-gian-cuối-khối', ['start', { type: 'wait', duration: 36 }, 'stop']);
  c.sim.start();
  step(c.sim, 1810, 0.02, true);
  saveCase(c);
}
process.stdout.write(JSON.stringify(out));
