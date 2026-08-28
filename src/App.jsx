import { useEffect, useRef, useState } from "react";
import NavBar from "./components/NavBar";
import AnniversaryBanner from "./components/AnniversaryBanner";
import SendRecognition from "./components/SendRecognition";
import RecognitionFeed from "./components/RecognitionFeed";
import HighlightReel from "./components/HighlightReel";
import Toast from "./components/Toast";
import { SEED_RECOGNITIONS, seededWaveform, getPerson } from "./data/mockData";
import { synthesizePlaceholderClip } from "./utils/audio";

export default function App() {
  const [tab, setTab] = useState("record");
  const [recognitions, setRecognitions] = useState(() =>
    SEED_RECOGNITIONS.map((r) => ({ ...r, peaks: seededWaveform(r.waveformSeed), audioUrl: null }))
  );
  const [showSentToast, setShowSentToast] = useState(false);
  const [reelTrigger, setReelTrigger] = useState(0);
  const generatedSeeds = useRef(false);

  // Synthesize playable placeholder audio for the seeded feed items once, on mount.
  useEffect(() => {
    if (generatedSeeds.current) return;
    generatedSeeds.current = true;
    SEED_RECOGNITIONS.forEach((seed) => {
      synthesizePlaceholderClip(seed.audioSpec).then((blob) => {
        const url = URL.createObjectURL(blob);
        setRecognitions((prev) =>
          prev.map((r) => (r.id === seed.id ? { ...r, audioUrl: url, audioBlob: blob } : r))
        );
      });
    });
  }, []);

  const handleSend = (recognition) => {
    setRecognitions((prev) => [
      ...prev,
      { ...recognition, id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}` },
    ]);
    setShowSentToast(true);
    setTimeout(() => setShowSentToast(false), 2200);
  };

  const handleGenerateFromBanner = () => {
    setTab("reel");
    setReelTrigger((n) => n + 1);
  };

  return (
    <div className="min-h-screen">
      <NavBar active={tab} onChange={setTab} />
      <AnniversaryBanner person={getPerson("priya")} onGenerate={handleGenerateFromBanner} />

      {/* All three tabs stay mounted (hidden via CSS) so in-progress recording, playback,
          and the highlight reel's compiled state survive switching tabs. */}
      <div style={{ display: tab === "record" ? "block" : "none" }}>
        <SendRecognition onSend={handleSend} />
      </div>
      <div style={{ display: tab === "feed" ? "block" : "none" }}>
        <RecognitionFeed recognitions={recognitions} />
      </div>
      <div style={{ display: tab === "reel" ? "block" : "none" }}>
        <HighlightReel recognitions={recognitions} triggerSignal={reelTrigger} />
      </div>

      <Toast show={showSentToast} message="Recognition sent! 🎉" emoji="💌" />

      <footer className="text-center text-xs text-stone-400 py-8">
        EchoKudos — a voice recognition prototype · everything runs in your browser, nothing is
        stored on a server
      </footer>
    </div>
  );
}
