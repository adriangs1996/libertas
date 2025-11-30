/**
 * Configuration loader for CLI
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import type { CLIConfig } from '../types';
import { getKeyFromKeychain } from './keychain';

const CONFIG_FILE_NAME = '.libertasrc';
const CONFIG_FILE_NAMES = ['.libertasrc', '.libertasrc.json', '.libertasrc.js'];

/**
 * Detect environment from environment variables or defaults
 * Priority: LIBERTAS_ENV > NODE_ENV > RAILS_ENV > ENVIRONMENT > default
 */
function detectEnvironment(): string {
  return (
    process.env.LIBERTAS_ENV ||
    process.env.NODE_ENV ||
    process.env.RAILS_ENV ||
    process.env.ENVIRONMENT ||
    'development'
  );
}

/**
 * Load CLI configuration from environment, keychain, and config files
 *
 * Priority for environment detection:
 * 1. LIBERTAS_ENV environment variable
 * 2. NODE_ENV environment variable
 * 3. RAILS_ENV environment variable
 * 4. defaultEnvironment from .libertasrc
 * 5. 'development' (hardcoded default)
 *
 * Priority for configuration values:
 * 1. Environment Variables (LIBERTAS_ENV, LIBERTAS_MASTER_KEY, LIBERTAS_STORAGE_PATH)
 * 2. Environment-specific config in .libertasrc (via environments.{env} field)
 * 3. Keychain (scoped by projectName-environment)
 * 4. Root-level config in .libertasrc
 * 5. Defaults
 *
 * Example .libertasrc with multiple environments:
 * {
 *   "projectName": "my-app",
 *   "defaultEnvironment": "development",
 *   "storagePath": "./credentials",
 *   "environments": {
 *     "development": { "storagePath": "./credentials" },
 *     "production": { "storagePath": "./credentials/prod" }
 *   }
 * }
 */
export async function loadConfig(cwd: string = process.cwd()): Promise<CLIConfig> {
  // Build environment config only with explicitly set values
  const envConfig: CLIConfig = {};
  if (process.env.LIBERTAS_ENV) {
    envConfig.environment = process.env.LIBERTAS_ENV;
  }
  if (process.env.LIBERTAS_STORAGE_PATH) {
    envConfig.storagePath = process.env.LIBERTAS_STORAGE_PATH;
  }
  if (process.env.LIBERTAS_MASTER_KEY) {
    envConfig.masterKey = process.env.LIBERTAS_MASTER_KEY;
  }

  // Try to load from config file
  let fileConfig: CLIConfig | null = null;
  let keychainKey: string | null = null;

  // First pass: read config file
  for (const configFileName of CONFIG_FILE_NAMES) {
    try {
      const configPath = path.join(cwd, configFileName);
      const content = await fs.readFile(configPath, 'utf-8');
      fileConfig = JSON.parse(content);
      break;
    } catch {
      continue;
    }
  }

  // Determine the active environment
  // Priority: LIBERTAS_ENV (from envConfig.environment) > defaultEnvironment from file > detectEnvironment()
  const activeEnvironment = envConfig.environment || fileConfig?.defaultEnvironment || detectEnvironment();

  // Try to get environment-specific config from .libertasrc
  let envSpecificConfig: any = null;
  if (fileConfig?.environments && fileConfig.environments[activeEnvironment]) {
    envSpecificConfig = fileConfig.environments[activeEnvironment];
  }

  // Try to get master key from keychain if not in environment or env-specific config
  if (!envConfig.masterKey && !envSpecificConfig?.masterKey) {
    try {
      const projectName = fileConfig?.projectName || 'default';
      // Construct scope using project name for better organization
      const scope = projectName === 'default' ? activeEnvironment : `${projectName}-${activeEnvironment}`;
      keychainKey = await getKeyFromKeychain(scope);
    } catch {
      // Keychain access failed, continue without it
    }
  }

  // If we found a file config, merge all sources
  if (fileConfig) {
    // Start with root-level file config
    let merged: CLIConfig = {
      ...fileConfig,
    };

    // Apply environment-specific config (overrides root level)
    if (envSpecificConfig) {
      merged = {
        ...merged,
        ...envSpecificConfig,
        projectName: fileConfig.projectName,
      };
    }

    // Apply environment variables (highest priority)
    merged = {
      ...merged,
      ...envConfig,
    };

    // Apply master key priority
    if (merged.masterKey) {
      // Already has a master key (env var or specific config)
    } else if (keychainKey) {
      merged.masterKey = keychainKey;
    }

    // Ensure storagePath has a value
    if (!merged.storagePath) {
      merged.storagePath = './credentials';
    }

    // Remove environments and defaultEnvironment from returned config (internal only)
    // Set active environment for runtime use
    const { environments, defaultEnvironment, ...resultConfig } = merged;
    const finalConfig: CLIConfig = {
      ...resultConfig,
      environment: activeEnvironment,
    };

    return finalConfig;
  }

  // Return environment config with defaults (no file config found)
  return {
    environment: activeEnvironment,
    storagePath: envConfig.storagePath || './credentials',
    masterKey: envConfig.masterKey || keychainKey || undefined,
  };
}

/**
 * Save CLI configuration to file
 */
export async function saveConfig(config: CLIConfig, cwd: string = process.cwd()): Promise<void> {
  const configPath = path.join(cwd, CONFIG_FILE_NAME);

  try {
    await fs.writeFile(configPath, JSON.stringify(config, null, 2), 'utf-8');
  } catch (error) {
    throw new Error(`Failed to save config: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export default {
  loadConfig,
  saveConfig,
};
