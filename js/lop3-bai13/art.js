// Thư viện vẽ cảnh Lớp 3 · Bài 13: "Phi thuyền không gian" (window.Lop3Bai13Art).
// Khung nhìn chuẩn: 900x560, mặt đất đường băng GY = 430.
// Dành cho học sinh lớp 3 trên máy tính bảng: khối to, viền đậm C.ink, nét LINE = 2.6, không chữ trong hình, không vũ khí.
// Không dùng ảnh ngoài, không dùng font ngoài, không dùng Math.random() khi vẽ (dùng mảng tĩnh hoặc hàm điều hòa sin/cos theo t).
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

  // Ưu tiên dùng bảng màu và nét LINE của ZMArt nếu đã nạp trước đó
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

  // Dữ liệu sao cố định trên bầu trời vũ trụ (tránh nhấp nháy giật hình)
  var STARS = [
    { x: 35, y: 30, r: 1.8, f: 1.7 },
    { x: 85, y: 75, r: 1.3, f: 2.1 },
    { x: 145, y: 35, r: 2.2, f: 1.3 },
    { x: 215, y: 80, r: 1.4, f: 3.2 },
    { x: 290, y: 45, r: 2.0, f: 1.1 },
    { x: 360, y: 95, r: 1.5, f: 2.5 },
    { x: 430, y: 32, r: 2.4, f: 1.8 },
    { x: 505, y: 65, r: 1.6, f: 2.2 },
    { x: 580, y: 38, r: 1.9, f: 1.6 },
    { x: 655, y: 85, r: 1.4, f: 2.9 },
    { x: 730, y: 42, r: 2.3, f: 1.4 },
    { x: 805, y: 90, r: 1.5, f: 2.0 },
    { x: 865, y: 35, r: 2.1, f: 1.7 },
    { x: 110, y: 140, r: 1.4, f: 2.8 },
    { x: 260, y: 160, r: 1.8, f: 1.5 },
    { x: 480, y: 135, r: 1.5, f: 2.3 },
    { x: 690, y: 155, r: 1.7, f: 1.9 },
    { x: 840, y: 145, r: 1.3, f: 2.6 }
  ];

  // =========================================================================
  // 1. BACKGROUND(c, {t, env, storm})
  // Đường băng sân bay vũ trụ nhìn ngang.
  // env: 'spaceport' (Trái Đất / Trạm không gian) | 'moon' (Mặt Trăng) | 'mars' (Sao Hỏa) | 'asteroid' (Tiểu hành tinh)
  // storm: 0..1 (bụi vũ trụ bay ngang)
  // =========================================================================
  function background(c, opts) {
    opts = opts || {};
    var t = typeof opts.t === 'number' ? opts.t : 0;
    var env = opts.env || 'spaceport';
    var storm = Math.max(0, Math.min(1, typeof opts.storm === 'number' ? opts.storm : 0));
    var W = W0, H = H0, gy = GY0;

    c.save();

    // 1.1 Bầu trời không gian & thiên thể
    var skyGrad = c.createLinearGradient(0, 0, 0, gy);
    if (env === 'moon') {
      skyGrad.addColorStop(0, '#040711');
      skyGrad.addColorStop(0.7, '#0c1426');
      skyGrad.addColorStop(1, '#1b253b');
    } else if (env === 'mars') {
      skyGrad.addColorStop(0, '#2d1117');
      skyGrad.addColorStop(0.6, '#7a2e1d');
      skyGrad.addColorStop(1, '#c45a31');
    } else if (env === 'asteroid') {
      skyGrad.addColorStop(0, '#0d081f');
      skyGrad.addColorStop(0.65, '#22153d');
      skyGrad.addColorStop(1, '#3b255e');
    } else {
      // 'spaceport' mặc định (hoàng hôn sân bay vũ trụ hiện đại)
      skyGrad.addColorStop(0, '#09152e');
      skyGrad.addColorStop(0.5, '#17345f');
      skyGrad.addColorStop(0.85, '#295b88');
      skyGrad.addColorStop(1, '#4faaf0');
    }
    c.fillStyle = skyGrad;
    c.fillRect(0, 0, W, gy);

    // 1.2 Dải sao lấp lánh (dùng mảng tĩnh, tính chu kỳ theo t)
    c.save();
    for (var i = 0; i < STARS.length; i++) {
      var s = STARS[i];
      var alpha = 0.35 + 0.55 * Math.sin(t * s.f + i);
      c.fillStyle = (env === 'mars') ? '#ffecd2' : '#ffffff';
      c.globalAlpha = Math.max(0.1, Math.min(1, alpha));
      c.beginPath();
      c.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      c.fill();
    }
    c.restore();

    // 1.3 Thiên thể trên bầu trời (Hành tinh / Mặt Trăng / Trái Đất xa xa)
    c.save();
    if (env === 'moon') {
      // Trái Đất xanh biếc lơ lửng trên nền trời Mặt Trăng
      var ex = 740, ey = 110, er = 46;
      c.beginPath();
      c.arc(ex, ey, er + 6, 0, Math.PI * 2);
      c.fillStyle = 'rgba(61, 193, 220, 0.18)';
      c.fill();

      c.beginPath();
      c.arc(ex, ey, er, 0, Math.PI * 2);
      c.fillStyle = '#2980b9';
      c.fill();
      c.strokeStyle = C.ink;
      c.lineWidth = 2.4;
      c.stroke();

      // Mảng lục địa xanh lá và mây trắng cách điệu
      c.save();
      c.beginPath();
      c.arc(ex, ey, er - 1, 0, Math.PI * 2);
      c.clip();
      c.fillStyle = '#6db843';
      c.beginPath();
      c.ellipse(ex - 12, ey - 10, 20, 14, 0.4, 0, Math.PI * 2);
      c.fill();
      c.beginPath();
      c.ellipse(ex + 16, ey + 14, 18, 12, -0.3, 0, Math.PI * 2);
      c.fill();
      // Vệt mây trắng
      c.fillStyle = 'rgba(255, 255, 255, 0.65)';
      c.beginPath();
      c.ellipse(ex + 4, ey - 16, 24, 6, 0.2, 0, Math.PI * 2);
      c.ellipse(ex - 8, ey + 8, 26, 7, -0.2, 0, Math.PI * 2);
      c.fill();
      c.restore();
    } else if (env === 'mars') {
      // Mặt trời nhỏ trắng mờ và 2 mặt trăng nhỏ xíu
      c.beginPath();
      c.arc(760, 105, 20, 0, Math.PI * 2);
      c.fillStyle = '#fff4e0';
      c.fill();
      c.beginPath();
      c.arc(760, 105, 28, 0, Math.PI * 2);
      c.fillStyle = 'rgba(255, 244, 224, 0.2)';
      c.fill();
      // Vệ tinh Phobos
      c.beginPath();
      c.arc(680, 75, 5, 0, Math.PI * 2);
      c.fillStyle = '#c89d54';
      c.fill();
      c.strokeStyle = C.ink;
      c.lineWidth = 1.5;
      c.stroke();
    } else if (env === 'asteroid') {
      // Hành tinh khổng lồ có vành đai phía xa
      var px = 730, py = 120, pr = 52;
      c.beginPath();
      c.arc(px, py, pr, 0, Math.PI * 2);
      c.fillStyle = '#9b59b6';
      c.fill();
      c.strokeStyle = C.ink;
      c.lineWidth = 2.4;
      c.stroke();
      // Vành đai nghiêng
      c.save();
      c.translate(px, py);
      c.rotate(-0.35);
      c.beginPath();
      c.ellipse(0, 0, 84, 14, 0, 0, Math.PI * 2);
      c.strokeStyle = 'rgba(255, 210, 63, 0.8)';
      c.lineWidth = 6;
      c.stroke();
      c.strokeStyle = C.ink;
      c.lineWidth = 1.8;
      c.stroke();
      c.restore();
    } else {
      // 'spaceport': Mặt trăng lưỡi liềm hoặc đài vũ trụ quỹ đạo xa
      c.beginPath();
      c.arc(770, 95, 28, 0, Math.PI * 2);
      c.fillStyle = '#ffd23f';
      c.fill();
      c.beginPath();
      c.arc(758, 90, 24, 0, Math.PI * 2);
      c.fillStyle = skyGrad;
      c.fill();
    }
    c.restore();

    // 1.4 Hậu cảnh chân trời: Dãy núi xa, nhà vòm quan trắc và trạm phóng
    c.save();
    if (env === 'moon') {
      // Vách đá và miệng hố xám bạc Mặt Trăng
      c.fillStyle = '#243048';
      c.beginPath();
      c.moveTo(0, gy);
      c.lineTo(0, 370);
      c.quadraticCurveTo(120, 340, 240, 365);
      c.quadraticCurveTo(400, 330, 560, 370);
      c.quadraticCurveTo(720, 335, W, 360);
      c.lineTo(W, gy);
      c.closePath();
      c.fill();
      c.strokeStyle = C.ink;
      c.lineWidth = 2.2;
      c.stroke();
    } else if (env === 'mars') {
      // Đồi đá đỏ uốn lượn
      c.fillStyle = '#8f3718';
      c.beginPath();
      c.moveTo(0, gy);
      c.lineTo(0, 360);
      c.quadraticCurveTo(180, 330, 360, 355);
      c.quadraticCurveTo(540, 320, 720, 350);
      c.lineTo(W, 340);
      c.lineTo(W, gy);
      c.closePath();
      c.fill();
      c.strokeStyle = C.ink;
      c.lineWidth = 2.2;
      c.stroke();
    } else if (env === 'asteroid') {
      // Đá tảng lởm chởm tím thẫm
      c.fillStyle = '#2f1e47';
      c.beginPath();
      c.moveTo(0, gy);
      c.lineTo(0, 365);
      c.lineTo(90, 350); c.lineTo(190, 368); c.lineTo(310, 345);
      c.lineTo(440, 370); c.lineTo(580, 342); c.lineTo(710, 365);
      c.lineTo(W, 350); c.lineTo(W, gy);
      c.closePath();
      c.fill();
      c.strokeStyle = C.ink;
      c.lineWidth = 2.2;
      c.stroke();
    } else {
      // 'spaceport': Nhà vòm quan sát và tháp phóng xa xa
      c.fillStyle = '#204169';
      c.beginPath();
      c.moveTo(0, gy);
      c.lineTo(0, 385);
      c.lineTo(120, 385);
      // Mái vòm tròn xa
      c.arc(170, 385, 45, Math.PI, 0);
      c.lineTo(320, 385);
      // Cấu trúc khung giàn tháp phóng
      c.lineTo(330, 340); c.lineTo(345, 340); c.lineTo(355, 385);
      c.lineTo(520, 385);
      c.arc(580, 385, 38, Math.PI, 0);
      c.lineTo(750, 385);
      c.lineTo(765, 330); c.lineTo(780, 330); c.lineTo(795, 385);
      c.lineTo(W, 385);
      c.lineTo(W, gy);
      c.closePath();
      c.fill();
      c.strokeStyle = C.ink;
      c.lineWidth = 2.4;
      c.stroke();
    }
    c.restore();

    // 1.5 Mặt đất đường băng (Runway Surface)
    c.save();
    // Nền dưới mặt đất
    var groundFill = (env === 'mars') ? '#9e3b18' : (env === 'moon') ? '#2e3a50' : (env === 'asteroid') ? '#2b1b3d' : '#334155';
    c.fillStyle = groundFill;
    c.fillRect(0, gy, W, H - gy);

    // Tấm thảm đường băng chính (bê tông polymer không gian phẳng mịn)
    var runwayH = 95;
    var runwayY = gy;
    c.fillStyle = (env === 'mars') ? '#542318' : '#475569';
    c.fillRect(0, runwayY, W, runwayH);

    // Gờ mép trên và mép dưới đường băng có dải phản quang
    c.fillStyle = C.gold;
    c.fillRect(0, runwayY, W, 5);
    c.fillStyle = C.accent;
    c.fillRect(0, runwayY + runwayH - 5, W, 5);

    // Đường viền chuẩn
    c.strokeStyle = C.ink;
    c.lineWidth = 2.6;
    c.beginPath();
    c.moveTo(0, runwayY);
    c.lineTo(W, runwayY);
    c.moveTo(0, runwayY + runwayH);
    c.lineTo(W, runwayY + runwayH);
    c.stroke();

    // Vạch kẻ tim đường băng cách quãng (khối chữ nhật bo góc lớn, KHÔNG chữ)
    c.fillStyle = C.paperWarm;
    for (var mx = 30; mx < W; mx += 110) {
      rr(c, mx, runwayY + 42, 60, 10, 3);
      c.fill();
      c.strokeStyle = C.ink;
      c.lineWidth = 1.8;
      c.stroke();
    }

    // Đèn tín hiệu đường băng nhúng phẳng (xanh lá và vàng nhấp nháy tuần tự)
    for (var lx = 20; lx < W; lx += 70) {
      var phase = (lx * 0.05 - t * 4);
      var lightOn = Math.sin(phase) > 0;
      c.beginPath();
      c.arc(lx, runwayY + 2, 4.5, 0, Math.PI * 2);
      c.fillStyle = lightOn ? C.ok : '#1b5e20';
      c.fill();
      c.strokeStyle = C.ink;
      c.lineWidth = 1.5;
      c.stroke();

      c.beginPath();
      c.arc(lx + 35, runwayY + runwayH - 2, 4.5, 0, Math.PI * 2);
      c.fillStyle = lightOn ? C.gold : '#b78103';
      c.fill();
      c.strokeStyle = C.ink;
      c.lineWidth = 1.5;
      c.stroke();
    }

    // Lớp đất đá vụn phía trước (dưới chân đường băng)
    c.fillStyle = (env === 'mars') ? '#3d160c' : '#1e293b';
    c.fillRect(0, runwayY + runwayH, W, H - (runwayY + runwayH));
    c.strokeStyle = C.ink;
    c.lineWidth = 2.4;
    c.beginPath();
    c.moveTo(0, runwayY + runwayH);
    c.lineTo(W, runwayY + runwayH);
    c.stroke();

    c.restore();

    // 1.6 Bão bụi / luồng gió vũ trụ nếu có storm > 0
    if (storm > 0) {
      c.save();
      var streakCol = (env === 'mars') ? 'rgba(217, 107, 67,' : 'rgba(223, 230, 236,';
      for (var k = 0; k < 14; k++) {
        var sx = ((k * 75 + t * 450) % (W + 200)) - 100;
        var sy = 80 + (k * 29) % (H - 120);
        var slen = 40 + (k % 4) * 25;
        c.strokeStyle = streakCol + (storm * 0.45).toFixed(2) + ')';
        c.lineWidth = 2.2 + (k % 3);
        c.beginPath();
        c.moveTo(sx, sy);
        c.lineTo(sx + slen, sy);
        c.stroke();
      }
      c.restore();
    }

    c.restore();
  }

  // =========================================================================
  // 2. RUNWAY_LIGHTS(c, gy, opts)
  // Dàn đèn cọc dẫn hướng đường băng sân bay vũ trụ phát sáng nhịp nhàng.
  // =========================================================================
  function runwayLights(c, gy, opts) {
    gy = typeof gy === 'number' ? gy : GY0;
    opts = opts || {};
    var t = typeof opts.t === 'number' ? opts.t : 0;
    var W = W0;

    c.save();
    for (var x = 40; x < W; x += 120) {
      var pulse = 0.5 + 0.5 * Math.sin(t * 3.5 + x * 0.04);
      // Chân cọc đèn
      c.strokeStyle = C.ink;
      c.lineWidth = 2.2;
      c.beginPath();
      c.moveTo(x, gy - 2);
      c.lineTo(x, gy - 16);
      c.stroke();

      // Bầu đèn
      c.beginPath();
      c.arc(x, gy - 18, 5, 0, Math.PI * 2);
      c.fillStyle = (pulse > 0.5) ? C.accentLight : C.accentDark;
      c.fill();
      c.strokeStyle = C.ink;
      c.lineWidth = 1.8;
      c.stroke();

      // Hào quang đèn nhấp nháy
      if (pulse > 0.6) {
        c.beginPath();
        c.arc(x, gy - 18, 10, 0, Math.PI * 2);
        c.fillStyle = 'rgba(61, 193, 220, 0.25)';
        c.fill();
      }
    }
    c.restore();
  }

  // =========================================================================
  // 3. CONTROL_TOWER(c, x, gy, opts)
  // Đài chỉ huy sân bay vũ trụ & chảo radar quay phát tín hiệu liên lạc.
  // =========================================================================
  function controlTower(c, x, gy, opts) {
    if (typeof x === 'object') { opts = x; x = 110; gy = GY0; }
    x = typeof x === 'number' ? x : 110;
    gy = typeof gy === 'number' ? gy : GY0;
    opts = opts || {};
    var t = typeof opts.t === 'number' ? opts.t : 0;

    c.save();
    c.translate(x, gy);

    // Móng tháp
    rr(c, -38, -14, 76, 14, [4, 4, 0, 0]);
    strokeFill(c, '#334155', C.ink, 2.6);

    // Thân tháp hình thang chịu lực
    c.beginPath();
    c.moveTo(-28, -14);
    c.lineTo(-20, -140);
    c.lineTo(20, -140);
    c.lineTo(28, -14);
    c.closePath();
    strokeFill(c, C.snow, C.ink, 2.6);

    // Các đường gân kỹ thuật sọc ngang trên thân tháp
    c.strokeStyle = C.ink;
    c.lineWidth = 2.0;
    for (var dy = -35; dy > -130; dy -= 25) {
      var wSpan = 21 + Math.abs(dy) * 0.05;
      c.beginPath();
      c.moveTo(-wSpan, dy);
      c.lineTo(wSpan, dy);
      c.stroke();
    }

    // Đài vòm quan sát toàn cảnh (kính đa giác nhìn ra đường băng)
    rr(c, -36, -165, 72, 26, 6);
    strokeFill(c, C.accentDark, C.ink, 2.6);

    // Kính buồng điều khiển phát sáng ấm áp
    rr(c, -30, -160, 60, 16, 4);
    strokeFill(c, C.accentLight, C.ink, 2.0);

    // Bóng dáng màn hình vi tính bên trong đài
    c.fillStyle = C.gold;
    c.fillRect(-18, -154, 8, 5);
    c.fillStyle = C.ok;
    c.fillRect(10, -154, 8, 5);

    // Tầng thượng & Cột ăng-ten
    rr(c, -22, -172, 44, 7, 3);
    strokeFill(c, C.snow, C.ink, 2.2);

    // Trục đỡ radar
    c.strokeStyle = C.ink;
    c.lineWidth = 3.0;
    c.beginPath();
    c.moveTo(0, -172);
    c.lineTo(0, -195);
    c.stroke();

    // Chảo radar xoay (mô phỏng 3D bằng hàm cos của t)
    c.save();
    c.translate(0, -195);
    var radarAngle = Math.cos(t * 1.8);
    var radarW = Math.max(8, Math.abs(radarAngle) * 32);

    // Vẽ chảo parabol
    c.beginPath();
    c.ellipse(0, 0, radarW, 16, 0, 0, Math.PI * 2);
    strokeFill(c, (radarAngle >= 0) ? C.snow : C.hole, C.ink, 2.4);

    // Kim thu tín hiệu trung tâm chảo
    c.strokeStyle = C.gold;
    c.lineWidth = 2.4;
    c.beginPath();
    c.moveTo(0, 0);
    c.lineTo(radarAngle * 16, -10);
    c.stroke();
    c.beginPath();
    c.arc(radarAngle * 16, -10, 3, 0, Math.PI * 2);
    c.fillStyle = C.warn;
    c.fill();
    c.restore();

    // Đèn tín hiệu chớp đỏ trên đỉnh tháp
    var strobe = Math.sin(t * 5) > 0;
    c.beginPath();
    c.arc(0, -215, 5, 0, Math.PI * 2);
    c.fillStyle = strobe ? C.warn : C.warnDark;
    c.fill();
    c.strokeStyle = C.ink;
    c.lineWidth = 1.8;
    c.stroke();

    c.restore();
  }

  // =========================================================================
  // 4. BARRIER(c, x, gy, opts)
  // Hàng rào an toàn / lưới hãm đệm khí giảm chấn ở cuối đường băng.
  // Phi thuyền thiếu tốc độ sẽ phanh gấp và dừng an toàn trước hàng rào này!
  // =========================================================================
  function barrier(c, x, gy, opts) {
    if (typeof x === 'object') { opts = x; x = 840; gy = GY0; }
    x = typeof x === 'number' ? x : 840;
    gy = typeof gy === 'number' ? gy : GY0;
    opts = opts || {};
    var hit = !!opts.hit; // phi thuyền chạm nhẹ vào rào
    var t = typeof opts.t === 'number' ? opts.t : 0;

    c.save();
    c.translate(x, gy);

    // Trụ neo thép hai bên
    rr(c, -16, -85, 14, 85, 3);
    strokeFill(c, '#475569', C.ink, 2.6);
    rr(c, 16, -85, 14, 85, 3);
    strokeFill(c, '#334155', C.ink, 2.6);

    // Khối đế cao su hấp thụ lực chấn
    rr(c, -24, -16, 62, 16, 4);
    strokeFill(c, '#1e293b', C.ink, 2.6);

    // Piston giảm chấn thủy lực
    c.strokeStyle = C.gold;
    c.lineWidth = 4;
    c.beginPath();
    c.moveTo(-9, -45);
    c.lineTo(-24, -45);
    c.stroke();
    rr(c, -30, -52, 12, 14, 3);
    strokeFill(c, '#64748b', C.ink, 2.0);

    // Thanh cản an toàn sọc vàng - đen (biểu tượng cảnh báo trực quan lớp 3, KHÔNG chữ)
    var barShift = hit ? 6 : 0;
    c.save();
    c.translate(barShift, 0);

    rr(c, -22, -72, 46, 22, 4);
    strokeFill(c, C.gold, C.ink, 2.6);

    // 4 vạch chéo sọc đen tiêu chuẩn cảnh báo an toàn
    c.save();
    rr(c, -22, -72, 46, 22, 4);
    c.clip();
    c.fillStyle = C.ink;
    for (var bx = -35; bx < 40; bx += 14) {
      c.beginPath();
      c.moveTo(bx, -50);
      c.lineTo(bx + 10, -50);
      c.lineTo(bx + 3, -74);
      c.lineTo(bx - 7, -74);
      c.closePath();
      c.fill();
    }
    c.restore();

    // Viền lại thanh cản
    rr(c, -22, -72, 46, 22, 4);
    c.strokeStyle = C.ink;
    c.lineWidth = 2.4;
    c.stroke();
    c.restore();

    // Đèn nháy cảnh báo đỏ trên đỉnh 2 trụ
    var warnBlink = Math.sin(t * 6) > 0;
    c.beginPath();
    c.arc(-9, -92, 5, 0, Math.PI * 2);
    c.arc(23, -92, 5, 0, Math.PI * 2);
    c.fillStyle = warnBlink ? C.warn : C.warnDark;
    c.fill();
    c.strokeStyle = C.ink;
    c.lineWidth = 1.8;
    c.stroke();

    c.restore();
  }

  // =========================================================================
  // 5. THRUST_FLAME(c, x, y, opts)
  // Luồng lửa phản lực tên lửa phụt ra từ đuôi phi thuyền theo 3 cấp tốc độ:
  // level 1: chậm (ngọn lửa nhỏ vàng ấm)
  // level 2: vừa (lửa cam xanh có hạt plasma)
  // level 3: nhanh (lửa xanh ngọc siêu thanh rực rỡ, sóng xung kích, tàn lửa bay)
  // =========================================================================
  function thrustFlame(c, x, y, opts) {
    opts = opts || {};
    var level = typeof opts.level === 'number' ? opts.level : 1;
    var t = typeof opts.t === 'number' ? opts.t : 0;
    var scale = typeof opts.scale === 'number' ? opts.scale : 1.0;

    if (level <= 0) return;

    c.save();
    c.translate(x, y);
    c.scale(scale, scale);

    // Dao động ngọn lửa tự nhiên bằng hàm sin theo t
    var flicker1 = Math.sin(t * 35) * 4;
    var flicker2 = Math.cos(t * 28) * 3;

    if (level === 1) {
      // CẤP 1 - CHẬM: Lửa nhỏ gọn, êm ái
      var len1 = 28 + flicker1;
      // Vỏ lửa ngoài màu cam
      c.beginPath();
      c.moveTo(0, -9);
      c.quadraticCurveTo(-len1 * 0.6, -7, -len1, 0);
      c.quadraticCurveTo(-len1 * 0.6, 7, 0, 9);
      c.closePath();
      strokeFill(c, C.orange, C.ink, 2.0);

      // Lõi lửa vàng sáng
      c.beginPath();
      c.moveTo(0, -5);
      c.quadraticCurveTo(-len1 * 0.4, -4, -len1 * 0.65, 0);
      c.quadraticCurveTo(-len1 * 0.4, 4, 0, 5);
      c.closePath();
      c.fillStyle = C.gold;
      c.fill();

    } else if (level === 2) {
      // CẤP 2 - VỪA: Lửa mạnh, 2 lớp màu cam - xanh ngọc
      var len2 = 52 + flicker1;
      // Vỏ ngoài màu cam rực
      c.beginPath();
      c.moveTo(0, -13);
      c.quadraticCurveTo(-len2 * 0.5, -11, -len2, 0);
      c.quadraticCurveTo(-len2 * 0.5, 11, 0, 13);
      c.closePath();
      strokeFill(c, C.orange, C.ink, 2.2);

      // Lõi giữa màu vàng
      c.beginPath();
      c.moveTo(0, -8);
      c.quadraticCurveTo(-len2 * 0.4, -6, -len2 * 0.75, 0);
      c.quadraticCurveTo(-len2 * 0.4, 6, 0, 8);
      c.closePath();
      c.fillStyle = C.gold;
      c.fill();

      // Tâm plasma màu xanh ngọc sáng
      c.beginPath();
      c.moveTo(0, -4);
      c.quadraticCurveTo(-len2 * 0.25, -3, -len2 * 0.4, 0);
      c.quadraticCurveTo(-len2 * 0.25, 3, 0, 4);
      c.closePath();
      c.fillStyle = C.accentLight;
      c.fill();

      // Hạt lửa văng nhỏ
      c.fillStyle = C.gold;
      c.beginPath();
      c.arc(-len2 - 6, flicker2, 2.5, 0, Math.PI * 2);
      c.arc(-len2 - 16, -flicker2, 2.0, 0, Math.PI * 2);
      c.fill();

    } else {
      // CẤP 3 - NHANH: Luồng phản lực siêu thanh cực mạnh, sóng kim cương xung kích
      var len3 = 85 + flicker1 * 1.5;

      // Hào quang tỏa sáng ngoài
      c.beginPath();
      c.ellipse(-len3 * 0.4, 0, len3 * 0.5, 18, 0, 0, Math.PI * 2);
      c.fillStyle = 'rgba(61, 193, 220, 0.25)';
      c.fill();

      // Vỏ lửa ngoài màu cam đậm
      c.beginPath();
      c.moveTo(0, -16);
      c.quadraticCurveTo(-len3 * 0.5, -14, -len3, 0);
      c.quadraticCurveTo(-len3 * 0.5, 14, 0, 16);
      c.closePath();
      strokeFill(c, C.orange, C.ink, 2.4);

      // Lớp lửa vàng óng
      c.beginPath();
      c.moveTo(0, -11);
      c.quadraticCurveTo(-len3 * 0.45, -9, -len3 * 0.8, 0);
      c.quadraticCurveTo(-len3 * 0.45, 9, 0, 11);
      c.closePath();
      c.fillStyle = C.gold;
      c.fill();

      // Lớp plasma xanh cyan cực mạnh
      c.beginPath();
      c.moveTo(0, -7);
      c.quadraticCurveTo(-len3 * 0.35, -5, -len3 * 0.6, 0);
      c.quadraticCurveTo(-len3 * 0.35, 5, 0, 7);
      c.closePath();
      c.fillStyle = C.accent;
      c.fill();

      // Lõi nóng trắng tinh khiết
      c.beginPath();
      c.moveTo(0, -3.5);
      c.quadraticCurveTo(-len3 * 0.2, -2.5, -len3 * 0.35, 0);
      c.quadraticCurveTo(-len3 * 0.2, 2.5, 0, 3.5);
      c.closePath();
      c.fillStyle = '#ffffff';
      c.fill();

      // 2 hạt "kim cương xung kích" (shock diamonds) siêu thanh
      c.fillStyle = '#ffffff';
      c.beginPath();
      c.ellipse(-24, 0, 5, 3.5, 0, 0, Math.PI * 2);
      c.ellipse(-48, 0, 4, 2.8, 0, 0, Math.PI * 2);
      c.fill();
      c.strokeStyle = C.ink;
      c.lineWidth = 1.2;
      c.stroke();

      // Đám tàn lửa bắn ra xa
      c.fillStyle = C.gold;
      c.beginPath();
      c.arc(-len3 - 10, flicker2 * 1.5, 3.2, 0, Math.PI * 2);
      c.arc(-len3 - 22, -flicker2, 2.5, 0, Math.PI * 2);
      c.arc(-len3 - 35, flicker1, 2.0, 0, Math.PI * 2);
      c.fill();
    }

    c.restore();
  }

  // =========================================================================
  // 6. SPACESHIP(c, x, gy, opts)
  // Phi thuyền không gian bánh lăn WeDo 2.0 (nhìn ngang).
  // Thân tàu khí động học, kính buồng lái phi hành gia, cánh chính, bánh xe quay,
  // 4 gói sáng tạo (canard, booster, radar, landingGear), các cấp tốc độ 0..3.
  // =========================================================================
  function spaceship(c, x, gy, opts) {
    if (typeof x === 'object') { opts = x; x = 320; gy = GY0; }
    x = typeof x === 'number' ? x : 320;
    gy = typeof gy === 'number' ? gy : GY0;
    opts = opts || {};

    var t = typeof opts.t === 'number' ? opts.t : 0;
    var speed = typeof opts.speed === 'number' ? opts.speed : 0; // 0, 1, 2, 3
    var pitch = typeof opts.pitch === 'number' ? opts.pitch : 0; // góc ngóc đầu cất cánh (rad)
    var flying = !!opts.flying;
    var altitude = typeof opts.altitude === 'number' ? opts.altitude : 0;
    var braking = !!opts.braking;
    var wheelAngle = typeof opts.wheelAngle === 'number' ? opts.wheelAngle : (t * speed * 7);

    // 4 gói sáng tạo
    var upg = opts.upgrades || {};
    var hasCanard = !!upg.canard;
    var hasBooster = !!upg.booster;
    var hasRadar = !!upg.radar;
    var hasLandingGear = !!upg.landingGear;

    c.save();

    // 6.1 Bóng đổ của phi thuyền lên đường băng
    c.save();
    var shadowY = gy + 2;
    var shadowW = 140 * Math.max(0.4, 1 - altitude / 300);
    var shadowAlpha = Math.max(0.08, 0.32 - altitude / 450);
    c.beginPath();
    c.ellipse(x + 10, shadowY, shadowW, 10, 0, 0, Math.PI * 2);
    c.fillStyle = 'rgba(30, 42, 52, ' + shadowAlpha.toFixed(2) + ')';
    c.fill();
    c.restore();

    // Di chuyển đến vị trí phi thuyền (bao gồm cả độ cao cất cánh nếu có)
    c.translate(x, gy - altitude);

    // Độ rung lắc thân tàu khi tăng tốc độ cao
    var shakeY = (speed === 3) ? Math.sin(t * 55) * 1.5 : (speed === 2) ? Math.sin(t * 35) * 0.8 : 0;
    c.translate(0, shakeY);

    // Xoay góc ngóc mũi tàu (khi cất cánh nghiêng lên trên)
    var effectivePitch = pitch;
    if (flying && pitch === 0) {
      effectivePitch = -0.22; // góc cất cánh tự nhiên ~ 13 độ
    }
    if (braking && pitch === 0) {
      effectivePitch = 0.05; // hơi chúi mũi khi phanh gấp
    }
    c.rotate(effectivePitch);

    // =========================================================================
    // 6.2 GÓI SÁNG TẠO 2: CỤM ĐỘNG CƠ TÊN LỬA ĐẨY PHỤ (BOOSTER) - NẰM PHÍA SAU
    // =========================================================================
    if (hasBooster) {
      c.save();
      // Bình nhiên liệu phản lực phụ gắn ở thân trên
      rr(c, -85, -58, 55, 16, 4);
      strokeFill(c, C.gold, C.ink, 2.4);

      // Vạch cảnh báo sọc cam thể thao
      c.fillStyle = C.orange;
      c.fillRect(-62, -56, 12, 12);

      // Miệng loa phụt phản lực phụ
      c.beginPath();
      c.moveTo(-85, -57);
      c.lineTo(-94, -61);
      c.lineTo(-94, -39);
      c.lineTo(-85, -43);
      c.closePath();
      strokeFill(c, '#334155', C.ink, 2.2);

      // Ngọn lửa phụ của booster khi tăng tốc
      if (speed > 0) {
        thrustFlame(c, -94, -50, { level: Math.min(speed, 2), t: t + 0.5, scale: 0.65 });
      }
      c.restore();
    }

    // =========================================================================
    // 6.3 CÁNH CHÍNH PHÍA XA (FAR WING - tạo chiều sâu không gian)
    // =========================================================================
    c.save();
    c.beginPath();
    c.moveTo(-35, -42);
    c.lineTo(-65, -75);
    c.lineTo(-20, -70);
    c.lineTo(15, -42);
    c.closePath();
    strokeFill(c, '#c8d6e5', C.ink, 2.4);

    // Cánh lướt gió đuôi xa (Vertical tail fin xa)
    c.beginPath();
    c.moveTo(-60, -42);
    c.lineTo(-78, -82);
    c.lineTo(-58, -82);
    c.lineTo(-42, -42);
    c.closePath();
    strokeFill(c, C.accentDark, C.ink, 2.4);
    c.restore();

    // =========================================================================
    // 6.4 LOA PHỤT ĐỘNG CƠ CHÍNH (MAIN ROCKET NOZZLE)
    // =========================================================================
    c.save();
    c.beginPath();
    c.moveTo(-78, -38);
    c.lineTo(-92, -44);
    c.lineTo(-92, -20);
    c.lineTo(-78, -26);
    c.closePath();
    strokeFill(c, '#334155', C.ink, 2.6);

    // Vành phát nhiệt bên trong miệng loa
    c.beginPath();
    c.ellipse(-92, -32, 3, 11, 0, 0, Math.PI * 2);
    strokeFill(c, (speed > 0) ? C.orange : '#1e293b', C.ink, 1.8);

    // Vẽ luồng lửa phản lực chính theo cấp tốc độ
    if (speed > 0) {
      thrustFlame(c, -94, -32, { level: speed, t: t, scale: 1.0 });
    }
    c.restore();

    // =========================================================================
    // 6.5 THÂN PHI THUYỀN CHÍNH (FUSELAGE)
    // =========================================================================
    c.save();
    // Khối thân hình thoi khí động học bo tròn
    c.beginPath();
    c.moveTo(85, -28); // Mũi phi thuyền
    c.quadraticCurveTo(55, -55, -20, -52); // Lưng trên
    c.lineTo(-78, -45); // Khớp đuôi trên
    c.lineTo(-78, -18); // Khớp đuôi dưới
    c.lineTo(-40, -18); // Gầm đuôi
    c.lineTo(45, -18);  // Gầm mũi
    c.quadraticCurveTo(72, -18, 85, -28); // Bo tròn mũi trước
    c.closePath();
    strokeFill(c, C.snow, C.ink, 2.8);

    // Dải sơn trang trí thể thao màu xanh ngọc (accent striping)
    c.beginPath();
    c.moveTo(60, -28);
    c.lineTo(-45, -28);
    c.lineTo(-55, -36);
    c.lineTo(35, -36);
    c.closePath();
    strokeFill(c, C.accent, C.ink, 2.0);

    // Mũi phi thuyền bọc hợp kim chịu nhiệt màu vàng cam
    c.beginPath();
    c.moveTo(85, -28);
    c.quadraticCurveTo(76, -37, 65, -37);
    c.lineTo(65, -22);
    c.quadraticCurveTo(76, -22, 85, -28);
    c.closePath();
    strokeFill(c, C.orange, C.ink, 2.2);

    // Mô-đun Smart Hub WeDo 2.0 gắn trên lưng thân tàu
    rr(c, -26, -56, 38, 12, 3);
    strokeFill(c, C.paperWarm, C.ink, 2.2);
    // Nút tròn trung tâm Smart Hub phát sáng xanh lá báo sẵn sàng
    c.beginPath();
    c.arc(-7, -50, 4, 0, Math.PI * 2);
    c.fillStyle = C.ok;
    c.fill();
    c.strokeStyle = C.ink;
    c.lineWidth = 1.4;
    c.stroke();

    // Khối động cơ M1 đặt dưới khung truyền động
    rr(c, -42, -26, 32, 14, 2);
    strokeFill(c, '#64748b', C.ink, 2.0);
    // Bánh răng trung gian truyền động
    c.beginPath();
    c.arc(-26, -19, 5, 0, Math.PI * 2);
    strokeFill(c, C.gold, C.ink, 1.6);

    c.restore();

    // =========================================================================
    // 6.6 BUỒNG LÁI TRONG SUỐT & PHI HÀNH GIA (COCKPIT & ASTRONAUT)
    // =========================================================================
    c.save();
    // Vòm kính buồng lái
    c.beginPath();
    c.moveTo(10, -48);
    c.quadraticCurveTo(36, -48, 52, -32);
    c.lineTo(12, -32);
    c.closePath();
    strokeFill(c, C.accentLight, C.ink, 2.4);

    // Phi hành gia bên trong (khối tròn mũ bảo hiểm phi hành gia lớp 3)
    c.beginPath();
    c.arc(26, -38, 7.5, 0, Math.PI * 2);
    strokeFill(c, C.paper, C.ink, 1.8);
    // Kính chắn gió mạ vàng trên mũ
    c.beginPath();
    c.arc(28, -38, 4.5, -0.8, 0.8);
    c.lineTo(28, -38);
    c.closePath();
    c.fillStyle = C.gold;
    c.fill();

    // Vệt sáng phản chiếu trên kính buồng lái
    c.strokeStyle = '#ffffff';
    c.lineWidth = 2.0;
    c.beginPath();
    c.arc(30, -42, 10, -2.4, -1.6);
    c.stroke();
    c.restore();

    // =========================================================================
    // 6.7 CÁNH CHÍNH GẦN (NEAR MAIN WING) & VÂY ĐUÔI GẦN
    // =========================================================================
    c.save();
    // Vây đuôi gần (Vertical Stabilizer)
    c.beginPath();
    c.moveTo(-50, -45);
    c.lineTo(-70, -78);
    c.lineTo(-50, -78);
    c.lineTo(-32, -45);
    c.closePath();
    strokeFill(c, C.accent, C.ink, 2.6);

    // Cánh chính dạng tam giác swept-wing lớn phía trước
    c.beginPath();
    c.moveTo(-25, -28);
    c.lineTo(-55, -6);
    c.lineTo(-15, -6);
    c.lineTo(24, -28);
    c.closePath();
    strokeFill(c, C.snow, C.ink, 2.8);

    // Đầu mút cánh (Winglet) màu cam thể thao
    c.beginPath();
    c.moveTo(-55, -6);
    c.lineTo(-50, 4);
    c.lineTo(-38, 4);
    c.lineTo(-44, -6);
    c.closePath();
    strokeFill(c, C.orange, C.ink, 2.0);
    c.restore();

    // =========================================================================
    // 6.8 GÓI SÁNG TẠO 1: CÁNH PHỤ THĂNG BẰNG PHÍA MŨI (CANARD WINGS)
    // =========================================================================
    if (hasCanard) {
      c.save();
      c.beginPath();
      c.moveTo(52, -26);
      c.lineTo(38, -12);
      c.lineTo(58, -12);
      c.lineTo(66, -26);
      c.closePath();
      strokeFill(c, C.gold, C.ink, 2.4);

      // Khớp xoay cánh phụ
      c.beginPath();
      c.arc(52, -22, 3, 0, Math.PI * 2);
      strokeFill(c, '#334155', C.ink, 1.6);
      c.restore();
    }

    // =========================================================================
    // 6.9 GÓI SÁNG TẠO 3: CHẢO ĂNG-TEN RADAR THÁM HIỂM (RADAR DISH)
    // =========================================================================
    if (hasRadar) {
      c.save();
      c.translate(5, -57);
      // Trụ đỡ radar mini
      c.strokeStyle = C.ink;
      c.lineWidth = 2.4;
      c.beginPath();
      c.moveTo(0, 0);
      c.lineTo(0, -9);
      c.stroke();

      // Chảo xoay theo t
      var dishRot = Math.sin(t * 2.2);
      c.beginPath();
      c.ellipse(0, -9, Math.max(4, Math.abs(dishRot) * 12), 7, 0.2, 0, Math.PI * 2);
      strokeFill(c, C.accentLight, C.ink, 2.0);

      // Đỉnh phát tín hiệu radar
      c.beginPath();
      c.arc(dishRot * 4, -13, 2.5, 0, Math.PI * 2);
      c.fillStyle = C.gold;
      c.fill();
      c.restore();
    }

    // =========================================================================
    // 6.10 HỆ THỐNG BÁNH XE & BỘ GIẢM CHẤN (WHEELS & LANDING GEAR)
    // =========================================================================
    c.save();
    var rearWheelR = 21;
    var frontWheelR = 15;
    var rearWheelX = -32;
    var rearWheelY = 0;
    var frontWheelX = 54;
    var frontWheelY = 0;

    // GÓI SÁNG TẠO 4: CHÂN ĐÁP GIẢM CHẤN MỞ RỘNG (LANDING GEAR UPGRADE)
    if (hasLandingGear) {
      c.save();
      // Trục xi lanh thủy lực giảm chấn bọc quanh càng bánh xe
      c.strokeStyle = C.gold;
      c.lineWidth = 5.0;
      c.beginPath();
      c.moveTo(rearWheelX, -18);
      c.lineTo(rearWheelX - 4, rearWheelY - rearWheelR + 4);
      c.moveTo(frontWheelX, -18);
      c.lineTo(frontWheelX + 2, frontWheelY - frontWheelR + 4);
      c.stroke();

      // Lò xo xoắn giảm chấn màu cam
      c.strokeStyle = C.orange;
      c.lineWidth = 3.2;
      for (var sp = -14; sp < -4; sp += 4) {
        c.beginPath();
        c.arc(rearWheelX - 2, sp, 5, -0.6, 0.6);
        c.stroke();
      }

      // Tấm guốc đệm bảo vệ bánh chống lún bề mặt hành tinh
      rr(c, rearWheelX - 26, rearWheelY - 2, 14, 5, 2);
      strokeFill(c, '#334155', C.ink, 1.8);
      c.restore();
    } else {
      // Càng đỡ bánh xe cơ bản tiêu chuẩn WeDo
      c.strokeStyle = C.ink;
      c.lineWidth = 3.5;
      c.beginPath();
      c.moveTo(rearWheelX, -18);
      c.lineTo(rearWheelX, rearWheelY);
      c.moveTo(frontWheelX, -18);
      c.lineTo(frontWheelX, frontWheelY);
      c.stroke();
    }

    // BÁNH SAU TO (BÁNH CHỦ ĐỘNG DẪN ĐỘNG CƠ HỌC)
    c.save();
    c.translate(rearWheelX, rearWheelY);
    // Lốp cao su dày có gai bám đường
    c.beginPath();
    c.arc(0, 0, rearWheelR, 0, Math.PI * 2);
    strokeFill(c, '#1e293b', C.ink, 2.6);

    // Mâm lazang màu vàng
    c.beginPath();
    c.arc(0, 0, rearWheelR - 6, 0, Math.PI * 2);
    strokeFill(c, C.gold, C.ink, 2.0);

    // Nan hoa quay tròn sinh động theo wheelAngle
    c.save();
    c.rotate(wheelAngle);
    c.strokeStyle = C.ink;
    c.lineWidth = 2.2;
    for (var a = 0; a < Math.PI * 2; a += Math.PI / 3) {
      c.beginPath();
      c.moveTo(0, 0);
      c.lineTo(Math.cos(a) * (rearWheelR - 7), Math.sin(a) * (rearWheelR - 7));
      c.stroke();
    }
    // Trục trung tâm
    c.beginPath();
    c.arc(0, 0, 4, 0, Math.PI * 2);
    c.fillStyle = C.orange;
    c.fill();
    c.restore();
    c.restore();

    // BÁNH TRƯỚC NHỎ (BÁNH LÁI MŨI)
    c.save();
    c.translate(frontWheelX, frontWheelY);
    c.beginPath();
    c.arc(0, 0, frontWheelR, 0, Math.PI * 2);
    strokeFill(c, '#1e293b', C.ink, 2.4);

    c.beginPath();
    c.arc(0, 0, frontWheelR - 5, 0, Math.PI * 2);
    strokeFill(c, C.accent, C.ink, 1.8);

    c.save();
    c.rotate(wheelAngle * 1.3);
    c.strokeStyle = C.ink;
    c.lineWidth = 2.0;
    for (var fa = 0; fa < Math.PI * 2; fa += Math.PI / 2) {
      c.beginPath();
      c.moveTo(0, 0);
      c.lineTo(Math.cos(fa) * (frontWheelR - 6), Math.sin(fa) * (frontWheelR - 6));
      c.stroke();
    }
    c.beginPath();
    c.arc(0, 0, 3, 0, Math.PI * 2);
    c.fillStyle = C.gold;
    c.fill();
    c.restore();
    c.restore();

    c.restore();

    // =========================================================================
    // 6.11 HIỆU ỨNG PHANH GẤP (NẾU ĐANG BRAKING)
    // =========================================================================
    if (braking) {
      brakeEffect(c, 0, 0, { t: t });
    }

    c.restore();
  }

  // =========================================================================
  // 7. BRAKE_EFFECT(c, x, gy, opts)
  // Hiệu ứng phanh gấp: vệt lốp trượt trên đường băng, khói lốp xám cuộn tròn,
  // tia ma sát tóe lửa khi phi thuyền hãm tốc độ trước hàng rào.
  // =========================================================================
  function brakeEffect(c, x, gy, opts) {
    opts = opts || {};
    var t = typeof opts.t === 'number' ? opts.t : 0;

    c.save();
    c.translate(x, gy);

    // Vệt lốp trượt màu đen xám trên mặt đường băng
    c.strokeStyle = 'rgba(30, 42, 52, 0.75)';
    c.lineWidth = 4.5;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(-75, 0);
    c.lineTo(-30, 0);
    c.moveTo(15, 0);
    c.lineTo(55, 0);
    c.stroke();

    // Các cụm khói trắng xám cuộn tròn quanh bánh xe
    c.fillStyle = 'rgba(223, 230, 236, 0.85)';
    for (var i = 0; i < 6; i++) {
      var kx = -45 - i * 9 + Math.sin(t * 10 + i) * 3;
      var ky = -4 - (i * 3) - Math.abs(Math.sin(t * 12 + i)) * 6;
      var kr = 6 + i * 2.2;
      c.beginPath();
      c.arc(kx, ky, kr, 0, Math.PI * 2);
      c.fill();
      c.strokeStyle = C.ink;
      c.lineWidth = 1.4;
      c.stroke();
    }

    // Tia ma sát tóe vàng đỏ
    c.fillStyle = C.gold;
    for (var j = 0; j < 5; j++) {
      var jx = -32 - j * 8 + Math.cos(t * 20 + j) * 4;
      var jy = -2 - (j % 3) * 3;
      c.beginPath();
      c.arc(jx, jy, 2.2, 0, Math.PI * 2);
      c.fill();
    }

    c.restore();
  }

  // =========================================================================
  // 8. TAKEOFF_EFFECT(c, x, y, opts)
  // Hiệu ứng cất cánh quỹ đạo thành công:
  // Vòng sóng âm sonic mở rộng, tia gió lướt siêu thanh và ngôi sao vàng lấp lánh.
  // =========================================================================
  function takeoffEffect(c, x, y, opts) {
    opts = opts || {};
    var t = typeof opts.t === 'number' ? opts.t : 0;

    c.save();
    c.translate(x, y);

    // Vòng sóng âm mở rộng (Sonic expansion ring)
    for (var rIdx = 0; rIdx < 3; rIdx++) {
      var progress = ((t * 2.5 + rIdx * 0.33) % 1.0);
      var ringW = 20 + progress * 70;
      var ringH = 12 + progress * 40;
      var ringAlpha = (1.0 - progress) * 0.7;

      c.save();
      c.beginPath();
      c.ellipse(-20 - progress * 40, 0, ringW, ringH, 0.25, 0, Math.PI * 2);
      c.strokeStyle = 'rgba(61, 193, 220, ' + ringAlpha.toFixed(2) + ')';
      c.lineWidth = 3.0;
      c.stroke();
      c.restore();
    }

    // Tia gió siêu tốc bay ngang (Wind streaks)
    c.strokeStyle = 'rgba(255, 255, 255, 0.75)';
    c.lineWidth = 2.4;
    c.lineCap = 'round';
    for (var w = 0; w < 5; w++) {
      var wx = -60 - w * 25 - Math.sin(t * 15 + w) * 15;
      var wy = -25 + w * 12;
      var wLen = 30 + (w % 3) * 20;
      c.beginPath();
      c.moveTo(wx, wy);
      c.lineTo(wx - wLen, wy + 4);
      c.stroke();
    }

    // Các ngôi sao vàng 4 cánh lấp lánh tung bay (Star burst)
    var starPos = [
      { x: -50, y: -45, s: 8 },
      { x: -85, y: -20, s: 6 },
      { x: -70, y: 25, s: 7 },
      { x: -110, y: 5, s: 5 }
    ];
    for (var s = 0; s < starPos.length; s++) {
      var sp = starPos[s];
      c.save();
      c.translate(sp.x, sp.y);
      c.rotate(t * 3 + s);
      c.fillStyle = C.gold;
      c.beginPath();
      c.moveTo(0, -sp.s);
      c.lineTo(sp.s * 0.3, -sp.s * 0.3);
      c.lineTo(sp.s, 0);
      c.lineTo(sp.s * 0.3, sp.s * 0.3);
      c.lineTo(0, sp.s);
      c.lineTo(-sp.s * 0.3, sp.s * 0.3);
      c.lineTo(-sp.s, 0);
      c.lineTo(-sp.s * 0.3, -sp.s * 0.3);
      c.closePath();
      c.fill();
      c.restore();
    }

    c.restore();
  }

  // =========================================================================
  // 9. NOTE_B(c, x, y, opts)
  // Các nốt nhạc bay lên báo hiệu "Giai điệu B" (Melody B) trong bài lập trình.
  // Sinh động, màu vàng óng, viền đậm C.ink, không dùng chữ.
  // =========================================================================
  function noteB(c, x, y, opts) {
    if (typeof x === 'object') { opts = x; x = 450; y = 260; }
    x = typeof x === 'number' ? x : 450;
    y = typeof y === 'number' ? y : 260;
    opts = opts || {};
    var t = typeof opts.t === 'number' ? opts.t : 0;

    c.save();
    c.translate(x, y);

    // 3 nốt nhạc bay lên so le nhau
    var notes = [
      { dx: -28, dy: -24, scale: 1.0, phase: 0 },
      { dx: 18, dy: -48, scale: 1.25, phase: 1.2 },
      { dx: -10, dy: -72, scale: 0.9, phase: 2.4 }
    ];

    for (var i = 0; i < notes.length; i++) {
      var n = notes[i];
      var floatY = Math.sin(t * 3.5 + n.phase) * 8;
      var floatX = Math.cos(t * 2.5 + n.phase) * 6;

      c.save();
      c.translate(n.dx + floatX, n.dy + floatY);
      c.scale(n.scale, n.scale);

      if (i === 1) {
        // Nốt móc kép đôi (Beamed pair of sixteenth notes)
        c.fillStyle = C.gold;
        c.beginPath();
        c.ellipse(-10, 0, 5, 3.5, -0.3, 0, Math.PI * 2);
        c.ellipse(10, -2, 5, 3.5, -0.3, 0, Math.PI * 2);
        c.fill();
        c.strokeStyle = C.ink;
        c.lineWidth = 1.8;
        c.stroke();

        // Cột cờ và thanh nối đôi
        c.beginPath();
        c.moveTo(-6, 0); c.lineTo(-6, -20);
        c.moveTo(14, -2); c.lineTo(14, -22);
        c.stroke();
        c.lineWidth = 3.2;
        c.beginPath();
        c.moveTo(-6, -20); c.lineTo(14, -22);
        c.moveTo(-6, -14); c.lineTo(14, -16);
        c.stroke();
      } else {
        // Nốt đơn có đuôi móc (Eighth note)
        c.fillStyle = (i === 0) ? C.gold : C.accentLight;
        c.beginPath();
        c.ellipse(0, 0, 5.5, 4, -0.3, 0, Math.PI * 2);
        c.fill();
        c.strokeStyle = C.ink;
        c.lineWidth = 1.8;
        c.stroke();

        // Thân cờ & móc cờ cong vui nhộn
        c.beginPath();
        c.moveTo(4.5, 0);
        c.lineTo(4.5, -20);
        c.quadraticCurveTo(12, -18, 14, -10);
        c.stroke();
      }

      // Hạt lấp lánh vàng nhỏ quanh nốt nhạc
      c.fillStyle = C.gold;
      c.beginPath();
      c.arc(8, -25, 2.0, 0, Math.PI * 2);
      c.arc(-8, -12, 1.5, 0, Math.PI * 2);
      c.fill();

      c.restore();
    }

    c.restore();
  }

  // =========================================================================
  // 10. UPGRADE(c, type, x, y, opts)
  // Vẽ độc lập từng gói sáng tạo M4 để hiển thị trong khay nâng cấp hoặc UI:
  // 'canard' (cánh phụ thăng bằng)
  // 'booster' (cụm động cơ tên lửa đẩy)
  // 'radar' (ăng-ten radar liên lạc)
  // 'landingGear' (chân đáp giảm chấn)
  // =========================================================================
  function upgrade(c, type, x, y, opts) {
    if (typeof x === 'object') { opts = x; x = 0; y = 0; }
    x = typeof x === 'number' ? x : 0;
    y = typeof y === 'number' ? y : 0;
    opts = opts || {};
    var size = typeof opts.size === 'number' ? opts.size : 50;

    c.save();
    c.translate(x, y);

    // Khay đế hình huy hiệu công nghệ (Tech badge)
    var half = size;
    rr(c, -half, -half, half * 2, half * 2, 12);
    strokeFill(c, '#f8fafc', C.ink, 2.4);

    if (type === 'canard') {
      // Cánh phụ thăng bằng (Canard wing)
      c.beginPath();
      c.moveTo(half * 0.5, -half * 0.25);
      c.lineTo(-half * 0.45, -half * 0.45);
      c.lineTo(-half * 0.15, half * 0.45);
      c.lineTo(half * 0.55, half * 0.2);
      c.closePath();
      strokeFill(c, C.gold, C.ink, 2.4);

      // Khớp xoay kim loại
      c.beginPath();
      c.arc(0, 0, 6, 0, Math.PI * 2);
      strokeFill(c, '#334155', C.ink, 2.0);

    } else if (type === 'booster') {
      // Cụm động cơ tên lửa đẩy phụ (Booster thruster)
      rr(c, -half * 0.55, -half * 0.35, half * 1.1, half * 0.7, 5);
      strokeFill(c, C.orange, C.ink, 2.4);

      // Vạch trang trí vàng
      c.fillStyle = C.gold;
      c.fillRect(-half * 0.15, -half * 0.3, half * 0.3, half * 0.6);

      // Loa phụt đuôi
      c.beginPath();
      c.moveTo(-half * 0.55, -half * 0.25);
      c.lineTo(-half * 0.8, -half * 0.35);
      c.lineTo(-half * 0.8, half * 0.35);
      c.lineTo(-half * 0.55, half * 0.25);
      c.closePath();
      strokeFill(c, '#1e293b', C.ink, 2.0);

      // Tia lửa nhỏ ở miệng loa
      c.beginPath();
      c.arc(-half * 0.85, 0, 4, 0, Math.PI * 2);
      c.fillStyle = C.gold;
      c.fill();

    } else if (type === 'radar') {
      // Ăng-ten chảo radar (Radar dish)
      c.strokeStyle = C.ink;
      c.lineWidth = 3.0;
      c.beginPath();
      c.moveTo(0, half * 0.5);
      c.lineTo(0, 0);
      c.stroke();

      // Vòm chảo parabol
      c.beginPath();
      c.ellipse(0, -half * 0.1, half * 0.65, half * 0.35, 0, 0, Math.PI * 2);
      strokeFill(c, C.accentLight, C.ink, 2.4);

      // Kim thu sóng
      c.strokeStyle = C.gold;
      c.lineWidth = 2.4;
      c.beginPath();
      c.moveTo(0, -half * 0.1);
      c.lineTo(half * 0.3, -half * 0.45);
      c.stroke();
      c.beginPath();
      c.arc(half * 0.3, -half * 0.45, 3.5, 0, Math.PI * 2);
      c.fillStyle = C.warn;
      c.fill();

    } else if (type === 'landingGear') {
      // Chân đáp giảm chấn thủy lực (Shock absorber landing gear)
      // Xi lanh thẳng đứng
      rr(c, -8, -half * 0.5, 16, half * 0.65, 3);
      strokeFill(c, '#64748b', C.ink, 2.2);

      // Lò xo xoắn màu vàng
      c.strokeStyle = C.gold;
      c.lineWidth = 3.5;
      for (var ySp = -half * 0.35; ySp < half * 0.1; ySp += 7) {
        c.beginPath();
        c.arc(0, ySp, 7, -0.7, 0.7);
        c.stroke();
      }

      // Guốc đệm bàn chân cao su giảm chấn
      rr(c, -half * 0.55, half * 0.25, half * 1.1, 10, 3);
      strokeFill(c, '#1e293b', C.ink, 2.4);
    }

    c.restore();
  }

  // =========================================================================
  // XUẤT GIAO DIỆN window.Lop3Bai13Art
  // =========================================================================
  var Lop3Bai13Art = {
    W: W0,
    H: H0,
    GROUND_Y: GY0,
    LINE: LINE,
    C: C,

    // Các hàm vẽ chính
    background: background,
    runwayLights: runwayLights,
    controlTower: controlTower,
    barrier: barrier,
    thrustFlame: thrustFlame,
    spaceship: spaceship,
    brakeEffect: brakeEffect,
    takeoffEffect: takeoffEffect,
    noteB: noteB,
    upgrade: upgrade,

    // Các alias bổ sung thuận tiện
    craft: spaceship,
    shuttle: spaceship,
    drawBackground: background,
    drawRunwayLights: runwayLights,
    drawControlTower: controlTower,
    drawBarrier: barrier,
    drawThrustFlame: thrustFlame,
    drawSpaceship: spaceship,
    drawCraft: spaceship,
    drawBrakeEffect: brakeEffect,
    drawTakeoffEffect: takeoffEffect,
    drawNoteB: noteB,
    drawUpgrade: upgrade
  };

  if (typeof window !== 'undefined') {
    window.Lop3Bai13Art = Lop3Bai13Art;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Lop3Bai13Art;
  }
})();
