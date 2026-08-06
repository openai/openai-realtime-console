import { shaderMaterial } from "@react-three/drei";
import { extend } from "@react-three/fiber";
import * as THREE from "three";

// Vite's `?raw` import loads the .glsl file as a plain string — no bundler
// plugin required, and it keeps the shaders as real, syntax-highlightable
// .glsl files instead of JS template strings.
import vertexShader from "./shaders/vertex.glsl?raw";
import fragmentShader from "./shaders/fragment.glsl?raw";

// shaderMaterial() builds a THREE.ShaderMaterial subclass with the given
// uniforms pre-wired, and drei/fiber's `extend()` registers it as a JSX
// intrinsic (<orbMaterial />) usable directly in Orb.jsx.
const OrbMaterial = shaderMaterial(
  {
    uTime: 0,
    uAudioLevel: 0,
    uIntensity: 0.5,
    uBreathSpeed: 0.4,
    uNoiseScale: 1.4,
    uColorA: new THREE.Color("#1e3a8a"),
    uColorB: new THREE.Color("#312e81"),
    uColorC: new THREE.Color("#1e1b4b"),
    uGlowColor: new THREE.Color("#60a5fa"),
  },
  vertexShader,
  fragmentShader,
);

extend({ OrbMaterial });

export default OrbMaterial;
