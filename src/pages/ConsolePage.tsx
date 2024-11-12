/**
 * Running a local relay server will allow you to hide your API key
 * and run custom logic on the server
 *
 * Set the local relay server address to:
 * REACT_APP_LOCAL_RELAY_SERVER_URL=http://localhost:8081
 *
 * This will also require you to set OPENAI_API_KEY= in a `.env` file
 * You can run it with `npm run relay`, in parallel with `npm start`
 */
const LOCAL_RELAY_SERVER_URL: string =
  process.env.REACT_APP_LOCAL_RELAY_SERVER_URL || '';

import { useEffect, useRef, useCallback, useState } from 'react';
import React from 'react';
import { Link } from 'react-router-dom';
import { RealtimeClient } from '@openai/realtime-api-beta';
import { ItemType } from '@openai/realtime-api-beta/dist/lib/client.js';
import { WavRecorder, WavStreamPlayer } from '../lib/wavtools/index.js';
import { instructions } from '../utils/storytimestacy_config.js';
import { WavRenderer } from '../utils/wav_renderer';

import { X, Edit, Zap, ArrowUp, ArrowDown } from 'react-feather';
import { Button } from '../components/button/Button';
import { Toggle } from '../components/toggle/Toggle';
import { Map } from '../components/Map.js';

import './ConsolePage.scss';
import { isJsxOpeningLikeElement } from 'typescript';


export function ConsolePage() {
  /**
   * Ask user for API Key
   * If we're using the local relay server, we don't need this
   */
  const apiKey = LOCAL_RELAY_SERVER_URL
    ? ''
    : localStorage.getItem('tmp::voice_api_key') ||
      prompt('OpenAI API Key') ||
      '';
  if (apiKey !== '') {
    localStorage.setItem('tmp::voice_api_key', apiKey);
  }

  /**
   * Instantiate:
   * - WavRecorder (speech input)
   * - WavStreamPlayer (speech output)
   * - RealtimeClient (API client)
   */
  // const wavRecorderRef = useRef<WavRecorder>(
  //   new WavRecorder({ sampleRate: 24000 })
  // );
  // const wavStreamPlayerRef = useRef<WavStreamPlayer>(
  //   new WavStreamPlayer({ sampleRate: 24000 })
  // );
  const clientRef = useRef<RealtimeClient>(
    new RealtimeClient(
      LOCAL_RELAY_SERVER_URL
        ? { url: LOCAL_RELAY_SERVER_URL }
        : {
            apiKey: apiKey,
            dangerouslyAllowAPIKeyInBrowser: true,
          }
    )
  );

  /**
   * References for
   * - Rendering audio visualization (canvas)
   * - Autoscrolling event logs
   * - Timing delta for event log displays
   */
  const clientCanvasRef = useRef<HTMLCanvasElement>(null);
  const serverCanvasRef = useRef<HTMLCanvasElement>(null);
  const eventsScrollHeightRef = useRef(0);
  const eventsScrollRef = useRef<HTMLDivElement>(null);
  const startTimeRef = useRef<string>(new Date().toISOString());

  /**
   * All of our variables for displaying application state
   * - items are all conversation items (dialog)
   * - realtimeEvents are event logs, which can be expanded
   * - memoryKv is for set_memory() function
   * - coords, marker are for get_weather() function
   */
  // const [items, setItems] = useState<ItemType[]>([]);
  // const [realtimeEvents, setRealtimeEvents] = useState<RealtimeEvent[]>([]);
  // const [expandedEvents, setExpandedEvents] = useState<{
  //   [key: string]: boolean;
  // }>({});
  // const [isConnected, setIsConnected] = useState(false);
  // const [canPushToTalk, setCanPushToTalk] = useState(true);
  // const [isRecording, setIsRecording] = useState(false);
  // const [memoryKv, setMemoryKv] = useState<{ [key: string]: any }>({});
  // const [coords, setCoords] = useState<Coordinates | null>({
  //   lat: 37.775593,
  //   lng: -122.418137,
  // });
  // const [marker, setMarker] = useState<Coordinates | null>(null);

  /**
   * Utility for formatting the timing of logs
   */
  // const formatTime = useCallback((timestamp: string) => {
  //   const startTime = startTimeRef.current;
  //   const t0 = new Date(startTime).valueOf();
  //   const t1 = new Date(timestamp).valueOf();
  //   const delta = t1 - t0;
  //   const hs = Math.floor(delta / 10) % 100;
  //   const s = Math.floor(delta / 1000) % 60;
  //   const m = Math.floor(delta / 60_000) % 60;
  //   const pad = (n: number) => {
  //     let s = n + '';
  //     while (s.length < 2) {
  //       s = '0' + s;
  //     }
  //     return s;
  //   };
  //   return `${pad(m)}:${pad(s)}.${pad(hs)}`;
  // }, []);

  /**
   * When you click the API key
   */
  const resetAPIKey = useCallback(() => {
    const apiKey = prompt('OpenAI API Key');
    if (apiKey !== null) {
      localStorage.clear();
      localStorage.setItem('tmp::voice_api_key', apiKey);
      window.location.reload();
    }
  }, []);

  /**
   * Connect to conversation:
   * WavRecorder taks speech input, WavStreamPlayer output, client is API client
   */
  // const connectConversation = useCallback(async () => {
  //   const client = clientRef.current;
  //   const wavRecorder = wavRecorderRef.current;
  //   const wavStreamPlayer = wavStreamPlayerRef.current;

  //   // Set state variables
  //   startTimeRef.current = new Date().toISOString();
  //   setIsConnected(true);
  //   setRealtimeEvents([]);
  //   setItems(client.conversation.getItems());

  //   // Connect to microphone
  //   await wavRecorder.begin();

  //   // Connect to audio output
  //   await wavStreamPlayer.connect();

  //   // Connect to realtime API
  //   await client.connect();
  //   client.sendUserMessageContent([
  //     {
  //       type: `input_text`,
  //       // text: `Hello!`,
  //       // text: `For testing purposes, I want you to list ten car brands. Number each item, e.g. "one (or whatever number you are one): the item name".`
  //       text: "Hello! I am a child interested in learning about the world. Please assist me."
  //     },
  //   ]);

  //   if (client.getTurnDetectionType() === 'server_vad') {
  //     await wavRecorder.record((data) => client.appendInputAudio(data.mono));
  //   }
  // }, []);

  /**
   * Disconnect and reset conversation state
   */
  // const disconnectConversation = useCallback(async () => {
  //   setIsConnected(false);
  //   setRealtimeEvents([]);
  //   setItems([]);
  //   setMemoryKv({});
  //   setCoords({
  //     lat: 37.775593,
  //     lng: -122.418137,
  //   });
  //   setMarker(null);

  //   const client = clientRef.current;
  //   client.disconnect();

  //   const wavRecorder = wavRecorderRef.current;
  //   await wavRecorder.end();

  //   const wavStreamPlayer = wavStreamPlayerRef.current;
  //   await wavStreamPlayer.interrupt();
  // }, []);

  // const deleteConversationItem = useCallback(async (id: string) => {
  //   const client = clientRef.current;
  //   client.deleteItem(id);
  // }, []);



  /**
   * Render the application
   */
  return (
    <div data-component="ConsolePage">
      <div className="content-top">
        <div className="content-api-key">
          {!LOCAL_RELAY_SERVER_URL && (
            <Button
              icon={Edit}
              iconPosition="end"
              buttonStyle="flush"
              label={`api key: ${apiKey.slice(0, 3)}...`}
              onClick={() => resetAPIKey()}
            />
          )}
        </div>
      </div>

      <div className="title-page">
        <div className="content-title">
          <div className="content-title">
            <img src="/ollie.png" className="ollie-image" alt="Ollie" />
            <h1 className="rainbow-text">Oliver's Magical Friends</h1>
          </div>
        </div>
        
        <div className="image-links">
          <Link to="/storytimestacy">
            <img src="/storytime_stacy.png" alt="Storytime Stacy" />
          </Link>
          <Link to="/comradecharlie">
            <img src="/comrade_charlie.png" alt="Comrade Charlie" />
          </Link>
          <Link to="/buddyboba">
            <img src="/buddy_boba.png" alt="Buddy Boba" />
          </Link>
        </div>
      </div>
      
    </div>
  );
}
