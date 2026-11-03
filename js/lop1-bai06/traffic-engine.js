// Sa bàn giao thông minh họa: xanh 3/4/5 giây, vàng 1.5 giây, đỏ 1.5 giây.
// Các khoảng cách/tốc độ là số liệu mô phỏng, không phải thông số xe ngoài đời.
(function () {
  'use strict';
  const SAMPLE = (window.LESSON && window.LESSON.sampleSig) ||
    ['start', 'repeatStart', 'sensor_green', 'motor:high', 'sensor_yellow', 'motor:low', 'sensor_red', 'stop', 'repeatEnd'];
  const LABELS = { beacon: 'Đèn ưu tiên', bumper: 'Thanh cản trước', sign: 'Biển an toàn', shield: 'Kính chắn gió' };
  const EXPECT = ['sensor_green', 'motor:high', 'sensor_yellow', 'motor:low', 'sensor_red', 'stop'];

  class TrafficEngine extends window.LessonEngine {
    constructor() {
      super({ sample: SAMPLE, labels: LABELS, baseLabel: 'Xe giao thông cơ bản',
        core: ['m1', 'm2', 'm3', 'm4'], loopEndBeforeJump: true, stopTimedOnFinish: true });
      this.done = { m2: false, m3: false, m5: false };
    }
    resetState() {
      this.greenDuration = this.greenDuration || 3;
      this.rev = 0;
      this.distance = 0;
      this.light = 'red';
      this.phase = 'idle';
      this.greenPassed = false;
      this.reachedRed = false;
      this.stoppedOnRed = false;
      this.failed = false;
      this.reason = '';
      this.events = [];
      this.loops = 0;
      this.crossedAt = null;
    }
    // Chạm vào cột đèn trong sa bàn (chế độ Nâng cao) để chọn nhịp 3 → 4 → 5 giây.
    cycleGreenDuration() {
      if (!this.advanced) return;
      this.greenDuration = this.greenDuration === 3 ? 4 : this.greenDuration === 4 ? 5 : 3;
      this.stop(true);
      this.reset();
      this.log('info', 'Pha xanh: ' + this.greenDuration + ' giây. Chạy lại để thử.');
      this.emit('duration', this.greenDuration);
      this.updateUI();
    }
    signalAt(t) {
      const cycle = .4 + this.greenDuration + 1.5 + 1.5;
      const x = t % cycle;
      return x < .4 ? 'red' : x < .4 + this.greenDuration ? 'green' :
        x < .4 + this.greenDuration + 1.5 ? 'yellow' : 'red';
    }
    rpm() {
      return this.motorOn ? 150 * this.power / 8 : 0;
    }
    pose3d() {
      return { output: this.rev * Math.PI * 2, motor: 0 };
    }
    fail(reason, message) {
      if (this.failed) return;
      this.failed = true;
      this.reason = reason;
      this.log('warn', message);
      this.emit('miss', { reason, message });
    }
    isConditionWait(b) {
      return ['sensor_green', 'sensor_yellow', 'sensor_red'].includes(b.type);
    }
    onWaitEnter(b) {
      this.phase = 'wait-' + b.type.slice(7);
      this.waitSince = this.runT;
    }
    waitStep(b, budget) { return Math.min(.02, budget); }
    waitDone(b) {
      if (this.runT - this.waitSince > 2 * (this.greenDuration + 3.4)) {
        this.fail('wrong-signal', 'Xe chờ quá lâu. Hãy xếp xanh → vàng → đỏ.');
        this.finish();
        return false;
      }
      return this.light === b.type.slice(7);
    }
    onWaitExit(b) {
      this.events.push(b.type);
      this.phase = b.type.slice(7);
      if (b.type === 'sensor_red') this.reachedRed = true;
      this.emit('signal', this.light);
    }
    onMotor(b) {
      this.events.push('motor:' + b.speed);
      this.emit('speed', this.power);
      this.noteUpgradeRun();
    }
    onStopBlock() {
      this.events.push('stop');
      this.stoppedOnRed = this.reachedRed && this.light === 'red';
      this.emit('speed', 0);
    }
    onLoopEnd() {
      this.loops++;
      const correctOrder = this.events.length === EXPECT.length &&
        this.events.every((e, i) => e === EXPECT[i]);
      if (this.matchesSample() && correctOrder && this.stoppedOnRed && !this.failed) {
        this.done.m2 = true;
        this.log('ok', '🟢 nhanh → 🟡 chậm → 🔴 dừng: đúng một chu kỳ.');
        this.emit('sampleDone');
      }
      if (this.greenDuration === 3 && this.greenPassed && !this.failed &&
          this.events[1] === 'motor:high' && this.stoppedOnRed) {
        this.done.m3 = true;
        this.emit('crossed');
        this.log('ok', 'Thỏ chạy nhanh: xe qua vạch khi đèn còn xanh!');
      }
      if (this.advanced && this.greenPassed && !this.failed && this.stoppedOnRed &&
          this.events[0] === 'sensor_green' && this.events[2] === 'sensor_yellow' &&
          this.events[4] === 'sensor_red') {
        this.done.m5 = true;
        this.emit('timing', { green: this.greenDuration, speed: this.events[1] });
        this.log('ok', this.greenDuration + ' giây: xe đi qua an toàn.');
      }
      this.best = { secs: +this.runT.toFixed(2), distance: +this.distance.toFixed(2), green: this.greenDuration };
      this.finish(); // bài mẫu có Repeat, chấm sau một chu kỳ để trẻ xem kết quả
    }
    integrate(dt) {
      if (!this.running) return;
      const previous = this.light;
      this.runT += dt;
      this.light = this.signalAt(this.runT);
      this.rev += this.rpm() / 60 * dt * this.dir;
      if (this.motorOn) this.distance += (this.power / 8 * 1.16) * dt;
      if (this.distance >= 2.1 && this.crossedAt === null) {
        this.crossedAt = this.runT;
        this.greenPassed = previous === 'green' && this.light === 'green';
        if (this.greenPassed) this.emit('crossing', { time: this.runT });
      }
      if (previous === 'green' && this.light === 'yellow' && !this.greenPassed && this.motorOn) {
        this.fail('too-slow', '🐢 Xe chưa qua vạch! Chọn thỏ nhanh, hoặc thử đèn xanh lâu hơn.');
      }
    }
    updateUI() {
      super.updateUI();
      this.set('m-traffic-speed', this.motorOn ? this.power + ' <small>mức</small>' : '0 <small>mức</small>');
      this.set('m-traffic-green', this.greenDuration + ' <small>giây</small>');
      this.set('m-traffic-distance', this.distance.toFixed(2) + ' <small>m</small>');
    }
  }

  window.TrafficEngine = TrafficEngine;
})();
