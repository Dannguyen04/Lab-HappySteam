// Sa bàn nhìn ngang: nhà kính sao Hỏa, ba luống cây, xe M1/M2 và bão bụi.
// Hình Antigravity (phiếu 43) có thể nạp sau scene; thiếu hàm nào dùng hình dự phòng hàm đó.
(function () {
  'use strict';
  const W = 900, H = 560, G = 430, ORIGIN = 315, SCALE = 5.1;
  const beds = [205, 274, 343];
  const at = cm => ORIGIN + cm * SCALE;
  const fallback = {
    background(c) {
      const sky = c.createLinearGradient(0, 0, 0, G);
      sky.addColorStop(0, '#26162b'); sky.addColorStop(1, '#ad574a');
      c.fillStyle = sky; c.fillRect(0, 0, W, H);
      c.fillStyle = '#e7a382'; c.beginPath(); c.arc(750, 94, 35, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#9c4836'; c.fillRect(0, G, W, H - G);
      c.fillStyle = '#79392e';
      for (let i = 0; i < 7; i++) {
        c.beginPath(); c.moveTo(i * 155 - 75, G); c.lineTo(i * 155 + 20, 300 - (i % 3) * 20);
        c.lineTo(i * 155 + 150, G); c.fill();
      }
    },
    greenhouse(c, x, gy, o) {
      c.fillStyle = 'rgba(142,224,213,.14)'; c.fillRect(x - o.w / 2, gy - o.h, o.w, o.h);
      c.strokeStyle = '#b1e7e1'; c.lineWidth = 7; c.strokeRect(x - o.w / 2, gy - o.h, o.w, o.h);
      c.beginPath(); c.moveTo(x - o.w / 2, gy - o.h); c.lineTo(x, gy - o.h - 28);
      c.lineTo(x + o.w / 2, gy - o.h); c.stroke();
    },
    bed(c, x, gy, o) {
      c.fillStyle = '#5e382f'; c.beginPath(); c.ellipse(x, gy - 2, 30, 12, 0, 0, 2 * Math.PI); c.fill();
      if (o.state === 'planted') {
        c.strokeStyle = '#8bd684'; c.lineWidth = 5; c.beginPath(); c.moveTo(x, gy - 8);
        c.lineTo(x, gy - 24 - 24 * o.grow); c.stroke();
        c.fillStyle = '#69bf80'; c.beginPath(); c.ellipse(x - 11, gy - 24 - 18 * o.grow, 12, 6, -.3, 0, 2 * Math.PI); c.fill();
      }
    },
    pot(c, x, gy, o) {
      c.save(); c.translate(x, gy); if (o.tipped) c.rotate(.8);
      const width = o.size === 'large' ? 29 : 22;
      c.fillStyle = '#db955e'; c.beginPath(); c.moveTo(-width, -26); c.lineTo(width, -26);
      c.lineTo(width * .7, 0); c.lineTo(-width * .7, 0); c.closePath(); c.fill();
      c.strokeStyle = '#315e39'; c.lineWidth = 4; c.beginPath(); c.moveTo(0, -27); c.lineTo(0, -59); c.stroke();
      c.fillStyle = '#65bf6a'; for (const s of [-1, 1]) {
        c.beginPath(); c.ellipse(s * 9, -49, 13, 6, s * -.4, 0, 2 * Math.PI); c.fill();
      }
      c.restore();
    },
    robot(c, x, gy, o) {
      c.save(); c.translate(x, gy);
      c.fillStyle = '#e6e8dc'; c.fillRect(-42, -48, 85, 29);
      c.fillStyle = '#44d4df'; c.fillRect(-32, -62, 48, 20);
      c.strokeStyle = '#d0dcdc'; c.lineWidth = 6;
      c.beginPath(); c.moveTo(25, -39); c.lineTo(60, -38 + 28 * o.armDown); c.stroke();
      c.fillStyle = '#96f0ed'; c.beginPath(); c.arc(44, -81, 11, 0, Math.PI * 2); c.fill();
      for (const wx of [-28, 30]) {
        c.fillStyle = '#1e283b'; c.beginPath(); c.arc(wx, -13, 17, 0, Math.PI * 2); c.fill();
        c.strokeStyle = '#a5e1e4'; c.lineWidth = 3; c.save(); c.translate(wx, -13); c.rotate(o.wheelAngle);
        c.beginPath(); c.moveTo(-12, 0); c.lineTo(12, 0); c.moveTo(0, -12); c.lineTo(0, 12); c.stroke(); c.restore();
      }
      if (o.upgrades?.solar) { c.fillStyle = '#315991'; c.fillRect(-34, -85, 65, 12); }
      if (o.upgrades?.watering) { c.fillStyle = '#9de9ee'; c.fillRect(-45, -76, 27, 22); }
      if (o.upgrades?.lamp) { c.fillStyle = '#ffe391'; c.beginPath(); c.arc(26, -72, 8, 0, 2 * Math.PI); c.fill(); }
      if (o.upgrades?.wideArm) { c.strokeStyle = '#ffe097'; c.lineWidth = 5; c.strokeRect(45, -37, 27, 13); }
      c.restore();
    },
    dust(c, w, h, o) {
      c.fillStyle = `rgba(221,131,83,${Math.min(.72, o.strength * .65)})`;
      c.fillRect(0, 0, w, h);
      c.strokeStyle = '#ffbb8b'; c.lineWidth = 4;
      for (let i = 0; i < 14; i++) {
        const x = (i * 141 + o.t * 160) % w;
        c.beginPath(); c.moveTo(x - 28, (i * 73) % h); c.lineTo(x + 22, (i * 73) % h - 6); c.stroke();
      }
    },
    noteA(c, x, y) { c.fillStyle = '#ffe48f'; c.font = 'bold 34px sans-serif'; c.fillText('♫', x, y); }
  };
  const draw = (ctx, kind, ...args) => {
    const art = window.Lop3Bai12Art || {};
    (typeof art[kind] === 'function' ? art[kind] : fallback[kind])(ctx, ...args);
  };
  window.ZMSceneKit.create({
    W, H, idleHidden: sim => sim.running || sim.got() > 0,
    draw(ctx, now, sim, kit) {
      draw(ctx, 'background', { t: now, storm: sim.stormT > 0 });
      draw(ctx, 'greenhouse', 275, G, { w: 315, h: 192, glow: sim.got() > 0 });
      for (let i = 0; i < beds.length; i++) {
        const p = sim.pots[i];
        const bedState = p.state === 'planted' ? 'planted' : p.state === 'fallen' ? 'fallen' : (sim.held && i === sim.loops ? 'target' : 'empty');
        draw(ctx, 'bed', beds[i], G, { state: bedState, grow: p.grow, t: now });
        kit.label(`Luống ${i + 1}${p.state === 'planted' ? ' ✓' : ''}`, beds[i], G + 38, '#fff2d1', 13);
      }
      const p = sim.current();
      if (p && ['waiting', 'fallen'].includes(p.state))
        draw(ctx, 'pot', at(p.a), G, { size: sim.has('wideArm') ? 'big' : 'small', tipped: p.state === 'fallen', held: false });
      const roverX = at(sim.x);
      if (sim.held) draw(ctx, 'pot', roverX + 63, G - 9, { size: sim.has('wideArm') ? 'big' : 'small', held: true });
      draw(ctx, 'robot', roverX, G, {
        armDown: sim.armDown, wheelAngle: -sim.rev * Math.PI * 2, sensorOn: !!sim.seen(),
        upgrades: { wideArm: sim.has('wideArm'), watering: sim.has('watering'), lamp: sim.has('lamp'), solar: sim.has('solar') }
      });
      if (sim.melodies && sim.motorPort === 'M2') draw(ctx, 'noteA', roverX + 40, G - 115, { t: now });
      if (sim.stormT > 0) {
        draw(ctx, 'dust', W, H, { t: now, strength: .8 });
        kit.label(`BÃO BỤI · CÒN ${sim.stormT.toFixed(1)} GIÂY`, 690, 45, '#fff3da', 18);
      }
      ctx.fillStyle = 'rgba(40,26,39,.88)'; ctx.fillRect(17, 15, 233, 54);
      kit.label(`ĐÃ TRỒNG ${sim.got()}/3 CÂY`, 133, 48, '#c3ffce', 20);
      kit.label(`Xe: ${sim.x.toFixed(1)} cm`, Math.max(58, Math.min(W - 58, roverX)), G - 107, '#fff', 14);
    },
    onEvent(type, data, kit) {
      if (type === 'picked') {
        kit.toast('ok', 'Đã ôm chậu cây', `Chậu ${data.count}/3 đã nằm trong khung gắp. Hãy cho M1 lùi về luống.`);
      } else if (type === 'planted') {
        kit.burst(beds[data.pot.number - 1], G - 40);
        kit.toast('ok', `Đã trồng ${data.count}/3 cây!`, 'Chậu được đặt đúng luống, cây bắt đầu lớn lên.');
      } else if (type === 'sampleDone') {
        kit.toast('ok', 'Đúng 13 khối mẫu!', 'Đã hoàn thành một vòng theo KHGD. Chỉnh thời gian lùi để trồng đủ ba chậu.');
      } else if (type === 'allPlanted') {
        kit.burst(274, G - 90, 22);
        kit.toast('ok', 'Nhà kính đã có 3 cây!', `Hoàn thành sau ${data.secs.toFixed(1)} giây.`);
      } else if (type === 'stormStart') {
        kit.toast('warn', 'Bão bụi đang tới!', `Lượt ${data.round}: dùng Đợi đường trống trước khi cho xe chạy.`);
      } else if (type === 'miss') {
        kit.shake(.4);
        kit.toast('warn', 'Chậu cây bị đổ', data.message);
      }
    }
  });
})();
