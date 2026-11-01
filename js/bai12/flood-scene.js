// Cảnh câu chuyện Bài 12: nước dâng, cửa đê đóng theo góc quay của động cơ,
// cảm biến chạm để nâng/hạ. Ưu tiên hình FloodArt, có hình đơn giản dự phòng.
(function () {
  'use strict';

  const W = 900, H = 560;
  const $ = id => document.getElementById(id);
  let canvas, ctx, raf = 0, last = 0, active = false, currentMode = 'story';
  let toastTimer = 0, shakeUntil = 0, flashUntil = 0;

  function resize() {
    if (!canvas) return;
    const width = canvas.clientWidth || W;
    const scale = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(width * H / W * scale);
  }

  // Cửa van trong FloodArt: gate=0 đóng xuống, gate=1 mở lên.
  // Động cơ trong bài học: angle=0 đê chưa chắn, angle=90 đê chắn hoàn toàn.
  // Vì vậy đổi chiều giá trị khi chuyển từ mô phỏng sang hình vẽ.
  function drawArt(sim, t) {
    const A = window.FloodArt;
    const water = sim.water();
    const hold = Math.max(0, Math.min(1, sim.angle / 90));
    const gate = 1 - hold;
    const isFlood = sim.flooded;
    const isStorm = sim.running && sim.runT >= 3 && sim.runT <= 9;
    A.drawBackground(ctx, t, { rain: isStorm, storm: isStorm });
    A.drawLevee(ctx, t, { storm: isStorm });
    A.drawWater(ctx, t, { waterLevel: water, gate, shake: isFlood ? 0.8 : 0 });
    A.drawFloodgate(ctx, 465, 425, {
      gate, gearAngle: sim.rev * Math.PI * 2, touchPressed: sim.touch,
      shake: isFlood ? 0.5 : 0, t
    });
    A.drawWaterLevelMarker(ctx, 210, 320, water, isFlood ? 3 : undefined);
    A.drawVillage(ctx, 755, 340, { safe: !isFlood });
    A.drawTouchSensor(ctx, 730, 230, sim.touch, 1);
    if (sim.running && sim.runT >= 5 && !isFlood) A.drawRescueBoat(ctx, 655, 390, t);
  }

  function drawSimple(sim, t) {
    const flood = sim.water();
    const gradient = ctx.createLinearGradient(0, 0, 0, H);
    gradient.addColorStop(0, flood > 0.2 ? '#7a91a8' : '#87cff2');
    gradient.addColorStop(1, '#e0f6ff');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#79b96d';
    ctx.fillRect(0, 420, W, 140);
    ctx.fillStyle = '#415c65';
    ctx.beginPath();
    ctx.moveTo(470, 320);
    ctx.lineTo(550, 420);
    ctx.lineTo(470, 450);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = sim.flooded ? '#315a85' : '#279cd0';
    ctx.fillRect(0, 395 - 95 * flood, sim.flooded ? W : 475, 180);
    // Bức chắn đổi độ cao theo góc nâng, không giả định bộ art đã nạp.
    const h = Math.max(10, 120 * sim.angle / 90);
    ctx.fillStyle = '#fff3de';
    ctx.fillRect(448, 425 - h, 46, h);
    ctx.strokeStyle = '#175b6d';
    ctx.lineWidth = 5;
    ctx.strokeRect(448, 425 - h, 46, h);
    ctx.fillStyle = '#ffe4ae';
    ctx.fillRect(675, 350, 98, 70);
    ctx.fillStyle = '#bd583a';
    ctx.beginPath();
    ctx.moveTo(665, 350);
    ctx.lineTo(724, 296);
    ctx.lineTo(784, 350);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = sim.touch ? '#a52c29' : '#e94c42';
    ctx.beginPath();
    ctx.arc(730, 230, 25, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = 'bold 14px sans-serif';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.fillText('NHẤN', 730, 235);
    if (flood > 0) {
      ctx.strokeStyle = 'rgba(255,255,255,.5)';
      for (let i = 0; i < 5; i++) {
        const x = 35 + i * 90 + Math.sin(t * 4 + i) * 12;
        ctx.beginPath();
        ctx.moveTo(x, 394 - 95 * flood);
        ctx.lineTo(x + 37, 394 - 95 * flood);
        ctx.stroke();
      }
    }
  }

  function pill(text, x, y, color) {
    ctx.font = '700 18px "Be Vietnam Pro", "Segoe UI", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(18,43,59,.9)';
    ctx.fillRect(x - 12, y - 26, Math.min(380, text.length * 12 + 26), 39);
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
  }

  function frame(ts) {
    if (!active) { raf = 0; return; }
    raf = requestAnimationFrame(frame);
    const sim = window.simEngine;
    if (!ctx || !sim || !active || currentMode !== 'story') return;
    if (ts - last < 25) return;
    last = ts;
    const t = ts / 1000;
    ctx.setTransform(canvas.width / W, 0, 0, canvas.height / H, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.save();
    if (t < shakeUntil) ctx.translate(Math.sin(t * 52) * 4, 0);
    if (window.FloodArt && [
      'drawBackground', 'drawLevee', 'drawWater', 'drawFloodgate',
      'drawWaterLevelMarker', 'drawVillage', 'drawTouchSensor', 'drawRescueBoat'
    ].every(name => typeof window.FloodArt[name] === 'function')) drawArt(sim, t);
    else drawSimple(sim, t);
    ctx.restore();
    pill(`Đê ${Math.round(sim.angle)}° · cần ${sim.need()}°${sim.advanced ? `–${sim.maxOk()}°` : '+'}`, 25, 48, '#fff');
    if (sim.running) {
      const status = sim.runT < 5 ? `Lũ tới sau ${Math.ceil(5 - sim.runT)} giây`
        : sim.runT < 9 ? 'LŨ ĐANG QUA!' : 'Nước đang rút';
      pill(status, 25, 99, '#ffe69b');
    } else if (sim.flooded) pill('Nước đã tràn qua đê', 25, 99, '#ff9c9c');
    else if (sim.lastRun) pill('Làng đã an toàn!', 25, 99, '#a5f5c6');
    if (t < flashUntil) {
      ctx.fillStyle = 'rgba(255,235,120,.16)';
      ctx.fillRect(0, 0, W, H);
    }
    const idle = $('scene-idle');
    if (idle) idle.hidden = sim.running || sim.angle > 0;
    $('scene-hand')?.classList.toggle('is-waiting', !!sim.waitingTouch);
  }

  function toast(kind, title, message, action) {
    const box = $('scene-toast');
    if (!box) return;
    box.dataset.k = kind;
    const t = $('scene-toast-title'), text = $('scene-toast-text'), btn = $('scene-toast-btn');
    if (t) t.textContent = title;
    if (text) text.textContent = message;
    if (btn) {
      btn.hidden = !action;
      if (action) {
        btn.textContent = action.label;
        btn.onclick = () => { box.hidden = true; action.run(); };
      }
    }
    box.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { box.hidden = true; }, action ? 6500 : 3500);
  }
  function dismissToast() {
    clearTimeout(toastTimer);
    toastTimer = 0;
    const box = $('scene-toast');
    if (box) box.hidden = true;
  }

  function onEvent(type, data) {
    const now = performance.now() / 1000;
    const retry = { label: 'Thử lại', run: () => window.simEngine?.start() };
    if (type === 'start') {
      dismissToast();
    } else if (type === 'press') {
      window.SFX?.tone(860, 0.08);
    } else if (type === 'sample') {
      flashUntil = now + 0.4;
      toast('ok', 'Đúng chương trình mẫu!', 'Nhấn lần một nâng đê 0,5 giây, lần hai đổi chiều và hạ đê 0,5 giây.');
    } else if (type === 'flood') {
      shakeUntil = now + 0.8;
      toast('bad', 'Lũ tràn qua đê!', `Đê cao ${Math.round(data.angle)}°, cần ít nhất ${data.need}°. Hãy nâng sớm hơn hoặc lâu hơn.`, retry);
    } else if (type === 'tooHigh') {
      toast('bad', 'Đê nâng quá cao!', `Thuyền cứu hộ cần đê không quá ${data.max}°. Hãy giảm thời gian quay.`, retry);
    } else if (type === 'saved') {
      flashUntil = now + 1;
      window.SFX?.ding();
      toast('ok', 'Ngôi làng an toàn!', 'Đê giữ vững trong đợt lũ. Hãy thử cải tiến chương trình hoặc chinh phục mức lũ tiếp theo.');
    } else if (type === 'target') {
      toast('info', 'Mực lũ mới', `Cần giữ cửa đê trong khoảng ${data}–${data + 20}°. Em hãy tính lại thời gian quay.`);
    }
  }

  function setMode(next) {
    currentMode = next === 'robot' ? 'robot' : 'story';
    const wrap = $('scene-wrap'), toggle = $('scene-toggle');
    if (wrap) wrap.dataset.mode = currentMode;
    if (toggle) {
      toggle.textContent = currentMode === 'story' ? 'Xem mô hình thật' : 'Xem câu chuyện';
      toggle.setAttribute('aria-pressed', String(currentMode === 'robot'));
    }
    if (!active) return;
    if (currentMode === 'robot') window.ZMSandbox?.open();
    else window.ZMSandbox?.close();
    resize();
  }
  function enter() {
    if (active) return;
    active = true;
    resize();
    if (currentMode === 'robot') window.ZMSandbox?.open();
    if (!raf && ctx) raf = requestAnimationFrame(frame);
  }
  function leave() {
    active = false;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    last = 0;
    dismissToast();
    window.ZMSandbox?.close();
  }

  zmReady(() => {
    // Trình xem 3D có thể phát zm:step trước khi app.js đăng ký listener.
    // Hiển thị ngay hướng dẫn bước đang mở, kể cả khi chưa đổi thanh bước.
    const firstBook = window.LESSON?.book({ page: Number($('slider')?.value) || 1 });
    if (firstBook && $('book-img')) {
      $('book-img').src = firstBook.src;
      $('book-img').alt = firstBook.alt;
      if ($('book-loc')) $('book-loc').textContent = firstBook.loc;
      if ($('book-cap')) $('book-cap').textContent = firstBook.cap;
      if ($('book-pdf')) $('book-pdf').href = firstBook.pdf;
    }
    // Giáo án cải tiến bằng chương trình điều khiển, không có gói lắp thêm.
    // Ẩn chặng sáng tạo trống mà không phải sửa js/app.js dùng chung.
    const creativeTab = $('tab-btn-creative');
    if (creativeTab) {
      creativeTab.hidden = true;
      creativeTab.style.display = 'none';
    }
    try {
      if (localStorage.getItem('zm12_stage') === 'creative') localStorage.setItem('zm12_stage', 'sim');
    } catch (e) {}
    document.addEventListener('keydown', e => {
      if (!active || !['ArrowLeft', 'ArrowRight'].includes(e.key) ||
          !['assembly', 'sim'].includes(e.target?.dataset?.stage)) return;
      e.preventDefault();
      e.stopPropagation();
      const next = e.target.dataset.stage === 'assembly' ? 'sim' : 'assembly';
      window.ZMStages?.go(next, true);
    }, true);
    canvas = $('space-scene');
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    if (typeof ResizeObserver !== 'undefined') new ResizeObserver(resize).observe(canvas);
    else window.addEventListener('resize', resize);
    $('scene-toggle')?.addEventListener('click', () => setMode(currentMode === 'story' ? 'robot' : 'story'));
    $('scene-toast-close')?.addEventListener('click', dismissToast);
    const press = () => window.simEngine?.pressTouch();
    $('scene-hand')?.addEventListener('click', press);
    canvas.addEventListener('click', press);
    document.addEventListener('keydown', e => {
      if (e.code !== 'Space' || !active || currentMode !== 'story' ||
          /^(INPUT|TEXTAREA|BUTTON|SELECT)$/.test(document.activeElement?.tagName || '')) return;
      e.preventDefault();
      press();
    });
    resize();
    if (active && !raf) raf = requestAnimationFrame(frame);
  });

  window.ZMScene = { enter, leave, onEvent, setMode, mode: () => currentMode };
})();
