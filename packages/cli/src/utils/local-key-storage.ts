/**
 * Local key storage - stores master keys in ~/.libertas/keys/
 * Simple, no-frills key persistence for credential sets
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

const KEYS_DIR = path.join(os.homedir(), '.libertas', 'keys');

/**
 * Get master key from storage or environment
 */
export async function getMasterKey(name: string): Promise<string | null> {
  // First check environment variable
  if (process.env.LIBERTAS_MASTER_KEY) {
    return process.env.LIBERTAS_MASTER_KEY;
  }

  // Then check local storage
  try {
    const keyPath = path.join(KEYS_DIR, `${name}.key`);
    const key = await fs.readFile(keyPath, 'utf-8');
    return key.trim() || null;
  } catch {
    return null;
  }
}

/**
 * Save master key to local storage
 */
export async function saveMasterKey(name: string, key: string): Promise<boolean> {
  try {
    await fs.mkdir(KEYS_DIR, { recursive: true, mode: 0o700 });
    const keyPath = path.join(KEYS_DIR, `${name}.key`);
    await fs.writeFile(keyPath, key, { mode: 0o600 });
    return true;
  } catch (error) {
    console.error('Error saving master key:', error instanceof Error ? error.message : 'Unknown error');
    return false;
  }
}

/**
 * Delete master key from local storage
 */
export async function deleteMasterKey(name: string): Promise<boolean> {
  try {
    const keyPath = path.join(KEYS_DIR, `${name}.key`);
    await fs.rm(keyPath);
    return true;
  } catch {
    return true; // Already deleted
  }
}

/**
 * List all credential names with stored keys
 */
export async function listMasterKeys(): Promise<string[]> {
  try {
    const files = await fs.readdir(KEYS_DIR);
    return files
      .filter((f) => f.endsWith('.key'))
      .map((f) => f.substring(0, f.length - 4));
  } catch {
    return [];
  }
}
