import { useAudioPlayback } from "../hooks/useAudioPlayback";

/**
 * Renders a static waveform (pre-computed peaks) with a real play/pause button that
 * actually plays back the given audio URL, progress reflected by filling the bars.
 */
export default function StaticWaveformPlayer({ url, peaks, tint = "#f97316", compact = false }) {
  const { isPlaying, progress, toggle } = useAudioPlayback(url);
  const activeBarIndex = Math.floor(progress * peaks.length);

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={toggle}
        className="flex items-center justify-center rounded-full shrink-0 text-white shadow-sm transition-transform active:scale-95"
        style={{
          width: compact ? 34 : 42,
          height: compact ? 34 : 42,
          background: `linear-gradient(135deg, ${tint}, ${tint}cc)`,
        }}
        aria-label={isPlaying ? "Pause" : "Play"}
      >
        {isPlaying ? <PauseIcon /> : <PlayIcon />}
      </button>
      <div className={`flex items-end gap-[2px] flex-1 ${compact ? "h-8" : "h-10"}`}>
        {peaks.map((p, i) => (
          <div
            key={i}
            className="flex-1 rounded-full transition-colors duration-150"
            style={{
              height: `${p * 100}%`,
              backgroundColor: i <= activeBarIndex && isPlaying ? tint : `${tint}33`,
              minWidth: 2,
            }}
          />
        ))}
      </div>
    </div>
  );
}

function PlayIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}
function PauseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
    </svg>
  );
}
