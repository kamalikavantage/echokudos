import { useEffect, useRef, useState } from "react";
import { getPerson } from "../data/mockData";
import { formatDuration } from "../utils/audio";
import Avatar from "./Avatar";
import Toast from "./Toast";

const HIGHLIGHT_PERSON_ID = "priya";

const COMPILE_STEPS = [
  "Gathering voice notes…",
  "Stitching moments together…",
  "Smoothing transitions…",
  "Adding warmth…",
  "Polishing the reveal…",
];

export default function HighlightReel({ recognitions, triggerSignal }) {
  const person = getPerson(HIGHLIGHT_PERSON_ID);
  const clips = recognitions
    .filter((r) => r.recipientId === HIGHLIGHT_PERSON_ID && r.audioUrl && r.peaks)
    .sort((a, b) => a.createdAt - b.createdAt);

  const [stage, setStage] = useState("idle"); // idle | compiling | ready
  const [progress, setProgress] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const [currentClip, setCurrentClip] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [clipProgress, setClipProgress] = useState(0); // 0..1, actual playback position
  const [showToast, setShowToast] = useState(false);

  const audioRef = useRef(null);
  const lastTrigger = useRef(triggerSignal);

  const handleGenerate = () => {
    if (clips.length === 0) return;
    setStage("compiling");
    setProgress(0);
    setStepIndex(0);
  };

  useEffect(() => {
    if (triggerSignal !== undefined && triggerSignal !== lastTrigger.current) {
      lastTrigger.current = triggerSignal;
      if (stage === "idle") handleGenerate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [triggerSignal]);

  useEffect(() => {
    if (stage !== "compiling") return;
    const interval = setInterval(() => {
      setProgress((p) => {
        const next = Math.min(100, p + 100 / (COMPILE_STEPS.length * 6));
        return next;
      });
    }, 120);
    return () => clearInterval(interval);
  }, [stage]);

  useEffect(() => {
    if (stage !== "compiling") return;
    const step = Math.min(
      COMPILE_STEPS.length - 1,
      Math.floor((progress / 100) * COMPILE_STEPS.length)
    );
    setStepIndex(step);
    if (progress >= 100) {
      const t = setTimeout(() => {
        setStage("ready");
        setCurrentClip(0);
      }, 400);
      return () => clearTimeout(t);
    }
  }, [progress, stage]);

  // Chain clips back-to-back through a single <audio> element.
  useEffect(() => {
    if (stage !== "ready") return;
    const audio = audioRef.current;
    if (!audio || !clips[currentClip]) return;
    audio.src = clips[currentClip].audioUrl;
    setClipProgress(0);
    if (isPlaying) audio.play().catch(() => {});
  }, [currentClip, stage]); // eslint-disable-line react-hooks/exhaustive-deps

  // Drive the segment progress bar off real playback position, not a timed guess.
  // (Keyed on `stage` because the <audio> element only exists once we're "ready".)
  useEffect(() => {
    if (stage !== "ready") return;
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => {
      if (audio.duration) setClipProgress(audio.currentTime / audio.duration);
    };
    audio.addEventListener("timeupdate", onTime);
    return () => audio.removeEventListener("timeupdate", onTime);
  }, [stage]);

  const handlePlayToggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      if (!audio.src) audio.src = clips[currentClip]?.audioUrl;
      audio.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const handleEnded = () => {
    if (currentClip < clips.length - 1) {
      setCurrentClip((c) => c + 1);
    } else {
      setIsPlaying(false);
      setCurrentClip(0);
    }
  };

  const handleShare = () => {
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2200);
  };

  const handleReplay = () => {
    setStage("idle");
    setIsPlaying(false);
    setCurrentClip(0);
    setProgress(0);
  };

  return (
    <div className="max-w-lg mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-semibold text-stone-800 text-center">Highlight Reel</h1>
      <p className="text-stone-500 text-center mt-1 mb-6 text-sm">
        A year of thank-yous, compiled into one moment.
      </p>

      {stage === "idle" && (
        <div className="bg-white rounded-3xl shadow-sm ring-1 ring-black/5 p-8 text-center">
          <div className="mx-auto mb-4">
            <Avatar person={person} size={72} />
          </div>
          <h2 className="text-lg font-semibold text-stone-800">{person.name}</h2>
          <p className="text-stone-400 text-sm mb-1">{person.role}</p>
          <p className="text-stone-500 text-sm mb-6">
            {clips.length} voice recognition{clips.length === 1 ? "" : "s"} received
          </p>
          <button
            onClick={handleGenerate}
            disabled={clips.length === 0}
            className="px-6 py-3 rounded-full bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500 text-white font-medium shadow-md hover:shadow-lg transition disabled:opacity-50"
          >
            ✨ Generate Highlight Reel
          </button>
        </div>
      )}

      {stage === "compiling" && (
        <div className="bg-white rounded-3xl shadow-sm ring-1 ring-black/5 p-8 text-center">
          <div className="mx-auto mb-4 w-16 h-16 rounded-full border-4 border-orange-100 border-t-orange-500 animate-spin" />
          <p className="text-stone-700 font-medium mb-4">{COMPILE_STEPS[stepIndex]}</p>
          <div className="w-full h-2 bg-orange-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-orange-400 to-pink-500 transition-all duration-150"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {stage === "ready" && (
        <div className="relative overflow-hidden rounded-3xl shadow-lg ring-1 ring-black/5 bg-gradient-to-br from-orange-400 via-pink-500 to-purple-600 p-8 text-white">
          <Confetti />
          <audio ref={audioRef} onEnded={handleEnded} className="hidden" />

          <div className="relative text-center">
            <Avatar person={person} size={80} />
            <h2 className="text-xl font-semibold mt-3">{person.name}'s Highlight Reel</h2>
            <p className="text-white/80 text-sm mt-1">
              {clips.length} teammates said thank you
            </p>

            {/* segment progress like a stories bar */}
            <div className="flex gap-1.5 mt-6 mb-5">
              {clips.map((_, i) => (
                <div key={i} className="flex-1 h-1.5 rounded-full bg-white/25 overflow-hidden">
                  <div
                    className="h-full bg-white"
                    style={{
                      width:
                        i < currentClip ? "100%" : i === currentClip ? `${clipProgress * 100}%` : "0%",
                    }}
                  />
                </div>
              ))}
            </div>

            <button
              onClick={handlePlayToggle}
              className="w-16 h-16 rounded-full bg-white text-orange-500 text-2xl flex items-center justify-center mx-auto shadow-xl active:scale-95 transition-transform"
            >
              {isPlaying ? "⏸️" : "▶️"}
            </button>

            {clips[currentClip] && (
              <div key={currentClip} className="mt-6 animate-float-up">
                <div className="flex items-center justify-center gap-2 text-sm text-white/90 mb-2">
                  <Avatar person={getPerson(clips[currentClip].senderId)} size={26} />
                  <span className="font-medium">{getPerson(clips[currentClip].senderId).name}</span>
                  <span className="opacity-70">
                    {clips[currentClip].tone.emoji} {clips[currentClip].tone.label}
                  </span>
                </div>
                <p className="text-white text-base leading-relaxed px-2">
                  "{clips[currentClip].transcript}"
                </p>
                <p className="text-white/60 text-xs mt-2">
                  {formatDuration(clips[currentClip].durationSec)} · clip {currentClip + 1} of{" "}
                  {clips.length}
                </p>
              </div>
            )}

            <div className="flex gap-2 mt-8">
              <button
                onClick={handleReplay}
                className="flex-1 py-2.5 rounded-full bg-white/15 hover:bg-white/25 text-sm font-medium transition"
              >
                ↺ Start over
              </button>
              <button
                onClick={handleShare}
                className="flex-1 py-2.5 rounded-full bg-white text-orange-600 text-sm font-semibold shadow-sm hover:shadow-md transition"
              >
                Share reel
              </button>
            </div>
          </div>
        </div>
      )}

      <Toast show={showToast} message="Link copied — ready to share! (demo only)" emoji="🔗" />
    </div>
  );
}

function Confetti() {
  const pieces = Array.from({ length: 18 });
  const colors = ["#fff", "#fde68a", "#fbcfe8", "#ddd6fe"];
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {pieces.map((_, i) => (
        <span
          key={i}
          className="absolute top-0 rounded-sm animate-confetti"
          style={{
            left: `${(i * 97) % 100}%`,
            width: 6,
            height: 10,
            backgroundColor: colors[i % colors.length],
            animationDelay: `${(i % 6) * 0.25}s`,
            opacity: 0.85,
          }}
        />
      ))}
    </div>
  );
}
