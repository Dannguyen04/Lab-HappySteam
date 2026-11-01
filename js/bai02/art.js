// Tranh vẽ cảnh đường đua và xe đua một động cơ cho Bài 2 (chặng ③ và xưởng sáng tạo).
// Hệ toạ độ logic: W = 900, H = 560.
// Không dùng ảnh ngoài, font ngoài, hay Math.random() trong khi vẽ.
(function () {
  'use strict';

  const W = 900;
  const H = 560;

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

  // Dữ liệu đám mây cố định trôi nhẹ theo t
  const CLOUDS = [
    { x0: 95, y: 72, s: 1.0, sp: 10 },
    { x0: 340, y: 52, s: 0.85, sp: 7 },
    { x0: 610, y: 84, s: 1.1, sp: 12 },
    { x0: 820, y: 58, s: 0.78, sp: 9 }
  ];

  // Cờ đuôi nheo trên khán đài/cột cờ xa
  const FLAGS = [
    { x: 115, y: 248, c: '#e53935', phase: 0.0 },
    { x: 225, y: 238, c: '#ffd23f', phase: 1.1 },
    { x: 335, y: 246, c: '#3dc1dc', phase: 2.2 },
    { x: 545, y: 242, c: '#e53935', phase: 3.3 },
    { x: 665, y: 236, c: '#ffd23f', phase: 4.4 },
    { x: 785, y: 248, c: '#3dc1dc', phase: 5.5 }
  ];

  // Sỏi đá cố định ở tầng đất dưới đường đua
  const SOIL_STONES = [
    { x: 55, dy: 68, rx: 7, ry: 4, c: '#8d6236' },
    { x: 130, dy: 96, rx: 9, ry: 5, c: '#7a522a' },
    { x: 215, dy: 74, rx: 6, ry: 3.5, c: '#8d6236' },
    { x: 290, dy: 110, rx: 8, ry: 4.5, c: '#7a522a' },
    { x: 375, dy: 82, rx: 10, ry: 5, c: '#8d6236' },
    { x: 445, dy: 135, rx: 8, ry: 4.5, c: '#7a522a' },
    { x: 520, dy: 92, rx: 7, ry: 4, c: '#8d6236' },
    { x: 605, dy: 76, rx: 9, ry: 5, c: '#7a522a' },
    { x: 690, dy: 112, rx: 7.5, ry: 4, c: '#8d6236' },
    { x: 775, dy: 85, rx: 8.5, ry: 4.5, c: '#7a522a' },
    { x: 850, dy: 105, rx: 6.5, ry: 3.8, c: '#8d6236' }
  ];

  function drawCloud(ctx, cx, cy, scale) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);

    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#1e2a34';
    ctx.lineWidth = 2.2;

    ctx.beginPath();
    ctx.moveTo(-38, 12);
    ctx.arc(-26, 2, 14, Math.PI * 0.5, Math.PI * 1.42);
    ctx.arc(-6, -6, 18, Math.PI * 1.05, Math.PI * 1.88);
    ctx.arc(18, -2, 15, Math.PI * 1.25, Math.PI * 1.95);
    ctx.arc(32, 4, 11, Math.PI * 1.4, Math.PI * 0.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }

  // 1. Vẽ nền: bầu trời xanh nhạt, mây trôi, đồi cỏ, khán đài và cờ bay nhẹ theo t
  function drawBackground(ctx, t) {
    const sec = typeof t === 'number' ? t : 0;

    // --- Bầu trời xanh nhạt #cfeaf7 -> #eaf6fb ---
    const skyGrad = ctx.createLinearGradient(0, 0, 0, 340);
    skyGrad.addColorStop(0, '#cfeaf7');
    skyGrad.addColorStop(1, '#eaf6fb');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, W, H);

    // --- Ông mặt trời tươi sáng góc phải trên ---
    const sunX = 815;
    const sunY = 66;
    const sunGlow = ctx.createRadialGradient(sunX, sunY, 12, sunX, sunY, 54);
    sunGlow.addColorStop(0, 'rgba(255, 210, 63, 0.45)');
    sunGlow.addColorStop(1, 'rgba(255, 210, 63, 0)');
    ctx.fillStyle = sunGlow;
    ctx.beginPath();
    ctx.arc(sunX, sunY, 54, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffd23f';
    ctx.strokeStyle = '#1e2a34';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(sunX, sunY, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // --- Mây trắng trôi nhẹ ---
    for (const cl of CLOUDS) {
      const cx = ((cl.x0 + sec * cl.sp) % (W + 140)) - 70;
      drawCloud(ctx, cx, cl.y, cl.s);
    }

    // --- Đồi cỏ xa (#a0d468) ---
    ctx.fillStyle = '#a0d468';
    ctx.strokeStyle = '#1e2a34';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(0, 275);
    ctx.bezierCurveTo(140, 235, 270, 268, 430, 238);
    ctx.bezierCurveTo(590, 208, 740, 258, 900, 236);
    ctx.lineTo(W, H);
    ctx.lineTo(0, H);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // --- Khán đài & dải cờ lễ hội xa xa ---
    const stands = [
      { x: 130, y: 224, w: 150, h: 40, roof: '#3dc1dc' },
      { x: 565, y: 218, w: 165, h: 42, roof: '#e53935' }
    ];
    for (const st of stands) {
      ctx.save();
      // Khung bậc khán đài
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#1e2a34';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      roundRect(ctx, st.x, st.y, st.w, st.h, 4);
      ctx.fill();
      ctx.stroke();

      // Các hàng ghế khán giả sắc màu
      const seatColors = ['#3dc1dc', '#ffd23f', '#e53935'];
      for (let r = 0; r < 3; r++) {
        ctx.fillStyle = seatColors[r];
        ctx.fillRect(st.x + 8, st.y + 8 + r * 9, st.w - 16, 5);
      }

      // Cột chống mái che
      ctx.strokeStyle = '#1e2a34';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(st.x + 12, st.y);
      ctx.lineTo(st.x + 12, st.y - 18);
      ctx.moveTo(st.x + st.w - 12, st.y);
      ctx.lineTo(st.x + st.w - 12, st.y - 18);
      ctx.stroke();

      // Mái che khán đài
      ctx.fillStyle = st.roof;
      ctx.beginPath();
      ctx.moveTo(st.x - 8, st.y - 16);
      ctx.lineTo(st.x + st.w + 8, st.y - 16);
      ctx.lineTo(st.x + st.w, st.y - 28);
      ctx.lineTo(st.x, st.y - 28);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    // --- Cột cờ xa có lá cờ bay nhẹ theo t ---
    for (const f of FLAGS) {
      const poleTop = f.y - 54;
      ctx.strokeStyle = '#1e2a34';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(f.x, f.y + 20);
      ctx.lineTo(f.x, poleTop);
      ctx.stroke();

      // Lá cờ uốn lượn theo thời gian t
      const wave = Math.sin(sec * 4.2 + f.phase) * 4.5;
      const wave2 = Math.cos(sec * 4.2 + f.phase) * 3;
      ctx.fillStyle = f.c;
      ctx.strokeStyle = '#1e2a34';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(f.x, poleTop + 2);
      ctx.quadraticCurveTo(f.x + 14, poleTop + 4 + wave2, f.x + 28, poleTop + 8 + wave);
      ctx.lineTo(f.x, poleTop + 18);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Chóp tròn trên đỉnh cột
      ctx.fillStyle = '#ffd23f';
      ctx.beginPath();
      ctx.arc(f.x, poleTop, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    // --- Thảm cỏ chính (#8cc152) phủ kín tới đáy canvas ---
    ctx.fillStyle = '#8cc152';
    ctx.strokeStyle = '#1e2a34';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(0, 290);
    ctx.bezierCurveTo(180, 265, 360, 295, 540, 272);
    ctx.bezierCurveTo(700, 252, 810, 282, 900, 270);
    ctx.lineTo(W, H);
    ctx.lineTo(0, H);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Những cụm cỏ xanh đậm trang trí cố định
    const tufts = [70, 190, 310, 490, 640, 760, 855];
    ctx.strokeStyle = '#6da035';
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    for (let i = 0; i < tufts.length; i++) {
      const tx = tufts[i];
      const ty = 292 + (i % 2) * 10;
      ctx.beginPath();
      ctx.moveTo(tx - 6, ty);
      ctx.lineTo(tx - 9, ty - 7);
      ctx.moveTo(tx, ty);
      ctx.lineTo(tx, ty - 9);
      ctx.moveTo(tx + 6, ty);
      ctx.lineTo(tx + 9, ty - 7);
      ctx.stroke();
    }
    ctx.lineCap = 'butt';
  }

  // Nội suy cao độ mặt đường từ danh sách điểm pts
  function sampleTrackY(pts, x) {
    if (!pts || !pts.length) return 400;
    if (x <= pts[0][0]) return pts[0][1];
    for (let i = 1; i < pts.length; i++) {
      const x0 = pts[i - 1][0], y0 = pts[i - 1][1];
      const x1 = pts[i][0], y1 = pts[i][1];
      if (x <= x1) {
        if (x1 === x0) return y1;
        return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
      }
    }
    return pts[pts.length - 1][1];
  }

  // 2. Vẽ mặt đường đua xám có vạch trắng và phần đất bên dưới tô kín tới đáy canvas
  function drawTrack(ctx, pts) {
    if (!pts || pts.length < 2) return;

    const roadH = 38; // bề dày lớp nhựa đường
    const curbH = 8;  // dải vỉa nhựa đỏ-trắng sát dưới mặt đường
    const first = pts[0];
    const last = pts[pts.length - 1];

    ctx.save();

    // --- Phần đất bên dưới tô kín từ mặt đường tới đáy canvas (H) ---
    const soilGrad = ctx.createLinearGradient(0, 320, 0, H);
    soilGrad.addColorStop(0, '#c69458');
    soilGrad.addColorStop(0.35, '#b07d45');
    soilGrad.addColorStop(1, '#8f602e');

    ctx.beginPath();
    ctx.moveTo(0, H);
    ctx.lineTo(0, first[1]);
    for (let i = 0; i < pts.length; i++) {
      ctx.lineTo(pts[i][0], pts[i][1]);
    }
    ctx.lineTo(W, last[1]);
    ctx.lineTo(W, H);
    ctx.closePath();
    ctx.fillStyle = soilGrad;
    ctx.fill();

    // Lớp cỏ xanh viền ngay dưới thân đường
    ctx.beginPath();
    ctx.moveTo(0, first[1] + roadH);
    for (let i = 0; i < pts.length; i++) {
      ctx.lineTo(pts[i][0], pts[i][1] + roadH);
    }
    ctx.lineTo(W, last[1] + roadH);
    ctx.lineTo(W, last[1] + roadH + 16);
    for (let i = pts.length - 1; i >= 0; i--) {
      ctx.lineTo(pts[i][0], pts[i][1] + roadH + 16);
    }
    ctx.lineTo(0, first[1] + roadH + 16);
    ctx.closePath();
    ctx.fillStyle = '#7eb644';
    ctx.fill();

    // Sỏi đá trang trí trong lòng đất dưới đường
    for (const st of SOIL_STONES) {
      const sy = sampleTrackY(pts, st.x) + st.dy;
      if (sy < H - 8) {
        ctx.fillStyle = st.c;
        ctx.strokeStyle = '#1e2a34';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.ellipse(st.x, sy, st.rx, st.ry, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
    }

    // --- Dải nhựa đường xám (#5d6b78) ---
    ctx.beginPath();
    ctx.moveTo(0, first[1]);
    for (let i = 0; i < pts.length; i++) {
      ctx.lineTo(pts[i][0], pts[i][1]);
    }
    ctx.lineTo(W, last[1]);
    ctx.lineTo(W, last[1] + roadH);
    for (let i = pts.length - 1; i >= 0; i--) {
      ctx.lineTo(pts[i][0], pts[i][1] + roadH);
    }
    ctx.lineTo(0, first[1] + roadH);
    ctx.closePath();
    ctx.fillStyle = '#5d6b78';
    ctx.fill();

    // Dải gờ đường đua đỏ - trắng dọc theo mép dưới nhựa đường
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(0, first[1] + roadH - curbH);
    for (let i = 0; i < pts.length; i++) {
      ctx.lineTo(pts[i][0], pts[i][1] + roadH - curbH);
    }
    ctx.lineTo(W, last[1] + roadH - curbH);
    ctx.lineTo(W, last[1] + roadH);
    for (let i = pts.length - 1; i >= 0; i--) {
      ctx.lineTo(pts[i][0], pts[i][1] + roadH);
    }
    ctx.lineTo(0, first[1] + roadH);
    ctx.closePath();
    ctx.clip();

    const stripeW = 24;
    for (let sx = 0; sx < W; sx += stripeW) {
      ctx.fillStyle = (Math.floor(sx / stripeW) % 2 === 0) ? '#e53935' : '#ffffff';
      ctx.fillRect(sx, 0, stripeW, H);
    }
    ctx.restore();

    // --- Vạch trắng đứt nét giữa mặt đường ---
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(0, first[1] + 15);
    for (let i = 0; i < pts.length; i++) {
      ctx.lineTo(pts[i][0], pts[i][1] + 15);
    }
    ctx.lineTo(W, last[1] + 15);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.setLineDash([18, 14]);
    ctx.stroke();
    ctx.restore();

    // --- Viền đậm mặt đường trên và dưới (#1e2a34) ---
    ctx.strokeStyle = '#1e2a34';
    ctx.lineWidth = 3;
    ctx.lineJoin = 'round';

    // Mép trên mặt đường (nơi bánh xe tiếp xúc)
    ctx.beginPath();
    ctx.moveTo(0, first[1]);
    for (let i = 0; i < pts.length; i++) {
      ctx.lineTo(pts[i][0], pts[i][1]);
    }
    ctx.lineTo(W, last[1]);
    ctx.stroke();

    // Mép dưới mặt đường
    ctx.beginPath();
    ctx.moveTo(0, first[1] + roadH);
    for (let i = 0; i < pts.length; i++) {
      ctx.lineTo(pts[i][0], pts[i][1] + roadH);
    }
    ctx.lineTo(W, last[1] + roadH);
    ctx.stroke();

    ctx.restore();
  }

  // Hàm phụ vẽ bánh sau lớn (xanh ngọc, vành trắng, nan xoay theo góc)
  function drawBigRearWheel(ctx, cx, cy, r, angle, isFar) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);

    // Lốp xanh ngọc
    ctx.fillStyle = isFar ? '#2694ab' : '#3dc1dc';
    ctx.strokeStyle = '#1e2a34';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Gai lốp trên vành ngoài
    ctx.strokeStyle = '#0e6f8a';
    ctx.lineWidth = 2.2;
    const treads = 10;
    for (let i = 0; i < treads; i++) {
      const a = (i / treads) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * (r * 0.84), Math.sin(a) * (r * 0.84));
      ctx.lineTo(Math.cos(a) * (r - 1), Math.sin(a) * (r - 1));
      ctx.stroke();
    }

    // Vành trắng bên trong (giống bánh Lego WeDo p-14.png)
    const rimR = r * 0.68;
    ctx.fillStyle = isFar ? '#dceef2' : '#ffffff';
    ctx.strokeStyle = '#1e2a34';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, rimR, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Nan bánh xe để thấy rõ bánh đang quay
    ctx.strokeStyle = '#0e6f8a';
    ctx.lineWidth = 2.6;
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(a) * (rimR - 1.5), Math.sin(a) * (rimR - 1.5));
      ctx.stroke();
    }

    // Các lỗ tròn nhỏ trên vành trắng
    ctx.fillStyle = '#1e2a34';
    for (let i = 0; i < 6; i++) {
      const a = ((i + 0.5) / 6) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(Math.cos(a) * (rimR * 0.56), Math.sin(a) * (rimR * 0.56), r * 0.08, 0, Math.PI * 2);
      ctx.fill();
    }

    // Trục giữa
    ctx.fillStyle = '#3dc1dc';
    ctx.strokeStyle = '#1e2a34';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.22, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }

  // Hàm phụ vẽ bánh nhỏ màu đen xám ở đầu tay đòn phía trước
  function drawSmallFrontWheel(ctx, cx, cy, r, angle) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);

    // Lốp đen xám
    ctx.fillStyle = '#2d3842';
    ctx.strokeStyle = '#1e2a34';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Mâm xám bên trong
    ctx.fillStyle = '#6e7d88';
    ctx.strokeStyle = '#1e2a34';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.68, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // 6 lỗ tròn quanh mâm bánh nhỏ (giống p-14.png) để thấy bánh quay
    ctx.fillStyle = '#1e2a34';
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(Math.cos(a) * (r * 0.42), Math.sin(a) * (r * 0.42), 2.1, 0, Math.PI * 2);
      ctx.fill();
    }

    // Chốt chữ thập xanh ngọc ở tâm trục trước
    ctx.fillStyle = '#3dc1dc';
    ctx.beginPath();
    ctx.arc(0, 0, 2.8, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // 3. Vẽ xe đua một động cơ (đầu xe hướng sang PHẢI, dài ~140px, cao ~80px)
  // (x, y) = điểm trên mặt đường dưới tâm xe; angle = độ nghiêng mặt đường
  function drawCar(ctx, x, y, angle, o) {
    const opts = o || {};
    const wheelAngle = typeof opts.wheel === 'number' ? opts.wheel : 0;
    const shakeVal = Math.min(1, Math.max(0, typeof opts.shake === 'number' ? opts.shake : 0));
    const flipVal = Math.min(1, Math.max(0, typeof opts.flip === 'number' ? opts.flip : 0));
    const sec = typeof opts.t === 'number' ? opts.t : 0;

    // Rung lắc tuần hoàn khi đụng tường (không dùng Math.random)
    const shakeX = shakeVal > 0 ? Math.sin(sec * 65) * 4 * shakeVal : 0;
    const shakeY = shakeVal > 0 ? Math.cos(sec * 52) * 2.5 * shakeVal : 0;

    // Bán kính bánh sau: bình thường 22px, khi bật bigwheel gấp ~1.3 lần (29px)
    const baseRearR = 22;
    const rearR = opts.bigwheel ? 29 : baseRearR;
    const lift = rearR - baseRearR; // nâng thân sau lên để bánh sau vẫn chạm đúng mặt đường y = 0

    // Tâm bánh sau và bánh trước (luôn chạm đường tại y = 0)
    const rearX = -32;
    const rearY = -rearR;
    const frontR = 12;
    const frontX = 52;
    const frontY = -frontR;

    ctx.save();
    ctx.translate(x + shakeX, y + shakeY);
    ctx.rotate(typeof angle === 'number' ? angle : 0);

    // Hiệu ứng lật ngửa bụng khi xuống dốc quá nhanh (flip: 0 -> 1)
    if (flipVal > 0) {
      const pivotY = -36 - lift * 0.5;
      const bounceY = -Math.sin(flipVal * Math.PI) * 22;
      ctx.translate(0, pivotY + bounceY);
      ctx.rotate(flipVal * Math.PI);
      ctx.translate(0, -pivotY);
    }

    // Bóng đổ nhẹ trên mặt đường dưới gầm xe
    if (flipVal < 0.3) {
      ctx.fillStyle = 'rgba(30, 42, 52, 0.22)';
      ctx.beginPath();
      ctx.ellipse(6, -1, 64, 4, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // ==========================================
    // LỚP 1: BÁNH LỚN PHÍA SAU - BÊN XA (khuất sau thân)
    // ==========================================
    drawBigRearWheel(ctx, rearX + 7, rearY - 3, rearR * 0.94, wheelAngle, true);

    // ==========================================
    // LỚP 2: TAY ĐÒN PHÍA XA (thanh Technic xanh ngọc song song bên kia)
    // ==========================================
    const armStartX = -4;
    const armStartY = -23 - lift;
    const armEndX = frontX;
    const armEndY = frontY;
    const armAngle = Math.atan2(armEndY - armStartY, armEndX - armStartX);
    const armLen = Math.hypot(armEndX - armStartX, armEndY - armStartY);

    ctx.save();
    ctx.translate(armStartX, armStartY - 5);
    ctx.rotate(armAngle);
    ctx.fillStyle = '#2694ab';
    ctx.strokeStyle = '#1e2a34';
    ctx.lineWidth = 2;
    ctx.beginPath();
    roundRect(ctx, -4, -4.5, armLen + 10, 9, 4.5);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // ==========================================
    // LỚP 3: BÁNH NHỎ MÀU ĐEN XÁM Ở CUỐI TAY ĐÒN PHÍA TRƯỚC
    // ==========================================
    drawSmallFrontWheel(ctx, frontX, frontY, frontR, wheelAngle * (rearR / frontR));

    // ==========================================
    // LỚP 4: CÁNH GIÓ ĐUÔI ĐỎ TRÊN 2 CỘT ĐEN (o.wing)
    // ==========================================
    if (opts.wing) {
      const hubTopY = -74 - lift;
      // 2 cột đen cắm ở đuôi xe (bên trái)
      ctx.fillStyle = '#1e2a34';
      ctx.fillRect(-58, hubTopY - 18, 4.5, 20);
      ctx.fillRect(-44, hubTopY - 18, 4.5, 20);

      // Thanh chéo giữ cánh gió
      ctx.strokeStyle = '#1e2a34';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(-56, hubTopY - 4);
      ctx.lineTo(-42, hubTopY - 16);
      ctx.stroke();

      // Cánh gió đỏ khí động học
      ctx.fillStyle = '#e53935';
      ctx.strokeStyle = '#1e2a34';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(-69, hubTopY - 26);
      ctx.lineTo(-32, hubTopY - 18);
      ctx.lineTo(-34, hubTopY - 11);
      ctx.lineTo(-67, hubTopY - 16);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Tấm ốp sườn cánh gió màu đỏ tươi + viền vàng nhỏ
      ctx.fillStyle = '#ffd23f';
      ctx.beginPath();
      roundRect(ctx, -70, hubTopY - 28, 7, 15, 2);
      ctx.fill();
      ctx.stroke();
    }

    // ==========================================
    // LỚP 5: KHUNG XANH NGỌC & HỘP ĐIỀU KHIỂN TRẮNG (Smart Hub p-14.png)
    // ==========================================
    // Khung đế Technic xanh ngọc bên dưới hộp điều khiển
    const frameY = -34 - lift;
    ctx.fillStyle = '#3dc1dc';
    ctx.strokeStyle = '#1e2a34';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    roundRect(ctx, -60, frameY, 64, 16, 4);
    ctx.fill();
    ctx.stroke();

    // Lỗ tròn Technic trên khung xanh ngọc
    for (let i = 0; i < 4; i++) {
      const hx = -50 + i * 14;
      ctx.fillStyle = '#0e6f8a';
      ctx.beginPath();
      ctx.arc(hx, frameY + 8, 3.3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Khối trụ trắng/xanh ngọc đỡ giữa khung (giống p-14.png)
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#1e2a34';
    ctx.lineWidth = 2.2;
    ctx.fillRect(-20, frameY - 12, 18, 13);
    ctx.strokeRect(-20, frameY - 12, 18, 13);

    // Hộp điều khiển Smart Hub: phần thân dưới xanh ngọc + phần nắp trên trắng có viền xanh ngọc
    const hubX = -58;
    const hubY = -74 - lift;
    const hubW = 60;
    const hubH = 34;

    // Thân hộp trắng
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#1e2a34';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    roundRect(ctx, hubX, hubY, hubW, hubH, 6);
    ctx.fill();
    ctx.stroke();

    // Dải thân dưới của hộp màu xanh ngọc (#3dc1dc) có viền #0e6f8a
    ctx.fillStyle = '#3dc1dc';
    ctx.strokeStyle = '#0e6f8a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    roundRect(ctx, hubX + 1.5, hubY + 14, hubW - 3, hubH - 15.5, [0, 0, 5, 5]);
    ctx.fill();
    ctx.stroke();

    // Viền ngoài hộp điều khiển đậm nét
    ctx.strokeStyle = '#1e2a34';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    roundRect(ctx, hubX, hubY, hubW, hubH, 6);
    ctx.stroke();

    // 3 nút điều khiển màu xanh ngọc trên đỉnh hộp trắng (giống hệt p-14.png)
    for (let b = 0; b < 3; b++) {
      const bx = hubX + 12 + b * 13;
      const bw = b === 1 ? 12 : 9;
      ctx.fillStyle = '#3dc1dc';
      ctx.strokeStyle = '#0e6f8a';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      roundRect(ctx, bx, hubY - 3, bw, 5, 2);
      ctx.fill();
      ctx.stroke();
    }

    // Thanh khóa Technic 5 lỗ màu trắng gắn bên hông hộp (chi tiết đặc trưng ở p-14.png)
    const lockX = -16;
    const lockY = hubY + 20;
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#1e2a34';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    roundRect(ctx, lockX, lockY, 26, 9, 3);
    ctx.fill();
    ctx.stroke();
    for (let k = 0; k < 3; k++) {
      ctx.fillStyle = '#1e2a34';
      ctx.beginPath();
      ctx.arc(lockX + 5 + k * 8, lockY + 4.5, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // ==========================================
    // LỚP 6: TAY ĐÒN DÀI XANH NGỌC CHÌA VỀ PHÍA TRƯỚC (BÊN PHẢI)
    // ==========================================
    // Khớp đen nối tay đòn với khung
    ctx.fillStyle = '#1e2a34';
    ctx.beginPath();
    roundRect(ctx, -6, armStartY - 6, 12, 12, 3);
    ctx.fill();

    // Thanh tay đòn chính màu xanh ngọc (#3dc1dc) nối từ khung tới trục bánh trước
    ctx.save();
    ctx.translate(armStartX, armStartY);
    ctx.rotate(armAngle);

    ctx.fillStyle = '#3dc1dc';
    ctx.strokeStyle = '#1e2a34';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    roundRect(ctx, -4, -5.5, armLen + 10, 11, 5);
    ctx.fill();
    ctx.stroke();

    // Viền rãnh #0e6f8a và chuỗi lỗ tròn Technic dọc theo tay đòn dài
    ctx.strokeStyle = '#0e6f8a';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(4, -2.5);
    ctx.lineTo(armLen, -2.5);
    ctx.moveTo(4, 2.5);
    ctx.lineTo(armLen, 2.5);
    ctx.stroke();

    const holeCount = 6;
    for (let i = 0; i < holeCount; i++) {
      const hx = 8 + i * ((armLen - 14) / (holeCount - 1));
      ctx.fillStyle = '#0e6f8a';
      ctx.beginPath();
      ctx.arc(hx, 0, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();

    // Chốt giữ bánh nhỏ ở đầu tay đòn
    ctx.fillStyle = '#0e6f8a';
    ctx.strokeStyle = '#1e2a34';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(frontX, frontY, 3.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // ==========================================
    // LỚP 7: PHỤ KIỆN MŨI XE NHỌN TRẮNG Ở ĐẦU TAY ĐÒN (o.nose)
    // ==========================================
    if (opts.nose) {
      const noseX = frontX + 4;
      const noseY = frontY;
      ctx.save();
      ctx.translate(noseX, noseY);

      // Mũi nhọn khí động học màu trắng hướng sang phải
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#1e2a34';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(-6, -12);
      ctx.lineTo(20, -2);
      ctx.lineTo(20, 3);
      ctx.lineTo(-6, 8);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Sọc xanh ngọc trang trí trên mũi xe
      ctx.fillStyle = '#3dc1dc';
      ctx.beginPath();
      ctx.moveTo(-3, -5);
      ctx.lineTo(15, -1);
      ctx.lineTo(15, 2);
      ctx.lineTo(-3, 2);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    }

    // ==========================================
    // LỚP 8: ĐÈN PHA VÀNG PHÁT SÁNG & BIỂN SỐ ĐUA TRẮNG (o.lights, o.number)
    // ==========================================
    if (opts.lights) {
      const lightX = opts.nose ? frontX + 20 : frontX + 6;
      const lightY = frontY - 9;

      // Chùm sáng đèn pha vàng chiếu về phía trước (bên phải)
      ctx.save();
      const beamGrad = ctx.createLinearGradient(lightX, lightY, lightX + 75, lightY);
      beamGrad.addColorStop(0, 'rgba(255, 210, 63, 0.65)');
      beamGrad.addColorStop(0.6, 'rgba(255, 210, 63, 0.22)');
      beamGrad.addColorStop(1, 'rgba(255, 210, 63, 0)');
      ctx.fillStyle = beamGrad;
      ctx.beginPath();
      ctx.moveTo(lightX + 4, lightY - 3);
      ctx.lineTo(lightX + 75, lightY - 24);
      ctx.lineTo(lightX + 75, lightY + 20);
      ctx.lineTo(lightX + 4, lightY + 3);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // Vỏ đèn pha & chóa đèn vàng #ffd23f
      ctx.fillStyle = '#1e2a34';
      ctx.beginPath();
      roundRect(ctx, lightX - 5, lightY - 6, 8, 12, 3);
      ctx.fill();

      ctx.fillStyle = '#ffd23f';
      ctx.strokeStyle = '#1e2a34';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(lightX + 3, lightY, 5.5, -Math.PI * 0.55, Math.PI * 0.55);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    // Biển số đua trắng kèm chữ số đua khi o.lights bật hoặc khi có o.number
    const numText = (opts.number !== undefined && opts.number !== null && String(opts.number) !== '')
      ? String(opts.number)
      : (opts.lights ? '7' : '');

    if (opts.lights || numText) {
      const badgeX = hubX + 18;
      const badgeY = hubY + 5;
      const badgeW = 24;
      const badgeH = 18;

      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#1e2a34';
      ctx.lineWidth = 2;
      ctx.beginPath();
      roundRect(ctx, badgeX, badgeY, badgeW, badgeH, 4);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#1e2a34';
      ctx.font = '800 12px "Be Vietnam Pro","Segoe UI",sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(numText || '7', badgeX + badgeW / 2, badgeY + badgeH / 2 + 0.5);
    }

    // ==========================================
    // LỚP 9: BÁNH LỚN PHÍA SAU - BÊN GẦN
    // ==========================================
    drawBigRearWheel(ctx, rearX, rearY, rearR, wheelAngle, false);

    ctx.restore();
  }

  // 4. Vẽ cổng/vạch đích ô cờ đen trắng, chân ở (x, y)
  function drawFinish(ctx, x, y) {
    ctx.save();
    ctx.translate(x, y);

    // Vạch kẻ ô cờ đen trắng trên mặt đường (từ y đến y + 36)
    const sq = 6;
    for (let r = 0; r < 6; r++) {
      for (let c = 0; c < 2; c++) {
        ctx.fillStyle = (r + c) % 2 === 0 ? '#ffffff' : '#1e2a34';
        ctx.fillRect(-sq + c * sq, r * sq, sq, sq);
      }
    }
    ctx.strokeStyle = '#1e2a34';
    ctx.lineWidth = 2;
    ctx.strokeRect(-sq, 0, sq * 2, sq * 6);

    // Chân đế cột đích
    ctx.fillStyle = '#3dc1dc';
    ctx.strokeStyle = '#1e2a34';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    roundRect(ctx, -14, -10, 28, 10, [4, 4, 0, 0]);
    ctx.fill();
    ctx.stroke();

    // Cột cổng đích cao 118px
    const poleH = 118;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    roundRect(ctx, -4.5, -poleH, 9, poleH - 8, 2);
    ctx.fill();
    ctx.stroke();

    // Các sọc xanh ngọc trên cột đích
    ctx.fillStyle = '#3dc1dc';
    for (let py = -28; py > -poleH + 20; py -= 24) {
      ctx.fillRect(-3.2, py, 6.4, 10);
    }

    // Bảng cờ caro đen trắng trên đỉnh cổng đích
    const bannerX = -32;
    const bannerY = -poleH - 22;
    const cols = 8;
    const rows = 3;
    const cell = 8;
    const bannerW = cols * cell;
    const bannerH = rows * cell;

    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#1e2a34';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    roundRect(ctx, bannerX - 3, bannerY - 3, bannerW + 6, bannerH + 6, 5);
    ctx.fill();
    ctx.stroke();

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        ctx.fillStyle = (r + c) % 2 === 0 ? '#1e2a34' : '#ffffff';
        ctx.fillRect(bannerX + c * cell, bannerY + r * cell, cell, cell);
      }
    }
    ctx.strokeRect(bannerX, bannerY, bannerW, bannerH);

    // Ngôi sao vàng trên đỉnh cổng đích
    ctx.fillStyle = '#ffd23f';
    ctx.strokeStyle = '#1e2a34';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, bannerY - 8, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }

  // 5. Vẽ ô đỗ màu vàng có chữ P trên mặt đường từ x0 tới x1
  function drawParking(ctx, x0, x1, y) {
    const left = Math.min(x0, x1);
    const width = Math.max(24, Math.abs(x1 - x0));
    const midX = left + width / 2;

    ctx.save();

    // Nền ô đỗ màu vàng nổi bật trên mặt đường
    ctx.fillStyle = 'rgba(255, 210, 63, 0.38)';
    ctx.fillRect(left, y + 2, width, 34);

    // Viền sơn vàng #ffd23f + viền đậm #1e2a34
    ctx.strokeStyle = '#1e2a34';
    ctx.lineWidth = 5;
    ctx.strokeRect(left, y + 2, width, 34);

    ctx.strokeStyle = '#ffd23f';
    ctx.lineWidth = 2.8;
    ctx.strokeRect(left, y + 2, width, 34);

    // 2 vạch gờ chặn bánh màu vàng ở 2 đầu ô đỗ
    ctx.fillStyle = '#ffd23f';
    ctx.strokeStyle = '#1e2a34';
    ctx.lineWidth = 2;
    ctx.beginPath();
    roundRect(ctx, left - 3, y - 4, 7, 10, 2);
    roundRect(ctx, left + width - 4, y - 4, 7, 10, 2);
    ctx.fill();
    ctx.stroke();

    // Huy hiệu tròn vàng có chữ P duy nhất theo quy định
    ctx.fillStyle = '#ffd23f';
    ctx.strokeStyle = '#1e2a34';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(midX, y + 19, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#1e2a34';
    ctx.font = '800 16px "Be Vietnam Pro","Segoe UI",sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('P', midX, y + 20);

    ctx.restore();
  }

  // 6. Vẽ chồng lốp xe đỏ trắng cuối đường, chân ở (x, y)
  function drawWall(ctx, x, y) {
    ctx.save();
    ctx.translate(x, y);

    // Bóng đổ dưới chân chồng lốp
    ctx.fillStyle = 'rgba(30, 42, 52, 0.28)';
    ctx.beginPath();
    ctx.ellipse(4, 3, 28, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2 cột lốp xếp chồng xen kẽ đỏ (#e53935) và trắng (#ffffff)
    const cols = [
      { dx: -10, count: 4 },
      { dx: 12, count: 3 }
    ];
    const tireW = 34;
    const tireH = 16;

    for (let c = 0; c < cols.length; c++) {
      const col = cols[c];
      for (let i = 0; i < col.count; i++) {
        const ty = -tireH - i * (tireH - 2);
        const tx = col.dx + (i % 2 === 1 ? 2 : 0) - tireW / 2;
        const isRed = (i + c) % 2 === 0;

        // Thân lốp sơn đỏ hoặc trắng
        ctx.fillStyle = isRed ? '#e53935' : '#ffffff';
        ctx.strokeStyle = '#1e2a34';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        roundRect(ctx, tx, ty, tireW, tireH, 6);
        ctx.fill();
        ctx.stroke();

        // Rãnh cao su đen ở giữa mỗi chiếc lốp
        ctx.fillStyle = '#1e2a34';
        ctx.fillRect(tx + 5, ty + 4, tireW - 10, 3);

        // Vạch phản quang nhỏ
        ctx.fillStyle = isRed ? '#ff8a80' : '#cfd8dc';
        ctx.fillRect(tx + 6, ty + 9, tireW - 12, 2.5);
      }
    }

    // Dây đai vàng buộc cố định chồng lốp
    ctx.fillStyle = '#ffd23f';
    ctx.strokeStyle = '#1e2a34';
    ctx.lineWidth = 2;
    ctx.fillRect(-16, -tireH * 3 + 4, 5, tireH * 3 - 4);
    ctx.strokeRect(-16, -tireH * 3 + 4, 5, tireH * 3 - 4);

    ctx.restore();
  }

  // 7. PICS: 4 chuỗi SVG viewBox="0 0 64 48", aria-hidden="true"
  // Xe đua nhỏ trắng - xanh ngọc hướng sang PHẢI kèm phụ kiện tương ứng
  const PICS = {
    // Cánh gió đuôi đỏ trên 2 cột đen ở đuôi xe
    wing:
      '<svg viewBox="0 0 64 48" aria-hidden="true">' +
      '<path d="M12 20v-7M18 20v-7" stroke="#1e2a34" stroke-width="2.2" stroke-linecap="round"/>' +
      '<path d="M7 11l14 2-1 4-13-2z" fill="#e53935" stroke="#1e2a34" stroke-width="1.8" stroke-linejoin="round"/>' +
      '<rect x="11" y="19" width="22" height="14" rx="3" fill="#ffffff" stroke="#1e2a34" stroke-width="1.8"/>' +
      '<rect x="12" y="26" width="20" height="6" fill="#3dc1dc"/>' +
      '<path d="M31 29l22 6" stroke="#3dc1dc" stroke-width="5" stroke-linecap="round"/>' +
      '<path d="M31 29l22 6" stroke="#1e2a34" stroke-width="1.8" stroke-linecap="round" fill="none"/>' +
      '<circle cx="21" cy="34" r="8" fill="#3dc1dc" stroke="#1e2a34" stroke-width="1.8"/>' +
      '<circle cx="21" cy="34" r="4.8" fill="#ffffff" stroke="#1e2a34" stroke-width="1.4"/>' +
      '<circle cx="53" cy="36" r="5" fill="#2d3842" stroke="#1e2a34" stroke-width="1.8"/>' +
      '<circle cx="53" cy="36" r="2" fill="#3dc1dc"/>' +
      '</svg>',

    // Bánh sau to hơn, thân xe nâng cao
    bigwheel:
      '<svg viewBox="0 0 64 48" aria-hidden="true">' +
      '<rect x="11" y="14" width="22" height="14" rx="3" fill="#ffffff" stroke="#1e2a34" stroke-width="1.8"/>' +
      '<rect x="12" y="21" width="20" height="6" fill="#3dc1dc"/>' +
      '<path d="M31 24l22 11" stroke="#3dc1dc" stroke-width="5" stroke-linecap="round"/>' +
      '<path d="M31 24l22 11" stroke="#1e2a34" stroke-width="1.8" stroke-linecap="round" fill="none"/>' +
      '<circle cx="21" cy="31" r="11" fill="#3dc1dc" stroke="#1e2a34" stroke-width="2"/>' +
      '<circle cx="21" cy="31" r="6.8" fill="#ffffff" stroke="#1e2a34" stroke-width="1.5"/>' +
      '<path d="M15 31h12M21 25v12" stroke="#0e6f8a" stroke-width="1.6"/>' +
      '<circle cx="53" cy="36" r="5" fill="#2d3842" stroke="#1e2a34" stroke-width="1.8"/>' +
      '<circle cx="53" cy="36" r="2" fill="#3dc1dc"/>' +
      '</svg>',

    // Mũi xe nhọn trắng gắn ở đầu tay đòn bên phải
    nose:
      '<svg viewBox="0 0 64 48" aria-hidden="true">' +
      '<rect x="9" y="19" width="22" height="14" rx="3" fill="#ffffff" stroke="#1e2a34" stroke-width="1.8"/>' +
      '<rect x="10" y="26" width="20" height="6" fill="#3dc1dc"/>' +
      '<path d="M29 29l20 6" stroke="#3dc1dc" stroke-width="5" stroke-linecap="round"/>' +
      '<path d="M29 29l20 6" stroke="#1e2a34" stroke-width="1.8" stroke-linecap="round" fill="none"/>' +
      '<circle cx="19" cy="34" r="8" fill="#3dc1dc" stroke="#1e2a34" stroke-width="1.8"/>' +
      '<circle cx="19" cy="34" r="4.8" fill="#ffffff" stroke="#1e2a34" stroke-width="1.4"/>' +
      '<circle cx="48" cy="36" r="5" fill="#2d3842" stroke="#1e2a34" stroke-width="1.8"/>' +
      '<path d="M49 29l12 5-12 4z" fill="#ffffff" stroke="#1e2a34" stroke-width="1.8" stroke-linejoin="round"/>' +
      '</svg>',

    // Đèn pha vàng phát sáng phía trước kèm biển số đua trắng
    lights:
      '<svg viewBox="0 0 64 48" aria-hidden="true">' +
      '<polygon points="52,29 63,23 63,36" fill="#ffd23f" opacity="0.45"/>' +
      '<rect x="9" y="19" width="22" height="14" rx="3" fill="#ffffff" stroke="#1e2a34" stroke-width="1.8"/>' +
      '<rect x="10" y="26" width="20" height="6" fill="#3dc1dc"/>' +
      '<rect x="16" y="20" width="10" height="8" rx="1.5" fill="#ffffff" stroke="#1e2a34" stroke-width="1.2"/>' +
      '<path d="M19 22h4l-2.5 5" stroke="#1e2a34" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<path d="M29 29l20 6" stroke="#3dc1dc" stroke-width="5" stroke-linecap="round"/>' +
      '<path d="M29 29l20 6" stroke="#1e2a34" stroke-width="1.8" stroke-linecap="round" fill="none"/>' +
      '<circle cx="19" cy="34" r="8" fill="#3dc1dc" stroke="#1e2a34" stroke-width="1.8"/>' +
      '<circle cx="19" cy="34" r="4.8" fill="#ffffff" stroke="#1e2a34" stroke-width="1.4"/>' +
      '<circle cx="48" cy="36" r="5" fill="#2d3842" stroke="#1e2a34" stroke-width="1.8"/>' +
      '<circle cx="52" cy="29" r="3.5" fill="#ffd23f" stroke="#1e2a34" stroke-width="1.5"/>' +
      '</svg>'
  };

  window.RaceArt = {
    W,
    H,
    drawBackground,
    drawTrack,
    drawCar,
    drawFinish,
    drawParking,
    drawWall,
    PICS
  };
})();
