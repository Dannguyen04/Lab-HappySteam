// Xe cơ khí không có động cơ: chuyển động bằng trọng lực và ma sát mô phỏng.
(function () {
  'use strict';
  const HEIGHTS = [0, 85, 145, 205];
  const FRICTION = { ice: 200, wood: 420, rough: 580 }; // px/s², số mô phỏng.
  const START = 75, RAMP_END = 320, FINISH = 725;

  class RampEngine extends window.LessonEngine {
    constructor() {
      super({ sample: ['start'], labels: {
        bigFrontWheels: 'Bánh trước lớn', cargoWeight: 'Khối gia tải',
        spoilerWing: 'Cánh đuôi', frontBumper: 'Cản trước'
      }, baseLabel: 'Xe trượt dốc cơ bản', core: ['m1', 'm2', 'm3', 'm4'] });
      this.slope = 1;
      this.surface = 'wood';
      this.done = { m2: false, m3: false, m5: false };
      this.reset();
    }
    resetState() {
      this.x = START;
      this.velocity = 0;
      this.distance = 0;
      this.released = false;
      this.reachedGoal = false;
      this.wheelAngle = 0;
    }
    setSlope(level) {
      if (![1, 2, 3].includes(Number(level))) return;
      this.stop(true);
      this.slope = Number(level);
      this.reset();
      this.emit('settings', { slope: this.slope, surface: this.surface });
    }
    setSurface(surface) {
      if (!Object.prototype.hasOwnProperty.call(FRICTION, surface)) return;
      this.stop(true);
      this.surface = surface;
      this.reset();
      this.emit('settings', { slope: this.slope, surface: this.surface });
    }
    start() {
      if (this.running) return;
      this.reset();
      this.released = true;
      this.running = true;
      this.noteUpgradeRun();
      this.log('info', 'Thả xe từ dốc nấc ' + this.slope + '.');
      this.emit('start');
    }
    advance(dt) {
      if (!this.running) return;
      const step = Math.min(0.05, Math.max(0, Number(dt) || 0));
      if (!step) return;
      this.runT += step;
      // Năng lượng cao hơn tạo vận tốc chân dốc cao hơn; đường phẳng chịu ma sát.
      const rampAcceleration = (2800 * HEIGHTS[this.slope]) / (2 * (RAMP_END - START));
      const acceleration = this.x < RAMP_END ? rampAcceleration : -FRICTION[this.surface];
      const next = Math.max(0, this.velocity + acceleration * step);
      this.x = Math.min(FINISH, this.x + (this.velocity + next) * 0.5 * step);
      this.velocity = next;
      this.distance = this.x - START;
      this.wheelAngle += (this.velocity * step) / 22;
      if (this.x >= FINISH || (this.x >= RAMP_END && this.velocity <= 0)) {
        this.reachedGoal = this.x >= FINISH;
        this.running = false;
        this.done.m2 = true; // Chỉ chấm sau một lượt lăn thực sự kết thúc.
        if (this.reachedGoal && this.slope >= 2) this.done.m3 = true;
        if (this.reachedGoal && this.advanced && this.surface === 'rough' && this.slope === 3) this.done.m5 = true;
        this.log(this.reachedGoal ? 'ok' : 'warn', this.reachedGoal ? 'Xe đã tới cờ đích!' : 'Xe dừng trước cờ. Thử nâng dốc!');
        this.emit(this.reachedGoal ? 'goal' : 'short', { x: this.x, slope: this.slope, surface: this.surface });
        this.finish();
      }
    }
    pose3d() { return { output: this.wheelAngle, motor: 0 }; }
    updateUI() {
      super.updateUI();
      this.set('sim-status-desc', this.running ? 'Xe đang lăn trên đường dốc.'
        : !this.released ? 'Chọn độ dốc rồi chạm Thả xe.'
          : this.reachedGoal ? 'Xe đã tới cờ đích!' : 'Xe dừng trước cờ. Hãy thử dốc cao hơn!');
      if (!this.advanced) return;
      this.set('m-speed', (this.velocity / 10).toFixed(1));
      this.set('m-dist', (this.distance / 10).toFixed(1));
      this.set('m-time', this.runT.toFixed(1));
      this.set('calc-eq1', 'Dốc ' + this.slope + ' · Mặt ' + ({ ice: 'trơn', wood: 'gỗ', rough: 'nhám' }[this.surface]));
      this.set('calc-eq2', 'Xe đã đi ' + (this.distance / 10).toFixed(1) + ' cm sau ' + this.runT.toFixed(1) + ' giây (mô phỏng).');
    }
    missionExtra() {
      return { ...super.missionExtra(), slope: this.slope, surface: this.surface, distance: this.distance, reachedGoal: this.reachedGoal };
    }
  }
  window.RampEngine = RampEngine;
})();
