const fs = require('fs');
const path = require('path');

// Mock console methods to avoid noise during tests
const originalConsole = { ...console };

beforeAll(() => {
  console.log = jest.fn();
  console.error = jest.fn();
  process.env.NODE_ENV = 'test';
});

afterAll(() => {
  Object.assign(console, originalConsole);
  delete process.env.NODE_ENV;
});

describe('Server Entry Point', () => {
  let originalVersionData;
  const versionPath = path.join(__dirname, '../version.json');

  beforeEach(() => {
    // Backup original version.json
    if (fs.existsSync(versionPath)) {
      originalVersionData = fs.readFileSync(versionPath, 'utf8');
    }
    
    // Clear require cache
    delete require.cache[require.resolve('../index.js')];
    delete require.cache[require.resolve('../app.js')];
  });

  afterEach(() => {
    // Restore original version.json
    if (originalVersionData) {
      fs.writeFileSync(versionPath, originalVersionData);
    }
  });

  test('should handle invalid version.json gracefully', () => {
    // Create invalid JSON
    fs.writeFileSync(versionPath, '{"invalid": json}');
    
    // Since we're in test mode, loadVersionData should throw instead of calling process.exit
    expect(() => {
      require('../index.js');
    }).toThrow();
  });

  test('should handle missing version.json file', () => {
    // Remove version.json
    if (fs.existsSync(versionPath)) {
      fs.unlinkSync(versionPath);
    }
    
    // Should throw in test mode
    expect(() => {
      require('../index.js');
    }).toThrow();
  });

  test('should load dependencies successfully', () => {
    // Test that we can require the app modules
    expect(() => {
      const { createApp, loadVersionData } = require('../app');
      expect(typeof createApp).toBe('function');
      expect(typeof loadVersionData).toBe('function');
    }).not.toThrow();
  });
});