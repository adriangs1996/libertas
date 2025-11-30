/**
 * Edit command - Edit credentials with favorite editor
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { execSync } from 'node:child_process';
import { CredentialsManager, FileStorage } from '@libertas/core';
import { Formatter } from '../utils/formatter';
import { getMasterKey } from '../utils/local-key-storage';

export async function editCommand(
  name: string,
  options: { editor?: string }
): Promise<void> {
  try {
    // Get master key
    const masterKey = await getMasterKey(name);
    if (!masterKey) {
      console.log(Formatter.error(`✗ Credentials set "${name}" not found`));
      console.log(Formatter.info(`Create it first: libertas create ${name}`));
      process.exit(1);
    }

    // Load current credentials
    const storageDir = './credentials';
    const storage = new FileStorage(storageDir);
    const manager = new CredentialsManager({
      masterKey,
      storageBackend: storage,
      environment: name,
    });

    let credentials: Record<string, any> = {};
    try {
      credentials = await manager.load(name);
    } catch {
      // Credentials don't exist yet
    }

    // Create temp file
    const tempDir = path.join(os.tmpdir(), `libertas-${Date.now()}`);
    await fs.mkdir(tempDir, { recursive: true });
    const tempFile = path.join(tempDir, `${name}.json`);

    // Write credentials to temp file
    await fs.writeFile(tempFile, JSON.stringify(credentials, null, 2), { mode: 0o600 });

    // Determine editor
    let editor = options.editor || process.env.EDITOR || process.env.VISUAL || 'vim';

    // Open editor
    console.log(Formatter.info(`Opening editor: ${editor}...`));
    try {
      execSync(`${editor} "${tempFile}"`, { stdio: 'inherit' });
    } catch (error) {
      console.log(Formatter.warning('Editor exited with code'));
    }

    // Read edited credentials
    const editedContent = await fs.readFile(tempFile, 'utf-8');
    let editedCredentials: Record<string, any>;

    try {
      editedCredentials = JSON.parse(editedContent);
    } catch (error) {
      console.log(Formatter.error('✗ Invalid JSON in credentials file'));
      process.exit(1);
    }

    // Save credentials
    await manager.save(name, editedCredentials);

    // Cleanup
    await fs.rm(tempDir, { recursive: true, force: true });

    console.log(Formatter.success(`\n✓ Credentials "${name}" saved successfully`));
  } catch (error) {
    console.error(Formatter.error(`Failed to edit credentials: ${error instanceof Error ? error.message : 'Unknown error'}`));
    process.exit(1);
  }
}
