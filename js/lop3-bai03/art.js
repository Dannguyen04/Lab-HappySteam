// Minh họa riêng: sa bàn thử nghiệm đòn bẩy ở hội khoa học. Các vùng là số liệu trò chơi.
(function () {
  'use strict';
  const W = 900, H = 560, G = 430;
  const XS = [0, 335, 490, 645];
  const COLORS = [null, '#ed9c4e', '#52aab6', '#a18ad4'];
  function rounded(ctx, x, y, w, h, radius, color) {
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.roundRect(x, y, w, h, radius); ctx.fill();
  }
  function text(ctx, text, x, y, size = 18, color = '#35516a', align = 'center') {
    ctx.font = `700 ${size}px "Be Vietnam Pro", "Segoe UI",sans-serif`;
    ctx.textAlign = align; ctx.fillStyle = color; ctx.fillText(text, x, y);
  }
  function background(ctx, now) {
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#a7ddf4'); sky.addColorStop(.72, '#fff3d7'); sky.addColorStop(1, '#d4e9c5');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#fff8df'; ctx.beginPath(); ctx.arc(748, 94, 39, 0, 2 * Math.PI); ctx.fill();
    // Hội khoa học: cờ trang trí, lều triển lãm và cây xanh xa xa.
    ctx.strokeStyle = '#7eafa9'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(0, 65); ctx.quadraticCurveTo(450, 100, 900, 65); ctx.stroke();
    for (let x = 15; x < 900; x += 65) {
      const y = 65 + 16 * Math.sin((x / 900) * Math.PI);
      ctx.fillStyle = ['#f19b78', '#f8d17a', '#95c4dd', '#97caac'][Math.floor(x / 65) % 4];
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 22, y + 4); ctx.lineTo(x + 10, y + 22); ctx.fill();
    }
    rounded(ctx, 30, 112, 235, 59, 18, '#fffdf3');
    text(ctx, 'GÓC KHÁM PHÁ KHOA HỌC', 148, 138, 17);
    text(ctx, 'ĐÒN BẨY & BÓNG MỀM', 148, 160, 15, '#ca824a');
    ctx.fillStyle = '#bbd8bf';
    ctx.beginPath(); ctx.ellipse(450, G + 8, 520, 34, 0, 0, Math.PI * 2); ctx.fill();
    rounded(ctx, 0, G, W, H - G, 0, '#a9cf9b');
    rounded(ctx, 0, G + 40, W, H - G - 40, 0, '#79b29a');
    ctx.strokeStyle = '#e6f4b5'; ctx.lineWidth = 5;
    ctx.setLineDash([26, 17]); ctx.beginPath(); ctx.moveTo(260, G + 9); ctx.lineTo(800, G + 9); ctx.stroke(); ctx.setLineDash([]);
    for (let x = 45; x < 880; x += 137) {
      const y = 510 + Math.sin(now + x / 50) * 2;
      ctx.fillStyle = '#eaf3ca'; ctx.beginPath(); ctx.arc(x, y, 4, 0, 2 * Math.PI); ctx.fill();
    }
  }
  function rings(ctx, sim, now) {
    const target = sim.running ? sim.lastTarget : sim.target;
    for (let i = 1; i <= 3; i++) {
      const x = XS[i], on = target === i;
      rounded(ctx, x - 47, 394, 94, 20, 7, on ? '#e8bd69' : '#cad4d0');
      ctx.strokeStyle = on ? '#dd774f' : COLORS[i]; ctx.lineWidth = on ? 12 : 7;
      ctx.beginPath(); ctx.arc(x, 339, on ? 42 + 2 * Math.sin(now * 2) : 40, 0, 2 * Math.PI); ctx.stroke();
      ctx.strokeStyle = '#fffdf9'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, 339, 31, 0, 2 * Math.PI); ctx.stroke();
      rounded(ctx, x - 46, 232, 92, 31, 11, on ? '#dd7545' : '#ecf7f5');
      text(ctx, `VÙNG ${i}`, x, 253, 16, on ? '#ffffff' : '#497185');
      if (on) { text(ctx, '★', x, 292, 28, '#f9ad4a'); }
      ctx.strokeStyle = '#8ab5a7'; ctx.lineWidth = 6;
      ctx.beginPath(); ctx.moveTo(x, 383); ctx.lineTo(x, 394); ctx.stroke();
    }
  }
  function cart(ctx, sim) {
    // Sơ đồ hình dạng mô hình, không biểu diễn độ căng thật.
    ctx.save(); ctx.translate(125, 376);
    rounded(ctx, -78, 0, 160, 27, 7, '#467c93');
    rounded(ctx, -66, 4, 128, 10, 3, '#88d0d3');
    for (const x of [-54, 55]) {
      ctx.fillStyle = '#29475a'; ctx.beginPath(); ctx.arc(x, 27, 20, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#c4e6dc'; ctx.beginPath(); ctx.arc(x, 27, 10, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = '#f4b368'; ctx.beginPath(); ctx.moveTo(-10, 0); ctx.lineTo(32, -92); ctx.lineTo(58, 0); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#fce0b1'; ctx.beginPath(); ctx.moveTo(4, 0); ctx.lineTo(32, -62); ctx.lineTo(47, 0); ctx.closePath(); ctx.fill();
    const tilt = sim.running ? -.34 + .27 * Math.sin(Math.PI * sim.runT / 1.6) : -.12;
    ctx.translate(32, -72); ctx.rotate(tilt);
    rounded(ctx, -62, -8, 132, 14, 7, '#6c96ad');
    rounded(ctx, -70, -15, 28, 22, 7, '#e4a56c');
    ctx.restore();
    if (sim.has('ballBasket')) {
      rounded(ctx, 51, 346, 34, 27, 6, '#dfaf72');
      for (const x of [62, 74]) { ctx.fillStyle = '#f7deb0'; ctx.beginPath(); ctx.arc(x, 345, 7, 0, 2 * Math.PI); ctx.fill(); }
    }
    if (sim.has('teamSign')) {
      rounded(ctx, 100, 263, 71, 33, 9, '#fff3c5');
      text(ctx, 'ĐỘI 03', 136, 285, 15, '#a26b48');
    }
    if (sim.has('wheelBrake')) rounded(ctx, 40, 412, 30, 12, 4, '#d47c5a');
    if (sim.has('distanceMarks')) {
      ctx.strokeStyle = '#efc55d'; ctx.lineWidth = 5;
      for (const x of [290, 410, 530, 650]) { ctx.beginPath(); ctx.moveTo(x, 432); ctx.lineTo(x, 445); ctx.stroke(); }
    }
  }
  function ball(ctx, sim, now) {
    const x = sim.ballX == null ? 170 : sim.ballX;
    const y = sim.ballY == null ? 339 : sim.ballY;
    if (sim.running) {
      ctx.globalAlpha = .18; ctx.fillStyle = '#d9a75b';
      ctx.beginPath(); ctx.ellipse(x, G, 26, 7, 0, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
    }
    ctx.fillStyle = '#f8ca72'; ctx.beginPath(); ctx.arc(x, y, 15, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff2c8'; ctx.beginPath(); ctx.arc(x - 5, y - 6, 5, 0, 2 * Math.PI); ctx.fill();
    ctx.strokeStyle = '#c58c44'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, 15, 0, 2 * Math.PI); ctx.stroke();
  }
  function draw(ctx, now, sim) {
    background(ctx, now);
    rings(ctx, sim, now);
    cart(ctx, sim);
    ball(ctx, sim, now);
    rounded(ctx, 35, 468, 830, 52, 14, '#f9ffec');
    const status = sim.advanced ? `THỬ THÁCH ĐỔI VÒNG · ${Math.min(3, sim.progress + 1)}/3`
      : 'THỬ NGHIỆM VÒNG GIỮA';
    text(ctx, status, 450, 490, 17, '#3e6982');
    text(ctx, 'Các nấc và vị trí chỉ là minh họa tương tác', 450, 510, 13, '#718b87');
  }
  window.Lop3Bai03Art = { draw };
})();
