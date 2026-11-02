# Rain for sleep
(authored by agents unless marked 🧑)

- run `./rain.mjs` with Node.js 18+ and FFmpeg installed
  - downloads the recording (about 20 MB) on first run into `~/.cache/rain-sound/`, reuses it afterward, then plays until Ctrl+C
  - save one seamless 20-minute WAV with `./rain.mjs --render rain.wav`
- [mobile page](https://sichanghe.github.io/rain/)
  - tap Start rain, then use device volume
  - first tap downloads the recording into browser Cache Storage; later visits reuse it
  - locked-screen playback depends on the browser
- source
  - 🧑 "Maybe use https://www.youtube.com/watch?v=eTeD8DAta4c instead. Use a longer clip and don't have any audible cutoff"
  - 20 min 10 s excerpt from “Relaxing Rain Sounds = Drifting to Sleep” by Relaxing White Noise, starting at 10:00
- no audible cutoff
  - `rain.m4a` holds `LOOP` + `OVERLAP` seconds (`sound.mjs`)
  - at `LOOP` seconds, players start a second copy and equal-power crossfade over `OVERLAP` seconds
  - the script mixes PCM itself; the page crossfades two audio elements through Web Audio gains
- hosting
  - `node prepare.mjs source-audio rain.m4a` cuts and loudness-normalizes the excerpt
  - `rain.m4a` lives on the `gh-pages` branch, served same-origin with the page at https://sichanghe.github.io/rain-sound/rain.m4a
    - Web Audio needs same-origin or CORS; GitHub release downloads lack CORS
