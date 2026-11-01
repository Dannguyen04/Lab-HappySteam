// Cảnh câu chuyện Bài 11 (chặng ③): dòng sông bên trái, cối xoay nước (gầu múc nước) ở giữa, bể chứa và ngôi làng bên phải.
// Màn hình M5 trên mô hình hiện trái tim / mặt cười theo chương trình. Chế độ Nâng cao: mặt trời làm nước bay hơi thành mây rồi mưa.
// Hình vẽ từ js/bai11/art.js (window.WaterArt) nếu có và có hàm tương ứng; thiếu hàm nào thì vẽ hình đơn giản.
// Cùng giao diện window.ZMScene với các bài khác: enter, leave, onEvent, setMode.
(function () {
  'use strict';

  const W = 900,
    H = 560;
  const WHEEL = [300, 330], // tâm bánh gầu
    TANK = [560, 250, 120, 150], // x, y, rộng, cao của bể chứa
    HOUSE_X = 760,
    G = 430;
  const $ = id => document.getElementById(id);
  // WaterArt nhận context qua hàm vẽ; hiệu ứng và vòng vẽ do SceneKit quản lý.
  let ctx;
  const fx = { rain: 0, wrongUntil: 0 };
  // Gọi hàm vẽ của art.js nếu có; lỗi hoặc thiếu thì dùng hình đơn giản
  function viaArt(name, fallback, ...args) {
    const A = window.WaterArt;
    if (A && typeof A[name] === 'function') {
      try {
        A[name](ctx, ...args);
        return;
      } catch (e) {
        /* art.js lỗi: vẽ dự phòng */
      }
    }
    fallback(...args);
  }

  // ---------- hình đơn giản khi chưa có js/bai11/art.js ----------
  const Simple = {
    background(now) {
      const g = ctx.createLinearGradient(0, 0, 0, G);
      g.addColorStop(0, '#bfe7f7');
      g.addColorStop(1, '#eaf8ff');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#8cc152';
      ctx.fillRect(0, G, W, H - G);
      // sông
      ctx.fillStyle = '#3dc1dc';
      ctx.fillRect(0, G - 10, 330, 50);
      ctx.strokeStyle = 'rgba(255,255,255,.7)';
      ctx.lineWidth = 3;
      for (let i = 0; i < 5; i++) {
        const x = ((i * 90 + now * 40) % 330) + 0;
        ctx.beginPath();
        ctx.moveTo(x, G + 5 + (i % 2) * 14);
        ctx.quadraticCurveTo(x + 12, G - 2 + (i % 2) * 14, x + 24, G + 5 + (i % 2) * 14);
        ctx.stroke();
      }
    },
    wheel(x, y, o) {
      ctx.save();
      ctx.translate(x, y);
      // giá đỡ
      ctx.strokeStyle = '#1e2a34';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(-50, 100);
      ctx.lineTo(0, 0);
      ctx.lineTo(50, 100);
      ctx.stroke();
      ctx.rotate(o.rev * Math.PI * 2);
      ctx.lineWidth = 5;
      for (let i = 0; i < 6; i++) {
        ctx.rotate(Math.PI / 3);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -86);
        ctx.stroke();
        ctx.fillStyle = o.scoop ? '#ffd23f' : '#3dc1dc';
        const s = o.scoop ? 1.4 : 1;
        ctx.fillRect(-12 * s, -100 * (o.scoop ? 1.05 : 1), 24 * s, 20);
        ctx.strokeRect(-12 * s, -100 * (o.scoop ? 1.05 : 1), 24 * s, 20);
      }
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(0, 0, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    },
    tank(x, y, w, h, level, o) {
      ctx.fillStyle = '#3dc1dc';
      const wh = h * level;
      ctx.fillRect(x, y + h - wh, w, wh);
      ctx.strokeStyle = '#1e2a34';
      ctx.lineWidth = 5;
      ctx.strokeRect(x, y, w, h);
      if (o.cover) {
        ctx.fillStyle = '#3dc1dc';
        ctx.fillRect(x - 12, y - 18, w + 24, 14);
        ctx.strokeRect(x - 12, y - 18, w + 24, 14);
      }
      if (o.pipe) {
        ctx.strokeStyle = '#9ec1ff';
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.moveTo(WHEEL[0] + 60, WHEEL[1] - 70);
        ctx.lineTo(x, y + 12);
        ctx.stroke();
      }
      if (o.filter) {
        ctx.fillStyle = '#dff3f8';
        ctx.strokeStyle = '#0e6f8a';
        ctx.lineWidth = 3;
        ctx.fillRect(x + w + 6, y + h - 40, 30, 36);
        ctx.strokeRect(x + w + 6, y + h - 40, 30, 36);
      }
    },
    house(x, lit) {
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = '#1e2a34';
      ctx.lineWidth = 4;
      ctx.fillRect(x - 40, G - 70, 80, 70);
      ctx.strokeRect(x - 40, G - 70, 80, 70);
      ctx.fillStyle = '#e57373';
      ctx.beginPath();
      ctx.moveTo(x - 52, G - 70);
      ctx.lineTo(x, G - 112);
      ctx.lineTo(x + 52, G - 70);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = lit ? '#4fc3f7' : '#cfd8dc';
      ctx.fillRect(x - 10, G - 46, 20, 24);
    },
    face(x, y, kind) {
      ctx.fillStyle = '#10141a';
      ctx.fillRect(x - 28, y - 22, 56, 44);
      ctx.fillStyle = kind === 'heart' ? '#ff5470' : '#ffd23f';
      if (kind === 'heart') {
        ctx.beginPath();
        ctx.moveTo(x, y + 14);
        ctx.bezierCurveTo(x - 30, y - 6, x - 14, y - 22, x, y - 8);
        ctx.bezierCurveTo(x + 14, y - 22, x + 30, y - 6, x, y + 14);
        ctx.fill();
      } else if (kind === 'smile') {
        ctx.fillRect(x - 12, y - 12, 6, 6);
        ctx.fillRect(x + 6, y - 12, 6, 6);
        ctx.fillRect(x - 14, y + 2, 4, 4);
        ctx.fillRect(x - 10, y + 6, 20, 4);
        ctx.fillRect(x + 10, y + 2, 4, 4);
      }
    },
    sun(now) {
      ctx.fillStyle = '#ffd23f';
      ctx.beginPath();
      ctx.arc(120, 80, 36, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffd23f';
      ctx.lineWidth = 4;
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2 + now * 0.3;
        ctx.beginPath();
        ctx.moveTo(120 + Math.cos(a) * 46, 80 + Math.sin(a) * 46);
        ctx.lineTo(120 + Math.cos(a) * 60, 80 + Math.sin(a) * 60);
        ctx.stroke();
      }
    },
    cloud(x, y) {
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      for (const [dx, r] of [[-30, 22], [0, 30], [32, 22]]) ctx.arc(x + dx, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  window.ZMSceneKit.create({
    W,
    H,
    idleHidden: sim => sim.running || sim.water > 0,
    draw(context, now, sim, kit) {
      ctx = context;
    const level = Math.max(0, Math.min(1, sim.water / sim.cap()));
    const up = { scoop: sim.has('scoop'), pipe: sim.has('pipe'), cover: sim.has('cover'), filter: sim.has('filter') };

    viaArt('drawBackground', Simple.background, now);
    if (sim.advanced) {
      viaArt('drawSun', Simple.sun, now);
      // hơi nước bay lên từ bể rồi thành mây
      const ev = sim.evapRate();
      if (ev > 0 && sim.water > 0 && sim.running) {
        ctx.strokeStyle = 'rgba(255,255,255,.8)';
        ctx.lineWidth = 3;
        for (let i = 0; i < 3; i++) {
          const k = (now * 0.5 + i / 3) % 1;
          ctx.globalAlpha = 1 - k;
          ctx.beginPath();
          ctx.moveTo(TANK[0] + 20 + i * 40, TANK[1] - 10 - k * 60);
          ctx.quadraticCurveTo(TANK[0] + 30 + i * 40, TANK[1] - 25 - k * 60, TANK[0] + 20 + i * 40, TANK[1] - 40 - k * 60);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
      }
      viaArt('drawCloud', Simple.cloud, 330, 90);
      if (fx.rain > now) {
        ctx.strokeStyle = '#3dc1dc';
        ctx.lineWidth = 3;
        for (let i = 0; i < 12; i++) {
          const y = 120 + ((now * 260 + i * 37) % 280);
          ctx.beginPath();
          ctx.moveTo(300 + (i % 4) * 22, y);
          ctx.lineTo(296 + (i % 4) * 22, y + 12);
          ctx.stroke();
        }
      }
    }
    viaArt('drawWheel', Simple.wheel, WHEEL[0], WHEEL[1], { rev: sim.rev, scoop: up.scoop, moving: sim.motorOn, dir: sim.dir });
    viaArt('drawTank', Simple.tank, TANK[0], TANK[1], TANK[2], TANK[3], level, up);
    viaArt('drawHouse', Simple.house, HOUSE_X, sim.drain > 0 || level > 0.9);
    // nước té từ gầu lên bể khi quay đúng chiều
    if (sim.motorOn && sim.dir > 0 && sim.drain <= 0) {
      ctx.fillStyle = '#7fd8ee';
      for (let i = 0; i < 4; i++) {
        const k = (now * 1.6 + i / 4) % 1;
        ctx.beginPath();
        ctx.arc(WHEEL[0] + 40 + k * (TANK[0] - WHEEL[0] - 40), WHEEL[1] - 90 - Math.sin(k * Math.PI) * 50 + k * 70, 6, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    // màn hình M5 trên cối xoay nước
    viaArt('drawFace', Simple.face, WHEEL[0] - 90, WHEEL[1] - 20, sim.face);
    if (sim.note) kit.label('♪ ' + sim.note, WHEEL[0] - 90, WHEEL[1] - 52, '#ffd23f', 22);
    kit.label('Sông', 110, G + 70, '#fff');
    kit.label('Cối xoay nước', WHEEL[0], G + 70, '#fff');
    kit.label(`Bể ${Math.round(sim.water)}/${sim.cap()} lít`, TANK[0] + TANK[2] / 2, TANK[1] + TANK[3] + 28, '#fff', 15);
    kit.label('Làng', HOUSE_X, G + 70, '#fff');
    if (now < fx.wrongUntil) kit.label('Ngược chiều rồi!', WHEEL[0], WHEEL[1] - 130, '#ff8a80', 20);
    },
    onEvent(type, data, kit) {
      const now = performance.now() / 1000;
      const sim = window.simEngine;
      if (type === 'start') {
        fx.wrongUntil = 0;
      } else if (type === 'face' && window.SFX) {
        window.SFX.tone(data === 'heart' ? 660 : 880, 0.08);
      } else if (type === 'wrongWay') {
        fx.wrongUntil = now + 3;
        if (window.SFX) window.SFX.tone(160, 0.25);
        kit.toast('bad', 'Gầu quay ngược chiều', 'Nước chảy ngược xuống sông. Bỏ khối “Đổi chiều quay” để gầu múc nước lên bể.', { label: 'Thử lại', run: () => sim.start() });
      } else if (type === 'full') {
        kit.burst(HOUSE_X, 300);
        if (sim.advanced) fx.rain = now + 3;
        if (window.SFX) window.SFX.ding();
        kit.toast('ok', 'Bể đầy rồi!', sim.advanced ? 'Lần ' + data.fills + ': dân làng dùng nước, nước bay hơi thành mây rồi rơi xuống thành mưa.' : 'Cối xoay nước đưa đầy bể sau ' + data.secs.toFixed(1) + ' giây. Cả làng có nước dùng!');
      } else if (type === 'partial') {
        kit.toast('bad', 'Bể chưa đầy', 'Bể mới có ' + Math.round(data.water) + '/' + sim.cap() + ' lít. Hãy cho gầu quay lâu hơn hoặc nhanh hơn.', { label: 'Thử lại', run: () => sim.start() });
      }
    }
  });
})();
