import React from 'react';
import { useEffect, useRef, useState, useCallback } from 'react';
import { RealtimeClient } from '@openai/realtime-api-beta';
import { WavRecorder, WavStreamPlayer } from '../../lib/wavtools';
import { words } from '../../data/words';
import './KidsPage.scss';
import { Toggle } from '../../components/toggle/Toggle';

// Get this from your environment variables
const LOCAL_RELAY_SERVER_URL = process.env.REACT_APP_LOCAL_RELAY_SERVER_URL || 'http://localhost:8081';

export function KidsPage() {
  const [isListening, setIsListening] = useState(false);
  const [currentWord, setCurrentWord] = useState(words[0].word);
  const [feedback, setFeedback] = useState('Click the microphone to start!');
  const [isConnected, setIsConnected] = useState(false);
  const [userTranscript, setUserTranscript] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isAudioInitialized, setIsAudioInitialized] = useState(false);
  const [canPushToTalk, setCanPushToTalk] = useState(true);
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  
  // Refs for audio handling
  const wavRecorderRef = useRef<WavRecorder | null>(null);
  const wavPlayerRef = useRef<WavStreamPlayer | null>(null);
  const clientRef = useRef<RealtimeClient | null>(null);

  // Add new function to handle VAD/Manual mode switching
  const changeTurnEndType = async (value: string) => {
    if (!clientRef.current || !wavRecorderRef.current) return;
    
    const client = clientRef.current;
    const wavRecorder = wavRecorderRef.current;
    
    try {
      // First, clean up existing recording session
      if (wavRecorder.getStatus() === 'recording') {
        await wavRecorder.pause();  // Make sure to pause first
      }
      
      try {
        await wavRecorder.end();  // End the current session
      } catch (error) {
        console.log('No active session to end');
      }
      
      // Update client session
      client.updateSession({
        turn_detection: value === 'none' ? null : { type: 'server_vad' },
      });
      
      // Start new recording session if in VAD mode
      if (value === 'server_vad' && client.isConnected()) {
        await wavRecorder.begin();  // Start new session
        
        // Small delay to ensure begin() has completed
        await new Promise(resolve => setTimeout(resolve, 100));
        
        if (wavRecorder.getStatus() !== 'recording') {  // Double check status
          await wavRecorder.record((data) => client.appendInputAudio(data.mono));
        }
      }
      
      setCanPushToTalk(value === 'none');
      setIsListening(value === 'server_vad');  // Update listening state based on mode
    } catch (error) {
      console.error('Error changing turn end type:', error);
      // Reset to a clean state
      setCanPushToTalk(true);
      setIsListening(false);
      
      // Try to cleanup on error
      try {
        if (wavRecorder.getStatus() === 'recording') {
          await wavRecorder.pause();
        }
      } catch (cleanupError) {
        console.error('Error during cleanup:', cleanupError);
      }
    }
  };

  // Initialize WebSocket and audio
  const initializeServices = useCallback(async () => {
    try {
      // Create WebSocket client
      clientRef.current = new RealtimeClient({
        url: LOCAL_RELAY_SERVER_URL
      });

      const client = clientRef.current;
      
      // Add these important session settings
      client.updateSession({ 
        input_audio_transcription: { model: 'whisper-1' },
        turn_detection: { type: 'server_vad' }  // Default to VAD mode
      });

      // Set up client event handlers
      client.on('conversation.updated', async ({ item, delta }: any) => {
        // Get all conversation items to track the full context
        const items = client.conversation.getItems();
        
        if (item.role === 'assistant') {
          // Handle streaming text updates from the assistant
          if (delta?.text) {
            // Append the new text delta to existing response
            setAiResponse(prev => prev + delta.text);
            setFeedback(prev => prev + delta.text);
          } else if (item.formatted?.text) {
            // Handle complete text updates
            setAiResponse(item.formatted.text);
            setFeedback(item.formatted.text);
          }
        } else if (item.role === 'user') {
          // Handle user transcripts
          if (item.formatted?.transcript) {
            setUserTranscript(item.formatted.transcript);
          }
        }
        
        // Handle audio playback
        if (delta?.audio && wavPlayerRef.current) {
          wavPlayerRef.current.add16BitPCM(delta.audio, item.id);
        }
      });

      // Add interruption handler
      client.on('conversation.interrupted', async () => {
        if (wavPlayerRef.current) {
          const trackSampleOffset = await wavPlayerRef.current.interrupt();
          if (trackSampleOffset?.trackId) {
            const { trackId, offset } = trackSampleOffset;
            await client.cancelResponse(trackId, offset);
          }
        }
      });

      // Connect to the server
      await client.connect();
      setIsConnected(true);
      setFeedback('Click the microphone to start!');
    } catch (error) {
      console.error('Initialization error:', error);
      setFeedback('Failed to initialize. Please refresh the page.');
      setIsConnected(false);
    }
  }, []);

  // Handle microphone button click
  const handleMicClick = useCallback(async () => {
    try {
      // Initialize audio on first click
      if (!isAudioInitialized) {
        wavRecorderRef.current = new WavRecorder({ sampleRate: 24000 });
        wavPlayerRef.current = new WavStreamPlayer({ sampleRate: 24000 });
        
        if (wavPlayerRef.current) {
          await wavPlayerRef.current.connect();
        }
        setIsAudioInitialized(true);
      }

      if (!clientRef.current || !wavRecorderRef.current || !wavPlayerRef.current) {
        setFeedback('System not initialized');
        return;
      }

      const client = clientRef.current;
      const wavRecorder = wavRecorderRef.current;

      if (!isListening) {
        // Ensure clean state before starting new recording
        if (wavRecorder.getStatus() === 'recording') {
          await wavRecorder.pause();
        }
        try {
          await wavRecorder.end();
        } catch (error) {
          console.log('No active session to end');
        }

        // Clear previous responses when starting new recording
        setUserTranscript('');
        setAiResponse('');
        setFeedback('Listening... Say the word!');
        
        // Start new recording session
        await wavRecorder.begin();
        await wavRecorder.record((data) => {
          if (client && client.isConnected()) {
            client.appendInputAudio(data.mono);
          }
        });
        
        setIsListening(true);

        // Send context to OpenAI
        client.sendUserMessageContent([
          {
            type: 'input_text',
            text: `You are a friendly and encouraging English tutor...`
          }
        ]);

      } else {
        // Stop recording and create response
        await wavRecorder.pause();
        if (client.isConnected()) {
          client.createResponse();
        }
        setIsListening(false);
        setFeedback('Processing...');
      }
    } catch (error) {
      console.error('Error handling mic click:', error);
      setFeedback('Error with audio system');
      setIsListening(false);
    }
  }, [isListening, currentWord, isAudioInitialized]);

  // Initialize WebSocket on mount
  useEffect(() => {
    initializeServices();

    // Cleanup on unmount
    return () => {
      const cleanup = async () => {
        if (clientRef.current) {
          await clientRef.current.disconnect();
        }
        if (wavRecorderRef.current && isAudioInitialized) {
          try {
            await wavRecorderRef.current.end();
          } catch (error) {
            console.error('Error ending recorder:', error);
          }
        }
        if (wavPlayerRef.current && isAudioInitialized) {
          wavPlayerRef.current.interrupt();
        }
      };
      cleanup().catch(console.error);
    };
  }, [initializeServices]);

  // Add function to get available audio devices
  const getAudioDevices = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = devices.filter(device => device.kind === 'audioinput');
      setAudioDevices(audioInputs);
      
      // Set default device if none selected
      if (!selectedDeviceId && audioInputs.length > 0) {
        setSelectedDeviceId(audioInputs[0].deviceId);
      }
    } catch (error) {
      console.error('Error getting audio devices:', error);
    }
  };

  // Add device selection handler
  const handleDeviceChange = async (deviceId: string) => {
    try {
      setSelectedDeviceId(deviceId);
      
      // Clean up existing recorder
      if (wavRecorderRef.current) {
        if (wavRecorderRef.current.getStatus() === 'recording') {
          await wavRecorderRef.current.pause();
        }
        await wavRecorderRef.current.end();
      }
      
      // Create new recorder with selected device
      wavRecorderRef.current = new WavRecorder({ 
        sampleRate: 24000,
        // deviceId: deviceId 
      });
      
      // Restart recording if in VAD mode
      if (!canPushToTalk && clientRef.current?.isConnected()) {
        await wavRecorderRef.current.begin();
        await wavRecorderRef.current.record((data) => 
          clientRef.current?.appendInputAudio(data.mono)
        );
      }
    } catch (error) {
      console.error('Error changing audio device:', error);
      setFeedback('Error changing audio device');
    }
  };

  // Add useEffect to get devices on mount and handle device changes
  useEffect(() => {
    getAudioDevices();
    
    // Listen for device changes (e.g., plugging in/removing devices)
    navigator.mediaDevices.addEventListener('devicechange', getAudioDevices);
    
    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', getAudioDevices);
    };
  }, []);

  return (
    <div data-component="KidsPage">
      <div className="word-display">
        {currentWord}
      </div>
      
      {/* Add device selector */}
      <div className="audio-controls">
        <select 
          value={selectedDeviceId}
          onChange={(e) => handleDeviceChange(e.target.value)}
          className="device-selector"
        >
          {audioDevices.map(device => (
            <option key={device.deviceId} value={device.deviceId}>
              {device.label || `Microphone ${device.deviceId.slice(0, 5)}...`}
            </option>
          ))}
        </select>
      </div>

      <div className="controls">
        <Toggle
          defaultValue={false}
          labels={['manual', 'vad']}
          values={['none', 'server_vad']}
          onChange={(_, value) => changeTurnEndType(value)}
        />
        
        {/* Only show push-to-talk button in manual mode */}
        {canPushToTalk && (
          <button 
            className={`mic-button ${isListening ? 'listening' : ''}`}
            onMouseDown={handleMicClick}
            onMouseUp={handleMicClick}
            disabled={!isConnected}
          >
            🎤
          </button>
        )}
      </div>
      <div className="feedback-area">
        {feedback}
      </div>
      <div className="transcripts">
        <div className="transcript-box">
          <h3>You said:</h3>
          <p>{userTranscript || '(Waiting for speech...)'}</p>
        </div>
        <div className="transcript-box">
          <h3>AI Response:</h3>
          <p>{aiResponse || '(Waiting for response...)'}</p>
        </div>
      </div>
    </div>
  );
}