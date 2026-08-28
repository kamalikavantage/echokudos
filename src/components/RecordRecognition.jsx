import { useEffect, useState } from "react";
import { TEAMMATES, CURRENT_USER, randomTone } from "../data/mockData";
import { useAudioRecorder } from "../hooks/useAudioRecorder";
import { useSpeechRecognition, getMockedTranscript } from "../hooks/useSpeechRecognition";
import { computePeaksFromBlob, formatDuration, synthesizePlaceholderClip } from "../utils/audio";
import Avatar from "./Avatar";
import LiveWaveform from "./LiveWaveform";
import StaticWaveformPlayer from "./StaticWaveformPlayer";

export default function RecordRecognition({ onSend }) {
  const [recipientId, setRecipientId] = useState(TEAMMATES[0].id);
  const recipient = TEAMMATES.find((t) => t.id === recipientId);

  const recorder = useAudioRecorder({ onMaxLength: () => finishRecording() });
  const speech = useSpeechRecognition();

  const [transcript, setTranscript] = useState("");
  const [peaks, setPeaks] = useState(null);
  const [stage, setStage] = useState("idle"); // idle | recording | review
  const [mockClipUrl, setMockClipUrl] = useState(null);
  const [mockClipBlob, setMockClipBlob] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const usingMockFlow = Boolean(recorder.permissionError);

  const stopEverything = () => {
    recorder.stopRecording();
    speech.stop();
  };

  // Shared by the manual "stop" tap and the automatic 60s cap, so hitting the max
  // length also advances the UI into the review screen instead of stalling.
  const finishRecording = () => {
    stopEverything();
    setStage("review");
  };

  const handleStart = async () => {
    setTranscript("");
    setPeaks(null);
    setMockClipUrl(null);
    setStage("recording");
    await recorder.startRecording();
    speech.start();
  };

  const handleStop = () => {
    finishRecording();
  };

  // If mic permission failed, let the demo continue with a synthesized clip + mocked transcript.
  const handleContinueWithMock = async () => {
    setStage("recording");
    setTimeout(async () => {
      const blob = await synthesizePlaceholderClip({
        seed: Math.floor(Math.random() * 1000),
        durationSec: 5 + Math.random() * 3,
        brightness: 0.5,
      });
      setMockClipBlob(blob);
      setMockClipUrl(URL.createObjectURL(blob));
      setTranscript(getMockedTranscript());
      setStage("review");
    }, 1200);
  };

  // Once a real recording stops, compute its static waveform and settle on a transcript.
  useEffect(() => {
    if (!recorder.recordedBlob) return;
    let cancelled = false;
    computePeaksFromBlob(recorder.recordedBlob).then((p) => {
      if (!cancelled) setPeaks(p);
    });
    return () => {
      cancelled = true;
    };
  }, [recorder.recordedBlob]);

  useEffect(() => {
    if (stage !== "review" || recorder.recordedBlob === null) return;
    // Prefer the live transcript if SpeechRecognition produced something usable.
    if (speech.isSupported && speech.transcript.trim().length > 3) {
      setTranscript(speech.transcript.trim());
    } else {
      setTranscript((prev) => prev || getMockedTranscript());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, recorder.recordedBlob]);

  useEffect(() => {
    if (mockClipBlob) {
      computePeaksFromBlob(mockClipBlob).then(setPeaks);
    }
  }, [mockClipBlob]);

  const audioUrl = usingMockFlow ? mockClipUrl : recorder.recordedUrl;
  const audioBlob = usingMockFlow ? mockClipBlob : recorder.recordedBlob;
  const durationSec = usingMockFlow ? 6 : recorder.elapsedSec;

  const canSend = stage === "review" && audioUrl && peaks && transcript.trim().length > 0;

  const handleReset = () => {
    recorder.reset();
    setTranscript("");
    setPeaks(null);
    setMockClipUrl(null);
    setMockClipBlob(null);
    setStage("idle");
  };

  const handleSend = () => {
    if (!canSend) return;
    setIsSending(true);
    onSend({
      senderId: CURRENT_USER.id,
      recipientId,
      transcript: transcript.trim(),
      tone: randomTone(),
      createdAt: Date.now(),
      durationSec,
      peaks,
      audioUrl,
      audioBlob,
    });
    setTimeout(() => {
      setIsSending(false);
      handleReset();
    }, 400);
  };

  return (
    <div className="max-w-lg mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-semibold text-stone-800 text-center">Say a thank you</h1>
      <p className="text-stone-500 text-center mt-1 mb-6 text-sm">
        Record a short voice note — we'll turn it into a recognition card.
      </p>

      <div className="bg-white rounded-3xl shadow-sm ring-1 ring-black/5 p-6">
        {/* Recipient picker */}
        <label className="block text-xs font-medium text-stone-400 uppercase tracking-wide mb-2">
          Who's it for?
        </label>
        <div className="relative mb-6">
          <select
            value={recipientId}
            onChange={(e) => setRecipientId(e.target.value)}
            disabled={stage !== "idle"}
            className="w-full appearance-none bg-orange-50/70 border border-orange-100 rounded-2xl pl-14 pr-4 py-3 text-stone-700 font-medium focus:outline-none focus:ring-2 focus:ring-orange-300 disabled:opacity-60"
          >
            {TEAMMATES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} — {t.role}
              </option>
            ))}
          </select>
          <div className="absolute left-2 top-1/2 -translate-y-1/2">
            <Avatar person={recipient} size={34} />
          </div>
        </div>

        {stage === "idle" && !usingMockFlow && (
          <RecordButton onClick={handleStart} label="Tap to record" />
        )}

        {stage === "idle" && usingMockFlow && (
          <div className="text-center">
            <div className="mx-auto mb-3 w-14 h-14 rounded-full bg-stone-100 flex items-center justify-center text-2xl">
              🚫🎙️
            </div>
            <p className="text-sm text-stone-500 mb-4">{recorder.permissionError}</p>
            <button
              onClick={handleContinueWithMock}
              className="px-4 py-2 rounded-full bg-stone-800 text-white text-sm font-medium hover:bg-stone-700"
            >
              Continue with demo audio
            </button>
          </div>
        )}

        {stage === "recording" && !usingMockFlow && (
          <div className="text-center">
            <RecordButton onClick={handleStop} label="Tap to stop" active />
            <p className="mt-4 text-2xl font-semibold text-stone-700 tabular-nums">
              {formatDuration(recorder.elapsedSec)}{" "}
              <span className="text-sm text-stone-400 font-normal">/ 1:00</span>
            </p>
            <div className="mt-4 bg-orange-50/60 rounded-2xl p-3">
              <LiveWaveform analyserRef={recorder.analyserRef} isActive barColor="#f97316" />
            </div>
            {speech.isSupported && (
              <p className="mt-3 text-sm text-stone-500 italic min-h-[1.5em]">
                {speech.transcript || "Listening…"}
              </p>
            )}
            {!speech.isSupported && (
              <p className="mt-3 text-xs text-stone-400">
                Live transcription isn't supported in this browser — we'll fill in a transcript
                after you stop.
              </p>
            )}
          </div>
        )}

        {stage === "recording" && usingMockFlow && (
          <div className="text-center py-6">
            <div className="mx-auto w-14 h-14 rounded-full border-4 border-orange-200 border-t-orange-500 animate-spin" />
            <p className="mt-4 text-sm text-stone-500">Preparing demo audio…</p>
          </div>
        )}

        {stage === "review" && audioUrl && peaks && (
          <div className="animate-float-up">
            <p className="text-xs font-medium text-stone-400 uppercase tracking-wide mb-2">
              Playback
            </p>
            <div className="bg-orange-50/60 rounded-2xl p-3 mb-4">
              <StaticWaveformPlayer url={audioUrl} peaks={peaks} tint="#f97316" />
            </div>

            <label className="block text-xs font-medium text-stone-400 uppercase tracking-wide mb-2">
              Transcript{" "}
              <span className="normal-case text-stone-300">
                ({speech.isSupported && !usingMockFlow ? "from live transcription" : "mocked for demo"}
                , editable)
              </span>
            </label>
            <textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              rows={3}
              className="w-full rounded-2xl border border-stone-200 p-3 text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none"
            />

            <div className="flex gap-2 mt-5">
              <button
                onClick={handleReset}
                className="flex-1 py-3 rounded-full border border-stone-200 text-stone-600 font-medium hover:bg-stone-50"
              >
                Re-record
              </button>
              <button
                onClick={handleSend}
                disabled={!canSend || isSending}
                className="flex-[2] py-3 rounded-full bg-gradient-to-r from-orange-500 to-pink-500 text-white font-medium shadow-sm hover:shadow-md transition disabled:opacity-60"
              >
                {isSending ? "Sending…" : `Send to ${recipient.name.split(" ")[0]}`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function RecordButton({ onClick, label, active }) {
  return (
    <div className="flex flex-col items-center py-4">
      <div className="relative">
        {active && (
          <span className="absolute inset-0 rounded-full bg-red-400 animate-pulse-ring" />
        )}
        <button
          onClick={onClick}
          className={`relative w-24 h-24 rounded-full flex items-center justify-center text-4xl shadow-lg transition-transform active:scale-95 ${
            active
              ? "bg-gradient-to-br from-red-400 to-red-500"
              : "bg-gradient-to-br from-orange-400 to-pink-500"
          }`}
        >
          {active ? "⏹️" : "🎙️"}
        </button>
      </div>
      <p className="mt-3 text-sm text-stone-500">{label}</p>
    </div>
  );
}
