// Cảnh câu chuyện Lớp 1 Bài 19 (chặng ③): vườn rau ban đêm nhìn từ trên xuống, X/Y là cm, Y hướng lên, theta dương rẽ trái.
// Hình vẽ đẹp ở js/lop1-bai19/art.js (window.Lop1Bai19Art); thiếu art thì dùng hình đơn giản bên dưới.
(function () {
  'use strict';
  const W = 900, H = 560, PX = 3.6, OX = 92, OY = 300;
  const $ = id => document.getElementById(id);
  const xy = (x, y) => [OX + x * PX, OY - y * PX];
  const fx = { eat: {}, hit: {}, win: 0 };
  const retry = { label: 'Thử lại', run: () => window.simEngine?.start() };
  const art = () => window.Lop1Bai19Art || null;

  function round(c, x, y, w, h, r, fill, stroke) {
    c.beginPath(); c.roundRect(x, y, w, h, r);
    c.fillStyle = fill; c.fill();
    if (stroke) { c.strokeStyle = stroke; c.lineWidth = 2.5; c.stroke(); }
  }
  function base(c, sim, t) {
    const A = art();
    if (A && A.background) A.background(c, { t, withNest: false, withFence: false });
    else {
      const g = c.createLinearGradient(0, 0, W, H);
      g.addColorStop(0, '#1d3b3a'); g.addColorStop(1, '#2d5a3d');
      c.fillStyle = g; c.fillRect(0, 0, W, H);
    }
    const [nx, ny] = xy(-8, 0);
    if (A && A.nest) A.nest(c, nx, ny, { r: 46, t });
    else { c.fillStyle = '#c9a14a'; c.beginPath(); c.arc(nx, ny, 40, 0, 2 * Math.PI); c.fill(); }
    const [fxp] = xy(sim.trackEnd() + 8, 0);
    if (A && A.fence) A.fence(c, fxp, H / 2, { h: 520 });
    else { c.fillStyle = '#6d4c41'; c.fillRect(fxp - 8, 20, 16, 520); }
    const z = sim.slipZone();
    if (z) {
      const [a] = xy(z[0], 0), [b] = xy(z[1], 0);
      if (A && A.slimePuddle) A.slimePuddle(c, (a + b) / 2, OY - 22 * PX, { w: b - a + 40, h: 330, t });
      else { c.fillStyle = 'rgba(120,230,190,.25)'; c.fillRect(a, OY - 190, b - a, 330); }
    }
    if (A && A.fireflies) A.fireflies(c, W, H, { t, count: 8 });
  }
  function trail(c, sim) {
    const A = art();
    const pts = sim.trail.map(([x, y]) => { const [px, py] = xy(x, y); return { x: px, y: py }; });
    if (pts.length < 2) return;
    if (A && A.slimeTrail) A.slimeTrail(c, pts, { width: 16 });
    else {
      c.strokeStyle = 'rgba(180,250,220,.55)'; c.lineWidth = 8; c.lineCap = 'round'; c.beginPath();
      pts.forEach((p, i) => (i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y)));
      c.stroke();
    }
  }
  function stone(c, s, i, now) {
    const [x, y] = xy(s.x, s.y), A = art();
    const hit = Math.max(0, 1 - (now - (fx.hit[i] === undefined ? -9 : fx.hit[i])) / 0.7);
    if (A && A.rock) A.rock(c, x, y, { r: 32, hit, shake: hit, variant: i, t: now });
    else { c.fillStyle = '#6f7d73'; c.beginPath(); c.arc(x, y, 30, 0, 2 * Math.PI); c.fill(); c.strokeStyle = '#1e2a34'; c.lineWidth = 3; c.stroke(); }
  }
  function leaf(c, l, i, now, sim) {
    const [x, y] = xy(l.x, l.y), A = art();
    const k = l.eaten ? Math.min(1, (now - (fx.eat[i] === undefined ? now - 1 : fx.eat[i])) / 0.5) : 0;
    if (k >= 1) return;
    if (A && A.leaf) A.leaf(c, x, y, { eaten: k, dewCount: i + 1, pulse: sim.advanced ? 0 : Math.sin(now * 3) * 0.5 + 0.5, t: now, size: 46 });
    else {
      c.fillStyle = '#7bd35b'; c.beginPath(); c.ellipse(x, y, 24 * (1 - k), 16 * (1 - k), 0.4, 0, 2 * Math.PI); c.fill();
      c.strokeStyle = '#1e2a34'; c.lineWidth = 2.5; c.stroke();
    }
  }
  function snail(c, sim, now) {
    const [x, y] = xy(sim.x, sim.y), A = art();
    const win = fx.win ? Math.max(0, 1 - (now - fx.win) / 2.5) : 0;
    c.save();
    if (A && A.snail) {
      A.snail(c, x, y, {
        angle: -sim.theta, t: now, sensorAlert: sim.seesObstacle(), ledColor: 'green', win,
        speed: Math.abs(sim.speed()) / 39.3,
        upgrades: { longAntennae: sim.has('antenna'), bioluminescence: sim.has('glow'), treadWheels: sim.has('grip'), dualHeadlights: sim.has('eyes') }
      });
    } else {
      c.translate(x, y); c.rotate(-sim.theta);
      round(c, -30, -18, 60, 36, 10, '#e6d3a6', '#1e2a34');
      c.fillStyle = '#6fcf4a'; c.beginPath(); c.arc(-6, 0, 15, 0, 2 * Math.PI); c.fill();
    }
    c.restore();
    if (sim.hand) {
      c.save(); c.translate(x, y); c.rotate(-sim.theta);
      c.textAlign = 'center'; c.font = '34px "Segoe UI Emoji",sans-serif';
      c.fillText('✋', 92, -20);
      c.restore();
    }
  }
  function hud(c, sim) {
    const A = art();
    // Chế độ Bé: lá rau đã ăn hiện bằng hình lá, không có số đo
    for (let i = 0; i < sim.leaves.length; i++) {
      const x = 52 + i * 46, y = 44;
      c.globalAlpha = sim.leaves[i].eaten ? 1 : 0.35;
      if (A && A.leaf) A.leaf(c, x, y, { eaten: 0, dewCount: i + 1, t: 0, size: 24 });
      else { c.fillStyle = '#7bd35b'; c.beginPath(); c.arc(x, y, 14, 0, 2 * Math.PI); c.fill(); }
    }
    c.globalAlpha = 1;
    if (sim.advanced) {
      round(c, 52, 503, 470, 42, 12, 'rgba(10,30,30,.78)', null);
      c.textAlign = 'left'; c.fillStyle = '#d6ffe3'; c.font = '600 13px "Be Vietnam Pro",sans-serif';
      c.fillText('Mức 8 ≈ 39,3 cm/giây · Rẽ 1 giây ≈ 57° · Nhớt dính: bò chậm 0,4 lần', 67, 530);
    }
  }
  function draw(ctx, now, sim) {
    base(ctx, sim, now);
    trail(ctx, sim);
    sim.stones.forEach((s, i) => stone(ctx, s, i, now));
    sim.leaves.forEach((l, i) => leaf(ctx, l, i, now, sim));
    snail(ctx, sim, now);
    const A = art();
    if (A && A.sparkles) {
      for (const [i, t0] of Object.entries(fx.eat)) {
        if (now - t0 < 0.9 && sim.leaves[i]) {
          const [x, y] = xy(sim.leaves[i].x, sim.leaves[i].y);
          A.sparkles(ctx, x, y, { t: now, count: 6, radius: 30 });
        }
      }
    }
    hud(ctx, sim);
    $('scene-hand')?.classList.toggle('is-waiting', !!sim.waitingHand);
  }
  function onEvent(type, data, kit) {
    const now = performance.now() / 1000, sim = window.simEngine;
    if (type === 'start') { fx.eat = {}; fx.hit = {}; fx.win = 0; }
    if (type === 'hand') window.SFX?.tone(880, 0.1);
    if (type === 'seen') window.SFX?.tone(1320, 0.12);
    if (type === 'eat') {
      fx.eat[data.index] = now;
      window.SFX?.tone(520, 0.1);
    } else if (type === 'bump') {
      fx.hit[data.stone] = now;
      kit.shake(0.7);
      kit.toast('bad', 'Ốc sên húc đá!', 'Thử rẽ lâu hơn để vòng qua đá.', retry);
    } else if (type === 'crash') {
      kit.shake(0.7);
      kit.toast('bad', 'Ốc sên chạm rào!', 'Thử rẽ sớm hơn trước khi tới rào.', retry);
    } else if (type === 'spin') {
      kit.toast('bad', 'Ốc sên quay tròn!', 'Rẽ lâu quá rồi. Thử rẽ ngắn lại.', retry);
    } else if (type === 'sampleDone') {
      kit.toast('ok', 'Đúng hàng mẫu rồi!', 'Giờ giúp ốc sên ăn đủ 3 lá rau.');
    } else if (type === 'deliver') {
      fx.win = now;
      window.SFX?.ding();
      kit.burst(450, 280, 22);
      kit.toast('ok', 'Ăn đủ 3 lá rau rồi!', 'Ốc sên no bụng và phát sáng.');
    } else if (type === 'short') {
      kit.toast('bad', 'Còn lá rau chưa ăn', 'Thử đổi thời gian rẽ.', retry);
    } else if (type === 'timeout') {
      kit.toast('bad', 'Ốc sên đang chờ', 'Không thấy vật cản. Bấm ✋ đưa tay trước mắt ốc sên.', retry);
    } else if (type === 'target' && sim?.advanced) {
      kit.toast('ok', 'Vườn có vệt nhớt dính!', 'Ốc sên bò chậm lại. Thử Tiến lâu hơn hoặc gắn bánh gai.');
    }
  }
  window.ZMSceneKit.create({
    W, H, draw, onEvent,
    idleHidden: sim => sim.running || sim.x > 0 || sim.y !== 0,
    init(cv) {
      const hand = () => window.simEngine?.putHand();
      $('scene-hand')?.addEventListener('click', hand);
      cv.addEventListener('click', hand);
    }
  });
  const scene = window.ZMScene;
  const enter = scene.enter, leave = scene.leave, dispatch = scene.onEvent;
  let active = false;
  scene.enter = () => { active = true; enter(); };
  scene.leave = () => {
    active = false; leave();
    const toast = $('scene-toast');
    if (toast) toast.hidden = true;
    const btn = $('scene-toast-btn');
    if (btn) btn.onclick = null;
  };
  scene.onEvent = (type, data) => {
    if (!active && ['bump', 'crash', 'spin', 'deliver', 'short', 'timeout', 'target', 'sampleDone'].includes(type)) return;
    dispatch(type, data);
  };
})();
