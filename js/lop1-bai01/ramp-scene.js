// Cảnh công viên của bài xe trượt dốc; không dùng khối lệnh hay động cơ.
(function () {
  'use strict';
  const W = 900, H = 560, G = 430, START = 75, END = 320, FLAG = 725;
  const HILLS = [0, 85, 145, 205];
  const $ = id => document.getElementById(id);
  const yAt = (x, level) => G - HILLS[level] * Math.max(0, 1 - (x - START) / (END - START));

  window.ZMSceneKit.create({
    W, H,
    idleHidden: () => true,
    draw(ctx, now, sim, kit) {
      const A = window.Lop1Bai01Art;
      const level = sim.slope || 1, x = sim.x == null ? START : sim.x;
      if (A && A.background && A.ramp && A.car && A.finishLine) {
        A.background(ctx, { t: now, surface: sim.surface || 'wood' });
        A.ramp(ctx, 50, G, { level, surface: sim.surface || 'wood', released: !!sim.released, t: now });
        A.finishLine(ctx, FLAG, G, { reached: !!sim.reachedGoal, t: now });
        A.car(ctx, x, yAt(x, level), {
          angle: x < END ? Math.atan(HILLS[level] / (END - START)) : 0,
          wheelAngle: sim.wheelAngle || 0,
          upgrades: Object.fromEntries([...(sim.upgrades || [])].map(k => [k, true])),
          t: now
        });
        if (sim.running && A.speedPuff) A.speedPuff(ctx, x - 54, yAt(x, level) - 25, { speed: sim.velocity, t: now });
      } else {
        const sky = ctx.createLinearGradient(0, 0, 0, G);
        sky.addColorStop(0, '#a9e2ff'); sky.addColorStop(1, '#f8f2cf');
        ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#8bc47b'; ctx.fillRect(0, G, W, H - G);
        ctx.lineWidth = 16; ctx.strokeStyle = '#ae763e'; ctx.beginPath();
        ctx.moveTo(START, yAt(START, level)); ctx.lineTo(END, G); ctx.lineTo(FLAG + 25, G); ctx.stroke();
        ctx.strokeStyle = '#32404d'; ctx.lineWidth = 5; ctx.beginPath();
        ctx.moveTo(FLAG, G); ctx.lineTo(FLAG, G - 125); ctx.stroke();
        ctx.fillStyle = '#ec645d'; ctx.fillRect(FLAG, G - 125, 55, 38);
        ctx.save(); ctx.translate(x, yAt(x, level)); ctx.rotate(x < END ? Math.atan(HILLS[level] / (END - START)) : 0);
        ctx.fillStyle = '#39a7ca'; ctx.fillRect(-40, -45, 80, 25);
        ctx.fillStyle = '#233648'; for (const wx of [-28, 28]) { ctx.beginPath(); ctx.arc(wx, -10, 13, 0, Math.PI * 2); ctx.fill(); }
        ctx.restore();
      }
      if (!sim.running && sim.released) kit.label(sim.reachedGoal ? '🏁 ĐẾN ĐÍCH!' : '🌱 THỬ DỐC CAO HƠN', 510, 80, '#fff', 27);
    },
    onEvent(type, data, kit) {
      const result = $('ramp-result');
      if (type === 'start' && result) result.textContent = '🚗 Xe đang lăn…';
      if (type === 'settings' && result) result.textContent = 'Chọn dốc rồi thả xe nhé!';
      if (type === 'goal') {
        kit.burst(FLAG, G - 120);
        kit.toast('ok', '🏁 Đến đích!', 'Hay lắm! Xe đã lăn tới cờ.');
        if (result) result.textContent = '🏁 Xe đã tới đích!';
      }
      if (type === 'short') {
        kit.toast('warn', 'Xe dừng sớm', 'Đổi sang dốc cao hơn và thử lại nhé!');
        if (result) result.textContent = '🌱 Xe chưa đến cờ. Thử dốc cao hơn!';
      }
      if (type === 'start' && $('ramp-release')) $('ramp-release').disabled = true;
      if ((type === 'goal' || type === 'short' || type === 'settings') && $('ramp-release')) $('ramp-release').disabled = false;
    }
  });

  // Thêm điều khiển vào sa bàn sau khi app.js thiết lập các chặng và chế độ.
  zmReady(() => setTimeout(() => {
    const wrap = $('scene-wrap'), sim = window.simEngine;
    if (!wrap || !sim || $('ramp-controls')) return;
    const style = document.createElement('style');
    style.textContent = `
      #stage-sim .ramp-unused-program, #stage-sim #ghost-wrap,
      #stage-sim #scene-press, #stage-sim #scene-idle { display: none !important; }
      #stage-sim #ramp-controls { border: 2px solid #d8e9e2; border-radius: 20px; padding: 16px;
        margin-top: 14px; background: #f7fcf7; color: #264438; }
      #ramp-controls .ramp-row { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin: 8px 0 12px; }
      #ramp-controls .ramp-row b { margin-right: 10px; }
      #ramp-controls button { border: 2px solid #b3cbbc; background: #fff; border-radius: 14px;
        padding: 11px 17px; min-height: 48px; color: #234638; font: inherit; font-weight: 700; cursor: pointer; }
      #ramp-controls button[aria-pressed=true] { border-color: #08755c; background: #d8fae8; }
      #ramp-controls #ramp-release { background: #08755c; border-color: #08755c; color: #fff;
        display: block; width: 100%; min-height: 70px; font-size: 1.45rem; }
      #ramp-controls #ramp-release:disabled { opacity: .6; cursor: wait; }
      html:not([data-mode=pro]) #ramp-surface-row { display: none !important; }
      #ramp-result { font-weight: 700; text-align: center; margin: 12px 0 2px; }
    `;
    document.head.append(style);
    for (const id of ['program-canvas-chain', 'block-toolbox']) {
      $(id)?.closest('.panel')?.classList.add('ramp-unused-program');
    }
    const tab = $('tab-btn-sim');
    if (tab) {
      const name = tab.querySelector('b'), subtitle = tab.querySelector('small');
      if (name) name.textContent = 'Thử xe trượt dốc';
      if (subtitle) subtitle.textContent = 'Xe lăn trên dốc';
    }
    const assemblyTab = document.querySelector('#tab-btn-asm small');
    if (assemblyTab) assemblyTab.textContent = '7 bước minh họa 3D';
    const victoryHeading = document.querySelector('#victory-modal h2');
    if (victoryHeading) victoryHeading.textContent = 'Hoàn thành các nhiệm vụ';
    const missionText = $('mc-text');
    if (missionText) {
      const fixCompleteCopy = () => {
        if (missionText.textContent.includes('vệ tinh')) missionText.textContent = 'Em đã hoàn thành các thử thách của xe trượt dốc!';
      };
      new MutationObserver(fixCompleteCopy).observe(missionText, { childList: true });
      fixCompleteCopy();
    }
    const foot = document.querySelector('.foot-note');
    if (foot) foot.textContent = 'Đường dốc và số đo là mô phỏng học tập, cần kiểm chứng với xe thật.';
    const ui = document.createElement('section');
    ui.id = 'ramp-controls';
    ui.setAttribute('aria-label', 'Thí nghiệm xe trượt dốc');
    ui.innerHTML = `
      <div class="ramp-row" role="group" aria-label="Chọn độ dốc">
        <b>📐 Độ dốc</b>
        <button type="button" data-slope="1" aria-pressed="true" title="Dốc thoải">▰ Dốc 1</button>
        <button type="button" data-slope="2" aria-pressed="false" title="Dốc vừa">▰▰ Dốc 2</button>
        <button type="button" data-slope="3" aria-pressed="false" title="Dốc cao">▰▰▰ Dốc 3</button>
      </div>
      <div class="ramp-row" id="ramp-surface-row" role="group" aria-label="Chọn mặt đường">
        <b>🛤️ Mặt đường</b>
        <button type="button" data-surface="ice" aria-pressed="false">❄️ Trơn</button>
        <button type="button" data-surface="wood" aria-pressed="true">🪵 Gỗ</button>
        <button type="button" data-surface="rough" aria-pressed="false">🌿 Nhám</button>
      </div>
      <button type="button" id="ramp-release">🚗 Thả xe</button>
      <p id="ramp-result" role="status" aria-live="polite">Chọn dốc rồi thả xe nhé!</p>`;
    wrap.insertAdjacentElement('afterend', ui);
    const refresh = () => {
      ui.querySelectorAll('[data-slope]').forEach(b => b.setAttribute('aria-pressed', String(Number(b.dataset.slope) === sim.slope)));
      ui.querySelectorAll('[data-surface]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.surface === sim.surface)));
      $('ramp-release').disabled = sim.running;
    };
    ui.querySelectorAll('[data-slope]').forEach(b => b.addEventListener('click', () => { sim.setSlope(Number(b.dataset.slope)); refresh(); }));
    ui.querySelectorAll('[data-surface]').forEach(b => b.addEventListener('click', () => { sim.setSurface(b.dataset.surface); refresh(); }));
    $('ramp-release').addEventListener('click', () => { sim.start(); refresh(); });
    refresh();
  }, 0));
})();
