// Tranh vẽ cảnh sao Hỏa và robot tìm kiếm nguồn nước cho Lớp 3 · Bài 11.
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

  // Dữ liệu sỏi đá cố định trên mặt đất (không dùng Math.random để tránh chớp giật)
  const PEBBLES = [
    { x: 35, y: 442, rx: 3.5, ry: 2, c: '#8a3818' },
    { x: 75, y: 478, rx: 4.5, ry: 2.8, c: '#5a2010' },
    { x: 120, y: 448, rx: 3, ry: 2, c: '#a84420' },
    { x: 165, y: 505, rx: 5, ry: 3, c: '#5a2010' },
    { x: 215, y: 440, rx: 3.2, ry: 2.2, c: '#8a3818' },
    { x: 260, y: 472, rx: 4, ry: 2.5, c: '#5a2010' },
    { x: 310, y: 520, rx: 5.5, ry: 3.2, c: '#451608' },
    { x: 355, y: 445, rx: 2.8, ry: 1.8, c: '#a84420' },
    { x: 405, y: 485, rx: 4.2, ry: 2.6, c: '#8a3818' },
    { x: 450, y: 452, rx: 3.5, ry: 2, c: '#5a2010' },
    { x: 495, y: 512, rx: 4.8, ry: 3, c: '#451608' },
    { x: 540, y: 444, rx: 3, ry: 2, c: '#8a3818' },
    { x: 585, y: 476, rx: 4.5, ry: 2.6, c: '#a84420' },
    { x: 630, y: 502, rx: 3.8, ry: 2.4, c: '#5a2010' },
    { x: 675, y: 446, rx: 2.6, ry: 1.8, c: '#8a3818' },
    { x: 720, y: 480, rx: 4.4, ry: 2.8, c: '#451608' },
    { x: 765, y: 442, rx: 3.2, ry: 2, c: '#a84420' },
    { x: 810, y: 518, rx: 5, ry: 3.2, c: '#5a2010' },
    { x: 855, y: 462, rx: 3.6, ry: 2.2, c: '#8a3818' }
  ];

  // Dữ liệu sao cố định trên bầu trời sao Hỏa
  const STARS = [
    { x: 45, y: 35, r: 1.6, f: 1.8 },
    { x: 110, y: 65, r: 1.2, f: 2.3 },
    { x: 180, y: 28, r: 2.0, f: 1.5 },
    { x: 250, y: 75, r: 1.4, f: 3.1 },
    { x: 320, y: 40, r: 1.8, f: 1.2 },
    { x: 390, y: 85, r: 1.3, f: 2.7 },
    { x: 470, y: 30, r: 2.2, f: 1.6 },
    { x: 540, y: 60, r: 1.5, f: 2.4 },
    { x: 620, y: 25, r: 1.9, f: 1.9 },
    { x: 690, y: 70, r: 1.4, f: 2.8 },
    { x: 770, y: 45, r: 2.1, f: 1.4 },
    { x: 840, y: 80, r: 1.5, f: 2.1 }
  ];

  // 1. Vẽ nền sao Hỏa: bầu trời hoàng hôn cam hồng, mặt trời xa, Trái Đất, đồi núi, mặt đất sỏi đá
  function drawBackground(ctx, t) {
    const sec = typeof t === 'number' ? t : 0;

    // --- Bầu trời sao Hỏa: từ tím đỏ vũ trụ sang cam hồng nhạt ---
    const sky = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
    sky.addColorStop(0, '#3a1f38');
    sky.addColorStop(0.35, '#6c3546');
    sky.addColorStop(0.7, '#c9644e');
    sky.addColorStop(1, '#f1a87d');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, GROUND_Y);

    // --- Các ngôi sao lấp lánh nhẹ nhàng ---
    for (let i = 0; i < STARS.length; i++) {
      const st = STARS[i];
      const alpha = 0.45 + 0.45 * Math.sin(sec * st.f + i);
      ctx.fillStyle = `rgba(255, 245, 230, ${alpha.toFixed(2)})`;
      ctx.beginPath();
      ctx.arc(st.x, st.y, st.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // --- Trái Đất xa xôi nhìn từ sao Hỏa (chấm xanh biếc hy vọng) ---
    const earthX = 145, earthY = 70;
    const earthGlow = ctx.createRadialGradient(earthX, earthY, 2, earthX, earthY, 14);
    earthGlow.addColorStop(0, 'rgba(100, 210, 255, 0.7)');
    earthGlow.addColorStop(1, 'rgba(100, 210, 255, 0)');
    ctx.fillStyle = earthGlow;
    ctx.beginPath();
    ctx.arc(earthX, earthY, 14, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#4fa9d8';
    ctx.beginPath();
    ctx.arc(earthX, earthY, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(earthX - 0.8, earthY - 0.8, 1.2, 0, Math.PI * 2);
    ctx.fill();

    // --- Mặt trời sao Hỏa nhỏ và nhạt xa xa ---
    const sunX = 720, sunY = 110;
    const sunGlow = ctx.createRadialGradient(sunX, sunY, 6, sunX, sunY, 50);
    sunGlow.addColorStop(0, 'rgba(255, 250, 225, 0.55)');
    sunGlow.addColorStop(0.5, 'rgba(255, 220, 180, 0.2)');
    sunGlow.addColorStop(1, 'rgba(255, 200, 160, 0)');
    ctx.fillStyle = sunGlow;
    ctx.beginPath();
    ctx.arc(sunX, sunY, 50, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#fffef0';
    ctx.beginPath();
    ctx.arc(sunX, sunY, 11, 0, Math.PI * 2);
    ctx.fill();

    // --- Vệt mây bụi gió sao Hỏa nhẹ trôi ---
    ctx.save();
    ctx.fillStyle = 'rgba(255, 220, 190, 0.18)';
    for (let i = 0; i < 3; i++) {
      const cy = 135 + i * 45;
      const sp = 12 + i * 7;
      const cx = ((sec * sp + i * 290) % (W + 280)) - 140;
      const len = 110 + i * 35;
      ctx.beginPath();
      ctx.ellipse(cx, cy, len, 9 + i * 2, -0.03, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // --- Dãy núi xa tầng 1 (màu tím hồng đất nhạt) ---
    ctx.fillStyle = '#8e4b55';
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y - 80);
    ctx.bezierCurveTo(120, GROUND_Y - 150, 240, GROUND_Y - 110, 380, GROUND_Y - 165);
    ctx.bezierCurveTo(520, GROUND_Y - 210, 680, GROUND_Y - 130, 780, GROUND_Y - 170);
    ctx.bezierCurveTo(830, GROUND_Y - 190, 870, GROUND_Y - 160, W, GROUND_Y - 140);
    ctx.lineTo(W, GROUND_Y);
    ctx.lineTo(0, GROUND_Y);
    ctx.closePath();
    ctx.fill();

    // --- Dãy đồi đỏ tầng 2 (gần hơn, sắc nét) ---
    ctx.fillStyle = '#b65236';
    ctx.strokeStyle = '#1e2a34';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y - 40);
    ctx.bezierCurveTo(110, GROUND_Y - 70, 210, GROUND_Y - 95, 320, GROUND_Y - 55);
    ctx.bezierCurveTo(450, GROUND_Y - 25, 540, GROUND_Y - 80, 660, GROUND_Y - 50);
    ctx.bezierCurveTo(740, GROUND_Y - 30, 820, GROUND_Y - 75, W, GROUND_Y - 45);
    ctx.lineTo(W, GROUND_Y);
    ctx.lineTo(0, GROUND_Y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Mảng bóng đổ trên sườn đồi
    ctx.fillStyle = 'rgba(75, 25, 15, 0.25)';
    ctx.beginPath();
    ctx.moveTo(210, GROUND_Y - 95);
    ctx.lineTo(260, GROUND_Y - 40);
    ctx.lineTo(320, GROUND_Y - 55);
    ctx.closePath();
    ctx.fill();

    // --- Mặt đất sao Hỏa (từ GROUND_Y trở xuống) ---
    // Lớp đất mặt màu đỏ gạch
    const groundGrad = ctx.createLinearGradient(0, GROUND_Y, 0, H);
    groundGrad.addColorStop(0, '#cf582e');
    groundGrad.addColorStop(0.2, '#b24420');
    groundGrad.addColorStop(0.6, '#7e2d14');
    groundGrad.addColorStop(1, '#4e1b0a');
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, GROUND_Y, W, H - GROUND_Y);

    // Đường viền ngăn cách mặt đất sắc nét
    ctx.strokeStyle = '#1e2a34';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);
    ctx.lineTo(W, GROUND_Y);
    ctx.stroke();

    // Dải cát bề mặt sáng màu
    ctx.fillStyle = '#e27344';
    ctx.fillRect(0, GROUND_Y, W, 5);

    // Tầng địa chất trầm tích sao Hỏa dưới lòng đất
    ctx.fillStyle = 'rgba(230, 150, 110, 0.16)';
    ctx.fillRect(0, GROUND_Y + 24, W, 9);
    ctx.fillRect(0, GROUND_Y + 54, W, 14);
    ctx.fillStyle = 'rgba(40, 15, 8, 0.25)';
    ctx.fillRect(0, GROUND_Y + 38, W, 8);
    ctx.fillRect(0, GROUND_Y + 85, W, 12);

    // Sỏi đá nhỏ rải rác cố định
    for (let i = 0; i < PEBBLES.length; i++) {
      const p = PEBBLES[i];
      ctx.fillStyle = p.c;
      ctx.beginPath();
      ctx.ellipse(p.x, p.y, p.rx, p.ry, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 2. Trạm nghiên cứu / Căn cứ sao Hỏa ở điểm xuất phát (x = tâm trạm)
  function drawBase(ctx, x, yOrUndefined) {
    const y = typeof yOrUndefined === 'number' ? yOrUndefined : GROUND_Y;

    ctx.save();
    ctx.translate(x, y);

    // Bóng trạm trên mặt đất
    ctx.fillStyle = 'rgba(40, 16, 8, 0.35)';
    ctx.beginPath();
    ctx.ellipse(0, 3, 56, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    // Khung móng neo đất
    ctx.fillStyle = '#37474f';
    ctx.strokeStyle = '#1e2a34';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    roundRect(ctx, -52, -14, 104, 14, [4, 4, 0, 0]);
    ctx.fill();
    ctx.stroke();

    // Mái vòm chính trạm sinh sống (Mái vòm trắng viền xanh ngọc)
    ctx.fillStyle = '#f4f9fc';
    ctx.beginPath();
    ctx.arc(0, -14, 44, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Vành trang trí xanh ngọc công nghệ
    ctx.fillStyle = '#3dc1dc';
    ctx.strokeStyle = '#0e6f8a';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(0, -14, 44, Math.PI * 1.15, Math.PI * 1.85);
    ctx.arc(0, -14, 36, Math.PI * 1.85, Math.PI * 1.15, true);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Cửa khoang áp suất (Air-lock)
    ctx.fillStyle = '#2d3842';
    ctx.strokeStyle = '#1e2a34';
    ctx.lineWidth = 2;
    ctx.beginPath();
    roundRect(ctx, -14, -36, 28, 22, [6, 6, 0, 0]);
    ctx.fill();
    ctx.stroke();

    // Đèn trạng thái trạm (xanh lá an toàn)
    ctx.fillStyle = '#4cd137';
    ctx.beginPath();
    ctx.arc(0, -42, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Cột ăng-ten thông tin liên lạc đỉnh vòm
    ctx.strokeStyle = '#90a4ae';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(0, -58);
    ctx.lineTo(0, -88);
    ctx.stroke();

    // Đĩa ăng-ten parabol quay góc
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#1e2a34';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(8, -88, 12, 5, 0.45, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Biển hiệu căn cứ
    ctx.fillStyle = '#1e2a34';
    ctx.font = '800 11px "Be Vietnam Pro",sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('CĂN CỨ', 0, -20);

    ctx.restore();
  }

  // 3. Vách núi đá / Vực đá cuối đường kết thúc thử thách
  function drawCliff(ctx, x, yOrUndefined) {
    const y = typeof yOrUndefined === 'number' ? yOrUndefined : GROUND_Y;

    ctx.save();
    ctx.translate(x, y);

    // Khối vách núi cao tầng bên phải
    ctx.fillStyle = '#6b2512';
    ctx.strokeStyle = '#1e2a34';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(8, -40);
    ctx.lineTo(-6, -95);
    ctx.lineTo(12, -150);
    ctx.lineTo(2, -210);
    ctx.lineTo(40, -250);
    ctx.lineTo(90, -250);
    ctx.lineTo(90, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Mảng sáng cạnh đá gồ ghề
    ctx.fillStyle = '#9e3b1c';
    ctx.beginPath();
    ctx.moveTo(8, -40);
    ctx.lineTo(26, -45);
    ctx.lineTo(18, -130);
    ctx.lineTo(-6, -95);
    ctx.closePath();
    ctx.fill();

    // Vết nứt khe đá
    ctx.strokeStyle = '#381208';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(4, -60);
    ctx.lineTo(20, -75);
    ctx.lineTo(14, -110);
    ctx.stroke();

    // Tảng đá sụt chân vách núi
    ctx.fillStyle = '#823016';
    ctx.strokeStyle = '#1e2a34';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    roundRect(ctx, -18, -22, 26, 22, 5);
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }

  // 4. Mỏm băng chứa nước trên sao Hỏa (Vùng băng ngầm / Túi nước)
  // Tham số site: { a, seen, pump, done, passed, short, t }
  function drawIcePatch(ctx, x, yOrSite, maybeSite) {
    let y = GROUND_Y;
    let site = {};
    if (typeof yOrSite === 'number') {
      y = yOrSite;
      site = maybeSite || {};
    } else if (typeof yOrSite === 'object' && yOrSite !== null) {
      site = yOrSite;
      y = typeof site.y === 'number' ? site.y : GROUND_Y;
    }

    const sec = typeof site.t === 'number' ? site.t : 0;
    const isDone = !!site.done;
    const isPumping = !isDone && (site.pump > 0);
    const isSeen = !isDone && (!!site.seen || isPumping);

    ctx.save();
    ctx.translate(x, y);

    // Hố va chạm / trũng đất quanh vỉa băng
    ctx.fillStyle = 'rgba(60, 20, 10, 0.4)';
    ctx.beginPath();
    ctx.ellipse(0, 4, 38, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    // Vành đất đỏ nhô cao quanh hố băng
    ctx.fillStyle = '#9c3d1e';
    ctx.strokeStyle = '#1e2a34';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, 0, 34, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Lớp tuyết sương giá bao quanh vỉa băng
    ctx.fillStyle = '#e3f7fc';
    ctx.beginPath();
    ctx.ellipse(0, -1, 28, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Khối tinh thể băng xanh lấp lánh (Ice core)
    const iceGrad = ctx.createLinearGradient(0, -18, 0, 4);
    iceGrad.addColorStop(0, '#ffffff');
    iceGrad.addColorStop(0.35, '#a0ecfd');
    iceGrad.addColorStop(0.8, '#3dc1dc');
    iceGrad.addColorStop(1, '#0e6f8a');
    ctx.fillStyle = iceGrad;
    ctx.strokeStyle = '#1e2a34';
    ctx.lineWidth = 2;

    // Các cụm tinh thể băng nhô lên khỏi mặt đất
    const shards = [
      { x: -14, y: 1, w: 9, h: 18, slant: -0.25 },
      { x: -5, y: 3, w: 11, h: 26, slant: -0.05 },
      { x: 6, y: 2, w: 10, h: 22, slant: 0.15 },
      { x: 14, y: 0, w: 8, h: 14, slant: 0.3 }
    ];

    for (let i = 0; i < shards.length; i++) {
      const sh = shards[i];
      ctx.save();
      ctx.translate(sh.x, sh.y);
      ctx.rotate(sh.slant);
      ctx.beginPath();
      ctx.moveTo(-sh.w / 2, 0);
      ctx.lineTo(-sh.w / 3, -sh.h * 0.7);
      ctx.lineTo(0, -sh.h);
      ctx.lineTo(sh.w / 3, -sh.h * 0.75);
      ctx.lineTo(sh.w / 2, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Cạnh vát phản quang lấp lánh trên tinh thể băng
      ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
      ctx.beginPath();
      ctx.moveTo(0, -sh.h);
      ctx.lineTo(sh.w / 3, -sh.h * 0.75);
      ctx.lineTo(0, 0);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // Hiệu ứng phát hiện (Sensor target reticle)
    if (isSeen && !isDone) {
      const pulse = 0.85 + 0.15 * Math.sin(sec * 8);
      ctx.save();
      ctx.translate(0, -38);
      ctx.scale(pulse, pulse);

      // Vòng tròn mục tiêu quét nước
      ctx.strokeStyle = '#3dc1dc';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(0, 0, 20, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Khung tiêu điểm 4 góc
      ctx.strokeStyle = '#ffd23f';
      ctx.lineWidth = 2;
      const r = 16;
      ctx.beginPath();
      ctx.moveTo(-r, -r + 6); ctx.lineTo(-r, -r); ctx.lineTo(-r + 6, -r);
      ctx.moveTo(r - 6, -r); ctx.lineTo(r, -r); ctx.lineTo(r, -r + 6);
      ctx.moveTo(r, r - 6); ctx.lineTo(r, r); ctx.lineTo(r - 6, r);
      ctx.moveTo(-r + 6, r); ctx.lineTo(-r, r); ctx.lineTo(-r, r - 6);
      ctx.stroke();

      // Nhãn "NƯỚC ĐÁ" nổi bật
      ctx.font = '800 11px "Be Vietnam Pro",sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffd23f';
      ctx.fillText('NƯỚC ĐÁ', 0, -24);
      ctx.restore();
    }

    // Hiệu ứng đang bơm nước (Bong bóng nước và vòi hút)
    if (isPumping) {
      // Quầng sáng dòng nước được hút lên
      const stream = ctx.createLinearGradient(0, 0, -20, -50);
      stream.addColorStop(0, 'rgba(61, 193, 220, 0.6)');
      stream.addColorStop(1, 'rgba(61, 193, 220, 0.05)');
      ctx.fillStyle = stream;
      ctx.beginPath();
      ctx.moveTo(-16, -10);
      ctx.lineTo(-30, -56);
      ctx.lineTo(-10, -56);
      ctx.lineTo(16, -10);
      ctx.closePath();
      ctx.fill();

      // Hạt nước bay theo chu kỳ
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 4; i++) {
        const prog = (sec * 2 + i * 0.25) % 1;
        const bx = -22 * prog + (i % 2 === 0 ? 3 : -3);
        const by = -6 - 45 * prog;
        ctx.beginPath();
        ctx.arc(bx, by, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Thanh tiến trình bơm nước
      const pRatio = Math.min(1, Math.max(0, site.pump / (site.pumpTime || 3)));
      ctx.fillStyle = 'rgba(30, 42, 52, 0.85)';
      ctx.strokeStyle = '#3dc1dc';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      roundRect(ctx, -24, -68, 48, 8, 3);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#4cd137';
      ctx.beginPath();
      roundRect(ctx, -23, -67, 46 * pRatio, 6, 2);
      ctx.fill();
    }

    // Đã bơm xong: Huy hiệu đã thu thập mẫu nước hoàn tất
    if (isDone) {
      ctx.save();
      ctx.translate(0, -42);

      // Vòng tròn xanh lá thắng lợi
      ctx.fillStyle = '#2ed573';
      ctx.strokeStyle = '#1e2a34';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.arc(0, 0, 13, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Dấu tích chữ V trắng
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.8;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(-5, 0);
      ctx.lineTo(-1, 4);
      ctx.lineTo(5, -4);
      ctx.stroke();

      // Giọt nước nhỏ bên cạnh
      ctx.fillStyle = '#3dc1dc';
      ctx.strokeStyle = '#0e6f8a';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(18, -4);
      ctx.quadraticCurveTo(24, 4, 18, 7);
      ctx.quadraticCurveTo(12, 4, 18, -4);
      ctx.fill();
      ctx.stroke();

      ctx.restore();
    }

    ctx.restore();
  }

  // 5. Robot tìm kiếm nguồn nước sao Hỏa (Chassis WeDo/Alpha + Smart Hub + Cột cảm biến + Bánh xe + Phụ kiện)
  // Tham số o: wheel, shake, scan, pumping, tank, pump, solar, color, t
  function drawRover(ctx, x, yOrOpts, maybeOpts) {
    let y = GROUND_Y;
    let o = {};
    if (typeof yOrOpts === 'number') {
      y = yOrOpts;
      o = maybeOpts || {};
    } else if (typeof yOrOpts === 'object' && yOrOpts !== null) {
      o = yOrOpts;
      y = typeof o.y === 'number' ? o.y : GROUND_Y;
    }

    const opts = o || {};
    const wheelAngle = typeof opts.wheel === 'number' ? opts.wheel : 0;
    const shakeVal = Math.min(1, Math.max(0, typeof opts.shake === 'number' ? opts.shake : 0));
    const sec = typeof opts.t === 'number' ? opts.t : 0;

    // Rung lắc nhẹ khi gặp địa hình xấu hoặc phanh gấp
    const shakeX = shakeVal > 0 ? Math.sin(sec * 60) * 3 * shakeVal : 0;
    const shakeY = shakeVal > 0 ? Math.cos(sec * 50) * 2 * shakeVal : 0;

    ctx.save();
    ctx.translate(x + shakeX, y + shakeY);

    // ==========================================
    // LỚP 1: BÁNH SAU PHÍA XA (bánh bên kia)
    // ==========================================
    const rearWheelX = -40;
    const rearWheelY = -23;
    const wheelRadius = 23;

    ctx.save();
    ctx.translate(rearWheelX, rearWheelY);
    ctx.rotate(wheelAngle);

    // Lốp xanh ngọc đậm (xa)
    ctx.fillStyle = '#2694ab';
    ctx.strokeStyle = '#0e6f8a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, wheelRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Vành trong mờ
    ctx.fillStyle = '#d5ebee';
    ctx.beginPath();
    ctx.arc(0, 0, wheelRadius * 0.65, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Nan hoa bánh xa
    ctx.strokeStyle = '#0e6f8a';
    ctx.lineWidth = 2.2;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(-wheelRadius * 0.62, 0);
      ctx.lineTo(wheelRadius * 0.62, 0);
      ctx.stroke();
      ctx.rotate(Math.PI / 4);
    }
    ctx.restore();

    // ==========================================
    // LỚP 2: BỒN CHỨA NƯỚC (Gói sáng tạo o.tank - mặt sau)
    // ==========================================
    if (opts.tank) {
      ctx.save();
      // Khung đế gắn bồn phía sau
      ctx.fillStyle = '#0e6f8a';
      ctx.strokeStyle = '#1e2a34';
      ctx.lineWidth = 2;
      ctx.beginPath();
      roundRect(ctx, -70, -68, 26, 36, 4);
      ctx.fill();
      ctx.stroke();

      // Ruột bồn nước chứa nước xanh trong suốt
      ctx.fillStyle = '#22a6b3';
      ctx.beginPath();
      roundRect(ctx, -68, -65, 22, 30, 3);
      ctx.fill();

      // Mặt nước gợn sóng bên trong bồn
      const wave = Math.sin(sec * 4) * 2;
      ctx.fillStyle = '#7ed6df';
      ctx.beginPath();
      ctx.moveTo(-68, -50 + wave);
      ctx.lineTo(-46, -50 - wave);
      ctx.lineTo(-46, -35);
      ctx.lineTo(-68, -35);
      ctx.closePath();
      ctx.fill();

      // Nắp van kim loại trên đỉnh bồn
      ctx.fillStyle = '#ffd23f';
      ctx.strokeStyle = '#1e2a34';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      roundRect(ctx, -62, -74, 10, 6, 2);
      ctx.fill();
      ctx.stroke();

      ctx.restore();
    }

    // ==========================================
    // LỚP 3: KHUNG CHASSIS & BỘ NÃO ĐIỀU KHIỂN
    // ==========================================
    // Khung dầm chịu lực dưới gầm xe
    ctx.fillStyle = '#3dc1dc';
    ctx.strokeStyle = '#1e2a34';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    roundRect(ctx, -56, -36, 72, 14, 3);
    ctx.fill();
    ctx.stroke();

    // Các lỗ tròn Technic trên thanh dầm
    ctx.fillStyle = '#0e6f8a';
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.arc(-46 + i * 16, -29, 3.2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Cụm động cơ điện nằm giữa gầm
    ctx.fillStyle = '#eef2f5';
    ctx.strokeStyle = '#1e2a34';
    ctx.lineWidth = 2;
    ctx.beginPath();
    roundRect(ctx, -28, -46, 36, 12, 2);
    ctx.fill();
    ctx.stroke();

    // Hộp Bộ não thông minh (WeDo / Alpha Smart Hub)
    // Thân dưới màu xanh ngọc
    ctx.fillStyle = '#3dc1dc';
    ctx.strokeStyle = '#1e2a34';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    roundRect(ctx, -48, -72, 64, 28, [2, 2, 4, 4]);
    ctx.fill();
    ctx.stroke();

    // Các lỗ pin bên hông hộp bộ não
    ctx.fillStyle = '#0e6f8a';
    ctx.beginPath();
    ctx.arc(-36, -58, 2.8, 0, Math.PI * 2);
    ctx.arc(-22, -58, 2.8, 0, Math.PI * 2);
    ctx.arc(-8, -58, 2.8, 0, Math.PI * 2);
    ctx.arc(6, -58, 2.8, 0, Math.PI * 2);
    ctx.fill();

    // Mặt trên nắp hộp màu trắng tinh
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#1e2a34';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    roundRect(ctx, -48, -77, 64, 9, [4, 4, 0, 0]);
    ctx.fill();
    ctx.stroke();

    // 3 nút điều khiển cyan trên mặt hộp (Start / Mũi tên)
    ctx.fillStyle = '#3dc1dc';
    for (let i = 0; i < 3; i++) {
      ctx.fillRect(-38 + i * 16, -75, 10, 5);
    }

    // Đèn LED chỉ thị trạng thái trên bộ não
    const ledColor = opts.color === 'red' ? '#ff4757' : opts.color === 'blue' ? '#2ed573' : '#2ed573';
    ctx.fillStyle = ledColor;
    ctx.beginPath();
    ctx.arc(8, -65, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // ==========================================
    // LỚP 4: BÁNH BI TRƯỚC (Castor Ball)
    // ==========================================
    const casterX = 24;
    // Khung nhựa đỡ bánh bi phía trước
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#1e2a34';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    roundRect(ctx, casterX - 8, -26, 18, 16, 3);
    ctx.fill();
    ctx.stroke();

    // Chốt nối đen
    ctx.fillStyle = '#1e2a34';
    ctx.beginPath();
    ctx.arc(casterX - 2, -18, 2.5, 0, Math.PI * 2);
    ctx.arc(casterX + 6, -18, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Viên bi tròn xoay tiếp xúc mặt đất
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#1e2a34';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(casterX + 1, -6, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Khe hở đỡ bóng
    ctx.strokeStyle = '#718093';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(casterX + 1, -6, 3, 0.4, Math.PI * 0.9);
    ctx.stroke();

    // ==========================================
    // LỚP 5: CỘT CAO & CẢM BIẾN MÀU / DÒ NƯỚC (Mast & Sensor)
    // ==========================================
    // Cột thanh Technic trắng vươn lên cao và nghiêng về phía trước
    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#1e2a34';
    ctx.lineWidth = 2.4;

    // Đoạn thẳng đứng của cột
    ctx.beginPath();
    roundRect(ctx, 4, -112, 10, 48, 4);
    ctx.fill();
    ctx.stroke();

    // Đoạn gấp khúc hướng về phía trước
    ctx.beginPath();
    ctx.moveTo(8, -108);
    ctx.lineTo(26, -120);
    ctx.lineTo(34, -112);
    ctx.lineTo(14, -98);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Các lỗ tròn trên cột Technic
    ctx.fillStyle = '#1e2a34';
    ctx.beginPath();
    ctx.arc(9, -74, 2.5, 0, Math.PI * 2);
    ctx.arc(9, -88, 2.5, 0, Math.PI * 2);
    ctx.arc(9, -102, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Hộp cảm biến ở đầu cột (Color / Water Sensor)
    const sensorX = 30;
    const sensorY = -124;

    // Vỏ hộp cảm biến màu trắng
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#1e2a34';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    roundRect(ctx, sensorX, sensorY, 24, 20, 4);
    ctx.fill();
    ctx.stroke();

    // Mặt trước cảm biến màu xanh ngọc
    ctx.fillStyle = '#3dc1dc';
    ctx.strokeStyle = '#0e6f8a';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    roundRect(ctx, sensorX + 14, sensorY + 2, 8, 16, 2);
    ctx.fill();
    ctx.stroke();

    // Mắt quang học trung tâm
    const eyeColor = opts.color === 'red' ? '#ff3838' : opts.color === 'blue' ? '#00d2d3' : '#1e2a34';
    ctx.fillStyle = eyeColor;
    ctx.beginPath();
    ctx.arc(sensorX + 17, sensorY + 10, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Nếu mắt đang phát sáng nhận diện (đỏ hoặc xanh)
    if (opts.color === 'red' || opts.color === 'blue') {
      ctx.strokeStyle = opts.color === 'red' ? 'rgba(255, 56, 56, 0.6)' : 'rgba(0, 210, 211, 0.6)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(sensorX + 17, sensorY + 10, 6.5, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Tia quét cảm biến dò tìm phía trước (Scanner Cone)
    if (opts.scan) {
      const scanGrad = ctx.createRadialGradient(sensorX + 18, sensorY + 10, 2, sensorX + 70, 0, 95);
      scanGrad.addColorStop(0, 'rgba(61, 193, 220, 0.65)');
      scanGrad.addColorStop(0.5, 'rgba(61, 193, 220, 0.25)');
      scanGrad.addColorStop(1, 'rgba(61, 193, 220, 0)');

      ctx.fillStyle = scanGrad;
      ctx.beginPath();
      ctx.moveTo(sensorX + 22, sensorY + 10);
      ctx.lineTo(sensorX + 110, -5);
      ctx.lineTo(sensorX + 50, 4);
      ctx.closePath();
      ctx.fill();

      // Vạch sóng quét nhấp nhô
      ctx.strokeStyle = 'rgba(61, 193, 220, 0.8)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(sensorX + 22, sensorY + 10, 45, 0.35, 0.85);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(sensorX + 22, sensorY + 10, 75, 0.38, 0.82);
      ctx.stroke();
    }
    ctx.restore();

    // ==========================================
    // LỚP 6: MÁY BƠM MẠNH PHÍA TRƯỚC (Gói sáng tạo o.pump)
    // ==========================================
    if (opts.pump) {
      ctx.save();
      const pumpX = 36;
      const pumpY = -44;

      // Cụm mô-tơ bơm nước gắn trước
      ctx.fillStyle = '#ff9f43';
      ctx.strokeStyle = '#1e2a34';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      roundRect(ctx, pumpX, pumpY, 18, 18, 3);
      ctx.fill();
      ctx.stroke();

      // Cánh quạt bơm xoay bên trong
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(pumpX + 9, pumpY + 9, 5, 0, Math.PI * 2);
      ctx.fill();

      // Vòi hút / Cần bơm cong cắm xuống đất
      ctx.strokeStyle = '#1e2a34';
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(pumpX + 14, pumpY + 14);
      ctx.quadraticCurveTo(pumpX + 28, pumpY + 22, pumpX + 24, -2);
      ctx.stroke();

      ctx.strokeStyle = '#3dc1dc';
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.moveTo(pumpX + 14, pumpY + 14);
      ctx.quadraticCurveTo(pumpX + 28, pumpY + 22, pumpX + 24, -2);
      ctx.stroke();

      // Đầu hút kim loại tiếp đất
      ctx.fillStyle = '#ffd23f';
      ctx.strokeStyle = '#1e2a34';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      roundRect(ctx, pumpX + 20, -5, 8, 6, 2);
      ctx.fill();
      ctx.stroke();

      // Nếu đang bơm nước: tia hút nước xanh vào vòi
      if (opts.pumping) {
        ctx.fillStyle = '#00d2d3';
        const pStep = (sec * 5) % 1;
        ctx.beginPath();
        ctx.arc(pumpX + 24, -2 - 14 * pStep, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }

    // ==========================================
    // LỚP 7: PIN MẶT TRỜI TRÊN MÁI (Gói sáng tạo o.solar)
    // ==========================================
    if (opts.solar) {
      ctx.save();
      const solarX = -16;
      const solarY = -92;

      // Cột giá đỡ pin mặt trời
      ctx.strokeStyle = '#1e2a34';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(solarX, -77);
      ctx.lineTo(solarX, solarY + 4);
      ctx.stroke();

      // Tấm pin quang điện nghiêng nhẹ đón nắng
      ctx.translate(solarX, solarY);
      ctx.rotate(-0.08);

      // Khung viền tấm pin
      ctx.fillStyle = '#1e2a34';
      ctx.beginPath();
      roundRect(ctx, -34, -8, 68, 12, 3);
      ctx.fill();

      // Các ô pin màu xanh dương đậm không gian
      ctx.fillStyle = '#103778';
      ctx.fillRect(-32, -6, 64, 8);

      // Đường lưới dẫn điện màu bạc sáng
      ctx.strokeStyle = '#74b9ff';
      ctx.lineWidth = 1;
      for (let i = -24; i <= 24; i += 12) {
        ctx.beginPath();
        ctx.moveTo(i, -6);
        ctx.lineTo(i, 2);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.moveTo(-32, -2);
      ctx.lineTo(32, -2);
      ctx.stroke();

      ctx.restore();
    }

    // ==========================================
    // LỚP 8: BÁNH SAU GẦN (Near Wheel)
    // ==========================================
    ctx.save();
    ctx.translate(rearWheelX, rearWheelY);
    ctx.rotate(wheelAngle);

    // Lốp cao su xanh ngọc sáng màu
    ctx.fillStyle = '#3dc1dc';
    ctx.strokeStyle = '#1e2a34';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(0, 0, wheelRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Vành trong màu trắng sắc nét
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, wheelRadius * 0.65, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Nan hoa 4 chấu xoay theo chuyển động
    ctx.strokeStyle = '#1e2a34';
    ctx.lineWidth = 2.6;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(-wheelRadius * 0.62, 0);
      ctx.lineTo(wheelRadius * 0.62, 0);
      ctx.stroke();
      ctx.rotate(Math.PI / 4);
    }

    // Trục trung tâm đen
    ctx.fillStyle = '#1e2a34';
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    ctx.restore();
  }

  // 6. Thước đo / Bảng chỉ thị lượng nước thu thập được (HUD Water Gauge)
  function drawWaterMeter(ctx, x, y, got, max, liters) {
    const g = got || 0;
    const m = max || 3;
    const lit = liters || (g * 2);

    ctx.save();
    ctx.translate(x, y);

    // Hộp HUD nền tối trong suốt
    ctx.fillStyle = 'rgba(15, 30, 45, 0.88)';
    ctx.strokeStyle = '#3dc1dc';
    ctx.lineWidth = 2;
    ctx.beginPath();
    roundRect(ctx, 0, 0, 160, 48, 8);
    ctx.fill();
    ctx.stroke();

    // Biểu tượng giọt nước xanh ngọc
    ctx.fillStyle = '#3dc1dc';
    ctx.beginPath();
    ctx.moveTo(22, 12);
    ctx.quadraticCurveTo(32, 26, 22, 33);
    ctx.quadraticCurveTo(12, 26, 22, 12);
    ctx.fill();

    // 3 vạch mẫu nước nhỏ
    for (let i = 0; i < m; i++) {
      const isFilled = i < g;
      ctx.fillStyle = isFilled ? '#2ed573' : '#4b6584';
      ctx.strokeStyle = '#1e2a34';
      ctx.lineWidth = 1;
      ctx.beginPath();
      roundRect(ctx, 42 + i * 18, 14, 12, 18, 2);
      ctx.fill();
      ctx.stroke();
    }

    // Số lít nước
    ctx.font = '800 13px "Be Vietnam Pro",sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.fillText(`${lit} lít`, 104, 28);

    ctx.restore();
  }

  // ==========================================
  // HÌNH GÓI SÁNG TẠO (PICS) - 3 CHUỖI SVG 64x48
  // ==========================================
  const PICS = {
    // 1. Bồn chứa nước (tank): bồn chứa gắn trên lưng robot
    tank:
      '<svg viewBox="0 0 64 48" aria-hidden="true">' +
      '<rect x="10" y="24" width="40" height="13" rx="3" fill="#ffffff" stroke="#1e2a34" stroke-width="1.8"/>' +
      '<circle cx="18" cy="40" r="5.5" fill="#3dc1dc" stroke="#1e2a34" stroke-width="1.5"/>' +
      '<circle cx="42" cy="40" r="5.5" fill="#3dc1dc" stroke="#1e2a34" stroke-width="1.5"/>' +
      '<rect x="14" y="10" width="22" height="15" rx="3" fill="#3dc1dc" stroke="#0e6f8a" stroke-width="1.8"/>' +
      '<path d="M17 17h16" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/>' +
      '<rect x="22" y="7" width="6" height="4" rx="1" fill="#ffd23f" stroke="#1e2a34" stroke-width="1.2"/>' +
      '<path d="M38 24v-16l8-4" stroke="#ffffff" stroke-width="2.5" fill="none" stroke-linecap="round"/>' +
      '<rect x="42" y="4" width="10" height="8" rx="2" fill="#3dc1dc" stroke="#1e2a34" stroke-width="1.4"/>' +
      '</svg>',

    // 2. Máy bơm mạnh (pump): cụm máy bơm và cần hút nước phía trước
    pump:
      '<svg viewBox="0 0 64 48" aria-hidden="true">' +
      '<rect x="10" y="24" width="40" height="13" rx="3" fill="#ffffff" stroke="#1e2a34" stroke-width="1.8"/>' +
      '<circle cx="18" cy="40" r="5.5" fill="#3dc1dc" stroke="#1e2a34" stroke-width="1.5"/>' +
      '<circle cx="42" cy="40" r="5.5" fill="#3dc1dc" stroke="#1e2a34" stroke-width="1.5"/>' +
      '<path d="M38 24v-16l8-4" stroke="#ffffff" stroke-width="2.5" fill="none" stroke-linecap="round"/>' +
      '<rect x="42" y="4" width="10" height="8" rx="2" fill="#3dc1dc" stroke="#1e2a34" stroke-width="1.4"/>' +
      '<rect x="47" y="23" width="9" height="9" rx="1.5" fill="#ff9f43" stroke="#1e2a34" stroke-width="1.5"/>' +
      '<path d="M53 32v6M53 38h4" stroke="#1e2a34" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<path d="M53 32v6" stroke="#3dc1dc" stroke-width="1.4" fill="none" stroke-linecap="round"/>' +
      '</svg>',

    // 3. Pin mặt trời (solar): dàn pin quang điện che trên nóc
    solar:
      '<svg viewBox="0 0 64 48" aria-hidden="true">' +
      '<rect x="10" y="24" width="40" height="13" rx="3" fill="#ffffff" stroke="#1e2a34" stroke-width="1.8"/>' +
      '<circle cx="18" cy="40" r="5.5" fill="#3dc1dc" stroke="#1e2a34" stroke-width="1.5"/>' +
      '<circle cx="42" cy="40" r="5.5" fill="#3dc1dc" stroke="#1e2a34" stroke-width="1.5"/>' +
      '<path d="M38 24v-16l8-4" stroke="#ffffff" stroke-width="2.5" fill="none" stroke-linecap="round"/>' +
      '<rect x="42" y="4" width="10" height="8" rx="2" fill="#3dc1dc" stroke="#1e2a34" stroke-width="1.4"/>' +
      '<path d="M26 24v-7" stroke="#1e2a34" stroke-width="2"/>' +
      '<rect x="8" y="9" width="36" height="9" rx="1.5" fill="#103778" stroke="#1e2a34" stroke-width="1.6"/>' +
      '<path d="M17 9v9M26 9v9M35 9v9M8 13.5h36" stroke="#74b9ff" stroke-width="1"/>' +
      '</svg>'
  };

  // Xuất giao diện toàn cục
  const Art = {
    W,
    H,
    GROUND_Y,
    drawBackground,
    drawBase,
    drawCliff,
    drawIcePatch,
    drawRover,
    drawWaterMeter,
    PICS
  };

  window.WaterArt = Art;
  window.MarsWaterArt = Art;
  window.Bai11Art = Art;
})();
