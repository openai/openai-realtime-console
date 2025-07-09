export const OPENAI_CONFIG = {
  baseUrl: 'https://api.openai.com/v1/realtime',
  model: 'gpt-4o-realtime-preview-2024-12-17',
  dataChannelName: 'oai-events',
};

export const AUDIO_CONFIG = {
  playsInSilentModeIOS: true,
  staysActiveInBackground: true,
  shouldDuckAndroid: true,
  playThroughEarpieceAndroid: false,
  allowsRecordingIOS: true,
  interruptionModeIOS: 1, // InterruptionModeIOS.DoNotMix
  interruptionModeAndroid: 1, // InterruptionModeAndroid.DoNotMix
};

export const SESSION_CONFIG = {
  modalities: ['text', 'audio'],
  instructions: 'You are a helpful assistant. You have access to tools that allow you to check the device battery level, change the display brightness, and flash the screen. Use these tools when the user asks about them.',
  tool_choice: 'auto',
  temperature: 0.8,
  voice: 'alloy',
};