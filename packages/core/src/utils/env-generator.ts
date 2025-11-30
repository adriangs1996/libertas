/**
 * Environment file generator
 * Converts credentials object to .env format
 */

import type { Credentials } from '../types';

/**
 * Convert credentials object to .env format string
 * Handles nested objects by flattening with underscore notation
 */
export function credentialsToEnv(credentials: Credentials, prefix: string = ''): string {
  const lines: string[] = [];

  function addEntry(key: string, value: any, currentPrefix: string = ''): void {
    const fullKey = currentPrefix ? `${currentPrefix}_${key}`.toUpperCase() : key.toUpperCase();

    if (value === null || value === undefined) {
      return;
    }

    if (typeof value === 'object' && !Array.isArray(value)) {
      // Recursively handle nested objects
      for (const [nestedKey, nestedValue] of Object.entries(value)) {
        addEntry(nestedKey, nestedValue, fullKey);
      }
    } else if (Array.isArray(value)) {
      // Convert arrays to JSON string
      lines.push(`${fullKey}=${JSON.stringify(value)}`);
    } else {
      // Handle primitives
      const stringValue = String(value);
      // Quote if contains spaces, special characters, or quotes
      if (needsQuoting(stringValue)) {
        lines.push(`${fullKey}="${escapeValue(stringValue)}"`);
      } else {
        lines.push(`${fullKey}=${stringValue}`);
      }
    }
  }

  // Process each credential entry
  for (const [key, value] of Object.entries(credentials)) {
    const prefixWithUnderscore = prefix ? prefix.toUpperCase().replace(/_$/, '') : '';
    addEntry(key, value, prefixWithUnderscore);
  }

  return lines.join('\n') + (lines.length > 0 ? '\n' : '');
}

/**
 * Check if a value needs quoting in .env file
 */
function needsQuoting(value: string): boolean {
  // Quote if contains spaces, special chars, or quotes
  return /[\s"'=\\`$]/.test(value) || value.length === 0;
}

/**
 * Escape special characters in .env values
 */
function escapeValue(value: string): string {
  return value
    .replace(/\\/g, '\\\\') // Escape backslashes first
    .replace(/"/g, '\\"') // Escape double quotes
    .replace(/\$/g, '\\$') // Escape dollar signs
    .replace(/`/g, '\\`'); // Escape backticks
}

/**
 * Parse .env format string back to object (for testing/validation)
 */
export function envToCredentials(envContent: string): Credentials {
  const result: Credentials = {};

  const lines = envContent.split('\n');
  for (const line of lines) {
    // Skip empty lines and comments
    if (!line.trim() || line.trim().startsWith('#')) {
      continue;
    }

    const eqIndex = line.indexOf('=');
    if (eqIndex === -1) {
      continue;
    }

    const key = line.substring(0, eqIndex).trim();
    let value = line.substring(eqIndex + 1).trim();

    // Remove surrounding quotes
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.substring(1, value.length - 1);
      // Unescape special characters
      value = value
        .replace(/\\"/g, '"')
        .replace(/\\\\/g, '\\')
        .replace(/\\\$/g, '$')
        .replace(/\\`/g, '`');
    }

    // Try to parse JSON arrays
    if (value.startsWith('[') && value.endsWith(']')) {
      try {
        result[key] = JSON.parse(value);
        continue;
      } catch {
        // Keep as string if not valid JSON
      }
    }

    result[key] = value;
  }

  return result;
}
