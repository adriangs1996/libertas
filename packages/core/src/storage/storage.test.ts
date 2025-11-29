import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryStorage } from './index';

describe('InMemoryStorage', () => {
  let storage: InMemoryStorage;

  beforeEach(() => {
    storage = new InMemoryStorage();
  });

  describe('set and get', () => {
    it('should store and retrieve values', async () => {
      await storage.set('key1', 'value1');
      const value = await storage.get('key1');
      expect(value).toBe('value1');
    });

    it('should return null for non-existent keys', async () => {
      const value = await storage.get('non-existent');
      expect(value).toBeNull();
    });

    it('should overwrite existing values', async () => {
      await storage.set('key1', 'value1');
      await storage.set('key1', 'value2');
      const value = await storage.get('key1');
      expect(value).toBe('value2');
    });
  });

  describe('exists', () => {
    it('should return true for existing keys', async () => {
      await storage.set('key1', 'value1');
      const exists = await storage.exists('key1');
      expect(exists).toBe(true);
    });

    it('should return false for non-existent keys', async () => {
      const exists = await storage.exists('non-existent');
      expect(exists).toBe(false);
    });
  });

  describe('delete', () => {
    it('should delete stored values', async () => {
      await storage.set('key1', 'value1');
      await storage.delete('key1');
      const value = await storage.get('key1');
      expect(value).toBeNull();
    });

    it('should handle deletion of non-existent keys', async () => {
      await expect(storage.delete('non-existent')).resolves.not.toThrow();
    });
  });

  describe('clear', () => {
    it('should clear all stored data', async () => {
      await storage.set('key1', 'value1');
      await storage.set('key2', 'value2');
      await storage.clear();
      expect(await storage.get('key1')).toBeNull();
      expect(await storage.get('key2')).toBeNull();
    });
  });

  describe('getAllKeys', () => {
    it('should return all stored keys', async () => {
      await storage.set('key1', 'value1');
      await storage.set('key2', 'value2');
      await storage.set('key3', 'value3');
      const keys = storage.getAllKeys();
      expect(keys).toContain('key1');
      expect(keys).toContain('key2');
      expect(keys).toContain('key3');
      expect(keys.length).toBe(3);
    });

    it('should return empty array when no keys exist', () => {
      const keys = storage.getAllKeys();
      expect(keys).toEqual([]);
    });
  });
});
