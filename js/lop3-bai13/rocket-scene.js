// Sa bàn nhìn ngang: đường băng sân bay vũ trụ, phi thuyền tăng tốc 3 cấp, cất cánh hoặc phanh trước hàng rào.
// Hình vẽ do Antigravity làm trong js/lop3-bai13/art.js (window.Lop3Bai13Art); thiếu hàm nào dùng hình dự phòng hàm đó.
(function () {
  'use strict';
  const W = 900, H = 560, G = 430, X0 = 110, SCALE = 15.4, FENCE = 840;
  const ENV = ['moon', 'mars', 'asteroid'];
  const LEVEL = { low: 1, medium: 2, high: 3 };
  const fallback = {
    background(c, o) {
      const sky = c.createLinearGradient(0, 0, 0, G);
      sky.addColorStop(0, o.env === 'spaceport' ? '#4faaf0' : '#14182e');
      sky.addColorStop(1, o.env === 'mars' ? '#d98a6a' : '#def0fc');
      c.fillStyle = sky; c.fillRect(0, 0, W, G);
      c.fillStyle = o.env === 'spaceport' ? '#576574' : '#8a8f9c'; c.fillRect(0, G, W, H - G);
      c.fillStyle = '#fff';
      for (let x = 30; x < W; x += 90) c.fillRect(x, G + 40, 50, 6);
    },
    barrier(c, x, gy) { c.fillStyle = '#e53935'; c.fillRect(x - 12, gy - 80, 14, 80); c.fillRect(x - 12, gy - 80, 60, 10); },
    spaceship(c, x, gy, o) {
      c.save(); c.translate(x, gy - o.altitude); c.rotate(o.flying ? -0.3 : 0);
      c.fillStyle = '#f5f8fb'; c.strokeStyle = '#1e2a34'; c.lineWidth = 3;
      c.beginPath(); c.ellipse(0, -48, 100, 30, 0, 0, Math.PI * 2); c.fill(); c.stroke();
      c.fillStyle = '#3dc1dc'; c.fillRect(30, -62, 28, 18);
      c.fillStyle = '#1e283b'; for (const wx of [-50, 50]) { c.beginPath(); c.arc(wx, -14, 15, 0, 7); c.fill(); }
      c.restore();
    },
    thrustFlame(c, x, y, o) { c.fillStyle = '#ffb347'; c.beginPath(); c.arc(x, y, 8 + 6 * o.level, 0, 7); c.fill(); },
    takeoffEffect(c, x, y) { c.strokeStyle = '#ffd23f'; c.lineWidth = 4; c.beginPath(); c.arc(x, y, 40, 0, 7); c.stroke(); },
    brakeEffect(c, x, gy) { c.fillStyle = 'rgba(90,90,90,.5)'; c.beginPath(); c.arc(x, gy - 10, 26, 0, 7); c.fill(); },
    noteB(c, x, y) { c.fillStyle = '#ffe48f'; c.font = 'bold 34px sans-serif'; c.fillText('♫', x, y); }
  };
  const draw = (ctx, kind, ...args) => {
    const art = window.Lop3Bai13Art || {};
    (typeof art[kind] === 'function' ? art[kind] : fallback[kind])(ctx, ...args);
  };
  let airSince = null, lastStage = '';

  window.ZMSceneKit.create({
    W, H, idleHidden: sim => sim.running || sim.x > 0 || sim.stage !== 'idle',
    draw(ctx, now, sim, kit) {
      const env = sim.worldIndex >= 0 ? ENV[sim.worldIndex] : 'spaceport';
      if (sim.stage !== lastStage) { lastStage = sim.stage; airSince = sim.stage === 'airborne' ? now : null; }
      draw(ctx, 'background', { t: now, env, storm: 0 });
      draw(ctx, 'runwayLights', G, { t: now });
      draw(ctx, 'controlTower', 80, G, { t: now });
      const braked = sim.stage === 'braking';
      draw(ctx, 'barrier', FENCE, G, { hit: braked, t: now });
      const fly = airSince === null ? 0 : Math.min(8, (now - airSince));
      const climb = fly * fly * 14 + fly * 20;
      const shipX = X0 + Math.min(sim.x, 41) * SCALE + (sim.stage === 'airborne' ? fly * 140 : 0);
      const level = sim.motorOn ? LEVEL[sim.motorSpeed] || 3 : 0;
      if (braked) draw(ctx, 'brakeEffect', shipX - 30, G, { t: now });
      draw(ctx, 'spaceship', shipX, G, {
        t: now, speed: sim.stage === 'airborne' ? 3 : level, flying: sim.stage === 'airborne',
        altitude: climb, braking: braked, wheelAngle: -sim.rev * Math.PI * 2 * 0.4,
        upgrades: { canard: sim.has('wings'), booster: sim.has('boosters'), radar: sim.has('radar'), landingGear: sim.has('legs') }
      });
      if (sim.stage === 'airborne') draw(ctx, 'takeoffEffect', shipX + 30, G - 50 - climb, { t: now });
      if (sim.melodies && sim.running && sim.runT < 1.2) draw(ctx, 'noteB', shipX + 20, G - 140, { t: now });
      // Thanh vận tốc so với mốc cất cánh
      const need = sim.world.takeoff, ratio = Math.min(1, sim.v / need);
      ctx.fillStyle = 'rgba(30,42,52,.85)'; ctx.fillRect(17, 15, 270, 58);
      ctx.fillStyle = '#3a4a58'; ctx.fillRect(27, 45, 250, 12);
      ctx.fillStyle = ratio >= 1 ? '#6be08f' : '#ffd23f'; ctx.fillRect(27, 45, 250 * ratio, 12);
      kit.label(`VẬN TỐC ${sim.v.toFixed(1)} / ${need.toFixed(1)}`, 152, 36, '#fff', 15);
      kit.label(sim.world.name, 780, 40, '#fff', 17);
    },
    onEvent(type, data, kit) {
      if (type === 'sampleDone') {
        kit.toast('ok', 'Đúng 10 khối mẫu!', 'Đã chạy hết một vòng chương trình. Quan sát phi thuyền rồi chỉnh số giây.');
      } else if (type === 'takeoff') {
        kit.burst(X0 + data.x * SCALE, G - 80, 22);
        kit.toast('ok', 'Cất cánh thành công!', `Đủ tốc ${data.speed.toFixed(1)} cm/giây ở ${data.world}.`);
      } else if (type === 'brake') {
        kit.shake(.5);
        kit.toast('warn', 'Phanh gấp trước hàng rào', data.message);
      } else if (type === 'world') {
        if (data.name !== 'Đường băng chuẩn') kit.toast('ok', `Lượt ${data.round}: ${data.name}`, 'Trọng lực mới, hãy xem phi thuyền cần bao nhiêu giây.');
      }
    }
  });
})();
