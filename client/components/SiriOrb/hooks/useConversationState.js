import { useEffect, useRef, useState } from "react";
import { ORB_STATES } from "../store/orbStore";

/**
 * Derives the orb's conversational phase from the OpenAI Realtime API
 * server events the console already receives on its data channel — no
 * timers, no guessing. `events` is expected newest-first, matching the
 * `events` state already maintained in App.jsx.
 *
 * Mapping:
 *   input_audio_buffer.speech_started  -> listening (user is talking)
 *   input_audio_buffer.speech_stopped  -> thinking   (VAD ended turn, response pending)
 *   response.created                   -> thinking   (model is generating)
 *   output_audio_buffer.started        -> speaking   (audio is actually playing)
 *   output_audio_buffer.stopped        -> idle        (audio playback finished)
 *   response.done                      -> idle, but only if we were still
 *                                          "thinking" (covers text/function-only
 *                                          turns that never produce audio)
 */
export function useConversationState(events, isSessionActive) {
  const [state, setState] = useState(ORB_STATES.IDLE);
  // React can batch several data-channel messages that arrive in the same
  // tick into a single render (e.g. response.done immediately followed by
  // rate_limits.updated). Reacting to only events[0] would then silently
  // skip response.done and leave the orb stuck "thinking" forever - so we
  // track the last event we actually processed and walk every event newer
  // than it, oldest to newest, on each render.
  const lastSeenIdRef = useRef(null);

  useEffect(() => {
    if (!isSessionActive) {
      setState(ORB_STATES.IDLE);
      lastSeenIdRef.current = null;
    }
  }, [isSessionActive]);

  useEffect(() => {
    if (!isSessionActive || !events || events.length === 0) return;

    const lastSeenId = lastSeenIdRef.current;
    let boundary = events.length;
    if (lastSeenId != null) {
      const idx = events.findIndex((e) => e.event_id === lastSeenId);
      if (idx !== -1) boundary = idx;
    }
    lastSeenIdRef.current = events[0].event_id ?? lastSeenIdRef.current;

    for (let i = boundary - 1; i >= 0; i--) {
      switch (events[i].type) {
        case "input_audio_buffer.speech_started":
          setState(ORB_STATES.LISTENING);
          break;
        case "input_audio_buffer.speech_stopped":
        case "response.created":
          setState(ORB_STATES.THINKING);
          break;
        case "output_audio_buffer.started":
          setState(ORB_STATES.SPEAKING);
          break;
        case "output_audio_buffer.stopped":
          setState(ORB_STATES.IDLE);
          break;
        case "response.done":
          setState((prev) =>
            prev === ORB_STATES.THINKING ? ORB_STATES.IDLE : prev,
          );
          break;
        default:
          break;
      }
    }
  }, [events, isSessionActive]);

  return state;
}
