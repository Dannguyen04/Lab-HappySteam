// Thư viện vẽ cảnh Lớp 3 · Bài 10: Robot thám hiểm sao Hỏa (xe thám hiểm 1 động cơ + cảm biến sóng âm).
// Hệ toạ độ logic: W = 900, H = 560, GROUND_Y = 430.
// Đồ hoạ phẳng thân thiện cho học sinh tiểu học, màu tươi tương phản cao, viền đậm rõ nét.
// Không dùng thư viện ngoài, không ảnh ngoài, không Math.random() trong khi vẽ; chạy tốt trên file://.
(function () {
  'use strict';

  var W = 900;
  var H = 560;
  var GROUND_Y = 430;

  // Bảng màu chuẩn của mô hình ZM Alpha 330 và phong cách sao Hỏa
  var C = {
    dark: '#1e2a34',
    white: '#ffffff',
    teal: '#3dc1dc',
    tealDark: '#0e6f8a',
    tealLight: '#8ee6f5',
    red: '#e53935',
    redDark: '#9e1b1b',
    yellow: '#ffd23f',
    amber: '#f4a742',
    marsSkyTop: '#3d1c24',
    marsSkyMid: '#b24c2c',
    marsSkyLow: '#e88d67',
    marsSoil: '#c85a32',
    marsSoilDark: '#9e3b18',
    marsSoilDeep: '#6d260e',
    grayRock: '#546e7a',
    grayRockDark: '#37474f',
    greenRock: '#00897b',
    greenRockDark: '#004d40',
    redRock: '#c62828',
    redRockDark: '#8e0000'
  };

  // Hàm vẽ hình chữ nhật bo góc tương thích mọi môi trường
  function roundRect(ctx, x, y, w, h, r) {
    if (typeof ctx.roundRect === 'function') {
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, r);
      return;
    }
    var tl = 0, tr = 0, br = 0, bl = 0;
    if (Array.isArray(r)) {
      if (r.length === 1) tl = tr = br = bl = r[0];
      else if (r.length === 2) { tl = br = r[0]; tr = bl = r[1]; }
      else if (r.length >= 4) { tl = r[0]; tr = r[1]; br = r[2]; bl = r[3]; }
    } else {
      tl = tr = br = bl = Number(r) || 0;
    }
    ctx.beginPath();
    ctx.moveTo(x + tl, y);
    ctx.lineTo(x + w - tr, y);
    if (tr) ctx.arcTo(x + w, y, x + w, y + tr, tr);
    ctx.lineTo(x + w, y + h - br);
    if (br) ctx.arcTo(x + w, y + h, x + w - br, y + h, br);
    ctx.lineTo(x + bl, y + h);
    if (bl) ctx.arcTo(x, y + h, x, y + h - bl, bl);
    ctx.lineTo(x, y + tl);
    if (tl) ctx.arcTo(x, y, x + tl, y, tl);
    ctx.closePath();
  }

  // Dữ liệu sỏi đá cố định trên bề mặt sao Hỏa (không dùng Math.random để tránh chớp giật)
  var PEBBLES = [
    { x: 30, y: 442, rx: 4, ry: 2.2, c: '#7a2d14' },
    { x: 75, y: 478, rx: 6, ry: 3, c: '#5c1f0b' },
    { x: 120, y: 450, rx: 3.5, ry: 2, c: '#8e3519' },
    { x: 165, y: 498, rx: 5, ry: 2.8, c: '#5c1f0b' },
    { x: 210, y: 444, rx: 4, ry: 2.5, c: '#7a2d14' },
    { x: 260, y: 472, rx: 5.5, ry: 3, c: '#5c1f0b' },
    { x: 310, y: 520, rx: 7, ry: 3.8, c: '#481707' },
    { x: 355, y: 446, rx: 3.8, ry: 2.2, c: '#8e3519' },
    { x: 400, y: 486, rx: 5, ry: 2.6, c: '#7a2d14' },
    { x: 445, y: 454, rx: 4.2, ry: 2.4, c: '#5c1f0b' },
    { x: 490, y: 512, rx: 6.5, ry: 3.5, c: '#481707' },
    { x: 535, y: 445, rx: 3.5, ry: 2, c: '#7a2d14' },
    { x: 580, y: 480, rx: 5.5, ry: 2.8, c: '#8e3519' },
    { x: 625, y: 504, rx: 4.5, ry: 2.5, c: '#5c1f0b' },
    { x: 670, y: 448, rx: 3.2, ry: 1.8, c: '#7a2d14' },
    { x: 715, y: 485, rx: 6, ry: 3.2, c: '#5c1f0b' },
    { x: 760, y: 442, rx: 4, ry: 2.2, c: '#8e3519' },
    { x: 805, y: 518, rx: 7, ry: 3.6, c: '#481707' },
    { x: 850, y: 462, rx: 4.5, ry: 2.5, c: '#7a2d14' },
    { x: 885, y: 495, rx: 5.5, ry: 3, c: '#5c1f0b' }
  ];

  // Các dải đồi và hẻm núi sao Hỏa phía xa
  var RIDGES_FAR = [
    [0, 310], [90, 290], [170, 305], [260, 275], [370, 315],
    [480, 260], [590, 300], [700, 250], [800, 285], [900, 270]
  ];

  var RIDGES_MID = [
    [0, 375], [80, 355], [180, 380], [270, 345], [380, 370],
    [490, 340], [600, 375], [710, 340], [810, 365], [900, 350]
  ];

  // =========================================================================
  // 1. VẼ NỀN SAO HỎA (drawBackground)
  // t: thời gian giây
  // weather: 'clear' (quang đãng) | 'storm' (bão bụi)
  // =========================================================================
  function drawBackground(ctx, t, weather) {
    var sec = typeof t === 'number' ? t : 0;
    var isStorm = weather === 'storm';

    // --- Bầu trời sao Hỏa ---
    var skyG = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
    if (isStorm) {
      skyG.addColorStop(0, '#2e140d');
      skyG.addColorStop(0.5, '#6a2a14');
      skyG.addColorStop(1, '#a64b22');
    } else {
      skyG.addColorStop(0, C.marsSkyTop);
      skyG.addColorStop(0.45, C.marsSkyMid);
      skyG.addColorStop(0.85, C.marsSkyLow);
      skyG.addColorStop(1, '#f3af8a');
    }
    ctx.fillStyle = skyG;
    ctx.fillRect(0, 0, W, GROUND_Y);

    // --- Mặt trời sao Hỏa nhỏ và nhạt xa xa ---
    var sunX = 740;
    var sunY = 90;
    if (!isStorm) {
      // Vầng hào quang
      var sunHalo = ctx.createRadialGradient(sunX, sunY, 4, sunX, sunY, 42);
      sunHalo.addColorStop(0, 'rgba(255, 250, 230, 0.55)');
      sunHalo.addColorStop(0.4, 'rgba(255, 220, 180, 0.22)');
      sunHalo.addColorStop(1, 'rgba(255, 200, 150, 0)');
      ctx.fillStyle = sunHalo;
      ctx.beginPath();
      ctx.arc(sunX, sunY, 42, 0, Math.PI * 2);
      ctx.fill();

      // Đĩa mặt trời
      ctx.fillStyle = '#fff7ea';
      ctx.beginPath();
      ctx.arc(sunX, sunY, 12, 0, Math.PI * 2);
      ctx.fill();

      // Mặt trăng Phobos nhỏ bé phía đối diện
      ctx.fillStyle = 'rgba(235, 220, 210, 0.65)';
      ctx.beginPath();
      ctx.arc(140, 75, 4.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // --- Núi lửa khổng lồ Olympus Mons phía chân trời xa ---
    ctx.fillStyle = isStorm ? '#532313' : '#733226';
    ctx.beginPath();
    ctx.moveTo(380, GROUND_Y);
    ctx.lineTo(440, 225);
    ctx.quadraticCurveTo(510, 195, 580, 225);
    ctx.lineTo(650, GROUND_Y);
    ctx.closePath();
    ctx.fill();
    // Đỉnh miệng núi lửa (Caldera)
    ctx.fillStyle = isStorm ? '#421a0d' : '#5b241a';
    ctx.beginPath();
    ctx.ellipse(510, 222, 54, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    // --- Dải đồi xa ---
    ctx.fillStyle = isStorm ? '#5e2716' : '#8e3f28';
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);
    for (var i = 0; i < RIDGES_FAR.length; i++) {
      ctx.lineTo(RIDGES_FAR[i][0], RIDGES_FAR[i][1]);
    }
    ctx.lineTo(W, GROUND_Y);
    ctx.closePath();
    ctx.fill();

    // --- Dải đồi gần ---
    ctx.fillStyle = isStorm ? '#7c331a' : '#b24c2a';
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);
    for (var j = 0; j < RIDGES_MID.length; j++) {
      ctx.lineTo(RIDGES_MID[j][0], RIDGES_MID[j][1]);
    }
    ctx.lineTo(W, GROUND_Y);
    ctx.closePath();
    ctx.fill();

    // --- Miệng hố thiên thạch (Crater) ở góc trái xa ---
    ctx.fillStyle = isStorm ? '#6a2a14' : '#943e22';
    ctx.beginPath();
    ctx.ellipse(220, 398, 55, 12, -0.05, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = isStorm ? '#451b0d' : '#692511';
    ctx.beginPath();
    ctx.ellipse(222, 400, 46, 9, -0.05, 0, Math.PI * 2);
    ctx.fill();

    // --- Mặt đất sao Hỏa đỏ cam phẳng vững chãi ---
    var groundG = ctx.createLinearGradient(0, GROUND_Y, 0, H);
    groundG.addColorStop(0, isStorm ? '#9c3e1b' : C.marsSoil);
    groundG.addColorStop(0.35, isStorm ? '#782d12' : C.marsSoilDark);
    groundG.addColorStop(1, isStorm ? '#4a1908' : C.marsSoilDeep);
    ctx.fillStyle = groundG;
    ctx.fillRect(0, GROUND_Y, W, H - GROUND_Y);

    // Gờ mép mặt đất (viền tương phản đậm)
    ctx.fillStyle = isStorm ? '#541c09' : '#842f13';
    ctx.fillRect(0, GROUND_Y, W, 4.5);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
    ctx.fillRect(0, GROUND_Y, W, 1.5);

    // --- Sỏi đá và rãnh cát trên bề mặt ---
    for (var p = 0; p < PEBBLES.length; p++) {
      var pb = PEBBLES[p];
      ctx.fillStyle = pb.c;
      ctx.beginPath();
      ctx.ellipse(pb.x, pb.y, pb.rx, pb.ry, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Các vết rãnh bánh xe / địa hình mờ
    ctx.strokeStyle = 'rgba(75, 23, 7, 0.35)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(40, 442);
    ctx.lineTo(190, 442);
    ctx.moveTo(270, 444);
    ctx.lineTo(430, 444);
    ctx.moveTo(510, 443);
    ctx.lineTo(720, 443);
    ctx.stroke();

    // Nếu có bão bụi, vẽ thêm lớp gió bụi cuộn
    if (isStorm) {
      drawStorm(ctx, sec, 1.0);
    }
  }

  // =========================================================================
  // 2. VẼ BÃO BỤI SAO HỎA (drawStorm)
  // intensity: 0..1 (mức độ bão bụi)
  // =========================================================================
  function drawStorm(ctx, t, intensity) {
    var k = Math.max(0, Math.min(1, typeof intensity === 'number' ? intensity : 1));
    if (k <= 0.01) return;
    var sec = typeof t === 'number' ? t : 0;

    ctx.save();

    // Màn sương cát màu cam đỏ mờ đục
    ctx.fillStyle = 'rgba(186, 75, 32, ' + (0.32 * k) + ')';
    ctx.fillRect(0, 0, W, H);

    // Các dải gió bụi thổi mạnh từ trái sang phải
    ctx.lineWidth = 14;
    ctx.lineCap = 'round';
    for (var i = 0; i < 9; i++) {
      var speed = 220 + (i * 37) % 110;
      var y = 60 + (i * 54) % (H - 100);
      var xOffset = ((sec * speed + i * 160) % (W + 400)) - 200;
      var len = 140 + (i * 29) % 120;

      ctx.strokeStyle = i % 2 === 0
        ? 'rgba(235, 130, 75, ' + (0.35 * k) + ')'
        : 'rgba(138, 48, 18, ' + (0.28 * k) + ')';
      ctx.beginPath();
      ctx.moveTo(xOffset, y);
      ctx.bezierCurveTo(xOffset + len * 0.4, y - 8, xOffset + len * 0.7, y + 8, xOffset + len, y);
      ctx.stroke();
    }

    // Các hạt cát bụi bay vèo qua
    ctx.fillStyle = 'rgba(255, 180, 110, ' + (0.65 * k) + ')';
    for (var g = 0; g < 22; g++) {
      var sp = 340 + (g * 43) % 180;
      var gx = ((sec * sp + g * 83) % (W + 100)) - 50;
      var gy = 40 + (g * 67) % (H - 70);
      var gr = 1.6 + (g % 3) * 0.8;
      ctx.beginPath();
      ctx.arc(gx, gy, gr, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  // =========================================================================
  // 3. VẼ TRẠM CĂN CỨ SAO HỎA / LANDER (drawStation)
  // x: toạ độ x của chân trạm (mặc định x = 90)
  // y: chân trạm trên mặt đất (mặc định y = GROUND_Y)
  // =========================================================================
  function drawStation(ctx, x, y) {
    x = typeof x === 'number' ? x : 90;
    y = typeof y === 'number' ? y : GROUND_Y;

    ctx.save();
    ctx.translate(x, y);

    // Bóng trạm trên mặt đất
    ctx.fillStyle = 'rgba(40, 12, 5, 0.45)';
    ctx.beginPath();
    ctx.ellipse(0, 0, 56, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2 chân đỡ kim loại vát chéo có đệm tiếp đất
    ctx.strokeStyle = C.dark;
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(-32, -22);
    ctx.lineTo(-46, 0);
    ctx.moveTo(32, -22);
    ctx.lineTo(46, 0);
    ctx.stroke();

    // Bàn đệm chân tròn màu vàng
    ctx.fillStyle = C.yellow;
    ctx.beginPath();
    ctx.ellipse(-46, 0, 9, 3.5, 0, 0, Math.PI * 2);
    ctx.ellipse(46, 0, 9, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Khối đế vòm trạm thám hiểm (Habitat Dome)
    ctx.fillStyle = C.white;
    ctx.strokeStyle = C.dark;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, -26, 42, Math.PI, 0, false);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Dải viền xanh ngọc công nghệ quanh vòm
    ctx.fillStyle = C.teal;
    ctx.beginPath();
    ctx.arc(0, -26, 42, Math.PI * 1.1, Math.PI * 1.9, false);
    ctx.lineTo(34, -32);
    ctx.arc(0, -26, 32, Math.PI * 1.9, Math.PI * 1.1, true);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Cửa sổ tròn nhìn ra ngoài sao Hỏa
    ctx.fillStyle = '#29b6f6';
    ctx.beginPath();
    ctx.arc(0, -42, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = C.dark;
    ctx.lineWidth = 2.2;
    ctx.stroke();
    // Vệt bóng kính cửa sổ
    ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
    ctx.beginPath();
    ctx.arc(-2, -44, 4.5, 0, Math.PI * 2);
    ctx.fill();

    // Cột ăng-ten liên lạc Trái Đất vươn cao
    ctx.strokeStyle = C.dark;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(0, -68);
    ctx.lineTo(0, -102);
    ctx.stroke();

    // Đĩa ăng-ten parabol nhỏ trên đỉnh
    ctx.fillStyle = C.white;
    ctx.beginPath();
    ctx.arc(0, -102, 12, Math.PI * 0.8, Math.PI * 1.8, false);
    ctx.fill();
    ctx.stroke();
    // Đèn chớp đỏ báo hiệu trên đỉnh cột
    ctx.fillStyle = C.red;
    ctx.beginPath();
    ctx.arc(0, -112, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Biển tên: TRẠM A
    ctx.fillStyle = C.tealDark;
    roundRect(ctx, -38, -18, 76, 17, 4);
    ctx.fill();
    ctx.strokeStyle = C.white;
    ctx.lineWidth = 1.2;
    ctx.stroke();

    ctx.font = '800 11px "Be Vietnam Pro", "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = C.white;
    ctx.fillText('TRẠM CĂN CỨ', 0, -10);

    ctx.restore();
  }

  // =========================================================================
  // 4. VẼ TẢNG ĐÁ MẪU SAO HỎA (drawRock)
  // type: 'red' (đá đỏ) | 'gray' (đá xám) | 'green' (đá xanh)
  // state: { scanning: boolean, scanProgress: 0..1, got: boolean, name: string }
  // =========================================================================
  function drawRock(ctx, x, y, type, state) {
    x = typeof x === 'number' ? x : 400;
    y = typeof y === 'number' ? y : GROUND_Y;
    type = type || 'red';
    state = state || {};

    var baseColor = C.redRock;
    var darkColor = C.redRockDark;
    var highlightColor = '#ff6b6b';
    var labelText = 'ĐÁ ĐỎ';

    if (type === 'gray') {
      baseColor = C.grayRock;
      darkColor = C.grayRockDark;
      highlightColor = '#90a4ae';
      labelText = 'ĐÁ XÁM';
    } else if (type === 'green') {
      baseColor = C.greenRock;
      darkColor = C.greenRockDark;
      highlightColor = '#4db6ac';
      labelText = 'ĐÁ XANH';
    }

    ctx.save();
    ctx.translate(x, y);

    // Bóng tảng đá trên mặt đất
    ctx.fillStyle = 'rgba(30, 10, 5, 0.42)';
    ctx.beginPath();
    ctx.ellipse(0, 0, 28, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    // Hiệu ứng vòng quét xung quanh khi đang quét mẫu (scanning)
    if (state.scanning && !state.got) {
      var prog = typeof state.scanProgress === 'number' ? state.scanProgress : 0.5;
      ctx.strokeStyle = 'rgba(61, 193, 220, 0.85)';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.arc(0, -18, 36, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * prog);
      ctx.stroke();

      // Vòng hào quang sáng nhấp nháy
      ctx.fillStyle = 'rgba(61, 193, 220, 0.22)';
      ctx.beginPath();
      ctx.arc(0, -18, 38, 0, Math.PI * 2);
      ctx.fill();
    }

    // Khối tảng đá đa diện, gồ ghề tự nhiên
    ctx.lineWidth = 2.4;
    ctx.strokeStyle = C.dark;

    // Mặt sau / mặt tối bên trái
    ctx.fillStyle = darkColor;
    ctx.beginPath();
    ctx.moveTo(-22, 0);
    ctx.lineTo(-24, -18);
    ctx.lineTo(-12, -34);
    ctx.lineTo(4, -36);
    ctx.lineTo(0, -12);
    ctx.lineTo(-22, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Mặt trước / mặt chính
    ctx.fillStyle = baseColor;
    ctx.beginPath();
    ctx.moveTo(-12, -34);
    ctx.lineTo(16, -38);
    ctx.lineTo(26, -16);
    ctx.lineTo(22, 0);
    ctx.lineTo(0, -12);
    ctx.lineTo(-12, -34);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Mặt vát sáng phản chiếu ánh nắng
    ctx.fillStyle = highlightColor;
    ctx.beginPath();
    ctx.moveTo(4, -36);
    ctx.lineTo(16, -38);
    ctx.lineTo(8, -24);
    ctx.lineTo(-4, -22);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Đường gờ nứt trên mặt đá
    ctx.strokeStyle = C.dark;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(-2, -18);
    ctx.lineTo(10, -14);
    ctx.lineTo(18, -4);
    ctx.stroke();

    // Nếu đã thu thập mẫu thành công (got === true)
    if (state.got) {
      // Cột cờ tiêu đánh dấu đã phân tích xong
      ctx.strokeStyle = C.dark;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, -36);
      ctx.lineTo(0, -66);
      ctx.stroke();

      // Lá cờ xanh lá có dấu tích
      ctx.fillStyle = '#43a047';
      ctx.beginPath();
      ctx.moveTo(0, -66);
      ctx.lineTo(24, -57);
      ctx.lineTo(0, -48);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Dấu tích chữ V trắng
      ctx.strokeStyle = C.white;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(5, -57);
      ctx.lineTo(9, -53);
      ctx.lineTo(16, -61);
      ctx.stroke();

      // Huy hiệu "ĐÃ THU"
      ctx.fillStyle = '#43a047';
      roundRect(ctx, -26, -11, 52, 16, 4);
      ctx.fill();
      ctx.strokeStyle = C.white;
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.font = '800 9px "Be Vietnam Pro", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = C.white;
      ctx.fillText('ĐÃ THU', 0, -3);
    } else {
      // Bảng tên loại đá bên dưới
      ctx.fillStyle = 'rgba(30, 42, 52, 0.88)';
      roundRect(ctx, -28, 4, 56, 17, 4);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.font = '800 10px "Be Vietnam Pro", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = highlightColor;
      ctx.fillText(labelText, 0, 12);
    }

    ctx.restore();
  }

  // =========================================================================
  // 5. VẼ SÓNG ÂM DÒ TÌM TỪ CẢM BIẾN (drawSensorWaves)
  // sx, sy: toạ độ mắt cảm biến
  // reach: khoảng cách tầm dò (px)
  // active: boolean (cảm biến đang dò)
  // hit: boolean (đã phát hiện tảng đá)
  // t: thời gian giây
  // =========================================================================
  function drawSensorWaves(ctx, sx, sy, reach, active, hit, t) {
    if (!active) return;
    var sec = typeof t === 'number' ? t : 0;
    var maxR = typeof reach === 'number' ? reach : 160;

    ctx.save();
    ctx.translate(sx, sy);

    var waveColor = hit ? 'rgba(255, 210, 63, ' : 'rgba(61, 193, 220, ';
    var pulse = (sec * 2.2) % 1;

    for (var w = 0; w < 4; w++) {
      var r = 18 + ((pulse + w * 0.25) % 1) * maxR;
      var alpha = Math.max(0, 1 - r / maxR) * (hit ? 0.9 : 0.65);

      ctx.strokeStyle = waveColor + alpha + ')';
      ctx.lineWidth = hit ? 3.5 : 2.5;
      ctx.beginPath();
      // Vẽ cánh cung sóng âm hướng sang phải (+X), góc mở khoảng 50 độ (-0.45 đến +0.45 rad)
      ctx.arc(0, 0, r, -0.42, 0.42);
      ctx.stroke();
    }

    // Nếu thấy vật cản (hit): vẽ tia cảnh báo màu vàng
    if (hit) {
      ctx.fillStyle = 'rgba(255, 210, 63, 0.25)';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, maxR * 0.85, -0.38, 0.38);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  }

  // =========================================================================
  // 6. VẼ XE THÁM HIỂM SAO HỎA (drawRover)
  // x: toạ độ tâm xe theo phương ngang
  // y: mặt đất (GROUND_Y = 430)
  // o: tuỳ chọn trạng thái {
  //   wheel: góc quay bánh xe (rad),
  //   dish: gắn ăng-ten parabol (boolean),
  //   lamp: gắn đèn pha (boolean),
  //   wheels: gắn bánh gai (boolean),
  //   eyes: mắt cảm biến sáng (boolean),
  //   shake: độ rung giật va chạm (0..1),
  //   stuck: độ lún kẹt trong cát (0..1),
  //   t: thời gian giây
  // }
  // =========================================================================
  function drawRover(ctx, x, y, o) {
    x = typeof x === 'number' ? x : 200;
    y = typeof y === 'number' ? y : GROUND_Y;
    o = o || {};

    var sec = typeof o.t === 'number' ? o.t : 0;
    var wheelAngle = typeof o.wheel === 'number' ? o.wheel : 0;
    var shake = typeof o.shake === 'number' ? Math.max(0, Math.min(1, o.shake)) : 0;
    var stuck = typeof o.stuck === 'number' ? Math.max(0, Math.min(1, o.stuck)) : 0;

    var shakeX = shake > 0 ? (Math.sin(sec * 65) * 6 * shake) : 0;
    var shakeY = shake > 0 ? (Math.cos(sec * 75) * 4 * shake) : 0;
    var stuckSink = stuck * 10; // lún xuống cát 10px

    ctx.save();
    ctx.translate(x + shakeX, y + shakeY + stuckSink);

    // Nghiêng nhẹ nếu bị lún cát
    if (stuck > 0) {
      ctx.rotate(-0.06 * stuck);
    }

    // -----------------------------------------------------------------------
    // A. BÓNG XE TRÊN MẶT ĐẤT
    // -----------------------------------------------------------------------
    ctx.fillStyle = 'rgba(40, 15, 8, 0.45)';
    ctx.beginPath();
    ctx.ellipse(6, -2, 68, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    // Đụn cát quanh bánh xe nếu bị lún kẹt
    if (stuck > 0) {
      ctx.fillStyle = C.marsSoil;
      ctx.beginPath();
      ctx.ellipse(-32, -2, 34, 9, 0, 0, Math.PI * 2);
      ctx.ellipse(36, -2, 22, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = C.dark;
      ctx.lineWidth = 1.8;
      ctx.stroke();
    }

    // -----------------------------------------------------------------------
    // B. LUỒNG SÁNG ĐÈN PHA (nếu bật o.lamp)
    // -----------------------------------------------------------------------
    if (o.lamp) {
      var beamGrad = ctx.createRadialGradient(42, -56, 4, 240, -56, 260);
      beamGrad.addColorStop(0, 'rgba(255, 240, 140, 0.78)');
      beamGrad.addColorStop(0.35, 'rgba(255, 220, 90, 0.42)');
      beamGrad.addColorStop(0.8, 'rgba(255, 200, 60, 0.12)');
      beamGrad.addColorStop(1, 'rgba(255, 200, 60, 0)');

      ctx.fillStyle = beamGrad;
      ctx.beginPath();
      ctx.moveTo(42, -56);
      ctx.lineTo(260, -110);
      ctx.lineTo(260, 2);
      ctx.closePath();
      ctx.fill();
    }

    // -----------------------------------------------------------------------
    // C. BÁNH SAU LỚN PHÍA TRONG (bánh bên kia trục, vẽ bóng mờ sau lưng)
    // -----------------------------------------------------------------------
    ctx.save();
    ctx.translate(-24, -28);
    ctx.fillStyle = '#0a4f63';
    ctx.beginPath();
    ctx.arc(0, 0, 23, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // -----------------------------------------------------------------------
    // D. KHUNG ĐẾ VÀ THÂN XE (Chassis & Hub)
    // -----------------------------------------------------------------------
    // Khung gầm Technic xanh ngọc (BP-8818)
    ctx.fillStyle = C.teal;
    ctx.strokeStyle = C.dark;
    ctx.lineWidth = 2.6;
    roundRect(ctx, -46, -42, 84, 16, 4);
    ctx.fill();
    ctx.stroke();

    // Các lỗ tròn Technic trên dầm khung gầm
    ctx.fillStyle = C.tealDark;
    for (var hx = -34; hx <= 26; hx += 15) {
      ctx.beginPath();
      ctx.arc(hx, -34, 3.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = C.dark;
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }

    // Bánh bi xoay phía trước (Caster wheel BP-8840)
    ctx.fillStyle = C.white;
    ctx.strokeStyle = C.dark;
    ctx.lineWidth = 2.4;
    // Vỏ đỡ bánh bi
    roundRect(ctx, 28, -38, 20, 22, 3);
    ctx.fill();
    ctx.stroke();
    // Viên bi tròn màu trắng tiếp xúc mặt đất
    ctx.beginPath();
    ctx.arc(38, -10, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Vệt bóng viên bi
    ctx.fillStyle = 'rgba(30, 42, 52, 0.15)';
    ctx.beginPath();
    ctx.arc(36, -8, 7, 0, Math.PI * 2);
    ctx.fill();

    // Thân bộ não WeDo / Smart Hub (BE-5158)
    // Phần thân dưới màu xanh ngọc
    ctx.fillStyle = C.teal;
    ctx.strokeStyle = C.dark;
    ctx.lineWidth = 2.6;
    roundRect(ctx, -42, -76, 76, 36, [4, 4, 2, 2]);
    ctx.fill();
    ctx.stroke();

    // Các lỗ cắm chốt bên sườn Hub
    ctx.fillStyle = C.tealDark;
    for (var cx = -28; cx <= 20; cx += 16) {
      ctx.beginPath();
      ctx.arc(cx, -56, 3.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = C.dark;
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }

    // Nắp trên màu trắng của Smart Hub
    ctx.fillStyle = C.white;
    ctx.strokeStyle = C.dark;
    ctx.lineWidth = 2.6;
    roundRect(ctx, -44, -84, 80, 14, [5, 5, 2, 2]);
    ctx.fill();
    ctx.stroke();

    // Nút bấm và cổng sạc trên nóc Hub
    ctx.fillStyle = C.tealLight;
    roundRect(ctx, -24, -82, 16, 5, 2);
    ctx.fill();
    roundRect(ctx, -4, -82, 16, 5, 2);
    ctx.fill();
    // Đèn LED chỉ thị nhỏ màu xanh ngọc / vàng
    ctx.fillStyle = o.eyes ? C.yellow : C.teal;
    ctx.beginPath();
    ctx.arc(18, -79, 2.2, 0, Math.PI * 2);
    ctx.fill();

    // -----------------------------------------------------------------------
    // E. CỘT CẦN ĐỠ CẢM BIẾN SÓNG ÂM (Technic Mast)
    // Vươn cao từ khung trước lên đỡ mắt cảm biến
    // -----------------------------------------------------------------------
    ctx.save();
    // Trụ đứng màu trắng có các lỗ tròn Technic
    ctx.fillStyle = C.white;
    ctx.strokeStyle = C.dark;
    ctx.lineWidth = 2.5;

    // Đoạn thân đứng vươn lên
    ctx.beginPath();
    ctx.moveTo(18, -42);
    ctx.lineTo(18, -122);
    ctx.lineTo(28, -122);
    ctx.lineTo(28, -42);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Các lỗ tròn trên thân trụ đứng
    ctx.fillStyle = '#b0bec5';
    for (var my = -50; my >= -115; my -= 14) {
      ctx.beginPath();
      ctx.arc(23, my, 2.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = C.dark;
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Khớp gập nối vươn ngang về phía trước
    ctx.fillStyle = C.white;
    ctx.strokeStyle = C.dark;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(22, -122);
    ctx.lineTo(44, -134);
    ctx.lineTo(48, -122);
    ctx.lineTo(28, -114);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Chốt nối đen ở khớp
    ctx.fillStyle = C.dark;
    ctx.beginPath();
    ctx.arc(25, -118, 4.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // -----------------------------------------------------------------------
    // F. CỤM CẢM BIẾN SÓNG ÂM (Ultrasonic Sensor BE-6313)
    // Tâm cảm biến nằm ở (x + 58, y - 138), nhìn thẳng sang phải (+X)
    // -----------------------------------------------------------------------
    var sensorX = 54;
    var sensorY = -136;

    ctx.save();
    ctx.translate(sensorX, sensorY);

    // Hộp cảm biến màu trắng
    ctx.fillStyle = C.white;
    ctx.strokeStyle = C.dark;
    ctx.lineWidth = 2.6;
    roundRect(ctx, -14, -18, 46, 36, 6);
    ctx.fill();
    ctx.stroke();

    // Mặt trước cảm biến màu xanh ngọc (Faceplate)
    ctx.fillStyle = C.teal;
    ctx.strokeStyle = C.tealDark;
    ctx.lineWidth = 1.5;
    roundRect(ctx, 2, -15, 28, 30, 4);
    ctx.fill();
    ctx.stroke();

    // Hai "mắt" tròn phát/thu sóng âm
    var eyeY = 0;
    var eye1X = 10;
    var eye2X = 22;

    // Mắt cảm biến sáng vàng khi phát hiện vật cản (o.eyes === true)
    var eyeFill = o.eyes ? C.yellow : '#90a4ae';
    var eyeRing = o.eyes ? '#d4a017' : '#546e7a';

    // Mắt 1
    ctx.fillStyle = eyeFill;
    ctx.strokeStyle = eyeRing;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(eye1X, eyeY, 6.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Vành trong mắt 1
    ctx.fillStyle = o.eyes ? '#fff59d' : '#cfd8dc';
    ctx.beginPath();
    ctx.arc(eye1X, eyeY, 3, 0, Math.PI * 2);
    ctx.fill();

    // Mắt 2
    ctx.fillStyle = eyeFill;
    ctx.strokeStyle = eyeRing;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(eye2X, eyeY, 6.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Vành trong mắt 2
    ctx.fillStyle = o.eyes ? '#fff59d' : '#cfd8dc';
    ctx.beginPath();
    ctx.arc(eye2X, eyeY, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // -----------------------------------------------------------------------
    // G. GÓI SÁNG TẠO 1: ĂNG-TEN PARABOL (o.dish)
    // Gắn trên nóc thân xe (Smart Hub)
    // -----------------------------------------------------------------------
    if (o.dish) {
      ctx.save();
      ctx.translate(-14, -84);

      // Cột ăng-ten
      ctx.strokeStyle = C.dark;
      ctx.lineWidth = 2.8;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, -22);
      ctx.stroke();

      // Đĩa parabol cong màu trắng viền đỏ
      ctx.fillStyle = C.white;
      ctx.strokeStyle = C.red;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.arc(0, -24, 16, Math.PI * 0.75, Math.PI * 1.85, false);
      ctx.lineTo(0, -24);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Cần thu tín hiệu nhô ra giữa đĩa
      ctx.strokeStyle = C.dark;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, -24);
      ctx.lineTo(10, -32);
      ctx.stroke();

      // Đầu thu màu vàng
      ctx.fillStyle = C.yellow;
      ctx.beginPath();
      ctx.arc(10, -32, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Vòng sóng phát tín hiệu nhấp nháy từ ăng-ten
      var dishPulse = (sec * 3) % 1;
      ctx.strokeStyle = 'rgba(229, 57, 53, ' + (0.8 * (1 - dishPulse)) + ')';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(10, -32, 6 + 12 * dishPulse, -0.8, 0.4);
      ctx.stroke();

      ctx.restore();
    }

    // -----------------------------------------------------------------------
    // H. GÓI SÁNG TẠO 2: ĐÈN PHA CHIẾU SÁNG (o.lamp)
    // Gắn phía trước cản xe
    // -----------------------------------------------------------------------
    if (o.lamp) {
      ctx.save();
      ctx.translate(34, -54);

      // Giá đỡ đèn màu đen
      ctx.fillStyle = C.dark;
      ctx.fillRect(-4, -4, 8, 8);

      // Chóa đèn màu vàng
      ctx.fillStyle = C.yellow;
      ctx.strokeStyle = C.dark;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.arc(6, 0, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Mặt kính đèn phát sáng trắng
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(6, 0, 4.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    // -----------------------------------------------------------------------
    // I. BÁNH XE SAU LỚN CHÍNH PHÍA TRƯỚC (BP-8841 + Lốp gai BP-8850)
    // Tâm bánh xe ở (-28, -24), bán kính lốp r = 24
    // -----------------------------------------------------------------------
    ctx.save();
    ctx.translate(-28, -24);

    var wheelRadius = 24;

    // GÓI SÁNG TẠO 3: BÁNH GAI (o.wheels)
    // 8 chốt gai đen nhô ra quanh lốp xe để bám cát sao Hỏa
    if (o.wheels) {
      ctx.fillStyle = C.dark;
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1.5;
      for (var spk = 0; spk < 8; spk++) {
        var aSpk = wheelAngle + (spk * Math.PI) / 4;
        ctx.save();
        ctx.rotate(aSpk);
        // Gai nhọn nhô ra 6px ngoài bán kính lốp
        ctx.beginPath();
        ctx.moveTo(wheelRadius - 1, -3);
        ctx.lineTo(wheelRadius + 6, 0);
        ctx.lineTo(wheelRadius - 1, 3);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }
    }

    // Lốp cao su màu xanh ngọc đậm đặc trưng của ZM Alpha 330
    ctx.fillStyle = C.teal;
    ctx.strokeStyle = C.dark;
    ctx.lineWidth = 2.8;
    ctx.beginPath();
    ctx.arc(0, 0, wheelRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Vành bánh xe màu trắng (Rim)
    ctx.fillStyle = C.white;
    ctx.strokeStyle = C.dark;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(0, 0, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Các nan hoa bánh xe xoay theo góc wheelAngle
    ctx.strokeStyle = C.dark;
    ctx.lineWidth = 2.4;
    for (var sp = 0; sp < 4; sp++) {
      var a = wheelAngle + (sp * Math.PI) / 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(a) * 15, Math.sin(a) * 15);
      ctx.stroke();
    }

    // Trục trung tâm màu đen
    ctx.fillStyle = C.dark;
    ctx.beginPath();
    ctx.arc(0, 0, 5, 0, Math.PI * 2);
    ctx.fill();

    // Chốt trục chữ thập (+) màu xám nhạt
    ctx.strokeStyle = C.white;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(-2.5, 0); ctx.lineTo(2.5, 0);
    ctx.moveTo(0, -2.5); ctx.lineTo(0, 2.5);
    ctx.stroke();

    ctx.restore();

    ctx.restore();
  }

  // =========================================================================
  // 7. HÌNH BIỂU TƯỢNG GÓI SÁNG TẠO (PICS) - SVG 64x48
  // Theo chuẩn bài học: dish (ăng-ten), lamp (đèn pha), wheels (bánh gai)
  // =========================================================================
  var PICS = {
    // Ăng-ten parabol trên thân xe
    dish:
      '<svg viewBox="0 0 64 48" aria-hidden="true">' +
      '<rect x="10" y="24" width="44" height="15" rx="3" fill="#ffffff" stroke="#1e2a34" stroke-width="1.8"/>' +
      '<rect x="12" y="30" width="40" height="7" fill="#3dc1dc"/>' +
      '<circle cx="20" cy="40" r="7" fill="#3dc1dc" stroke="#1e2a34" stroke-width="1.6"/>' +
      '<circle cx="44" cy="40" r="7" fill="#3dc1dc" stroke="#1e2a34" stroke-width="1.6"/>' +
      // Cột và đĩa parabol đỏ trắng
      '<path d="M28 24V12" stroke="#1e2a34" stroke-width="2.2" stroke-linecap="round"/>' +
      '<path d="M20 10a9 9 0 0 0 16 0z" fill="#ffffff" stroke="#e53935" stroke-width="2"/>' +
      '<path d="M28 10l6-5" stroke="#1e2a34" stroke-width="1.6"/>' +
      '<circle cx="34" cy="5" r="2" fill="#ffd23f"/>' +
      '</svg>',

    // Đèn pha phía trước soi đường trong bão bụi
    lamp:
      '<svg viewBox="0 0 64 48" aria-hidden="true">' +
      '<polygon points="46,26 62,18 62,34" fill="#ffd23f" opacity="0.45"/>' +
      '<rect x="10" y="24" width="44" height="15" rx="3" fill="#ffffff" stroke="#1e2a34" stroke-width="1.8"/>' +
      '<rect x="12" y="30" width="40" height="7" fill="#3dc1dc"/>' +
      '<circle cx="20" cy="40" r="7" fill="#3dc1dc" stroke="#1e2a34" stroke-width="1.6"/>' +
      '<circle cx="44" cy="40" r="7" fill="#3dc1dc" stroke="#1e2a34" stroke-width="1.6"/>' +
      // Đèn pha vàng sáng rực phía trước
      '<circle cx="48" cy="26" r="4.2" fill="#ffd23f" stroke="#1e2a34" stroke-width="1.6"/>' +
      '<circle cx="48" cy="26" r="2.2" fill="#ffffff"/>' +
      '</svg>',

    // Bánh gai bám cát không bị lún kẹt
    wheels:
      '<svg viewBox="0 0 64 48" aria-hidden="true">' +
      '<rect x="10" y="24" width="44" height="15" rx="3" fill="#ffffff" stroke="#1e2a34" stroke-width="1.8"/>' +
      '<rect x="12" y="30" width="40" height="7" fill="#3dc1dc"/>' +
      // Các gai nhọn quanh bánh xe
      '<path d="M13 33l-4-3M13 47l-4 3M27 33l4-3M27 47l4 3M37 33l-4-3M37 47l-4 3M51 33l4-3M51 47l4 3" stroke="#1e2a34" stroke-width="2.6" stroke-linecap="round"/>' +
      '<circle cx="20" cy="40" r="7" fill="#3dc1dc" stroke="#1e2a34" stroke-width="1.8"/>' +
      '<circle cx="20" cy="40" r="3.8" fill="#ffffff" stroke="#1e2a34" stroke-width="1.2"/>' +
      '<circle cx="44" cy="40" r="7" fill="#3dc1dc" stroke="#1e2a34" stroke-width="1.8"/>' +
      '<circle cx="44" cy="40" r="3.8" fill="#ffffff" stroke="#1e2a34" stroke-width="1.2"/>' +
      '</svg>'
  };

  // Xuất giao diện vẽ cảnh MarsArt ra window
  // Đồng thời gắn alias Lop3Bai10Art và RoverArt để tương thích tối đa
  var ArtExport = {
    W: W,
    H: H,
    GROUND_Y: GROUND_Y,
    drawBackground: drawBackground,
    drawStorm: drawStorm,
    drawStation: drawStation,
    drawRock: drawRock,
    drawRover: drawRover,
    drawSensorWaves: drawSensorWaves,
    PICS: PICS
  };

  window.MarsArt = ArtExport;
  window.Lop3Bai10Art = ArtExport;
  window.RoverArt = ArtExport;
})();
