import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import Orb from "./Orb";
import { useStreamAnalyzer } from "./hooks/useAudioAnalyzer";
import { ORB_STATES } from "./store/orbStore";

// Optional floating particle halo around the orb. Rotation speed reacts to
// state so it reads as part of the same living object, not a separate
// decoration.
function Particles({ state, count = 70 }) {
  const pointsRef = useRef();

  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const radius = 1.75 + Math.random() * 0.7;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      arr[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      arr[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      arr[i * 3 + 2] = radius * Math.cos(phi);
    }
    return arr;
  }, [count]);

  useFrame((_, delta) => {
    if (!pointsRef.current) return;
    const speed =
      state === ORB_STATES.SPEAKING ? 0.22 : state === ORB_STATES.LISTENING ? 0.14 : 0.04;
    pointsRef.current.rotation.y += delta * speed;
    pointsRef.current.rotation.x += delta * speed * 0.4;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
        size={0.018}
        color="#c4b5fd"
        transparent
        opacity={0.55}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

export default function Scene({ state, micStream, aiStream, theme, audioLevel }) {
  // Both analysers are always "wired up" (cheap) — which one actually
  // drives the shader is picked per-frame based on the current phase, so
  // switching from listening -> speaking never needs to re-create nodes.
  const getMicLevel = useStreamAnalyzer(micStream);
  const getAiLevel = useStreamAnalyzer(aiStream);

  function getAudioLevel() {
    if (state === ORB_STATES.SPEAKING) return getAiLevel();
    if (state === ORB_STATES.LISTENING) return getMicLevel();
    return 0;
  }

  return (
    <Canvas
      camera={{ position: [0, 0, 5.2], fov: 40 }}
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
    >
      <Orb state={state} getAudioLevel={getAudioLevel} theme={theme} baseAudioLevel={audioLevel} />
      <Particles state={state} />
      <EffectComposer multisampling={0}>
        {/* Lower intensity + higher threshold than the "looks nice at rest"
            defaults - bloom amplifies whatever's already bright, so with
            the fragment shader's glow now capped, these just add a safety
            margin against a hot rim spreading into a full whiteout under
            loud real audio. */}
        <Bloom intensity={0.6} luminanceThreshold={0.3} luminanceSmoothing={0.4} mipmapBlur />
      </EffectComposer>
    </Canvas>
  );
}
