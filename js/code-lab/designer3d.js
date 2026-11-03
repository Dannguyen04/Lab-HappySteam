// Phòng lập trình – Thiết kế sa bàn 3D kiểu RoboSim (màn #screen-design).
// Khay đạo cụ ô vuông bên trái, sân 3D nhìn nghiêng ở giữa: chạm ô đạo cụ rồi chạm lên sân để đặt (bắt lưới 5 cm),
// chọn vật để kéo, xoay 90°, đổi cỡ, xóa; Ctrl+Z / Ctrl+Y. Lưu đúng định dạng map của core.js (localStorage 'maps').
// API: window.CodeLabDesigner = { init({ save, play, toast }), show(), draft, toScreen(x, y), count() }
import * as THREE from 'three';

const $ = id => document.getElementById(id);
const SNAP = 5; // cm
const SCORE = { departure: 60, marker: 6, markerCap: 60, rampPass: 10, rampFull: 20, button: 60, finish: 60 }; // như MAPS thi đấu trong core.js
const ZONE_HEX = { green: 0x3fae6a, red: 0xe0534f, blue: 0x3d8fe0, yellow: 0xf2c230 };
const BG_MAX = 1024 * 1024; // ảnh nền sân lưu dạng dataURL ≤ 1 MB
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

// ---------- Khay đạo cụ ----------
const ic = body => `<svg viewBox="0 0 48 48" aria-hidden="true">${body}</svg>`;
const zoneIc = c => ic(`<path d="M6 30 24 21l18 9-18 9z" fill="${c}"/><path d="M6 30v3l18 9 18-9v-3l-18 9z" fill="#94a3b8"/>`);
const TOOLS = [
  { key: 'start', name: 'Xuất phát', icon: ic('<rect x="8" y="14" width="30" height="16" rx="5" fill="#0a7bd0"/><rect x="15" y="10" width="14" height="9" rx="2" fill="#e8b10b"/><circle cx="15" cy="33" r="5" fill="#1f2937"/><circle cx="31" cy="33" r="5" fill="#1f2937"/><path d="M38 22h7l-4-4M45 22l-4 4" stroke="#0a62a6" stroke-width="2.5" fill="none" stroke-linecap="round"/>') },
  { key: 'wall', name: 'Tường', icon: ic('<path d="M4 24 30 14l14 6-26 10z" fill="#94a3b8"/><path d="M4 24v10l14 6V30z" fill="#475569"/><path d="M18 30v10l26-10V20z" fill="#64748b"/>') },
  { key: 'box', name: 'Hộp', icon: ic('<path d="M8 16 24 9l16 7-16 7z" fill="#f2c230"/><path d="M8 16v17l16 7V23z" fill="#64748b"/><path d="M24 23v17l16-7V16z" fill="#94a3b8"/>') },
  { key: 'line', name: 'Vạch đen', icon: ic('<path d="M6 38c8-16 14 2 22-12s10-14 14-16" stroke="#1b1f24" stroke-width="5" fill="none" stroke-linecap="round"/><circle cx="6" cy="38" r="3" fill="#0a62a6"/><circle cx="28" cy="26" r="3" fill="#0a62a6"/><circle cx="42" cy="10" r="3" fill="#0a62a6"/>') },
  { key: 'goal', name: 'Ô đích', icon: ic('<path d="M4 30 24 20l20 10-20 10z" fill="#3fae6a"/><path d="M4 30 24 20l20 10-20 10z" fill="none" stroke="#1b1f24" stroke-width="2" stroke-dasharray="3 3"/><path d="M24 6l5 7-5 7-5-7z" fill="#10b981"/>') },
  { key: 'zone-red', name: 'Ô đỏ', icon: zoneIc('#e0534f') },
  { key: 'zone-green', name: 'Ô xanh lá', icon: zoneIc('#3fae6a') },
  { key: 'zone-blue', name: 'Ô xanh dương', icon: zoneIc('#3d8fe0') },
  { key: 'zone-yellow', name: 'Ô vàng', icon: zoneIc('#f2c230') },
  { key: 'flag', name: 'Cờ', icon: ic('<path d="M16 42V6" stroke="#94a3b8" stroke-width="3"/><path d="M17 7l20 7-20 7z" fill="#e8892b"/><ellipse cx="16" cy="42" rx="7" ry="2.5" fill="#64748b"/>') },
  { key: 'marker', name: 'Vạch mốc', icon: ic('<path d="M6 34h36" stroke="#1b1f24" stroke-width="3"/><path d="M34 34V8" stroke="#344155" stroke-width="2.5"/><rect x="34" y="8" width="11" height="10" fill="#b91c1c"/><text x="39.5" y="16.5" font-size="8" font-weight="700" fill="#fff" text-anchor="middle" font-family="Arial">A</text>') },
  { key: 'dockA', name: 'Bến A', icon: ic('<rect x="7" y="7" width="34" height="34" rx="2" fill="#77cba0" stroke="#159654" stroke-width="2"/><text x="24" y="33" font-size="22" font-weight="800" fill="#1d3553" text-anchor="middle" font-family="Arial">A</text>') },
  { key: 'dockB', name: 'Bến B', icon: ic('<rect x="7" y="7" width="34" height="34" rx="2" fill="#83b9ed" stroke="#1871c0" stroke-width="2"/><text x="24" y="33" font-size="22" font-weight="800" fill="#1d3553" text-anchor="middle" font-family="Arial">B</text>') },
  { key: 'ramp', name: 'Dốc', icon: ic('<path d="M2 36 12 30h16l12 6z" fill="#b4a68e"/><rect x="12" y="27" width="16" height="4" fill="#868d98"/><path d="M2 36h38" stroke="#64748b" stroke-width="2"/>') },
  { key: 'button', name: 'Nút khởi động', icon: ic('<path d="M18 40l2-18h8l2 18z" fill="#637282"/><ellipse cx="24" cy="21" rx="8" ry="3.5" fill="#dc2626"/><ellipse cx="24" cy="41" rx="9" ry="2.5" fill="#475569"/>') }
];
const TOOL_TIP = {
  start: 'Chạm lên sân để đặt chỗ xuất phát của xe (mũi xe theo mũi tên). Bấm Xoay 90° để đổi hướng.',
  wall: 'Chạm lên sân để dựng tường. Chọn tường rồi bấm Lớn hơn / Nhỏ hơn để đổi chiều dài.',
  box: 'Chạm lên sân để đặt hộp chắn đường.',
  line: 'Chạm từng điểm trên sân để nối vạch đen. Bấm "Xong vạch" (hoặc Enter) để kết thúc.',
  goal: 'Chạm lên sân để đặt ô đích (mỗi sa bàn một ô đích).',
  flag: 'Chạm lên sân để cắm cờ – xe phải đi qua đủ cờ trước khi về đích.',
  marker: 'Chạm lên đường vạch để đặt vạch mốc A, B, C… theo thứ tự xe đi. Xoay để vạch mốc vuông góc đường.',
  dockA: 'Chạm lên sân để đặt bến xuất phát A (xe sẽ đặt vào giữa bến).',
  dockB: 'Chạm lên sân để đặt bến đích B – sa bàn sẽ chấm điểm kiểu thi đấu Super Track.',
  ramp: 'Chạm lên đường vạch để đặt dốc. Xoay để đổi hướng lên dốc.',
  button: 'Chạm cạnh đường vạch để đặt nút khởi động tàu (xe chạm mũi vào là ăn điểm).',
  zone: 'Chạm lên sân để đặt ô màu cho cảm biến màu.'
};
const KIND_NAME = it => it.k === 'wall' ? (it.box ? 'Hộp' : 'Tường') : it.k === 'line' ? 'Vạch đen' : it.k === 'flag' ? 'Cờ'
  : it.k === 'marker' ? 'Vạch mốc ' + it.label : it.k === 'dock' ? 'Bến ' + it.label : it.k === 'ramp' ? 'Dốc'
  : it.k === 'button' ? 'Nút khởi động' : it.goal ? 'Ô đích' : 'Ô màu';

const clone = o => JSON.parse(JSON.stringify(o));
const snap = v => Math.round(v / SNAP) * SNAP;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const frame = (w, h) => [
  { k: 'wall', x: 0, y: 0, w, h: 3 }, { k: 'wall', x: 0, y: h - 3, w, h: 3 },
  { k: 'wall', x: 0, y: 0, w: 3, h }, { k: 'wall', x: w - 3, y: 0, w: 3, h }
];
const isFrame = (it, W, H) => it.k === 'wall' && ((it.x === 0 && it.y === 0 && (it.h === 3 || it.w === 3)) ||
  (it.x === 0 && it.y === H - 3 && it.h === 3) || (it.x === W - 3 && it.y === 0 && it.w === 3));
const isRect = it => it.k === 'wall' || it.k === 'zone' || it.k === 'dock' || it.k === 'ramp';

// ---------- Trạng thái bản nháp ----------
const blankDraft = () => ({ id: null, name: 'Sa bàn của lớp', about: 'Đưa xe tới ô đích.', limit: 60,
  size: [240, 160], start: { x: 30, y: 80, dir: 0 }, items: [], bg: null });
let draft = blankDraft();
let tool = null; // khóa ô đạo cụ đang chọn
let sel = -1; // chỉ số vật đang chọn | 'start'
let activeLine = null; // vạch đen đang chấm điểm
let ghost = null; // vật xem trước dưới con trỏ
const undoStack = [], redoStack = [];
let hooks = { save: null, play: null, toast: t => console.info(t) };

const snapshot = () => JSON.stringify({ size: draft.size, start: draft.start, items: draft.items });
function pushHistory() {
  undoStack.push(snapshot());
  if (undoStack.length > 80) undoStack.shift();
  redoStack.length = 0;
}
function restore(json) {
  const s = JSON.parse(json);
  draft.size = s.size; draft.start = s.start; draft.items = s.items;
  sel = -1; activeLine = null;
  syncForm();
  changed();
}
function undo() {
  finishLine(true);
  if (!undoStack.length) return;
  redoStack.push(snapshot());
  restore(undoStack.pop());
}
function redo() {
  if (!redoStack.length) return;
  undoStack.push(snapshot());
  restore(redoStack.pop());
}

// ---------- Tạo vật mới tại điểm (x, y) cm ----------
function makeItem(key, x, y) {
  const rect = (w, h, extra) => ({ ...extra, x: x - w / 2, y: y - h / 2, w, h });
  if (key === 'wall') return rect(40, 5, { k: 'wall' });
  if (key === 'box') return rect(15, 15, { k: 'wall', box: true });
  if (key === 'goal') return rect(40, 40, { k: 'zone', color: 'green', goal: true });
  if (key.startsWith('zone-')) return rect(30, 30, { k: 'zone', color: key.slice(5) });
  if (key === 'flag') return { k: 'flag', x, y };
  if (key === 'marker') return { k: 'marker', label: LETTERS[draft.items.filter(i => i.k === 'marker').length % 26], x, y, dir: 0, len: 18 };
  if (key === 'dockA') return rect(25, 25, { k: 'dock', label: 'A', role: 'start' });
  if (key === 'dockB') return rect(25, 25, { k: 'dock', label: 'B', role: 'goal' });
  if (key === 'ramp') return rect(25, 15, { k: 'ramp', axis: 'x', dir: 1, label: '' });
  if (key === 'button') return { k: 'button', x, y, radius: 3, label: 'A1' };
  return null;
}
// Giữ vật trong sân (trong khung tường 3 cm)
function fitInside(it) {
  const [W, H] = draft.size;
  if (isRect(it)) {
    it.w = Math.min(it.w, W - 6); it.h = Math.min(it.h, H - 6);
    it.x = clamp(it.x, 3, W - 3 - it.w); it.y = clamp(it.y, 3, H - 3 - it.h);
  } else if (it.k === 'line') {
    it.pts = it.pts.map(([x, y]) => [clamp(x, 3, W - 3), clamp(y, 3, H - 3)]);
  } else {
    it.x = clamp(it.x, 5, W - 5); it.y = clamp(it.y, 5, H - 5);
  }
}
function fitStart() {
  const [W, H] = draft.size;
  draft.start.x = clamp(draft.start.x, 12, W - 12);
  draft.start.y = clamp(draft.start.y, 12, H - 12);
}
// Đặt xe vào giữa bến A
function startAtDock(d) {
  draft.start.x = d.x + d.w / 2;
  draft.start.y = d.y + d.h / 2;
}
// Đánh lại nhãn vạch mốc A, B, C… theo thứ tự đặt
function relabel() {
  draft.items.filter(i => i.k === 'marker').forEach((m, i) => { m.label = LETTERS[i % 26]; });
}

function place(key, x, y) {
  pushHistory();
  if (key === 'start') {
    draft.start.x = x; draft.start.y = y;
    fitStart();
    sel = 'start';
    return;
  }
  const it = makeItem(key, x, y);
  // Vật chỉ có một: ô đích, bến A, bến B
  const unique = it.goal ? i => i.k === 'zone' && i.goal : it.k === 'dock' ? i => i.k === 'dock' && i.role === it.role : null;
  if (unique) draft.items = draft.items.filter(i => !unique(i));
  fitInside(it);
  draft.items.push(it);
  if (it.k === 'dock' && it.role === 'start') startAtDock(it);
  relabel();
  sel = draft.items.indexOf(it);
}

function addLinePoint(x, y) {
  if (!activeLine) {
    pushHistory();
    activeLine = { k: 'line', w: 2.5, pts: [[x, y]] };
    draft.items.push(activeLine);
  } else {
    const last = activeLine.pts[activeLine.pts.length - 1];
    if (Math.hypot(x - last[0], y - last[1]) < SNAP) return;
    activeLine.pts.push([x, y]);
  }
  sel = draft.items.indexOf(activeLine);
}
function finishLine(quiet) {
  if (!activeLine) return;
  if (activeLine.pts.length < 2) draft.items.splice(draft.items.indexOf(activeLine), 1);
  activeLine = null;
  sel = -1;
  if (!quiet) { setTool(null); changed(); }
}

// ---------- Thao tác với vật đang chọn ----------
const selected = () => sel === 'start' ? null : draft.items[sel] || null;
function rotateSel() {
  if (sel === 'start') {
    pushHistory();
    draft.start.dir = Math.round(((draft.start.dir || 0) + Math.PI / 2) % (Math.PI * 2) * 1000) / 1000;
    return changed();
  }
  const it = selected();
  if (!it || it.k === 'line' || it.k === 'flag' || it.k === 'button') return;
  pushHistory();
  if (it.k === 'marker') {
    it.dir = Math.round(((it.dir || 0) + Math.PI / 4) % (Math.PI * 2) * 1000) / 1000; // vạch mốc xoay 45° cho đường cong
  } else {
    const cx = it.x + it.w / 2, cy = it.y + it.h / 2;
    [it.w, it.h] = [it.h, it.w];
    it.x = cx - it.w / 2; it.y = cy - it.h / 2;
    // Dốc: x+ → y+ → x− → y− (hướng lên dốc)
    if (it.k === 'ramp') {
      if (it.axis === 'x') it.axis = 'y';
      else { it.axis = 'x'; it.dir = -(it.dir || 1); }
    }
    fitInside(it);
  }
  changed();
}
const canResize = it => it && (it.k === 'wall' || it.k === 'zone');
function resizeSel(step) {
  const it = selected();
  if (!canResize(it)) return;
  pushHistory();
  const cx = it.x + it.w / 2, cy = it.y + it.h / 2;
  if (it.k === 'wall' && !it.box) {
    // tường: đổi chiều dài theo cạnh dài, giữ bề dày
    if (it.w >= it.h) it.w = clamp(it.w + step * 10, 10, draft.size[0] - 6);
    else it.h = clamp(it.h + step * 10, 10, draft.size[1] - 6);
  } else {
    it.w = clamp(it.w + step * 5, 10, draft.size[0] - 6);
    it.h = clamp(it.h + step * 5, 10, draft.size[1] - 6);
  }
  it.x = cx - it.w / 2; it.y = cy - it.h / 2;
  fitInside(it);
  changed();
}
function deleteSel() {
  if (sel === 'start' || sel < 0) return;
  pushHistory();
  const it = draft.items[sel];
  if (it === activeLine) activeLine = null;
  draft.items.splice(sel, 1);
  relabel();
  sel = -1;
  changed();
}
function moveItemTo(it, ax, ay, anchor) {
  const dx = ax - anchor[0], dy = ay - anchor[1];
  if (!dx && !dy) return false;
  if (it === 'start') { draft.start.x += dx; draft.start.y += dy; fitStart(); return true; }
  if (it.k === 'line') it.pts = it.pts.map(([x, y]) => [x + dx, y + dy]);
  else { it.x += dx; it.y += dy; }
  fitInside(it);
  return true;
}

// ---------- Cảnh 3D ----------
let renderer = null, scene, camera, floor, floorMat, gridTex, bgTex = null, itemGroup, rimGroup, ghostGroup, selBox;
let host = null, ready = false, dirty = false;
const cam = { theta: 0.78, phi: 0, radius: 300, target: new THREE.Vector3() };
const raycaster = new THREE.Raycaster();
const floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const mats = {};
const labelCache = new Map();

function gridTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 500;
  const g = c.getContext('2d');
  g.fillStyle = '#b9c8de';
  g.fillRect(0, 0, 500, 500);
  g.strokeStyle = 'rgba(70, 100, 150, .28)';
  g.lineWidth = 2;
  g.beginPath();
  for (let i = 0; i <= 500; i += 50) { g.moveTo(i, 0); g.lineTo(i, 500); g.moveTo(0, i); g.lineTo(500, i); }
  g.stroke();
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}
function labelMat(text, bgColor, fg = '#ffffff') {
  const key = text + bgColor + fg;
  if (!labelCache.has(key)) {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const g = c.getContext('2d');
    g.fillStyle = bgColor;
    g.fillRect(0, 0, 128, 128);
    g.fillStyle = fg;
    g.font = `bold ${String(text).length > 1 ? 62 : 96}px Arial, sans-serif`;
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(text, 64, 70);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    labelCache.set(key, new THREE.MeshBasicMaterial({ map: t, side: THREE.DoubleSide, transparent: bgColor === 'transparent' }));
  }
  return labelCache.get(key);
}

function initScene() {
  host = $('design-3d');
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  } catch {
    host.classList.add('is-flat');
    host.textContent = 'Máy này không vẽ được 3D (WebGL). Hãy mở bằng Chrome hoặc Edge mới.';
    return false;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.className = 'dz-canvas';
  host.appendChild(renderer.domElement);
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xececec);
  camera = new THREE.PerspectiveCamera(38, 1, 1, 3000);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x8792a2, 1.0));
  const sun = new THREE.DirectionalLight(0xffffff, 1.3);
  sun.position.set(80, 300, 160);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, { left: -220, right: 220, top: 220, bottom: -220, near: 10, far: 800 });
  scene.add(sun);
  scene.add(sun.target);
  mats.sun = sun;

  gridTex = gridTexture();
  floorMat = new THREE.MeshStandardMaterial({ map: gridTex, roughness: 0.9 });
  Object.assign(mats, {
    rim: new THREE.MeshStandardMaterial({ color: 0x7d93bd, roughness: 0.6 }),
    rimTop: new THREE.MeshStandardMaterial({ color: 0x9fb2d6, roughness: 0.5 }),
    wall: new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.7 }),
    wallTop: new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.5 }),
    boxTop: new THREE.MeshStandardMaterial({ color: 0xf2c230, roughness: 0.5 }),
    boxSide: new THREE.MeshStandardMaterial({ color: 0x8b95a3, roughness: 0.6 }),
    tape: new THREE.MeshBasicMaterial({ color: 0x1b1f24, side: THREE.DoubleSide }),
    vertex: new THREE.MeshBasicMaterial({ color: 0x0a62a6 }),
    pole: new THREE.MeshStandardMaterial({ color: 0xcfd8dc, metalness: 0.6, roughness: 0.3 }),
    flag: new THREE.MeshStandardMaterial({ color: 0xe8892b, side: THREE.DoubleSide }),
    ramp: new THREE.MeshStandardMaterial({ color: 0xb4a68e, roughness: 0.85, side: THREE.DoubleSide }),
    rampTop: new THREE.MeshStandardMaterial({ color: 0x868d98, roughness: 0.7 }),
    pedestal: new THREE.MeshStandardMaterial({ color: 0x637282 }),
    redCap: new THREE.MeshStandardMaterial({ color: 0xdc2626, emissive: 0x8a1010 }),
    chassis: new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.35 }),
    ctrl: new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.4 }),
    tire: new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.9 }),
    arrow: new THREE.MeshBasicMaterial({ color: 0x0a62a6, side: THREE.DoubleSide }),
    dark: new THREE.MeshStandardMaterial({ color: 0x344155 }),
    goalStar: new THREE.MeshStandardMaterial({ color: 0x10b981, emissive: 0x059669, metalness: 0.5, roughness: 0.3 })
  });
  floor = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);
  rimGroup = new THREE.Group();
  itemGroup = new THREE.Group();
  ghostGroup = new THREE.Group();
  scene.add(rimGroup, itemGroup, ghostGroup);
  selBox = new THREE.Box3Helper(new THREE.Box3(), 0xff8a00);
  selBox.visible = false;
  scene.add(selBox);
  bindCanvas(renderer.domElement);
  new ResizeObserver(resize).observe(host);
  resize();
  return true;
}

function resize() {
  if (!renderer || !host.clientWidth) return;
  renderer.setSize(host.clientWidth, host.clientHeight, false);
  camera.aspect = host.clientWidth / Math.max(1, host.clientHeight);
  camera.updateProjectionMatrix();
  requestRender();
}
function placeCamera() {
  const { theta, phi, radius, target } = cam;
  camera.position.set(target.x + radius * Math.cos(theta) * Math.sin(phi), radius * Math.sin(theta),
    target.z + radius * Math.cos(theta) * Math.cos(phi));
  camera.lookAt(target);
}
function resetView(top) {
  const [W, H] = draft.size;
  cam.target.set(W / 2, 0, H / 2);
  cam.phi = 0;
  cam.theta = top ? 1.5 : 0.78;
  // khoảng cách để cả bề ngang W và bề sâu H lọt khung (FOV dọc 38°)
  const t = Math.tan(19 * Math.PI / 180), aspect = camera ? camera.aspect : 1.5;
  cam.radius = Math.max(W / 2 / (t * aspect), H * (top ? 0.5 : 0.75) / t) * 1.1;
  requestRender();
}
function requestRender() {
  if (!renderer || dirty) return;
  dirty = true;
  requestAnimationFrame(() => {
    dirty = false;
    placeCamera();
    renderer.render(scene, camera);
  });
}

// Vật liệu tạo riêng cho từng vật (ô màu, bóng xem trước) được đánh dấu để giải phóng khi dựng lại
const own = m => { m.userData.own = true; return m; };
function disposeGroup(g) {
  g.traverse(o => {
    if (o.geometry) o.geometry.dispose();
    if (o.material && o.material.userData.own) o.material.dispose();
  });
  g.clear();
}
function box(w, h, d, mat, x, y, z) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}
function flat(w, h, mat, x, y, z, rotZ = 0) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  m.rotation.x = -Math.PI / 2;
  m.rotation.z = rotZ;
  m.position.set(x, y, z);
  m.receiveShadow = true;
  return m;
}
function tape(g, pts, w, y = 0.06) {
  for (let i = 1; i < pts.length; i++) {
    const [a, b] = [pts[i - 1], pts[i]];
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (len < 1e-3) continue;
    g.add(flat(w, len, mats.tape, (a[0] + b[0]) / 2, y, (a[1] + b[1]) / 2, Math.atan2(b[0] - a[0], b[1] - a[1])));
  }
  for (const p of pts) {
    const cap = new THREE.Mesh(new THREE.CircleGeometry(w / 2, 14), mats.tape);
    cap.rotation.x = -Math.PI / 2;
    cap.position.set(p[0], y + 0.002, p[1]);
    g.add(cap);
  }
}

// Dựng hình một vật (dùng cho cả vật trên sân và bóng xem trước)
function buildItem(it) {
  const g = new THREE.Group();
  if (it.k === 'wall') {
    const hgt = it.box ? 15 : 12;
    g.add(box(it.w, hgt, it.h, it.box ? mats.boxSide : mats.wall, it.x + it.w / 2, hgt / 2, it.y + it.h / 2));
    g.add(box(it.w + 0.2, 0.6, it.h + 0.2, it.box ? mats.boxTop : mats.wallTop, it.x + it.w / 2, hgt + 0.3, it.y + it.h / 2));
  } else if (it.k === 'zone') {
    const mat = own(new THREE.MeshStandardMaterial({ color: ZONE_HEX[it.color] || ZONE_HEX.green, roughness: 0.6, transparent: true, opacity: it.goal ? 0.6 : 0.8 }));
    g.add(flat(it.w, it.h, mat, it.x + it.w / 2, 0.08, it.y + it.h / 2));
    if (it.goal) {
      tape(g, [[it.x, it.y], [it.x + it.w, it.y], [it.x + it.w, it.y + it.h], [it.x, it.y + it.h], [it.x, it.y]], 1.2, 0.1);
      const star = new THREE.Mesh(new THREE.OctahedronGeometry(3, 0), mats.goalStar);
      star.position.set(it.x + it.w / 2, 9, it.y + it.h / 2);
      star.castShadow = true;
      g.add(star);
    }
  } else if (it.k === 'line') {
    tape(g, it.pts, it.w || 2.5);
    if (it === activeLine || draft.items[sel] === it) {
      for (const p of it.pts) {
        const dot = new THREE.Mesh(new THREE.CircleGeometry(2.2, 16), mats.vertex);
        dot.rotation.x = -Math.PI / 2;
        dot.position.set(p[0], 0.15, p[1]);
        g.add(dot);
      }
    }
  } else if (it.k === 'flag') {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 17, 10), mats.pole);
    pole.position.set(it.x, 8.5, it.y);
    pole.castShadow = true;
    const base = new THREE.Mesh(new THREE.CylinderGeometry(3, 3.4, 0.6, 18), mats.pole);
    base.position.set(it.x, 0.3, it.y);
    const s = new THREE.Shape();
    s.moveTo(0, 16.5); s.lineTo(7, 13.5); s.lineTo(0, 10.5); s.closePath();
    const banner = new THREE.Mesh(new THREE.ShapeGeometry(s), mats.flag);
    banner.position.set(it.x, 0, it.y);
    banner.castShadow = true;
    g.add(pole, base, banner);
  } else if (it.k === 'marker') {
    const nx = -Math.sin(it.dir || 0), ny = Math.cos(it.dir || 0), half = (it.len || 18) / 2;
    tape(g, [[it.x - nx * half, it.y - ny * half], [it.x + nx * half, it.y + ny * half]], 1.2, 0.09);
    const px = it.x + nx * half, pz = it.y + ny * half;
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 11, 8), mats.dark);
    pole.position.set(px, 5.5, pz);
    const flag = new THREE.Mesh(new THREE.PlaneGeometry(7, 6), labelMat(it.label, '#b91c1c'));
    flag.position.set(px + 3.5, 8.5, pz);
    g.add(pole, flag);
  } else if (it.k === 'dock') {
    const mat = own(new THREE.MeshBasicMaterial({ color: it.role === 'start' ? 0x77cba0 : 0x83b9ed, transparent: true, opacity: 0.75 }));
    g.add(flat(it.w, it.h, mat, it.x + it.w / 2, 0.1, it.y + it.h / 2));
    g.add(flat(14, 14, labelMat(it.label, '#ffffff', '#1d3553'), it.x + it.w / 2, 0.14, it.y + it.h / 2));
    tape(g, [[it.x, it.y], [it.x + it.w, it.y], [it.x + it.w, it.y + it.h], [it.x, it.y + it.h], [it.x, it.y]], 0.8, 0.16);
  } else if (it.k === 'ramp') {
    // giống view3d: dốc lên 5 cm, bệ 15 cm cao 2 cm, dốc xuống
    const rg = new THREE.Group();
    const width = it.axis === 'y' ? it.w : it.h, length = it.axis === 'y' ? it.h : it.w;
    for (const [a, b, ha, hb] of [[0, 5, 0, 2], [20, length, 2, 0]]) {
      const s = new THREE.Shape();
      s.moveTo(a, 0); s.lineTo(b, 0); s.lineTo(b, hb); s.lineTo(a, ha); s.closePath();
      rg.add(new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth: width, bevelEnabled: false }), mats.ramp));
    }
    const top = box(15, 2, width, mats.rampTop, 12.5, 1, width / 2);
    rg.add(top);
    const arrow = new THREE.Mesh(new THREE.ConeGeometry(2, 4, 3), mats.arrow);
    arrow.rotation.z = -Math.PI / 2;
    arrow.position.set(12.5, 4, width / 2);
    rg.add(arrow);
    if (it.dir === -1) { rg.scale.x = -1; rg.position.x = length; }
    const wrap = new THREE.Group();
    wrap.add(rg);
    if (it.axis === 'y') { wrap.rotation.y = -Math.PI / 2; wrap.position.set(it.x + width, 0, it.y); }
    else wrap.position.set(it.x, 0, it.y);
    g.add(wrap);
  } else if (it.k === 'button') {
    const ped = new THREE.Mesh(new THREE.CylinderGeometry(2, 2.8, 5, 16), mats.pedestal);
    ped.position.set(it.x, 2.5, it.y);
    ped.castShadow = true;
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(it.radius || 3, it.radius || 3, 1.2, 20), mats.redCap);
    cap.position.set(it.x, 5.6, it.y);
    const tag = new THREE.Mesh(new THREE.PlaneGeometry(7, 5), labelMat(it.label || 'A1', '#ba1a1a'));
    tag.position.set(it.x, 10, it.y);
    g.add(ped, cap, tag);
  }
  return g;
}
// Xe ở điểm xuất phát: thân xanh, hộp điều khiển vàng, mũi tên hướng đi (+X như view3d)
function buildCar() {
  const g = new THREE.Group();
  g.add(box(16, 5, 11, mats.chassis, 0, 4, 0));
  g.add(box(8, 3, 7, mats.ctrl, -1, 8, 0));
  for (const z of [-7.2, 7.2]) {
    const w = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.6, 2, 18), mats.tire);
    w.rotation.x = Math.PI / 2;
    w.position.set(0, 2.6, z);
    w.castShadow = true;
    g.add(w);
  }
  const s = new THREE.Shape();
  s.moveTo(10, -4); s.lineTo(18, 0); s.lineTo(10, 4); s.closePath();
  const arrow = new THREE.Mesh(new THREE.ShapeGeometry(s), mats.arrow);
  arrow.rotation.x = -Math.PI / 2;
  arrow.position.y = 0.2;
  g.add(arrow);
  g.position.set(draft.start.x, 0, draft.start.y);
  g.rotation.y = -(draft.start.dir || 0);
  g.userData.idx = 'start';
  return g;
}

function buildRim() {
  disposeGroup(rimGroup);
  const [W, H] = draft.size;
  floor.scale.set(W, H, 1);
  floor.position.set(W / 2, 0, H / 2);
  gridTex.repeat.set(W / 50, H / 50);
  // Khung tường quanh sân (3 cm như frame() của core.js), viền bo kiểu RoboSim
  for (const f of frame(W, H)) {
    rimGroup.add(box(f.w, 4, f.h, mats.rim, f.x + f.w / 2, 2, f.y + f.h / 2));
    rimGroup.add(box(f.w + 0.4, 0.6, f.h + 0.4, mats.rimTop, f.x + f.w / 2, 4.3, f.y + f.h / 2));
  }
  mats.sun.target.position.set(W / 2, 0, H / 2);
}

function rebuild() {
  if (!ready) return;
  disposeGroup(itemGroup);
  draft.items.forEach((it, i) => {
    const g = buildItem(it);
    g.userData.idx = i;
    itemGroup.add(g);
  });
  itemGroup.add(buildCar());
  const target = sel === 'start' ? itemGroup.children.at(-1) : itemGroup.children[sel];
  selBox.visible = !!target && sel !== -1;
  if (selBox.visible) {
    selBox.box.setFromObject(target);
    selBox.box.expandByScalar(1);
  }
  buildGhost();
  requestRender();
}
function buildGhost() {
  disposeGroup(ghostGroup);
  if (!ghost || !tool || tool === 'line') {
    if (ghost && tool === 'line') {
      const dot = new THREE.Mesh(new THREE.CircleGeometry(2, 16), mats.vertex);
      dot.rotation.x = -Math.PI / 2;
      dot.position.set(ghost[0], 0.2, ghost[1]);
      ghostGroup.add(dot);
      const last = activeLine && activeLine.pts.at(-1);
      if (last) {
        const g = new THREE.Group();
        tape(g, [last, ghost], 2.5, 0.07);
        g.traverse(o => { if (o.isMesh) o.material = mats.ghostTape || (mats.ghostTape = new THREE.MeshBasicMaterial({ color: 0x1b1f24, transparent: true, opacity: 0.4, side: THREE.DoubleSide })); });
        ghostGroup.add(g);
      }
    }
    return;
  }
  let g;
  if (tool === 'start') {
    const keep = { ...draft.start };
    draft.start.x = ghost[0]; draft.start.y = ghost[1];
    g = buildCar();
    Object.assign(draft.start, keep);
  } else {
    const it = makeItem(tool, ghost[0], ghost[1]);
    fitInside(it);
    g = buildItem(it);
  }
  g.traverse(o => {
    if (!o.isMesh) return;
    o.castShadow = false;
    o.material = own(o.material.clone());
    o.material.transparent = true;
    o.material.opacity = 0.45;
    o.material.depthWrite = false;
  });
  ghostGroup.add(g);
}

// ---------- Chuột / chạm trên sân ----------
const ndc = new THREE.Vector2();
function rayFrom(e) {
  const r = renderer.domElement.getBoundingClientRect();
  ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  placeCamera();
  raycaster.setFromCamera(ndc, camera);
}
function floorPoint(e, raw) {
  rayFrom(e);
  const p = new THREE.Vector3();
  if (!raycaster.ray.intersectPlane(floorPlane, p)) return null;
  const [W, H] = draft.size;
  if (p.x < -10 || p.z < -10 || p.x > W + 10 || p.z > H + 10) return null;
  return raw ? [p.x, p.z] : [clamp(snap(p.x), 5, W - 5), clamp(snap(p.z), 5, H - 5)];
}
function pick(e) {
  rayFrom(e);
  const hit = raycaster.intersectObjects(itemGroup.children, true)[0];
  let o = hit && hit.object;
  while (o && o.userData.idx === undefined) o = o.parent;
  return o ? o.userData.idx : -1;
}

let drag = null; // { mode: 'item'|'orbit'|'pan', ... }
function bindCanvas(cv) {
  cv.addEventListener('contextmenu', e => e.preventDefault());
  cv.addEventListener('pointerdown', e => {
    try { cv.setPointerCapture(e.pointerId); } catch { /* sự kiện giả lập */ }
    const last = [e.clientX, e.clientY];
    if (e.button === 2 || e.button === 1) { drag = { mode: 'pan', last }; return; }
    if (tool) {
      const p = floorPoint(e);
      if (!p) return;
      if (tool === 'line') { addLinePoint(p[0], p[1]); changed(); return; }
      place(tool, p[0], p[1]);
      setTool(null);
      changed();
      return;
    }
    const idx = pick(e);
    if (idx !== -1) {
      sel = idx;
      const it = idx === 'start' ? 'start' : draft.items[idx];
      const a = floorPoint(e);
      drag = { mode: 'item', it, anchor: a, moved: false, last };
      changed();
    } else {
      if (sel !== -1) { sel = -1; changed(); }
      drag = { mode: 'orbit', last };
    }
  });
  cv.addEventListener('pointermove', e => {
    if (!drag) {
      if (tool) { ghost = floorPoint(e); buildGhost(); requestRender(); }
      return;
    }
    const dx = e.clientX - drag.last[0], dy = e.clientY - drag.last[1];
    drag.last = [e.clientX, e.clientY];
    if (drag.mode === 'orbit') {
      cam.phi -= dx * 0.006;
      cam.theta = clamp(cam.theta + dy * 0.006, 0.2, 1.55);
      requestRender();
    } else if (drag.mode === 'pan') {
      const f = cam.radius * 0.0016;
      const c = Math.cos(cam.phi), s = Math.sin(cam.phi);
      cam.target.x -= (dx * c + dy * s) * f;
      cam.target.z -= (-dx * s + dy * c) * f;
      requestRender();
    } else if (drag.mode === 'item' && drag.anchor) {
      const p = floorPoint(e);
      if (!p) return;
      if (!drag.moved && (p[0] !== drag.anchor[0] || p[1] !== drag.anchor[1])) { pushHistory(); drag.moved = true; }
      if (moveItemTo(drag.it, p[0], p[1], drag.anchor)) {
        drag.anchor = p;
        if (drag.it !== 'start' && drag.it.k === 'dock' && drag.it.role === 'start') startAtDock(drag.it);
        changed();
      }
    }
  });
  const end = () => { drag = null; };
  cv.addEventListener('pointerup', end);
  cv.addEventListener('pointercancel', end);
  cv.addEventListener('pointerleave', () => { if (ghost) { ghost = null; buildGhost(); requestRender(); } });
  cv.addEventListener('dblclick', () => { if (activeLine) finishLine(); });
  cv.addEventListener('wheel', e => {
    e.preventDefault();
    cam.radius = clamp(cam.radius * Math.exp(e.deltaY * 0.001), 60, 900);
    requestRender();
  }, { passive: false });
}

// ---------- Giao diện quanh sân ----------
function setTip(text, kind = '') {
  const el = $('dz-tip');
  if (el) { el.textContent = text; el.dataset.kind = kind; }
}
function setTool(key) {
  const next = key === tool ? null : key;
  if (next !== 'line' && activeLine) finishLine(true);
  tool = next;
  ghost = null;
  document.querySelectorAll('#dz-tray .dz-tool').forEach(b => {
    const on = b.dataset.tool === tool;
    b.classList.toggle('is-on', on);
    b.setAttribute('aria-pressed', on ? 'true' : 'false');
  });
  if (renderer) renderer.domElement.style.cursor = tool ? 'crosshair' : '';
  setTip(tool ? TOOL_TIP[tool.startsWith('zone-') ? 'zone' : tool] : 'Chọn một đạo cụ ở khay bên trái rồi chạm lên sân. Kéo sân để xoay, lăn chuột để phóng to.');
  buildGhostSafe();
}
const buildGhostSafe = () => { if (ready) { buildGhost(); requestRender(); } };

function renderSelBar() {
  const bar = $('dz-selbar');
  const it = selected();
  const name = sel === 'start' ? 'Xe xuất phát' : it ? KIND_NAME(it) : '';
  bar.hidden = !name && !activeLine;
  $('dz-sel-name').textContent = activeLine ? `Vạch đen · ${activeLine.pts.length} điểm` : name;
  $('dz-line-done').hidden = !activeLine;
  $('dz-rotate').hidden = !!activeLine || !(sel === 'start' || (it && !['line', 'flag', 'button'].includes(it.k)));
  $('dz-smaller').hidden = $('dz-bigger').hidden = !!activeLine || !canResize(it);
  $('dz-delete').hidden = !!activeLine || sel === 'start' || !it;
}
const count = () => draft.items.length;
function changed() {
  $('dz-count').textContent = String(count());
  $('dz-undo').disabled = !undoStack.length;
  $('dz-redo').disabled = !redoStack.length;
  renderSelBar();
  rebuild();
}
function syncForm() {
  $('dz-name').value = draft.name;
  $('dz-about').value = draft.about;
  $('dz-limit').value = draft.limit;
  $('dz-size').value = draft.size.join('x');
  $('dz-bg-clear').hidden = !draft.bg;
  applyBg();
}

// ---------- Ảnh nền sân ----------
function applyBg() {
  if (!ready) return;
  if (bgTex) { bgTex.dispose(); bgTex = null; }
  if (draft.bg) {
    bgTex = new THREE.TextureLoader().load(draft.bg, requestRender);
    bgTex.colorSpace = THREE.SRGBColorSpace;
    floorMat.map = bgTex;
    floorMat.color.set(0xffffff);
  } else floorMat.map = gridTex;
  floorMat.needsUpdate = true;
  requestRender();
}
// Thu ảnh về ≤ 1024 px, nén JPEG cho tới khi dataURL ≤ 1 MB
function loadBg(file) {
  if (!file || !/^image\//.test(file.type)) { hooks.toast('Hãy chọn một tệp ảnh (PNG, JPG).'); return; }
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.onload = () => {
    URL.revokeObjectURL(url);
    let side = 1024, q = 0.85, data = '';
    for (let tries = 0; tries < 8; tries++) {
      const k = Math.min(1, side / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.max(1, Math.round(img.width * k));
      c.height = Math.max(1, Math.round(img.height * k));
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      data = c.toDataURL('image/jpeg', q);
      if (data.length <= BG_MAX) break;
      side = Math.round(side * 0.8); q = Math.max(0.5, q - 0.08);
    }
    if (data.length > BG_MAX) { hooks.toast('Ảnh quá lớn, hãy chọn ảnh nhỏ hơn.'); return; }
    draft.bg = data;
    $('dz-bg-clear').hidden = false;
    applyBg();
    hooks.toast('Đã đặt ảnh nền sân.');
  };
  img.onerror = () => { URL.revokeObjectURL(url); hooks.toast('Không đọc được ảnh này.'); };
  img.src = url;
}

// ---------- Lưu / xuất / nhập ----------
function readForm() {
  draft.name = ($('dz-name').value || '').trim() || 'Sa bàn của lớp';
  draft.about = ($('dz-about').value || '').trim();
  draft.limit = clamp(Math.round(Number($('dz-limit').value) || 60), 10, 600);
  $('dz-limit').value = draft.limit;
}
// Dựng map đúng định dạng core.js; trả { map } hoặc { error }
function buildMap() {
  finishLine(true);
  readForm();
  const [W, H] = draft.size;
  const items = clone(draft.items).map(it => {
    if (it.k === 'ramp' && !it.label) {
      // nhãn dốc = vạch mốc gần nhất (như dốc ở vạch E của luật)
      const near = draft.items.filter(m => m.k === 'marker')
        .sort((a, b) => Math.hypot(a.x - it.x - it.w / 2, a.y - it.y - it.h / 2) - Math.hypot(b.x - it.x - it.w / 2, b.y - it.y - it.h / 2))[0];
      it.label = near ? near.label : '';
    }
    return it;
  });
  const goalDock = items.some(i => i.k === 'dock' && i.role === 'goal');
  const goalZone = items.some(i => i.k === 'zone' && i.goal);
  if (!goalDock && !goalZone) return { error: 'Sa bàn chưa có Ô đích (hoặc Bến B)! Hãy đặt một ô đích trước khi lưu.' };
  if (goalDock && !items.some(i => i.k === 'line' && i.pts.length > 1))
    return { error: 'Sa bàn thi đấu (có Bến B) cần ít nhất một vạch đen làm đường bay.' };
  const contest = goalDock;
  const about = draft.about || (contest ? `Rời bến +${SCORE.departure}, mỗi vạch +${SCORE.marker} (tối đa ${SCORE.markerCap}), về B đúng thứ tự +${SCORE.finish}. ${draft.limit} giây.` : 'Đưa xe tới ô đích.');
  const map = {
    id: draft.id || 'tu-ve-' + Date.now(),
    name: draft.name,
    about,
    level: 'pro',
    custom: true,
    size: [W, H],
    start: { x: Math.round(draft.start.x), y: Math.round(draft.start.y), dir: draft.start.dir || 0 },
    items: [...frame(W, H), ...items],
    // sao 2: về đích trong 1/3 giới hạn giờ; sa bàn có Bến B chấm điểm như luật Super Track
    rules: contest ? { limit: draft.limit, score: { ...SCORE } } : { time: Math.max(5, Math.round(draft.limit / 3)), star3: 'noCrash', limit: draft.limit }
  };
  if (draft.bg) map.bg = draft.bg;
  return { map };
}
function save(thenPlay) {
  const { map, error } = buildMap();
  if (error) { setTip(error, 'warn'); hooks.toast(error); if (window.SFX) window.SFX.buzz(); return null; }
  if (!hooks.save || !hooks.save(map)) return null;
  draft.id = map.id;
  if (thenPlay && hooks.play) hooks.play(map.id);
  else hooks.toast(`Đã lưu "${map.name}" vào Sa bàn của lớp.`);
  changed();
  return map;
}
function exportJson() {
  const { map, error } = buildMap();
  if (error) { setTip(error, 'warn'); hooks.toast(error); return; }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(map, null, 1)], { type: 'application/json' }));
  a.download = (map.name || 'sa-ban').replace(/[^\p{L}\p{N}]+/gu, '-') + '.json';
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
function loadMap(data) {
  const m = Array.isArray(data) ? data[0] : data && data.map ? data.map : data;
  if (!m || !Array.isArray(m.size) || !Array.isArray(m.items)) throw new Error('Tệp không phải sa bàn');
  pushHistory();
  const [W, H] = [Number(m.size[0]) || 240, Number(m.size[1]) || 160];
  draft = {
    id: m.custom && m.id ? m.id : null,
    name: m.name || 'Sa bàn của lớp',
    about: m.about || '',
    limit: (m.rules && m.rules.limit) || 60,
    size: [W, H],
    start: { x: 30, y: H / 2, dir: 0, ...(m.start || {}) },
    items: m.items.filter(it => it && it.k && !isFrame(it, W, H)),
    bg: typeof m.bg === 'string' && m.bg.length <= BG_MAX * 1.4 ? m.bg : null
  };
  sel = -1; activeLine = null;
  syncForm();
  resetView();
  buildRim();
  changed();
}
function importJson(file) {
  if (!file) return;
  file.text().then(t => { loadMap(JSON.parse(t)); hooks.toast('Đã mở sa bàn từ tệp.'); })
    .catch(() => hooks.toast('Không đọc được tệp sa bàn (.json).'));
}

function showHelp() {
  const h = $('dz-help');
  h.hidden = !h.hidden;
}

// ---------- Khởi tạo màn ----------
let bound = false;
function bindUi() {
  if (bound) return;
  bound = true;
  const tray = $('dz-tray');
  for (const t of TOOLS) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'dz-tool';
    b.dataset.tool = t.key;
    b.title = t.name;
    b.setAttribute('aria-pressed', 'false');
    b.innerHTML = `${t.icon}<span>${t.name}</span>`;
    b.addEventListener('click', () => setTool(t.key));
    tray.appendChild(b);
  }
  $('dz-size').addEventListener('change', () => {
    pushHistory();
    const [w, h] = $('dz-size').value.split('x').map(Number);
    draft.size = [w, h];
    draft.items.forEach(fitInside);
    fitStart();
    buildRim();
    resetView();
    changed();
  });
  for (const id of ['dz-name', 'dz-about', 'dz-limit']) $(id).addEventListener('change', readForm);
  $('dz-bg').addEventListener('click', () => $('dz-bg-input').click());
  $('dz-bg-input').addEventListener('change', e => { loadBg(e.target.files[0]); e.target.value = ''; });
  $('dz-bg-clear').addEventListener('click', () => { draft.bg = null; $('dz-bg-clear').hidden = true; applyBg(); });
  $('dz-open').addEventListener('click', () => $('dz-file-input').click());
  $('dz-file-input').addEventListener('change', e => { importJson(e.target.files[0]); e.target.value = ''; });
  $('dz-export').addEventListener('click', exportJson);
  $('dz-help-btn').addEventListener('click', showHelp);
  $('dz-help-close').addEventListener('click', showHelp);
  $('dz-undo').addEventListener('click', undo);
  $('dz-redo').addEventListener('click', redo);
  $('dz-save').addEventListener('click', () => save(false));
  $('dz-play').addEventListener('click', () => save(true));
  $('dz-new').addEventListener('click', () => {
    if (draft.items.length && !confirm('Bỏ sa bàn đang thiết kế và làm sa bàn mới?')) return;
    pushHistory();
    draft = blankDraft();
    sel = -1; activeLine = null;
    syncForm(); buildRim(); resetView(); changed();
  });
  $('dz-rotate').addEventListener('click', rotateSel);
  $('dz-bigger').addEventListener('click', () => resizeSel(1));
  $('dz-smaller').addEventListener('click', () => resizeSel(-1));
  $('dz-delete').addEventListener('click', deleteSel);
  $('dz-line-done').addEventListener('click', () => finishLine());
  $('dz-view-reset').addEventListener('click', () => resetView(false));
  $('dz-view-top').addEventListener('click', () => resetView(true));
  $('dz-zoom-in').addEventListener('click', () => { cam.radius = clamp(cam.radius * 0.8, 60, 900); requestRender(); });
  $('dz-zoom-out').addEventListener('click', () => { cam.radius = clamp(cam.radius * 1.25, 60, 900); requestRender(); });
  document.addEventListener('keydown', e => {
    if (document.body.dataset.screen !== 'design' || e.target.closest('input, select, textarea, dialog')) return;
    const k = e.key.toLowerCase();
    if ((e.ctrlKey || e.metaKey) && k === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
    else if ((e.ctrlKey || e.metaKey) && (k === 'y' || (k === 'z' && e.shiftKey))) { e.preventDefault(); redo(); }
    else if (k === 'delete' || k === 'backspace') { e.preventDefault(); deleteSel(); }
    else if (k === 'r' && !e.ctrlKey) rotateSel();
    else if (k === 'enter') finishLine();
    else if (k === 'escape') { if (activeLine) finishLine(); else { setTool(null); sel = -1; changed(); } }
  });
}

function show() {
  bindUi();
  if (!ready) {
    ready = initScene();
    syncForm();
    if (ready) { buildRim(); resetView(); }
    setTool(null);
  }
  resize();
  changed();
}

// Tọa độ màn hình (clientX/Y) của điểm (x, y) cm trên sân – dùng cho kiểm thử
function toScreen(x, y) {
  placeCamera();
  camera.updateMatrixWorld();
  const v = new THREE.Vector3(x, 0, y).project(camera);
  const r = renderer.domElement.getBoundingClientRect();
  return { x: r.left + (v.x + 1) / 2 * r.width, y: r.top + (1 - v.y) / 2 * r.height };
}

window.CodeLabDesigner = {
  init(h) { hooks = { ...hooks, ...h }; },
  show,
  get draft() { return draft; },
  get tool() { return tool; },
  get selected() { return sel; },
  count,
  toScreen,
  buildMap,
  loadMap
};
