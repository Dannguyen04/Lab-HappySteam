// Bộ mô phỏng Bài 10 – Cối xoay gió có nút bấm (cảm biến chạm). Động cơ quay thẳng cụm cánh quạt:
// Low / Medium / High = mức 3 / 5 / 8 → 56 / 94 / 150 vòng/phút. Cánh quay sinh điện sạc pin; pin có điện thì nhà sáng đèn.
// Khối "Chờ nhấn nút" (sensor_touch) chỉ đi tiếp khi học sinh nhấn nút đỏ (nút trên cảnh hoặc phím cách).
// Nâng cao: thời tiết đổi theo thời gian chạy – gió nhẹ → mạnh → bão → nhẹ; quay trong bão quá lâu thì gãy cánh.
// Cùng giao diện với SimulationEngine của Bài 9 để js/app.js dùng chung.
(function () {
  'use strict';

  const MAX_RPM = 150;
  const LEVEL = { low: 3, medium: 5, high: 8 };
  const NAME = { 3: 'chậm', 5: 'vừa', 8: 'nhanh' };
  const CHARGE = 12; // %/giây ở 150 vòng/phút, gió nhẹ (đầy pin ≈ 8 giây khi quay nhanh)
  // Nâng cao: [đến giây, thời tiết, hệ số gió]
  const WEATHER = [
    [8, 'light', 1],
    [14, 'strong', 1.6],
    [20, 'storm', 0],
    [Infinity, 'light', 1]
  ];
  const STORM_LIMIT = 1.5; // giây quay trong bão thì gãy cánh
  // Chương trình mẫu trong giáo án: Start, Repeat, (Chờ nhấn → Chậm → Chờ nhấn → Vừa → Chờ nhấn → Nhanh → Chờ nhấn → Dừng), Repeat End
  const SAMPLE = ['start', 'repeatStart', 'sensor_touch', 'motor:low', 'sensor_touch', 'motor:medium', 'sensor_touch', 'motor:high',
    'sensor_touch', 'stop', 'repeatEnd'];
  const sig = b => (b.type === 'motor' ? 'motor:' + b.speed : b.type === 'wait' ? 'wait:' + b.duration : b.type);
  const BOOST = { long: 1.4, more: 1.3, tail: 1.1 };

  class WindEngine {
    constructor() {
      this.prog = [];
      this.logs = [];
      this.t = 0;
      this.upgrades = new Set();
      this.advanced = false;
      this.assemblyDone = false;
      this.done = { m2: false, m3: false, m5: false };
      this.best = null; // lần sạc đầy gần nhất { secs }
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
      this.motorOn = false;
      this.power = 0;
      this.dir = 1;
      this.rev = 0;
      this.runT = 0;
      this.battery = 0; // 0–100 %
      this.pressed = false;
      this.pressT = 0;
      this.waitingPress = false;
      this.levels = new Set(); // các tốc độ đã chạy trong lần này (NV2)
      this.stopsAfterHigh = false;
      this.stormT = 0;
      this.broken = false;
      this.stormSeen = false;
      this.fullAnnounced = false;
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
      this.motorOn = false;
      this.waitingPress = false;
      if (this.onActiveBlockUpdate) this.onActiveBlockUpdate(-1);
      if (was && !silent) {
        this.log('info', 'Đã dừng chương trình.');
        this.emit('stop');
      }
    }
    // Học sinh nhấn nút đỏ (cảm biến chạm)
    press() {
      this.pressed = true;
      this.pressT = 0.3;
      this.emit('press');
    }
    setAssemblyDone(done) {
      if (this.assemblyDone === !!done) return;
      this.assemblyDone = !!done;
      this.checkMissions();
    }
    setUpgrades(list) {
      this.upgrades = new Set(list || []);
      this.upgradeRun = false;
      const labels = { long: 'Cánh dài', more: '6 cánh', light: 'Đèn trên đỉnh', tail: 'Đuôi lái gió' };
      const badge = document.getElementById('sim-active-upgrade-badge');
      if (badge) badge.textContent = this.upgrades.size ? [...this.upgrades].map(t => labels[t]).join(' · ') : 'Cối xoay gió cơ bản';
      this.log('ok', this.upgrades.size ? 'Đã gắn: ' + [...this.upgrades].map(t => labels[t]).join(', ') : 'Cối xoay gió cơ bản');
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
    // Thời tiết hiện tại: { kind, wind } – chế độ Bé luôn gió nhẹ
    weather(t = this.runT) {
      if (!this.advanced) return { kind: 'light', wind: 1, next: Infinity };
      const w = WEATHER.find(x => t < x[0]);
      return { kind: w[1], wind: w[2], next: w[0] - t };
    }
    rpm() {
      return this.motorOn && !this.broken ? (MAX_RPM * this.power) / 8 : 0;
    }
    boost() {
      let k = 1;
      for (const u of this.upgrades) k *= BOOST[u] || 1;
      return k;
    }
    // %/giây đang sạc vào pin
    chargeRate() {
      const w = this.weather();
      return (this.rpm() / MAX_RPM) * CHARGE * w.wind * this.boost() * (this.advanced ? 0.35 : 1); // Nâng cao: pin to hơn, phải sạc qua cả cơn bão
    }
    matchesSample() {
      return this.prog.length === SAMPLE.length && this.prog.every((b, i) => sig(b) === SAMPLE[i]);
    }
    pose3d() {
      return { output: this.rev * Math.PI * 2, motor: 0 };
    }

    advance(dt) {
      if (this.pressed && (this.pressT -= dt) <= 0) this.pressed = false;
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
          const r = this.prog.findIndex(x => x.type === 'repeatStart');
          this.pc = r < 0 ? this.pc + 1 : r + 1;
          continue;
        }
        if (b.type === 'motor' || b.type === 'motor_power') {
          this.power = b.type === 'motor_power' ? Math.max(1, Math.min(8, b.power || 8)) : LEVEL[b.speed] || 8;
          this.motorOn = true;
          this.levels.add(this.power);
          this.log('info', `Cánh quạt quay ${NAME[this.power] || 'mức ' + this.power} (${(MAX_RPM * this.power) / 8} vòng/phút).`);
          this.emit('speed', this.power);
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
          if (this.motorOn) this.log('info', 'Cánh quạt dừng.');
          if (this.levels.has(3) && this.levels.has(5) && this.levels.has(8)) this.stopsAfterHigh = true;
          this.motorOn = false;
          this.emit('speed', 0);
          this.pc++;
          if (this.stopsAfterHigh && this.matchesSample() && !this.done.m2) {
            this.done.m2 = true;
            this.log('ok', 'Đúng chương trình mẫu: chậm → vừa → nhanh → dừng sau mỗi lần nhấn nút.');
            this.emit('sampleDone');
            this.checkMissions();
          }
          continue;
        }
        if (b.type === 'sensor_touch' || b.type === 'sensor_obstacle') {
          if (!this.entered) {
            this.entered = true;
            this.waitingPress = true;
            this.pressed = false; // cần một lần nhấn mới cho mỗi khối
            if (this.onActiveBlockUpdate) this.onActiveBlockUpdate(this.pc);
          }
          if (this.pressed) {
            this.pressed = false;
            this.waitingPress = false;
            this.entered = false;
            this.pc++;
            continue;
          }
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
      if (!this.running) return;
      const before = this.weather();
      this.runT += dt;
      const w = this.weather();
      if (w.kind !== before.kind) {
        this.log(w.kind === 'storm' ? 'warn' : 'info', { light: 'Gió nhẹ.', strong: 'Gió mạnh – sạc nhanh hơn!', storm: 'Bão tới! Hãy cho cánh quạt dừng.' }[w.kind]);
        this.emit('weather', w);
        if (w.kind === 'storm') this.stormSeen = true;
      }
      const rpm = this.rpm();
      this.rev += ((rpm / 60) * dt * this.dir);
      if (w.kind === 'storm' && rpm > 0) {
        this.stormT += dt;
        if (this.stormT >= STORM_LIMIT && !this.broken) {
          this.broken = true;
          this.log('warn', 'Bão làm gãy cánh quạt vì cánh vẫn quay!');
          this.emit('broken');
        }
      }
      if (this.broken) return;
      this.battery = Math.min(100, this.battery + this.chargeRate() * dt);
      if (this.battery >= 100 && !this.fullAnnounced) {
        this.fullAnnounced = true;
        this.best = { secs: +this.runT.toFixed(1) };
        this.done.m3 = true;
        if (this.advanced && this.stormSeen) this.done.m5 = true;
        this.log('ok', `Pin đầy sau ${this.runT.toFixed(1)} giây – ngôi nhà sáng đèn!`);
        this.emit('full', { secs: this.runT, storm: this.advanced && this.stormSeen });
        this.checkMissions();
      }
    }

    finish() {
      this.running = false;
      this.motorOn = false;
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
        pill.textContent = this.running ? (this.waitingPress ? 'Chờ nhấn nút' : 'Đang chạy') : 'Đã dừng';
        pill.dataset.k = this.running ? (this.waitingPress ? 'warn' : 'ok') : 'muted';
      }
      const set = (id, html) => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = html;
      };
      const w = this.weather();
      set('m-rpm', `${Math.round(this.rpm())} <small>vòng/phút</small>`);
      set('m-rpm-note', this.broken ? 'Cánh quạt gãy' : this.motorOn ? 'Quay ' + (NAME[this.power] || 'mức ' + this.power) : 'Đang dừng');
      set('m-battery', `${Math.floor(this.battery)} <small>%</small>`);
      set('m-rate', `${this.chargeRate().toFixed(1)} <small>%/giây</small>`);
      set('m-weather', { light: 'Gió nhẹ', strong: 'Gió mạnh', storm: 'Bão' }[w.kind]);
      set('m-weather-note', this.advanced && Number.isFinite(w.next) ? `Đổi sau ${w.next.toFixed(0)} giây` : 'Ổn định');
      const desc = document.getElementById('sim-status-desc');
      if (desc)
        desc.textContent = this.waitingPress
          ? 'Chương trình đang chờ: nhấn nút đỏ trên cối xoay gió.'
          : this.running
            ? `Cánh quạt ${Math.round(this.rpm())} vòng/phút, pin ${Math.floor(this.battery)}%.`
            : 'Ghép khối lệnh rồi chạm Start để chạy.';
      const c1 = document.getElementById('calc-eq1');
      if (c1) c1.textContent = 'Quay càng nhanh, cối xoay gió sinh càng nhiều điện: nhanh 150 vòng/phút ≈ 12 %/giây khi gió nhẹ.';
      const c2 = document.getElementById('calc-eq2');
      if (c2) c2.textContent = this.advanced ? 'Gió mạnh sạc nhanh gấp 1,6 lần; khi bão phải cho cánh quạt dừng để không gãy.' : 'Cánh dài, thêm cánh, đuôi lái gió giúp sạc nhanh hơn.';
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

  WindEngine.WEATHER = WEATHER;
  window.WindEngine = WindEngine;
})();
