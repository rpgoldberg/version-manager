const request = require('supertest');
const fs = require('fs');
const path = require('path');
const { createApp, loadVersionData } = require('../../../app');

// Mock version data for testing inter-service communication
const mockVersionData = {
  application: {
    name: 'figure-collector-services',
    version: '1.0.0',
    releaseDate: '09-Aug-2025',
    description: 'Figure collection management application'
  },
  services: {
    backend: {
      name: 'figure-collector-backend',
      version: '1.0.0'
    },
    frontend: {
      name: 'figure-collector-frontend',
      version: '1.0.0'
    },
    scraper: {
      name: 'page-scraper',
      version: '1.0.0'
    }
  },
  dependencies: {
    backend: {
      scraper: '^1.0.0'
    },
    frontend: {
      backend: '^1.0.0'
    }
  },
  compatibility: {
    testedCombinations: [
      {
        backend: '1.0.0',
        frontend: '1.0.0',
        scraper: '1.0.0',
        verified: '09-Aug-2025'
      }
    ]
  }
};

// Create a temporary version.json for testing
const createTempVersionFile = (data) => {
  const tempPath = path.join(__dirname, 'temp-version.json');
  fs.writeFileSync(tempPath, JSON.stringify(data), 'utf8');
  return tempPath;
};

describe('Version Service Inter-Service Communication', () => {
  let app;
  let tempVersionPath;

  beforeAll(() => {
    // Create temporary version.json before tests
    tempVersionPath = createTempVersionFile(mockVersionData);
    process.env.VERSION_JSON_PATH = tempVersionPath;
  });

  beforeEach(() => {
    // Reload version data and recreate app for each test
    const versionData = loadVersionData(tempVersionPath);
    app = createApp(versionData);
  });

  afterAll(() => {
    // Clean up temporary version file
    if (fs.existsSync(tempVersionPath)) {
      fs.unlinkSync(tempVersionPath);
    }
  });

  describe('Backend Service Version Validation', () => {
    it('should validate backend-scraper version compatibility', async () => {
      const response = await request(app)
        .get('/validate-versions')
        .query({
          backend: '1.0.0',
          scraper: '1.0.0'
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(expect.objectContaining({
        valid: true,
        status: 'compatible',
        message: 'Service versions appear compatible but untested'
      }));
    });

    it('should return warning for incompatible backend-scraper versions', async () => {
      const response = await request(app)
        .get('/validate-versions')
        .query({
          backend: '1.0.0',
          scraper: '2.0.0'
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(expect.objectContaining({
        valid: false,
        status: 'warning',
        warnings: expect.arrayContaining([
          expect.stringContaining('Backend expects scraper ^1.0.0')
        ])
      }));
    });

    it('should handle missing version query parameters', async () => {
      const response = await request(app)
        .get('/validate-versions')
        .query({});

      expect(response.status).toBe(200);
      expect(response.body).toEqual(expect.objectContaining({
        valid: false,
        status: 'warning',
        warnings: expect.any(Array)
      }));
    });
  });

  describe('Backend Service App Version Retrieval', () => {
    it('should return application version information', async () => {
      const response = await request(app).get('/app-version');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        name: 'figure-collector-services',
        version: '1.0.0',
        releaseDate: '09-Aug-2025',
        description: 'Figure collection management application'
      });
    });
  });

  describe('Backend Service Health Checks', () => {
    it('should return healthy status for root endpoint', async () => {
      const response = await request(app).get('/');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(expect.objectContaining({
        status: 'healthy',
        service: 'version-manager',
        timestamp: expect.any(String)
      }));
    });

    it('should return healthy status with version data', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(expect.objectContaining({
        status: 'healthy',
        service: 'version-manager',
        versionData: 'loaded',
        timestamp: expect.any(String)
      }));
    });
  });

  describe('Multiple Backend Instances Version Coordination', () => {
    const concurrentRequests = 10;

    it('should handle concurrent version validation requests', async () => {
      const requests = Array(concurrentRequests).fill().map(() => 
        request(app)
          .get('/validate-versions')
          .query({
            backend: '1.0.0',
            frontend: '1.0.0',
            scraper: '1.0.0'
          })
      );

      const responses = await Promise.all(requests);

      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body).toEqual(expect.objectContaining({
          valid: true,
          status: 'tested'
        }));
      });
    });
  });
});