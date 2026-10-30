// js/app.js - Main Application Orchestrator for ZMrobo Virtual Lab
(function() {
  'use strict';

  document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Audio SFX
    if (window.SFX) window.SFX.init();

    // 2. Initialize Mission Tracker
    const missionTracker = new window.MissionTracker();
    missionTracker.init();

    // 3. Initialize Simulation Engine
    const simEngine = new window.SimulationEngine('sim-canvas-2d');
    simEngine.init();
    window.simEngine = simEngine; // xưởng sáng tạo gửi các gói nâng cấp sang sa bàn
    // Tab 2 mở sẵn khi vào trang: đặt trình xem 3D vào sa bàn
    if (document.getElementById('tab-simulation')?.classList.contains('is-active')) window.ZMSandbox?.open();

    // 4. Initialize Block Programming Engine
    const blockEngine = new window.BlockEngine('program-canvas-chain', 'block-toolbox');
    blockEngine.init();

    // Connect BlockEngine changes to SimulationEngine
    blockEngine.setOnChange((blocks) => {
      simEngine.setProgram(blocks);
      simEngine.checkMissions();
    });

    // Initial program sync
    simEngine.setProgram(blockEngine.blocks);

    // Connect Simulation active block highlight to BlockEngine
    simEngine.onActiveBlockUpdate = (blockIdx) => {
      blockEngine.setActiveBlock(blockIdx);
    };

    // Connect Simulation mission triggers to MissionTracker
    simEngine.onMissionUpdate = (state) => {
      missionTracker.update(state);
    };
    // NV1: tiến độ "Đã lắp xong bước này" của trình xem 3D (đủ 28/28 bước)
    window.addEventListener('zm:assembly-progress', e => {
      simEngine.setAssemblyDone(e.detail.done >= e.detail.total);
    });
    simEngine.checkMissions();

    // 6. Action Buttons in Coding Toolbar
    const btnRun = document.getElementById('btn-run-program');
    const btnStop = document.getElementById('btn-stop-program');
    const btnSample = document.getElementById('btn-load-sample');
    const btnClear = document.getElementById('btn-clear-code');

    if (btnRun) {
      btnRun.addEventListener('click', () => {
        simEngine.start();
      });
    }
    if (btnStop) {
      btnStop.addEventListener('click', () => {
        simEngine.stop();
      });
    }
    if (btnSample) {
      btnSample.addEventListener('click', () => {
        if (confirm('Nạp lại chương trình gốc trong tài liệu?')) {
          blockEngine.loadDefaultProgram();
        }
      });
    }
    if (btnClear) {
      btnClear.addEventListener('click', () => {
        if (confirm('Xóa hết các khối lệnh để tự lập trình lại từ đầu?')) {
          blockEngine.clearProgram();
        }
      });
    }

    // Global User Interaction Listener to unlock AudioContext on iOS/Android
    const unlockAudio = () => {
      if (window.SFX) window.SFX.unlock();
      ['pointerdown', 'touchstart', 'keydown', 'click'].forEach(evt => {
        window.removeEventListener(evt, unlockAudio);
      });
    };
    ['pointerdown', 'touchstart', 'keydown', 'click'].forEach(evt => {
      window.addEventListener(evt, unlockAudio, { once: true, passive: true });
    });

    // 7. Tab Switching: Assembly vs Coding/Sim
    const tabBtns = document.querySelectorAll('.nav-tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');

    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.dataset.tab;
        tabBtns.forEach(b => b.classList.remove('is-active'));
        tabPanes.forEach(p => p.classList.remove('is-active'));

        btn.classList.add('is-active');
        const targetPane = document.getElementById(targetId);
        if (targetPane) targetPane.classList.add('is-active');

        if (window.SFX) window.SFX.click();

        // Trình xem 3D dùng chung: ở Tab 2 là sa bàn, ở Tab 1 là trình lắp ráp / xưởng sáng tạo.
        // Dừng vòng mô phỏng khi rời Tab 2 để tiết kiệm pin/GPU.
        if (targetId === 'tab-simulation') {
          window.ZMCreative?.close();
          window.ZMSandbox?.open();
          simEngine.resumeLoop();
          simEngine.resizeCanvas();
        } else if (targetId === 'tab-assembly') {
          simEngine.pauseLoop();
          window.ZMSandbox?.close();
          if (document.getElementById('subview-creative')?.classList.contains('active')) window.ZMCreative?.open();
          window.dispatchEvent(new Event('resize'));
        }
      });
    });

    // 7b. Theme Switcher (Light / Dark)
    const btnTheme = document.getElementById('btn-toggle-theme');
    function applyTheme(theme) {
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('zm_theme', theme);
      const iconEl = btnTheme ? btnTheme.querySelector('.theme-icon') : null;
      const labelEl = btnTheme ? btnTheme.querySelector('.theme-label') : null;
      if (theme === 'light') {
        if (iconEl) iconEl.textContent = '☀️';
        if (labelEl) labelEl.textContent = 'Sáng';
        if (btnTheme) btnTheme.title = 'Chế độ hiện tại: Sáng (Bấm để chuyển Tối)';
      } else {
        if (iconEl) iconEl.textContent = '🌙';
        if (labelEl) labelEl.textContent = 'Tối';
        if (btnTheme) btnTheme.title = 'Chế độ hiện tại: Tối (Bấm để chuyển Sáng)';
      }
    }
    const savedTheme = localStorage.getItem('zm_theme') || 'dark';
    applyTheme(savedTheme);

    if (btnTheme) {
      btnTheme.addEventListener('click', () => {
        const curTheme = document.documentElement.getAttribute('data-theme') || 'dark';
        const nextTheme = curTheme === 'dark' ? 'light' : 'dark';
        applyTheme(nextTheme);
        if (window.SFX) window.SFX.click();
      });
    }

    // 7c. Official textbook guide first; CAD is a separate interpretation.
    const subtabViews = new Map([
      ['official', ['btn-subtab-official', 'subview-official']],
      ['base', ['btn-subtab-base', 'subview-base']],
      ['creative', ['btn-subtab-creative', 'subview-creative']],
    ]);

    function switchSubtab(tab) {
      if (!subtabViews.has(tab)) return;
      subtabViews.forEach(([buttonId, paneId], key) => {
        const active = tab === key;
        const button = document.getElementById(buttonId);
        const pane = document.getElementById(paneId);
        if (button) {
          button.classList.toggle('active', active);
          button.setAttribute('aria-pressed', String(active));
        }
        if (pane) pane.classList.toggle('active', active);
      });
      // Xưởng sáng tạo dùng chung trình xem 3D: chuyển khung 3D sang xưởng khi mở, trả về khi rời
      if (tab === 'creative') window.ZMCreative?.open();
      else window.ZMCreative?.close();
      if (tab === 'base' || tab === 'creative') window.dispatchEvent(new Event('resize'));
      if (window.SFX) window.SFX.click();
    }

    window.switchAssemblySubtab = switchSubtab;
    subtabViews.forEach(([buttonId], key) => {
      document.getElementById(buttonId)?.addEventListener('click', () => switchSubtab(key));
    });

    // 8. Sound Toggle Button
    const btnSound = document.getElementById('btn-toggle-sound');
    if (btnSound) {
      btnSound.addEventListener('click', () => {
        const on = window.SFX.toggle();
        const iconEl = btnSound.querySelector('.sound-icon');
        const labelEl = btnSound.querySelector('.sound-label');
        if (iconEl) iconEl.textContent = on ? '🔊' : '🔇';
        if (labelEl) labelEl.textContent = on ? 'Âm thanh: Bật' : 'Âm thanh: Tắt';
        if (!iconEl && !labelEl) {
          btnSound.textContent = on ? '🔊 Âm thanh: Bật' : '🔇 Âm thanh: Tắt';
        }
        btnSound.setAttribute('aria-pressed', String(on));
        btnSound.title = on ? 'Âm thanh: Bật' : 'Âm thanh: Tắt';
      });
    }

    // 9. Student Profile Modal
    const studentBtn = document.getElementById('btn-student-profile');
    const profileModal = document.getElementById('profile-modal');
    const closeProfileBtn = document.getElementById('btn-close-profile');

    if (studentBtn && profileModal) {
      studentBtn.addEventListener('click', () => {
        profileModal.classList.add('is-open');
      });
    }
    if (closeProfileBtn && profileModal) {
      closeProfileBtn.addEventListener('click', () => {
        profileModal.classList.remove('is-open');
        updateStudentBadge();
      });
    }

    function updateStudentBadge() {
      const name = localStorage.getItem('zm_student_name') || '';
      const cls = localStorage.getItem('zm_student_class') || '';
      const text = name ? `👤 ${name}${cls ? ' (' + cls + ')' : ''}` : '👤 Nhập tên học sinh';
      const lbl = document.getElementById('header-student-label');
      if (lbl) {
        lbl.textContent = text;
      } else if (studentBtn) {
        studentBtn.textContent = text;
      }
      if (studentBtn) {
        studentBtn.title = name ? `Học sinh: ${name} (${cls || 'Chưa ghi lớp'})` : 'Cập nhật thông tin học sinh';
      }
    }
    updateStudentBadge();

    // 10. Teacher Settings Modal (Google Sheets Webhook URL)
    const teacherBtn = document.getElementById('btn-teacher-settings');
    const teacherModal = document.getElementById('teacher-modal');
    const closeTeacherBtn = document.getElementById('btn-close-teacher');
    const webhookInput = document.getElementById('teacher-webhook-input');
    const saveWebhookBtn = document.getElementById('btn-save-webhook');

    if (teacherBtn && teacherModal) {
      teacherBtn.addEventListener('click', () => {
        if (webhookInput) {
          webhookInput.value = localStorage.getItem('zm_teacher_webhook') || '';
        }
        teacherModal.classList.add('is-open');
      });
    }
    if (closeTeacherBtn && teacherModal) {
      closeTeacherBtn.addEventListener('click', () => {
        teacherModal.classList.remove('is-open');
      });
    }
    if (saveWebhookBtn && webhookInput) {
      saveWebhookBtn.addEventListener('click', () => {
        const val = webhookInput.value.trim();
        localStorage.setItem('zm_teacher_webhook', val);
        missionTracker.webhookUrl = val;
        alert('Đã lưu cấu hình Google Sheets Webhook!');
        teacherModal.classList.remove('is-open');
      });
    }

    // 11. Victory Modal Submit Button
    const btnSubmitSheets = document.getElementById('btn-submit-sheets');
    const btnCloseVictory = document.getElementById('btn-close-victory');
    const victoryModal = document.getElementById('victory-modal');

    if (btnSubmitSheets) {
      btnSubmitSheets.addEventListener('click', () => {
        missionTracker.submitToGoogleSheets();
      });
    }
    if (btnCloseVictory && victoryModal) {
      btnCloseVictory.addEventListener('click', () => {
        victoryModal.classList.remove('is-open');
      });
    }

    // Start simulation initially
    simEngine.start();
  });
})();
