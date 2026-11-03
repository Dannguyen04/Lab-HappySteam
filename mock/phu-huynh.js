/* ==========================================================================
   Phiếu 73b – Logic & Dữ liệu mẫu Phụ huynh (S-09, S-10, S-11)
   Lưu trạng thái vào localStorage với khoá mock.*
   Không dùng framework, không gọi mạng, không dùng emoji trang trí.
   ========================================================================== */
(function () {
  'use strict';

  // 28 học sinh Lớp 1A2, mỗi em một con vật đại diện không trùng, mã mời 8 ký tự (bỏ 0/O, 1/I/l)
  const STUDENT_LESSONS = MockData.parentLessons;
  let PROJECT_TEAM_DATA = MockAPI.projectTeam();
  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[char]);
  }
  function getAnimalSvg(animalKey) {
    const palettes = {
      lion: { bg: '#fff3d6', fg: '#b85d00' },
      panda: { bg: '#eef2f6', fg: '#1f2d3a' },
      koala: { bg: '#e8eef5', fg: '#43586e' },
      fox: { bg: '#ffe8dc', fg: '#c44512' },
      rabbit: { bg: '#fce8f3', fg: '#a82b6e' },
      bear: { bg: '#f5e8dc', fg: '#6e3f19' },
      monkey: { bg: '#faebd7', fg: '#80461b' },
      dolphin: { bg: '#dff0f8', fg: '#006899' },
      frog: { bg: '#e1f3e8', fg: '#1c7a43' },
      turtle: { bg: '#dff2e6', fg: '#146939' }
    };
    const pal = palettes[animalKey] || { bg: '#e3eff7', fg: '#005f8a' };

    return `<svg viewBox="0 0 36 36" aria-hidden="true" focusable="false">
      <rect x="2" y="2" width="32" height="32" rx="9" fill="${pal.bg}" />
      <circle cx="11" cy="11" r="4" fill="${pal.fg}" opacity="0.25" />
      <circle cx="25" cy="11" r="4" fill="${pal.fg}" opacity="0.25" />
      <circle cx="18" cy="19" r="9.5" fill="none" stroke="${pal.fg}" stroke-width="2.2" />
      <circle cx="14.5" cy="17.5" r="1.6" fill="${pal.fg}" />
      <circle cx="21.5" cy="17.5" r="1.6" fill="${pal.fg}" />
      <path d="M15 22.2 Q18 24.6 21 22.2" fill="none" stroke="${pal.fg}" stroke-width="2" stroke-linecap="round" />
    </svg>`;
  }

  function loadStudents() { return MockAPI.read('parentProfiles'); }
  function saveStudents(students) { MockAPI.write('parentProfiles', students); }
  function loadState() { return MockAPI.read('parent'); }
  function saveState(state) { MockAPI.write('parent', state); }
  function generateCleanInviteCode() {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let out = '';
    for (let i = 0; i < 8; i++) {
      out += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return out;
  }

  function getLessonsForStudent(student) { return MockAPI.lessonsForStudent(student.id); }
  function gradeLabel(grade) {
    if (grade === 'HTT') return 'HTT · Hoàn thành tốt';
    if (grade === 'HT') return 'HT · Hoàn thành';
    if (grade === 'CHT') return 'CHT · Chưa hoàn thành';
    return 'Chưa chấm';
  }

  /* ==========================================================================
     KHỞI TẠO MÀN HÌNH S-09: PHIẾU MỜI IN A4 (mock/phieu-moi.html)
     ========================================================================== */
  function initPhieuMoiPage() {
    const sheetsRoot = document.getElementById('pm-sheets-root');
    if (!sheetsRoot) return;

    let students = loadStudents();
    let filterStatus = 'all';
    let searchQuery = '';

    const searchInput = document.getElementById('pm-search-input');
    const filterSelect = document.getElementById('pm-filter-select');
    const btnPrint = document.getElementById('pm-btn-print');
    const btnReset = document.getElementById('pm-btn-reset');
    const toastBox = document.getElementById('pm-toast');
    const toastText = document.getElementById('pm-toast-text');

    function showToast(msg, kind) {
      if (!toastBox || !toastText) return;
      toastText.textContent = msg;
      toastBox.setAttribute('data-kind', kind || 'ok');
      toastBox.hidden = false;
    }

    function renderSheets() {
      students = loadStudents();
      const filtered = students.filter(s => {
        if (filterStatus === 'linked' && s.linkedCount === 0) return false;
        if (filterStatus === 'unlinked' && (s.linkedCount > 0 || s.status === 'revoked')) return false;
        if (filterStatus === 'no-consent' && s.hasConsent) return false;
        if (filterStatus === 'revoked' && s.status !== 'revoked') return false;
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          const matchName = s.shortName.toLowerCase().includes(q) || (s.fullName && s.fullName.toLowerCase().includes(q));
          const matchAnimal = s.animal.toLowerCase().includes(q);
          const matchCode = s.code.toLowerCase().includes(q);
          if (!matchName && !matchAnimal && !matchCode) return false;
        }
        return true;
      });

      // Cập nhật bộ đếm
      const countEl = document.getElementById('pm-count-summary');
      if (countEl) {
        const consentedCount = students.filter(s => s.hasConsent).length;
        const revokedCount = students.filter(s => s.status === 'revoked').length;
        countEl.textContent = `Hiển thị ${filtered.length}/${students.length} phiếu · Đã đồng ý dữ liệu: ${consentedCount}/28 · Thu hồi: ${revokedCount}`;
      }

      sheetsRoot.innerHTML = '';
      if (filtered.length === 0) {
        sheetsRoot.innerHTML = `<div class="ph-card" style="max-width:820px; width:100%; text-align:center;">Không tìm thấy phiếu mời phù hợp với bộ lọc hiện tại.</div>`;
        return;
      }

      // Chia mỗi tờ A4 tối đa 8 ô cắt (2 cột x 4 hàng) để in vừa vặn trên khổ A4
      const SLIPS_PER_PAGE = 8;
      const totalPages = Math.ceil(filtered.length / SLIPS_PER_PAGE);

      for (let pageIdx = 0; pageIdx < totalPages; pageIdx++) {
        const slice = filtered.slice(pageIdx * SLIPS_PER_PAGE, (pageIdx + 1) * SLIPS_PER_PAGE);
        const sheet = document.createElement('section');
        sheet.className = 'a4-sheet';
        sheet.setAttribute('aria-label', `Tờ in A4 số ${pageIdx + 1}`);

        const head = document.createElement('div');
        head.className = 'a4-sheet-head';
        head.innerHTML = `
          <div><strong>PHIẾU MỜI PHỤ HUYNH · LỚP 1A2 (2026–2027)</strong> · GV chủ lớp: Cô Nguyễn Thu Hà</div>
          <div>Tờ ${pageIdx + 1} / ${totalPages} (${slice.length} phiếu) · Cắt theo đường nét đứt</div>
        `;
        sheet.appendChild(head);

        const grid = document.createElement('div');
        grid.className = 'slips-grid';

        slice.forEach(st => {
          const isRevoked = st.status === 'revoked';
          const article = document.createElement('article');
          article.className = 'invite-slip' + (isRevoked ? ' is-revoked' : '');

          const consentText = st.hasConsent
            ? `Đã đồng ý (${st.linkedCount}/2 PH)`
            : `Chưa có đồng ý (${st.linkedCount}/2 PH)`;

          article.innerHTML = `
            <span class="slip-cut-label">Đường cắt phiếu #${String(st.id).padStart(2, '0')}</span>
            <div class="slip-top">
              <span class="slip-school">Happy STEAM Lab · Lớp 1A2</span>
              <span class="slip-num">HS #${String(st.id).padStart(2, '0')} · ${isRevoked ? 'ĐÃ THU HỒI' : consentText}</span>
            </div>
            <div class="slip-main">
              <div>
                <div class="slip-student">
                  <span class="animal-avatar">${getAnimalSvg(st.animalKey)}</span>
                  <div>
                    <div class="slip-student-name">${st.shortName}</div>
                    <div class="slip-animal-label">Hình đại diện: <strong>${st.animal}</strong></div>
                  </div>
                </div>
                <div class="slip-code-box">
                  <span>MÃ MỜI:</span>
                  <code>${isRevoked ? 'ĐÃ THU HỒI' : st.code}</code>
                </div>
              </div>
              <div class="qr-placeholder" aria-label="Ô đặt mã QR">
                <span class="qr-corner-bl"></span>
                <span class="qr-label">QR</span>
              </div>
            </div>
            <p class="slip-instructions">
              Quý Phụ huynh quét mã QR hoặc mở trang Phụ huynh, nhập mã mời <strong>${st.code}</strong> để xem kết quả học tập và cho con học ở nhà (tối đa 2 phụ huynh/em).
            </p>
            <div class="slip-screen-actions no-print">
              <a class="ph-btn ph-btn-sm ph-btn-primary" href="phu-huynh.html?code=${encodeURIComponent(st.code)}">
                Dùng thử mã này →
              </a>
              <div style="display:flex; gap:6px;">
                <button type="button" class="ph-btn ph-btn-sm" data-action="regen" data-id="${st.id}">
                  Đổi mã mới
                </button>
                <button type="button" class="ph-btn ph-btn-sm ${isRevoked ? 'ph-btn-ok' : 'ph-btn-danger'}" data-action="toggle-revoke" data-id="${st.id}">
                  ${isRevoked ? 'Khôi phục' : 'Thu hồi'}
                </button>
              </div>
            </div>
          `;
          grid.appendChild(article);
        });

        sheet.appendChild(grid);
        sheetsRoot.appendChild(sheet);
      }
    }

    sheetsRoot.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-action]');
      if (!btn) return;
      const id = Number(btn.getAttribute('data-id'));
      const action = btn.getAttribute('data-action');
      const idx = students.findIndex(s => s.id === id);
      if (idx === -1) return;

      if (action === 'toggle-revoke') {
        students[idx].status = students[idx].status === 'revoked' ? 'active' : 'revoked';
        saveStudents(students);
        renderSheets();
        const st = students[idx];
        showToast(
          st.status === 'revoked'
            ? `Đã thu hồi mã mời ${st.code} của em ${st.shortName} (BR-PH-01).`
            : `Đã khôi phục hiệu lực mã mời ${st.code} của em ${st.shortName}.`,
          st.status === 'revoked' ? 'warn' : 'ok'
        );
      } else if (action === 'regen') {
        const oldCode = students[idx].code;
        students[idx].code = generateCleanInviteCode();
        students[idx].status = 'active';
        saveStudents(students);
        renderSheets();
        showToast(`Đã cấp mã mời mới ${students[idx].code} (thay cho ${oldCode}) cho em ${students[idx].shortName}.`, 'ok');
      }
    });

    if (searchInput) {
      searchInput.addEventListener('input', () => {
        searchQuery = searchInput.value.trim();
        renderSheets();
      });
    }

    if (filterSelect) {
      filterSelect.addEventListener('change', () => {
        filterStatus = filterSelect.value;
        renderSheets();
      });
    }

    if (btnPrint) {
      btnPrint.addEventListener('click', () => {
        window.print();
      });
    }

    if (btnReset) {
      btnReset.addEventListener('click', () => {
        MockAPI.reset();
        students = loadStudents();
        renderSheets();
        showToast('Đã khôi phục 28 phiếu mời của Lớp 1A2 về dữ liệu mẫu ban đầu.', 'ok');
      });
    }

    const toastClose = document.getElementById('pm-toast-close');
    if (toastClose && toastBox) {
      toastClose.addEventListener('click', () => { toastBox.hidden = true; });
    }

    renderSheets();
  }

  /* ==========================================================================
     KHỞI TẠO MÀN HÌNH S-10 & S-11: PHỤ HUYNH (mock/phu-huynh.html)
     ========================================================================== */
  function initPhuHuynhPage() {
    const appRoot = document.getElementById('ph-app-root');
    if (!appRoot) return;

    let students = loadStudents();
    let state = loadState();
    let holdTimer = null;

    // Nếu mở từ liên kết phu-huynh.html?code=XXXX trên trang phiếu mời S-09
    const params = new URLSearchParams(window.location.search);
    const urlCode = params.get('code');

    const toastBox = document.getElementById('ph-toast');
    const toastText = document.getElementById('ph-toast-text');
    const toastClose = document.getElementById('ph-toast-close');

    function showToast(msg, kind) {
      if (!toastBox || !toastText) return;
      toastText.textContent = msg;
      toastBox.setAttribute('data-kind', kind || 'ok');
      toastBox.hidden = false;
    }

    if (toastClose && toastBox) {
      toastClose.addEventListener('click', () => { toastBox.hidden = true; });
    }

    function setStep(stepName) {
      state.step = stepName;
      state.kidModeOpen = false;
      saveState(state);
      renderAll();
    }

    function updateStepperUI() {
      const btns = document.querySelectorAll('.ph-step-btn[data-step]');
      btns.forEach(btn => {
        const s = btn.getAttribute('data-step');
        if (s === state.step) {
          btn.setAttribute('aria-current', 'step');
        } else {
          btn.removeAttribute('aria-current');
        }
      });

      const sections = ['view-login', 'view-invite', 'view-children', 'view-s11'];
      sections.forEach(secId => {
        const el = document.getElementById(secId);
        if (el) el.hidden = (secId !== `view-${state.step}`);
      });

      const userStatus = document.getElementById('ph-user-badge');
      if (userStatus) {
        userStatus.textContent = state.loggedIn
          ? `${state.parentName} (${state.linkedStudentIds.length} con)`
          : 'Chưa đăng nhập';
      }
    }

    /* ---------- S-10 Bước 1: Đăng nhập giả ---------- */
    function renderLoginView() {
      const emailIn = document.getElementById('login-email');
      const nameIn = document.getElementById('login-name');
      if (emailIn && !emailIn.value) emailIn.value = state.parentEmail;
      if (nameIn && !nameIn.value) nameIn.value = state.parentName;
    }

    /* ---------- S-10 Bước 2: Nhập mã mời & Đồng ý điều khoản GD-14 ---------- */
    function renderInviteView() {
      const consentCard = document.getElementById('invite-consent-card');
      const pendingStudent = students.find(s => s.id === state.pendingInviteStudentId);

      if (!pendingStudent) {
        if (consentCard) consentCard.hidden = true;
        return;
      }

      if (consentCard) {
        consentCard.hidden = false;
        const badgeEl = document.getElementById('consent-student-summary');
        if (badgeEl) {
          badgeEl.innerHTML = `
            <div class="child-item-top">
              <span class="animal-avatar">${getAnimalSvg(pendingStudent.animalKey)}</span>
              <div class="child-item-info">
                <div class="child-item-name">
                  <span>${pendingStudent.shortName}</span>
                  <span class="grade-badge" data-grade="HT">Lớp 1A2</span>
                </div>
                <div class="child-item-meta">Hình đại diện: <strong>${pendingStudent.animal}</strong> · Mã mời: <code>${pendingStudent.code}</code></div>
              </div>
            </div>
          `;
        }
        const fullNameInput = document.getElementById('consent-fullname');
        const dobInput = document.getElementById('consent-dob');
        if (fullNameInput) fullNameInput.value = pendingStudent.fullName || `Nguyễn ${pendingStudent.shortName.replace('.', '')}`;
        if (dobInput) dobInput.value = pendingStudent.dob || '2020-05-15';
      }
    }

    function verifyInviteCode(rawCode) {
      const code = (rawCode || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
      const codeInput = document.getElementById('invite-code-input');
      if (codeInput) codeInput.value = code;

      if (code.length !== 8) {
        showToast('Mã mời gồm đúng 8 ký tự chữ và số (không gồm 0/O, 1/I/l).', 'bad');
        return;
      }

      students = loadStudents();
      const found = students.find(s => s.code.toUpperCase() === code);
      if (!found) {
        state.pendingInviteStudentId = null;
        saveState(state);
        renderInviteView();
        showToast(`Không tìm thấy mã mời "${code}". Quý Phụ huynh kiểm tra lại tờ phiếu mời nhé.`, 'bad');
        return;
      }

      // BR-PH-01: Mã đã thu hồi
      if (found.status === 'revoked') {
        state.pendingInviteStudentId = null;
        saveState(state);
        renderInviteView();
        showToast(`Chặn (BR-PH-01): Mã mời "${code}" của em ${found.shortName} đã bị giáo viên thu hồi.`, 'bad');
        return;
      }

      // BR-PH-01 & GD-12: Tối đa 2 phụ huynh mỗi em (nếu chưa nằm trong danh sách con đã liên kết)
      const alreadyLinked = state.linkedStudentIds.includes(found.id);
      if (!alreadyLinked && found.linkedCount >= 2) {
        state.pendingInviteStudentId = null;
        saveState(state);
        renderInviteView();
        showToast(`Chặn (BR-PH-01 / GD-12): Em ${found.shortName} đã đủ 2 tài khoản phụ huynh liên kết.`, 'bad');
        return;
      }

      state.pendingInviteStudentId = found.id;
      saveState(state);
      renderInviteView();
      showToast(`Mã hợp lệ: Tìm thấy em ${found.shortName} (${found.animal} · Lớp 1A2). Vui lòng xác nhận điều khoản dữ liệu bên dưới.`, 'ok');
    }

    function completeLinkStudent(agreeConsent) {
      const pendingId = state.pendingInviteStudentId;
      const idx = students.findIndex(s => s.id === pendingId);
      if (idx === -1) return;

      const fullNameInput = document.getElementById('consent-fullname');
      const dobInput = document.getElementById('consent-dob');
      const fullNameVal = (fullNameInput ? fullNameInput.value : '').trim().replace(/\s+/g, ' ');
      const dobVal = dobInput ? dobInput.value : '';

      if (agreeConsent && (fullNameVal.length < 1 || fullNameVal.length > 60)) {
        showToast('Vui lòng nhập họ và tên đầy đủ của con (1–60 ký tự) khi bấm Đồng ý (Mục 8 BRD).', 'bad');
        if (fullNameInput) fullNameInput.focus();
        return;
      }

      const st = students[idx];
      if (!state.linkedStudentIds.includes(st.id)) {
        state.linkedStudentIds.push(st.id);
        st.linkedCount = Math.min(2, st.linkedCount + 1);
      }

      if (agreeConsent) {
        st.hasConsent = true;
        st.fullName = fullNameVal;
        st.dob = dobVal;
        st.consentAt = '02/11/2026 · 13:25';
      } else {
        // Không đồng ý: vẫn liên kết được, con vẫn học ở nhà, nhưng không lưu họ tên đầy đủ và nhận xét (F-03.2, GD-14)
        st.hasConsent = false;
        st.fullName = '';
        st.dob = '';
        st.consentAt = '';
      }

      state.selectedStudentId = st.id;
      state.pendingInviteStudentId = null;
      saveStudents(students);
      saveState(state);

      setStep('children');
      showToast(
        agreeConsent
          ? `Đã liên kết và lưu đồng ý dữ liệu cho con ${st.fullName} (${st.shortName}).`
          : `Đã liên kết với con ${st.shortName} ở chế độ Không định danh (GD-14: chỉ lưu tiến độ và mức đánh giá).`,
        'ok'
      );
    }

    /* ---------- S-10 Bước 3: Chọn con & Cho con học ở nhà (F-03.3, F-03.4) ---------- */
    function renderChildrenView() {
      const listEl = document.getElementById('children-linked-list');
      const kidOverlay = document.getElementById('kid-home-overlay');
      if (!listEl) return;

      students = loadStudents();
      const linked = students.filter(s => state.linkedStudentIds.includes(s.id));

      if (linked.length === 0) {
        listEl.innerHTML = `
          <div class="consent-box">
            <p style="margin:0;">Tài khoản chưa liên kết với học sinh nào. Hãy bấm <strong>"Nhập mã mời"</strong> để liên kết với con.</p>
          </div>
        `;
      } else {
        listEl.innerHTML = linked.map(st => {
          const isSel = st.id === state.selectedStudentId;
          const lessons = getLessonsForStudent(st);
          const bai9 = lessons[0];
          const doneCount = bai9.missions.filter(m => m.done).length;
          return `
            <article class="child-item ${isSel ? 'is-selected' : ''}">
              <div class="child-item-top">
                <span class="animal-avatar animal-avatar-lg">${getAnimalSvg(st.animalKey)}</span>
                <div class="child-item-info">
                  <div class="child-item-name">
                    <span>${st.hasConsent && st.fullName ? `${st.fullName} (${st.shortName})` : st.shortName}</span>
                    <span class="grade-badge" data-grade="${st.hasConsent ? 'HTT' : 'CHT'}">
                      ${st.hasConsent ? 'Đã đồng ý dữ liệu' : 'Chưa đồng ý (GD-14)'}
                    </span>
                  </div>
                  <div class="child-item-meta">
                    Lớp 1A2 · Hình con vật: <strong>${st.animal}</strong> · Bài 9: xong ${doneCount}/${bai9.missions.length} nhiệm vụ
                  </div>
                </div>
              </div>
              <div class="child-item-actions">
                <button type="button" class="ph-btn ph-btn-primary" data-action="view-s11" data-id="${st.id}">
                  Xem kết quả (S-11)
                </button>
                <button type="button" class="ph-btn ph-btn-ok" data-action="start-kid-mode" data-id="${st.id}">
                  Cho con học ở nhà
                </button>
              </div>
            </article>
          `;
        }).join('');
      }

      if (kidOverlay) {
        const activeChild = students.find(s => s.id === state.selectedStudentId) || linked[0];
        if (state.kidModeOpen && activeChild) {
          kidOverlay.hidden = false;
          kidOverlay.innerHTML = `
            <div class="ph-brand-eyebrow">Chế độ trẻ em học ở nhà (F-03.4)</div>
            <div style="display:flex; justify-content:center;">
              <span class="animal-avatar animal-avatar-lg">${getAnimalSvg(activeChild.animalKey)}</span>
            </div>
            <h3 class="ph-card-title">Chào ${activeChild.shortName} (${activeChild.animal})!</h3>
            <p class="ph-card-sub">
              Giao diện dành cho con làm tiếp <strong>Bài 9: Thông tin liên lạc vũ trụ</strong> ở nhà. Tiến độ nhiệm vụ tự động gộp với bài trên lớp (GD-05).
            </p>
            <div style="display:grid; gap:8px;">
              <a class="ph-btn ph-btn-ok ph-btn-block" href="../bai.html?id=lop1-bai09">
                Mở Bài 9: Thông tin liên lạc vũ trụ →
              </a>
              <button type="button" class="ph-btn ph-btn-block" id="btn-exit-kid-mode">
                Bấm giữ hoặc chạm để thoát về trang Phụ huynh
              </button>
            </div>
          `;
        } else {
          kidOverlay.hidden = true;
        }
      }
    }

    /* ---------- S-11: Kết quả học tập của con (Bài đã học, Nhiệm vụ, Nhận xét, Dự án) ---------- */
    function renderS11View() {
      students = loadStudents();
      const linked = students.filter(s => state.linkedStudentIds.includes(s.id));
      const activeStudent = students.find(s => s.id === state.selectedStudentId) || linked[0] || students[0];
      const sharedStudent = MockAPI.read('teacher').students.find(st => st.id === activeStudent.id);
      PROJECT_TEAM_DATA = MockAPI.projectTeam(sharedStudent?.groupId || 'G3');
      if (!activeStudent) return;

      // 1. Thanh chuyển đổi giữa các con đã liên kết
      const switcherEl = document.getElementById('s11-child-switcher');
      if (switcherEl) {
        switcherEl.innerHTML = linked.map(st => `
          <button type="button" class="child-pill ${st.id === activeStudent.id ? 'is-active' : ''}" data-action="switch-child" data-id="${st.id}">
            <span class="animal-avatar">${getAnimalSvg(st.animalKey)}</span>
            <span>${st.shortName} · ${st.animal}</span>
          </button>
        `).join('');
      }

      // 2. Thẻ tóm tắt hồ sơ con
      const headerEl = document.getElementById('s11-student-header');
      const lessons = getLessonsForStudent(activeStudent);
      const totalMissionsDone = lessons.reduce((acc, l) => acc + l.missions.filter(m => m.done).length, 0);
      const totalMissionsAll = lessons.reduce((acc, l) => acc + l.missions.length, 0);

      if (headerEl) {
        headerEl.innerHTML = `
          <div class="child-item-top">
            <span class="animal-avatar animal-avatar-lg">${getAnimalSvg(activeStudent.animalKey)}</span>
            <div class="child-item-info">
              <div class="child-item-name">
                <span>${activeStudent.hasConsent && activeStudent.fullName ? activeStudent.fullName : activeStudent.shortName}</span>
                <span class="grade-badge" data-grade="HTT">Lớp 1A2</span>
              </div>
              <div class="child-item-meta">
                Tên trên lớp: <strong>${activeStudent.shortName}</strong> (${activeStudent.animal}) · GV: Cô Nguyễn Thu Hà
              </div>
            </div>
          </div>
          <div class="summary-stats">
            <div class="stat-box">
              <span class="stat-label">Tuần học</span>
              <span class="stat-val">Tuần 9</span>
            </div>
            <div class="stat-box">
              <span class="stat-label">Nhiệm vụ xong</span>
              <span class="stat-val">${totalMissionsDone}/${totalMissionsAll}</span>
            </div>
            <div class="stat-box">
              <span class="stat-label">Bài 9 mới nhất</span>
              <span class="stat-val">${lessons[0].teacherGrade}</span>
            </div>
          </div>
        `;
      }

      // 3. Cập nhật trạng thái 3 tab trong S-11
      const tabBtns = document.querySelectorAll('.s11-tab[data-s11-tab]');
      tabBtns.forEach(b => {
        const t = b.getAttribute('data-s11-tab');
        b.setAttribute('aria-selected', String(t === state.s11Tab));
      });

      const tabLessons = document.getElementById('s11-panel-lessons');
      const tabProject = document.getElementById('s11-panel-project');
      const tabPrivacy = document.getElementById('s11-panel-privacy');
      if (tabLessons) tabLessons.hidden = state.s11Tab !== 'lessons';
      if (tabProject) tabProject.hidden = state.s11Tab !== 'project';
      if (tabPrivacy) tabPrivacy.hidden = state.s11Tab !== 'privacy';

      // 4. Render Tab 1: Danh sách bài đã học + NV1-NV5 + Nhận xét GV + Ảnh mô hình
      if (tabLessons) {
        tabLessons.innerHTML = lessons.map(lesson => {
          const basicTotal = lesson.missions.filter(m => m.type === 'basic').length;
          const basicDone = lesson.missions.filter(m => m.type === 'basic' && m.done).length;
          const advDone = lesson.missions.filter(m => m.type === 'advanced' && m.done).length;

          let commentHtml = '';
          if (lesson.teacherGrade === 'NONE') {
            commentHtml = `
              <div class="teacher-comment-box">
                <div class="teacher-comment-meta">
                  <span>Đánh giá của giáo viên</span>
                  <span>Mức máy gợi ý: ${lesson.suggestedGrade}</span>
                </div>
                <div>Bài làm đang chờ cô giáo chấm cuối tuần.</div>
              </div>
            `;
          } else if (!activeStudent.hasConsent) {
            commentHtml = `
              <div class="teacher-comment-locked">
                <div><strong>Chờ phụ huynh đồng ý (BR-DY-02 / GD-14):</strong> Nhận xét bằng lời của giáo viên được ẩn vì tài khoản đang ở chế độ chưa đồng ý lưu dữ liệu định danh.</div>
                <button type="button" class="ph-btn ph-btn-sm ph-btn-primary" data-action="quick-grant-consent" data-id="${activeStudent.id}">
                  Đồng ý lưu dữ liệu để xem nhận xét
                </button>
              </div>
            `;
          } else {
            commentHtml = `
              <div class="teacher-comment-box">
                <div class="teacher-comment-meta">
                  <span>Nhận xét của ${lesson.gradedBy}</span>
                  <span>Ngày chấm: ${lesson.gradedAt}</span>
                </div>
                <div>"${lesson.comment}"</div>
              </div>
            `;
          }

          return `
            <article class="lesson-result-card ${lesson.featured ? 'is-featured' : ''}">
              <div class="lesson-cover-row">
                <img class="lesson-cover-img" src="${lesson.cover}" alt="Ảnh mô hình ${lesson.title}">
                <div class="lesson-head-info">
                  <span class="lesson-week-tag">Tuần ${lesson.week} · Cơ bản ${basicDone}/${basicTotal}${advDone ? ` + ${advDone} Nâng cao` : ''}</span>
                  <h3 class="lesson-title-txt">${lesson.title}</h3>
                  <div>
                    <span class="grade-badge" data-grade="${lesson.teacherGrade}">
                      ${gradeLabel(lesson.teacherGrade)}
                    </span>
                  </div>
                </div>
              </div>
              <div class="lesson-body-pad">
                <div style="font-size:12.5px; color:var(--muted);">
                  <strong>Mô hình sáng tạo:</strong> ${lesson.creativePack}<br>
                  <strong>Cập nhật:</strong> ${lesson.updatedAt} · <strong>Kiểu lập trình:</strong> ${lesson.programMode}
                </div>
                <ul class="nv-list" aria-label="Danh sách nhiệm vụ ${lesson.title}">
                  ${lesson.missions.map(m => `
                    <li class="nv-item ${m.done ? 'is-done' : ''}">
                      <span class="nv-check">${m.done ? '✓' : ''}</span>
                      <div>
                        <strong>${m.code}:</strong> ${m.name}
                        ${m.type === 'advanced' ? '<span class="nv-adv-tag">Nâng cao · GD-06</span>' : ''}
                      </div>
                    </li>
                  `).join('')}
                </ul>
                ${commentHtml}
                <div style="display:flex; justify-content:space-between; align-items:center; gap:8px; flex-wrap:wrap;">
                  <a class="ph-btn ph-btn-sm" href="../bai.html?id=${encodeURIComponent(lesson.id)}">
                    Mở bài mô hình 3D →
                  </a>
                  <button type="button" class="ph-btn ph-btn-sm" data-action="toggle-nv-demo" data-student="${activeStudent.id}" data-lesson="${lesson.id}">
                    Thử đánh dấu thêm nhiệm vụ ở nhà
                  </button>
                </div>
              </div>
            </article>
          `;
        }).join('');
      }

      // 5. Render Tab 2: Dự án nhóm 4 em & Sao buổi trưng bày (F-05, F-14.4, BRD 6.4)
      if (tabProject) {
        const teamMembers = students.filter(s => PROJECT_TEAM_DATA.memberIds.includes(s.id));
        const projectCommentHtml = activeStudent.hasConsent
          ? `<div class="teacher-comment-box">
               <div class="teacher-comment-meta"><span>Nhận xét nhóm (chép từ nhóm – F-06.4)</span><span>${escapeHtml(MockAPI.read('exhibition').session.teacherName)}</span></div>
               <div>"${escapeHtml(PROJECT_TEAM_DATA.teacherComment)}"</div>
             </div>`
          : `<div class="teacher-comment-locked">
               <div><strong>Chờ phụ huynh đồng ý (BR-DY-02):</strong> Chỉ hiện mức đánh giá dự án (${PROJECT_TEAM_DATA.teacherGrade}), ẩn nhận xét bằng lời.</div>
             </div>`;

        tabProject.innerHTML = `
          <article class="lesson-result-card is-featured">
            <div class="lesson-cover-row">
              <img class="lesson-cover-img" src="${escapeHtml(PROJECT_TEAM_DATA.cover)}" alt="Ảnh mô hình dự án ${escapeHtml(PROJECT_TEAM_DATA.teamName)}">
              <div class="lesson-head-info">
                <span class="lesson-week-tag">${PROJECT_TEAM_DATA.stage}</span>
                <h3 class="lesson-title-txt">${escapeHtml(PROJECT_TEAM_DATA.teamName)} (${teamMembers.length} học sinh)</h3>
                <div>
                  <span class="grade-badge" data-grade="${PROJECT_TEAM_DATA.teacherGrade}">
                    ${gradeLabel(PROJECT_TEAM_DATA.teacherGrade)}
                  </span>
                </div>
              </div>
            </div>
            <div class="lesson-body-pad">
              <p class="ph-card-sub" style="color:var(--ink); font-weight:600;">${PROJECT_TEAM_DATA.topic}</p>
              <div>
                <div class="ph-presets-title" style="margin-bottom:6px;">Thành viên nhóm dự án (chỉ hiện tên gọi ngắn & con vật – GD-14)</div>
                <div class="team-members-grid">
                  ${teamMembers.map(m => `
                    <div class="team-member-chip">
                      <span class="animal-avatar">${getAnimalSvg(m.animalKey)}</span>
                      <div>
                        <strong>${m.shortName}</strong>
                        <div style="font-size:11px; color:var(--muted);">${m.groupRole}</div>
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>

              ${projectCommentHtml}

              <div style="display:grid; gap:8px;">
                <div class="ph-presets-title">Tổng hợp sao buổi trưng bày tách theo 3 nguồn (BRD 6.4)</div>
                ${PROJECT_TEAM_DATA.ratingsBySource.map(src => `
                  <div class="source-rating-card">
                    <div class="source-rating-head">
                      <span>${escapeHtml(src.source)}</span>
                      <span class="star-score-pill">${src.avgTotal === 'Chưa có' ? 'Chưa có' : `${src.avgTotal} / 3 ★`}</span>
                    </div>
                    <div style="font-size:12px; color:var(--muted);">${escapeHtml(src.note)}</div>
                    ${src.criteria.length ? `
                      <div class="criteria-breakdown">
                        ${src.criteria.map(c => `<div><span>${escapeHtml(c.name)}</span><b>${escapeHtml(c.score)} ★</b></div>`).join('')}
                      </div>
                    ` : ''}
                  </div>
                `).join('')}
              </div>

              <div style="display:grid; gap:8px;">
                <div class="ph-presets-title">Mọi người nói gì về nhóm (Chỉ hiện câu mẫu & chữ đã duyệt – BR-TB-09)</div>
                <ul class="quote-list">
                  ${PROJECT_TEAM_DATA.approvedQuotes.map(q => `
                    <li class="quote-item">
                      <span class="quote-author">${escapeHtml(q.author)} · ${escapeHtml(q.type)}</span>
                      <span>"${escapeHtml(q.text)}"</span>
                    </li>
                  `).join('')}
                </ul>
              </div>
            </div>
          </article>
        `;
      }

      // 6. Render Tab 3: Quyền dữ liệu của Phụ huynh (GD-14, Mục 3 & 9)
      if (tabPrivacy) {
        tabPrivacy.innerHTML = `
          <div class="ph-card">
            <div class="ph-card-head">
              <h3 class="ph-card-title">Quyền dữ liệu của con (${activeStudent.shortName})</h3>
              <span class="grade-badge" data-grade="${activeStudent.hasConsent ? 'HTT' : 'CHT'}">
                ${activeStudent.hasConsent ? 'ĐÃ ĐỒNG Ý' : 'CHƯA ĐỒNG Ý'}
              </span>
            </div>
            <p class="ph-card-sub">
              Theo quy định <strong>GD-14</strong> và <strong>Mục 3 BRD</strong>: Phụ huynh có thể cấp hoặc rút lại sự đồng ý bất cứ lúc nào. Khi rút đồng ý, hệ thống xoá ngay họ tên đầy đủ, ngày sinh và ẩn nhận xét bằng lời, nhưng giữ nguyên tiến độ và mức đánh giá của con.
            </p>
            <div class="ph-field">
              <label for="priv-fullname">Họ và tên đầy đủ của con (1–60 ký tự)</label>
              <input id="priv-fullname" type="text" maxlength="60" value="${activeStudent.fullName || ''}" placeholder="Nhập họ và tên đầy đủ của con">
            </div>
            <div class="ph-field">
              <label for="priv-dob">Ngày sinh của con (không bắt buộc)</label>
              <input id="priv-dob" type="date" value="${activeStudent.dob || ''}">
            </div>
            <div style="display:grid; gap:8px;">
              <button type="button" class="ph-btn ph-btn-primary ph-btn-block" data-action="save-consent-profile" data-id="${activeStudent.id}">
                ${activeStudent.hasConsent ? 'Cập nhật thông tin & Giữ đồng ý' : 'Đồng ý điều khoản & Lưu họ tên con'}
              </button>
              ${activeStudent.hasConsent ? `
                <button type="button" class="ph-btn ph-btn-danger ph-btn-block" data-action="withdraw-consent" data-id="${activeStudent.id}">
                  Rút lại đồng ý (Xoá họ tên & nhận xét – Mục 3)
                </button>
              ` : ''}
            </div>
          </div>
        `;
      }
    }

    function renderAll() {
      updateStepperUI();
      renderLoginView();
      renderInviteView();
      renderChildrenView();
      renderS11View();
    }

    /* ---------- Sự kiện tương tác trên trang Phụ huynh ---------- */
    // Chuyển bước trên thanh stepper
    document.querySelectorAll('.ph-step-btn[data-step]').forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.getAttribute('data-step');
        setStep(target);
      });
    });

    // Chuyển tab trong S-11
    document.querySelectorAll('.s11-tab[data-s11-tab]').forEach(btn => {
      btn.addEventListener('click', () => {
        state.s11Tab = btn.getAttribute('data-s11-tab');
        saveState(state);
        renderS11View();
      });
    });

    // Form đăng nhập giả S-10
    const loginForm = document.getElementById('ph-login-form');
    if (loginForm) {
      loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const emailVal = (document.getElementById('login-email').value || '').trim();
        const nameVal = (document.getElementById('login-name').value || '').trim();
        if (!emailVal || !emailVal.includes('@')) {
          showToast('Vui lòng nhập địa chỉ email hợp lệ để nhận liên kết đăng nhập.', 'bad');
          return;
        }
        state.loggedIn = true;
        state.parentEmail = emailVal;
        state.parentName = nameVal || 'Phụ huynh Lớp 1A2';
        saveState(state);
        setStep('invite');
        showToast(`Đã đăng nhập tài khoản ${state.parentName} (${state.parentEmail}). Tiếp theo: nhập mã mời trên phiếu của con.`, 'ok');
      });
    }

    // Form kiểm tra mã mời S-10
    const inviteForm = document.getElementById('ph-invite-form');
    if (inviteForm) {
      inviteForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const codeVal = document.getElementById('invite-code-input').value;
        verifyInviteCode(codeVal);
      });
    }

    // Các nút chọn nhanh mã mời mẫu để test các luật BRD
    document.querySelectorAll('[data-preset-code]').forEach(btn => {
      btn.addEventListener('click', () => {
        const code = btn.getAttribute('data-preset-code');
        verifyInviteCode(code);
      });
    });

    // Nút Đồng ý / Không đồng ý ở bước liên kết con (F-03.2)
    const btnAgree = document.getElementById('btn-consent-agree');
    const btnDecline = document.getElementById('btn-consent-decline');
    if (btnAgree) btnAgree.addEventListener('click', () => completeLinkStudent(true));
    if (btnDecline) btnDecline.addEventListener('click', () => completeLinkStudent(false));

    // Uỷ quyền sự kiện click trong toàn trang Phụ huynh
    appRoot.addEventListener('click', (e) => {
      const exitKidBtn = e.target.closest('#btn-exit-kid-mode');
      if (exitKidBtn) {
        state.kidModeOpen = false;
        saveState(state);
        renderChildrenView();
        showToast('Đã thoát chế độ học sinh, quay về trang Phụ huynh.', 'ok');
        return;
      }

      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      const action = btn.getAttribute('data-action');
      const id = Number(btn.getAttribute('data-id'));

      if (action === 'view-s11') {
        state.selectedStudentId = id;
        state.s11Tab = 'lessons';
        saveState(state);
        setStep('s11');
        const st = students.find(s => s.id === id);
        if (st) showToast(`Đang xem kết quả học tập của con ${st.shortName} (${st.animal}).`, 'ok');
      } else if (action === 'start-kid-mode') {
        state.selectedStudentId = id;
        state.kidModeOpen = true;
        saveState(state);
        renderChildrenView();
        const st = students.find(s => s.id === id);
        if (st) showToast(`Đã bật chế độ trẻ em ở nhà cho ${st.shortName} (F-03.4).`, 'ok');
      } else if (action === 'switch-child') {
        state.selectedStudentId = id;
        saveState(state);
        renderS11View();
      } else if (action === 'quick-grant-consent') {
        state.selectedStudentId = id;
        state.s11Tab = 'privacy';
        saveState(state);
        renderS11View();
        showToast('Hãy kiểm tra họ tên của con và bấm "Đồng ý điều khoản" để mở khoá nhận xét giáo viên.', 'warn');
      } else if (action === 'save-consent-profile') {
        const idx = students.findIndex(s => s.id === id);
        if (idx === -1) return;
        const fn = (document.getElementById('priv-fullname')?.value || '').trim();
        const dob = document.getElementById('priv-dob')?.value || '';
        if (!fn) {
          showToast('Vui lòng nhập họ và tên đầy đủ của con (1–60 ký tự) khi đồng ý.', 'bad');
          return;
        }
        students[idx].hasConsent = true;
        students[idx].fullName = fn;
        students[idx].dob = dob;
        students[idx].consentAt = '02/11/2026 · 13:30';
        saveStudents(students);
        state.s11Tab = 'lessons';
        saveState(state);
        renderS11View();
        showToast(`Đã lưu đồng ý dữ liệu và hiển thị nhận xét của giáo viên cho con ${fn}.`, 'ok');
      } else if (action === 'withdraw-consent') {
        const idx = students.findIndex(s => s.id === id);
        if (idx === -1) return;
        const shortN = students[idx].shortName;
        students[idx].hasConsent = false;
        students[idx].fullName = '';
        students[idx].dob = '';
        students[idx].consentAt = '';
        saveStudents(students);
        renderS11View();
        showToast(`Đã rút lại đồng ý cho ${shortN}: đã xoá họ tên đầy đủ, ngày sinh và ẩn nhận xét; giữ nguyên tiến độ & mức đánh giá (Mục 3 BRD).`, 'warn');
      } else if (action === 'toggle-nv-demo') {
        const stId = Number(btn.getAttribute('data-student'));
        const lessonId = btn.getAttribute('data-lesson');
        const lesson = MockAPI.lessonsForStudent(stId).find(l => l.id === lessonId);
        const next = lesson && lesson.missions.findIndex(m => m.type === 'basic' && !m.done);
        if (next >= 0) {
          const code = MockData.lessons.find(l => l.code === lessonId)?.id;
          const cell = MockAPI.read('teacher').cells[stId + '_' + code];
          const flags = [...cell.coreFlags];
          flags[next] = true;
          MockAPI.rpc('save_attempt', { p_student_id: stId, p_lesson_id: code, coreFlags: flags });
          renderS11View();
          showToast('Đã lưu tiến độ ' + lesson.missions[next].code + ' vào dữ liệu dùng chung.', 'ok');
        } else {
          showToast('Không còn nhiệm vụ cơ bản chưa hoàn thành trong bài này.', 'ok');
        }
      }
    });

    // Nếu URL có ?code=... thì chuyển ngay sang bước Nhập mã mời và kiểm tra mã đó
    if (urlCode) {
      state.step = 'invite';
      saveState(state);
      renderAll();
      verifyInviteCode(urlCode);
    } else {
      renderAll();
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    initPhieuMoiPage();
    initPhuHuynhPage();
  });
})();
