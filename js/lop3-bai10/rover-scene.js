// Sa bàn Lớp 3 · Bài 10: đường thám hiểm 170 cm, ba mẫu đá, cảm biến sóng âm và bão bụi.
// Dùng window.MarsArt (art.js tải tùy chọn) với hình vẽ dự phòng để trang vẫn hoạt động khi thiếu art.js.
(function () {
  'use strict';

  const W = 900, H = 560, GROUND = 430;
  const START_X = 138, END_X = 818;
  const $ = id => document.getElementById(id);
  const toX = cm => START_X + (END_X - START_X) * cm / 170;
  let canvas, ctx, mode = 'story', active = false, last = 0, toastTimer = 0, rafId = 0;
  let sizeObserver = null;
  const fx = { samples: [], shakeUntil: 0 };

  function label(text, x, y, color = '#fff', size = 17) {
    ctx.save();
    ctx.font = `700 ${size}px "Be Vietnam Pro","Segoe UI",sans-serif`;
    ctx.textAlign = 'center';
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#40251e';
    ctx.strokeText(text, x, y);
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
    ctx.restore();
  }

  const Simple = {
    drawBackground(c, t, weather) {
      const sky = c.createLinearGradient(0, 0, 0, GROUND);
      sky.addColorStop(0, weather === 'storm' ? '#602d26' : '#513044');
      sky.addColorStop(1, weather === 'storm' ? '#ac5436' : '#e5a074');
      c.fillStyle = sky;
      c.fillRect(0, 0, W, H);
      c.fillStyle = '#b65236';
      c.fillRect(0, GROUND, W, H - GROUND);
      c.fillStyle = '#8b3a2a';
      for (let i = 0; i < 20; i++) {
        c.beginPath();
        c.ellipse(i * 59 - 12, GROUND + 26 + (i % 4) * 22, 12, 3, 0, 0, Math.PI * 2);
        c.fill();
      }
      c.fillStyle = '#ffe1a4';
      c.beginPath(); c.arc(764, 100, 29, 0, Math.PI * 2); c.fill();
    },
    drawStation(c, x, y) {
      c.save(); c.translate(x, y);
      c.fillStyle = '#cde6e9'; c.strokeStyle = '#1e2a34'; c.lineWidth = 3;
      c.fillRect(-35, -65, 70, 60); c.strokeRect(-35, -65, 70, 60);
      c.fillStyle = '#3dc1dc'; c.fillRect(-20, -52, 40, 22);
      c.strokeStyle = '#1e2a34'; c.beginPath(); c.moveTo(0, -65); c.lineTo(0, -98); c.stroke();
      c.fillStyle = '#ffd23f'; c.beginPath(); c.arc(0, -98, 8, 0, Math.PI * 2); c.fill();
      c.restore();
    },
    drawRock(c, x, y, type, state) {
      c.save(); c.translate(x, y);
      c.fillStyle = state.got ? '#5cbf8f' : ({ red: '#bb3d36', gray: '#677780', green: '#187b69' }[type] || '#b14c33');
      c.strokeStyle = '#352b31'; c.lineWidth = 2;
      c.beginPath(); c.moveTo(-26, -2); c.lineTo(-18, -30); c.lineTo(4, -42);
      c.lineTo(25, -20); c.lineTo(30, 0); c.closePath(); c.fill(); c.stroke();
      if (state.scanning) {
        c.strokeStyle = '#ffe97b'; c.lineWidth = 5;
        c.beginPath(); c.arc(0, -15, 38, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * state.scanProgress); c.stroke();
      }
      c.restore();
    },
    drawRover(c, x, y, o) {
      c.save(); c.translate(x, y);
      c.fillStyle = '#e8f4f6'; c.strokeStyle = '#28343a'; c.lineWidth = 3;
      c.fillRect(-48, -48, 84, 35); c.strokeRect(-48, -48, 84, 35);
      for (const px of [-33, 23]) {
        c.fillStyle = o.wheels ? '#354d48' : '#2c3943';
        c.beginPath(); c.arc(px, -5, 20, 0, Math.PI * 2); c.fill(); c.stroke();
        c.strokeStyle = '#84c7d8'; c.beginPath(); c.moveTo(px, -5); c.lineTo(px + 12 * Math.cos(o.wheel), -5 + 12 * Math.sin(o.wheel)); c.stroke();
      }
      c.fillStyle = o.eyes ? '#ffd23f' : '#3dc1dc';
      for (const ey of [-36, -23]) { c.beginPath(); c.arc(36, ey, 5, 0, Math.PI * 2); c.fill(); }
      if (o.dish) { c.strokeStyle = '#28343a'; c.beginPath(); c.moveTo(-8, -48); c.lineTo(-8, -70); c.stroke(); c.fillStyle = '#fff'; c.beginPath(); c.arc(-8, -72, 13, Math.PI, Math.PI * 2); c.fill(); }
      if (o.lamp) { c.fillStyle = '#ffe98a'; c.beginPath(); c.moveTo(34, -38); c.lineTo(86, -52); c.lineTo(86, -20); c.closePath(); c.fill(); }
      c.restore();
    },
    drawSensorWaves(c, x, y, reach, on, hit, t) {
      if (!on) return;
      c.save(); c.strokeStyle = hit ? '#ffe96f' : 'rgba(100,240,255,.8)'; c.lineWidth = 3;
      for (let i = 0; i < 3; i++) {
        const r = 10 + ((t * 38 + i * 30) % Math.max(40, reach));
        c.beginPath(); c.arc(x, y, r, -0.5, 0.5); c.stroke();
      }
      c.restore();
    },
    drawStorm(c, t) {
      c.save(); c.fillStyle = 'rgba(135,62,35,.45)'; c.fillRect(0, 0, W, H);
      for (let i = 0; i < 7; i++) {
        c.strokeStyle = 'rgba(245,170,102,.35)'; c.lineWidth = 14;
        c.beginPath(); c.moveTo(((i * 185 + t * 110) % 1150) - 210, 75 + i * 67);
        c.lineTo(((i * 185 + t * 110) % 1150) + 100, 75 + i * 67); c.stroke();
      }
      c.restore();
    }
  };
  function draw(name, ...args) {
    const a = window.MarsArt || window.Lop3Bai10Art || window.RoverArt;
    const fn = a && typeof a[name] === 'function' ? a[name] : Simple[name];
    if (fn) fn(ctx, ...args);
  }

  function resize() {
    if (!canvas) return;
    const width = canvas.clientWidth || W, dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(width * H / W * dpr);
  }
  function frame(ts) {
    rafId = 0;
    if (!active) return;
    rafId = requestAnimationFrame(frame);
    const sim = window.simEngine;
    if (!sim || !ctx || mode !== 'story' || ts - last < 25) return;
    last = ts;
    const t = ts / 1000, weather = sim.weather(), storm = weather.kind === 'storm';
    ctx.setTransform(canvas.width / W, 0, 0, canvas.height / H, 0, 0);
    ctx.clearRect(0, 0, W, H);
    if (t < fx.shakeUntil) ctx.translate(Math.sin(t * 75) * 5, 0);
    draw('drawBackground', t, weather.kind);
    draw('drawStation', 86, GROUND);

    ctx.save();
    ctx.strokeStyle = 'rgba(255,245,215,.72)'; ctx.lineWidth = 3; ctx.setLineDash([8, 12]);
    ctx.beginPath(); ctx.moveTo(START_X, GROUND + 22); ctx.lineTo(END_X, GROUND + 22); ctx.stroke(); ctx.setLineDash([]);
    ctx.restore();
    const rockTypes = ['red', 'gray', 'green'];
    sim.rocks.forEach((r, i) => {
      const distance = r.x - sim.x;
      const scanning = !r.got && !sim.blind() && !sim.motor.on && Math.abs(sim.v) < .5 && distance > 3 && distance <= sim.reach();
      draw('drawRock', toX(r.x), GROUND, rockTypes[i], {
        name: r.name, got: r.got, scanning, scanProgress: Math.min(1, r.scanT / 2)
      });
      label(r.got ? `✓ Mẫu ${i + 1}` : `Mẫu ${i + 1}`, toX(r.x), GROUND + 43, r.got ? '#b8ffcb' : '#fff', 15);
    });

    const rx = toX(sim.x);
    draw('drawSensorWaves', rx + 36, GROUND - 30, sim.reach() * (END_X - START_X) / 170,
      sim.running && !sim.crashed && !sim.blind(), sim.reading() !== null, t);
    draw('drawRover', rx, GROUND, {
      wheel: sim.wheel, dish: sim.has('dish'), lamp: sim.has('lamp'), wheels: sim.has('wheels'),
      eyes: sim.reading() !== null, shake: sim.crashed ? 1 : 0,
      stuck: sim.crashWhy === 'stuck' ? 1 : 0, t
    });

    if (storm) draw('drawStorm', t, 0.75);
    ctx.fillStyle = 'rgba(28,34,43,.82)'; ctx.fillRect(12, 12, 245, 72);
    label(`Đã thu ${sim.got()}/3 mẫu đá`, 135, 42, '#fff', 19);
    label(`Vị trí: ${sim.x.toFixed(0)} / 170 cm`, 135, 66, '#b9ecf7', 14);
    if (sim.advanced) {
      ctx.fillStyle = storm ? 'rgba(105,28,17,.9)' : 'rgba(37,70,63,.85)';
      ctx.fillRect(303, 14, 300, 44);
      label(storm ? 'BÃO BỤI: DỪNG XE!' : 'Trời quang trên sao Hỏa', 453, 42, '#fff', 18);
    }
    if (sim.crashed) label(sim.crashWhy === 'stuck' ? 'Xe lún cát! Hãy thử lại' : 'Xe chạm đá! Hãy thử lại', 448, 110, '#ffe39b', 22);
    fx.samples = fx.samples.filter(s => t - s.t0 < 1.5);
    for (const s of fx.samples) label('✓ ĐÃ THU MẪU!', s.x, GROUND - 86 - (t - s.t0) * 18, '#c7ffd1', 20);
    const idle = $('scene-idle');
    if (idle) idle.hidden = sim.running || sim.got() > 0 || sim.crashed;
  }

  function toast(kind, title, message, action) {
    const box = $('scene-toast');
    if (!box) return;
    box.dataset.k = kind;
    const heading = $('scene-toast-title'), text = $('scene-toast-text');
    if (heading) heading.textContent = title;
    if (text) text.textContent = message;
    const btn = $('scene-toast-btn');
    if (btn) btn.hidden = !action;
    if (btn && action) {
      btn.textContent = 'Thử lại';
      btn.onclick = () => { box.hidden = true; window.simEngine?.start(); };
    } else if (btn) {
      btn.onclick = null;
    }
    box.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { if (active) box.hidden = true; toastTimer = 0; }, action ? 6000 : 3500);
  }
  function onEvent(type, data) {
    const t = performance.now() / 1000;
    if (type === 'start') {
      const box = $('scene-toast'); if (box) box.hidden = true;
      fx.samples.length = 0;
    } else if (type === 'seen') {
      if (window.SFX) window.SFX.tone(660, .07);
    } else if (type === 'sample') {
      fx.samples.push({ x: toX(data.rock.x), t0: t });
      if (window.SFX) window.SFX.ding();
      toast('ok', `Đã thu mẫu ${data.count}/3!`, `Robot đứng yên để lấy ${data.rock.name}.`);
    } else if (type === 'allSaved') {
      toast('ok', 'Đã thu đủ 3 mẫu đá!', data.storm ? 'Robot hoàn thành nhiệm vụ sau bão bụi.' : `Hoàn thành sau ${data.secs.toFixed(1)} giây.`);
    } else if (type === 'weather' && data.kind === 'storm') {
      toast('warn', 'Bão bụi đang đến!', 'Dừng xe và chờ bão tan; đèn pha giúp cảm biến tiếp tục dò đá.');
    } else if (type === 'weather' && data.kind === 'clear') {
      toast('ok', 'Bão đã tan', 'Xe có thể tiếp tục thám hiểm.');
    } else if (type === 'crash') {
      fx.shakeUntil = t + .65;
      if (window.SFX) window.SFX.tone(150, .3);
      toast('bad', data === 'stuck' ? 'Xe bị lún cát!' : 'Xe va vào đá!',
        data === 'stuck' ? 'Chờ bão bụi tan hoặc thử bánh gai.' : 'Hãy dùng Chờ vật cản rồi Stop để phanh.', true);
    } else if (type === 'sampleDone') {
      toast('ok', 'Đúng chương trình mẫu!', 'Robot đã hoàn thành vòng lặp đầu tiên.');
    } else if (type === 'miss' && data === 'moving') {
      toast('warn', 'Robot cần đứng yên!', 'Cho động cơ dừng để quét mẫu đá đủ 2 giây.');
    }
  }

  function setMode(value) {
    mode = value === 'robot' ? 'robot' : 'story';
    const wrap = $('scene-wrap'), toggle = $('scene-toggle');
    if (wrap) wrap.dataset.mode = mode;
    if (toggle) {
      toggle.textContent = mode === 'story' ? 'Xem robot thật' : 'Xem câu chuyện';
      toggle.setAttribute('aria-pressed', String(mode === 'robot'));
    }
    if (active) {
      if (mode === 'robot') window.ZMSandbox?.open();
      else window.ZMSandbox?.close();
    }
    resize();
  }
  function enter() {
    if (active) return;
    active = true;
    last = 0;
    resize();
    if (canvas) {
      if (typeof ResizeObserver === 'function') {
        if (!sizeObserver) sizeObserver = new ResizeObserver(resize);
        sizeObserver.observe(canvas);
      } else window.addEventListener('resize', resize);
      rafId = requestAnimationFrame(frame);
    }
    if (mode === 'robot') window.ZMSandbox?.open();
  }
  function leave() {
    active = false;
    if (rafId) cancelAnimationFrame(rafId);
    rafId = 0;
    clearTimeout(toastTimer);
    toastTimer = 0;
    if (sizeObserver) sizeObserver.disconnect();
    else window.removeEventListener('resize', resize);
    const box = $('scene-toast');
    if (box) box.hidden = true;
    window.ZMSandbox?.close();
  }

  zmReady(() => {
    canvas = $('space-scene');
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    resize();
    $('scene-toggle')?.addEventListener('click', () => setMode(mode === 'story' ? 'robot' : 'story'));
    $('scene-toast-close')?.addEventListener('click', () => { const box = $('scene-toast'); if (box) box.hidden = true; });
  });
  window.ZMScene = { enter, leave, onEvent, setMode, mode: () => mode };
})();
