// Tranh vẽ cảnh tuyết rơi và xe robot dọn tuyết cho Bài 13 (chặng ③ và xưởng sáng tạo).
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

  // Dữ liệu sỏi băng và vết tuyết cố định trên mặt đất (không dùng Math.random để tránh chớp giật)
  const SNOW_GRAINS = [
    { x: 35, y: 442, rx: 3.5, ry: 2, c: '#c5dcf0' },
    { x: 72, y: 478, rx: 4, ry: 2.2, c: '#b0cee8' },
    { x: 118, y: 446, rx: 3, ry: 1.8, c: '#d8ebf8' },
    { x: 165, y: 495, rx: 5, ry: 2.5, c: '#a4c6e2' },
    { x: 210, y: 439, rx: 3.2, ry: 1.9, c: '#c5dcf0' },
    { x: 255, y: 468, rx: 4.2, ry: 2.2, c: '#b0cee8' },
    { x: 305, y: 512, rx: 3.8, ry: 2.0, c: '#a4c6e2' },
    { x: 350, y: 445, rx: 2.8, ry: 1.7, c: '#d8ebf8' },
    { x: 395, y: 486, rx: 4.5, ry: 2.4, c: '#c5dcf0' },
    { x: 440, y: 452, rx: 3.2, ry: 2.0, c: '#b0cee8' },
    { x: 490, y: 520, rx: 5.2, ry: 2.8, c: '#a4c6e2' },
    { x: 535, y: 443, rx: 3.0, ry: 1.8, c: '#c5dcf0' },
    { x: 580, y: 475, rx: 4.0, ry: 2.2, c: '#d8ebf8' },
    { x: 625, y: 502, rx: 3.6, ry: 2.0, c: '#b0cee8' },
    { x: 670, y: 446, rx: 2.6, ry: 1.6, c: '#c5dcf0' },
    { x: 715, y: 482, rx: 4.4, ry: 2.3, c: '#a4c6e2' },
    { x: 760, y: 441, rx: 3.1, ry: 1.8, c: '#d8ebf8' },
    { x: 805, y: 515, rx: 4.8, ry: 2.6, c: '#b0cee8' },
    { x: 845, y: 460, rx: 3.4, ry: 2.0, c: '#c5dcf0' },
    { x: 885, y: 490, rx: 4.2, ry: 2.4, c: '#a4c6e2' }
  ];

  // Bông tuyết rơi tuần hoàn theo thời gian t (80 hạt được tính toán tọa độ xác định)
  const SNOWFLAKES = [];
  for (let i = 0; i < 80; i++) {
    SNOWFLAKES.push({
      x0: (i * 73 + 19) % W,
      y0: (i * 37 + 11) % (GROUND_Y + 40),
      sp: 24 + (i % 7) * 9,       // tốc độ rơi 24..78 px/s
      r: 1.5 + (i % 5) * 0.6,     // bán kính 1.5..3.9 px
      amp: 8 + (i % 6) * 3,       // biên độ lắc lư ngang
      freq: 1.2 + (i % 4) * 0.5,  // tần số lắc
      star: i % 8 === 0           // một số bông tuyết to vẽ hình cánh sao 6 cánh
    });
  }

  // Dãy cây thông mùa đông trên nền (tọa độ x, y, chiều cao, tán tuyết)
  const PINE_TREES = [
    { x: 90,  y: GROUND_Y, h: 95,  w: 48, far: true },
    { x: 180, y: GROUND_Y, h: 125, w: 62, far: false },
    { x: 265, y: GROUND_Y, h: 85,  w: 44, far: true },
    { x: 420, y: GROUND_Y, h: 110, w: 56, far: false },
    { x: 505, y: GROUND_Y, h: 78,  w: 40, far: true },
    { x: 610, y: GROUND_Y, h: 120, w: 60, far: false },
    { x: 740, y: GROUND_Y, h: 88,  w: 45, far: true },
    { x: 825, y: GROUND_Y, h: 130, w: 65, far: false }
  ];

  // Vẽ một cây thông mùa đông phủ tuyết
  function drawPineTree(ctx, x, y, w, h, isFar) {
    ctx.save();
    ctx.translate(x, y);

    // Thân cây gỗ nâu
    const trunkW = w * 0.22;
    const trunkH = h * 0.22;
    ctx.fillStyle = isFar ? '#6a4a35' : '#543725';
    ctx.strokeStyle = '#1e2a34';
    ctx.lineWidth = isFar ? 1.5 : 2;
    ctx.fillRect(-trunkW / 2, -trunkH, trunkW, trunkH);
    ctx.strokeRect(-trunkW / 2, -trunkH, trunkW, trunkH);

    // 3 tầng tán thông màu xanh lá thông
    const foliageColor = isFar ? '#2e614a' : '#1e4f39';
    const snowColor = isFar ? '#d4e6f4' : '#ffffff';
    const snowShadow = isFar ? '#b5d0e6' : '#d2e4f2';

    const levels = 3;
    const baseW = w;
    const tierH = (h - trunkH) / (levels * 0.72);

    for (let i = 0; i < levels; i++) {
      const tierY = -trunkH - i * tierH * 0.65;
      const curW = baseW * (1 - i * 0.22);
      const curH = tierH * (1 - i * 0.08);

      // Tán lá xanh hình tam giác có răng cưa mềm
      ctx.fillStyle = foliageColor;
      ctx.strokeStyle = '#1e2a34';
      ctx.lineWidth = isFar ? 1.8 : 2.4;
      ctx.beginPath();
      ctx.moveTo(-curW / 2, tierY);
      ctx.lineTo(0, tierY - curH);
      ctx.lineTo(curW / 2, tierY);
      ctx.quadraticCurveTo(curW * 0.25, tierY - curH * 0.15, 0, tierY - curH * 0.08);
      ctx.quadraticCurveTo(-curW * 0.25, tierY - curH * 0.15, -curW / 2, tierY);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Mũ tuyết trắng dày trùm lên tán lá
      ctx.fillStyle = snowColor;
      ctx.beginPath();
      ctx.moveTo(-curW * 0.42, tierY - curH * 0.25);
      ctx.lineTo(0, tierY - curH);
      ctx.lineTo(curW * 0.42, tierY - curH * 0.25);
      ctx.quadraticCurveTo(curW * 0.2, tierY - curH * 0.1, 0, tierY - curH * 0.18);
      ctx.quadraticCurveTo(-curW * 0.2, tierY - curH * 0.1, -curW * 0.42, tierY - curH * 0.25);
      ctx.closePath();
      ctx.fill();

      // Đốm tuyết rủ mềm ở mép tán
      ctx.fillStyle = snowShadow;
      for (let j = -2; j <= 2; j++) {
        const sx = j * (curW * 0.18);
        const sy = tierY - curH * 0.08 + Math.abs(j) * 2;
        ctx.beginPath();
        ctx.arc(sx, sy, curW * 0.07, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }

  // Vẽ bông tuyết 6 cánh tinh xảo
  function drawSnowflakeStar(ctx, x, y, r) {
    ctx.save();
    ctx.translate(x, y);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.6;
    ctx.lineCap = 'round';

    for (let a = 0; a < 3; a++) {
      ctx.beginPath();
      ctx.moveTo(0, -r);
      ctx.lineTo(0, r);
      ctx.stroke();

      // Nhánh phụ nhỏ
      ctx.beginPath();
      ctx.moveTo(-r * 0.35, -r * 0.45);
      ctx.lineTo(0, -r * 0.2);
      ctx.lineTo(r * 0.35, -r * 0.45);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(-r * 0.35, r * 0.45);
      ctx.lineTo(0, r * 0.2);
      ctx.lineTo(r * 0.35, r * 0.45);
      ctx.stroke();

      ctx.rotate(Math.PI / 3);
    }
    ctx.restore();
  }

  // 1. Vẽ nền mùa đông: trời xanh tuyết, dãy núi tuyết xa, đồi tuyết, rừng thông, mặt đất tuyết, hạt tuyết rơi
  function drawBackground(ctx, t) {
    const sec = typeof t === 'number' ? t : 0;

    // --- Bầu trời mùa đông êm dịu ---
    const skyGrad = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
    skyGrad.addColorStop(0, '#78aed8');
    skyGrad.addColorStop(0.55, '#a4cceb');
    skyGrad.addColorStop(1, '#dcecf8');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, W, GROUND_Y);

    // --- Mặt trời mùa đông dịu nhẹ phủ quầng sương tuyết ---
    const sunX = 740;
    const sunY = 95;
    const sunGlow = ctx.createRadialGradient(sunX, sunY, 8, sunX, sunY, 55);
    sunGlow.addColorStop(0, 'rgba(255, 253, 240, 0.7)');
    sunGlow.addColorStop(0.4, 'rgba(245, 248, 255, 0.35)');
    sunGlow.addColorStop(1, 'rgba(220, 235, 248, 0)');
    ctx.fillStyle = sunGlow;
    ctx.beginPath();
    ctx.arc(sunX, sunY, 55, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#fffef4';
    ctx.beginPath();
    ctx.arc(sunX, sunY, 18, 0, Math.PI * 2);
    ctx.fill();

    // --- Mây mùa đông xốp mềm lơ lửng trôi chậm ---
    const clouds = [
      { x0: 120, y: 70, w: 90, h: 32, sp: 8 },
      { x0: 360, y: 110, w: 120, h: 38, sp: 6 },
      { x0: 640, y: 65, w: 105, h: 35, sp: 10 }
    ];
    for (const c of clouds) {
      const cx = ((c.x0 + sec * c.sp) % (W + 200)) - 100;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.beginPath();
      ctx.arc(cx - c.w * 0.25, c.y, c.h * 0.55, 0, Math.PI * 2);
      ctx.arc(cx, c.y - c.h * 0.2, c.h * 0.7, 0, Math.PI * 2);
      ctx.arc(cx + c.w * 0.28, c.y, c.h * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // --- Dãy núi tuyết hùng vĩ xa xa (Alpine snow peaks) ---
    // Núi tầng 1 (rất xa, xanh tím nhạt)
    ctx.fillStyle = '#9cb8d4';
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);
    ctx.lineTo(0, 270);
    ctx.lineTo(130, 160);
    ctx.lineTo(240, 265);
    ctx.lineTo(370, 140);
    ctx.lineTo(500, 270);
    ctx.lineTo(650, 150);
    ctx.lineTo(790, 280);
    ctx.lineTo(900, 195);
    ctx.lineTo(900, GROUND_Y);
    ctx.closePath();
    ctx.fill();

    // Mũ tuyết trắng trên các đỉnh núi xa
    ctx.fillStyle = '#ffffff';
    // Đỉnh 1: (130, 160)
    ctx.beginPath();
    ctx.moveTo(130, 160);
    ctx.lineTo(95, 200);
    ctx.lineTo(125, 195);
    ctx.lineTo(135, 205);
    ctx.lineTo(165, 198);
    ctx.closePath();
    ctx.fill();
    // Đỉnh 2: (370, 140)
    ctx.beginPath();
    ctx.moveTo(370, 140);
    ctx.lineTo(330, 185);
    ctx.lineTo(365, 180);
    ctx.lineTo(380, 192);
    ctx.lineTo(415, 182);
    ctx.closePath();
    ctx.fill();
    // Đỉnh 3: (650, 150)
    ctx.beginPath();
    ctx.moveTo(650, 150);
    ctx.lineTo(610, 195);
    ctx.lineTo(645, 190);
    ctx.lineTo(660, 202);
    ctx.lineTo(695, 192);
    ctx.closePath();
    ctx.fill();

    // --- Đồi tuyết uốn lượn trung cảnh (Rolling snow hills) ---
    ctx.fillStyle = '#b7d4ea';
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);
    ctx.lineTo(0, 340);
    ctx.bezierCurveTo(150, 305, 280, 350, 420, 320);
    ctx.bezierCurveTo(560, 290, 720, 345, 900, 310);
    ctx.lineTo(900, GROUND_Y);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#d5e7f6';
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);
    ctx.lineTo(0, 375);
    ctx.bezierCurveTo(180, 340, 360, 390, 520, 355);
    ctx.bezierCurveTo(680, 320, 780, 385, 900, 345);
    ctx.lineTo(900, GROUND_Y);
    ctx.closePath();
    ctx.fill();

    // --- Vẽ các rặng thông mùa đông phủ tuyết ---
    for (const tree of PINE_TREES) {
      drawPineTree(ctx, tree.x, tree.y, tree.w, tree.h, tree.far);
    }

    // --- Mặt đường và mặt đất tuyết dày (Ground snow cover) ---
    // Lớp tuyết nền từ GROUND_Y tới đáy
    const groundGrad = ctx.createLinearGradient(0, GROUND_Y - 8, 0, H);
    groundGrad.addColorStop(0, '#ffffff');
    groundGrad.addColorStop(0.12, '#eef6fc');
    groundGrad.addColorStop(0.45, '#dbebf7');
    groundGrad.addColorStop(1, '#c2dced');
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, GROUND_Y, W, H - GROUND_Y);

    // Đường gờ tuyết trên bề mặt đất (uốn lượn nhẹ tạo độ sâu)
    ctx.strokeStyle = '#1e2a34';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);
    ctx.bezierCurveTo(220, GROUND_Y - 2, 450, GROUND_Y + 1, 680, GROUND_Y - 2);
    ctx.lineTo(W, GROUND_Y);
    ctx.stroke();

    // Vệt bóng tuyết mềm dưới mép đường
    ctx.fillStyle = '#bdd8ee';
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y + 1);
    ctx.bezierCurveTo(220, GROUND_Y + 3, 450, GROUND_Y + 5, 680, GROUND_Y + 3);
    ctx.lineTo(W, GROUND_Y + 2);
    ctx.lineTo(W, GROUND_Y + 10);
    ctx.bezierCurveTo(680, GROUND_Y + 12, 450, GROUND_Y + 15, 220, GROUND_Y + 11);
    ctx.lineTo(0, GROUND_Y + 10);
    ctx.closePath();
    ctx.fill();

    // Vệt bánh xe / làn dọn tuyết sạch bóng giữa đường
    ctx.fillStyle = '#e8f3fa';
    ctx.fillRect(80, GROUND_Y + 8, W - 100, 18);
    ctx.strokeStyle = '#c5dcee';
    ctx.lineWidth = 1.8;
    ctx.setLineDash([16, 12]);
    ctx.beginPath();
    ctx.moveTo(90, GROUND_Y + 17);
    ctx.lineTo(W - 30, GROUND_Y + 17);
    ctx.stroke();
    ctx.setLineDash([]);

    // Hạt tuyết / mảnh băng sỏi cố định trên mặt đất
    for (const g of SNOW_GRAINS) {
      ctx.fillStyle = g.c;
      ctx.beginPath();
      ctx.ellipse(g.x, g.y, g.rx, g.ry, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // --- Các bông tuyết rơi nhẹ nhàng từ bầu trời ---
    for (const f of SNOWFLAKES) {
      const curY = (f.y0 + sec * f.sp) % (GROUND_Y + 25);
      const sway = Math.sin(sec * f.freq + f.y0 * 0.1) * f.amp;
      let curX = (f.x0 + sway) % W;
      if (curX < 0) curX += W;

      if (f.star) {
        drawSnowflakeStar(ctx, curX, curY, f.r * 2.2);
      } else {
        // Hạt tuyết tròn phát sáng nhẹ
        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.beginPath();
        ctx.arc(curX, curY, f.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // 2. Vẽ Ga-ra / Trạm xuất phát xe dọn tuyết bên trái (Station A / Garage)
  function drawStation(ctx, x, kind) {
    ctx.save();
    ctx.translate(x, GROUND_Y);

    const isGarage = !kind || kind === 'Ga-ra' || kind === 'garage' || kind === 'A';
    const textLabel = kind === 'B' ? 'Điểm B' : 'GA-RA';
    const labelColor = kind === 'B' ? '#ef6c00' : '#0e6f8a';

    // Thềm gạch tuyết của ga-ra
    ctx.fillStyle = '#a8c2d8';
    ctx.strokeStyle = '#1e2a34';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    roundRect(ctx, -55, -8, 110, 8, [0, 0, 3, 3]);
    ctx.fill();
    ctx.stroke();

    // Tường nhà ga-ra gỗ ấm áp phủ tuyết
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#1e2a34';
    ctx.lineWidth = 3;
    ctx.beginPath();
    roundRect(ctx, -48, -100, 96, 92, 4);
    ctx.fill();
    ctx.stroke();

    // Các đường nan gỗ trên tường
    ctx.strokeStyle = '#d7e5ef';
    ctx.lineWidth = 2;
    for (let py = -85; py <= -25; py += 15) {
      ctx.beginPath();
      ctx.moveTo(-45, py);
      ctx.lineTo(45, py);
      ctx.stroke();
    }

    // Cửa cuốn / lối ra vào ga-ra rộng rãi
    ctx.fillStyle = '#2d3f50';
    ctx.strokeStyle = '#1e2a34';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    roundRect(ctx, -34, -75, 68, 67, [4, 4, 0, 0]);
    ctx.fill();
    ctx.stroke();

    // Đèn ấm bên trong ga-ra
    ctx.fillStyle = 'rgba(255, 210, 63, 0.25)';
    ctx.fillRect(-32, -73, 64, 65);

    // Các nan cửa cuốn
    ctx.strokeStyle = '#43576d';
    ctx.lineWidth = 1.8;
    for (let cy = -65; cy <= -15; cy += 10) {
      ctx.beginPath();
      ctx.moveTo(-32, cy);
      ctx.lineTo(32, cy);
      ctx.stroke();
    }

    // Đèn chiếu sáng trên cửa ga-ra
    ctx.fillStyle = '#ffd23f';
    ctx.strokeStyle = '#1e2a34';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, -84, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Mái ngói đỏ dốc tam giác
    ctx.fillStyle = '#e53935';
    ctx.strokeStyle = '#1e2a34';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-58, -100);
    ctx.lineTo(0, -135);
    ctx.lineTo(58, -100);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Lớp tuyết dày trùm lên đỉnh mái đỏ
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#1e2a34';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-62, -98);
    ctx.quadraticCurveTo(-30, -125, 0, -143);
    ctx.quadraticCurveTo(30, -125, 62, -98);
    ctx.lineTo(55, -105);
    ctx.quadraticCurveTo(30, -132, 0, -138);
    ctx.quadraticCurveTo(-30, -132, -55, -105);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Băng tuyết rủ xuống ở mép mái (Icicles)
    ctx.fillStyle = '#dcedf8';
    ctx.strokeStyle = '#1e2a34';
    ctx.lineWidth = 1.5;
    const icicles = [-45, -28, -12, 5, 22, 40];
    for (let idx = 0; idx < icicles.length; idx++) {
      const ix = icicles[idx];
      const ih = 7 + (idx % 3) * 4;
      ctx.beginPath();
      ctx.moveTo(ix - 3, -98);
      ctx.lineTo(ix, -98 + ih);
      ctx.lineTo(ix + 3, -98);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    // Biển tên Trạm / Ga-ra nổi bật dễ đọc cho trẻ
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#1e2a34';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    roundRect(ctx, -42, -125, 84, 22, 5);
    ctx.fill();
    ctx.stroke();

    ctx.font = '700 13px "Be Vietnam Pro", "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = labelColor;
    ctx.fillText(textLabel, 0, -114);

    // Cột cờ nhỏ cắm bên cạnh
    ctx.strokeStyle = '#1e2a34';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(48, -10);
    ctx.lineTo(48, -60);
    ctx.stroke();

    // Lá cờ màu xanh ngọc
    ctx.fillStyle = '#3dc1dc';
    ctx.strokeStyle = '#1e2a34';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(48, -60);
    ctx.lineTo(70, -50);
    ctx.lineTo(48, -40);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }

  // 3. Vẽ đống tuyết trên mặt đất (Snowdrift / Snow pile)
  function drawPile(ctx, x, k) {
    const scale = typeof k === 'number' && k > 0 ? k : 1;
    ctx.save();
    ctx.translate(x, GROUND_Y);
    ctx.scale(scale, scale);

    // Đống tuyết mềm mại gồm 3 gò tuyết bo tròn tự nhiên
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#1e2a34';
    ctx.lineWidth = 2.8;

    ctx.beginPath();
    ctx.moveTo(-42, 0);
    ctx.bezierCurveTo(-46, -22, -26, -38, -8, -36);
    ctx.bezierCurveTo(4, -44, 24, -40, 32, -26);
    ctx.bezierCurveTo(42, -22, 44, -8, 42, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Lớp bóng xanh mát bên dưới đống tuyết
    ctx.fillStyle = '#d2e5f5';
    ctx.beginPath();
    ctx.moveTo(-40, 0);
    ctx.bezierCurveTo(-36, -14, -18, -18, 0, -16);
    ctx.bezierCurveTo(16, -15, 30, -12, 40, 0);
    ctx.closePath();
    ctx.fill();

    // Vài tinh thể tuyết lấp lánh trên đống tuyết
    ctx.fillStyle = '#9dc6e8';
    ctx.beginPath();
    ctx.arc(-16, -26, 2, 0, Math.PI * 2);
    ctx.arc(8, -30, 2.5, 0, Math.PI * 2);
    ctx.arc(22, -18, 1.8, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // 4. Vẽ rào chắn an toàn cuối đường (Snow Wall / Barricade)
  function drawWall(ctx, x) {
    ctx.save();
    ctx.translate(x, GROUND_Y);

    // Đống tuyết ụ dày quanh chân rào chắn
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#1e2a34';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.ellipse(15, 0, 28, 14, 0, Math.PI, 0);
    ctx.fill();
    ctx.stroke();

    // Hai cột trụ rào chắn kim loại màu xám đậm
    ctx.fillStyle = '#576574';
    ctx.strokeStyle = '#1e2a34';
    ctx.lineWidth = 2.5;
    ctx.fillRect(0, -95, 10, 95);
    ctx.strokeRect(0, -95, 10, 95);

    ctx.fillRect(24, -95, 10, 95);
    ctx.strokeRect(24, -95, 10, 95);

    // 2 thanh rào chắn nằm ngang sọc chéo đỏ - trắng phản quang
    const bars = [-82, -48];
    for (const by of bars) {
      ctx.save();
      ctx.beginPath();
      roundRect(ctx, -6, by, 46, 22, 3);
      ctx.clip();

      // Nền trắng
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-6, by, 46, 22);

      // Sọc chéo đỏ tươi
      ctx.fillStyle = '#e53935';
      for (let sx = -20; sx < 55; sx += 14) {
        ctx.beginPath();
        ctx.moveTo(sx, by + 22);
        ctx.lineTo(sx + 10, by);
        ctx.lineTo(sx + 18, by);
        ctx.lineTo(sx + 8, by + 22);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();

      // Viền thanh chắn
      ctx.strokeStyle = '#1e2a34';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      roundRect(ctx, -6, by, 46, 22, 3);
      ctx.stroke();
    }

    // Mũ tuyết đọng trên đầu 2 cột trụ và thanh chắn
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#1e2a34';
    ctx.lineWidth = 2;
    ctx.beginPath();
    roundRect(ctx, -8, -88, 50, 7, 3);
    ctx.fill();
    ctx.stroke();

    // Biển báo tam giác cảnh báo nguy hiểm màu vàng
    ctx.save();
    ctx.translate(17, -112);
    ctx.fillStyle = '#ffd23f';
    ctx.strokeStyle = '#1e2a34';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(0, -18);
    ctx.lineTo(16, 12);
    ctx.lineTo(-16, 12);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Dấu chấm than màu đen trong biển báo
    ctx.fillStyle = '#1e2a34';
    ctx.beginPath();
    ctx.rect(-1.8, -8, 3.6, 11);
    ctx.arc(0, 7.5, 2.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.restore();
  }

  // 5. Vẽ bàn tay xòe đưa trước cảm biến (Hand obstacle)
  function drawHand(ctx, x, y, k) {
    const scale = typeof k === 'number' && k > 0 ? k : 1;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    // Sóng siêu âm phát ra từ cảm biến chạm vào tay (các vòng cung mờ)
    ctx.strokeStyle = 'rgba(61, 193, 220, 0.6)';
    ctx.lineWidth = 2.5;
    for (let r = 24; r <= 48; r += 12) {
      ctx.beginPath();
      ctx.arc(-26, 0, r, -Math.PI * 0.28, Math.PI * 0.28);
      ctx.stroke();
    }

    // Bàn tay hoạt hình thân thiện màu da ấm
    ctx.fillStyle = '#ffd0b0';
    ctx.strokeStyle = '#1e2a34';
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';

    // Cổ tay
    ctx.fillRect(10, -12, 16, 24);
    ctx.strokeRect(10, -12, 16, 24);

    // Lòng bàn tay và 4 ngón tay xòe
    ctx.beginPath();
    ctx.moveTo(10, -15);
    // Ngón trỏ
    ctx.lineTo(-12, -18);
    ctx.arc(-14, -15, 3.5, -Math.PI * 0.5, Math.PI * 0.5, true);
    ctx.lineTo(-2, -9);
    // Ngón giữa
    ctx.lineTo(-18, -8);
    ctx.arc(-20, -5, 3.5, -Math.PI * 0.5, Math.PI * 0.5, true);
    ctx.lineTo(-2, 0);
    // Ngón áp út
    ctx.lineTo(-16, 2);
    ctx.arc(-18, 5, 3.5, -Math.PI * 0.5, Math.PI * 0.5, true);
    ctx.lineTo(-2, 9);
    // Ngón út
    ctx.lineTo(-10, 11);
    ctx.arc(-12, 14, 3.5, -Math.PI * 0.5, Math.PI * 0.5, true);
    ctx.lineTo(10, 16);
    // Ngón cái hướng lên trên
    ctx.quadraticCurveTo(0, -6, 2, -24);
    ctx.arc(5, -25, 3.5, Math.PI, 0, false);
    ctx.lineTo(10, -15);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Nét chỉ tay mềm
    ctx.strokeStyle = '#e6ab8a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(2, 2, 7, -Math.PI * 0.3, Math.PI * 0.4);
    ctx.stroke();

    ctx.restore();
  }

  // 6. Vẽ người tuyết trang trí (Snowman)
  function drawSnowman(ctx, x, y, k) {
    const scale = typeof k === 'number' && k > 0 ? k : 1;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#1e2a34';
    ctx.lineWidth = 2.4;

    // Quả cầu tuyết thân dưới
    ctx.beginPath();
    ctx.arc(0, -18, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Quả cầu đầu
    ctx.beginPath();
    ctx.arc(0, -44, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Mắt than đen & miệng cười
    ctx.fillStyle = '#1e2a34';
    ctx.beginPath();
    ctx.arc(-4, -47, 1.8, 0, Math.PI * 2);
    ctx.arc(4, -47, 1.8, 0, Math.PI * 2);
    ctx.fill();

    // Mũi cà rốt cam
    ctx.fillStyle = '#ff7043';
    ctx.beginPath();
    ctx.moveTo(0, -43);
    ctx.lineTo(9, -41);
    ctx.lineTo(0, -39);
    ctx.closePath();
    ctx.fill();

    // Khăn quàng đỏ rực rỡ
    ctx.fillStyle = '#e53935';
    ctx.beginPath();
    roundRect(ctx, -12, -36, 24, 7, 3);
    ctx.fill();
    ctx.stroke();

    // Mũ len xanh ngọc
    ctx.fillStyle = '#3dc1dc';
    ctx.beginPath();
    roundRect(ctx, -10, -60, 20, 8, [4, 4, 0, 0]);
    ctx.fill();
    ctx.stroke();
    // Bông tròn trên chóp mũ
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, -62, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }

  // 7. VẼ XE ROBOT DỌN TUYẾT (Snowplow Robot - Lego Alpha 330)
  // Tâm robot tại x, đáy bánh chạm đất ở GROUND_Y = 430. Hướng mặt cảm biến và lưỡi ủi sang PHẢI (+x).
  function drawPlow(ctx, x, o) {
    const opts = o || {};
    const wheelAngle = typeof opts.wheel === 'number' ? opts.wheel : 0;
    const eyesLit = !!opts.eyes;
    const shakeVal = Math.min(1, Math.max(0, typeof opts.shake === 'number' ? opts.shake : 0));
    const sec = typeof opts.t === 'number' ? opts.t : 0;

    // Rung lắc khi va chạm tường hoặc đống tuyết lớn
    const shakeX = shakeVal > 0 ? Math.sin(sec * 60) * 3.5 * shakeVal : 0;
    const shakeY = shakeVal > 0 ? Math.cos(sec * 50) * 2 * shakeVal : 0;

    ctx.save();
    ctx.translate(x + shakeX, GROUND_Y + shakeY);

    // ========================================================
    // LỚP 1: BÁNH SAU PHÍA XA (bánh phía bên kia của thân xe)
    // ========================================================
    const farX = -36;
    const farY = -24;
    const farR = 24;

    ctx.save();
    ctx.translate(farX, farY);
    ctx.rotate(wheelAngle);

    // Lốp xanh ngọc đậm ở xa
    ctx.fillStyle = '#2694ab';
    ctx.strokeStyle = '#0e6f8a';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(0, 0, farR, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Vành trong trắng
    ctx.fillStyle = '#d8eef3';
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

    // ========================================================
    // LỚP 2: GÓI NÂNG CẤP - THÙNG RẢI MUỐI (o.salt) - PHÍA SAU LƯNG XE
    // ========================================================
    if (opts.salt) {
      // Giá đỡ thùng gắn vào đuôi bộ não
      ctx.fillStyle = '#2d3f50';
      ctx.strokeStyle = '#1e2a34';
      ctx.lineWidth = 2.5;
      ctx.fillRect(-72, -56, 18, 8);
      ctx.strokeRect(-72, -56, 18, 8);

      // Thùng phễu đựng muối xanh xám (khung 5x7)
      ctx.fillStyle = '#7fa6c8';
      ctx.strokeStyle = '#1e2a34';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(-84, -94);
      ctx.lineTo(-50, -94);
      ctx.lineTo(-54, -62);
      ctx.lineTo(-72, -48); // đáy phễu rải
      ctx.lineTo(-80, -62);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Nắp thùng mở hé thấy muối trắng lấp lánh bên trong
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#1e2a34';
      ctx.lineWidth = 2;
      ctx.beginPath();
      roundRect(ctx, -82, -92, 30, 10, 3);
      ctx.fill();
      ctx.stroke();

      // Vạch trang trí xanh ngọc trên thân thùng
      ctx.fillStyle = '#3dc1dc';
      ctx.fillRect(-78, -78, 24, 5);

      // Hạt muối trắng đang rải rơi xuống tuyết phía sau xe (tuần hoàn theo t)
      ctx.fillStyle = '#ffffff';
      for (let s = 0; s < 5; s++) {
        const sy = -46 + ((sec * 45 + s * 9) % 44);
        const sx = -72 - (s % 3) * 5;
        ctx.beginPath();
        ctx.arc(sx, sy, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // ========================================================
    // LỚP 3: KHUNG CHASSIS & THÂN DƯỚI (Lego Alpha 330)
    // ========================================================
    // Thân dưới màu xanh ngọc tươi (khối động cơ & thanh dầm)
    ctx.fillStyle = '#3dc1dc';
    ctx.strokeStyle = '#1e2a34';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    roundRect(ctx, -56, -54, 76, 26, 4);
    ctx.fill();
    ctx.stroke();

    // 4 lỗ tròn Lego Technic màu xanh ngọc đậm ở cạnh thân
    for (let i = 0; i < 4; i++) {
      const hx = -45 + i * 16;
      ctx.fillStyle = '#0e6f8a';
      ctx.beginPath();
      ctx.arc(hx, -41, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#1e2a34';
      ctx.beginPath();
      ctx.arc(hx, -41, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Tay đòn xiên màu trắng nối thân với bánh trước / lưỡi ủi
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#1e2a34';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-10, -58);
    ctx.lineTo(36, -34);
    ctx.lineTo(28, -20);
    ctx.lineTo(-18, -44);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Bánh răng truyền động màu đen với chốt chữ thập màu vàng
    ctx.fillStyle = '#2d3842';
    ctx.strokeStyle = '#1e2a34';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(10, -28, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Chốt trục chữ thập màu vàng
    ctx.fillStyle = '#ffd23f';
    ctx.beginPath();
    ctx.rect(7.5, -34, 5, 12);
    ctx.rect(4, -30.5, 12, 5);
    ctx.fill();

    // ========================================================
    // LỚP 4: BÁNH TRƯỚC HỖ TRỢ / BÁNH BI (Front Caster Wheel)
    // ========================================================
    const frontX = 26;
    const frontR = 12;
    const frontY = -frontR; // chạm đất ở y = 0

    ctx.save();
    ctx.translate(frontX, frontY);
    ctx.rotate(wheelAngle * 1.8);

    ctx.fillStyle = '#3dc1dc';
    ctx.strokeStyle = '#1e2a34';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(0, 0, frontR, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Vành trong trắng
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, frontR * 0.65, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Chốt tâm
    ctx.fillStyle = '#1e2a34';
    ctx.beginPath();
    ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // ========================================================
    // LỚP 5: KHỐI THÂN TRÊN MÀU TRẮNG - BỘ NÃO SMART HUB (BE-5158)
    // ========================================================
    // Khối bộ não hình chữ nhật bo góc viền đậm
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#1e2a34';
    ctx.lineWidth = 2.8;
    ctx.beginPath();
    roundRect(ctx, -54, -84, 72, 32, 5);
    ctx.fill();
    ctx.stroke();

    // Dải màu xanh ngọc ở thân bộ não
    ctx.fillStyle = '#3dc1dc';
    ctx.strokeStyle = '#0e6f8a';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    roundRect(ctx, -52, -72, 68, 16, 2);
    ctx.fill();
    ctx.stroke();

    // Ký hiệu 4 cổng cắm M1, M2, P1, P2
    ctx.fillStyle = '#1e2a34';
    for (let c = 0; c < 4; c++) {
      ctx.fillRect(-44 + c * 15, -68, 8, 8);
    }

    // 3 nút bấm cyan đặc trưng trên nóc bộ não
    ctx.fillStyle = '#3dc1dc';
    ctx.strokeStyle = '#0e6f8a';
    ctx.lineWidth = 1.5;
    // Nút 1: '+'
    ctx.beginPath();
    roundRect(ctx, -46, -88, 12, 5, 2);
    ctx.fill();
    ctx.stroke();
    // Nút 2: '-'
    ctx.beginPath();
    roundRect(ctx, -30, -88, 12, 5, 2);
    ctx.fill();
    ctx.stroke();
    // Nút 3: Nguồn / Kết nối Bluetooth
    ctx.beginPath();
    roundRect(ctx, -14, -88, 16, 5, 2);
    ctx.fill();
    ctx.stroke();

    // ========================================================
    // LỚP 6: GÓI NÂNG CẤP - ĐÈN CẢNH BÁO TRÊN NÓC (o.beacon)
    // ========================================================
    if (opts.beacon) {
      const beaconX = -12;
      const beaconY = -88;

      // Cột gắn đèn (trục 7 và khớp nối)
      ctx.fillStyle = '#1e2a34';
      ctx.fillRect(beaconX - 3, beaconY - 14, 6, 14);

      // Chân đế đèn kim loại
      ctx.fillStyle = '#8a97a3';
      ctx.strokeStyle = '#1e2a34';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      roundRect(ctx, beaconX - 7, beaconY - 18, 14, 5, 2);
      ctx.fill();
      ctx.stroke();

      // Đèn cảnh báo màu cam nhấp nháy xoay tròn theo thời gian
      const isBeaconFlash = Math.sin(sec * 10) > 0;
      const beaconColor = isBeaconFlash ? '#ff9800' : '#e65100';
      const beaconGlow = isBeaconFlash ? '#ffd23f' : '#ff9800';

      // Quầng sáng nhấp nháy phát ra xung quanh
      if (isBeaconFlash) {
        ctx.fillStyle = 'rgba(255, 170, 0, 0.35)';
        ctx.beginPath();
        ctx.arc(beaconX, beaconY - 26, 22, 0, Math.PI * 2);
        ctx.fill();

        // Các tia sáng nhấp nháy tỏa ra
        ctx.strokeStyle = '#ff9800';
        ctx.lineWidth = 2.2;
        ctx.lineCap = 'round';
        for (let a = 0; a < 6; a++) {
          const ang = a * (Math.PI / 3) + sec * 4;
          ctx.beginPath();
          ctx.moveTo(beaconX + Math.cos(ang) * 12, (beaconY - 26) + Math.sin(ang) * 12);
          ctx.lineTo(beaconX + Math.cos(ang) * 20, (beaconY - 26) + Math.sin(ang) * 20);
          ctx.stroke();
        }
      }

      // Thân bóng đèn quả chuông tròn màu cam
      ctx.fillStyle = beaconColor;
      ctx.strokeStyle = '#1e2a34';
      ctx.lineWidth = 2;
      ctx.beginPath();
      roundRect(ctx, beaconX - 6, beaconY - 32, 12, 14, 4);
      ctx.fill();
      ctx.stroke();

      // Vệt sáng lóa trên bóng đèn
      ctx.fillStyle = beaconGlow;
      ctx.beginPath();
      ctx.arc(beaconX - 2, beaconY - 27, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // ========================================================
    // LỚP 7: CẢM BIẾN SIÊU ÂM PHÍA TRƯỚC (Ultrasonic Sensor BE-6313)
    // ========================================================
    // Hộp cảm biến màu trắng gắn phía trước thân xe
    const sensorX = 22;
    const sensorY = -66;
    const sensorW = 44;
    const sensorH = 30;

    // Vỏ hộp cảm biến màu trắng
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#1e2a34';
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    roundRect(ctx, sensorX, sensorY, sensorW, sensorH, 4);
    ctx.fill();
    ctx.stroke();

    // Mặt trước cảm biến màu xanh ngọc
    ctx.fillStyle = '#3dc1dc';
    ctx.strokeStyle = '#0e6f8a';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    roundRect(ctx, sensorX + 3, sensorY + 3, sensorW - 6, sensorH - 6, 3);
    ctx.fill();
    ctx.stroke();

    // Hai mắt cảm biến siêu âm tròn
    const eye1X = sensorX + 13;
    const eye2X = sensorX + 31;
    const eyeY = sensorY + 15;
    const eyeR = 7;

    for (const ex of [eye1X, eye2X]) {
      // Vành kim loại ngoài
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#1e2a34';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(ex, eyeY, eyeR, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Tròng mắt cảm biến: sáng vàng ấm khi thấy vật, xám bạc khi bình thường
      if (eyesLit) {
        // Quầng phát sáng vàng khi cảm biến kích hoạt
        const eyeGrad = ctx.createRadialGradient(ex, eyeY, 1, ex, eyeY, eyeR);
        eyeGrad.addColorStop(0, '#ffffff');
        eyeGrad.addColorStop(0.5, '#ffd23f');
        eyeGrad.addColorStop(1, '#ff9800');
        ctx.fillStyle = eyeGrad;
        ctx.beginPath();
        ctx.arc(ex, eyeY, eyeR * 0.75, 0, Math.PI * 2);
        ctx.fill();

        // Đồng tử sáng
        ctx.fillStyle = '#fff9db';
        ctx.beginPath();
        ctx.arc(ex - 1.5, eyeY - 1.5, 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Mắt bạc bình thường
        ctx.fillStyle = '#8a96a3';
        ctx.beginPath();
        ctx.arc(ex, eyeY, eyeR * 0.75, 0, Math.PI * 2);
        ctx.fill();

        // Lỗ thu phát siêu âm đen ở giữa
        ctx.fillStyle = '#1e2a34';
        ctx.beginPath();
        ctx.arc(ex, eyeY, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Tia sáng phát ra từ 2 mắt khi cảm biến "thấy" vật
    if (eyesLit) {
      ctx.strokeStyle = 'rgba(255, 210, 63, 0.75)';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(eye1X + 10, eyeY - 4);
      ctx.lineTo(eye1X + 24, eyeY - 8);
      ctx.moveTo(eye2X + 10, eyeY + 4);
      ctx.lineTo(eye2X + 24, eyeY + 8);
      ctx.stroke();
    }

    // ========================================================
    // LỚP 8: BÁNH SAU PHÍA GẦN (bánh lớn chính bên phía người nhìn)
    // ========================================================
    const nearX = -36;
    const nearY = -24;
    const nearR = 24;

    ctx.save();
    ctx.translate(nearX, nearY);
    ctx.rotate(wheelAngle);

    // Lốp cao su xanh ngọc tươi
    ctx.fillStyle = '#3dc1dc';
    ctx.strokeStyle = '#1e2a34';
    ctx.lineWidth = 2.8;
    ctx.beginPath();
    ctx.arc(0, 0, nearR, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Vành mâm xe màu trắng
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#1e2a34';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, nearR * 0.65, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // 4 nan hoa bánh xe quay theo wheelAngle
    ctx.strokeStyle = '#0e6f8a';
    ctx.lineWidth = 2.4;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(-nearR * 0.6, 0);
      ctx.lineTo(nearR * 0.6, 0);
      ctx.stroke();
      ctx.rotate(Math.PI / 4);
    }

    // Tâm bánh xe màu đen viền vàng
    ctx.fillStyle = '#1e2a34';
    ctx.beginPath();
    ctx.arc(0, 0, 4.5, 0, Math.PI * 2);
    ctx.fill();

    // GÓI NÂNG CẤP: XÍCH BÁNH XE (o.chain) - XÍCH BỌC CHỐNG TRƯỢT
    if (opts.chain) {
      ctx.strokeStyle = '#1e2a34';
      ctx.lineWidth = 3.2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.arc(0, 0, nearR + 3, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Các mắt xích kim loại bọc quanh lốp
      ctx.fillStyle = '#dfe6ec';
      ctx.strokeStyle = '#1e2a34';
      ctx.lineWidth = 1.8;
      for (let c = 0; c < 8; c++) {
        const ang = c * (Math.PI / 4);
        const cx = Math.cos(ang) * nearR;
        const cy = Math.sin(ang) * nearR;
        ctx.beginPath();
        ctx.arc(cx, cy, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
    }
    ctx.restore();

    // ========================================================
    // LỚP 9: LƯỠI GẠT / ỦI TUYẾT PHÍA TRƯỚC (Snowplow Blade)
    // ========================================================
    if (opts.blade) {
      // --- GÓI NÂNG CẤP: LƯỠI ỦI TUYẾT BẢN RỘNG CHỮ V (Heavy-duty V-Plow) ---
      // Thanh nối kim loại chắc chắn từ khung ra lưỡi gạt
      ctx.fillStyle = '#576574';
      ctx.strokeStyle = '#1e2a34';
      ctx.lineWidth = 2.5;
      ctx.fillRect(40, -32, 28, 8);
      ctx.strokeRect(40, -32, 28, 8);

      // Thân lưỡi ủi cong cao bản rộng (màu xanh ngọc + viền kim loại bạc)
      ctx.fillStyle = '#dfe6ec';
      ctx.strokeStyle = '#1e2a34';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(66, -4);
      ctx.lineTo(92, -64);
      ctx.lineTo(108, -64);
      ctx.lineTo(82, -4);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Mặt trong lưỡi gạt màu xanh ngọc
      ctx.fillStyle = '#3dc1dc';
      ctx.beginPath();
      ctx.moveTo(69, -7);
      ctx.lineTo(92, -60);
      ctx.lineTo(102, -60);
      ctx.lineTo(80, -7);
      ctx.closePath();
      ctx.fill();

      // Sọc vằn phản quang an toàn màu vàng đen trên lưỡi ủi
      ctx.fillStyle = '#ffd23f';
      ctx.beginPath();
      ctx.moveTo(76, -18);
      ctx.lineTo(85, -36);
      ctx.lineTo(92, -36);
      ctx.lineTo(83, -18);
      ctx.closePath();
      ctx.fill();

      // Hai cột tiêu góc màu vàng ở mép lưỡi ủi (tăng tầm quan sát)
      ctx.fillStyle = '#ffd23f';
      ctx.strokeStyle = '#1e2a34';
      ctx.lineWidth = 2;
      ctx.beginPath();
      roundRect(ctx, 104, -70, 7, 24, 2);
      ctx.fill();
      ctx.stroke();

      // Lưỡi cắt cao su/thép sắc ở đáy lưỡi cạo sát mặt tuyết
      ctx.fillStyle = '#2d3842';
      ctx.fillRect(64, -5, 20, 4);

    } else {
      // --- LƯỠI GẠT TIÊU CHUẨN CỦA XE (Standard Plow Blade) ---
      // Thanh đòn ngang màu xanh ngọc nối từ khung
      ctx.fillStyle = '#3dc1dc';
      ctx.strokeStyle = '#1e2a34';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(56, -4);
      ctx.lineTo(76, -34);
      ctx.lineTo(84, -34);
      ctx.lineTo(66, -4);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Lưỡi gạt màu bạc sáng
      ctx.fillStyle = '#dfe6ec';
      ctx.strokeStyle = '#1e2a34';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(62, -6);
      ctx.lineTo(76, -30);
      ctx.lineTo(80, -30);
      ctx.lineTo(68, -6);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Hai đầu thanh đứng màu vàng chanh (khớp góc và thanh chặn)
      ctx.fillStyle = '#ffd23f';
      ctx.strokeStyle = '#1e2a34';
      ctx.lineWidth = 2;
      ctx.beginPath();
      roundRect(ctx, 78, -38, 7, 18, 2);
      ctx.fill();
      ctx.stroke();
    }

    ctx.restore();
  }

  // 8. PICS: 4 chuỗi SVG viewBox="0 0 64 48" aria-hidden="true" cho 4 gói sáng tạo
  const PICS = {
    // Gói 1: Lưỡi gạt tuyết (blade) – xe nhỏ có lưỡi gạt chữ V bản rộng phía trước
    blade: '<svg viewBox="0 0 64 48" aria-hidden="true">' +
      '<g fill="#3dc1dc" stroke="#1e2a34" stroke-width="1.8">' +
      '<circle cx="20" cy="38" r="6"/>' +
      '<circle cx="38" cy="38" r="4.5"/>' +
      '</g>' +
      '<rect x="14" y="24" width="28" height="12" rx="3" fill="#ffffff" stroke="#1e2a34" stroke-width="1.8"/>' +
      '<rect x="14" y="30" width="28" height="5" fill="#3dc1dc" stroke="#0e6f8a" stroke-width="1.2"/>' +
      '<rect x="32" y="16" width="14" height="10" rx="2" fill="#ffffff" stroke="#1e2a34" stroke-width="1.6"/>' +
      '<circle cx="36" cy="21" r="2.2" fill="#ffd23f" stroke="#1e2a34" stroke-width="1.2"/>' +
      '<circle cx="42" cy="21" r="2.2" fill="#ffd23f" stroke="#1e2a34" stroke-width="1.2"/>' +
      // Lưỡi gạt to phía trước
      '<path d="M42 38L52 14h6L48 38z" fill="#dfe6ec" stroke="#1e2a34" stroke-width="1.8"/>' +
      '<path d="M45 35L53 16h3L47 35z" fill="#3dc1dc"/>' +
      '<rect x="56" y="12" width="3" height="10" rx="1" fill="#ffd23f" stroke="#1e2a34" stroke-width="1.2"/>' +
      '</svg>',

    // Gói 2: Đèn cảnh báo (beacon) – xe nhỏ có đèn cam nhấp nháy trên nóc
    beacon: '<svg viewBox="0 0 64 48" aria-hidden="true">' +
      '<g fill="#3dc1dc" stroke="#1e2a34" stroke-width="1.8">' +
      '<circle cx="22" cy="38" r="6"/>' +
      '<circle cx="42" cy="38" r="4.5"/>' +
      '</g>' +
      '<rect x="16" y="24" width="30" height="12" rx="3" fill="#ffffff" stroke="#1e2a34" stroke-width="1.8"/>' +
      '<rect x="16" y="30" width="30" height="5" fill="#3dc1dc" stroke="#0e6f8a" stroke-width="1.2"/>' +
      '<rect x="34" y="16" width="14" height="10" rx="2" fill="#ffffff" stroke="#1e2a34" stroke-width="1.6"/>' +
      '<circle cx="38" cy="21" r="2.2" fill="#8a96a3" stroke="#1e2a34" stroke-width="1.2"/>' +
      '<circle cx="44" cy="21" r="2.2" fill="#8a96a3" stroke="#1e2a34" stroke-width="1.2"/>' +
      // Cột đèn và đèn cam nhấp nháy
      '<path d="M26 24V14" stroke="#1e2a34" stroke-width="2.2" stroke-linecap="round"/>' +
      '<rect x="22" y="8" width="8" height="8" rx="2.5" fill="#ff9800" stroke="#1e2a34" stroke-width="1.6"/>' +
      '<path d="M18 6l-3-2M34 6l3-2M26 4V1" stroke="#ff9800" stroke-width="1.8" stroke-linecap="round"/>' +
      // Lưỡi gạt nhỏ
      '<path d="M46 38L52 24h3L49 38z" fill="#dfe6ec" stroke="#1e2a34" stroke-width="1.4"/>' +
      '</svg>',

    // Gói 3: Thùng rải muối (salt) – xe nhỏ có thùng chứa muối phía sau
    salt: '<svg viewBox="0 0 64 48" aria-hidden="true">' +
      '<g fill="#3dc1dc" stroke="#1e2a34" stroke-width="1.8">' +
      '<circle cx="26" cy="38" r="6"/>' +
      '<circle cx="44" cy="38" r="4.5"/>' +
      '</g>' +
      '<rect x="20" y="24" width="28" height="12" rx="3" fill="#ffffff" stroke="#1e2a34" stroke-width="1.8"/>' +
      '<rect x="20" y="30" width="28" height="5" fill="#3dc1dc" stroke="#0e6f8a" stroke-width="1.2"/>' +
      '<rect x="36" y="16" width="14" height="10" rx="2" fill="#ffffff" stroke="#1e2a34" stroke-width="1.6"/>' +
      '<circle cx="40" cy="21" r="2.2" fill="#ffd23f" stroke="#1e2a34" stroke-width="1.2"/>' +
      '<circle cx="46" cy="21" r="2.2" fill="#ffd23f" stroke="#1e2a34" stroke-width="1.2"/>' +
      // Thùng rải muối phía sau
      '<path d="M8 12h14l-3 18h-8z" fill="#7fa6c8" stroke="#1e2a34" stroke-width="1.6"/>' +
      '<rect x="10" y="10" width="10" height="4" rx="1.5" fill="#ffffff" stroke="#1e2a34" stroke-width="1.2"/>' +
      '<path d="M7 36l-2 3M11 37l-1 4M15 36l-1 4" stroke="#ffffff" stroke-width="1.6" stroke-linecap="round"/>' +
      // Lưỡi gạt
      '<path d="M48 38L54 24h3L51 38z" fill="#dfe6ec" stroke="#1e2a34" stroke-width="1.4"/>' +
      '</svg>',

    // Gói 4: Xích bánh xe (chain) – xe nhỏ có xích gai bọc quanh bánh
    chain: '<svg viewBox="0 0 64 48" aria-hidden="true">' +
      '<rect x="16" y="24" width="30" height="12" rx="3" fill="#ffffff" stroke="#1e2a34" stroke-width="1.8"/>' +
      '<rect x="16" y="30" width="30" height="5" fill="#3dc1dc" stroke="#0e6f8a" stroke-width="1.2"/>' +
      '<rect x="34" y="16" width="14" height="10" rx="2" fill="#ffffff" stroke="#1e2a34" stroke-width="1.6"/>' +
      '<circle cx="38" cy="21" r="2.2" fill="#8a96a3" stroke="#1e2a34" stroke-width="1.2"/>' +
      '<circle cx="44" cy="21" r="2.2" fill="#8a96a3" stroke="#1e2a34" stroke-width="1.2"/>' +
      // 2 bánh bọc xích
      '<circle cx="22" cy="38" r="6" fill="#3dc1dc" stroke="#1e2a34" stroke-width="1.8"/>' +
      '<circle cx="22" cy="38" r="8.2" fill="none" stroke="#1e2a34" stroke-width="2" stroke-dasharray="3 3"/>' +
      '<circle cx="42" cy="38" r="4.5" fill="#3dc1dc" stroke="#1e2a34" stroke-width="1.6"/>' +
      '<circle cx="42" cy="38" r="6.6" fill="none" stroke="#1e2a34" stroke-width="1.8" stroke-dasharray="2.5 2.5"/>' +
      // Lưỡi gạt
      '<path d="M46 38L52 24h3L49 38z" fill="#dfe6ec" stroke="#1e2a34" stroke-width="1.4"/>' +
      '</svg>'
  };

  // Xuất giao diện toàn cục window.SnowArt (và alias window.Bai13Art)
  const SnowArt = {
    W,
    H,
    GROUND_Y,
    drawBackground,
    drawStation,
    drawPlow,
    drawRover: drawPlow, // alias tương thích cảnh rover
    drawCar: drawPlow,   // alias tương thích cảnh xe
    drawPile,
    drawWall,
    drawHand,
    drawSnowman,
    drawPineTree,
    PICS
  };

  window.SnowArt = SnowArt;
  window.Bai13Art = SnowArt;
})();
