/**
 * Run command - Execute command with credentials bootstrapped as environment variables
 */

import { spawn } from 'node:child_process';
import { CredentialsManager, FileStorage } from '@libertas/core';
import { Formatter } from '../utils/formatter';
import { getMasterKey } from '../utils/local-key-storage';

export async function runCommand(name: string, args: string[]): Promise<void> {
  try {
    // Get master key
    const masterKey = await getMasterKey(name);
    if (!masterKey) {
      console.log(Formatter.error(`✗ No master key found for credentials set "${name}"`));
      console.log(Formatter.info(`Create it first: libertas create ${name}`));
      process.exit(1);
    }

    // Load credentials
    const storageDir = './credentials';
    const storage = new FileStorage(storageDir);
    const manager = new CredentialsManager({
      masterKey,
      storageBackend: storage,
      environment: name,
    });

    let credentials: Record<string, any>;
    try {
      credentials = await manager.load(name);
    } catch (error) {
      throw new Error(`Failed to load credentials for "${name}": ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    if (!credentials || Object.keys(credentials).length === 0) {
      throw new Error(`No credentials found for "${name}". Run: libertas edit ${name}`);
    }

    // Flatten credentials for environment variables
    const env: Record<string, string> = {};
    for (const [key, value] of Object.entries(process.env)) {
      if (value !== undefined) {
        env[key] = value;
      }
    }

    // Add credentials to environment
    for (const [key, value] of Object.entries(credentials)) {
      const envKey = key.toUpperCase();
      if (typeof value === 'object' && value !== null) {
        env[envKey] = JSON.stringify(value);
      } else {
        env[envKey] = String(value || '');
      }
    }

    // Execute command
    const command = args[0];
    const commandArgs = args.slice(1);

    const child = spawn(command, commandArgs, {
      env,
      stdio: 'inherit',
      shell: true,
    });

    // Handle exit
    child.on('error', (error) => {
      console.error(Formatter.error(`Failed to execute command: ${error.message}`));
      process.exit(1);
    });

    child.on('exit', (code) => {
      process.exit(code ?? 0);
    });
  } catch (error) {
    console.error(Formatter.error(error instanceof Error ? error.message : 'Unknown error'));
    process.exit(1);
  }
}
