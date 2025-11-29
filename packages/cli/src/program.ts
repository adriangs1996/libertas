/**
 * Commander-based CLI program
 */

import { Command } from 'commander';
import { CredentialsCLI } from './commands/credentials-cli';
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

  // Get command
  program
    .command('get <key>')
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
    .command('set <key> <path> <value>')
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
    .command('edit <key>')
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
    .command('delete <key>')
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
    .command('show <key>')
    .description('Display credentials')
    .option('-m, --mask', 'Mask sensitive values')
    .action(async (key, cmdOptions) => {
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
    .command('validate <key>')
    .description('Validate credentials against schema')
    .option('-s, --schema <json>', 'Schema as JSON string')
    .option('-f, --file <path>', 'Load schema from JSON file')
    .action(async (key, cmdOptions) => {
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
    .command('open <name>')
    .alias('editor')
    .description('Edit credentials in your favorite editor (Rails-style)')
    .option('-s, --scope <scope>', 'Credential scope (e.g., production, staging, development)')
    .option('-e, --editor <editor>', 'Editor to use (overrides $EDITOR)')
    .option('--no-create', "Don't create if credentials don't exist")
    .action(async (name, cmdOptions) => {
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
