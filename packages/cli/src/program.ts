/**
 * Commander-based CLI program
 */

import { Command } from 'commander';
import { CredentialsCLI } from './commands/credentials-cli';
import { initCommand } from './commands/init-command';
import { dumpCommand, cleanupDumpFile, verifyDumpFile } from './commands/dump-command';
import { runCommand } from './commands/run-command';
import { loadConfig } from './utils/config-loader';
import { Formatter } from './utils/formatter';
import type { CLIConfig } from './types';

export interface ProgramOptions {
  config?: CLIConfig;
  verbose?: boolean;
}

/**
 * Create the CLI program
 */
export async function createProgram(options: ProgramOptions = {}): Promise<Command> {
  // Load configuration
  const config = options.config || (await loadConfig());

  const program = new Command();

  program
    .name('libertas')
    .description('Secure credentials management system')
    .version('1.0.0')
    .option('-v, --verbose', 'Enable verbose output')
    .option('--env <environment>', 'Set environment')
    .option('--storage-path <path>', 'Set storage path')
    .option('--master-key <key>', 'Set master key');

  // Init command (setup wizard)
  program
    .command('init')
    .description('Initialize libertas and set up project-specific or global configuration')
    .option('-g, --global', 'Set up global (user-wide) configuration instead of project-specific')
    .action(async (cmdOptions) => {
      try {
        await initCommand(cmdOptions.global === true);
      } catch (error) {
        console.error(Formatter.error(error instanceof Error ? error.message : 'Unknown error'));
        process.exit(1);
      }
    });

  // Dump command (export to .env)
  program
    .command('dump')
    .argument('[scope]', 'Credential scope (default: default)')
    .description('Dump credentials to secure .env file with permissions and gitignore handling')
    .option('-o, --output <path>', 'Output file path (default: .env)')
    .option('-f, --force', 'Overwrite existing .env file')
    .action(async (scope, cmdOptions) => {
      try {
        await dumpCommand({
          scope: scope || 'default',
          output: cmdOptions.output,
          force: cmdOptions.force,
        });
      } catch (error) {
        console.error(Formatter.error(error instanceof Error ? error.message : 'Unknown error'));
        process.exit(1);
      }
    });

  // Verify dump command
  program
    .command('verify-dump')
    .description('Verify .env file integrity and security')
    .option('-o, --output <path>', 'Output file path (default: .env)')
    .action(async (cmdOptions) => {
      try {
        console.log(Formatter.header('🔍 Verifying .env file\n'));
        const isValid = await verifyDumpFile(cmdOptions.output);
        if (!isValid) {
          process.exit(1);
        }
        console.log(Formatter.success('\n✓ All checks passed!\n'));
      } catch (error) {
        console.error(Formatter.error(error instanceof Error ? error.message : 'Unknown error'));
        process.exit(1);
      }
    });

  // Cleanup dump command
  program
    .command('cleanup-dump')
    .description('Securely delete .env file')
    .option('-o, --output <path>', 'Output file path (default: .env)')
    .action(async (cmdOptions) => {
      try {
        console.log(Formatter.header('🧹 Cleaning up .env file\n'));
        await cleanupDumpFile(cmdOptions.output);
        console.log(Formatter.success('\n✓ Cleanup complete!\n'));
      } catch (error) {
        console.error(Formatter.error(error instanceof Error ? error.message : 'Unknown error'));
        process.exit(1);
      }
    });

  // Run command (inject credentials and execute)
  program
    .command('run')
    .argument('[scope]', 'Credential scope (auto-detected if not provided)')
    .argument('[command...]', 'Command and arguments to execute')
    .description('Execute command with injected credentials as environment variables')
    .option('-v, --verbose', 'Show detailed output')
    .usage('[scope] -- <command> [args...]')
    .allowUnknownOption()
    .action(async (scope: string | undefined, command: string[], cmdOptions: any) => {
      try {
        // If command is empty, try to extract from process.argv after --
        let args = command;
        if (!args || args.length === 0) {
          const doubleMinusIndex = process.argv.indexOf('--');
          if (doubleMinusIndex !== -1) {
            args = process.argv.slice(doubleMinusIndex + 1);
          }
        }

        if (!args || args.length === 0) {
          throw new Error('No command specified. Usage: libertas run [scope] -- <command> [args...]');
        }

        await runCommand({
          scope,
          verbose: cmdOptions.verbose,
          args,
        });
      } catch (error) {
        console.error(Formatter.error(error instanceof Error ? error.message : 'Unknown error'));
        process.exit(1);
      }
    });

  // Get command
  program
    .command('get')
    .argument('<key>', 'Credential key to retrieve')
    .description('Retrieve credentials')
    .option('-m, --mask', 'Mask sensitive values')
    .action(async (key, cmdOptions) => {
      try {
        const cli = await CredentialsCLI.fromConfig(config);
        const result = await cli.execute('get', { key });

        if (!result.success) {
          console.error(Formatter.error(result.error || 'Unknown error'));
          process.exit(1);
        }

        console.log(Formatter.success(`Retrieved credentials: ${key}`));

        let displayed = result.data;
        if (cmdOptions.mask) {
          const { maskCredentials } = await import('@libertas/core');
          displayed = maskCredentials(result.data);
        }

        console.log(Formatter.json(displayed));
      } catch (error) {
        console.error(Formatter.error(error instanceof Error ? error.message : 'Unknown error'));
        process.exit(1);
      }
    });

  // Set command
  program
    .command('set')
    .argument('<key>', 'Credential key')
    .argument('<path>', 'Path to credential value (e.g., database.host)')
    .argument('<value>', 'Value to set')
    .description('Set a credential value')
    .action(async (key, path, value, cmdOptions) => {
      try {
        const cli = await CredentialsCLI.fromConfig(config);
        const result = await cli.execute('set', { key, path, value });

        if (!result.success) {
          console.error(Formatter.error(result.error || 'Unknown error'));
          process.exit(1);
        }

        console.log(Formatter.success(result.message || 'Credential updated'));
        if (cmdOptions.verbose) {
          console.log(Formatter.json(result.data));
        }
      } catch (error) {
        console.error(Formatter.error(error instanceof Error ? error.message : 'Unknown error'));
        process.exit(1);
      }
    });

  // Edit command
  program
    .command('edit')
    .argument('<key>', 'Credential key to edit')
    .description('Edit entire credential set')
    .option('-f, --file <path>', 'Load credentials from JSON file')
    .action(async (key, cmdOptions) => {
      try {
        let credentials: any;

        if (cmdOptions.file) {
          const fs = await import('node:fs/promises');
          const content = await fs.readFile(cmdOptions.file, 'utf-8');
          credentials = JSON.parse(content);
        } else {
          // In interactive mode, this would prompt for input
          console.error(Formatter.warning('Use --file option to load credentials from JSON file'));
          process.exit(1);
        }

        const cli = await CredentialsCLI.fromConfig(config);
        const result = await cli.execute('edit', { key, credentials });

        if (!result.success) {
          console.error(Formatter.error(result.error || 'Unknown error'));
          process.exit(1);
        }

        console.log(Formatter.success(result.message || 'Credentials updated'));
      } catch (error) {
        console.error(Formatter.error(error instanceof Error ? error.message : 'Unknown error'));
        process.exit(1);
      }
    });

  // Delete command
  program
    .command('delete')
    .argument('<key>', 'Credential key to delete')
    .description('Delete credentials')
    .option('-f, --force', 'Skip confirmation')
    .action(async (key, cmdOptions) => {
      try {
        if (!cmdOptions.force) {
          console.warn(Formatter.warning(`About to delete: ${key}`));
          console.log('Use --force flag to skip confirmation');
          return;
        }

        const cli = await CredentialsCLI.fromConfig(config);
        const result = await cli.execute('delete', { key });

        if (!result.success) {
          console.error(Formatter.error(result.error || 'Unknown error'));
          process.exit(1);
        }

        console.log(Formatter.success(result.message || 'Credentials deleted'));
      } catch (error) {
        console.error(Formatter.error(error instanceof Error ? error.message : 'Unknown error'));
        process.exit(1);
      }
    });

  // List command
  program
    .command('list')
    .description('List all credential keys')
    .action(async () => {
      try {
        const cli = await CredentialsCLI.fromConfig(config);
        const result = await cli.execute('list');

        if (!result.success) {
          console.error(Formatter.error(result.error || 'Unknown error'));
          process.exit(1);
        }

        console.log(Formatter.success(result.message || 'Credentials retrieved'));

        if (result.data && Array.isArray(result.data) && result.data.length > 0) {
          console.log(Formatter.list(result.data));
        } else {
          console.log(Formatter.info('No credentials found'));
        }
      } catch (error) {
        console.error(Formatter.error(error instanceof Error ? error.message : 'Unknown error'));
        process.exit(1);
      }
    });

  // Show command
  program
    .command('show')
    .argument('<key>', 'Credential key to display')
    .description('Display credentials')
    .option('-m, --mask', 'Mask sensitive values')
    .action(async (key: string, cmdOptions: any) => {
      try {
        const cli = await CredentialsCLI.fromConfig(config);
        const result = await cli.execute('show', { key, mask: cmdOptions.mask });

        if (!result.success) {
          console.error(Formatter.error(result.error || 'Unknown error'));
          process.exit(1);
        }

        const maskLabel = cmdOptions.mask ? ' (masked)' : '';
        console.log(Formatter.success(`Credentials${maskLabel}`));
        console.log(Formatter.json(result.data));
      } catch (error) {
        console.error(Formatter.error(error instanceof Error ? error.message : 'Unknown error'));
        process.exit(1);
      }
    });

  // Validate command
  program
    .command('validate')
    .argument('<key>', 'Credential key to validate')
    .description('Validate credentials against schema')
    .option('-s, --schema <json>', 'Schema as JSON string')
    .option('-f, --file <path>', 'Load schema from JSON file')
    .action(async (key: string, cmdOptions: any) => {
      try {
        let schema: any;

        if (cmdOptions.schema) {
          schema = JSON.parse(cmdOptions.schema);
        } else if (cmdOptions.file) {
          const fs = await import('node:fs/promises');
          const content = await fs.readFile(cmdOptions.file, 'utf-8');
          schema = JSON.parse(content);
        } else {
          console.error(Formatter.error('Provide schema with --schema or --file option'));
          process.exit(1);
        }

        const cli = await CredentialsCLI.fromConfig(config);
        const result = await cli.execute('validate', { key, schema });

        if (result.data.valid) {
          console.log(Formatter.success('Credentials are valid'));
        } else {
          console.log(Formatter.error('Validation failed'));
          console.log(Formatter.list(result.data.errors));
          process.exit(1);
        }
      } catch (error) {
        console.error(Formatter.error(error instanceof Error ? error.message : 'Unknown error'));
        process.exit(1);
      }
    });

  // Open in editor command
  program
    .command('open')
    .argument('<name>', 'Credential name to edit')
    .alias('editor')
    .description('Edit credentials in your favorite editor (Rails-style)')
    .option('-s, --scope <scope>', 'Credential scope (e.g., production, staging, development)')
    .option('-e, --editor <editor>', 'Editor to use (overrides $EDITOR)')
    .option('--no-create', "Don't create if credentials don't exist")
    .action(async (name: string, cmdOptions: any) => {
      try {
        const cli = await CredentialsCLI.fromConfig(config);
        const result = await cli.execute('editor', {
          name,
          scope: cmdOptions.scope,
          editor: cmdOptions.editor,
          create: cmdOptions.create !== false,
        });

        if (!result.success) {
          console.error(Formatter.error(result.error || 'Unknown error'));
          process.exit(1);
        }

        console.log(Formatter.success(result.message || 'Credentials saved'));
      } catch (error) {
        console.error(Formatter.error(error instanceof Error ? error.message : 'Unknown error'));
        process.exit(1);
      }
    });

  return program;
}

export default createProgram;
