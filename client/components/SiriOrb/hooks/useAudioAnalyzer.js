import { useEffect, useRef } from "react";

// A single shared AudioContext for the whole app — browsers cap the number
// of contexts that can be created, and we may analyze both the mic stream
// and the AI playback stream at once.
let sharedAudioContext = null;
function getAudioContext() {
  if (!sharedAudioContext) {
    const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
    sharedAudioContext = new AudioContextCtor();
  }
  if (sharedAudioContext.state === "suspended") {
    sharedAudioContext.resume();
  }
  return sharedAudioContext;
}

const FFT_SIZE = 1024;

/**
 * Taps a MediaStream for volume analysis WITHOUT requesting getUserMedia
 * again and without altering how the stream is already used elsewhere
 * (sent over WebRTC, or played through an <audio> element). Both of those
 * consume the MediaStream independently of the Web Audio graph, so
 * createMediaStreamSource here is a passive, non-destructive tap.
 *
 * Returns a `getLevel()` function (not a value) so callers can read a
 * fresh amplitude every animation frame inside useFrame without ever
 * causing a React re-render.
 */
export function useStreamAnalyzer(stream) {
  const analyserRef = useRef(null);
  const dataRef = useRef(null);

  useEffect(() => {
    if (!stream || stream.getAudioTracks().length === 0) {
      analyserRef.current = null;
      return undefined;
    }

    const context = getAudioContext();
    const analyser = context.createAnalyser();
    analyser.fftSize = FFT_SIZE;
    analyser.smoothingTimeConstant = 0.8;

    const source = context.createMediaStreamSource(stream);
    source.connect(analyser);

    analyserRef.current = analyser;
    dataRef.current = new Float32Array(analyser.fftSize);

    return () => {
      source.disconnect();
      analyserRef.current = null;
      dataRef.current = null;
    };
  }, [stream]);

  return function getLevel() {
    const analyser = analyserRef.current;
    const data = dataRef.current;
    if (!analyser || !data) return 0;

    analyser.getFloatTimeDomainData(data);

    let sumSquares = 0;
    let peak = 0;
    for (let i = 0; i < data.length; i++) {
      const sample = data[i];
      sumSquares += sample * sample;
      const abs = Math.abs(sample);
      if (abs > peak) peak = abs;
    }

    const rms = Math.sqrt(sumSquares / data.length);

    // Blend RMS (perceived loudness) with peak (transient punch) and
    // normalize to a comfortable 0..1 range for the shader.
    return Math.min(1, rms * 4 + peak * 0.5);
  };
}
