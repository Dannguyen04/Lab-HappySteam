// Bộ mô phỏng Bài 10 – Cối xoay gió có nút bấm (cảm biến chạm). Động cơ quay thẳng cụm cánh quạt:
// Low / Medium / High = mức 4 / 6 / 8 (chuẩn chung) → 75 / 112,5 / 150 vòng/phút. Cánh quay sinh điện sạc pin; pin có điện thì nhà sáng đèn.
// Khối "Chờ nhấn nút" (sensor_touch) chỉ đi tiếp khi học sinh nhấn nút đỏ (nút trên cảnh hoặc phím cách).
// Nâng cao: thời tiết đổi theo thời gian chạy – gió nhẹ → mạnh → bão → nhẹ; quay trong bão quá lâu thì gãy cánh.
// Phần chung (chạy khối, vòng lặp khung hình, nhật ký, nhiệm vụ) ở js/lesson-engine.js.
(function () {
  'use strict';

  const MAX_RPM = 150;
  const NAME = { 4: 'chậm', 6: 'vừa', 8: 'nhanh' };
  const CHARGE = 12; // %/giây ở 150 vòng/phút, gió nhẹ (đầy pin ≈ 8 giây khi quay nhanh)
  // Nâng cao: [đến giây, thời tiết, hệ số gió]
  const WEATHER = [
    [8, 'light', 1],
    [14, 'strong', 1.6],
    [20, 'storm', 0],
    [Infinity, 'light', 1]
  ];
  const STORM_LIMIT = 1.5; // giây quay trong bão thì gãy cánh
  // Chương trình mẫu trong giáo án: Start, Repeat, (Chờ nhấn → Chậm → Chờ nhấn → Vừa → Chờ nhấn → Nhanh → Chờ nhấn → Dừng), Repeat End
  const SAMPLE = ['start', 'repeatStart', 'sensor_touch', 'motor:low', 'sensor_touch', 'motor:medium', 'sensor_touch', 'motor:high',
    'sensor_touch', 'stop', 'repeatEnd'];
  const BOOST = { long: 1.4, more: 1.3, tail: 1.1 };

  class WindEngine extends window.LessonEngine {
    constructor() {
      super({
        sample: SAMPLE,
        touch: ['sensor_touch', 'sensor_obstacle'],
        labels: { long: 'Cánh dài', more: '6 cánh', light: 'Đèn trên đỉnh', tail: 'Đuôi lái gió' },
        baseLabel: 'Cối xoay gió cơ bản'
      });
      this.done = { m2: false, m3: false, m5: false };
    }
    resetState() {
      this.rev = 0;
      this.battery = 0; // 0–100 %
      this.levels = new Set(); // các tốc độ đã chạy trong lần này (NV2)
      this.stopsAfterHigh = false;
      this.stormT = 0;
      this.broken = false;
      this.stormSeen = false;
      this.fullAnnounced = false;
    }
    onStart() {
      this.emit('weather', this.weather());
    }
    // Thời tiết hiện tại: { kind, wind } – chế độ Bé luôn gió nhẹ
    weather(t = this.runT) {
      if (!this.advanced) return { kind: 'light', wind: 1, next: Infinity };
      const w = WEATHER.find(x => t < x[0]);
      return { kind: w[1], wind: w[2], next: w[0] - t };
    }
    rpm() {
      return this.motorOn && !this.broken ? (MAX_RPM * this.power) / 8 : 0;
    }
    boost() {
      let k = 1;
      for (const u of this.upgrades) k *= BOOST[u] || 1;
      return k;
    }
    // %/giây đang sạc vào pin
    chargeRate() {
      const w = this.weather();
      return (this.rpm() / MAX_RPM) * CHARGE * w.wind * this.boost() * (this.advanced ? 0.35 : 1); // Nâng cao: pin to hơn, phải sạc qua cả cơn bão
    }
    pose3d() {
      return { output: this.rev * Math.PI * 2, motor: 0 };
    }

    onMotor() {
      this.levels.add(this.power);
      this.log('info', `Cánh quạt quay ${NAME[this.power] || 'mức ' + this.power} (${(MAX_RPM * this.power) / 8} vòng/phút).`);
      this.emit('speed', this.power);
      this.noteUpgradeRun();
    }
    onStopBlock(wasOn) {
      if (wasOn) this.log('info', 'Cánh quạt dừng.');
      if (this.levels.has(4) && this.levels.has(6) && this.levels.has(8)) this.stopsAfterHigh = true;
      this.emit('speed', 0);
      if (this.stopsAfterHigh && this.matchesSample() && !this.done.m2) {
        this.done.m2 = true;
        this.log('ok', 'Đúng chương trình mẫu: chậm → vừa → nhanh → dừng sau mỗi lần nhấn nút.');
        this.emit('sampleDone');
        this.checkMissions();
      }
    }

    integrate(dt) {
      if (!this.running) return;
      const before = this.weather();
      this.runT += dt;
      const w = this.weather();
      if (w.kind !== before.kind) {
        this.log(w.kind === 'storm' ? 'warn' : 'info', { light: 'Gió nhẹ.', strong: 'Gió mạnh – sạc nhanh hơn!', storm: 'Bão tới! Hãy cho cánh quạt dừng.' }[w.kind]);
        this.emit('weather', w);
        if (w.kind === 'storm') this.stormSeen = true;
      }
      const rpm = this.rpm();
      this.rev += ((rpm / 60) * dt * this.dir);
      if (w.kind === 'storm' && rpm > 0) {
        this.stormT += dt;
        if (this.stormT >= STORM_LIMIT && !this.broken) {
          this.broken = true;
          this.log('warn', 'Bão làm gãy cánh quạt vì cánh vẫn quay!');
          this.emit('broken');
        }
      }
      if (this.broken) return;
      this.battery = Math.min(100, this.battery + this.chargeRate() * dt);
      if (this.battery >= 100 && !this.fullAnnounced) {
        this.fullAnnounced = true;
        this.best = { secs: +this.runT.toFixed(1) };
        this.done.m3 = true;
        if (this.advanced && this.stormSeen) this.done.m5 = true;
        this.log('ok', `Pin đầy sau ${this.runT.toFixed(1)} giây – ngôi nhà sáng đèn!`);
        this.emit('full', { secs: this.runT, storm: this.advanced && this.stormSeen });
        this.checkMissions();
      }
    }

    updateUI() {
      super.updateUI();
      const w = this.weather();
      this.set('m-rpm', `${Math.round(this.rpm())} <small>vòng/phút</small>`);
      this.set('m-rpm-note', this.broken ? 'Cánh quạt gãy' : this.motorOn ? 'Quay ' + (NAME[this.power] || 'mức ' + this.power) : 'Đang dừng');
      this.set('m-battery', `${Math.floor(this.battery)} <small>%</small>`);
      this.set('m-rate', `${this.chargeRate().toFixed(1)} <small>%/giây</small>`);
      this.set('m-weather', { light: 'Gió nhẹ', strong: 'Gió mạnh', storm: 'Bão' }[w.kind]);
      this.set('m-weather-note', this.advanced && Number.isFinite(w.next) ? `Đổi sau ${w.next.toFixed(0)} giây` : 'Ổn định');
      const desc = document.getElementById('sim-status-desc');
      if (desc)
        desc.textContent = this.waitingPress
          ? 'Chương trình đang chờ: nhấn nút đỏ trên cối xoay gió.'
          : this.running
            ? `Cánh quạt ${Math.round(this.rpm())} vòng/phút, pin ${Math.floor(this.battery)}%.`
            : 'Ghép khối lệnh rồi chạm Start để chạy.';
      const c1 = document.getElementById('calc-eq1');
      if (c1) c1.textContent = 'Quay càng nhanh, cối xoay gió sinh càng nhiều điện: nhanh 150 vòng/phút ≈ 12 %/giây khi gió nhẹ.';
      const c2 = document.getElementById('calc-eq2');
      if (c2) c2.textContent = this.advanced ? 'Gió mạnh sạc nhanh gấp 1,6 lần; khi bão phải cho cánh quạt dừng để không gãy.' : 'Cánh dài, thêm cánh, đuôi lái gió giúp sạc nhanh hơn.';
    }
  }

  WindEngine.WEATHER = WEATHER;
  window.WindEngine = WindEngine;
})();
