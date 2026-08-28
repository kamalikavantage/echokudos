// Audio helpers shared by the recorder, feed player, and highlight reel.
// Real recordings go through MediaRecorder; seeded demo cards get a synthesized
// placeholder clip so every card in the feed is actually playable.

let sharedAudioCtx = null;
export function getAudioContext() {
  if (!sharedAudioCtx) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    sharedAudioCtx = new Ctx();
  }
  return sharedAudioCtx;
}

export function pickSupportedMimeType() {
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/ogg;codecs=opus",
  ];
  if (typeof MediaRecorder === "undefined") return null;
  return candidates.find((type) => MediaRecorder.isTypeSupported?.(type)) || "";
}

// Encodes an AudioBuffer as a 16-bit PCM WAV Blob (small, dependency-free, universally playable).
export function audioBufferToWavBlob(buffer) {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const numFrames = buffer.length;
  const bytesPerSample = 2;
  const blockAlign = numChannels * bytesPerSample;
  const dataSize = numFrames * blockAlign;
  const bufferOut = new ArrayBuffer(44 + dataSize);
  const view = new DataView(bufferOut);

  const writeString = (offset, str) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };

  writeString(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true);
  writeString(36, "data");
  view.setUint32(40, dataSize, true);

  const channelData = [];
  for (let ch = 0; ch < numChannels; ch++) channelData.push(buffer.getChannelData(ch));

  let offset = 44;
  for (let i = 0; i < numFrames; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      const sample = Math.max(-1, Math.min(1, channelData[ch][i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
      offset += 2;
    }
  }

  return new Blob([bufferOut], { type: "audio/wav" });
}

function seededRandomFn(seed) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

// Synthesizes a soft, filtered-noise "murmur" clip standing in for a real voice recording —
// clearly a placeholder, but genuinely renders and plays back as real audio.
export async function synthesizePlaceholderClip({ seed = 1, durationSec = 6, brightness = 0.5 }) {
  const sampleRate = 44100;
  const length = Math.ceil(sampleRate * durationSec);
  const OfflineCtx = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  const ctx = new OfflineCtx(1, length, sampleRate);

  const rand = seededRandomFn(seed * 7919);
  const noiseBuffer = ctx.createBuffer(1, length, sampleRate);
  const data = noiseBuffer.getChannelData(0);

  // Build a speech-like amplitude envelope: several soft "syllable" pulses.
  const pulseCount = 8 + Math.floor(rand() * 6);
  const pulses = Array.from({ length: pulseCount }, () => ({
    center: rand(),
    width: 0.03 + rand() * 0.05,
  }));

  for (let i = 0; i < length; i++) {
    const t = i / length;
    let env = 0;
    for (const p of pulses) {
      const d = (t - p.center) / p.width;
      env += Math.exp(-d * d);
    }
    env = Math.min(1, env);
    const fadeIn = Math.min(1, t / 0.03);
    const fadeOut = Math.min(1, (1 - t) / 0.05);
    data[i] = (rand() * 2 - 1) * env * fadeIn * fadeOut * 0.6;
  }

  const source = ctx.createBufferSource();
  source.buffer = noiseBuffer;

  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 300 + brightness * 1400;
  filter.Q.value = 0.7;

  const gain = ctx.createGain();
  gain.gain.value = 1.4;

  source.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  source.start();

  const rendered = await ctx.startRendering();
  return audioBufferToWavBlob(rendered);
}

// Downsamples a recorded/synthesized Blob into peak bars for a static waveform display.
export async function computePeaksFromBlob(blob, bars = 40) {
  const arrayBuffer = await blob.arrayBuffer();
  const ctx = getAudioContext();
  const audioBuffer = await ctx.decodeAudioData(arrayBuffer.slice(0));
  const raw = audioBuffer.getChannelData(0);
  const blockSize = Math.max(1, Math.floor(raw.length / bars));
  const peaks = [];
  for (let i = 0; i < bars; i++) {
    const start = i * blockSize;
    let sum = 0;
    for (let j = 0; j < blockSize; j++) {
      const idx = start + j;
      if (idx < raw.length) sum += Math.abs(raw[idx]);
    }
    peaks.push(Math.max(0.06, Math.min(1, (sum / blockSize) * 4)));
  }
  return peaks;
}

export function formatDuration(sec) {
  const s = Math.max(0, Math.round(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

export function formatRelativeTime(ts) {
  const diffMs = Date.now() - ts;
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}
