/**
 * Procedural Web Audio API sound generator for PRO PATH
 * Generates realistic whistles, kick impacts, crowd roars, and tactical UI feedback.
 */

let audioCtx: AudioContext | null = null;
let isMuted = false;

// Initialize or resume AudioContext on user interaction
function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function setMuted(muted: boolean) {
  isMuted = muted;
  try {
    localStorage.setItem('pro_path_muted', muted ? 'true' : 'false');
  } catch {
    // Ignore storage errors
  }
}

export function getMuted(): boolean {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('pro_path_muted');
    if (saved !== null) {
      isMuted = saved === 'true';
    }
  }
  return isMuted;
}

/** Play referee whistle (frequency mod with slight trill) */
export function playWhistle(type: 'short' | 'double' | 'final' = 'short') {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const playSingleBlast = (startTime: number, duration: number) => {
    const osc = ctx.createOscillator();
    const mod = ctx.createOscillator();
    const modGain = ctx.createGain();
    const gainNode = ctx.createGain();

    // Whistle main tone ~2600Hz - 2800Hz with fast vibrato
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(2650, startTime);

    mod.type = 'sine';
    mod.frequency.setValueAtTime(45, startTime); // trill frequency
    modGain.gain.setValueAtTime(150, startTime);

    mod.connect(osc.frequency);

    gainNode.gain.setValueAtTime(0.001, startTime);
    gainNode.gain.exponentialRampToValueAtTime(0.25, startTime + 0.03);
    gainNode.gain.exponentialRampToValueAtTime(0.2, startTime + duration - 0.03);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    mod.start(startTime);
    osc.start(startTime);
    mod.stop(startTime + duration);
    osc.stop(startTime + duration);
  };

  const now = ctx.currentTime;
  if (type === 'short') {
    playSingleBlast(now, 0.22);
  } else if (type === 'double') {
    playSingleBlast(now, 0.15);
    playSingleBlast(now + 0.2, 0.22);
  } else if (type === 'final') {
    playSingleBlast(now, 0.25);
    playSingleBlast(now + 0.32, 0.25);
    playSingleBlast(now + 0.65, 0.65);
  }
}

/** Ball kick thud sound */
export function playBallKick() {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const now = ctx.currentTime;

  osc.type = 'sine';
  osc.frequency.setValueAtTime(140, now);
  osc.frequency.exponentialRampToValueAtTime(40, now + 0.09);

  gain.gain.setValueAtTime(0.3, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.09);
}

/** Goal celebration / crowd noise burst */
export function playGoalCheer() {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const duration = 1.6;
  const bufferSize = ctx.sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  // Pink noise approximation for stadium roar
  let b0 = 0, b1 = 0, b2 = 0;
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    b0 = 0.99 * b0 + white * 0.05;
    b1 = 0.95 * b1 + white * 0.1;
    b2 = 0.85 * b2 + white * 0.15;
    data[i] = (b0 + b1 + b2) * 0.2;
  }

  const noiseNode = ctx.createBufferSource();
  noiseNode.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(650, ctx.currentTime);
  filter.Q.setValueAtTime(1.5, ctx.currentTime);

  const gain = ctx.createGain();
  const now = ctx.currentTime;
  gain.gain.setValueAtTime(0.01, now);
  gain.gain.exponentialRampToValueAtTime(0.35, now + 0.35);
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

  noiseNode.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  noiseNode.start(now);
}

/** Card / warning chime */
export function playCardSound() {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const now = ctx.currentTime;

  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(520, now);
  osc.frequency.exponentialRampToValueAtTime(380, now + 0.18);

  gain.gain.setValueAtTime(0.15, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.18);
}

/** Tactical UI click */
export function playTacticalClick() {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const now = ctx.currentTime;

  osc.type = 'sine';
  osc.frequency.setValueAtTime(800, now);
  osc.frequency.exponentialRampToValueAtTime(400, now + 0.04);

  gain.gain.setValueAtTime(0.08, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.04);
}
