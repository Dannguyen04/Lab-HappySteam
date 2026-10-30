// Sa bàn 3D (Tab 2): mô hình vệ tinh 3D học sinh vừa lắp (kèm gói nâng cấp đã đưa từ xưởng sáng tạo) quay theo
// chương trình đang chạy. Trình xem 3D (#app) được chuyển vào #sim-stage khi mở Tab 2 và trả về tab lắp ráp khi rời.
// Góc quay lấy từ SimulationEngine: rev = số vòng trục bánh răng 40 (cột anten), motorRev = số vòng bánh răng 8.
(function () {
  'use strict';

  const $ = id => document.getElementById(id);
  let isOpen = false,
    raf = 0,
    last = { output: NaN, motor: NaN },
    lastFrame = 0;

  function whenViewer(cb, tries = 0) {
    if (window.robotViewer && window.robotViewer.setSpin) cb();
    else if (tries < 200) setTimeout(() => whenViewer(cb, tries + 1), 100);
  }

  // Hai bánh răng ăn khớp quay ngược chiều nhau
  function angles() {
    const sim = window.simEngine;
    if (!sim) return { output: 0, motor: 0 };
    return { output: -sim.rev * Math.PI * 2, motor: sim.motorRev * Math.PI * 2 };
  }
  function tick(now) {
    if (!isOpen) return;
    raf = requestAnimationFrame(tick);
    if (now - lastFrame < 33) return; // ~30 khung hình/giây là đủ, nhẹ cho máy tính bảng
    lastFrame = now;
    const a = angles();
    if (Math.abs(a.output - last.output) < 1e-4 && Math.abs(a.motor - last.motor) < 1e-4) return;
    last = a;
    window.robotViewer.setSpin(a);
  }

  function refreshModel() {
    if (!isOpen || !window.robotViewer) return;
    const deployed = (window.ZMCreative && window.ZMCreative.deployed && window.ZMCreative.deployed()) || [];
    window.robotViewer.setCreative(deployed, { plain: true });
    last = { output: NaN, motor: NaN };
  }

  function open() {
    isOpen = true;
    const stage = $('sim-stage'),
      app = $('app');
    if (stage && app && app.parentElement !== stage) stage.append(app);
    whenViewer(() => {
      if (!isOpen) return;
      refreshModel();
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(tick);
      window.dispatchEvent(new Event('resize'));
    });
  }
  function close() {
    if (!isOpen) return;
    isOpen = false;
    cancelAnimationFrame(raf);
    const home = $('subview-base'),
      app = $('app');
    if (home && app && app.parentElement !== home) home.prepend(app);
    if (window.robotViewer && window.robotViewer.setCreative) window.robotViewer.setCreative(null);
  }

  document.addEventListener('DOMContentLoaded', () => {
    // Đổi khung lớn: 3D ⇄ bản đồ quỹ đạo 2D
    $('sim-swap-view')?.addEventListener('click', () => {
      const wrap = document.querySelector('.sim-stage-wrap');
      wrap.classList.toggle('map-big');
      $('sim-swap-view').setAttribute('aria-pressed', wrap.classList.contains('map-big'));
      window.dispatchEvent(new Event('resize'));
      if (window.simEngine) window.simEngine.resizeCanvas();
    });
  });

  window.ZMSandbox = { open, close, refreshModel, isOpen: () => isOpen };
})();
