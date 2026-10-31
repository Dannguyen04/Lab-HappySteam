// js/project/showcase.js – Phòng trưng bày dự án (tuần 18 / 35): giáo viên chọn hoặc kéo thả ảnh poster các nhóm
// (tải từ Sổ dự án), xem lưới, trình chiếu toàn màn hình (mũi tên, vuốt), cả lớp bình chọn bằng sao.
// Ảnh chỉ mở trong trình duyệt, không tải lên đâu; tải lại trang thì chọn ảnh lại.
(function () {
  'use strict';

  const $ = id => document.getElementById(id);
  const HK = new URLSearchParams(location.search).get('hk') === '2' ? 2 : 1;
  const posters = []; // { name, url, votes }
  let cur = -1;

  const nameOf = file => file.name.replace(/\.[^.]+$/, '').replace(/^poster-/, '').replace(/-/g, ' ');
  function add(files) {
    for (const f of files) if (f.type.startsWith('image/')) posters.push({ name: nameOf(f), url: URL.createObjectURL(f), votes: 0 });
    render();
  }
  function render() {
    $('show-count').textContent = posters.length ? posters.length + ' poster' : 'Chưa có poster';
    $('drop-zone').hidden = posters.length > 0;
    $('show-grid').replaceChildren(
      ...posters.map((p, i) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'show-card';
        b.dataset.i = i;
        const img = document.createElement('img');
        img.src = p.url;
        img.alt = 'Poster ' + p.name;
        const cap = document.createElement('span');
        cap.textContent = p.name + (p.votes ? ` · ⭐ ${p.votes}` : '');
        b.append(img, cap);
        b.onclick = () => open(i);
        return b;
      })
    );
    const ranked = posters.filter(p => p.votes).sort((a, b) => b.votes - a.votes);
    $('rank-panel').hidden = !ranked.length;
    $('rank').replaceChildren(
      ...ranked.map(p => {
        const li = document.createElement('li');
        li.textContent = `${p.name} – ⭐ ${p.votes}`;
        return li;
      })
    );
  }
  function open(i) {
    cur = (i + posters.length) % posters.length;
    const p = posters[cur];
    $('slide-img').src = p.url;
    $('slide-img').alt = 'Poster ' + p.name;
    $('slide-name').textContent = `${cur + 1}/${posters.length} · ${p.name}`;
    $('slide-votes').textContent = p.votes;
    $('slideshow').hidden = false;
    $('slide-next').focus();
  }
  function close() {
    $('slideshow').hidden = true;
    cur = -1;
    render();
  }

  document.addEventListener('DOMContentLoaded', () => {
    if (HK === 2) $('show-eyebrow').textContent = 'Lớp 1 · Trưng bày tổng kết học kì II · Tuần 35';
    $('show-files').addEventListener('change', e => add(e.target.files));
    const zone = document.body;
    zone.addEventListener('dragover', e => {
      e.preventDefault();
      $('drop-zone').classList.add('over');
    });
    zone.addEventListener('dragleave', () => $('drop-zone').classList.remove('over'));
    zone.addEventListener('drop', e => {
      e.preventDefault();
      $('drop-zone').classList.remove('over');
      add(e.dataTransfer.files);
    });
    $('slide-prev').onclick = () => open(cur - 1);
    $('slide-next').onclick = () => open(cur + 1);
    $('slide-close').onclick = close;
    $('slide-vote').onclick = () => {
      posters[cur].votes++;
      $('slide-votes').textContent = posters[cur].votes;
      if (window.SFX) window.SFX.ding();
    };
    document.addEventListener('keydown', e => {
      if ($('slideshow').hidden) return;
      if (e.key === 'ArrowRight') open(cur + 1);
      else if (e.key === 'ArrowLeft') open(cur - 1);
      else if (e.key === 'Escape') close();
    });
    // vuốt trên máy tính bảng
    let x0 = null;
    $('slideshow').addEventListener('pointerdown', e => (x0 = e.clientX));
    $('slideshow').addEventListener('pointerup', e => {
      if (x0 == null || e.target.closest('button')) return;
      const dx = e.clientX - x0;
      if (Math.abs(dx) > 60) open(cur + (dx < 0 ? 1 : -1));
      x0 = null;
    });
    const btnTheme = $('btn-toggle-theme');
    const apply = th => {
      document.documentElement.setAttribute('data-theme', th);
      btnTheme.textContent = th === 'dark' ? 'Giao diện sáng' : 'Giao diện tối';
      try {
        localStorage.setItem('zm_theme', th);
      } catch (e) {}
    };
    let th = 'light';
    try {
      th = localStorage.getItem('zm_theme') || 'light';
    } catch (e) {}
    apply(th);
    btnTheme.onclick = () => apply(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
    if (window.SFX) window.SFX.init();
    render();
  });

  window.ZMShowcase = { add, posters: () => posters };
})();
