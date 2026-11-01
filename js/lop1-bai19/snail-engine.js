// Ốc sên quý hiếm (Lớp 1 Bài 19): hai động cơ BE-3581 dẫn hai bánh, cảm biến siêu âm ở đầu.
// Trục x/y đo bằng cm, nhìn từ trên xuống, theta dương là rẽ trái. Hai bánh cách nhau 24 cm.
// Mức 8: 39,3 cm/giây. Rẽ trái ở mức 8: bánh trái lùi, bánh phải tiến, quay 1 rad/s (≈ 57°/giây).
// Khối Rẽ trái KHÔNG tự dừng: sau khối Chờ, xe vẫn quay cho tới khi cảm biến thấy vật cản (đúng như robot thật).
(function () {
  'use strict';
  const R = 2.5, RPM = 150, BASE = 24, TURN_FACTOR = 12 / (2 * Math.PI * R * RPM / 60);
  const MAX_TIME = 36, HIT = 9, EAT = 11, CONE = 28 * Math.PI / 180;
  const RANGE = 60, SLIP = 0.4;
  // Sa bàn (cm). Kid: sân của bé; pro: cùng sân nhưng đoạn đầu có vệt nhớt dính, ốc sên bò chậm còn 0,4 lần (slip = [x đầu, x cuối]).
  const MODES = {
    kid: { end: 170, stones: [[60, 3], [107, 27]], leaves: [[57, 34], [96, 43], [143, 32]], slip: null },
    pro: { end: 170, stones: [[60, 3], [107, 27]], leaves: [[57, 34], [96, 43], [143, 32]], slip: [0, 60] }
  };
  const SAMPLE = ['start', 'repeatStart', 'sensor_obstacle', 'drive:forward', 'wait:1',
    'sensor_obstacle', 'stop', 'drive:left', 'wait:0.2', 'repeatEnd'];
  const sig = b => b.type === 'wait' ? 'wait:' + b.duration
    : b.type === 'drive' ? 'drive:' + b.move
      : b.type === 'motor' ? 'motor:' + b.speed : b.type;
  const speedOf = p => 2 * Math.PI * R * RPM * p / 8 / 60;
  const LEVELS = { low: 4, medium: 6, high: 8 };

  class SnailEngine extends window.LessonEngine {
    constructor() {
      super({ sample: SAMPLE, sig, core: ['m1', 'm2', 'm3', 'm4'],
        labels: { antenna: 'Râu kép dài', glow: 'Mai phát quang', grip: 'Vành bánh gai', eyes: 'Đèn mắt kép' },
        baseLabel: 'Ốc sên cơ bản' });
      this.done = { m2: false, m3: false, m5: false };
      this.upgradeRun = false;
      this.lastRun = null;
    }
    mode() { return this.advanced ? MODES.pro : MODES.kid; }
    trackEnd() { return this.mode().end; }
    range() { return RANGE; }
    slipZone() { return this.mode().slip; }
    left() { return this.leaves.filter(l => !l.eaten).length; }
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
      this.bumpStone = -1;
      this.spun = false;
      this.cycles = 0;
      this.completedTurns = 0;
      this.turned = 0;
      this.path = 0;
      this.turnTotal = 0;
      this.stones = this.mode().stones.map(([x, y]) => ({ x, y }));
      this.leaves = this.mode().leaves.map(([x, y]) => ({ x, y, eaten: false }));
      this.trail = [[0, 0]];
    }
    onStart() { this.log('info', 'Ốc sên sẵn sàng! Cảm biến nhìn theo đầu.'); }
    setAdvanced(on) {
      const before = this.advanced;
      super.setAdvanced(on);
      if (before !== this.advanced) this.emit('target', this.leaves.length);
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
    onMotor() { this.wheels('forward', this.power); }
    onStopBlock() { this.wheels('stop', this.power); }
    // Cảm biến thấy đá hoặc rào cuối vườn trong nón +/- 28 độ phía trước đầu (lá rau không cản).
    seesObstacle() {
      if (this.hand) return true;
      const cand = this.stones.concat([{ x: this.trackEnd(), y: this.y + Math.tan(this.theta) * Math.max(0, this.trackEnd() - this.x) }]);
      return cand.some(p => {
        const dx = p.x - this.x, dy = p.y - this.y;
        const f = dx * Math.cos(this.theta) + dy * Math.sin(this.theta);
        const s = -dx * Math.sin(this.theta) + dy * Math.cos(this.theta);
        return f > 0 && f <= this.range() && Math.abs(s) <= f * Math.tan(CONE);
      });
    }
    pose3d() {
      return { output: -((this.wheelLeft + this.wheelRight) / 2) * 2 * Math.PI,
        motor: 0, wheelLeft: -this.wheelLeft * 2 * Math.PI, wheelRight: -this.wheelRight * 2 * Math.PI,
        heading: this.theta, offset: [this.x * 0.002, 0, -this.y * 0.002] };
    }
    onSlip() {
      const z = this.slipZone();
      return !!z && !this.has('grip') && this.x > z[0] && this.x < z[1];
    }
    advance(dt) {
      if (this.hand && (this.handT -= dt) <= 0) this.hand = false;
      if (!this.running) return;
      if (this.runT >= MAX_TIME) {
        this.log('warn', 'Cảm biến chờ vật cản quá lâu.');
        this.emit('timeout');
        this.finish();
        return;
      }
      let budget = Math.max(0, Math.min(dt, MAX_TIME - this.runT));
      let guard = 0;
      while (this.running && guard++ < 40) {
        if (this.pc >= this.prog.length) { this.finish(); break; }
        const b = this.prog[this.pc];
        if (b.type === 'start' || b.type === 'repeatStart') { this.pc++; continue; }
        if (b.type === 'repeatEnd') {
          if (this.matchesSample() && this.cycles >= 1 && this.completedTurns >= 1 && !this.crashed) {
            if (!this.done.m2) this.emit('sampleDone');
            this.done.m2 = true;
            this.checkMissions();
          }
          const i = this.prog.findIndex(v => v.type === 'repeatStart');
          if (i < 0) this.pc++;
          else if (!this.prog.slice(i + 1).some(v => v.type === 'wait' || v.type === 'sensor_obstacle' || v.type === 'melody')) this.pc = this.prog.length;
          else this.pc = i + 1;
          continue;
        }
        if (b.type === 'drive' || b.type === 'motor' || b.type === 'motor_power') {
          const p = b.type === 'motor_power' ? b.power : (LEVELS[b.speed] || 8);
          this.wheels(b.type === 'drive' && b.move === 'left' ? 'left' : 'forward', p);
          this.pc++; continue;
        }
        if (b.type === 'motor_reverse') { this.dir *= -1; this.pc++; continue; }
        if (b.type === 'stop') { this.wheels('stop', this.power); this.pc++; continue; }
        if (b.type === 'sensor_obstacle') {
          if (!this.entered) { this.entered = true; this.onActiveBlockUpdate?.(this.pc); }
          if (this.seesObstacle()) {
            if (this.hand) this.handUsed = true;
            this.waitingHand = false;
            this.entered = false;
            this.seen = true;
            this.log('ok', this.hand ? 'Cảm biến thấy bàn tay.' : 'Cảm biến thấy vật cản phía trước.');
            this.emit('seen');
            this.pc++; continue;
          }
          if (!this.waitingHand) { this.waitingHand = true; this.log('warn', 'Chờ vật cản trước đầu – em có thể bấm ✋.'); this.emit('waitHand'); }
          this.integrate(budget);
          budget = 0; break;
        }
        if (!this.entered) {
          this.entered = true;
          this.blkT = 0;
          this.onActiveBlockUpdate?.(this.pc);
          if (b.type === 'wait' && this.motion === 'forward') this.cycles++;
          if (b.type === 'melody') { window.SFX?.melody(b.tune); this.emit('melody', b.tune); }
        }
        const dur = b.type === 'wait' ? (Number(b.duration) || 3) : b.type === 'melody' ? 1 : 0;
        const left = Math.max(0, dur - this.blkT);
        const used = Math.min(budget, left);
        this.integrate(used);
        if (!this.running) break;
        this.blkT += used;
        budget -= used;
        if (this.blkT + 1e-8 < dur) break;
        if (b.type === 'wait' && this.motion === 'left') { this.completedTurns++; this.turnTotal = 0; }
        this.entered = false;
        this.pc++;
        if (budget <= 1e-9 && this.prog[this.pc]?.type !== 'repeatEnd') break;
      }
      if (budget > 0 && this.running) this.integrate(budget);
    }
    integrate(dt) {
      if (!this.running || dt <= 0) return;
      this.runT += dt;
      if (!this.motorOn || this.crashed) return;
      const oldTheta = this.theta;
      const v = this.speed() * (this.onSlip() && this.motion === 'forward' ? SLIP : 1);
      const omega = (this.rightMotor - this.leftMotor) / BASE;
      const mid = this.theta + omega * dt / 2;
      this.x += v * Math.cos(mid) * dt;
      this.y += v * Math.sin(mid) * dt;
      this.theta += omega * dt;
      this.path += Math.abs(v) * dt;
      this.turned += Math.abs(this.theta - oldTheta);
      if (this.motion === 'left') this.turnTotal += omega * dt;
      this.wheelLeft += this.leftMotor * dt / (2 * Math.PI * R);
      this.wheelRight += this.rightMotor * dt / (2 * Math.PI * R);
      this.rev = (this.wheelLeft + this.wheelRight) / 2;
      const last = this.trail[this.trail.length - 1];
      if (Math.hypot(this.x - last[0], this.y - last[1]) > 2) this.trail.push([this.x, this.y]);
      for (let i = 0; i < this.stones.length; i++) {
        const s = this.stones[i];
        if (Math.hypot(s.x - this.x, s.y - this.y) < HIT) {
          this.bumpStone = i;
          this.crashed = true;
          this.log('warn', 'Ốc sên húc vào tảng đá!');
          this.emit('bump', { stone: i, x: s.x, y: s.y });
          this.finish();
          return;
        }
      }
      if (this.x >= this.trackEnd() || this.x < -12 || Math.abs(this.y) > 90) {
        this.x = Math.min(this.x, this.trackEnd());
        this.crashed = true;
        this.log('warn', 'Ốc sên chạm rào vườn!');
        this.emit('crash');
        this.finish();
        return;
      }
      if (this.motion === 'left' && this.turnTotal > Math.PI * 2.2) {
        this.spun = true;
        this.log('warn', 'Ốc sên quay tròn mãi!');
        this.emit('spin');
        this.finish();
        return;
      }
      for (let i = 0; i < this.leaves.length; i++) {
        const l = this.leaves[i];
        if (l.eaten || Math.hypot(l.x - this.x, l.y - this.y) > EAT) continue;
        l.eaten = true;
        this.log('ok', `Ốc sên ăn một lá rau! Còn ${this.left()} lá.`);
        this.emit('eat', { x: l.x, y: l.y, left: this.left(), index: i });
      }
      if (this.left() === 0) this.finish();
    }
    finish() {
      if (!this.running) return;
      this.running = false;
      this.motorOn = false;
      this.leftMotor = this.rightMotor = 0;
      this.motion = 'stop';
      this.waitingHand = false;
      this.onActiveBlockUpdate?.(-1);
      const clean = !this.crashed && !this.spun;
      if (clean && this.left() === 0) {
        this.done.m3 = true;
        if (this.advanced) this.done.m5 = true;
        this.lastRun = { cycles: this.cycles, leaves: this.leaves.length, advanced: this.advanced, path: Math.round(this.path) };
        this.log('ok', `Ốc sên ăn đủ ${this.leaves.length} lá rau!`);
        this.emit('deliver', { cycles: this.cycles, advanced: this.advanced });
      } else if (clean && (this.x > 0 || this.seen)) {
        this.emit('short', { left: this.left() });
      }
      this.emit('end');
      this.checkMissions();
    }
    missionExtra() { return { ...super.missionExtra(), lastRun: this.lastRun }; }
    updateUI() {
      super.updateUI();
      const pill = document.getElementById('sim-status-pill');
      if (pill && this.waitingHand) { pill.textContent = 'Chờ vật cản'; pill.dataset.k = 'warn'; }
      this.set('m-dist', `${Math.round(this.path)} <small>cm</small>`);
      this.set('m-dist-note', this.onSlip() ? 'Nhớt dính: bò chậm' : 'Quãng đường đã bò');
      this.set('m-angle', `${Math.round(((this.theta * 180 / Math.PI) % 360 + 360) % 360)} <small>độ</small>`);
      this.set('m-leaf', `${this.leaves.length - this.left()} <small>/ ${this.leaves.length} lá</small>`);
      this.set('m-leaf-note', 'Lá rau đã ăn');
      this.set('m-sample', String(this.cycles));
      const desc = document.getElementById('sim-status-desc');
      if (desc) desc.textContent = this.waitingHand ? 'Cảm biến đang chờ vật cản trước đầu. Bấm ✋ nếu cần.'
        : this.running ? `Ốc sên đang ${this.motion === 'left' ? 'rẽ trái' : 'bò'}, còn ${this.left()} lá rau.`
          : 'Ghép khối lệnh rồi chạm Start để chạy.';
      this.set('calc-eq1', 'Tiến thẳng: hai bánh cùng quay. Rẽ trái: bánh trái lùi, bánh phải tiến.');
      this.set('calc-eq2', 'Mức 8 ≈ 39,3 cm/giây · rẽ ≈ 57°/giây · trên vệt nhớt dính chỉ bò 0,4 lần.');
    }
  }
  SnailEngine.SPEED = speedOf;
  SnailEngine.MODES = MODES;
  SnailEngine.SLIP = SLIP;
  window.SnailEngine = SnailEngine;
})();
