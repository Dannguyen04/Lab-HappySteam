// Cảnh câu chuyện Bài 2 (chặng ③): đường đua nhìn ngang có dốc, vạch đích, ô đỗ xe và tường lốp.
// Lấy trạng thái từ window.simEngine (RaceEngine) mỗi khung hình; hình vẽ từ js/bai02/art.js (window.RaceArt) nếu có,
// không thì vẽ hình đơn giản (Simple). Cùng giao diện window.ZMScene với cảnh Bài 3: enter, leave, onEvent, setMode.
//
// Giao diện RaceArt: { W, H, drawBackground(ctx,t), drawTrack(ctx,pts), drawCar(ctx,x,y,angle,o), drawFinish(ctx,x,y),
// drawParking(ctx,x0,x1,y), drawWall(ctx,x,y), PICS } – pts là đường gấp khúc mặt đường [[x,y],…] từ trái sang phải;
// (x,y) của xe là điểm trên mặt đường dưới tâm xe; angle là độ dốc (âm = ngẩng đầu lên); xe quay mặt sang phải (+x), dài ≈ 140 px;
// o = { wheel, shake 0–1, flip 0–1, wing, bigwheel, nose, lights, number, t }.
(function () {
  'use strict';

  const W = 900,
    H = 560;
  const G = 400, // y mặt đường phẳng đầu tiên
    RISE = 70, // độ cao dốc (px)
    A_X = 70; // px của vạch xuất phát
  const $ = id => document.getElementById(id);
  let cv, ctx, dpr = 1, raf = 0, last = 0, mode = 'story', active = false;
  const fx = { shakeUntil: 0, flipAt: 0, stars: [] };

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
    ctx.strokeStyle = 'rgba(20,40,60,.75)';
    ctx.strokeText(text, x, y);
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
  }

  // ---------- hình đơn giản khi chưa có js/bai02/art.js ----------
  const Simple = {
    drawBackground(c) {
      const g = c.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#8fd3f4');
      g.addColorStop(1, '#e6f6ff');
      c.fillStyle = g;
      c.fillRect(0, 0, W, H);
      c.fillStyle = '#7cc47a';
      c.fillRect(0, 440, W, H - 440);
    },
    drawTrack(c, pts) {
      c.beginPath();
      c.moveTo(pts[0][0], H);
      for (const p of pts) c.lineTo(p[0], p[1]);
      c.lineTo(pts[pts.length - 1][0], H);
      c.closePath();
      c.fillStyle = '#6b7480';
      c.fill();
      c.beginPath();
      pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])));
      c.strokeStyle = '#2f3640';
      c.lineWidth = 6;
      c.lineJoin = 'round';
      c.stroke();
    },
    drawCar(c, x, y, angle, o) {
      c.save();
      c.translate(x + (o.shake ? Math.sin(o.t * 60) * 4 * o.shake : 0), y);
      c.rotate(angle);
      if (o.flip) {
        c.translate(0, -30 * o.flip);
        c.rotate(Math.PI * o.flip);
      }
      c.strokeStyle = '#1e2a34';
      c.lineWidth = 3;
      const R = o.bigwheel ? 26 : 20;
      // thân xe
      c.fillStyle = '#e53935';
      c.beginPath();
      c.roundRect(-62, -R * 2 + 4 - 18, 124, 30, 8);
      c.fill();
      c.stroke();
      c.fillStyle = '#ffd23f';
      c.fillRect(-20, -R * 2 - 12, 34, 14);
      c.strokeRect(-20, -R * 2 - 12, 34, 14);
      // mũi xe
      c.fillStyle = '#e53935';
      c.beginPath();
      if (o.nose) {
        c.moveTo(62, -R * 2 - 14);
        c.lineTo(100, -R * 2 + 2);
        c.lineTo(62, -R * 2 + 12);
      } else {
        c.moveTo(62, -R * 2 - 14);
        c.lineTo(78, -R * 2 - 4);
        c.lineTo(62, -R * 2 + 12);
      }
      c.closePath();
      c.fill();
      c.stroke();
      if (o.wing) {
        c.fillStyle = '#1f4aa6';
        c.fillRect(-66, -R * 2 - 38, 36, 8);
        c.strokeRect(-66, -R * 2 - 38, 36, 8);
        c.beginPath();
        c.moveTo(-50, -R * 2 - 30);
        c.lineTo(-50, -R * 2 - 12);
        c.stroke();
      }
      if (o.number) {
        c.fillStyle = '#fff';
        c.font = '700 16px "Be Vietnam Pro","Segoe UI",sans-serif';
        c.textAlign = 'center';
        c.fillText(o.number, -42, -R * 2 + 2);
      }
      if (o.lights) {
        c.fillStyle = '#fff59d';
        c.beginPath();
        c.arc(66, -R * 2 - 4, 6, 0, Math.PI * 2);
        c.fill();
        c.stroke();
        const g = c.createLinearGradient(70, 0, 150, 0);
        g.addColorStop(0, 'rgba(255,245,157,.6)');
        g.addColorStop(1, 'rgba(255,245,157,0)');
        c.fillStyle = g;
        c.beginPath();
        c.moveTo(72, -R * 2 - 4);
        c.lineTo(150, -R * 2 - 30);
        c.lineTo(150, -R * 2 + 22);
        c.closePath();
        c.fill();
      }
      // bánh xe: sau to, trước nhỏ
      for (const [wx, r] of [[-38, R], [44, 14]]) {
        c.fillStyle = '#333';
        c.beginPath();
        c.arc(wx, -r, r, 0, Math.PI * 2);
        c.fill();
        c.stroke();
        c.fillStyle = '#3dc1dc';
        c.beginPath();
        c.arc(wx, -r, r * 0.55, 0, Math.PI * 2);
        c.fill();
        c.beginPath();
        c.moveTo(wx, -r);
        c.lineTo(wx + r * 0.55 * Math.cos(o.wheel), -r + r * 0.55 * Math.sin(o.wheel));
        c.stroke();
      }
      c.restore();
    },
    drawFinish(c, x, y) {
      c.save();
      c.translate(x, y);
      c.strokeStyle = '#1e2a34';
      c.lineWidth = 4;
      c.beginPath();
      c.moveTo(0, 0);
      c.lineTo(0, -110);
      c.stroke();
      for (let r = 0; r < 3; r++)
        for (let k = 0; k < 4; k++) {
          c.fillStyle = (r + k) % 2 ? '#111' : '#fff';
          c.fillRect(k * 11, -110 + r * 11, 11, 11);
        }
      c.restore();
    },
    drawParking(c, x0, x1, y) {
      c.fillStyle = 'rgba(255,235,59,.55)';
      c.fillRect(x0, y - 6, x1 - x0, 12);
      c.strokeStyle = '#fff';
      c.lineWidth = 4;
      c.strokeRect(x0, y - 6, x1 - x0, 12);
      c.font = '700 22px "Be Vietnam Pro","Segoe UI",sans-serif';
      c.fillStyle = '#fff';
      c.textAlign = 'center';
      c.fillText('P', (x0 + x1) / 2, y + 28);
    },
    drawWall(c, x, y) {
      for (let i = 0; i < 3; i++)
        for (let k = 0; k < 2; k++) {
          c.fillStyle = '#222';
          c.strokeStyle = '#888';
          c.lineWidth = 3;
          c.beginPath();
          c.ellipse(x + k * 8, y - 18 - i * 30, 22, 15, 0, 0, Math.PI * 2);
          c.fill();
          c.stroke();
        }
    },
    PICS: {}
  };
  const art = () => window.RaceArt || Simple;

  // ---------- đường đua theo chế độ ----------
  let cache = null;
  function layout(sim) {
    const T = sim.track();
    if (cache && cache.T === T) return cache;
    const px = (W - A_X - 40) / (T.wall + 8); // px mỗi cm
    const xs = [0],
      ys = [G];
    let y = G;
    for (const s of T.sections) {
      if (s.kind === 'up') y -= RISE;
      else if (s.kind === 'down') y += RISE;
      xs.push(s.to);
      ys.push(y);
    }
    xs.push(T.wall + 8);
    ys.push(y);
    cache = { T, px, xs, ys };
    return cache;
  }
  const xOf = (L, cm) => A_X + cm * L.px;
  function yOf(L, cm) {
    const { xs, ys } = L;
    if (cm <= 0) return ys[0];
    for (let i = 1; i < xs.length; i++) if (cm <= xs[i]) return ys[i - 1] + ((ys[i] - ys[i - 1]) * (cm - xs[i - 1])) / (xs[i] - xs[i - 1]);
    return ys[ys.length - 1];
  }
  function slopeAngle(L, cm) {
    const d = 3 / L.px; // ±3 px
    return Math.atan2(yOf(L, cm + d) - yOf(L, cm - d), 6);
  }

  // ---------- vẽ ----------
  function frame(ts) {
    raf = requestAnimationFrame(frame);
    const sim = window.simEngine;
    if (!sim || !ctx || mode !== 'story') return;
    const now = ts / 1000;
    if (now - last < 1 / 40) return;
    last = now;
    const A = art(),
      L = layout(sim),
      T = L.T;
    ctx.setTransform(cv.width / W, 0, 0, cv.width / W, 0, 0);
    const hit = now < fx.shakeUntil;
    if (hit) ctx.translate((Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10);
    A.drawBackground(ctx, now);
    const pts = [[0, G]];
    L.xs.forEach((cm, i) => pts.push([xOf(L, cm), L.ys[i]]));
    pts[1] = [A_X, G];
    A.drawTrack(ctx, pts);
    // vạch xuất phát
    ctx.fillStyle = '#fff';
    ctx.fillRect(A_X - 2, G - 2, 4, 14);
    label('Xuất phát', A_X, G + 34, '#fff', 14);
    // thước đo (Nâng cao)
    if (sim.advanced) {
      ctx.fillStyle = '#fff';
      ctx.font = '600 11px "JetBrains Mono",monospace';
      ctx.textAlign = 'center';
      for (let cm = 0; cm <= T.wall; cm += 20) {
        const x = xOf(L, cm),
          y = yOf(L, cm);
        ctx.fillRect(x - 1, y + 6, 2, 8);
        ctx.fillText(String(cm), x, y + 28);
      }
    }
    A.drawParking(ctx, xOf(L, T.park[0]), xOf(L, T.park[1]), yOf(L, (T.park[0] + T.park[1]) / 2));
    A.drawFinish(ctx, xOf(L, T.finish), yOf(L, T.finish));
    A.drawWall(ctx, xOf(L, T.wall), yOf(L, T.wall));
    if (!window.RaceArt) {
      label('Đích', xOf(L, T.finish), yOf(L, T.finish) - 120, '#fff', 15);
    }
    label('Ô đỗ', xOf(L, (T.park[0] + T.park[1]) / 2), yOf(L, T.park[0]) + 54, '#ffeb3b', 15);
    // xe
    const cx = xOf(L, sim.x),
      cy = yOf(L, sim.x);
    const flip = sim.flipped ? Math.min(1, (now - fx.flipAt) / 0.8) : 0;
    A.drawCar(ctx, cx, cy, slopeAngle(L, sim.x), {
      wheel: sim.rev * Math.PI * 2,
      shake: hit ? 1 : 0,
      flip,
      wing: sim.has('wing'),
      bigwheel: sim.has('bigwheel'),
      nose: sim.has('nose'),
      lights: sim.has('lights'),
      number: sim.has('lights') ? '07' : '',
      t: now
    });
    drawStars(now);
    if (sim.advanced) {
      ctx.fillStyle = 'rgba(255,255,255,.88)';
      ctx.strokeStyle = 'rgba(20,40,60,.4)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(14, 14, 250, 92, 10);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#12304a';
      ctx.textAlign = 'left';
      ctx.font = '700 14px "Be Vietnam Pro","Segoe UI",sans-serif';
      ctx.fillText('Tốc độ xe trên đường phẳng', 26, 36);
      ctx.font = '500 13px "JetBrains Mono",monospace';
      const sp = p => window.RaceEngine.SPEED(p).toFixed(1).replace('.', ',');
      ctx.fillText(`Mức 4: ${sp(4)} cm/giây`, 26, 56);
      ctx.fillText(`Mức 8: ${sp(8)} cm/giây`, 26, 74);
      ctx.fillText('Xuống dốc ×1,6 · Lên dốc ×0,6', 26, 92);
    }
    $('scene-idle').hidden = sim.running || sim.x > 0;
  }
  function drawStars(now) {
    fx.stars = fx.stars.filter(s => now - s.t0 < 1.4);
    for (const s of fx.stars) {
      const k = (now - s.t0) / 1.4;
      ctx.globalAlpha = 1 - k;
      ctx.fillStyle = s.c;
      ctx.beginPath();
      ctx.arc(s.x + s.vx * k * 90, s.y + s.vy * k * 90 + 40 * k * k, 7 * (1 - k * 0.5), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  // ---------- thông báo chữ to ----------
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
    toastTimer = setTimeout(() => (el.hidden = true), action ? 6000 : 3500);
  }
  const retry = { label: 'Thử lại', run: () => window.simEngine.start() };

  function onEvent(type, data) {
    const now = performance.now() / 1000,
      sim = window.simEngine;
    if (type === 'start') {
      $('scene-toast').hidden = true;
    } else if (type === 'slide') {
      if (window.SFX) window.SFX.tone(260, 0.2);
      const hint = sim.advanced
        ? `Hãy chạy ở mức ${sim.minClimbPower()} trở lên${sim.has('wing') ? '.' : ' hoặc gắn cánh gió đuôi.'}`
        : `Hãy cho xe chạy nhanh hơn${sim.has('wing') ? '.' : ' hoặc gắn cánh gió đuôi.'}`;
      toast('bad', 'Xe trôi ngược', `Dốc làm xe tụt xuống. ${hint}`, retry);
    } else if (type === 'flip') {
      fx.flipAt = now;
      fx.shakeUntil = now + 0.5;
      if (window.SFX) window.SFX.tone(150, 0.35);
      toast('bad', 'Xe lật rồi!', 'Xuống dốc xe chạy rất nhanh. Hãy đổi sang Low Speed (chạy chậm) trước khi xuống dốc.', retry);
    } else if (type === 'crash') {
      fx.shakeUntil = now + 0.7;
      if (window.SFX) window.SFX.tone(140, 0.35);
      toast('bad', 'Ối! Xe đâm vào tường lốp', 'Xe chạy quá xa. Hãy cho xe chạy ít giây hơn.', retry);
    } else if (type === 'park') {
      const x = cacheX(sim.x);
      for (let i = 0; i < 14; i++) {
        const a = (i / 14) * Math.PI * 2;
        fx.stars.push({ t0: now, x, y: yOfNow(sim) - 90, vx: Math.cos(a), vy: Math.sin(a), c: ['#ffd23f', '#fff', '#8cc152'][i % 3] });
      }
      if (window.SFX) window.SFX.ding();
      toast('ok', 'Giỏi quá!', 'Xe qua vạch đích và đỗ gọn trong ô đỗ.');
    } else if (type === 'short') {
      if (sim.stalled) return;
      const T = sim.track();
      const pro = sim.advanced; // chế độ Bé không hiện con số
      if (data.x < T.finish)
        toast('bad', data.x > 80 ? 'Xe mới tới đỉnh dốc' : 'Chưa tới vạch đích', `${pro ? `Xe còn cách vạch đích ${Math.round(T.finish - data.x)} cm.` : 'Xe chưa tới vạch đích.'} Hãy cho xe chạy lâu hơn (đổi số giây ở khối Wait).`, retry);
      else toast('bad', 'Chưa tới ô đỗ', `${pro ? `Xe qua vạch đích nhưng còn cách ô đỗ ${Math.round(T.park[0] - data.x)} cm.` : 'Xe qua vạch đích rồi nhưng chưa vào ô đỗ.'} Hãy chạy lâu hơn một chút.`, retry);
    } else if (type === 'over') {
      toast('bad', 'Đỗ quá ô rồi', `${sim.advanced ? `Xe đỗ quá ô ${Math.round(data.off)} cm.` : 'Xe chạy qua ô đỗ mất rồi.'} Hãy cho xe chạy ít giây hơn.`, retry);
    } else if (type === 'track' && sim.advanced) {
      toast('ok', 'Đường đua Nâng cao', 'Có dốc lên rồi dốc xuống. Lên dốc chạy nhanh, xuống dốc chạy chậm nhé!');
    }
  }
  function cacheX(cm) {
    return cache ? xOf(cache, cm) : A_X + cm * 3;
  }
  function yOfNow(sim) {
    return cache ? yOf(cache, sim.x) : G;
  }

  // ---------- chế độ: câu chuyện ⇄ xe 3D ----------
  function setMode(m) {
    mode = m;
    $('scene-wrap').dataset.mode = m;
    $('scene-toggle').textContent = m === 'story' ? 'Xem xe thật' : 'Xem câu chuyện';
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

  zmReady(() => {
    cv = $('space-scene');
    if (!cv) return;
    ctx = cv.getContext('2d');
    new ResizeObserver(resize).observe(cv);
    $('scene-toggle').addEventListener('click', () => setMode(mode === 'story' ? 'robot' : 'story'));
    $('scene-toast-close').addEventListener('click', () => ($('scene-toast').hidden = true));
    raf = requestAnimationFrame(frame);
  });

  window.ZMScene = { enter, leave, onEvent, setMode, mode: () => mode };
})();
