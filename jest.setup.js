// Jest setup file to mock localStorage for Node environment
// This prevents "Cannot initialize local storage without a --localstorage-file path" errors

// Mock localStorage (not used by tests but Jest tries to initialize it)
global.localStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn(),
};
