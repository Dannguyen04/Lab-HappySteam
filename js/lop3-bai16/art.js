// Thư viện vẽ cảnh Lớp 3 · Bài 16: "Xe tên lửa" (window.Lop3Bai16Art).
// Khung nhìn chuẩn: 900x560, mặt đất GY = 430.
// Theo đúng quy chuẩn ZMArt, craft.md: khối to, viền đậm C.ink, nét LINE = 2.6, không chữ trong hình, không vũ khí.
// Xe chở tên lửa nghiên cứu vũ trụ tự hành từ nhà xưởng ra bệ phóng của sân bay vũ trụ.
// Tương thích trình duyệt máy tính bảng: IIFE độc lập, chỉ dùng mã màu hex/rgba, không dùng Math.random() khi vẽ.
(function () {
  'use strict';

  var W0 = 900;
  var H0 = 560;
  var GY0 = 430;
  var LINE = 2.6;

  // Bảng màu chuẩn thống nhất hệ thống ZMArt & Sân bay vũ trụ
  var C = {
    ink: '#1e2a34',
    inkSoft: '#455a64',
    paper: '#ffffff',
    paperWarm: '#fff9ee',
    hole: '#dfe6ec',
    sky: '#def0fc',
    skyTop: '#1b3b6f',
    road: '#576574',
    roadDark: '#374151',
    roadLight: '#718096',
    grass: '#6db843',
    grassDark: '#3c6328',
    sand: '#f2d398',
    sandDark: '#c89d54',
    water: '#29b6f6',
    waterDeep: '#0277bd',
    accent: '#3dc1dc',
    accentDark: '#0e6f8a',
    accentLight: '#8ee6f5',
    warn: '#e53935',
    warnDark: '#b71c1c',
    ok: '#43a047',
    okLight: '#a5d6a7',
    gold: '#ffd23f',
    orange: '#ff8a3d',
    wood: '#8d6e63',
    rock: '#64748b',
    steel: '#64748b',
    steelDark: '#334155',
    steelLight: '#cbd5e1',
    hazardYellow: '#fbc02d',
    smoke: '#eceff1',
    solarBlue: '#0d2b45',
    solarCell: '#195382',
    ledOn: '#38ef7d',
    ledOff: '#263238'
  };

  // Ưu tiên nạp từ window.ZMArt nếu đã có
  if (typeof window !== 'undefined' && window.ZMArt && window.ZMArt.C) {
    var zmc = window.ZMArt.C;
    for (var k in zmc) {
      if (Object.prototype.hasOwnProperty.call(zmc, k)) {
        C[k] = zmc[k];
      }
    }
    LINE = window.ZMArt.LINE || LINE;
  }

  // Tọa độ cự ly bệ phóng chuẩn
  var DISTANCE_MARKS = {
    near: 470,
    mid: 610,
    far: 750
  };

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

  // Dữ liệu đỉnh núi hậu cảnh cố định (không dùng Math.random)
  var MOUNTAINS_FAR = [
    { x: -50, y: 360 }, { x: 70, y: 280 }, { x: 190, y: 350 },
    { x: 280, y: 270 }, { x: 390, y: 340 }, { x: 490, y: 260 },
    { x: 590, y: 330 }, { x: 710, y: 250 }, { x: 830, y: 340 },
    { x: 950, y: 270 }
  ];

  var MOUNTAINS_NEAR = [
    { x: -40, y: 380 }, { x: 120, y: 320 }, { x: 240, y: 380 },
    { x: 350, y: 310 }, { x: 460, y: 375 }, { x: 580, y: 300 },
    { x: 690, y: 370 }, { x: 800, y: 315 }, { x: 940, y: 380 }
  ];

  // Mẫu ma trận LED 5x5 chuẩn cho Smart Hub BE-5158
  var LED_PATTERNS = {
    happy: [
      [0, 1, 0, 1, 0],
      [0, 1, 0, 1, 0],
      [0, 0, 0, 0, 0],
      [1, 0, 0, 0, 1],
      [0, 1, 1, 1, 0]
    ],
    sad: [
      [0, 1, 0, 1, 0],
      [0, 1, 0, 1, 0],
      [0, 0, 0, 0, 0],
      [0, 1, 1, 1, 0],
      [1, 0, 0, 0, 1]
    ],
    arrow: [
      [0, 0, 1, 0, 0],
      [0, 0, 0, 1, 0],
      [1, 1, 1, 1, 1],
      [0, 0, 0, 1, 0],
      [0, 0, 1, 0, 0]
    ],
    idle: [
      [0, 0, 0, 0, 0],
      [0, 1, 0, 1, 0],
      [0, 0, 1, 0, 0],
      [0, 1, 0, 1, 0],
      [0, 0, 0, 0, 0]
    ],
    check: [
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 1],
      [0, 0, 0, 1, 0],
      [1, 0, 1, 0, 0],
      [0, 1, 0, 0, 0]
    ]
  };

  // =========================================================================
  // 1. BACKGROUND: Cảnh nền bầu trời sân bay vũ trụ & mặt đất đường băng
  // =========================================================================
  function background(c, opts) {
    opts = opts || {};
    var W = opts.W || W0;
    var H = opts.H || H0;
    var gy = opts.gy || GY0;
    var t = typeof opts.t === 'number' ? opts.t : 0;
    var theme = opts.theme || 'day'; // 'day' | 'dusk' | 'launch'

    c.save();

    // --- BẦU TRỜI SÂN BAY VŨ TRỤ ---
    var skyGrad = c.createLinearGradient(0, 0, 0, gy);
    if (theme === 'dusk') {
      skyGrad.addColorStop(0, '#1a1f3c');
      skyGrad.addColorStop(0.45, '#3b2f63');
      skyGrad.addColorStop(0.75, '#b04b56');
      skyGrad.addColorStop(1, '#f39c59');
    } else if (theme === 'launch') {
      skyGrad.addColorStop(0, '#0c1a30');
      skyGrad.addColorStop(0.55, '#1e3c72');
      skyGrad.addColorStop(1, '#689fcc');
    } else {
      skyGrad.addColorStop(0, '#1b3b6f');
      skyGrad.addColorStop(0.42, '#3a7bd5');
      skyGrad.addColorStop(0.78, '#8ec5fc');
      skyGrad.addColorStop(1, '#e0f2fe');
    }
    c.fillStyle = skyGrad;
    c.fillRect(0, 0, W, H);

    // Mây tầng cao trôi nhẹ theo t
    var cloudAlpha = theme === 'dusk' ? 0.45 : 0.65;
    c.save();
    c.fillStyle = theme === 'dusk' ? 'rgba(255, 210, 190, ' + cloudAlpha + ')' : 'rgba(255, 255, 255, ' + cloudAlpha + ')';
    var cx1 = ((t * 8 + 80) % (W + 200)) - 100;
    var cx2 = ((t * 5 + 460) % (W + 240)) - 120;
    var cx3 = ((t * 11 + 720) % (W + 220)) - 110;

    // Cụm mây 1
    c.beginPath();
    c.arc(cx1, 90, 26, 0, Math.PI * 2);
    c.arc(cx1 + 28, 80, 34, 0, Math.PI * 2);
    c.arc(cx1 + 60, 92, 22, 0, Math.PI * 2);
    c.fill();

    // Cụm mây 2
    c.beginPath();
    c.arc(cx2, 130, 20, 0, Math.PI * 2);
    c.arc(cx2 + 25, 122, 28, 0, Math.PI * 2);
    c.arc(cx2 + 52, 132, 18, 0, Math.PI * 2);
    c.fill();

    // Cụm mây 3
    c.beginPath();
    c.arc(cx3, 65, 18, 0, Math.PI * 2);
    c.arc(cx3 + 22, 58, 25, 0, Math.PI * 2);
    c.arc(cx3 + 45, 66, 16, 0, Math.PI * 2);
    c.fill();
    c.restore();

    // --- DÃY NÚI XA & ĐỒI CHÂN TRỜI ---
    // Núi xa tầng 1
    c.beginPath();
    c.moveTo(0, gy);
    for (var mi = 0; mi < MOUNTAINS_FAR.length; mi++) {
      c.lineTo(MOUNTAINS_FAR[mi].x, MOUNTAINS_FAR[mi].y);
    }
    c.lineTo(W, gy);
    c.closePath();
    c.fillStyle = theme === 'dusk' ? '#4a3b5a' : '#8fa8c6';
    c.fill();

    // Núi gần tầng 2
    c.beginPath();
    c.moveTo(0, gy);
    for (var ni = 0; ni < MOUNTAINS_NEAR.length; ni++) {
      c.lineTo(MOUNTAINS_NEAR[ni].x, MOUNTAINS_NEAR[ni].y);
    }
    c.lineTo(W, gy);
    c.closePath();
    c.fillStyle = theme === 'dusk' ? '#322b48' : '#728dae';
    c.fill();

    // --- THÁP QUAN SÁT & ĐÀI KHÔNG LƯU KHÔNG GIAN Ở HẬU CẢNH ---
    var twX = 350;
    var twY = gy - 120;
    // Thân tháp kiểm soát
    rr(c, twX - 12, twY, 24, 120, 3);
    strokeFill(c, '#64748b', C.ink, 1.8);
    // Đài cabin kính vòm tròn
    rr(c, twX - 22, twY - 22, 44, 24, 6);
    strokeFill(c, C.steelLight, C.ink, 2.0);
    // Vành kính quan sát
    rr(c, twX - 18, twY - 18, 36, 12, 3);
    c.fillStyle = C.accentLight;
    c.fill();
    // Ăng-ten chóp tháp với đèn cảnh báo chớp nháy
    c.strokeStyle = C.ink;
    c.lineWidth = 2.0;
    c.beginPath();
    c.moveTo(twX, twY - 22);
    c.lineTo(twX, twY - 45);
    c.stroke();
    // Đèn beacon đỉnh tháp nhấp nháy theo t
    var beaconGlow = Math.sin(t * 5) > 0;
    c.beginPath();
    c.arc(twX, twY - 46, beaconGlow ? 4.5 : 2.5, 0, Math.PI * 2);
    c.fillStyle = beaconGlow ? C.warn : '#7f1d1d';
    c.fill();
    if (beaconGlow) {
      c.strokeStyle = 'rgba(229, 57, 53, 0.4)';
      c.lineWidth = 3;
      c.stroke();
    }

    // Chảo radar viễn thám nhỏ ở hậu cảnh (quay chậm)
    var radX = 405;
    var radY = gy - 40;
    c.beginPath();
    c.moveTo(radX, gy);
    c.lineTo(radX, radY);
    c.strokeStyle = C.ink;
    c.lineWidth = 2.0;
    c.stroke();
    c.save();
    c.translate(radX, radY);
    c.rotate(Math.sin(t * 0.8) * 0.25 - 0.4);
    c.beginPath();
    c.arc(0, 0, 16, Math.PI * 0.65, Math.PI * 1.55);
    strokeFill(c, C.paper, C.ink, 2.0);
    c.restore();

    // --- MẶT ĐẤT BÊ TÔNG SÂN BAY VŨ TRỤ (TARMAC & RUNWAY) ---
    // Nền bê tông chịu lực
    var groundGrad = c.createLinearGradient(0, gy, 0, H);
    groundGrad.addColorStop(0, '#576574');
    groundGrad.addColorStop(0.3, '#475569');
    groundGrad.addColorStop(1, '#1e293b');
    c.fillStyle = groundGrad;
    c.fillRect(0, gy, W, H - gy);

    // Đường viền mép đất với bầu trời
    c.strokeStyle = C.ink;
    c.lineWidth = LINE;
    c.beginPath();
    c.moveTo(0, gy);
    c.lineTo(W, gy);
    c.stroke();

    // Các mối nối tấm bê tông (joint lines)
    c.strokeStyle = 'rgba(30, 42, 52, 0.55)';
    c.lineWidth = 1.8;
    for (var sx = 60; sx < W; sx += 80) {
      c.beginPath();
      c.moveTo(sx, gy);
      c.lineTo(sx - 35, H);
      c.stroke();
    }
    // Đường ngang phân cách
    c.beginPath();
    c.moveTo(0, gy + 52);
    c.lineTo(W, gy + 52);
    c.stroke();

    // Dải sơn phản quang sọc vàng đen cảnh báo an toàn phía chân đường băng (không chữ)
    var stripeW = 20;
    c.save();
    c.beginPath();
    c.rect(0, H - 24, W, 24);
    c.clip();
    c.fillStyle = C.hazardYellow;
    c.fillRect(0, H - 24, W, 24);
    c.fillStyle = C.ink;
    for (var st = -40; st < W + 40; st += stripeW * 2) {
      c.beginPath();
      c.moveTo(st, H);
      c.lineTo(st + stripeW, H);
      c.lineTo(st + stripeW + 18, H - 24);
      c.lineTo(st + 18, H - 24);
      c.closePath();
      c.fill();
    }
    c.restore();

    // Đèn âm sàn dẫn hướng đường lăn (Runway embedded lights) nhấp nháy xanh ngọc
    for (var lx = 140; lx < W - 20; lx += 90) {
      var lPulse = (Math.sin(t * 3 + lx * 0.05) + 1) * 0.5;
      c.beginPath();
      c.arc(lx, gy + 26, 4.5, 0, Math.PI * 2);
      c.fillStyle = lPulse > 0.4 ? C.accentLight : C.steelDark;
      c.fill();
      c.strokeStyle = C.ink;
      c.lineWidth = 1.4;
      c.stroke();
      if (lPulse > 0.4) {
        c.beginPath();
        c.arc(lx, gy + 26, 8, 0, Math.PI * 2);
        c.strokeStyle = 'rgba(61, 193, 220, 0.35)';
        c.lineWidth = 2.0;
        c.stroke();
      }
    }

    c.restore();
  }

  // =========================================================================
  // 2. HANGAR: Nhà xưởng lắp ráp tên lửa (Assembly Building) bên trái
  // =========================================================================
  function hangar(c, x, gy, opts) {
    if (typeof x === 'object') { opts = x; x = 0; gy = GY0; }
    x = typeof x === 'number' ? x : 0;
    gy = typeof gy === 'number' ? gy : GY0;
    opts = opts || {};
    var doorOpen = typeof opts.doorOpen === 'number' ? Math.max(0, Math.min(1, opts.doorOpen)) : 1.0;
    var lightOn = opts.lightOn !== false;
    var t = typeof opts.t === 'number' ? opts.t : 0;

    var hW = 160;
    var hH = 260;
    var doorW = 110;
    var doorH = 190;

    c.save();
    c.translate(x, gy);

    // Bóng đổ của xưởng xuống mặt đất
    c.beginPath();
    c.ellipse(hW * 0.5, 6, hW * 0.6, 12, 0, 0, Math.PI * 2);
    c.fillStyle = 'rgba(30, 42, 52, 0.35)';
    c.fill();

    // Thân nhà xưởng công nghiệp (bo góc mái vòm công nghệ cao)
    rr(c, 0, -hH, hW, hH, [16, 28, 0, 0]);
    strokeFill(c, '#334155', C.ink, LINE);

    // Mái vòm dốc thoát nước chịu lực phía trên
    c.beginPath();
    c.moveTo(-6, -hH + 20);
    c.lineTo(hW * 0.4, -hH - 14);
    c.lineTo(hW + 6, -hH + 20);
    c.lineTo(hW, -hH + 34);
    c.lineTo(0, -hH + 34);
    c.closePath();
    strokeFill(c, '#475569', C.ink, LINE);

    // Các sườn gia cố kim loại bên ngoài thân xưởng (truss ribs)
    c.strokeStyle = '#1e293b';
    c.lineWidth = 2.2;
    for (var ry = -hH + 50; ry < -doorH - 10; ry += 30) {
      c.beginPath();
      c.moveTo(10, ry);
      c.lineTo(hW - 10, ry);
      c.stroke();
    }

    // Đèn hải đăng an toàn trên nóc xưởng
    c.beginPath();
    c.arc(hW * 0.4, -hH - 18, 5, 0, Math.PI * 2);
    var hBeacon = Math.sin(t * 4) > 0;
    strokeFill(c, hBeacon ? C.gold : '#78350f', C.ink, 1.8);

    // Cổng vòm nhà xưởng (Hangar Bay Opening)
    var doorX = 25;
    var doorY = -doorH;
    rr(c, doorX, doorY, doorW, doorH, [12, 12, 0, 0]);
    strokeFill(c, '#0f172a', C.ink, LINE);

    // Ánh sáng bên trong xưởng rọi ra nếu lightOn
    if (lightOn) {
      c.save();
      // Vùng sáng bên trong cổng
      rr(c, doorX + 4, doorY + 4, doorW - 8, doorH - 4, [8, 8, 0, 0]);
      var inGrad = c.createLinearGradient(doorX, doorY, doorX + doorW, 0);
      inGrad.addColorStop(0, '#fef3c7');
      inGrad.addColorStop(0.7, '#fde68a');
      inGrad.addColorStop(1, '#f59e0b');
      c.fillStyle = inGrad;
      c.fill();

      // Giàn cẩu trục màu vàng bên trong xưởng (Gantry Crane silhouette)
      c.strokeStyle = C.ink;
      c.lineWidth = 3.0;
      c.beginPath();
      c.moveTo(doorX + 10, doorY + 40);
      c.lineTo(doorX + doorW - 10, doorY + 40);
      c.stroke();
      // Móc cẩu
      rr(c, doorX + 45, doorY + 36, 18, 12, 2);
      strokeFill(c, C.hazardYellow, C.ink, 1.6);
      c.beginPath();
      c.moveTo(doorX + 54, doorY + 48);
      c.lineTo(doorX + 54, doorY + 68);
      c.stroke();
      // Móc tròn
      c.beginPath();
      c.arc(doorX + 54, doorY + 74, 5, 0, Math.PI);
      c.stroke();

      // Thang bảo trì bên hông trong xưởng
      c.strokeStyle = 'rgba(30, 42, 52, 0.45)';
      c.lineWidth = 1.8;
      for (var ly = doorY + 70; ly < -10; ly += 14) {
        c.beginPath();
        c.moveTo(doorX + 10, ly);
        c.lineTo(doorX + 24, ly);
        c.stroke();
      }

      // Vệt sáng vàng ấm rọi ra mặt đất ngoài cửa xưởng
      var lightSpill = c.createLinearGradient(doorX, 0, doorX + doorW + 80, 0);
      lightSpill.addColorStop(0, 'rgba(253, 230, 138, 0.55)');
      lightSpill.addColorStop(0.4, 'rgba(253, 230, 138, 0.25)');
      lightSpill.addColorStop(1, 'rgba(253, 230, 138, 0)');
      c.beginPath();
      c.moveTo(doorX + 6, 0);
      c.lineTo(doorX + doorW + 80, 38);
      c.lineTo(doorX + doorW + 40, 52);
      c.lineTo(doorX - 10, 24);
      c.closePath();
      c.fillStyle = lightSpill;
      c.fill();
      c.restore();
    }

    // Cửa cuốn xếp trượt (Roll-up door) hạ xuống theo doorOpen (1 = mở hết, 0 = đóng kín)
    var rollH = doorH * (1 - doorOpen);
    if (rollH > 2) {
      rr(c, doorX, doorY, doorW, rollH, [10, 10, 0, 0]);
      strokeFill(c, '#475569', C.ink, LINE);
      // Các nếp gấp cửa cuốn
      c.strokeStyle = C.ink;
      c.lineWidth = 1.5;
      for (var sy = doorY + 12; sy < doorY + rollH; sy += 12) {
        c.beginPath();
        c.moveTo(doorX + 4, sy);
        c.lineTo(doorX + doorW - 4, sy);
        c.stroke();
      }
    }

    // Biển ký hiệu kỹ thuật hình học phía trên cửa (vạch sọc vàng đen, KHÔNG chữ)
    var signW = doorW - 20;
    var signH = 14;
    rr(c, doorX + 10, doorY - 24, signW, signH, 3);
    strokeFill(c, C.hazardYellow, C.ink, 1.8);
    c.save();
    c.beginPath();
    rr(c, doorX + 10, doorY - 24, signW, signH, 3);
    c.clip();
    c.fillStyle = C.ink;
    for (var kx = doorX - 10; kx < doorX + signW + 20; kx += 16) {
      c.beginPath();
      c.moveTo(kx, doorY - 10);
      c.lineTo(kx + 8, doorY - 10);
      c.lineTo(kx + 16, doorY - 24);
      c.lineTo(kx + 8, doorY - 24);
      c.closePath();
      c.fill();
    }
    c.restore();

    // Hai đường ray chịu tải cho xe chở tên lửa lăn từ xưởng ra sân bay
    c.fillStyle = '#64748b';
    c.fillRect(doorX + 16, 2, doorW + 60, 4);
    c.fillRect(doorX + 16, 12, doorW + 60, 4);
    c.strokeStyle = C.ink;
    c.lineWidth = 1.4;
    c.strokeRect(doorX + 16, 2, doorW + 60, 4);
    c.strokeRect(doorX + 16, 12, doorW + 60, 4);

    c.restore();
  }

  // =========================================================================
  // 3. DISTANCE TRACK: Đường lăn & các mốc vạch cự ly Gần / Vừa / Xa
  // =========================================================================
  function distanceTrack(c, startX, endX, gy, opts) {
    if (typeof startX === 'object') { opts = startX; startX = 140; endX = 860; gy = GY0; }
    startX = typeof startX === 'number' ? startX : 140;
    endX = typeof endX === 'number' ? endX : 860;
    gy = typeof gy === 'number' ? gy : GY0;
    opts = opts || {};
    var activeZone = opts.activeZone || null; // 'near' | 'mid' | 'far' | null
    var targetDistance = opts.targetDistance || null;
    var t = typeof opts.t === 'number' ? opts.t : 0;

    c.save();

    // Hai dải ray lăn thép công nghiệp trên mặt đường
    var railY1 = gy + 6;
    var railY2 = gy + 22;

    // Tà-vẹt thép chịu tải ngang
    c.strokeStyle = '#334155';
    c.lineWidth = 3.2;
    for (var rx = startX; rx <= endX; rx += 28) {
      c.beginPath();
      c.moveTo(rx, railY1 - 2);
      c.lineTo(rx - 6, railY2 + 5);
      c.stroke();
    }

    // Hai thanh ray kim loại sáng bóng
    c.beginPath();
    c.moveTo(startX, railY1);
    c.lineTo(endX, railY1);
    c.moveTo(startX, railY2);
    c.lineTo(endX, railY2);
    c.strokeStyle = '#94a3b8';
    c.lineWidth = 4.0;
    c.stroke();
    c.strokeStyle = C.ink;
    c.lineWidth = 1.4;
    c.stroke();

    // 3 MỐC CỰ LY CHUẨN: Gần (Near = 470), Vừa (Mid = 610), Xa (Far = 750)
    var zones = [
      { key: 'near', x: DISTANCE_MARKS.near, count: 1 },
      { key: 'mid', x: DISTANCE_MARKS.mid, count: 2 },
      { key: 'far', x: DISTANCE_MARKS.far, count: 3 }
    ];

    for (var zi = 0; zi < zones.length; zi++) {
      var z = zones[zi];
      var isAct = (activeZone === z.key) || (targetDistance === z.key) || (targetDistance === z.x);

      c.save();
      c.translate(z.x, gy);

      // Ô định vị trên mặt đất (Vùng dừng đỗ an toàn)
      var boxW = 80;
      var boxH = 34;
      rr(c, -boxW / 2, 2, boxW, boxH, 4);
      if (isAct) {
        c.fillStyle = 'rgba(61, 193, 220, 0.28)';
        c.fill();
        c.strokeStyle = C.accent;
        c.lineWidth = 2.8;
        c.stroke();
      } else {
        c.fillStyle = 'rgba(255, 255, 255, 0.08)';
        c.fill();
        c.strokeStyle = 'rgba(255, 255, 255, 0.35)';
        c.lineWidth = 1.8;
        c.stroke();
      }

      // Vạch sơn góc L bốn cạnh ô định vị
      var cw = 10;
      c.strokeStyle = isAct ? C.gold : '#cbd5e1';
      c.lineWidth = 2.5;
      // Góc trên trái & phải
      c.beginPath();
      c.moveTo(-boxW / 2 + cw, 5);
      c.lineTo(-boxW / 2 + 2, 5);
      c.lineTo(-boxW / 2 + 2, 5 + cw);
      c.moveTo(boxW / 2 - cw, 5);
      c.lineTo(boxW / 2 - 2, 5);
      c.lineTo(boxW / 2 - 2, 5 + cw);
      // Góc dưới trái & phải
      c.moveTo(-boxW / 2 + cw, boxH);
      c.lineTo(-boxW / 2 + 2, boxH);
      c.lineTo(-boxW / 2 + 2, boxH - cw);
      c.moveTo(boxW / 2 - cw, boxH);
      c.lineTo(boxW / 2 - 2, boxH);
      c.lineTo(boxW / 2 - 2, boxH - cw);
      c.stroke();

      // CỌC TIÊU CỰ LY (Distance Marker Bollard) - KHÔNG CHỮ, dùng số khuyên tròn sáng
      var bolH = 46;
      // Trụ cọc tiêu
      rr(c, -8, -bolH, 16, bolH, 3);
      strokeFill(c, isAct ? C.gold : '#64748b', C.ink, 2.0);

      // Đầu cọc tiêu có đèn tín hiệu
      c.beginPath();
      c.arc(0, -bolH - 4, 7, 0, Math.PI * 2);
      var lampCol = isAct ? C.ok : (activeZone ? C.warn : C.accentLight);
      strokeFill(c, lampCol, C.ink, 1.8);

      // Hiển thị số khuyên tròn tượng trưng cự ly (1 khuyên = Gần, 2 khuyên = Vừa, 3 khuyên = Xa)
      for (var ki = 0; ki < z.count; ki++) {
        var ky = -bolH + 10 + ki * 11;
        c.beginPath();
        c.arc(0, ky, 3.5, 0, Math.PI * 2);
        c.fillStyle = isAct ? C.ink : '#ffffff';
        c.fill();
        c.strokeStyle = C.ink;
        c.lineWidth = 1.0;
        c.stroke();
      }

      // Vòng hào quang nếu đang là mục tiêu tích cực (Pulse effect)
      if (isAct) {
        var pulse = (Math.sin(t * 6) + 1) * 0.5;
        c.beginPath();
        c.arc(0, -bolH - 4, 11 + pulse * 4, 0, Math.PI * 2);
        c.strokeStyle = 'rgba(67, 160, 71, ' + (0.7 - pulse * 0.3) + ')';
        c.lineWidth = 2.0;
        c.stroke();
      }

      c.restore();
    }

    c.restore();
  }

  // =========================================================================
  // 4. LAUNCH PAD: Bệ phóng & tháp giàn phóng (Gantry Tower) sân bay vũ trụ
  // =========================================================================
  function launchPad(c, x, gy, opts) {
    if (typeof x === 'object') { opts = x; x = DISTANCE_MARKS.mid; gy = GY0; }
    x = typeof x === 'number' ? x : DISTANCE_MARKS.mid;
    gy = typeof gy === 'number' ? gy : GY0;
    opts = opts || {};
    var ready = !!opts.ready;
    var targetGlow = !!opts.targetGlow;
    var t = typeof opts.t === 'number' ? opts.t : 0;

    var towerW = 42;
    var towerH = 290;
    var towerX = x + 44; // Tháp nằm lệch bên phải của vị trí tên lửa đứng phóng

    c.save();

    // --- MÂM BỆ PHÓNG CHỊU NHIỆT (LAUNCH TABLE & FLAME TRENCH) ---
    // Khối đế bệ phóng bê tông dập nổi
    rr(c, x - 54, gy - 16, 108, 22, 4);
    strokeFill(c, '#334155', C.ink, LINE);

    // Máng dẫn lửa phản lực (Flame Trench) bên dưới
    rr(c, x - 34, gy + 6, 68, 24, 2);
    strokeFill(c, '#0f172a', C.ink, 2.0);
    // Vỉ kim loại chịu nhiệt trong máng
    c.strokeStyle = '#475569';
    c.lineWidth = 2.0;
    for (var fx = x - 28; fx <= x + 28; fx += 10) {
      c.beginPath();
      c.moveTo(fx, gy + 8);
      c.lineTo(fx, gy + 28);
      c.stroke();
    }

    // Đèn viền nhấp nháy báo sẵn sàng của bệ phóng
    if (targetGlow) {
      var glowPulse = (Math.sin(t * 6) + 1) * 0.5;
      c.save();
      rr(c, x - 58, gy - 20, 116, 30, 6);
      c.strokeStyle = 'rgba(61, 193, 220, ' + (0.5 + glowPulse * 0.5) + ')';
      c.lineWidth = 3.5;
      c.stroke();
      c.restore();
    }

    // --- THÁP GIÀN PHÓNG THÉP (LAUNCH GANTRY SERVICE TOWER) ---
    // Tháp kết cấu thép đỏ - trắng đặc trưng hàng không vũ trụ
    var towerY = gy - towerH;
    rr(c, towerX, towerY, towerW, towerH, [4, 4, 0, 0]);
    strokeFill(c, '#e2e8f0', C.ink, LINE);

    // Các dầm chéo chữ X gia cố kết cấu tháp giàn giáo (Truss lattice)
    var segH = 34;
    c.strokeStyle = C.warn;
    c.lineWidth = 2.6;
    for (var sy = towerY; sy < gy - 20; sy += segH) {
      // Sọc đỏ cảnh báo an toàn hàng không
      c.fillStyle = (Math.floor((sy - towerY) / segH) % 2 === 0) ? C.warn : '#ffffff';
      c.fillRect(towerX + 2, sy, towerW - 4, segH);
      c.strokeRect(towerX + 2, sy, towerW - 4, segH);

      // Chữ X dầm thép
      c.strokeStyle = C.ink;
      c.lineWidth = 1.8;
      c.beginPath();
      c.moveTo(towerX + 2, sy);
      c.lineTo(towerX + towerW - 2, sy + segH);
      c.moveTo(towerX + towerW - 2, sy);
      c.lineTo(towerX + 2, sy + segH);
      c.stroke();
    }

    // Cần cẩu / Cánh tay tiếp cận (Swing arm / Umbilical arm) vươn sang giữ tên lửa
    var armY1 = gy - 180;
    var armY2 = gy - 240;

    // Cánh tay tiếp nhiên liệu dưới
    c.save();
    c.strokeStyle = C.steelDark;
    c.lineWidth = 5.0;
    c.beginPath();
    c.moveTo(towerX, armY1);
    c.lineTo(x + 12, armY1);
    c.stroke();
    c.strokeStyle = C.ink;
    c.lineWidth = 1.6;
    c.stroke();
    // Đầu kẹp an toàn
    rr(c, x + 8, armY1 - 6, 8, 12, 2);
    strokeFill(c, C.gold, C.ink, 1.6);

    // Cánh tay tiếp cận trên
    c.strokeStyle = C.steelDark;
    c.lineWidth = 4.0;
    c.beginPath();
    c.moveTo(towerX, armY2);
    c.lineTo(x + 10, armY2);
    c.stroke();
    c.strokeStyle = C.ink;
    c.lineWidth = 1.4;
    c.stroke();
    rr(c, x + 6, armY2 - 5, 8, 10, 2);
    strokeFill(c, C.gold, C.ink, 1.4);
    c.restore();

    // Kim thu lôi & Cột ăng-ten đỉnh tháp
    c.strokeStyle = C.ink;
    c.lineWidth = 2.4;
    c.beginPath();
    c.moveTo(towerX + towerW * 0.5, towerY);
    c.lineTo(towerX + towerW * 0.5, towerY - 26);
    c.stroke();

    // Đèn chớp cảnh báo hàng không đỉnh tháp (Strobe beacon)
    var bPulse = Math.sin(t * 7) > 0;
    c.beginPath();
    c.arc(towerX + towerW * 0.5, towerY - 28, 5, 0, Math.PI * 2);
    c.fillStyle = bPulse ? '#ffffff' : C.warn;
    c.fill();
    c.strokeStyle = C.ink;
    c.lineWidth = 1.8;
    c.stroke();

    // Đèn trạng thái bệ phóng (Ready: Xanh ngọc; Waiting: Vàng)
    var stLightY = gy - 70;
    rr(c, towerX - 10, stLightY, 10, 22, 2);
    strokeFill(c, C.ink, C.ink, 1.5);
    c.beginPath();
    c.arc(towerX - 5, stLightY + 6, 3.5, 0, Math.PI * 2);
    c.fillStyle = ready ? C.ok : '#2e7d32';
    c.fill();
    c.beginPath();
    c.arc(towerX - 5, stLightY + 16, 3.5, 0, Math.PI * 2);
    c.fillStyle = ready ? '#c67d00' : C.gold;
    c.fill();

    c.restore();
  }

  // =========================================================================
  // 5. LED MATRIX: Màn hình ma trận 5x5 của Smart Hub BE-5158
  // =========================================================================
  function ledMatrix(c, x, y, opts) {
    if (typeof x === 'object') { opts = x; x = 0; y = 0; }
    x = typeof x === 'number' ? x : 0;
    y = typeof y === 'number' ? y : 0;
    opts = opts || {};
    var expr = opts.expression || 'happy'; // 'happy' | 'sad' | 'arrow' | 'idle' | 'check'
    var size = typeof opts.size === 'number' ? opts.size : 28; // kích thước tổng
    var glow = opts.glow !== false;
    var t = typeof opts.t === 'number' ? opts.t : 0;

    var pat = Array.isArray(opts.matrix) ? opts.matrix : (LED_PATTERNS[expr] || LED_PATTERNS.happy);

    c.save();
    c.translate(x, y);

    // Khung viền đen bảo vệ màn hình
    var pad = size * 0.12;
    var totalW = size + pad * 2;
    rr(c, -totalW / 2, -totalW / 2, totalW, totalW, 4);
    strokeFill(c, '#111827', C.ink, 1.8);

    // Kích thước từng hạt LED
    var ledSize = size / 5;
    var dotR = ledSize * 0.36;

    // Màu hạt LED phát sáng: nếu 'happy'/'check' xanh lá tươi; 'sad' đỏ cam; 'arrow'/'idle' xanh ngọc
    var onColor = C.ledOn;
    if (expr === 'sad') {
      onColor = C.warn;
    } else if (expr === 'arrow' || expr === 'idle') {
      onColor = C.accentLight;
    }

    for (var r = 0; r < 5; r++) {
      for (var col = 0; col < 5; col++) {
        var isOn = !!pat[r][col];
        var dx = -size / 2 + col * ledSize + ledSize / 2;
        var dy = -size / 2 + r * ledSize + ledSize / 2;

        c.beginPath();
        c.arc(dx, dy, dotR, 0, Math.PI * 2);
        if (isOn) {
          c.fillStyle = onColor;
          c.fill();
          if (glow) {
            c.beginPath();
            c.arc(dx, dy, dotR * 1.5, 0, Math.PI * 2);
            c.fillStyle = (expr === 'sad') ? 'rgba(229, 57, 53, 0.3)' : 'rgba(56, 239, 125, 0.3)';
            c.fill();
          }
        } else {
          c.fillStyle = '#1e293b';
          c.fill();
        }
      }
    }

    c.restore();
  }

  // =========================================================================
  // 6. ROCKET: Tên lửa vũ trụ nghiên cứu khoa học (Scientific Space Rocket)
  // =========================================================================
  function rocket(c, x, y, opts) {
    if (typeof x === 'object') { opts = x; x = 0; y = 0; }
    x = typeof x === 'number' ? x : 0;
    y = typeof y === 'number' ? y : 0;
    opts = opts || {};
    var angle = typeof opts.angle === 'number' ? opts.angle : 0; // góc nghiêng radian (0 = thẳng đứng)
    var flame = typeof opts.flame === 'number' ? opts.flame : (opts.flame ? 1.0 : 0);
    var t = typeof opts.t === 'number' ? opts.t : 0;

    var rW = 28;  // bề rộng thân tên lửa
    var rH = 135; // chiều cao tên lửa

    c.save();
    c.translate(x, y);
    c.rotate(angle);

    // --- LUỒNG LỬA PHẢN LỰC (ROCKET THRUST PLUME) KHI PHÓNG ---
    if (flame > 0.05) {
      c.save();
      var fLen = (70 + Math.sin(t * 30) * 12) * flame;
      var fW = rW * 0.9 * flame;

      // Luồng khói lửa lớp ngoài (Đỏ cam)
      c.beginPath();
      c.moveTo(-fW * 0.5, rH * 0.5);
      c.quadraticCurveTo(-fW * 0.8, rH * 0.5 + fLen * 0.5, 0, rH * 0.5 + fLen);
      c.quadraticCurveTo(fW * 0.8, rH * 0.5 + fLen * 0.5, fW * 0.5, rH * 0.5);
      c.closePath();
      var outGrad = c.createLinearGradient(0, rH * 0.5, 0, rH * 0.5 + fLen);
      outGrad.addColorStop(0, '#ff9800');
      outGrad.addColorStop(0.6, '#f4511e');
      outGrad.addColorStop(1, 'rgba(216, 27, 96, 0)');
      c.fillStyle = outGrad;
      c.fill();

      // Lớp lửa giữa (Vàng rực)
      c.beginPath();
      c.moveTo(-fW * 0.35, rH * 0.5);
      c.quadraticCurveTo(-fW * 0.45, rH * 0.5 + fLen * 0.35, 0, rH * 0.5 + fLen * 0.75);
      c.quadraticCurveTo(fW * 0.45, rH * 0.5 + fLen * 0.35, fW * 0.35, rH * 0.5);
      c.closePath();
      var midGrad = c.createLinearGradient(0, rH * 0.5, 0, rH * 0.5 + fLen * 0.75);
      midGrad.addColorStop(0, '#fff59d');
      midGrad.addColorStop(0.5, '#ffb74d');
      midGrad.addColorStop(1, 'rgba(255, 152, 0, 0)');
      c.fillStyle = midGrad;
      c.fill();

      // Lõi lửa trong cùng (Trắng sáng nhiệt độ cao)
      c.beginPath();
      c.moveTo(-fW * 0.2, rH * 0.5);
      c.quadraticCurveTo(-fW * 0.2, rH * 0.5 + fLen * 0.2, 0, rH * 0.5 + fLen * 0.4);
      c.quadraticCurveTo(fW * 0.2, rH * 0.5 + fLen * 0.2, fW * 0.2, rH * 0.5);
      c.closePath();
      c.fillStyle = '#ffffff';
      c.fill();

      // Hạt lửa phát tán (Sparks)
      c.fillStyle = C.gold;
      for (var sp = 0; sp < 6; sp++) {
        var spOff = ((t * 40 + sp * 17) % 50);
        var spX = Math.sin(t * 15 + sp) * (fW * 0.6);
        c.beginPath();
        c.arc(spX, rH * 0.5 + fLen * 0.3 + spOff, 2.2, 0, Math.PI * 2);
        c.fill();
      }
      c.restore();
    }

    // --- CÁNH ĐỊNH HƯỚNG ĐUÔI TÊN LỬA (AERODYNAMIC FINS) ---
    // Cánh trái
    c.beginPath();
    c.moveTo(-rW * 0.5, rH * 0.5 - 34);
    c.lineTo(-rW * 0.5 - 18, rH * 0.5 - 4);
    c.lineTo(-rW * 0.5 - 18, rH * 0.5 + 4);
    c.lineTo(-rW * 0.5, rH * 0.5);
    c.closePath();
    strokeFill(c, C.orange, C.ink, 2.2);

    // Cánh phải
    c.beginPath();
    c.moveTo(rW * 0.5, rH * 0.5 - 34);
    c.lineTo(rW * 0.5 + 18, rH * 0.5 - 4);
    c.lineTo(rW * 0.5 + 18, rH * 0.5 + 4);
    c.lineTo(rW * 0.5, rH * 0.5);
    c.closePath();
    strokeFill(c, C.orange, C.ink, 2.2);

    // Cánh sống lưng chính giữa
    rr(c, -3, rH * 0.5 - 30, 6, 32, 2);
    strokeFill(c, C.warnDark, C.ink, 1.8);

    // --- LOA PHỤT TÊN LỬA (ROCKET ENGINE NOZZLE) ---
    c.beginPath();
    c.moveTo(-rW * 0.36, rH * 0.5);
    c.lineTo(-rW * 0.46, rH * 0.5 + 10);
    c.lineTo(rW * 0.46, rH * 0.5 + 10);
    c.lineTo(rW * 0.36, rH * 0.5);
    c.closePath();
    strokeFill(c, '#1e293b', C.ink, 2.0);

    // --- THÂN TÊN LỬA CHÍNH (CYLINDRICAL MULTI-STAGE HULL) ---
    // Tầng đẩy 1 & 2
    rr(c, -rW * 0.5, -rH * 0.28, rW, rH * 0.78, [4, 4, 3, 3]);
    strokeFill(c, C.paperWarm, C.ink, LINE);

    // Đai nối các tầng kỹ thuật (Inter-stage rings) màu xanh ngọc công nghệ
    rr(c, -rW * 0.5, -rH * 0.1, rW, 10, 1);
    strokeFill(c, C.accent, C.ink, 1.8);
    rr(c, -rW * 0.5, rH * 0.24, rW, 10, 1);
    strokeFill(c, C.accentDark, C.ink, 1.8);

    // Cửa sổ quan sát vệ tinh dạng tròn (Sensor Port / Observation Dome)
    c.beginPath();
    c.arc(0, -rH * 0.18, 5.5, 0, Math.PI * 2);
    strokeFill(c, C.accentLight, C.ink, 2.0);
    c.beginPath();
    c.arc(1.5, -rH * 0.18 - 1.5, 1.8, 0, Math.PI * 2);
    c.fillStyle = '#ffffff';
    c.fill();

    // --- MŨI NÓN TÊN LỬA KHÍ ĐỘNG HỌC (NOSECONE) ---
    c.beginPath();
    c.moveTo(-rW * 0.5, -rH * 0.28);
    c.quadraticCurveTo(-rW * 0.45, -rH * 0.48, 0, -rH * 0.56);
    c.quadraticCurveTo(rW * 0.45, -rH * 0.48, rW * 0.5, -rH * 0.28);
    c.closePath();
    strokeFill(c, C.orange, C.ink, LINE);

    // Chóp nhọn mềm an toàn trên cùng
    c.beginPath();
    c.arc(0, -rH * 0.56, 3, 0, Math.PI * 2);
    strokeFill(c, C.gold, C.ink, 1.8);

    // Vạch trang trí dọc thân tên lửa
    c.strokeStyle = 'rgba(30, 42, 52, 0.25)';
    c.lineWidth = 1.4;
    c.beginPath();
    c.moveTo(-rW * 0.22, -rH * 0.26);
    c.lineTo(-rW * 0.22, rH * 0.46);
    c.stroke();

    c.restore();
  }

  // =========================================================================
  // 7. ROBOT / TRANSPORTER: Xe chở tên lửa vũ trụ tự hành STEAM (4 bánh)
  // =========================================================================
  function robot(c, x, gy, opts) {
    if (typeof x === 'object') { opts = x; x = 320; gy = GY0; }
    x = typeof x === 'number' ? x : 320;
    gy = typeof gy === 'number' ? gy : GY0;
    opts = opts || {};
    var wheelAngle = typeof opts.wheelAngle === 'number' ? opts.wheelAngle : 0;
    var tilt = typeof opts.tilt === 'number' ? Math.max(0, Math.min(1, opts.tilt)) : 0; // 0 = nằm ngang, 1 = dựng đứng 90 deg
    var ledExpr = opts.led || 'happy'; // 'happy' | 'sad' | 'arrow' | 'idle'
    var hasRocket = opts.hasRocket !== false;
    var launched = !!opts.launched;
    var t = typeof opts.t === 'number' ? opts.t : 0;

    // 4 Gói sáng tạo (Upgrades)
    var upg = opts.upgrades || {};
    var solarPanel = !!upg.solarPanel;
    var antenna = !!upg.antenna;
    var dualHeadlights = !!upg.dualHeadlights;
    var frontShield = !!upg.frontShield;

    var wheelRBack = 24;  // bánh sau to dẫn động
    var wheelRFront = 19; // bánh trước bị động

    c.save();
    c.translate(x, gy);

    // --- BÓNG ĐỔ CỦA XE XUỐNG MẶT ĐƯỜNG BĂNG ---
    c.beginPath();
    c.ellipse(10, 4, 76, 11, 0, 0, Math.PI * 2);
    c.fillStyle = 'rgba(30, 42, 52, 0.38)';
    c.fill();

    // =======================================================================
    // BỘ PHẬN GẮN TRÊN LƯNG XE: BỆ NÂNG VÀ TÊN LỬA VŨ TRỤ
    // =======================================================================
    // Góc nghiêng bệ đỡ: tilt = 0 -> nghiêng 28 deg (nằm chở trên đường); tilt = 1 -> thẳng đứng 90 deg (sẵn sàng phóng)
    // Tọa độ trục quay của bệ đỡ trên khung xe
    var pivotX = -18;
    var pivotY = -52;
    // Góc bệ so với phương thẳng đứng: tilt=0 -> góc Math.PI * 0.34; tilt=1 -> góc 0 (thẳng đứng)
    var carrierAngle = (1 - tilt) * (Math.PI * 0.34);

    c.save();
    c.translate(pivotX, pivotY);
    c.rotate(carrierAngle);

    // Thanh dầm giá đỡ tên lửa (Launch Rail Cradle)
    rr(c, -8, -100, 16, 110, 3);
    strokeFill(c, '#475569', C.ink, 2.2);

    // Các móc giữ kẹp thân tên lửa (Holding Clamps)
    rr(c, -16, -85, 32, 10, 2);
    strokeFill(c, C.gold, C.ink, 1.8);
    rr(c, -15, -42, 30, 10, 2);
    strokeFill(c, C.gold, C.ink, 1.8);

    // Vẽ tên lửa trên bệ nếu xe đang mang tên lửa và chưa phóng
    if (hasRocket && !launched) {
      rocket(c, 0, -45, {
        angle: 0,
        flame: 0,
        t: t
      });
    }

    c.restore();

    // Xilanh thủy lực nâng hạ bệ phóng (Hydraulic Actuator)
    var cylBaseX = 14;
    var cylBaseY = -40;
    var cylHeadX = pivotX + Math.sin(carrierAngle) * 36;
    var cylHeadY = pivotY - Math.cos(carrierAngle) * 36;
    c.strokeStyle = '#334155';
    c.lineWidth = 6.0;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(cylBaseX, cylBaseY);
    c.lineTo(cylHeadX, cylHeadY);
    c.stroke();
    // Ti xilanh inox sáng bóng
    c.strokeStyle = '#e2e8f0';
    c.lineWidth = 3.2;
    c.beginPath();
    c.moveTo((cylBaseX + cylHeadX) * 0.5, (cylBaseY + cylHeadY) * 0.5);
    c.lineTo(cylHeadX, cylHeadY);
    c.stroke();
    c.strokeStyle = C.ink;
    c.lineWidth = 1.4;
    c.stroke();

    // =======================================================================
    // CÁC GÓI SÁNG TẠO: SOLAR PANEL & ANTENNA (PHÍA SAU VÀ TRÊN NÓC XE)
    // =======================================================================
    // 1. TẤM PIN MẶT TRỜI (Gói sáng tạo: solarPanel)
    if (solarPanel) {
      c.save();
      // Khung giá đỡ vươn ra sau đuôi xe
      c.strokeStyle = C.steelDark;
      c.lineWidth = 2.6;
      c.beginPath();
      c.moveTo(-42, -44);
      c.lineTo(-68, -64);
      c.stroke();
      c.strokeStyle = C.ink;
      c.lineWidth = 1.6;
      c.stroke();

      // Cụm 2 cánh pin quang điện gập mở
      c.translate(-68, -64);
      c.rotate(-0.25);
      // Khung tấm pin
      rr(c, -14, -28, 28, 56, 3);
      strokeFill(c, C.solarBlue, C.ink, 2.0);
      // Các ô pin silic xanh biếc viền sáng
      c.fillStyle = C.solarCell;
      c.strokeStyle = '#38bdf8';
      c.lineWidth = 0.8;
      for (var pi = 0; pi < 4; pi++) {
        for (var pj = 0; pj < 2; pj++) {
          c.fillRect(-11 + pj * 12, -25 + pi * 13, 10, 10);
          c.strokeRect(-11 + pj * 12, -25 + pi * 13, 10, 10);
        }
      }
      c.restore();
    }

    // 2. ĂNG-TEN VỆ TINH (Gói sáng tạo: antenna)
    if (antenna) {
      c.save();
      var antBaseX = -2;
      var antBaseY = -66;
      // Trụ xoay ăng-ten
      c.beginPath();
      c.moveTo(antBaseX, antBaseY);
      c.lineTo(antBaseX - 8, antBaseY - 26);
      c.strokeStyle = C.ink;
      c.lineWidth = 2.4;
      c.stroke();

      c.translate(antBaseX - 8, antBaseY - 26);
      // Chảo xoay nhẹ đón sóng
      c.rotate(Math.sin(t * 1.5) * 0.15 - 0.4);
      // Chảo parabol viễn thám
      c.beginPath();
      c.arc(0, 0, 18, Math.PI * 0.6, Math.PI * 1.55);
      strokeFill(c, C.paper, C.ink, 2.0);
      // Cần thu tín hiệu giữa chảo
      c.beginPath();
      c.moveTo(0, 0);
      c.lineTo(12, -4);
      c.strokeStyle = C.ink;
      c.lineWidth = 1.8;
      c.stroke();
      c.beginPath();
      c.arc(12, -4, 2.5, 0, Math.PI * 2);
      c.fillStyle = C.gold;
      c.fill();
      c.restore();
    }

    // =======================================================================
    // THÂN XE CƠ KHÍ LEGO STEAM CHÍNH (CHASSIS & SMART HUB BE-5158)
    // =======================================================================
    // Dầm khung gầm chính (Technic Beam màu xám đậm)
    rr(c, -52, -34, 108, 16, 4);
    strokeFill(c, '#334155', C.ink, LINE);

    // Lỗ kỹ thuật trên dầm beam Technic (studless holes)
    for (var hx = -42; hx <= 46; hx += 14) {
      c.beginPath();
      c.arc(hx, -26, 3.2, 0, Math.PI * 2);
      strokeFill(c, '#1e293b', C.ink, 1.2);
    }

    // Vỏ hộp thân xe phía sau màu vàng LEGO rực rỡ
    rr(c, -48, -58, 56, 26, 4);
    strokeFill(c, C.gold, C.ink, LINE);
    // Vạch kẻ công nghệ xanh ngọc
    c.fillStyle = C.accentDark;
    c.fillRect(-46, -48, 52, 6);
    c.strokeRect(-46, -48, 52, 6);

    // KHỐI SMART HUB BE-5158 GẮN ĐỨNG PHÍA TRƯỚC (Cabin đầu xe)
    var hubX = 12;
    var hubY = -72;
    var hubW = 44;
    var hubH = 46;

    // Vỏ Hub màu trắng ngà STEAM
    rr(c, hubX, hubY, hubW, hubH, [6, 6, 4, 4]);
    strokeFill(c, C.paperWarm, C.ink, LINE);

    // Nút nguồn trung tâm Smart Hub (Power Button)
    c.beginPath();
    c.arc(hubX + hubW * 0.5, hubY + 11, 4.5, 0, Math.PI * 2);
    strokeFill(c, C.accentLight, C.ink, 1.4);

    // MÀN HÌNH MA TRẬN LED 5x5 CỦA HUB TÍCH HỢP TRỰC TIẾP TRÊN MẶT TRƯỚC XE!
    ledMatrix(c, hubX + hubW * 0.5, hubY + 29, {
      expression: ledExpr,
      size: 20,
      glow: true,
      t: t
    });

    // =======================================================================
    // CÁC GÓI SÁNG TẠO: ĐÈN PHA KÉP & TẤM CHẮN TRƯỚC
    // =======================================================================
    // 3. ĐÈN PHA KÉP (Gói sáng tạo: dualHeadlights)
    if (dualHeadlights) {
      c.save();
      var headX = 56;
      var headY = -48;
      // Cụm 2 đèn pha LED kép gắn cản trước
      rr(c, headX, headY, 14, 22, 3);
      strokeFill(c, '#475569', C.ink, 1.8);
      // 2 thấu kính đèn rực rỡ
      c.beginPath();
      c.arc(headX + 13, headY + 5, 5, -Math.PI * 0.5, Math.PI * 0.5);
      strokeFill(c, '#ffffff', C.ink, 1.6);
      c.beginPath();
      c.arc(headX + 13, headY + 17, 5, -Math.PI * 0.5, Math.PI * 0.5);
      strokeFill(c, '#ffffff', C.ink, 1.6);

      // Chùm sáng vàng nón kép chiếu rọi mặt đường phía trước
      var beamGrad = c.createLinearGradient(headX + 14, 0, headX + 180, 0);
      beamGrad.addColorStop(0, 'rgba(255, 235, 59, 0.7)');
      beamGrad.addColorStop(0.35, 'rgba(255, 235, 59, 0.35)');
      beamGrad.addColorStop(1, 'rgba(255, 235, 59, 0)');
      c.beginPath();
      c.moveTo(headX + 14, headY);
      c.lineTo(headX + 190, headY - 18);
      c.lineTo(headX + 190, 8);
      c.lineTo(headX + 14, headY + 22);
      c.closePath();
      c.fillStyle = beamGrad;
      c.fill();
      c.restore();
    }

    // 4. TẤM CHẮN TRƯỚC (Gói sáng tạo: frontShield)
    if (frontShield) {
      c.save();
      var shX = 58;
      var shY = -44;
      // Khung cản vòm thép dày dặn bảo vệ đầu xe chống va chạm
      rr(c, shX, shY, 10, 36, 4);
      strokeFill(c, C.steelLight, C.ink, 2.4);
      // Lưới cản bảo vệ
      c.strokeStyle = C.ink;
      c.lineWidth = 1.6;
      for (var gyi = shY + 6; gyi <= shY + 30; gyi += 6) {
        c.beginPath();
        c.moveTo(shX + 2, gyi);
        c.lineTo(shX + 8, gyi);
        c.stroke();
      }
      c.restore();
    }

    // =======================================================================
    // 4 BÁNH XE CƠ KHÍ & CỤM BÁNH RĂNG DẪN ĐỘNG 24 RĂNG
    // =======================================================================
    // Bánh sau to dẫn động (x = -26, r = 24)
    var bx = -26;
    var by = -wheelRBack;

    c.save();
    c.translate(bx, by);

    // Lốp cao su gai bám đường
    c.beginPath();
    c.arc(0, 0, wheelRBack, 0, Math.PI * 2);
    strokeFill(c, '#1f2937', C.ink, LINE);

    // Vành mâm xe màu xám máy
    c.beginPath();
    c.arc(0, 0, wheelRBack * 0.7, 0, Math.PI * 2);
    strokeFill(c, '#64748b', C.ink, 2.0);

    // BÁNH RĂNG 24 RĂNG LEGO MÔ PHỎNG TRUYỀN ĐỘNG TỪ ĐỘNG CƠ M1
    c.rotate(wheelAngle);
    var gearR = wheelRBack * 0.58;
    var teethCount = 12; // 12 cặp răng mô phỏng rõ nét
    c.fillStyle = C.hazardYellow;
    c.strokeStyle = C.ink;
    c.lineWidth = 1.4;
    c.beginPath();
    for (var gi = 0; gi < teethCount * 2; gi++) {
      var ga = (gi * Math.PI) / teethCount;
      var gr = (gi % 2 === 0) ? gearR + 3.2 : gearR;
      var gx = Math.cos(ga) * gr;
      var gyPos = Math.sin(ga) * gr;
      if (gi === 0) c.moveTo(gx, gyPos);
      else c.lineTo(gx, gyPos);
    }
    c.closePath();
    c.fill();
    c.stroke();

    // Trục chốt chữ thập màu đen trung tâm
    c.beginPath();
    c.arc(0, 0, 4.2, 0, Math.PI * 2);
    strokeFill(c, C.ink, C.ink, 1.4);

    c.restore();

    // Bánh trước bị động (x = 38, r = 19)
    var fxPos = 38;
    var fyPos = -wheelRFront;

    c.save();
    c.translate(fxPos, fyPos);

    // Lốp bánh trước
    c.beginPath();
    c.arc(0, 0, wheelRFront, 0, Math.PI * 2);
    strokeFill(c, '#1f2937', C.ink, LINE);

    // Vành mâm xe bánh trước
    c.beginPath();
    c.arc(0, 0, wheelRFront * 0.65, 0, Math.PI * 2);
    strokeFill(c, C.steelLight, C.ink, 1.8);

    // Các nan hoa bánh xe xoay theo góc bánh
    c.rotate(wheelAngle * (wheelRBack / wheelRFront)); // Bánh trước nhỏ hơn quay nhanh hơn tương ứng
    c.strokeStyle = C.ink;
    c.lineWidth = 2.0;
    for (var spk = 0; spk < 4; spk++) {
      c.beginPath();
      c.moveTo(0, 0);
      c.lineTo(0, wheelRFront * 0.62);
      c.stroke();
      c.rotate(Math.PI * 0.5);
    }
    c.beginPath();
    c.arc(0, 0, 3.8, 0, Math.PI * 2);
    strokeFill(c, C.gold, C.ink, 1.4);

    c.restore();

    c.restore();
  }

  // =========================================================================
  // 8. LAUNCH EFFECT: Hiệu ứng khói lửa và tia sáng khi tên lửa cất cánh
  // =========================================================================
  function launchEffect(c, x, gy, opts) {
    if (typeof x === 'object') { opts = x; x = DISTANCE_MARKS.mid; gy = GY0; }
    x = typeof x === 'number' ? x : DISTANCE_MARKS.mid;
    gy = typeof gy === 'number' ? gy : GY0;
    opts = opts || {};
    var progress = typeof opts.progress === 'number' ? Math.max(0, Math.min(1, opts.progress)) : 0.5;
    var t = typeof opts.t === 'number' ? opts.t : 0;

    c.save();
    c.translate(x, gy);

    // Hào quang chớp lửa sáng rực trên bệ phóng
    var flashAlpha = Math.max(0, 0.7 - progress * 0.5);
    var flashGrad = c.createRadialGradient(0, -10, 10, 0, -10, 120);
    flashGrad.addColorStop(0, 'rgba(255, 245, 157, ' + flashAlpha + ')');
    flashGrad.addColorStop(0.5, 'rgba(255, 152, 0, ' + (flashAlpha * 0.6) + ')');
    flashGrad.addColorStop(1, 'rgba(244, 81, 30, 0)');
    c.fillStyle = flashGrad;
    c.beginPath();
    c.arc(0, -10, 120, 0, Math.PI * 2);
    c.fill();

    // Các cuộn khói trắng ngà cuộn tròn tỏa sang 2 bên (Billowing smoke puffs)
    var smokePuffs = [
      { dx: -45, dy: -4, r: 24, dr: 1.2 },
      { dx: -75, dy: -12, r: 32, dr: 1.4 },
      { dx: -105, dy: -16, r: 28, dr: 1.1 },
      { dx: 45, dy: -4, r: 24, dr: 1.2 },
      { dx: 75, dy: -12, r: 32, dr: 1.4 },
      { dx: 105, dy: -16, r: 28, dr: 1.1 },
      { dx: -20, dy: -18, r: 26, dr: 1.3 },
      { dx: 20, dy: -18, r: 26, dr: 1.3 },
      { dx: 0, dy: -28, r: 22, dr: 1.5 }
    ];

    for (var pi = 0; pi < smokePuffs.length; pi++) {
      var p = smokePuffs[pi];
      var pR = p.r * (0.8 + progress * p.dr);
      var pAlpha = Math.max(0, 0.85 - progress * 0.45);
      c.beginPath();
      c.arc(p.dx, p.dy, pR, 0, Math.PI * 2);
      c.fillStyle = (pi % 2 === 0) ? 'rgba(255, 255, 255, ' + pAlpha + ')' : 'rgba(241, 245, 249, ' + pAlpha + ')';
      c.fill();
      c.strokeStyle = 'rgba(203, 213, 225, ' + (pAlpha * 0.8) + ')';
      c.lineWidth = 1.8;
      c.stroke();
    }

    // Các tia sáng lấp lánh (Star bursts)
    c.strokeStyle = C.gold;
    c.lineWidth = 2.4;
    var burstCount = 8;
    for (var bi = 0; bi < burstCount; bi++) {
      var bAngle = (bi * Math.PI * 2) / burstCount + t * 4;
      var bLen = 18 + Math.sin(t * 12 + bi) * 6;
      c.beginPath();
      c.moveTo(Math.cos(bAngle) * 14, -16 + Math.sin(bAngle) * 14);
      c.lineTo(Math.cos(bAngle) * (14 + bLen), -16 + Math.sin(bAngle) * (14 + bLen));
      c.stroke();
    }

    c.restore();
  }

  // =========================================================================
  // 9. SKID MARK: Vết phanh lốp khi dừng gấp hoặc chạy quá đà (Overshoot)
  // =========================================================================
  function skidMark(c, x, gy, opts) {
    if (typeof x === 'object') { opts = x; x = 0; gy = GY0; }
    x = typeof x === 'number' ? x : 0;
    gy = typeof gy === 'number' ? gy : GY0;
    opts = opts || {};
    var len = typeof opts.length === 'number' ? opts.length : 60;
    var opacity = typeof opts.opacity === 'number' ? opts.opacity : 0.65;

    c.save();
    c.translate(x, gy);

    // 2 vệt bánh xe trượt cao su đen mờ
    c.strokeStyle = 'rgba(15, 23, 42, ' + opacity + ')';
    c.lineWidth = 5.0;
    c.lineCap = 'round';

    // Vệt bánh sau
    c.beginPath();
    c.moveTo(-len, -2);
    c.lineTo(0, -2);
    c.stroke();

    // Vệt bánh trước
    c.lineWidth = 4.0;
    c.beginPath();
    c.moveTo(-len * 0.75, 12);
    c.lineTo(0, 12);
    c.stroke();

    c.restore();
  }

  // =========================================================================
  // 10. NOTE A: Nốt nhạc tươi vui bay lên (Giai điệu A - Thành công/Xuất phát)
  // =========================================================================
  function noteA(c, x, y, opts) {
    if (typeof x === 'object') { opts = x; x = 360; y = 320; }
    x = typeof x === 'number' ? x : 360;
    y = typeof y === 'number' ? y : 320;
    opts = opts || {};
    var t = typeof opts.t === 'number' ? opts.t : 0;

    var notes = [
      { dt: 0.0, dx: -12, scale: 1.1, col: C.gold, type: 'single' },
      { dt: 0.35, dx: 16, scale: 0.95, col: C.accentLight, type: 'double' },
      { dt: 0.7, dx: 4, scale: 1.25, col: C.ok, type: 'single' }
    ];

    c.save();

    for (var i = 0; i < notes.length; i++) {
      var nt = notes[i];
      var prog = ((t * 0.8 + nt.dt) % 1 + 1) % 1;
      var curY = y - prog * 75;
      var curX = x + nt.dx + Math.sin(t * 5 + i * 2) * 14;
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

          c.beginPath();
          c.ellipse(0, 0, 5.5, 4.0, -0.4, 0, Math.PI * 2);
          c.fill();
          c.stroke();

          c.beginPath();
          c.moveTo(4, -1);
          c.lineTo(4, -18);
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

          c.beginPath();
          c.ellipse(-7, 0, 4.8, 3.5, -0.4, 0, Math.PI * 2);
          c.ellipse(7, -3, 4.8, 3.5, -0.4, 0, Math.PI * 2);
          c.fill();
          c.stroke();

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

        // Hạt lấp lánh vàng xung quanh nốt nhạc
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
  // 11. NOTE B: Nốt nhạc trầm rơi xuống (Giai điệu B - Dừng/Thất bại/Mặt buồn)
  // =========================================================================
  function noteB(c, x, y, opts) {
    if (typeof x === 'object') { opts = x; x = 360; y = 320; }
    x = typeof x === 'number' ? x : 360;
    y = typeof y === 'number' ? y : 320;
    opts = opts || {};
    var t = typeof opts.t === 'number' ? opts.t : 0;

    var notes = [
      { dt: 0.0, dx: -8, scale: 1.1, col: '#64748b' },
      { dt: 0.45, dx: 14, scale: 0.9, col: '#475569' }
    ];

    c.save();

    for (var i = 0; i < notes.length; i++) {
      var nt = notes[i];
      var prog = ((t * 0.65 + nt.dt) % 1 + 1) % 1;
      // Nốt nhạc buồn chìm xuống nhẹ hoặc đung đưa
      var curY = y + prog * 42;
      var curX = x + nt.dx + Math.sin(t * 3 + i) * 8;
      var alpha = prog < 0.2 ? (prog / 0.2) : (prog > 0.75 ? (1 - (prog - 0.75) / 0.25) : 1);

      if (alpha > 0.02) {
        c.save();
        c.translate(curX, curY);
        c.scale(nt.scale, nt.scale);
        c.globalAlpha = alpha;

        // Nốt đơn đầu chúc xuống buồn
        c.fillStyle = nt.col;
        c.strokeStyle = C.ink;
        c.lineWidth = 2.0;

        c.beginPath();
        c.ellipse(0, 0, 5.5, 4.0, 0.4, 0, Math.PI * 2);
        c.fill();
        c.stroke();

        c.beginPath();
        c.moveTo(-4, -1);
        c.lineTo(-4, 16);
        c.quadraticCurveTo(-10, 13, -11, 7);
        c.lineTo(-11, 10);
        c.quadraticCurveTo(-8, 16, -4, 16);
        c.fill();
        c.stroke();

        // Giọt nước nhỏ buồn
        c.fillStyle = C.water;
        c.beginPath();
        c.arc(8, 4, 1.8, 0, Math.PI * 2);
        c.fill();

        c.restore();
      }
    }

    c.restore();
  }

  // =========================================================================
  // 12. SCENE: Hàm tiện ích vẽ trọn vẹn toàn cảnh tích hợp
  // =========================================================================
  function scene(c, opts) {
    opts = opts || {};
    var W = opts.W || W0;
    var H = opts.H || H0;
    var gy = opts.gy || GY0;
    var t = typeof opts.t === 'number' ? opts.t : 0;

    // Trạng thái xe
    var carX = typeof opts.carX === 'number' ? opts.carX : 320;
    var wheelAngle = typeof opts.wheelAngle === 'number' ? opts.wheelAngle : (carX * 0.1);
    var tilt = typeof opts.tilt === 'number' ? opts.tilt : 0;
    var ledExpr = opts.led || 'happy';
    var upgrades = opts.upgrades || {};

    // Cự ly bệ phóng
    var distKey = opts.targetDistance || 'mid';
    var padX = typeof distKey === 'number' ? distKey : (DISTANCE_MARKS[distKey] || DISTANCE_MARKS.mid);

    // Trạng thái phóng tên lửa
    var rocketLaunched = !!opts.rocketLaunched;
    var rocketProgress = typeof opts.rocketProgress === 'number' ? opts.rocketProgress : 0;
    var hasSkid = !!opts.skid;

    // 1. Cảnh nền
    background(c, { W: W, H: H, gy: gy, t: t, theme: opts.theme || 'day' });

    // 2. Đường lăn & vạch cự ly
    distanceTrack(c, 140, W - 40, gy, {
      activeZone: typeof distKey === 'string' ? distKey : null,
      targetDistance: distKey,
      t: t
    });

    // 3. Nhà xưởng bên trái
    hangar(c, 0, gy, { doorOpen: opts.hangarDoorOpen || 1.0, lightOn: true, t: t });

    // 4. Bệ phóng & tháp gantry
    launchPad(c, padX, gy, {
      ready: (Math.abs(carX - padX) < 15),
      targetGlow: opts.targetGlow || (Math.abs(carX - padX) < 15),
      t: t
    });

    // 5. Vết phanh nếu có
    if (hasSkid) {
      skidMark(c, carX, gy, { length: 55, opacity: 0.65 });
    }

    // 6. Xe chở tên lửa
    robot(c, carX, gy, {
      wheelAngle: wheelAngle,
      tilt: tilt,
      led: ledExpr,
      hasRocket: !rocketLaunched,
      launched: rocketLaunched,
      upgrades: upgrades,
      t: t
    });

    // 7. Tên lửa độc lập khi đang phóng bay lên trời
    if (rocketLaunched) {
      // Vị trí tên lửa bay vút lên từ bệ phóng
      var rkX = padX;
      var rkY = (gy - 100) - rocketProgress * 380;
      rocket(c, rkX, rkY, {
        angle: 0,
        flame: Math.max(0.4, 1.0 - rocketProgress * 0.3),
        t: t
      });

      // Hiệu ứng khói lửa chân bệ phóng
      launchEffect(c, padX, gy, {
        progress: rocketProgress,
        t: t
      });
    }

    // 8. Âm thanh Melody A / Melody B
    if (opts.melody === 'A' || ledExpr === 'happy') {
      noteA(c, carX + 20, gy - 90, { t: t });
    } else if (opts.melody === 'B' || ledExpr === 'sad') {
      noteB(c, carX + 20, gy - 90, { t: t });
    }
  }

  // =========================================================================
  // XUẤT GIAO DIỆN window.Lop3Bai16Art
  // =========================================================================
  var Lop3Bai16Art = {
    W: W0,
    H: H0,
    GROUND_Y: GY0,
    DISTANCE_MARKS: DISTANCE_MARKS,
    background: background,
    hangar: hangar,
    distanceTrack: distanceTrack,
    launchPad: launchPad,
    robot: robot,
    transporter: robot, // alias
    rocket: rocket,
    ledMatrix: ledMatrix,
    launchEffect: launchEffect,
    skidMark: skidMark,
    noteA: noteA,
    noteB: noteB,
    scene: scene,
    // Các alias bổ sung
    drawBackground: background,
    drawHangar: hangar,
    drawDistanceTrack: distanceTrack,
    drawLaunchPad: launchPad,
    drawRobot: robot,
    drawTransporter: robot,
    drawRocket: rocket,
    drawLedMatrix: ledMatrix,
    drawLaunchEffect: launchEffect,
    drawSkidMark: skidMark,
    drawNoteA: noteA,
    drawNoteB: noteB,
    drawScene: scene
  };

  if (typeof window !== 'undefined') {
    window.Lop3Bai16Art = Lop3Bai16Art;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Lop3Bai16Art;
  }
})();
