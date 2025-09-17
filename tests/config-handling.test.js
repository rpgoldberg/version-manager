const fs = require('fs');
const path = require('path');
const request = require('supertest');
const { createApp, loadVersionData } = require('../app');
const os = require('os');

// Mock console methods to avoid noise during tests
const originalConsole = { ...console };
const originalExit = process.exit;

beforeAll(() => {
  console.log = jest.fn();
  console.error = jest.fn();
  process.exit = jest.fn();
  process.env.NODE_ENV = 'test';
});

afterAll(() => {
  Object.assign(console, originalConsole);
  process.exit = originalExit;
  delete process.env.NODE_ENV;
});

describe('Configuration File Handling', () => {
  // Use a temporary test file instead of production version.json
  const testVersionPath = path.join(os.tmpdir(), `test-version-${Date.now()}.json`);
  const testFixturePath = path.join(__dirname, 'fixtures/test-version-config.json');
  let app;

  beforeEach(() => {
    // Set environment variable to use test file
    process.env.VERSION_JSON_PATH = testVersionPath;

    // Copy test fixture to temp location for this test
    if (fs.existsSync(testFixturePath)) {
      const fixtureData = fs.readFileSync(testFixturePath, 'utf8');
      fs.writeFileSync(testVersionPath, fixtureData);
    }
  });

  afterEach(() => {
    // Clean up test file
    if (fs.existsSync(testVersionPath)) {
      fs.unlinkSync(testVersionPath);
    }

    // Clear environment variable
    delete process.env.VERSION_JSON_PATH;

    // Clear mocks
    jest.clearAllMocks();
  });

  describe('Valid JSON Configuration', () => {
    test('should load valid version.json successfully', () => {
      // The original file should be valid
      expect(() => {
        const versionData = loadVersionData();
        app = createApp(versionData);
      }).not.toThrow();
    });

    test('should handle complete valid configuration structure', () => {
      const validConfig = {
        application: {
          name: 'test-app',
          version: '2.0.0',
          releaseDate: '01-Jan-2025',
          description: 'Test application'
        },
        services: {
          backend: { name: 'test-backend', version: '2.0.0' },
          frontend: { name: 'test-frontend', version: '2.0.0' }
        },
        dependencies: {
          backend: { scraper: '^2.0.0' },
          frontend: { backend: '^2.0.0' }
        },
        compatibility: {
          testedCombinations: [
            {
              backend: '2.0.0',
              frontend: '2.0.0',
              scraper: '2.0.0',
              verified: '01-Jan-2025'
            }
          ]
        }
      };

      fs.writeFileSync(testVersionPath, JSON.stringify(validConfig, null, 2));
      
      expect(() => {
        const versionData = loadVersionData();
        app = createApp(versionData);
      }).not.toThrow();
    });
  });

  describe('Invalid JSON Configuration', () => {
    test('should handle malformed JSON gracefully', () => {
      const malformedJson = '{"application": {"name": "test", invalid json}';
      fs.writeFileSync(testVersionPath, malformedJson);
      
      expect(() => {
        loadVersionData();
      }).toThrow();
    });

    test('should handle empty JSON file', () => {
      fs.writeFileSync(testVersionPath, '');
      
      expect(() => {
        loadVersionData();
      }).toThrow();
    });

    test('should handle JSON with invalid structure', () => {
      const invalidStructure = { invalid: 'structure' };
      fs.writeFileSync(testVersionPath, JSON.stringify(invalidStructure));
      
      // This should still load but endpoints might fail
      expect(() => {
        const versionData = loadVersionData();
        app = createApp(versionData);
      }).not.toThrow();
    });
  });

  describe('Missing Configuration File', () => {
    test('should handle missing version.json file', () => {
      // Remove the file
      if (fs.existsSync(testVersionPath)) {
        fs.unlinkSync(testVersionPath);
      }
      
      expect(() => {
        loadVersionData();
      }).toThrow();
    });
  });

  describe('Endpoints with Invalid Configuration', () => {
    test('should return 500 for /app-version when application data is missing', async () => {
      const configWithoutApp = {
        services: { backend: { name: 'test' } }
      };
      fs.writeFileSync(testVersionPath, JSON.stringify(configWithoutApp));
      
      const versionData = loadVersionData();
      app = createApp(versionData);
      
      const response = await request(app).get('/app-version');
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error', 'Version data not available');
    });

    test('should return 500 for /validate-versions when compatibility data is missing', async () => {
      const configWithoutCompatibility = {
        application: { name: 'test', version: '1.0.0' }
      };
      fs.writeFileSync(testVersionPath, JSON.stringify(configWithoutCompatibility));
      
      const versionData = loadVersionData();
      app = createApp(versionData);
      
      const response = await request(app)
        .get('/validate-versions')
        .query({ backend: '1.0.0', frontend: '1.0.0', scraper: '1.0.0' });
      
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error', 'Compatibility data not available');
    });

    test('should handle missing dependencies section gracefully', async () => {
      const configWithoutDependencies = {
        application: { name: 'test', version: '1.0.0' },
        compatibility: { testedCombinations: [] }
      };
      fs.writeFileSync(testVersionPath, JSON.stringify(configWithoutDependencies));
      
      const versionData = loadVersionData();
      app = createApp(versionData);
      
      const response = await request(app)
        .get('/validate-versions')
        .query({ backend: '1.0.0', frontend: '1.0.0', scraper: '1.0.0' });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('valid', true);
      expect(response.body).toHaveProperty('status', 'compatible');
    });

    test('should handle missing testedCombinations array', async () => {
      const configWithoutTestedCombos = {
        application: { name: 'test', version: '1.0.0' },
        compatibility: {},
        dependencies: {}
      };
      fs.writeFileSync(testVersionPath, JSON.stringify(configWithoutTestedCombos));
      
      const versionData = loadVersionData();
      app = createApp(versionData);
      
      const response = await request(app)
        .get('/validate-versions')
        .query({ backend: '1.0.0', frontend: '1.0.0', scraper: '1.0.0' });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('valid');
    });
  });

  describe('Health endpoint with invalid configuration', () => {
    test('should show loaded version data in health check', async () => {
      // Create config that loads but has missing data
      const invalidConfig = { invalid: 'data' };
      fs.writeFileSync(testVersionPath, JSON.stringify(invalidConfig));
      
      const versionData = loadVersionData();
      app = createApp(versionData);
      
      const response = await request(app).get('/health');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('versionData', 'loaded');
    });
  });
});