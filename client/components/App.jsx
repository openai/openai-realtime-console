// client/components/App.jsx
import { useEffect, useRef, useState } from "react";
import logo from "/assets/openai-logomark.svg";
import EventLog from "./EventLog";
import SessionControls from "./SessionControls";
import ToolPanel from "./ToolPanel";
import { computeCostFromUsage } from "./billingFromUsage";
import BillingSummary from "./BillingSummary";

export default function App() {
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [events, setEvents] = useState([]);
  const [dataChannel, setDataChannel] = useState(null);
  const peerConnection = useRef(null);
  const audioElement = useRef(null);

  // Billing
  const [totalBilling, setTotalBilling] = useState(0);
  const [totalBreakdown, setTotalBreakdown] = useState({
    costInText: 0,
    costInAudio: 0,
    costCached: 0,
    costOutText: 0,
    costOutAudio: 0,
  });
  const billedEventIdsRef = useRef(new Set());

  // --- Helper: recalc billing ---
  function recalcBilling(allEvents) {
    const sorted = allEvents
      .filter(ev => ev.billing)
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    let total = 0;
    const breakdown = {
      costInText: 0,
      costInAudio: 0,
      costCached: 0,
      costOutText: 0,
      costOutAudio: 0,
    };

    sorted.forEach(ev => {
      const b = ev.billing.breakdown;
      total += ev.billing.total;
      breakdown.costInText += b.costInText;
      breakdown.costInAudio += b.costInAudio;
      breakdown.costCached += b.costCached;
      breakdown.costOutText += b.costOutText;
      breakdown.costOutAudio += b.costOutAudio;
    });

    return { totalBilling: total, totalBreakdown: breakdown };
  }

  async function startSession() {
    const tokenResponse = await fetch("/token");
    const data = await tokenResponse.json();
    const EPHEMERAL_KEY = data.value;

    const pc = new RTCPeerConnection();

    audioElement.current = document.createElement("audio");
    audioElement.current.autoplay = true;
    pc.ontrack = (e) => (audioElement.current.srcObject = e.streams[0]);

    const ms = await navigator.mediaDevices.getUserMedia({ audio: true });
    pc.addTrack(ms.getTracks()[0]);

    const dc = pc.createDataChannel("oai-events");
    setDataChannel(dc);

    pc.ondatachannel = (evt) => {
      const incoming = evt.channel;
      incoming.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          console.log("Incoming dataChannel (server → client):", msg);
        } catch {}
      };
    };

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

    const sdp = await sdpResponse.text();
    await pc.setRemoteDescription({ type: "answer", sdp });

    peerConnection.current = pc;
  }

  function stopSession() {
    dataChannel?.close();
    peerConnection.current?.getSenders().forEach(sender => sender.track?.stop());
    peerConnection.current?.close();

    setIsSessionActive(false);
    setDataChannel(null);
    peerConnection.current = null;

    setTotalBilling(0);
    setTotalBreakdown({
      costInText: 0,
      costInAudio: 0,
      costCached: 0,
      costOutText: 0,
      costOutAudio: 0,
    });
    billedEventIdsRef.current.clear();
  }

  function sendClientEvent(message) {
    if (dataChannel) {
      const timestamp = new Date().toISOString();
      message.event_id = message.event_id || crypto.randomUUID();
      message.timestamp = message.timestamp || timestamp;
      dataChannel.send(JSON.stringify(message));
      setEvents((prev) => [message, ...prev]);
    }
  }

  function sendTextMessage(message) {
    const event = {
      type: "conversation.item.create",
      item: { type: "message", role: "user", content: [{ type: "input_text", text: message }] },
    };
    sendClientEvent(event);
    sendClientEvent({ type: "response.create" });
  }

  useEffect(() => {
    if (!dataChannel) return;

    const onMessage = (e) => {
      let event;
      try { event = JSON.parse(e.data); } 
      catch { return; }

      // If the billing is already computed
      if ((event.type === "response.done" || event.type === "response.completed") && event.response?.usage) {
        const eventId = event.event_id || event.response?.id;

        if (!billedEventIdsRef.current.has(eventId)) {
          const cost = computeCostFromUsage(event.response.usage);
          event.billing = cost;
          billedEventIdsRef.current.add(eventId);
        }

        // Recalculation by chronology
        const { totalBilling, totalBreakdown } = recalcBilling([event, ...events]);
        setTotalBilling(totalBilling);
        setTotalBreakdown(totalBreakdown);
      }

      if (!event.timestamp) event.timestamp = new Date().toISOString();
      setEvents((prev) => [event, ...prev]);
    };

    const onOpen = () => {
      setIsSessionActive(true);
      setEvents([]);
      setTotalBilling(0);
      setTotalBreakdown({
        costInText: 0,
        costInAudio: 0,
        costCached: 0,
        costOutText: 0,
        costOutAudio: 0,
      });
      billedEventIdsRef.current.clear();
    };

    dataChannel.addEventListener("message", onMessage);
    dataChannel.addEventListener("open", onOpen);
    return () => {
      dataChannel.removeEventListener("message", onMessage);
      dataChannel.removeEventListener("open", onOpen);
    };
  }, [dataChannel, events]);

  return (
    <>
      <nav className="absolute top-0 left-0 right-0 h-16 flex items-center">
        <div className="flex items-center gap-4 w-full m-4 pb-2 border-0 border-b border-solid border-gray-200">
          <img style={{ width: "24px" }} src={logo} />
          <h1>realtime console</h1>
          <div className="ml-auto text-sm text-gray-600">
            Session cost: <span className="font-semibold">${totalBilling.toFixed(6)}</span>
          </div>
        </div>
      </nav>
      <main className="absolute top-16 left-0 right-0 bottom-0">
        <section className="absolute top-0 left-0 right-[380px] bottom-0 flex">
          <section className="absolute top-0 left-0 right-0 bottom-32 px-4 overflow-y-auto">
            <EventLog events={events} />
          </section>
          <section className="absolute h-32 left-0 right-0 bottom-0 p-4">
            <SessionControls
              startSession={startSession}
              stopSession={stopSession}
              sendClientEvent={sendClientEvent}
              sendTextMessage={sendTextMessage}
              events={events}
              isSessionActive={isSessionActive}
            />
          </section>
        </section>
        <section className="absolute top-0 w-[380px] right-0 bottom-0 p-4 pt-0 overflow-y-auto">
          <ToolPanel
            sendClientEvent={sendClientEvent}
            sendTextMessage={sendTextMessage}
            events={events}
            isSessionActive={isSessionActive}
          />
        </section>
      </main>
    </>
  );
}


