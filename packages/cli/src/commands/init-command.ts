/**
 * Init command for setting up libertas credentials management
 * Guides users through project-specific configuration and master key setup
 */

import { createInterface, Interface } from 'node:readline';
import path from 'node:path';
import { CryptoUtils } from '@libertas/core';
import { saveKeyToKeychain } from '../utils/keychain';
import { saveConfig } from '../utils/config-loader';
import { Formatter } from '../utils/formatter';
import type { CLIConfig } from '../types';

/**
 * Create a readline interface for user prompts
 */
function createPromptInterface(): Interface {
  return createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

/**
 * Prompt user with a yes/no question
 */
async function promptYesNo(rl: Interface, question: string): Promise<boolean> {
  return new Promise((resolve) => {
    rl.question(question + ' (y/n): ', (answer: string) => {
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

/**
 * Prompt user for input with optional default
 */
async function promptInput(rl: Interface, question: string, defaultValue?: string): Promise<string> {
  return new Promise((resolve) => {
    const displayQuestion = defaultValue ? `${question} [${defaultValue}]: ` : question;
    rl.question(displayQuestion, (answer: string) => {
      const trimmed = answer.trim();
      resolve(trimmed || defaultValue || '');
    });
  });
}

/**
 * Initialize libertas setup (project-specific)
 */
export async function initCommand(isGlobal: boolean = false): Promise<void> {
  const rl = createPromptInterface();

  try {
    console.log('\n' + Formatter.header('⚙️  Libertas Setup Wizard'));
    const scopeType = isGlobal ? 'global (user-wide)' : 'project-specific';
    console.log(Formatter.info(`Setting up ${scopeType} configuration.\n`));

    // Get project name
    const projectName = isGlobal
      ? 'default'
      : await promptInput(rl, Formatter.info('Project name'), 'my-project');

    // Get storage path
    const defaultStoragePath = './credentials';
    const storagePath = await promptInput(
      rl,
      Formatter.info('Credentials storage path'),
      defaultStoragePath
    );

    // Ask if they want to generate a new master key
    const generateNew = await promptYesNo(
      rl,
      Formatter.info('\nWould you like to generate a new master key?')
    );

    let masterKey: string;

    if (generateNew) {
      masterKey = CryptoUtils.generateMasterKey();
      console.log(Formatter.success('\n✓ Master key generated'));
    } else {
      masterKey = await promptInput(rl, Formatter.info('\nEnter your master key (64 hex characters)'));

      // Validate format
      if (!/^[a-f0-9]{64}$/.test(masterKey)) {
        console.log(Formatter.error('✗ Invalid master key format. Must be 64 hex characters.'));
        rl.close();
        process.exit(1);
      }
    }

    // Ask which environments to set up
    console.log(Formatter.info('\nChoose environments to set up:'));

    const environments: string[] = [];
    const defaultEnvs = ['development', 'staging', 'production'];

    for (const env of defaultEnvs) {
      const add = await promptYesNo(rl, Formatter.info(`  Add ${env}?`));
      if (add) {
        environments.push(env);
      }
    }

    // Ask for custom environments
    const addCustom = await promptYesNo(rl, Formatter.info('  Add custom environment?'));
    if (addCustom) {
      const customEnv = await promptInput(rl, Formatter.info('    Enter environment name'));
      if (customEnv) {
        environments.push(customEnv);
      }
    }

    if (environments.length === 0) {
      console.log(Formatter.warning('No environments selected. Using development as default.'));
      environments.push('development');
    }

    // Save to keychain with project scope
    console.log('\n' + Formatter.info('Saving master keys to system keychain...'));

    let savedCount = 0;
    for (const env of environments) {
      // Use project name as scope for organization
      const scope = isGlobal ? env : `${projectName}-${env}`;
      const saved = await saveKeyToKeychain(masterKey, scope);
      if (saved) {
        console.log(Formatter.success(`  ✓ Saved for ${env}`));
        savedCount++;
      } else {
        console.log(Formatter.error(`  ✗ Failed to save for ${env}`));
      }
    }

    if (savedCount === 0) {
      console.log(Formatter.error('\n✗ Failed to save master key to keychain'));
      rl.close();
      process.exit(1);
    }

    // Save project config to .libertasrc
    if (!isGlobal) {
      console.log(Formatter.info('\nSaving project configuration...'));

      const config: CLIConfig = {
        projectName,
        environment: 'development',
        storagePath,
      };

      try {
        await saveConfig(config, process.cwd());
        console.log(Formatter.success('  ✓ Created .libertasrc'));
      } catch (error) {
        console.log(
          Formatter.warning('  ⚠ Could not save project config: ' + (error instanceof Error ? error.message : 'Unknown error'))
        );
      }
    }

    // Success message
    console.log('\n' + Formatter.success('✓ Libertas setup complete!\n'));
    console.log(Formatter.info('Project: ' + projectName));
    console.log(Formatter.info('Storage: ' + storagePath));
    console.log(Formatter.info('Environments: ' + environments.join(', ')));
    console.log(Formatter.info('\nYou can now use libertas commands:'));
    console.log(Formatter.info('  libertas list              - List all credentials'));
    console.log(Formatter.info('  libertas open database     - Edit database credentials'));
    console.log(Formatter.info('  libertas show api-keys     - Display API keys'));
    console.log(Formatter.info('  libertas --help            - Show all commands\n'));

    rl.close();
  } catch (error) {
    console.log(Formatter.error(`Setup failed: ${error instanceof Error ? error.message : 'Unknown error'}`));
    rl.close();
    process.exit(1);
  }
}
