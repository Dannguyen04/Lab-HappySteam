// Phòng lập trình – vẽ sa bàn 2D nhìn từ trên xuống (chỉ đọc trạng thái Sim; dùng chung cho trình vẽ sa bàn).
(function () {
  'use strict';
  const { ROBOT } = window.CodeLab;
  const ZONE = { green: '#3fae6a', red: '#e0534f', blue: '#3d8fe0', yellow: '#f2c230' };
  const COLOR_NAME = { green: 'xanh lá', red: 'đỏ', blue: 'xanh dương', yellow: 'vàng', white: 'trắng' };

  // Hệ quy đổi cm → điểm ảnh, giữ tỉ lệ, chừa lề
  function fit(canvas, map) {
    const pad = 14;
    const s = Math.min((canvas.width - pad * 2) / map.size[0], (canvas.height - pad * 2) / map.size[1]);
    const ox = (canvas.width - map.size[0] * s) / 2, oy = (canvas.height - map.size[1] * s) / 2;
    return { s, ox, oy, X: x => ox + x * s, Y: y => oy + y * s, toCm: (px, py) => [(px - ox) / s, (py - oy) / s] };
  }

  function drawMap(ctx, map, T, opts = {}) {
    const { s, X, Y } = T;
    ctx.fillStyle = '#dfe6ec';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    // mặt sân + lưới 10 cm
    ctx.fillStyle = '#f7f5ef';
    ctx.fillRect(X(0), Y(0), map.size[0] * s, map.size[1] * s);
    ctx.strokeStyle = 'rgba(21,33,43,.07)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 10; x < map.size[0]; x += 10) { ctx.moveTo(X(x), Y(0)); ctx.lineTo(X(x), Y(map.size[1])); }
    for (let y = 10; y < map.size[1]; y += 10) { ctx.moveTo(X(0), Y(y)); ctx.lineTo(X(map.size[0]), Y(y)); }
    ctx.stroke();
    for (const it of map.items) {
      if (it.k === 'zone') {
        ctx.fillStyle = ZONE[it.color] || ZONE.green;
        ctx.globalAlpha = it.goal ? 0.3 : 0.45;
        ctx.fillRect(X(it.x), Y(it.y), it.w * s, it.h * s);
        ctx.globalAlpha = 1;
        if (it.goal) {
          ctx.setLineDash([6, 5]);
          ctx.strokeStyle = ZONE[it.color] || ZONE.green;
          ctx.lineWidth = 2.5;
          ctx.strokeRect(X(it.x) + 1, Y(it.y) + 1, it.w * s - 2, it.h * s - 2);
          ctx.setLineDash([]);
          drawFlagIcon(ctx, X(it.x + it.w / 2), Y(it.y + it.h / 2), s * 1.1, '#1c8a4c');
        }
      }
    }
    for (const it of map.items) {
      if (it.k !== 'line' || it.pts.length < 2) continue;
      ctx.strokeStyle = '#1b1f24';
      ctx.lineWidth = it.w * s;
      ctx.lineCap = ctx.lineJoin = 'round';
      ctx.beginPath();
      it.pts.forEach((p, i) => (i ? ctx.lineTo(X(p[0]), Y(p[1])) : ctx.moveTo(X(p[0]), Y(p[1]))));
      ctx.stroke();
    }
    if (map.blackHole) {
      const hole = map.blackHole;
      ctx.save();
      for (const [i, d] of hole.diameters.entries()) {
        ctx.beginPath();
        ctx.arc(X(hole.x), Y(hole.y), d * s / 2, 0, Math.PI * 2);
        ctx.fillStyle = ['rgba(25,31,44,.16)', 'rgba(19,25,39,.26)', 'rgba(10,15,26,.45)'][i];
        ctx.fill();
        ctx.strokeStyle = '#3d4052';
        ctx.lineWidth = Math.max(1, s);
        ctx.stroke();
      }
      ctx.restore();
    }
    for (const it of map.items) {
      if (it.k === 'dock') {
        ctx.fillStyle = it.role === 'start' ? 'rgba(58,169,104,.26)' : 'rgba(45,130,214,.26)';
        ctx.fillRect(X(it.x), Y(it.y), it.w * s, it.h * s);
        ctx.lineWidth = 2;
        ctx.strokeStyle = it.role === 'start' ? '#18844c' : '#1669ab';
        ctx.strokeRect(X(it.x), Y(it.y), it.w * s, it.h * s);
        ctx.fillStyle = '#172d40';
        ctx.font = `bold ${Math.max(12, 13 * s)}px sans-serif`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(it.label, X(it.x + it.w / 2), Y(it.y + it.h / 2));
      } else if (it.k === 'ramp') {
        const segments = it.axis === 'y' ? [it.h, it.w] : [it.w, it.h];
        ctx.save();
        ctx.translate(X(it.x + it.w / 2), Y(it.y + it.h / 2));
        if (it.axis === 'y') ctx.rotate(Math.PI / 2);
        const [length, width] = segments;
        [-1, 0, 1].forEach((section, i) => {
          ctx.fillStyle = ['#bc9965', '#8f8e98', '#bc9965'][i];
          ctx.fillRect((-length / 2 + [0, 5, 20][i]) * s, -width * s / 2, [5, 15, 5][i] * s, width * s);
        });
        ctx.restore();
      } else if (it.k === 'marker') {
        const nx = -Math.sin(it.dir || 0), ny = Math.cos(it.dir || 0), half = (it.len || 18) / 2;
        ctx.beginPath();
        ctx.moveTo(X(it.x - nx * half), Y(it.y - ny * half));
        ctx.lineTo(X(it.x + nx * half), Y(it.y + ny * half));
        ctx.lineWidth = Math.max(2, s);
        ctx.strokeStyle = '#b91c1c'; ctx.stroke();
        const fx = X(it.x + nx * half), fy = Y(it.y + ny * half);
        ctx.fillStyle = '#b91c1c';
        ctx.fillRect(fx - 6, fy - 16, 14, 12);
        ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.font = 'bold 10px sans-serif'; ctx.fillText(it.label, fx + 1, fy - 10);
      } else if (it.k === 'button') {
        const done = opts.scored && opts.scored.has('button:' + map.items.filter(i => i.k === 'button').indexOf(it));
        ctx.beginPath(); ctx.arc(X(it.x), Y(it.y), Math.max(4, (it.radius || 3) * s), 0, Math.PI * 2);
        ctx.fillStyle = done ? '#16a34a' : '#dc2626'; ctx.fill();
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
        ctx.fillStyle = '#202733'; ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center'; ctx.fillText(it.label || 'A1', X(it.x), Y(it.y) - 10);
      }
    }
    for (const it of map.items) {
      if (it.k !== 'wall') continue;
      ctx.fillStyle = '#5b6b78';
      ctx.fillRect(X(it.x), Y(it.y), it.w * s, it.h * s);
      ctx.fillStyle = 'rgba(255,255,255,.12)';
      ctx.fillRect(X(it.x), Y(it.y), it.w * s, Math.min(3, it.h * s));
    }
    const flags = map.items.filter(i => i.k === 'flag');
    flags.forEach((f, i) => drawFlagIcon(ctx, X(f.x), Y(f.y), s * 1.3, opts.flags && opts.flags[i] ? '#9aa7b2' : '#e8892b', opts.flags && opts.flags[i]));
    if (opts.showStart !== false) {
      const st = map.start;
      ctx.save();
      ctx.translate(X(st.x), Y(st.y));
      ctx.rotate(st.dir || 0);
      ctx.strokeStyle = 'rgba(0,128,184,.55)';
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 2;
      ctx.strokeRect(-ROBOT.length / 2 * s, -ROBOT.width / 2 * s, ROBOT.length * s, ROBOT.width * s);
      ctx.setLineDash([]);
      ctx.restore();
    }
  }
  function drawFlagIcon(ctx, x, y, u, color, done) {
    ctx.save();
    ctx.translate(x, y);
    ctx.strokeStyle = '#15212b';
    ctx.lineWidth = Math.max(1.5, u * 0.6);
    ctx.beginPath();
    ctx.moveTo(-u * 2, u * 4);
    ctx.lineTo(-u * 2, -u * 4);
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(-u * 2, -u * 4);
    ctx.lineTo(u * 3.5, -u * 2.2);
    ctx.lineTo(-u * 2, -u * 0.4);
    ctx.closePath();
    ctx.fill();
    if (done) {
      ctx.strokeStyle = '#1c8a4c';
      ctx.lineWidth = Math.max(2, u * 0.7);
      ctx.beginPath();
      ctx.moveTo(-u * 1.5, u * 1.5);
      ctx.lineTo(0, u * 3);
      ctx.lineTo(u * 3, -u * 0.5);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawSim(ctx, sim, T) {
    drawMap(ctx, sim.map, T, { flags: sim.flags, scored: sim.scored });
    const { s, X, Y } = T;
    const r = sim.robot, v = sim.sensors();
    // vệt đường đi
    if (sim.trail.length > 1) {
      ctx.strokeStyle = 'rgba(0,128,184,.35)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      sim.trail.forEach((p, i) => (i ? ctx.lineTo(X(p[0]), Y(p[1])) : ctx.moveTo(X(p[0]), Y(p[1]))));
      ctx.lineTo(X(r.x), Y(r.y));
      ctx.stroke();
    }
    // tia sóng âm
    const c = Math.cos(r.th), sn = Math.sin(r.th);
    const fx = r.x + c * ROBOT.length / 2, fy = r.y + sn * ROBOT.length / 2;
    const d = v.dist === null ? ROBOT.sonarMax : v.dist;
    ctx.strokeStyle = v.dist !== null && v.dist < 25 ? 'rgba(201,46,53,.8)' : 'rgba(234,110,169,.55)';
    ctx.setLineDash([5, 5]);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(X(fx), Y(fy));
    ctx.lineTo(X(fx + c * d), Y(fy + sn * d));
    ctx.stroke();
    ctx.setLineDash([]);
    // xe
    ctx.save();
    ctx.translate(X(r.x), Y(r.y));
    ctx.rotate(r.th);
    const L = ROBOT.length * s, W = ROBOT.width * s;
    ctx.fillStyle = '#20262c'; // bánh
    ctx.fillRect(-L * 0.28, -W / 2 - s * 1.6, L * 0.5, s * 2.4);
    ctx.fillRect(-L * 0.28, W / 2 - s * 0.8, L * 0.5, s * 2.4);
    ctx.fillStyle = sim.touching ? '#c92e35' : '#2a9bd8';
    roundRect(ctx, -L / 2, -W / 2, L, W, s * 2.5);
    ctx.fill();
    ctx.strokeStyle = '#15212b';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#ffeb2e'; // bộ điều khiển
    roundRect(ctx, -L * 0.32, -W * 0.3, L * 0.42, W * 0.6, s * 1.2);
    ctx.fill();
    ctx.fillStyle = '#fff'; // mắt sóng âm
    ctx.beginPath();
    ctx.arc(L / 2 - s * 1.3, -s * 2.2, s * 1.2, 0, 7);
    ctx.arc(L / 2 - s * 1.3, s * 2.2, s * 1.2, 0, 7);
    ctx.fill();
    // hai mắt dò vạch
    for (const [side, on] of [[-1, v.lineL], [1, v.lineR]]) {
      ctx.fillStyle = on ? '#ff3b30' : '#8796a3';
      ctx.beginPath();
      ctx.arc(s * 6 - 0, side * s * 2.5, s * 0.9, 0, 7);
      ctx.fill();
    }
    if (r.led) {
      ctx.fillStyle = ZONE[r.led] || r.led;
      ctx.beginPath();
      ctx.arc(-L * 0.11, 0, s * 1.4, 0, 7);
      ctx.fill();
    }
    ctx.restore();
  }
  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  window.CodeLabView = { fit, drawMap, drawSim, ZONE, COLOR_NAME };
})();
