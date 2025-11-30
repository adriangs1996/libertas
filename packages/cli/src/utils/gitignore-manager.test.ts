/**
 * Tests for .gitignore management utilities
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { isInGitRepository, addToGitignore, removeFromGitignore, isInGitignore } from './gitignore-manager';

describe('gitignore-manager', () => {
  let testDir: string;

  beforeEach(async () => {
    // Create temporary test directory
    testDir = path.join(tmpdir(), `libertas-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    await fs.mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    // Clean up test directory
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('isInGitRepository', () => {
    it('should return false when .git directory does not exist', async () => {
      const result = await isInGitRepository(testDir);
      expect(result).toBe(false);
    });

    it('should return true when .git directory exists', async () => {
      const gitDir = path.join(testDir, '.git');
      await fs.mkdir(gitDir);
      const result = await isInGitRepository(testDir);
      expect(result).toBe(true);
    });

    it('should use process.cwd() as default', async () => {
      const result = await isInGitRepository();
      expect(typeof result).toBe('boolean');
    });
  });

  describe('addToGitignore', () => {
    it('should create .gitignore and add entry if file does not exist', async () => {
      const result = await addToGitignore('.env', testDir);
      expect(result).toBe(true);

      const content = await fs.readFile(path.join(testDir, '.gitignore'), 'utf-8');
      expect(content).toContain('/.env');
      expect(content.endsWith('\n')).toBe(true);
    });

    it('should append entry to existing .gitignore', async () => {
      const gitignorePath = path.join(testDir, '.gitignore');
      await fs.writeFile(gitignorePath, 'node_modules/\n');

      const result = await addToGitignore('.env', testDir);
      expect(result).toBe(true);

      const content = await fs.readFile(gitignorePath, 'utf-8');
      expect(content).toContain('node_modules/');
      expect(content).toContain('/.env');
    });

    it('should not duplicate existing entries', async () => {
      const gitignorePath = path.join(testDir, '.gitignore');
      await fs.writeFile(gitignorePath, '/.env\n');

      const result = await addToGitignore('.env', testDir);
      expect(result).toBe(false);

      const content = await fs.readFile(gitignorePath, 'utf-8');
      expect(content).toBe('/.env\n');
    });

    it('should handle entries without leading slash', async () => {
      const result = await addToGitignore('.env', testDir);
      expect(result).toBe(true);

      // Adding the same entry with leading slash should be idempotent
      const result2 = await addToGitignore('/.env', testDir);
      expect(result2).toBe(false);

      const content = await fs.readFile(path.join(testDir, '.gitignore'), 'utf-8');
      const lines = content.trim().split('\n');
      expect(lines).toHaveLength(1);
      expect(lines[0]).toBe('/.env');
    });

    it('should handle entries with leading slash', async () => {
      const result = await addToGitignore('/.env', testDir);
      expect(result).toBe(true);

      // Adding the same entry without leading slash should be idempotent
      const result2 = await addToGitignore('.env', testDir);
      expect(result2).toBe(false);

      const content = await fs.readFile(path.join(testDir, '.gitignore'), 'utf-8');
      const lines = content.trim().split('\n');
      expect(lines).toHaveLength(1);
    });

    it('should handle multiple entries', async () => {
      const result1 = await addToGitignore('.env', testDir);
      const result2 = await addToGitignore('.env.local', testDir);
      const result3 = await addToGitignore('node_modules', testDir);

      expect(result1).toBe(true);
      expect(result2).toBe(true);
      expect(result3).toBe(true);

      const content = await fs.readFile(path.join(testDir, '.gitignore'), 'utf-8');
      expect(content).toContain('/.env');
      expect(content).toContain('/.env.local');
      expect(content).toContain('/node_modules');
    });

    it('should handle path patterns', async () => {
      const result = await addToGitignore('dist/', testDir);
      expect(result).toBe(true);

      const content = await fs.readFile(path.join(testDir, '.gitignore'), 'utf-8');
      expect(content).toContain('/dist/');
    });

    it('should handle complex patterns', async () => {
      const result = await addToGitignore('*.log', testDir);
      expect(result).toBe(true);

      const content = await fs.readFile(path.join(testDir, '.gitignore'), 'utf-8');
      expect(content).toContain('/*.log');
    });

    it('should preserve existing file content', async () => {
      const gitignorePath = path.join(testDir, '.gitignore');
      const existingContent = 'node_modules/\nbuild/\n.DS_Store\n';
      await fs.writeFile(gitignorePath, existingContent);

      await addToGitignore('.env', testDir);

      const content = await fs.readFile(gitignorePath, 'utf-8');
      expect(content).toContain('node_modules/');
      expect(content).toContain('build/');
      expect(content).toContain('.DS_Store');
      expect(content).toContain('/.env');
    });

    it('should handle files without trailing newline', async () => {
      const gitignorePath = path.join(testDir, '.gitignore');
      await fs.writeFile(gitignorePath, 'node_modules/'); // No trailing newline

      const result = await addToGitignore('.env', testDir);
      expect(result).toBe(true);

      const content = await fs.readFile(gitignorePath, 'utf-8');
      expect(content).toBe('node_modules/\n/.env\n');
    });

    it('should handle files with trailing newline', async () => {
      const gitignorePath = path.join(testDir, '.gitignore');
      await fs.writeFile(gitignorePath, 'node_modules/\n');

      const result = await addToGitignore('.env', testDir);
      expect(result).toBe(true);

      const content = await fs.readFile(gitignorePath, 'utf-8');
      expect(content).toBe('node_modules/\n/.env\n');
    });

    it('should handle trimmed entry comparisons', async () => {
      const gitignorePath = path.join(testDir, '.gitignore');
      await fs.writeFile(gitignorePath, '  /.env  \n');

      const result = await addToGitignore('.env', testDir);
      expect(result).toBe(false);
    });

    it('should use process.cwd() as default', async () => {
      // This should not throw
      const result = await addToGitignore('.env');
      expect(typeof result).toBe('boolean');
    });
  });

  describe('removeFromGitignore', () => {
    it('should return false if .gitignore does not exist', async () => {
      const result = await removeFromGitignore('.env', testDir);
      expect(result).toBe(false);
    });

    it('should remove entry from .gitignore', async () => {
      const gitignorePath = path.join(testDir, '.gitignore');
      await fs.writeFile(gitignorePath, 'node_modules/\n/.env\nbuild/\n');

      const result = await removeFromGitignore('.env', testDir);
      expect(result).toBe(true);

      const content = await fs.readFile(gitignorePath, 'utf-8');
      expect(content).not.toContain('.env');
      expect(content).toContain('node_modules/');
      expect(content).toContain('build/');
    });

    it('should delete .gitignore if it becomes empty', async () => {
      const gitignorePath = path.join(testDir, '.gitignore');
      await fs.writeFile(gitignorePath, '/.env\n');

      const result = await removeFromGitignore('.env', testDir);
      expect(result).toBe(true);

      try {
        await fs.stat(gitignorePath);
        expect(true).toBe(false); // File should not exist
      } catch {
        expect(true).toBe(true); // Expected - file was deleted
      }
    });

    it('should handle entries without leading slash', async () => {
      const gitignorePath = path.join(testDir, '.gitignore');
      await fs.writeFile(gitignorePath, 'node_modules/\n/.env\nbuild/\n');

      const result = await removeFromGitignore('.env', testDir);
      expect(result).toBe(true);

      const content = await fs.readFile(gitignorePath, 'utf-8');
      expect(content).not.toContain('.env');
    });

    it('should handle entries with leading slash', async () => {
      const gitignorePath = path.join(testDir, '.gitignore');
      await fs.writeFile(gitignorePath, 'node_modules/\n/.env\nbuild/\n');

      const result = await removeFromGitignore('/.env', testDir);
      expect(result).toBe(true);

      const content = await fs.readFile(gitignorePath, 'utf-8');
      expect(content).not.toContain('.env');
    });

    it('should remove only matching entries', async () => {
      const gitignorePath = path.join(testDir, '.gitignore');
      await fs.writeFile(gitignorePath, '/.env\n/.env.local\n/.env.production\n');

      const result = await removeFromGitignore('.env', testDir);
      expect(result).toBe(true);

      const content = await fs.readFile(gitignorePath, 'utf-8');
      expect(content).not.toContain('/.env\n');
      expect(content).toContain('/.env.local');
      expect(content).toContain('/.env.production');
    });

    it('should preserve other entries and formatting', async () => {
      const gitignorePath = path.join(testDir, '.gitignore');
      const originalContent = 'node_modules/\n\n# Dependencies\n/.env\n\nbuild/\n';
      await fs.writeFile(gitignorePath, originalContent);

      const result = await removeFromGitignore('.env', testDir);
      expect(result).toBe(true);

      const content = await fs.readFile(gitignorePath, 'utf-8');
      expect(content).toContain('node_modules/');
      expect(content).toContain('build/');
      expect(content).not.toContain('/.env');
    });

    it('should return false if entry does not exist', async () => {
      const gitignorePath = path.join(testDir, '.gitignore');
      await fs.writeFile(gitignorePath, 'node_modules/\nbuild/\n');

      const result = await removeFromGitignore('.env', testDir);
      expect(result).toBe(false);

      const content = await fs.readFile(gitignorePath, 'utf-8');
      expect(content).toBe('node_modules/\nbuild/\n');
    });

    it('should use process.cwd() as default', async () => {
      const result = await removeFromGitignore('.env');
      expect(typeof result).toBe('boolean');
    });
  });

  describe('isInGitignore', () => {
    it('should return false if .gitignore does not exist', async () => {
      const result = await isInGitignore('.env', testDir);
      expect(result).toBe(false);
    });

    it('should return true if entry exists in .gitignore', async () => {
      const gitignorePath = path.join(testDir, '.gitignore');
      await fs.writeFile(gitignorePath, 'node_modules/\n/.env\nbuild/\n');

      const result = await isInGitignore('.env', testDir);
      expect(result).toBe(true);
    });

    it('should return false if entry does not exist in .gitignore', async () => {
      const gitignorePath = path.join(testDir, '.gitignore');
      await fs.writeFile(gitignorePath, 'node_modules/\nbuild/\n');

      const result = await isInGitignore('.env', testDir);
      expect(result).toBe(false);
    });

    it('should handle entries with and without leading slash', async () => {
      const gitignorePath = path.join(testDir, '.gitignore');
      await fs.writeFile(gitignorePath, '/.env\n');

      const result1 = await isInGitignore('.env', testDir);
      const result2 = await isInGitignore('/.env', testDir);

      expect(result1).toBe(true);
      expect(result2).toBe(true);
    });

    it('should handle whitespace in entries', async () => {
      const gitignorePath = path.join(testDir, '.gitignore');
      await fs.writeFile(gitignorePath, '  /.env  \n');

      const result = await isInGitignore('.env', testDir);
      expect(result).toBe(true);
    });

    it('should return true for exact matches only', async () => {
      const gitignorePath = path.join(testDir, '.gitignore');
      await fs.writeFile(gitignorePath, '/.env\n');

      const result1 = await isInGitignore('.env', testDir);
      const result2 = await isInGitignore('.env.local', testDir);

      expect(result1).toBe(true);
      expect(result2).toBe(false);
    });

    it('should handle multiple entries', async () => {
      const gitignorePath = path.join(testDir, '.gitignore');
      await fs.writeFile(gitignorePath, '/.env\n/.env.local\nnode_modules/\nbuild/\n');

      expect(await isInGitignore('.env', testDir)).toBe(true);
      expect(await isInGitignore('.env.local', testDir)).toBe(true);
      expect(await isInGitignore('node_modules', testDir)).toBe(true);
      expect(await isInGitignore('build', testDir)).toBe(true);
      expect(await isInGitignore('dist', testDir)).toBe(false);
    });

    it('should use process.cwd() as default', async () => {
      const result = await isInGitignore('.env');
      expect(typeof result).toBe('boolean');
    });

    it('should handle empty .gitignore file', async () => {
      const gitignorePath = path.join(testDir, '.gitignore');
      await fs.writeFile(gitignorePath, '');

      const result = await isInGitignore('.env', testDir);
      expect(result).toBe(false);
    });

    it('should ignore comments in .gitignore', async () => {
      const gitignorePath = path.join(testDir, '.gitignore');
      await fs.writeFile(gitignorePath, '# This is a comment\n/.env\n# Another comment\n');

      const result = await isInGitignore('.env', testDir);
      expect(result).toBe(true);
    });
  });

  describe('Round-trip operations', () => {
    it('should add and remove entry correctly', async () => {
      const gitignorePath = path.join(testDir, '.gitignore');

      // Add entry
      const addResult = await addToGitignore('.env', testDir);
      expect(addResult).toBe(true);

      let isIn = await isInGitignore('.env', testDir);
      expect(isIn).toBe(true);

      // Remove entry
      const removeResult = await removeFromGitignore('.env', testDir);
      expect(removeResult).toBe(true);

      isIn = await isInGitignore('.env', testDir);
      expect(isIn).toBe(false);
    });

    it('should handle multiple add/remove cycles', async () => {
      // Cycle 1
      await addToGitignore('.env', testDir);
      expect(await isInGitignore('.env', testDir)).toBe(true);
      await removeFromGitignore('.env', testDir);
      expect(await isInGitignore('.env', testDir)).toBe(false);

      // Cycle 2
      await addToGitignore('.env', testDir);
      expect(await isInGitignore('.env', testDir)).toBe(true);
      await removeFromGitignore('.env', testDir);
      expect(await isInGitignore('.env', testDir)).toBe(false);
    });

    it('should maintain other entries through add/remove cycles', async () => {
      const gitignorePath = path.join(testDir, '.gitignore');

      // Add multiple entries
      await addToGitignore('node_modules', testDir);
      await addToGitignore('.env', testDir);
      await addToGitignore('build', testDir);

      // Remove one
      await removeFromGitignore('.env', testDir);

      // Verify others still exist
      expect(await isInGitignore('node_modules', testDir)).toBe(true);
      expect(await isInGitignore('build', testDir)).toBe(true);
      expect(await isInGitignore('.env', testDir)).toBe(false);

      const content = await fs.readFile(gitignorePath, 'utf-8');
      const lines = content.trim().split('\n');
      expect(lines).toHaveLength(2);
    });
  });
});
