import { useEffect, useRef, useState } from "react";

export default function App() {
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [events, setEvents] = useState([]);
  const [dataChannel, setDataChannel] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [voiceState, setVoiceState] = useState("idle");
  const [contextStatus, setContextStatus] = useState(null);
  const peerConnection = useRef(null);
  const audioElement = useRef(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!isSessionActive) {
      setVoiceState("idle");
      return;
    }

    const lastEvent = events[0];
    if (!lastEvent) {
      setVoiceState("connected");
      return;
    }

    if (lastEvent.type === "response.audio.delta" || lastEvent.type === "response.audio_transcript.delta") {
      setVoiceState("ai-speaking");
    } else if (lastEvent.type === "input_audio_buffer.speech_started") {
      setVoiceState("user-speaking");
    } else if (lastEvent.type === "input_audio_buffer.speech_stopped" || lastEvent.type === "response.done") {
      setVoiceState("connected");
    }
  }, [events, isSessionActive]);

  async function startSession() {
    console.log("[REFLECT] Starting session...");

    console.log("[REFLECT] Fetching ephemeral token from /token...");
    let tokenResponse;
    try {
      tokenResponse = await fetch("/token");
      console.log("[REFLECT] Token response status:", tokenResponse.status);
    } catch (err) {
      console.error("[REFLECT] Failed to fetch token:", err);
      return;
    }

    const data = await tokenResponse.json();
    console.log("[REFLECT] Token data:", JSON.stringify(data).substring(0, 200));

    if (!data.value) {
      console.error("[REFLECT] No token value in response:", data);
      return;
    }
    const EPHEMERAL_KEY = data.value;
    console.log("[REFLECT] Got ephemeral key:", EPHEMERAL_KEY.substring(0, 15) + "...");

    const configResp = await fetch("/config");
    const config = await configResp.json();
    console.log("[REFLECT] Config:", JSON.stringify(config));

    console.log("[REFLECT] Creating RTCPeerConnection...");
    const pc = new RTCPeerConnection();

    pc.onicecandidate = (e) => {
      console.log("[REFLECT] ICE candidate:", e.candidate ? e.candidate.candidate.substring(0, 50) : "null (gathering done)");
    };
    pc.oniceconnectionstatechange = () => {
      console.log("[REFLECT] ICE connection state:", pc.iceConnectionState);
    };
    pc.onconnectionstatechange = () => {
      console.log("[REFLECT] Connection state:", pc.connectionState);
    };
    pc.onsignalingstatechange = () => {
      console.log("[REFLECT] Signaling state:", pc.signalingState);
    };

    audioElement.current = document.createElement("audio");
    audioElement.current.autoplay = true;
    pc.ontrack = (e) => {
      console.log("[REFLECT] Got remote audio track!", e.streams.length, "streams");
      audioElement.current.srcObject = e.streams[0];
    };

    console.log("[REFLECT] Requesting microphone access...");
    let ms;
    try {
      ms = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log("[REFLECT] Microphone access granted. Tracks:", ms.getTracks().length);
    } catch (err) {
      console.error("[REFLECT] Microphone access denied:", err);
      return;
    }
    pc.addTrack(ms.getTracks()[0]);

    const dc = pc.createDataChannel("oai-events");
    console.log("[REFLECT] Data channel created:", dc.label, "state:", dc.readyState);
    setDataChannel(dc);

    console.log("[REFLECT] Creating SDP offer...");
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    console.log("[REFLECT] Local description set. SDP offer length:", offer.sdp.length);

    const baseUrl = config.baseUrl;
    const model = config.model;
    console.log("[REFLECT] Sending SDP to", baseUrl, "model:", model, "azure:", config.useAzure);

    let sdpResponse;
    try {
      const headers = {
        "Content-Type": "application/sdp",
      };
      if (config.useAzure) {
        headers["Authorization"] = `Bearer ${EPHEMERAL_KEY}`;
      } else {
        headers["Authorization"] = `Bearer ${EPHEMERAL_KEY}`;
      }

      sdpResponse = await fetch(`${baseUrl}?model=${model}`, {
        method: "POST",
        body: offer.sdp,
        headers,
      });
      console.log("[REFLECT] SDP response status:", sdpResponse.status, sdpResponse.statusText);
    } catch (err) {
      console.error("[REFLECT] SDP fetch failed:", err);
      return;
    }

    if (!sdpResponse.ok) {
      const errText = await sdpResponse.text();
      console.error("[REFLECT] SDP error response:", errText.substring(0, 500));
      return;
    }

    const sdp = await sdpResponse.text();
    console.log("[REFLECT] Got SDP answer. Length:", sdp.length);
    const answer = { type: "answer", sdp };
    await pc.setRemoteDescription(answer);
    console.log("[REFLECT] Remote description set. Connection establishing...");

    peerConnection.current = pc;
  }

  function stopSession() {
    console.log("[REFLECT] Stopping session...");
    if (dataChannel) {
      dataChannel.close();
    }

    peerConnection.current.getSenders().forEach((sender) => {
      if (sender.track) {
        sender.track.stop();
      }
    });

    if (peerConnection.current) {
      peerConnection.current.close();
    }

    setIsSessionActive(false);
    setDataChannel(null);
    peerConnection.current = null;
    console.log("[REFLECT] Session stopped.");
  }

  function sendClientEvent(message) {
    if (dataChannel) {
      const timestamp = new Date().toLocaleTimeString();
      message.event_id = message.event_id || crypto.randomUUID();
      console.log("[REFLECT] Sending event:", message.type);

      dataChannel.send(JSON.stringify(message));

      if (!message.timestamp) {
        message.timestamp = timestamp;
      }
      setEvents((prev) => [message, ...prev]);
    } else {
      console.error("[REFLECT] Failed to send message - no data channel available", message);
    }
  }

  function sendTextMessage(message) {
    console.log("[REFLECT] Sending text message:", message.substring(0, 50));
    const event = {
      type: "conversation.item.create",
      item: {
        type: "message",
        role: "user",
        content: [{ type: "input_text", text: message }],
      },
    };
    sendClientEvent(event);
    sendClientEvent({ type: "response.create" });
  }

  useEffect(() => {
    if (dataChannel) {
      dataChannel.addEventListener("message", (e) => {
        const event = JSON.parse(e.data);
        if (!event.timestamp) {
          event.timestamp = new Date().toLocaleTimeString();
        }
        if (event.type === "error") {
          console.error("[REFLECT] Server error event:", JSON.stringify(event).substring(0, 500));
        } else if (event.type === "session.created" || event.type === "session.updated") {
          console.log("[REFLECT] Session event:", event.type, JSON.stringify(event.session || {}).substring(0, 200));
        } else if (event.type === "response.audio.delta") {
        } else {
          console.log("[REFLECT] Server event:", event.type);
        }
        setEvents((prev) => [event, ...prev]);
      });

      dataChannel.addEventListener("open", async () => {
        console.log("[REFLECT] Data channel OPEN! Session is live.");
        setIsSessionActive(true);
        setEvents([]);

        console.log("[REFLECT] Fetching reflection context...");
        setContextStatus("loading");
        try {
          const ctxResp = await fetch("/reflection-context");
          const ctxData = await ctxResp.json();
          const instrLen = ctxData.instructions?.length || 0;
          console.log("[REFLECT] Got reflection context:", instrLen, "chars");

          const hasProfile = ctxData.instructions?.includes("Behavioral Patterns") || false;
          const hasLocation = ctxData.instructions?.includes("GPS") || ctxData.instructions?.includes("location") || false;
          const hasRecordings = !ctxData.instructions?.includes("No voice recordings") || false;

          console.log("[REFLECT] Context check — profile:", hasProfile, "location:", hasLocation, "recordings:", hasRecordings);

          if (ctxData.instructions) {
            const sessionUpdate = {
              type: "session.update",
              session: {
                instructions: ctxData.instructions,
                voice: "ash",
                turn_detection: { type: "server_vad" },
              },
            };
            dataChannel.send(JSON.stringify(sessionUpdate));
            console.log("[REFLECT] ✅ Sent session.update with reflection context + voice=ash + VAD");
            setContextStatus({ chars: instrLen, hasProfile, hasLocation, hasRecordings });
          } else {
            console.warn("[REFLECT] ⚠️ No instructions in context response");
            setContextStatus("empty");
          }
        } catch (e) {
          console.error("[REFLECT] ❌ Failed to load reflection context:", e);
          setContextStatus("error");
        }
      });

      dataChannel.addEventListener("close", () => {
        console.log("[REFLECT] Data channel CLOSED");
      });

      dataChannel.addEventListener("error", (e) => {
        console.error("[REFLECT] Data channel ERROR:", e);
      });
    }
  }, [dataChannel]);

  const timeStr = currentTime.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  const dateStr = currentTime.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const backgroundGradient = (() => {
    switch (voiceState) {
      case "idle":
        return "radial-gradient(ellipse at 50% 50%, #0a0a0f 0%, #0a0a0f 100%)";
      case "connected":
        return "radial-gradient(ellipse at 50% 50%, #0d0b1a 0%, #0a0a0f 100%)";
      case "ai-speaking":
        return "radial-gradient(ellipse at 50% 50%, #1a1408 0%, #0f0e0d 100%)";
      case "user-speaking":
        return "radial-gradient(ellipse at 50% 50%, #0a1218 0%, #0a0a0f 100%)";
      default:
        return "radial-gradient(ellipse at 50% 50%, #0a0a0f 0%, #0a0a0f 100%)";
    }
  })();

  const logMessages = events
    .filter(e => e.type !== "response.audio.delta" && e.type !== "input_audio_buffer.append")
    .slice(0, 15)
    .map(e => {
      const t = e.timestamp || "";
      if (e.type === "session.created") return { t, msg: "Session started", color: "#5ac978" };
      if (e.type === "session.updated") return { t, msg: "Context loaded", color: "#5ac978" };
      if (e.type === "input_audio_buffer.speech_started") return { t, msg: "You started speaking", color: "#8fa8c8" };
      if (e.type === "input_audio_buffer.speech_stopped") return { t, msg: "You stopped speaking", color: "#8fa8c8" };
      if (e.type === "response.audio_transcript.delta") return { t, msg: `AI: "${(e.delta || "").substring(0, 60)}"`, color: "#c9a55a" };
      if (e.type === "response.audio_transcript.done") return { t, msg: `AI said: "${(e.transcript || "").substring(0, 80)}..."`, color: "#c9a55a" };
      if (e.type === "conversation.item.input_audio_transcription.completed") return { t, msg: `You said: "${(e.transcript || "").substring(0, 80)}"`, color: "#e8e4df" };
      if (e.type === "response.done") return { t, msg: "AI finished responding", color: "#5a5550" };
      if (e.type === "response.created") return { t, msg: "AI thinking...", color: "#5a5550" };
      if (e.type === "error") return { t, msg: `Error: ${e.error?.message || "unknown"}`.substring(0, 80), color: "#c95a5a" };
      return null;
    })
    .filter(Boolean);

  return (
    <div style={{
      position: "relative",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      height: "100vh",
      width: "100vw",
      background: backgroundGradient,
      transition: "background 3.5s ease",
      userSelect: "none",
      overflow: "hidden",
    }}>

      {/* Grain texture overlay */}
      <div style={{
        position: "absolute",
        inset: 0,
        opacity: 0.03,
        pointerEvents: "none",
        zIndex: 1,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        backgroundRepeat: "repeat",
        backgroundSize: "256px 256px",
        animation: "grain 8s steps(10) infinite",
      }} />

      {/* Center content */}
      <div style={{
        position: "relative",
        zIndex: 2,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}>
        {voiceState === "idle" && !isSessionActive ? (
          <>
            <div style={{
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontSize: "4rem",
              color: "rgba(255, 255, 255, 0.6)",
              letterSpacing: "-0.03em",
              lineHeight: 1,
            }}>
              {timeStr}
            </div>
            <div style={{
              fontFamily: "-apple-system, sans-serif",
              fontSize: "0.7rem",
              color: "rgba(255, 255, 255, 0.3)",
              marginTop: 14,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              fontVariant: "small-caps",
            }}>
              {dateStr}
            </div>
          </>
        ) : voiceState === "ai-speaking" ? (
          <div style={{
            fontFamily: "-apple-system, sans-serif",
            fontSize: "12px",
            color: "rgba(255, 255, 255, 0.4)",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            fontVariant: "small-caps",
          }}>
            Speaking...
          </div>
        ) : voiceState === "user-speaking" ? (
          <div style={{
            fontFamily: "-apple-system, sans-serif",
            fontSize: "12px",
            color: "rgba(255, 255, 255, 0.4)",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            fontVariant: "small-caps",
          }}>
            Listening...
          </div>
        ) : (
          <div style={{
            fontFamily: "-apple-system, sans-serif",
            fontSize: "20px",
            color: "rgba(255, 255, 255, 0.9)",
          }}>
            {isSessionActive ? "" : ""}
          </div>
        )}
      </div>

      {/* Control pill — bottom center */}
      <div style={{
        position: "absolute",
        bottom: logMessages.length > 0 ? 180 : 60,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 3,
        display: "flex",
        alignItems: "center",
        gap: 16,
        background: "rgba(255, 255, 255, 0.04)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        borderRadius: 999,
        padding: "10px 28px",
        transition: "bottom 0.4s ease",
      }}>
        <div style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: isSessionActive
            ? voiceState === "ai-speaking" ? "#c9a55a"
            : voiceState === "user-speaking" ? "#8fa8c8"
            : "#5ac978"
            : "rgba(255, 255, 255, 0.3)",
          transition: "background 0.6s ease",
          boxShadow: isSessionActive ? `0 0 8px ${
            voiceState === "ai-speaking" ? "rgba(201,165,90,0.5)"
            : voiceState === "user-speaking" ? "rgba(143,168,200,0.5)"
            : "rgba(90,201,120,0.4)"
          }` : "none",
        }} />
        <button
          onClick={isSessionActive ? stopSession : startSession}
          style={{
            background: "none",
            border: "none",
            color: "rgba(255, 255, 255, 0.7)",
            fontFamily: "-apple-system, sans-serif",
            fontSize: "0.8rem",
            fontWeight: 400,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            cursor: "pointer",
            padding: 0,
            transition: "color 0.3s ease",
          }}
          onMouseEnter={(e) => { e.target.style.color = "rgba(255, 255, 255, 0.95)"; }}
          onMouseLeave={(e) => { e.target.style.color = "rgba(255, 255, 255, 0.7)"; }}
        >
          {isSessionActive ? "End" : "Begin"}
        </button>
      </div>

      {/* Context status indicator — top right */}
      {contextStatus && contextStatus !== "loading" && typeof contextStatus === "object" && (
        <div style={{
          position: "absolute",
          top: 20,
          right: 20,
          zIndex: 3,
          fontFamily: "'SF Mono', 'Menlo', monospace",
          fontSize: "0.55rem",
          color: "rgba(255, 255, 255, 0.2)",
          textAlign: "right",
          lineHeight: 1.8,
        }}>
          <div style={{ color: contextStatus.hasProfile ? "rgba(90,201,120,0.5)" : "rgba(201,90,90,0.4)" }}>
            {contextStatus.hasProfile ? "✓" : "✗"} Profile
          </div>
          <div style={{ color: contextStatus.hasLocation ? "rgba(90,143,201,0.5)" : "rgba(255,255,255,0.15)" }}>
            {contextStatus.hasLocation ? "✓" : "–"} Location
          </div>
          <div style={{ color: contextStatus.hasRecordings ? "rgba(201,165,90,0.5)" : "rgba(255,255,255,0.15)" }}>
            {contextStatus.hasRecordings ? "✓" : "–"} Recordings
          </div>
        </div>
      )}
      {contextStatus === "loading" && (
        <div style={{
          position: "absolute", top: 20, right: 20, zIndex: 3,
          fontFamily: "'SF Mono', monospace", fontSize: "0.55rem", color: "rgba(255,255,255,0.2)",
        }}>Loading context...</div>
      )}
      {contextStatus === "error" && (
        <div style={{
          position: "absolute", top: 20, right: 20, zIndex: 3,
          fontFamily: "'SF Mono', monospace", fontSize: "0.55rem", color: "rgba(201,90,90,0.5)",
        }}>✗ Context failed</div>
      )}

      {/* Log box — bottom */}
      {logMessages.length > 0 && (
        <div style={{
          position: "absolute",
          bottom: 20,
          left: 20,
          right: 20,
          maxHeight: 140,
          overflowY: "auto",
          background: "rgba(10, 10, 15, 0.6)",
          border: "none",
          borderRadius: 8,
          padding: "10px 14px",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          zIndex: 3,
        }}>
          {logMessages.map((log, i) => (
            <div key={i} style={{
              fontFamily: "'SF Mono', 'Menlo', monospace",
              fontSize: "0.6rem",
              color: log.color,
              lineHeight: 1.7,
              opacity: i === 0 ? 0.8 : 0.4,
            }}>
              <span style={{ color: "rgba(255,255,255,0.15)", marginRight: 6 }}>{log.t}</span>
              {log.msg}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
