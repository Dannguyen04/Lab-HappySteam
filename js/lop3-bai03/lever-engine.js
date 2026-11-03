// Thí nghiệm đòn bẩy cơ khí: các mốc trên sa bàn là vị trí trò chơi, không phải thông số phóng thật.
(function () {
  'use strict';
  const ZONES = [0, 335, 490, 645];
  const TARGETS = [1, 3, 2];
  const DURATION = 1.6;
  const LABELS = {
    ballBasket: 'Giỏ bóng mềm', teamSign: 'Biển số đội',
    distanceMarks: 'Vạch cự ly', wheelBrake: 'Chốt giữ bánh'
  };

  class LeverEngine extends window.LessonEngine {
    constructor() {
      super({ sample: ['start'], labels: LABELS, baseLabel: 'Mô hình đòn bẩy cơ bản', core: ['m1', 'm2', 'm3', 'm4'] });
      this.level = 1;
      this.progress = 0;
      this.done = { m2: false, m3: false, m5: false };
      this.reset();
    }
    get target() {
      return this.advanced ? TARGETS[Math.min(this.progress, TARGETS.length - 1)] : 2;
    }
    resetState() {
      this.ballX = 170;
      this.ballY = 339;
      this.released = false;
      this.landed = false;
      this.hit = false;
      this.lastTarget = null;
      this.lastOutcome = null;
    }
    setLevel(value) {
      const level = Number(value);
      if (![1, 2, 3].includes(level)) return;
      this.stop(true);
      this.level = level;
      this.reset();
      this.emit('settings', { level, target: this.target });
    }
    setAdvanced(on) {
      if (this.advanced === !!on) return;
      this.progress = 0;
      super.setAdvanced(on);
      this.emit('settings', { level: this.level, target: this.target });
    }
    start() {
      if (this.running) return;
      this.reset();
      this.released = true;
      this.running = true;
      this.lastTarget = this.target;
      this.log('info', `Thả bóng mềm ảo ở nấc ${this.level}, vòng mục tiêu ${this.lastTarget}.`);
      this.emit('start', { level: this.level, target: this.lastTarget });
    }
    advance(dt) {
      if (!this.running) return;
      const delta = Math.min(0.05, Math.max(0, Number(dt) || 0));
      if (!delta) return;
      this.runT = Math.min(DURATION, this.runT + delta);
      const ratio = this.runT / DURATION;
      // Quỹ đạo biểu tượng theo mốc điểm; không dùng phương trình đạn đạo.
      this.ballX = 170 + (ZONES[this.level] - 170) * ratio;
      this.ballY = 339 - 170 * Math.sin(Math.PI * ratio);
      if (ratio < 1) return;
      this.landed = true;
      this.hit = this.level === this.lastTarget;
      this.lastOutcome = this.hit ? 'hit' : this.level < this.lastTarget ? 'short' : 'long';
      if (this.level === 1) this.done.m2 = true;
      if (this.level === 2 && this.hit) this.done.m3 = true;
      if (this.advanced && !this.done.m5) {
        this.progress = this.hit ? this.progress + 1 : 0;
        if (this.progress >= TARGETS.length) this.done.m5 = true;
      }
      if (this.upgrades.size) this.noteUpgradeRun();
      const result = { level: this.level, target: this.lastTarget, outcome: this.lastOutcome,
        progress: this.progress, complete: this.done.m5 };
      this.log(this.hit ? 'ok' : 'warn', this.hit
        ? `Bóng chạm vòng ${this.lastTarget}!` : `Bóng dừng ở vùng ${this.level}; vòng mục tiêu ở vùng ${this.lastTarget}.`);
      this.emit(this.hit ? 'hit' : 'miss', result);
      this.finish();
    }
    pose3d() { return { output: 0, motor: 0 }; }
    updateUI() {
      super.updateUI();
      this.set('m-level', String(this.level));
      this.set('m-dist', String(Math.round(Math.max(0, this.ballX - 170))));
      this.set('m-round', String(Math.min(3, this.progress + 1)));
      this.set('sim-status-desc', this.running ? 'Bóng mềm ảo đang di chuyển trên sa bàn.'
        : !this.released ? 'Chọn nấc mô phỏng rồi chạm Thả bóng.'
          : this.hit ? 'Đã chạm vòng! Hãy quan sát vòng tiếp theo.'
            : `Bóng dừng ở vùng ${this.level}. Thử đổi nấc để khớp vùng ${this.lastTarget}.`);
      this.set('calc-eq1', `Nấc ${this.level} · Vòng ${this.target} · ${this.progress}/3 lượt liên tiếp`);
      this.set('calc-eq2', 'Các vùng và số đo trên sa bàn chỉ phục vụ trò chơi, không mô tả máy thật.');
    }
    missionExtra() {
      return { ...super.missionExtra(), level: this.level, target: this.target,
        progress: this.progress, landed: this.landed, lastOutcome: this.lastOutcome };
    }
  }
  window.LeverEngine = LeverEngine;
})();
