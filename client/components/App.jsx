import { useEffect, useRef, useState, useCallback } from "react";
import logo from "/assets/openai-logomark.svg";
import EventLog from "./EventLog";
import SessionControls from "./SessionControls";
import ToolPanel from "./ToolPanel";

export default function App() {
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [events, setEvents] = useState([]);
  const [dataChannel, setDataChannel] = useState(null);
  const [isPushToTalkEnabled, setIsPushToTalkEnabled] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const peerConnection = useRef(null);
  const audioElement = useRef(null);
  const localStream = useRef(null);
  const spaceKeyTimer = useRef(null);
  const isRecordingRef = useRef(false); // 状態をrefでも管理
  const defaultModel = import.meta.env.VITE_OPENAI_MODEL || "gpt-4o-realtime-preview-2024-12-17";
  const [selectedModel, setSelectedModel] = useState(defaultModel);

  // 録音開始
  const startRecording = useCallback(() => {
    if (!isSessionActive || !dataChannel || isRecordingRef.current) {
      console.log("❌ Cannot start recording:", { isSessionActive, hasDataChannel: !!dataChannel, isRecording: isRecordingRef.current });
      return;
    }
    
    console.log("📢 startRecording called");
    isRecordingRef.current = true;
    setIsRecording(true);
    
    // マイクを有効にする
    toggleMicrophone(true);
    
    // 5秒後に自動的に停止するタイマーを設定（安全装置）
    if (spaceKeyTimer.current) {
      clearTimeout(spaceKeyTimer.current);
    }
    spaceKeyTimer.current = setTimeout(() => {
      console.log("⏰ Timer: Auto-stopping recording after 5 seconds");
      stopRecording();
    }, 5000);
    
    console.log("✅ Recording started");
  }, [isSessionActive, dataChannel]);

  // 録音停止
  const stopRecording = useCallback(() => {
    if (!isRecordingRef.current) {
      console.log("⚠️ stopRecording called but not recording");
      return;
    }
    
    console.log("📢 stopRecording called");
    
    // タイマーをクリア
    if (spaceKeyTimer.current) {
      clearTimeout(spaceKeyTimer.current);
      spaceKeyTimer.current = null;
    }
    
    isRecordingRef.current = false;
    setIsRecording(false);
    
    // マイクを無効にする
    toggleMicrophone(false);
    
    // OpenAI Realtime APIにレスポンス生成を要求
    sendClientEvent({
      type: "response.create"
    });
    
    console.log("🛑 Recording stopped");
  }, []);

  // キーボードイベントの処理
  useEffect(() => {
    if (!isPushToTalkEnabled || !isSessionActive) {
      console.log("🚫 Keyboard events disabled", { isPushToTalkEnabled, isSessionActive });
      return;
    }

    console.log("🎯 Setting up keyboard events");

    const handleKeyDown = (event) => {
      console.log("⌨️ Key down:", event.code, "Repeat:", event.repeat, "Recording:", isRecordingRef.current);
      
      if (event.code === 'Space' && !event.repeat && !isRecordingRef.current) {
        event.preventDefault();
        console.log("🔴 Space DOWN - calling startRecording");
        startRecording();
      }
    };

    const handleKeyUp = (event) => {
      console.log("⌨️ Key up:", event.code, "Recording:", isRecordingRef.current);
      
      if (event.code === 'Space' && isRecordingRef.current) {
        event.preventDefault();
        console.log("🔵 Space UP - calling stopRecording");
        stopRecording();
      }
    };

    // windowとdocumentの両方にイベントリスナーを追加
    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('keyup', handleKeyUp, true);
    document.addEventListener('keydown', handleKeyDown, true);
    document.addEventListener('keyup', handleKeyUp, true);

    return () => {
      console.log("🧹 Cleaning up keyboard events");
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('keyup', handleKeyUp, true);
      document.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('keyup', handleKeyUp, true);
      
      // タイマーもクリア
      if (spaceKeyTimer.current) {
        clearTimeout(spaceKeyTimer.current);
        spaceKeyTimer.current = null;
      }
    };
  }, [isPushToTalkEnabled, isSessionActive, startRecording, stopRecording]);

  // マイクの有効/無効を切り替える
  const toggleMicrophone = (enabled) => {
    if (localStream.current) {
      const audioTrack = localStream.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = enabled;
        console.log(`🎤 Microphone ${enabled ? 'enabled' : 'disabled'}`);
      } else {
        console.log("❌ No audio track found");
      }
    } else {
      console.log("❌ No local stream found");
    }
  };

  // Push-to-Talkモードの切り替え
  const togglePushToTalk = () => {
    const newMode = !isPushToTalkEnabled;
    setIsPushToTalkEnabled(newMode);
    
    console.log("🔄 Push-to-Talk mode:", newMode);
    
    // 録音状態をリセット
    isRecordingRef.current = false;
    setIsRecording(false);
    
    if (spaceKeyTimer.current) {
      clearTimeout(spaceKeyTimer.current);
      spaceKeyTimer.current = null;
    }
    
    if (newMode) {
      // Push-to-Talkモード: デフォルトでマイクを無効にする
      toggleMicrophone(false);
    } else {
      // 常時録音モード: マイクを有効にする
      toggleMicrophone(true);
    }
  };

  async function startSession() {
    console.log("🚀 Starting session...");
    
    // Get a session token for OpenAI Realtime API
    const tokenResponse = await fetch("/token");
    const data = await tokenResponse.json();
    const EPHEMERAL_KEY = data.client_secret.value;

    // Create a peer connection
    const pc = new RTCPeerConnection();

    // Set up to play remote audio from the model
    audioElement.current = document.createElement("audio");
    audioElement.current.autoplay = true;
    pc.ontrack = (e) => (audioElement.current.srcObject = e.streams[0]);

    // Add local audio track for microphone input in the browser
    const ms = await navigator.mediaDevices.getUserMedia({
      audio: true,
    });
    
    localStream.current = ms;
    const audioTrack = ms.getTracks()[0];
    
    console.log("🎤 Audio track created:", audioTrack);
    
    // Push-to-Talkモードが有効な場合、最初はマイクを無効にする
    if (isPushToTalkEnabled) {
      audioTrack.enabled = false;
      console.log("🔇 Initial microphone disabled (Push-to-Talk mode)");
    }
    
    pc.addTrack(audioTrack);

    // Set up data channel for sending and receiving events
    const dc = pc.createDataChannel("oai-events");
    setDataChannel(dc);

    // Start the session using the Session Description Protocol (SDP)
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    const baseUrl = "https://api.openai.com/v1/realtime";
    const sdpResponse = await fetch(`${baseUrl}?model=${selectedModel}`, {
      method: "POST",
      body: offer.sdp,
      headers: {
        Authorization: `Bearer ${EPHEMERAL_KEY}`,
        "Content-Type": "application/sdp",
      },
    });

    const answer = {
      type: "answer",
      sdp: await sdpResponse.text(),
    };
    await pc.setRemoteDescription(answer);

    peerConnection.current = pc;
  }

  // Stop current session, clean up peer connection and data channel
  function stopSession() {
    console.log("🛑 Stopping session...");
    
    // タイマーをクリア
    if (spaceKeyTimer.current) {
      clearTimeout(spaceKeyTimer.current);
      spaceKeyTimer.current = null;
    }
    
    // 録音状態をリセット
    isRecordingRef.current = false;
    setIsRecording(false);
    
    if (dataChannel) {
      dataChannel.close();
    }

    if (localStream.current) {
      localStream.current.getTracks().forEach(track => track.stop());
      localStream.current = null;
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
  }

  // Send a message to the model
  function sendClientEvent(message) {
    if (dataChannel) {
      const timestamp = new Date().toLocaleTimeString();
      message.event_id = message.event_id || crypto.randomUUID();

      // send event before setting timestamp since the backend peer doesn't expect this field
      dataChannel.send(JSON.stringify(message));
      console.log("📤 Sent event:", message.type);

      // if guard just in case the timestamp exists by miracle
      if (!message.timestamp) {
        message.timestamp = timestamp;
      }
      setEvents((prev) => [message, ...prev]);
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

        setEvents((prev) => [event, ...prev]);
      });

      // Set session active when the data channel is opened
      dataChannel.addEventListener("open", () => {
        console.log("🔗 Data channel opened");
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
          
          {/* Push-to-Talk制御パネル */}
          <div className="ml-auto flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={isPushToTalkEnabled}
                onChange={togglePushToTalk}
                disabled={isSessionActive}
              />
              <span className="text-sm">Push-to-Talk モード</span>
            </label>
            
            {isPushToTalkEnabled && (
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${isRecording ? 'bg-red-500' : 'bg-gray-300'}`}></div>
                <span className="text-sm">
                  {isRecording ? '録音中（5秒で自動停止）' : 'スペースキーを押して話す'}
                </span>
              </div>
            )}
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
              isPushToTalkEnabled={isPushToTalkEnabled}
              isRecording={isRecording}
              startRecording={startRecording}
              stopRecording={stopRecording}
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