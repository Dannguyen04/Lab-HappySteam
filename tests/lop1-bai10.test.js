// Chạy: node tests/lop1-bai10.test.js – cấu hình và bộ mô phỏng Bài 10 lớp 1 (Cối xoay gió), chỉ dùng Node.js built-in.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const context = { window: { addEventListener() {} }, document: { getElementById() { return null; } }, performance: { now: () => 0 }, Math };
for (const f of ['js/blocks-engine.js', 'js/bai10/lesson.js', 'js/lesson-engine.js', 'js/bai10/wind-engine.js'])
  vm.runInNewContext(fs.readFileSync(path.join(root, f), 'utf8'), context);
const L = context.window.LESSON;
assert.equal(L.id, 'lop1-bai10');
assert.ok(L.blocks.sample.length > 1, 'Có chương trình mẫu');

// Chạy chương trình mẫu đến hết → NV2
const T = context.window.BLOCK_TEMPLATES;
const program = L.blocks.sample.map(s => (Array.isArray(s) ? { ...T[s[0]], ...s[1] } : { ...T[s] }));
const sim = new context.window.WindEngine();
let state;
sim.onMissionUpdate = s => (state = s);
sim.setProgram(program);
sim.start();
for (let t = 0; t < 60 && sim.running; t += 0.02) {
  if (sim.waitingPress) sim.press();
  sim.advance(0.02);
}
sim.checkMissions();
assert.equal(state.m2, true, 'Chạy đúng chương trình mẫu thì xong NV2');
// TODO: kiểm tra vật lý và NV3/NV5 của bài

console.log('PASS: lop1-bai10 – cấu hình, chương trình mẫu, NV2.');
