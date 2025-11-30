/**
 * Dump command for exporting credentials as .env file
 * Creates secure .env file with proper permissions and gitignore handling
 */

import path from 'node:path';
import fs from 'node:fs/promises';
import { CredentialsManager, credentialsToEnv, FileStorage } from '@libertas/core';
import { loadConfig } from '../utils/config-loader';
import { addToGitignore, isInGitRepository } from '../utils/gitignore-manager';
import { createSecureFile, hasSecurePermissions, isFileInsecure } from '../utils/file-permissions';
import { Formatter } from '../utils/formatter';

/**
 * Options for dump command
 */
export interface DumpCommandOptions {
  scope?: string;
  force?: boolean;
  output?: string;
}

/**
 * Dump credentials to .env file with security measures
 * - Creates secure .env file (chmod 600)
 * - Adds .env to .gitignore if in git repository
 * - Shows warnings about security implications
 */
export async function dumpCommand(options: DumpCommandOptions = {}): Promise<void> {
  const scope = options.scope || 'default';
  const force = options.force || false;
  const outputPath = options.output || path.join(process.cwd(), '.env');

  try {
    // Load configuration
    const config = await loadConfig(process.cwd());

    if (!config.masterKey) {
      throw new Error('Master key not found. Run "libertas init" first to set up your credentials.');
    }

    // Display information
    console.log('\n' + Formatter.header('📄 Creating .env file'));
    console.log(Formatter.info(`Output: ${outputPath}`));
    console.log(Formatter.info(`Scope: ${scope}\n`));

    // Check if file exists and handle force flag
    let fileExists = false;
    try {
      await fs.stat(outputPath);
      fileExists = true;
    } catch {
      fileExists = false;
    }

    if (fileExists && !force) {
      console.log(Formatter.warning('⚠ .env file already exists'));
      console.log(Formatter.info('Use --force to overwrite\n'));
      return;
    }

    if (fileExists && force) {
      console.log(Formatter.info('Overwriting existing .env file...\n'));
    }

    // Create manager with file storage backend
    const storageDir = config.storagePath || './credentials';
    const storage = new FileStorage(storageDir);
    const manager = new CredentialsManager({
      masterKey: config.masterKey,
      storageBackend: storage,
      environment: config.environment,
    });

    // Get credentials for the specified scope
    let credentials: Record<string, any>;
    try {
      credentials = await manager.load(scope);
    } catch (error) {
      throw new Error(
        `Failed to load credentials for scope "${scope}": ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }

    if (!credentials || Object.keys(credentials).length === 0) {
      console.log(Formatter.warning(`⚠ No credentials found for scope "${scope}"`));
      return;
    }

    // Convert credentials to .env format
    const envContent = credentialsToEnv(credentials);

    // Create secure .env file atomically
    await createSecureFile(outputPath, envContent);
    console.log(Formatter.success(`✓ Created .env file with ${Object.keys(credentials).length} entries`));

    // Verify permissions
    const isSecure = await hasSecurePermissions(outputPath);
    if (isSecure) {
      console.log(Formatter.success('✓ File permissions set to 600 (owner read/write only)'));
    } else {
      console.log(Formatter.warning('⚠ File permissions could not be verified as secure'));
    }

    // Add to .gitignore if in git repository
    const inGitRepo = await isInGitRepository(process.cwd());
    if (inGitRepo) {
      const added = await addToGitignore('.env', process.cwd());
      if (added) {
        console.log(Formatter.success('✓ Added .env to .gitignore'));
      } else {
        console.log(Formatter.info('ℹ .env already in .gitignore'));
      }
    } else {
      console.log(Formatter.info('ℹ Not in a git repository (skipping .gitignore)'));
    }

    // Display security warnings
    console.log('\n' + Formatter.warning('⚠ Security Notice:'));
    console.log(Formatter.info('  • .env file contains sensitive credentials'));
    console.log(Formatter.info('  • File permissions are set to 600 (owner only)'));
    console.log(Formatter.info('  • Never commit .env to version control'));
    console.log(Formatter.info('  • Add .env to .gitignore if not already present'));
    console.log(Formatter.info('  • Clean up the .env file when no longer needed\n'));

    console.log(Formatter.success('✓ .env file dump complete!\n'));
  } catch (error) {
    console.error(Formatter.error(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`));
    process.exit(1);
  }
}

/**
 * Remove .env file and clean up
 * Use this after your application has finished using the .env file
 */
export async function cleanupDumpFile(outputPath: string = path.join(process.cwd(), '.env')): Promise<void> {
  try {
    // Check if file exists
    try {
      await fs.stat(outputPath);
    } catch {
      // File doesn't exist, nothing to clean up
      return;
    }

    // Check if file is secure (should be our created file)
    const isSecure = await hasSecurePermissions(outputPath);
    if (!isSecure) {
      console.log(Formatter.warning('⚠ Warning: .env file does not have secure permissions (600). Skipping deletion.'));
      return;
    }

    // Verify it looks like a credentials file before deletion (safety check)
    const content = await fs.readFile(outputPath, 'utf-8');
    if (!content.includes('=')) {
      console.log(Formatter.warning('⚠ Warning: .env file does not look like a credentials file. Skipping deletion.'));
      return;
    }

    // Securely delete by overwriting with zeros first
    const size = (await fs.stat(outputPath)).size;
    if (size > 0) {
      await fs.writeFile(outputPath, Buffer.alloc(size, 0), 'utf-8');
    }

    // Delete the file
    await fs.unlink(outputPath);
    console.log(Formatter.success('✓ .env file securely deleted'));
  } catch (error) {
    console.error(Formatter.error(`Cleanup failed: ${error instanceof Error ? error.message : 'Unknown error'}`));
    process.exit(1);
  }
}

/**
 * Verify .env file integrity and security
 */
export async function verifyDumpFile(outputPath: string = path.join(process.cwd(), '.env')): Promise<boolean> {
  try {
    // Check if file exists
    let fileExists = false;
    try {
      await fs.stat(outputPath);
      fileExists = true;
    } catch {
      fileExists = false;
    }

    if (!fileExists) {
      console.log(Formatter.warning('⚠ .env file does not exist'));
      return false;
    }

    // Check permissions
    const isSecure = await hasSecurePermissions(outputPath);
    if (!isSecure) {
      console.log(Formatter.error('✗ .env file does not have secure permissions (600)'));
      return false;
    }

    console.log(Formatter.success('✓ .env file has secure permissions (600)'));

    // Check if in .gitignore
    const inGitRepo = await isInGitRepository(process.cwd());
    if (inGitRepo) {
      const gitignorePath = path.join(process.cwd(), '.gitignore');
      try {
        const gitignoreContent = await fs.readFile(gitignorePath, 'utf-8');
        if (gitignoreContent.includes('.env')) {
          console.log(Formatter.success('✓ .env is in .gitignore'));
        } else {
          console.log(Formatter.warning('⚠ .env is not in .gitignore'));
          return false;
        }
      } catch {
        console.log(Formatter.warning('⚠ Could not read .gitignore'));
        return false;
      }
    }

    // Check content validity
    try {
      const content = await fs.readFile(outputPath, 'utf-8');
      if (!content || content.length === 0) {
        console.log(Formatter.warning('⚠ .env file is empty'));
        return false;
      }

      if (!content.includes('=')) {
        console.log(Formatter.warning('⚠ .env file does not contain any key=value pairs'));
        return false;
      }

      console.log(Formatter.success('✓ .env file contains valid entries'));
    } catch {
      console.log(Formatter.error('✗ Could not read .env file'));
      return false;
    }

    return true;
  } catch (error) {
    console.error(Formatter.error(`Verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`));
    return false;
  }
}
