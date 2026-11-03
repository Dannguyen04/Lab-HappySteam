// Cảnh câu chuyện Bài 14 lớp 3 (chặng ③). Phần khung (vòng vẽ, thông báo, chùm sao, nút đỏ) ở js/scene-kit.js.
// Nếu art.js chưa nạp, dùng cảnh 2D tối giản có đủ trạng thái cảm biến và nốt.
(function () {
  'use strict';

  const W = 900, H = 560, G = 430;

  function fallback(ctx, sim, now) {
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#17233e'); sky.addColorStop(1, '#6a355c');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#8d6e63'; ctx.fillRect(0, G, W, H - G);
    ctx.save(); ctx.translate(390, 292);
    ctx.fillStyle = '#d9a04f'; ctx.strokeStyle = '#3f2d28'; ctx.lineWidth = 7;
    ctx.beginPath(); ctx.ellipse(0, 40, 93, 119, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#cc8039'; ctx.fillRect(-18, -190, 36, 150);
    ctx.fillStyle = '#323232'; ctx.beginPath(); ctx.arc(0, 34, 28, 0, 7); ctx.fill();
    ctx.strokeStyle = '#fff6db'; ctx.lineWidth = 2;
    for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(i * 6, -190); ctx.lineTo(i * 6, 140); ctx.stroke(); }
    ctx.restore();
    ctx.fillStyle = sim.sensorNear ? '#48e3d0' : '#a6bbd0'; ctx.fillRect(524, 338, 65, 48);
    ctx.fillStyle = '#222'; for (const x of [543, 571]) { ctx.beginPath(); ctx.arc(x, 355, 8, 0, 7); ctx.fill(); }
    const x = 620 + sim.handDist * 185;
    ctx.fillStyle = '#ffcb9a'; ctx.beginPath(); ctx.ellipse(x, 355, 32, 18, -0.2, 0, 7); ctx.fill();
    if (sim.playingNote) {
      ctx.fillStyle = '#ffdf65'; ctx.font = 'bold 64px sans-serif'; ctx.fillText('♫ ' + sim.playingNote, 280, 135);
    }
  }

  window.ZMSceneKit.create({
    W,
    H,
    draw(ctx, now, sim, kit) {
      const art = window.Lop3Bai14Art;
      if (art && typeof art.scene === 'function') {
        art.scene(ctx, { mode: 'interactive', t: sim.t || now, handDist: sim.handDist,
          playingNote: sim.playingNote, curtainOpen: 0.95,
          upgrades: { stand: sim.has('stand'), stageLights: sim.has('stageLights'),
            resonator: sim.has('resonator'), glowStrings: sim.has('glowStrings') } });
      } else fallback(ctx, sim, now);
      kit.label(sim.sensorNear ? 'CẢM BIẾN: CÓ TAY' : 'CẢM BIẾN: ĐƯỜNG TRỐNG', 180, 38, '#fff', 17);
      kit.label(sim.playingNote ? 'ĐANG PHÁT: ' + sim.playingNote : 'ĐANG CHỜ ĐÚNG NHỊP', 735, 38, '#fff', 16);
      kit.label('LƯỢT KHÁN GIẢ ' + (sim.round + 1) + ' / 3', 750, G + 70, '#fff', 18);
    },
    onEvent(type, data, kit) {
      if (type === 'sampleDone') {
        kit.burst(W / 2, G - 90);
        kit.toast('ok', 'Đúng 7 khối mẫu!', 'Đàn phát A khi có tay và B khi tay rời cảm biến.');
      } else if (type === 'performance') {
        kit.burst(440, 270, 16);
        if (data.notes === 'B–A') kit.toast('ok', 'Đổi giai điệu thành công!', 'Đã phát B–A đúng hai trạng thái cảm biến.');
      } else if (type === 'mistake') {
        kit.shake(0.35);
        kit.toast('warn', 'Chưa đúng nhịp', data.message);
      } else if (type === 'audience' && data.round > 1) {
        kit.toast('ok', 'Khán giả lượt ' + data.round, 'Tay giữ trước cảm biến ' + data.hold.toFixed(1) + ' giây.');
      }
    }
  });
})();
