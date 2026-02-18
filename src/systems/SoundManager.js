let audioCtx = null;
let masterGain = null;
let muted = false;

function getContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0.3;
    masterGain.connect(audioCtx.destination);
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

function getOutput() {
  getContext();
  return masterGain;
}

function playTone(freq, duration, type = 'square', volume = 1, delay = 0) {
  const ctx = getContext();
  if (muted) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.value = volume * 0.3;
  gain.gain.setValueAtTime(volume * 0.3, ctx.currentTime + delay);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);
  osc.connect(gain);
  gain.connect(getOutput());
  osc.start(ctx.currentTime + delay);
  osc.stop(ctx.currentTime + delay + duration);
}

function playNoise(duration, volume = 0.5, delay = 0) {
  const ctx = getContext();
  if (muted) return;
  const bufferSize = ctx.sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * volume;
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(volume * 0.3, ctx.currentTime + delay);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);
  source.connect(gain);
  gain.connect(getOutput());
  source.start(ctx.currentTime + delay);
}

export const SoundManager = {
  // Ensure audio context is initialized (call on first user interaction)
  init() {
    getContext();
  },

  setMuted(value) {
    muted = value;
  },

  isMuted() {
    return muted;
  },

  // --- Ski Phase Sounds ---

  coinPickup() {
    playTone(880, 0.08, 'square', 0.6);
    playTone(1320, 0.12, 'square', 0.5, 0.06);
  },

  starPickup() {
    playTone(660, 0.08, 'square', 0.5);
    playTone(880, 0.08, 'square', 0.5, 0.08);
    playTone(1100, 0.15, 'square', 0.6, 0.16);
  },

  potionPickup() {
    playTone(440, 0.1, 'sine', 0.5);
    playTone(660, 0.1, 'sine', 0.5, 0.1);
    playTone(880, 0.15, 'sine', 0.6, 0.2);
  },

  obstacleHit() {
    playNoise(0.15, 0.6);
    playTone(120, 0.2, 'sawtooth', 0.5);
  },

  rampJump() {
    const ctx = getContext();
    if (muted) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.25);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc.connect(gain);
    gain.connect(getOutput());
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  },

  trickComplete() {
    playTone(520, 0.08, 'square', 0.5);
    playTone(660, 0.08, 'square', 0.5, 0.08);
    playTone(780, 0.08, 'square', 0.5, 0.16);
    playTone(1040, 0.2, 'square', 0.6, 0.24);
  },

  finishLine() {
    playTone(520, 0.12, 'square', 0.6);
    playTone(660, 0.12, 'square', 0.6, 0.12);
    playTone(780, 0.12, 'square', 0.6, 0.24);
    playTone(1040, 0.3, 'square', 0.7, 0.36);
  },

  // --- Combat Sounds ---

  attackHit() {
    playNoise(0.08, 0.5);
    playTone(300, 0.1, 'sawtooth', 0.4, 0.02);
  },

  criticalHit() {
    playNoise(0.1, 0.6);
    playTone(400, 0.08, 'sawtooth', 0.5);
    playTone(600, 0.15, 'square', 0.5, 0.08);
  },

  defend() {
    playTone(200, 0.15, 'triangle', 0.4);
    playTone(250, 0.1, 'triangle', 0.3, 0.05);
  },

  specialAttack() {
    const ctx = getContext();
    if (muted) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.2);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc.connect(gain);
    gain.connect(getOutput());
    osc.start();
    osc.stop(ctx.currentTime + 0.35);
    playNoise(0.15, 0.5, 0.15);
  },

  enemyAttack() {
    playTone(180, 0.12, 'sawtooth', 0.4);
    playNoise(0.1, 0.4, 0.05);
  },

  playerHurt() {
    playTone(300, 0.08, 'square', 0.5);
    playTone(200, 0.15, 'square', 0.4, 0.08);
  },

  enemyDeath() {
    const ctx = getContext();
    if (muted) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(400, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.4);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc.connect(gain);
    gain.connect(getOutput());
    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  },

  usePotion() {
    playTone(440, 0.1, 'sine', 0.4);
    playTone(550, 0.1, 'sine', 0.4, 0.1);
    playTone(660, 0.1, 'sine', 0.5, 0.2);
    playTone(880, 0.2, 'sine', 0.6, 0.3);
  },

  // --- QTE Sounds ---

  qteMash() {
    playTone(600, 0.04, 'square', 0.3);
  },

  qteSuccess() {
    playTone(660, 0.1, 'square', 0.5);
    playTone(880, 0.15, 'square', 0.6, 0.1);
  },

  qteFail() {
    playTone(300, 0.15, 'sawtooth', 0.4);
    playTone(200, 0.2, 'sawtooth', 0.3, 0.1);
  },

  // --- UI / Scene Sounds ---

  buttonClick() {
    playTone(800, 0.06, 'square', 0.3);
  },

  buttonHover() {
    playTone(600, 0.03, 'square', 0.15);
  },

  victory() {
    playTone(520, 0.15, 'square', 0.5);
    playTone(660, 0.15, 'square', 0.5, 0.15);
    playTone(780, 0.15, 'square', 0.5, 0.3);
    playTone(1040, 0.15, 'square', 0.6, 0.45);
    playTone(780, 0.1, 'square', 0.5, 0.6);
    playTone(1040, 0.35, 'square', 0.7, 0.7);
  },

  defeat() {
    playTone(400, 0.2, 'sawtooth', 0.5);
    playTone(350, 0.2, 'sawtooth', 0.4, 0.2);
    playTone(300, 0.2, 'sawtooth', 0.3, 0.4);
    playTone(200, 0.4, 'sawtooth', 0.3, 0.6);
  },
};
