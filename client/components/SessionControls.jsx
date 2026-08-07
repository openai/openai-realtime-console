import { useState } from "react";
import { CloudLightning, CloudOff, MessageSquare } from "react-feather";
import Button from "./Button";

function SessionStopped({ startSession }) {
  const [isActivating, setIsActivating] = useState(false);
  const [error, setError] = useState(null);

  async function handleStartSession() {
    if (isActivating) return;

    setIsActivating(true);
    setError(null);
    try {
      await startSession();
    } catch (err) {
      // Without this the button was left stuck on "starting session..."
      // forever on any failure (mic permission denied, network error, the
      // Realtime API rejecting the connection) with no way to retry short
      // of reloading the page.
      console.error("Failed to start session:", err);
      setError(err?.message || "Failed to start session - please try again.");
    } finally {
      setIsActivating(false);
    }
  }

  return (
    <div className="flex flex-col items-center justify-center w-full h-full gap-2">
      <Button
        onClick={handleStartSession}
        disabled={isActivating}
        className={
          isActivating
            ? "bg-white/[0.06] border-white/10 text-white/50"
            : "bg-[#7EE787]/10 border-[#7EE787]/30 text-[#7EE787] hover:bg-[#7EE787]/15"
        }
        icon={<CloudLightning height={16} />}
      >
        {isActivating ? "starting session..." : "start session"}
      </Button>
      {error && <p className="text-[#FF7B72] text-sm">{error}</p>}
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
        className="border border-white/10 bg-white/[0.04] backdrop-blur-sm text-[#F0F6FC] placeholder:text-white/30 rounded-full p-4 flex-1 outline-none focus:border-[#79C0FF]/40 disabled:opacity-50 disabled:cursor-not-allowed"
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
        className="bg-[#79C0FF]/10 border-[#79C0FF]/30 text-[#79C0FF] hover:bg-[#79C0FF]/15"
        disabled={isResponding}
      >
        send text
      </Button>
      <Button
        onClick={stopSession}
        icon={<CloudOff height={16} />}
        className="bg-[#FF7B72]/10 border-[#FF7B72]/30 text-[#FF7B72] hover:bg-[#FF7B72]/15"
      >
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
    <div className="flex gap-4 border-t border-white/[0.06] h-full rounded-md">
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
