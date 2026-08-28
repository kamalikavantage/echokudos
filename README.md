# EchoKudos 🔊

A front-end prototype of an R&R (rewards & recognition) sending flow, where voice is
one input option alongside typing: pick **Appreciation or Nomination** → pick a
**recipient** → pick a **badge** → then **write** the message or **record** it and let
transcription write it for you. Sent recognitions land in a card **Feed**, and a
recipient's voice notes can be compiled into a **Highlight Reel**.

This is a demo, not a production system — no backend, no database. Everything lives
in React state and resets on page reload.

## Running it

```bash
npm install
npm run dev
```

Open the printed local URL in **Chrome or Edge** for the fullest experience (see
"What's mocked" below re: browser support). Grant microphone access when prompted.

## The flow

1. **Type** — Appreciation (quick thank-you) or Nomination (formal spotlight).
2. **Recipient** — pick a teammate from the mock directory.
3. **Badge** — pick one of five mock badges.
4. **Message** — a **Write / Record** toggle. Write is a plain text box. Record runs
   the full voice pipeline (mic capture, live waveform, live transcription) and drops
   the transcript straight into the same text box, already editable. Switching back to
   Write drops the attached audio but keeps whatever text was transcribed — the voice
   note effectively "became" the written message.

Only recognitions sent through Record (with a completed clip) carry playable audio,
a waveform, and a tone tag; ones sent via Write are text-only cards in the Feed and
aren't eligible for the Highlight Reel, which chains real audio clips.

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
- **Badges and recognition types** — Appreciation/Nomination and the 5 badges are
  static mock options with no workflow behind them (a real Nomination would typically
  route to an approval process; here it's just a label on the card).

## Structure

```
src/
  data/mockData.js         teammates, badges, types, tone tags, seed data, mock transcripts
  utils/audio.js           WAV encoding, placeholder clip synthesis, peak extraction
  hooks/useAudioRecorder.js       MediaRecorder + AnalyserNode
  hooks/useSpeechRecognition.js  SpeechRecognition wrapper w/ fallback
  hooks/useAudioPlayback.js      <audio> element wrapper for waveform players
  components/
    SendRecognition.jsx    4-step flow: type → recipient → badge → write/record
    StepProgress.jsx       step indicator for the flow above
    RecognitionFeed.jsx    card feed of all recognitions (voice + written)
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
