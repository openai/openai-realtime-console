import { useEffect, useRef, useState } from "react";
import logo from "/assets/openai-logomark.svg";
import SiriOrb, { ORB_STATES, useConversationState } from "./SiriOrb";
import SessionControls from "./SessionControls";
import BusinessPanel from "./BusinessPanel";

// Consumers (the orb's conversation-state hook, the business panel) only
// ever look at the newest event or a handful of recent ones - they never
// need the full session history. Keeping the array unbounded meant every
// single streamed token (transcript deltas fire many times a second) did
// an O(n) copy of an ever-growing array for the life of the session, which
// piles up latency exactly where we need the UI to stay live and in sync
// with the audio. Cap it to a rolling window instead.
const MAX_EVENTS = 200;

export default function App() {
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [events, setEvents] = useState([]);
  const [dataChannel, setDataChannel] = useState(null);
  const [micStream, setMicStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const peerConnection = useRef(null);
  const audioElement = useRef(null);

  const orbState = useConversationState(events, isSessionActive);
  // The Realtime API only allows one active response at a time - block
  // sending another message while the AI is still thinking/speaking so a
  // second response.create can't silently collide with the first.
  const isResponding = orbState === ORB_STATES.THINKING || orbState === ORB_STATES.SPEAKING;

  async function startSession() {
    // Tracked in local vars (not state) so a failure partway through can
    // tear down exactly what got created, even before the corresponding
    // setState call has landed.
    let pc;
    let ms;
    try {
      // Get a session token for OpenAI Realtime API
      const tokenResponse = await fetch("/token");
      const data = await tokenResponse.json();
      const EPHEMERAL_KEY = data.value;

      // Create a peer connection
      pc = new RTCPeerConnection();

      // Set up to play remote audio from the model
      audioElement.current = document.createElement("audio");
      audioElement.current.autoplay = true;
      pc.ontrack = (e) => {
        audioElement.current.srcObject = e.streams[0];
        // Expose the same stream to the orb so it can analyze AI audio
        // amplitude without opening a second connection to anything.
        setRemoteStream(e.streams[0]);
      };

      // Add local audio track for microphone input in the browser
      ms = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      pc.addTrack(ms.getTracks()[0]);
      // Expose the same mic stream to the orb — no second getUserMedia call.
      setMicStream(ms);

      // Set up data channel for sending and receiving events
      const dc = pc.createDataChannel("oai-events");
      setDataChannel(dc);

      // Start the session using the Session Description Protocol (SDP)
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const baseUrl = "https://api.openai.com/v1/realtime/calls";
      const model = "gpt-realtime";
      const sdpResponse = await fetch(`${baseUrl}?model=${model}`, {
        method: "POST",
        body: offer.sdp,
        headers: {
          Authorization: `Bearer ${EPHEMERAL_KEY}`,
          "Content-Type": "application/sdp",
        },
      });

      if (!sdpResponse.ok) {
        // A non-2xx response body isn't valid SDP (e.g. a 429 rate-limit
        // returns an error JSON), and setRemoteDescription would otherwise
        // fail with an opaque "Failed to parse SessionDescription" error.
        // Surface the actual status instead.
        throw new Error(
          `Realtime API rejected the connection (${sdpResponse.status})`,
        );
      }

      const sdp = await sdpResponse.text();
      const answer = { type: "answer", sdp };
      await pc.setRemoteDescription(answer);

      peerConnection.current = pc;
    } catch (err) {
      // Tear down whatever partial state this attempt created so a retry
      // starts clean instead of leaking an open mic or a half-set-up
      // connection, and reset any state already exposed to the rest of the
      // app so it doesn't look like a session is active.
      ms?.getTracks().forEach((track) => track.stop());
      pc?.close();
      setMicStream(null);
      setDataChannel(null);
      setRemoteStream(null);
      throw err;
    }
  }

  // Stop current session, clean up peer connection and data channel
  function stopSession() {
    if (dataChannel) {
      dataChannel.close();
    }

    if (peerConnection.current) {
      peerConnection.current.getSenders().forEach((sender) => {
        if (sender.track) {
          sender.track.stop();
        }
      });
      peerConnection.current.close();
    }

    setIsSessionActive(false);
    setDataChannel(null);
    setMicStream(null);
    setRemoteStream(null);
    peerConnection.current = null;
  }

  // Send a message to the model
  function sendClientEvent(message) {
    if (dataChannel) {
      // Never mutate the caller's object - some callers (e.g. BusinessPanel's
      // session.update payload) reuse the same module-level object across
      // every session in a page load. Mutating it in place used to leave a
      // stale `timestamp` field on it after the first send, which the
      // server then rejected as an unknown parameter on every later
      // reconnect - silently breaking session.update (instructions + tools)
      // with no visible error until now.
      const outgoing = { ...message, event_id: message.event_id || crypto.randomUUID() };

      dataChannel.send(JSON.stringify(outgoing));

      setEvents((prev) =>
        [{ ...outgoing, timestamp: new Date().toLocaleTimeString() }, ...prev].slice(0, MAX_EVENTS),
      );
    } else {
      console.error(
        "Failed to send message - no data channel available",
        message,
      );
    }
  }

  // Send a text message to the model
  function sendTextMessage(message) {
    const event = {
      type: "conversation.item.create",
      item: {
        type: "message",
        role: "user",
        content: [
          {
            type: "input_text",
            text: message,
          },
        ],
      },
    };

    sendClientEvent(event);
    sendClientEvent({ type: "response.create" });
  }

  // Attach event listeners to the data channel when a new one is created
  useEffect(() => {
    if (dataChannel) {
      // Append new server events to the list
      dataChannel.addEventListener("message", (e) => {
        const event = JSON.parse(e.data);
        if (!event.timestamp) {
          event.timestamp = new Date().toLocaleTimeString();
        }

        // Surface server-side errors (e.g. a rejected session.update) instead
        // of failing silently - these can otherwise leave the model without
        // its instructions/tools for the rest of the session with no visible
        // sign anything went wrong.
        if (event.type === "error") {
          console.error("Realtime API error:", event.error);
        }

        setEvents((prev) => [event, ...prev].slice(0, MAX_EVENTS));
      });

      // Set session active when the data channel is opened
      dataChannel.addEventListener("open", () => {
        setIsSessionActive(true);
        setEvents([]);
      });
    }
  }, [dataChannel]);

  return (
    <>
      <nav className="absolute top-0 left-0 right-0 h-16 flex items-center">
        <div className="flex items-center gap-4 w-full m-4 pb-2 border-0 border-b border-solid border-gray-200">
          <img style={{ width: "24px" }} src={logo} />
          <h1>realtime console</h1>
        </div>
      </nav>
      <main className="absolute top-16 left-0 right-0 bottom-0">
        <section className="absolute top-0 left-0 right-[380px] bottom-0 flex">
          <section className="absolute top-0 left-0 right-0 bottom-32 px-4 flex items-center justify-center">
            <div className="w-full h-full max-w-[420px] max-h-[420px] aspect-square">
              <SiriOrb
                state={orbState}
                micStream={micStream}
                aiStream={remoteStream}
                theme="default"
                isSessionActive={isSessionActive}
              />
            </div>
          </section>
          <section className="absolute h-32 left-0 right-0 bottom-0 p-4">
            <SessionControls
              startSession={startSession}
              stopSession={stopSession}
              sendClientEvent={sendClientEvent}
              sendTextMessage={sendTextMessage}
              events={events}
              isSessionActive={isSessionActive}
              isResponding={isResponding}
            />
          </section>
        </section>
        <section className="absolute top-0 w-[380px] right-0 bottom-0 p-4 pt-0 overflow-y-auto">
          <BusinessPanel
            sendClientEvent={sendClientEvent}
            events={events}
            isSessionActive={isSessionActive}
          />
        </section>
      </main>
    </>
  );
}
