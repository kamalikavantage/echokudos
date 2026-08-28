const STEPS = ["Type", "Recipient", "Badge", "Message"];

export default function StepProgress({ step }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-6">
      {STEPS.map((label, i) => {
        const n = i + 1;
        const done = n < step;
        const active = n === step;
        return (
          <div key={label} className="flex items-center gap-2">
            <div
              className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold transition-colors ${
                done
                  ? "bg-orange-500 text-white"
                  : active
                  ? "bg-white text-orange-600 ring-2 ring-orange-400"
                  : "bg-orange-100 text-orange-300"
              }`}
            >
              {done ? "✓" : n}
            </div>
            <span
              className={`text-xs font-medium hidden sm:inline ${
                active ? "text-stone-700" : "text-stone-400"
              }`}
            >
              {label}
            </span>
            {n < STEPS.length && <div className="w-4 sm:w-6 h-px bg-orange-200" />}
          </div>
        );
      })}
    </div>
  );
}
