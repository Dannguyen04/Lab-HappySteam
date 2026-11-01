// Bộ mô phỏng Bài 13 – Xe dọn tuyết. Một động cơ quay trục xuyên qua hai bánh: mức công suất p (1–8) → 150·p/8 vòng/phút,
// bánh bán kính 2,5 cm nên mức 8 ≈ 39 cm/giây. Xe chạy thẳng trên đường từ ga-ra (0 cm); trên đường có các đống tuyết.
// Chương trình mẫu (theo giáo án): Start → Lặp { Chờ vật cản → Quay nhanh → Chờ 1 giây → Dừng }. Cảm biến siêu âm
// "thấy vật cản" khi có đống tuyết phía trước trong tầm cảm biến, hoặc khi đưa tay (nút ✋). Xe đẩy tuyết dọc đường.
// Cùng giao diện với RoverEngine của Bài 3: setProgram, start, stop, checkMissions, setAssemblyDone, setUpgrades,
// setAdvanced, pose3d, onEvent/onMissionUpdate/onActiveBlockUpdate.
(function () {
  'use strict';

  const MAX_RPM = 150;
  const WHEEL_R = 2.5; // cm
  const MODES = {
    kid: { end: 150, piles: [35, 75, 115], range: 40 },
    pro: { end: 230, piles: [30, 70, 110, 150, 190], range: 40 }
  };
  const PRO_MAX_CYCLES = 4; // NV5: dọn sạch 5 đống chỉ với tối đa 4 lần chạy
  const NEED = 5; // tuyết dày: cần mức ≥ 5 mới đẩy nổi; có lưỡi gạt thì mức ≥ 3
  const NEED_BLADE = 3;
  const MAX_TIME = 40; // giây: chờ mãi không có vật cản thì tự dừng
  const SAMPLE = ['start', 'repeatStart', 'sensor_obstacle', 'motor:high', 'wait:1', 'stop', 'repeatEnd'];
  const sig = b => {
    if (b.type === 'wait') return 'wait:' + b.duration;
    if (b.type === 'motor') return 'motor:' + (b.speed || 'high');
    if (b.type === 'motor_power') return 'motor:' + (Number(b.power || 8) === 8 ? 'high' : 'power-' + b.power);
    return b.type;
  };
  const speedOf = p => (2 * Math.PI * WHEEL_R * MAX_RPM * p) / 8 / 60; // cm/giây

  class PlowEngine {
    constructor() {
      this.prog = [];
      this.logs = [];
      this.t = 0;
      this.upgrades = new Set();
      this.advanced = false;
      this.assemblyDone = false;
      this.done = { m2: false, m3: false, m5: false };
      this.upgradeRun = false;
      this.lastRun = null;
      this.loopActive = true;
      this.rafId = null;
      this.reset();
    }
    init() {
      this.startLoop();
    }
    resizeCanvas() {}
    mode() {
      return this.advanced ? MODES.pro : MODES.kid;
    }
    trackEnd() {
      return this.mode().end;
    }
    range() {
      return this.mode().range;
    }

    reset() {
      this.running = false;
      this.pc = 0;
      this.entered = false;
      this.blkT = 0;
      this.motorOn = false;
      this.power = 8;
      this.dir = 1;
      this.x = 0; // cm từ ga-ra
      this.rev = 0;
      this.hand = false;
      this.handUsed = false;
      this.seen = false; // cảm biến đã từng thấy vật cản trong lần chạy này
      this.waitingHand = false;
      this.crashed = false;
      this.stuck = false;
      this.cycles = 0; // số lần xe chạy (mỗi khối Chờ sau khi bật động cơ)
      this.runT = 0;
      this.maxPower = 0;
      this.piles = this.mode().piles.map(p => ({ x: p, cleared: false }));
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
      const labels = { blade: 'Lưỡi gạt tuyết', beacon: 'Đèn cảnh báo', salt: 'Thùng rải muối', chain: 'Xích bánh xe' };
      const badge = document.getElementById('sim-active-upgrade-badge');
      if (badge) badge.textContent = this.upgrades.size ? [...this.upgrades].map(t => labels[t]).join(' · ') : 'Xe cơ bản';
      this.log('ok', this.upgrades.size ? 'Đã gắn: ' + [...this.upgrades].map(t => labels[t]).join(', ') : 'Xe cơ bản (chưa gắn thêm)');
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
      this.emit('target', this.piles.length);
      this.checkMissions();
    }
    need() {
      return this.has('blade') ? NEED_BLADE : NEED;
    }
    left() {
      return this.piles.filter(p => !p.cleared).length;
    }
    speed() {
      return this.motorOn ? speedOf(this.power) * this.dir : 0;
    }
    pileAhead() {
      return this.piles.some(p => !p.cleared && p.x > this.x && p.x - this.x <= this.range());
    }
    matchesSample() {
      return this.prog.length === SAMPLE.length && this.prog.every((b, i) => sig(b) === SAMPLE[i]);
    }
    pose3d() {
      return { output: -this.rev * Math.PI * 2, motor: 0, offset: [this.x * 0.002, 0, 0] };
    }

    advance(dt) {
      if (this.hand && (this.handT -= dt) <= 0) this.hand = false;
      if (!this.running) return;
      this.runT += dt;
      if (this.runT > MAX_TIME) {
        this.log('warn', 'Đợi quá lâu mà cảm biến không thấy vật cản.');
        this.emit('timeout');
        this.finish();
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
          if (r < 0) this.pc++;
          else {
            this.pc = r + 1;
            // vòng lặp không có khối nào tốn thời gian thì thôi, tránh treo
            if (!this.prog.some(x => x.type === 'wait' || x.type === 'sensor_obstacle' || x.type === 'melody')) this.pc = this.prog.length;
          }
          continue;
        }
        if (b.type === 'motor' || b.type === 'motor_power') {
          this.power = b.type === 'motor_power' ? Math.max(1, Math.min(8, b.power || 8)) : b.speed === 'low' ? 4 : b.speed === 'medium' ? 6 : 8;
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
          // NV2: hoàn thành một chu kỳ đúng mẫu, không cần dọn sạch cả đường (NV3).
          this.completeSampleCycle();
          this.pc++;
          continue;
        }
        if (b.type === 'sensor_obstacle') {
          if (!this.entered) {
            this.entered = true;
            if (this.onActiveBlockUpdate) this.onActiveBlockUpdate(this.pc);
          }
          const sees = this.hand || this.pileAhead();
          if (sees) {
            if (this.hand) this.handUsed = true;
            this.waitingHand = false;
            this.entered = false;
            this.seen = true;
            this.log('ok', this.hand ? 'Cảm biến thấy bàn tay!' : 'Cảm biến thấy đống tuyết phía trước!');
            this.emit('seen');
            this.pc++;
            continue;
          }
          if (!this.waitingHand) {
            this.waitingHand = true;
            this.log('warn', 'Cảm biến siêu âm đang chờ vật cản – chưa có đống tuyết nào gần, hãy đưa tay trước mắt xe.');
            this.emit('waitHand');
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
          if (b.type === 'wait' && this.motorOn) this.cycles++;
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
      if (!this.motorOn || this.crashed || this.stuck || dt <= 0) return;
      const v = this.speed();
      let nx = this.x + v * dt;
      if (v > 0) {
        // gặp đống tuyết chưa dọn: đủ lực thì đẩy qua, không thì kẹt lại
        const pile = this.piles.find(p => !p.cleared && p.x > this.x && p.x <= nx + 1e-9);
        if (pile && this.power < this.need()) {
          nx = pile.x - 4;
          this.stuck = true;
        }
      }
      this.rev += (nx - this.x) / (2 * Math.PI * WHEEL_R);
      this.x = nx;
      if (this.x < -10) this.x = -10;
      if (!this.stuck)
        for (const p of this.piles)
          if (!p.cleared && this.x >= p.x - 1e-9) {
            p.cleared = true;
            this.log('ok', `Xe đã đẩy sạch đống tuyết ở ${p.x} cm (còn ${this.left()}).`);
            this.emit('push', { x: p.x, left: this.left() });
          }
      if (this.stuck) {
        this.motorOn = false;
        this.log('warn', `Tuyết dày – mức ${this.power} không đẩy nổi!`);
        this.emit('stuck', { power: this.power, need: this.need() });
        this.finish();
        return;
      }
      if (this.x >= this.trackEnd()) {
        this.x = this.trackEnd();
        this.crashed = true;
        this.motorOn = false;
        this.log('warn', 'Xe chạy quá xa và đụng tường cuối đường!');
        this.emit('crash');
        this.finish();
        return;
      }
      // Với chương trình Lặp, dừng ngay khi dọn sạch nếu thời gian Wait còn lại an toàn.
      // Nếu Wait đã lập trình sẽ đi quá tường, tiếp tục mô phỏng để báo va chạm đúng.
      const block = this.prog[this.pc];
      const waitLeft = block && block.type === 'wait' ? Math.max(0, (block.duration || 3) - this.blkT) : 0;
      const wouldCrash = this.speed() > 0 && this.x + this.speed() * waitLeft >= this.trackEnd();
      if (this.left() === 0 && this.prog.some(b => b.type === 'repeatStart') && !wouldCrash) this.finish();
    }

    finish() {
      if (!this.running) return;
      this.running = false;
      this.motorOn = false;
      this.waitingHand = false;
      if (this.onActiveBlockUpdate) this.onActiveBlockUpdate(-1);
      // Xe có thể dọn hết tuyết ngay giữa khối Wait và tự kết thúc sớm.
      if (this.left() === 0 && this.cycles > 0) this.completeSampleCycle();
      if (this.crashed || this.stuck) {
        // đã báo crash / stuck
      } else if (this.left() === 0) {
        this.done.m3 = true;
        if (this.advanced && this.cycles <= PRO_MAX_CYCLES) this.done.m5 = true;
        this.lastRun = { power: this.maxPower, cycles: this.cycles, piles: this.piles.length, advanced: this.advanced };
        this.log('ok', `Đã dọn sạch ${this.piles.length} đống tuyết sau ${this.cycles} lần chạy!`);
        this.emit('deliver', { cycles: this.cycles, advanced: this.advanced });
      } else if (this.x > 1 || this.seen) {
        this.log('info', `Chương trình dừng, còn ${this.left()} đống tuyết chưa dọn.`);
        this.emit('short', { left: this.left() });
      }
      this.emit('end');
      this.checkMissions();
    }

    completeSampleCycle() {
      if (!this.matchesSample() || !this.seen || this.crashed || this.stuck || this.cycles < 1 || this.done.m2) return;
      this.done.m2 = true;
      this.log('ok', 'Đã chạy đúng một chu kỳ mẫu: thấy vật cản → chạy nhanh 1 giây → dừng.');
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
      set('m-target', `${this.left()} <small>đống</small>`);
      set('m-target-note', `Tuyết còn lại / ${this.piles.length}`);
      set('m-sample', `${this.cycles}`);
      const desc = document.getElementById('sim-status-desc');
      if (desc)
        desc.textContent = this.waitingHand
          ? 'Xe đang chờ: cảm biến siêu âm chưa thấy vật cản, hãy đưa tay trước mắt xe.'
          : this.running
            ? `Xe chạy ${v.toFixed(1)} cm/giây, đã đi ${Math.round(this.x)} cm, còn ${this.left()} đống tuyết.`
            : 'Ghép khối lệnh rồi chạm Start để chạy.';
      const calc = document.getElementById('calc-eq1');
      if (calc) calc.textContent = 'Mức p → tốc độ = 39,3 × p / 8 cm/giây. Mỗi lần chạy: quãng đường = tốc độ × số giây Wait.';
      const calc2 = document.getElementById('calc-eq2');
      if (calc2) calc2.textContent = `Đường dài ${this.trackEnd()} cm, ${this.piles.length} đống tuyết. Ví dụ mức 8, Wait 1,3 giây: 39,3 × 1,3 ≈ 51 cm.`;
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

  PlowEngine.SPEED = speedOf;
  PlowEngine.MODES = MODES;
  PlowEngine.NEED = NEED;
  PlowEngine.NEED_BLADE = NEED_BLADE;
  PlowEngine.PRO_MAX_CYCLES = PRO_MAX_CYCLES;
  window.PlowEngine = PlowEngine;
})();
