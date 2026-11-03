// Nạp dữ liệu, HTML riêng và script theo thứ tự trước khi khởi động bài.
(function () {
  'use strict';
  let booting = true;
  let ready = false;
  const queued = [];
  const zmReady = function (fn) {
    if (booting) queued.push(fn);
    else if (ready || document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn, { once: true });
  };
  zmReady.flush = function () {
    if (!booting) return;
    booting = false;
    ready = true;
    while (queued.length) {
      const fn = queued.shift();
      try { fn(); } catch (err) { setTimeout(() => { throw err; }); }
    }
  };
  window.zmReady = zmReady;

  const cover = document.createElement('div');
  cover.id = 'lesson-loading';
  cover.setAttribute('role', 'status');
  cover.setAttribute('aria-live', 'polite');
  cover.style.cssText = 'position:fixed;inset:0;z-index:99999;display:grid;place-items:center;padding:24px;background:#f7f9fc;color:#21334c;font:17px system-ui,sans-serif;text-align:center';
  document.body.appendChild(cover);

  function show(message, retry) {
    cover.replaceChildren();
    const box = document.createElement('div');
    const title = document.createElement('p');
    title.textContent = message;
    box.appendChild(title);
    if (retry) {
      const button = document.createElement('button');
      button.textContent = 'Thử lại';
      button.type = 'button';
      button.style.cssText = 'padding:10px 22px;border-radius:8px;cursor:pointer';
      button.addEventListener('click', () => location.reload());
      box.appendChild(button);
    } else {
      const back = document.createElement('a');
      back.href = 'index.html';
      back.textContent = 'Về trang chọn bài';
      box.appendChild(back);
    }
    cover.appendChild(box);
  }

  async function fetchPage(content) {
    const url = `content/${content}/page.html`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Không tải được ${url} (${res.status})`);
    return new DOMParser().parseFromString(await res.text(), 'text/html');
  }

  async function fetchJSON(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Không tải được ${url} (${res.status})`);
    return res.json();
  }

  function fillSlots(fragment) {
    const title = fragment.querySelector('title');
    if (!title) throw new Error('Trang bài thiếu tiêu đề');
    document.title = title.textContent;
    const sources = new Map(Array.from(fragment.querySelectorAll('template[data-slot]'),
      t => [t.dataset.slot, t]));
    for (const slot of document.querySelectorAll('template[data-slot]')) {
      const from = sources.get(slot.dataset.slot);
      if (!from) throw new Error(`Bài học thiếu vùng ${slot.dataset.slot}`);
      slot.replaceWith(from.content.cloneNode(true));
      sources.delete(slot.dataset.slot);
    }
    if (sources.size) throw new Error(`Trang bài có vùng không tồn tại: ${[...sources.keys()].join(', ')}`);
  }

  function appendScript(src, optional) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.async = false;
      script.onload = resolve;
      script.onerror = () => {
        script.remove();
        if (optional) resolve();
        else reject(new Error(`Không tải được script ${src}`));
      };
      document.body.appendChild(script);
    });
  }

  async function boot() {
    const id = new URLSearchParams(location.search).get('id');
    const lesson = window.ZM_LESSONS && window.ZM_LESSONS[id];
    if (!lesson) {
      show('Không tìm thấy bài học. Hãy chọn một bài từ danh sách.');
      return;
    }
    show('Đang tải bài học và mô hình 3D…');
    try {
      const [fragment, flow] = await Promise.all([
        fetchPage(lesson.content),
        lesson.flow ? fetchJSON(`content/${lesson.content}/flow.json`) : null,
        window.loadLesson3D(lesson.content)
      ]);
      fillSlots(fragment);
      const optional = new Set(lesson.optional || []);
      // Bài có flow.json: nạp js/lesson-flow.js ngay trước app.js để thêm chặng Khám phá + Chia sẻ
      let scripts = lesson.order;
      if (flow) {
        window.LESSON_FLOW = flow;
        const at = scripts.indexOf('js/app.js');
        scripts = [...scripts.slice(0, at), 'js/lesson-flow.js', ...scripts.slice(at)];
      }
      for (const src of scripts) await appendScript(src, optional.has(src));
      zmReady.flush();
      cover.remove();
    } catch (err) {
      console.error('Không thể khởi động bài học:', err);
      show('Không thể tải bài học. Vui lòng kiểm tra kết nối rồi thử lại.', true);
    }
  }
  boot();
})();
