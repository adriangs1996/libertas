/**
 * Storage backends module
 */

import type { StorageBackend } from '../types';
import { StorageError } from '../errors';

/**
 * In-memory storage backend
 */
export class InMemoryStorage implements StorageBackend {
  private store: Map<string, string> = new Map();

  async get(key: string): Promise<string | null> {
    return this.store.get(key) ?? null;
  }

  async set(key: string, value: string): Promise<void> {
    this.store.set(key, value);
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }

  async exists(key: string): Promise<boolean> {
    return this.store.has(key);
  }

  /**
   * Clear all stored data
   */
  async clear(): Promise<void> {
    this.store.clear();
  }

  /**
   * Get all keys
   */
  getAllKeys(): string[] {
    return Array.from(this.store.keys());
  }
}

export { FileStorage } from './file-storage';
