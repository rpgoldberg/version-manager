const request = require('supertest');
const fs = require('fs');
const path = require('path');
const { createApp, loadVersionData } = require('../app');
const ServiceRegistry = require('../service-registry');

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

describe('Version Service', () => {
  let app;
  let originalVersionData;

  beforeEach(() => {
    // Backup original version.json content
    const versionPath = path.join(__dirname, '../version.json');
    if (fs.existsSync(versionPath)) {
      originalVersionData = fs.readFileSync(versionPath, 'utf8');
    }
  });

  afterEach(() => {
    // Restore original version.json if it existed
    if (originalVersionData) {
      const versionPath = path.join(__dirname, '../version.json');
      fs.writeFileSync(versionPath, originalVersionData);
    }
    jest.clearAllMocks();
  });

  describe('Health Check Endpoints', () => {
    beforeEach(() => {
      const versionData = loadVersionData();
      app = createApp(versionData);
    });

    test('GET / should return healthy status', async () => {
      const response = await request(app).get('/');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('service', 'version-service');
      expect(response.body).toHaveProperty('timestamp');
      expect(new Date(response.body.timestamp)).toBeInstanceOf(Date);
    });

    test('GET /health should return detailed health status', async () => {
      const response = await request(app).get('/health');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('service', 'version-service');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('versionData', 'loaded');
      expect(new Date(response.body.timestamp)).toBeInstanceOf(Date);
    });
  });

  describe('App Version Endpoint', () => {
    beforeEach(() => {
      const versionData = loadVersionData();
      app = createApp(versionData);
    });

    test('GET /app-version should return application version info', async () => {
      const response = await request(app).get('/app-version');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('name', 'figure-collector-version-service');
      expect(response.body).toHaveProperty('version', '1.0.0');
      expect(response.body).toHaveProperty('releaseDate', '19-Aug-2024');
      expect(response.body).toHaveProperty('description', 'Lightweight version management service for Figure Collector');
    });
  });

  describe('Version Info Endpoint', () => {
    beforeEach(() => {
      const versionData = loadVersionData();
      app = createApp(versionData);
    });

    test('GET /version-info should return complete version data', async () => {
      const response = await request(app).get('/version-info');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('application');
      expect(response.body).toHaveProperty('services');
      expect(response.body).toHaveProperty('dependencies');
      expect(response.body).toHaveProperty('compatibility');
      
      // Verify structure of application data
      expect(response.body.application).toHaveProperty('name');
      expect(response.body.application).toHaveProperty('version');
      expect(response.body.application).toHaveProperty('releaseDate');
      
      // Verify services structure
      expect(response.body.services).toHaveProperty('backend');
      expect(response.body.services).toHaveProperty('frontend');
      expect(response.body.services).toHaveProperty('scraper');
    });
  });

  describe('Version Validation Endpoint', () => {
    beforeEach(() => {
      const versionData = loadVersionData();
      app = createApp(versionData);
    });

    test('GET /validate-versions should validate tested combinations', async () => {
      const response = await request(app)
        .get('/validate-versions')
        .query({
          backend: '1.0.0',
          frontend: '1.0.0',
          scraper: '1.0.0'
        });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('valid', true);
      expect(response.body).toHaveProperty('status', 'tested');
      expect(response.body).toHaveProperty('verified', '19-Aug-2024');
      expect(response.body).toHaveProperty('message', 'This service combination has been tested and verified');
    });

    test('GET /validate-versions should handle compatible but untested combinations', async () => {
      const response = await request(app)
        .get('/validate-versions')
        .query({
          backend: '1.0.0',
          frontend: '1.0.0',
          scraper: '1.0.0' // This will match exactly, so let's use different versions
        });
      
      // Let's test with a different combination that's not in tested combinations
      const response2 = await request(app)
        .get('/validate-versions')
        .query({
          backend: '1.1.0',
          frontend: '1.1.0',
          scraper: '1.1.0'
        });
      
      expect(response2.status).toBe(200);
      expect(response2.body).toHaveProperty('valid');
      expect(response2.body).toHaveProperty('status');
      expect(response2.body).toHaveProperty('warnings');
      expect(Array.isArray(response2.body.warnings)).toBe(true);
    });

    test('GET /validate-versions should detect version mismatches', async () => {
      const response = await request(app)
        .get('/validate-versions')
        .query({
          backend: '2.0.0',
          frontend: '1.0.0',
          scraper: '2.0.0'
        });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('valid', false);
      expect(response.body).toHaveProperty('status', 'warning');
      expect(response.body.warnings.length).toBeGreaterThan(0);
      expect(response.body).toHaveProperty('message', 'Service versions may have compatibility issues');
    });

    test('GET /validate-versions should handle missing query parameters', async () => {
      const response = await request(app)
        .get('/validate-versions');
      
      expect(response.status).toBe(200);
      // Should handle undefined values gracefully
    });

    test('GET /validate-versions should handle empty query parameters', async () => {
      const response = await request(app)
        .get('/validate-versions')
        .query({
          backend: '',
          frontend: '',
          scraper: ''
        });
      
      expect(response.status).toBe(200);
      // Should handle empty strings gracefully
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      // Reset mocks before each test
      jest.clearAllMocks();
    });

    test('loadVersionData should handle file read errors', () => {
      // Mock fs.readFileSync to throw an error
      const mockReadFileSync = jest.spyOn(fs, 'readFileSync').mockImplementation(() => {
        throw new Error('File read error');
      });

      // Set NODE_ENV to test to prevent process.exit
      process.env.NODE_ENV = 'test';

      expect(() => {
        loadVersionData('/path/to/nonexistent/version.json');
      }).toThrow('File read error');

      mockReadFileSync.mockRestore();
    });

    test('loadVersionData logs and exits when version.json loading fails (non-test env)', () => {
      // Mock console.error and process.exit
      const originalError = console.error;
      const mockConsoleError = jest.fn();
      console.error = mockConsoleError;

      const mockReadFileSync = jest.spyOn(fs, 'readFileSync').mockImplementation(() => {
        throw new Error('Version file not found');
      });

      // Reset NODE_ENV
      delete process.env.NODE_ENV;

      // Use spyOn to prevent process.exit
      const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {});

      expect(() => {
        loadVersionData();
      }).toThrow();

      expect(mockConsoleError).toHaveBeenCalledWith('Failed to load version.json:', expect.any(String));
      expect(mockExit).toHaveBeenCalledWith(1);

      // Restore the original implementation
      mockExit.mockRestore();

      // Restore mocks
      mockReadFileSync.mockRestore();
      console.error = originalError;
    });

    test('index.js handles signal termination gracefully', () => {
      // Spy on process methods
      const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {});
      const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});
      const mockListen = jest.fn();

      // Mock the app.listen to prevent server from actually starting
      const { createApp } = require('../app');
      jest.doMock('../app', () => ({
        ...jest.requireActual('../app'),
        createApp: () => ({ listen: mockListen })
      }));

      // Remove existing listeners to avoid conflicts
      process.removeAllListeners('SIGTERM');
      process.removeAllListeners('SIGINT');
      
      // Require index.js to set up signal handlers (fresh require)
      delete require.cache[require.resolve('../index.js')];
      require('../index.js');

      // Get the registered signal handlers
      const sigtermListeners = process.listeners('SIGTERM');
      const sigintListeners = process.listeners('SIGINT');

      // Should have handlers registered
      expect(sigtermListeners).toHaveLength(1);
      expect(sigintListeners).toHaveLength(1);

      // Directly invoke SIGTERM handler
      sigtermListeners[0]();

      expect(mockConsoleLog).toHaveBeenCalledWith(
        '[VERSION-SERVICE] Received SIGTERM, shutting down gracefully'
      );
      expect(mockExit).toHaveBeenCalledWith(0);

      // Reset mocks for SIGINT test
      mockExit.mockClear();
      mockConsoleLog.mockClear();

      // Directly invoke SIGINT handler  
      sigintListeners[0]();

      expect(mockConsoleLog).toHaveBeenCalledWith(
        '[VERSION-SERVICE] Received SIGINT, shutting down gracefully'
      );
      expect(mockExit).toHaveBeenCalledWith(0);

      // Restore original implementations
      mockExit.mockRestore();
      mockConsoleLog.mockRestore();
      jest.dontMock('../app');
    });
  });

  describe('Service Registry Edge Cases', () => {
    let serviceRegistry;

    beforeEach(() => {
      serviceRegistry = new ServiceRegistry();
    });

    test('getValidVersionsForService handles no service found', () => {
      expect(() => {
        serviceRegistry.getValidVersionsForService('nonexistentService', 'dependentService', '1.0.0');
      }).toThrow('Service nonexistentService not found');
    });

    test('getValidVersionsForService handles multiple scenarios', () => {
      // Create a registry setup helper function
      const setupRegistry = (options = {}) => {
        const registry = new ServiceRegistry();
        registry.registerService('targetService', {
          name: 'Target', 
          version: options.targetVersion || '1.2.0', 
          endpoints: []
        });
        registry.registerService('dependentService', {
          name: 'Dependent', 
          version: options.dependentVersion || '1.0.0', 
          endpoints: []
        });

        if (options.compatibilityMatrix) {
          registry.setCompatibilityMatrix(options.compatibilityMatrix);
        }

        return registry;
      };

      // Scenario 1: Version range incompatibility
      const incompatibilityMatrix = new Map();
      incompatibilityMatrix.set('targetService:dependentService', {
        versionRangeA: '>=1.1.0',
        versionRangeB: '>=2.0.0'
      });

      const registry1 = setupRegistry({ compatibilityMatrix: incompatibilityMatrix });
      const result1 = registry1.getValidVersionsForService('targetService', 'dependentService', '1.0.0');
      expect(result1.service).toBe('targetService');
      expect(result1.validVersions).toEqual([]);
      expect(result1.message).toContain('not compatible');

      // Scenario 2: No compatibility matrix
      const registry2 = setupRegistry();
      const result2 = registry2.getValidVersionsForService('targetService', 'dependentService', '1.0.0');
      expect(result2.service).toBe('targetService');
      expect(result2.validVersions).toEqual(['1.2.0']);
      expect(result2.message).toBe('No compatibility constraints defined');
      expect(result2).not.toHaveProperty('compatibleRange');

      // Scenario 3: Specific compatibility requirements
      const compatibilityMatrix3 = new Map();
      compatibilityMatrix3.set('targetService:dependentService', {
        versionRangeA: '>=1.1.0',
        versionRangeB: '1.x',
        tested: true,
        testedDate: '2024-08-19'
      });

      const registry3 = setupRegistry({
        compatibilityMatrix: compatibilityMatrix3,
        targetVersion: '1.2.0',
        dependentVersion: '1.1.0'
      });

      const result3 = registry3.getValidVersionsForService('targetService', 'dependentService', '1.1.0');
      expect(result3).toEqual({
        service: 'targetService',
        validVersions: ['1.2.0'],
        compatibleRange: '>=1.1.0',
        message: 'Based on current compatibility matrix'
      });
    });

    test('setApplicationConfig saves application config', () => {
      const serviceRegistry = new ServiceRegistry();
      const applicationId = 'testApp';
      const applicationVersion = '1.0.0';
      const config = { requiredServices: [{ serviceId: 'backend', versionRange: '>=1.0.0' }] };

      serviceRegistry.setApplicationConfig(applicationId, applicationVersion, config);

      const appKey = `${applicationId}:${applicationVersion}`;
      const savedConfig = serviceRegistry.applicationConfigs.get(appKey);

      expect(savedConfig).toHaveProperty('requiredServices');
      expect(savedConfig).toHaveProperty('lastUpdated');
    });
  });
});