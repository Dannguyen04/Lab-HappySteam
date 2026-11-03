// Cảnh phòng khách: giữ cảm biến chạm để khoan, thả để dừng.
(function () {
  'use strict';
  const W = 900, H = 560, G = 430;

  window.ZMSceneKit.create({
    W, H,
    draw(ctx, now, sim, kit) {
      const surface = sim.material || 'tile';
      const depth = Math.min(1, sim.depth / 10);
      const upgrades = {
        boostTrigger: sim.has('boostTrigger'), sideHandle: sim.has('sideHandle'),
        depthGauge: sim.has('depthGauge'), dustShield: sim.has('dustShield')
      };
      const spinning = sim.motorOn && sim.held;
      const art = window.Lop1Bai04Art;
      if (art && art.background && art.wall && art.drill) {
        art.background(ctx, { t: now, surface });
        art.wall(ctx, 540, G, { surface, w: 330, h: 345, targetY: 240,
          drilledDepth: depth, cracked: sim.cracked, targetActive: true, t: now });
        art.bracket?.(ctx, 615, 240, { state: sim.lastOutcome === 'pass' ? 'mounted' : 'none' });
        art.drill(ctx, 390, 240, { t: now, triggerPressed: sim.held, spinning,
          speed: sim.power <= 4 ? 'low' : sim.power <= 6 ? 'med' : 'high',
          depth, upgrades });
        if (spinning) art.dustPuff?.(ctx, 615, 240, { t: now, surface,
          active: true, shield: upgrades.dustShield, strength: 0.6 });
        if (sim.lastOutcome === 'pass') art.pictureFrame?.(ctx, 720, 170, { hung: true, t: now });
      } else {
        // Canvas dự phòng nếu art.js chưa được nạp.
        ctx.fillStyle = '#e9f6fc'; ctx.fillRect(0, 0, W, G);
        ctx.fillStyle = '#c19a70'; ctx.fillRect(0, G, W, H - G);
        ctx.fillStyle = surface === 'wood' ? '#e6bb80' : surface === 'plaster' ? '#f8f8f8' : '#d7e2eb';
        ctx.fillRect(555, 75, 310, 345);
        ctx.strokeStyle = sim.cracked ? '#dd4444' : '#50b273';
        ctx.lineWidth = 7; ctx.beginPath(); ctx.arc(625, 245, 18 + depth * 11, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = '#4dc9d3'; ctx.fillRect(285, 190, 240 + depth * 26, 90);
        ctx.fillStyle = '#445264'; ctx.fillRect(360, 278, 46, 93);
        ctx.fillStyle = sim.held ? '#e34b43' : '#ff876a';
        ctx.beginPath(); ctx.arc(392, 287, 20, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#344452'; ctx.fillRect(520 + depth * 26, 227, 105, 22);
        if (upgrades.boostTrigger) { ctx.fillStyle = '#ff9a46'; ctx.fillRect(348, 305, 70, 10); }
        if (upgrades.sideHandle) { ctx.fillStyle = '#60798a'; ctx.fillRect(460, 280, 18, 75); }
        if (upgrades.depthGauge) { ctx.fillStyle = '#5ed5a8'; ctx.fillRect(508, 207, 94, 8); }
        if (upgrades.dustShield) { ctx.fillStyle = '#aeeafa88'; ctx.fillRect(540, 162, 26, 121); }
        if (sim.lastOutcome === 'pass') kit.label('🖼️ ✅', 715, 210, '#167748', 40);
      }
      kit.label(sim.held ? '🔴 ĐANG GIỮ CÒ' : '🔴 NHẤN GIỮ CÒ ĐỂ KHOAN', 265, 485, '#fff', 23);
      kit.label(sim.lastOutcome === 'fail' ? '✗ Thử lại nhé!' :
        sim.lastOutcome === 'pass' ? '✓ Treo tranh thành công!' :
          sim.running ? '🟢 Thả ở vạch xanh' : '▶ Chạy chương trình', 650, 488, '#fff', 22);
    },
    onEvent(type, data, kit) {
      if (type === 'sampleDone') kit.burst(430, 240);
      if (type === 'drillPass') {
        kit.burst(615, 240, 26);
        kit.toast('ok', 'Khoan đúng rồi!', 'Em đã khoan tới vạch xanh.');
      }
      if (type === 'drillFail') {
        kit.shake(0.35);
        kit.toast('warn', 'Thử lại nhé!', data);
      }
    },
    init(cv) {
      const btn = document.getElementById('scene-press');
      const active = () => window.ZMStages?.current() === 'sim' && window.ZMScene?.mode() === 'story';
      const press = e => {
        if (!active()) return;
        e.preventDefault();
        window.simEngine?.press();
      };
      const release = () => window.simEngine?.release?.();
      [btn, cv].filter(Boolean).forEach(el => {
        el.style.touchAction = 'none';
        el.addEventListener('pointerdown', press);
        // Chặn click sinh bởi pointerup để không kích hoạt lại cò đã nhả.
        el.addEventListener('click', e => {
          e.stopImmediatePropagation();
          if (e.detail === 0 && active()) {
            window.simEngine?.press();
            setTimeout(release, 250); // kích hoạt từ trình đọc màn hình
          }
        }, true);
      });
      window.addEventListener('pointerup', release);
      window.addEventListener('pointercancel', release);
      window.addEventListener('blur', release);
      document.addEventListener('visibilitychange', () => { if (document.hidden) release(); });
      document.addEventListener('keydown', e => {
        if (e.code !== 'Space' || !active() ||
          (/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) ||
          (document.activeElement.tagName === 'BUTTON' && document.activeElement !== btn)) return;
        e.preventDefault(); e.stopImmediatePropagation();
        if (!e.repeat) window.simEngine?.press();
      }, true);
      document.addEventListener('keyup', e => {
        if (e.code !== 'Space') return;
        if (active()) e.preventDefault();
        release();
      }, true);

      // Bảng vật liệu chỉ ở chế độ Nâng cao.
      const stage = document.getElementById('stage-sim');
      if (stage && !document.getElementById('drill-material')) {
        const label = document.createElement('label');
        label.className = 'pro-only';
        label.htmlFor = 'drill-material';
        label.textContent = '🧱 Chọn bề mặt: ';
        label.style.cssText = 'display:inline-block;margin:10px 0;padding:10px 16px;border-radius:12px;background:var(--panel,#eef5f7);font-weight:700';
        const select = document.createElement('select');
        select.id = 'drill-material';
        select.style.cssText = 'min-height:40px;font:inherit;margin-left:8px;border-radius:8px';
        [['tile', 'Gạch men · Chậm'], ['wood', 'Gỗ · Vừa'], ['plaster', 'Thạch cao · Nhanh']].forEach(([value, name]) => {
          const option = document.createElement('option');
          option.value = value; option.textContent = name; select.appendChild(option);
        });
        label.appendChild(select);
        select.addEventListener('change', () => window.simEngine?.setMaterial(select.value));
        const scene = document.getElementById('scene-wrap');
        if (scene) scene.parentNode.insertBefore(label, scene);
        else stage.appendChild(label);
      }
    }
  });
})();
