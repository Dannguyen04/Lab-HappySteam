// Phòng lập trình – Góc nhìn 3D cho sa bàn (RoboSim-style 3D Stage)
// Dùng Three.js dựng sa bàn, chướng ngại vật 3D có bóng đổ, vạch dò, cờ,
// và robot xe 2 bánh Alpha 330 (bánh quay theo vl/vr, mắt sóng âm, tia sóng âm, vệt đường).
// API: window.CodeLabView3D = { create(container) -> { render(sim), resize(), dispose() } }

import * as THREE from 'three';
import { loadKitCar } from './kit-car.js';

const ROBOT_SPEC = {
  length: 18, // cm
  width: 14,  // cm
  height: 7.2, // cm
  wheelRadius: 2.5, // cm (bánh Ø5 cm)
  wheelWidth: 2.2,
  wheelBase: 12.5,
  sonarMax: 180
};

const ZONE_COLORS = {
  green: 0x3fae6a,
  red: 0xe0534f,
  blue: 0x3d8fe0,
  yellow: 0xf2c230,
  white: 0xffffff
};

function createGridTexture() {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');

  // Nền sân sáng màu
  ctx.fillStyle = '#f8f6f0';
  ctx.fillRect(0, 0, size, size);

  // Lưới 10 cm (5 ô 10cm trong 50cm tile)
  ctx.strokeStyle = 'rgba(21, 33, 43, 0.08)';
  ctx.lineWidth = 1.5;
  const step = size / 5;
  ctx.beginPath();
  for (let i = 0; i <= 5; i++) {
    const p = i * step;
    ctx.moveTo(p, 0); ctx.lineTo(p, size);
    ctx.moveTo(0, p); ctx.lineTo(size, p);
  }
  ctx.stroke();

  // Viền chính mỗi 50 cm
  ctx.strokeStyle = 'rgba(21, 33, 43, 0.18)';
  ctx.lineWidth = 3;
  ctx.strokeRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createHazardTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#475569';
  ctx.fillRect(0, 0, 128, 128);
  ctx.fillStyle = '#f59e0b';
  for (let x = -128; x < 256; x += 32) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + 16, 0);
    ctx.lineTo(x + 16 - 32, 128);
    ctx.lineTo(x - 32, 128);
    ctx.closePath();
    ctx.fill();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createCheckeredTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 64;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#10b981';
  ctx.fillRect(0, 0, 64, 64);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 32, 32);
  ctx.fillRect(32, 32, 32, 32);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createStudTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 64;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#c9cbce';
  ctx.fillRect(0, 0, 64, 64);
  ctx.strokeStyle = '#8d9096';
  ctx.lineWidth = 1;
  ctx.strokeRect(0.5, 0.5, 63, 63);
  ctx.beginPath();
  ctx.arc(32, 32, 17, 0, Math.PI * 2);
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#7d8086';
  ctx.stroke();
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function buildAlpha330Robot(materials) {
  const group = new THREE.Group();

  // 1. Thân xe chính (nhựa xanh RoboSim #2a9bd8, bo cong)
  const chassisGeom = new THREE.BoxGeometry(16, 3.4, 11.4);
  const chassisMesh = new THREE.Mesh(chassisGeom, materials.chassis);
  chassisMesh.position.set(0, 2.5, 0);
  chassisMesh.castShadow = true;
  chassisMesh.receiveShadow = true;
  group.add(chassisMesh);

  // Mũi xe vát tròn phía trước
  const noseGeom = new THREE.CylinderGeometry(5.7, 5.7, 3.4, 16, 1, false, -Math.PI / 2, Math.PI);
  const noseMesh = new THREE.Mesh(noseGeom, materials.chassis);
  noseMesh.position.set(8.0, 2.5, 0);
  noseMesh.rotation.y = Math.PI / 2;
  noseMesh.castShadow = true;
  group.add(noseMesh);

  // Cản va chạm cao su đen phía trước
  const bumperGeom = new THREE.BoxGeometry(1.6, 2.0, 12.6);
  const bumperMesh = new THREE.Mesh(bumperGeom, materials.bumper);
  bumperMesh.position.set(8.5, 2.0, 0);
  bumperMesh.castShadow = true;
  group.add(bumperMesh);

  // 2. Bộ điều khiển màu vàng RoboSim trên lưng
  const controllerGeom = new THREE.BoxGeometry(8.6, 2.6, 7.8);
  const controllerMesh = new THREE.Mesh(controllerGeom, materials.controller);
  controllerMesh.position.set(-1.2, 5.0, 0);
  controllerMesh.castShadow = true;
  controllerMesh.receiveShadow = true;
  group.add(controllerMesh);

  // Màn hình LCD nhỏ
  const screenGeom = new THREE.PlaneGeometry(3.6, 4.4);
  const screenMesh = new THREE.Mesh(screenGeom, materials.lcd);
  screenMesh.position.set(-1.2, 6.32, -0.8);
  screenMesh.rotation.x = -Math.PI / 2;
  screenMesh.rotation.z = Math.PI / 2;
  group.add(screenMesh);

  // Phím bấm trên bộ điều khiển
  const btnGeom = new THREE.CylinderGeometry(0.5, 0.5, 0.3, 10);
  for (const [bx, bz] of [[-1.2, 2.0], [-2.4, 2.0], [0.0, 2.0]]) {
    const btn = new THREE.Mesh(btnGeom, materials.button);
    btn.position.set(bx, 6.35, bz);
    group.add(btn);
  }

  // Đèn LED chỉ thị đa màu trên đỉnh
  const ledGeom = new THREE.SphereGeometry(0.9, 14, 10);
  const ledMesh = new THREE.Mesh(ledGeom, materials.led);
  ledMesh.position.set(-2.0, 6.6, 0);
  group.add(ledMesh);

  const ledLight = new THREE.PointLight(0xffffff, 0, 25);
  ledLight.position.set(-2.0, 7.0, 0);
  group.add(ledLight);

  // 3. Hai bánh xe dẫn động (trục Z, quay quanh Z)
  const wheelGeom = new THREE.CylinderGeometry(ROBOT_SPEC.wheelRadius, ROBOT_SPEC.wheelRadius, ROBOT_SPEC.wheelWidth, 24);
  wheelGeom.rotateX(Math.PI / 2); // Trục bánh nằm ngang theo Z

  const rimGeom = new THREE.CylinderGeometry(ROBOT_SPEC.wheelRadius * 0.65, ROBOT_SPEC.wheelRadius * 0.65, ROBOT_SPEC.wheelWidth + 0.1, 16);
  rimGeom.rotateX(Math.PI / 2);

  function createWheel() {
    const wheelGroup = new THREE.Group();
    const tire = new THREE.Mesh(wheelGeom, materials.tire);
    tire.castShadow = true;
    wheelGroup.add(tire);

    const rim = new THREE.Mesh(rimGeom, materials.rim);
    rim.castShadow = true;
    wheelGroup.add(rim);

    // Nan hoa bánh xe để thấy rõ chuyển động quay
    const spokeGeom = new THREE.BoxGeometry(ROBOT_SPEC.wheelRadius * 1.2, 0.4, ROBOT_SPEC.wheelWidth + 0.15);
    const spoke1 = new THREE.Mesh(spokeGeom, materials.spoke);
    const spoke2 = new THREE.Mesh(spokeGeom, materials.spoke);
    spoke2.rotation.z = Math.PI / 2;
    wheelGroup.add(spoke1);
    wheelGroup.add(spoke2);
    return wheelGroup;
  }

  const leftWheel = createWheel();
  leftWheel.position.set(-2.0, ROBOT_SPEC.wheelRadius, -6.6); // bên trái (z < 0)
  group.add(leftWheel);

  const rightWheel = createWheel();
  rightWheel.position.set(-2.0, ROBOT_SPEC.wheelRadius, 6.6);  // bên phải (z > 0)
  group.add(rightWheel);

  // Bánh trượt / bi thép tự do phía sau
  const casterGeom = new THREE.SphereGeometry(1.0, 12, 10);
  const casterMesh = new THREE.Mesh(casterGeom, materials.rim);
  casterMesh.position.set(-6.8, 1.0, 0);
  casterMesh.castShadow = true;
  group.add(casterMesh);

  // 4. Mắt cảm biến sóng âm (2 mắt trụ bạc phía trước)
  const eyeGeom = new THREE.CylinderGeometry(1.2, 1.2, 1.6, 16);
  eyeGeom.rotateZ(Math.PI / 2); // hướng ra trước +X

  const pupilGeom = new THREE.CylinderGeometry(0.7, 0.7, 1.7, 12);
  pupilGeom.rotateZ(Math.PI / 2);

  const sonarGroup = new THREE.Group(); // cảm biến sóng âm – cổng P1
  for (const ez of [-2.4, 2.4]) {
    const eyeHousing = new THREE.Mesh(eyeGeom, materials.sonarEye);
    eyeHousing.position.set(8.8, 3.8, ez);
    eyeHousing.castShadow = true;
    sonarGroup.add(eyeHousing);

    const pupil = new THREE.Mesh(pupilGeom, materials.sonarPupil);
    pupil.position.set(8.85, 3.8, ez);
    sonarGroup.add(pupil);
  }
  group.add(sonarGroup);

  // 5. Cảm biến dò vạch (2 mắt LED đỏ/xám dưới gầm mũi xe)
  const lineSensorGeom = new THREE.CylinderGeometry(0.45, 0.45, 0.5, 10);
  const lineGroup = new THREE.Group(); // dò vạch 2 mắt – cổng P3
  const lineBar = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.8, 7.2), materials.bumper);
  lineBar.position.set(5.5, 1.0, 0);
  lineGroup.add(lineBar);
  const leftLineLed = new THREE.Mesh(lineSensorGeom, materials.lineSensorOff);
  leftLineLed.position.set(5.5, 0.35, -2.5);
  lineGroup.add(leftLineLed);

  const rightLineLed = new THREE.Mesh(lineSensorGeom, materials.lineSensorOff);
  rightLineLed.position.set(5.5, 0.35, 2.5);
  lineGroup.add(rightLineLed);
  group.add(lineGroup);

  // Cảm biến chạm – cổng P2: hộp trắng + nút đỏ ở góc trước trái
  const touchGroup = new THREE.Group();
  const touchBox = new THREE.Mesh(new THREE.BoxGeometry(2.6, 2.2, 2.6), materials.rim);
  touchBox.position.set(6.4, 5.2, -4.0);
  touchBox.castShadow = true;
  touchGroup.add(touchBox);
  const touchBtn = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 1.0, 12), materials.touchButton);
  touchBtn.rotation.z = Math.PI / 2;
  touchBtn.position.set(7.9, 5.2, -4.0);
  touchGroup.add(touchBtn);
  group.add(touchGroup);

  // Cảm biến màu – cổng P4: hộp đen nhỏ dưới gầm, mắt sáng trắng
  const colorGroup = new THREE.Group();
  const colorBox = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.0, 2.4), materials.bumper);
  colorBox.position.set(2.6, 0.9, 0);
  colorGroup.add(colorBox);
  const colorEye = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.3, 12), materials.colorEye);
  colorEye.position.set(2.6, 0.3, 0);
  colorGroup.add(colorEye);
  group.add(colorGroup);

  // 6. Tia sóng âm & nón phát hiện
  const sonarBeamGroup = new THREE.Group();
  sonarBeamGroup.position.set(9.6, 3.8, 0);

  const rayGeom = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(1, 0, 0)
  ]);
  const sonarRay = new THREE.Line(rayGeom, materials.sonarRay);
  sonarBeamGroup.add(sonarRay);

  // Nón sóng âm hình quạt mờ (ultrasonic cone)
  const coneGeom = new THREE.ConeGeometry(8, 30, 16, 1, true);
  coneGeom.rotateZ(-Math.PI / 2);
  coneGeom.translate(15, 0, 0);
  const sonarCone = new THREE.Mesh(coneGeom, materials.sonarCone);
  sonarBeamGroup.add(sonarCone);

  // Vòng sóng phản xạ tại điểm chạm vật cản
  const hitRingGeom = new THREE.RingGeometry(1.2, 2.2, 18);
  hitRingGeom.rotateY(Math.PI / 2);
  const hitRing = new THREE.Mesh(hitRingGeom, materials.sonarHitRing);
  hitRing.visible = false;
  sonarBeamGroup.add(hitRing);

  group.add(sonarBeamGroup);

  // Các khối hộp dựng bằng code (xe dự phòng): bị ẩn khi mô hình kit thật nạp xong
  const keep = new Set([ledMesh, ledLight, lineGroup, touchGroup, colorGroup, sonarBeamGroup]);
  const boxy = group.children.filter(o => !keep.has(o));

  return {
    group,
    boxy,
    sonarBeamGroup,
    parts: { dist: sonarGroup, line: lineGroup, touch: touchGroup, color: colorGroup, led: ledMesh },
    chassisMesh,
    leftWheel,
    rightWheel,
    leftLineLed,
    rightLineLed,
    ledMesh,
    ledLight,
    sonarRay,
    sonarCone,
    hitRing,
    materials
  };
}

// opts: { hud=true, follow=true, transparent=false, spin=0 (rad/giây quay quanh), showcase=false (chỉ hiện xe), radius, theta }
function createView3D(container, opts = {}) {
  if (!container) throw new Error('CodeLabView3D.create: container không hợp lệ.');

  // 1. Cài đặt Renderer & Scene
  const scene = new THREE.Scene();
  scene.background = opts.transparent ? null : new THREE.Color(0xdce5ec); // Tone xám xanh RoboSim

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: !!opts.transparent, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(container.clientWidth || 800, container.clientHeight || 540);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const canvas = renderer.domElement;
  canvas.style.display = 'block';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.outline = 'none';
  container.style.position = 'relative';
  container.style.overflow = 'hidden';
  container.appendChild(canvas);

  // 2. Camera & Điều khiển Orbit + Theo xe
  const camera = new THREE.PerspectiveCamera(40, (container.clientWidth || 800) / (container.clientHeight || 540), 1, 2000);
  
  // Trạng thái camera mượt mà
  const camState = {
    target: new THREE.Vector3(100, 4, 60),
    currentCamTarget: new THREE.Vector3(100, 4, 60),
    radius: opts.radius || 240,
    currentRadius: opts.radius || 240,
    theta: opts.theta || 0.65, // ~37 độ góc nghiêng
    currentTheta: opts.theta || 0.65,
    phi: -0.85,  // góc xoay ngang
    currentPhi: -0.85,
    followRobot: opts.follow !== false,
    isTopDown: false
  };

  // 3. Ánh sáng
  const hemiLight = new THREE.HemisphereLight(0xffffff, 0x64748b, 0.85);
  scene.add(hemiLight);

  const dirLight = new THREE.DirectionalLight(0xfffbeb, 1.4);
  dirLight.position.set(120, 260, -80);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.width = 2048;
  dirLight.shadow.mapSize.height = 2048;
  dirLight.shadow.camera.near = 20;
  dirLight.shadow.camera.far = 800;
  dirLight.shadow.bias = -0.0008;
  const d = 180;
  dirLight.shadow.camera.left = -d;
  dirLight.shadow.camera.right = d;
  dirLight.shadow.camera.top = d;
  dirLight.shadow.camera.bottom = -d;
  scene.add(dirLight);

  const fillLight = new THREE.DirectionalLight(0xdbeafe, 0.5);
  fillLight.position.set(-100, 120, 150);
  scene.add(fillLight);

  // 4. Vật liệu chung
  const gridTexture = createGridTexture();
  const hazardTexture = createHazardTexture();
  const checkeredTexture = createCheckeredTexture();

  const materials = {
    floor: new THREE.MeshStandardMaterial({
      map: gridTexture,
      roughness: 0.85,
      metalness: 0.05
    }),
    rimFrame: new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.5,
      metalness: 0.2
    }),
    outerWall: new THREE.MeshStandardMaterial({
      color: 0x475569,
      roughness: 0.6,
      metalness: 0.1
    }),
    obstacleWall: new THREE.MeshStandardMaterial({
      color: 0x334155,
      map: hazardTexture,
      roughness: 0.7,
      metalness: 0.1
    }),
    wallTopCap: new THREE.MeshStandardMaterial({
      color: 0x64748b,
      roughness: 0.4,
      metalness: 0.15
    }),
    chassis: new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      roughness: 0.3,
      metalness: 0.1
    }),
    chassisHit: new THREE.MeshStandardMaterial({
      color: 0xdc2626,
      roughness: 0.3,
      metalness: 0.1
    }),
    bumper: new THREE.MeshStandardMaterial({
      color: 0x18181b,
      roughness: 0.8,
      metalness: 0.1
    }),
    controller: new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      roughness: 0.4,
      metalness: 0.05
    }),
    lcd: new THREE.MeshBasicMaterial({ color: 0x0f172a }),
    button: new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.5 }),
    led: new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0x000000,
      roughness: 0.1,
      transparent: true,
      opacity: 0.85
    }),
    tire: new THREE.MeshStandardMaterial({
      color: 0x18181b,
      roughness: 0.9,
      metalness: 0.05
    }),
    rim: new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      roughness: 0.3,
      metalness: 0.7
    }),
    spoke: new THREE.MeshStandardMaterial({
      color: 0x64748b,
      roughness: 0.4,
      metalness: 0.5
    }),
    sonarEye: new THREE.MeshStandardMaterial({
      color: 0xcfd8dc,
      roughness: 0.2,
      metalness: 0.8
    }),
    sonarPupil: new THREE.MeshBasicMaterial({ color: 0x1e293b }),
    lineSensorOn: new THREE.MeshBasicMaterial({ color: 0xef4444 }),
    lineSensorOff: new THREE.MeshBasicMaterial({ color: 0x64748b }),
    sonarRay: new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.85
    }),
    sonarCone: new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.12,
      side: THREE.DoubleSide,
      depthWrite: false
    }),
    sonarHitRing: new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.75,
      side: THREE.DoubleSide
    }),
    tapeLine: new THREE.MeshBasicMaterial({
      color: 0x1b1f24,
      side: THREE.DoubleSide
    }),
    goalBorder: new THREE.MeshBasicMaterial({
      map: checkeredTexture,
      transparent: true,
      opacity: 0.9
    }),
    trail: new THREE.LineBasicMaterial({
      color: 0x0284c7,
      transparent: true,
      opacity: 0.65,
      linewidth: 2
    }),
    touchButton: new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.4 }),
    colorEye: new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff4d6, emissiveIntensity: 0.8 }),
    studPlate: new THREE.MeshStandardMaterial({ map: createStudTexture(), roughness: 0.75 }),
    flagPole: new THREE.MeshStandardMaterial({
      color: 0xcfd8dc,
      roughness: 0.25,
      metalness: 0.8
    }),
    flagFinial: new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      roughness: 0.2,
      metalness: 0.85
    }),
    flagBannerActive: new THREE.MeshStandardMaterial({
      color: 0xe8892b, // RoboSim orange
      roughness: 0.5,
      side: THREE.DoubleSide
    }),
    flagBannerDone: new THREE.MeshStandardMaterial({
      color: 0x10b981, // Emerald green
      roughness: 0.5,
      side: THREE.DoubleSide
    })
  };

  let disposed = false;

  // 5. Khởi tạo Robot 3D
  const robot = buildAlpha330Robot(materials);
  scene.add(robot.group);

  // Tấm đế có núm dưới xe (màn Lắp robot)
  if (opts.baseplate) {
    materials.studPlate.map.repeat.set(30, 30);
    const plate = new THREE.Mesh(new THREE.PlaneGeometry(120, 120), materials.studPlate);
    plate.rotation.x = -Math.PI / 2;
    plate.position.set(30, 0, 20);
    plate.receiveShadow = true;
    scene.add(plate);
  }

  // Cảm biến đang gắn: { dist, touch, line, color, led } – rỗng thì ẩn bộ phận và tia sóng âm
  let mounted = { dist: true, touch: true, line: true, color: true, led: true };
  function setMounted(m) {
    mounted = { ...m };
    for (const [key, part] of Object.entries(robot.parts)) part.visible = !!mounted[key];
  }

  // Xe thật từ mô hình kit (kit-car.js): nạp bất đồng bộ; đang chờ/lỗi thì giữ xe hộp
  let carSource = 'box';
  let kitMaterials = null;
  loadKitCar(THREE).then(kit => {
    if (disposed) return;
    for (const o of robot.boxy) o.visible = false;
    robot.group.add(kit.group);
    robot.leftWheel = kit.wheelL;
    robot.rightWheel = kit.wheelR;
    robot.parts.dist = kit.sonar;
    robot.sonarBeamGroup.position.set(kit.sonarFront.x + 0.2, kit.sonarFront.y, 0);
    // Cảm biến phụ của xe hộp đặt lại theo thân xe thật
    robot.parts.touch.position.set(0, -2.6, 0);
    robot.parts.led.position.y += 1.6;
    kitMaterials = kit.materials;
    carSource = 'kit';
    setMounted(mounted);
    container.dataset.carSource = 'kit';
  }).catch(err => {
    console.warn('Xe 3D kit không nạp được, dùng xe hộp:', err && err.message);
  });

  // 6. Nhóm sa bàn (Floor, Walls, Zones, Lines, Flags)
  const mapGroup = new THREE.Group();
  scene.add(mapGroup);

  // 7. Vệt đường đi (Trail)
  const trailGeom = new THREE.BufferGeometry();
  const trailLine = new THREE.Line(trailGeom, materials.trail);
  scene.add(trailLine);

  // Quản lý trạng thái map hiện tại
  let currentMapKey = '';
  let floorMesh = null;
  let bgTex = null, bgMat = null;
  let rimMesh = null;
  let flagsData = []; // [{ group, banner, baseDisc }]
  let contestButtons = [];
  let goalMarkers = []; // 3D floating markers above goal zones

  function buildMap(map) {
    // Dọn dẹp mapGroup cũ
    while (mapGroup.children.length > 0) {
      const obj = mapGroup.children[0];
      mapGroup.remove(obj);
      if (obj.geometry) obj.geometry.dispose();
    }
    flagsData = [];
    contestButtons = [];
    goalMarkers = [];

    const [W, H] = map.size;
    const cx = W / 2, cz = H / 2;

    // Cập nhật vị trí bóng đổ
    dirLight.target.position.set(cx, 0, cz);
    scene.add(dirLight.target);

    // Cập nhật lặp lại của lưới sân (50cm mỗi tile)
    gridTexture.repeat.set(W / 50, H / 50);

    // Mặt sân
    const floorGeom = new THREE.PlaneGeometry(W, H);
    // Ảnh nền sân do trình thiết kế sa bàn lưu (map.bg = dataURL): vẽ làm texture mặt sân thay cho lưới
    if (bgTex) { bgTex.dispose(); bgTex = null; }
    if (bgMat) { bgMat.dispose(); bgMat = null; }
    if (typeof map.bg === 'string' && map.bg.startsWith('data:image/')) {
      bgTex = new THREE.TextureLoader().load(map.bg);
      bgTex.colorSpace = THREE.SRGBColorSpace;
      bgTex.anisotropy = 4;
      bgMat = new THREE.MeshStandardMaterial({ map: bgTex, roughness: 0.85, metalness: 0.05 });
    }
    floorMesh = new THREE.Mesh(floorGeom, bgMat || materials.floor);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.position.set(cx, 0, cz);
    floorMesh.receiveShadow = true;
    mapGroup.add(floorMesh);

    // Khung viền ngoài sa bàn (Rim border)
    const rimShape = new THREE.Shape();
    const pad = 3.5;
    rimShape.moveTo(-pad, -pad);
    rimShape.lineTo(W + pad, -pad);
    rimShape.lineTo(W + pad, H + pad);
    rimShape.lineTo(-pad, H + pad);
    rimShape.closePath();

    const hole = new THREE.Path();
    hole.moveTo(0, 0);
    hole.lineTo(0, H);
    hole.lineTo(W, H);
    hole.lineTo(W, 0);
    hole.closePath();
    rimShape.holes.push(hole);

    const rimGeom = new THREE.ExtrudeGeometry(rimShape, {
      depth: 2.2,
      bevelEnabled: true,
      bevelSegments: 2,
      steps: 1,
      bevelSize: 0.6,
      bevelThickness: 0.6
    });
    rimMesh = new THREE.Mesh(rimGeom, materials.rimFrame);
    rimMesh.rotation.x = Math.PI / 2;
    rimMesh.position.set(0, 2.2, 0);
    rimMesh.receiveShadow = true;
    rimMesh.castShadow = true;
    mapGroup.add(rimMesh);

    // Thêm các thành phần trong map
    for (const item of map.items) {
      if (item.k === 'zone') {
        buildZone(item);
      } else if (item.k === 'line') {
        buildLine(item);
      } else if (item.k === 'wall') {
        buildWall(item, W, H);
      } else if (item.k === 'flag') {
        buildFlag(item);
      } else if (item.k === 'dock') {
        buildContestDock(item);
      } else if (item.k === 'marker') {
        buildContestMarker(item);
      } else if (item.k === 'ramp') {
        buildContestRamp(item);
      } else if (item.k === 'button') {
        buildContestButton(item);
      }
    }

    if (map.blackHole) {
      const h = map.blackHole;
      h.diameters.forEach((d, i) => {
        const ring = new THREE.Mesh(new THREE.RingGeometry(d / 2 - 1.1, d / 2 + 1.1, 80),
          new THREE.MeshBasicMaterial({ color: [0x35384d, 0x252a43, 0x111827][i], side: THREE.DoubleSide }));
        ring.rotation.x = -Math.PI / 2;
        ring.position.set(h.x, 0.11 + i * 0.005, h.y);
        mapGroup.add(ring);
      });
      const center = new THREE.Mesh(new THREE.CircleGeometry(h.diameters.at(-1) / 2, 64),
        new THREE.MeshBasicMaterial({ color: 0x111321 }));
      center.rotation.x = -Math.PI / 2;
      center.position.set(h.x, 0.09, h.y);
      mapGroup.add(center);
    }

    // Đặt camera nhìn bao quát sân nếu chưa khóa
    if (!camState.followRobot) {
      camState.target.set(cx, 4, cz);
      camState.radius = Math.max(W, H) * 1.35;
    }
  }

  function buildWall(item, mapW, mapH) {
    // Phân biệt tường rào biên (dày <= 4cm) và khối chướng ngại vật
    const isPerimeter = item.w <= 4 || item.h <= 4;
    const wallHeight = isPerimeter ? 6.5 : 15.0;
    const wallGeom = new THREE.BoxGeometry(item.w, wallHeight, item.h);
    const wallMat = isPerimeter ? materials.outerWall : materials.obstacleWall;

    const wallMesh = new THREE.Mesh(wallGeom, wallMat);
    wallMesh.position.set(item.x + item.w / 2, wallHeight / 2, item.y + item.h / 2);
    wallMesh.castShadow = true;
    wallMesh.receiveShadow = true;
    mapGroup.add(wallMesh);

    // Nắp trên của tường vát sáng nhẹ
    const capGeom = new THREE.BoxGeometry(item.w + 0.2, 0.4, item.h + 0.2);
    const capMesh = new THREE.Mesh(capGeom, materials.wallTopCap);
    capMesh.position.set(item.x + item.w / 2, wallHeight + 0.2, item.y + item.h / 2);
    capMesh.castShadow = true;
    mapGroup.add(capMesh);
  }

  function buildZone(item) {
    const colorVal = ZONE_COLORS[item.color] || ZONE_COLORS.green;
    const zoneMat = new THREE.MeshStandardMaterial({
      color: colorVal,
      roughness: 0.6,
      metalness: 0.05,
      transparent: true,
      opacity: item.goal ? 0.45 : 0.65
    });

    const zoneGeom = new THREE.PlaneGeometry(item.w, item.h);
    const zoneMesh = new THREE.Mesh(zoneGeom, zoneMat);
    zoneMesh.rotation.x = -Math.PI / 2;
    zoneMesh.position.set(item.x + item.w / 2, 0.08, item.y + item.h / 2);
    zoneMesh.receiveShadow = true;
    mapGroup.add(zoneMesh);

    if (item.goal) {
      // Viền đích sọc caro
      const borderGeom = new THREE.PlaneGeometry(item.w + 1.2, item.h + 1.2);
      const borderMesh = new THREE.Mesh(borderGeom, materials.goalBorder);
      borderMesh.rotation.x = -Math.PI / 2;
      borderMesh.position.set(item.x + item.w / 2, 0.06, item.y + item.h / 2);
      mapGroup.add(borderMesh);

      // Biểu tượng cờ đích 3D nổi lơ lửng phía trên
      const markerGroup = new THREE.Group();
      markerGroup.position.set(item.x + item.w / 2, 10, item.y + item.h / 2);

      const starGeom = new THREE.OctahedronGeometry(2.5, 0);
      const starMat = new THREE.MeshStandardMaterial({
        color: 0x10b981,
        emissive: 0x059669,
        roughness: 0.2,
        metalness: 0.6
      });
      const star = new THREE.Mesh(starGeom, starMat);
      markerGroup.add(star);

      const ringGeom = new THREE.TorusGeometry(3.6, 0.35, 12, 24);
      ringGeom.rotateX(Math.PI / 2);
      const ring = new THREE.Mesh(ringGeom, starMat);
      markerGroup.add(ring);

      mapGroup.add(markerGroup);
      goalMarkers.push(markerGroup);
    }
  }

  function buildLine(item) {
    if (!item.pts || item.pts.length < 2) return;
    const w = (item.w || 2.5);
    const halfW = w / 2;

    // Dựng dải băng theo các đoạn điểm
    for (let i = 0; i < item.pts.length - 1; i++) {
      const p1 = item.pts[i];
      const p2 = item.pts[i + 1];
      const dx = p2[0] - p1[0];
      const dy = p2[1] - p1[1];
      const len = Math.hypot(dx, dy);
      if (len < 1e-4) continue;

      const segGeom = new THREE.PlaneGeometry(w, len);
      const seg = new THREE.Mesh(segGeom, materials.tapeLine);
      seg.rotation.x = -Math.PI / 2;
      const angle = Math.atan2(dx, dy);
      seg.rotation.z = angle; // trục dài của mặt phẳng (y) sau khi nằm ngang trỏ về -Z

      seg.position.set((p1[0] + p2[0]) / 2, 0.06, (p1[1] + p2[1]) / 2);
      seg.receiveShadow = true;
      mapGroup.add(seg);

      // Đầu nối tròn ở mỗi điểm mút
      const capGeom = new THREE.CircleGeometry(halfW, 16);
      const cap = new THREE.Mesh(capGeom, materials.tapeLine);
      cap.rotation.x = -Math.PI / 2;
      cap.position.set(p1[0], 0.062, p1[1]);
      mapGroup.add(cap);
      if (i === item.pts.length - 2) {
        const endCap = new THREE.Mesh(capGeom, materials.tapeLine);
        endCap.rotation.x = -Math.PI / 2;
        endCap.position.set(p2[0], 0.062, p2[1]);
        mapGroup.add(endCap);
      }
    }
  }

  function buildFlag(item) {
    const flagGroup = new THREE.Group();
    flagGroup.position.set(item.x, 0, item.y);

    // Đế tròn kim loại
    const baseGeom = new THREE.CylinderGeometry(3.0, 3.4, 0.6, 18);
    const baseDisc = new THREE.Mesh(baseGeom, materials.rim);
    baseDisc.position.y = 0.3;
    baseDisc.receiveShadow = true;
    baseDisc.castShadow = true;
    flagGroup.add(baseDisc);

    // Cột cờ
    const poleGeom = new THREE.CylinderGeometry(0.35, 0.35, 17, 12);
    const pole = new THREE.Mesh(poleGeom, materials.flagPole);
    pole.position.y = 8.5;
    pole.castShadow = true;
    flagGroup.add(pole);

    // Đỉnh cầu vàng
    const topGeom = new THREE.SphereGeometry(0.8, 12, 10);
    const topSphere = new THREE.Mesh(topGeom, materials.flagFinial);
    topSphere.position.y = 17.0;
    topSphere.castShadow = true;
    flagGroup.add(topSphere);

    // Lá cờ tam giác
    const flagShape = new THREE.Shape();
    flagShape.moveTo(0, 16.5);
    flagShape.lineTo(6.5, 13.5);
    flagShape.lineTo(0, 10.5);
    flagShape.closePath();

    const bannerGeom = new THREE.ShapeGeometry(flagShape);
    const banner = new THREE.Mesh(bannerGeom, materials.flagBannerActive);
    banner.castShadow = true;
    flagGroup.add(banner);

    mapGroup.add(flagGroup);
    flagsData.push({ group: flagGroup, banner, baseDisc });
  }

  // Chữ trên cờ và bến được vẽ trực tiếp lên texture.
  function contestLabel(label, background, foreground = '#ffffff') {
    const canvas = document.createElement('canvas');
    canvas.width = 256; canvas.height = 256;
    const context = canvas.getContext('2d');
    context.fillStyle = background;
    context.fillRect(0, 0, 256, 256);
    context.fillStyle = foreground;
    context.font = `bold ${String(label).length > 1 ? 120 : 190}px Arial, sans-serif`;
    context.textAlign = 'center'; context.textBaseline = 'middle';
    context.fillText(label, 128, 138);
    const texture = new THREE.CanvasTexture(canvas);
    return new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide, transparent: true });
  }

  function buildContestDock(item) {
    const plate = new THREE.Mesh(new THREE.PlaneGeometry(item.w, item.h),
      new THREE.MeshBasicMaterial({ color: item.role === 'start' ? 0x77cba0 : 0x83b9ed, transparent: true, opacity: 0.55 }));
    plate.rotation.x = -Math.PI / 2;
    plate.position.set(item.x + item.w / 2, 0.12, item.y + item.h / 2);
    mapGroup.add(plate);
    const letter = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), contestLabel(item.label, '#ffffff', '#1d3553'));
    letter.rotation.x = -Math.PI / 2;
    letter.position.set(item.x + item.w / 2, 0.14, item.y + item.h / 2);
    mapGroup.add(letter);
    const border = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(item.x, 0.16, item.y), new THREE.Vector3(item.x + item.w, 0.16, item.y),
      new THREE.Vector3(item.x + item.w, 0.16, item.y + item.h), new THREE.Vector3(item.x, 0.16, item.y + item.h)
    ]), new THREE.LineBasicMaterial({ color: item.role === 'start' ? 0x159654 : 0x1871c0 }));
    mapGroup.add(border);
  }

  function buildContestMarker(item) {
    const nx = -Math.sin(item.dir || 0), ny = Math.cos(item.dir || 0), half = (item.len || 18) / 2;
    const x = item.x + nx * half, z = item.y + ny * half;
    buildLine({ w: 1, pts: [[item.x - nx * half, item.y - ny * half], [x, z]] });
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 11, 8),
      new THREE.MeshStandardMaterial({ color: 0x344155 }));
    pole.position.set(x, 5.5, z);
    mapGroup.add(pole);
    const flag = new THREE.Mesh(new THREE.PlaneGeometry(7, 6), contestLabel(item.label, '#b91c1c'));
    flag.position.set(x + 3.5, 9, z);
    mapGroup.add(flag);
  }

  function buildContestRamp(item) {
    const group = new THREE.Group();
    const width = item.axis === 'y' ? item.w : item.h;
    const length = item.axis === 'y' ? item.h : item.w;
    const mat = new THREE.MeshStandardMaterial({ color: 0xb4a68e, roughness: 0.85, side: THREE.DoubleSide });
    for (const [a, b, heightA, heightB] of [[0, 5, 0, 2], [20, length, 2, 0]]) {
      const shape = new THREE.Shape();
      shape.moveTo(a, 0); shape.lineTo(b, 0); shape.lineTo(b, heightB);
      shape.lineTo(a, heightA); shape.closePath();
      const mesh = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: width, bevelEnabled: false }), mat);
      group.add(mesh);
    }
    const platform = new THREE.Mesh(new THREE.BoxGeometry(15, 2, width),
      new THREE.MeshStandardMaterial({ color: 0x868d98, roughness: 0.7 }));
    platform.position.set(12.5, 1, width / 2);
    group.add(platform);
    if (item.axis === 'y') {
      group.rotation.y = -Math.PI / 2;
      group.position.set(item.x + width, 0, item.y);
    } else group.position.set(item.x, 0, item.y);
    mapGroup.add(group);
  }

  function buildContestButton(item) {
    const group = new THREE.Group();
    group.position.set(item.x, 0, item.y);
    const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(2, 2.8, 5, 16),
      new THREE.MeshStandardMaterial({ color: 0x637282 }));
    pedestal.position.y = 2.5;
    group.add(pedestal);
    const light = new THREE.Mesh(new THREE.CylinderGeometry(item.radius || 3, item.radius || 3, 1.2, 20),
      new THREE.MeshStandardMaterial({ color: 0xdc2626, emissive: 0x8a1010 }));
    light.position.y = 5.6;
    group.add(light);
    const tag = new THREE.Mesh(new THREE.PlaneGeometry(7, 5), contestLabel(item.label || 'A1', '#ba1a1a'));
    tag.position.set(0, 10, 0);
    group.add(tag);
    contestButtons.push(light);
    mapGroup.add(group);
  }

  // 8. Tương tác chuột và cảm ứng xoay / phóng / trượt
  let isDragging = false;
  let isRightDrag = false;
  let prevPointer = { x: 0, y: 0 };
  let touchDistance = 0;

  function onPointerDown(e) {
    if (e.target !== canvas && e.target !== container) return;
    isDragging = true;
    isRightDrag = e.button === 2;
    prevPointer = { x: e.clientX, y: e.clientY };
    canvas.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e) {
    if (!isDragging) return;
    const dx = e.clientX - prevPointer.x;
    const dy = e.clientY - prevPointer.y;
    prevPointer = { x: e.clientX, y: e.clientY };

    if (isRightDrag) {
      // Trượt góc nhìn (Pan)
      camState.followRobot = false;
      updateHudButtons();
      const factor = camState.radius * 0.0018;
      const forward = new THREE.Vector3(-Math.sin(camState.phi), 0, -Math.cos(camState.phi));
      const right = new THREE.Vector3(Math.cos(camState.phi), 0, -Math.sin(camState.phi));
      camState.target.addScaledVector(right, -dx * factor);
      camState.target.addScaledVector(forward, dy * factor);
    } else {
      // Xoay góc nhìn (Orbit)
      camState.phi -= dx * 0.007;
      camState.theta = Math.max(0.12, Math.min(1.48, camState.theta + dy * 0.007));
      camState.isTopDown = false;
    }
  }

  function onPointerUp(e) {
    isDragging = false;
    isRightDrag = false;
    try { canvas.releasePointerCapture(e.pointerId); } catch (_) {}
  }

  function onWheel(e) {
    e.preventDefault();
    const zoom = Math.exp(e.deltaY * 0.001);
    camState.radius = Math.max(45, Math.min(650, camState.radius * zoom));
  }

  // Hỗ trợ pinch-to-zoom trên màn hình cảm ứng điện thoại / máy tính bảng
  function onTouchStart(e) {
    if (e.touches.length === 2) {
      touchDistance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
    }
  }

  function onTouchMove(e) {
    if (e.touches.length === 2) {
      e.preventDefault();
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      if (touchDistance > 0) {
        const factor = touchDistance / dist;
        camState.radius = Math.max(45, Math.min(650, camState.radius * factor));
      }
      touchDistance = dist;
    }
  }

  function onTouchEnd() {
    touchDistance = 0;
  }

  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('pointercancel', onPointerUp);
  canvas.addEventListener('wheel', onWheel, { passive: false });
  canvas.addEventListener('touchstart', onTouchStart, { passive: true });
  canvas.addEventListener('touchmove', onTouchMove, { passive: false });
  canvas.addEventListener('touchend', onTouchEnd);
  canvas.addEventListener('contextmenu', e => e.preventDefault());

  // 9. Giao diện điều khiển nổi (Control HUD)
  const hud = document.createElement('div');
  hud.className = 'cl-view3d-hud';
  hud.style.cssText = `
    position: absolute;
    top: 10px;
    right: 10px;
    display: flex;
    gap: 6px;
    z-index: 10;
    pointer-events: auto;
    font-family: system-ui, -apple-system, sans-serif;
    font-size: 12px;
  `;

  hud.innerHTML = `
    <button type="button" class="cl-3d-btn btn-follow" title="Giữ robot ở trung tâm camera" style="
      background: #0284c7; color: #fff; border: 1px solid rgba(255,255,255,0.25);
      padding: 5px 10px; border-radius: 6px; cursor: pointer; font-weight: 500;
      box-shadow: 0 2px 5px rgba(0,0,0,0.2); transition: all .15s;
    ">🎯 Theo xe: BẬT</button>
    <button type="button" class="cl-3d-btn btn-view" title="Chuyển góc nhìn nghiêng / nhìn thẳng từ trên" style="
      background: rgba(15, 23, 42, 0.75); color: #fff; border: 1px solid rgba(255,255,255,0.2);
      padding: 5px 10px; border-radius: 6px; cursor: pointer; font-weight: 500;
      box-shadow: 0 2px 5px rgba(0,0,0,0.2); backdrop-filter: blur(4px);
    ">📐 3D nghiêng</button>
    <button type="button" class="cl-3d-btn btn-overview" title="Nhìn toàn cảnh cả sa bàn" style="
      background: rgba(15, 23, 42, 0.75); color: #fff; border: 1px solid rgba(255,255,255,0.2);
      padding: 5px 10px; border-radius: 6px; cursor: pointer; font-weight: 500;
      box-shadow: 0 2px 5px rgba(0,0,0,0.2); backdrop-filter: blur(4px);
    ">⛶ Toàn cảnh</button>
  `;
  container.appendChild(hud);
  if (opts.hud === false) hud.style.display = 'none';

  const btnFollow = hud.querySelector('.btn-follow');
  const btnView = hud.querySelector('.btn-view');
  const btnOverview = hud.querySelector('.btn-overview');

  function updateHudButtons() {
    if (camState.followRobot) {
      btnFollow.style.background = '#0284c7';
      btnFollow.textContent = '🎯 Theo xe: BẬT';
    } else {
      btnFollow.style.background = 'rgba(15, 23, 42, 0.75)';
      btnFollow.textContent = '🎯 Theo xe: TẮT';
    }
    btnView.textContent = camState.isTopDown ? '📐 Nhìn trên (2D)' : '📐 3D nghiêng';
  }

  btnFollow.addEventListener('click', () => {
    camState.followRobot = !camState.followRobot;
    if (camState.followRobot) {
      camState.radius = 160;
    }
    updateHudButtons();
  });

  btnView.addEventListener('click', () => {
    camState.isTopDown = !camState.isTopDown;
    if (camState.isTopDown) {
      camState.theta = 1.45; // Gần 90 độ, nhìn từ trên thẳng xuống
    } else {
      camState.theta = 0.65; // Góc nghiêng RoboSim 37 độ
    }
    updateHudButtons();
  });

  btnOverview.addEventListener('click', () => {
    camState.followRobot = false;
    if (lastSim && lastSim.map) {
      const [W, H] = lastSim.map.size;
      camState.target.set(W / 2, 4, H / 2);
      camState.radius = Math.max(W, H) * 1.35;
    }
    camState.theta = 0.65;
    camState.isTopDown = false;
    updateHudButtons();
  });

  // 10. Vòng lặp Render & Animation
  let lastSim = null;
  let animId = 0;
  let lastTime = performance.now();

  function tickLoop(now) {
    animId = requestAnimationFrame(tickLoop);
    const dt = Math.min((now - lastTime) / 1000, 0.1);
    lastTime = now;
    if (container.offsetParent === null) return; // màn đang ẩn: không vẽ (trang có tới 3 cảnh 3D)

    // Cập nhật vị trí bám theo xe mượt mà (Lerp)
    if (lastSim && lastSim.robot) {
      const r = lastSim.robot;
      if (camState.followRobot) {
        camState.target.x += (r.x - camState.target.x) * 0.12;
        camState.target.z += (r.y - camState.target.z) * 0.12;
        camState.target.y += (4.0 - camState.target.y) * 0.12;
      }

      // Lăn bánh xe theo vận tốc tức thời vl/vr
      const wheelCircumference = ROBOT_SPEC.wheelRadius;
      robot.leftWheel.rotation.z -= (r.vl / wheelCircumference) * dt;
      robot.rightWheel.rotation.z -= (r.vr / wheelCircumference) * dt;
    }

    if (opts.spin) camState.phi += dt * opts.spin;

    // Xoay nhẹ biểu tượng đích
    for (const gm of goalMarkers) {
      gm.rotation.y += dt * 1.5;
      gm.position.y = 9.0 + Math.sin(now * 0.003) * 1.5;
    }

    // Gợn sóng cờ chưa thu
    flagsData.forEach((f, i) => {
      if (!lastSim || !lastSim.flags || !lastSim.flags[i]) {
        f.banner.rotation.y = Math.sin(now * 0.005 + i) * 0.15;
      }
    });

    // Lerp camera chuyển động êm ái
    camState.currentCamTarget.lerp(camState.target, 0.14);
    camState.currentRadius += (camState.radius - camState.currentRadius) * 0.14;
    camState.currentTheta += (camState.theta - camState.currentTheta) * 0.14;
    camState.currentPhi += (camState.phi - camState.currentPhi) * 0.14;

    const ct = Math.cos(camState.currentTheta);
    const st = Math.sin(camState.currentTheta);
    const cp = Math.cos(camState.currentPhi);
    const sp = Math.sin(camState.currentPhi);

    camera.position.set(
      camState.currentCamTarget.x + camState.currentRadius * ct * sp,
      camState.currentCamTarget.y + camState.currentRadius * st,
      camState.currentCamTarget.z + camState.currentRadius * ct * cp
    );
    camera.lookAt(camState.currentCamTarget);

    renderer.render(scene, camera);
  }

  animId = requestAnimationFrame(tickLoop);

  // 11. Phương thức render(sim) đồng bộ dữ liệu
  function render(sim) {
    if (!sim) return;
    lastSim = sim;

    // Kiểm tra thay đổi sa bàn hoặc tường di động
    const map = sim.map;
    const mapKey = map.id + '_' + map.size.join('x') + '_' +
      map.items.map(it => `${it.k}:${it.x}:${it.y}:${it.w}:${it.h}`).join(';') +
      (map.bg ? '_bg' + map.bg.length + map.bg.slice(-24) : '');

    if (mapKey !== currentMapKey) {
      currentMapKey = mapKey;
      buildMap(map);
    }

    if (opts.showcase) mapGroup.visible = false;
    robot.sonarRay.visible = robot.sonarCone.visible = !opts.showcase && !!mounted.dist;

    // Đồng bộ vị trí và góc quay của robot Alpha 330
    const r = sim.robot;
    robot.group.position.set(r.x, 0, r.y);
    robot.group.rotation.y = -r.th; // Trục Y hướng xuống trong 2D -> quay quanh Y ngược lại trong 3D

    // Trạng thái va chạm: thân xe chuyển đỏ rực
    robot.chassisMesh.material = sim.touching ? materials.chassisHit : materials.chassis;
    if (kitMaterials) for (const m of kitMaterials) m.emissive.setHex(sim.touching ? 0x7f1d1d : 0x000000);

    // Trạng thái cảm biến
    const sensors = sim.sensors();

    // Mắt dò vạch LED sáng đỏ khi thấy vạch đen
    robot.leftLineLed.material = sensors.lineL ? materials.lineSensorOn : materials.lineSensorOff;
    robot.rightLineLed.material = sensors.lineR ? materials.lineSensorOn : materials.lineSensorOff;

    // Đèn LED trên nóc robot
    if (r.led) {
      const hex = ZONE_COLORS[r.led] || 0xffffff;
      materials.led.color.setHex(hex);
      materials.led.emissive.setHex(hex);
      robot.ledLight.color.setHex(hex);
      robot.ledLight.intensity = 2.5;
    } else {
      materials.led.color.setHex(0xffffff);
      materials.led.emissive.setHex(0x000000);
      robot.ledLight.intensity = 0;
    }

    // Tia sóng âm siêu âm
    const dist = sensors.dist !== null ? sensors.dist : ROBOT_SPEC.sonarMax;
    const isClose = sensors.dist !== null && sensors.dist < 25;

    const beamColor = isClose ? 0xef4444 : (sensors.dist !== null ? 0xec4899 : 0x38bdf8);
    materials.sonarRay.color.setHex(beamColor);
    materials.sonarCone.color.setHex(beamColor);
    materials.sonarHitRing.color.setHex(beamColor);

    // Cập nhật độ dài tia sóng âm
    const rayPositions = robot.sonarRay.geometry.attributes.position.array;
    rayPositions[3] = dist;
    robot.sonarRay.geometry.attributes.position.needsUpdate = true;

    // Cập nhật hình nón sóng âm
    robot.sonarCone.scale.set(dist / 30, dist / 30, dist / 30);
    robot.sonarCone.position.x = 0;

    // Vòng phản xạ sóng tại điểm gặp chướng ngại
    if (sensors.dist !== null && !opts.showcase && mounted.dist) {
      robot.hitRing.visible = true;
      robot.hitRing.position.set(dist, 0, 0);
    } else {
      robot.hitRing.visible = false;
    }

    // Cập nhật trạng thái các lá cờ (đã thu -> xanh lá, hạ cờ)
    if (sim.flags && flagsData.length > 0) {
      sim.flags.forEach((collected, i) => {
        if (!flagsData[i]) return;
        const f = flagsData[i];
        f.banner.material = collected ? materials.flagBannerDone : materials.flagBannerActive;
        f.banner.position.y = collected ? -3.0 : 0;
      });
    }
    contestButtons.forEach((button, i) => {
      const active = sim.scored && sim.scored.has('button:' + i);
      button.material.color.setHex(active ? 0x16a34a : 0xdc2626);
      button.material.emissive.setHex(active ? 0x0c7839 : 0x8a1010);
    });

    // Cập nhật vệt đường xe chạy (Trail)
    if (sim.trail && sim.trail.length > 1) {
      const points = [];
      for (let i = 0; i < sim.trail.length; i++) {
        points.push(sim.trail[i][0], 0.05, sim.trail[i][1]);
      }
      points.push(r.x, 0.05, r.y);
      trailGeom.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
      trailLine.visible = true;
    } else {
      trailLine.visible = false;
    }
  }

  // 12. Phương thức thay đổi kích thước
  function resize() {
    const w = container.clientWidth || 800;
    const h = container.clientHeight || 540;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }

  // ResizeObserver tự động bắt thay đổi kích thước container
  let ro = null;
  if (typeof window !== 'undefined' && window.ResizeObserver) {
    ro = new ResizeObserver(() => resize());
    ro.observe(container);
  }

  // 13. Phương thức giải phóng bộ nhớ
  function dispose() {
    disposed = true;
    cancelAnimationFrame(animId);
    if (ro) ro.disconnect();

    canvas.removeEventListener('pointerdown', onPointerDown);
    canvas.removeEventListener('pointermove', onPointerMove);
    canvas.removeEventListener('pointerup', onPointerUp);
    canvas.removeEventListener('pointercancel', onPointerUp);
    canvas.removeEventListener('wheel', onWheel);
    canvas.removeEventListener('touchstart', onTouchStart);
    canvas.removeEventListener('touchmove', onTouchMove);
    canvas.removeEventListener('touchend', onTouchEnd);

    if (hud && hud.parentElement) hud.parentElement.removeChild(hud);
    if (canvas && canvas.parentElement) canvas.parentElement.removeChild(canvas);

    // Giải phóng tài nguyên Three.js
    renderer.dispose();
    if (bgTex) bgTex.dispose();
    if (bgMat) bgMat.dispose();
    gridTexture.dispose();
    hazardTexture.dispose();
    checkeredTexture.dispose();

    Object.values(materials).forEach(m => {
      if (m && m.dispose) m.dispose();
    });
  }

  return {
    render,
    resize,
    dispose,
    setMounted,
    get carSource() { return carSource; }
  };
}

const CodeLabView3D = {
  create: createView3D
};

if (typeof window !== 'undefined') {
  window.CodeLabView3D = CodeLabView3D;
}

export { CodeLabView3D };
export default CodeLabView3D;
