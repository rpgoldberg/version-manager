const request = require('supertest');
const { createApp } = require('../app');

describe('Compatibility API', () => {
  let app;
  const mockVersionData = {
    application: {
      name: 'figure-collector',
      version: '2.0.0'
    },
    compatibility: {
      'backend:frontend': {
        versionRangeA: '>=1.0.0',
        versionRangeB: '>=1.0.0',
        tested: true,
        testedDate: '2024-01-01'
      },
      'backend:scraper': {
        versionRangeA: '>=1.0.0',
        versionRangeB: '>=0.5.0',
        tested: false
      }
    }
  };

  beforeEach(async () => {
    // Set up auth token for testing
    process.env.SERVICE_AUTH_TOKEN = 'test-token';
    app = createApp(mockVersionData);

    await request(app)
      .post('/services/register')
      .set('Authorization', 'Bearer test-token')
      .send({
        serviceId: 'backend',
        name: 'Backend Service',
        version: '1.0.0'
      });

    await request(app)
      .post('/services/register')
      .set('Authorization', 'Bearer test-token')
      .send({
        serviceId: 'frontend',
        name: 'Frontend Service',
        version: '1.0.0'
      });

    await request(app)
      .post('/services/register')
      .set('Authorization', 'Bearer test-token')
      .send({
        serviceId: 'scraper',
        name: 'Scraper Service',
        version: '0.5.0'
      });
  });

  afterEach(() => {
    // Clean up environment
    delete process.env.SERVICE_AUTH_TOKEN;
  });

  describe('GET /compatibility/validate', () => {
    it('should validate compatible service versions', async () => {
      const response = await request(app)
        .get('/compatibility/validate')
        .query({
          serviceA: 'backend',
          versionA: '1.0.0',
          serviceB: 'frontend',
          versionB: '1.0.0'
        })
        .expect(200);

      expect(response.body.compatible).toBe(true);
      expect(response.body.status).toBe('tested');
      expect(response.body.message).toBe('Combination has been tested');
      expect(response.body.testedDate).toBe('2024-01-01');
    });

    it('should validate compatible but untested service versions', async () => {
      const response = await request(app)
        .get('/compatibility/validate')
        .query({
          serviceA: 'backend',
          versionA: '1.0.0',
          serviceB: 'scraper',
          versionB: '0.5.0'
        })
        .expect(200);

      expect(response.body.compatible).toBe(true);
      expect(response.body.status).toBe('compatible');
      expect(response.body.message).toBe('Versions appear compatible');
    });

    it('should detect incompatible service versions', async () => {
      const response = await request(app)
        .get('/compatibility/validate')
        .query({
          serviceA: 'backend',
          versionA: '0.9.0',
          versionB: '1.0.0',
          serviceB: 'frontend'
        })
        .expect(200);

      expect(response.body.compatible).toBe(false);
      expect(response.body.status).toBe('incompatible');
      expect(response.body.message).toBe('Version compatibility check failed');
      expect(response.body.requirements).toBeDefined();
    });

    it('should handle unknown service combinations', async () => {
      const response = await request(app)
        .get('/compatibility/validate')
        .query({
          serviceA: 'unknown1',
          versionA: '1.0.0',
          serviceB: 'unknown2',
          versionB: '1.0.0'
        })
        .expect(200);

      expect(response.body.compatible).toBe(false);
      expect(response.body.status).toBe('unknown');
      expect(response.body.message).toContain('No compatibility data available');
    });

    it('should reject requests with missing parameters', async () => {
      const response = await request(app)
        .get('/compatibility/validate')
        .query({
          serviceA: 'backend',
          versionA: '1.0.0'
        })
        .expect(400);

      expect(response.body.error).toBe('Missing required query parameters: serviceA, versionA, serviceB, versionB');
    });
  });

  describe('GET /compatibility/versions/:serviceId', () => {
    it('should return valid versions for a service given dependency constraints', async () => {
      const response = await request(app)
        .get('/compatibility/versions/frontend')
        .query({
          dependentService: 'backend',
          dependentVersion: '1.0.0'
        })
        .expect(200);

      expect(response.body.service).toBe('frontend');
      expect(response.body.validVersions).toEqual(['1.0.0']);
      expect(response.body.compatibleRange).toBe('>=1.0.0');
    });

    it('should return error for non-existent service', async () => {
      const response = await request(app)
        .get('/compatibility/versions/nonexistent')
        .query({
          dependentService: 'backend',
          dependentVersion: '1.0.0'
        })
        .expect(400);

      expect(response.body.error).toBe('Service nonexistent not found');
    });

    it('should reject requests with missing parameters', async () => {
      const response = await request(app)
        .get('/compatibility/versions/frontend')
        .query({
          dependentService: 'backend'
        })
        .expect(400);

      expect(response.body.error).toBe('Missing required query parameters: dependentService, dependentVersion');
    });
  });

  describe('GET /compatibility/matrix', () => {
    it('should return compatibility matrix and registered services', async () => {
      const response = await request(app)
        .get('/compatibility/matrix')
        .expect(200);

      expect(response.body.compatibilityMatrix).toBeDefined();
      expect(response.body.services).toHaveLength(3);
      expect(response.body.services[0]).toEqual({
        id: 'backend',
        name: 'Backend Service',
        version: '1.0.0'
      });
    });
  });
});