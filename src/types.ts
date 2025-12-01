// Type definitions for the proxy

export interface ProxyConfig {
  projectId: string;
  location: string;
  model: GeminiModel;
  authMethod: 'service-account' | 'gcloud' | 'adc';
  serviceAccountPath?: string;
  port: number;
}

export type GeminiModel = 
  | 'gemini-2.0-flash-exp'
  | 'gemini-2.0-pro-exp' 
  | 'gemini-exp-1206';

export interface ModelInfo {
  name: string;
  displayName: string;
  contextWindow: number;
  maxOutputTokens: number;
  description: string;
}

// Anthropic API types
export interface AnthropicMessage {
  role: 'user' | 'assistant';
  content: string | Array<{
    type: 'text' | 'image';
    text?: string;
    source?: any;
  }>;
}

export interface AnthropicRequest {
  model: string;
  messages: AnthropicMessage[];
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
  top_k?: number;
  stream?: boolean;
  system?: string;
  stop_sequences?: string[];
}

export interface AnthropicResponse {
  id: string;
  type: 'message';
  role: 'assistant';
  content: Array<{
    type: 'text';
    text: string;
  }>;
  model: string;
  stop_reason: 'end_turn' | 'max_tokens' | 'stop_sequence';
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

// Gemini API types
export interface GeminiContent {
  role: 'user' | 'model';
  parts: Array<{
    text?: string;
    inlineData?: any;
  }>;
}

export interface GeminiRequest {
  contents: GeminiContent[];
  generationConfig?: {
    temperature?: number;
    topP?: number;
    topK?: number;
    maxOutputTokens?: number;
    stopSequences?: string[];
  };
  systemInstruction?: {
    parts: Array<{ text: string }>;
  };
}

export interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{ text: string }>;
      role: string;
    };
    finishReason: string;
  }>;
  usageMetadata?: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
}
