// Tranh vẽ cảnh biển giông bão và thuyền vượt bão cho Lớp 3 · Bài 9 (chặng ③ và xưởng sáng tạo).
// Hệ toạ độ logic: W = 900, H = 560, WATER_Y = 380.
// Thân thiện với học sinh tiểu học, màu sắc tương phản cao, viền nét đậm #1e2a34.
// Không dùng ảnh ngoài, font ngoài, hay Math.random() trong khi vẽ (hoàn toàn tất định theo t).
(function () {
  'use strict';

  const W = 900;
  const H = 560;
  const WATER_Y = 380;

  // Bảng màu chuẩn của mô hình và phong cách Lab-HappySteam
  const C = {
    dark: '#1e2a34',
    darkSoft: '#2d3842',
    white: '#ffffff',
    teal: '#3dc1dc',
    tealDark: '#0e6f8a',
    tealLight: '#8ee6f5',
    tealPale: '#eaf6fb',
    yellow: '#ffd23f',
    yellowLight: '#fff2a8',
    orange: '#ff8a3d',
    orangeDark: '#d9651a',
    red: '#e53935',
    redDark: '#b71c1c',
    green: '#8cc152',
    greenDark: '#558b2f',
    gray: '#9aa7b4',
    grayLight: '#e4ebf0',
    wood: '#a06a38',
    woodDark: '#6b4421',
    rock: '#475569',
    rockDark: '#334155',
    seaClearTop: '#4fa9d8',
    seaClearMid: '#2980b9',
    seaClearDeep: '#1b4f72',
    seaStormTop: '#34495e',
    seaStormMid: '#243342',
    seaStormDeep: '#16202a',
    foam: '#ffffff'
  };

  // Hàm vẽ hình chữ nhật bo góc tương thích mọi trình duyệt
  function roundRect(ctx, x, y, w, h, r) {
    if (typeof ctx.roundRect === 'function') {
      ctx.roundRect(x, y, w, h, r);
      return;
    }
    let tl = 0, tr = 0, br = 0, bl = 0;
    if (Array.isArray(r)) {
      if (r.length === 1) tl = tr = br = bl = r[0];
      else if (r.length === 2) { tl = br = r[0]; tr = bl = r[1]; }
      else if (r.length >= 4) { tl = r[0]; tr = r[1]; br = r[2]; bl = r[3]; }
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

  // Tính chiều cao mặt nước tất định theo toạ độ x và thời gian t
  function waterY(x, t, isStorm) {
    const k = isStorm ? 1.85 : 1.0;
    const wave1 = Math.sin(x * 0.016 + t * (isStorm ? 3.6 : 2.1)) * 6.5 * k;
    const wave2 = Math.sin(x * 0.038 - t * (isStorm ? 2.4 : 1.3) + 1.2) * 3.8 * k;
    const wave3 = Math.cos(x * 0.008 + t * 0.7) * 2.2 * k;
    return WATER_Y + wave1 + wave2 + wave3;
  }

  // Tính độ nghiêng mặt nước (radian) tại toạ độ x
  function waterAngle(x, t, isStorm) {
    const dx = 6;
    const y0 = waterY(x - dx, t, isStorm);
    const y1 = waterY(x + dx, t, isStorm);
    return Math.atan2(y1 - y0, dx * 2);
  }

  // Dữ liệu đám mây trôi trời quang
  const CLEAR_CLOUDS = [
    { x0: 70, y: 70, s: 1.1, sp: 9 },
    { x0: 290, y: 55, s: 0.85, sp: 7 },
    { x0: 520, y: 85, s: 1.25, sp: 11 },
    { x0: 760, y: 60, s: 0.95, sp: 8 }
  ];

  // Dữ liệu mây giông cuộn trời bão
  const STORM_CLOUDS = [
    { x0: 40, y: 80, s: 1.4, sp: 24 },
    { x0: 260, y: 65, s: 1.6, sp: 28 },
    { x0: 490, y: 95, s: 1.8, sp: 32 },
    { x0: 720, y: 75, s: 1.5, sp: 26 }
  ];

  // Dữ liệu mưa rơi xiên trong bão (36 giọt cố định dựa trên vị trí index)
  const RAIN_DROPS = [];
  for (let i = 0; i < 48; i++) {
    RAIN_DROPS.push({
      xBase: (i * 37 + 13) % W,
      yBase: (i * 29 + 17) % (WATER_Y + 40),
      len: 18 + (i % 5) * 4,
      spd: 340 + (i % 7) * 40
    });
  }

  // Vẽ bầu trời, mặt trời/chớp, mây, núi xa và hiệu ứng thời tiết
  function drawBackground(ctx, t, weather, stormProgress) {
    const isStorm = weather === 'storm';
    const stP = stormProgress !== undefined ? stormProgress : (isStorm ? 1 : 0);

    // 1. Nền bầu trời
    if (stP <= 0) {
      // Trời quang xanh trong vắt
      const skyGrad = ctx.createLinearGradient(0, 0, 0, WATER_Y);
      skyGrad.addColorStop(0, '#75c8f2');
      skyGrad.addColorStop(0.65, '#bfe5f8');
      skyGrad.addColorStop(1, '#e8f6fd');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, W, H);
    } else if (stP >= 1) {
      // Bão giông u ám sấm sét
      const stormGrad = ctx.createLinearGradient(0, 0, 0, WATER_Y);
      stormGrad.addColorStop(0, '#16222f');
      stormGrad.addColorStop(0.55, '#283848');
      stormGrad.addColorStop(1, '#3b4f63');
      ctx.fillStyle = stormGrad;
      ctx.fillRect(0, 0, W, H);
    } else {
      // Chuyển mùa mượt mà
      const skyGrad = ctx.createLinearGradient(0, 0, 0, WATER_Y);
      skyGrad.addColorStop(0, '#75c8f2');
      skyGrad.addColorStop(1, '#e8f6fd');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, W, H);

      ctx.save();
      ctx.globalAlpha = stP;
      const stormGrad = ctx.createLinearGradient(0, 0, 0, WATER_Y);
      stormGrad.addColorStop(0, '#16222f');
      stormGrad.addColorStop(1, '#3b4f63');
      ctx.fillStyle = stormGrad;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }

    // 2. Mặt trời ấm áp khi trời quang
    if (stP < 0.9) {
      ctx.save();
      ctx.globalAlpha = 1 - stP;
      const sunX = 170, sunY = 95;
      // Vầng hào quang
      const sunGlow = ctx.createRadialGradient(sunX, sunY, 15, sunX, sunY, 65);
      sunGlow.addColorStop(0, 'rgba(255, 225, 90, 0.55)');
      sunGlow.addColorStop(1, 'rgba(255, 225, 90, 0)');
      ctx.fillStyle = sunGlow;
      ctx.beginPath();
      ctx.arc(sunX, sunY, 65, 0, Math.PI * 2);
      ctx.fill();
      // Quả cầu mặt trời
      ctx.fillStyle = C.yellow;
      ctx.strokeStyle = '#e6b31e';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(sunX, sunY, 26, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      // Tia nắng xoay nhẹ
      ctx.strokeStyle = 'rgba(255, 210, 63, 0.7)';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      for (let i = 0; i < 8; i++) {
        const a = (i * Math.PI) / 4 + t * 0.15;
        ctx.beginPath();
        ctx.moveTo(sunX + Math.cos(a) * 32, sunY + Math.sin(a) * 32);
        ctx.lineTo(sunX + Math.cos(a) * 44, sunY + Math.sin(a) * 44);
        ctx.stroke();
      }
      ctx.restore();
    }

    // 3. Núi đảo xa chân trời
    ctx.save();
    ctx.fillStyle = isStorm ? '#304152' : '#7ba8b5';
    ctx.beginPath();
    ctx.moveTo(0, WATER_Y);
    ctx.lineTo(0, WATER_Y - 35);
    ctx.bezierCurveTo(90, WATER_Y - 70, 160, WATER_Y - 20, 240, WATER_Y - 45);
    ctx.bezierCurveTo(320, WATER_Y - 68, 410, WATER_Y - 25, 490, WATER_Y - 50);
    ctx.bezierCurveTo(570, WATER_Y - 75, 680, WATER_Y - 30, 760, WATER_Y - 60);
    ctx.bezierCurveTo(820, WATER_Y - 80, 870, WATER_Y - 45, W, WATER_Y - 38);
    ctx.lineTo(W, WATER_Y);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // 4. Mây trôi
    if (stP < 0.8) {
      // Mây trắng mềm mại
      ctx.save();
      ctx.globalAlpha = 1 - stP;
      ctx.fillStyle = C.white;
      ctx.strokeStyle = 'rgba(30, 42, 52, 0.2)';
      ctx.lineWidth = 2;
      for (let i = 0; i < CLEAR_CLOUDS.length; i++) {
        const c = CLEAR_CLOUDS[i];
        const cx = (c.x0 + t * c.sp) % (W + 200) - 100;
        drawSingleCloud(ctx, cx, c.y, c.s, C.white, 'rgba(30,42,52,0.18)');
      }
      ctx.restore();
    }

    // 5. Mây bão đen cuồn cuộn & chớp giật
    if (stP > 0.1) {
      ctx.save();
      ctx.globalAlpha = stP;
      for (let i = 0; i < STORM_CLOUDS.length; i++) {
        const c = STORM_CLOUDS[i];
        const cx = (c.x0 + t * c.sp) % (W + 260) - 130;
        drawSingleCloud(ctx, cx, c.y, c.s, '#263442', '#141c24');
      }

      // Tia chớp ngẫu nhiên theo chu kỳ định sẵn (không dùng Math.random)
      // Cứ mỗi 4.2 giây có một đợt chớp kéo dài 0.25 giây
      const stormCycle = t % 4.5;
      if (stormCycle > 3.8 && stormCycle < 4.15) {
        // Chớp sáng bầu trời
        ctx.fillStyle = 'rgba(235, 245, 255, 0.35)';
        ctx.fillRect(0, 0, W, WATER_Y);
        // Vẽ tia sét ngoằn ngoèo
        drawLightning(ctx, 360, 40, 410, WATER_Y - 40);
        drawLightning(ctx, 620, 30, 670, WATER_Y - 60);
      }

      // Mưa xiên mạnh mẽ
      drawRain(ctx, t);
      ctx.restore();
    }
  }

  // Vẽ một cụm mây tròn phồng thân thiện
  function drawSingleCloud(ctx, cx, cy, scale, fillColor, strokeColor) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);
    ctx.fillStyle = fillColor;
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(0, 0, 22, 0, Math.PI * 2);
    ctx.arc(22, -8, 26, 0, Math.PI * 2);
    ctx.arc(48, -4, 21, 0, Math.PI * 2);
    ctx.arc(66, 4, 16, 0, Math.PI * 2);
    ctx.arc(26, 12, 20, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  // Vẽ tia chớp gãy khúc
  function drawLightning(ctx, x1, y1, x2, y2) {
    ctx.save();
    ctx.strokeStyle = C.yellow;
    ctx.lineWidth = 3.5;
    ctx.shadowColor = C.yellowLight;
    ctx.shadowBlur = 14;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'miter';
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    const midX1 = (x1 + x2) * 0.45 + 18;
    const midY1 = (y1 + y2) * 0.4;
    const midX2 = (x1 + x2) * 0.55 - 16;
    const midY2 = (y1 + y2) * 0.7;
    ctx.lineTo(midX1, midY1);
    ctx.lineTo(midX2, midY2);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    // Nhánh phụ nhỏ
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(midX1, midY1);
    ctx.lineTo(midX1 + 24, midY1 + 18);
    ctx.stroke();
    ctx.restore();
  }

  // Vẽ các giọt mưa rào xiên
  function drawRain(ctx, t) {
    ctx.save();
    ctx.strokeStyle = 'rgba(215, 235, 255, 0.65)';
    ctx.lineWidth = 1.8;
    ctx.lineCap = 'round';
    const angle = 0.35; // nghiêng theo gió
    const dx = Math.sin(angle);
    const dy = Math.cos(angle);

    for (let i = 0; i < RAIN_DROPS.length; i++) {
      const drop = RAIN_DROPS[i];
      const y = (drop.yBase + t * drop.spd) % (WATER_Y + 100);
      const x = (drop.xBase + t * (drop.spd * 0.4)) % W;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + dx * drop.len, y + dy * drop.len);
      ctx.stroke();
    }
    ctx.restore();
  }

  // Vẽ các lớp sóng biển đại dương
  function drawSea(ctx, t, weather) {
    const isStorm = weather === 'storm';

    // 1. Lớp sóng xa (tầng sâu chân trời)
    ctx.save();
    const seaFarGrad = ctx.createLinearGradient(0, WATER_Y - 20, 0, H);
    seaFarGrad.addColorStop(0, isStorm ? '#223547' : '#2980b9');
    seaFarGrad.addColorStop(1, isStorm ? '#121c26' : '#154360');
    ctx.fillStyle = seaFarGrad;
    ctx.beginPath();
    ctx.moveTo(0, H);
    ctx.lineTo(0, waterY(0, t, isStorm) - 8);
    for (let x = 15; x <= W; x += 15) {
      ctx.lineTo(x, waterY(x, t, isStorm) - 6);
    }
    ctx.lineTo(W, H);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // 2. Lớp sóng giữa (lớp thân chính)
    ctx.save();
    const seaMidGrad = ctx.createLinearGradient(0, WATER_Y, 0, H);
    seaMidGrad.addColorStop(0, isStorm ? '#1e2b38' : '#3498db');
    seaMidGrad.addColorStop(0.4, isStorm ? '#16222d' : '#21618c');
    seaMidGrad.addColorStop(1, isStorm ? '#0c1319' : '#0e3146');
    ctx.fillStyle = seaMidGrad;
    ctx.beginPath();
    ctx.moveTo(0, H);
    ctx.lineTo(0, waterY(0, t, isStorm));
    for (let x = 12; x <= W; x += 12) {
      ctx.lineTo(x, waterY(x, t, isStorm));
    }
    ctx.lineTo(W, H);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // 3. Đường viền bọt sóng trắng cuộn trên mặt biển
    ctx.save();
    ctx.strokeStyle = isStorm ? 'rgba(255, 255, 255, 0.85)' : 'rgba(255, 255, 255, 0.7)';
    ctx.lineWidth = isStorm ? 3.8 : 2.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, waterY(0, t, isStorm));
    for (let x = 12; x <= W; x += 12) {
      ctx.lineTo(x, waterY(x, t, isStorm));
    }
    ctx.stroke();

    // Bọt sóng lăn tăn hình vòm
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    for (let i = 0; i < 18; i++) {
      const bx = (i * 53 + t * (isStorm ? 60 : 30)) % W;
      const by = waterY(bx, t, isStorm) + 4;
      ctx.beginPath();
      ctx.ellipse(bx, by, 8 + (i % 4) * 3, 2.5, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // Vẽ bến cảng: isStart = true (Bến xuất phát gỗ), false (Bến cảng an toàn đá)
  function drawPort(ctx, x, y, isStart) {
    ctx.save();
    if (isStart) {
      // Bến xuất phát bằng gỗ
      const pierW = 100;
      const pierH = 80;
      const px = x - 20;

      // Cọc gỗ cắm xuống nước
      ctx.fillStyle = C.woodDark;
      ctx.strokeStyle = C.dark;
      ctx.lineWidth = 2.2;
      for (const cx of [px + 15, px + 50, px + 85]) {
        ctx.beginPath();
        roundRect(ctx, cx, y - 10, 14, pierH + 20, [3, 3, 0, 0]);
        ctx.fill();
        ctx.stroke();
      }

      // Mặt cầu tàu bằng gỗ
      ctx.fillStyle = C.wood;
      ctx.beginPath();
      roundRect(ctx, px, y - 22, pierW, 18, 4);
      ctx.fill();
      ctx.stroke();

      // Cọc bích neo tàu
      ctx.fillStyle = C.darkSoft;
      ctx.beginPath();
      roundRect(ctx, px + 80, y - 36, 12, 16, [4, 4, 1, 1]);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(px + 86, y - 36, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Cột cờ bến cảng
      ctx.strokeStyle = C.dark;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(px + 20, y - 22);
      ctx.lineTo(px + 20, y - 85);
      ctx.stroke();
      // Lá cờ xanh lá báo an toàn xuất phát
      ctx.fillStyle = C.green;
      ctx.beginPath();
      ctx.moveTo(px + 20, y - 85);
      ctx.lineTo(px + 52, y - 72);
      ctx.lineTo(px + 20, y - 59);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Phao cứu sinh treo ở cọc
      ctx.fillStyle = C.white;
      ctx.strokeStyle = C.dark;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(px + 52, y - 4, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = C.orange;
      ctx.beginPath();
      ctx.arc(px + 52, y - 4, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Nhãn "XUẤT PHÁT"
      ctx.fillStyle = C.white;
      ctx.strokeStyle = C.dark;
      ctx.lineWidth = 3.5;
      ctx.font = '800 13px "Be Vietnam Pro","Segoe UI",sans-serif';
      ctx.textAlign = 'center';
      ctx.strokeText('XUẤT PHÁT', px + 50, y + 36);
      ctx.fillText('XUẤT PHÁT', px + 50, y + 36);
    } else {
      // Bến cảng đích đến kiên cố (30 m)
      const dockW = 110;
      const px = x - 10;

      // Khối bờ đá bê tông
      ctx.fillStyle = '#64748b';
      ctx.strokeStyle = C.dark;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      roundRect(ctx, px, y - 28, dockW, 110, [6, 6, 0, 0]);
      ctx.fill();
      ctx.stroke();

      // Vạch cảnh báo mép cảng sọc vàng-đen
      ctx.save();
      ctx.beginPath();
      roundRect(ctx, px, y - 28, dockW, 12, [6, 6, 0, 0]);
      ctx.clip();
      ctx.fillStyle = C.yellow;
      ctx.fillRect(px, y - 28, dockW, 12);
      ctx.fillStyle = C.dark;
      for (let i = 0; i < dockW; i += 18) {
        ctx.beginPath();
        ctx.moveTo(px + i, y - 28);
        ctx.lineTo(px + i + 10, y - 28);
        ctx.lineTo(px + i - 2, y - 16);
        ctx.lineTo(px + i - 12, y - 16);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();

      // Đèn hoa tiêu cảng
      ctx.fillStyle = C.teal;
      ctx.strokeStyle = C.dark;
      ctx.lineWidth = 2;
      ctx.beginPath();
      roundRect(ctx, px + 22, y - 62, 16, 34, 4);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = C.green;
      ctx.beginPath();
      ctx.arc(px + 30, y - 70, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Chữ "CẢNG ĐÍCH"
      ctx.fillStyle = C.yellow;
      ctx.strokeStyle = C.dark;
      ctx.lineWidth = 3.5;
      ctx.font = '800 13px "Be Vietnam Pro","Segoe UI",sans-serif';
      ctx.textAlign = 'center';
      ctx.strokeText('CẢNG ĐÍCH (30m)', px + 52, y + 28);
      ctx.fillText('CẢNG ĐÍCH (30m)', px + 52, y + 28);
    }
    ctx.restore();
  }

  // Vẽ ngọn hải đăng cao lớn tại bờ cảng đích
  function drawLighthouse(ctx, x, y, t) {
    ctx.save();
    const lhW = 46;
    const lhH = 145;
    const topY = y - lhH;

    // Chùm sáng quét từ đỉnh hải đăng
    ctx.save();
    const beamAngle = t * 1.35;
    const beamDir = Math.sin(beamAngle);
    const gradBeam = ctx.createRadialGradient(x, topY + 12, 5, x - 180 * beamDir, topY + 30, 240);
    gradBeam.addColorStop(0, 'rgba(255, 230, 80, 0.7)');
    gradBeam.addColorStop(0.5, 'rgba(255, 230, 80, 0.25)');
    gradBeam.addColorStop(1, 'rgba(255, 230, 80, 0)');
    ctx.fillStyle = gradBeam;
    ctx.beginPath();
    ctx.moveTo(x, topY + 12);
    ctx.lineTo(x - 260 * beamDir, topY - 30);
    ctx.lineTo(x - 260 * beamDir, topY + 70);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Thân tháp hải đăng hình chóp cụt vát
    const bW = lhW;
    const tW = lhW * 0.65;
    ctx.beginPath();
    ctx.moveTo(x - bW / 2, y);
    ctx.lineTo(x - tW / 2, topY + 28);
    ctx.lineTo(x + tW / 2, topY + 28);
    ctx.lineTo(x + bW / 2, y);
    ctx.closePath();
    ctx.fillStyle = C.white;
    ctx.fill();

    // Các khoang sọc đỏ trắng đặc trưng
    ctx.save();
    ctx.clip();
    ctx.fillStyle = C.red;
    ctx.fillRect(x - bW, y - 36, bW * 2, 28);
    ctx.fillRect(x - bW, y - 92, bW * 2, 28);
    ctx.restore();

    // Viền thân tháp
    ctx.strokeStyle = C.dark;
    ctx.lineWidth = 2.6;
    ctx.stroke();

    // Đài quan sát + lan can
    ctx.fillStyle = C.dark;
    ctx.beginPath();
    roundRect(ctx, x - tW / 2 - 6, topY + 24, tW + 12, 6, 2);
    ctx.fill();
    ctx.stroke();

    // Lồng đèn kính
    ctx.fillStyle = C.yellowLight;
    ctx.beginPath();
    roundRect(ctx, x - tW / 2, topY + 6, tW, 18, 3);
    ctx.fill();
    ctx.stroke();

    // Quả đèn sáng bên trong
    ctx.fillStyle = C.yellow;
    ctx.beginPath();
    ctx.arc(x, topY + 15, 6, 0, Math.PI * 2);
    ctx.fill();

    // Mái vòm nóc ngọn hải đăng
    ctx.fillStyle = C.red;
    ctx.beginPath();
    ctx.arc(x, topY + 6, tW / 2 + 2, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Cột thu lôi trên đỉnh nóc
    ctx.strokeStyle = C.dark;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, topY + 6 - (tW / 2 + 2));
    ctx.lineTo(x, topY - 14);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x, topY - 14, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = C.yellow;
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }

  // Vẽ bãi đá ngầm lởm chởm và sóng va đập sủi bọt
  function drawReef(ctx, x0, x1, y, t) {
    ctx.save();
    const midX = (x0 + x1) / 2;
    const rW = x1 - x0;

    // Các mỏm đá ngầm nhô lên
    const rocks = [
      { rx: x0 + rW * 0.18, ry: y - 16, rw: 38, rh: 32, peak: -24 },
      { rx: x0 + rW * 0.46, ry: y - 22, rw: 48, rh: 40, peak: -32 },
      { rx: x0 + rW * 0.76, ry: y - 18, rw: 42, rh: 34, peak: -26 }
    ];

    for (let i = 0; i < rocks.length; i++) {
      const r = rocks[i];
      ctx.fillStyle = C.rock;
      ctx.strokeStyle = C.dark;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(r.rx - r.rw / 2, r.ry + r.rh);
      ctx.lineTo(r.rx - r.rw * 0.35, r.ry);
      ctx.lineTo(r.rx, r.ry + r.peak);
      ctx.lineTo(r.rx + r.rw * 0.38, r.ry - 4);
      ctx.lineTo(r.rx + r.rw / 2, r.ry + r.rh);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Mảng rêu bám xanh sẫm
      ctx.fillStyle = C.greenDark;
      ctx.beginPath();
      ctx.arc(r.rx - 4, r.ry + 2, 7, 0, Math.PI * 2);
      ctx.arc(r.rx + 8, r.ry + 6, 6, 0, Math.PI * 2);
      ctx.fill();
    }

    // Phao tiêu cảnh báo đá ngầm (sọc đỏ - trắng hình chóp)
    const buoyX = midX;
    const buoyY = y - 10 + Math.sin(t * 3.5) * 4;
    ctx.fillStyle = C.white;
    ctx.strokeStyle = C.dark;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(buoyX - 10, buoyY + 8);
    ctx.lineTo(buoyX, buoyY - 26);
    ctx.lineTo(buoyX + 10, buoyY + 8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Sọc đỏ cảnh báo trên phao
    ctx.fillStyle = C.red;
    ctx.beginPath();
    ctx.moveTo(buoyX - 6, buoyY - 4);
    ctx.lineTo(buoyX, buoyY - 20);
    ctx.lineTo(buoyX + 6, buoyY - 4);
    ctx.closePath();
    ctx.fill();

    // Đèn nháy cảnh báo đỏ trên đỉnh phao
    ctx.fillStyle = Math.sin(t * 6) > 0 ? C.red : C.yellow;
    ctx.beginPath();
    ctx.arc(buoyX, buoyY - 28, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Bọt sóng đánh trắng xóa vào chân đá ngầm
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    for (let j = 0; j < 6; j++) {
      const fx = x0 + 12 + j * (rW / 5.5) + Math.sin(t * 4 + j) * 4;
      const fy = y + 2 + Math.cos(t * 5 + j) * 3;
      ctx.beginPath();
      ctx.arc(fx, fy, 7 + (j % 3) * 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Nhãn báo nguy hiểm
    ctx.fillStyle = C.yellow;
    ctx.strokeStyle = C.dark;
    ctx.lineWidth = 3.5;
    ctx.font = '800 13px "Be Vietnam Pro","Segoe UI",sans-serif';
    ctx.textAlign = 'center';
    ctx.strokeText('BÃI ĐÁ NGẦM (20–27m)', midX, y + 42);
    ctx.fillText('BÃI ĐÁ NGẦM (20–27m)', midX, y + 42);

    ctx.restore();
  }

  // Vẽ phao cứu sinh / phao biển chỉ dẫn nổi nhấp nhô
  function drawBuoy(ctx, x, y, t) {
    ctx.save();
    const by = y + Math.sin(t * 3.2) * 4.5;
    const rot = Math.cos(t * 2.8) * 0.12;

    ctx.translate(x, by);
    ctx.rotate(rot);

    // Vành phao tròn màu cam - trắng
    ctx.fillStyle = C.orange;
    ctx.strokeStyle = C.dark;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.ellipse(0, 0, 16, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = C.white;
    ctx.beginPath();
    ctx.ellipse(0, 0, 8, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Cột cờ tiêu trên phao
    ctx.strokeStyle = C.dark;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -22);
    ctx.stroke();

    ctx.fillStyle = C.yellow;
    ctx.beginPath();
    ctx.arc(0, -24, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }

  // =========================================================================
  // VẼ MÔ HÌNH CHÍNH: THUYỀN VƯỢT BÃO (LỚP 3 · BÀI 9)
  // (x, y) = vị trí đáy thuyền trên mặt nước; angle = góc nghiêng mặt nước (rad);
  // o = { wheel, tilt, shake, crashed, crashWhy, sink, float, light, sail, moving, t }
  // =========================================================================
  function drawBoat(ctx, x, y, angle, o) {
    o = o || {};
    const wheelAngle = o.wheel || 0;
    const tiltDeg = o.tilt || 0;
    const tiltRad = (tiltDeg * Math.PI) / 180;
    const totalAngle = (angle || 0) + tiltRad;
    const shakeAmt = (o.shake || 0) * 8;
    const sx = shakeAmt ? (Math.sin((o.t || 0) * 50) * shakeAmt) : 0;
    const sy = shakeAmt ? (Math.cos((o.t || 0) * 45) * shakeAmt) : 0;
    const isSunk = !!o.crashed;
    const sinkProgress = o.sink !== undefined ? o.sink : (isSunk ? 1 : 0);
    const sinkY = sinkProgress * 32;

    ctx.save();
    // Dịch chuyển tới tâm thuyền và xoay theo độ nghiêng
    ctx.translate(x + sx, y + sy + sinkY);
    ctx.rotate(isSunk && o.crashWhy === 'wave' ? Math.max(totalAngle, 0.75) : totalAngle);

    // Kích thước chính của thuyền: dài 140px, cao 76px
    // Tâm (0, 0) đặt tại đáy thuyền giữa hai cụm bánh/guồng nước

    // 1. Vệt bọt nước phía sau khi thuyền đang chạy (wake)
    if (o.moving && !isSunk) {
      ctx.save();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
      const t = o.t || 0;
      for (let i = 0; i < 4; i++) {
        const wx = -75 - i * 14 - Math.sin(t * 8 + i) * 6;
        const wy = 4 + Math.cos(t * 9 + i) * 3;
        ctx.beginPath();
        ctx.arc(wx, wy, 5 + i * 2.2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // 2. Chân vịt / bánh guồng nước quay ở đuôi thuyền (x = -68, y = 2)
    ctx.save();
    ctx.translate(-66, -2);
    ctx.fillStyle = C.tealDark;
    ctx.strokeStyle = C.dark;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Nan hoa quay theo o.wheel
    ctx.rotate(wheelAngle);
    ctx.strokeStyle = C.white;
    ctx.lineWidth = 2.4;
    for (let i = 0; i < 4; i++) {
      const a = (i * Math.PI) / 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(a) * 9, Math.sin(a) * 9);
      ctx.stroke();
    }
    // Trục trung tâm
    ctx.fillStyle = C.yellow;
    ctx.beginPath();
    ctx.arc(0, 0, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // 3. Khung đế & Đáy thuyền (Hull): dáng vát thể thao, mũi hướng sang PHẢI
    // Mũi nhọn vươn tới x = +70, đuôi vuông ở x = -68
    ctx.save();
    // Đáy lườn thuyền đỏ đậm
    ctx.fillStyle = C.red;
    ctx.strokeStyle = C.dark;
    ctx.lineWidth = 2.6;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(-65, -8);
    ctx.lineTo(45, -8);
    ctx.lineTo(72, -18); // mũi thuyền vát nhọn ngóc lên
    ctx.lineTo(58, 4);
    ctx.lineTo(-58, 4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Mạn thuyền chính (Thân trắng có dải màu xanh ngọc teal)
    ctx.fillStyle = C.white;
    ctx.beginPath();
    ctx.moveTo(-65, -8);
    ctx.lineTo(-65, -28);
    ctx.lineTo(38, -28);
    ctx.lineTo(68, -18);
    ctx.lineTo(45, -8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Dải sơn xanh ngọc nổi bật dọc mạn thuyền
    ctx.fillStyle = C.teal;
    ctx.beginPath();
    ctx.moveTo(-64, -20);
    ctx.lineTo(42, -20);
    ctx.lineTo(56, -14);
    ctx.lineTo(-64, -14);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Khối động cơ M1 (khối trắng viền đen) ở đuôi tàu (x = -56..-28, y = -46..-28)
    ctx.fillStyle = C.white;
    ctx.beginPath();
    roundRect(ctx, -56, -46, 26, 18, 3);
    ctx.fill();
    ctx.stroke();
    // Mặt động cơ xanh ngọc
    ctx.fillStyle = C.teal;
    ctx.beginPath();
    roundRect(ctx, -52, -42, 18, 10, 2);
    ctx.fill();

    // Hộp bộ não SmartHub / M5-RCU ở thân giữa (x = -26..+20, y = -48..-28)
    ctx.fillStyle = C.white;
    ctx.beginPath();
    roundRect(ctx, -26, -50, 48, 22, 4);
    ctx.fill();
    ctx.stroke();

    // 3 nút bấm tròn trên bộ não (vàng, xanh, đỏ)
    const btnColors = [C.yellow, C.teal, C.green];
    for (let b = 0; b < 3; b++) {
      ctx.fillStyle = btnColors[b];
      ctx.beginPath();
      ctx.arc(-14 + b * 14, -39, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    // Buồng lái kính (Cabin) bo góc xanh ngọc nhạt
    ctx.fillStyle = C.tealPale;
    ctx.beginPath();
    roundRect(ctx, -20, -68, 36, 18, [5, 5, 2, 2]);
    ctx.fill();
    ctx.stroke();
    // Vết phản quang kính buồng lái
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.beginPath();
    ctx.moveTo(-14, -65);
    ctx.lineTo(-6, -65);
    ctx.lineTo(-12, -53);
    ctx.lineTo(-18, -53);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // 4. Cột buồm và Buồm chính (Cánh trắng khí động học BP-7017/BP-7018)
    ctx.save();
    // Cột buồm chính đứng tại x = 2
    ctx.strokeStyle = C.dark;
    ctx.lineWidth = 3.2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(2, -48);
    ctx.lineTo(2, -118);
    ctx.stroke();

    // Cánh buồm chính màu trắng viền đen uốn cong đón gió
    ctx.fillStyle = C.white;
    ctx.strokeStyle = C.dark;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(2, -114);
    ctx.bezierCurveTo(24, -98, 28, -74, 2, -54);
    ctx.lineTo(2, -114);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Họa tiết dải xanh ngọc trên cánh buồm
    ctx.fillStyle = C.teal;
    ctx.beginPath();
    ctx.moveTo(2, -88);
    ctx.bezierCurveTo(18, -82, 20, -74, 2, -68);
    ctx.closePath();
    ctx.fill();

    // Lá cờ đuôi nheo đỏ bay trên đỉnh cột buồm
    const flagWave = Math.sin((o.t || 0) * 9) * 4;
    ctx.fillStyle = C.red;
    ctx.beginPath();
    ctx.moveTo(2, -118);
    ctx.lineTo(-24, -125 + flagWave);
    ctx.lineTo(-16, -118);
    ctx.lineTo(-24, -111 + flagWave);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // 5. Gói sáng tạo 1: PHAO THĂNG BẰNG HAI BÊN (o.float)
    if (o.float) {
      ctx.save();
      // Thanh nối xanh ngọc từ thân ra phao
      ctx.fillStyle = C.teal;
      ctx.strokeStyle = C.dark;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      roundRect(ctx, -48, -14, 88, 6, 2);
      ctx.fill();
      ctx.stroke();

      // Phao cam lớn nổi hai bên thân (màu cam an toàn chống lật)
      for (const px of [-48, 36]) {
        ctx.fillStyle = C.orange;
        ctx.strokeStyle = C.dark;
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        roundRect(ctx, px - 12, -4, 26, 11, 5);
        ctx.fill();
        ctx.stroke();
        // Sọc trắng phản quang trên phao
        ctx.fillStyle = C.white;
        ctx.fillRect(px - 3, -4, 7, 11);
        ctx.strokeRect(px - 3, -4, 7, 11);
      }
      ctx.restore();
    }

    // 6. Gói sáng tạo 2: ĐÈN DẪN ĐƯỜNG MŨI THUYỀN (o.light)
    if (o.light) {
      ctx.save();
      const lx = 70, ly = -18;
      // Chùm sáng vàng rực hình quạt chiếu thẳng về phía trước
      const lightGrad = ctx.createRadialGradient(lx, ly, 4, lx + 120, ly + 15, 140);
      lightGrad.addColorStop(0, 'rgba(255, 230, 80, 0.85)');
      lightGrad.addColorStop(0.5, 'rgba(255, 230, 80, 0.35)');
      lightGrad.addColorStop(1, 'rgba(255, 230, 80, 0)');
      ctx.fillStyle = lightGrad;
      ctx.beginPath();
      ctx.moveTo(lx, ly);
      ctx.lineTo(lx + 150, ly - 35);
      ctx.lineTo(lx + 150, ly + 55);
      ctx.closePath();
      ctx.fill();

      // Cụm đèn pha tròn màu vàng gắn ở mũi
      ctx.fillStyle = C.yellow;
      ctx.strokeStyle = C.dark;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.arc(lx, ly, 6.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = C.white;
      ctx.beginPath();
      ctx.arc(lx + 2, ly - 2, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 7. Gói sáng tạo 3: BUỒM THÊM (o.sail)
    if (o.sail) {
      ctx.save();
      // Cánh buồm phụ đón gió dựng phía trước cột buồm chính
      ctx.fillStyle = C.white;
      ctx.strokeStyle = C.dark;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(4, -105);
      ctx.bezierCurveTo(34, -90, 42, -58, 38, -32);
      ctx.lineTo(4, -48);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Đường gân tăng cứng buồm
      ctx.strokeStyle = C.tealDark;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(4, -78);
      ctx.lineTo(34, -62);
      ctx.stroke();
      ctx.restore();
    }

    // 8. Hiệu ứng va chạm / chìm / sao choáng
    if (isSunk) {
      ctx.save();
      // Vệt nứt vỏ thuyền
      ctx.strokeStyle = C.redDark;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(48, -12);
      ctx.lineTo(58, -2);
      ctx.lineTo(52, 4);
      ctx.stroke();

      // Bọt nước sủi ục ục xung quanh thân chìm
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      for (let s = 0; s < 5; s++) {
        ctx.beginPath();
        ctx.arc(-30 + s * 18, -16 - (s % 3) * 6, 4 + (s % 3) * 2, 0, Math.PI * 2);
        ctx.fill();
      }

      // Ngôi sao choáng váng SOS
      ctx.fillStyle = C.yellow;
      ctx.strokeStyle = C.dark;
      ctx.lineWidth = 1.8;
      for (const sp of [[-10, -78], [25, -60], [50, -42]]) {
        drawStar(ctx, sp[0], sp[1], 5, 8, 4);
      }
      ctx.restore();
    }

    ctx.restore();
  }

  // Vẽ hình ngôi sao 5 cánh nhỏ
  function drawStar(ctx, cx, cy, spikes, outerRadius, innerRadius) {
    let rot = (Math.PI / 2) * 3;
    let x = cx;
    let y = cy;
    const step = Math.PI / spikes;
    ctx.beginPath();
    ctx.moveTo(cx, cy - outerRadius);
    for (let i = 0; i < spikes; i++) {
      x = cx + Math.cos(rot) * outerRadius;
      y = cy + Math.sin(rot) * outerRadius;
      ctx.lineTo(x, y);
      rot += step;
      x = cx + Math.cos(rot) * innerRadius;
      y = cy + Math.sin(rot) * innerRadius;
      ctx.lineTo(x, y);
      rot += step;
    }
    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  // =========================================================================
  // 4 HÌNH BIỂU TƯỢNG SVG (PICS) CHO GÓI SÁNG TẠO VÀ THỬ THÁCH
  // viewBox="0 0 64 48", aria-hidden="true"
  // =========================================================================
  const PICS = {
    // 1. Phao thăng bằng hai bên (float)
    float:
      '<svg viewBox="0 0 64 48" aria-hidden="true">' +
      '<path d="M10 28h44l-6 11H16z" fill="#3dc1dc" stroke="#1e2a34" stroke-width="1.8" stroke-linejoin="round"/>' +
      '<path d="M30 26V8l14 18z" fill="#ffffff" stroke="#1e2a34" stroke-width="1.8" stroke-linejoin="round"/>' +
      '<rect x="18" y="22" width="20" height="7" rx="2" fill="#ffffff" stroke="#1e2a34" stroke-width="1.4"/>' +
      '<line x1="6" y1="33" x2="58" y2="33" stroke="#1e2a34" stroke-width="2.5" stroke-linecap="round"/>' +
      '<rect x="4" y="30" width="12" height="7" rx="3" fill="#ff8a3d" stroke="#1e2a34" stroke-width="1.5"/>' +
      '<rect x="48" y="30" width="12" height="7" rx="3" fill="#ff8a3d" stroke="#1e2a34" stroke-width="1.5"/>' +
      '<line x1="8" y1="30" x2="8" y2="37" stroke="#ffffff" stroke-width="1.4"/>' +
      '<line x1="52" y1="30" x2="52" y2="37" stroke="#ffffff" stroke-width="1.4"/>' +
      '</svg>',

    // 2. Đèn dẫn đường mũi thuyền (light)
    light:
      '<svg viewBox="0 0 64 48" aria-hidden="true">' +
      '<polygon points="46,27 62,20 62,36" fill="#ffd23f" opacity="0.6"/>' +
      '<path d="M10 28h38l-6 11H16z" fill="#3dc1dc" stroke="#1e2a34" stroke-width="1.8" stroke-linejoin="round"/>' +
      '<path d="M28 26V8l14 18z" fill="#ffffff" stroke="#1e2a34" stroke-width="1.8" stroke-linejoin="round"/>' +
      '<rect x="16" y="22" width="18" height="7" rx="2" fill="#ffffff" stroke="#1e2a34" stroke-width="1.4"/>' +
      '<circle cx="47" cy="28" r="4.5" fill="#ffd23f" stroke="#1e2a34" stroke-width="1.6"/>' +
      '<circle cx="48" cy="27" r="1.8" fill="#ffffff"/>' +
      '</svg>',

    // 3. Buồm thêm đón gió (sail)
    sail:
      '<svg viewBox="0 0 64 48" aria-hidden="true">' +
      '<path d="M10 28h44l-6 11H16z" fill="#3dc1dc" stroke="#1e2a34" stroke-width="1.8" stroke-linejoin="round"/>' +
      '<path d="M30 26V7l15 19z" fill="#ffffff" stroke="#1e2a34" stroke-width="1.8" stroke-linejoin="round"/>' +
      '<path d="M28 26V12L15 26z" fill="#ffffff" stroke="#1e2a34" stroke-width="1.8" stroke-linejoin="round"/>' +
      '<path d="M30 26V7" stroke="#1e2a34" stroke-width="2.2" stroke-linecap="round"/>' +
      '<polygon points="30,7 23,4 30,2" fill="#e53935"/>' +
      '<rect x="22" y="23" width="14" height="6" rx="1.5" fill="#ffffff" stroke="#1e2a34" stroke-width="1.3"/>' +
      '</svg>',

    // 4. Thuyền vượt bão cơ bản (base)
    base:
      '<svg viewBox="0 0 64 48" aria-hidden="true">' +
      '<path d="M10 28h44l-6 11H16z" fill="#3dc1dc" stroke="#1e2a34" stroke-width="1.8" stroke-linejoin="round"/>' +
      '<path d="M30 26V7l15 19z" fill="#ffffff" stroke="#1e2a34" stroke-width="1.8" stroke-linejoin="round"/>' +
      '<polygon points="30,7 23,4 30,2" fill="#e53935"/>' +
      '<rect x="20" y="22" width="16" height="7" rx="2" fill="#ffffff" stroke="#1e2a34" stroke-width="1.4"/>' +
      '<circle cx="16" cy="36" r="3.2" fill="#ffd23f" stroke="#1e2a34" stroke-width="1.3"/>' +
      '</svg>'
  };

  // Xuất giao diện toàn cục window.StormArt theo đúng quy định của phiếu giao việc
  window.StormArt = {
    W,
    H,
    WATER_Y,
    waterY,
    waterAngle,
    drawBackground,
    drawSea,
    drawPort,
    drawLighthouse,
    drawReef,
    drawBuoy,
    drawBoat,
    PICS
  };

  // Đồng thời gán bí danh window.BoatArt để tương thích thuận tiện
  window.BoatArt = window.StormArt;
})();
