// Sa bàn xe nâng nhìn ngang trong nhà kho. Có thể thay từng nét vẽ qua window.Lop3Bai02Art.
(function () {
  'use strict';
  const W = 900, H = 560, G = 432, ORIGIN = 125, SCALE = 7.1;
  const at = cm => ORIGIN + cm * SCALE;
  const box = (c, x, y, w, h, color) => { c.fillStyle = color; c.fillRect(x, y, w, h); };
  const fallback = {
    background(c) {
      const wall = c.createLinearGradient(0, 0, 0, G);
      wall.addColorStop(0, '#dcecf6'); wall.addColorStop(1, '#a7c7d8');
      c.fillStyle = wall; c.fillRect(0, 0, W, H);
      for (let x = 0; x < W; x += 150) box(c, x, 0, 8, G, '#8faabb');
      box(c, 50, 55, 310, 164, '#c4dee9');
      for (let x = 50; x < 360; x += 62) box(c, x, 55, 5, 164, '#6f9cae');
      for (let y = 55; y < 220; y += 55) box(c, 50, y, 310, 5, '#6f9cae');
      box(c, 582, 39, 282, 64, '#274c63');
      c.font = 'bold 27px sans-serif'; c.fillStyle = '#f8d27a';
      c.fillText('KHO HÀNG 03', 605, 80);
      box(c, 0, G - 7, W, 7, '#536f80');
      box(c, 0, G, W, H - G, '#688391');
      box(c, 0, G + 42, W, 7, '#a8b9bb');
      for (let x = 48; x < W; x += 125) box(c, x, G + 105, 72, 6, '#f2d47a');
      box(c, at(44), G - 107, at(56) - at(44), 107, 'rgba(59,207,171,.22)');
      c.strokeStyle = '#18a58a'; c.lineWidth = 3;
      c.strokeRect(at(44), G - 107, at(56) - at(44), 107);
      c.strokeStyle = '#dc806a'; c.setLineDash([7, 6]);
      c.beginPath(); c.moveTo(at(70), 245); c.lineTo(at(70), G); c.stroke(); c.setLineDash([]);
      c.font = 'bold 15px sans-serif'; c.fillStyle = '#173b50'; c.textAlign = 'center';
      c.fillText('Ô TẬP KẾT', at(50), G - 120);
      c.fillText('PALLET', at(70), 237);
      c.textAlign = 'left';
    },
    pallet(c, x, gy, loaded) {
      box(c, x - 39, gy - 76, 78, 54, '#c49057');
      box(c, x - 39, gy - 29, 78, 8, '#86532f');
      c.strokeStyle = '#80522e'; c.lineWidth = 3; c.strokeRect(x - 39, gy - 76, 78, 54);
      box(c, x - 42, gy - 18, 84, 12, '#6f492c');
      for (const dx of [-27, 23]) box(c, x + dx, gy - 6, 10, 12, '#795331');
      c.fillStyle = '#422a1f'; c.font = 'bold 13px sans-serif'; c.fillText('HÀNG', x - 23, gy - 43);
      if (loaded) { c.fillStyle = '#147c6e'; c.fillText('ĐÃ NÂNG', x - 34, gy - 85); }
    },
    forklift(c, x, gy, sim, now) {
      c.save(); c.translate(x, gy);
      box(c, -108, -107, 100, 75, '#f5b54a');
      box(c, -97, -135, 59, 32, '#417088');
      box(c, -110, -32, 114, 20, '#2f5566');
      c.strokeStyle = '#334b5d'; c.lineWidth = 7; c.beginPath();
      c.moveTo(-23, -30); c.lineTo(-23, -162); c.lineTo(-8, -162); c.lineTo(-8, -30); c.stroke();
      for (const wx of [-82, -20]) {
        c.save(); c.translate(wx, -17); c.rotate((sim.rev || 0) * Math.PI * 2);
        c.fillStyle = '#243440'; c.beginPath(); c.arc(0, 0, 24, 0, 7); c.fill();
        c.fillStyle = '#9db5bf'; c.beginPath(); c.arc(0, 0, 9, 0, 7); c.fill();
        c.strokeStyle = '#617988'; c.lineWidth = 3; c.beginPath();
        c.moveTo(-14, 0); c.lineTo(14, 0); c.moveTo(0, -14); c.lineTo(0, 14); c.stroke(); c.restore();
      }
      const upgrades = sim.upgrades || new Set();
      if (upgrades.has('twinWheels')) {
        c.fillStyle = '#253a46'; c.beginPath(); c.arc(-111, -18, 22, 0, 7); c.fill();
        c.fillStyle = '#a9bcc4'; c.beginPath(); c.arc(-111, -18, 8, 0, 7); c.fill();
      }
      if (upgrades.has('backRest')) { c.strokeStyle = '#59b28e'; c.lineWidth = 7; c.strokeRect(-9, -133, 19, 101); }
      const fy = -27 - (sim.loaded ? 44 : 0) + sim.forkDown * 22;
      box(c, -15, fy, 49 + (upgrades.has('wideFork') ? 23 : 0), 9, '#b7c9d0');
      if (upgrades.has('warning')) {
        c.fillStyle = Math.sin(now * 12) > 0 ? '#ff8429' : '#fbe37d';
        c.beginPath(); c.arc(-82, -147, 10, 0, 7); c.fill();
      }
      c.restore();
    },
    hazard(c, x, gy) {
      box(c, x - 40, gy - 58, 80, 33, '#ec9764');
      box(c, x - 27, gy - 76, 55, 18, '#9b5835');
      for (const dx of [-25, 24]) { c.fillStyle = '#344854'; c.beginPath(); c.arc(x + dx, gy - 19, 13, 0, 7); c.fill(); }
    }
  };
  window.ZMSceneKit.create({
    W,
    H,
    draw(ctx, now, sim, kit) {
      const art = window.Lop3Bai02Art || {};
      (art.background || fallback.background)(ctx, now, sim);
      // Trước khi nâng, pallet đứng tại 70 cm. Sau khi nâng, đi theo xe.
      const px = at(sim.x || 0);
      (art.pallet || fallback.pallet)(ctx, at(sim.loaded ? sim.x - 10 : 70), G - (sim.loaded ? 47 : 13), !!sim.loaded);
      (art.forklift || fallback.forklift)(ctx, px, G - 19, sim, now);
      if (sim.hazard > 0) {
        (art.hazard || fallback.hazard)(ctx, at(49), G - 19);
        kit.label('DỪNG! CÓ XE HÀNG CHẮN ĐƯỜNG', W / 2, 156, '#a53324', 20);
      }
      if (sim.failed) kit.label('CẦN SỬA CHƯƠNG TRÌNH', W / 2, 194, '#ae3427', 22);
      else if (sim.delivered) kit.label('PALLET ĐÃ VỀ Ô TẬP KẾT!', W / 2, 194, '#087f68', 22);
      kit.label(`M1: ${sim.x.toFixed(1)} cm   ·   M2: ${((1 - sim.forkDown) * 100).toFixed(0)}%   ·   ${sim.loaded ? 'Đang chở pallet' : 'Đang tiếp cận hàng'}`,
        W / 2, G + 77, '#fff', 17);
    },
    onEvent(type, data, kit) {
      if (type === 'found') kit.toast('ok', 'Cảm biến đã thấy pallet', 'Xe dừng ở ngưỡng phát hiện, chuẩn bị hạ càng.');
      if (type === 'picked') kit.toast('ok', 'Nâng pallet thành công', 'Càng nâng đã vào đúng gầm pallet.');
      if (type === 'hazard') kit.toast('warn', 'Có vật cản trên đường lùi', 'Hãy thêm Đợi đường trống trước lệnh M1 lùi.');
      if (type === 'miss') { kit.shake(); kit.toast('warn', 'Cần điều chỉnh', data.message); }
      if (type === 'sampleDone') {
        kit.toast('ok', 'Đã chạy đủ 16 khối sách', 'Để nâng pallet đúng, hãy đổi Chờ M1 tiến vào từ 1 lên 2 giây.');
      }
      if (type === 'delivered') { kit.burst(at(50), G - 90); kit.toast('ok', 'Đã đưa pallet về đích!', 'Xe hoàn thành chu trình vận chuyển.'); }
    }
  });
  // Trang học dùng chung có vài nhãn mặc định từ bài vũ trụ; đổi riêng cho bài xe nâng.
  const localize = () => {
    const tab = document.querySelector('#tab-btn-sim small');
    if (tab) tab.textContent = 'Sa bàn nhà kho';
    const victory = document.querySelector('#victory-modal h2');
    if (victory) victory.textContent = 'Hoàn thành bốn nhiệm vụ chính';
    const card = document.getElementById('mc-text');
    if (card) {
      const update = () => {
        if (card.textContent.includes('vệ tinh'))
          card.textContent = 'Em có thể tự lập trình thêm hành trình vận chuyển mới cho xe nâng.';
      };
      new MutationObserver(update).observe(card, { childList: true });
      update();
    }
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', localize);
  else localize();
})();
