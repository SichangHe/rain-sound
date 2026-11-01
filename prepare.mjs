#!/usr/bin/env node
import {spawnSync} from 'node:child_process';
import {writeFileSync} from 'node:fs';

// 🧑 "Maybe you just download it somewhere and make the connection between the start and end smooth"
const [source, destination] = process.argv.slice(2);
if (!source || !destination || process.argv.length !== 4) {
  console.error('Usage: node prepare.mjs source-audio output.wav');
  process.exit(1);
}
const rate = 48000;
const frames = 120 * rate;
const overlap = 8 * rate;
const decoded = spawnSync('ffmpeg', ['-v', 'error', '-i', source, '-af', 'asetpts=N/SR/TB', '-t', '128',
  '-f', 'f32le', '-ac', '2', '-ar', String(rate), 'pipe:1'], {maxBuffer: 64 * 1024 * 1024});
if (decoded.error || decoded.status !== 0) {
  console.error(decoded.error?.message ?? decoded.stderr.toString());
  process.exit(1);
}
if (decoded.stdout.length < (frames + overlap) * 8) {
  console.error('Source must contain at least 128 seconds of audio.');
  process.exit(1);
}
const samples = new Float32Array(frames * 2);
let peak = 0;
for (let i = 0; i < frames; i++) {
  for (let channel = 0; channel < 2; channel++) {
    const index = i * 2 + channel;
    let sample = decoded.stdout.readFloatLE(index * 4);
    if (i < overlap) {
      const angle = i / overlap * Math.PI / 2;
      sample = sample * Math.sin(angle)
        + decoded.stdout.readFloatLE(((frames + i) * 2 + channel) * 4) * Math.cos(angle);
    }
    samples[index] = sample;
    peak = Math.max(peak, Math.abs(sample));
  }
}
if (!Number.isFinite(peak) || peak === 0) {
  console.error('Source contains invalid or silent audio.');
  process.exit(1);
}
const wav = Buffer.alloc(44 + frames * 4);
wav.write('RIFF', 0); wav.writeUInt32LE(wav.length - 8, 4);
wav.write('WAVEfmt ', 8); wav.writeUInt32LE(16, 16);
wav.writeUInt16LE(1, 20); wav.writeUInt16LE(2, 22);
wav.writeUInt32LE(rate, 24); wav.writeUInt32LE(rate * 4, 28);
wav.writeUInt16LE(4, 32); wav.writeUInt16LE(16, 34);
wav.write('data', 36); wav.writeUInt32LE(frames * 4, 40);
const gain = 10 ** (-1 / 20) / peak;
for (let i = 0; i < samples.length; i++) wav.writeInt16LE(Math.round(samples[i] * gain * 32767), 44 + i * 2);
writeFileSync(destination, wav);
