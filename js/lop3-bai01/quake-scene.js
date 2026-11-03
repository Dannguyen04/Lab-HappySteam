// Cảnh địa chấn nhìn ngang: mô tơ quay tay quay -> thanh truyền -> bàn rung và kết cấu nhà.
// Nếu họa sĩ cung cấp Lop3Bai01Art.scene, ưu tiên dùng art đó; Canvas là dự phòng tự đủ.
(function () {
  'use strict';
  const W = 900, H = 560, G = 424, TAU = Math.PI * 2;
  function box(c, x, y, w, h, color, r = 4) {
    c.fillStyle = color; c.beginPath(); c.roundRect(x, y, w, h, r); c.fill();
  }
  function line(c, a, b, x, y, color, width = 4) {
    c.strokeStyle = color; c.lineWidth = width; c.lineCap = 'round';
    c.beginPath(); c.moveTo(a, b); c.lineTo(x, y); c.stroke();
  }
  function fallback(c, now, s, k) {
    const bg = c.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#10243e'); bg.addColorStop(1, '#235568');
    c.fillStyle = bg; c.fillRect(0, 0, W, H);
    for (let x = 0; x < W; x += 45) line(c, x, 0, x, G, '#325769', 1);
    for (let y = 0; y < G; y += 45) line(c, 0, y, W, y, '#325769', 1);
    box(c, 0, G, W, H - G, '#1c2e3a', 0);
    line(c, 0, G, W, G, '#87bacb', 6);
    box(c, 16, 15, 866, 52, '#0d1c30', 12);
    k.label('PHÒNG KIỂM ĐỊNH ĐỊA CHẤN', 280, 49, '#ecfbff', 22);
    // Khung đế và thanh dẫn hướng cố định.
    box(c, 131, 355, 539, 62, '#36556a', 12);
    box(c, 153, 367, 498, 12, '#d0e5e9');
    for (const x of [190, 300, 410, 520, 630]) {
      box(c, x - 10, 399, 20, 20, '#97bdcd');
      c.fillStyle = '#f1fcff'; c.beginPath(); c.arc(x, 409, 4, 0, TAU); c.fill();
    }
    const theta = s.rev * TAU;
    const slide = s.shake * 22;
    box(c, 91, 283, 118, 67, '#55bccd', 12);
    box(c, 103, 295, 71, 43, '#1d748e', 8);
    k.label('M1', 136, 324, '#fff', 23);
    c.fillStyle = '#ffd26f'; c.beginPath(); c.arc(229, 320, 26, 0, TAU); c.fill();
    c.fillStyle = '#25485e'; c.beginPath(); c.arc(229, 320, 11, 0, TAU); c.fill();
    const jx = 229 + Math.cos(theta) * 19, jy = 320 + Math.sin(theta) * 19;
    line(c, jx, jy, 349 + slide, 342, '#e8b868', 10);
    line(c, 229, 320, jx, jy, '#fff1a5', 7);
    c.fillStyle = '#fff'; for (const [x, y] of [[jx, jy], [349 + slide, 342]]) {
      c.beginPath(); c.arc(x, y, 6, 0, TAU); c.fill();
    }
    // Bàn rung chạy qua lại; khung nhà có gia cường và mô phỏng trạng thái nghiêng đổ.
    box(c, 315 + slide, 341, 306, 18, '#48d6cb', 6);
    c.save(); c.translate(468 + slide, 341);
    c.rotate(s.failed ? 0.23 : s.shake * .025 + (100 - s.stability) / 900);
    if (s.has('pads')) for (const x of [-91, 75]) box(c, x, -17, 22, 14, '#ffa662');
    box(c, -115, -35, 230, 23, '#f1ce8c');
    for (const x of [-95, 82]) box(c, x, -185, 13, 155, '#a2d8e8');
    box(c, -112, -195, 223, 17, '#74d7e8');
    box(c, -111, -112, 222, 10, '#80d4e8');
    box(c, -126, -213, 250, 18, '#e2eefa');
    box(c, -58, -178, 113, 60, '#254961');
    line(c, 0, -178, 0, -118, '#9bd3e3', 4);
    if (s.has('brace')) {
      line(c, -90, -34, 87, -183, '#ffc569', 9);
      line(c, 88, -34, -88, -183, '#ffc569', 9);
    }
    if (s.has('columns')) for (const x of [-112, 103]) box(c, x, -191, 9, 156, '#ff9975');
    if (s.has('damper')) {
      line(c, 0, -213, 0, -244, '#ffe6c0', 5);
      line(c, 0, -244, -s.shake * 20, -260, '#ffe6c0', 3);
      c.fillStyle = '#ffa46e'; c.beginPath(); c.arc(-s.shake * 20, -260, 16, 0, TAU); c.fill();
    }
    c.restore();
    // Dao động kế: hình sóng thật dựa trên vận tốc và góc quay.
    box(c, 686, 93, 195, 294, '#0d1f30', 14);
    box(c, 699, 106, 169, 158, '#103a40', 8);
    for (let y = 130; y < 265; y += 26) line(c, 702, y, 865, y, '#24585b', 1);
    for (let x = 721; x < 865; x += 27) line(c, x, 109, x, 262, '#24585b', 1);
    const amp = s.motorOn ? s.power / 8 : 0;
    c.strokeStyle = s.failed ? '#ff7c86' : '#8affd9'; c.lineWidth = 3; c.beginPath();
    for (let i = 0; i < 160; i++) {
      const y = 186 - Math.sin((i / 19 - s.rev) * TAU) * amp * 42 * (.5 + i / 320);
      if (!i) c.moveTo(702, y); else c.lineTo(702 + i, y);
    }
    c.stroke();
    const level = !s.motorOn ? 'DỪNG' : s.power === 4 ? 'NHẸ' : s.power === 6 ? 'VỪA' : 'MẠNH';
    k.label('MÁY ĐO ĐỊA CHẤN', 783, 290, '#e8f6ff', 15);
    k.label('MỨC ' + level, 783, 323, s.failed ? '#ff8585' : '#87ffe0', 19);
    k.label('ĐỘ BỀN ' + s.stability.toFixed(0) + '%', 783, 354, '#ffe8ae', 16);
    box(c, 24, 462, 639, 72, '#112b3d', 10);
    k.label('M1 → TAY QUAY → THANH TRUYỀN → BÀN RUNG', 343, 489, '#efffff', 17);
    k.label(s.failed ? 'KẾT CẤU MẤT ỔN ĐỊNH' : s.running ? 'ĐANG THỬ NGHIỆM BA CẤP' : 'SẴN SÀNG THỬ NGHIỆM', 343, 516,
      s.failed ? '#ff9191' : '#9fffe0', 17);
    if (s.advanced) k.label('DƯ CHẤN ' + Math.min(s.proRound + 1, 3) + '/3', 770, 508, '#fff0b4', 18);
  }
  window.ZMSceneKit.create({
    W, H,
    draw(ctx, now, sim, kit) {
      const art = window.Lop3Bai01Art;
      if (art && typeof art.scene === 'function') art.scene(ctx, {
        t: now, rev: sim.rev, shake: sim.shake, speed: sim.power, stability: sim.stability,
        failed: sim.failed, upgrades: [...sim.upgrades], advanced: sim.advanced, proRound: sim.proRound
      });
      else fallback(ctx, now, sim, kit);
    },
    onEvent(type, data, kit) {
      if (type === 'sampleDone') {
        kit.burst(465, 145);
        kit.toast('ok', 'Đúng chương trình mẫu!', 'Đã thử đủ ba tốc độ. Hãy giảm Wait ở nấc nhanh.');
      } else if (type === 'safe') {
        kit.burst(465, 190);
        kit.toast('ok', 'Nhà trụ vững!', 'Thời gian rung mạnh đã được chỉnh hợp lý.');
      } else if (type === 'miss') {
        kit.shake(.5);
        kit.toast('warn', 'Chưa qua kiểm định', data.message);
      } else if (type === 'roundPass') {
        kit.burst(465, 190);
        kit.toast('ok', 'Qua lượt ' + data.round + '/3', data.round === 3
          ? 'Đã hoàn thành ba đợt dư chấn.' : 'Lượt tới: chỉnh Wait cuối thành ' + data.next + ' giây.');
      }
    }
  });
})();
