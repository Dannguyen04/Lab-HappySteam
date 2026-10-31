// Cảnh câu chuyện ở chặng ③ (cho học sinh nhỏ): một khung lớn duy nhất – Trái Đất, trạm mặt đất, quỹ đạo,
// đám đá thiên thạch và vệ tinh bay theo chương trình. Lấy trạng thái từ window.simEngine mỗi khung hình:
//   rev (số vòng cột anten = vị trí trên quỹ đạo), motorOn, motorDir, khối đang chạy, các gói nâng cấp.
// Sự kiện từ engine (melody, near, crash, avoid, loop) bật hiệu ứng và thông báo chữ to.
// Nút "Xem robot thật" đổi sang sa bàn 3D (js/sandbox-3d.js); không hiện hai khung cùng lúc.
(function () {
  'use strict';

  const W = 900,
    H = 560,
    CX = 450,
    CY = 285,
    R = 200, // bán kính quỹ đạo
    EARTH = 72,
    HAZARD = [110, 160]; // vành đai thiên thạch (độ, theo chiều kim đồng hồ từ trên cùng)
  const $ = id => document.getElementById(id);
  const rnd = (() => {
    let s = 7;
    return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296);
  })();
  const STARS = Array.from({ length: 120 }, () => ({ x: rnd() * W, y: rnd() * H, r: rnd() < 0.15 ? 1.8 : 1.1, p: rnd() * 6 }));
  const ROCKS = [
    { a: 116, d: -18, s: 22, sp: 0.4 },
    { a: 124, d: 16, s: 17, sp: -0.6 },
    { a: 133, d: -4, s: 27, sp: 0.3 },
    { a: 142, d: 20, s: 15, sp: -0.5 },
    { a: 149, d: -20, s: 19, sp: 0.5 },
    { a: 156, d: 6, s: 24, sp: -0.35 }
  ].map(r => ({ ...r, rot: rnd() * 6, pts: Array.from({ length: 8 }, (_, i) => 0.78 + rnd() * 0.3) }));

  let cv, ctx, dpr = 1, raf = 0, last = 0, mode = 'story', active = false;
  const fx = { waves: [], shakeUntil: 0, flashUntil: 0, stars: [], noteUntil: 0, note: '' };

  const pos = (deg, r = R) => {
    const a = (deg * Math.PI) / 180;
    return [CX + r * Math.sin(a), CY - r * Math.cos(a)];
  };
  const heading = sim => ((((sim.rev || 0) * 360) % 360) + 360) % 360;

  function resize() {
    if (!cv) return;
    const w = cv.clientWidth || W;
    dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = Math.round(w * dpr);
    cv.height = Math.round((w * H) / W * dpr);
  }

  // ---------- vẽ ----------
  function drawSky(t) {
    const g = ctx.createRadialGradient(CX, CY, 40, CX, CY, 620);
    g.addColorStop(0, '#16305c');
    g.addColorStop(1, '#0a1530');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    for (const s of STARS) {
      ctx.globalAlpha = 0.35 + 0.35 * Math.sin(t * 1.4 + s.p);
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  function drawEarth() {
    // Trái Đất
    ctx.save();
    ctx.beginPath();
    ctx.arc(CX, CY, EARTH, 0, Math.PI * 2);
    ctx.fillStyle = '#2f7de0';
    ctx.fill();
    ctx.clip();
    ctx.fillStyle = '#43b36b';
    for (const [x, y, rx, ry, a] of [[-28, -20, 30, 20, 0.4], [26, 18, 28, 16, -0.3], [-6, 40, 22, 12, 0.1], [40, -34, 16, 10, 0.6]]) {
      ctx.beginPath();
      ctx.ellipse(CX + x, CY + y, rx, ry, a, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(255,255,255,.55)';
    ctx.beginPath();
    ctx.arc(CX, CY, EARTH, 0, Math.PI * 2);
    ctx.stroke();
    // Trạm mặt đất: ngôi nhà nhỏ có chảo ăng-ten ở đỉnh Trái Đất
    const x = CX,
      y = CY - EARTH;
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#1e2a34';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.rect(x - 16, y - 18, 32, 20);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#e8892b';
    ctx.beginPath();
    ctx.moveTo(x - 20, y - 18);
    ctx.lineTo(x, y - 32);
    ctx.lineTo(x + 20, y - 18);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + 10, y - 26);
    ctx.lineTo(x + 18, y - 44);
    ctx.stroke();
    ctx.fillStyle = '#dfe6ec';
    ctx.beginPath();
    ctx.ellipse(x + 20, y - 46, 11, 6, -0.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    label('Trạm mặt đất', x, y + 22, '#fff');
  }
  function label(text, x, y, color) {
    ctx.font = '700 16px "Be Vietnam Pro","Segoe UI",sans-serif';
    ctx.textAlign = 'center';
    ctx.lineWidth = 4;
    ctx.strokeStyle = 'rgba(10,21,48,.85)';
    ctx.strokeText(text, x, y);
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
  }
  function drawOrbit(sim, deg) {
    ctx.setLineDash([6, 10]);
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(255,255,255,.28)';
    ctx.beginPath();
    ctx.arc(CX, CY, R, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    // Vệt bay phía sau vệ tinh
    if (sim.motorOn) {
      const dir = sim.motorDir > 0 ? 1 : -1;
      for (let i = 1; i <= 24; i++) {
        const [x, y] = pos(deg - dir * i * 2);
        ctx.globalAlpha = (1 - i / 24) * 0.7;
        ctx.fillStyle = '#ffd23f';
        ctx.beginPath();
        ctx.arc(x, y, 4 - i * 0.12, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
  }
  function drawRocks(sim, t, danger) {
    // Dải nguy hiểm mờ phía sau đám đá
    const a0 = ((HAZARD[0] - 90) * Math.PI) / 180,
      a1 = ((HAZARD[1] - 90) * Math.PI) / 180;
    ctx.lineWidth = 64;
    ctx.strokeStyle = danger ? `rgba(240,80,80,${0.22 + 0.18 * Math.sin(t * 10)})` : 'rgba(240,120,80,.13)';
    ctx.beginPath();
    ctx.arc(CX, CY, R, a0, a1);
    ctx.stroke();
    for (const r of ROCKS) {
      const [x, y] = pos(r.a, R + r.d);
      const rot = r.rot + t * r.sp;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rot);
      ctx.beginPath();
      r.pts.forEach((k, i) => {
        const a = (i / r.pts.length) * Math.PI * 2;
        const px = Math.cos(a) * r.s * k,
          py = Math.sin(a) * r.s * k;
        i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
      });
      ctx.closePath();
      ctx.fillStyle = '#8a6a52';
      ctx.fill();
      ctx.lineWidth = danger ? 4 : 2.5;
      ctx.strokeStyle = danger ? '#ff5a5a' : '#4b3627';
      ctx.stroke();
      ctx.fillStyle = 'rgba(0,0,0,.22)';
      ctx.beginPath();
      ctx.arc(r.s * 0.25, -r.s * 0.15, r.s * 0.22, 0, Math.PI * 2);
      ctx.arc(-r.s * 0.3, r.s * 0.25, r.s * 0.14, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    const [lx, ly] = pos(135, R + 66);
    label('Đá thiên thạch', lx, ly, danger ? '#ff8a8a' : '#f2c7a5');
    if (danger) {
      // Biển báo nguy hiểm nhấp nháy
      const [sx, sy] = pos(98, R - 60);
      const k = 1 + 0.12 * Math.sin(t * 12);
      ctx.save();
      ctx.translate(sx, sy);
      ctx.scale(k, k);
      ctx.fillStyle = '#ffcc00';
      ctx.strokeStyle = '#1e2a34';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, -24);
      ctx.lineTo(24, 18);
      ctx.lineTo(-24, 18);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#1e2a34';
      ctx.font = '900 26px "Segoe UI",sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('!', 0, 14);
      ctx.restore();
    }
  }
  function drawSatellite(sim, deg, t, hit) {
    const [x, y] = pos(deg);
    const up = sim.upgrades || new Set();
    ctx.save();
    ctx.translate(x, y);
    // Thân quay để cánh nằm dọc theo quỹ đạo, mặt có chảo hướng về Trái Đất
    ctx.rotate(((deg) * Math.PI) / 180);
    if (hit) ctx.rotate(Math.sin(t * 30) * 0.2);
    // Nón cảm biến phía trước (theo chiều bay)
    if (up.has('sensor')) {
      const dir = sim.motorDir > 0 ? 1 : -1;
      const g = ctx.createLinearGradient(0, 0, dir * 110, 0);
      g.addColorStop(0, 'rgba(234,110,169,.55)');
      g.addColorStop(1, 'rgba(234,110,169,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(dir * 16, 0);
      ctx.lineTo(dir * 110, -40);
      ctx.lineTo(dir * 110, 40);
      ctx.closePath();
      ctx.fill();
    }
    // Cánh pin (2 hoặc 4 khung)
    const wings = up.has('solar') ? 2 : 1;
    for (const side of [-1, 1])
      for (let k = 0; k < wings; k++) {
        const x0 = side * (22 + k * 36);
        ctx.fillStyle = '#3dc1dc';
        ctx.strokeStyle = '#0e6f8a';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.rect(side > 0 ? x0 : x0 - 34, -12, 34, 24);
        ctx.fill();
        ctx.stroke();
        ctx.strokeStyle = 'rgba(14,111,138,.6)';
        ctx.beginPath();
        const bx = side > 0 ? x0 : x0 - 34;
        ctx.moveTo(bx + 11, -12);
        ctx.lineTo(bx + 11, 12);
        ctx.moveTo(bx + 23, -12);
        ctx.lineTo(bx + 23, 12);
        ctx.moveTo(bx, 0);
        ctx.lineTo(bx + 34, 0);
        ctx.stroke();
      }
    // Thân (bộ điều khiển trắng – xanh như mô hình)
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#1e2a34';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(-20, -16, 40, 32, 6);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#3dc1dc';
    ctx.fillRect(-18.5, 4, 37, 10);
    ctx.fillStyle = '#ffd23f';
    ctx.fillRect(-4, -14, 8, 4);
    // Chảo ra-đa hướng về Trái Đất (phía dưới trong hệ quay)
    if (up.has('radar')) {
      ctx.strokeStyle = '#1e2a34';
      ctx.fillStyle = '#dfe6ec';
      ctx.beginPath();
      ctx.moveTo(0, 16);
      ctx.lineTo(0, 26);
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(0, 30, 16, 7, 0, Math.PI, 0, true);
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
    // Mũi tên chiều bay
    if (sim.motorOn) {
      const dir = sim.motorDir > 0 ? 1 : -1;
      const [ax, ay] = pos(deg + dir * 14, R + 42);
      const [bx, by] = pos(deg + dir * 24, R + 42);
      ctx.strokeStyle = '#ffd23f';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(bx, by);
      ctx.stroke();
      const ang = Math.atan2(by - ay, bx - ax);
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.lineTo(bx - 12 * Math.cos(ang - 0.5), by - 12 * Math.sin(ang - 0.5));
      ctx.moveTo(bx, by);
      ctx.lineTo(bx - 12 * Math.cos(ang + 0.5), by - 12 * Math.sin(ang + 0.5));
      ctx.stroke();
    }
    return [x, y];
  }
  function drawWaves(now, sat) {
    // Sóng tín hiệu bay từ vệ tinh về trạm mặt đất
    const target = [CX, CY - EARTH - 30];
    fx.waves = fx.waves.filter(w => now - w.t0 < 1.4);
    for (const w of fx.waves) {
      const k = (now - w.t0) / 1.4;
      const x = sat[0] + (target[0] - sat[0]) * k,
        y = sat[1] + (target[1] - sat[1]) * k;
      const ang = Math.atan2(target[1] - sat[1], target[0] - sat[0]);
      ctx.strokeStyle = w.tune === 'B' ? `rgba(200,160,255,${1 - k})` : `rgba(255,236,120,${1 - k})`;
      ctx.lineWidth = 4;
      for (const r of [10, 18, 26]) {
        ctx.beginPath();
        ctx.arc(x, y, r, ang - 0.6, ang + 0.6);
        ctx.stroke();
      }
    }
    if (now < fx.noteUntil) {
      // Nốt nhạc A/B cạnh vệ tinh
      const bob = Math.sin(now * 6) * 4;
      ctx.fillStyle = '#8e6bbf';
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(sat[0] + 34, sat[1] - 38 + bob, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#fff';
      ctx.font = '800 20px "Chakra Petch","Segoe UI",sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(fx.note, sat[0] + 34, sat[1] - 31 + bob);
    }
  }
  function drawStars(now) {
    fx.stars = fx.stars.filter(s => now - s.t0 < 1.4);
    for (const s of fx.stars) {
      const k = (now - s.t0) / 1.4;
      const x = s.x + s.vx * k * 90,
        y = s.y + s.vy * k * 90 + 40 * k * k;
      ctx.globalAlpha = 1 - k;
      ctx.fillStyle = s.c;
      star(x, y, 9 * (1 - k * 0.5));
    }
    ctx.globalAlpha = 1;
  }
  function star(x, y, r) {
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = (i * Math.PI) / 5 - Math.PI / 2,
        rr = i % 2 ? r * 0.45 : r;
      i ? ctx.lineTo(x + rr * Math.cos(a), y + rr * Math.sin(a)) : ctx.moveTo(x + rr * Math.cos(a), y + rr * Math.sin(a));
    }
    ctx.closePath();
    ctx.fill();
  }

  function frame(ts) {
    raf = requestAnimationFrame(frame);
    const sim = window.simEngine;
    if (!sim || !ctx || mode !== 'story') return;
    const now = ts / 1000;
    if (now - last < 1 / 40) return;
    last = now;
    const deg = heading(sim);
    const danger = sim.running && sim.isApproachingHazard && sim.isApproachingHazard();
    const hit = now < fx.shakeUntil;
    ctx.setTransform(dpr * (cv.width / dpr / W), 0, 0, dpr * (cv.width / dpr / W), 0, 0);
    if (hit) ctx.translate((Math.random() - 0.5) * 12, (Math.random() - 0.5) * 12);
    drawSky(now);
    drawOrbit(sim, deg);
    drawRocks(sim, now, danger || hit);
    drawEarth();
    const sat = drawSatellite(sim, deg, now, hit);
    drawWaves(now, sat);
    drawStars(now);
    if (now < fx.flashUntil) {
      ctx.fillStyle = `rgba(255,60,60,${0.35 * (fx.flashUntil - now)})`;
      ctx.fillRect(-20, -20, W + 40, H + 40);
    }
    $('scene-idle').hidden = sim.running || sim.loopsDone > 0;
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

  function onEvent(type, data) {
    const now = performance.now() / 1000,
      sim = window.simEngine;
    if (type === 'melody') {
      fx.waves.push({ t0: now, tune: data }, { t0: now + 0.35, tune: data }, { t0: now + 0.7, tune: data });
      fx.note = data;
      fx.noteUntil = now + 1.1;
    } else if (type === 'near') {
      if (window.SFX) window.SFX.tone(880, 0.12);
    } else if (type === 'crash') {
      fx.shakeUntil = now + 0.7;
      fx.flashUntil = now + 0.8;
      if (window.SFX) window.SFX.tone(140, 0.35);
      toast('bad', 'Ối! Vệ tinh đụng đá rồi', 'Lần sau hãy cho vệ tinh quay ngược lại hoặc dừng trước khi tới đám đá.', {
        label: 'Thử lại',
        run: () => sim.start()
      });
    } else if (type === 'avoid') {
      const [x, y] = pos(heading(sim));
      for (let i = 0; i < 14; i++) {
        const a = (i / 14) * Math.PI * 2;
        fx.stars.push({ t0: now, x, y, vx: Math.cos(a), vy: Math.sin(a), c: ['#ffd23f', '#fff', '#8cc152'][i % 3] });
      }
      if (window.SFX) window.SFX.ding();
      // Đã an toàn: dừng chương trình để vệ tinh không lặp lại rồi trôi vào đám đá (đổi chiều thì cho lùi thêm một chút)
      setTimeout(() => sim.running && sim.stop(), data === 'reverse' ? 900 : 0);
      toast('ok', 'Giỏi quá!', data === 'reverse' ? 'Vệ tinh đã quay ngược lại, tránh được đám đá.' : 'Vệ tinh báo động rồi dừng lại, tránh được đám đá.');
    } else if (type === 'loop' && data === 1 && sim.matchesSample && sim.matchesSample()) {
      toast('ok', 'Đúng như trong sách!', 'Vệ tinh phát âm A, quay, phát âm B rồi quay tiếp – lặp lại liên tục.');
    }
  }

  // ---------- chế độ: câu chuyện ⇄ robot 3D ----------
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
    raf = requestAnimationFrame(frame);
  });

  window.ZMScene = { enter, leave, onEvent, setMode, mode: () => mode };
})();
