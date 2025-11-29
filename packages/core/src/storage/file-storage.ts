/**
 * File-based storage backend
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { StorageError } from '../errors';
import type { StorageBackend } from '../types';

/**
 * Sanitize key to prevent directory traversal and invalid filenames
 */
function sanitizeKey(key: string): string {
  return key
    .replace(/[^a-zA-Z0-9._-]/g, '_') // Replace invalid chars with underscore
    .replace(/^\.+/, '') // Remove leading dots
    .replace(/\.+$/, ''); // Remove trailing dots
}

/**
 * File-based storage backend for credentials
 */
export class FileStorage implements StorageBackend {
  constructor(private readonly basePath: string) {}

  /**
   * Ensure the base directory exists
   */
  private async ensureDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.basePath, { recursive: true });
    } catch (error) {
      throw new StorageError(
        `Failed to ensure storage directory: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get the full file path for a key
   */
  private getFilePath(key: string): string {
    const sanitized = sanitizeKey(key);
    return path.join(this.basePath, `${sanitized}.json`);
  }

  /**
   * Verify the file path is within the base directory (prevent directory traversal)
   */
  private verifyPath(filePath: string): void {
    const resolved = path.resolve(filePath);
    const baseResolved = path.resolve(this.basePath);

    if (!resolved.startsWith(baseResolved)) {
      throw new StorageError('Access denied: path traversal attempt detected');
    }
  }

  async get(key: string): Promise<string | null> {
    try {
      await this.ensureDirectory();
      const filePath = this.getFilePath(key);
      this.verifyPath(filePath);

      const content = await fs.readFile(filePath, 'utf-8');
      const data = JSON.parse(content);
      return data.value || null;
    } catch (error) {
      if (error instanceof StorageError) throw error;

      // File not found is not an error, just return null
      if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
        return null;
      }

      throw new StorageError(
        `Failed to read from storage: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async set(key: string, value: string): Promise<void> {
    try {
      await this.ensureDirectory();
      const filePath = this.getFilePath(key);
      this.verifyPath(filePath);

      const data = {
        value,
        timestamp: new Date().toISOString(),
      };

      await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (error) {
      if (error instanceof StorageError) throw error;

      throw new StorageError(`Failed to write to storage: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async delete(key: string): Promise<void> {
    try {
      const filePath = this.getFilePath(key);
      this.verifyPath(filePath);

      await fs.unlink(filePath);
    } catch (error) {
      if (error instanceof StorageError) throw error;

      // File not found is not an error
      if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
        return;
      }

      throw new StorageError(
        `Failed to delete from storage: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const filePath = this.getFilePath(key);
      this.verifyPath(filePath);

      await fs.access(filePath);
      return true;
    } catch (error) {
      if (error instanceof StorageError) throw error;

      // File not found is not an error
      if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
        return false;
      }

      throw new StorageError(`Failed to check storage: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get all keys in storage
   */
  async getAllKeys(): Promise<string[]> {
    try {
      await this.ensureDirectory();
      const files = await fs.readdir(this.basePath);
      return files.filter((file) => file.endsWith('.json')).map((file) => file.replace(/\.json$/, ''));
    } catch (error) {
      throw new StorageError(`Failed to list keys: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Clear all credentials in storage
   */
  async clear(): Promise<void> {
    try {
      const keys = await this.getAllKeys();
      for (const key of keys) {
        await this.delete(key);
      }
    } catch (error) {
      if (error instanceof StorageError) throw error;

      throw new StorageError(`Failed to clear storage: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export default FileStorage;
