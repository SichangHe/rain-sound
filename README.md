# Rain for sleep
(authored by agents unless marked 🧑)

- run `./rain.mjs` with Node.js and FFmpeg installed
  - plays until Ctrl+C
  - adjust device volume for comfort
- export with `./rain.mjs --render rain.wav`
- [mobile page](https://sichanghe.github.io/rain/)
  - self-host by serving `index.html` and `sound.mjs` together over HTTP
  - tap Start rain, then use the audio controls and device volume
  - native audio supports phone media controls
  - locked-screen playback and gapless looping depend on the browser
- sound design
  - `sound.mjs` makes two minutes of stereo rain at 24 kHz
  - a quiet filtered noise bed sits behind irregular, separate surface impacts
  - concrete uses short broadband taps; leaves use softer, longer patter; water adds brief rising bubble resonances
  - each impact varies in strength, decay, pitch, and stereo position
  - slow changes in impact density and background level vary the rain without abrupt swells
  - four-second equal-power overlap smooths the waveform seam
  - fixed random seed makes checks reproducible
  - peak normalization to −1 dBFS leaves digital headroom; actual loudness depends on device volume
  - no thunder or sharp effects
  - synthesized rain, not a field recording; perceived naturalness and comfort require listening
- playback
  - `rain.mjs` writes a temporary WAV and runs ffplay with infinite looping
  - removes the temporary file on exit
  - browser generates the same WAV locally and loops it with native audio
  - no packages, network audio, or account needed
