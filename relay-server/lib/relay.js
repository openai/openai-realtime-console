import { WebSocketServer } from 'ws';
import { RealtimeClient } from '@openai/realtime-api-beta';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { RealtimeUtils } from '@openai/realtime-api-beta/lib/utils.js';
// import Speaker from 'speaker';

export class RealtimeRelay {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.sockets = new WeakMap();
    this.wss = null;

    // Get the directory name in an ES module
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    // clear log file
    const logFilePath = path.join(__dirname, 'relay.log');
    fs.writeFileSync(logFilePath, '');
  }

  listen(port, host, path = '/') {
    this.wss = new WebSocketServer({ port, host, path });
    this.wss.on('connection', this.connectionHandler.bind(this));
    this.log(`Listening on ws://${host}:${port}${path}`);
    // this.speaker = new Speaker({
    //   channels: 1,
    //   bitDepth: 16,
    //   sampleRate: 24000,
    // });
  }

  sendAudioBufferToESP32(ws, audioBuffer, chunkSize = 1024) {
    let offset = 0;

    while (offset < audioBuffer.length) {
      const chunk = audioBuffer.slice(offset, offset + chunkSize);
      ws.send(chunk);
      offset += chunkSize;
    }
  }

  async connectionHandler(ws, req) {
    if (!req.url) {
      this.log('No URL provided, closing connection.');
      ws.close();
      return;
    }

    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathname = url.pathname;

    if (pathname !== '/') {
      this.log(`Invalid pathname: "${pathname}"`);
      ws.close();
      return;
    }

    // Instantiate new client
    this.log(`Connecting with key "${this.apiKey.slice(0, 3)}..."`);
    const client = new RealtimeClient({ apiKey: this.apiKey });

    // Relay: OpenAI Realtime API Event -> Client Event
    client.realtime.on('server.*', (event) => {
      this.log(`Relaying "${event.type}" to Client`);
      this.log(event);

      // Check if the event is session.created
      if (event.type === 'session.created') {
        // Update session settings after session is created
        client.updateSession({
          voice: 'ash',
          turn_detection: { type: 'server_vad', threshold: 0.5, // 0.0 to 1.0,
            prefix_padding_ms: 300, // How much audio to include in the audio stream before the speech starts.
            silence_duration_ms: 200, // How long to wait to mark the speech as stopped.
            },
        });
      }

      if (event.type in client.conversation.EventProcessors) {
        const { delta } = client.conversation.processEvent(event);

        switch (event.type) {
          case 'response.audio.delta':
            this.log(`Received audio delta event`);

            // Play new audio chunks as they arrive
            if (delta?.audio) {
              const audioBuffer = Buffer.from(delta.audio.buffer);
              this.sendAudioBufferToESP32(ws, audioBuffer);
              // this.speaker.write(audioBuffer);
            }
            break;
          case 'response.audio.done':
            this.log(`Received audio done event`);
            ws.send(JSON.stringify({ type: 'audio.done' }));
            break;
        }
      }

      // ws.send(JSON.stringify(event));
    });
    client.realtime.on('close', () => ws.close());

    // Relay: Client Event -> OpenAI Realtime API Event
    // We need to queue data waiting for the OpenAI connection
    const messageQueue = [];
    const messageHandler = (data) => {
      try {
        let event;

        // for esp32
        if (Buffer.isBuffer(data)) {
          // Log buffer length to check consistency
          this.log(`Received binary data of length ${data.length}`);

          // Play audio locally (for debugging)
          // this.speaker.write(data);

          // Convert binary PCM16 data to base64 for OpenAI Realtime API
          const base64Audio = data.toString('base64');
          event = {
            event_id: RealtimeUtils.generateId('evt_'), // Generate unique ID
            type: 'input_audio_buffer.append',
            audio: base64Audio,
          };
        } else {
          // Assume it's JSON if not binary
          event = JSON.parse(data);
        }

        // Relay event to OpenAI Realtime API
        this.log(`Relaying "${event.type}" to OpenAI`);
        this.log(event);
        client.realtime.send(event.type, event);
      } catch (e) {
        console.error(e.message);
        this.log(`Error parsing event from client: ${data}`);
      }
    };
    ws.on('message', (data) => {
      if (!client.isConnected()) {
        messageQueue.push(data);
      } else {
        messageHandler(data);
      }
    });
    ws.on('close', () => client.disconnect());

    // Connect to OpenAI Realtime API
    try {
      this.log(`Connecting to OpenAI...`);
      await client.connect();
    } catch (e) {
      this.log(`Error connecting to OpenAI: ${e.message}`);
      ws.close();
      return;
    }
    this.log(`Connected to OpenAI successfully!`);

    while (messageQueue.length) {
      messageHandler(messageQueue.shift());
    }
  }

  log(object) {
    const message = `[RealtimeRelay] ${JSON.stringify(object, null, 2)}`;
    console.log(message);

    // Get the directory name in an ES module
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    // Append the log message to a file
    const logFilePath = path.join(__dirname, 'relay.log');
    fs.appendFile(logFilePath, message + '\n', (err) => {
      if (err) {
        console.error('Failed to write log to file:', err);
      }
    });
  }
}
