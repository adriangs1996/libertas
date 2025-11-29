import { describe, it, expect } from 'vitest';
import { objectToYAML, yamlToObject } from './editor';

describe('Editor Utilities', () => {
  describe('objectToYAML', () => {
    it('should convert simple object to YAML', () => {
      const obj = { username: 'admin', port: 5432 };
      const yaml = objectToYAML(obj);
      expect(yaml).toContain('username');
      expect(yaml).toContain('admin');
      expect(yaml).toContain('port');
      expect(yaml).toContain('5432');
    });

    it('should handle nested objects', () => {
      const obj = {
        database: {
          host: 'localhost',
          port: 5432,
        },
      };
      const yaml = objectToYAML(obj);
      expect(yaml).toContain('database');
      expect(yaml).toContain('host');
      expect(yaml).toContain('localhost');
    });

    it('should handle arrays', () => {
      const obj = {
        servers: ['server1', 'server2', 'server3'],
      };
      const yaml = objectToYAML(obj);
      expect(yaml).toContain('servers');
      expect(yaml).toContain('server1');
    });

    it('should handle different value types', () => {
      const obj = {
        string: 'value',
        number: 42,
        float: 3.14,
        boolean: true,
        null_value: null,
      };
      const yaml = objectToYAML(obj);
      expect(yaml).toContain('string');
      expect(yaml).toContain('value');
      expect(yaml).toContain('number');
      expect(yaml).toContain('42');
    });

    it('should quote strings with special characters', () => {
      const obj = {
        password: 'pass:word',
        multiline: 'line1\nline2',
      };
      const yaml = objectToYAML(obj);
      expect(yaml).toContain('password');
      expect(yaml).toContain('"');
    });
  });

  describe('yamlToObject', () => {
    it('should parse simple YAML to object', () => {
      const yaml = `username: admin
port: 5432`;
      const obj = yamlToObject(yaml);
      expect(obj.username).toBe('admin');
      expect(obj.port).toBe(5432);
    });

    it('should parse nested YAML', () => {
      const yaml = `database:
  host: localhost
  port: 5432`;
      const obj = yamlToObject(yaml);
      expect(obj.database.host).toBe('localhost');
      expect(obj.database.port).toBe(5432);
    });

    it('should handle quoted strings', () => {
      const yaml = `password: "secret:password"`;
      const obj = yamlToObject(yaml);
      expect(obj.password).toBe('secret:password');
    });

    it('should ignore comments', () => {
      const yaml = `username: admin # this is a comment
port: 5432 # another comment`;
      const obj = yamlToObject(yaml);
      expect(obj.username).toBe('admin');
      expect(obj.port).toBe(5432);
    });

    it('should parse boolean values', () => {
      const yaml = `enabled: true
disabled: false`;
      const obj = yamlToObject(yaml);
      expect(obj.enabled).toBe(true);
      expect(obj.disabled).toBe(false);
    });

    it('should parse null values', () => {
      const yaml = `value: null`;
      const obj = yamlToObject(yaml);
      expect(obj.value).toBeNull();
    });

    it('should skip empty lines', () => {
      const yaml = `username: admin

port: 5432`;
      const obj = yamlToObject(yaml);
      expect(obj.username).toBe('admin');
      expect(obj.port).toBe(5432);
    });
  });

  describe('round-trip conversion', () => {
    it('should preserve data through YAML conversion', () => {
      const original = {
        username: 'admin',
        database: {
          host: 'localhost',
          port: 5432,
          ssl: true,
        },
        ports: [8080, 8081, 8082],
      };

      const yaml = objectToYAML(original);
      const restored = yamlToObject(yaml);

      expect(restored.username).toBe(original.username);
      expect(restored.database.host).toBe(original.database.host);
      expect(restored.database.port).toBe(original.database.port);
      expect(restored.database.ssl).toBe(original.database.ssl);
    });

    it('should handle empty object', () => {
      const original = {};
      const yaml = objectToYAML(original);
      const restored = yamlToObject(yaml);
      expect(Object.keys(restored).length).toBe(0);
    });
  });
});
