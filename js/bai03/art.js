// Tranh vẽ cảnh sao Hỏa và robot Milo cho Bài 3 (chặng ③ và xưởng sáng tạo).
// Hệ toạ độ logic: W = 900, H = 560, GROUND_Y = 430.
// Không dùng ảnh ngoài, font ngoài, hay Math.random() trong khi vẽ.
(function () {
  'use strict';

  const W = 900;
  const H = 560;
  const GROUND_Y = 430;

  // Hàm vẽ hình chữ nhật bo góc tương thích mọi trình duyệt
  function roundRect(ctx, x, y, w, h, r) {
    if (typeof ctx.roundRect === 'function') {
      ctx.roundRect(x, y, w, h, r);
      return;
    }
    let tl = 0, tr = 0, br = 0, bl = 0;
    if (Array.isArray(r)) {
      if (r.length === 1) {
        tl = tr = br = bl = r[0];
      } else if (r.length === 2) {
        tl = br = r[0];
        tr = bl = r[1];
      } else if (r.length >= 4) {
        tl = r[0]; tr = r[1]; br = r[2]; bl = r[3];
      }
    } else {
      tl = tr = br = bl = Number(r) || 0;
    }
    ctx.moveTo(x + tl, y);
    ctx.lineTo(x + w - tr, y);
    if (tr) ctx.arcTo(x + w, y, x + w, y + tr, tr);
    ctx.lineTo(x + w, y + h - br);
    if (br) ctx.arcTo(x + w, y + h, x + w - br, y + h, br);
    ctx.lineTo(x + bl, y + h);
    if (bl) ctx.arcTo(x, y + h, x, y + h - bl, bl);
    ctx.lineTo(x, y + tl);
    if (tl) ctx.arcTo(x, y, x + tl, y, tl);
  }

  // Dữ liệu sỏi cố định trên mặt đất (không dùng Math.random để tránh chớp giật)
  const PEBBLES = [
    { x: 28, y: 442, rx: 3, ry: 2, c: '#8a4a2e' },
    { x: 64, y: 476, rx: 4, ry: 2.5, c: '#72361d' },
    { x: 105, y: 448, rx: 2.5, ry: 1.8, c: '#a94f2c' },
    { x: 148, y: 495, rx: 5, ry: 3, c: '#5a2814' },
    { x: 195, y: 440, rx: 3, ry: 2, c: '#8a4a2e' },
    { x: 232, y: 468, rx: 4.5, ry: 2.5, c: '#72361d' },
    { x: 280, y: 512, rx: 3.5, ry: 2.2, c: '#5a2814' },
    { x: 325, y: 445, rx: 2.8, ry: 1.8, c: '#a94f2c' },
    { x: 360, y: 485, rx: 4, ry: 2.6, c: '#8a4a2e' },
    { x: 410, y: 452, rx: 3, ry: 2, c: '#72361d' },
    { x: 455, y: 520, rx: 5.5, ry: 3.2, c: '#5a2814' },
    { x: 505, y: 443, rx: 3.2, ry: 2, c: '#8a4a2e' },
    { x: 548, y: 475, rx: 4, ry: 2.4, c: '#a94f2c' },
    { x: 590, y: 498, rx: 3.5, ry: 2.2, c: '#72361d' },
    { x: 635, y: 446, rx: 2.5, ry: 1.8, c: '#8a4a2e' },
    { x: 672, y: 482, rx: 4.2, ry: 2.6, c: '#5a2814' },
    { x: 715, y: 441, rx: 3, ry: 2, c: '#a94f2c' },
    { x: 755, y: 515, rx: 4.8, ry: 3, c: '#72361d' },
    { x: 802, y: 460, rx: 3.5, ry: 2.2, c: '#8a4a2e' },
    { x: 845, y: 447, rx: 2.8, ry: 1.8, c: '#a94f2c' },
    { x: 882, y: 490, rx: 4.5, ry: 2.8, c: '#5a2814' }
  ];

  // Hạt bụi bay nhẹ trên bầu trời (tính vị trí tuần hoàn theo thời gian t)
  const DUST_MOTES = [
    { x0: 80, y: 120, sp: 18, r: 1.8 },
    { x0: 240, y: 85, sp: 24, r: 1.4 },
    { x0: 410, y: 160, sp: 15, r: 2.2 },
    { x0: 570, y: 110, sp: 22, r: 1.6 },
    { x0: 720, y: 145, sp: 19, r: 2.0 },
    { x0: 850, y: 95, sp: 26, r: 1.5 }
  ];

  // 1. Vẽ nền sao Hỏa: trời cam hồng, mặt trời nhỏ, đồi xa, mặt đất, sỏi, mây bụi
  function drawBackground(ctx, t) {
    const sec = typeof t === 'number' ? t : 0;

    // --- Bầu trời cam hồng nhạt ---
    const skyGrad = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
    skyGrad.addColorStop(0, '#f6c7a1');
    skyGrad.addColorStop(0.7, '#f0b18d');
    skyGrad.addColorStop(1, '#e9a07a');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, W, GROUND_Y);

    // --- Mặt trời sao Hỏa nhỏ và nhạt xa xa ---
    const sunX = 730;
    const sunY = 95;
    // Quầng sáng mờ quanh mặt trời
    const sunGlow = ctx.createRadialGradient(sunX, sunY, 6, sunX, sunY, 48);
    sunGlow.addColorStop(0, 'rgba(255, 250, 235, 0.45)');
    sunGlow.addColorStop(0.5, 'rgba(255, 230, 205, 0.18)');
    sunGlow.addColorStop(1, 'rgba(255, 220, 195, 0)');
    ctx.fillStyle = sunGlow;
    ctx.beginPath();
    ctx.arc(sunX, sunY, 48, 0, Math.PI * 2);
    ctx.fill();
    // Đĩa mặt trời
    ctx.fillStyle = '#fffdf2';
    ctx.beginPath();
    ctx.arc(sunX, sunY, 10, 0, Math.PI * 2);
    ctx.fill();

    // --- Vệt mây bụi gió sao Hỏa nhẹ nhàng trôi ---
    ctx.save();
    ctx.fillStyle = 'rgba(255, 235, 220, 0.22)';
    for (let i = 0; i < 3; i++) {
      const cy = 60 + i * 55;
      const sp = 14 + i * 8;
      const cx = ((sec * sp + i * 320) % (W + 260)) - 130;
      const len = 110 + i * 35;
      ctx.beginPath();
      ctx.ellipse(cx, cy, len, 8 + i * 2, -0.04, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // --- Đồi núi xa (lớp 1 - màu hồng đất nhạt) ---
    ctx.fillStyle = '#dc8e72';
    ctx.strokeStyle = '#b86d52';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, 360);
    ctx.bezierCurveTo(90, 320, 180, 335, 270, 305);
    ctx.bezierCurveTo(360, 275, 450, 340, 560, 315);
    ctx.bezierCurveTo(670, 290, 780, 330, 900, 320);
    ctx.lineTo(W, GROUND_Y);
    ctx.lineTo(0, GROUND_Y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // --- Đồi núi trung cảnh (lớp 2 - màu đất đỏ ấm hơn) ---
    ctx.fillStyle = '#cb7551';
    ctx.strokeStyle = '#9c4c2d';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 395);
    ctx.bezierCurveTo(120, 365, 210, 385, 340, 355);
    ctx.bezierCurveTo(460, 330, 580, 385, 710, 360);
    ctx.bezierCurveTo(800, 342, 860, 372, 900, 365);
    ctx.lineTo(W, GROUND_Y);
    ctx.lineTo(0, GROUND_Y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Gờ miệng hố va chạm mờ ở đồi
    ctx.strokeStyle = '#df8967';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(340, 362, 38, Math.PI * 0.9, Math.PI * 1.85);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(710, 367, 32, Math.PI * 0.95, Math.PI * 1.8);
    ctx.stroke();

    // --- Hạt bụi nhỏ lơ lửng trong gió ---
    ctx.fillStyle = 'rgba(255, 245, 230, 0.45)';
    for (const m of DUST_MOTES) {
      const mx = (m.x0 + sec * m.sp) % W;
      const my = m.y + Math.sin(sec * 1.5 + m.x0) * 4;
      ctx.beginPath();
      ctx.arc(mx, my, m.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // --- Mặt đất sao Hỏa (từ GROUND_Y = 430 xuống dưới) ---
    // Nền đất chính
    const groundGrad = ctx.createLinearGradient(0, GROUND_Y, 0, H);
    groundGrad.addColorStop(0, '#c8643b');
    groundGrad.addColorStop(0.25, '#bb5a33');
    groundGrad.addColorStop(1, '#9b4625');
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, GROUND_Y, W, H - GROUND_Y);

    // Dải mép bề mặt đất đậm nét
    ctx.fillStyle = '#a94f2c';
    ctx.fillRect(0, GROUND_Y, W, 7);

    // Đường viền ngăn cách trời và đất
    ctx.strokeStyle = '#1e2a34';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);
    ctx.lineTo(W, GROUND_Y);
    ctx.stroke();

    // Vệt bánh xe mờ trên mặt đất
    ctx.strokeStyle = 'rgba(120, 48, 22, 0.35)';
    ctx.lineWidth = 3;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y + 14);
    ctx.lineTo(W, GROUND_Y + 14);
    ctx.stroke();
    ctx.setLineDash([]);

    // Sỏi đá nhỏ rải rác cố định
    for (const p of PEBBLES) {
      ctx.fillStyle = p.c;
      ctx.beginPath();
      ctx.ellipse(p.x, p.y, p.rx, p.ry, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 2. Cột cờ + biển chữ Trạm A (xanh lá) / Điểm B (cam), chân đứng ở GROUND_Y
  function drawStation(ctx, x, kind) {
    const isA = kind === 'A';
    const text = isA ? 'Trạm A' : 'Điểm B';
    const mainColor = isA ? '#2e7d32' : '#e65100';
    const lightColor = isA ? '#43a047' : '#f57c00';
    const glowColor = isA ? '#81c784' : '#ffb74d';

    ctx.save();
    // Chân đế kim loại trên mặt đất
    ctx.fillStyle = '#37474f';
    ctx.strokeStyle = '#1e2a34';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    roundRect(ctx, x - 22, GROUND_Y - 8, 44, 8, [4, 4, 0, 0]);
    ctx.fill();
    ctx.stroke();

    // Đinh tán chân đế
    ctx.fillStyle = '#cfd8dc';
    ctx.beginPath();
    ctx.arc(x - 14, GROUND_Y - 4, 2, 0, Math.PI * 2);
    ctx.arc(x + 14, GROUND_Y - 4, 2, 0, Math.PI * 2);
    ctx.fill();

    // Cột cờ thẳng đứng
    const poleTopY = GROUND_Y - 105;
    ctx.fillStyle = '#90a4ae';
    ctx.strokeStyle = '#1e2a34';
    ctx.lineWidth = 2.5;
    ctx.fillRect(x - 3, poleTopY, 6, 105 - 8);
    ctx.strokeRect(x - 3, poleTopY, 6, 105 - 8);

    // Viên bi tròn vàng ở đỉnh cột
    ctx.fillStyle = '#ffd23f';
    ctx.beginPath();
    ctx.arc(x, poleTopY - 2, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Lá cờ tam giác nhỏ phất trên ngọn
    ctx.fillStyle = lightColor;
    ctx.beginPath();
    ctx.moveTo(x + 3, poleTopY + 2);
    ctx.lineTo(x + 32, poleTopY + 12);
    ctx.lineTo(x + 3, poleTopY + 22);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Biển báo hình chữ nhật bo góc
    const boardW = 88;
    const boardH = 34;
    const boardX = x - boardW / 2;
    const boardY = GROUND_Y - 76;

    // Quai kẹp biển vào cột
    ctx.fillStyle = '#455a64';
    ctx.fillRect(x - 6, boardY + 6, 12, 5);
    ctx.fillRect(x - 6, boardY + boardH - 11, 12, 5);

    // Khung biển
    ctx.fillStyle = mainColor;
    ctx.strokeStyle = '#1e2a34';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    roundRect(ctx, boardX, boardY, boardW, boardH, 6);
    ctx.fill();
    ctx.stroke();

    // Viền sáng bên trong biển
    ctx.strokeStyle = glowColor;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    roundRect(ctx, boardX + 3, boardY + 3, boardW - 6, boardH - 6, 4);
    ctx.stroke();

    // Chữ biển (theo chuẩn phiếu yêu cầu)
    ctx.font = '700 16px "Be Vietnam Pro","Segoe UI",sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = 'rgba(20, 24, 30, 0.85)';
    ctx.strokeText(text, x, boardY + boardH / 2);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(text, x, boardY + boardH / 2);

    ctx.restore();
  }

  // 3. Chậu mẫu cây nhỏ, (x, y) = đáy chậu, k = tỉ lệ (1 ≈ cao 40 px)
  function drawSample(ctx, x, y, k) {
    const scale = typeof k === 'number' ? k : 1;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    // Chậu đất nung (đáy ở y = 0, cao 14px)
    ctx.fillStyle = '#d8723c';
    ctx.strokeStyle = '#1e2a34';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-7, 0);
    ctx.lineTo(7, 0);
    ctx.lineTo(9.5, -12);
    ctx.lineTo(-9.5, -12);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Vành miệng chậu
    ctx.fillStyle = '#e5834e';
    ctx.beginPath();
    roundRect(ctx, -11, -15, 22, 4.5, 2);
    ctx.fill();
    ctx.stroke();

    // Đất màu nâu sẫm trong chậu
    ctx.fillStyle = '#4e2a14';
    ctx.beginPath();
    ctx.ellipse(0, -14, 8, 2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Thân cây xanh mọc vươn lên
    ctx.strokeStyle = '#2e7d32';
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(0, -14);
    ctx.quadraticCurveTo(2, -26, -1, -36);
    ctx.stroke();

    // Lá bên trái
    ctx.fillStyle = '#4caf50';
    ctx.strokeStyle = '#1e2a34';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(0, -23);
    ctx.quadraticCurveTo(-12, -28, -13, -20);
    ctx.quadraticCurveTo(-7, -18, 0, -21);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Lá bên phải
    ctx.fillStyle = '#66bb6a';
    ctx.beginPath();
    ctx.moveTo(1, -27);
    ctx.quadraticCurveTo(13, -33, 14, -24);
    ctx.quadraticCurveTo(8, -22, 1, -25);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Chồi / lá non ở đỉnh
    ctx.fillStyle = '#81c784';
    ctx.beginPath();
    ctx.ellipse(-1, -37, 4, 6, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }

  // 4. Bàn tay xoè (vật cản đưa trước cảm biến), (x, y) = tâm, k = tỉ lệ
  function drawHand(ctx, x, y, k) {
    const scale = typeof k === 'number' ? k : 1;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    // Cổ tay
    ctx.fillStyle = '#f5b991';
    ctx.strokeStyle = '#1e2a34';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    roundRect(ctx, -8, 12, 16, 12, [0, 0, 4, 4]);
    ctx.fill();
    ctx.stroke();

    // Lòng bàn tay
    ctx.fillStyle = '#fcd5b5';
    ctx.beginPath();
    roundRect(ctx, -14, -6, 28, 20, 8);
    ctx.fill();
    ctx.stroke();

    // Các ngón tay xoè: ngón cái chìa sang trái, 4 ngón vươn lên
    const fingers = [
      { x: -14, y: 3, w: 7, h: 14, rot: -0.65 }, // ngón cái
      { x: -9, y: -19, w: 6.5, h: 16, rot: -0.15 }, // ngón trỏ
      { x: -2, y: -23, w: 6.5, h: 19, rot: 0.0 }, // ngón giữa
      { x: 5, y: -20, w: 6.5, h: 17, rot: 0.12 }, // ngón áp út
      { x: 11, y: -16, w: 6, h: 14, rot: 0.28 } // ngón út
    ];

    for (const f of fingers) {
      ctx.save();
      ctx.translate(f.x + f.w / 2, f.y + f.h / 2);
      ctx.rotate(f.rot);
      ctx.fillStyle = '#fcd5b5';
      ctx.beginPath();
      roundRect(ctx, -f.w / 2, -f.h / 2, f.w, f.h, f.w / 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    // Đường gân lòng bàn tay thân thiện
    ctx.strokeStyle = '#e59a72';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 4, 8, 0.4, Math.PI * 0.85);
    ctx.stroke();

    // Vạch sóng tín hiệu phát hiện quanh bàn tay
    ctx.strokeStyle = 'rgba(255, 210, 63, 0.75)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(-16, -6, 9, Math.PI * 0.8, Math.PI * 1.5);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(-18, -6, 16, Math.PI * 0.8, Math.PI * 1.5);
    ctx.stroke();

    ctx.restore();
  }

  // 5. Tảng đá đỏ nâu trên mặt đất, seed để hình dạng cố định
  function drawRock(ctx, x, size, seed) {
    const r = typeof size === 'number' ? size : 20;
    let s = Math.abs(Math.floor(seed || 1)) * 16807 + 7;
    function rand() {
      s = (s * 16807) % 2147483647;
      return (s - 1) / 2147483646;
    }

    const n = 8;
    const pts = [];
    for (let i = 0; i <= n; i++) {
      const theta = Math.PI - (i / n) * Math.PI; // từ PI (trái) sang 0 (phải)
      const radVar = 0.8 + rand() * 0.4;
      const px = Math.cos(theta) * r * radVar;
      const py = -Math.sin(theta) * r * (0.65 + rand() * 0.35);
      pts.push([px, py]);
    }

    ctx.save();
    ctx.translate(x, GROUND_Y);

    // Bóng tảng đá trên mặt đất
    ctx.fillStyle = 'rgba(40, 16, 8, 0.35)';
    ctx.beginPath();
    ctx.ellipse(0, 2, r * 1.1, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Thân tảng đá
    ctx.beginPath();
    ctx.moveTo(pts[0][0], 0);
    for (let i = 1; i <= n; i++) {
      ctx.lineTo(pts[i][0], pts[i][1]);
    }
    ctx.lineTo(pts[n][0], 0);
    ctx.closePath();

    ctx.fillStyle = '#8a4a2e';
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#1e2a34';
    ctx.stroke();

    // Mảng sáng chiếu từ phía trên trái
    ctx.fillStyle = 'rgba(230, 130, 95, 0.35)';
    ctx.beginPath();
    ctx.moveTo(pts[0][0] * 0.7, 0);
    for (let i = 1; i <= Math.floor(n / 2) + 1; i++) {
      ctx.lineTo(pts[i][0] * 0.75, pts[i][1] * 0.75);
    }
    ctx.lineTo(0, 0);
    ctx.closePath();
    ctx.fill();

    // Vết nứt gồ ghề trên đá
    ctx.strokeStyle = '#5a2814';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(pts[3][0] * 0.8, pts[3][1] * 0.8);
    ctx.lineTo(pts[3][0] * 0.4, pts[3][1] * 0.4);
    ctx.lineTo(pts[3][0] * 0.2, 0);
    ctx.stroke();

    ctx.restore();
  }

  // 6. Robot Milo trên mặt đất: x = tâm robot, mặt cảm biến hướng sang PHẢI (+x)
  // Tham số o: wheel, eyes, shake, bin, carry, antenna, solar, arm, t
  function drawRover(ctx, x, o) {
    const opts = o || {};
    const wheelAngle = typeof opts.wheel === 'number' ? opts.wheel : 0;
    const eyesLit = !!opts.eyes;
    const shakeVal = Math.min(1, Math.max(0, typeof opts.shake === 'number' ? opts.shake : 0));
    const sec = typeof opts.t === 'number' ? opts.t : 0;

    // Rung lắc khi va chạm
    const shakeX = shakeVal > 0 ? Math.sin(sec * 60) * 3.5 * shakeVal : 0;
    const shakeY = shakeVal > 0 ? Math.cos(sec * 50) * 2 * shakeVal : 0;

    ctx.save();
    ctx.translate(x + shakeX, GROUND_Y + shakeY);

    // ==========================================
    // LỚP 1: BÁNH SAU PHÍA XA (bánh bên kia robot)
    // ==========================================
    const farX = -32;
    const farY = -23;
    const farR = 19;
    ctx.save();
    ctx.translate(farX, farY);
    ctx.rotate(wheelAngle);

    // Lốp xanh ngọc đậm hơn vì ở xa
    ctx.fillStyle = '#2694ab';
    ctx.strokeStyle = '#0e6f8a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, farR, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Vành trong trắng
    ctx.fillStyle = '#dceef2';
    ctx.beginPath();
    ctx.arc(0, 0, farR * 0.65, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Nan hoa bánh sau xa
    ctx.strokeStyle = '#0e6f8a';
    ctx.lineWidth = 2;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(-farR * 0.6, 0);
      ctx.lineTo(farR * 0.6, 0);
      ctx.stroke();
      ctx.rotate(Math.PI / 4);
    }
    ctx.restore();

    // ==========================================
    // LỚP 2: THÙNG CHỞ MẪU (o.bin) - VÁCH SAU
    // ==========================================
    if (opts.bin) {
      // Vách sau của thùng để mẫu cây có thể nằm bên trong
      ctx.fillStyle = '#2ea8c2';
      ctx.strokeStyle = '#1e2a34';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      roundRect(ctx, -66, -100, 44, 24, 3);
      ctx.fill();
      ctx.stroke();
    }

    // ==========================================
    // LỚP 3: MẪU CÂY (o.carry) NẰM TRONG THÙNG / TRÊN NÓC
    // ==========================================
    if (opts.carry) {
      if (opts.bin) {
        // Nằm lọt vào trong thùng chở hàng
        drawSample(ctx, -44, -76, 0.72);
      } else {
        // Đặt ngay ngắn trên nóc thân xe
        drawSample(ctx, -20, -74, 0.75);
      }
    }

    // ==========================================
    // LỚP 4: THÙNG CHỞ MẪU (o.bin) - VÁCH TRƯỚC
    // ==========================================
    if (opts.bin) {
      ctx.fillStyle = '#3dc1dc';
      ctx.strokeStyle = '#1e2a34';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      // Vách hộp hở nóc có rãnh khoét phía trước
      ctx.moveTo(-66, -100);
      ctx.lineTo(-66, -76);
      ctx.lineTo(-22, -76);
      ctx.lineTo(-22, -100);
      ctx.lineTo(-28, -100);
      ctx.lineTo(-28, -84);
      ctx.lineTo(-60, -84);
      ctx.lineTo(-60, -100);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Gờ gia cố màu xanh ngọc đậm
      ctx.fillStyle = '#0e6f8a';
      ctx.fillRect(-64, -80, 40, 3.5);
    }

    // ==========================================
    // LỚP 5: CHÂN ĐẾ & KHUNG THÂN ROBOT (Lego WeDo Milo)
    // ==========================================
    // Thân dưới màu xanh ngọc (khối động cơ & thanh Technic)
    ctx.fillStyle = '#3dc1dc';
    ctx.strokeStyle = '#1e2a34';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    roundRect(ctx, -58, -52, 74, 24, 4);
    ctx.fill();
    ctx.stroke();

    // 4 lỗ tròn Lego Technic màu xanh ngọc đậm ở cạnh thân
    for (let i = 0; i < 4; i++) {
      const hx = -48 + i * 16;
      ctx.fillStyle = '#0e6f8a';
      ctx.beginPath();
      ctx.arc(hx, -40, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#1e2a34';
      ctx.beginPath();
      ctx.arc(hx, -40, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Thanh nối màu trắng phía trước hướng về bánh bi
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#1e2a34';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    roundRect(ctx, 10, -42, 38, 16, 3);
    ctx.fill();
    ctx.stroke();

    // Lỗ chốt kết nối phía trước
    ctx.fillStyle = '#0e6f8a';
    ctx.beginPath();
    ctx.arc(22, -34, 3.5, 0, Math.PI * 2);
    ctx.arc(38, -34, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // ==========================================
    // LỚP 6: BÁNH BI TRẮNG PHÍA TRƯỚC (Caster Ball)
    // ==========================================
    const casterX = 46;
    const casterR = 9;
    const casterY = -casterR; // y = -9, chạm đất ở y = 0

    // Giá đỡ bánh bi Lego trắng
    ctx.fillStyle = '#e0e6ed';
    ctx.strokeStyle = '#1e2a34';
    ctx.lineWidth = 2;
    ctx.beginPath();
    roundRect(ctx, casterX - 9, -26, 18, 12, [3, 3, 0, 0]);
    ctx.fill();
    ctx.stroke();

    // Quả cầu bánh bi màu trắng
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(casterX, casterY, casterR, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Khe dọc ở quả cầu bánh bi giống linh kiện Lego thật
    ctx.strokeStyle = '#cfd8dc';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(casterX, casterY - casterR + 2);
    ctx.lineTo(casterX, casterY + casterR - 2);
    ctx.stroke();

    // ==========================================
    // LỚP 7: KHỐI THÂN TRÊN MÀU TRẮNG (Bộ não Smart Hub)
    // ==========================================
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#1e2a34';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    roundRect(ctx, -56, -76, 72, 25, 4);
    ctx.fill();
    ctx.stroke();

    // Nút nguồn / đèn LED trạng thái WeDo hình bầu dục trên nóc
    ctx.fillStyle = '#3dc1dc';
    ctx.strokeStyle = '#0e6f8a';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    roundRect(ctx, -16, -75, 20, 6, 3);
    ctx.fill();
    ctx.stroke();

    // Cổng cắm dây phía sau
    ctx.fillStyle = '#1e2a34';
    ctx.fillRect(-52, -68, 6, 10);

    // ==========================================
    // LỚP 8: CỔ NỐI CẢM BIẾN (Thanh cong trắng Technic nối thân với đầu)
    // ==========================================
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#1e2a34';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    // Bắt đầu từ chân đế phía trước trên khung bánh bi
    ctx.moveTo(17, -34);
    ctx.lineTo(17, -58);
    // Uốn cong ra phía trước về phía đầu cảm biến
    ctx.quadraticCurveTo(17, -66, 24, -66);
    ctx.lineTo(34, -66);
    // Mép nối gắn sâu vào sau đầu cảm biến
    ctx.lineTo(34, -54);
    ctx.lineTo(27, -54);
    // Góc lượn trong của thanh cong
    ctx.quadraticCurveTo(27, -50, 27, -46);
    ctx.lineTo(27, -34);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Các lỗ chốt tròn Lego Technic trên thanh cong
    const beamHoles = [
      { x: 22, y: -47, r: 2.8 },
      { x: 22, y: -60, r: 2.8 }
    ];
    for (const h of beamHoles) {
      ctx.fillStyle = '#b0bec5';
      ctx.beginPath();
      ctx.arc(h.x, h.y, h.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#1e2a34';
      ctx.beginPath();
      ctx.arc(h.x, h.y, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Chốt đen kết nối thanh cong với khung thân xe ở dưới
    ctx.fillStyle = '#1e2a34';
    ctx.beginPath();
    ctx.arc(22, -34, 3.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#78909c';
    ctx.beginPath();
    ctx.arc(22, -34, 1.5, 0, Math.PI * 2);
    ctx.fill();

    // ==========================================
    // LỚP 9: PHỤ KIỆN TẤM PIN MẶT TRỜI (o.solar)
    // ==========================================
    if (opts.solar) {
      // 2 chân kim loại đỡ tấm pin trên nóc
      ctx.strokeStyle = '#1e2a34';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(-42, -76);
      ctx.lineTo(-42, -88);
      ctx.moveTo(-10, -76);
      ctx.lineTo(-10, -88);
      ctx.stroke();

      // Tấm pin màu xanh dương đậm
      ctx.fillStyle = '#1f4aa6';
      ctx.strokeStyle = '#0e2a6a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      roundRect(ctx, -56, -96, 54, 10, 2);
      ctx.fill();
      ctx.stroke();

      // Viền ngoài đậm
      ctx.strokeStyle = '#1e2a34';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(-56, -96, 54, 10);

      // Kẻ ô pin mặt trời
      ctx.strokeStyle = '#9ec1ff';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      for (let px = -44; px <= -14; px += 12) {
        ctx.moveTo(px, -96);
        ctx.lineTo(px, -86);
      }
      ctx.moveTo(-56, -91);
      ctx.lineTo(-2, -91);
      ctx.stroke();
    }

    // ==========================================
    // LỚP 10: ĐẦU CẢM BIẾN SIÊU ÂM (Milo Head)
    // ==========================================
    const headX = 30;
    const headY = -70;
    const headW = 46;
    const headH = 30;

    // Vỏ đầu cảm biến màu trắng
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#1e2a34';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    roundRect(ctx, headX, headY, headW, headH, 6);
    ctx.fill();
    ctx.stroke();

    // Chốt đen kết nối thanh cong với đầu cảm biến
    ctx.fillStyle = '#1e2a34';
    ctx.beginPath();
    ctx.arc(headX, -60, 3.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#78909c';
    ctx.beginPath();
    ctx.arc(headX, -60, 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Mặt cảm biến phía trước màu xanh ngọc
    ctx.fillStyle = '#3dc1dc';
    ctx.strokeStyle = '#0e6f8a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    roundRect(ctx, headX + 4, headY + 4, headW - 8, headH - 8, 4);
    ctx.fill();
    ctx.stroke();

    // Hai "mắt" tròn cảm biến siêu âm
    const eyes = [headX + 13, headX + 33];
    const eyeY = headY + 15;
    const eyeR = 7;

    for (const ex of eyes) {
      if (eyesLit) {
        // Cảm biến thấy vật cản: mắt phát sáng vàng nhẹ
        ctx.save();
        const eyeGlow = ctx.createRadialGradient(ex, eyeY, 2, ex, eyeY, eyeR * 1.8);
        eyeGlow.addColorStop(0, '#fff4b8');
        eyeGlow.addColorStop(0.5, '#ffd23f');
        eyeGlow.addColorStop(1, 'rgba(255, 210, 63, 0)');
        ctx.fillStyle = eyeGlow;
        ctx.beginPath();
        ctx.arc(ex, eyeY, eyeR * 1.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Tròng mắt vàng tươi
        ctx.fillStyle = '#ffd23f';
        ctx.strokeStyle = '#1e2a34';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.arc(ex, eyeY, eyeR, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Vòng tròn bên trong mắt
        ctx.strokeStyle = '#f5a623';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.arc(ex, eyeY, eyeR * 0.55, 0, Math.PI * 2);
        ctx.stroke();

        // Chấm phản chiếu ánh sáng
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(ex - 2, eyeY - 2.5, 1.8, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Mắt cảm biến bình thường: màu xám tròn với gờ kim loại
        ctx.fillStyle = '#8a96a3';
        ctx.strokeStyle = '#1e2a34';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.arc(ex, eyeY, eyeR, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Vành trong kim loại
        ctx.fillStyle = '#cfd8dc';
        ctx.beginPath();
        ctx.arc(ex, eyeY, eyeR * 0.55, 0, Math.PI * 2);
        ctx.fill();

        // Tâm cảm biến
        ctx.fillStyle = '#455a64';
        ctx.beginPath();
        ctx.arc(ex, eyeY, 1.8, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // ==========================================
    // LỚP 11: 2 RÂU ĐEN ĐẦU VÀNG TRÊN ĐẦU CẢM BIẾN
    // ==========================================
    // Râu 1
    ctx.strokeStyle = '#1e2a34';
    ctx.lineWidth = 3.2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(headX + 10, headY);
    ctx.lineTo(headX + 4, headY - 20);
    ctx.stroke();

    // Râu 2
    ctx.beginPath();
    ctx.moveTo(headX + 22, headY);
    ctx.lineTo(headX + 16, headY - 20);
    ctx.stroke();
    ctx.lineCap = 'butt';

    // Hai viên bi vàng ở đầu râu
    ctx.fillStyle = '#ffd23f';
    ctx.strokeStyle = '#1e2a34';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(headX + 4, headY - 20, 4.5, 0, Math.PI * 2);
    ctx.arc(headX + 16, headY - 20, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Chấm phản quang trên bi vàng
    ctx.fillStyle = '#fff9d6';
    ctx.beginPath();
    ctx.arc(headX + 3, headY - 21.5, 1.5, 0, Math.PI * 2);
    ctx.arc(headX + 15, headY - 21.5, 1.5, 0, Math.PI * 2);
    ctx.fill();

    // ==========================================
    // LỚP 12: PHỤ KIỆN ĂNG-TEN DÀI + ĐÈN ĐỎ NHẤP NHÁY (o.antenna)
    // ==========================================
    if (opts.antenna) {
      const antBaseX = headX + 33;
      const antBaseY = headY;
      const antTipX = headX + 33;
      const antTipY = headY - 48;

      // Cột ăng-ten dài thẳng đứng
      ctx.strokeStyle = '#1e2a34';
      ctx.lineWidth = 2.8;
      ctx.beginPath();
      ctx.moveTo(antBaseX, antBaseY);
      ctx.lineTo(antTipX, antTipY);
      ctx.stroke();

      // Đèn đỏ nhấp nháy theo o.t
      const isRedLit = Math.sin(sec * 7) > 0;
      if (isRedLit) {
        // Quầng phát sáng đỏ
        const redGlow = ctx.createRadialGradient(antTipX, antTipY, 2, antTipX, antTipY, 16);
        redGlow.addColorStop(0, 'rgba(255, 60, 60, 0.6)');
        redGlow.addColorStop(0.5, 'rgba(255, 30, 30, 0.25)');
        redGlow.addColorStop(1, 'rgba(255, 0, 0, 0)');
        ctx.fillStyle = redGlow;
        ctx.beginPath();
        ctx.arc(antTipX, antTipY, 16, 0, Math.PI * 2);
        ctx.fill();

        // Bóng đèn sáng rực
        ctx.fillStyle = '#ff2b2b';
        ctx.strokeStyle = '#1e2a34';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(antTipX, antTipY, 6.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Vòng sóng vô tuyến phát ra
        ctx.strokeStyle = 'rgba(229, 57, 53, 0.7)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(antTipX + 8, antTipY, 8, -Math.PI * 0.35, Math.PI * 0.35);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(antTipX + 13, antTipY, 13, -Math.PI * 0.35, Math.PI * 0.35);
        ctx.stroke();
      } else {
        // Đèn lúc tối
        ctx.fillStyle = '#7a1d1a';
        ctx.strokeStyle = '#1e2a34';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(antTipX, antTipY, 6.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
    }

    // ==========================================
    // LỚP 13: PHỤ KIỆN CÁNH TAY GẮP (o.arm)
    // ==========================================
    if (opts.arm) {
      // Khớp gắn ở phía trước bánh bi
      ctx.fillStyle = '#78909c';
      ctx.strokeStyle = '#1e2a34';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.arc(44, -32, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Cánh tay thép chìa ra phía trước dưới cảm biến
      ctx.fillStyle = '#b0bec5';
      ctx.beginPath();
      roundRect(ctx, 46, -35, 34, 7, 2);
      ctx.fill();
      ctx.stroke();

      // Khớp cổ tay kẹp
      ctx.fillStyle = '#37474f';
      ctx.beginPath();
      ctx.arc(80, -31.5, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Kẹp 2 ngón mở ra gắp
      ctx.strokeStyle = '#1e2a34';
      ctx.lineWidth = 2.8;
      ctx.lineCap = 'round';

      // Ngón kẹp trên
      ctx.beginPath();
      ctx.moveTo(80, -34);
      ctx.lineTo(92, -40);
      ctx.lineTo(98, -34);
      ctx.stroke();

      // Ngón kẹp dưới
      ctx.beginPath();
      ctx.moveTo(80, -29);
      ctx.lineTo(92, -23);
      ctx.lineTo(98, -29);
      ctx.stroke();

      ctx.lineCap = 'butt';
    }

    // ==========================================
    // LỚP 14: BÁNH TRƯỚC PHÍA GẦN (Bánh xe chính)
    // ==========================================
    const nearX = -20;
    const nearY = -22;
    const nearR = 22; // chạm đất ở y = 0
    ctx.save();
    ctx.translate(nearX, nearY);
    ctx.rotate(wheelAngle);

    // Lốp xe cao su màu xanh ngọc tươi
    ctx.fillStyle = '#3dc1dc';
    ctx.strokeStyle = '#1e2a34';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, 0, nearR, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Rãnh gai trên lốp
    ctx.strokeStyle = '#0e6f8a';
    ctx.lineWidth = 2;
    for (let i = 0; i < 8; i++) {
      ctx.beginPath();
      ctx.moveTo(nearR * 0.85, 0);
      ctx.lineTo(nearR, 0);
      ctx.stroke();
      ctx.rotate(Math.PI / 4);
    }

    // Vành trong màu trắng
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#1e2a34';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, nearR * 0.68, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Nan hoa chữ thập quay theo góc xoay bánh
    ctx.strokeStyle = '#0e6f8a';
    ctx.lineWidth = 3;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(-nearR * 0.65, 0);
      ctx.lineTo(nearR * 0.65, 0);
      ctx.stroke();
      ctx.rotate(Math.PI / 4);
    }

    // Trục trung tâm màu xanh ngọc
    ctx.fillStyle = '#3dc1dc';
    ctx.strokeStyle = '#1e2a34';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 5.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.restore();

    ctx.restore();
  }

  // 7. PICS: 4 chuỗi SVG viewBox="0 0 64 48" aria-hidden="true" cho 4 gói sáng tạo
  const PICS = {
    // Thùng chở mẫu: robot nhỏ có thùng chở cây phía sau
    bin: '<svg viewBox="0 0 64 48" aria-hidden="true">' +
      '<g fill="#3dc1dc" stroke="#1e2a34" stroke-width="1.8">' +
      '<circle cx="20" cy="40" r="5.5"/>' +
      '<circle cx="42" cy="40" r="5.5"/>' +
      '</g>' +
      '<rect x="14" y="24" width="34" height="13" rx="3" fill="#ffffff" stroke="#1e2a34" stroke-width="1.8"/>' +
      '<rect x="14" y="32" width="34" height="5" fill="#3dc1dc" stroke="#0e6f8a" stroke-width="1.2"/>' +
      '<rect x="8" y="14" width="16" height="14" rx="2" fill="#3dc1dc" stroke="#1e2a34" stroke-width="1.8"/>' +
      '<path d="M12 14v-5c0-2 2-4 4-4s4 2 4 4v5" fill="#4caf50" stroke="#1e2a34" stroke-width="1.4"/>' +
      '<circle cx="16" cy="6" r="2.5" fill="#81c784"/>' +
      '<rect x="36" y="14" width="16" height="11" rx="3" fill="#ffffff" stroke="#1e2a34" stroke-width="1.6"/>' +
      '<circle cx="42" cy="19" r="2.5" fill="#ffd23f" stroke="#1e2a34" stroke-width="1.2"/>' +
      '<circle cx="48" cy="19" r="2.5" fill="#ffd23f" stroke="#1e2a34" stroke-width="1.2"/>' +
      '</svg>',

    // Ăng-ten và đèn: robot nhỏ có cột ăng-ten cao và đèn đỏ nhấp nháy phát sóng
    antenna: '<svg viewBox="0 0 64 48" aria-hidden="true">' +
      '<g fill="#3dc1dc" stroke="#1e2a34" stroke-width="1.8">' +
      '<circle cx="20" cy="40" r="5.5"/>' +
      '<circle cx="42" cy="40" r="5.5"/>' +
      '</g>' +
      '<rect x="14" y="24" width="34" height="13" rx="3" fill="#ffffff" stroke="#1e2a34" stroke-width="1.8"/>' +
      '<rect x="14" y="32" width="34" height="5" fill="#3dc1dc" stroke="#0e6f8a" stroke-width="1.2"/>' +
      '<rect x="36" y="15" width="16" height="11" rx="3" fill="#ffffff" stroke="#1e2a34" stroke-width="1.6"/>' +
      '<circle cx="42" cy="20" r="2.5" fill="#8a96a3" stroke="#1e2a34" stroke-width="1.2"/>' +
      '<circle cx="48" cy="20" r="2.5" fill="#8a96a3" stroke="#1e2a34" stroke-width="1.2"/>' +
      '<path d="M44 15V6" stroke="#1e2a34" stroke-width="2.2" stroke-linecap="round"/>' +
      '<circle cx="44" cy="6" r="3.5" fill="#e53935" stroke="#1e2a34" stroke-width="1.5"/>' +
      '<path d="M50 4a6 6 0 0 1 5 5M38 4a6 6 0 0 0-5 5" stroke="#e53935" stroke-width="1.8" fill="none" stroke-linecap="round"/>' +
      '</svg>',

    // Pin mặt trời: robot nhỏ có tấm pin xanh dương kẻ ô trên nóc
    solar: '<svg viewBox="0 0 64 48" aria-hidden="true">' +
      '<g fill="#3dc1dc" stroke="#1e2a34" stroke-width="1.8">' +
      '<circle cx="20" cy="40" r="5.5"/>' +
      '<circle cx="42" cy="40" r="5.5"/>' +
      '</g>' +
      '<rect x="14" y="24" width="34" height="13" rx="3" fill="#ffffff" stroke="#1e2a34" stroke-width="1.8"/>' +
      '<rect x="14" y="32" width="34" height="5" fill="#3dc1dc" stroke="#0e6f8a" stroke-width="1.2"/>' +
      '<path d="M22 24v-4M34 24v-4" stroke="#1e2a34" stroke-width="1.8"/>' +
      '<rect x="12" y="11" width="32" height="9" rx="1.5" fill="#1f4aa6" stroke="#1e2a34" stroke-width="1.6"/>' +
      '<path d="M20 11v9M28 11v9M36 11v9M12 15.5h32" stroke="#9ec1ff" stroke-width="1"/>' +
      '<rect x="36" y="20" width="16" height="10" rx="3" fill="#ffffff" stroke="#1e2a34" stroke-width="1.5"/>' +
      '<circle cx="42" cy="25" r="2.2" fill="#8a96a3" stroke="#1e2a34" stroke-width="1.2"/>' +
      '<circle cx="48" cy="25" r="2.2" fill="#8a96a3" stroke="#1e2a34" stroke-width="1.2"/>' +
      '</svg>',

    // Cánh tay gắp: robot nhỏ có tay kẹp chìa ra phía trước
    arm: '<svg viewBox="0 0 64 48" aria-hidden="true">' +
      '<g fill="#3dc1dc" stroke="#1e2a34" stroke-width="1.8">' +
      '<circle cx="16" cy="40" r="5.5"/>' +
      '<circle cx="36" cy="40" r="5.5"/>' +
      '</g>' +
      '<rect x="10" y="24" width="32" height="13" rx="3" fill="#ffffff" stroke="#1e2a34" stroke-width="1.8"/>' +
      '<rect x="10" y="32" width="32" height="5" fill="#3dc1dc" stroke="#0e6f8a" stroke-width="1.2"/>' +
      '<rect x="30" y="15" width="16" height="11" rx="3" fill="#ffffff" stroke="#1e2a34" stroke-width="1.6"/>' +
      '<circle cx="36" cy="20" r="2.5" fill="#ffd23f" stroke="#1e2a34" stroke-width="1.2"/>' +
      '<circle cx="42" cy="20" r="2.5" fill="#ffd23f" stroke="#1e2a34" stroke-width="1.2"/>' +
      '<path d="M38 31h14" stroke="#9aa7b4" stroke-width="3" stroke-linecap="round"/>' +
      '<circle cx="52" cy="31" r="2" fill="#1e2a34"/>' +
      '<path d="M52 29l6-4h3M52 33l6 4h3" stroke="#1e2a34" stroke-width="2" fill="none" stroke-linecap="round"/>' +
      '</svg>'
  };

  // Xuất giao diện toàn cục
  window.MarsArt = {
    W,
    H,
    GROUND_Y,
    drawBackground,
    drawStation,
    drawRover,
    drawSample,
    drawHand,
    drawRock,
    PICS
  };
})();
