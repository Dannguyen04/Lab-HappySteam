/* Thanh điều khiển chung cho mọi màn mock. Trạng thái xem thử không ghi vào dữ liệu nghiệp vụ. */
(function (root) {
  'use strict';
  const ROLES = [
    { id: 'student', label: 'Học sinh', url: 'trung-bay.html#s15' },
    { id: 'teacher', label: 'Giáo viên', url: 'giao-vien-lop.html#s07' },
    { id: 'parent', label: 'Phụ huynh', url: 'phu-huynh.html' },
    { id: 'guest', label: 'Khách', url: 'khach.html' }
  ];
  const MODES = {
    success: ['Thành công', 'Đây là giao diện hoạt động với dữ liệu mẫu. Bạn có thể thao tác và chuyển qua màn khác để kiểm tra dữ liệu liên thông.'],
    empty: ['Chưa có dữ liệu', 'Đây là trạng thái trống để kiểm tra bố cục. Chọn Thành công để quay lại dữ liệu mẫu.'],
    loading: ['Đang tải dữ liệu mẫu', 'Mô phỏng trạng thái chờ. Dữ liệu không thay đổi.'],
    error: ['Không tải được dữ liệu', 'Lỗi được mô phỏng để kiểm tra giao diện. Dữ liệu mẫu vẫn còn nguyên.']
  };
  const PREVIEW_KEY = 'mock.76.preview';

  function determineRole() {
    const name = root.location.pathname.split('/').pop();
    if (name === 'khach.html') return 'guest';
    if (name === 'phu-huynh.html') return 'parent';
    if (name === 'trung-bay.html' && root.location.hash === '#s15') return 'student';
    if (name === 'trung-bay.html' && root.location.hash === '#s17') return 'student';
    if (name === 'trung-bay.html') return 'teacher';
    if (name === 'index.html' || name === '') return 'all';
    return 'teacher';
  }
  function getPreview() {
    try { return root.sessionStorage.getItem(PREVIEW_KEY) || 'success'; } catch (_) { return 'success'; }
  }
  function setPreview(mode) {
    try { root.sessionStorage.setItem(PREVIEW_KEY, mode); } catch (_) { /* vẫn xem được */ }
  }

  function init() {
    if (!root.document.body || root.document.getElementById('mock76-shell')) return;
    const header = root.document.createElement('header');
    header.id = 'mock76-shell';
    header.setAttribute('aria-label', 'Điều khiển bản mẫu');
    header.innerHTML = `
      <a class="mock76-home" href="index.html">Mục lục</a>
      <span class="mock76-label">DỮ LIỆU MẪU</span>
      <label class="mock76-field">Vai
        <select id="mock76-role" aria-label="Chọn vai để thử màn hình">
          <option value="all">Tất cả vai</option>
          ${ROLES.map(role => `<option value="${role.id}">${role.label}</option>`).join('')}
        </select>
      </label>
      <label class="mock76-field">Trạng thái
        <select id="mock76-mode" aria-label="Chọn trạng thái xem thử">
          <option value="success">Thành công</option>
          <option value="empty">Trống</option>
          <option value="loading">Đang tải</option>
          <option value="error">Lỗi</option>
        </select>
      </label>
      <button type="button" id="mock76-reset">Đặt lại dữ liệu mẫu</button>
    `;
    root.document.body.insertBefore(header, root.document.body.firstChild);

    const preview = root.document.createElement('section');
    preview.id = 'mock76-preview';
    preview.setAttribute('aria-live', 'polite');
    preview.setAttribute('aria-label', 'Trạng thái màn hình');
    preview.hidden = true;
    preview.innerHTML = '<div class="mock76-preview-card" role="status"><span class="mock76-preview-icon" aria-hidden="true"></span><h2 id="mock76-preview-title"></h2><p id="mock76-preview-text"></p><button id="mock76-back" type="button">Quay lại màn hình mẫu</button></div>';
    header.insertAdjacentElement('afterend', preview);

    const roleSelect = root.document.getElementById('mock76-role');
    const modeSelect = root.document.getElementById('mock76-mode');
    function render() {
      const mode = MODES[modeSelect.value] ? modeSelect.value : 'success';
      const [title, description] = MODES[mode];
      root.document.body.dataset.mock76Mode = mode;
      preview.hidden = mode === 'success';
      root.document.getElementById('mock76-preview-title').textContent = title;
      root.document.getElementById('mock76-preview-text').textContent = description;
      preview.dataset.mode = mode;
    }
    roleSelect.value = determineRole();
    modeSelect.value = MODES[getPreview()] ? getPreview() : 'success';
    render();
    roleSelect.addEventListener('change', () => {
      if (roleSelect.value === 'all') { root.location.href = 'index.html'; return; }
      const role = ROLES.find(item => item.id === roleSelect.value);
      if (root.location.pathname.endsWith('/index.html') || root.location.pathname.endsWith('/mock/')) {
        const target = root.document.getElementById('role-' + role.id);
        if (target) { target.scrollIntoView({ behavior: 'smooth' }); return; }
      }
      root.location.href = role.url;
    });
    root.addEventListener('hashchange', () => { roleSelect.value = determineRole(); });
    modeSelect.addEventListener('change', () => { setPreview(modeSelect.value); render(); });
    root.document.getElementById('mock76-back').addEventListener('click', () => {
      modeSelect.value = 'success'; setPreview('success'); render();
    });
    root.document.getElementById('mock76-reset').addEventListener('click', () => {
      if (!root.MockAPI) { root.alert('Không nạp được API dữ liệu mẫu.'); return; }
      root.MockAPI.reset();
      setPreview('success');
      root.location.reload(); // các màn nạp lại từ cùng bộ dữ liệu vừa đặt lại
    });
  }

  if (root.document) {
    if (root.document.readyState === 'loading') root.document.addEventListener('DOMContentLoaded', init);
    else init();
  }
  root.MockShell = { init, roles: ROLES, states: Object.keys(MODES) };
})(typeof window !== 'undefined' ? window : globalThis);
