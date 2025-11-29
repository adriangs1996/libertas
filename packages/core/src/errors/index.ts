/**
 * Custom error classes for libertas
 */

export class CredentialsError extends Error {
  constructor(
    message: string,
    public readonly code?: string
  ) {
    super(message);
    this.name = 'CredentialsError';
  }
}

export class ValidationError extends CredentialsError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

export class EncryptionError extends CredentialsError {
  constructor(message: string) {
    super(message, 'ENCRYPTION_ERROR');
    this.name = 'EncryptionError';
  }
}

export class StorageError extends CredentialsError {
  constructor(message: string) {
    super(message, 'STORAGE_ERROR');
    this.name = 'StorageError';
  }
}

export class KeyDerivationError extends CredentialsError {
  constructor(message: string) {
    super(message, 'KEY_DERIVATION_ERROR');
    this.name = 'KeyDerivationError';
  }
}
