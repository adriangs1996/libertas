import { describe, it, expect } from 'vitest';
import { CryptoUtils } from './index';

describe('CryptoUtils', () => {
  describe('generateMasterKey', () => {
    it('should generate a 64-character hex string', () => {
      const key = CryptoUtils.generateMasterKey();
      expect(key).toHaveLength(64);
      expect(/^[a-f0-9]+$/.test(key)).toBe(true);
    });

    it('should generate different keys on each call', () => {
      const key1 = CryptoUtils.generateMasterKey();
      const key2 = CryptoUtils.generateMasterKey();
      expect(key1).not.toBe(key2);
    });
  });

  describe('deriveKey', () => {
    it('should derive a key from a password', () => {
      const password = 'test-password';
      const derived = CryptoUtils.deriveKey(password);
      expect(derived).toBeInstanceOf(Buffer);
      expect(derived.length).toBe(64); // 32 bytes salt + 32 bytes key
    });

    it('should use custom options', () => {
      const password = 'test-password';
      const salt = Buffer.from('0'.repeat(64), 'hex');
      const derived = CryptoUtils.deriveKey(password, { salt, iterations: 50_000 });
      expect(derived).toBeInstanceOf(Buffer);
    });

    it('should derive the same key with the same salt', () => {
      const password = 'test-password';
      const salt = Buffer.from('0'.repeat(64), 'hex');
      const derived1 = CryptoUtils.deriveKey(password, { salt });
      const derived2 = CryptoUtils.deriveKey(password, { salt });
      expect(derived1).toEqual(derived2);
    });
  });

  describe('extractSalt and extractKey', () => {
    it('should extract salt and key from derived key', () => {
      const password = 'test-password';
      const derived = CryptoUtils.deriveKey(password);

      const salt = CryptoUtils.extractSalt(derived);
      const key = CryptoUtils.extractKey(derived);

      expect(salt.length).toBe(32);
      expect(key.length).toBe(32);
    });
  });

  describe('hash', () => {
    it('should hash data consistently', () => {
      const data = 'test-data';
      const hash1 = CryptoUtils.hash(data);
      const hash2 = CryptoUtils.hash(data);
      expect(hash1).toBe(hash2);
    });

    it('should produce different hashes for different data', () => {
      const hash1 = CryptoUtils.hash('data1');
      const hash2 = CryptoUtils.hash('data2');
      expect(hash1).not.toBe(hash2);
    });

    it('should return a valid SHA256 hex string', () => {
      const hash = CryptoUtils.hash('test');
      expect(hash).toHaveLength(64);
      expect(/^[a-f0-9]+$/.test(hash)).toBe(true);
    });
  });

  describe('randomBytes', () => {
    it('should generate random bytes', () => {
      const bytes = CryptoUtils.randomBytes(32);
      expect(bytes).toBeInstanceOf(Buffer);
      expect(bytes.length).toBe(32);
    });

    it('should generate different bytes on each call', () => {
      const bytes1 = CryptoUtils.randomBytes(32);
      const bytes2 = CryptoUtils.randomBytes(32);
      expect(bytes1).not.toEqual(bytes2);
    });
  });

  describe('constantTimeCompare', () => {
    it('should return true for identical strings', () => {
      const result = CryptoUtils.constantTimeCompare('test', 'test');
      expect(result).toBe(true);
    });

    it('should return false for different strings', () => {
      const result = CryptoUtils.constantTimeCompare('test1', 'test2');
      expect(result).toBe(false);
    });

    it('should return false for different lengths', () => {
      const result = CryptoUtils.constantTimeCompare('test', 'testing');
      expect(result).toBe(false);
    });

    it('should work with buffers', () => {
      const buf1 = Buffer.from('test');
      const buf2 = Buffer.from('test');
      const result = CryptoUtils.constantTimeCompare(buf1, buf2);
      expect(result).toBe(true);
    });
  });
});
