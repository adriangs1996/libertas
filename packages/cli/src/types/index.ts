/**
 * CLI type definitions
 */

export interface EnvironmentConfig {
  /**
   * Storage path for this specific environment
   * Overrides the root-level storagePath if set
   */
  storagePath?: string;
  /**
   * Master key for this specific environment
   * Typically stored in system keychain, not in config file
   */
  masterKey?: string;
}

export interface CLIConfig {
  projectName?: string;
  masterKey?: string;
  storagePath?: string;
  /**
   * Currently active environment
   * Determined at runtime from: LIBERTAS_ENV > NODE_ENV > RAILS_ENV > defaultEnvironment > 'development'
   * Set by config-loader based on environment detection
   */
  environment?: string;
  /**
   * Default environment to use when LIBERTAS_ENV, NODE_ENV, RAILS_ENV are not set
   * Only used in .libertasrc config file
   * Priority for environment detection: LIBERTAS_ENV > NODE_ENV > RAILS_ENV > defaultEnvironment > 'development'
   */
  defaultEnvironment?: string;
  verbose?: boolean;
  /**
   * Environment-specific configurations
   * Allows managing multiple scopes (dev, staging, production) in one .libertasrc
   * Key is the environment name, value contains environment-specific settings
   */
  environments?: Record<string, EnvironmentConfig>;
}

export interface CommandResult {
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
}
