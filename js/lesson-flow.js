// js/lesson-flow.js – mạch bài kiểu "Khám phá → Tạo → Chia sẻ" cho bài có content/<bài>/flow.json.
// Thêm chặng Khám phá (truyện tranh + câu hỏi đoán) ở đầu, chặng Chia sẻ (ảnh, cảm nhận, câu hỏi, in nhật ký) ở cuối,
// nút "Tiếp theo" giữa các chặng, gom nút cài đặt vào menu, khối lệnh chỉ còn hình ở chế độ Bé.
// Không có code riêng cho bài: mọi chữ, ảnh, câu hỏi lấy từ window.LESSON_FLOW (lesson-boot.js nạp flow.json).
// Chạy trước app.js (cùng hàng zmReady) để app.js thấy đủ các tab khi dựng chặng.
(function () {
  'use strict';

  const F = window.LESSON_FLOW;
  const L = window.LESSON;
  const $ = id => document.getElementById(id);
  const KEY = L.store + 'flow';
  const MAX_PHOTOS = 4;

  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  function el(tag, attrs, html) {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (k === 'class') e.className = v;
      else if (k === 'text') e.textContent = v;
      else e.setAttribute(k, v);
    }
    if (html != null) e.innerHTML = html;
    return e;
  }

  // ---------- Lưu nhật ký của học sinh (theo bài, trên máy) ----------
  // { frame, answers: { 'explore:path': 'satellite', 'share:avoid': ... }, feel, note, photos: [dataURL] }
  let state = { frame: 0, answers: {}, feel: '', note: '', photos: [] };
  try {
    state = { ...state, ...JSON.parse(localStorage.getItem(KEY) || '{}') };
  } catch (e) {}
  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
      return true;
    } catch (e) {
      return false; // đầy bộ nhớ (ảnh lớn)
    }
  }

  // ---------- Đọc to bằng giọng tiếng Việt của máy ----------
  const synth = window.speechSynthesis;
  function speak(text) {
    if (!synth || (window.SFX && !window.SFX.enabled)) return;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const voice = synth.getVoices().find(v => /^vi/i.test(v.lang));
    u.lang = 'vi-VN';
    if (voice) u.voice = voice;
    u.rate = 0.9;
    synth.speak(u);
  }

  // Icon giao diện: nét đơn theo currentColor, cùng kiểu với icon của trình xem 3D (không dùng emoji)
  const svg = d => `<svg class="fl-svg" viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
  const ICON = {
    say: svg('<path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16.5 9a4 4 0 0 1 0 6M19 6.5a7.5 7.5 0 0 1 0 11"/>'),
    camera: svg('<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>'),
    cube: svg('<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z"/><path d="M4 7.5l8 4.5 8-4.5M12 12v9"/>'),
    orbit: svg('<circle cx="12" cy="12" r="4"/><ellipse cx="12" cy="12" rx="10" ry="4.5" transform="rotate(-25 12 12)"/>'),
    print: svg('<path d="M7 9V4h10v5"/><rect x="4" y="9" width="16" height="8" rx="1.5"/><path d="M7 14h10v6H7z"/>'),
    gear: svg('<circle cx="12" cy="12" r="3"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1"/>'),
    done: svg('<circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.8 2.8L16.5 9.5"/>'),
    todo: svg('<circle cx="12" cy="12" r="9"/>')
  };
  // Mặt cảm xúc: miệng và mắt khác nhau, đọc được cả khi không phân biệt màu
  const face = (mouth, eyes = '<circle cx="9" cy="10" r="1.2"/><circle cx="15" cy="10" r="1.2"/>') =>
    `<svg class="fl-face" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10"/>${eyes}<path d="${mouth}"/></svg>`;

  // Câu hỏi chọn bằng hình (dùng ở cả Khám phá và Chia sẻ); icon là đường dẫn ảnh trong assets/
  function choiceBlock(scope, q, onPick) {
    const box = el('div', { class: 'fl-q' });
    box.append(el('div', { class: 'fl-q-h' }, `<p>${esc(q.text)}</p>`));
    const say = el('button', { type: 'button', class: 'fl-say', 'aria-label': 'Đọc to câu hỏi', title: 'Đọc to' }, ICON.say);
    say.addEventListener('click', () => speak(q.text + ' ' + q.choices.map(c => c.label).join('. ')));
    box.firstChild.prepend(say);
    const row = el('div', { class: 'fl-choices', role: 'radiogroup', 'aria-label': q.text });
    const note = q.note ? el('p', { class: 'fl-note', text: q.note }) : null;
    const key = scope + ':' + q.id;
    const paint = () => {
      row.querySelectorAll('.fl-choice').forEach(b => b.setAttribute('aria-checked', String(b.dataset.id === state.answers[key])));
      if (note) note.hidden = !state.answers[key];
    };
    for (const c of q.choices) {
      const b = el('button', { type: 'button', class: 'fl-choice', role: 'radio', 'data-id': c.id },
        `<span class="fl-ico"><img src="${esc(c.icon)}" alt=""></span><span>${esc(c.label)}</span>`);
      b.addEventListener('click', () => {
        state.answers[key] = c.id;
        save();
        paint();
        if (window.SFX) window.SFX.click();
        speak(c.label);
        if (onPick) onPick(c);
      });
      row.append(b);
    }
    box.append(row);
    if (note) box.append(note);
    paint();
    return box;
  }

  // ---------- Tab và khung chặng ----------
  const nav = document.querySelector('.stages');
  function addTab(stage, title, sub, before) {
    const tab = el('button', {
      type: 'button', role: 'tab', class: 'stage-tab', id: 'tab-btn-' + stage, 'data-stage': stage,
      'aria-selected': 'false', 'aria-controls': 'stage-' + stage
    }, `<i></i><span><b>${esc(title)}</b><small>${esc(sub)}</small></span>`);
    nav.insertBefore(tab, before || null);
    return tab;
  }
  function addPane(stage, before) {
    const pane = el('section', { class: 'stage-pane flow-pane', id: 'stage-' + stage, role: 'tabpanel', 'aria-labelledby': 'tab-btn-' + stage });
    pane.hidden = true;
    const panes = document.querySelectorAll('.stage-pane');
    const ref = before || panes[panes.length - 1].nextSibling;
    ref.parentNode.insertBefore(pane, ref);
    return pane;
  }

  // ---------- Chặng Khám phá: truyện động (tự chạy, chuyển động, có lời đọc) + clip thật tùy bài ----------
  // Khung: { img, text, audio?, move? }. audio: giọng thu sẵn (mp3/m4a), không có thì máy đọc.
  // move: zoom-in | zoom-out | pan-left | pan-right (bỏ trống thì lần lượt). Máy bật "giảm chuyển động" thì đứng yên.
  // Clip: explore.clip = { src, poster?, caption, credit, start?, end?, muted? }: phim thật ngắn, lưu trên máy chủ của mình, ghi rõ nguồn.
  // start/end (giây) phát một đoạn của phim dài mà không cần cắt file; muted: tắt tiếng (vd. lời tiếng Anh).
  const MOVES = ['zoom-in', 'pan-left', 'zoom-out', 'pan-right'];
  const KEYFRAMES = {
    'zoom-in': [{ transform: 'scale(1)' }, { transform: 'scale(1.12)' }],
    'zoom-out': [{ transform: 'scale(1.12)' }, { transform: 'scale(1)' }],
    'pan-left': [{ transform: 'scale(1.1) translateX(3%)' }, { transform: 'scale(1.1) translateX(-3%)' }],
    'pan-right': [{ transform: 'scale(1.1) translateX(-3%)' }, { transform: 'scale(1.1) translateX(3%)' }]
  };
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const PLAY = svg('<path d="M8 5v14l11-7z"/>');
  const PAUSE = svg('<path d="M8 5v14M16 5v14"/>');

  function buildExplore() {
    const E = F.explore;
    addTab('explore', 'Khám phá', E.title, nav.firstElementChild);
    const pane = addPane('explore', $('stage-assembly'));
    const clip = E.clip ? `
      <article class="panel fl-clip">
        <div class="panel-h"><h2>Ngoài đời thật</h2></div>
        <video id="fl-video" controls playsinline preload="none" src="${esc(E.clip.src)}${E.clip.start != null ? `#t=${+E.clip.start}${E.clip.end != null ? `,${+E.clip.end}` : ''}` : ''}"${E.clip.muted ? ' muted' : ''}${E.clip.poster ? ` poster="${esc(E.clip.poster)}"` : ''}></video>
        <p class="panel-note">${esc(E.clip.caption || '')}${E.clip.credit ? ` · Nguồn: ${esc(E.clip.credit)}` : ''}</p>
      </article>` : '';
    pane.innerHTML = `
      <article class="panel fl-story">
        <div class="fl-frame">
          <img id="fl-img" alt="">
          <button type="button" class="fl-start" id="fl-start">${PLAY}<span>Xem truyện</span></button>
          <button type="button" class="round fl-prev" id="fl-prev" aria-label="Khung trước"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg></button>
          <button type="button" class="round fl-next" id="fl-next" aria-label="Khung tiếp"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg></button>
        </div>
        <div class="fl-caption">
          <button type="button" class="fl-say fl-play" id="fl-play" aria-label="Tự chạy truyện" aria-pressed="false" title="Tự chạy truyện"></button>
          <p id="fl-text" aria-live="polite"></p>
          <button type="button" class="fl-say" id="fl-say" aria-label="Đọc lại khung này" title="Đọc lại">${ICON.say}</button>
        </div>
        <div class="fl-dots" id="fl-dots"></div>
      </article>${clip}
      <div id="fl-explore-q"></div>`;
    const frames = E.frames;
    const dots = $('fl-dots');
    const img = $('fl-img');
    let playing = false, timer = 0, poll = 0, audio = null, turn = 0;

    function quiet() {
      clearTimeout(timer);
      clearInterval(poll);
      turn++; // lời đọc cũ kết thúc muộn thì bỏ qua
      if (synth) synth.cancel();
      if (audio) audio.pause();
      audio = null;
    }
    // Đọc lời khung rồi gọi done: giọng thu sẵn > giọng máy > chỉ chờ theo độ dài câu (tắt tiếng / máy không đọc được)
    function narrate(f, done) {
      quiet();
      const my = turn;
      const wait = Math.max(4500, f.text.length * 80);
      const end = () => my === turn && done();
      const after = ms => {
        clearTimeout(timer);
        timer = setTimeout(end, ms);
      };
      const soundOn = !(window.SFX && !window.SFX.enabled);
      after(wait + 6000); // lưới an toàn nếu không nhận được tín hiệu đọc xong
      if (soundOn && f.audio) {
        audio = new Audio(f.audio);
        audio.onended = () => after(700);
        audio.play().catch(() => after(wait));
      } else if (soundOn && synth) {
        speak(f.text);
        if (!synth.speaking && !synth.pending) after(wait);
        else poll = setInterval(() => {
          if (synth.speaking || synth.pending) return;
          clearInterval(poll);
          after(700);
        }, 250);
      } else after(wait);
      return wait;
    }
    function animate(f, ms) {
      img.getAnimations().forEach(a => a.cancel());
      const k = KEYFRAMES[f.move || MOVES[state.frame % MOVES.length]];
      if (!reduced && k) img.animate(k, { duration: ms + 1500, easing: 'ease-in-out', fill: 'forwards' });
    }
    function setPlaying(on) {
      playing = on;
      if (!on) {
        quiet();
        img.getAnimations().forEach(a => a.pause());
      }
      $('fl-play').innerHTML = on ? PAUSE : PLAY;
      $('fl-play').setAttribute('aria-pressed', String(on));
    }
    function step() {
      const f = frames[state.frame];
      animate(f, narrate(f, () => {
        if (state.frame < frames.length - 1) {
          show(state.frame + 1);
          step();
        } else {
          setPlaying(false);
          $('fl-explore-q').scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'nearest' });
        }
      }));
    }
    function play(from) {
      pane.classList.add('has-started');
      if (from != null) show(from);
      setPlaying(true);
      step();
    }
    function show(i) {
      state.frame = Math.max(0, Math.min(frames.length - 1, i));
      save();
      const f = frames[state.frame];
      img.getAnimations().forEach(a => a.cancel());
      img.src = f.img;
      img.alt = f.text;
      $('fl-text').textContent = f.text;
      $('fl-prev').disabled = state.frame === 0;
      $('fl-next').disabled = state.frame === frames.length - 1;
      [...dots.children].forEach((d, k) => d.setAttribute('aria-current', String(k === state.frame)));
      // Câu hỏi đoán hiện khi đã xem tới khung cuối
      $('fl-explore-q').hidden = state.frame < frames.length - 1 && !state.answers['explore:' + E.question.id];
    }
    // Chuyển khung bằng tay: dừng tự chạy, đọc khung mới
    const jump = i => {
      pane.classList.add('has-started');
      setPlaying(false);
      show(i);
      speak(frames[state.frame].text);
    };
    frames.forEach((f, i) => {
      const d = el('button', { type: 'button', 'aria-label': 'Khung ' + (i + 1) });
      d.addEventListener('click', () => jump(i));
      dots.append(d);
    });
    $('fl-prev').addEventListener('click', () => jump(state.frame - 1));
    $('fl-next').addEventListener('click', () => jump(state.frame + 1));
    $('fl-say').addEventListener('click', () => speak(frames[state.frame].text));
    $('fl-play').addEventListener('click', () => (playing ? setPlaying(false) : play(state.frame === frames.length - 1 ? 0 : null)));
    $('fl-start').addEventListener('click', () => play(0));
    if ($('fl-video')) $('fl-video').addEventListener('play', () => setPlaying(false));
    window.addEventListener('zm:stage', e => playing && e.detail.stage !== 'explore' && setPlaying(false));
    const q = choiceBlock('explore', E.question);
    q.classList.add('panel');
    q.insertAdjacentHTML('afterbegin', '<span class="fl-tag">Em đoán xem</span>');
    $('fl-explore-q').append(q);
    if (state.frame) pane.classList.add('has-started');
    show(state.frame || 0);
    setPlaying(false);
  }

  // ---------- Chặng Chia sẻ ----------
  function shrink(src, max = 640) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const k = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * k);
        c.height = Math.round(img.height * k);
        const g = c.getContext('2d');
        g.fillStyle = '#fff';
        g.fillRect(0, 0, c.width, c.height);
        g.drawImage(img, 0, 0, c.width, c.height);
        resolve(c.toDataURL('image/jpeg', 0.72));
      };
      img.onerror = reject;
      img.src = src;
    });
  }
  function canvasShot(id) {
    const cv = $(id);
    if (!cv || !cv.width || !cv.height) return null;
    try {
      return cv.toDataURL('image/png');
    } catch (e) {
      return null;
    }
  }

  const FEELS = [
    { id: 'love', icon: face('M7.5 13.5q4.5 5 9 0z'), label: 'Vui lắm' },
    { id: 'like', icon: face('M8 14.5q4 3 8 0'), label: 'Thích' },
    { id: 'ok', icon: face('M8.5 15h7'), label: 'Bình thường' },
    { id: 'hard', icon: face('M8 16q4-3 8 0', '<path d="M7.5 9l3 1.5M16.5 9l-3 1.5"/>'), label: 'Khó quá' }
  ];

  function buildShare() {
    const S = F.share;
    addTab('share', 'Chia sẻ', 'Nhật ký của em');
    const pane = addPane('share');
    pane.classList.add('grid');
    pane.innerHTML = `
      <div class="col">
        <article class="panel">
          <div class="panel-h"><h2>Ảnh của em</h2><small id="fl-photo-count"></small></div>
          <p class="panel-note">${esc(S.photoHint || '')}</p>
          <div class="fl-photos" id="fl-photos"></div>
          <div class="pad actions">
            <label class="btn btn-primary fl-file">${ICON.camera}Chụp ảnh mô hình<input type="file" id="fl-file" accept="image/*" capture="environment" hidden></label>
            <button type="button" class="btn" id="fl-shot-3d">${ICON.cube}Chụp mô hình 3D</button>
            <button type="button" class="btn" id="fl-shot-sim">${ICON.orbit}Chụp sa bàn</button>
          </div>
          <p class="hint pad" id="fl-photo-msg" role="status"></p>
        </article>
        <article class="panel">
          <div class="panel-h"><h2>Em thấy bài này thế nào?</h2></div>
          <div class="fl-feels" id="fl-feels" role="radiogroup" aria-label="Em thấy bài này thế nào?"></div>
        </article>
      </div>
      <div class="col">
        <article class="panel">
          <div class="panel-h"><h2>Em nghĩ gì?</h2></div>
          <div id="fl-share-q"></div>
          <div class="pad">
            <label class="field">Em muốn kể thêm (không bắt buộc)<textarea id="fl-note" rows="3" placeholder="Ví dụ: Em làm vệ tinh có chảo ra-đa…"></textarea></label>
          </div>
        </article>
        <article class="panel">
          <div class="panel-h"><h2>Em đã làm được</h2></div>
          <ul class="fl-done" id="fl-done"></ul>
          <p class="panel-note" id="fl-details"></p>
          <div class="pad actions">
            <button type="button" class="btn btn-primary" id="fl-print">${ICON.print}In nhật ký / lưu PDF</button>
          </div>
        </article>
      </div>`;

    // Ảnh
    const msg = t => ($('fl-photo-msg').textContent = t || '');
    function paintPhotos() {
      const box = $('fl-photos');
      box.replaceChildren();
      state.photos.forEach((src, i) => {
        const f = el('figure', { class: 'fl-photo' }, `<img src="${src}" alt="Ảnh ${i + 1} của em">`);
        const del = el('button', { type: 'button', class: 'fl-del', 'aria-label': `Xóa ảnh ${i + 1}`, title: 'Xóa ảnh' }, '×');
        del.addEventListener('click', () => {
          state.photos.splice(i, 1);
          save();
          paintPhotos();
        });
        f.append(del);
        box.append(f);
      });
      if (!state.photos.length) box.append(el('p', { class: 'fl-empty', text: 'Chưa có ảnh nào.' }));
      $('fl-photo-count').textContent = `${state.photos.length}/${MAX_PHOTOS}`;
      const full = state.photos.length >= MAX_PHOTOS;
      ['fl-shot-3d', 'fl-shot-sim'].forEach(id => ($(id).disabled = full));
      $('fl-file').disabled = full;
      $('fl-file').parentElement.classList.toggle('is-disabled', full);
    }
    async function addPhoto(src) {
      if (!src) return msg('Chưa chụp được. Em mở chặng đó ra xem trước rồi thử lại nhé.');
      if (state.photos.length >= MAX_PHOTOS) return msg(`Tối đa ${MAX_PHOTOS} ảnh. Xóa bớt một ảnh để thêm.`);
      try {
        state.photos.push(await shrink(src));
      } catch (e) {
        return msg('Không mở được ảnh này.');
      }
      if (!save()) {
        state.photos.pop();
        return msg('Máy hết chỗ lưu ảnh. Xóa bớt một ảnh rồi thử lại.');
      }
      msg('');
      if (window.SFX) window.SFX.click();
      paintPhotos();
    }
    $('fl-file').addEventListener('change', e => {
      const file = e.target.files[0];
      e.target.value = '';
      if (!file) return;
      const r = new FileReader();
      r.onload = () => addPhoto(r.result);
      r.readAsDataURL(file);
    });
    $('fl-shot-3d').addEventListener('click', () => addPhoto(window.robotViewer ? window.robotViewer.snapshot() : null));
    $('fl-shot-sim').addEventListener('click', () => addPhoto(canvasShot('space-scene')));
    paintPhotos();

    // Cảm nhận
    const feels = $('fl-feels');
    for (const f of FEELS) {
      const b = el('button', { type: 'button', class: 'fl-feel', role: 'radio', 'data-id': f.id },
        `<span class="fl-ico">${f.icon}</span><span>${f.label}</span>`);
      b.addEventListener('click', () => {
        state.feel = f.id;
        save();
        paintFeel();
        speak(f.label);
      });
      feels.append(b);
    }
    const paintFeel = () => feels.querySelectorAll('.fl-feel').forEach(b => b.setAttribute('aria-checked', String(b.dataset.id === state.feel)));
    paintFeel();

    // Câu hỏi suy ngẫm; câu trùng id với câu đoán ở Khám phá thì nhắc lại em đã đoán gì
    const qbox = $('fl-share-q');
    for (const q of S.questions) {
      const block = choiceBlock('share', q);
      if (F.explore.question.id === q.id) block.insertBefore(el('p', { class: 'fl-guess', 'data-q': q.id, hidden: '' }), block.children[1]);
      qbox.append(block);
    }

    $('fl-note').value = state.note || '';
    $('fl-note').addEventListener('input', e => {
      state.note = e.target.value.slice(0, 500);
      save();
    });
    $('fl-print').addEventListener('click', printJournal);
  }

  // Nhiệm vụ đang tính (Bé: chính; Nâng cao: thêm phần nâng cao) và trạng thái xong
  function missionList() {
    const app = window.ZMApp;
    if (!app) return [];
    const pro = document.documentElement.dataset.mode === 'pro';
    const keys = [...L.missions.core, ...(pro ? L.missions.pro || [] : [])];
    return keys.map(k => ({ k, title: (L.cards[k] || {}).title || k, done: !!app.missions.missions[k] }));
  }
  function refreshShare() {
    const list = missionList();
    $('fl-done').innerHTML = list.map(m => `<li data-done="${m.done}">${m.done ? ICON.done : ICON.todo}${esc(m.title)}</li>`).join('');
    const d = window.ZMApp && L.details ? L.details(window.ZMApp.missions) : '';
    $('fl-details').textContent = d;
    $('fl-details').hidden = !d;
    // Nhắc lại câu em đã đoán ở Khám phá
    for (const p of document.querySelectorAll('.fl-guess')) {
      const c = F.explore.question.choices.find(x => x.id === state.answers['explore:' + p.dataset.q]);
      p.hidden = !c;
      if (c) p.innerHTML = `Lúc đầu em đoán: <b>${esc(c.label)}</b>`;
    }
  }

  function printJournal() {
    const name = localStorage.getItem('zm_student_name') || '';
    const cls = localStorage.getItem('zm_student_class') || '';
    const all = [{ scope: 'explore', q: F.explore.question, label: 'Lúc đầu em đoán' }, ...F.share.questions.map(q => ({ scope: 'share', q }))];
    const answers = all.map(({ scope, q, label }) => {
      const c = q.choices.find(x => x.id === state.answers[scope + ':' + q.id]);
      return `<p><b>${esc(label || q.text)}</b><br>${c ? esc(c.label) : '—'}</p>`;
    }).join('');
    const feel = FEELS.find(f => f.id === state.feel);
    let out = $('flow-print');
    if (!out) document.body.append((out = el('div', { id: 'flow-print' })));
    out.innerHTML = `
      <h1>Nhật ký: ${esc(document.title.split(' · ')[0])}</h1>
      <p class="pmeta">${esc(L.sheetName)}${name ? ' · ' + esc(name) : ''}${cls ? ' · Lớp ' + esc(cls) : ''} · ${new Date().toLocaleDateString('vi-VN')}</p>
      <div class="fp-photos">${state.photos.map(src => `<img src="${src}" alt="">`).join('')}</div>
      <h2>Em đã làm được</h2>
      <ul>${missionList().map(m => `<li>${m.done ? ICON.done : ICON.todo}${esc(m.title)}</li>`).join('')}</ul>
      <h2>Em nghĩ gì</h2>${answers}
      ${feel ? `<p><b>Em thấy bài này:</b> ${feel.label}</p>` : ''}
      ${state.note ? `<p><b>Em kể thêm:</b> ${esc(state.note)}</p>` : ''}`;
    document.documentElement.classList.add('print-flow');
    const done = () => document.documentElement.classList.remove('print-flow');
    window.addEventListener('afterprint', done, { once: true });
    window.print();
  }

  // ---------- Nút "Tiếp theo" dưới mỗi chặng ----------
  function buildNextBar() {
    const bar = el('div', { class: 'fl-nextbar' }, `
      <button type="button" class="btn" id="fl-back"></button>
      <button type="button" class="btn btn-primary" id="fl-go"></button>`);
    const panes = document.querySelectorAll('.stage-pane');
    panes[panes.length - 1].after(bar);
    const tabs = () => [...document.querySelectorAll('.stage-tab')];
    const name = t => t.querySelector('b').textContent;
    window.addEventListener('zm:stage', e => {
      const list = tabs();
      const i = list.findIndex(t => t.dataset.stage === e.detail.stage);
      const prev = list[i - 1], next = list[i + 1];
      $('fl-back').hidden = !prev;
      $('fl-go').hidden = !next;
      if (prev) $('fl-back').textContent = '← ' + name(prev);
      if (next) $('fl-go').textContent = `Tiếp theo: ${name(next)} →`;
      $('fl-back').onclick = () => prev && go(prev.dataset.stage);
      $('fl-go').onclick = () => next && go(next.dataset.stage);
      document.documentElement.dataset.flowStage = e.detail.stage;
      if (e.detail.stage === 'share') refreshShare();
      if (synth) synth.cancel();
    });
    const go = stage => {
      if (window.SFX) window.SFX.click();
      window.ZMStages.go(stage);
      nav.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
  }

  // ---------- Đầu trang gọn: Âm thanh, Giao diện, Giáo viên vào menu Cài đặt ----------
  function tidyHeader() {
    const tools = document.querySelector('.tools-top');
    const wrap = el('div', { class: 'fl-menu' });
    const btn = el('button', { type: 'button', class: 'iconbtn', id: 'btn-flow-menu', 'aria-expanded': 'false', 'aria-haspopup': 'true', title: 'Cài đặt' }, ICON.gear + 'Cài đặt');
    const pop = el('div', { class: 'fl-menu-pop panel', id: 'fl-menu-pop' });
    pop.hidden = true;
    for (const id of ['btn-toggle-sound', 'btn-toggle-theme', 'btn-teacher-settings']) if ($(id)) pop.append($(id));
    const open = on => {
      pop.hidden = !on;
      btn.setAttribute('aria-expanded', String(on));
    };
    btn.addEventListener('click', e => {
      e.stopPropagation();
      open(pop.hidden);
    });
    document.addEventListener('click', e => !wrap.contains(e.target) && open(false));
    document.addEventListener('keydown', e => e.key === 'Escape' && open(false));
    wrap.append(btn, pop);
    tools.append(wrap);
  }

  // ---------- Khối lệnh chỉ có hình (chế độ Bé): chạm khối trong khay thì đọc tên khối ----------
  function iconBlocks() {
    const box = $('block-toolbox');
    if (!box) return;
    box.addEventListener('click', e => {
      const item = e.target.closest('.zb-item');
      if (!item || document.documentElement.dataset.mode !== 'kid') return;
      const cap = item.querySelector('.zb-caption');
      if (cap) speak(cap.textContent);
    });
  }

  zmReady(() => {
    document.documentElement.classList.add('has-flow');
    buildExplore();
    buildShare();
    nav.classList.add('stages-' + nav.children.length);
    [...nav.children].forEach((tab, i) => {
      tab.querySelector('i').textContent = i + 1;
      tab.dataset.phase = tab.dataset.stage === 'explore' ? 'explore' : tab.dataset.stage === 'share' ? 'share' : 'create';
    });
    buildNextBar();
    tidyHeader();
    iconBlocks();
  });
})();
