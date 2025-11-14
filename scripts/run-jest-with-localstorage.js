#!/usr/bin/env node

/**
 * Jest launcher with conditional localStorage file support for Node 25+
 *
 * This script:
 * 1. Ensures the localStorage directory exists (via pretest)
 * 2. Probes whether Node supports --localstorage-file flag
 * 3. Conditionally adds the flag if supported
 * 4. Spawns Jest with all CLI arguments forwarded
 * 5. Exits with Jest's exit code
 */

const { spawn, spawnSync } = require('child_process');
const path = require('path');

/**
 * Check if current Node version supports --localstorage-file flag
 * @returns {boolean} true if flag is supported
 */
function supportsLocalStorageFlag() {
  try {
    // Try to run node with the flag to see if it's accepted
    const result = spawnSync(process.execPath, ['--localstorage-file=/tmp/test.db', '--help'], {
      stdio: 'pipe',
      timeout: 3000
    });

    // If the process exits with an error code or stderr contains "bad option", flag is not supported
    if (result.error) {
      return false;
    }

    const stderr = result.stderr?.toString() || '';
    if (stderr.includes('bad option') || stderr.includes('unrecognized flag')) {
      return false;
    }

    return true;
  } catch (error) {
    // If probe fails, assume flag is not supported
    return false;
  }
}

/**
 * Launch Jest with conditional localStorage file flag
 */
function launchJest() {
  // Build Node arguments
  const nodeArgs = [];

  // Add localStorage flag if supported by current Node version
  if (supportsLocalStorageFlag()) {
    const localStorageFile = path.join(__dirname, '..', '.tmp', 'localstorage', 'storage.sqlite');
    nodeArgs.push(`--localstorage-file=${localStorageFile}`);
  }

  // Path to Jest binary
  const jestBin = require.resolve('jest/bin/jest');
  nodeArgs.push(jestBin);

  // Forward all CLI arguments from npm (process.argv.slice(2))
  const jestArgs = process.argv.slice(2);

  // Spawn Jest with Node
  const jest = spawn(process.execPath, [...nodeArgs, ...jestArgs], {
    stdio: 'inherit',
    env: process.env
  });

  // Forward Jest's exit code
  jest.on('exit', (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
    } else {
      process.exit(code || 0);
    }
  });

  // Handle errors
  jest.on('error', (error) => {
    console.error('Failed to start Jest:', error);
    process.exit(1);
  });
}

// Run the launcher
launchJest();
