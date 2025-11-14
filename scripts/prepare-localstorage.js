#!/usr/bin/env node

/**
 * Prepare localStorage directory for Node 25+
 *
 * Node 25 requires a localStorage file path to be configured.
 * This script creates the necessary directory structure for local development.
 */

const fs = require('fs');
const path = require('path');

const localStorageDir = path.join(__dirname, '..', '.tmp', 'localstorage');

// Create directory if it doesn't exist
if (!fs.existsSync(localStorageDir)) {
  fs.mkdirSync(localStorageDir, { recursive: true });
  console.log(`Created localStorage directory: ${localStorageDir}`);
} else {
  console.log(`localStorage directory already exists: ${localStorageDir}`);
}

// Create empty storage.sqlite file if it doesn't exist
const storageFile = path.join(localStorageDir, 'storage.sqlite');
if (!fs.existsSync(storageFile)) {
  fs.writeFileSync(storageFile, '');
  console.log(`Created localStorage file: ${storageFile}`);
} else {
  console.log(`localStorage file already exists: ${storageFile}`);
}
