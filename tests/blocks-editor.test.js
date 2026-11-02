// Chạy: node tests/blocks-editor.test.js – logic trình ghép khối (js/blocks-engine.js) và ngữ nghĩa Lặp của lớp gốc
// (js/lesson-engine.js), không cần trình duyệt.
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const ctx = { window: {}, document: { getElementById: () => null }, performance: { now: () => 0 }, requestAnimationFrame: () => 0, cancelAnimationFrame() {}, Math };
for (const f of ['js/blocks-engine.js', 'js/lesson-engine.js']) vm.runInNewContext(fs.readFileSync(path.join(root, f), 'utf8'), ctx);
const { BlockEngine, BLOCK_TEMPLATES: T, LessonEngine } = ctx.window;
const mk = s => (Array.isArray(s) ? { ...T[s[0]], ...s[1] } : { ...T[s] });
const types = e => e.blocks.map(b => b.type).join(' ');

// 1. Khối Chờ: mức lẻ trong mẫu của bài (Lớp 1 Bài 12: 0,5 s; Bài 13/19: 0,2 s) phải chọn được bằng cách chạm
{
  const e = new BlockEngine('x', 'y', { sample: ['start', ['wait', { duration: 0.5 }]], empty: ['start', 'wait'] });
  e.clearProgram();
  assert.deepEqual([...e.waitSteps()], [0.5, 1, 2, 3, 4, 5]);
  const seen = [];
  for (let i = 0; i < 6; i++) { e.cycleParam(1); seen.push(e.blocks[1].duration); }
  assert.deepEqual(seen, [4, 5, 0.5, 1, 2, 3], 'chạm Chờ đi hết vòng 3 → 4 → 5 → 0,5 → 1 → 2 → 3');
  const plain = new BlockEngine('x', 'y', { sample: ['start', 'wait'] });
  assert.deepEqual([...plain.waitSteps()], [1, 2, 3, 4, 5], 'bài không có mức lẻ giữ nguyên 1–5 giây');
  // giá trị lạ (không có trong danh sách) → mức kế tiếp lớn hơn
  e.blocks[1].duration = 2.5;
  e.cycleParam(1);
  assert.equal(e.blocks[1].duration, 3);
}
// Mọi bài đã đăng ký: mọi thời gian Chờ trong mẫu đều chạm tới được từ khối Chờ mới trong khay
{
  const reg = { window: {} };
  vm.runInNewContext(fs.readFileSync(path.join(root, 'js/lessons.js'), 'utf8'), reg);
  for (const [id, entry] of Object.entries(reg.window.ZM_LESSONS)) {
    const c = { window: {}, document: { getElementById: () => null }, Math };
    vm.runInNewContext(fs.readFileSync(path.join(root, entry.scripts[0]), 'utf8'), c);
    const opts = c.window.LESSON.blocks;
    const e = new BlockEngine('x', 'y', opts);
    const steps = e.waitSteps();
    for (const b of e.sampleProgram()) if (b.type === 'wait') assert.ok(steps.includes(b.duration), `${id}: không chạm tới được Chờ ${b.duration}s của mẫu`);
  }
}

// 2. Dịch khối: chương trình 2 khối vẫn đổi chỗ được; không đảo cặp Lặp / Nếu
{
  const e = new BlockEngine('x', 'y', { empty: ['start', 'highSpeed', 'wait'] });
  e.clearProgram();
  assert.equal(e.moveBlock(1, 2), true);
  assert.equal(types(e), 'start wait motor');
  assert.equal(e.moveBlock(1, 0), false, 'không vượt trước Start');
  const loop = new BlockEngine('x', 'y', { empty: ['start', 'repeatStart', 'repeatEnd', 'wait'] });
  loop.clearProgram();
  assert.equal(loop.moveBlock(2, 1), false, 'Lặp lại không được lên trước Bắt đầu lặp');
  assert.equal(types(loop), 'start repeatStart repeatEnd wait');
  assert.equal(loop.moveBlock(3, 2), true, 'khối thường vào trong vòng lặp được');
  assert.equal(types(loop), 'start repeatStart wait repeatEnd');
  const cond = new BlockEngine('x', 'y', { empty: ['start', 'ifSee', 'ifEnd'] });
  cond.clearProgram();
  assert.equal(cond.moveBlock(2, 1), false, 'Hết Nếu không được lên trước Nếu');
}

// 3. Lặp: "Lặp lại" quay về đúng "Bắt đầu lặp" của nó (trước đây: khối Bắt đầu lặp ĐẦU TIÊN trong chương trình)
{
  // Hai vòng lặp liền nhau: vòng đầu lặp mãi khối của nó (theo dõi bằng khối đang chạy)
  const w = d => ['wait', { duration: d }];
  const sim = new LessonEngine();
  const seen = [];
  sim.onActiveBlockUpdate = i => i >= 0 && seen.push(i);
  sim.setProgram(['start', 'repeatStart', w(1), 'repeatEnd', 'repeatStart', w(2), 'repeatEnd'].map(mk));
  sim.start();
  for (let t = 0; t < 12; t += 0.05) sim.advance(0.05);
  assert.deepEqual(seen.slice(0, 4), [2, 2, 2, 2], 'vòng lặp đầu lặp mãi khối của nó');
  const sim2 = new LessonEngine();
  const seen2 = [];
  sim2.onActiveBlockUpdate = i => i >= 0 && seen2.push(i);
  sim2.setProgram(['start', w(1), 'repeatEnd', 'repeatStart', w(2), 'repeatEnd'].map(mk));
  sim2.start();
  for (let t = 0; t < 12; t += 0.05) sim2.advance(0.05);
  assert.equal(seen2[0], 1);
  assert.ok(seen2.slice(1).every(i => i === 4), 'Lặp lại thiếu cặp đi tiếp, vòng sau lặp đúng khối Chờ 2: ' + seen2.join(','));
  assert.equal(LessonEngine.loopStart(mkAll(['start', 'repeatStart', 'repeatStart', 'wait', 'repeatEnd', 'repeatEnd']), 5), 1, 'lặp lồng nhau');
  assert.equal(LessonEngine.loopStart(mkAll(['start', 'repeatStart', 'repeatStart', 'wait', 'repeatEnd', 'repeatEnd']), 4), 2);
}
function mkAll(list) { return list.map(mk); }

console.log('PASS: trình ghép khối – mức Chờ lẻ theo mẫu (mọi bài), dịch 2 khối, giữ cặp Lặp/Nếu; Lặp lại về đúng Bắt đầu lặp, lặp lồng nhau.');
