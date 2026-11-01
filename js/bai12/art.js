// Tranh vẽ cảnh Đê ngăn lũ và mô hình Cửa van điều chỉnh mực nước cho Bài 12 (Lớp 1).
// Hệ toạ độ logic: W = 900, H = 560, GROUND_Y = 430.
// Không dùng ảnh ngoài, font ngoài, hay Math.random() trong khi vẽ. Chạy mượt mà trên file://.
(function () {
  'use strict';

  const W = 900;
  const H = 560;
  const GROUND_Y = 430;

  // Bảng màu chuẩn mô hình STEM Robotics Alpha 330 và cảnh sông đê Việt Nam
  const C = {
    dark: '#1e2a34',
    white: '#ffffff',
    teal: '#3dc1dc',
    tealDark: '#0e6f8a',
    tealLight: '#8ee6f5',
    yellow: '#ffd23f',
    yellowDark: '#f5a623',
    orange: '#f57c00',
    red: '#e53935',
    redDark: '#b71c1c',
    green: '#43a047',
    greenDark: '#2e7d32',
    greenLight: '#81c784',
    waterBlue: '#29b6f6',
    waterDeep: '#0288d1',
    waterDark: '#01579b',
    waterFoam: '#e1f5fe',
    grayLight: '#cfd8dc',
    grayMid: '#78909c',
    grayDark: '#37474f',
    brownEarth: '#8d6e63',
    brownDark: '#5d4037',
    stoneGray: '#90a4ae'
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

  // Dữ liệu các đám mây cố định trôi nhẹ tuần hoàn theo t
  const CLOUDS = [
    { x0: 60, y: 65, s: 0.95, sp: 8 },
    { x0: 280, y: 48, s: 1.15, sp: 6 },
    { x0: 560, y: 72, s: 0.85, sp: 10 },
    { x0: 780, y: 55, s: 1.05, sp: 7 }
  ];

  // Hạt mưa rơi cố định tuần hoàn theo t
  const RAIN_DROPS = [
    { x0: 30, y0: 20, len: 18, sp: 240 },
    { x0: 75, y0: 80, len: 14, sp: 260 },
    { x0: 120, y0: 40, len: 20, sp: 280 },
    { x0: 170, y0: 110, len: 16, sp: 250 },
    { x0: 220, y0: 15, len: 19, sp: 270 },
    { x0: 275, y0: 95, len: 15, sp: 265 },
    { x0: 330, y0: 50, len: 18, sp: 290 },
    { x0: 390, y0: 120, len: 16, sp: 255 },
    { x0: 440, y0: 30, len: 21, sp: 275 },
    { x0: 500, y0: 85, len: 15, sp: 260 },
    { x0: 560, y0: 25, len: 19, sp: 285 },
    { x0: 620, y0: 105, len: 14, sp: 250 },
    { x0: 680, y0: 45, len: 18, sp: 270 },
    { x0: 740, y0: 90, len: 16, sp: 265 },
    { x0: 800, y0: 35, len: 20, sp: 295 },
    { x0: 860, y0: 115, len: 15, sp: 260 }
  ];

  // Đá kè đê cố định chống sạt lở
  const LEVEE_STONES = [
    { x: 535, y: 405, rx: 12, ry: 7, c: '#78909c' },
    { x: 555, y: 418, rx: 14, ry: 8, c: '#607d8b' },
    { x: 575, y: 428, rx: 16, ry: 9, c: '#546e7a' },
    { x: 598, y: 442, rx: 15, ry: 8, c: '#78909c' },
    { x: 620, y: 455, rx: 18, ry: 10, c: '#607d8b' },
    { x: 648, y: 470, rx: 17, ry: 9, c: '#546e7a' },
    { x: 680, y: 485, rx: 19, ry: 11, c: '#78909c' },
    { x: 715, y: 500, rx: 20, ry: 11, c: '#607d8b' },
    { x: 755, y: 515, rx: 22, ry: 12, c: '#546e7a' },
    { x: 800, y: 530, rx: 21, ry: 11, c: '#78909c' }
  ];

  // =========================================================================
  // 1. VẼ NỀN: Bầu trời, dãy núi xa, cánh đồng lúa, triền đê xanh và dòng sông lũ
  // =========================================================================
  function drawBackground(ctx, t, o) {
    const sec = typeof t === 'number' ? t : 0;
    const opts = o || {};
    const isRain = opts.rain === true || (typeof opts.rain === 'number' && opts.rain > 0.1);
    const isStorm = opts.storm === true || (opts.weather === 'storm');

    // --- 1.1. Bầu trời ---
    const skyGrad = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
    if (isStorm) {
      skyGrad.addColorStop(0, '#37474f');
      skyGrad.addColorStop(0.6, '#546e7a');
      skyGrad.addColorStop(1, '#78909c');
    } else if (isRain) {
      skyGrad.addColorStop(0, '#5c7280');
      skyGrad.addColorStop(0.5, '#7b94a3');
      skyGrad.addColorStop(1, '#b0c4de');
    } else {
      // Trời xanh trong tươi sáng
      skyGrad.addColorStop(0, '#42a5f5');
      skyGrad.addColorStop(0.55, '#90caf9');
      skyGrad.addColorStop(1, '#e3f2fd');
    }
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, W, GROUND_Y);

    // --- 1.2. Mặt trời hoặc đám mây giông ---
    if (!isStorm) {
      const sunX = 810;
      const sunY = 85;
      const sunAlpha = isRain ? 0.35 : 1.0;

      ctx.save();
      ctx.globalAlpha = sunAlpha;
      const sunGlow = ctx.createRadialGradient(sunX, sunY, 12, sunX, sunY, 56);
      sunGlow.addColorStop(0, 'rgba(255, 238, 88, 0.65)');
      sunGlow.addColorStop(0.5, 'rgba(255, 213, 79, 0.25)');
      sunGlow.addColorStop(1, 'rgba(255, 213, 79, 0)');
      ctx.fillStyle = sunGlow;
      ctx.beginPath();
      ctx.arc(sunX, sunY, 56, 0, Math.PI * 2);
      ctx.fill();

      // Đĩa mặt trời vàng ấm
      ctx.fillStyle = '#ffd54f';
      ctx.strokeStyle = '#f57f17';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(sunX, sunY, 19, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Các tia nắng ấm
      ctx.strokeStyle = '#f57f17';
      ctx.lineWidth = 2.2;
      for (let i = 0; i < 8; i++) {
        const ang = (i * Math.PI) / 4 + sec * 0.15;
        const x1 = sunX + Math.cos(ang) * 24;
        const y1 = sunY + Math.sin(ang) * 24;
        const x2 = sunX + Math.cos(ang) * 34;
        const y2 = sunY + Math.sin(ang) * 34;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
      ctx.restore();
    }

    // --- 1.3. Đám mây trôi trên trời ---
    ctx.save();
    for (const c of CLOUDS) {
      const cx = ((c.x0 + sec * c.sp) % (W + 240)) - 120;
      const cy = c.y + Math.sin(sec * 0.8 + c.x0) * 3;
      const s = c.s;

      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(s, s);

      ctx.fillStyle = isStorm ? '#455a64' : (isRain ? '#b0bec5' : '#ffffff');
      ctx.strokeStyle = isStorm ? '#263238' : '#1e2a34';
      ctx.lineWidth = 2;

      ctx.beginPath();
      ctx.arc(-24, 0, 18, 0, Math.PI * 2);
      ctx.arc(0, -12, 22, 0, Math.PI * 2);
      ctx.arc(26, 0, 18, 0, Math.PI * 2);
      ctx.arc(10, 8, 16, 0, Math.PI * 2);
      ctx.arc(-14, 8, 16, 0, Math.PI * 2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.restore();
    }
    ctx.restore();

    // --- 1.4. Dãy núi xanh lam xa xa ---
    ctx.fillStyle = isStorm ? '#37474f' : (isRain ? '#546e7a' : '#81c784');
    ctx.strokeStyle = '#1e2a34';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 310);
    ctx.bezierCurveTo(90, 260, 180, 275, 270, 240);
    ctx.bezierCurveTo(360, 210, 440, 270, 540, 235);
    ctx.bezierCurveTo(650, 205, 760, 255, 900, 230);
    ctx.lineTo(W, 350);
    ctx.lineTo(0, 350);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Dãy đồi trung cảnh xanh đậm
    ctx.fillStyle = isStorm ? '#2e493b' : '#43a047';
    ctx.beginPath();
    ctx.moveTo(0, 345);
    ctx.bezierCurveTo(120, 310, 220, 335, 340, 305);
    ctx.bezierCurveTo(460, 275, 580, 330, 700, 300);
    ctx.bezierCurveTo(790, 285, 850, 315, 900, 305);
    ctx.lineTo(W, 375);
    ctx.lineTo(0, 375);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // --- 1.5. Cánh đồng lúa & Làng xóm sau đê (phía hữu ngạn x: 560..900) ---
    // Nền đồng quê được đê che chở
    const villageGrad = ctx.createLinearGradient(560, 320, 900, 480);
    villageGrad.addColorStop(0, '#c8e6c9');
    villageGrad.addColorStop(0.5, '#a5d6a7');
    villageGrad.addColorStop(1, '#81c784');
    ctx.fillStyle = villageGrad;
    ctx.beginPath();
    ctx.moveTo(540, 360);
    ctx.lineTo(W, 350);
    ctx.lineTo(W, H);
    ctx.lineTo(540, H);
    ctx.closePath();
    ctx.fill();

    // Vẽ làng quê thanh bình sau đê
    drawVillage(ctx, 690, 365, { safe: true });
    drawVillage(ctx, 810, 355, { safe: true });

    // --- 1.6. Hạt mưa rơi khi có bão lũ ---
    if (isRain || isStorm) {
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
      ctx.lineWidth = 1.8;
      ctx.lineCap = 'round';
      const rainCount = isStorm ? RAIN_DROPS.length : Math.floor(RAIN_DROPS.length * 0.65);
      for (let i = 0; i < rainCount; i++) {
        const d = RAIN_DROPS[i];
        const ry = (d.y0 + sec * d.sp) % (H - 40);
        const rx = (d.x0 - sec * 45) % W;
        const actX = rx < 0 ? rx + W : rx;
        ctx.beginPath();
        ctx.moveTo(actX, ry);
        ctx.lineTo(actX - 6, ry + d.len);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  // =========================================================================
  // 2. VẼ ĐÊ VÀ BỜ KÈ CHẮN LŨ: Thảm cỏ xanh, triền đê kiên cố, kè đá hộ đê
  // =========================================================================
  function drawLevee(ctx, t, o) {
    const sec = typeof t === 'number' ? t : 0;
    const opts = o || {};

    ctx.save();

    // --- Mặt đường trên mặt đê (đỉnh đê phẳng để xe tuần đê đi lại) ---
    ctx.fillStyle = '#b0bec5';
    ctx.strokeStyle = C.dark;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(480, 370);
    ctx.lineTo(W, 350);
    ctx.lineTo(W, 385);
    ctx.lineTo(480, 405);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Vạch kẻ đường an toàn trên đỉnh đê
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([12, 10]);
    ctx.beginPath();
    ctx.moveTo(490, 387);
    ctx.lineTo(W - 10, 367);
    ctx.stroke();
    ctx.setLineDash([]);

    // --- Triền đê thoai thoải phủ cỏ xanh biếc ---
    const slopeGrad = ctx.createLinearGradient(480, 395, 620, 520);
    slopeGrad.addColorStop(0, '#43a047');
    slopeGrad.addColorStop(0.6, '#2e7d32');
    slopeGrad.addColorStop(1, '#1b5e20');
    ctx.fillStyle = slopeGrad;
    ctx.beginPath();
    ctx.moveTo(480, 405);
    ctx.lineTo(W, 385);
    ctx.lineTo(W, H);
    ctx.lineTo(520, H);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // --- Các viên đá hộc kè chân đê chống xói lở ---
    for (const st of LEVEE_STONES) {
      ctx.fillStyle = st.c;
      ctx.strokeStyle = C.dark;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(st.x, st.y, st.rx, st.ry, 0.25, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Mảng sáng trên đá
      ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.beginPath();
      ctx.ellipse(st.x - 3, st.y - 2, st.rx * 0.45, st.ry * 0.45, 0.2, 0, Math.PI * 2);
      ctx.fill();
    }

    // --- Cọc tiêu phản quang ven đường đê ---
    const bollards = [540, 620, 710, 800, 880];
    for (const bx of bollards) {
      const by = 370 + ((bx - 480) / (W - 480)) * (350 - 370) + 16;
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = C.dark;
      ctx.lineWidth = 2;
      ctx.beginPath();
      roundRect(ctx, bx - 3, by - 16, 6, 16, 2);
      ctx.fill();
      ctx.stroke();

      // Vạch đỏ phản quang trên cọc tiêu
      ctx.fillStyle = '#e53935';
      ctx.fillRect(bx - 3, by - 12, 6, 4);
    }

    ctx.restore();
  }

  // =========================================================================
  // 3. VẼ DÒNG SÔNG LŨ VÀ MỰC NƯỚC: Nước dâng, cuộn sóng, bọt nước qua cửa xả
  // =========================================================================
  function drawWater(ctx, t, o) {
    const sec = typeof t === 'number' ? t : 0;
    const opts = o || {};
    const wLevel = typeof opts.waterLevel === 'number' ? Math.max(-1, Math.min(1, opts.waterLevel)) : 0;
    const gateOpen = typeof opts.gate === 'number' ? Math.max(0, Math.min(1, opts.gate)) : 0;
    const shake = typeof opts.shake === 'number' ? opts.shake : 0;

    // Chiều cao mặt nước sông thượng lưu (bên trái đê x: 0..470)
    // wLevel: 0 (bình thường y = 390), 1 (lũ cao dâng lên y = 330), -1 (mùa cạn y = 430)
    const baseWaterY = 390 - wLevel * 55 + (shake > 0 ? Math.sin(sec * 40) * 3 * shake : 0);

    ctx.save();

    // --- Lòng sông sâu (nền nước bên trái đê) ---
    const waterGrad = ctx.createLinearGradient(0, baseWaterY - 10, 0, H);
    if (wLevel > 0.4) {
      // Nước lũ cuồn cuộn đỏ phù sa pha xanh đậm
      waterGrad.addColorStop(0, '#0277bd');
      waterGrad.addColorStop(0.35, '#01579b');
      waterGrad.addColorStop(1, '#002f6c');
    } else {
      // Dòng sông xanh hiền hoà
      waterGrad.addColorStop(0, '#29b6f6');
      waterGrad.addColorStop(0.4, '#0288d1');
      waterGrad.addColorStop(1, '#01579b');
    }

    // Vẽ khối nước thượng lưu
    ctx.fillStyle = waterGrad;
    ctx.beginPath();
    ctx.moveTo(0, H);
    ctx.lineTo(0, baseWaterY);

    // Đường sóng nước nhấp nhô
    const waveCount = 18;
    const step = 470 / waveCount;
    for (let i = 0; i <= waveCount; i++) {
      const wx = i * step;
      const wy = baseWaterY + Math.sin(sec * 4 + i * 0.8) * (3 + wLevel * 3.5);
      ctx.lineTo(wx, wy);
    }
    ctx.lineTo(470, H);
    ctx.closePath();
    ctx.fill();

    // Viền mép nước cuộn sóng
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let i = 0; i <= waveCount; i++) {
      const wx = i * step;
      const wy = baseWaterY + Math.sin(sec * 4 + i * 0.8) * (3 + wLevel * 3.5);
      if (i === 0) ctx.moveTo(wx, wy);
      else ctx.lineTo(wx, wy);
    }
    ctx.stroke();

    // Vệt gợn sóng lấp lánh trên mặt sông
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.lineWidth = 2;
    for (let j = 0; j < 6; j++) {
      const sy = baseWaterY + 18 + j * 22;
      const sx = ((j * 85 + sec * 45) % 410) + 15;
      const sw = 38 + (j % 3) * 16;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.quadraticCurveTo(sx + sw / 2, sy - 3.5, sx + sw, sy);
      ctx.stroke();
    }

    // --- Nước chảy qua cửa xả khi mở cửa van (gateOpen > 0) ---
    if (gateOpen > 0.05) {
      // Dòng nước trắng xoá cuộn trào qua cửa van đê từ x = 240..390 sang hạ lưu
      ctx.save();
      const flowAlpha = Math.min(1, gateOpen * 1.2);
      ctx.globalAlpha = flowAlpha;

      // Nước hạ lưu dâng nhẹ trong lòng kênh xả
      const canalGrad = ctx.createLinearGradient(350, 420, 520, 540);
      canalGrad.addColorStop(0, 'rgba(41, 182, 246, 0.85)');
      canalGrad.addColorStop(1, 'rgba(2, 136, 209, 0.95)');
      ctx.fillStyle = canalGrad;
      ctx.beginPath();
      ctx.moveTo(270, 440);
      ctx.lineTo(470, 440);
      ctx.lineTo(470, 540);
      ctx.lineTo(270, 540);
      ctx.closePath();
      ctx.fill();

      // Luồng bọt nước xiết tung trắng xoá dưới chân cửa van
      ctx.fillStyle = '#ffffff';
      for (let k = 0; k < 12; k++) {
        const bx = 265 + ((k * 31 + sec * 90) % 170);
        const by = 432 + Math.sin(sec * 8 + k) * 6;
        const br = 3.5 + (k % 3) * 2;
        ctx.beginPath();
        ctx.arc(bx, by, br, 0, Math.PI * 2);
        ctx.fill();
      }

      // Các tia nước bắn xối xả
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.4;
      for (let s = 0; s < 5; s++) {
        const spx = 320 + s * 24;
        ctx.beginPath();
        ctx.moveTo(spx, 436);
        ctx.quadraticCurveTo(spx + 16, 420 - gateOpen * 12, spx + 32, 442);
        ctx.stroke();
      }

      ctx.restore();
    } else {
      // Cửa đê đóng kín: nước lũ ứ lại bên ngoài, bên trong kênh khô ráo an toàn
      ctx.fillStyle = '#cfd8dc';
      ctx.strokeStyle = C.dark;
      ctx.lineWidth = 2;
      ctx.beginPath();
      roundRect(ctx, 360, 435, 110, 45, [0, 0, 8, 8]);
      ctx.fill();
      ctx.stroke();

      // Rãnh kênh bê tông khô ráo
      ctx.fillStyle = '#b0bec5';
      ctx.fillRect(375, 440, 80, 8);
    }

    ctx.restore();
  }

  // =========================================================================
  // 4. MÔ HÌNH ĐÊ NGĂN LŨ ROBOTICS: 2 tháp trụ, dầm cầu trên, cửa van nâng hạ,
  //    động cơ BE-3578, bánh răng truyền động, bộ não M5, cảm biến chạm BE-2257
  // =========================================================================
  function drawFloodgate(ctx, x, y, o) {
    const opts = o || {};
    const gateVal = typeof opts.gate === 'number' ? Math.max(0, Math.min(1, opts.gate)) : 0;
    const gearAngle = typeof opts.gearAngle === 'number' ? opts.gearAngle : (gateVal * Math.PI * 4);
    const touchPressed = !!opts.touchPressed;
    const shakeVal = Math.min(1, Math.max(0, typeof opts.shake === 'number' ? opts.shake : 0));
    const sec = typeof opts.t === 'number' ? opts.t : 0;

    // Rung lắc nhẹ mô hình khi nước lũ va đập mạnh
    const shakeX = shakeVal > 0 ? Math.sin(sec * 55) * 3 * shakeVal : 0;
    const shakeY = shakeVal > 0 ? Math.cos(sec * 45) * 2 * shakeVal : 0;

    ctx.save();
    ctx.translate(x + shakeX, y + shakeY);

    // ==========================================
    // LỚP 1: MÓNG TRỤ BÊ TÔNG DƯỚI LÒNG KÊNH (Base)
    // ==========================================
    // Khối móng bê tông trái (x: -160..-70)
    ctx.fillStyle = '#546e7a';
    ctx.strokeStyle = C.dark;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    roundRect(ctx, -165, -30, 95, 36, [6, 6, 0, 0]);
    ctx.fill();
    ctx.stroke();

    // Khối móng bê tông phải (x: 70..165)
    ctx.beginPath();
    roundRect(ctx, 70, -30, 95, 36, [6, 6, 0, 0]);
    ctx.fill();
    ctx.stroke();

    // Ngưỡng đáy kênh bằng đá (Sill plate x: -70..70)
    ctx.fillStyle = '#37474f';
    ctx.beginPath();
    roundRect(ctx, -70, -18, 140, 24, 2);
    ctx.fill();
    ctx.stroke();

    // ==========================================
    // LỚP 2: CỬA VAN NGĂN LŨ NÂNG HẠ (Sluice Gate Slab)
    // ==========================================
    // Khi gate = 0: cửa đóng sát đáy kênh ở y = -14.
    // Khi gate = 1: cửa kéo lên cao ở y = -95 để thoát nước lũ.
    const gateY = -14 - gateVal * 82;
    const gateW = 144;
    const gateH = 92;

    ctx.save();

    // Tấm thân cửa van ngăn lũ màu trắng viền ngọc
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = C.dark;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    roundRect(ctx, -gateW / 2, gateY - gateH, gateW, gateH, 6);
    ctx.fill();
    ctx.stroke();

    // Dải sọc cảnh báo nguy hiểm Vàng - Đen ở chân cửa van
    const stripeH = 14;
    const stripeY = gateY - stripeH;
    ctx.save();
    ctx.beginPath();
    roundRect(ctx, -gateW / 2 + 1, stripeY, gateW - 2, stripeH - 1, [0, 0, 5, 5]);
    ctx.clip();
    ctx.fillStyle = C.yellow;
    ctx.fillRect(-gateW / 2, stripeY, gateW, stripeH);

    // Kẻ chéo sọc đen hazard
    ctx.fillStyle = C.dark;
    for (let sx = -gateW / 2 - 20; sx < gateW / 2 + 30; sx += 20) {
      ctx.beginPath();
      ctx.moveTo(sx, stripeY);
      ctx.lineTo(sx + 12, stripeY);
      ctx.lineTo(sx + 24, stripeY + stripeH);
      ctx.lineTo(sx + 12, stripeY + stripeH);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    // Các đường gân gia cố cửa van màu xanh ngọc tươi (Lego Alpha 330)
    ctx.fillStyle = C.teal;
    ctx.strokeStyle = C.tealDark;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    roundRect(ctx, -gateW / 2 + 10, gateY - gateH + 12, gateW - 20, 18, 3);
    roundRect(ctx, -gateW / 2 + 10, gateY - gateH + 38, gateW - 20, 18, 3);
    ctx.fill();
    ctx.stroke();

    // 6 đinh tán thép / chốt Technic gia cố trên gờ cửa van
    for (let r = 0; r < 2; r++) {
      const gy = gateY - gateH + 21 + r * 26;
      for (let c = 0; c < 3; c++) {
        const gx = -gateW / 2 + 32 + c * 40;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(gx, gy, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = C.dark;
        ctx.stroke();
      }
    }

    // 2 thanh răng thẳng (Gear racks) gắn 2 bên mép cửa van
    ctx.fillStyle = '#b0bec5';
    ctx.strokeStyle = C.dark;
    ctx.lineWidth = 1.5;
    for (const rx of [-gateW / 2 + 6, gateW / 2 - 12]) {
      ctx.fillRect(rx, gateY - gateH - 6, 6, gateH + 6);
      ctx.strokeRect(rx, gateY - gateH - 6, 6, gateH + 6);

      // Các răng cưa của thanh răng
      for (let ty = gateY - gateH; ty <= gateY; ty += 8) {
        ctx.fillStyle = C.dark;
        ctx.fillRect(rx + (rx < 0 ? 0 : 4), ty, 2, 4);
      }
    }

    ctx.restore();

    // ==========================================
    // LỚP 3: HAI THÁP TRỤ ĐÊ (Twin Control Towers)
    // ==========================================
    // Tháp Trái (x: -160..-70) và Tháp Phải (x: 70..160), cao từ y = -30 lên y = -190
    const towerW = 86;
    const towerH = 175;
    const towerTopsY = -205;

    for (const side of [-1, 1]) {
      const tx = side === -1 ? -156 : 70;

      // Thân tháp trụ màu xanh ngọc Alpha 330
      ctx.fillStyle = C.teal;
      ctx.strokeStyle = C.dark;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      roundRect(ctx, tx, towerTopsY, towerW, towerH, 6);
      ctx.fill();
      ctx.stroke();

      // Mảng ốp mặt trước màu trắng
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      roundRect(ctx, tx + 8, towerTopsY + 12, towerW - 16, towerH - 24, 4);
      ctx.fill();
      ctx.stroke();

      // Các lỗ chốt Lego Technic dọc thân tháp
      for (let h = 0; h < 6; h++) {
        const hy = towerTopsY + 28 + h * 22;
        const hx = tx + towerW / 2;
        ctx.fillStyle = C.tealDark;
        ctx.beginPath();
        ctx.arc(hx, hy, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = C.dark;
        ctx.beginPath();
        ctx.arc(hx, hy, 2, 0, Math.PI * 2);
        ctx.fill();
      }

      // Rãnh trượt dọc ở cạnh trong của tháp để cửa van trượt lên xuống
      const trackX = side === -1 ? tx + towerW - 8 : tx;
      ctx.fillStyle = '#37474f';
      ctx.fillRect(trackX, towerTopsY + 20, 8, towerH - 20);
    }

    // ==========================================
    // LỚP 4: DẦM CẦU TRÊN ĐỈNH (Overhead Bridge)
    // ==========================================
    // Nối 2 tháp từ x = -170 đến x = 170 ở y = -240..-195
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = C.dark;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    roundRect(ctx, -172, -242, 344, 38, 6);
    ctx.fill();
    ctx.stroke();

    // Dải trang trí xanh ngọc ở giữa dầm
    ctx.fillStyle = C.teal;
    ctx.fillRect(-168, -226, 336, 8);

    // Lan can an toàn trên đỉnh cầu
    ctx.strokeStyle = C.dark;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-160, -256);
    ctx.lineTo(160, -256);
    ctx.stroke();

    for (let lx = -150; lx <= 150; lx += 30) {
      ctx.beginPath();
      ctx.moveTo(lx, -242);
      ctx.lineTo(lx, -256);
      ctx.stroke();
    }

    // ==========================================
    // LỚP 5: ĐỘNG CƠ (Motor BE-3578) TRÊN DẦM CẦU
    // ==========================================
    // Đặt ở vị trí x = -65..-10, y = -236..-204
    const motorX = -72;
    const motorY = -238;
    const motorW = 56;
    const motorH = 30;

    // Vỏ động cơ màu xanh ngọc đậm và trắng
    ctx.fillStyle = C.teal;
    ctx.strokeStyle = C.dark;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    roundRect(ctx, motorX, motorY, motorW, motorH, 5);
    ctx.fill();
    ctx.stroke();

    // Phần nắp động cơ màu xanh đậm
    ctx.fillStyle = C.tealDark;
    ctx.beginPath();
    roundRect(ctx, motorX + 4, motorY + 4, motorW - 8, 8, 2);
    ctx.fill();

    // Biểu tượng động cơ / tia chớp xoay
    ctx.fillStyle = C.yellow;
    ctx.beginPath();
    ctx.moveTo(motorX + motorW / 2 - 3, motorY + 16);
    ctx.lineTo(motorX + motorW / 2 + 5, motorY + 16);
    ctx.lineTo(motorX + motorW / 2, motorY + 24);
    ctx.lineTo(motorX + motorW / 2 + 4, motorY + 24);
    ctx.lineTo(motorX + motorW / 2 - 4, motorY + 34);
    ctx.lineTo(motorX + motorW / 2 - 1, motorY + 25);
    ctx.lineTo(motorX + motorW / 2 - 5, motorY + 25);
    ctx.closePath();
    ctx.fill();

    // Trục động cơ màu cam chìa sang phải kết nối bánh răng
    ctx.fillStyle = C.orange;
    ctx.fillRect(motorX + motorW, motorY + 11, 10, 8);
    ctx.strokeRect(motorX + motorW, motorY + 11, 10, 8);

    // ==========================================
    // LỚP 6: CƠ CẤU BÁNH RĂNG TRUYỀN ĐỘNG (Gears)
    // ==========================================
    // Bánh răng nhỏ 12 răng (Pinion) tại x = 0, y = -223
    const gear1X = 0;
    const gear1Y = -223;
    const gear1R = 14;

    ctx.save();
    ctx.translate(gear1X, gear1Y);
    ctx.rotate(gearAngle);

    // Bánh răng màu vàng tươi
    ctx.fillStyle = C.yellow;
    ctx.strokeStyle = C.dark;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, gear1R, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Các răng nhô ra ngoài
    for (let g = 0; g < 8; g++) {
      ctx.beginPath();
      ctx.rect(-2.5, -gear1R - 3.5, 5, 4);
      ctx.fill();
      ctx.stroke();
      ctx.rotate(Math.PI / 4);
    }

    // Tâm bánh răng
    ctx.fillStyle = C.dark;
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // Bánh răng lớn 24 răng tại x = 34, y = -223
    const gear2X = 34;
    const gear2Y = -223;
    const gear2R = 20;

    ctx.save();
    ctx.translate(gear2X, gear2Y);
    ctx.rotate(-gearAngle * 0.5);

    // Thân bánh răng lớn màu xám thép
    ctx.fillStyle = '#b0bec5';
    ctx.strokeStyle = C.dark;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, gear2R, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Các răng bánh răng lớn
    for (let g = 0; g < 12; g++) {
      ctx.beginPath();
      ctx.rect(-2.5, -gear2R - 4, 5, 4.5);
      ctx.fill();
      ctx.stroke();
      ctx.rotate(Math.PI / 6);
    }

    // Các lỗ giảm trọng lượng trên bánh răng lớn
    ctx.fillStyle = '#ffffff';
    for (let h = 0; h < 4; h++) {
      ctx.beginPath();
      ctx.arc(10, 0, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.rotate(Math.PI / 2);
    }

    // Trục chữ thập Lego
    ctx.fillStyle = C.dark;
    ctx.fillRect(-2, -5, 4, 10);
    ctx.fillRect(-5, -2, 10, 4);

    ctx.restore();

    // ==========================================
    // LỚP 7: BỘ NÃO ĐIỀU KHIỂN (Smart Hub M5 BE-5158)
    // ==========================================
    // Gắn ở tháp bên phải x = 80..152, y = -180..-130
    const hubX = 84;
    const hubY = -185;
    const hubW = 58;
    const hubH = 46;

    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = C.dark;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    roundRect(ctx, hubX, hubY, hubW, hubH, 6);
    ctx.fill();
    ctx.stroke();

    // Đèn LED trạng thái M5 ở giữa Smart Hub
    const isMoving = gateVal > 0.02 && gateVal < 0.98;
    const isAlert = opts.waterLevel > 0.5;
    const ledColor = isAlert ? C.red : (isMoving ? C.yellow : C.green);

    // Quầng sáng đèn LED
    ctx.save();
    const ledGlow = ctx.createRadialGradient(hubX + hubW / 2, hubY + hubH / 2, 2, hubX + hubW / 2, hubY + hubH / 2, 16);
    ledGlow.addColorStop(0, ledColor);
    ledGlow.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = ledGlow;
    ctx.beginPath();
    ctx.arc(hubX + hubW / 2, hubY + hubH / 2, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Viên đèn LED trung tâm
    ctx.fillStyle = ledColor;
    ctx.strokeStyle = C.dark;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(hubX + hubW / 2, hubY + hubH / 2, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Hai cổng cắm cảm biến màu đen
    ctx.fillStyle = C.dark;
    ctx.fillRect(hubX + 8, hubY + hubH - 6, 12, 6);
    ctx.fillRect(hubX + hubW - 20, hubY + hubH - 6, 12, 6);

    // ==========================================
    // LỚP 8: CẢM BIẾN CHẠM (Touch Sensor BE-2257)
    // ==========================================
    // Gắn nhô ra phía trước trên tháp trái ở x = -195..-155, y = -140..-105
    const tsX = -198;
    const tsY = -145;
    const tsW = 42;
    const tsH = 34;

    // Khung gắn cảm biến vào tháp
    ctx.fillStyle = '#90a4ae';
    ctx.fillRect(tsX + tsW - 4, tsY + 8, 6, 18);

    // Vỏ cảm biến chạm màu trắng Lego WeDo / Alpha 330
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = C.dark;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    roundRect(ctx, tsX, tsY, tsW, tsH, 5);
    ctx.fill();
    ctx.stroke();

    // Mặt cảm biến chạm màu xanh ngọc
    ctx.fillStyle = C.teal;
    ctx.beginPath();
    roundRect(ctx, tsX + 4, tsY + 4, tsW - 8, tsH - 8, 3);
    ctx.fill();

    // Nút ấn lò xo màu đỏ cam (nhấn vào thụt lại 4px khi touchPressed = true)
    const btnOffset = touchPressed ? 3 : 0;
    const btnW = 14;
    const btnH = 20;
    const btnX = tsX - btnW + 4 + btnOffset;
    const btnY = tsY + (tsH - btnH) / 2;

    ctx.fillStyle = touchPressed ? '#d32f2f' : '#ff5722';
    ctx.strokeStyle = C.dark;
    ctx.lineWidth = 2;
    ctx.beginPath();
    roundRect(ctx, btnX, btnY, btnW, btnH, [4, 0, 0, 4]);
    ctx.fill();
    ctx.stroke();

    // Vòng sóng tín hiệu khi nhấn cảm biến chạm
    if (touchPressed) {
      ctx.strokeStyle = C.yellow;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(btnX, btnY + btnH / 2, 10, Math.PI * 0.6, Math.PI * 1.4);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(btnX - 4, btnY + btnH / 2, 16, Math.PI * 0.6, Math.PI * 1.4);
      ctx.stroke();
    }

    // Dây cáp kết nối từ cảm biến chạm sang Smart Hub
    ctx.strokeStyle = C.dark;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(tsX + tsW - 2, tsY + tsH - 8);
    ctx.bezierCurveTo(tsX + tsW + 20, tsY + tsH + 15, -40, -180, hubX + 12, hubY + hubH);
    ctx.stroke();

    // ==========================================
    // LỚP 9: CÁC GÓI SÁNG TẠO BỔ SUNG (4 Creative Packages)
    // ==========================================

    // 9.1. Gói sáng tạo 1: Còi & đèn báo động lũ khẩn cấp (o.alarm)
    if (opts.alarm) {
      const alarmX = 0;
      const alarmY = -272;

      // Cột đỡ đèn xoay trên đỉnh dầm cầu
      ctx.fillStyle = '#455a64';
      ctx.strokeStyle = C.dark;
      ctx.lineWidth = 2;
      ctx.fillRect(alarmX - 4, alarmY + 12, 8, 16);
      ctx.strokeRect(alarmX - 4, alarmY + 12, 8, 16);

      // Chớp đèn đỏ/vàng theo thời gian t
      const isRed = Math.sin(sec * 10) > 0;
      const beaconColor = isRed ? '#ff1744' : '#ffd600';

      // Quầng sáng xoay quét xung quanh
      ctx.save();
      const alarmGlow = ctx.createRadialGradient(alarmX, alarmY, 2, alarmX, alarmY, 32);
      alarmGlow.addColorStop(0, isRed ? 'rgba(255, 23, 68, 0.85)' : 'rgba(255, 214, 0, 0.85)');
      alarmGlow.addColorStop(0.6, isRed ? 'rgba(255, 23, 68, 0.3)' : 'rgba(255, 214, 0, 0.3)');
      alarmGlow.addColorStop(1, 'rgba(255, 0, 0, 0)');
      ctx.fillStyle = alarmGlow;
      ctx.beginPath();
      ctx.arc(alarmX, alarmY, 32, 0, Math.PI * 2);
      ctx.fill();

      // Vỏ chụp đèn thủy tinh bo vòm tròn
      ctx.fillStyle = beaconColor;
      ctx.strokeStyle = C.dark;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.arc(alarmX, alarmY, 12, Math.PI, 0);
      ctx.lineTo(alarmX + 12, alarmY + 12);
      ctx.lineTo(alarmX - 12, alarmY + 12);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Tia phát thanh âm thanh báo động
      ctx.strokeStyle = beaconColor;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(alarmX + 18, alarmY, 10, -Math.PI * 0.3, Math.PI * 0.3);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(alarmX - 18, alarmY, 10, Math.PI * 0.7, Math.PI * 1.3);
      ctx.stroke();

      // Hai loa phát thanh còi báo động hướng sang 2 bên
      ctx.fillStyle = '#37474f';
      ctx.beginPath();
      ctx.moveTo(alarmX + 6, alarmY + 6);
      ctx.lineTo(alarmX + 22, alarmY - 2);
      ctx.lineTo(alarmX + 22, alarmY + 14);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(alarmX - 6, alarmY + 6);
      ctx.lineTo(alarmX - 22, alarmY - 2);
      ctx.lineTo(alarmX - 22, alarmY + 14);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.restore();
    }

    // 9.2. Gói sáng tạo 2: Lưới chắn rác trôi dạt (o.screen)
    if (opts.screen) {
      // Khung nan thép cong đặt phía trước dòng sông x: -80..80, y: -45..10
      ctx.save();
      ctx.strokeStyle = '#37474f';
      ctx.lineWidth = 3.5;
      ctx.lineCap = 'round';

      // 2 thanh dầm ngang đỡ lưới chắn rác
      ctx.beginPath();
      ctx.moveTo(-74, -40);
      ctx.lineTo(74, -40);
      ctx.moveTo(-74, -10);
      ctx.lineTo(74, -10);
      ctx.stroke();

      // Các thanh dọc tạo thành song chắn rác
      ctx.lineWidth = 2.4;
      ctx.strokeStyle = '#455a64';
      for (let rx = -68; rx <= 68; rx += 14) {
        ctx.beginPath();
        ctx.moveTo(rx, -48);
        ctx.lineTo(rx, 6);
        ctx.stroke();
      }

      // Khúc gỗ cây trôi dạt bị chặn lại trước lưới
      ctx.fillStyle = '#795548';
      ctx.strokeStyle = C.dark;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      roundRect(ctx, -38, -26, 44, 9, 3);
      ctx.fill();
      ctx.stroke();

      // Chiếc lá xanh vướng trên lưới chắn rác
      ctx.fillStyle = '#4caf50';
      ctx.beginPath();
      ctx.ellipse(14, -20, 6, 3, 0.4, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    // 9.3. Gói sáng tạo 3: Máy bơm tiêu úng trợ lực (o.pump)
    if (opts.pump) {
      // Gắn trên kè đê phía hữu ngạn x: 165..215, y: -100..-30
      const pumpX = 168;
      const pumpY = -90;

      ctx.save();
      // Khung bệ đỡ máy bơm
      ctx.fillStyle = '#607d8b';
      ctx.strokeStyle = C.dark;
      ctx.lineWidth = 2;
      ctx.fillRect(pumpX, pumpY + 36, 42, 10);
      ctx.strokeRect(pumpX, pumpY + 36, 42, 10);

      // Thùng bơm li tâm hình tròn lớn màu xanh dương
      ctx.fillStyle = '#1976d2';
      ctx.strokeStyle = C.dark;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.arc(pumpX + 20, pumpY + 18, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Cánh quạt bơm đang quay tròn
      ctx.save();
      ctx.translate(pumpX + 20, pumpY + 18);
      ctx.rotate(sec * 12);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.2;
      for (let p = 0; p < 4; p++) {
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(12, 0);
        ctx.stroke();
        ctx.rotate(Math.PI / 2);
      }
      ctx.restore();

      // Ống xả nước cong phun nước ra ngoài
      ctx.strokeStyle = '#78909c';
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.moveTo(pumpX + 32, pumpY + 10);
      ctx.quadraticCurveTo(pumpX + 50, pumpY - 4, pumpX + 58, pumpY + 28);
      ctx.stroke();

      // Tia nước thoát ra từ ống bơm
      ctx.strokeStyle = '#4fc3f7';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(pumpX + 58, pumpY + 28);
      ctx.lineTo(pumpX + 62, pumpY + 48);
      ctx.stroke();

      ctx.restore();
    }

    // 9.4. Gói sáng tạo 4: Cảm biến phao đo mực nước tự động (o.sensor)
    if (opts.sensor) {
      // Cần vươn cảm biến siêu âm chìa ra ngoài mặt sông x: -160..-105, y: -240..-180
      ctx.save();
      const snX = -120;
      const snY = -242;

      // Cần đỡ nhôm chìa ngang
      ctx.strokeStyle = '#37474f';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(-160, snY + 16);
      ctx.lineTo(snX, snY + 16);
      ctx.lineTo(snX, snY + 36);
      ctx.stroke();

      // Khối cảm biến siêu âm hình hộp vuông
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = C.dark;
      ctx.lineWidth = 2;
      ctx.beginPath();
      roundRect(ctx, snX - 14, snY + 36, 28, 18, 3);
      ctx.fill();
      ctx.stroke();

      // Hai mắt phát sóng siêu âm màu vàng hướng xuống nước
      ctx.fillStyle = C.yellow;
      ctx.beginPath();
      ctx.arc(snX - 6, snY + 54, 4, 0, Math.PI * 2);
      ctx.arc(snX + 6, snY + 54, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Các vòng sóng siêu âm phát xuống đo mặt nước
      ctx.strokeStyle = 'rgba(255, 213, 79, 0.85)';
      ctx.lineWidth = 2;
      for (let s = 1; s <= 3; s++) {
        const sw = s * 9;
        const sy = snY + 58 + s * 14 + ((sec * 25) % 14);
        ctx.beginPath();
        ctx.arc(snX, sy, sw, Math.PI * 0.2, Math.PI * 0.8);
        ctx.stroke();
      }

      ctx.restore();
    }

    ctx.restore();
  }

  // =========================================================================
  // 5. CỘT THỦY CHÍ: Đo mực nước lũ có vạch báo động 1, 2, 3 rõ nét cho trẻ em
  // =========================================================================
  function drawWaterLevelMarker(ctx, x, y, level, alert) {
    const curLevel = typeof level === 'number' ? Math.max(0, Math.min(1, level)) : 0.4;
    const alertStage = typeof alert === 'number' ? alert : (curLevel > 0.75 ? 3 : (curLevel > 0.5 ? 2 : 1));

    ctx.save();
    ctx.translate(x, y);

    // Cột thủy chí bằng thép trắng (cao 140px, rộng 22px)
    const poleH = 140;
    const poleW = 24;

    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = C.dark;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    roundRect(ctx, -poleW / 2, -poleH, poleW, poleH, 4);
    ctx.fill();
    ctx.stroke();

    // 3 dải màu cảnh báo cấp lũ: Xanh lá (An toàn), Vàng (Báo động 1), Cam (BĐ 2), Đỏ (BĐ 3)
    // Tầng 1: An toàn (dưới đáy 0..50px)
    ctx.fillStyle = '#81c784';
    ctx.fillRect(-poleW / 2 + 2, -45, poleW - 4, 43);

    // Tầng 2: Báo động 1 (45..85px)
    ctx.fillStyle = '#ffd54f';
    ctx.fillRect(-poleW / 2 + 2, -85, poleW - 4, 38);

    // Tầng 3: Báo động 2 (85..115px)
    ctx.fillStyle = '#ffb74d';
    ctx.fillRect(-poleW / 2 + 2, -115, poleW - 4, 28);

    // Tầng 4: Báo động 3 khẩn cấp (115..138px)
    ctx.fillStyle = '#e57373';
    ctx.fillRect(-poleW / 2 + 2, -poleH + 2, poleW - 4, 23);

    // Các vạch chia độ đen trắng rõ ràng
    ctx.strokeStyle = C.dark;
    ctx.lineWidth = 1.8;
    for (let mark = -10; mark >= -poleH + 10; mark -= 10) {
      const isMajor = mark % 20 === 0;
      ctx.beginPath();
      ctx.moveTo(-poleW / 2, mark);
      ctx.lineTo(-poleW / 2 + (isMajor ? 10 : 6), mark);
      ctx.stroke();
    }

    // Mũi tên đỏ chỉ mực nước hiện tại
    const arrowY = -curLevel * (poleH - 15) - 8;
    ctx.fillStyle = '#d32f2f';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(poleW / 2 + 14, arrowY);
    ctx.lineTo(poleW / 2 + 2, arrowY - 6);
    ctx.lineTo(poleW / 2 + 2, arrowY + 6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Biển số báo động trên đỉnh cột
    ctx.fillStyle = alertStage === 3 ? '#d32f2f' : (alertStage === 2 ? '#f57c00' : '#388e3c');
    ctx.beginPath();
    ctx.arc(0, -poleH - 12, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Số cấp báo động
    ctx.font = '700 13px "Be Vietnam Pro",sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(String(alertStage), 0, -poleH - 11);

    ctx.restore();
  }

  // =========================================================================
  // 6. CẢNH LÀNG QUÊ THANH BÌNH ĐƯỢC BẢO VỆ: Nhà ngói đỏ, lũy tre, cây xanh
  // =========================================================================
  function drawVillage(ctx, x, y, o) {
    const opts = o || {};

    ctx.save();
    ctx.translate(x, y);

    // Bụi tre / vòm cây xanh mát
    ctx.fillStyle = '#2e7d32';
    ctx.strokeStyle = C.dark;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(-22, -18, 16, 0, Math.PI * 2);
    ctx.arc(0, -28, 20, 0, Math.PI * 2);
    ctx.arc(22, -18, 16, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Thân nhà ngói vàng ấm
    ctx.fillStyle = '#ffe082';
    ctx.beginPath();
    roundRect(ctx, -18, -12, 36, 20, 2);
    ctx.fill();
    ctx.stroke();

    // Mái ngói đỏ dốc truyền thống
    ctx.fillStyle = '#d32f2f';
    ctx.beginPath();
    ctx.moveTo(-24, -12);
    ctx.lineTo(0, -26);
    ctx.lineTo(24, -12);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Cửa ra vào màu nâu
    ctx.fillStyle = '#5d4037';
    ctx.fillRect(-5, -4, 10, 12);

    // Cửa sổ vuông nhỏ xinh
    ctx.fillStyle = '#81d4fa';
    ctx.strokeStyle = C.dark;
    ctx.lineWidth = 1.2;
    ctx.strokeRect(7, -8, 6, 6);

    ctx.restore();
  }

  // =========================================================================
  // 7. THUYỀN CỨU HỘ TUẦN TRA ĐÊ: Thuyền phao cam tuần tra an toàn đê điều
  // =========================================================================
  function drawRescueBoat(ctx, x, y, t) {
    const sec = typeof t === 'number' ? t : 0;
    const bob = Math.sin(sec * 3.5) * 3;
    const tilt = Math.cos(sec * 3) * 0.05;

    ctx.save();
    ctx.translate(x, y + bob);
    ctx.rotate(tilt);

    // Thân thuyền cứu hộ màu cam nổi bật
    ctx.fillStyle = '#ff6f00';
    ctx.strokeStyle = C.dark;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(-26, -4);
    ctx.lineTo(24, -4);
    ctx.quadraticCurveTo(34, 0, 28, 10);
    ctx.lineTo(-20, 10);
    ctx.quadraticCurveTo(-30, 4, -26, -4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Dải phao trắng quanh thân thuyền
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    roundRect(ctx, -22, -2, 44, 4.5, 2);
    ctx.fill();

    // Ghế ngồi lái
    ctx.fillStyle = '#37474f';
    ctx.fillRect(-6, -11, 14, 8);

    // Bác bảo vệ / cứu hộ đội mũ cứu hộ vàng
    ctx.fillStyle = C.yellow;
    ctx.beginPath();
    ctx.arc(1, -16, 5.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = C.dark;
    ctx.lineWidth = 1.8;
    ctx.stroke();

    // Lá cờ chữ thập / cờ đỏ sao vàng nhỏ ở đuôi thuyền
    ctx.strokeStyle = C.dark;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-22, -4);
    ctx.lineTo(-22, -22);
    ctx.stroke();

    ctx.fillStyle = '#d32f2f';
    ctx.beginPath();
    ctx.moveTo(-22, -22);
    ctx.lineTo(-10, -17);
    ctx.lineTo(-22, -12);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }

  // =========================================================================
  // 8. CẢM BIẾN CHẠM CHI TIẾT (Standalone Zoom View)
  // =========================================================================
  function drawTouchSensor(ctx, x, y, pressed, scale) {
    const s = typeof scale === 'number' ? scale : 1;
    const isP = !!pressed;

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);

    // Thân cảm biến chạm
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = C.dark;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    roundRect(ctx, -24, -20, 48, 40, 6);
    ctx.fill();
    ctx.stroke();

    // Vùng xanh ngọc trung tâm
    ctx.fillStyle = C.teal;
    ctx.beginPath();
    roundRect(ctx, -18, -14, 36, 28, 4);
    ctx.fill();

    // Nút ấn màu đỏ
    const push = isP ? 4 : 0;
    ctx.fillStyle = isP ? '#c62828' : '#e53935';
    ctx.strokeStyle = C.dark;
    ctx.lineWidth = 2;
    ctx.beginPath();
    roundRect(ctx, -34 + push, -10, 14, 20, [4, 0, 0, 4]);
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }

  // =========================================================================
  // 9. PICS: 4 chuỗi SVG viewBox="0 0 64 48" aria-hidden="true" cho 4 gói sáng tạo
  // =========================================================================
  const PICS = {
    // 1. Còi & đèn báo động lũ
    alarm: '<svg viewBox="0 0 64 48" aria-hidden="true">' +
      '<rect x="22" y="28" width="20" height="15" rx="3" fill="#3dc1dc" stroke="#1e2a34" stroke-width="2"/>' +
      '<rect x="26" y="24" width="12" height="6" fill="#78909c" stroke="#1e2a34" stroke-width="1.6"/>' +
      '<path d="M24 24a8 8 0 0 1 16 0z" fill="#ff1744" stroke="#1e2a34" stroke-width="2"/>' +
      '<circle cx="32" cy="18" r="3" fill="#ffebee"/>' +
      '<path d="M42 16l8-4v12l-8-4z" fill="#37474f" stroke="#1e2a34" stroke-width="1.8"/>' +
      '<path d="M22 16l-8-4v12l8-4z" fill="#37474f" stroke="#1e2a34" stroke-width="1.8"/>' +
      '<path d="M48 10a12 12 0 0 1 0 16M16 10a12 12 0 0 0 0 16" stroke="#ffd23f" stroke-width="2" fill="none" stroke-linecap="round"/>' +
      '</svg>',

    // 2. Lưới chắn rác trôi dạt
    screen: '<svg viewBox="0 0 64 48" aria-hidden="true">' +
      '<rect x="8" y="10" width="48" height="28" rx="4" fill="#cfd8dc" stroke="#1e2a34" stroke-width="2"/>' +
      '<path d="M14 10v28M23 10v28M32 10v28M41 10v28M50 10v28" stroke="#37474f" stroke-width="2.2"/>' +
      '<path d="M8 18h48M8 30h48" stroke="#1e2a34" stroke-width="2"/>' +
      '<rect x="18" y="22" width="20" height="6" rx="2" fill="#8d6e63" stroke="#1e2a34" stroke-width="1.4"/>' +
      '<path d="M42 21c-2-3-6-2-5 2 2 3 6 2 5-2z" fill="#4caf50" stroke="#1e2a34" stroke-width="1.2"/>' +
      '</svg>',

    // 3. Máy bơm thoát nước tiêu úng
    pump: '<svg viewBox="0 0 64 48" aria-hidden="true">' +
      '<rect x="10" y="34" width="44" height="8" rx="2" fill="#607d8b" stroke="#1e2a34" stroke-width="1.8"/>' +
      '<circle cx="26" cy="22" r="14" fill="#1976d2" stroke="#1e2a34" stroke-width="2"/>' +
      '<circle cx="26" cy="22" r="6" fill="#ffffff" stroke="#1e2a34" stroke-width="1.5"/>' +
      '<path d="M36 14c4-3 12-3 16 2v14" fill="none" stroke="#78909c" stroke-width="5" stroke-linecap="round"/>' +
      '<path d="M36 14c4-3 12-3 16 2v14" fill="none" stroke="#1e2a34" stroke-width="2" stroke-linecap="round"/>' +
      '<path d="M52 30v8" stroke="#4fc3f7" stroke-width="3" stroke-linecap="round"/>' +
      '<path d="M48 34l4 4 4-4" stroke="#4fc3f7" stroke-width="2" fill="none"/>' +
      '</svg>',

    // 4. Cảm biến phao đo mực nước tự động
    sensor: '<svg viewBox="0 0 64 48" aria-hidden="true">' +
      '<path d="M12 12h24v10" fill="none" stroke="#37474f" stroke-width="3" stroke-linecap="round"/>' +
      '<rect x="24" y="20" width="24" height="15" rx="3" fill="#ffffff" stroke="#1e2a34" stroke-width="2"/>' +
      '<rect x="28" y="23" width="16" height="9" rx="2" fill="#3dc1dc"/>' +
      '<circle cx="31" cy="35" r="2.5" fill="#ffd23f" stroke="#1e2a34" stroke-width="1.2"/>' +
      '<circle cx="41" cy="35" r="2.5" fill="#ffd23f" stroke="#1e2a34" stroke-width="1.2"/>' +
      '<path d="M28 40a8 8 0 0 0 8 0M24 43a14 14 0 0 0 16 0" fill="none" stroke="#ffd23f" stroke-width="1.8" stroke-linecap="round"/>' +
      '</svg>'
  };

  // Xuất giao diện toàn cục theo quy định
  window.FloodArt = {
    W,
    H,
    GROUND_Y,
    drawBackground,
    drawLevee,
    drawWater,
    drawFloodgate,
    drawWaterLevelMarker,
    drawTouchSensor,
    drawVillage,
    drawRescueBoat,
    PICS
  };

  window.FloodGateArt = window.FloodArt;
  window.LeveeArt = window.FloodArt;
})();
