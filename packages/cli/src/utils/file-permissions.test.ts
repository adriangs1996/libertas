/**
 * Tests for file permissions utilities
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';
import {
  setSecureFilePermissions,
  getFilePermissions,
  hasSecurePermissions,
  isFileAccessible,
  createSecureFile,
  formatPermissions,
  isFileInsecure,
  FilePermissions,
} from './file-permissions';

describe('file-permissions', () => {
  let testDir: string;
  let testFile: string;

  beforeEach(async () => {
    // Create temporary test directory
    testDir = path.join(tmpdir(), `libertas-perm-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    await fs.mkdir(testDir, { recursive: true });
    testFile = path.join(testDir, 'test.txt');
  });

  afterEach(async () => {
    // Clean up test directory
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('setSecureFilePermissions', () => {
    it('should set file permissions to 600 (owner read/write only)', async () => {
      await fs.writeFile(testFile, 'content');
      await setSecureFilePermissions(testFile);

      const perms = await getFilePermissions(testFile);
      expect(perms).toBe(FilePermissions.SECURE_FILE);
    });

    it('should throw error if file does not exist', async () => {
      const nonExistentFile = path.join(testDir, 'nonexistent.txt');
      await expect(setSecureFilePermissions(nonExistentFile)).rejects.toThrow();
    });

    it('should make file no longer world-readable', async () => {
      await fs.writeFile(testFile, 'content', 'utf-8');
      // Set permissive permissions first
      await fs.chmod(testFile, 0o644);

      const beforePerms = await getFilePermissions(testFile);
      expect(beforePerms).toBe(0o644);

      // Apply secure permissions
      await setSecureFilePermissions(testFile);

      const afterPerms = await getFilePermissions(testFile);
      expect(afterPerms).toBe(FilePermissions.SECURE_FILE);
      expect(afterPerms).not.toBe(beforePerms);
    });
  });

  describe('getFilePermissions', () => {
    it('should return file permissions in octal format', async () => {
      await fs.writeFile(testFile, 'content');
      await fs.chmod(testFile, 0o644);

      const perms = await getFilePermissions(testFile);
      expect(perms).toBe(0o644);
    });

    it('should work with secure permissions', async () => {
      await fs.writeFile(testFile, 'content');
      await fs.chmod(testFile, 0o600);

      const perms = await getFilePermissions(testFile);
      expect(perms).toBe(0o600);
    });

    it('should throw error if file does not exist', async () => {
      const nonExistentFile = path.join(testDir, 'nonexistent.txt');
      await expect(getFilePermissions(nonExistentFile)).rejects.toThrow();
    });
  });

  describe('hasSecurePermissions', () => {
    it('should return true for files with 600 permissions', async () => {
      await fs.writeFile(testFile, 'content');
      await fs.chmod(testFile, 0o600);

      const isSecure = await hasSecurePermissions(testFile);
      expect(isSecure).toBe(true);
    });

    it('should return false for files with 644 permissions', async () => {
      await fs.writeFile(testFile, 'content');
      await fs.chmod(testFile, 0o644);

      const isSecure = await hasSecurePermissions(testFile);
      expect(isSecure).toBe(false);
    });

    it('should return false if file does not exist', async () => {
      const nonExistentFile = path.join(testDir, 'nonexistent.txt');
      const isSecure = await hasSecurePermissions(nonExistentFile);
      expect(isSecure).toBe(false);
    });
  });

  describe('isFileAccessible', () => {
    it('should return true for readable/writable files', async () => {
      await fs.writeFile(testFile, 'content');
      await fs.chmod(testFile, 0o644);

      const accessible = await isFileAccessible(testFile);
      expect(accessible).toBe(true);
    });

    it('should return true for 600 permission files (owner)', async () => {
      await fs.writeFile(testFile, 'content');
      await fs.chmod(testFile, 0o600);

      const accessible = await isFileAccessible(testFile);
      expect(accessible).toBe(true);
    });

    it('should return false if file does not exist', async () => {
      const nonExistentFile = path.join(testDir, 'nonexistent.txt');
      const accessible = await isFileAccessible(nonExistentFile);
      expect(accessible).toBe(false);
    });
  });

  describe('createSecureFile', () => {
    it('should create file with secure permissions', async () => {
      const newFile = path.join(testDir, 'new.env');
      await createSecureFile(newFile, 'KEY=value\n');

      const content = await fs.readFile(newFile, 'utf-8');
      const perms = await getFilePermissions(newFile);

      expect(content).toBe('KEY=value\n');
      expect(perms).toBe(FilePermissions.SECURE_FILE);
    });

    it('should create secure file atomically', async () => {
      const envFile = path.join(testDir, '.env');
      const content = 'DB_HOST=localhost\nDB_PASS=secret123\n';

      await createSecureFile(envFile, content);

      // Verify file exists and has content
      const fileContent = await fs.readFile(envFile, 'utf-8');
      expect(fileContent).toBe(content);

      // Verify permissions
      const perms = await getFilePermissions(envFile);
      expect(perms).toBe(FilePermissions.SECURE_FILE);
    });

    it('should not leave temporary files on error', async () => {
      const invalidDir = '/nonexistent/path/file.env';

      try {
        await createSecureFile(invalidDir, 'content');
      } catch {
        // Expected to fail
      }

      // Check that no temp files were left behind in testDir
      const files = await fs.readdir(testDir);
      const tempFiles = files.filter((f) => f.startsWith('.') && f.endsWith('.tmp'));
      expect(tempFiles).toHaveLength(0);
    });

    it('should handle multiline content', async () => {
      const envFile = path.join(testDir, '.env');
      const content = 'KEY1=value1\nKEY2=value2\nKEY3="complex value"\n';

      await createSecureFile(envFile, content);

      const fileContent = await fs.readFile(envFile, 'utf-8');
      expect(fileContent).toBe(content);
    });

    it('should handle empty content', async () => {
      const envFile = path.join(testDir, '.env');
      await createSecureFile(envFile, '');

      const fileContent = await fs.readFile(envFile, 'utf-8');
      expect(fileContent).toBe('');

      const perms = await getFilePermissions(envFile);
      expect(perms).toBe(FilePermissions.SECURE_FILE);
    });

    it('should overwrite existing file', async () => {
      const envFile = path.join(testDir, '.env');

      // Create initial file
      await fs.writeFile(envFile, 'OLD_CONTENT=old\n');
      await fs.chmod(envFile, 0o644);

      // Create new secure file with different content
      const newContent = 'NEW_CONTENT=new\n';
      await createSecureFile(envFile, newContent);

      const fileContent = await fs.readFile(envFile, 'utf-8');
      const perms = await getFilePermissions(envFile);

      expect(fileContent).toBe(newContent);
      expect(perms).toBe(FilePermissions.SECURE_FILE);
    });
  });

  describe('formatPermissions', () => {
    it('should format 600 correctly', () => {
      expect(formatPermissions(0o600)).toBe('600');
    });

    it('should format 644 correctly', () => {
      expect(formatPermissions(0o644)).toBe('644');
    });

    it('should format 755 correctly', () => {
      expect(formatPermissions(0o755)).toBe('755');
    });

    it('should format 777 correctly', () => {
      expect(formatPermissions(0o777)).toBe('777');
    });

    it('should pad single digit permissions', () => {
      expect(formatPermissions(0o007)).toBe('007');
    });

    it('should pad double digit permissions', () => {
      expect(formatPermissions(0o077)).toBe('077');
    });
  });

  describe('isFileInsecure', () => {
    it('should return false for 600 permissions', async () => {
      await fs.writeFile(testFile, 'content');
      await fs.chmod(testFile, 0o600);

      const insecure = await isFileInsecure(testFile);
      expect(insecure).toBe(false);
    });

    it('should return true for 644 permissions (world readable)', async () => {
      await fs.writeFile(testFile, 'content');
      await fs.chmod(testFile, 0o644);

      const insecure = await isFileInsecure(testFile);
      expect(insecure).toBe(true);
    });

    it('should return true for 666 permissions (world read/write)', async () => {
      await fs.writeFile(testFile, 'content');
      await fs.chmod(testFile, 0o666);

      const insecure = await isFileInsecure(testFile);
      expect(insecure).toBe(true);
    });

    it('should return true for 755 permissions (world readable/executable)', async () => {
      await fs.writeFile(testFile, 'content');
      await fs.chmod(testFile, 0o755);

      const insecure = await isFileInsecure(testFile);
      expect(insecure).toBe(true);
    });

    it('should return true if file does not exist', async () => {
      const nonExistentFile = path.join(testDir, 'nonexistent.txt');
      const insecure = await isFileInsecure(nonExistentFile);
      expect(insecure).toBe(true);
    });

    it('should return false for 400 permissions (owner read-only)', async () => {
      await fs.writeFile(testFile, 'content');
      await fs.chmod(testFile, 0o400);

      const insecure = await isFileInsecure(testFile);
      expect(insecure).toBe(false);
    });
  });

  describe('FilePermissions constants', () => {
    it('should have correct SECURE_FILE value', () => {
      expect(FilePermissions.SECURE_FILE).toBe(0o600);
    });

    it('should have correct STANDARD_FILE value', () => {
      expect(FilePermissions.STANDARD_FILE).toBe(0o644);
    });

    it('should have correct STANDARD_DIR value', () => {
      expect(FilePermissions.STANDARD_DIR).toBe(0o755);
    });
  });

  describe('Integration scenarios', () => {
    it('should create, verify, and read secure .env file', async () => {
      const envFile = path.join(testDir, '.env');
      const envContent = 'DATABASE_URL=postgresql://localhost\nAPI_KEY=secret123\n';

      // Create secure file
      await createSecureFile(envFile, envContent);

      // Verify permissions
      expect(await hasSecurePermissions(envFile)).toBe(true);
      expect(await isFileInsecure(envFile)).toBe(false);

      // Verify content
      const content = await fs.readFile(envFile, 'utf-8');
      expect(content).toBe(envContent);

      // Verify accessibility
      expect(await isFileAccessible(envFile)).toBe(true);
    });

    it('should handle file permission changes', async () => {
      const envFile = path.join(testDir, '.env');
      await fs.writeFile(envFile, 'KEY=value');

      // Start with insecure permissions
      await fs.chmod(envFile, 0o644);
      expect(await isFileInsecure(envFile)).toBe(true);
      expect(await hasSecurePermissions(envFile)).toBe(false);

      // Make secure
      await setSecureFilePermissions(envFile);
      expect(await isFileInsecure(envFile)).toBe(false);
      expect(await hasSecurePermissions(envFile)).toBe(true);
    });
  });
});
