/**
 * Link command - Link existing credentials with master keys
 * Detects .enc files in ./credentials and prompts for master keys
 */

import fs from 'node:fs/promises';
import { createInterface } from 'node:readline';
import { Formatter } from '../utils/formatter';
import { getMasterKey, saveMasterKey } from '../utils/local-key-storage';

export async function linkCommand(options: { force?: boolean }): Promise<void> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });

  try {
    const credentialsDir = './credentials';

    // Check if credentials directory exists
    try {
      await fs.access(credentialsDir);
    } catch {
      console.log(Formatter.warning('✗ No credentials directory found at ./credentials'));
      console.log(Formatter.info('Create credentials first: libertas create <name>'));
      rl.close();
      process.exit(0);
    }

    // Scan for .json files
    const files = await fs.readdir(credentialsDir);
    const credentialSets = files
      .filter((f) => f.endsWith('.json'))
      .map((f) => f.replace('.json', ''))
      .sort();

    if (credentialSets.length === 0) {
      console.log(Formatter.info('No credential sets found in ./credentials'));
      rl.close();
      process.exit(0);
    }

    console.log(Formatter.header(`\n🔗 Found ${credentialSets.length} credential set(s)\n`));

    const linkedKeys: string[] = [];
    const skippedSets: string[] = [];

    // For each credential set, prompt for key
    for (const setName of credentialSets) {
      const existingKey = await getMasterKey(setName);
      if (existingKey && !options.force) {
        console.log(Formatter.success(`✓ "${setName}" - already has key stored`));
        linkedKeys.push(setName);
        continue;
      }

      const hasKey = await new Promise<boolean>((resolve) => {
        rl.question(
          Formatter.info(`\nDo you have a master key for "${setName}"? (yes/no) [no]: `),
          (answer: string) => {
            const choice = answer.toLowerCase().trim() || 'no';
            resolve(choice === 'yes' || choice === 'y');
          }
        );
      });

      if (!hasKey) {
        console.log(Formatter.warning(`⊘ Skipping "${setName}"`));
        skippedSets.push(setName);
        continue;
      }

      // Prompt for the key
      const masterKey = await new Promise<string | null>((resolve) => {
        rl.question(
          Formatter.info('Enter master key (64 hex characters): '),
          (key: string) => {
            if (!/^[a-f0-9]{64}$/.test(key)) {
              console.log(
                Formatter.error('✗ Invalid master key format. Must be 64 hex characters.')
              );
              resolve(null);
            } else {
              resolve(key);
            }
          }
        );
      });

      if (!masterKey) {
        skippedSets.push(setName);
        continue;
      }

      // Save the key
      const keySaved = await saveMasterKey(setName, masterKey);
      if (keySaved) {
        console.log(Formatter.success(`✓ Master key for "${setName}" saved`));
        linkedKeys.push(setName);
      } else {
        console.log(Formatter.error(`✗ Failed to save master key for "${setName}"`));
        skippedSets.push(setName);
      }
    }

    // Summary
    console.log(Formatter.header('\n📋 Summary\n'));
    if (linkedKeys.length > 0) {
      console.log(Formatter.success(`✓ Linked: ${linkedKeys.join(', ')}`));
    }

    if (skippedSets.length > 0) {
      console.log(Formatter.warning(`⊘ Skipped: ${skippedSets.join(', ')}`));
    }

    console.log(Formatter.info('\nYou can now use: libertas run <name> -- <command>'));
    console.log();

    rl.close();
  } catch (error) {
    console.error(
      Formatter.error(
        `Failed to link credentials: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    );
    rl.close();
    process.exit(1);
  }
}
