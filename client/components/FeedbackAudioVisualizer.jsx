import { useEffect, useRef, useCallback } from 'react';

function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

const FeedbackAudioVisualizer = ({
  audioStream,
  isPlaying,
  className,
  barWidth = 3,
  gap = 2,
  barColor = '#10a37f', // OpenAI green color
  barCount = 32, // Number of frequency bars
}) => {
  const canvasRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceNodeRef = useRef(null);
  const dataArrayRef = useRef(null);
  const animationFrameRef = useRef(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    const dataArray = dataArrayRef.current;
    if (!canvas || !analyser || !dataArray) {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    analyser.getByteFrequencyData(dataArray);

    const { width, height } = canvas;
    ctx.clearRect(0, 0, width, height);

    const bufferLength = analyser.frequencyBinCount;
    const totalBarWidth = barCount * barWidth;
    const totalGapWidth = (barCount - 1) * gap;
    const totalWidth = totalBarWidth + totalGapWidth;

    let x = (width - totalWidth) / 2; // Center the bars

    const step = Math.floor(bufferLength / barCount);

    for (let i = 0; i < barCount; i++) {
      let sum = 0;
      const startBin = i * step;
      const endBin = Math.min(startBin + step, bufferLength);
      for (let j = startBin; j < endBin; j++) {
        sum += dataArray[j];
      }
      const avgValue = sum / (endBin - startBin);

      const barHeight = Math.max(2, (avgValue / 255) * height);

      ctx.fillStyle = barColor;
      ctx.fillRect(x, height - barHeight, barWidth, barHeight);

      x += barWidth + gap;
    }

    if (isPlaying) {
      animationFrameRef.current = requestAnimationFrame(draw);
    } else {
      ctx.clearRect(0, 0, width, height);
    }
  }, [barColor, barCount, barWidth, gap, isPlaying]); // Include drawing parameters

  useEffect(() => {
    if (audioStream && isPlaying) {
      try {
        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
        }
        const audioContext = audioContextRef.current;

        if (!analyserRef.current || analyserRef.current.context !== audioContext) {
          analyserRef.current = audioContext.createAnalyser();
          analyserRef.current.fftSize = 256; // Adjust FFT size for detail vs performance
          const bufferLength = analyserRef.current.frequencyBinCount;
          dataArrayRef.current = new Uint8Array(bufferLength);
          console.log("RTC Visualizer: Analyser created, bufferLength:", bufferLength);
        }

        if (!sourceNodeRef.current || sourceNodeRef.current.mediaStream !== audioStream) {
          if (sourceNodeRef.current) {
            try { sourceNodeRef.current.disconnect(); } catch (e) {}
          }
          sourceNodeRef.current = audioContext.createMediaStreamSource(audioStream);
          sourceNodeRef.current.connect(analyserRef.current);
          console.log("RTC Visualizer: Audio stream connected to analyser.");
        }

        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = requestAnimationFrame(draw);

      } catch (error) {
        console.error("Error setting up Web Audio API for visualizer:", error);
      }

    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (sourceNodeRef.current) {
        try { sourceNodeRef.current.disconnect(); } catch(e){}
        sourceNodeRef.current = null;
        console.log("RTC Visualizer: Disconnected source node.");
      }
    };
  }, [audioStream, isPlaying, draw]); // Re-run setup if stream or playing state changes

  return (
    <canvas
      ref={canvasRef}
      className={cn("w-full h-16", className)} // Default size, override with className
      style={{ width: '100%', height: className ? undefined : '64px' }} // Fallback styles if no className
    />
  );
};

export default FeedbackAudioVisualizer;
