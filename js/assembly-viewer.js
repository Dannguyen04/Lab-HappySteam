// 3D Assembly WebGL Viewer
const DATA = window.LESSON_3D_DATA;
const $ = id => document.getElementById(id);
const canvas = document.getElementById('view');
const gl = canvas ? canvas.getContext('webgl', { antialias: true, alpha: true, preserveDrawingBuffer: true }) : null;
(async () => {
  try {
    if (!gl)
      throw Error('Không khởi tạo được WebGL. Hãy mở file bằng Chrome hoặc Edge và bật tăng tốc đồ họa.');
    // aOff = (vị trí, linh kiện mới 0/1). uMark: 0 không đánh dấu, 1 tô cam linh kiện mới, 2 làm nhạt phần đã lắp
    // (tô vàng nhạt như sách hướng dẫn ZMROBO, linh kiện mới giữ màu thật)
    const VS = `precision highp float;attribute vec3 aPos;attribute vec3 aNormal;attribute vec2 aUV;attribute vec3 aR0;attribute vec3 aR1;attribute vec3 aR2;attribute vec4 aOff;uniform mat3 uView;uniform vec3 uCenter;uniform vec2 uScale;uniform vec2 uPan;uniform float uDepth;varying vec3 vNormal;varying vec2 vUV;varying float vDepth;varying float vHi;void main(){mat3 m=mat3(aR0,aR1,aR2);vec3 p=m*aPos+aOff.xyz-uCenter;vec3 n=m*aNormal;vHi=aOff.w;p.x=-p.x;n.x=-n.x;p=uView*p;n=uView*n;vDepth=p.z;gl_Position=vec4(p.xy*uScale+uPan,-p.z/uDepth,1.0);vNormal=n;vUV=aUV;}`;
    const FS = `precision highp float;varying vec3 vNormal;varying vec2 vUV;uniform vec3 uColor;uniform sampler2D uTex;uniform bool uTextured;uniform bool uWire;uniform float uCut;uniform float uMark;varying float vDepth;varying float vHi;void main(){if(vDepth>uCut)discard;if(uWire){gl_FragColor=vec4(.13,.22,.27,1.0);return;}vec3 n=normalize(vNormal);if(!gl_FrontFacing)n=-n;vec3 base=pow(uColor,vec3(2.2));if(uTextured)base*=pow(texture2D(uTex,vUV).rgb,vec3(2.2));if(uMark>1.5&&vHi<.5)base=mix(base,vec3(1.0,1.0,.3),.84);float key=max(0.0,dot(n,normalize(vec3(-.4,.75,1.0))));float fill=max(0.0,dot(n,normalize(vec3(.8,.3,-.2))));float spec=pow(max(0.0,dot(n,normalize(vec3(-.2,.5,1.5)))),48.0)*.12;vec3 c=base*(.56+.37*key+.17*fill)+vec3(spec);if(uMark>.5&&uMark<1.5)c=mix(c,vec3(.98,.52,.08),vHi*.62);gl_FragColor=vec4(pow(max(c,vec3(0.0)),vec3(1.0/2.2)),1.0);}`;
    // Viền nét kiểu sách hướng dẫn: mỗi cạnh là một dải rộng cố định theo điểm ảnh. Cạnh gấp (hai mặt lệch nhiều) và
    // cạnh biên luôn vẽ; cạnh giữa hai mặt gần phẳng (mặt cong) chỉ vẽ khi nằm trên đường bao, tức hai mặt kề nhau
    // một mặt quay về phía người xem, một mặt quay đi (aN1, aN2 khác 0). aA.w: đầu 0/1 của cạnh, aB.w: phía −1/+1
    const LVS = `precision highp float;attribute vec4 aA;attribute vec4 aB;attribute vec3 aN1;attribute vec3 aN2;attribute vec3 aR0;attribute vec3 aR1;attribute vec3 aR2;attribute vec4 aOff;uniform mat3 uView;uniform vec3 uCenter;uniform vec2 uScale;uniform vec2 uPan;uniform float uDepth;uniform vec2 uVP;uniform float uLW;uniform float uMark;uniform float uDark;varying float vDepth;varying float vSoft;vec4 proj(vec3 q,mat3 m){vec3 p=m*q+aOff.xyz-uCenter;p.x=-p.x;p=uView*p;return vec4(p.xy*uScale+uPan,-p.z/uDepth,p.z);}float facing(vec3 n,mat3 m){n=m*n;n.x=-n.x;return (uView*n).z;}void main(){mat3 m=mat3(aR0,aR1,aR2);if(dot(aN1,aN1)>0.0&&facing(aN1,m)*facing(aN2,m)>0.0){gl_Position=vec4(2.0,2.0,2.0,1.0);vDepth=0.0;vSoft=0.0;return;}vec4 a=proj(aA.xyz,m),b=proj(aB.xyz,m);vec2 d=(b.xy-a.xy)*uVP;float len=length(d);vec2 dir=len>1e-6?d/len:vec2(1.0,0.0);vec4 e=aA.w<.5?a:b;vec2 off=(vec2(-dir.y,dir.x)*aB.w+dir*(aA.w*2.0-1.0))*uLW;gl_Position=vec4(e.xy+off/uVP,e.z,1.0);vDepth=e.w;float hi=aOff.w;vSoft=uDark*((uMark<.5||(uMark>1.5&&hi>.5)||(uMark>.5&&uMark<1.5&&hi<.5))?1.0:0.0);}`;
    const LFS = `precision highp float;uniform float uCut;varying float vDepth;varying float vSoft;void main(){if(vDepth>uCut)discard;gl_FragColor=vec4(mix(vec3(.1,.12,.14),vec3(.55,.58,.6),vSoft),1.0);}`;
    function shader(t, s) {
      const x = gl.createShader(t);
      gl.shaderSource(x, s);
      gl.compileShader(x);
      if (!gl.getShaderParameter(x, gl.COMPILE_STATUS)) throw Error(gl.getShaderInfoLog(x));
      return x;
    }
    // Vị trí thuộc tính cố định, chung cho hai chương trình: 0–3 theo đỉnh, 4–7 theo linh kiện (instance).
    // aPos ở vị trí 0: WebGL chậm hoặc lỗi trên một số máy nếu thuộc tính 0 không phải mảng đang bật
    function link(vs, fs, attribs) {
      const p = gl.createProgram();
      gl.attachShader(p, shader(gl.VERTEX_SHADER, vs));
      gl.attachShader(p, shader(gl.FRAGMENT_SHADER, fs));
      for (const [i, n] of attribs.entries()) if (n) gl.bindAttribLocation(p, i, n);
      gl.linkProgram(p);
      if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw Error(gl.getProgramInfoLog(p));
      return p;
    }
    const PER_PART = ['aR0', 'aR1', 'aR2', 'aOff'];
    const program = link(VS, FS, ['aPos', 'aNormal', 'aUV', null, ...PER_PART]),
      lineProgram = link(LVS, LFS, ['aA', 'aB', 'aN1', 'aN2', ...PER_PART]);
    gl.useProgram(program);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.polygonOffset(1, 1);
    gl.clearColor(0, 0, 0, 0);
    const uniforms = (p, names) => Object.fromEntries(names.map(n => [n, gl.getUniformLocation(p, 'u' + n)]));
    const CAMERA = ['View', 'Center', 'Scale', 'Pan', 'Depth', 'Cut', 'Mark'];
    const U = uniforms(program, [...CAMERA, 'Color', 'Tex', 'Textured', 'Wire']),
      LU = uniforms(lineProgram, [...CAMERA, 'VP', 'LW', 'Dark']);
    const A = { Pos: 0, Normal: 1, UV: 2 };
    for (const i of [0, 1, 2]) gl.enableVertexAttribArray(i);
    gl.uniform1i(U.Tex, 0);
    // Vẽ instancing (ANGLE_instanced_arrays, có trên hầu hết máy): mỗi lưới một lệnh vẽ cho mọi linh kiện dùng nó.
    // Máy không có: đặt thuộc tính instance thành hằng số và vẽ từng linh kiện như trước.
    const INST = [4, 5, 6, 7],
      inst = gl.getExtension('ANGLE_instanced_arrays'),
      instBuffer = gl.createBuffer();
    // Một linh kiện: có instancing thì dùng bộ đệm 1 instance (thuộc tính hằng rất chậm trên ANGLE/SwiftShader),
    // không thì thuộc tính hằng. Trả về số instance để truyền cho drawMesh
    function setInstance(R, pos, hi) {
      if (inst) {
        useInstances(new Float32Array([...R, ...pos, hi]));
        return 1;
      }
      for (const a of INST) gl.disableVertexAttribArray(a);
      gl.vertexAttrib3f(INST[0], R[0], R[1], R[2]);
      gl.vertexAttrib3f(INST[1], R[3], R[4], R[5]);
      gl.vertexAttrib3f(INST[2], R[6], R[7], R[8]);
      gl.vertexAttrib4f(INST[3], pos[0], pos[1], pos[2], hi);
      return 0;
    }
    // 13 số mỗi instance: ma trận quay (9), vị trí (3), linh kiện mới (1)
    function useInstances(data) {
      gl.bindBuffer(gl.ARRAY_BUFFER, instBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW);
      [0, 12, 24, 36].forEach((off, i) => {
        gl.enableVertexAttribArray(INST[i]);
        gl.vertexAttribPointer(INST[i], i === 3 ? 4 : 3, gl.FLOAT, false, 52, off);
        inst.vertexAttribDivisorANGLE(INST[i], 1);
      });
    }
    function endInstances() {
      if (!inst) return;
      for (const a of INST) {
        inst.vertexAttribDivisorANGLE(a, 0);
        gl.disableVertexAttribArray(a);
      }
    }
    function bytes(s) {
      const b = atob(s),
        a = new Uint8Array(b.length);
      for (let i = 0; i < b.length; i++) a[i] = b.charCodeAt(i);
      return a;
    }
    const unpackMesh = function unpackMesh(bytes, m) {
    const v = m.v,
      a4 = x => (x + 3) & ~3,
      buf = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
    const pos = new Uint16Array(buf, 0, v * 3),
      nor = new Int8Array(buf, v * 6, v * 3);
    let off = a4(v * 9);
    let uv = null;
    if (m.texture >= 0) {
      uv = new Float32Array(buf, off, v * 2);
      off += v * 8;
    }
    off = a4(off);
    const idx = v > 65535 ? new Uint32Array(buf, off, m.count) : new Uint16Array(buf, off, m.count);
    const s = [0, 1, 2].map(i => (m.hi[i] - m.lo[i]) / 65535),
      out = new Float32Array(m.count * 8);
    for (let i = 0; i < m.count; i++) {
      const j = idx[i],
        o = i * 8;
      for (let k = 0; k < 3; k++) {
        out[o + k] = m.lo[k] + pos[j * 3 + k] * s[k];
        out[o + 3 + k] = nor[j * 3 + k] / 127;
      }
      if (uv) {
        out[o + 6] = uv[j * 2];
        out[o + 7] = uv[j * 2 + 1];
      }
    }
    return out;
  };
    async function gunzip(s) {
      if (!window.DecompressionStream)
        throw Error('Trình duyệt quá cũ, không giải nén được dữ liệu. Hãy mở bằng Chrome hoặc Edge bản mới.');
      return new Uint8Array(
        await new Response(
          new Blob([bytes(s)]).stream().pipeThrough(new DecompressionStream('gzip'))
        ).arrayBuffer()
      );
    }
    const meshes = await Promise.all(
      DATA.meshes.map(async m => {
        const a = m.z ? unpackMesh(await gunzip(m.z), m) : new Float32Array(bytes(m.data).buffer),
          buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, a, gl.STATIC_DRAW);
        return { ...m, buffer, a };
      })
    );
    const textures = await Promise.all(
      DATA.textures.map(
        t =>
          new Promise((resolve, reject) => {
            const im = new Image();
            im.onload = () => {
              const tex = gl.createTexture();
              gl.bindTexture(gl.TEXTURE_2D, tex);
              gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
              gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, im);
              const pot = x => (x & (x - 1)) === 0;
              if (pot(im.width) && pot(im.height)) {
                gl.generateMipmap(gl.TEXTURE_2D);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
                const ext =
                  gl.getExtension('EXT_texture_filter_anisotropic') ||
                  gl.getExtension('WEBKIT_EXT_texture_filter_anisotropic');
                if (ext)
                  gl.texParameterf(
                    gl.TEXTURE_2D,
                    ext.TEXTURE_MAX_ANISOTROPY_EXT,
                    Math.min(8, gl.getParameter(ext.MAX_TEXTURE_MAX_ANISOTROPY_EXT))
                  );
              } else {
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
              }
              gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
              resolve(tex);
            };
            im.onerror = () => reject(Error('Không đọc được texture ' + t.name));
            im.src = t.url;
          })
      )
    );
    const identity = [1, 0, 0, 0, 1, 0, 0, 0, 1];
    let step = DATA.steps,
      yaw = -0.7,
      pitch = 0.48,
      zoom = 1,
      pan = [0, 0],
      autoSpin = false,
      timer = null,
      highlight = true,
      markStyle = 'fade',
      outline = true,
      onlyNew = false,
      edges = false,
      quality = 2,
      follow = false,
      capturing = false,
      previewing = false,
      active = [],
      center = [0, 0, 0],
      radius = 0.1,
      draws = 0;
    // Tiến độ của học sinh trên máy này (localStorage, theo tên dự án + số bước + số linh kiện):
    // bước đang làm, các bước đã xong, linh kiện đã lấy ở từng bước
    const PROGRESS_KEY = 'rbb.progress:' + DATA.source + ':' + DATA.steps + ':' + DATA.instances.length;
    let progress = { step: 0, done: [], got: {} };
    try {
      progress = Object.assign(progress, JSON.parse(localStorage.getItem(PROGRESS_KEY) || '{}'));
    } catch (e) {}
    function saveProgress() {
      try {
        localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
      } catch (e) {}
    }
    // Kiểu hiển thị chọn lần trước (chung mọi dự án trên máy này): cách đánh dấu linh kiện mới, viền nét, ô linh kiện
    const STYLE_KEY = 'rbb.style';
    let pliOpen = true,
      markPref = 'fade'; // lựa chọn trong ô "Đánh dấu linh kiện mới" (nút mắt chỉ đổi tạm, không lưu)
    try {
      const s = JSON.parse(localStorage.getItem(STYLE_KEY) || '{}');
      if (['fade', 'orange', 'none'].includes(s.mark)) markPref = s.mark;
      if (markPref !== 'none') markStyle = markPref;
      highlight = markPref !== 'none';
      if (typeof s.outline === 'boolean') outline = s.outline;
      if (typeof s.pli === 'boolean') pliOpen = s.pli;
    } catch (e) {}
    function saveStyle() {
      try {
        localStorage.setItem(STYLE_KEY, JSON.stringify({ mark: markPref, outline, pli: pliOpen }));
      } catch (e) {}
    }
    // Mở thẳng một bước: ...html#buoc=5 (thêm &gan để nhìn gần bước đó). Không có địa chỉ bước: mở tiếp bước lần trước
    let resumed = false;
    try {
      const h = new URLSearchParams(location.hash.slice(1)),
        s = Math.floor(+h.get('buoc'));
      if (s >= 1 && s <= DATA.steps) step = s;
      else if (progress.step >= 1 && progress.step <= DATA.steps && progress.step !== step) {
        step = progress.step;
        resumed = true;
      }
      if (h.has('gan')) follow = true;
    } catch (e) {}
    const L = Object.assign({ types: {}, colors: {}, names: {}, defaults: {} }, DATA.labels);
    function label(p) {
      if (p.missing) return 'Khối thay thế (chưa có hình gốc)';
      if (L.names[p.name]) return L.names[p.name];
      const t = L.types[p.name] || p.name,
        c = p.colorCode ? L.colors[p.colorCode] : L.defaults[p.name];
      return c ? t + ' · ' + c : t;
    }
    function mul(R, p) {
      return [
        R[0] * p[0] + R[3] * p[1] + R[6] * p[2],
        R[1] * p[0] + R[4] * p[1] + R[7] * p[2],
        R[2] * p[0] + R[5] * p[1] + R[8] * p[2]
      ];
    }
    // Cụm con: DATA.stepInfo[s-1] = {scope, group, sub, subCount, joins}. Trong bước của một cụm chỉ hiện linh kiện
    // thuộc cụm đó (groupPath bắt đầu bằng scope); bước ghép cụm coi cả cụm vừa ghép là "mới".
    const INFO = DATA.stepInfo || null;
    const infoOf = s => (INFO ? INFO[s - 1] : { scope: 'Main', group: '', sub: 0, subCount: 0, joins: [] });
    const inScope = (p, scope) =>
      scope === 'Main' || p.groupPath === scope || String(p.groupPath).startsWith(scope + '/');
    const joinedAt = (p, s) => !!(p.joins && p.joins.includes(s));
    const isNew = (p, s) => p.step === s || joinedAt(p, s);
    // Cụm con trực tiếp của scope chứa linh kiện p, ví dụ scope 'Main', groupPath 'Main/3/5' → 'Main/3'
    const childScope = (p, scope) =>
      String(p.groupPath)
        .split('/')
        .slice(0, scope.split('/').length + 1)
        .join('/');
    function box(set) {
      let lo = [Infinity, Infinity, Infinity],
        hi = [-Infinity, -Infinity, -Infinity];
      for (const p of set)
        for (const id of p.meshes) {
          const m = meshes[id];
          for (let mask = 0; mask < 8; mask++) {
            const v = mul(
              p.rotation,
              m.lo.map((x, i) => (mask & (1 << i) ? m.hi[i] : x))
            );
            for (let k = 0; k < 3; k++) {
              v[k] += p.pos[k];
              lo[k] = Math.min(lo[k], v[k]);
              hi[k] = Math.max(hi[k], v[k]);
            }
          }
        }
      return {
        center: lo.map((x, i) => (x + hi[i]) / 2),
        radius: Math.max(0.025, Math.hypot(...hi.map((x, i) => x - lo[i])) / 2)
      };
    }
    // Xưởng sáng tạo (js/creative-lab.js): mô hình hoàn chỉnh + linh kiện học sinh gắn thêm (p.extra)
    let creative = null; // { extras: [...], until }
    function bound() {
      if (creative) {
        active = DATA.instances.concat(creative.extras);
        ({ center, radius } = box(active));
        explodeCenter = center;
        return;
      }
      const scope = infoOf(step).scope;
      active = DATA.instances.filter(
        p =>
          inScope(p, scope) &&
          (onlyNew ? isNew(p, step) : p.step <= step) &&
          !(quizPending() && p.step === step)
      );
      if (!active.length) {
        center = [0, 0, 0];
        radius = 0.05;
        return;
      }
      let set = active.filter(p => !p.stray);
      if (follow) {
        const cur = active.filter(p => isNew(p, step)),
          near = cur.filter(p => !p.stray);
        if (cur.length) set = near.length ? near : cur;
      }
      if (!set.length) set = active;
      ({ center, radius } = box(set));
      if (follow) radius = Math.max(0.04, radius * 1.6);
      explodeCenter = box(active.filter(p => !p.stray).length ? active.filter(p => !p.stray) : active).center;
    }
    const centerOf = p => p.c || (p.c = box([p]).center);
    // Hoạt ảnh lắp (theo RBB Studio): linh kiện mới rơi thẳng từ trên xuống vào vị trí, lần lượt từng chiếc;
    // cả cụm vừa ghép rơi vào như một khối. Chỉ minh họa – hướng đưa linh kiện thật xem trong sách hướng dẫn.
    const ANIM_MS = 700,
      STAGGER = 110;
    let animate = !matchMedia('(prefers-reduced-motion: reduce)').matches,
      anim = null; // {step, start}
    const moveCache = new Map();
    function moves(s) {
      if (moveCache.has(s)) return moveCache.get(s);
      const scope = infoOf(s).scope,
        shown = DATA.instances.filter(p => inScope(p, scope) && p.step <= s && !p.stray),
        units = new Map();
      for (const p of shown) {
        if (!isNew(p, s)) continue;
        const key = p.step === s ? p : childScope(p, scope);
        if (!units.has(key)) units.set(key, []);
        units.get(key).push(p);
      }
      const { radius: r } = box(shown.length ? shown : DATA.instances),
        out = new Map();
      let i = 0;
      for (const list of units.values()) {
        const dist = r * (list.length > 1 && list[0].step !== s ? 0.8 : 0.55),
          delay = Math.min(i++, 6) * STAGGER;
        for (const p of list) out.set(p, { d: [0, dist, 0], delay });
      }
      moveCache.set(s, out);
      return out;
    }
    function offsetOf(p) {
      if (p.addedAt) {
        // Linh kiện vừa gắn trong xưởng sáng tạo rơi từ trên xuống
        const t = Math.min(1, Math.max(0, (performance.now() - p.addedAt) / ANIM_MS)),
          e = 1 - Math.pow(1 - t, 3);
        return t >= 1 ? null : p.pos.map((x, k) => (k === 1 ? x + radius * 0.6 * (1 - e) : x));
      }
      if (!anim || anim.step !== step) return null;
      const m = moves(step).get(p);
      if (!m) return null;
      const t = Math.min(1, Math.max(0, (performance.now() - anim.start - m.delay) / ANIM_MS)),
        e = 1 - Math.pow(1 - t, 3);
      return t >= 1 ? null : m.d.map((x, k) => p.pos[k] + x * (1 - e));
    }
    // Sa bàn (Tab 2): quay bộ truyền theo chương trình. spin = { output: góc (rad) cột anten, motor: góc bánh răng 8 }
    let spin = null;
    const driveOf = new Map();
    if (DATA.drive)
      for (const key of ['output', 'motor']) for (const i of DATA.drive[key].parts) driveOf.set(DATA.instances[i], key);
    function poseOf(p) {
      const at = placeOf(p),
        key = spin && (p.drive || driveOf.get(p));
      if (!key) return { R: p.rotation, pos: at };
      const d = DATA.drive[key],
        a = spin[key] || 0,
        c = Math.cos(a),
        sn = Math.sin(a);
      // Quay quanh trục đứng (Y) qua tâm bánh răng: ma trận cột Ry
      const Ry = [c, 0, -sn, 0, 1, 0, sn, 0, c];
      const R = [0, 1, 2].flatMap(col => mul(Ry, [p.rotation[col * 3], p.rotation[col * 3 + 1], p.rotation[col * 3 + 2]]));
      const rel = mul(Ry, [at[0] - d.point[0], at[1] - d.point[1], at[2] - d.point[2]]);
      return { R, pos: [rel[0] + d.point[0], rel[1] + d.point[1], rel[2] + d.point[2]] };
    }
    function startAnim() {
      anim = animate && !capturing && moves(step).size ? { step, start: performance.now() } : null;
    }
    // Tách rời: mỗi linh kiện lùi ra xa tâm phần đang hiện theo hệ số explode (0…1); cắt lát: bỏ phần nằm
    // trước một mặt phẳng vuông góc hướng nhìn, cut 0 (không cắt) … 0.95 (gần hết mô hình)
    const EXPLODE = 1.5;
    let explode = 0,
      cut = 0,
      explodeCenter = [0, 0, 0];
    function placeOf(p) {
      const at = offsetOf(p) || p.pos;
      if (!explode) return at;
      const c = centerOf(p);
      return at.map((x, k) => x + (c[k] - explodeCenter[k]) * explode * EXPLODE);
    }
    function drawMesh(m, count) {
      gl.bindBuffer(gl.ARRAY_BUFFER, m.buffer);
      gl.vertexAttribPointer(A.Pos, 3, gl.FLOAT, false, 32, 0);
      gl.vertexAttribPointer(A.Normal, 3, gl.FLOAT, false, 32, 12);
      gl.vertexAttribPointer(A.UV, 2, gl.FLOAT, false, 32, 24);
      gl.uniform3fv(U.Color, m.color);
      gl.uniform1i(U.Textured, m.texture >= 0);
      if (m.texture >= 0) gl.bindTexture(gl.TEXTURE_2D, textures[m.texture]);
      if (count) inst.drawArraysInstancedANGLE(gl.TRIANGLES, 0, m.count, count);
      else gl.drawArrays(gl.TRIANGLES, 0, m.count);
    }
    function drawEdges(m, count) {
      if (!m.lines) {
        const a = m.a,
          lines = new Float32Array(m.count * 2 * 8);
        let k = 0;
        for (let i = 0; i < m.count; i += 3)
          for (const [u, v] of [
            [0, 1],
            [1, 2],
            [2, 0]
          ])
            for (const q of [u, v]) {
              lines.set(a.subarray((i + q) * 8, (i + q + 1) * 8), k);
              k += 8;
            }
        m.lines = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, m.lines);
        gl.bufferData(gl.ARRAY_BUFFER, lines, gl.STATIC_DRAW);
      }
      gl.bindBuffer(gl.ARRAY_BUFFER, m.lines);
      gl.vertexAttribPointer(A.Pos, 3, gl.FLOAT, false, 32, 0);
      gl.vertexAttribPointer(A.Normal, 3, gl.FLOAT, false, 32, 12);
      gl.vertexAttribPointer(A.UV, 2, gl.FLOAT, false, 32, 24);
      gl.uniform1i(U.Wire, true);
      if (count) inst.drawArraysInstancedANGLE(gl.LINES, 0, m.count * 2, count);
      else gl.drawArrays(gl.LINES, 0, m.count * 2);
      gl.uniform1i(U.Wire, false);
    }
    // Cạnh cần vẽ viền của một lưới, tính một lần khi cần. Gộp đỉnh trùng vị trí (lưới lưu đỉnh rời từng tam giác),
    // gom pháp tuyến mặt theo cạnh; mặt trùng mặt phẳng (cùng hoặc ngược chiều, như mặt hai phía) tính là một.
    // Mỗi cạnh thành 6 đỉnh × 14 số: A (xyz, đầu), B (xyz, phía), N1, N2
    const CREASE = Math.cos((32 * Math.PI) / 180),
      FLAT = 0.99999;
    function outlineOf(m) {
      if (m.outline) return m.outline;
      const a = m.a,
        n = m.count,
        q = Math.max(...m.hi.map((x, i) => x - m.lo[i])) / 20000 || 1e-7,
        ids = new Map(),
        vid = new Int32Array(n),
        pts = [];
      for (let i = 0; i < n; i++) {
        const o = i * 8,
          key = Math.round(a[o] / q) + ',' + Math.round(a[o + 1] / q) + ',' + Math.round(a[o + 2] / q);
        let id = ids.get(key);
        if (id === undefined) {
          id = pts.length;
          ids.set(key, id);
          pts.push(o);
        }
        vid[i] = id;
      }
      const N = pts.length,
        faces = new Map();
      for (let t = 0; t + 2 < n; t += 3) {
        const v = [vid[t], vid[t + 1], vid[t + 2]];
        if (v[0] === v[1] || v[1] === v[2] || v[0] === v[2]) continue;
        const P = v.map(i => [a[pts[i]], a[pts[i] + 1], a[pts[i] + 2]]),
          e1 = P[1].map((x, k) => x - P[0][k]),
          e2 = P[2].map((x, k) => x - P[0][k]),
          c = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]],
          len = Math.hypot(...c);
        if (len < 1e-14) continue;
        const nf = c.map(x => x / len);
        for (const [u, w] of [
          [v[0], v[1]],
          [v[1], v[2]],
          [v[2], v[0]]
        ]) {
          const k = u < w ? u * N + w : w * N + u;
          // list: số mặt chung cạnh và các mặt phẳng khác nhau của chúng
          let e = faces.get(k);
          if (!e) faces.set(k, (e = { n: 0, planes: [] }));
          e.n++;
          if (!e.planes.some(f => Math.abs(f[0] * nf[0] + f[1] * nf[1] + f[2] * nf[2]) > FLAT))
            e.planes.push(nf);
        }
      }
      const out = [],
        zero = [0, 0, 0];
      for (const [k, { n: count, planes }] of faces) {
        // Cạnh nằm giữa một mặt phẳng (đường chéo chia tam giác) hoặc giữa hai lớp của mặt hai phía: bỏ
        if (count > 1 && planes.length === 1) continue;
        let n1 = zero,
          n2 = zero;
        if (planes.length === 2) {
          const d = planes[0][0] * planes[1][0] + planes[0][1] * planes[1][1] + planes[0][2] * planes[1][2];
          if (d > CREASE) [n1, n2] = planes; // mặt cong: chỉ vẽ ở đường bao
        }
        const i = Math.floor(k / N),
          j = k - i * N,
          A = [a[pts[i]], a[pts[i] + 1], a[pts[i] + 2]],
          B = [a[pts[j]], a[pts[j] + 1], a[pts[j] + 2]];
        for (const [t, s] of [
          [0, -1],
          [1, -1],
          [1, 1],
          [0, -1],
          [1, 1],
          [0, 1]
        ])
          out.push(...A, t, ...B, s, ...n1, ...n2);
      }
      const buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(out), gl.STATIC_DRAW);
      const [r, g, b] = m.color;
      m.outline = { buffer, n: out.length / 14, dark: 0.2126 * r + 0.7152 * g + 0.0722 * b < 0.3 ? 1 : 0 };
      return m.outline;
    }
    // Đặt góc nhìn cho một chương trình (chung cho lưới và viền)
    let cam = null;
    function setCamera(u) {
      gl.uniformMatrix3fv(u.View, false, cam.view);
      gl.uniform3fv(u.Center, cam.center);
      gl.uniform2fv(u.Scale, cam.scale);
      gl.uniform2fv(u.Pan, cam.pan);
      gl.uniform1f(u.Depth, cam.depth);
      gl.uniform1f(u.Cut, cam.cut);
      gl.uniform1f(u.Mark, cam.mark);
    }
    // Vẽ viền cho các lô [{id, data}] (data: 13 số mỗi linh kiện như useInstances) bằng chương trình viền,
    // độ rộng nét lw điểm ảnh của canvas. Xong thì trả lại chương trình lưới
    let lineDraws = 0;
    function drawOutlines(batches, w, h, lw) {
      gl.useProgram(lineProgram);
      setCamera(LU);
      gl.uniform2f(LU.VP, w, h);
      gl.uniform1f(LU.LW, lw);
      gl.enableVertexAttribArray(3);
      for (const { id, data } of batches) {
        const o = outlineOf(meshes[id]);
        if (!o.n) continue;
        gl.uniform1f(LU.Dark, o.dark);
        const k = data.length / 13;
        let count = 0;
        if (inst) {
          useInstances(data);
          count = k;
        }
        for (let i = 0; i < (inst ? 1 : k); i++) {
          if (!inst)
            setInstance(
              data.subarray(i * 13, i * 13 + 9),
              data.subarray(i * 13 + 9, i * 13 + 12),
              data[i * 13 + 12]
            );
          gl.bindBuffer(gl.ARRAY_BUFFER, o.buffer);
          gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 56, 0);
          gl.vertexAttribPointer(1, 4, gl.FLOAT, false, 56, 16);
          gl.vertexAttribPointer(2, 3, gl.FLOAT, false, 56, 32);
          gl.vertexAttribPointer(3, 3, gl.FLOAT, false, 56, 44);
          if (count) inst.drawArraysInstancedANGLE(gl.TRIANGLES, 0, o.n, count);
          else gl.drawArrays(gl.TRIANGLES, 0, o.n);
          lineDraws++;
        }
      }
      gl.disableVertexAttribArray(3);
      endInstances();
      gl.useProgram(program);
    }
    // Ảnh nhỏ từng loại linh kiện (theo mã + màu), chụp một lần lúc mở trang bằng chính WebGL của trang
    const thumbs = {},
      THUMB = 160;
    function makeThumbs() {
      const size = THUMB,
        groups = new Map();
      for (const p of DATA.instances) {
        const k = p.name + '|' + p.colorCode;
        if (!groups.has(k)) groups.set(k, p.meshes);
      }
      canvas.width = size;
      canvas.height = size;
      gl.viewport(0, 0, size, size);
      gl.uniform1i(U.Wire, false);
      const one = new Float32Array([...identity, 0, 0, 0, 1]);
      for (const [k, ids] of groups) {
        const lo = [Infinity, Infinity, Infinity],
          hi = [-Infinity, -Infinity, -Infinity];
        for (const id of ids)
          for (let i = 0; i < 3; i++) {
            lo[i] = Math.min(lo[i], meshes[id].lo[i]);
            hi[i] = Math.max(hi[i], meshes[id].hi[i]);
          }
        const r = Math.max(0.003, Math.hypot(...hi.map((x, i) => x - lo[i])) / 2);
        cam = {
          view: viewMatrix(-0.7, 0.5),
          center: lo.map((x, i) => (x + hi[i]) / 2),
          scale: [0.92 / r, 0.92 / r],
          pan: [0, 0],
          depth: Math.max(r * 10, 1),
          cut: 1e9,
          mark: 0
        };
        setCamera(U);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        if (outline) gl.enable(gl.POLYGON_OFFSET_FILL);
        const n = setInstance(identity, [0, 0, 0], 1);
        for (const id of ids) drawMesh(meshes[id], n);
        endInstances();
        gl.disable(gl.POLYGON_OFFSET_FILL);
        if (outline)
          drawOutlines(
            ids.map(id => ({ id, data: one })),
            size,
            size,
            1.4
          );
        try {
          thumbs[k] = canvas.toDataURL();
        } catch (e) {}
      }
      // Ảnh các cụm được ghép cũng vẽ luôn lúc này (cùng kích thước canvas), để khi chuyển bước không phải đổi
      // kích thước canvas lớn qua lại
      for (let s = 1; s <= DATA.steps; s++) for (const g of joinedGroups(s)) groupThumb(g);
    }
    function viewMatrix(yaw, pitch) {
      const cy = Math.cos(yaw),
        sy = Math.sin(yaw),
        ca = Math.cos(pitch),
        sa = Math.sin(pitch);
      return [cy, sy * sa, -sy * ca, 0, ca, sa, sy, -cy * sa, cy * ca];
    }
    function draw(fw, fh) {
      if ((capturing || previewing) && !fw) return;
      const r = canvas.getBoundingClientRect();
      const w = fw || Math.max(1, Math.round(r.width * quality)),
        h = fh || Math.max(1, Math.round(r.height * quality));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      gl.viewport(0, 0, w, h);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      // Trên màn hình: thu nhỏ một chút và đẩy mô hình lên để không bị nút chuyển bước ở đáy che
      const R = radius * (1 + explode * EXPLODE),
        scale = ((fw ? 0.85 : 0.78) / R) * zoom;
      cam = {
        view: viewMatrix(yaw, pitch),
        center,
        scale: [scale * Math.min(1, h / w), scale * Math.min(1, w / h)],
        pan: fw || creative ? pan : [pan[0], pan[1] + 0.07], // xưởng/sa bàn không có nút chuyển bước ở đáy
        depth: Math.max(R * 10, 1),
        cut: cut > 0 ? R * (1 - 2 * cut) : 1e9,
        mark: highlight && !(creative && creative.plain) ? (markStyle === 'fade' ? 2 : 1) : 0
      };
      setCamera(U);
      gl.uniform1i(U.Wire, false);
      // Viền: đẩy mặt lưới lùi một chút theo độ sâu để nét nằm trên mặt không bị lấp
      if (outline) gl.enable(gl.POLYGON_OFFSET_FILL);
      draws = lineDraws = 0;
      // Gom linh kiện đang hiện theo lưới: mỗi lưới một lô (instancing: một lệnh vẽ mỗi lô)
      const byMesh = new Map();
      for (const p of active)
        for (const id of p.meshes) {
          if (!byMesh.has(id)) byMesh.set(id, []);
          byMesh.get(id).push(p);
        }
      const batches = [];
      for (const [id, list] of byMesh) {
        const data = new Float32Array(list.length * 13);
        list.forEach((p, i) => {
          const q = poseOf(p);
          data.set(q.R, i * 13);
          data.set(q.pos, i * 13 + 9);
          data[i * 13 + 12] = creative ? (creative.plain ? 0 : p.extra ? 1 : 0) : isNew(p, step) ? 1 : 0;
        });
        batches.push({ id, data });
      }
      if (inst) {
        for (const { id, data } of batches) {
          useInstances(data);
          drawMesh(meshes[id], data.length / 13);
          if (edges) drawEdges(meshes[id], data.length / 13);
          draws++;
        }
        endInstances();
      } else
        for (const p of active) {
          const q = poseOf(p);
          setInstance(q.R, q.pos, creative ? (creative.plain ? 0 : p.extra ? 1 : 0) : isNew(p, step) ? 1 : 0);
          for (const id of p.meshes) {
            drawMesh(meshes[id]);
            if (edges) drawEdges(meshes[id]);
            draws++;
          }
        }
      gl.disable(gl.POLYGON_OFFSET_FILL);
      if (outline) drawOutlines(batches, w, h, fw ? Math.max(1.5, Math.min(w, h) / 600) : 1.35 * quality);
    }
    function el(tag, cls, text) {
      const e = document.createElement(tag);
      if (cls) e.className = cls;
      if (text != null) e.textContent = text;
      return e;
    }
    const groupName = g => (/^group\s*\d*$/i.test(g) ? 'cụm con' : 'cụm ' + g);
    const listNames = a => (a.length > 1 ? a.slice(0, -1).join(', ') + ' và ' + a[a.length - 1] : a[0] || '');
    function stepText(s) {
      const desc = (DATA.stepDescriptions?.[s - 1] || '').replace(/^\s*Bước\s*\d+\s*[:.\-–—]\s*/i, '').trim(),
        n = DATA.instances.filter(p => p.step === s).length,
        joins = infoOf(s).joins.map(groupName);
      if (desc) return desc;
      if (joins.length && INFO) return `Quan sát vị trí ghép ${listNames(joins)}` + (n ? ` và ${n} vị trí linh kiện` : '');
      return n ? `Lắp ${n} linh kiện` : 'Quan sát mô hình';
    }
    // Dòng nhỏ phía trên tiêu đề bước, ví dụ "BƯỚC 4 / 20 · CỤM TAY TRÁI 2/5"
    function stepTag(s) {
      const i = infoOf(s);
      return (
        `BƯỚC ${s} / ${DATA.steps}` +
        (i.subCount ? ` · ${groupName(i.group).toUpperCase()} ${i.sub}/${i.subCount}` : '')
      );
    }
    // Cụm được ghép ở bước s (trong scope của bước đó): [{scope, name, parts}]
    function joinedGroups(s) {
      if (!INFO) return [];
      const scope = infoOf(s).scope,
        out = new Map();
      for (const p of DATA.instances)
        if (joinedAt(p, s) && inScope(p, scope)) {
          const k = childScope(p, scope);
          if (!out.has(k)) out.set(k, { scope: k, parts: [] });
          out.get(k).parts.push(p);
        }
      for (const g of out.values()) {
        const first = INFO.findIndex(i => i.scope === g.scope);
        g.name = groupName(first >= 0 ? INFO[first].group : '');
      }
      return [...out.values()];
    }
    // Ảnh nhỏ của cả cụm (góc nhìn cố định), vẽ khi cần rồi giữ lại
    const groupThumbs = {};
    // Vẽ riêng một nhóm linh kiện (màu thật, khung vừa nhóm) lên canvas ở kích thước w×h với góc nhìn cho trước;
    // trạng thái xem chính được trả lại sau đó (lần vẽ chính kế tiếp đặt lại kích thước canvas)
    function renderSet(parts, w, h, ry = -0.7, rp = 0.48) {
      const keep = { active, center, radius, yaw, pitch, zoom, pan, highlight, explode, cut };
      active = parts;
      ({ center, radius } = box(parts));
      yaw = ry;
      pitch = rp;
      zoom = 1;
      pan = [0, 0];
      highlight = false;
      explode = cut = 0;
      draw(w, h);
      ({ active, center, radius, yaw, pitch, zoom, pan, highlight, explode, cut } = keep);
    }
    function groupThumb(g) {
      if (groupThumbs[g.scope]) return groupThumbs[g.scope];
      renderSet(g.parts, THUMB, THUMB);
      try {
        groupThumbs[g.scope] = canvas.toDataURL();
      } catch (e) {}
      return groupThumbs[g.scope] || '';
    }
    function groupItem(g, cls) {
      const d = el('div', cls + ' group'),
        img = el('img'),
        t = el('div', 'pl');
      img.alt = '';
      img.src = groupThumb(g);
      t.append(
        el('b', null, 'Vị trí ghép ' + g.name),
        el('small', null, `${g.parts.length} linh kiện đã lắp ở các bước trước`)
      );
      d.append(img, t, el('span', 'qty', 'Cụm đã có'));
      return d;
    }
    function groupParts(list) {
      const groups = new Map();
      for (const p of list) {
        const k = p.name + '|' + p.colorCode;
        if (!groups.has(k)) groups.set(k, { p, k, n: 0 });
        groups.get(k).n++;
      }
      return [...groups.values()];
    }
    function partItem(g, cls) {
      const d = el('div', cls),
        img = el('img'),
        t = el('div', 'pl');
      img.alt = '';
      if (thumbs[g.k]) img.src = thumbs[g.k];
      t.append(
        el('b', null, label(g.p)),
        el('small', null, g.p.name + (g.p.colorCode ? ' · ' + g.p.colorCode : ''))
      );
      d.append(img, t, el('span', 'qty', '× ' + g.n));
      return d;
    }
    // Ô linh kiện cần lấy (như ZMROBO: ảnh, "4x" bên dưới, mũi tên thu gọn ở đáy); bấm một linh kiện để xem riêng
    function renderPli(items) {
      const box = $('pli');
      box.hidden = !items.length;
      box.classList.toggle('closed', !pliOpen);
      $('pliToggle').setAttribute('aria-expanded', pliOpen);
      $('pliItems').replaceChildren(
        ...items.map(it => {
          const d = el('button', 'pliItem' + (it.group ? ' group' : '')),
            img = el('img');
          img.alt = '';
          if (it.img) img.src = it.img;
          d.title = it.title + ' · bấm để xem riêng';
          d.setAttribute('aria-label', it.group
            ? `${it.title}, cụm đã lắp ở các bước trước, bấm để xem riêng`
            : `${it.title}, ${it.n} chiếc, bấm để xem riêng`);
          d.append(img, el('b', null, it.group ? 'CỤM GHÉP' : it.n + 'x'));
          d.onclick = it.open;
          return d;
        })
      );
    }
    // Xem riêng một linh kiện hoặc một cụm: khung xám xoay được (kéo, tự xoay chậm), chân tím ghi tên, mã, số lượng.
    // Ảnh vẽ bằng WebGL của trang rồi chép sang canvas 2D của hộp; trong lúc mở, khung chính tạm không vẽ
    let pv = null;
    function openPreview({ parts, name, code, use }) {
      const c = $('pvCanvas');
      pv = { parts, yaw: -0.7, pitch: 0.48, spin: !matchMedia('(prefers-reduced-motion: reduce)').matches };
      $('pvName').textContent = name;
      $('pvCode').textContent = code;
      $('pvUse').textContent = use;
      $('pvCode').hidden = !code;
      $('preview').hidden = false;
      canvas.style.visibility = 'hidden';
      paintPreview();
      $('pvClose').focus();
      c.onpointerdown = e => {
        pv.drag = [e.clientX, e.clientY];
        pv.spin = false;
        c.setPointerCapture(e.pointerId);
      };
      c.onpointermove = e => {
        if (!pv || !pv.drag) return;
        pv.yaw += (e.clientX - pv.drag[0]) * 0.01;
        pv.pitch = Math.max(-1.55, Math.min(1.55, pv.pitch + (e.clientY - pv.drag[1]) * 0.01));
        pv.drag = [e.clientX, e.clientY];
        paintPreview();
      };
      c.onpointerup = c.onpointercancel = () => pv && (pv.drag = null);
    }
    function paintPreview() {
      const c = $('pvCanvas'),
        r = c.getBoundingClientRect(),
        dpr = Math.min(2, window.devicePixelRatio || 1),
        w = Math.max(1, Math.round(r.width * dpr)),
        h = Math.max(1, Math.round(r.height * dpr));
      if (c.width !== w || c.height !== h) {
        c.width = w;
        c.height = h;
      }
      previewing = false;
      renderSet(pv.parts, w, h, pv.yaw, pv.pitch);
      previewing = true;
      const ctx = c.getContext('2d');
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(canvas, 0, 0, w, h);
    }
    function closePreview() {
      if ($('preview').hidden) return;
      $('preview').hidden = true;
      pv = null;
      previewing = false;
      canvas.style.visibility = '';
      draw();
    }
    // Linh kiện loại g (mã + màu) đặt ở gốc tọa độ, không xoay
    const lonePart = g => [
      { ...g.p, rotation: identity, pos: [0, 0, 0], step: -1, joins: null, stray: false }
    ];
    function stepsUsing(k) {
      return [...new Set(DATA.instances.filter(p => p.name + '|' + p.colorCode === k).map(p => p.step))].sort(
        (a, b) => a - b
      );
    }
    function previewPart(g, here) {
      const steps = stepsUsing(g.k);
      openPreview({
        parts: lonePart(g),
        name: label(g.p),
        code: 'Mã: ' + g.p.name + (g.p.colorCode ? ' · màu ' + g.p.colorCode : ''),
        use:
          (here ? `Bước này cần ${here} chiếc. ` : '') +
          `Cả mô hình dùng ${DATA.instances.filter(p => p.name + '|' + p.colorCode === g.k).length} chiếc, ở ` +
          (steps.length > 1 ? 'các bước ' : 'bước ') +
          steps.join(', ') +
          '.'
      });
    }
    function previewGroup(g) {
      openPreview({
        parts: g.parts,
        name: 'Cụm ' + g.name.replace(/^cụm /, ''),
        code: '',
        use: `${g.parts.length} linh kiện đã lắp riêng ở các bước trước, ghép vào mô hình ở bước này.`
      });
    }
    // Bảng toàn bộ linh kiện của mô hình (lưới ảnh, số lượng, các bước dùng), mở từ nút trên khung 3D
    function openBom() {
      const used = new Map();
      for (const p of DATA.instances) {
        const k = p.name + '|' + p.colorCode;
        if (!used.has(k)) used.set(k, new Set());
        used.get(k).add(p.step);
      }
      const all = groupParts(DATA.instances)
        .map(g => ({ ...g, steps: [...used.get(g.k)].sort((a, b) => a - b) }))
        .sort((a, b) => a.steps[0] - b.steps[0] || b.n - a.n);
      $('bomMeta').textContent = `${DATA.instances.length} linh kiện · ${all.length} loại`;
      $('bomGrid').replaceChildren(
        ...all.map(g => {
          const card = el('div', 'bcard'),
            shot = el('button', 'bimg'),
            img = el('img'),
            where = el('div', 'bsteps');
          img.alt = '';
          if (thumbs[g.k]) img.src = thumbs[g.k];
          shot.append(img);
          shot.title = 'Xem riêng linh kiện này';
          shot.setAttribute('aria-label', 'Xem riêng ' + label(g.p));
          shot.onclick = () => previewPart(g);
          where.append(el('span', null, 'Bước'));
          for (const s of g.steps.slice(0, 12)) {
            const b = el('button', null, s);
            b.title = 'Xem bước ' + s;
            b.onclick = () => {
              closeBom();
              stop();
              go(s);
            };
            where.append(b);
          }
          if (g.steps.length > 12) where.append(el('span', null, '…'));
          card.append(
            shot,
            el('b', 'bqty', g.n + 'x'),
            el('span', 'bname', label(g.p)),
            el('small', null, g.p.name + (g.p.colorCode ? ' · ' + g.p.colorCode : '')),
            where
          );
          return card;
        })
      );
      $('bom').hidden = false;
      $('bomClose').focus();
    }
    function closeBom() {
      if ($('bom').hidden) return;
      $('bom').hidden = true;
      $('bomBtn').focus();
    }
    // Chụp ảnh một bước ở kích thước cố định (lắp tích lũy, khung vừa mô hình, góc nhìn hiện tại)
    function snapshot(s, w, h) {
      step = s;
      bound();
      draw(w, h);
      return canvas.toDataURL('image/png');
    }
    function saveView() {
      return { step, follow, onlyNew, highlight, zoom, yaw, pan: [...pan] };
    }
    function restoreView(v) {
      ({ step, follow, onlyNew, highlight, zoom, yaw } = v);
      pan = v.pan;
      capturing = false;
      update();
    }
    function qrSvg(text) {
      try {
        const q = qrcode(0, 'M');
        q.addData(text);
        q.make();
        return q.createSvgTag({ cellSize: 4, margin: 2, scalable: true });
      } catch (e) {
        return '';
      }
    }
    // Bản in: trang bìa (ảnh toàn mô hình + bảng chuẩn bị linh kiện) và mỗi bước một khối (ảnh, linh kiện, mã QR nếu có địa chỉ)
    function buildPrint({ url = '', bom = true } = {}) {
      const v = saveView(),
        out = $('printout'),
        base = String(url).trim().replace(/#.*$/, '');
      capturing = true;
      follow = false;
      onlyNew = false;
      zoom = 1.15;
      pan = [0, 0];
      out.replaceChildren();
      try {
        if (bom) {
          const cover = el('section', 'pcover'),
            grid = el('div', 'pgrid'),
            img = el('img', 'pimg');
          highlight = false;
          img.src = snapshot(DATA.steps, 1600, 1000);
          for (const g of groupParts(DATA.instances)) grid.append(partItem(g, 'pitem'));
          cover.append(
            el('h1', null, document.querySelector('h1').textContent),
            el('p', 'pmeta', `${DATA.instances.length} linh kiện · ${DATA.steps} bước theo sách hướng dẫn chính thức`),
            img,
            el('h2', null, 'Chuẩn bị linh kiện'),
            grid
          );
          out.append(cover);
        }
        highlight = true;
        for (let s = 1; s <= DATA.steps; s++) {
          const sec = el('section', 'pstep'),
            head = el('div', 'phead'),
            txt = el('div'),
            img = el('img', 'pimg'),
            parts = el('div', 'pparts'),
            gs = groupParts(DATA.instances.filter(p => p.step === s)),
            joined = joinedGroups(s),
            info = infoOf(s);
          txt.append(
            el('h2', null, `Bước ${s} / ${DATA.steps}`),
            ...(info.subCount
              ? [el('small', 'psub', `${groupName(info.group)} · ${info.sub}/${info.subCount}`)]
              : []),
            el('p', null, stepText(s))
          );
          head.append(txt);
          if (base) {
            const q = el('div', 'pqr');
            q.innerHTML = qrSvg(base + '#buoc=' + s + '&gan');
            q.append(el('span', null, 'Quét để xem 3D'));
            head.append(q);
          }
          img.src = snapshot(s, 1600, 1000);
          for (const g of joined) parts.append(groupItem(g, 'pitem'));
          for (const g of gs) parts.append(partItem(g, 'pitem'));
          if (!gs.length && !joined.length)
            parts.append(el('p', 'pnone', 'Không thêm linh kiện mới.'));
          sec.append(head, img, parts);
          out.append(sec);
        }
      } finally {
        restoreView(v);
      }
      return out.children.length;
    }
    function roundRect(ctx, x, y, w, h, r) {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    }
    function fit(ctx, text, max) {
      if (ctx.measureText(text).width <= max) return text;
      let t = text;
      while (t.length > 1 && ctx.measureText(t + '…').width > max) t = t.slice(0, -1);
      return t + '…';
    }
    // Video: mỗi bước quay nhẹ qua lại, có dải tiêu đề bước; cuối video xoay toàn mô hình. Ghi bằng MediaRecorder (mp4 nếu trình duyệt hỗ trợ, nếu không thì webm)
    async function recordVideo({ perStep = 2600, onProgress } = {}) {
      if (!window.MediaRecorder || !HTMLCanvasElement.prototype.captureStream)
        throw Error('Trình duyệt không hỗ trợ quay video. Hãy dùng Chrome hoặc Edge bản mới.');
      const W = 1280,
        H = 720,
        out = el('canvas'),
        ctx = out.getContext('2d');
      out.width = W;
      out.height = H;
      const type =
        ['video/mp4;codecs=avc1', 'video/mp4', 'video/webm;codecs=vp9', 'video/webm'].find(t =>
          MediaRecorder.isTypeSupported(t)
        ) || '';
      const rec = new MediaRecorder(
          out.captureStream(30),
          type ? { mimeType: type, videoBitsPerSecond: 6e6 } : {}
        ),
        chunks = [];
      rec.ondataavailable = e => {
        if (e.data.size) chunks.push(e.data);
      };
      const stopped = new Promise(r => (rec.onstop = r)),
        v = saveView(),
        font = 'system-ui,-apple-system,Segoe UI,sans-serif';
      capturing = true;
      follow = false;
      onlyNew = false;
      zoom = 1.25;
      pan = [0, 0];
      highlight = true;
      const paint = (s, t, last) => {
        step = s;
        bound();
        yaw = v.yaw + (last ? t * Math.PI * 2 : Math.sin(t * Math.PI * 2) * 0.22);
        draw(W, H);
        const g = ctx.createRadialGradient(W / 2, H * 0.42, 40, W / 2, H / 2, W * 0.75);
        g.addColorStop(0, '#ffffff');
        g.addColorStop(1, '#e6eef2');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);
        ctx.drawImage(canvas, 0, 0, W, H);
        const small = last ? 'MÔ HÌNH HOÀN CHỈNH' : stepTag(s);
        ctx.font = `600 30px ${font}`;
        const big = fit(ctx, last ? document.querySelector('h1').textContent : stepText(s), W - 140),
          bw = Math.max(260, ctx.measureText(big).width + 56);
        ctx.fillStyle = 'rgba(255,255,255,.95)';
        roundRect(ctx, 32, 28, bw, 92, 14);
        ctx.fill();
        ctx.fillStyle = '#0096a6';
        ctx.fillRect(32, 40, 6, 68);
        ctx.font = `800 17px ${font}`;
        ctx.fillText(small, 56, 62);
        ctx.fillStyle = '#16313e';
        ctx.font = `600 30px ${font}`;
        ctx.fillText(big, 56, 100);
        ctx.fillStyle = 'rgba(74, 29, 16, .91)';
        roundRect(ctx, 32, H - 70, W - 64, 42, 8);
        ctx.fill();
        ctx.fillStyle = '#fff4e9';
        ctx.font = `600 20px ${font}`;
        ctx.fillText('ZMROBO · Bài 9 · Theo sách hướng dẫn lắp ráp chính thức', 50, H - 43);
      };
      try {
        rec.start(500);
        for (let s = 1; s <= DATA.steps + 1; s++) {
          const last = s > DATA.steps;
          if (last) highlight = false;
          if (onProgress) onProgress(Math.min(s, DATA.steps), DATA.steps);
          const t0 = performance.now(),
            dur = last ? 4000 : perStep;
          await new Promise(res => {
            const tick = now => {
              const t = Math.min(1, (now - t0) / dur);
              paint(last ? DATA.steps : s, t, last);
              if (t < 1) requestAnimationFrame(tick);
              else res();
            };
            requestAnimationFrame(tick);
          });
        }
      } finally {
        if (rec.state !== 'inactive') rec.stop();
        await stopped;
        restoreView(v);
      }
      return {
        blob: new Blob(chunks, { type: type || 'video/webm' }),
        ext: type.includes('mp4') ? 'mp4' : 'webm'
      };
    }
    function download(blob, name) {
      const a = el('a');
      a.href = URL.createObjectURL(blob);
      a.download = name;
      document.body.append(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    }
    function stop() {
      if (timer) clearInterval(timer);
      timer = null;
      $('play').textContent = '▶ Tự chạy';
    }
    // Đọc to bước đang xem bằng giọng tiếng Việt của máy (nếu có); bật một lần thì đọc mỗi khi chuyển bước
    const synth = window.speechSynthesis;
    let speaking = false,
      spoken = 0;
    function speakText(s) {
      const parts = groupParts(DATA.instances.filter(p => p.step === s)).map(
          g => g.n + ' ' + label(g.p).replace(/ · /g, ' ')
        ),
        joins = joinedGroups(s).map(g => 'ghép ' + g.name);
      return (
        `Bước ${s}. ${stepText(s)}.` +
        ([...joins, ...parts].length ? ' Cần ' + [...joins, ...parts].join(', ') + '.' : '')
      );
    }
    function speak(force) {
      if (!synth || !speaking || capturing || (!force && spoken === step)) return;
      spoken = step;
      synth.cancel();
      const u = new SpeechSynthesisUtterance(speakText(step)),
        voice = synth.getVoices().find(v => /^vi/i.test(v.lang));
      u.lang = 'vi-VN';
      if (voice) u.voice = voice;
      u.rate = 0.95;
      synth.speak(u);
    }
    // Đố vui: trước khi hiện linh kiện mới, hỏi "Bước này cần lắp linh kiện nào?" với 4 lựa chọn có ảnh.
    // Đáp án đúng là một loại linh kiện của bước; 3 phương án nhiễu là loại khác trong mô hình (chọn ngẫu nhiên
    // nhưng cố định theo bước). Đúng: linh kiện bay vào vị trí. Điểm = số bước đúng ngay lần đầu.
    let quizOn = false;
    const quiz = { solved: new Set(), tries: new Map(), firstTry: 0 };
    const quizPending = () =>
      quizOn && !capturing && !quiz.solved.has(step) && DATA.instances.some(p => p.step === step);
    function seeded(n) {
      let x = (n * 2654435761) >>> 0;
      return () => (x = (x * 1103515245 + 12345) >>> 0) / 4294967296;
    }
    function quizChoices(s) {
      const here = groupParts(DATA.instances.filter(p => p.step === s)),
        hereKeys = new Set(here.map(g => g.k)),
        rnd = seeded(s),
        shuffle = a =>
          a
            .map(x => [rnd(), x])
            .sort((a, b) => a[0] - b[0])
            .map(x => x[1]),
        answer = shuffle(here)[0],
        others = shuffle(
          groupParts(DATA.instances).filter(g => !hereKeys.has(g.k) && label(g.p) !== label(answer.p))
        );
      // Phương án nhiễu không trùng tên với bất kỳ linh kiện nào của bước (một mã khác nhưng cùng tên "Chốt · đen"
      // sẽ khiến học sinh chọn đúng mà bị chấm sai), và không trùng tên nhau
      const seen = new Set(here.map(g => label(g.p))),
        wrong = [];
      for (const g of others)
        if (wrong.length < 3 && !seen.has(label(g.p))) (seen.add(label(g.p)), wrong.push(g));
      return { answer, choices: shuffle([answer, ...wrong]) };
    }
    function quizCard() {
      const box = el('div', 'quiz'),
        { answer, choices } = quizChoices(step),
        grid = el('div', 'qgrid'),
        msg = el(
          'p',
          'qmsg',
          quiz.tries.get(step) ? 'Chưa đúng, thử lại nhé!' : 'Nhìn mô hình và đoán linh kiện cần lắp.'
        );
      box.append(el('b', null, 'Bước này cần lắp linh kiện nào?'), msg, grid);
      for (const g of choices) {
        const b = el('button', 'qopt'),
          img = el('img');
        img.alt = '';
        if (thumbs[g.k]) img.src = thumbs[g.k];
        b.append(img, el('span', null, label(g.p)));
        b.onclick = () => {
          if (g.k === answer.k) {
            if (!quiz.tries.get(step)) quiz.firstTry++;
            quiz.solved.add(step);
            go(step);
          } else {
            quiz.tries.set(step, (quiz.tries.get(step) || 0) + 1);
            b.classList.add('wrong');
            b.disabled = true;
            msg.textContent = 'Chưa đúng, thử lại nhé!';
          }
        };
        grid.append(b);
      }
      return box;
    }
    // Đánh dấu tiến độ: linh kiện đã lấy (bấm vào dòng) và bước đã lắp xong
    const isDone = s => progress.done.includes(s);
    function setDone(s, on) {
      progress.done = progress.done.filter(x => x !== s);
      if (on) progress.done.push(s);
      saveProgress();
      announceProgress();
    }
    // Báo tiến độ lắp cho nhiệm vụ 1 ở sa bàn (js/app.js)
    function announceProgress() {
      const done = progress.done.filter(x => x >= 1 && x <= DATA.steps).length;
      window.dispatchEvent(new CustomEvent('zm:assembly-progress', { detail: { done, total: DATA.steps } }));
    }
    function checkRow(row, key) {
      const list = () => progress.got[step] || [],
        paint = () => {
          const on = list().includes(key);
          row.classList.toggle('got', on);
          row.setAttribute('aria-checked', on);
        },
        toggle = () => {
          const l = list();
          progress.got[step] = l.includes(key) ? l.filter(k => k !== key) : [...l, key];
          if (!progress.got[step].length) delete progress.got[step];
          saveProgress();
          paint();
        };
      row.classList.add('check');
      row.tabIndex = 0;
      row.setAttribute('role', 'checkbox');
      row.title = 'Bấm để đánh dấu đã lấy linh kiện này';
      row.onclick = toggle;
      row.onkeydown = e => {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          toggle();
        }
      };
      paint();
      return row;
    }
    function update() {
      bound();
      $('stepTitle').textContent = `Bước ${step} / ${DATA.steps}`;
      $('slider').max = DATA.steps;
      $('slider').value = step;
      $('slider').style.setProperty(
        '--pct',
        DATA.steps > 1 ? ((step - 1) / (DATA.steps - 1)) * 100 + '%' : '100%'
      );
      $('countNow').textContent = step;
      $('countTotal').textContent = ' / ' + DATA.steps;
      $('projectInfo').textContent =
        DATA.source + ' · ' + DATA.instances.length + ' linh kiện · ' + DATA.steps + ' bước';
      const added = DATA.instances.filter(p => p.step === step),
        joined = joinedGroups(step),
        info = infoOf(step);
      // Dưới số bước lớn: tên cụm đang lắp riêng, mô tả bước hoặc việc ghép cụm. Bước chỉ "Lắp N linh kiện" không
      // ghi gì thêm, ô linh kiện cần lấy đã nói đủ
      $('bannerStep').textContent = info.subCount
        ? `${groupName(info.group).toUpperCase()} · ${info.sub}/${info.subCount}`
        : '';
      $('bannerText').textContent = stepText(step);
      $('summary').textContent =
        (info.subCount
          ? `Đang lắp riêng ${groupName(info.group)} (${info.sub}/${info.subCount}). `
          : '') +
        `${active.length} linh kiện đang hiển thị · ${added.length} linh kiện mới ở bước này` +
        (joined.length ? ` · ghép ${listNames(joined.map(g => g.name))}.` : '.');
      // Trang sách tương ứng: bước 20 chỉ đổi góc nhìn, bản PDF rút gọn không có hình riêng
      $('assemblyCheck').textContent = `📖 Sách hướng dẫn · bước ${info.page || step}`;
      $('drawerCheck').replaceChildren(
        el('strong', null, `📖 Đối chiếu sách hướng dẫn – bước ${info.page || step}`),
        el('p', null, 'Mô hình 3D dựng từ file thiết kế gốc của bài, thứ tự bước theo sách. Bấm nút để xem hình in của bước này.')
      );
      $('focus').classList.toggle('active', follow);
      try {
        history.replaceState(null, '', '#buoc=' + step + (follow ? '&gan' : ''));
      } catch (e) {}
      $('prev').disabled = step === 1;
      $('next').disabled = step === DATA.steps;
      for (const b of $('steps').children) {
        b.classList.toggle('active', +b.dataset.step === step);
        b.classList.toggle('done', +b.dataset.step < step);
        b.classList.toggle('ok', isDone(+b.dataset.step));
      }
      const groups = groupParts(added),
        asking = quizPending();
      // Đố vui hiện ngay trên khung 3D (chỗ ô linh kiện); danh sách trong ngăn chức năng chờ trả lời xong
      $('quizBox').replaceChildren(...(asking ? [quizCard()] : []));
      $('partList').replaceChildren(
        ...(asking
          ? [el('p', 'none', 'Đang đố vui: chọn đáp án trên khung 3D để xem linh kiện của bước này.')]
          : [
              ...joined.map(g => checkRow(groupItem(g, 'row part'), 'cum:' + g.scope)),
              ...groups.map(g => checkRow(partItem(g, 'row part'), g.k))
            ])
      );
      // Ô "Cần lấy" trên khung 3D (như hộp linh kiện của sách hướng dẫn), ẩn khi đang đố vui để không lộ đáp án
      renderPli(
        asking
          ? []
          : [
              ...joined.map(g => ({
                img: groupThumb(g),
                n: 1,
                title: 'Vị trí ghép ' + g.name,
                group: true,
                open: () => previewGroup(g)
              })),
              ...groups.map(g => ({
                img: thumbs[g.k],
                n: g.n,
                title: label(g.p),
                open: () => previewPart(g, g.n)
              }))
            ]
      );
      $('doneBtn').hidden = asking;
      $('quizScore').textContent =
        quizOn && quiz.solved.size ? `Đúng ngay lần đầu: ${quiz.firstTry} / ${quiz.solved.size} câu` : '';
      const doneCount = progress.done.filter(s => s >= 1 && s <= DATA.steps).length;
      $('doneBtn').textContent = isDone(step) ? '✓ Đã lắp xong bước này (bấm để bỏ)' : '✓ Đã lắp xong bước này';
      $('doneBtn').classList.toggle('primary', !isDone(step));
      $('progressText').textContent = doneCount ? `Đã lắp ${doneCount} / ${DATA.steps} bước` : '';
      $('resetProgress').hidden = !doneCount && !Object.keys(progress.got).length;
      if (!capturing) {
        progress.step = step;
        saveProgress();
        speak();
      }
      if (!groups.length && !joined.length && !asking) {
        const el = document.createElement('p');
        el.className = 'none';
        el.textContent = 'Bước này không thêm linh kiện mới.';
        $('partList').append(el);
      }
      const stray = DATA.instances.filter(p => p.step === step && p.stray),
        missing = [...new Set(DATA.instances.filter(p => p.step === step && p.missing).map(p => p.name))],
        notes = [];
      if (stray.length)
        notes.push(
          '⚠ ' +
            stray.map(p => p.name).join(', ') +
            ' ở bước này nằm tách xa thân mô hình, có thể bị đặt nhầm vị trí trong RoboBuilder. Khung nhìn tạm bỏ qua linh kiện này.'
        );
      if (missing.length)
        notes.push(
          '⚠ Chưa có hình học gốc của ' +
            missing.join(', ') +
            '; trang đang vẽ khối xám thay thế ở đúng vị trí.'
        );
      $('stray').hidden = !notes.length;
      $('menuBtn').classList.toggle('warn', !!notes.length);
      $('stray').textContent = notes.join('\n');
      draw();
    }
    // Chuyển bước theo thao tác người xem: có hoạt ảnh lắp
    function go(s) {
      step = Math.max(1, Math.min(DATA.steps, s));
      update();
      startAnim();
    }
    for (let i = 1; i <= DATA.steps; i++) {
      const b = document.createElement('button'),
        info = infoOf(i);
      b.textContent = i;
      b.dataset.step = i;
      b.setAttribute('aria-label', 'Bước ' + i + (info.subCount ? ', ' + groupName(info.group) : ''));
      const tip = [
        info.subCount ? `${groupName(info.group)} ${info.sub}/${info.subCount}` : '',
        DATA.stepDescriptions?.[i - 1]
      ]
        .filter(Boolean)
        .join(': ');
      if (tip) b.title = tip;
      if (info.subCount) b.classList.add('sub');
      if (info.joins.length && INFO) b.classList.add('join');
      b.onclick = () => {
        stop();
        go(i);
      };
      $('steps').append(b);
    }
    $('slider').oninput = e => {
      stop();
      step = +e.target.value;
      update();
    };
    $('prev').onclick = () => {
      stop();
      step = Math.max(1, step - 1);
      update();
    };
    $('next').onclick = () => {
      stop();
      if (step < DATA.steps) go(step + 1);
    };
    // Liên kết với tab sách hướng dẫn (js/official-assembly.js)
    window.assemblyGoStep = s => {
      stop();
      go(s);
    };
    $('assemblyCheck').onclick = () => {
      window.showOfficialStep?.(infoOf(step).page || step);
      window.switchAssemblySubtab?.('official');
    };
    // Ngăn chức năng ☰
    function setMenu(open) {
      $('app').classList.toggle('menu-open', open);
      $('drawer').inert = !open;
      $('menuBtn').setAttribute('aria-expanded', open);
      if (open) $('menuClose').focus();
    }
    $('menuBtn').onclick = () => setMenu(!$('app').classList.contains('menu-open'));
    $('menuClose').onclick = () => {
      setMenu(false);
      $('menuBtn').focus();
    };
    $('pvClose').onclick = closePreview;
    $('preview').onclick = e => e.target === $('preview') && closePreview();
    $('pliToggle').onclick = () => {
      pliOpen = !pliOpen;
      saveStyle();
      $('pli').classList.toggle('closed', !pliOpen);
      $('pliToggle').setAttribute('aria-expanded', pliOpen);
    };
    $('bomBtn').onclick = () => ($('bom').hidden ? openBom() : closeBom());
    $('bomClose').onclick = closeBom;
    $('replay').onclick = () => {
      stop();
      anim = moves(step).size ? { step, start: performance.now() } : null;
      follow = true;
      onlyNew = false;
      explode = cut = 0;
      $('explode').value = '0';
      $('cut').value = '0';
      $('explodeValue').textContent = $('cutValue').textContent = '0%';
      update();
    };
    $('play').onclick = () => {
      if (timer) {
        stop();
        return;
      }
      if (step === DATA.steps) step = 1;
      go(step);
      $('play').textContent = '⏸ Dừng';
      timer = setInterval(() => {
        if (step === DATA.steps) {
          stop();
          return;
        }
        go(step + 1);
      }, 2200);
    };
    $('focus').onclick = () => {
      follow = !follow;
      zoom = 1;
      pan = [0, 0];
      update();
    };
    $('fit').onclick = () => {
      follow = false;
      zoom = 1;
      pan = [0, 0];
      update();
    };
    $('all').onclick = () => {
      follow = false;
      onlyNew = false;
      $('onlyNew').checked = false;
      step = DATA.steps;
      zoom = 1;
      pan = [0, 0];
      update();
    };
    $('iso').onclick = () => {
      yaw = -0.7;
      pitch = 0.48;
      zoom = 1;
      pan = [0, 0];
      draw();
    };
    $('front').onclick = () => {
      yaw = 0;
      pitch = 0;
      zoom = 1;
      pan = [0, 0];
      draw();
    };
    $('top').onclick = () => {
      yaw = 0;
      pitch = Math.PI / 2;
      zoom = 1;
      pan = [0, 0];
      draw();
    };
    $('spin').onclick = e => {
      autoSpin = !autoSpin;
      e.target.classList.toggle('active', autoSpin);
      e.target.textContent = autoSpin ? 'Dừng xoay' : 'Tự xoay';
    };
    function syncStyle() {
      $('markStyle').value = highlight ? markStyle : 'none';
      $('outline').checked = outline;
      $('eye').classList.toggle('active', !highlight);
      $('eye').setAttribute('aria-pressed', !highlight);
    }
    $('markStyle').onchange = e => {
      markPref = e.target.value;
      highlight = markPref !== 'none';
      if (highlight) markStyle = markPref;
      saveStyle();
      syncStyle();
      draw();
    };
    // Nút mắt trên khung 3D: tạm xem màu thật của mọi linh kiện (bỏ đánh dấu), bấm lại để đánh dấu như trước.
    // Không lưu: mở lại trang vẫn dùng kiểu đã chọn trong "Quan sát chi tiết"
    $('eye').onclick = () => {
      highlight = !highlight;
      syncStyle();
      draw();
    };
    $('outline').onchange = e => {
      outline = e.target.checked;
      saveStyle();
      // Ảnh nhỏ linh kiện và cụm vẽ lại theo kiểu mới
      for (const k of Object.keys(groupThumbs)) delete groupThumbs[k];
      makeThumbs();
      update();
      if (!$('bom').hidden) openBom();
    };
    syncStyle();
    $('onlyNew').onchange = e => {
      onlyNew = e.target.checked;
      update();
    };
    $('edges').onchange = e => {
      edges = e.target.checked;
      draw();
    };
    $('dark').onchange = e => {
      $('app').classList.toggle('dark', e.target.checked);
      draw();
    };
    for (const [id, set] of [
      ['explode', v => (explode = v)],
      ['cut', v => (cut = v)]
    ])
      $(id).oninput = e => {
        set(+e.target.value);
        $(id + 'Value').textContent = Math.round(+e.target.value * 100) + '%';
        draw();
      };
    $('quality').oninput = e => {
      quality = +e.target.value;
      $('qualityValue').textContent = quality + '×';
      draw();
    };
    // Kéo để xoay (Shift/chuột phải: dịch chuyển), cuộn hoặc chụm hai ngón để phóng to
    let dragging = null,
      pinch = null;
    const touches = new Map();
    const spread = () => {
      const [a, b] = [...touches.values()];
      return Math.hypot(a[0] - b[0], a[1] - b[1]) || 1;
    };
    canvas.oncontextmenu = e => e.preventDefault();
    canvas.onpointerdown = e => {
      touches.set(e.pointerId, [e.clientX, e.clientY]);
      canvas.setPointerCapture(e.pointerId);
      if (touches.size === 2) {
        dragging = null;
        pinch = { d: spread(), zoom };
        return;
      }
      dragging = [e.clientX, e.clientY, e.shiftKey || e.button === 2];
    };
    canvas.onpointermove = e => {
      if (touches.has(e.pointerId)) touches.set(e.pointerId, [e.clientX, e.clientY]);
      if (pinch && touches.size === 2) {
        zoom = Math.max(0.3, Math.min(10, (pinch.zoom * spread()) / pinch.d));
        draw();
        return;
      }
      if (!dragging) return;
      const dx = e.clientX - dragging[0],
        dy = e.clientY - dragging[1];
      if (dragging[2]) {
        const r = canvas.getBoundingClientRect();
        pan[0] += (dx / r.width) * 2;
        pan[1] -= (dy / r.height) * 2;
      } else {
        yaw += dx * 0.007;
        pitch = Math.max(-1.55, Math.min(1.55, pitch + dy * 0.007));
      }
      dragging = [e.clientX, e.clientY, dragging[2]];
      draw();
    };
    canvas.onpointerup = canvas.onpointercancel = e => {
      touches.delete(e.pointerId);
      if (touches.size < 2) pinch = null;
      dragging = null;
    };
    canvas.onwheel = e => {
      e.preventDefault();
      zoom = Math.max(0.3, Math.min(10, zoom * Math.exp(-e.deltaY * 0.001)));
      draw();
    };
    new ResizeObserver(() => draw()).observe(canvas);
    $('quiz').onchange = e => {
      quizOn = e.target.checked;
      update();
    };
    $('doneBtn').onclick = () => {
      const on = !isDone(step);
      setDone(step, on);
      if (on && step < DATA.steps) {
        stop();
        go(step + 1);
      } else update();
    };
    $('resetProgress').onclick = () => {
      progress = { step, done: [], got: {} };
      saveProgress();
      announceProgress();
      update();
    };
    $('resume').querySelector('button').onclick = () => {
      $('resume').hidden = true;
      stop();
      step = 1;
      update();
    };
    if (synth) {
      $('speak').onclick = () => {
        speaking = !speaking;
        $('speak').classList.toggle('active', speaking);
        $('speak').textContent = speaking ? '🔊 Đang đọc to' : '🔊 Đọc to';
        if (speaking) speak(true);
        else synth.cancel();
      };
      synth.getVoices();
    } else $('speak').hidden = true;
    // Toàn màn hình cả trang (máy chiếu, máy tính bảng)
    const app = $('app');
    function fullscreen() {
      try {
        if (document.fullscreenElement) document.exitFullscreen();
        else app.requestFullscreen();
      } catch (e) {}
    }
    if (app.requestFullscreen) $('full').onclick = fullscreen;
    else $('full').hidden = true;
    document.addEventListener('fullscreenchange', () => {
      const on = !!document.fullscreenElement;
      $('full').classList.toggle('active', on);
      $('full').title = on ? 'Thoát toàn màn hình (Esc)' : 'Toàn màn hình (F)';
    });
    // Phím tắt: ← → chuyển bước, Space tự chạy, Home/End bước đầu/cuối, R xem lại cách lắp, F toàn màn hình
    document.onkeydown = e => {
      // Esc đóng lớp trên cùng: xem riêng linh kiện → danh sách linh kiện → ngăn chức năng
      if (e.key === 'Escape') {
        if (!$('preview').hidden) closePreview();
        else if (!$('bom').hidden) closeBom();
        else if ($('app').classList.contains('menu-open')) $('menuClose').click();
        else return;
        e.preventDefault();
        return;
      }
      if (!$('preview').hidden || !$('bom').hidden) return;
      if (['INPUT', 'SELECT'].includes(e.target.tagName) || e.ctrlKey || e.metaKey || e.altKey) return;
      const onControl = e.target.tagName === 'BUTTON' || e.target.getAttribute('role') === 'checkbox';
      if (e.key === 'ArrowLeft') $('prev').click();
      else if (e.key === 'ArrowRight') $('next').click();
      else if (e.key === ' ' && !onControl) {
        e.preventDefault();
        $('play').click();
      } else if (e.key === 'Home') {
        stop();
        step = 1;
        update();
      } else if (e.key === 'End') {
        stop();
        step = DATA.steps;
        update();
      } else if (e.key === 'r' || e.key === 'R') $('replay').click();
      else if (e.key === 'f' || e.key === 'F') fullscreen();
    };
    let last = 0;
    function animation(time) {
      if (creative && creative.until > performance.now() - 50) draw();
      if (anim && performance.now() - anim.start > ANIM_MS + 7 * STAGGER) {
        anim = null;
        draw();
      } else if (anim) draw();
      else if (autoSpin && time - last > 30) {
        yaw += 0.007;
        draw();
        last = time;
      }
      if (pv && pv.spin && time - (pv.t || 0) > 30) {
        pv.yaw += 0.012;
        pv.t = time;
        paintPreview();
      }
      requestAnimationFrame(animation);
    }
    requestAnimationFrame(animation);
    try {
      if (/^https?:$/.test(location.protocol)) $('qrUrl').value = location.href.replace(/#.*$/, '');
    } catch (e) {}
    $('printBtn').onclick = () => {
      $('printPanel').hidden = !$('printPanel').hidden;
    };
    $('printGo').onclick = () => {
      const b = $('printGo');
      b.disabled = true;
      $('teacherNote').textContent = 'Đang tạo bản in…';
      setTimeout(() => {
        try {
          buildPrint({ url: $('qrUrl').value, bom: $('printBom').checked });
          $('teacherNote').textContent = '';
          window.print();
        } catch (e) {
          console.error(e);
          $('teacherNote').textContent = 'Không tạo được bản in: ' + e.message;
        } finally {
          b.disabled = false;
        }
      }, 30);
    };
    $('videoBtn').onclick = async () => {
      const b = $('videoBtn'),
        ov = $('loading'),
        msg = t => (ov.querySelector('p').textContent = t);
      stop();
      b.disabled = true;
      ov.querySelector('strong').textContent = 'Đang quay video';
      msg('Giữ trang này mở trên màn hình cho tới khi xong.');
      ov.style.display = 'grid';
      try {
        const { blob, ext } = await recordVideo({
          onProgress: (s, n) => msg(`Bước ${s} / ${n} · giữ trang này mở trên màn hình cho tới khi xong.`)
        });
        download(blob, document.querySelector('h1').textContent + '_huong_dan.' + ext);
        $('teacherNote').textContent =
          `Đã tải video (${(blob.size / 1048576).toFixed(1)} MB, ${ext.toUpperCase()}).`;
      } catch (e) {
        console.error(e);
        $('teacherNote').textContent = 'Không quay được video: ' + e.message;
      } finally {
        ov.style.display = 'none';
        b.disabled = false;
      }
    };
    // ----- Xuất file cho giáo viên: mô hình .glb, ảnh các bước (.zip), bảng linh kiện (.csv) -----
    const fileBase = () => document.querySelector('h1').textContent.replace(/[\\/:*?"<>|]+/g, '_');
    // glTF 2.0 nhị phân. RoboBuilder (Unity) dùng hệ tọa độ tay trái: lật trục X như shader của trang
    // (vị trí, pháp tuyến, phép quay), đảo thứ tự đỉnh tam giác cho đúng mặt trước, UV lật dọc.
    // Mỗi bước là một node cha "Bước N" chứa các linh kiện của bước đó, tiện làm hoạt cảnh trong Blender/PowerPoint.
    function buildGlb() {
      const chunks = [],
        views = [],
        accessors = [],
        images = [],
        textureIndex = new Map();
      let offset = 0;
      function push(bytes, target) {
        const pad = (4 - (bytes.byteLength % 4)) % 4;
        views.push({
          buffer: 0,
          byteOffset: offset,
          byteLength: bytes.byteLength,
          ...(target ? { target } : {})
        });
        chunks.push(new Uint8Array(bytes.buffer, bytes.byteOffset, bytes.byteLength), new Uint8Array(pad));
        offset += bytes.byteLength + pad;
        return views.length - 1;
      }
      function accessor(array, type, extra) {
        accessors.push({
          bufferView: push(array, 34962),
          componentType: 5126,
          count: array.length / { VEC3: 3, VEC2: 2 }[type],
          type,
          ...extra
        });
        return accessors.length - 1;
      }
      const lin = c => c.map(x => Math.pow(Math.max(0, Math.min(1, x)), 2.2));
      const materials = [],
        gltfMeshes = meshes.map((m, i) => {
          const n = m.count,
            pos = new Float32Array(n * 3),
            nor = new Float32Array(n * 3),
            uv = m.texture >= 0 ? new Float32Array(n * 2) : null,
            lo = [Infinity, Infinity, Infinity],
            hi = [-Infinity, -Infinity, -Infinity];
          for (let t = 0; t < n; t += 3)
            for (let j = 0; j < 3; j++) {
              const src = (t + j) * 8,
                dst = t + (j === 0 ? 0 : 3 - j); // đỉnh 0,1,2 → 0,2,1
              for (let k = 0; k < 3; k++) {
                const flip = k === 0 ? -1 : 1;
                pos[dst * 3 + k] = m.a[src + k] * flip;
                nor[dst * 3 + k] = m.a[src + 3 + k] * flip;
                lo[k] = Math.min(lo[k], pos[dst * 3 + k]);
                hi[k] = Math.max(hi[k], pos[dst * 3 + k]);
              }
              if (uv) {
                uv[dst * 2] = m.a[src + 6];
                uv[dst * 2 + 1] = 1 - m.a[src + 7];
              }
            }
          const material = {
            name: m.material || m.name || 'vat_lieu_' + i,
            doubleSided: true,
            pbrMetallicRoughness: {
              baseColorFactor: [...lin(m.color), 1],
              metallicFactor: 0,
              roughnessFactor: 0.6
            }
          };
          if (uv) {
            if (!textureIndex.has(m.texture)) {
              const b = bytes(DATA.textures[m.texture].url.split(',')[1]);
              images.push({ bufferView: push(b), mimeType: 'image/png' });
              textureIndex.set(m.texture, images.length - 1);
            }
            material.pbrMetallicRoughness.baseColorTexture = { index: textureIndex.get(m.texture) };
          }
          materials.push(material);
          const attributes = {
            POSITION: accessor(pos, 'VEC3', { min: lo, max: hi }),
            NORMAL: accessor(nor, 'VEC3')
          };
          if (uv) attributes.TEXCOORD_0 = accessor(uv, 'VEC2');
          return { name: m.name || 'luoi_' + i, primitives: [{ attributes, material: i }] };
        });
      const nodes = [],
        stepNodes = [];
      for (let s = 1; s <= DATA.steps; s++) {
        const children = [];
        for (const p of DATA.instances.filter(q => q.step === s)) {
          // Ma trận cột 4×4 của glTF; phép lật X: R' = S·R·S, t' = S·t với S = diag(-1, 1, 1)
          const R = p.rotation,
            f = (i, j) => ((i === 0) !== (j === 0) ? -1 : 1), // hàng i, cột j
            matrix = [];
          for (let col = 0; col < 3; col++) {
            for (let row = 0; row < 3; row++) matrix.push(R[col * 3 + row] * f(row, col));
            matrix.push(0);
          }
          matrix.push(-p.pos[0], p.pos[1], p.pos[2], 1);
          for (const id of p.meshes) {
            nodes.push({ name: p.name + (p.colorCode ? ' ' + p.colorCode : ''), mesh: id, matrix });
            children.push(nodes.length - 1);
          }
        }
        const info = infoOf(s);
        nodes.push({
          name:
            `Bước ${s}` + (info.subCount ? ` · ${groupName(info.group)} ${info.sub}/${info.subCount}` : ''),
          ...(children.length ? { children } : {})
        });
        stepNodes.push(nodes.length - 1);
      }
      const json = {
        asset: { version: '2.0', generator: 'RBB Studio' },
        scene: 0,
        scenes: [{ name: document.querySelector('h1').textContent, nodes: stepNodes }],
        nodes,
        meshes: gltfMeshes,
        materials,
        accessors,
        bufferViews: views,
        buffers: [{ byteLength: offset }]
      };
      if (images.length) {
        json.images = images;
        json.samplers = [{ magFilter: 9729, minFilter: 9987 }];
        json.textures = images.map((_, i) => ({ source: i, sampler: 0 }));
      }
      let text = JSON.stringify(json);
      text += ' '.repeat((4 - (new TextEncoder().encode(text).length % 4)) % 4);
      const head = new TextEncoder().encode(text),
        total = 12 + 8 + head.length + 8 + offset,
        out = new Uint8Array(total),
        dv = new DataView(out.buffer);
      dv.setUint32(0, 0x46546c67, true);
      dv.setUint32(4, 2, true);
      dv.setUint32(8, total, true);
      dv.setUint32(12, head.length, true);
      dv.setUint32(16, 0x4e4f534a, true);
      out.set(head, 20);
      dv.setUint32(20 + head.length, offset, true);
      dv.setUint32(24 + head.length, 0x004e4942, true);
      let o = 28 + head.length;
      for (const c of chunks) {
        out.set(c, o);
        o += c.byteLength;
      }
      return out;
    }
    // ZIP không nén (ảnh PNG vốn đã nén) để không cần thư viện ngoài
    const CRC = new Uint32Array(256).map((_, n) => {
      for (let k = 0; k < 8; k++) n = n & 1 ? 0xedb88320 ^ (n >>> 1) : n >>> 1;
      return n >>> 0;
    });
    function crc32(b) {
      let c = 0xffffffff;
      for (let i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 255] ^ (c >>> 8);
      return (c ^ 0xffffffff) >>> 0;
    }
    function zip(files) {
      const enc = new TextEncoder(),
        parts = [],
        dir = [];
      let offset = 0;
      for (const { name, data } of files) {
        const n = enc.encode(name),
          crc = crc32(data),
          h = new DataView(new ArrayBuffer(30));
        h.setUint32(0, 0x04034b50, true);
        h.setUint16(4, 20, true);
        h.setUint16(6, 0x0800, true); // tên file UTF-8
        h.setUint32(14, crc, true);
        h.setUint32(18, data.length, true);
        h.setUint32(22, data.length, true);
        h.setUint16(26, n.length, true);
        const c = new DataView(new ArrayBuffer(46));
        c.setUint32(0, 0x02014b50, true);
        c.setUint16(4, 20, true);
        c.setUint16(6, 20, true);
        c.setUint16(8, 0x0800, true);
        c.setUint32(16, crc, true);
        c.setUint32(20, data.length, true);
        c.setUint32(24, data.length, true);
        c.setUint16(28, n.length, true);
        c.setUint32(42, offset, true);
        parts.push(new Uint8Array(h.buffer), n, data);
        dir.push(new Uint8Array(c.buffer), n);
        offset += 30 + n.length + data.length;
      }
      const size = dir.reduce((s, d) => s + d.length, 0),
        end = new DataView(new ArrayBuffer(22));
      end.setUint32(0, 0x06054b50, true);
      end.setUint16(8, files.length, true);
      end.setUint16(10, files.length, true);
      end.setUint32(12, size, true);
      end.setUint32(16, offset, true);
      return new Blob([...parts, ...dir, new Uint8Array(end.buffer)], { type: 'application/zip' });
    }
    // Ảnh lắp tích lũy từng bước (góc nhìn đang xem), tô cam linh kiện mới
    function stepImages() {
      const v = saveView(),
        files = [],
        pad = String(DATA.steps).length;
      capturing = true;
      follow = false;
      onlyNew = false;
      zoom = 1.15;
      pan = [0, 0];
      highlight = true;
      try {
        for (let s = 1; s <= DATA.steps; s++)
          files.push({
            name: `buoc_${String(s).padStart(pad, '0')}.png`,
            data: bytes(snapshot(s, 1600, 1000).split(',')[1])
          });
      } finally {
        restoreView(v);
      }
      return zip(files);
    }
    // Bảng linh kiện cho Excel: UTF-8 có BOM, mỗi dòng một loại (mã + màu) với số lượng và các bước dùng
    function partsCsv() {
      const q = x => '"' + String(x).replace(/"/g, '""') + '"',
        rows = [['Mã linh kiện', 'Tên', 'Nhóm', 'Màu', 'Mã màu', 'Số lượng', 'Các bước dùng']];
      for (const g of groupParts(DATA.instances).sort(
        (a, b) =>
          a.p.name.localeCompare(b.p.name) || String(a.p.colorCode).localeCompare(String(b.p.colorCode))
      )) {
        const used = [
          ...new Set(DATA.instances.filter(p => p.name + '|' + p.colorCode === g.k).map(p => p.step))
        ];
        rows.push([
          g.p.name,
          label(g.p),
          L.types[g.p.name] || '',
          (g.p.colorCode ? L.colors[g.p.colorCode] : L.defaults[g.p.name]) || '',
          g.p.colorCode || '',
          g.n,
          used.join(', ')
        ]);
      }
      rows.push(['Tổng', '', '', '', '', DATA.instances.length, '']);
      return new Blob(['﻿' + rows.map(r => r.map(q).join(',')).join('\r\n') + '\r\n'], {
        type: 'text/csv;charset=utf-8'
      });
    }
    $('glbBtn').onclick = () => {
      try {
        const b = new Blob([buildGlb()], { type: 'model/gltf-binary' });
        download(b, fileBase() + '.glb');
        $('teacherNote').textContent = `Đã tải mô hình 3D (${(b.size / 1048576).toFixed(1)} MB).`;
      } catch (e) {
        console.error(e);
        $('teacherNote').textContent = 'Không tạo được file .glb: ' + e.message;
      }
    };
    $('pngBtn').onclick = () => {
      const b = $('pngBtn');
      b.disabled = true;
      $('teacherNote').textContent = 'Đang chụp ảnh các bước…';
      setTimeout(() => {
        try {
          const z = stepImages();
          download(z, fileBase() + '_anh_cac_buoc.zip');
          $('teacherNote').textContent =
            `Đã tải ${DATA.steps} ảnh (${(z.size / 1048576).toFixed(1)} MB, file .zip).`;
        } catch (e) {
          console.error(e);
          $('teacherNote').textContent = 'Không chụp được ảnh: ' + e.message;
        } finally {
          b.disabled = false;
        }
      }, 30);
    };
    $('csvBtn').onclick = () => download(partsCsv(), fileBase() + '_linh_kien.csv');
    // Địa chỉ đổi khi trang đang mở (Studio chuyển bước xem trước, bấm liên kết #buoc=N): nhảy tới bước đó
    addEventListener('hashchange', () => {
      try {
        const s = Math.floor(+new URLSearchParams(location.hash.slice(1)).get('buoc'));
        if (s >= 1 && s <= DATA.steps && s !== step) {
          stop();
          step = s;
          update();
        }
      } catch (e) {}
    });
    makeThumbs();
    update();
    if (resumed) {
      $('resume').hidden = false;
      setTimeout(() => ($('resume').hidden = true), 12000);
      $('resume').querySelector('span').textContent = `Tiếp tục bước ${step} từ lần trước.`;
    }
    $('loading').style.display = 'none';
    setTimeout(announceProgress, 0);
    window.robotViewer = {
      buildPrint,
      recordVideo,
      buildGlb,
      stepImages,
      partsCsv,
      // extras: [{ meshes, rotation, pos, name, extra: true, addedAt? }] hoặc null để tắt
      // options.plain: không đánh dấu linh kiện nào (sa bàn hiện màu thật)
      setCreative(extras, options = {}) {
        stop();
        creative = extras
          ? { extras, plain: !!options.plain, until: Math.max(0, ...extras.map(p => (p.addedAt || 0) + ANIM_MS)) }
          : null;
        if (!creative) spin = null;
        $('app').classList.toggle('creative-mode', !!creative);
        if (creative) step = DATA.steps;
        update();
      },
      setSpin(angles) {
        spin = angles;
        draw();
      },
      box: list => box(list),
      rotate: (R, v) => mul(R, v),
      setStep(s) {
        if (s < 1 || s > DATA.steps) throw Error('Invalid step');
        step = s;
        update();
      },
      getStep() {
        return step;
      },
      stats() {
        return {
          instances: DATA.instances.length,
          visible: active.length,
          meshes: meshes.length,
          textures: textures.length,
          thumbs: Object.keys(thumbs).length,
          follow,
          animating: !!anim,
          creative: creative ? creative.extras.length : null,
          done: progress.done.length,
          quiz: { on: quizOn, pending: quizPending(), solved: quiz.solved.size, firstTry: quiz.firstTry },
          explode,
          cut,
          drawCalls: draws,
          lineDraws,
          outline,
          mark: highlight ? markStyle : 'none',
          pli: $('pli').hidden ? 0 : $('pliItems').children.length,
          instanced: !!inst,
          glError: gl.getError(),
          canvas: [canvas.width, canvas.height]
        };
      }
    };
  } catch (e) {
    console.error(e);
    $('loading').innerHTML = '<strong>Không hiển thị được mô hình</strong><p class="error"></p>';
    $('loading').querySelector('p').textContent = e.message;
  }
})();
