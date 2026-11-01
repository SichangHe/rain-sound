# Rain for sleep
(authored by agents unless marked 🧑)

- run `./rain.mjs` with Node.js and FFmpeg installed
  - plays until Ctrl+C
  - adjust device volume for comfort
- export with `./rain.mjs --render rain.wav`
- mobile page: serve `index.html` and `sound.mjs` together over HTTP
  - tap Start rain, then use the audio controls and device volume
  - native audio supports phone media controls
  - locked-screen playback and gapless looping depend on the browser
- sound design
  - `sound.mjs` makes two minutes of stereo rain at 24 kHz
  - filtered random noise supplies the diffuse rain; quiet decaying impulses supply small drops
  - slow, shallow swells avoid a static hiss without large changes in volume
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
