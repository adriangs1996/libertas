/**
 * Tests for environment file generator
 */

import { describe, it, expect } from 'vitest';
import { credentialsToEnv, envToCredentials } from './env-generator';
import type { Credentials } from '../types';

describe('env-generator', () => {
  describe('credentialsToEnv', () => {
    it('should convert simple credentials to .env format', () => {
      const creds: Credentials = {
        DB_HOST: 'localhost',
        DB_PORT: '5432',
        DB_USER: 'admin',
      };

      const env = credentialsToEnv(creds);

      expect(env).toContain('DB_HOST=localhost');
      expect(env).toContain('DB_PORT=5432');
      expect(env).toContain('DB_USER=admin');
    });

    it('should quote values with spaces', () => {
      const creds: Credentials = {
        APP_NAME: 'My Application',
      };

      const env = credentialsToEnv(creds);

      expect(env).toContain('APP_NAME="My Application"');
    });

    it('should escape special characters in quoted values', () => {
      const creds: Credentials = {
        PASSWORD: 'pass"word$123',
      };

      const env = credentialsToEnv(creds);

      expect(env).toContain('PASSWORD="pass\\"word\\$123"');
    });

    it('should handle nested objects with underscore notation', () => {
      const creds: Credentials = {
        database: {
          host: 'localhost',
          port: 5432,
          credentials: {
            user: 'admin',
            password: 'secret',
          },
        },
      };

      const env = credentialsToEnv(creds);

      expect(env).toContain('DATABASE_HOST=localhost');
      expect(env).toContain('DATABASE_PORT=5432');
      expect(env).toContain('DATABASE_CREDENTIALS_USER=admin');
      expect(env).toContain('DATABASE_CREDENTIALS_PASSWORD=secret');
    });

    it('should handle arrays by converting to JSON', () => {
      const creds: Credentials = {
        ALLOWED_HOSTS: ['localhost', '127.0.0.1', 'example.com'],
      };

      const env = credentialsToEnv(creds);

      expect(env).toContain('ALLOWED_HOSTS=["localhost","127.0.0.1","example.com"]');
    });

    it('should handle null and undefined values by skipping them', () => {
      const creds: Credentials = {
        EXISTING: 'value',
        NULL_VALUE: null,
        UNDEFINED_VALUE: undefined,
      };

      const env = credentialsToEnv(creds);

      expect(env).toContain('EXISTING=value');
      expect(env).not.toContain('NULL_VALUE');
      expect(env).not.toContain('UNDEFINED_VALUE');
    });

    it('should convert numbers to strings', () => {
      const creds: Credentials = {
        PORT: 3000,
        TIMEOUT: 5000,
      };

      const env = credentialsToEnv(creds);

      expect(env).toContain('PORT=3000');
      expect(env).toContain('TIMEOUT=5000');
    });

    it('should convert booleans to strings', () => {
      const creds: Credentials = {
        DEBUG: true,
        PRODUCTION: false,
      };

      const env = credentialsToEnv(creds);

      expect(env).toContain('DEBUG=true');
      expect(env).toContain('PRODUCTION=false');
    });

    it('should handle prefix parameter', () => {
      const creds: Credentials = {
        host: 'localhost',
        port: 5432,
      };

      const env = credentialsToEnv(creds, 'DB_');

      expect(env).toContain('DB_HOST=localhost');
      expect(env).toContain('DB_PORT=5432');
    });

    it('should end with newline', () => {
      const creds: Credentials = {
        KEY: 'value',
      };

      const env = credentialsToEnv(creds);

      expect(env.endsWith('\n')).toBe(true);
    });

    it('should handle empty credentials', () => {
      const creds: Credentials = {};

      const env = credentialsToEnv(creds);

      expect(env).toBe('');
    });

    it('should escape backslashes in values', () => {
      const creds: Credentials = {
        PATH: 'C:\\Users\\Admin',
      };

      const env = credentialsToEnv(creds);

      expect(env).toContain('PATH="C:\\\\Users\\\\Admin"');
    });

    it('should escape backticks in values', () => {
      const creds: Credentials = {
        COMMAND: 'echo `test`',
      };

      const env = credentialsToEnv(creds);

      expect(env).toContain('COMMAND="echo \\`test\\`"');
    });

    it('should handle complex nested structure', () => {
      const creds: Credentials = {
        app: {
          name: 'MyApp',
          version: '1.0.0',
          features: {
            auth: {
              enabled: true,
              provider: 'JWT',
            },
          },
        },
      };

      const env = credentialsToEnv(creds);

      expect(env).toContain('APP_NAME=MyApp');
      expect(env).toContain('APP_VERSION=1.0.0');
      expect(env).toContain('APP_FEATURES_AUTH_ENABLED=true');
      expect(env).toContain('APP_FEATURES_AUTH_PROVIDER=JWT');
    });

    it('should not quote simple alphanumeric values', () => {
      const creds: Credentials = {
        SIMPLE: 'value123',
        WITH_UNDERSCORE: 'my_value',
      };

      const env = credentialsToEnv(creds);

      expect(env).toContain('SIMPLE=value123');
      expect(env).toContain('WITH_UNDERSCORE=my_value');
      // Should NOT have quotes around these
      expect(env).not.toContain('"value123"');
      expect(env).not.toContain('"my_value"');
    });
  });

  describe('envToCredentials', () => {
    it('should parse simple .env format', () => {
      const env = 'KEY=value\nDEBUG=true\nPORT=3000\n';

      const creds = envToCredentials(env);

      expect(creds.KEY).toBe('value');
      expect(creds.DEBUG).toBe('true');
      expect(creds.PORT).toBe('3000');
    });

    it('should handle quoted values', () => {
      const env = 'MESSAGE="Hello World"\nPASSWORD="pass\\"word"\n';

      const creds = envToCredentials(env);

      expect(creds.MESSAGE).toBe('Hello World');
      expect(creds.PASSWORD).toBe('pass"word');
    });

    it('should skip empty lines and comments', () => {
      const env = '# This is a comment\nKEY=value\n\n# Another comment\nDEBUG=true\n\n';

      const creds = envToCredentials(env);

      expect(creds.KEY).toBe('value');
      expect(creds.DEBUG).toBe('true');
      expect(Object.keys(creds)).not.toContain('This');
    });

    it('should parse JSON arrays', () => {
      const env = 'HOSTS=["localhost","127.0.0.1"]\n';

      const creds = envToCredentials(env);

      expect(Array.isArray(creds.HOSTS)).toBe(true);
      expect(creds.HOSTS).toEqual(['localhost', '127.0.0.1']);
    });

    it('should handle escaped special characters', () => {
      const env = 'PATH="C:\\\\Users\\\\Admin"\nCOMMAND="echo \\`test\\`"\n';

      const creds = envToCredentials(env);

      expect(creds.PATH).toBe('C:\\Users\\Admin');
      expect(creds.COMMAND).toBe('echo `test`');
    });

    it('should handle lines without equals sign', () => {
      const env = 'VALID=value\nINVALIDLINE\nANOTHER=value\n';

      const creds = envToCredentials(env);

      expect(creds.VALID).toBe('value');
      expect(creds.ANOTHER).toBe('value');
      expect(Object.keys(creds).length).toBe(2);
    });

    it('should handle single quoted values', () => {
      const env = "MESSAGE='Hello World'\n";

      const creds = envToCredentials(env);

      expect(creds.MESSAGE).toBe('Hello World');
    });

    it('should handle unquoted values with equals in quotes', () => {
      const env = 'URL=https://example.com?key=value\n';

      const creds = envToCredentials(env);

      expect(creds.URL).toBe('https://example.com?key=value');
    });
  });

  describe('Round-trip conversion', () => {
    it('should preserve simple credentials through round-trip', () => {
      const original: Credentials = {
        DB_HOST: 'localhost',
        DB_PORT: '5432',
        DB_USER: 'admin',
      };

      const env = credentialsToEnv(original);
      const restored = envToCredentials(env);

      expect(restored.DB_HOST).toBe(original.DB_HOST);
      expect(restored.DB_PORT).toBe(original.DB_PORT);
      expect(restored.DB_USER).toBe(original.DB_USER);
    });

    it('should preserve quoted values through round-trip', () => {
      const original: Credentials = {
        PASSWORD: 'pass"word$123',
        MESSAGE: 'Hello World',
      };

      const env = credentialsToEnv(original);
      const restored = envToCredentials(env);

      expect(restored.PASSWORD).toBe(original.PASSWORD);
      expect(restored.MESSAGE).toBe(original.MESSAGE);
    });

    it('should preserve arrays through round-trip', () => {
      const original: Credentials = {
        HOSTS: ['localhost', '127.0.0.1'],
      };

      const env = credentialsToEnv(original);
      const restored = envToCredentials(env);

      expect(restored.HOSTS).toEqual(original.HOSTS);
    });
  });
});
