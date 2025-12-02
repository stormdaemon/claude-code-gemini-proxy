import { AuthManager } from './auth.js';
import { ProxyConfig, GeminiRequest, GeminiResponse } from './types.js';
import { MODELS } from './config.js';

export class GeminiClient {
  private config: ProxyConfig;
  private authManager: AuthManager;
  private endpoint: string;

  constructor(config: ProxyConfig) {
    this.config = config;
    this.authManager = new AuthManager(config);
    this.endpoint = this.buildEndpoint();
  }

  private buildEndpoint(): string {
    const { projectId, location, model } = this.config;
    return `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${model}:generateContent`;
  }

  private buildStreamEndpoint(): string {
    const { projectId, location, model } = this.config;
    return `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${model}:streamGenerateContent`;
  }

  async generateContent(request: GeminiRequest): Promise<GeminiResponse> {
    const token = await this.authManager.getAccessToken();

    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    return data as GeminiResponse;
  }

  async *streamGenerateContent(request: GeminiRequest): AsyncGenerator<any> {
    const token = await this.authManager.getAccessToken();

    const response = await fetch(this.buildStreamEndpoint(), {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error (${response.status}): ${errorText}`);
    }

    if (!response.body) {
      throw new Error('No response body from Gemini API');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim() === '') continue;
          if (line.startsWith('data: ')) {
            try {
              const jsonStr = line.slice(6);
              const data = JSON.parse(jsonStr);
              yield data;
            } catch (e) {
              console.error('Failed to parse streaming JSON:', line);
            }
          } else {
            // Try to parse the line directly as JSON
            try {
              const data = JSON.parse(line);
              yield data;
            } catch (e) {
              // Skip non-JSON lines
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  getModelInfo() {
    return MODELS[this.config.model];
  }

  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      const testRequest: GeminiRequest = {
        contents: [{
          role: 'user',
          parts: [{ text: 'Hello' }]
        }],
        generationConfig: {
          maxOutputTokens: 10
        }
      };

      await this.generateContent(testRequest);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}
