// Bộ mô phỏng Bài 2 – Xe đua "Động cơ". Một động cơ quay thẳng trục sau (không bánh răng): mức p (1–8) → 150·p/8 vòng/phút,
// bánh Ø50 mm nên mức 8 ≈ 39,3 cm/giây trên đường bằng. Xe chạy dọc đường đua nhìn ngang có dốc, vị trí x tính bằng cm từ vạch xuất phát.
// Cùng giao diện với RoverEngine (Bài 3) để js/app.js dùng chung: setProgram, start, stop, checkMissions,
// setAssemblyDone, setUpgrades, setAdvanced, pose3d, onEvent/onMissionUpdate/onActiveBlockUpdate.
(function () {
  'use strict';

  const MAX_RPM = 150;
  const WHEEL_R = 2.5; // cm
  const speedOf = p => (2 * Math.PI * WHEEL_R * MAX_RPM * p) / 8 / 60; // cm/giây
  const SLIDE_SPEED = 30; // cm/giây: xe trôi ngược xuống chân dốc
  const STALL_REACH = 8; // cm: xe leo được chừng này trên dốc rồi mới chịu thua

  // Đường đua (cm từ vạch xuất phát). kind: flat (phẳng), up (lên dốc), down (xuống dốc)
  const TRACKS = {
    kid: {
      sections: [{ from: 0, to: 50, kind: 'flat' }, { from: 50, to: 90, kind: 'up' }, { from: 90, to: 220, kind: 'flat' }],
      finish: 150, park: [160, 180], wall: 220
    },
    pro: {
      sections: [
        { from: 0, to: 40, kind: 'flat' }, { from: 40, to: 80, kind: 'up' }, { from: 80, to: 100, kind: 'flat' },
        { from: 100, to: 140, kind: 'down' }, { from: 140, to: 230, kind: 'flat' }
      ],
      finish: 150, park: [190, 210], wall: 240
    }
  };
  const sectionAt = (track, x) => {
    const s = track.sections;
    for (const sec of s) if (x >= sec.from && x < sec.to) return sec;
    return x < 0 ? s[0] : s[s.length - 1];
  };
  // Chương trình mẫu trong phiếu học tập: Start → High Speed → Wait 3s → Stop
  const SAMPLE = ['start', 'motor:high', 'wait:3', 'stop'];
  const sig = b => (b.type === 'wait' ? 'wait:' + b.duration : b.type === 'motor' ? 'motor:' + b.speed : b.type);
  const NAMES = { wing: 'Cánh gió đuôi', bigwheel: 'Bánh to hơn', nose: 'Mũi xe nhọn', lights: 'Đèn pha + số xe' };

  class RaceEngine {
    constructor() {
      this.prog = [];
      this.logs = [];
      this.t = 0;
      this.upgrades = new Set();
      this.advanced = false;
      this.assemblyDone = false;
      this.done = { m2: false, m3: false, m5: false };
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
      this.running = false;
      this.pc = 0;
      this.entered = false;
      this.blkT = 0;
      this.motorOn = false;
      this.power = 8;
      this.dir = 1;
      this.x = 0;
      this.rev = 0;
      this.crashed = false;
      this.flipped = false;
      this.stalled = false; // không đủ lực leo dốc
      this.sliding = false;
      this.maxPower = 0;
      this.driveT = 0;
      this.curSpeed = 0;
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
      this.log('info', 'Xe vào vạch xuất phát, bắt đầu chạy chương trình.');
      this.emit('start');
    }
    stop(silent) {
      const was = this.running;
      this.running = false;
      this.motorOn = false;
      if (this.onActiveBlockUpdate) this.onActiveBlockUpdate(-1);
      if (was && !silent) {
        this.log('info', 'Đã dừng chương trình.');
        this.emit('stop');
      }
    }

    setAssemblyDone(done) {
      if (this.assemblyDone === !!done) return;
      this.assemblyDone = !!done;
      this.checkMissions();
    }
    setUpgrades(list) {
      this.upgrades = new Set(list || []);
      this.upgradeRun = false;
      const names = [...this.upgrades].map(t => NAMES[t] || t);
      const badge = document.getElementById('sim-active-upgrade-badge');
      if (badge) badge.textContent = names.length ? names.join(' · ') : 'Xe cơ bản';
      this.log('ok', names.length ? 'Đã gắn: ' + names.join(', ') : 'Xe cơ bản (chưa gắn thêm)');
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
      this.emit('track', this.track());
      this.checkMissions();
    }
    track() {
      return this.advanced ? TRACKS.pro : TRACKS.kid;
    }
    section() {
      return sectionAt(this.track(), this.x);
    }
    // Công suất tối thiểu để leo dốc: cánh gió bám tốt hơn (3), bánh to cần khỏe (6), mặc định 5
    minClimbPower() {
      return this.has('bigwheel') ? 6 : this.has('wing') ? 3 : 5;
    }
    // Hệ số tốc độ theo đoạn đường và gói nâng cấp
    factor(kind) {
      const flat = (this.has('bigwheel') ? 1.3 : 1) * (this.has('nose') ? 1.1 : 1);
      if (kind === 'flat') return flat;
      if (kind === 'down') return 1.6 * flat;
      let up = this.has('wing') ? 0.7 : 0.6; // mũi nhọn chỉ tác dụng trên đường phẳng
      if (this.has('bigwheel')) up *= 0.75; // bánh to leo dốc chậm hơn: 0,6 → 0,45
      return up;
    }
    speed() {
      return this.motorOn ? speedOf(this.power) * this.dir * this.factor(this.section().kind) : 0;
    }
    matchesSample() {
      return this.prog.length === SAMPLE.length && this.prog.every((b, i) => sig(b) === SAMPLE[i]);
    }
    parked() {
      const [a, b] = this.track().park;
      return !this.crashed && !this.flipped && this.x >= a && this.x <= b && this.x >= this.track().finish;
    }
    // Tư thế cho sa bàn 3D: bánh quay theo quãng đường, cả xe dời theo trục +Z (đầu xe)
    pose3d() {
      return { output: this.rev * Math.PI * 2, motor: 0, offset: [0, 0, this.x * 0.002] };
    }

    // ---------- chạy chương trình ----------
    advance(dt) {
      if (!this.running) {
        this.slideStep(dt);
        return;
      }
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
          this.power = b.type === 'motor_power' ? Math.max(1, Math.min(8, b.power || 8)) : b.speed === 'low' ? 4 : b.speed === 'medium' ? 6 : 8;
          this.motorOn = true;
          this.stalled = false;
          this.maxPower = Math.max(this.maxPower, this.power);
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

    // Xe không đủ lực hoặc động cơ dừng giữa dốc: trôi ngược xuống chân dốc
    slideStep(dt) {
      if (!this.sliding) return;
      const sec = this.section();
      if (sec.kind !== 'up' || this.x <= sec.from + 1e-6) {
        this.sliding = false;
        return;
      }
      const d = Math.min(SLIDE_SPEED * dt, this.x - sec.from);
      this.x -= d;
      this.rev -= d / (2 * Math.PI * WHEEL_R);
      if (this.x <= sec.from + 1e-6) this.sliding = false;
    }

    integrate(dt) {
      if (this.crashed || this.flipped) return;
      if (this.sliding) {
        this.slideStep(dt);
        return;
      }
      if (!this.motorOn) {
        if (this.section().kind === 'up' && this.x > this.section().from + 1e-6) this.sliding = true;
        this.curSpeed = 0;
        return;
      }
      const T = this.track();
      let left = dt;
      this.driveT += dt;
      // Đi từng đoạn nhỏ để đổi tốc độ đúng chỗ đổi dốc
      for (let guard = 0; guard < 40 && left > 1e-9; guard++) {
        const sec = this.section();
        if (sec.kind === 'down' && this.power >= 6 && this.dir > 0) {
          this.flipped = true;
          this.motorOn = false;
          this.log('warn', `Mức ${this.power} xuống dốc nhanh quá – xe lật!`);
          this.emit('flip', this.x);
          this.finish();
          return;
        }
        if (sec.kind === 'up' && this.dir > 0 && this.power < this.minClimbPower() && this.x >= sec.from + STALL_REACH - 1e-6) {
          this.stalled = true;
          this.motorOn = false;
          this.sliding = true;
          this.log('warn', 'Xe không đủ sức leo dốc – trôi ngược xuống chân dốc.');
          this.emit('slide', this.x);
          return;
        }
        const v = this.speed();
        this.curSpeed = Math.abs(v);
        if (v === 0) break;
        const edge = v > 0 ? (this.x < sec.to ? sec.to : Infinity) : sec.from; // biên đoạn đường theo hướng đi
        const toEdge = (edge - this.x) / v;
        const step = Math.min(left, toEdge > 1e-9 ? toEdge : 1e-6);
        // Giới hạn không vượt STALL_REACH khi chưa đủ lực
        let adv = v * step;
        if (sec.kind === 'up' && v > 0 && this.power < this.minClimbPower()) adv = Math.min(adv, sec.from + STALL_REACH - this.x);
        this.x += adv;
        this.rev += adv / (2 * Math.PI * WHEEL_R);
        if (adv !== 0 && this.upgrades.size && !this.upgradeRun) {
          this.upgradeRun = true;
          this.checkMissions();
        }
        left -= step;
        if (adv === 0 && toEdge > 1e-9) break;
        if (this.x < 0) {
          this.x = 0;
          break;
        }
        if (this.x >= T.wall) {
          this.x = T.wall;
          this.crashed = true;
          this.motorOn = false;
          this.log('warn', 'Xe chạy quá xa và đâm vào tường lốp!');
          this.emit('crash');
          this.finish();
          return;
        }
      }
    }

    // Hết chương trình: động cơ dừng, chấm kết quả
    finish() {
      this.running = false;
      this.motorOn = false;
      if (this.section().kind === 'up' && this.x > this.section().from + 1e-6) {
        this.sliding = true;
        if (!this.stalled) {
          this.stalled = true;
          this.log('warn', 'Xe dừng giữa dốc nên trôi ngược xuống.');
          this.emit('slide', this.x);
        }
      }
      if (this.onActiveBlockUpdate) this.onActiveBlockUpdate(-1);
      if (this.matchesSample() && !this.crashed && !this.flipped && !this.done.m2) {
        this.done.m2 = true;
        this.log('ok', 'Chương trình mẫu chạy tới cuối: Quay nhanh → chờ 3 giây → dừng.');
      }
      const T = this.track();
      const [a, b] = T.park;
      if (this.crashed || this.flipped) {
        // đã báo
      } else if (this.parked()) {
        // NV3 đạt khi đỗ trong ô đỗ ở cả hai đường; đường Nâng cao còn đạt thêm NV5
        this.done.m3 = true;
        if (this.advanced) this.done.m5 = true;
        this.lastRun = { power: this.maxPower, secs: +this.driveT.toFixed(1), x: Math.round(this.x), advanced: this.advanced };
        this.log('ok', `Xe đỗ gọn trong ô đỗ (${Math.round(this.x)} cm)!`);
        this.emit('park', { x: this.x });
      } else if (this.x < T.finish) {
        this.log('info', `Xe dừng ở ${Math.round(this.x)} cm – chưa qua vạch đích (${T.finish} cm).`);
        this.emit('short', { x: this.x, off: this.x - a, finish: T.finish });
      } else if (this.x < a) {
        this.log('info', `Xe qua vạch đích nhưng còn cách ô đỗ ${Math.round(a - this.x)} cm.`);
        this.emit('short', { x: this.x, off: this.x - a, finish: T.finish });
      } else {
        this.log('info', `Xe đỗ quá ô ${Math.round(this.x - b)} cm.`);
        this.emit('over', { x: this.x, off: this.x - b });
      }
      this.emit('end');
      this.checkMissions();
    }

    checkMissions() {
      const m1 = this.assemblyDone;
      const m4 = this.upgrades.size > 0 && !!this.upgradeRun;
      if (this.onMissionUpdate)
        this.onMissionUpdate({
          m1, m2: this.done.m2, m3: this.done.m3, m4, m5: this.done.m5,
          allDone: m1 && this.done.m2 && this.done.m3 && m4,
          upgrades: [...this.upgrades], lastRun: this.lastRun
        });
    }

    updateUI() {
      const pill = document.getElementById('sim-status-pill');
      if (pill) {
        pill.textContent = this.running ? 'Đang chạy' : this.flipped ? 'Xe lật' : 'Đã dừng';
        pill.dataset.k = this.running ? 'ok' : this.flipped ? 'warn' : 'muted';
      }
      const set = (id, html) => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = html;
      };
      const sec = this.section();
      const T = this.track();
      const v = this.motorOn ? this.curSpeed || Math.abs(this.speed()) : 0;
      const kindName = { flat: 'Phẳng', up: 'Lên dốc', down: 'Xuống dốc' }[sec.kind];
      set('m-speed', `${v.toFixed(1)} <small>cm/giây</small>`);
      set('m-speed-note', `Mức ${this.power}/8 · ${this.dir > 0 ? 'tiến' : 'lùi'}`);
      set('m-dist', `${Math.round(this.x)} <small>cm</small>`);
      set('m-section', kindName);
      set('m-park', `${T.park[0]}–${T.park[1]} <small>cm</small>`);
      set('m-park-note', `Vạch đích ${T.finish} cm`);
      const desc = document.getElementById('sim-status-desc');
      if (desc)
        desc.textContent = this.running
          ? `Xe chạy ${v.toFixed(1)} cm/giây, đã đi ${Math.round(this.x)} cm (${kindName.toLowerCase()}).`
          : 'Ghép khối lệnh rồi chạm Start để xe chạy.';
      const calc = document.getElementById('calc-eq1');
      if (calc) calc.textContent = `Đường phẳng: tốc độ = 39,3 × p / 8 cm/giây. Lên dốc chậm hơn, xuống dốc nhanh hơn.`;
      const calc2 = document.getElementById('calc-eq2');
      if (calc2) calc2.textContent = `Quãng đường = tốc độ × số giây. Mức 8 chạy 2 giây trên đường phẳng: 39,3 × 2 ≈ 79 cm. Ô đỗ nằm ở ${T.park[0]}–${T.park[1]} cm.`;
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

  RaceEngine.SPEED = speedOf;
  RaceEngine.TRACKS = TRACKS;
  RaceEngine.sectionAt = sectionAt;
  window.RaceEngine = RaceEngine;
})();
