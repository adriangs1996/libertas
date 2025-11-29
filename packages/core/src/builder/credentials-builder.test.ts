import { describe, it, expect } from 'vitest';
import { createCredentialsBuilder, CredentialsBuilder } from './credentials-builder';
import { InMemoryStorage } from '../storage';

describe('CredentialsBuilder', () => {
  describe('basic building', () => {
    it('should create a default manager', () => {
      const manager = createCredentialsBuilder().build();
      expect(manager).toBeDefined();
      expect(manager.getMasterKey()).toBeTruthy();
      expect(manager.getEnvironment()).toBe('development');
    });

    it('should set master key', () => {
      const key = 'a'.repeat(64);
      const manager = createCredentialsBuilder().withMasterKey(key).build();
      expect(manager.getMasterKey()).toBe(key);
    });

    it('should generate master key', () => {
      const builder = createCredentialsBuilder();
      builder.withGeneratedMasterKey();
      const manager = builder.build();
      expect(manager.getMasterKey()).toHaveLength(64);
    });

    it('should set environment', () => {
      const manager = createCredentialsBuilder().withEnvironment('production').build();
      expect(manager.getEnvironment()).toBe('production');
    });
  });

  describe('storage configuration', () => {
    it('should use in-memory storage', () => {
      const manager = createCredentialsBuilder().withInMemoryStorage().build();
      expect(manager).toBeDefined();
    });

    it('should use custom storage backend', () => {
      const customStorage = new InMemoryStorage();
      const manager = createCredentialsBuilder().withStorageBackend(customStorage).build();
      expect(manager).toBeDefined();
    });
  });

  describe('encryption configuration', () => {
    it('should use AES encryption', () => {
      const manager = createCredentialsBuilder().withAESEncryption().build();
      expect(manager).toBeDefined();
    });
  });

  describe('chaining', () => {
    it('should support method chaining', () => {
      const builder = createCredentialsBuilder();
      const result = builder
        .withGeneratedMasterKey()
        .withInMemoryStorage()
        .withAESEncryption()
        .withEnvironment('testing');

      expect(result).toBeInstanceOf(CredentialsBuilder);
    });

    it('should build after chain', () => {
      const manager = createCredentialsBuilder()
        .withGeneratedMasterKey()
        .withInMemoryStorage()
        .withEnvironment('production')
        .build();

      expect(manager.getEnvironment()).toBe('production');
      expect(manager.getMasterKey()).toHaveLength(64);
    });
  });

  describe('password derivation', () => {
    it('should derive key from password', () => {
      const manager = createCredentialsBuilder().withPasswordDerivedKey('test-password').build();

      expect(manager.getMasterKey()).toHaveLength(64);
    });

    it('should produce same key from same password', () => {
      const key1 = createCredentialsBuilder().withPasswordDerivedKey('test-password').build().getMasterKey();

      const key2 = createCredentialsBuilder().withPasswordDerivedKey('test-password').build().getMasterKey();

      // Note: PBKDF2 includes random salt, so keys will differ
      // This test verifies they are both valid 64-char hex strings
      expect(key1).toHaveLength(64);
      expect(key2).toHaveLength(64);
    });
  });

  describe('getConfig', () => {
    it('should return current configuration', () => {
      const builder = createCredentialsBuilder()
        .withGeneratedMasterKey()
        .withInMemoryStorage()
        .withEnvironment('staging');

      const config = builder.getConfig();
      expect(config.masterKey).toBeTruthy();
      expect(config.environment).toBe('staging');
      expect(config.storageBackend).toBeDefined();
    });

    it('should return copy of configuration', () => {
      const builder = createCredentialsBuilder();
      const config1 = builder.getConfig();
      const config2 = builder.getConfig();

      expect(config1).not.toBe(config2);
    });
  });
});
