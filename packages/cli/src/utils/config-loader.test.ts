import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs/promises';
import path from 'node:path';
import { loadConfig, saveConfig } from './config-loader';

describe('Config Loader', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = path.join(process.cwd(), `.test-config-${Date.now()}`);
    await fs.mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('loadConfig', () => {
    it('should load default config from environment', async () => {
      const config = await loadConfig(testDir);
      expect(config).toBeDefined();
      expect(config.environment).toBeDefined();
    });

    it('should load config from .libertasrc file', async () => {
      const testConfig = { defaultEnvironment: 'production', storagePath: './creds' };
      const configPath = path.join(testDir, '.libertasrc');
      await fs.writeFile(configPath, JSON.stringify(testConfig));

      const originalEnv = process.env.LIBERTAS_ENV;
      delete process.env.LIBERTAS_ENV;

      try {
        const config = await loadConfig(testDir);
        expect(config.environment).toBe('production');
        expect(config.storagePath).toBe('./creds');
      } finally {
        process.env.LIBERTAS_ENV = originalEnv;
      }
    });

    it('should load config from .libertasrc.json file', async () => {
      const testConfig = { defaultEnvironment: 'staging' };
      const configPath = path.join(testDir, '.libertasrc.json');
      await fs.writeFile(configPath, JSON.stringify(testConfig));

      const originalEnv = process.env.LIBERTAS_ENV;
      delete process.env.LIBERTAS_ENV;

      try {
        const config = await loadConfig(testDir);
        expect(config.environment).toBe('staging');
      } finally {
        process.env.LIBERTAS_ENV = originalEnv;
      }
    });

    it('should prefer environment variables over file config', async () => {
      const testConfig = { defaultEnvironment: 'from-file' };
      const configPath = path.join(testDir, '.libertasrc');
      await fs.writeFile(configPath, JSON.stringify(testConfig));

      const originalEnv = process.env.LIBERTAS_ENV;
      process.env.LIBERTAS_ENV = 'from-env';

      try {
        const config = await loadConfig(testDir);
        expect(config.environment).toBe('from-env');
      } finally {
        process.env.LIBERTAS_ENV = originalEnv;
      }
    });
  });

  describe('saveConfig', () => {
    it('should save config to .libertasrc file', async () => {
      const config = { defaultEnvironment: 'test', storagePath: './test-storage' };
      await saveConfig(config, testDir);

      const configPath = path.join(testDir, '.libertasrc');
      const content = await fs.readFile(configPath, 'utf-8');
      const saved = JSON.parse(content);

      expect(saved.defaultEnvironment).toBe('test');
      expect(saved.storagePath).toBe('./test-storage');
    });

    it('should overwrite existing config', async () => {
      const config1 = { defaultEnvironment: 'dev' };
      const config2 = { defaultEnvironment: 'prod', storagePath: './prod-storage' };

      await saveConfig(config1, testDir);
      await saveConfig(config2, testDir);

      const configPath = path.join(testDir, '.libertasrc');
      const content = await fs.readFile(configPath, 'utf-8');
      const saved = JSON.parse(content);

      expect(saved.defaultEnvironment).toBe('prod');
      expect(saved.storagePath).toBe('./prod-storage');
    });
  });
});
