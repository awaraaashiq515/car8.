// Ultra-reliable Sound and Vibration Alert System for Driver App
// Uses Dual Engine: HTML5 Audio (WAV Blob) + Web Audio API (Oscillators) + Looping Vibration

let sharedAudioCtx: AudioContext | null = null;
let sharedAudioElement: HTMLAudioElement | null = null;
let audioUnlocked = false;

let activeOscLoopInterval: any = null;
let activeVibrationInterval: any = null;
let isAlertActive = false;

/**
 * Generates a clean 1.2s Taxi/Uber-style multi-tone loud alert sound encoded as a WAV Data URI.
 * This works across all browsers (Safari, Chrome, Firefox, Android WebView, Capacitor).
 */
function createTaxiAlertWavDataUri(): string {
  const sampleRate = 22050;
  const duration = 1.2; // 1.2 seconds per loop
  const totalSamples = Math.floor(sampleRate * duration);
  const buffer = new ArrayBuffer(44 + totalSamples * 2);
  const view = new DataView(buffer);

  // Helper to write string to DataView
  function writeString(offset: number, string: string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  // RIFF Chunk
  writeString(0, "RIFF");
  view.setUint32(4, 36 + totalSamples * 2, true);
  writeString(8, "WAVE");

  // fmt Subchunk
  writeString(12, "fmt ");
  view.setUint32(16, 16, true); // SubChunk1Size (16 for PCM)
  view.setUint16(20, 1, true);  // AudioFormat (1 = PCM)
  view.setUint16(22, 1, true);  // NumChannels (1 = Mono)
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); // ByteRate (SampleRate * NumChannels * BitsPerSample/8)
  view.setUint16(32, 2, true);  // BlockAlign (NumChannels * BitsPerSample/8)
  view.setUint16(34, 16, true); // BitsPerSample (16 bits)

  // data Subchunk
  writeString(36, "data");
  view.setUint32(40, totalSamples * 2, true);

  // Sound sequence: 4 distinct loud high-pitched beeps (Uber/Ola alert style)
  // Beep 1: 950 Hz (0.00s - 0.12s)
  // Beep 2: 1250 Hz (0.16s - 0.28s)
  // Beep 3: 1550 Hz (0.32s - 0.44s)
  // Beep 4: 1900 Hz (0.48s - 0.75s)
  // Silence: (0.75s - 1.20s)
  const beeps = [
    { start: 0.00, end: 0.12, freq: 950 },
    { start: 0.16, end: 0.28, freq: 1250 },
    { start: 0.32, end: 0.44, freq: 1550 },
    { start: 0.48, end: 0.75, freq: 1900 },
  ];

  let offset = 44;
  for (let i = 0; i < totalSamples; i++) {
    const t = i / sampleRate;
    let sample = 0;

    for (const b of beeps) {
      if (t >= b.start && t <= b.end) {
        const beepDuration = b.end - b.start;
        const progress = (t - b.start) / beepDuration;
        // Smooth envelope attack and decay to avoid clicking
        let env = 1.0;
        if (progress < 0.08) env = progress / 0.08;
        else if (progress > 0.85) env = (1.0 - progress) / 0.15;

        // Add main tone + 2nd harmonic for loud, penetrating buzzer sound
        const tone1 = Math.sin(2 * Math.PI * b.freq * t);
        const tone2 = 0.35 * Math.sin(2 * Math.PI * (b.freq * 2) * t);
        sample += (tone1 + tone2) * env * 0.85;
      }
    }

    // Clamp between -1.0 and 1.0
    sample = Math.max(-1, Math.min(1, sample));
    view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
    offset += 2;
  }

  // Convert buffer to base64
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return "data:audio/wav;base64," + btoa(binary);
}

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    if (!sharedAudioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        sharedAudioCtx = new AudioContextClass();
      }
    }
    if (sharedAudioCtx && sharedAudioCtx.state === "suspended") {
      sharedAudioCtx.resume().catch(() => {});
    }
    return sharedAudioCtx;
  } catch (e) {
    console.warn("AudioContext error:", e);
    return null;
  }
}

function getAudioElement(): HTMLAudioElement | null {
  if (typeof window === "undefined") return null;
  try {
    if (!sharedAudioElement) {
      const wavUri = createTaxiAlertWavDataUri();
      sharedAudioElement = new Audio(wavUri);
      sharedAudioElement.loop = true;
      sharedAudioElement.volume = 1.0;
      sharedAudioElement.preload = "auto";
    }
    return sharedAudioElement;
  } catch (e) {
    console.warn("Audio element error:", e);
    return null;
  }
}

/**
 * Call on any user tap/click to unlock Web Audio & HTMLAudioElement playback in browser
 */
export function unlockAudio() {
  if (typeof window === "undefined") return;
  audioUnlocked = true;

  // 1. Resume AudioContext
  const ctx = getAudioContext();
  if (ctx && ctx.state === "suspended") {
    ctx.resume().catch(() => {});
  }

  // 2. Pre-warm HTMLAudioElement
  try {
    const audio = getAudioElement();
    if (audio) {
      // Play and immediately pause to satisfy browser autoplay gate
      audio.play().then(() => {
        if (!isAlertActive) {
          audio.pause();
          audio.currentTime = 0;
        }
      }).catch(() => {});
    }
  } catch {}
}

/** Single-shot general notification chime */
export function playNotificationSound() {
  if (typeof window === "undefined") return;
  try {
    unlockAudio();
    const ctx = getAudioContext();
    if (!ctx) return;

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
      gain.gain.linearRampToValueAtTime(0.4, ctx.currentTime + start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + duration + 0.05);
    });
  } catch (e) {
    console.warn("Notification sound error:", e);
  }
}

/** Plays a single synthesized tone burst via Web Audio API */
function playWebAudioAlertPulse() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;
    const notes = [
      { freq: 950, start: 0.00, duration: 0.12, vol: 0.6 },
      { freq: 1250, start: 0.16, duration: 0.12, vol: 0.65 },
      { freq: 1550, start: 0.32, duration: 0.12, vol: 0.7 },
      { freq: 1900, start: 0.48, duration: 0.28, vol: 0.8 },
    ];

    notes.forEach(({ freq, start, duration, vol }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, now + start);

      gain.gain.setValueAtTime(0.0001, now + start);
      gain.gain.exponentialRampToValueAtTime(vol, now + start + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + start + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + start);
      osc.stop(now + start + duration + 0.02);
    });
  } catch (e) {
    console.warn("Pulse sound error:", e);
  }
}

/** Trigger vibration burst */
function triggerVibration() {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate([350, 150, 350, 150, 500]);
    } catch {}
  }
}

/**
 * Start continuous looping incoming ride ringtone + vibration.
 * Loops repeatedly until stopDriverRideAlert() is called.
 */
export function startDriverRideAlert(): () => void {
  if (typeof window === "undefined") return () => {};

  stopDriverRideAlert();
  isAlertActive = true;

  // 1. Start HTML5 Audio Looping element (Engine 1)
  try {
    const audio = getAudioElement();
    if (audio) {
      audio.currentTime = 0;
      audio.play().catch((err) => {
        console.log("HTML5 audio autoplay prevented, falling back to Web Audio synth:", err);
      });
    }
  } catch {}

  // 2. Start Web Audio Oscillator Loop (Engine 2)
  playWebAudioAlertPulse();
  activeOscLoopInterval = setInterval(() => {
    if (!isAlertActive) return;
    playWebAudioAlertPulse();
  }, 1200);

  // 3. Start Continuous Mobile Vibration Loop
  triggerVibration();
  activeVibrationInterval = setInterval(() => {
    if (!isAlertActive) return;
    triggerVibration();
  }, 1600);

  return stopDriverRideAlert;
}

/**
 * Stop continuous driver incoming ride alert sound & vibration
 */
export function stopDriverRideAlert() {
  isAlertActive = false;

  // 1. Stop HTML5 Audio
  try {
    if (sharedAudioElement) {
      sharedAudioElement.pause();
      sharedAudioElement.currentTime = 0;
    }
  } catch {}

  // 2. Stop Web Audio Loop
  if (activeOscLoopInterval) {
    clearInterval(activeOscLoopInterval);
    activeOscLoopInterval = null;
  }

  // 3. Stop Vibration Loop
  if (activeVibrationInterval) {
    clearInterval(activeVibrationInterval);
    activeVibrationInterval = null;
  }
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate(0);
    } catch {}
  }
}

/**
 * Test alert sound for specified duration (e.g. 3 seconds) so the driver can verify audio & vibration
 */
export function testDriverAlertSound(durationMs = 3500) {
  unlockAudio();
  startDriverRideAlert();
  setTimeout(() => {
    stopDriverRideAlert();
  }, durationMs);
}
