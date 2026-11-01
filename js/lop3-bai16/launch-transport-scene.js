// Cảnh câu chuyện Bài 16 lớp 3 (chặng ③): sân bay vũ trụ nhìn ngang, xe chở tên lửa từ nhà xưởng ra bệ phóng.
// Phần khung (vòng vẽ, thông báo, chùm sao, nút đỏ) ở js/scene-kit.js. Hình vẽ đẹp ở js/lop3-bai16/art.js (window.Lop3Bai16Art);
// thiếu hàm nào thì dùng hình dự phòng đơn giản của hàm đó.
(function () {
  'use strict';

  const W = 900, H = 560, G = 430;
  const START_PX = 330, PX_PER_CM = 140 / 39.27; // bệ Gần/Vừa/Xa nằm ở 470/610/750 px
  const MARKS = { near: 470, mid: 610, far: 750 };
  const px = cm => START_PX + cm * PX_PER_CM;

  const fallback = {
    background(c) {
      const sky = c.createLinearGradient(0, 0, 0, G);
      sky.addColorStop(0, '#1b3b6f'); sky.addColorStop(1, '#def0fc');
      c.fillStyle = sky; c.fillRect(0, 0, W, G);
      c.fillStyle = '#6db843'; c.fillRect(0, G, W, H - G);
    },
    hangar(c, x, gy) {
      c.fillStyle = '#cbd5e1'; c.fillRect(0, gy - 200, 160, 200);
      c.fillStyle = '#334155'; c.fillRect(25, gy - 150, 110, 150);
    },
    distanceTrack(c, a, b, gy) {
      c.fillStyle = '#576574'; c.fillRect(a, gy, b - a, 22);
      c.fillStyle = '#fff';
      for (const k of Object.keys(MARKS)) c.fillRect(MARKS[k] - 2, gy - 6, 4, 34);
    },
    launchPad(c, x, gy, o) {
      c.fillStyle = o.ready ? '#43a047' : '#334155'; c.fillRect(x - 54, gy - 16, 108, 22);
      c.fillStyle = '#e2e8f0'; c.fillRect(x + 36, gy - 290, 30, 290);
    },
    skidMark(c, x, gy) { c.fillStyle = 'rgba(15,23,42,.6)'; c.fillRect(x - 40, gy + 4, 70, 5); },
    robot(c, x, gy, o) {
      c.save(); c.translate(x, gy);
      c.fillStyle = '#3dc1dc'; c.fillRect(-70, -50, 140, 30);
      c.fillStyle = '#263238'; c.fillRect(30, -48, 28, 26);
      c.fillStyle = o.led === 'sad' ? '#e53935' : '#38ef7d'; c.fillRect(38, -40, 12, 10);
      c.fillStyle = '#1e283b';
      for (const wx of [-45, 45]) { c.beginPath(); c.arc(wx, -14, 18, 0, Math.PI * 2); c.fill(); }
      if (o.hasRocket) { c.fillStyle = '#f5f5f5'; c.fillRect(-60, -110, 70, 18); }
      c.restore();
    },
    rocket(c, x, y) { c.fillStyle = '#f5f5f5'; c.fillRect(x - 14, y - 70, 28, 135); c.fillStyle = '#ff8a3d'; c.fillRect(x - 14, y - 70, 28, 22); },
    launchEffect(c, x, gy) { c.fillStyle = 'rgba(236,239,241,.8)'; c.beginPath(); c.arc(x, gy - 10, 50, 0, Math.PI * 2); c.fill(); },
    noteA(c, x, y) { c.fillStyle = '#ffd23f'; c.font = 'bold 30px sans-serif'; c.fillText('♫', x, y); },
    noteB(c, x, y) { c.fillStyle = '#8ee6f5'; c.font = 'bold 30px sans-serif'; c.fillText('♪', x, y); }
  };
  const draw = (ctx, kind, ...args) => {
    const art = window.Lop3Bai16Art || {};
    (typeof art[kind] === 'function' ? art[kind] : fallback[kind])(ctx, ...args);
  };

  window.ZMSceneKit.create({
    W,
    H,
    draw(ctx, now, sim, kit) {
      const carX = px(sim.x);
      const padX = MARKS[sim.padKey];
      const prog = sim.launchProgress();
      const upgrades = {
        solarPanel: sim.has('solarPanel'), antenna: sim.has('antenna'),
        dualHeadlights: sim.has('dualHeadlights'), frontShield: sim.has('frontShield')
      };
      draw(ctx, 'background', { W, H, gy: G, t: now });
      draw(ctx, 'distanceTrack', 140, W - 40, G, { activeZone: sim.padKey, targetDistance: sim.padKey, t: now });
      draw(ctx, 'hangar', 0, G, { doorOpen: 1, lightOn: true, t: now });
      draw(ctx, 'launchPad', padX, G, { ready: sim.launched, targetGlow: Math.abs(sim.x - sim.padCm) <= 5 && !sim.motorOn, t: now });
      if (sim.skid) draw(ctx, 'skidMark', carX, G, { length: 55, opacity: 0.65 });
      draw(ctx, 'robot', carX, G, {
        wheelAngle: sim.rev * Math.PI * 2, tilt: sim.launched ? 1 : 0,
        led: sim.led === 'sad' ? 'sad' : sim.led === 'smile' ? 'happy' : 'idle',
        hasRocket: !sim.launched, launched: sim.launched, upgrades, t: now
      });
      if (sim.launched) {
        draw(ctx, 'rocket', padX, G - 100 - prog * 380, { angle: 0, flame: Math.max(0.4, 1 - prog * 0.3), t: now });
        draw(ctx, 'launchEffect', padX, G, { progress: prog, t: now });
      }
      if (sim.t < sim.melodyUntil) draw(ctx, sim.melodyTune === 'B' ? 'noteB' : 'noteA', carX + 20, G - 150, { t: now });
      const names = { near: 'Gần', mid: 'Vừa', far: 'Xa' };
      kit.label(`Bệ phóng: ${names[sim.padKey]}`, padX, G + 60, '#ffffff', 16);
      kit.label(`Xe: ${sim.x.toFixed(1)} cm`, Math.max(60, Math.min(W - 60, carX)), G + 36, '#ffffff', 14);
    },
    onEvent(type, data, kit) {
      if (type === 'sampleDone') {
        kit.toast('ok', 'Đúng 10 khối mẫu!', 'Đã chạy hết một vòng. Giờ hãy chỉnh thời gian chờ để xe dừng đúng ô bệ phóng.');
      } else if (type === 'launch') {
        kit.burst(MARKS[data.pad], 330, 22);
        kit.toast('ok', 'Tên lửa cất cánh!', 'Xe dừng đúng ô bệ phóng. Em có thể đổi khối mặt buồn thành mặt cười.');
      } else if (type === 'miss') {
        kit.shake(0.4);
        kit.toast('warn', 'Xe chưa dừng đúng ô', data.message);
      }
    }
  });
})();
