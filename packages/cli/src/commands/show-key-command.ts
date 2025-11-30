/**
 * Show-key command - Display the master key for a credential set
 */

import { Formatter } from '../utils/formatter';
import { getMasterKey } from '../utils/local-key-storage';

export async function showKeyCommand(name: string): Promise<void> {
  try {
    const masterKey = await getMasterKey(name);

    if (!masterKey) {
      console.log(Formatter.error(`✗ No master key found for credentials set "${name}"`));
      console.log(Formatter.info(`Create it first: libertas create ${name}`));
      process.exit(1);
    }

    console.log(Formatter.header(`\n🔐 Master Key for "${name}"\n`));
    console.log(Formatter.json(masterKey));
    console.log();
  } catch (error) {
    console.error(Formatter.error(`Failed to retrieve master key: ${error instanceof Error ? error.message : 'Unknown error'}`));
    process.exit(1);
  }
}
