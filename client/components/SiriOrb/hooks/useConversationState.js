import { useEffect, useState } from "react";
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

  useEffect(() => {
    if (!isSessionActive) {
      setState(ORB_STATES.IDLE);
    }
  }, [isSessionActive]);

  useEffect(() => {
    if (!isSessionActive || !events || events.length === 0) return;

    const latest = events[0];
    switch (latest.type) {
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
  }, [events, isSessionActive]);

  return state;
}
