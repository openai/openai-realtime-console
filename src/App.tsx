import { useEffect, useRef, useState } from "react";
import logo from "./assets/openai-logomark.svg";
import EventLog from "./components/EventLog";
import SessionControls from "./components/SessionControls";
import ToolPanel from "./components/ToolPanel";
import { WavRecorder, WavStreamPlayer } from "./lib/wavtools/index.js";
// import RecordRTC from "recordrtc";

const LOCAL_RELAY_SERVER_URL =
  "wss://brennanphoneapiendpoint.ngrok.io/voice_ai_agent/messenger_media_stream";

function arrayBufferToBase64(arrayBuffer) {
  if (arrayBuffer instanceof Float32Array) {
    arrayBuffer = this.floatTo16BitPCM(arrayBuffer);
  } else if (arrayBuffer instanceof Int16Array) {
    arrayBuffer = arrayBuffer.buffer;
  }
  let binary = "";
  let bytes = new Uint8Array(arrayBuffer);
  const chunkSize = 0x8000; // 32KB chunk size
  for (let i = 0; i < bytes.length; i += chunkSize) {
    let chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, chunk);
  }
  return btoa(binary);
}

export default function App() {
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [events, setEvents] = useState([]);
  const [dataChannel, setDataChannel] = useState(null);
  const peerConnection = useRef(null);
  const audioElement = useRef(null);
  const [webSocket, setWebSocket] = useState(null);

  // const [audioContext, setAudioContext] = useState(null);
  // const [audioQueue, setAudioQueue] = useState([]);
  // const [isPlaying, setIsPlaying] = useState(false);
  // const [lastChunkReceived, setLastChunkReceived] = useState(0);
  // const [processingTimes, setProcessingTimes] = useState([]);

  const wavRecorderRef = useRef(null);
  const wavStreamPlayer = useRef(null);

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

    ws.addEventListener("open", async () => {
      console.log("WebSocket connection opened1");
      ws.send(
        JSON.stringify({
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
        })
      );

      ws.addEventListener("message", async (e) => {
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
      });

      // // Create a MediaSource instance to handle streaming audio
      // const mediaSource = new MediaSource();
      // audioElement.current.src = URL.createObjectURL(mediaSource);

      // // Track our audio source buffers by ID
      // const sourceBuffers = new Map();

      // mediaSource.addEventListener("sourceopen", () => {
      //   // We'll create source buffers as new tracks arrive
      //   ws.onmessage = (event) => {
      //     const data = JSON.parse(event.data);

      //     if (data.media) {
      //       const { id, payload } = data.media;

      //       // Convert base64 to array buffer
      //       const audioData = Uint8Array.from(atob(payload), (c) =>
      //         c.charCodeAt(0),
      //       );

      //       // Create new source buffer for new tracks
      //       if (!sourceBuffers.has(id)) {
      //         const sourceBuffer = mediaSource.addSourceBuffer(
      //           "audio/webm; codecs=opus",
      //         );
      //         sourceBuffers.set(id, sourceBuffer);
      //       }

      //       const sourceBuffer = sourceBuffers.get(id);

      //       // Wait if the buffer is still updating
      //       if (!sourceBuffer.updating) {
      //         sourceBuffer.appendBuffer(audioData);
      //       }
      //     }
      //   };
      // });

      // Handle microphone audio
      // const recorder = new RecordRTC(ms, {
      //   type: "audio",
      //   mimeType: "audio/wav",
      //   recorderType: RecordRTC.StereoAudioRecorder,
      //   numberOfAudioChannels: 1,
      //   desiredSampRate: 24000,
      //   timeSlice: 100, // Record in 100ms chunks
      //   ondataavailable: async (blob) => {
      //     if (ws.readyState === WebSocket.OPEN) {
      //       try {
      //         // Convert blob directly to base64
      //         const reader = new FileReader();
      //         reader.onload = () => {
      //           const base64Audio = reader.result.split(",")[1];
      //           ws.send(
      //             JSON.stringify({
      //               event_id: `evt_${crypto.randomUUID()}`,
      //               event: "media",
      //               media: {
      //                 payload: base64Audio,
      //                 timestamp: Date.now(),
      //               },
      //               audio: base64Audio,
      //             }),
      //           );
      //         };
      //         reader.readAsDataURL(blob);
      //       } catch (error) {
      //         console.error("Error converting audio:", error);
      //       }
      //     }
      //   },
      // });

      // recorder.startRecording();
      // setMediaRecorder(recorder);

      await wavRecorderRef.current.record((data) => {
        if (data.mono.byteLength > 0) {
          ws.send(
            JSON.stringify({
              event_id: `evt_${crypto.randomUUID()}`,
              event: "media",
              media: {
                payload: arrayBufferToBase64(data.mono),
                timestamp: Date.now(),
              },
              audio: arrayBufferToBase64(data.mono),
            })
          );
        }
      }, 4096);

      // setAudioContext(audioContext);

      setIsSessionActive(true);
      setEvents([]);
    });

    ws.addEventListener("error", (e) => {
      console.error("WebSocket error", e);
      setIsSessionActive(false);
      setEvents([]);
    });

    // Store references for cleanup
    setWebSocket(ws);
  }

  // Stop current session, clean up peer connection and data channel
  function stopSession() {
    if (webSocket) {
      webSocket.close();
    }

    if (wavRecorderRef.current) {
      wavRecorderRef.current.end();
    }

    setIsSessionActive(false);
    setDataChannel(null);
  }

  // Send a message to the model
  function sendClientEvent(message) {
    if (webSocket) {
      message.event_id = message.event_id || crypto.randomUUID();
      webSocket.send(JSON.stringify(message));
      setEvents((prev) => [message, ...prev]);
    } else {
      console.error(
        "Failed to send message - no data channel available",
        message
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
    if (webSocket) {
      // Append new server events to the list
      webSocket.onmessage = (e) => {
        setEvents((prev) => [JSON.parse(e.data), ...prev]);
      };

      // Set session active when the data channel is opened
      webSocket.onopen = () => {
        setIsSessionActive(true);
        setEvents([]);
      };
    }
  }, [webSocket]);

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
      // if (mediaRecorder) {
      //   mediaRecorder.stop();
      // }
      if (audioElement.current) {
        console.log("tis me");
        audioElement.current.srcObject = null;
      }
      // if (audioContext) {
      //   audioContext.close();
      // }

      if (wavRecorderRef.current) {
        wavRecorderRef.current.end();
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

  useEffect(() => {
    return () => {
      if (wavStreamPlayer.current) {
        wavStreamPlayer.current.interrupt();
      }
    };
  }, []);

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

        <audio ref={audioElement} autoPlay />
      </main>
    </>
  );
}
