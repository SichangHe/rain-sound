#!/usr/bin/env node
import {spawnSync} from 'node:child_process';
import {LOOP, OVERLAP} from './sound.mjs';

// Cuts LOOP + OVERLAP seconds starting 10 minutes into the source, loudness-normalized, as AAC.
const [source, destination] = process.argv.slice(2);
if (!source || !destination || process.argv.length !== 4) {
  console.error('Usage: node prepare.mjs source-audio rain.m4a');
  process.exit(1);
}
const result = spawnSync('ffmpeg', ['-v', 'error', '-y', '-ss', '600', '-t', String(LOOP + OVERLAP), '-i', source,
  '-vn', '-af', 'loudnorm=I=-26:TP=-2', '-ar', '48000', '-ac', '2', '-c:a', 'aac', '-b:a', '128k', destination],
  {stdio: 'inherit'});
process.exit(result.status ?? 1);
