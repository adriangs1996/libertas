/**
 * Libertas CLI - Minimal credential management with 4 focused commands
 */

import { Command } from 'commander';
import { Formatter } from './utils/formatter';
import { createCommand } from './commands/create-command';
import { editCommand } from './commands/edit-command';
import { showKeyCommand } from './commands/show-key-command';
import { runCommand } from './commands/run-minimal-command';
import { linkCommand } from './commands/link-command';

export interface ProgramOptions {
  verbose?: boolean;
}

/**
 * Create the CLI program
 */
export async function createProgram(options: ProgramOptions = {}): Promise<Command> {
  const program = new Command();

  program
    .name('libertas')
    .description('Minimal secure credentials management')
    .version('1.0.0');

  // Create command - Create a new set of credentials
  program
    .command('create <name>')
    .description('Create a new set of credentials')
    .option('-k, --key <key>', 'Use existing master key (64 hex characters)')
    .option('-g, --generate', 'Generate a new master key')
    .action(async (name: string, cmdOptions: any) => {
      try {
        await createCommand(name, cmdOptions);
      } catch (error) {
        console.error(Formatter.error(error instanceof Error ? error.message : 'Unknown error'));
        process.exit(1);
      }
    });

  // Edit command - Edit a set of credentials with editor
  program
    .command('edit <name>')
    .description('Edit credentials with your favorite editor')
    .option('-e, --editor <editor>', 'Editor to use (vim, nano, nvim, code, etc.)')
    .action(async (name: string, cmdOptions: any) => {
      try {
        await editCommand(name, cmdOptions);
      } catch (error) {
        console.error(Formatter.error(error instanceof Error ? error.message : 'Unknown error'));
        process.exit(1);
      }
    });

  // Show-key command - Display the master key for a credential set
  program
    .command('show-key <name>')
    .description('Display the master key for a credential set')
    .action(async (name: string) => {
      try {
        await showKeyCommand(name);
      } catch (error) {
        console.error(Formatter.error(error instanceof Error ? error.message : 'Unknown error'));
        process.exit(1);
      }
    });

  // Run command - Execute command with credentials bootstrapped
  program
    .command('run <name>')
    .argument('[command...]', 'Command and arguments to execute')
    .description('Execute command with credentials bootstrapped as environment variables')
    .usage('<name> [-- command] [args...]')
    .allowUnknownOption()
    .action(async (name: string, command: string[], cmdOptions: any) => {
      try {
        // Extract command after --
        let args = command;
        if (!args || args.length === 0) {
          const doubleMinusIndex = process.argv.indexOf('--');
          if (doubleMinusIndex !== -1) {
            args = process.argv.slice(doubleMinusIndex + 1);
          }
        }

        if (!args || args.length === 0) {
          throw new Error('No command specified. Usage: libertas run <name> -- <command> [args...]');
        }

        await runCommand(name, args);
      } catch (error) {
        console.error(Formatter.error(error instanceof Error ? error.message : 'Unknown error'));
        process.exit(1);
      }
    });

  // Link command - Link existing credentials with master keys
  program
    .command('link')
    .description('Link existing credential sets with master keys')
    .option('-f, --force', 'Re-prompt for keys even if already stored')
    .action(async (cmdOptions: any) => {
      try {
        await linkCommand(cmdOptions);
      } catch (error) {
        console.error(Formatter.error(error instanceof Error ? error.message : 'Unknown error'));
        process.exit(1);
      }
    });

  return program;
}

export default createProgram;
