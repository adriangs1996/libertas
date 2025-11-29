/**
 * Encryption strategies module
 */

import crypto from 'node:crypto';
import { EncryptionError } from '../errors';
import type { EncryptionStrategy } from '../types';

/**
 * AES-256-GCM encryption strategy
 */
export class AESEncryption implements EncryptionStrategy {
  private readonly algorithm = 'aes-256-gcm';
  private readonly keyLength = 32;
  private readonly ivLength = 16;
  private readonly authTagLength = 16;

  async encrypt(data: string, key: string): Promise<string> {
    try {
      const keyBuffer = Buffer.from(key, 'hex');

      if (keyBuffer.length !== this.keyLength) {
        throw new EncryptionError(`Key must be ${this.keyLength} bytes`);
      }

      const iv = crypto.randomBytes(this.ivLength);
      const cipher = crypto.createCipheriv(this.algorithm, keyBuffer, iv);

      let encrypted = cipher.update(data, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      const authTag = cipher.getAuthTag();

      const result = Buffer.concat([iv, authTag, Buffer.from(encrypted, 'hex')]);
      return result.toString('hex');
    } catch (error) {
      if (error instanceof EncryptionError) throw error;
      throw new EncryptionError(`Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async decrypt(encryptedData: string, key: string): Promise<string> {
    try {
      const keyBuffer = Buffer.from(key, 'hex');

      if (keyBuffer.length !== this.keyLength) {
        throw new EncryptionError(`Key must be ${this.keyLength} bytes`);
      }

      const buffer = Buffer.from(encryptedData, 'hex');

      const iv = buffer.subarray(0, this.ivLength);
      const authTag = buffer.subarray(this.ivLength, this.ivLength + this.authTagLength);
      const encrypted = buffer.subarray(this.ivLength + this.authTagLength);

      const decipher = crypto.createDecipheriv(this.algorithm, keyBuffer, iv);
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(encrypted);
      decrypted = Buffer.concat([decrypted, decipher.final()]);

      return decrypted.toString('utf8');
    } catch (error) {
      if (error instanceof EncryptionError) throw error;
      throw new EncryptionError(`Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export default AESEncryption;
