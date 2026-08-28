export default function Toast({ message, emoji = "🎉", show }) {
  if (!show) return null;
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-pop-in">
      <div className="flex items-center gap-2 rounded-full bg-white/95 backdrop-blur px-5 py-3 shadow-xl ring-1 ring-black/5">
        <span className="text-lg">{emoji}</span>
        <span className="text-sm font-medium text-stone-700">{message}</span>
      </div>
    </div>
  );
}
