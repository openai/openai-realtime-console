import { RealtimeUtils } from './utils.js';

/**
 * Contains text and audio information about a item
 * Can also be used as a delta
 * @typedef {Object} ItemContentDeltaType
 * @property {string} [text]
 * @property {Int16Array} [audio]
 * @property {string} [arguments]
 * @property {string} [transcript]
 */

/**
 * RealtimeConversation holds conversation history
 * and performs event validation for RealtimeAPI
 * @class
 */
export class RealtimeConversation {
  defaultFrequency = 24_000; // 24,000 Hz

  EventProcessors = {
    'conversation.item.created': (event) => {
      const { item } = event;
      // deep copy values
      const newItem = JSON.parse(JSON.stringify(item));
      if (!this.itemLookup[newItem.id]) {
        this.itemLookup[newItem.id] = newItem;
        this.items.push(newItem);
      }
      newItem.formatted = {};
      newItem.formatted.audio = new Int16Array(0);
      newItem.formatted.text = '';
      newItem.formatted.transcript = '';
      // If we have a speech item, can populate audio
      if (this.queuedSpeechItems[newItem.id]) {
        newItem.formatted.audio = this.queuedSpeechItems[newItem.id].audio;
        delete this.queuedSpeechItems[newItem.id]; // free up some memory
      }
      // Populate formatted text if it comes out on creation
      if (newItem.content) {
        const textContent = newItem.content.filter((c) =>
          ['text', 'input_text'].includes(c.type),
        );
        for (const content of textContent) {
          newItem.formatted.text += content.text;
        }
      }
      // If we have a transcript item, can pre-populate transcript
      if (this.queuedTranscriptItems[newItem.id]) {
        newItem.formatted.transcript = this.queuedTranscriptItems.transcript;
        delete this.queuedTranscriptItems[newItem.id];
      }
      if (newItem.type === 'message') {
        if (newItem.role === 'user') {
          newItem.status = 'completed';
          if (this.queuedInputAudio) {
            newItem.formatted.audio = this.queuedInputAudio;
            this.queuedInputAudio = null;
          }
        } else {
          newItem.status = 'in_progress';
        }
      } else if (newItem.type === 'function_call') {
        newItem.formatted.tool = {
          type: 'function',
          name: newItem.name,
          call_id: newItem.call_id,
          arguments: '',
        };
        newItem.status = 'in_progress';
      } else if (newItem.type === 'function_call_output') {
        newItem.status = 'completed';
        newItem.formatted.output = newItem.output;
      }
      return { item: newItem, delta: null };
    },
    'conversation.item.truncated': (event) => {
      const { item_id, audio_end_ms } = event;
      const item = this.itemLookup[item_id];
      if (!item) {
        throw new Error(`item.truncated: Item "${item_id}" not found`);
      }
      const endIndex = Math.floor(
        (audio_end_ms * this.defaultFrequency) / 1000,
      );
      item.formatted.transcript = '';
      item.formatted.audio = item.formatted.audio.slice(0, endIndex);
      return { item, delta: null };
    },
    'conversation.item.deleted': (event) => {
      const { item_id } = event;
      const item = this.itemLookup[item_id];
      if (!item) {
        throw new Error(`item.deleted: Item "${item_id}" not found`);
      }
      delete this.itemLookup[item.id];
      const index = this.items.indexOf(item);
      if (index > -1) {
        this.items.splice(index, 1);
      }
      return { item, delta: null };
    },
    'conversation.item.input_audio_transcription.completed': (event) => {
      const { item_id, content_index, transcript } = event;
      const item = this.itemLookup[item_id];
      // We use a single space to represent an empty transcript for .formatted values
      // Otherwise it looks like no transcript provided
      const formattedTranscript = transcript || ' ';
      if (!item) {
        // We can receive transcripts in VAD mode before item.created
        // This happens specifically when audio is empty
        this.queuedTranscriptItems[item_id] = {
          transcript: formattedTranscript,
        };
        return { item: null, delta: null };
      } else {
        item.content[content_index].transcript = transcript;
        item.formatted.transcript = formattedTranscript;
        return { item, delta: { transcript } };
      }
    },
    'input_audio_buffer.speech_started': (event) => {
      const { item_id, audio_start_ms } = event;
      this.queuedSpeechItems[item_id] = { audio_start_ms };
      return { item: null, delta: null };
    },
    'input_audio_buffer.speech_stopped': (event, inputAudioBuffer) => {
      const { item_id, audio_end_ms } = event;
      const speech = this.queuedSpeechItems[item_id];
      speech.audio_end_ms = audio_end_ms;
      if (inputAudioBuffer) {
        const startIndex = Math.floor(
          (speech.audio_start_ms * this.defaultFrequency) / 1000,
        );
        const endIndex = Math.floor(
          (speech.audio_end_ms * this.defaultFrequency) / 1000,
        );
        speech.audio = inputAudioBuffer.slice(startIndex, endIndex);
      }
      return { item: null, delta: null };
    },
    'response.created': (event) => {
      const { response } = event;
      if (!this.responseLookup[response.id]) {
        this.responseLookup[response.id] = response;
        this.responses.push(response);
      }
      return { item: null, delta: null };
    },
    'response.output_item.added': (event) => {
      const { response_id, item } = event;
      const response = this.responseLookup[response_id];
      if (!response) {
        throw new Error(
          `response.output_item.added: Response "${response_id}" not found`,
        );
      }
      response.output.push(item.id);
      return { item: null, delta: null };
    },
    'response.output_item.done': (event) => {
      const { item } = event;
      if (!item) {
        throw new Error(`response.output_item.done: Missing "item"`);
      }
      const foundItem = this.itemLookup[item.id];
      if (!foundItem) {
        throw new Error(
          `response.output_item.done: Item "${item.id}" not found`,
        );
      }
      foundItem.status = item.status;
      return { item: foundItem, delta: null };
    },
    'response.content_part.added': (event) => {
      const { item_id, part } = event;
      const item = this.itemLookup[item_id];
      if (!item) {
        throw new Error(
          `response.content_part.added: Item "${item_id}" not found`,
        );
      }
      item.content.push(part);
      return { item, delta: null };
    },
    'response.audio_transcript.delta': (event) => {
      const { item_id, content_index, delta } = event;
      const item = this.itemLookup[item_id];
      if (!item) {
        throw new Error(
          `response.audio_transcript.delta: Item "${item_id}" not found`,
        );
      }
      item.content[content_index].transcript += delta;
      item.formatted.transcript += delta;
      return { item, delta: { transcript: delta } };
    },
    'response.audio.delta': (event) => {
      const { item_id, content_index, delta } = event;
      const item = this.itemLookup[item_id];
      if (!item) {
        throw new Error(`response.audio.delta: Item "${item_id}" not found`);
      }
      // This never gets renderered, we care about the file data instead
      // item.content[content_index].audio += delta;
      const arrayBuffer = RealtimeUtils.base64ToArrayBuffer(delta);
      const appendValues = new Int16Array(arrayBuffer);
      item.formatted.audio = RealtimeUtils.mergeInt16Arrays(
        item.formatted.audio,
        appendValues,
      );
      return { item, delta: { audio: appendValues } };
    },
    'response.text.delta': (event) => {
      const { item_id, content_index, delta } = event;
      const item = this.itemLookup[item_id];
      if (!item) {
        throw new Error(`response.text.delta: Item "${item_id}" not found`);
      }
      item.content[content_index].text += delta;
      item.formatted.text += delta;
      return { item, delta: { text: delta } };
    },
    'response.function_call_arguments.delta': (event) => {
      const { item_id, delta } = event;
      const item = this.itemLookup[item_id];
      if (!item) {
        throw new Error(
          `response.function_call_arguments.delta: Item "${item_id}" not found`,
        );
      }
      item.arguments += delta;
      item.formatted.tool.arguments += delta;
      return { item, delta: { arguments: delta } };
    },
  };

  /**
   * Create a new RealtimeConversation instance
   * @returns {RealtimeConversation}
   */
  constructor() {
    this.clear();
  }

  /**
   * Clears the conversation history and resets to default
   * @returns {true}
   */
  clear() {
    this.itemLookup = {};
    this.items = [];
    this.responseLookup = {};
    this.responses = [];
    this.queuedSpeechItems = {};
    this.queuedTranscriptItems = {};
    this.queuedInputAudio = null;
    return true;
  }

  /**
   * Queue input audio for manual speech event
   * @param {Int16Array} inputAudio
   * @returns {Int16Array}
   */
  queueInputAudio(inputAudio) {
    this.queuedInputAudio = inputAudio;
    return inputAudio;
  }

  /**
   * Process an event from the WebSocket server and compose items
   * @param {Object} event
   * @param  {...any} args
   * @returns {item: import('./client.js').ItemType | null, delta: ItemContentDeltaType | null}
   */
  processEvent(event, ...args) {
    if (!event.event_id) {
      console.error(event);
      throw new Error(`Missing "event_id" on event`);
    }
    if (!event.type) {
      console.error(event);
      throw new Error(`Missing "type" on event`);
    }
    const eventProcessor = this.EventProcessors[event.type];
    if (!eventProcessor) {
      throw new Error(
        `Missing conversation event processor for "${event.type}"`,
      );
    }
    return eventProcessor.call(this, event, ...args);
  }

  /**
   * Retrieves a item by id
   * @param {string} id
   * @returns {import('./client.js').ItemType}
   */
  getItem(id) {
    return this.itemLookup[id] || null;
  }

  /**
   * Retrieves all items in the conversation
   * @returns {import('./client.js').ItemType[]}
   */
  getItems() {
    return this.items.slice();
  }
}
