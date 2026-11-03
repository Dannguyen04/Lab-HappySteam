// Sa bàn hội khoa học, mô phỏng thả bóng mềm ảo; không dùng lập trình điện tử.
(function () {
  'use strict';
  const W = 900, H = 560, G = 430;
  const $ = id => document.getElementById(id);
  const zoneNames = ['','trái','giữa','phải'];

  window.ZMSceneKit.create({
    W, H,
    idleHidden: () => true,
    draw(ctx, now, sim, kit) {
      if (window.Lop3Bai03Art?.draw) {
        window.Lop3Bai03Art.draw(ctx, now, sim);
      } else {
        // Dự phòng nếu art.js chưa sẵn sàng.
        const sky = ctx.createLinearGradient(0, 0, 0, G);
        sky.addColorStop(0, '#b9eaff'); sky.addColorStop(1, '#fff3d9');
        ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#77b6a5'; ctx.fillRect(0, G, W, H - G);
        for (const [i, x] of [335, 490, 645].entries()) {
          ctx.strokeStyle = (sim.lastTarget || sim.target) === i + 1 ? '#ef7e38' : '#2c8cbd';
          ctx.lineWidth = 7; ctx.beginPath(); ctx.arc(x, 339, 36, 0, Math.PI * 2); ctx.stroke();
        }
        ctx.fillStyle = '#a56d44'; ctx.fillRect(75, 384, 130, 18);
        ctx.beginPath(); ctx.moveTo(140, 388); ctx.lineTo(160, 322); ctx.lineTo(180, 388); ctx.fill();
        ctx.strokeStyle = '#39527c'; ctx.lineWidth = 13; ctx.beginPath(); ctx.moveTo(102, 350); ctx.lineTo(197, 368); ctx.stroke();
        ctx.fillStyle = '#e9bb68'; ctx.beginPath(); ctx.arc(sim.ballX || 170, sim.ballY || 339, 15, 0, Math.PI * 2); ctx.fill();
      }
      if (!sim.running && sim.landed) kit.label(sim.hit ? 'CHẠM VÒNG ĐIỂM!' : 'THỬ ĐỔI NẤC NHÉ!', 500, 78, '#fffef5', 26);
    },
    onEvent(type, data, kit) {
      const result = $('lever-result');
      if (type === 'start' && result) result.textContent = 'Bóng mềm ảo đang di chuyển…';
      if (type === 'settings' && result) result.textContent = 'Đã đổi nấc. Hãy thả bóng để thử.';
      if (type === 'hit') {
        kit.burst([0, 335, 490, 645][data.target], 330);
        kit.toast('ok', 'Bóng vào vòng!', data.complete ? 'Em đã hoàn tất ba lượt liên tiếp!' : 'Quan sát vòng tiếp theo và chọn nấc phù hợp.');
        if (result) result.textContent = data.complete ? 'Hoàn thành 3/3 lượt nâng cao!' : `Đúng vòng ${zoneNames[data.target]}!`;
      }
      if (type === 'miss') {
        kit.toast('warn', 'Chưa đúng vòng', `Bóng ở vùng ${zoneNames[data.level]}, đích ở vùng ${zoneNames[data.target]}.`);
        if (result) result.textContent = `Chưa trúng: bóng ở ${zoneNames[data.level]}, đích ở ${zoneNames[data.target]}. ${data.progress === 0 ? 'Thử lại từ lượt đầu.' : ''}`;
      }
      if (['start', 'settings', 'hit', 'miss', 'end'].includes(type)) {
        const sim = window.simEngine;
        if ($('lever-release')) $('lever-release').disabled = !!sim?.running;
        if ($('lever-target') && sim) $('lever-target').textContent = `Vòng mục tiêu: ${zoneNames[sim.target]} (${sim.progress}/3 lượt liên tiếp)`;
        if (sim) document.querySelectorAll('#lever-controls [data-level]').forEach(b => {
          b.setAttribute('aria-pressed', String(Number(b.dataset.level) === sim.level));
          b.disabled = sim.running;
        });
      }
    }
  });

  zmReady(() => setTimeout(() => {
    const wrap = $('scene-wrap'), sim = window.simEngine;
    if (!wrap || !sim || $('lever-controls')) return;
    const style = document.createElement('style');
    style.textContent = `
      #stage-sim .lever-unused-program, #stage-sim #ghost-wrap,
      #stage-sim #scene-press, #stage-sim #scene-idle { display:none !important; }
      #lever-controls { margin:14px 0 0; padding:16px; border:2px solid #d9e9ee;
        border-radius:20px; background:#f5fcff; color:#24475b; }
      #lever-controls .lever-row { display:flex; align-items:center; flex-wrap:wrap; gap:9px; margin:10px 0; }
      #lever-controls .lever-row b { margin-right:8px; }
      #lever-controls button { min-height:50px; padding:11px 18px; border:2px solid #a6cbd6;
        border-radius:14px; background:white; color:#22475a; cursor:pointer; font:inherit; font-weight:700; }
      #lever-controls button[aria-pressed=true] { background:#dbf4ff; border-color:#1377b1; }
      #lever-controls #lever-release { width:100%; min-height:68px; background:#1377b1;
        color:white; border-color:#1377b1; font-size:1.35rem; }
      #lever-controls button:disabled { opacity:.65; cursor:wait; }
      #lever-target { border-radius:12px; background:#e9f5d5; padding:11px 14px;
        font-weight:750; margin:8px 0; }
      #lever-result { text-align:center; font-weight:700; margin:12px 0 0; }
      @media (max-width:460px) { #lever-controls { padding:12px; }
        #lever-controls .lever-row button { flex:1 1 70px; padding:10px 7px; } }
    `;
    document.head.append(style);
    for (const id of ['program-canvas-chain', 'block-toolbox'])
      $(id)?.closest('.panel')?.classList.add('lever-unused-program');
    const tab = $('tab-btn-sim');
    if (tab) {
      const bold = tab.querySelector('b'), small = tab.querySelector('small');
      if (bold) bold.textContent = 'Thử đòn bẩy';
      if (small) small.textContent = 'Sân hội khoa học';
    }
    const asm = document.querySelector('#tab-btn-asm small');
    if (asm) asm.textContent = '24 trang minh họa 3D';
    const foot = document.querySelector('.foot-note');
    if (foot) foot.textContent = 'Bóng, nấc và các vị trí trên sa bàn là minh họa trò chơi; mô hình thật cần người hướng dẫn kiểm tra.';
    const completeCard = $('mc-text');
    if (completeCard) {
      const localizeCompletion = () => {
        if (completeCard.textContent.includes('vệ tinh'))
          completeCard.textContent = 'Em có thể tiếp tục thử các vòng điểm và trang trí mô hình đòn bẩy.';
      };
      new MutationObserver(localizeCompletion).observe(completeCard, { childList: true });
      localizeCompletion();
    }
    const ui = document.createElement('section');
    ui.id = 'lever-controls';
    ui.setAttribute('aria-label', 'Điều khiển thí nghiệm đòn bẩy');
    ui.innerHTML = `
      <div class="lever-row" role="group" aria-label="Chọn nấc mô phỏng">
        <b>Chọn nấc ảo:</b>
        <button type="button" data-level="1" aria-pressed="true">1 · Trái</button>
        <button type="button" data-level="2" aria-pressed="false">2 · Giữa</button>
        <button type="button" data-level="3" aria-pressed="false">3 · Phải</button>
      </div>
      <p id="lever-target" role="status" aria-live="polite">Vòng mục tiêu: giữa</p>
      <button type="button" id="lever-release">Thả bóng mềm ảo</button>
      <p id="lever-result" role="status" aria-live="polite">Chọn nấc rồi thả bóng nhé!</p>`;
    wrap.insertAdjacentElement('afterend', ui);
    const sync = () => {
      ui.querySelectorAll('[data-level]').forEach(b => {
        b.setAttribute('aria-pressed', String(Number(b.dataset.level) === sim.level));
        b.disabled = sim.running;
      });
      $('lever-release').disabled = sim.running;
      $('lever-target').textContent = `Vòng mục tiêu: ${zoneNames[sim.target]} (${sim.progress}/3 lượt liên tiếp)`;
    };
    ui.querySelectorAll('[data-level]').forEach(b => b.addEventListener('click', () => {
      sim.setLevel(b.dataset.level); sync();
    }));
    $('lever-release').addEventListener('click', () => { sim.start(); sync(); });
    sync();
  }, 0));
})();
