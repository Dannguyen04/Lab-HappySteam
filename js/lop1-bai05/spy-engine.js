// Spy Robot: hai lượt cảm biến -> mặt LED, giai điệu, tay vẫy theo hai chiều.
// Mọi cự ly và thời điểm là sa bàn minh họa để học sinh tự thử và thấy kết quả.
(function () {
  'use strict';

  const RPM = 150;
  const SAMPLE = [
    'start', 'repeatStart', 'sensor_obstacle', 'display:smile', 'melody:A',
    'motor:high:cw', 'wait:1', 'sensor_obstacle', 'display:wink', 'melody:B',
    'motor:high:ccw', 'wait:1', 'repeatEnd'
  ];
  const sig = b => b.type === 'display' ? 'display:' + b.icon
    : b.type === 'melody' ? 'melody:' + b.tune
      : b.type === 'motor' ? 'motor:' + b.speed + ':' + (b.dir || 'cw')
        : b.type === 'wait' ? 'wait:' + b.duration : b.type;
  const UPGRADE_NAMES = {
    glasses: 'Kính điệp viên', antennas: 'Ăng-ten kép',
    hat: 'Mũ đặc nhiệm', badge: 'Huy hiệu sao'
  };

  class SpyEngine extends window.LessonEngine {
    constructor() {
      super({
        sample: SAMPLE, sig, labels: UPGRADE_NAMES, baseLabel: 'Spy Robot cơ bản',
        touch: [], loopEndBeforeJump: true, stopTimedOnFinish: true,
        core: ['m1', 'm2', 'm3', 'm4']
      });
      this.done = { m2: false, m3: false, m5: false };
    }

    resetState() {
      this.rev = 0;
      this.face = 'neutral';
      this.waving = false;
      this.phase = 'idle';
      this.sensorElapsed = 0;
      this.distance = 80;
      this.detected = 0;
      this.manualWave = false;
      this.lastObject = null;
      this.events = [];
      this.failed = false;
      this.reason = '';
      this.loops = 0;
      this.rangeUsed = [];
    }
    rpm() {
      return this.waving && this.motorOn ? RPM * this.power / 8 : 0;
    }
    pose3d() {
      return { output: this.rev * 2 * Math.PI, motor: 0 };
    }
    press() {
      // Bàn tay trên cảnh minh họa là bạn vẫy cách cảm biến 28 cm.
      if (this.running && this.phase === 'searching') {
        this.manualWave = true;
        this.distance = 28;
        this.emit('press');
      }
    }
    fail(reason, message) {
      if (this.failed) return;
      this.failed = true;
      this.reason = reason;
      this.log('warn', message);
      this.emit('miss', { reason, message });
    }
    isConditionWait(b) {
      return b.type === 'sensor_obstacle';
    }
    onWaitEnter() {
      this.phase = 'searching';
      this.sensorElapsed = 0;
      this.manualWave = false;
      this.distance = 80;
      this.lastObject = null;
      this.emit('looking', { greeting: this.detected === 0 });
    }
    distanceAt(t) {
      if (this.manualWave) return 28;
      if (t >= 0.45 && t < 0.85) return 45; // người đi ngang
      if (t >= 1.2) return 28; // bạn đến/vẫy tay chào tạm biệt
      return 80;
    }
    waitStep(b, budget) {
      return Math.min(0.025, budget);
    }
    waitDone(b) {
      const range = Number.isFinite(b.range) ? b.range : 30;
      if (this.distance <= range) {
        this.lastObject = this.distance === 45 ? 'passerby' : 'friend';
        if (this.lastObject === 'passerby') {
          this.fail('false-positive', '50 cm: robot chào nhầm người đi ngang! Hãy thử 30 cm.');
        }
        return true;
      }
      if (this.sensorElapsed >= 3.1) {
        this.fail('missed-friend', '20 cm: robot không thấy bạn đang chờ ở 28 cm. Hãy thử 30 cm.');
        this.finish();
      }
      return false;
    }
    onWaitExit(b) {
      this.rangeUsed.push(Number.isFinite(b.range) ? b.range : 30);
      this.detected++;
      this.phase = this.detected === 1 ? 'greeting' : 'farewell';
      this.events.push('sensor_obstacle');
      this.emit('friend', { kind: this.lastObject, greeting: this.detected === 1 });
      this.log(this.lastObject === 'friend' ? 'ok' : 'warn',
        this.lastObject === 'friend'
          ? (this.detected === 1 ? 'Phát hiện bạn đến: chuẩn bị chào!' : 'Bạn vẫy lần hai: chuẩn bị tạm biệt!')
          : 'Cảm biến nhận nhầm người đi ngang.');
    }
    onInstant(b) {
      if (b.type !== 'display') return false;
      this.face = b.icon;
      this.events.push(sig(b));
      this.emit('face', b.icon);
      return true;
    }
    onTimedEnter(b) {
      if (b.type === 'melody') this.events.push(sig(b));
    }
    onMotor(b) {
      this.dir = b.dir === 'ccw' ? -1 : 1;
      this.waving = true;
      this.events.push(sig(b));
      this.emit('wave', { dir: this.dir, speed: this.power, greeting: this.detected === 1 });
      this.noteUpgradeRun();
    }
    onTimedExit(b) {
      if (b.type !== 'wait') return;
      this.events.push(sig(b));
      this.waving = false;
      this.emit('waveDone', { greeting: this.detected === 1, seconds: b.duration });
      if (this.detected === 1 && b.duration < 2) {
        this.log('warn', 'Chờ 1 giây: chào quá vội! Đổi khối Chờ đầu tiên thành 2 giây.');
      }
    }
    onStopBlock() {
      this.waving = false;
    }
    onLoopEnd() {
      this.loops++;
      const expected = SAMPLE.slice(2, -1);
      const fullGreeting = this.events.length === expected.length &&
        this.events.every((v, i) => v === expected[i] || (i === 4 && v === 'wait:2'));
      const properSample = this.matchesSample() || this.matchesSample(
        SAMPLE.map((v, i) => i === 6 ? 'wait:2' : v));
      const complete = this.detected === 2 && fullGreeting && properSample && !this.failed;
      if (complete) {
        this.done.m2 = true;
        this.emit('sampleDone');
        this.log('ok', 'Đã chào và tạm biệt đúng biểu cảm, nhạc và chiều vẫy tay.');
        if (this.events[4] === 'wait:2') {
          this.done.m3 = true;
          this.log('ok', 'Chờ 2 giây: bạn có đủ thời gian đáp lời chào!');
          this.emit('friendlyWave');
        }
        if (this.advanced && this.rangeUsed.length === 2 &&
            this.rangeUsed.every(n => n === 30)) {
          this.done.m5 = true;
          this.emit('sensorMaster');
          this.log('ok', '30 cm: thấy bạn ở 28 cm, bỏ qua người đi ngang 45 cm.');
        }
        this.best = { secs: +this.runT.toFixed(1), greetings: 2 };
      }
      this.finish(); // kết thúc sau một vòng để học sinh thấy kết quả rõ ràng
    }
    integrate(dt) {
      if (!this.running) return;
      this.runT += dt;
      this.rev += (this.rpm() / 60) * dt * this.dir;
      if (this.phase === 'searching') {
        this.sensorElapsed += dt;
        this.distance = this.distanceAt(this.sensorElapsed);
      }
    }
    updateUI() {
      super.updateUI();
      this.set('m-spy-distance', Math.round(this.distance));
      this.set('m-spy-speed', this.waving ? this.power : 0);
      this.set('m-spy-time', this.runT.toFixed(1));
    }
  }
  window.SpyEngine = SpyEngine;
})();
