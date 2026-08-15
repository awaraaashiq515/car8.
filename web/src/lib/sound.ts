export function playNotificationSound() {
  if (typeof window === "undefined") return;
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    // Play pleasant 3-tone chime: E5 (659.25Hz) -> G#5 (830.61Hz) -> B5 (987.77Hz)
    const tones = [
      { freq: 659.25, start: 0, duration: 0.14 },
      { freq: 830.61, start: 0.12, duration: 0.14 },
      { freq: 987.77, start: 0.24, duration: 0.4 },
    ];

    tones.forEach(({ freq, start, duration }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime + start);

      gain.gain.setValueAtTime(0, ctx.currentTime + start);
      gain.gain.linearRampToValueAtTime(0.35, ctx.currentTime + start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + duration + 0.05);
    });
  } catch (e) {
    console.warn("Audio playback error:", e);
  }
}
