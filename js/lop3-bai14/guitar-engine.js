// Bộ mô phỏng Bài 14 lớp 3 – Cây đàn ghi-ta. Phần chung (chạy khối, vòng lặp, nhật ký, nhiệm vụ) ở js/lesson-engine.js;
// ở đây chỉ viết vật lý của mô hình và cách chấm m2, m3, m5.
(function () {
  'use strict';

  const AB = ['start', 'repeatStart', 'sensor_obstacle', 'melody:A', 'wait_clear', 'melody:B', 'repeatEnd'];
  const BA = ['start', 'repeatStart', 'sensor_obstacle', 'melody:B', 'wait_clear', 'melody:A', 'repeatEnd'];
  const HOLDS = [1.8, 2.6, 3.4];
  const signature = b => b.type === 'melody' ? 'melody:' + b.tune : b.type;

  class GuitarEngine extends window.LessonEngine {
    constructor() {
      super({ sample: AB, sig: signature, loopEndBeforeJump: true, stopTimedOnFinish: true,
        melodyTime: 0.8, baseLabel: 'Cây đàn ghi-ta cơ bản', core: ['m1', 'm2', 'm3', 'm4'],
        labels: { resonator: 'Hộp cộng hưởng', glowStrings: 'Dây đàn màu', stageLights: 'Đèn sân khấu', stand: 'Giá đỡ' } });
      this.done = { m2: false, m3: false, m5: false };
      this.roundsWon = new Set();
      this.reset();
    }
    resetState() {
      this.handDist = 0.85;
      this.sensorNear = false;
      this.playingNote = null;
      this.lastNote = null;
      this.notes = [];
      this.sawObstacle = false;
      this.sawClear = false;
      this.failed = false;
      this.reason = '';
      this.round = Math.min((this.roundsWon && this.roundsWon.size) || 0, 2);
      this.holdTime = HOLDS[this.advanced ? this.round : 0];
      this.mode = 'invalid';
    }
    pose3d() {
      return { output: 0, motor: 0 };
    }
    onStart() {
      this.mode = this.matchesSample(AB) ? 'AB' : this.matchesSample(BA) ? 'BA' : 'invalid';
      this.noteUpgradeRun();
      this.emit('audience', { round: this.round + 1, hold: this.holdTime });
      if (this.mode === 'invalid')
        this.fail('Kiểm tra đủ 7 khối: chờ có tay, phát nốt, chờ hết tay rồi phát nốt còn lại.');
    }
    // Tay xuất phát ở xa, tiến lại gần trong 1,4 giây, giữ rồi rút trong 0,7 giây.
    integrate(dt) {
      if (!this.running) return;
      this.runT += dt;
      const t = this.runT, approachStart = 0.2, approachEnd = 1.6;
      const releaseStart = approachEnd + this.holdTime, releaseEnd = releaseStart + 0.7;
      if (t < approachStart) this.handDist = 0.85;
      else if (t < approachEnd) this.handDist = 0.85 - 0.70 * (t - approachStart) / 1.4;
      else if (t < releaseStart) this.handDist = 0.15;
      else if (t < releaseEnd) this.handDist = 0.15 + 0.70 * (t - releaseStart) / 0.7;
      else this.handDist = 0.85;
      this.sensorNear = this.handDist < 0.32;
    }
    isConditionWait(b) { return b.type === 'sensor_obstacle' || b.type === 'wait_clear'; }
    waitDone(b) { return b.type === 'sensor_obstacle' ? this.sensorNear : !this.sensorNear; }
    waitStep(b, budget) { return Math.min(0.02, budget); }
    onWaitExit(b) {
      if (b.type === 'sensor_obstacle') {
        if (this.notes.length || !this.sensorNear) return this.fail('Cần chờ bàn tay đến gần trước nốt đầu.');
        this.sawObstacle = true;
      } else if (b.type === 'wait_clear') {
        if (this.notes.length !== 1 || !this.sawObstacle || this.sensorNear)
          return this.fail('Cần chờ khán giả rút tay sau nốt đầu.');
        this.sawClear = true;
      }
    }
    onTimedEnter(b) {
      if (b.type !== 'melody') return;
      const idx = this.notes.length;
      const expected = (this.mode === 'BA' ? BA : AB)[idx === 0 ? 3 : 5].split(':')[1];
      if (idx > 1 || b.tune !== expected || (idx === 0 && (!this.sawObstacle || !this.sensorNear)) ||
          (idx === 1 && (!this.sawClear || this.sensorNear))) {
        this.fail('Sai nốt hoặc sai thời điểm: nốt ' + (idx + 1) + ' phải là ' + expected + ' sau khi cảm biến đổi trạng thái.');
        return;
      }
      this.playingNote = b.tune;
      this.lastNote = b.tune;
      this.notes.push(b.tune);
      this.log('ok', 'Đã phát giai điệu ' + b.tune + ' đúng lúc.');
    }
    enterBlock(b) { return this.running ? super.enterBlock(b) : 0; }
    onTimedExit(b) { if (b.type === 'melody') this.playingNote = null; }
    onLoopEnd() { this.finish(); }
    fail(message) {
      if (this.failed) return;
      this.failed = true;
      this.reason = message;
      this.playingNote = null;
      this.log('warn', message);
      this.emit('mistake', { message });
      super.finish();
    }
    finish() {
      if (this.failed || !this.running) return;
      if (this.notes.length !== 2 || !this.sawObstacle || !this.sawClear || this.mode === 'invalid') {
        this.fail('Chưa phát đủ hai nốt đúng sau hai khối chờ cảm biến.');
        return;
      }
      this.emit('performance', { notes: this.notes.join('–'), round: this.round + 1 });
      if (this.mode === 'AB' && !this.done.m2) {
        this.done.m2 = true;
        this.emit('sampleDone');
      }
      if (this.mode === 'BA') {
        this.done.m3 = true;
        if (this.advanced) {
          this.roundsWon.add(this.round);
          if (this.roundsWon.size === HOLDS.length) this.done.m5 = true;
        }
      }
      super.finish();
    }
    updateUI() {
      super.updateUI();
      this.set('m-sensor', this.sensorNear ? 'Có tay' : 'Đường trống');
      this.set('m-sensor-note', this.sensorNear ? 'Đã nhận diện vật cản' : 'Đang chờ tay khán giả');
      this.set('m-note', this.playingNote || this.lastNote || '—');
      this.set('m-note-note', this.playingNote ? 'Đang phát nốt ' + this.playingNote : 'Nốt gần nhất');
      this.set('m-visitor', String(this.round + 1));
      this.set('m-visitor-note', 'Giữ tay ' + this.holdTime.toFixed(1) + ' giây · đã đạt ' + this.roundsWon.size + '/3');
      this.set('m-time', this.runT.toFixed(1));
    }
  }

  window.GuitarEngine = GuitarEngine;
})();
