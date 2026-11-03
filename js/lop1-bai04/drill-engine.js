// Lớp 1 Bài 4: cảm biến chạm là cò máy khoan (nhấn giữ, thả để dừng).
// Phần chung về khối lệnh và nhiệm vụ nằm ở lesson-engine.js.
(function () {
  'use strict';

  const SAMPLE = (window.LESSON && window.LESSON.sampleSig) ||
    ['start', 'repeatStart', 'sensor_touch', 'motor:high', 'sensor_release', 'stop', 'repeatEnd'];
  const MATERIALS = {
    tile: { label: 'Gạch men', speed: 4, rate: 4.5 },
    wood: { label: 'Gỗ', speed: 6, rate: 4.5 },
    plaster: { label: 'Thạch cao', speed: 8, rate: 4.5 }
  };

  class DrillEngine extends window.LessonEngine {
    constructor() {
      // Cảm biến được xử lý bằng điều kiện, không dùng xung nhấn 0,3s của lớp gốc.
      super({ sample: SAMPLE, labels: {
        boostTrigger: 'Cò trợ lực', sideHandle: 'Tay cầm phụ',
        depthGauge: 'Thước đo sâu', dustShield: 'Tấm chắn phoi'
      }, baseLabel: 'Máy khoan cơ bản', core: ['m1', 'm2', 'm3', 'm4'],
      touch: [], loopEndBeforeJump: true });
      this.done = { m2: false, m3: false, m5: false };
      this.passedMaterials = new Set();
    }
    resetState() {
      this.rev = 0;
      this.depth = 0;
      this.drillSeconds = 0;
      this.held = false;
      this.cyclePressed = false;
      this.cycleReleased = false;
      this.lastOutcome = null;
      this.cracked = false;
      this.material = this.material || 'tile';
      this.waitingPress = false;
    }
    setMaterial(name) {
      if (!MATERIALS[name] || this.material === name) return;
      this.stop(true);
      this.material = name;
      this.reset();
      this.emit('material', name);
      this.checkMissions();
    }
    press() {
      if (this.held) return;
      this.held = true;
      this.pressed = false;
      this.emit('press');
    }
    release() {
      if (!this.held) return;
      this.held = false;
      this.emit('release');
    }
    stop(silent) {
      this.held = false;
      super.stop(silent);
    }
    isConditionWait(b) { return b.type === 'sensor_touch' || b.type === 'sensor_release'; }
    onWaitEnter(b) { this.waitingPress = b.type === 'sensor_touch'; }
    waitDone(b) { return b.type === 'sensor_touch' ? this.held : !this.held; }
    onWaitExit(b) {
      this.waitingPress = false;
      if (b.type === 'sensor_touch') this.cyclePressed = true;
      if (b.type === 'sensor_release') this.cycleReleased = true;
    }
    rpm() { return this.motorOn && this.held ? 150 * this.power / 8 : 0; }
    pose3d() { return { output: this.rev * Math.PI * 2, motor: 0 }; }
    onMotor() {
      this.emit('speed', this.power);
      this.noteUpgradeRun();
    }
    onStopBlock() {
      this.emit('speed', 0);
      if (!this.cyclePressed || !this.cycleReleased) return;
      const spec = MATERIALS[this.material];
      let reason = null;
      if (!this.drillSeconds) reason = 'Chưa giữ cò để khoan.';
      else if (this.power !== spec.speed) reason = 'Tốc độ chưa phù hợp với ' + spec.label.toLowerCase() + '.';
      else if (this.depth < 8) reason = 'Lỗ còn nông. Giữ cò lâu hơn.';
      else if (this.depth > 11) reason = 'Lỗ quá sâu. Hãy thả cò sớm hơn.';
      this.cracked = this.material === 'tile' && this.power > 4;
      if (this.cracked) reason = 'Gạch men nứt vì quay quá nhanh.';
      this.lastOutcome = reason ? 'fail' : 'pass';
      if (reason) {
        this.log('warn', reason);
        this.emit('drillFail', reason);
      } else {
        this.log('ok', 'Lỗ khoan đúng độ sâu trên ' + spec.label.toLowerCase() + '!');
        this.emit('drillPass', this.material);
        if (this.material === 'tile') this.done.m3 = true;
        if (this.advanced) {
          this.passedMaterials.add(this.material);
          this.done.m5 = this.passedMaterials.size === Object.keys(MATERIALS).length;
          this.log('info', 'Đã khoan đúng ' + this.passedMaterials.size + '/3 chất liệu.');
        }
      }
      this.checkMissions();
    }
    onLoopEnd() {
      // Một chu kỳ đủ nhấn -> quay -> thả -> dừng là hoàn thành lượt thử.
      if (this.cyclePressed && this.cycleReleased) this.finish();
    }
    onProgramEnd() { this.finish(); }
    finish() {
      if (this.matchesSample() && this.cyclePressed && this.cycleReleased && this.drillSeconds > 0 && !this.done.m2) {
        this.done.m2 = true;
        this.log('ok', 'Đã nhấn, giữ và thả đúng chương trình mẫu.');
        this.emit('sampleDone');
      }
      super.finish();
    }
    integrate(dt) {
      if (!this.running) return;
      this.runT += dt;
      this.rev += this.rpm() / 60 * dt * this.dir;
      if (this.motorOn && this.held) {
        this.drillSeconds += dt;
        this.depth += MATERIALS[this.material].rate * this.power /
          MATERIALS[this.material].speed * dt;
      }
    }
    updateUI() {
      super.updateUI();
      this.set('m-depth', this.depth.toFixed(1) + '<small>mm</small>');
      this.set('m-seconds', this.drillSeconds.toFixed(1) + '<small>giây</small>');
      this.set('m-drill-speed', String(this.motorOn ? this.power : 0) + '<small>mức</small>');
      this.set('calc-eq1', MATERIALS[this.material].label + ': đích 8–11 mm.');
      this.set('calc-eq2', this.lastOutcome === 'pass' ? '✓ Đã khoan đúng!' :
        this.lastOutcome === 'fail' ? '✗ Hãy đổi tốc độ hoặc thời gian giữ cò.' : 'Giữ 🔴 rồi thả tại vạch xanh.');
    }
  }

  window.DrillEngine = DrillEngine;
})();
