/**
 * Configuration loader for CLI
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import type { CLIConfig } from '../types';

const CONFIG_FILE_NAME = '.libertasrc';
const CONFIG_FILE_NAMES = ['.libertasrc', '.libertasrc.json', '.libertasrc.js'];

/**
 * Load CLI configuration from environment and config files
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
  for (const configFileName of CONFIG_FILE_NAMES) {
    try {
      const configPath = path.join(cwd, configFileName);
      const content = await fs.readFile(configPath, 'utf-8');

      let fileConfig: CLIConfig;

      if (configFileName.endsWith('.json')) {
        fileConfig = JSON.parse(content);
      } else {
        // For .libertasrc or .js files, assume JSON format
        fileConfig = JSON.parse(content);
      }

      // Merge with environment config, giving precedence to env vars
      const merged = {
        ...fileConfig,
        ...envConfig,
      };

      // Set default environment if not set anywhere
      if (!merged.environment) {
        merged.environment = 'development';
      }

      return merged;
    } catch (error) {
      // File not found or parse error, continue to next file
      continue;
    }
  }

  // Return environment config with defaults
  return {
    environment: envConfig.environment || 'development',
    storagePath: envConfig.storagePath,
    masterKey: envConfig.masterKey,
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
