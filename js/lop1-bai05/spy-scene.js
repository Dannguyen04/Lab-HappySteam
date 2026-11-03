// Cổng trường nhìn ngang, đồ họa Canvas dự phòng khi chưa có art.js từ Antigravity.
(function () {
  'use strict';

  const W = 900, H = 560, G = 451;
  const round = (c, x, y, w, h, r, color) => {
    c.fillStyle = color;
    c.beginPath();
    c.roundRect(x, y, w, h, r);
    c.fill();
  };
  const circle = (c, x, y, r, color) => {
    c.fillStyle = color;
    c.beginPath();
    c.arc(x, y, r, 0, Math.PI * 2);
    c.fill();
  };
  function kid(c, x, y, color, walking) {
    c.save();
    c.translate(x, y);
    c.lineWidth = 11;
    c.lineCap = 'round';
    c.strokeStyle = '#364c74';
    c.beginPath();
    c.moveTo(-8, 42); c.lineTo(-12 + walking * 6, 79);
    c.moveTo(8, 42); c.lineTo(12 - walking * 6, 79);
    c.stroke();
    round(c, -27, -16, 54, 65, 13, color);
    c.strokeStyle = '#efbc98';
    c.lineWidth = 9;
    c.beginPath();
    c.moveTo(-24, -4); c.lineTo(-40, 22);
    c.moveTo(24, -4); c.lineTo(37, -8 - walking * 12);
    c.stroke();
    circle(c, 0, -44, 28, '#ffc99b');
    c.fillStyle = '#393b51';
    c.beginPath();
    c.arc(0, -51, 29, Math.PI, Math.PI * 2);
    c.fill();
    circle(c, -8, -42, 2.5, '#37425a');
    circle(c, 8, -42, 2.5, '#37425a');
    c.strokeStyle = '#ac5f5f'; c.lineWidth = 2;
    c.beginPath(); c.arc(0, -35, 7, 0, Math.PI); c.stroke();
    c.restore();
  }
  function robot(c, sim, now) {
    c.save();
    c.translate(365, 375);
    // Bóng chân, chân đế chữ nhật và thân Smart Hub
    c.fillStyle = 'rgba(25,55,70,.17)';
    c.beginPath(); c.ellipse(0, 77, 96, 15, 0, 0, Math.PI * 2); c.fill();
    round(c, -69, 56, 53, 24, 9, '#263f5c');
    round(c, 16, 56, 53, 24, 9, '#263f5c');
    round(c, -53, -16, 22, 75, 7, '#70c7d5');
    round(c, 32, -16, 22, 75, 7, '#70c7d5');
    round(c, -65, -115, 130, 110, 16, '#f2f8ff');
    round(c, -53, -102, 106, 87, 12, '#344e78');
    round(c, -45, -94, 90, 62, 8, '#11263e');
    // Màn hình ma trận LED thay biểu cảm khi tới khối Display.
    if (sim.face === 'smile' || sim.face === 'wink' || sim.face === 'heart') {
      if (sim.face === 'heart') {
        c.fillStyle = '#ff7d9d'; c.font = 'bold 47px sans-serif';
        c.textAlign = 'center'; c.fillText('♥', 0, -44);
      } else {
        circle(c, -20, -72, 6, '#ffdb6e');
        if (sim.face === 'wink') {
          c.fillStyle = '#ffdb6e'; c.fillRect(14, -74, 18, 4);
        } else circle(c, 21, -72, 6, '#ffdb6e');
        c.strokeStyle = '#ffdb6e'; c.lineWidth = 5; c.lineCap = 'round';
        c.beginPath(); c.arc(0, -68, 26, 0.2, Math.PI - 0.2); c.stroke();
      }
    } else {
      circle(c, -22, -68, 5, '#8bf0ee'); circle(c, 22, -68, 5, '#8bf0ee');
    }
    round(c, -42, -4, 84, 22, 9, '#55b4c5');
    // Hai mắt siêu âm và hai ăng-ten.
    round(c, -67, -158, 134, 51, 13, '#d7f4ff');
    circle(c, -35, -133, 19, '#52718d');
    circle(c, 35, -133, 19, '#52718d');
    circle(c, -35, -133, 11, '#1b344e');
    circle(c, 35, -133, 11, '#1b344e');
    c.strokeStyle = '#47738c'; c.lineWidth = 7; c.lineCap = 'round';
    c.beginPath();
    c.moveTo(-41, -157); c.lineTo(-55, -190);
    c.moveTo(41, -157); c.lineTo(55, -190);
    c.stroke();
    circle(c, -55, -191, 8, '#ffb753'); circle(c, 55, -191, 8, '#ffb753');
    // Tay trái giữ thăng bằng; tay phải nối động cơ quay để vẫy chào/tạm biệt.
    c.strokeStyle = '#476a86'; c.lineWidth = 17;
    c.beginPath(); c.moveTo(-66, -85); c.lineTo(-106, -56); c.stroke();
    circle(c, -107, -55, 15, '#f7b552');
    c.save();
    c.translate(67, -84);
    const waving = sim.waving ? Math.sin(sim.rev * Math.PI * 2) * 0.48 : 0;
    c.rotate(-0.3 + waving);
    c.strokeStyle = '#476a86'; c.lineWidth = 18;
    c.beginPath(); c.moveTo(0, 0); c.lineTo(49, -27); c.lineTo(70, -79); c.stroke();
    circle(c, 70, -81, 16, '#f8bd5e');
    for (let i = 0; i < 3; i++) {
      c.strokeStyle = '#f8bd5e'; c.lineWidth = 5;
      c.beginPath(); c.moveTo(64 + i * 6, -92); c.lineTo(64 + i * 6, -104); c.stroke();
    }
    c.restore();
    if (sim.phase === 'searching') {
      c.strokeStyle = 'rgba(29,165,195,.45)'; c.lineWidth = 4;
      c.setLineDash([8, 8]);
      for (let n = 0; n < 2; n++) {
        c.beginPath(); c.arc(0, -133, 100 + n * 25 + Math.sin(now * 3) * 6, -0.5, 0.5); c.stroke();
      }
      c.setLineDash([]);
    }
    c.restore();
  }

  window.ZMSceneKit.create({
    W, H,
    init() {
      const hand = document.getElementById('scene-hand');
      if (!hand) return;
      hand.title = 'Vẫy tay trước cảm biến siêu âm';
      hand.setAttribute('aria-label', 'Vẫy tay trước cảm biến siêu âm');
      hand.addEventListener('click', () => window.simEngine?.press());
    },
    draw(c, now, sim, kit) {
      const sky = c.createLinearGradient(0, 0, 0, G);
      sky.addColorStop(0, '#75c8f8'); sky.addColorStop(1, '#f9e8be');
      c.fillStyle = sky; c.fillRect(0, 0, W, H);
      circle(c, 757, 81, 38, '#ffe39a');
      for (const [x, y, s] of [[70, 86, 1], [544, 56, .75], [744, 148, .85]]) {
        c.fillStyle = 'rgba(255,255,255,.85)';
        c.beginPath(); c.ellipse(x, y, 54 * s, 17 * s, 0, 0, Math.PI * 2); c.fill();
      }
      // Trường học, cổng chào, sân và lối đi.
      round(c, 58, 158, 228, 290, 14, '#ffc67d');
      round(c, 78, 178, 188, 64, 9, '#fff0c9');
      kit.label('TRƯỜNG HỌC', 172, 220, '#4f647b', 23);
      for (let r = 0; r < 2; r++) for (let col = 0; col < 2; col++) {
        round(c, 94 + col * 90, 269 + r * 85, 65, 55, 6, '#8cd5f0');
        c.fillStyle = '#fff0c9'; c.fillRect(123 + col * 90, 269 + r * 85, 6, 55);
      }
      round(c, 303, 160, 13, 292, 5, '#f4b260');
      round(c, 855, 160, 13, 292, 5, '#f4b260');
      round(c, 300, 152, 568, 42, 13, '#fff6da');
      kit.label('🌈 CỔNG TRƯỜNG THÂN THIỆN 🌈', 582, 181, '#376c86', 21);
      c.fillStyle = '#8ed8a7'; c.fillRect(0, G - 3, W, H - G + 3);
      c.fillStyle = '#f9dfac'; c.fillRect(0, G + 12, W, 74);
      for (let i = 0; i < 11; i++) {
        round(c, i * 92 + 17, G + 41, 55, 6, 2, '#fff8e6');
      }
      for (const x of [18, 820]) {
        round(c, x, 340, 17, 105, 8, '#7a9961');
        circle(c, x + 7, 328, 46, '#5dab71');
        circle(c, x - 13, 350, 25, '#78c58c');
      }
      const searching = sim.phase === 'searching';
      const farewell = sim.detected >= 1;
      const approaching = searching && !farewell;
      const walking = Math.sin(now * 7);
      const friendX = approaching
        ? Math.max(659, 839 - sim.sensorElapsed * 145)
        : farewell ? (sim.phase === 'farewell' || !sim.running ? 768 : 653) : 842;
      // Người đi ngang 45 cm có màu khác để phân biệt với bạn ở 28 cm.
      if (searching && sim.sensorElapsed > 0.3 && sim.sensorElapsed < 1.15) {
        c.save(); c.globalAlpha = .72;
        kid(c, 769 - (sim.sensorElapsed - .3) * 150, 376, '#bdabd7', walking);
        c.restore();
      }
      kid(c, friendX, 374, '#ff839e', walking);
      robot(c, sim, now);
      if (sim.phase === 'greeting' || (sim.face === 'smile' && !farewell)) {
        round(c, 413, 127, 175, 56, 19, '#fff');
        kit.label('Xin chào bạn! 😊', 500, 163, '#386f80', 18);
      } else if (sim.phase === 'farewell' || (sim.face === 'wink' && !sim.running)) {
        round(c, 422, 127, 192, 56, 19, '#fff');
        kit.label('Hẹn gặp lại! 👋', 519, 163, '#386f80', 18);
      } else if (searching) {
        round(c, 398, 132, 210, 53, 18, '#fff');
        kit.label('Ai đang đến nhỉ? 🔎', 502, 165, '#386f80', 17);
      }
      round(c, 261, 490, 208, 43, 17, '#365976');
      kit.label('🤖 SPY ROBOT', 365, 517, '#fff5d3', 20);
    },
    onEvent(type, data, kit) {
      if (type === 'sampleDone') {
        kit.burst(365, 220, 20);
        kit.toast('ok', 'Robot chào và tạm biệt!', 'Đúng hai giai điệu, hai biểu cảm và hai chiều tay.');
      } else if (type === 'friendlyWave') {
        kit.burst(672, 345, 14);
        kit.toast('ok', 'Chào thật thân thiện!', 'Bạn có đủ 2 giây để đáp lời robot.');
      } else if (type === 'sensorMaster') {
        kit.burst(665, 260, 18);
        kit.toast('ok', 'Đúng cự ly!', '30 cm giúp robot nhận ra bạn mà không chào nhầm.');
      } else if (type === 'miss') {
        kit.toast('warn', 'Thử lại cảm biến nhé!', data.message);
      }
    }
  });
})();
