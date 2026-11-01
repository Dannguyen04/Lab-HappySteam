// Bộ mô phỏng Bài 12 – Đê ngăn lũ. Một động cơ quay trục, qua cặp bánh răng côn nâng/hạ cửa đê (0° nằm ngang – 90° dựng đứng).
// Cảm biến chạm: khối "Chờ nhấn nút" dừng chương trình cho tới khi học sinh nhấn (nút ✋ hoặc chạm cảnh).
// Tốc độ cửa đê: 11,25 độ/giây × mức công suất p (1–8): Quay chậm = mức 4 (45°/giây), Quay nhanh = mức 8 (90°/giây).
// Mỗi lần chạy có một đợt lũ: nước dâng tới đê ở giây 5, nước rút ở giây 9. Đê phải dựng đủ cao suốt lúc lũ qua.
//  - Bé: đê cần cao tối thiểu 40°.  - Nâng cao: mức lũ đổi mỗi lần (30°–75°), đê phải trong khoảng [mức lũ, mức lũ + 20°]
//    (đê quá cao thì thuyền cứu hộ không qua được), học sinh tự tính góc = 11,25 × mức × số giây.
// Cùng giao diện với RoverEngine (Bài 3) để js/app.js dùng chung: setProgram, start, stop, checkMissions,
// setAssemblyDone, setUpgrades, setAdvanced, pose3d, onEvent/onMissionUpdate/onActiveBlockUpdate.
(function () {
  'use strict';

  const DEG_PER_P = 11.25; // độ/giây cho mỗi mức công suất
  const MAX_ANGLE = 90;
  const NEED_KID = 40; // độ: đê tối thiểu ở chế độ Bé
  const SLACK_PRO = 20; // độ: đê được cao hơn mức lũ tối đa chừng này (Nâng cao)
  const LEVELS = [30, 45, 60, 75]; // mức lũ Nâng cao (độ nâng đê cần có)
  const FLOOD_AT = 5; // giây: nước dâng tới đê
  const FLOOD_END = 9; // giây: nước rút, hết lượt chạy
  const FLOOD_RISE = 2; // giây nước dâng từ 0 tới đỉnh
  const UP_OK = 20; // độ: mẫu quay chậm 0,5 giây nâng 22,5°; NV3 vẫn cần tối thiểu 40°
  // Chương trình mẫu trong giáo án: Start → lặp [chờ nhấn → quay chậm 0,5 s → dừng → chờ nhấn → đổi chiều → quay chậm 0,5 s → dừng]
  const SAMPLE = ['start', 'repeatStart', 'sensor_touch', 'motor:low', 'wait:0.5', 'stop', 'sensor_touch', 'motor_reverse', 'motor:low', 'wait:0.5', 'stop', 'repeatEnd'];
  const sig = b => (b.type === 'wait' ? 'wait:' + b.duration : b.type === 'motor' ? 'motor:' + (b.speed || 'low') : b.type);
  const rateOf = p => DEG_PER_P * p; // độ/giây

  class DamEngine {
    constructor() {
      this.prog = [];
      this.logs = [];
      this.t = 0;
      this.upgrades = new Set();
      this.advanced = false;
      this.assemblyDone = false;
      this.done = { m2: false, m3: false };
      this.wins = 0; // số lượt bảo vệ làng thành công
      this.winSigs = []; // chữ ký chương trình của các lượt thắng (NV4: lượt 2 phải khác lượt 1)
      this.m4 = false;
      this.bHits = new Set(); // NV5: các mức lũ đã chặn đúng
      this.level = NEED_KID; // độ đê cần có lúc này
      this.levelTimer = null;
      this.lastRun = null;
      this.loopActive = true;
      this.rafId = null;
      this.reset();
    }
    init() {
      this.startLoop();
    }
    resizeCanvas() {}

    reset() {
      clearTimeout(this.levelTimer);
      this.levelTimer = null;
      this.running = false;
      this.pc = 0;
      this.entered = false;
      this.blkT = 0;
      this.motorOn = false;
      this.power = 4;
      this.dir = 1; // +1 nâng đê, -1 hạ đê
      this.revNext = false; // khối "Đổi chiều quay" chỉ áp cho khối quay liền sau
      this.angle = 0; // độ nâng của cửa đê
      this.rev = 0; // góc trục động cơ (vòng) cho hình bánh quay
      this.touch = false; // có nhấn cảm biến chạm
      this.touchT = 0;
      this.waitingTouch = false;
      this.progDone = false;
      this.runT = 0; // giây kể từ lúc bấm chạy
      this.flooded = false; // nước tràn qua đê
      this.tooHigh = false; // Nâng cao: đê cao quá, thuyền cứu hộ không qua
      this.sawUp = false; // vòng nâng – hạ cho NV2
      this.maxPower = 0;
      this.maxAngle = 0;
      this.upgradeRun = false;
      if (this.onActiveBlockUpdate) this.onActiveBlockUpdate(-1);
    }

    emit(type, data) {
      if (this.onEvent) this.onEvent(type, data);
    }
    log(kind, text) {
      this.logs.unshift({ time: this.t.toFixed(1) + 's', kind, text });
      if (this.logs.length > 8) this.logs.length = 8;
      const el = document.getElementById('sim-log-list');
      if (el)
        el.innerHTML = this.logs
          .map(e => `<li class="log-item" data-kind="${e.kind}"><time class="log-time">${e.time}</time><span class="log-dot"></span><span class="log-text">${e.text}</span></li>`)
          .join('');
    }

    setProgram(blocks) {
      this.prog = blocks || [];
      this.stop(true);
      this.reset();
    }
    start() {
      this.reset();
      this.running = true;
      if (window.SFX) window.SFX.init();
      this.log('info', 'Bắt đầu chạy chương trình. Lũ sắp về!');
      this.emit('start');
    }
    stop(silent) {
      const was = this.running;
      this.running = false;
      this.motorOn = false;
      this.waitingTouch = false;
      if (this.onActiveBlockUpdate) this.onActiveBlockUpdate(-1);
      if (was && !silent) {
        this.log('info', 'Đã dừng chương trình.');
        this.emit('stop');
      }
    }
    // Học sinh nhấn cảm biến chạm (nút ✋ hoặc chạm cảnh); nhấn sớm quá thì nhớ trong 1,2 giây
    pressTouch() {
      this.touch = true;
      this.touchT = 1.2;
      this.emit('press');
    }
    putHand() {
      this.pressTouch();
    }

    setAssemblyDone(done) {
      if (this.assemblyDone === !!done) return;
      this.assemblyDone = !!done;
      this.checkMissions();
    }
    setUpgrades(list) {
      this.upgrades = new Set(list || []);
      this.checkMissions();
    }
    has(t) {
      return this.upgrades.has(t);
    }
    setAdvanced(on) {
      on = !!on;
      if (this.advanced === on) return;
      this.advanced = on;
      this.stop(true);
      this.reset();
      this.level = on ? this.pickLevel() : NEED_KID;
      this.emit('target', this.level);
      this.checkMissions();
    }
    pickLevel() {
      const choices = LEVELS.filter(c => c !== this.level && !this.bHits.has(c));
      const pool = choices.length ? choices : LEVELS.filter(c => c !== this.level);
      return pool[Math.floor(Math.random() * pool.length)];
    }
    // Độ nâng đê tối thiểu và tối đa chấp nhận được lúc lũ qua
    need() {
      return this.level;
    }
    maxOk() {
      return this.advanced ? this.level + SLACK_PRO : MAX_ANGLE;
    }
    // Mực nước 0–1 theo giây chạy (cho cảnh và tính toán)
    water() {
      if (!this.running) return 0;
      if (this.runT < FLOOD_AT - FLOOD_RISE) return 0;
      if (this.runT < FLOOD_AT) return (this.runT - (FLOOD_AT - FLOOD_RISE)) / FLOOD_RISE;
      if (this.runT <= FLOOD_END - 1) return 1;
      return Math.max(0, FLOOD_END - this.runT);
    }
    matchesSample() {
      return this.prog.length === SAMPLE.length && this.prog.every((b, i) => sig(b) === SAMPLE[i]);
    }
    speed() {
      return this.motorOn ? rateOf(this.power) * this.dir : 0; // độ/giây
    }
    // Tư thế cho sa bàn 3D: trục quay theo góc cửa đê (bánh răng 1 : 1)
    pose3d() {
      const a = (this.angle * Math.PI) / 180;
      return { output: a, motor: a };
    }

    // ---------- chạy chương trình ----------
    advance(dt) {
      if (this.touch && (this.touchT -= dt) <= 0) this.touch = false;
      if (!this.running) return;
      let budget = dt,
        guard = 0;
      while (this.running && !this.progDone && guard++ < 30) {
        if (this.pc >= this.prog.length) {
          this.progDone = true;
          this.motorOn = false;
          this.log('info', 'Chương trình đã chạy hết.');
          break;
        }
        const b = this.prog[this.pc];
        if (b.type === 'start' || b.type === 'repeatStart') {
          this.pc++;
          continue;
        }
        if (b.type === 'repeatEnd') {
          const r = this.prog.findIndex(x => x.type === 'repeatStart');
          this.pc = r < 0 ? this.pc + 1 : r + 1;
          continue;
        }
        if (b.type === 'motor' || b.type === 'motor_power') {
          this.power = b.type === 'motor_power' ? Math.max(1, Math.min(8, b.power || 8)) : b.speed === 'high' ? 8 : b.speed === 'medium' ? 6 : 4;
          this.dir = this.revNext ? -1 : 1;
          this.revNext = false;
          this.motorOn = true;
          this.maxPower = Math.max(this.maxPower, this.power);
          this.pc++;
          continue;
        }
        if (b.type === 'motor_reverse') {
          this.revNext = true;
          this.pc++;
          continue;
        }
        if (b.type === 'stop') {
          this.motorOn = false;
          this.pc++;
          continue;
        }
        if (b.type === 'sensor_touch') {
          if (!this.entered) {
            this.entered = true;
            this.waitingTouch = true;
            if (this.onActiveBlockUpdate) this.onActiveBlockUpdate(this.pc);
            this.log('warn', 'Cảm biến chạm đang chờ – hãy nhấn nút.');
            this.emit('waitTouch');
          }
          if (this.touch) {
            this.touch = false;
            this.waitingTouch = false;
            this.entered = false;
            this.log('ok', 'Cảm biến chạm được nhấn!');
            this.emit('pressed');
            this.pc++;
            continue;
          }
          this.integrate(budget);
          budget = 0;
          break;
        }
        // Khối tốn thời gian: wait, melody
        if (!this.entered) {
          this.entered = true;
          this.blkT = 0;
          if (this.onActiveBlockUpdate) this.onActiveBlockUpdate(this.pc);
          if (b.type === 'melody') {
            if (window.SFX) window.SFX.melody(b.tune);
            this.emit('melody', b.tune);
          }
        }
        const dur = b.type === 'melody' ? 1 : b.type === 'wait' ? b.duration || 3 : 0;
        const need = dur - this.blkT;
        if (budget < need) {
          this.blkT += budget;
          this.integrate(budget);
          budget = 0;
          break;
        }
        this.integrate(need);
        budget -= need;
        this.entered = false;
        this.pc++;
      }
      if (budget > 0 && this.running) this.integrate(budget);
    }

    // Cho thời gian trôi dt giây: cửa đê quay theo động cơ, đợt lũ diễn ra
    integrate(dt) {
      if (!this.running || dt <= 0) return;
      // chia nhỏ để bắt đúng thời điểm nước tới / rút
      let left = dt;
      while (left > 1e-9 && this.running) {
        const marks = [FLOOD_AT, FLOOD_END].filter(m => m > this.runT + 1e-9);
        const step = Math.min(left, marks.length ? marks[0] - this.runT : left);
        this.move(step);
        this.runT += step;
        left -= step;
        this.checkFlood();
        if (this.runT >= FLOOD_END - 1e-9) {
          this.finish();
          return;
        }
      }
    }
    move(dt) {
      if (!this.motorOn) return;
      const before = this.angle;
      this.angle = Math.max(0, Math.min(MAX_ANGLE, this.angle + this.speed() * dt));
      this.rev += (this.angle - before) / 360;
      this.maxAngle = Math.max(this.maxAngle, this.angle);
      if (this.upgrades.size && !this.upgradeRun && this.angle !== before) this.upgradeRun = true;
      if (this.angle >= UP_OK) this.sawUp = true;
      if (this.sawUp && this.angle <= 2 && this.matchesSample() && !this.done.m2) {
        this.done.m2 = true;
        this.log('ok', 'Chương trình mẫu chạy đúng: nhấn → nâng đê, nhấn lần nữa → hạ đê.');
        this.emit('sample');
        this.checkMissions();
      }
    }
    checkFlood() {
      if (this.runT < FLOOD_AT - 1e-9 || this.runT > FLOOD_END - 1e-9) return;
      if (this.angle < this.need() - 1e-6 && !this.flooded) {
        this.flooded = true;
        this.log('warn', `Nước tràn qua đê! Đê mới nâng ${Math.round(this.angle)}°, cần ít nhất ${this.need()}°.`);
        this.emit('flood', { angle: this.angle, need: this.need() });
      } else if (this.advanced && this.angle > this.maxOk() + 1e-6 && !this.tooHigh) {
        this.tooHigh = true;
        this.log('warn', `Đê cao ${Math.round(this.angle)}° – thuyền cứu hộ không qua được (tối đa ${this.maxOk()}°).`);
        this.emit('tooHigh', { angle: this.angle, max: this.maxOk() });
      }
    }

    // Hết đợt lũ: chấm kết quả
    finish() {
      this.running = false;
      this.motorOn = false;
      this.waitingTouch = false;
      if (this.onActiveBlockUpdate) this.onActiveBlockUpdate(-1);
      if (!this.flooded && !this.tooHigh) {
        this.done.m3 = true;
        this.wins++;
        this.winSigs.push(this.prog.map(sig).join('>'));
        if (this.wins >= 2 && this.winSigs[this.winSigs.length - 1] !== this.winSigs[0]) this.m4 = true;
        this.lastRun = { level: this.level, power: this.maxPower, angle: Math.round(this.maxAngle) };
        this.log('ok', 'Đê giữ vững, làng không bị ngập!');
        this.emit('saved', { level: this.level });
        if (this.advanced) {
          this.bHits.add(this.level);
          const next = this.pickLevel();
          this.levelTimer = setTimeout(() => {
            this.levelTimer = null;
            if (this.running || !this.advanced) return;
            this.level = next;
            this.emit('target', next);
          }, 1800);
        }
      } else {
        this.emit(this.flooded ? 'lost' : 'blocked');
      }
      this.emit('end');
      this.checkMissions();
    }

    checkMissions() {
      const m1 = this.assemblyDone;
      if (this.onMissionUpdate)
        this.onMissionUpdate({
          m1, m2: this.done.m2, m3: this.done.m3, m4: this.m4, m5: this.bHits.size >= 3,
          allDone: m1 && this.done.m2 && this.done.m3 && this.m4,
          upgrades: [...this.upgrades], lastRun: this.lastRun, bHits: [...this.bHits]
        });
    }

    updateUI() {
      const pill = document.getElementById('sim-status-pill');
      if (pill) {
        pill.textContent = this.running ? (this.waitingTouch ? 'Chờ nhấn nút' : 'Đang chạy') : 'Đã dừng';
        pill.dataset.k = this.running ? (this.waitingTouch ? 'warn' : 'ok') : 'muted';
      }
      const set = (id, html) => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = html;
      };
      const v = Math.abs(this.speed());
      set('m-speed', `${v.toFixed(1)} <small>độ/giây</small>`);
      set('m-speed-note', `Mức ${this.power}/8 · ${this.motorOn ? (this.dir > 0 ? 'nâng đê' : 'hạ đê') : 'động cơ dừng'}`);
      set('m-dist', `${Math.round(this.angle)} <small>độ</small>`);
      set('m-target', this.advanced ? `${this.level}–${this.maxOk()} <small>độ</small>` : `≥ ${this.level} <small>độ</small>`);
      set('m-target-note', this.advanced ? 'Đê trong khoảng này lúc lũ qua' : 'Đê cao ít nhất lúc lũ qua');
      set('m-sample', this.flooded ? 'Ngập' : this.running && this.runT >= FLOOD_AT ? 'Đang lũ' : 'An toàn');
      const desc = document.getElementById('sim-status-desc');
      if (desc)
        desc.textContent = this.waitingTouch
          ? 'Robot đang chờ: nhấn cảm biến chạm.'
          : this.running
            ? `Lũ sẽ tới sau ${Math.max(0, FLOOD_AT - this.runT).toFixed(1)} giây. Đê đang cao ${Math.round(this.angle)}°.`
            : 'Ghép khối lệnh rồi chạm Start để chạy.';
      const calc = document.getElementById('calc-eq1');
      if (calc) calc.textContent = 'Góc nâng đê = 11,25 × mức × số giây. Quay chậm (mức 4) 1 giây nâng 45°, quay nhanh (mức 8) 1 giây nâng 90°.';
      const calc2 = document.getElementById('calc-eq2');
      if (calc2) calc2.textContent = this.advanced ? `Mức lũ hiện tại cần đê nâng từ ${this.level}° tới ${this.maxOk()}°.` : `Mức lũ hiện tại cần đê nâng ít nhất ${this.level}°.`;
    }

    startLoop() {
      cancelAnimationFrame(this.rafId);
      this.loopActive = true;
      let last = performance.now();
      const loop = now => {
        if (!this.loopActive) return;
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        this.t += dt;
        this.advance(dt);
        this.updateUI();
        this.rafId = requestAnimationFrame(loop);
      };
      this.rafId = requestAnimationFrame(loop);
    }
    pauseLoop() {
      this.loopActive = false;
      cancelAnimationFrame(this.rafId);
    }
    resumeLoop() {
      if (!this.loopActive) this.startLoop();
    }
  }

  DamEngine.RATE = rateOf;
  DamEngine.FLOOD_AT = FLOOD_AT;
  DamEngine.FLOOD_END = FLOOD_END;
  DamEngine.NEED_KID = NEED_KID;
  window.DamEngine = DamEngine;
})();
