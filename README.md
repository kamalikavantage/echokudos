# EchoKudos 🔊

A front-end prototype of a voice-based employee recognition feature: record a short
voice note thanking a teammate, get it transcribed and turned into a shareable
"recognition card," and compile someone's received notes into a **Highlight Reel**.

This is a demo, not a production system — no backend, no database. Everything lives
in React state and resets on page reload.

## Running it

```bash
npm install
npm run dev
```

Open the printed local URL in **Chrome or Edge** for the fullest experience (see
"What's mocked" below re: browser support). Grant microphone access when prompted.

## What's real

- **Audio recording** — uses the browser's native `MediaRecorder` API to capture actual
  microphone input. Nothing here is faked.
- **Live waveform while recording** — driven by a real Web Audio API `AnalyserNode`
  reading live frequency data from your mic, not a canned animation.
- **Playback** — every card in the feed and the Highlight Reel plays back a real,
  decodable audio `Blob` through an `<audio>` element.
- **Static waveforms for your own recordings** — computed by decoding the recorded
  audio and downsampling actual amplitude peaks.
- **Live transcription while recording** — uses the browser's `SpeechRecognition` /
  `webkitSpeechRecognition` API where supported (Chrome/Edge). You can edit the result
  before sending.
- **Highlight Reel playback** — genuinely chains multiple real audio clips back-to-back
  through one `<audio>` element, advancing on `ended` and syncing the caption to
  whichever clip is currently playing.

## What's mocked (and why)

- **Tone tags** (🔥 Enthusiastic / 🙏 Heartfelt / 😄 Warm / ✨ Inspiring / 💪 Appreciative)
  are assigned **randomly** when a recognition is sent. In production this would come
  from real audio tone/sentiment analysis; here it's presented as if derived from the
  clip, but it's just `Math.random()`.
- **Transcript fallback** — if `SpeechRecognition` isn't supported in your browser (e.g.
  Firefox, Safari) or it doesn't pick anything up, the transcript field is pre-filled
  with a mocked sentence from a small pool instead of staying empty, so the flow never
  dead-ends. You can always edit it before sending.
- **Seeded feed items** — the 5 pre-loaded recognitions in the Feed obviously weren't
  recorded live. Their waveform shapes are deterministically generated (not derived from
  real audio) and their "audio" is a short synthesized placeholder clip (filtered noise
  shaped with a speech-like envelope) rendered at load time via `OfflineAudioContext` —
  real, playable audio, just not real speech.
- **Microphone-denied fallback** — if mic access is denied or unavailable, the Record
  screen offers a "Continue with demo audio" path that generates a placeholder clip and
  mocked transcript so the rest of the flow (review, edit, send) still works end to end.
- **Anniversary banner** — the "It's been 1 year since Priya joined" prompt is a static
  demo of a trigger that, in production, would fire automatically off an HRIS
  work-anniversary date rather than being hardcoded.
- **The org directory** — 5 mock teammates plus "You" as the current user. No auth, no
  real identities.

## Structure

```
src/
  data/mockData.js         teammates, tone tags, seed recognitions, mock transcripts
  utils/audio.js           WAV encoding, placeholder clip synthesis, peak extraction
  hooks/useAudioRecorder.js       MediaRecorder + AnalyserNode
  hooks/useSpeechRecognition.js  SpeechRecognition wrapper w/ fallback
  hooks/useAudioPlayback.js      <audio> element wrapper for waveform players
  components/
    RecordRecognition.jsx  record → review/transcript → send
    RecognitionFeed.jsx    card feed of all recognitions
    HighlightReel.jsx      compile + chained playback + share
    NavBar.jsx, Avatar.jsx, LiveWaveform.jsx, StaticWaveformPlayer.jsx,
    Toast.jsx, AnniversaryBanner.jsx
```

## Browser support notes

- Recording and playback (`MediaRecorder`, Web Audio) work in all modern browsers.
- Live transcription (`SpeechRecognition`) is Chrome/Edge-only as of this writing;
  other browsers automatically fall back to the mocked transcript described above.
- Requires HTTPS or `localhost` for microphone access, per browser security policy —
  `npm run dev` serves over `localhost`, so this works out of the box.
