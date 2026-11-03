// Phòng lập trình (Code Lab) – lõi mô phỏng, không chạm DOM (chạy được trong Node để test).
// Gồm: sa bàn có sẵn (MAPS), dịch chuỗi khối ngang → lệnh có nhảy (compile), robot xe 2 bánh Alpha 330
// (vật lý vi sai, va chạm tường/vật cản, cảm biến sóng âm/chạm/dò vạch/màu) và trình thông dịch theo thời gian
// (Sim: tick, chạy từng khối, chấm sao). Đơn vị: cm, giây, góc radian; trục y hướng xuống như trên màn hình.
// Thiết kế: docs/phong-lap-trinh.md
(function (root) {
  'use strict';

  // ---------- Robot Alpha 330 ----------
  const ROBOT = {
    vmax: 39.3, // cm/giây ở tốc độ 100 % (mức 8: bánh Ø5 cm, 150 vòng/phút – như js/bai02/race-engine.js)
    base: 12.5, // cm giữa hai bánh – chọn để rẽ tại chỗ 50 % trong 0,5 giây được đúng 90° (dễ dạy; chưa đo trên kit)
    r: 9, // bán kính va chạm
    length: 18,
    width: 14,
    sonarMax: 180 // cm: xa hơn thì cảm biến không thấy gì
  };
  const DT = 1 / 120; // bước vật lý cố định

  // ---------- Sa bàn có sẵn ----------
  // items: wall {x,y,w,h} · zone {x,y,w,h,color,goal} · line {pts,w} · flag {x,y}
  // rules: time – giây cho sao 2; star3 'blocks' (≤ n khối) | 'noCrash'; limit – giây tối đa; stop – phải dừng hẳn trong ô đích;
  //        failOnCrash – chạm tường là trượt
  const frame = (w, h) => [
    { k: 'wall', x: 0, y: 0, w, h: 3 }, { k: 'wall', x: 0, y: h - 3, w, h: 3 },
    { k: 'wall', x: 0, y: 0, w: 3, h }, { k: 'wall', x: w - 3, y: 0, w: 3, h }
  ];
  const MAPS = [
    {
      id: 've-dich', name: 'Về đích', level: 'kid', size: [200, 100],
      about: 'Cho xe tiến thẳng tới ô cờ xanh rồi dừng lại.',
      start: { x: 25, y: 50, dir: 0 },
      items: [...frame(200, 100), { k: 'zone', x: 130, y: 28, w: 50, h: 44, color: 'green', goal: true }],
      rules: { time: 6, star3: 'blocks', blocks: 3, limit: 30 },
      hint: ['start', ['move', { dir: 'fwd', speed: 100, sec: 3 }], 'stop']
    },
    {
      id: 'goc-vuong', name: 'Góc vuông', level: 'kid', size: [200, 150],
      about: 'Đường gấp khúc: tiến, rẽ trái đúng một góc vuông, rồi tiến tiếp tới đích.',
      start: { x: 25, y: 120, dir: 0 },
      items: [...frame(200, 150), { k: 'wall', x: 3, y: 3, w: 132, h: 92 },
        { k: 'zone', x: 140, y: 6, w: 54, h: 48, color: 'green', goal: true }],
      rules: { time: 10, star3: 'noCrash', limit: 40 },
      hint: ['start', ['move', { dir: 'fwd', speed: 50, sec: 6 }], ['move', { dir: 'left', speed: 50, sec: 0.5 }],
        ['move', { dir: 'fwd', speed: 50, sec: 4 }], 'stop']
    },
    {
      id: 'thu-co', name: 'Thu cờ hình vuông', level: 'kid', size: [200, 200],
      about: 'Đi qua cả 3 lá cờ rồi về ô xuất phát. Dùng khối Lặp để chương trình ngắn lại.',
      start: { x: 45, y: 155, dir: 0 },
      items: [...frame(200, 200), { k: 'flag', x: 155, y: 155 }, { k: 'flag', x: 155, y: 45 }, { k: 'flag', x: 45, y: 45 },
        { k: 'zone', x: 25, y: 135, w: 40, h: 40, color: 'green', goal: true }],
      rules: { time: 26, star3: 'blocks', blocks: 5, limit: 60 },
      hint: ['start', ['repeat', { n: 4 }], ['move', { dir: 'fwd', speed: 50, sec: 5.6 }], ['move', { dir: 'left', speed: 50, sec: 0.5 }], 'end', 'stop']
    },
    {
      id: 'dung-truoc-tuong', name: 'Dừng trước tường', level: 'pro', size: [220, 100],
      about: 'Không biết tường xa bao nhiêu! Dùng cảm biến sóng âm: chạy tới khi còn cách tường dưới 15 cm thì dừng. Chạm tường là trượt.',
      start: { x: 25, y: 50, dir: 0 }, randomWall: [150, 205],
      items: [...frame(220, 100), { k: 'wall', x: 195, y: 3, w: 22, h: 94, movable: true },
        { k: 'zone', x: 160, y: 25, w: 35, h: 50, color: 'green', goal: true, movable: true }],
      rules: { time: 8, star3: 'blocks', blocks: 4, limit: 30, stop: true, failOnCrash: true },
      hint: ['start', ['move', { dir: 'fwd', speed: 60, sec: 0 }], ['waitUntil', { cond: { s: 'dist', op: '<', v: 15 } }], 'stop']
    },
    {
      id: 'tranh-vat-can', name: 'Tránh vật cản', level: 'pro', size: [260, 160],
      about: 'Hai tảng đá chắn đường. Lặp mãi: nếu sóng âm thấy vật gần thì vòng sang trái (rẽ trái, tiến, rẽ phải), không thì tiến thẳng.',
      start: { x: 25, y: 130, dir: 0 },
      items: [...frame(260, 160), { k: 'wall', x: 90, y: 105, w: 20, h: 52 }, { k: 'wall', x: 170, y: 66, w: 20, h: 50 },
        { k: 'zone', x: 215, y: 28, w: 40, h: 48, color: 'green', goal: true }],
      rules: { time: 16, star3: 'noCrash', limit: 60 },
      hint: ['start', 'forever', ['if', { cond: { s: 'dist', op: '<', v: 25 } }], ['move', { dir: 'left', speed: 50, sec: 0.5 }],
        ['move', { dir: 'fwd', speed: 50, sec: 2 }], ['move', { dir: 'right', speed: 50, sec: 0.5 }],
        'else', ['move', { dir: 'fwd', speed: 50, sec: 0 }], 'end', 'end']
    },
    {
      id: 'do-vach', name: 'Dò vạch', level: 'pro', size: [260, 180],
      about: 'Đi theo vạch đen tới đích bằng hai mắt dò vạch: mắt trái thấy vạch thì lái sang trái, mắt phải thấy thì lái sang phải.',
      start: { x: 30, y: 140, dir: 0 },
      items: [...frame(260, 180), { k: 'line', w: 2.5, pts: [[30, 140], [110, 140], [140, 125], [160, 95], [175, 60], [200, 40], [240, 40]] },
        { k: 'zone', x: 222, y: 22, w: 34, h: 36, color: 'green', goal: true }],
      rules: { time: 14, star3: 'blocks', blocks: 10, limit: 60 },
      hint: ['start', 'forever', ['if', { cond: { s: 'lineL', op: 'is' } }], ['motors', { m1: 10, m2: 50 }],
        'else', ['if', { cond: { s: 'lineR', op: 'is' } }], ['motors', { m1: 50, m2: 10 }], 'else', ['motors', { m1: 45, m2: 45 }], 'end', 'end', 'end']
    },
    {
      id: 'dem-vach', name: 'Đếm vạch', level: 'pro', size: [260, 100],
      about: 'Xe phải dừng ngay ở vạch thứ 3. Dùng biến đếm số vạch mắt dò đã đi qua, đủ 3 thì dừng.',
      start: { x: 25, y: 50, dir: 0 },
      items: [...frame(260, 100), ...[70, 120, 170, 220].map(x => ({ k: 'line', w: 3, pts: [[x, 12], [x, 88]] })),
        { k: 'zone', x: 150, y: 25, w: 30, h: 50, color: 'green', goal: true }],
      rules: { time: 14, star3: 'blocks', blocks: 9, limit: 40, stop: true },
      hint: ['start', ['setVar', { name: 'dem', value: 0 }], ['show', { name: 'dem' }], ['motors', { m1: 40, m2: 40 }], 'forever',
        ['waitUntil', { cond: { s: 'lineL', op: 'is' } }], ['changeVar', { name: 'dem', by: 1 }],
        ['if', { cond: { op: '=', a: { v: 'dem' }, b: { n: 3 } } }], 'halt', 'end',
        ['waitUntil', { cond: { s: 'lineL', op: 'not' } }], 'end']
    },
    {
      id: 'san-tu-do', name: 'Sân tự do', level: 'pro', size: [240, 180],
      about: 'Không có nhiệm vụ: thử mọi khối lệnh và xem bảng cảm biến thay đổi.',
      start: { x: 40, y: 90, dir: 0 },
      items: [...frame(240, 180), { k: 'wall', x: 120, y: 60, w: 25, h: 25 },
        { k: 'zone', x: 170, y: 120, w: 40, h: 35, color: 'red' }, { k: 'zone', x: 60, y: 20, w: 40, h: 30, color: 'blue' },
        { k: 'line', w: 2.5, pts: [[20, 160], [220, 160]] }],
      rules: { free: true, limit: 600 },
      hint: ['start', ['move', { dir: 'fwd', speed: 50, sec: 2 }], ['led', { color: 'blue' }], 'soundA']
    },
    {
      id: 'st-tap-duot', name: 'Tập dượt đường bay', theme: 'contest', level: 'pro', size: [160, 100],
      about: 'Rời bến +60, mỗi vạch +6 (tối đa 60), về B đúng thứ tự +60. 90 giây; theo luật Super AI 超级轨迹 2025.',
      start: { x: 20, y: 72, dir: 0 },
      items: [
        { k: 'line', w: 2.5, pts: [[20, 72], [45, 72], [60, 70], [75, 65], [90, 57], [105, 49], [120, 43], [142, 40]] },
        { k: 'dock', label: 'A', role: 'start', x: 7.5, y: 59.5, w: 25, h: 25 },
        { k: 'dock', label: 'B', role: 'goal', x: 127, y: 27.5, w: 25, h: 25 },
        ...[[47, 72, 0.1], [67, 68, -0.3], [88, 58, -0.5], [106, 49, -0.4], [121, 43, -0.2]]
          .map(([x, y, dir], i) => ({ k: 'marker', label: 'ABCDE'[i], x, y, dir, len: 18 }))
      ],
      rules: { limit: 90, score: { departure: 60, marker: 6, markerCap: 60, rampPass: 10, rampFull: 20, button: 60, finish: 60 } },
      hint: ['start', ['lineFollow', { speed: 38, sec: 30 }]]
    },
    {
      id: 'st-tinh-te', name: 'Siêu quỹ đạo – Tinh tế truyền kỳ', theme: 'contest', level: 'pro', size: [300, 200],
      about: '180 giây: rời A +60, vạch +6 (tối đa 60), qua dốc +10/+20, chạm A1 +60, về B +60. Theo luật Super AI 超级轨迹 2025.',
      start: { x: 100, y: 175, dir: Math.PI },
      blackHole: { x: 150, y: 99, diameters: [80, 50, 30] },
      items: [
        { k: 'line', w: 2.5, pts: [[100, 175], [75, 175], [50, 170], [37, 160], [30, 145], [25, 125], [25, 95], [25, 70], [30, 52], [43, 38], [60, 29], [85, 25], [115, 25], [145, 25], [180, 25], [210, 25], [237, 30], [257, 41], [270, 57], [275, 78], [275, 105], [275, 130], [269, 146], [258, 160], [240, 170], [215, 175], [185, 175], [145, 175]] },
        { k: 'dock', role: 'start', label: 'A', x: 87.5, y: 162.5, w: 25, h: 25 },
        { k: 'dock', role: 'goal', label: 'B', x: 132.5, y: 162.5, w: 25, h: 25 },
        ...[[70, 174, -0.2], [29, 143, -1.8], [25, 85, -Math.PI / 2], [56, 31, -0.2], [130, 25, 0],
          [210, 25, 0], [270, 60, 1.3], [275, 125, Math.PI / 2], [237, 171, 2.9], [185, 175, Math.PI]]
          .map(([x, y, dir], i) => ({ k: 'marker', label: 'ABCDEFGHIJ'[i], x, y, dir, len: 20 })),
        { k: 'ramp', x: 115, y: 17.5, w: 25, h: 15, axis: 'x', dir: 1, label: 'E' },
        { k: 'button', x: 210, y: 38, radius: 3, label: 'A1' }
      ],
      rules: { limit: 180, score: { departure: 60, marker: 6, markerCap: 60, rampPass: 10, rampFull: 20, button: 60, finish: 60 } },
      hint: ['start', ['lineFollow', { speed: 36, sec: 90 }]]
    }
  ];

  // ---------- Khối lệnh ----------
  // Mỗi khối: { t, ...tham số }. Khối mở thân: repeat/forever/if (đóng bằng 'end', 'else' ngăn giữa của if)
  const BLOCKS = {
    start: { t: 'start' },
    move: { t: 'move', dir: 'fwd', speed: 50, sec: 1 }, // sec 0 = chạy mãi, đi tiếp ngay
    motors: { t: 'motors', m1: 50, m2: 50 },
    stop: { t: 'stop' },
    wait: { t: 'wait', sec: 1 },
    waitUntil: { t: 'waitUntil', cond: { s: 'dist', op: '<', v: 20 } },
    repeat: { t: 'repeat', n: 3 },
    forever: { t: 'forever' },
    if: { t: 'if', cond: { s: 'dist', op: '<', v: 20 } },
    else: { t: 'else' },
    end: { t: 'end' },
    soundA: { t: 'sound', tune: 'A' },
    soundB: { t: 'sound', tune: 'B' },
    led: { t: 'led', color: 'red' },
    // Bộ khối RoboSim (korv1x): tham số số có thể là biểu thức (xem Sim.val)
    motor: { t: 'motor', port: 1, speed: 50 }, // Động cơ (M1) quay tốc độ (50), không chặn
    moveDeg: { t: 'moveDeg', dir: 'fwd', speed: 50, deg: 360 }, // (Tiến) tốc độ (50) quay (360) độ bánh
    lineFollow: { t: 'lineFollow', speed: 50, sec: 2 }, // Dò vạch tốc độ (50) trong (2) giây
    turnUntilLine: { t: 'turnUntilLine', l: -40, r: 40, eye: 'L' }, // Rẽ trái (−40) phải (40) đến khi (mắt trái) gặp vạch
    setVar: { t: 'setVar', name: 'dem', value: 0 },
    changeVar: { t: 'changeVar', name: 'dem', by: 1 },
    show: { t: 'show', name: 'dem' }, // Hiển thị biến lên bảng số liệu
    timerReset: { t: 'timerReset' },
    buzzer: { t: 'buzzer', on: true },
    halt: { t: 'halt' } // Kết thúc chương trình
  };
  // Biểu thức: số | { n } | { c: 'red' } | { s: 'dist'|'touch'|'lineL'|'lineR'|'light'|'color'|'timer'|'enc1'|'enc2' } | { v: 'tên biến' }
  //            | { op: '+','-','*','/','<','>','=','!=','and','or', a, b } | { op: 'not', a }
  const SENSOR_KEYS = ['dist', 'touch', 'lineL', 'lineR', 'light', 'color', 'timer', 'enc1', 'enc2'];
  const LIGHT = { line: 300, green: 1800, red: 2200, blue: 1500, yellow: 3000, white: 3600 }; // giá trị quang 0–4095, càng tối càng nhỏ
  const WHEEL_DEG_PER_CM = 360 / (Math.PI * 5); // bánh Ø5 cm
  const OPENERS = new Set(['repeat', 'forever', 'if']);
  const clone = o => JSON.parse(JSON.stringify(o));
  const make = k => (Array.isArray(k) ? { ...clone(BLOCKS[k[0]]), ...clone(k[1]) } : clone(BLOCKS[k]));

  // Kiểm cấu trúc: trả về { ok, error, at } – at là chỉ số khối sai
  function check(blocks) {
    if (!blocks.length || blocks[0].t !== 'start') return { ok: false, error: 'Chương trình phải bắt đầu bằng khối Bắt đầu.', at: 0 };
    const stack = [];
    for (let i = 1; i < blocks.length; i++) {
      const t = blocks[i].t;
      if (t === 'start') return { ok: false, error: 'Chỉ được một khối Bắt đầu.', at: i };
      if (OPENERS.has(t)) stack.push({ t, i, hasElse: false });
      else if (t === 'else') {
        const top = stack[stack.length - 1];
        if (!top || top.t !== 'if' || top.hasElse) return { ok: false, error: 'Khối "Không thì" phải nằm trong một khối Nếu.', at: i };
        top.hasElse = true;
      } else if (t === 'end') {
        if (!stack.pop()) return { ok: false, error: 'Khối Hết thừa, không có khối mở nào.', at: i };
      }
    }
    if (stack.length) return { ok: false, error: 'Khối này chưa có khối Hết đi kèm.', at: stack[stack.length - 1].i };
    return { ok: true };
  }
  // Chỉ số khối đóng (end) và else của khối mở ở i
  function matchOf(blocks, i) {
    let depth = 0, els = -1;
    for (let j = i + 1; j < blocks.length; j++) {
      const t = blocks[j].t;
      if (OPENERS.has(t)) depth++;
      else if (t === 'else' && depth === 0) els = j;
      else if (t === 'end') {
        if (depth === 0) return { end: j, else: els };
        depth--;
      }
    }
    return { end: -1, else: -1 };
  }
  // Chuỗi khối → danh sách lệnh có nhảy. Mỗi lệnh nhớ src = chỉ số khối để tô sáng
  function compile(blocks) {
    const c = check(blocks);
    if (!c.ok) throw Object.assign(new Error(c.error), { at: c.at });
    const out = [];
    let slots = 0;
    const emit = o => (out.push(o), out.length - 1);
    function body(from, to) {
      for (let i = from; i < to; i++) {
        const b = blocks[i];
        if (b.t === 'repeat' || b.t === 'forever' || b.t === 'if') {
          const m = matchOf(blocks, i);
          if (b.t === 'repeat') {
            const slot = slots++;
            const init = emit({ op: 'loopInit', slot, n: b.n, src: i, to: -1 });
            const top = out.length;
            body(i + 1, m.end);
            emit({ op: 'loopNext', slot, to: top, src: m.end });
            out[init].to = out.length; // lặp 0 lần: nhảy qua thân
          } else if (b.t === 'forever') {
            const top = out.length;
            body(i + 1, m.end);
            emit({ op: 'jmp', to: top, src: m.end, back: true });
          } else {
            const jif = emit({ op: 'jif', cond: b.cond, to: -1, src: i });
            body(i + 1, m.else === -1 ? m.end : m.else);
            if (m.else === -1) out[jif].to = out.length;
            else {
              const jmp = emit({ op: 'jmp', to: -1, src: m.else });
              out[jif].to = out.length;
              body(m.else + 1, m.end);
              out[jmp].to = out.length;
            }
          }
          i = m.end;
        } else if (b.t !== 'start') emit({ op: b.t, b, src: i });
      }
    }
    body(1, blocks.length);
    return out;
  }
  // Số khối "thật" để chấm sao 3 (không tính Bắt đầu, Hết, Không thì)
  const countBlocks = blocks => blocks.filter(b => !['start', 'end', 'else'].includes(b.t)).length;

  // ---------- Hình học ----------
  function distSeg(px, py, ax, ay, bx, by) {
    const dx = bx - ax, dy = by - ay;
    const L = dx * dx + dy * dy;
    let t = L ? ((px - ax) * dx + (py - ay) * dy) / L : 0;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - ax - t * dx, py - ay - t * dy);
  }
  const inRect = (x, y, r) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
  // Tia từ (x,y) theo hướng (dx,dy) cắt hình chữ nhật: khoảng cách hoặc Infinity
  function rayRect(x, y, dx, dy, r) {
    let t0 = -Infinity, t1 = Infinity;
    for (const [p, d, lo, hi] of [[x, dx, r.x, r.x + r.w], [y, dy, r.y, r.y + r.h]]) {
      if (Math.abs(d) < 1e-9) {
        if (p < lo || p > hi) return Infinity;
      } else {
        let a = (lo - p) / d, b = (hi - p) / d;
        if (a > b) [a, b] = [b, a];
        t0 = Math.max(t0, a);
        t1 = Math.min(t1, b);
      }
    }
    return t1 >= Math.max(t0, 0) ? Math.max(t0, 0) : Infinity;
  }

  // ---------- Bộ mô phỏng ----------
  class Sim {
    constructor(map, opts = {}) {
      this.opts = opts;
      this.events = [];
      this.onEvent = null;
      this.load(map);
    }
    load(map) {
      this.map = clone(map);
      this.blocks = [{ t: 'start' }];
      this.code = [];
      this.seed = this.opts.seed || 1;
      this.reset();
    }
    rand() {
      this.seed = (this.seed * 1103515245 + 12345) % 2147483648;
      return this.seed / 2147483648;
    }
    // Đặt lại sa bàn và robot (sa bàn có tường di động thì đổi vị trí mỗi lần chạy)
    reset() {
      const m = this.map;
      if (m.randomWall) {
        const [lo, hi] = m.randomWall;
        const x = Math.round(lo + this.rand() * (hi - lo));
        const wall = m.items.find(i => i.k === 'wall' && i.movable);
        const zone = m.items.find(i => i.k === 'zone' && i.movable);
        wall.x = x;
        wall.w = m.size[0] - 3 - x;
        zone.x = x - 35;
      }
      const s = m.start;
      this.robot = { x: s.x, y: s.y, th: s.dir || 0, vl: 0, vr: 0, led: null, odo: 0, e1: 0, e2: 0, buzzer: false };
      this.vars = {};
      this.shown = [];
      this.timer0 = 0;
      this.follow = null; // dò vạch tự động: { speed }
      this.flags = m.items.filter(i => i.k === 'flag').map(() => false);
      this.running = false;
      this.paused = false;
      this.pc = 0;
      this.entered = false;
      this.blkT = 0;
      this.timedEnd = 0;
      this.counters = [];
      this.t = 0;
      this.bumps = 0;
      this.touching = false;
      this.result = null;
      this.active = -1;
      this.stepping = false;
      this.doneWhileMoving = false;
      this.trail = [[s.x, s.y]];
      this.sound = null;
      this.score = 0;
      this.scoreLog = [];
      this.scored = new Set();
      this.markerIndex = 0;
      this.offTrackTime = 0;
      this.buttonDetourTime = 0;
      this.rampProgress = new Map();
    }
    setProgram(blocks) {
      this.blocks = blocks.map(clone);
      this.reset();
    }
    start() {
      this.reset();
      try {
        this.code = compile(this.blocks);
      } catch (e) {
        this.emit('error', { text: e.message, at: e.at });
        return false;
      }
      this.running = true;
      this.emit('start');
      return true;
    }
    stop(reason = 'stop') {
      if (!this.running) return;
      this.running = false;
      this.robot.vl = this.robot.vr = 0;
      this.follow = null;
      this.active = -1;
      this.emit(reason);
    }
    emit(type, data) {
      this.events.push([type, data]);
      if (this.onEvent) this.onEvent(type, data);
    }

    // ----- cảm biến -----
    sensors() {
      const r = this.robot, c = Math.cos(r.th), s = Math.sin(r.th);
      const fx = r.x + c * ROBOT.length / 2, fy = r.y + s * ROBOT.length / 2;
      let dist = Infinity;
      for (const w of this.map.items) if (w.k === 'wall') dist = Math.min(dist, rayRect(fx, fy, c, s, w));
      const eye = side => {
        // hai mắt dò vạch ở đầu xe, cách tâm ±2,5 cm theo chiều ngang
        const ex = r.x + c * 6 - s * side * 2.5, ey = r.y + s * 6 + c * side * 2.5;
        return this.map.items.some(l => l.k === 'line' && l.pts.some((p, i) => i && distSeg(ex, ey, ...l.pts[i - 1], ...p) <= l.w / 2));
      };
      const zone = this.map.items.find(z => z.k === 'zone' && inRect(r.x, r.y, z));
      const color = zone ? zone.color : 'white';
      const under = this.map.items.some(l => l.k === 'line' && l.pts.some((p, i) => i && distSeg(r.x, r.y, ...l.pts[i - 1], ...p) <= l.w / 2));
      return {
        dist: dist <= ROBOT.sonarMax ? Math.round(dist * 10) / 10 : null, // null: không thấy gì (khối số trả 888 như RoboSim)
        touch: this.touching,
        lineL: eye(-1),
        lineR: eye(1),
        color,
        light: under ? LIGHT.line : LIGHT[color] || LIGHT.white,
        m1: Math.round((r.vl / ROBOT.vmax) * 100),
        m2: Math.round((r.vr / ROBOT.vmax) * 100),
        enc1: Math.round(r.e1),
        enc2: Math.round(r.e2),
        timer: Math.round((this.t - this.timer0) * 1000), // mili giây, như "Thời gian bộ điều khiển"
        t: this.t
      };
    }
    // Giá trị của một biểu thức (số, cảm biến, biến, phép tính, so sánh)
    val(e, v) {
      if (e === null || e === undefined) return 0;
      if (typeof e === 'number' || typeof e === 'string') return e;
      if (typeof e === 'boolean') return e ? 1 : 0;
      if ('n' in e) return +e.n || 0;
      if ('c' in e) return e.c;
      if ('v' in e) return +this.vars[e.v] || 0;
      if ('s' in e && !('op' in e)) {
        v = v || this.sensors();
        if (e.s === 'dist') return v.dist === null ? 888 : v.dist;
        if (e.s === 'touch' || e.s === 'lineL' || e.s === 'lineR') return v[e.s] ? 1 : 0;
        return v[e.s] === undefined ? 0 : v[e.s];
      }
      const a = this.val(e.a, v), b = this.val(e.b, v);
      switch (e.op) {
        case '+': return a + b;
        case '-': return a - b;
        case '*': return a * b;
        case '/': return b ? a / b : 0;
        case '<': return a < b ? 1 : 0;
        case '>': return a > b ? 1 : 0;
        case '=': return a == b ? 1 : 0; // eslint-disable-line eqeqeq – so số với chuỗi màu
        case '!=': return a != b ? 1 : 0; // eslint-disable-line eqeqeq
        case 'and': return a && b ? 1 : 0;
        case 'or': return a || b ? 1 : 0;
        case 'not': return a ? 0 : 1;
      }
      return 0;
    }
    num(x) {
      const n = Number(this.val(x));
      return Number.isFinite(n) ? n : 0;
    }
    test(cond) {
      if (cond && 'a' in cond) return !!this.val(cond);
      const v = this.sensors();
      switch (cond.s) {
        case 'dist': {
          const d = v.dist === null ? 999 : v.dist;
          return cond.op === '>' ? d > cond.v : d < cond.v;
        }
        case 'touch': case 'lineL': case 'lineR':
          return cond.op === 'not' ? !v[cond.s] : !!v[cond.s];
        case 'color':
          return cond.op === 'not' ? v.color !== cond.v : v.color === cond.v;
      }
      return false;
    }

    // ----- vật lý -----
    setWheels(l, r) {
      this.robot.vl = (ROBOT.vmax * Math.max(-100, Math.min(100, l))) / 100;
      this.robot.vr = (ROBOT.vmax * Math.max(-100, Math.min(100, r))) / 100;
    }
    drive(b) {
      const v = this.num(b.speed);
      const w = { fwd: [v, v], back: [-v, -v], left: [-v, v], right: [v, -v] }[b.dir] || [0, 0];
      this.setWheels(...w);
    }
    physics(dt) {
      const r = this.robot;
      let left = dt;
      while (left > 1e-9) {
        const h = Math.min(DT, left);
        left -= h;
        if (this.follow) {
          // dò vạch hai mắt: mắt nào thấy vạch thì lái về phía đó
          const s = this.sensors(), sp = this.follow.speed;
          this.setWheels(s.lineL && !s.lineR ? sp * 0.2 : sp, s.lineR && !s.lineL ? sp * 0.2 : sp);
        }
        r.e1 += r.vl * h * WHEEL_DEG_PER_CM;
        r.e2 += r.vr * h * WHEEL_DEG_PER_CM;
        const v = (r.vl + r.vr) / 2, w = (r.vr - r.vl) / ROBOT.base;
        r.th -= w * h; // y hướng xuống: bánh phải nhanh hơn → xe quay sang trái trên màn hình
        r.x += Math.cos(r.th) * v * h;
        r.y += Math.sin(r.th) * v * h;
        r.odo += Math.abs(v * h);
        this.collide();
        if (!this.running) return;
        if (this.map.rules.score) this.contestStep(h);
        if (!this.running) return;
      }
      const last = this.trail[this.trail.length - 1];
      if (Math.hypot(r.x - last[0], r.y - last[1]) > 2) this.trail.push([r.x, r.y]);
      if (this.trail.length > 1500) this.trail.shift();
      this.flags.forEach((got, i) => {
        if (got) return;
        const f = this.map.items.filter(x => x.k === 'flag')[i];
        if (Math.hypot(f.x - r.x, f.y - r.y) < ROBOT.r + 4) {
          this.flags[i] = true;
          this.emit('flag', { left: this.flags.filter(x => !x).length });
        }
      });
    }
    collide() {
      const r = this.robot;
      let hit = false;
      for (const w of this.map.items) {
        if (w.k !== 'wall') continue;
        const nx = Math.max(w.x, Math.min(r.x, w.x + w.w)), ny = Math.max(w.y, Math.min(r.y, w.y + w.h));
        const dx = r.x - nx, dy = r.y - ny, d = Math.hypot(dx, dy);
        if (d < ROBOT.r) {
          hit = true;
          if (d > 1e-6) {
            r.x = nx + (dx / d) * ROBOT.r;
            r.y = ny + (dy / d) * ROBOT.r;
          }
        }
      }
      // cảm biến chạm ở mũi xe: chạm khi tường chạm phần trước
      if (hit && !this.touching) {
        this.bumps++;
        this.emit('bump');
        if (this.map.rules.failOnCrash) this.finish(false, 'Xe chạm tường rồi!');
      }
      this.touching = hit;
    }
    award(key, label, points) {
      if (!points || this.scored.has(key)) return;
      this.scored.add(key);
      this.score += points;
      const entry = { key, label, points, total: this.score, time: Math.round(this.t * 10) / 10 };
      this.scoreLog.push(entry);
      this.emit('score', entry);
    }
    contestStep(dt) {
      const r = this.robot, items = this.map.items, rules = this.map.rules.score;
      const c = Math.cos(r.th), s = Math.sin(r.th);
      const wheels = [-1, 1].map(side => [r.x - s * side * ROBOT.base / 2, r.y + c * side * ROBOT.base / 2]);
      const eyes = [-1, 1].map(side => [r.x + c * 6 - s * side * 2.5, r.y + s * 6 + c * side * 2.5]);
      const start = items.find(i => i.k === 'dock' && i.role === 'start');
      if (start && !this.scored.has('departure')) {
        // Cả thân xe (hình chữ nhật xoay) phải ra khỏi bến.
        const corners = [-1, 1].flatMap(a => [-1, 1].map(b => [r.x + c * a * ROBOT.length / 2 - s * b * ROBOT.width / 2,
          r.y + s * a * ROBOT.length / 2 + c * b * ROBOT.width / 2]));
        const minX = Math.min(...corners.map(p => p[0])), maxX = Math.max(...corners.map(p => p[0]));
        const minY = Math.min(...corners.map(p => p[1])), maxY = Math.max(...corners.map(p => p[1]));
        if (maxX < start.x || minX > start.x + start.w || maxY < start.y || minY > start.y + start.h)
          this.award('departure', 'Rời bến A', rules.departure);
      }
      const markers = items.filter(i => i.k === 'marker');
      const marker = markers[this.markerIndex];
      if (marker) {
        const nx = -Math.sin(marker.dir || 0), ny = Math.cos(marker.dir || 0), half = (marker.len || 18) / 2;
        if (wheels.some(([x, y]) => distSeg(x, y, marker.x - nx * half, marker.y - ny * half,
          marker.x + nx * half, marker.y + ny * half) <= 2.5)) {
          this.markerIndex++;
          if ((this.markerIndex - 1) * rules.marker < rules.markerCap)
            this.award('marker:' + marker.label, 'Vạch ' + marker.label, Math.min(rules.marker, rules.markerCap - (this.markerIndex - 1) * rules.marker));
        }
      }
      items.filter(i => i.k === 'ramp').forEach((ramp, i) => {
        const axis = ramp.axis || 'x', pos = axis === 'x' ? r.x : r.y;
        const low = ramp[axis], length = ramp[axis === 'x' ? 'w' : 'h'];
        const signed = ramp.dir === -1 ? low + length - pos : pos - low;
        const cross = axis === 'x' ? 'y' : 'x';
        const onRamp = Math.abs(r[cross] - (ramp[cross] + ramp[cross === 'x' ? 'w' : 'h'] / 2)) <=
          ramp[cross === 'x' ? 'w' : 'h'] / 2 + 2;
        if (!onRamp) return;
        const p = this.rampProgress.get(i) || { stage: 0, touched: new Set() };
        if (signed >= 0 && signed <= 5 && p.stage === 0) p.stage = 1;
        if (p.stage >= 1 && signed >= 5 && signed <= 20) p.stage = Math.max(2, p.stage);
        if (p.stage >= 2 && signed >= 20 && signed <= length) p.stage = 3;
        for (const [wx, wy] of wheels) {
          const wpos = axis === 'x' ? wx : wy;
          const t = ramp.dir === -1 ? low + length - wpos : wpos - low;
          if (t >= -2.5 && t <= 7.5) p.touched.add('entry');
          if (t >= 7.5 && t <= 17.5) p.touched.add('platform');
          if (t >= 17.5 && t <= length + 2.5) p.touched.add('exit');
        }
        this.rampProgress.set(i, p);
        if (p.stage === 3 && signed >= length - 1) {
          this.award('ramp:' + i, 'Qua dốc ' + (ramp.label || ''), rules.rampPass);
          if (p.touched.size === 3) this.award('ramp-full:' + i, 'Chạm đủ hai dốc và bệ', rules.rampFull);
        }
      });
      const buttons = items.filter(i => i.k === 'button');
      for (const [i, button] of buttons.entries()) {
        const nose = [r.x + c * ROBOT.length / 2, r.y + s * ROBOT.length / 2];
        if (Math.hypot(nose[0] - button.x, nose[1] - button.y) <= (button.radius || 3) + 2 ||
            (this.touching && Math.hypot(nose[0] - button.x, nose[1] - button.y) < 8))
          this.award('button:' + i, 'Khởi động tàu ' + (button.label || ''), rules.button);
      }
      const lines = items.filter(i => i.k === 'line');
      const nearLine = ([x, y]) => lines.some(l => l.pts.some((p, i) => i && distSeg(x, y, ...l.pts[i - 1], ...p) <= 6));
      const off = !nearLine([r.x, r.y]) && eyes.every(p => !nearLine(p));
      const closeButton = buttons.some(b => !this.scored.has('button:' + buttons.indexOf(b)) && Math.hypot(r.x - b.x, r.y - b.y) < 22);
      this.buttonDetourTime = off && closeButton ? this.buttonDetourTime + dt : 0;
      this.offTrackTime = off && !(closeButton && this.buttonDetourTime <= 3) ? this.offTrackTime + dt : 0;
      if (this.offTrackTime > 1) {
        const last = markers[Math.max(0, this.markerIndex - 1)];
        const origin = last || { ...this.map.start, dir: this.map.start.dir || 0 };
        r.x = origin.x; r.y = origin.y; r.th = origin.dir || 0;
        this.offTrackTime = 0;
        this.trail.push([r.x, r.y]);
        this.emit('offTrack', { marker: last ? last.label : 'A (xuất phát)', time: this.t });
      }
    }

    // ----- chạy chương trình -----
    // Chạy chương trình thêm dt giây. Khối tức thì chạy liền; khối tốn thời gian (Di chuyển n giây, Chờ, Chờ đến khi)
    // giữ lệnh tới khi xong. Vòng lặp mà từ lần quay trước không tốn chút thời gian nào thì nhường khung hình sau.
    tick(dt) {
      if (!this.running || this.paused) return;
      let budget = dt, guard = 0, timed = false;
      while (this.running && !this.paused && guard++ < 200) {
        if (this.pc >= this.code.length) {
          this.programDone();
          break;
        }
        const ins = this.code[this.pc];
        this.active = ins.src;
        if (ins.op === 'loopInit') {
          const n = Math.floor(this.num(ins.n));
          this.counters[ins.slot] = n;
          this.go(n > 0 ? this.pc + 1 : ins.to);
          continue;
        }
        if (ins.op === 'halt') {
          this.setWheels(0, 0);
          this.follow = null;
          this.go(this.code.length);
          continue;
        }
        if (ins.op === 'loopNext' || ins.op === 'jmp') {
          const back = ins.op === 'jmp' ? !!ins.back : --this.counters[ins.slot] > 0;
          this.go(ins.op === 'jmp' || back ? ins.to : this.pc + 1);
          if (back) {
            if (!timed) {
              this.spend(budget);
              budget = 0;
              break;
            }
            timed = false;
          }
          continue;
        }
        if (ins.op === 'jif') {
          this.go(this.test(ins.cond) ? this.pc + 1 : ins.to);
          continue;
        }
        const b = ins.b;
        const TIMED = ins.op === 'wait' || ins.op === 'waitUntil' || ins.op === 'moveDeg' || ins.op === 'lineFollow' ||
          ins.op === 'turnUntilLine' || (ins.op === 'move' && this.num(b.sec));
        if (!TIMED) {
          this.act(b);
          this.go(this.pc + 1);
          continue;
        }
        if (!this.entered) {
          this.entered = true;
          this.blkT = 0;
          this.blkDur = this.num(b.sec);
          if (ins.op === 'move') this.drive(b);
          else if (ins.op === 'lineFollow') this.follow = { speed: this.num(b.speed) };
          else if (ins.op === 'turnUntilLine') this.setWheels(this.num(b.l), this.num(b.r));
          else if (ins.op === 'moveDeg') {
            // quay đủ số độ bánh: tốc độ không đổi nên đổi ra thời gian chính xác
            this.drive(b);
            const rate = Math.abs(this.robot.vl) * WHEEL_DEG_PER_CM;
            this.blkDur = rate ? Math.abs(this.num(b.deg)) / rate : Infinity;
          }
        }
        timed = true;
        if (ins.op === 'waitUntil' || ins.op === 'turnUntilLine') {
          const v = ins.op === 'turnUntilLine' ? this.sensors() : null;
          if (v ? (b.eye === 'R' ? v.lineR : v.lineL) : this.test(b.cond)) {
            if (v) this.setWheels(0, 0);
            this.entered = false;
            this.go(this.pc + 1);
            continue;
          }
          this.spend(budget);
          budget = 0;
          break;
        }
        const need = this.blkDur - this.blkT;
        if (budget < need) {
          this.blkT += budget;
          this.spend(budget);
          budget = 0;
          break;
        }
        this.spend(need);
        budget -= need;
        if (!this.running) break;
        if (ins.op === 'move' || ins.op === 'moveDeg' || ins.op === 'lineFollow') this.setWheels(0, 0);
        if (ins.op === 'lineFollow') this.follow = null;
        this.entered = false;
        this.go(this.pc + 1);
      }
      if (budget > 1e-9 && this.running && !this.paused) this.spend(budget);
    }
    // khối tức thì
    act(b) {
      const r = this.robot;
      if (b.t === 'motors') this.setWheels(this.num(b.m1), this.num(b.m2));
      else if (b.t === 'motor') {
        const s = Math.max(-100, Math.min(100, this.num(b.speed)));
        if (+b.port === 2) r.vr = (ROBOT.vmax * s) / 100;
        else r.vl = (ROBOT.vmax * s) / 100;
      } else if (b.t === 'stop') {
        this.setWheels(0, 0);
        this.follow = null;
      } else if (b.t === 'move') this.drive(b);
      else if (b.t === 'setVar' || b.t === 'changeVar') {
        this.vars[b.name] = b.t === 'setVar' ? this.val(b.value) : (+this.vars[b.name] || 0) + this.num(b.by);
        this.emit('var', { name: b.name, value: this.vars[b.name] });
      } else if (b.t === 'show') {
        if (!this.shown.includes(b.name)) this.shown.push(b.name);
        this.emit('var', { name: b.name, value: this.vars[b.name] || 0 });
      } else if (b.t === 'timerReset') this.timer0 = this.t;
      else if (b.t === 'buzzer') {
        r.buzzer = !!b.on;
        this.emit('buzzer', r.buzzer);
      }
      else if (b.t === 'led') {
        this.robot.led = b.color;
        this.emit('led', b.color);
      } else if (b.t === 'sound') this.emit('sound', b.tune);
    }
    // sang lệnh to; chế độ từng khối: tạm dừng khi bước sang khối khác
    go(to) {
      const from = this.code[this.pc] ? this.code[this.pc].src : -1;
      this.pc = to;
      if (!this.stepping) return;
      const next = this.code[this.pc] ? this.code[this.pc].src : -1;
      if (next !== from) {
        this.paused = true;
        this.active = next;
        this.emit('paused', next);
      }
    }
    // cho thời gian trôi dt: vật lý + kiểm đích + giới hạn thời gian; trả về 0 (đã tiêu hết)
    spend(dt) {
      if (dt <= 0) return 0;
      this.t += dt;
      this.physics(dt);
      if (!this.running) return 0;
      this.checkGoal();
      if (this.running && this.map.rules.limit && this.t >= this.map.rules.limit) this.finish(false, 'Hết giờ!');
      return 0;
    }
    stepOnce() {
      if (!this.running && !this.start()) return;
      this.stepping = true;
      this.paused = false;
    }
    resume() {
      this.stepping = false;
      this.paused = false;
    }
    programDone() {
      const r = this.robot;
      // khối cuối là chạy mãi: xe vẫn chạy, chờ đích hoặc hết giờ
      if (r.vl || r.vr) {
        if (!this.doneWhileMoving) {
          this.doneWhileMoving = true;
          this.active = -1;
          this.emit('programEnd');
        }
        return; // thời gian còn lại của khung hình vẫn được tick() cho trôi
      }
      this.checkGoal();
      if (this.running) this.finish(!!this.map.rules.free, this.map.rules.free ? 'Chương trình đã chạy xong.' : 'Chương trình đã hết mà xe chưa tới đích.');
    }
    goalReached() {
      const r = this.robot;
      if (this.map.rules.score) {
        const dock = this.map.items.find(i => i.k === 'dock' && i.role === 'goal');
        if (!dock || this.markerIndex !== this.map.items.filter(i => i.k === 'marker').length) return false;
        const c = Math.cos(r.th), s = Math.sin(r.th), wheelRadius = 2.5;
        return [-1, 1].some(side => {
          const x = r.x - s * side * ROBOT.base / 2, y = r.y + c * side * ROBOT.base / 2;
          return x >= dock.x + wheelRadius && x <= dock.x + dock.w - wheelRadius &&
            y >= dock.y + wheelRadius && y <= dock.y + dock.h - wheelRadius;
        });
      }
      const zone = this.map.items.find(z => z.k === 'zone' && z.goal);
      if (!zone || !inRect(r.x, r.y, zone) || this.flags.some(f => !f)) return false;
      return !this.map.rules.stop || (!r.vl && !r.vr);
    }
    checkGoal() {
      if (this.map.rules.free || !this.goalReached()) return;
      if (this.map.rules.score) this.award('finish', 'Về bến B đúng thứ tự', this.map.rules.score.finish);
      this.finish(true, 'Tới đích!');
    }
    finish(ok, text) {
      if (!this.running) return;
      const rules = this.map.rules;
      // Thi đấu: 1 sao từ 120, 2 sao từ 240, 3 sao khi đạt toàn bộ điểm trong thời hạn.
      const stars = rules.score ? (this.score >= 120 ? 1 : 0) + (this.score >= 240 ? 1 : 0) +
        (ok && this.t <= rules.limit && this.score >= (rules.score.departure +
          Math.min(rules.score.markerCap, this.map.items.filter(i => i.k === 'marker').length * rules.score.marker) +
          this.map.items.filter(i => i.k === 'ramp').length * (rules.score.rampPass + rules.score.rampFull) +
          this.map.items.filter(i => i.k === 'button').length * rules.score.button + rules.score.finish) ? 1 : 0) :
        !ok || rules.free ? 0 : 1 + (this.t <= rules.time ? 1 : 0) +
        (rules.star3 === 'noCrash' ? (this.bumps === 0 ? 1 : 0) : countBlocks(this.blocks) <= rules.blocks ? 1 : 0);
      this.result = { ok, text, stars, t: Math.round(this.t * 10) / 10, bumps: this.bumps, blocks: countBlocks(this.blocks) };
      if (rules.score) {
        this.result.points = this.score;
        this.result.scoreLog = this.scoreLog.map(x => ({ ...x }));
      }
      this.running = false;
      this.robot.vl = this.robot.vr = 0;
      this.follow = null;
      this.active = -1;
      this.emit('finish', this.result);
    }
  }

  const API = { ROBOT, MAPS, BLOCKS, SENSOR_KEYS, LIGHT, OPENERS, make, check, matchOf, compile, countBlocks, Sim };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  else root.CodeLab = API;
})(typeof window !== 'undefined' ? window : globalThis);
