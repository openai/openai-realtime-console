// client/components/EventLog.jsx
import { ArrowUp, ArrowDown } from "react-feather";
import { useState, useMemo } from "react";

// Single Event Component
function Event({ event, timestamp, accumulated }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isClient = event.event_id && !event.event_id.startsWith("event_");

  return (
    <div className="flex flex-col gap-2 p-2 rounded-md bg-gray-50 border border-gray-200">
      <div
        className="flex items-center gap-2 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isClient ? (
          <ArrowDown className="text-blue-400" />
        ) : (
          <ArrowUp className="text-green-400" />
        )}
        <div className="text-sm text-gray-500">
          {isClient ? "client:" : "server:"} {event.type} | {timestamp}
        </div>
        {event.billing && (
          <div className="ml-auto flex gap-2">
            <div className="text-xs bg-white border px-2 py-1 rounded">
              Billing: ${event.billing.total.toFixed(6)}
            </div>
            <div className="text-xs bg-white border px-2 py-1 rounded">
              Accumulated: ${accumulated.toFixed(6)}
            </div>
          </div>
        )}
      </div>

      {isExpanded && (
        <div className="text-gray-500 bg-gray-200 p-2 rounded-md overflow-x-auto">
          <pre className="text-xs">{JSON.stringify(event, null, 2)}</pre>

          {event.billing && (
            <div className="mt-2 text-sm bg-white p-2 rounded border">
              <div className="font-semibold">
                Request cost: ${event.billing.total.toFixed(6)} <br />
                Accumulated: ${accumulated.toFixed(6)}
              </div>
              <div className="mt-1 text-xs">
                <div>Breakdown</div>
                <div>in_text: ${event.billing.breakdown.costInText.toFixed(6)}</div>
                <div>in_audio: ${event.billing.breakdown.costInAudio.toFixed(6)}</div>
                <div>cached: ${event.billing.breakdown.costCached.toFixed(6)}</div>
                <div>out_text: ${event.billing.breakdown.costOutText.toFixed(6)}</div>
                <div>out_audio: ${event.billing.breakdown.costOutAudio.toFixed(6)}</div>
              </div>
              <pre className="text-xs mt-2">
                {JSON.stringify(event.billing.tokens, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// The main component of event logs
export default function EventLog({ events }) {
  // Sort events **by chronology**
  const sortedEvents = useMemo(() => {
    return [...events]
      .filter(ev => ev.billing || ev.type === "session.created")
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  }, [events]);

  // Accumulated amount
  let runningTotal = 0;

  const eventsToDisplay = sortedEvents.map(event => {
    if (event.billing) runningTotal += event.billing.total ?? 0;
    return (
      <Event
        key={event.event_id || Math.random()}
        event={event}
        timestamp={event.timestamp}
        accumulated={runningTotal}
      />
    );
  });

  return (
    <div className="flex flex-col gap-2 overflow-x-auto">
      {eventsToDisplay.length === 0 ? (
        <div className="text-gray-500">Awaiting events...</div>
      ) : (
        eventsToDisplay
      )}
    </div>
  );
}



