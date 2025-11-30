# Libertas Docker Integration Guide

This guide shows how to use Libertas to manage credentials in Docker containers. Libertas supports both **runtime injection** and **build-time injection** patterns.

## Quick Start

### Option 1: Runtime Injection (Recommended for Docker)

Store encrypted credentials in your repository and inject them at runtime.

**Dockerfile:**
```dockerfile
FROM node:20-alpine

WORKDIR /app

# Install Libertas CLI
RUN npm install -g @libertas/cli

# Copy app files
COPY . .

# Install dependencies
RUN npm install

# Use libertas run to inject credentials and start app
CMD ["libertas", "run", "--", "npm", "start"]
```

**Usage:**
```bash
# Build image
docker build -t myapp .

# Run with credentials injected from environment
docker run -e LIBERTAS_MASTER_KEY=$MASTER_KEY myapp

# Or with specific environment
docker run -e LIBERTAS_MASTER_KEY=$MASTER_KEY -e NODE_ENV=production myapp
```

### Option 2: Build-Time Injection

Generate `.env` file during build and bake it into the image.

**Dockerfile:**
```dockerfile
FROM node:20-alpine

WORKDIR /app

# Install Libertas CLI
RUN npm install -g @libertas/cli

# Copy app and credentials files
COPY . .

# Generate .env file during build
RUN LIBERTAS_MASTER_KEY=$MASTER_KEY libertas dump production > .env

# Install dependencies
RUN npm install

# Start app (no need for libertas run)
CMD ["npm", "start"]
```

**Usage:**
```bash
# Build image (pass master key as build arg)
docker build --build-arg MASTER_KEY=$MASTER_KEY -t myapp .

# Run (credentials already in image)
docker run myapp
```

## Project Structure

Store encrypted credentials in your Git repository:

```
my-app/
├── .libertasrc              # Config file
├── credentials/
│   ├── development.enc      # Encrypted dev credentials
│   ├── staging.enc          # Encrypted staging credentials
│   └── production.enc       # Encrypted prod credentials
├── src/
├── package.json
└── Dockerfile
```

## Configuration File (.libertasrc)

```json
{
  "projectName": "my-app",
  "environment": "development",
  "storagePath": "./credentials"
}
```

## Examples by Language/Framework

### Node.js / Express

**Dockerfile:**
```dockerfile
FROM node:20-alpine
WORKDIR /app

RUN npm install -g @libertas/cli

COPY . .
RUN npm install

CMD ["libertas", "run", "--", "node", "server.js"]
```

**Usage:**
```bash
docker run -e LIBERTAS_MASTER_KEY=$MASTER_KEY myapp
```

### Python / Flask

**Dockerfile:**
```dockerfile
FROM python:3.11-alpine
WORKDIR /app

RUN pip install @libertas/cli  # Would need Python package

COPY . .
RUN pip install -r requirements.txt

CMD ["libertas", "run", "--", "python", "app.py"]
```

### Ruby / Rails

**Dockerfile:**
```dockerfile
FROM ruby:3.2-alpine
WORKDIR /app

RUN gem install libertas-cli

COPY . .
RUN bundle install

CMD ["libertas", "run", "--", "rails", "server"]
```

### Go

**Dockerfile:**
```dockerfile
FROM golang:1.21-alpine
WORKDIR /app

RUN go install github.com/libertas/cli@latest

COPY . .
RUN go mod download

CMD ["libertas", "run", "--", "./bin/app"]
```

## Environment Variable Detection

Libertas automatically detects the environment from:

1. `LIBERTAS_ENV` - Explicit override
2. `NODE_ENV` - For Node.js apps
3. `RAILS_ENV` - For Rails apps
4. `ENVIRONMENT` - Generic fallback
5. `ENV` - Generic fallback
6. Defaults to `development`

**Examples:**
```bash
# Explicitly set scope
docker run -e LIBERTAS_MASTER_KEY=$MASTER_KEY -e LIBERTAS_ENV=production myapp

# Auto-detect from NODE_ENV
docker run -e LIBERTAS_MASTER_KEY=$MASTER_KEY -e NODE_ENV=staging myapp

# Use default (development)
docker run -e LIBERTAS_MASTER_KEY=$MASTER_KEY myapp
```

## GitHub Actions Integration

Store master key in GitHub Secrets and use it in CI/CD.

### Push to Registry

```yaml
name: Build and Push

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Build Docker image
        run: |
          docker build \
            --build-arg MASTER_KEY=${{ secrets.LIBERTAS_MASTER_KEY }} \
            -t myapp:${{ github.sha }} \
            .

      - name: Push to registry
        run: |
          docker tag myapp:${{ github.sha }} myapp:latest
          docker push myapp:latest
```

### Run Tests with Credentials

```yaml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Run tests with credentials
        env:
          LIBERTAS_MASTER_KEY: ${{ secrets.LIBERTAS_MASTER_KEY }}
        run: |
          docker run \
            -e LIBERTAS_MASTER_KEY=$LIBERTAS_MASTER_KEY \
            -e NODE_ENV=test \
            myapp \
            npm test
```

## Docker Compose Example

**docker-compose.yml:**
```yaml
version: '3.8'

services:
  app:
    build: .
    environment:
      - LIBERTAS_MASTER_KEY=${LIBERTAS_MASTER_KEY}
      - NODE_ENV=development
      - DATABASE_URL=postgresql://db:5432/myapp
    ports:
      - "3000:3000"
    depends_on:
      - db
    volumes:
      - .:/app
      - /app/node_modules

  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=myapp
      - POSTGRES_PASSWORD=dev-password
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

**Usage:**
```bash
export LIBERTAS_MASTER_KEY=$(cat ~/.libertas/master_key)
docker-compose up
```

## Kubernetes Example

**deployment.yaml:**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
spec:
  replicas: 3
  selector:
    matchLabels:
      app: myapp
  template:
    metadata:
      labels:
        app: myapp
    spec:
      containers:
      - name: app
        image: myapp:latest
        env:
        - name: LIBERTAS_MASTER_KEY
          valueFrom:
            secretKeyRef:
              name: libertas-secrets
              key: master-key
        - name: NODE_ENV
          value: "production"
        ports:
        - containerPort: 3000
```

**Setup:**
```bash
# Create secret
kubectl create secret generic libertas-secrets \
  --from-literal=master-key=$LIBERTAS_MASTER_KEY

# Deploy
kubectl apply -f deployment.yaml
```

## Best Practices

### 1. Commit Encrypted Files to Git

```bash
# Encrypted credentials are safe to commit
git add credentials/*.enc
git commit -m "Add production credentials"
git push
```

### 2. Never Commit Unencrypted .env

```bash
# Add to .gitignore
echo ".env" >> .gitignore
echo ".env.*" >> .gitignore
```

### 3. Rotate Master Key Regularly

```bash
# Generate new master key
libertas init --global

# Re-encrypt credentials with new key
# (This will be automated in future versions)
```

### 4. Use GitHub Secrets for Master Key

Never hardcode master keys:

```bash
# GitHub Actions: Use secrets context
- run: |
    docker run \
      -e LIBERTAS_MASTER_KEY=${{ secrets.LIBERTAS_MASTER_KEY }} \
      myapp
```

### 5. Environment-Specific Master Keys

For extra security, use different master keys per environment:

```bash
# Store separate secrets
LIBERTAS_MASTER_KEY_DEV
LIBERTAS_MASTER_KEY_STAGING
LIBERTAS_MASTER_KEY_PROD
```

## Troubleshooting

### "Master key not found"

```bash
# Make sure LIBERTAS_MASTER_KEY is set
docker run -e LIBERTAS_MASTER_KEY=$MASTER_KEY myapp

# Or set in docker-compose.yml/.env
export LIBERTAS_MASTER_KEY=<your-key>
docker-compose up
```

### "Credentials not found for scope"

```bash
# Check scope (defaults to NODE_ENV if set)
docker run \
  -e LIBERTAS_MASTER_KEY=$MASTER_KEY \
  -e NODE_ENV=production \
  myapp

# Or explicitly set
docker run \
  -e LIBERTAS_MASTER_KEY=$MASTER_KEY \
  -e LIBERTAS_ENV=production \
  myapp
```

### "Permission denied" on credentials file

```bash
# Ensure credentials files are readable
chmod 644 credentials/*.enc

# Commit to git
git add credentials/
git commit -m "Add credentials files"
```

## Runtime vs Build-Time Injection

| Aspect | Runtime | Build-Time |
|--------|---------|-----------|
| **Security** | ✓ Master key not in image | ✗ Master key in build process |
| **Flexibility** | ✓ Easy env switching | ✗ Image per environment |
| **Size** | ✓ Smaller images | ✗ Larger images |
| **Speed** | ✗ Decrypt at startup | ✓ No decryption needed |
| **Recommended** | ✓ For Docker | ✗ Only for testing |

**Recommendation**: Use **runtime injection** with `libertas run` for production. Build-time injection is only suitable for testing/staging where the image isn't pushed to a registry.
