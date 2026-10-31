// js/app.js – ghép các phần của một trang bài học: ba chặng (lắp ráp, sáng tạo, lập trình & thử),
// giao diện sáng/tối, âm thanh, hộp thoại học sinh/giáo viên, hình sách và đồng hồ đo của chặng lắp ráp.
// Phần riêng của bài lấy từ window.LESSON (js/baiXX/lesson.js): bộ mô phỏng, khối lệnh, nhiệm vụ, hình sách, khóa lưu.
(function () {
  'use strict';

  const $ = id => document.getElementById(id);
  const L = window.LESSON;

  document.addEventListener('DOMContentLoaded', () => {
    if (window.SFX) window.SFX.init();

    const missionTracker = new window.MissionTracker();
    missionTracker.init();

    const simEngine = new window[L.Engine]('sim-canvas-2d');
    simEngine.init();
    window.simEngine = simEngine; // xưởng sáng tạo gửi gói nâng cấp sang sa bàn

    const blockEngine = new window.BlockEngine('program-canvas-chain', 'block-toolbox', L.blocks);
    blockEngine.init();
    const ghostScore = () => {
      const g = $('program-ghost');
      $('ghost-score').textContent = g.dataset.total ? `Đúng ${g.dataset.right}/${g.dataset.total} khối` : '';
    };
    blockEngine.setOnChange(blocks => {
      simEngine.setProgram(blocks);
      simEngine.checkMissions();
      ghostScore();
    });
    blockEngine.setGhost($('program-ghost'));
    ghostScore();
    // Như phần mềm ZMrobo: chạm khối Start màu vàng để chạy
    blockEngine.onStartTap = () => simEngine.start();
    simEngine.setProgram(blockEngine.blocks);
    simEngine.onActiveBlockUpdate = i => blockEngine.setActiveBlock(i);
    simEngine.onEvent = (type, data) => window.ZMScene?.onEvent(type, data);
    simEngine.onMissionUpdate = state => {
      missionTracker.update(state);
      updateMissionCard();
    };

    // Thẻ nhiệm vụ ở chặng ③: nhiệm vụ chưa xong đầu tiên, một câu ngắn
    const CARDS = L.cards;
    function updateMissionCard() {
      const m = missionTracker.missions;
      const pro = document.documentElement.dataset.mode === 'pro';
      const order = L.cardOrder[pro ? 'pro' : 'kid'];
      const key = order.find(k => !m[k]);
      const card = key ? CARDS[key] : { n: '✓', title: `Xong cả ${order.length} nhiệm vụ!`, text: 'Em có thể tự sáng tạo chương trình mới cho vệ tinh.' };
      $('mc-num').textContent = card.n;
      $('mc-title').textContent = (key ? 'Nhiệm vụ ' + card.n + ': ' : '') + card.title;
      $('mc-text').textContent = card.text;
      $('mission-card').dataset.done = String(!key);
      $('mc-action').hidden = !card.go;
      if (card.go) {
        $('mc-action').textContent = card.go[1];
        $('mc-action').onclick = () => go(card.go[0]);
      }
      // Hàng mẫu mờ chỉ cần khi chưa xong nhiệm vụ 2
      $('ghost-wrap').hidden = !!m.m2;
    }
    // NV1: tiến độ "Đã lắp xong bước này" của trình xem 3D
    window.addEventListener('zm:assembly-progress', e => simEngine.setAssemblyDone(e.detail.done >= e.detail.total));
    simEngine.checkMissions();
    updateMissionCard();

    // ---------- Chương trình ----------
    $('btn-run-program').addEventListener('click', () => simEngine.start());
    $('btn-stop-program').addEventListener('click', () => simEngine.stop());
    $('btn-load-sample').addEventListener('click', () => {
      if (confirm('Nạp chương trình mẫu trong sách? Các khối đang ghép sẽ bị thay.')) blockEngine.loadDefaultProgram();
    });
    $('btn-clear-code').addEventListener('click', () => {
      if (confirm('Xóa hết các khối lệnh để tự ghép lại từ đầu?')) blockEngine.clearProgram();
    });

    // Trình duyệt chỉ cho phát âm thanh sau thao tác đầu tiên của người dùng
    const unlockAudio = () => window.SFX && window.SFX.unlock();
    ['pointerdown', 'keydown'].forEach(evt => window.addEventListener(evt, unlockAudio, { once: true, passive: true }));

    // ---------- Ba chặng ----------
    // Trình xem 3D (#app) dùng chung: chặng 1 trình lắp ráp, chặng 2 xưởng sáng tạo, chặng 3 sa bàn.
    const STAGES = { assembly: 'stage-assembly', creative: 'stage-creative', sim: 'stage-sim' };
    let current = 'assembly';
    function go(stage, focusTab) {
      if (!STAGES[stage]) return;
      current = stage;
      document.querySelectorAll('.stage-tab').forEach(tab => {
        const on = tab.dataset.stage === stage;
        tab.setAttribute('aria-selected', String(on));
        tab.tabIndex = on ? 0 : -1;
        if (on && focusTab) tab.focus();
      });
      for (const [key, id] of Object.entries(STAGES)) {
        $(id).hidden = key !== stage;
        $(id).classList.toggle('is-active', key === stage);
      }
      if (stage === 'sim') {
        window.ZMCreative?.close();
        window.ZMScene?.enter();
        simEngine.resumeLoop();
      } else {
        simEngine.pauseLoop();
        window.ZMScene?.leave();
        if (stage === 'creative') window.ZMCreative?.open();
        else window.ZMCreative?.close();
      }
      window.dispatchEvent(new Event('resize'));
      try {
        localStorage.setItem(L.store + 'stage', stage);
      } catch (e) {}
    }
    window.ZMStages = { go, current: () => current };
    const tabs = [...document.querySelectorAll('.stage-tab')];
    tabs.forEach((tab, i) => {
      tab.addEventListener('click', () => {
        if (window.SFX) window.SFX.click();
        go(tab.dataset.stage);
      });
      // Mũi tên trái/phải chuyển chặng (mẫu tablist)
      tab.addEventListener('keydown', e => {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
        e.preventDefault();
        const next = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
        go(next.dataset.stage, true);
      });
    });
    let saved = 'assembly';
    try {
      saved = localStorage.getItem(L.store + 'stage') || 'assembly';
    } catch (e) {}
    go(STAGES[saved] ? saved : 'assembly');

    // ---------- Chặng 1: đồng hồ đo + hình sách theo bước đang xem ----------
    window.addEventListener('zm:step', e => {
      const d = e.detail;
      $('am-step').innerHTML = `${d.step}<small>/ ${d.total}</small>`;
      $('am-step-s').textContent = d.group ? `${d.group[0].toUpperCase() + d.group.slice(1)} ${d.sub}/${d.subCount}` : d.joins ? 'Ghép cụm' : L.baseName;
      $('am-added').textContent = d.added;
      $('am-visible').innerHTML = `${d.visible}<small>/ ${d.parts}</small>`;
      $('am-done').innerHTML = `${d.done}<small>/ ${d.total}</small>`;
      $('am-done-bar').style.width = (100 * d.done) / d.total + '%';
      const b = L.book(d);
      $('book-img').src = b.src;
      $('book-img').alt = b.alt;
      $('book-loc').textContent = b.loc;
      $('book-cap').textContent = b.cap;
      $('book-pdf').href = b.pdf;
    });

    // ---------- Chế độ Bé / Nâng cao (mặc định Bé: ít chữ, không số đo) ----------
    const btnMode = $('btn-mode');
    function applyMode(mode) {
      document.documentElement.dataset.mode = mode;
      btnMode.textContent = mode === 'kid' ? 'Chế độ: Bé' : 'Chế độ: Nâng cao';
      // Nâng cao (cấp 2–3): thiên thạch bay qua theo chu kỳ, vật lạ, chụp ảnh gửi về trạm (NV5, NV6)
      if (simEngine.setAdvanced) simEngine.setAdvanced(mode === 'pro');
      missionTracker.updateChips();
      updateMissionCard();
      try {
        localStorage.setItem(L.store + 'mode', mode);
      } catch (e) {}
    }
    let uiMode = 'kid';
    try {
      uiMode = localStorage.getItem(L.store + 'mode') || 'kid';
    } catch (e) {}
    applyMode(uiMode);
    btnMode.addEventListener('click', () => {
      applyMode(document.documentElement.dataset.mode === 'kid' ? 'pro' : 'kid');
      window.dispatchEvent(new Event('resize'));
      if (window.SFX) window.SFX.click();
    });

    // ---------- Giao diện sáng/tối (mặc định sáng) ----------
    const btnTheme = $('btn-toggle-theme');
    function applyTheme(theme) {
      document.documentElement.setAttribute('data-theme', theme);
      btnTheme.textContent = theme === 'dark' ? 'Giao diện sáng' : 'Giao diện tối';
      try {
        localStorage.setItem('zm_theme', theme);
      } catch (e) {}
    }
    let theme = 'light';
    try {
      theme = localStorage.getItem('zm_theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    } catch (e) {}
    applyTheme(theme);
    btnTheme.addEventListener('click', () => {
      applyTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
      if (window.SFX) window.SFX.click();
    });

    // ---------- Âm thanh ----------
    const btnSound = $('btn-toggle-sound');
    btnSound.addEventListener('click', () => {
      const on = window.SFX.toggle();
      btnSound.textContent = on ? 'Âm thanh: bật' : 'Âm thanh: tắt';
      btnSound.setAttribute('aria-pressed', String(on));
    });

    // ---------- Hộp thoại ----------
    function openModal(id, focusId) {
      $(id).classList.add('is-open');
      setTimeout(() => $(focusId)?.focus(), 30);
    }
    const closeModal = id => $(id).classList.remove('is-open');
    document.addEventListener('keydown', e => {
      if (e.key !== 'Escape') return;
      document.querySelectorAll('.modal.is-open').forEach(m => m.classList.remove('is-open'));
    });
    document.querySelectorAll('.modal').forEach(m =>
      m.addEventListener('click', e => e.target === m && m.classList.remove('is-open'))
    );

    function updateStudentBadge() {
      const name = localStorage.getItem('zm_student_name') || '';
      const cls = localStorage.getItem('zm_student_class') || '';
      $('header-student-label').textContent = name ? `${name}${cls ? ' · ' + cls : ''}` : 'Nhập tên học sinh';
    }
    $('btn-student-profile').addEventListener('click', () => openModal('profile-modal', 'student-name-input'));
    $('btn-close-profile').addEventListener('click', () => {
      closeModal('profile-modal');
      updateStudentBadge();
    });
    updateStudentBadge();

    $('btn-teacher-settings').addEventListener('click', () => {
      $('teacher-webhook-input').value = localStorage.getItem('zm_teacher_webhook') || '';
      openModal('teacher-modal', 'teacher-webhook-input');
    });
    $('btn-close-teacher').addEventListener('click', () => closeModal('teacher-modal'));
    $('btn-save-webhook').addEventListener('click', () => {
      const val = $('teacher-webhook-input').value.trim();
      localStorage.setItem('zm_teacher_webhook', val);
      missionTracker.webhookUrl = val;
      closeModal('teacher-modal');
    });

    $('btn-submit-sheets').addEventListener('click', () => missionTracker.submitToGoogleSheets());
    $('btn-close-victory').addEventListener('click', () => $('victory-modal').classList.remove('is-open'));
  });
})();
