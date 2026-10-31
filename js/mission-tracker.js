// js/mission-tracker.js - Mission Auto-Grading & Google Sheets Reporting
(function() {
  'use strict';

  class MissionTracker {
    constructor() {
      // 4 nhiệm vụ theo phiếu học tập Bài 9
      this.missions = {
        m1: false, // Lắp xong 28 bước (tab Hướng dẫn lắp ráp)
        m2: false, // Lập trình đúng chương trình mẫu và chạy hết một vòng lặp
        m3: false, // Né thiên thạch thành công khi chạy mô phỏng
        m4: false // Gắn gói nâng cấp sáng tạo và chạy trên sa bàn
      };
      this.upgrades = [];
      this.allCompleted = false;
      this.avoidanceMethod = null;
      this.wholeRevolutions = false;
      this.studentName = localStorage.getItem('zm_student_name') || '';
      this.studentClass = localStorage.getItem('zm_student_class') || '';
      this.webhookUrl = localStorage.getItem('zm_teacher_webhook') || '';
    }

    init() {
      this.updateChips();
      this.bindInputs();
    }

    bindInputs() {
      const nameInput = document.getElementById('student-name-input');
      const classInput = document.getElementById('student-class-input');
      if (nameInput) {
        nameInput.value = this.studentName;
        nameInput.addEventListener('input', (e) => {
          this.studentName = e.target.value.trim();
          localStorage.setItem('zm_student_name', this.studentName);
        });
      }
      if (classInput) {
        classInput.value = this.studentClass;
        classInput.addEventListener('input', (e) => {
          this.studentClass = e.target.value.trim();
          localStorage.setItem('zm_student_class', this.studentClass);
        });
      }
    }

    update(state) {
      const keys = Object.keys(this.missions);
      const newlyDone = keys.some(k => !this.missions[k] && state[k]);
      // NV2–4 đã đạt thì giữ trong phiên làm bài (học sinh làm lần lượt, mỗi nhiệm vụ một chương trình);
      // NV1 theo tiến độ lắp hiện tại (bỏ đánh dấu bước thì mất)
      for (const k of keys) this.missions[k] = k === 'm1' ? !!state[k] : this.missions[k] || !!state[k];
      if (state.m3) this.avoidanceMethod = state.avoidanceMethod || this.avoidanceMethod;
      this.wholeRevolutions = !!state.wholeRevolutions;
      if (state.upgrades && state.upgrades.length) this.upgrades = state.upgrades;

      if (newlyDone && window.SFX) window.SFX.ding();

      this.updateChips();

      const done = keys.every(k => this.missions[k]);
      if (done && !this.allCompleted) {
        this.allCompleted = true;
        this.showVictory();
      } else if (!done) {
        this.allCompleted = false;
      }
    }

    updateChips() {
      const keys = Object.keys(this.missions);
      for (const k of keys) document.getElementById('chip-' + k)?.classList.toggle('is-done', this.missions[k]);
      const count = keys.filter(k => this.missions[k]).length,
        total = keys.length;
      const summary = document.getElementById('mission-summary-badge');
      if (summary) {
        summary.textContent = count === total ? `Đạt ${total}/${total} nhiệm vụ` : `${count}/${total} nhiệm vụ`;
        summary.className = count === total ? 'mission-badge badge-all-done' : 'mission-badge';
      }
    }

    showVictory() {
      if (window.SFX) window.SFX.fanfare();
      const modal = document.getElementById('victory-modal');
      if (modal) {
        modal.classList.add('is-open');
      }

      // Generate verification code
      const codeEl = document.getElementById('verify-code-output');
      if (codeEl) {
        const codeSafe = value => value.toUpperCase().replace(/Đ/g, 'D')
          .normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Z0-9]/g, '');
        const student = codeSafe(this.studentName || 'HOCSINH').slice(0, 24);
        const cls = codeSafe(this.studentClass || 'LOP').slice(0, 12);
        const rand = Math.floor(1000 + Math.random() * 9000);
        const code = `ZM9-${cls}-${student}-${rand}`;
        codeEl.textContent = code;
      }
    }

    async submitToGoogleSheets() {
      const btn = document.getElementById('btn-submit-sheets');
      const statusText = document.getElementById('submit-status-msg');

      if (!this.allCompleted || !Object.values(this.missions).every(Boolean)) {
        if (statusText) statusText.textContent = 'Em cần hoàn thành đủ 4 nhiệm vụ trước khi nộp bài.';
        return;
      }

      if (!this.studentName) {
        alert('Em hãy nhập Họ và Tên trước khi nộp bài nhé!');
        document.getElementById('student-name-input')?.focus();
        return;
      }

      const payload = {
        timestamp: new Date().toLocaleString('vi-VN'),
        name: this.studentName,
        className: this.studentClass || 'Chưa điền',
        lesson: 'Bài 9: Thông tin liên lạc vũ trụ',
        score: `${Object.values(this.missions).filter(Boolean).length}/4`,
        assemblyDone: this.missions.m1,
        sampleProgram: this.missions.m2,
        asteroidAvoided: this.missions.m3,
        avoidanceMethod: this.avoidanceMethod,
        upgrades: this.upgrades.join(', '),
        verificationCode: document.getElementById('verify-code-output')?.textContent || ''
      };

      if (!this.webhookUrl) {
        if (statusText) statusText.textContent =
          'Chưa cấu hình địa chỉ nhận bài của giáo viên. Em hãy chụp màn hình kết quả và mã tham chiếu để gửi Thầy/Cô.';
        return;
      }

      try {
        if (btn) btn.disabled = true;
        if (statusText) statusText.textContent = 'Đang gửi kết quả về Google Sheets của Thầy/Cô...';

        await fetch(this.webhookUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(payload)
        });

        if (statusText) statusText.textContent =
          'Đã gửi yêu cầu nộp bài. Trình duyệt không xác nhận được Google Sheets đã ghi nhận; em nên lưu mã tham chiếu và nhờ Thầy/Cô kiểm tra.';
        if (btn) btn.textContent = '↗ Đã gửi yêu cầu';
      } catch (err) {
        if (statusText) statusText.textContent =
          'Không gửi được yêu cầu. Em hãy chụp màn hình mã tham chiếu và báo cho Thầy/Cô.';
      } finally {
        if (btn) btn.disabled = false;
      }
    }
  }

  window.MissionTracker = MissionTracker;
})();
