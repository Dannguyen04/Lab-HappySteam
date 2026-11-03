// Phòng lập trình – Xe 3D dựng từ mô hình kit thật (Alpha 330, bài "Robot thám hiểm sao Hỏa" lớp 3 bài 10).
// Đọc content/lop3/bai10/build.json + các lưới trong content/kits/alpha330/meshes, đổi về hệ tọa độ của sim:
//   đơn vị cm, gốc = tâm trục hai bánh dưới mặt sân, đầu xe theo +X, bánh trái z < 0, bánh phải z > 0, Y hướng lên.
// API: loadKitCar(THREE) -> Promise<{ group, wheelL, wheelR, sonar, sonarFront, materials }> (dựng nhóm mới mỗi lần gọi;
// dữ liệu tải/giải nén chỉ làm một lần). Lỗi tải -> promise bị từ chối để nơi gọi giữ xe hộp.

const CAR_LESSON = 'content/lop3/bai10';
const WHEEL_NAMES = new Set(['BP-8841', 'BP-8850']); // vành + lốp
const SONAR_NAME = 'BE-6313'; // cảm biến siêu âm
const CM = 100; // dữ liệu mô hình tính bằng mét

let dataPromise = null;

function b64bytes(s) {
  const b = atob(s), a = new Uint8Array(b.length);
  for (let i = 0; i < b.length; i++) a[i] = b.charCodeAt(i);
  return a;
}

async function gunzip(s) {
  const stream = new Blob([b64bytes(s)]).stream().pipeThrough(new DecompressionStream('gzip'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

// Giống unpackMesh của assembly-viewer: vị trí Uint16 lượng tử hóa, pháp tuyến Int8, chỉ số -> mảng 6 số/đỉnh (pos, normal) không chỉ số
function unpackMesh(bytes, m) {
  const v = m.v, a4 = x => (x + 3) & ~3;
  const buf = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
  const pos = new Uint16Array(buf, 0, v * 3), nor = new Int8Array(buf, v * 6, v * 3);
  let off = a4(v * 9);
  if (m.texture >= 0) off += v * 8;
  off = a4(off);
  const idx = v > 65535 ? new Uint32Array(buf, off, m.count) : new Uint16Array(buf, off, m.count);
  const s = [0, 1, 2].map(i => (m.hi[i] - m.lo[i]) / 65535);
  const out = new Float32Array(m.count * 6);
  for (let i = 0; i < m.count; i++) {
    const j = idx[i], o = i * 6;
    for (let k = 0; k < 3; k++) {
      out[o + k] = m.lo[k] + pos[j * 3 + k] * s[k];
      out[o + 3 + k] = nor[j * 3 + k] / 127;
    }
  }
  return out;
}

async function getJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Không tải được ' + url + ' (' + res.status + ')');
  return res.json();
}

function loadData() {
  if (!dataPromise) {
    dataPromise = (async () => {
      if (typeof DecompressionStream === 'undefined') throw new Error('Trình duyệt không giải nén được mô hình.');
      const build = await getJSON(CAR_LESSON + '/build.json');
      const meshes = await Promise.all(build.meshes.map(async ref => {
        const m = await getJSON(ref);
        if (!m.z) throw new Error('Lưới không đúng định dạng: ' + ref);
        return { color: m.color, arr: unpackMesh(await gunzip(m.z), m) };
      }));
      return { build, meshes };
    })();
    dataPromise.catch(() => { dataPromise = null; }); // cho phép thử lại ở lần tạo view sau
  }
  return dataPromise;
}

// Điểm raw (mô hình) -> hệ sim. Phép (xr,yr,zr) -> (-(zr-az), yr, -(xr-ax)) là phép lật (det = -1) nên phải đảo thứ tự đỉnh tam giác.
function toSim(xr, yr, zr, ax, az, out, o) {
  out[o] = -(zr - az) * CM;
  out[o + 1] = yr * CM;
  out[o + 2] = -(xr - ax) * CM;
}

async function loadKitCar(THREE) {
  const { build, meshes } = await loadData();

  // Tâm trục bánh: trung bình vị trí các thanh trục (BP-3992 lắp ở bước 4 nằm ngang giữa hai bánh) -> dùng chính 2 bánh
  const wheelInst = build.instances.filter(p => WHEEL_NAMES.has(p.name));
  if (!wheelInst.length) throw new Error('Mô hình không có bánh xe.');
  const ax = wheelInst.reduce((s, p) => s + p.pos[0], 0) / wheelInst.length;
  const az = wheelInst.reduce((s, p) => s + p.pos[2], 0) / wheelInst.length;

  const group = new THREE.Group();
  const materials = [];
  const matCache = new Map();
  function mat(i) {
    if (!matCache.has(i)) {
      const c = meshes[i].color;
      const m = new THREE.MeshStandardMaterial({
        color: new THREE.Color().setRGB(c[0], c[1], c[2], THREE.SRGBColorSpace),
        roughness: 0.55, metalness: 0.05, emissive: 0x000000
      });
      matCache.set(i, m);
      materials.push(m);
    }
    return matCache.get(i);
  }

  // Đỉnh của một (instance, lưới) trong hệ sim, đã đảo thứ tự tam giác
  function bake(p, meshIndex) {
    const src = meshes[meshIndex].arr, n = src.length / 6;
    const R = p.rotation, t = p.pos;
    const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3);
    const tmp = [0, 0, 0];
    for (let i = 0; i < n; i++) {
      const x = src[i * 6], y = src[i * 6 + 1], z = src[i * 6 + 2];
      toSim(R[0] * x + R[3] * y + R[6] * z + t[0], R[1] * x + R[4] * y + R[7] * z + t[1], R[2] * x + R[5] * y + R[8] * z + t[2], ax, az, pos, i * 3);
      const nx = src[i * 6 + 3], ny = src[i * 6 + 4], nz = src[i * 6 + 5];
      const rx = R[0] * nx + R[3] * ny + R[6] * nz, ry = R[1] * nx + R[4] * ny + R[7] * nz, rz = R[2] * nx + R[5] * ny + R[8] * nz;
      nor[i * 3] = -rz; nor[i * 3 + 1] = ry; nor[i * 3 + 2] = -rx;
    }
    for (let i = 0; i + 2 < n; i += 3) { // đảo đỉnh 1 và 2 của mỗi tam giác
      for (let k = 0; k < 3; k++) {
        tmp[k] = pos[(i + 1) * 3 + k]; pos[(i + 1) * 3 + k] = pos[(i + 2) * 3 + k]; pos[(i + 2) * 3 + k] = tmp[k];
        tmp[k] = nor[(i + 1) * 3 + k]; nor[(i + 1) * 3 + k] = nor[(i + 2) * 3 + k]; nor[(i + 2) * 3 + k] = tmp[k];
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
    return g;
  }

  const wheelL = new THREE.Group(), wheelR = new THREE.Group(), sonar = new THREE.Group();
  const wheelSides = []; // { group, geoms } – cần tâm hình học để đặt tâm quay
  const bodyBox = new THREE.Box3();
  const sonarBox = new THREE.Box3();

  for (const p of build.instances) {
    const isWheel = WHEEL_NAMES.has(p.name), isSonar = p.name === SONAR_NAME;
    for (const mi of p.meshes) {
      const geom = bake(p, mi);
      const mesh = new THREE.Mesh(geom, mat(mi));
      mesh.castShadow = true; mesh.receiveShadow = true;
      geom.computeBoundingBox();
      if (isWheel) {
        const side = geom.boundingBox.getCenter(new THREE.Vector3()).z < 0 ? wheelL : wheelR;
        wheelSides.push({ side, mesh });
      } else if (isSonar) {
        sonar.add(mesh); sonarBox.union(geom.boundingBox);
      } else {
        group.add(mesh); bodyBox.union(geom.boundingBox);
      }
    }
  }

  // Tâm quay của mỗi bánh = tâm hộp bao của các lưới bánh bên đó (trục quay là Z)
  for (const w of [wheelL, wheelR]) {
    const box = new THREE.Box3();
    for (const s of wheelSides) if (s.side === w) box.union(s.mesh.geometry.boundingBox);
    const c = box.getCenter(new THREE.Vector3());
    w.position.copy(c);
    for (const s of wheelSides) if (s.side === w) { s.mesh.geometry.translate(-c.x, -c.y, -c.z); w.add(s.mesh); }
    group.add(w);
  }
  group.add(sonar);

  const sb = sonarBox;
  return {
    group, wheelL, wheelR, sonar, materials,
    bodyBox: bodyBox.union(sb),
    // mặt trước cảm biến siêu âm (nơi phát tia)
    sonarFront: { x: sb.max.x, y: (sb.min.y + sb.max.y) / 2 },
    wheelRadius: (() => { const b = new THREE.Box3().setFromObject(wheelL); return (b.max.y - b.min.y) / 2; })()
  };
}

export { loadKitCar };
export default loadKitCar;
