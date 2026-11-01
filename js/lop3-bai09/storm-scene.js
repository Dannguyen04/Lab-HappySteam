// Cảnh biển Lớp 3 · Bài 9: đồng bộ vị trí, bánh xe, sóng và nâng cấp với StormEngine.
// StormArt có thể được nạp sau scene; mỗi khung hình chọn hàm vẽ của art hoặc bản dự phòng.
(function () {
  'use strict';

  const W = 900, H = 560, Y = 380, START = 112, END = 788;
  const $ = id => document.getElementById(id);
  const xpos = metres => START + Math.max(0, Math.min(30, metres)) / 30 * (END - START);
  let canvas, ctx, active = false, mode = 'story', last = 0, raf = 0, toastTimer = 0, resizeObserver;
  let shakeUntil = 0, sinkStart = 0;

  function resize() {
    if (!canvas) return;
    const width = canvas.clientWidth || W;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(width * H / W * dpr);
  }

  const fallback = {
    waterY(x, t, storm) { return Y + Math.sin(x / 50 + t * (storm ? 3 : 1.5)) * (storm ? 8 : 3); },
    waterAngle(x, t, storm) { return Math.cos(x / 50 + t * (storm ? 3 : 1.5)) * (storm ? 0.13 : 0.04); },
    drawBackground(c, t, weather) {
      c.fillStyle = weather === 'storm' ? '#485c79' : '#a8e2f4';
      c.fillRect(0, 0, W, H);
      c.fillStyle = weather === 'storm' ? '#273951' : '#f7e6ac';
      c.beginPath(); c.arc(720, 105, 42, 0, Math.PI * 2); c.fill();
    },
    drawSea(c, t, weather) {
      c.fillStyle = weather === 'storm' ? '#245779' : '#269cc1';
      c.fillRect(0, Y, W, H - Y);
      c.strokeStyle = 'rgba(255,255,255,.48)'; c.lineWidth = 2;
      for (let row = 0; row < 4; row++) {
        c.beginPath();
        for (let x = 0; x <= W; x += 15) {
          const y = Y + 24 + row * 41 + Math.sin(x / 48 + t * 2 + row) * (weather === 'storm' ? 13 : 5);
          if (!x) c.moveTo(x, y); else c.lineTo(x, y);
        }
        c.stroke();
      }
    },
    drawPort(c, x, y, start) {
      c.fillStyle = '#826445'; c.fillRect(x - 34, y - 8, 68, 22);
      c.fillStyle = '#fbefd3'; c.fillRect(x - 16, y - 44, 32, 36);
      c.fillStyle = '#254759'; c.fillRect(x - 5, y - 30, 11, 22);
    },
    drawLighthouse(c, x, y) {
      c.fillStyle = '#fff'; c.fillRect(x - 12, y - 80, 24, 80);
      c.fillStyle = '#e95e48'; c.fillRect(x - 16, y - 90, 32, 13);
      c.fillStyle = '#ffe078'; c.beginPath(); c.arc(x, y - 85, 5, 0, Math.PI * 2); c.fill();
    },
    drawReef(c, x0, x1, y) {
      c.fillStyle = '#475968'; c.beginPath();
      c.moveTo(x0, y + 22); c.lineTo(x0 + 17, y - 12); c.lineTo((x0 + x1) / 2, y + 10);
      c.lineTo(x1 - 12, y - 17); c.lineTo(x1, y + 22); c.closePath(); c.fill();
    },
    drawBuoy(c, x, y) {
      c.fillStyle = '#f8d14a'; c.beginPath(); c.arc(x, y, 9, 0, Math.PI * 2); c.fill();
      c.strokeStyle = '#e56d40'; c.lineWidth = 3; c.stroke();
    },
    drawBoat(c, x, y, angle, o) {
      c.save(); c.translate(x, y + (o.crashed ? Math.min(28, o.sink * 28) : 0));
      c.rotate(angle + o.tilt * Math.PI / 180);
      c.fillStyle = '#ffbb58'; c.strokeStyle = '#233b52'; c.lineWidth = 3;
      c.beginPath(); c.moveTo(-67, -13); c.lineTo(68, -13); c.lineTo(44, 18); c.lineTo(-45, 18); c.closePath(); c.fill(); c.stroke();
      c.fillStyle = '#fff'; c.beginPath(); c.moveTo(-9, -18); c.lineTo(-9, -100); c.lineTo(44, -18); c.closePath(); c.fill();
      if (o.sail) { c.beginPath(); c.moveTo(-14, -20); c.lineTo(-14, -84); c.lineTo(-45, -20); c.closePath(); c.fill(); }
      if (o.light) { c.fillStyle = '#ffe766'; c.beginPath(); c.arc(60, -17, 7, 0, Math.PI * 2); c.fill(); }
      if (o.float) { c.fillStyle = '#f28542'; c.fillRect(-54, 16, 108, 9); }
      c.restore();
    }
  };
  function art(name) {
    const a = window.StormArt || window.BoatArt;
    return a && typeof a[name] === 'function' ? a[name] : fallback[name];
  }
  function text(s, x, y, size = 17, color = '#fff') {
    ctx.font = `700 ${size}px "Be Vietnam Pro", "Segoe UI", sans-serif`;
    ctx.textAlign = 'center'; ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(17,42,60,.82)';
    ctx.strokeText(s, x, y); ctx.fillStyle = color; ctx.fillText(s, x, y);
  }

  function frame(ms) {
    raf = 0;
    if (!active || !ctx || !canvas || mode !== 'story') return;
    raf = requestAnimationFrame(frame);
    const sim = window.simEngine;
    if (!sim || typeof sim.weather !== 'function') return;
    const t = ms / 1000;
    if (t - last < 1 / 40) return;
    last = t;
    const weather = sim.weather(), storm = weather.kind === 'storm';
    const wave = art('waterY'), slope = art('waterAngle');
    ctx.setTransform(canvas.width / W, 0, 0, canvas.height / H, 0, 0);
    ctx.clearRect(0, 0, W, H);
    if (t < shakeUntil) ctx.translate(Math.sin(t * 65) * 4, 0);
    art('drawBackground')(ctx, t, weather.kind, storm ? 1 : 0);
    art('drawSea')(ctx, t, weather.kind);
    art('drawPort')(ctx, START - 50, Y, true);
    art('drawPort')(ctx, END + 45, Y, false);
    art('drawLighthouse')(ctx, END + 48, Y - 7, t);
    art('drawReef')(ctx, xpos(20), xpos(27), Y + 12, t);
    art('drawBuoy')(ctx, xpos(20), wave(xpos(20), t, storm), t);
    art('drawBuoy')(ctx, xpos(27), wave(xpos(27), t, storm), t);
    const bx = xpos(sim.x), by = wave(bx, t, storm), angle = slope(bx, t, storm);
    art('drawBoat')(ctx, bx, by, angle, {
      wheel: sim.wheel, tilt: sim.tiltDeg(), shake: storm && sim.running ? 0.55 : 0,
      crashed: sim.crashed, crashWhy: sim.crashWhy, sink: sim.crashed ? Math.min(1, (t - sinkStart) / 1.3) : 0,
      float: sim.has('float'), light: sim.has('light'), sail: sim.has('sail'),
      moving: sim.running && Math.abs(sim.velocity()) > 0.1, t
    });
    text('XUẤT PHÁT', START - 40, 310, 14);
    text('ĐÁ NGẦM 20–27 m', (xpos(20) + xpos(27)) / 2, 292, 15, '#ffea8c');
    text('CẢNG 30 m', END + 20, 302, 17, '#c9ffdf');
    text(`${Math.min(30, sim.x).toFixed(1)} / 30 m`, 142, 43, 23);
    if (sim.advanced) {
      text(storm ? '⛈ BÃO: tránh chạy nhanh!' : '☀ Trời quang', 475, 42, 21, storm ? '#ffdcad' : '#fff');
      if (Number.isFinite(weather.next)) text(`Đổi thời tiết sau ${Math.ceil(weather.next)} giây`, 473, 65, 13);
    }
    if (sim.crashed) text(sim.crashWhy === 'wave' ? 'Thuyền bị lật! Hãy thử tốc độ thấp hơn.' : 'Thuyền va đá! Hãy giảm tốc ở bãi đá.', 450, 115, 20, '#ffe3ca');
    if (sim.arrived) text('HOAN HÔ! ĐÃ CẬP CẢNG', 455, 111, 25, '#d7ffe6');
    const idle = $('scene-idle');
    if (idle) idle.hidden = sim.running || sim.arrived || sim.crashed || sim.x > 0;
  }

  function toast(kind, title, message, action) {
    const el = $('scene-toast');
    if (!el) return;
    el.dataset.k = kind;
    const h = $('scene-toast-title'), p = $('scene-toast-text'), btn = $('scene-toast-btn');
    if (h) h.textContent = title;
    if (p) p.textContent = message;
    if (btn) {
      btn.hidden = !action;
      btn.onclick = action ? () => { el.hidden = true; action.run(); } : null;
      if (action) btn.textContent = action.label;
    }
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.hidden = true; }, action ? 6500 : 3200);
  }
  function onEvent(type, data) {
    if (!active) return;
    const sim = window.simEngine;
    if (type === 'start') { const el = $('scene-toast'); if (el) el.hidden = true; sinkStart = 0; }
    else if (type === 'warn' && data === 'reef') toast('warn', 'Sắp tới bãi đá ngầm!', 'Từ 20 đến 27 m hãy chọn Low; có đèn dẫn đường thì được dùng Medium.');
    else if (type === 'weather' && data.kind === 'storm') toast('warn', 'Bão đang đến!', 'Gió đẩy lùi thuyền. Giảm tốc hoặc dừng chờ bão qua.');
    else if (type === 'crash') {
      sinkStart = performance.now() / 1000; shakeUntil = sinkStart + 0.8;
      toast('bad', data === 'wave' ? 'Thuyền bị lật!' : 'Thuyền va đá ngầm!',
        data === 'wave' ? 'Không chạy High quá lâu khi có bão. Thử gắn phao thăng bằng.' : 'Giảm tốc về Low khi đi qua 20–27 m.',
        sim ? { label: 'Thử lại', run: () => sim.start() } : null);
    } else if (type === 'arrive') {
      toast('ok', 'Cập cảng thành công!', `Em đã đi hết 30 m sau ${data.secs.toFixed(1)} giây${data.storm ? ', vượt qua bão' : ''}.`);
      if (window.SFX?.ding) window.SFX.ding();
    } else if (type === 'sampleDone') toast('ok', 'Đúng chương trình mẫu!', 'M1 đã chạy Low → Medium → High, mỗi mức chờ 3 giây.');
  }

  function setMode(next) {
    if (next !== 'story' && next !== 'robot') return;
    mode = next;
    const wrap = $('scene-wrap'), btn = $('scene-toggle');
    if (wrap) wrap.dataset.mode = next;
    if (btn) { btn.textContent = next === 'story' ? 'Xem robot thật' : 'Xem câu chuyện'; btn.setAttribute('aria-pressed', String(next === 'robot')); }
    if (active) {
      if (next === 'robot') {
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
        window.ZMSandbox?.open();
      } else {
        window.ZMSandbox?.close();
        if (!raf && ctx) raf = requestAnimationFrame(frame);
      }
    }
    resize();
  }
  function enter() {
    if (active) return;
    active = true;
    last = 0;
    if (canvas) resizeObserver?.observe(canvas);
    resize();
    if (mode === 'robot') window.ZMSandbox?.open();
    else if (ctx && !raf) raf = requestAnimationFrame(frame);
  }
  function leave() {
    active = false;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    resizeObserver?.disconnect();
    clearTimeout(toastTimer);
    toastTimer = 0;
    const toastEl = $('scene-toast'), toastBtn = $('scene-toast-btn');
    if (toastEl) toastEl.hidden = true;
    if (toastBtn) toastBtn.onclick = null;
    window.ZMSandbox?.close();
  }

  if (typeof zmReady === 'function') zmReady(() => {
    canvas = $('space-scene');
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    if (typeof ResizeObserver !== 'undefined') resizeObserver = new ResizeObserver(resize);
    const btn = $('scene-toggle');
    if (btn) btn.addEventListener('click', () => setMode(mode === 'story' ? 'robot' : 'story'));
    const close = $('scene-toast-close');
    if (close) close.addEventListener('click', () => { const el = $('scene-toast'); if (el) el.hidden = true; });
    // app.js dùng nhãn chung "Bé"; riêng Lớp 3 phải hiển thị "Cơ bản".
    const modeBtn = $('btn-mode');
    if (modeBtn && typeof MutationObserver !== 'undefined') {
      const labelObserver = new MutationObserver(() => {
        if (modeBtn.textContent === 'Chế độ: Bé') modeBtn.textContent = 'Chế độ: Cơ bản';
      });
      labelObserver.observe(modeBtn, { childList: true, characterData: true, subtree: true });
      if (modeBtn.textContent === 'Chế độ: Bé') modeBtn.textContent = 'Chế độ: Cơ bản';
    }
    resize();
  });
  window.ZMScene = { enter, leave, onEvent, setMode, mode: () => mode };
})();
