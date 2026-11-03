// Cổng thông minh: hai lần nhận khách, LED GO/↓, động cơ M1 mở rồi khép cổng.
// Cự ly và tốc độ là sa bàn minh họa, không phải số đo phần cứng.
(function () {
  'use strict';
  const SAMPLE = ['start','repeatStart','sensor_obstacle','display:go','motor:high:ccw:M1',
    'wait:0.2','stop','sensor_obstacle','display:down','motor:high:cw:M1','wait:0.2','stop','repeatEnd'];
  const sig = b => b.type === 'display' ? 'display:' + b.icon
    : b.type === 'motor' ? 'motor:' + b.speed + ':' + (b.dir || 'cw') + ':' + (b.port || 'M1')
      : b.type === 'wait' ? 'wait:' + b.duration : b.type;
  const LABELS = { canopy:'Mái hiên che mưa', led:'Đèn cổng xanh GO',
    number:'Biển số nhà', flowers:'Hàng rào hoa' };

  class GateEngine extends window.LessonEngine {
    constructor() {
      super({sample:SAMPLE, sig, labels:LABELS, baseLabel:'Cổng thông minh cơ bản',
        core:['m1','m2','m3','m4'], touch:[], loopEndBeforeJump:true, stopTimedOnFinish:true});
      this.done = {m2:false,m3:false,m5:false};
    }
    resetState() {
      this.rev = 0; this.gateOpen = 0; this.phase = 'idle'; this.led = 'off';
      this.distance = 80; this.sensorElapsed = 0; this.manualGuest = false;
      this.detected = 0; this.lastObject = ''; this.events = []; this.rangeUsed = [];
      this.childCrossed = false; this.failed = false; this.reason = ''; this.loops = 0;
    }
    rpm() { return this.motorOn ? this.power * 18.75 : 0; }
    pose3d() { return {output:this.rev * Math.PI * 2, motor:this.gateOpen * 1.3}; }
    press() {
      if (this.running && this.phase === 'searching') {
        this.manualGuest = true; this.distance = 17; this.emit('press');
      }
    }
    fail(reason, message) {
      if (this.failed) return;
      this.failed = true; this.reason = reason;
      this.log('warn',message); this.emit('miss',{reason,message});
    }
    isConditionWait(b) { return b.type === 'sensor_obstacle'; }
    onWaitEnter() {
      this.phase = 'searching'; this.sensorElapsed = 0; this.distance = 80;
      this.manualGuest = false; this.lastObject = '';
      this.emit('looking',{next:this.detected + 1});
    }
    waitStep(b,budget) { return Math.min(.025,budget); }
    distanceAt(t) {
      if (this.manualGuest) return 17;
      if (t >= .35 && t < .7) return 45; // Người đi ngang sân.
      if (t >= 1) return 17; // Bạn nhỏ đến cổng.
      return 80;
    }
    waitDone(b) {
      const range = Number.isFinite(b.range) ? b.range : 30;
      // Dung sai sa bàn ±2 cm: ngưỡng 15 cm vẫn nhận bé ở 17 cm.
      if (this.distance <= range + 2) {
        this.lastObject = this.distance === 45 ? 'passerby' : 'child';
        if (this.lastObject === 'passerby')
          this.fail('false-positive','50 cm: cổng mở nhầm cho người đi ngang! Hãy thử 15–20 cm.');
        return true;
      }
      if (this.sensorElapsed >= 3.1) {
        this.fail('missed-child','5 cm: cổng không nhận ra bạn ở 17 cm. Hãy thử 15–20 cm.');
        this.finish();
      }
      return false;
    }
    onWaitExit(b) {
      this.rangeUsed.push(Number.isFinite(b.range) ? b.range : 30);
      this.detected++; this.events.push('sensor_obstacle');
      if (this.detected === 2) {
        this.childCrossed = this.gateOpen >= .8 && !this.failed;
        if (!this.childCrossed && !this.failed)
          this.log('warn','Cổng mở chưa đủ rộng: hãy đổi Chờ đầu thành 1 giây.');
      }
      this.emit('guest',{kind:this.lastObject,next:this.detected,crossed:this.childCrossed});
      this.phase = this.detected === 1 ? 'opening' : 'closing';
    }
    onInstant(b) {
      if (b.type !== 'display') return false;
      this.led = b.icon; this.events.push(sig(b)); this.emit('display',b.icon);
      return true;
    }
    onMotor(b) {
      this.dir = b.dir === 'ccw' ? -1 : 1;
      this.phase = this.dir < 0 ? 'opening' : 'closing';
      this.events.push(sig(b));
      if (b.port && b.port !== 'M1')
        this.fail('wrong-port','Cổng dùng động cơ M1. Hãy chọn đúng M1.');
      this.emit('gateMotor',{dir:this.dir,port:b.port || 'M1'});
      this.noteUpgradeRun();
    }
    onTimedExit(b) {
      if (b.type !== 'wait') return;
      this.events.push(sig(b));
      this.emit('gatePause',{seconds:b.duration,open:this.gateOpen});
    }
    onStopBlock() {
      this.events.push('stop'); this.emit('gateStop',{open:this.gateOpen});
    }
    onLoopEnd() {
      this.loops++;
      const improved = SAMPLE.map((v,i) => i === 5 ? 'wait:1' : v);
      const matches = this.matchesSample() || this.matchesSample(improved);
      const expected = SAMPLE.slice(2,-1);
      const eventsValid = this.events.length === expected.length &&
        this.events.every((v,i) => v === expected[i] || (i === 3 && v === 'wait:1'));
      const fullCycle = this.detected === 2 && this.gateOpen <= .08 &&
        matches && eventsValid && !this.failed;
      if (fullCycle) {
        this.done.m2 = true;
        this.log('ok','Đã nhận khách, hiện GO, mở và đóng cổng M1 đúng chương trình mẫu.');
        this.emit('sampleDone');
        if (this.events[3] === 'wait:1' && this.childCrossed) {
          this.done.m3 = true;
          this.log('ok','Mở 1 giây: bạn nhỏ đi qua an toàn rồi cổng mới đóng.');
          this.emit('safeCross');
        } else this.log('warn','M3: đổi đúng khối Chờ mở từ 0,2 giây lên 1 giây.');
        if (this.advanced && this.done.m3 && this.rangeUsed.length === 2 &&
            this.rangeUsed.every(v => v >= 15 && v <= 20)) {
          this.done.m5 = true;
          this.log('ok','15–20 cm: thấy bạn ở 17 cm, bỏ qua người đi ngang 45 cm.');
          this.emit('sensorMaster');
        }
        this.best = {secs:+this.runT.toFixed(1),detections:this.detected,safe:this.childCrossed};
      }
      this.finish(); // Một chu kỳ để học sinh thấy kết quả.
    }
    integrate(dt) {
      if (!this.running) return;
      this.runT += dt;
      if (this.phase === 'searching') {
        this.sensorElapsed += dt;
        this.distance = this.distanceAt(this.sensorElapsed);
      }
      if (this.motorOn) {
        this.rev += this.rpm() / 60 * dt * this.dir;
        // Mở đủ sau 1 giây; cơ cấu đóng sau 0,2 giây.
        this.gateOpen = Math.max(0,Math.min(1,
          this.gateOpen + dt * (this.dir < 0 ? 1 : -5)));
      }
    }
    updateUI() {
      super.updateUI();
      this.set('m-gate-distance',Math.round(this.distance));
      this.set('m-gate-open',Math.round(this.gateOpen * 100));
      this.set('m-gate-time',this.runT.toFixed(1));
    }
  }
  window.GateEngine = GateEngine;
})();
