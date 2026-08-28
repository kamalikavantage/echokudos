import { useCallback, useRef, useState } from "react";
import { pickSupportedMimeType } from "../utils/audio";

const MAX_SECONDS = 60;

/**
 * Real microphone recording via MediaRecorder, plus a live AnalyserNode for the
 * waveform visualizer. No mocking here — if the mic is granted, this captures actual audio.
 */
export function useAudioRecorder({ onMaxLength } = {}) {
  const [isRecording, setIsRecording] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [permissionError, setPermissionError] = useState(null);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [recordedUrl, setRecordedUrl] = useState(null);

  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const timerRef = useRef(null);
  const startTimeRef = useRef(0);

  const cleanupStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    analyserRef.current = null;
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startRecording = useCallback(async () => {
    setPermissionError(null);
    setRecordedBlob(null);
    setRecordedUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });

    if (!navigator.mediaDevices?.getUserMedia) {
      setPermissionError("Microphone access isn't available in this browser.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Real-time analyser for the live waveform visualizer.
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const audioCtx = new AudioCtx();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 128;
      source.connect(analyser);
      audioCtxRef.current = audioCtx;
      analyserRef.current = analyser;

      const mimeType = pickSupportedMimeType();
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        setRecordedBlob(blob);
        setRecordedUrl(URL.createObjectURL(blob));
        cleanupStream();
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
      setElapsedSec(0);
      startTimeRef.current = Date.now();

      timerRef.current = setInterval(() => {
        const secs = (Date.now() - startTimeRef.current) / 1000;
        setElapsedSec(secs);
        if (secs >= MAX_SECONDS) {
          onMaxLength?.();
        }
      }, 200);
    } catch (err) {
      setPermissionError(
        err?.name === "NotAllowedError"
          ? "Microphone access was denied. You can still try the demo with a mocked transcript."
          : "Couldn't access the microphone. You can still try the demo with a mocked transcript."
      );
    }
  }, [cleanupStream, onMaxLength]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    } else {
      cleanupStream();
    }
    setIsRecording(false);
  }, [cleanupStream]);

  const reset = useCallback(() => {
    setRecordedBlob(null);
    setRecordedUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setElapsedSec(0);
    setPermissionError(null);
  }, []);

  return {
    isRecording,
    elapsedSec,
    maxSeconds: MAX_SECONDS,
    permissionError,
    recordedBlob,
    recordedUrl,
    analyserRef,
    startRecording,
    stopRecording,
    reset,
  };
}
