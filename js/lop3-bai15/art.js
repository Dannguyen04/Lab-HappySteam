// Thư viện vẽ cảnh Lớp 3 · Bài 15: "Robot đẩy xe" (window.Lop3Bai15Art).
// Khung nhìn chuẩn: 900x560, mặt đất GY = 430.
// Theo đúng quy chuẩn ZMArt, craft.md: khối to, viền đậm C.ink, nét LINE = 2.6, không chữ trong hình, không vũ khí.
// Cảnh ③: Phương án A "Đường đua lực đẩy" nhìn ngang: robot hai chân bước bằng động cơ M1 và bánh răng lớn,
// đẩy xe hàng 2 bánh tiến về vạch đích trên thước đo 0–120 cm.
// Tương thích trình duyệt máy tính bảng: IIFE độc lập, chỉ dùng mã màu hex/rgba, không dùng Math.random() khi vẽ.
(function () {
  'use strict';

  var W0 = 900;
  var H0 = 560;
  var GY0 = 430;
  var LINE = 2.6;

  // Bảng màu chuẩn thống nhất hệ thống ZMArt & Lab-HappySteam
  var C = {
    ink: '#1e2a34',
    inkSoft: '#455a64',
    paper: '#ffffff',
    paperWarm: '#fff9ee',
    hole: '#dfe6ec',
    sky: '#def0fc',
    skyTop: '#5bb2f5',
    skyLight: '#e1f3fe',
    grass: '#6db843',
    grassLight: '#8cc152',
    grassDark: '#3c6328',
    sand: '#f2d398',
    sandDark: '#c89d54',
    road: '#576574',
    roadDark: '#374151',
    roadLight: '#718096',
    trackWarm: '#9a9083',
    trackLight: '#c8bfb3',
    trackDark: '#675f54',
    accent: '#3dc1dc',       // Cyan đặc trưng robot
    accentDark: '#0e6f8a',
    accentLight: '#8ee6f5',
    warn: '#e53935',         // Đỏ cờ đích, viền hãm
    warnDark: '#b71c1c',
    ok: '#43a047',           // Xanh lá thành công
    okLight: '#a5d6a7',
    gold: '#ffd23f',         // Vàng bánh răng, cờ chờ
    orange: '#ff8a3d',       // Cam rực rỡ xe hàng
    orangeDark: '#d96318',
    wood: '#8d6e63',
    woodDark: '#5d4037',
    crateWood: '#c49a6c',
    crateBand: '#607d8b',
    steel: '#64748b',
    steelLight: '#cbd5e1'
  };

  // Ưu tiên đồng bộ màu từ window.ZMArt nếu đã có
  if (typeof window !== 'undefined' && window.ZMArt && window.ZMArt.C) {
    var zmc = window.ZMArt.C;
    for (var k in zmc) {
      if (Object.prototype.hasOwnProperty.call(zmc, k)) {
        C[k] = zmc[k];
      }
    }
    LINE = window.ZMArt.LINE || LINE;
  }

  // Tọa độ vạch thước chuẩn (cm -> px): x = x0 + cm * scale
  var DEFAULT_TRACK = {
    x0: 140,
    scale: 5.2, // 120 cm -> 624 px (từ x=140 đến x=764)
    gy: GY0,
    maxCm: 120
  };

  // Hàm chuyển đổi cm sang px
  function cmToX(cm, opts) {
    opts = opts || {};
    var x0 = typeof opts.x0 === 'number' ? opts.x0 : DEFAULT_TRACK.x0;
    var scale = typeof opts.scale === 'number' ? opts.scale : DEFAULT_TRACK.scale;
    return x0 + cm * scale;
  }

  // Hàm chuyển đổi px sang cm
  function xToCm(x, opts) {
    opts = opts || {};
    var x0 = typeof opts.x0 === 'number' ? opts.x0 : DEFAULT_TRACK.x0;
    var scale = typeof opts.scale === 'number' ? opts.scale : DEFAULT_TRACK.scale;
    return (x - x0) / scale;
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

  // Dữ liệu mây cố định trôi chậm trên bầu trời
  var CLOUDS = [
    { x: 120, y: 75, s: 0.85, spd: 14 },
    { x: 380, y: 110, s: 0.70, spd: 11 },
    { x: 670, y: 65, s: 0.95, spd: 16 }
  ];

  // Dữ liệu nhà kho logistics và cây xanh hậu cảnh phía xa
  var WAREHOUSES = [
    { x: 45, w: 90, h: 58, col: '#e2dcd4', roof: '#ff8a3d' },
    { x: 160, w: 130, h: 72, col: '#e9e3da', roof: '#3dc1dc' },
    { x: 710, w: 110, h: 64, col: '#e2dcd4', roof: '#ff8a3d' },
    { x: 840, w: 85, h: 52, col: '#ede7de', roof: '#43a047' }
  ];

  var TREES = [
    { x: 20, gy: 385, s: 0.75 },
    { x: 310, gy: 385, s: 0.65 },
    { x: 670, gy: 385, s: 0.80 },
    { x: 885, gy: 385, s: 0.70 }
  ];

  // =========================================================================
  // 1. BACKGROUND(c, {t})
  // Bãi giao hàng ngoài trời sáng sủa, trời xanh nhạt, mây trôi, kho bãi phía xa
  // =========================================================================
  function background(c, opts) {
    opts = opts || {};
    var t = typeof opts.t === 'number' ? opts.t : 0;
    var W = typeof opts.W === 'number' ? opts.W : W0;
    var H = typeof opts.H === 'number' ? opts.H : H0;
    var gy = typeof opts.gy === 'number' ? opts.gy : GY0;

    c.save();

    // 1.1 Bầu trời xanh nhạt chuyển sắc êm dịu
    var sky = c.createLinearGradient(0, 0, 0, gy);
    sky.addColorStop(0, '#5bb2f5');
    sky.addColorStop(0.45, '#a4daf8');
    sky.addColorStop(1, '#e8f4fc');
    c.fillStyle = sky;
    c.fillRect(0, 0, W, gy);

    // 1.2 Mặt trời tươi vui góc trên bên phải
    var sunX = W - 110;
    var sunY = 75;
    var sunR = 24;
    var sunHalo = c.createRadialGradient(sunX, sunY, sunR * 0.5, sunX, sunY, sunR * 2.4);
    sunHalo.addColorStop(0, 'rgba(255, 230, 90, 0.55)');
    sunHalo.addColorStop(1, 'rgba(255, 230, 90, 0)');
    c.fillStyle = sunHalo;
    c.beginPath();
    c.arc(sunX, sunY, sunR * 2.4, 0, Math.PI * 2);
    c.fill();

    // Tia nắng xoay chậm
    c.save();
    c.translate(sunX, sunY);
    c.rotate(t * 0.2);
    c.strokeStyle = C.gold;
    c.lineWidth = 3.0;
    c.lineCap = 'round';
    for (var ray = 0; ray < 8; ray++) {
      c.beginPath();
      c.moveTo(0, sunR + 5);
      c.lineTo(0, sunR + 13);
      c.stroke();
      c.rotate(Math.PI / 4);
    }
    c.restore();

    // Đĩa mặt trời vàng ấm viền C.ink + mắt cười thân thiện
    c.beginPath();
    c.arc(sunX, sunY, sunR, 0, Math.PI * 2);
    strokeFill(c, C.gold, C.ink, LINE);
    c.strokeStyle = C.ink;
    c.lineWidth = 2.0;
    c.lineCap = 'round';
    c.beginPath();
    c.arc(sunX - 7, sunY - 2, 2.5, Math.PI, 0);
    c.arc(sunX + 7, sunY - 2, 2.5, Math.PI, 0);
    c.stroke();
    c.beginPath();
    c.arc(sunX, sunY + 3, 7, 0.15 * Math.PI, 0.85 * Math.PI);
    c.stroke();

    // 1.3 Mây trắng bồng bềnh trôi ngang
    for (var ci = 0; ci < CLOUDS.length; ci++) {
      var cld = CLOUDS[ci];
      var cx = ((cld.x + t * cld.spd) % (W + 240)) - 120;
      drawCloud(c, cx, cld.y, cld.s);
    }

    // 1.4 Hậu cảnh xa: giàn cẩu trục gantry & kho bãi giao hàng (y = 310 .. 385)
    drawGantryCrane(c, 480, 385, 0.8);

    // Dãy nhà kho logistics phía xa
    for (var wi = 0; wi < WAREHOUSES.length; wi++) {
      var wh = WAREHOUSES[wi];
      drawWarehouse(c, wh.x, 385, wh.w, wh.h, wh.col, wh.roof);
    }

    // Cây xanh bóng mát quanh bãi
    for (var ti = 0; ti < TREES.length; ti++) {
      var tr = TREES[ti];
      drawDecoTree(c, tr.x, tr.gy, tr.s);
    }

    // Dải phân cách / tường bảo vệ bãi (y = 380 .. 395)
    c.fillStyle = '#b0bec5';
    c.fillRect(0, 385, W, 12);
    c.strokeStyle = C.ink;
    c.lineWidth = 1.8;
    c.beginPath();
    c.moveTo(0, 385); c.lineTo(W, 385);
    c.moveTo(0, 397); c.lineTo(W, 397);
    c.stroke();

    // 1.5 Mặt nền bãi ngoài trời sáng sủa (y = 397 .. H)
    var groundGrad = c.createLinearGradient(0, 397, 0, H);
    groundGrad.addColorStop(0, '#e5ded4');
    groundGrad.addColorStop(0.35, '#d9d0c3');
    groundGrad.addColorStop(1, '#c9bfb0');
    c.fillStyle = groundGrad;
    c.fillRect(0, 397, W, H - 397);

    // Đường viền ngăn cách mặt đất
    c.strokeStyle = C.ink;
    c.lineWidth = LINE;
    c.beginPath();
    c.moveTo(0, 397); c.lineTo(W, 397);
    c.stroke();

    // Các mối nối gạch lát bê tông của bãi hàng
    c.strokeStyle = 'rgba(100, 90, 80, 0.22)';
    c.lineWidth = 1.4;
    for (var sx = 60; sx < W; sx += 90) {
      c.beginPath();
      c.moveTo(sx, 397);
      c.lineTo(sx - 25, H);
      c.stroke();
    }

    // Nón giao thông cao su màu cam sọc trắng đặt ở rìa xa
    drawTrafficCone(c, 85, 396, 0.8);
    drawTrafficCone(c, W - 75, 396, 0.8);

    c.restore();
  }

  // Đám mây trắng bo tròn chuẩn nét ZMArt
  function drawCloud(c, x, y, s) {
    s = s || 1;
    c.save();
    c.translate(x, y);
    c.scale(s, s);
    c.beginPath();
    c.arc(-26, 4, 18, Math.PI * 0.5, Math.PI * 1.55);
    c.arc(-5, -12, 22, Math.PI * 0.95, Math.PI * 1.9);
    c.arc(22, -6, 19, Math.PI * 1.15, Math.PI * 1.95);
    c.arc(38, 4, 15, Math.PI * 1.5, Math.PI * 0.5);
    c.closePath();
    strokeFill(c, C.paper, C.ink, LINE / s);
    c.restore();
  }

  // Giàn cẩu trục gantry công nghiệp hậu cảnh
  function drawGantryCrane(c, x, gy, s) {
    s = s || 1;
    c.save();
    c.translate(x, gy);
    c.scale(s, s);
    c.strokeStyle = '#f59e0b';
    c.lineWidth = 2.4;
    // Chân cẩu chữ A
    c.beginPath();
    c.moveTo(-35, 0); c.lineTo(-20, -85);
    c.moveTo(-5, 0); c.lineTo(-20, -85);
    c.moveTo(35, 0); c.lineTo(20, -85);
    c.moveTo(5, 0); c.lineTo(20, -85);
    // Dầm ngang
    c.moveTo(-55, -85); c.lineTo(55, -85);
    c.moveTo(-55, -95); c.lineTo(55, -95);
    c.stroke();
    // Giàn giằng chéo
    c.lineWidth = 1.4;
    c.beginPath();
    c.moveTo(-20, -85); c.lineTo(0, -95); c.lineTo(20, -85);
    c.stroke();
    c.restore();
  }

  // Nhà kho giao hàng hậu cảnh
  function drawWarehouse(c, x, gy, w, h, col, roofCol) {
    c.save();
    c.translate(x, gy);
    // Thân nhà kho
    rr(c, 0, -h, w, h, 2);
    strokeFill(c, col, C.ink, 1.8);
    // Mái dốc
    c.beginPath();
    c.moveTo(-4, -h);
    c.lineTo(w / 2, -h - 16);
    c.lineTo(w + 4, -h);
    c.closePath();
    strokeFill(c, roofCol, C.ink, 1.8);
    // Cửa cuốn kho hàng
    var dw = w * 0.45;
    var dh = h * 0.65;
    rr(c, (w - dw) / 2, -dh, dw, dh, [3, 3, 0, 0]);
    strokeFill(c, '#64748b', C.ink, 1.4);
    // Vạch cửa cuốn
    c.strokeStyle = '#cbd5e1';
    c.lineWidth = 1.0;
    for (var ly = -dh + 6; ly < 0; ly += 7) {
      c.beginPath();
      c.moveTo((w - dw) / 2 + 2, ly);
      c.lineTo((w + dw) / 2 - 2, ly);
      c.stroke();
    }
    c.restore();
  }

  // Cây trang trí hậu cảnh
  function drawDecoTree(c, x, gy, s) {
    s = s || 1;
    c.save();
    c.translate(x, gy);
    c.scale(s, s);
    // Thân cây gỗ
    rr(c, -5, -28, 10, 28, 2);
    strokeFill(c, C.wood, C.ink, LINE / s);
    // Tán lá tròn
    c.beginPath();
    c.arc(-10, -36, 16, 0, Math.PI * 2);
    c.arc(10, -36, 16, 0, Math.PI * 2);
    c.arc(0, -52, 19, 0, Math.PI * 2);
    strokeFill(c, C.grass, C.ink, LINE / s);
    c.restore();
  }

  // Nón cao su an toàn
  function drawTrafficCone(c, x, gy, s) {
    s = s || 1;
    c.save();
    c.translate(x, gy);
    c.scale(s, s);
    // Đế vuông
    rr(c, -14, -4, 28, 4, 1);
    strokeFill(c, C.ink, C.ink, 1.4);
    // Thân nón hình chóp cụt
    c.beginPath();
    c.moveTo(-10, -4);
    c.lineTo(-3, -26);
    c.lineTo(3, -26);
    c.lineTo(10, -4);
    c.closePath();
    strokeFill(c, C.orange, C.ink, LINE / s);
    // Dải phản quang trắng giữa nón
    c.fillStyle = C.paper;
    c.beginPath();
    c.moveTo(-7.5, -12);
    c.lineTo(-5.2, -19);
    c.lineTo(5.2, -19);
    c.lineTo(7.5, -12);
    c.closePath();
    c.fill();
    c.stroke();
    c.restore();
  }

  // =========================================================================
  // 2. TRACK(c, {x0, scale, gy, lines, w, targetLine})
  // Đường đua phẳng nhìn ngang, có thước đo 0–120 cm (vạch mỗi 10 cm, không chữ)
  // =========================================================================
  function track(c, opts) {
    opts = opts || {};
    var x0 = typeof opts.x0 === 'number' ? opts.x0 : DEFAULT_TRACK.x0;
    var scale = typeof opts.scale === 'number' ? opts.scale : DEFAULT_TRACK.scale;
    var gy = typeof opts.gy === 'number' ? opts.gy : GY0;
    var maxCm = typeof opts.maxCm === 'number' ? opts.maxCm : DEFAULT_TRACK.maxCm;
    var w = typeof opts.w === 'number' ? opts.w : Math.max(720, (maxCm + 15) * scale);
    var lines = Array.isArray(opts.lines) ? opts.lines : [80];
    var targetLine = typeof opts.targetLine === 'number' ? opts.targetLine : (lines[0] !== undefined ? lines[0] : 80);
    var t = typeof opts.t === 'number' ? opts.t : 0;

    var trackH = 46;
    var startX = x0;
    var endX = x0 + maxCm * scale;

    c.save();

    // 2.1 Khung thảm đường đua xám ấm
    // Móng đế đường đua
    rr(c, x0 - 45, gy, w + 30, trackH + 16, 4);
    strokeFill(c, C.trackDark, C.ink, LINE);

    // Mặt đường đua phẳng xám ấm
    var trackGrad = c.createLinearGradient(0, gy, 0, gy + trackH);
    trackGrad.addColorStop(0, '#b3a99c');
    trackGrad.addColorStop(0.3, C.trackWarm);
    trackGrad.addColorStop(1, '#786e63');
    rr(c, x0 - 40, gy, w + 20, trackH, 3);
    strokeFill(c, trackGrad, C.ink, LINE);

    // Mép đường đua: vệt sơn viền trang trí thể thao màu vàng
    c.strokeStyle = C.gold;
    c.lineWidth = 3.5;
    c.beginPath();
    c.moveTo(x0 - 40, gy + 3);
    c.lineTo(x0 - 40 + w + 20, gy + 3);
    c.stroke();

    // Dải gờ an toàn sọc chéo đỏ-trắng ở lề mép dưới đường đua (Kerb thể thao)
    var kerbY = gy + trackH - 7;
    var kerbW = 14;
    for (var kx = x0 - 38; kx < x0 + w; kx += kerbW) {
      c.fillStyle = ((Math.floor((kx - x0) / kerbW) % 2 === 0)) ? C.warn : C.paper;
      c.fillRect(kx, kerbY, kerbW, 6);
      c.strokeRect(kx, kerbY, kerbW, 6);
    }

    // 2.2 VÙNG DUNG SAI ĐÍCH ±5 cm (tương đương ±5 cm quanh targetLine)
    // Thể hiện trực quan bằng dải sáng xanh lá mờ viền nét đứt (không chữ)
    if (typeof targetLine === 'number' && targetLine > 0) {
      var tolMinX = x0 + (targetLine - 5) * scale;
      var tolMaxX = x0 + (targetLine + 5) * scale;
      var tolW = tolMaxX - tolMinX;
      var pulse = 0.5 + 0.5 * Math.sin(t * 5);

      c.save();
      // Vùng đỗ xe chuẩn màu xanh lá nhạt
      c.fillStyle = 'rgba(67, 160, 71, ' + (0.22 + 0.12 * pulse).toFixed(2) + ')';
      c.fillRect(tolMinX, gy + 4, tolW, trackH - 12);
      c.strokeStyle = C.ok;
      c.lineWidth = 2.4;
      c.setLineDash([5, 4]);
      c.strokeRect(tolMinX, gy + 4, tolW, trackH - 12);
      c.setLineDash([]);
      c.restore();
    }

    // 2.3 THƯỚC ĐO 0–120 cm TRÊN MẶT ĐƯỜNG ĐUA (KHÔNG CHỮ SỐ)
    // Đường chuẩn ray chia vạch
    c.strokeStyle = '#e2dbd0';
    c.lineWidth = 2.0;
    c.beginPath();
    c.moveTo(startX, gy + 12);
    c.lineTo(endX, gy + 12);
    c.stroke();

    for (var cm = 0; cm <= maxCm; cm += 10) {
      var vx = x0 + cm * scale;
      var isMajor = (cm % 20 === 0);
      var isMilestone = (cm === 50 || cm === 100);
      var isTarget = lines.indexOf(cm) !== -1;

      if (cm === 0) {
        // VẠCH XUẤT PHÁT (0 cm): Vạch ca-rô thể thao đen-trắng đôi
        drawStartFinishGate(c, vx, gy, trackH);
      } else {
        // Vạch chia độ cao khác nhau:
        // - 10 cm: vạch mảnh cao 10px
        // - 20 cm: vạch vừa cao 16px
        // - 50, 100 cm: vạch dài cao 22px có đinh tán tròn nổi bật
        var markH = isMilestone ? 22 : (isMajor ? 16 : 10);
        c.strokeStyle = isTarget ? C.gold : (isMilestone ? C.paper : (isMajor ? '#f5eee4' : '#ded6cb'));
        c.lineWidth = isTarget ? 3.6 : (isMilestone ? 3.0 : (isMajor ? 2.4 : 1.6));
        c.beginPath();
        c.moveTo(vx, gy + 5);
        c.lineTo(vx, gy + 5 + markH);
        c.stroke();

        // Điểm đinh tán kim loại (stud) tròn cho các mốc chính
        if (isMilestone) {
          c.beginPath();
          c.arc(vx, gy + 5 + markH + 4, 3.5, 0, Math.PI * 2);
          strokeFill(c, C.gold, C.ink, 1.4);
        } else if (isMajor) {
          c.beginPath();
          c.arc(vx, gy + 5 + markH + 3, 2.2, 0, Math.PI * 2);
          strokeFill(c, C.paper, C.ink, 1.0);
        }
      }
    }

    // 2.4 CÁC VẠCH ĐÍCH (lines: e.g. [80] hoặc [45], [100])
    for (var li = 0; li < lines.length; li++) {
      var lineCm = lines[li];
      var lx = x0 + lineCm * scale;
      // Dải sơn vạch đích đỏ-vàng nổi bật
      c.strokeStyle = C.warn;
      c.lineWidth = 4.0;
      c.beginPath();
      c.moveTo(lx, gy + 2);
      c.lineTo(lx, gy + trackH - 8);
      c.stroke();

      // Mũi tên tam giác định vị vạch đích ở đỉnh (không chữ)
      c.fillStyle = C.warn;
      c.beginPath();
      c.moveTo(lx, gy + 2);
      c.lineTo(lx - 5, gy - 7);
      c.lineTo(lx + 5, gy - 7);
      c.closePath();
      strokeFill(c, C.warn, C.ink, 1.4);
    }

    c.restore();
  }

  // Vạch ca-rô xuất phát đen-trắng
  function drawStartFinishGate(c, x, gy, h) {
    c.save();
    var barW = 12;
    var rows = 5;
    var blockH = (h - 10) / rows;
    for (var r = 0; r < rows; r++) {
      for (var col = 0; col < 2; col++) {
        var isBlack = (r + col) % 2 === 0;
        c.fillStyle = isBlack ? C.ink : C.paper;
        c.fillRect(x - barW + col * (barW / 2), gy + 4 + r * blockH, barW / 2, blockH);
      }
    }
    c.strokeStyle = C.ink;
    c.lineWidth = 2.0;
    c.strokeRect(x - barW, gy + 4, barW, h - 10);

    // Cọc tiêu mini cắm ở vạch xuất phát
    rr(c, x - barW - 6, gy - 16, 6, 20, 2);
    strokeFill(c, C.gold, C.ink, 1.4);
    c.beginPath();
    c.arc(x - barW - 3, gy - 18, 3.5, 0, Math.PI * 2);
    strokeFill(c, C.warn, C.ink, 1.2);
    c.restore();
  }

  // =========================================================================
  // 3. FLAG(c, x, gy, {state, t})
  // Cờ đích cắm tại vị trí vạch cm (state: 'wait'|'ok'|'miss')
  // =========================================================================
  function flag(c, x, gy, opts) {
    if (typeof x === 'object') { opts = x; x = 556; gy = GY0; }
    x = typeof x === 'number' ? x : 556;
    gy = typeof gy === 'number' ? gy : GY0;
    opts = opts || {};
    var state = opts.state || 'wait';
    var t = typeof opts.t === 'number' ? opts.t : 0;

    // Màu cờ theo trạng thái
    var flagCol = {
      wait: C.gold,      // Vàng cam chờ đón xe
      ok: C.ok,          // Xanh lá đạt chuẩn vạch
      miss: C.warn       // Đỏ quá vạch hoặc chưa tới
    }[state] || C.gold;

    // Hiệu ứng sóng cờ phấp phới
    var wave = Math.sin(t * 6.5) * 4.5;
    var wave2 = Math.cos(t * 6.5) * 3.0;

    // Nếu 'miss' thì cờ rung lắc mạnh cảnh báo
    var shakeX = state === 'miss' ? Math.sin(t * 26) * 3 : 0;

    c.save();
    c.translate(x + shakeX, gy);

    // 3.1 Chân đế kim loại cắm xuống mặt đường
    rr(c, -14, -8, 28, 8, [4, 4, 1, 1]);
    strokeFill(c, C.inkSoft, C.ink, LINE);
    rr(c, -8, -12, 16, 5, 2);
    strokeFill(c, C.steelLight, C.ink, 1.8);

    // 3.2 Cột cờ kim loại cao vút
    var poleH = 110;
    c.strokeStyle = C.ink;
    c.lineWidth = 3.4;
    c.beginPath();
    c.moveTo(0, -8);
    c.lineTo(0, -poleH);
    c.stroke();

    // Viên bi kim loại vàng trên chóp cọc
    c.beginPath();
    c.arc(0, -poleH - 3, 5, 0, Math.PI * 2);
    strokeFill(c, C.gold, C.ink, 1.8);

    // 3.3 Hào quang / Sao tung hoa khi 'ok'
    if (state === 'ok') {
      var pulse = 0.5 + 0.5 * Math.sin(t * 8);
      var glowR = 34 + pulse * 14;
      var glow = c.createRadialGradient(28, -poleH + 20, 5, 28, -poleH + 20, glowR);
      glow.addColorStop(0, 'rgba(67, 160, 71, 0.55)');
      glow.addColorStop(1, 'rgba(67, 160, 71, 0)');
      c.fillStyle = glow;
      c.beginPath();
      c.arc(28, -poleH + 20, glowR, 0, Math.PI * 2);
      c.fill();

      // Vài ngôi sao nhỏ bung nở ăn mừng
      drawLittleStar(c, 52, -poleH - 5, 5, t);
      drawLittleStar(c, 62, -poleH + 30, 4, t + 1);
      drawLittleStar(c, 15, -poleH + 50, 4.5, t + 2);
    }

    // 3.4 Lá cờ tam giác uốn lượn theo gió
    c.beginPath();
    c.moveTo(0, -poleH + 4);
    c.quadraticCurveTo(24 + wave2, -poleH + 14 + wave, 52, -poleH + 22 + wave);
    c.quadraticCurveTo(24 + wave2, -poleH + 32 + wave, 0, -poleH + 42);
    c.closePath();
    strokeFill(c, flagCol, C.ink, LINE);

    // Hoa văn hình học trên cờ (không chữ):
    // - 'ok': biểu tượng hình tròn đồng tâm vàng/trắng
    // - 'wait': sọc tam giác thể thao
    // - 'miss': dấu chấm than biểu tượng đồ họa hoặc hình kim cương đỏ đậm
    if (state === 'ok') {
      c.beginPath();
      c.arc(20, -poleH + 23, 6, 0, Math.PI * 2);
      strokeFill(c, C.paper, C.ink, 1.6);
      c.beginPath();
      c.arc(20, -poleH + 23, 2.5, 0, Math.PI * 2);
      strokeFill(c, C.gold, C.ink, 1.0);
    } else if (state === 'miss') {
      // Dấu chấm than đồ họa (chấm vuông + gạch dọc)
      c.fillStyle = C.paper;
      c.fillRect(18, -poleH + 14, 4, 10);
      c.fillRect(18, -poleH + 27, 4, 4);
    } else {
      // Vạch chéo vàng nhạt
      c.fillStyle = 'rgba(255, 255, 255, 0.45)';
      c.beginPath();
      c.moveTo(12, -poleH + 8);
      c.lineTo(20, -poleH + 11);
      c.lineTo(12, -poleH + 36);
      c.lineTo(4, -poleH + 33);
      c.closePath();
      c.fill();
    }

    c.restore();
  }

  // Ngôi sao nhỏ chúc mừng
  function drawLittleStar(c, x, y, r, t) {
    c.save();
    c.translate(x, y);
    c.rotate(t * 3);
    c.fillStyle = C.gold;
    c.strokeStyle = C.ink;
    c.lineWidth = 1.2;
    c.beginPath();
    for (var i = 0; i < 5; i++) {
      var a = (i * Math.PI * 2) / 5 - Math.PI / 2;
      var aIn = a + Math.PI / 5;
      if (i === 0) c.moveTo(Math.cos(a) * r, Math.sin(a) * r);
      else c.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      c.lineTo(Math.cos(aIn) * (r * 0.45), Math.sin(aIn) * (r * 0.45));
    }
    c.closePath();
    c.fill();
    c.stroke();
    c.restore();
  }

  // =========================================================================
  // 4. ROBOT(c, x, gy, {phase, motorOn, upgrades, t})
  // Robot hai chân đi ở bên trái, x = giữa thân, hướng sang phải (facing right).
  // Chân bước lên xuống so le theo góc quay phase rad của bánh răng động cơ M1.
  // =========================================================================
  function robot(c, x, gy, opts) {
    if (typeof x === 'object') { opts = x; x = 200; gy = GY0; }
    x = typeof x === 'number' ? x : 200;
    gy = typeof gy === 'number' ? gy : GY0;
    opts = opts || {};
    var phase = typeof opts.phase === 'number' ? opts.phase : 0;
    var motorOn = !!opts.motorOn;
    var upgrades = opts.upgrades || {};
    var hasWideHead = !!(upgrades.wideHead || upgrades.wideArm || upgrades.head);
    var t = typeof opts.t === 'number' ? opts.t : 0;

    // Góc quay thực tế (nếu motorOn mà phase = 0 thì tự quay theo t)
    var rot = phase !== 0 ? phase : (motorOn ? t * 8 : 0);

    // Kích thước thân robot
    var bodyW = 62;
    var bodyH = 54;
    var bodyY = -68; // tâm thân robot so với gy

    c.save();
    c.translate(x, gy);

    // 4.1 CHÂN SAU (TRÁI / LỚP SAU, chân xa góc nhìn)
    // Pha góc lệch PI so với chân trước
    var phaseRear = rot + Math.PI;
    drawRobotLeg(c, -10, bodyY + 18, phaseRear, true);

    // 4.2 KHỐI ĐỘNG CƠ M1 (be-3578.dat) GẮN PHÍA SAU THÂN ROBOT
    // Khối hộp động cơ màu xám đậm / trắng
    var m1X = -bodyW / 2 - 8;
    var m1Y = bodyY - 14;
    rr(c, m1X, m1Y, 26, 26, 4);
    strokeFill(c, C.hole, C.ink, LINE);
    rr(c, m1X + 4, m1Y + 4, 18, 18, 3);
    strokeFill(c, C.accentDark, C.ink, 1.6);
    // Trục động cơ cam
    c.beginPath();
    c.arc(m1X + 13, m1Y + 13, 5, 0, Math.PI * 2);
    strokeFill(c, C.orange, C.ink, 1.4);
    // Dây cáp điện dẫn từ động cơ vào thân
    c.strokeStyle = C.ink;
    c.lineWidth = 2.4;
    c.beginPath();
    c.moveTo(m1X + 8, m1Y + 26);
    c.quadraticCurveTo(m1X + 16, m1Y + 36, -bodyW / 2 + 10, bodyY + 16);
    c.stroke();

    // 4.3 THÂN ROBOT CHÍNH (KHỐI KIT ALPHA 330: TRẮNG - CYAN)
    // Thân dầm chính vuông vức bo góc
    rr(c, -bodyW / 2, bodyY - bodyH / 2, bodyW, bodyH, 7);
    strokeFill(c, C.paper, C.ink, LINE);

    // Dải trang trí công nghệ màu xanh ngọc (cyan - C.accent)
    rr(c, -bodyW / 2 + 5, bodyY - bodyH / 2 + 6, bodyW - 10, 14, 3);
    strokeFill(c, C.accent, C.accentDark, 1.8);

    // Hàng lỗ chốt tròn đặc trưng kit Alpha 330 trên thân
    for (var bi = 0; bi < 3; bi++) {
      var bx = -bodyW / 2 + 13 + bi * 18;
      c.beginPath();
      c.arc(bx, bodyY + 8, 4.2, 0, Math.PI * 2);
      strokeFill(c, C.hole, C.ink, 1.4);
    }

    // Đèn LED chỉ báo động cơ M1 (xanh lá khi motorOn, xám khi tắt)
    c.beginPath();
    c.arc(-bodyW / 2 + 12, bodyY - bodyH / 2 + 13, 3.5, 0, Math.PI * 2);
    strokeFill(c, motorOn ? C.ok : '#78909c', C.ink, 1.2);

    // 4.4 BÁNH RĂNG LỚN (24 RĂNG) TRUYỀN ĐỘNG CHÂN
    // Trục bánh răng ở tâm thân robot
    var gearX = 4;
    var gearY = bodyY + 8;
    drawSpurGear(c, gearX, gearY, 20, 14, rot, C.gold);

    // Chốt liên kết lệch tâm (crank pin) trên bánh răng
    var crankR = 11;
    var pinFrontX = gearX + Math.cos(rot) * crankR;
    var pinFrontY = gearY + Math.sin(rot) * crankR;
    c.beginPath();
    c.arc(pinFrontX, pinFrontY, 3.8, 0, Math.PI * 2);
    strokeFill(c, C.warn, C.ink, 1.4);

    // 4.5 CHÂN TRƯỚC (PHẢI / LỚP TRƯỚC, chân gần góc nhìn)
    drawRobotLeg(c, 8, bodyY + 18, rot, false);

    // 4.6 ĐẦU ĐẨY PHÍA TRƯỚC ROBOT (VƯƠN SANG PHẢI VỀ PHÍA XE)
    // Càng đẩy ngang từ thân vươn sang phải
    var armRootX = bodyW / 2 - 4;
    var armRootY = bodyY + 2;
    var armLen = 30;

    // Thanh dầm đẩy ngang màu xanh ngọc / trắng
    rr(c, armRootX, armRootY - 6, armLen, 12, 3);
    strokeFill(c, C.accent, C.ink, LINE);

    // Chốt định vị trên thanh đẩy
    c.beginPath();
    c.arc(armRootX + 12, armRootY, 3.2, 0, Math.PI * 2);
    strokeFill(c, C.hole, C.ink, 1.4);

    var bumperX = armRootX + armLen;

    // GÓI SÁNG TẠO ①: ĐẦU ĐẨY RỘNG (wideHead / wideArm)
    if (hasWideHead) {
      // Thanh đẩy mở rộng chữ T cao và rộng hơn, có 2 mút cao su êm
      var headH = 50;
      var headW = 12;
      // Khung chữ T nẹp vào thanh đẩy
      rr(c, bumperX - 2, armRootY - headH / 2, headW, headH, 4);
      strokeFill(c, C.paper, C.ink, LINE);
      // Hai đệm mút cao su tiếp xúc lực đẩy ở 2 đầu
      rr(c, bumperX + headW - 3, armRootY - headH / 2 + 3, 6, 16, 2);
      strokeFill(c, C.accentDark, C.ink, 1.4);
      rr(c, bumperX + headW - 3, armRootY + headH / 2 - 19, 6, 16, 2);
      strokeFill(c, C.accentDark, C.ink, 1.4);
      // Nẹp định vị màu vàng
      c.fillStyle = C.gold;
      c.fillRect(bumperX, armRootY - 4, 8, 8);
      c.strokeRect(bumperX, armRootY - 4, 8, 8);
    } else {
      // Đầu đẩy tiêu chuẩn gọn gàng
      var stdH = 26;
      rr(c, bumperX - 2, armRootY - stdH / 2, 8, stdH, 3);
      strokeFill(c, C.paperWarm, C.ink, LINE);
      // Mút cao su tiếp xúc
      rr(c, bumperX + 5, armRootY - stdH / 2 + 4, 5, stdH - 8, 2);
      strokeFill(c, C.accentDark, C.ink, 1.4);
    }

    // 4.7 Mắt cảm biến / biểu tượng robot thân thiện phía trên
    // Đầu robot nhỏ gọn tích hợp phía trên thân
    rr(c, -bodyW / 2 + 10, bodyY - bodyH / 2 - 16, 32, 16, [5, 5, 0, 0]);
    strokeFill(c, C.paperWarm, C.ink, LINE);
    // Kính quan sát tròn
    c.beginPath();
    c.arc(-bodyW / 2 + 26, bodyY - bodyH / 2 - 8, 5, 0, Math.PI * 2);
    strokeFill(c, C.accent, C.ink, 1.5);

    c.restore();
  }

  // Bánh răng trụ răng cưa bo chuẩn
  function drawSpurGear(c, x, y, r, teeth, ang, col) {
    c.save();
    c.translate(x, y);
    c.rotate(ang);
    c.beginPath();
    for (var i = 0; i < teeth; i++) {
      var a0 = (i * Math.PI * 2) / teeth;
      var step = (Math.PI * 2) / teeth;
      var rIn = r * 0.82;
      var rOut = r;
      if (i === 0) c.moveTo(Math.cos(a0) * rIn, Math.sin(a0) * rIn);
      else c.lineTo(Math.cos(a0) * rIn, Math.sin(a0) * rIn);
      c.lineTo(Math.cos(a0 + step * 0.28) * rOut, Math.sin(a0 + step * 0.28) * rOut);
      c.lineTo(Math.cos(a0 + step * 0.62) * rOut, Math.sin(a0 + step * 0.62) * rOut);
      c.lineTo(Math.cos(a0 + step * 0.90) * rIn, Math.sin(a0 + step * 0.90) * rIn);
    }
    c.closePath();
    strokeFill(c, col, C.ink, 2.0);
    // Vành tâm bánh răng
    c.beginPath();
    c.arc(0, 0, r * 0.45, 0, Math.PI * 2);
    strokeFill(c, C.paper, C.ink, 1.6);
    c.fillStyle = C.ink;
    c.fillRect(-2, -5, 4, 10);
    c.fillRect(-5, -2, 10, 4);
    c.restore();
  }

  // Cơ cấu chân bước 2 tầng của robot đẩy xe (thanh đùi + bàn chân dài chạm đất)
  function drawRobotLeg(c, hipOffsetX, hipY, angle, isRear) {
    c.save();

    // Tính toán góc nâng chân theo sin / cos của pha quay bánh răng
    var crankR = 9;
    var crankX = hipOffsetX + Math.cos(angle) * crankR;
    var crankY = hipY + Math.sin(angle) * crankR;

    // Chiều cao nâng chân: khi sin(angle) < 0 thì chân nhấc lên khỏi mặt đất tối đa 12px
    var lift = Math.max(0, -Math.sin(angle)) * 12;
    var strideX = Math.cos(angle) * 14;

    var footY = -lift; // mặt đất là y = 0
    var footX = crankX + strideX;

    // Thanh truyền lực (thanh đùi nối từ trục lệch tâm xuống chân)
    c.strokeStyle = isRear ? C.inkSoft : C.ink;
    c.lineWidth = isRear ? 4.0 : 5.0;
    c.beginPath();
    c.moveTo(crankX, crankY);
    c.lineTo(footX, footY - 14);
    c.stroke();

    // Khớp gối tròn
    c.beginPath();
    c.arc(crankX, crankY, isRear ? 4.0 : 5.0, 0, Math.PI * 2);
    strokeFill(c, isRear ? '#90a4ae' : C.paper, C.ink, 1.8);

    // Bàn chân dài nằm ngang tiếp xúc mặt đất (shoe)
    var footW = 34;
    var footH = 10;
    var footCol = isRear ? '#78909c' : C.accentDark;
    rr(c, footX - footW * 0.45, footY - footH, footW, footH, 3);
    strokeFill(c, footCol, C.ink, isRear ? 1.8 : LINE);

    // Đế cao su màu đen bám đường
    c.fillStyle = C.ink;
    c.fillRect(footX - footW * 0.45 + 2, footY - 3, footW - 4, 3);

    c.restore();
  }

  // =========================================================================
  // 5. CART(c, x, gy, {wheelAngle, load, upgrades, over, t})
  // Xe hàng 2 bánh bên phải, x = giữa xe hàng, bánh xe sau quay khi được đẩy.
  // upgrades: {brace, backStop, tray}; load: 'light'|'heavy'|'empty'.
  // =========================================================================
  function cart(c, x, gy, opts) {
    if (typeof x === 'object') { opts = x; x = 320; gy = GY0; }
    x = typeof x === 'number' ? x : 320;
    gy = typeof gy === 'number' ? gy : GY0;
    opts = opts || {};
    var wheelAngle = typeof opts.wheelAngle === 'number' ? opts.wheelAngle : 0;
    var load = opts.load || 'light';
    var upgrades = opts.upgrades || {};
    var hasBrace = !!(upgrades.brace || upgrades.side);
    var hasBackStop = !!(upgrades.backStop || upgrades.back);
    var hasTray = !!(upgrades.tray || upgrades.deck);
    var over = typeof opts.over === 'number' ? opts.over : (opts.over ? 1 : 0);
    var t = typeof opts.t === 'number' ? opts.t : 0;

    // Chiều dài sàn xe
    var cartW = 108;
    var cartH = 18;
    var bedY = -28; // mặt trên sàn xe so với gy

    c.save();
    c.translate(x, gy);

    // Nếu xe phanh gấp hoặc bị quán tính đẩy quá đà (over > 0): hơi nghiêng chúi đầu
    if (over > 0.05) {
      c.rotate(-0.06 * Math.min(1.2, over));
    }

    // 5.1 BÁNH XE SAU (LỐP CAO SU 2815, VÀNH 4185)
    // Vị trí trục bánh xe sau ở phía đuôi xe
    var rearWheelX = -cartW / 2 + 24;
    var rearWheelY = -18;
    var wheelR = 18;

    // Bánh xe lăn phụ trợ / chân trượt phía trước
    var frontSkidX = cartW / 2 - 16;
    var frontSkidY = -8;
    c.beginPath();
    c.arc(frontSkidX, frontSkidY, 7.5, 0, Math.PI * 2);
    strokeFill(c, C.hole, C.ink, LINE);
    c.beginPath();
    c.arc(frontSkidX, frontSkidY, 2.5, 0, Math.PI * 2);
    strokeFill(c, C.ink, C.ink, 1.0);

    // 5.2 THANH CHỐNG HAI BÊN XE (GÓI SÁNG TẠO ②: brace)
    // Thanh giằng chéo gia cố từ sàn xe xuống trục bánh xe, chống nghiêng
    if (hasBrace) {
      c.strokeStyle = C.orangeDark;
      c.lineWidth = 4.2;
      c.beginPath();
      c.moveTo(-cartW / 2 + 10, bedY - 14);
      c.lineTo(rearWheelX, rearWheelY);
      c.lineTo(frontSkidX - 10, bedY - 2);
      c.stroke();

      // Chốt ghim cố định thanh chống
      c.beginPath();
      c.arc(-cartW / 2 + 10, bedY - 14, 3.2, 0, Math.PI * 2);
      c.arc(rearWheelX, rearWheelY, 3.2, 0, Math.PI * 2);
      strokeFill(c, C.gold, C.ink, 1.4);
    }

    // 5.3 KHUNG SÀN XE CHÍNH MÀU CAM (C.orange)
    rr(c, -cartW / 2, bedY - cartH, cartW, cartH, 4);
    strokeFill(c, C.orange, C.ink, LINE);

    // Vạch trang trí lõm kỹ thuật trên thành xe
    c.fillStyle = C.orangeDark;
    c.fillRect(-cartW / 2 + 12, bedY - cartH + 5, cartW - 24, 7);
    c.strokeRect(-cartW / 2 + 12, bedY - cartH + 5, cartW - 24, 7);

    // Hàng đinh tán / chốt kỹ thuật màu vàng
    for (var bi = 0; bi < 4; bi++) {
      var bx = -cartW / 2 + 20 + bi * 22;
      c.beginPath();
      c.arc(bx, bedY - cartH + 8.5, 2.4, 0, Math.PI * 2);
      strokeFill(c, C.gold, C.ink, 1.0);
    }

    // 5.4 THANH ĐẨY PHÍA SAU ĐUÔI XE (NƠI ROBOT TÌ VÀO ĐẨY)
    // Cột đón lực đẩy thẳng đứng khớp với đầu đẩy của robot
    var pushBarX = -cartW / 2 - 2;
    var pushBarH = 34;
    var pushBarY = bedY - cartH - 8;
    rr(c, pushBarX - 6, pushBarY, 8, pushBarH, 2);
    strokeFill(c, C.paperWarm, C.ink, LINE);
    // Đệm cao su màu đen tiếp xúc
    rr(c, pushBarX - 9, pushBarY + 6, 4, pushBarH - 12, 1);
    strokeFill(c, C.ink, C.ink, 1.2);

    // 5.5 KHUNG CHẶN HÀNG PHÍA SAU (GÓI SÁNG TẠO ③: backStop)
    // Giá đỡ kim loại chữ U dựng đứng ở đuôi xe giữ thùng không trượt
    if (hasBackStop) {
      var stopH = 42;
      var stopX = -cartW / 2 + 8;
      var stopY = bedY - cartH - stopH;
      // Hai thanh đứng
      rr(c, stopX, stopY, 6, stopH, 2);
      strokeFill(c, C.warn, C.ink, LINE);
      // Hai thanh giằng ngang
      rr(c, stopX - 2, stopY + 8, 12, 5, 1);
      strokeFill(c, C.paper, C.ink, 1.4);
      rr(c, stopX - 2, stopY + 24, 12, 5, 1);
      strokeFill(c, C.paper, C.ink, 1.4);
    }

    // 5.6 KHAY CHỞ THÙNG CÓ CHỐT GIỮ (GÓI SÁNG TẠO ④: tray)
    // Khay phẳng màu nâu gỗ nẹp viền kim loại trên sàn xe
    if (hasTray) {
      var trayW = cartW * 0.65;
      var trayX = -cartW / 2 + 28;
      var trayY = bedY - cartH - 6;
      rr(c, trayX, trayY, trayW, 6, 2);
      strokeFill(c, C.crateWood, C.ink, 1.8);
      // 2 chốt định vị khóa thùng ở 2 đầu khay
      rr(c, trayX - 2, trayY - 5, 5, 6, 1);
      strokeFill(c, C.gold, C.ink, 1.2);
      rr(c, trayX + trayW - 3, trayY - 5, 5, 6, 1);
      strokeFill(c, C.gold, C.ink, 1.2);
    }

    // 5.7 BỘ ĐIỀU KHIỂN M5-RCU (be-5158.dat) GẮN TRÊN XE
    // Đặt ở vị trí trước của sàn xe
    var rcuW = 38;
    var rcuH = 22;
    var rcuX = cartW / 2 - rcuW - 6;
    var rcuY = bedY - cartH - rcuH;
    rr(c, rcuX, rcuY, rcuW, rcuH, 4);
    strokeFill(c, C.paper, C.ink, LINE);
    // Dải viền xanh ngọc RCU
    rr(c, rcuX + 3, rcuY + 3, rcuW - 6, 6, 2);
    strokeFill(c, C.accent, C.accentDark, 1.2);
    // Ma trận LED 3x3 tượng trưng trên RCU
    for (var mr = 0; mr < 2; mr++) {
      for (var mc = 0; mc < 3; mc++) {
        c.fillStyle = C.ok;
        c.beginPath();
        c.arc(rcuX + 9 + mc * 10, rcuY + 14 + mr * 5, 1.6, 0, Math.PI * 2);
        c.fill();
      }
    }

    // 5.8 HÀNG HÓA CHỞ TRÊN XE (load: 'light'|'heavy')
    if (load !== 'empty') {
      var isHeavy = (load === 'heavy');
      var crateBaseY = hasTray ? (bedY - cartH - 6) : (bedY - cartH);
      var crateX = -cartW / 2 + 44;

      if (isHeavy) {
        // TẢI NẶNG: Thùng to bự hoặc 2 thùng xếp chồng
        crate(c, crateX, crateBaseY, { big: true, t: t });
        // Thùng nhỏ xếp phụ bên cạnh
        crate(c, crateX + 32, crateBaseY, { big: false, t: t });
        // Dây chằng an toàn màu vàng nẹp chéo qua các thùng
        c.strokeStyle = C.gold;
        c.lineWidth = 2.4;
        c.beginPath();
        c.moveTo(crateX - 22, crateBaseY);
        c.lineTo(crateX + 10, crateBaseY - 42);
        c.lineTo(crateX + 46, crateBaseY);
        c.stroke();
      } else {
        // TẢI NHẸ: 1 Thùng hàng gọn gàng
        crate(c, crateX, crateBaseY, { big: false, t: t });
      }
    }

    // 5.9 VẼ LỐP BÁNH XE SAU (LỚP TRÊN)
    // Bánh xe quay nan hoa theo góc wheelAngle
    drawCartWheel(c, rearWheelX, rearWheelY, wheelR, wheelAngle);

    c.restore();
  }

  // Bánh xe xe hàng (lốp cao su to dày + vành nan hoa xoay)
  function drawCartWheel(c, x, y, r, angle) {
    c.save();
    c.translate(x, y);

    // Lốp cao su màu đen xám
    c.beginPath();
    c.arc(0, 0, r, 0, Math.PI * 2);
    strokeFill(c, C.ink, C.ink, LINE);

    // Rãnh gai lốp (tread notches)
    c.strokeStyle = '#37474f';
    c.lineWidth = 2.0;
    c.setLineDash([4, 4]);
    c.beginPath();
    c.arc(0, 0, r - 1.5, 0, Math.PI * 2);
    c.stroke();
    c.setLineDash([]);

    // Vành bánh xe màu trắng sáng (vành 4185)
    c.beginPath();
    c.arc(0, 0, r * 0.62, 0, Math.PI * 2);
    strokeFill(c, C.paperWarm, C.ink, 1.8);

    // Nan hoa quay theo góc angle
    c.save();
    c.rotate(angle);
    c.strokeStyle = C.accentDark;
    c.lineWidth = 2.2;
    for (var i = 0; i < 4; i++) {
      c.beginPath();
      c.moveTo(-r * 0.55, 0);
      c.lineTo(r * 0.55, 0);
      c.stroke();
      c.rotate(Math.PI / 4);
    }
    c.restore();

    // Ổ trục tâm màu vàng
    c.beginPath();
    c.arc(0, 0, 4.5, 0, Math.PI * 2);
    strokeFill(c, C.gold, C.ink, 1.4);

    c.restore();
  }

  // =========================================================================
  // 6. CRATE(c, x, y, {big, color, t})
  // Thùng hàng STEAM: đai nẹp kim loại, nan gỗ bo góc, không chữ
  // =========================================================================
  function crate(c, x, y, opts) {
    if (typeof x === 'object') { opts = x; x = 450; y = 280; }
    x = typeof x === 'number' ? x : 450;
    y = typeof y === 'number' ? y : 280;
    opts = opts || {};
    var isBig = !!opts.big;
    var cw = isBig ? 46 : 32;
    var ch = isBig ? 38 : 26;
    var crateCol = opts.color || (isBig ? '#bcaaa4' : C.crateWood);

    c.save();
    c.translate(x, y);

    // Thân thùng gỗ / container mini bo góc
    rr(c, -cw / 2, -ch, cw, ch, 3);
    strokeFill(c, crateCol, C.ink, LINE);

    // Đai nẹp kim loại góc và mép thùng
    var bandW = isBig ? 6 : 4.5;
    c.fillStyle = C.crateBand;
    // Nẹp 2 bên
    c.fillRect(-cw / 2, -ch, bandW, ch);
    c.strokeRect(-cw / 2, -ch, bandW, ch);
    c.fillRect(cw / 2 - bandW, -ch, bandW, ch);
    c.strokeRect(cw / 2 - bandW, -ch, bandW, ch);

    // Đai nẹp giữa (nếu thùng to)
    if (isBig) {
      c.fillRect(-cw / 2, -ch + ch / 2 - 2.5, cw, 5);
      c.strokeRect(-cw / 2, -ch + ch / 2 - 2.5, cw, 5);

      // Biểu tượng tam giác hình học công nghệ (không chữ)
      c.beginPath();
      c.moveTo(0, -ch + 10);
      c.lineTo(-8, -ch + 24);
      c.lineTo(8, -ch + 24);
      c.closePath();
      strokeFill(c, C.gold, C.ink, 1.4);
    } else {
      // Nan gỗ chéo trang trí
      c.strokeStyle = C.woodDark;
      c.lineWidth = 1.4;
      c.beginPath();
      c.moveTo(-cw / 2 + bandW + 2, -ch + 4);
      c.lineTo(cw / 2 - bandW - 2, -4);
      c.stroke();
    }

    // Đinh tán kim loại ở 4 góc nẹp
    for (var r = -1; r <= 1; r += 2) {
      for (var col = -1; col <= 1; col += 2) {
        c.beginPath();
        c.arc(col * (cw / 2 - bandW / 2), -ch / 2 + r * (ch / 2 - 5), 1.6, 0, Math.PI * 2);
        strokeFill(c, C.steelLight, C.ink, 0.8);
      }
    }

    c.restore();
  }

  // =========================================================================
  // 7. SKIDMARK(c, x, gy, {length, opacity})
  // Vết phanh trượt lốp cao su trên đường đua khi dừng hoặc vượt vạch
  // =========================================================================
  function skidMark(c, x, gy, opts) {
    if (typeof x === 'object') { opts = x; x = 500; gy = GY0; }
    x = typeof x === 'number' ? x : 500;
    gy = typeof gy === 'number' ? gy : GY0;
    opts = opts || {};
    var len = typeof opts.length === 'number' ? opts.length : 55;
    var op = typeof opts.opacity === 'number' ? opts.opacity : 0.7;

    c.save();
    c.translate(x, gy);
    c.strokeStyle = 'rgba(30, 42, 52, ' + op.toFixed(2) + ')';
    c.lineWidth = 4.2;
    c.lineCap = 'round';
    // 2 vệt bánh xe song song
    c.beginPath();
    c.moveTo(-len, -2);
    c.lineTo(0, -2);
    c.moveTo(-len * 0.85, 3);
    c.lineTo(0, 3);
    c.stroke();

    // Vài hạt bụi ma sát bốc lên
    c.fillStyle = 'rgba(120, 110, 100, ' + (op * 0.8).toFixed(2) + ')';
    for (var i = 0; i < 4; i++) {
      c.beginPath();
      c.arc(-i * 12, -6 - (i % 2) * 5, 2.5, 0, Math.PI * 2);
      c.fill();
    }
    c.restore();
  }

  // =========================================================================
  // 8. PUSHSPARK(c, x, y, {t})
  // Vệt chuyển động / bụi lực đẩy tại điểm tiếp xúc robot và xe hàng
  // =========================================================================
  function pushSpark(c, x, y, opts) {
    if (typeof x === 'object') { opts = x; x = 260; y = 380; }
    x = typeof x === 'number' ? x : 260;
    y = typeof y === 'number' ? y : 380;
    opts = opts || {};
    var t = typeof opts.t === 'number' ? opts.t : 0;

    c.save();
    c.translate(x, y);

    // Vòng sóng lực đẩy lan tỏa
    for (var i = 0; i < 3; i++) {
      var prog = ((t * 4 + i * 0.33) % 1 + 1) % 1;
      var rad = 4 + prog * 16;
      var alpha = (1 - prog) * 0.75;
      c.strokeStyle = 'rgba(61, 193, 220, ' + alpha.toFixed(2) + ')';
      c.lineWidth = 2.2 * (1 - prog * 0.5);
      c.beginPath();
      c.arc(0, 0, rad, -Math.PI * 0.45, Math.PI * 0.45);
      c.stroke();
    }

    // Đốm sáng vàng ở tâm tiếp xúc
    c.fillStyle = C.gold;
    c.beginPath();
    c.arc(0, 0, 3.5, 0, Math.PI * 2);
    c.fill();

    c.restore();
  }

  // =========================================================================
  // 9. NOTEA(c, x, y, {t})
  // Nốt nhạc bay lên (Giai điệu A: chúc mừng hoàn thành nhiệm vụ, xe tới đích)
  // =========================================================================
  function noteA(c, x, y, opts) {
    if (typeof x === 'object') { opts = x; x = 550; y = 300; }
    x = typeof x === 'number' ? x : 550;
    y = typeof y === 'number' ? y : 300;
    opts = opts || {};
    var t = typeof opts.t === 'number' ? opts.t : 0;

    c.save();

    var notes = [
      { dt: 0.00, col: C.gold, type: 'single', dx: -16, scale: 1.0 },
      { dt: 0.35, col: C.accent, type: 'double', dx: 14, scale: 1.15 },
      { dt: 0.70, col: C.orange, type: 'single', dx: -6, scale: 0.9 }
    ];

    for (var i = 0; i < notes.length; i++) {
      var nt = notes[i];
      var prog = ((t * 0.8 + nt.dt) % 1 + 1) % 1;
      var curY = y - prog * 75;
      var curX = x + nt.dx + Math.sin(t * 4.5 + i * 2) * 12;
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

        // Hạt lấp lánh vàng nhỏ
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
  // 10. UPGRADE(c, type, x, y, {size})
  // Vẽ độc lập từng gói sáng tạo trong bộ A (vận chuyển)
  // type: 'wideHead'|'brace'|'backStop'|'tray'
  // =========================================================================
  function upgrade(c, type, x, y, opts) {
    x = typeof x === 'number' ? x : 50;
    y = typeof y === 'number' ? y : 50;
    opts = opts || {};
    var s = opts.size || 1;

    c.save();
    c.translate(x, y);
    c.scale(s, s);

    if (type === 'wideHead' || type === 'wideArm' || type === 'head') {
      // ① Đầu đẩy rộng
      rr(c, -16, -18, 10, 36, 3);
      strokeFill(c, C.paperWarm, C.ink, LINE);
      rr(c, -6, -24, 12, 48, 4);
      strokeFill(c, C.accent, C.ink, LINE);
      rr(c, 6, -20, 6, 14, 2);
      strokeFill(c, C.accentDark, C.ink, 1.4);
      rr(c, 6, 6, 6, 14, 2);
      strokeFill(c, C.accentDark, C.ink, 1.4);
    } else if (type === 'brace' || type === 'side') {
      // ② Thanh chống hai bên
      c.strokeStyle = C.orange;
      c.lineWidth = 5.0;
      c.beginPath();
      c.moveTo(-24, 18);
      c.lineTo(0, -18);
      c.lineTo(24, 18);
      c.stroke();
      rr(c, -26, 14, 52, 6, 2);
      strokeFill(c, C.orangeDark, C.ink, 1.8);
      c.beginPath();
      c.arc(0, -18, 4, 0, Math.PI * 2);
      strokeFill(c, C.gold, C.ink, 1.4);
    } else if (type === 'backStop' || type === 'back') {
      // ③ Khung chặn hàng phía sau
      rr(c, -18, -24, 8, 44, 3);
      strokeFill(c, C.warn, C.ink, LINE);
      rr(c, -14, -20, 32, 6, 2);
      strokeFill(c, C.paper, C.ink, 1.6);
      rr(c, -14, -2, 32, 6, 2);
      strokeFill(c, C.paper, C.ink, 1.6);
    } else if (type === 'tray' || type === 'deck') {
      // ④ Khay chở thùng có chốt giữ
      rr(c, -26, -4, 52, 8, 2);
      strokeFill(c, C.crateWood, C.ink, LINE);
      rr(c, -24, -12, 6, 9, 2);
      strokeFill(c, C.gold, C.ink, 1.4);
      rr(c, 18, -12, 6, 9, 2);
      strokeFill(c, C.gold, C.ink, 1.4);
    }

    c.restore();
  }

  // =========================================================================
  // 11. SCENE(c, opts)
  // Hàm vẽ trọn vẹn toàn cảnh tích hợp sẵn sàng cho mô phỏng toàn bài
  // =========================================================================
  function scene(c, opts) {
    opts = opts || {};
    var t = typeof opts.t === 'number' ? opts.t : 0;
    var gy = typeof opts.gy === 'number' ? opts.gy : GY0;
    var robotX = typeof opts.robotX === 'number' ? opts.robotX : 190;
    var cartX = typeof opts.cartX === 'number' ? opts.cartX : (robotX + 104);
    var targetLine = typeof opts.targetLine === 'number' ? opts.targetLine : 80;
    var lines = Array.isArray(opts.lines) ? opts.lines : [targetLine];
    var flagState = opts.flagState || 'wait';
    var motorOn = !!opts.motorOn;
    var phase = typeof opts.phase === 'number' ? opts.phase : (motorOn ? t * 8 : 0);
    var wheelAngle = typeof opts.wheelAngle === 'number' ? opts.wheelAngle : (cartX / 18);
    var load = opts.load || 'light';
    var upgrades = opts.upgrades || {};
    var over = typeof opts.over === 'number' ? opts.over : (opts.over ? 1 : 0);
    var showNote = !!opts.showNote;

    var flagX = cmToX(targetLine, opts);

    c.save();

    // 1. Nền bãi giao hàng ngoài trời
    background(c, { t: t, gy: gy });

    // 2. Đường đua và thước đo 0–120 cm
    track(c, { gy: gy, lines: lines, targetLine: targetLine, t: t });

    // 3. Cờ đích tại vị trí cm
    flag(c, flagX, gy, { state: flagState, t: t });

    // 4. Vết phanh trượt lốp nếu có over
    if (over > 0.05) {
      skidMark(c, cartX - 28, gy, { length: 45 * Math.min(1.5, over), opacity: 0.7 });
    }

    // 5. Robot hai chân đẩy xe
    robot(c, robotX, gy, {
      phase: phase,
      motorOn: motorOn,
      upgrades: upgrades,
      t: t
    });

    // 6. Hiệu ứng lực đẩy tại điểm tiếp xúc robot và xe khi động cơ quay
    if (motorOn) {
      var contactX = robotX + 54;
      pushSpark(c, contactX, gy - 66, { t: t });
    }

    // 7. Xe hàng 2 bánh chở tải
    cart(c, cartX, gy, {
      wheelAngle: wheelAngle,
      load: load,
      upgrades: upgrades,
      over: over,
      t: t
    });

    // 8. Nốt nhạc bay lên khi hoàn thành
    if (showNote || flagState === 'ok') {
      noteA(c, flagX - 10, gy - 90, { t: t });
    }

    c.restore();
  }

  // =========================================================================
  // XUẤT GIAO DIỆN window.Lop3Bai15Art
  // =========================================================================
  var Lop3Bai15Art = {
    W: W0,
    H: H0,
    GROUND_Y: GY0,
    LINE: LINE,
    C: C,
    DEFAULT_TRACK: DEFAULT_TRACK,
    cmToX: cmToX,
    xToCm: xToCm,
    background: background,
    track: track,
    flag: flag,
    robot: robot,
    cart: cart,
    crate: crate,
    skidMark: skidMark,
    pushSpark: pushSpark,
    noteA: noteA,
    upgrade: upgrade,
    scene: scene,
    // Alias tương thích chuẩn hệ thống
    drawBackground: background,
    drawTrack: track,
    drawFlag: flag,
    drawRobot: robot,
    drawCart: cart,
    drawCrate: crate,
    drawSkidMark: skidMark,
    drawPushSpark: pushSpark,
    drawNoteA: noteA,
    drawUpgrade: upgrade,
    drawScene: scene
  };

  if (typeof window !== 'undefined') {
    window.Lop3Bai15Art = Lop3Bai15Art;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Lop3Bai15Art;
  }
})();
