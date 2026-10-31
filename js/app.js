// js/app.js – ghép các phần của phòng lab Bài 9: ba chặng (lắp ráp, sáng tạo, lập trình & thử),
// giao diện sáng/tối, âm thanh, hộp thoại học sinh/giáo viên, hình sách và đồng hồ đo của chặng lắp ráp.
(function () {
  'use strict';

  const $ = id => document.getElementById(id);
  // Hình in từng bước của sách (bản PDF này lược bước 20 – chỉ đổi góc nhìn, dùng hình bước 19)
  const BOOK_PAGES = { 1: 2, 2: 2, 3: 3, 4: 3, 5: 4, 6: 4, 7: 5, 8: 5, 9: 6, 10: 7, 11: 7, 12: 8, 13: 8, 14: 9,
    15: 9, 16: 10, 17: 10, 18: 11, 19: 11, 20: 11, 21: 12, 22: 12, 23: 13, 24: 13, 25: 14, 26: 14, 27: 15, 28: 15 };

  document.addEventListener('DOMContentLoaded', () => {
    if (window.SFX) window.SFX.init();

    const missionTracker = new window.MissionTracker();
    missionTracker.init();

    const simEngine = new window.SimulationEngine('sim-canvas-2d');
    simEngine.init();
    window.simEngine = simEngine; // xưởng sáng tạo gửi gói nâng cấp sang sa bàn

    const blockEngine = new window.BlockEngine('program-canvas-chain', 'block-toolbox');
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
    const CARDS = {
      m2: { n: 2, title: 'Ghép khối giống hàng mẫu', text: 'Đặt các khối giống hàng mẫu mờ, rồi chạm khối Start màu vàng.' },
      m3: { n: 3, title: 'Tránh đám đá thiên thạch', text: 'Trước khi vệ tinh tới đám đá, hãy cho vệ tinh quay ngược lại hoặc dừng lại. Gợi ý: Motor Power mức 4 → Melody B → Stop.' },
      m4: { n: 4, title: 'Thử vệ tinh sáng tạo', text: 'Gắn thêm chi tiết ở chặng Sáng tạo, rồi quay lại chạy chương trình.', go: ['creative', 'Đến xưởng sáng tạo'] },
      m1: { n: 1, title: 'Lắp xong vệ tinh', text: 'Bấm “Đã lắp xong bước này” ở cả 28 bước của chặng Lắp ráp.', go: ['assembly', 'Đến chặng lắp ráp'] }
    };
    function updateMissionCard() {
      const m = missionTracker.missions;
      const key = ['m2', 'm3', 'm4', 'm1'].find(k => !m[k]);
      const card = key ? CARDS[key] : { n: '✓', title: 'Xong cả 4 nhiệm vụ!', text: 'Em có thể tự sáng tạo chương trình mới cho vệ tinh.' };
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
        localStorage.setItem('zm9_stage', stage);
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
      saved = localStorage.getItem('zm9_stage') || 'assembly';
    } catch (e) {}
    go(STAGES[saved] ? saved : 'assembly');

    // ---------- Chặng 1: đồng hồ đo + hình sách theo bước đang xem ----------
    window.addEventListener('zm:step', e => {
      const d = e.detail;
      $('am-step').innerHTML = `${d.step}<small>/ ${d.total}</small>`;
      $('am-step-s').textContent = d.group ? `${d.group[0].toUpperCase() + d.group.slice(1)} ${d.sub}/${d.subCount}` : d.joins ? 'Ghép cụm' : 'Thân vệ tinh';
      $('am-added').textContent = d.added;
      $('am-visible').innerHTML = `${d.visible}<small>/ ${d.parts}</small>`;
      $('am-done').innerHTML = `${d.done}<small>/ ${d.total}</small>`;
      $('am-done-bar').style.width = (100 * d.done) / d.total + '%';
      const shown = d.page === 20 ? 19 : d.page;
      $('book-img').src = `assets/official-assembly/step-${String(shown).padStart(2, '0')}.jpg`;
      $('book-img').alt = `Hình bước ${shown} trong sách hướng dẫn lắp ráp`;
      $('book-loc').textContent = `Bước ${d.page} · trang ${BOOK_PAGES[d.page]}`;
      $('book-cap').textContent =
        d.page === 20
          ? 'Bước 20 chỉ xoay mô hình sang góc khác, không thêm linh kiện – sách in gộp với bước 19.'
          : 'Ô nền xanh là linh kiện cần lấy, viền đỏ là chỗ lắp.';
      $('book-pdf').href = `references/official/Bai9_Thong_tin_lien_lac_vu_tru.pdf#page=${BOOK_PAGES[d.page]}`;
    });

    // ---------- Chế độ Bé / Nâng cao (mặc định Bé: ít chữ, không số đo) ----------
    const btnMode = $('btn-mode');
    function applyMode(mode) {
      document.documentElement.dataset.mode = mode;
      btnMode.textContent = mode === 'kid' ? 'Chế độ: Bé' : 'Chế độ: Nâng cao';
      try {
        localStorage.setItem('zm9_mode', mode);
      } catch (e) {}
    }
    let uiMode = 'kid';
    try {
      uiMode = localStorage.getItem('zm9_mode') || 'kid';
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
