// Thư viện vẽ cảnh Bài 10: Bạn gió tinh nghịch (cối xoay gió, ngôi nhà, cục pin, dây điện, thời tiết).
// Lab-HappySteam – đồ hoạ phẳng thân thiện cho học sinh tiểu học (lớp 1, 6–7 tuổi).
// Không dùng thư viện ngoài, không ảnh ngoài, không Math.random() khi vẽ; chạy tốt trên file://.
(function () {
  'use strict';

  var W = 900;
  var H = 560;
  var GROUND_Y = 440;

  // Bảng màu chuẩn của mô hình ZM Alpha 330 và phong cách bài học
  var C = {
    dark: '#1e2a34',
    white: '#ffffff',
    teal: '#3dc1dc',
    tealDark: '#0e6f8a',
    tealLight: '#8ee6f5',
    red: '#e53935',
    redDark: '#9e1b1b',
    redLight: '#ff7675',
    yellow: '#ffd23f',
    green: '#43a047',
    greenLight: '#8cc152',
    amber: '#f4a742',
    hole: '#e1e8ed'
  };

  // =========================================================================
  // 1. VẼ NỀN VÀ THỜI TIẾT (drawBackground)
  // weather: 'calm' (êm ả) | 'light' (gió nhẹ) | 'strong' (gió mạnh) | 'storm' (bão)
  // =========================================================================
  function drawBackground(ctx, t, weather) {
    weather = weather || 'calm';
    t = Number.isFinite(t) ? t : 0;

    // --- Bầu trời ---
    var skyG = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
    if (weather === 'storm') {
      skyG.addColorStop(0, '#27263d');
      skyG.addColorStop(0.6, '#3e3b59');
      skyG.addColorStop(1, '#534f70');
    } else if (weather === 'strong') {
      skyG.addColorStop(0, '#748b9c');
      skyG.addColorStop(0.7, '#9fb3c2');
      skyG.addColorStop(1, '#c5d5e2');
    } else if (weather === 'light') {
      skyG.addColorStop(0, '#63bbf8');
      skyG.addColorStop(0.7, '#a5dcff');
      skyG.addColorStop(1, '#dcf2ff');
    } else {
      // calm: trời trong xanh rực rỡ
      skyG.addColorStop(0, '#4faaf0');
      skyG.addColorStop(0.6, '#93d3fc');
      skyG.addColorStop(1, '#d8f0ff');
    }
    ctx.fillStyle = skyG;
    ctx.fillRect(0, 0, W, H);

    // --- Mặt trời hiền hoà (calm & light) ---
    if (weather === 'calm' || weather === 'light') {
      var sunX = 130;
      var sunY = 95;
      // Quầng hào quang
      var sunHalo = ctx.createRadialGradient(sunX, sunY, 15, sunX, sunY, 70);
      sunHalo.addColorStop(0, 'rgba(255, 235, 120, 0.55)');
      sunHalo.addColorStop(0.5, 'rgba(255, 220, 80, 0.2)');
      sunHalo.addColorStop(1, 'rgba(255, 210, 60, 0)');
      ctx.fillStyle = sunHalo;
      ctx.beginPath();
      ctx.arc(sunX, sunY, 70, 0, Math.PI * 2);
      ctx.fill();

      // Đĩa mặt trời
      ctx.fillStyle = '#ffde59';
      ctx.strokeStyle = C.dark;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(sunX, sunY, 26, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Má hồng mặt trời
      ctx.fillStyle = 'rgba(255, 120, 100, 0.45)';
      ctx.beginPath();
      ctx.arc(sunX - 11, sunY + 4, 4, 0, Math.PI * 2);
      ctx.arc(sunX + 11, sunY + 4, 4, 0, Math.PI * 2);
      ctx.fill();

      // Mắt cười hiền
      ctx.strokeStyle = C.dark;
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(sunX - 9, sunY - 2, 3, Math.PI, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(sunX + 9, sunY - 2, 3, Math.PI, Math.PI * 2);
      ctx.stroke();
      // Nụ cười
      ctx.beginPath();
      ctx.arc(sunX, sunY + 5, 8, 0.2 * Math.PI, 0.8 * Math.PI);
      ctx.stroke();
    }

    // --- Mây trôi ---
    function drawCloud(cx, cy, scale, fillColor, shadowColor) {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(scale, scale);

      // Thân mây (các khối cầu chập lại)
      ctx.fillStyle = shadowColor;
      ctx.beginPath();
      ctx.arc(-32, 2, 20, 0, Math.PI * 2);
      ctx.arc(-8, -14, 26, 0, Math.PI * 2);
      ctx.arc(22, -6, 22, 0, Math.PI * 2);
      ctx.arc(44, 4, 16, 0, Math.PI * 2);
      ctx.rect(-34, 4, 80, 18);
      ctx.fill();

      ctx.fillStyle = fillColor;
      ctx.beginPath();
      ctx.arc(-32, -1, 19, 0, Math.PI * 2);
      ctx.arc(-8, -17, 25, 0, Math.PI * 2);
      ctx.arc(22, -9, 21, 0, Math.PI * 2);
      ctx.arc(44, 1, 15, 0, Math.PI * 2);
      ctx.rect(-34, 1, 80, 17);
      ctx.fill();

      // Viền nét đậm
      ctx.strokeStyle = C.dark;
      ctx.lineWidth = 2.5 / scale;
      ctx.beginPath();
      ctx.arc(-32, -1, 19, 0.65 * Math.PI, 1.45 * Math.PI);
      ctx.arc(-8, -17, 25, 0.9 * Math.PI, 1.85 * Math.PI);
      ctx.arc(22, -9, 21, 1.15 * Math.PI, 1.85 * Math.PI);
      ctx.arc(44, 1, 15, 1.6 * Math.PI, 0.35 * Math.PI);
      ctx.lineTo(-32, 18);
      ctx.arc(-32, -1, 19, 0.5 * Math.PI, 0.65 * Math.PI);
      ctx.stroke();

      ctx.restore();
    }

    if (weather === 'calm') {
      // 2 cụm mây trắng lơ lửng rất chậm
      var c1x = ((t * 8 + 80) % 1060) - 80;
      var c2x = ((t * 6 + 620) % 1060) - 80;
      drawCloud(c1x, 85, 0.8, '#ffffff', '#e3f1fb');
      drawCloud(c2x, 130, 0.65, '#ffffff', '#e3f1fb');
    } else if (weather === 'light') {
      // Vài mây trắng bay chậm
      var l1x = ((t * 22 + 50) % 1100) - 100;
      var l2x = ((t * 18 + 420) % 1100) - 100;
      var l3x = ((t * 26 + 820) % 1100) - 100;
      drawCloud(l1x, 75, 0.85, '#ffffff', '#def0fc');
      drawCloud(l2x, 140, 0.65, '#ffffff', '#def0fc');
      drawCloud(l3x, 95, 0.75, '#ffffff', '#def0fc');
    } else if (weather === 'strong') {
      // Mây xám trôi nhanh
      var s1x = ((t * 70 + 40) % 1150) - 150;
      var s2x = ((t * 85 + 460) % 1150) - 150;
      var s3x = ((t * 65 + 860) % 1150) - 150;
      drawCloud(s1x, 65, 1.0, '#ccd7df', '#a2b4c2');
      drawCloud(s2x, 125, 0.8, '#bccad4', '#93a6b5');
      drawCloud(s3x, 80, 0.9, '#c6d2db', '#9cb0bf');
    } else if (weather === 'storm') {
      // Mây đen vần vũ, xám tím dày đặc
      var st1x = ((t * 110 + 20) % 1200) - 200;
      var st2x = ((t * 130 + 440) % 1200) - 200;
      var st3x = ((t * 95 + 850) % 1200) - 200;
      drawCloud(st1x, 50, 1.25, '#4e4a64', '#2d2b40');
      drawCloud(st2x, 110, 1.05, '#433f57', '#282537');
      drawCloud(st3x, 65, 1.15, '#49455d', '#2b293c');
    }

    // --- Tia chớp (chỉ khi bão, xác định theo t, KHÔNG Math.random) ---
    var isLightning = false;
    if (weather === 'storm') {
      var strikePeriod = 6.2;
      var strikePhase = ((t % strikePeriod) + strikePeriod) % strikePeriod;
      // Hai nhịp chớp liên tiếp: nhịp 1 ở giây 3.8-3.92, nhịp 2 ở 4.00-4.14
      if ((strikePhase >= 3.8 && strikePhase < 3.92) || (strikePhase >= 4.0 && strikePhase < 4.14)) {
        isLightning = true;
        var flashStrength = strikePhase >= 4.0 ? 0.65 : 0.4;
        ctx.fillStyle = 'rgba(235, 240, 255, ' + flashStrength.toFixed(2) + ')';
        ctx.fillRect(0, 0, W, H);

        // Vẽ tia sét ngoằn ngoèo từ mây xuống đồi xa
        ctx.save();
        ctx.strokeStyle = 'rgba(200, 225, 255, 0.5)';
        ctx.lineWidth = 8;
        ctx.lineJoin = 'miter';
        ctx.beginPath();
        ctx.moveTo(430, 70);
        ctx.lineTo(415, 130);
        ctx.lineTo(440, 180);
        ctx.lineTo(405, 245);
        ctx.lineTo(425, 290);
        ctx.lineTo(395, 360);
        ctx.stroke();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Nhánh phụ của tia sét
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(440, 180);
        ctx.lineTo(470, 215);
        ctx.lineTo(460, 250);
        ctx.stroke();
        ctx.restore();
      }
    }

    // --- Đồi cỏ xa (hàng sau) ---
    ctx.save();
    var hillFarColor = weather === 'storm' ? '#3c4c34' : weather === 'strong' ? '#5c8f49' : '#82cb5e';
    ctx.fillStyle = hillFarColor;
    ctx.strokeStyle = C.dark;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);
    ctx.bezierCurveTo(160, 360, 320, 350, 480, 380);
    ctx.bezierCurveTo(620, 405, 760, 350, 900, 370);
    ctx.lineTo(900, GROUND_Y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // --- Đồi cỏ gần (hàng trước) ---
    ctx.save();
    var hillNearColor = weather === 'storm' ? '#475e3c' : weather === 'strong' ? '#6eaa55' : '#94da6e';
    ctx.fillStyle = hillNearColor;
    ctx.strokeStyle = C.dark;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);
    ctx.bezierCurveTo(120, 410, 220, 385, 340, 395);
    ctx.bezierCurveTo(500, 410, 640, 375, 780, 385);
    ctx.bezierCurveTo(830, 388, 870, 395, 900, 405);
    ctx.lineTo(900, GROUND_Y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // --- Mặt đất (dưới GROUND_Y = 440) ---
    var groundGrad = ctx.createLinearGradient(0, GROUND_Y, 0, H);
    if (weather === 'storm') {
      groundGrad.addColorStop(0, '#36482c');
      groundGrad.addColorStop(0.25, '#2e3d25');
      groundGrad.addColorStop(1, '#232b1d');
    } else if (weather === 'strong') {
      groundGrad.addColorStop(0, '#568b3c');
      groundGrad.addColorStop(0.25, '#487532');
      groundGrad.addColorStop(1, '#345224');
    } else {
      groundGrad.addColorStop(0, '#6db843');
      groundGrad.addColorStop(0.2, '#5da137');
      groundGrad.addColorStop(1, '#437626');
    }
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, GROUND_Y, W, H - GROUND_Y);

    // Đường viền ngăn cách mặt đất
    ctx.strokeStyle = C.dark;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);
    ctx.lineTo(W, GROUND_Y);
    ctx.stroke();

    // --- Bụi cỏ trên mặt đất (nghiêng theo gió) ---
    // calm: cỏ đứng thẳng; light: hơi lay động; strong: nghiêng rõ rệt; storm: rạp mạnh
    var lean = 0;
    if (weather === 'light') {
      lean = 0.12 * Math.sin(t * 3.5);
    } else if (weather === 'strong') {
      lean = 0.55 + 0.15 * Math.sin(t * 5.0);
    } else if (weather === 'storm') {
      lean = 0.95 + 0.25 * Math.sin(t * 7.5);
    }

    ctx.save();
    ctx.strokeStyle = weather === 'storm' ? '#263420' : weather === 'strong' ? '#3c6328' : '#4d832e';
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    for (var gx = 15; gx < W; gx += 28) {
      // Dùng hàm băm sin(gx) để cỏ mọc so le tự nhiên nhưng cố định mỗi khung hình
      var ph = Math.sin(gx * 12.9898) * 43758.5453;
      var hG = 9 + (Math.abs(ph) % 8);
      var xOff = Math.sin(gx) * 5;
      var curLean = lean + (Math.sin(gx + t * 4) * (weather === 'storm' ? 0.15 : 0.05));
      var topX = gx + xOff + curLean * hG;
      var topY = GROUND_Y - hG;

      ctx.beginPath();
      ctx.moveTo(gx + xOff, GROUND_Y);
      ctx.quadraticCurveTo(gx + xOff + curLean * hG * 0.4, GROUND_Y - hG * 0.6, topX, topY);
      ctx.stroke();

      // Nhánh cỏ con kế bên
      var subTopX = gx + xOff + 4 + (curLean + 0.1) * (hG - 3);
      ctx.beginPath();
      ctx.moveTo(gx + xOff + 4, GROUND_Y);
      ctx.quadraticCurveTo(gx + xOff + 4 + curLean * (hG - 3) * 0.4, GROUND_Y - (hG - 3) * 0.6, subTopX, GROUND_Y - (hG - 3));
      ctx.stroke();
    }
    ctx.restore();

    // --- Hoa nhỏ thân thiện trên thảm cỏ (calm & light) ---
    if (weather === 'calm' || weather === 'light') {
      var flowerX = [60, 180, 390, 480, 640, 840];
      for (var fi = 0; fi < flowerX.length; fi++) {
        var fx = flowerX[fi];
        var fy = GROUND_Y + 18 + (fi % 3) * 8;
        ctx.fillStyle = fi % 2 === 0 ? '#ffea79' : '#ffffff';
        ctx.beginPath();
        ctx.arc(fx, fy, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ff6b6b';
        ctx.beginPath();
        ctx.arc(fx, fy, 1.8, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // --- Mưa xiên (chỉ khi bão, tính toán theo t, KHÔNG Math.random) ---
    if (weather === 'storm') {
      ctx.save();
      ctx.strokeStyle = isLightning ? 'rgba(235, 245, 255, 0.75)' : 'rgba(195, 215, 245, 0.42)';
      ctx.lineWidth = 1.8;
      ctx.lineCap = 'round';
      var rainCount = 55;
      for (var ri = 0; ri < rainCount; ri++) {
        // Tốc độ rơi mạnh: x trôi ngang 420 px/s, y rơi 880 px/s
        var rx = ((ri * 73 + t * 440) % (W + 120)) - 60;
        var ry = ((ri * 47 + t * 880) % H);
        ctx.beginPath();
        ctx.moveTo(rx, ry);
        ctx.lineTo(rx - 12, ry + 24);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  // =========================================================================
  // 2. VẼ VỆT GIÓ THỔI NGANG (drawWindLines)
  // strength: 0–1 (0 = không vẽ; càng cao càng nhiều vệt, bay càng nhanh)
  // =========================================================================
  function drawWindLines(ctx, t, strength) {
    strength = Number.isFinite(strength) ? Math.max(0, Math.min(1, strength)) : 0;
    if (strength <= 0.001) return;
    t = Number.isFinite(t) ? t : 0;

    var speed = 150 + 360 * strength;
    var alpha = 0.3 + 0.45 * strength;

    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, ' + alpha.toFixed(3) + ')';
    ctx.lineWidth = 2.6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // 6 vệt gió ở các cao độ khác nhau, có xoắn lượn uốn tròn ngộ nghĩnh
    var lines = [
      { y: 80, len: 130, hasLoop: true, speedMul: 1.05 },
      { y: 135, len: 100, hasLoop: false, speedMul: 0.9 },
      { y: 185, len: 150, hasLoop: true, speedMul: 1.15 },
      { y: 245, len: 110, hasLoop: false, speedMul: 0.95 },
      { y: 305, len: 140, hasLoop: true, speedMul: 1.1 },
      { y: 365, len: 90, hasLoop: false, speedMul: 0.85 }
    ];

    for (var i = 0; i < lines.length; i++) {
      var item = lines[i];
      var totalW = W + 260;
      var x = ((t * speed * item.speedMul + i * 185) % totalW) - 130;
      var y = item.y;

      ctx.beginPath();
      if (item.hasLoop) {
        // Vệt gió có lượn một vòng xoáy nhỏ ở đuôi rồi vút đi
        ctx.moveTo(x, y);
        ctx.lineTo(x + 45, y);
        ctx.bezierCurveTo(x + 70, y - 16, x + 82, y + 15, x + 66, y + 15);
        ctx.bezierCurveTo(x + 52, y + 15, x + 58, y - 4, x + 90, y - 5);
        ctx.lineTo(x + item.len, y - 5);
      } else {
        // Vệt gió uốn sóng mềm mại
        ctx.moveTo(x, y);
        ctx.quadraticCurveTo(x + item.len * 0.35, y - 10, x + item.len * 0.7, y + 6);
        ctx.quadraticCurveTo(x + item.len * 0.85, y + 10, x + item.len, y + 4);
      }
      ctx.stroke();
    }

    ctx.restore();
  }

  // =========================================================================
  // 3. VẼ CỐI XOAY GIÓ (drawWindmill)
  // x = tâm chân trụ trên mặt đất (GROUND_Y = 440)
  // Tâm cánh quạt: hubY = 180 (cao hơn mặt đất 260 px)
  // =========================================================================
  function drawWindmill(ctx, x, o) {
    o = o || {};
    var angle = Number.isFinite(o.angle) ? o.angle : 0;
    var blades = o.blades === 6 ? 6 : 3;
    var isLong = !!o.long;
    var isLight = !!o.light;
    var isTail = !!o.tail;
    var isPressed = !!o.pressed;
    var shake = Number.isFinite(o.shake) ? Math.max(0, Math.min(1, o.shake)) : 0;
    var t = Number.isFinite(o.t) ? o.t : 0;

    var gy = GROUND_Y;
    var hubY = gy - 260; // 180

    ctx.save();

    // Rung bão (chỉ lắc nhẹ trục x theo tần số cao)
    if (shake > 0) {
      var shakeDx = Math.sin(t * 46) * 3.6 * shake;
      ctx.translate(shakeDx, 0);
    }

    // -------------------------------------------------------------
    // A. ĐUÔI LÁI GIÓ (phía sau động cơ, vẽ trước để nằm dưới trục quay)
    // -------------------------------------------------------------
    if (isTail) {
      ctx.save();
      // Khung nối bằng 2 thanh giằng trắng
      ctx.fillStyle = C.white;
      ctx.strokeStyle = C.dark;
      ctx.lineWidth = 2.5;

      // Thanh trên
      ctx.fillRect(x + 18, hubY - 14, 52, 6);
      ctx.strokeRect(x + 18, hubY - 14, 52, 6);
      // Thanh dưới
      ctx.fillRect(x + 18, hubY + 8, 52, 6);
      ctx.strokeRect(x + 18, hubY + 8, 52, 6);

      // Cánh đuôi hình thang / tam giác khí động học (xanh ngọc, viền xanh đậm)
      ctx.beginPath();
      ctx.moveTo(x + 48, hubY);
      ctx.lineTo(x + 88, hubY - 26);
      ctx.lineTo(x + 94, hubY - 24);
      ctx.lineTo(x + 94, hubY + 24);
      ctx.lineTo(x + 88, hubY + 26);
      ctx.closePath();
      ctx.fillStyle = C.teal;
      ctx.fill();
      ctx.strokeStyle = C.dark;
      ctx.lineWidth = 2.8;
      ctx.stroke();

      // Họa tiết gân trợ lực trên cánh đuôi
      ctx.fillStyle = C.tealDark;
      ctx.beginPath();
      ctx.moveTo(x + 56, hubY);
      ctx.lineTo(x + 86, hubY - 18);
      ctx.lineTo(x + 86, hubY + 18);
      ctx.closePath();
      ctx.fill();

      // Chốt tròn Lego trên đuôi
      ctx.fillStyle = C.white;
      ctx.strokeStyle = C.dark;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(x + 84, hubY, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.restore();
    }

    // -------------------------------------------------------------
    // B. ĐẾ CỐI XOAY GIÓ (Hộp bộ não trắng - xanh ngọc, nút đỏ)
    // -------------------------------------------------------------
    var baseW = 114;
    var baseH = 46;
    var baseLeft = x - baseW / 2;
    var baseTop = gy - baseH;

    // Thân hộp đế dưới (xanh ngọc)
    ctx.fillStyle = C.teal;
    ctx.strokeStyle = C.dark;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(baseLeft, baseTop + 14, baseW, baseH - 14, [0, 0, 8, 8]);
    ctx.fill();
    ctx.stroke();

    // Vạch trang trí & lỗ cắm cảm biến
    ctx.fillStyle = C.tealDark;
    ctx.fillRect(baseLeft + 12, baseTop + 24, 28, 14);
    ctx.fillStyle = C.dark;
    for (var sp = 0; sp < 3; sp++) {
      ctx.beginPath();
      ctx.arc(baseLeft + 18 + sp * 8, baseTop + 31, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Nắp trên của bộ não (trắng)
    ctx.fillStyle = C.white;
    ctx.strokeStyle = C.dark;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(baseLeft - 2, baseTop, baseW + 4, 16, [6, 6, 2, 2]);
    ctx.fill();
    ctx.stroke();

    // Nút bấm đỏ (trên nắp đế, lệch sang phải)
    var btnX = x + 30;
    var btnNormalY = baseTop - 6;
    var btnPressedY = baseTop - 2;
    var curBtnY = isPressed ? btnPressedY : btnNormalY;
    var btnH = isPressed ? 7 : 11;

    // Vòng hào quang khi nút bị nhấn
    if (isPressed) {
      var pulse = 0.5 + 0.5 * Math.sin(t * 14);
      var ringGlow = ctx.createRadialGradient(btnX, curBtnY + 3, 5, btnX, curBtnY + 3, 24);
      ringGlow.addColorStop(0, 'rgba(255, 60, 60, 0.7)');
      ringGlow.addColorStop(0.6, 'rgba(255, 220, 60, 0.4)');
      ringGlow.addColorStop(1, 'rgba(255, 230, 80, 0)');
      ctx.fillStyle = ringGlow;
      ctx.beginPath();
      ctx.arc(btnX, curBtnY + 3, 24, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = 'rgba(255, 240, 100, ' + (0.7 + 0.3 * pulse).toFixed(2) + ')';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.ellipse(btnX, curBtnY + 3, 16, 9, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Nút bấm thật
    ctx.fillStyle = isPressed ? C.redDark : C.red;
    ctx.strokeStyle = C.dark;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(btnX - 12, curBtnY, 24, btnH, 4);
    ctx.fill();
    ctx.stroke();

    // Vệt sáng bóng trên nút đỏ
    ctx.fillStyle = C.redLight;
    ctx.beginPath();
    ctx.ellipse(btnX - 3, curBtnY + 3, 6, 2, 0, 0, Math.PI * 2);
    ctx.fill();

    // -------------------------------------------------------------
    // C. TRỤ CỐI XOAY GIÓ (Trụ trắng, thanh Technic có lỗ tròn)
    // -------------------------------------------------------------
    var towerTop = hubY + 24;
    var towerBottom = baseTop;
    var towerW = 28;

    // Thân trụ trắng
    ctx.fillStyle = C.white;
    ctx.strokeStyle = C.dark;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.rect(x - towerW / 2, towerTop, towerW, towerBottom - towerTop);
    ctx.fill();
    ctx.stroke();

    // Các lỗ tròn Technic dọc theo thân trụ
    var holeStep = 22;
    var firstHoleY = towerTop + 16;
    for (var hy = firstHoleY; hy < towerBottom - 10; hy += holeStep) {
      // Vành lỗ
      ctx.fillStyle = C.hole;
      ctx.strokeStyle = C.dark;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, hy, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Tâm lõi lỗ tròn
      ctx.fillStyle = '#b7c7d4';
      ctx.beginPath();
      ctx.arc(x, hy, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // -------------------------------------------------------------
    // D. ĐỘNG CƠ (Trắng - xanh ngọc, ở đỉnh trụ quanh hubY)
    // -------------------------------------------------------------
    var motW = 48;
    var motH = 50;
    var motLeft = x - motW / 2;
    var motTop = hubY - motH / 2;

    // Vỏ động cơ màu trắng
    ctx.fillStyle = C.white;
    ctx.strokeStyle = C.dark;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(motLeft, motTop, motW, motH, 6);
    ctx.fill();
    ctx.stroke();

    // Mặt ốp xanh ngọc đặc trưng của động cơ ZM Alpha 330
    ctx.fillStyle = C.teal;
    ctx.strokeStyle = C.tealDark;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(motLeft + 5, motTop + 6, motW - 10, motH - 12, 4);
    ctx.fill();
    ctx.stroke();

    // -------------------------------------------------------------
    // E. ĐÈN ĐỎ TRÊN ĐỈNH TRỤ (o.light - nhấp nháy theo o.t)
    // -------------------------------------------------------------
    if (isLight) {
      var stalkTop = motTop - 14;
      // Cột đỡ đèn
      ctx.strokeStyle = C.dark;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x, motTop);
      ctx.lineTo(x, stalkTop);
      ctx.stroke();

      // Nhịp nhấp nháy: 2 lần/giây
      var isBlinking = Math.sin(t * 10) > 0;
      var lightCenterY = stalkTop - 6;

      if (isBlinking) {
        // Vòng phát sáng của đèn
        var lightGlow = ctx.createRadialGradient(x, lightCenterY, 3, x, lightCenterY, 22);
        lightGlow.addColorStop(0, 'rgba(255, 50, 50, 0.85)');
        lightGlow.addColorStop(0.5, 'rgba(255, 120, 60, 0.4)');
        lightGlow.addColorStop(1, 'rgba(255, 200, 50, 0)');
        ctx.fillStyle = lightGlow;
        ctx.beginPath();
        ctx.arc(x, lightCenterY, 22, 0, Math.PI * 2);
        ctx.fill();
      }

      // Quả cầu đèn đỏ
      ctx.fillStyle = isBlinking ? '#ff2a2a' : '#731414';
      ctx.strokeStyle = C.dark;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.arc(x, lightCenterY, 6.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Đốm sáng trên đèn
      if (isBlinking) {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(x - 2, lightCenterY - 2, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // -------------------------------------------------------------
    // F. CÁNH QUẠT (Trục quay hubY, 3 hoặc 6 cánh, thanh có lỗ tròn)
    // -------------------------------------------------------------
    var baseBladeLen = 110;
    var bladeLen = isLong ? Math.round(baseBladeLen * 1.4) : baseBladeLen; // ~154 px

    ctx.save();
    ctx.translate(x, hubY);

    for (var bi = 0; bi < blades; bi++) {
      var curAngle = angle + (bi * Math.PI * 2) / blades;
      ctx.save();
      ctx.rotate(curAngle);

      // Cánh quạt: thanh Technic dài, đầu bo tròn
      var bWidth = 18;
      var bRadius = bWidth / 2;

      ctx.beginPath();
      // Vẽ thanh bo tròn từ r = 10 đến r = bladeLen
      ctx.moveTo(-bRadius, 10);
      ctx.lineTo(-bRadius, bladeLen - bRadius);
      ctx.arc(0, bladeLen - bRadius, bRadius, Math.PI, 0, true);
      ctx.lineTo(bRadius, 10);
      ctx.closePath();

      ctx.fillStyle = C.white;
      ctx.fill();
      ctx.strokeStyle = C.dark;
      ctx.lineWidth = 2.6;
      ctx.stroke();

      // Các lỗ tròn trên cánh quạt (BP-7525A thanh 7 lỗ hoặc nối dài)
      var holeSpacing = 16;
      var maxHoleR = bladeLen - 12;
      for (var hr = 24; hr <= maxHoleR; hr += holeSpacing) {
        ctx.fillStyle = C.hole;
        ctx.strokeStyle = C.dark;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.arc(0, hr, 3.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }

      // Khớp nối mở rộng nếu là cánh dài
      if (isLong) {
        ctx.fillStyle = C.teal;
        ctx.strokeStyle = C.dark;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.roundRect(-bRadius - 1.5, baseBladeLen - 16, bWidth + 3, 10, 2);
        ctx.fill();
        ctx.stroke();
      }

      ctx.restore();
    }

    // Nắp bầu trục cánh quạt (hub tròn xanh ngọc ở chính giữa)
    ctx.fillStyle = C.teal;
    ctx.strokeStyle = C.dark;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Vành chốt xanh đậm
    ctx.fillStyle = C.tealDark;
    ctx.beginPath();
    ctx.arc(0, 0, 7, 0, Math.PI * 2);
    ctx.fill();

    // Chốt trục chữ thập đen chính giữa
    ctx.fillStyle = C.dark;
    ctx.beginPath();
    ctx.arc(0, 0, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore(); // Hết phần quay cánh

    ctx.restore(); // Hết cối xoay gió
  }

  // =========================================================================
  // 4. VẼ NGÔI NHÀ (drawHouse)
  // x = tâm ngôi nhà trên mặt đất (GROUND_Y = 440)
  // glow: 0–1 (cửa sổ tối → vàng sáng rực, có quầng sáng ấm áp)
  // =========================================================================
  function drawHouse(ctx, x, glow) {
    glow = Number.isFinite(glow) ? Math.max(0, Math.min(1, glow)) : 0;
    var gy = GROUND_Y;

    var houseW = 120;
    var wallH = 88;
    var houseLeft = x - houseW / 2;
    var wallTop = gy - wallH;

    // --- Quầng sáng ấm áp toả ra từ ngôi nhà khi sáng đèn ---
    if (glow > 0.01) {
      var halo = ctx.createRadialGradient(x, gy - 55, 15, x, gy - 55, 160);
      halo.addColorStop(0, 'rgba(255, 230, 90, ' + (0.55 * glow).toFixed(3) + ')');
      halo.addColorStop(0.5, 'rgba(255, 205, 60, ' + (0.24 * glow).toFixed(3) + ')');
      halo.addColorStop(1, 'rgba(255, 190, 40, 0)');
      ctx.fillStyle = halo;
      ctx.fillRect(x - 200, gy - 210, 400, 240);
    }

    // --- Ống khói ---
    var chX = x + 34;
    var chY = wallTop - 34;
    ctx.fillStyle = '#d35400';
    ctx.strokeStyle = C.dark;
    ctx.lineWidth = 2.5;
    ctx.fillRect(chX - 9, chY, 18, 30);
    ctx.strokeRect(chX - 9, chY, 18, 30);
    // Vành mũ ống khói
    ctx.fillStyle = '#ba4a00';
    ctx.fillRect(chX - 11, chY - 4, 22, 6);
    ctx.strokeRect(chX - 11, chY - 4, 22, 6);

    // Làn khói nhỏ bay lên khi nhà có điện
    if (glow > 0.4) {
      ctx.fillStyle = 'rgba(245, 245, 250, ' + (0.5 * glow).toFixed(2) + ')';
      ctx.beginPath();
      ctx.arc(chX, chY - 14, 5, 0, Math.PI * 2);
      ctx.arc(chX + 6, chY - 24, 7, 0, Math.PI * 2);
      ctx.arc(chX + 14, chY - 36, 9, 0, Math.PI * 2);
      ctx.fill();
    }

    // --- Thân nhà ---
    ctx.fillStyle = '#fff9ee';
    ctx.strokeStyle = C.dark;
    ctx.lineWidth = 3;
    ctx.fillRect(houseLeft, wallTop, houseW, wallH);
    ctx.strokeRect(houseLeft, wallTop, houseW, wallH);

    // Bờ móng chân tường
    ctx.fillStyle = '#f0dfc4';
    ctx.fillRect(houseLeft, gy - 8, houseW, 8);
    ctx.strokeRect(houseLeft, gy - 8, houseW, 8);

    // --- Mái ngói tam giác dốc ấm cúng ---
    var roofOver = 14;
    var roofApexY = wallTop - 56;
    ctx.fillStyle = '#e85d3f';
    ctx.strokeStyle = C.dark;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(houseLeft - roofOver, wallTop);
    ctx.lineTo(x, roofApexY);
    ctx.lineTo(houseLeft + houseW + roofOver, wallTop);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Vạch viền trang trí bờ mái
    ctx.fillStyle = '#c73e21';
    ctx.beginPath();
    ctx.moveTo(houseLeft - roofOver + 8, wallTop);
    ctx.lineTo(x, roofApexY + 8);
    ctx.lineTo(houseLeft + houseW + roofOver - 8, wallTop);
    ctx.lineTo(houseLeft + houseW + roofOver, wallTop);
    ctx.lineTo(x, roofApexY);
    ctx.lineTo(houseLeft - roofOver, wallTop);
    ctx.closePath();
    ctx.fill();

    // Ô cửa sổ tròn gác mái
    ctx.fillStyle = glow > 0.3 ? '#ffe066' : '#34495e';
    ctx.strokeStyle = C.dark;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(x, wallTop - 22, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // --- Cửa chính ở giữa ---
    var doorW = 28;
    var doorH = 48;
    var doorX = x - doorW / 2;
    var doorY = gy - doorH;

    ctx.fillStyle = C.teal;
    ctx.strokeStyle = C.dark;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(doorX, doorY, doorW, doorH, [6, 6, 0, 0]);
    ctx.fill();
    ctx.stroke();

    // Núm tay nắm cửa
    ctx.fillStyle = C.yellow;
    ctx.strokeStyle = C.dark;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(doorX + doorW - 6, doorY + doorH * 0.55, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // --- 2 Cửa sổ vuông hai bên ---
    var winSize = 24;
    var winY = wallTop + 18;
    var winOffsets = [-44, 20];

    // Màu kính cửa sổ: chuyển từ xanh sẫm (tối) sang vàng chanh sáng rực
    var winFill;
    if (glow <= 0.01) {
      winFill = '#34495e';
    } else {
      var rG = Math.round(52 + (255 - 52) * glow);
      var gG = Math.round(73 + (230 - 73) * glow);
      var bG = Math.round(94 + (70 - 94) * glow);
      winFill = 'rgb(' + rG + ',' + gG + ',' + bG + ')';
    }

    for (var wi = 0; wi < winOffsets.length; wi++) {
      var wx = x + winOffsets[wi];

      // Khung kính
      ctx.fillStyle = winFill;
      ctx.strokeStyle = C.dark;
      ctx.lineWidth = 2.5;
      ctx.fillRect(wx, winY, winSize, winSize);
      ctx.strokeRect(wx, winY, winSize, winSize);

      // Chấn song chữ thập
      ctx.beginPath();
      ctx.moveTo(wx + winSize / 2, winY);
      ctx.lineTo(wx + winSize / 2, winY + winSize);
      ctx.moveTo(wx, winY + winSize / 2);
      ctx.lineTo(wx + winSize, winY + winSize / 2);
      ctx.stroke();

      // Bệ cửa sổ
      ctx.fillStyle = '#e8d2b0';
      ctx.fillRect(wx - 2, winY + winSize, winSize + 4, 4);
      ctx.strokeRect(wx - 2, winY + winSize, winSize + 4, 4);
    }
  }

  // =========================================================================
  // 5. VẼ CỤC PIN (drawBattery)
  // (x, y) = tâm của cục pin đứng
  // level: 0–1; khi level >= 1: vẽ vạch đầy + tia sét xanh lá
  // =========================================================================
  function drawBattery(ctx, x, y, level) {
    level = Number.isFinite(level) ? Math.max(0, level) : 0;

    var batW = 54;
    var batH = 96;
    var capW = 20;
    var capH = 10;

    var left = x - batW / 2;
    var top = y - batH / 2;

    // Núm cực dương (+) ở trên
    ctx.fillStyle = C.white;
    ctx.strokeStyle = C.dark;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(x - capW / 2, top - capH, capW, capH, [4, 4, 0, 0]);
    ctx.fill();
    ctx.stroke();

    // Thân pin chính
    ctx.fillStyle = C.white;
    ctx.strokeStyle = C.dark;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(left, top, batW, batH, 8);
    ctx.fill();
    ctx.stroke();

    // Buồng hiển thị năng lượng bên trong (nền tối tạo độ tương phản cao)
    var pad = 6;
    var innerW = batW - pad * 2;
    var innerH = batH - pad * 2;
    var innerLeft = left + pad;
    var innerTop = top + pad;

    ctx.fillStyle = '#212933';
    ctx.strokeStyle = C.dark;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(innerLeft, innerTop, innerW, innerH, 4);
    ctx.fill();
    ctx.stroke();

    // Vạch năng lượng (dâng từ đáy lên)
    var fillRatio = Math.min(1, level);
    var fillH = innerH * fillRatio;
    var fillY = innerTop + innerH - fillH;

    if (fillH > 0.5) {
      // Màu vạch pin: đỏ cam (<0.3) → vàng chanh (0.3-0.8) → xanh lá tươi (>0.8)
      var barColor = level >= 1 ? '#00e676' : level > 0.6 ? C.green : level > 0.25 ? C.greenLight : C.amber;
      ctx.fillStyle = barColor;
      ctx.beginPath();
      ctx.roundRect(innerLeft + 2, fillY + 2, innerW - 4, fillH - 4, 3);
      ctx.fill();
    }

    // Các vạch mức phân cách (25%, 50%, 75%)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 1.5;
    for (var seg = 1; seg <= 3; seg++) {
      var segY = innerTop + (innerH * seg) / 4;
      ctx.beginPath();
      ctx.moveTo(innerLeft + 3, segY);
      ctx.lineTo(innerLeft + innerW - 3, segY);
      ctx.stroke();
    }

    // --- Khi pin đầy (level >= 1): vẽ TIA SÉT XANH LÁ phát sáng ---
    if (level >= 1) {
      // Quầng hào quang xanh quanh pin
      var greenGlow = ctx.createRadialGradient(x, y, 10, x, y, 42);
      greenGlow.addColorStop(0, 'rgba(0, 230, 118, 0.6)');
      greenGlow.addColorStop(0.7, 'rgba(0, 230, 118, 0.2)');
      greenGlow.addColorStop(1, 'rgba(0, 230, 118, 0)');
      ctx.fillStyle = greenGlow;
      ctx.beginPath();
      ctx.arc(x, y, 42, 0, Math.PI * 2);
      ctx.fill();

      // Tia sét xanh lá nổi bật ở giữa pin
      ctx.save();
      ctx.translate(x, y);

      ctx.beginPath();
      ctx.moveTo(-1, -22);
      ctx.lineTo(10, -22);
      ctx.lineTo(2, -3);
      ctx.lineTo(12, -3);
      ctx.lineTo(-7, 24);
      ctx.lineTo(-1, 3);
      ctx.lineTo(-11, 3);
      ctx.closePath();

      ctx.fillStyle = '#00e676';
      ctx.fill();
      ctx.strokeStyle = C.dark;
      ctx.lineWidth = 2.2;
      ctx.lineJoin = 'miter';
      ctx.stroke();

      // Tâm trắng sáng của tia sét
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(0, -18);
      ctx.lineTo(6, -18);
      ctx.lineTo(1, -2);
      ctx.lineTo(7, -2);
      ctx.lineTo(-4, 16);
      ctx.lineTo(-1, 2);
      ctx.lineTo(-7, 2);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    }
  }

  // =========================================================================
  // 6. VẼ DÂY ĐIỆN VÕNG NHẸ (drawCable)
  // (x1, y1) → (x2, y2), t = thời gian (giây)
  // flow: 0–1 (chấm vàng chạy dọc dây, nhanh theo flow)
  // =========================================================================
  function drawCable(ctx, x1, y1, x2, y2, t, flow) {
    flow = Number.isFinite(flow) ? Math.max(0, Math.min(1, flow)) : 0;
    t = Number.isFinite(t) ? t : 0;

    var mx = (x1 + x2) / 2;
    var dist = Math.abs(x2 - x1);
    // Độ võng nhẹ tự nhiên: từ 24 đến 42 px tuỳ theo khoảng cách
    var sag = 24 + Math.min(38, dist * 0.08);
    var my = Math.max(y1, y2) + sag;

    // Đường dây điện màu than đậm
    ctx.strokeStyle = C.dark;
    ctx.lineWidth = 3.6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.quadraticCurveTo(mx, my, x2, y2);
    ctx.stroke();

    // Đầu cắm chốt hai đầu dây
    ctx.fillStyle = C.teal;
    ctx.strokeStyle = C.dark;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x1, y1, 4, 0, Math.PI * 2);
    ctx.arc(x2, y2, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Hạt điện màu vàng chạy dọc dây khi có dòng điện (flow > 0)
    if (flow > 0.001) {
      var speed = 0.5 + 2.2 * flow;
      var dotCount = 5;

      for (var i = 0; i < dotCount; i++) {
        var k = ((t * speed + i / dotCount) % 1 + 1) % 1;
        var inv = 1 - k;
        var px = inv * inv * x1 + 2 * inv * k * mx + k * k * x2;
        var py = inv * inv * y1 + 2 * inv * k * my + k * k * y2;

        // Quầng vàng ấm quanh hạt điện
        ctx.fillStyle = 'rgba(255, 210, 63, 0.45)';
        ctx.beginPath();
        ctx.arc(px, py, 6.5, 0, Math.PI * 2);
        ctx.fill();

        // Hạt điện vàng sáng rực
        ctx.fillStyle = C.yellow;
        ctx.beginPath();
        ctx.arc(px, py, 3.8, 0, Math.PI * 2);
        ctx.fill();

        // Lõi trắng
        ctx.fillStyle = C.white;
        ctx.beginPath();
        ctx.arc(px, py, 1.6, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // =========================================================================
  // 7. BỐN HÌNH SVG GÓI SÁNG TẠO (PICS)
  // viewBox="0 0 64 48", aria-hidden="true"
  // long: cánh dài; more: 6 cánh; light: đèn đỏ nóc; tail: đuôi lái gió
  // =========================================================================
  var PICS = {
    // Gói 1: Cánh quạt dài hơn (3 cánh vươn dài với các lỗ tròn)
    long: '<svg viewBox="0 0 64 48" aria-hidden="true">' +
      '<rect x="22" y="41" width="20" height="6" rx="2" fill="#3dc1dc" stroke="#1e2a34" stroke-width="1.6"/>' +
      '<rect x="20" y="38" width="24" height="4" rx="1.5" fill="#ffffff" stroke="#1e2a34" stroke-width="1.6"/>' +
      '<path d="M30 38V20h4v18" fill="#ffffff" stroke="#1e2a34" stroke-width="1.6"/>' +
      '<rect x="27" y="15" width="10" height="10" rx="2" fill="#ffffff" stroke="#1e2a34" stroke-width="1.6"/>' +
      '<rect x="29" y="17" width="6" height="6" fill="#3dc1dc"/>' +
      // Cánh vươn dài
      '<path d="M32 20V2" stroke="#1e2a34" stroke-width="5" stroke-linecap="round"/>' +
      '<path d="M32 20V2" stroke="#ffffff" stroke-width="3.2" stroke-linecap="round"/>' +
      '<circle cx="32" cy="7" r="0.9" fill="#1e2a34"/><circle cx="32" cy="12" r="0.9" fill="#1e2a34"/>' +
      '<path d="M32 20L17 31" stroke="#1e2a34" stroke-width="5" stroke-linecap="round"/>' +
      '<path d="M32 20L17 31" stroke="#ffffff" stroke-width="3.2" stroke-linecap="round"/>' +
      '<circle cx="23" cy="27" r="0.9" fill="#1e2a34"/>' +
      '<path d="M32 20L47 31" stroke="#1e2a34" stroke-width="5" stroke-linecap="round"/>' +
      '<path d="M32 20L47 31" stroke="#ffffff" stroke-width="3.2" stroke-linecap="round"/>' +
      '<circle cx="41" cy="27" r="0.9" fill="#1e2a34"/>' +
      // Khớp nối màu xanh báo hiệu cánh dài
      '<circle cx="32" cy="4" r="1.6" fill="#3dc1dc"/>' +
      '<circle cx="32" cy="20" r="3.2" fill="#3dc1dc" stroke="#1e2a34" stroke-width="1.5"/>' +
      '<circle cx="32" cy="20" r="1" fill="#1e2a34"/>' +
      '</svg>',

    // Gói 2: 6 cánh quạt đối xứng đều
    more: '<svg viewBox="0 0 64 48" aria-hidden="true">' +
      '<rect x="22" y="41" width="20" height="6" rx="2" fill="#3dc1dc" stroke="#1e2a34" stroke-width="1.6"/>' +
      '<rect x="20" y="38" width="24" height="4" rx="1.5" fill="#ffffff" stroke="#1e2a34" stroke-width="1.6"/>' +
      '<path d="M30 38V20h4v18" fill="#ffffff" stroke="#1e2a34" stroke-width="1.6"/>' +
      '<rect x="27" y="15" width="10" height="10" rx="2" fill="#ffffff" stroke="#1e2a34" stroke-width="1.6"/>' +
      // 6 cánh sao toả đều
      '<path d="M32 20V7" stroke="#1e2a34" stroke-width="4.2" stroke-linecap="round"/>' +
      '<path d="M32 20V7" stroke="#ffffff" stroke-width="2.6" stroke-linecap="round"/>' +
      '<path d="M32 20V33" stroke="#1e2a34" stroke-width="4.2" stroke-linecap="round"/>' +
      '<path d="M32 20V33" stroke="#ffffff" stroke-width="2.6" stroke-linecap="round"/>' +
      '<path d="M32 20L21 14" stroke="#1e2a34" stroke-width="4.2" stroke-linecap="round"/>' +
      '<path d="M32 20L21 14" stroke="#ffffff" stroke-width="2.6" stroke-linecap="round"/>' +
      '<path d="M32 20L43 26" stroke="#1e2a34" stroke-width="4.2" stroke-linecap="round"/>' +
      '<path d="M32 20L43 26" stroke="#ffffff" stroke-width="2.6" stroke-linecap="round"/>' +
      '<path d="M32 20L21 26" stroke="#1e2a34" stroke-width="4.2" stroke-linecap="round"/>' +
      '<path d="M32 20L21 26" stroke="#ffffff" stroke-width="2.6" stroke-linecap="round"/>' +
      '<path d="M32 20L43 14" stroke="#1e2a34" stroke-width="4.2" stroke-linecap="round"/>' +
      '<path d="M32 20L43 14" stroke="#ffffff" stroke-width="2.6" stroke-linecap="round"/>' +
      '<circle cx="32" cy="20" r="3.2" fill="#3dc1dc" stroke="#1e2a34" stroke-width="1.5"/>' +
      '<circle cx="32" cy="20" r="1" fill="#1e2a34"/>' +
      '</svg>',

    // Gói 3: Đèn đỏ nhấp nháy trên nóc cối xoay gió
    light: '<svg viewBox="0 0 64 48" aria-hidden="true">' +
      '<rect x="22" y="41" width="20" height="6" rx="2" fill="#3dc1dc" stroke="#1e2a34" stroke-width="1.6"/>' +
      '<rect x="20" y="38" width="24" height="4" rx="1.5" fill="#ffffff" stroke="#1e2a34" stroke-width="1.6"/>' +
      '<path d="M30 38V20h4v18" fill="#ffffff" stroke="#1e2a34" stroke-width="1.6"/>' +
      '<rect x="27" y="15" width="10" height="10" rx="2" fill="#ffffff" stroke="#1e2a34" stroke-width="1.6"/>' +
      // Cột đèn và bóng đèn đỏ phát tia sáng
      '<path d="M32 15V8" stroke="#1e2a34" stroke-width="2"/>' +
      '<circle cx="32" cy="6.5" r="3" fill="#e53935" stroke="#1e2a34" stroke-width="1.3"/>' +
      '<circle cx="31" cy="5.5" r="1" fill="#ffffff"/>' +
      // Tia sáng vàng
      '<path d="M26 6.5h-3M38 6.5h3M32 1.5v-2" stroke="#ffd23f" stroke-width="1.5" stroke-linecap="round"/>' +
      // 3 cánh chuẩn
      '<path d="M32 20V8" stroke="#1e2a34" stroke-width="4.2" stroke-linecap="round"/>' +
      '<path d="M32 20V8" stroke="#ffffff" stroke-width="2.6" stroke-linecap="round"/>' +
      '<path d="M32 20L21 28" stroke="#1e2a34" stroke-width="4.2" stroke-linecap="round"/>' +
      '<path d="M32 20L21 28" stroke="#ffffff" stroke-width="2.6" stroke-linecap="round"/>' +
      '<path d="M32 20L43 28" stroke="#1e2a34" stroke-width="4.2" stroke-linecap="round"/>' +
      '<path d="M32 20L43 28" stroke="#ffffff" stroke-width="2.6" stroke-linecap="round"/>' +
      '<circle cx="32" cy="20" r="3.2" fill="#3dc1dc" stroke="#1e2a34" stroke-width="1.5"/>' +
      '</svg>',

    // Gói 4: Đuôi lái gió phía sau động cơ
    tail: '<svg viewBox="0 0 64 48" aria-hidden="true">' +
      '<rect x="22" y="41" width="20" height="6" rx="2" fill="#3dc1dc" stroke="#1e2a34" stroke-width="1.6"/>' +
      '<rect x="20" y="38" width="24" height="4" rx="1.5" fill="#ffffff" stroke="#1e2a34" stroke-width="1.6"/>' +
      '<path d="M30 38V20h4v18" fill="#ffffff" stroke="#1e2a34" stroke-width="1.6"/>' +
      // Cánh đuôi hình tam giác xanh ngọc
      '<path d="M34 20h14l8-9v18l-8-5h-14" fill="#3dc1dc" stroke="#0e6f8a" stroke-width="1.4"/>' +
      '<path d="M34 20h14" stroke="#1e2a34" stroke-width="1.8"/>' +
      '<rect x="27" y="15" width="10" height="10" rx="2" fill="#ffffff" stroke="#1e2a34" stroke-width="1.6"/>' +
      // 3 cánh chuẩn
      '<path d="M32 20V8" stroke="#1e2a34" stroke-width="4.2" stroke-linecap="round"/>' +
      '<path d="M32 20V8" stroke="#ffffff" stroke-width="2.6" stroke-linecap="round"/>' +
      '<path d="M32 20L21 28" stroke="#1e2a34" stroke-width="4.2" stroke-linecap="round"/>' +
      '<path d="M32 20L21 28" stroke="#ffffff" stroke-width="2.6" stroke-linecap="round"/>' +
      '<path d="M32 20L43 28" stroke="#1e2a34" stroke-width="4.2" stroke-linecap="round"/>' +
      '<path d="M32 20L43 28" stroke="#ffffff" stroke-width="2.6" stroke-linecap="round"/>' +
      '<circle cx="32" cy="20" r="3.2" fill="#3dc1dc" stroke="#1e2a34" stroke-width="1.5"/>' +
      '</svg>'
  };

  // Xuất giao diện WindArt ra window theo đúng quy định của phiếu giao việc
  window.WindArt = {
    W: W,
    H: H,
    GROUND_Y: GROUND_Y,
    drawBackground: drawBackground,
    drawWindLines: drawWindLines,
    drawWindmill: drawWindmill,
    drawHouse: drawHouse,
    drawBattery: drawBattery,
    drawCable: drawCable,
    PICS: PICS
  };
})();
