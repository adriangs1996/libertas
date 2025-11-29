#!/usr/bin/env node

/**
 * Build script for @libertas/cli using esbuild
 */

import esbuild from 'esbuild';
import config from './esbuild.config.mjs';
import { chmod } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function build() {
  try {
    // Build with esbuild
    console.log('Building with esbuild...');
    await esbuild.build(config);

    // Make the binary executable
    const binPath = join(__dirname, config.outfile);
    await chmod(binPath, 0o755);
    console.log(`✓ Binary built and made executable: ${config.outfile}`);
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

build();
