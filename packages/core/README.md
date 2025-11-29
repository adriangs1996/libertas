# @libertas/core

Core credentials management library with zero external dependencies.

## Features

- Encryption/decryption of credentials
- Credential storage and retrieval
- Master key management
- Support for multiple credential formats

## Installation

```bash
npm install @libertas/core
```

## Usage

```typescript
import { CredentialsManager } from '@libertas/core';

const manager = new CredentialsManager();
```

## API

### Crypto Module
- Encryption utilities
- Key derivation
- Hashing functions

### Storage Module
- In-memory storage
- File-based storage
- Custom storage backends

### Encryption Module
- AES encryption
- Key management
- Encryption strategies
