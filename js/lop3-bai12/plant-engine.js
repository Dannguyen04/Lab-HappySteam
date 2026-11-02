// Lớp 3 · Bài 12: mô phỏng hai cổng M1 (bánh xe), M2 (khung gắp), cảm biến và bão bụi.
// Đơn vị chuyển động là cm/giây. Các lượt và thời tiết cố định để kết quả có thể kiểm chứng.
(function () {
  'use strict';

  const RADIUS = 2.5, RPM = 150, SENSOR = 10, GRIP_REACH = 11.5, BED_TOL = 8;
  const POT_KID = [88, 91, 90], POT_PRO = [88, 94, 82];
  const STORM_SECONDS = [1.3, 1.9, 1.5];
  const timedDurations = new WeakMap();
  const SPEED = p => (2 * Math.PI * RADIUS * RPM * p) / (8 * 60);
  const SAMPLE = [
    'start', 'repeatStart', 'motor:M1:low:cw', 'sensor_obstacle', 'stop',
    'melody:A', 'motor:M2:low:cw', 'wait:1', 'stop',
    'motor:M1:low:ccw', 'wait:3', 'stop', 'repeatEnd'
  ];
  const sig = b => b.type === 'motor'
    ? `motor:${b.port || 'M1'}:${b.speed || 'high'}:${b.dir || 'cw'}`
    : b.type === 'melody' ? `melody:${b.tune || ''}`
      : b.type === 'wait' ? `wait:${Number(b.duration || 3)}` : b.type;

  class PlantEngine extends window.LessonEngine {
    get blkDur() { return timedDurations.get(this) || 0; }
    set blkDur(value) { timedDurations.set(this, value); }
    constructor() {
      super({ sample: SAMPLE, sig, labels: {
        wideArm: 'Khung gắp rộng', watering: 'Bình tưới', lamp: 'Đèn chiếu cây', solar: 'Pin mặt trời'
      }, baseLabel: 'Robot trồng cây cơ bản', touch: [], advanceGuard: 65,
      loopEndBeforeJump: true, stopTimedOnFinish: true });
      this.done = { m2: false, m3: false, m5: false };
    }

    course() { return this.advanced ? POT_PRO : POT_KID; }
    resetState() {
      this.x = 0;
      this.rev = 0;
      this.armDown = 0;
      this.armMotor = false;
      this.motorPort = null;
      this.loops = 0;
      this.stormT = 0;
      this.stormNumber = 0;
      this.failed = false;
      this.reason = '';
      this.held = null;
      this.grabbed = false;
      this.melodies = 0;
      this.pots = this.course().map((a, i) => ({ a, number: i + 1, state: 'waiting', grow: 0, size: 'small' }));
    }
    // Đặt lại vị trí chậu theo số lượt, không phụ thuộc may rủi/refresh.
    current() { return this.pots[this.loops] || null; }
    got() { return this.pots.filter(p => p.state === 'planted').length; }
    seen() {
      const p = this.current();
      return p && p.state === 'waiting' && p.a - this.x >= 0 && p.a - this.x <= SENSOR ? p : null;
    }
    press() {} // Bài này dùng cảm biến siêu âm, không dùng nút chạm.
    speed() { return this.motorOn && this.motorPort === 'M1' ? SPEED(this.power) * this.dir : 0; }
    pose3d() {
      return {
        output: -this.rev * Math.PI * 2,
        tilt: -this.armDown * Math.PI / 2,
        offset: [this.x * 0.0015, 0, 0]
      };
    }
    fail(reason, message) {
      if (this.failed) return;
      this.failed = true;
      this.reason = reason;
      this.log('warn', message);
      this.emit('miss', { reason, message });
    }

    // Giữ ngữ nghĩa hai cổng: Stop dừng cổng đang chạy, không biến M2 thành xe chạy.
    onMotor(b) {
      this.motorPort = b.port || 'M1';
      this.motorOn = true;
      this.armMotor = this.motorPort === 'M2';
      this.dir = b.dir === 'ccw' ? -1 : 1;
      this.noteUpgradeRun();
      if (this.motorPort === 'M1') {
        if (this.advanced && this.stormT > 0) {
          const pot = this.current();
          if (pot && pot.state === 'waiting') pot.state = 'fallen';
          if (this.held) this.held.state = 'fallen';
          this.fail('storm', 'Xe chạy khi bão bụi chưa tan: chậu cây bị đổ. Hãy dùng Đợi đường trống.');
          this.finish();
        } else if (this.dir > 0 && this.held) {
          this.held.state = 'fallen';
          this.held = null;
          this.fail('direction', 'Xe tiến khi đang gắp chậu; hãy lùi về luống.');
        }
      }
    }
    onStopBlock() {
      const port = this.motorPort;
      this.motorOn = false;
      this.armMotor = false;
      this.motorPort = null;
      if (port === 'M2') {
        const pot = this.current();
        if (this.armDown < 0.95) {
          this.fail('arm', 'Khung gắp chưa hạ đủ; cần cho M2 chạy khoảng một giây.');
        } else if (!pot || pot.state !== 'waiting' || pot.a - this.x < 0 || pot.a - this.x > GRIP_REACH) {
          if (pot && pot.state === 'waiting') pot.state = 'fallen';
          this.fail('early', 'Hạ khung quá sớm hoặc đã đi qua chậu: chậu cây bị đổ.');
        } else {
          pot.state = 'held';
          this.held = pot;
          this.grabbed = true;
          this.emit('picked', { pot, count: pot.number });
          this.log('ok', `Đã gắp chậu ${pot.number}/3; lùi về luống trồng.`);
        }
      } else if (port === 'M1' && this.dir < 0 && this.grabbed) {
        this.drop();
      }
    }
    drop() {
      const pot = this.held;
      this.held = null;
      this.grabbed = false;
      if (!pot) return;
      if (Math.abs(this.x) > BED_TOL) {
        pot.state = 'fallen';
        this.fail('landing', `Lùi thiếu hoặc quá vị trí luống (${this.x.toFixed(1)} cm). Hãy chỉnh thời gian chờ sau M1 lùi.`);
        return;
      }
      pot.state = 'planted';
      pot.grow = 0;
      this.emit('planted', { pot, count: this.got() });
      this.log('ok', `Đã trồng chậu ${pot.number}/3 vào đúng luống!`);
      if (this.got() === 3) {
        this.done.m3 = true;
        if (this.advanced && !this.failed && this.loops === 2) this.done.m5 = true;
        this.best = { secs: +this.runT.toFixed(1), planted: 3, storms: this.stormNumber };
        this.emit('allPlanted', this.best);
        this.checkMissions();
      }
    }

    // Đánh dấu M2 sau khi ĐÃ chạy hết 13 khối của vòng đầu (kể cả chương trình vừa chạy sai vật lý).
    onLoopEnd() {
      this.loops++;
      if (this.loops === 1 && this.matchesSample() && !this.done.m2) {
        this.done.m2 = true;
        this.emit('sampleDone');
        this.checkMissions();
      }
      if (this.done.m3 || this.failed || this.loops >= this.pots.length) {
        this.finish();
        return;
      }
      // Về vạch xuất phát để tính lại quãng lùi; luống thực tế có ba ô cạnh nhau.
      this.x = 0;
      this.armDown = 0;
      this.held = null;
      this.grabbed = false;
      if (this.advanced) {
        this.stormT = STORM_SECONDS[(this.loops - 1) % STORM_SECONDS.length] * (this.has('solar') ? 0.8 : 1);
        this.stormNumber++;
        this.emit('stormStart', { seconds: this.stormT, round: this.loops + 1 });
      }
    }

    integrate(dt) {
      if (!this.running || dt <= 0) return;
      const steps = Math.max(1, Math.ceil(dt / 0.02));
      for (let i = 0; i < steps && this.running; i++) {
        const d = dt / steps;
        this.runT += d;
        if (this.stormT > 0) {
          const before = this.stormT;
          this.stormT = Math.max(0, this.stormT - d);
          if (before > 0 && this.stormT === 0) this.emit('stormEnd');
        }
        if (this.motorOn && this.motorPort === 'M1') {
          const dist = this.speed() * d;
          this.x += dist;
          this.rev += dist / (2 * Math.PI * RADIUS);
          if (this.x > 125 || this.x < -20) {
            this.fail('boundary', 'Xe đã ra khỏi đường chạy an toàn.');
            this.finish();
          }
        } else if (this.motorOn && this.motorPort === 'M2') {
          this.armDown = Math.max(0, Math.min(1, this.armDown + d * (this.power / 4) * (this.dir > 0 ? 1 : -1)));
        }
        const rate = (this.has('watering') ? 0.65 : 0.2) + (this.has('lamp') ? 0.35 : 0);
        for (const p of this.pots) if (p.state === 'planted') p.grow = Math.min(1, p.grow + d * rate);
      }
      // Vòng cũ coi khối đủ thời lượng trong sai số 1e-8, không chạy thêm bước cực nhỏ.
      if (this.entered && ['wait', 'melody'].includes(this.prog[this.pc]?.type)) {
        if (this.running && this.blkDur - this.blkT > 0 && this.blkDur - this.blkT < 1e-8) this.blkT = this.blkDur;
        // Khi vật lý kết thúc đúng bước cuối, vòng cũ vẫn cộng bước đó vào blkT.
        if (!this.running && Math.abs(this.blkT + dt - this.blkDur) < 1e-8) this.blkT = this.blkDur;
      }
    }

    beforeAdvance(dt) { return Math.max(0, dt); }
    shouldYieldLoop(r, end, budget) { return budget <= 0; }
    isConditionWait(b) { return b.type === 'sensor_obstacle' || b.type === 'wait_clear'; }
    waitDone(b) { return b.type === 'wait_clear' ? this.stormT <= 0 : !!this.seen(); }
    // Chia nhỏ bước chạy để xe không vượt qua ngưỡng cảm biến 10 cm.
    waitStep(b, budget) { return Math.min(0.02, budget); }
    onWaitExit(b) {
      if (b.type === 'sensor_obstacle') {
        const pot = this.seen();
        this.emit('found', { pot, distance: pot.a - this.x });
      }
    }
    onTimedEnter(b) {
      if (b.type === 'melody') {
        this.melodies++;
        if (window.SFX?.melody) window.SFX.melody(b.tune);
        this.emit('melody', b.tune);
      }
    }
    onTimedExit() { this.blkT = this.blkDur; }
    enterBlock(b) {
      if (b.type === 'melody') return 1;
      if (b.type === 'wait') return Number(b.duration || 3);
      return super.enterBlock(b);
    }

    updateUI() {
      super.updateUI();
      const pill = document.getElementById('sim-status-pill');
      if (pill) {
        pill.textContent = this.failed ? 'Chậu bị đổ' : this.stormT > 0 ? 'Đang bão bụi' : this.motorOn ? `Đang chạy ${this.motorPort}` : this.running ? 'Đang đợi' : 'Đã dừng';
        pill.dataset.k = this.failed ? 'warn' : this.running ? 'ok' : 'muted';
      }
      const pot = this.current();
      this.set('m-speed', `${Math.abs(this.speed()).toFixed(1)} <small>cm/giây</small>`);
      this.set('m-speed-note', this.motorOn ? `${this.motorPort} · mức ${this.power} · ${this.dir > 0 ? 'tiến/hạ' : 'lùi/nâng'}` : 'Động cơ đã dừng');
      this.set('m-dist', `${pot ? (pot.a - this.x).toFixed(1) : '0'} <small>cm</small>`);
      this.set('m-dist-note', pot ? `Chậu ${pot.number}/3 · ngưỡng cảm biến ${SENSOR} cm` : 'Đã chuyển hết chậu');
      this.set('m-water', `${this.got()} <small>/ 3 cây</small>`);
      this.set('m-water-note', this.failed ? this.reason : this.held ? 'Đang ôm chậu' : 'Luống trồng');
      this.set('m-time', `${this.runT.toFixed(1)} <small>giây</small>`);
      this.set('m-time-note', this.stormT > 0 ? `Bão còn ${this.stormT.toFixed(1)} giây` : 'Đường thông thoáng');
      const desc = document.getElementById('sim-status-desc');
      if (desc) desc.textContent = this.failed ? this.logs[0]?.text || 'Chậu bị đổ.' : this.done.m3 ? 'Đã trồng đủ ba chậu cây!' : `Đã trồng ${this.got()}/3 chậu; xe ở ${this.x.toFixed(0)} cm.`;
      this.set('calc-eq1', `M1 mức 4: ${SPEED(4).toFixed(1)} cm/giây; mức 6: ${SPEED(6).toFixed(1)}; mức 8: ${SPEED(8).toFixed(1)}. Quãng đường = tốc độ × thời gian.`);
      this.set('calc-eq2', `Cảm biến phát hiện ở ${SENSOR} cm. Đặt chậu đúng luống ±${BED_TOL} cm; Nâng cao có bão theo lượt, hãy dùng Đợi đường trống.`);
    }
  }
  PlantEngine.SAMPLE = SAMPLE;
  PlantEngine.POT_KID = POT_KID;
  PlantEngine.POT_PRO = POT_PRO;
  PlantEngine.SENSOR = SENSOR;
  PlantEngine.SPEED = SPEED;
  window.PlantEngine = PlantEngine;
})();
