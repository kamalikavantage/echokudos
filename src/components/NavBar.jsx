const TABS = [
  { id: "record", label: "Recognize", icon: "🙌" },
  { id: "feed", label: "Feed", icon: "💬" },
  { id: "reel", label: "Highlight Reel", icon: "✨" },
];

export default function NavBar({ active, onChange }) {
  return (
    <header className="sticky top-0 z-40 backdrop-blur bg-white/70 border-b border-orange-100/80">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white text-lg shadow-sm">
            🔊
          </div>
          <div>
            <p className="font-semibold text-stone-800 leading-tight">EchoKudos</p>
            <p className="text-[11px] text-stone-400 leading-tight">say it out loud</p>
          </div>
        </div>
        <nav className="flex gap-1 bg-orange-50/80 rounded-full p-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                active === tab.id
                  ? "bg-white shadow text-orange-600"
                  : "text-stone-500 hover:text-stone-700"
              }`}
            >
              <span>{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
}
