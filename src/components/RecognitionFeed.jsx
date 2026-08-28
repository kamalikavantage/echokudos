import { getPerson } from "../data/mockData";
import { formatDuration, formatRelativeTime } from "../utils/audio";
import Avatar from "./Avatar";
import StaticWaveformPlayer from "./StaticWaveformPlayer";

export default function RecognitionFeed({ recognitions }) {
  const sorted = [...recognitions].sort((a, b) => b.createdAt - a.createdAt);

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-semibold text-stone-800 text-center">Recognition Feed</h1>
      <p className="text-stone-500 text-center mt-1 mb-6 text-sm">
        Every voice note, as it's shared across the team.
      </p>

      {sorted.length === 0 && (
        <div className="text-center text-stone-400 py-16">No recognitions yet — go record one!</div>
      )}

      <div className="space-y-4">
        {sorted.map((r) => {
          const sender = getPerson(r.senderId);
          const recipient = getPerson(r.recipientId);
          if (!r.audioUrl || !r.peaks) {
            return (
              <div key={r.id} className="bg-white rounded-3xl shadow-sm ring-1 ring-black/5 p-5">
                <div className="h-16 flex items-center justify-center text-sm text-stone-400">
                  Preparing audio…
                </div>
              </div>
            );
          }
          return (
            <div
              key={r.id}
              className="bg-white rounded-3xl shadow-sm ring-1 ring-black/5 p-5 animate-float-up"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-sm">
                  <Avatar person={sender} size={30} />
                  <span className="font-medium text-stone-700">{sender.name}</span>
                  <span className="text-stone-300">→</span>
                  <Avatar person={recipient} size={30} />
                  <span className="font-medium text-stone-700">{recipient.name}</span>
                </div>
                <ToneBadge tone={r.tone} />
              </div>

              <div className="bg-orange-50/50 rounded-2xl p-3">
                <StaticWaveformPlayer url={r.audioUrl} peaks={r.peaks} tint={r.tone.tint} />
              </div>

              <p className="text-stone-600 text-sm mt-3 leading-relaxed">"{r.transcript}"</p>

              <div className="flex items-center justify-between mt-3 text-xs text-stone-400">
                <span>{formatRelativeTime(r.createdAt)}</span>
                <span>{formatDuration(r.durationSec)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ToneBadge({ tone }) {
  return (
    <span
      className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full shrink-0"
      style={{ backgroundColor: `${tone.tint}1a`, color: tone.tint }}
    >
      <span>{tone.emoji}</span>
      {tone.label}
    </span>
  );
}
