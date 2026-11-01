// Phi thuyền lăn bánh trên đường băng. Đơn vị mô phỏng học tập: cm và giây.
(function () {
  'use strict';
  const RUNWAY = 41;
  const ACCEL = { low: 0.6, medium: 1, high: 1.7 };
  const WORLDS = [
    { name: 'Mặt Trăng', traction: 0.78, takeoff: 7.6 },
    { name: 'Sao Hỏa', traction: 1, takeoff: 10.5 },
    { name: 'Tiểu hành tinh', traction: 0.62, takeoff: 7.3 }
  ];
  const EARTH = { name: 'Đường băng chuẩn', traction: 1, takeoff: 10.5 };
  const SAMPLE = [
    'start', 'melody:B', 'repeatStart', 'motor:low:ccw', 'wait:3',
    'motor:medium:ccw', 'wait:3', 'motor:high:ccw', 'wait:3', 'repeatEnd'
  ];
  const sig = b => b.type === 'motor' ? `motor:${b.speed}:${b.dir || 'cw'}`
    : b.type === 'melody' ? `melody:${b.tune}`
      : b.type === 'wait' ? `wait:${Number(b.duration)}` : b.type;

  class RocketEngine extends window.LessonEngine {
    constructor() {
      super({ sample: SAMPLE, sig, labels: {
        wings: 'Cánh phụ thăng bằng', boosters: 'Cụm động cơ đẩy',
        radar: 'Ăng-ten radar', legs: 'Chân đáp giảm chấn'
      }, baseLabel: 'Phi thuyền cơ bản' });
      this.done = { m2: false, m3: false, m5: false };
      this.launchCount = 0;
      this.worldWins = new Set();
    }
    resetState() {
      this.x = 0;
      this.v = 0;
      this.rev = 0;
      this.stage = 'idle';
      this.world = this.advanced ? WORLDS[(this.launchCount || 0) % 3] : EARTH;
      this.worldIndex = this.advanced ? (this.launchCount || 0) % 3 : -1;
      this.reason = '';
      this.loops = 0;
      this.melodies = 0;
      this.motorSpeed = 'low';
      this.braking = false;
    }
    onStart() {
      if (this.advanced) {
        this.worldIndex = this.launchCount % 3;
        this.world = WORLDS[this.worldIndex];
      } else {
        this.worldIndex = -1;
        this.world = EARTH;
      }
      this.launchCount++;
      this.stage = 'rolling';
      this.emit('world', { name: this.world.name, round: this.launchCount });
    }
    onMotor(b) {
      this.motorSpeed = b.speed || 'high';
      this.dir = b.dir === 'ccw' ? 1 : -1; // M1 lắp ngược: ccw đẩy tàu tới trước
      this.noteUpgradeRun();
      this.emit('speed', this.power);
    }
    onStopBlock() { this.emit('speed', 0); }
    enterBlock(b) {
      if (b.type === 'melody') this.melodies++;
      return super.enterBlock(b);
    }
    boost() {
      return 1 + (this.has('wings') ? 0.02 : 0) + (this.has('boosters') ? 0.08 : 0)
        - (this.has('radar') ? 0.02 : 0) - (this.has('legs') ? 0.03 : 0);
    }
    pose3d() {
      return { output: -this.rev * Math.PI * 2, offset: [this.x * 0.002, this.stage === 'airborne' ? 0.04 : 0, 0] };
    }
    integrate(dt) {
      if (!this.running) return;
      this.runT += dt;
      if (!this.motorOn || dt <= 0) return;
      const a = ACCEL[this.motorSpeed] * this.world.traction * this.boost() * this.dir;
      const nextV = Math.max(0, this.v + a * dt);
      const nextX = this.x + (this.v + nextV) * dt / 2;
      this.rev += nextX - this.x;
      this.v = nextV;
      this.x = nextX;
      if (this.v >= this.world.takeoff && this.x < RUNWAY) {
        this.stage = 'airborne';
        this.done.m3 = true;
        // Cất cánh ngay trong khối Chờ cuối của mẫu 3-3-3 vẫn tính là đã chạy hết vòng mẫu
        if (this.matchesSample() && this.pc >= this.prog.length - 2) this.done.m2 = true;
        if (this.advanced) {
          this.worldWins.add(this.worldIndex);
          this.done.m5 = this.worldWins.size === WORLDS.length;
        }
        this.log('ok', `Đủ tốc ${this.v.toFixed(1)} cm/giây ở mốc ${this.x.toFixed(1)} cm: phi thuyền cất cánh!`);
        this.emit('takeoff', { world: this.world.name, x: this.x, speed: this.v });
        super.finish();
      } else if (this.x >= RUNWAY) {
        this.x = RUNWAY - 0.5;
        this.brake('fence', 'Chưa đủ tốc trước hàng rào: phi thuyền phanh gấp! Hãy đổi thời gian chạy các cấp.');
      }
    }
    brake(reason, message) {
      this.stage = 'braking';
      this.braking = true;
      this.reason = reason;
      this.v = 0;
      this.log('warn', message);
      this.emit('brake', { reason, message });
      super.finish();
    }
    onLoopEnd() {
      this.loops++;
      if (this.matchesSample()) {
        this.done.m2 = true;
        this.emit('sampleDone');
        this.log('ok', 'Đã chạy hết một vòng đúng 10 khối mẫu.');
      }
      if (this.stage !== 'airborne') this.brake('slow', 'Hết một vòng vẫn thiếu tốc: phi thuyền phanh trước hàng rào. Tăng thời gian Chờ ở cấp Nhanh.');
      this.checkMissions();
    }
    updateUI() {
      super.updateUI();
      this.set('m-speed', `${this.v.toFixed(1)}<small>cm/giây</small>`);
      this.set('m-dist', `${this.x.toFixed(1)}<small>/ ${RUNWAY} cm</small>`);
      this.set('m-gravity', this.world.name);
      this.set('m-time', `${this.runT.toFixed(1)}<small>giây</small>`);
      this.set('m-speed-note', `Cất cánh từ ${this.world.takeoff.toFixed(1)} cm/giây`);
      this.set('m-dist-note', this.stage === 'airborne' ? 'Đã rời đường băng' : 'Hàng rào ở mốc 41 cm');
      this.set('m-gravity-note', `Gia tốc × ${this.world.traction.toFixed(2)} · phụ kiện × ${this.boost().toFixed(2)}`);
      this.set('calc-eq1', `Môi trường: ${this.world.name} · cần ${this.world.takeoff.toFixed(1)} cm/giây trước 41 cm.`);
      this.set('calc-eq2', `Đã chạy ${this.x.toFixed(1)} cm · vận tốc ${this.v.toFixed(1)} cm/giây.`);
    }
  }
  RocketEngine.RUNWAY = RUNWAY;
  RocketEngine.WORLDS = WORLDS;
  window.RocketEngine = RocketEngine;
})();
