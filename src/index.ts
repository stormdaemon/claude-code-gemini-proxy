#!/usr/bin/env node
import { ProxyServer } from './server';
import { configManager } from './config';

async function main() {
  const config = configManager.get();

  if (!config) {
    console.error('❌ No configuration found!');
    console.error('Please run: gemini-proxy setup');
    process.exit(1);
  }

  try {
    const server = new ProxyServer(config);
    await server.start();

    // Handle graceful shutdown
    const shutdown = async () => {
      console.log('\n🛑 Shutting down...');
      await server.stop();
      process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);

  } catch (error: any) {
    console.error('❌ Failed to start proxy:', error.message);
    process.exit(1);
  }
}

main();
