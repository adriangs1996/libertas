import { describe, it, expect } from 'vitest';
import { Formatter } from './formatter';

describe('Formatter', () => {
  describe('success', () => {
    it('should format success message', () => {
      const result = Formatter.success('Operation completed');
      expect(result).toContain('Operation completed');
    });
  });

  describe('error', () => {
    it('should format error message', () => {
      const result = Formatter.error('Something went wrong');
      expect(result).toContain('Something went wrong');
    });
  });

  describe('warning', () => {
    it('should format warning message', () => {
      const result = Formatter.warning('Be careful');
      expect(result).toContain('Be careful');
    });
  });

  describe('info', () => {
    it('should format info message', () => {
      const result = Formatter.info('Information');
      expect(result).toContain('Information');
    });
  });

  describe('header', () => {
    it('should format header text', () => {
      const result = Formatter.header('Main Section');
      expect(result).toContain('Main Section');
    });
  });

  describe('keyValue', () => {
    it('should format key-value pair', () => {
      const result = Formatter.keyValue('username', 'admin');
      expect(result).toContain('username');
      expect(result).toContain('admin');
    });
  });

  describe('json', () => {
    it('should format JSON data', () => {
      const data = { key: 'value', number: 42 };
      const result = Formatter.json(data);
      expect(result).toContain('key');
      expect(result).toContain('value');
    });

    it('should use custom indentation', () => {
      const data = { a: 1 };
      const result = Formatter.json(data, 4);
      expect(result).toBeDefined();
    });
  });

  describe('list', () => {
    it('should format list items', () => {
      const items = ['item1', 'item2', 'item3'];
      const result = Formatter.list(items);
      expect(result).toContain('item1');
      expect(result).toContain('item2');
      expect(result).toContain('item3');
    });
  });
});
