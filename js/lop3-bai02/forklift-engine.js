// Xe nâng Lớp 3 Bài 02: M1 CCW tiến/CW lùi; M2 CCW hạ/CW nâng.
(function () {
  'use strict';
  // Tốc độ quy đổi của sa bàn (bán kính bánh 2,5 cm, 75 vòng/phút tại mức 8).
  // Hiệu chỉnh để ở mức 4: tiến 1 giây còn thiếu, 2 giây vào đúng càng, 3 giây quá sâu.
  const SPEED = p => (2 * Math.PI * 2.5 * 75 * p) / (8 * 60);
  const PALLET = 70, SENSOR = 10, FORK_MIN = 76, FORK_MAX = 84, BAY_MIN = 44, BAY_MAX = 56;
  const SAMPLE = ['start', 'motor:M1:low:ccw', 'sensor_obstacle', 'stop',
    'motor:M2:low:ccw', 'wait:1', 'stop', 'motor:M1:low:ccw', 'wait:1', 'stop',
    'motor:M2:low:cw', 'wait:1', 'stop', 'motor:M1:low:cw', 'wait:3', 'stop'];
  const sig = b => b.type === 'motor'
    ? `motor:${b.port || 'M1'}:${b.speed || 'high'}:${b.dir || 'cw'}`
    : b.type === 'wait' ? `wait:${Number(b.duration || 3)}` : b.type;
  class ForkliftEngine extends window.LessonEngine {
    constructor() {
      super({ sample: SAMPLE, sig, touch: [], advanceGuard: 70, stopTimedOnFinish: true,
        labels: { wideFork: 'Càng nâng rộng', backRest: 'Khung chắn lưng', twinWheels: 'Bánh sau kép', warning: 'Đèn/còi lùi' },
        baseLabel: 'Xe nâng cơ bản', core: ['m1', 'm2', 'm3', 'm4'] });
      this.done = { m2: false, m3: false, m5: false };
    }
    resetState() {
      this.x = 0; this.rev = 0; this.forkDown = 0; this.motorPort = null;
      this.loaded = false; this.delivered = false; this.hazard = 0;
      this.hazardSeen = false; this.clearedHazard = false;
      this.failed = false; this.reason = ''; this.phase = 'approach';
    }
    press() {}
    speed() { return this.motorOn && this.motorPort === 'M1' ? SPEED(this.power) * this.dir : 0; }
    pose3d() {
      // build.json hiện chưa có drive; offset chỉ dời nguyên mô hình 3D.
      return { output: -this.rev * Math.PI * 2, tilt: -this.forkDown * Math.PI / 2, offset: [this.x * .0015, 0, 0] };
    }
    seen() { return this.phase === 'approach' && PALLET - this.x >= 0 && PALLET - this.x <= SENSOR; }
    fail(reason, message) {
      if (this.failed) return;
      this.failed = true; this.reason = reason;
      this.log('warn', message); this.emit('miss', { reason, message });
    }
    onMotor(b) {
      this.motorPort = b.port || 'M1';
      this.dir = b.dir === 'ccw' ? (this.motorPort === 'M1' ? 1 : -1) : (this.motorPort === 'M1' ? -1 : 1);
      this.noteUpgradeRun();
      if (this.motorPort === 'M1' && this.dir < 0 && this.advanced && this.hazard > 0) {
        this.fail('hazard', 'Xe lùi khi xe hàng còn chắn lối. Thêm Đợi đường trống ngay trước M1 lùi.');
        this.finish();
      }
      if (this.motorPort === 'M1' && this.dir > 0 && this.loaded)
        this.fail('direction', 'Xe tiến khi đang chở pallet; hãy lùi về ô tập kết.');
    }
    onStopBlock() {
      const port = this.motorPort, direction = this.dir;
      this.motorPort = null;
      if (port === 'M1') {
        if (direction > 0 && this.phase === 'approach') this.phase = 'lower';
        else if (direction > 0 && this.phase === 'insert') this.phase = 'raise';
        else if (direction < 0 && this.phase === 'reverse') {
          if (this.loaded && !this.failed && this.x >= BAY_MIN && this.x <= BAY_MAX) {
            this.delivered = true; this.phase = 'done'; this.done.m3 = true;
            this.done.m5 = this.advanced && this.hazardSeen && this.clearedHazard;
            this.emit('delivered', { x: this.x, seconds: this.runT });
            this.log('ok', 'Pallet đã vào ô tập kết!'); this.checkMissions();
          } else if (!this.failed) this.fail('bay', `Xe dừng ở ${this.x.toFixed(1)} cm, ngoài ô tập kết ${BAY_MIN}–${BAY_MAX} cm.`);
        }
      } else if (port === 'M2' && direction < 0) {
        if (this.forkDown < .95) this.fail('lower', 'Càng chưa hạ đủ; cần M2 hạ khoảng 1 giây.');
        this.phase = 'insert';
      } else if (port === 'M2' && direction > 0) {
        if (this.forkDown > .05) this.fail('raise', 'Càng chưa nâng đủ; cần M2 nâng khoảng 1 giây.');
        if (this.x < FORK_MIN) this.fail('short', 'Càng chưa vào đủ gầm pallet. Tăng Chờ M1 tiến vào lên 2 giây.');
        if (this.x > FORK_MAX) this.fail('deep', 'Tiến vào quá sâu, xe chạm pallet. Giảm thời gian Chờ.');
        if (!this.failed) {
          this.loaded = true; this.emit('picked', { x: this.x });
          if (this.advanced) { this.hazard = 1.4; this.hazardSeen = true; this.emit('hazard', { seconds: this.hazard }); }
        }
        this.phase = 'reverse';
      }
    }
    finish() {
      // M2 kiểm đúng mẫu và chạy hết; M3/M5 chấm vật lý.
      if (this.matchesSample() && !this.done.m2 && this.pc >= this.prog.length) {
        this.done.m2 = true;
        this.log('ok', 'Chạy hết 16 khối mẫu KHGD.');
        this.emit('sampleDone');
      }
      super.finish();
    }
    integrate(dt) {
      if (!this.running || dt <= 0) return;
      const steps = Math.max(1, Math.ceil(dt / .02));
      for (let i = 0; i < steps && this.running; i++) {
        const d = dt / steps;
        this.runT += d;
        if (this.hazard > 0) {
          this.hazard = Math.max(0, this.hazard - d);
          if (!this.hazard) this.emit('clear');
        }
        if (this.motorOn && this.motorPort === 'M1') {
          const move = this.speed() * d;
          this.x += move; this.rev += move / (2 * Math.PI * 2.5);
          if (this.x < -5 || this.x > 100) {
            this.fail('boundary', 'Xe ra khỏi đường chạy an toàn.'); this.finish();
          }
        } else if (this.motorOn && this.motorPort === 'M2')
          this.forkDown = Math.max(0, Math.min(1, this.forkDown - this.dir * d * this.power / 4));
      }
    }
    isConditionWait(b) { return b.type === 'sensor_obstacle' || b.type === 'wait_clear'; }
    waitDone(b) { return b.type === 'wait_clear' ? this.hazard <= 0 : this.seen(); }
    waitStep(b, budget) { return Math.min(.02, budget); }
    onWaitExit(b) {
      if (b.type === 'sensor_obstacle') this.emit('found', { distance: PALLET - this.x });
      if (b.type === 'wait_clear' && this.hazardSeen && !this.hazard) this.clearedHazard = true;
    }
    updateUI() {
      super.updateUI();
      const pill = document.getElementById('sim-status-pill');
      if (pill) {
        pill.textContent = this.failed ? 'Cần sửa chương trình' : this.delivered ? 'Pallet về đích' : this.hazard > 0 ? 'Có vật cản' : this.motorOn ? `Đang chạy ${this.motorPort}` : this.running ? 'Đang đợi' : 'Đã dừng';
        pill.dataset.k = this.failed ? 'warn' : this.running ? 'ok' : 'muted';
      }
      this.set('m-speed', `${Math.abs(this.speed()).toFixed(1)} <small>cm/giây</small>`);
      this.set('m-speed-note', this.motorPort === 'M1' ? (this.dir > 0 ? 'M1 tiến' : 'M1 lùi') : 'Bánh xe dừng');
      this.set('m-dist', `${Math.max(0, PALLET - this.x).toFixed(1)} <small>cm</small>`);
      this.set('m-dist-note', this.seen() ? 'Phát hiện pallet' : 'Siêu âm · ngưỡng 10 cm');
      this.set('m-lift', `${((1 - this.forkDown) * 100).toFixed(0)} <small>%</small>`);
      this.set('m-lift-note', this.loaded ? 'Đang chở pallet' : 'M2 nâng/hạ càng');
      this.set('m-time', `${this.runT.toFixed(1)} <small>giây</small>`);
      this.set('m-time-note', this.hazard > 0 ? `Chướng ngại còn ${this.hazard.toFixed(1)} giây` : 'Đường lùi thông thoáng');
      this.set('calc-eq1', `M1 mức 4: ${SPEED(4).toFixed(1)} cm/giây. Tiến 2 giây ≈ ${(2 * SPEED(4)).toFixed(1)} cm.`);
      this.set('calc-eq2', `Cảm biến dừng cách pallet ${SENSOR} cm. Càng cần tới ${FORK_MIN}–${FORK_MAX} cm; ô tập kết ${BAY_MIN}–${BAY_MAX} cm.`);
      const desc = document.getElementById('sim-status-desc');
      if (desc) desc.textContent = this.failed ? this.logs[0]?.text || this.reason : this.delivered ? 'Pallet đã đến ô tập kết an toàn!' : `Xe ở ${this.x.toFixed(1)} cm · ${this.phase}`;
    }
  }
  ForkliftEngine.SAMPLE = SAMPLE;
  ForkliftEngine.SPEED = SPEED;
  window.ForkliftEngine = ForkliftEngine;
})();
