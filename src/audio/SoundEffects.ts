let ctx: AudioContext | null = null;

function getContext(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  return ctx;
}

function playTone(freq: number, duration: number, type: OscillatorType = 'sine', startTime = 0) {
  const audio = getContext();
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.15, audio.currentTime + startTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + startTime + duration);
  osc.connect(gain);
  gain.connect(audio.destination);
  osc.start(audio.currentTime + startTime);
  osc.stop(audio.currentTime + startTime + duration);
}

export function playTap() {
  playTone(880, 0.05, 'sine');
}

export function playCorrect() {
  playTone(523, 0.12, 'sine', 0);
  playTone(659, 0.18, 'sine', 0.1);
  playTone(784, 0.25, 'sine', 0.22);
}

export function playStarCollect() {
  playTone(523, 0.06, 'triangle', 0);
  playTone(659, 0.06, 'triangle', 0.06);
  playTone(784, 0.06, 'triangle', 0.12);
  playTone(1047, 0.12, 'triangle', 0.18);
}

export function playCelebration() {
  const notes = [523, 659, 784, 1047, 784, 1047, 1319];
  notes.forEach((freq, i) => {
    playTone(freq, 0.12, 'sine', i * 0.08);
  });
}

export function ensureAudioContext() {
  const audio = getContext();
  if (audio.state === 'suspended') {
    audio.resume();
  }
}
