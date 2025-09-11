const request = require('supertest');
const fs = require('fs');
const path = require('path');
const { createApp, loadVersionData } = require('../app');
const testVersionData = require('./fixtures/test-version.json');

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

describe('Error Handling and Edge Cases', () => {
  let app;
  const versionPath = path.join(__dirname, '../version.json');
  let originalVersionData;

  beforeEach(() => {
    // Backup original version.json
    if (fs.existsSync(versionPath)) {
      originalVersionData = fs.readFileSync(versionPath, 'utf8');
    }
  });

  afterEach(() => {
    // Restore original version.json
    if (originalVersionData) {
      fs.writeFileSync(versionPath, originalVersionData);
    }
    
    // No need to close app in tests
  });

  describe('Malformed Request Handling', () => {
    beforeEach(() => {
      app = createApp(testVersionData);
    });

    test('should handle requests with invalid query string characters', async () => {
      const response = await request(app)
        .get('/validate-versions?backend=1.0.0&frontend=1.0.0&scraper=1.0.0&invalid=<script>alert("xss")</script>');
      
      expect(response.status).toBe(200);
      // Should not crash the service
    });

    test('should handle extremely long query strings', async () => {
      const longValue = 'a'.repeat(10000);
      const response = await request(app)
        .get('/validate-versions')
        .query({ backend: longValue, frontend: '1.0.0', scraper: '1.0.0' });
      
      expect(response.status).toBe(200);
    });

    test('should handle requests with SQL injection attempts', async () => {
      const response = await request(app)
        .get('/validate-versions')
        .query({ 
          backend: "1.0.0'; DROP TABLE users; --",
          frontend: '1.0.0',
          scraper: '1.0.0'
        });
      
      expect(response.status).toBe(200);
      // Service should handle gracefully
    });

    test('should handle requests with unicode characters', async () => {
      const response = await request(app)
        .get('/validate-versions')
        .query({ 
          backend: '1.0.0-üñíçødé',
          frontend: '1.0.0-测试',
          scraper: '1.0.0-🚀'
        });
      
      expect(response.status).toBe(200);
    });
  });

  describe('Invalid HTTP Methods', () => {
    beforeEach(() => {
      app = createApp(testVersionData);
    });

    test('should handle POST requests to GET-only endpoints', async () => {
      const response = await request(app)
        .post('/validate-versions')
        .send({ backend: '1.0.0', frontend: '1.0.0', scraper: '1.0.0' });
      
      expect(response.status).toBe(404);
    });

    test('should handle PUT requests', async () => {
      const response = await request(app)
        .put('/app-version')
        .send({ version: '2.0.0' });
      
      expect(response.status).toBe(404);
    });

    test('should handle DELETE requests', async () => {
      const response = await request(app).delete('/version-info');
      expect(response.status).toBe(404);
    });

    test('should handle PATCH requests', async () => {
      const response = await request(app)
        .patch('/health')
        .send({ status: 'unhealthy' });
      
      expect(response.status).toBe(404);
    });
  });

  describe('Non-existent Endpoints', () => {
    beforeEach(() => {
      app = createApp(testVersionData);
    });

    test('should return 404 for non-existent endpoints', async () => {
      const response = await request(app).get('/non-existent');
      expect(response.status).toBe(404);
    });

    test('should handle requests with trailing slashes', async () => {
      const response = await request(app).get('/app-version/');
      // Express handles trailing slashes gracefully, redirecting to without slash
      expect([200, 301, 404]).toContain(response.status);
    });

    test('should handle requests with extra path segments', async () => {
      const response = await request(app).get('/app-version/extra/path');
      expect(response.status).toBe(404);
    });

    test('should handle case-sensitive endpoint names', async () => {
      const response = await request(app).get('/APP-VERSION');
      // Express routes are case-insensitive by default
      expect([200, 404]).toContain(response.status);
    });
  });

  describe('Concurrent Request Handling', () => {
    beforeEach(() => {
      app = createApp(testVersionData);
    });

    test('should handle multiple concurrent requests', async () => {
      const requests = Array.from({ length: 10 }, (_, i) => 
        request(app)
          .get('/validate-versions')
          .query({ backend: `1.0.${i}`, frontend: '1.0.0', scraper: '1.0.0' })
      );

      const responses = await Promise.all(requests);
      
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('valid');
        expect(response.body).toHaveProperty('status');
      });
    });

    test('should handle rapid sequential requests', async () => {
      const responses = [];
      
      for (let i = 0; i < 5; i++) {
        const response = await request(app).get('/health');
        responses.push(response);
      }
      
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('status', 'healthy');
      });
    });
  });

  describe('Memory and Performance Edge Cases', () => {
    beforeEach(() => {
      app = createApp(testVersionData);
    });

    test('should handle requests with many query parameters', async () => {
      const queryParams = new URLSearchParams();
      for (let i = 0; i < 100; i++) {
        queryParams.set(`param${i}`, `value${i}`);
      }
      queryParams.set('backend', '1.0.0');
      queryParams.set('frontend', '1.0.0');
      queryParams.set('scraper', '1.0.0');
      
      const response = await request(app)
        .get(`/validate-versions?${queryParams.toString()}`);
      
      expect(response.status).toBe(200);
    });

    test('should handle large configuration files', async () => {
      const largeConfig = {
        application: { name: 'test-app', version: '1.0.0' },
        services: {
          backend: { version: '1.0.500', name: 'test-backend' },
          frontend: { version: '1.0.500', name: 'test-frontend' },
          scraper: { version: '1.0.500', name: 'test-scraper' }
        },
        compatibility: {
          testedCombinations: Array.from({ length: 1000 }, (_, i) => ({
            backend: `1.0.${i}`,
            frontend: `1.0.${i}`,
            scraper: `1.0.${i}`,
            verified: '09-Aug-2025'
          }))
        },
        dependencies: {}
      };
      
      // Create app with large config directly (no file I/O)
      app = createApp(largeConfig);
      
      const response = await request(app)
        .get('/validate-versions')
        .query({ backend: '1.0.500', frontend: '1.0.500', scraper: '1.0.500' });
      
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('tested');
    });
  });

  describe('Response Format Validation', () => {
    beforeEach(() => {
      app = createApp(testVersionData);
    });

    test('should always return valid JSON', async () => {
      const endpoints = ['/', '/health', '/app-version', '/version-info'];
      
      for (const endpoint of endpoints) {
        const response = await request(app).get(endpoint);
        expect(response.status).toBe(200);
        expect(response.headers['content-type']).toMatch(/application\/json/);
        expect(() => JSON.parse(response.text)).not.toThrow();
      }
    });

    test('should maintain consistent response structure for validation endpoint', async () => {
      const response = await request(app)
        .get('/validate-versions')
        .query({ backend: '999.999.999', frontend: '999.999.999', scraper: '999.999.999' });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('valid');
      expect(response.body).toHaveProperty('status');
      expect(typeof response.body.valid).toBe('boolean');
      expect(typeof response.body.status).toBe('string');
      
      if (response.body.warnings) {
        expect(Array.isArray(response.body.warnings)).toBe(true);
      }
      
      if (response.body.message) {
        expect(typeof response.body.message).toBe('string');
      }
    });
  });

  describe('CORS and Headers', () => {
    beforeEach(() => {
      app = createApp(testVersionData);
    });

    test('should include CORS headers', async () => {
      const response = await request(app).get('/health');
      
      expect(response.status).toBe(200);
      expect(response.headers).toHaveProperty('access-control-allow-origin');
    });

    test('should handle OPTIONS requests', async () => {
      const response = await request(app).options('/validate-versions');
      
      // Express with CORS should handle OPTIONS requests
      expect(response.status).toBe(204);
    });
  });
});