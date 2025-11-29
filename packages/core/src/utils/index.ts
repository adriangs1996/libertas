/**
 * Utility functions for libertas
 */

import { Credentials } from '../types';

/**
 * Deep merge two objects
 */
export function deepMerge(target: Credentials, source: Credentials): Credentials {
  const result = { ...target };

  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      const sourceValue = source[key];
      const targetValue = result[key];

      if (
        sourceValue !== null &&
        typeof sourceValue === 'object' &&
        !Array.isArray(sourceValue) &&
        targetValue !== null &&
        typeof targetValue === 'object' &&
        !Array.isArray(targetValue)
      ) {
        result[key] = deepMerge(targetValue as Credentials, sourceValue as Credentials);
      } else {
        result[key] = sourceValue;
      }
    }
  }

  return result;
}

/**
 * Get nested value from object using dot notation
 */
export function getNestedValue(obj: Credentials, path: string): any {
  const keys = path.split('.');
  let current: any = obj;

  for (const key of keys) {
    if (current === null || current === undefined) {
      return undefined;
    }
    current = current[key];
  }

  return current;
}

/**
 * Set nested value in object using dot notation
 */
export function setNestedValue(obj: Credentials, path: string, value: any): Credentials {
  const keys = path.split('.');
  const lastKey = keys.pop()!;
  let current: any = obj;

  for (const key of keys) {
    if (!(key in current)) {
      current[key] = {};
    }
    current = current[key];
  }

  current[lastKey] = value;
  return obj;
}

/**
 * Flatten nested object to dot notation
 */
export function flattenObject(obj: any, prefix = ''): Record<string, any> {
  const result: Record<string, any> = {};

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];
      const newKey = prefix ? `${prefix}.${key}` : key;

      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        Object.assign(result, flattenObject(value, newKey));
      } else {
        result[newKey] = value;
      }
    }
  }

  return result;
}

/**
 * Unflatten object from dot notation
 */
export function unflattenObject(obj: Record<string, any>): Credentials {
  const result: Credentials = {};

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      setNestedValue(result, key, obj[key]);
    }
  }

  return result;
}

/**
 * Check if all required keys exist in credentials
 */
export function hasRequiredKeys(credentials: Credentials, requiredKeys: string[]): boolean {
  return requiredKeys.every((key) => key in credentials && credentials[key] !== undefined);
}

/**
 * Mask sensitive values in credentials for logging
 */
export function maskCredentials(
  credentials: Credentials,
  sensitiveKeys: string[] = ['password', 'secret', 'token', 'api_key', 'apiKey']
): Credentials {
  const result = { ...credentials };
  const flattened = flattenObject(credentials);

  for (const key in flattened) {
    const lowerKey = key.toLowerCase();
    if (sensitiveKeys.some((sensitive) => lowerKey.includes(sensitive.toLowerCase()))) {
      const paths = key.split('.');
      setNestedValue(result, key, '***MASKED***');
    }
  }

  return result;
}

/**
 * Validate credentials against a schema
 */
export interface CredentialSchema {
  [key: string]: {
    required?: boolean;
    type?: 'string' | 'number' | 'boolean' | 'object';
    pattern?: RegExp;
  };
}

export function validateAgainstSchema(
  credentials: Credentials,
  schema: CredentialSchema
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  for (const [key, rules] of Object.entries(schema)) {
    const value = credentials[key];

    if (rules.required && (value === undefined || value === null)) {
      errors.push(`Missing required field: ${key}`);
      continue;
    }

    if (value !== undefined && value !== null && rules.type) {
      const actualType = Array.isArray(value) ? 'array' : typeof value;
      if (actualType !== rules.type) {
        errors.push(`Field ${key} should be ${rules.type}, got ${actualType}`);
      }
    }

    if (rules.pattern && typeof value === 'string' && !rules.pattern.test(value)) {
      errors.push(`Field ${key} does not match required pattern`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export default {
  deepMerge,
  getNestedValue,
  setNestedValue,
  flattenObject,
  unflattenObject,
  hasRequiredKeys,
  maskCredentials,
  validateAgainstSchema,
};
