import { RealtimeUtils } from '@openai/realtime-api-beta';

export type EventHandlerCallbackType = (event: any) => void;

export class AnswerBotClient {
  private url: string;

  private eventHandlers: { [key: string]: EventHandlerCallbackType[] } = {};
  //   private nextEventHandlers: { [key: string]: EventHandlerCallbackType[] } = {};

  private _ws: WebSocket | null = null;

  private inputAudioBuffer?: Int16Array;

  isConnected() {
    return this._ws !== null && this._ws.readyState === WebSocket.OPEN;
  }

  constructor({ url }: { url: string }) {
    this.url = url;

    this.reset();

    // this.eventHandlers = {};
    // this.nextEventHandlers = {};
  }

  reset() {
    this.disconnect();

    this.eventHandlers = {};

    this.inputAudioBuffer = new Int16Array(0);
    // this.nextEventHandlers = {};
  }

  connect(): Promise<boolean> {
    if (this.isConnected()) {
      throw new Error(`Already connected`);
    }

    const ws = new WebSocket(`${this.url}`);
    ws.addEventListener('message', (event) => {
      console.log('message', event);

      const message = JSON.parse(event.data);
      this.dispatch(message.event, message);
    });

    return new Promise((resolve, reject) => {
      const connectionErrorHandler = () => {
        this.disconnect();
        reject(new Error(`Could not connect to "${this.url}"`));
      };
      ws.addEventListener('error', connectionErrorHandler);
      ws.addEventListener('open', () => {
        console.log(`Connected to "${this.url}"`);
        ws.removeEventListener('error', connectionErrorHandler);
        ws.addEventListener('error', () => {
          this.disconnect();
          console.log(`Error, disconnected from "${this.url}"`);
          this.dispatch('close', { error: true });
        });
        ws.addEventListener('close', () => {
          this.disconnect();
          console.log(`Disconnected from "${this.url}"`);
          this.dispatch('close', { error: false });
        });

        ws.send(
          JSON.stringify({
            app_id: '',
            event: 'start',
            start: {
              streamSid: RealtimeUtils.generateId('stream_'),
              customParameters: {
                app_id: 6,
              },
            },
            // stream_id: RealtimeUtils.generateId('stream_'),
            conversation_id: '',
          })
        );

        this._ws = ws;
        resolve(true);
      });
    });
  }

  dispatch(eventName: string, event: any) {
    console.log('dispatch', eventName, event);

    const handlers = [...(this.eventHandlers[eventName] || [])];
    for (const handler of handlers) {
      handler(event);
    }
    // const nextHandlers = [].concat(this.nextEventHandlers[eventName] || []);
    // for (const nextHandler of nextHandlers) {
    //   nextHandler(event);
    // }
    // delete this.nextEventHandlers[eventName];
    return true;
  }

  disconnect(): Promise<void> {
    this.isConnected() && this._ws!.close();
    this._ws = null;
    console.log('disconnect');
    return Promise.resolve();
  }

  /**
   * Clears all event handlers
   * @returns {true}
   */
  clearEventHandlers() {
    this.eventHandlers = {};
    // this.nextEventHandlers = {};
    return true;
  }

  createResponse(): Promise<void> {
    console.log('createResponse');
    return Promise.resolve();
  }

  cancelResponse(trackId: string, offset: number): Promise<void> {
    console.log('cancelResponse', trackId, offset);
    return Promise.resolve();
  }

  //   sendUserMessageContent(
  //     content: {
  //       type: 'input_audio' | 'input_text';
  //       text?: string;
  //       audio?: ArrayBuffer | Int16Array | string;
  //     }[]
  //   ): Promise<void> {
  //     if (!this.isConnected()) {
  //       throw new Error(`Not connected`);
  //     }

  //     if (content.length) {
  //       for (const c of content) {
  //         if (c.type === 'input_audio') {
  //           if (c.audio instanceof ArrayBuffer || c.audio instanceof Int16Array) {
  //             c.audio = RealtimeUtils.arrayBufferToBase64(c.audio);
  //           }
  //         }
  //       }
  //       this._ws!.send(
  //         JSON.stringify({
  //           event_id: RealtimeUtils.generateId('evt_'),
  //           type: 'conversation.item.create',
  //           ...content,
  //         })
  //       );
  //     }
  //     this.createResponse();

  //     console.log('sendUserMessageContent', content);
  //     return Promise.resolve();
  //   }

  //   sendUserMessageContent(
  //     content: {
  //       type: 'input_audio' | 'input_text';
  //       text?: string;
  //       audio?: ArrayBuffer | Int16Array | string;
  //     }[]
  //   ): Promise<void> {
  //     if (!this.isConnected()) {
  //       throw new Error(`Not connected`);
  //     }

  //     if (content.length) {
  //       for (const c of content) {
  //         if (c.type === 'input_audio') {
  //           if (c.audio instanceof ArrayBuffer || c.audio instanceof Int16Array) {
  //             c.audio = RealtimeUtils.arrayBufferToBase64(c.audio);
  //           }
  //         }
  //       }
  //       this._ws!.send(
  //         JSON.stringify({
  //           event_id: RealtimeUtils.generateId('evt_'),
  //           type: 'conversation.item.create',
  //           ...content,
  //         })
  //       );
  //     }
  //     this.createResponse();

  //     console.log('sendUserMessageContent', content);
  //     return Promise.resolve();
  //   }

  appendInputAudio(arrayBuffer: Int16Array): Promise<void> {
    console.log('appendInputAudio', arrayBuffer);
    if (arrayBuffer.byteLength > 0) {
      this._ws!.send(
        JSON.stringify({
          event_id: RealtimeUtils.generateId('evt_'),
          event: 'media',
          media: {
            payload: RealtimeUtils.arrayBufferToBase64(arrayBuffer),
            timestamp: Date.now(),
          },
          audio: RealtimeUtils.arrayBufferToBase64(arrayBuffer),
        })
      );
      this.inputAudioBuffer = RealtimeUtils.mergeInt16Arrays(
        this.inputAudioBuffer || new Int16Array(0),
        arrayBuffer
      );
    }

    return Promise.resolve();
  }

  /**
   * Listen to specific events
   * @param {string} eventName The name of the event to listen to
   * @param {EventHandlerCallbackType} callback Code to execute on event
   * @returns {EventHandlerCallbackType}
   */
  on(
    eventName: string,
    callback: EventHandlerCallbackType
  ): EventHandlerCallbackType {
    this.eventHandlers[eventName] = this.eventHandlers[eventName] || [];
    this.eventHandlers[eventName].push(callback);
    return callback;
  }

  /**
   * Listen for the next event of a specified type
   * @param {string} eventName The name of the event to listen to
   * @param {EventHandlerCallbackType} callback Code to execute on event
   * @returns {EventHandlerCallbackType}
   */
  //   onNext(
  //     eventName: string,
  //     callback: EventHandlerCallbackType
  //   ): EventHandlerCallbackType {
  //     this.nextEventHandlers[eventName] = this.nextEventHandlers[eventName] || [];
  //     this.nextEventHandlers[eventName].push(callback);
  //     return callback;
  //   }

  off(eventName: string, callback?: EventHandlerCallbackType): true {
    const handlers = this.eventHandlers[eventName] || [];
    if (callback) {
      const index = handlers.indexOf(callback);
      if (index === -1) {
        throw new Error(
          `Could not turn off specified event listener for "${eventName}": not found as a listener`
        );
      }
      handlers.splice(index, 1);
    } else {
      delete this.eventHandlers[eventName];
    }
    return true;
  }
}
