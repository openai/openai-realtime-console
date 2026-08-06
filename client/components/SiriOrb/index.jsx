import { Suspense, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Scene from "./Scene";
import { ORB_STATES, useOrbStore } from "./store/orbStore";
import "./styles.css";

export { useConversationState } from "./hooks/useConversationState";
export { ORB_STATES };

const STATUS_LABEL = {
  [ORB_STATES.IDLE]: "Connected — say something",
  [ORB_STATES.LISTENING]: "Listening...",
  [ORB_STATES.THINKING]: "Thinking...",
  [ORB_STATES.SPEAKING]: "Speaking...",
};

/**
 * Premium, audio-reactive AI voice orb. Fully self-contained: give it a
 * conversational `state` (idle | listening | thinking | speaking) and,
 * optionally, the raw mic/AI MediaStreams already in use elsewhere in the
 * app (WebRTC) so it can react to live volume without requesting the
 * microphone a second time.
 *
 * <SiriOrb state="listening" micStream={ms} aiStream={remoteStream} theme="default" />
 */
export default function SiriOrb({
  state = ORB_STATES.IDLE,
  audioLevel = 0,
  micStream = null,
  aiStream = null,
  theme = "default",
  showStatus = true,
  isSessionActive = true,
  className = "",
}) {
  const setState = useOrbStore((s) => s.setState);
  const setTheme = useOrbStore((s) => s.setTheme);
  const storeState = useOrbStore((s) => s.state);
  const storeTheme = useOrbStore((s) => s.theme);

  // Sync incoming props into the store. These change rarely (a handful of
  // times per conversation turn), so this is a perfectly cheap re-render —
  // the per-frame audio data never flows through here.
  useEffect(() => {
    setState(state);
  }, [state, setState]);

  useEffect(() => {
    setTheme(theme);
  }, [theme, setTheme]);

  return (
    <div className={`siri-orb-container ${className}`}>
      <Suspense fallback={null}>
        <Scene
          state={storeState}
          theme={storeTheme}
          micStream={micStream}
          aiStream={aiStream}
          audioLevel={audioLevel}
        />
      </Suspense>
      {showStatus && (
        <div className="siri-orb-status">
          <AnimatePresence mode="wait">
            <motion.span
              key={storeState}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              {isSessionActive
                ? STATUS_LABEL[storeState] ?? STATUS_LABEL[ORB_STATES.IDLE]
                : "Awaiting session..."}
            </motion.span>
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
