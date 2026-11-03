// Hình vẽ Bài 5 lớp 3 (Xe đổ rác): xe thu gom rác nhìn ngang và biểu tượng bốn gói sáng tạo.
// Vẽ dự phòng bằng canvas/SVG phẳng; có thể thay bằng bản vẽ đẹp hơn mà giữ nguyên tên hàm.
(function () {
  'use strict';

  const INK = '#1e2a34';
  function wheel(c, x, y, r, rot) {
    c.fillStyle = INK;
    c.beginPath();
    c.arc(x, y, r, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#cfd8dc';
    c.beginPath();
    c.arc(x, y, r * 0.55, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = INK;
    c.lineWidth = 3;
    for (let i = 0; i < 3; i++) {
      const a = rot + (i * Math.PI) / 3;
      c.beginPath();
      c.moveTo(x - Math.cos(a) * r * 0.5, y - Math.sin(a) * r * 0.5);
      c.lineTo(x + Math.cos(a) * r * 0.5, y + Math.sin(a) * r * 0.5);
      c.stroke();
    }
  }
  // Xe nhìn ngang, đầu xe quay sang phải; (x, y) = điểm giữa đáy xe chạm mặt đường
  // o: { wheel, ben, plow, lid, divider, crashed }
  function drawTruck(c, x, y, o) {
    o = o || {};
    c.save();
    c.translate(x, y);
    if (o.crashed) c.rotate(-0.04);
    c.lineWidth = 3;
    c.strokeStyle = INK;
    c.lineJoin = 'round';
    // thùng chứa rác (có thể lật ben)
    c.save();
    if (o.ben) {
      c.translate(-62, -30);
      c.rotate(-0.38);
      c.translate(62, 30);
    }
    c.fillStyle = '#3dc1dc';
    c.fillRect(-72, -88, 92, 58);
    c.strokeRect(-72, -88, 92, 58);
    c.fillStyle = '#8ee6f5';
    c.fillRect(-66, -80, 80, 8);
    if (o.divider) {
      c.fillStyle = '#fff';
      c.fillRect(-27, -88, 6, 58);
      c.strokeRect(-27, -88, 6, 58);
    }
    if (o.lid) {
      c.fillStyle = '#ffd23f';
      c.fillRect(-76, -96, 100, 9);
      c.strokeRect(-76, -96, 100, 9);
    }
    c.restore();
    // khung gầm + cabin
    c.fillStyle = '#ffffff';
    c.fillRect(-76, -30, 150, 16);
    c.strokeRect(-76, -30, 150, 16);
    c.fillStyle = '#ff8a3d';
    c.beginPath();
    c.moveTo(24, -30);
    c.lineTo(24, -76);
    c.lineTo(52, -76);
    c.lineTo(72, -44);
    c.lineTo(72, -30);
    c.closePath();
    c.fill();
    c.stroke();
    c.fillStyle = '#dff6ff';
    c.beginPath();
    c.moveTo(32, -68);
    c.lineTo(48, -68);
    c.lineTo(62, -46);
    c.lineTo(32, -46);
    c.closePath();
    c.fill();
    c.stroke();
    if (o.plow) {
      c.fillStyle = '#ffd23f';
      c.beginPath();
      c.moveTo(74, -32);
      c.lineTo(94, -4);
      c.lineTo(76, -4);
      c.lineTo(70, -14);
      c.closePath();
      c.fill();
      c.stroke();
    }
    wheel(c, -48, -6, 17, o.wheel || 0);
    wheel(c, 44, -6, 17, o.wheel || 0);
    c.restore();
  }
  function icon(extra) {
    return (
      '<svg viewBox="0 0 64 48" aria-hidden="true"><rect x="4" y="14" width="34" height="18" rx="2" fill="#3dc1dc" stroke="#1e2a34" stroke-width="1.6"/>' +
      '<path d="M38 32V18h10l8 8v6z" fill="#ff8a3d" stroke="#1e2a34" stroke-width="1.6" stroke-linejoin="round"/>' +
      '<circle cx="16" cy="36" r="6" fill="#1e2a34"/><circle cx="46" cy="36" r="6" fill="#1e2a34"/>' +
      extra +
      '</svg>'
    );
  }
  const PICS = {
    ben: icon('<path d="M4 14L2 4l34 4" fill="none" stroke="#ffd23f" stroke-width="3" stroke-linecap="round"/>'),
    plow: icon('<path d="M56 24l6 14h-8l-3-6z" fill="#ffd23f" stroke="#1e2a34" stroke-width="1.4"/>'),
    lid: icon('<rect x="2" y="9" width="40" height="5" rx="1.5" fill="#ffd23f" stroke="#1e2a34" stroke-width="1.4"/>'),
    divider: icon('<rect x="19" y="10" width="3" height="22" fill="#fff" stroke="#1e2a34" stroke-width="1.2"/>')
  };
  window.TruckArt = { PICS, drawTruck };
})();
