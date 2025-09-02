const request = require('supertest');
const { createApp } = require('../app');

describe('Application Coordination API', () => {
  let app;
  const mockVersionData = {
    application: {
      name: 'figure-collector',
      version: '2.0.0'
    },
    compatibility: {}
  };

  beforeEach(async () => {
    app = createApp(mockVersionData);
    
    await request(app)
      .post('/services/register')
      .send({
        serviceId: 'backend',
        name: 'Backend Service',
        version: '1.0.0'
      });

    await request(app)
      .post('/services/register')
      .send({
        serviceId: 'frontend',
        name: 'Frontend Service',
        version: '1.0.0'
      });

    await request(app)
      .post('/services/register')
      .send({
        serviceId: 'scraper',
        name: 'Scraper Service',
        version: '0.5.0'
      });
  });

  describe('POST /applications/:appId/config', () => {
    it('should set application configuration successfully', async () => {
      const config = {
        applicationVersion: '2.0.0',
        requiredServices: [
          { serviceId: 'backend', versionRange: '>=1.0.0' },
          { serviceId: 'frontend', versionRange: '>=1.0.0' },
          { serviceId: 'scraper', versionRange: '>=0.5.0' }
        ]
      };

      const response = await request(app)
        .post('/applications/figure-collector/config')
        .send(config)
        .expect(200);

      expect(response.body.message).toBe('Application configuration set successfully');
      expect(response.body.application).toBe('figure-collector');
      expect(response.body.version).toBe('2.0.0');
    });

    it('should reject configuration with missing fields', async () => {
      const incompleteConfig = {
        applicationVersion: '2.0.0'
      };

      const response = await request(app)
        .post('/applications/figure-collector/config')
        .send(incompleteConfig)
        .expect(400);

      expect(response.body.error).toBe('Missing required fields: applicationVersion, requiredServices');
    });
  });

  describe('GET /applications/:appId/services', () => {
    beforeEach(async () => {
      const config = {
        applicationVersion: '2.0.0',
        requiredServices: [
          { serviceId: 'backend', versionRange: '>=1.0.0' },
          { serviceId: 'frontend', versionRange: '>=1.0.0' },
          { serviceId: 'scraper', versionRange: '>=0.5.0' }
        ]
      };

      await request(app)
        .post('/applications/figure-collector/config')
        .send(config);
    });

    it('should return services for configured application version', async () => {
      const response = await request(app)
        .get('/applications/figure-collector/services')
        .query({ version: '2.0.0' })
        .expect(200);

      expect(response.body.application).toBe('figure-collector');
      expect(response.body.version).toBe('2.0.0');
      expect(response.body.services).toHaveLength(3);
      expect(response.body.allCompatible).toBe(true);

      const backendService = response.body.services.find(s => s.id === 'backend');
      expect(backendService.requiredVersionRange).toBe('>=1.0.0');
      expect(backendService.isCompatible).toBe(true);
    });

    it('should return all services when no specific configuration exists', async () => {
      const response = await request(app)
        .get('/applications/unknown-app/services')
        .query({ version: '1.0.0' })
        .expect(200);

      expect(response.body.application).toBe('unknown-app');
      expect(response.body.services).toHaveLength(3);
      expect(response.body.message).toContain('No specific application configuration found');
    });

    it('should reject request without version parameter', async () => {
      const response = await request(app)
        .get('/applications/figure-collector/services')
        .expect(400);

      expect(response.body.error).toBe('Application version is required as query parameter');
    });
  });

  describe('POST /applications/:appId/validate', () => {
    beforeEach(async () => {
      const config = {
        applicationVersion: '2.0.0',
        requiredServices: [
          { serviceId: 'backend', versionRange: '>=1.0.0' },
          { serviceId: 'frontend', versionRange: '>=1.0.0' },
          { serviceId: 'scraper', versionRange: '>=0.5.0' }
        ]
      };

      await request(app)
        .post('/applications/figure-collector/config')
        .send(config);
    });

    it('should validate compatible service combination', async () => {
      const validationRequest = {
        applicationVersion: '2.0.0',
        serviceVersions: {
          backend: '1.0.0',
          frontend: '1.0.0',
          scraper: '0.5.0'
        }
      };

      const response = await request(app)
        .post('/applications/figure-collector/validate')
        .send(validationRequest)
        .expect(200);

      expect(response.body.application).toBe('figure-collector');
      expect(response.body.allValid).toBe(true);
      expect(response.body.results).toHaveLength(3);

      const backendResult = response.body.results.find(r => r.serviceId === 'backend');
      expect(backendResult.status).toBe('valid');
      expect(backendResult.message).toBe('Version meets requirements');
    });

    it('should detect invalid service combination', async () => {
      const validationRequest = {
        applicationVersion: '2.0.0',
        serviceVersions: {
          backend: '0.9.0',
          frontend: '1.0.0',
          scraper: '0.4.0'
        }
      };

      const response = await request(app)
        .post('/applications/figure-collector/validate')
        .send(validationRequest)
        .expect(200);

      expect(response.body.allValid).toBe(false);

      const backendResult = response.body.results.find(r => r.serviceId === 'backend');
      expect(backendResult.status).toBe('invalid');
      expect(backendResult.message).toBe('Version does not meet requirements');

      const scraperResult = response.body.results.find(r => r.serviceId === 'scraper');
      expect(scraperResult.status).toBe('invalid');
    });

    it('should handle unknown services in validation', async () => {
      const validationRequest = {
        applicationVersion: '2.0.0',
        serviceVersions: {
          unknown: '1.0.0',
          backend: '1.0.0'
        }
      };

      const response = await request(app)
        .post('/applications/figure-collector/validate')
        .send(validationRequest)
        .expect(200);

      const unknownResult = response.body.results.find(r => r.serviceId === 'unknown');
      expect(unknownResult.status).toBe('unknown');
      expect(unknownResult.message).toBe('Service not required for this application version');
    });

    it('should reject validation with missing fields', async () => {
      const incompleteRequest = {
        applicationVersion: '2.0.0'
      };

      const response = await request(app)
        .post('/applications/figure-collector/validate')
        .send(incompleteRequest)
        .expect(400);

      expect(response.body.error).toBe('Missing required fields: applicationVersion, serviceVersions');
    });
  });

  describe('GET /applications/:appId/versions', () => {
    beforeEach(async () => {
      const config = {
        applicationVersion: '2.0.0',
        requiredServices: [
          { serviceId: 'backend', versionRange: '>=1.0.0' },
          { serviceId: 'frontend', versionRange: '>=1.0.0' },
          { serviceId: 'scraper', versionRange: '>=0.6.0' }
        ]
      };

      await request(app)
        .post('/applications/figure-collector/config')
        .send(config);
    });

    it('should return valid service versions for application', async () => {
      const response = await request(app)
        .get('/applications/figure-collector/versions')
        .query({ version: '2.0.0' })
        .expect(200);

      expect(response.body.application).toBe('figure-collector');
      expect(response.body.version).toBe('2.0.0');
      expect(response.body.validServiceVersions).toBeDefined();
      expect(response.body.allCompatible).toBe(false);

      const backendVersions = response.body.validServiceVersions.backend;
      expect(backendVersions.currentVersion).toBe('1.0.0');
      expect(backendVersions.requiredRange).toBe('>=1.0.0');
      expect(backendVersions.isCompatible).toBe(true);

      const scraperVersions = response.body.validServiceVersions.scraper;
      expect(scraperVersions.isCompatible).toBe(false);
    });

    it('should reject request without version parameter', async () => {
      const response = await request(app)
        .get('/applications/figure-collector/versions')
        .expect(400);

      expect(response.body.error).toBe('Application version is required as query parameter');
    });
  });
});