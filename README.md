# Minecraft rain for sleep
(authored by agents unless marked 🧑)

- run `./rain.mjs` with Node.js 18+ and FFmpeg installed
  - downloads the recording once per run, then plays until Ctrl+C
  - adjust device volume for comfort
  - save for offline playback with `./rain.mjs --render rain.wav`
- [mobile page](https://sichanghe.github.io/rain/)
  - tap Start Minecraft rain, then use the audio controls and device volume
  - downloads about 23 MB; native audio supports phone media controls
  - locked-screen playback and gapless looping depend on the browser
  - self-host by serving `index.html` and `sound.mjs` together over HTTP
- source
  - excerpt from TryzzMC’s [“🌧️ 10 hours of minecraft rain sounds (no music)”](https://www.youtube.com/watch?v=RRUkNshLopk), the human’s Minecraft reference
  - source description: “Rainy day in the murking swamp - 10 hours of rain sounds without music!”
  - recording excerpt, not synthesized rain or an official Minecraft app
- audio preparation
  - `node prepare.mjs source-audio output.wav` reads the first 128 seconds through FFmpeg
  - retains the first 120 seconds; blends the eight-second continuation into the beginning with equal-power fades
    - the last sample joins its original next sample at the loop boundary
    - no silence or repeated fade-out at the join
  - preserves stereo at 48 kHz, exports 16-bit PCM WAV, normalizes peak to −1 dBFS
  - release `minecraft-v1` stores the generated WAV outside Git history
- playback
  - `sound.mjs` shares the release audio URL between Node and the browser
  - `rain.mjs` downloads a temporary WAV and runs ffplay with infinite looping
  - removes the temporary file on exit; download failures report an error
  - browser loops the same WAV with native audio
