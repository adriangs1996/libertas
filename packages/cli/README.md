# @libertas/cli

Command-line interface for libertas credentials management system.

## Features

- Interactive CLI for managing encrypted credentials
- Commander-based command structure
- Configuration file support
- Formatted output with chalk
- Schema validation
- Credential masking for safe logging
- File-based and in-memory storage backends

## Installation

```bash
npm install -g @libertas/cli
# or
npm install @libertas/cli --save-dev
```

## Quick Start

### Initialize Configuration

Create a `.libertasrc` file in your project:

```json
{
  "environment": "development",
  "storagePath": "./credentials"
}
```

### Basic Commands

```bash
# Save credentials
libertas set database host localhost
libertas set database port 5432

# Retrieve credentials
libertas get database

# List all credential sets
libertas list

# Delete credentials
libertas delete database --force
```

## Commands

### get

Retrieve a credential set.

```bash
libertas get <key> [--mask]
```

Options:
- `--mask, -m`: Mask sensitive values in output

Example:
```bash
libertas get app-config --mask
```

### set

Set a specific credential value.

```bash
libertas set <key> <path> <value>
```

Example:
```bash
libertas set database host postgresql.example.com
libertas set database port 5432
```

### edit

Replace entire credential set from JSON file.

```bash
libertas edit <key> [--file <path>]
```

Options:
- `--file, -f <path>`: Load credentials from JSON file

Example:
```bash
libertas edit production --file prod-credentials.json
```

### delete

Delete a credential set.

```bash
libertas delete <key> [--force]
```

Options:
- `--force, -f`: Skip confirmation prompt

Example:
```bash
libertas delete staging --force
```

### list

List all credential keys.

```bash
libertas list
```

### show

Display a credential set (with optional masking).

```bash
libertas show <key> [--mask]
```

Options:
- `--mask, -m`: Mask sensitive values

Example:
```bash
libertas show database --mask
```

### validate

Validate credentials against a schema.

```bash
libertas validate <key> [--schema <json>] [--file <path>]
```

Options:
- `--schema, -s <json>`: Schema as JSON string
- `--file, -f <path>`: Load schema from JSON file

Example:
```bash
libertas validate production --file schema.json
```

## Configuration

### Configuration Files

The CLI looks for configuration in the following order:

1. `.libertasrc` (JSON format)
2. `.libertasrc.json`
3. `.libertasrc.js` (JSON format)

### Configuration Options

```json
{
  "environment": "development",
  "storagePath": "./credentials",
  "masterKey": "hex-encoded-64-character-string"
}
```

### Environment Variables

Override configuration with environment variables:

- `LIBERTAS_ENV`: Set environment
- `LIBERTAS_STORAGE_PATH`: Set storage directory
- `LIBERTAS_MASTER_KEY`: Set master key

Example:
```bash
LIBERTAS_ENV=production LIBERTAS_STORAGE_PATH=/var/lib/libertas libertas list
```

## Usage Examples

### Store Database Credentials

```bash
# Initialize database credentials
libertas edit database --file db-config.json

# Content of db-config.json:
# {
#   "host": "db.example.com",
#   "port": 5432,
#   "username": "app_user",
#   "password": "secure_password"
# }
```

### Store API Credentials

```bash
libertas set api-keys stripe sk-test-123456
libertas set api-keys stripe-public pk-test-123456
libertas set api-keys github ghp-1234567890
```

### View Masked Credentials

```bash
# Safe to use in logs or during debugging
libertas get database --mask
```

### Validate Configuration

```bash
# Create schema.json
# {
#   "host": { "required": true, "type": "string" },
#   "port": { "required": true, "type": "number" },
#   "username": { "required": true, "type": "string" }
# }

libertas validate database --file schema.json
```

### Batch Operations

```bash
# Load multiple credential sets from files
for env in dev staging prod; do
  libertas edit $env --file config/$env.json
done

# List all
libertas list
```

## Programmatic Usage

### Using CredentialsCLI

```typescript
import { CredentialsCLI, createProgram } from '@libertas/cli';
import { createCredentialsBuilder } from '@libertas/core';

// Create CLI instance
const manager = createCredentialsBuilder()
  .withPasswordDerivedKey('my-password')
  .withFileStorage('./credentials')
  .build();

const cli = new CredentialsCLI(manager);

// Execute commands
const result = await cli.execute('get', { key: 'database' });
if (result.success) {
  console.log('Credentials:', result.data);
} else {
  console.error('Error:', result.error);
}
```

### Using the Program

```typescript
import { createProgram } from '@libertas/cli';

const program = await createProgram();
await program.parseAsync(process.argv);
```

### Custom Configuration

```typescript
import { CredentialsCLI } from '@libertas/cli';

const cli = await CredentialsCLI.fromConfig({
  environment: 'production',
  storagePath: '/var/lib/libertas',
  masterKey: process.env.MASTER_KEY,
});

const result = await cli.execute('list');
```

## Output Examples

### List Credentials

```bash
$ libertas list
✓ Found 3 credential set(s)
  • database
  • api-keys
  • secrets
```

### Get Credentials with Masking

```bash
$ libertas get database --mask
✓ Credentials (masked)
{
  "host": "db.example.com",
  "port": 5432,
  "username": "admin",
  "password": "***MASKED***"
}
```

### Validate Credentials

```bash
$ libertas validate database --file schema.json
✓ Credentials are valid
```

### Validation Error

```bash
$ libertas validate database --file schema.json
✗ Validation failed
  • Missing required field: password
  • Field port should be number, got string
```

## CI/CD Integration

### GitHub Actions

```yaml
name: Validate Credentials

on: [push]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      - run: npm install -g @libertas/cli

      - run: libertas list
        env:
          LIBERTAS_MASTER_KEY: ${{ secrets.LIBERTAS_MASTER_KEY }}
          LIBERTAS_STORAGE_PATH: ./credentials
```

### Docker

```dockerfile
FROM node:18-alpine

RUN npm install -g @libertas/cli

WORKDIR /app
COPY credentials ./credentials

CMD ["libertas", "list"]
```

## Security Considerations

1. **Master Key Protection**: Never commit the master key to version control
2. **File Permissions**: Restrict access to credential files (`chmod 600`)
3. **Masked Output**: Use `--mask` flag when logging credentials
4. **Environment Variables**: Use for sensitive configuration in CI/CD
5. **Validation**: Regularly validate credentials with schemas

## Troubleshooting

### Command Not Found

```bash
# If installed globally
which libertas

# If installed locally
npx libertas list
```

### Configuration Not Loading

```bash
# Check configuration files
ls -la .libertasrc*

# Verify environment variables
echo $LIBERTAS_ENV
echo $LIBERTAS_STORAGE_PATH
```

### Permission Denied on Credentials File

```bash
# Fix file permissions
chmod 600 credentials/*
```

### Invalid JSON in Config

```bash
# Validate JSON file
cat .libertasrc | jq .
```

## API Reference

For programmatic usage and advanced features, see the [CLI API documentation](./API.md).

## License

MIT
