# Libertas 🛡️

**Minimal, focused credentials management** inspired by Rails credentials. A **100% TypeScript** monorepo with zero-dependency core library and simple CLI tool for encrypting and injecting credentials.

Perfect for Docker deployments, local development, and CI/CD pipelines.

```
🔐 Encrypt  |  💾 Store  |  🔓 Decrypt  |  🚀 Inject
```

## ✨ Features

### 🔒 Security First
- **AES-256-GCM** authenticated encryption (NIST approved, FIPS 140-2 compliant)
- **PBKDF2** key derivation with 100,000 iterations
- **Random IV** per encryption for maximum security
- **Zero external dependencies** in core library (auditable & minimal attack surface)
- **Simple local key storage** at `~/.libertas/keys/` with 600 file permissions
- **Secure deletion** with zero-overwriting before file removal

### 🚀 Container-Ready
- **Runtime injection** - Load credentials at startup
- **Environment variable bootstrapping** - Credentials injected as env vars
- **CI/CD friendly** - Works with GitHub Actions, GitLab CI, Docker, etc.

### 🛠️ Simple CLI (5 Commands)
- **`create`** - Create new credential set (with master key generation)
- **`edit`** - Edit credentials with your favorite editor (vim, nano, nvim, vscode, etc.)
- **`show-key`** - Display master key for a credential set
- **`run`** - Execute command with credentials injected as environment variables
- **`link`** - Link existing credentials with master keys (for cloned repos)

### 🔧 Core Library Features
- **Pure TypeScript** with Node.js built-ins only
- **Builder pattern** for flexible configuration
- **Multiple storage backends** (File, Memory)
- **Comprehensive error handling** with detailed messages
- **TypeScript support** with full type definitions

## Quick Start

### Installation

```bash
# Install CLI globally (recommended)
npm install -g @libertas/cli

# Or install in your project
npm install @libertas/core @libertas/cli
```

### Starting Fresh

#### 1. Create a Credential Set

```bash
libertas create myapp
```

You'll be prompted to choose:
- Generate a new master key (recommended)
- Use an existing master key

The master key is stored locally at `~/.libertas/keys/myapp.key`

#### 2. Edit Credentials

```bash
# Edit in your favorite editor (vim, nano, nvim, vscode, etc.)
libertas edit myapp
```

A JSON file opens for editing:
```json
{
  "database_host": "localhost",
  "database_port": 5432,
  "api_key": "sk-12345",
  "api_secret": "secret-value"
}
```

Save and close the editor. Credentials are encrypted automatically.

#### 3. View the Master Key

```bash
libertas show-key myapp
```

Output:
```
🔐 Master Key for "myapp"
a1b2c3d4e5f6...
```

#### 4. Run Commands with Credentials

```bash
# Execute your app with injected credentials
libertas run myapp -- npm start

# Works with any command
libertas run myapp -- python app.py
libertas run myapp -- ./my-binary --flag
```

Environment variables are automatically injected:
- `DATABASE_HOST=localhost`
- `DATABASE_PORT=5432`
- `API_KEY=sk-12345`
- `API_SECRET=secret-value`

### Cloning an Existing Project

If you clone a project that already has encrypted credentials (`.json` files in `./credentials/`):

```bash
# 1. Install Libertas
npm install -g @libertas/cli

# 2. Link existing credentials with master keys
libertas link

# 3. The command will:
#    - Detect all .json files in ./credentials/
#    - Ask which ones you have master keys for
#    - Let you skip any sets you don't have keys for
#    - Save keys to ~/.libertas/keys/

# 4. Run commands with credentials
libertas run development -- npm start
libertas run production -- npm start
```

**Option: Programmatic Usage (TypeScript)**
```typescript
import { CredentialsManager, FileStorage } from '@libertas/core';

const storage = new FileStorage('./credentials');
const manager = new CredentialsManager({
  masterKey: process.env.LIBERTAS_MASTER_KEY || 'your-key',
  storageBackend: storage
});

// Load credentials
const creds = await manager.load('myapp');
console.log(creds.database_host);
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

Minimal command-line interface for credential management.

**Features:**
- ✅ 5 focused commands
- ✅ Commander.js for CLI parsing
- ✅ Local key storage at `~/.libertas/keys/`
- ✅ Editor integration (vim, nano, nvim, vscode, etc.)
- ✅ Environment variable injection
- ✅ Master key management (generate, import, or link existing)
- ✅ Auto-detection of existing credentials
- ✅ 142 comprehensive unit tests

**What's Included:**
- `create` - Create new credential set with master key
- `edit` - Edit credentials in system editor
- `show-key` - Display master key
- `run` - Execute command with injected credentials
- `link` - Link existing credentials to master keys (for cloned repos)

## Architecture

```
┌─────────────────────────────────┐
│    Your Application             │
│  Node.js | Python | Go | etc.   │
└────────────────┬────────────────┘
                 │
         ┌───────▼────────┐
         │                │
    ┌────▼──────┐    ┌───▼──────┐
    │   CLI     │    │  @core   │
    │  (4 cmds) │    │Package   │
    └────┬──────┘    └────┬─────┘
         │                │
    ┌────▼────────────────▼────────┐
    │  Credentials + Master Keys   │
    │                              │
    │  ~/.libertas/keys/     (local)
    │  $LIBERTAS_MASTER_KEY  (env) │
    │  ./credentials/        (repo)│
    └──────────────────────────────┘
         │
    ┌────▼──────────────────┐
    │ @libertas/core        │
    │ Zero Dependencies     │
    ├───────────────────────┤
    │ • AES-256-GCM Encrypt │
    │ • PBKDF2 Key Derive   │
    │ • File Storage        │
    │ • Crypto Utils        │
    └───────────────────────┘
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

Libertas is designed for Docker deployments with simple runtime injection:

### Runtime Injection

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
CMD ["libertas", "run", "myapp", "--", "npm", "start"]
```

Run with the master key as an environment variable:

```bash
docker run -e LIBERTAS_MASTER_KEY=$MASTER_KEY myapp
```

Or store it in local key storage before running:

```bash
libertas create myapp -k $MASTER_KEY
docker run myapp
```

**For complete Docker examples, see [DOCKER_INTEGRATION.md](./DOCKER_INTEGRATION.md)**

## Master Key Management

Libertas provides two ways to manage master keys:

### Option 1: Environment Variable (Recommended for Docker/CI)

```bash
export LIBERTAS_MASTER_KEY=$(cat ~/.libertas/keys/myapp.key)
libertas run myapp -- npm start
```

### Option 2: Local Storage (Default)

Keys are stored at `~/.libertas/keys/{name}.key` with 600 permissions:

```bash
# Create set and generate key
libertas create myapp

# Key is automatically saved to ~/.libertas/keys/myapp.key
# Retrieve key later
libertas show-key myapp
```

## Examples

### 1. Local Development

```bash
# Create a new credential set
libertas create myapp

# Edit credentials
libertas edit myapp

# Run your app with credentials injected
libertas run myapp -- npm start

# View the master key
libertas show-key myapp
```

### 1b. Linking Existing Project Credentials

When you clone a project, the `./credentials/` directory contains encrypted `.json` files:

```
./credentials/
├── development.json  (encrypted with development master key)
├── staging.json      (encrypted with staging master key)
└── production.json   (encrypted with production master key)
```

Each file contains the encrypted credentials and a timestamp:
```json
{
  "value": "encrypted_string_here",
  "timestamp": "2024-11-30T19:34:59.000Z"
}
```

Link them to your local key storage:

```bash
# Clone a project with existing encrypted credentials
git clone https://github.com/user/myproject.git
cd myproject

# Install Libertas
npm install -g @libertas/cli

# Link existing credentials
libertas link

# Interactive prompt:
# 🔗 Found 3 credential set(s)
#
# Do you have a master key for "development"? (yes/no) [no]: yes
# Enter master key (64 hex characters): a1b2c3d4...
# ✓ Master key for "development" saved
#
# Do you have a master key for "staging"? (yes/no) [no]: no
# ⊘ Skipping "staging"
#
# Do you have a master key for "production"? (yes/no) [no]: yes
# Enter master key (64 hex characters): f6e5d4c3...
# ✓ Master key for "production" saved
#
# 📋 Summary
# ✓ Linked: development, production
# ⊘ Skipped: staging

# Now you can use the credentials
libertas run development -- npm start
```

### 2. Programmatic Usage (TypeScript)

```typescript
import { CredentialsManager, FileStorage } from '@libertas/core';

// Initialize manager
const storage = new FileStorage('./credentials');
const manager = new CredentialsManager({
  masterKey: process.env.LIBERTAS_MASTER_KEY!,
  storageBackend: storage
});

// Save credentials
await manager.save('database', {
  host: 'db.example.com',
  port: 5432,
  username: 'app_user',
  password: 'super_secret'
});

// Load credentials
const dbConfig = await manager.load('database');
console.log(`Connecting to ${dbConfig.host}:${dbConfig.port}`);
```

### 3. Docker Deployment

```bash
# Step 1: Create credentials on your machine
libertas create myapp

# Step 2: Commit encrypted credentials to git
git add credentials/myapp.json

# Step 3: Get the master key
MASTER_KEY=$(libertas show-key myapp)

# Step 4: Run Docker with master key
docker run -e LIBERTAS_MASTER_KEY=$MASTER_KEY myapp
```

### 4. CI/CD Pipeline (GitHub Actions)

```yaml
name: Deploy
on: [push]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Install Libertas
        run: npm install -g @libertas/cli

      - name: Run app with credentials
        env:
          LIBERTAS_MASTER_KEY: ${{ secrets.LIBERTAS_MASTER_KEY }}
        run: libertas run myapp -- npm start
```

### 5. Using Different Credential Sets

```bash
# Create different sets for different environments
libertas create development
libertas create staging
libertas create production

# Edit each with different values
libertas edit development
libertas edit staging
libertas edit production

# Run with appropriate set
libertas run development -- npm run dev
libertas run production -- npm start
```

### 6. Importing Existing Master Key

```bash
# Use an existing key when creating
libertas create myapp -k $(cat /path/to/master.key)

# Or use via environment variable
export EXISTING_MASTER_KEY="a1b2c3d4..."
libertas create myapp -k $EXISTING_MASTER_KEY
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
- ✅ Local key storage at `~/.libertas/keys/`
- ✅ Minimal 5-command CLI (create, edit, show-key, run, link)
- ✅ Auto-detection of existing credentials
- ✅ Docker runtime injection support
- ✅ Comprehensive test suite (270+ tests)
- ✅ Complete security policy documentation

### Phase 2: Enhancement 🔄 (In Progress)
- 🔄 Framework integrations (Express, Next.js, NestJS)
- 🔄 Kubernetes integration examples
- 🔄 Improved CLI error messages and help
- 🔄 Environment variable flattening customization

### Phase 3: Advanced 📋 (Future)
- 📋 Remote credential storage (S3, GCS, Vault)
- 📋 Multi-team support with access control
- 📋 Automatic credential rotation
- 📋 Credential sharing workflows
- 📋 Audit logging capabilities

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

**Starting Fresh:**
```bash
# Install globally
npm install -g @libertas/cli

# Create a credential set
libertas create myapp

# Edit credentials (opens your editor)
libertas edit myapp

# Run your app with credentials injected
libertas run myapp -- npm start
```

**Cloning an Existing Project:**
```bash
# Install Libertas
npm install -g @libertas/cli

# Link existing credentials
libertas link

# Follow the prompts to add your master keys
# Run your app
libertas run myapp -- npm start
```

That's it! Your app now has encrypted credentials. 🎉
