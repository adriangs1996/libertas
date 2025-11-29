import { describe, it, expect, beforeEach } from 'vitest';
import { CredentialsCLI } from './credentials-cli';
import { createCredentialsBuilder } from '@libertas/core';

describe('CredentialsCLI', () => {
  let cli: CredentialsCLI;

  beforeEach(async () => {
    const manager = createCredentialsBuilder().withGeneratedMasterKey().withInMemoryStorage().build();

    cli = new CredentialsCLI(manager);
  });

  describe('get command', () => {
    it('should return error when key is missing', async () => {
      const result = await cli.execute('get', {});
      expect(result.success).toBe(false);
      expect(result.error).toContain('Missing required argument: key');
    });

    it('should return error for non-existent credentials', async () => {
      const result = await cli.execute('get', { key: 'non-existent' });
      expect(result.success).toBe(false);
    });

    it('should retrieve existing credentials', async () => {
      const creds = { username: 'admin', password: 'secret' };
      await cli.execute('edit', { key: 'test', credentials: creds });

      const result = await cli.execute('get', { key: 'test' });
      expect(result.success).toBe(true);
      expect(result.data).toEqual(creds);
    });
  });

  describe('set command', () => {
    it('should return error when arguments are missing', async () => {
      const result = await cli.execute('set', { key: 'test' });
      expect(result.success).toBe(false);
    });

    it('should set credential value', async () => {
      await cli.execute('edit', { key: 'test', credentials: { app: 'myapp' } });
      const result = await cli.execute('set', { key: 'test', path: 'version', value: '1.0.0' });

      expect(result.success).toBe(true);
      expect(result.data.version).toBe('1.0.0');
      expect(result.data.app).toBe('myapp');
    });
  });

  describe('edit command', () => {
    it('should return error when key is missing', async () => {
      const result = await cli.execute('edit', { credentials: {} });
      expect(result.success).toBe(false);
    });

    it('should return error for invalid credentials', async () => {
      const result = await cli.execute('edit', { key: 'test', credentials: 'invalid' });
      expect(result.success).toBe(false);
    });

    it('should save credentials', async () => {
      const creds = { db_url: 'postgresql://localhost' };
      const result = await cli.execute('edit', { key: 'database', credentials: creds });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(creds);
    });
  });

  describe('delete command', () => {
    it('should return error when key is missing', async () => {
      const result = await cli.execute('delete', {});
      expect(result.success).toBe(false);
    });

    it('should delete credentials', async () => {
      await cli.execute('edit', { key: 'test', credentials: { app: 'test' } });
      const deleteResult = await cli.execute('delete', { key: 'test' });

      expect(deleteResult.success).toBe(true);
      expect(deleteResult.message).toContain('Deleted');
    });
  });

  describe('list command', () => {
    it('should return empty list initially', async () => {
      const result = await cli.execute('list', {});
      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });

    it('should list all credential keys', async () => {
      await cli.execute('edit', { key: 'app1', credentials: { name: 'app1' } });
      await cli.execute('edit', { key: 'app2', credentials: { name: 'app2' } });

      const result = await cli.execute('list', {});
      expect(result.success).toBe(true);
      expect(result.data).toContain('app1');
      expect(result.data).toContain('app2');
    });
  });

  describe('show command', () => {
    it('should show credentials', async () => {
      const creds = { password: 'secret', username: 'admin' };
      await cli.execute('edit', { key: 'test', credentials: creds });

      const result = await cli.execute('show', { key: 'test' });
      expect(result.success).toBe(true);
      expect(result.data).toEqual(creds);
    });

    it('should mask credentials', async () => {
      const creds = { password: 'secret', username: 'admin' };
      await cli.execute('edit', { key: 'test', credentials: creds });

      const result = await cli.execute('show', { key: 'test', mask: true });
      expect(result.success).toBe(true);
      expect(result.data.password).toBe('***MASKED***');
      expect(result.data.username).toBe('admin');
    });
  });

  describe('validate command', () => {
    it('should return error when key is missing', async () => {
      const result = await cli.execute('validate', { schema: {} });
      expect(result.success).toBe(false);
    });

    it('should validate credentials', async () => {
      const creds = { username: 'admin', port: 5432 };
      await cli.execute('edit', { key: 'test', credentials: creds });

      const schema = {
        username: { required: true, type: 'string' as const },
        port: { type: 'number' as const },
      };

      const result = await cli.execute('validate', { key: 'test', schema });
      expect(result.success).toBe(true);
      expect(result.data.valid).toBe(true);
    });
  });

  describe('fromConfig', () => {
    it('should create CLI from config', async () => {
      const cli = await CredentialsCLI.fromConfig({
        environment: 'test',
      });

      expect(cli).toBeInstanceOf(CredentialsCLI);
    });

    it('should use custom master key', async () => {
      const masterKey = 'a'.repeat(64);
      const cli = await CredentialsCLI.fromConfig({
        masterKey,
      });

      expect(cli).toBeInstanceOf(CredentialsCLI);
    });
  });
});
