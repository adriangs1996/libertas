import { describe, it, expect, beforeEach } from 'vitest';
import { CredentialsManager } from './credentials-manager';
import { InMemoryStorage } from '../storage';
import { CryptoUtils } from '../crypto';
import { ValidationError, CredentialsError } from '../errors';

describe('CredentialsManager', () => {
  let manager: CredentialsManager;
  let masterKey: string;

  beforeEach(() => {
    masterKey = CryptoUtils.generateMasterKey();
    manager = new CredentialsManager({
      masterKey,
      storageBackend: new InMemoryStorage(),
    });
  });

  describe('initialization', () => {
    it('should initialize with default values', () => {
      const m = new CredentialsManager();
      expect(m.getMasterKey()).toBeTruthy();
      expect(m.getEnvironment()).toBe('development');
    });

    it('should initialize with custom config', () => {
      const m = new CredentialsManager({
        masterKey,
        environment: 'production',
      });
      expect(m.getMasterKey()).toBe(masterKey);
      expect(m.getEnvironment()).toBe('production');
    });
  });

  describe('save and load', () => {
    it('should save and load credentials', async () => {
      const creds = { username: 'admin', password: 'secret' };
      await manager.save('app-config', creds);
      const loaded = await manager.load('app-config');
      expect(loaded).toEqual(creds);
    });

    it('should encrypt credentials in storage', async () => {
      const creds = { username: 'admin', password: 'secret' };
      await manager.save('app-config', creds);

      // Verify the stored data is encrypted
      const storage = manager['storageBackend'] as any;
      const stored = await storage.get('app-config');
      expect(stored).not.toBe(JSON.stringify(creds));
    });

    it('should throw on non-existent key', async () => {
      await expect(manager.load('non-existent')).rejects.toThrow(CredentialsError);
    });
  });

  describe('exists', () => {
    it('should return true for existing credentials', async () => {
      await manager.save('app-config', { test: 'value' });
      const exists = await manager.exists('app-config');
      expect(exists).toBe(true);
    });

    it('should return false for non-existent credentials', async () => {
      const exists = await manager.exists('non-existent');
      expect(exists).toBe(false);
    });
  });

  describe('delete', () => {
    it('should delete credentials', async () => {
      await manager.save('app-config', { test: 'value' });
      await manager.delete('app-config');
      const exists = await manager.exists('app-config');
      expect(exists).toBe(false);
    });

    it('should not throw on deleting non-existent key', async () => {
      await expect(manager.delete('non-existent')).resolves.not.toThrow();
    });
  });

  describe('update', () => {
    it('should update specific credential values', async () => {
      const initial = { username: 'admin', password: 'secret', role: 'admin' };
      await manager.save('app-config', initial);

      const updated = await manager.update('app-config', { password: 'new-secret' });
      expect(updated.password).toBe('new-secret');
      expect(updated.username).toBe('admin');
      expect(updated.role).toBe('admin');
    });

    it('should throw on non-existent key', async () => {
      await expect(manager.update('non-existent', { test: 'value' })).rejects.toThrow();
    });
  });

  describe('key validation', () => {
    it('should reject empty keys', async () => {
      await expect(manager.save('', { test: 'value' })).rejects.toThrow(ValidationError);
    });

    it('should reject non-string keys', async () => {
      await expect(manager.save(123 as any, { test: 'value' })).rejects.toThrow(ValidationError);
    });

    it('should reject keys longer than 255 characters', async () => {
      const longKey = 'x'.repeat(256);
      await expect(manager.save(longKey, { test: 'value' })).rejects.toThrow(ValidationError);
    });
  });

  describe('credentials validation', () => {
    it('should reject non-object credentials', async () => {
      await expect(manager.save('key', 'string' as any)).rejects.toThrow(ValidationError);
    });

    it('should reject array credentials', async () => {
      await expect(manager.save('key', [] as any)).rejects.toThrow(ValidationError);
    });

    it('should accept nested objects', async () => {
      const creds = {
        database: {
          host: 'localhost',
          port: 5432,
        },
      };
      await manager.save('app-config', creds);
      const loaded = await manager.load('app-config');
      expect(loaded).toEqual(creds);
    });
  });

  describe('master key management', () => {
    it('should get master key', () => {
      expect(manager.getMasterKey()).toBe(masterKey);
    });

    it('should set a new master key', () => {
      const newKey = CryptoUtils.generateMasterKey();
      manager.setMasterKey(newKey);
      expect(manager.getMasterKey()).toBe(newKey);
    });

    it('should reject invalid master keys', () => {
      expect(() => manager.setMasterKey('invalid')).toThrow(ValidationError);
      expect(() => manager.setMasterKey('x'.repeat(60))).toThrow(ValidationError);
    });
  });

  describe('complex scenarios', () => {
    it('should handle multiple credential sets', async () => {
      const creds1 = { api_key: 'key1' };
      const creds2 = { api_key: 'key2' };

      await manager.save('service1', creds1);
      await manager.save('service2', creds2);

      const loaded1 = await manager.load('service1');
      const loaded2 = await manager.load('service2');

      expect(loaded1).toEqual(creds1);
      expect(loaded2).toEqual(creds2);
    });

    it('should handle various data types in credentials', async () => {
      const creds = {
        string: 'value',
        number: 42,
        boolean: true,
        nested: { deep: { value: 'nested' } },
      };

      await manager.save('config', creds);
      const loaded = await manager.load('config');
      expect(loaded).toEqual(creds);
    });
  });
});
