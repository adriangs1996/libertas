/**
 * File permissions utilities
 * Handles setting secure file permissions for sensitive files like .env
 */

import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * File permission modes as octal values
 */
export const FilePermissions = {
  /** Owner read/write only (600) - used for .env files */
  SECURE_FILE: 0o600,
  /** Owner read/write, group read, others read (644) - standard files */
  STANDARD_FILE: 0o644,
  /** Owner read/write/execute, group read/execute, others read/execute (755) */
  STANDARD_DIR: 0o755,
} as const;

/**
 * Set secure file permissions (chmod 600)
 * Ensures file is readable/writable only by owner
 */
export async function setSecureFilePermissions(filePath: string): Promise<void> {
  try {
    await fs.chmod(filePath, FilePermissions.SECURE_FILE);
  } catch (error) {
    throw new Error(
      `Failed to set secure file permissions for ${path.basename(filePath)}: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Get current file permissions in octal format
 */
export async function getFilePermissions(filePath: string): Promise<number> {
  try {
    const stats = await fs.stat(filePath);
    return stats.mode & parseInt('777', 8);
  } catch (error) {
    throw new Error(
      `Failed to get file permissions for ${path.basename(filePath)}: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Check if file has secure permissions (owner only)
 */
export async function hasSecurePermissions(filePath: string): Promise<boolean> {
  try {
    const perms = await getFilePermissions(filePath);
    return perms === FilePermissions.SECURE_FILE;
  } catch {
    return false;
  }
}

/**
 * Verify file is readable/writable by current user
 */
export async function isFileAccessible(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath, fs.constants.R_OK | fs.constants.W_OK);
    return true;
  } catch {
    return false;
  }
}

/**
 * Create a file with secure permissions atomically
 * Writes to temp file first, then moves to final location
 */
export async function createSecureFile(filePath: string, content: string): Promise<void> {
  try {
    const dir = path.dirname(filePath);
    const filename = path.basename(filePath);
    const tempPath = path.join(dir, `.${filename}.tmp`);

    // Write to temporary file
    await fs.writeFile(tempPath, content, 'utf-8');

    // Set secure permissions before moving
    await setSecureFilePermissions(tempPath);

    // Atomic move (rename) to final location
    await fs.rename(tempPath, filePath);
  } catch (error) {
    // Clean up temp file if it exists
    try {
      const dir = path.dirname(filePath);
      const filename = path.basename(filePath);
      const tempPath = path.join(dir, `.${filename}.tmp`);
      await fs.unlink(tempPath);
    } catch {
      // Ignore cleanup errors
    }

    throw new Error(
      `Failed to create secure file ${path.basename(filePath)}: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Format permissions as human-readable string (e.g., "600" or "rw-------")
 */
export function formatPermissions(mode: number): string {
  return mode.toString(8).padStart(3, '0');
}

/**
 * Check if file permissions are world-readable or world-writable (insecure)
 */
export async function isFileInsecure(filePath: string): Promise<boolean> {
  try {
    const perms = await getFilePermissions(filePath);
    // Check if world has read (004) or write (002) permissions
    const worldPerms = perms & 0o007;
    return worldPerms !== 0;
  } catch {
    return true; // Consider inaccessible as insecure
  }
}
