# @libertas/cli API Documentation

Complete API reference for the libertas CLI package.

## Table of Contents

1. [CredentialsCLI](#credentialscli)
2. [createProgram](#createprogram)
3. [Config Loader](#config-loader)
4. [Formatter](#formatter)
5. [Types](#types)

## CredentialsCLI

Main CLI handler class for executing credentials commands.

### Constructor

```typescript
new CredentialsCLI(manager: CredentialsManager)
```

### Static Methods

#### `fromConfig(config: CLIConfig): Promise<CredentialsCLI>`

Create a CLI instance from configuration.

```typescript
const cli = await CredentialsCLI.fromConfig({
  environment: 'production',
  storagePath: './credentials',
  masterKey: process.env.MASTER_KEY,
});
```

### Instance Methods

#### `execute(command: string, args?: Record<string, any>): Promise<CommandResult>`

Execute a CLI command.

```typescript
const result = await cli.execute('get', { key: 'database' });
```

### Supported Commands

#### `get`

Retrieve credentials.

```typescript
const result = await cli.execute('get', {
  key: 'database',
});
```

Response:
```typescript
{
  success: true,
  data: {
    host: 'localhost',
    port: 5432,
    username: 'admin'
  }
}
```

#### `set`

Set a credential value.

```typescript
const result = await cli.execute('set', {
  key: 'database',
  path: 'password',
  value: 'new-password'
});
```

#### `edit`

Replace entire credential set.

```typescript
const result = await cli.execute('edit', {
  key: 'database',
  credentials: {
    host: 'db.example.com',
    port: 5432,
    username: 'admin',
    password: 'secret'
  }
});
```

#### `delete`

Delete credentials.

```typescript
const result = await cli.execute('delete', {
  key: 'database'
});
```

#### `list`

List all credential keys.

```typescript
const result = await cli.execute('list', {});
```

Response:
```typescript
{
  success: true,
  data: ['database', 'api-keys', 'secrets'],
  message: 'Found 3 credential set(s)'
}
```

#### `show`

Display credentials with optional masking.

```typescript
const result = await cli.execute('show', {
  key: 'database',
  mask: true
});
```

#### `validate`

Validate credentials against schema.

```typescript
const result = await cli.execute('validate', {
  key: 'database',
  schema: {
    host: { required: true, type: 'string' },
    port: { type: 'number' }
  }
});
```

Response:
```typescript
{
  success: true,
  data: {
    valid: true,
    errors: []
  },
  message: 'Credentials are valid'
}
```

## createProgram

Create a Commander-based CLI program.

### Function Signature

```typescript
async function createProgram(options?: ProgramOptions): Promise<Command>
```

### Parameters

```typescript
interface ProgramOptions {
  config?: CLIConfig;
  verbose?: boolean;
}
```

### Usage

```typescript
import { createProgram } from '@libertas/cli';

const program = await createProgram({
  config: {
    environment: 'production',
    storagePath: './credentials'
  }
});

// Parse and execute
await program.parseAsync(process.argv);
```

### Program Options

The created program supports these global options:

- `-v, --verbose`: Enable verbose output
- `--env <environment>`: Set environment
- `--storage-path <path>`: Set storage path
- `--master-key <key>`: Set master key

### Program Commands

The program provides these commands:

- `get <key> [--mask]`
- `set <key> <path> <value>`
- `edit <key> [--file <path>]`
- `delete <key> [--force]`
- `list`
- `show <key> [--mask]`
- `validate <key> [--schema <json>] [--file <path>]`

## Config Loader

Utilities for loading and saving CLI configuration.

### loadConfig

```typescript
async function loadConfig(cwd?: string): Promise<CLIConfig>
```

Load CLI configuration from files and environment variables.

```typescript
const config = await loadConfig('./project');
console.log(config.environment); // 'development'
```

Configuration precedence (highest to lowest):
1. Environment variables
2. `.libertasrc` file
3. `.libertasrc.json` file
4. `.libertasrc.js` file
5. Defaults

### saveConfig

```typescript
async function saveConfig(config: CLIConfig, cwd?: string): Promise<void>
```

Save configuration to `.libertasrc` file.

```typescript
await saveConfig({
  environment: 'production',
  storagePath: './credentials'
}, './project');
```

## Formatter

Output formatting utilities using chalk.

### Static Methods

#### `success(message: string): string`

Format success message.

```typescript
console.log(Formatter.success('Operation completed'));
// Output: ✓ Operation completed (in green)
```

#### `error(message: string): string`

Format error message.

```typescript
console.log(Formatter.error('Something went wrong'));
// Output: ✗ Something went wrong (in red)
```

#### `warning(message: string): string`

Format warning message.

```typescript
console.log(Formatter.warning('Be careful'));
// Output: ⚠ Be careful (in yellow)
```

#### `info(message: string): string`

Format info message.

```typescript
console.log(Formatter.info('Information'));
// Output: ℹ Information (in blue)
```

#### `header(text: string): string`

Format section header.

```typescript
console.log(Formatter.header('Credentials'));
// Output: Credentials (bold cyan with spacing)
```

#### `keyValue(key: string, value: any): string`

Format key-value pair.

```typescript
console.log(Formatter.keyValue('host', 'localhost'));
// Output: host: "localhost"
```

#### `json(data: any, indent?: number): string`

Format JSON data.

```typescript
const output = Formatter.json({ name: 'app' }, 2);
console.log(output);
```

#### `list(items: string[]): string`

Format list of items.

```typescript
const output = Formatter.list(['item1', 'item2', 'item3']);
console.log(output);
// Output:
//   • item1
//   • item2
//   • item3
```

#### `table(data: any[]): void`

Format and display table.

```typescript
Formatter.table([
  { name: 'database', updated: '2024-01-15' },
  { name: 'api-keys', updated: '2024-01-20' }
]);
```

## Types

### CLIConfig

Configuration for the CLI.

```typescript
interface CLIConfig {
  masterKey?: string;
  storagePath?: string;
  environment?: string;
  verbose?: boolean;
}
```

### CommandResult

Result of executing a CLI command.

```typescript
interface CommandResult {
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
}
```

### ProgramOptions

Options for creating the CLI program.

```typescript
interface ProgramOptions {
  config?: CLIConfig;
  verbose?: boolean;
}
```

## Error Handling

All commands return a `CommandResult` with error information:

```typescript
const result = await cli.execute('get', { key: 'non-existent' });

if (!result.success) {
  console.error('Error:', result.error);
  process.exit(1);
}
```

Errors from underlying @libertas/core operations are caught and reported:

- `ValidationError`: Invalid input arguments
- `EncryptionError`: Encryption/decryption failed
- `StorageError`: Storage backend error
- `CredentialsError`: General credential operation error

## Examples

### Complete CLI Program Setup

```typescript
import { createProgram } from '@libertas/cli';
import path from 'path';

async function main() {
  // Load configuration from project directory
  const configPath = path.join(process.cwd(), '.libertasrc');

  // Create and parse program
  const program = await createProgram({
    config: {
      environment: process.env.NODE_ENV || 'development',
      storagePath: process.env.CREDENTIALS_PATH || './credentials'
    }
  });

  // Parse command-line arguments
  await program.parseAsync(process.argv);
}

main().catch((error) => {
  console.error('Fatal error:', error.message);
  process.exit(1);
});
```

### Custom Command Wrapper

```typescript
import { CredentialsCLI } from '@libertas/cli';

async function getCredentials(key: string) {
  const cli = await CredentialsCLI.fromConfig({
    environment: 'production'
  });

  const result = await cli.execute('get', { key });

  if (result.success) {
    return result.data;
  } else {
    throw new Error(result.error || 'Failed to get credentials');
  }
}
```

### Batch Operations

```typescript
import { CredentialsCLI } from '@libertas/cli';

async function backupCredentials(keys: string[]) {
  const cli = await CredentialsCLI.fromConfig({});

  for (const key of keys) {
    const result = await cli.execute('get', { key });

    if (result.success) {
      // Save to backup
      console.log(`Backed up: ${key}`);
    }
  }
}
```
