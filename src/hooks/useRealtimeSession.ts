import { useState, useRef, useEffect, useCallback } from 'react';
import { Audio } from 'expo-av';
import {
  mediaDevices,
  RTCPeerConnection,
  MediaStream,
} from 'react-native-webrtc-web-shim';
import Constants from 'expo-constants';
import { OPENAI_CONFIG, AUDIO_CONFIG, SESSION_CONFIG } from '../constants/config';
import { tools, toolImplementations, ToolImplementations } from '../tools';
import { RealtimeEvent, SessionConfig, FunctionCallEvent, AudioTranscriptEvent, ErrorEvent } from '../types/realtime';

export const useRealtimeSession = () => {
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [events, setEvents] = useState<RealtimeEvent[]>([]);
  const [transcript, setTranscript] = useState('');
  const [dataChannel, setDataChannel] = useState<RTCDataChannel | null>(null);
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const [localMediaStream, setLocalMediaStream] = useState<MediaStream | null>(null);
  const remoteMediaStream = useRef<MediaStream>(new MediaStream());

  const startSession = useCallback(async () => {
    const OPENAI_API_KEY = Constants.expoConfig?.extra?.OPENAI_API_KEY;
    if (!OPENAI_API_KEY) {
      throw new Error('OpenAI API key not found. Please set OPENAI_API_KEY in your app.config.js');
    }

    // Enable audio
    await Audio.setAudioModeAsync(AUDIO_CONFIG);

    // Create peer connection
    const pc = new RTCPeerConnection();
    
    // Set up event listeners
    pc.addEventListener('connectionstatechange', () => {
      console.log('connectionstatechange', pc.connectionState);
    });
    
    pc.addEventListener('track', (event) => {
      if (event.track) {
        remoteMediaStream.current.addTrack(event.track);
      }
    });

    // Add local audio track
    const ms = await mediaDevices.getUserMedia({
      audio: true,
      video: false,
    });
    
    setLocalMediaStream(ms);
    ms.getTracks().forEach(track => {
      pc.addTrack(track, ms);
    });

    // Set up data channel
    const dc = pc.createDataChannel(OPENAI_CONFIG.dataChannelName);
    setDataChannel(dc);

    // Create offer
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    // Connect to OpenAI Realtime API
    const response = await fetch(`${OPENAI_CONFIG.baseUrl}?model=${OPENAI_CONFIG.model}`, {
      method: 'POST',
      body: offer.sdp,
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/sdp',
      },
    });

    const answerSdp = await response.text();
    const answer = {
      type: 'answer' as RTCSdpType,
      sdp: answerSdp,
    };
    
    await pc.setRemoteDescription(answer);
    peerConnection.current = pc;
  }, []);

  const stopSession = useCallback(() => {
    if (dataChannel) {
      dataChannel.close();
    }
    if (peerConnection.current) {
      peerConnection.current.close();
    }
    if (localMediaStream) {
      localMediaStream.getTracks().forEach(track => track.stop());
    }

    setIsSessionActive(false);
    setDataChannel(null);
    peerConnection.current = null;
    setLocalMediaStream(null);
    setTranscript('');
    setEvents([]);
  }, [dataChannel, localMediaStream]);

  const sendEvent = useCallback((event: any) => {
    if (dataChannel && dataChannel.readyState === 'open') {
      dataChannel.send(JSON.stringify(event));
    }
  }, [dataChannel]);

  const handleFunctionCall = useCallback(async (data: FunctionCallEvent) => {
    const functionName = data.name as keyof ToolImplementations;
    const toolImpl = toolImplementations[functionName];
    
    if (toolImpl) {
      console.log(`Calling function ${functionName} with args:`, data.arguments);
      
      try {
        const args = JSON.parse(data.arguments || '{}');
        const result = await toolImpl(args);
        
        // Send function result back
        sendEvent({
          type: 'conversation.item.create',
          item: {
            type: 'function_call_output',
            call_id: data.call_id,
            output: JSON.stringify(result)
          }
        });
        
        // Request response generation
        sendEvent({ type: 'response.create' });
      } catch (error: any) {
        console.error('Error executing function:', error);
        // Send error response
        sendEvent({
          type: 'conversation.item.create',
          item: {
            type: 'function_call_output',
            call_id: data.call_id,
            output: JSON.stringify({ error: error.message })
          }
        });
      }
    }
  }, [sendEvent]);

  // Configure session and handle events
  useEffect(() => {
    if (!dataChannel) return;

    const configureSession = () => {
      console.log('Configuring session with tools');
      const sessionConfig: SessionConfig = {
        type: 'session.update',
        session: {
          ...SESSION_CONFIG,
          tools: tools,
        }
      };
      sendEvent(sessionConfig);
    };

    const handleMessage = async (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data) as RealtimeEvent;
        console.log('Received event:', data.type, data);
        setEvents(prev => [data, ...prev]);

        // Handle different event types
        switch (data.type) {
          case 'response.audio_transcript.done':
            setTranscript((data as AudioTranscriptEvent).transcript);
            break;

          case 'response.function_call_arguments.done':
            await handleFunctionCall(data as FunctionCallEvent);
            break;

          case 'error':
            console.error('Realtime API error:', (data as ErrorEvent).error);
            break;

          case 'session.created':
            console.log('Session created successfully');
            break;

          case 'session.updated':
            console.log('Session configuration updated');
            break;
        }
      } catch (error) {
        console.error('Error handling message:', error);
      }
    };

    // Set up event listeners
    const handleOpen = () => {
      console.log('Data channel opened');
      setIsSessionActive(true);
      setEvents([]);
      configureSession();
    };

    const handleClose = () => {
      console.log('Data channel closed');
      setIsSessionActive(false);
    };

    const handleError = (error: Event) => {
      console.error('Data channel error:', error);
    };

    dataChannel.addEventListener('open', handleOpen);
    dataChannel.addEventListener('message', handleMessage);
    dataChannel.addEventListener('close', handleClose);
    dataChannel.addEventListener('error', handleError);

    // Cleanup
    return () => {
      dataChannel.removeEventListener('open', handleOpen);
      dataChannel.removeEventListener('message', handleMessage);
      dataChannel.removeEventListener('close', handleClose);
      dataChannel.removeEventListener('error', handleError);
    };
  }, [dataChannel, sendEvent, handleFunctionCall]);

  return {
    isSessionActive,
    transcript,
    events,
    remoteMediaStream: remoteMediaStream.current,
    startSession,
    stopSession,
  };
};