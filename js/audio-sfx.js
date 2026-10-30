// js/audio-sfx.js - Web Audio SFX & Voice for ZMrobo Virtual Lab
(function() {
  'use strict';

  class SoundFX {
    constructor() {
      this.ctx = null;
      this.enabled = true;
      this.speechEnabled = false;
      this.voices = [];
      if ('speechSynthesis' in window) {
        window.speechSynthesis.onvoiceschanged = () => {
          this.voices = window.speechSynthesis.getVoices();
        };
      }
    }

    init() {
      if (!this.ctx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
          this.ctx = new AudioContext();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
    }

    unlock() {
      this.init();
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
    }

    toggle() {
      this.enabled = !this.enabled;
      if (this.enabled) this.unlock();
      return this.enabled;
    }

    tone(freq, duration, volume = 0.08, delay = 0, type = 'triangle') {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }

      const t0 = this.ctx.currentTime + delay;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, t0);

      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.linearRampToValueAtTime(volume, t0 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t0);
      osc.stop(t0 + duration + 0.03);
    }

    click() {
      this.tone(800, 0.04, 0.03, 0, 'sine');
    }

    ding() {
      this.tone(1046.5, 0.35, 0.07, 0, 'triangle');
      this.tone(1318.5, 0.45, 0.06, 0.1, 'triangle');
    }

    buzz() {
      this.tone(180, 0.25, 0.08, 0, 'sawtooth');
      this.tone(140, 0.3, 0.08, 0.12, 'sawtooth');
    }

    fanfare() {
      const notes = [
        [523.25, 0.18, 0],
        [659.25, 0.18, 0.14],
        [783.99, 0.18, 0.28],
        [1046.5, 0.55, 0.42]
      ];
      notes.forEach(([f, dur, dly]) => this.tone(f, dur, 0.09, dly, 'triangle'));
    }

    melody(name) {
      if (name === 'A') {
        // Melody A: C5, E5, G5 (Tươi vui, bay lên)
        [523.25, 659.25, 783.99].forEach((f, i) => this.tone(f, 0.28, 0.08, i * 0.3, 'triangle'));
      } else if (name === 'B') {
        // Melody B: G5, E5, C5 (Tiếp nhận xong, trở về)
        [783.99, 659.25, 523.25].forEach((f, i) => this.tone(f, 0.28, 0.08, i * 0.3, 'triangle'));
      }
    }

    speak(text) {
      if (!this.speechEnabled || !('speechSynthesis' in window)) return;
      window.speechSynthesis.cancel();
      const utt = new SpeechSynthesisUtterance(text);
      utt.lang = 'vi-VN';
      utt.rate = 1.0;
      // Tìm giọng tiếng Việt nếu có
      const viVoice = this.voices.find(v => v.lang.startsWith('vi') || v.name.toLowerCase().includes('vietnam'));
      if (viVoice) utt.voice = viVoice;
      window.speechSynthesis.speak(utt);
    }
  }

  window.SFX = new SoundFX();
})();
