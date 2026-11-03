// Thư viện vẽ cảnh Lớp 1 · Bài 01: "Làm quen bộ công cụ - Xe trượt dốc" (window.Lop1Bai01Art).
// Khung nhìn chuẩn: 900x560, nhìn NGANG (side-view), mặt đất GROUND_Y = 430.
// Dành cho học sinh Lớp 1 trên máy tính bảng: khối to, viền đậm C.ink, nét LINE = 2.6, không chữ trong hình, không vũ khí.
// Tương thích chuẩn ZMArt Alpha 330. Không dùng ảnh ngoài, không dùng font ngoài, không dùng Math.random() khi vẽ.
(function () {
  'use strict';

  var W0 = 900;
  var H0 = 560;
  var GY0 = 430;
  var LINE = 2.6;

  // Bảng màu chuẩn hệ thống ZMArt
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

  // Ưu tiên nạp từ window.ZMArt nếu đã có
  if (typeof window !== 'undefined' && window.ZMArt && window.ZMArt.C) {
    C = window.ZMArt.C;
    LINE = window.ZMArt.LINE || LINE;
  }

  // Bổ sung bảng màu chuyên biệt cho đường trượt & xe Kit Alpha 330
  var C_EXT = {
    tireTurquoise: '#2ec4b6',
    tireTurquoiseDark: '#1b8a80',
    tireTurquoiseLight: '#68e5d9',
    technicGrey: '#eceff1',
    technicDark: '#37474f',
    woodPlank: '#b08968',
    woodPlankDark: '#7f5539',
    woodFrame: '#9c6644',
    woodFrameDark: '#582f0e',
    iceSheen: '#e0f7fa',
    iceDeep: '#80deea',
    iceFrost: '#b2ebf2',
    roughEarth: '#5c4033',
    roughGravel: '#8d7b68',
    roughMoss: '#4c6444',
    pulleyYellow: '#ffd54f',
    pulleyRim: '#ffa000',
    bumperDark: '#263238',
    bumperHighlight: '#607d8b'
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

  // Dữ liệu mây công viên cố định
  var CLOUDS = [
    { x0: 60, y: 55, s: 0.95, sp: 8 },
    { x0: 280, y: 82, s: 0.75, sp: 6 },
    { x0: 530, y: 48, s: 1.15, sp: 9 },
    { x0: 760, y: 75, s: 0.85, sp: 7 }
  ];

  // Dữ liệu cụm cỏ công viên cố định
  var PARK_GRASS_TUFTS = [
    { x: 380, y: 450, s: 1.0 },
    { x: 440, y: 475, s: 0.85 },
    { x: 520, y: 458, s: 1.1 },
    { x: 610, y: 490, s: 0.9 },
    { x: 690, y: 462, s: 1.05 },
    { x: 770, y: 485, s: 0.8 },
    { x: 840, y: 455, s: 1.15 }
  ];

  // Dữ liệu cây công viên cố định ở hậu cảnh
  var BG_TREES = [
    { x: 190, y: 430, scale: 0.82, type: 0 },
    { x: 350, y: 430, scale: 0.95, type: 1 },
    { x: 580, y: 430, scale: 1.05, type: 0 },
    { x: 820, y: 430, scale: 0.9, type: 1 }
  ];

  // =========================================================================
  // 1. CẢNH NỀN & THỜI TIẾT CÔNG VIÊN
  // =========================================================================
  function background(c, opts) {
    opts = opts || {};
    var t = opts.t || 0;
    var surface = opts.surface || 'wood'; // 'wood' | 'ice' | 'rough'
    var W = W0;
    var H = H0;
    var gy = GY0;

    c.save();

    // 1.1. Bầu trời công viên trong xanh
    var skyGrad = c.createLinearGradient(0, 0, 0, gy);
    skyGrad.addColorStop(0, '#56b4f7');
    skyGrad.addColorStop(0.55, '#a6ddfd');
    skyGrad.addColorStop(1, '#e3f3ff');
    c.fillStyle = skyGrad;
    c.fillRect(0, 0, W, H);

    // 1.2. Mặt trời ấm áp góc trên phải
    c.save();
    var sunX = 780;
    var sunY = 75;
    var sunPulse = 1 + 0.04 * Math.sin(t * 2);
    // Vầng hào quang
    c.fillStyle = 'rgba(255, 210, 63, 0.22)';
    c.beginPath();
    c.arc(sunX, sunY, 44 * sunPulse, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = 'rgba(255, 225, 120, 0.4)';
    c.beginPath();
    c.arc(sunX, sunY, 32 * sunPulse, 0, Math.PI * 2);
    c.fill();
    // Quả cầu mặt trời
    c.beginPath();
    c.arc(sunX, sunY, 22, 0, Math.PI * 2);
    strokeFill(c, C.gold, C.ink, LINE);
    // Tia nắng dịu
    for (var sn = 0; sn < 8; sn++) {
      var sAngle = (sn * Math.PI) / 4 + t * 0.2;
      var sr1 = 28;
      var sr2 = 36 + 3 * Math.sin(t * 3 + sn);
      c.beginPath();
      c.moveTo(sunX + Math.cos(sAngle) * sr1, sunY + Math.sin(sAngle) * sr1);
      c.lineTo(sunX + Math.cos(sAngle) * sr2, sunY + Math.sin(sAngle) * sr2);
      c.strokeStyle = C.gold;
      c.lineWidth = 2.8;
      c.lineCap = 'round';
      c.stroke();
    }
    c.restore();

    // 1.3. Đám mây trôi nhẹ nhàng
    for (var ci = 0; ci < CLOUDS.length; ci++) {
      var cData = CLOUDS[ci];
      var cx = ((cData.x0 + t * cData.sp) % (W + 200)) - 100;
      var cy = cData.y;
      var cs = cData.s;

      c.save();
      c.translate(cx, cy);
      c.scale(cs, cs);

      c.fillStyle = C.paper;
      c.beginPath();
      c.arc(0, 0, 18, 0, Math.PI * 2);
      c.arc(16, -8, 22, 0, Math.PI * 2);
      c.arc(38, -4, 18, 0, Math.PI * 2);
      c.arc(52, 2, 14, 0, Math.PI * 2);
      c.arc(26, 8, 16, 0, Math.PI * 2);
      c.closePath();
      strokeFill(c, C.paper, C.ink, LINE);

      // Bóng mây nhẹ bên dưới
      c.fillStyle = '#e1effa';
      c.beginPath();
      c.arc(16, 2, 14, 0, Math.PI * 2);
      c.arc(38, 4, 11, 0, Math.PI * 2);
      c.fill();

      c.restore();
    }

    // 1.4. Đồi cỏ xanh thoai thoải ở xa (dãy đồi 1)
    c.fillStyle = '#9cd474';
    c.beginPath();
    c.moveTo(0, gy - 20);
    c.bezierCurveTo(W * 0.25, gy - 120, W * 0.5, gy - 50, W * 0.75, gy - 110);
    c.bezierCurveTo(W * 0.88, gy - 130, W * 0.95, gy - 80, W, gy - 95);
    c.lineTo(W, gy);
    c.lineTo(0, gy);
    c.closePath();
    strokeFill(c, '#9cd474', C.inkSoft, 1.8);

    // Dãy đồi gần (dãy đồi 2)
    c.fillStyle = C.grassLight;
    c.beginPath();
    c.moveTo(0, gy - 10);
    c.bezierCurveTo(W * 0.18, gy - 60, W * 0.42, gy - 40, W * 0.65, gy - 70);
    c.bezierCurveTo(W * 0.82, gy - 90, W * 0.92, gy - 45, W, gy - 50);
    c.lineTo(W, gy);
    c.lineTo(0, gy);
    c.closePath();
    strokeFill(c, C.grassLight, C.ink, 2.2);

    // 1.5. Hàng cây công viên hậu cảnh
    for (var ti = 0; ti < BG_TREES.length; ti++) {
      var tr = BG_TREES[ti];
      tree(c, tr.x, gy - 10, { scale: tr.scale, type: tr.type, t: t });
    }

    // 1.6. Mặt đất công viên (từ gy = 430 xuống 560)
    var grassGrad = c.createLinearGradient(0, gy, 0, H);
    grassGrad.addColorStop(0, C.grass);
    grassGrad.addColorStop(0.4, C.grassDark);
    grassGrad.addColorStop(1, '#253e18');
    c.fillStyle = grassGrad;
    c.fillRect(0, gy, W, H - gy);

    // Đường viền mép cỏ
    c.beginPath();
    c.moveTo(0, gy);
    c.lineTo(W, gy);
    c.strokeStyle = C.ink;
    c.lineWidth = 3.2;
    c.stroke();

    // 1.7. ĐƯỜNG CHẠY BẰNG PHẲNG (RUNWAY / TRACK) NỐI TỪ CHÂN DỐC ĐẾN ĐÍCH
    // Đoạn phẳng từ x = 320 đến x = 880
    var trackX0 = 310;
    var trackW = 570;
    var trackH = 18;
    var trackY = gy - trackH / 2;

    c.save();
    // Nền đường chạy theo chất liệu
    if (surface === 'ice') {
      // Mặt trơn tuyết băng
      var iceGrad = c.createLinearGradient(trackX0, trackY, trackX0, trackY + trackH);
      iceGrad.addColorStop(0, C_EXT.iceFrost);
      iceGrad.addColorStop(0.5, C_EXT.iceSheen);
      iceGrad.addColorStop(1, C_EXT.iceDeep);
      rr(c, trackX0, trackY, trackW, trackH, 4);
      strokeFill(c, iceGrad, C.ink, LINE);

      // Vệt sáng bóng phản chiếu
      c.fillStyle = 'rgba(255, 255, 255, 0.75)';
      c.fillRect(trackX0 + 10, trackY + 3, trackW - 20, 3);

      // Hoa tuyết / vệt băng nhỏ lấp lánh dọc đường
      for (var fz = 0; fz < 7; fz++) {
        var fx = trackX0 + 40 + fz * 75;
        c.fillStyle = '#ffffff';
        c.beginPath();
        c.arc(fx, trackY + 9, 2.0, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = C_EXT.iceDeep;
        c.fillRect(fx + 12, trackY + 8, 14, 2);
      }
    } else if (surface === 'rough') {
      // Mặt nhám sỏi cỏ / đất gồ ghề
      var roughGrad = c.createLinearGradient(trackX0, trackY, trackX0, trackY + trackH);
      roughGrad.addColorStop(0, C_EXT.roughMoss);
      roughGrad.addColorStop(0.6, C_EXT.roughGravel);
      roughGrad.addColorStop(1, C_EXT.roughEarth);
      rr(c, trackX0, trackY, trackW, trackH, 4);
      strokeFill(c, roughGrad, C.ink, LINE);

      // Các đốm sỏi nhám lồi lõm
      for (var sp = 0; sp < 18; sp++) {
        var px = trackX0 + 15 + sp * 30 + ((sp * 7) % 11);
        var py = trackY + 4 + ((sp * 5) % 9);
        c.fillStyle = (sp % 2 === 0) ? '#3e2c1e' : '#738d64';
        c.beginPath();
        c.arc(px, py, 1.8, 0, Math.PI * 2);
        c.fill();
      }
    } else {
      // Mặt gỗ tiêu chuẩn (mặc định)
      var woodGrad = c.createLinearGradient(trackX0, trackY, trackX0, trackY + trackH);
      woodGrad.addColorStop(0, C_EXT.woodPlank);
      woodGrad.addColorStop(0.7, C.wood);
      woodGrad.addColorStop(1, C_EXT.woodPlankDark);
      rr(c, trackX0, trackY, trackW, trackH, 4);
      strokeFill(c, woodGrad, C.ink, LINE);

      // Các mối ghép thanh ván gỗ
      c.strokeStyle = C_EXT.woodFrameDark;
      c.lineWidth = 1.8;
      for (var vp = trackX0 + 35; vp < trackX0 + trackW - 10; vp += 38) {
        c.beginPath();
        c.moveTo(vp, trackY + 1);
        c.lineTo(vp, trackY + trackH - 1);
        c.stroke();

        // Đinh chốt gỗ nhỏ ở 2 đầu ván
        c.fillStyle = C.inkSoft;
        c.beginPath();
        c.arc(vp - 4, trackY + 4, 1.2, 0, Math.PI * 2);
        c.arc(vp - 4, trackY + trackH - 4, 1.2, 0, Math.PI * 2);
        c.fill();
      }
    }

    // Gờ chặn / thanh nẹp biên đường chạy
    c.strokeStyle = C.ink;
    c.lineWidth = 2.0;
    c.beginPath();
    c.moveTo(trackX0, trackY);
    c.lineTo(trackX0 + trackW, trackY);
    c.moveTo(trackX0, trackY + trackH);
    c.lineTo(trackX0 + trackW, trackY + trackH);
    c.stroke();

    // 1.8. VẠCH THƯỚC ĐO CỰ LY TRỰC QUAN (KHÔNG CHỮ, DÙNG KHỐI HỌC SINH LỚP 1)
    // Các vạch khoảng cách chia đều: nấc 1 (trượt ngắn), nấc 2 (đến đích), nấc 3 (xa)
    var rulerY = trackY + trackH + 6;
    for (var rk = 0; rk <= 10; rk++) {
      var rx = trackX0 + 40 + rk * 48; // từ ~350 đến ~830
      var isMajor = (rk % 2 === 0);
      var rLen = isMajor ? 12 : 7;

      c.strokeStyle = isMajor ? C.paperWarm : C.inkSoft;
      c.lineWidth = isMajor ? 2.4 : 1.6;
      c.beginPath();
      c.moveTo(rx, rulerY);
      c.lineTo(rx, rulerY + rLen);
      c.stroke();

      // Mốc tròn biểu tượng nấc đo
      if (isMajor) {
        c.fillStyle = (rk === 6) ? C.ok : (rk < 6 ? C.gold : C.warn);
        c.beginPath();
        c.arc(rx, rulerY + rLen + 5, 3.2, 0, Math.PI * 2);
        strokeFill(c, null, C.ink, 1.4);
      }
    }

    // Vùng đích an toàn (khoanh vùng từ x = 680 đến x = 740)
    c.fillStyle = 'rgba(67, 160, 71, 0.2)';
    c.fillRect(680, trackY - 2, 60, trackH + 4);
    c.strokeStyle = C.ok;
    c.lineWidth = 2.0;
    c.strokeRect(680, trackY - 2, 60, trackH + 4);

    c.restore();

    // 1.9. Các khóm cỏ công viên tiền cảnh
    for (var gi = 0; gi < PARK_GRASS_TUFTS.length; gi++) {
      var gt = PARK_GRASS_TUFTS[gi];
      c.save();
      c.translate(gt.x, gt.y);
      c.scale(gt.s, gt.s);
      c.strokeStyle = C.grassDark;
      c.lineWidth = 2.2;
      c.lineCap = 'round';
      c.beginPath();
      c.moveTo(0, 0); c.quadraticCurveTo(-6, -14, -10, -18);
      c.moveTo(0, 0); c.quadraticCurveTo(0, -16, 2, -22);
      c.moveTo(0, 0); c.quadraticCurveTo(8, -12, 12, -16);
      c.stroke();

      // Hoa cúc nhỏ xinh
      if (gi % 2 === 0) {
        c.fillStyle = C.paperWarm;
        c.beginPath();
        c.arc(3, -24, 3.5, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = C.gold;
        c.beginPath();
        c.arc(3, -24, 1.6, 0, Math.PI * 2);
        c.fill();
      }
      c.restore();
    }

    c.restore();
  }

  // =========================================================================
  // 2. CÂY CÔNG VIÊN (TREE & BUSH)
  // =========================================================================
  function tree(c, x, gy, opts) {
    opts = opts || {};
    var s = opts.scale || 1.0;
    var type = opts.type || 0;
    var t = opts.t || 0;
    var sway = Math.sin(t * 1.5 + x * 0.05) * 2.5;

    c.save();
    c.translate(x, gy);
    c.scale(s, s);

    // Thân cây gỗ
    c.fillStyle = C_EXT.woodPlankDark;
    c.beginPath();
    c.moveTo(-10, 0);
    c.lineTo(-6, -70);
    c.lineTo(6 + sway * 0.3, -70);
    c.lineTo(10, 0);
    c.closePath();
    strokeFill(c, C_EXT.woodPlankDark, C.ink, LINE);

    // Tán lá
    c.save();
    c.translate(sway, -70);
    if (type === 0) {
      // Tán tròn bồng bềnh
      c.fillStyle = C.grassDark;
      c.beginPath();
      c.arc(-16, -15, 26, 0, Math.PI * 2);
      c.arc(16, -15, 26, 0, Math.PI * 2);
      c.arc(0, -38, 30, 0, Math.PI * 2);
      c.closePath();
      strokeFill(c, C.grassDark, C.ink, LINE);

      c.fillStyle = C.grass;
      c.beginPath();
      c.arc(-12, -22, 22, 0, Math.PI * 2);
      c.arc(12, -22, 22, 0, Math.PI * 2);
      c.arc(0, -42, 25, 0, Math.PI * 2);
      c.closePath();
      c.fill();

      // Đốm sáng trên lá
      c.fillStyle = C.grassLight;
      c.beginPath();
      c.arc(-6, -46, 12, 0, Math.PI * 2);
      c.arc(10, -32, 10, 0, Math.PI * 2);
      c.fill();
    } else {
      // Tán hình tháp nhọn bo tròn
      c.fillStyle = '#2f5223';
      c.beginPath();
      c.moveTo(0, -75);
      c.bezierCurveTo(32, -45, 34, -10, 0, -5);
      c.bezierCurveTo(-34, -10, -32, -45, 0, -75);
      c.closePath();
      strokeFill(c, '#2f5223', C.ink, LINE);

      c.fillStyle = C.grass;
      c.beginPath();
      c.moveTo(-4, -70);
      c.bezierCurveTo(24, -45, 25, -15, -4, -10);
      c.bezierCurveTo(-26, -15, -25, -45, -4, -70);
      c.closePath();
      c.fill();
    }
    c.restore();

    c.restore();
  }

  function bush(c, x, gy, opts) {
    opts = opts || {};
    var s = opts.scale || 1.0;
    c.save();
    c.translate(x, gy);
    c.scale(s, s);

    c.fillStyle = C.grass;
    c.beginPath();
    c.arc(-14, -10, 14, 0, Math.PI * 2);
    c.arc(14, -10, 14, 0, Math.PI * 2);
    c.arc(0, -18, 16, 0, Math.PI * 2);
    c.closePath();
    strokeFill(c, C.grass, C.ink, LINE);

    c.fillStyle = C.grassLight;
    c.beginPath();
    c.arc(-3, -20, 9, 0, Math.PI * 2);
    c.arc(11, -12, 7, 0, Math.PI * 2);
    c.fill();

    c.restore();
  }

  // =========================================================================
  // 3. DỐC TRƯỢT GỖ (RAMP) VỚI 3 NẤC ĐỘ DỐC VÀ CHỐT THẢ XE
  // =========================================================================
  // Tọa độ cấu trúc dốc:
  // Chân dốc tiếp đất tại (320, gy).
  // Đỉnh dốc tại x = 75, độ cao thay đổi theo 3 nấc:
  // - Nấc 1: h = 85  -> Đỉnh tại (75, gy - 85)
  // - Nấc 2: h = 145 -> Đỉnh tại (75, gy - 145)
  // - Nấc 3: h = 205 -> Đỉnh tại (75, gy - 205)
  function ramp(c, x, gy, opts) {
    opts = opts || {};
    x = (typeof x === 'number') ? x : 50;
    gy = (typeof gy === 'number') ? gy : GY0;
    var level = opts.level || 1; // 1 | 2 | 3
    if (level < 1) level = 1;
    if (level > 3) level = 3;

    var surface = opts.surface || 'wood';
    var released = !!opts.released;
    var t = opts.t || 0;

    // Chiều cao tương ứng 3 nấc
    var heights = [0, 85, 145, 205];
    var currentH = heights[level];

    var rampStartX = x + 25; // x = 75
    var rampStartY = gy - currentH;
    var rampEndX = x + 270; // x = 320
    var rampEndY = gy;

    c.save();

    // 3.1. KHUNG CHÂN ĐẾ & CỘT TRỤ GỖ ĐIỀU CHỈNH ĐỘ CAO (PILLAR & A-FRAME)
    // Cột trụ đứng tại x = 75
    var colX = rampStartX;
    var colW = 20;
    var basePlateY = gy + 8;

    // Đế chân cột cắm đất
    c.fillStyle = C_EXT.woodFrameDark;
    rr(c, colX - colW / 2 - 8, gy - 4, colW + 16, 14, 3);
    strokeFill(c, C_EXT.woodFrameDark, C.ink, LINE);

    // Cột dọc kép chịu lực
    c.fillStyle = C_EXT.woodFrame;
    rr(c, colX - colW / 2, gy - 225, colW, 225, 4);
    strokeFill(c, C_EXT.woodFrame, C.ink, LINE);

    // Thanh giằng chéo sau lưng (truss)
    c.strokeStyle = C_EXT.woodFrameDark;
    c.lineWidth = 3.6;
    c.beginPath();
    c.moveTo(colX - 8, gy);
    c.lineTo(colX - 35, gy);
    c.lineTo(colX - 10, gy - currentH * 0.7);
    c.stroke();

    // 3 lỗ chốt định vị nấc 1, 2, 3 trên cột gỗ (không chữ/số, dùng chấm chốt)
    for (var lv = 1; lv <= 3; lv++) {
      var pegY = gy - heights[lv];
      var isActive = (lv === level);

      // Lỗ trên cột
      c.fillStyle = C.inkSoft;
      c.beginPath();
      c.arc(colX, pegY, 5.5, 0, Math.PI * 2);
      c.fill();
      c.strokeStyle = C.ink;
      c.lineWidth = 1.6;
      c.stroke();

      // Chốt pin định vị (nếu đang chọn nấc này)
      if (isActive) {
        c.fillStyle = (lv === 1 ? C.gold : (lv === 2 ? C.accent : C.warn));
        c.beginPath();
        c.arc(colX, pegY, 7.5, 0, Math.PI * 2);
        strokeFill(c, null, C.ink, 2.2);

        // Vòng sáng nhấp nháy báo nấc đang chọn
        c.strokeStyle = C.paper;
        c.lineWidth = 2.0;
        c.beginPath();
        c.arc(colX, pegY, 4.0, 0, Math.PI * 2);
        c.stroke();
      } else {
        // Chốt kim loại chờ
        c.fillStyle = C.hole;
        c.beginPath();
        c.arc(colX, pegY, 3.5, 0, Math.PI * 2);
        strokeFill(c, null, C.inkSoft, 1.2);
      }
    }

    // 3.2. KHUNG ĐỠ PHỤ DỌC DỐC (MID-SUPPORT LEG)
    var midX = rampStartX + (rampEndX - rampStartX) * 0.45;
    var midY = rampStartY + (rampEndY - rampStartY) * 0.45;
    c.fillStyle = C_EXT.woodFrame;
    rr(c, midX - 6, midY, 12, gy - midY, 3);
    strokeFill(c, C_EXT.woodFrame, C.ink, 2.0);

    // 3.3. TẤM VÁN MẶT DỐC (RAMP INCLINE PLANK)
    // Đường cong tiếp đất mượt mà tại chân dốc
    var plankThick = 14;
    var slopeAngle = Math.atan2(rampEndY - rampStartY, rampEndX - rampStartX);

    c.save();
    // Khối ván mặt dốc
    c.beginPath();
    c.moveTo(rampStartX - 16, rampStartY);
    c.lineTo(rampEndX - 25, rampEndY);
    // Đoạn cong lượn tiếp xúc phẳng với mặt đất
    c.quadraticCurveTo(rampEndX + 8, rampEndY, rampEndX + 28, rampEndY);
    c.lineTo(rampEndX + 28, rampEndY + plankThick);
    c.quadraticCurveTo(rampEndX + 4, rampEndY + plankThick, rampEndX - 25, rampEndY + plankThick);
    c.lineTo(rampStartX - 16, rampStartY + plankThick);
    c.closePath();

    // Màu nền ván theo bề mặt
    if (surface === 'ice') {
      var rampIceGrad = c.createLinearGradient(rampStartX, rampStartY, rampEndX, rampEndY);
      rampIceGrad.addColorStop(0, C_EXT.iceFrost);
      rampIceGrad.addColorStop(0.5, C_EXT.iceSheen);
      rampIceGrad.addColorStop(1, C_EXT.iceDeep);
      strokeFill(c, rampIceGrad, C.ink, LINE);

      // Vạch bóng băng loang loáng
      c.strokeStyle = '#ffffff';
      c.lineWidth = 3.2;
      c.beginPath();
      c.moveTo(rampStartX - 5, rampStartY + 3);
      c.lineTo(rampEndX - 20, rampEndY + 3);
      c.stroke();
    } else if (surface === 'rough') {
      var rampRoughGrad = c.createLinearGradient(rampStartX, rampStartY, rampEndX, rampEndY);
      rampRoughGrad.addColorStop(0, C_EXT.roughMoss);
      rampRoughGrad.addColorStop(0.7, C_EXT.roughGravel);
      rampRoughGrad.addColorStop(1, C_EXT.roughEarth);
      strokeFill(c, rampRoughGrad, C.ink, LINE);

      // Hạt nhám trên mặt dốc
      for (var ri = 0; ri < 12; ri++) {
        var rRatio = (ri + 1) / 13;
        var rpx = rampStartX + (rampEndX - rampStartX) * rRatio;
        var rpy = rampStartY + (rampEndY - rampStartY) * rRatio + 4;
        c.fillStyle = (ri % 2 === 0) ? '#2d1f14' : '#88a379';
        c.beginPath();
        c.arc(rpx, rpy, 2.0, 0, Math.PI * 2);
        c.fill();
      }
    } else {
      // Gỗ tự nhiên
      var rampWoodGrad = c.createLinearGradient(rampStartX, rampStartY, rampEndX, rampEndY);
      rampWoodGrad.addColorStop(0, C_EXT.woodPlank);
      rampWoodGrad.addColorStop(1, C_EXT.woodPlankDark);
      strokeFill(c, rampWoodGrad, C.ink, LINE);

      // Các nan ván ngang mặt dốc
      c.strokeStyle = C_EXT.woodFrameDark;
      c.lineWidth = 1.8;
      for (var vi = 1; vi <= 9; vi++) {
        var vRatio = vi / 10;
        var vx = rampStartX + (rampEndX - rampStartX) * vRatio;
        var vy = rampStartY + (rampEndY - rampStartY) * vRatio;
        c.beginPath();
        c.moveTo(vx - Math.sin(slopeAngle) * 2, vy + Math.cos(slopeAngle) * 2);
        c.lineTo(vx - Math.sin(slopeAngle) * (plankThick - 2), vy + Math.cos(slopeAngle) * (plankThick - 2));
        c.stroke();
      }
    }
    c.restore();

    // 3.4. CHỐT CHẶN XUẤT PHÁT CƠ HỌC (START GATE / RELEASE STOPPER PIN)
    // Đặt tại vị trí đón bánh xe trước khi thả
    var gateX = rampStartX + 32;
    var gateY = rampStartY + (rampEndY - rampStartY) * (32 / (rampEndX - rampStartX));

    c.save();
    c.translate(gateX, gateY);
    c.rotate(slopeAngle);

    // Bệ xoay chốt chặn
    c.fillStyle = C.technicDark || '#37474f';
    c.beginPath();
    c.arc(0, 0, 6.5, 0, Math.PI * 2);
    strokeFill(c, C.technicDark || '#37474f', C.ink, 1.8);

    if (!released) {
      // TRẠNG THÁI KHÓA (GIỮ XE): cần gạt dựng đứng cản đường bánh xe
      c.save();
      c.rotate(-Math.PI / 2); // dựng đứng vuông góc mặt dốc
      c.fillStyle = C.warn;
      rr(c, -4, 0, 8, 28, 3);
      strokeFill(c, C.warn, C.ink, 2.2);

      // Núm tròn tay gạt cơ học trên đỉnh chốt
      c.fillStyle = C.gold;
      c.beginPath();
      c.arc(0, 28, 6.0, 0, Math.PI * 2);
      strokeFill(c, C.gold, C.ink, 2.0);
      c.restore();
    } else {
      // TRẠNG THÁI THẢ XE: cần gạt hạ nằm rạp theo mặt dốc cho xe phóng qua
      c.save();
      c.rotate(0.08 * Math.sin(t * 12)); // rung nhẹ khi xe trượt qua
      c.fillStyle = C.ok;
      rr(c, 0, -3, 26, 6, 2);
      strokeFill(c, C.ok, C.ink, 2.0);

      c.fillStyle = C.gold;
      c.beginPath();
      c.arc(26, 0, 4.5, 0, Math.PI * 2);
      strokeFill(c, C.gold, C.ink, 1.8);
      c.restore();
    }

    c.restore();

    // 3.5. BẬC LÊN / BẬCH ĐỈNH DỐC
    c.fillStyle = C_EXT.woodFrame;
    rr(c, rampStartX - 28, rampStartY - 2, 24, 12, 3);
    strokeFill(c, C_EXT.woodFrame, C.ink, 2.0);

    c.restore();
  }

  // =========================================================================
  // 4. MÔ HÌNH XE TRƯỢT DỐC 22 CHI TIẾT (KIT ZM ALPHA 330)
  // =========================================================================
  // Mô hình cơ khí không động cơ:
  // - Khung dầm Technic 15 lỗ liên kết chốt chéo (32278)
  // - Trục sau lớn: vành bánh đúc (bp-8841) + lốp cao su xanh ngọc (bp-8850)
  // - Trục trước nhỏ: bánh đai nhỏ / bánh xe nhỏ (4185)
  // - 4 gói nâng cấp sáng tạo:
  //   + bigFrontWheels: cặp bánh trước lớn đồng bộ lốp ngọc
  //   + cargoWeight: khối gia tải thân xe (thêm dầm kỹ thuật)
  //   + spoilerWing: cánh lướt gió khí động học ở đuôi xe
  //   + frontBumper: thanh cản chống va đập bánh trước
  function car(c, x, y, opts) {
    opts = opts || {};
    x = (typeof x === 'number') ? x : 200;
    y = (typeof y === 'number') ? y : GY0;
    var angle = opts.angle || 0;
    var wheelAngle = opts.wheelAngle || 0;
    var upgrades = opts.upgrades || {};
    var t = opts.t || 0;

    var bigFront = !!upgrades.bigFrontWheels;
    var cargo = !!upgrades.cargoWeight;
    var spoiler = !!upgrades.spoilerWing;
    var bumper = !!upgrades.frontBumper;

    c.save();
    c.translate(x, y);
    c.rotate(angle);

    // Kích thước hình học xe
    // Chiều dài cơ sở (wheelbase): tâm bánh sau tại x = -44, tâm bánh trước tại x = +44
    var rearAxleX = -44;
    var rearAxleY = -24; // Bánh lớn bán kính R = 24
    var frontAxleX = 44;
    var frontAxleY = bigFront ? -24 : -13; // Bánh nhỏ bán kính R = 13 (nếu chưa nâng cấp)

    // 4.1. CÁNH LƯỚT GIÓ ĐUÔI (SPOILER WING) - GÓI NÂNG CẤP M4
    if (spoiler) {
      c.save();
      // Chân trụ cánh gió gắn ở đuôi khung xe
      c.fillStyle = C.technicDark || '#37474f';
      c.beginPath();
      c.moveTo(rearAxleX - 16, rearAxleY);
      c.lineTo(rearAxleX - 26, rearAxleY - 26);
      c.lineTo(rearAxleX - 18, rearAxleY - 26);
      c.lineTo(rearAxleX - 10, rearAxleY);
      c.closePath();
      strokeFill(c, C.technicDark || '#37474f', C.ink, 1.8);

      // Phiến cánh gió cong khí động học
      c.fillStyle = C.accent;
      c.beginPath();
      c.moveTo(rearAxleX - 38, rearAxleY - 26);
      c.lineTo(rearAxleX + 2, rearAxleY - 26);
      c.lineTo(rearAxleX + 6, rearAxleY - 32);
      c.lineTo(rearAxleX - 34, rearAxleY - 32);
      c.closePath();
      strokeFill(c, C.accent, C.ink, 2.2);

      // Điểm nhấn viền cánh gió màu vàng
      c.fillStyle = C.gold;
      c.fillRect(rearAxleX - 34, rearAxleY - 31, 38, 2.5);
      c.restore();
    }

    // 4.2. KHỐI GIA TẢI TRỌNG LƯỢNG (CARGO WEIGHT) - GÓI NÂNG CẤP M4
    if (cargo) {
      c.save();
      // 2 khối tạ kỹ thuật xếp chồng ở giữa thân xe
      var cargoX = -12;
      var cargoY = rearAxleY - 22;
      c.fillStyle = C.gold;
      rr(c, cargoX, cargoY, 32, 16, 3);
      strokeFill(c, C.gold, C.ink, 2.2);

      // Các sọc biểu tượng tải trọng nặng (vàng sọc đen phản quang)
      c.fillStyle = C.ink;
      c.beginPath();
      c.moveTo(cargoX + 6, cargoY + 16); c.lineTo(cargoX + 12, cargoY);
      c.lineTo(cargoX + 16, cargoY); c.lineTo(cargoX + 10, cargoY + 16);
      c.closePath(); c.fill();

      c.beginPath();
      c.moveTo(cargoX + 18, cargoY + 16); c.lineTo(cargoX + 24, cargoY);
      c.lineTo(cargoX + 28, cargoY); c.lineTo(cargoX + 22, cargoY + 16);
      c.closePath(); c.fill();

      // Đinh vít tán giữ khối tải
      c.fillStyle = C.hole;
      c.beginPath();
      c.arc(cargoX + 5, cargoY + 5, 1.8, 0, Math.PI * 2);
      c.arc(cargoX + 27, cargoY + 5, 1.8, 0, Math.PI * 2);
      c.fill();
      c.restore();
    }

    // 4.3. KHUNG DẦM TECHNIC 15 LỖ & DẦM CHÉO (CHASSIS BEAMS)
    // Dầm chính nằm xiên nối từ trục sau đến trục trước
    c.save();
    var beamLen = 108;
    var beamH = 14;
    var beamAngle = Math.atan2(frontAxleY - rearAxleY, frontAxleX - rearAxleX);

    c.translate(rearAxleX, rearAxleY);
    c.rotate(beamAngle);

    // Thân dầm xám nhạt Technic 32278
    c.fillStyle = C_EXT.technicGrey;
    rr(c, -8, -beamH / 2, beamLen + 16, beamH, 7);
    strokeFill(c, C_EXT.technicGrey, C.ink, 2.4);

    // Các lỗ tròn Technic dọc theo dầm
    var holeStep = 11;
    var numHoles = 9;
    for (var hi = 0; hi <= numHoles; hi++) {
      var hx = hi * holeStep;
      c.fillStyle = C.hole;
      c.beginPath();
      c.arc(hx, 0, 3.2, 0, Math.PI * 2);
      c.fill();
      c.strokeStyle = C.ink;
      c.lineWidth = 1.3;
      c.stroke();
    }

    // Các chốt đen kỹ thuật (Lego pin 2780) cố định tại 2 đầu và giữa
    var pins = [0, 4, numHoles];
    for (var pi = 0; pi < pins.length; pi++) {
      var px = pins[pi] * holeStep;
      c.fillStyle = C_EXT.technicDark;
      c.beginPath();
      c.arc(px, 0, 2.5, 0, Math.PI * 2);
      c.fill();
    }
    c.restore();

    // Dầm giằng chéo tăng cứng (tam giác kết cấu Technic)
    c.save();
    c.fillStyle = '#b0bec5';
    c.beginPath();
    c.moveTo(rearAxleX + 12, rearAxleY - 2);
    c.lineTo(0, rearAxleY - 14);
    c.lineTo(frontAxleX - 14, frontAxleY - 2);
    c.lineTo(frontAxleX - 22, frontAxleY - 2);
    c.lineTo(0, rearAxleY - 7);
    c.lineTo(rearAxleX + 4, rearAxleY - 2);
    c.closePath();
    strokeFill(c, '#b0bec5', C.ink, 1.8);
    c.restore();

    // 4.4. CẢN TRƯỚC BẢO VỆ ĐẦU XE (FRONT BUMPER) - GÓI NÂNG CẤP M4
    if (bumper) {
      c.save();
      // Khung cản cong vươn ra bảo vệ mũi xe
      c.fillStyle = C_EXT.bumperDark;
      c.beginPath();
      c.moveTo(frontAxleX + 6, frontAxleY);
      c.lineTo(frontAxleX + 26, frontAxleY);
      c.arc(frontAxleX + 26, frontAxleY - 8, 8, Math.PI / 2, -Math.PI / 2, true);
      c.lineTo(frontAxleX + 10, frontAxleY - 16);
      c.lineTo(frontAxleX + 6, frontAxleY - 10);
      c.closePath();
      strokeFill(c, C_EXT.bumperDark, C.ink, 2.2);

      // Miếng đệm cao su giảm chấn màu cam nổi bật
      c.fillStyle = C.orange;
      rr(c, frontAxleX + 28, frontAxleY - 14, 6, 14, 2);
      strokeFill(c, C.orange, C.ink, 1.8);
      c.restore();
    }

    // 4.5. BÁNH SAU LỚN VÀNH ĐÚC KÈM LỐP XANH NGỌC (BP-8841 + BP-8850)
    // Bán kính ngoài R = 24, bán kính vành = 17
    c.save();
    c.translate(rearAxleX, rearAxleY);
    c.rotate(wheelAngle);

    // Lốp cao su xanh ngọc đặc trưng Kit Alpha 330
    c.fillStyle = C_EXT.tireTurquoise;
    c.beginPath();
    c.arc(0, 0, 24, 0, Math.PI * 2);
    strokeFill(c, C_EXT.tireTurquoise, C.ink, 2.6);

    // Rãnh gai lốp cao su bám đường
    c.strokeStyle = C_EXT.tireTurquoiseDark;
    c.lineWidth = 2.4;
    for (var ti = 0; ti < 8; ti++) {
      var tAng = (ti * Math.PI) / 4;
      c.beginPath();
      c.moveTo(Math.cos(tAng) * 20, Math.sin(tAng) * 20);
      c.lineTo(Math.cos(tAng) * 24, Math.sin(tAng) * 24);
      c.stroke();
    }

    // Vành bánh đúc màu trắng kem
    c.fillStyle = C.paperWarm;
    c.beginPath();
    c.arc(0, 0, 16, 0, Math.PI * 2);
    strokeFill(c, C.paperWarm, C.ink, 2.0);

    // Các nan hoa vành bánh xe
    c.fillStyle = C_EXT.technicDark;
    for (var spk = 0; spk < 5; spk++) {
      var sAng = (spk * Math.PI * 2) / 5;
      c.beginPath();
      c.arc(Math.cos(sAng) * 9, Math.sin(sAng) * 9, 3.2, 0, Math.PI * 2);
      c.fill();
    }

    // Ổ bạc trục màu vàng (Lego bushing 3713)
    c.fillStyle = C.gold;
    c.beginPath();
    c.arc(0, 0, 5.0, 0, Math.PI * 2);
    strokeFill(c, C.gold, C.ink, 1.8);

    // Lỗ chốt trục đen ở tâm
    c.fillStyle = C.ink;
    c.beginPath();
    c.arc(0, 0, 2.0, 0, Math.PI * 2);
    c.fill();
    c.restore();

    // 4.6. BÁNH TRƯỚC (TIÊU CHUẨN: BÁNH ĐAI NHỎ 4185; HOẶC NÂNG CẤP: BÁNH LỚN)
    c.save();
    c.translate(frontAxleX, frontAxleY);
    c.rotate(wheelAngle * (bigFront ? 1.0 : 1.85)); // Bánh nhỏ quay nhanh hơn

    if (bigFront) {
      // Đã nâng cấp: bánh trước lớn y hệt bánh sau kèm lốp xanh ngọc
      c.fillStyle = C_EXT.tireTurquoise;
      c.beginPath();
      c.arc(0, 0, 24, 0, Math.PI * 2);
      strokeFill(c, C_EXT.tireTurquoise, C.ink, 2.6);

      c.strokeStyle = C_EXT.tireTurquoiseDark;
      c.lineWidth = 2.4;
      for (var fti = 0; fti < 8; fti++) {
        var ftAng = (fti * Math.PI) / 4;
        c.beginPath();
        c.moveTo(Math.cos(ftAng) * 20, Math.sin(ftAng) * 20);
        c.lineTo(Math.cos(ftAng) * 24, Math.sin(ftAng) * 24);
        c.stroke();
      }

      c.fillStyle = C.paperWarm;
      c.beginPath();
      c.arc(0, 0, 16, 0, Math.PI * 2);
      strokeFill(c, C.paperWarm, C.ink, 2.0);

      c.fillStyle = C_EXT.technicDark;
      for (var fspk = 0; fspk < 5; fspk++) {
        var fsAng = (fspk * Math.PI * 2) / 5;
        c.beginPath();
        c.arc(Math.cos(fsAng) * 9, Math.sin(fsAng) * 9, 3.2, 0, Math.PI * 2);
        c.fill();
      }

      c.fillStyle = C.gold;
      c.beginPath();
      c.arc(0, 0, 5.0, 0, Math.PI * 2);
      strokeFill(c, C.gold, C.ink, 1.8);
    } else {
      // Mặc định: bánh xe đai nhỏ dẫn hướng (4185)
      // Bán kính R = 13
      c.fillStyle = C_EXT.pulleyYellow;
      c.beginPath();
      c.arc(0, 0, 13, 0, Math.PI * 2);
      strokeFill(c, C_EXT.pulleyYellow, C.ink, 2.4);

      // Rãnh luồn dây đai của ròng rọc
      c.strokeStyle = C_EXT.pulleyRim;
      c.lineWidth = 2.0;
      c.beginPath();
      c.arc(0, 0, 9.5, 0, Math.PI * 2);
      c.stroke();

      // 4 lỗ giảm trọng lượng trên bánh đai
      c.fillStyle = C.inkSoft;
      for (var pi4 = 0; pi4 < 4; pi4++) {
        var p4Ang = (pi4 * Math.PI) / 2;
        c.beginPath();
        c.arc(Math.cos(p4Ang) * 6, Math.sin(p4Ang) * 6, 2.0, 0, Math.PI * 2);
        c.fill();
      }

      // Tâm bạc trục
      c.fillStyle = C.hole;
      c.beginPath();
      c.arc(0, 0, 3.6, 0, Math.PI * 2);
      strokeFill(c, C.hole, C.ink, 1.4);
    }

    c.fillStyle = C.ink;
    c.beginPath();
    c.arc(0, 0, 1.8, 0, Math.PI * 2);
    c.fill();

    c.restore();

    c.restore();
  }

  // =========================================================================
  // 5. VẠCH ĐÍCH & CỜ ĐÍCH CA-RÔ CHIẾN THẮNG (FINISH LINE)
  // =========================================================================
  function finishLine(c, x, gy, opts) {
    opts = opts || {};
    x = (typeof x === 'number') ? x : 710;
    gy = (typeof gy === 'number') ? gy : GY0;
    var reached = !!opts.reached;
    var state = opts.state || (reached ? 'win' : 'idle');
    var t = opts.t || 0;

    c.save();

    // 5.1. VẠCH SƠN KẺ ĐÍCH TRÊN MẶT ĐƯỜNG
    var lineW = 28;
    var lineH = 18;
    var lineY = gy - lineH / 2;

    // Lưới ô ca-rô trắng đen trên mặt đường
    var numCols = 4;
    var numRows = 2;
    var cellW = lineW / numCols;
    var cellH = lineH / numRows;

    c.save();
    c.strokeStyle = C.ink;
    c.lineWidth = 2.0;
    c.strokeRect(x - lineW / 2, lineY, lineW, lineH);

    for (var ri = 0; ri < numRows; ri++) {
      for (var ci = 0; ci < numCols; ci++) {
        var isBlack = (ri + ci) % 2 === 0;
        c.fillStyle = isBlack ? C.ink : C.paperWarm;
        c.fillRect(x - lineW / 2 + ci * cellW, lineY + ri * cellH, cellW, cellH);
      }
    }
    c.restore();

    // 5.2. CỘT CỜ ĐÍCH CA-RÔ (CHECKERED FLAG)
    var poleX = x + 16;
    var poleH = 135;
    var poleTopY = gy - poleH;

    // Chân cắm cột cờ
    c.fillStyle = C.technicDark || '#37474f';
    rr(c, poleX - 7, gy - 6, 14, 12, 3);
    strokeFill(c, C.technicDark || '#37474f', C.ink, 1.8);

    // Cột cờ trắng bạc
    c.fillStyle = C.hole;
    rr(c, poleX - 2.5, poleTopY, 5, poleH, 2);
    strokeFill(c, C.hole, C.ink, 2.0);

    // Quả cầu vàng trên đỉnh cột cờ
    c.fillStyle = C.gold;
    c.beginPath();
    c.arc(poleX, poleTopY - 4, 7, 0, Math.PI * 2);
    strokeFill(c, C.gold, C.ink, 2.0);

    // 5.3. LÁ CỜ CA-RÔ VẪY THEO GIÓ
    // Kích thước cờ: rộng 48, cao 32
    var flagW = 48;
    var flagH = 32;
    var waveSpeed = (state === 'win') ? 8 : 4;
    var waveAmp = (state === 'win') ? 6 : 3.5;

    c.save();
    c.translate(poleX + 2.5, poleTopY + 4);

    var cols = 6;
    var rows = 4;
    var cw = flagW / cols;
    var ch = flagH / rows;

    for (var col = 0; col < cols; col++) {
      var x1 = col * cw;
      var x2 = (col + 1) * cw;
      var wy1 = Math.sin(t * waveSpeed + col * 0.7) * waveAmp;
      var wy2 = Math.sin(t * waveSpeed + (col + 1) * 0.7) * waveAmp;

      for (var row = 0; row < rows; row++) {
        var y1_top = row * ch + wy1;
        var y1_bot = (row + 1) * ch + wy1;
        var y2_top = row * ch + wy2;
        var y2_bot = (row + 1) * ch + wy2;

        var isDark = (col + row) % 2 === 0;
        c.fillStyle = isDark ? C.ink : C.paperWarm;

        c.beginPath();
        c.moveTo(x1, y1_top);
        c.lineTo(x2, y2_top);
        c.lineTo(x2, y2_bot);
        c.lineTo(x1, y1_bot);
        c.closePath();
        c.fill();
      }
    }

    // Viền lá cờ
    c.strokeStyle = C.ink;
    c.lineWidth = 2.0;
    c.beginPath();
    c.moveTo(0, Math.sin(t * waveSpeed) * waveAmp);
    for (var colBorder = 0; colBorder <= cols; colBorder++) {
      var bx = colBorder * cw;
      var by = Math.sin(t * waveSpeed + colBorder * 0.7) * waveAmp;
      c.lineTo(bx, by);
    }
    c.lineTo(flagW, flagH + Math.sin(t * waveSpeed + cols * 0.7) * waveAmp);
    for (var colBorder2 = cols; colBorder2 >= 0; colBorder2--) {
      var bx2 = colBorder2 * cw;
      var by2 = flagH + Math.sin(t * waveSpeed + colBorder2 * 0.7) * waveAmp;
      c.lineTo(bx2, by2);
    }
    c.closePath();
    c.stroke();

    c.restore();

    // 5.4. HIỆU ỨNG CHÚC MỪNG KHI ĐẠT ĐÍCH
    if (state === 'win') {
      c.save();
      // Vòng hào quang vàng lấp lánh quanh đỉnh cờ
      var glowPulse = 1 + 0.15 * Math.sin(t * 8);
      c.strokeStyle = C.gold;
      c.lineWidth = 2.5;
      c.beginPath();
      c.arc(poleX, poleTopY - 4, 18 * glowPulse, 0, Math.PI * 2);
      c.stroke();
      c.restore();
    }

    c.restore();
  }

  // =========================================================================
  // 6. HIỆU ỨNG VỆT TỐC ĐỘ & BỤI LĂN BÁNH (SPEED PUFF / DUST TRAIL)
  // =========================================================================
  function speedPuff(c, x, y, opts) {
    opts = opts || {};
    x = (typeof x === 'number') ? x : 200;
    y = (typeof y === 'number') ? y : GY0;
    var speed = opts.speed || 1.0;
    var surface = opts.surface || 'wood';
    var t = opts.t || 0;

    if (speed <= 0.05) return;

    c.save();
    c.translate(x, y);

    var count = Math.min(8, Math.floor(speed * 6) + 2);

    for (var i = 0; i < count; i++) {
      var phase = (t * 6 + i * 1.3) % 1.0;
      var px = -15 - phase * (35 + speed * 25) - i * 6;
      var py = -3 - Math.sin(phase * Math.PI) * (8 + i * 2);
      var pr = (2.5 + i * 1.5) * (1 - phase * 0.4);

      if (surface === 'ice') {
        // Tinh thể băng tuyết bay
        c.fillStyle = 'rgba(224, 247, 250, 0.8)';
        c.beginPath();
        c.arc(px, py, pr * 0.8, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = '#ffffff';
        c.fillRect(px - 1, py - 1, 2, 2);
      } else if (surface === 'rough') {
        // Bụi đất sỏi và vụn cỏ
        c.fillStyle = (i % 2 === 0) ? 'rgba(92, 64, 51, 0.7)' : 'rgba(109, 184, 67, 0.7)';
        c.beginPath();
        c.arc(px, py, pr, 0, Math.PI * 2);
        c.fill();
      } else {
        // Bụi gỗ ấm
        c.fillStyle = 'rgba(235, 220, 195, 0.75)';
        c.beginPath();
        c.arc(px, py, pr, 0, Math.PI * 2);
        c.fill();
        c.strokeStyle = 'rgba(141, 110, 99, 0.4)';
        c.lineWidth = 1.0;
        c.stroke();
      }
    }

    // Tia gió lướt
    c.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    c.lineWidth = 2.0;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(-10, -18);
    c.lineTo(-30 - speed * 20, -18);
    c.moveTo(-6, -26);
    c.lineTo(-24 - speed * 16, -26);
    c.stroke();

    c.restore();
  }

  // =========================================================================
  // 7. HIỆU ỨNG PHÁO HOA ĂN MỪNG CHIẾN THẮNG (SPARKLES & CELEBRATION)
  // =========================================================================
  function sparkles(c, x, y, opts) {
    opts = opts || {};
    x = (typeof x === 'number') ? x : 710;
    y = (typeof y === 'number') ? y : GY0 - 80;
    var t = opts.t || 0;
    var count = opts.count || 12;
    var radius = opts.radius || 55;

    c.save();
    c.translate(x, y);

    var colors = [C.gold, C.accent, C.ok, C.orange, C.warn, C.paper];

    for (var s = 0; s < count; s++) {
      var ang = (s / count) * Math.PI * 2 + t * 1.8;
      var dist = radius * (0.45 + 0.55 * Math.sin(t * 3.5 + s * 1.2));
      var px = Math.cos(ang) * dist;
      var py = Math.sin(ang) * dist;
      var sz = 3.0 + 2.0 * Math.sin(t * 5 + s);
      var col = colors[s % colors.length];

      c.fillStyle = col;
      c.save();
      c.translate(px, py);
      c.rotate(t * 4 + s);

      if (s % 3 === 0) {
        // Ngôi sao 4 cánh
        c.beginPath();
        c.moveTo(0, -sz * 1.8);
        c.lineTo(sz * 0.6, -sz * 0.6);
        c.lineTo(sz * 1.8, 0);
        c.lineTo(sz * 0.6, sz * 0.6);
        c.lineTo(0, sz * 1.8);
        c.lineTo(-sz * 0.6, sz * 0.6);
        c.lineTo(-sz * 1.8, 0);
        c.lineTo(-sz * 0.6, -sz * 0.6);
        c.closePath();
        c.fill();
      } else if (s % 3 === 1) {
        // Mảnh hoa giấy hình tròn
        c.beginPath();
        c.arc(0, 0, sz, 0, Math.PI * 2);
        c.fill();
      } else {
        // Mảnh ruy băng chữ nhật xoay
        c.fillRect(-sz, -sz * 0.4, sz * 2, sz * 0.8);
      }
      c.restore();
    }

    c.restore();
  }

  // =========================================================================
  // 8. NỐT NHẠC CHIẾN THẮNG (NOTE A)
  // =========================================================================
  function noteA(c, x, y, opts) {
    opts = opts || {};
    x = (typeof x === 'number') ? x : 710;
    y = (typeof y === 'number') ? y : GY0 - 100;
    var t = opts.t || 0;

    c.save();
    c.translate(x, y);

    for (var n = 0; n < 3; n++) {
      var phase = (t * 1.6 + n * 0.33) % 1.0;
      var ny = -phase * 65;
      var nx = Math.sin(phase * Math.PI * 2 + n) * 22 + (n - 1) * 24;
      var alpha = Math.sin(phase * Math.PI);
      var rot = (phase - 0.5) * 0.5;

      c.save();
      c.translate(nx, ny);
      c.rotate(rot);
      c.globalAlpha = Math.max(0, Math.min(1, alpha));

      // Nốt nhạc vàng rực rỡ
      c.fillStyle = C.gold;
      c.strokeStyle = C.ink;
      c.lineWidth = 1.8;

      if (n % 2 === 0) {
        // Nốt móc đơn
        c.beginPath();
        c.ellipse(0, 0, 7, 5, -0.35, 0, Math.PI * 2);
        c.fill();
        c.stroke();

        c.beginPath();
        c.moveTo(5, -2);
        c.lineTo(5, -22);
        c.quadraticCurveTo(12, -20, 14, -12);
        c.stroke();
      } else {
        // Nốt đôi liên kết
        c.beginPath();
        c.ellipse(-7, 0, 6, 4.5, -0.35, 0, Math.PI * 2);
        c.fill();
        c.stroke();

        c.beginPath();
        c.ellipse(8, -2, 6, 4.5, -0.35, 0, Math.PI * 2);
        c.fill();
        c.stroke();

        c.beginPath();
        c.moveTo(-2, -2); c.lineTo(-2, -20);
        c.lineTo(13, -22); c.lineTo(13, -4);
        c.stroke();
      }

      // Hạt lấp lánh cạnh nốt
      c.fillStyle = C.paper;
      c.beginPath();
      c.arc(8, -14, 1.8, 0, Math.PI * 2);
      c.fill();

      c.restore();
    }

    c.restore();
  }

  // =========================================================================
  // 9. BIỂU TƯỢNG HUY HIỆU 4 GÓI SÁNG TẠO M4 (UPGRADE BADGES)
  // =========================================================================
  // type: 'bigFrontWheels' | 'cargoWeight' | 'spoilerWing' | 'frontBumper'
  function upgrade(c, type, x, y, opts) {
    opts = opts || {};
    var size = opts.size || 60;
    var active = !!opts.active;

    c.save();
    c.translate(x, y);

    // Vỏ huy hiệu tròn
    var rad = size / 2;
    c.fillStyle = active ? '#e8f5e9' : C.paperWarm;
    c.beginPath();
    c.arc(0, 0, rad, 0, Math.PI * 2);
    strokeFill(c, active ? '#e8f5e9' : C.paperWarm, active ? C.ok : C.ink, active ? 3.0 : 2.2);

    if (active) {
      c.strokeStyle = C.ok;
      c.lineWidth = 1.8;
      c.beginPath();
      c.arc(0, 0, rad - 4, 0, Math.PI * 2);
      c.stroke();
    }

    // Vẽ biểu tượng bên trong
    var iconScale = size / 60;
    c.scale(iconScale, iconScale);

    if (type === 'bigFrontWheels') {
      // Bánh xe lớn có lốp xanh ngọc
      c.fillStyle = C_EXT.tireTurquoise;
      c.beginPath();
      c.arc(0, 0, 16, 0, Math.PI * 2);
      strokeFill(c, C_EXT.tireTurquoise, C.ink, 2.0);

      c.fillStyle = C.paperWarm;
      c.beginPath();
      c.arc(0, 0, 10, 0, Math.PI * 2);
      strokeFill(c, C.paperWarm, C.ink, 1.6);

      c.fillStyle = C.gold;
      c.beginPath();
      c.arc(0, 0, 4, 0, Math.PI * 2);
      strokeFill(c, C.gold, C.ink, 1.4);
    } else if (type === 'cargoWeight') {
      // Khối gia tải thân xe
      c.fillStyle = C.gold;
      rr(c, -16, -11, 32, 22, 4);
      strokeFill(c, C.gold, C.ink, 2.0);

      c.fillStyle = C.ink;
      c.beginPath();
      c.moveTo(-6, 11); c.lineTo(0, -11); c.lineTo(5, -11); c.lineTo(-1, 11); c.closePath();
      c.fill();

      c.fillStyle = C.hole;
      c.beginPath();
      c.arc(-10, -4, 2.2, 0, Math.PI * 2);
      c.arc(10, -4, 2.2, 0, Math.PI * 2);
      c.fill();
    } else if (type === 'spoilerWing') {
      // Cánh lướt gió khí động học
      c.fillStyle = C.technicDark || '#37474f';
      c.beginPath();
      c.moveTo(-8, 12); c.lineTo(-14, -4); c.lineTo(-8, -4); c.lineTo(-2, 12); c.closePath();
      c.moveTo(8, 12); c.lineTo(2, -4); c.lineTo(8, -4); c.lineTo(14, 12); c.closePath();
      strokeFill(c, C.technicDark || '#37474f', C.ink, 1.6);

      c.fillStyle = C.accent;
      c.beginPath();
      c.moveTo(-22, -4); c.lineTo(22, -4); c.lineTo(25, -12); c.lineTo(-19, -12); c.closePath();
      strokeFill(c, C.accent, C.ink, 2.0);

      c.fillStyle = C.gold;
      c.fillRect(-18, -10, 38, 2.5);
    } else if (type === 'frontBumper') {
      // Cản trước chống va đập
      c.fillStyle = C_EXT.bumperDark;
      c.beginPath();
      c.arc(0, 0, 16, -Math.PI * 0.7, Math.PI * 0.7);
      c.lineTo(4, 11);
      c.arc(4, 0, 11, Math.PI * 0.65, -Math.PI * 0.65, true);
      c.closePath();
      strokeFill(c, C_EXT.bumperDark, C.ink, 2.0);

      c.fillStyle = C.orange;
      rr(c, 10, -10, 6, 20, 2);
      strokeFill(c, C.orange, C.ink, 1.6);
    }

    c.restore();
  }

  // =========================================================================
  // XUẤT GIAO DIỆN window.Lop1Bai01Art
  // =========================================================================
  var Lop1Bai01Art = {
    W: W0,
    H: H0,
    GROUND_Y: GY0,
    LINE: LINE,
    C: C,
    C_EXT: C_EXT,

    background: background,
    ramp: ramp,
    car: car,
    robot: car, // Alias quen thuộc
    finishLine: finishLine,
    speedPuff: speedPuff,
    dust: speedPuff, // Alias
    sparkles: sparkles,
    celebration: sparkles, // Alias
    noteA: noteA,
    upgrade: upgrade,
    tree: tree,
    bush: bush,

    // Các alias mở rộng tương thích
    drawBackground: background,
    drawRamp: ramp,
    drawCar: car,
    drawRobot: car,
    drawFinishLine: finishLine,
    drawSpeedPuff: speedPuff,
    drawDust: speedPuff,
    drawSparkles: sparkles,
    drawCelebration: sparkles,
    drawNoteA: noteA,
    drawUpgrade: upgrade,
    drawTree: tree,
    drawBush: bush
  };

  if (typeof window !== 'undefined') {
    window.Lop1Bai01Art = Lop1Bai01Art;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Lop1Bai01Art;
  }
})();
