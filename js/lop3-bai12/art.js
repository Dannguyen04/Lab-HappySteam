// Thư viện vẽ cảnh Lớp 3 · Bài 12: "Trồng cây trên sao Hỏa" (window.Lop3Bai12Art).
// Khung nhìn chuẩn: 900x560, mặt đất GY = 430.
// Dành cho học sinh lớp 3 trên máy tính bảng: khối to, viền đậm C.ink, nét LINE = 2.6, không chữ trong hình.
// Không dùng ảnh ngoài, không dùng font ngoài, không dùng Math.random() khi vẽ.
(function () {
  'use strict';

  var W0 = 900;
  var H0 = 560;
  var GY0 = 430;
  var LINE = 2.6;

  // Bảng màu chuẩn thống nhất hệ thống ZMArt
  var C = {
    ink: '#1e2a34',
    inkSoft: '#455a64',
    paper: '#ffffff',
    paperWarm: '#fff9ee',
    hole: '#dfe6ec',
    sky: '#def0fc',
    skyTop: '#4faaf0',
    skyStorm: '#283848',
    grass: '#6db843',
    grassLight: '#8cc152',
    grassDark: '#3c6328',
    sand: '#f2d398',
    sandDark: '#c89d54',
    snow: '#eef6fc',
    snowShade: '#b7d4ea',
    mars: '#d96b43',
    marsDark: '#9e3b18',
    road: '#576574',
    sea: '#2980b9',
    seaDeep: '#154360',
    water: '#29b6f6',
    waterDeep: '#0277bd',
    accent: '#3dc1dc',
    accentDark: '#0e6f8a',
    accentLight: '#8ee6f5',
    warn: '#e53935',
    warnDark: '#b71c1c',
    ok: '#43a047',
    gold: '#ffd23f',
    orange: '#ff8a3d',
    wood: '#8d6e63',
    rock: '#64748b'
  };

  // Nếu ZMArt đã nạp trước đó, ưu tiên dùng chính xác palette & line của thư viện
  if (typeof window !== 'undefined' && window.ZMArt && window.ZMArt.C) {
    C = window.ZMArt.C;
    LINE = window.ZMArt.LINE || LINE;
  }

  // Hàm vẽ hình chữ nhật bo góc tương thích mọi trình duyệt
  function rr(c, x, y, w, h, r) {
    c.beginPath();
    if (typeof c.roundRect === 'function') {
      c.roundRect(x, y, w, h, r);
      return;
    }
    var rad = Array.isArray(r) ? (r[0] || 0) : (Number(r) || 0);
    rad = Math.min(rad, Math.abs(w) / 2, Math.abs(h) / 2);
    c.moveTo(x + rad, y);
    c.arcTo(x + w, y, x + w, y + h, rad);
    c.arcTo(x + w, y + h, x, y + h, rad);
    c.arcTo(x, y + h, x, y, rad);
    c.arcTo(x, y, x + w, y, rad);
    c.closePath();
  }

  function strokeFill(c, fill, stroke, lw) {
    if (fill) { c.fillStyle = fill; c.fill(); }
    c.strokeStyle = stroke || C.ink;
    c.lineWidth = lw || LINE;
    c.stroke();
  }

  // Dữ liệu sao cố định trên bầu trời sao Hỏa (không dùng Math.random để tránh chớp giật)
  var STARS = [
    { x: 45, y: 35, r: 1.6, f: 1.8 },
    { x: 110, y: 65, r: 1.2, f: 2.3 },
    { x: 180, y: 28, r: 2.0, f: 1.5 },
    { x: 250, y: 75, r: 1.4, f: 3.1 },
    { x: 320, y: 40, r: 1.8, f: 1.2 },
    { x: 390, y: 85, r: 1.3, f: 2.7 },
    { x: 470, y: 30, r: 2.2, f: 1.6 },
    { x: 540, y: 60, r: 1.5, f: 2.4 },
    { x: 620, y: 25, r: 1.9, f: 1.9 },
    { x: 690, y: 70, r: 1.4, f: 2.8 },
    { x: 770, y: 45, r: 2.1, f: 1.4 },
    { x: 840, y: 80, r: 1.5, f: 2.1 }
  ];

  // Dữ liệu sỏi đá cố định trên mặt đất sao Hỏa
  var PEBBLES = [
    { x: 45, y: 442, rx: 5.5, ry: 3.2, c: '#7a2d12' },
    { x: 95, y: 480, rx: 7.0, ry: 4.0, c: '#541d0b' },
    { x: 140, y: 448, rx: 4.5, ry: 2.8, c: '#8f3718' },
    { x: 210, y: 510, rx: 8.0, ry: 4.5, c: '#541d0b' },
    { x: 275, y: 444, rx: 5.0, ry: 3.0, c: '#7a2d12' },
    { x: 340, y: 476, rx: 6.5, ry: 3.8, c: '#8f3718' },
    { x: 410, y: 524, rx: 7.5, ry: 4.2, c: '#541d0b' },
    { x: 490, y: 452, rx: 5.0, ry: 3.0, c: '#7a2d12' },
    { x: 565, y: 488, rx: 6.0, ry: 3.6, c: '#8f3718' },
    { x: 640, y: 515, rx: 8.5, ry: 5.0, c: '#541d0b' },
    { x: 715, y: 446, rx: 4.8, ry: 2.8, c: '#7a2d12' },
    { x: 790, y: 485, rx: 7.0, ry: 4.0, c: '#8f3718' },
    { x: 865, y: 460, rx: 5.5, ry: 3.4, c: '#541d0b' }
  ];

  // =========================================================================
  // 1. BACKGROUND(c, {t, storm})
  // Đất đỏ sao Hỏa + bầu trời; storm (0..1) = bão bụi: trời cam đục, vệt bụi bay ngang.
  // =========================================================================
  function background(c, opts) {
    opts = opts || {};
    var t = typeof opts.t === 'number' ? opts.t : 0;
    var storm = Math.max(0, Math.min(1, typeof opts.storm === 'number' ? opts.storm : 0));
    var W = W0, H = H0, gy = GY0;

    c.save();

    // --- Bầu trời sao Hỏa ---
    // Bình thường: tím mận vũ trụ sang hoàng hôn cam hồng sao Hỏa
    var sky = c.createLinearGradient(0, 0, 0, gy);
    sky.addColorStop(0, '#2d1829');
    sky.addColorStop(0.35, '#5d2b38');
    sky.addColorStop(0.7, '#b75338');
    sky.addColorStop(1, '#e88d67');
    c.fillStyle = sky;
    c.fillRect(0, 0, W, gy);

    // Lớp phủ bão bụi chuyển trời sang màu cam đục / nâu gỉ đặc trưng
    if (storm > 0.005) {
      var stormSky = c.createLinearGradient(0, 0, 0, gy);
      stormSky.addColorStop(0, 'rgba(75, 30, 16, ' + (0.96 * storm).toFixed(2) + ')');
      stormSky.addColorStop(0.45, 'rgba(135, 52, 24, ' + (0.92 * storm).toFixed(2) + ')');
      stormSky.addColorStop(1, 'rgba(195, 85, 42, ' + (0.90 * storm).toFixed(2) + ')');
      c.fillStyle = stormSky;
      c.fillRect(0, 0, W, gy);
    }

    // Các ngôi sao xa & mặt trời xa (mờ dần khi bão bụi nổi lên)
    var starAlpha = Math.max(0, 1 - storm * 1.45);
    if (starAlpha > 0.02) {
      // Sao lấp lánh
      for (var i = 0; i < STARS.length; i++) {
        var st = STARS[i];
        var tw = 0.45 + 0.55 * Math.sin(t * st.f + i);
        c.fillStyle = 'rgba(255, 248, 230, ' + (starAlpha * tw).toFixed(2) + ')';
        c.beginPath();
        c.arc(st.x, st.y, st.r, 0, Math.PI * 2);
        c.fill();
      }

      // Trái Đất xa xôi nhìn từ sao Hỏa (chấm xanh biếc hy vọng)
      var earthX = 145, earthY = 70;
      var earthGlow = c.createRadialGradient(earthX, earthY, 2, earthX, earthY, 12);
      earthGlow.addColorStop(0, 'rgba(100, 210, 255, ' + (0.75 * starAlpha).toFixed(2) + ')');
      earthGlow.addColorStop(1, 'rgba(100, 210, 255, 0)');
      c.fillStyle = earthGlow;
      c.beginPath();
      c.arc(earthX, earthY, 12, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = 'rgba(79, 170, 240, ' + starAlpha.toFixed(2) + ')';
      c.beginPath();
      c.arc(earthX, earthY, 3, 0, Math.PI * 2);
      c.fill();

      // Mặt trời xa xôi trên sao Hỏa (nhỏ hơn, ánh sáng nhạt hơn so với Trái Đất)
      var sunX = 730, sunY = 85;
      var sunGlow = c.createRadialGradient(sunX, sunY, 3, sunX, sunY, 28);
      sunGlow.addColorStop(0, 'rgba(255, 235, 175, ' + (0.85 * starAlpha).toFixed(2) + ')');
      sunGlow.addColorStop(1, 'rgba(255, 235, 175, 0)');
      c.fillStyle = sunGlow;
      c.beginPath();
      c.arc(sunX, sunY, 28, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = 'rgba(255, 250, 225, ' + (0.95 * starAlpha).toFixed(2) + ')';
      c.beginPath();
      c.arc(sunX, sunY, 7, 0, Math.PI * 2);
      c.fill();
    }

    // --- Dãy núi / đồi cát sao Hỏa phía chân trời ---
    // Đồi cát xa (tầng 1)
    c.beginPath();
    c.moveTo(0, gy - 60);
    c.bezierCurveTo(180, gy - 110, 360, gy - 40, 560, gy - 95);
    c.bezierCurveTo(700, gy - 130, 810, gy - 70, W, gy - 85);
    c.lineTo(W, gy);
    c.lineTo(0, gy);
    c.closePath();
    c.fillStyle = storm > 0.1 ? '#943e20' : '#85321e';
    c.fill();

    // Rặng đá miệng núi lửa (tầng 2)
    c.beginPath();
    c.moveTo(0, gy - 32);
    c.bezierCurveTo(150, gy - 62, 320, gy - 18, 520, gy - 58);
    c.bezierCurveTo(680, gy - 86, 780, gy - 30, W, gy - 48);
    c.lineTo(W, gy);
    c.lineTo(0, gy);
    c.closePath();
    c.fillStyle = storm > 0.1 ? '#b7502c' : '#a63e1a';
    c.fill();
    c.strokeStyle = C.ink;
    c.lineWidth = 1.8;
    c.stroke();

    // --- Mặt đất đỏ sao Hỏa phía trước ---
    c.beginPath();
    c.moveTo(0, gy);
    c.bezierCurveTo(W * 0.28, gy - 20, W * 0.62, gy + 10, W, gy - 14);
    c.lineTo(W, H);
    c.lineTo(0, H);
    c.closePath();
    var groundGrad = c.createLinearGradient(0, gy - 20, 0, H);
    groundGrad.addColorStop(0, '#e88862');
    groundGrad.addColorStop(0.2, C.mars);
    groundGrad.addColorStop(1, C.marsDark);
    c.fillStyle = groundGrad;
    c.fill();

    // Đường viền bề mặt đất đỏ
    c.beginPath();
    c.moveTo(0, gy);
    c.bezierCurveTo(W * 0.28, gy - 20, W * 0.62, gy + 10, W, gy - 14);
    c.strokeStyle = C.ink;
    c.lineWidth = LINE;
    c.stroke();

    // Đá sỏi trên đất đỏ sao Hỏa (tái dùng ZMArt.rock nếu có)
    if (typeof window !== 'undefined' && window.ZMArt && typeof window.ZMArt.rock === 'function') {
      window.ZMArt.rock(c, 75, gy - 8, { kind: 'mars', scale: 0.85 });
      window.ZMArt.rock(c, 835, gy - 18, { kind: 'mars', scale: 1.15 });
    } else {
      // Khối đá lớn hai bên viền màn hình
      drawMarsRock(c, 75, gy - 8, 0.85);
      drawMarsRock(c, 835, gy - 18, 1.15);
    }

    // Các viên sỏi đỏ sẫm phân bố tự nhiên
    for (var p = 0; p < PEBBLES.length; p++) {
      var pb = PEBBLES[p];
      c.beginPath();
      c.ellipse(pb.x, pb.y, pb.rx, pb.ry, 0, 0, Math.PI * 2);
      c.fillStyle = pb.c;
      c.fill();
      c.strokeStyle = C.ink;
      c.lineWidth = 1.2;
      c.stroke();
    }

    // Khi bão bụi (storm > 0): vẽ các vệt bụi bay ngang bầu trời và mặt đất
    if (storm > 0.02) {
      drawStormStreaks(c, W, gy, t, storm);
    }

    c.restore();
  }

  // Khối đá sao Hỏa tự vẽ (dự phòng độc lập)
  function drawMarsRock(c, x, gy, s) {
    s = s || 1;
    c.save();
    c.translate(x, gy);
    c.scale(s, s);
    c.beginPath();
    c.moveTo(-32, 0);
    c.lineTo(-24, -28);
    c.lineTo(-6, -38);
    c.lineTo(22, -26);
    c.lineTo(34, 0);
    c.closePath();
    strokeFill(c, C.marsDark, C.ink, LINE);
    // Vệt sáng phản quang trên khối đá
    c.fillStyle = 'rgba(255, 255, 255, 0.22)';
    c.beginPath();
    c.moveTo(-20, -24);
    c.lineTo(-6, -34);
    c.lineTo(8, -18);
    c.closePath();
    c.fill();
    c.restore();
  }

  // Các vệt bụi bay ngang khi có bão bụi
  function drawStormStreaks(c, W, gy, t, storm) {
    c.save();
    c.lineCap = 'round';
    var count = Math.round(9 + 12 * storm);
    for (var i = 0; i < count; i++) {
      var spd = 280 + (i % 4) * 75;
      var sx = ((t * spd + i * 137) % (W + 260)) - 130;
      var sy = 45 + (i * 37) % (gy - 20);
      var len = 70 + (i % 5) * 35;
      var alpha = (0.25 + 0.45 * storm) * (0.6 + (i % 3) * 0.2);

      c.strokeStyle = 'rgba(235, 145, 90, ' + alpha.toFixed(2) + ')';
      c.lineWidth = 2.2 + (i % 3) * 1.4;
      c.beginPath();
      c.moveTo(sx, sy);
      c.lineTo(sx + len, sy + (i % 2 === 0 ? 3 : -3));
      c.stroke();

      // Vài vệt xoáy cuộn gió bụi nhỏ
      if (i % 3 === 0) {
        c.beginPath();
        c.arc(sx + len + 10, sy - 4, 6, Math.PI * 0.4, Math.PI * 2.1);
        c.stroke();
      }
    }
    c.restore();
  }

  // =========================================================================
  // 2. GREENHOUSE(c, x, gy, {w, h, glow})
  // Nhà kính vòm trong suốt, bên trong có luống đất; glow = đèn chiếu cây bật.
  // =========================================================================
  function greenhouse(c, x, gy, opts) {
    if (typeof x === 'object') { opts = x; x = 450; gy = GY0; }
    x = typeof x === 'number' ? x : 450;
    gy = typeof gy === 'number' ? gy : GY0;
    opts = opts || {};
    var w = typeof opts.w === 'number' ? opts.w : 280;
    var h = typeof opts.h === 'number' ? opts.h : 175;
    var glow = Math.max(0, Math.min(1, opts.glow !== undefined ? (opts.glow === true ? 1 : Number(opts.glow)) : 0));
    var hw = w / 2;

    c.save();
    c.translate(x, gy);

    // --- Quầng sáng tỏa ra từ nhà kính khi đèn chiếu cây bật ---
    if (glow > 0.01) {
      var extGlow = c.createRadialGradient(0, -h * 0.55, 20, 0, -h * 0.55, hw * 1.45);
      extGlow.addColorStop(0, 'rgba(255, 120, 190, ' + (0.42 * glow).toFixed(2) + ')');
      extGlow.addColorStop(0.55, 'rgba(255, 215, 60, ' + (0.28 * glow).toFixed(2) + ')');
      extGlow.addColorStop(1, 'rgba(255, 215, 60, 0)');
      c.fillStyle = extGlow;
      c.beginPath();
      c.arc(0, -h * 0.55, hw * 1.45, 0, Math.PI * 2);
      c.fill();
    }

    // --- ĐẾ MÓNG NHÀ KÍNH CÔNG NGHỆ CAO ---
    // Chân đế kim loại cắm sâu vào đất đỏ sao Hỏa
    rr(c, -hw - 14, -14, w + 28, 14, [4, 4, 0, 0]);
    strokeFill(c, C.road, C.ink, LINE);

    // Trụ móng neo hai bên
    for (var bi = -1; bi <= 1; bi += 2) {
      rr(c, bi * (hw + 4) - 8, -20, 16, 20, 3);
      strokeFill(c, C.paper, C.ink, 2.2);
      // Đèn tín hiệu neo móng
      c.beginPath();
      c.arc(bi * (hw + 4), -10, 3.5, 0, Math.PI * 2);
      strokeFill(c, C.ok, C.ink, 1.2);
    }

    // --- NỘI THẤT BÊN TRONG NHÀ KÍNH (Nhìn qua vòm kính trong suốt) ---
    // Nền sàn nghiên cứu công nghệ sinh học
    rr(c, -hw + 10, -10, w - 20, 8, 2);
    strokeFill(c, '#b0bec5', C.inkSoft, 1.8);

    // Đèn quang phổ chiếu sáng cây gắn trên đỉnh vòm
    var lampY = -h + 26;
    rr(c, -38, lampY - 12, 76, 12, 3);
    strokeFill(c, C.ink, C.ink, 2);
    rr(c, -32, lampY, 64, 8, [0, 0, 3, 3]);
    strokeFill(c, glow > 0.1 ? C.gold : C.hole, C.ink, 1.8);

    // Ánh sáng quang phổ hình nón chiếu từ trên xuống cây trồng
    if (glow > 0.01) {
      var beam = c.createLinearGradient(0, lampY + 8, 0, -10);
      beam.addColorStop(0, 'rgba(255, 110, 185, ' + (0.55 * glow).toFixed(2) + ')');
      beam.addColorStop(0.7, 'rgba(255, 220, 80, ' + (0.35 * glow).toFixed(2) + ')');
      beam.addColorStop(1, 'rgba(255, 220, 80, 0.05)');
      c.fillStyle = beam;
      c.beginPath();
      c.moveTo(-32, lampY + 8);
      c.lineTo(-hw + 35, -12);
      c.lineTo(hw - 35, -12);
      c.lineTo(32, lampY + 8);
      c.closePath();
      c.fill();
    }

    // 2 Luống đất trồng rau mầm thử nghiệm bên trong nhà kính
    for (var side = -1; side <= 1; side += 2) {
      var bx = side * (hw * 0.45);
      var bw = hw * 0.65;
      // Khay luống
      rr(c, bx - bw / 2, -32, bw, 22, 3);
      strokeFill(c, C.paper, C.ink, 2);
      // Đất màu mỡ
      rr(c, bx - bw / 2 + 3, -30, bw - 6, 9, 2);
      strokeFill(c, '#4e342e', null, 0);

      // Cây con xanh tươi mọc bên trong
      var numSprouts = 3;
      for (var sp = 0; sp < numSprouts; sp++) {
        var sx = bx - bw / 2 + 14 + sp * ((bw - 28) / (numSprouts - 1));
        var sy = -30;
        // Thân
        c.strokeStyle = C.grassDark;
        c.lineWidth = 2.4;
        c.lineCap = 'round';
        c.beginPath();
        c.moveTo(sx, sy);
        c.lineTo(sx, sy - 14);
        c.stroke();
        // 2 lá mầm xanh
        c.fillStyle = C.grassLight;
        c.strokeStyle = C.ink;
        c.lineWidth = 1.4;
        c.beginPath();
        c.ellipse(sx - 5, sy - 14, 5.5, 3.2, -0.3, 0, Math.PI * 2);
        c.fill();
        c.stroke();
        c.beginPath();
        c.ellipse(sx + 5, sy - 14, 5.5, 3.2, 0.3, 0, Math.PI * 2);
        c.fill();
        c.stroke();
      }

      // Ống tưới nhỏ giọt dẫn nước vào luống
      c.strokeStyle = C.accent;
      c.lineWidth = 2.2;
      c.beginPath();
      c.moveTo(bx - bw / 2 - 6, -16);
      c.lineTo(bx + bw / 2 + 6, -16);
      c.stroke();
    }

    // --- VÒM KÍNH TRONG SUỐT (GEODESIC DOME) ---
    // Đường bao cung vòm elip
    c.beginPath();
    c.moveTo(-hw, -14);
    c.bezierCurveTo(-hw, -h * 1.06, hw, -h * 1.06, hw, -14);
    c.closePath();

    // Lớp kính trong suốt phản chiếu sắc trời & ánh sáng
    var glassGrad = c.createLinearGradient(-hw, -h, hw, 0);
    glassGrad.addColorStop(0, 'rgba(222, 240, 252, 0.42)');
    glassGrad.addColorStop(0.5, 'rgba(180, 230, 250, 0.22)');
    glassGrad.addColorStop(1, 'rgba(222, 240, 252, 0.36)');
    c.fillStyle = glassGrad;
    c.fill();
    c.strokeStyle = C.ink;
    c.lineWidth = LINE;
    c.stroke();

    // Các khung sườn vòm vòm cong chịu lực (khung kính vòm)
    c.lineWidth = 2.0;
    c.strokeStyle = 'rgba(255, 255, 255, 0.88)';
    // 2 vòng cung kinh độ
    for (var arcI = -1; arcI <= 1; arcI += 2) {
      c.beginPath();
      c.moveTo(arcI * hw * 0.52, -14);
      c.bezierCurveTo(arcI * hw * 0.45, -h * 0.88, 0, -h + 12, 0, -h + 12);
      c.stroke();
    }
    // Vòng hoành độ ngang vòm
    c.beginPath();
    c.moveTo(-hw * 0.82, -h * 0.48);
    c.bezierCurveTo(-hw * 0.3, -h * 0.58, hw * 0.3, -h * 0.58, hw * 0.82, -h * 0.48);
    c.stroke();
    c.beginPath();
    c.moveTo(-hw * 0.55, -h * 0.78);
    c.bezierCurveTo(-hw * 0.2, -h * 0.84, hw * 0.2, -h * 0.84, hw * 0.55, -h * 0.78);
    c.stroke();

    // Viền khung sườn nét đen kỹ thuật
    c.strokeStyle = C.inkSoft;
    c.lineWidth = 1.4;
    c.beginPath();
    c.moveTo(0, -14);
    c.lineTo(0, -h + 14);
    c.stroke();

    // Vệt bóng phản quang mặt kính (Gloss Highlight)
    c.strokeStyle = 'rgba(255, 255, 255, 0.75)';
    c.lineWidth = 4.5;
    c.lineCap = 'round';
    c.beginPath();
    c.arc(-hw * 0.28, -h * 0.62, hw * 0.48, Math.PI * 1.15, Math.PI * 1.45);
    c.stroke();

    // --- CỬA KHÓA KHÍ (AIRLOCK) KÍN HƠI BÊN HÔNG ---
    rr(c, hw - 28, -54, 28, 40, [6, 0, 0, 0]);
    strokeFill(c, C.paperWarm, C.ink, 2.2);
    // Cửa kính quan sát tròn
    c.beginPath();
    c.arc(hw - 14, -36, 7, 0, Math.PI * 2);
    strokeFill(c, C.accent, C.ink, 1.8);
    // Đèn trạng thái cửa
    c.beginPath();
    c.arc(hw - 14, -48, 2.5, 0, Math.PI * 2);
    strokeFill(c, C.ok, C.ink, 1.0);

    // Cột ăng-ten & cảm biến khí tượng trên đỉnh nóc vòm
    c.strokeStyle = C.ink;
    c.lineWidth = 2.4;
    c.beginPath();
    c.moveTo(0, -h);
    c.lineTo(0, -h - 18);
    c.stroke();
    // Đèn chớp đỏ báo hiệu không phận sao Hỏa
    c.beginPath();
    c.arc(0, -h - 18, 4, 0, Math.PI * 2);
    strokeFill(c, C.warn, C.ink, 1.8);

    c.restore();
  }

  // =========================================================================
  // 3. BED(c, x, gy, {state:'empty'|'target'|'planted'|'fallen', grow})
  // Một ô luống; 'target' viền nhấp nháy; grow 0..1 cây mọc lên.
  // =========================================================================
  function bed(c, x, gy, opts) {
    if (typeof x === 'object') { opts = x; x = 450; gy = GY0; }
    x = typeof x === 'number' ? x : 450;
    gy = typeof gy === 'number' ? gy : GY0;
    opts = opts || {};
    var state = opts.state || 'empty';
    var grow = Math.max(0, Math.min(1, typeof opts.grow === 'number' ? opts.grow : (state === 'planted' ? 1 : 0)));
    var t = typeof opts.t === 'number' ? opts.t : 0;

    var bw = 104;
    var bh = 38;

    c.save();
    c.translate(x, gy);

    // Xử lý góc nghiêng đổ nếu trạng thái là 'fallen'
    if (state === 'fallen') {
      c.rotate(0.38); // nghiêng khoảng 22 độ
    }

    // --- HIỆU ỨNG VIỀN NHẤP NHÁY NẾU STATE === 'TARGET' ---
    if (state === 'target') {
      var pulse = 0.5 + 0.5 * Math.sin(t * 8);
      // Viền phát sáng hào quang màu vàng
      c.strokeStyle = C.gold;
      c.lineWidth = 4.2 + 2.4 * pulse;
      c.lineJoin = 'round';
      rr(c, -bw / 2 - 6, -bh - 6, bw + 12, bh + 10, 8);
      c.stroke();

      // Mũi tên chỉ mục tiêu nhấp nhô phía trên luống (học sinh dễ nhận diện mà không cần chữ)
      var arrowY = -bh - 22 + Math.sin(t * 6) * 5;
      c.save();
      c.fillStyle = C.gold;
      c.strokeStyle = C.ink;
      c.lineWidth = 2.4;
      c.beginPath();
      c.moveTo(0, arrowY + 12);
      c.lineTo(-11, arrowY);
      c.lineTo(-5, arrowY);
      c.lineTo(-5, arrowY - 14);
      c.lineTo(5, arrowY - 14);
      c.lineTo(5, arrowY);
      c.lineTo(11, arrowY);
      c.closePath();
      c.fill();
      c.stroke();
      c.restore();
    }

    // --- HỘP KHAY LUỐNG CÔNG NGHỆ CAO ---
    // Thân khay màu trắng ngà
    rr(c, -bw / 2, -bh, bw, bh, 5);
    strokeFill(c, C.paperWarm, C.ink, LINE);

    // Vạch trang trí công nghệ màu xanh ngọc
    c.fillStyle = C.accent;
    c.fillRect(-bw / 2 + 10, -bh + 14, bw - 20, 6);
    c.strokeRect(-bw / 2 + 10, -bh + 14, bw - 20, 6);

    // Lòng đất trồng cây (đất nâu tơi xốp giàu dinh dưỡng)
    rr(c, -bw / 2 + 6, -bh + 4, bw - 12, 10, 3);
    strokeFill(c, '#3e2723', C.ink, 1.8);

    // Đèn LED chỉ báo trạng thái trên mặt trước khay luống
    var ledCol = {
      empty: '#78909c',
      target: C.gold,
      planted: C.ok,
      fallen: C.warn
    }[state] || '#78909c';
    c.beginPath();
    c.arc(-bw / 2 + 14, -bh + 26, 4, 0, Math.PI * 2);
    strokeFill(c, ledCol, C.ink, 1.5);

    // --- TRẠNG THÁI 'EMPTY': LÒNG ĐẤT CÓ HỐ ĐỂ SẴN CHỜ ĐẶT CÂY ---
    if (state === 'empty' || state === 'target') {
      c.beginPath();
      c.ellipse(0, -bh + 8, 14, 4, 0, 0, Math.PI * 2);
      c.fillStyle = '#21120b';
      c.fill();
    }

    // --- TRẠNG THÁI 'FALLEN': ĐẤT VĂNG TUNG TÓE RA NGOÀI ---
    if (state === 'fallen') {
      c.fillStyle = '#3e2723';
      c.beginPath();
      c.arc(bw * 0.42, -bh + 12, 7, 0, Math.PI * 2);
      c.arc(bw * 0.55, -bh + 18, 5, 0, Math.PI * 2);
      c.arc(bw * 0.48, -bh + 24, 6, 0, Math.PI * 2);
      c.fill();
    }

    // --- TRẠNG THÁI 'PLANTED' HOẶC CÓ CÂY (GROW > 0) ---
    if (state === 'planted' || (state === 'fallen' && grow > 0)) {
      drawPlantedCrop(c, 0, -bh + 8, grow, state === 'fallen');
    }

    c.restore();
  }

  // Vẽ cây trồng trong luống lớn lên theo tiến trình grow (0..1)
  function drawPlantedCrop(c, cx, cy, grow, isFallen) {
    c.save();
    c.translate(cx, cy);

    // Gốc đất quanh rễ cây
    c.fillStyle = '#2b170c';
    c.beginPath();
    c.ellipse(0, 0, 16, 4.5, 0, 0, Math.PI * 2);
    c.fill();

    // Chiều cao cây tăng dần theo grow (từ mầm nhỏ cao 16px đến cây trĩu quả cao 52px)
    var stemH = 16 + grow * 36;
    var bend = isFallen ? 16 : 0;

    // Thân cây xanh mọc vươn thẳng
    c.strokeStyle = C.grassDark;
    c.lineWidth = 3.4;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(0, 0);
    c.quadraticCurveTo(bend * 0.5, -stemH * 0.5, bend, -stemH);
    c.stroke();

    // Nếu vừa mới trồng (grow < 0.25): 2 lá mầm con chúm chím
    if (grow <= 0.25) {
      var leafS = 0.5 + grow * 2;
      for (var s = -1; s <= 1; s += 2) {
        c.save();
        c.translate(bend, -stemH);
        c.rotate(s * 0.45);
        c.beginPath();
        c.ellipse(s * 8 * leafS, -3 * leafS, 9 * leafS, 5 * leafS, s * 0.2, 0, Math.PI * 2);
        strokeFill(c, C.grassLight, C.ink, 1.8);
        c.restore();
      }
    } else {
      // Cây đang lớn hoặc đã trưởng thành: các tầng lá sum suê
      var leafCount = grow > 0.65 ? 6 : 4;
      for (var l = 0; l < leafCount; l++) {
        var side = (l % 2 === 0 ? -1 : 1);
        var tY = -stemH * (0.28 + (l / leafCount) * 0.65);
        var tX = bend * (tY / -stemH);
        var lSize = 10 + grow * 6;

        c.save();
        c.translate(tX, tY);
        c.rotate(side * (0.35 + (l % 2) * 0.25));
        c.beginPath();
        c.ellipse(side * lSize * 0.7, 0, lSize, lSize * 0.55, 0, 0, Math.PI * 2);
        strokeFill(c, l % 2 === 0 ? C.grass : C.grassLight, C.ink, 2.0);
        // Gân lá
        c.strokeStyle = C.grassDark;
        c.lineWidth = 1.4;
        c.beginPath();
        c.moveTo(0, 0);
        c.lineTo(side * lSize * 1.3, 0);
        c.stroke();
        c.restore();
      }

      // Ngọn cây xanh mướt
      c.beginPath();
      c.ellipse(bend, -stemH - 4, 8, 6, 0, 0, Math.PI * 2);
      strokeFill(c, C.grassLight, C.ink, 1.8);

      // Nếu grow >= 0.7: cây ra quả cà chua đỏ mọng (hoặc dâu tây sao Hỏa), thành quả của học sinh!
      if (grow >= 0.7) {
        var fruitScale = (grow - 0.7) / 0.3; // 0..1
        var fruits = [
          { x: bend - 14, y: -stemH * 0.52, r: 8 * fruitScale },
          { x: bend + 15, y: -stemH * 0.62, r: 9 * fruitScale }
        ];
        for (var fi = 0; fi < fruits.length; fi++) {
          var fr = fruits[fi];
          if (fr.r > 2) {
            c.save();
            c.translate(fr.x, fr.y);
            // Cuống quả sao vàng xanh
            c.fillStyle = C.grassDark;
            c.beginPath();
            c.arc(0, -fr.r + 1, 3, 0, Math.PI * 2);
            c.fill();
            // Quả đỏ tươi
            c.beginPath();
            c.arc(0, 0, fr.r, 0, Math.PI * 2);
            strokeFill(c, C.warn, C.ink, 2.0);
            // Đốm sáng căng mọng
            c.fillStyle = '#ffffff';
            c.beginPath();
            c.arc(-fr.r * 0.32, -fr.r * 0.32, fr.r * 0.28, 0, Math.PI * 2);
            c.fill();
            c.restore();
          }
        }
      }
    }

    c.restore();
  }

  // =========================================================================
  // 4. POT(c, x, gy, {size:'small'|'big', tipped, held})
  // Chậu cây non; tipped = đổ nghiêng, đất vương; held = đang được gắp giữ.
  // =========================================================================
  function pot(c, x, gy, opts) {
    if (typeof x === 'object') { opts = x; x = 450; gy = GY0; }
    x = typeof x === 'number' ? x : 450;
    gy = typeof gy === 'number' ? gy : GY0;
    opts = opts || {};
    var isBig = opts.size === 'big';
    var tipped = !!opts.tipped;
    var held = !!opts.held;

    // Kích thước chậu
    var pw = isBig ? 48 : 34;
    var ph = isBig ? 38 : 28;
    var rimH = isBig ? 9 : 7;
    var btmW = pw * 0.72;

    c.save();
    c.translate(x, gy);

    // Khi được tay robot gắp giữ (held): nâng nhẹ lên một chút
    if (held && !tipped) {
      c.translate(0, -10);
      // Hai vấu kẹp của tay gắp đang ôm chặt chậu
      c.fillStyle = C.paper;
      c.strokeStyle = C.ink;
      c.lineWidth = 2.0;
      rr(c, -pw / 2 - 8, -ph + 2, 7, 12, 2);
      c.fill(); c.stroke();
      rr(c, pw / 2 + 1, -ph + 2, 7, 12, 2);
      c.fill(); c.stroke();
    }

    // Khi bị đổ nghiêng (tipped): xoay nghiêng và vương vãi đất ra sàn
    if (tipped) {
      c.translate(0, -6);
      c.rotate(1.28); // nghiêng xấp xỉ 74 độ

      // Đất màu nâu vương vãi thành đống trên mặt đất
      c.save();
      c.rotate(-1.28); // giữ đống đất nằm ngang trên mặt đất
      c.fillStyle = '#3e2723';
      c.beginPath();
      c.ellipse(pw * 0.45, 0, 16, 5, 0, 0, Math.PI * 2);
      c.fill();
      // Vài mẩu đất vụn bắn ra
      for (var ci = 1; ci <= 4; ci++) {
        c.beginPath();
        c.arc(pw * 0.45 + ci * 7, -2, 2.8 - ci * 0.4, 0, Math.PI * 2);
        c.fill();
      }
      c.restore();
    }

    // --- THÂN CHẬU GỐM NUNG TRUYỀN THỐNG PHA CÔNG NGHỆ ---
    // Khối thân dưới thon dần về đáy
    c.beginPath();
    c.moveTo(-pw / 2 + 3, -ph + rimH);
    c.lineTo(-btmW / 2, 0);
    c.lineTo(btmW / 2, 0);
    c.lineTo(pw / 2 - 3, -ph + rimH);
    c.closePath();
    strokeFill(c, C.mars, C.ink, LINE);

    // Vạch sáng phản quang dọc thân chậu
    c.fillStyle = 'rgba(255, 255, 255, 0.28)';
    c.beginPath();
    c.moveTo(-pw / 2 + 8, -ph + rimH + 3);
    c.lineTo(-btmW / 2 + 5, -2);
    c.lineTo(-btmW / 2 + 11, -2);
    c.lineTo(-pw / 2 + 14, -ph + rimH + 3);
    c.closePath();
    c.fill();

    // Vành miệng chậu bo tròn
    rr(c, -pw / 2, -ph, pw, rimH, 3);
    strokeFill(c, '#e0764d', C.ink, LINE);

    // Đất màu mỡ đầy ắp bên trong miệng chậu
    c.beginPath();
    c.ellipse(0, -ph + 2, pw * 0.42, 3.2, 0, 0, Math.PI * 2);
    c.fillStyle = '#3e2723';
    c.fill();

    // --- CÂY NON TRONG CHẬU ---
    // Cây non xanh tươi mọc vươn lên từ chậu
    var stemLen = isBig ? 32 : 22;
    c.strokeStyle = C.grassDark;
    c.lineWidth = 3.0;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(0, -ph + 2);
    c.lineTo(0, -ph - stemLen);
    c.stroke();

    // Lá mầm non xanh mướt
    if (isBig) {
      // Chậu lớn: 4 lá xum xuê
      for (var bi = 0; bi < 4; bi++) {
        var bSide = bi % 2 === 0 ? -1 : 1;
        var bY = -ph - 8 - bi * 6;
        c.save();
        c.translate(0, bY);
        c.rotate(bSide * 0.45);
        c.beginPath();
        c.ellipse(bSide * 9, 0, 11, 6, 0, 0, Math.PI * 2);
        strokeFill(c, bi % 2 === 0 ? C.grass : C.grassLight, C.ink, 1.8);
        c.restore();
      }
    } else {
      // Chậu nhỏ: 2 lá mầm dễ thương
      for (var si = -1; si <= 1; si += 2) {
        c.save();
        c.translate(0, -ph - stemLen);
        c.rotate(si * 0.5);
        c.beginPath();
        c.ellipse(si * 8, -2, 9, 5.5, si * 0.2, 0, Math.PI * 2);
        strokeFill(c, C.grassLight, C.ink, 1.8);
        c.restore();
      }
    }

    c.restore();
  }

  // =========================================================================
  // 5. ROBOT(c, x, gy, {armDown, wheelAngle, sensorOn, upgrades})
  // Xe 2 bánh + khung gắp phía trước hạ/nâng theo armDown; vẽ các gói nâng cấp khi bật.
  // upgrades: {wideArm, watering, lamp, solar}
  // =========================================================================
  function robot(c, x, gy, opts) {
    if (typeof x === 'object') { opts = x; x = 450; gy = GY0; }
    x = typeof x === 'number' ? x : 450;
    gy = typeof gy === 'number' ? gy : GY0;
    opts = opts || {};
    var armDown = Math.max(0, Math.min(1, typeof opts.armDown === 'number' ? opts.armDown : 0));
    var wheelAngle = typeof opts.wheelAngle === 'number' ? opts.wheelAngle : 0;
    var sensorOn = !!opts.sensorOn;
    var upg = opts.upgrades || {};
    var wideArm = !!upg.wideArm;
    var watering = !!upg.watering;
    var lamp = !!upg.lamp;
    var solar = !!upg.solar;

    var wheelR = 24;

    c.save();
    c.translate(x, gy);

    // --- BÌNH NƯỚC TƯỚI (NÂNG CẤP: WATERING) GẮN TRÊN LƯNG ---
    if (watering) {
      // Bồn chứa nước hình trụ trong suốt
      rr(c, -54, -92, 34, 28, 6);
      strokeFill(c, C.waterDeep, C.ink, 2.2);
      // Mực nước và bọt khí
      rr(c, -52, -78, 30, 12, 3);
      c.fillStyle = C.water;
      c.fill();
      c.beginPath();
      c.arc(-42, -72, 2.5, 0, Math.PI * 2);
      c.fillStyle = '#ffffff';
      c.fill();
      // Nắp bồn & ống bơm
      rr(c, -44, -98, 14, 7, 2);
      strokeFill(c, C.gold, C.ink, 1.8);
      // Dây dẫn nước màu xanh chạy dọc thân xe
      c.strokeStyle = C.water;
      c.lineWidth = 3.2;
      c.lineCap = 'round';
      c.beginPath();
      c.moveTo(-20, -78);
      c.quadraticCurveTo(10, -82, 32, -62);
      c.stroke();
    }

    // --- DÀN PIN MẶT TRỜI (NÂNG CẤP: SOLAR) NẰM TRÊN NÓC ---
    if (solar) {
      c.save();
      // Khung giá đỡ kim loại
      c.strokeStyle = C.ink;
      c.lineWidth = 2.4;
      c.beginPath();
      c.moveTo(-22, -68);
      c.lineTo(-22, -90);
      c.moveTo(12, -68);
      c.lineTo(12, -90);
      c.stroke();

      // Tấm pin quang điện nằm nghiêng đón ánh nắng sao Hỏa
      rr(c, -48, -98, 68, 12, 2);
      strokeFill(c, '#0d2b45', C.ink, 2.4);
      // Các ô pin silic màu xanh đậm viền sáng
      c.fillStyle = '#1b4965';
      c.strokeStyle = '#62b6cb';
      c.lineWidth = 1.0;
      for (var si = 0; si < 5; si++) {
        c.fillRect(-45 + si * 13, -96, 11, 8);
        c.strokeRect(-45 + si * 13, -96, 11, 8);
      }
      c.restore();
    }

    // --- ĐÈN PHA CHIẾU SÁNG (NÂNG CẤP: LAMP) ---
    if (lamp) {
      // Đèn pha gắn trên vai trước của xe
      rr(c, 24, -92, 18, 16, 3);
      strokeFill(c, C.gold, C.ink, 2.0);
      // Thấu kính đèn phát sáng
      c.beginPath();
      c.arc(42, -84, 8, -Math.PI * 0.5, Math.PI * 0.5);
      strokeFill(c, '#ffffff', C.ink, 2.0);

      // Luồng sáng vàng rực chiếu rọi xuống mặt đất phía trước
      var lampBeam = c.createLinearGradient(42, -84, 180, 0);
      lampBeam.addColorStop(0, 'rgba(255, 230, 90, 0.65)');
      lampBeam.addColorStop(0.4, 'rgba(255, 230, 90, 0.35)');
      lampBeam.addColorStop(1, 'rgba(255, 230, 90, 0)');
      c.fillStyle = lampBeam;
      c.beginPath();
      c.moveTo(42, -88);
      c.lineTo(210, -25);
      c.lineTo(170, 0);
      c.lineTo(42, -78);
      c.closePath();
      c.fill();
    }

    // --- THÂN XE ROBOT ZM ALPHA (MÀU TRẮNG NGÀ + SỌC CYAN) ---
    // Khung gầm máy màu sẫm bên dưới
    rr(c, -50, -38, 86, 16, 3);
    strokeFill(c, C.road, C.ink, LINE);

    // Hộp thân xe chính
    rr(c, -46, -68, 78, 38, 6);
    strokeFill(c, C.paperWarm, C.ink, LINE);

    // Vạch trang trí công nghệ màu xanh ngọc (Alpha 330)
    c.fillStyle = C.accent;
    c.fillRect(-44, -54, 74, 9);
    c.strokeRect(-44, -54, 74, 9);

    // Màn hình hiển thị LED biểu cảm khuôn mặt thân thiện
    rr(c, -8, -64, 34, 16, 4);
    strokeFill(c, C.ink, C.ink, 1.8);
    // Mắt LED xanh ngọc hình chữ nhật bo góc
    c.fillStyle = C.accentLight;
    c.beginPath();
    c.arc(1, -56, 2.8, 0, Math.PI * 2);
    c.arc(17, -56, 2.8, 0, Math.PI * 2);
    c.fill();

    // --- CẢM BIẾN SÓNG ÂM (SENSOR) GẮN TRÊN MŨI XE ---
    // Hộp cảm biến 2 mắt
    rr(c, 24, -62, 16, 22, 3);
    strokeFill(c, C.paper, C.ink, 2.0);
    for (var ey = -1; ey <= 1; ey += 2) {
      c.beginPath();
      c.arc(32, -51 + ey * 6, 4, 0, Math.PI * 2);
      strokeFill(c, sensorOn ? C.gold : C.hole, C.ink, 1.4);
    }

    // Sóng siêu âm phát ra khi sensorOn === true
    if (sensorOn) {
      c.strokeStyle = C.gold;
      c.lineWidth = 2.4;
      c.lineCap = 'round';
      for (var sw = 1; sw <= 3; sw++) {
        c.beginPath();
        c.arc(34, -51, 14 + sw * 10, -0.42, 0.42);
        c.stroke();
      }
    }

    // --- TAY GẮP PHÍA TRƯỚC (HẠ / NÂNG THEO armDown 0..1) ---
    // Khớp vai gắn trên thân xe
    var shoulderX = 26;
    var shoulderY = -42;

    // Góc quay của cánh tay: armDown=0 -> vươn cao (-30 deg), armDown=1 -> hạ sát đất (+35 deg)
    var armAngle = -0.48 + armDown * 0.95;
    var armLen = wideArm ? 44 : 36;
    var elbowX = shoulderX + Math.cos(armAngle) * armLen;
    var elbowY = shoulderY + Math.sin(armAngle) * armLen;

    // Cánh tay robot
    c.strokeStyle = wideArm ? C.gold : C.paper;
    c.lineWidth = wideArm ? 9.5 : 7.0;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(shoulderX, shoulderY);
    c.lineTo(elbowX, elbowY);
    c.stroke();
    // Viền đen cánh tay
    c.strokeStyle = C.ink;
    c.lineWidth = 2.2;
    c.stroke();

    // Khớp xoay vai
    c.beginPath();
    c.arc(shoulderX, shoulderY, 6, 0, Math.PI * 2);
    strokeFill(c, C.gold, C.ink, 2.0);

    // Bàn tay gắp (Gripper) gắn ở đầu cánh tay
    c.save();
    c.translate(elbowX, elbowY);
    // Góc bàn tay hướng xuống song song hoặc ôm chậu
    var wristAngle = 0.25 + armDown * 0.45;
    c.rotate(wristAngle);

    // Khớp cổ tay
    c.beginPath();
    c.arc(0, 0, 5, 0, Math.PI * 2);
    strokeFill(c, C.ink, C.ink, 1.8);

    // Hai vấu kẹp của khung gắp
    var clawSpan = wideArm ? 20 : 14;
    var clawLen = wideArm ? 24 : 18;

    c.strokeStyle = wideArm ? C.gold : C.road;
    c.lineWidth = wideArm ? 4.8 : 3.6;
    c.lineCap = 'round';
    c.lineJoin = 'round';

    // Vấu kẹp trên
    c.beginPath();
    c.moveTo(0, -clawSpan / 2);
    c.lineTo(clawLen * 0.65, -clawSpan / 2);
    c.lineTo(clawLen, -clawSpan * 0.2);
    c.stroke();
    c.strokeStyle = C.ink;
    c.lineWidth = 1.8;
    c.stroke();

    // Vấu kẹp dưới
    c.strokeStyle = wideArm ? C.gold : C.road;
    c.lineWidth = wideArm ? 4.8 : 3.6;
    c.beginPath();
    c.moveTo(0, clawSpan / 2);
    c.lineTo(clawLen * 0.65, clawSpan / 2);
    c.lineTo(clawLen, clawSpan * 0.2);
    c.stroke();
    c.strokeStyle = C.ink;
    c.lineWidth = 1.8;
    c.stroke();

    // Nếu có gói tưới nước (watering) & arm đang hạ: vòi phun nước phun tia nước nhỏ
    if (watering && armDown > 0.4) {
      c.strokeStyle = C.water;
      c.lineWidth = 2.2;
      c.beginPath();
      c.moveTo(clawLen * 0.5, 0);
      c.lineTo(clawLen + 14, 8);
      c.moveTo(clawLen * 0.5, 0);
      c.lineTo(clawLen + 12, 16);
      c.stroke();
    }

    c.restore();

    // --- 2 BÁNH XE TO BÁM ĐẤT SAO HỎA ---
    // Bánh sau: x = -32, Bánh trước: x = 18
    var wheelPositions = [-32, 18];
    for (var wi = 0; wi < wheelPositions.length; wi++) {
      var wx = wheelPositions[wi];
      var wy = -wheelR;

      c.save();
      c.translate(wx, wy);

      // Lốp cao su gai chống trượt trên cát
      c.beginPath();
      c.arc(0, 0, wheelR, 0, Math.PI * 2);
      strokeFill(c, '#263238', C.ink, LINE);

      // Vành mâm xe màu xanh ngọc (Alpha 330)
      c.beginPath();
      c.arc(0, 0, wheelR * 0.65, 0, Math.PI * 2);
      strokeFill(c, C.accent, C.ink, 2.0);

      // Trục tâm màu vàng xoay theo wheelAngle
      c.rotate(wheelAngle);
      c.strokeStyle = C.ink;
      c.lineWidth = 2.4;
      for (var sp = 0; sp < 4; sp++) {
        c.beginPath();
        c.moveTo(0, 0);
        c.lineTo(0, wheelR * 0.62);
        c.stroke();
        c.rotate(Math.PI / 2);
      }
      c.beginPath();
      c.arc(0, 0, 5, 0, Math.PI * 2);
      strokeFill(c, C.gold, C.ink, 1.8);

      c.restore();
    }

    c.restore();
  }

  // =========================================================================
  // 6. DUST(c, W, H, {t, strength})
  // Lớp bụi bão phủ màn hình.
  // =========================================================================
  function dust(c, W, H, opts) {
    if (typeof W === 'object') { opts = W; W = W0; H = H0; }
    W = W || W0;
    H = H || H0;
    opts = opts || {};
    var t = typeof opts.t === 'number' ? opts.t : 0;
    var strength = Math.max(0, Math.min(1, typeof opts.strength === 'number' ? opts.strength : 0.7));

    if (strength <= 0.01) return;

    c.save();

    // 1. Màn sương bụi cam đỏ bao trùm toàn không gian
    c.fillStyle = 'rgba(217, 107, 67, ' + (0.32 * strength).toFixed(2) + ')';
    c.fillRect(0, 0, W, H);

    // 2. Các vệt gió bụi dài lướt nhanh ngang màn hình
    c.lineCap = 'round';
    var streakCount = Math.round(14 + 18 * strength);
    for (var s = 0; s < streakCount; s++) {
      var speed = 360 + (s % 5) * 80;
      var sx = ((t * speed + s * 127) % (W + 280)) - 140;
      var sy = (s * 39 + Math.sin(t * 3 + s) * 12) % H;
      var sLen = 90 + (s % 4) * 45;
      var alpha = (0.28 + 0.42 * strength) * (0.5 + (s % 3) * 0.25);

      c.strokeStyle = 'rgba(245, 175, 120, ' + alpha.toFixed(2) + ')';
      c.lineWidth = 2.4 + (s % 3) * 1.6;
      c.beginPath();
      c.moveTo(sx, sy);
      c.lineTo(sx + sLen, sy + (s % 2 === 0 ? 4 : -4));
      c.stroke();
    }

    // 3. Các hạt cát bụi li ti bay xoáy cuộn trong không khí
    var particleCount = Math.round(35 + 40 * strength);
    c.fillStyle = 'rgba(255, 210, 150, ' + (0.45 * strength).toFixed(2) + ')';
    for (var p = 0; p < particleCount; p++) {
      var pSpd = 260 + (p % 6) * 60;
      var px = ((t * pSpd + p * 83) % (W + 60)) - 30;
      var py = (p * 47 + Math.sin(t * 4.5 + p) * 18) % H;
      var pr = 1.4 + (p % 3) * 0.9;
      c.beginPath();
      c.arc(px, py, pr, 0, Math.PI * 2);
      c.fill();
    }

    c.restore();
  }

  // =========================================================================
  // 7. NOTEA(c, x, y, {t})
  // Nốt nhạc bay lên (giai điệu A: robot hát mừng hoặc hoàn thành nhiệm vụ).
  // =========================================================================
  function noteA(c, x, y, opts) {
    if (typeof x === 'object') { opts = x; x = 450; y = 280; }
    x = typeof x === 'number' ? x : 450;
    y = typeof y === 'number' ? y : 280;
    opts = opts || {};
    var t = typeof opts.t === 'number' ? opts.t : 0;

    c.save();

    // 3 nốt nhạc bay lên so le theo thời gian với các màu sắc tươi vui
    var notes = [
      { dt: 0.00, col: C.gold, type: 'single', dx: -18, scale: 1.0 },
      { dt: 0.38, col: C.accent, type: 'double', dx: 12, scale: 1.15 },
      { dt: 0.76, col: C.orange, type: 'single', dx: -6, scale: 0.88 }
    ];

    for (var i = 0; i < notes.length; i++) {
      var nt = notes[i];
      // Tiến trình bay lên theo chu kỳ 1.4 giây
      var prog = ((t * 0.75 + nt.dt) % 1 + 1) % 1;
      var curY = y - prog * 70;
      var curX = x + nt.dx + Math.sin(t * 4 + i * 2) * 12;
      var alpha = prog < 0.2 ? (prog / 0.2) : (prog > 0.8 ? (1 - (prog - 0.8) / 0.2) : 1);

      if (alpha > 0.02) {
        c.save();
        c.translate(curX, curY);
        c.scale(nt.scale, nt.scale);
        c.globalAlpha = alpha;

        if (nt.type === 'single') {
          // Nốt đơn ♪
          c.fillStyle = nt.col;
          c.strokeStyle = C.ink;
          c.lineWidth = 2.0;

          // Đầu nốt nghiêng
          c.beginPath();
          c.ellipse(0, 0, 5.5, 4.0, -0.4, 0, Math.PI * 2);
          c.fill();
          c.stroke();

          // Cán nốt
          c.beginPath();
          c.moveTo(4, -1);
          c.lineTo(4, -18);
          // Móc nốt
          c.quadraticCurveTo(12, -15, 13, -7);
          c.lineTo(13, -11);
          c.quadraticCurveTo(10, -18, 4, -18);
          c.fill();
          c.stroke();
        } else {
          // Nốt đôi ♫
          c.fillStyle = nt.col;
          c.strokeStyle = C.ink;
          c.lineWidth = 2.0;

          // 2 đầu nốt
          c.beginPath();
          c.ellipse(-7, 0, 4.8, 3.5, -0.4, 0, Math.PI * 2);
          c.ellipse(7, -3, 4.8, 3.5, -0.4, 0, Math.PI * 2);
          c.fill();
          c.stroke();

          // 2 cán nốt + xà nối
          c.beginPath();
          c.moveTo(-3, -2);
          c.lineTo(-3, -19);
          c.lineTo(11, -22);
          c.lineTo(11, -5);
          c.lineTo(9, -5);
          c.lineTo(9, -18);
          c.lineTo(-1, -16);
          c.lineTo(-1, -2);
          c.closePath();
          c.fill();
          c.stroke();
        }

        // Hạt lấp lánh nhỏ xung quanh nốt nhạc
        c.fillStyle = C.gold;
        c.beginPath();
        c.arc(10, -12, 1.8, 0, Math.PI * 2);
        c.arc(-10, -8, 1.4, 0, Math.PI * 2);
        c.fill();

        c.restore();
      }
    }

    c.restore();
  }

  // =========================================================================
  // XUẤT GIAO DIỆN window.Lop3Bai12Art
  // =========================================================================
  var Lop3Bai12Art = {
    W: W0,
    H: H0,
    GROUND_Y: GY0,
    background: background,
    greenhouse: greenhouse,
    bed: bed,
    pot: pot,
    robot: robot,
    dust: dust,
    noteA: noteA,
    // Các alias hỗ trợ tương thích bổ sung
    drawBackground: background,
    drawGreenhouse: greenhouse,
    drawBed: bed,
    drawPot: pot,
    drawRobot: robot,
    drawDust: dust,
    drawNoteA: noteA
  };

  if (typeof window !== 'undefined') {
    window.Lop3Bai12Art = Lop3Bai12Art;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Lop3Bai12Art;
  }
})();
