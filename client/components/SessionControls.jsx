import { useState } from "react";
import { CloudLightning, CloudOff, MessageSquare } from "react-feather";
import Button from "./Button";

function SessionStopped({ startSession }) {
  const [isActivating, setIsActivating] = useState(false);

  function handleStartSession() {
    if (isActivating) return;

    setIsActivating(true);
    startSession();
  }

  return (
    <div className="flex items-center justify-center w-full h-full">
      <Button
        onClick={handleStartSession}
        className={isActivating ? "bg-gray-600" : "bg-red-600"}
        icon={<CloudLightning height={16} />}
      >
        {isActivating ? "starting session..." : "start session"}
      </Button>
    </div>
  );
}

function SessionActive({ stopSession, sendTextMessage, isResponding }) {
  const [message, setMessage] = useState("");

  function handleSendClientEvent() {
    sendTextMessage(message);
    setMessage("");
  }

  return (
    <div className="flex items-center justify-center w-full h-full gap-4">
      <input
        onKeyDown={(e) => {
          if (e.key === "Enter" && message.trim() && !isResponding) {
            handleSendClientEvent();
          }
        }}
        type="text"
        placeholder={isResponding ? "waiting for the AI to finish..." : "send a text message..."}
        className="border border-gray-200 rounded-full p-4 flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        disabled={isResponding}
      />
      <Button
        onClick={() => {
          if (message.trim() && !isResponding) {
            handleSendClientEvent();
          }
        }}
        icon={<MessageSquare height={16} />}
        className={`bg-blue-400 ${isResponding ? "opacity-50 cursor-not-allowed" : ""}`}
        disabled={isResponding}
      >
        send text
      </Button>
      <Button onClick={stopSession} icon={<CloudOff height={16} />}>
        disconnect
      </Button>
    </div>
  );
}

export default function SessionControls({
  startSession,
  stopSession,
  sendClientEvent,
  sendTextMessage,
  serverEvents,
  isSessionActive,
  isResponding,
}) {
  return (
    <div className="flex gap-4 border-t-2 border-gray-200 h-full rounded-md">
      {isSessionActive ? (
        <SessionActive
          stopSession={stopSession}
          sendClientEvent={sendClientEvent}
          sendTextMessage={sendTextMessage}
          serverEvents={serverEvents}
          isResponding={isResponding}
        />
      ) : (
        <SessionStopped startSession={startSession} />
      )}
    </div>
  );
}
