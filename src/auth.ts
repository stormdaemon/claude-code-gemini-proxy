import { GoogleAuth } from 'google-auth-library';
import * as fs from 'fs';
import { ProxyConfig } from './types';

export class AuthManager {
  private auth: GoogleAuth;
  private config: ProxyConfig;

  constructor(config: ProxyConfig) {
    this.config = config;
    this.auth = this.createAuth();
  }

  private createAuth(): GoogleAuth {
    const authConfig: any = {
      scopes: ['https://www.googleapis.com/auth/cloud-platform']
    };

    switch (this.config.authMethod) {
      case 'service-account':
        if (!this.config.serviceAccountPath) {
          throw new Error('Service account path is required for service-account auth method');
        }
        if (!fs.existsSync(this.config.serviceAccountPath)) {
          throw new Error(`Service account file not found: ${this.config.serviceAccountPath}`);
        }
        authConfig.keyFilename = this.config.serviceAccountPath;
        break;

      case 'gcloud':
      case 'adc':
        // Use Application Default Credentials (looks for GOOGLE_APPLICATION_CREDENTIALS env var or gcloud config)
        break;

      default:
        throw new Error(`Unknown auth method: ${this.config.authMethod}`);
    }

    return new GoogleAuth(authConfig);
  }

  async getAccessToken(): Promise<string> {
    try {
      const client = await this.auth.getClient();
      const accessToken = await client.getAccessToken();
      
      if (!accessToken.token) {
        throw new Error('Failed to get access token');
      }

      return accessToken.token;
    } catch (error: any) {
      throw new Error(`Authentication failed: ${error.message}`);
    }
  }

  async testAuth(): Promise<{ success: boolean; projectId?: string; error?: string }> {
    try {
      const token = await this.getAccessToken();
      const projectId = await this.auth.getProjectId();
      
      return {
        success: true,
        projectId
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getProjectId(): Promise<string> {
    try {
      return await this.auth.getProjectId();
    } catch (error: any) {
      return this.config.projectId;
    }
  }
}
