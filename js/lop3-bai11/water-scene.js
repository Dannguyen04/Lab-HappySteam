// Sa bàn Lớp 3 · Bài 11: robot tìm ba mỏm băng trên sao Hỏa.
// Đọc WaterArt mỗi khung hình vì art.js có thể được nạp sau scene; thiếu hàm nào thì vẽ dự phòng hàm đó.
(function () {
  'use strict';

  const W = 900, H = 560, GROUND = 430, START = 130, END = 812;
  const hinted = new Set();
  const getArt = () => window.WaterArt || window.MarsWaterArt || window.Bai11Art || {};

  const fallback = {
    drawBackground(c, now) {
      c.fillStyle = '#311c2b'; c.fillRect(0, 0, W, H);
      c.fillStyle = '#c06d48'; c.fillRect(0, 280, W, H - 280);
      c.fillStyle = '#93442d';
      for (let i = 0; i < 7; i++) {
        const x = i * 159 - 30;
        c.beginPath(); c.moveTo(x - 95, 300); c.lineTo(x + 30, 175 + i % 3 * 18);
        c.lineTo(x + 140, 300); c.fill();
      }
      c.fillStyle = '#f2ad7f'; c.beginPath(); c.arc(740, 96, 34, 0, Math.PI * 2); c.fill();
      c.fillStyle = 'rgba(255,255,255,.5)';
      for (let i = 0; i < 27; i++) c.fillRect((i * 199) % W, (i * 97 + now * 0.3) % 240, 2, 2);
    },
    drawBase(c, x, y) {
      c.save(); c.translate(x, y);
      c.fillStyle = '#eee8da'; c.beginPath(); c.arc(0, 0, 41, Math.PI, Math.PI * 2); c.fill();
      c.fillStyle = '#18556e'; c.fillRect(-45, -7, 90, 9);
      c.fillStyle = '#d7fafb'; c.fillRect(-20, -27, 40, 14); c.restore();
    },
    drawCliff(c, x, y) {
      c.fillStyle = '#622c25'; c.beginPath(); c.moveTo(x, y); c.lineTo(x - 6, y - 180);
      c.lineTo(x + 36, y - 230); c.lineTo(W, y - 240); c.lineTo(W, y); c.fill();
    },
    drawIcePatch(c, x, y, site) {
      c.save(); c.translate(x, y);
      c.fillStyle = '#64382e'; c.beginPath(); c.ellipse(0, 0, 35, 12, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = site.done ? '#81c78a' : '#bdf5ff';
      c.beginPath(); c.moveTo(-23, 0); c.lineTo(-15, -26); c.lineTo(0, -7);
      c.lineTo(12, -33); c.lineTo(24, 0); c.closePath(); c.fill(); c.restore();
    },
    drawRover(c, x, y, o) {
      c.save(); c.translate(x, y);
      c.fillStyle = '#f3f2e9'; c.fillRect(-47, -35, 94, 23);
      c.fillStyle = '#3dc1dc'; c.fillRect(-30, -52, 45, 18);
      c.strokeStyle = '#1b2b36'; c.lineWidth = 4;
      c.beginPath(); c.moveTo(18, -36); c.lineTo(43, -80); c.stroke();
      c.fillStyle = '#baf5ff'; c.beginPath(); c.arc(43, -80, 10, 0, Math.PI * 2); c.fill();
      for (const wx of [-33, 33]) {
        c.fillStyle = '#253b51'; c.beginPath(); c.arc(wx, -9, 19, 0, Math.PI * 2); c.fill();
        c.strokeStyle = '#c8f5ff'; c.save(); c.translate(wx, -9); c.rotate(o.wheel || 0);
        c.beginPath(); c.moveTo(-11, 0); c.lineTo(11, 0); c.moveTo(0, -11); c.lineTo(0, 11); c.stroke(); c.restore();
      }
      if (o.tank) { c.fillStyle = '#92edf4'; c.fillRect(-26, -68, 23, 16); }
      if (o.solar) { c.fillStyle = '#123e80'; c.fillRect(-39, -78, 42, 7); }
      if (o.pump) { c.strokeStyle = '#fff'; c.beginPath(); c.moveTo(42, -34); c.lineTo(57, -13); c.stroke(); }
      c.restore();
    },
    drawWaterMeter(c, x, y, got, max, liters) {
      c.fillStyle = 'rgba(13,35,48,.91)'; c.fillRect(x, y, 180, 54);
      c.fillStyle = '#c4f9ff'; c.font = '700 18px sans-serif'; c.fillText(`Nước: ${got}/${max} · ${liters} lít`, x + 10, y + 33);
    }
  };

  function draw(ctx, name, ...args) {
    const art = getArt();
    const fn = typeof art[name] === 'function' ? art[name] : fallback[name];
    fn(ctx, ...args);
  }
  function scaleOf(sim) {
    return (END - START) / (sim.course().end || 240);
  }
  function at(sim, cm) {
    return START + cm * scaleOf(sim);
  }
  window.ZMSceneKit.create({
    W,
    H,
    idleHidden: sim => sim.running || sim.got() > 0,
    draw(ctx, now, sim, kit) {
    draw(ctx, 'drawBackground', now);
    // Thước đường đi cố định theo chế độ, mỏm băng lấy từ chính trạng thái bộ mô phỏng.
    ctx.fillStyle = 'rgba(70,30,19,.42)'; ctx.fillRect(0, GROUND - 2, W, 64);
    ctx.strokeStyle = '#f3c29e'; ctx.lineWidth = 3; ctx.setLineDash([12, 12]);
    ctx.beginPath(); ctx.moveTo(START, GROUND + 21); ctx.lineTo(END, GROUND + 21); ctx.stroke();
    ctx.setLineDash([]);
    draw(ctx, 'drawBase', 68, GROUND);
    draw(ctx, 'drawCliff', at(sim, sim.course().end) + 10, GROUND);
    for (let i = 0; i < sim.sites.length; i++) {
      const site = sim.sites[i];
      const x = at(sim, site.a);
      draw(ctx, 'drawIcePatch', x, GROUND, { ...site, t: now });
      kit.label(`Mỏm ${i + 1}${site.done ? ' ✓' : ''}`, x, GROUND + 64, site.done ? '#adffae' : '#fff', 14);
      if (site.pump > 0 && !site.done) {
        const pct = Math.min(1, site.pump / sim.pumpTime());
        ctx.fillStyle = '#173747'; ctx.fillRect(x - 30, GROUND - 75, 60, 9);
        ctx.fillStyle = '#53e4fa'; ctx.fillRect(x - 30, GROUND - 75, 60 * pct, 9);
      }
    }
    const roverX = at(sim, sim.x);
    if (sim.motorOn && sim.seen()) {
      ctx.strokeStyle = 'rgba(95,245,244,.45)'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(roverX + 42, GROUND - 80, 43 + 8 * Math.sin(now * 9), 0, Math.PI * 2); ctx.stroke();
    }
    draw(ctx, 'drawRover', roverX, GROUND, {
      wheel: -sim.rev * Math.PI * 2, shake: sim.motorOn ? 0.1 : 0,
      scan: sim.motorOn, pumping: sim.sites.some(s => s.pump > 0 && !s.done),
      tank: sim.has('tank'), pump: sim.has('pump'), solar: sim.has('solar'), t: now
    });
    draw(ctx, 'drawWaterMeter', 18, 19, sim.got(), sim.sites.length, sim.liters());
    kit.label(`${sim.x.toFixed(0)} cm`, Math.max(60, Math.min(W - 60, roverX)), GROUND - 112, '#fff', 13);
    if (sim.advanced) kit.label(`NÂNG CAO · ${sim.runT.toFixed(1)}/${sim.limit()} giây`, 695, 48, sim.runT > sim.limit() ? '#ffaba1' : '#fff', 16);
    },

    onEvent(type, data, kit) {
      const sim = window.simEngine;
      if (type === 'start') {
        hinted.clear();
      } else if (type === 'found') {
        if (window.SFX?.tone) window.SFX.tone(790, 0.08);
      } else if (type === 'pumped' && sim) {
        kit.burst(at(sim, data.site.a), GROUND - 30);
        if (window.SFX?.ding) window.SFX.ding();
        kit.toast('ok', `Đã bơm ${data.count}/3 mẫu!`, `Robot đã lấy ${sim.liters()} lít nước. Tiếp tục đi tới mỏm băng kế tiếp.`);
      } else if (type === 'allSampled') {
        kit.toast('ok', 'Đã tìm đủ 3 nguồn nước!', `${data.liters} lít trong ${data.secs.toFixed(1)} giây.${data.inTime ? ' Hoàn thành thử thách Nâng cao!' : ''}`);
      } else if (type === 'late') {
        kit.toast('warn', 'Hết 17 giây!', 'Hãy chọn tốc độ nhanh hơn hoặc thử máy bơm mạnh rồi chạy lại.');
      } else if (type === 'miss' && !hinted.has(data)) {
        hinted.add(data);
        kit.toast('warn', 'Chưa lấy được nước', data === 'short' ? 'Đợi robot dừng bơm đủ 3 giây (1,5 giây nếu nâng cấp).' : 'Hãy dùng Chờ vật cản rồi Stop trước khi robot đi qua mỏm băng.');
      } else if (type === 'wall') {
        kit.toast('warn', 'Đã đến vách núi', 'Robot đã đi hết đường. Hãy thử điều chỉnh chương trình.', { label: 'Thử lại', run: () => sim?.start() });
      } else if (type === 'sampleDone') {
        kit.toast('ok', 'Đúng chương trình mẫu!', 'Động cơ chạy, cảm biến phát hiện mỏm băng, robot dừng bơm đủ thời gian và lặp lại.');
      }
    }
  });
})();
