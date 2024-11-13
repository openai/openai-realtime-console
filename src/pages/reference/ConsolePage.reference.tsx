import React, { useEffect, useRef, useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Speaker, X, ChevronDown, ChevronUp, Star, Zap } from 'lucide-react';
import { RealtimeClient } from '@openai/realtime-api-beta';
import { ItemType } from '@openai/realtime-api-beta/dist/lib/client.js';
import { WavRecorder, WavStreamPlayer } from '../../lib/wavtools/index.js';
import { instructions } from '../../utils/conversation_config.js';
import { Character } from '../../components/character/Character';

interface DeviceSelectorProps {
  devices: Array<MediaDeviceInfo & { default: boolean }>;
  selectedDeviceId: string;
  onDeviceSelect: (deviceId: string) => void;
  disabled?: boolean;
  isLoading?: boolean;
}

const DeviceSelector: React.FC<DeviceSelectorProps> = ({
  devices,
  selectedDeviceId,
  onDeviceSelect,
  disabled,
  isLoading
}) => {
  if (isLoading) {
    return (
      <select
        disabled={true}
        className="px-3 py-2 bg-white rounded-lg shadow-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
      >
        <option>Loading microphones...</option>
      </select>
    );
  }

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

export default function ConsolePage() {
  const [isConnected, setIsConnected] = useState(false);
  const [isVADMode, setIsVADMode] = useState(false);
  const [micStatus, setMicStatus] = useState<'inactive' | 'listening' | 'processing'>('inactive');
  const [currentMessage, setCurrentMessage] = useState<string>('');
  const [items, setItems] = useState<ItemType[]>([]);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [audioDevices, setAudioDevices] = useState<Array<MediaDeviceInfo & { default: boolean }>>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [isLoadingDevices, setIsLoadingDevices] = useState(false);
  const [apiKey, setApiKey] = useState<string>(
    localStorage.getItem('tmp::voice_api_key') || ''
  );
  const [currentResponse, setCurrentResponse] = useState<string>('');

  const LOCAL_RELAY_SERVER_URL = process.env.REACT_APP_LOCAL_RELAY_SERVER_URL || '';

  const handleApiKeySubmit = (key: string) => {
    if (key) {
      localStorage.setItem('tmp::voice_api_key', key);
      setApiKey(key);
    }
  };

  useEffect(() => {
    const storedKey = localStorage.getItem('tmp::voice_api_key');
    if (!storedKey) {
      const key = prompt('Please enter your OpenAI API Key:');
      if (key) {
        handleApiKeySubmit(key);
      }
    }
  }, []);

  // Create refs for audio context and stream player
  const audioContextRef = useRef<AudioContext>();
  const wavStreamPlayerRef = useRef<WavStreamPlayer>();
  const wavRecorderRef = useRef<WavRecorder>();
  const clientRef = useRef<RealtimeClient>();
  const [isAudioInitialized, setIsAudioInitialized] = useState(false);
  const initializingRef = useRef<boolean>(false);

  const initializeAudio = async () => {
    try {
      // Create AudioContext only if it doesn't exist
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext({ sampleRate: 24000 });
        await audioContextRef.current.resume();
      }

      // Initialize WavStreamPlayer with AudioContext
      wavStreamPlayerRef.current = new WavStreamPlayer({ 
        sampleRate: 24000 
      });

      await wavStreamPlayerRef.current.connect();
      setIsAudioInitialized(true);
    } catch (error) {
      console.error('Failed to initialize audio:', error);
    }
  };

  const handleConnect = async () => {
    if (!apiKey) {
      const key = prompt('Please enter your OpenAI API Key:');
      if (!key) return;
      handleApiKeySubmit(key);
    }

    try {
      if (!isAudioInitialized) {
        await initializeAudio();
      }

      // Initialize client with stored API key
      if (!clientRef.current) {
        clientRef.current = new RealtimeClient({
          apiKey: apiKey,
          dangerouslyAllowAPIKeyInBrowser: true
        });

        // Initialize conversation items
        setItems(clientRef.current.conversation.getItems());

        clientRef.current.on('conversation.updated', async ({ item, delta }: any) => {
          console.log('Conversation update:', { item, delta });

          // Handle audio playback
          if (delta?.audio) {
            setIsAISpeaking(true);
            await wavStreamPlayerRef.current?.add16BitPCM(delta.audio, item.id);
          }

          // Handle assistant messages
          if (item?.role === 'assistant') {
            // Handle streaming transcript from delta
            if (delta?.transcript) {
              setCurrentResponse(prev => prev + delta.transcript);
              console.log('Adding delta transcript:', delta.transcript);
            }
            // Handle streaming transcript from formatted
            else if (item.formatted?.transcript && item.status === 'in_progress') {
              // Only update if the new transcript is longer
              setCurrentResponse(prev => 
                item.formatted.transcript.length > prev.length ? item.formatted.transcript : prev
              );
              console.log('Setting formatted transcript:', item.formatted.transcript);
            }
          }

          // Handle turn end
          if (delta?.turn_end || item.status === 'completed') {
            console.log('Turn ended, final message:', currentResponse);
            // Store the final message
            const finalMessage = currentResponse || item.formatted?.transcript || item.formatted?.text;
            if (finalMessage) {
              setCurrentMessage(finalMessage);
              // Keep the message visible for a moment before clearing
              setTimeout(() => {
                setCurrentResponse('');
                setIsAISpeaking(false);
              }, 1000); // 1 second delay
            }
          }

          // Only clear responses when explicitly starting a new user turn
          if (item?.role === 'user' && delta?.transcript && delta.transcript.trim() !== '') {
            console.log('New user turn, clearing responses');
            setCurrentResponse('');
            setCurrentMessage('');
          }
        });

        // Initialize session settings separately
        await clientRef.current.updateSession({
          instructions: instructions
        });
        
        await clientRef.current.updateSession({
          input_audio_transcription: { model: 'whisper-1' }
        });
        
        await clientRef.current.updateSession({
          turn_detection: null
        });
      }

      // Connect client before initializing audio recording
      await clientRef.current.connect();

      // Initialize WavRecorder after client is connected
      wavRecorderRef.current = new WavRecorder({
        sampleRate: 24000,
      });

      // Request permission and initialize device
      await wavRecorderRef.current.requestPermission();
      await wavRecorderRef.current.begin(selectedDeviceId);

      // Reset states
      setCurrentResponse('');
      setCurrentMessage('');
      setIsAISpeaking(false);
      
      setIsConnected(true);

    } catch (error) {
      console.error('Failed to connect:', error);
      setIsConnected(false);
      if (wavRecorderRef.current?.getStatus() !== 'ended') {
        await wavRecorderRef.current?.end();
      }
    }
  };

  const handleDisconnect = async () => {
    try {
      // End recording first
      if (wavRecorderRef.current?.getStatus() !== 'ended') {
        await wavRecorderRef.current?.end();
      }

      // Reset VAD mode
      if (isVADMode) {
        setIsVADMode(false);
        setMicStatus('inactive');
      }

      // Disconnect client
      if (clientRef.current?.isConnected()) {
        await clientRef.current?.disconnect();
      }

      setIsConnected(false);
    } catch (error) {
      console.error('Failed to disconnect:', error);
      // Force reset states even if there's an error
      setIsConnected(false);
      setIsVADMode(false);
      setMicStatus('inactive');
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      handleDisconnect();
      audioContextRef.current?.close();
    };
  }, []);

  // Handle mic click
  const handleMicClick = async () => {
    if (isVADMode) {
      console.log('Push-to-talk disabled in VAD mode');
      return;
    }

    if (micStatus === 'inactive') {
      try {
        if (!clientRef.current?.isConnected()) {
          throw new Error('Client not connected');
        }

        if (wavRecorderRef.current?.getStatus() !== 'ended') {
          await wavRecorderRef.current?.end();
        }
        
        await wavRecorderRef.current?.begin();
        setMicStatus('listening');
        
        await wavRecorderRef.current?.record((audioData: { mono: Int16Array }) => {
          if (clientRef.current?.isConnected()) {
            clientRef.current?.appendInputAudio(audioData.mono);
          }
        });
      } catch (error) {
        console.error('Failed to start recording:', error);
        setMicStatus('inactive');
      }
    } else {
      setMicStatus('inactive');
      await wavRecorderRef.current?.end();
      clientRef.current?.createResponse();
    }
  };

  const changeTurnEndType = async (isVADMode: boolean) => {
    if (!clientRef.current || !wavRecorderRef.current) return;

    const client = clientRef.current;
    const wavRecorder = wavRecorderRef.current;

    try {
      // First, check if we need to end the current recording
      if (wavRecorder.getStatus() === 'recording') {
        await wavRecorder.end();
      }

      // Update VAD mode state
      setIsVADMode(isVADMode);
      
      if (isVADMode) {
        // Enable VAD mode in client first
        await client.updateSession({
          turn_detection: { type: 'server_vad' }
        });
        
        // Only start recording if client is connected
        if (client.isConnected()) {
          try {
            await wavRecorder.begin(selectedDeviceId);
            setMicStatus('listening');
            
            await wavRecorder.record((data) => {
              if (client.isConnected()) {
                client.appendInputAudio(data.mono);
              }
            });
          } catch (error) {
            console.error('Failed to start recording:', error);
            setMicStatus('inactive');
            setIsVADMode(false);
          }
        }
      } else {
        // Disable VAD mode
        await client.updateSession({
          turn_detection: null
        });
        setMicStatus('inactive');
        // Only try to end if we're recording
        if (wavRecorder.getStatus() === 'recording') {
          await wavRecorder.end();
        }
      }
    } catch (error) {
      console.error('Error changing turn end type:', error);
      setIsVADMode(false);
      setMicStatus('inactive');
      // Only try to end if we're recording
      if (wavRecorder.getStatus() === 'recording') {
        await wavRecorder.end();
      }
    }
  };

  // Update the VAD toggle handler
  const handleVADToggle = async () => {
    await changeTurnEndType(!isVADMode);
  };

  const getAudioDevices = async () => {
    if (initializingRef.current) return;
    initializingRef.current = true;
    setIsLoadingDevices(true);
    
    try {
      // Initialize WavRecorder if not exists
      if (!wavRecorderRef.current) {
        wavRecorderRef.current = new WavRecorder({
          sampleRate: 24000,
        });
      }
      
      // Request permission to see device labels
      await wavRecorderRef.current.requestPermission();
      
      const devices = await wavRecorderRef.current.listDevices();
      setAudioDevices(devices);
      
      // Set default device if none selected
      if (!selectedDeviceId && devices.length > 0) {
        const defaultDevice = devices.find(device => device.default) || devices[0];
        setSelectedDeviceId(defaultDevice.deviceId);
      }
    } catch (error) {
      console.error('Failed to get audio devices:', error);
    } finally {
      setIsLoadingDevices(false);
      initializingRef.current = false;
    }
  };

  useEffect(() => {
    getAudioDevices();
    
    // Listen for device changes
    navigator.mediaDevices.addEventListener('devicechange', getAudioDevices);
    
    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', getAudioDevices);
    };
  }, []);

  const handleDeviceSelect = async (deviceId: string) => {
    try {
      // Store the new device ID
      setSelectedDeviceId(deviceId);
      
      // If we're not connected, just update the ID
      if (!isConnected) return;
      
      // If we're in VAD mode, we need to restart the recording
      if (isVADMode) {
        await changeTurnEndType(false); // Disable VAD first
        await wavRecorderRef.current?.end();
        await wavRecorderRef.current?.begin(deviceId);
        await changeTurnEndType(true); // Re-enable VAD with new device
      } else {
        // For push-to-talk, just end current recording if active
        if (micStatus === 'listening') {
          await wavRecorderRef.current?.end();
          setMicStatus('inactive');
        }
        // Next push-to-talk will use the new device automatically
      }
    } catch (error) {
      console.error('Failed to switch device:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-100 to-pink-100 p-4">
      <div className="max-w-4xl mx-auto flex flex-col items-center justify-center min-h-screen py-8">
        <div className="mb-4 z-50">
          <DeviceSelector
            devices={audioDevices}
            selectedDeviceId={selectedDeviceId}
            onDeviceSelect={handleDeviceSelect}
            disabled={false}
            isLoading={isLoadingDevices}
          />
        </div>
        <Character 
          isListening={micStatus === 'listening'}
          isSpeaking={isAISpeaking}
          isConnected={isConnected}
          message={currentMessage}
          currentResponse={currentResponse}
          onMicClick={handleMicClick}
          isVADMode={isVADMode}
          onVADToggle={handleVADToggle}
          disableMic={isVADMode}
        />
        <button
          onClick={isConnected ? handleDisconnect : handleConnect}
          className={`
            mt-4 px-6 py-3 
            rounded-full
            font-medium
            flex items-center gap-2
            transition-all duration-300
            ${isConnected ? 
              'bg-purple-500 hover:bg-purple-600 text-white animate-pulse-slow' : 
              'bg-white hover:bg-purple-50 text-purple-500 border-2 border-purple-500'
            }
            shadow-lg hover:shadow-xl
            transform hover:scale-105
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
          disabled={false}
        >
          <div className={`
            w-2 h-2 
            rounded-full 
            transition-all duration-300
            ${isConnected ? 'bg-green-400 animate-ping' : 'bg-red-400'}
          `} />
          
          <span className="relative">
            {isConnected ? (
              <span className="flex items-center gap-2">
                Connected
                <X className="w-4 h-4 animate-spin-slow" />
              </span>
            ) : (
              <span className="flex items-center gap-2">
                Connect
                <Zap className="w-4 h-4 animate-bounce-slow" />
              </span>
            )}
          </span>
        </button>
      </div>
    </div>
  );
}