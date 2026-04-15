import { useEffect, useRef, useState } from "react";

export default function App() {
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [events, setEvents] = useState([]);
  const [dataChannel, setDataChannel] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [voiceState, setVoiceState] = useState("idle");
  const [contextStatus, setContextStatus] = useState(null);
  const [sleepTimer, setSleepTimer] = useState(null);
  const [sleepRemaining, setSleepRemaining] = useState(null);
  const sleepTimerRef = useRef(null);
  const peerConnection = useRef(null);
  const audioElement = useRef(null);
  const transcriptRef = useRef([]);
  const sessionStartRef = useRef(null);
  const speechRecognitionRef = useRef(null);
  const speechRestartRef = useRef(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const sessionIdRef = useRef(null);

  function getLocalKey() {
    return sessionIdRef.current ? `reflection_${sessionIdRef.current}` : "reflection_session";
  }

  function persistToLocal() {
    if (transcriptRef.current.length === 0 && !sessionStartRef.current) return;
    try {
      console.log("[REFLECT] 💾 Saving to localStorage:", transcriptRef.current.length, "turns, key:", getLocalKey());
      localStorage.setItem(getLocalKey(), JSON.stringify({
        session_id: sessionIdRef.current,
        started_at: sessionStartRef.current?.toISOString(),
        transcript: transcriptRef.current,
      }));
    } catch (e) {
      console.error("[REFLECT] localStorage write failed (quota?):", e.message);
    }
  }

  useEffect(() => {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith("reflection_")) keys.push(k);
    }
    for (const key of keys) {
      try {
        const data = JSON.parse(localStorage.getItem(key));
        if (!data?.transcript?.length) { localStorage.removeItem(key); continue; }
        console.log("[REFLECT] Recovering unsaved session:", data.transcript.length, "turns");
        fetch("/api/sessions/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...data, ended_at: new Date().toISOString() }),
        }).then(async (resp) => {
          if (resp.ok) {
            localStorage.removeItem(key);
            console.log("[REFLECT] Recovered session saved");
          } else {
            console.warn("[REFLECT] Recovery got", resp.status, "— will retry next load");
          }
        }).catch(() => console.warn("[REFLECT] Recovery failed, will retry next load"));
      } catch { localStorage.removeItem(key); }
    }
  }, []);

  useEffect(() => {
    if (!isSessionActive) return;

    const handleBeforeUnload = () => persistToLocal();
    window.addEventListener("beforeunload", handleBeforeUnload);

    const localSave = setInterval(() => persistToLocal(), 10000);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      clearInterval(localSave);
    };
  }, [isSessionActive]);

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

    if (lastEvent.type === "response.audio.delta" || lastEvent.type === "response.output_audio_transcript.delta") {
      setVoiceState("ai-speaking");
    } else if (lastEvent.type === "input_audio_buffer.speech_started") {
      setVoiceState("user-speaking");
    } else if (lastEvent.type === "input_audio_buffer.speech_stopped" || lastEvent.type === "response.done") {
      setVoiceState("connected");
    }
  }, [events, isSessionActive]);

  const isStartingRef = useRef(false);

  function startUserSpeechCapture() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      console.warn("[REFLECT] ⚠️ Web Speech API unavailable — user speech will not be captured");
      return;
    }
    if (speechRecognitionRef.current) return;

    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = "ko-KR";

    recognition.onresult = (ev) => {
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const result = ev.results[i];
        if (!result.isFinal) continue;
        const text = result[0]?.transcript?.trim();
        if (!text) continue;
        console.log("[REFLECT] 📝 User transcript (Web Speech):", text.substring(0, 80));
        transcriptRef.current.push({ role: "user", text, ts: new Date().toISOString() });
      }
    };

    recognition.onerror = (ev) => {
      if (ev.error === "no-speech" || ev.error === "aborted") return;
      console.warn("[REFLECT] Web Speech error:", ev.error);
    };

    recognition.onend = () => {
      if (speechRestartRef.current) {
        try {
          recognition.start();
        } catch (e) {
          console.warn("[REFLECT] Web Speech restart failed:", e.message);
        }
      }
    };

    speechRestartRef.current = true;
    speechRecognitionRef.current = recognition;
    try {
      recognition.start();
      console.log("[REFLECT] ✅ Web Speech API started (lang=ko-KR) for user speech capture");
    } catch (e) {
      console.warn("[REFLECT] Web Speech start failed:", e.message);
    }
  }

  function stopUserSpeechCapture() {
    speechRestartRef.current = false;
    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch (e) {
        // already stopped
      }
      speechRecognitionRef.current = null;
      console.log("[REFLECT] Web Speech API stopped");
    }
  }

  async function startSession() {
    if (isStartingRef.current || isSessionActive) return;
    isStartingRef.current = true;
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
    isStartingRef.current = false;
  }

  async function saveSession() {
    if (!transcriptRef.current.length) return;
    try {
      const resp = await fetch("/api/sessions/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionIdRef.current,
          started_at: sessionStartRef.current?.toISOString(),
          ended_at: new Date().toISOString(),
          transcript: transcriptRef.current,
        }),
      });
      if (!resp.ok) throw new Error(`Server returned ${resp.status}`);
      const data = await resp.json();
      if (data.review?.issues?.length > 0) {
        console.warn("[REFLECT] Session review issues:", data.review.issues);
      }
      localStorage.removeItem(getLocalKey());
      transcriptRef.current = [];
      console.log("[REFLECT] Session saved");
    } catch (e) {
      console.error("[REFLECT] Failed to save session, persisting locally:", e);
      persistToLocal();
    }
  }

  async function stopSession() {
    console.log("[REFLECT] Stopping session...");
    stopUserSpeechCapture();
    await saveSession();

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
      peerConnection.current = null;
    }

    if (window._reflectPersist) {
      window.removeEventListener("beforeunload", window._reflectPersist);
      window._reflectPersist = null;
    }
    setIsSessionActive(false);
    setDataChannel(null);
    console.log("[REFLECT] Session stopped.");
  }

  function startSleepTimer(minutes) {
    if (sleepTimerRef.current) clearInterval(sleepTimerRef.current);
    const endTime = Date.now() + minutes * 60 * 1000;
    setSleepTimer(minutes);
    setSleepRemaining(minutes * 60);

    sleepTimerRef.current = setInterval(() => {
      const remaining = Math.max(0, Math.round((endTime - Date.now()) / 1000));
      setSleepRemaining(remaining);
      if (remaining <= 0) {
        clearInterval(sleepTimerRef.current);
        sleepTimerRef.current = null;
        setSleepTimer(null);
        setSleepRemaining(null);
        if (isSessionActive) stopSession();
        fetch("/api/shutdown", { method: "POST" }).catch(() => {});
      }
    }, 1000);
  }

  function cancelSleepTimer() {
    if (sleepTimerRef.current) clearInterval(sleepTimerRef.current);
    sleepTimerRef.current = null;
    setSleepTimer(null);
    setSleepRemaining(null);
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

  async function handleFunctionCall(callId, name, args) {
    console.log(`[REFLECT] Function call: ${name}`, args);
    let result;
    try {
      if (name === "save_annotation") {
        const resp = await fetch("/api/annotations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(args),
        });
        result = await resp.json();
        if (!resp.ok) result = { error: result.error || `Server returned ${resp.status}` };
      } else if (name === "search_memory") {
        const resp = await fetch(`/api/search-memory?q=${encodeURIComponent(args.query)}`);
        result = await resp.json();
        if (!resp.ok) result = { error: result.error || `Server returned ${resp.status}` };
      } else {
        result = { error: `Unknown function: ${name}` };
      }
    } catch (e) {
      console.error(`[REFLECT] Function ${name} failed:`, e);
      result = { error: e.message };
    }

    if (dataChannel && dataChannel.readyState === "open") {
      const responseEvent = {
        type: "conversation.item.create",
        item: {
          type: "function_call_output",
          call_id: callId,
          output: JSON.stringify(result),
        },
      };
      dataChannel.send(JSON.stringify(responseEvent));
      dataChannel.send(JSON.stringify({ type: "response.create" }));
      console.log(`[REFLECT] Sent function result for ${name}`);
    }
  }

  useEffect(() => {
    if (dataChannel) {
      dataChannel.addEventListener("message", (e) => {
        const event = JSON.parse(e.data);
        if (!event.timestamp) {
          event.timestamp = new Date().toLocaleTimeString();
        }
        if (event.type === "response.function_call_arguments.done") {
          try {
            const args = JSON.parse(event.arguments);
            handleFunctionCall(event.call_id, event.name, args);
          } catch (parseErr) {
            console.error("[REFLECT] Failed to parse function args:", parseErr);
            if (dataChannel?.readyState === "open") {
              dataChannel.send(JSON.stringify({
                type: "conversation.item.create",
                item: { type: "function_call_output", call_id: event.call_id, output: JSON.stringify({ error: "Failed to parse arguments" }) },
              }));
              dataChannel.send(JSON.stringify({ type: "response.create" }));
            }
          }
        } else if (event.type === "error") {
          console.error("[REFLECT] Server error event:", JSON.stringify(event).substring(0, 500));
        } else if (event.type === "session.created" || event.type === "session.updated") {
          console.log("[REFLECT] Session event:", event.type, JSON.stringify(event.session || {}).substring(0, 200));
        } else if (event.type === "response.audio.delta") {
        } else {
          console.log("[REFLECT] Server event:", event.type);
        }
        if (event.type === "conversation.item.input_audio_transcription.completed") {
          console.log("[REFLECT] 📝 User transcript captured:", (event.transcript || "").substring(0, 80));
          transcriptRef.current.push({ role: "user", text: event.transcript, ts: new Date().toISOString() });
        } else if (event.type === "response.output_audio_transcript.done") {
          console.log("[REFLECT] 📝 AI transcript captured:", (event.transcript || "").substring(0, 80));
          transcriptRef.current.push({ role: "assistant", text: event.transcript, ts: new Date().toISOString() });
        } else if (event.type === "response.function_call_arguments.done") {
          console.log("[REFLECT] 📝 Tool call captured:", event.name);
          transcriptRef.current.push({ role: "tool_call", name: event.name, args: event.arguments, ts: new Date().toISOString() });
        }

        setEvents((prev) => [event, ...prev]);
      });

      dataChannel.addEventListener("open", async () => {
        console.log("[REFLECT] Data channel OPEN! Session is live.");
        transcriptRef.current = [];
        sessionStartRef.current = new Date();
        sessionIdRef.current = crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        window._reflectPersist = () => persistToLocal();
        window.addEventListener("beforeunload", window._reflectPersist);
        persistToLocal();
        setIsSessionActive(true);
        setEvents([]);

        startUserSpeechCapture();

        dataChannel.send(JSON.stringify({
          type: "session.update",
          session: {
            type: "realtime",
            turn_detection: { type: "server_vad" },
          },
        }));
        console.log("[REFLECT] ✅ Sent session.update with VAD");

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
                type: "realtime",
                instructions: ctxData.instructions,
              },
            };
            dataChannel.send(JSON.stringify(sessionUpdate));
            console.log("[REFLECT] ✅ Sent session.update with reflection context + voice=ash");
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
      if (e.type === "response.output_audio_transcript.delta") return { t, msg: `AI: "${(e.delta || "").substring(0, 60)}"`, color: "#c9a55a" };
      if (e.type === "response.output_audio_transcript.done") return { t, msg: `AI said: "${(e.transcript || "").substring(0, 80)}..."`, color: "#c9a55a" };
      if (e.type === "conversation.item.input_audio_transcription.completed") return { t, msg: `You said: "${(e.transcript || "").substring(0, 80)}"`, color: "#e8e4df" };
      if (e.type === "response.function_call_arguments.done") return { t, msg: `Tool: ${e.name}`, color: "#a78bfa" };
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

      {/* Sleep timer — top left */}
      <div style={{
        position: "absolute",
        top: 20,
        left: 20,
        zIndex: 4,
        display: "flex",
        alignItems: "center",
        gap: 8,
      }}>
        {sleepRemaining !== null ? (
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 999,
            padding: "6px 14px",
          }}>
            <span style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "0.75rem",
              color: sleepRemaining < 60 ? "#c95a5a" : "rgba(255,255,255,0.5)",
            }}>
              💤 {Math.floor(sleepRemaining / 60)}:{String(sleepRemaining % 60).padStart(2, "0")}
            </span>
            <button onClick={cancelSleepTimer} style={{
              background: "none", border: "none", color: "rgba(255,255,255,0.4)",
              cursor: "pointer", fontSize: "0.7rem", padding: 0,
            }}>✕</button>
          </div>
        ) : (
          <div style={{ display: "flex", gap: 6 }}>
            {[5, 10, 15, 30].map(m => (
              <button key={m} onClick={() => startSleepTimer(m)} style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 999,
                padding: "4px 10px",
                color: "rgba(255,255,255,0.35)",
                fontFamily: "-apple-system, sans-serif",
                fontSize: "0.65rem",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseEnter={e => { e.target.style.color = "rgba(255,255,255,0.7)"; e.target.style.borderColor = "rgba(255,255,255,0.2)"; }}
              onMouseLeave={e => { e.target.style.color = "rgba(255,255,255,0.35)"; e.target.style.borderColor = "rgba(255,255,255,0.08)"; }}
              >💤 {m}m</button>
            ))}
          </div>
        )}
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
