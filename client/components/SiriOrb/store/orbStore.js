import { create } from "zustand";

// The four conversational phases the orb can visualize.
export const ORB_STATES = {
  IDLE: "idle",
  LISTENING: "listening",
  THINKING: "thinking",
  SPEAKING: "speaking",
};

/**
 * Holds only the orb's *infrequently* changing state (conversation phase +
 * theme). Live audio amplitude deliberately never touches this store or
 * React state at all — it's sampled straight from the Web Audio
 * AnalyserNode inside useFrame (see Orb.jsx), so per-frame updates only
 * ever touch shader uniforms and never trigger a React re-render.
 */
export const useOrbStore = create((set) => ({
  state: ORB_STATES.IDLE,
  theme: "default",
  setState: (state) => set({ state }),
  setTheme: (theme) => set({ theme }),
}));
