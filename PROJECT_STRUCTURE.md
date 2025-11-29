# Libertas Project Structure

Complete documentation of the libertas monorepo structure and packages.

## Overview

Libertas is a secure credentials management system inspired by Rails credentials. It's organized as a monorepo with multiple npm packages:

1. **@libertas/core** - Core functionality with zero dependencies
2. **@libertas/cli** - Command-line interface for managing credentials

Additional integration packages are planned for:
- Express
- Next.js
- NestJS
- Fastify
- Hono

## Directory Structure

```
libertas/
├── package.json                    # Root workspace config
├── turbo.json                      # Turbo build orchestration
├── tsconfig.json                   # Base TypeScript config
├── .prettierrc.json                # Code formatting
├── .gitignore
├── PROJECT_STRUCTURE.md            # This file
│
├── packages/
│   │
│   ├── core/                       # Core package - zero dependencies
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── vitest.config.ts
│   │   ├── .eslintrc.json
│   │   ├── README.md
│   │   ├── API.md
│   │   ├── EXAMPLES.md
│   │   │
│   │   └── src/
│   │       ├── index.ts            # Main exports
│   │       ├── types/
│   │       │   └── index.ts        # TypeScript interfaces
│   │       ├── errors/
│   │       │   └── index.ts        # Custom error classes
│   │       ├── crypto/
│   │       │   ├── index.ts        # Cryptographic utilities
│   │       │   └── crypto.test.ts
│   │       ├── encryption/
│   │       │   ├── index.ts        # AES-256-GCM encryption
│   │       │   └── encryption.test.ts
│   │       ├── storage/
│   │       │   ├── index.ts        # InMemoryStorage
│   │       │   ├── file-storage.ts # FileStorage with fs
│   │       │   ├── storage.test.ts
│   │       │   └── file-storage.test.ts
│   │       ├── utils/
│   │       │   ├── index.ts        # Utility functions
│   │       │   └── utils.test.ts
│   │       ├── manager/
│   │       │   ├── credentials-manager.ts
│   │       │   └── credentials-manager.test.ts
│   │       └── builder/
│   │           ├── credentials-builder.ts
│   │           └── credentials-builder.test.ts
│   │
│   └── cli/                        # CLI package
│       ├── package.json
│       ├── tsconfig.json
│       ├── vitest.config.ts
│       ├── .eslintrc.json
│       ├── README.md
│       ├── API.md
│       │
│       └── src/
│           ├── index.ts            # Main exports
│           ├── types/
│           │   └── index.ts        # CLI type definitions
│           ├── program.ts          # Commander program setup
│           ├── commands/
│           │   ├── credentials-cli.ts
│           │   └── credentials-cli.test.ts
│           ├── utils/
│           │   ├── config-loader.ts
│           │   ├── config-loader.test.ts
│           │   ├── formatter.ts
│           │   └── formatter.test.ts
│           └── bin/
│               └── cli.ts          # CLI entry point
```

## Packages

### @libertas/core

**Purpose**: Core credentials management functionality with zero external dependencies.

**Key Features**:
- Encryption/decryption (AES-256-GCM)
- Multiple storage backends (in-memory, file-based)
- Cryptographic utilities (key derivation, hashing)
- Builder pattern for configuration
- Comprehensive error handling
- Utility functions (masking, validation, flattening)

**Main Exports**:
- `CredentialsManager` - Main class
- `CryptoUtils` - Cryptographic operations
- `InMemoryStorage`, `FileStorage` - Storage backends
- `AESEncryption` - Encryption strategy
- `CredentialsBuilder` - Fluent configuration
- Utility functions
- Error classes

**Testing**:
- Vitest with 50+ test cases
- Unit tests for all modules
- Security tests (path traversal, tampered data)
- Integration tests

**Documentation**:
- API.md - Complete API reference
- EXAMPLES.md - Real-world usage patterns
- README.md - Quick start guide

### @libertas/cli

**Purpose**: Command-line interface for managing credentials using Commander.

**Key Features**:
- Commander-based CLI program
- 7 main commands (get, set, edit, delete, list, show, validate)
- Configuration file support (.libertasrc)
- Environment variable support
- Formatted output with chalk
- Schema validation
- Credential masking

**Main Exports**:
- `CredentialsCLI` - Command handler
- `createProgram` - Commander program factory
- `loadConfig`, `saveConfig` - Configuration utilities
- `Formatter` - Output formatting

**Commands**:
- `libertas get <key>` - Retrieve credentials
- `libertas set <key> <path> <value>` - Set credential value
- `libertas edit <key>` - Edit from JSON file
- `libertas delete <key>` - Delete credentials
- `libertas list` - List all credential keys
- `libertas show <key>` - Display credentials
- `libertas validate <key>` - Validate against schema

**Testing**:
- Vitest with comprehensive test coverage
- Command execution tests
- Configuration loader tests
- Formatter tests

**Documentation**:
- README.md - Quick start and usage guide
- API.md - Complete API reference
- Command examples in README

## Development Workflow

### Install Dependencies

```bash
npm install
```

### Build All Packages

```bash
npm run build
```

### Build Specific Package

```bash
cd packages/core
npm run build
```

### Run Tests

```bash
# All packages
npm run test

# Specific package
cd packages/cli
npm run test
```

### Watch Mode

```bash
# Core package
cd packages/core
npm run dev

# CLI package
cd packages/cli
npm run dev
```

### Type Checking

```bash
npm run type-check
```

### Linting

```bash
npm run lint
```

### Code Formatting

```bash
npm run format
```

## Workspace Configuration

The project uses:
- **Turbo**: Build orchestration and caching
- **Workspaces**: NPM 7+ workspace management
- **TypeScript 5.3**: Strict mode, ESNext target
- **Vitest**: Testing framework
- **ESLint**: Code linting
- **Prettier**: Code formatting

### Turbo Tasks

Defined in `turbo.json`:
- `build`: Compile TypeScript (depends on ^build)
- `dev`: Watch mode
- `test`: Run tests
- `lint`: Linting
- `type-check`: Type checking
- `clean`: Remove build artifacts

## Integration Packages (Future)

### @libertas/express

Express middleware for credentials injection.

```typescript
import { libertas } from '@libertas/express';

app.use(libertas({ storagePath: './credentials' }));

app.get('/api/data', (req, res) => {
  const credentials = req.libertas.get('database');
  // Use credentials
});
```

### @libertas/nextjs

Next.js plugin for server-side credentials.

```typescript
import { withLibertas } from '@libertas/nextjs';

export default withLibertas(config);
```

### @libertas/nestjs

NestJS module for dependency injection.

```typescript
import { LibertasModule } from '@libertas/nestjs';

@Module({
  imports: [LibertasModule.register({ storagePath: './credentials' })],
})
export class AppModule {}
```

### @libertas/fastify

Fastify plugin for credentials management.

```typescript
import fastify from 'fastify';
import { libertasPlugin } from '@libertas/fastify';

const app = fastify();
await app.register(libertasPlugin);
```

### @libertas/hono

Hono middleware for edge runtime.

```typescript
import { Hono } from 'hono';
import { libertas } from '@libertas/hono';

const app = new Hono();
app.use(libertas());
```

## Dependencies

### Root Package
- `typescript`: 5.3.0
- `turbo`: 1.10.0
- `prettier`: 3.1.0
- `@types/node`: 20.10.0

### @libertas/core
**Zero production dependencies**

Dev:
- `typescript`, `vitest`, `eslint`, `@typescript-eslint/*`

### @libertas/cli

Production:
- `@libertas/core`: workspace:*
- `commander`: 11.1.0
- `chalk`: 5.3.0

Dev:
- `typescript`, `vitest`, `eslint`, `@typescript-eslint/*`

## Version Management

All packages follow semantic versioning (1.0.0):
- **Major**: Breaking API changes
- **Minor**: New features, backward compatible
- **Patch**: Bug fixes

## Publishing

### Build Release

```bash
npm run build
```

### Publish Packages

```bash
# From root
npm publish --workspaces
```

## Security

### Encryption
- AES-256-GCM for authenticated encryption
- Random IV per encryption operation
- PBKDF2 for password-to-key derivation

### Storage
- Directory traversal prevention
- Key sanitization
- Path validation
- Secure file permissions

### Error Handling
- Custom error hierarchy
- Detailed error messages
- Error codes for programmatic handling

## Testing Strategy

### Unit Tests
- Individual function testing
- Error cases
- Edge cases

### Integration Tests
- End-to-end workflows
- Multiple storage backends
- Configuration loading

### Security Tests
- Encryption/decryption
- Key derivation
- Path traversal attempts
- Data tamper detection

## Best Practices

1. **Keep Core Lightweight**: Zero dependencies for core package
2. **Clear Module Separation**: Storage, encryption, crypto separate
3. **Type Safety**: Strict TypeScript with comprehensive types
4. **Error Handling**: Custom errors for different scenarios
5. **Testing**: High test coverage for reliability
6. **Documentation**: API docs, examples, usage guides
7. **Builder Pattern**: Fluent API for configuration
8. **Security First**: Encryption by default, validation always

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes with tests
4. Update documentation
5. Submit pull request

## License

MIT
