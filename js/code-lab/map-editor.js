// Phòng lập trình – trình vẽ sa bàn cho giáo viên & học sinh.
// API: window.CodeLabEditor = { open(onSave) }
(function () {
  'use strict';
  const V = window.CodeLabView;
  const $ = id => document.getElementById(id);

  const TIPS = {
    goal: 'Kéo trên sân để đặt ô đích màu xanh lá (mỗi sa bàn chỉ có 1 ô đích).',
    wall: 'Kéo hình chữ nhật trên sân để dựng tường chắn.',
    line: 'Chạm từng điểm để nối vạch đen. Bấm "Xong vạch" để kết thúc đoạn đang vẽ.',
    zone: 'Chọn màu (Đỏ / Xanh dương / Vàng) rồi kéo trên sân để vẽ ô màu.',
    flag: 'Chạm vào sân để cắm thêm lá cờ.',
    start: 'Chạm vào sân để đặt chỗ xuất phát của xe; bấm "Xoay 90°" để đổi hướng.',
    erase: 'Chạm vào vật trên sân (tường, vạch, ô màu, cờ, ô đích) để xóa.'
  };

  const frame = (w, h) => [
    { k: 'wall', x: 0, y: 0, w, h: 3 },
    { k: 'wall', x: 0, y: h - 3, w, h: 3 },
    { k: 'wall', x: 0, y: 0, w: 3, h },
    { k: 'wall', x: w - 3, y: 0, w: 3, h }
  ];

  const clone = o => JSON.parse(JSON.stringify(o));

  function parseSize(str) {
    const [w, h] = String(str || '240x160').split('x').map(Number);
    return [w || 240, h || 160];
  }

  function distSeg(px, py, ax, ay, bx, by) {
    const dx = bx - ax, dy = by - ay;
    const L = dx * dx + dy * dy;
    let t = L ? ((px - ax) * dx + (py - ay) * dy) / L : 0;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - ax - t * dx, py - ay - t * dy);
  }

  let onSaveCb = null;
  let bound = false;
  let size = [240, 160];
  let start = { x: 30, y: 80, dir: 0 };
  let userItems = [];
  let tool = 'goal';
  let zoneColor = 'red';
  let activeLine = null;
  let dragStart = null;
  let dragCur = null;
  let cursorCm = null;

  function setTip(text, kind = '') {
    const el = $('ed-tip');
    if (!el) return;
    el.textContent = text;
    el.dataset.kind = kind;
  }

  function currentMap(withPreview) {
    const items = [...frame(size[0], size[1]), ...userItems];
    if (withPreview && dragStart && dragCur) {
      const p = buildRectItem(tool, dragStart, dragCur);
      if (p) {
        if (p.goal) {
          for (let i = items.length - 1; i >= 4; i--) {
            if (items[i].k === 'zone' && items[i].goal) items.splice(i, 1);
          }
        }
        items.push(p);
      }
    }
    return {
      id: 'preview',
      name: ($('ed-name') && $('ed-name').value) || 'Sa bàn của lớp',
      size: size.slice(),
      start: { ...start },
      items,
      rules: { time: 15, star3: 'noCrash', limit: 120 }
    };
  }

  function clampCm(x, y) {
    const cx = Math.max(3, Math.min(size[0] - 3, x));
    const cy = Math.max(3, Math.min(size[1] - 3, y));
    return [Math.round(cx), Math.round(cy)];
  }

  function pointerToCm(canvas, e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = rect.width ? canvas.width / rect.width : 1;
    const scaleY = rect.height ? canvas.height / rect.height : 1;
    const px = (e.clientX - rect.left) * scaleX;
    const py = (e.clientY - rect.top) * scaleY;
    const T = V.fit(canvas, currentMap(false));
    const [x, y] = T.toCm(px, py);
    return clampCm(x, y);
  }

  function buildRectItem(kind, a, b) {
    if (kind !== 'wall' && kind !== 'goal' && kind !== 'zone') return null;
    const dx = Math.abs(b[0] - a[0]), dy = Math.abs(b[1] - a[1]);
    let x, y, w, h;
    if (dx < 4 && dy < 4) {
      w = kind === 'wall' ? 24 : 38;
      h = kind === 'wall' ? 24 : 38;
      x = Math.max(3, Math.min(size[0] - 3 - w, Math.round(b[0] - w / 2)));
      y = Math.max(3, Math.min(size[1] - 3 - h, Math.round(b[1] - h / 2)));
    } else {
      x = Math.max(3, Math.round(Math.min(a[0], b[0])));
      y = Math.max(3, Math.round(Math.min(a[1], b[1])));
      w = Math.max(8, Math.min(size[0] - 3 - x, Math.round(dx)));
      h = Math.max(8, Math.min(size[1] - 3 - y, Math.round(dy)));
    }
    if (kind === 'wall') return { k: 'wall', x, y, w, h };
    if (kind === 'goal') return { k: 'zone', x, y, w, h, color: 'green', goal: true };
    return { k: 'zone', x, y, w, h, color: zoneColor };
  }

  function draw() {
    const canvas = $('ed-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const map = currentMap(true);
    const T = V.fit(canvas, map);
    V.drawMap(ctx, map, T);

    // Vẽ điểm đầu và đoạn nháp của vạch đen đang chấm
    if (activeLine && activeLine.pts.length > 0) {
      const { X, Y, s } = T;
      ctx.save();
      ctx.fillStyle = '#1b1f24';
      for (const p of activeLine.pts) {
        ctx.beginPath();
        ctx.arc(X(p[0]), Y(p[1]), Math.max(3, s * 1.3), 0, Math.PI * 2);
        ctx.fill();
      }
      if (cursorCm && tool === 'line') {
        const last = activeLine.pts[activeLine.pts.length - 1];
        ctx.strokeStyle = 'rgba(27, 31, 36, 0.45)';
        ctx.lineWidth = Math.max(2, activeLine.w * s);
        ctx.setLineDash([5, 4]);
        ctx.beginPath();
        ctx.moveTo(X(last[0]), Y(last[1]));
        ctx.lineTo(X(cursorCm[0]), Y(cursorCm[1]));
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  function selectTool(nextTool) {
    if (nextTool !== 'line') activeLine = null;
    tool = nextTool;
    renderTools();
    setTip(TIPS[tool] || '');
    draw();
  }

  function finishLine() {
    if (activeLine && activeLine.pts.length < 2) {
      const idx = userItems.indexOf(activeLine);
      if (idx >= 0) userItems.splice(idx, 1);
    }
    activeLine = null;
    setTip('Đã ngắt vạch. Chạm điểm mới trên sân nếu muốn vẽ thêm vạch khác.');
    draw();
  }

  function rotateStart() {
    const step = Math.PI / 2;
    const steps = (Math.round((start.dir || 0) / step) + 1) % 4;
    start.dir = Math.round(steps * step * 1000) / 1000;
    draw();
  }

  function eraseAt(x, y) {
    for (let i = userItems.length - 1; i >= 0; i--) {
      const it = userItems[i];
      if (it.k === 'flag' && Math.hypot(x - it.x, y - it.y) <= 10) {
        userItems.splice(i, 1);
        return true;
      }
      if ((it.k === 'wall' || it.k === 'zone') &&
          x >= it.x - 2 && x <= it.x + it.w + 2 &&
          y >= it.y - 2 && y <= it.y + it.h + 2) {
        userItems.splice(i, 1);
        return true;
      }
      if (it.k === 'line' && it.pts.some((p, j) =>
          (j > 0 && distSeg(x, y, it.pts[j - 1][0], it.pts[j - 1][1], p[0], p[1]) <= 6) ||
          Math.hypot(x - p[0], y - p[1]) <= 6)) {
        if (it === activeLine) activeLine = null;
        userItems.splice(i, 1);
        return true;
      }
    }
    return false;
  }

  function renderTools() {
    const box = $('ed-tools');
    if (!box) return;
    box.innerHTML = '';

    const addBtn = (label, isOn, onClick, attrs = {}) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'cl-chip' + (isOn ? ' is-on' : '');
      b.textContent = label;
      b.setAttribute('aria-pressed', isOn ? 'true' : 'false');
      for (const [k, v] of Object.entries(attrs)) b.dataset[k] = v;
      b.addEventListener('click', onClick);
      box.appendChild(b);
    };

    const sep = () => {
      const s = document.createElement('span');
      s.className = 'cl-ed-sep';
      s.setAttribute('aria-hidden', 'true');
      box.appendChild(s);
    };

    addBtn('Ô đích', tool === 'goal', () => selectTool('goal'), { tool: 'goal' });
    addBtn('Tường', tool === 'wall', () => selectTool('wall'), { tool: 'wall' });
    addBtn('Vạch đen', tool === 'line', () => selectTool('line'), { tool: 'line' });
    addBtn('Xong vạch', false, finishLine, { act: 'finish-line' });
    sep();
    addBtn('Ô màu', tool === 'zone', () => selectTool('zone'), { tool: 'zone' });
    for (const [c, label] of [['red', 'Đỏ'], ['blue', 'Xanh dương'], ['yellow', 'Vàng']]) {
      addBtn(label, tool === 'zone' && zoneColor === c, () => {
        zoneColor = c;
        selectTool('zone');
      }, { color: c });
    }
    sep();
    addBtn('Cờ', tool === 'flag', () => selectTool('flag'), { tool: 'flag' });
    addBtn('Xuất phát', tool === 'start', () => selectTool('start'), { tool: 'start' });
    addBtn('Xoay 90°', false, rotateStart, { act: 'rotate-start' });
    sep();
    addBtn('Xóa', tool === 'erase', () => selectTool('erase'), { tool: 'erase' });
  }

  function resetDraft() {
    size = parseSize($('ed-size') ? $('ed-size').value : '240x160');
    start = { x: 30, y: Math.round(size[1] / 2), dir: 0 };
    userItems = [];
    activeLine = null;
    dragStart = null;
    dragCur = null;
    tool = 'goal';
    renderTools();
    setTip(TIPS[tool]);
    draw();
  }

  function bindOnce() {
    if (bound) return;
    bound = true;
    const canvas = $('ed-canvas');
    const dialog = $('editor-dialog');

    $('ed-size').addEventListener('change', () => {
      size = parseSize($('ed-size').value);
      start.x = Math.max(15, Math.min(size[0] - 15, start.x));
      start.y = Math.max(15, Math.min(size[1] - 15, start.y));
      draw();
    });

    $('ed-clear').addEventListener('click', () => {
      userItems = [];
      activeLine = null;
      dragStart = null;
      dragCur = null;
      setTip('Đã xóa các vật trên sân.');
      draw();
    });

    $('ed-cancel').addEventListener('click', () => dialog.close());

    $('ed-save').addEventListener('click', () => {
      if (activeLine && activeLine.pts.length < 2) {
        const idx = userItems.indexOf(activeLine);
        if (idx >= 0) userItems.splice(idx, 1);
        activeLine = null;
      }
      const hasGoal = userItems.some(it => it.k === 'zone' && it.goal);
      if (!hasGoal) {
        setTip('Sa bàn chưa có Ô đích! Hãy chọn "Ô đích" rồi kéo trên sân trước khi lưu.', 'warn');
        if (window.SFX) window.SFX.buzz();
        return;
      }
      const [w, h] = parseSize($('ed-size').value);
      const name = ($('ed-name').value || '').trim() || 'Sa bàn của lớp';
      const about = ($('ed-about').value || '').trim() || 'Đưa xe tới ô đích.';
      const time = Math.max(3, Math.min(120, Number($('ed-time').value) || 15));
      const map = {
        id: 'tu-ve-' + Date.now(),
        name,
        about,
        level: 'pro',
        custom: true,
        size: [w, h],
        start: { x: Math.round(start.x), y: Math.round(start.y), dir: start.dir || 0 },
        items: [...frame(w, h), ...clone(userItems)],
        rules: { time, star3: 'noCrash', limit: 120 }
      };
      dialog.close();
      if (typeof onSaveCb === 'function') onSaveCb(map);
    });

    canvas.addEventListener('pointerdown', e => {
      if (e.button && e.button !== 0) return;
      try { canvas.setPointerCapture(e.pointerId); } catch { /* sự kiện giả lập */ }
      const pt = pointerToCm(canvas, e);
      if (tool === 'wall' || tool === 'goal' || tool === 'zone') {
        dragStart = pt;
        dragCur = pt;
        draw();
      } else if (tool === 'line') {
        if (!activeLine) {
          activeLine = { k: 'line', w: 2.5, pts: [pt] };
          userItems.push(activeLine);
        } else {
          const last = activeLine.pts[activeLine.pts.length - 1];
          if (Math.hypot(pt[0] - last[0], pt[1] - last[1]) >= 2) activeLine.pts.push(pt);
        }
        draw();
      } else if (tool === 'flag') {
        userItems.push({ k: 'flag', x: pt[0], y: pt[1] });
        draw();
      } else if (tool === 'start') {
        start.x = Math.max(15, Math.min(size[0] - 15, pt[0]));
        start.y = Math.max(15, Math.min(size[1] - 15, pt[1]));
        draw();
      } else if (tool === 'erase') {
        if (eraseAt(pt[0], pt[1])) setTip('Đã xóa vật.');
        draw();
      }
    });

    canvas.addEventListener('pointermove', e => {
      const pt = pointerToCm(canvas, e);
      cursorCm = pt;
      if (dragStart) {
        dragCur = pt;
        draw();
      } else if (activeLine && tool === 'line') {
        draw();
      }
    });

    const endDrag = e => {
      if (!dragStart) return;
      const pt = e ? pointerToCm(canvas, e) : dragCur || dragStart;
      const item = buildRectItem(tool, dragStart, pt);
      dragStart = null;
      dragCur = null;
      if (item) {
        if (item.goal) {
          userItems = userItems.filter(it => !(it.k === 'zone' && it.goal));
          setTip('Đã đặt Ô đích. Có thể vẽ thêm tường, vạch, cờ hoặc bấm "Lưu và chơi thử".');
        }
        userItems.push(item);
      }
      draw();
    };

    canvas.addEventListener('pointerup', endDrag);
    canvas.addEventListener('pointercancel', () => {
      dragStart = null;
      dragCur = null;
      draw();
    });
  }

  function open(onSave) {
    onSaveCb = onSave;
    bindOnce();
    const dialog = $('editor-dialog');
    if (!dialog.open) dialog.showModal();
    resetDraft();
  }

  window.CodeLabEditor = { open };
})();
