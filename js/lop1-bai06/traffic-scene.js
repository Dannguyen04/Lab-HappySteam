// Cảnh câu chuyện Bài 6 lớp 1 (chặng ③). Phần khung (vòng vẽ, thông báo, chùm sao, nút đỏ) ở js/scene-kit.js.
// Hình vẽ đẹp do Antigravity làm trong js/lop1-bai06/art.js; đây là hình đơn giản để bài chạy được ngay.
(function () {
  'use strict';

  const W = 900, H = 560, G = 365;
  const rect = (c, color, x, y, w, h) => { c.fillStyle = color; c.fillRect(x, y, w, h); };
  const circle = (c, color, x, y, r) => {
    c.fillStyle = color; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill();
  };
  function signal(c, sim, kit, now) {
    rect(c, '#4b5c6c', 791, 185, 9, 182);
    c.fillStyle = '#273448'; c.beginPath(); c.roundRect(757, 83, 76, 125, 14); c.fill();
    ['red', 'yellow', 'green'].forEach((v, i) => {
      circle(c, v === sim.light ? { red: '#fa5466', yellow: '#ffdd52', green: '#41df91' }[v] : '#546374', 795, 110 + 37 * i, 14);
      if (v === sim.light) { c.strokeStyle = '#fff2b8'; c.lineWidth = 2; c.beginPath(); c.arc(795, 110 + 37 * i, 18 + Math.sin(now * 4), 0, 7); c.stroke(); }
    });
    if (sim.advanced) {
      c.fillStyle = '#fff'; c.beginPath(); c.roundRect(732, 230, 126, 32, 10); c.fill();
      kit.label('🕒 ' + sim.greenDuration + 's ↻', 795, 253, '#305b81', 19);
    }
  }
  function car(c, sim, now) {
    const x = Math.min(680, 75 + (sim.distance || 0) * 230);
    c.save(); c.translate(x, 427);
    c.fillStyle = 'rgba(24,44,65,.22)'; c.beginPath(); c.ellipse(0, 36, 92, 13, 0, 0, 7); c.fill();
    c.fillStyle = '#279bbb'; c.beginPath(); c.roundRect(-78, -15, 160, 47, 12); c.fill();
    c.fillStyle = '#56cdd7'; c.beginPath(); c.roundRect(-51, -45, 100, 35, 10); c.fill();
    rect(c, '#c8f5ff', -34, -38, 45, 23); rect(c, '#c8f5ff', 19, -38, 23, 23);
    rect(c, '#ffe17e', 72, 3, 11, 13); rect(c, '#ff6e7a', -78, 3, 10, 13);
    for (const p of [-47, 50]) { circle(c, '#2b364b', p, 31, 21); circle(c, '#d5e8e9', p, 31, 10); }
    if (sim.has?.('beacon')) { rect(c, Math.floor(now * 5) % 2 ? '#ff555e' : '#ffe17e', -12, -58, 25, 13); }
    if (sim.has?.('bumper')) rect(c, '#ffebaa', 78, 19, 20, 9);
    if (sim.has?.('sign')) rect(c, '#ffdf88', -84, -39, 17, 20);
    if (sim.has?.('shield')) rect(c, '#f6ffff', 45, -43, 6, 30);
    c.restore();
  }

  window.ZMSceneKit.create({
    W,
    H,
    init(cv) {
      cv.addEventListener('click', event => {
        const box = cv.getBoundingClientRect();
        const x = (event.clientX - box.left) * W / box.width;
        const y = (event.clientY - box.top) * H / box.height;
        if (x > 730 && x < 860 && y > 82 && y < 265) window.simEngine?.cycleGreenDuration();
      });
    },
    draw(ctx, now, sim, kit) {
      if (window.Lop1Bai06Art?.draw?.(ctx, now, sim, kit) === true) return;
      const sky = ctx.createLinearGradient(0, 0, 0, G);
      sky.addColorStop(0, '#8fd3ff'); sky.addColorStop(1, '#edfaff');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, G);
      circle(ctx, '#ffe698', 710, 78, 37);
      for (const [x, y] of [[50, 77], [345, 56], [574, 98]]) {
        circle(ctx, '#fff', x, y, 26); circle(ctx, '#fff', x + 33, y - 8, 28); circle(ctx, '#fff', x + 68, y, 22);
      }
      rect(ctx, '#7acb8f', 0, 296, W, 70);
      rect(ctx, '#ffd58d', 144, 122, 302, 185);
      ctx.strokeStyle = '#de9974'; ctx.lineWidth = 10;
      ctx.beginPath(); ctx.moveTo(130, 124); ctx.lineTo(290, 50); ctx.lineTo(460, 124); ctx.stroke();
      rect(ctx, '#fff4cb', 169, 140, 250, 36);
      kit.label('TRƯỜNG HỌC', 294, 166, '#327d86', 22);
      for (const x of [178, 266, 354]) rect(ctx, '#8ce0eb', x, 194, 52, 51);
      rect(ctx, '#6387a8', 277, 251, 51, 57);
      for (const x of [70, 510, 872]) {
        rect(ctx, '#97714f', x - 6, 280, 12, 65);
        circle(ctx, '#4dab70', x, 260, 36); circle(ctx, '#6bcd87', x - 12, 249, 26);
      }
      rect(ctx, '#e4dab9', 0, 343, W, 20);
      rect(ctx, '#63798b', 0, G, W, H - G);
      rect(ctx, '#effaff', 0, G, W, 6);
      rect(ctx, '#ffe8a4', 0, 503, W, 6);
      for (let x = 16; x < W; x += 120) rect(ctx, '#e0e8e4', x, 475, 70, 5);
      for (let x = 565; x < 752; x += 31) rect(ctx, '#fff', x, 385, 21, 68);
      rect(ctx, '#f2fdff', 552, G, 5, 103);
      kit.label('QUA ĐƯỜNG AN TOÀN', 652, 545, '#fff', 17);
      signal(ctx, sim, kit, now);
      car(ctx, sim, now);
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.roundRect(15, 12, 238, 45, 15); ctx.fill();
      kit.label(sim.failed ? '⚠️ CHƯA KỊP' : sim.motorOn ? (sim.power >= 8 ? '🐇 XE CHẠY NHANH' : '🐢 XE CHẠY CHẬM') : '✋ DỪNG / CHỜ ĐÈN',
        135, 42, sim.failed ? '#b94450' : '#25819b', 17);
      if (sim.greenPassed) kit.label('⭐ ĐÃ QUA KỊP ĐÈN XANH!', 477, 85, '#279660', 21);
      if (sim.failed) {
        ctx.fillStyle = '#fff3e5'; ctx.beginPath(); ctx.roundRect(245, 304, 418, 46, 14); ctx.fill();
        kit.label('🐢 Chậm chưa kịp! Thử 🐇 nhé!', 455, 335, '#b45142', 20);
      }
    },
    onEvent(type, data, kit) {
      if (type === 'sampleDone') {
        kit.burst(565, 402);
        kit.toast('ok', 'Đúng như trong sách!', 'Xanh nhanh, vàng chậm, đỏ dừng.');
      }
      if (type === 'crossed') kit.burst(565, 402);
      if (type === 'miss') { kit.shake(.3); kit.toast('warn', 'Thử lại nhé!', data?.message || 'Chọn tốc độ nhanh hơn.'); }
      if (type === 'duration') kit.toast('info', 'Đèn xanh ' + data + ' giây', 'Hãy chạy lại để so sánh.');
    }
  });
})();
