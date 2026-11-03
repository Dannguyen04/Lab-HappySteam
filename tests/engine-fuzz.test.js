// Chạy: node tests/engine-fuzz.test.js [tên bài…] – thử ngẫu nhiên MỌI bộ mô phỏng bằng chương trình lộn xộn
// (khối trong khay của bài, Lặp đặt sai chỗ, Nếu thiếu cặp, thời gian Chờ lạ), chế độ Bé/Nâng cao, gói nâng cấp,
// nhấn nút bất chợt, dừng giữa chừng. Bất biến: không ném lỗi, không có số NaN/vô cực trong trạng thái,
// thời gian chạy không lùi, Dừng thì dừng hẳn, khối đang chạy luôn nằm trong chương trình,
// chương trình chỉ có Start không làm đạt nhiệm vụ lập trình (m2, m3).
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.join(__dirname, '..');
const only = process.argv.slice(2);
const reg = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'js/lessons.js'), 'utf8'), reg);

let seed = 7;
const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
const pick = a => a[Math.floor(rnd() * a.length)];
const MathSeeded = Object.create(Math);
MathSeeded.random = rnd;

function load(entry) {
  const noop = () => {};
  const el = () => ({ textContent: '', innerHTML: '', hidden: false, dataset: {}, style: {}, classList: { toggle: noop, add: noop, remove: noop, contains: () => false }, setAttribute: noop, addEventListener: noop, appendChild: noop, querySelector: () => null, querySelectorAll: () => [] });
  const ctx = {
    window: { addEventListener: noop, SFX: null }, Math: MathSeeded, JSON, Set, Map, Number, String, Array, Object, Infinity, NaN, isFinite, Proxy,
    document: { getElementById: () => null, querySelector: () => null, querySelectorAll: () => [], createElement: el, addEventListener: noop, body: el() },
    performance: { now: () => 0 }, requestAnimationFrame: () => 0, cancelAnimationFrame: noop, setTimeout: () => 0, clearTimeout: noop, console
  };
  ctx.window.window = ctx.window;
  for (const f of ['js/blocks-engine.js', entry.scripts[0], 'js/lesson-engine.js', entry.scripts[2]])
    if (fs.existsSync(path.join(ROOT, f))) vm.runInNewContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx);
  return ctx.window;
}

function numbersOf(sim) {
  const bad = [];
  for (const [k, v] of Object.entries(sim)) if (typeof v === 'number' && !Number.isFinite(v) && k !== 'best') bad.push(k + '=' + v);
  if (sim.pose3d) {
    const walk = (o, p) => {
      if (typeof o === 'number' && !Number.isFinite(o)) bad.push('pose3d.' + p + '=' + o);
      else if (o && typeof o === 'object') for (const k of Object.keys(o)) walk(o[k], p ? p + '.' + k : k);
    };
    walk(sim.pose3d(), '');
  }
  return bad;
}

function randomProgram(keys, T) {
  const body = keys.filter(k => k !== 'start');
  const n = 1 + Math.floor(rnd() * 9);
  const prog = [{ ...T.start }];
  for (let i = 0; i < n; i++) {
    const b = { ...T[pick(body)] };
    if (b.type === 'wait') b.duration = pick([0.2, 0.5, 1, 2, 3, 5]);
    if (b.type === 'motor_power') b.power = 1 + Math.floor(rnd() * 8);
    if (b.type === 'motor' && b.port) b.dir = pick(['cw', 'ccw']);
    if (b.type === 'motor' && rnd() < 0.3) b.speed = pick(['low', 'medium', 'high']);
    prog.push(b);
  }
  return prog;
}

let lessons = 0, runs = 0;
for (const [id, entry] of Object.entries(reg.window.ZM_LESSONS)) {
  if (only.length && !only.some(o => id.includes(o))) continue;
  const W = load(entry);
  const L = W.LESSON, T = W.BLOCK_TEMPLATES, E = W[L.Engine];
  assert.ok(E, `${id}: không thấy engine ${L.Engine}`);
  const keys = [...new Set([...(L.blocks.toolbox || []), ...(L.blocks.pro || []), 'repeatStart', 'repeatEnd', 'wait', 'motorStop'])].filter(k => T[k]);
  const presets = ((L.creative && L.creative.presets) || []).map(p => p.id);
  lessons++;

  // Chỉ có Start: không được đạt nhiệm vụ lập trình (bỏ qua bài cơ khí không có khối, vd lớp 1 thả xe dốc)
  const hasCode = (L.blocks.toolbox || []).length + (L.blocks.pro || []).length > 0;
  for (const adv of hasCode ? [false, true] : []) {
    const sim = new E('sim-canvas-2d');
    let st = {};
    sim.onMissionUpdate = s => (st = s);
    if (adv) sim.setAdvanced(true);
    sim.setAssemblyDone(true);
    sim.setProgram([{ ...T.start }]);
    sim.start();
    for (let i = 0; i < 600; i++) { if (i % 50 === 0 && sim.press) sim.press(); sim.advance(0.05); }
    sim.checkMissions();
    assert.ok(!st.m2 && !st.m3, `${id}${adv ? ' (Nâng cao)' : ''}: chỉ có Start mà đạt m2/m3`);
  }

  for (let k = 0; k < 120; k++) {
    const prog = randomProgram(keys, T);
    const adv = rnd() < 0.4;
    const ups = presets.filter(() => rnd() < 0.3);
    const sim = new E('sim-canvas-2d');
    const tag = `${id} #${k} [${prog.map(b => b.type + (b.duration ? ':' + b.duration : '')).join(' ')}]${adv ? ' Nâng cao' : ''}`;
    let active = -1;
    sim.onActiveBlockUpdate = i => (active = i);
    sim.onMissionUpdate = s => { for (const m of ['m1', 'm2', 'm3', 'm4', 'allDone']) if (m in s) assert.equal(typeof s[m], 'boolean', `${tag}: ${m} không phải đúng/sai`); };
    try {
      if (adv) sim.setAdvanced(true);
      sim.setUpgrades(ups);
      sim.setAssemblyDone(true);
      sim.setProgram(prog);
      sim.start();
      let lastT = sim.runT || 0;
      const stopAt = rnd() < 0.3 ? Math.floor(rnd() * 600) : -1;
      for (let i = 0; i < 900; i++) {
        if (sim.press && rnd() < 0.03) sim.press();
        sim.advance(pick([0.016, 0.02, 0.05]));
        if (i === stopAt) {
          sim.stop();
          assert.equal(sim.running, false, `${tag}: Dừng mà vẫn chạy`);
        }
        const t = sim.runT || 0;
        assert.ok(t + 1e-9 >= lastT, `${tag}: thời gian lùi ${lastT} → ${t}`);
        lastT = t;
        assert.ok(active >= -1 && active < prog.length, `${tag}: khối đang chạy ${active} ngoài chương trình`);
        if (i % 100 === 0) { const bad = numbersOf(sim); assert.deepEqual(bad, [], `${tag}: số lỗi ${bad.join(', ')}`); }
      }
      if (!sim.running) assert.ok(!sim.motorOn, `${tag}: đã dừng mà động cơ vẫn bật`);
      const bad = numbersOf(sim);
      assert.deepEqual(bad, [], `${tag}: số lỗi ${bad.join(', ')}`);
      sim.checkMissions();
      runs++;
    } catch (e) {
      if (e instanceof assert.AssertionError) throw e;
      throw new Error(`${tag}: ném lỗi ${e.stack}`);
    }
  }
}
console.log(`PASS: fuzz ${lessons} bài × ${runs / Math.max(1, lessons)} chương trình ngẫu nhiên – không lỗi, không NaN, thời gian không lùi, Dừng là dừng.`);
