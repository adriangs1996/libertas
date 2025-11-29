# @libertas/core API Documentation

Comprehensive API documentation for the libertas core credentials management system.

## Table of Contents

1. [CredentialsManager](#credentialsmanager)
2. [CryptoUtils](#cryptoutils)
3. [Storage Backends](#storage-backends)
4. [Encryption Strategies](#encryption-strategies)
5. [Utilities](#utilities)
6. [Builder Pattern](#builder-pattern)
7. [CLI Handler](#cli-handler)
8. [Error Handling](#error-handling)

## CredentialsManager

Main class for managing credentials with encryption and storage.

### Constructor

```typescript
new CredentialsManager(config?: CredentialsConfig)
```

### Methods

#### `load(key: string): Promise<Credentials>`

Load and decrypt credentials from storage.

```typescript
const credentials = await manager.load('app-config');
```

#### `save(key: string, credentials: Credentials): Promise<void>`

Encrypt and save credentials to storage.

```typescript
await manager.save('app-config', {
  database_url: 'postgresql://...',
  api_key: 'secret-key'
});
```

#### `delete(key: string): Promise<void>`

Remove credentials from storage.

```typescript
await manager.delete('app-config');
```

#### `exists(key: string): Promise<boolean>`

Check if credentials exist in storage.

```typescript
const exists = await manager.exists('app-config');
```

#### `update(key: string, updates: Partial<Credentials>): Promise<Credentials>`

Partially update credentials.

```typescript
const updated = await manager.update('app-config', {
  api_key: 'new-key'
});
```

#### `getMasterKey(): string`

Retrieve the current master key.

```typescript
const masterKey = manager.getMasterKey();
```

#### `setMasterKey(newKey: string): void`

Change the master key (use with caution).

```typescript
manager.setMasterKey(newMasterKey);
```

#### `getEnvironment(): string`

Get the current environment.

```typescript
const env = manager.getEnvironment();
```

## CryptoUtils

Static utility class for cryptographic operations.

### Methods

#### `generateMasterKey(): string`

Generate a random 32-byte master key (64 hex characters).

```typescript
const key = CryptoUtils.generateMasterKey();
```

#### `deriveKey(password: string, options?: KeyDerivationOptions): Buffer`

Derive a key from a password using PBKDF2.

```typescript
const derived = CryptoUtils.deriveKey('password', {
  iterations: 100_000,
  keyLength: 32
});
```

#### `extractSalt(derivedKey: Buffer): Buffer`

Extract salt from a derived key.

```typescript
const salt = CryptoUtils.extractSalt(derived);
```

#### `extractKey(derivedKey: Buffer): Buffer`

Extract the key material from a derived key.

```typescript
const key = CryptoUtils.extractKey(derived);
```

#### `hash(data: string): string`

Hash data using SHA256.

```typescript
const hash = CryptoUtils.hash('data');
```

#### `randomBytes(size?: number): Buffer`

Generate random bytes.

```typescript
const bytes = CryptoUtils.randomBytes(32);
```

#### `constantTimeCompare(a: string | Buffer, b: string | Buffer): boolean`

Constant-time comparison for sensitive data.

```typescript
const isEqual = CryptoUtils.constantTimeCompare(key1, key2);
```

## Storage Backends

### InMemoryStorage

In-memory storage backend (default for development).

```typescript
const storage = new InMemoryStorage();
const manager = new CredentialsManager({ storageBackend: storage });
```

#### Methods

- `get(key: string): Promise<string | null>`
- `set(key: string, value: string): Promise<void>`
- `delete(key: string): Promise<void>`
- `exists(key: string): Promise<boolean>`
- `clear(): Promise<void>`
- `getAllKeys(): string[]`

### FileStorage

File-based storage backend with security features.

```typescript
const storage = new FileStorage('./credentials');
const manager = new CredentialsManager({ storageBackend: storage });
```

#### Constructor

```typescript
new FileStorage(basePath: string)
```

#### Methods

- `get(key: string): Promise<string | null>`
- `set(key: string, value: string): Promise<void>`
- `delete(key: string): Promise<void>`
- `exists(key: string): Promise<boolean>`
- `getAllKeys(): Promise<string[]>`
- `clear(): Promise<void>`

#### Security Features

- Directory traversal prevention
- File path validation
- Key sanitization

## Encryption Strategies

### AESEncryption

AES-256-GCM encryption strategy (default).

```typescript
const strategy = new AESEncryption();
const manager = new CredentialsManager({ encryptionStrategy: strategy });
```

#### Methods

#### `encrypt(data: string, key: string): Promise<string>`

Encrypt data with the provided key.

```typescript
const encrypted = await strategy.encrypt('plaintext', masterKey);
```

#### `decrypt(encryptedData: string, key: string): Promise<string>`

Decrypt data with the provided key.

```typescript
const decrypted = await strategy.decrypt(encrypted, masterKey);
```

## Utilities

### deepMerge

Deep merge two objects.

```typescript
import { deepMerge } from '@libertas/core/utils';

const merged = deepMerge({ a: { b: 1 } }, { a: { c: 2 } });
// Result: { a: { b: 1, c: 2 } }
```

### getNestedValue

Get nested value using dot notation.

```typescript
import { getNestedValue } from '@libertas/core/utils';

const value = getNestedValue({ db: { host: 'localhost' } }, 'db.host');
// Result: 'localhost'
```

### setNestedValue

Set nested value using dot notation.

```typescript
import { setNestedValue } from '@libertas/core/utils';

const obj = {};
setNestedValue(obj, 'db.host', 'localhost');
```

### flattenObject

Flatten nested object to dot notation.

```typescript
import { flattenObject } from '@libertas/core/utils';

const flat = flattenObject({ db: { host: 'localhost', port: 5432 } });
// Result: { 'db.host': 'localhost', 'db.port': 5432 }
```

### unflattenObject

Unflatten object from dot notation.

```typescript
import { unflattenObject } from '@libertas/core/utils';

const obj = unflattenObject({ 'db.host': 'localhost' });
// Result: { db: { host: 'localhost' } }
```

### hasRequiredKeys

Check if required keys exist in credentials.

```typescript
import { hasRequiredKeys } from '@libertas/core/utils';

const has = hasRequiredKeys(creds, ['username', 'password']);
```

### maskCredentials

Mask sensitive values in credentials.

```typescript
import { maskCredentials } from '@libertas/core/utils';

const masked = maskCredentials(credentials);
// password, token, api_key, secret fields are masked
```

### validateAgainstSchema

Validate credentials against a schema.

```typescript
import { validateAgainstSchema } from '@libertas/core/utils';

const result = validateAgainstSchema(creds, {
  username: { required: true, type: 'string' },
  port: { type: 'number' },
  email: { pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ }
});

if (result.valid) {
  console.log('Credentials are valid');
} else {
  console.log('Errors:', result.errors);
}
```

## Builder Pattern

### createCredentialsBuilder

Create a fluent builder for CredentialsManager.

```typescript
import { createCredentialsBuilder } from '@libertas/core';

const manager = createCredentialsBuilder()
  .withGeneratedMasterKey()
  .withFileStorage('./credentials')
  .withAESEncryption()
  .withEnvironment('production')
  .build();
```

### Builder Methods

#### `withMasterKey(key: string): CredentialsBuilder`

Set a specific master key.

#### `withGeneratedMasterKey(): CredentialsBuilder`

Generate a random master key.

#### `withPasswordDerivedKey(password: string): CredentialsBuilder`

Derive master key from a password.

#### `withInMemoryStorage(): CredentialsBuilder`

Use in-memory storage.

#### `withFileStorage(basePath: string): CredentialsBuilder`

Use file-based storage.

#### `withStorageBackend(backend: StorageBackend): CredentialsBuilder`

Use custom storage backend.

#### `withAESEncryption(): CredentialsBuilder`

Use AES-256-GCM encryption.

#### `withEncryptionStrategy(strategy: EncryptionStrategy): CredentialsBuilder`

Use custom encryption strategy.

#### `withEnvironment(environment: string): CredentialsBuilder`

Set the environment.

#### `build(): CredentialsManager`

Build the configured CredentialsManager.

#### `getConfig(): CredentialsConfig`

Get the current builder configuration.

## CLI Handler

### CredentialsCLI

Command-line interface handler for credentials.

```typescript
import { CredentialsCLI, createCredentialsBuilder } from '@libertas/core';

const manager = createCredentialsBuilder().build();
const cli = new CredentialsCLI(manager);

const result = await cli.execute('get', { key: 'app-config' });
```

### Commands

#### `get`

Retrieve credentials.

```typescript
await cli.execute('get', { key: 'app-config' });
```

#### `set`

Set a credential value.

```typescript
await cli.execute('set', {
  key: 'app-config',
  path: 'database_url',
  value: 'postgresql://...'
});
```

#### `edit`

Replace entire credential set.

```typescript
await cli.execute('edit', {
  key: 'app-config',
  credentials: { db_url: '...', api_key: '...' }
});
```

#### `delete`

Remove credentials.

```typescript
await cli.execute('delete', { key: 'app-config' });
```

#### `list`

Show all credential keys.

```typescript
await cli.execute('list');
```

#### `show`

Display credentials (with optional masking).

```typescript
await cli.execute('show', { key: 'app-config', mask: true });
```

## Error Handling

### Error Types

#### CredentialsError

Base error class for all libertas errors.

```typescript
import { CredentialsError } from '@libertas/core';

try {
  await manager.load('key');
} catch (error) {
  if (error instanceof CredentialsError) {
    console.error('Code:', error.code);
    console.error('Message:', error.message);
  }
}
```

#### ValidationError

Validation-related errors.

#### EncryptionError

Encryption/decryption errors.

#### StorageError

Storage backend errors.

#### KeyDerivationError

Key derivation errors.

### Example Error Handling

```typescript
import {
  CredentialsError,
  ValidationError,
  EncryptionError,
} from '@libertas/core';

try {
  await manager.save(key, credentials);
} catch (error) {
  if (error instanceof ValidationError) {
    console.error('Invalid input:', error.message);
  } else if (error instanceof EncryptionError) {
    console.error('Encryption failed:', error.message);
  } else if (error instanceof CredentialsError) {
    console.error('General error:', error.message);
  }
}
```

## Types

### Credentials

```typescript
interface Credentials {
  [key: string]: string | number | boolean | object;
}
```

### CredentialsConfig

```typescript
interface CredentialsConfig {
  masterKey?: string;
  storageBackend?: StorageBackend;
  encryptionStrategy?: EncryptionStrategy;
  environment?: string;
}
```

### StorageBackend

```typescript
interface StorageBackend {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
}
```

### EncryptionStrategy

```typescript
interface EncryptionStrategy {
  encrypt(data: string, key: string): Promise<string>;
  decrypt(encryptedData: string, key: string): Promise<string>;
}
```
