// Thẻ Motor This Way là thẻ CHỌN chiều quay (giáo án ZMROBO: chạm thẻ để đổi hướng), không phải nút đảo chiều.
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.join(__dirname, '..');
const noop = () => {};
const el = () => ({ textContent: '', innerHTML: '', hidden: false, dataset: {}, style: {}, classList: { toggle: noop, add: noop, remove: noop }, setAttribute: noop, addEventListener: noop });
const ctx = {
  window: { addEventListener: noop, SFX: null }, Math, JSON, Proxy, Set, Map, Number, String, Array, Object, Infinity, NaN, isFinite,
  document: { getElementById: () => null, querySelector: () => null, querySelectorAll: () => [], createElement: el, addEventListener: noop, body: el(), documentElement: { dataset: {} } },
  performance: { now: () => 0 }, requestAnimationFrame: () => 0, cancelAnimationFrame: noop, setTimeout: () => 0, clearTimeout: noop, console
};
ctx.window.window = ctx.window;
for (const f of ['js/blocks-engine.js', 'js/bai09/lesson.js', 'js/lesson-engine.js', 'js/simulation-engine.js']) vm.runInNewContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx);
const T = ctx.window.BLOCK_TEMPLATES, Sim = ctx.window.SimulationEngine;

assert.equal(T.motorReverse.dir, 'ccw', 'Thẻ mới mặc định ngược chiều kim đồng hồ');

function run(blocks, seconds) {
  const s = new Sim('x');
  s.onActiveBlockUpdate = noop;
  s.setProgram(blocks);
  s.start();
  for (let t = 0; t < seconds; t += 0.02) s.advance(0.02);
  return s;
}
const rev = dir => ({ ...T.motorReverse, dir });
const start = { ...T.start }, hi = { ...T.highSpeed }, w = d => ({ ...T.wait, duration: d }), stop = { ...T.motorStop };

assert.equal(run([start, hi, rev('ccw'), w(0.1)], 0.05).motorDir, -1, 'Thẻ ngược chiều đặt hướng ngược');
assert.equal(run([start, hi, rev('ccw'), rev('ccw'), w(0.1)], 0.05).motorDir, -1, 'Đặt ngược hai lần vẫn ngược (không đảo lại như nút đảo chiều)');
assert.equal(run([start, hi, rev('ccw'), rev('cw'), w(0.1)], 0.05).motorDir, 1, 'Thẻ thuận chiều đặt lại hướng thuận');
// Thẻ cũ không có hướng (dữ liệu/test cũ) vẫn đảo chiều
assert.equal(run([start, hi, { type: 'motor_reverse' }, w(0.1)], 0.05).motorDir, -1);
assert.equal(run([start, hi, { type: 'motor_reverse' }, { type: 'motor_reverse' }, w(0.1)], 0.05).motorDir, 1);
console.log('PASS: Motor This Way – thẻ chọn chiều quay (ccw/cw), thẻ cũ không có hướng vẫn đảo chiều.');
