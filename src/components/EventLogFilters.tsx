import Select from "react-select";

export function EventLogFilters({
  eventDirection,
  setEventDirection,
  allowedEvents,
  setAllowedEvents,
  hasEvents,
}) {
  const eventDirectionDropdown = [
    { value: "all", label: "All" },
    { value: "client", label: "Client" },
    { value: "server", label: "Server" },
  ];

  const selectedDirection = eventDirectionDropdown.find(
    (opt) => opt.value === eventDirection
  );

  return (
    <div className="flex gap-2">
      <Select
        className="w-96"
        onChange={setEventDirection}
        isDisabled={!hasEvents}
        value={selectedDirection}
        name="color"
        options={eventDirectionDropdown}
      />

      <Select
        className="w-96"
        isMulti
        value={allowedEvents.filter((event) => event.isSelected)}
        isDisabled={!hasEvents}
        name="color"
        options={allowedEvents}
        onChange={setAllowedEvents}
      />
    </div>
  );
}
