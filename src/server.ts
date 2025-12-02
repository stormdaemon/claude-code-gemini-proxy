import Fastify, { FastifyReply, FastifyRequest } from 'fastify';
import cors from '@fastify/cors';
import { GeminiClient } from './gemini-client.js';
import { ApiTranslator } from './translator.js';
import { ProxyConfig, AnthropicRequest } from './types.js';
import { randomBytes } from 'crypto';

export class ProxyServer {
  private app;
  private geminiClient: GeminiClient;
  private translator: ApiTranslator;
  private config: ProxyConfig;

  constructor(config: ProxyConfig) {
    this.config = config;
    this.app = Fastify({ logger: false });
    this.geminiClient = new GeminiClient(config);
    this.translator = new ApiTranslator();
    this.setupRoutes();
  }

  private setupRoutes() {
    // Enable CORS
    this.app.register(cors, {
      origin: '*',
      methods: ['GET', 'POST', 'OPTIONS']
    });

    // Health check
    this.app.get('/health', async () => {
      return { status: 'ok', model: this.config.model };
    });

    // Main Anthropic Messages API endpoint
    this.app.post('/v1/messages', async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const anthropicReq = request.body as AnthropicRequest;
        
        // Validate request
        if (!anthropicReq.messages || !Array.isArray(anthropicReq.messages)) {
          reply.code(400).send({ 
            error: { 
              type: 'invalid_request_error',
              message: 'messages field is required and must be an array' 
            }
          });
          return;
        }

        // Translate request
        const geminiReq = this.translator.translateRequest(anthropicReq);
        
        // Handle streaming
        if (anthropicReq.stream) {
          return this.handleStreamingRequest(geminiReq, reply);
        }

        // Handle non-streaming
        return this.handleNonStreamingRequest(geminiReq, anthropicReq.model || 'gemini', reply);
        
      } catch (error: any) {
        console.error('Error processing request:', error);
        reply.code(500).send({
          error: {
            type: 'api_error',
            message: error.message || 'Internal server error'
          }
        });
      }
    });

    // Models endpoint (for compatibility)
    this.app.get('/v1/models', async () => {
      return {
        data: [{
          id: this.config.model,
          object: 'model',
          created: Date.now(),
          owned_by: 'google'
        }]
      };
    });
  }

  private async handleNonStreamingRequest(geminiReq: any, model: string, reply: FastifyReply) {
    try {
      const geminiResp = await this.geminiClient.generateContent(geminiReq);
      const requestId = `msg_${randomBytes(16).toString('hex')}`;
      const anthropicResp = this.translator.translateResponse(geminiResp, requestId, model);
      
      reply.code(200).send(anthropicResp);
    } catch (error: any) {
      throw error;
    }
  }

  private async handleStreamingRequest(geminiReq: any, reply: FastifyReply) {
    try {
      reply.raw.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      });

      // Send initial message_start event
      reply.raw.write(this.translator.translateStreamChunk({}, 'start'));

      // Stream responses from Gemini
      let isFirst = true;
      for await (const chunk of this.geminiClient.streamGenerateContent(geminiReq)) {
        const eventType = isFirst ? 'delta' : 'delta';
        isFirst = false;
        
        const sseData = this.translator.translateStreamChunk(chunk, eventType);
        reply.raw.write(sseData);
      }

      // Send final events
      reply.raw.write(this.translator.translateStreamChunk({}, 'end'));
      reply.raw.end();
      
    } catch (error: any) {
      console.error('Streaming error:', error);
      const errorEvent = `event: error\ndata: ${JSON.stringify({ 
        type: 'error',
        error: { type: 'api_error', message: error.message }
      })}\n\n`;
      reply.raw.write(errorEvent);
      reply.raw.end();
    }
  }

  async start(): Promise<void> {
    try {
      await this.app.listen({ 
        port: this.config.port, 
        host: '0.0.0.0' 
      });
      console.log(`✅ Gemini Proxy running on http://localhost:${this.config.port}`);
      console.log(`📡 Model: ${this.config.model}`);
      console.log(`🌍 Region: ${this.config.location}`);
      console.log(`\n💡 Configure Claude Code with:`);
      console.log(`   export ANTHROPIC_BASE_URL=http://localhost:${this.config.port}`);
      console.log(`   export ANTHROPIC_API_KEY=dummy-key\n`);
    } catch (error) {
      console.error('Failed to start server:', error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    await this.app.close();
  }

  getApp() {
    return this.app;
  }
}
