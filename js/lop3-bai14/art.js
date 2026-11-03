// Thư viện vẽ cảnh Lớp 3 · Bài 14: "Cây đàn ghi-ta" (window.Lop3Bai14Art).
// Khung nhìn chuẩn: 900x560, mặt sàn sân khấu GY = 430.
// Theo đúng quy chuẩn ZMArt, craft.md: khối to, viền đậm C.ink, nét LINE = 2.6, không chữ trong hình, không vũ khí.
// Cảnh ③: Sân khấu nhìn ngang: bàn tay khán giả tiến gần rồi rời cảm biến siêu âm trên đàn; đèn và nốt A/B sáng theo từng nhịp.
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
    accent: '#3dc1dc',       // Cyan WeDo 2.0 / Nốt B / Sóng siêu âm
    accentDark: '#0e6f8a',
    accentLight: '#8ee6f5',
    warn: '#e53935',         // Đỏ rèm sân khấu
    warnDark: '#b71c1c',
    ok: '#43a047',           // Xanh lá LED / tín hiệu
    okLight: '#a5d6a7',
    gold: '#ffd23f',         // Vàng đầu đàn / Nốt A / Hào quang
    orange: '#ff8a3d',       // Cam áo bạn nhỏ / Đèn ấm
    wood: '#8d6e63',         // Sàn gỗ sân khấu
    woodDark: '#5d4037',
    woodLight: '#bcaaa4',
    stageBg: '#1e2235',     // Phông nền sân khấu sẫm màu
    stageBgDark: '#121524',
    stageTruss: '#374151',   // Giàn truss kim loại
    skin: '#fed7aa',         // Màu da tay bạn nhỏ
    skinDark: '#fba973',
    sensorEye: '#0f172a',    // Mắt cảm biến siêu âm
    sensorRing: '#94a3b8'    // Viền kim loại cảm biến
  };

  // Ưu tiên nạp và đồng bộ màu từ window.ZMArt nếu đã có
  if (typeof window !== 'undefined' && window.ZMArt && window.ZMArt.C) {
    var zmc = window.ZMArt.C;
    for (var k in zmc) {
      if (Object.prototype.hasOwnProperty.call(zmc, k)) {
        C[k] = zmc[k];
      }
    }
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

  // Tô màu và viền chuẩn mực
  function strokeFill(c, fill, stroke, lw) {
    if (fill) {
      c.fillStyle = fill;
      c.fill();
    }
    c.strokeStyle = stroke || C.ink;
    c.lineWidth = lw || LINE;
    c.stroke();
  }

  // Vẽ ngôi sao 4 cánh lấp lánh (sparkle)
  function drawSparkle(c, cx, cy, r, color) {
    c.save();
    c.fillStyle = color || C.gold;
    c.beginPath();
    c.moveTo(cx, cy - r);
    c.quadraticCurveTo(cx, cy, cx + r, cy);
    c.quadraticCurveTo(cx, cy, cx, cy + r);
    c.quadraticCurveTo(cx, cy, cx - r, cy);
    c.quadraticCurveTo(cx, cy, cx, cy - r);
    c.fill();
    c.restore();
  }

  // =========================================================================
  // 1. BACKGROUND(c, opts)
  // Sân khấu biểu diễn âm nhạc nhìn ngang.
  // opts: { t, theme, curtainOpen, lightsOn, spotlightColor, beat }
  // =========================================================================
  function background(c, opts) {
    opts = opts || {};
    var t = typeof opts.t === 'number' ? opts.t : 0;
    var W = W0;
    var H = H0;
    var gy = GY0;
    var curtainOpen = typeof opts.curtainOpen === 'number' ? opts.curtainOpen : 0.82; // 0..1
    var lightsOn = opts.lightsOn !== false;
    var beat = typeof opts.beat === 'number' ? opts.beat : Math.abs(Math.sin(t * Math.PI));

    c.save();

    // 1.1 Phông nền sâu sân khấu (gradient xanh tím thẫm tạo độ tương phản cao cho nốt nhạc)
    var bgGrad = c.createLinearGradient(0, 0, 0, gy);
    bgGrad.addColorStop(0, '#101426');
    bgGrad.addColorStop(0.65, '#1e2438');
    bgGrad.addColorStop(1, '#2c354e');
    c.fillStyle = bgGrad;
    c.fillRect(0, 0, W, H);

    // 1.2 Bụi sao / kim tuyến sân khấu bồng bềnh (tính toán điều hòa sin/cos tĩnh theo t)
    var MOTES = [
      { x: 120, y: 120, r: 2.2, p: 0.8 },
      { x: 230, y: 70,  r: 1.6, p: 1.4 },
      { x: 340, y: 150, r: 2.8, p: 2.1 },
      { x: 450, y: 90,  r: 2.0, p: 0.5 },
      { x: 560, y: 130, r: 1.8, p: 1.9 },
      { x: 670, y: 80,  r: 2.4, p: 2.7 },
      { x: 780, y: 140, r: 1.5, p: 1.1 },
      { x: 180, y: 220, r: 1.8, p: 2.3 },
      { x: 290, y: 260, r: 2.2, p: 0.9 },
      { x: 620, y: 230, r: 2.0, p: 1.7 },
      { x: 720, y: 210, r: 1.6, p: 2.5 }
    ];
    for (var i = 0; i < MOTES.length; i++) {
      var m = MOTES[i];
      var my = m.y + Math.sin(t * 1.5 + m.p * 3) * 10;
      var op = 0.35 + 0.35 * Math.sin(t * 2.5 + m.p * 4);
      c.fillStyle = (i % 2 === 0) ? 'rgba(255, 210, 63,' + op + ')' : 'rgba(61, 193, 220,' + op + ')';
      c.beginPath();
      c.arc(m.x, my, m.r, 0, Math.PI * 2);
      c.fill();
    }

    // 1.3 Giàn khung truss kim loại trên trần sân khấu
    c.fillStyle = '#2d3748';
    c.fillRect(0, 0, W, 28);
    c.strokeStyle = C.ink;
    c.lineWidth = 2.4;
    c.beginPath();
    c.moveTo(0, 28);
    c.lineTo(W, 28);
    c.stroke();

    // Giằng chéo giàn truss kim loại
    c.strokeStyle = '#4a5568';
    c.lineWidth = 1.8;
    c.beginPath();
    for (var tx = 0; tx < W; tx += 40) {
      c.moveTo(tx, 0);
      c.lineTo(tx + 40, 28);
      c.moveTo(tx + 40, 0);
      c.lineTo(tx, 28);
    }
    c.stroke();

    // 1.4 Bốn cụm đèn rọi spotlight trên giàn truss
    var SPOT_POS = [160, 350, 550, 740];
    for (var s = 0; s < SPOT_POS.length; s++) {
      var sx = SPOT_POS[s];
      // Càng treo đèn
      c.strokeStyle = '#1e293b';
      c.lineWidth = 3.0;
      c.beginPath();
      c.moveTo(sx, 28);
      c.lineTo(sx, 44);
      c.stroke();

      // Vỏ đèn rọi hình nón cụt
      c.save();
      c.translate(sx, 44);
      // Hướng đèn nghiêng nhẹ về trung tâm sân khấu (x=450)
      var ang = (sx < 450) ? 0.18 : (sx > 450 ? -0.18 : 0);
      c.rotate(ang);

      c.beginPath();
      c.moveTo(-16, 0);
      c.lineTo(16, 0);
      c.lineTo(24, 26);
      c.lineTo(-24, 26);
      c.closePath();
      strokeFill(c, '#334155', C.ink, 2.2);

      // Thấu kính đèn phát sáng
      c.beginPath();
      c.ellipse(0, 26, 22, 6, 0, 0, Math.PI * 2);
      var lensCol = (s === 1 || s === 2) ? C.gold : C.accentLight;
      strokeFill(c, lensCol, C.ink, 1.8);
      c.restore();
    }

    // 1.5 Sàn gỗ sân khấu (Stage floor) từ gy = 430 xuống 560
    var floorGrad = c.createLinearGradient(0, gy, 0, H);
    floorGrad.addColorStop(0, '#9c7857');
    floorGrad.addColorStop(0.3, '#8d6b4a');
    floorGrad.addColorStop(1, '#654b32');
    c.fillStyle = floorGrad;
    c.fillRect(0, gy, W, H - gy);

    // Mép bục sân khấu (Stage front lip)
    c.fillStyle = '#4e3823';
    c.fillRect(0, H - 24, W, 24);
    c.strokeStyle = C.ink;
    c.lineWidth = 2.6;
    c.beginPath();
    c.moveTo(0, H - 24);
    c.lineTo(W, H - 24);
    c.stroke();

    // Các đường mạch ván gỗ sân khấu nhìn ngang
    c.strokeStyle = 'rgba(30, 42, 52, 0.45)';
    c.lineWidth = 1.8;
    c.beginPath();
    c.moveTo(0, gy + 35); c.lineTo(W, gy + 35);
    c.moveTo(0, gy + 75); c.lineTo(W, gy + 75);
    c.stroke();

    // Mối ghép ván gỗ xen kẽ
    c.beginPath();
    for (var px = 60; px < W; px += 180) {
      c.moveTo(px, gy); c.lineTo(px, gy + 35);
      c.moveTo(px + 90, gy + 35); c.lineTo(px + 90, gy + 75);
      c.moveTo(px + 40, gy + 75); c.lineTo(px + 40, H - 24);
    }
    c.stroke();

    // Vạch biên sàn sân khấu trên cùng
    c.strokeStyle = C.ink;
    c.lineWidth = LINE;
    c.beginPath();
    c.moveTo(0, gy);
    c.lineTo(W, gy);
    c.stroke();

    // Đèn LED hắt chân sân khấu (Footlights)
    for (var fx = 50; fx < W; fx += 80) {
      c.beginPath();
      c.arc(fx, gy + 4, 3.5, 0, Math.PI * 2);
      c.fillStyle = (fx % 160 === 50) ? C.gold : C.accentLight;
      c.fill();
      c.strokeStyle = C.ink;
      c.lineWidth = 1.2;
      c.stroke();
    }

    // 1.6 Rèm nhung sân khấu hai bên (drapes) vén cong mềm mại
    var curtainWidth = 140 * (1.05 - curtainOpen * 0.4); // Co giãn theo curtainOpen
    // Rèm bên trái
    c.save();
    c.fillStyle = C.warn;
    c.strokeStyle = C.ink;
    c.lineWidth = 2.4;
    c.beginPath();
    c.moveTo(0, 0);
    c.lineTo(curtainWidth, 0);
    c.quadraticCurveTo(curtainWidth * 0.4, gy * 0.5, curtainWidth * 0.7, gy);
    c.lineTo(0, gy);
    c.closePath();
    c.fill();
    c.stroke();

    // Nếp gấp rèm trái
    c.strokeStyle = C.warnDark;
    c.lineWidth = 3.0;
    c.beginPath();
    c.moveTo(curtainWidth * 0.35, 0);
    c.quadraticCurveTo(curtainWidth * 0.15, gy * 0.5, curtainWidth * 0.25, gy);
    c.moveTo(curtainWidth * 0.7, 0);
    c.quadraticCurveTo(curtainWidth * 0.35, gy * 0.5, curtainWidth * 0.5, gy);
    c.stroke();

    // Dải tua rua vàng cột rèm trái
    c.fillStyle = C.gold;
    c.strokeStyle = C.ink;
    c.lineWidth = 2.0;
    c.beginPath();
    c.ellipse(curtainWidth * 0.42, gy * 0.52, 14, 7, -0.2, 0, Math.PI * 2);
    c.fill();
    c.stroke();
    c.restore();

    // Rèm bên phải
    c.save();
    c.fillStyle = C.warn;
    c.strokeStyle = C.ink;
    c.lineWidth = 2.4;
    c.beginPath();
    c.moveTo(W, 0);
    c.lineTo(W - curtainWidth, 0);
    c.quadraticCurveTo(W - curtainWidth * 0.4, gy * 0.5, W - curtainWidth * 0.7, gy);
    c.lineTo(W, gy);
    c.closePath();
    c.fill();
    c.stroke();

    // Nếp gấp rèm phải
    c.strokeStyle = C.warnDark;
    c.lineWidth = 3.0;
    c.beginPath();
    c.moveTo(W - curtainWidth * 0.35, 0);
    c.quadraticCurveTo(W - curtainWidth * 0.15, gy * 0.5, W - curtainWidth * 0.25, gy);
    c.moveTo(W - curtainWidth * 0.7, 0);
    c.quadraticCurveTo(W - curtainWidth * 0.35, gy * 0.5, W - curtainWidth * 0.5, gy);
    c.stroke();

    // Dải tua rua vàng cột rèm phải
    c.fillStyle = C.gold;
    c.strokeStyle = C.ink;
    c.lineWidth = 2.0;
    c.beginPath();
    c.ellipse(W - curtainWidth * 0.42, gy * 0.52, 14, 7, 0.2, 0, Math.PI * 2);
    c.fill();
    c.stroke();
    c.restore();

    // Rèm ngang vòm trên cùng (Valance)
    c.fillStyle = C.warn;
    c.strokeStyle = C.ink;
    c.lineWidth = 2.4;
    c.beginPath();
    c.moveTo(0, 0);
    c.lineTo(W, 0);
    c.lineTo(W, 16);
    for (var vx = W; vx >= 0; vx -= 50) {
      c.quadraticCurveTo(vx - 25, 34, vx - 50, 16);
    }
    c.closePath();
    c.fill();
    c.stroke();

    c.restore();
  }

  // =========================================================================
  // 2. STAGELIGHTBEAM(c, x, y, opts)
  // Luồng sáng hình nón rọi từ đèn sân khấu xuống sàn và mô hình đàn.
  // opts: { targetX, targetY, spread, color, intensity, t }
  // =========================================================================
  function stageLightBeam(c, x, y, opts) {
    opts = opts || {};
    var targetX = typeof opts.targetX === 'number' ? opts.targetX : x;
    var targetY = typeof opts.targetY === 'number' ? opts.targetY : GY0;
    var spread = typeof opts.spread === 'number' ? opts.spread : 140;
    var color = opts.color || 'gold'; // 'gold' | 'cyan' | 'warm' | 'purple'
    var intensity = typeof opts.intensity === 'number' ? opts.intensity : 0.85;
    var t = typeof opts.t === 'number' ? opts.t : 0;

    c.save();

    // Bảng màu ánh sáng dạng rgba
    var rgbaMap = {
      gold: { c1: 'rgba(255, 225, 80, 0.45)', c2: 'rgba(255, 210, 63, 0.04)', spot: 'rgba(255, 230, 120, 0.55)' },
      cyan: { c1: 'rgba(61, 193, 220, 0.45)', c2: 'rgba(14, 111, 138, 0.04)', spot: 'rgba(142, 230, 245, 0.55)' },
      warm: { c1: 'rgba(255, 138, 61, 0.40)', c2: 'rgba(255, 138, 61, 0.03)', spot: 'rgba(255, 175, 110, 0.50)' },
      purple: { c1: 'rgba(190, 120, 245, 0.42)', c2: 'rgba(120, 60, 180, 0.03)', spot: 'rgba(215, 160, 255, 0.52)' }
    };
    var pal = rgbaMap[color] || rgbaMap.gold;

    // Nón ánh sáng bán trong suốt
    var beamGrad = c.createLinearGradient(x, y, targetX, targetY);
    beamGrad.addColorStop(0, pal.c1);
    beamGrad.addColorStop(1, pal.c2);

    c.fillStyle = beamGrad;
    c.beginPath();
    c.moveTo(x - 12, y);
    c.lineTo(x + 12, y);
    c.lineTo(targetX + spread, targetY);
    c.lineTo(targetX - spread, targetY);
    c.closePath();
    c.fill();

    // Vùng sáng hình elip phản chiếu trên mặt sàn sân khấu
    var spotGrad = c.createRadialGradient(targetX, targetY, 10, targetX, targetY, spread);
    spotGrad.addColorStop(0, pal.spot);
    spotGrad.addColorStop(0.7, pal.c2);
    spotGrad.addColorStop(1, 'rgba(0,0,0,0)');

    c.fillStyle = spotGrad;
    c.beginPath();
    c.ellipse(targetX, targetY, spread, spread * 0.26, 0, 0, Math.PI * 2);
    c.fill();

    // Hạt bụi sáng lơ lửng trong luồng đèn
    for (var i = 0; i < 6; i++) {
      var dy = 0.2 + 0.12 * i;
      var px = x + (targetX - x) * dy + Math.sin(t * 2 + i * 1.7) * (spread * dy * 0.4);
      var py = y + (targetY - y) * dy;
      var alpha = (0.3 + 0.4 * Math.sin(t * 3 + i * 2)) * intensity;
      c.fillStyle = 'rgba(255, 255, 255, ' + Math.max(0, alpha) + ')';
      c.beginPath();
      c.arc(px, py, 1.8, 0, Math.PI * 2);
      c.fill();
    }

    c.restore();
  }

  // =========================================================================
  // 3. GUITAR(c, x, gy, opts)
  // Mô hình cây đàn ghi-ta WeDo 2.0 (23 bước lắp ráp).
  // Thân đàn: Smart Hub (BE-5158). Cần đàn: dầm trắng/xanh.
  // Đầu đàn: 2 thanh vàng, 4 khớp xanh + 2 trục làm khoá đàn.
  // Cảm biến siêu âm (BE-6313) gắn phía trên thân đàn.
  // opts: { tilt, t, sensorActive, playingNote, upgrades, scale }
  // upgrades: { stand, stageLights, resonator, glowStrings }
  // =========================================================================
  function guitar(c, x, gy, opts) {
    opts = opts || {};
    gy = typeof gy === 'number' ? gy : GY0;
    var t = typeof opts.t === 'number' ? opts.t : 0;
    var tilt = typeof opts.tilt === 'number' ? opts.tilt : -0.06; // góc nghiêng tự nhiên
    var sensorActive = !!opts.sensorActive;
    var playingNote = opts.playingNote || null; // 'A' | 'B' | null
    var upg = opts.upgrades || {};
    var sc = typeof opts.scale === 'number' ? opts.scale : 1.0;

    c.save();
    c.translate(x, gy);
    if (sc !== 1.0) c.scale(sc, sc);

    // =====================================================================
    // 3.1 GÓI SÁNG TẠO 1: GIÁ ĐỠ ĐÀN (STAND)
    // Chân đỡ 3 chạc / khung chữ A đỡ thân và cần đàn vững vàng trên sân khấu
    // =====================================================================
    if (upg.stand) {
      c.save();
      // Chân đế 3 chạc đặt trên sàn
      c.strokeStyle = C.ink;
      c.lineWidth = 3.2;

      // Chân choãi trái và phải
      c.beginPath();
      c.moveTo(-60, 0);
      c.lineTo(0, -35);
      c.lineTo(60, 0);
      c.stroke();

      // Guốc cao su chân đỡ
      c.fillStyle = '#1e293b';
      rr(c, -68, -6, 16, 6, 2); strokeFill(c, '#1e293b', C.ink, 2.0);
      rr(c, 52, -6, 16, 6, 2);  strokeFill(c, '#1e293b', C.ink, 2.0);

      // Cột trụ đứng trung tâm của giá đỡ
      c.beginPath();
      c.moveTo(0, -35);
      c.lineTo(0, -180);
      c.stroke();

      // Càng đỡ dưới thân đàn bọc đệm êm
      c.beginPath();
      c.moveTo(-45, -55);
      c.quadraticCurveTo(0, -42, 45, -55);
      strokeFill(c, null, '#0e1726', 4.5);
      // Đầu bọc mút đen chống trầy
      c.fillStyle = C.gold;
      c.beginPath();
      c.arc(-45, -55, 4, 0, Math.PI * 2);
      c.arc(45, -55, 4, 0, Math.PI * 2);
      c.fill();

      // Càng kẹp cổ đàn phía trên
      c.beginPath();
      c.moveTo(-22, -180);
      c.quadraticCurveTo(0, -172, 22, -180);
      strokeFill(c, null, '#0e1726', 4.0);

      c.restore();
    } else {
      // Bệ đỡ tạm thời đơn giản nếu không bật gói giá đỡ
      c.fillStyle = '#475569';
      rr(c, -28, -12, 56, 12, 3);
      strokeFill(c, '#475569', C.ink, 2.2);
    }

    // Nghiêng toàn bộ thân đàn theo góc tilt
    c.rotate(tilt);

    // =====================================================================
    // 3.2 GÓI SÁNG TẠO 3: HỘP CỘNG HƯỞNG (RESONATOR)
    // Cánh gỗ uốn cong gắn hai bên thân đàn với lỗ thoát âm nghệ thuật
    // =====================================================================
    if (upg.resonator) {
      c.save();
      // Thân gỗ cộng hưởng mở rộng ra 2 bên
      var resGrad = c.createLinearGradient(-80, -110, 80, -110);
      resGrad.addColorStop(0, '#a07148');
      resGrad.addColorStop(0.5, '#c99665');
      resGrad.addColorStop(1, '#a07148');

      c.fillStyle = resGrad;
      c.strokeStyle = C.ink;
      c.lineWidth = 2.6;

      // Cánh gỗ bầu tròn kiểu đàn ghi-ta cổ điển
      c.beginPath();
      c.moveTo(-35, -170);
      c.bezierCurveTo(-75, -165, -85, -120, -65, -95);
      c.bezierCurveTo(-85, -70, -75, -25, -35, -20);
      c.lineTo(35, -20);
      c.bezierCurveTo(75, -25, 85, -70, 65, -95);
      c.bezierCurveTo(85, -120, 75, -165, 35, -170);
      c.closePath();
      c.fill();
      c.stroke();

      // Lỗ thoát âm cách điệu hai bên (f-hole accents, hình giọt nước/đường cong, không chữ)
      c.fillStyle = '#2c1e14';
      c.strokeStyle = C.ink;
      c.lineWidth = 1.8;
      // Bên trái
      c.beginPath();
      c.ellipse(-52, -100, 5, 18, -0.25, 0, Math.PI * 2);
      c.fill(); c.stroke();
      // Bên phải
      c.beginPath();
      c.ellipse(52, -100, 5, 18, 0.25, 0, Math.PI * 2);
      c.fill(); c.stroke();

      c.restore();
    }

    // =====================================================================
    // 3.3 THÂN ĐÀN CHÍNH: SMART HUB (BE-5158)
    // Khối chữ nhật trắng bo góc, nút tròn RGB ở giữa, lỗ pin Technic bên hông
    // =====================================================================
    var hubW = 68;
    var hubH = 130;
    var hubX = -hubW / 2;
    var hubY = -hubH - 18;

    // Bóng đổ nhẹ dưới Smart Hub
    c.fillStyle = 'rgba(0, 0, 0, 0.12)';
    rr(c, hubX + 4, hubY + 5, hubW, hubH, 10);
    c.fill();

    // Vỏ Smart Hub màu trắng ngà
    rr(c, hubX, hubY, hubW, hubH, 10);
    strokeFill(c, C.paper, C.ink, LINE);

    // Rãnh phân tách nắp pin phía dưới
    c.strokeStyle = '#cbd5e1';
    c.lineWidth = 2.0;
    c.beginPath();
    c.moveTo(hubX + 6, hubY + hubH * 0.68);
    c.lineTo(hubX + hubW - 6, hubY + hubH * 0.68);
    c.stroke();

    // Hàng lỗ chốt Technic đặc trưng bên cạnh trái và phải (3 lỗ mỗi bên)
    for (var hIdx = 0; hIdx < 4; hIdx++) {
      var hy = hubY + 22 + hIdx * 24;
      // Lỗ trái
      c.beginPath();
      c.arc(hubX + 8, hy, 4.2, 0, Math.PI * 2);
      strokeFill(c, C.hole, C.inkSoft, 1.4);
      // Lỗ phải
      c.beginPath();
      c.arc(hubX + hubW - 8, hy, 4.2, 0, Math.PI * 2);
      strokeFill(c, C.hole, C.inkSoft, 1.4);
    }

    // Hai cổng cắm kết nối WeDo 2.0 trên đỉnh Smart Hub
    rr(c, hubX + 10, hubY - 6, 18, 7, 2); strokeFill(c, '#94a3b8', C.ink, 1.8);
    rr(c, hubX + hubW - 28, hubY - 6, 18, 7, 2); strokeFill(c, '#94a3b8', C.ink, 1.8);

    // Vành nút nguồn tròn trung tâm Smart Hub
    var btnY = hubY + 44;
    c.beginPath();
    c.arc(0, btnY, 17, 0, Math.PI * 2);
    strokeFill(c, '#e2e8f0', C.ink, 2.0);

    // Đèn LED RGB tròn hiển thị trạng thái
    var ledColor = C.accent; // mặc định xanh ngọc kết nối
    if (playingNote === 'A') {
      ledColor = C.gold;    // Nốt A: sáng vàng rực rỡ
    } else if (playingNote === 'B') {
      ledColor = C.ok;      // Nốt B: sáng xanh lá / ngọc
    } else if (sensorActive) {
      ledColor = C.gold;
    }

    // Quầng sáng hào quang quanh nút LED khi chơi nốt
    if (playingNote || sensorActive) {
      var glowPulse = 20 + Math.sin(t * 12) * 5;
      c.fillStyle = (playingNote === 'A' || sensorActive) ? 'rgba(255, 210, 63, 0.45)' : 'rgba(67, 160, 71, 0.45)';
      c.beginPath();
      c.arc(0, btnY, glowPulse, 0, Math.PI * 2);
      c.fill();
    }

    // Lõi đèn LED
    c.beginPath();
    c.arc(0, btnY, 11, 0, Math.PI * 2);
    strokeFill(c, ledColor, C.ink, 2.0);
    // Đốm bóng trắng trên nút LED
    c.fillStyle = 'rgba(255, 255, 255, 0.85)';
    c.beginPath();
    c.arc(-3, btnY - 3, 3, 0, Math.PI * 2);
    c.fill();

    // =====================================================================
    // 3.4 CẢM BIẾN SIÊU ÂM (BE-6313)
    // Gắn phía trên thân đàn: 2 mắt tròn (phát/thu sóng siêu âm)
    // =====================================================================
    var sensY = hubY + 86;
    var sensW = 54;
    var sensH = 28;
    var sensX = -sensW / 2;

    // Khung gắn cảm biến màu trắng
    rr(c, sensX, sensY, sensW, sensH, 8);
    strokeFill(c, C.paper, C.ink, 2.4);

    // Hai "mắt" tròn cảm biến siêu âm (mắt trái & mắt phải)
    var eyeOffset = 14;
    for (var side = -1; side <= 1; side += 2) {
      var eyeX = side * eyeOffset;
      var eyeY = sensY + sensH / 2;

      // Vành kim loại bạc
      c.beginPath();
      c.arc(eyeX, eyeY, 10, 0, Math.PI * 2);
      strokeFill(c, '#94a3b8', C.ink, 1.8);

      // Lưới / hốc mắt màu đen sâu
      c.beginPath();
      c.arc(eyeX, eyeY, 7.5, 0, Math.PI * 2);
      c.fillStyle = C.sensorEye;
      c.fill();

      // Vòng tròn màng rung loa / micro siêu âm
      c.beginPath();
      c.arc(eyeX, eyeY, 4.5, 0, Math.PI * 2);
      var innerEyeCol = sensorActive ? C.accentLight : '#334155';
      c.fillStyle = innerEyeCol;
      c.fill();

      // Nếu đang phát hiện hoặc phát sóng: mắt sáng nhấp nháy
      if (sensorActive) {
        c.beginPath();
        c.arc(eyeX, eyeY, 8.5, 0, Math.PI * 2);
        c.strokeStyle = C.gold;
        c.lineWidth = 1.4;
        c.stroke();
      }
    }

    // Dây cáp đen mềm nối từ cảm biến lên cổng Smart Hub
    c.strokeStyle = C.ink;
    c.lineWidth = 2.4;
    c.beginPath();
    c.moveTo(sensX + 4, sensY + 12);
    c.bezierCurveTo(sensX - 14, sensY, hubX - 10, hubY + 10, hubX + 16, hubY - 2);
    c.stroke();

    // =====================================================================
    // 3.5 CẦN ĐÀN (GUITAR NECK)
    // Thanh dầm kỹ thuật dài (Technic beam) màu trắng và xanh vươn thẳng lên
    // =====================================================================
    var neckW = 20;
    var neckH = 175;
    var neckX = -neckW / 2;
    var neckY = hubY - neckH + 6;

    // Thanh dầm chính màu trắng
    rr(c, neckX, neckY, neckW, neckH, 4);
    strokeFill(c, C.paper, C.ink, LINE);

    // Dải nẹp xanh ngọc (accent) chạy giữa cần đàn
    c.fillStyle = C.accent;
    c.fillRect(neckX + 5, neckY + 4, neckW - 10, neckH - 8);

    // Các phím đàn (frets) chia nhịp dọc theo cần đàn
    c.strokeStyle = C.ink;
    c.lineWidth = 1.8;
    for (var fIdx = 1; fIdx < 8; fIdx++) {
      var fy = neckY + fIdx * 21;
      c.beginPath();
      c.moveTo(neckX, fy);
      c.lineTo(neckX + neckW, fy);
      c.stroke();

      // Lỗ chốt Technic ở các phím lẻ
      if (fIdx % 2 === 1) {
        c.beginPath();
        c.arc(0, fy + 10.5, 2.5, 0, Math.PI * 2);
        strokeFill(c, C.hole, C.inkSoft, 1.0);
      }
    }

    // =====================================================================
    // 3.6 ĐẦU ĐÀN (HEADSTOCK)
    // 2 thanh màu vàng đặc trưng, cụm 4 khớp xanh + 2 trục làm "khoá đàn"
    // =====================================================================
    var headW = 32;
    var headH = 50;
    var headX = -headW / 2;
    var headY = neckY - headH + 4;

    // Hai thanh dầm màu vàng rực rỡ ở đầu đàn
    rr(c, headX - 2, headY, headW + 4, headH, 6);
    strokeFill(c, C.gold, C.ink, LINE);

    // Rãnh giữa đầu đàn
    c.fillStyle = C.paper;
    rr(c, headX + 7, headY + 8, headW - 14, headH - 16, 3);
    strokeFill(c, C.paper, C.ink, 1.8);

    // Cụm 4 khớp xanh + 2 trục làm "khoá đàn" (tuning pegs) vươn sang hai bên
    // Bên trái: 2 khoá
    for (var k = 0; k < 2; k++) {
      var ky = headY + 12 + k * 22;
      // Trục ngang kim loại xám
      c.strokeStyle = '#475569';
      c.lineWidth = 3.0;
      c.beginPath();
      c.moveTo(headX - 1, ky); c.lineTo(headX - 14, ky);
      c.moveTo(headX + headW + 1, ky); c.lineTo(headX + headW + 14, ky);
      c.stroke();

      // Khớp xoay xanh ngọc bên trái
      c.beginPath();
      c.arc(headX - 14, ky, 6, 0, Math.PI * 2);
      strokeFill(c, C.accent, C.ink, 1.8);

      // Khớp xoay xanh ngọc bên phải
      c.beginPath();
      c.arc(headX + headW + 14, ky, 6, 0, Math.PI * 2);
      strokeFill(c, C.accent, C.ink, 1.8);
    }

    // =====================================================================
    // 3.7 GÓI SÁNG TẠO 4: DÂY TRANG TRÍ PHÁT SÁNG (GLOW STRINGS)
    // Các dây đàn óng ánh chạy dọc cần đàn, rung lên khi nốt nhạc vang lên
    // =====================================================================
    var stringCount = 4;
    var strSpacing = (neckW - 6) / (stringCount - 1);
    var strYTop = headY + 14;
    var strYBottom = hubY + hubH - 12;

    for (var sIdx = 0; sIdx < stringCount; sIdx++) {
      var sx = neckX + 3 + sIdx * strSpacing;

      // Nếu bật gói glowStrings: dây sáng rực và rung sóng sin
      if (upg.glowStrings) {
        var vibr = (playingNote) ? Math.sin(t * 28 + sIdx * 1.5) * 2.2 : 0;
        // Quầng sáng neon của dây
        c.strokeStyle = (sIdx % 2 === 0) ? 'rgba(61, 193, 220, 0.65)' : 'rgba(255, 210, 63, 0.65)';
        c.lineWidth = 3.6;
        c.beginPath();
        c.moveTo(sx, strYTop);
        c.quadraticCurveTo(sx + vibr, (strYTop + strYBottom) * 0.5, sx, strYBottom);
        c.stroke();

        // Lõi dây phát sáng trắng
        c.strokeStyle = '#ffffff';
        c.lineWidth = 1.6;
        c.stroke();
      } else {
        // Dây cước tiêu chuẩn thanh mảnh
        c.strokeStyle = 'rgba(30, 42, 52, 0.55)';
        c.lineWidth = 1.2;
        c.beginPath();
        c.moveTo(sx, strYTop);
        c.lineTo(sx, strYBottom);
        c.stroke();
      }
    }

    c.restore();
  }

  // =========================================================================
  // 4. HAND(c, x, y, opts)
  // Bàn tay khán giả / học sinh tiến gần rồi rời cảm biến siêu âm trên đàn.
  // Hoàn toàn không vũ khí, nét vẽ thân thiện, không chữ trong hình.
  // opts: { t, dist, gesture, scale, flip }
  // dist: 0..1 (0: sát cảm biến; 1: rời xa)
  // =========================================================================
  function hand(c, x, y, opts) {
    opts = opts || {};
    var t = typeof opts.t === 'number' ? opts.t : 0;
    var dist = typeof opts.dist === 'number' ? opts.dist : 0.5; // 0..1
    var gesture = opts.gesture || 'open'; // 'open' | 'wave' | 'point'
    var sc = typeof opts.scale === 'number' ? opts.scale : 1.0;
    var flip = !!opts.flip;

    c.save();
    c.translate(x, y);
    if (sc !== 1.0) c.scale(sc, sc);
    if (flip) c.scale(-1, 1);

    // Cử động ngón tay nhấp nhô nhẹ nhàng khi che / vẫy cảm biến
    var fWave = Math.sin(t * 6) * 3;

    // 4.1 Cánh tay và tay áo bạn nhỏ (Màu cam STEAM ấm áp hoặc xanh)
    var sleeveW = 48;
    var sleeveL = 65;

    // Cổ tay áo
    c.fillStyle = C.orange;
    rr(c, 24, -18, sleeveL, sleeveW, 6);
    strokeFill(c, C.orange, C.ink, LINE);

    // Bo viền trắng cổ tay áo
    c.fillStyle = C.paper;
    rr(c, 16, -19, 12, sleeveW + 2, 4);
    strokeFill(c, C.paper, C.ink, LINE);

    // 4.2 Lòng bàn tay (Palm) màu da mềm mại
    c.fillStyle = C.skin;
    c.beginPath();
    c.moveTo(18, -12);
    c.lineTo(-8, -14);
    c.quadraticCurveTo(-26, -10, -28, 8);
    c.quadraticCurveTo(-28, 24, -6, 26);
    c.lineTo(18, 24);
    c.closePath();
    strokeFill(c, C.skin, C.ink, LINE);

    // Bóng khối lòng bàn tay
    c.fillStyle = C.skinDark;
    c.beginPath();
    c.arc(-8, 8, 11, 0, Math.PI * 2);
    c.fill();

    // 4.3 Bốn ngón tay mở hướng về phía trước cảm biến
    var fingers = [
      { y: -12, len: 26, w: 9 }, // Ngón trỏ
      { y: -3,  len: 29, w: 9 }, // Ngón giữa (dài nhất)
      { y: 7,   len: 26, w: 9 }, // Ngón áp út
      { y: 16,  len: 21, w: 8 }  // Ngón út
    ];

    for (var f = 0; f < fingers.length; f++) {
      var fg = fingers[f];
      var offX = Math.sin(t * 8 + f * 0.8) * 2;
      c.save();
      c.translate(-24, fg.y);

      // Ngón tay bo tròn mềm mại
      rr(c, -fg.len + offX, -fg.w / 2, fg.len, fg.w, fg.w / 2);
      strokeFill(c, C.skin, C.ink, 2.2);

      // Nếp gấp đốt ngón tay
      c.strokeStyle = C.inkSoft;
      c.lineWidth = 1.4;
      c.beginPath();
      c.moveTo(-fg.len * 0.5 + offX, -fg.w * 0.35);
      c.lineTo(-fg.len * 0.5 + offX, fg.w * 0.35);
      c.stroke();
      c.restore();
    }

    // 4.4 Ngón tay cái (Thumb)
    c.save();
    c.translate(-10, -18);
    c.rotate(-0.4 + fWave * 0.03);
    rr(c, -20, -5, 22, 10, 5);
    strokeFill(c, C.skin, C.ink, 2.2);
    c.restore();

    // Tia gió / hiệu ứng chuyển động tay khi tiến lùi
    if (dist < 0.4) {
      c.strokeStyle = C.gold;
      c.lineWidth = 2.0;
      c.beginPath();
      c.moveTo(-52, -18); c.lineTo(-60, -22);
      c.moveTo(-56, 4);   c.lineTo(-66, 4);
      c.moveTo(-50, 24);  c.lineTo(-58, 28);
      c.stroke();
    }

    c.restore();
  }

  // =========================================================================
  // 5. ULTRASONICWAVES(c, x, y, opts)
  // Các vòng sóng âm / sóng siêu âm lan tỏa từ cảm biến về phía bàn tay.
  // opts: { t, targetX, targetY, detected, strength }
  // =========================================================================
  function ultrasonicWaves(c, x, y, opts) {
    opts = opts || {};
    var t = typeof opts.t === 'number' ? opts.t : 0;
    var targetX = typeof opts.targetX === 'number' ? opts.targetX : x + 160;
    var targetY = typeof opts.targetY === 'number' ? opts.targetY : y;
    var detected = !!opts.detected;
    var str = typeof opts.strength === 'number' ? opts.strength : 1.0;

    c.save();
    c.translate(x, y);

    var angle = Math.atan2(targetY - y, targetX - x);
    c.rotate(angle);

    var maxDist = Math.hypot(targetX - x, targetY - y);
    var waveCount = 4;
    var speed = 120; // tốc độ truyền sóng px/s

    for (var w = 0; w < waveCount; w++) {
      var distW = ((t * speed + w * (maxDist / waveCount)) % maxDist);
      if (distW < 12) continue;

      var progress = distW / maxDist;
      var alpha = (1.0 - progress) * str;
      var arcSpread = 0.55 + progress * 0.3; // góc mở sóng hình nan quạt

      // Màu sóng: Nếu phát hiện vật cản (tay đến gần) chuyển vàng cam, bình thường cyan
      var strokeCol = detected
        ? 'rgba(255, 210, 63, ' + alpha * 0.9 + ')'
        : 'rgba(61, 193, 220, ' + alpha * 0.85 + ')';

      c.strokeStyle = strokeCol;
      c.lineWidth = 2.8 - progress * 1.2;
      c.beginPath();
      c.arc(0, 0, distW, -arcSpread, arcSpread);
      c.stroke();

      // Điểm mút sóng có hạt sáng nhỏ
      if (detected && progress > 0.8) {
        c.fillStyle = C.gold;
        c.beginPath();
        c.arc(distW, 0, 3, 0, Math.PI * 2);
        c.fill();
      }
    }

    // Hiệu ứng phản xạ sóng dội ngược lại cảm biến khi chạm bàn tay
    if (detected) {
      for (var r = 0; r < 2; r++) {
        var rDist = ((t * speed * 0.9 + r * 35) % (maxDist * 0.7));
        var rAlpha = (1.0 - rDist / (maxDist * 0.7)) * 0.8;
        c.strokeStyle = 'rgba(255, 138, 61, ' + rAlpha + ')';
        c.lineWidth = 2.0;
        c.beginPath();
        // Cung phản xạ dội ngược
        c.arc(maxDist, 0, rDist, Math.PI - 0.45, Math.PI + 0.45);
        c.stroke();
      }
    }

    c.restore();
  }

  // =========================================================================
  // 6. SOUNDWAVES(c, x, y, opts)
  // Hiệu ứng sóng âm thanh cộng hưởng lan tỏa từ thân đàn ra không gian (Resonator)
  // opts: { t, active, note }
  // =========================================================================
  function soundWaves(c, x, y, opts) {
    opts = opts || {};
    var t = typeof opts.t === 'number' ? opts.t : 0;
    var active = opts.active !== false;
    var note = opts.note || 'A';

    c.save();
    c.translate(x, y);

    var rings = 3;
    var baseCol = (note === 'A') ? 'rgba(255, 210, 63,' : 'rgba(61, 193, 220,';

    for (var i = 0; i < rings; i++) {
      var r = ((t * 80 + i * 45) % 130) + 20;
      var alpha = Math.max(0, 1.0 - (r / 150));
      c.strokeStyle = baseCol + (alpha * 0.8) + ')';
      c.lineWidth = 2.6 - (r / 150) * 1.5;
      c.beginPath();
      c.ellipse(0, 0, r * 1.2, r * 0.85, 0, 0, Math.PI * 2);
      c.stroke();
    }

    c.restore();
  }

  // =========================================================================
  // 7. NOTEA(c, x, y, opts)
  // Nốt nhạc giai điệu A (Melody A) bay lên khi tay che cảm biến siêu âm.
  // Màu vàng óng (C.gold), hình nốt móc đơn (eighth note ♪), hào quang lấp lánh.
  // TUYỆT ĐỐI KHÔNG CHỮ TRONG HÌNH.
  // opts: { t, scale, floatUp }
  // =========================================================================
  function noteA(c, x, y, opts) {
    opts = opts || {};
    var t = typeof opts.t === 'number' ? opts.t : 0;
    var sc = typeof opts.scale === 'number' ? opts.scale : 1.0;
    var floatUp = typeof opts.floatUp === 'number' ? opts.floatUp : (t * 40) % 120;

    c.save();
    // Nốt nhạc bay bổng lên trên và lắc lư nhẹ
    var curX = x + Math.sin(t * 3.5) * 14;
    var curY = y - floatUp;
    c.translate(curX, curY);
    if (sc !== 1.0) c.scale(sc, sc);

    // Hào quang vàng rực rỡ quanh nốt A
    var glowR = 24 + Math.sin(t * 8) * 4;
    c.fillStyle = 'rgba(255, 210, 63, 0.35)';
    c.beginPath();
    c.arc(0, -8, glowR, 0, Math.PI * 2);
    c.fill();

    // Biểu tượng nốt đơn (♪): đầu nốt nghiêng bầu dục + thân + móc cờ
    c.fillStyle = C.gold;
    c.strokeStyle = C.ink;
    c.lineWidth = 2.6;

    // Đầu nốt (Note head) hình oval nghiêng
    c.save();
    c.translate(-6, 4);
    c.rotate(-0.35);
    c.beginPath();
    c.ellipse(0, 0, 10, 7.5, 0, 0, Math.PI * 2);
    c.fill();
    c.stroke();
    c.restore();

    // Thân nốt (Stem) đứng thẳng
    c.beginPath();
    c.moveTo(2, 2);
    c.lineTo(2, -26);
    c.lineWidth = 3.6;
    c.strokeStyle = C.ink;
    c.stroke();

    // Móc cờ nốt nhạc (Flag) cong điệu nghệ
    c.beginPath();
    c.moveTo(2, -26);
    c.bezierCurveTo(14, -24, 18, -14, 16, -2);
    c.bezierCurveTo(13, -10, 8, -16, 2, -18);
    c.closePath();
    strokeFill(c, C.gold, C.ink, 2.2);

    // Điểm bóng sáng trên đầu nốt
    c.fillStyle = '#ffffff';
    c.beginPath();
    c.ellipse(-7, 2, 3, 1.8, -0.35, 0, Math.PI * 2);
    c.fill();

    // Ngôi sao nhỏ lấp lánh bay theo nốt A
    drawSparkle(c, 16, -30, 5, C.gold);
    drawSparkle(c, -16, -14, 3.5, C.paperWarm);

    c.restore();
  }

  // =========================================================================
  // 8. NOTEB(c, x, y, opts)
  // Nốt nhạc giai điệu B (Melody B) bay lên khi tay rút ra xa cảm biến.
  // Màu xanh ngọc / lục (C.accent/C.ok), hình cặp nốt kép nối xà (♫), bồng bềnh.
  // TUYỆT ĐỐI KHÔNG CHỮ TRONG HÌNH.
  // opts: { t, scale, floatUp }
  // =========================================================================
  function noteB(c, x, y, opts) {
    opts = opts || {};
    var t = typeof opts.t === 'number' ? opts.t : 0;
    var sc = typeof opts.scale === 'number' ? opts.scale : 1.0;
    var floatUp = typeof opts.floatUp === 'number' ? opts.floatUp : (t * 40) % 120;

    c.save();
    // Nốt nhạc bay bổng lên trên và lắc lư nhẹ
    var curX = x + Math.cos(t * 3.5) * 14;
    var curY = y - floatUp;
    c.translate(curX, curY);
    if (sc !== 1.0) c.scale(sc, sc);

    // Hào quang cyan/ngọc rực rỡ quanh nốt B
    var glowR = 26 + Math.sin(t * 8) * 4;
    c.fillStyle = 'rgba(61, 193, 220, 0.35)';
    c.beginPath();
    c.arc(0, -6, glowR, 0, Math.PI * 2);
    c.fill();

    // Cặp nốt nhạc nối xà (beamed pair of notes ♫)
    var noteCol = C.accent;
    c.strokeStyle = C.ink;

    // Hai đầu nốt nghiêng (trái x=-10, phải x=12)
    var heads = [-12, 10];
    for (var h = 0; h < heads.length; h++) {
      var hx = heads[h];
      c.save();
      c.translate(hx, 6);
      c.rotate(-0.35);
      c.beginPath();
      c.ellipse(0, 0, 8.5, 6.5, 0, 0, Math.PI * 2);
      strokeFill(c, noteCol, C.ink, 2.2);

      // Đốm bóng trắng
      c.fillStyle = '#ffffff';
      c.beginPath();
      c.ellipse(-2, -1.5, 2.5, 1.5, -0.35, 0, Math.PI * 2);
      c.fill();
      c.restore();
    }

    // Hai thân nốt thẳng đứng
    c.lineWidth = 3.2;
    c.beginPath();
    c.moveTo(-6, 4);
    c.lineTo(-6, -22);
    c.moveTo(16, 4);
    c.lineTo(16, -26);
    c.stroke();

    // Xà ngang kép nối hai đầu nốt (Beams)
    c.fillStyle = noteCol;
    c.beginPath();
    c.moveTo(-7, -22);
    c.lineTo(17, -26);
    c.lineTo(17, -19);
    c.lineTo(-7, -15);
    c.closePath();
    strokeFill(c, noteCol, C.ink, 2.2);

    // Ngôi sao nhỏ lấp lánh bay theo nốt B
    drawSparkle(c, 22, -28, 5, C.accentLight);
    drawSparkle(c, -20, -16, 3.5, C.paperWarm);

    c.restore();
  }

  // =========================================================================
  // 9. METRONOME(c, x, gy, opts)
  // Máy đếm nhịp sân khấu (Dùng cho M3 & Nâng cao: đo nhịp 1 giây hoặc 2 giây).
  // Con lắc kim loại lắc qua lại đều đặn, vạch nhịp trực quan (KHÔNG CHỮ SỐ).
  // opts: { t, period, ticking, scale }
  // =========================================================================
  function metronome(c, x, gy, opts) {
    opts = opts || {};
    gy = typeof gy === 'number' ? gy : GY0;
    var t = typeof opts.t === 'number' ? opts.t : 0;
    var period = typeof opts.period === 'number' ? opts.period : 1.0; // 1s hoặc 2s
    var ticking = opts.ticking !== false;
    var sc = typeof opts.scale === 'number' ? opts.scale : 1.0;

    c.save();
    c.translate(x, gy);
    if (sc !== 1.0) c.scale(sc, sc);

    // Thân máy đếm nhịp hình kim tự tháp cụt (Pyramidal casing)
    var mH = 88;
    var topW = 28;
    var botW = 60;

    // Vỏ gỗ ấm áp
    c.fillStyle = C.wood;
    c.strokeStyle = C.ink;
    c.lineWidth = LINE;
    c.beginPath();
    c.moveTo(-topW / 2, -mH);
    c.lineTo(topW / 2, -mH);
    c.lineTo(botW / 2, 0);
    c.lineTo(-botW / 2, 0);
    c.closePath();
    c.fill();
    c.stroke();

    // Nắp mặt trước màu kem sáng
    c.fillStyle = C.paperWarm;
    c.beginPath();
    c.moveTo(-topW / 2 + 5, -mH + 8);
    c.lineTo(topW / 2 - 5, -mH + 8);
    c.lineTo(botW / 2 - 8, -8);
    c.lineTo(-botW / 2 + 8, -8);
    c.closePath();
    strokeFill(c, C.paperWarm, C.ink, 1.8);

    // Các vạch khắc nhịp trực quan hình học (KHÔNG DÙNG CHỮ HAY SỐ)
    c.strokeStyle = '#94a3b8';
    c.lineWidth = 1.4;
    for (var vy = -mH + 20; vy <= -22; vy += 10) {
      var wRatio = (vy + mH) / mH;
      var curW = 12 + wRatio * 18;
      c.beginPath();
      c.moveTo(-curW / 2, vy);
      c.lineTo(curW / 2, vy);
      c.stroke();
    }

    // Góc con lắc dao động điều hòa theo thời gian và chu kỳ nhịp (period: 1 hoặc 2)
    var maxAngle = 0.38;
    var angle = ticking ? maxAngle * Math.sin((t * 2 * Math.PI) / period) : 0;

    // Chốt xoay con lắc ở đáy
    var pivotY = -16;

    // Vẽ cần con lắc kim loại lắc lư
    c.save();
    c.translate(0, pivotY);
    c.rotate(angle);

    // Thanh kim loại
    c.strokeStyle = '#475569';
    c.lineWidth = 3.0;
    c.beginPath();
    c.moveTo(0, 4);
    c.lineTo(0, -mH + 18);
    c.stroke();

    // Quả nặng điều chỉnh nhịp (Sliding weight block) bằng đồng/vàng
    var weightY = (period === 1.0) ? -mH * 0.65 : -mH * 0.45; // 1s đặt cao (nhịp nhanh), 2s đặt thấp
    c.fillStyle = C.gold;
    rr(c, -7, weightY - 6, 14, 12, 2);
    strokeFill(c, C.gold, C.ink, 1.8);

    c.restore();

    // Chốt tròn che gốc con lắc
    c.beginPath();
    c.arc(0, pivotY, 5, 0, Math.PI * 2);
    strokeFill(c, C.ink, C.ink, 1.5);

    // Đèn LED chỉ báo nhịp ở đỉnh máy đếm nhịp
    var isBeat = Math.abs(Math.sin((t * 2 * Math.PI) / period)) > 0.88;
    c.beginPath();
    c.arc(0, -mH + 4, 4, 0, Math.PI * 2);
    var beatCol = isBeat ? C.warn : '#64748b';
    strokeFill(c, beatCol, C.ink, 1.6);

    // Chân đế cao su
    c.fillStyle = '#1e293b';
    rr(c, -botW / 2 - 2, 0, 10, 4, 1); strokeFill(c, '#1e293b', C.ink, 1.6);
    rr(c, botW / 2 - 8, 0, 10, 4, 1);  strokeFill(c, '#1e293b', C.ink, 1.6);

    c.restore();
  }

  // =========================================================================
  // 10. UPGRADE(c, type, x, y, opts)
  // Vẽ độc lập từng gói sáng tạo M4 trên huy hiệu mô-đun:
  // 'stand' (Giá đỡ đàn), 'stageLights' (Đèn sân khấu rọi đổi màu),
  // 'resonator' (Hộp cộng hưởng âm thanh), 'glowStrings' (Dây đàn phát sáng).
  // =========================================================================
  function upgrade(c, type, x, y, opts) {
    opts = opts || {};
    var sc = typeof opts.size === 'number' ? opts.size : (opts.scale || 1.0);
    var t = typeof opts.t === 'number' ? opts.t : 0;

    c.save();
    c.translate(x, y);
    if (sc !== 1.0) c.scale(sc, sc);

    if (type === 'stand') {
      // 1. GIÁ ĐỠ ĐÀN (STAND)
      c.strokeStyle = C.ink;
      c.lineWidth = 3.2;

      // Chân đỡ 3 chạc
      c.beginPath();
      c.moveTo(-28, 22);
      c.lineTo(0, 0);
      c.lineTo(28, 22);
      c.stroke();

      // Cột trụ đứng
      c.beginPath();
      c.moveTo(0, 0);
      c.lineTo(0, -28);
      c.stroke();

      // Càng đỡ dưới thân đàn
      c.beginPath();
      c.moveTo(-22, -10);
      c.quadraticCurveTo(0, -2, 22, -10);
      strokeFill(c, null, '#0e1726', 4.5);

      // Núm bọc đệm vàng
      c.fillStyle = C.gold;
      c.beginPath();
      c.arc(-22, -10, 3.5, 0, Math.PI * 2);
      c.arc(22, -10, 3.5, 0, Math.PI * 2);
      c.fill();

    } else if (type === 'stageLights') {
      // 2. ĐÈN SÂN KHẤU (STAGE LIGHTS)
      // Càng treo đèn
      c.strokeStyle = C.ink;
      c.lineWidth = 2.8;
      c.beginPath();
      c.moveTo(0, -30);
      c.lineTo(0, -16);
      c.stroke();

      // Vỏ đèn rọi spotlight
      c.beginPath();
      c.moveTo(-16, -16);
      c.lineTo(16, -16);
      c.lineTo(22, 6);
      c.lineTo(-22, 6);
      c.closePath();
      strokeFill(c, '#334155', C.ink, 2.4);

      // Thấu kính đèn phát sáng rực rỡ
      c.beginPath();
      c.ellipse(0, 6, 20, 6, 0, 0, Math.PI * 2);
      strokeFill(c, C.gold, C.ink, 2.0);

      // Các tia sáng màu sắc rọi xuống
      c.strokeStyle = 'rgba(255, 210, 63, 0.7)';
      c.lineWidth = 2.4;
      c.beginPath();
      c.moveTo(-12, 12); c.lineTo(-24, 28);
      c.moveTo(0, 14);   c.lineTo(0, 30);
      c.moveTo(12, 12);  c.lineTo(24, 28);
      c.stroke();

    } else if (type === 'resonator') {
      // 3. HỘP CỘNG HƯỞNG (RESONATOR)
      // Thân gỗ uốn lượn phong cách đàn guitar
      c.fillStyle = '#b07a4b';
      c.strokeStyle = C.ink;
      c.lineWidth = 2.6;
      c.beginPath();
      c.moveTo(-15, -28);
      c.bezierCurveTo(-34, -25, -38, -10, -26, 2);
      c.bezierCurveTo(-38, 14, -30, 28, -15, 28);
      c.lineTo(15, 28);
      c.bezierCurveTo(30, 28, 38, 14, 26, 2);
      c.bezierCurveTo(38, -10, 34, -25, 15, -28);
      c.closePath();
      c.fill();
      c.stroke();

      // Lỗ thoát âm cách điệu
      c.fillStyle = '#2c1e14';
      c.beginPath();
      c.ellipse(-16, 2, 3, 9, -0.2, 0, Math.PI * 2);
      c.ellipse(16, 2, 3, 9, 0.2, 0, Math.PI * 2);
      c.fill();

      // Vòng sóng âm cộng hưởng
      c.strokeStyle = C.gold;
      c.lineWidth = 2.0;
      c.beginPath();
      c.arc(0, 2, 22, -0.7, 0.7);
      c.arc(0, 2, 22, Math.PI - 0.7, Math.PI + 0.7);
      c.stroke();

    } else if (type === 'glowStrings') {
      // 4. DÂY TRANG TRÍ PHÁT SÁNG (GLOW STRINGS)
      // Cần đàn mẫu
      c.fillStyle = C.paper;
      rr(c, -10, -28, 20, 56, 3);
      strokeFill(c, C.paper, C.ink, 2.2);

      // Phím đàn
      c.strokeStyle = C.ink;
      c.lineWidth = 1.4;
      c.beginPath();
      c.moveTo(-10, -10); c.lineTo(10, -10);
      c.moveTo(-10, 8);   c.lineTo(10, 8);
      c.stroke();

      // 3 dải dây dạ quang rực rỡ rung rinh
      var colors = [C.accent, C.gold, C.accentLight];
      for (var s = 0; s < 3; s++) {
        var strX = -6 + s * 6;
        var vibr = Math.sin(t * 12 + s * 2) * 2;
        c.strokeStyle = colors[s];
        c.lineWidth = 2.6;
        c.beginPath();
        c.moveTo(strX, -28);
        c.quadraticCurveTo(strX + vibr, 0, strX, 28);
        c.stroke();
      }
      drawSparkle(c, 0, 0, 4, C.gold);
    }

    c.restore();
  }

  // =========================================================================
  // 11. SCENE(c, opts)
  // Master scene tích hợp toàn cảnh mô phỏng Lớp 3 Bài 14: Cây đàn ghi-ta.
  // Chạy chu kỳ 7 khối chuẩn từ KHGD:
  // Start -> Repeat Start -> Wait for Obstacles -> Melody A -> Wait for No Obstacle -> Melody B -> Repeat End.
  // opts: { t, mode, handDist, tempo, upgrades, curtainOpen }
  // =========================================================================
  function scene(c, opts) {
    opts = opts || {};
    var t = typeof opts.t === 'number' ? opts.t : 0;
    var mode = opts.mode || 'auto'; // 'auto' | 'interactive'
    var tempo = typeof opts.tempo === 'number' ? opts.tempo : 1.0; // 1s hoặc 2s
    var upg = opts.upgrades || { stand: true, stageLights: true, resonator: true, glowStrings: true };
    var curtainOpen = typeof opts.curtainOpen === 'number' ? opts.curtainOpen : 0.85;

    c.save();

    // 11.1 Tính toán chu kỳ biểu diễn 7 khối (Cycle duration = 4.0s)
    var cycleT = 4.0;
    var localT = t % cycleT;

    var handDist = 0.8; // 0..1 (0: rất gần, 1: rất xa)
    var playingNote = null;
    var sensorActive = false;
    var showNoteA = false;
    var showNoteB = false;

    if (mode === 'auto') {
      // Giai đoạn 1 (0 -> 1.4s): Bàn tay tiến lại gần cảm biến (Wait for Obstacles)
      if (localT < 1.4) {
        handDist = 0.85 - (localT / 1.4) * 0.70; // 0.85 -> 0.15
        if (handDist < 0.35) sensorActive = true;
      }
      // Giai đoạn 2 (1.4 -> 2.0s): Tay ở sát cảm biến, phát Melody A (Nốt A vang lên)
      else if (localT < 2.0) {
        handDist = 0.15;
        sensorActive = true;
        playingNote = 'A';
        showNoteA = true;
      }
      // Giai đoạn 3 (2.0 -> 3.4s): Bàn tay rời xa cảm biến (Wait for No Obstacle)
      else if (localT < 3.4) {
        handDist = 0.15 + ((localT - 2.0) / 1.4) * 0.70; // 0.15 -> 0.85
        if (handDist < 0.30) sensorActive = true;
      }
      // Giai đoạn 4 (3.4 -> 4.0s): Tay ở xa, phát Melody B (Nốt B vang lên)
      else {
        handDist = 0.85;
        sensorActive = false;
        playingNote = 'B';
        showNoteB = true;
      }
    } else {
      // Chế độ thủ công
      handDist = typeof opts.handDist === 'number' ? opts.handDist : 0.5;
      sensorActive = handDist < 0.32;
      // null được truyền tường minh khi engine đang chờ: không tự phát nốt theo vị trí tay.
      playingNote = Object.prototype.hasOwnProperty.call(opts, 'playingNote')
        ? opts.playingNote : (sensorActive ? 'A' : (handDist > 0.65 ? 'B' : null));
      if (playingNote === 'A') showNoteA = true;
      if (playingNote === 'B') showNoteB = true;
    }

    // 11.2 Vẽ nền sân khấu
    background(c, {
      t: t,
      curtainOpen: curtainOpen,
      lightsOn: true,
      beat: Math.abs(Math.sin((t * 2 * Math.PI) / tempo))
    });

    // 11.3 Vẽ luồng ánh sáng đèn sân khấu (Spotlight beams)
    if (upg.stageLights) {
      // Luồng sáng chính rọi vào cây đàn
      var spotCol = (playingNote === 'A') ? 'gold' : (playingNote === 'B' ? 'cyan' : 'warm');
      stageLightBeam(c, 450, 44, {
        targetX: 420,
        targetY: GY0,
        spread: 165,
        color: spotCol,
        intensity: 0.9,
        t: t
      });
      // Luồng sáng phụ nhẹ rọi vào bạn nhỏ
      stageLightBeam(c, 740, 44, {
        targetX: 680,
        targetY: GY0,
        spread: 120,
        color: 'purple',
        intensity: 0.5,
        t: t
      });
    }

    // 11.4 Vẽ máy đếm nhịp (Metronome) bên cánh trái sân khấu
    metronome(c, 160, GY0, {
      t: t,
      period: tempo,
      ticking: true,
      scale: 1.05
    });

    // 11.5 Vẽ cây đàn ghi-ta WeDo 2.0 ở trung tâm sân khấu (x=410, y=GY0)
    var guitarX = 410;
    guitar(c, guitarX, GY0, {
      t: t,
      tilt: -0.05,
      sensorActive: sensorActive,
      playingNote: playingNote,
      upgrades: upg,
      scale: 1.05
    });

    // 11.6 Sóng âm thanh cộng hưởng lan tỏa từ thân đàn
    if (upg.resonator && (playingNote || sensorActive)) {
      soundWaves(c, guitarX, GY0 - 80, {
        t: t,
        active: true,
        note: playingNote || 'A'
      });
    }

    // 11.7 Vị trí cảm biến siêu âm trên đàn
    var sensorEyeX = guitarX + 16;
    var sensorEyeY = GY0 - 150;

    // Vị trí bàn tay khán giả (di chuyển theo handDist từ 0..1)
    // handDist = 0 -> x = sensorEyeX + 70 (sát cạnh)
    // handDist = 1 -> x = sensorEyeX + 260 (rất xa)
    var handX = sensorEyeX + 70 + handDist * 190;
    var handY = sensorEyeY + Math.sin(t * 4) * 6;

    // 11.8 Sóng siêu âm bắn giữa cảm biến và bàn tay
    ultrasonicWaves(c, sensorEyeX, sensorEyeY, {
      t: t,
      targetX: handX - 25,
      targetY: handY,
      detected: sensorActive,
      strength: 1.0
    });

    // 11.9 Vẽ bàn tay khán giả đưa vào/ra
    hand(c, handX, handY, {
      t: t,
      dist: handDist,
      scale: 1.0,
      flip: false
    });

    // 11.10 Hiệu ứng nốt nhạc bay lên
    if (showNoteA) {
      noteA(c, guitarX + 30, sensorEyeY - 20, {
        t: t,
        scale: 1.15,
        floatUp: ((t * 55) % 90)
      });
    }

    if (showNoteB) {
      noteB(c, guitarX + 50, sensorEyeY - 20, {
        t: t,
        scale: 1.15,
        floatUp: ((t * 55) % 90)
      });
    }

    c.restore();
  }

  // =========================================================================
  // XUẤT GIAO DIỆN window.Lop3Bai14Art
  // =========================================================================
  var Lop3Bai14Art = {
    W: W0,
    H: H0,
    GROUND_Y: GY0,
    LINE: LINE,
    C: C,

    // Các hàm vẽ chính
    background: background,
    stageLightBeam: stageLightBeam,
    guitar: guitar,
    hand: hand,
    ultrasonicWaves: ultrasonicWaves,
    soundWaves: soundWaves,
    noteA: noteA,
    noteB: noteB,
    metronome: metronome,
    upgrade: upgrade,
    scene: scene,

    // Các alias bổ sung thuận tiện cho engine mô phỏng
    drawBackground: background,
    drawStageLightBeam: stageLightBeam,
    drawGuitar: guitar,
    drawHand: hand,
    drawUltrasonicWaves: ultrasonicWaves,
    drawSoundWaves: soundWaves,
    drawNoteA: noteA,
    drawNoteB: noteB,
    drawMetronome: metronome,
    drawUpgrade: upgrade,
    drawScene: scene,
    model: guitar,
    obstacle: hand,
    sonar: ultrasonicWaves
  };

  if (typeof window !== 'undefined') {
    window.Lop3Bai14Art = Lop3Bai14Art;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Lop3Bai14Art;
  }
})();
