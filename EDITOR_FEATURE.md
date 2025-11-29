# Libertas Editor Feature - Rails-Style Credentials Editing

This document describes the editor functionality for editing credentials in your favorite editor, similar to how Rails credentials work.

## Overview

The `libertas open` command allows you to edit credentials in your favorite editor. When you run the command, Libertas will:

1. Load existing credentials (or create empty ones if they don't exist)
2. Convert them to YAML format
3. Open your default editor (or a specified one)
4. Wait for you to finish editing
5. Parse the edited YAML
6. Save the credentials encrypted

## Features

- **Environment Scopes**: Separate credentials per environment (development, production, staging, etc.)
- **Editor Support**: Uses `$EDITOR` environment variable or `--editor` parameter
- **YAML Format**: Edit credentials in human-readable YAML format
- **Create on Demand**: Create new credentials if they don't exist
- **Rails-Compatible**: Workflow similar to `rails credentials:edit`

## Installation

The editor functionality is built into `@libertas/cli`:

```bash
npm install -g @libertas/cli
```

## Usage

### Basic Usage

Open credentials for editing:

```bash
libertas open database
```

This will:
- Load credentials named "database" (or create empty ones)
- Open them in your `$EDITOR`
- Save them after you quit the editor

### With Scopes (Environments)

Edit production database credentials:

```bash
libertas open database --scope production
```

Edit staging credentials:

```bash
libertas open api-keys --scope staging
```

Edit development credentials:

```bash
libertas open secrets --scope development
```

### Specifying an Editor

Override the default editor:

```bash
libertas open database --editor vim
libertas open database --editor nano
libertas open database --editor code  # VSCode
libertas open database --editor emacs
```

### Full Examples

```bash
# Edit development database credentials in vim
libertas open database --scope development --editor vim

# Edit production API keys in VSCode
libertas open api-keys --scope production --editor code

# Create new staging secrets in nano
libertas open secrets --scope staging --editor nano
```

### Aliases

You can also use `editor` instead of `open`:

```bash
libertas editor database --scope production
```

## Credential Scopes

Scopes allow you to maintain separate credentials for different environments:

```bash
# Development
libertas open database --scope development

# Production
libertas open database --scope production

# Staging
libertas open database --scope staging
```

Behind the scenes, these are stored as:
- `database.development`
- `database.production`
- `database.staging`

## YAML Format

Credentials are edited in YAML format for readability:

### Simple Credentials

```yaml
username: admin
password: secret123
port: 5432
```

### Nested Credentials

```yaml
database:
  host: localhost
  port: 5432
  username: admin
  password: secret123

cache:
  host: redis.example.com
  port: 6379
```

### Various Data Types

```yaml
# Strings
api_key: sk-test-12345

# Numbers
port: 5432
timeout: 30

# Booleans
ssl: true
debug: false

# Null values
backup_key:

# Arrays
servers:
  - server1.example.com
  - server2.example.com
  - server3.example.com
```

## Examples

### Example 1: Create Database Credentials

```bash
$ libertas open database --scope production

# Your editor opens with:
# (empty file)

# You add:
host: db.example.com
port: 5432
username: produser
password: very-secure-password
database: production_db

# You save and quit
# Credentials are saved encrypted
```

### Example 2: Edit API Keys

```bash
$ libertas open api-keys

# Your editor opens with existing credentials:
stripe_live_key: sk-live-12345
stripe_test_key: sk-test-67890
github_token: ghp-xxxx

# You update:
stripe_live_key: sk-live-99999  # Updated
stripe_test_key: sk-test-67890
github_token: ghp-yyyy           # Updated

# You save and quit
```

### Example 3: Different Editors for Different Environments

```bash
# Production - careful editing in vim
libertas open secrets --scope production --editor vim

# Development - quick edit in nano
libertas open secrets --scope development --editor nano

# Staging - edit in VSCode
libertas open secrets --scope staging --editor code
```

## Environment Variables

Set your default editor:

```bash
export EDITOR=vim
libertas open database

# or

export EDITOR=nano
libertas open database
```

CLI also respects these environment variables for credentials:

```bash
export LIBERTAS_ENV=production
export LIBERTAS_STORAGE_PATH=./credentials
export LIBERTAS_MASTER_KEY=<your-hex-key>
```

## Security Considerations

1. **Temporary Files**: Edited credentials are stored in a temporary file during editing, located in your system's temp directory (`/tmp` on Unix, `%TEMP%` on Windows)
2. **Encryption**: All saved credentials are encrypted with your master key
3. **Editor**: Use a secure editor; avoid editors that sync to cloud storage
4. **Master Key**: Keep your master key secure and backed up

## Programmatic Usage

You can also use the editor functionality programmatically:

```typescript
import { CredentialsCLI } from '@libertas/cli';

const cli = await CredentialsCLI.fromConfig({
  storagePath: './credentials',
  masterKey: process.env.LIBERTAS_MASTER_KEY,
});

const result = await cli.execute('editor', {
  name: 'database',
  scope: 'production',
  editor: 'vim',
  create: true,
});

if (result.success) {
  console.log('Credentials saved:', result.data);
} else {
  console.error('Error:', result.error);
}
```

### YAML Parsing/Formatting (Advanced)

```typescript
import { objectToYAML, yamlToObject } from '@libertas/cli/utils/editor';

// Convert object to YAML
const yaml = objectToYAML({
  username: 'admin',
  database: { host: 'localhost', port: 5432 }
});

// Parse YAML back to object
const obj = yamlToObject(yaml);
```

## Comparison with Rails

### Rails Credentials

```bash
rails credentials:edit
```

### Libertas Credentials

```bash
libertas open credentials
```

| Feature | Rails | Libertas |
|---------|-------|----------|
| Default editor | `$EDITOR` | `$EDITOR` |
| Custom editor | `EDITOR=vim rails credentials:edit` | `libertas open --editor vim` |
| Environments | ✅ (automatic) | ✅ (with `--scope`) |
| Format | YAML | YAML |
| Encryption | AES-GCM | AES-GCM |
| Key derivation | Derived from master key | Derived from password or explicit key |

## Troubleshooting

### "Editor exited with error"

This usually means:
1. The editor command wasn't found
2. The editor exited with a non-zero status

**Solution**: Specify a valid editor with `--editor`:

```bash
libertas open database --editor vim
```

### "Credentials not found"

If editing credentials that don't exist:

**Solution**: The command creates them automatically by default. If you see this error with `--no-create`:

```bash
# This will fail if credentials don't exist
libertas open database --no-create

# Use without --no-create to create them
libertas open database
```

### "Failed to parse YAML"

If the YAML you entered is invalid:

**Solution**: Check YAML syntax and try again:

```yaml
# Valid YAML
key: value
nested:
  key: value

# Invalid YAML (missing colon)
key value
```

### "Permission denied on temp file"

Rare issue with temporary file permissions:

**Solution**: Check your system's temp directory permissions:

```bash
# Unix/Linux
ls -la /tmp | head

# macOS
ls -la /var/tmp | head
```

## Advanced: Custom Credential Structure

### Create complex nested structures

```bash
$ libertas open app-config --scope production
```

Edit to:

```yaml
database:
  primary:
    host: db1.example.com
    port: 5432
    credentials:
      username: admin
      password: pass123
  replica:
    host: db2.example.com
    port: 5432

cache:
  redis:
    host: redis.example.com
    port: 6379
  memcached:
    host: memcached.example.com
    port: 11211

api_keys:
  stripe: sk-live-xxxxx
  github: ghp-yyyyy
  aws_access_key: AKIAIOSFODNN7EXAMPLE
  aws_secret_key: wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
```

All nested structures are preserved and encrypted.

## API Reference

### CLI Command

```bash
libertas open <name> [options]
```

**Arguments**:
- `name`: Credential set name (required)

**Options**:
- `-s, --scope <scope>`: Environment scope (e.g., production, staging)
- `-e, --editor <editor>`: Editor to use (overrides $EDITOR)
- `--no-create`: Don't create if credentials don't exist

### Programmatic API

```typescript
const result = await cli.execute('editor', {
  name: string;           // Credential name
  scope?: string;         // Optional scope/environment
  editor?: string;        // Optional editor
  create?: boolean;       // Create if not exists (default: true)
});
```

## See Also

- [Core API Documentation](./packages/core/API.md)
- [CLI Documentation](./packages/cli/README.md)
- [Project Structure](./PROJECT_STRUCTURE.md)
