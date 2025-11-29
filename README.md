# Libertas

Secure credentials management system inspired by Rails credentials. A TypeScript-first monorepo with zero-dependency core and multiple framework integrations.

```
🔐 Encrypt | 💾 Store | 🔓 Decrypt
```

## Features

✨ **Zero-Dependency Core**
- Pure TypeScript with Node.js built-ins only
- AES-256-GCM encryption
- PBKDF2 key derivation
- Multiple storage backends

🛠️ **Developer-Friendly CLI**
- Commander-based command interface
- JSON configuration support
- Schema validation
- Credential masking

🔧 **Framework Integrations** (Coming Soon)
- Express middleware
- Next.js plugin
- NestJS module
- Fastify plugin
- Hono middleware

## Quick Start

### Installation

```bash
# Install core library
npm install @libertas/core

# Install CLI globally
npm install -g @libertas/cli
```

### Basic Usage

```typescript
import { createCredentialsBuilder } from '@libertas/core';

// Initialize manager
const manager = createCredentialsBuilder()
  .withGeneratedMasterKey()
  .withFileStorage('./credentials')
  .build();

// Save credentials
await manager.save('database', {
  host: 'localhost',
  port: 5432,
  username: 'admin',
  password: 'secret'
});

// Load credentials
const dbConfig = await manager.load('database');
console.log(dbConfig.host); // 'localhost'
```

### CLI Usage

```bash
# List all credentials
libertas list

# Get credentials
libertas get database --mask

# Set a value
libertas set database password new-secret

# Validate against schema
libertas validate database --file schema.json
```

## Packages

### [@libertas/core](./packages/core)

Core credentials management library with zero external dependencies.

- ✅ AES-256-GCM encryption
- ✅ Multiple storage backends
- ✅ Cryptographic utilities
- ✅ Builder pattern configuration
- ✅ Comprehensive error handling
- ✅ Utility functions
- ✅ ~50 test cases

[Full API Documentation](./packages/core/API.md) | [Examples](./packages/core/EXAMPLES.md)

### [@libertas/cli](./packages/cli)

Command-line interface for credentials management.

- ✅ Commander-based CLI
- ✅ 7 main commands
- ✅ Configuration file support
- ✅ Environment variables
- ✅ Formatted output
- ✅ Schema validation

[CLI Documentation](./packages/cli/README.md) | [API Reference](./packages/cli/API.md)

## Architecture

```
┌─────────────────────────────────────┐
│      Framework Integrations         │
│  Express | Next.js | NestJS | etc.  │
└────────────────┬────────────────────┘
                 │
         ┌───────┴────────┐
         │                │
    ┌────▼────┐      ┌───▼─────┐
    │   CLI   │      │  Core   │
    │(Commands)      │(Features)
    └────┬────┘      └────┬────┘
         │                │
    ┌────▼────────────────▼────┐
    │  @libertas/core Package   │
    │   Zero Dependencies       │
    ├──────────────────────────┤
    │ • Encryption (AES-256)   │
    │ • Storage (File/Memory)  │
    │ • Crypto Utils           │
    │ • Utilities              │
    └──────────────────────────┘
```

## Workspace Structure

```
libertas (monorepo root)
├── packages/
│   ├── core/          # Core package (1000+ lines)
│   ├── cli/           # CLI package (800+ lines)
│   ├── integrations/
│   │   ├── express/   # (Planned)
│   │   ├── nextjs/    # (Planned)
│   │   ├── nestjs/    # (Planned)
│   │   ├── fastify/   # (Planned)
│   │   └── hono/      # (Planned)
└── docs/
```

## Configuration

### Configuration File

Create `.libertasrc` in your project:

```json
{
  "environment": "development",
  "storagePath": "./credentials"
}
```

### Environment Variables

```bash
LIBERTAS_ENV=production
LIBERTAS_STORAGE_PATH=/var/lib/libertas
LIBERTAS_MASTER_KEY=your-hex-encoded-key
```

## Examples

### Store Database Configuration

```typescript
import { createCredentialsBuilder } from '@libertas/core';

const manager = createCredentialsBuilder()
  .withPasswordDerivedKey('my-secure-password')
  .withFileStorage('./credentials')
  .withEnvironment('production')
  .build();

// Save
await manager.save('database', {
  host: 'db.example.com',
  port: 5432,
  username: 'app_user',
  password: 'secure_password',
  database: 'app_db'
});

// Load
const config = await manager.load('database');
```

### CLI Commands

```bash
# Initialize credentials from JSON file
libertas edit database --file db-config.json

# Update a single value
libertas set api-keys stripe sk-test-123456

# List all credential sets
libertas list

# View with masking (safe for logs)
libertas show database --mask

# Validate configuration
libertas validate database --file schema.json

# Delete credentials
libertas delete staging --force
```

### Validate Credentials Against Schema

```typescript
import { validateAgainstSchema } from '@libertas/core';

const schema = {
  host: { required: true, type: 'string' },
  port: { required: true, type: 'number' },
  username: { required: true, type: 'string' },
  email: { pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ }
};

const result = validateAgainstSchema(credentials, schema);
if (result.valid) {
  console.log('Configuration is valid');
} else {
  console.log('Errors:', result.errors);
}
```

## Security Considerations

🔒 **Encryption**
- AES-256-GCM with authenticated encryption
- Random IV per encryption
- PBKDF2 with 100,000 iterations for key derivation

🛡️ **Storage**
- Directory traversal prevention
- Path validation and sanitization
- Secure file permission recommendations

✔️ **Validation**
- Input validation on all operations
- Schema validation support
- Error handling with detailed messages

## Development

### Install Dependencies

```bash
npm install
```

### Build All Packages

```bash
npm run build
```

### Run Tests

```bash
npm run test
```

### Watch Mode

```bash
npm run dev
```

### Lint & Format

```bash
npm run lint
npm run format
```

## Project Structure

See [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) for detailed documentation of the monorepo layout.

## API Documentation

- **Core Package**: [API.md](./packages/core/API.md)
- **Core Examples**: [EXAMPLES.md](./packages/core/EXAMPLES.md)
- **CLI Package**: [CLI Documentation](./packages/cli/README.md)
- **CLI API**: [API.md](./packages/cli/API.md)

## Performance

### Core Package
- Zero external dependencies
- Minimal bundle size (~15KB minified)
- Fast encryption/decryption (AES-256-GCM)
- Efficient key derivation

### CLI Package
- Fast command execution
- Configurable storage backends
- Streaming for large files (planned)

## Browser/Node Compatibility

- **Node.js**: 14.0+
- **TypeScript**: 5.0+
- **ESM**: Full ES modules support
- **CommonJS**: Via build exports

## Roadmap

### Phase 1 (Current)
- ✅ Core library with zero dependencies
- ✅ CLI tool with commander
- ✅ Comprehensive tests
- ✅ Complete documentation

### Phase 2 (Planned)
- 🔄 Framework integrations (Express, Next.js, NestJS, Fastify, Hono)
- 🔄 Interactive CLI prompts
- 🔄 Web UI for credential management
- 🔄 Remote credential storage (S3, GCS, etc.)

### Phase 3 (Future)
- 📋 Rotation and versioning
- 📋 Audit logging
- 📋 Access control
- 📋 Multi-team support

## Contributing

We welcome contributions! Please see our contribution guidelines.

### Getting Started

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Update documentation
6. Submit a pull request

## Support

- 📖 [Documentation](./packages/core/API.md)
- 💬 [Issues & Discussions](https://github.com/yourusername/libertas/issues)
- 📧 Email: support@libertas.dev

## License

MIT © 2024 Libertas Contributors

## Acknowledgments

- Inspired by [Rails Credentials](https://guides.rubyonrails.org/credentials.html)
- Built with [Node.js](https://nodejs.org/), [TypeScript](https://www.typescriptlang.org/), [Turbo](https://turbo.build/)
- CLI with [Commander](https://github.com/tj/commander.js) and [Chalk](https://github.com/chalk/chalk)

---

**Ready to get started?**

```bash
npm install @libertas/core
npm install -g @libertas/cli
```

Then check out the [quick start guide](./packages/core/README.md)!
