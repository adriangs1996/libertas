/**
 * .gitignore management utilities
 * Handles adding .env files to .gitignore safely
 */

import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * Check if a file path is within a git repository
 */
export async function isInGitRepository(cwd: string = process.cwd()): Promise<boolean> {
  try {
    const gitDir = path.join(cwd, '.git');
    await fs.stat(gitDir);
    return true;
  } catch {
    return false;
  }
}

/**
 * Add entry to .gitignore if not already present
 * Creates .gitignore if it doesn't exist
 */
export async function addToGitignore(entry: string, cwd: string = process.cwd()): Promise<boolean> {
  try {
    const gitignorePath = path.join(cwd, '.gitignore');
    const normalizedEntry = entry.startsWith('/') ? entry : `/${entry}`;

    // Try to read existing .gitignore
    let content: string;
    try {
      content = await fs.readFile(gitignorePath, 'utf-8');
    } catch {
      // File doesn't exist, create new content
      content = '';
    }

    // Check if entry already exists (with or without leading slash)
    const lines = content.split('\n');
    const entryWithoutSlash = normalizedEntry.replace(/^\//, '');

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine === normalizedEntry || trimmedLine === entryWithoutSlash || trimmedLine === entry) {
        // Entry already exists
        return false;
      }
    }

    // Append entry to .gitignore
    const newContent = content.endsWith('\n') ? content : content + '\n';
    await fs.writeFile(gitignorePath, newContent + normalizedEntry + '\n', 'utf-8');

    return true;
  } catch (error) {
    throw new Error(`Failed to add to .gitignore: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Remove entry from .gitignore
 */
export async function removeFromGitignore(entry: string, cwd: string = process.cwd()): Promise<boolean> {
  try {
    const gitignorePath = path.join(cwd, '.gitignore');
    const normalizedEntry = entry.startsWith('/') ? entry : `/${entry}`;

    // Read .gitignore
    let content: string;
    try {
      content = await fs.readFile(gitignorePath, 'utf-8');
    } catch {
      // File doesn't exist
      return false;
    }

    // Filter out the entry
    const lines = content.split('\n');
    const entryWithoutSlash = normalizedEntry.replace(/^\//, '');

    const filtered = lines.filter((line) => {
      const trimmedLine = line.trim();
      return trimmedLine !== normalizedEntry && trimmedLine !== entryWithoutSlash && trimmedLine !== entry;
    });

    // Check if anything was actually removed
    if (filtered.length === lines.length) {
      // Nothing was removed
      return false;
    }

    // Write back (removing trailing empty lines)
    const newContent = filtered.join('\n').trim();
    if (newContent) {
      await fs.writeFile(gitignorePath, newContent + '\n', 'utf-8');
    } else {
      // If empty, delete the file
      await fs.unlink(gitignorePath);
    }

    return true;
  } catch (error) {
    throw new Error(`Failed to remove from .gitignore: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Check if entry is in .gitignore
 */
export async function isInGitignore(entry: string, cwd: string = process.cwd()): Promise<boolean> {
  try {
    const gitignorePath = path.join(cwd, '.gitignore');
    const normalizedEntry = entry.startsWith('/') ? entry : `/${entry}`;
    const entryWithoutSlash = normalizedEntry.replace(/^\//, '');

    // Read .gitignore
    let content: string;
    try {
      content = await fs.readFile(gitignorePath, 'utf-8');
    } catch {
      // File doesn't exist
      return false;
    }

    // Check if entry exists (normalize both file and entry for comparison)
    const lines = content.split('\n');

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) {
        continue; // Skip empty lines
      }

      // Normalize the file entry
      let fileEntryBase = trimmedLine.startsWith('/') ? trimmedLine.slice(1) : trimmedLine;
      // Remove trailing slash for comparison
      fileEntryBase = fileEntryBase.replace(/\/$/, '');

      // Normalize the search entry
      let searchEntryBase = entryWithoutSlash.replace(/\/$/, '');

      // Compare
      if (fileEntryBase === searchEntryBase) {
        return true;
      }
    }

    return false;
  } catch {
    return false;
  }
}
