/**
 * Builder pattern for CredentialsManager configuration
 */

import { CredentialsManager } from '../manager/credentials-manager';
import { CryptoUtils } from '../crypto';
import { AESEncryption } from '../encryption';
import { InMemoryStorage, FileStorage } from '../storage';
import type { CredentialsConfig, StorageBackend, EncryptionStrategy } from '../types';

/**
 * Fluent builder for CredentialsManager
 */
export class CredentialsBuilder {
  private config: CredentialsConfig = {};

  /**
   * Set the master key
   */
  withMasterKey(key: string): this {
    this.config.masterKey = key;
    return this;
  }

  /**
   * Generate a random master key
   */
  withGeneratedMasterKey(): this {
    this.config.masterKey = CryptoUtils.generateMasterKey();
    return this;
  }

  /**
   * Derive master key from password
   */
  withPasswordDerivedKey(password: string): this {
    const derived = CryptoUtils.deriveKey(password);
    const key = CryptoUtils.extractKey(derived);
    this.config.masterKey = key.toString('hex');
    return this;
  }

  /**
   * Use in-memory storage
   */
  withInMemoryStorage(): this {
    this.config.storageBackend = new InMemoryStorage();
    return this;
  }

  /**
   * Use file-based storage
   */
  withFileStorage(basePath: string): this {
    this.config.storageBackend = new FileStorage(basePath);
    return this;
  }

  /**
   * Use custom storage backend
   */
  withStorageBackend(backend: StorageBackend): this {
    this.config.storageBackend = backend;
    return this;
  }

  /**
   * Use AES encryption
   */
  withAESEncryption(): this {
    this.config.encryptionStrategy = new AESEncryption();
    return this;
  }

  /**
   * Use custom encryption strategy
   */
  withEncryptionStrategy(strategy: EncryptionStrategy): this {
    this.config.encryptionStrategy = strategy;
    return this;
  }

  /**
   * Set the environment
   */
  withEnvironment(environment: string): this {
    this.config.environment = environment;
    return this;
  }

  /**
   * Build the CredentialsManager
   */
  build(): CredentialsManager {
    // Set defaults if not provided
    if (!this.config.masterKey) {
      this.config.masterKey = CryptoUtils.generateMasterKey();
    }
    if (!this.config.storageBackend) {
      this.config.storageBackend = new InMemoryStorage();
    }
    if (!this.config.encryptionStrategy) {
      this.config.encryptionStrategy = new AESEncryption();
    }
    if (!this.config.environment) {
      this.config.environment = 'development';
    }

    return new CredentialsManager(this.config);
  }

  /**
   * Get the current configuration
   */
  getConfig(): CredentialsConfig {
    return { ...this.config };
  }
}

/**
 * Create a new builder instance
 */
export function createCredentialsBuilder(): CredentialsBuilder {
  return new CredentialsBuilder();
}

export default createCredentialsBuilder;
