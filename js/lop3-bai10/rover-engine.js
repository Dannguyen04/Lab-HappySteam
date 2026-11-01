// Bộ mô phỏng Lớp 3 · Bài 10 – Robot thám hiểm sao Hỏa (xe thám hiểm 1 động cơ + cảm biến sóng âm).
// Động cơ chạy tới (cw) / lùi (ccw); Low/Medium/High = mức 3/5/8 → 7,5 / 12,5 / 20 cm/giây trên sa bàn (thu nhỏ, không phải tốc độ thật).
// Cảm biến sóng âm đo khoảng cách tới tảng đá phía trước: khối "Chờ vật cản" chờ cho tới khi đá nằm trong tầm 15 cm (ăng-ten: gấp đôi).
// Thu mẫu: xe đứng yên 2 giây khi đá cách 3–tầm cảm biến (đủ gần, chưa chạm). Đâm vào đá (≤ 3 cm) thì hỏng. Xe có đà: chạy nhanh phanh xa hơn.
// Nâng cao: bão bụi (biết trước giờ) – cảm biến "mù" (gắn đèn pha thì vẫn thấy) và xe chạy trong bão bị lún cát,
// chạy quá lâu thì kẹt (bánh gai gấp đôi thời gian).
// Cùng giao diện với SimulationEngine của Bài 9 để js/app.js dùng chung.
(function () {
  'use strict';

  const LEVEL = { low: 3, medium: 5, high: 8 };
  const NAME = { 3: 'chậm', 5: 'vừa', 8: 'nhanh' };
  const CMS = 2.5; // cm/giây cho mỗi mức tốc độ
  const ACCEL = 25; // cm/giây² (tăng/giảm tốc)
  const REACH = 15; // cm: tầm cảm biến sóng âm
  const NEAR = 3; // cm: gần hơn thế là đâm vào đá
  const SCAN = 2; // giây đứng yên để thu mẫu
  const STUCK_LIMIT = 1.5; // giây chạy trong bão bụi thì lún kẹt
  const TRACK = 170; // cm chiều dài đường thám hiểm
  const SOUND = 343; // m/giây
  const ROCKS = [
    { x: 40, name: 'đá đỏ' },
    { x: 90, name: 'đá xám' },
    { x: 140, name: 'đá xanh' }
  ];
  // Nâng cao: [đến giây, thời tiết]
  const WEATHER = [
    [10, 'clear'],
    [18, 'storm'],
    [Infinity, 'clear']
  ];
  const SAMPLE = ['start', 'repeatStart', 'motor:low:cw', 'sensor_obstacle', 'stop', 'wait:3', 'repeatEnd'];
  const sig = b => (b.type === 'motor' ? ['motor', b.speed, b.dir || 'cw'].join(':') : b.type === 'wait' ? 'wait:' + b.duration : b.type);

  class RoverEngine {
    constructor() {
      this.prog = [];
      this.logs = [];
      this.t = 0;
      this.upgrades = new Set();
      this.advanced = false;
      this.assemblyDone = false;
      this.done = { m2: false, m3: false, m5: false };
      this.best = null; // lần thu đủ mẫu gần nhất { secs }
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
      this.motor = { on: false, power: 0, dir: 1 };
      this.x = 0; // cm từ căn cứ
      this.v = 0; // cm/giây (có dấu)
      this.wheel = 0; // góc bánh xe (rad)
      this.runT = 0;
      this.rocks = ROCKS.map(r => ({ ...r, scanT: 0, got: false }));
      this.loops = 0;
      this.stuckT = 0;
      this.crashed = false;
      this.crashWhy = '';
      this.stormSeen = false;
      this.hintT = -10;
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
      this.motor.on = false;
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
      const labels = { dish: 'Ăng-ten', lamp: 'Đèn pha', wheels: 'Bánh gai' };
      const badge = document.getElementById('sim-active-upgrade-badge');
      if (badge) badge.textContent = this.upgrades.size ? [...this.upgrades].map(t => labels[t]).join(' · ') : 'Robot cơ bản';
      this.log('ok', this.upgrades.size ? 'Đã gắn: ' + [...this.upgrades].map(t => labels[t]).join(', ') : 'Robot cơ bản');
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
    reach() {
      return REACH * (this.has('dish') ? 2 : 1);
    }
    stuckLimit() {
      return STUCK_LIMIT * (this.has('wheels') ? 2 : 1);
    }
    // Cảm biến "mù" trong bão bụi, trừ khi có đèn pha
    blind() {
      return this.weather().kind === 'storm' && !this.has('lamp');
    }
    nextRock() {
      return this.rocks.find(r => !r.got && r.x >= this.x - 0.01) || null;
    }
    // Khoảng cách (cm) tới tảng đá phía trước, null nếu hết đá
    distance() {
      const r = this.nextRock();
      return r ? Math.max(0, r.x - this.x) : null;
    }
    // Khoảng cách cảm biến đọc được (null khi mù / ngoài tầm)
    reading() {
      const d = this.distance();
      return d === null || this.blind() || d > this.reach() ? null : d;
    }
    got() {
      return this.rocks.filter(r => r.got).length;
    }
    targetSpeed() {
      return this.motor.on && !this.crashed ? this.motor.power * CMS * this.motor.dir : 0;
    }
    matchesSample() {
      return this.prog.length === SAMPLE.length && this.prog.every((b, i) => sig(b) === SAMPLE[i]);
    }
    // Tư thế cho sa bàn 3D: bánh xe quay theo quãng đường đi được
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
            this.log('ok', 'Đúng chương trình mẫu: chạy tới, cảm biến thấy đá thì dừng và thu mẫu.');
            this.emit('sampleDone');
            this.checkMissions();
          }
          const r = this.prog.findIndex(x => x.type === 'repeatStart');
          this.pc = r < 0 ? this.pc + 1 : r + 1;
          continue;
        }
        if (b.type === 'motor' || b.type === 'motor_power') {
          const mo = this.motor;
          mo.power = b.type === 'motor_power' ? Math.max(1, Math.min(8, b.power || 8)) : LEVEL[b.speed] || 8;
          if (b.type === 'motor') mo.dir = b.dir === 'ccw' ? -1 : 1;
          mo.on = true;
          this.log('info', `Động cơ chạy ${NAME[mo.power] || 'mức ' + mo.power}${mo.dir < 0 ? ', lùi lại' : ', tiến tới'}.`);
          if (this.upgrades.size && !this.upgradeRun) {
            this.upgradeRun = true;
            this.checkMissions();
          }
          this.pc++;
          continue;
        }
        if (b.type === 'motor_reverse') {
          this.motor.dir = -this.motor.dir;
          this.pc++;
          continue;
        }
        if (b.type === 'stop') {
          if (this.motor.on) this.log('info', 'Động cơ dừng – xe trượt thêm một đoạn rồi đứng yên.');
          this.motor.on = false;
          this.pc++;
          continue;
        }
        if (b.type === 'sensor_obstacle') {
          if (!this.entered) {
            this.entered = true;
            this.blkT = 0;
            if (this.onActiveBlockUpdate) this.onActiveBlockUpdate(this.pc);
            this.log('info', `Cảm biến sóng âm đang dò: chờ đá trong tầm ${this.reach()} cm.`);
          }
          const d = this.reading();
          if (d !== null) {
            this.log('warn', `Cảm biến thấy đá cách ${d.toFixed(0)} cm phía trước!`);
            this.emit('seen', this.nextRock());
            this.entered = false;
            this.pc++;
            continue;
          }
          this.blkT += budget;
          this.integrate(budget);
          budget = 0;
          break;
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
      // chia nhỏ để không "nhảy" qua tảng đá khi chạy nhanh
      const n = Math.max(1, Math.ceil(dt / 0.02));
      for (let i = 0; i < n && this.running; i++) this.tick(dt / n);
    }
    tick(dt) {
      const before = this.weather();
      this.runT += dt;
      const w = this.weather();
      if (w.kind !== before.kind) {
        this.log(w.kind === 'storm' ? 'warn' : 'info', w.kind === 'storm' ? 'Bão bụi! Cảm biến bị mù, hãy dừng xe chờ bão tan.' : 'Bão bụi đã tan – chạy tiếp được.');
        this.emit('weather', w);
        if (w.kind === 'storm') this.stormSeen = true;
      }
      if (this.crashed) return;
      // đà: tốc độ tiến dần tới tốc độ đích
      const tv = this.targetSpeed(),
        dv = ACCEL * dt;
      this.v = Math.abs(tv - this.v) <= dv ? tv : this.v + Math.sign(tv - this.v) * dv;
      this.x = Math.max(0, Math.min(TRACK, this.x + this.v * dt));
      this.wheel += (this.v * dt) / 3;
      const moving = Math.abs(this.v) > 0.5;
      // Bão bụi: chạy trong bão thì lún cát
      if (w.kind === 'storm' && moving) {
        this.stuckT += dt;
        if (this.stuckT >= this.stuckLimit()) return this.fail('stuck', 'Xe chạy trong bão bụi bị lún cát, kẹt cứng! Hãy dừng xe khi bão tới.');
      } else this.stuckT = Math.max(0, this.stuckT - dt);
      const r = this.nextRock();
      if (!r) return;
      const d = r.x - this.x;
      if (d <= NEAR && this.v > 0) return this.fail('hit', 'Xe đâm vào tảng đá! Dùng khối “Chờ vật cản” rồi dừng xe trước khi tới đá.');
      if (!moving && !this.motor.on && !this.blind() && d > NEAR && d <= this.reach()) {
        r.scanT += dt;
        if (r.scanT >= SCAN) {
          r.got = true;
          this.log('ok', `Đã thu mẫu ${r.name}! (${this.got()}/3)`);
          this.emit('sample', { rock: r, count: this.got() });
          if (this.got() === ROCKS.length) this.allCollected();
        }
      } else {
        r.scanT = 0;
        // Gợi ý: xe đang chạy mà chưa dừng (mỗi 4 giây tối đa 1 lần)
        if (moving && d > NEAR && d <= this.reach() && this.motor.on && this.runT - this.hintT > 4) {
          this.hintT = this.runT;
          this.emit('miss', 'moving');
        }
      }
    }
    fail(why, text) {
      this.crashed = true;
      this.crashWhy = why;
      this.v = 0;
      this.log('warn', text);
      this.emit('crash', why);
    }
    allCollected() {
      this.best = { secs: +this.runT.toFixed(1) };
      this.done.m3 = true;
      if (this.advanced && this.stormSeen) this.done.m5 = true;
      this.log('ok', `Đã thu đủ 3 mẫu đá sau ${this.runT.toFixed(1)} giây!`);
      this.emit('allSaved', { secs: this.runT, storm: this.advanced && this.stormSeen });
      this.checkMissions();
    }

    finish() {
      this.running = false;
      this.motor.on = false;
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
        pill.textContent = this.crashed ? (this.crashWhy === 'stuck' ? 'Xe bị kẹt' : 'Xe bị hỏng') : this.running ? 'Đang thám hiểm' : 'Đã dừng';
        pill.dataset.k = this.crashed ? 'bad' : this.running ? 'ok' : 'muted';
      }
      const set = (id, html) => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = html;
      };
      const w = this.weather(),
        d = this.reading();
      set('m-speed', `${Math.abs(this.v).toFixed(1)} <small>cm/giây</small>`);
      set('m-speed-note', this.motor.on ? 'Động cơ ' + (NAME[this.motor.power] || 'mức ' + this.motor.power) + (this.motor.dir < 0 ? ' · lùi' : '') : 'Động cơ dừng');
      set('m-dist', d === null ? '-- <small>cm</small>' : `${d.toFixed(0)} <small>cm</small>`);
      set('m-dist-note', this.blind() ? 'Bão bụi – cảm biến mù' : d === null ? 'Chưa thấy đá trong tầm' : d <= NEAR + 3 ? 'Rất gần!' : 'Thấy đá phía trước');
      set('m-saved', `${this.got()} <small>/ 3</small>`);
      set('m-weather', { clear: 'Trời quang', storm: 'Bão bụi' }[w.kind]);
      set('m-weather-note', this.advanced && Number.isFinite(w.next) ? `Đổi sau ${w.next.toFixed(0)} giây` : 'Ổn định');
      const desc = document.getElementById('sim-status-desc');
      if (desc)
        desc.textContent = this.crashed
          ? 'Xe thám hiểm gặp sự cố. Sửa chương trình rồi chạy lại.'
          : this.running
            ? `Đã thu ${this.got()}/3 mẫu. Xe cách căn cứ ${this.x.toFixed(0)} cm.`
            : 'Ghép khối lệnh rồi chạm Start để chạy.';
      const c1 = document.getElementById('calc-eq1');
      if (c1) {
        const dd = Math.min(this.distance() === null ? REACH : this.distance(), this.reach());
        c1.textContent = `Cảm biến phát sóng âm (${SOUND} m/giây) rồi chờ tiếng dội. Đá cách ${dd.toFixed(0)} cm → sóng đi và về ${(2 * dd).toFixed(0)} cm, mất ${(((2 * dd) / 100 / SOUND) * 1000).toFixed(2)} mili giây.`;
      }
      const c2 = document.getElementById('calc-eq2');
      if (c2) c2.textContent = this.advanced
        ? `Bão bụi lúc 10–18 giây: cảm biến ${this.has('lamp') ? 'vẫn thấy nhờ đèn pha' : 'bị mù'}; xe chạy quá ${this.stuckLimit()} giây trong bão sẽ lún kẹt.`
        : `Thu mẫu khi đá cách ${NEAR}–${this.reach()} cm và xe đứng yên ${SCAN} giây. Xe chạy nhanh phải phanh xa hơn.`;
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

  RoverEngine.WEATHER = WEATHER;
  RoverEngine.ROCKS = ROCKS;
  RoverEngine.LIMITS = { NEAR, REACH, TRACK };
  window.RoverEngine = RoverEngine;
})();
