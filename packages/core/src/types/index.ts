/**
 * Core types for the libertas credentials management system
 */

export interface Credentials {
  [key: string]: string | number | boolean | object;
}

export interface CredentialsConfig {
  masterKey?: string;
  storageBackend?: StorageBackend;
  encryptionStrategy?: EncryptionStrategy;
  environment?: string;
}

export interface StorageBackend {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
}

export interface EncryptionStrategy {
  encrypt(data: string, key: string): Promise<string>;
  decrypt(encryptedData: string, key: string): Promise<string>;
}

export interface KeyDerivationOptions {
  salt?: Buffer;
  iterations?: number;
  keyLength?: number;
  digest?: string;
}

export interface EncryptionOptions {
  algorithm?: string;
  iv?: Buffer;
  authTag?: Buffer;
}
