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
 * Load CLI configuration from environment, keychain, and config files
 * Priority: Environment Variables > Keychain > Config File > Default
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

  // Try to load from config file first to get projectName and environment
  let fileConfig: CLIConfig | null = null;
  let keychainKey: string | null = null;

  // First pass: read config file for projectName and environment
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

  // Try to get master key from keychain if not in environment
  if (!envConfig.masterKey) {
    try {
      const projectName = fileConfig?.projectName || 'default';
      const environment = envConfig.environment || fileConfig?.environment || 'development';
      // Construct scope using project name for better organization
      const scope = projectName === 'default' ? environment : `${projectName}-${environment}`;
      keychainKey = await getKeyFromKeychain(scope);
    } catch {
      // Keychain access failed, continue without it
    }
  }

  // If we found a file config, use it (already loaded in first pass)
  if (fileConfig) {
    // Merge with environment config, giving precedence to env vars
    const merged = {
      ...fileConfig,
      ...envConfig,
    };

    // Use keychain key if no other master key is set
    if (!merged.masterKey && keychainKey) {
      merged.masterKey = keychainKey;
    }

    // Set default environment if not set anywhere
    if (!merged.environment) {
      merged.environment = 'development';
    }

    return merged;
  }

  // Return environment config with defaults (no file config found)
  const finalEnvironment = envConfig.environment || 'development';
  return {
    environment: finalEnvironment,
    storagePath: envConfig.storagePath,
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
