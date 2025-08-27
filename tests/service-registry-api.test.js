const request = require('supertest');
const { createApp } = require('../app');

describe('Service Registry API', () => {
  let app;
  const mockVersionData = {
    application: {
      name: 'figure-collector',
      version: '2.0.0',
      releaseDate: '2024-01-01'
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

  beforeEach(() => {
    app = createApp(mockVersionData);
  });

  describe('Service Registration', () => {
    describe('POST /services/register', () => {
      it('should register a new service successfully', async () => {
        const serviceData = {
          serviceId: 'backend',
          name: 'Figure Collector Backend',
          version: '1.0.0',
          endpoints: ['http://localhost:3000/api'],
          dependencies: { scraper: '>=0.5.0' }
        };

        const response = await request(app)
          .post('/services/register')
          .send(serviceData)
          .expect(201);

        expect(response.body.message).toBe('Service registered successfully');
        expect(response.body.service.id).toBe('backend');
        expect(response.body.service.name).toBe('Figure Collector Backend');
        expect(response.body.service.version).toBe('1.0.0');
        expect(response.body.service.registeredAt).toBeDefined();
      });

      it('should reject registration with missing required fields', async () => {
        const incompleteData = {
          serviceId: 'backend',
          version: '1.0.0'
        };

        const response = await request(app)
          .post('/services/register')
          .send(incompleteData)
          .expect(400);

        expect(response.body.error).toBe('Missing required fields: serviceId, name, version');
      });

      it('should reject registration with invalid semantic version', async () => {
        const invalidData = {
          serviceId: 'backend',
          name: 'Backend Service',
          version: 'invalid-version'
        };

        const response = await request(app)
          .post('/services/register')
          .send(invalidData)
          .expect(400);

        expect(response.body.error).toContain('Invalid semantic version');
      });
    });

    describe('PUT /services/:serviceId/version', () => {
      beforeEach(async () => {
        await request(app)
          .post('/services/register')
          .send({
            serviceId: 'backend',
            name: 'Backend Service',
            version: '1.0.0'
          });
      });

      it('should update service version successfully', async () => {
        const response = await request(app)
          .put('/services/backend/version')
          .send({ version: '1.1.0' })
          .expect(200);

        expect(response.body.message).toBe('Service version updated successfully');
        expect(response.body.service.version).toBe('1.1.0');
        expect(response.body.service.lastUpdated).toBeDefined();
      });

      it('should reject update for non-existent service', async () => {
        const response = await request(app)
          .put('/services/nonexistent/version')
          .send({ version: '1.1.0' })
          .expect(400);

        expect(response.body.error).toBe('Service nonexistent not found');
      });
    });

    describe('GET /services', () => {
      it('should return empty list when no services registered', async () => {
        const response = await request(app)
          .get('/services')
          .expect(200);

        expect(response.body.count).toBe(0);
        expect(response.body.services).toEqual([]);
      });

      it('should return all registered services', async () => {
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

        const response = await request(app)
          .get('/services')
          .expect(200);

        expect(response.body.count).toBe(2);
        expect(response.body.services).toHaveLength(2);
        expect(response.body.services[0].id).toBe('backend');
        expect(response.body.services[1].id).toBe('frontend');
      });
    });

    describe('GET /services/:serviceId', () => {
      beforeEach(async () => {
        await request(app)
          .post('/services/register')
          .send({
            serviceId: 'backend',
            name: 'Backend Service',
            version: '1.0.0'
          });
      });

      it('should return specific service', async () => {
        const response = await request(app)
          .get('/services/backend')
          .expect(200);

        expect(response.body.id).toBe('backend');
        expect(response.body.name).toBe('Backend Service');
        expect(response.body.version).toBe('1.0.0');
      });

      it('should return 404 for non-existent service', async () => {
        const response = await request(app)
          .get('/services/nonexistent')
          .expect(404);

        expect(response.body.error).toBe('Service not found');
      });
    });

    describe('DELETE /services/:serviceId', () => {
      beforeEach(async () => {
        await request(app)
          .post('/services/register')
          .send({
            serviceId: 'backend',
            name: 'Backend Service',
            version: '1.0.0'
          });
      });

      it('should unregister service successfully', async () => {
        const response = await request(app)
          .delete('/services/backend')
          .expect(200);

        expect(response.body.message).toBe('Service unregistered successfully');

        await request(app)
          .get('/services/backend')
          .expect(404);
      });

      it('should return 404 when trying to unregister non-existent service', async () => {
        const response = await request(app)
          .delete('/services/nonexistent')
          .expect(404);

        expect(response.body.error).toBe('Service not found');
      });
    });
  });
});