// Sa bàn Bài 13 nhìn từ trên xuống. X/Y là cm, Y hướng lên và theta dương rẽ trái.
// SnowArt của bộ kit cung cấp hình nhìn ngang; ở đây vẽ xe từ trên cao để phản ánh đúng hai bánh.
(function () {
  'use strict';
  const W = 900, H = 560, PX = 3.05, ORIGIN_X = 95, ORIGIN_Y = 336;
  const $ = id => document.getElementById(id);
  const xy = (x, y) => [ORIGIN_X + x * PX, ORIGIN_Y - y * PX];
  const fx = { puffs: [], shakeUntil: 0 };
  const retry = { label: 'Thử lại', run: () => window.simEngine?.start() };

  function round(c, x, y, w, h, r, fill, stroke) {
    c.beginPath();
    c.roundRect(x, y, w, h, r);
    c.fillStyle = fill; c.fill();
    if (stroke) { c.strokeStyle = stroke; c.lineWidth = 2.5; c.stroke(); }
  }
  function sceneBase(c, sim, t) {
    const sky = c.createLinearGradient(0, 0, W, H);
    sky.addColorStop(0, '#d6f0fb');
    sky.addColorStop(1, '#e6f7ff');
    c.fillStyle = sky;
    c.fillRect(0, 0, W, H);
    round(c, 40, 58, 820, 435, 28, '#effaff', '#8fb4ce');
    // Những đường kẻ mờ gợi sân rộng, không phải rào chặn.
    c.strokeStyle = 'rgba(57,120,160,.14)';
    c.lineWidth = 1;
    for (let x = 75; x < 860; x += 61) {
      c.beginPath(); c.moveTo(x, 62); c.lineTo(x, 492); c.stroke();
    }
    for (let y = 92; y < 493; y += 61) {
      c.beginPath(); c.moveTo(44, y); c.lineTo(857, y); c.stroke();
    }
    // Ga-ra và điểm xuất phát
    const [gx, gy] = xy(0, 0);
    round(c, gx - 45, gy - 38, 63, 77, 10, '#bfd5e5', '#365775');
    round(c, gx - 38, gy - 27, 48, 56, 6, '#6b9fbd', '#365775');
    c.textAlign = 'center'; c.font = '700 14px "Be Vietnam Pro", sans-serif';
    c.fillStyle = '#244d71'; c.fillText('GA-RA', gx - 16, gy + 61);
    // Vạch biên ở cuối sân; chạy vượt biên sẽ báo va chạm.
    const [wallX] = xy(sim.trackEnd(), 0);
    c.fillStyle = '#98b0c0'; c.fillRect(wallX, 80, 14, 394);
    c.fillStyle = '#536d7c';
    for (let y = 90; y < 455; y += 35) {
      c.save(); c.translate(wallX + 7, y); c.rotate(Math.PI / 4);
      c.fillRect(-7, -7, 14, 14); c.restore();
    }
    c.fillStyle = '#244d71'; c.font = '700 14px "Be Vietnam Pro", sans-serif';
    c.fillText('MÉP SÂN', wallX, 65);
    c.fillStyle = '#4c7591';
    c.textAlign = 'left'; c.font = '600 15px "Be Vietnam Pro", sans-serif';
    c.fillText(sim.advanced ? '❄ BÃO TUYẾT · SÂN NÂNG CAO' : '❄ XE DỌN TUYẾT · SÂN CỦA BÉ', 57, 34);
    if (!sim.advanced) {
      c.font = '600 15px "Be Vietnam Pro", sans-serif';
      c.fillText('Xe tiến → rồi rẽ trái ↶ để dọn tuyết', 415, 35);
    } else {
      c.font = '600 13px "Be Vietnam Pro", sans-serif';
      c.fillText('5 đống · tối đa 4 lượt tiến · thử Chờ 2 giây', 475, 35);
    }
    // Tuyết rơi nhẹ, cố định theo thời gian để cảnh liên tục và dễ nhận biết vật cản.
    c.fillStyle = 'rgba(255,255,255,.88)';
    for (let i = 0; i < 55; i++) {
      const x = 65 + (i * 103 + 17) % 770, y = 90 + (i * 67 + t * 13) % 380;
      c.beginPath(); c.arc(x, y, i % 3 + 1.5, 0, 2 * Math.PI); c.fill();
    }
  }
  function pile(c, p, index) {
    const [x, y] = xy(p.x, p.y);
    c.fillStyle = 'rgba(41,97,130,.17)';
    c.beginPath(); c.ellipse(x + 4, y + 5, 37, 26, 0, 0, 2 * Math.PI); c.fill();
    const g = c.createRadialGradient(x - 9, y - 8, 4, x, y, 35);
    g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#b8d7ec');
    c.fillStyle = g;
    c.strokeStyle = '#709fbd'; c.lineWidth = 2.5;
    c.beginPath(); c.ellipse(x, y, 34, 23, 0, 0, 2 * Math.PI); c.fill(); c.stroke();
    c.fillStyle = '#406789'; c.textAlign = 'center'; c.font = '800 16px sans-serif';
    c.fillText(String(index + 1), x, y + 6);
  }
  function car(c, sim, now) {
    const [x, y] = xy(sim.x, sim.y);
    const shake = now < fx.shakeUntil ? Math.sin(now * 65) * 3 : 0;
    c.save(); c.translate(x + shake, y); c.rotate(-sim.theta);
    if (sim.running && sim.motion === 'forward') {
      c.fillStyle = 'rgba(84,190,235,.22)';
      c.beginPath(); c.moveTo(18, -12); c.lineTo(125, -58);
      c.lineTo(125, 58); c.lineTo(18, 12); c.closePath(); c.fill();
    }
    // Trục bánh trái/phải và vạch quay riêng theo quãng đường mỗi bánh.
    for (const side of [-1, 1]) {
      round(c, -21, side * 17 - 8, 37, 16, 5, '#284b62', '#142d40');
      const rev = side === -1 ? sim.wheelLeft : sim.wheelRight;
      c.strokeStyle = '#8fe2f6'; c.lineWidth = 3;
      const markerX = -3 + 11 * Math.cos(rev * 2 * Math.PI);
      const markerY = side * 17 + 5 * Math.sin(rev * 2 * Math.PI);
      c.beginPath(); c.moveTo(-3, side * 17); c.lineTo(markerX, markerY); c.stroke();
    }
    round(c, -28, -17, 57, 34, 9, '#ffbf30', '#344e60');
    round(c, -16, -12, 22, 24, 5, '#a8e7f7', '#47687b');
    round(c, 9, -11, 17, 22, 5, '#ffd965', '#c78816');
    c.fillStyle = '#e4f6ff'; c.strokeStyle = '#416479'; c.lineWidth = 2.5;
    c.beginPath(); c.moveTo(26, -24); c.lineTo(40, -28);
    c.lineTo(40, 28); c.lineTo(26, 24); c.closePath(); c.fill(); c.stroke();
    if (sim.has('blade')) { c.strokeStyle = '#52a1c5'; c.lineWidth = 6; c.beginPath(); c.moveTo(39, -30); c.lineTo(39, 30); c.stroke(); }
    if (sim.has('beacon')) {
      c.fillStyle = Math.sin(now * 10) > 0 ? '#ff7900' : '#ffe29b';
      c.beginPath(); c.arc(-7, 0, 6, 0, 2 * Math.PI); c.fill();
    }
    if (sim.has('salt')) round(c, -29, -10, 12, 20, 2, '#95b39b', '#3a7656');
    if (sim.has('chain')) {
      c.strokeStyle = '#cbd5d9'; c.lineWidth = 2.5; c.setLineDash([3, 3]);
      c.strokeRect(-23, -26, 41, 17); c.strokeRect(-23, 9, 41, 17); c.setLineDash([]);
    }
    // Vạch hướng đầu xe cho học sinh biết xe đang nhìn phía nào.
    c.strokeStyle = '#2672a2'; c.lineWidth = 3; c.beginPath(); c.moveTo(41, 0); c.lineTo(62, 0); c.stroke();
    c.fillStyle = '#2672a2'; c.beginPath(); c.moveTo(66, 0); c.lineTo(56, -5); c.lineTo(56, 5); c.closePath(); c.fill();
    if (sim.hand) {
      c.textAlign = 'center'; c.font = '33px "Segoe UI Emoji",sans-serif';
      c.fillText('✋', 83, -20);
    }
    c.restore();
  }
  function draw(ctx, now, sim) {
    sceneBase(ctx, sim, now);
    for (let i = 0; i < sim.piles.length; i++) if (!sim.piles[i].cleared) pile(ctx, sim.piles[i], i);
    fx.puffs = fx.puffs.filter(p => now - p.t < 0.75);
    for (const p of fx.puffs) {
      const k = (now - p.t) / 0.75;
      ctx.globalAlpha = 1 - k;
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(p.x + p.vx * k, p.y + p.vy * k, 6 + 8 * k, 0, 2 * Math.PI); ctx.fill();
    }
    ctx.globalAlpha = 1;
    car(ctx, sim, now);
    if (sim.advanced) {
      round(ctx, 52, 503, 435, 42, 12, 'rgba(255,255,255,.9)', '#9bbbd0');
      ctx.textAlign = 'left'; ctx.fillStyle = '#204e6e'; ctx.font = '600 13px "Be Vietnam Pro",sans-serif';
      ctx.fillText('Mức 8 ≈ 39,3 cm/giây · Rẽ trái 0,2 giây ≈ 11,5°', 67, 530);
    }
    $('scene-hand')?.classList.toggle('is-waiting', !!sim.waitingHand);
  }
  function onEvent(type, data, kit) {
    const now = performance.now() / 1000, sim = window.simEngine;
    if (type === 'hand') window.SFX?.tone(880, .1);
    if (type === 'seen') window.SFX?.tone(1320, .12);
    if (type === 'push') {
      const [x, y] = xy(data.x, data.y);
      for (let i = 0; i < 9; i++) {
        const a = i * 2 * Math.PI / 9;
        fx.puffs.push({ t: now, x, y, vx: Math.cos(a) * 60, vy: Math.sin(a) * 60 });
      }
      window.SFX?.tone(520, .1);
    } else if (type === 'crash') {
      fx.shakeUntil = now + .7; kit.shake(.7);
      kit.toast('bad', 'Xe chạm mép sân!', 'Hãy thử Chờ ít giây hơn hoặc đổi hướng trước mép sân.', retry);
    } else if (type === 'stuck') {
      fx.shakeUntil = now + .4; kit.shake(.4);
      kit.toast('bad', 'Tuyết dày quá!', 'Hãy chạy ở mức ' + data.need + ' trở lên hoặc gắn lưỡi gạt tuyết.', retry);
    } else if (type === 'deliver') {
      window.SFX?.ding();
      kit.toast('ok', 'Dọn sạch sân rồi!', 'Xe đã dọn ' + sim.piles.length + ' đống tuyết sau ' + data.cycles + ' lượt tiến.');
    } else if (type === 'short') {
      kit.toast('bad', 'Vẫn còn tuyết', 'Còn ' + data.left + ' đống. Hãy điều chỉnh thời gian tiến/rẽ.', retry);
    } else if (type === 'timeout') {
      kit.toast('bad', 'Cảm biến đang chờ', 'Không thấy vật cản trước đầu xe. Bấm ✋ để đưa tay vào trước cảm biến.', retry);
    } else if (type === 'target' && sim?.advanced) {
      kit.toast('ok', 'Bão tuyết!', 'Có ' + data + ' đống tuyết, hãy dọn sạch trong tối đa 4 lượt tiến.');
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
    if (!active && ['crash', 'stuck', 'deliver', 'short', 'timeout', 'target'].includes(type)) return;
    dispatch(type, data);
  };
})();
