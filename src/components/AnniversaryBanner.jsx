import { useState } from "react";
import Avatar from "./Avatar";

/**
 * Demo of an automatic trigger: in production this would fire from an HRIS work-anniversary
 * date, not a button click. Here it's just shown proactively so the flow is visible.
 */
export default function AnniversaryBanner({ person, onGenerate }) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-4">
      <div className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-amber-100 via-orange-100 to-pink-100 border border-orange-200/70 px-4 py-3 shadow-sm animate-float-up">
        <Avatar person={person} size={36} />
        <p className="text-sm text-stone-700 flex-1">
          🎉 It's been <span className="font-semibold">1 year</span> since{" "}
          <span className="font-semibold">{person.name}</span> joined — want to generate her
          Highlight Reel?
        </p>
        <button
          onClick={onGenerate}
          className="text-sm font-medium px-3 py-1.5 rounded-full bg-orange-500 text-white hover:bg-orange-600 shadow-sm shrink-0"
        >
          Generate
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="text-stone-400 hover:text-stone-600 text-lg leading-none px-1 shrink-0"
          aria-label="Dismiss"
        >
          ×
        </button>
      </div>
    </div>
  );
}
