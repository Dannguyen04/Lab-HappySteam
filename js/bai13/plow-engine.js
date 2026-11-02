// Xe dọn tuyết Bài 13: hai động cơ BE-3581 điều khiển hai bánh riêng biệt.
// Trục x/y đo bằng cm, theta dương là rẽ trái. Hai bánh cách nhau 24 cm.
// Khi Rẽ trái ở mức 8: bánh trái lùi 12 cm/s, bánh phải tiến 12 cm/s,
// tương đương 1 rad/s; Chờ 0,2s ngay sau khối rẽ xoay khoảng 11,5 độ.
(function () {
  'use strict';
  const R = 2.5, RPM = 150, BASE = 24, TURN_FACTOR = 12 / (2 * Math.PI * R * RPM / 60);
  const MAX_TIME = 36, PRO_MAX_CYCLES = 4, NEED = 5, NEED_BLADE = 3;
  const MODES = {
    kid: { end: 155, range: 43, piles: [[32, 0], [70, 6], [107, 19]] },
    pro: { end: 235, range: 43, piles: [[32, 0], [70, 0], [110, 5], [149, 14], [190, 30]] }
  };
  const SAMPLE = ['start', 'repeatStart', 'sensor_obstacle', 'drive:forward', 'wait:1',
    'sensor_obstacle', 'stop', 'drive:left', 'wait:0.2', 'repeatEnd'];
  const sig = b => b.type === 'wait' ? 'wait:' + b.duration
    : b.type === 'drive' ? 'drive:' + b.move
      : b.type === 'motor' ? 'motor:' + b.speed : b.type;
  const speedOf = p => 2 * Math.PI * R * RPM * p / 8 / 60;

  class PlowEngine extends window.LessonEngine {
    #frameDt = 0;
    #lastIntegratedDt = 0;
    #lastGoodBlkT = 0;
    #snapTimed = false;
    #dropResidual = false;
    constructor() {
      super({ sample: SAMPLE, sig, core: ['m1', 'm2', 'm3', 'm4'],
        labels: { blade: 'Lưỡi gạt tuyết', beacon: 'Đèn cảnh báo', salt: 'Thùng rải muối', chain: 'Xích bánh xe' },
        baseLabel: 'Xe cơ bản', loopEndBeforeJump: true, stopTimedOnFinish: true });
      this.done = { m2: false, m3: false, m5: false };
      this.upgradeRun = false;
      this.lastRun = null;
      // Bài này dùng bàn tay riêng; cờ nút đỏ của lớp gốc chỉ còn để giữ trạng thái công khai cũ.
      let pressTime = this.pressT, blockTime = this.blkT, blockDuration = 0;
      Object.defineProperty(this, 'pressT', {
        enumerable: true, configurable: true,
        get: () => pressTime,
        set: value => { if (!this.pressed || value >= pressTime) pressTime = value; }
      });
      // Giữ cách vòng chạy cũ tiêu thụ trọn khung ở ranh giới thời lượng lệch vài bit số thực.
      Object.defineProperty(this, 'blkDur', {
        enumerable: false, configurable: true,
        get: () => {
          const remaining = blockDuration - this.blkT;
          if (remaining > this.#frameDt && remaining - this.#frameDt < 1e-8) {
            this.#snapTimed = true;
            return this.blkT + this.#frameDt;
          }
          return blockDuration;
        },
        set: value => { blockDuration = value; }
      });
      Object.defineProperty(this, 'blkT', {
        enumerable: true, configurable: true,
        get: () => blockTime,
        set: value => {
          if (!(this.entered && this.prog[this.pc]?.type === 'sensor_obstacle') &&
              !(this.#dropResidual && value > 0 && value < 1e-9))
            blockTime = value;
        }
      });
    }
    mode() { return this.advanced ? MODES.pro : MODES.kid; }
    trackEnd() { return this.mode().end; }
    range() { return this.mode().range; }
    need() { return this.has('blade') ? NEED_BLADE : NEED; }
    left() { return this.piles.filter(p => !p.cleared).length; }
    resetState() {
      this.x = 0;
      this.y = 0;
      this.theta = 0;
      this.rev = 0;
      this.wheelLeft = 0;
      this.wheelRight = 0;
      this.leftMotor = 0;
      this.rightMotor = 0;
      this.motion = 'stop';
      this.power = 8;
      this.hand = false;
      this.handT = 0;
      this.waitingHand = false;
      this.handUsed = false;
      this.seen = false;
      this.crashed = false;
      this.stuck = false;
      this.cycles = 0;
      this.maxPower = 0;
      this.completedTurns = 0;
      this.piles = this.mode().piles.map(([x, y]) => ({ x, y, cleared: false }));
    }
    onStart() { this.log('info', 'Hai bánh sẵn sàng! Cảm biến nhìn theo đầu xe.'); }
    setAdvanced(on) {
      const before = this.advanced;
      super.setAdvanced(on);
      if (before !== this.advanced) this.emit('target', this.piles.length);
    }
    stop(silent) {
      super.stop(silent);
      this.leftMotor = this.rightMotor = 0;
      this.motion = 'stop';
      this.waitingHand = false;
    }
    putHand() {
      this.hand = true;
      this.handT = 1.2;
      this.emit('hand');
    }
    speed() { return (this.leftMotor + this.rightMotor) / 2; }
    wheels(mode, power) {
      this.motion = mode;
      this.power = Math.max(1, Math.min(8, Number(power) || 8));
      this.maxPower = Math.max(this.maxPower, this.power);
      this.motorOn = mode !== 'stop';
      const v = speedOf(this.power);
      if (mode === 'left') {
        this.leftMotor = -v * TURN_FACTOR;
        this.rightMotor = v * TURN_FACTOR;
      } else if (mode === 'forward') {
        this.leftMotor = this.rightMotor = v * this.dir;
      } else {
        this.leftMotor = this.rightMotor = 0;
        this.motorOn = false;
      }
      if (this.motorOn) this.noteUpgradeRun();
    }
    onMotor(b) { this.wheels('forward', this.power); }
    onStopBlock() { this.wheels('stop', this.power); }
    onInstant(b) {
      if (b.type !== 'drive') return false;
      this.wheels(b.move === 'left' ? 'left' : 'forward', ({ low: 4, medium: 6, high: 8 }[b.speed] || 8));
      return true;
    }
    // Chỉ các vật cản nằm trước đầu xe, trong nón quan sát +/- 28 độ, mới được phát hiện.
    seesObstacle() {
      if (this.hand) return true; // nút ✋ đặt bàn tay ngay phía trước cảm biến
      const candidates = this.piles.filter(p => !p.cleared).concat([{ x: this.trackEnd(), y: this.y + Math.tan(this.theta) * Math.max(0, this.trackEnd() - this.x), wall: true }]);
      return candidates.some(p => {
        const dx = p.x - this.x, dy = p.y - this.y;
        const forward = dx * Math.cos(this.theta) + dy * Math.sin(this.theta);
        const side = -dx * Math.sin(this.theta) + dy * Math.cos(this.theta);
        return forward > 0 && forward <= this.range() && Math.abs(side) <= forward * Math.tan(28 * Math.PI / 180);
      });
    }
    pileAhead() { return this.seesObstacle(); }
    pose3d() {
      return { output: -((this.wheelLeft + this.wheelRight) / 2) * 2 * Math.PI,
        motor: 0, wheelLeft: -this.wheelLeft * 2 * Math.PI, wheelRight: -this.wheelRight * 2 * Math.PI,
        heading: this.theta, offset: [this.x * 0.002, 0, -this.y * 0.002] };
    }
    beforeAdvance(dt) {
      if (this.hand && (this.handT -= dt) <= 0) this.hand = false;
      this.#frameDt = dt;
      this.#dropResidual = false;
      if (this.running && this.runT >= MAX_TIME) {
        this.log('warn', 'Cảm biến chờ vật cản quá lâu.');
        this.emit('timeout');
        this.finish();
        return 0;
      }
      return Math.max(0, Math.min(dt, MAX_TIME - this.runT));
    }
    onLoopEnd() {
      if (this.matchesSample() && this.cycles >= 1 && this.completedTurns >= 1 && !this.crashed && !this.stuck) {
        this.done.m2 = true;
        this.checkMissions();
      }
    }
    loopNext(r, end) {
      if (r < 0) return end + 1;
      return this.prog.slice(r + 1, end).some(b => b.type === 'wait' || b.type === 'sensor_obstacle' || b.type === 'melody')
        ? r + 1 : this.prog.length;
    }
    shouldYieldLoop() { return false; }
    isConditionWait(b) { return b.type === 'sensor_obstacle'; }
    waitDone() {
      if (this.seesObstacle()) return true;
      if (!this.waitingHand) {
        this.waitingHand = true;
        this.log('warn', 'Chờ vật cản trước đầu xe – em có thể bấm ✋.');
        this.emit('waitHand');
      }
      return false;
    }
    waitCheckAfterStep() { return false; }
    onWaitExit() {
      if (this.hand) this.handUsed = true;
      this.waitingHand = false;
      this.seen = true;
      this.log('ok', this.hand ? 'Cảm biến thấy bàn tay.' : 'Cảm biến thấy vật cản phía trước.');
      this.emit('seen');
    }
    onTimedEnter(b) {
      this.#lastGoodBlkT = 0;
      this.#lastIntegratedDt = 0;
      if (b.type === 'wait' && this.motion === 'forward') this.cycles++;
    }
    enterBlock(b) {
      return b.type === 'wait' ? (Number(b.duration) || 3) : super.enterBlock(b);
    }
    onTimedExit(b) {
      this.blkT += this.#lastIntegratedDt;
      this.#lastGoodBlkT = this.blkT;
      if (b.type === 'wait' && this.motion === 'left') this.completedTurns++;
    }
    shouldYieldAfterTimed(b, budget) {
      return budget <= 1e-9 && this.prog[this.pc]?.type !== 'repeatEnd';
    }
    integrate(dt) {
      if (!this.running || (this.#dropResidual && dt > 0 && dt < 1e-9)) return;
      if (this.#snapTimed) {
        dt = this.#frameDt;
        this.#snapTimed = false;
        this.#dropResidual = true;
      }
      if (dt <= 0) return;
      this.#lastIntegratedDt = dt;
      this.runT += dt;
      if (!this.motorOn || this.crashed || this.stuck) {
        if (this.entered) this.#lastGoodBlkT = this.blkT;
        return;
      }
      const oldX = this.x, oldY = this.y;
      const v = this.speed(), omega = (this.rightMotor - this.leftMotor) / BASE;
      const mid = this.theta + omega * dt / 2;
      this.x += v * Math.cos(mid) * dt;
      this.y += v * Math.sin(mid) * dt;
      this.theta += omega * dt;
      this.wheelLeft += this.leftMotor * dt / (2 * Math.PI * R);
      this.wheelRight += this.rightMotor * dt / (2 * Math.PI * R);
      this.rev = (this.wheelLeft + this.wheelRight) / 2;
      if (this.x >= this.trackEnd() || this.x < -12 || Math.abs(this.y) > 90) {
        this.x = Math.min(this.x, this.trackEnd());
        this.crashed = true;
        this.log('warn', 'Xe chạm mép sân!'); this.emit('crash'); this.finish(); return;
      }
      if (this.motion !== 'forward' || v <= 0) {
        if (this.entered) this.#lastGoodBlkT = this.blkT;
        return;
      }
      for (const p of this.piles) {
        if (p.cleared) continue;
        // Lưỡi gạt có bề rộng 26 cm: tâm đống tuyết phải nằm trên đường xe đi.
        const dx = p.x - this.x, dy = p.y - this.y;
        if (Math.hypot(dx, dy) > 13) continue;
        if (this.power < this.need()) {
          this.x = oldX; this.y = oldY;
          this.stuck = true;
          this.log('warn', 'Tuyết dày, xe bị kẹt!');
          this.emit('stuck', { power: this.power, need: this.need() }); this.finish(); return;
        }
        p.cleared = true;
        this.log('ok', `Đã dọn một đống tuyết! Còn ${this.left()} đống.`);
        this.emit('push', { x: p.x, y: p.y, left: this.left() });
      }
      if (this.left() === 0 && this.prog.some(b => b.type === 'repeatStart')) this.finish();
      if (this.entered && this.running) this.#lastGoodBlkT = this.blkT;
    }
    finish() {
      if (!this.running) return;
      if (this.entered && ['wait', 'melody'].includes(this.prog[this.pc]?.type) && this.blkT > this.#lastGoodBlkT)
        this.blkT = this.#lastGoodBlkT;
      this.running = false;
      this.motorOn = false;
      this.leftMotor = this.rightMotor = 0;
      this.motion = 'stop';
      this.waitingHand = false;
      this.onActiveBlockUpdate?.(-1);
      if (!this.crashed && !this.stuck && this.left() === 0 && this.cycles > 0) {
        this.done.m3 = true;
        if (this.advanced && this.cycles <= PRO_MAX_CYCLES) this.done.m5 = true;
        this.lastRun = { power: this.maxPower, cycles: this.cycles, piles: this.piles.length, advanced: this.advanced };
        this.log('ok', `Đã dọn sạch ${this.piles.length} đống sau ${this.cycles} lượt tiến.`);
        this.emit('deliver', { cycles: this.cycles, advanced: this.advanced });
      } else if (!this.crashed && !this.stuck && (this.x > 0 || this.seen)) {
        this.emit('short', { left: this.left() });
      }
      this.emit('end');
      this.checkMissions();
    }
    checkMissions() {
      super.checkMissions();
    }
    missionExtra() { return { ...super.missionExtra(), lastRun: this.lastRun }; }
    updateUI() {
      super.updateUI();
      const pill = document.getElementById('sim-status-pill');
      if (pill && this.waitingHand) { pill.textContent = 'Chờ vật cản'; pill.dataset.k = 'warn'; }
      const v = Math.abs(this.speed());
      this.set('m-speed', `${v.toFixed(1)} <small>cm/giây</small>`);
      this.set('m-speed-note', `Mức ${this.power}/8 · ${this.motion === 'left' ? 'rẽ trái' : this.motion === 'forward' ? 'tiến thẳng' : 'dừng'}`);
      this.set('m-dist', `${Math.round(Math.hypot(this.x, this.y))} <small>cm</small>`);
      this.set('m-target', `${this.left()} <small>đống</small>`);
      this.set('m-target-note', `Tuyết còn lại / ${this.piles.length}`);
      this.set('m-sample', String(this.cycles));
      const desc = document.getElementById('sim-status-desc');
      if (desc) desc.textContent = this.waitingHand ? 'Cảm biến đang chờ vật cản trước đầu xe. Hãy bấm ✋ nếu cần.'
        : this.running ? `Xe đang ${this.motion === 'left' ? 'rẽ trái' : 'dọn tuyết'}, còn ${this.left()} đống tuyết.`
          : 'Ghép khối lệnh rồi chạm Start để chạy.';
      this.set('calc-eq1', 'Tiến thẳng: hai bánh cùng quay. Rẽ trái: bánh trái lùi, bánh phải tiến.');
      this.set('calc-eq2', `Nâng cao: ${this.piles.length} đống tuyết, tối đa ${PRO_MAX_CYCLES} lượt tiến; đổi thời gian Chờ 1 giây để thử.`);
    }
  }
  PlowEngine.SPEED = speedOf;
  PlowEngine.MODES = MODES;
  PlowEngine.NEED = NEED;
  PlowEngine.NEED_BLADE = NEED_BLADE;
  PlowEngine.PRO_MAX_CYCLES = PRO_MAX_CYCLES;
  window.PlowEngine = PlowEngine;
})();
