// Cảnh câu chuyện Bài 15 lớp 3 (chặng ③): đường đua lực đẩy nhìn ngang. Khung vẽ ở js/scene-kit.js.
// Hình đẹp do Antigravity vẽ trong js/lop3-bai15/art.js (window.Lop3Bai15Art); thiếu hàm nào thì dùng hình dự phòng dưới đây.
(function () {
  'use strict';

  const W = 900, H = 560, G = 430;
  const X0 = 235, SCALE = 5.3, FRONT = 52, GAP = 108, LEN = 120;
  const cartX = cm => X0 + cm * SCALE;
  const markX = cm => X0 + FRONT + cm * SCALE;

  const fallback = {
    background(c) {
      const sky = c.createLinearGradient(0, 0, 0, G);
      sky.addColorStop(0, '#8fd3ff'); sky.addColorStop(1, '#e3f5ff');
      c.fillStyle = sky; c.fillRect(0, 0, W, G);
      c.fillStyle = '#b9dca0'; c.fillRect(0, G - 50, W, 50);
      c.fillStyle = '#8cc152'; c.fillRect(0, G, W, H - G);
    },
    track(c, o) {
      c.fillStyle = '#9b9488'; c.fillRect(0, o.gy, W, 28);
      c.fillStyle = '#c9c3b6'; c.fillRect(0, o.gy, W, 4);
      c.strokeStyle = '#4a4540'; c.fillStyle = '#4a4540'; c.lineWidth = 2; c.font = '12px sans-serif'; c.textAlign = 'center';
      for (let cm = 0; cm <= LEN; cm += 10) {
        const x = o.x0 + cm * o.scale;
        c.beginPath(); c.moveTo(x, o.gy + 4); c.lineTo(x, o.gy + (cm % 20 ? 12 : 18)); c.stroke();
        if (cm % 20 === 0) c.fillText(cm, x, o.gy + 38);
      }
      c.fillStyle = '#fff'; c.fillRect(o.x0 - 3, o.gy - 8, 6, 12);
    },
    flag(c, x, gy, o) {
      c.fillStyle = '#6b5a49'; c.fillRect(x - 2, gy - 90, 4, 94);
      c.fillStyle = o.state === 'ok' ? '#46c46b' : o.state === 'miss' ? '#e0584c' : '#e8453c';
      c.beginPath(); c.moveTo(x + 2, gy - 90); c.lineTo(x + 46, gy - 76); c.lineTo(x + 2, gy - 62); c.fill();
    },
    crate(c, x, y, o) {
      const s = o.big ? 46 : 32;
      c.fillStyle = '#c98f4f'; c.fillRect(x - s / 2, y - s, s, s);
      c.strokeStyle = '#7a5127'; c.lineWidth = 3; c.strokeRect(x - s / 2, y - s, s, s);
      c.beginPath(); c.moveTo(x - s / 2, y - s); c.lineTo(x + s / 2, y); c.stroke();
    },
    robot(c, x, gy, o) {
      c.save(); c.translate(x, gy);
      const sw = Math.sin(o.phase) * 14, sw2 = Math.sin(o.phase + Math.PI) * 14;
      c.strokeStyle = '#41a7bd'; c.lineWidth = 9; c.lineCap = 'round';
      for (const [dx, s] of [[-14, sw], [14, sw2]]) {
        c.beginPath(); c.moveTo(dx, -56); c.lineTo(dx + s, -28); c.lineTo(dx + s * 0.4, 0); c.stroke();
      }
      c.fillStyle = '#e6f2f2'; c.fillRect(-34, -100, 68, 48);
      c.fillStyle = '#44d4df'; c.fillRect(-26, -112, 40, 16);
      c.fillStyle = '#1e283b'; c.beginPath(); c.arc(40, -76, 5, 0, Math.PI * 2); c.fill();
      if (o.upgrades?.wideHead) { c.fillStyle = '#60d9e5'; c.fillRect(34, -100, 10, 56); }
      c.restore();
    },
    cart(c, x, gy, o) {
      c.save(); c.translate(x, gy);
      c.fillStyle = '#f08a38'; c.fillRect(-50, -52, 100, 22);
      c.fillStyle = '#c76b22'; c.fillRect(-50, -34, 100, 4);
      for (const wx of [-26, 28]) {
        c.fillStyle = '#1e283b'; c.beginPath(); c.arc(wx, -18, 18, 0, Math.PI * 2); c.fill();
        c.strokeStyle = '#d6dede'; c.lineWidth = 3; c.save(); c.translate(wx, -18); c.rotate(o.wheelAngle);
        c.beginPath(); c.moveTo(-11, 0); c.lineTo(11, 0); c.moveTo(0, -11); c.lineTo(0, 11); c.stroke(); c.restore();
      }
      if (o.upgrades?.brace) { c.strokeStyle = '#f5a033'; c.lineWidth = 4; c.beginPath(); c.moveTo(-46, -30); c.lineTo(-30, -2); c.moveTo(46, -30); c.lineTo(30, -2); c.stroke(); }
      if (o.upgrades?.backStop) { c.fillStyle = '#e6594d'; c.fillRect(-52, -88, 6, 38); }
      if (o.upgrades?.tray) { c.fillStyle = '#8c6138'; c.fillRect(-40, -56, 80, 5); }
      c.restore();
      fallback.crate(c, x + 2, gy - 52, { big: o.load === 'heavy' });
    }
  };
  const draw = (ctx, kind, ...args) => {
    const art = window.Lop3Bai15Art || {};
    (typeof art[kind] === 'function' ? art[kind] : fallback[kind])(ctx, ...args);
  };

  window.ZMSceneKit.create({
    W, H, idleHidden: sim => sim.running || sim.result,
    draw(ctx, now, sim, kit) {
      const c = sim.course();
      const up = { wideHead: sim.has('wideHead'), brace: sim.has('brace'), backStop: sim.has('backStop'), tray: sim.has('tray') };
      draw(ctx, 'background', { t: now });
      draw(ctx, 'track', { x0: X0 + FRONT, scale: SCALE, gy: G, lines: [c.line], w: W });
      const flagX = markX(c.line);
      draw(ctx, 'flag', flagX, G, { state: sim.result === 'ok' ? 'ok' : sim.result ? 'miss' : 'wait' });
      kit.label(`ĐÍCH ${c.line} cm`, flagX + 24, G - 104, '#7a1d17', 14);
      const cx = cartX(sim.x);
      draw(ctx, 'cart', cx, G, { wheelAngle: sim.x * SCALE / 18, load: c.load, upgrades: up, over: sim.result === 'over' });
      draw(ctx, 'robot', cx - GAP, G, { phase: sim.rev * Math.PI * 2, motorOn: sim.motorOn, upgrades: up });
      ctx.fillStyle = 'rgba(30,40,59,.85)'; ctx.fillRect(17, 15, 250, 54);
      kit.label(sim.advanced ? `LƯỢT ${sim.round + 1}/3 · TẢI ${c.load === 'heavy' ? 'NẶNG' : 'NHẸ'}` : 'ĐẨY XE TỚI VẠCH', 142, 48, '#c3ffce', 18);
      kit.label(`Xe đã đi: ${sim.x.toFixed(1)} cm`, Math.max(70, Math.min(W - 70, cx)), G - 112, '#1e283b', 14);
    },
    onEvent(type, data, kit) {
      if (type === 'sampleDone') {
        kit.toast('ok', 'Đúng như trong sách!', 'Hai chân bước và đẩy xe. Xe chưa tự dừng: thêm Chờ và Dừng để dừng đúng vạch.');
      } else if (type === 'arrived') {
        kit.burst(markX(data.line), G - 70, 18);
        kit.toast('ok', data.round ? `Đạt lượt ${data.round}/3!` : 'Xe dừng đúng vạch!', `Xe dừng ở ${data.x.toFixed(1)} cm sau ${data.secs.toFixed(1)} giây.`);
      } else if (type === 'nextRound') {
        kit.toast('ok', `Lượt ${data.round}/3`, `Vạch ở ${data.line} cm, xe chở ${data.load === 'heavy' ? 'nặng nên đi chậm hơn' : 'nhẹ'}. Chỉnh lại thời gian rồi nhấn Start.`);
      } else if (type === 'miss') {
        kit.shake(.4);
        kit.toast('warn', data.reason === 'short' ? 'Chưa tới vạch' : 'Vượt vạch đích', data.message);
      }
    }
  });
})();
