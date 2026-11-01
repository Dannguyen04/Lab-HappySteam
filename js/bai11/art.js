// Tranh vẽ cảnh dòng sông, cối xoay nước, bể chứa nước và vòng tuần hoàn của nước cho Bài 11 (Nước từ đâu đến).
// Hệ toạ độ logic: W = 900, H = 560, GROUND_Y = 430.
// Phù hợp học sinh lớp 1 (6–7 tuổi): màu tươi sáng, tương phản cao, nét vẽ rõ ràng, không chữ nhỏ trong tranh.
// Không dùng ảnh ngoài, font ngoài, hay Math.random() trong khi vẽ.
(function () {
  'use strict';

  const W = 900;
  const H = 560;
  const GROUND_Y = 430;
  const WATER_Y = 420;

  // Bảng màu chuẩn mô hình ZM Alpha 330 và thiên nhiên sông nước làng quê
  const C = {
    dark: '#1e2a34',
    white: '#ffffff',
    offWhite: '#f4f8fb',
    greyLight: '#cfd8dc',
    greyMid: '#90a4ae',
    greyDark: '#455a64',
    teal: '#3dc1dc',
    tealDark: '#0e6f8a',
    tealLight: '#8ee6f5',
    tealDeep: '#08485e',
    waterDeep: '#0277bd',
    waterMid: '#0288d1',
    waterLight: '#29b6f6',
    waterFoam: 'rgba(255, 255, 255, 0.88)',
    waterShine: '#b3e5fc',
    skyTop: '#4faaf0',
    skyMid: '#81d4fa',
    skyBottom: '#e1f5fe',
    grassLight: '#8cc152',
    grassMid: '#4caf50',
    grassDark: '#2e7d32',
    soilLight: '#a1887f',
    soilMid: '#8d6e63',
    soilDark: '#5d4037',
    sunYellow: '#ffd23f',
    sunWarm: '#ffb300',
    redHeart: '#ff4757',
    roofRed: '#e53935',
    roofDark: '#b71c1c',
    woodBeam: '#bcaaa4',
    woodDark: '#6d4c41'
  };

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

  // Dữ liệu sỏi đá cố định ven bờ sông (không dùng Math.random để tránh chớp giật)
  const PEBBLES = [
    { x: 30, y: 535, rx: 6.5, ry: 3.5, c: '#455a64' },
    { x: 85, y: 542, rx: 5.2, ry: 3.0, c: '#546e7a' },
    { x: 155, y: 538, rx: 7.0, ry: 4.2, c: '#37474f' },
    { x: 230, y: 546, rx: 4.8, ry: 2.8, c: '#546e7a' },
    { x: 310, y: 540, rx: 6.0, ry: 3.6, c: '#455a64' },
    { x: 375, y: 442, rx: 5.5, ry: 3.2, c: '#795548' },
    { x: 445, y: 436, rx: 4.5, ry: 2.6, c: '#8d6e63' },
    { x: 530, y: 440, rx: 6.0, ry: 3.4, c: '#6d4c41' },
    { x: 720, y: 438, rx: 5.2, ry: 3.0, c: '#795548' },
    { x: 840, y: 442, rx: 6.2, ry: 3.6, c: '#8d6e63' }
  ];

  // Dữ liệu cụm cỏ ven bờ suối
  const GRASS_TUFT_X = [340, 390, 460, 520, 680, 740, 810, 870];

  // =========================================================================
  // 1. VẼ NỀN THIÊN NHIÊN (drawBackground)
  // Bầu trời, đồi núi xa, dòng sông bên trái (x: 0..330), bờ đất làng quê bên phải (x: 320..900)
  // =========================================================================
  function drawBackground(ctx, t, weather) {
    const sec = typeof t === 'number' ? t : 0;
    const isRain = weather === 'rain';
    const isCloudy = weather === 'cloudy' || isRain;

    // --- Bầu trời xanh dịu mát ---
    const skyGrad = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
    if (isRain) {
      skyGrad.addColorStop(0, '#546e7a');
      skyGrad.addColorStop(0.6, '#78909c');
      skyGrad.addColorStop(1, '#b0bec5');
    } else if (isCloudy) {
      skyGrad.addColorStop(0, '#64b5f6');
      skyGrad.addColorStop(0.6, '#90caf9');
      skyGrad.addColorStop(1, '#e3f2fd');
    } else {
      skyGrad.addColorStop(0, C.skyTop);
      skyGrad.addColorStop(0.6, C.skyMid);
      skyGrad.addColorStop(1, C.skyBottom);
    }
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, W, H);

    // --- Mặt trời tươi vui chiếu sáng (khi trời không mưa) ---
    if (!isRain) {
      drawSun(ctx, sec);
    }

    // --- Mây trôi lơ lửng mang hơi nước ---
    const c1x = ((sec * 9 + 40) % (W + 220)) - 110;
    const c2x = ((sec * 6 + 420) % (W + 220)) - 110;
    const c3x = ((sec * 11 + 720) % (W + 220)) - 110;
    drawCloud(ctx, c1x, 80, 0.85);
    drawCloud(ctx, c2x, 115, 0.70);
    drawCloud(ctx, c3x, 70, 0.95);

    // --- Dãy núi xanh xa xôi (nguồn nước từ trên núi cao) ---
    ctx.fillStyle = isRain ? '#607d8b' : '#81c784';
    ctx.strokeStyle = C.dark;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(0, 310);
    ctx.bezierCurveTo(120, 260, 240, 290, 380, 250);
    ctx.bezierCurveTo(510, 215, 620, 275, 740, 230);
    ctx.bezierCurveTo(810, 205, 870, 235, W, 220);
    ctx.lineTo(W, GROUND_Y);
    ctx.lineTo(0, GROUND_Y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Tuyết/mây trắng trên đỉnh núi xa
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.beginPath();
    ctx.moveTo(740, 230);
    ctx.lineTo(715, 250);
    ctx.lineTo(765, 250);
    ctx.closePath();
    ctx.fill();

    // --- Đồi trung cảnh (lớp cỏ xanh gần hơn) ---
    ctx.fillStyle = isRain ? '#455a64' : '#66bb6a';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(0, 360);
    ctx.bezierCurveTo(140, 330, 260, 350, 390, 320);
    ctx.bezierCurveTo(530, 290, 660, 345, 780, 310);
    ctx.bezierCurveTo(840, 295, 875, 305, W, 300);
    ctx.lineTo(W, GROUND_Y);
    ctx.lineTo(0, GROUND_Y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Hàng cây xanh mát mẻ phía xa
    const trees = [
      { x: 380, y: 342, r: 16, c: '#388e3c' },
      { x: 410, y: 338, r: 20, c: '#2e7d32' },
      { x: 440, y: 345, r: 15, c: '#43a047' },
      { x: 670, y: 335, r: 18, c: '#388e3c' },
      { x: 700, y: 330, r: 22, c: '#2e7d32' },
      { x: 735, y: 338, r: 17, c: '#43a047' }
    ];
    for (const tr of trees) {
      ctx.fillStyle = tr.c;
      ctx.strokeStyle = C.dark;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(tr.x, tr.y, tr.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    // --- MẶT ĐẤT LÀNG QUÊ (Bên phải từ x = 320 đến W) ---
    const groundGrad = ctx.createLinearGradient(320, GROUND_Y, W, H);
    groundGrad.addColorStop(0, '#8cc152');
    groundGrad.addColorStop(0.35, '#4caf50');
    groundGrad.addColorStop(1, '#2e7d32');
    ctx.fillStyle = groundGrad;
    ctx.beginPath();
    ctx.moveTo(320, GROUND_Y);
    ctx.lineTo(W, GROUND_Y);
    ctx.lineTo(W, H);
    ctx.lineTo(340, H);
    ctx.bezierCurveTo(325, 520, 315, 470, 320, GROUND_Y);
    ctx.closePath();
    ctx.fill();

    // Dải mép bờ đất đậm nét
    ctx.strokeStyle = C.dark;
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(320, GROUND_Y);
    ctx.bezierCurveTo(315, 470, 325, 520, 340, H);
    ctx.stroke();

    // Đường chân trời phía sau làng
    ctx.beginPath();
    ctx.moveTo(320, GROUND_Y);
    ctx.lineTo(W, GROUND_Y);
    ctx.stroke();

    // Bụi cỏ nhỏ ven bờ
    ctx.strokeStyle = '#2e7d32';
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    for (const gx of GRASS_TUFT_X) {
      ctx.beginPath();
      ctx.moveTo(gx, GROUND_Y - 2);
      ctx.lineTo(gx - 4, GROUND_Y - 11);
      ctx.moveTo(gx, GROUND_Y - 2);
      ctx.lineTo(gx, GROUND_Y - 14);
      ctx.moveTo(gx, GROUND_Y - 2);
      ctx.lineTo(gx + 4, GROUND_Y - 10);
      ctx.stroke();
    }
    ctx.lineCap = 'butt';

    // Bông hoa dại xinh xắn quanh bờ đất làng
    const flowers = [
      { x: 360, y: GROUND_Y + 12, c: '#ffd23f' },
      { x: 480, y: GROUND_Y + 10, c: '#ff4757' },
      { x: 690, y: GROUND_Y + 14, c: '#ffffff' },
      { x: 820, y: GROUND_Y + 10, c: '#ffd23f' }
    ];
    for (const fl of flowers) {
      ctx.fillStyle = fl.c;
      ctx.beginPath();
      ctx.arc(fl.x, fl.y, 4.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = C.dark;
      ctx.beginPath();
      ctx.arc(fl.x, fl.y, 1.6, 0, Math.PI * 2);
      ctx.fill();
    }

    // --- DÒNG SÔNG NƯỚC CHẢY (Bên trái từ x = 0 đến x = 330) ---
    drawStream(ctx, sec, isRain ? 1.5 : 1.0);

    // Sỏi đá cố định
    for (const p of PEBBLES) {
      ctx.fillStyle = p.c;
      ctx.strokeStyle = C.dark;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.ellipse(p.x, p.y, p.rx, p.ry, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.beginPath();
      ctx.ellipse(p.x - p.rx * 0.25, p.y - p.ry * 0.25, p.rx * 0.4, p.ry * 0.35, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Nếu trời mưa
    if (isRain) {
      drawRain(ctx, sec, 1.0);
    }
  }

  // =========================================================================
  // 2. MẶT TRỜI HIỀN HOÀ (drawSun)
  // =========================================================================
  function drawSun(ctx, t) {
    const sec = typeof t === 'number' ? t : 0;
    const sunX = 120;
    const sunY = 80;

    // Hào quang tỏa sáng
    const sunGlow = ctx.createRadialGradient(sunX, sunY, 15, sunX, sunY, 70);
    sunGlow.addColorStop(0, 'rgba(255, 235, 120, 0.55)');
    sunGlow.addColorStop(0.5, 'rgba(255, 220, 80, 0.18)');
    sunGlow.addColorStop(1, 'rgba(255, 210, 60, 0)');
    ctx.fillStyle = sunGlow;
    ctx.beginPath();
    ctx.arc(sunX, sunY, 70, 0, Math.PI * 2);
    ctx.fill();

    // Tia nắng xoay nhẹ theo thời gian
    ctx.save();
    ctx.translate(sunX, sunY);
    ctx.rotate(sec * 0.2);
    ctx.strokeStyle = 'rgba(255, 210, 63, 0.85)';
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    for (let i = 0; i < 10; i++) {
      ctx.beginPath();
      ctx.moveTo(0, 36);
      ctx.lineTo(0, 48);
      ctx.stroke();
      ctx.rotate(Math.PI / 5);
    }
    ctx.restore();

    // Đĩa mặt trời vàng rực
    ctx.fillStyle = C.sunYellow;
    ctx.strokeStyle = C.dark;
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.arc(sunX, sunY, 28, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Hai má hồng
    ctx.fillStyle = 'rgba(255, 118, 117, 0.55)';
    ctx.beginPath();
    ctx.arc(sunX - 11, sunY + 5, 4.2, 0, Math.PI * 2);
    ctx.arc(sunX + 11, sunY + 5, 4.2, 0, Math.PI * 2);
    ctx.fill();

    // Mắt cười hiền
    ctx.strokeStyle = C.dark;
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(sunX - 9, sunY - 2, 3.2, Math.PI, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(sunX + 9, sunY - 2, 3.2, Math.PI, Math.PI * 2);
    ctx.stroke();

    // Miệng cười tươi
    ctx.beginPath();
    ctx.arc(sunX, sunY + 6, 8, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();
    ctx.lineCap = 'butt';
  }

  // =========================================================================
  // 3. ĐÁM MÂY BỒNG BỀNH (drawCloud)
  // =========================================================================
  function drawCloud(ctx, cx, cy, scale) {
    const s = typeof scale === 'number' ? scale : 1.0;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(s, s);

    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = C.dark;
    ctx.lineWidth = 2.4 / s;

    ctx.beginPath();
    ctx.arc(-30, 2, 19, 0, Math.PI * 2);
    ctx.arc(-6, -14, 25, 0, Math.PI * 2);
    ctx.arc(22, -8, 21, 0, Math.PI * 2);
    ctx.arc(44, 4, 16, 0, Math.PI * 2);
    ctx.rect(-30, 4, 74, 16);
    ctx.fill();
    ctx.stroke();

    // Bóng mờ đáy mây
    ctx.fillStyle = 'rgba(207, 216, 220, 0.35)';
    ctx.beginPath();
    ctx.ellipse(6, 16, 32, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // =========================================================================
  // 4. VẼ DÒNG SÔNG XANH MÁT (drawStream)
  // Lòng sông từ x = 0 đến x = 330, uốn lượn dưới cối xoay nước
  // =========================================================================
  function drawStream(ctx, t, flowSpeed) {
    const sec = typeof t === 'number' ? t : 0;
    const sp = (typeof flowSpeed === 'number' ? flowSpeed : 1.0) * 80;

    ctx.save();

    // Nền nước sông
    const waterGrad = ctx.createLinearGradient(0, GROUND_Y - 14, 330, H);
    waterGrad.addColorStop(0, '#4fc3f7');
    waterGrad.addColorStop(0.35, '#29b6f6');
    waterGrad.addColorStop(0.75, '#0288d1');
    waterGrad.addColorStop(1, '#01579b');

    ctx.fillStyle = waterGrad;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y - 10);
    ctx.lineTo(320, GROUND_Y);
    ctx.bezierCurveTo(315, 470, 325, 520, 340, H);
    ctx.lineTo(0, H);
    ctx.closePath();
    ctx.fill();

    // Sóng nước sông lượn sóng cuộn trôi
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.lineWidth = 2.4;
    ctx.lineCap = 'round';

    const riverTracks = [
      { y: 435, maxW: 300, len: 45, spMult: 1.1 },
      { y: 460, maxW: 310, len: 55, spMult: 1.3 },
      { y: 490, maxW: 320, len: 65, spMult: 1.0 },
      { y: 520, maxW: 325, len: 50, spMult: 1.25 }
    ];

    for (let i = 0; i < riverTracks.length; i++) {
      const tr = riverTracks[i];
      for (let j = 0; j < 3; j++) {
        const offset = (j * tr.maxW) / 3;
        const wx = ((sec * sp * tr.spMult + offset) % (tr.maxW + 40)) - 20;
        const wy = tr.y + Math.sin(sec * 4 + wx * 0.05) * 2.5;

        if (wx + tr.len <= tr.maxW + 20) {
          ctx.beginPath();
          ctx.moveTo(wx, wy);
          ctx.quadraticCurveTo(wx + tr.len * 0.5, wy - 3.5, wx + tr.len, wy);
          ctx.stroke();
        }
      }
    }

    ctx.restore();
  }

  // =========================================================================
  // 5. CỐI XOAY NƯỚC / BÁNH GẦU (drawWheel)
  // x, y: tâm trục quay (mặc định WHEEL = [300, 330]);
  // o: { rev, angle, speed, scoop, blades, moving, dir, t }
  // =========================================================================
  function drawWheel(ctx, x, y, o) {
    const opts = o || {};
    const cx = typeof x === 'number' ? x : 300;
    const cy = typeof y === 'number' ? y : 330;
    const rev = typeof opts.rev === 'number' ? opts.rev : (typeof opts.angle === 'number' ? opts.angle / (Math.PI * 2) : 0);
    const angle = rev * Math.PI * 2;
    const hasScoop = !!(opts.scoop || opts.blades);

    ctx.save();

    // --- GIÁ ĐỠ CHỮ A (Technic A-Frame Stand) ---
    // Nối từ tâm (cx, cy) xuống mặt đất ở y = GROUND_Y
    ctx.strokeStyle = C.dark;
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(cx - 52, GROUND_Y);
    ctx.lineTo(cx, cy);
    ctx.lineTo(cx + 52, GROUND_Y);
    ctx.stroke();

    // Thanh ngang giằng giá đỡ
    ctx.beginPath();
    ctx.moveTo(cx - 32, cy + 55);
    ctx.lineTo(cx + 32, cy + 55);
    ctx.stroke();

    // Màu thanh đỡ Technic bên trong (màu trắng và xanh ngọc)
    ctx.strokeStyle = C.white;
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.moveTo(cx - 50, GROUND_Y - 2);
    ctx.lineTo(cx, cy);
    ctx.lineTo(cx + 50, GROUND_Y - 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - 30, cy + 55);
    ctx.lineTo(cx + 30, cy + 55);
    ctx.stroke();
    ctx.lineCap = 'butt';

    // Đinh chốt chân đế
    ctx.fillStyle = C.tealDark;
    ctx.beginPath();
    ctx.arc(cx - 48, GROUND_Y - 4, 3, 0, Math.PI * 2);
    ctx.arc(cx + 48, GROUND_Y - 4, 3, 0, Math.PI * 2);
    ctx.fill();

    // --- GUỒNG NƯỚC QUAY (Rotating Wheel) ---
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);

    // Vành tròn trợ lực bên ngoài
    ctx.strokeStyle = C.tealLight;
    ctx.lineWidth = 4.5;
    ctx.beginPath();
    ctx.arc(0, 0, 76, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = C.dark;
    ctx.lineWidth = 2;
    ctx.stroke();

    // 6 nan cánh guồng (spokes)
    const spokeCount = 6;
    const step = (Math.PI * 2) / spokeCount;

    for (let i = 0; i < spokeCount; i++) {
      ctx.save();
      ctx.rotate(i * step);

      // Nan hoa Technic màu trắng/xanh
      ctx.fillStyle = i % 2 === 0 ? C.teal : C.white;
      ctx.strokeStyle = C.dark;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      roundRect(ctx, -6, 6, 12, 72, 3);
      ctx.fill();
      ctx.stroke();

      // 3 lỗ tròn Technic trên mỗi nan
      for (let lh = 1; lh <= 3; lh++) {
        ctx.fillStyle = C.tealDark;
        ctx.beginPath();
        ctx.arc(0, lh * 18, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Gầu múc nước ở đầu mỗi nan
      if (hasScoop) {
        // Gầu to hơn (gói scoop): gầu màu vàng cam cong múc nhiều nước
        ctx.fillStyle = C.sunYellow;
        ctx.strokeStyle = C.dark;
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(-12, 74);
        ctx.quadraticCurveTo(22, 70, 18, 96);
        ctx.lineTo(-8, 92);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Nước lóng lánh trong gầu
        ctx.fillStyle = C.waterLight;
        ctx.beginPath();
        ctx.arc(6, 80, 5, 0, Math.PI);
        ctx.fill();
      } else {
        // Cánh dầm cản nước phẳng tiêu chuẩn màu xanh ngọc
        ctx.fillStyle = C.teal;
        ctx.strokeStyle = C.dark;
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        roundRect(ctx, -14, 72, 28, 16, 3);
        ctx.fill();
        ctx.stroke();
      }

      ctx.restore();
    }

    // Tâm trục quay màu trắng và chốt trục
    ctx.fillStyle = C.white;
    ctx.strokeStyle = C.dark;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = C.teal;
    ctx.beginPath();
    ctx.arc(0, 0, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = C.dark;
    ctx.fillRect(-2, -6, 4, 12);
    ctx.fillRect(-6, -2, 12, 4);

    ctx.restore();

    // Bọt nước tung bọt dưới chân guồng khi tiếp xúc với dòng sông
    const splashY = cy + 86;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    for (let f = 0; f < 5; f++) {
      const fx = cx - 20 + f * 10;
      ctx.beginPath();
      ctx.arc(fx, splashY, 4.5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  // =========================================================================
  // 6. BỂ CHỨA NƯỚC (drawTank)
  // x, y, w, h: toạ độ và kích thước bể (mặc định TANK = [560, 250, 120, 150]);
  // level: 0..1 tỉ lệ đầy nước; o: { cover, pipe, filter }
  // =========================================================================
  function drawTank(ctx, x, y, w, h, level, o) {
    const opts = o || {};
    const bx = typeof x === 'number' ? x : 560;
    const by = typeof y === 'number' ? y : 250;
    const bw = typeof w === 'number' ? w : 120;
    const bh = typeof h === 'number' ? h : 150;
    const lvl = Math.max(0, Math.min(1, typeof level === 'number' ? level : 0.5));

    ctx.save();

    // Máng dẫn nước (pipe) từ cối xoay nước sang bể chứa
    if (opts.pipe) {
      ctx.strokeStyle = C.dark;
      ctx.lineWidth = 8;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(360, 260);
      ctx.lineTo(bx + 10, by + 16);
      ctx.stroke();

      // Ruột máng màu xanh lam
      ctx.strokeStyle = '#9ec1ff';
      ctx.lineWidth = 4.5;
      ctx.beginPath();
      ctx.moveTo(360, 260);
      ctx.lineTo(bx + 10, by + 16);
      ctx.stroke();
      ctx.lineCap = 'butt';
    }

    // Chân đế đỡ bể chứa nước trên mặt đất
    ctx.fillStyle = C.greyDark;
    ctx.strokeStyle = C.dark;
    ctx.lineWidth = 2.5;
    roundRect(ctx, bx - 6, by + bh, bw + 12, 16, [0, 0, 4, 4]);
    ctx.fill();
    ctx.stroke();

    // Thân bể chứa kính trong suốt / viền kim loại
    ctx.fillStyle = 'rgba(238, 246, 251, 0.88)';
    ctx.strokeStyle = C.dark;
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    roundRect(ctx, bx, by, bw, bh, 6);
    ctx.fill();
    ctx.stroke();

    // Lượng nước trong bể
    const waterHeight = bh * lvl;
    if (waterHeight > 2) {
      const waterTopY = by + bh - waterHeight;
      const tankWaterGrad = ctx.createLinearGradient(bx, waterTopY, bx, by + bh);
      tankWaterGrad.addColorStop(0, '#29b6f6');
      tankWaterGrad.addColorStop(0.5, '#0288d1');
      tankWaterGrad.addColorStop(1, '#01579b');

      ctx.fillStyle = tankWaterGrad;
      ctx.beginPath();
      roundRect(ctx, bx + 3, waterTopY, bw - 6, waterHeight - 2, [0, 0, 4, 4]);
      ctx.fill();

      // Gợn sóng trên mặt nước trong bể
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(bx + 6, waterTopY + 2);
      ctx.lineTo(bx + bw - 6, waterTopY + 2);
      ctx.stroke();
    }

    // Vạch đo thể tích nước (lít) bên hông bể
    ctx.strokeStyle = 'rgba(30, 42, 52, 0.45)';
    ctx.lineWidth = 2;
    for (let mark = 1; mark <= 4; mark++) {
      const my = by + bh - (bh * mark) / 5;
      ctx.beginPath();
      ctx.moveTo(bx + 4, my);
      ctx.lineTo(bx + 18, my);
      ctx.stroke();
    }

    // Mái che bể (cover) bảo vệ nước khỏi nắng gắt và bụi bẩn
    if (opts.cover) {
      ctx.fillStyle = C.teal;
      ctx.strokeStyle = C.dark;
      ctx.lineWidth = 3;
      ctx.beginPath();
      roundRect(ctx, bx - 14, by - 20, bw + 28, 18, 4);
      ctx.fill();
      ctx.stroke();

      // Lớp mái vát bảo vệ
      ctx.fillStyle = C.tealDark;
      ctx.fillRect(bx - 10, by - 14, bw + 20, 4);
    }

    // Bộ lọc nước (filter) đặt bên hông bể chứa
    if (opts.filter) {
      const fx = bx + bw + 4;
      const fy = by + bh - 48;
      ctx.fillStyle = '#dff3f8';
      ctx.strokeStyle = C.tealDark;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      roundRect(ctx, fx, fy, 32, 42, 4);
      ctx.fill();
      ctx.stroke();

      // Các tầng lọc nước (than hoạt tính, sỏi lọc, màng lọc)
      ctx.fillStyle = '#78909c';
      ctx.fillRect(fx + 4, fy + 8, 24, 6);
      ctx.fillStyle = '#b0bec5';
      ctx.fillRect(fx + 4, fy + 18, 24, 6);
      ctx.fillStyle = '#81d4fa';
      ctx.fillRect(fx + 4, fy + 28, 24, 8);

      // Vòi dẫn nước sạch
      ctx.strokeStyle = C.dark;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(fx + 32, fy + 32);
      ctx.lineTo(fx + 42, fy + 32);
      ctx.lineTo(fx + 42, fy + 42);
      ctx.stroke();
    }

    ctx.restore();
  }

  // =========================================================================
  // 7. NGÔI NHÀ LÀNG QUÊ ĐÓN NƯỚC (drawHouse)
  // x: tâm nhà (mặc định HOUSE_X = 760); lit: boolean (nhà đang có nước dùng)
  // =========================================================================
  function drawHouse(ctx, x, lit) {
    const hx = typeof x === 'number' ? x : 760;
    const hy = GROUND_Y;

    ctx.save();

    // Thân nhà tường trắng
    ctx.fillStyle = C.white;
    ctx.strokeStyle = C.dark;
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.fillRect(hx - 42, hy - 76, 84, 76);
    ctx.strokeRect(hx - 42, hy - 76, 84, 76);

    // Mái ngói đỏ tam giác
    ctx.fillStyle = C.roofRed;
    ctx.beginPath();
    ctx.moveTo(hx - 54, hy - 76);
    ctx.lineTo(hx, hy - 124);
    ctx.lineTo(hx + 54, hy - 76);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Hàng ngói mái
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(hx - 36, hy - 92);
    ctx.lineTo(hx + 36, hy - 92);
    ctx.moveTo(hx - 20, hy - 108);
    ctx.lineTo(hx + 20, hy - 108);
    ctx.stroke();

    // Cửa chính gỗ ấm áp
    ctx.fillStyle = '#8d6e63';
    ctx.strokeStyle = C.dark;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    roundRect(ctx, hx - 14, hy - 46, 28, 46, [4, 4, 0, 0]);
    ctx.fill();
    ctx.stroke();

    // Tay nắm cửa vàng
    ctx.fillStyle = C.sunYellow;
    ctx.beginPath();
    ctx.arc(hx + 7, hy - 22, 2.8, 0, Math.PI * 2);
    ctx.fill();

    // Cửa sổ: sáng xanh biếc khi có nước chảy về làng
    const winX = hx - 32;
    const winY = hy - 60;
    ctx.fillStyle = lit ? '#4fc3f7' : '#cfd8dc';
    ctx.strokeStyle = C.dark;
    ctx.lineWidth = 2;
    ctx.beginPath();
    roundRect(ctx, winX, winY, 18, 20, 2);
    ctx.fill();
    ctx.stroke();

    // Kẻ ô cửa sổ
    ctx.beginPath();
    ctx.moveTo(winX + 9, winY);
    ctx.lineTo(winX + 9, winY + 20);
    ctx.moveTo(winX, winY + 10);
    ctx.lineTo(winX + 18, winY + 10);
    ctx.stroke();

    // Bồn cây hoa bên cạnh nhà
    ctx.fillStyle = '#4caf50';
    ctx.beginPath();
    ctx.arc(hx + 32, hy - 12, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ff4757';
    ctx.beginPath();
    ctx.arc(hx + 32, hy - 15, 3.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // =========================================================================
  // 8. MÀN HÌNH M5 / BỘ NÃO ALPHA 330 (drawFace)
  // x, y: tâm; kind: 'heart' (trái tim) | 'smile' (mặt cười) | 'drop' (giọt nước)
  // =========================================================================
  function drawFace(ctx, x, y, kind) {
    const fx = typeof x === 'number' ? x : 210;
    const fy = typeof y === 'number' ? y : 310;
    const k = kind || 'heart';

    ctx.save();

    // Vỏ hộp bộ não màu trắng
    ctx.fillStyle = C.white;
    ctx.strokeStyle = C.dark;
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    roundRect(ctx, fx - 34, fy - 28, 68, 56, 6);
    ctx.fill();
    ctx.stroke();

    // Màn hình LED màu đen bo góc
    ctx.fillStyle = '#10171e';
    ctx.beginPath();
    roundRect(ctx, fx - 26, fy - 20, 52, 40, 4);
    ctx.fill();
    ctx.stroke();

    // Hiển thị nội dung màn hình
    if (k === 'heart') {
      // Trái tim đỏ phát sáng
      ctx.fillStyle = C.redHeart;
      ctx.beginPath();
      ctx.moveTo(fx, fy + 12);
      ctx.bezierCurveTo(fx - 24, fy - 4, fx - 12, fy - 18, fx, fy - 6);
      ctx.bezierCurveTo(fx + 12, fy - 18, fx + 24, fy - 4, fx, fy + 12);
      ctx.closePath();
      ctx.fill();

      // Chấm sáng trắng trên tim
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.beginPath();
      ctx.arc(fx - 5, fy - 9, 2.2, 0, Math.PI * 2);
      ctx.fill();
    } else if (k === 'smile') {
      // Mặt cười vàng tươi
      ctx.fillStyle = C.sunYellow;
      ctx.beginPath();
      ctx.arc(fx, fy, 14, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = C.dark;
      ctx.lineWidth = 2.2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(fx - 5, fy - 2, 2.5, Math.PI, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(fx + 5, fy - 2, 2.5, Math.PI, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(fx, fy + 2, 5.5, 0.15 * Math.PI, 0.85 * Math.PI);
      ctx.stroke();
      ctx.lineCap = 'butt';
    } else {
      // Giọt nước xanh
      ctx.fillStyle = C.waterLight;
      ctx.beginPath();
      ctx.moveTo(fx, fy - 14);
      ctx.quadraticCurveTo(fx + 12, fy + 4, fx, fy + 14);
      ctx.quadraticCurveTo(fx - 12, fy + 4, fx, fy - 14);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  }

  // =========================================================================
  // 9. TOÀN BỘ MÔ HÌNH CỐI XOAY NƯỚC ĐỘC LẬP (drawWaterWheel)
  // Dùng cho xem thử chi tiết (xem-thu-art-bai11.html)
  // =========================================================================
  function drawWaterWheelModel(ctx, x, y, o) {
    const opts = o || {};
    const bx = typeof x === 'number' ? x : 240;
    const by = typeof y === 'number' ? y : GROUND_Y;
    const sec = typeof opts.t === 'number' ? opts.t : 0;
    const speed = typeof opts.speed === 'number' ? opts.speed : 1.2;
    const wheelAngle = typeof opts.angle === 'number' ? opts.angle : sec * speed * 2.8;
    const screenMode = opts.screen || 'heart';
    const shakeVal = Math.min(1, Math.max(0, typeof opts.shake === 'number' ? opts.shake : 0));

    const shakeX = shakeVal > 0 ? Math.sin(sec * 50) * 3.5 * shakeVal : 0;
    const shakeY = shakeVal > 0 ? Math.cos(sec * 45) * 2 * shakeVal : 0;

    ctx.save();
    ctx.translate(bx + shakeX, by + shakeY);

    // Bóng mô hình
    ctx.fillStyle = 'rgba(20, 30, 40, 0.22)';
    ctx.beginPath();
    ctx.ellipse(40, -4, 180, 16, 0, 0, Math.PI * 2);
    ctx.fill();

    // Khung đế Technic màu xanh ngọc
    const baseW = 210;
    const baseH = 24;
    const baseX = -105;
    const baseY = -24;

    ctx.fillStyle = C.teal;
    ctx.strokeStyle = C.dark;
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    roundRect(ctx, baseX, baseY, baseW, baseH, 6);
    ctx.fill();
    ctx.stroke();

    for (let i = 0; i < 9; i++) {
      const hx = baseX + 18 + i * 22;
      const hy = baseY + baseH / 2;
      ctx.fillStyle = C.tealDark;
      ctx.beginPath();
      ctx.arc(hx, hy, 5.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = C.dark;
      ctx.beginPath();
      ctx.arc(hx, hy, 2.4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Bộ não ZM Alpha 330
    const hubW = 82;
    const hubH = 110;
    const hubX = -92;
    const hubY = -134;

    ctx.fillStyle = C.white;
    ctx.strokeStyle = C.dark;
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    roundRect(ctx, hubX, hubY, hubW, hubH, 8);
    ctx.fill();
    ctx.stroke();

    // Cổng cắm dây
    ctx.fillStyle = C.dark;
    for (let p = 0; p < 4; p++) {
      const px = hubX + 10 + p * 16;
      roundRect(ctx, px, hubY - 6, 12, 6, [2, 2, 0, 0]);
      ctx.fill();
    }

    // Màn hình
    drawFace(ctx, hubX + hubW / 2, hubY + 42, screenMode);

    // 3 nút bấm
    for (let b = 0; b < 3; b++) {
      const bxBtn = hubX + 13 + b * 20;
      const byBtn = hubY + 84;
      ctx.fillStyle = b === 1 ? C.teal : '#eceff1';
      ctx.strokeStyle = C.dark;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      roundRect(ctx, bxBtn, byBtn, 16, 10, 3);
      ctx.fill();
      ctx.stroke();
    }

    // Dây cáp động cơ
    ctx.strokeStyle = '#10171e';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(hubX + 26, hubY - 4);
    ctx.bezierCurveTo(hubX + 35, hubY - 26, -5, hubY - 20, 5, -55);
    ctx.stroke();

    // Mái che / Nhà cối xay
    if (opts.shelter || opts.cover) {
      ctx.fillStyle = C.roofDark;
      ctx.strokeStyle = C.dark;
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.moveTo(-115, -130);
      ctx.lineTo(-51, -195);
      ctx.lineTo(12, -130);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.lineWidth = 1.8;
      for (let tile = 1; tile <= 4; tile++) {
        const ty = -130 - tile * 12;
        ctx.beginPath();
        ctx.moveTo(-115 + tile * 12, ty);
        ctx.lineTo(12 - tile * 12, ty);
        ctx.stroke();
      }

      ctx.strokeStyle = C.dark;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(-51, -195);
      ctx.lineTo(-51, -212);
      ctx.stroke();

      ctx.fillStyle = C.sunYellow;
      ctx.beginPath();
      ctx.arc(-51, -214, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else {
      // Khung tam giác Technic cơ bản
      ctx.fillStyle = C.white;
      ctx.strokeStyle = C.dark;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      roundRect(ctx, -100, -165, 14, 50, 3);
      roundRect(ctx, -16, -165, 14, 50, 3);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = C.teal;
      ctx.beginPath();
      ctx.moveTo(-108, -155);
      ctx.lineTo(-51, -195);
      ctx.lineTo(8, -155);
      ctx.lineTo(0, -145);
      ctx.lineTo(-51, -182);
      ctx.lineTo(-100, -145);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    // Động cơ Technic
    const motorX = -8;
    const motorY = -76;
    ctx.fillStyle = C.tealLight;
    ctx.strokeStyle = C.dark;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    roundRect(ctx, motorX, motorY, 42, 46, 5);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = C.sunWarm;
    ctx.beginPath();
    ctx.arc(motorX + 21, motorY + 23, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Trụ đỡ trục quay
    const pillarX = 42;
    const pillarY = -120;
    ctx.fillStyle = C.white;
    ctx.strokeStyle = C.dark;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    roundRect(ctx, pillarX, pillarY, 18, 96, 4);
    ctx.fill();
    ctx.stroke();

    // Hệ bánh răng truyền động
    const axleX = pillarX + 9;
    const axleY = pillarY + 30; // y = -90
    drawTechnicGear(ctx, axleX, axleY, 34, 20, wheelAngle, C.greyLight, C.dark);

    if (opts.gears || opts.filter) {
      drawTechnicGear(ctx, axleX, axleY + 44, 18, 10, -wheelAngle * 1.88, C.sunYellow, C.dark);
    }

    // Máng dẫn nước trên cao nếu có
    if (opts.chute || opts.pipe) {
      ctx.save();
      ctx.fillStyle = C.woodDark;
      ctx.strokeStyle = C.dark;
      ctx.lineWidth = 2.6;

      ctx.beginPath();
      roundRect(ctx, 4, -180, 10, 150, 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = C.woodBeam;
      ctx.beginPath();
      ctx.moveTo(-10, -185);
      ctx.lineTo(axleX + 75, -150);
      ctx.lineTo(axleX + 75, -135);
      ctx.lineTo(-10, -170);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Dòng nước đổ
      ctx.fillStyle = C.waterLight;
      ctx.beginPath();
      ctx.moveTo(axleX + 75, -145);
      ctx.quadraticCurveTo(axleX + 92, -135, axleX + 96, axleY - 30);
      ctx.lineTo(axleX + 82, axleY - 25);
      ctx.quadraticCurveTo(axleX + 82, -135, axleX + 75, -137);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // Cối xoay nước chính
    const wheelCenterCenterX = axleX + 85;
    const wheelCenterCenterY = axleY + 10;
    drawWheel(ctx, wheelCenterCenterX, wheelCenterCenterY, {
      rev: wheelAngle / (Math.PI * 2),
      scoop: opts.scoop || opts.blades
    });

    ctx.restore();
  }

  // =========================================================================
  // 10. BÁNH RĂNG KỸ THUẬT LEGO TECHNIC (drawTechnicGear)
  // =========================================================================
  function drawTechnicGear(ctx, cx, cy, r, teeth, angle, fillColor, strokeColor) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);

    ctx.fillStyle = fillColor || '#cfd8dc';
    ctx.strokeStyle = strokeColor || C.dark;
    ctx.lineWidth = 2.2;

    ctx.beginPath();
    const n = teeth || 16;
    const step = (Math.PI * 2) / n;
    const rIn = r * 0.84;
    const rOut = r;

    for (let i = 0; i < n; i++) {
      const a0 = i * step;
      const a1 = a0 + step * 0.28;
      const a2 = a0 + step * 0.5;
      const a3 = a0 + step * 0.78;

      if (i === 0) {
        ctx.moveTo(Math.cos(a0) * rIn, Math.sin(a0) * rIn);
      } else {
        ctx.lineTo(Math.cos(a0) * rIn, Math.sin(a0) * rIn);
      }
      ctx.lineTo(Math.cos(a1) * rOut, Math.sin(a1) * rOut);
      ctx.lineTo(Math.cos(a2) * rOut, Math.sin(a2) * rOut);
      ctx.lineTo(Math.cos(a3) * rIn, Math.sin(a3) * rIn);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.62, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    const holeR = r * 0.16;
    const holeDist = r * 0.38;
    for (let h = 0; h < 4; h++) {
      const ha = (h * Math.PI) / 2;
      const hx = Math.cos(ha) * holeDist;
      const hy = Math.sin(ha) * holeDist;
      ctx.fillStyle = '#cfd8dc';
      ctx.beginPath();
      ctx.arc(hx, hy, holeR, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    const axleW = r * 0.18;
    ctx.fillStyle = C.dark;
    ctx.beginPath();
    roundRect(ctx, -axleW * 0.5, -axleW * 1.5, axleW, axleW * 3, 1);
    roundRect(ctx, -axleW * 1.5, -axleW * 0.5, axleW * 3, axleW, 1);
    ctx.fill();

    ctx.restore();
  }

  // =========================================================================
  // 11. HẠT MƯA RƠI (drawRain)
  // =========================================================================
  function drawRain(ctx, t, intensity) {
    const sec = typeof t === 'number' ? t : 0;
    const factor = typeof intensity === 'number' ? intensity : 1.0;
    const count = Math.floor(45 * factor);

    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.lineWidth = 1.8;
    ctx.lineCap = 'round';

    for (let i = 0; i < count; i++) {
      const rx0 = (i * 47) % W;
      const speed = 340 + (i % 7) * 40;
      const ry = (sec * speed + i * 53) % H;
      const rx = (rx0 + sec * 30) % W;

      ctx.beginPath();
      ctx.moveTo(rx, ry);
      ctx.lineTo(rx - 3, ry + 12);
      ctx.stroke();
    }

    ctx.restore();
  }

  // =========================================================================
  // 12. SƠ ĐỒ VÒNG TUẦN HOÀN CỦA NƯỚC (drawWaterCycle)
  // =========================================================================
  function drawWaterCycle(ctx, cx, cy, w, h, t) {
    const sec = typeof t === 'number' ? t : 0;
    const width = typeof w === 'number' ? w : 360;
    const height = typeof h === 'number' ? h : 220;

    ctx.save();
    ctx.translate(cx, cy);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.94)';
    ctx.strokeStyle = C.dark;
    ctx.lineWidth = 3;
    ctx.beginPath();
    roundRect(ctx, 0, 0, width, height, 14);
    ctx.fill();
    ctx.stroke();

    ctx.font = '700 15px "Be Vietnam Pro", "Segoe UI", sans-serif';
    ctx.fillStyle = C.tealDark;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('VÒNG TUẦN HOÀN CỦA NƯỚC', width / 2, 10);

    const s1x = 65, s1y = 65;
    ctx.fillStyle = C.sunYellow;
    ctx.strokeStyle = C.dark;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(s1x, s1y, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = C.waterLight;
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    for (let u = -1; u <= 1; u++) {
      const uy = s1y + 24 - ((sec * 15 + u * 8) % 18);
      ctx.beginPath();
      ctx.moveTo(s1x + u * 10, uy);
      ctx.quadraticCurveTo(s1x + u * 10 + 3, uy - 4, s1x + u * 10, uy - 8);
      ctx.stroke();
    }

    ctx.font = '700 11px "Be Vietnam Pro", sans-serif';
    ctx.fillStyle = C.dark;
    ctx.textAlign = 'center';
    ctx.fillText('1. Bốc hơi', s1x, s1y + 30);

    ctx.strokeStyle = C.teal;
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(width / 2, 80, width * 0.28, Math.PI * 1.15, Math.PI * 1.85);
    ctx.stroke();

    const s2x = width - 70, s2y = 65;
    ctx.fillStyle = '#90caf9';
    ctx.strokeStyle = C.dark;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(s2x - 12, s2y, 10, 0, Math.PI * 2);
    ctx.arc(s2x, s2y - 6, 14, 0, Math.PI * 2);
    ctx.arc(s2x + 12, s2y, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = C.dark;
    ctx.fillText('2. Tụ mây', s2x, s2y + 22);

    ctx.strokeStyle = C.teal;
    ctx.beginPath();
    ctx.arc(s2x + 10, height / 2, 40, -Math.PI * 0.35, Math.PI * 0.35);
    ctx.stroke();

    const s3x = width - 70, s3y = height - 52;
    ctx.fillStyle = '#607d8b';
    ctx.strokeStyle = C.dark;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(s3x - 10, s3y - 6, 9, 0, Math.PI * 2);
    ctx.arc(s3x, s3y - 11, 12, 0, Math.PI * 2);
    ctx.arc(s3x + 10, s3y - 6, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = C.waterLight;
    ctx.lineWidth = 2;
    for (let r = -1; r <= 1; r++) {
      const ry = s3y + 4 + ((sec * 20 + r * 6) % 12);
      ctx.beginPath();
      ctx.moveTo(s3x + r * 8, ry);
      ctx.lineTo(s3x + r * 8 - 1, ry + 4);
      ctx.stroke();
    }

    ctx.fillStyle = C.dark;
    ctx.fillText('3. Mưa rơi', s3x, s3y + 22);

    ctx.strokeStyle = C.teal;
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(width / 2, height - 70, width * 0.28, Math.PI * 0.15, Math.PI * 0.85);
    ctx.stroke();

    const s4x = 65, s4y = height - 52;
    ctx.fillStyle = C.waterMid;
    ctx.strokeStyle = C.dark;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(s4x, s4y, 22, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = C.dark;
    ctx.fillText('4. Suối & Biển', s4x, s4y + 22);

    ctx.strokeStyle = C.teal;
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(s4x - 10, height / 2, 40, Math.PI * 0.65, Math.PI * 1.35);
    ctx.stroke();

    ctx.restore();
  }

  // =========================================================================
  // 13. BÉ GIỌT NƯỚC DỄ THƯƠNG (drawDroplet)
  // =========================================================================
  function drawDroplet(ctx, x, y, k, mood) {
    const scale = typeof k === 'number' ? k : 1.0;
    const m = mood || 'happy';

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    ctx.fillStyle = 'rgba(2, 119, 189, 0.25)';
    ctx.beginPath();
    ctx.ellipse(0, 24, 18, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    const bodyGrad = ctx.createLinearGradient(0, -32, 0, 22);
    bodyGrad.addColorStop(0, '#81d4fa');
    bodyGrad.addColorStop(0.5, '#29b6f6');
    bodyGrad.addColorStop(1, '#0288d1');

    ctx.fillStyle = bodyGrad;
    ctx.strokeStyle = C.dark;
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(0, -32);
    ctx.bezierCurveTo(24, -2, 28, 22, 0, 22);
    ctx.bezierCurveTo(-28, 22, -24, -2, 0, -32);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
    ctx.beginPath();
    ctx.ellipse(-8, -4, 5, 12, -0.25, 0, Math.PI * 2);
    ctx.fill();

    const eyeY = 2;
    const eyes = [-8, 8];
    for (const ex of eyes) {
      ctx.fillStyle = C.dark;
      ctx.beginPath();
      ctx.arc(ex, eyeY, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(ex - 1.4, eyeY - 1.4, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = 'rgba(255, 118, 117, 0.6)';
    ctx.beginPath();
    ctx.arc(-13, eyeY + 6, 3.8, 0, Math.PI * 2);
    ctx.arc(13, eyeY + 6, 3.8, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = C.dark;
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    if (m === 'cheer') {
      ctx.fillStyle = '#ff4757';
      ctx.beginPath();
      ctx.arc(0, eyeY + 6, 6, 0, Math.PI);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(0, eyeY + 6, 5, 0.15 * Math.PI, 0.85 * Math.PI);
      ctx.stroke();
    }

    ctx.fillStyle = '#29b6f6';
    ctx.strokeStyle = C.dark;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(-22, eyeY, 4, 0, Math.PI * 2);
    ctx.arc(22, eyeY - (m === 'cheer' ? 8 : 0), 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }

  // =========================================================================
  // 14. 4 HÌNH ẢNH SVG THẺ CHỌN GÓI SÁNG TẠO (PICS)
  // viewBox="0 0 64 48" aria-hidden="true"
  // Hỗ trợ cả 2 bộ khoá: { scoop, pipe, cover, filter } và { blades, chute, shelter, gears }
  // =========================================================================
  const PIC_SCOOP = '<svg viewBox="0 0 64 48" aria-hidden="true">' +
    '<circle cx="28" cy="24" r="16" fill="none" stroke="#3dc1dc" stroke-width="2.5"/>' +
    '<circle cx="28" cy="24" r="16" fill="none" stroke="#1e2a34" stroke-width="1.2"/>' +
    '<g stroke="#1e2a34" stroke-width="1.8">' +
    '<line x1="28" y1="8" x2="28" y2="40"/>' +
    '<line x1="12" y1="24" x2="44" y2="24"/>' +
    '<line x1="17" y1="13" x2="39" y2="35"/>' +
    '<line x1="17" y1="35" x2="39" y2="13"/>' +
    '</g>' +
    '<rect x="24" y="5" width="8" height="5" rx="1.5" fill="#ffd23f" stroke="#1e2a34" stroke-width="1.2"/>' +
    '<rect x="24" y="38" width="8" height="5" rx="1.5" fill="#ffd23f" stroke="#1e2a34" stroke-width="1.2"/>' +
    '<rect x="41" y="20" width="5" height="8" rx="1.5" fill="#ffd23f" stroke="#1e2a34" stroke-width="1.2"/>' +
    '<rect x="10" y="20" width="5" height="8" rx="1.5" fill="#ffd23f" stroke="#1e2a34" stroke-width="1.2"/>' +
    '<circle cx="28" cy="24" r="5" fill="#ffffff" stroke="#1e2a34" stroke-width="1.8"/>' +
    '<circle cx="28" cy="24" r="2" fill="#3dc1dc"/>' +
    '</svg>';

  const PIC_PIPE = '<svg viewBox="0 0 64 48" aria-hidden="true">' +
    '<path d="M8 10L36 22V27L8 15Z" fill="#bcaaa4" stroke="#1e2a34" stroke-width="1.6"/>' +
    '<line x1="14" y1="13" x2="14" y2="38" stroke="#1e2a34" stroke-width="2"/>' +
    '<path d="M34 22C42 25 44 32 44 42" fill="none" stroke="#29b6f6" stroke-width="3" stroke-linecap="round"/>' +
    '<path d="M36 24C40 27 42 32 42 42" fill="none" stroke="#ffffff" stroke-width="1.2" stroke-linecap="round"/>' +
    '<circle cx="48" cy="36" r="1.8" fill="#29b6f6"/>' +
    '<circle cx="38" cy="38" r="1.5" fill="#29b6f6"/>' +
    '<circle cx="45" cy="42" r="2" fill="#ffffff" stroke="#1e2a34" stroke-width="0.8"/>' +
    '</svg>';

  const PIC_COVER = '<svg viewBox="0 0 64 48" aria-hidden="true">' +
    '<path d="M10 24L32 8L54 24H10Z" fill="#b71c1c" stroke="#1e2a34" stroke-width="1.8"/>' +
    '<line x1="18" y1="18" x2="46" y2="18" stroke="#ffffff" stroke-width="1" stroke-opacity="0.6"/>' +
    '<line x1="32" y1="8" x2="32" y2="3" stroke="#1e2a34" stroke-width="1.6"/>' +
    '<circle cx="32" cy="3" r="2.2" fill="#ffd23f" stroke="#1e2a34" stroke-width="1"/>' +
    '<rect x="16" y="24" width="32" height="18" rx="2" fill="#ffffff" stroke="#1e2a34" stroke-width="1.8"/>' +
    '<rect x="22" y="28" width="20" height="10" rx="1.5" fill="#10171e"/>' +
    '<path d="M28 33C28 30 32 30 32 33C32 30 36 30 36 33C36 36 32 37 32 37C32 37 28 36 28 33Z" fill="#ff4757"/>' +
    '</svg>';

  const PIC_FILTER = '<svg viewBox="0 0 64 48" aria-hidden="true">' +
    '<rect x="14" y="10" width="36" height="30" rx="4" fill="#dff3f8" stroke="#1e2a34" stroke-width="1.8"/>' +
    '<rect x="20" y="16" width="24" height="6" rx="1" fill="#78909c"/>' +
    '<rect x="20" y="24" width="24" height="6" rx="1" fill="#b0bec5"/>' +
    '<rect x="20" y="32" width="24" height="5" rx="1" fill="#29b6f6"/>' +
    '<path d="M50 25h8v8" fill="none" stroke="#1e2a34" stroke-width="2" stroke-linecap="round"/>' +
    '<circle cx="58" cy="38" r="1.8" fill="#29b6f6"/>' +
    '</svg>';

  const PIC_GEARS = '<svg viewBox="0 0 64 48" aria-hidden="true">' +
    '<circle cx="24" cy="26" r="14" fill="#cfd8dc" stroke="#1e2a34" stroke-width="1.8"/>' +
    '<circle cx="24" cy="26" r="8" fill="#ffffff" stroke="#1e2a34" stroke-width="1.4"/>' +
    '<rect x="22.5" y="9" width="3" height="34" fill="#1e2a34"/>' +
    '<rect x="7" y="24.5" width="34" height="3" fill="#1e2a34"/>' +
    '<circle cx="24" cy="26" r="3" fill="#3dc1dc" stroke="#1e2a34" stroke-width="1.2"/>' +
    '<circle cx="44" cy="18" r="9" fill="#ffd23f" stroke="#1e2a34" stroke-width="1.6"/>' +
    '<circle cx="44" cy="18" r="4.5" fill="#ffffff" stroke="#1e2a34" stroke-width="1.2"/>' +
    '<circle cx="44" cy="18" r="1.8" fill="#1e2a34"/>' +
    '</svg>';

  const PICS = {
    scoop: PIC_SCOOP,
    pipe: PIC_PIPE,
    cover: PIC_COVER,
    filter: PIC_FILTER,
    blades: PIC_SCOOP,
    chute: PIC_PIPE,
    shelter: PIC_COVER,
    gears: PIC_GEARS
  };

  // Xuất giao diện toàn cục
  window.WaterArt = {
    W,
    H,
    GROUND_Y,
    WATER_Y,
    drawBackground,
    drawSun,
    drawCloud,
    drawStream,
    drawRain,
    drawWheel,
    drawWaterWheel: drawWaterWheelModel,
    drawTank,
    drawHouse,
    drawFace,
    drawTechnicGear,
    drawWaterCycle,
    drawDroplet,
    PICS
  };

  // Bí danh để tương thích linh hoạt
  window.WaterWheelArt = window.WaterArt;
})();
