#!/usr/bin/env node

/**
 * Libertas CLI - Binary entry point
 */

import { createProgram } from '../program';

/**
 * Main CLI entry point
 */
async function main(): Promise<void> {
  try {
    const program = await createProgram();
    await program.parseAsync(process.argv);
  } catch (error) {
    console.error('Fatal error:', error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }
}

main();
