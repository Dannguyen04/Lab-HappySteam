// js/spotlight.js – lớp phủ gợi ý thao tác đầu tiên (U4: không làm gián đoạn bằng hộp thoại chữ dài).
// Làm mờ nhẹ xung quanh vùng đích, chừa lỗ sáng bo tròn quanh phần tử cần bấm kèm bóng thoại ngắn + icon.
// Dùng chung cho mọi bài: ZMSpotlight.show({ target, icon, text, onClose }), ZMSpotlight.hide().
(function () {
  'use strict';

  const DEFAULT_ICON =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 11V5.5a1.5 1.5 0 0 1 3 0V10h1.5a1.5 1.5 0 0 1 1.5 1.5v1h1a1.5 1.5 0 0 1 1.5 1.5v3.5a4.5 4.5 0 0 1-4.5 4.5H10a4.5 4.5 0 0 1-4.2-2.9L4.3 15a1.5 1.5 0 0 1 2.5-1.5L9 15V11z"/></svg>';

  let root = null;
  let hole = null;
  let bubble = null;
  let currentTarget = null;
  let currentOnClose = null;
  let openTime = 0;

  function resolveTarget(target) {
    if (!target) return null;
    const el = typeof target === 'string' ? document.querySelector(target) : target;
    if (!el || el.hidden || !el.isConnected) return null;
    const style = window.getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden' || parseFloat(style.opacity) === 0) return null;
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) return null;
    return el;
  }

  function ensureDOM() {
    if (root) return;
    root = document.createElement('div');
    root.className = 'zm-spotlight';
    root.id = 'zm-spotlight';
    root.setAttribute('role', 'status');
    root.setAttribute('aria-live', 'polite');
    root.hidden = true;
    root.innerHTML =
      '<div class="zm-spotlight-hole" id="zm-spotlight-hole"></div>' +
      '<div class="zm-spotlight-bubble" id="zm-spotlight-bubble">' +
      '<span class="zm-spotlight-icon" id="zm-spotlight-icon" aria-hidden="true"></span>' +
      '<span class="zm-spotlight-text" id="zm-spotlight-text"></span>' +
      '<button type="button" class="zm-spotlight-close" id="zm-spotlight-close" aria-label="Đóng gợi ý" title="Đóng (Esc)">×</button>' +
      '</div>';
    document.body.appendChild(root);
    hole = root.querySelector('#zm-spotlight-hole');
    bubble = root.querySelector('#zm-spotlight-bubble');
    root.querySelector('#zm-spotlight-close').addEventListener('click', e => {
      e.stopPropagation();
      hide();
    });
  }

  function layout() {
    if (!root || root.hidden || !currentTarget) return;
    const el = resolveTarget(currentTarget);
    if (!el) {
      hide();
      return;
    }
    const r = el.getBoundingClientRect();
    const pad = 8;
    const hx = Math.max(4, r.left - pad);
    const hy = Math.max(4, r.top - pad);
    const hw = Math.min(window.innerWidth - hx - 4, r.width + pad * 2);
    const hh = Math.min(window.innerHeight - hy - 4, r.height + pad * 2);

    hole.style.left = `${Math.round(hx)}px`;
    hole.style.top = `${Math.round(hy)}px`;
    hole.style.width = `${Math.round(hw)}px`;
    hole.style.height = `${Math.round(hh)}px`;

    // Đặt bóng thoại phía trên hoặc dưới vùng sáng tùy chỗ trống trên màn hình
    const bw = bubble.offsetWidth || 220;
    const bh = bubble.offsetHeight || 56;
    const gap = 14;
    const cx = hx + hw / 2;
    let bx = Math.round(cx - bw / 2);
    bx = Math.max(12, Math.min(window.innerWidth - bw - 12, bx));

    let by;
    let side = 'top';
    if (hy - bh - gap >= 12) {
      by = Math.round(hy - bh - gap);
      side = 'top';
    } else if (hy + hh + gap + bh <= window.innerHeight - 12) {
      by = Math.round(hy + hh + gap);
      side = 'bottom';
    } else {
      by = Math.max(12, Math.min(window.innerHeight - bh - 12, Math.round(hy - bh - gap)));
      side = 'top';
    }

    bubble.dataset.side = side;
    bubble.style.left = `${bx}px`;
    bubble.style.top = `${by}px`;
    const arrowX = Math.max(20, Math.min(bw - 20, Math.round(cx - bx)));
    bubble.style.setProperty('--spot-arrow-x', `${arrowX}px`);
  }

  function onDocPointer(e) {
    if (!root || root.hidden) return;
    // Bỏ qua sự kiện vừa kích hoạt mở spotlight trong cùng lượt bấm
    if (performance.now() - openTime < 40) return;
    // Cho phép thao tác đi xuyên qua target (hoặc vùng ngoài) rồi đóng gợi ý
    hide();
  }

  function onKeyDown(e) {
    if (!root || root.hidden) return;
    if (e.key === 'Escape') hide();
  }

  function show(opts) {
    const { target, icon, text, onClose } = opts || {};
    const el = resolveTarget(target);
    if (!el) return false;
    ensureDOM();
    currentTarget = el;
    currentOnClose = typeof onClose === 'function' ? onClose : null;
    openTime = performance.now();

    const iconEl = root.querySelector('#zm-spotlight-icon');
    const textEl = root.querySelector('#zm-spotlight-text');
    iconEl.innerHTML = icon || DEFAULT_ICON;
    textEl.textContent = text || '';

    root.hidden = false;
    layout();
    window.addEventListener('click', onDocPointer, true);
    window.addEventListener('keydown', onKeyDown, true);
    window.addEventListener('resize', layout, { passive: true });
    window.addEventListener('scroll', layout, true);
    return true;
  }

  function hide() {
    if (!root || root.hidden) return;
    root.hidden = true;
    currentTarget = null;
    window.removeEventListener('click', onDocPointer, true);
    window.removeEventListener('keydown', onKeyDown, true);
    window.removeEventListener('resize', layout);
    window.removeEventListener('scroll', layout, true);
    const cb = currentOnClose;
    currentOnClose = null;
    if (cb) cb();
  }

  function isOpen() {
    return !!(root && !root.hidden);
  }

  window.ZMSpotlight = { show, hide, isOpen };
})();
