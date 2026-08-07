import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MessageCircle } from "react-feather";
import { businessSummary } from "../../data/woyceBusinessSummary";
import { inferSectionFromText } from "./inferSection";
import {
  BrandSection,
  CareersSection,
  CaseStudiesSection,
  ContactSection,
  OverviewSection,
  PartnershipsSection,
  ProcessSection,
  ServicesSection,
  TeamSection,
  TestimonialsSection,
} from "./sections";
import { SECTION_ACCENT } from "./ui";
import "./styles.css";

const SECTION_RENDERERS = {
  overview: OverviewSection,
  team: TeamSection,
  services: ServicesSection,
  process: ProcessSection,
  case_studies: CaseStudiesSection,
  testimonials: TestimonialsSection,
  careers: CareersSection,
  partnerships: PartnershipsSection,
  brand: BrandSection,
  contact: ContactSection,
};

const functionDescription = `
Call this function whenever the user asks anything about Woyce Technologies
as a company - services, team, process, pricing, case studies, testimonials,
careers, partnerships, brand, or contact info. Call it FIRST, as the very
first thing you do in the turn, before you say a single word of your spoken
answer - not after, not alongside the end of it. The visual needs to appear
the instant you start talking, not after you finish. Call it every time this
happens, even on back-to-back follow-up questions about the same topic - the
visual must stay in sync with your current answer, not a previous one.

Calling this function is NOT a complete answer by itself - it only makes a
visual appear silently on screen. The user cannot see it speak, so if you
call this function and then stop without saying anything out loud, the user
gets a picture and total silence, which is broken. You must always continue
talking immediately after this call, in the same turn, and actually give
your spoken answer out loud.
`;

const sessionUpdate = {
  type: "session.update",
  session: {
    type: "realtime",
    instructions: `You are the voice assistant for Woyce Technologies, a software product studio. Your entire conversation is scoped to the facts below and nothing else - do not invent details that aren't here:

${businessSummary}

SCOPE: Only discuss Woyce Technologies using the facts above. Do not answer general-knowledge questions, questions about other companies, personal/technical advice unrelated to Woyce, or any other off-topic request - even if you know the answer. If asked something outside this scope, briefly say you can only help with questions about Woyce Technologies and invite them to ask about the company (its services, team, process, case studies, etc). Do not call display_business_info for an off-topic question - only call it when the question is actually about the company.

For EVERY on-topic question about the company, do both, IN THIS ORDER, WITHIN THE SAME TURN: (1) call display_business_info with the section that best matches, as your first action and before you say anything out loud, so the visual appears immediately; THEN (2) - without waiting for anything, without stopping, in that same turn - give your brief spoken answer using the facts above. Never speak first and call the function afterward or at the end - by then the visual arrives too late to feel connected to what you're saying. And never treat the function call alone as a finished response - a turn that calls the function and then goes silent has failed at its actual job, which is answering the user out loud. The function call is the opening move of the turn, immediately followed by you speaking, every single time.

This is not a one-time action. Call display_business_info again on every single turn that touches the company - including follow-up questions, questions that stay on the same topic, and questions that repeat something already asked. The panel on screen must always match what you are currently saying, never something from an earlier turn. Never skip the call just because you already showed something similar before.

If the question mentions a specific industry, person, role, or company name, pass it as the query so the visual can be filtered to it.`,
    tools: [
      {
        type: "function",
        name: "display_business_info",
        description: functionDescription,
        parameters: {
          type: "object",
          strict: true,
          properties: {
            section: {
              type: "string",
              enum: [
                "overview",
                "team",
                "services",
                "process",
                "case_studies",
                "testimonials",
                "careers",
                "partnerships",
                "brand",
                "contact",
              ],
              description: "Which part of the business the user is asking about.",
            },
            query: {
              type: "string",
              description:
                "A short keyword/phrase from the user's question to filter the section's list - an industry, a person's name, a role, a company name. Empty string if there's nothing to filter by.",
            },
          },
          required: ["section", "query"],
        },
      },
    ],
    tool_choice: "auto",
  },
};

const SUGGESTIONS = [
  "What services do you offer?",
  "Tell me about the team",
  "Show me some case studies",
  "How can I contact you?",
];

/**
 * Self-contained business-info panel: registers the display_business_info
 * tool on session start, listens for the model's function calls as they
 * stream in (not after the full turn finishes), and renders a visual for
 * whichever section/query it was asked to show - live, while the AI is
 * still speaking.
 */
export default function BusinessPanel({ isSessionActive, sendClientEvent, events }) {
  const [toolRegistered, setToolRegistered] = useState(false);
  const [view, setView] = useState(null);
  // Bumped on every function call, even ones that repeat the same
  // section/query - it's what forces the transition + sync flash to
  // replay even when the AI answers a near-identical follow-up question.
  const [updateCount, setUpdateCount] = useState(0);
  // Tool-calling isn't 100% reliable turn to turn even with strong
  // instructions - the model can answer a company question in speech and
  // just forget to call display_business_info. These track the current
  // response's transcript and whether it already produced a function call,
  // so response.done can fall back to inferring a section from what was
  // actually said (see inferSection.js) instead of leaving the panel stale.
  const transcriptRef = useRef("");
  const gotFunctionCallRef = useRef(false);
  // Prompting the model to call the tool before speaking sometimes makes it
  // treat the function call as a complete response and stop, leaving the
  // panel updated but the AI silent. These track the in-flight call's id
  // and cap how many times we'll nudge the model to continue, so a single
  // silent turn gets one shot at recovering into an actual spoken answer
  // instead of looping forever if the model keeps doing it.
  const pendingCallIdRef = useRef(null);
  const autoContinueAttemptsRef = useRef(0);
  // React can batch several data-channel messages arriving in the same
  // tick into a single render (transcript deltas fire many times a second,
  // and function_call_arguments.done is typically followed immediately by
  // conversation.item.done / response.output_item.done / response.done /
  // rate_limits.updated). Reacting to only events[0] would silently skip
  // whichever of those landed in the same batch - dropping most transcript
  // text and sometimes the function-call event itself. Track the last
  // event actually processed and walk every event newer than it, oldest
  // to newest, so nothing in a burst gets shadowed.
  const lastSeenIdRef = useRef(null);

  useEffect(() => {
    if (!events || events.length === 0) return;

    const lastSeenId = lastSeenIdRef.current;
    let boundary = events.length;
    if (lastSeenId != null) {
      const idx = events.findIndex((e) => e.event_id === lastSeenId);
      if (idx !== -1) boundary = idx;
    }
    lastSeenIdRef.current = events[0].event_id ?? lastSeenIdRef.current;

    for (let i = boundary - 1; i >= 0; i--) {
      const event = events[i];

      if (!toolRegistered && event.type === "session.created") {
        sendClientEvent(sessionUpdate);
        setToolRegistered(true);
      }

      if (event.type === "response.created") {
        transcriptRef.current = "";
        gotFunctionCallRef.current = false;
        pendingCallIdRef.current = null;
      }

      if (event.type === "response.output_audio_transcript.delta") {
        transcriptRef.current += event.delta || "";
      }

      // Update the panel the moment the model has decided what to show,
      // rather than waiting for response.done (which only fires once the
      // ENTIRE turn - including the rest of its spoken answer - is over).
      // function_call_arguments.done fires as soon as that one function
      // call's arguments finish streaming in, so the visual appears live
      // while the AI is still talking instead of after a long delay. This
      // fires fresh on every turn (see the session instructions above), so
      // follow-up questions keep the panel synced to the AI's latest answer.
      if (
        event.type === "response.function_call_arguments.done" &&
        event.name === "display_business_info"
      ) {
        try {
          const args = JSON.parse(event.arguments);
          setView({ section: args.section, query: args.query || "" });
          setUpdateCount((c) => c + 1);
          gotFunctionCallRef.current = true;
          pendingCallIdRef.current = event.call_id ?? null;
        } catch {
          // Malformed arguments from the model - just ignore this call.
        }
      }

      if (event.type === "response.done") {
        if (!gotFunctionCallRef.current) {
          // Safety net: the model spoke a full answer but never called the
          // tool. Guess the section from its own transcript so the panel
          // still moves.
          const inferred = inferSectionFromText(transcriptRef.current);
          if (inferred) {
            setView({ section: inferred, query: "" });
            setUpdateCount((c) => c + 1);
          }
          autoContinueAttemptsRef.current = 0;
        } else if (!transcriptRef.current.trim() && pendingCallIdRef.current) {
          // Safety net: the model called the tool (so the panel is already
          // showing the right visual) but stopped without ever speaking -
          // the API is waiting on a function result before the model will
          // continue. Give it a trivial one and ask it to continue so it
          // actually delivers the spoken answer instead of leaving the
          // turn silent. Capped so a model that keeps doing this can't
          // loop forever.
          if (autoContinueAttemptsRef.current < 2) {
            autoContinueAttemptsRef.current += 1;
            sendClientEvent({
              type: "conversation.item.create",
              item: {
                type: "function_call_output",
                call_id: pendingCallIdRef.current,
                output: "Displayed on screen.",
              },
            });
            sendClientEvent({ type: "response.create" });
          }
          pendingCallIdRef.current = null;
        } else {
          autoContinueAttemptsRef.current = 0;
        }
      }
    }
  }, [events]);

  useEffect(() => {
    if (!isSessionActive) {
      setToolRegistered(false);
      setView(null);
    }
  }, [isSessionActive]);

  const Renderer = isSessionActive && view && SECTION_RENDERERS[view.section];
  const accent = view ? SECTION_ACCENT[view.section] : null;

  return (
    <section className="h-full w-full flex flex-col gap-4">
      <div className="business-panel-stage relative h-full rounded-lg p-4 overflow-y-auto">
        {/* Flashes once per fresh answer so it's visible the panel just
            re-synced with what the AI is currently saying. Keyed on
            updateCount so it replays even when section/query repeat. */}
        {accent && (
          <motion.div
            key={updateCount}
            initial={{ opacity: 0.55 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.9, ease: "easeOut" }}
            className="pointer-events-none absolute inset-0 rounded-lg"
            style={{ boxShadow: `inset 0 0 32px 2px ${accent}` }}
          />
        )}
        <AnimatePresence mode="wait">
          {Renderer ? (
            <motion.div
              key={`${view.section}-${view.query}-${updateCount}`}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              <Renderer query={view.query} />
            </motion.div>
          ) : (
            <motion.div
              key="placeholder"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-3"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-md flex items-center justify-center bg-white/[0.06] text-white/50 shrink-0">
                  <MessageCircle size={16} />
                </div>
                <h2 className="text-base font-bold text-[#F0F6FC]">Woyce Business Info</h2>
              </div>
              <p className="text-white/40 text-sm">
                {isSessionActive
                  ? "Ask about the company and a visual will show up here. Try:"
                  : "Start the session to ask about Woyce Technologies..."}
              </p>
              {isSessionActive && (
                <ul className="text-sm text-white/60 flex flex-col gap-1.5">
                  {SUGGESTIONS.map((s) => (
                    <li key={s} className="flex gap-2">
                      <span className="text-white/25">&bull;</span>
                      {s}
                    </li>
                  ))}
                </ul>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
