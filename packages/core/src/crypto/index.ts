/**
 * Cryptographic utilities module
 */

import crypto from 'node:crypto';
import { KeyDerivationError, EncryptionError } from '../errors';
import type { KeyDerivationOptions } from '../types';

export class CryptoUtils {
  /**
   * Derive a key from a password using PBKDF2
   */
  static deriveKey(password: string, options: KeyDerivationOptions = {}): Buffer {
    const salt = options.salt || crypto.randomBytes(32);
    const iterations = options.iterations || 100_000;
    const keyLength = options.keyLength || 32;
    const digest = options.digest || 'sha256';

    try {
      const derivedKey = crypto.pbkdf2Sync(password, salt, iterations, keyLength, digest);
      return Buffer.concat([salt, derivedKey]);
    } catch (error) {
      throw new KeyDerivationError(`Failed to derive key: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Extract salt from derived key
   */
  static extractSalt(derivedKey: Buffer): Buffer {
    return derivedKey.subarray(0, 32);
  }

  /**
   * Extract actual key from derived key
   */
  static extractKey(derivedKey: Buffer): Buffer {
    return derivedKey.subarray(32);
  }

  /**
   * Generate a random master key
   */
  static generateMasterKey(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Hash data using SHA256
   */
  static hash(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Generate random bytes
   */
  static randomBytes(size: number = 32): Buffer {
    return crypto.randomBytes(size);
  }

  /**
   * Constant-time comparison for sensitive data
   */
  static constantTimeCompare(a: string | Buffer, b: string | Buffer): boolean {
    if (typeof a === 'string') a = Buffer.from(a);
    if (typeof b === 'string') b = Buffer.from(b);

    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  }
}

export default CryptoUtils;
