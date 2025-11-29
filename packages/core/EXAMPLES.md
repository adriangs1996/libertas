# @libertas/core Usage Examples

Practical examples for using the libertas core credentials management library.

## Basic Usage

### Initialize with Default Settings

```typescript
import { createCredentialsBuilder } from '@libertas/core';

const manager = createCredentialsBuilder()
  .withGeneratedMasterKey()
  .withInMemoryStorage()
  .build();
```

### Save and Load Credentials

```typescript
// Save credentials
await manager.save('database', {
  host: 'localhost',
  port: 5432,
  username: 'admin',
  password: 'secret',
});

// Load credentials
const dbConfig = await manager.load('database');
console.log(dbConfig.host); // 'localhost'
```

## File-Based Storage

### Persistent File Storage

```typescript
import { createCredentialsBuilder } from '@libertas/core';

const manager = createCredentialsBuilder()
  .withGeneratedMasterKey()
  .withFileStorage('./credentials')
  .build();

// All credentials will be saved to ./credentials directory
await manager.save('app-secrets', {
  api_key: 'sk-1234567890',
  secret: 'very-secret-value',
});
```

## Password-Based Key Derivation

### Derive Master Key from Password

```typescript
import { createCredentialsBuilder } from '@libertas/core';

const manager = createCredentialsBuilder()
  .withPasswordDerivedKey('my-secure-password')
  .withFileStorage('./credentials')
  .build();

// The master key is derived from the password
// Use the same password to decrypt credentials later
```

## Advanced Configuration

### Custom Encryption Strategy

```typescript
import {
  CredentialsManager,
  AESEncryption,
  FileStorage,
  CryptoUtils,
} from '@libertas/core';

const manager = new CredentialsManager({
  masterKey: CryptoUtils.generateMasterKey(),
  storageBackend: new FileStorage('./credentials'),
  encryptionStrategy: new AESEncryption(),
  environment: 'production',
});
```

## Working with Credentials

### Update Specific Values

```typescript
const updated = await manager.update('database', {
  password: 'new-password',
});

console.log(updated);
// {
//   host: 'localhost',
//   port: 5432,
//   username: 'admin',
//   password: 'new-password'
// }
```

### Check if Credentials Exist

```typescript
const exists = await manager.exists('database');
if (exists) {
  const creds = await manager.load('database');
} else {
  console.log('No database credentials found');
}
```

### Delete Credentials

```typescript
await manager.delete('database');
const exists = await manager.exists('database');
console.log(exists); // false
```

## Utility Functions

### Mask Sensitive Values

```typescript
import { maskCredentials } from '@libertas/core';

const creds = {
  username: 'admin',
  password: 'secret123',
  api_key: 'sk-123456',
  database_url: 'postgresql://...',
};

const masked = maskCredentials(creds);
console.log(masked);
// {
//   username: 'admin',
//   password: '***MASKED***',
//   api_key: '***MASKED***',
//   database_url: 'postgresql://...'
// }
```

### Flatten and Unflatten Objects

```typescript
import { flattenObject, unflattenObject } from '@libertas/core';

const nested = {
  database: {
    primary: { host: 'db1.example.com', port: 5432 },
    replica: { host: 'db2.example.com', port: 5432 },
  },
};

const flat = flattenObject(nested);
// {
//   'database.primary.host': 'db1.example.com',
//   'database.primary.port': 5432,
//   'database.replica.host': 'db2.example.com',
//   'database.replica.port': 5432
// }

const restored = unflattenObject(flat);
// Restores the original nested structure
```

### Get Nested Values

```typescript
import { getNestedValue, setNestedValue } from '@libertas/core';

const creds = {
  database: {
    primary: {
      host: 'localhost',
    },
  },
};

const host = getNestedValue(creds, 'database.primary.host');
console.log(host); // 'localhost'

setNestedValue(creds, 'database.primary.port', 5432);
// creds.database.primary.port is now 5432
```

### Deep Merge Objects

```typescript
import { deepMerge } from '@libertas/core';

const defaults = {
  database: { port: 5432, ssl: false },
  cache: { ttl: 3600 },
};

const overrides = {
  database: { ssl: true },
};

const merged = deepMerge(defaults, overrides);
// {
//   database: { port: 5432, ssl: true },
//   cache: { ttl: 3600 }
// }
```

## Schema Validation

### Validate Credentials Against Schema

```typescript
import { validateAgainstSchema } from '@libertas/core';

const creds = {
  username: 'admin',
  password: 'secret123',
  port: 5432,
  email: 'admin@example.com',
};

const schema = {
  username: { required: true, type: 'string' },
  password: { required: true, type: 'string' },
  port: { type: 'number' },
  email: { pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
};

const result = validateAgainstSchema(creds, schema);

if (result.valid) {
  console.log('Credentials are valid');
} else {
  console.log('Validation errors:', result.errors);
}
```

## Cryptographic Operations

### Work with CryptoUtils

```typescript
import { CryptoUtils } from '@libertas/core';

// Generate a master key
const masterKey = CryptoUtils.generateMasterKey();

// Hash sensitive data
const hash = CryptoUtils.hash('password');

// Generate random bytes
const randomBytes = CryptoUtils.randomBytes(32);

// Constant-time comparison
const isEqual = CryptoUtils.constantTimeCompare('key1', 'key2');

// Derive key from password
const derived = CryptoUtils.deriveKey('my-password', {
  iterations: 100_000,
  keyLength: 32,
});

const salt = CryptoUtils.extractSalt(derived);
const key = CryptoUtils.extractKey(derived);
```

## CLI Usage

### Programmatic CLI Interface

```typescript
import { CredentialsCLI, createCredentialsBuilder } from '@libertas/core';

const manager = createCredentialsBuilder().build();
const cli = new CredentialsCLI(manager);

// Get credentials
const result = await cli.execute('get', { key: 'database' });
if (result.success) {
  console.log('Credentials:', result.data);
} else {
  console.error('Error:', result.error);
}

// Set a credential value
await cli.execute('set', {
  key: 'database',
  path: 'password',
  value: 'new-password',
});

// List all credential keys
const listResult = await cli.execute('list');
console.log('Keys:', listResult.data);

// Show credentials with masking
const showResult = await cli.execute('show', {
  key: 'database',
  mask: true,
});
console.log('Masked credentials:', showResult.data);
```

## Environment-Specific Configuration

### Production Setup

```typescript
import { createCredentialsBuilder } from '@libertas/core';

const manager = createCredentialsBuilder()
  .withMasterKey(process.env.MASTER_KEY || '')
  .withFileStorage(process.env.CREDENTIALS_PATH || './credentials')
  .withEnvironment('production')
  .build();
```

### Development Setup

```typescript
import { createCredentialsBuilder } from '@libertas/core';

const manager = createCredentialsBuilder()
  .withGeneratedMasterKey()
  .withInMemoryStorage()
  .withEnvironment('development')
  .build();
```

## Error Handling

### Comprehensive Error Handling

```typescript
import {
  CredentialsCLI,
  CredentialsError,
  ValidationError,
  EncryptionError,
  StorageError,
  createCredentialsBuilder,
} from '@libertas/core';

const manager = createCredentialsBuilder().build();
const cli = new CredentialsCLI(manager);

try {
  const result = await cli.execute('get', { key: 'database' });

  if (!result.success) {
    throw new Error(result.error || 'Unknown error');
  }

  console.log('Credentials:', result.data);
} catch (error) {
  if (error instanceof ValidationError) {
    console.error('Invalid input:', error.message);
  } else if (error instanceof EncryptionError) {
    console.error('Encryption failed:', error.message);
  } else if (error instanceof StorageError) {
    console.error('Storage failed:', error.message);
  } else if (error instanceof CredentialsError) {
    console.error('Credentials error:', error.message);
  } else {
    console.error('Unexpected error:', error);
  }
}
```

## Complete Application Example

### Secure Configuration Manager

```typescript
import {
  createCredentialsBuilder,
  maskCredentials,
  validateAgainstSchema,
} from '@libertas/core';

class AppConfig {
  private manager = createCredentialsBuilder()
    .withPasswordDerivedKey(process.env.CONFIG_PASSWORD || 'default')
    .withFileStorage('./config')
    .build();

  async load(environment: string) {
    try {
      const config = await this.manager.load(environment);

      // Validate the configuration
      const result = validateAgainstSchema(config, {
        database_url: { required: true, type: 'string' },
        api_key: { required: true, type: 'string' },
        cache_ttl: { type: 'number' },
      });

      if (!result.valid) {
        throw new Error(`Invalid config: ${result.errors.join(', ')}`);
      }

      return config;
    } catch (error) {
      console.error(`Failed to load ${environment} config:`, error);
      throw error;
    }
  }

  async save(environment: string, config: any) {
    await this.manager.save(environment, config);
  }

  async logConfig(environment: string) {
    const config = await this.manager.load(environment);
    const masked = maskCredentials(config);
    console.log(`${environment} configuration:`, masked);
  }
}

// Usage
const appConfig = new AppConfig();

// Load production config
const prodConfig = await appConfig.load('production');

// Log with masked sensitive values
await appConfig.logConfig('production');

// Update a value
await appConfig.manager.update('production', {
  cache_ttl: 7200,
});
```
