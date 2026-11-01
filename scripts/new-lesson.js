#!/usr/bin/env node
// Tạo / cập nhật một bài mô hình từ một file mô tả duy nhất: content/lop{G}/bai{NN}/lesson.json
//   node scripts/new-lesson.js lop1-bai05          – chưa có lesson.json: tạo bản mẫu để điền; có rồi: sinh bài
//   node scripts/new-lesson.js lop1-bai05 --check  – chỉ kiểm tra page.html và khối SPEC có khớp lesson.json không
// Luôn sinh lại: content/.../page.html và khối SPEC trong js/<thư mục>/lesson.js (giữa hai dòng đánh dấu).
// Chỉ tạo khi chưa có: lesson.js, <tên>-engine.js, <tên>-scene.js, tests/<id>.test.js, dòng đăng ký trong js/lessons.js.
// Phần viết tay (vật lý, hình vẽ, vị trí gói sáng tạo) không bao giờ bị ghi đè.
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const BEGIN = '  // <lesson.json> – phần dưới do scripts/new-lesson.js sinh từ ';
const END = '  // </lesson.json>';
const pad = n => String(n).padStart(2, '0');
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
const rel = p => path.relative(ROOT, p).replace(/\\/g, '/');

// ---------- đọc lesson.json và điền giá trị mặc định ----------
function load(id) {
  const m = /^lop(\d)-bai(\d\d)$/.exec(id);
  if (!m) throw new Error('Mã bài phải có dạng lop1-bai05');
  const G = +m[1], N = +m[2], NN = m[2];
  const dir = path.join(ROOT, 'content', `lop${G}`, `bai${NN}`);
  const file = path.join(dir, 'lesson.json');
  if (!fs.existsSync(file)) return { G, N, NN, dir, file, missing: true };
  const j = JSON.parse(fs.readFileSync(file, 'utf8'));
  const folder = j.folder || (G === 1 ? `bai${NN}` : `lop${G}-bai${NN}`);
  const store = j.store || (G === 1 ? `zm${N}_` : `zm${G}b${NN}_`);
  const S = {
    ...j,
    id, G, N, NN, dir, file, folder, store,
    label: j.label || `Bài ${N}`,
    code: j.code || (G === 1 ? `ZM${N}` : `ZM${G}-${NN}`),
    sheetName: j.sheetName || (G === 1 ? `Bài ${N}: ${j.title}` : `Lớp ${G} · Bài ${N}: ${j.title}`),
    baseName: j.baseName || cap(j.model),
    eyebrow: j.eyebrow || `Lớp ${G} · Bài ${N} · ${j.topic || j.title}`,
    model3d: j.model3d || j.model,
    firstStep: j.firstStep || j.title,
    bookAlt: j.bookAlt || 'Hình bước 1 trong sách hướng dẫn lắp ráp',
    defaultMode: j.defaultMode || (G >= 3 ? 'pro' : undefined),
    engineClass: j.engine.class,
    engineFile: j.engine.file,
    sceneFile: j.scene.file
  };
  // NV1 (lắp ráp) và NV4 (sáng tạo) giống nhau ở mọi bài – chỉ cần viết khi muốn đổi chữ
  const steps = j.steps;
  S.missions = {
    m1: { chip: `Lắp xong ${steps} bước`, tip: `Bấm “Đã lắp xong bước này” ở cả ${steps} bước`, title: `Lắp xong ${j.model}`,
      text: `Bấm “Đã lắp xong bước này” ở cả ${steps} bước của chặng Lắp ráp.`, go: ['assembly', 'Đến chặng lắp ráp'], ...(j.missions.m1 || {}) },
    m4: { chip: 'Thử nâng cấp sáng tạo', tip: 'Gắn gói nâng cấp ở chặng Sáng tạo, đưa vào sa bàn và cho động cơ chạy', title: `Thử ${j.model} sáng tạo`,
      text: 'Gắn thêm chi tiết ở chặng Sáng tạo, rồi quay lại chạy chương trình.', go: ['creative', 'Đến xưởng sáng tạo'], ...(j.missions.m4 || {}) },
    ...Object.fromEntries(Object.entries(j.missions).filter(([k]) => k !== 'm1' && k !== 'm4'))
  };
  const keys = Object.keys(S.missions).sort();
  S.core = keys.filter(k => !S.missions[k].pro);
  S.pro = keys.filter(k => S.missions[k].pro);
  return S;
}

// Chữ ký khối của chương trình mẫu (motor:low, wait:3, sensor_touch…) – để engine so với chương trình học sinh ghép
function sampleSig(sample) {
  const ctx = { window: {}, document: {} };
  vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'js/blocks-engine.js'), 'utf8'), ctx);
  const T = ctx.window.BLOCK_TEMPLATES;
  return sample.map(s => {
    const [name, extra] = Array.isArray(s) ? s : [s, {}];
    if (!T[name]) throw new Error('Không có khối "' + name + '" trong js/blocks-engine.js');
    const b = { ...T[name], ...extra };
    return b.type === 'motor' ? 'motor:' + b.speed : b.type === 'wait' ? 'wait:' + b.duration : b.type;
  });
}

// ---------- page.html ----------
function page(S) {
  const chip = (k, m) => `    <span class="chip${m.pro ? ' pro-only' : ''}" id="chip-${k}" title="${m.tip}"><i>${k.slice(1)}</i>${m.chip}</span>`;
  const meter = m =>
    `          <div class="meter${m.proOnly ? ' pro-only' : ''}"><dt>${m.label}</dt><dd><div class="v" id="${m.id}">${m.value ?? 0}${m.unit ? `<small>${m.unit}</small>` : ''}</div>` +
    `<div class="s"${m.noteId ? ` id="${m.noteId}"` : ''}>${m.note || ''}</div></dd></div>`;
  const sc = S.scene, img = `assets/${S.assetFolder || S.folder}/step-01.jpg`;
  const calcContent = `        <div class="panel-h"><h2>${S.calcTitle || 'Tính toán'}</h2><small>${S.calc}</small></div>\n        <div class="pad calc">\n          <p class="calc-eq" id="calc-eq1"></p>\n          <p class="calc-eq" id="calc-eq2"></p>\n        </div>`;
  const slots = [
    ['header-copy', `      <div class="eyebrow">${S.eyebrow}</div>\n      <h1>${S.title}</h1>\n      <p class="lede pro-only">${S.lede}</p>`],
    ['mission-chips', [...S.core, ...S.pro].map(k => chip(k, S.missions[k])).join('\n')],
    ['victory-copy', `      <p>${S.victory}</p>\n      <p class="code-line">Mã tham chiếu: <code id="verify-code-output">${S.code}</code></p>`],
    ['assembly-tab', `      <i>1</i><span><b>Lắp ráp</b><small>${S.steps} bước theo sách</small></span>`],
    ['assembly-count', `          <span class="pill" data-k="info"><span>Bước </span><b id="countNow">1</b><span id="countTotal"> / ${S.steps}</span></span>`],
    ['assembly-canvas', `              <canvas id="view" aria-label="${S.assemblyAria || `Mô hình ${S.model3d} 3D: kéo để xoay, cuộn để phóng to`}"></canvas>`],
    ['assembly-slider', `                <input id="slider" type="range" min="1" max="${S.steps}" value="1" aria-label="${S.sliderAria || 'Chọn bước lắp'}">`],
    ['assembly-meter-step', `          <div class="meter"><dt>Bước</dt><dd><div class="v" id="am-step">1<small>/ ${S.steps}</small></div><div class="s" id="am-step-s">${S.firstStep}</div></dd></div>`],
    ['assembly-meter-done', `          <div class="meter"><dt>Đã lắp xong</dt><dd><div class="v" id="am-done">0<small>/ ${S.steps}</small></div><div class="bar"><b id="am-done-bar"></b></div></dd></div>`],
    ['book-image', `          <img id="book-img" src="${img}" alt="${S.bookAlt}">`],
    ['book-link', `          <a id="book-pdf" class="link" href="${img}" target="_blank" rel="noopener">Mở hình lớn ↗</a>`],
    ['creative-intro', `          <p class="status-text">${S.creative.intro}</p>`],
    ['creative-canvas', `        <div class="canvas-box stage-3d" id="creative-stage" aria-label="${S.creative.canvasAria || `Mô hình ${S.model3d} 3D đang sáng tạo`}"></div>`],
    ['creative-slot-label', `        <div class="panel-h"><h2>${S.creative.slotTitle || 'Tự gắn chi tiết'}</h2>${S.creative.slotHint === null ? '' : `<small>${S.creative.slotHint ?? `${S.creative.slots} vị trí trên ${S.model}`}</small>`}</div>`],
    ['creative-result-label', `        <div class="panel-h"><h2>${S.creative.resultTitle || `${S.baseName} của em sẽ có`}</h2></div>`],
    ['sim-upgrade-label', `            <small id="sim-active-upgrade-badge" class="status-tag">${S.creative.badge || `${S.baseName} cơ bản`}</small>`],
    ['sim-scene', [
      `          <canvas id="space-scene" aria-label="${sc.aria}"></canvas>`,
      `          <div class="sim-stage" id="sim-stage" aria-label="${sc.stage}"></div>`,
      `          <p class="scene-idle" id="scene-idle">${sc.idle}</p>`,
      ...(sc.press ? ['          <button type="button" class="hand-btn press-btn" id="scene-press" title="Nhấn nút đỏ (cảm biến chạm) – hoặc phím cách" aria-label="Nhấn nút đỏ"><span aria-hidden="true"></span></button>'] : []),
      ...(sc.hand ? ['          <button type="button" class="hand-btn" id="scene-hand" title="Nhấn cảm biến chạm trên mô hình" aria-label="Nhấn cảm biến chạm">✋</button>'] : [])
    ].join('\n')],
    ['sim-meters', `        <dl class="meters${S.metersProOnly === false ? '' : ' pro-only'}">\n${S.meters.map(meter).join('\n')}\n        </dl>`],
    ['sim-calculation', S.calcProOnly ? `        <div class="pro-only">\n${calcContent}\n        </div>` : calcContent],
    ['sim-hint', `            <p class="hint">${S.hint}</p>`]
  ];
  return `<title>${S.pageTitle || S.title} · Lớp ${S.G} · Bài ${S.N} · Happy STEAM</title>\n` +
    slots.map(([k, v]) => `<template data-slot="${k}">\n${v}\n</template>\n`).join('\n');
}

// ---------- khối SPEC trong lesson.js ----------
function spec(S) {
  const card = k => {
    const m = S.missions[k];
    return { n: +k.slice(1), title: m.title, text: m.text, ...(m.go ? { go: m.go } : {}) };
  };
  const order = list => [...list.filter(k => k !== 'm1'), 'm1'];
  const o = {
    id: S.id, label: S.label, code: S.code, sheetName: S.sheetName, store: S.store, baseName: S.baseName, Engine: S.engineClass,
    ...(S.defaultMode ? { defaultMode: S.defaultMode } : {}),
    missions: { core: S.core, pro: S.pro },
    cards: Object.fromEntries([...S.core, ...S.pro].map(k => [k, card(k)])),
    cardOrder: { kid: order(S.core), pro: order([...S.core, ...S.pro]) },
    blocks: { toolbox: S.blocks.toolbox, pro: S.blocks.pro || [], sample: S.blocks.sample, empty: S.blocks.empty || ['start'] },
    sampleSig: sampleSig(S.blocks.sample),
    creative: { store: S.store.replace(/_$/, '') + '.creative', emptyText: `${S.baseName} cơ bản – chưa có tính năng mới.` }
  };
  return `${BEGIN}${rel(S.file)}, đừng sửa tay – sửa lesson.json rồi chạy lại\n  const SPEC = ${JSON.stringify(o, null, 2).replace(/\n/g, '\n  ')};\n${END}`;
}

// ---------- các file khung (chỉ tạo khi chưa có) ----------
const skeleton = {
  lesson: S => `// Cấu hình ${S.label} lớp ${S.G} – ${S.title}. Dữ liệu chung (nhiệm vụ, khối lệnh, mã bài) nằm trong khối SPEC,
// sinh từ ${rel(S.file)}. Phần viết tay ở dưới: ảnh sách, chi tiết gửi Google Sheets, gói sáng tạo.
(function () {
  'use strict';

${spec(S)}

  // Số lượng trong hộp kit và tên tiếng Việt của các chi tiết gói sáng tạo
  const KIT = {};
  const NAMES = {};
  // TODO: gói sáng tạo – xem js/bai10/lesson.js để làm mẫu
  const FEATURES = {};
  const SLOTS = [];
  const PRESETS = [];
  const PICS = {};
  // Vị trí 3D của chi tiết mỗi gói: trả về { 'slot:option': [chi tiết…] }
  function placements() {
    return {};
  }

  window.LESSON = {
    ...SPEC,
    book(d) {
      const src = \`assets/${S.folder}/step-\${String(d.page).padStart(2, '0')}.jpg\`;
      return {
        src,
        alt: \`Hình bước \${d.page} trong sách hướng dẫn lắp ráp\`,
        loc: \`Bước \${d.page} · trang \${d.page}\`,
        cap: d.page === ${S.steps} ? '${S.baseName} đã hoàn thành.' : 'Ô nền xanh là linh kiện cần lấy, viền đỏ là chỗ lắp.',
        pdf: src
      };
    },
    details(t) {
      const out = [];
      if (t.state.upgrades && t.state.upgrades.length) out.push('Gói nâng cấp: ' + t.state.upgrades.join(', '));
      return out.join(' · ');
    },
    creative: { ...SPEC.creative, kit: KIT, names: NAMES, features: FEATURES, slots: SLOTS, pics: PICS, presets: PRESETS, placements }
  };
})();
`,
  engine: S => `// Bộ mô phỏng ${S.label} lớp ${S.G} – ${S.title}. Phần chung (chạy khối, vòng lặp, nhật ký, nhiệm vụ) ở js/lesson-engine.js;
// ở đây chỉ viết vật lý của mô hình và cách chấm ${[...S.core, ...S.pro].filter(k => k !== 'm1' && k !== 'm4').join(', ')}.
(function () {
  'use strict';

  const MAX_RPM = 150; // động cơ ở mức 8
  const SAMPLE = (window.LESSON && window.LESSON.sampleSig) || ${JSON.stringify(sampleSig(S.blocks.sample))};

  class ${S.engineClass} extends window.LessonEngine {
    constructor() {
      super({ sample: SAMPLE, labels: {}, baseLabel: '${S.baseName} cơ bản', core: ${JSON.stringify(S.core)} });
      this.done = { ${[...S.core, ...S.pro].filter(k => k !== 'm1' && k !== 'm4').map(k => k + ': false').join(', ')} };
    }
    resetState() {
      this.rev = 0; // số vòng trục ra đã quay
    }
    rpm() {
      return this.motorOn ? (MAX_RPM * this.power) / 8 : 0;
    }
    pose3d() {
      return { output: this.rev * Math.PI * 2, motor: 0 };
    }
    onMotor() {
      this.emit('speed', this.power);
      this.noteUpgradeRun();
    }
    onStopBlock() {
      this.emit('speed', 0);
    }
    finish() {
      // NV2: chạy hết đúng chương trình mẫu
      if (this.matchesSample() && !this.done.m2) {
        this.done.m2 = true;
        this.log('ok', 'Chương trình chạy đúng như trong sách.');
        this.emit('sampleDone');
      }
      super.finish();
    }
    integrate(dt) {
      if (!this.running) return;
      this.runT += dt;
      this.rev += ((this.rpm() / 60) * dt * this.dir);
      // TODO: vật lý của bài và NV3/NV5 (đặt this.done.m3 = true rồi gọi this.checkMissions())
    }
    updateUI() {
      super.updateUI();
${S.meters.map(m => `      // this.set('${m.id}', …);`).join('\n')}
    }
  }

  window.${S.engineClass} = ${S.engineClass};
})();
`,
  scene: S => `// Cảnh câu chuyện ${S.label} lớp ${S.G} (chặng ③). Phần khung (vòng vẽ, thông báo, chùm sao, nút đỏ) ở js/scene-kit.js.
// Hình vẽ đẹp do Antigravity làm trong js/${S.folder}/art.js; đây là hình đơn giản để bài chạy được ngay.
(function () {
  'use strict';

  const W = 900,
    H = 560,
    G = 440;

  window.ZMSceneKit.create({
    W,
    H,
    draw(ctx, now, sim, kit) {
      const sky = ctx.createLinearGradient(0, 0, 0, G);
      sky.addColorStop(0, '#8fd3ff');
      sky.addColorStop(1, '#d9f1ff');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, G);
      ctx.fillStyle = '#8cc152';
      ctx.fillRect(0, G, W, H - G);
      // TODO: vẽ mô hình theo trạng thái sim
      ctx.save();
      ctx.translate(W / 2, G - 90);
      ctx.rotate(sim.rev * Math.PI * 2);
      ctx.fillStyle = '#3dc1dc';
      ctx.fillRect(-70, -10, 140, 20);
      ctx.restore();
      kit.label(sim.running ? 'Đang chạy' : '${S.baseName}', W / 2, G + 60, '#fff', 20);
    },
    onEvent(type, data, kit) {
      if (type === 'sampleDone') {
        kit.burst(W / 2, G - 90);
        kit.toast('ok', 'Đúng như trong sách!', 'Chương trình chạy đúng như mẫu.');
      }
    }
  });
})();
`,
  test: S => `// Chạy: node tests/${S.id}.test.js – cấu hình và bộ mô phỏng ${S.label} lớp ${S.G} (${S.title}), chỉ dùng Node.js built-in.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const context = { window: { addEventListener() {} }, document: { getElementById() { return null; } }, performance: { now: () => 0 }, Math };
for (const f of ['js/blocks-engine.js', 'js/${S.folder}/lesson.js', 'js/lesson-engine.js', 'js/${S.folder}/${S.engineFile}'])
  vm.runInNewContext(fs.readFileSync(path.join(root, f), 'utf8'), context);
const L = context.window.LESSON;
assert.equal(L.id, '${S.id}');
assert.ok(L.blocks.sample.length > 1, 'Có chương trình mẫu');

// Chạy chương trình mẫu đến hết → NV2
const T = context.window.BLOCK_TEMPLATES;
const program = L.blocks.sample.map(s => (Array.isArray(s) ? { ...T[s[0]], ...s[1] } : { ...T[s] }));
const sim = new context.window.${S.engineClass}();
let state;
sim.onMissionUpdate = s => (state = s);
sim.setProgram(program);
sim.start();
for (let t = 0; t < 60 && sim.running; t += 0.02) {
  if (sim.waitingPress) sim.press();
  sim.advance(0.02);
}
sim.checkMissions();
assert.equal(state.m2, true, 'Chạy đúng chương trình mẫu thì xong NV2');
// TODO: kiểm tra vật lý và NV3/NV5 của bài

console.log('PASS: ${S.id} – cấu hình, chương trình mẫu, NV2.');
`
};

// ---------- mẫu lesson.json để điền ----------
function template(G, N) {
  return {
    title: 'TODO Tên mô hình (vd. Cối xoay gió)',
    topic: 'TODO Tên chủ đề trong sách (vd. Bạn gió tinh nghịch, gió ở đâu?)',
    model: 'TODO tên mô hình viết thường, dùng trong câu (vd. cối xoay gió)',
    steps: 0,
    lede: 'TODO Một câu giới thiệu: lắp gì, lập trình gì, để làm gì.',
    victory: 'TODO Câu chúc mừng khi xong các nhiệm vụ chính.',
    engine: { class: 'TODOEngine', file: 'todo-engine.js' },
    scene: {
      file: 'todo-scene.js',
      aria: 'TODO Mô tả cảnh cho trình đọc màn hình',
      stage: 'TODO Mô hình 3D chạy theo chương trình',
      idle: 'Chạm khối <b>Start</b> màu vàng hoặc nút <b>▶</b> để bắt đầu',
      press: false
    },
    missions: {
      m2: { chip: 'Lập trình theo mẫu', tip: 'TODO chương trình mẫu: Start · …', title: 'Ghép khối giống hàng mẫu', text: 'TODO' },
      m3: { chip: 'TODO', tip: 'TODO', title: 'TODO', text: 'TODO' },
      m5: { pro: true, chip: 'TODO', tip: 'Nâng cao: TODO', title: 'TODO', text: 'TODO' }
    },
    blocks: { toolbox: ['highSpeed', 'lowSpeed', 'motorStop', 'wait'], pro: [], sample: ['start', 'highSpeed', ['wait', { duration: 3 }], 'motorStop'], empty: ['start'] },
    creative: { intro: 'TODO Lời dẫn xưởng sáng tạo', slots: 4 },
    meters: [{ label: 'Động cơ', id: 'm-rpm', value: 0, unit: 'vòng/phút', note: 'Đang dừng', noteId: 'm-rpm-note' }],
    calc: 'TODO Quan hệ cần tính',
    hint: '<b>NV2</b> TODO'
  };
}

// ---------- chạy ----------
function writeIfMissing(file, text, made) {
  if (fs.existsSync(file)) return;
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text);
  made.push(rel(file));
}
function register(S, made) {
  const f = path.join(ROOT, 'js/lessons.js');
  let src = fs.readFileSync(f, 'utf8');
  if (src.includes(`'${S.id}':`)) return;
  const j = s => `js/${S.folder}/${s}`;
  const entry = `    '${S.id}': {\n      content: 'lop${S.G}/bai${S.NN}',\n      scripts: ['${j('lesson.js')}', '${j(S.sceneFile)}', '${j(S.engineFile)}'],\n` +
    `      optional: ['${j('art.js')}'],\n      order: order('${j('lesson.js')}', '${j(S.sceneFile)}', '${j(S.engineFile)}', '${j('art.js')}')\n    }`;
  src = src.replace(/\n  \};\n\}\)\(\);\s*$/, `,\n${entry}\n  };\n})();\n`);
  fs.writeFileSync(f, src);
  made.push('js/lessons.js (đăng ký ' + S.id + ')');
}

function main() {
  const [id, flag] = process.argv.slice(2);
  if (!id) {
    console.log('Cách dùng: node scripts/new-lesson.js lop1-bai05 [--check]');
    process.exit(1);
  }
  const S = load(id);
  if (S.missing) {
    fs.mkdirSync(S.dir, { recursive: true });
    fs.writeFileSync(S.file, JSON.stringify(template(S.G, S.N), null, 2) + '\n');
    console.log(`Đã tạo ${rel(S.file)} – điền các mục TODO (xem content/lop1/bai10/lesson.json làm mẫu) rồi chạy lại lệnh này.`);
    return;
  }
  const pageFile = path.join(S.dir, 'page.html');
  const lessonFile = path.join(ROOT, 'js', S.folder, 'lesson.js');
  const html = page(S);
  if (flag === '--check') {
    const okPage = fs.existsSync(pageFile) && fs.readFileSync(pageFile, 'utf8') === html;
    const src = fs.existsSync(lessonFile) ? fs.readFileSync(lessonFile, 'utf8') : '';
    const okSpec = !src.includes(BEGIN) || src.includes(spec(S));
    console.log(`${id}: page.html ${okPage ? 'khớp' : 'KHÁC'} · SPEC ${src.includes(BEGIN) ? (okSpec ? 'khớp' : 'KHÁC') : 'không dùng'}`);
    process.exit(okPage && okSpec ? 0 : 1);
  }
  const made = [];
  fs.writeFileSync(pageFile, html);
  made.push(rel(pageFile));
  if (fs.existsSync(lessonFile)) {
    const src = fs.readFileSync(lessonFile, 'utf8');
    const a = src.indexOf(BEGIN), b = src.indexOf(END);
    if (a >= 0 && b > a) {
      fs.writeFileSync(lessonFile, src.slice(0, a) + spec(S) + src.slice(b + END.length));
      made.push(rel(lessonFile) + ' (khối SPEC)');
    }
  } else writeIfMissing(lessonFile, skeleton.lesson(S), made);
  writeIfMissing(path.join(ROOT, 'js', S.folder, S.engineFile), skeleton.engine(S), made);
  writeIfMissing(path.join(ROOT, 'js', S.folder, S.sceneFile), skeleton.scene(S), made);
  writeIfMissing(path.join(ROOT, 'tests', `${S.id}.test.js`), skeleton.test(S), made);
  register(S, made);
  console.log('Đã cập nhật:\n  ' + made.join('\n  '));
}

if (require.main === module) main();
module.exports = { load, page, spec, sampleSig };
