import Conf from 'conf';
import { ProxyConfig, GeminiModel, ModelInfo } from './types.js';
import * as fs from 'fs';
import * as path from 'path';

export const MODELS: Record<GeminiModel, ModelInfo> = {
  'gemini-2.5-flash': {
    name: 'gemini-2.5-flash',
    displayName: 'Gemini 2.5 Flash',
    contextWindow: 1048576,
    maxOutputTokens: 8192,
    description: 'Best price-performance for large-scale processing and low-latency tasks'
  },
  'gemini-2.5-pro': {
    name: 'gemini-2.5-pro',
    displayName: 'Gemini 2.5 Pro',
    contextWindow: 2097152,
    maxOutputTokens: 8192,
    description: 'Advanced thinking model for complex reasoning and large datasets'
  },
  'gemini-3-pro-preview': {
    name: 'gemini-3-pro-preview',
    displayName: 'Gemini 3 Pro Preview',
    contextWindow: 2097152,
    maxOutputTokens: 8192,
    description: 'Most intelligent model for multimodal understanding and agentic tasks'
  }
};

export const DEFAULT_CONFIG: Partial<ProxyConfig> = {
  port: 8080,
  location: 'us-central1',
  model: 'gemini-2.5-flash',
  authMethod: 'adc'
};

class ConfigManager {
  private config: Conf<ProxyConfig>;

  constructor() {
    this.config = new Conf<ProxyConfig>({
      projectName: 'gemini-proxy',
      defaults: DEFAULT_CONFIG as ProxyConfig
    });
  }

  get(): ProxyConfig | null {
    const projectId = this.config.get('projectId');
    if (!projectId) return null;
    
    return {
      projectId: this.config.get('projectId'),
      location: this.config.get('location'),
      model: this.config.get('model'),
      authMethod: this.config.get('authMethod'),
      serviceAccountPath: this.config.get('serviceAccountPath'),
      port: this.config.get('port')
    };
  }

  set(config: ProxyConfig): void {
    this.config.set(config);
  }

  clear(): void {
    this.config.clear();
  }

  validateServiceAccountPath(filePath: string): boolean {
    try {
      if (!fs.existsSync(filePath)) {
        return false;
      }
      const content = fs.readFileSync(filePath, 'utf-8');
      const json = JSON.parse(content);
      return json.type === 'service_account' && json.project_id && json.private_key;
    } catch {
      return false;
    }
  }

  getConfigPath(): string {
    return this.config.path;
  }
}

export const configManager = new ConfigManager();
