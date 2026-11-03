// Cảnh câu chuyện Bài 5 lớp 3 (chặng ③): tuyến phố khu dân cư nhìn ngang. Phần khung (vòng vẽ, thông báo, chùm sao, nút đỏ) ở js/scene-kit.js.
// Hình xe và gói sáng tạo lấy từ js/lop3-bai05/art.js (window.TruckArt) khi có.
(function () {
  'use strict';

  const W = 900,
    H = 560,
    ROAD = 440; // mặt đường
  const X0 = 110,
    PER_M = 85; // pixel cho mỗi mét
  const px = m => X0 + m * PER_M;
  const CELL = [5.5, 6.5],
    WALL = 7.5,
    FRONT = 52; // đầu xe cách tâm xe

  function bin(c, x, color) {
    c.fillStyle = color;
    c.fillRect(x - 12, ROAD - 40, 24, 40);
    c.fillStyle = '#1e2a34';
    c.fillRect(x - 14, ROAD - 44, 28, 6);
  }
  function fallbackTruck(c, x, y) {
    c.fillStyle = '#3dc1dc';
    c.fillRect(x - 72, y - 88, 92, 58);
    c.fillStyle = '#ff8a3d';
    c.fillRect(x + 24, y - 70, 48, 40);
    c.fillStyle = '#1e2a34';
    c.beginPath();
    c.arc(x - 48, y - 6, 17, 0, Math.PI * 2);
    c.fill();
    c.beginPath();
    c.arc(x + 44, y - 6, 17, 0, Math.PI * 2);
    c.fill();
  }

  window.ZMSceneKit.create({
    W,
    H,
    idleHidden: sim => sim.running || sim.parked || sim.crashed || sim.x > 0,
    draw(ctx, now, sim, kit) {
      if (typeof sim.inCell !== 'function') return;
      const art = window.TruckArt;
      const sky = ctx.createLinearGradient(0, 0, 0, ROAD);
      sky.addColorStop(0, '#8fd3ff');
      sky.addColorStop(1, '#e3f5ff');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, ROAD);
      // nhà dọc phố
      const homes = ['#ffd9a8', '#ffb4a2', '#cdeac0', '#bde0fe'];
      for (let i = 0; i < 6; i++) {
        ctx.fillStyle = homes[i % 4];
        ctx.fillRect(20 + i * 150, ROAD - 190 - (i % 3) * 20, 120, 190 + (i % 3) * 20);
        ctx.fillStyle = '#fff';
        ctx.fillRect(50 + i * 150, ROAD - 150, 24, 28);
        ctx.fillRect(90 + i * 150, ROAD - 150, 24, 28);
      }
      ctx.fillStyle = '#8c9aa6';
      ctx.fillRect(0, ROAD, W, 70);
      ctx.fillStyle = '#6db843';
      ctx.fillRect(0, ROAD + 70, W, H - ROAD - 70);
      ctx.fillStyle = '#fff';
      for (let x = 20; x < W; x += 70) ctx.fillRect(x, ROAD + 36, 36, 5);
      // ô gom rác
      const cw = (CELL[1] - CELL[0]) * PER_M;
      ctx.fillStyle = sim.inCell() ? 'rgba(67,160,71,.75)' : 'rgba(61,193,220,.55)';
      ctx.fillRect(px(CELL[0]), ROAD + 4, cw, 60);
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 6]);
      ctx.strokeRect(px(CELL[0]), ROAD + 4, cw, 60);
      ctx.setLineDash([]);
      bin(ctx, px(6) - 20, '#43a047');
      bin(ctx, px(6) + 20, '#1e88e5');
      // dải chắn cuối phố
      const wx = px(WALL) + FRONT + 6;
      for (let i = 0; i < 5; i++) {
        ctx.fillStyle = i % 2 ? '#fff' : '#e53935';
        ctx.fillRect(wx, ROAD - 60 + i * 24, 26, 24);
      }
      const o = {
        wheel: sim.wheel,
        crashed: sim.crashed,
        ben: sim.has('ben') && sim.parked,
        plow: sim.has('plow'),
        lid: sim.has('lid'),
        divider: sim.has('divider')
      };
      const y = ROAD + 40;
      if (art && art.drawTruck) art.drawTruck(ctx, px(sim.x), y, o);
      else fallbackTruck(ctx, px(sim.x), y);
      const text = (s, x, yy, size = 17, color = '#fff') => kit.label(s, x, yy, color, size);
      text('Ô GOM RÁC', px(6), ROAD + 92, 16, '#fff');
      text('DẢI CHẮN', wx + 14, ROAD - 72, 14, '#fff');
      text(`${sim.x.toFixed(1)} / ${WALL} m`, 130, 43, 23);
      if (sim.advanced) text(sim.heavy ? 'Tải: ĐẦY RÁC NẶNG (xe trôi khi phanh)' : 'Tải: nhẹ', 480, 44, 18, sim.heavy ? '#ffdcad' : '#fff');
      if (sim.crashed) text('Xe đâm dải chắn! Hãy chạy ít giây hơn.', 450, 110, 20, '#ffe3ca');
      else if (sim.parked) text('XE ĐÃ ĐỖ ĐÚNG Ô GOM RÁC', 450, 110, 22, '#d7ffe6');
    },
    onEvent(type, data, kit) {
      const sim = window.simEngine;
      if (type === 'sampleDone') {
        kit.toast('ok', 'Đúng như trong sách!', 'Xe chạy nhanh và liên tục như chương trình mẫu.');
      } else if (type === 'warn') kit.toast('warn', 'Sắp tới dải chắn!', 'Dừng motor đúng ô xanh, đừng để xe chạy quá.');
      else if (type === 'crash') {
        if (kit.shake) kit.shake(0.7);
        kit.toast('bad', 'Xe đâm dải chắn!', 'Bỏ vòng lặp, chạy High rồi Chờ 3 giây và Dừng.', sim ? { label: 'Thử lại', run: () => sim.start() } : null);
      } else if (type === 'short') kit.toast('warn', 'Xe chưa vào đúng ô', data < CELL[0] ? 'Xe dừng sớm: tăng thời gian chạy.' : 'Xe dừng quá ô: giảm thời gian chạy.');
      else if (type === 'park') {
        kit.burst(px(6), ROAD);
        kit.toast('ok', 'Đỗ đúng ô gom rác!', data.heavy ? 'Dù chở nặng xe vẫn dừng vừa ô.' : `Xe dừng sau ${data.secs.toFixed(1)} giây.`);
        if (window.SFX?.ding) window.SFX.ding();
      }
    },
    init() {
      const modeBtn = document.getElementById('btn-mode');
      if (modeBtn && typeof MutationObserver !== 'undefined') {
        const fix = () => {
          if (modeBtn.textContent === 'Chế độ: Bé') modeBtn.textContent = 'Chế độ: Cơ bản';
        };
        new MutationObserver(fix).observe(modeBtn, { childList: true, characterData: true, subtree: true });
        fix();
      }
    }
  });
})();
