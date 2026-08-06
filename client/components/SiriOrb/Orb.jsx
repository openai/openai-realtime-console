import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import "./OrbMaterial";
import { ORB_STATES } from "./store/orbStore";

// Per-theme color targets for each conversational phase. Colors are plain
// hex strings here and converted/lerped into THREE.Color on the GPU side
// each frame, so switching state (or theme) always animates smoothly
// instead of popping.
const THEMES = {
  default: {
    [ORB_STATES.IDLE]: { a: "#1e3a8a", b: "#312e81", c: "#1e1b4b", glow: "#60a5fa" },
    [ORB_STATES.LISTENING]: { a: "#2563eb", b: "#7c3aed", c: "#a855f7", glow: "#93c5fd" },
    [ORB_STATES.THINKING]: { a: "#7c3aed", b: "#a21caf", c: "#db2777", glow: "#e9d5ff" },
    [ORB_STATES.SPEAKING]: { a: "#38bdf8", b: "#a855f7", c: "#f472b6", glow: "#f0f9ff" },
  },
};

// Overall shader "energy" per state — feeds uIntensity, which scales
// surface displacement amplitude and glow strength.
const STATE_INTENSITY = {
  [ORB_STATES.IDLE]: 0.45,
  [ORB_STATES.LISTENING]: 1.0,
  [ORB_STATES.THINKING]: 0.85,
  [ORB_STATES.SPEAKING]: 1.4,
};

// How fast the idle "breathing" sine wave cycles per state — kept gentle
// everywhere so nothing ever feels like a sharp, mechanical animation.
const STATE_BREATH_SPEED = {
  [ORB_STATES.IDLE]: 0.35,
  [ORB_STATES.LISTENING]: 0.8,
  [ORB_STATES.THINKING]: 0.5,
  [ORB_STATES.SPEAKING]: 1.1,
};

export default function Orb({ state, getAudioLevel, theme = "default", baseAudioLevel = 0 }) {
  const meshRef = useRef();
  const materialRef = useRef();
  const smoothedLevel = useRef(0);
  // Scratch color reused every frame to avoid allocating a new THREE.Color
  // per lerp call (part of keeping this GC-free inside the render loop).
  const targetColor = useRef(new THREE.Color());

  const palette = THEMES[theme] ?? THEMES.default;

  // Sphere resolution scales down on small/mobile viewports to protect
  // frame rate — displacement is a vertex-shader effect, so vertex count
  // directly drives GPU cost.
  const segments = useMemo(() => {
    if (typeof window === "undefined") return 96;
    return window.innerWidth < 768 ? 48 : 96;
  }, []);

  useFrame((_, delta) => {
    const material = materialRef.current;
    if (!material) return;

    material.uTime += delta;

    // Live amplitude: analyser-driven while listening/speaking, otherwise
    // the controlled `baseAudioLevel` prop (0 in normal idle/thinking use).
    const rawLevel = getAudioLevel ? getAudioLevel() : baseAudioLevel;
    smoothedLevel.current = THREE.MathUtils.lerp(smoothedLevel.current, rawLevel, 0.15);
    material.uAudioLevel = smoothedLevel.current;

    const targetIntensity = STATE_INTENSITY[state] ?? STATE_INTENSITY[ORB_STATES.IDLE];
    material.uIntensity = THREE.MathUtils.lerp(material.uIntensity, targetIntensity, delta * 2);

    const targetBreath = STATE_BREATH_SPEED[state] ?? STATE_BREATH_SPEED[ORB_STATES.IDLE];
    material.uBreathSpeed = THREE.MathUtils.lerp(material.uBreathSpeed, targetBreath, delta * 2);

    const colors = palette[state] ?? palette[ORB_STATES.IDLE];
    material.uColorA.lerp(targetColor.current.set(colors.a), delta * 2);
    material.uColorB.lerp(targetColor.current.set(colors.b), delta * 2);
    material.uColorC.lerp(targetColor.current.set(colors.c), delta * 2);
    material.uGlowColor.lerp(targetColor.current.set(colors.glow), delta * 2);

    if (meshRef.current) {
      // Slow continuous rotation — the orb should never look frozen, even
      // at rest — plus a gentle wobble for a more organic, floating feel.
      meshRef.current.rotation.y += delta * 0.08;
      meshRef.current.rotation.x = Math.sin(material.uTime * 0.15) * 0.1;
    }
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[1.2, segments, segments]} />
      <orbMaterial ref={materialRef} transparent depthWrite={false} side={THREE.FrontSide} />
    </mesh>
  );
}
