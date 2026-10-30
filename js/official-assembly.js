// Source of truth: references/official/Bai9_Thong_tin_lien_lac_vu_tru.pdf
// Printed numbering intentionally skips #20. The pictures are cropped,
// never illustrated or extrapolated from the speculative CAD milestones.
(function () {
  'use strict';

  const sheets = [
    [2, 1, 2], [3, 3, 4], [4, 5, 6], [5, 7, 8], [6, 9],
    [7, 10, 11], [8, 12, 13], [9, 14, 15], [10, 16, 17],
    [11, 18, 19], [12, 21, 22], [13, 23, 24],
    [14, 25, 26], [15, 27, 28],
  ];
  const steps = sheets.flatMap(([page, ...numbers]) => numbers.map((number, index) => ({
    page,
    number,
    side: numbers.length === 1 ? 'toàn trang' : index === 0 ? 'bên trái' : 'bên phải',
    source: `assets/official-assembly/step-${String(number).padStart(2, '0')}.jpg`,
  })));

  document.addEventListener('DOMContentLoaded', () => {
    const guide = document.getElementById('subview-official');
    if (!guide) return;

    const list = document.getElementById('official-step-list');
    const title = document.getElementById('official-step-title');
    const location = document.getElementById('official-step-location');
    const caption = document.getElementById('official-step-caption');
    const progress = document.getElementById('official-progress');
    const picture = document.getElementById('official-step-image');
    const pictureError = document.getElementById('official-image-error');
    const scroller = document.getElementById('official-image-scroller');
    const pdfPage = document.getElementById('official-pdf-page');
    const prev = document.getElementById('official-prev');
    const next = document.getElementById('official-next');
    const zoomLabel = document.getElementById('official-zoom-value');
    let position = 0;
    let zoom = 1;
    const buttons = [];

    for (const step of steps) {
      if (step.number === 1 || step.number === 21) {
        const group = document.createElement('div');
        group.className = 'official-step-group';
        group.textContent = step.number === 1 ? '01 · Đế, động cơ & trục' : '02 · Đầu vệ tinh & ghép cụm';
        list.appendChild(group);
      }
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'official-step-chip';
      button.dataset.officialStep = String(step.number);
      button.textContent = String(step.number);
      button.setAttribute('aria-label', `Xem bước ${step.number}, trang ${step.page} của PDF`);
      const index = buttons.length;
      button.addEventListener('click', () => showStep(index));
      buttons.push(button);
      list.appendChild(button);
    }

    function changeZoom(value) {
      zoom = Math.min(3, Math.max(1, value));
      picture.style.width = `${Math.round(zoom * 100)}%`;
      zoomLabel.textContent = `${Math.round(zoom * 100)}%`;
      document.getElementById('official-zoom-out').disabled = zoom === 1;
      document.getElementById('official-zoom-in').disabled = zoom === 3;
    }

    function showStep(index) {
      if (index < 0 || index >= steps.length) return;
      position = index;
      const step = steps[index];
      title.textContent = `Bước ${step.number}`;
      location.textContent = `Trang ${step.page} / 16 · Hình ${step.side}`;
      caption.textContent = step.number === 21
        ? 'Bài giảng chuyển từ bước 19 sang bước 21. Bắt đầu phần cụm đầu vệ tinh.'
        : step.number === 28
          ? 'Hình hoàn thiện và vị trí ghép cụm: đối chiếu với mô hình thật trước khi cố định.'
          : 'Quan sát linh kiện trong ô nền xanh và phần thay đổi được viền đỏ trong hình gốc.';
      progress.textContent = `Bước ${index + 1} / ${steps.length} · Số in: ${step.number}`;
      picture.alt = `Hình lắp ráp bước ${step.number}, trang ${step.page} PDF bài giảng ZMrobo, ${step.side}`;
      pictureError.hidden = true;
      picture.hidden = false;
      picture.src = step.source;
      pdfPage.href = `references/official/Bai9_Thong_tin_lien_lac_vu_tru.pdf#page=${step.page}`;
      prev.disabled = position === 0;
      next.disabled = position === steps.length - 1;
      buttons.forEach((button, i) => {
        const active = i === position;
        button.classList.toggle('selected', active);
        if (active) button.setAttribute('aria-current', 'step');
        else button.removeAttribute('aria-current');
      });
      changeZoom(1);
      scroller.scrollTop = 0;
      scroller.scrollLeft = 0;
      // Preload only the immediate next page for seamless step navigation.
      if (steps[index + 1]) {
        const preload = new Image();
        preload.src = steps[index + 1].source;
      }
    }

    picture.addEventListener('error', () => {
      picture.hidden = true;
      pictureError.hidden = false;
    });
    prev.addEventListener('click', () => showStep(position - 1));
    next.addEventListener('click', () => showStep(position + 1));
    document.getElementById('official-zoom-out').addEventListener('click', () => changeZoom(zoom - 0.25));
    document.getElementById('official-zoom-in').addEventListener('click', () => changeZoom(zoom + 0.25));
    document.getElementById('official-zoom-reset').addEventListener('click', () => changeZoom(1));
    // Cho tab 3D mở đúng trang sách: bước 20 chỉ đổi góc nhìn (bản PDF này lược bỏ) → hiện bước 19
    window.showOfficialStep = number => {
      const target = number === 20 ? 19 : number;
      const index = steps.findIndex(s => s.number === target);
      if (index >= 0) showStep(index);
    };
    document.getElementById('official-open-3d')?.addEventListener('click', () => {
      window.switchAssemblySubtab?.('base');
      window.assemblyGoStep?.(steps[position].number);
    });
    showStep(0);
  });
})();
