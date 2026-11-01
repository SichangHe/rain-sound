#!/usr/bin/env node
import {spawn, spawnSync} from 'node:child_process';
import {mkdtempSync, writeFileSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {makeRain} from './sound.mjs';

// 🧑 "continuous natural and comfortable rain soundtrack for listening when sleeping ... a single script that the user runs"
const args = process.argv.slice(2);
if (args.length && !(args.length === 2 && args[0] === '--render')) {
  console.log('Usage: ./rain.mjs [--render rain.wav]\nPlays until Ctrl+C. Requires Node.js and ffplay (FFmpeg).');
  process.exit(args.includes('--help') ? 0 : 1);
}
if (!args.length && spawnSync('ffplay', ['-version'], {stdio: 'ignore'}).status !== 0) {
  console.error('Install FFmpeg (ffplay) to play rain, or use --render rain.wav.');
  process.exit(1);
}
console.log('Preparing soft stereo rain…');
const wav = makeRain();
if (args.length) {
  writeFileSync(args[1], wav);
} else {
  const directory = mkdtempSync(join(tmpdir(), 'rain-'));
  const file = join(directory, 'rain.wav');
  const cleanup = () => rmSync(directory, {recursive: true, force: true});
  process.on('exit', cleanup);
  writeFileSync(file, wav);
  console.log('Rain is playing. Adjust your device volume; press Ctrl+C to stop.');
  const player = spawn('ffplay', ['-nodisp', '-autoexit', '-loglevel', 'error',
    '-loop', '0', '-af', 'afade=t=in:d=4', file], {stdio: 'inherit'});
  let stopping = false;
  for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => {
    stopping = true;
    player.kill(signal);
  });
  player.on('error', error => {
    console.error(error.message);
    process.exitCode = 1;
  });
  player.on('close', code => {
    cleanup();
    process.exitCode = stopping ? 0 : (code ?? 1);
  });
}
