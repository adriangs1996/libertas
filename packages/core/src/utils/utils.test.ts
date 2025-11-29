import { describe, it, expect } from 'vitest';
import {
  deepMerge,
  getNestedValue,
  setNestedValue,
  flattenObject,
  unflattenObject,
  hasRequiredKeys,
  maskCredentials,
  validateAgainstSchema,
} from './index';

describe('Utility Functions', () => {
  describe('deepMerge', () => {
    it('should merge two objects', () => {
      const target = { a: 1, b: { c: 2 } };
      const source = { b: { d: 3 }, e: 4 };
      const result = deepMerge(target, source);
      expect(result).toEqual({ a: 1, b: { c: 2, d: 3 }, e: 4 });
    });

    it('should override target values', () => {
      const target = { a: 1 };
      const source = { a: 2 };
      const result = deepMerge(target, source);
      expect(result.a).toBe(2);
    });
  });

  describe('getNestedValue', () => {
    it('should get nested value using dot notation', () => {
      const obj = { a: { b: { c: 'value' } } };
      const result = getNestedValue(obj, 'a.b.c');
      expect(result).toBe('value');
    });

    it('should return undefined for missing paths', () => {
      const obj = { a: { b: 'value' } };
      const result = getNestedValue(obj, 'a.b.c');
      expect(result).toBeUndefined();
    });
  });

  describe('setNestedValue', () => {
    it('should set nested value using dot notation', () => {
      const obj = { a: { b: { c: 'old' } } };
      setNestedValue(obj, 'a.b.c', 'new');
      expect(obj.a.b.c).toBe('new');
    });

    it('should create missing paths', () => {
      const obj = {} as any;
      setNestedValue(obj, 'a.b.c', 'value');
      expect(obj.a.b.c).toBe('value');
    });
  });

  describe('flattenObject', () => {
    it('should flatten nested object', () => {
      const obj = { a: { b: { c: 'value' } }, d: 'other' };
      const result = flattenObject(obj);
      expect(result).toEqual({ 'a.b.c': 'value', d: 'other' });
    });

    it('should handle arrays as values', () => {
      const obj = { a: [1, 2, 3], b: 'value' };
      const result = flattenObject(obj);
      expect(result).toEqual({ a: [1, 2, 3], b: 'value' });
    });
  });

  describe('unflattenObject', () => {
    it('should unflatten object from dot notation', () => {
      const obj = { 'a.b.c': 'value', d: 'other' };
      const result = unflattenObject(obj);
      expect(result).toEqual({ a: { b: { c: 'value' } }, d: 'other' });
    });
  });

  describe('hasRequiredKeys', () => {
    it('should return true when all required keys exist', () => {
      const creds = { username: 'admin', password: 'secret' };
      const result = hasRequiredKeys(creds, ['username', 'password']);
      expect(result).toBe(true);
    });

    it('should return false when required keys are missing', () => {
      const creds = { username: 'admin' };
      const result = hasRequiredKeys(creds, ['username', 'password']);
      expect(result).toBe(false);
    });
  });

  describe('maskCredentials', () => {
    it('should mask sensitive values', () => {
      const creds = {
        username: 'admin',
        password: 'secret',
        api_key: 'key123',
      };
      const result = maskCredentials(creds);
      expect(result.username).toBe('admin');
      expect(result.password).toBe('***MASKED***');
      expect(result.api_key).toBe('***MASKED***');
    });

    it('should use custom sensitive keys', () => {
      const creds = { username: 'admin', custom_secret: 'value' };
      const result = maskCredentials(creds, ['custom_secret']);
      expect(result.username).toBe('admin');
      expect(result.custom_secret).toBe('***MASKED***');
    });

    it('should be case insensitive', () => {
      const creds = { username: 'admin', PASSWORD: 'secret' };
      const result = maskCredentials(creds);
      expect(result.PASSWORD).toBe('***MASKED***');
    });
  });

  describe('validateAgainstSchema', () => {
    it('should validate credentials against schema', () => {
      const creds = { username: 'admin', password: 'secret' };
      const schema = {
        username: { required: true, type: 'string' as const },
        password: { required: true, type: 'string' as const },
      };
      const result = validateAgainstSchema(creds, schema);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should report missing required fields', () => {
      const creds = { username: 'admin' };
      const schema = {
        username: { required: true, type: 'string' as const },
        password: { required: true, type: 'string' as const },
      };
      const result = validateAgainstSchema(creds, schema);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing required field: password');
    });

    it('should report type mismatches', () => {
      const creds = { port: 'not-a-number' };
      const schema = {
        port: { required: true, type: 'number' as const },
      };
      const result = validateAgainstSchema(creds, schema);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should validate against regex patterns', () => {
      const creds = { email: 'invalid-email' };
      const schema = {
        email: { pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
      };
      const result = validateAgainstSchema(creds, schema);
      expect(result.valid).toBe(false);
    });
  });
});
