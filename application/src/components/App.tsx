import { useEffect, useRef, useState } from "react";
import * as sdk from "microsoft-cognitiveservices-speech-sdk";
import logo from "../../application/../public/openai-logomark.svg";
import EventLog from "./EventLog";
import SessionControls from "./SessionControls";
import ToolPanel from "./ToolPanel";
import { getToken } from "../app/actions";
import { startRecognize, stopRecognize } from "../utils/speechRecognizer";


export interface BaseEvent {
  type: string;
  event_id?: string;
  item_id?: string;
}
export interface Event extends BaseEvent {
  item?: {
    type: string;
    role: string;
    content: Array<{
      type: string;
      text: string;
    }>;
  };
}

export interface ConversationItemCreatedEvent extends BaseEvent {
  previous_item_id: string;
  item: {
    id: string;
    object: string;
    type: string;
    status: string;
    role: string;
    content: Array<{
      type: string;
      transcript?: string;
      text: string;
    }>;
  };
}

export interface AudioTranscriptEvent extends BaseEvent {
  transcript: string;
}

interface ChatItem {
  item_id: string;
  previous_item_id: string | null;
  role: string;
  transcript?: string;
}

export default function App() {
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [events, setEvents] = useState<BaseEvent[]>([]);
  const [dataChannel, setDataChannel] = useState<RTCDataChannel | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatItem[]>([]);
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const proRecognizer = useRef<sdk.SpeechRecognizer>(null);
  const audioElement = useRef<HTMLAudioElement | null>(null);
  const mediaStream = useRef<MediaStream | null>(null);

  async function startSession() {
    // Get an ephemeral key from the Fastify server
    const data = await getToken();
    const EPHEMERAL_KEY = data.client_secret.value;

    // Create a peer connection
    const pc = new RTCPeerConnection();

    audioElement.current = document.createElement("audio");
    audioElement.current.autoplay = true;
    pc.ontrack = (e) => (audioElement.current ? audioElement.current.srcObject = e.streams[0] : null);

    mediaStream.current = await navigator.mediaDevices.getUserMedia({ audio: true });
    pc.addTrack(mediaStream.current.getTracks()[0]);

    // register OpenAI realtime events
    const dc = pc.createDataChannel("oai-events");
    setDataChannel(dc);

    // Start the session using the Session Description Protocol (SDP)
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    const baseUrl = "https://api.openai.com/v1/realtime";
    const model = "gpt-4o-realtime-preview-2024-12-17";
    const sdpResponse = await fetch(`${baseUrl}?model=${model}`, {
      method: "POST",
      body: offer.sdp,
      headers: {
        Authorization: `Bearer ${EPHEMERAL_KEY}`,
        "Content-Type": "application/sdp",
      },
    });

    const answer: RTCSessionDescriptionInit = {
      type: "answer",
      sdp: await sdpResponse.text(),
    };
    await pc.setRemoteDescription(answer);

    peerConnection.current = pc;
  }

  function stopSession() {
    if (dataChannel) {
      dataChannel.close();
    }
    if (peerConnection.current) {
      peerConnection.current.close();
    }
    if (mediaStream.current) {
      mediaStream.current.getTracks().forEach(track => track.stop());
      mediaStream.current = null;
    }

    setIsSessionActive(false);
    setDataChannel(null);
    peerConnection.current = null;
  }

  // Send a message to the model
  function sendClientEvent(message: Event) {
    if (dataChannel) {
      message.event_id = message.event_id || crypto.randomUUID();
      dataChannel.send(JSON.stringify(message));
      setEvents((prev) => [message, ...prev]);
    } else {
      console.error(
        "Failed to send message - no data channel available",
        message,
      );
    }
  }

  // Send a text message to the model
  function sendTextMessage(message: string) {
    const event: Event = {
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

  function conversationHandler(event: BaseEvent | ConversationItemCreatedEvent) {
    if (event.type === "conversation.item.created") {
        const conversationEvent = event as ConversationItemCreatedEvent;
        setChatHistory(prevHistory => [...prevHistory, { 
            item_id: conversationEvent.item?.id,
            previous_item_id: conversationEvent.previous_item_id,
            role: conversationEvent.item?.role || ''
        }]);
    } else if (
        event.type === "response.audio_transcript.done" ||
        event.type === "conversation.item.input_audio_transcription.completed"
    ) {
        const transcriptEvent = event as AudioTranscriptEvent;
        setChatHistory(prevHistory => prevHistory.map(line => {
            if (line.item_id === event.item_id) {
                return {
                    ...line,
                    transcript: transcriptEvent.transcript
                };
            }
            return line;
        }));
    }
}

  // Attach event listeners to the data channel when a new one is created
  useEffect(() => {
    if (dataChannel) {
      // Append new server events to the list
      dataChannel.addEventListener("message", (e) => {
        const eventData: Event = JSON.parse(e.data)
        setEvents((prev) => [eventData, ...prev]);
        conversationHandler(eventData)
      });

      // Set session active when the data channel is opened
      dataChannel.addEventListener("open", () => {
        setIsSessionActive(true);
        setEvents([]);
        setChatHistory([]);
      });
    }
  }, [dataChannel]);

  const handleStartPronunciation = async (output: any) => {
    if (!mediaStream.current) {
      console.error("No media stream available");
      return;
    }
    const language = JSON.parse(output.arguments).language;
    proRecognizer.current = await startRecognize(mediaStream.current, language);
  };

  const handleStopPronunciation = async () => {
    if (proRecognizer.current) {
      await stopRecognize(proRecognizer.current);
      proRecognizer.current = null;
    }
  };

  return (
    <>
      <nav className="absolute top-0 left-0 right-0 h-16 flex items-center">
        <div className="flex items-center gap-4 w-full m-4 pb-2 border-0 border-b border-solid border-gray-200">
          <img style={{ width: "24px" }} src={logo.src} />
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
              serverEvents={events}
              isSessionActive={isSessionActive}
            />
          </section>
        </section>
        <section className="absolute top-0 w-[380px] right-0 bottom-0 p-4 pt-0 overflow-y-auto">
          <ToolPanel
            onStartPronunciation={handleStartPronunciation}
            onStopPronunciation={handleStopPronunciation}
            sendClientEvent={sendClientEvent}
            events={events}
            isSessionActive={isSessionActive}
          />
        </section>
      </main>
    </>
  );
}
