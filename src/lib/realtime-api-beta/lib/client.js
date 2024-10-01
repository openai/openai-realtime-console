import { RealtimeEventHandler } from './event_handler.js';
import { RealtimeAPI } from './api.js';
import { RealtimeConversation } from './conversation.js';
import { RealtimeUtils } from './utils.js';

/**
 * Valid audio formats
 * @typedef {"pcm16"|"g711-ulaw"|"g711-alaw"} AudioFormatType
 */

/**
 * @typedef {Object} AudioTranscriptionType
 * @property {boolean} [enabled]
 * @property {"whisper-1"} model
 */

/**
 * @typedef {Object} TurnDetectionServerVadType
 * @property {"server_vad"} type
 * @property {number} [threshold]
 * @property {number} [prefix_padding_ms]
 * @property {number} [silence_duration_ms]
 */

/**
 * Tool definitions
 * @typedef {Object} ToolDefinitionType
 * @property {"function"} [type]
 * @property {string} name
 * @property {string} description
 * @property {{[key: string]: any}} parameters
 */

/**
 * @typedef {Object} SessionResourceType
 * @property {string} [model]
 * @property {string[]} [modalities]
 * @property {string} [instructions]
 * @property {"alloy"|"shimmer"|"echo"} [voice]
 * @property {AudioFormatType} [input_audio_format]
 * @property {AudioFormatType} [output_audio_format]
 * @property {AudioTranscriptionType|null} [input_audio_transcription]
 * @property {TurnDetectionServerVadType|null} [turn_detection]
 * @property {ToolDefinitionType[]} [tools]
 * @property {"auto"|"none"|"required"|{type:"function",name:string}} [tool_choice]
 * @property {number} [temperature]
 * @property {number|"inf"} [max_response_output_tokens]
 */

/**
 * @typedef {"in_progress"|"completed"|"incomplete"} ItemStatusType
 */

/**
 * @typedef {Object} InputTextContentType
 * @property {"input_text"} type
 * @property {string} text
 */

/**
 * @typedef {Object} InputAudioContentType
 * @property {"input_audio"} type
 * @property {string} [audio] base64-encoded audio data
 * @property {string|null} [transcript]
 */

/**
 * @typedef {Object} TextContentType
 * @property {"text"} type
 * @property {string} text
 */

/**
 * @typedef {Object} AudioContentType
 * @property {"audio"} type
 * @property {string} [audio] base64-encoded audio data
 * @property {string|null} [transcript]
 */

/**
 * @typedef {Object} SystemItemType
 * @property {string|null} [previous_item_id]
 * @property {"message"} type
 * @property {ItemStatusType} status
 * @property {"system"} role
 * @property {Array<InputTextContentType>} content
 */

/**
 * @typedef {Object} UserItemType
 * @property {string|null} [previous_item_id]
 * @property {"message"} type
 * @property {ItemStatusType} status
 * @property {"system"} role
 * @property {Array<InputTextContentType|InputAudioContentType>} content
 */

/**
 * @typedef {Object} AssistantItemType
 * @property {string|null} [previous_item_id]
 * @property {"message"} type
 * @property {ItemStatusType} status
 * @property {"assistant"} role
 * @property {Array<TextContentType|AudioContentType>} content
 */

/**
 * @typedef {Object} FunctionCallItemType
 * @property {string|null} [previous_item_id]
 * @property {"function_call"} type
 * @property {ItemStatusType} status
 * @property {string} call_id
 * @property {string} name
 * @property {string} arguments
 */

/**
 * @typedef {Object} FunctionCallOutputItemType
 * @property {string|null} [previous_item_id]
 * @property {"function_call_output"} type
 * @property {string} call_id
 * @property {string} output
 */

/**
 * @typedef {Object} FormattedToolType
 * @property {"function"} type
 * @property {string} name
 * @property {string} call_id
 * @property {string} arguments
 */

/**
 * @typedef {Object} FormattedPropertyType
 * @property {Int16Array} [audio]
 * @property {string} [text]
 * @property {string} [transcript]
 * @property {FormattedToolType} [tool]
 * @property {string} [output]
 * @property {any} [file]
 */

/**
 * @typedef {Object} FormattedItemType
 * @property {string} id
 * @property {string} object
 * @property {"user"|"assistant"|"system"} [role]
 * @property {FormattedPropertyType} formatted
 */

/**
 * @typedef {SystemItemType|UserItemType|AssistantItemType|FunctionCallItemType|FunctionCallOutputItemType} BaseItemType
 */

/**
 * @typedef {FormattedItemType & BaseItemType} ItemType
 */

/**
 * @typedef {Object} IncompleteResponseStatusType
 * @property {"incomplete"} type
 * @property {"interruption"|"max_output_tokens"|"content_filter"} reason
 */

/**
 * @typedef {Object} FailedResponseStatusType
 * @property {"failed"} type
 * @property {{code: string, message: string}|null} error
 */

/**
 * @typedef {Object} UsageType
 * @property {number} total_tokens
 * @property {number} input_tokens
 * @property {number} output_tokens
 */

/**
 * @typedef {Object} ResponseResourceType
 * @property {"in_progress"|"completed"|"incomplete"|"cancelled"|"failed"} status
 * @property {IncompleteResponseStatusType|FailedResponseStatusType|null} status_details
 * @property {ItemType[]} output
 * @property {UsageType|null} usage
 */

/**
 * RealtimeClient Class
 * @class
 */
export class RealtimeClient extends RealtimeEventHandler {
  /**
   * Create a new RealtimeClient instance
   * @param {{url?: string, apiKey?: string, dangerouslyAllowAPIKeyInBrowser?: boolean, debug?: boolean}} [settings]
   */
  constructor({ url, apiKey, dangerouslyAllowAPIKeyInBrowser, debug } = {}) {
    super();
    this.defaultSessionConfig = {
      modalities: ['text', 'audio'],
      instructions: '',
      voice: 'alloy',
      input_audio_format: 'pcm16',
      output_audio_format: 'pcm16',
      input_audio_transcription: null,
      turn_detection: null,
      tools: [],
      tool_choice: 'auto',
      temperature: 0.8,
      max_response_output_tokens: 4096,
    };
    this.sessionConfig = {};
    this.transcriptionModels = [
      {
        model: 'whisper-1',
      },
    ];
    this.defaultServerVadConfig = {
      type: 'server_vad',
      threshold: 0.5, // 0.0 to 1.0,
      prefix_padding_ms: 300, // How much audio to include in the audio stream before the speech starts.
      silence_duration_ms: 200, // How long to wait to mark the speech as stopped.
    };
    this.realtime = new RealtimeAPI({
      url,
      apiKey,
      dangerouslyAllowAPIKeyInBrowser,
      debug,
    });
    this.conversation = new RealtimeConversation();
    this._resetConfig();
    this._addAPIEventHandlers();
  }

  /**
   * Resets sessionConfig and conversationConfig to default
   * @private
   * @returns {true}
   */
  _resetConfig() {
    this.sessionCreated = false;
    this.tools = {};
    this.sessionConfig = JSON.parse(JSON.stringify(this.defaultSessionConfig));
    this.inputAudioBuffer = new Int16Array(0);
    return true;
  }

  /**
   * Sets up event handlers for a fully-functional application control flow
   * @private
   * @returns {true}
   */
  _addAPIEventHandlers() {
    // Event Logging handlers
    this.realtime.on('client.*', (event) => {
      const realtimeEvent = {
        time: new Date().toISOString(),
        source: 'client',
        event: event,
      };
      this.dispatch('realtime.event', realtimeEvent);
    });
    this.realtime.on('server.*', (event) => {
      const realtimeEvent = {
        time: new Date().toISOString(),
        source: 'server',
        event: event,
      };
      this.dispatch('realtime.event', realtimeEvent);
    });

    // Handles session created event, can optionally wait for it
    this.realtime.on(
      'server.session.created',
      () => (this.sessionCreated = true),
    );

    // Setup for application control flow
    const handler = (event, ...args) => {
      const { item, delta } = this.conversation.processEvent(event, ...args);
      return { item, delta };
    };
    const handlerWithDispatch = (event, ...args) => {
      const { item, delta } = handler(event, ...args);
      if (item) {
        // FIXME: If statement is only here because item.input_audio_transcription.completed
        //        can fire before `item.created`, resulting in empty item.
        //        This happens in VAD mode with empty audio
        this.dispatch('conversation.updated', { item, delta });
      }
      return { item, delta };
    };
    const callTool = async (tool) => {
      try {
        const jsonArguments = JSON.parse(tool.arguments);
        const toolConfig = this.tools[tool.name];
        if (!toolConfig) {
          throw new Error(`Tool "${tool.name}" has not been added`);
        }
        const result = await toolConfig.handler(jsonArguments);
        this.realtime.send('conversation.item.create', {
          item: {
            type: 'function_call_output',
            call_id: tool.call_id,
            output: JSON.stringify(result),
          },
        });
      } catch (e) {
        this.realtime.send('conversation.item.create', {
          item: {
            type: 'function_call_output',
            call_id: tool.call_id,
            output: JSON.stringify({ error: e.message }),
          },
        });
      }
      this.createResponse();
    };

    // Handlers to update internal conversation state
    this.realtime.on('server.response.created', handler);
    this.realtime.on('server.response.output_item.added', handler);
    this.realtime.on('server.response.content_part.added', handler);
    this.realtime.on('server.input_audio_buffer.speech_started', (event) => {
      handler(event);
      this.dispatch('conversation.interrupted');
    });
    this.realtime.on('server.input_audio_buffer.speech_stopped', (event) =>
      handler(event, this.inputAudioBuffer),
    );

    // Handlers to update application state
    this.realtime.on('server.conversation.item.created', (event) => {
      const { item } = handlerWithDispatch(event);
      this.dispatch('conversation.item.appended', { item });
      if (item.status === 'completed') {
        this.dispatch('conversation.item.completed', { item });
      }
    });
    this.realtime.on('server.conversation.item.truncated', handlerWithDispatch);
    this.realtime.on('server.conversation.item.deleted', handlerWithDispatch);
    this.realtime.on(
      'server.conversation.item.input_audio_transcription.completed',
      handlerWithDispatch,
    );
    this.realtime.on(
      'server.response.audio_transcript.delta',
      handlerWithDispatch,
    );
    this.realtime.on('server.response.audio.delta', handlerWithDispatch);
    this.realtime.on('server.response.text.delta', handlerWithDispatch);
    this.realtime.on(
      'server.response.function_call_arguments.delta',
      handlerWithDispatch,
    );
    this.realtime.on('server.response.output_item.done', async (event) => {
      const { item } = handlerWithDispatch(event);
      if (item.status === 'completed') {
        this.dispatch('conversation.item.completed', { item });
      }
      if (item.formatted.tool) {
        callTool(item.formatted.tool);
      }
    });

    return true;
  }

  /**
   * Tells us whether the realtime socket is connected and the session has started
   * @returns {boolean}
   */
  isConnected() {
    return this.realtime.isConnected();
  }

  /**
   * Resets the client instance entirely: disconnects and clears active config
   * @returns {true}
   */
  reset() {
    this.disconnect();
    this.clearEventHandlers();
    this.realtime.clearEventHandlers();
    this._resetConfig();
    this._addAPIEventHandlers();
    return true;
  }

  /**
   * Connects to the Realtime WebSocket API
   * Updates session config and conversation config
   * @returns {Promise<true>}
   */
  async connect() {
    if (this.isConnected()) {
      throw new Error(`Already connected, use .disconnect() first`);
    }
    await this.realtime.connect();
    this.updateSession();
    return true;
  }

  /**
   * Waits for a session.created event to be executed before proceeding
   * @returns {Promise<true>}
   */
  async waitForSessionCreated() {
    if (!this.isConnected()) {
      throw new Error(`Not connected, use .connect() first`);
    }
    while (!this.sessionCreated) {
      await new Promise((r) => setTimeout(() => r(), 1));
    }
    return true;
  }

  /**
   * Disconnects from the Realtime API and clears the conversation history
   */
  disconnect() {
    this.sessionCreated = false;
    this.conversation.clear();
    this.realtime.isConnected() && this.realtime.disconnect();
  }

  /**
   * Gets the active turn detection mode
   * @returns {"server_vad"|null}
   */
  getTurnDetectionType() {
    return this.sessionConfig.turn_detection?.type || null;
  }

  /**
   * Add a tool and handler
   * @param {ToolDefinitionType} definition
   * @param {function} handler
   * @returns {{definition: ToolDefinitionType, handler: function}}
   */
  addTool(definition, handler) {
    if (!definition?.name) {
      throw new Error(`Missing tool name in definition`);
    }
    const name = definition?.name;
    if (this.tools[name]) {
      throw new Error(
        `Tool "${name}" already added. Please use .removeTool("${name}") before trying to add again.`,
      );
    }
    if (typeof handler !== 'function') {
      throw new Error(`Tool "${name}" handler must be a function`);
    }
    this.tools[name] = { definition, handler };
    this.updateSession();
    return this.tools[name];
  }

  /**
   * Removes a tool
   * @param {string} name
   * @returns {true}
   */
  removeTool(name) {
    if (!this.tools[name]) {
      throw new Error(`Tool "${name}" does not exist, can not be removed.`);
    }
    delete this.tools[name];
    return true;
  }

  /**
   * Deletes an item
   * @param {string} id
   * @returns {true}
   */
  deleteItem(id) {
    this.realtime.send('conversation.item.delete', { item_id: id });
    return true;
  }

  /**
   * Updates session configuration
   * If the client is not yet connected, will save details and instantiate upon connection
   * @param {SessionResourceType} [sessionConfig]
   */
  updateSession({
    modalities = void 0,
    instructions = void 0,
    voice = void 0,
    input_audio_format = void 0,
    output_audio_format = void 0,
    input_audio_transcription = void 0,
    turn_detection = void 0,
    tools = void 0,
    tool_choice = void 0,
    temperature = void 0,
    max_response_output_tokens = void 0,
  } = {}) {
    modalities !== void 0 && (this.sessionConfig.modalities = modalities);
    instructions !== void 0 && (this.sessionConfig.instructions = instructions);
    voice !== void 0 && (this.sessionConfig.voice = voice);
    input_audio_format !== void 0 &&
      (this.sessionConfig.input_audio_format = input_audio_format);
    output_audio_format !== void 0 &&
      (this.sessionConfig.output_audio_format = output_audio_format);
    input_audio_transcription !== void 0 &&
      (this.sessionConfig.input_audio_transcription =
        input_audio_transcription);
    turn_detection !== void 0 &&
      (this.sessionConfig.turn_detection = turn_detection);
    tools !== void 0 && (this.sessionConfig.tools = tools);
    tool_choice !== void 0 && (this.sessionConfig.tool_choice = tool_choice);
    temperature !== void 0 && (this.sessionConfig.temperature = temperature);
    max_response_output_tokens !== void 0 &&
      (this.sessionConfig.max_response_output_tokens =
        max_response_output_tokens);
    // Load tools from tool definitions + already loaded tools
    const useTools = [].concat(
      (tools || []).map((toolDefinition) => {
        const definition = {
          type: 'function',
          ...toolDefinition,
        };
        if (this.tools[definition?.name]) {
          throw new Error(
            `Tool "${definition?.name}" has already been defined`,
          );
        }
        return definition;
      }),
      Object.keys(this.tools).map((key) => {
        return {
          type: 'function',
          ...this.tools[key].definition,
        };
      }),
    );
    const session = { ...this.sessionConfig };
    session.tools = useTools;
    if (this.realtime.isConnected()) {
      this.realtime.send('session.update', { session });
    }
    return true;
  }

  /**
   * Sends user message content and generates a response
   * @param {Array<InputTextContentType|InputAudioContentType>} content
   * @returns {true}
   */
  sendUserMessageContent(content = []) {
    if (content.length) {
      for (const c of content) {
        if (c.type === 'input_audio') {
          if (c.audio instanceof ArrayBuffer || c.audio instanceof Int16Array) {
            c.audio = RealtimeUtils.arrayBufferToBase64(c.audio);
          }
        }
      }
      this.realtime.send('conversation.item.create', {
        item: {
          type: 'message',
          role: 'user',
          content,
        },
      });
    }
    this.createResponse();
    return true;
  }

  /**
   * Appends user audio to the existing audio buffer
   * @param {Int16Array|ArrayBuffer} arrayBuffer
   * @returns {true}
   */
  appendInputAudio(arrayBuffer) {
    if (arrayBuffer.byteLength > 0) {
      this.realtime.send('input_audio_buffer.append', {
        audio: RealtimeUtils.arrayBufferToBase64(arrayBuffer),
      });
      this.inputAudioBuffer = RealtimeUtils.mergeInt16Arrays(
        this.inputAudioBuffer,
        arrayBuffer,
      );
    }
    return true;
  }

  /**
   * Forces a model response generation
   * @returns {true}
   */
  createResponse() {
    if (
      this.getTurnDetectionType() === null &&
      this.inputAudioBuffer.byteLength > 0
    ) {
      this.realtime.send('input_audio_buffer.commit');
      this.conversation.queueInputAudio(this.inputAudioBuffer);
      this.inputAudioBuffer = new Int16Array(0);
    }
    this.realtime.send('response.create');
    return true;
  }

  /**
   * Cancels the ongoing server generation and truncates ongoing generation, if applicable
   * If no id provided, will simply call `cancel_generation` command
   * @param {string} id The id of the message to cancel
   * @param {number} [sampleCount] The number of samples to truncate past for the ongoing generation
   * @returns {{item: (AssistantItemType | null)}}
   */
  cancelResponse(id, sampleCount = 0) {
    if (!id) {
      this.realtime.send('response.cancel');
      return { item: null };
    } else if (id) {
      const item = this.conversation.getItem(id);
      if (!item) {
        throw new Error(`Could not find item "${id}"`);
      }
      if (item.type !== 'message') {
        throw new Error(`Can only cancelResponse messages with type "message"`);
      } else if (item.role !== 'assistant') {
        throw new Error(
          `Can only cancelResponse messages with role "assistant"`,
        );
      }
      this.realtime.send('response.cancel');
      const audioIndex = item.content.findIndex((c) => c.type === 'audio');
      if (audioIndex === -1) {
        throw new Error(`Could not find audio on item to cancel`);
      }
      this.realtime.send('conversation.item.truncate', {
        item_id: id,
        content_index: audioIndex,
        audio_end_ms: Math.floor(
          (sampleCount / this.conversation.defaultFrequency) * 1000,
        ),
      });
      return { item };
    }
  }

  /**
   * Utility for waiting for the next `conversation.item.appended` event to be triggered by the server
   * @returns {Promise<{item: ItemType}>}
   */
  async waitForNextItem() {
    const event = await this.waitForNext('conversation.item.appended');
    const { item } = event;
    return { item };
  }

  /**
   * Utility for waiting for the next `conversation.item.completed` event to be triggered by the server
   * @returns {Promise<{item: ItemType}>}
   */
  async waitForNextCompletedItem() {
    const event = await this.waitForNext('conversation.item.completed');
    const { item } = event;
    return { item };
  }
}
