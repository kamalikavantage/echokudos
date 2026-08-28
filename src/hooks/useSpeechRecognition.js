import { useCallback, useRef, useState } from "react";
import { randomMockTranscript } from "../data/mockData";

/**
 * Wraps the browser's SpeechRecognition API for live transcription while recording.
 * When unsupported (or it errors out), callers should fall back to a mocked transcript
 * so the demo never breaks — see `getMockedTranscript`.
 */
export function useSpeechRecognition() {
  const [transcript, setTranscript] = useState("");
  const [isSupported] = useState(() => {
    return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
  });
  const recognitionRef = useRef(null);

  const start = useCallback(() => {
    if (!isSupported) return;
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new Recognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    let finalTranscript = "";
    recognition.onresult = (event) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const chunk = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += chunk + " ";
        } else {
          interim += chunk;
        }
      }
      setTranscript((finalTranscript + interim).trim());
    };
    recognition.onerror = () => {
      // Swallow errors (e.g. "no-speech", permission quirks) — the recording itself
      // still works, and the caller falls back to a mocked transcript if this stays empty.
    };

    recognitionRef.current = recognition;
    setTranscript("");
    try {
      recognition.start();
    } catch {
      // Some browsers throw if called twice in a row; ignore.
    }
  }, [isSupported]);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
  }, []);

  return { transcript, isSupported, start, stop };
}

export function getMockedTranscript() {
  return randomMockTranscript();
}
