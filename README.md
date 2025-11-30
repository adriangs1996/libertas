# Libertas 🛡️

Secure credentials management system inspired by Rails credentials. A **100% TypeScript** monorepo with zero-dependency core library and comprehensive CLI tool for managing environment-specific credentials.

Perfect for Docker deployments, Kubernetes, and local development with seamless integration across all platforms.

```
🔐 Encrypt  |  💾 Store  |  🔓 Decrypt  |  🚀 Inject  |  📦 Export
```

## ✨ Features

### 🔒 Security First
- **AES-256-GCM** authenticated encryption (NIST approved, FIPS 140-2 compliant)
- **PBKDF2** key derivation with 100,000 iterations
- **Random IV** per encryption for maximum security
- **Zero external dependencies** in core library (auditable & minimal attack surface)
- **Cross-platform keychain** integration (macOS Keychain, Windows Credential Manager, Linux Secret Service)
- **Secure file permissions** with automatic chmod 600
- **Secure deletion** with zero-overwriting before file removal

### 🚀 Docker-Ready
- **Runtime injection** - Load credentials at startup
- **Build-time injection** - Bake credentials into images
- **Auto environment detection** - NODE_ENV, RAILS_ENV, LIBERTAS_ENV support
- **CI/CD friendly** - Works with GitHub Actions, GitLab CI, etc.

### 🛠️ Developer-Friendly CLI
- **13 powerful commands** for complete credential lifecycle
- **Project-specific configuration** via `.libertasrc`
- **Rails-style editor integration** for intuitive editing
- **JSON schema validation** for credentials
- **Credential masking** for safe logging/display
- **Formatted output** with colors and tables

### 🔧 Core Library Features
- **Pure TypeScript** with Node.js built-ins only
- **Builder pattern** for flexible configuration
- **Multiple storage backends** (File, Memory)
- **Comprehensive error handling** with detailed messages
- **TypeScript support** with full type definitions

### 📦 CLI Commands (13 total)
- `init` - Initialize project and set up credentials
- `dump` - Export credentials to secure .env file
- `verify-dump` - Verify .env integrity and permissions
- `cleanup-dump` - Securely delete .env file
- `run` - Execute commands with injected credentials
- `get` - Retrieve specific credentials
- `set` - Set individual credential values
- `edit` - Edit complete credential sets
- `delete` - Delete credentials
- `list` - List all credential keys
- `show` - Display credentials
- `validate` - Validate credentials against schema
- `open` (alias: `editor`) - Edit credentials in system editor

## Quick Start

### Installation

```bash
# Install CLI globally (recommended)
npm install -g @libertas/cli

# Or install in your project
npm install @libertas/core @libertas/cli
```

### 1. Initialize Your Project

```bash
libertas init
```

This creates `.libertasrc` and stores your master key securely in your system keychain.

### 2. Set Your Credentials

```bash
# Set individual values
libertas set myapp database.host localhost
libertas set myapp database.port 5432
libertas set myapp database.user admin
libertas set myapp database.password secret

# Or edit in your favorite editor (Rails-style)
libertas open myapp

# Or load from JSON file
libertas edit myapp --file config.json
```

### 3. Use Credentials in Your App

**Option A: Runtime Injection (Docker-friendly)**
```bash
# Execute your app with injected credentials
libertas run -- npm start

# Or with specific environment
libertas run production -- npm start

# Works with any command
libertas run -- python app.py
libertas run -- ./my-binary
```

**Option B: Export to .env**
```bash
# Dump credentials to secure .env file
libertas dump production > .env

# Verify .env security
libertas verify-dump

# Clean up when done
libertas cleanup-dump
```

**Option C: Programmatically (TypeScript)**
```typescript
import { CredentialsManager, FileStorage } from '@libertas/core';

const storage = new FileStorage('./credentials');
const manager = new CredentialsManager({
  masterKey: process.env.LIBERTAS_MASTER_KEY || 'your-key',
  storageBackend: storage,
  environment: 'production'
});

// Load credentials
const creds = await manager.load('myapp');
console.log(creds.database.host);
```

### Common CLI Commands

```bash
# List all credential sets
libertas list

# Show credentials (with optional masking)
libertas show myapp
libertas show myapp --mask

# Get specific credential
libertas get myapp

# Update a single value
libertas set myapp api_key sk-12345

# Validate credentials against schema
libertas validate myapp --file schema.json

# Delete credentials
libertas delete staging --force

# Edit in system editor
libertas open myapp --editor vim
```

## Packages

### [@libertas/core](./packages/core)

Core credentials management library with **zero external dependencies**.

**Features:**
- ✅ AES-256-GCM authenticated encryption (NIST approved)
- ✅ PBKDF2 key derivation (100,000 iterations)
- ✅ Multiple storage backends (File, Memory)
- ✅ Credential builder with fluent API
- ✅ Comprehensive error handling
- ✅ TypeScript types included
- ✅ 128 comprehensive unit tests

**What's Included:**
- `CredentialsManager` - Main class for encryption/decryption
- `FileStorage` - Persist credentials to encrypted files
- `MemoryStorage` - In-memory credential storage
- `CryptoUtils` - Encryption utilities
- `CredentialsBuilder` - Fluent configuration API

### [@libertas/cli](./packages/cli)

Command-line interface for complete credential lifecycle management.

**Features:**
- ✅ 13 full-featured commands
- ✅ Commander.js for CLI parsing
- ✅ System keychain integration (cross-platform)
- ✅ Project-specific configuration (.libertasrc)
- ✅ Environment-aware credential management
- ✅ Secure file operations (chmod 600, .gitignore)
- ✅ Docker runtime injection support
- ✅ 142 comprehensive unit tests

**What's Included:**
- `init` - Interactive setup wizard
- `dump/verify-dump/cleanup-dump` - .env file management
- `run` - Execute with injected credentials
- `get/set/edit/delete/list/show` - Credential CRUD
- `validate` - Schema validation
- `open` - Editor integration

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

## Docker Integration

Libertas is designed for Docker deployments with two patterns:

### Runtime Injection (Recommended)

Store encrypted credentials in your repo, inject them at runtime:

```dockerfile
FROM node:20-alpine
WORKDIR /app

# Install Libertas
RUN npm install -g @libertas/cli

# Copy app and encrypted credentials
COPY . .
RUN npm install

# Use libertas run to inject credentials
CMD ["libertas", "run", "--", "npm", "start"]
```

```bash
# Run with credentials
docker run -e LIBERTAS_MASTER_KEY=$MASTER_KEY myapp
```

### Build-Time Injection

Generate `.env` during build:

```dockerfile
FROM node:20-alpine
WORKDIR /app

RUN npm install -g @libertas/cli
COPY . .

# Generate .env file during build
RUN LIBERTAS_MASTER_KEY=$MASTER_KEY libertas dump production > .env
RUN npm install

CMD ["npm", "start"]
```

**For complete Docker examples, see [DOCKER_INTEGRATION.md](./DOCKER_INTEGRATION.md)**

## Configuration

### Configuration File (.libertasrc)

Create in your project root:

```json
{
  "projectName": "my-app",
  "environment": "development",
  "storagePath": "./credentials"
}
```

### Environment Variables

- `LIBERTAS_ENV` - Override environment (production, staging, etc.)
- `LIBERTAS_MASTER_KEY` - Master key for encryption/decryption
- `NODE_ENV`, `RAILS_ENV` - Auto-detected for environment scoping

## Examples

### 1. Programmatic Usage (TypeScript)

```typescript
import { CredentialsManager, FileStorage } from '@libertas/core';

// Initialize manager
const storage = new FileStorage('./credentials');
const manager = new CredentialsManager({
  masterKey: process.env.LIBERTAS_MASTER_KEY!,
  storageBackend: storage,
  environment: 'production'
});

// Save credentials
await manager.save('database', {
  host: 'db.example.com',
  port: 5432,
  username: 'app_user',
  password: 'super_secret',
  database: 'app_db'
});

// Load credentials
const dbConfig = await manager.load('database');
console.log(`Connecting to ${dbConfig.host}:${dbConfig.port}`);
```

### 2. CLI: Setup and Configuration

```bash
# Initialize project (sets up .libertasrc and master key in keychain)
libertas init

# Set individual credentials
libertas set myapp db.host localhost
libertas set myapp db.port 5432
libertas set myapp db.user admin
libertas set myapp db.password secret123

# Load from JSON file
libertas edit myapp --file credentials.json

# List all credentials
libertas list
```

### 3. CLI: Export to .env

```bash
# Dump credentials to secure .env file
libertas dump production > .env

# Verify .env file is secure (permissions 600, valid content)
libertas verify-dump

# Clean up .env file when done (secure overwrite + delete)
libertas cleanup-dump
```

### 4. Docker: Runtime Injection

```bash
# Run application with injected credentials
libertas run -- npm start

# Run with specific environment
libertas run production -- npm start

# Run any command (works with Python, Go, etc.)
libertas run -- python app.py
libertas run staging -- ./my-binary --flag

# In Docker
docker run -e LIBERTAS_MASTER_KEY=$MASTER_KEY myapp
# Container will execute: libertas run -- npm start
# Credentials automatically injected as environment variables
```

### 5. CLI: Validation

```bash
# Create schema.json
cat > schema.json << 'EOF'
{
  "host": { "required": true, "type": "string" },
  "port": { "required": true, "type": "number" },
  "username": { "required": true, "type": "string" },
  "password": { "required": true, "type": "string" }
}
EOF

# Validate credentials
libertas validate myapp --file schema.json

# Show masked credentials (safe for logs)
libertas show myapp --mask
```

### 6. CLI: Edit in System Editor

```bash
# Open in your default editor (Rails-style)
libertas open myapp

# Open in specific editor
libertas open myapp --editor vim
libertas open myapp --editor nano

# Create new if doesn't exist
libertas open staging  # Creates if missing

# Skip creation if doesn't exist
libertas open staging --no-create
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

## Test Coverage

Libertas has comprehensive test coverage:

- **Core Library**: 128 tests
- **CLI Package**: 142 tests
- **Total**: 270+ tests, all passing ✅

```bash
pnpm test          # Run all tests
pnpm test:coverage # Generate coverage report
```

## Roadmap

### Phase 1: Foundation ✅ (Complete)
- ✅ Core library with AES-256-GCM encryption
- ✅ Zero-dependency architecture
- ✅ System keychain integration (macOS, Windows, Linux)
- ✅ Project-specific credential management
- ✅ 13 CLI commands with full features
- ✅ Docker runtime & build-time injection
- ✅ Comprehensive test suite (270+ tests)
- ✅ Complete security policy documentation

### Phase 2: Enhancement 🔄 (In Progress)
- 🔄 Framework integrations (Express, Next.js, NestJS)
- 🔄 Interactive CLI prompts for setup
- 🔄 Improved credential rotation workflows
- 🔄 Audit logging capabilities
- 🔄 Kubernetes integration examples

### Phase 3: Advanced 📋 (Future)
- 📋 Web UI for credential management
- 📋 Remote credential storage (S3, GCS, Vault)
- 📋 Multi-team support with access control
- 📋 Automatic credential rotation
- 📋 Version history and rollback
- 📋 Slack/Teams integration

## Contributing

We welcome contributions! Please see our contribution guidelines.

### Getting Started

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Update documentation
6. Submit a pull request

## Getting Help

- 📖 [Security Policy](./SECURITY.md) - Report vulnerabilities responsibly
- 📦 [Publishing Guide](./READY_TO_PUBLISH.md) - Publish your own packages
- 🐳 [Docker Guide](./DOCKER_INTEGRATION.md) - Docker deployment patterns
- 💬 [Issues](https://github.com/adriangs1996/libertas/issues) - Report bugs
- 💭 [Discussions](https://github.com/adriangs1996/libertas/discussions) - Ask questions

## License

MIT - See [LICENSE](./LICENSE) file for details

## Built With

- **[Node.js](https://nodejs.org/)** - JavaScript runtime
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe JavaScript
- **[Turbo](https://turbo.build/)** - Monorepo build orchestration
- **[Commander.js](https://github.com/tj/commander.js)** - CLI argument parsing
- **[Chalk](https://github.com/chalk/chalk)** - Terminal colors
- **[cross-keychain](https://github.com/magarcia/cross-keychain)** - Cross-platform keychain access

## Inspired By

- [Rails Credentials](https://guides.rubyonrails.org/credentials.html) - Rails secrets management
- [Doppler](https://www.doppler.com/) - Secrets management platform
- [EnvKey](https://www.envkey.com/) - Environment variable management

## Contributing

We welcome contributions! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes with clear messages
4. Push to the branch
5. Open a Pull Request

All tests must pass (`pnpm test`) and code must follow the TypeScript strict mode requirements.

---

## Quick Links

- **Repository**: https://github.com/adriangs1996/libertas
- **Issues**: https://github.com/adriangs1996/libertas/issues
- **Discussions**: https://github.com/adriangs1996/libertas/discussions
- **npm - Core**: https://www.npmjs.com/package/@libertas/core
- **npm - CLI**: https://www.npmjs.com/package/@libertas/cli

## Get Started in 30 Seconds

```bash
# Install globally
npm install -g @libertas/cli

# Initialize your project
libertas init

# Set a credential
libertas set myapp database.host localhost

# Use in your app
libertas run -- npm start
```

That's it! Your app now has encrypted credentials. 🎉
