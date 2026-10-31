// js/simulation-engine.js - Digital Twin Simulation Engine for ZMrobo Bài 9
(function() {
  'use strict';

  // Động cơ: mức công suất 1–8 (khối Motor Power); mức 8 = 150 vòng/phút. High Speed = mức 8.
  const MAX_RPM = 150;
  // Mô hình Bài 9: bánh răng 8 răng (động cơ) dẫn bánh răng 40 răng (cột anten) – cố định theo sách
  const GEAR = [8, 40];
  // Chương trình mẫu trong giáo án/phiếu học tập (khối động cơ có thể là High Speed hoặc Motor Power)
  const SAMPLE = ['start', 'repeatStart', 'melody:A', 'motor', 'wait:3', 'melody:B', 'motor', 'wait:3', 'repeatEnd'];
  const sig = b =>
    b.type === 'melody' ? 'melody:' + b.tune
      : b.type === 'wait' ? 'wait:' + b.duration
        : b.type === 'motor_power' ? 'motor' : b.type;

  // Chế độ Nâng cao (cấp 2–3): thiên thạch bay ngang quỹ đạo theo chu kỳ, vật lạ quanh quỹ đạo, chụp ảnh gửi về trạm.
  // Hình học dùng chung với cảnh câu chuyện (js/space-scene.js): khung 900×560, tâm Trái Đất (450, 285), quỹ đạo R = 200.
  const GEO = { CX: 450, CY: 285, R: 200 };
  const ROCK = {
    lane: 135, // chỗ đường bay cắt quỹ đạo (độ, chiều kim đồng hồ từ trạm mặt đất)
    period: 8, // cứ 8 giây thiên thạch bay qua một lần
    block: 2.5, // chặn đường trong 2,5 giây đầu của mỗi chu kỳ
    speed: 56, // px/giây trên cảnh
    dir: [-0.997, 0.087], // bay từ phải sang trái
    hit: 15 // vệ tinh trong khoảng ±15° quanh chỗ cắt thì đụng
  };
  const ODDITIES = [
    { kind: 'comet', name: 'sao chổi', deg: 230, dr: 62 },
    { kind: 'debris', name: 'mảnh vỡ vệ tinh cũ', deg: 305, dr: -58 },
    { kind: 'ufo', name: 'vật thể lạ', deg: 40, dr: 58 }
  ];
  const VIEW = 130; // tầm nhìn của cảm biến/camera (px trên cảnh)
  const geoPos = (deg, r = GEO.R) => {
    const a = (deg * Math.PI) / 180;
    return [GEO.CX + r * Math.sin(a), GEO.CY - r * Math.cos(a)];
  };

  const THEME = {
    bg: '#0A1224',
    panel: '#0F1A30',
    ring: '#36507D',
    text: '#D3DEEE',
    muted: '#8496B5',
    earth: '#2E6CC9',
    earthHi: '#5A93E6',
    land: '#3BA56A',
    station: '#FFD23F',
    trail: '#FFD23F',
    body: '#E6ECF3',
    solar: '#29B3D6',
    solarLine: '#0E6F8A',
    gear: '#C3CCD6',
    gearDark: '#6F7B8B',
    motorGear: '#29B3D6',
    beam: '#B48CF2',
    ok: '#1C8A4C',
    warn: '#A35F00',
    bad: '#FF7A6B'
  };

  class SimulationEngine {
    constructor(canvas2dId) {
      this.cv = document.getElementById(canvas2dId);
      this.ctx = this.cv ? this.cv.getContext('2d') : null;

      this.running = false;
      this.power = 8; // mức công suất động cơ 1–8
      this.motorOn = false;

      this.t = 0;
      this.pc = 0;
      this.entered = false;
      this.blkT = 0;
      this.rev = 0; // Số vòng quay trục vệ tinh
      this.motorRev = 0;
      this.segStart = null;
      this.lastSeg = null;
      this.streak = 0;
      this.m3Achieved = false;
      this.loopsDone = 0; // số lần chạy hết vòng lặp (tới khối Repeat End)
      this.assemblyDone = false; // NV1: học sinh đã lắp xong đủ 28 bước (tab lắp ráp báo sang)
      this.upgradeRun = false; // NV4: đã chạy chương trình khi vệ tinh có gói nâng cấp

      this.prog = [];
      this.logs = [];
      this.lastTimestamp = performance.now();
      this.loopActive = true;
      this.rafId = null;

      this.upgrades = new Set(); // 'solar' | 'radar' | 'sensor' – có thể gắn nhiều gói cùng lúc (xưởng sáng tạo)
      this.motorDir = 1;         // 1: CW, -1: CCW
      this.asteroidAvoided = false;
      this.avoidanceMethod = null;
      this.melodyBPlayed = false;
      this.melodyAlertRev = null;
      this.hazardDetected = false;
      this.hazardEncountered = false;

      // Nâng cao
      this.advanced = false;
      this.runT = 0; // thời gian chạy từ lúc bấm Start (đồng hồ của thiên thạch)
      this.waitedT = 0; // thời gian vệ tinh đứng đợi trước đường bay khi thiên thạch đang chặn
      this.laneCrash = false; // đã đụng thiên thạch ở lượt đi qua này
      this.rockPassed = false; // NV5
      this.gallery = new Map(); // NV6: ảnh vật lạ trạm đã nhận (giữ qua các lần chạy)
      this.sensorHinted = false;

      // RoboSim Procedural Asteroids in the hazard zone (115° to 160°)
      this.asteroids = [
        { ang: 120, dist: 145, size: 14, rot: 0.2, spin: 0.5, pts: [[-1, -0.8], [0.3, -1.1], [1, -0.4], [0.8, 0.9], [-0.5, 1.2], [-1.1, 0.3]] },
        { ang: 132, dist: 136, size: 18, rot: 0.8, spin: -0.3, pts: [[-0.9, -0.7], [0.1, -1.2], [1.1, -0.6], [0.9, 0.8], [-0.3, 1.1], [-1.2, 0.1]] },
        { ang: 144, dist: 154, size: 12, rot: 1.5, spin: 0.7, pts: [[-1, -0.9], [0.4, -0.9], [0.9, -0.3], [0.7, 1], [-0.6, 0.9], [-1, 0]] },
        { ang: 155, dist: 142, size: 16, rot: 2.1, spin: -0.4, pts: [[-0.8, -0.8], [0.2, -1], [1, -0.5], [0.8, 0.8], [-0.4, 1], [-1, 0.2]] }
      ];

      // Stars background
      this.stars = Array.from({ length: 90 }, () => ({
        x: Math.random() * 900,
        y: Math.random() * 500,
        r: Math.random() < 0.15 ? 2 : 1.2,
        a: 0.2 + Math.random() * 0.6
      }));

      this.resizeCanvas();
      window.addEventListener('resize', () => this.resizeCanvas());

      this.onMissionUpdate = null;
      this.onActiveBlockUpdate = null;
    }

    init() {
      this.startLoop();
    }

    resizeCanvas() {
      if (!this.cv) return;
      const w = this.cv.clientWidth || 900;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      this.cv.width = Math.round(w * dpr);
      this.cv.height = Math.round(w * (5 / 9) * dpr);
      this.scale = w / 900;
      this.dpr = dpr;
    }

    // Sửa chương trình thì dừng lại và về đầu; chỉ chạy khi học sinh chạm khối Start hoặc nút ▶
    setProgram(blocks) {
      this.prog = blocks || [];
      this.restart(false);
    }
    // Báo sự kiện cho cảnh câu chuyện (js/space-scene.js): melody, near, crash, avoid, loop, start, stop
    emit(type, data) {
      if (this.onEvent) this.onEvent(type, data);
    }

    // Bật/tắt thử thách Nâng cao (theo nút Chế độ)
    setAdvanced(on) {
      on = !!on;
      if (this.advanced === on) return;
      this.advanced = on;
      if (this.running) this.stop();
      this.restart(false);
      this.checkMissions();
    }

    // ---------- Nâng cao: thiên thạch bay qua, vật lạ, chụp ảnh ----------
    // Khoảng cách dọc đường bay từ thiên thạch tới chỗ cắt quỹ đạo (âm: đang bay tới)
    rockS(t = this.runT) {
      const u = (((t + 3.75) % ROCK.period) + ROCK.period) % ROCK.period;
      return (u - 5) * ROCK.speed;
    }
    rockXY(t = this.runT) {
      const [lx, ly] = geoPos(ROCK.lane);
      const s = this.rockS(t);
      return [lx + s * ROCK.dir[0], ly + s * ROCK.dir[1]];
    }
    rockAlpha(t = this.runT) {
      const s = this.rockS(t);
      return Math.max(0, Math.min(1, (s + 280) / 50, (170 - s) / 50));
    }
    laneBlocked(t = this.runT) {
      return ((t % ROCK.period) + ROCK.period) % ROCK.period < ROCK.block;
    }
    // Giây còn lại tới lúc đổi trạng thái: đang chặn → bao lâu nữa trống; đang trống → bao lâu nữa quay lại
    rockCountdown(t = this.runT) {
      const u = ((t % ROCK.period) + ROCK.period) % ROCK.period;
      return u < ROCK.block ? ROCK.block - u : ROCK.period - u;
    }
    satXY() {
      return geoPos(this.headingDegrees());
    }
    // Các vật lạ đang có trên cảnh (Nâng cao); chế độ Bé chỉ có đám đá đứng yên
    oddities() {
      if (!this.advanced) return [{ kind: 'rock', name: 'thiên thạch', xy: geoPos(135, GEO.R + 10) }];
      const list = ODDITIES.map(o => ({ kind: o.kind, name: o.name, xy: geoPos(o.deg, GEO.R + o.dr) }));
      if (this.rockAlpha() > 0.4) list.push({ kind: 'rock', name: 'thiên thạch', xy: this.rockXY() });
      return list;
    }
    // Vật lạ gần nhất trong tầm nhìn của vệ tinh
    seen() {
      const [x, y] = this.satXY();
      let best = null,
        bd = VIEW;
      for (const o of this.oddities()) {
        const d = Math.hypot(o.xy[0] - x, o.xy[1] - y);
        if (d < bd) {
          bd = d;
          best = o;
        }
      }
      return best;
    }
    // Đường phía trước bị thiên thạch chặn (hoặc sắp chặn trong 0,5 s) khi vệ tinh đang ở trước đường bay
    pathBlocked() {
      const h = this.headingDegrees();
      if (!this.advanced) return this.motorDir > 0 && h >= 60 && h < 160 && !this.asteroidAvoided;
      const ahead = h >= ROCK.lane - 95 && h < ROCK.lane + ROCK.hit;
      return ahead && (this.laneBlocked() || this.laneBlocked(this.runT + 0.5));
    }
    needSensor() {
      if (this.has('sensor')) return false;
      if (!this.sensorHinted) {
        this.sensorHinted = true;
        this.log('warn', 'Khối này cần mắt cảm biến: hãy gắn gói Cảm biến ở chặng Sáng tạo.');
        this.emit('needSensor');
      }
      return true;
    }
    matchIfEnd(i) {
      let depth = 0;
      for (let j = i + 1; j < this.prog.length; j++) {
        if (this.prog[j].type === 'if_see') depth++;
        else if (this.prog[j].type === 'if_end') {
          if (!depth) return j;
          depth--;
        }
      }
      return -1;
    }
    takePhoto() {
      const o = this.seen();
      if (!o) {
        this.log('info', 'Chụp ảnh: không có vật lạ trước camera, ảnh trống.');
        this.emit('photo', { kind: null, from: this.satXY() });
        return;
      }
      const first = !this.gallery.has(o.kind);
      this.gallery.set(o.kind, o.name);
      this.log('ok', `Chụp ảnh ${o.name} và gửi về trạm mặt đất.`);
      this.emit('photo', { kind: o.kind, name: o.name, first, from: this.satXY() });
      if (first) this.checkMissions();
    }

    // NV1: báo từ trình xem 3D khi đã đánh dấu lắp xong cả 28 bước
    setAssemblyDone(done) {
      if (this.assemblyDone === !!done) return;
      this.assemblyDone = !!done;
      if (done) this.log('ok', '🏗️ Đã lắp xong mô hình vệ tinh 28 bước!');
      this.checkMissions();
    }

    // Tương thích mã cũ: activeUpgrade = một gói (gói đầu tiên khi có nhiều gói)
    get activeUpgrade() {
      return this.upgrades.values().next().value || null;
    }
    set activeUpgrade(type) {
      this.upgrades = new Set(type ? [type] : []);
    }
    has(type) {
      return this.upgrades.has(type);
    }
    setActiveUpgrade(type) {
      this.setUpgrades(type ? [type] : []);
    }
    // Danh sách gói từ xưởng sáng tạo (js/creative-lab.js)
    setUpgrades(list) {
      this.upgrades = new Set(list || []);
      this.upgradeRun = false;
      const names = {
        solar: 'Cánh pin mặt trời kép',
        radar: 'Chảo ra-đa',
        sensor: 'Cảm biến né thiên thạch'
      };
      const labels = { solar: 'Pin kép', radar: 'Chảo ra-đa', sensor: 'Cảm biến' };
      const list2 = [...this.upgrades];
      this.log('ok', list2.length ? `Đã gắn: ${list2.map(t => names[t]).join(', ')}` : 'Vệ tinh cơ bản (chưa gắn thêm)');
      const badge = document.getElementById('sim-active-upgrade-badge');
      if (badge) badge.textContent = list2.length ? list2.map(t => labels[t]).join(' · ') : 'Vệ tinh cơ bản';
    }

    // Tư thế cho sa bàn 3D (js/sandbox-3d.js): cột anten (bánh răng 40) và bánh răng 8 quay ngược chiều nhau
    pose3d() {
      return { output: -this.rev * Math.PI * 2, motor: this.motorRev * Math.PI * 2 };
    }

    ratio() {
      return GEAR[0] / GEAR[1];
    }

    motorRpm() {
      return (MAX_RPM * this.power) / 8;
    }

    // NV2: chương trình đúng thứ tự khối của chương trình mẫu
    matchesSample() {
      return this.prog.length === SAMPLE.length && this.prog.every((b, i) => sig(b) === SAMPLE[i]);
    }

    outRps() {
      if (!this.motorOn) return 0;
      return (this.motorRpm() / 60) * this.ratio();
    }

    start() {
      this.restart(true);
      this.log('info', 'Bắt đầu chạy chương trình ZMrobo.');
      this.emit('start');
    }

    stop() {
      this.running = false;
      this.motorOn = false;
      this.entered = false;
      this.segStart = null;
      if (this.onActiveBlockUpdate) this.onActiveBlockUpdate(-1);
      this.log('info', 'Đã dừng chương trình. Motor ngắt điện.');
      this.emit('stop');
    }

    restart(run = false) {
      this.pc = 0;
      this.nearWarned = false;
      this.entered = false;
      this.blkT = 0;
      this.motorOn = false;
      this.rev = 0;
      this.motorRev = 0;
      this.motorDir = 1;
      this.segStart = null;
      this.streak = 0;
      this.m3Achieved = false;
      this.loopsDone = 0;
      this.power = 8;
      this.asteroidAvoided = false;
      this.avoidanceMethod = null;
      this.melodyBPlayed = false;
      this.melodyAlertRev = null;
      this.hazardDetected = false;
      this.hazardEncountered = false;
      this.runT = 0;
      this.waitedT = 0;
      this.laneCrash = false;
      this.sensorHinted = false;
      this.lastSeenKind = null;
      this.running = run;
      if (this.onActiveBlockUpdate) this.onActiveBlockUpdate(-1);
      if (window.SFX) window.SFX.init();
    }

    log(kind, text) {
      const m = Math.floor(this.t / 60);
      const s = (this.t - m * 60).toFixed(1);
      const timeStr = `${String(m).padStart(2, '0')}:${s.padStart(4, '0')}`;
      // Giao diện gọn như Bài 7: bỏ biểu tượng cảm xúc ở đầu câu, màu chấm của dòng nhật ký đã cho biết loại tin
      text = String(text).replace(/^[\p{Extended_Pictographic}️‍\s]+/u, '');
      this.logs.unshift({ time: timeStr, kind, text });
      if (this.logs.length > 8) this.logs.length = 8;
      this.renderLogs();
    }

    renderLogs() {
      const el = document.getElementById('sim-log-list');
      if (!el) return;
      el.innerHTML = this.logs.map(e => `
        <li class="log-item" data-kind="${e.kind}">
          <time class="log-time">${e.time}</time>
          <span class="log-dot"></span>
          <span class="log-text">${e.text}</span>
        </li>
      `).join('');
    }

    headingDegrees() {
      return (((this.rev * 360) % 360) + 360) % 360;
    }

    isApproachingHazard() {
      const angle = this.headingDegrees();
      return this.motorOn && this.motorDir > 0 && !this.hazardEncountered &&
        angle >= 60 && angle < 110;
    }

    recordAvoidance(method) {
      if (this.asteroidAvoided) return;
      this.asteroidAvoided = true;
      this.avoidanceMethod = method;
      this.emit('avoid', method);
      this.log('ok', `🛡️ Đã tránh vành đai thiên thạch bằng ${method === 'reverse' ? 'đảo chiều motor' : 'Melody B và dừng motor'} trước 110°.`);
      this.checkMissions();
    }

    advance(dt) {
      if (!this.running || !this.prog.length) return;

      let budget = dt;
      let guard = 0;

      while (this.running && guard++ < 35) {
        if (this.pc >= this.prog.length) {
          this.pc = 0;
        }

        const b = this.prog[this.pc];
        if (!b) break;

        if (b.type === 'start') {
          this.pc++;
          continue;
        }

        if (b.type === 'repeatStart') {
          this.pc++;
          continue;
        }

        if (b.type === 'repeatEnd') {
          this.loopsDone++;
          this.emit('loop', this.loopsDone);
          if (this.loopsDone === 1) this.checkMissions();
          // Quay lại sau khối repeatStart
          const rIdx = this.prog.findIndex(x => x.type === 'repeatStart');
          this.pc = rIdx !== -1 ? rIdx + 1 : 0;
          continue;
        }

        if (b.type === 'motor' || b.type === 'motor_power') {
          // High Speed = mức 8; Low Speed (chương trình cũ) = mức 4; Motor Power = mức học sinh chọn
          this.power = b.type === 'motor_power' ? Math.max(1, Math.min(8, b.power || 8)) : b.speed === 'low' ? 4 : 8;
          this.motorOn = true;
          if (this.upgrades.size && !this.upgradeRun) {
            this.upgradeRun = true;
            this.checkMissions();
          }
          this.pc++;
          continue;
        }

        if (b.type === 'motor_reverse') {
          const avoided = this.isApproachingHazard();
          this.motorDir = -this.motorDir;
          this.log('ok', `Đảo chiều động cơ (hướng hiện tại: ${this.motorDir > 0 ? 'Thuận CW' : 'Nghịch CCW'}).`);
          if (avoided) this.recordAvoidance('reverse');
          this.pc++;
          continue;
        }

        if (b.type === 'stop') {
          if (this.melodyAlertRev !== null && this.isApproachingHazard() &&
              this.rev - this.melodyAlertRev < 50 / 360) {
            this.recordAvoidance('melody-stop');
          }
          this.motorOn = false;
          this.pc++;
          continue;
        }

        if (b.type === 'if_end') {
          this.pc++;
          continue;
        }

        // Nếu thấy vật lạ … Hết Nếu: cảm biến thấy vật thì làm các khối bên trong, không thì nhảy qua
        if (b.type === 'if_see') {
          const o = this.needSensor() ? null : this.seen();
          if (o && o.kind !== this.lastSeenKind) this.log('warn', `Cảm biến thấy ${o.name}!`);
          this.lastSeenKind = o ? o.kind : null;
          if (o) this.pc++;
          else {
            const end = this.matchIfEnd(this.pc);
            this.pc = end === -1 ? this.pc + 1 : end + 1;
          }
          continue;
        }

        // Đợi đường trống: đứng ở khối này cho tới khi phía trước không còn thiên thạch
        if (b.type === 'wait_clear') {
          if (!this.entered) {
            this.entered = true;
            this.blkT = 0;
            if (this.onActiveBlockUpdate) this.onActiveBlockUpdate(this.pc);
            if (!this.needSensor() && this.pathBlocked()) this.log('warn', 'Thiên thạch đang chặn đường – đợi nó bay qua.');
          }
          if (this.has('sensor') && this.pathBlocked()) {
            this.blkT += budget;
            this.integrate(budget);
            budget = 0;
            break;
          }
          if (this.blkT > 0.2) this.log('ok', 'Đường đã trống, đi tiếp!');
          this.entered = false;
          this.pc++;
          continue;
        }

        if (b.type === 'sensor_obstacle') {
          if (!this.entered) {
            this.entered = true;
            this.blkT = 0;
            if (this.onActiveBlockUpdate) this.onActiveBlockUpdate(this.pc);
            this.log('warn', this.has('sensor')
              ? (this.advanced ? 'Đang quét: chờ vệ tinh đến gần đường bay thiên thạch.' : '🛡️ Đang quét: chờ vệ tinh đến gần vành đai thiên thạch (60°–110°).')
              : '🛡️ Cần gắn gói Cảm biến vật cản ở phần Sáng tạo 3D để nhận tín hiệu.');
            if (window.SFX) window.SFX.tone(660, 0.15);
          }
          if (this.has('sensor') && this.isApproachingHazard()) {
            this.hazardDetected = true;
            this.log('warn', this.advanced
              ? 'Phát hiện đường bay thiên thạch phía trước! Dừng lại và đợi nó bay qua.'
              : '🛡️ Phát hiện thiên thạch phía trước! Hãy đảo chiều hoặc phát Melody B rồi dừng.');
            this.entered = false;
            this.pc++;
            continue;
          }
          this.blkT += budget;
          this.integrate(budget);
          budget = 0;
          break;
        }

        // Các khối tốn thời gian: melody hoặc wait
        if (!this.entered) {
          this.entered = true;
          this.blkT = 0;
          if (this.onActiveBlockUpdate) this.onActiveBlockUpdate(this.pc);

          if (b.type === 'melody') {
            if (window.SFX) window.SFX.melody(b.tune);
            this.log('info', `Melody ${b.tune}: Vệ tinh phát tín hiệu vi ba về trạm mặt đất trong 1s.`);
            if (b.tune === 'B') this.melodyBPlayed = true;
            this.emit('melody', b.tune);
          } else if (b.type === 'photo') {
            if (window.SFX) window.SFX.tone(1320, 0.08);
            this.takePhoto();
          } else if (b.type === 'wait') {
            this.segStart = this.rev;
          }
        }

        const dur = b.type === 'melody' || b.type === 'photo' ? 1.0 : (b.duration || 3.0);
        const need = dur - this.blkT;

        if (budget < need) {
          this.blkT += budget;
          this.integrate(budget);
          budget = 0;
          break;
        }

        this.integrate(need);
        budget -= need;
        this.blkT = dur;

        // Exit block
        if (b.type === 'wait') {
          const r = this.rev - this.segStart;
          this.lastSeg = r;
          this.segStart = null;
          const near = Math.round(r);
          const off = Math.abs(r - near);
          const isWhole = near >= 1 && off < 0.04;

          if (isWhole) {
            this.streak++;
            this.log('ok', `Wait ${b.duration}s: Vệ tinh quay tròn ${r.toFixed(2)} vòng và về ĐÚNG trạm.`);
            if (this.streak >= 2 && !this.m3Achieved) {
              this.m3Achieved = true;
              if (window.SFX) window.SFX.ding();
              this.log('ok', '🎉 Thử nghiệm quỹ đạo: Hai khối Wait liên tiếp cho số vòng nguyên!');
              this.checkMissions();
            }
          } else {
            this.streak = 0;
            const deg = Math.round(((r % 1) + 1) % 1 * 360);
            this.log(r < 1 ? 'warn' : 'info', `Wait ${b.duration}s: Đi được ${r.toFixed(2)} vòng, dừng lệch ${deg}° so với điểm xuất phát.`);
          }
        }

        this.entered = false;
        this.pc++;
      }

      if (budget > 0) {
        this.integrate(budget);
      }
    }

    integrate(dt) {
      if (this.running) this.runT += dt;
      const previousRev = this.rev;
      if (this.motorOn) {
        const rps = (this.motorRpm() / 60) * this.ratio();
        this.rev += rps * dt * this.motorDir;
        this.motorRev += (this.motorRpm() / 60) * dt * this.motorDir;
        // Báo một lần khi vệ tinh bắt đầu tiến vào vùng nguy hiểm (60°–110°)
        if (!this.nearWarned && this.isApproachingHazard()) {
          this.nearWarned = true;
          this.emit('near');
        }
        // Count a hazard crossing even if a long frame skips the entire arc.
        const crossedHazard = this.motorDir > 0 &&
          Math.floor(this.rev - 110 / 360) > Math.floor(previousRev - 110 / 360);
        if (!this.advanced && this.motorDir > 0 && !this.asteroidAvoided && !this.hazardEncountered &&
            crossedHazard) {
          this.hazardEncountered = true;
          this.emit('crash');
          this.log('warn', '⚠️ Vệ tinh đã đi vào vành đai thiên thạch. Chạy lại để thử tránh sớm hơn!');
        }
        const block = this.prog[this.pc];
        if (block && block.type === 'melody' && block.tune === 'B' &&
            this.entered && this.isApproachingHazard()) {
          this.melodyAlertRev = this.rev;
        }
      }
      if (this.advanced && this.running) this.rockStep(dt, previousRev);
      // Update asteroid tumbling
      if (this.asteroids) {
        for (const a of this.asteroids) {
          a.rot += a.spin * dt;
        }
      }
    }

    // Nâng cao: đụng thiên thạch khi nó đang chặn đường; đợi nó qua rồi đi tiếp → NV5
    rockStep(dt, previousRev) {
      const h = this.headingDegrees();
      const blocked = this.laneBlocked();
      if (blocked && !this.motorOn && h >= ROCK.lane - 95 && h < ROCK.lane - ROCK.hit) this.waitedT += dt;
      if (blocked && Math.abs(h - ROCK.lane) <= ROCK.hit && !this.laneCrash) {
        this.laneCrash = true;
        this.hazardEncountered = true;
        this.emit('crash', 'rock');
        this.log('warn', 'Vệ tinh đụng thiên thạch! Hãy dừng trước đường bay và đợi nó bay qua.');
      }
      const edge = (ROCK.lane + ROCK.hit) / 360;
      if (this.motorDir > 0 && Math.floor(this.rev - edge) > Math.floor(previousRev - edge)) {
        if (!this.laneCrash && this.waitedT >= 0.5) {
          this.log('ok', 'Đã đợi thiên thạch bay qua rồi đi tiếp an toàn!');
          this.emit('pass');
          if (!this.rockPassed) {
            this.rockPassed = true;
            this.checkMissions();
          }
        }
        this.laneCrash = false;
        this.hazardEncountered = false;
        this.waitedT = 0;
      }
    }

    checkMissions() {
      // NV1: lắp xong mô hình 28 bước (tab Hướng dẫn lắp ráp)
      const m1 = this.assemblyDone;
      // NV2: lập trình đúng chương trình mẫu và chạy hết ít nhất một vòng
      const m2 = this.matchesSample() && this.loopsDone >= 1;
      // NV3: thực sự tránh được vành đai thiên thạch khi chạy (chỉ đặt khối Đảo chiều/Cảm biến chưa đủ)
      const m3 = this.asteroidAvoided;
      // NV4: gắn gói nâng cấp ở xưởng sáng tạo và cho động cơ chạy trên sa bàn
      const m4 = this.upgrades.size > 0 && this.upgradeRun;
      // Nâng cao – NV5: dừng trước đường bay, đợi thiên thạch qua rồi đi tiếp; NV6: trạm nhận được ảnh vật lạ
      const m5 = this.rockPassed;
      const m6 = this.gallery.size > 0;

      if (this.onMissionUpdate) {
        this.onMissionUpdate({ m1, m2, m3, m4, m5, m6, allDone: m1 && m2 && m3 && m4,
          photos: [...this.gallery.values()],
          avoidanceMethod: this.avoidanceMethod, wholeRevolutions: this.m3Achieved,
          upgrades: [...this.upgrades] });
      }
    }

    draw() {
      if (!this.ctx || !this.cv) return;
      const ctx = this.ctx;
      const k = this.scale * this.dpr;

      ctx.setTransform(k, 0, 0, k, 0, 0);
      ctx.fillStyle = THEME.bg;
      ctx.fillRect(0, 0, 900, 500);

      // Stars
      ctx.fillStyle = '#FFFFFF';
      for (const s of this.stars) {
        ctx.globalAlpha = s.a;
        ctx.fillRect(s.x, s.y, s.r, s.r);
      }
      ctx.globalAlpha = 1;

      // Split layout: Left is Orbit Stage (0..600), Right is Gear Box (600..900)
      ctx.fillStyle = THEME.panel;
      ctx.fillRect(600, 0, 300, 500);
      ctx.strokeStyle = THEME.ring;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(600, 0);
      ctx.lineTo(600, 500);
      ctx.stroke();

      this.drawOrbit(ctx);
      this.drawGears(ctx);
    }

    drawOrbit(ctx) {
      const cx = 300, cy = 250, ro = 145, re = 48;
      const rps = this.outRps();

      // 1. RoboSim Arena Mat Grid & Background
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, 600, 500);
      ctx.clip();

      ctx.fillStyle = '#070D18';
      ctx.fillRect(0, 0, 600, 500);

      // Tech Grid Lines (every 40px)
      ctx.strokeStyle = 'rgba(45, 111, 214, 0.09)';
      ctx.lineWidth = 1;
      for (let x = 20; x < 600; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 500);
        ctx.stroke();
      }
      for (let y = 10; y < 500; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(600, y);
        ctx.stroke();
      }

      // Plus (+) crosshairs at grid intersections
      ctx.strokeStyle = 'rgba(45, 111, 214, 0.28)';
      ctx.lineWidth = 1.2;
      for (let x = 60; x < 600; x += 80) {
        for (let y = 50; y < 500; y += 80) {
          ctx.beginPath();
          ctx.moveTo(x - 4, y); ctx.lineTo(x + 4, y);
          ctx.moveTo(x, y - 4); ctx.lineTo(x, y + 4);
          ctx.stroke();
        }
      }

      // 2. RoboSim Arena Outer Boundary & Degree Dial Ring
      const rmat = 195;
      ctx.strokeStyle = 'rgba(45, 111, 214, 0.35)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx, cy, rmat, 0, Math.PI * 2);
      ctx.stroke();

      // Degree ticks & numbers every 15°
      for (let deg = 0; deg < 360; deg += 15) {
        const rad = -Math.PI / 2 + (deg * Math.PI) / 180;
        const isMajor = deg % 45 === 0;
        const len = isMajor ? 10 : 5;
        const x1 = cx + Math.cos(rad) * (rmat - len);
        const y1 = cy + Math.sin(rad) * (rmat - len);
        const x2 = cx + Math.cos(rad) * rmat;
        const y2 = cy + Math.sin(rad) * rmat;

        ctx.strokeStyle = isMajor ? 'rgba(93, 149, 235, 0.8)' : 'rgba(93, 149, 235, 0.3)';
        ctx.lineWidth = isMajor ? 2 : 1;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        if (isMajor) {
          const tx = cx + Math.cos(rad) * (rmat + 14);
          const ty = cy + Math.sin(rad) * (rmat + 14);
          ctx.font = '600 10.5px "JetBrains Mono", monospace';
          ctx.fillStyle = 'rgba(145, 161, 184, 0.85)';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(`${deg}°`, tx, ty);
        }
      }

      // 3. Asteroid Belt Hazard Zone (Sector 115° to 160°)
      const astStart = -Math.PI / 2 + (115 * Math.PI) / 180;
      const astEnd = -Math.PI / 2 + (160 * Math.PI) / 180;

      ctx.save();
      // Shaded sector
      ctx.fillStyle = 'rgba(230, 70, 40, 0.12)';
      ctx.beginPath();
      ctx.arc(cx, cy, ro + 32, astStart, astEnd);
      ctx.arc(cx, cy, ro - 32, astEnd, astStart, true);
      ctx.closePath();
      ctx.fill();

      // Hazard dashed striped border
      ctx.strokeStyle = 'rgba(234, 160, 52, 0.7)';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([8, 6]);
      ctx.beginPath();
      ctx.arc(cx, cy, ro + 32, astStart, astEnd);
      ctx.arc(cx, cy, ro - 32, astStart, astEnd);
      ctx.stroke();
      ctx.setLineDash([]);

      // Floating Asteroids
      for (const ast of this.asteroids) {
        const arad = -Math.PI / 2 + (ast.ang * Math.PI) / 180;
        const ax = cx + Math.cos(arad) * ast.dist;
        const ay = cy + Math.sin(arad) * ast.dist;

        ctx.save();
        ctx.translate(ax, ay);
        ctx.rotate(ast.rot);

        // Craggy polygon
        ctx.fillStyle = '#4A3D36';
        ctx.strokeStyle = '#D97736';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ast.pts.forEach(([px, py], idx) => {
          const vx = px * (ast.size / 2);
          const vy = py * (ast.size / 2);
          if (idx === 0) ctx.moveTo(vx, vy);
          else ctx.lineTo(vx, vy);
        });
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.restore();
      }

      // Hazard Zone Text
      const midAst = (astStart + astEnd) / 2;
      const htx = cx + Math.cos(midAst) * (ro + 48);
      const hty = cy + Math.sin(midAst) * (ro + 48);
      ctx.font = '700 10.5px "Chakra Petch", sans-serif';
      ctx.fillStyle = '#EAA034';
      ctx.textAlign = 'center';
      ctx.fillText('⚠️ VÀNH ĐAI THIÊN THẠCH', htx, hty);
      ctx.restore();

      // 4. Central Planet (Earth Core)
      const grad = ctx.createRadialGradient(cx - 16, cy - 18, 6, cx, cy, re);
      grad.addColorStop(0, '#5A95E6');
      grad.addColorStop(0.7, '#2359A8');
      grad.addColorStop(1, '#102E66');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, re, 0, Math.PI * 2);
      ctx.fill();

      // Earth Continents
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, re, 0, Math.PI * 2);
      ctx.clip();
      ctx.fillStyle = '#2DA566';
      [
        [-18, -6, 18, 12, 0.4],
        [12, 16, 20, 10, -0.3],
        [20, -20, 11, 8, 0.2],
        [-14, 24, 10, 6, 0]
      ].forEach(([x, y, rx, ry, a]) => {
        ctx.beginPath();
        ctx.ellipse(cx + x, cy + y, rx, ry, a, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();

      // Atmospheric Halo
      ctx.strokeStyle = 'rgba(93, 149, 235, 0.4)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(cx, cy, re + 2, 0, Math.PI * 2);
      ctx.stroke();

      // 5. Orbit Path (ro = 145)
      ctx.strokeStyle = 'rgba(41, 179, 214, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.arc(cx, cy, ro, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // 6. Stations around the Orbit:
      // Station 1: Trạm Alpha (0° / Bottom: -Math.PI / 2)
      const aAlpha = -Math.PI / 2;
      const s1x = cx + Math.cos(aAlpha) * ro;
      const s1y = cy + Math.sin(aAlpha) * ro;

      ctx.fillStyle = '#1C8A4C';
      ctx.beginPath();
      ctx.arc(s1x, s1y, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#34C77B';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(s1x, s1y, 11 + Math.sin(this.t * 4) * 2, 0, Math.PI * 2);
      ctx.stroke();
      ctx.font = '700 11px "Chakra Petch", sans-serif';
      ctx.fillStyle = '#34C77B';
      ctx.textAlign = 'center';
      ctx.fillText('TRẠM ALPHA (0°)', s1x, s1y - 18);

      // Station 2: Trạm ISS (90° / Right: 0)
      const aISS = 0;
      const s2x = cx + Math.cos(aISS) * ro;
      const s2y = cy + Math.sin(aISS) * ro;

      ctx.fillStyle = '#2D6FD6';
      ctx.beginPath();
      ctx.arc(s2x, s2y, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#5D95EB';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(s2x, s2y, 10 + Math.cos(this.t * 3) * 2, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#5D95EB';
      ctx.textAlign = 'left';
      ctx.fillText('TRẠM ISS (90°)', s2x + 14, s2y + 4);

      // Station 3: Trạm Beta (180° / Top: Math.PI / 2)
      const aBeta = Math.PI / 2;
      const s3x = cx + Math.cos(aBeta) * ro;
      const s3y = cy + Math.sin(aBeta) * ro;

      ctx.fillStyle = '#EAA034';
      ctx.beginPath();
      ctx.arc(s3x, s3y, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#FFD23F';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(s3x, s3y, 10, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#FFD23F';
      ctx.textAlign = 'center';
      ctx.fillText('TRẠM BETA (180°)', s3x, s3y + 20);

      // 7. Satellite Angle & Heading
      const th = -Math.PI / 2 + this.rev * Math.PI * 2;
      const curDeg = Math.round((((this.rev * 360) % 360) + 360) % 360);
      const px = cx + Math.cos(th) * ro;
      const py = cy + Math.sin(th) * ro;

      // Trail of current Wait segment
      if (this.segStart !== null) {
        const d = this.rev - this.segStart;
        const a0 = -Math.PI / 2 + this.segStart * Math.PI * 2;
        ctx.strokeStyle = '#FFD23F';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.arc(cx, cy, ro, a0, a0 + (d % 1) * Math.PI * 2, this.motorDir < 0);
        ctx.stroke();
      }

      // Signal beam during melody or radar upgrade
      const curBlock = this.prog[this.pc];
      if ((this.running && this.entered && curBlock && curBlock.type === 'melody') || this.has('radar')) {
        ctx.strokeStyle = '#B48CF2';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.lineDashOffset = -this.t * 40;
        ctx.beginPath();
        ctx.moveTo(s1x, s1y);
        ctx.lineTo(px, py);
        ctx.stroke();
        ctx.setLineDash([]);

        if (this.has('radar')) {
          // Radar pulse rings
          for (let pr = 10; pr <= 35; pr += 12) {
            const pulseR = (pr + (this.t * 20) % 25);
            ctx.strokeStyle = `rgba(180, 140, 242, ${1 - pulseR / 50})`;
            ctx.beginPath();
            ctx.arc(px, py, pulseR, th - 0.6, th + 0.6);
            ctx.stroke();
          }
        }
      }

      // 8. Satellite Rendering
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(th + Math.PI / 2 * this.motorDir);

      // SENSOR CONE if activeUpgrade === 'sensor'
      const inHazard = (curDeg >= 105 && curDeg <= 165);
      if (this.has('sensor')) {
        const coneColor = inHazard ? 'rgba(255, 60, 60, 0.35)' : 'rgba(41, 179, 214, 0.2)';
        const coneBorder = inHazard ? '#FF3C3C' : '#29B3D6';
        ctx.fillStyle = coneColor;
        ctx.strokeStyle = coneBorder;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, 75, -Math.PI / 6, Math.PI / 6);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Warning text if in hazard zone
        if (inHazard) {
          ctx.font = '700 11px "Chakra Petch", sans-serif';
          ctx.fillStyle = '#FF4444';
          ctx.textAlign = 'center';
          ctx.fillText('⚠️ PHÁT HIỆN THIÊN THẠCH!', 0, 88);
        }
      }

      // Dual Solar Wings if activeUpgrade === 'solar' (4 panels) vs Base (2 panels)
      const isDualSolar = this.has('solar');
      ctx.fillStyle = THEME.solar;
      ctx.strokeStyle = THEME.solarLine;
      ctx.lineWidth = 1.2;

      const wingSets = isDualSolar ? [-58, -30, 14, 42] : [-44, 14];
      for (const sxp of wingSets) {
        ctx.fillRect(sxp, -7, 26, 14);
        ctx.strokeRect(sxp, -7, 26, 14);
        ctx.beginPath();
        for (let x = sxp + 6.5; x < sxp + 26; x += 6.5) {
          ctx.moveTo(x, -7); ctx.lineTo(x, 7);
        }
        ctx.moveTo(sxp, 0); ctx.lineTo(sxp + 26, 0);
        ctx.stroke();

        // Energy sparkles if dual solar
        if (isDualSolar && Math.random() < 0.25) {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(sxp + Math.random() * 20, -5 + Math.random() * 10, 2, 2);
          ctx.fillStyle = THEME.solar;
        }
      }

      // Central Satellite Hub (Cyan Frame BP-8818 & White RCU BE-5158)
      ctx.fillStyle = '#1D3B57';
      ctx.fillRect(-14, -2, 28, 4);
      ctx.fillStyle = '#E6ECF3';
      ctx.fillRect(-10, -10, 20, 20);
      ctx.strokeStyle = '#29B3D6';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(-10, -10, 20, 20);

      // Antenna / Radar Dish
      if (this.has('radar')) {
        // High-Gain Parabolic Dish
        ctx.strokeStyle = '#FFD23F';
        ctx.fillStyle = 'rgba(255, 210, 63, 0.25)';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(0, 16, 12, Math.PI * 1.1, Math.PI * 1.9);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, 10); ctx.lineTo(0, 18);
        ctx.stroke();
      } else {
        // Normal antenna
        ctx.strokeStyle = '#E6ECF3';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, 10); ctx.lineTo(0, 16);
        ctx.arc(0, 19, 4, Math.PI * 1.15, Math.PI * 1.85);
        ctx.stroke();
      }

      ctx.restore();

      // 9. Telemetry HUD Overlay in Top-Left
      ctx.fillStyle = 'rgba(10, 18, 36, 0.85)';
      ctx.strokeStyle = 'rgba(45, 111, 214, 0.35)';
      ctx.lineWidth = 1;
      ctx.fillRect(14, 14, 210, 68);
      ctx.strokeRect(14, 14, 210, 68);

      ctx.font = '700 11px "Chakra Petch", sans-serif';
      ctx.fillStyle = '#5D95EB';
      ctx.textAlign = 'left';
      ctx.fillText('SA BÀN KHÔNG GIAN ROBOSIM', 22, 30);

      ctx.font = '600 11px "JetBrains Mono", monospace';
      ctx.fillStyle = '#D3DEEE';
      ctx.fillText(`QUỸ ĐẠO: ${curDeg}° | ${this.motorDir > 0 ? 'TIẾN (CW)' : 'LÙI (CCW)'}`, 22, 47);

      ctx.font = '600 10.5px "JetBrains Mono", monospace';
      if (inHazard) {
        ctx.fillStyle = '#FF7A6B';
        ctx.fillText('⚠️ TRONG VÙNG THIÊN THẠCH!', 22, 64);
      } else {
        ctx.fillStyle = '#34C77B';
        const upTxt = this.upgrades.size
          ? [...this.upgrades].map(t => ({ solar: '⚡ PIN KÉP', radar: '📡 RADAR', sensor: '🛡️ CẢM BIẾN' })[t]).join(' · ')
          : '🛰️ VỆ TINH CƠ BẢN';
        ctx.fillText(upTxt, 22, 64);
      }

      ctx.restore();
    }

    drawGears(ctx) {
      const [t1, t2] = GEAR;
      const cy = 200;
      const r1 = t1 * 1.5, r2 = t2 * 1.5;
      const d = r1 + r2;
      const x1 = 750 - d / 2;
      const x2 = x1 + d;

      ctx.font = '600 12px "JetBrains Mono", monospace';
      ctx.fillStyle = THEME.muted;
      ctx.textAlign = 'left';
      ctx.fillText('BỘ TRUYỀN BÁNH RĂNG', 620, 26);

      const a1 = -this.motorRev * Math.PI * 2;
      const a2 = this.motorRev * Math.PI * 2 * (t1 / t2) + Math.PI / t2;

      this.drawSingleGear(ctx, x1, cy, t1, a1, THEME.motorGear);
      this.drawSingleGear(ctx, x2, cy, t2, a2, THEME.gear);

      ctx.textAlign = 'center';
      ctx.font = '600 12px "JetBrains Mono", monospace';
      ctx.fillStyle = THEME.motorGear;
      ctx.fillText('MOTOR', x1, cy + 70);
      ctx.fillText(`${t1} răng`, x1, cy + 86);

      ctx.fillStyle = THEME.text;
      ctx.fillText('TRỤC VỆ TINH', x2, cy + 70);
      ctx.fillText(`${t2} răng`, x2, cy + 86);

      ctx.font = '700 24px "Chakra Petch", sans-serif';
      ctx.fillStyle = THEME.text;
      ctx.fillText(`Tỉ số: ${t1} : ${t2}`, 750, 360);

      ctx.font = '500 13px "JetBrains Mono", monospace';
      ctx.fillStyle = THEME.muted;
      const desc = t1 < t2 ? `Trục chậm hơn ${t2 / t1} lần (quay êm)` : t1 > t2 ? `Trục nhanh hơn ${t1 / t2} lần (quá nhanh)` : 'Trục quay bằng motor';
      ctx.fillText(desc, 750, 386);
    }

    drawSingleGear(ctx, cx, cy, teeth, ang, fill) {
      const r = teeth * 1.5, ro = r + 4, ri = r - 4, n = teeth;
      ctx.beginPath();
      for (let i = 0; i < n; i++) {
        const a = ang + (i * Math.PI * 2) / n, w = Math.PI / n;
        const pts = [
          [ri, a - w * 0.55],
          [ro, a - w * 0.3],
          [ro, a + w * 0.3],
          [ri, a + w * 0.55]
        ];
        pts.forEach(([rr, aa], j) => {
          const x = cx + Math.cos(aa) * rr, y = cy + Math.sin(aa) * rr;
          (i === 0 && j === 0) ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        });
      }
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();
      ctx.strokeStyle = THEME.gearDark;
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Center hole
      ctx.fillStyle = THEME.panel;
      ctx.beginPath();
      ctx.arc(cx, cy, Math.max(4, r * 0.22), 0, Math.PI * 2);
      ctx.fill();
    }

    updateUI() {
      const curBlock = this.prog[this.pc];
      const inBlock = this.running && this.entered && curBlock;

      // Status pill
      const pill = document.getElementById('sim-status-pill');
      if (pill) {
        if (!this.running) {
          pill.textContent = 'Đã dừng';
          pill.dataset.k = 'muted';
        } else {
          pill.textContent = 'Đang chạy';
          pill.dataset.k = 'ok';
        }
      }

      // Status description
      const stEl = document.getElementById('sim-status-desc');
      if (stEl) {
        let text = 'Chương trình đang dừng. Bấm “Chạy chương trình” để bắt đầu.';
        if (inBlock) {
          if (curBlock.type === 'melody') {
            text = `Khối Melody ${curBlock.tune}: Vệ tinh phát tín hiệu vi ba về trạm mặt đất trong 1.0 giây.`;
          } else if (curBlock.type === 'photo') {
            text = 'Khối Chụp ảnh: Vệ tinh chụp vật lạ phía trước và gửi ảnh về trạm mặt đất.';
          } else if (curBlock.type === 'wait_clear') {
            text = `Khối Đợi đường trống: thiên thạch còn chặn ${this.rockCountdown().toFixed(1)} giây nữa.`;
          } else if (curBlock.type === 'wait') {
            const curRevs = this.segStart !== null ? (this.rev - this.segStart).toFixed(2) : '0';
            text = `Khối Wait ${curBlock.duration}s: Vệ tinh đang quay trên quỹ đạo (đã đi ${curRevs} vòng).`;
          }
        } else if (this.running) {
          text = 'Đang chuyển giao lệnh tiếp theo...';
        }
        stEl.textContent = text;
      }

      // Meters
      const mr = this.motorOn ? this.motorRpm() : 0;
      const or = mr * this.ratio();
      const mMotor = document.getElementById('m-motor');
      if (mMotor) mMotor.innerHTML = `${mr} <small>vòng/phút</small>`;
      const mMotorNote = document.getElementById('m-motor-note');
      if (mMotorNote) mMotorNote.textContent = `Mức ${this.power}/8 · ${this.motorDir > 0 ? 'chiều thuận' : 'chiều ngược'}`;

      const mOut = document.getElementById('m-out');
      if (mOut) {
        mOut.innerHTML = `${or.toFixed(1)} <small>vòng/phút</small>`;
        mOut.style.color = or > 200 ? THEME.bad : '';
      }

      const mSeg = document.getElementById('m-seg');
      const mSegNote = document.getElementById('m-seg-note');
      if (mSeg) {
        if (this.segStart !== null) {
          mSeg.innerHTML = `${(this.rev - this.segStart).toFixed(2)} <small>vòng</small>`;
          if (mSegNote) mSegNote.textContent = `Dự kiến: ${((or / 60) * (curBlock?.duration || 3)).toFixed(2)} vòng`;
        } else if (this.lastSeg !== null) {
          mSeg.innerHTML = `${this.lastSeg.toFixed(2)} <small>vòng</small>`;
          const whole = Math.round(this.lastSeg) >= 1 && Math.abs(this.lastSeg - Math.round(this.lastSeg)) < 0.04;
          if (mSegNote) mSegNote.textContent = whole ? 'Đoạn vừa rồi: Tròn vòng' : 'Đoạn vừa rồi: Dừng lệch chỗ';
        } else {
          mSeg.innerHTML = `— <small>vòng</small>`;
          if (mSegNote) mSegNote.textContent = 'Chưa qua khối Wait';
        }
      }

      const mStep = document.getElementById('m-step');
      const mStepNote = document.getElementById('m-step-note');
      if (mStep) {
        if (inBlock) {
          const dur = curBlock.type === 'melody' || curBlock.type === 'photo' ? 1.0
            : curBlock.type === 'wait_clear' ? this.blkT : (curBlock.duration || 3.0);
          const remain = Math.max(0, dur - this.blkT).toFixed(1);
          mStep.innerHTML = `${remain} <small>s</small>`;
          if (mStepNote) mStepNote.textContent = curBlock.name;
        } else {
          mStep.innerHTML = `— <small>s</small>`;
          if (mStepNote) mStepNote.textContent = this.running ? 'Sẵn sàng' : 'Dừng';
        }
      }

      // Calculation Card
      const rps = (this.motorRpm() / 60) * this.ratio();
      const [t1, t2] = GEAR;
      const curWaitBlock = this.prog.find(b => b.type === 'wait');
      const waitDur = curWaitBlock ? curWaitBlock.duration : 3;
      const revs = rps * waitDur;
      const whole = Math.abs(revs - Math.round(revs)) < 0.001 && revs >= 1;
      const half = Math.abs(Math.abs(revs - Math.round(revs)) - 0.5) < 0.001;

      const c1 = document.getElementById('calc-eq1');
      if (c1) c1.textContent = `Mức ${this.power}/8 → ${this.motorRpm()} v/phút × (${t1}/${t2}) = ${(this.motorRpm() * this.ratio()).toFixed(1)} v/phút (${rps.toFixed(2)} vòng/giây)`;

      const c2 = document.getElementById('calc-eq2');
      if (c2) c2.textContent = `Mỗi khối Wait ${waitDur}s: ${rps.toFixed(2)} × ${waitDur}s = ${revs.toFixed(2)} vòng`;

      const cv = document.getElementById('calc-verdict');
      if (cv) {
        if (whole) {
          cv.textContent = `Tròn vòng (${revs.toFixed(0)} vòng): Hết mỗi khối Wait, vệ tinh về đúng trạm mặt đất.`;
          cv.className = 'calc-verdict is-ok';
        } else if (half) {
          cv.textContent = `Dư nửa vòng (${revs.toFixed(1)} vòng): Hết đoạn Wait, vệ tinh nằm ở phía đối diện Trái Đất.`;
          cv.className = 'calc-verdict is-warn';
        } else if (revs < 1) {
          cv.textContent = `Chưa đủ 1 vòng (${revs.toFixed(2)} vòng): Vệ tinh dừng lưng chừng quỹ đạo.`;
          cv.className = 'calc-verdict is-warn';
        } else {
          cv.textContent = `Không tròn vòng (${revs.toFixed(2)} vòng): Vệ tinh lệch khỏi trạm mặt đất.`;
          cv.className = 'calc-verdict is-warn';
        }
      }
    }

    startLoop() {
      if (this.rafId) {
        cancelAnimationFrame(this.rafId);
        this.rafId = null;
      }
      this.loopActive = true;
      this.lastTimestamp = performance.now();
      const loop = (now) => {
        if (!this.loopActive) {
          this.rafId = null;
          return;
        }
        const dt = Math.min(0.05, (now - this.lastTimestamp) / 1000);
        this.lastTimestamp = now;
        this.t += dt;

        this.advance(dt);
        this.draw();
        this.updateUI();

        this.rafId = requestAnimationFrame(loop);
      };
      this.rafId = requestAnimationFrame(loop);
    }

    pauseLoop() {
      this.loopActive = false;
      if (this.rafId) {
        cancelAnimationFrame(this.rafId);
        this.rafId = null;
      }
    }

    resumeLoop() {
      if (this.loopActive) return;
      this.startLoop();
    }
  }

  SimulationEngine.GEO = GEO;
  SimulationEngine.ROCK = ROCK;
  SimulationEngine.ODDITIES = ODDITIES;
  SimulationEngine.VIEW = VIEW;
  window.SimulationEngine = SimulationEngine;
})();
