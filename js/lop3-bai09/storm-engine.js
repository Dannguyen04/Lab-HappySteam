// Bộ mô phỏng Lớp 3 · Bài 9 – Vượt bão (thuyền một động cơ M1 chạy bằng bánh xe, bánh răng truyền lực).
// Hành trình 30 m trên sa bàn: Low / Medium / High = mức 3 / 5 / 8 → 1,2 / 2,0 / 3,2 m/giây (thu nhỏ cho dễ nhìn, không phải tốc độ thật).
// Bãi đá ngầm (20–27 m): vào đó nhanh hơn mức Low (Medium nếu có đèn dẫn đường) thì va đá. Dừng motor thì thuyền đứng yên (neo/phanh).
// Nâng cao: bão kéo tới theo lượt (biết trước giờ): gió đẩy lùi thuyền đang chạy 1,4 m/giây; chạy High trong bão thì sóng lắc,
// góc nghiêng tăng dần đến lật (phao thăng bằng gấp đôi thời gian chịu). Cùng giao diện SimulationEngine để js/app.js dùng chung.
(function () {
  'use strict';

  const LEVEL = { low: 3, medium: 5, high: 8 };
  const NAME = { 3: 'chậm', 5: 'vừa', 8: 'nhanh' };
  const UNIT = 0.4; // m/giây cho mỗi mức: mức 3 → 1,2; mức 5 → 2,0; mức 8 → 3,2
  const MOTOR_RPM = 150; // động cơ mức 8
  const LEN = 30; // quãng đường từ bến xuất phát tới cảng
  const REEF = [20, 27]; // bãi đá ngầm
  const REEF_SAFE = 3; // mức tối đa qua đá ngầm: Low (Medium nếu có đèn)
  const WIND = 1.4; // m/giây gió đẩy lùi trong bão
  const WAVE_LIMIT = 1.5; // giây chạy High trong bão thì lật; phao gấp đôi
  const SAIL = 1.25; // buồm: nhanh hơn 25% khi trời quang
  const REEF_GRACE = 0.3; // giây va đá thì thuyền chìm
  // Nâng cao: [đến giây, thời tiết]
  const WEATHER = [
    [6, 'clear'],
    [14, 'storm'],
    [24, 'clear'],
    [32, 'storm'],
    [Infinity, 'clear']
  ];
  const SAMPLE = ['start', 'repeatStart', 'M1:low:cw', 'wait:3', 'M1:medium:cw', 'wait:3', 'M1:high:cw', 'wait:3', 'repeatEnd'];
  const sig = b => (b.type === 'motor' ? [b.port || 'M1', b.speed, b.dir || 'cw'].join(':') : b.type === 'wait' ? 'wait:' + (b.duration || 3) : b.type);

  class StormEngine {
    constructor() {
      this.prog = [];
      this.logs = [];
      this.t = 0;
      this.upgrades = new Set();
      this.advanced = false;
      this.assemblyDone = false;
      this.done = { m2: false, m3: false, m5: false };
      this.best = null; // lần cập cảng gần nhất { secs }
      this.rafId = null;
      this.loopActive = true;
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
      this.m = { M1: { on: false, power: 0, dir: 1 } };
      this.x = 0; // quãng đường đã đi (m)
      this.wheel = 0; // góc bánh xe (rad)
      this.runT = 0;
      this.loops = 0; // số lần chạy hết vòng lặp (NV2)
      this.reefT = 0;
      this.waveT = 0;
      this.crashed = false; // chìm hoặc lật
      this.crashWhy = '';
      this.arrived = false;
      this.stormSeen = false;
      this.warned = false;
      if (this.onActiveBlockUpdate) this.onActiveBlockUpdate(-1);
    }
    emit(type, data) {
      if (this.onEvent) this.onEvent(type, data);
    }
    log(kind, text) {
      this.logs.unshift({ time: this.runT.toFixed(1) + 's', kind, text });
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
      this.emit('weather', this.weather());
    }
    stop(silent) {
      const was = this.running;
      this.running = false;
      this.m.M1.on = false;
      if (this.onActiveBlockUpdate) this.onActiveBlockUpdate(-1);
      if (was && !silent) {
        this.log('info', 'Đã dừng chương trình.');
        this.emit('stop');
      }
    }
    press() {}
    setAssemblyDone(done) {
      if (this.assemblyDone === !!done) return;
      this.assemblyDone = !!done;
      this.checkMissions();
    }
    setUpgrades(list) {
      this.upgrades = new Set(list || []);
      this.upgradeRun = false;
      const labels = { float: 'Phao thăng bằng', light: 'Đèn dẫn đường', sail: 'Buồm' };
      const badge = document.getElementById('sim-active-upgrade-badge');
      if (badge) badge.textContent = this.upgrades.size ? [...this.upgrades].map(t => labels[t]).join(' · ') : 'Thuyền cơ bản';
      this.log('ok', this.upgrades.size ? 'Đã gắn: ' + [...this.upgrades].map(t => labels[t]).join(', ') : 'Thuyền cơ bản');
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
      this.checkMissions();
    }
    // Thời tiết hiện tại: { kind, next } – chế độ Bé luôn trời quang
    weather(t = this.runT) {
      if (!this.advanced) return { kind: 'clear', next: Infinity };
      const w = WEATHER.find(x => t < x[0]);
      return { kind: w[1], next: w[0] - t };
    }
    reefSafe() {
      return REEF_SAFE + (this.has('light') ? 2 : 0);
    }
    waveLimit() {
      return WAVE_LIMIT * (this.has('float') ? 2 : 1);
    }
    // Tốc độ thuyền trên sa bàn (m/giây, có dấu); gió đẩy lùi khi thuyền đang chạy trong bão
    velocity() {
      const a = this.m.M1;
      if (!a.on || this.crashed || this.arrived) return 0;
      const calm = this.weather().kind === 'clear';
      return a.power * UNIT * a.dir * (calm && this.has('sail') ? SAIL : 1) - (calm ? 0 : WIND);
    }
    // Vòng/phút của bánh xe (có dấu theo chiều quay)
    wheelRpm() {
      const a = this.m.M1;
      return a.on && !this.crashed ? (MOTOR_RPM * a.power * a.dir) / 8 : 0;
    }
    inReef() {
      return this.x >= REEF[0] && this.x < REEF[1];
    }
    // Góc nghiêng (độ) như cảm biến góc nghiêng: tăng khi chạy High trong bão, lật ở 45°
    tiltDeg() {
      return this.crashed && this.crashWhy === 'wave' ? 45 : Math.min(45, (45 * this.waveT) / this.waveLimit());
    }
    matchesSample() {
      return this.prog.length === SAMPLE.length && this.prog.every((b, i) => sig(b) === SAMPLE[i]);
    }
    // Tư thế cho sa bàn 3D: 'output' = bánh xe quay (M1)
    pose3d() {
      return { output: this.wheel };
    }

    advance(dt) {
      if (!this.running) return;
      let budget = dt,
        guard = 0;
      while (this.running && guard++ < 40) {
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
          this.loops++;
          if (this.loops === 1 && this.matchesSample() && !this.done.m2) {
            this.done.m2 = true;
            this.log('ok', 'Đúng chương trình mẫu: thuyền chạy chậm, vừa, nhanh theo thứ tự.');
            this.emit('sampleDone');
            this.checkMissions();
          }
          const r = this.prog.findIndex(x => x.type === 'repeatStart');
          this.pc = r < 0 ? this.pc + 1 : r + 1;
          continue;
        }
        if (b.type === 'motor' || b.type === 'motor_power') {
          const mo = this.m.M1;
          mo.power = b.type === 'motor_power' ? Math.max(1, Math.min(8, b.power || 8)) : LEVEL[b.speed] || 8;
          mo.dir = b.dir === 'ccw' ? -1 : 1;
          mo.on = true;
          this.log('info', `M1: thuyền chạy ${NAME[mo.power] || 'mức ' + mo.power}${mo.dir < 0 ? ', lùi' : ''}.`);
          if (this.upgrades.size && !this.upgradeRun) {
            this.upgradeRun = true;
            this.checkMissions();
          }
          this.pc++;
          continue;
        }
        if (b.type === 'motor_reverse') {
          this.m.M1.dir = -this.m.M1.dir;
          this.pc++;
          continue;
        }
        if (b.type === 'stop') {
          if (this.m.M1.on) this.log('info', 'Động cơ dừng – thuyền đứng yên tại chỗ.');
          this.m.M1.on = false;
          this.pc++;
          continue;
        }
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
      if (!this.running || dt <= 0) return;
      // chia nhỏ để không "nhảy" qua bãi đá khi chạy nhanh
      const n = Math.max(1, Math.ceil(dt / 0.02));
      for (let i = 0; i < n && this.running; i++) this.tick(dt / n);
    }
    tick(dt) {
      const before = this.weather();
      this.runT += dt;
      const w = this.weather();
      if (w.kind !== before.kind) {
        this.log(w.kind === 'storm' ? 'warn' : 'info', w.kind === 'storm' ? 'Bão tới! Gió đẩy lùi thuyền, sóng lớn.' : 'Trời quang – có thể chạy tiếp.');
        this.emit('weather', w);
        if (w.kind === 'storm') this.stormSeen = true;
      }
      if (this.crashed || this.arrived) return;
      const mo = this.m.M1,
        prevX = this.x;
      this.x = Math.max(0, this.x + this.velocity() * dt);
      this.wheel += (this.wheelRpm() / 60) * Math.PI * 2 * dt;
      // Cảnh báo sớm: sắp tới bãi đá mà còn chạy quá nhanh
      if (!this.warned && mo.on && mo.power > this.reefSafe() && this.x >= REEF[0] - 3 && this.x < REEF[0]) {
        this.warned = true;
        this.log('warn', 'Sắp tới bãi đá ngầm! Chạy chậm lại (Low) hoặc dừng trước khi vào.');
        this.emit('warn', 'reef');
      }
      if (this.inReef() && mo.on && mo.power > this.reefSafe()) {
        this.reefT += dt;
        if (this.reefT >= REEF_GRACE) return this.sink('reef', 'Thuyền chạy quá nhanh vào bãi đá ngầm và va đá!');
      } else this.reefT = 0;
      // Sóng: chạy High trong bão thì nghiêng dần đến lật
      if (w.kind === 'storm' && mo.on && mo.power >= 8) {
        this.waveT += dt;
        if (this.waveT >= this.waveLimit()) return this.sink('wave', 'Chạy nhanh trong bão, sóng lắc làm thuyền lật!');
      } else this.waveT = Math.max(0, this.waveT - dt * 0.5);
      if (this.x >= LEN && prevX < LEN) this.arrive();
    }
    sink(why, text) {
      this.crashed = true;
      this.crashWhy = why;
      this.log('warn', text);
      this.emit('crash', why);
    }
    arrive() {
      this.arrived = true;
      this.x = LEN;
      this.best = { secs: +this.runT.toFixed(1) };
      this.done.m3 = true;
      if (this.advanced && this.stormSeen) this.done.m5 = true;
      this.log('ok', `Thuyền cập cảng sau ${this.runT.toFixed(1)} giây!`);
      this.emit('arrive', { secs: this.runT, storm: this.advanced && this.stormSeen });
      this.finish();
    }

    finish() {
      this.running = false;
      this.m.M1.on = false;
      if (this.onActiveBlockUpdate) this.onActiveBlockUpdate(-1);
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
          upgrades: [...this.upgrades], best: this.best
        });
    }

    updateUI() {
      const pill = document.getElementById('sim-status-pill');
      if (pill) {
        pill.textContent = this.crashed ? (this.crashWhy === 'wave' ? 'Thuyền lật' : 'Thuyền chìm') : this.arrived ? 'Đã cập cảng' : this.running ? 'Đang chạy' : 'Đã dừng';
        pill.dataset.k = this.crashed ? 'bad' : this.running || this.arrived ? 'ok' : 'muted';
      }
      const set = (id, html) => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = html;
      };
      const w = this.weather(),
        v = this.velocity();
      set('m-speed', `${Math.abs(v).toFixed(1)} <small>m/giây</small>`);
      set('m-speed-note', this.m.M1.on ? 'M1 ' + (NAME[this.m.M1.power] || 'mức ' + this.m.M1.power) + (this.m.M1.dir < 0 ? ' · lùi' : '') + (w.kind === 'storm' ? ' · gió ngược' : '') : 'M1 dừng');
      set('m-dist', `${this.x.toFixed(1)} <small>/ ${LEN} m</small>`);
      set('m-dist-note', this.inReef() ? 'Đang qua bãi đá ngầm' : this.x >= LEN ? 'Đã tới cảng' : 'Trên biển');
      set('m-tilt', `${Math.round(this.tiltDeg())} <small>°</small>`);
      set('m-tilt-note', this.tiltDeg() >= 30 ? 'Nguy hiểm – sắp lật' : this.tiltDeg() > 0 ? 'Đang nghiêng' : 'Thăng bằng');
      set('m-weather', { clear: 'Trời quang', storm: 'Bão' }[w.kind]);
      set('m-weather-note', this.advanced && Number.isFinite(w.next) ? `Đổi sau ${w.next.toFixed(0)} giây` : 'Ổn định');
      const desc = document.getElementById('sim-status-desc');
      if (desc)
        desc.textContent = this.crashed
          ? 'Thuyền không tới được cảng. Sửa chương trình rồi chạy lại.'
          : this.arrived
            ? 'Thuyền đã cập cảng an toàn!'
            : this.running
              ? `Đã đi ${this.x.toFixed(1)}/${LEN} m.`
              : 'Ghép khối lệnh rồi chạm Start để chạy.';
      const c1 = document.getElementById('calc-eq1');
      if (c1) c1.textContent = `Quãng đường = tốc độ × thời gian. Low ${(3 * UNIT).toFixed(1)} · Medium ${(5 * UNIT).toFixed(1)} · High ${(8 * UNIT).toFixed(1)} m/giây: chạy High 5 giây đi được ${(8 * UNIT * 5).toFixed(0)} m, Low 5 giây chỉ ${(3 * UNIT * 5).toFixed(0)} m.`;
      const c2 = document.getElementById('calc-eq2');
      if (c2) c2.textContent = this.advanced
        ? `Bão theo giờ: quang 0–6 giây, bão 6–14, quang 14–24, bão 24–32. Trong bão gió đẩy lùi ${WIND} m/giây (Low sẽ trôi ngược, Medium còn ${(5 * UNIT - WIND).toFixed(1)} m/giây); chạy High quá ${this.waveLimit()} giây thì lật – hoặc Stop và chờ bão tan.`
        : `Bãi đá ngầm ở ${REEF[0]}–${REEF[1]} m: chạy chậm (tối đa ${this.has('light') ? 'Medium' : 'Low'}) mới qua được. Cảng ở ${LEN} m.`;
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

  StormEngine.WEATHER = WEATHER;
  StormEngine.LIMITS = { LEN, REEF, WIND };
  window.StormEngine = StormEngine;
})();
