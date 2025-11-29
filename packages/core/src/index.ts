// Main exports
export { CredentialsManager } from './manager/credentials-manager';
export { CredentialsError, ValidationError, EncryptionError, StorageError, KeyDerivationError } from './errors';

// Crypto exports
export { CryptoUtils } from './crypto';

// Storage exports
export { InMemoryStorage, FileStorage } from './storage';

// Encryption exports
export { AESEncryption } from './encryption';

// Builder exports
export { CredentialsBuilder, createCredentialsBuilder } from './builder/credentials-builder';

// Utilities exports
export {
  deepMerge,
  getNestedValue,
  setNestedValue,
  flattenObject,
  unflattenObject,
  hasRequiredKeys,
  maskCredentials,
  validateAgainstSchema,
  type CredentialSchema,
} from './utils';

// Type exports
export type {
  Credentials,
  CredentialsConfig,
  StorageBackend,
  EncryptionStrategy,
  KeyDerivationOptions,
  EncryptionOptions,
} from './types';
