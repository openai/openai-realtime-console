import { ArrowUp, ArrowDown, ChevronUp, ChevronDown } from "react-feather";
import { useEffect, useState } from "react";
import { EventLogFilters } from "./EventLogFilters";
import Select from "react-select";

function Event({ event, timestamp }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const isClient = event.event_id && event.event_id.startsWith("evt_");

  return (
    <div className="flex flex-col gap-2 p-2 rounded-md bg-gray-50">
      <div
        className="flex items-center gap-2 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isClient ? (
          <ArrowDown className="text-blue-400" />
        ) : (
          <ArrowUp className="text-green-400" />
        )}
        <div className="text-sm text-gray-500 flex-1">
          {isClient ? "client:" : "server:"}
          &nbsp;{event.event} | {timestamp}
        </div>
        {isExpanded ? (
          <ChevronUp className="text-gray-400 h-4 w-4" />
        ) : (
          <ChevronDown className="text-gray-400 h-4 w-4" />
        )}
      </div>
      <div
        className={`text-gray-500 bg-gray-200 p-2 rounded-md overflow-x-auto ${
          isExpanded ? "block" : "hidden"
        }`}
      >
        <pre className="text-xs whitespace-pre-wrap break-words">
          {JSON.stringify(event, null, 2)}
        </pre>
      </div>
    </div>
  );
}

export default function EventLog({ events }) {
  const [eventDirectionFilter, setEventDirectionFilter] = useState("all");
  const [allowedEvents, setAllowedEvents] = useState([]);
  const [allEventTypes, setAllEventTypes] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);

  useEffect(() => {
    let allEventTypes = new Set();

    events.forEach(({ event }) => {
      allEventTypes.add(event);
    });

    setAllEventTypes(Array.from(allEventTypes));
  }, [events]);

  useEffect(() => {
    console.log(allEventTypes);

    setAllowedEvents((prev) => {
      let newAllowedEvents = [...prev];

      allEventTypes.forEach((event) => {
        if (!prev.some(({ value }) => value === event)) {
          newAllowedEvents.push({
            value: event,
            label: event,
            isSelected: true,
          });
        }
      });

      return newAllowedEvents;
    });
  }, [allEventTypes]);

  useEffect(() => {
    const selectedEventTypes = allowedEvents
      .filter((event) => event.isSelected)
      .map((event) => event.value);

    const filtered = events.filter(({ event_id, event }) => {
      const isClientEvent = event_id && event_id.startsWith("evt_");

      // Direction filtering
      if (isClientEvent && eventDirectionFilter === "server") return false;
      if (!isClientEvent && eventDirectionFilter === "client") return false;

      // Event type filtering
      return selectedEventTypes.includes(event);
    });

    setFilteredEvents(filtered);
  }, [events, eventDirectionFilter, allowedEvents]);

  let changeDirectionFilter = (option) => {
    setEventDirectionFilter(option.value);
  };

  let changeAllowedEvents = (options) => {
    console.log(options);
    setAllowedEvents((prev) => {
      let allowedEvents = [...prev];

      allowedEvents.forEach((event) => {
        event.isSelected = options.some(
          (option) => option.value === event.value
        );
      });

      return allowedEvents;
    });
  };

  return (
    <div className="flex flex-col gap-4 h-full overflow-hidden">
      <EventLogFilters
        eventDirection={eventDirectionFilter}
        setEventDirection={changeDirectionFilter}
        hasEvents={events.length > 0}
        allowedEvents={allowedEvents}
        setAllowedEvents={changeAllowedEvents}
      />
      <div className="flex flex-col gap-2 overflow-y-auto">
        {filteredEvents.length === 0 ? (
          <div className="text-gray-500">Awaiting events...</div>
        ) : (
          filteredEvents.map((event, index) => (
            <Event
              key={`${event.event_id || event.type}-${index}`}
              event={event}
              timestamp={new Date(event.timestamp).toLocaleTimeString()}
            />
          ))
        )}
      </div>
    </div>
  );
}
