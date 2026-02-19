import Phaser from 'phaser';

const BGM_MASTER_GAIN = 0.15;
const BGM_STEP_INTERVAL_MS = 125; // 16th-note grid (~120 BPM feel)
const BGM_MELODY_INTERVAL_MS = 2400;
const BGM_CHORD_PROGRESSION = [
  [261.63, 329.63, 392], // C
  [293.66, 392, 493.88], // G
  [349.23, 440, 523.25], // F
  [293.66, 392, 493.88] // G
];
const BGM_MELODY_PHRASES = [
  [659.25, 783.99, 880, 783.99, 659.25, 783.99, 987.77, 880],
  [587.33, 659.25, 783.99, 880, 783.99, 659.25, 587.33, 659.25],
  [523.25, 659.25, 783.99, 659.25, 523.25, 659.25, 783.99, 987.77]
];

export class AudioSystem {
  scene: Phaser.Scene;
  bgmRunning: boolean;
  bgmMasterGain: GainNode | null;
  bgmOscillators: Array<{ osc: OscillatorNode; gain: GainNode }>;
  bgmPulseTimer: Phaser.Time.TimerEvent | null;
  bgmMelodyTimer: Phaser.Time.TimerEvent | null;
  bgmPhraseIndex: number;
  bgmBeatCounter: number;
  bgmStartHandler: (() => void) | null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.bgmRunning = false;
    this.bgmMasterGain = null;
    this.bgmOscillators = [];
    this.bgmPulseTimer = null;
    this.bgmMelodyTimer = null;
    this.bgmPhraseIndex = 0;
    this.bgmBeatCounter = 0;
    this.bgmStartHandler = null;
  }

  private getAudioContext(): AudioContext | null {
    const manager = this.scene.sound as unknown as { context?: AudioContext };
    return manager?.context ?? null;
  }

  playFootstepSound(speedRatio = 1): void {
    const ctx = this.getAudioContext();
    if (!ctx || ctx.state !== 'running') {
      return;
    }

    const now = ctx.currentTime;
    const master = ctx.createGain();
    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.setValueAtTime(520, now);
    lowpass.Q.setValueAtTime(0.65, now);
    master.gain.setValueAtTime(0.0001, now);
    master.gain.exponentialRampToValueAtTime(0.038, now + 0.012);
    master.gain.exponentialRampToValueAtTime(0.0001, now + 0.11);
    lowpass.connect(master);
    master.connect(ctx.destination);

    const body = ctx.createOscillator();
    const bodyGain = ctx.createGain();
    body.type = 'sine';
    body.frequency.setValueAtTime(92 + speedRatio * 8, now);
    body.frequency.exponentialRampToValueAtTime(70, now + 0.08);
    bodyGain.gain.setValueAtTime(0.0001, now);
    bodyGain.gain.exponentialRampToValueAtTime(0.45, now + 0.01);
    bodyGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);
    body.connect(bodyGain);
    bodyGain.connect(lowpass);
    body.start(now);
    body.stop(now + 0.1);

    const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.06), ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i += 1) {
      data[i] = (Math.random() * 2 - 1) * 0.22;
    }
    const noise = ctx.createBufferSource();
    const noiseGain = ctx.createGain();
    noise.buffer = buffer;
    noiseGain.gain.setValueAtTime(0.0001, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.018, now + 0.008);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);
    noise.connect(noiseGain);
    noiseGain.connect(lowpass);
    noise.start(now);
    noise.stop(now + 0.065);
  }

  setupBackgroundMusic(): void {
    this.bgmRunning = false;
    this.bgmMasterGain = null;
    this.bgmOscillators = [];
    this.bgmPulseTimer = null;
    this.bgmMelodyTimer = null;
    this.bgmPhraseIndex = 0;
    this.bgmBeatCounter = 0;
    this.bgmStartHandler = () => this.tryStartBackgroundMusic();
    window.addEventListener('pointerdown', this.bgmStartHandler);
    window.addEventListener('keydown', this.bgmStartHandler);
    this.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.teardownBackgroundMusic());
    this.scene.events.once(Phaser.Scenes.Events.DESTROY, () => this.teardownBackgroundMusic());
    this.tryStartBackgroundMusic();
  }

  tryStartBackgroundMusic(): void {
    if (this.bgmRunning) {
      return;
    }
    const ctx = this.getAudioContext();
    if (!ctx || ctx.state !== 'running') {
      return;
    }

    const master = ctx.createGain();
    master.gain.setValueAtTime(0.0001, ctx.currentTime);
    const highpass = ctx.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.setValueAtTime(160, ctx.currentTime);
    highpass.Q.setValueAtTime(0.7, ctx.currentTime);
    const brighten = ctx.createBiquadFilter();
    brighten.type = 'highshelf';
    brighten.frequency.setValueAtTime(1650, ctx.currentTime);
    brighten.gain.setValueAtTime(5, ctx.currentTime);
    master.connect(highpass);
    highpass.connect(brighten);
    brighten.connect(ctx.destination);

    const notes = BGM_CHORD_PROGRESSION[0]!;
    const oscillators: Array<{ osc: OscillatorNode; gain: GainNode }> = [];
    for (let i = 0; i < notes.length; i += 1) {
      const note = notes[i] ?? notes[0]!;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = i === 2 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(note, ctx.currentTime);
      gain.gain.setValueAtTime(i === 2 ? 0.028 : 0.042, ctx.currentTime);
      osc.connect(gain);
      gain.connect(master);
      osc.start(ctx.currentTime);
      oscillators.push({ osc, gain });
    }

    master.gain.exponentialRampToValueAtTime(BGM_MASTER_GAIN, ctx.currentTime + 1.2);

    this.bgmMasterGain = master;
    this.bgmOscillators = oscillators;
    this.bgmRunning = true;

    this.bgmPulseTimer = this.scene.time.addEvent({
      delay: BGM_STEP_INTERVAL_MS,
      loop: true,
      callback: () => this.playBackgroundPulse()
    });
    this.bgmMelodyTimer = this.scene.time.addEvent({
      delay: BGM_MELODY_INTERVAL_MS,
      loop: true,
      callback: () => this.playBackgroundMelody()
    });
    this.playBackgroundMelody();
  }

  playBackgroundPulse(): void {
    const ctx = this.getAudioContext();
    if (!this.bgmRunning || !ctx || ctx.state !== 'running') {
      return;
    }

    const now = ctx.currentTime;
    const step = this.bgmBeatCounter % 16;
    this.bgmBeatCounter += 1;
    const chordIndex = Math.floor(this.bgmBeatCounter / 16) % BGM_CHORD_PROGRESSION.length;
    const chord = BGM_CHORD_PROGRESSION[chordIndex] ?? BGM_CHORD_PROGRESSION[0]!;
    if (this.bgmOscillators?.length >= 3) {
      for (let i = 0; i < 3; i += 1) {
        const oscRef = this.bgmOscillators[i];
        const note = chord[i] ?? chord[0]!;
        if (!oscRef) {
          continue;
        }
        oscRef.osc.frequency.setTargetAtTime(note, now, 0.06);
      }
    }

    const master = this.bgmMasterGain;
    if (!master) {
      return;
    }

    if (step % 4 === 0) {
      const kick = ctx.createOscillator();
      const kickGain = ctx.createGain();
      kick.type = 'sine';
      kick.frequency.setValueAtTime(142, now);
      kick.frequency.exponentialRampToValueAtTime(46, now + 0.12);
      kickGain.gain.setValueAtTime(0.0001, now);
      kickGain.gain.exponentialRampToValueAtTime(0.13, now + 0.006);
      kickGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);
      kick.connect(kickGain);
      kickGain.connect(master);
      kick.start(now);
      kick.stop(now + 0.16);
    }

    if (step === 0 || step === 8) {
      const bass = ctx.createOscillator();
      const bassGain = ctx.createGain();
      bass.type = 'triangle';
      bass.frequency.setValueAtTime((chord[0] ?? chord[1] ?? 220) * 0.5, now);
      bass.frequency.setValueAtTime((chord[1] ?? chord[0] ?? 330) * 0.5, now + 0.11);
      bassGain.gain.setValueAtTime(0.0001, now);
      bassGain.gain.exponentialRampToValueAtTime(0.075, now + 0.02);
      bassGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
      bass.connect(bassGain);
      bassGain.connect(master);
      bass.start(now);
      bass.stop(now + 0.24);
    }

    if (step === 4 || step === 12) {
      const noiseBuffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.08), ctx.sampleRate);
      const noiseData = noiseBuffer.getChannelData(0);
      for (let i = 0; i < noiseData.length; i += 1) {
        noiseData[i] = Math.random() * 2 - 1;
      }
      const snare = ctx.createBufferSource();
      snare.buffer = noiseBuffer;
      const hp = ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.setValueAtTime(1200, now);
      const snareGain = ctx.createGain();
      snareGain.gain.setValueAtTime(0.0001, now);
      snareGain.gain.exponentialRampToValueAtTime(0.055, now + 0.004);
      snareGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);
      snare.connect(hp);
      hp.connect(snareGain);
      snareGain.connect(master);
      snare.start(now);
      snare.stop(now + 0.09);
    }

    if (step % 2 === 1) {
      const hatBuffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.03), ctx.sampleRate);
      const hatData = hatBuffer.getChannelData(0);
      for (let i = 0; i < hatData.length; i += 1) {
        hatData[i] = (Math.random() * 2 - 1) * 0.75;
      }
      const hat = ctx.createBufferSource();
      hat.buffer = hatBuffer;
      const hp = ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.setValueAtTime(5200, now);
      const hatGain = ctx.createGain();
      hatGain.gain.setValueAtTime(0.0001, now);
      hatGain.gain.exponentialRampToValueAtTime(0.022, now + 0.002);
      hatGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.025);
      hat.connect(hp);
      hp.connect(hatGain);
      hatGain.connect(master);
      hat.start(now);
      hat.stop(now + 0.03);
    }
  }

  playBackgroundMelody(): void {
    const ctx = this.getAudioContext();
    if (!this.bgmRunning || !ctx || ctx.state !== 'running') {
      return;
    }

    const now = ctx.currentTime;
    const notes = BGM_MELODY_PHRASES[this.bgmPhraseIndex % BGM_MELODY_PHRASES.length] ?? BGM_MELODY_PHRASES[0]!;
    this.bgmPhraseIndex += 1;
    const master = this.bgmMasterGain;
    if (!master) {
      return;
    }
    for (let i = 0; i < notes.length; i += 1) {
      const note = notes[i] ?? notes[0]!;
      const t = now + i * 0.12;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(note, t);
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.03, t + 0.016);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
      osc.connect(gain);
      gain.connect(master);
      osc.start(t);
      osc.stop(t + 0.17);

      if (i % 2 === 0) {
        const air = ctx.createOscillator();
        const airGain = ctx.createGain();
        air.type = 'sine';
        air.frequency.setValueAtTime(note * 2, t);
        airGain.gain.setValueAtTime(0.0001, t);
        airGain.gain.exponentialRampToValueAtTime(0.012, t + 0.014);
        airGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
        air.connect(airGain);
        airGain.connect(master);
        air.start(t);
        air.stop(t + 0.13);
      }
    }

    const arp = [523.25, 659.25, 783.99, 987.77];
    for (let i = 0; i < arp.length; i += 1) {
      const note = arp[i] ?? arp[0]!;
      const t = now + 1.05 + i * 0.045;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(note, t);
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.028, t + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.04);
      osc.connect(gain);
      gain.connect(master);
      osc.start(t);
      osc.stop(t + 0.045);
    }
  }

  teardownBackgroundMusic(): void {
    if (this.bgmStartHandler) {
      window.removeEventListener('pointerdown', this.bgmStartHandler);
      window.removeEventListener('keydown', this.bgmStartHandler);
      this.bgmStartHandler = null;
    }
    if (this.bgmPulseTimer) {
      this.bgmPulseTimer.remove(false);
      this.bgmPulseTimer = null;
    }
    if (this.bgmMelodyTimer) {
      this.bgmMelodyTimer.remove(false);
      this.bgmMelodyTimer = null;
    }
    const ctx = this.getAudioContext();
    if (this.bgmMasterGain && ctx) {
      const now = ctx.currentTime;
      this.bgmMasterGain.gain.cancelScheduledValues(now);
      this.bgmMasterGain.gain.setValueAtTime(this.bgmMasterGain.gain.value || BGM_MASTER_GAIN, now);
      this.bgmMasterGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);
    }
    for (const item of this.bgmOscillators || []) {
      try {
        item.osc.stop((this.getAudioContext()?.currentTime || 0) + 0.28);
      } catch {
        // no-op
      }
    }
    this.bgmOscillators = [];
    this.bgmMasterGain = null;
    this.bgmRunning = false;
  }

  pauseBackgroundMusicHard(): void {
    if (this.bgmPulseTimer) {
      this.bgmPulseTimer.remove(false);
      this.bgmPulseTimer = null;
    }
    if (this.bgmMelodyTimer) {
      this.bgmMelodyTimer.remove(false);
      this.bgmMelodyTimer = null;
    }
    const ctx = this.getAudioContext();
    if (ctx && this.bgmMasterGain) {
      const now = ctx.currentTime;
      this.bgmMasterGain.gain.cancelScheduledValues(now);
      this.bgmMasterGain.gain.setValueAtTime(0.0001, now);
    }
    for (const item of this.bgmOscillators || []) {
      try {
        item.osc.stop((this.getAudioContext()?.currentTime || 0) + 0.02);
      } catch {
        // ignore
      }
    }
    this.bgmOscillators = [];
    this.bgmMasterGain = null;
    this.bgmRunning = false;
  }

  resumeBackgroundMusicAfterPause(): void {
    this.tryStartBackgroundMusic();
  }
}
