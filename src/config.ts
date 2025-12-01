import Conf from 'conf';
import { ProxyConfig, GeminiModel, ModelInfo } from './types';
import * as fs from 'fs';
import * as path from 'path';

export const MODELS: Record<GeminiModel, ModelInfo> = {
  'gemini-2.0-flash-exp': {
    name: 'gemini-2.0-flash-exp',
    displayName: 'Gemini 2.0 Flash',
    contextWindow: 1048576,
    maxOutputTokens: 8192,
    description: 'Fast and efficient model, best for quick responses'
  },
  'gemini-2.0-pro-exp': {
    name: 'gemini-2.0-pro-exp',
    displayName: 'Gemini 2.0 Pro',
    contextWindow: 2097152,
    maxOutputTokens: 8192,
    description: 'Balanced performance and quality'
  },
  'gemini-exp-1206': {
    name: 'gemini-exp-1206',
    displayName: 'Gemini Exp 1206',
    contextWindow: 2097152,
    maxOutputTokens: 8192,
    description: 'Experimental model with cutting-edge capabilities'
  }
};

export const DEFAULT_CONFIG: Partial<ProxyConfig> = {
  port: 8080,
  location: 'us-central1',
  model: 'gemini-2.0-flash-exp',
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
