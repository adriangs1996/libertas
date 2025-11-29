/**
 * Credentials CLI - main command handler
 */

import {
  CredentialsManager,
  createCredentialsBuilder,
  maskCredentials,
  validateAgainstSchema,
  type Credentials,
} from '@libertas/core';
import type { CLIConfig, CommandResult } from '../types';

export class CredentialsCLI {
  private manager: CredentialsManager;

  constructor(manager: CredentialsManager) {
    this.manager = manager;
  }

  /**
   * Create CLI instance from config
   */
  static async fromConfig(config: CLIConfig): Promise<CredentialsCLI> {
    const builder = createCredentialsBuilder();

    if (config.masterKey) {
      builder.withMasterKey(config.masterKey);
    } else {
      builder.withGeneratedMasterKey();
    }

    if (config.storagePath) {
      builder.withFileStorage(config.storagePath);
    } else {
      builder.withInMemoryStorage();
    }

    if (config.environment) {
      builder.withEnvironment(config.environment);
    }

    const manager = builder.build();
    return new CredentialsCLI(manager);
  }

  /**
   * Execute a command
   */
  async execute(command: string, args: Record<string, any> = {}): Promise<CommandResult> {
    try {
      switch (command) {
        case 'set':
          return await this.handleSet(args);
        case 'get':
          return await this.handleGet(args);
        case 'edit':
          return await this.handleEdit(args);
        case 'editor':
          return await this.handleEditor(args);
        case 'delete':
          return await this.handleDelete(args);
        case 'list':
          return await this.handleList();
        case 'show':
          return await this.handleShow(args);
        case 'validate':
          return await this.handleValidate(args);
        default:
          return {
            success: false,
            error: `Unknown command: ${command}`,
          };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Handle 'get' command - retrieve credentials
   */
  private async handleGet(args: Record<string, any>): Promise<CommandResult> {
    const { key } = args;

    if (!key) {
      return { success: false, error: 'Missing required argument: key' };
    }

    try {
      const credentials = await this.manager.load(key);
      return { success: true, data: credentials };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Handle 'set' command - set a specific credential value
   */
  private async handleSet(args: Record<string, any>): Promise<CommandResult> {
    const { key, path: keyPath, value } = args;

    if (!key) {
      return { success: false, error: 'Missing required argument: key' };
    }

    if (!keyPath) {
      return { success: false, error: 'Missing required argument: path' };
    }

    if (value === undefined) {
      return { success: false, error: 'Missing required argument: value' };
    }

    try {
      const updated = await this.manager.update(key, { [keyPath]: value });
      return {
        success: true,
        data: updated,
        message: `Updated credential: ${keyPath}`,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Handle 'edit' command - replace entire credential set
   */
  private async handleEdit(args: Record<string, any>): Promise<CommandResult> {
    const { key, credentials } = args;

    if (!key) {
      return { success: false, error: 'Missing required argument: key' };
    }

    if (!credentials || typeof credentials !== 'object') {
      return { success: false, error: 'Invalid credentials object' };
    }

    try {
      await this.manager.save(key, credentials);
      return {
        success: true,
        data: credentials,
        message: `Saved credentials: ${key}`,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Handle 'delete' command - remove credentials
   */
  private async handleDelete(args: Record<string, any>): Promise<CommandResult> {
    const { key } = args;

    if (!key) {
      return { success: false, error: 'Missing required argument: key' };
    }

    try {
      await this.manager.delete(key);
      return {
        success: true,
        message: `Deleted credentials: ${key}`,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Handle 'list' command - show all credential keys
   */
  private async handleList(): Promise<CommandResult> {
    try {
      const storage = this.manager['storageBackend'] as any;
      let keys: string[] = [];

      if (typeof storage.getAllKeys === 'function') {
        keys = await storage.getAllKeys();
      }

      return {
        success: true,
        data: keys,
        message: `Found ${keys.length} credential set(s)`,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Handle 'show' command - display credentials
   */
  private async handleShow(args: Record<string, any>): Promise<CommandResult> {
    const { key, mask } = args;

    if (!key) {
      return { success: false, error: 'Missing required argument: key' };
    }

    try {
      const credentials = await this.manager.load(key);

      let displayed = credentials;
      if (mask) {
        displayed = maskCredentials(credentials);
      }

      return {
        success: true,
        data: displayed,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Handle 'validate' command - validate credentials against schema
   */
  private async handleValidate(args: Record<string, any>): Promise<CommandResult> {
    const { key, schema } = args;

    if (!key) {
      return { success: false, error: 'Missing required argument: key' };
    }

    if (!schema || typeof schema !== 'object') {
      return { success: false, error: 'Invalid schema object' };
    }

    try {
      const credentials = await this.manager.load(key);
      const result = validateAgainstSchema(credentials, schema);

      return {
        success: result.valid,
        data: {
          valid: result.valid,
          errors: result.errors,
        },
        message: result.valid ? 'Credentials are valid' : 'Validation failed',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Handle 'editor' command - edit credentials in external editor
   */
  private async handleEditor(args: Record<string, any>): Promise<CommandResult> {
    const { name, scope, editor, create } = args;

    if (!name) {
      return { success: false, error: 'Missing required argument: name' };
    }

    try {
      const { launchEditor, objectToYAML, yamlToObject } = await import('../utils/editor');

      // Try to load existing credentials
      let existingCreds: Credentials = {};
      try {
        existingCreds = await this.manager.loadScoped(name, scope);
      } catch {
        if (!create) {
          return {
            success: false,
            error: `Credentials not found for ${scope ? `${name}.${scope}` : name}. Use --create to create new credentials.`,
          };
        }
        // Continue with empty credentials
      }

      // Convert to YAML for editing
      const yamlContent = objectToYAML(existingCreds);

      // Launch editor
      const editedContent = await launchEditor(yamlContent, { editor });

      // Parse edited YAML
      const editedCreds = yamlToObject(editedContent);

      // Save credentials
      await this.manager.saveScoped(name, editedCreds as Credentials, scope);

      const scopeLabel = scope ? ` (${scope})` : '';
      return {
        success: true,
        data: editedCreds,
        message: `Credentials for ${name}${scopeLabel} saved successfully`,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

export default CredentialsCLI;
