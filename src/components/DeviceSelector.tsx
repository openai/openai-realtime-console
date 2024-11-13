interface DeviceSelectorProps {
    devices: Array<MediaDeviceInfo & { default: boolean }>;
    selectedDeviceId: string;
    onDeviceSelect: (deviceId: string) => void;
    disabled?: boolean;
  }
  
  export const DeviceSelector: React.FC<DeviceSelectorProps> = ({
    devices,
    selectedDeviceId,
    onDeviceSelect,
    disabled
  }) => {
    if (devices.length === 0) {
      return (
        <select
          disabled={true}
          className="px-3 py-2 bg-white rounded-lg shadow-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        >
          <option>No microphones found</option>
        </select>
      );
    }

    return (
      <select
        value={selectedDeviceId}
        onChange={(e) => onDeviceSelect(e.target.value)}
        disabled={disabled}
        className="px-3 py-2 bg-white rounded-lg shadow-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
      >
        {devices.map((device) => (
          <option key={device.deviceId} value={device.deviceId}>
            {device.label || `Microphone ${device.deviceId}`}
            {device.default ? ' (Default)' : ''}
          </option>
        ))}
      </select>
    );
  };