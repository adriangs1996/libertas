/**
 * Keychain utilities for secure master key storage
 * Uses cross-keychain for cross-platform credential storage:
 * - macOS: Keychain
 * - Windows: Credential Manager
 * - Linux: Secret Service or encrypted file fallback
 *
 * Supports environment-scoped master keys (e.g., production, staging, development)
 */

import { getPassword, setPassword, deletePassword } from 'cross-keychain';

const SERVICE_NAME = 'libertas';

/**
 * Get account name for environment scope
 * Default scope returns 'master-key', scoped returns 'master-key-{scope}'
 */
function getAccountName(scope?: string): string {
  if (!scope) {
    return 'master-key';
  }
  return `master-key-${scope}`;
}

/**
 * Get master key from system keychain with optional environment scope
 */
export async function getKeyFromKeychain(scope?: string): Promise<string | null> {
  try {
    const accountName = getAccountName(scope);
    const key = await getPassword(SERVICE_NAME, accountName);
    return key || null;
  } catch (error) {
    // Keychain not available or error accessing it
    // This is not fatal - fallback to env vars or config file
    return null;
  }
}

/**
 * Save master key to system keychain with optional environment scope
 */
export async function saveKeyToKeychain(key: string, scope?: string): Promise<boolean> {
  try {
    const accountName = getAccountName(scope);
    await setPassword(SERVICE_NAME, accountName, key);
    return true;
  } catch (error) {
    console.error(
      'Error saving master key to keychain:',
      error instanceof Error ? error.message : 'Unknown error'
    );
    return false;
  }
}

/**
 * Delete master key from system keychain with optional environment scope
 */
export async function deleteKeyFromKeychain(scope?: string): Promise<boolean> {
  try {
    const accountName = getAccountName(scope);
    await deletePassword(SERVICE_NAME, accountName);
    return true;
  } catch (error) {
    console.error(
      'Error deleting master key from keychain:',
      error instanceof Error ? error.message : 'Unknown error'
    );
    return false;
  }
}

/**
 * Check if key exists in keychain for environment scope
 */
export async function keyExistsInKeychain(scope?: string): Promise<boolean> {
  try {
    const accountName = getAccountName(scope);
    const key = await getPassword(SERVICE_NAME, accountName);
    return key !== null && key.length > 0;
  } catch {
    return false;
  }
}
