import { useEffect, useState } from "react";
import {
  TEAMMATES,
  CURRENT_USER,
  RECOGNITION_TYPES,
  BADGES,
  randomTone,
} from "../data/mockData";
import { useAudioRecorder } from "../hooks/useAudioRecorder";
import { useSpeechRecognition, getMockedTranscript } from "../hooks/useSpeechRecognition";
import { computePeaksFromBlob, formatDuration, synthesizePlaceholderClip } from "../utils/audio";
import Avatar from "./Avatar";
import LiveWaveform from "./LiveWaveform";
import StaticWaveformPlayer from "./StaticWaveformPlayer";
import StepProgress from "./StepProgress";

export default function SendRecognition({ onSend }) {
  const [step, setStep] = useState(1);
  const [typeId, setTypeId] = useState(null);
  const [recipientId, setRecipientId] = useState(null);
  const [badgeId, setBadgeId] = useState(null);
  const [mode, setMode] = useState("write"); // "write" | "record"
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  const type = RECOGNITION_TYPES.find((t) => t.id === typeId);
  const recipient = TEAMMATES.find((t) => t.id === recipientId);
  const badge = BADGES.find((b) => b.id === badgeId);

  // --- voice sub-flow (only relevant once mode === "record") ---
  const [recStage, setRecStage] = useState("idle"); // idle | recording | review
  const [peaks, setPeaks] = useState(null);
  const [mockClipUrl, setMockClipUrl] = useState(null);
  const [mockClipBlob, setMockClipBlob] = useState(null);
  const recorder = useAudioRecorder({ onMaxLength: () => finishRecording() });
  const speech = useSpeechRecognition();
  const usingMockFlow = Boolean(recorder.permissionError);

  const finishRecording = () => {
    recorder.stopRecording();
    speech.stop();
    setRecStage("review");
  };

  const startRecordingFlow = async () => {
    setPeaks(null);
    setMockClipUrl(null);
    setRecStage("recording");
    await recorder.startRecording();
    speech.start();
  };

  const handleContinueWithMock = () => {
    setRecStage("recording");
    setTimeout(async () => {
      const blob = await synthesizePlaceholderClip({
        seed: Math.floor(Math.random() * 1000),
        durationSec: 5 + Math.random() * 3,
        brightness: 0.5,
      });
      setMockClipBlob(blob);
      setMockClipUrl(URL.createObjectURL(blob));
      setMessage(getMockedTranscript());
      setRecStage("review");
    }, 1200);
  };

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
    if (recStage !== "review" || recorder.recordedBlob === null) return;
    if (speech.isSupported && speech.transcript.trim().length > 3) {
      setMessage(speech.transcript.trim());
    } else {
      setMessage((prev) => prev || getMockedTranscript());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recStage, recorder.recordedBlob]);

  useEffect(() => {
    if (mockClipBlob) computePeaksFromBlob(mockClipBlob).then(setPeaks);
  }, [mockClipBlob]);

  const audioUrl = usingMockFlow ? mockClipUrl : recorder.recordedUrl;
  const audioBlob = usingMockFlow ? mockClipBlob : recorder.recordedBlob;
  const durationSec = usingMockFlow ? 6 : recorder.elapsedSec;
  const hasRecording = recStage === "review" && audioUrl && peaks;

  const resetRecording = () => {
    recorder.reset();
    setPeaks(null);
    setMockClipUrl(null);
    setMockClipBlob(null);
    setRecStage("idle");
  };

  // Switching to Write drops any attached audio but keeps whatever text is there —
  // the voice note becomes plain text, same idea as "it writes it for you".
  const handleModeChange = (next) => {
    if (next === "write" && mode === "record") {
      if (recStage === "recording") {
        recorder.stopRecording();
        speech.stop();
      }
      resetRecording();
    }
    setMode(next);
  };

  const resetAll = () => {
    setStep(1);
    setTypeId(null);
    setRecipientId(null);
    setBadgeId(null);
    setMode("write");
    setMessage("");
    resetRecording();
  };

  const canSend = message.trim().length > 0 && !(mode === "record" && recStage === "recording");

  const handleSend = () => {
    if (!canSend) return;
    setIsSending(true);
    onSend({
      senderId: CURRENT_USER.id,
      recipientId,
      type: typeId,
      badgeId,
      transcript: message.trim(),
      tone: mode === "record" && hasRecording ? randomTone() : null,
      createdAt: Date.now(),
      durationSec: mode === "record" && hasRecording ? durationSec : 0,
      peaks: mode === "record" && hasRecording ? peaks : null,
      audioUrl: mode === "record" && hasRecording ? audioUrl : null,
      audioBlob: mode === "record" && hasRecording ? audioBlob : null,
    });
    setTimeout(() => {
      setIsSending(false);
      resetAll();
    }, 400);
  };

  return (
    <div className="max-w-lg mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-semibold text-stone-800 text-center">Recognize someone</h1>
      <p className="text-stone-500 text-center mt-1 mb-6 text-sm">
        A few quick picks, then write it or say it out loud.
      </p>

      <StepProgress step={step} />

      {step > 1 && (
        <SelectionSummary
          type={type}
          recipient={recipient}
          badge={badge}
          onEdit={(n) => setStep(n)}
        />
      )}

      <div className="bg-white rounded-3xl shadow-sm ring-1 ring-black/5 p-6">
        {step === 1 && (
          <div className="space-y-3">
            <p className="text-xs font-medium text-stone-400 uppercase tracking-wide mb-1">
              What kind of recognition?
            </p>
            {RECOGNITION_TYPES.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setTypeId(t.id);
                  setStep(2);
                }}
                className="w-full flex items-center gap-4 text-left p-4 rounded-2xl border border-stone-100 hover:border-orange-300 hover:bg-orange-50/50 transition"
              >
                <span className="text-2xl">{t.emoji}</span>
                <div>
                  <p className="font-medium text-stone-800">{t.label}</p>
                  <p className="text-sm text-stone-400">{t.description}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {step === 2 && (
          <div>
            <p className="text-xs font-medium text-stone-400 uppercase tracking-wide mb-3">
              Who's it for?
            </p>
            <div className="grid grid-cols-1 gap-2">
              {TEAMMATES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    setRecipientId(t.id);
                    setStep(3);
                  }}
                  className="w-full flex items-center gap-3 text-left p-3 rounded-2xl border border-stone-100 hover:border-orange-300 hover:bg-orange-50/50 transition"
                >
                  <Avatar person={t} size={38} />
                  <div>
                    <p className="font-medium text-stone-800">{t.name}</p>
                    <p className="text-xs text-stone-400">{t.role}</p>
                  </div>
                </button>
              ))}
            </div>
            <BackButton onClick={() => setStep(1)} />
          </div>
        )}

        {step === 3 && (
          <div>
            <p className="text-xs font-medium text-stone-400 uppercase tracking-wide mb-3">
              Pick a badge
            </p>
            <div className="grid grid-cols-2 gap-2">
              {BADGES.map((b) => (
                <button
                  key={b.id}
                  onClick={() => {
                    setBadgeId(b.id);
                    setStep(4);
                  }}
                  className="flex flex-col items-center gap-1.5 p-4 rounded-2xl border border-stone-100 hover:border-orange-300 hover:bg-orange-50/50 transition text-center"
                >
                  <span
                    className="w-11 h-11 rounded-full flex items-center justify-center text-xl"
                    style={{ backgroundColor: `${b.color}1a` }}
                  >
                    {b.emoji}
                  </span>
                  <span className="text-sm font-medium text-stone-700">{b.label}</span>
                </button>
              ))}
            </div>
            <BackButton onClick={() => setStep(2)} />
          </div>
        )}

        {step === 4 && (
          <div>
            <div className="flex bg-orange-50/80 rounded-full p-1 mb-5">
              <ModeTab
                active={mode === "write"}
                onClick={() => handleModeChange("write")}
                icon="✍️"
                label="Write"
              />
              <ModeTab
                active={mode === "record"}
                onClick={() => handleModeChange("record")}
                icon="🎙️"
                label="Record"
              />
            </div>

            {mode === "write" && (
              <textarea
                autoFocus
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
                placeholder={`Write your ${type?.label.toLowerCase() || "recognition"} for ${
                  recipient?.name.split(" ")[0] || "them"
                }…`}
                className="w-full rounded-2xl border border-stone-200 p-3 text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none"
              />
            )}

            {mode === "record" && (
              <RecordPane
                recStage={recStage}
                usingMockFlow={usingMockFlow}
                permissionError={recorder.permissionError}
                elapsedSec={recorder.elapsedSec}
                analyserRef={recorder.analyserRef}
                liveTranscript={speech.transcript}
                speechSupported={speech.isSupported}
                onStart={startRecordingFlow}
                onStop={finishRecording}
                onContinueWithMock={handleContinueWithMock}
                hasRecording={hasRecording}
                audioUrl={audioUrl}
                peaks={peaks}
                message={message}
                setMessage={setMessage}
                onReRecord={resetRecording}
              />
            )}

            <BackButton onClick={() => setStep(3)} />

            <button
              onClick={handleSend}
              disabled={!canSend || isSending}
              className="w-full mt-5 py-3 rounded-full bg-gradient-to-r from-orange-500 to-pink-500 text-white font-medium shadow-sm hover:shadow-md transition disabled:opacity-50"
            >
              {isSending
                ? "Sending…"
                : `Send ${type?.label || "recognition"} to ${
                    recipient?.name.split(" ")[0] || ""
                  }`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function SelectionSummary({ type, recipient, badge, onEdit }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
      {type && (
        <button
          onClick={() => onEdit(1)}
          className="text-xs font-medium bg-white ring-1 ring-black/5 rounded-full px-3 py-1.5 text-stone-600 hover:ring-orange-300 transition"
        >
          {type.emoji} {type.label}
        </button>
      )}
      {recipient && (
        <button
          onClick={() => onEdit(2)}
          className="text-xs font-medium bg-white ring-1 ring-black/5 rounded-full px-3 py-1.5 text-stone-600 hover:ring-orange-300 transition flex items-center gap-1.5"
        >
          <Avatar person={recipient} size={16} />
          {recipient.name}
        </button>
      )}
      {badge && (
        <button
          onClick={() => onEdit(3)}
          className="text-xs font-medium bg-white ring-1 ring-black/5 rounded-full px-3 py-1.5 text-stone-600 hover:ring-orange-300 transition"
        >
          {badge.emoji} {badge.label}
        </button>
      )}
    </div>
  );
}

function BackButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="mt-4 text-sm text-stone-400 hover:text-stone-600 transition"
    >
      ← Back
    </button>
  );
}

function ModeTab({ active, onClick, icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-full text-sm font-medium transition ${
        active ? "bg-white shadow text-orange-600" : "text-stone-500 hover:text-stone-700"
      }`}
    >
      <span>{icon}</span>
      {label}
    </button>
  );
}

function RecordPane({
  recStage,
  usingMockFlow,
  permissionError,
  elapsedSec,
  analyserRef,
  liveTranscript,
  speechSupported,
  onStart,
  onStop,
  onContinueWithMock,
  hasRecording,
  audioUrl,
  peaks,
  message,
  setMessage,
  onReRecord,
}) {
  if (recStage === "idle" && !usingMockFlow) {
    return (
      <div className="flex flex-col items-center py-4">
        <button
          onClick={onStart}
          className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-3xl shadow-lg active:scale-95 transition-transform"
        >
          🎙️
        </button>
        <p className="mt-3 text-sm text-stone-500">Tap to record</p>
      </div>
    );
  }

  if (recStage === "idle" && usingMockFlow) {
    return (
      <div className="text-center py-4">
        <div className="mx-auto mb-3 w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center text-xl">
          🚫🎙️
        </div>
        <p className="text-sm text-stone-500 mb-4">{permissionError}</p>
        <button
          onClick={onContinueWithMock}
          className="px-4 py-2 rounded-full bg-stone-800 text-white text-sm font-medium hover:bg-stone-700"
        >
          Continue with demo audio
        </button>
      </div>
    );
  }

  if (recStage === "recording" && !usingMockFlow) {
    return (
      <div className="text-center">
        <div className="relative inline-block">
          <span className="absolute inset-0 rounded-full bg-red-400 animate-pulse-ring" />
          <button
            onClick={onStop}
            className="relative w-20 h-20 rounded-full bg-gradient-to-br from-red-400 to-red-500 flex items-center justify-center text-3xl shadow-lg active:scale-95 transition-transform"
          >
            ⏹️
          </button>
        </div>
        <p className="mt-3 text-xl font-semibold text-stone-700 tabular-nums">
          {formatDuration(elapsedSec)} <span className="text-sm text-stone-400 font-normal">/ 1:00</span>
        </p>
        <div className="mt-3 bg-orange-50/60 rounded-2xl p-3">
          <LiveWaveform analyserRef={analyserRef} isActive barColor="#f97316" />
        </div>
        {speechSupported ? (
          <p className="mt-2 text-sm text-stone-500 italic min-h-[1.5em]">
            {liveTranscript || "Listening…"}
          </p>
        ) : (
          <p className="mt-2 text-xs text-stone-400">
            Live transcription isn't supported here — we'll fill in a transcript after you stop.
          </p>
        )}
      </div>
    );
  }

  if (recStage === "recording" && usingMockFlow) {
    return (
      <div className="text-center py-6">
        <div className="mx-auto w-12 h-12 rounded-full border-4 border-orange-200 border-t-orange-500 animate-spin" />
        <p className="mt-3 text-sm text-stone-500">Preparing demo audio…</p>
      </div>
    );
  }

  if (recStage === "review" && hasRecording) {
    return (
      <div className="animate-float-up">
        <div className="bg-orange-50/60 rounded-2xl p-3 mb-3">
          <StaticWaveformPlayer url={audioUrl} peaks={peaks} tint="#f97316" compact />
        </div>
        <label className="block text-xs font-medium text-stone-400 uppercase tracking-wide mb-2">
          Transcript{" "}
          <span className="normal-case text-stone-300">
            (it wrote this for you — feel free to edit)
          </span>
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          className="w-full rounded-2xl border border-stone-200 p-3 text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none"
        />
        <button
          onClick={onReRecord}
          className="mt-2 text-sm text-stone-400 hover:text-stone-600 transition"
        >
          ↺ Re-record
        </button>
      </div>
    );
  }

  return null;
}
