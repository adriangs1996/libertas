# Libertas - Development Guide for Claude Code

This document provides essential context for Claude Code when working on the Libertas project. It's designed to help you understand the project structure, architecture, and development workflows.

## Project Overview

**Libertas** is a secure credentials management system inspired by Rails credentials. It's a monorepo of TypeScript packages providing:
- A zero-dependency core library for credentials management
- A command-line interface (CLI) for managing credentials
- Support for multiple storage backends and encryption strategies
- Rails-style editor-based credential editing with environment scopes

### Key Statistics
- **Architecture**: pnpm workspaces monorepo
- **Build System**: Turbo
- **Testing**: Vitest
- **Coverage**: 149 total tests (102 core + 47 CLI)
- **TypeScript**: 100% - strict mode with ES2020 target
- **Security**: AES-256-GCM encryption, PBKDF2 key derivation (100,000 iterations)

## Monorepo Structure

```
libertas/
├── packages/
│   ├── core/              # @libertas/core - Zero-dependency core library
│   └── cli/               # @libertas/cli - Command-line interface
├── package.json           # Root workspace configuration
├── pnpm-workspace.yaml    # pnpm workspaces definition
├── turbo.json             # Turbo build orchestration
├── tsconfig.json          # Base TypeScript configuration
├── .prettierrc.json       # Prettier code formatting
└── README.md              # Project overview
```

## Package Descriptions

### @libertas/core (Zero Dependencies)
The heart of Libertas - all encryption and credentials management logic lives here.

**Location**: `/packages/core/src/`

**Key Modules**:
- `crypto/` - Cryptographic utilities (key derivation, hashing)
- `encryption/` - AES-256-GCM encryption implementation
- `storage/` - InMemoryStorage and FileStorage backends
- `manager/` - CredentialsManager class (main API)
- `builder/` - Builder pattern for manager configuration
- `utils/` - Utility functions (object manipulation, validation, masking)
- `errors/` - Custom error hierarchy
- `types/` - TypeScript interfaces and types

**Entry Points** (defined in `exports` field):
- `.` - Main entry point (all exports)
- `./crypto` - Crypto utilities only
- `./storage` - Storage implementations only
- `./encryption` - Encryption strategy only
- `./utils` - Utility functions only
- `./builder` - Builder pattern only

**Key Classes**:
- `CredentialsManager` - Main class for credentials operations
- `CryptoUtils` - Static cryptographic utility methods
- `AESEncryption` - Encryption/decryption implementation
- `FileStorage` - File-based storage backend
- `InMemoryStorage` - In-memory storage (development)
- `CredentialsBuilder` - Fluent builder for configuration

### @libertas/cli
Command-line interface built with Commander.js and Chalk for terminal colors.

**Location**: `/packages/cli/src/`

**Key Modules**:
- `commands/credentials-cli.ts` - Command handler implementation
- `program.ts` - Commander-based CLI program setup (8 commands)
- `utils/config-loader.ts` - Configuration file and env var loading
- `utils/formatter.ts` - Terminal output formatting
- `utils/editor.ts` - External editor integration (YAML format)
- `bin/cli.ts` - Entry point script

**Commands**:
1. `get <key>` - Retrieve credentials (with optional masking)
2. `set <key> <path> <value>` - Set a credential value using dot notation
3. `edit <key>` - Bulk edit from JSON file
4. `delete <key>` - Delete credentials (requires `--force` flag)
5. `list` - List all credential keys
6. `show <key>` - Display credentials (with optional masking)
7. `validate <key>` - Validate against schema
8. `open <name>` (alias: `editor`) - Edit in external editor (Rails-style) with scope support

**Configuration**:
- Reads from `.libertasrc` or `.libertasrc.json`
- Supports environment variables: `LIBERTAS_ENV`, `LIBERTAS_STORAGE_PATH`, `LIBERTAS_MASTER_KEY`
- Precedence: Environment variables > file config > defaults

## Architecture & Design Patterns

### Builder Pattern
The `CredentialsBuilder` class provides a fluent interface for manager configuration:

```typescript
const manager = createCredentialsBuilder()
  .withGeneratedMasterKey()
  .withFileStorage('./credentials')
  .withAESEncryption()
  .withEnvironment('production')
  .build();
```

### Strategy Pattern
Pluggable implementations for:
- **StorageBackend**: InMemoryStorage, FileStorage, or custom
- **EncryptionStrategy**: AESEncryption or custom

### Environment Scopes
Credentials support namespaced keys for multi-environment deployments:

```typescript
// Load production database credentials
const prodCreds = await manager.loadScoped('database', 'production');

// Internally generates key: 'database.production'
```

### Zero-Dependency Core Philosophy
The core package uses only Node.js built-ins:
- `crypto` - Encryption and key derivation
- `fs/promises` - File I/O
- `path` - Path manipulation

This ensures minimal attack surface and maximum compatibility.

## Common Development Commands

### Root Workspace Commands
```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests in all packages
pnpm test

# Run tests with UI
pnpm test:ui

# Run tests with coverage report
pnpm test:coverage

# Lint code
pnpm lint

# Type check without emitting
pnpm type-check

# Format code with Prettier
pnpm format

# Check formatting without changes
pnpm format:check

# Clean all build artifacts
pnpm clean
```

### Package-Specific Commands
```bash
# Run commands in a specific package
pnpm --filter @libertas/core run build
pnpm --filter @libertas/cli run test

# Watch mode during development
pnpm --filter @libertas/core run dev
```

### Turbo-Specific
```bash
# Run specific task across all packages with caching
turbo run build

# Run with verbose output
turbo run test --verbose

# Force rebuild (ignore cache)
turbo run build --force
```

## Testing Strategy

### Test Framework: Vitest
- Configuration: `vitest.config.ts` in each package
- Coverage provider: v8
- Test environment: node
- Globals: enabled (describe, it, expect available without imports)

### Running Tests
```bash
# All tests
pnpm test

# Tests with coverage
pnpm test:coverage

# Watch mode (development)
pnpm test -- --watch

# UI mode
pnpm test:ui

# Specific file
pnpm test -- src/crypto/crypto.test.ts
```

### Test Coverage
- **Core**: 102 tests covering crypto, encryption, storage, manager, builder, utils
- **CLI**: 47 tests covering commands, config loading, editor, formatting
- Target: Maintain >80% coverage on critical paths

## Code Organization & Patterns

### File Structure Guidelines
```
src/
├── types/
│   └── index.ts           # TypeScript interfaces and types
├── errors/
│   └── index.ts           # Custom error classes
├── module-name/
│   ├── index.ts           # Main exports
│   ├── module-name.ts     # Implementation
│   └── module-name.test.ts # Tests
```

### Export Patterns
- Use named exports for functions and classes
- Use default export for utility objects/functions that are primary
- Re-export from index.ts with clear organization

### TypeScript Configuration
- **Target**: ES2020
- **Module**: ESNext
- **Strict mode**: Enabled
- **Declaration**: Enabled (generates .d.ts files)
- **Source maps**: Enabled
- **Path aliases**: `@libertas/*` points to respective packages

## Prettier Configuration

**Print Width**: 120 characters
**Tab Width**: 2 spaces
**Quotes**: Single quotes
**Trailing Commas**: ES5 (objects/arrays only)
**Arrow Parens**: Always
**Other**: Semicolons enabled, bracket spacing enabled

Files ignored:
- `node_modules/`
- `dist/`
- `coverage/`
- `.env*`
- `*.credentials`
- `credentials/`

## Turbo Pipeline Configuration

### Task Dependencies
```
build
  └─ dependsOn: ^build (dependencies must build first)
  └─ outputs: dist/**, build/**
  └─ cache: true

test
  └─ dependsOn: ^build (must build first)
  └─ cache: false
  └─ outputs: coverage/**

lint
  └─ cache: false

dev
  └─ persistent: true
  └─ cache: false
```

### Global Dependencies
Any changes to `tsconfig.json` or `tsconfig.*.json` invalidate all caches.

## Known Issues & Fixes

### pnpm Workspace Configuration
- **Issue**: `pnpm install` warning about `workspaces` field in package.json
- **Fix**: Created `pnpm-workspace.yaml` with pattern `packages/*`

### Turbo Configuration
- **Issue**: `turbo_json_parse_error` - unknown key `tasks`
- **Fix**: Changed schema from `tasks` to `pipeline` (Turbo 1.13+)

### Configuration Precedence
- **Issue**: Environment variables were always taking precedence over file config
- **Fix**: Modified config-loader to only use env vars when explicitly set

### Type Safety
- **Issue**: Update method could introduce undefined values via spread
- **Fix**: Added type assertion `as Credentials` in CredentialsManager

## Master Key Management

### Project-Specific Setup with `libertas init`

Users initialize Libertas per project:

```bash
cd my-project
libertas init
# Prompts for:
# - Project name (stored in .libertasrc)
# - Storage path (where credentials are saved)
# - Environments to set up (development, production, etc.)
# - Master key generation or input
```

### Key Storage & Retrieval

**Master keys are stored in system keychain** (cross-platform via `cross-keychain`):
- **macOS**: Keychain
- **Windows**: Credential Manager
- **Linux**: Secret Service (or encrypted file fallback)

**Key Scoping**: Keys are scoped by project name and environment:
- Default key: `master-key`
- Project-scoped: `{projectName}-{environment}` (e.g., `my-project-production`)
- Global setup: `environment` only (e.g., `production`)

### Key Resolution Priority

When CLI loads, it checks for master key in this order:
1. **Environment variable** `LIBERTAS_MASTER_KEY`
2. **System keychain** (with project+environment scope from .libertasrc)
3. **Config file** `.libertasrc` (if masterKey is explicitly set)
4. **Prompt user** (if none above)

### Setup Examples

**Project-specific setup (default)**:
```bash
libertas init
# Creates .libertasrc with projectName, storagePath, environment
# Saves master-key-development, master-key-staging, master-key-production to keychain
```

**Global/user-wide setup**:
```bash
libertas init --global
# No .libertasrc created
# Saves master-key-development, master-key-staging, master-key-production to keychain
```

### Configuration Files

**`.libertasrc` (created during project init)**:
```json
{
  "projectName": "my-app",
  "storagePath": "./credentials",
  "environment": "development"
}
```

This allows different projects to have:
- Different storage locations
- Separate master keys in keychain
- Project-specific default environments

### Files Involved

- `packages/cli/src/utils/keychain.ts` - Cross-platform keychain access
- `packages/cli/src/commands/init-command.ts` - Setup wizard
- `packages/cli/src/utils/config-loader.ts` - Key resolution logic
- `packages/cli/esbuild.config.mjs` - Handles native keychain bindings

## Key Security Considerations

1. **Encryption**: AES-256-GCM with authenticated encryption
2. **Key Derivation**: PBKDF2 with 100,000 iterations for password-derived keys
3. **Master Key**: 32 bytes (64 hex characters) - validate format strictly
4. **File Storage**: Prevents directory traversal with regex validation
5. **Credential Masking**: Automatic masking of sensitive keys (password, secret, token, api_key, apiKey)
6. **Atomic Operations**: FileStorage uses atomic writes with JSON wrapper containing timestamp

## Editor Integration (Rails-Style)

The `open <name>` command (alias: `editor`) allows editing credentials in your favorite editor:

```bash
# Edit database credentials with environment scope
libertas open database --scope production

# Use specific editor
libertas open database --editor vim

# Don't create if doesn't exist
libertas open database --no-create
```

### YAML Format Support
Credentials are edited in YAML format (human-readable):

```yaml
host: localhost
port: 5432
username: admin
password: secret123
```

The simple YAML parser supports:
- Nested objects
- Arrays
- String, number, boolean, null types
- Inline comments

## Frequently Modified Files

When working on features, these files are commonly edited:

### Core Library
- `packages/core/src/manager/credentials-manager.ts` - Main API
- `packages/core/src/builder/credentials-builder.ts` - Configuration
- `packages/core/src/storage/` - Storage backends
- `packages/core/src/encryption/` - Encryption strategies
- `packages/core/src/utils/index.ts` - Utility functions

### CLI
- `packages/cli/src/program.ts` - Command definitions
- `packages/cli/src/commands/credentials-cli.ts` - Command handlers
- `packages/cli/src/utils/editor.ts` - Editor integration
- `packages/cli/src/utils/config-loader.ts` - Configuration loading

## Development Workflow

### Adding a Feature
1. Create/modify source files in appropriate package
2. Add corresponding test files (*.test.ts)
3. Run `pnpm test` to ensure all tests pass
4. Run `pnpm format` to apply Prettier formatting
5. Run `pnpm type-check` to verify TypeScript
6. Commit changes

### Debugging
1. Use `pnpm test -- --inspect-brk` for debugging with Node inspector
2. Use `console.log()` debugging in tests
3. Check test coverage with `pnpm test:coverage`
4. Review error messages and stack traces carefully

### Documentation
- Update inline code comments for complex logic
- Update README files if changing public APIs
- Keep CLAUDE.md current with architectural changes

## Next Steps for Framework Integration

Future packages are planned but not yet implemented:
- `@libertas/express` - Express.js middleware
- `@libertas/nextjs` - Next.js integration
- `@libertas/nestjs` - NestJS module
- `@libertas/fastify` - Fastify plugin
- `@libertas/hono` - Hono middleware

These should:
- Depend on `@libertas/core`
- Follow similar package structure
- Include integration tests with framework
- Maintain zero-dependency approach in core

## Useful Resources

- **TypeScript Strict Mode**: Enabled - catch errors at compile time
- **Node.js Built-ins**: crypto, fs/promises, path are available
- **Commander.js**: CLI framework used in CLI package
- **Chalk**: Terminal color library used in CLI package
- **Vitest**: Testing framework with API compatible with Jest

## Performance Considerations

1. **Key Derivation**: PBKDF2 with 100,000 iterations is intentionally slow to prevent brute force
2. **FileStorage**: Atomic writes may be slower but ensure data integrity
3. **In-Memory Storage**: Fast but data lost on process restart (development only)
4. **Turbo Caching**: Speeds up builds significantly - leverage cache busting carefully
5. **Test Isolation**: Each test creates new manager instance to prevent state bleeding

---

**Last Updated**: November 29, 2025
**Project Status**: Core functionality complete, CLI fully functional, keychain integration complete
**Test Status**: 149/149 tests passing (100% success rate)
**Key Features**:
  - AES-256-GCM encryption with PBKDF2 key derivation
  - Cross-platform system keychain support (macOS/Windows/Linux)
  - Project-specific configuration with environment scopes
  - Rails-style editor integration with YAML support
  - esbuild bundling for standalone CLI binary
