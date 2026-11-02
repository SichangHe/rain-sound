#!/usr/bin/env node
import {spawn, spawnSync} from 'node:child_process';
import {mkdtempSync, writeFileSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {RAIN_URL, LOOP, OVERLAP} from './sound.mjs';

// 🧑 "continuous natural and comfortable rain soundtrack for listening when sleeping ... a single script that the user runs"
const args = process.argv.slice(2);
if (args.length && !(args.length === 2 && args[0] === '--render')) {
  console.log('Usage: ./rain.mjs [--render rain.wav]\nPlays until Ctrl+C. Requires Node.js and FFmpeg (ffmpeg, ffplay).');
  process.exit(args.includes('--help') ? 0 : 1);
}
for (const tool of args.length ? ['ffmpeg'] : ['ffmpeg', 'ffplay']) {
  if (spawnSync(tool, ['-version'], {stdio: 'ignore'}).status !== 0) {
    console.error(`Install FFmpeg (${tool}) first.`);
    process.exit(1);
  }
}
console.log('Downloading rain (about 20 MB)…');
const directory = mkdtempSync(join(tmpdir(), 'rain-'));
const file = join(directory, 'rain.m4a');
process.on('exit', () => rmSync(directory, {recursive: true, force: true}));
try {
  const response = await fetch(RAIN_URL, {signal: AbortSignal.timeout(300000)});
  if (!response.ok) throw new Error(`Audio download failed: HTTP ${response.status}`);
  writeFileSync(file, Buffer.from(await response.arrayBuffer()));
} catch (error) {
  console.error(error.message);
  process.exit(1);
}

const RATE = 48000, FRAME = 4;
// Decodes the file as 16-bit stereo PCM; read(n) resolves with exactly n bytes.
function decoder() {
  const child = spawn('ffmpeg', ['-v', 'error', '-i', file, '-f', 's16le', '-ac', '2', '-ar', String(RATE), 'pipe:1'],
    {stdio: ['ignore', 'pipe', 'ignore']});
  const chunks = [];
  let length = 0, wake = null, ended = false;
  child.stdout.on('data', data => {
    chunks.push(data);
    length += data.length;
    if (length > 1 << 22) child.stdout.pause();
    wake?.();
  });
  child.stdout.on('end', () => { ended = true; wake?.(); });
  return {
    async read(n) {
      while (length < n && !ended) {
        child.stdout.resume();
        await new Promise(resolve => { wake = resolve; });
      }
      const out = Buffer.alloc(n);
      for (let at = 0; at < n && chunks.length;) {
        const take = Math.min(n - at, chunks[0].length);
        chunks[0].copy(out, at, 0, take);
        at += take;
        length -= take;
        if (take === chunks[0].length) chunks.shift(); else chunks[0] = chunks[0].subarray(take);
      }
      if (length < 1 << 22) child.stdout.resume();
      return out;
    },
    stop() { child.kill(); },
  };
}
// Equal-power crossfade from the outgoing pass's tail into the incoming pass's start.
function crossfade(tail, head) {
  const out = Buffer.alloc(head.length), frames = head.length / FRAME;
  for (let i = 0; i < frames * 2; i++) {
    const angle = Math.floor(i / 2) / frames * Math.PI / 2;
    const v = tail.readInt16LE(i * 2) * Math.cos(angle) + head.readInt16LE(i * 2) * Math.sin(angle);
    out.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(v))), i * 2);
  }
  return out;
}
const CHUNK = RATE * FRAME;
function wavHeader(size) {
  const header = Buffer.alloc(44);
  header.write('RIFF', 0); header.writeUInt32LE(36 + size, 4); header.write('WAVEfmt ', 8);
  header.writeUInt32LE(16, 16); header.writeUInt16LE(1, 20); header.writeUInt16LE(2, 22);
  header.writeUInt32LE(RATE, 24); header.writeUInt32LE(RATE * FRAME, 28); header.writeUInt16LE(FRAME, 32);
  header.writeUInt16LE(16, 34); header.write('data', 36); header.writeUInt32LE(size, 40);
  return header;
}
async function copy(source, seconds, sink) {
  for (let s = 0; s < seconds; s++) await sink(await source.read(CHUNK));
}

if (args.length) {
  // One seamless LOOP-second WAV: its start already contains the crossfade from its end.
  const pass = decoder(), tail = decoder();
  const chunks = [];
  const sink = async chunk => { chunks.push(chunk); };
  await tail.read(LOOP * CHUNK);
  const head = await pass.read(OVERLAP * CHUNK);
  chunks.push(crossfade(await tail.read(OVERLAP * CHUNK), head));
  tail.stop();
  await copy(pass, LOOP - OVERLAP, sink);
  pass.stop();
  const data = Buffer.concat(chunks);
  writeFileSync(args[1], Buffer.concat([wavHeader(data.length), data]));
} else {
  console.log('Rain is playing. Adjust your device volume; press Ctrl+C to stop.');
  const player = spawn('ffplay', ['-nodisp', '-loglevel', 'error', '-i', 'pipe:0'], {stdio: ['pipe', 'inherit', 'inherit']});
  player.stdin.on('error', () => {});
  const sink = chunk => player.stdin.write(chunk) ? Promise.resolve() : new Promise(r => player.stdin.once('drain', r));
  for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => { player.kill(); process.exit(0); });
  player.on('close', code => process.exit(code ?? 1));
  await sink(wavHeader(0xffffffff - 36));
  let pass = decoder();
  await copy(pass, LOOP, sink);
  for (;;) {
    const next = decoder();
    await sink(crossfade(await pass.read(OVERLAP * CHUNK), await next.read(OVERLAP * CHUNK)));
    pass.stop();
    pass = next;
    await copy(pass, LOOP - OVERLAP, sink);
  }
}
