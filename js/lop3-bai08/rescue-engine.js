// Bộ mô phỏng Lớp 3 · Bài 8 – Giải cứu máy bay (giàn bay hai động cơ).
// M1 (đỉnh tháp) quay cần ngang → máy bay bay vòng quanh đài điều khiển. Low/Medium/High = mức 4/6/8 → 16/24/32 vòng/phút trên cảnh
// (chậm lại cho dễ nhìn, không phải tốc độ thật). M2 (chân tháp) quay trục vít 1 mối ăn bánh răng 24 răng (giảm 24 lần)
// → tay quay 1×2 → cụm trên bập bênh: độ cao = ½ − ½·cos(góc tay quay), 0 = thấp nhất, 1 = cao nhất. Trục vít tự hãm:
// M2 dừng thì máy bay giữ nguyên độ cao. Cứu người: máy bay đi ngang người gặp nạn khi bay THẤP (≤ 0,3) và CHẬM (M1 Low).
// Nâng cao: bão kéo tới theo lượt (biết trước giờ) – khi bão phải ở trên mây (độ cao ≥ 0,6), ở dưới mây quá lâu thì rơi.
// Kế thừa LessonEngine chung để js/app.js dùng cùng giao diện mô phỏng.
(function () {
  'use strict';

  const LEVEL = { low: 4, medium: 6, high: 8 }; // mức chuẩn chung (js/lesson-engine.js)
  const NAME = { 4: 'chậm', 6: 'vừa', 8: 'nhanh' };
  const ARM_RPM = 32; // vòng/phút của máy bay trên cảnh ở mức 8
  const MOTOR_RPM = 150; // động cơ mức 8
  const WORM = 24; // trục vít 1 mối + bánh răng 24 răng
  const LOW = 0.3, // độ cao tối đa để thả thang
    CLOUD = 0.6; // trong bão phải bay cao hơn mức này
  const SLOW = 4; // mức tốc độ M1 tối đa để thả thang (Low)
  const CATCH = 0.2; // rad: máy bay cách người gặp nạn ≤ 11° là ở ngay trên
  // Người gặp nạn: góc trên vòng bay (rad, 0 = bên phải, chiều kim đồng hồ trên cảnh), trong sương mù hay không
  const VICTIMS = [
    { a: 0.9, fog: false, where: 'trên thuyền' },
    { a: 2.9, fog: true, where: 'trong sương mù trên núi' },
    { a: 4.6, fog: false, where: 'trên bè cứu sinh' }
  ];
  const RADAR = 0.55, // rad quét phía trước máy bay; gói radar gấp đôi
    STORM_LIMIT = 1.5; // giây dưới mây trong bão thì rơi; gói cánh dài gấp đôi
  // Nâng cao: [đến giây, thời tiết]
  const WEATHER = [
    [9, 'clear'],
    [17, 'storm'],
    [29, 'clear'],
    [37, 'storm'],
    [Infinity, 'clear']
  ];
  const SAMPLE = ['start', 'repeatStart', 'M1:low:cw', 'M2:low:cw', 'wait:3', 'M1:high:cw', 'M2:high:cw', 'wait:3',
    'M1:low:ccw', 'M2:low:ccw', 'wait:3', 'M1:high:ccw', 'M2:high:ccw', 'wait:3', 'repeatEnd'];
  const sig = b => (b.type === 'motor' ? [b.port || 'M1', b.speed, b.dir || 'cw'].join(':') : b.type === 'wait' ? 'wait:' + b.duration : b.type);
  const TAU = Math.PI * 2;
  const wrap = a => ((a % TAU) + TAU) % TAU;

  class RescueEngine {
    constructor() {
      this.prog = [];
      this.logs = [];
      this.t = 0;
      this.upgrades = new Set();
      this.advanced = false;
      this.assemblyDone = false;
      this.done = { m2: false, m3: false, m5: false };
      this.best = null; // lần cứu đủ gần nhất { secs }
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
      this.m = { M1: { on: false, power: 0, dir: 1 }, M2: { on: false, power: 0, dir: 1 } };
      this.angle = 0; // góc máy bay trên vòng bay (rad)
      this.crank = Math.PI; // tay quay: bắt đầu ở độ cao cao nhất
      this.runT = 0;
      this.victims = VICTIMS.map(v => ({ ...v, seen: false, saved: false, ladder: 0 }));
      this.loops = 0; // số lần chạy hết vòng lặp (NV2)
      this.belowT = 0;
      this.crashed = false;
      this.stormSeen = false;
      this.hint = { high: -10, fast: -10 };
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
      this.m.M1.on = this.m.M2.on = false;
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
      const labels = { radar: 'Radar', light: 'Đèn pha', wings: 'Cánh dài' };
      const badge = document.getElementById('sim-active-upgrade-badge');
      if (badge) badge.textContent = this.upgrades.size ? [...this.upgrades].map(t => labels[t]).join(' · ') : 'Máy bay cơ bản';
      this.log('ok', this.upgrades.size ? 'Đã gắn: ' + [...this.upgrades].map(t => labels[t]).join(', ') : 'Máy bay cơ bản');
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
    // Độ cao 0 (thấp nhất) … 1 (cao nhất)
    altitude() {
      return 0.5 - 0.5 * Math.cos(this.crank);
    }
    // vòng/phút của máy bay quanh tháp (có dấu theo chiều quay)
    armRpm() {
      const a = this.m.M1;
      return a.on && !this.crashed ? (ARM_RPM * a.power * a.dir) / 8 : 0;
    }
    // vòng/phút của tay quay (sau trục vít)
    crankRpm() {
      const b = this.m.M2;
      return b.on && !this.crashed ? (MOTOR_RPM * b.power * b.dir) / 8 / WORM : 0;
    }
    radarReach() {
      return RADAR * (this.has('radar') ? 2 : 1);
    }
    stormLimit() {
      return STORM_LIMIT * (this.has('wings') ? 2 : 1);
    }
    saved() {
      return this.victims.filter(v => v.saved).length;
    }
    matchesSample() {
      return this.prog.length === SAMPLE.length && this.prog.every((b, i) => sig(b) === SAMPLE[i]);
    }
    // Tư thế cho sa bàn 3D: 'output' = cần quay (M1), 'tilt' = cụm trên nghiêng (M2, phóng đại ±8° cho dễ thấy)
    pose3d() {
      return { output: this.angle, tilt: (this.altitude() - 0.5) * 0.28 };
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
            this.log('ok', 'Đúng chương trình mẫu: máy bay bay chậm, nhanh, rồi đổi chiều – và lên xuống theo M2.');
            this.emit('sampleDone');
            this.checkMissions();
          }
          const r = window.LessonEngine.loopStart(this.prog, this.pc);
          this.pc = r < 0 ? this.pc + 1 : r + 1;
          continue;
        }
        if (b.type === 'motor' || b.type === 'motor_power') {
          const port = b.port || 'M1',
            mo = this.m[port];
          mo.power = b.type === 'motor_power' ? Math.max(1, Math.min(8, b.power || 8)) : LEVEL[b.speed] || 8;
          mo.dir = b.dir === 'ccw' ? -1 : 1;
          mo.on = true;
          this.log('info', port === 'M1'
            ? `M1: máy bay bay ${NAME[mo.power] || 'mức ' + mo.power}${mo.dir < 0 ? ', ngược chiều' : ''}.`
            : `M2: trục vít quay ${NAME[mo.power] || 'mức ' + mo.power}${mo.dir < 0 ? ' ngược' : ''} – máy bay đổi độ cao.`);
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
          if (this.m.M1.on || this.m.M2.on) this.log('info', 'Hai động cơ dừng – trục vít giữ máy bay ở độ cao này.');
          this.m.M1.on = this.m.M2.on = false;
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
      // chia nhỏ để không "nhảy" qua người gặp nạn khi bay nhanh
      const n = Math.max(1, Math.ceil(dt / 0.02));
      for (let i = 0; i < n && this.running; i++) this.tick(dt / n);
    }
    tick(dt) {
      const before = this.weather();
      this.runT += dt;
      const w = this.weather();
      if (w.kind !== before.kind) {
        this.log(w.kind === 'storm' ? 'warn' : 'info', w.kind === 'storm' ? 'Bão tới! Bay lên trên mây.' : 'Trời quang – có thể hạ thấp để cứu người.');
        this.emit('weather', w);
        if (w.kind === 'storm') this.stormSeen = true;
      }
      if (this.crashed) return;
      this.angle = wrap(this.angle + (this.armRpm() / 60) * TAU * dt);
      this.crank += (this.crankRpm() / 60) * TAU * dt;
      const alt = this.altitude(),
        slow = this.m.M1.on && this.m.M1.power <= SLOW;
      // Bão: dưới mây quá lâu thì máy bay rung lắc rơi
      if (w.kind === 'storm' && alt < CLOUD) {
        this.belowT += dt;
        if (this.belowT >= this.stormLimit()) {
          this.crashed = true;
          this.log('warn', 'Máy bay bay thấp trong bão, rung lắc mạnh và phải hạ cánh khẩn cấp!');
          this.emit('crash');
          return;
        }
      } else this.belowT = Math.max(0, this.belowT - dt);
      for (const v of this.victims) {
        if (v.saved) continue;
        const diff = Math.abs(((v.a - this.angle + Math.PI * 3) % TAU) - Math.PI);
        const ahead = wrap((v.a - this.angle) * Math.sign(this.armRpm() || 1));
        // Radar quét phía trước máy bay; người trong sương mù chỉ hiện khi có đèn pha hoặc máy bay ở ngay trên
        if (!v.seen && ((ahead < this.radarReach() && (!v.fog || this.has('light'))) || diff < CATCH)) {
          v.seen = true;
          this.log('info', `Radar thấy người gặp nạn ${v.where}!`);
          this.emit('found', v);
        }
        if (diff >= CATCH || !this.m.M1.on) continue;
        const lowEnough = alt <= LOW * (v.fog && !this.has('light') ? 0.5 : 1);
        if (lowEnough && slow && w.kind !== 'storm') {
          v.ladder += dt;
          if (v.ladder >= 0.15) {
            v.saved = true;
            this.log('ok', `Đã thả thang cứu người ${v.where}! (${this.saved()}/3)`);
            this.emit('saved', { victim: v, count: this.saved() });
            if (this.saved() === 3) this.allSaved();
          }
        } else if (this.runT - (alt > LOW ? this.hint.high : this.hint.fast) > 4) {
          // Gợi ý vì sao chưa cứu được (mỗi loại tối đa 1 lần / 4 giây)
          if (alt > LOW) {
            this.hint.high = this.runT;
            this.log('warn', v.fog && !this.has('light') ? 'Sương mù dày: phải bay rất thấp (hoặc gắn đèn pha) mới thả thang được.' : 'Bay cao quá, chưa thả thang được – dùng M2 hạ thấp.');
            this.emit('miss', 'high');
          } else {
            this.hint.fast = this.runT;
            this.log('warn', w.kind === 'storm' ? 'Đang bão, chưa thả thang được.' : 'Bay nhanh quá, người gặp nạn không bám được thang – dùng M1 Low.');
            this.emit('miss', w.kind === 'storm' ? 'storm' : 'fast');
          }
        }
      }
    }
    allSaved() {
      this.best = { secs: +this.runT.toFixed(1) };
      this.done.m3 = true;
      if (this.advanced && this.stormSeen) this.done.m5 = true;
      this.log('ok', `Đã cứu đủ 3 người sau ${this.runT.toFixed(1)} giây!`);
      this.emit('allSaved', { secs: this.runT, storm: this.advanced && this.stormSeen });
      this.checkMissions();
    }

    finish() {
      this.running = false;
      this.m.M1.on = this.m.M2.on = false;
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
        pill.textContent = this.crashed ? 'Hạ cánh khẩn cấp' : this.running ? 'Đang bay' : 'Đã dừng';
        pill.dataset.k = this.crashed ? 'bad' : this.running ? 'ok' : 'muted';
      }
      const set = (id, html) => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = html;
      };
      const w = this.weather(),
        alt = this.altitude();
      set('m-speed', `${Math.abs(this.armRpm()).toFixed(0)} <small>vòng/phút</small>`);
      set('m-speed-note', this.m.M1.on ? 'M1 ' + (NAME[this.m.M1.power] || 'mức ' + this.m.M1.power) + (this.m.M1.dir < 0 ? ' · ngược' : '') : 'M1 dừng');
      set('m-alt', `${Math.round(alt * 100)} <small>%</small>`);
      set('m-alt-note', alt <= LOW ? 'Thấp – thả thang được' : alt >= CLOUD ? 'Cao – trên mây' : 'Lưng chừng');
      set('m-saved', `${this.saved()} <small>/ 3</small>`);
      set('m-weather', { clear: 'Trời quang', storm: 'Bão' }[w.kind]);
      set('m-weather-note', this.advanced && Number.isFinite(w.next) ? `Đổi sau ${w.next.toFixed(0)} giây` : 'Ổn định');
      const desc = document.getElementById('sim-status-desc');
      if (desc)
        desc.textContent = this.crashed
          ? 'Máy bay đã hạ cánh khẩn cấp. Sửa chương trình rồi chạy lại.'
          : this.running
            ? `Đã cứu ${this.saved()}/3 người. Độ cao ${Math.round(alt * 100)}%.`
            : 'Ghép khối lệnh rồi chạm Start để chạy.';
      const c1 = document.getElementById('calc-eq1');
      if (c1) c1.textContent = `Trục vít 1 mối quay ${WORM} vòng thì bánh răng 24 răng mới quay 1 vòng: M2 nhanh (150 vòng/phút) → tay quay ${(MOTOR_RPM / WORM).toFixed(2)} vòng/phút, mất ${(60 * WORM / MOTOR_RPM / 2).toFixed(1)} giây để từ cao nhất xuống thấp nhất.`;
      const c2 = document.getElementById('calc-eq2');
      if (c2) c2.textContent = this.advanced
        ? `Bão theo giờ: quang 0–9 giây, bão 9–17, quang 17–29, bão 29–37. Trong bão phải ở độ cao ≥ ${CLOUD * 100}% (dưới mây quá ${this.stormLimit()} giây sẽ rơi).`
        : `Thả thang được khi độ cao ≤ ${LOW * 100}% và M1 quay chậm (Low).`;
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

  RescueEngine.WEATHER = WEATHER;
  RescueEngine.VICTIMS = VICTIMS;
  RescueEngine.LIMITS = { LOW, CLOUD };
  window.RescueEngine = RescueEngine;
})();
