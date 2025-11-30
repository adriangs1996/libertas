/**
 * Create command - Create a new set of credentials
 * Prompts for master key or generates one, then stores it
 */

import { createInterface } from 'node:readline';
import { CryptoUtils, CredentialsManager, FileStorage } from '@libertas/core';
import { Formatter } from '../utils/formatter';
import { getMasterKey, saveMasterKey } from '../utils/local-key-storage';

export async function createCommand(
  name: string,
  options: { key?: string; generate?: boolean }
): Promise<void> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });

  try {
    // Check if credentials already exist
    const existingKey = await getMasterKey(name);
    if (existingKey) {
      console.log(Formatter.warning(`✗ Credentials set "${name}" already exists`));
      console.log(Formatter.info('Use "libertas edit <name>" to modify existing credentials'));
      rl.close();
      process.exit(1);
    }

    let masterKey: string;

    // Determine master key source
    if (options.key) {
      // Validate provided key
      if (!/^[a-f0-9]{64}$/.test(options.key)) {
        console.log(Formatter.error('✗ Invalid master key format. Must be 64 hex characters.'));
        rl.close();
        process.exit(1);
      }
      masterKey = options.key;
      console.log(Formatter.success('✓ Using provided master key'));
    } else if (options.generate) {
      masterKey = CryptoUtils.generateMasterKey();
      console.log(Formatter.success('✓ Generated new master key'));
    } else {
      // Prompt user
      masterKey = await new Promise((resolve) => {
        rl.question(
          Formatter.info('\nUse existing master key or generate new? (existing/generate) [generate]: '),
          (answer: string) => {
            const choice = answer.toLowerCase().trim() || 'generate';
            resolve(choice);
          }
        );
      });

      if (masterKey === 'existing' || masterKey === 'e') {
        masterKey = await new Promise((resolve) => {
          rl.question(
            Formatter.info('Enter master key (64 hex characters): '),
            (key: string) => {
              if (!/^[a-f0-9]{64}$/.test(key)) {
                console.log(Formatter.error('✗ Invalid master key format'));
                process.exit(1);
              }
              resolve(key);
            }
          );
        });
      } else {
        masterKey = CryptoUtils.generateMasterKey();
        console.log(Formatter.success('✓ Generated new master key'));
      }
    }

    // Save master key to local storage
    const keySaved = await saveMasterKey(name, masterKey);
    if (!keySaved) {
      console.log(Formatter.error('✗ Failed to save master key'));
      rl.close();
      process.exit(1);
    }

    // Create empty credentials file
    const storageDir = './credentials';
    const storage = new FileStorage(storageDir);
    const manager = new CredentialsManager({
      masterKey,
      storageBackend: storage,
      environment: name,
    });

    // Create empty credentials object
    await manager.save(name, {});

    console.log(Formatter.success(`\n✓ Credentials set "${name}" created successfully`));
    console.log(Formatter.info(`\nNext steps:`));
    console.log(Formatter.info(`  1. Edit credentials: libertas edit ${name}`));
    console.log(Formatter.info(`  2. View credentials: (open ./credentials/${name}.enc)`));
    console.log(Formatter.info(`  3. Run with credentials: libertas run ${name} -- <command>`));
    console.log(Formatter.info(`  4. Show master key: libertas show-key ${name}\n`));

    rl.close();
  } catch (error) {
    console.error(Formatter.error(`Failed to create credentials: ${error instanceof Error ? error.message : 'Unknown error'}`));
    rl.close();
    process.exit(1);
  }
}
