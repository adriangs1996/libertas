import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs/promises';
import path from 'node:path';
import { FileStorage } from './file-storage';
import { StorageError } from '../errors';

describe('FileStorage', () => {
  let storage: FileStorage;
  let testDir: string;

  beforeEach(async () => {
    testDir = path.join(process.cwd(), '.test-storage-' + Date.now());
    storage = new FileStorage(testDir);
  });

  afterEach(async () => {
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('set and get', () => {
    it('should store and retrieve values', async () => {
      await storage.set('test-key', 'test-value');
      const value = await storage.get('test-key');
      expect(value).toBe('test-value');
    });

    it('should return null for non-existent keys', async () => {
      const value = await storage.get('non-existent');
      expect(value).toBeNull();
    });

    it('should overwrite existing values', async () => {
      await storage.set('key', 'value1');
      await storage.set('key', 'value2');
      const value = await storage.get('key');
      expect(value).toBe('value2');
    });

    it('should handle special characters in keys', async () => {
      const specialKey = 'key-with-special.chars_123';
      await storage.set(specialKey, 'value');
      const value = await storage.get(specialKey);
      expect(value).toBe('value');
    });
  });

  describe('exists', () => {
    it('should return true for existing keys', async () => {
      await storage.set('key', 'value');
      const exists = await storage.exists('key');
      expect(exists).toBe(true);
    });

    it('should return false for non-existent keys', async () => {
      const exists = await storage.exists('non-existent');
      expect(exists).toBe(false);
    });
  });

  describe('delete', () => {
    it('should delete stored values', async () => {
      await storage.set('key', 'value');
      await storage.delete('key');
      const exists = await storage.exists('key');
      expect(exists).toBe(false);
    });

    it('should handle deletion of non-existent keys', async () => {
      await expect(storage.delete('non-existent')).resolves.not.toThrow();
    });
  });

  describe('getAllKeys', () => {
    it('should return all stored keys', async () => {
      await storage.set('key1', 'value1');
      await storage.set('key2', 'value2');
      await storage.set('key3', 'value3');

      const keys = await storage.getAllKeys();
      expect(keys).toContain('key1');
      expect(keys).toContain('key2');
      expect(keys).toContain('key3');
      expect(keys.length).toBe(3);
    });

    it('should return empty array when no keys exist', async () => {
      const keys = await storage.getAllKeys();
      expect(keys).toEqual([]);
    });
  });

  describe('clear', () => {
    it('should clear all stored data', async () => {
      await storage.set('key1', 'value1');
      await storage.set('key2', 'value2');
      await storage.clear();

      const exists1 = await storage.exists('key1');
      const exists2 = await storage.exists('key2');
      expect(exists1).toBe(false);
      expect(exists2).toBe(false);
    });
  });

  describe('security', () => {
    it('should prevent directory traversal', async () => {
      const traversalStorage = new FileStorage(testDir);
      await expect(traversalStorage.set('../../../etc/passwd', 'value')).resolves.not.toThrow();
      // The traversal attempt should be sanitized
      const files = await fs.readdir(testDir);
      expect(files.length).toBeGreaterThan(0);
      // Verify the malicious file wasn't created outside testDir
      const parentExists = await fs
        .access(path.join(testDir, '..', '..', '..', 'etc'))
        .then(() => true)
        .catch(() => false);
      expect(parentExists).toBe(false);
    });

    it('should sanitize special characters in keys', async () => {
      const specialKey = 'key<>|"*?:/\\';
      await storage.set(specialKey, 'value');
      const value = await storage.get(specialKey);
      expect(value).toBe('value');
    });
  });

  describe('concurrent operations', () => {
    it('should handle concurrent writes', async () => {
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(storage.set(`key${i}`, `value${i}`));
      }
      await Promise.all(promises);

      const keys = await storage.getAllKeys();
      expect(keys.length).toBe(10);
    });

    it('should handle concurrent reads', async () => {
      await storage.set('key', 'value');

      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(storage.get('key'));
      }
      const results = await Promise.all(promises);

      results.forEach((result) => {
        expect(result).toBe('value');
      });
    });
  });
});
