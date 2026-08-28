import { useEffect, useRef } from "react";

/**
 * Real-time bar visualizer driven by an AnalyserNode (Web Audio API) — reads actual
 * frequency data from the live mic input, not a fake/animated loop.
 */
export default function LiveWaveform({ analyserRef, isActive, barColor = "#f97316" }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
    };
    resize();
    window.addEventListener("resize", resize);

    const draw = () => {
      const analyser = analyserRef.current;
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      if (analyser && isActive) {
        const bufferLength = analyser.frequencyBinCount;
        const data = new Uint8Array(bufferLength);
        analyser.getByteFrequencyData(data);

        const barCount = 32;
        const step = Math.floor(bufferLength / barCount) || 1;
        const barWidth = width / barCount;

        for (let i = 0; i < barCount; i++) {
          const value = data[i * step] / 255;
          const barHeight = Math.max(height * 0.04, value * height * 0.95);
          const x = i * barWidth;
          const y = (height - barHeight) / 2;
          ctx.fillStyle = barColor;
          const radius = Math.min(barWidth * 0.3, 6 * dpr);
          roundRect(ctx, x + barWidth * 0.18, y, barWidth * 0.64, barHeight, radius);
        }
      } else {
        // idle flatline
        const barCount = 32;
        const barWidth = width / barCount;
        ctx.fillStyle = "#f3e8ff";
        for (let i = 0; i < barCount; i++) {
          const x = i * barWidth;
          const barHeight = height * 0.06;
          const y = (height - barHeight) / 2;
          roundRect(ctx, x + barWidth * 0.18, y, barWidth * 0.64, barHeight, 4);
        }
      }
      rafRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [analyserRef, isActive, barColor]);

  return <canvas ref={canvasRef} className="w-full h-20" />;
}

function roundRect(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
  ctx.fill();
}
