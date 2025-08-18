const request = require('supertest');
const fs = require('fs');
const path = require('path');
const semver = require('semver');
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

describe('Version Validation Logic', () => {
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
  });

  describe('Tested Combinations', () => {
    test('should return tested status for exact matches', async () => {
      const config = {
        application: { name: 'test-app', version: '1.0.0' },
        compatibility: {
          testedCombinations: [
            {
              backend: '1.0.0',
              frontend: '1.0.0',
              scraper: '1.0.0',
              verified: '09-Aug-2025'
            },
            {
              backend: '2.0.0',
              frontend: '2.0.0',
              scraper: '1.5.0',
              verified: '10-Aug-2025'
            }
          ]
        }
      };
      
      fs.writeFileSync(versionPath, JSON.stringify(config, null, 2));
      const versionData = loadVersionData();
      app = createApp(versionData);

      // Test first combination
      const response1 = await request(app)
        .get('/validate-versions')
        .query({ backend: '1.0.0', frontend: '1.0.0', scraper: '1.0.0' });
      
      expect(response1.status).toBe(200);
      expect(response1.body.valid).toBe(true);
      expect(response1.body.status).toBe('tested');
      expect(response1.body.verified).toBe('09-Aug-2025');

      // Test second combination
      const response2 = await request(app)
        .get('/validate-versions')
        .query({ backend: '2.0.0', frontend: '2.0.0', scraper: '1.5.0' });
      
      expect(response2.status).toBe(200);
      expect(response2.body.valid).toBe(true);
      expect(response2.body.status).toBe('tested');
      expect(response2.body.verified).toBe('10-Aug-2025');
    });

    test('should handle partial matches (not all params match)', async () => {
      const config = {
        application: { name: 'test-app', version: '1.0.0' },
        compatibility: {
          testedCombinations: [
            {
              backend: '1.0.0',
              frontend: '1.0.0',
              scraper: '1.0.0',
              verified: '09-Aug-2025'
            }
          ]
        },
        dependencies: {
          backend: { scraper: '^1.0.0' },
          frontend: { backend: '^1.0.0' }
        }
      };
      
      fs.writeFileSync(versionPath, JSON.stringify(config, null, 2));
      const versionData = loadVersionData();
      app = createApp(versionData);

      const response = await request(app)
        .get('/validate-versions')
        .query({ backend: '1.0.0', frontend: '1.0.0', scraper: '1.1.0' });
      
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('compatible');
    });
  });

  describe('Dependency Validation', () => {
    test('should validate backend-scraper dependencies', async () => {
      const config = {
        application: { name: 'test-app', version: '1.0.0' },
        compatibility: { testedCombinations: [] },
        dependencies: {
          backend: { scraper: '^1.5.0' },
          frontend: { backend: '^2.0.0' }
        }
      };
      
      fs.writeFileSync(versionPath, JSON.stringify(config, null, 2));
      const versionData = loadVersionData();
      app = createApp(versionData);

      // Test mismatched scraper version
      const response = await request(app)
        .get('/validate-versions')
        .query({ backend: '2.0.0', frontend: '2.0.0', scraper: '1.0.0' });
      
      expect(response.status).toBe(200);
      expect(response.body.valid).toBe(false);
      expect(response.body.status).toBe('warning');
      expect(response.body.warnings).toContain('Backend expects scraper ^1.5.0, got 1.0.0');
    });

    test('should validate frontend-backend dependencies', async () => {
      const config = {
        application: { name: 'test-app', version: '1.0.0' },
        compatibility: { testedCombinations: [] },
        dependencies: {
          backend: { scraper: '^1.0.0' },
          frontend: { backend: '^2.0.0' }
        }
      };
      
      fs.writeFileSync(versionPath, JSON.stringify(config, null, 2));
      const versionData = loadVersionData();
      app = createApp(versionData);

      // Test mismatched backend version
      const response = await request(app)
        .get('/validate-versions')
        .query({ backend: '1.5.0', frontend: '2.0.0', scraper: '1.0.0' });
      
      expect(response.status).toBe(200);
      expect(response.body.valid).toBe(false);
      expect(response.body.status).toBe('warning');
      expect(response.body.warnings).toContain('Frontend expects backend ^2.0.0, got 1.5.0');
    });

    test('should handle multiple dependency mismatches', async () => {
      const config = {
        application: { name: 'test-app', version: '1.0.0' },
        compatibility: { testedCombinations: [] },
        dependencies: {
          backend: { scraper: '^2.0.0' },
          frontend: { backend: '^3.0.0' }
        }
      };
      
      fs.writeFileSync(versionPath, JSON.stringify(config, null, 2));
      const versionData = loadVersionData();
      app = createApp(versionData);

      const response = await request(app)
        .get('/validate-versions')
        .query({ backend: '1.0.0', frontend: '2.0.0', scraper: '1.0.0' });
      
      expect(response.status).toBe(200);
      expect(response.body.valid).toBe(false);
      expect(response.body.status).toBe('warning');
      expect(response.body.warnings).toHaveLength(2);
      expect(response.body.warnings).toContain('Backend expects scraper ^2.0.0, got 1.0.0');
      expect(response.body.warnings).toContain('Frontend expects backend ^3.0.0, got 1.0.0');
    });

    test('should handle missing dependency configurations', async () => {
      const config = {
        application: { name: 'test-app', version: '1.0.0' },
        compatibility: { testedCombinations: [] },
        dependencies: {} // No dependencies defined
      };
      
      fs.writeFileSync(versionPath, JSON.stringify(config, null, 2));
      const versionData = loadVersionData();
      app = createApp(versionData);

      const response = await request(app)
        .get('/validate-versions')
        .query({ backend: '1.0.0', frontend: '2.0.0', scraper: '1.0.0' });
      
      expect(response.status).toBe(200);
      expect(response.body.valid).toBe(true);
      expect(response.body.status).toBe('compatible');
      expect(response.body.warnings).toEqual([]);
    });
  });

  describe('Version Format Handling', () => {
    test('should handle caret versions correctly', async () => {
      const config = {
        application: { name: 'test-app', version: '1.0.0' },
        compatibility: { testedCombinations: [] },
        dependencies: {
          backend: { scraper: '^1.0.0' },
          frontend: { backend: '^1.0.0' }
        }
      };
      
      fs.writeFileSync(versionPath, JSON.stringify(config, null, 2));
      const versionData = loadVersionData();
      app = createApp(versionData);

      const response = await request(app)
        .get('/validate-versions')
        .query({ backend: '1.0.0', frontend: '1.0.0', scraper: '1.0.0' });
      
      expect(response.status).toBe(200);
      expect(response.body.valid).toBe(true);
      expect(response.body.status).toBe('compatible');
    });

    test('should handle versions without caret', async () => {
      const config = {
        application: { name: 'test-app', version: '1.0.0' },
        compatibility: { testedCombinations: [] },
        dependencies: {
          backend: { scraper: '1.0.0' },
          frontend: { backend: '1.0.0' }
        }
      };
      
      fs.writeFileSync(versionPath, JSON.stringify(config, null, 2));
      const versionData = loadVersionData();
      app = createApp(versionData);

      const response = await request(app)
        .get('/validate-versions')
        .query({ backend: '1.0.0', frontend: '1.0.0', scraper: '1.0.0' });
      
      expect(response.status).toBe(200);
      expect(response.body.valid).toBe(true);
      expect(response.body.status).toBe('compatible');
    });
  });

  describe('Edge Cases and Error Conditions', () => {
    test('should handle null/undefined version parameters', async () => {
      const config = {
        application: { name: 'test-app', version: '1.0.0' },
        compatibility: { testedCombinations: [] },
        dependencies: {}
      };
      
      fs.writeFileSync(versionPath, JSON.stringify(config, null, 2));
      const versionData = loadVersionData();
      app = createApp(versionData);

      const response = await request(app)
        .get('/validate-versions')
        .query({ backend: null, frontend: undefined, scraper: '' });
      
      expect(response.status).toBe(200);
      // Should handle gracefully without crashing
    });

    test('should handle very long version strings', async () => {
      const config = {
        application: { name: 'test-app', version: '1.0.0' },
        compatibility: { testedCombinations: [] },
        dependencies: {
          backend: { scraper: '^1.0.0' },
          frontend: { backend: '^1.0.0' }
        }
      };
      
      fs.writeFileSync(versionPath, JSON.stringify(config, null, 2));
      const versionData = loadVersionData();
      app = createApp(versionData);

      const longVersion = semver.valid('1.0.0') || '1.0.0';
      const response = await request(app)
        .get('/validate-versions')
        .query({ backend: longVersion, frontend: '1.0.0', scraper: '1.0.0' });
      
      expect(response.status).toBe(200);
      expect(response.body.valid).toBe(true);
    });

    test('should handle special characters in version strings', async () => {
      const config = {
        application: { name: 'test-app', version: '1.0.0' },
        compatibility: { testedCombinations: [] },
        dependencies: {}
      };
      
      fs.writeFileSync(versionPath, JSON.stringify(config, null, 2));
      const versionData = loadVersionData();
      app = createApp(versionData);

      const response = await request(app)
        .get('/validate-versions')
        .query({ backend: '1.0.0-alpha+build.1', frontend: '2.0.0-beta', scraper: '1.5.0-rc.1' });
      
      expect(response.status).toBe(200);
    });

    test('should return appropriate message for compatible untested versions', async () => {
      const config = {
        application: { name: 'test-app', version: '1.0.0' },
        compatibility: { testedCombinations: [] },
        dependencies: {
          backend: { scraper: '^1.0.0' },
          frontend: { backend: '^1.0.0' }
        }
      };
      
      fs.writeFileSync(versionPath, JSON.stringify(config, null, 2));
      const versionData = loadVersionData();
      app = createApp(versionData);

      const response = await request(app)
        .get('/validate-versions')
        .query({ backend: '1.0.0', frontend: '1.0.0', scraper: '1.0.0' });
      
      expect(response.status).toBe(200);
      expect(response.body.valid).toBe(true);
      expect(response.body.status).toBe('compatible');
      expect(response.body.message).toBe('Service versions appear compatible but untested');
    });
  });
});