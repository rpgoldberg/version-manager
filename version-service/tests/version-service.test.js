const request = require('supertest');
const fs = require('fs');
const path = require('path');
const { createApp, loadVersionData } = require('../app');

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
      expect(response.body).toHaveProperty('name', 'figure-collector-services');
      expect(response.body).toHaveProperty('version', '1.0.0');
      expect(response.body).toHaveProperty('releaseDate', '09-Aug-2025');
      expect(response.body).toHaveProperty('description', 'Figure collection management application');
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
      expect(response.body).toHaveProperty('verified', '09-Aug-2025');
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
});