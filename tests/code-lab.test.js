// Chạy: node tests/code-lab.test.js – lõi Phòng lập trình (js/code-lab/core.js): dịch khối, chương trình gợi ý của
// mọi sa bàn đều về đích, chạy từng khối, kiểm lỗi cấu trúc, thử ngẫu nhiên không treo/NaN.
'use strict';
const assert = require('node:assert/strict');
const CL = require('../js/code-lab/core.js');

const prog = list => list.map(CL.make);
function run(map, blocks, seconds = 90, seed = 1) {
  const sim = new CL.Sim(map, { seed });
  sim.setProgram(blocks);
  if (!sim.start()) return { sim, result: null };
  for (let t = 0; t < seconds && sim.running; t += 1 / 60) sim.tick(1 / 60);
  return { sim, result: sim.result };
}

// 1. Kiểm cấu trúc
assert.equal(CL.check(prog(['start', 'repeat', 'stop'])).ok, false, 'Lặp thiếu Hết');
assert.equal(CL.check(prog(['start', 'end'])).at, 1, 'Hết thừa báo đúng khối');
assert.equal(CL.check(prog(['start', 'else', 'end'])).ok, false, 'Không thì ngoài Nếu');
assert.equal(CL.check(prog(['start', 'if', 'else', 'else', 'end'])).ok, false, 'Hai Không thì');
assert.equal(CL.check(prog(['start', 'forever', 'if', 'else', 'end', 'end'])).ok, true);

// 2. Lặp n lần chạy đúng n lần
{
  const map = CL.MAPS.find(m => m.id === 'san-tu-do');
  const { sim } = run(map, prog(['start', ['repeat', { n: 3 }], 'soundA', ['wait', { sec: 0.5 }], 'end']), 5);
  assert.equal(sim.events.filter(e => e[0] === 'sound').length, 3, 'Lặp 3 lần phát 3 tiếng');
  // lặp lồng nhau 2 × 3
  const { sim: s2 } = run(map, prog(['start', ['repeat', { n: 2 }], ['repeat', { n: 3 }], 'soundB', ['wait', { sec: 0.1 }], 'end', 'end']), 5);
  assert.equal(s2.events.filter(e => e[0] === 'sound').length, 6, 'Lặp lồng 2 × 3');
  // Lặp mãi chỉ có khối tức thì: không treo, mỗi khung một vòng
  const { sim: s3 } = run(map, prog(['start', 'forever', 'soundA', 'end']), 1);
  const n = s3.events.filter(e => e[0] === 'sound').length;
  assert.ok(n >= 50 && n <= 70, 'Lặp mãi tức thì: ~60 vòng/giây, được ' + n);
}

// 3. Chương trình gợi ý của mọi sa bàn có nhiệm vụ đều về đích (Dừng trước tường thử 5 vị trí tường)
for (const map of CL.MAPS) {
  if (map.rules.free) continue;
  for (let seed = 1; seed <= (map.randomWall ? 5 : 1); seed++) {
    const { result, sim } = run(map, prog(map.hint), map.rules.limit + 1, seed);
    assert.ok(result && result.ok, `${map.name}: gợi ý phải về đích – ${result && result.text} (t=${sim.t.toFixed(1)}, x=${sim.robot.x.toFixed(0)}, y=${sim.robot.y.toFixed(0)})`);
    if (map.rules.score) {
      assert.ok(result.points >= (map.id === 'st-tinh-te' ? 210 : 150), `${map.name}: điểm gợi ý đạt yêu cầu`);
      assert.ok(result.stars >= 1, `${map.name}: điểm đổi được sao`);
      assert.equal(sim.scoreLog.reduce((sum, row) => sum + row.points, 0), sim.score);
      assert.equal(sim.events.filter(e => e[0] === 'score').length, sim.scoreLog.length);
      assert.ok(sim.scoreLog.some(row => row.key === 'departure') && sim.scoreLog.some(row => row.key === 'finish'));
    } else assert.ok(result.stars >= 2, `${map.name}: gợi ý được ít nhất 2 sao, được ${result.stars}`);
  }
}

// 3b. Thi đấu: rời bến chỉ một lần, giới hạn điểm vạch, lệch vạch bị đưa về mốc.
{
  const source = CL.MAPS.find(m => m.id === 'st-tap-duot');
  const map = JSON.parse(JSON.stringify(source));
  map.items = map.items.filter(i => i.k !== 'marker');
  for (let i = 0; i < 12; i++) map.items.push({ k: 'marker', label: 'M' + i, x: 60, y: 72, dir: 0, len: 18 });
  const sim = new CL.Sim(map);
  sim.robot.x = 60; sim.robot.y = 72;
  for (let i = 0; i < 15; i++) sim.contestStep(0);
  assert.equal(sim.markerIndex, 12);
  assert.equal(sim.scoreLog.filter(row => row.key.startsWith('marker:')).reduce((n, row) => n + row.points, 0), 60);
  assert.equal(sim.scoreLog.filter(row => row.key === 'departure').length, 1);
  assert.equal(sim.score, 120);
}
{
  const map = CL.MAPS.find(m => m.id === 'st-tap-duot');
  const sim = new CL.Sim(map);
  sim.markerIndex = 2;
  sim.robot.x = 80; sim.robot.y = 10;
  sim.contestStep(1.01);
  assert.ok(sim.events.some(e => e[0] === 'offTrack'));
  assert.equal(sim.robot.x, map.items.filter(i => i.k === 'marker')[1].x);
  assert.equal(sim.robot.y, map.items.filter(i => i.k === 'marker')[1].y);
  assert.equal(sim.markerIndex, 2, 'Giữ các mốc đã qua sau đặt lại');
}
{
  const map = CL.MAPS.find(m => m.id === 'st-tinh-te');
  const sim = new CL.Sim(map);
  const button = map.items.find(i => i.k === 'button');
  sim.robot.x = button.x - CL.ROBOT.length / 2;
  sim.robot.y = button.y;
  sim.robot.th = 0;
  sim.contestStep(0);
  sim.contestStep(0);
  assert.equal(sim.scoreLog.filter(row => row.key.startsWith('button:')).length, 1, 'Nút A1 chỉ cộng một lần');
  assert.equal(sim.scoreLog.find(row => row.key === 'button:0').points, 60);
  assert.ok(sim.scored.has('button:0'), 'Nút đã kích hoạt chuyển trạng thái');

  const rampSim = new CL.Sim(map);
  for (const x of [115, 118, 123, 128, 133, 138, 140]) {
    rampSim.robot.x = x;
    rampSim.robot.y = 25;
    rampSim.robot.th = 0;
    rampSim.contestStep(0);
  }
  assert.equal(rampSim.scoreLog.filter(row => row.key.startsWith('ramp')).reduce((n, row) => n + row.points, 0), 30,
    'Qua đúng dốc, bánh chạm hai dốc và bệ: 10 + 20 điểm');

  const top = new CL.Sim(map);
  top.running = true;
  top.score = 270; // 60 xuất phát + 60 mốc + 30 dốc + 60 nút + 60 đích.
  top.t = 100;
  top.finish(true, 'Về đích');
  assert.equal(top.result.stars, 3, 'Đạt toàn bộ 270 điểm trong 180 giây được 3 sao');
}
// Dừng trước tường: không dùng cảm biến (chạy 6 giây) thì đâm tường và trượt
{
  const map = CL.MAPS.find(m => m.id === 'dung-truoc-tuong');
  const { result } = run(map, prog(['start', ['move', { dir: 'fwd', speed: 60, sec: 8 }], 'stop']));
  assert.equal(result.ok, false);
  assert.match(result.text, /chạm tường/);
}
// Về đích: chạy quá ngắn thì "chưa tới đích"
{
  const { result } = run(CL.MAPS[0], prog(['start', ['move', { dir: 'fwd', speed: 50, sec: 1 }]]));
  assert.equal(result.ok, false);
  assert.match(result.text, /chưa tới đích/);
}

// 4. Chạy từng khối: mỗi lần bấm dừng ở khối kế tiếp
{
  const sim = new CL.Sim(CL.MAPS[0]);
  sim.setProgram(prog(['start', 'soundA', ['move', { dir: 'fwd', speed: 50, sec: 1 }], 'soundB', 'stop']));
  const seen = [];
  for (let k = 0; k < 4; k++) {
    sim.stepOnce();
    for (let i = 0; i < 200 && !sim.paused && sim.running; i++) sim.tick(1 / 60);
    seen.push(sim.active);
  }
  assert.deepEqual(seen, [2, 3, 4, -1], 'Từng khối: 1 → 2 → 3 → 4 → hết');
  assert.ok(Math.abs(sim.robot.x - (25 + CL.ROBOT.vmax / 2)) < 1, 'Khối Di chuyển 1 giây chạy đủ 1 giây');
}

// 4b. Bộ khối RoboSim: quay theo độ bánh, dò vạch tự động, rẽ tới khi gặp vạch, biến/biểu thức, đồng hồ, 888
{
  const free = CL.MAPS.find(m => m.id === 'san-tu-do');
  const { sim } = run(free, prog(['start', ['moveDeg', { dir: 'fwd', speed: 50, deg: 360 }], ['wait', { sec: 0.5 }]]), 5);
  assert.ok(Math.abs(sim.robot.x - (40 + Math.PI * 5)) < 0.3, 'Quay 360° bánh Ø5 cm = 15,7 cm, được ' + (sim.robot.x - 40).toFixed(2));
  assert.ok(Math.abs(sim.sensors().enc1 - 360) <= 2, 'Bộ đếm M1 = 360°');
  const line = CL.MAPS.find(m => m.id === 'do-vach');
  const { result } = run(line, prog(['start', ['lineFollow', { speed: 45, sec: 30 }]]));
  assert.ok(result && result.ok, 'Khối Dò vạch tự động về đích: ' + (result && result.text));
  const s2 = new CL.Sim(free);
  s2.setProgram(prog(['start', ['setVar', { name: 'k', value: 0 }], ['repeat', { n: { v: 'k' } }], 'soundA', 'end',
    ['setVar', { name: 'x', value: { op: '+', a: { n: 2 }, b: { op: '*', a: { n: 3 }, b: { n: 4 } } } }], ['wait', { sec: 1 }], 'timerReset', ['wait', { sec: 0.5 }]]));
  s2.start();
  for (let i = 0; i < 120 && s2.running; i++) s2.tick(1 / 60);
  assert.equal(s2.events.filter(e => e[0] === 'sound').length, 0, 'Lặp 0 lần bỏ qua thân');
  assert.equal(s2.vars.x, 14, 'Biểu thức 2 + 3 × 4');
  assert.ok(Math.abs(s2.sensors().timer - 500) < 40, 'Đồng hồ đếm từ lúc đặt lại (ms)');
  const s3 = new CL.Sim(CL.MAPS[0]);
  s3.setProgram(prog(['start', ['motor', { port: 1, speed: -30 }]]));
  s3.start();
  s3.tick(1 / 60);
  assert.equal(s3.val({ s: 'dist' }) === 888 || s3.val({ s: 'dist' }) < 180, true);
  assert.equal(s3.sensors().m1, -30, 'Khối một động cơ M1');
  assert.equal(s3.sensors().m2, 0);
  const s4 = new CL.Sim(line);
  s4.setProgram(prog(['start', ['turnUntilLine', { l: 40, r: -40, eye: 'R' }], 'soundB']));
  s4.robot.th = -1.2;
  s4.start();
  s4.robot.th = -1.2; // quay lệch khỏi vạch rồi rẽ phải tới khi mắt phải gặp lại vạch
  for (let i = 0; i < 300 && !s4.events.some(e => e[0] === 'sound'); i++) s4.tick(1 / 60);
  assert.ok(s4.events.some(e => e[0] === 'sound'), 'Rẽ tới khi gặp vạch thì đi tiếp');
}

// 5. Thử ngẫu nhiên: không ném lỗi, không NaN, thời gian không vượt giới hạn sa bàn
let seed = 3;
const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
const pick = a => a[Math.floor(rnd() * a.length)];
const KEYS = ['move', 'motors', 'stop', 'wait', 'waitUntil', 'soundA', 'led', 'motor', 'moveDeg', 'lineFollow', 'turnUntilLine', 'setVar', 'changeVar', 'show', 'timerReset', 'buzzer', 'halt'];
function randomBody(depth) {
  const out = [];
  const n = 1 + Math.floor(rnd() * 4);
  for (let i = 0; i < n; i++) {
    const r = rnd();
    if (depth < 2 && r < 0.15) out.push(CL.make(['repeat', { n: 1 + Math.floor(rnd() * 3) }]), ...randomBody(depth + 1), CL.make('end'));
    else if (depth < 2 && r < 0.25) out.push(CL.make('forever'), ...randomBody(depth + 1), CL.make('end'));
    else if (depth < 2 && r < 0.4) {
      out.push(CL.make(['if', { cond: pick([{ s: 'dist', op: '<', v: 30 }, { s: 'touch', op: 'is' }, { s: 'lineL', op: 'not' }, { s: 'color', op: 'is', v: 'red' }]) }]), ...randomBody(depth + 1));
      if (rnd() < 0.5) out.push(CL.make('else'), ...randomBody(depth + 1));
      out.push(CL.make('end'));
    } else {
      const b = CL.make(pick(KEYS));
      if (b.t === 'move') Object.assign(b, { dir: pick(['fwd', 'back', 'left', 'right']), speed: pick([30, 60, 100]), sec: pick([0, 0.5, 1]) });
      if (b.t === 'motors') Object.assign(b, { m1: pick([-50, 0, 80]), m2: pick([-80, 20, 100]) });
      out.push(b);
    }
  }
  return out;
}
let runs = 0;
for (const map of CL.MAPS) {
  for (let k = 0; k < 40; k++) {
    const blocks = [CL.make('start'), ...randomBody(0)];
    assert.ok(CL.check(blocks).ok);
    const sim = new CL.Sim(map, { seed: k + 1 });
    sim.setProgram(blocks);
    sim.start();
    for (let i = 0; i < 900 && sim.running; i++) {
      sim.tick(pick([1 / 60, 1 / 30, 0.05]));
      const v = sim.sensors();
      for (const x of [sim.robot.x, sim.robot.y, sim.robot.th, sim.t, v.m1, v.m2]) assert.ok(Number.isFinite(x), `${map.id} #${k}: NaN`);
    }
    assert.ok(sim.t <= (map.rules.limit || 1e9) + 0.1, `${map.id} #${k}: quá giới hạn thời gian`);
    runs++;
  }
}
console.log(`PASS: Phòng lập trình – kiểm cấu trúc, Lặp n/lồng/mãi, ${CL.MAPS.length - 1} sa bàn về đích bằng gợi ý, đâm tường trượt, chạy từng khối, ${runs} chương trình ngẫu nhiên.`);
