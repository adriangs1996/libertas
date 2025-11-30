# Security Policy

## Supported Versions

| Version | Supported          | Security Updates |
|---------|-------------------|------------------|
| 0.1.x   | ✅ Yes            | All issues       |
| < 0.1.0 | ❌ No             | N/A              |

## Reporting a Vulnerability

**Do not open a public issue** for security vulnerabilities.

Please report security issues confidentially to: **[your-email@example.com]** with the subject line starting with `[SECURITY]`.

Include the following:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

You should receive a response within 48 hours.

## Security Best Practices

### Master Key Management

1. **Never commit master keys** to version control
2. **Use environment variables** for Docker/CI deployments
3. **Store in system keychain** for development
4. **Rotate keys regularly** (recommended: every 90 days)
5. **Use unique keys per environment** (dev, staging, production)

### Credential Storage

1. **Always use secure file permissions** (600 - owner read/write only)
2. **Add `.env` files to `.gitignore`**
3. **Don't store plaintext credentials** - use Libertas encryption
4. **Verify file permissions** with `libertas verify-dump`
5. **Clean up temporary files** with `libertas cleanup-dump`

### Docker Deployments

1. **Use runtime injection** whenever possible (safer than build-time)
   ```bash
   CMD ["libertas", "run", "--", "npm", "start"]
   ```

2. **Never bake master keys into images**
   ```bash
   # ❌ DON'T DO THIS
   RUN echo "LIBERTAS_MASTER_KEY=secret" > .env
   ```

3. **Pass master key at runtime** via environment variable
   ```bash
   docker run -e LIBERTAS_MASTER_KEY=$MASTER_KEY myapp
   ```

4. **Use Kubernetes secrets** for production
   ```yaml
   - name: LIBERTAS_MASTER_KEY
     valueFrom:
       secretKeyRef:
         name: libertas-secrets
         key: master-key
   ```

### Encryption Details

The core library uses **industry-standard encryption**:

- **Algorithm**: AES-256-GCM (NIST approved, FIPS 140-2 compliant)
- **Mode**: Galois/Counter Mode (authenticated encryption)
- **IV**: 96-bit random per encryption
- **Auth Tag**: 128-bit
- **Key Derivation**: PBKDF2-SHA256 with 100,000 iterations

This matches the security level of:
- Rails Credentials (same algorithm)
- Django Fernet (same algorithm)
- Node.js crypto module defaults

### Secure File Operations

1. **Atomic writes**: Write to temporary file, then rename
2. **Permissions**: Files created with `0o600` (chmod 600)
3. **Secure deletion**: Overwrite with zeros before unlinking
4. **Path validation**: No directory traversal allowed

## Known Limitations

### Current Version (0.1.0)

- No audit logging (coming in v0.2)
- No key rotation built-in (requires re-encryption)
- No automatic backups (use version control for .enc files)
- No encryption key versioning (one key per environment)

### Mitigations

1. **Audit logging**: Store operation logs in your CI/CD system
2. **Key rotation**: Run `libertas init --global` for new key, then re-encrypt
3. **Backups**: Git version control handles credential file backups
4. **Key versioning**: Use unique scopes/keys per environment

## Threat Model

### What Libertas Protects Against

✅ **Accidental exposure** of credentials in version control
✅ **Plaintext storage** of environment variables
✅ **Unencrypted files** on disk
✅ **Insecure file permissions** (via automatic chmod 600)
✅ **Environment variable leakage** in logs/output

### What Libertas Does NOT Protect Against

❌ **Compromised system keychain** (owner-level compromise)
❌ **Stealing the master key** (keep secure!)
❌ **Brute force attacks** (use strong master key)
❌ **Process memory inspection** (after decryption)
❌ **Insider threats** (with access to master key)

## Audit & Transparency

### Security Measures

- ✅ Zero external dependencies in core library (less attack surface)
- ✅ All code in open-source repository for review
- ✅ Comprehensive test coverage (270+ tests)
- ✅ Using Node.js built-in crypto module (well-audited)
- ✅ No custom crypto implementations

### No Telemetry

- ✅ Libertas collects NO usage data
- ✅ Libertas sends NO information to remote servers
- ✅ All operations are local-first
- ✅ Open source - verify the code yourself

## Compliance

- ✅ OWASP Top 10 secure coding practices
- ✅ NIST recommendations for encryption
- ✅ FIPS 140-2 approved algorithms (AES)
- ✅ No hardcoded secrets in the codebase
- ✅ Secure defaults (chmod 600, encrypted storage)

## Security Updates

We commit to:

1. **Prompt patching** of security vulnerabilities (within 24 hours for critical)
2. **Security advisories** for all CVEs in GitHub Security tab
3. **Backporting** critical fixes to previous stable versions
4. **Clear communication** about security implications
5. **Testing** all security patches before release

## Questions?

If you have questions about security, open a discussion in GitHub Discussions or contact the maintainers.

---

Last Updated: 2025-11-30
