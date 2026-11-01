// Cảnh câu chuyện Bài 3 (chặng ③): mặt sao Hỏa, Trạm A bên trái, điểm B cắm cờ, robot Milo chạy theo chương trình.
// Lấy trạng thái từ window.simEngine (RoverEngine) mỗi khung hình; hình vẽ từ js/bai03/art.js (window.MarsArt) nếu có,
// không thì vẽ hình đơn giản. Cùng giao diện window.ZMScene với cảnh Bài 9: enter, leave, onEvent, setMode.
(function () {
  'use strict';

  const W = 900,
    H = 560;
  const A_X = 110, // px của Trạm A (0 cm)
    PX = 4.4; // px mỗi cm: 150 cm cuối đường ≈ 770 px
  const $ = id => document.getElementById(id);
  const fx = { hitUntil: 0, drop: null, waves: [], grab: false };
  const ground = () => (window.MarsArt ? window.MarsArt.GROUND_Y : 430);
  const xOf = cm => A_X + cm * PX;

  // ---------- hình đơn giản khi chưa có js/bai03/art.js ----------
  const Simple = {
    drawBackground(c) {
      const g = c.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#f6c7a1');
      g.addColorStop(1, '#e9a07a');
      c.fillStyle = g;
      c.fillRect(0, 0, W, H);
      c.fillStyle = '#c8643b';
      c.fillRect(0, 430, W, H - 430);
      c.fillStyle = '#a94f2c';
      c.fillRect(0, 430, W, 6);
    },
    drawStation(c, x, kind) {
      const y = 430;
      c.strokeStyle = '#1e2a34';
      c.lineWidth = 4;
      c.beginPath();
      c.moveTo(x, y);
      c.lineTo(x, y - 90);
      c.stroke();
      c.fillStyle = kind === 'A' ? '#43a047' : '#ef6c00';
      c.beginPath();
      c.moveTo(x, y - 90);
      c.lineTo(x + 40, y - 76);
      c.lineTo(x, y - 62);
      c.fill();
    },
    drawRover(c, x, o) {
      const y = 430;
      c.save();
      c.translate(x + (o.shake ? Math.sin(o.t * 60) * 4 * o.shake : 0), y);
      c.strokeStyle = '#1e2a34';
      c.lineWidth = 3;
      c.fillStyle = '#fff';
      c.fillRect(-60, -80, 80, 50);
      c.strokeRect(-60, -80, 80, 50);
      c.fillStyle = '#3dc1dc';
      c.fillRect(-60, -42, 80, 12);
      c.fillStyle = '#fff';
      c.fillRect(30, -105, 44, 32);
      c.strokeRect(30, -105, 44, 32);
      c.fillStyle = o.eyes ? '#ffd23f' : '#8a96a3';
      for (const ex of [42, 62]) {
        c.beginPath();
        c.arc(ex, -89, 7, 0, Math.PI * 2);
        c.fill();
        c.stroke();
      }
      for (const wx of [-40, 10]) {
        c.fillStyle = '#3dc1dc';
        c.beginPath();
        c.arc(wx, -22, 22, 0, Math.PI * 2);
        c.fill();
        c.stroke();
        c.beginPath();
        c.moveTo(wx, -22);
        c.lineTo(wx + 18 * Math.cos(o.wheel), -22 + 18 * Math.sin(o.wheel));
        c.stroke();
      }
      if (o.bin) {
        c.fillStyle = '#3dc1dc';
        c.fillRect(-55, -100, 50, 20);
        c.strokeRect(-55, -100, 50, 20);
      }
      if (o.solar) {
        c.fillStyle = '#1f4aa6';
        c.fillRect(-70, -128, 90, 8);
      }
      if (o.antenna) {
        c.beginPath();
        c.moveTo(45, -105);
        c.lineTo(45, -150);
        c.stroke();
        c.fillStyle = Math.sin(o.t * 6) > 0 ? '#e53935' : '#7a1d1a';
        c.beginPath();
        c.arc(45, -152, 6, 0, Math.PI * 2);
        c.fill();
      }
      if (o.arm) {
        c.fillStyle = '#dfe6ec';
        c.fillRect(20, -40, 70, 8);
        c.strokeRect(20, -40, 70, 8);
      }
      if (o.carry) Simple.drawSample(c, o.bin ? -30 : -20, o.bin ? -100 : -80, 0.8);
      c.restore();
    },
    drawSample(c, x, y, k) {
      c.save();
      c.translate(x, y);
      c.scale(k, k);
      c.fillStyle = '#b5652d';
      c.fillRect(-10, -14, 20, 14);
      c.fillStyle = '#43a047';
      c.beginPath();
      c.ellipse(-6, -24, 7, 11, -0.5, 0, Math.PI * 2);
      c.ellipse(6, -24, 7, 11, 0.5, 0, Math.PI * 2);
      c.fill();
      c.restore();
    },
    drawHand(c, x, y, k) {
      c.save();
      c.translate(x, y);
      c.scale(k, k);
      c.fillStyle = '#f2c09a';
      c.strokeStyle = '#1e2a34';
      c.lineWidth = 2.5;
      c.beginPath();
      c.ellipse(0, 0, 18, 22, 0, 0, Math.PI * 2);
      c.fill();
      c.stroke();
      c.restore();
    },
    drawRock(c, x, size) {
      c.fillStyle = '#8a4a2e';
      c.strokeStyle = '#1e2a34';
      c.lineWidth = 3;
      c.beginPath();
      c.ellipse(x, 430 - size * 0.4, size, size * 0.55, 0, Math.PI, 0);
      c.fill();
      c.stroke();
    }
  };
  const art = () => window.MarsArt || Simple;

  // ---------- vẽ ----------
  window.ZMSceneKit.create({
    W,
    H,
    idleHidden: sim => sim.running || sim.x > 0,
    draw(ctx, now, sim, kit) {
    const A = art(),
      G = ground();
    const hit = now < fx.hitUntil;
    A.drawBackground(ctx, now);
    // đá dọc đường (trang trí) và tảng đá lớn cuối đường
    A.drawRock(ctx, xOf(25), 14, 3);
    A.drawRock(ctx, xOf(118), 12, 7);
    A.drawRock(ctx, xOf(window.RoverEngine.TRACK_END) + 70, 46, 11);
    // thước đo (chế độ Nâng cao)
    if (sim.advanced) {
      ctx.strokeStyle = 'rgba(40,15,5,.55)';
      ctx.fillStyle = 'rgba(40,15,5,.75)';
      ctx.lineWidth = 2;
      ctx.font = '600 12px "JetBrains Mono",monospace';
      ctx.textAlign = 'center';
      for (let cm = 0; cm <= 150; cm += 10) {
        const x = xOf(cm),
          big = cm % 50 === 0;
        ctx.beginPath();
        ctx.moveTo(x, G + 12);
        ctx.lineTo(x, G + (big ? 30 : 22));
        ctx.stroke();
        if (big) ctx.fillText(cm + ' cm', x, G + 46);
      }
    }
    A.drawStation(ctx, xOf(0) - 70, 'A');
    A.drawStation(ctx, xOf(sim.bPos), 'B');
    if (!window.MarsArt) {
      kit.label('Trạm A', xOf(0) - 70, G - 100, '#fff');
      kit.label('Điểm B', xOf(sim.bPos), G - 100, '#fff');
    }
    if (sim.advanced) kit.label(`B cách A ${sim.bPos} cm`, xOf(sim.bPos), G + 72, '#fff', 15);
    // vùng dừng đúng quanh B
    ctx.fillStyle = 'rgba(255,240,120,.35)';
    ctx.fillRect(xOf(sim.bPos - sim.tol()), G - 4, sim.tol() * 2 * PX, 8);

    // mẫu cây rơi
    if (fx.drop) {
      const k = Math.min(1, (now - fx.drop.t0) / 0.6);
      A.drawSample(ctx, fx.drop.x - 40 * k, G - 90 + 90 * k * k, 0.9);
    }
    const rx = xOf(sim.x);
    A.drawRover(ctx, rx, {
      wheel: sim.rev * Math.PI * 2,
      eyes: sim.hand || sim.waitingHand,
      shake: hit ? 1 : 0,
      bin: sim.has('bin'),
      antenna: sim.has('antenna'),
      solar: sim.has('solar'),
      arm: sim.has('arm'),
      carry: sim.sample,
      t: now
    });
    if (fx.grab) A.drawRock(ctx, rx + 75, 7, 5);
    if (sim.hand) A.drawHand(ctx, rx + 120, G - 95, 1);
    // sóng tín hiệu từ ăng-ten về Trạm A
    fx.waves = fx.waves.filter(w => now - w.t0 < 1.5);
    for (const w of fx.waves) {
      const k = (now - w.t0) / 1.5,
        x = w.x + (xOf(0) - 70 - w.x) * k;
      ctx.strokeStyle = `rgba(229,57,53,${1 - k})`;
      ctx.lineWidth = 4;
      for (const r of [10, 18]) {
        ctx.beginPath();
        ctx.arc(x, G - 170, r, Math.PI * 0.75, Math.PI * 1.25);
        ctx.stroke();
      }
    }
    if (sim.advanced) {
      // bảng tốc độ để tính quãng đường
      ctx.fillStyle = 'rgba(255,255,255,.88)';
      ctx.strokeStyle = 'rgba(60,20,10,.4)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(14, 14, 230, 70, 10);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#3a1a0c';
      ctx.textAlign = 'left';
      ctx.font = '700 14px "Be Vietnam Pro","Segoe UI",sans-serif';
      ctx.fillText('Tốc độ robot', 26, 36);
      ctx.font = '500 13px "JetBrains Mono",monospace';
      const sp = p => window.RoverEngine.SPEED(p).toFixed(1).replace('.', ',');
      ctx.fillText(`Mức 4: ${sp(4)} cm/giây`, 26, 56);
      ctx.fillText(`Mức 8: ${sp(8)} cm/giây`, 26, 74);
    }
    $('scene-hand')?.classList.toggle('is-waiting', !!sim.waitingHand);
    },
    onEvent(type, data, kit) {
    const now = performance.now() / 1000,
      sim = window.simEngine;
    if (type === 'start') {
      fx.drop = null;
      fx.grab = false;
    } else if (type === 'hand' && window.SFX) window.SFX.tone(880, 0.1);
    else if (type === 'seen' && window.SFX) window.SFX.tone(1320, 0.12);
    else if (type === 'drop') {
      fx.drop = { t0: now, x: xOf(data) - 20 };
      if (window.SFX) window.SFX.tone(220, 0.2);
    } else if (type === 'crash') {
      fx.hitUntil = now + 0.7;
      kit.shake(0.7);
      if (window.SFX) window.SFX.tone(140, 0.35);
      kit.toast('bad', 'Ối! Robot đụng tảng đá', 'Robot chạy quá xa. Hãy cho robot chạy ít giây hơn.', retry);
    } else if (type === 'deliver') {
      const x = xOf(sim.x);
      kit.burst(x, ground() - 120);
      if (sim.has('antenna')) fx.waves.push({ t0: now, x }, { t0: now + 0.4, x }, { t0: now + 0.8, x });
      if (sim.has('arm')) fx.grab = true;
      if (window.SFX) window.SFX.ding();
      kit.toast('ok', 'Giỏi quá!', sim.has('arm') ? 'Robot chở mẫu cây tới điểm B và nhặt thêm một mẫu đá!' : 'Robot đã chở mẫu cây tới điểm B.');
    } else if (type === 'short') {
      kit.toast('bad', 'Chưa tới điểm B', `Robot còn cách B ${Math.round(-data.off)} cm. Hãy cho robot chạy lâu hơn hoặc nhanh hơn.`, retry);
    } else if (type === 'over') {
      kit.toast('bad', 'Quá điểm B rồi', `Robot chạy quá B ${Math.round(data.off)} cm. Hãy cho robot chạy ít giây hơn hoặc chậm hơn.`, retry);
    } else if (type === 'emptyArrive') {
      kit.toast('bad', 'Mẫu cây rơi mất rồi', 'Chạy nhanh làm rơi mẫu cây. Hãy chạy chậm hơn (Tốc độ mức 4) hoặc gắn thùng chở mẫu.', retry);
    } else if (type === 'target' && sim.advanced) {
      kit.toast('ok', 'Điểm B mới', `Điểm B giờ cách Trạm A ${data} cm. Em tính xem cần chạy mấy giây?`);
    }
    },
    init(cv) {
      // Giữ cảm biến siêu âm riêng: nút tay hoặc chạm sa bàn.
      const hand = () => window.simEngine?.putHand();
      $('scene-hand')?.addEventListener('click', hand);
      cv.addEventListener('click', hand);
    }
  });
  const retry = { label: 'Thử lại', run: () => window.simEngine.start() };
})();
