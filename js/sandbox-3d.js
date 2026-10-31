// Sa bàn 3D (chặng ③): mô hình 3D học sinh vừa lắp (kèm gói nâng cấp đã đưa từ xưởng sáng tạo) chuyển động theo
// chương trình đang chạy. Trình xem 3D (#app) được chuyển vào #sim-stage khi mở và trả về chặng lắp ráp khi rời.
// Tư thế lấy từ bộ mô phỏng của bài: simEngine.pose3d() → { output: góc (rad), motor: góc (rad), offset?: [x, y, z] }.
(function () {
  'use strict';

  const $ = id => document.getElementById(id);
  let isOpen = false,
    raf = 0,
    last = '',
    lastFrame = 0;

  function whenViewer(cb, tries = 0) {
    if (window.robotViewer && window.robotViewer.setSpin) cb();
    else if (tries < 200) setTimeout(() => whenViewer(cb, tries + 1), 100);
  }

  function pose() {
    const sim = window.simEngine;
    return sim && sim.pose3d ? sim.pose3d() : { output: 0, motor: 0 };
  }
  function tick(now) {
    if (!isOpen) return;
    raf = requestAnimationFrame(tick);
    if (now - lastFrame < 33) return; // ~30 khung hình/giây là đủ, nhẹ cho máy tính bảng
    lastFrame = now;
    const a = pose();
    const key = [a.output, a.motor, ...(a.offset || [])].map(v => (v || 0).toFixed(4)).join();
    if (key === last) return;
    last = key;
    window.robotViewer.setSpin(a);
  }

  function refreshModel() {
    if (!isOpen || !window.robotViewer) return;
    const deployed = (window.ZMCreative && window.ZMCreative.deployed && window.ZMCreative.deployed()) || [];
    window.robotViewer.setCreative(deployed, { plain: true });
    last = '';
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
