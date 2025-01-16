import { useCallback, useEffect, useRef, useState } from "react";
import fin from "./assets/fin.svg";
import EventLog from "./components/EventLog";
import SessionControls from "./components/SessionControls";
import LeftPanel from "./components/LeftPanel.js";
import { WavRecorder, WavStreamPlayer } from "./lib/wavtools/index.js";
import { arrayBufferToBase64 } from "./utils/audio-utils.js";
// import RecordRTC from "recordrtc";

const LOCAL_RELAY_SERVER_URL =
  "wss://brennanphoneapiendpoint.ngrok.io/voice_ai_agent/messenger_media_stream";

export default function App() {
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [events, setEvents] = useState<any[]>([]);
  const [webSocket, setWebSocket] = useState<WebSocket | null>(null);

  const wavRecorderRef = useRef<WavRecorder | null>(null);
  const wavStreamPlayer = useRef<WavStreamPlayer | null>(null);

  async function startSession() {
    wavStreamPlayer.current = new WavStreamPlayer({
      sampleRate: 24000,
      bufferSize: 4096,
      latencyHint: "interactive",
    });
    wavStreamPlayer.current.connect();

    // Create audio context
    // const audioContext = new (window.AudioContext ||
    //   window.webkitAudioContext)();

    wavRecorderRef.current = new WavRecorder({ sampleRate: 24000 });
    // Get microphone access
    // const ms = await navigator.mediaDevices.getUserMedia({
    //   audio: true,
    // });
    // // const audioTrack = ms.getTracks()[0];

    await wavRecorderRef.current.begin();

    const ws = new WebSocket(`${LOCAL_RELAY_SERVER_URL}`);

    // ws.addEventListener("open", async () => {

    // });

    ws.addEventListener("close", (event) => {
      console.log("WebSocket connection closed", event);

      if (event.wasClean) {
        console.log(
          `Connection closed cleanly, code=${event.code}, reason=${event.reason}`
        );
      } else {
        console.log("Connection died");
      }

      stopSession();
    });

    ws.addEventListener("error", (e) => {
      console.error("WebSocket error", e);
      // setEvents([]);
      stopSession();
    });

    // Store references for cleanup
    setWebSocket(ws);
  }

  // Stop current session, clean up peer connection and data channel
  function stopSession() {
    if (!isSessionActive) {
      return;
    }

    if (webSocket) {
      webSocket.close(1000, "Normal closure");
    }

    if (wavRecorderRef.current) {
      wavRecorderRef.current.end();
    }

    if (wavStreamPlayer.current) {
      wavStreamPlayer.current.interrupt();
      // wavStreamPlayer.current.disconnect();
    }

    setIsSessionActive(false);
  }
  // Send a message to the model
  const sendClientEvent = useCallback(
    (message: any) => {
      if (webSocket) {
        message.event_id = message.event_id || crypto.randomUUID();
        webSocket.send(JSON.stringify(message));
        setEvents((prev) => [{ ...message, timestamp: Date.now() }, ...prev]);
      } else {
        console.error(
          "Failed to send message - no websocket available",
          message
        );
      }
    },
    [webSocket]
  );

  // Send a text message to the model
  function sendTextMessage(message: string) {
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
    console.log("webSocket", webSocket);
    if (webSocket) {
      // Append new server events to the list
      webSocket.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data.media?.payload) {
            // Use a more efficient base64 decoder
            const audioData = new Uint8Array(
              atob(data.media.payload)
                .split("")
                .map((c) => c.charCodeAt(0))
            );
            wavStreamPlayer.current.add16BitPCM(audioData.buffer);
          }
        } catch (err) {
          console.error("Error processing message:", err);
        }

        setEvents((prev) => [
          { ...JSON.parse(e.data), timestamp: Date.now() },
          ...prev,
        ]);
      };

      // Set session active when the data channel is opened
      webSocket.onopen = async () => {
        console.log("WebSocket connection opened1");

        setEvents([]);
        sendClientEvent({
          app_id: "",
          event: "start",
          start: {
            streamSid: `stream_${crypto.randomUUID()}`,
            customParameters: {
              app_id: 6,
            },
          },
          // stream_id: RealtimeUtils.generateId('stream_'),
          conversation_id: "",
        });

        await wavRecorderRef.current.record((data) => {
          if (data.mono.byteLength > 0) {
            let audioData = arrayBufferToBase64(data.mono);

            sendClientEvent({
              event_id: `evt_${crypto.randomUUID()}`,
              event: "media",
              media: {
                payload: audioData,
                timestamp: Date.now(),
              },
              audio: audioData,
            });
          }
        }, 4096);

        // setAudioContext(audioContext);

        setIsSessionActive(true);
      };
    }
  }, [webSocket, sendClientEvent]);

  // Attach event listeners to the data channel when a new one is created
  // useEffect(() => {
  //   if (mediaSource) {
  //       }
  // }, [mediaSource]);

  useEffect(() => {
    return () => {
      if (webSocket) {
        webSocket.close();
      }

      if (wavRecorderRef.current) {
        wavRecorderRef.current.end();
      }

      if (wavStreamPlayer.current) {
        wavStreamPlayer.current.interrupt();
        // wavStreamPlayer.current.disconnect();
      }
    };
  }, []);

  // useEffect(() => {
  //   const playNextAudio = async () => {
  //     if (audioQueue.length > 0 && !isPlaying && audioContext) {
  //       setIsPlaying(true);
  //       const audioBuffer = audioQueue[0];

  //       const source = audioContext.createBufferSource();
  //       source.buffer = audioBuffer;
  //       source.connect(audioContext.destination);

  //       source.onended = () => {
  //         setAudioQueue((queue) => queue.slice(1));
  //         setIsPlaying(false);
  //       };

  //       // Use precise timing
  //       const startTime = audioContext.currentTime;
  //       source.start(startTime);
  //     }
  //   };

  //   playNextAudio();
  // }, [audioQueue, isPlaying, audioContext]);

  // Keep the diagnostic logging to monitor performance
  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     if (audioQueue.length > 0) {
  //       console.log(`Buffer status: ${audioQueue.length} chunks queued`);
  //     }
  //   }, 1000);

  //   return () => clearInterval(interval);
  // }, [audioQueue]);

  return (
    <>
      <nav className="w-full h-16 flex items-center">
        <div className="flex items-center gap-4 w-full m-4 pb-2 border-0 border-b border-solid border-gray-200">
          <img style={{ width: "24px" }} src={fin} />
          <h1>Fin Voice Demo</h1>
        </div>
      </nav>
      <main className="flex w-full h-full overflow-hidden">
        <section className="flex w-full flex-col overflow-hidden">
          <section className="h-full px-4 overflow-hidden">
            <EventLog events={events} />
          </section>
          <section className=" h-32 p-4">
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
        <section className=" top-0 w-96 p-4 pt-0 overflow-y-auto">
          <LeftPanel events={events} />
        </section>
      </main>
    </>
  );
}
