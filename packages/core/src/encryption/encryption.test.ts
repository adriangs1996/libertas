import { describe, it, expect } from 'vitest';
import { AESEncryption } from './index';
import { CryptoUtils } from '../crypto';

describe('AESEncryption', () => {
  let encryption: AESEncryption;
  let key: string;

  beforeEach(() => {
    encryption = new AESEncryption();
    // Generate a valid 32-byte hex key
    key = CryptoUtils.generateMasterKey();
  });

  describe('encrypt and decrypt', () => {
    it('should encrypt and decrypt data', async () => {
      const data = 'secret data';
      const encrypted = await encryption.encrypt(data, key);
      const decrypted = await encryption.decrypt(encrypted, key);
      expect(decrypted).toBe(data);
    });

    it('should produce different ciphertexts for the same plaintext', async () => {
      const data = 'secret data';
      const encrypted1 = await encryption.encrypt(data, key);
      const encrypted2 = await encryption.encrypt(data, key);
      expect(encrypted1).not.toBe(encrypted2);
    });

    it('should handle JSON data', async () => {
      const data = JSON.stringify({ username: 'admin', password: 'secret' });
      const encrypted = await encryption.encrypt(data, key);
      const decrypted = await encryption.decrypt(encrypted, key);
      expect(JSON.parse(decrypted)).toEqual({ username: 'admin', password: 'secret' });
    });

    it('should handle empty strings', async () => {
      const data = '';
      const encrypted = await encryption.encrypt(data, key);
      const decrypted = await encryption.decrypt(encrypted, key);
      expect(decrypted).toBe(data);
    });

    it('should handle large data', async () => {
      const data = 'x'.repeat(10000);
      const encrypted = await encryption.encrypt(data, key);
      const decrypted = await encryption.decrypt(encrypted, key);
      expect(decrypted).toBe(data);
    });
  });

  describe('error handling', () => {
    it('should throw on invalid key length', async () => {
      const data = 'test';
      const invalidKey = 'short-key';
      await expect(encryption.encrypt(data, invalidKey)).rejects.toThrow();
    });

    it('should throw on invalid ciphertext', async () => {
      const invalidCiphertext = 'not-valid-hex';
      await expect(encryption.decrypt(invalidCiphertext, key)).rejects.toThrow();
    });

    it('should throw on authentication tag mismatch', async () => {
      const data = 'secret';
      const encrypted = await encryption.encrypt(data, key);
      const tampered = encrypted.slice(0, -4) + 'ffff';
      await expect(encryption.decrypt(tampered, key)).rejects.toThrow();
    });

    it('should throw on wrong key during decryption', async () => {
      const data = 'secret';
      const encrypted = await encryption.encrypt(data, key);
      const wrongKey = CryptoUtils.generateMasterKey();
      await expect(encryption.decrypt(encrypted, wrongKey)).rejects.toThrow();
    });
  });
});
