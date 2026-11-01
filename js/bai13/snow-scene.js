// Cảnh câu chuyện Bài 13 (chặng ③): đường phố có tuyết rơi, ga-ra bên trái, các đống tuyết trên đường, xe dọn tuyết chạy theo chương trình.
// Lấy trạng thái từ window.simEngine (PlowEngine) mỗi khung hình; hình vẽ từ js/bai13/art.js (window.SnowArt) nếu có,
// không thì vẽ hình đơn giản. Cùng giao diện window.ZMScene với cảnh Bài 3: enter, leave, onEvent, setMode.
(function () {
  'use strict';

  const W = 900,
    H = 560;
  const A_X = 110, // px của ga-ra (0 cm)
    PX = 3.2; // px mỗi cm: 230 cm ≈ 736 px
  const $ = id => document.getElementById(id);
  let cv, ctx, dpr = 1, raf = 0, last = 0, mode = 'story', active = false, observer;
  const fx = { puffs: [], shakeUntil: 0, flakes: null };
  const ground = () => (window.SnowArt && window.SnowArt.GROUND_Y) || 430;
  const xOf = cm => A_X + cm * PX;

  function resize() {
    if (!cv) return;
    const w = cv.clientWidth || W;
    dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = Math.round(w * dpr);
    cv.height = Math.round(((w * H) / W) * dpr);
  }
  function label(text, x, y, color, size = 16) {
    ctx.font = `700 ${size}px "Be Vietnam Pro","Segoe UI",sans-serif`;
    ctx.textAlign = 'center';
    ctx.lineWidth = 4;
    ctx.strokeStyle = 'rgba(20,40,70,.75)';
    ctx.strokeText(text, x, y);
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
  }

  // ---------- hình đơn giản khi chưa có js/bai13/art.js ----------
  const Simple = {
    drawBackground(c, now) {
      const g = c.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#b9d3ea');
      g.addColorStop(1, '#e6f0f8');
      c.fillStyle = g;
      c.fillRect(0, 0, W, H);
      c.fillStyle = '#eef4f8';
      c.fillRect(0, 430, W, H - 430);
      c.fillStyle = '#9fb3c4';
      c.fillRect(0, 430, W, 6);
      if (!fx.flakes) fx.flakes = Array.from({ length: 70 }, (_, i) => ({ x: (i * 97) % W, y: (i * 53) % 430, r: 1.5 + (i % 3), v: 25 + (i % 5) * 9 }));
      c.fillStyle = 'rgba(255,255,255,.95)';
      for (const f of fx.flakes) {
        const y = (f.y + now * f.v) % 430;
        c.beginPath();
        c.arc((f.x + Math.sin(now + f.y) * 8 + W) % W, y, f.r, 0, Math.PI * 2);
        c.fill();
      }
    },
    drawStation(c, x) {
      const y = 430;
      c.fillStyle = '#c9d3dc';
      c.strokeStyle = '#1e2a34';
      c.lineWidth = 3;
      c.fillRect(x - 40, y - 80, 80, 80);
      c.strokeRect(x - 40, y - 80, 80, 80);
      c.fillStyle = '#e53935';
      c.beginPath();
      c.moveTo(x - 48, y - 80);
      c.lineTo(x, y - 110);
      c.lineTo(x + 48, y - 80);
      c.closePath();
      c.fill();
      c.stroke();
    },
    drawPile(c, x, k) {
      c.fillStyle = '#fff';
      c.strokeStyle = '#7d93a8';
      c.lineWidth = 3;
      c.beginPath();
      c.ellipse(x, 430, 36 * k, 40 * k, 0, Math.PI, 0);
      c.fill();
      c.stroke();
    },
    drawWall(c, x) {
      c.fillStyle = '#8a97a3';
      c.strokeStyle = '#1e2a34';
      c.lineWidth = 3;
      c.fillRect(x, 330, 40, 100);
      c.strokeRect(x, 330, 40, 100);
    },
    drawPlow(c, x, o) {
      const y = 430;
      c.save();
      c.translate(x + (o.shake ? Math.sin(o.t * 60) * 4 * o.shake : 0), y);
      c.strokeStyle = '#1e2a34';
      c.lineWidth = 3;
      c.fillStyle = '#ffb300';
      c.fillRect(-60, -80, 80, 50);
      c.strokeRect(-60, -80, 80, 50);
      c.fillStyle = '#fff';
      c.fillRect(30, -105, 44, 32);
      c.strokeRect(30, -105, 44, 32);
      c.fillStyle = o.eyes ? '#ffd23f' : '#8a96a3';
      for (const ex of [42, 62]) {
        c.beginPath();
        c.arc(ex, -89, 7, 0, Math.PI * 2);
        c.fill();
        c.stroke();
      }
      for (const wx of [-40, 10]) {
        c.fillStyle = '#3dc1dc';
        c.beginPath();
        c.arc(wx, -22, 22, 0, Math.PI * 2);
        c.fill();
        c.stroke();
        c.beginPath();
        c.moveTo(wx, -22);
        c.lineTo(wx + 18 * Math.cos(o.wheel), -22 + 18 * Math.sin(o.wheel));
        c.stroke();
        if (o.chain) {
          c.setLineDash([4, 4]);
          c.beginPath();
          c.arc(wx, -22, 25, 0, Math.PI * 2);
          c.stroke();
          c.setLineDash([]);
        }
      }
      // lưỡi gạt phía trước: xe cơ bản có lưỡi nhỏ, gắn thêm thì lưỡi to
      c.fillStyle = '#dfe6ec';
      const bh = o.blade ? 60 : 30;
      c.beginPath();
      c.moveTo(74, -4);
      c.lineTo(100, -4 - bh);
      c.lineTo(108, -4 - bh);
      c.lineTo(86, -4);
      c.closePath();
      c.fill();
      c.stroke();
      if (o.beacon) {
        c.fillStyle = Math.sin(o.t * 8) > 0 ? '#ff9800' : '#8a5300';
        c.beginPath();
        c.arc(-20, -88, 8, 0, Math.PI * 2);
        c.fill();
        c.stroke();
      }
      if (o.salt) {
        c.fillStyle = '#7fa6c8';
        c.fillRect(-58, -104, 40, 22);
        c.strokeRect(-58, -104, 40, 22);
      }
      c.restore();
    },
    drawHand(c, x, y, k) {
      c.save();
      c.translate(x, y);
      c.scale(k, k);
      c.fillStyle = '#f2c09a';
      c.strokeStyle = '#1e2a34';
      c.lineWidth = 2.5;
      c.beginPath();
      c.ellipse(0, 0, 18, 22, 0, 0, Math.PI * 2);
      c.fill();
      c.stroke();
      c.restore();
    }
  };
  // Dùng từng hàm của SnowArt nếu có, hàm nào thiếu thì dùng hình đơn giản
  const art = () => {
    const A = window.SnowArt;
    if (!A) return Simple;
    return new Proxy(A, { get: (t, k) => (typeof t[k] === 'function' ? t[k].bind(t) : Simple[k]) });
  };

  // ---------- vẽ ----------
  function frame(ts) {
    raf = 0;
    if (!active || mode !== 'story') return;
    raf = requestAnimationFrame(frame);
    const sim = window.simEngine;
    if (!sim || !ctx) return;
    const now = ts / 1000;
    if (now - last < 1 / 40) return;
    last = now;
    const A = art(),
      G = ground();
    ctx.setTransform(cv.width / W, 0, 0, cv.width / W, 0, 0);
    const hit = now < fx.shakeUntil;
    if (hit) ctx.translate((Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10);
    A.drawBackground(ctx, now);
    A.drawWall(ctx, xOf(sim.trackEnd()) + 10);
    // thước đo (chế độ Nâng cao)
    if (sim.advanced) {
      ctx.strokeStyle = 'rgba(20,40,70,.55)';
      ctx.fillStyle = 'rgba(20,40,70,.8)';
      ctx.lineWidth = 2;
      ctx.font = '600 12px "JetBrains Mono",monospace';
      ctx.textAlign = 'center';
      for (let cm = 0; cm <= sim.trackEnd(); cm += 10) {
        const x = xOf(cm),
          big = cm % 50 === 0;
        ctx.beginPath();
        ctx.moveTo(x, G + 12);
        ctx.lineTo(x, G + (big ? 30 : 22));
        ctx.stroke();
        if (big) ctx.fillText(cm + ' cm', x, G + 46);
      }
    }
    A.drawStation(ctx, xOf(0) - 70, 'A');
    if (!window.SnowArt) label('Ga-ra', xOf(0) - 70, G - 125, '#fff');
    for (const p of sim.piles) if (!p.cleared) A.drawPile(ctx, xOf(p.x), 1);
    // bụi tuyết văng khi đẩy
    fx.puffs = fx.puffs.filter(s => now - s.t0 < 1.2);
    for (const s of fx.puffs) {
      const k = (now - s.t0) / 1.2;
      ctx.globalAlpha = 1 - k;
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(s.x + s.vx * k * 70, s.y + s.vy * k * 70 + 30 * k * k, 7 * (1 - k * 0.5), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    const rx = xOf(sim.x);
    A.drawPlow(ctx, rx, {
      wheel: sim.rev * Math.PI * 2,
      eyes: sim.hand || sim.waitingHand,
      shake: hit ? 1 : 0,
      blade: sim.has('blade'),
      beacon: sim.has('beacon'),
      salt: sim.has('salt'),
      chain: sim.has('chain'),
      t: now
    });
    if (sim.hand) A.drawHand(ctx, rx + 130, G - 95, 1);
    if (sim.advanced) {
      ctx.fillStyle = 'rgba(255,255,255,.9)';
      ctx.strokeStyle = 'rgba(20,40,70,.4)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(14, 14, 250, 70, 10);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#12304f';
      ctx.textAlign = 'left';
      ctx.font = '700 14px "Be Vietnam Pro","Segoe UI",sans-serif';
      ctx.fillText('Tốc độ xe dọn tuyết', 26, 36);
      ctx.font = '500 13px "JetBrains Mono",monospace';
      const sp = p => window.PlowEngine.SPEED(p).toFixed(1).replace('.', ',');
      ctx.fillText(`Mức 4: ${sp(4)} cm/giây`, 26, 56);
      ctx.fillText(`Mức 8: ${sp(8)} cm/giây`, 26, 74);
    }
    const idle = $('scene-idle');
    if (idle) idle.hidden = sim.running || sim.x > 0;
    $('scene-hand')?.classList.toggle('is-waiting', !!sim.waitingHand);
  }

  function stopFrame() {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  }
  function startFrame() {
    if (active && mode === 'story' && ctx && !raf) {
      last = 0;
      raf = requestAnimationFrame(frame);
    }
  }

  // ---------- thông báo chữ to ----------
  let toastTimer = 0;
  function hideToast() {
    clearTimeout(toastTimer);
    toastTimer = 0;
    const el = $('scene-toast');
    if (el) el.hidden = true;
    const btn = $('scene-toast-btn');
    if (btn) btn.onclick = null;
  }
  function toast(kind, title, text, action) {
    const el = $('scene-toast');
    if (!active || !el) return;
    el.dataset.k = kind;
    const titleEl = $('scene-toast-title');
    const textEl = $('scene-toast-text');
    if (titleEl) titleEl.textContent = title;
    if (textEl) textEl.textContent = text;
    const btn = $('scene-toast-btn');
    if (btn) btn.hidden = !action;
    if (btn && action) {
      btn.textContent = action.label;
      btn.onclick = () => {
        hideToast();
        action.run();
      };
    } else if (btn) btn.onclick = null;
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toastTimer = 0;
      if (active) hideToast();
    }, action ? 6000 : 3500);
  }
  const retry = { label: 'Thử lại', run: () => window.simEngine?.start() };

  function onEvent(type, data) {
    const now = performance.now() / 1000,
      sim = window.simEngine;
    if (type === 'start') {
      hideToast();
    } else if (type === 'hand' && window.SFX) window.SFX.tone(880, 0.1);
    else if (type === 'seen' && window.SFX) window.SFX.tone(1320, 0.12);
    else if (type === 'push') {
      for (let i = 0; i < 8; i++) {
        const a = Math.PI * (1 + i / 8);
        fx.puffs.push({ t0: now, x: xOf(data.x), y: ground() - 30, vx: Math.cos(a) * 1.2, vy: Math.sin(a) });
      }
      if (window.SFX) window.SFX.tone(520, 0.1);
    } else if (type === 'crash') {
      fx.shakeUntil = now + 0.7;
      if (window.SFX) window.SFX.tone(140, 0.35);
      toast('bad', 'Ối! Xe đụng tường', 'Xe chạy quá xa. Hãy cho xe chạy ít giây hơn mỗi lần.', retry);
    } else if (type === 'stuck') {
      fx.shakeUntil = now + 0.4;
      if (window.SFX) window.SFX.tone(180, 0.3);
      toast('bad', 'Tuyết dày quá, xe kẹt rồi', `Mức ${data.power} không đẩy nổi tuyết. Hãy chạy mức ${data.need} trở lên hoặc gắn lưỡi gạt tuyết.`, retry);
    } else if (type === 'deliver') {
      if (window.SFX) window.SFX.ding();
      toast('ok', 'Giỏi quá!', `Xe đã dọn sạch ${sim.piles.length} đống tuyết sau ${data.cycles} lần chạy!`);
    } else if (type === 'short') {
      toast('bad', 'Còn tuyết trên đường', `Còn ${data.left} đống tuyết chưa dọn. Hãy dùng khối Lặp lại hoặc cho xe chạy lâu hơn.`, retry);
    } else if (type === 'timeout') {
      toast('bad', 'Xe chờ mãi', 'Cảm biến không thấy vật cản. Bấm nút ✋ để đưa tay trước mắt xe.', retry);
    } else if (type === 'target' && sim?.advanced) {
      toast('ok', 'Bão tuyết!', `Đường dài hơn và có ${data} đống tuyết. Em dọn sạch chỉ với 4 lần chạy được không?`);
    }
  }

  // ---------- chế độ: câu chuyện ⇄ xe 3D ----------
  function setMode(m) {
    mode = m;
    const wrap = $('scene-wrap'), toggle = $('scene-toggle');
    if (wrap) wrap.dataset.mode = m;
    if (toggle) {
      toggle.textContent = m === 'story' ? 'Xem xe thật' : 'Xem câu chuyện';
      toggle.setAttribute('aria-pressed', String(m === 'robot'));
    }
    if (!active) return;
    if (m === 'robot') {
      stopFrame();
      window.ZMSandbox?.open();
    } else {
      window.ZMSandbox?.close();
      startFrame();
    }
    resize();
  }
  function enter() {
    active = true;
    resize();
    observer?.observe(cv);
    if (mode === 'robot') window.ZMSandbox?.open();
    startFrame();
  }
  function leave() {
    active = false;
    stopFrame();
    observer?.disconnect();
    hideToast();
    window.ZMSandbox?.close();
  }

  zmReady(() => {
    cv = $('space-scene');
    if (!cv) return;
    ctx = cv.getContext('2d');
    if (typeof ResizeObserver !== 'undefined') observer = new ResizeObserver(resize);
    $('scene-toggle')?.addEventListener('click', () => setMode(mode === 'story' ? 'robot' : 'story'));
    $('scene-toast-close')?.addEventListener('click', hideToast);
    const hand = () => window.simEngine && window.simEngine.putHand();
    $('scene-hand')?.addEventListener('click', hand);
    cv.addEventListener('click', hand);
    if (active) enter();
  });

  window.ZMScene = { enter, leave, onEvent, setMode, mode: () => mode };
})();
