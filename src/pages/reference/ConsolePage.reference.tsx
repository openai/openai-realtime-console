import React, { useEffect, useRef, useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Speaker, X, ChevronDown, ChevronUp, Star, Zap } from 'lucide-react';
import { RealtimeClient } from '@openai/realtime-api-beta';
import { ItemType } from '@openai/realtime-api-beta/dist/lib/client.js';
import { WavRecorder, WavStreamPlayer } from '../../lib/wavtools/index.js';
import { instructions } from '../../utils/conversation_config.js';

export default function ConsolePage() {
  const [isConnected, setIsConnected] = useState(false);
  const [canPushToTalk, setCanPushToTalk] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [items, setItems] = useState<ItemType[]>([]);
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [isConversationCollapsed, setIsConversationCollapsed] = useState(false);

  const wavRecorderRef = useRef<WavRecorder>(new WavRecorder({ sampleRate: 24000 }));
  const wavStreamPlayerRef = useRef<WavStreamPlayer>(new WavStreamPlayer({ sampleRate: 24000 }));
  const clientRef = useRef<RealtimeClient>(
    new RealtimeClient({ 
      apiKey: process.env.REACT_APP_OPENAI_API_KEY || '', 
      dangerouslyAllowAPIKeyInBrowser: true 
    })
  );

  const getAudioDevices = useCallback(async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioInputDevices = devices.filter(device => device.kind === 'audioinput');
      setAudioDevices(audioInputDevices);
      
      if (!selectedDeviceId && audioInputDevices.length > 0) {
        setSelectedDeviceId(audioInputDevices[0].deviceId);
      }
    } catch (error) {
      console.error('Error getting audio devices:', error);
    }
  }, [selectedDeviceId]);

  useEffect(() => {
    getAudioDevices();
    navigator.mediaDevices.addEventListener('devicechange', getAudioDevices);
    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', getAudioDevices);
    };
  }, [getAudioDevices]);

  const connectConversation = useCallback(async () => {
    const client = clientRef.current;
    const wavRecorder = wavRecorderRef.current;
    const wavStreamPlayer = wavStreamPlayerRef.current;

    try {
      await client.connect();
      
      await wavStreamPlayer.connect();
      
      setIsConnected(true);
      setItems(client.conversation.getItems());
      
      if (client.getTurnDetectionType() === 'server_vad') {
        await wavRecorder.begin(selectedDeviceId);
        await wavRecorder.record((data) => client.appendInputAudio(data.mono));
      }

      await client.sendUserMessageContent([
        {
          type: 'input_text',
          text: "Hello! I'm ready to learn English!",
        },
      ]);
    } catch (error) {
      console.error('Error connecting:', error);
      setIsConnected(false);
    }
  }, [selectedDeviceId]);

  const disconnectConversation = useCallback(async () => {
    setIsConnected(false);
    setItems([]);
    clientRef.current.disconnect();
    const wavRecorder = wavRecorderRef.current;
    if (wavRecorder.getStatus() === 'recording') {
      await wavRecorder.end();
    }
    await wavStreamPlayerRef.current.interrupt();
  }, []);

  const startRecording = async () => {
    if (!isConnected || !canPushToTalk || isRecording) return;
    
    setIsRecording(true);
    setIsProcessing(true);
    const client = clientRef.current;
    const wavRecorder = wavRecorderRef.current;
    const wavStreamPlayer = wavStreamPlayerRef.current;
    
    try {
      const trackSampleOffset = await wavStreamPlayer.interrupt();
      if (trackSampleOffset?.trackId) {
        const { trackId, offset } = trackSampleOffset;
        await client.cancelResponse(trackId, offset);
      }
      
      await wavRecorder.begin(selectedDeviceId);
      await wavRecorder.record((data) => client.appendInputAudio(data.mono));
    } catch (error) {
      console.error('Error starting recording:', error);
      setIsRecording(false);
      setIsProcessing(false);
    }
  };

  const stopRecording = async () => {
    if (!isRecording) return;
    
    setIsRecording(false);
    const client = clientRef.current;
    const wavRecorder = wavRecorderRef.current;
    
    try {
      if (wavRecorder.getStatus() === 'recording') {
        await wavRecorder.end();
      }
      await client.createResponse();
    } catch (error) {
      console.error('Error stopping recording:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const changeTurnEndType = useCallback(
    async (type: 'none' | 'server_vad') => {
      const client = clientRef.current;
      const wavRecorder = wavRecorderRef.current;
      
      try {
        if (wavRecorder.getStatus() === 'recording') {
          await wavRecorder.end();
        }

        client.updateSession({ turn_detection: type === 'none' ? null : { type: 'server_vad' } });
        setCanPushToTalk(type === 'none');

        if (type === 'server_vad' && isConnected) {
          await wavRecorder.begin(selectedDeviceId);
          await wavRecorder.record((data) => client.appendInputAudio(data.mono));
        }
      } catch (error) {
        console.error('Error changing turn end type:', error);
      }
    },
    [isConnected, selectedDeviceId]
  );

  useEffect(() => {
    const client = clientRef.current;
    const wavStreamPlayer = wavStreamPlayerRef.current;

    try {
      client.updateSession({ instructions: instructions });
      client.updateSession({ input_audio_transcription: { model: 'whisper-1' } });

      client.on('error', (event: any) => console.error(event));
      client.on('conversation.interrupted', async () => {
        const trackSampleOffset = await wavStreamPlayer.interrupt();
        if (trackSampleOffset?.trackId) {
          const { trackId, offset } = trackSampleOffset;
          await client.cancelResponse(trackId, offset);
        }
      });
      client.on('conversation.updated', async ({ item, delta }: any) => {
        const items = client.conversation.getItems();
        if (delta?.audio) {
          wavStreamPlayer.add16BitPCM(delta.audio, item.id);
        }
        if (item.status === 'completed' && item.formatted.audio?.length) {
          const wavFile = await WavRecorder.decode(
            item.formatted.audio,
            24000,
            24000
          );
          item.formatted.file = wavFile;
        }
        setItems(items);
      });
    } catch (error) {
      console.error('Error setting up client:', error);
    }

    return () => {
      client.reset();
    };
  }, []);

  useEffect(() => {
    const client = clientRef.current;
    
    const unsubscribe = client.on('itemCreated', () => {
      setIsProcessing(false);
      setItems(client.conversation.getItems());
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-100 to-pink-100 p-4 font-sans">
      <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden border-4 border-purple-300">
        <div className="p-6 bg-gradient-to-r from-purple-400 to-pink-400 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Star className="w-8 h-8 text-yellow-300 animate-spin-slow" />
            <h1 className="text-2xl font-bold text-white">English Learning Buddy</h1>
          </div>
          <select 
            className="bg-white text-purple-700 rounded-full px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-300"
            value={selectedDeviceId}
            onChange={(e) => setSelectedDeviceId(e.target.value)}
          >
            {audioDevices.map((device) => (
              <option key={device.deviceId} value={device.deviceId}>
                {device.label || `Microphone ${device.deviceId.slice(0, 5)}...`}
              </option>
            ))}
          </select>
        </div>

        <div className="p-4 bg-purple-50 flex items-center justify-between">
          <div className="flex gap-2">
            <button
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                canPushToTalk ? 'bg-purple-500 text-white' : 'bg-gray-200 text-gray-700'
              }`}
              onClick={() => changeTurnEndType('none')}
            >
              Manual
            </button>
            <button
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                !canPushToTalk ? 'bg-purple-500 text-white' : 'bg-gray-200 text-gray-700'
              }`}
              onClick={() => changeTurnEndType('server_vad')}
            >
              VAD
            </button>
          </div>
          <button
            className={`px-4 py-2 rounded-full text-sm font-medium ${
              isConnected ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
            }`}
            onClick={isConnected ? disconnectConversation : connectConversation}
          >
            {isConnected ? 'Disconnect' : 'Connect'}
          </button>
        </div>

        <div className="p-4 bg-purple-100 flex justify-center">
          <button
            className="flex items-center gap-2 px-4 py-2 bg-purple-300 text-purple-800 rounded-full text-sm font-medium hover:bg-purple-400 transition-colors"
            onClick={() => setIsConversationCollapsed(!isConversationCollapsed)}
          >
            {isConversationCollapsed ? 'Show Chat' : 'Hide Chat'}
            {isConversationCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>

        <AnimatePresence>
          {!isConversationCollapsed && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="h-96 overflow-y-auto p-6 space-y-4">
                {items.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className={`flex gap-3 ${item.role === 'assistant' ? '' : 'justify-end'}`}
                  >
                    {item.role === 'assistant' && (
                      <div className="w-10 h-10 rounded-full bg-purple-200 flex items-center justify-center text-2xl">
                        🤖
                      </div>
                    )}
                    <div className={`rounded-2xl p-4 max-w-[80%] ${
                      item.role === 'assistant' ? 'bg-purple-200 text-purple-900' : 'bg-pink-200 text-pink-900'
                    }`}>
                      <p>{item.formatted.transcript || item.formatted.text || '(processing...)'}</p>
                      {item.formatted.file && (
                        <button
                          className="mt-2 flex items-center gap-2 px-3 py-1 bg-white rounded-full text-sm text-purple-700 hover:bg-purple-100 transition-colors"
                          onClick={() => {
                            const audio = new Audio(item.formatted.file.url);
                            audio.play();
                          }}
                        >
                          <Speaker className="w-4 h-4" />
                          Play
                        </button>
                      )}
                    </div>
                    {item.role === 'user' && (
                      <div className="w-10 h-10 rounded-full bg-pink-200 flex items-center justify-center text-2xl">
                        😊
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="p-6 bg-purple-50 flex flex-col items-center">
          <motion.button
            className={`w-20 h-20 rounded-full flex items-center justify-center text-white text-3xl ${
              isRecording ? 'bg-red-500' : 'bg-purple-500'
            }`}
            animate={isRecording ? { scale: [1, 1.1, 1] } : {}}
            transition={{ repeat: Infinity, duration: 1 }}
            onMouseDown={startRecording}
            onMouseUp={stopRecording}
            onTouchStart={startRecording}
            onTouchEnd={stopRecording}
            disabled={!isConnected || !canPushToTalk}
          >
            <Mic className="w-10 h-10" />
          </motion.button>
          <p className="mt-3 text-sm text-purple-700">
            {isRecording ? "I'm listening..." : canPushToTalk ? "Press to speak" : "Speak anytime"}
          </p>
        </div>

        <div className="p-4 bg-purple-100  flex justify-center">
          {isRecording && (
            <div className="flex gap-2">
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  className="w-2 h-8 bg-purple-500 rounded-full"
                  animate={{ height: [8, 32, 8] }}
                  transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.1 }}
                />
              ))}
            </div>
          )}
          {!isRecording && isProcessing && (
            <div className="flex items-center gap-2 text-purple-700">
              <Zap className="w-6 h-6 animate-pulse" />
              <span>AI is thinking...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}