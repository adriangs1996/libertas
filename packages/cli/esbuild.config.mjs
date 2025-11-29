import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default {
  entryPoints: ['src/bin/cli.ts'],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  outfile: 'dist/bin/cli.js',
  // Mark native modules and dependencies as external
  external: [
    'commander',
    'chalk',
    'cross-keychain',
    '@napi-rs/keyring',
    '@napi-rs/keyring-darwin-arm64',
    '@napi-rs/keyring-darwin-x64',
    '@napi-rs/keyring-linux-x64-gnu',
    '@napi-rs/keyring-linux-x64-musl',
    '@napi-rs/keyring-win32-x64-msvc',
    '@napi-rs/keyring-win32-ia32-msvc',
    '@napi-rs/keyring-win32-arm64-msvc',
  ],
  target: 'node18',
  sourcemap: true,
  minify: false,
  alias: {
    '@libertas/core': join(__dirname, '../core/dist/index.js'),
  },
};
