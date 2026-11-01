// Khung dùng chung cho cảnh câu chuyện (chặng ③) của mọi bài mô hình: vòng vẽ ~40 hình/giây, đổi tỉ lệ theo khung,
// thông báo (toast), chùm sao chúc mừng, rung khi va chạm, nút đỏ / phím cách = nhấn cảm biến chạm,
// nút "Xem robot thật" ↔ "Xem câu chuyện". Mỗi bài chỉ viết phần vẽ và phản ứng sự kiện:
//   ZMSceneKit.create({ W, H, draw(ctx, now, sim, kit), onEvent(type, data, kit), idleHidden(sim) })
// rồi kit gán window.ZMScene = { enter, leave, onEvent, setMode, mode }.
(function () {
  'use strict';

  const $ = id => document.getElementById(id);

  function create(spec) {
    const W = spec.W || 900,
      H = spec.H || 560;
    let cv, ctx, raf = 0, last = 0, mode = 'story', active = false, toastTimer = 0;
    const fx = { stars: [], shakeUntil: 0 };

    function resize() {
      if (!cv) return;
      const w = cv.clientWidth || W,
        dpr = Math.min(2, window.devicePixelRatio || 1);
      cv.width = Math.round(w * dpr);
      cv.height = Math.round(((w * H) / W) * dpr);
    }
    const kit = {
      W,
      H,
      // Chữ có viền tối, đọc được trên mọi nền
      label(text, x, y, color, size = 16) {
        ctx.font = `700 ${size}px "Be Vietnam Pro","Segoe UI",sans-serif`;
        ctx.textAlign = 'center';
        ctx.lineWidth = 4;
        ctx.strokeStyle = 'rgba(20,40,30,.7)';
        ctx.strokeText(text, x, y);
        ctx.fillStyle = color;
        ctx.fillText(text, x, y);
      },
      // Chùm sao bung ra từ (x, y)
      burst(x, y, n = 14, colors = ['#ffd23f', '#fff', '#8cc152']) {
        const t0 = performance.now() / 1000;
        for (let i = 0; i < n; i++) {
          const a = (i / n) * Math.PI * 2;
          fx.stars.push({ t0, x, y, vx: Math.cos(a), vy: Math.sin(a), c: colors[i % colors.length] });
        }
      },
      shake(secs = 0.7) {
        fx.shakeUntil = performance.now() / 1000 + secs;
      },
      toast(kind, title, text, action) {
        const el = $('scene-toast');
        if (!el) return;
        el.dataset.k = kind;
        $('scene-toast-title').textContent = title;
        $('scene-toast-text').textContent = text;
        const btn = $('scene-toast-btn');
        if (btn) btn.hidden = !action;
        if (action && btn) {
          btn.textContent = action.label;
          btn.onclick = () => {
            el.hidden = true;
            action.run();
          };
        }
        el.hidden = false;
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => (el.hidden = true), action ? 6000 : 3000);
      }
    };

    // Chỉ vẽ khi đang ở chặng ③: rời chặng thì dừng hẳn vòng vẽ
    function frame(ts) {
      raf = active ? requestAnimationFrame(frame) : 0;
      if (!active) return;
      const sim = window.simEngine;
      if (!sim || !ctx || mode !== 'story') return;
      const now = ts / 1000;
      if (now - last < 1 / 40) return;
      last = now;
      ctx.setTransform(cv.width / W, 0, 0, cv.width / W, 0, 0);
      if (now < fx.shakeUntil) ctx.translate((Math.random() - 0.5) * 8, 0);
      spec.draw(ctx, now, sim, kit);
      fx.stars = fx.stars.filter(s => now - s.t0 < 1.4);
      for (const s of fx.stars) {
        const k = (now - s.t0) / 1.4;
        ctx.globalAlpha = 1 - k;
        ctx.fillStyle = s.c;
        ctx.beginPath();
        ctx.arc(s.x + s.vx * k * 90, s.y + s.vy * k * 90, 7, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      const idle = $('scene-idle');
      if (idle) idle.hidden = spec.idleHidden ? spec.idleHidden(sim) : sim.running;
      const btn = $('scene-press');
      if (btn) btn.classList.toggle('is-waiting', !!sim.waitingPress);
    }

    function onEvent(type, data) {
      if (type === 'start' && $('scene-toast')) $('scene-toast').hidden = true;
      else if (type === 'press' && window.SFX) window.SFX.tone(990, 0.08);
      if (spec.onEvent) spec.onEvent(type, data, kit);
    }
    function setMode(m) {
      mode = m;
      const wrap = $('scene-wrap'),
        toggle = $('scene-toggle');
      if (wrap) wrap.dataset.mode = m;
      if (toggle) {
        toggle.textContent = m === 'story' ? 'Xem robot thật' : 'Xem câu chuyện';
        toggle.setAttribute('aria-pressed', String(m === 'robot'));
      }
      if (!active) return;
      if (m === 'robot') window.ZMSandbox?.open();
      else window.ZMSandbox?.close();
      resize();
    }
    function enter() {
      active = true;
      resize();
      if (!raf && ctx) raf = requestAnimationFrame(frame);
      if (mode === 'robot') window.ZMSandbox?.open();
    }
    function leave() {
      active = false;
      cancelAnimationFrame(raf);
      raf = 0;
      clearTimeout(toastTimer);
      window.ZMSandbox?.close();
    }

    zmReady(() => {
      cv = $('space-scene');
      if (!cv) return;
      ctx = cv.getContext('2d');
      new ResizeObserver(resize).observe(cv);
      $('scene-toggle')?.addEventListener('click', () => setMode(mode === 'story' ? 'robot' : 'story'));
      $('scene-toast-close')?.addEventListener('click', () => ($('scene-toast').hidden = true));
      const press = () => window.simEngine && window.simEngine.press();
      $('scene-press')?.addEventListener('click', press);
      cv.addEventListener('click', press);
      // Phím cách = nhấn nút (khi đang ở chặng ③, không gõ trong ô nhập)
      document.addEventListener('keydown', e => {
        if (e.code !== 'Space' || !active || /INPUT|TEXTAREA|BUTTON|SELECT/.test(document.activeElement.tagName)) return;
        e.preventDefault();
        press();
      });
      if (spec.init) spec.init(cv, kit);
      if (active && !raf) raf = requestAnimationFrame(frame);
    });

    window.ZMScene = { enter, leave, onEvent, setMode, mode: () => mode };
    return kit;
  }

  window.ZMSceneKit = { create };
})();
