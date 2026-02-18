let audioCtx = null;
let masterGain = null;
let muted = false;
let unlocked = false;

function ensureContext() {
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      masterGain = audioCtx.createGain();
      masterGain.gain.value = 0.5;
      masterGain.connect(audioCtx.destination);
    }
    return true;
  } catch (e) {
    return false;
  }
}

function resumeContext() {
  if (!ensureContext()) return false;
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  unlocked = true;
  return true;
}

function isReady() {
  return audioCtx && unlocked && !muted;
}

function playTone(freq, duration, type = 'square', volume = 1, delay = 0) {
  if (!isReady()) return;
  try {
    const t = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t + delay);
    gain.gain.setValueAtTime(volume, t + delay);
    gain.gain.exponentialRampToValueAtTime(0.001, t + delay + duration);
    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(t + delay);
    osc.stop(t + delay + duration + 0.01);
  } catch (e) {
    // ignore audio errors
  }
}

function playNoise(duration, volume = 0.5, delay = 0) {
  if (!isReady()) return;
  try {
    const t = audioCtx.currentTime;
    const bufferSize = Math.max(1, Math.floor(audioCtx.sampleRate * duration));
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1);
    }
    const source = audioCtx.createBufferSource();
    source.buffer = buffer;
    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(volume, t + delay);
    gain.gain.exponentialRampToValueAtTime(0.001, t + delay + duration);
    source.connect(gain);
    gain.connect(masterGain);
    source.start(t + delay);
  } catch (e) {
    // ignore audio errors
  }
}

function playSweep(startFreq, endFreq, duration, type = 'sine', volume = 0.3) {
  if (!isReady()) return;
  try {
    const t = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(startFreq, t);
    osc.frequency.exponentialRampToValueAtTime(endFreq, t + duration * 0.8);
    gain.gain.setValueAtTime(volume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(t);
    osc.stop(t + duration + 0.01);
  } catch (e) {
    // ignore audio errors
  }
}

export const SoundManager = {
  // Call on first user interaction (click/tap) to unlock audio
  unlock() {
    resumeContext();
  },

  setMuted(value) {
    muted = value;
  },

  isMuted() {
    return muted;
  },

  // --- Ski Phase Sounds ---

  coinPickup() {
    playTone(880, 0.1, 'square', 0.4);
    playTone(1320, 0.15, 'square', 0.35, 0.08);
  },

  starPickup() {
    playTone(660, 0.1, 'square', 0.35);
    playTone(880, 0.1, 'square', 0.35, 0.1);
    playTone(1100, 0.18, 'square', 0.4, 0.2);
  },

  potionPickup() {
    playTone(440, 0.12, 'sine', 0.4);
    playTone(660, 0.12, 'sine', 0.4, 0.12);
    playTone(880, 0.18, 'sine', 0.45, 0.24);
  },

  obstacleHit() {
    playNoise(0.15, 0.4);
    playTone(120, 0.2, 'sawtooth', 0.35);
  },

  rampJump() {
    playSweep(200, 800, 0.3, 'sine', 0.3);
  },

  trickComplete() {
    playTone(520, 0.1, 'square', 0.35);
    playTone(660, 0.1, 'square', 0.35, 0.1);
    playTone(780, 0.1, 'square', 0.35, 0.2);
    playTone(1040, 0.2, 'square', 0.4, 0.3);
  },

  finishLine() {
    playTone(520, 0.15, 'square', 0.4);
    playTone(660, 0.15, 'square', 0.4, 0.15);
    playTone(780, 0.15, 'square', 0.4, 0.3);
    playTone(1040, 0.3, 'square', 0.45, 0.45);
  },

  // --- Combat Sounds ---

  attackHit() {
    playNoise(0.08, 0.35);
    playTone(300, 0.12, 'sawtooth', 0.3, 0.02);
  },

  criticalHit() {
    playNoise(0.1, 0.4);
    playTone(400, 0.1, 'sawtooth', 0.35);
    playTone(600, 0.18, 'square', 0.35, 0.1);
  },

  defend() {
    playTone(200, 0.18, 'triangle', 0.3);
    playTone(250, 0.12, 'triangle', 0.25, 0.06);
  },

  specialAttack() {
    playSweep(150, 600, 0.35, 'sawtooth', 0.3);
    playNoise(0.15, 0.35, 0.18);
  },

  enemyAttack() {
    playTone(180, 0.15, 'sawtooth', 0.3);
    playNoise(0.1, 0.3, 0.06);
  },

  playerHurt() {
    playTone(300, 0.1, 'square', 0.35);
    playTone(200, 0.18, 'square', 0.3, 0.1);
  },

  enemyDeath() {
    playSweep(400, 80, 0.4, 'square', 0.3);
  },

  usePotion() {
    playTone(440, 0.12, 'sine', 0.3);
    playTone(550, 0.12, 'sine', 0.3, 0.12);
    playTone(660, 0.12, 'sine', 0.35, 0.24);
    playTone(880, 0.2, 'sine', 0.4, 0.36);
  },

  // --- QTE Sounds ---

  qteMash() {
    playTone(600, 0.05, 'square', 0.25);
  },

  qteSuccess() {
    playTone(660, 0.12, 'square', 0.35);
    playTone(880, 0.18, 'square', 0.4, 0.12);
  },

  qteFail() {
    playTone(300, 0.18, 'sawtooth', 0.3);
    playTone(200, 0.22, 'sawtooth', 0.25, 0.12);
  },

  // --- UI / Scene Sounds ---

  buttonClick() {
    playTone(800, 0.07, 'square', 0.25);
  },

  buttonHover() {
    playTone(600, 0.04, 'square', 0.12);
  },

  victory() {
    playTone(520, 0.18, 'square', 0.35);
    playTone(660, 0.18, 'square', 0.35, 0.18);
    playTone(780, 0.18, 'square', 0.35, 0.36);
    playTone(1040, 0.18, 'square', 0.4, 0.54);
    playTone(780, 0.12, 'square', 0.35, 0.72);
    playTone(1040, 0.35, 'square', 0.45, 0.84);
  },

  defeat() {
    playTone(400, 0.22, 'sawtooth', 0.35);
    playTone(350, 0.22, 'sawtooth', 0.3, 0.22);
    playTone(300, 0.22, 'sawtooth', 0.25, 0.44);
    playTone(200, 0.4, 'sawtooth', 0.25, 0.66);
  },
};
