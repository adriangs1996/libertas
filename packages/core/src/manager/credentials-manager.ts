/**
 * Main credentials manager class
 */

import { CryptoUtils } from '../crypto';
import { AESEncryption } from '../encryption';
import { InMemoryStorage } from '../storage';
import { ValidationError, CredentialsError } from '../errors';
import type { Credentials, CredentialsConfig, StorageBackend, EncryptionStrategy } from '../types';

export class CredentialsManager {
  private masterKey: string;
  private storageBackend: StorageBackend;
  private encryptionStrategy: EncryptionStrategy;
  private environment: string;

  constructor(config: CredentialsConfig = {}) {
    this.masterKey = config.masterKey || CryptoUtils.generateMasterKey();
    this.storageBackend = config.storageBackend || new InMemoryStorage();
    this.encryptionStrategy = config.encryptionStrategy || new AESEncryption();
    this.environment = config.environment || 'development';
  }

  /**
   * Load credentials from storage
   */
  async load(key: string): Promise<Credentials> {
    this.validateKey(key);

    try {
      const encrypted = await this.storageBackend.get(key);

      if (!encrypted) {
        throw new CredentialsError(`Credentials not found for key: ${key}`);
      }

      const decrypted = await this.encryptionStrategy.decrypt(encrypted, this.masterKey);
      return JSON.parse(decrypted) as Credentials;
    } catch (error) {
      if (error instanceof CredentialsError) throw error;
      throw new CredentialsError(
        `Failed to load credentials: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Save credentials to storage
   */
  async save(key: string, credentials: Credentials): Promise<void> {
    this.validateKey(key);
    this.validateCredentials(credentials);

    try {
      const serialized = JSON.stringify(credentials);
      const encrypted = await this.encryptionStrategy.encrypt(serialized, this.masterKey);
      await this.storageBackend.set(key, encrypted);
    } catch (error) {
      if (error instanceof CredentialsError) throw error;
      throw new CredentialsError(
        `Failed to save credentials: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Delete credentials from storage
   */
  async delete(key: string): Promise<void> {
    this.validateKey(key);

    try {
      await this.storageBackend.delete(key);
    } catch (error) {
      if (error instanceof CredentialsError) throw error;
      throw new CredentialsError(
        `Failed to delete credentials: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Check if credentials exist
   */
  async exists(key: string): Promise<boolean> {
    this.validateKey(key);

    try {
      return await this.storageBackend.exists(key);
    } catch (error) {
      if (error instanceof CredentialsError) throw error;
      throw new CredentialsError(
        `Failed to check credentials: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Update a specific credential value
   */
  async update(key: string, updates: Partial<Credentials>): Promise<Credentials> {
    const existing = await this.load(key);
    const updated = { ...existing, ...updates } as Credentials;
    await this.save(key, updated);
    return updated;
  }

  /**
   * Get the master key
   */
  getMasterKey(): string {
    return this.masterKey;
  }

  /**
   * Set a new master key (use with caution)
   */
  setMasterKey(newKey: string): void {
    this.validateMasterKey(newKey);
    this.masterKey = newKey;
  }

  /**
   * Get the current environment
   */
  getEnvironment(): string {
    return this.environment;
  }

  /**
   * Validate key format
   */
  private validateKey(key: string): void {
    if (!key || typeof key !== 'string') {
      throw new ValidationError('Key must be a non-empty string');
    }

    if (key.length > 255) {
      throw new ValidationError('Key must not exceed 255 characters');
    }
  }

  /**
   * Validate credentials object
   */
  private validateCredentials(credentials: Credentials): void {
    if (!credentials || typeof credentials !== 'object') {
      throw new ValidationError('Credentials must be a valid object');
    }

    if (Array.isArray(credentials)) {
      throw new ValidationError('Credentials must be an object, not an array');
    }
  }

  /**
   * Validate master key format
   */
  private validateMasterKey(key: string): void {
    if (!key || typeof key !== 'string') {
      throw new ValidationError('Master key must be a non-empty string');
    }

    if (!/^[a-f0-9]+$/.test(key)) {
      throw new ValidationError('Master key must be a valid hex string');
    }

    if (key.length !== 64) {
      throw new ValidationError('Master key must be 32 bytes (64 hex characters)');
    }
  }

  /**
   * Generate a scoped key for a given scope (e.g., environment)
   */
  generateScopedKey(name: string, scope?: string): string {
    if (scope) {
      return `${name}.${scope}`;
    }
    return name;
  }

  /**
   * Load credentials for a scope
   */
  async loadScoped(name: string, scope?: string): Promise<Credentials> {
    const key = this.generateScopedKey(name, scope);
    return this.load(key);
  }

  /**
   * Save credentials for a scope
   */
  async saveScoped(name: string, credentials: Credentials, scope?: string): Promise<void> {
    const key = this.generateScopedKey(name, scope);
    return this.save(key, credentials);
  }

  /**
   * Delete credentials for a scope
   */
  async deleteScoped(name: string, scope?: string): Promise<void> {
    const key = this.generateScopedKey(name, scope);
    return this.delete(key);
  }

  /**
   * Check if scoped credentials exist
   */
  async existsScoped(name: string, scope?: string): Promise<boolean> {
    const key = this.generateScopedKey(name, scope);
    return this.exists(key);
  }
}

export default CredentialsManager;
