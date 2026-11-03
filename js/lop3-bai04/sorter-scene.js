// Cảnh ③: trạm phân loại tại khu dân cư, nhìn ngang; rác đỏ/trái và xanh/phải.
(function () {
  'use strict';
  const W = 900, H = 560, G = 456;
  const roundRect = (c, x, y, w, h, r, fill) => {
    c.fillStyle = fill;
    c.beginPath(); c.roundRect(x, y, w, h, r); c.fill();
  };
  const text = (c, label, x, y, size = 18, color = '#1e4050') => {
    c.fillStyle = color; c.font = `bold ${size}px system-ui, sans-serif`;
    c.textAlign = 'center'; c.fillText(label, x, y);
  };
  const bag = (c, x, y, color, tilt = 0, scale = 1) => {
    c.save(); c.translate(x, y); c.rotate(tilt); c.scale(scale, scale);
    const fill = color === 'red' ? '#f56877' : '#479fdf';
    c.fillStyle = fill; c.strokeStyle = '#325773'; c.lineWidth = 3;
    c.beginPath(); c.moveTo(-13, -22); c.lineTo(-20, -5); c.quadraticCurveTo(-24, 14, 0, 14);
    c.quadraticCurveTo(24, 14, 20, -5); c.lineTo(13, -22); c.closePath(); c.fill(); c.stroke();
    c.beginPath(); c.moveTo(-5, -22); c.lineTo(-8, -29); c.lineTo(7, -29); c.lineTo(5, -22); c.fill();
    c.fillStyle = '#fff'; c.beginPath(); c.arc(-4, -7, 3, 0, Math.PI * 2); c.arc(5, -7, 3, 0, Math.PI * 2); c.fill();
    c.restore();
  };
  const fallback = (ctx, now, sim) => {
    const sky = ctx.createLinearGradient(0, 0, 0, G);
    sky.addColorStop(0, '#addef6'); sky.addColorStop(1, '#eef8ee');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#d9e8db'; ctx.fillRect(0, G, W, H - G);
    ctx.fillStyle = '#8aaf80'; ctx.fillRect(0, G, W, 9);
    // Các căn nhà giúp trẻ nhận ra bối cảnh khu dân cư.
    for (const [x, hue] of [[34, '#f2cb9b'], [165, '#edd7ad'], [690, '#e0d5cd'], [785, '#e9c29b']]) {
      ctx.fillStyle = hue; ctx.fillRect(x, 163, 110, 198);
      ctx.fillStyle = '#cd877a'; ctx.beginPath(); ctx.moveTo(x - 11, 165);
      ctx.lineTo(x + 55, 112); ctx.lineTo(x + 121, 165); ctx.fill();
      for (let k = 0; k < 2; k++) roundRect(ctx, x + 19 + k * 51, 196, 33, 43, 3, '#88b9d4');
    }
    roundRect(ctx, 266, 55, 364, 59, 17, '#ffffffdb');
    text(ctx, 'TRẠM PHÂN LOẠI RÁC THÔNG MINH', 448, 92, 23);
    // Băng tải đến mắt màu phía trước trạm.
    roundRect(ctx, 45, 365, 270, 22, 9, '#405e70');
    for (let i = 0; i < 8; i++) { ctx.fillStyle = '#9cb6bd'; ctx.beginPath(); ctx.arc(65 + i * 34, 376, 5, 0, 7); ctx.fill(); }
    roundRect(ctx, 307, 254, 279, 144, 14, '#e6f0e9');
    ctx.strokeStyle = '#426273'; ctx.lineWidth = 7; ctx.strokeRect(309, 256, 277, 138);
    // Ngăn rác hai phía: có nhãn màu và số túi chính xác.
    for (const item of [{ x: 330, color: 'red', title: 'NGĂN ĐỎ', side: 'TRÁI' }, { x: 510, color: 'blue', title: 'NGĂN XANH', side: 'PHẢI' }]) {
      roundRect(ctx, item.x - 83, 389, 162, 105, 9, item.color === 'red' ? '#d56b7b' : '#539dd0');
      roundRect(ctx, item.x - 69, 400, 134, 78, 6, '#f7f5ed');
      text(ctx, item.title, item.x, 424, 15);
      text(ctx, item.side, item.x, 447, 13, '#55717b');
    }
    // Cảm biến quét màu BE-1153 và bộ M1, cánh tay gạt.
    roundRect(ctx, 383, 291, 119, 68, 12, '#427c86');
    roundRect(ctx, 400, 302, 86, 38, 7, '#91dde5');
    ctx.fillStyle = sim.current()?.color === 'red' ? '#f56877' : '#479fdf';
    ctx.beginPath(); ctx.arc(443, 321, 12, 0, 7); ctx.fill();
    roundRect(ctx, 420, 368, 47, 37, 7, '#344d64');
    ctx.save(); ctx.translate(444, 367); ctx.rotate((sim.armAngle || 0) * Math.PI / 180);
    ctx.strokeStyle = sim.has('paddedArm') ? '#f0ca8e' : '#fee1a4';
    ctx.lineWidth = sim.has('paddedArm') ? 20 : 13;
    ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -89); ctx.stroke();
    ctx.restore();
    text(ctx, 'M1', 442, 393, 13, '#fff');
    // Những túi đã xử lý được vẽ tách biệt, túi sai nằm dưới ngăn.
    const counts = { red: 0, blue: 0 };
    for (const b of sim.bags || []) {
      if (b.state === 'sorted') {
        const n = counts[b.color]++;
        bag(ctx, (b.color === 'red' ? 300 : 480) + 28 * (n % 3), 475 - 31 * Math.floor(n / 3), b.color, 0, .57);
      } else if (b.state === 'fallen' || b.state === 'caught') {
        bag(ctx, 620 + (b.id - 1) * 43, b.state === 'caught' ? 497 : 511, b.color, .92, .75);
      }
    }
    if (sim.current() && sim.current().state === 'incoming') bag(ctx, 236 - Math.min(80, (sim.runT * 22) % 80), 349, sim.current().color);
    if (sim.scanned) bag(ctx, 444, 279, sim.scanned.color, (sim.armAngle || 0) / 200, .85);
    if (sim.has('funnel')) {
      ctx.fillStyle = '#76d5b2'; ctx.beginPath(); ctx.moveTo(279, 316); ctx.lineTo(353, 344);
      ctx.lineTo(353, 367); ctx.lineTo(279, 348); ctx.closePath(); ctx.fill();
    }
    if (sim.has('lids')) for (const x of [330, 510]) roundRect(ctx, x - 78, 383, 155, 10, 4, '#f5b86d');
    if (sim.has('tray')) roundRect(ctx, 608, 527, 230, 18, 7, '#f4b86e');
    text(ctx, `${sim.got()}/4 túi đúng  ·  ${sim.missed()} túi trượt`, 445, 534, 20, '#204d56');
    if (sim.advanced) text(ctx, 'NÂNG CAO · dòng rác đến nhanh', 448, 142, 17, '#b24e53');
  };
  window.ZMSceneKit.create({
    W, H,
    draw(ctx, now, sim, kit) {
      if (window.Lop3Bai04Art?.draw) window.Lop3Bai04Art.draw(ctx, now, sim, kit);
      else fallback(ctx, now, sim);
    },
    onEvent(type, data, kit) {
      if (type === 'sorted') {
        kit.burst(data.color === 'red' ? 330 : 510, 404);
        kit.toast('ok', `Túi ${data.id} vào đúng ngăn!`, data.color === 'red' ? 'Màu đỏ → ngăn trái.' : 'Màu xanh → ngăn phải.');
      } else if (type === 'miss') {
        kit.toast('warn', 'Túi bị gạt trượt!', data.caught ? 'Khay giữ lại túi, nhưng chưa phân loại đúng.' : 'Hãy chỉnh chiều quay hoặc thời gian chờ.');
      } else if (type === 'sampleDone') {
        kit.toast('ok', 'Đã chạy đủ mẫu 13 khối', 'Hoàn thành một vòng đỏ–xanh.');
      } else if (type === 'allSorted') {
        kit.burst(446, 325);
        kit.toast('ok', 'Phân loại thành công!', 'Cả 4 túi đều ở đúng ngăn.');
      }
    }
  });
})();
