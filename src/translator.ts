import { 
  AnthropicRequest, 
  AnthropicResponse, 
  AnthropicMessage,
  GeminiRequest, 
  GeminiResponse,
  GeminiContent 
} from './types.js';

/**
 * Translates Anthropic API requests to Gemini API format
 */
export class ApiTranslator {
  
  translateRequest(anthropicReq: AnthropicRequest): GeminiRequest {
    const geminiRequest: GeminiRequest = {
      contents: this.translateMessages(anthropicReq.messages),
      generationConfig: {}
    };

    // Translate generation parameters
    if (anthropicReq.max_tokens) {
      geminiRequest.generationConfig!.maxOutputTokens = anthropicReq.max_tokens;
    }
    
    if (anthropicReq.temperature !== undefined) {
      geminiRequest.generationConfig!.temperature = anthropicReq.temperature;
    }
    
    if (anthropicReq.top_p !== undefined) {
      geminiRequest.generationConfig!.topP = anthropicReq.top_p;
    }
    
    if (anthropicReq.top_k !== undefined) {
      geminiRequest.generationConfig!.topK = anthropicReq.top_k;
    }

    if (anthropicReq.stop_sequences && anthropicReq.stop_sequences.length > 0) {
      geminiRequest.generationConfig!.stopSequences = anthropicReq.stop_sequences;
    }

    // Handle system prompt
    if (anthropicReq.system) {
      geminiRequest.systemInstruction = {
        parts: [{ text: anthropicReq.system }]
      };
    }

    return geminiRequest;
  }

  private translateMessages(messages: AnthropicMessage[]): GeminiContent[] {
    const geminiContents: GeminiContent[] = [];

    for (const message of messages) {
      const role = message.role === 'user' ? 'user' : 'model';
      const parts: Array<{ text?: string; inlineData?: any }> = [];

      // Handle different content types
      if (typeof message.content === 'string') {
        parts.push({ text: message.content });
      } else if (Array.isArray(message.content)) {
        for (const block of message.content) {
          if (block.type === 'text' && block.text) {
            parts.push({ text: block.text });
          } else if (block.type === 'image' && block.source) {
            // Handle image content
            parts.push({
              inlineData: {
                mimeType: block.source.media_type || 'image/jpeg',
                data: block.source.data
              }
            });
          }
        }
      }

      geminiContents.push({ role, parts });
    }

    return geminiContents;
  }

  translateResponse(geminiResp: GeminiResponse, requestId: string, model: string): AnthropicResponse {
    const candidate = geminiResp.candidates?.[0];
    
    if (!candidate) {
      throw new Error('No response candidate from Gemini');
    }

    // Extract text from parts
    const textParts = candidate.content.parts
      .filter(part => part.text)
      .map(part => part.text)
      .join('');

    // Map finish reasons
    const stopReason = this.mapFinishReason(candidate.finishReason);

    // Build Anthropic response
    const response: AnthropicResponse = {
      id: requestId,
      type: 'message',
      role: 'assistant',
      content: [{
        type: 'text',
        text: textParts
      }],
      model: model,
      stop_reason: stopReason,
      usage: {
        input_tokens: geminiResp.usageMetadata?.promptTokenCount || 0,
        output_tokens: geminiResp.usageMetadata?.candidatesTokenCount || 0
      }
    };

    return response;
  }

  private mapFinishReason(geminiReason: string): 'end_turn' | 'max_tokens' | 'stop_sequence' {
    switch (geminiReason) {
      case 'STOP':
        return 'end_turn';
      case 'MAX_TOKENS':
        return 'max_tokens';
      case 'SAFETY':
      case 'RECITATION':
        return 'stop_sequence';
      default:
        return 'end_turn';
    }
  }

  /**
   * Translates streaming chunk from Gemini to Anthropic SSE format
   */
  translateStreamChunk(geminiChunk: any, eventType: string): string {
    const events: string[] = [];

    if (eventType === 'start') {
      events.push(`event: message_start`);
      events.push(`data: ${JSON.stringify({
        type: 'message_start',
        message: {
          id: `msg_${Date.now()}`,
          type: 'message',
          role: 'assistant',
          content: [],
          model: 'gemini',
          usage: { input_tokens: 0, output_tokens: 0 }
        }
      })}\n`);

      events.push(`event: content_block_start`);
      events.push(`data: ${JSON.stringify({
        type: 'content_block_start',
        index: 0,
        content_block: { type: 'text', text: '' }
      })}\n`);
    } else if (eventType === 'delta' && geminiChunk.candidates?.[0]?.content?.parts?.[0]?.text) {
      const text = geminiChunk.candidates[0].content.parts[0].text;
      events.push(`event: content_block_delta`);
      events.push(`data: ${JSON.stringify({
        type: 'content_block_delta',
        index: 0,
        delta: { type: 'text_delta', text }
      })}\n`);
    } else if (eventType === 'end') {
      events.push(`event: content_block_stop`);
      events.push(`data: ${JSON.stringify({
        type: 'content_block_stop',
        index: 0
      })}\n`);

      const usage = geminiChunk.usageMetadata || {};
      events.push(`event: message_delta`);
      events.push(`data: ${JSON.stringify({
        type: 'message_delta',
        delta: { stop_reason: 'end_turn' },
        usage: { output_tokens: usage.candidatesTokenCount || 0 }
      })}\n`);

      events.push(`event: message_stop`);
      events.push(`data: ${JSON.stringify({ type: 'message_stop' })}\n`);
    }

    return events.join('\n') + '\n';
  }
}
