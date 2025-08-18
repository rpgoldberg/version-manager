# WSL Node.js and npm Environment Fix

## Problem
When using Windows Subsystem for Linux (WSL), npm and Node.js can have version compatibility and path issues.

## Solution: NVM (Node Version Manager)

### 1. Install NVM
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
```

### 2. Restart Terminal or Source Profile
```bash
source ~/.bashrc
```

### 3. Install Recommended Node.js Version
```bash
nvm install 20.11.1
nvm use 20.11.1
```

### 4. Verify Installation
```bash
node --version
npm --version
```

## Troubleshooting
- Ensure NVM is sourced in your `.bashrc`
- Use `nvm ls` to see installed Node.js versions
- If issues persist, reinstall NVM and Node.js

## Testing
Run tests with:
```bash
NODE_OPTIONS=--experimental-vm-modules npx jest
```

## Notes
- This solution isolates Node.js versions
- Prevents Windows/Linux path conflicts
- Provides consistent development environment