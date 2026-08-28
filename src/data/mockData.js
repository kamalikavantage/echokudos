// Mock people used throughout the prototype. No backend — this is the entire "org directory".
export const TEAMMATES = [
  { id: "priya", name: "Priya Sharma", role: "Product Design Lead", color: "#f97316" },
  { id: "marcus", name: "Marcus Chen", role: "Engineering Manager", color: "#ec4899" },
  { id: "aisha", name: "Aisha Bello", role: "Customer Success", color: "#9333ea" },
  { id: "daniel", name: "Daniel Kim", role: "Sales Director", color: "#0ea5e9" },
  { id: "sofia", name: "Sofia Torres", role: "People & Culture", color: "#16a34a" },
];

// The person "using" the app in this demo session.
export const CURRENT_USER = { id: "you", name: "You", role: "Teammate", color: "#f43f5e" };

export const ALL_PEOPLE = [CURRENT_USER, ...TEAMMATES];

export function getPerson(id) {
  return ALL_PEOPLE.find((p) => p.id === id) || CURRENT_USER;
}

export const TONE_TAGS = [
  { label: "Enthusiastic", emoji: "🔥", tint: "#f97316" },
  { label: "Heartfelt", emoji: "🙏", tint: "#9333ea" },
  { label: "Warm", emoji: "😄", tint: "#ec4899" },
  { label: "Inspiring", emoji: "✨", tint: "#eab308" },
  { label: "Appreciative", emoji: "💪", tint: "#0ea5e9" },
];

export function randomTone() {
  return TONE_TAGS[Math.floor(Math.random() * TONE_TAGS.length)];
}

// Deterministic-looking "random" bar heights for placeholder waveforms, seeded per item
// so the same seed always renders the same shape (mimics a "pre-analyzed" waveform).
export function seededWaveform(seed, bars = 40) {
  let s = seed;
  const rand = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  return Array.from({ length: bars }, (_, i) => {
    const envelope = Math.sin((i / bars) * Math.PI); // taper at the ends like real speech
    return Math.max(0.08, envelope * (0.4 + rand() * 0.6));
  });
}

const MOCK_TRANSCRIPTS = [
  "Thank you so much for jumping in on the client deck last minute — you genuinely saved the launch.",
  "I just wanted to say the way you ran that retro was amazing. Everyone felt heard, and we actually fixed things.",
  "You've been such a steady hand for the whole team this quarter. Really, thank you for always showing up.",
  "That walkthrough you gave the new hires was so clear. You made a hard topic feel simple.",
  "I know it's a small thing, but you remembering my deadline and checking in meant a lot to me.",
  "Your feedback on my proposal was so thoughtful and kind. It genuinely made the work better.",
  "Huge thanks for covering for me last week — I couldn't have taken that time off without you.",
  "The energy you bring into every stand-up is contagious. Thank you for making Mondays less painful.",
];

export function randomMockTranscript() {
  return MOCK_TRANSCRIPTS[Math.floor(Math.random() * MOCK_TRANSCRIPTS.length)];
}

// Seed data for the feed so it never looks empty. `waveform` is pre-generated since we
// can't ship pre-recorded audio; `audioSpec` describes a synthesized placeholder clip that
// gets rendered into a real, playable Blob at runtime (see utils/audio.js).
export const SEED_RECOGNITIONS = [
  {
    id: "seed-1",
    senderId: "marcus",
    recipientId: "priya",
    transcript:
      "Priya, the way you facilitated the design review today was incredible. You made space for every voice in the room and we landed on a much better direction because of it. Thank you.",
    tone: TONE_TAGS[1], // Heartfelt
    createdAt: Date.now() - 1000 * 60 * 60 * 26,
    durationSec: 9,
    waveformSeed: 12,
    audioSpec: { seed: 12, durationSec: 9, brightness: 0.5 },
  },
  {
    id: "seed-2",
    senderId: "daniel",
    recipientId: "priya",
    transcript:
      "Just wanted to say thank you for the quick turnaround on those mockups before the client call. It genuinely helped us close the deal.",
    tone: TONE_TAGS[4], // Appreciative
    createdAt: Date.now() - 1000 * 60 * 60 * 50,
    durationSec: 6,
    waveformSeed: 34,
    audioSpec: { seed: 34, durationSec: 6, brightness: 0.4 },
  },
  {
    id: "seed-3",
    senderId: "sofia",
    recipientId: "priya",
    transcript:
      "One year at the company already! Priya, you've shaped this team's culture more than you know. So grateful you're here.",
    tone: TONE_TAGS[2], // Warm
    createdAt: Date.now() - 1000 * 60 * 60 * 80,
    durationSec: 8,
    waveformSeed: 56,
    audioSpec: { seed: 56, durationSec: 8, brightness: 0.6 },
  },
  {
    id: "seed-4",
    senderId: "aisha",
    recipientId: "marcus",
    transcript:
      "Thank you for staying late to help me debug that customer issue. You didn't have to, and it really mattered.",
    tone: TONE_TAGS[3], // Inspiring
    createdAt: Date.now() - 1000 * 60 * 60 * 5,
    durationSec: 7,
    waveformSeed: 78,
    audioSpec: { seed: 78, durationSec: 7, brightness: 0.55 },
  },
  {
    id: "seed-5",
    senderId: "priya",
    recipientId: "sofia",
    transcript:
      "Sofia, thank you for how you handled that sensitive conversation with the team. So much care and clarity — you're amazing at this.",
    tone: TONE_TAGS[0], // Enthusiastic
    createdAt: Date.now() - 1000 * 60 * 30,
    durationSec: 10,
    waveformSeed: 91,
    audioSpec: { seed: 91, durationSec: 10, brightness: 0.7 },
  },
];
