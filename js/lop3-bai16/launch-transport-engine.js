// Bộ mô phỏng Bài 16 lớp 3 – Xe chở tên lửa vũ trụ. Phần chung (chạy khối, vòng lặp, nhật ký, nhiệm vụ) ở js/lesson-engine.js;
// ở đây chỉ viết vật lý của mô hình và cách chấm m2, m3, m5.
// Quãng đường tính bằng cm: bánh sau bán kính 2,5 cm, động cơ mức 8 quay 150 vòng/phút → 39,3 cm/giây.
// Bệ phóng cách cửa xưởng 1 giây (Gần), 2 giây (Vừa) hay 3 giây (Xa) chạy nhanh.
(function () {
  'use strict';

  const RADIUS = 2.5, RPM = 150, TOL = 5, TRACK_END = 150;
  const SPEED = p => (2 * Math.PI * RADIUS * RPM * p) / (8 * 60);
  const PADS = { near: SPEED(8) * 1, mid: SPEED(8) * 2, far: SPEED(8) * 3 };
  const PAD_NAMES = { near: 'Gần', mid: 'Vừa', far: 'Xa' };
  const PAD_SEQ = ['mid', 'far', 'near']; // Nâng cao: mỗi lượt bấm Chạy là một cự ly khác, thứ tự cố định để kiểm chứng được
  const SAMPLE = ['start', 'repeatStart', 'display', 'melody', 'motor:high', 'wait:3', 'stop', 'display', 'melody', 'repeatEnd'];
  const LAUNCH_SECONDS = 2.6;

  class LaunchTransportEngine extends window.LessonEngine {
    constructor() {
      super({
        sample: SAMPLE,
        labels: { solarPanel: 'Pin mặt trời', antenna: 'Ăng-ten vệ tinh', dualHeadlights: 'Đèn pha kép', frontShield: 'Tấm chắn trước' },
        baseLabel: 'Xe chở tên lửa cơ bản', core: ['m1', 'm2', 'm3', 'm4']
      });
      this.done = { m2: false, m3: false, m5: false };
    }
    resetState() {
      this.runCount = this.runCount || 0;
      this.x = 0; // cm tính từ cửa nhà xưởng
      this.rev = 0;
      this.loops = 0;
      this.led = 'idle'; // idle | smile | sad
      this.judged = false;
      this.launched = false;
      this.launchAt = -1;
      this.failed = false;
      this.reason = '';
      this.skid = false;
      this.melodyTune = '';
      this.melodyUntil = -1;
      this.padKey = this.advanced ? PAD_SEQ[(Math.max(1, this.runCount) - 1) % PAD_SEQ.length] : 'mid';
      this.padCm = PADS[this.padKey];
      this.okPads = this.okPads || new Set();
    }
    setAdvanced(on) {
      if (!!on !== this.advanced) this.runCount = 0;
      super.setAdvanced(on);
    }
    start() {
      this.runCount = (this.runCount || 0) + 1;
      super.start();
    }
    speed() { return this.motorOn ? SPEED(this.power) * this.dir : 0; }
    padName() { return PAD_NAMES[this.padKey]; }
    launchProgress(now = this.t) {
      return this.launched ? Math.max(0, Math.min(1, (now - this.launchAt) / LAUNCH_SECONDS)) : 0;
    }
    pose3d() {
      return { output: this.rev * Math.PI * 2, motor: 0 };
    }
    onMotor() {
      this.emit('speed', this.power);
      this.noteUpgradeRun();
    }
    onInstant(b) {
      if (b.type !== 'display') return false;
      this.led = b.icon === 'sad' ? 'sad' : 'smile';
      return true;
    }
    enterBlock(b) {
      if (b.type === 'melody') {
        this.melodyTune = b.tune || 'A';
        this.melodyUntil = this.t + 1;
      }
      return super.enterBlock(b);
    }
    // Phanh xong là chấm: dừng đúng ô thì tên lửa phóng, sai thì xe báo mặt buồn.
    onStopBlock(wasOn) {
      this.emit('speed', 0);
      if (!wasOn || this.judged || this.x < 1) return;
      this.judged = true;
      const d = this.x - this.padCm;
      if (Math.abs(d) <= TOL) {
        this.launched = true;
        this.launchAt = this.t;
        this.okPads.add(this.padKey);
        this.log('ok', `Xe dừng đúng ô bệ phóng (lệch ${Math.abs(d).toFixed(1)} cm). Tên lửa vũ trụ cất cánh!`);
        this.emit('launch', { pad: this.padKey, secs: +this.runT.toFixed(1) });
        if (this.padKey === 'mid') this.done.m3 = true;
        if (this.advanced && ['near', 'mid', 'far'].every(k => this.okPads.has(k))) this.done.m5 = true;
        this.best = { secs: +this.runT.toFixed(1), pad: this.padKey };
        this.checkMissions();
      } else {
        this.fail(d > 0 ? 'over' : 'short',
          d > 0 ? `Xe chạy quá bệ phóng ${d.toFixed(1)} cm. Giảm thời gian ở khối Chờ.`
            : `Xe dừng thiếu ${(-d).toFixed(1)} cm. Tăng thời gian ở khối Chờ.`);
        if (d > 0) this.skid = true;
      }
    }
    fail(reason, message) {
      if (this.failed) return;
      this.failed = true;
      this.reason = reason;
      this.led = 'sad';
      this.log('warn', message);
      this.emit('miss', { reason, message });
    }
    onLoopEnd() {
      this.loops++;
      if (this.loops === 1 && this.matchesSample() && !this.done.m2) {
        this.done.m2 = true;
        this.log('ok', 'Chương trình chạy đúng như trong sách.');
        this.emit('sampleDone');
        this.checkMissions();
      }
      if (this.launched) {
        this.finish();
        return;
      }
      // Vòng sau: xe quay về cửa xưởng, thử lại
      this.x = 0;
      this.rev = 0;
      this.judged = false;
      this.failed = false;
      this.skid = false;
    }
    integrate(dt) {
      if (!this.running || dt <= 0) return;
      this.runT += dt;
      if (this.motorOn) {
        const dist = this.speed() * dt;
        this.x += dist;
        this.rev += dist / (2 * Math.PI * RADIUS);
        if (this.x > TRACK_END) {
          this.x = TRACK_END;
          this.fail('boundary', 'Xe đã chạy ra khỏi cuối đường lăn. Hãy thêm khối Dừng và giảm thời gian chờ.');
          this.finish();
        }
      }
    }
    updateUI() {
      super.updateUI();
      const left = this.padCm - this.x;
      const secs = this.padCm / SPEED(8);
      this.set('m-speed', `${Math.abs(this.speed()).toFixed(1)} <small>cm/giây</small>`);
      this.set('m-speed-note', this.motorOn ? `Mức ${this.power} · ${this.dir > 0 ? 'tiến' : 'lùi'}` : 'Xe đang dừng');
      this.set('m-dist', `${Math.abs(left).toFixed(1)} <small>cm</small>`);
      this.set('m-dist-note', Math.abs(left) <= TOL ? 'Trong ô bệ phóng' : left > 0 ? 'Chưa tới bệ phóng' : 'Đã vượt bệ phóng');
      this.set('m-pad', this.padName());
      this.set('m-pad-note', this.advanced ? 'Mỗi lượt chạy một cự ly' : 'Gần · Vừa · Xa');
      this.set('m-time', `${this.runT.toFixed(1)} <small>giây</small>`);
      this.set('m-time-note', `Cần khoảng ${secs.toFixed(1)} giây ở mức nhanh`);
      this.set('calc-eq1', `Mức nhanh (8): ${SPEED(8).toFixed(1)} cm/giây. Bệ ${this.padName()} cách xưởng ${this.padCm.toFixed(1)} cm.`);
      this.set('calc-eq2', `Thời gian = quãng đường ÷ tốc độ = ${this.padCm.toFixed(1)} ÷ ${SPEED(8).toFixed(1)} ≈ ${secs.toFixed(1)} giây (cho phép lệch ±${TOL} cm).`);
    }
  }
  LaunchTransportEngine.SAMPLE = SAMPLE;
  LaunchTransportEngine.PADS = PADS;
  LaunchTransportEngine.SPEED = SPEED;
  LaunchTransportEngine.TOL = TOL;
  window.LaunchTransportEngine = LaunchTransportEngine;
})();
