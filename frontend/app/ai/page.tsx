import React from "react";
import { TranscriptProvider } from "@/app/components/Realtime/contexts/TranscriptContext";
import { EventProvider } from "@/app/components/Realtime/contexts/EventContext";
import App from "@/app/components/Realtime/App";

export default function Page() {
  return (
    <TranscriptProvider>
      <EventProvider>
        <App />
      </EventProvider>
    </TranscriptProvider>
  );
}
