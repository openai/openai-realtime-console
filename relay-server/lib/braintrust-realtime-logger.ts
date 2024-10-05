import { FailedResponseStatusType, IncompleteResponseStatusType, ResponseResourceType, SessionResourceType, UsageType } from "@openai/realtime-api-beta/dist/lib/client";
import { Span } from "braintrust";

interface BaseMessage {
  event_id: string;
}

interface SessionMessage extends BaseMessage {
  type: "session.created" | "session.updated"
  session: SessionResourceType;
}

interface ResponseMessage extends BaseMessage {
  type: "response.created"

  // Annoyingly similar to ResponseResourceType
  response: {
    object: "realtime.response";
    id: string;
    status: "in_progress" | "completed" | "incomplete" | "cancelled" | "failed";
    status_details: IncompleteResponseStatusType | FailedResponseStatusType | null;
    output: string[];
    usage: UsageType | null;
  }
}

interface AudioBaseMessage extends BaseMessage {
  response_id: string;
  item_id: string;
  output_index: number;
  content_index: number;
}

interface AudioDoneMessage extends AudioBaseMessage {
  type: "response.audio.done";
}

interface AudioTranscriptDoneMessage extends AudioBaseMessage {
  type: "response.audio_transcript.done" | "conversation.item.input_audio_transcription.completed";
  transcript: string;
}

interface AudioDeltaMessage extends AudioBaseMessage {
  type: "response.audio.delta" | "response.audio_transcript.delta";
  delta: string;
}

interface ClientAudioAppendMessage extends BaseMessage {
  type: "input_audio_buffer.append";
  audio: string;
}

interface ClientAudioCommitMessage extends BaseMessage {
  type: "input_audio_buffer.commit"
}

export type RealtimeMessage = SessionMessage | ResponseMessage | ClientAudioAppendMessage | ClientAudioCommitMessage | AudioDeltaMessage | AudioDoneMessage | AudioTranscriptDoneMessage;

export class BraintrustRealtimeLogger {
  rootSpan: Span;
  clientAudioBuffer: string[];
  clientSpan: Span | undefined;
  serverAudioBuffer: Map<string, string[]>;
  serverSpans: Map<string, Span>;
  inputAudioFormat: string | undefined;
  outputAudioFormat: string | undefined;

  constructor(rootSpan: Span) {
    this.rootSpan = rootSpan;
    this.clientAudioBuffer = [];
    this.serverAudioBuffer = new Map();
    this.serverSpans = new Map();
  }

  public handleMessageClient(message: RealtimeMessage) {
    if (message.type === "input_audio_buffer.append") {
      // Lazy create span.
      if (!this.clientSpan) {
        this.clientSpan = this.rootSpan.startSpan({
          name: "user", // Assume client to server direction is always user.
        });
      }
      this.clientAudioBuffer.push(message.audio);
      return;
    } else if (message.type === "input_audio_buffer.commit") {
      this.clientSpan?.log({
        metadata: {
          input_audio: this.clientAudioBuffer,
          input_audio_format: this.inputAudioFormat,
        }
      });
      this.clientAudioBuffer = [];
      // Defer closing until we get transcript.
      // this.clientAudioSpan?.close();
    }
    return;
  }

  public handleMessageServer(message: RealtimeMessage) {
    if (message.type === "session.created") {
      this.rootSpan.log({
        metadata: {
          openai_realtime_session: message.session,
        }
      });
      this.inputAudioFormat = this.inputAudioFormat || message.session.input_audio_format;
      this.outputAudioFormat = this.outputAudioFormat || message.session.output_audio_format;
    } else if (message.type === "response.created") {
      // This might be excessively paranoid.
      // In practice we seem to only get one response_id streaming at a time even though the schema allows multiple.
      this.serverAudioBuffer.set(message.response.id, []);
      this.serverSpans.set(message.response.id, this.rootSpan.startSpan({
        name: "assistant",
        event: {
          id: message.response.id,
        },
      }));
    } else if (message.type === "response.audio.delta") {
      this.serverAudioBuffer.get(message.response_id)!.push(message.delta);
    } else if (message.type === "response.audio.done") {
      const buf = this.serverAudioBuffer.get(message.response_id);
      const span = this.serverSpans.get(message.response_id);
      if (span) {
        span.log({
          // TODO: join input/output to the same span.
          metadata: {
            output_audio: buf,
            output_audio_format: this.outputAudioFormat,
          },
        });
      }
      this.serverAudioBuffer.delete(message.response_id);
    } else if (message.type === "response.audio_transcript.done") {
      const span = this.serverSpans.get(message.response_id);
      if (span) {
        span.log({output: message.transcript});
        // Assume the transcript always comes after the audio.
        span.close();
      }
      this.serverSpans.delete(message.response_id);
    } else if (message.type === "conversation.item.input_audio_transcription.completed") {
      this.clientSpan?.log({
        input: message.transcript,
      });
      // The transcript can never come before we finish logging audio.
      this.clientSpan?.close();
      this.clientSpan = undefined;
    }
  }

  /**
   * Close all pending spans.
   */
  public close() {
    console.log("Closing logger");
    // TODO check if there is a pending audio buffer.
    this.serverSpans.values().forEach((span: Span) => span.close());
    this.clientSpan?.close();
    this.rootSpan.close();
    this.rootSpan.flush();
  }
}

