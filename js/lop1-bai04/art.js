// Thư viện vẽ cảnh Lớp 1 · Bài 04: "Cảm biến của robot - Máy khoan cảm biến chạm" (window.Lop1Bai04Art).
// Khung nhìn chuẩn: 900x560, nhìn NGANG (side-view), mặt sàn phòng khách GROUND_Y = 430.
// Dành cho học sinh Lớp 1 trên máy tính bảng: khối to, viền đậm C.ink, nét LINE = 2.6, không chữ trong hình, không vũ khí.
// Mô hình: Máy khoan thông minh ZM Alpha 330, cảm biến chạm BE-2257 làm cò bấm, động cơ BE-3578, Smart Hub BE-5158.
// Tương thích chuẩn ZMArt Alpha 330. Không dùng ảnh ngoài, không dùng font ngoài, không dùng Math.random() khi vẽ.
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

  // Nạp từ window.ZMArt nếu đã có
  if (typeof window !== 'undefined' && window.ZMArt && window.ZMArt.C) {
    C = window.ZMArt.C;
    LINE = window.ZMArt.LINE || LINE;
  }

  // Bảng màu chuyên biệt cho phòng khách, vật liệu tường & máy khoan Kit Alpha 330
  var C_EXT = {
    tileBase: '#e8f4f8',
    tileLine: '#cbd5e1',
    tileShine: '#ffffff',
    woodWall: '#dfba8a',
    woodPlankDark: '#9c6644',
    woodFloor: '#d7a87e',
    woodFloorPlank: '#b08968',
    woodFloorDark: '#7f5539',
    plasterWall: '#f8fafc',
    plasterShade: '#e2e8f0',
    technicGrey: '#eceff1',
    technicDark: '#37474f',
    drillSteel: '#78909c',
    drillSteelLight: '#cfd8dc',
    drillSteelDark: '#455a64',
    depthRuler: '#00b4d8',
    shieldGlass: 'rgba(224, 247, 250, 0.72)',
    shieldGlassRim: 'rgba(61, 193, 220, 0.85)',
    brickRed: '#d9534f',
    woodChip: '#a07855',
    plasterDust: '#e2e8f0',
    baseboardWood: '#8d5b36'
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

  // Dữ liệu hạt bụi phoi khoan cố định (tránh Math.random để không chớp giật)
  var DUST_SEEDS = [
    { dx: -12, dy: -8, vx: -36, vy: -42, r: 3.5, f: 1.2 },
    { dx: -18, dy: -3, vx: -58, vy: -22, r: 4.2, f: 2.1 },
    { dx: -14, dy: 6, vx: -42, vy: 16, r: 3.0, f: 1.6 },
    { dx: -22, dy: -14, vx: -68, vy: -52, r: 2.8, f: 2.8 },
    { dx: -8, dy: 11, vx: -28, vy: 38, r: 3.8, f: 2.4 },
    { dx: -26, dy: 3, vx: -72, vy: -6, r: 4.5, f: 1.4 },
    { dx: -16, dy: -18, vx: -50, vy: -64, r: 3.2, f: 3.3 },
    { dx: -20, dy: 14, vx: -60, vy: 46, r: 2.6, f: 2.0 },
    { dx: -30, dy: -6, vx: -82, vy: -30, r: 3.6, f: 1.8 },
    { dx: -10, dy: -24, vx: -32, vy: -75, r: 2.4, f: 3.0 }
  ];

  // Dữ liệu vết nứt gạch cố định khi bị khoan sai tốc độ
  var CRACK_SEGMENTS = [
    [ { x: 0, y: 0 }, { x: 12, y: -16 }, { x: 26, y: -22 }, { x: 38, y: -38 } ],
    [ { x: 0, y: 0 }, { x: -14, y: -14 }, { x: -28, y: -20 }, { x: -44, y: -28 } ],
    [ { x: 0, y: 0 }, { x: 16, y: 14 }, { x: 32, y: 22 }, { x: 48, y: 34 } ],
    [ { x: 0, y: 0 }, { x: -10, y: 16 }, { x: -22, y: 28 }, { x: -36, y: 44 } ],
    [ { x: 0, y: 0 }, { x: 24, y: 2 }, { x: 42, y: -4 }, { x: 56, y: 2 } ],
    [ { x: 0, y: 0 }, { x: -20, y: -4 }, { x: -38, y: 4 }, { x: -52, y: -2 } ]
  ];

  // =========================================================================
  // 1. BACKGROUND(c, {t, surface, wallColor})
  // Phòng khách nhìn ngang: sàn gỗ ấm, phào chân tường, tường phòng khách,
  // đèn treo trần & chậu cây cảnh trang trí. Hoàn toàn KHÔNG có chữ trong hình.
  // =========================================================================
  function background(c, opts) {
    opts = opts || {};
    var W = W0;
    var H = H0;
    var gy = GY0;
    var t = typeof opts.t === 'number' ? opts.t : 0;
    var surface = opts.surface || 'tile';

    c.save();

    // 1.1 Tường phòng khách bên trên (0 -> gy)
    var wallGrad = c.createLinearGradient(0, 0, 0, gy);
    if (surface === 'wood') {
      wallGrad.addColorStop(0, '#ebd5b3');
      wallGrad.addColorStop(1, '#dfba8a');
    } else if (surface === 'plaster') {
      wallGrad.addColorStop(0, '#ffffff');
      wallGrad.addColorStop(1, '#edf2f7');
    } else {
      // Gạch men / mặc định
      wallGrad.addColorStop(0, '#f4fafd');
      wallGrad.addColorStop(1, '#e3edf3');
    }
    c.fillStyle = wallGrad;
    c.fillRect(0, 0, W, gy);

    // Kẻ chỉ tường nhẹ nhàng tạo chiều sâu không gian
    c.strokeStyle = 'rgba(30, 42, 52, 0.05)';
    c.lineWidth = 1.5;
    for (var wy = 60; wy < gy; wy += 60) {
      c.beginPath();
      c.moveTo(0, wy);
      c.lineTo(W, wy);
      c.stroke();
    }

    // Đèn thả trần phòng khách góc trái (x = 130, y = 0..90)
    c.strokeStyle = C.ink;
    c.lineWidth = 2.0;
    c.beginPath();
    c.moveTo(130, 0);
    c.lineTo(130, 68);
    c.stroke();

    // Chao đèn hình nón vàng ấm
    c.beginPath();
    c.moveTo(106, 88);
    c.lineTo(154, 88);
    c.lineTo(142, 68);
    c.lineTo(118, 68);
    c.closePath();
    strokeFill(c, C.gold, C.ink, LINE);

    // Bóng đèn tròn phát sáng nhẹ
    c.beginPath();
    c.arc(130, 92, 7, 0, Math.PI * 2);
    strokeFill(c, C.paperWarm, C.ink, 1.8);

    // Quầng sáng đèn thả trần (gradient nhẹ)
    var lampGlow = c.createRadialGradient(130, 92, 6, 130, 160, 140);
    lampGlow.addColorStop(0, 'rgba(255, 220, 80, 0.28)');
    lampGlow.addColorStop(0.6, 'rgba(255, 220, 80, 0.08)');
    lampGlow.addColorStop(1, 'rgba(255, 220, 80, 0)');
    c.fillStyle = lampGlow;
    c.beginPath();
    c.moveTo(130, 92);
    c.lineTo(40, 300);
    c.lineTo(220, 300);
    c.closePath();
    c.fill();

    // Đồng hồ treo tường hình tròn tối giản (KHÔNG có chữ số)
    c.beginPath();
    c.arc(310, 95, 26, 0, Math.PI * 2);
    strokeFill(c, C.paper, C.ink, LINE);

    // Các vạch giờ (12 vạch chấm tròn nhỏ)
    c.fillStyle = C.inkSoft;
    for (var clk = 0; clk < 12; clk++) {
      var ca = (clk * Math.PI) / 6;
      c.beginPath();
      c.arc(310 + Math.cos(ca) * 20, 95 + Math.sin(ca) * 20, clk % 3 === 0 ? 2.2 : 1.2, 0, Math.PI * 2);
      c.fill();
    }
    // Kim giờ & kim phút (chuyển động rất chậm theo t)
    var mAng = (t * 0.15) % (Math.PI * 2) - Math.PI / 2;
    var hAng = (mAng / 12) + 0.4;
    c.strokeStyle = C.ink;
    c.lineWidth = 2.4;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(310, 95);
    c.lineTo(310 + Math.cos(hAng) * 11, 95 + Math.sin(hAng) * 11);
    c.stroke();
    c.beginPath();
    c.moveTo(310, 95);
    c.lineTo(310 + Math.cos(mAng) * 16, 95 + Math.sin(mAng) * 16);
    c.stroke();
    c.beginPath();
    c.arc(310, 95, 3.0, 0, Math.PI * 2);
    c.fillStyle = C.warn;
    c.fill();

    // Chậu cây cảnh góc phòng khách (x = 70, gy = 430)
    var plantX = 70;
    // Chậu gốm bo góc
    rr(c, plantX - 22, gy - 42, 44, 42, [3, 3, 8, 8]);
    strokeFill(c, '#e07a5f', C.ink, LINE);
    // Vành chậu
    rr(c, plantX - 26, gy - 48, 52, 9, 3);
    strokeFill(c, '#f4a261', C.ink, LINE);
    // Các nhánh lá xanh sum suê lay nhẹ theo t
    for (var li = 0; li < 5; li++) {
      var leafSide = (li % 2 === 0 ? -1 : 1);
      var lAngle = leafSide * (0.35 + (li % 3) * 0.22) + Math.sin(t * 1.5 + li) * 0.05;
      var lLen = 30 + (li % 3) * 8;
      c.save();
      c.translate(plantX, gy - 46);
      c.rotate(lAngle);
      c.beginPath();
      c.ellipse(0, -lLen * 0.55, 11, lLen * 0.55, 0, 0, Math.PI * 2);
      strokeFill(c, li % 2 === 0 ? C.grass : C.grassLight, C.ink, 2.0);
      c.strokeStyle = C.grassDark;
      c.lineWidth = 1.6;
      c.beginPath();
      c.moveTo(0, 0);
      c.lineTo(0, -lLen);
      c.stroke();
      c.restore();
    }

    // 1.2 Phào chỉ chân tường (Baseboard skirting) (gy - 24 -> gy)
    rr(c, 0, gy - 24, W, 24, 0);
    strokeFill(c, C_EXT.baseboardWood, C.ink, LINE);
    // Gờ nẹp nổi màu sáng
    c.fillStyle = C_EXT.woodPlankDark;
    c.fillRect(0, gy - 24, W, 5);
    c.fillRect(0, gy - 6, W, 3);

    // 1.3 Sàn gỗ phòng khách (gy -> H)
    var floorGrad = c.createLinearGradient(0, gy, 0, H);
    floorGrad.addColorStop(0, C_EXT.woodFloor);
    floorGrad.addColorStop(1, C_EXT.woodFloorDark);
    c.fillStyle = floorGrad;
    c.fillRect(0, gy, W, H - gy);

    // Đường rãnh ghép các tấm ván sàn gỗ
    c.strokeStyle = C_EXT.woodPlankDark;
    c.lineWidth = 2.0;
    var plankH = 26;
    for (var py = gy + plankH; py < H; py += plankH) {
      c.beginPath();
      c.moveTo(0, py);
      c.lineTo(W, py);
      c.stroke();
    }
    // Các mối nối dọc so le của ván sàn
    c.lineWidth = 1.6;
    var row = 0;
    for (var ry = gy; ry < H; ry += plankH) {
      var offset = (row % 2) * 90;
      for (var px = offset; px < W; px += 180) {
        c.beginPath();
        c.moveTo(px, ry);
        c.lineTo(px, ry + plankH);
        c.stroke();
      }
      row++;
    }

    // Đường viền ngăn cách sàn và chân tường
    c.strokeStyle = C.ink;
    c.lineWidth = LINE;
    c.beginPath();
    c.moveTo(0, gy);
    c.lineTo(W, gy);
    c.stroke();

    c.restore();
  }

  // =========================================================================
  // 2. WALL(c, x, gy, {w, h, surface, targetActive, drilledDepth, cracked, t})
  // Mảng tường thao tác khoan với 3 bề mặt: 'tile' (gạch men bóng có ron),
  // 'wood' (tấm gỗ vân thớ), 'plaster' (thạch cao mịn).
  // Có tâm điểm khoan, lỗ khoan sâu dần, thước đo độ sâu và vết nứt khi khoan sai.
  // =========================================================================
  function wall(c, x, gy, opts) {
    if (typeof x === 'object') { opts = x; x = 540; gy = GY0; }
    x = typeof x === 'number' ? x : 540;
    gy = typeof gy === 'number' ? gy : GY0;
    opts = opts || {};

    var w = opts.w || 320;
    var h = opts.h || 370;
    var wallY = gy - h;
    var surface = opts.surface || 'tile';
    var targetActive = opts.targetActive !== undefined ? !!opts.targetActive : true;
    var drilledDepth = Math.max(0, Math.min(1, typeof opts.drilledDepth === 'number' ? opts.drilledDepth : 0));
    var cracked = !!opts.cracked;
    var t = typeof opts.t === 'number' ? opts.t : 0;
    var targetY = typeof opts.targetY === 'number' ? opts.targetY : (wallY + h * 0.46);
    var targetX = x + 75; // Tâm điểm lỗ khoan

    c.save();

    // 2.1 Khung bao mảng tường làm việc
    rr(c, x, wallY, w, h, 6);
    strokeFill(c, C.paper, C.ink, LINE);

    c.save();
    // Giới hạn trong khung tường
    c.beginPath();
    rr(c, x, wallY, w, h, 6);
    c.clip();

    if (surface === 'wood') {
      // BỀ MẶT GỖ: ghép các thanh ván dọc
      var woodGrad = c.createLinearGradient(x, 0, x + w, 0);
      woodGrad.addColorStop(0, '#e2c299');
      woodGrad.addColorStop(0.5, '#dfba8a');
      woodGrad.addColorStop(1, '#cb9d6d');
      c.fillStyle = woodGrad;
      c.fillRect(x, wallY, w, h);

      // Kẻ các thớ gỗ sọc dọc
      c.strokeStyle = C_EXT.woodPlankDark;
      c.lineWidth = 1.8;
      var plankW = 40;
      for (var vx = x; vx <= x + w; vx += plankW) {
        c.beginPath();
        c.moveTo(vx, wallY);
        c.lineTo(vx, wallY + h);
        c.stroke();
      }
      // Vân gỗ cong tự nhiên
      c.strokeStyle = 'rgba(127, 85, 57, 0.25)';
      c.lineWidth = 1.4;
      for (var gi = 0; gi < 8; gi++) {
        var gx = x + 20 + gi * 38;
        c.beginPath();
        c.moveTo(gx, wallY + 30);
        c.quadraticCurveTo(gx + 12, wallY + 120, gx - 6, wallY + 220);
        c.quadraticCurveTo(gx - 18, wallY + 310, gx + 4, wallY + h);
        c.stroke();
      }
    } else if (surface === 'plaster') {
      // BỀ MẶT THẠCH CAO: nền trắng ngà mịn
      var plGrad = c.createLinearGradient(x, wallY, x, wallY + h);
      plGrad.addColorStop(0, C_EXT.plasterWall);
      plGrad.addColorStop(1, C_EXT.plasterShade);
      c.fillStyle = plGrad;
      c.fillRect(x, wallY, w, h);

      // Vân xước nhẹ của thạch cao
      c.strokeStyle = 'rgba(203, 213, 225, 0.45)';
      c.lineWidth = 1.2;
      for (var py = wallY + 25; py < wallY + h; py += 32) {
        c.beginPath();
        c.moveTo(x + 10, py);
        c.lineTo(x + w - 10, py + Math.sin(py) * 4);
        c.stroke();
      }
    } else {
      // BỀ MẶT GẠCH MEN: ô gạch men bóng vuông vức có đường ron chỉ
      var tileGrad = c.createLinearGradient(x, wallY, x + w, wallY + h);
      tileGrad.addColorStop(0, '#f0f9ff');
      tileGrad.addColorStop(0.5, '#e0f2fe');
      tileGrad.addColorStop(1, '#bae6fd');
      c.fillStyle = tileGrad;
      c.fillRect(x, wallY, w, h);

      var tileSize = 52;
      // Đường ron gạch màu xám nhạt
      c.strokeStyle = C_EXT.tileLine;
      c.lineWidth = 3.0;
      for (var tx = x; tx <= x + w; tx += tileSize) {
        c.beginPath();
        c.moveTo(tx, wallY);
        c.lineTo(tx, wallY + h);
        c.stroke();
      }
      for (var ty = wallY; ty <= wallY + h; ty += tileSize) {
        c.beginPath();
        c.moveTo(x, ty);
        c.lineTo(x + w, ty);
        c.stroke();
      }

      // Ánh sáng bóng loáng phản chiếu trên từng viên gạch men
      c.strokeStyle = 'rgba(255, 255, 255, 0.75)';
      c.lineWidth = 2.0;
      for (var bx = x + 6; bx < x + w - 20; bx += tileSize) {
        for (var by = wallY + 6; by < wallY + h - 20; by += tileSize) {
          c.beginPath();
          c.moveTo(bx, by + 16);
          c.lineTo(bx + 16, by);
          c.stroke();
        }
      }
    }
    c.restore();

    // 2.2 Vị trí mục tiêu khoan (Target crosshair & bullseye)
    c.save();
    c.translate(targetX, targetY);

    if (drilledDepth < 0.05) {
      // Khi chưa khoan: hiện vòng định tâm nhấp nháy thu hút sự chú ý của bé
      var pulse = 0.5 + 0.5 * Math.sin(t * 5);
      if (targetActive) {
        c.fillStyle = 'rgba(67, 160, 71, ' + (0.18 + pulse * 0.18).toFixed(2) + ')';
        c.beginPath();
        c.arc(0, 0, 28, 0, Math.PI * 2);
        c.fill();
      }
      // Vòng tròn ngoài nét đứt
      c.strokeStyle = targetActive ? C.ok : C.inkSoft;
      c.lineWidth = 2.4;
      c.setLineDash([5, 4]);
      c.beginPath();
      c.arc(0, 0, 20, 0, Math.PI * 2);
      c.stroke();
      c.setLineDash([]);

      // Vòng tròn trong màu đỏ/vàng định vị
      c.beginPath();
      c.arc(0, 0, 9, 0, Math.PI * 2);
      strokeFill(c, targetActive ? C.warn : C.hole, C.ink, 2.0);

      // Tâm chữ thập (+) kỹ thuật
      c.strokeStyle = C.paper;
      c.lineWidth = 2.0;
      c.beginPath();
      c.moveTo(-6, 0); c.lineTo(6, 0);
      c.moveTo(0, -6); c.lineTo(0, 6);
      c.stroke();
    } else {
      // ĐÃ KHOAN: hiển thị lỗ khoan sâu dần
      var holeR = 10;
      var holeDepthPx = drilledDepth * 16;

      // Miệng lỗ khoan ngoài
      c.beginPath();
      c.ellipse(0, 0, holeR, holeR * 0.85, 0, 0, Math.PI * 2);
      strokeFill(c, C.ink, C.ink, LINE);

      // Chiều sâu bên trong lỗ khoan (hình trụ khoét sâu)
      var holeInner = c.createRadialGradient(-2, -2, 1, 0, 0, holeR);
      holeInner.addColorStop(0, '#000000');
      holeInner.addColorStop(0.7, '#1e293b');
      holeInner.addColorStop(1, '#475569');
      c.fillStyle = holeInner;
      c.beginPath();
      c.ellipse(0, 0, holeR - 1.5, (holeR - 1.5) * 0.85, 0, 0, Math.PI * 2);
      c.fill();

      // Vòng cữ đo độ sâu an toàn (Safe depth arc meter)
      c.strokeStyle = drilledDepth >= 0.85 ? C.ok : (drilledDepth > 0.4 ? C.gold : C.accent);
      c.lineWidth = 3.6;
      c.lineCap = 'round';
      c.beginPath();
      c.arc(0, 0, 24, -Math.PI * 0.5, -Math.PI * 0.5 + drilledDepth * Math.PI * 2);
      c.stroke();

      // Vòng tròn mốc đích 100% (an toàn bắt vít)
      c.strokeStyle = C.ink;
      c.lineWidth = 1.5;
      c.beginPath();
      c.arc(0, 0, 24, 0, Math.PI * 2);
      c.stroke();

      // Điểm mốc chuẩn xanh ngọc ở vạch đích (góc trên cùng)
      c.beginPath();
      c.arc(0, -24, 4, 0, Math.PI * 2);
      strokeFill(c, drilledDepth >= 0.85 ? C.ok : C.hole, C.ink, 1.8);
    }

    // 2.3 Vết nứt vỡ gạch men (khi quay nhanh làm nứt gạch men)
    if (cracked) {
      c.strokeStyle = C.ink;
      c.lineWidth = 2.4;
      c.lineCap = 'round';
      c.lineJoin = 'miter';
      for (var ci = 0; ci < CRACK_SEGMENTS.length; ci++) {
        var seg = CRACK_SEGMENTS[ci];
        c.beginPath();
        c.moveTo(seg[0].x, seg[0].y);
        for (var si = 1; si < seg.length; si++) {
          c.lineTo(seg[si].x, seg[si].y);
        }
        c.stroke();
      }

      // Vụn gạch văng ra quanh vết nứt
      c.fillStyle = C_EXT.brickRed;
      for (var f = 0; f < 6; f++) {
        var fx = Math.cos(f * 1.05) * (26 + (f % 3) * 10);
        var fy = Math.sin(f * 1.05) * (24 + (f % 2) * 12);
        c.beginPath();
        c.arc(fx, fy, 2.5, 0, Math.PI * 2);
        c.fill();
      }
    }

    c.restore();
    c.restore();
  }

  // =========================================================================
  // 3. DRILL(c, x, y, {t, triggerPressed, spinning, speed, depth, vibration, upgrades})
  // Mô hình máy khoan cầm tay thông minh ZM Alpha 330:
  // - 2 thanh dầm thẳng 15 lỗ làm thân ngang màu xanh ngọc (Technic Cyan)
  // - Cụm động cơ BE-3578 đặt đứng ở trước dẫn động hệ bánh răng 24 răng
  // - Trục mũi khoan xoay tít có khớp nối đỏ 59443 và mũi khoan thép
  // - Cảm biến chạm BE-2257 làm cò bấm (nút đỏ thụt vào khi bấm)
  // - Smart Hub BE-5158 gắn trên lưng
  // - Báng cầm L và chân đế BP-7002 đứng vững
  // - 4 gói nâng cấp: cò trợ lực (cam), tay cầm phụ, thước cữ xanh, tấm chắn phoi trong suốt.
  // =========================================================================
  function drill(c, x, y, opts) {
    if (typeof y === 'object') { opts = y; y = 240; }
    x = typeof x === 'number' ? x : 320;
    y = typeof y === 'number' ? y : 240;
    opts = opts || {};

    var t = typeof opts.t === 'number' ? opts.t : 0;
    var triggerPressed = !!opts.triggerPressed;
    var spinning = !!opts.spinning;
    var speed = opts.speed || (spinning ? 'high' : 'stop');
    var depth = Math.max(0, Math.min(1, typeof opts.depth === 'number' ? opts.depth : 0));
    var upg = opts.upgrades || {};
    var boostTrigger = !!upg.boostTrigger;
    var sideHandle = !!upg.sideHandle;
    var depthGauge = !!upg.depthGauge;
    var dustShield = !!upg.dustShield;

    // Tốc độ quay của bánh răng và mũi khoan
    var speedMult = speed === 'low' ? 8 : (speed === 'med' ? 18 : (speed === 'high' ? 32 : 0));
    if (!spinning) speedMult = 0;
    var spinAngle = t * speedMult;

    // Độ rung lắc cơ học (nếu có tay cầm phụ sideHandle thì giảm rung 60%)
    var vibAmp = opts.vibration !== undefined ? opts.vibration : (speedMult > 0 ? (speedMult > 20 ? 2.5 : 1.2) : 0);
    if (sideHandle) vibAmp *= 0.4;
    var vibX = vibAmp > 0 ? Math.sin(t * 48) * vibAmp : 0;
    var vibY = vibAmp > 0 ? Math.cos(t * 54) * vibAmp : 0;

    // Máy khoan tiến về phía trước theo depth (tối đa 36px)
    var forwardPush = depth * 36;

    c.save();
    c.translate(x + vibX + forwardPush, y + vibY);

    // =========================================================================
    // 3.1 BÁNG TAY CẦM VÀ CHÂN ĐẾ (L-Beams & Base BP-7002)
    // =========================================================================
    c.save();
    // Báng cầm gập góc chữ L nối từ thân sau hướng xuống dưới
    c.strokeStyle = C_EXT.technicDark;
    c.lineWidth = 18;
    c.lineCap = 'round';
    c.lineJoin = 'round';
    c.beginPath();
    c.moveTo(-70, 10);
    c.lineTo(-85, 80);
    c.lineTo(-45, 130);
    c.stroke();
    // Viền nét mực
    c.strokeStyle = C.ink;
    c.lineWidth = 2.2;
    c.stroke();

    // Các lỗ dầm tròn trên báng cầm L
    c.fillStyle = C.paper;
    for (var bi = 0; bi < 3; bi++) {
      var bx = -74 - bi * 4;
      var by = 30 + bi * 22;
      c.beginPath();
      c.arc(bx, by, 3.8, 0, Math.PI * 2);
      strokeFill(c, C.hole, C.ink, 1.6);
    }

    // Chân đế BP-7002 nằm ngang phía dưới (đế bằng phẳng)
    rr(c, -85, 130, 80, 18, 4);
    strokeFill(c, C_EXT.technicDark, C.ink, LINE);
    // Đệm mút cao su chống trượt ở đế
    rr(c, -80, 148, 70, 6, 2);
    strokeFill(c, C.road, C.ink, 1.8);
    // Chốt nối Technic màu đen trên chân đế
    for (var cpi = 0; cpi < 3; cpi++) {
      c.beginPath();
      c.arc(-70 + cpi * 25, 139, 3.2, 0, Math.PI * 2);
      strokeFill(c, C.ink, C.ink, 1.0);
    }
    c.restore();

    // =========================================================================
    // 3.2 CẢM BIẾN CHẠM BE-2257 (TOUCH SENSOR - CÒ BẤM MÁY KHOAN)
    // Gắn chúc xuống dưới thân sau, có nút bấm tròn màu đỏ.
    // =========================================================================
    c.save();
    var sensorX = -45;
    var sensorY = 16;
    var buttonRetract = triggerPressed ? 6 : 0; // Nút thụt vào 6px khi bấm

    // Khối hộp cảm biến màu xám sáng
    rr(c, sensorX - 16, sensorY, 32, 28, 4);
    strokeFill(c, C.paper, C.ink, LINE);

    // Khe rãnh gá màu xanh ngọc
    c.fillStyle = C.accent;
    c.fillRect(sensorX - 14, sensorY + 4, 28, 6);
    c.strokeRect(sensorX - 14, sensorY + 4, 28, 6);

    // Chốt trục gắn cảm biến vào dầm
    c.beginPath();
    c.arc(sensorX - 8, sensorY + 18, 3.2, 0, Math.PI * 2);
    c.arc(sensorX + 8, sensorY + 18, 3.2, 0, Math.PI * 2);
    strokeFill(c, C.hole, C.ink, 1.4);

    // Cò bấm tròn màu đỏ BE-2257 (Touch Button)
    var btnH = 14 - buttonRetract;
    rr(c, sensorX - 8, sensorY + 28, 16, btnH, [0, 0, 5, 5]);
    strokeFill(c, triggerPressed ? C.warnDark : C.warn, C.ink, 2.0);

    // Quầng sáng khi cảm biến chạm được kích hoạt (Pressed)
    if (triggerPressed) {
      c.fillStyle = 'rgba(229, 57, 53, 0.32)';
      c.beginPath();
      c.arc(sensorX, sensorY + 34, 18, 0, Math.PI * 2);
      c.fill();
    }

    // GÓI 1 (UPGRADE): CÒ TRỢ LỰC (BOOST TRIGGER)
    // Đòn bẩy mở rộng màu cam tăng lực đòn bẩy cho nút cảm biến
    if (boostTrigger) {
      c.save();
      // Khớp xoay chốt đòn bẩy
      var pPivotX = sensorX - 22;
      var pPivotY = sensorY + 22;
      c.beginPath();
      c.arc(pPivotX, pPivotY, 5, 0, Math.PI * 2);
      strokeFill(c, C.gold, C.ink, 2.0);

      // Cánh tay đòn bẩy màu cam uốn cong ôm lấy nút đỏ
      c.beginPath();
      c.moveTo(pPivotX, pPivotY);
      c.quadraticCurveTo(sensorX - 8, sensorY + 36 - buttonRetract, sensorX + 16, sensorY + 40 - buttonRetract);
      c.lineTo(sensorX + 14, sensorY + 49 - buttonRetract);
      c.quadraticCurveTo(sensorX - 12, sensorY + 44 - buttonRetract, pPivotX - 2, pPivotY + 8);
      c.closePath();
      strokeFill(c, C.orange, C.ink, 2.2);

      // Các gân sọc chống trượt trên tay cò màu cam
      c.strokeStyle = C.warnDark;
      c.lineWidth = 1.6;
      for (var gri = 0; gri < 3; gri++) {
        c.beginPath();
        c.moveTo(sensorX + 2 + gri * 4, sensorY + 39 - buttonRetract);
        c.lineTo(sensorX + 1 + gri * 4, sensorY + 46 - buttonRetract);
        c.stroke();
      }
      c.restore();
    }
    c.restore();

    // =========================================================================
    // 3.3 THÂN DẦM NGANG TECHNIC (2 THANH DẦM 15 LỖ BP-32278)
    // =========================================================================
    c.save();
    var beamW = 160;
    var beamH = 20;
    var beamX = -100;
    var beamY = -10;

    // Thanh dầm thẳng màu xanh ngọc ZM Alpha 330
    rr(c, beamX, beamY, beamW, beamH, 5);
    strokeFill(c, C.accent, C.ink, LINE);

    // 15 lỗ tròn Technic dọc thân dầm
    var holeSpacing = 10;
    for (var hi = 0; hi < 15; hi++) {
      var hx = beamX + 10 + hi * holeSpacing;
      var hy = beamY + beamH * 0.5;
      c.beginPath();
      c.arc(hx, hy, 3.6, 0, Math.PI * 2);
      strokeFill(c, C.hole, C.ink, 1.4);
    }
    c.restore();

    // =========================================================================
    // 3.4 SMART HUB RCU BE-5158 (GẮN TRÊN LƯNG THÂN SAU)
    // =========================================================================
    c.save();
    var hubX = -92;
    var hubY = -56;
    var hubW = 74;
    var hubH = 46;

    // Khối Smart Hub màu trắng kem viền bo tròn
    rr(c, hubX, hubY, hubW, hubH, 6);
    strokeFill(c, C.paperWarm, C.ink, LINE);

    // Dải sọc công nghệ màu xanh ngọc
    c.fillStyle = C.accent;
    c.fillRect(hubX + 6, hubY + 12, hubW - 12, 6);
    c.strokeRect(hubX + 6, hubY + 12, hubW - 12, 6);

    // 3 nút điều khiển tròn trên mặt Smart Hub
    // Nút tròn lớn trung tâm
    c.beginPath();
    c.arc(hubX + hubW * 0.5, hubY + 28, 8, 0, Math.PI * 2);
    strokeFill(c, spinning ? C.ok : C.hole, C.ink, 1.8);

    // 2 nút phụ màu vàng
    c.beginPath();
    c.arc(hubX + 18, hubY + 28, 4.5, 0, Math.PI * 2);
    c.arc(hubX + hubW - 18, hubY + 28, 4.5, 0, Math.PI * 2);
    strokeFill(c, C.gold, C.ink, 1.4);

    // Đèn LED trạng thái phát sáng khi máy đang quay
    if (spinning) {
      c.fillStyle = C.ok;
      c.beginPath();
      c.arc(hubX + hubW * 0.5, hubY + 7, 3, 0, Math.PI * 2);
      c.fill();
    }

    // Dây cáp kết nối từ Smart Hub xuống động cơ
    c.strokeStyle = C.ink;
    c.lineWidth = 3.0;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(hubX + hubW - 4, hubY + 14);
    c.quadraticCurveTo(hubX + hubW + 18, hubY + 6, hubX + hubW + 28, -26);
    c.stroke();
    c.restore();

    // =========================================================================
    // 3.5 CỤM ĐẦU MÁY MANG ĐỘNG CƠ BE-3578 & HỆ BÁNH RĂNG 24 RĂNG
    // Động cơ đặt dựng đứng, bánh răng 24 răng truyền chuyển động quay mũi khoan.
    // =========================================================================
    c.save();
    var motorX = 22;
    var motorY = -62;
    var motorW = 44;
    var motorH = 62;

    // Khối động cơ BE-3578 màu xám sáng
    rr(c, motorX, motorY, motorW, motorH, 5);
    strokeFill(c, C_EXT.technicGrey, C.ink, LINE);

    // Khe tản nhiệt động cơ
    c.strokeStyle = C_EXT.technicDark;
    c.lineWidth = 2.0;
    for (var mi = 0; mi < 3; mi++) {
      c.beginPath();
      c.moveTo(motorX + 8, motorY + 14 + mi * 8);
      c.lineTo(motorX + motorW - 8, motorY + 14 + mi * 8);
      c.stroke();
    }

    // GÓI 2 (UPGRADE): TAY CẦM PHỤ CHỐNG RUNG (SIDE HANDLE)
    // Tay nắm phụ dựng đứng phía trước giúp giữ chắc mũi khoan
    if (sideHandle) {
      c.save();
      // Khung gá gắn vào cụm động cơ
      rr(c, motorX + 8, motorY - 14, 28, 14, 3);
      strokeFill(c, C_EXT.technicDark, C.ink, 2.0);

      // Cán tay cầm dựng đứng hướng lên
      rr(c, motorX + 16, motorY - 58, 14, 46, 5);
      strokeFill(c, C.gold, C.ink, 2.2);

      // Các gờ cao su bọc tay cầm chống rung màu xám sẫm
      c.fillStyle = C_EXT.technicDark;
      for (var shi = 0; shi < 4; shi++) {
        c.fillRect(motorX + 14, motorY - 52 + shi * 9, 18, 4);
      }
      // Núm tròn đỉnh tay cầm
      c.beginPath();
      c.arc(motorX + 23, motorY - 60, 9, 0, Math.PI * 2);
      strokeFill(c, C.orange, C.ink, 2.0);
      c.restore();
    }

    // Bánh răng 24 răng (3648) màu vàng trên trục động cơ
    var gearX = motorX + 22;
    var gearY = 0;
    var gearR = 19;
    c.save();
    c.translate(gearX, gearY);
    c.rotate(spinAngle);
    // Vẽ bánh răng 12 răng biểu trưng cho 24 răng
    c.beginPath();
    var teeth = 12;
    for (var ti = 0; ti < teeth; ti++) {
      var a0 = (ti * Math.PI * 2) / teeth;
      var aStep = (Math.PI * 2) / teeth;
      var rIn = gearR * 0.82;
      var rOut = gearR;
      if (ti === 0) c.moveTo(Math.cos(a0) * rIn, Math.sin(a0) * rIn);
      else c.lineTo(Math.cos(a0) * rIn, Math.sin(a0) * rIn);
      c.lineTo(Math.cos(a0 + aStep * 0.25) * rOut, Math.sin(a0 + aStep * 0.25) * rOut);
      c.lineTo(Math.cos(a0 + aStep * 0.6) * rOut, Math.sin(a0 + aStep * 0.6) * rOut);
      c.lineTo(Math.cos(a0 + aStep * 0.85) * rIn, Math.sin(a0 + aStep * 0.85) * rIn);
    }
    c.closePath();
    strokeFill(c, C.gold, C.ink, 2.0);

    // Tâm bánh răng có lỗ trục chữ thập
    c.beginPath();
    c.arc(0, 0, gearR * 0.45, 0, Math.PI * 2);
    strokeFill(c, C.paper, C.ink, 1.8);
    c.fillStyle = C.ink;
    c.fillRect(-2, -6, 4, 12);
    c.fillRect(-6, -2, 12, 4);
    c.restore();

    // =========================================================================
    // 3.6 TRỤC MŨI KHOAN & ĐẦU KHOAN XOAY TÍT
    // Gồm khớp nối tròn đỏ 59443, trục thép đen 3705 và đầu mũi khoan thép
    // =========================================================================
    var chuckX = motorX + motorW;
    var chuckY = 0;

    // GÓI 4 (UPGRADE): TẤM CHẮN PHOI TRONG SUỐT (DUST SHIELD)
    // Phễu vòm bảo hộ trong suốt ngăn bụi gạch/gỗ bắn vào mắt bé
    if (dustShield) {
      c.save();
      c.fillStyle = C_EXT.shieldGlass;
      c.strokeStyle = C_EXT.shieldGlassRim;
      c.lineWidth = 2.4;
      c.beginPath();
      c.moveTo(chuckX + 6, -26);
      c.bezierCurveTo(chuckX + 38, -32, chuckX + 54, -20, chuckX + 58, -12);
      c.lineTo(chuckX + 58, 12);
      c.bezierCurveTo(chuckX + 54, 20, chuckX + 38, 32, chuckX + 6, 26);
      c.closePath();
      c.fill();
      c.stroke();
      // Ánh sáng lóa phản chiếu trên tấm chắn mica
      c.strokeStyle = '#ffffff';
      c.lineWidth = 2.0;
      c.beginPath();
      c.arc(chuckX + 34, -4, 20, -0.6, 0.4);
      c.stroke();
      c.restore();
    }

    // Khớp nối trục tròn màu đỏ 59443
    rr(c, chuckX, chuckY - 8, 16, 16, 3);
    strokeFill(c, C.warn, C.ink, 2.0);
    // Vòng ren kim loại của đầu kẹp măng-ranh
    rr(c, chuckX + 16, chuckY - 6, 12, 12, 2);
    strokeFill(c, C_EXT.drillSteelDark, C.ink, 1.8);

    // Mũi khoan thép nhọn phía trước (Handheld Drill Bit)
    var bitLen = 48;
    var bitX = chuckX + 28;
    c.beginPath();
    c.moveTo(bitX, chuckY - 4.5);
    c.lineTo(bitX + bitLen - 10, chuckY - 4.5);
    c.lineTo(bitX + bitLen, chuckY); // Đầu nhọn
    c.lineTo(bitX + bitLen - 10, chuckY + 4.5);
    c.lineTo(bitX, chuckY + 4.5);
    c.closePath();
    strokeFill(c, C_EXT.drillSteelLight, C.ink, 2.0);

    // Đường rãnh xoắn ốc của mũi khoan
    c.strokeStyle = C_EXT.drillSteelDark;
    c.lineWidth = 1.8;
    var grooveOffset = spinning ? (t * speedMult * 2.5) % 10 : 0;
    for (var gi2 = 0; gi2 < 4; gi2++) {
      var gx2 = bitX + 6 + gi2 * 9 + grooveOffset;
      if (gx2 < bitX + bitLen - 8) {
        c.beginPath();
        c.moveTo(gx2, chuckY - 4);
        c.lineTo(gx2 + 5, chuckY + 4);
        c.stroke();
      }
    }

    // Hiệu ứng vệt gió xoắn ốc khi mũi khoan xoay tít (Spinning vortex)
    if (spinning) {
      c.strokeStyle = 'rgba(61, 193, 220, 0.75)';
      c.lineWidth = 2.0;
      c.lineCap = 'round';
      for (var wi = 0; wi < 3; wi++) {
        var wAngle = spinAngle + wi * (Math.PI * 2 / 3);
        var wx = bitX + 12 + wi * 10;
        var wy = chuckY + Math.sin(wAngle) * 9;
        c.beginPath();
        c.arc(wx, chuckY, 9, wAngle, wAngle + 1.2);
        c.stroke();
      }
    }

    // GÓI 3 (UPGRADE): THƯỚC CỮ ĐỘ SÂU (DEPTH GAUGE)
    // Thanh cữ màu xanh có các vạch chia cự ly chạy song song với mũi khoan
    if (depthGauge) {
      c.save();
      var rulerY = chuckY - 20;
      var rulerLen = 64;
      // Giá gá kẹp vào thân động cơ
      rr(c, chuckX - 4, rulerY - 4, 14, 10, 2);
      strokeFill(c, C.ink, C.ink, 1.8);

      // Thanh thước màu xanh lam
      rr(c, chuckX + 8, rulerY - 2.5, rulerLen, 5, 2);
      strokeFill(c, C_EXT.depthRuler, C.ink, 1.8);

      // Các vạch chia mm khắc trên thước
      c.strokeStyle = '#ffffff';
      c.lineWidth = 1.2;
      for (var rk = 0; rk < 7; rk++) {
        var rkx = chuckX + 14 + rk * 8;
        c.beginPath();
        c.moveTo(rkx, rulerY - 2);
        c.lineTo(rkx, rulerY + (rk % 2 === 0 ? 3 : 1));
        c.stroke();
      }
      // Đầu tỳ chặn cữ màu cam ở chót thước
      rr(c, chuckX + 8 + rulerLen - 4, rulerY - 6, 8, 12, 2);
      strokeFill(c, C.orange, C.ink, 1.6);
      c.restore();
    }

    c.restore();
    c.restore();
  }

  // =========================================================================
  // 4. DUSTPUFF(c, x, y, {t, active, surface, strength, shield})
  // Hạt bụi phoi khoan văng ra từ lỗ khoan:
  // - Gỗ: mạt phoi nâu ấm
  // - Gạch men: vụn gạch cam đỏ
  // - Thạch cao: bụi trắng xám mịn
  // Nếu có shield (tấm chắn phoi) thì các hạt bị chặn rơi xuống chân tường.
  // =========================================================================
  function dustPuff(c, x, y, opts) {
    if (typeof x === 'object') { opts = x; x = 615; y = 240; }
    x = typeof x === 'number' ? x : 615;
    y = typeof y === 'number' ? y : 240;
    opts = opts || {};

    var active = opts.active !== undefined ? !!opts.active : true;
    if (!active) return;

    var t = typeof opts.t === 'number' ? opts.t : 0;
    var surface = opts.surface || 'tile';
    var strength = Math.max(0, Math.min(1, typeof opts.strength === 'number' ? opts.strength : 0.8));
    var shield = !!opts.shield;

    var col = surface === 'wood' ? C_EXT.woodChip : (surface === 'plaster' ? C_EXT.plasterDust : C_EXT.brickRed);
    var colLight = surface === 'wood' ? C.sand : (surface === 'plaster' ? C.paper : C.orange);

    c.save();
    c.translate(x, y);

    var count = Math.round(DUST_SEEDS.length * strength);
    for (var i = 0; i < count; i++) {
      var seed = DUST_SEEDS[i];
      var prog = ((t * seed.f * 2.5 + i * 0.15) % 1 + 1) % 1;

      var px = seed.dx + seed.vx * prog * 0.8;
      var py = seed.dy + seed.vy * prog * 0.8 + 25 * prog * prog; // Trọng lực rơi

      // Nếu có tấm chắn phoi: bụi va vào vách chắn rồi rơi thẳng đứng
      if (shield && px < -18) {
        px = -18 - (i % 3) * 3;
        py = seed.dy + Math.abs(seed.vy) * prog * 0.9;
      }

      var alpha = prog < 0.2 ? (prog / 0.2) : (prog > 0.7 ? (1 - (prog - 0.7) / 0.3) : 1);
      var r = seed.r * (1 - prog * 0.4);

      if (alpha > 0.05 && r > 0.5) {
        c.fillStyle = i % 2 === 0 ? col : colLight;
        c.strokeStyle = C.ink;
        c.lineWidth = 1.2;
        c.globalAlpha = alpha;
        c.beginPath();
        c.arc(px, py, r, 0, Math.PI * 2);
        c.fill();
        c.stroke();
      }
    }

    c.restore();
  }

  // =========================================================================
  // 5. BRACKET(c, x, y, {state, t})
  // Nở nhựa và giá treo tranh gắn vào tường:
  // - 'none': chưa có gì
  // - 'anchor': nở nhựa màu cam ấn lọt vào lỗ khoan
  // - 'mounted': bát giá treo kim loại Technic bắt vít cố định chắc chắn
  // =========================================================================
  function bracket(c, x, y, opts) {
    if (typeof x === 'object') { opts = x; x = 615; y = 240; }
    x = typeof x === 'number' ? x : 615;
    y = typeof y === 'number' ? y : 240;
    opts = opts || {};

    var state = opts.state || 'none';
    if (state === 'none') return;

    c.save();
    c.translate(x, y);

    if (state === 'anchor') {
      // Nở nhựa màu cam (Drywall Plug Anchor) ấn vào lỗ
      rr(c, -8, -6, 16, 12, 2);
      strokeFill(c, C.orange, C.ink, 1.8);
      // Gờ vành nở nhựa
      rr(c, -11, -8, 6, 16, 2);
      strokeFill(c, C.warn, C.ink, 1.6);
      // Lỗ vít trung tâm
      c.beginPath();
      c.arc(0, 0, 3, 0, Math.PI * 2);
      strokeFill(c, C.ink, C.ink, 1.0);
    } else if (state === 'mounted') {
      // Nở nhựa bên trong
      rr(c, -8, -6, 16, 12, 2);
      strokeFill(c, C.orange, C.ink, 1.8);

      // Bát giá treo kim loại Technic (Picture Hanging Bracket)
      rr(c, -10, -22, 20, 34, 4);
      strokeFill(c, C_EXT.technicGrey, C.ink, LINE);

      // Vít thép vặn chặt ở tâm (đầu vít chữ thập)
      c.beginPath();
      c.arc(0, 0, 5, 0, Math.PI * 2);
      strokeFill(c, C_EXT.drillSteelLight, C.ink, 1.8);
      c.strokeStyle = C.ink;
      c.lineWidth = 1.6;
      c.beginPath();
      c.moveTo(-3, -3); c.lineTo(3, 3);
      c.moveTo(-3, 3); c.lineTo(3, -3);
      c.stroke();

      // Móc treo chữ U hướng lên trên để đón dây khung tranh
      c.strokeStyle = C.gold;
      c.lineWidth = 4.2;
      c.lineCap = 'round';
      c.lineJoin = 'round';
      c.beginPath();
      c.moveTo(-6, -16);
      c.lineTo(0, -22);
      c.lineTo(6, -16);
      c.stroke();
      c.strokeStyle = C.ink;
      c.lineWidth = 2.0;
      c.stroke();
    }

    c.restore();
  }

  // =========================================================================
  // 6. PICTUREFRAME(c, x, y, {hung, swing, t})
  // Khung tranh đáng yêu treo lên tường sau khi bắt vít thành công.
  // Bức tranh vẽ mặt trời mỉm cười & mầm cây ZMArt (hoàn toàn KHÔNG có chữ).
  // Đung đưa nhẹ (swing) theo góc con lắc khi vừa được treo.
  // =========================================================================
  function pictureFrame(c, x, y, opts) {
    if (typeof x === 'object') { opts = x; x = 615; y = 240; }
    x = typeof x === 'number' ? x : 615;
    y = typeof y === 'number' ? y : 240;
    opts = opts || {};

    var hung = opts.hung !== undefined ? !!opts.hung : true;
    var t = typeof opts.t === 'number' ? opts.t : 0;
    var swingVal = typeof opts.swing === 'number' ? opts.swing : 0;
    var swingAngle = swingVal * Math.sin(t * 3.5);

    var fw = 110;
    var fh = 126;

    c.save();

    if (hung) {
      // Treo trên móc giá treo tại (x, y)
      c.translate(x, y - 22);
      c.rotate(swingAngle);

      // Dây dù treo tranh hình tam giác nối từ móc xuống 2 mép khung
      c.strokeStyle = C.road;
      c.lineWidth = 2.6;
      c.beginPath();
      c.moveTo(0, 0);
      c.lineTo(-fw * 0.38, 30);
      c.moveTo(0, 0);
      c.lineTo(fw * 0.38, 30);
      c.stroke();

      // Khuyên tròn kim loại móc vào giá
      c.beginPath();
      c.arc(0, 0, 4.5, 0, Math.PI * 2);
      strokeFill(c, C.gold, C.ink, 1.8);

      c.translate(0, 30);
    } else {
      // Chưa treo: đặt tựa trên sàn gỗ
      c.translate(x, y);
    }

    // 6.1 Khung gỗ ngoài dày dặn
    rr(c, -fw * 0.5, 0, fw, fh, 6);
    strokeFill(c, C_EXT.woodPlankDark, C.ink, LINE);

    // Đường viền vàng dát sang trọng bên trong khung gỗ
    rr(c, -fw * 0.5 + 6, 6, fw - 12, fh - 12, 3);
    strokeFill(c, C.gold, C.ink, 1.8);

    // Lớp bo giấy trắng kem (passe-partout)
    var matW = fw - 20;
    var matH = fh - 20;
    rr(c, -matW * 0.5, 10, matW, matH, 2);
    strokeFill(c, C.paperWarm, C.ink, 1.6);

    // 6.2 Bức tranh đáng yêu bên trong (Hoàn toàn KHÔNG chữ)
    var artW = matW - 14;
    var artH = matH - 14;
    var artX = -artW * 0.5;
    var artY = 17;

    c.save();
    c.beginPath();
    rr(c, artX, artY, artW, artH, 2);
    c.clip();

    // Bầu trời xanh biếc
    var skyG = c.createLinearGradient(0, artY, 0, artY + artH);
    skyG.addColorStop(0, '#70c8f8');
    skyG.addColorStop(0.6, '#bde6fd');
    skyG.addColorStop(1, '#e8f6ff');
    c.fillStyle = skyG;
    c.fillRect(artX, artY, artW, artH);

    // Cầu vồng nhỏ rực rỡ ở góc xa
    c.lineWidth = 3.0;
    var rbX = artX + 16, rbY = artY + 44;
    var rbColors = ['#ff595e', '#ffca3a', '#8ac926', '#1982c4'];
    for (var rbi = 0; rbi < rbColors.length; rbi++) {
      c.strokeStyle = rbColors[rbi];
      c.beginPath();
      c.arc(rbX, rbY, 26 - rbi * 3.2, Math.PI, 0);
      c.stroke();
    }

    // Ông mặt trời vàng mỉm cười toe toét
    var sunX = artX + artW - 18;
    var sunY = artY + 18;
    c.beginPath();
    c.arc(sunX, sunY, 11, 0, Math.PI * 2);
    strokeFill(c, C.gold, C.ink, 1.8);

    // Tia nắng mặt trời
    c.strokeStyle = C.gold;
    c.lineWidth = 1.8;
    c.lineCap = 'round';
    for (var sra = 0; sra < 8; sra++) {
      var sAngle = (sra * Math.PI) / 4 + t * 0.2;
      c.beginPath();
      c.moveTo(sunX + Math.cos(sAngle) * 13, sunY + Math.sin(sAngle) * 13);
      c.lineTo(sunX + Math.cos(sAngle) * 17, sunY + Math.sin(sAngle) * 17);
      c.stroke();
    }

    // Khuôn mặt cười của ông mặt trời
    c.fillStyle = C.ink;
    c.beginPath();
    c.arc(sunX - 3.5, sunY - 2, 1.4, 0, Math.PI * 2);
    c.arc(sunX + 3.5, sunY - 2, 1.4, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = C.ink;
    c.lineWidth = 1.4;
    c.beginPath();
    c.arc(sunX, sunY + 1, 4.2, 0.2, Math.PI - 0.2);
    c.stroke();

    // Đồi cỏ xanh ngắt phía dưới
    c.beginPath();
    c.moveTo(artX - 5, artY + artH);
    c.quadraticCurveTo(artX + artW * 0.5, artY + artH - 26, artX + artW + 5, artY + artH);
    c.closePath();
    strokeFill(c, C.grass, C.ink, 1.8);

    // Mầm cây nhỏ xinh xắn vươn lên
    var plantAx = artX + artW * 0.48;
    var plantAy = artY + artH - 12;
    // Thân mầm
    c.strokeStyle = C.grassDark;
    c.lineWidth = 2.0;
    c.beginPath();
    c.moveTo(plantAx, plantAy);
    c.lineTo(plantAx, plantAy - 14);
    c.stroke();
    // 2 lá mầm xanh non
    c.beginPath();
    c.ellipse(plantAx - 6, plantAy - 13, 6, 3.5, -0.4, 0, Math.PI * 2);
    c.ellipse(plantAx + 6, plantAy - 13, 6, 3.5, 0.4, 0, Math.PI * 2);
    strokeFill(c, C.grassLight, C.ink, 1.4);

    c.restore();

    // Viền mép tranh mực đen sắc nét
    c.strokeStyle = C.ink;
    c.lineWidth = 1.8;
    c.strokeRect(artX, artY, artW, artH);

    c.restore();
  }

  // =========================================================================
  // 7. SPARKLES(c, x, y, {t, count})
  // Ngôi sao vàng & kim tuyến bung nở ăn mừng thành công (khoan đúng, treo tranh đẹp).
  // =========================================================================
  function sparkles(c, x, y, opts) {
    if (typeof x === 'object') { opts = x; x = 615; y = 240; }
    x = typeof x === 'number' ? x : 615;
    y = typeof y === 'number' ? y : 240;
    opts = opts || {};

    var t = typeof opts.t === 'number' ? opts.t : 0;
    var count = opts.count || 8;

    c.save();
    c.translate(x, y);

    for (var i = 0; i < count; i++) {
      var angle = (i * Math.PI * 2) / count + t * 0.8;
      var distProg = ((t * 0.9 + i * 0.18) % 1 + 1) % 1;
      var dist = 28 + distProg * 65;
      var sx = Math.cos(angle) * dist;
      var sy = Math.sin(angle) * dist * 0.85;
      var starScale = 1 - distProg * 0.6;
      var alpha = distProg < 0.2 ? (distProg / 0.2) : (distProg > 0.7 ? (1 - (distProg - 0.7) / 0.3) : 1);

      if (alpha > 0.05) {
        c.save();
        c.translate(sx, sy);
        c.scale(starScale, starScale);
        c.globalAlpha = alpha;

        // Vẽ ngôi sao 4 cánh lấp lánh
        c.fillStyle = i % 3 === 0 ? C.gold : (i % 3 === 1 ? C.accentLight : C.orange);
        c.strokeStyle = C.ink;
        c.lineWidth = 1.6;
        c.beginPath();
        c.moveTo(0, -9);
        c.quadraticCurveTo(0, 0, 9, 0);
        c.quadraticCurveTo(0, 0, 0, 9);
        c.quadraticCurveTo(0, 0, -9, 0);
        c.quadraticCurveTo(0, 0, 0, -9);
        c.closePath();
        c.fill();
        c.stroke();

        // Chấm tròn kim tuyến nhỏ
        c.fillStyle = C.paper;
        c.beginPath();
        c.arc(0, 0, 2.0, 0, Math.PI * 2);
        c.fill();

        c.restore();
      }
    }

    c.restore();
  }

  // =========================================================================
  // 8. NOTEA(c, x, y, {t})
  // Nốt nhạc bay lên theo giai điệu A khi học sinh hoàn thành nhiệm vụ khoan/treo tranh.
  // =========================================================================
  function noteA(c, x, y, opts) {
    if (typeof x === 'object') { opts = x; x = 615; y = 200; }
    x = typeof x === 'number' ? x : 615;
    y = typeof y === 'number' ? y : 200;
    opts = opts || {};

    var t = typeof opts.t === 'number' ? opts.t : 0;

    var notes = [
      { dx: -28, dt: 0.0, scale: 1.0, col: C.gold, type: 'single' },
      { dx: 18, dt: 0.28, scale: 1.15, col: C.accent, type: 'double' },
      { dx: -12, dt: 0.55, scale: 0.9, col: C.orange, type: 'single' },
      { dx: 34, dt: 0.82, scale: 1.05, col: C.ok, type: 'double' }
    ];

    c.save();

    for (var i = 0; i < notes.length; i++) {
      var nt = notes[i];
      var prog = ((t * 0.75 + nt.dt) % 1 + 1) % 1;
      var curY = y - prog * 75;
      var curX = x + nt.dx + Math.sin(t * 3.8 + i * 2.1) * 14;
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

          // Cán nốt & móc nốt
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

          // 2 đầu nốt
          c.beginPath();
          c.ellipse(-7, 0, 4.8, 3.5, -0.4, 0, Math.PI * 2);
          c.ellipse(7, -3, 4.8, 3.5, -0.4, 0, Math.PI * 2);
          c.fill();
          c.stroke();

          // 2 cán nốt + xà nối ngang
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

        // Hạt sao lấp lánh nhỏ cạnh nốt nhạc
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
  // XUẤT GIAO DIỆN window.Lop1Bai04Art
  // =========================================================================
  var Lop1Bai04Art = {
    W: W0,
    H: H0,
    GROUND_Y: GY0,
    LINE: LINE,
    C: C,
    C_EXT: C_EXT,

    background: background,
    wall: wall,
    drill: drill,
    robot: drill, // Alias quen thuộc của robot trong bài học
    dustPuff: dustPuff,
    dust: dustPuff, // Alias
    bracket: bracket,
    pictureFrame: pictureFrame,
    sparkles: sparkles,
    celebration: sparkles, // Alias
    noteA: noteA,

    // Các alias hỗ trợ tương thích bổ sung
    drawBackground: background,
    drawWall: wall,
    drawDrill: drill,
    drawRobot: drill,
    drawDustPuff: dustPuff,
    drawDust: dustPuff,
    drawBracket: bracket,
    drawPictureFrame: pictureFrame,
    drawSparkles: sparkles,
    drawCelebration: sparkles,
    drawNoteA: noteA
  };

  if (typeof window !== 'undefined') {
    window.Lop1Bai04Art = Lop1Bai04Art;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Lop1Bai04Art;
  }
})();
