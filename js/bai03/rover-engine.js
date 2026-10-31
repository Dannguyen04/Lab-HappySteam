// Bộ mô phỏng Bài 3 – Robot thám hiểm Milo. Một động cơ quay trục xuyên qua hai bánh (không qua bánh răng):
// mức công suất p (1–8) → 150·p/8 vòng/phút ở bánh; bánh bán kính 2,5 cm nên mức 8 ≈ 39 cm/giây.
// Robot chỉ đi thẳng (tới/lùi) trên đường từ Trạm A (0 cm). Điểm B: 80 cm (chế độ Bé) hoặc đổi chỗ mỗi lần (Nâng cao).
// Cùng giao diện với SimulationEngine của Bài 9 để js/app.js dùng chung: setProgram, start, stop, checkMissions,
// setAssemblyDone, setUpgrades, setAdvanced, pose3d, onEvent/onMissionUpdate/onActiveBlockUpdate.
(function () {
  'use strict';

  const MAX_RPM = 150;
  const WHEEL_R = 2.5; // cm
  const TRACK_END = 150; // cm: đá lớn cuối đường – chạy quá là đụng
  const B_KID = 80;
  const TOL = { kid: 6, pro: 4 }; // cm: dừng trong ±TOL quanh B là đúng
  const B_CHOICES = [40, 50, 60, 70, 90, 100, 110, 120, 130];
  const FAST = 6; // từ mức này trở lên, không có thùng chở thì mẫu cây rơi
  // Chương trình mẫu trong phiếu học tập: Start → Wait for Obstacles → High Speed → Wait 3s → Stop
  const SAMPLE = ['start', 'sensor_obstacle', 'motor', 'wait:3', 'stop'];
  const sig = b => (b.type === 'wait' ? 'wait:' + b.duration : b.type === 'motor_power' ? 'motor' : b.type);
  const speedOf = p => (2 * Math.PI * WHEEL_R * MAX_RPM * p) / 8 / 60; // cm/giây

  class RoverEngine {
    constructor() {
      this.prog = [];
      this.logs = [];
      this.t = 0;
      this.upgrades = new Set();
      this.advanced = false;
      this.assemblyDone = false;
      this.done = { m2: false, m3: false, m4: false };
      this.bHits = new Set(); // NV5: các vị trí B đã dừng đúng
      this.bPos = B_KID;
      this.lastRun = null; // { power, secs } của lần chở mẫu thành công gần nhất
      this.loopActive = true;
      this.rafId = null;
      this.reset();
    }
    init() {
      this.startLoop();
    }
    resizeCanvas() {}

    reset() {
      this.running = false;
      this.pc = 0;
      this.entered = false;
      this.blkT = 0;
      this.motorOn = false;
      this.power = 8;
      this.dir = 1;
      this.x = 0; // cm từ Trạm A
      this.rev = 0; // số vòng bánh (cho hình bánh quay)
      this.hand = false; // có bàn tay trước cảm biến
      this.handUsed = false;
      this.waitingHand = false;
      this.sample = true; // mẫu cây đang trên robot
      this.crashed = false;
      this.maxPower = 0;
      this.driveT = 0;
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
      this.log('info', 'Bắt đầu chạy chương trình.');
      this.emit('start');
    }
    stop(silent) {
      const was = this.running;
      this.running = false;
      this.motorOn = false;
      this.waitingHand = false;
      if (this.onActiveBlockUpdate) this.onActiveBlockUpdate(-1);
      if (was && !silent) {
        this.log('info', 'Đã dừng chương trình.');
        this.emit('stop');
      }
    }
    // Học sinh đưa tay trước cảm biến (nút ✋ hoặc chạm cảnh); bàn tay rút về sau 1,2 giây
    putHand() {
      this.hand = true;
      this.handT = 1.2;
      this.emit('hand');
    }

    setAssemblyDone(done) {
      if (this.assemblyDone === !!done) return;
      this.assemblyDone = !!done;
      this.checkMissions();
    }
    setUpgrades(list) {
      this.upgrades = new Set(list || []);
      this.upgradeRun = false;
      const labels = { bin: 'Thùng chở mẫu', antenna: 'Ăng-ten, đèn', solar: 'Pin mặt trời', arm: 'Tay gắp' };
      const badge = document.getElementById('sim-active-upgrade-badge');
      if (badge) badge.textContent = this.upgrades.size ? [...this.upgrades].map(t => labels[t]).join(' · ') : 'Robot cơ bản';
      this.log('ok', this.upgrades.size ? 'Đã gắn: ' + [...this.upgrades].map(t => labels[t]).join(', ') : 'Robot cơ bản (chưa gắn thêm)');
    }
    has(t) {
      return this.upgrades.has(t);
    }
    // Nâng cao: điểm B đổi chỗ mỗi lần chở đúng, học sinh tự tính tốc độ × thời gian
    setAdvanced(on) {
      on = !!on;
      if (this.advanced === on) return;
      this.advanced = on;
      this.stop(true);
      this.reset();
      this.bPos = on ? this.pickB() : B_KID;
      this.emit('target', this.bPos);
      this.checkMissions();
    }
    pickB() {
      const choices = B_CHOICES.filter(c => c !== this.bPos && !this.bHits.has(c));
      return (choices.length ? choices : B_CHOICES)[Math.floor(Math.random() * (choices.length || B_CHOICES.length))];
    }
    tol() {
      return this.advanced ? TOL.pro : TOL.kid;
    }
    speed() {
      return this.motorOn ? speedOf(this.power) * this.dir : 0;
    }
    matchesSample() {
      return this.prog.length === SAMPLE.length && this.prog.every((b, i) => sig(b) === SAMPLE[i]);
    }
    // Tư thế cho sa bàn 3D: bánh quay theo quãng đường, cả robot dời theo trục +X (thu nhỏ để không ra khỏi khung)
    pose3d() {
      return { output: -this.rev * Math.PI * 2, motor: 0, offset: [this.x * 0.002, 0, 0] };
    }

    // ---------- chạy chương trình ----------
    advance(dt) {
      if (this.hand && (this.handT -= dt) <= 0) this.hand = false;
      if (!this.running) return;
      let budget = dt,
        guard = 0;
      while (this.running && guard++ < 30) {
        if (this.pc >= this.prog.length) {
          this.finish();
          break;
        }
        const b = this.prog[this.pc];
        if (b.type === 'start' || b.type === 'repeatStart') {
          this.pc++;
          continue;
        }
        if (b.type === 'repeatEnd') {
          const r = this.prog.findIndex(x => x.type === 'repeatStart');
          this.pc = r + 1;
          if (r < 0) this.pc++;
          continue;
        }
        if (b.type === 'motor' || b.type === 'motor_power') {
          this.power = b.type === 'motor_power' ? Math.max(1, Math.min(8, b.power || 8)) : b.speed === 'low' ? 4 : 8;
          this.motorOn = true;
          this.maxPower = Math.max(this.maxPower, this.power);
          if (this.upgrades.size && !this.upgradeRun) {
            this.upgradeRun = true;
            this.checkMissions();
          }
          this.pc++;
          continue;
        }
        if (b.type === 'motor_reverse') {
          this.dir = -this.dir;
          this.pc++;
          continue;
        }
        if (b.type === 'stop') {
          this.motorOn = false;
          this.pc++;
          continue;
        }
        if (b.type === 'sensor_obstacle') {
          if (!this.entered) {
            this.entered = true;
            this.waitingHand = true;
            if (this.onActiveBlockUpdate) this.onActiveBlockUpdate(this.pc);
            this.log('warn', 'Cảm biến siêu âm đang chờ vật cản – đưa tay trước mắt robot.');
            this.emit('waitHand');
          }
          if (this.hand) {
            this.waitingHand = false;
            this.handUsed = true;
            this.entered = false;
            this.log('ok', 'Cảm biến thấy bàn tay!');
            this.emit('seen');
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

    integrate(dt) {
      if (!this.motorOn || this.crashed) return;
      const v = this.speed();
      this.driveT += dt;
      // Chạy nhanh mà không có thùng chở: mẫu cây rơi khỏi nóc robot ngay khi tăng tốc
      if (this.sample && !this.has('bin') && this.power >= FAST) {
        this.sample = false;
        this.log('warn', `Mức ${this.power} nhanh quá – mẫu cây rơi khỏi robot!`);
        this.emit('drop', this.x);
      }
      this.x += v * dt;
      this.rev += (v * dt) / (2 * Math.PI * WHEEL_R);
      if (this.x < -10) this.x = -10;
      if (this.x >= TRACK_END) {
        this.x = TRACK_END;
        this.crashed = true;
        this.motorOn = false;
        this.log('warn', 'Robot chạy quá xa và đụng tảng đá cuối đường!');
        this.emit('crash');
        this.finish();
      }
    }

    // Hết chương trình: động cơ dừng, chấm kết quả chở mẫu
    finish() {
      this.running = false;
      this.motorOn = false;
      if (this.onActiveBlockUpdate) this.onActiveBlockUpdate(-1);
      if (this.matchesSample() && this.handUsed && !this.done.m2) {
        this.done.m2 = true;
        this.log('ok', 'Chương trình mẫu chạy đúng: thấy tay → chạy nhanh 3 giây → dừng.');
      }
      const off = this.x - this.bPos;
      if (this.crashed) {
        // đã báo crash
      } else if (Math.abs(off) <= this.tol()) {
        if (this.sample) {
          this.done.m3 = true;
          this.lastRun = { power: this.maxPower, secs: +this.driveT.toFixed(1), b: this.bPos };
          this.log('ok', `Đã chở mẫu cây tới điểm B (${Math.round(this.x)} cm)!`);
          this.emit('deliver', { x: this.x, b: this.bPos });
          if (this.advanced) {
            this.bHits.add(this.bPos);
            const next = this.pickB();
            setTimeout(() => {
              if (this.running) return;
              this.bPos = next;
              this.emit('target', next);
            }, 1800);
          }
        } else {
          this.log('warn', 'Tới đúng điểm B nhưng mẫu cây đã rơi dọc đường.');
          this.emit('emptyArrive', { x: this.x });
        }
      } else if (this.x > 1) {
        this.log('info', off < 0 ? `Dừng cách B ${Math.round(-off)} cm – chưa tới.` : `Dừng quá B ${Math.round(off)} cm.`);
        this.emit(off < 0 ? 'short' : 'over', { x: this.x, off });
      }
      this.emit('end');
      this.checkMissions();
    }

    checkMissions() {
      const m1 = this.assemblyDone;
      const m4 = this.upgrades.size > 0 && !!this.upgradeRun;
      if (this.onMissionUpdate)
        this.onMissionUpdate({
          m1, m2: this.done.m2, m3: this.done.m3, m4, m5: this.bHits.size >= 3,
          allDone: m1 && this.done.m2 && this.done.m3 && m4,
          upgrades: [...this.upgrades], lastRun: this.lastRun, bHits: [...this.bHits]
        });
    }

    updateUI() {
      const pill = document.getElementById('sim-status-pill');
      if (pill) {
        pill.textContent = this.running ? (this.waitingHand ? 'Chờ vật cản' : 'Đang chạy') : 'Đã dừng';
        pill.dataset.k = this.running ? (this.waitingHand ? 'warn' : 'ok') : 'muted';
      }
      const set = (id, html) => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = html;
      };
      const v = Math.abs(this.speed());
      set('m-speed', `${v.toFixed(1)} <small>cm/giây</small>`);
      set('m-speed-note', `Mức ${this.power}/8 · ${this.dir > 0 ? 'tiến' : 'lùi'}`);
      set('m-dist', `${Math.round(this.x)} <small>cm</small>`);
      set('m-target', `${this.bPos} <small>cm</small>`);
      set('m-target-note', `Dừng trong ±${this.tol()} cm`);
      set('m-sample', this.sample ? 'Còn' : 'Rơi');
      const desc = document.getElementById('sim-status-desc');
      if (desc)
        desc.textContent = this.waitingHand
          ? 'Robot đang chờ: đưa tay trước cảm biến siêu âm.'
          : this.running
            ? `Robot chạy ${v.toFixed(1)} cm/giây, đã đi ${Math.round(this.x)} cm.`
            : 'Ghép khối lệnh rồi chạm Start để chạy.';
      const calc = document.getElementById('calc-eq1');
      if (calc) calc.textContent = `Mức p → tốc độ = 39,3 × p / 8 cm/giây. Quãng đường = tốc độ × số giây.`;
      const calc2 = document.getElementById('calc-eq2');
      if (calc2) calc2.textContent = `Ví dụ mức 8, Wait 2 giây: 39,3 × 2 ≈ 79 cm. Điểm B đang ở ${this.bPos} cm.`;
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

  RoverEngine.SPEED = speedOf;
  RoverEngine.TRACK_END = TRACK_END;
  RoverEngine.B_KID = B_KID;
  window.RoverEngine = RoverEngine;
})();
