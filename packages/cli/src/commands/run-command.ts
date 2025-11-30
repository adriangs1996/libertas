/**
 * Run command for executing applications with injected credentials
 * Loads credentials and injects them as environment variables at runtime
 */

import { spawn } from 'node:child_process';
import { CredentialsManager, credentialsToEnv, FileStorage } from '@libertas/core';
import { loadConfig } from '../utils/config-loader';
import { Formatter } from '../utils/formatter';

/**
 * Options for run command
 */
export interface RunCommandOptions {
  scope?: string;
  verbose?: boolean;
  args: string[];
}

/**
 * Detect environment from common env vars
 */
function detectEnvironment(): string {
  // Check common environment variable names
  return (
    process.env.NODE_ENV ||
    process.env.ENVIRONMENT ||
    process.env.ENV ||
    process.env.LIBERTAS_ENV ||
    process.env.RAILS_ENV ||
    'development'
  );
}

/**
 * Get master key from multiple sources
 */
function getMasterKey(): string | null {
  // Check explicit environment variable
  if (process.env.LIBERTAS_MASTER_KEY) {
    return process.env.LIBERTAS_MASTER_KEY;
  }

  // Could check keychain here for development, but in Docker we expect LIBERTAS_MASTER_KEY
  return null;
}

/**
 * Run a command with credentials injected as environment variables
 * Usage: libertas run [--scope <scope>] -- <command> [args...]
 *
 * Examples:
 *   libertas run -- python app.py
 *   libertas run -- npm start
 *   libertas run production -- ./myapp
 *   NODE_ENV=staging libertas run -- node server.js
 */
export async function runCommand(options: RunCommandOptions): Promise<void> {
  if (!options.args || options.args.length === 0) {
    throw new Error('No command specified. Usage: libertas run -- <command> [args...]');
  }

  const command = options.args[0];
  const commandArgs = options.args.slice(1);

  try {
    // Determine scope: explicit > env var > default
    const scope = options.scope || detectEnvironment();

    if (options.verbose) {
      console.log(Formatter.info(`Loading credentials for scope: ${scope}`));
    }

    // Load configuration
    const config = await loadConfig(process.cwd());

    // Get master key
    let masterKey = config.masterKey || getMasterKey();

    if (!masterKey) {
      throw new Error('Master key not found. Set LIBERTAS_MASTER_KEY environment variable or run "libertas init"');
    }

    // Create manager with file storage backend
    const storageDir = config.storagePath || './credentials';
    const storage = new FileStorage(storageDir);
    const manager = new CredentialsManager({
      masterKey,
      storageBackend: storage,
      environment: scope,
    });

    // Load credentials for the scope
    let credentials: Record<string, any>;
    try {
      credentials = await manager.load(scope);
    } catch (error) {
      throw new Error(
        `Failed to load credentials for scope "${scope}": ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }

    if (!credentials || Object.keys(credentials).length === 0) {
      throw new Error(`No credentials found for scope "${scope}"`);
    }

    if (options.verbose) {
      console.log(Formatter.success(`✓ Loaded ${Object.keys(credentials).length} credential(s)`));
      console.log(Formatter.info(`Executing: ${command} ${commandArgs.join(' ')}`));
    }

    // Prepare environment variables
    const env = {
      ...process.env,
      // Flatten nested credentials and add to environment
      ...flattenCredentialsForEnv(credentials),
    };

    // Execute command with injected environment
    const child = spawn(command, commandArgs, {
      env,
      stdio: 'inherit', // Inherit stdio for proper output
      shell: true, // Allow shell commands
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

/**
 * Flatten nested credentials object into flat key=value pairs
 * Similar to credentialsToEnv but returns object instead of string
 */
function flattenCredentialsForEnv(credentials: Record<string, any>): Record<string, string> {
  const result: Record<string, string> = {};

  function flattenEntry(key: string, value: any, prefix: string = ''): void {
    const fullKey = prefix ? `${prefix}_${key}`.toUpperCase() : key.toUpperCase();

    if (value === null || value === undefined) {
      return;
    }

    if (typeof value === 'object' && !Array.isArray(value)) {
      // Recursively flatten nested objects
      for (const [nestedKey, nestedValue] of Object.entries(value)) {
        flattenEntry(nestedKey, nestedValue, fullKey);
      }
    } else if (Array.isArray(value)) {
      // Convert arrays to JSON string
      result[fullKey] = JSON.stringify(value);
    } else {
      // Convert primitives to strings
      result[fullKey] = String(value);
    }
  }

  for (const [key, value] of Object.entries(credentials)) {
    flattenEntry(key, value);
  }

  return result;
}
