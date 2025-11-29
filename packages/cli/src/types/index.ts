/**
 * CLI type definitions
 */

export interface CLIConfig {
  masterKey?: string;
  storagePath?: string;
  environment?: string;
  verbose?: boolean;
}

export interface CommandResult {
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
}
