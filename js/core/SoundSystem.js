let audioCtx = null;
let enabled = true;

function getContext() {
  if (!audioCtx) {
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch {
      return null;
    }
  }
  return audioCtx;
}

function playTone(freq, duration, type = 'sine', volume = 0.08) {
  if (!enabled) return;
  const ctx = getContext();
  if (!ctx) return;
  if (ctx.state === 'suspended') ctx.resume();

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.value = volume;
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  osc.stop(ctx.currentTime + duration);
}

function vibrate(pattern) {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    try { navigator.vibrate(pattern); } catch { /* ignore */ }
  }
}

export const SoundSystem = {
  init(settings) {
    enabled = settings?.soundEnabled !== false;
  },

  setEnabled(val) {
    enabled = !!val;
  },

  playTap() {
    playTone(440, 0.06, 'triangle', 0.06);
    vibrate(10);
  },

  playPurchase() {
    playTone(523, 0.08, 'sine', 0.07);
    setTimeout(() => playTone(659, 0.1, 'sine', 0.06), 60);
  },

  playAchievement() {
    playTone(523, 0.1, 'sine', 0.08);
    setTimeout(() => playTone(659, 0.1, 'sine', 0.08), 100);
    setTimeout(() => playTone(784, 0.15, 'sine', 0.07), 200);
    vibrate([30, 50, 30]);
  },

  playPrestige() {
    playTone(220, 0.2, 'sawtooth', 0.05);
    setTimeout(() => playTone(330, 0.25, 'sine', 0.06), 150);
    vibrate(40);
  },

  playAscension() {
    playTone(330, 0.15, 'sine', 0.07);
    setTimeout(() => playTone(440, 0.15, 'sine', 0.07), 120);
    setTimeout(() => playTone(554, 0.2, 'sine', 0.08), 240);
    setTimeout(() => playTone(659, 0.3, 'sine', 0.06), 360);
    vibrate([20, 30, 20, 30, 40]);
  },

  playTranscendence() {
    playTone(110, 0.3, 'sine', 0.06);
    setTimeout(() => playTone(165, 0.3, 'sine', 0.07), 200);
    setTimeout(() => playTone(220, 0.4, 'triangle', 0.08), 400);
    vibrate([50, 80, 50]);
  },

  playEvent() {
    playTone(880, 0.12, 'sine', 0.05);
  },

  wireEventBus(EventBus, EVENTS) {
    EventBus.on(EVENTS.TAP_PERFORMED, () => this.playTap());
    EventBus.on(EVENTS.GENERATOR_PURCHASED, () => this.playPurchase());
    EventBus.on(EVENTS.UPGRADE_PURCHASED, () => this.playPurchase());
    EventBus.on(EVENTS.ACHIEVEMENT_UNLOCKED, () => this.playAchievement());
    EventBus.on(EVENTS.PRESTIGE_PERFORMED, () => this.playPrestige());
    EventBus.on(EVENTS.ASCENSION_PERFORMED, () => this.playAscension());
    EventBus.on(EVENTS.TRANSCENDENCE_PERFORMED, () => this.playTranscendence());
    EventBus.on(EVENTS.RANDOM_EVENT_START, () => this.playEvent());
  }
};
