// Cảnh câu chuyện Lớp 3 · Bài 8 (chặng ③): tìm kiếm cứu nạn nhìn từ trên xuống. Máy bay treo ở đầu cần bay vòng quanh
// đài điều khiển; bóng máy bay và kích thước cho biết độ cao (thêm thước đo độ cao bên phải). Radar quét phía trước máy bay
// làm hiện người gặp nạn; bay thấp + chậm ngang qua thì thả thang cứu. Nâng cao: mây bão phủ cảnh theo giờ.
// Hình vẽ từ js/lop3-bai08/art.js (window.RescueArt) nếu có, không thì hình đơn giản dưới đây.
// Cùng giao diện window.ZMScene với các bài khác.
(function () {
  'use strict';

  const W = 900,
    H = 560;
  const C = [400, 285], // tâm vòng bay (đài điều khiển)
    R = 205; // bán kính vòng bay
  const GAUGE = { x: 800, y: 112, h: 360 }; // dưới nút "Xem robot thật" ở góc trên phải
  const $ = id => document.getElementById(id);
  let cv, ctx, raf = 0, last = 0, mode = 'story', active = false;
  const fx = { stars: [], shakeUntil: 0, flash: 0, ladders: [] };
  const hinted = new Set(); // gợi ý "bay cao/nhanh quá" chỉ bật lên 1 lần mỗi lần chạy (sau đó xem nhật ký)

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
    ctx.strokeStyle = 'rgba(10,30,45,.75)';
    ctx.strokeText(text, x, y);
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
  }
  const at = (a, r = R) => [C[0] + r * Math.cos(a), C[1] + r * Math.sin(a)];

  // ---------- hình đơn giản khi chưa có art.js ----------
  const Simple = {
    drawBackground(c, t) {
      // biển bên trái, đất liền + núi bên phải
      c.fillStyle = '#4fa9d8';
      c.fillRect(0, 0, W, H);
      c.strokeStyle = 'rgba(255,255,255,.25)';
      c.lineWidth = 2;
      for (let i = 0; i < 18; i++) {
        const x = (i * 131) % 760,
          y = (i * 89 + t * 6) % H;
        c.beginPath();
        c.arc(x, y, 14, Math.PI * 1.15, Math.PI * 1.85);
        c.stroke();
      }
      c.fillStyle = '#86c06c';
      c.beginPath();
      c.moveTo(330, 0);
      c.bezierCurveTo(260, 140, 360, 260, 300, 380);
      c.bezierCurveTo(260, 470, 330, 520, 300, H);
      c.lineTo(W, H);
      c.lineTo(W, 0);
      c.fill();
      // núi (tam giác nhìn từ trên: khối nâu có đỉnh trắng)
      for (const [x, y, s] of [[300, 360, 1], [250, 420, 0.8], [360, 455, 0.7], [640, 120, 0.9], [700, 420, 0.8]]) {
        c.fillStyle = '#8a7055';
        c.beginPath();
        c.moveTo(x - 46 * s, y + 30 * s);
        c.lineTo(x, y - 34 * s);
        c.lineTo(x + 46 * s, y + 30 * s);
        c.fill();
        c.fillStyle = '#f4f7fa';
        c.beginPath();
        c.moveTo(x - 14 * s, y - 14 * s);
        c.lineTo(x, y - 34 * s);
        c.lineTo(x + 14 * s, y - 14 * s);
        c.fill();
      }
    },
    drawTower(c, x, y) {
      c.fillStyle = '#e9eef2';
      c.strokeStyle = '#1e2a34';
      c.lineWidth = 2;
      c.beginPath();
      c.arc(x, y, 26, 0, Math.PI * 2);
      c.fill();
      c.stroke();
      c.fillStyle = '#3dc1dc';
      c.beginPath();
      c.arc(x, y, 14, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = '#1e2a34';
      c.font = '800 12px "Chakra Petch",sans-serif';
      c.textAlign = 'center';
      c.fillText('H', x, y + 4);
    },
    drawFog(c, x, y, t, thick) {
      c.fillStyle = `rgba(235,240,245,${thick})`;
      for (let i = 0; i < 6; i++) {
        c.beginPath();
        c.ellipse(x + Math.cos(i * 1.7 + t * 0.2) * 40, y + Math.sin(i * 2.3) * 26, 60, 34, 0, 0, Math.PI * 2);
        c.fill();
      }
    },
    drawVictim(c, x, y, o) {
      if (!o.seen) {
        c.fillStyle = 'rgba(255,255,255,.55)';
        c.beginPath();
        c.arc(x, y, 13, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = '#1e2a34';
        c.font = '800 16px "Chakra Petch",sans-serif';
        c.textAlign = 'center';
        c.fillText('?', x, y + 6);
        return;
      }
      if (!o.saved) {
        const k = (Math.sin(o.t * 5) + 1) / 2;
        c.strokeStyle = `rgba(255,80,60,${0.4 + 0.5 * k})`;
        c.lineWidth = 3;
        c.beginPath();
        c.arc(x, y, 18 + 6 * k, 0, Math.PI * 2);
        c.stroke();
      }
      c.fillStyle = o.saved ? '#8cc152' : '#ff8a3d';
      c.beginPath();
      c.ellipse(x, y + 4, 16, 9, 0, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = '#ffd9b3';
      c.beginPath();
      c.arc(x, y - 3, 5, 0, Math.PI * 2);
      c.fill();
      c.font = '800 10px "Chakra Petch",sans-serif';
      c.textAlign = 'center';
      c.fillStyle = '#fff';
      c.fillText(o.saved ? '✓' : 'SOS', x, y + 22);
    },
    // Máy bay nhìn từ trên: heading = hướng bay (rad), alt 0…1 → to hơn khi cao; bóng lệch xa hơn khi cao
    drawPlane(c, x, y, o) {
      const s = 0.85 + 0.45 * o.alt;
      c.save();
      c.translate(x + 8 + 34 * o.alt, y + 10 + 34 * o.alt);
      c.rotate(o.heading);
      c.scale(s, s);
      c.fillStyle = 'rgba(0,0,0,.22)';
      c.fillRect(-26, -4, 52, 8);
      c.fillRect(-6, -30 * (o.wings ? 1.35 : 1), 14, 60 * (o.wings ? 1.35 : 1));
      c.restore();
      c.save();
      c.translate(x + (o.shake ? (Math.random() - 0.5) * 6 : 0), y);
      c.rotate(o.heading);
      c.scale(s, s);
      if (o.light) {
        const g = c.createRadialGradient(34, 0, 2, 34, 0, 60);
        g.addColorStop(0, 'rgba(255,230,120,.75)');
        g.addColorStop(1, 'rgba(255,230,120,0)');
        c.fillStyle = g;
        c.beginPath();
        c.moveTo(20, 0);
        c.arc(20, 0, 60, -0.45, 0.45);
        c.fill();
      }
      c.strokeStyle = '#1e2a34';
      c.lineWidth = 1.8;
      const span = o.wings ? 40 : 30;
      c.fillStyle = '#fff';
      c.beginPath();
      c.moveTo(-4, 0);
      c.lineTo(-10, -span);
      c.lineTo(4, -span);
      c.lineTo(12, 0);
      c.lineTo(4, span);
      c.lineTo(-10, span);
      c.closePath();
      c.fill();
      c.stroke();
      c.fillStyle = '#3dc1dc';
      c.beginPath();
      c.roundRect(-28, -5, 54, 10, 5);
      c.fill();
      c.stroke();
      c.beginPath();
      c.moveTo(-28, 0);
      c.lineTo(-34, -10);
      c.lineTo(-34, 10);
      c.closePath();
      c.fill();
      c.stroke();
      if (o.radar) {
        c.fillStyle = '#e53935';
        c.beginPath();
        c.arc(27, 0, 4, 0, Math.PI * 2);
        c.fill();
      }
      c.restore();
    }
  };
  const art = () => window.RescueArt || Simple;

  function drawRadar(c, a, dir, reach, now) {
    const p = at(a);
    c.save();
    c.fillStyle = 'rgba(120,255,170,.16)';
    c.strokeStyle = 'rgba(120,255,170,.6)';
    c.lineWidth = 1.5;
    c.beginPath();
    c.moveTo(C[0], C[1]);
    const a1 = a,
      a2 = a + dir * reach;
    c.arc(C[0], C[1], R + 34, Math.min(a1, a2), Math.max(a1, a2));
    c.closePath();
    c.fill();
    const k = (now * 1.6) % 1;
    c.strokeStyle = `rgba(120,255,170,${0.7 * (1 - k)})`;
    c.beginPath();
    c.arc(p[0], p[1], 14 + 50 * k, 0, Math.PI * 2);
    c.stroke();
    c.restore();
  }
  function drawGauge(c, alt, storm, advanced) {
    const { x, y, h } = GAUGE,
      L = window.RescueEngine.LIMITS;
    c.save();
    c.fillStyle = 'rgba(255,255,255,.92)';
    c.beginPath();
    c.roundRect(x - 34, y - 34, 98, h + 70, 12);
    c.fill();
    c.fillStyle = '#1e2a34';
    c.font = '700 12px "Be Vietnam Pro","Segoe UI",sans-serif';
    c.textAlign = 'center';
    c.fillText('Độ cao', x + 15, y - 14);
    // vùng thả thang (xanh lá) ở dưới, mây bão (xám) khi có bão
    c.fillStyle = '#dfe7ec';
    c.fillRect(x, y, 30, h);
    c.fillStyle = 'rgba(140,193,82,.75)';
    c.fillRect(x, y + h * (1 - L.LOW), 30, h * L.LOW);
    if (advanced) {
      c.fillStyle = storm ? 'rgba(80,80,110,.8)' : 'rgba(80,80,110,.25)';
      c.fillRect(x, y + h * (1 - L.CLOUD) - 6, 30, 12);
    }
    c.strokeStyle = '#1e2a34';
    c.lineWidth = 2;
    c.strokeRect(x, y, 30, h);
    const py = y + h * (1 - alt);
    c.fillStyle = '#3dc1dc';
    c.beginPath();
    c.moveTo(x - 4, py);
    c.lineTo(x - 18, py - 9);
    c.lineTo(x - 18, py + 9);
    c.closePath();
    c.fill();
    c.stroke();
    c.font = '600 11px "Be Vietnam Pro","Segoe UI",sans-serif';
    c.textAlign = 'left';
    c.fillStyle = '#1e2a34';
    c.fillText('cao', x + 34, y + 10);
    c.fillStyle = '#3d7a1a';
    c.fillText('thả', x + 34, y + h - 18);
    c.fillText('thang', x + 34, y + h - 4);
    if (advanced) {
      c.fillStyle = '#50506e';
      c.fillText('mây', x + 34, y + h * (1 - L.CLOUD) + 4);
    }
    c.restore();
  }

  function frame(ts) {
    raf = requestAnimationFrame(frame);
    const sim = window.simEngine;
    if (!sim || !ctx || mode !== 'story') return;
    const now = ts / 1000;
    if (now - last < 1 / 40) return;
    last = now;
    const A = art();
    ctx.setTransform(cv.width / W, 0, 0, cv.width / W, 0, 0);
    if (now < fx.shakeUntil) ctx.translate((Math.random() - 0.5) * 8, 0);
    const w = sim.weather(),
      alt = sim.altitude(),
      dir = Math.sign(sim.armRpm()) || 1;
    A.drawBackground(ctx, now);
    // vòng bay
    ctx.strokeStyle = 'rgba(255,255,255,.55)';
    ctx.setLineDash([8, 10]);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(C[0], C[1], R, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    for (const v of sim.victims) {
      const p = at(v.a);
      if (v.fog) A.drawFog(ctx, p[0], p[1], now, sim.has('light') && v.seen ? 0.35 : 0.8);
      A.drawVictim(ctx, p[0], p[1], { seen: v.seen, saved: v.saved, fog: v.fog, t: now });
    }
    if (sim.running && !sim.crashed) drawRadar(ctx, sim.angle, dir, sim.radarReach(), now);
    // cần nối đài điều khiển với máy bay
    const pp = at(sim.angle);
    ctx.strokeStyle = 'rgba(30,42,52,.55)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(C[0], C[1]);
    ctx.lineTo(pp[0], pp[1]);
    ctx.stroke();
    A.drawTower(ctx, C[0], C[1]);
    // thang vừa thả
    fx.ladders = fx.ladders.filter(l => now - l.t0 < 1.6);
    for (const l of fx.ladders) {
      ctx.strokeStyle = '#ffd23f';
      ctx.lineWidth = 3;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(pp[0], pp[1]);
      ctx.lineTo(l.x, l.y);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    A.drawPlane(ctx, pp[0], pp[1], {
      heading: sim.angle + (dir * Math.PI) / 2,
      alt,
      wings: sim.has('wings'),
      light: sim.has('light'),
      radar: sim.has('radar'),
      shake: w.kind === 'storm' && alt < window.RescueEngine.LIMITS.CLOUD && sim.running,
      t: now
    });
    // mây bão
    if (w.kind === 'storm') {
      ctx.fillStyle = 'rgba(40,40,70,.45)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = 'rgba(70,70,100,.55)';
      for (let i = 0; i < 9; i++) {
        ctx.beginPath();
        ctx.ellipse(((i * 151 + now * 30) % (W + 200)) - 100, 60 + ((i * 97) % 420), 110, 50, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      if (Math.sin(now * 2.7) > 0.97) {
        ctx.fillStyle = 'rgba(255,255,230,.5)';
        ctx.fillRect(0, 0, W, H);
      }
    }
    drawGauge(ctx, alt, w.kind === 'storm', sim.advanced);
    label(`Đã cứu ${sim.saved()}/3`, 90, 40, '#fff', 20);
    if (sim.crashed) label('Ối! Hạ cánh khẩn cấp', C[0], 60, '#ffb4a8', 22);
    if (sim.advanced) {
      ctx.fillStyle = w.kind === 'storm' ? 'rgba(120,20,20,.85)' : 'rgba(255,255,255,.88)';
      ctx.beginPath();
      ctx.roundRect(14, H - 74, 240, 60, 10);
      ctx.fill();
      ctx.fillStyle = w.kind === 'storm' ? '#fff' : '#1e2a34';
      ctx.textAlign = 'left';
      ctx.font = '700 18px "Be Vietnam Pro","Segoe UI",sans-serif';
      ctx.fillText(w.kind === 'storm' ? 'BÃO! Bay trên mây' : 'Trời quang', 26, H - 48);
      ctx.font = '500 13px "Be Vietnam Pro","Segoe UI",sans-serif';
      ctx.fillText(sim.running && Number.isFinite(w.next) ? `Thời tiết đổi sau ${Math.ceil(w.next)} giây` : 'Bão tới lúc 9 giây và 29 giây', 26, H - 26);
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
    $('scene-idle').hidden = sim.running || sim.saved() > 0 || sim.crashed;
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

  function burst(x, y, now) {
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2;
      fx.stars.push({ t0: now, x, y, vx: Math.cos(a), vy: Math.sin(a), c: ['#ffd23f', '#fff', '#8cc152'][i % 3] });
    }
  }
  function onEvent(type, data) {
    const now = performance.now() / 1000,
      sim = window.simEngine;
    if (type === 'start') {
      $('scene-toast').hidden = true;
      hinted.clear();
    }
    else if (type === 'found' && window.SFX) window.SFX.tone(880, 0.08);
    else if (type === 'saved') {
      const p = at(data.victim.a);
      fx.ladders.push({ t0: now, x: p[0], y: p[1] });
      burst(p[0], p[1], now);
      if (window.SFX) window.SFX.ding();
    } else if (type === 'allSaved') {
      burst(C[0], C[1], now);
      toast('ok', 'Cứu được cả 3 người!', data.storm ? 'Máy bay vượt qua bão và cứu đủ 3 người. Phi công giỏi quá!' : `Đã cứu đủ 3 người sau ${data.secs.toFixed(1)} giây.`);
    } else if (type === 'miss') {
      if (hinted.has(data)) return;
      hinted.add(data);
      toast('warn', data === 'high' ? 'Bay cao quá!' : data === 'storm' ? 'Đang có bão' : 'Bay nhanh quá!',
        data === 'high' ? 'Cho M2 quay để hạ máy bay xuống vùng xanh, rồi dừng lại.' : data === 'storm' ? 'Chờ trời quang rồi mới thả thang.' : 'Dùng M1 Low để bay chậm khi đi ngang người gặp nạn.');
    } else if (type === 'weather' && data.kind === 'storm') {
      toast('bad', 'Bão tới!', 'Cho máy bay lên cao trên mây (M2) đến khi trời quang.');
    } else if (type === 'crash') {
      fx.shakeUntil = now + 0.7;
      if (window.SFX) window.SFX.tone(140, 0.35);
      toast('bad', 'Ối! Hạ cánh khẩn cấp', 'Máy bay ở dưới mây bão quá lâu. Hãy lên cao trước khi bão tới.', { label: 'Thử lại', run: () => sim.start() });
    } else if (type === 'sampleDone') {
      toast('ok', 'Đúng như trong sách!', 'M1 cho máy bay bay chậm, nhanh, đổi chiều; M2 cho máy bay lên xuống.');
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
