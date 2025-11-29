/**
 * Editor utility for editing credentials in external editor
 */

import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

export interface EditorOptions {
  editor?: string;
  timeout?: number;
}

/**
 * Launch external editor and wait for completion
 */
export async function launchEditor(initialContent: string, options: EditorOptions = {}): Promise<string> {
  const editor = options.editor || process.env.EDITOR || 'nano';
  const timeout = options.timeout || 30000; // 30 seconds default

  // Create temporary file
  const tmpDir = os.tmpdir();
  const tmpFile = path.join(tmpDir, `libertas-edit-${Date.now()}.yml`);

  try {
    // Write initial content to temp file
    await fs.writeFile(tmpFile, initialContent, 'utf-8');

    // Launch editor
    await openEditor(editor, tmpFile, timeout);

    // Read edited content
    const editedContent = await fs.readFile(tmpFile, 'utf-8');

    return editedContent;
  } finally {
    // Clean up temp file
    try {
      await fs.unlink(tmpFile);
    } catch {
      // Ignore cleanup errors
    }
  }
}

/**
 * Open editor and wait for it to close
 */
function openEditor(editor: string, filePath: string, timeout: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const editorProcess = spawn(editor, [filePath], {
      stdio: 'inherit',
      shell: true,
    });

    // Set timeout
    const timeoutHandle = setTimeout(() => {
      editorProcess.kill();
      reject(new Error(`Editor timeout after ${timeout}ms`));
    }, timeout);

    editorProcess.on('close', (code) => {
      clearTimeout(timeoutHandle);

      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Editor exited with code ${code}`));
      }
    });

    editorProcess.on('error', (error) => {
      clearTimeout(timeoutHandle);
      reject(new Error(`Failed to launch editor "${editor}": ${error.message}`));
    });
  });
}

/**
 * Convert object to YAML format (simple implementation)
 */
export function objectToYAML(obj: any, indent = 0): string {
  const lines: string[] = [];
  const prefix = '  '.repeat(indent);

  if (obj === null || obj === undefined) {
    return '';
  }

  if (typeof obj !== 'object' || Array.isArray(obj)) {
    return JSON.stringify(obj);
  }

  for (const [key, value] of Object.entries(obj)) {
    if (value === null || value === undefined) {
      lines.push(`${prefix}${key}:`);
    } else if (typeof value === 'object' && !Array.isArray(value)) {
      lines.push(`${prefix}${key}:`);
      lines.push(objectToYAML(value, indent + 1));
    } else if (Array.isArray(value)) {
      lines.push(`${prefix}${key}:`);
      value.forEach((item) => {
        if (typeof item === 'object') {
          lines.push(`${prefix}  -`);
          lines.push(objectToYAML(item, indent + 2));
        } else {
          lines.push(`${prefix}  - ${JSON.stringify(item)}`);
        }
      });
    } else if (typeof value === 'string' && /[:\n]/.test(value)) {
      // Quote strings with special characters
      lines.push(`${prefix}${key}: ${JSON.stringify(value)}`);
    } else {
      lines.push(`${prefix}${key}: ${JSON.stringify(value)}`);
    }
  }

  return lines.join('\n');
}

/**
 * Parse YAML format (simple implementation)
 * Only supports basic key-value pairs for security
 */
export function yamlToObject(yamlContent: string): any {
  const obj: any = {};
  const lines = yamlContent.split('\n');
  let currentLevel = obj;
  const stack: Array<{ obj: any; indent: number }> = [{ obj, indent: -1 }];

  for (let line of lines) {
    // Remove comments
    line = line.split('#')[0].trimEnd();

    if (!line.trim()) {
      continue;
    }

    const indent = line.search(/\S/);
    const content = line.trim();

    // Check if line is a key-value pair or just a key
    const match = content.match(/^(.+?):\s*(.*?)$/);

    if (!match) {
      continue;
    }

    const key = match[1].trim();
    const value = match[2].trim();

    // Pop stack to correct indent level
    while (stack.length > 1 && stack[stack.length - 1].indent >= indent) {
      stack.pop();
    }

    const currentObj = stack[stack.length - 1].obj;

    if (!value) {
      // This is a nested object
      const nestedObj: any = {};
      currentObj[key] = nestedObj;
      stack.push({ obj: nestedObj, indent });
    } else {
      // Parse the value
      currentObj[key] = parseYAMLValue(value);
    }
  }

  return obj;
}

/**
 * Parse YAML value to appropriate type
 */
function parseYAMLValue(value: string): any {
  if (value === 'null') return null;
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (/^\d+$/.test(value)) return parseInt(value, 10);
  if (/^\d+\.\d+$/.test(value)) return parseFloat(value);

  // Remove quotes if present
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1);
  }

  return value;
}

export default {
  launchEditor,
  objectToYAML,
  yamlToObject,
};
