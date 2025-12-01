#!/usr/bin/env node
import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { configManager, MODELS } from './config';
import { AuthManager } from './auth';
import { ProxyConfig, GeminiModel } from './types';
import { ProxyServer } from './server';
import * as fs from 'fs';
import * as path from 'path';

const program = new Command();

program
  .name('gemini-proxy')
  .description('Use Google Gemini in Claude Code via Vertex AI')
  .version('1.0.0');

// Setup command
program
  .command('setup')
  .description('Interactive setup wizard')
  .action(async () => {
    console.log(chalk.bold.cyan('\n🚀 Gemini Proxy Setup Wizard\n'));

    try {
      const answers = await inquirer.prompt([
        {
          type: 'list',
          name: 'model',
          message: 'Choose a Gemini model:',
          choices: [
            {
              name: `${chalk.yellow('⚡')} Gemini 2.0 Flash - Fast & efficient (recommended)`,
              value: 'gemini-2.0-flash-exp'
            },
            {
              name: `${chalk.blue('💎')} Gemini 2.0 Pro - Balanced performance`,
              value: 'gemini-2.0-pro-exp'
            },
            {
              name: `${chalk.magenta('🔬')} Gemini Exp 1206 - Experimental & powerful`,
              value: 'gemini-exp-1206'
            }
          ]
        },
        {
          type: 'list',
          name: 'authMethod',
          message: 'Choose authentication method:',
          choices: [
            {
              name: 'Application Default Credentials (easiest - uses gcloud)',
              value: 'adc'
            },
            {
              name: 'Service Account JSON file',
              value: 'service-account'
            }
          ]
        },
        {
          type: 'input',
          name: 'serviceAccountPath',
          message: 'Path to service account JSON file:',
          when: (answers) => answers.authMethod === 'service-account',
          validate: (input) => {
            if (!input) return 'Path is required';
            const expandedPath = input.replace(/^~/, process.env.HOME || '');
            if (!fs.existsSync(expandedPath)) {
              return `File not found: ${expandedPath}`;
            }
            if (!configManager.validateServiceAccountPath(expandedPath)) {
              return 'Invalid service account file';
            }
            return true;
          }
        },
        {
          type: 'input',
          name: 'projectId',
          message: 'GCP Project ID:',
          validate: (input) => input ? true : 'Project ID is required'
        },
        {
          type: 'list',
          name: 'location',
          message: 'Choose GCP region:',
          choices: [
            { name: 'us-central1 (Iowa)', value: 'us-central1' },
            { name: 'us-east4 (Virginia)', value: 'us-east4' },
            { name: 'europe-west1 (Belgium)', value: 'europe-west1' },
            { name: 'europe-west4 (Netherlands)', value: 'europe-west4' },
            { name: 'asia-southeast1 (Singapore)', value: 'asia-southeast1' }
          ]
        },
        {
          type: 'number',
          name: 'port',
          message: 'Proxy port:',
          default: 8080
        }
      ]);

      // Expand ~ in path
      if (answers.serviceAccountPath) {
        answers.serviceAccountPath = answers.serviceAccountPath.replace(
          /^~/,
          process.env.HOME || ''
        );
      }

      const config: ProxyConfig = answers as ProxyConfig;

      // Test authentication
      console.log(chalk.yellow('\n🔐 Testing authentication...'));
      const authManager = new AuthManager(config);
      const authTest = await authManager.testAuth();

      if (!authTest.success) {
        console.error(chalk.red(`\n❌ Authentication failed: ${authTest.error}`));
        console.log(chalk.yellow('\nTroubleshooting:'));
        console.log('  • Run: gcloud auth application-default login');
        console.log('  • Or provide a valid service account JSON file');
        process.exit(1);
      }

      console.log(chalk.green(`✅ Authentication successful! Project: ${authTest.projectId}`));

      // Save configuration
      configManager.set(config);
      console.log(chalk.green('✅ Configuration saved!\n'));

      // Ask if user wants to start now
      const { startNow } = await inquirer.prompt([{
        type: 'confirm',
        name: 'startNow',
        message: 'Start the proxy server now?',
        default: true
      }]);

      if (startNow) {
        console.log(chalk.cyan('\n🚀 Starting proxy server...\n'));
        const server = new ProxyServer(config);
        await server.start();
      } else {
        console.log(chalk.cyan('\n💡 To start the proxy later, run:'));
        console.log(chalk.white('   gemini-proxy start\n'));
      }

    } catch (error: any) {
      if (error.isTtyError) {
        console.error(chalk.red('Prompt couldn\'t be rendered in this environment'));
      } else {
        console.error(chalk.red(`Error: ${error.message}`));
      }
      process.exit(1);
    }
  });

// Start command
program
  .command('start')
  .description('Start the proxy server')
  .action(async () => {
    const config = configManager.get();
    
    if (!config) {
      console.error(chalk.red('❌ No configuration found!'));
      console.log(chalk.yellow('Run: gemini-proxy setup'));
      process.exit(1);
    }

    try {
      const server = new ProxyServer(config);
      await server.start();
    } catch (error: any) {
      console.error(chalk.red(`❌ Failed to start: ${error.message}`));
      process.exit(1);
    }
  });

// Status command
program
  .command('status')
  .description('Show current configuration')
  .action(() => {
    const config = configManager.get();
    
    if (!config) {
      console.log(chalk.yellow('⚠️  No configuration found'));
      console.log(chalk.cyan('Run: gemini-proxy setup'));
      return;
    }

    console.log(chalk.bold.cyan('\n📊 Gemini Proxy Configuration\n'));
    console.log(chalk.white(`Model:        ${chalk.green(config.model)}`));
    console.log(chalk.white(`Project ID:   ${chalk.green(config.projectId)}`));
    console.log(chalk.white(`Region:       ${chalk.green(config.location)}`));
    console.log(chalk.white(`Auth Method:  ${chalk.green(config.authMethod)}`));
    console.log(chalk.white(`Port:         ${chalk.green(config.port)}`));
    
    if (config.serviceAccountPath) {
      console.log(chalk.white(`Service Acct: ${chalk.green(config.serviceAccountPath)}`));
    }

    const modelInfo = MODELS[config.model];
    console.log(chalk.white(`\nModel Info:`));
    console.log(chalk.white(`  ${modelInfo.displayName}`));
    console.log(chalk.white(`  ${modelInfo.description}`));
    console.log(chalk.white(`  Context: ${modelInfo.contextWindow.toLocaleString()} tokens`));
    
    console.log(chalk.cyan('\n💡 To use with Claude Code:'));
    console.log(chalk.white(`   export ANTHROPIC_BASE_URL=http://localhost:${config.port}`));
    console.log(chalk.white(`   export ANTHROPIC_API_KEY=dummy-key\n`));
  });

// Test command
program
  .command('test')
  .description('Test connection to Vertex AI')
  .action(async () => {
    const config = configManager.get();
    
    if (!config) {
      console.error(chalk.red('❌ No configuration found!'));
      process.exit(1);
    }

    console.log(chalk.yellow('🧪 Testing connection to Vertex AI...\n'));

    try {
      const authManager = new AuthManager(config);
      const authTest = await authManager.testAuth();

      if (!authTest.success) {
        console.error(chalk.red(`❌ Auth failed: ${authTest.error}`));
        process.exit(1);
      }

      console.log(chalk.green(`✅ Authentication OK`));
      console.log(chalk.green(`✅ Project: ${authTest.projectId}`));
      console.log(chalk.green(`✅ Model: ${config.model}`));
      console.log(chalk.green(`✅ Region: ${config.location}\n`));

    } catch (error: any) {
      console.error(chalk.red(`❌ Test failed: ${error.message}`));
      process.exit(1);
    }
  });

// Reset command
program
  .command('reset')
  .description('Clear all configuration')
  .action(async () => {
    const { confirm } = await inquirer.prompt([{
      type: 'confirm',
      name: 'confirm',
      message: 'Are you sure you want to reset all configuration?',
      default: false
    }]);

    if (confirm) {
      configManager.clear();
      console.log(chalk.green('✅ Configuration cleared'));
    }
  });

program.parse();
