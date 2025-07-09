export interface RealtimeTool {
  type: 'function';
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, any>;
    required: string[];
  };
}

export interface RealtimeEvent {
  type: string;
  [key: string]: any;
}

export interface SessionConfig {
  type: 'session.update';
  session: {
    modalities: string[];
    instructions: string;
    tools: RealtimeTool[];
    tool_choice?: string;
    temperature?: number;
    voice?: string;
  };
}

export interface FunctionCallEvent {
  type: 'response.function_call_arguments.done';
  name: string;
  arguments: string;
  call_id: string;
}

export interface AudioTranscriptEvent {
  type: 'response.audio_transcript.done';
  transcript: string;
}

export interface ErrorEvent {
  type: 'error';
  error: {
    code: string;
    message: string;
  };
}