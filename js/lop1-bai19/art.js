// Thư viện vẽ cảnh Lớp 1 · Bài 19: "Ốc sên quý hiếm" (window.Lop1Bai19Art).
// Khung nhìn chuẩn: 900x560, nhìn TỪ TRÊN XUỐNG (top-down view).
// Dành cho học sinh Lớp 1 trên máy tính bảng: khối to, viền đậm C.ink, nét LINE = 2.6, không chữ trong hình, không vũ khí.
// Tương thích chuẩn ZMArt Alpha 330. Không dùng ảnh ngoài, không dùng font ngoài, không dùng Math.random() khi vẽ.
(function () {
  'use strict';

  var W0 = 900;
  var H0 = 560;
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

  // Bổ sung các mã màu chuyên biệt cho vườn đêm & ốc sên quý hiếm
  var C_EXT = {
    nightSoil: '#15241b',
    nightSoilDark: '#0e1a13',
    nightGrass: '#1e3825',
    nightGrassLight: '#2a4d33',
    moonBlue: '#90caf9',
    snailBody: '#f7f1e5',
    snailBodyDark: '#dfd2bc',
    snailSlime: 'rgba(100, 240, 190, 0.45)',
    ledGreen: '#22c55e',
    ledGreenGlow: 'rgba(34, 197, 94, 0.4)',
    mossDark: '#2e5622',
    mossLight: '#5b963b',
    straw: '#e6be67',
    strawDark: '#b38b36',
    fenceWood: '#795548',
    fenceLight: '#9e796c'
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

  // Dữ liệu sỏi đất và đốm cỏ cố định trên mặt đất (không dùng Math.random để tránh chớp giật)
  var GARDEN_PELLETS = [
    { x: 75, y: 95, rx: 6, ry: 4, c: '#0b1610' },
    { x: 190, y: 70, rx: 8, ry: 5, c: '#233d2a' },
    { x: 310, y: 110, rx: 5, ry: 3, c: '#0b1610' },
    { x: 440, y: 80, rx: 9, ry: 6, c: '#233d2a' },
    { x: 570, y: 120, rx: 6, ry: 4, c: '#0b1610' },
    { x: 710, y: 85, rx: 7, ry: 5, c: '#233d2a' },
    { x: 800, y: 140, rx: 5, ry: 3, c: '#0b1610' },
    { x: 130, y: 220, rx: 7, ry: 4, c: '#233d2a' },
    { x: 260, y: 180, rx: 6, ry: 4, c: '#0b1610' },
    { x: 400, y: 230, rx: 8, ry: 5, c: '#233d2a' },
    { x: 520, y: 200, rx: 5, ry: 3, c: '#0b1610' },
    { x: 670, y: 240, rx: 9, ry: 6, c: '#233d2a' },
    { x: 790, y: 260, rx: 6, ry: 4, c: '#0b1610' },
    { x: 85, y: 360, rx: 7, ry: 5, c: '#233d2a' },
    { x: 210, y: 390, rx: 6, ry: 3, c: '#0b1610' },
    { x: 350, y: 350, rx: 8, ry: 5, c: '#233d2a' },
    { x: 480, y: 380, rx: 5, ry: 3, c: '#0b1610' },
    { x: 610, y: 360, rx: 9, ry: 6, c: '#233d2a' },
    { x: 740, y: 390, rx: 6, ry: 4, c: '#0b1610' },
    { x: 120, y: 490, rx: 8, ry: 5, c: '#233d2a' },
    { x: 270, y: 470, rx: 5, ry: 3, c: '#0b1610' },
    { x: 410, y: 500, rx: 7, ry: 4, c: '#233d2a' },
    { x: 550, y: 475, rx: 6, ry: 4, c: '#0b1610' },
    { x: 690, y: 510, rx: 8, ry: 5, c: '#233d2a' },
    { x: 810, y: 470, rx: 5, ry: 3, c: '#0b1610' }
  ];

  // Dữ liệu bụi cỏ đêm cố định
  var GRASS_CLUMPS = [
    { x: 90, y: 150, r: 18, rot: 0.2 },
    { x: 230, y: 110, r: 24, rot: -0.4 },
    { x: 380, y: 140, r: 20, rot: 0.5 },
    { x: 500, y: 90, r: 22, rot: -0.1 },
    { x: 650, y: 130, r: 25, rot: 0.3 },
    { x: 770, y: 100, r: 19, rot: -0.5 },
    { x: 160, y: 430, r: 22, rot: 0.4 },
    { x: 300, y: 450, r: 26, rot: -0.2 },
    { x: 460, y: 440, r: 20, rot: 0.6 },
    { x: 590, y: 460, r: 24, rot: -0.3 },
    { x: 730, y: 440, r: 21, rot: 0.1 }
  ];

  // Dữ liệu đom đóm cố định theo pha
  var FIREFLY_DATA = [
    { bx: 160, by: 130, ax: 45, ay: 30, spd: 1.1, phase: 0.2, sz: 3.5 },
    { bx: 340, by: 80, ax: 60, ay: 35, spd: 0.9, phase: 1.8, sz: 4.0 },
    { bx: 520, by: 150, ax: 50, ay: 40, spd: 1.3, phase: 3.1, sz: 3.2 },
    { bx: 710, by: 180, ax: 40, ay: 28, spd: 0.8, phase: 4.5, sz: 3.8 },
    { bx: 240, by: 320, ax: 55, ay: 35, spd: 1.2, phase: 2.2, sz: 4.2 },
    { bx: 430, by: 290, ax: 65, ay: 45, spd: 0.7, phase: 0.9, sz: 3.6 },
    { bx: 640, by: 330, ax: 48, ay: 32, spd: 1.0, phase: 3.7, sz: 3.4 },
    { bx: 180, by: 460, ax: 50, ay: 30, spd: 1.4, phase: 5.1, sz: 3.0 },
    { bx: 580, by: 480, ax: 55, ay: 38, spd: 0.85, phase: 1.4, sz: 4.0 },
    { bx: 780, by: 420, ax: 42, ay: 25, spd: 1.15, phase: 2.9, sz: 3.3 }
  ];

  // =========================================================================
  // 1. BACKGROUND(c, { t, moonGlow, withNest, withFence })
  // Khu vườn rau ẩm ban đêm nhìn từ trên: đất màu đen mun xanh thẫm,
  // mảng cỏ đêm, ánh trăng xanh dịu, tổ rơm bên trái, hàng rào gỗ mép phải, đom đóm.
  // =========================================================================
  function background(c, opts) {
    opts = opts || {};
    var t = typeof opts.t === 'number' ? opts.t : 0;
    var moonGlow = typeof opts.moonGlow === 'number' ? opts.moonGlow : 1.0;
    var withNest = opts.withNest !== false;
    var withFence = opts.withFence !== false;
    var W = W0, H = H0;

    c.save();

    // 1.1 Đất vườn ẩm ban đêm
    var gradBg = c.createRadialGradient(W * 0.45, H * 0.4, 60, W * 0.5, H * 0.5, W * 0.7);
    gradBg.addColorStop(0, '#1c3325'); // Xanh rêu ẩm sáng ở giữa
    gradBg.addColorStop(0.55, '#13241a');
    gradBg.addColorStop(1, '#0c1610'); // Ven rìa tối sâu
    c.fillStyle = gradBg;
    c.fillRect(0, 0, W, H);

    // 1.2 Ánh trăng xanh dịu chiếu từ góc trên
    if (moonGlow > 0.01) {
      var moonGrad = c.createRadialGradient(220, 60, 20, 260, 160, 420);
      moonGrad.addColorStop(0, 'rgba(144, 202, 249, ' + (0.18 * moonGlow).toFixed(3) + ')');
      moonGrad.addColorStop(0.5, 'rgba(100, 181, 246, ' + (0.08 * moonGlow).toFixed(3) + ')');
      moonGrad.addColorStop(1, 'rgba(30, 136, 229, 0)');
      c.fillStyle = moonGrad;
      c.fillRect(0, 0, W, H);
    }

    // 1.3 Các đốm sỏi ẩm cố định
    for (var i = 0; i < GARDEN_PELLETS.length; i++) {
      var p = GARDEN_PELLETS[i];
      c.fillStyle = p.c;
      c.beginPath();
      c.ellipse(p.x, p.y, p.rx, p.ry, 0, 0, Math.PI * 2);
      c.fill();
    }

    // 1.4 Các cụm cỏ đêm nhìn từ trên
    for (var j = 0; j < GRASS_CLUMPS.length; j++) {
      var gc = GRASS_CLUMPS[j];
      c.save();
      c.translate(gc.x, gc.y);
      c.rotate(gc.rot);
      // Mảng rêu cỏ nền
      c.fillStyle = C_EXT.nightGrass;
      c.beginPath();
      c.ellipse(0, 0, gc.r, gc.r * 0.75, 0, 0, Math.PI * 2);
      c.fill();
      // Nhánh lá cỏ nhỏ bo tròn
      c.fillStyle = C_EXT.nightGrassLight;
      c.beginPath();
      c.ellipse(-gc.r * 0.35, -2, gc.r * 0.45, gc.r * 0.22, 0.4, 0, Math.PI * 2);
      c.ellipse(gc.r * 0.3, 3, gc.r * 0.4, gc.r * 0.2, -0.3, 0, Math.PI * 2);
      c.fill();
      c.restore();
    }

    // 1.5 Tổ rơm (bên trái theo thiết kế) nếu được bật
    if (withNest) {
      nest(c, 115, 280, { t: t });
    }

    // 1.6 Hàng rào gỗ thấp ở mép phải theo thiết kế
    if (withFence) {
      fence(c, 872, 280, { h: 540 });
    }

    // 1.7 Đom đóm bay chập chờn
    fireflies(c, W, H, { t: t, count: 8 });

    // Viền khung tổng thể
    c.strokeStyle = C.ink;
    c.lineWidth = LINE;
    c.strokeRect(0, 0, W, H);

    c.restore();
  }

  // =========================================================================
  // 2. NEST(c, x, y, opts)
  // Tổ rơm (điểm xuất phát của ốc sên bên trái). Nhìn từ trên: hình bầu dục
  // ấm áp, đan các cọng rơm vàng nâu bo tròn, lòng tổ êm ái.
  // =========================================================================
  function nest(c, x, y, opts) {
    opts = opts || {};
    var r = typeof opts.r === 'number' ? opts.r : 52;
    var t = typeof opts.t === 'number' ? opts.t : 0;

    c.save();
    c.translate(x, y);

    // Bóng đổ tổ rơm
    c.fillStyle = 'rgba(10, 20, 14, 0.55)';
    c.beginPath();
    c.ellipse(4, 6, r + 8, (r + 8) * 0.78, 0, 0, Math.PI * 2);
    c.fill();

    // Vành rơm ngoài (các cọng rơm uốn cong)
    c.fillStyle = C_EXT.strawDark;
    c.strokeStyle = C.ink;
    c.lineWidth = LINE;
    c.beginPath();
    c.ellipse(0, 0, r + 4, (r + 4) * 0.76, 0, 0, Math.PI * 2);
    c.fill();
    c.stroke();

    // Các tua rơm chìa ra quanh mép (tạo texture tổ tự nhiên, cố định không jitter)
    var strawAngles = [-2.8, -2.1, -1.4, -0.7, 0, 0.7, 1.4, 2.1, 2.8, 3.14];
    for (var k = 0; k < strawAngles.length; k++) {
      var ang = strawAngles[k];
      var sx = Math.cos(ang) * (r + 3);
      var sy = Math.sin(ang) * (r * 0.76);
      var ex = Math.cos(ang) * (r + 14 + (k % 3) * 3);
      var ey = Math.sin(ang) * (r * 0.76 + 10 + (k % 2) * 4);
      c.beginPath();
      c.moveTo(sx, sy);
      c.lineTo(ex, ey);
      c.strokeStyle = C_EXT.straw;
      c.lineWidth = 3;
      c.lineCap = 'round';
      c.stroke();
    }

    // Lớp rơm vàng tươi chính giữa
    c.fillStyle = C_EXT.straw;
    c.strokeStyle = C.ink;
    c.lineWidth = LINE;
    c.beginPath();
    c.ellipse(0, 0, r * 0.88, r * 0.65, 0, 0, Math.PI * 2);
    c.fill();
    c.stroke();

    // Lòng tổ lõm êm ái
    c.fillStyle = '#6d4c1b';
    c.strokeStyle = C.ink;
    c.lineWidth = 2.0;
    c.beginPath();
    c.ellipse(0, 0, r * 0.62, r * 0.44, 0, 0, Math.PI * 2);
    c.fill();
    c.stroke();

    // Các sợi rơm đan trong lòng tổ
    c.strokeStyle = C_EXT.straw;
    c.lineWidth = 2.2;
    c.beginPath();
    c.arc(-6, -2, r * 0.32, -0.6, 1.2);
    c.stroke();
    c.beginPath();
    c.arc(8, 3, r * 0.28, 1.8, 3.8);
    c.stroke();

    c.restore();
  }

  // =========================================================================
  // 3. FENCE(c, x, y, opts)
  // Hàng rào gỗ thấp ở mép phải (nhìn từ trên): các cọc gỗ tròn to bo góc,
  // thanh giằng ngang kết nối, vân gỗ mộc mạc.
  // =========================================================================
  function fence(c, x, y, opts) {
    opts = opts || {};
    var h = typeof opts.h === 'number' ? opts.h : 540;
    var halfH = h / 2;

    c.save();
    c.translate(x, y);

    // Thanh nan gỗ dọc chạy suốt chiều cao hàng rào
    c.fillStyle = '#5d4037';
    c.strokeStyle = C.ink;
    c.lineWidth = LINE;
    rr(c, -8, -halfH + 10, 16, h - 20, 6);
    c.fill();
    c.stroke();

    // Các cọc gỗ tròn (post) nhìn từ trên xuống
    var postOffsets = [-halfH + 45, -halfH * 0.5, 0, halfH * 0.5, halfH - 45];
    for (var i = 0; i < postOffsets.length; i++) {
      var py = postOffsets[i];
      // Bóng cọc
      c.fillStyle = 'rgba(10, 18, 12, 0.45)';
      c.beginPath();
      c.ellipse(-3, py + 4, 17, 17, 0, 0, Math.PI * 2);
      c.fill();

      // Mặt cắt thân cọc gỗ tròn
      c.fillStyle = '#8d6e63';
      c.strokeStyle = C.ink;
      c.lineWidth = LINE;
      c.beginPath();
      c.arc(0, py, 15, 0, Math.PI * 2);
      c.fill();
      c.stroke();

      // Vòng vân gỗ bên trong
      c.fillStyle = '#a1887f';
      c.beginPath();
      c.arc(0, py, 10, 0, Math.PI * 2);
      c.fill();
      c.strokeStyle = '#5d4037';
      c.lineWidth = 1.6;
      c.stroke();

      // Tâm cọc gỗ
      c.fillStyle = '#4e342e';
      c.beginPath();
      c.arc(1, py - 1, 3.5, 0, Math.PI * 2);
      c.fill();
    }

    c.restore();
  }

  // =========================================================================
  // 4. LEAF(c, x, y, opts)
  // Lá rau non xanh tươi, to, mềm mại (nhìn từ trên).
  // eaten (0..1): lá bị ốc sên ăn khuyết dần rồi biến mất kèm bụi xanh lấp lánh.
  // dewCount (1..3): giọt sương mai trên lá (thay cho số thứ tự để không có chữ trong hình).
  // =========================================================================
  function leaf(c, x, y, opts) {
    opts = opts || {};
    var eaten = Math.max(0, Math.min(1, typeof opts.eaten === 'number' ? opts.eaten : 0));
    var pulse = typeof opts.pulse === 'number' ? opts.pulse : 0;
    var dewCount = typeof opts.dewCount === 'number' ? opts.dewCount : 1;
    var t = typeof opts.t === 'number' ? opts.t : 0;
    var size = typeof opts.size === 'number' ? opts.size : 44;

    c.save();
    c.translate(x, y);

    // Nếu lá đã bị ăn hết hoàn toàn (eaten === 1), chỉ vẽ các hạt lấp lánh tan biến
    if (eaten >= 0.999) {
      sparkles(c, 0, 0, { t: t, count: 6, color: C.ok, radius: size * 0.7 });
      c.restore();
      return;
    }

    // Nhịp thở nhẹ nếu có pulse
    var scaleFactor = (1 - eaten * 0.75) * (1 + 0.05 * Math.sin(t * 3 + pulse));
    c.scale(scaleFactor, scaleFactor);

    // Bóng đổ của lá
    c.fillStyle = 'rgba(12, 22, 15, 0.45)';
    c.beginPath();
    c.ellipse(4, 8, size * 0.95, size * 0.75, 0.2, 0, Math.PI * 2);
    c.fill();

    // Vành phát quang dinh dưỡng nếu pulse > 0
    if (pulse > 0.1) {
      c.strokeStyle = 'rgba(109, 184, 67, ' + (0.5 * pulse).toFixed(2) + ')';
      c.lineWidth = 6;
      c.beginPath();
      c.ellipse(0, 0, size * 1.05, size * 0.85, 0.15, 0, Math.PI * 2);
      c.stroke();
    }

    // Thân lá rau non (tạo hình uốn lượn organic bằng bezier)
    c.beginPath();
    c.moveTo(-size * 0.85, 0);
    // Cung trên với viền lượn sóng
    c.bezierCurveTo(-size * 0.6, -size * 0.75, 0, -size * 0.85, size * 0.55, -size * 0.5);
    c.bezierCurveTo(size * 0.85, -size * 0.25, size * 0.95, 0.1, size * 0.75, size * 0.45);
    // Cung dưới
    c.bezierCurveTo(size * 0.45, size * 0.8, -size * 0.1, size * 0.85, -size * 0.55, size * 0.55);
    c.bezierCurveTo(-size * 0.85, size * 0.35, -size * 0.95, 0.15, -size * 0.85, 0);
    c.closePath();

    c.fillStyle = C.grassLight;
    c.fill();
    c.strokeStyle = C.ink;
    c.lineWidth = LINE;
    c.stroke();

    // Mảng ruột lá xanh non đậm hơn ở cuống
    c.beginPath();
    c.moveTo(-size * 0.7, 0);
    c.bezierCurveTo(-size * 0.4, -size * 0.5, size * 0.1, -size * 0.45, size * 0.45, -size * 0.25);
    c.bezierCurveTo(size * 0.45, size * 0.25, -size * 0.2, size * 0.5, -size * 0.7, 0);
    c.fillStyle = C.grass;
    c.fill();

    // Gân lá chính & gân nhánh màu ngà nhạt
    c.strokeStyle = '#dcedc8';
    c.lineWidth = 2.4;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(-size * 0.75, 0);
    c.quadraticCurveTo(0, -size * 0.05, size * 0.65, size * 0.1);
    c.stroke();

    // Các gân nhánh
    c.lineWidth = 1.8;
    c.beginPath();
    c.moveTo(-size * 0.3, -size * 0.02);
    c.lineTo(-size * 0.15, -size * 0.35);
    c.moveTo(size * 0.1, 0.02);
    c.lineTo(size * 0.3, -size * 0.25);
    c.moveTo(-size * 0.1, 0.02);
    c.lineTo(0, size * 0.32);
    c.moveTo(size * 0.3, 0.06);
    c.lineTo(size * 0.45, size * 0.28);
    c.stroke();

    // Giọt sương mai (1, 2 hoặc 3 giọt biểu thị số thứ tự nhận diện tự nhiên)
    var dewDrops = [
      { x: -size * 0.25, y: -size * 0.28, r: 4.5 },
      { x: size * 0.15, y: size * 0.32, r: 4.0 },
      { x: size * 0.4, y: -size * 0.18, r: 3.8 }
    ];
    for (var d = 0; d < Math.min(dewCount, 3); d++) {
      var dw = dewDrops[d];
      c.fillStyle = 'rgba(255, 255, 255, 0.85)';
      c.strokeStyle = C.inkSoft;
      c.lineWidth = 1.4;
      c.beginPath();
      c.arc(dw.x, dw.y, dw.r, 0, Math.PI * 2);
      c.fill();
      c.stroke();
      // Đốm sáng phản chiếu trong giọt sương
      c.fillStyle = '#ffffff';
      c.beginPath();
      c.arc(dw.x - 1.2, dw.y - 1.2, 1.4, 0, Math.PI * 2);
      c.fill();
    }

    // Hiệu ứng bị ăn cắn khuyết (eaten > 0): cắt các vết cắn hình vòng cung
    if (eaten > 0.05) {
      c.fillStyle = C_EXT.nightSoil;
      c.strokeStyle = C.ink;
      c.lineWidth = LINE;

      var biteR = size * (0.35 + eaten * 0.5);
      c.beginPath();
      c.arc(size * 0.35, -size * 0.15, biteR * 0.85, 0, Math.PI * 2);
      c.fill();
      c.stroke();

      if (eaten > 0.35) {
        c.beginPath();
        c.arc(-size * 0.15, size * 0.25, biteR * 0.7, 0, Math.PI * 2);
        c.fill();
        c.stroke();
      }

      // Vài vụn lá nhỏ lấp lánh khi đang bị ăn
      sparkles(c, size * 0.35, -size * 0.15, { t: t, count: 4, color: C.ok, radius: 18 });
    }

    c.restore();
  }

  // =========================================================================
  // 5. ROCK(c, x, y, opts)
  // Tảng đá rêu (vật cản trong vườn rau, nhìn từ trên).
  // hit (0..1) / shake (0..1): khi ốc húc vào đá, đá rung lắc lệch tâm và văng bụi sỏi nhỏ.
  // =========================================================================
  function rock(c, x, y, opts) {
    opts = opts || {};
    var r = typeof opts.r === 'number' ? opts.r : 38;
    var hit = typeof opts.hit === 'number' ? opts.hit : 0;
    var shake = Math.max(hit, typeof opts.shake === 'number' ? opts.shake : 0);
    var t = typeof opts.t === 'number' ? opts.t : 0;
    var variant = typeof opts.variant === 'number' ? opts.variant : 0;

    c.save();

    // Rung lắc khi húc vào đá
    var ox = 0, oy = 0;
    if (shake > 0.01) {
      ox = Math.sin(t * 45) * 6 * shake;
      oy = Math.cos(t * 40) * 4 * shake;
    }
    c.translate(x + ox, y + oy);

    // Bóng đổ tảng đá
    c.fillStyle = 'rgba(8, 16, 12, 0.55)';
    c.beginPath();
    c.ellipse(5, 7, r * 1.05, r * 0.85, 0.1, 0, Math.PI * 2);
    c.fill();

    // Thân tảng đá khối bo tròn tự nhiên
    c.beginPath();
    if (variant === 1) {
      c.moveTo(-r * 0.9, -r * 0.1);
      c.bezierCurveTo(-r * 0.85, -r * 0.75, -r * 0.2, -r * 0.95, r * 0.45, -r * 0.7);
      c.bezierCurveTo(r * 0.95, -r * 0.4, r * 0.9, r * 0.45, r * 0.4, r * 0.8);
      c.bezierCurveTo(-r * 0.1, r * 0.95, -r * 0.75, r * 0.75, -r * 0.9, -r * 0.1);
    } else {
      c.moveTo(-r * 0.95, 0);
      c.bezierCurveTo(-r * 0.8, -r * 0.85, 0, -r * 0.9, r * 0.75, -r * 0.55);
      c.bezierCurveTo(r * 1.0, -r * 0.2, r * 0.85, r * 0.65, r * 0.35, r * 0.85);
      c.bezierCurveTo(-r * 0.3, r * 0.95, -r * 0.9, r * 0.6, -r * 0.95, 0);
    }
    c.closePath();

    c.fillStyle = C.rock;
    c.fill();
    c.strokeStyle = C.ink;
    c.lineWidth = LINE;
    c.stroke();

    // Mảng sáng trên chóp đá phản chiếu ánh trăng
    c.beginPath();
    c.ellipse(-r * 0.2, -r * 0.25, r * 0.45, r * 0.3, -0.3, 0, Math.PI * 2);
    c.fillStyle = '#94a3b8';
    c.fill();

    // Mảng rêu xanh bám trên mép đá ẩm ướt
    c.fillStyle = C_EXT.mossLight;
    c.strokeStyle = C.ink;
    c.lineWidth = 1.8;
    c.beginPath();
    c.ellipse(r * 0.35, -r * 0.25, r * 0.28, r * 0.2, 0.4, 0, Math.PI * 2);
    c.fill();
    c.stroke();

    c.fillStyle = C_EXT.mossDark;
    c.beginPath();
    c.ellipse(-r * 0.35, r * 0.35, r * 0.32, r * 0.18, -0.2, 0, Math.PI * 2);
    c.fill();
    c.stroke();

    // Vết nứt sỏi đá mộc mạc
    c.strokeStyle = '#334155';
    c.lineWidth = 2.0;
    c.beginPath();
    c.moveTo(-r * 0.1, -r * 0.1);
    c.lineTo(r * 0.15, r * 0.2);
    c.lineTo(r * 0.05, r * 0.4);
    c.stroke();

    // Bụi và hạt sỏi văng ra khi va chạm (hit/shake)
    if (shake > 0.15) {
      c.fillStyle = '#cbd5e1';
      var dustAngles = [0.2, 1.3, 2.5, 3.8, 5.0];
      for (var d = 0; d < dustAngles.length; d++) {
        var da = dustAngles[d];
        var dist = r * (1.2 + 0.3 * Math.sin(t * 15 + d));
        var px = Math.cos(da) * dist;
        var py = Math.sin(da) * dist;
        c.beginPath();
        c.arc(px, py, 3.2 * shake, 0, Math.PI * 2);
        c.fill();
      }
    }

    c.restore();
  }

  // =========================================================================
  // 6. SLIMEPUDDLE(c, x, y, opts)
  // Mảng đất vệt nhớt trơn bóng (thử thách Nâng cao).
  // Óng ánh trơn trượt, phản chiếu ánh trăng xanh ngọc.
  // =========================================================================
  function slimePuddle(c, x, y, opts) {
    opts = opts || {};
    var w = typeof opts.w === 'number' ? opts.w : 120;
    var h = typeof opts.h === 'number' ? opts.h : 60;
    var angle = typeof opts.angle === 'number' ? opts.angle : 0;
    var t = typeof opts.t === 'number' ? opts.t : 0;

    c.save();
    c.translate(x, y);
    c.rotate(angle);

    // Vệt loang nhớt hữu cơ
    var pulse = 0.03 * Math.sin(t * 2.5);
    var rw = (w / 2) * (1 + pulse);
    var rh = (h / 2) * (1 - pulse);

    // Lớp nhớt nền
    var grad = c.createRadialGradient(0, 0, rh * 0.2, 0, 0, rw);
    grad.addColorStop(0, 'rgba(52, 211, 153, 0.42)'); // Xanh ngọc óng ánh
    grad.addColorStop(0.65, 'rgba(45, 212, 191, 0.25)');
    grad.addColorStop(1, 'rgba(20, 184, 166, 0.0)');
    c.fillStyle = grad;
    c.beginPath();
    c.ellipse(0, 0, rw, rh, 0, 0, Math.PI * 2);
    c.fill();

    // Vành viền bóng nhớt mềm
    c.strokeStyle = 'rgba(167, 243, 208, 0.4)';
    c.lineWidth = 2.0;
    c.beginPath();
    c.ellipse(0, 0, rw * 0.85, rh * 0.8, 0, 0, Math.PI * 2);
    c.stroke();

    // Vệt sáng lóa bóng loáng phản chiếu
    c.fillStyle = 'rgba(255, 255, 255, 0.65)';
    c.beginPath();
    c.ellipse(-rw * 0.35, -rh * 0.25, rw * 0.28, rh * 0.18, -0.2, 0, Math.PI * 2);
    c.fill();

    c.restore();
  }

  // =========================================================================
  // 7. SLIMETRAIL(c, pointsOrX, yOrOpts, opts)
  // Vệt nhớt bóng kéo dài phía sau đường bò của ốc sên.
  // Hỗ trợ cả danh sách tọa độ points: [{x, y}, ...] hoặc vẽ đoạn nhớt ngắn (c, x, y, opts).
  // =========================================================================
  function slimeTrail(c, arg1, arg2, arg3) {
    c.save();

    // Cách 1: Truyền danh sách điểm points: [{x, y}, ...]
    if (Array.isArray(arg1)) {
      var pts = arg1;
      var o = arg2 || {};
      var width = typeof o.width === 'number' ? o.width : 16;
      if (pts.length >= 2) {
        c.lineCap = 'round';
        c.lineJoin = 'round';

        // Lớp vệt nhớt ngoài
        c.strokeStyle = 'rgba(52, 211, 153, 0.35)';
        c.lineWidth = width;
        c.beginPath();
        c.moveTo(pts[0].x, pts[0].y);
        for (var i = 1; i < pts.length; i++) {
          c.lineTo(pts[i].x, pts[i].y);
        }
        c.stroke();

        // Lõi nhớt óng ánh bên trong
        c.strokeStyle = 'rgba(209, 250, 229, 0.65)';
        c.lineWidth = width * 0.45;
        c.stroke();
      }
      c.restore();
      return;
    }

    // Cách 2: Vẽ một đoạn vệt nhớt tại (x, y) với angle và length
    var x = arg1, y = arg2, opts = arg3 || {};
    var angle = typeof opts.angle === 'number' ? opts.angle : 0;
    var length = typeof opts.length === 'number' ? opts.length : 60;
    var w = typeof opts.width === 'number' ? opts.width : 16;

    c.translate(x, y);
    c.rotate(angle);

    // Đoạn vệt nhớt kéo lùi về sau (-X)
    var grad = c.createLinearGradient(-length, 0, 0, 0);
    grad.addColorStop(0, 'rgba(52, 211, 153, 0)');
    grad.addColorStop(0.5, 'rgba(52, 211, 153, 0.35)');
    grad.addColorStop(1, 'rgba(167, 243, 208, 0.65)');

    c.fillStyle = grad;
    c.beginPath();
    c.ellipse(-length / 2, 0, length / 2, w / 2, 0, 0, Math.PI * 2);
    c.fill();

    // Vạch sáng giữa
    c.strokeStyle = 'rgba(255, 255, 255, 0.55)';
    c.lineWidth = w * 0.25;
    c.beginPath();
    c.moveTo(-length * 0.75, 0);
    c.lineTo(-5, 0);
    c.stroke();

    c.restore();
  }

  // =========================================================================
  // 8. SNAIL / ROBOT(c, x, y, opts)
  // Robot ốc sên nhìn TỪ TRÊN XUỐNG (chuẩn mô hình ZM Alpha 330 21 bước):
  // - Hướng đầu mặc định = +X (sang phải, góc 0 rad).
  // - 02 động cơ M1 & M2 dẫn 2 bánh lớn hai bên thân.
  // - 01 Smart Hub RCU làm mai/thân phát sáng LED xanh lục đổi màu.
  // - 01 Cảm biến siêu âm BE-6313 ở đầu làm mắt kép phát sóng siêu âm.
  // - Thanh dầm kéo dài phía sau làm đuôi trượt (skid).
  // - 02 râu xúc tu ngọ nguậy trước đầu.
  // - 4 gói sáng tạo: longAntennae, bioluminescence, treadWheels, dualHeadlights.
  // =========================================================================
  function snail(c, x, y, opts) {
    opts = opts || {};
    var angle = typeof opts.angle === 'number' ? opts.angle : 0;
    var t = typeof opts.t === 'number' ? opts.t : 0;
    var sensorAlert = Boolean(opts.sensorAlert);
    var ledColor = opts.ledColor || 'green';
    var win = typeof opts.win === 'number' ? opts.win : 0;
    var upgrades = opts.upgrades || {};
    var speed = typeof opts.speed === 'number' ? opts.speed : 0;

    c.save();
    c.translate(x, y);
    c.rotate(angle);

    // 8.0 Chùm ánh xanh toả ra từ mai khi thắng (win > 0)
    if (win > 0.01) {
      c.save();
      var auraR = 65 + 30 * win + 10 * Math.sin(t * 6);
      var winGrad = c.createRadialGradient(0, 0, 15, 0, 0, auraR);
      winGrad.addColorStop(0, 'rgba(74, 222, 128, ' + (0.75 * win).toFixed(2) + ')');
      winGrad.addColorStop(0.5, 'rgba(56, 189, 248, ' + (0.45 * win).toFixed(2) + ')');
      winGrad.addColorStop(1, 'rgba(34, 197, 94, 0)');
      c.fillStyle = winGrad;
      c.beginPath();
      c.arc(0, 0, auraR, 0, Math.PI * 2);
      c.fill();

      // Các tia sáng lấp lánh ăn mừng
      sparkles(c, 0, 0, { t: t, count: 8, color: '#facc15', radius: auraR * 0.9 });
      c.restore();
    }

    // 8.1 Bóng đổ thân ốc sên xuống đất
    c.fillStyle = 'rgba(10, 20, 14, 0.5)';
    c.beginPath();
    c.ellipse(-4, 5, 52, 32, 0, 0, Math.PI * 2);
    c.fill();

    // 8.2 Vệt nhớt bóng trực tiếp rỉ ra từ đuôi dầm trượt
    c.fillStyle = C_EXT.snailSlime;
    c.beginPath();
    c.ellipse(-46, 0, 18, 9, 0, 0, Math.PI * 2);
    c.fill();

    // 8.3 Thân nhớt mềm màu be của ốc sên (slug foot đệm dưới gầm)
    c.fillStyle = C_EXT.snailBody;
    c.strokeStyle = C.ink;
    c.lineWidth = LINE;
    c.beginPath();
    // Đuôi sau thon tròn, mở rộng ở giữa thân, thu nhẹ lại ở cổ
    c.moveTo(-54, 0);
    c.bezierCurveTo(-52, -18, -20, -22, 15, -18);
    c.bezierCurveTo(28, -16, 36, -10, 42, 0); // Đầu ốc
    c.bezierCurveTo(36, 10, 28, 16, 15, 18);
    c.bezierCurveTo(-20, 22, -52, 18, -54, 0);
    c.closePath();
    c.fill();
    c.stroke();

    // Mảng bóng mềm trên thân nhớt
    c.fillStyle = C_EXT.snailBodyDark;
    c.beginPath();
    c.ellipse(-15, 0, 32, 12, 0, 0, Math.PI * 2);
    c.fill();

    // 8.4 Đuôi dầm trượt Lego Technic (skid beam) kéo dài phía sau giữ thăng bằng
    c.fillStyle = '#b0bec5';
    c.strokeStyle = C.ink;
    c.lineWidth = LINE;
    rr(c, -50, -6, 26, 12, 4);
    c.fill();
    c.stroke();

    // Các lỗ dầm kỹ thuật (Technic pin holes)
    c.fillStyle = C.ink;
    c.beginPath();
    c.arc(-42, 0, 2.5, 0, Math.PI * 2);
    c.arc(-32, 0, 2.5, 0, Math.PI * 2);
    c.fill();

    // 8.5 Hai bánh xe lớn hai bên (bánh xe dẫn động M1 & M2)
    var wheelH = 34;
    var wheelW = 14;
    var wheelYOffsets = [-29, 29];

    for (var wIdx = 0; wIdx < 2; wIdx++) {
      var wy = wheelYOffsets[wIdx];
      c.save();
      c.translate(-2, wy);

      // Thân lốp xe cao su màu đen
      c.fillStyle = '#263238';
      c.strokeStyle = C.ink;
      c.lineWidth = LINE;
      rr(c, -wheelW / 2, -wheelH / 2, wheelW, wheelH, 5);
      c.fill();
      c.stroke();

      // Vành mâm xe (hub rim) ở giữa
      c.fillStyle = '#cfd8dc';
      rr(c, -wheelW * 0.35, -wheelH * 0.3, wheelW * 0.7, wheelH * 0.6, 3);
      c.fill();
      c.stroke();

      // Trục cốt bánh xe
      c.fillStyle = C.ink;
      c.beginPath();
      c.arc(0, 0, 2.6, 0, Math.PI * 2);
      c.fill();

      // Gói sáng tạo 3: Vành bánh gai (treadWheels) chống trượt trên nhớt
      if (upgrades.treadWheels) {
        c.fillStyle = C.orange;
        c.strokeStyle = C.ink;
        c.lineWidth = 1.6;
        var spikeOffsets = [-wheelH * 0.42, -wheelH * 0.2, 0, wheelH * 0.2, wheelH * 0.42];
        for (var sp = 0; sp < spikeOffsets.length; sp++) {
          var spy = spikeOffsets[sp];
          var sideDir = wIdx === 0 ? -1 : 1;
          c.beginPath();
          c.moveTo((wheelW / 2) * sideDir, spy - 2.5);
          c.lineTo((wheelW / 2 + 5) * sideDir, spy);
          c.lineTo((wheelW / 2) * sideDir, spy + 2.5);
          c.closePath();
          c.fill();
          c.stroke();
        }
      }

      c.restore();
    }

    // 8.6 Mai ốc sên / Khối Smart Hub RCU trung tâm
    c.save();
    // Vỏ hộp Smart Hub hình vuông bo góc lớn
    var hubW = 46, hubH = 40;
    c.fillStyle = '#eceff1';
    c.strokeStyle = C.ink;
    c.lineWidth = LINE;
    rr(c, -hubW / 2, -hubH / 2, hubW, hubH, 12);
    c.fill();
    c.stroke();

    // Gờ viền trang trí xanh ngọc của Smart Hub
    c.strokeStyle = C.accent;
    c.lineWidth = 2.0;
    rr(c, -hubW / 2 + 3, -hubH / 2 + 3, hubW - 6, hubH - 6, 9);
    c.stroke();

    // Gói sáng tạo 2: Mai phát quang (bioluminescence) - hào quang rực rỡ quanh mai
    if (upgrades.bioluminescence) {
      c.strokeStyle = 'rgba(56, 189, 248, ' + (0.7 + 0.3 * Math.sin(t * 5)).toFixed(2) + ')';
      c.lineWidth = 6;
      rr(c, -hubW / 2 - 4, -hubH / 2 - 4, hubW + 8, hubH + 8, 16);
      c.stroke();

      c.strokeStyle = 'rgba(74, 222, 128, 0.85)';
      c.lineWidth = 2.4;
      rr(c, -hubW / 2 - 6, -hubH / 2 - 6, hubW + 12, hubH + 12, 18);
      c.stroke();
    }

    // Đèn LED tròn ở tâm mai ốc (LED Smart Hub)
    var ledColorHex = C_EXT.ledGreen;
    var ledGlowHex = C_EXT.ledGreenGlow;
    if (ledColor === 'blue') {
      ledColorHex = '#38bdf8';
      ledGlowHex = 'rgba(56, 189, 248, 0.45)';
    } else if (ledColor === 'gold') {
      ledColorHex = C.gold;
      ledGlowHex = 'rgba(255, 210, 63, 0.45)';
    } else if (ledColor === 'warn' || ledColor === 'red') {
      ledColorHex = C.warn;
      ledGlowHex = 'rgba(229, 57, 53, 0.45)';
    }

    // Hào quang LED phát sáng
    var ledPulse = 1.0 + 0.15 * Math.sin(t * 4);
    var ledGrad = c.createRadialGradient(0, 0, 4, 0, 0, 18 * ledPulse);
    ledGrad.addColorStop(0, ledColorHex);
    ledGrad.addColorStop(0.65, ledGlowHex);
    ledGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    c.fillStyle = ledGrad;
    c.beginPath();
    c.arc(0, 0, 18 * ledPulse, 0, Math.PI * 2);
    c.fill();

    // Vòm đèn LED mai ốc hình xoắn ốc (spiral pattern)
    c.fillStyle = ledColorHex;
    c.strokeStyle = C.ink;
    c.lineWidth = LINE;
    c.beginPath();
    c.arc(0, 0, 13, 0, Math.PI * 2);
    c.fill();
    c.stroke();

    // Họa tiết xoắn ốc bên trong mai
    c.strokeStyle = '#ffffff';
    c.lineWidth = 2.2;
    c.lineCap = 'round';
    c.beginPath();
    c.arc(0, 0, 8, -0.2, Math.PI * 1.5);
    c.stroke();
    c.beginPath();
    c.arc(0, 0, 4, Math.PI * 0.4, Math.PI * 2);
    c.stroke();

    c.restore();

    // 8.7 Đầu robot & Cảm biến siêu âm BE-6313 (Ultrasonic Sensor Eyes)
    c.save();
    c.translate(34, 0);

    // Hộp gắn cảm biến siêu âm ở đầu
    c.fillStyle = '#37474f';
    c.strokeStyle = C.ink;
    c.lineWidth = LINE;
    rr(c, -6, -17, 14, 34, 5);
    c.fill();
    c.stroke();

    // Hai "mắt" tròn cảm biến siêu âm (mắt trên & mắt dưới theo trục Y)
    var eyeY = [-9, 9];
    for (var e = 0; e < 2; e++) {
      var ey = eyeY[e];
      // Vành tròn mắt cảm biến
      c.fillStyle = '#cfd8dc';
      c.strokeStyle = C.ink;
      c.lineWidth = 1.8;
      c.beginPath();
      c.arc(2, ey, 7, 0, Math.PI * 2);
      c.fill();
      c.stroke();

      // Màng loa phát siêu âm màu xanh dương sẫm
      c.fillStyle = '#0f172a';
      c.beginPath();
      c.arc(2, ey, 4.5, 0, Math.PI * 2);
      c.fill();

      // Điểm phản chiếu Specular trong mắt
      c.fillStyle = '#38bdf8';
      c.beginPath();
      c.arc(3, ey - 1.2, 1.6, 0, Math.PI * 2);
      c.fill();
    }

    // Nếu cảm biến phát hiện vật cản (sensorAlert) -> phát sóng siêu âm hình cánh cung
    if (sensorAlert) {
      c.strokeStyle = C.warn;
      c.lineWidth = 2.4;
      var wavePulse = (t * 8) % 3;
      for (var w = 0; w < 3; w++) {
        var wDist = 14 + w * 12 + wavePulse * 4;
        var wAlpha = Math.max(0, 1 - (wDist / 50));
        c.strokeStyle = 'rgba(239, 68, 68, ' + wAlpha.toFixed(2) + ')';
        c.beginPath();
        c.arc(2, 0, wDist, -Math.PI * 0.28, Math.PI * 0.28);
        c.stroke();
      }
    }

    // Gói sáng tạo 4: Đèn mắt kép (dualHeadlights) chiếu chùm sáng quạt vàng phía trước
    if (upgrades.dualHeadlights) {
      c.save();
      for (var hl = 0; hl < 2; hl++) {
        var hly = eyeY[hl];
        var lightBeam = c.createRadialGradient(4, hly, 2, 4 + 75, hly, 80);
        lightBeam.addColorStop(0, 'rgba(254, 240, 138, 0.75)');
        lightBeam.addColorStop(0.6, 'rgba(253, 224, 71, 0.35)');
        lightBeam.addColorStop(1, 'rgba(250, 204, 21, 0)');

        c.fillStyle = lightBeam;
        c.beginPath();
        c.moveTo(4, hly);
        c.lineTo(4 + 85, hly - 28);
        c.lineTo(4 + 85, hly + 28);
        c.closePath();
        c.fill();
      }
      c.restore();
    }

    // 8.8 Hai râu mắt xúc tu ngọ nguậy uốn lượn
    var antTwitch = sensorAlert ? Math.sin(t * 18) * 0.25 : Math.sin(t * 3.5) * 0.12;

    for (var a = 0; a < 2; a++) {
      var aSide = a === 0 ? -1 : 1;
      var aAng = (0.35 + antTwitch) * aSide;

      c.save();
      c.translate(4, aSide * 7);
      c.rotate(aAng);

      // Thân râu chính
      c.strokeStyle = C.ink;
      c.lineWidth = 3.0;
      c.lineCap = 'round';
      c.beginPath();
      c.moveTo(0, 0);
      c.quadraticCurveTo(12, aSide * 8, 22, aSide * 14);
      c.stroke();

      // Ruột râu màu ngà
      c.strokeStyle = C_EXT.snailBody;
      c.lineWidth = 1.6;
      c.beginPath();
      c.moveTo(0, 0);
      c.quadraticCurveTo(12, aSide * 8, 22, aSide * 14);
      c.stroke();

      // Đầu tròn xúc tu râu
      c.fillStyle = C.gold;
      c.strokeStyle = C.ink;
      c.lineWidth = 1.8;
      c.beginPath();
      c.arc(22, aSide * 14, 4.2, 0, Math.PI * 2);
      c.fill();
      c.stroke();

      c.restore();
    }

    // Gói sáng tạo 1: Râu kép dài (longAntennae) vươn xa
    if (upgrades.longAntennae) {
      for (var la = 0; la < 2; la++) {
        var laSide = la === 0 ? -1 : 1;
        var laTwitch = Math.sin(t * 4.5 + la) * 0.15;

        c.save();
        c.translate(4, laSide * 3);
        c.rotate((0.65 + laTwitch) * laSide);

        // Râu phụ dài uốn cong vươn xa
        c.strokeStyle = C.ink;
        c.lineWidth = 3.2;
        c.lineCap = 'round';
        c.beginPath();
        c.moveTo(0, 0);
        c.bezierCurveTo(16, laSide * 12, 32, laSide * 24, 42, laSide * 26);
        c.stroke();

        c.strokeStyle = '#4ade80';
        c.lineWidth = 1.8;
        c.beginPath();
        c.moveTo(0, 0);
        c.bezierCurveTo(16, laSide * 12, 32, laSide * 24, 42, laSide * 26);
        c.stroke();

        // Mắt phụ phát quang ở đầu râu kép
        c.fillStyle = '#22c55e';
        c.strokeStyle = C.ink;
        c.lineWidth = 2.0;
        c.beginPath();
        c.arc(42, laSide * 26, 5.0, 0, Math.PI * 2);
        c.fill();
        c.stroke();

        c.restore();
      }
    }

    c.restore();

    c.restore();
  }

  // =========================================================================
  // 9. FIREFLIES(c, W, H, opts)
  // Đom đóm bay chập chờn trong đêm với vầng sáng vàng xanh dịu.
  // =========================================================================
  function fireflies(c, W, H, opts) {
    opts = opts || {};
    var t = typeof opts.t === 'number' ? opts.t : 0;
    var count = typeof opts.count === 'number' ? opts.count : 6;
    var limit = Math.min(count, FIREFLY_DATA.length);

    c.save();
    for (var i = 0; i < limit; i++) {
      var f = FIREFLY_DATA[i];
      var fx = f.bx + f.ax * Math.sin(t * f.spd + f.phase);
      var fy = f.by + f.ay * Math.cos(t * f.spd * 0.8 + f.phase);
      var glow = 0.5 + 0.5 * Math.sin(t * 3.5 + f.phase);

      // Quầng sáng mềm
      var rad = c.createRadialGradient(fx, fy, 1, fx, fy, f.sz * 4 * glow);
      rad.addColorStop(0, 'rgba(254, 240, 138, 0.95)');
      rad.addColorStop(0.45, 'rgba(163, 230, 53, ' + (0.4 * glow).toFixed(2) + ')');
      rad.addColorStop(1, 'rgba(101, 163, 13, 0)');
      c.fillStyle = rad;
      c.beginPath();
      c.arc(fx, fy, f.sz * 4 * glow, 0, Math.PI * 2);
      c.fill();

      // Hạt tâm đom đóm
      c.fillStyle = '#ffffff';
      c.beginPath();
      c.arc(fx, fy, f.sz * 0.6, 0, Math.PI * 2);
      c.fill();
    }
    c.restore();
  }

  // =========================================================================
  // 10. SPARKLES(c, x, y, opts)
  // Chùm hạt lấp lánh ăn mừng chiến thắng hoặc khi lá rau bị ăn.
  // =========================================================================
  function sparkles(c, x, y, opts) {
    opts = opts || {};
    var t = typeof opts.t === 'number' ? opts.t : 0;
    var count = typeof opts.count === 'number' ? opts.count : 6;
    var col = opts.color || C.gold;
    var rad = typeof opts.radius === 'number' ? opts.radius : 35;

    c.save();
    c.translate(x, y);

    for (var s = 0; s < count; s++) {
      var ang = (s / count) * Math.PI * 2 + t * 2;
      var dist = rad * (0.6 + 0.4 * Math.sin(t * 4 + s));
      var px = Math.cos(ang) * dist;
      var py = Math.sin(ang) * dist;
      var sz = 2.5 + 1.5 * Math.sin(t * 6 + s);

      c.fillStyle = col;
      c.beginPath();
      // Ngôi sao 4 cánh nhỏ
      c.moveTo(px, py - sz * 1.6);
      c.lineTo(px + sz * 0.5, py - sz * 0.5);
      c.lineTo(px + sz * 1.6, py);
      c.lineTo(px + sz * 0.5, py + sz * 0.5);
      c.lineTo(px, py + sz * 1.6);
      c.lineTo(px - sz * 0.5, py + sz * 0.5);
      c.lineTo(px - sz * 1.6, py);
      c.lineTo(px - sz * 0.5, py - sz * 0.5);
      c.closePath();
      c.fill();
    }

    c.restore();
  }

  // =========================================================================
  // XUẤT GIAO DIỆN window.Lop1Bai19Art
  // =========================================================================
  var Lop1Bai19Art = {
    W: W0,
    H: H0,
    background: background,
    nest: nest,
    fence: fence,
    leaf: leaf,
    rock: rock,
    slimePuddle: slimePuddle,
    slimeTrail: slimeTrail,
    snail: snail,
    robot: snail, // Alias tiện lợi
    fireflies: fireflies,
    sparkles: sparkles,

    // Các alias hàm draw... tương thích mở rộng
    drawBackground: background,
    drawNest: nest,
    drawFence: fence,
    drawLeaf: leaf,
    drawRock: rock,
    drawSlimePuddle: slimePuddle,
    drawSlimeTrail: slimeTrail,
    drawSnail: snail,
    drawRobot: snail,
    drawFireflies: fireflies,
    drawSparkles: sparkles
  };

  if (typeof window !== 'undefined') {
    window.Lop1Bai19Art = Lop1Bai19Art;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Lop1Bai19Art;
  }
})();
