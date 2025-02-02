import { createServer } from "node:http";
import { WebSocketServer } from "npm:ws";
import type { RawData, WebSocketServer as _WebSocketServer } from "npm:@types/ws";
import { RealtimeClient } from "https://raw.githubusercontent.com/akdeb/openai-realtime-api-beta/refs/heads/main/lib/client.js";
import { RealtimeUtils } from "https://raw.githubusercontent.com/akdeb/openai-realtime-api-beta/refs/heads/main/lib/utils.js";
import { Buffer } from "node:buffer"; 

const server = createServer();
const wss: _WebSocketServer = new WebSocketServer({ noServer: true });
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

wss.on("connection", async (ws) => {
  console.log("socket opened");
  if (!OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not set");
  }
  // Instantiate new client
  console.log(`Connecting with key "${OPENAI_API_KEY.slice(0, 3)}..."`);
  const client = new RealtimeClient({ apiKey: OPENAI_API_KEY });

  // Relay: OpenAI Realtime API Event -> Browser Event
  client.realtime.on("server.*",  async(event: any) => {
    console.log(`Relaying "${event.type}" to Client`);
     // Check if the event is session.created
     if (event.type === 'session.created') {
      console.log("session created");
      console.log(event);
      // Update session settings after session is created
      client.updateSession({
        voice: 'ash',
        turn_detection: null,
        // turn_detection: { type: 'server_vad', threshold: 0.5, // 0.0 to 1.0,
        //   prefix_padding_ms: 300, // How much audio to include in the audio stream before the speech starts.
        //   silence_duration_ms: 200, // How long to wait to mark the speech as stopped.
        //   },
        instructions: "You have to speak in an indian accent. You are someone from Mumbai, India.",
        input_audio_transcription: { model: 'whisper-1' }
      });
    }
    else if (event.type === 'session.updated') {
      console.log("session updated");
      console.log(event);
    } 
    else if (event.type === 'error') {
      console.log("error");
      console.log(event);
    }
    else if (event.type === 'response.audio.done') {
      console.log("response.audio.done");
      ws.send('response.audio.done');
    } else if (event.type === 'response.done') {
      console.log("response.done");
      ws.send('response.done');
    }


    if (event.type in client.conversation.EventProcessors) {
      const { delta } = client.conversation.processEvent(event);

      switch (event.type) {
        case 'response.created':
          ws.send('response.created');
          break;
        case 'response.audio.delta':
            console.log(`Received audio delta event`);
  
           //  Play new audio chunks as they arrive
           if (delta?.audio) {
            const pcmBuffer = Buffer.from(delta.audio.buffer);
         
            const CHUNK_SIZE = 15000;
            let offset = 0;
            while (offset < pcmBuffer.length) {
              const chunk = pcmBuffer.subarray(offset, offset + CHUNK_SIZE);
              ws.send(chunk);
              offset += CHUNK_SIZE;
              // await new Promise(resolve => setTimeout(resolve, 10)); 
            }
          }
          break;
        case 'conversation.item.created':
          console.log("user said: ", event.item);
          break;
        case 'conversation.item.input_audio_transcription.completed':
          console.log("user transcription:");
          console.log(event);
          break;
        }
    }
  });

  client.realtime.on("close", () => ws.close());

  // Relay: Browser Event -> OpenAI Realtime API Event
  // We need to queue data waiting for the OpenAI connection
  const messageQueue: RawData[] = [];
  const messageHandler = (data: any, isBinary: boolean) => {
    try {
      let event;

      // for esp32
      if (isBinary) {
        // Convert binary PCM16 data to base64 for OpenAI Realtime API
        event = {
          event_id: RealtimeUtils.generateId('evt_'), // Generate unique ID
          type: 'input_audio_buffer.append',
          audio: data.toString('base64'),
        };
        client.realtime.send(event.type, event);
      } else {
        const message = JSON.parse(data.toString('utf-8'));

        // commit user audio and create response
        if (message.type === "instruction" && message.msg === "end_of_speech") {
        console.log('end_of_speech detected');

        client.realtime.send("input_audio_buffer.commit", {
          event_id: RealtimeUtils.generateId('evt_'), // Generate unique ID
          type: "input_audio_buffer.commit",
        })

        client.realtime.send("response.create", {
          event_id: RealtimeUtils.generateId('evt_'), // Generate unique ID
          type: "response.create",
        });

        client.realtime.send("input_audio_buffer.clear", {
          event_id: RealtimeUtils.generateId('evt_'), // Generate unique ID
          type: "input_audio_buffer.clear",
        })
      }
      else if (message.type === "user") { // send user message and create response
             event = {
          event_id: RealtimeUtils.generateId('evt_'), // Generate unique ID
          type: "conversation.item.create",
          previous_item_id: "root",
          item: {
            type: "message",
            role: "user",
            content: [{
              type: "input_text",
              text: message.msg
            }]
          }
        }

        // Create response
        client.realtime.send(event.type, event);
        client.realtime.send("response.create", {
          event_id: RealtimeUtils.generateId('evt_'), // Generate unique ID
          type: "response.create",
        });
    }}

    } catch (e: unknown) {
      console.error((e as Error).message);
      console.log(`Error parsing event from client: ${data}`);
    }
  };

  ws.on("message", (data, isBinary) => {
    if (!client.isConnected()) {
      messageQueue.push(data);
    } else {
      messageHandler(data, isBinary);
    }
  });
  ws.on("close", () => client.disconnect());

  // Connect to OpenAI Realtime API
  try {
    console.log(`Connecting to OpenAI...`);
    await client.connect();
  } catch (e: unknown) {
    console.log(`Error connecting to OpenAI: ${e as Error}`);
    ws.close();
    return;
  }
  console.log(`Connected to OpenAI successfully!`);
  while (messageQueue.length) {
    messageHandler(messageQueue.shift(), false);
  }
});

server.on("upgrade", (req, socket, head) => {
  wss.handleUpgrade(req, socket, head, (ws) => {
    wss.emit("connection", ws, req);
  });
});

if (Deno.env.get("DEV_MODE") === "true") { // deno run -A --env-file=.env relay/index.ts
  const HOST = Deno.env.get("HOST") || "0.0.0.0";
  const PORT = Deno.env.get("PORT") || "8000";
server.listen(Number(PORT), HOST, () => {
  console.log(`Audio capture server running on ws://${HOST}:${PORT}`);
});
} else {
  server.listen(8080);
}