// Cảnh câu chuyện Bài 10 (chặng ③): cánh đồng gió – cối xoay gió quay theo chương trình, dây điện sạc cục pin,
// pin có điện thì ngôi nhà sáng đèn. Hình vẽ từ js/bai10/art.js (window.WindArt) nếu có, không thì hình đơn giản.
// Nút đỏ trên cảnh (hoặc phím cách) = nhấn cảm biến chạm. Cùng giao diện window.ZMScene với các bài khác.
(function () {
  'use strict';

  const W = 900,
    H = 560;
  const MILL_X = 260,
    BAT = [560, 360],
    HOUSE_X = 720;
  const $ = id => document.getElementById(id);
  let cv, ctx, raf = 0, last = 0, mode = 'story', active = false;
  const fx = { stars: [], shakeUntil: 0, flash: 0 };

  function resize() {
    if (!cv) return;
    const w = cv.clientWidth || W,
      dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = Math.round(w * dpr);
    cv.height = Math.round(((w * H) / W) * dpr);
  }
  function label(text, x, y, color, size = 16) {
    ctx.font = `700 ${size}px "Be Vietnam Pro","Segoe UI",sans-serif`;
    ctx.textAlign = 'center';
    ctx.lineWidth = 4;
    ctx.strokeStyle = 'rgba(20,40,30,.7)';
    ctx.strokeText(text, x, y);
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
  }

  // ---------- hình đơn giản khi chưa có js/bai10/art.js ----------
  const G = 440;
  const Simple = {
    GROUND_Y: G,
    drawBackground(c, t, weather) {
      const sky = { calm: ['#8fd3ff', '#d9f1ff'], light: ['#8fd3ff', '#d9f1ff'], strong: ['#9fb4c8', '#d5dde5'], storm: ['#4b4f6b', '#7d7f95'] }[weather] || ['#8fd3ff', '#d9f1ff'];
      const g = c.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, sky[0]);
      g.addColorStop(1, sky[1]);
      c.fillStyle = g;
      c.fillRect(0, 0, W, H);
      c.fillStyle = weather === 'storm' ? '#4f7d3a' : '#7cc35a';
      c.beginPath();
      c.ellipse(200, G + 40, 420, 90, 0, Math.PI, 0);
      c.ellipse(720, G + 50, 380, 80, 0, Math.PI, 0);
      c.fill();
      c.fillRect(0, G, W, H - G);
      if (weather === 'storm') {
        c.strokeStyle = 'rgba(220,230,255,.5)';
        c.lineWidth = 2;
        for (let i = 0; i < 40; i++) {
          const x = (i * 97 + t * 400) % (W + 100) - 50,
            y = (i * 53 + t * 700) % H;
          c.beginPath();
          c.moveTo(x, y);
          c.lineTo(x - 10, y + 22);
          c.stroke();
        }
      }
    },
    drawWindLines(c, t, s) {
      if (!s) return;
      c.strokeStyle = `rgba(255,255,255,${0.35 + 0.4 * s})`;
      c.lineWidth = 3;
      c.lineCap = 'round';
      for (let i = 0; i < 6; i++) {
        const y = 80 + i * 45,
          x = ((t * (120 + 260 * s) + i * 170) % (W + 200)) - 100;
        c.beginPath();
        c.moveTo(x, y);
        c.quadraticCurveTo(x + 40, y - 10, x + 90, y);
        c.stroke();
      }
    },
    drawWindmill(c, x, o) {
      const hubY = G - 260;
      c.save();
      if (o.shake) c.translate(Math.sin(o.t * 50) * 3 * o.shake, 0);
      c.fillStyle = '#3dc1dc';
      c.strokeStyle = '#1e2a34';
      c.lineWidth = 3;
      c.fillRect(x - 55, G - 46, 110, 46);
      c.strokeRect(x - 55, G - 46, 110, 46);
      c.fillStyle = '#fff';
      c.fillRect(x - 55, G - 62, 110, 18);
      c.strokeRect(x - 55, G - 62, 110, 18);
      c.fillStyle = o.pressed ? '#9e1b1b' : '#e53935';
      c.beginPath();
      c.ellipse(x + 30, G - 64 + (o.pressed ? 3 : 0), 12, 6, 0, 0, Math.PI * 2);
      c.fill();
      c.stroke();
      c.fillStyle = '#fff';
      c.fillRect(x - 12, hubY, 24, G - 62 - hubY);
      c.strokeRect(x - 12, hubY, 24, G - 62 - hubY);
      c.fillRect(x - 22, hubY - 26, 44, 52);
      c.strokeRect(x - 22, hubY - 26, 44, 52);
      if (o.tail) {
        c.fillStyle = '#3dc1dc';
        c.beginPath();
        c.moveTo(x + 22, hubY);
        c.lineTo(x + 80, hubY - 22);
        c.lineTo(x + 80, hubY + 22);
        c.closePath();
        c.fill();
        c.stroke();
      }
      if (o.light) {
        c.fillStyle = Math.sin(o.t * 5) > 0 ? '#e53935' : '#6d1414';
        c.beginPath();
        c.arc(x, hubY - 36, 7, 0, Math.PI * 2);
        c.fill();
        c.stroke();
      }
      const n = o.blades || 3,
        len = o.long ? 150 : 110;
      for (let i = 0; i < n; i++) {
        const a = o.angle + (i * Math.PI * 2) / n;
        c.save();
        c.translate(x, hubY);
        c.rotate(a);
        c.fillStyle = '#fff';
        c.beginPath();
        c.roundRect(-8, -len, 16, len - 8, 8);
        c.fill();
        c.stroke();
        c.restore();
      }
      c.fillStyle = '#3dc1dc';
      c.beginPath();
      c.arc(x, hubY, 12, 0, Math.PI * 2);
      c.fill();
      c.stroke();
      c.restore();
    },
    drawHouse(c, x, glow) {
      if (glow > 0) {
        const g = c.createRadialGradient(x, G - 60, 10, x, G - 60, 140);
        g.addColorStop(0, `rgba(255,220,90,${0.45 * glow})`);
        g.addColorStop(1, 'rgba(255,220,90,0)');
        c.fillStyle = g;
        c.fillRect(x - 160, G - 200, 320, 200);
      }
      c.fillStyle = '#fff3e0';
      c.strokeStyle = '#1e2a34';
      c.lineWidth = 3;
      c.fillRect(x - 60, G - 90, 120, 90);
      c.strokeRect(x - 60, G - 90, 120, 90);
      c.fillStyle = '#e8892b';
      c.beginPath();
      c.moveTo(x - 75, G - 90);
      c.lineTo(x, G - 150);
      c.lineTo(x + 75, G - 90);
      c.closePath();
      c.fill();
      c.stroke();
      c.fillStyle = glow > 0 ? `rgb(255,${200 + 30 * glow},${60 + 40 * glow})` : '#41505e';
      for (const wx of [-35, 15]) {
        c.fillRect(x + wx, G - 70, 22, 22);
        c.strokeRect(x + wx, G - 70, 22, 22);
      }
    },
    drawBattery(c, x, y, level) {
      c.strokeStyle = '#1e2a34';
      c.lineWidth = 3;
      c.fillStyle = '#fff';
      c.fillRect(x - 26, y - 50, 52, 100);
      c.strokeRect(x - 26, y - 50, 52, 100);
      c.fillRect(x - 10, y - 60, 20, 10);
      c.strokeRect(x - 10, y - 60, 20, 10);
      const h = 92 * Math.max(0, Math.min(1, level));
      c.fillStyle = level >= 1 ? '#43a047' : level > 0.3 ? '#8cc152' : '#f4a742';
      c.fillRect(x - 22, y + 46 - h, 44, h);
    },
    drawCable(c, x1, y1, x2, y2, t, flow) {
      c.strokeStyle = '#1e2a34';
      c.lineWidth = 3;
      c.beginPath();
      c.moveTo(x1, y1);
      c.quadraticCurveTo((x1 + x2) / 2, Math.max(y1, y2) + 30, x2, y2);
      c.stroke();
      if (!flow) return;
      c.fillStyle = '#ffd23f';
      for (let i = 0; i < 4; i++) {
        const k = (t * (0.4 + flow) + i / 4) % 1,
          mx = (x1 + x2) / 2,
          my = Math.max(y1, y2) + 30;
        const px = (1 - k) * (1 - k) * x1 + 2 * (1 - k) * k * mx + k * k * x2,
          py = (1 - k) * (1 - k) * y1 + 2 * (1 - k) * k * my + k * k * y2;
        c.beginPath();
        c.arc(px, py, 5, 0, Math.PI * 2);
        c.fill();
      }
    }
  };
  const art = () => window.WindArt || Simple;

  function frame(ts) {
    raf = requestAnimationFrame(frame);
    const sim = window.simEngine;
    if (!sim || !ctx || mode !== 'story') return;
    const now = ts / 1000;
    if (now - last < 1 / 40) return;
    last = now;
    const A = art(),
      gy = A.GROUND_Y || G;
    ctx.setTransform(cv.width / W, 0, 0, cv.width / W, 0, 0);
    const w = sim.weather();
    if (now < fx.shakeUntil) ctx.translate((Math.random() - 0.5) * 8, 0);
    A.drawBackground(ctx, now, w.kind);
    A.drawWindLines(ctx, now, { light: 0.35, strong: 0.75, storm: 1 }[w.kind] || 0);
    const level = sim.battery / 100,
      flow = sim.chargeRate() / 12;
    A.drawCable(ctx, MILL_X + 55, gy - 20, BAT[0] - 26, BAT[1] + 20, now, flow);
    A.drawCable(ctx, BAT[0] + 26, BAT[1] + 20, HOUSE_X - 60, gy - 30, now, level > 0 ? 0.5 : 0);
    A.drawBattery(ctx, BAT[0], BAT[1], level);
    A.drawHouse(ctx, HOUSE_X, Math.min(1, level * 1.4));
    A.drawWindmill(ctx, MILL_X, {
      angle: sim.rev * Math.PI * 2,
      blades: sim.has('more') ? 6 : 3,
      long: sim.has('long'),
      light: sim.has('light'),
      tail: sim.has('tail'),
      pressed: sim.pressed,
      shake: w.kind === 'storm' && sim.rpm() > 0 ? 1 : 0,
      t: now
    });
    label(`Pin ${Math.floor(sim.battery)}%`, BAT[0], BAT[1] + 80, '#fff');
    if (sim.broken) label('Cánh quạt gãy!', MILL_X, gy - 330, '#ffb4a8', 20);
    if (sim.advanced) {
      const names = { light: 'Gió nhẹ', strong: 'Gió mạnh', storm: 'BÃO!' };
      ctx.fillStyle = w.kind === 'storm' ? 'rgba(120,20,20,.85)' : 'rgba(255,255,255,.88)';
      ctx.beginPath();
      ctx.roundRect(14, 14, 230, 60, 10);
      ctx.fill();
      ctx.fillStyle = w.kind === 'storm' ? '#fff' : '#1e2a34';
      ctx.textAlign = 'left';
      ctx.font = '700 18px "Be Vietnam Pro","Segoe UI",sans-serif';
      ctx.fillText(names[w.kind], 26, 40);
      ctx.font = '500 13px "Be Vietnam Pro","Segoe UI",sans-serif';
      ctx.fillText(sim.running && Number.isFinite(w.next) ? `Thời tiết đổi sau ${Math.ceil(w.next)} giây` : 'Thời tiết ổn định', 26, 62);
    }
    fx.stars = fx.stars.filter(s => now - s.t0 < 1.4);
    for (const s of fx.stars) {
      const k = (now - s.t0) / 1.4;
      ctx.globalAlpha = 1 - k;
      ctx.fillStyle = s.c;
      ctx.beginPath();
      ctx.arc(s.x + s.vx * k * 90, s.y + s.vy * k * 90, 7, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    $('scene-idle').hidden = sim.running || sim.battery > 0;
    $('scene-press').classList.toggle('is-waiting', !!sim.waitingPress);
  }

  let toastTimer = 0;
  function toast(kind, title, text, action) {
    const el = $('scene-toast');
    el.dataset.k = kind;
    $('scene-toast-title').textContent = title;
    $('scene-toast-text').textContent = text;
    const btn = $('scene-toast-btn');
    btn.hidden = !action;
    if (action) {
      btn.textContent = action.label;
      btn.onclick = () => {
        el.hidden = true;
        action.run();
      };
    }
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (el.hidden = true), action ? 6000 : 3000);
  }

  function onEvent(type, data) {
    const now = performance.now() / 1000,
      sim = window.simEngine;
    if (type === 'start') $('scene-toast').hidden = true;
    else if (type === 'press' && window.SFX) window.SFX.tone(990, 0.08);
    else if (type === 'full') {
      for (let i = 0; i < 14; i++) {
        const a = (i / 14) * Math.PI * 2;
        fx.stars.push({ t0: now, x: HOUSE_X, y: 300, vx: Math.cos(a), vy: Math.sin(a), c: ['#ffd23f', '#fff', '#8cc152'][i % 3] });
      }
      if (window.SFX) window.SFX.ding();
      toast('ok', 'Nhà sáng đèn rồi!', data.storm ? 'Cối xoay gió vượt qua cơn bão và sạc đầy pin. Giỏi quá!' : `Cối xoay gió đã sạc đầy pin sau ${data.secs.toFixed(1)} giây.`);
    } else if (type === 'weather' && data.kind === 'storm') {
      toast('bad', 'Bão tới!', 'Nhấn nút đỏ để cánh quạt dừng, kẻo gãy cánh.');
    } else if (type === 'broken') {
      fx.shakeUntil = now + 0.7;
      if (window.SFX) window.SFX.tone(140, 0.35);
      toast('bad', 'Ối! Cánh quạt gãy', 'Khi bão tới, hãy nhấn nút cho cánh quạt dừng lại.', { label: 'Thử lại', run: () => sim.start() });
    } else if (type === 'sampleDone') {
      toast('ok', 'Đúng như trong sách!', 'Mỗi lần nhấn nút, cánh quạt đổi tốc độ: chậm → vừa → nhanh → dừng.');
    }
  }

  function setMode(m) {
    mode = m;
    $('scene-wrap').dataset.mode = m;
    $('scene-toggle').textContent = m === 'story' ? 'Xem robot thật' : 'Xem câu chuyện';
    $('scene-toggle').setAttribute('aria-pressed', String(m === 'robot'));
    if (!active) return;
    if (m === 'robot') window.ZMSandbox?.open();
    else window.ZMSandbox?.close();
    resize();
  }
  function enter() {
    active = true;
    resize();
    if (mode === 'robot') window.ZMSandbox?.open();
  }
  function leave() {
    active = false;
    window.ZMSandbox?.close();
  }

  document.addEventListener('DOMContentLoaded', () => {
    cv = $('space-scene');
    if (!cv) return;
    ctx = cv.getContext('2d');
    new ResizeObserver(resize).observe(cv);
    $('scene-toggle').addEventListener('click', () => setMode(mode === 'story' ? 'robot' : 'story'));
    $('scene-toast-close').addEventListener('click', () => ($('scene-toast').hidden = true));
    const press = () => window.simEngine && window.simEngine.press();
    $('scene-press').addEventListener('click', press);
    cv.addEventListener('click', press);
    // Phím cách = nhấn nút (khi đang ở chặng ③, không gõ trong ô nhập)
    document.addEventListener('keydown', e => {
      if (e.code !== 'Space' || !active || /INPUT|TEXTAREA|BUTTON|SELECT/.test(document.activeElement.tagName)) return;
      e.preventDefault();
      press();
    });
    raf = requestAnimationFrame(frame);
  });

  window.ZMScene = { enter, leave, onEvent, setMode, mode: () => mode };
})();
