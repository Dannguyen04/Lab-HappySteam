// Chạy: node tests/lop1-bai19.test.js – cấu hình, mô hình 3D và bộ mô phỏng Lớp 1 Bài 19 (Ốc sên quý hiếm), chỉ dùng Node.js built-in.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
(async () => {
  const context = {
    window: { addEventListener() {} },
    document: { getElementById() { return null; } },
    performance: { now: () => 0 },
    cancelAnimationFrame() {},
    requestAnimationFrame() { return 0; },
    setTimeout: fn => fn(),
    Math
  };

  // ---------- dữ liệu 3D ----------
  await require('./helpers/lesson-3d')(context, 'lop1/bai19');
  const model = context.window.LESSON_3D_DATA;
  assert.equal(model.steps, 21, 'Sách lắp ráp có 21 bước');
  assert.equal(model.instances.length, 49, 'Mô hình CAD gồm 49 linh kiện');
  assert.equal(model.instances.filter(p => p.step === 21).length, 0, 'Bước 21 chỉ để quan sát');
  const source = JSON.parse(fs.readFileSync(path.join(root, 'content/lop1/bai19/build.json'), 'utf8'));
  for (const [name, count] of Object.entries({ antenna: 2, glow: 2, grip: 1, eyes: 2 })) {
    const refs = model.creative?.[name];
    assert.equal(refs?.length, count, `Thiếu mesh sáng tạo ${name}`);
    for (const i of refs) {
      assert.ok(model.meshes[i]?.v > 0 && model.meshes[i]?.z?.length > 0, `Mesh ${name}:${i} chưa tải được hình học`);
      assert.ok(fs.existsSync(path.join(root, source.meshes[i])), `Thiếu tệp mesh ${name}:${i}`);
    }
  }

  // ---------- cấu hình ----------
  for (const f of ['js/blocks-engine.js', 'js/lop1-bai19/lesson.js', 'js/lesson-engine.js', 'js/lop1-bai19/snail-engine.js'])
    vm.runInNewContext(fs.readFileSync(path.join(root, f), 'utf8'), context);
  const L = context.window.LESSON;
  assert.equal(L.id, 'lop1-bai19');
  assert.equal(L.Engine, 'SnailEngine');
  assert.equal(L.defaultMode, undefined, 'Lớp 1 mặc định chế độ Bé');
  assert.equal(JSON.stringify(L.missions), '{"core":["m1","m2","m3","m4"],"pro":["m5"]}');
  for (const m of [...L.missions.core, ...L.missions.pro]) assert.ok(L.cards[m], 'Thiếu thẻ ' + m);
  // Chế độ Bé: mọi câu hướng dẫn ≤ 15 chữ
  for (const m of L.missions.core) {
    for (const s of L.cards[m].text.split(/(?<=[.!?])\s+/)) assert.ok(s.split(/\s+/).length <= 15, `Câu quá dài (${m}): ${s}`);
  }
  assert.equal(L.creative.slots.length, 4);
  for (const p of L.creative.presets) assert.ok(L.creative.pics[p.id].startsWith('<svg'), 'Thiếu hình gói ' + p.id);
  const placed = L.creative.placements(model, {
    make: (_, pos, rot, meshes, tag) => ({ pos, rot, meshes, tag }),
    box: i => ({ lo: i.pos.map(v => v - 0.01), hi: i.pos.map(v => v + 0.01), center: i.pos }),
    by: n => { const l = model.instances.filter(p => p.name === n); return n === 'BP-8850' ? l : l[0]; }
  });
  for (const k of ['head:antenna', 'shell:glow', 'wheel:grip', 'eye:eyes']) assert.ok(placed[k].length > 0, 'Gói chưa có vị trí gắn: ' + k);
  assert.equal(placed['wheel:grip'].length, 2, 'Vành gai gắn đủ hai bánh');
  const page = fs.readFileSync(path.join(root, 'content/lop1/bai19/page.html'), 'utf8');
  for (const slot of ['header-copy', 'assembly-canvas', 'book-image', 'creative-canvas', 'sim-scene', 'sim-meters']) assert.ok(page.includes(`data-slot="${slot}"`), 'Thiếu vị trí trang ' + slot);
  for (let i = 1; i <= 21; i++) {
    const src = `assets/lop1-bai19/step-${String(i).padStart(2, '0')}.jpg`;
    const bytes = fs.readFileSync(path.join(root, src));
    assert.ok(bytes.length > 1000 && bytes[0] === 0xff && bytes[1] === 0xd8, 'Ảnh sách thiếu hoặc lỗi: ' + src);
    assert.equal(L.book({ page: i }).src, src);
  }

  // ---------- mô phỏng ----------
  const T = context.window.BLOCK_TEMPLATES;
  const build = (list, edit = {}) => list.map((s, i) => {
    const b = Array.isArray(s) ? { ...T[s[0]], ...s[1] } : { ...T[s] };
    return edit[i] ? { ...b, ...edit[i] } : b;
  });
  const SAMPLE = L.blocks.sample;
  const WAIT_FWD = SAMPLE.findIndex(s => Array.isArray(s)); // khối Chờ sau Tiến thẳng
  const WAIT_TURN = SAMPLE.length - 2; // khối Chờ sau Rẽ trái
  assert.equal(SAMPLE[WAIT_TURN][1].duration, 0.2);
  function run({ fwd = 1, turn = 0.2, advanced = false, upgrades = [], program, hand = false } = {}) {
    const sim = new context.window.SnailEngine();
    let state = {};
    const events = [];
    sim.onMissionUpdate = s => (state = s);
    sim.onEvent = (t, d) => events.push(t);
    if (advanced) sim.setAdvanced(true);
    sim.setUpgrades(upgrades);
    sim.setProgram(program || build(SAMPLE, { [WAIT_FWD]: { duration: fwd }, [WAIT_TURN]: { duration: turn } }));
    sim.start();
    if (hand) sim.putHand();
    for (let t = 0; t < 40 && sim.running; t += 0.016) sim.advance(0.016);
    sim.checkMissions();
    return { sim, state, events };
  }

  // Mẫu nguyên bản: NV2 đạt, nhưng chưa ăn đủ lá (ốc sên húc đá ở vòng sau)
  let r = run();
  assert.equal(r.state.m2, true, 'Chạy đúng chương trình mẫu thì xong NV2');
  assert.notEqual(r.state.m3, true, 'Mẫu nguyên bản chưa đạt NV3');
  assert.ok(r.events.includes('bump') && r.sim.bumpStone >= 0, 'Rẽ thiếu thì húc đá');
  assert.ok(r.events.includes('sampleDone'));
  // Chỉnh thời gian rẽ lên khoảng 1 giây → ăn đủ 3 lá
  for (const turn of [0.8, 1, 1.2]) {
    r = run({ turn });
    assert.equal(r.state.m3, true, `Rẽ ${turn} giây phải ăn đủ 3 lá`);
    assert.equal(r.sim.left(), 0);
    assert.equal(r.state.allDone, false, 'Chưa lắp ráp/sáng tạo thì chưa xong cả bài');
  }
  // Rẽ vừa thiếu: húc đá; rẽ quá nhiều: quay tròn / lệch
  for (const turn of [0.1, 0.3, 0.5]) assert.notEqual(run({ turn }).state.m3, true, `Rẽ ${turn} giây phải trượt`);
  r = run({ turn: 1.9 });
  assert.notEqual(r.state.m3, true, 'Rẽ quá nhiều phải trượt');
  // Tiến sai thì trượt dù rẽ đúng
  assert.notEqual(run({ fwd: 1.5, turn: 1 }).state.m3, true, 'Tiến quá lâu thì húc đá');
  // Không thấy vật cản: chờ và hết giờ (cần ✋)
  r = run({ program: build(['start', 'repeatStart', 'obstacle', 'moveForward', 'repeatEnd']) });
  r = run({ program: build(['start', 'obstacle', 'moveForward', ['wait', { duration: 1 }]]), hand: true });
  assert.ok(r.sim.seen, 'Bàn tay ✋ làm cảm biến thấy vật cản');
  // Quay tròn tại chỗ khi chỉ có Rẽ trái và không vật cản nào trong nón
  const spin = run({ program: build(['start', 'repeatStart', 'turnLeft', ['wait', { duration: 0.5 }], 'obstacle', 'moveForward', 'repeatEnd']) });
  assert.ok(spin.sim.left() > 0 && !spin.state.m3);
  // NV4: gói sáng tạo + chạy
  r = run({ upgrades: ['glow'] });
  assert.equal(r.state.m4, true, 'Gắn gói rồi cho chạy thì xong NV4');
  assert.equal(run().state.m4, false);

  // Nâng cao: đoạn đầu vườn có nhớt dính, ốc sên bò chậm
  r = run({ advanced: true });
  assert.equal(r.state.m2, true, 'Mẫu vẫn chạy hết một vòng ở Nâng cao');
  assert.notEqual(r.state.m5, true, 'Mẫu nguyên bản chưa đạt NV5');
  r = run({ advanced: true, turn: 1 });
  assert.notEqual(r.state.m5, true, 'Đáp án của chế độ Bé trượt vì nhớt dính (Tiến 1 giây còn ngắn)');
  r = run({ advanced: true, fwd: 2, turn: 1 });
  assert.equal(r.state.m5, true, 'Tiến 2 giây, rẽ 1 giây đạt NV5');
  assert.equal(r.state.m3, true);
  r = run({ advanced: true, fwd: 4, turn: 1 });
  assert.notEqual(r.state.m5, true, 'Tiến quá dài thì húc đá');
  r = run({ advanced: true, turn: 1, upgrades: ['grip'] });
  assert.equal(r.state.m5, true, 'Bánh gai không bị nhớt dính nên đáp án Bé đạt');
  assert.ok(run({ advanced: true }).sim.path > 0);
  r = run({ advanced: true });
  assert.ok(r.sim.slipZone(), 'Nâng cao có vệt nhớt');
  // Đủ cả bốn gói: đáp án vẫn đạt (smoke dùng đủ gói)
  const ALL = ['antenna', 'glow', 'grip', 'eyes'];
  assert.equal(run({ turn: 1, upgrades: ALL }).state.m3, true, 'Đủ gói ở chế độ Bé vẫn đạt NV3');
  assert.equal(run({ advanced: true, turn: 1, upgrades: ALL }).state.m5, true, 'Đủ gói ở Nâng cao đạt NV5');
  // Bé không có vệt nhớt
  assert.equal(run().sim.slipZone(), null);

  console.log('PASS: lop1-bai19 – 3D, cấu hình, mẫu M2, M3 chỉnh thời gian rẽ, thất bại rõ ràng, gói sáng tạo, Nâng cao đạt/trượt.');
})().catch(e => { console.error(e); process.exit(1); });
