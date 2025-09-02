const ServiceRegistry = require('../service-registry');

describe('ServiceRegistry', () => {
  let registry;

  beforeEach(() => {
    registry = new ServiceRegistry();
  });

  describe('Service Registration', () => {
    it('should register a service successfully', () => {
      const serviceData = {
        name: 'Backend Service',
        version: '1.0.0',
        endpoints: ['http://localhost:3000'],
        dependencies: { scraper: '>=0.5.0' }
      };

      const result = registry.registerService('backend', serviceData);

      expect(result.id).toBe('backend');
      expect(result.name).toBe('Backend Service');
      expect(result.version).toBe('1.0.0');
      expect(result.registeredAt).toBeDefined();
      expect(result.lastUpdated).toBeDefined();
    });

    it('should throw error for invalid semantic version', () => {
      const serviceData = {
        name: 'Backend Service',
        version: 'invalid-version'
      };

      expect(() => {
        registry.registerService('backend', serviceData);
      }).toThrow('Invalid semantic version: invalid-version');
    });

    it('should update service version', () => {
      registry.registerService('backend', {
        name: 'Backend Service',
        version: '1.0.0'
      });

      const result = registry.updateServiceVersion('backend', '1.1.0');

      expect(result.version).toBe('1.1.0');
      expect(result.lastUpdated).toBeDefined();
    });

    it('should throw error when updating non-existent service', () => {
      expect(() => {
        registry.updateServiceVersion('nonexistent', '1.1.0');
      }).toThrow('Service nonexistent not found');
    });

    it('should get service by ID', () => {
      registry.registerService('backend', {
        name: 'Backend Service',
        version: '1.0.0'
      });

      const service = registry.getService('backend');

      expect(service.id).toBe('backend');
      expect(service.name).toBe('Backend Service');
    });

    it('should return undefined for non-existent service', () => {
      const service = registry.getService('nonexistent');
      expect(service).toBeUndefined();
    });

    it('should get all services', () => {
      registry.registerService('backend', {
        name: 'Backend Service',
        version: '1.0.0'
      });

      registry.registerService('frontend', {
        name: 'Frontend Service',
        version: '1.0.0'
      });

      const services = registry.getAllServices();

      expect(services).toHaveLength(2);
      expect(services[0].id).toBe('backend');
      expect(services[1].id).toBe('frontend');
    });

    it('should unregister service', () => {
      registry.registerService('backend', {
        name: 'Backend Service',
        version: '1.0.0'
      });

      const deleted = registry.unregisterService('backend');
      expect(deleted).toBe(true);

      const service = registry.getService('backend');
      expect(service).toBeUndefined();
    });

    it('should return false when unregistering non-existent service', () => {
      const deleted = registry.unregisterService('nonexistent');
      expect(deleted).toBe(false);
    });
  });

  describe('Compatibility Matrix', () => {
    beforeEach(() => {
      registry.setCompatibilityMatrix({
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
      });
    });

    it('should validate compatible and tested versions', () => {
      const result = registry.validateCompatibility('backend', '1.0.0', 'frontend', '1.0.0');

      expect(result.compatible).toBe(true);
      expect(result.status).toBe('tested');
      expect(result.message).toBe('Combination has been tested');
      expect(result.testedDate).toBe('2024-01-01');
    });

    it('should validate compatible but untested versions', () => {
      const result = registry.validateCompatibility('backend', '1.0.0', 'scraper', '0.5.0');

      expect(result.compatible).toBe(true);
      expect(result.status).toBe('compatible');
      expect(result.message).toBe('Versions appear compatible');
    });

    it('should detect incompatible versions', () => {
      const result = registry.validateCompatibility('backend', '0.9.0', 'frontend', '1.0.0');

      expect(result.compatible).toBe(false);
      expect(result.status).toBe('incompatible');
      expect(result.requirements).toBeDefined();
    });

    it('should handle unknown service combinations', () => {
      const result = registry.validateCompatibility('unknown1', '1.0.0', 'unknown2', '1.0.0');

      expect(result.compatible).toBe(false);
      expect(result.status).toBe('unknown');
      expect(result.message).toContain('No compatibility data available');
    });

    it('should work with reverse key order', () => {
      const result = registry.validateCompatibility('frontend', '1.0.0', 'backend', '1.0.0');

      expect(result.compatible).toBe(true);
      expect(result.status).toBe('tested');
    });
  });

  describe('Valid Versions', () => {
    beforeEach(() => {
      registry.registerService('backend', {
        name: 'Backend Service',
        version: '1.0.0'
      });

      registry.registerService('frontend', {
        name: 'Frontend Service',
        version: '1.0.0'
      });

      registry.setCompatibilityMatrix({
        'backend:frontend': {
          versionRangeA: '>=1.0.0',
          versionRangeB: '>=1.0.0',
          tested: true
        }
      });
    });

    it('should return valid versions for service with constraints', () => {
      const result = registry.getValidVersionsForService('frontend', 'backend', '1.0.0');

      expect(result.service).toBe('frontend');
      expect(result.validVersions).toEqual(['1.0.0']);
      expect(result.compatibleRange).toBe('>=1.0.0');
    });

    it('should throw error for non-existent target service', () => {
      expect(() => {
        registry.getValidVersionsForService('nonexistent', 'backend', '1.0.0');
      }).toThrow('Service nonexistent not found');
    });

    it('should return service version when no constraints exist', () => {
      const result = registry.getValidVersionsForService('backend', 'unknown', '1.0.0');

      expect(result.service).toBe('backend');
      expect(result.validVersions).toEqual(['1.0.0']);
      expect(result.message).toBe('No compatibility constraints defined');
    });
  });

  describe('Application Configuration', () => {
    beforeEach(() => {
      registry.registerService('backend', {
        name: 'Backend Service',
        version: '1.0.0'
      });

      registry.registerService('frontend', {
        name: 'Frontend Service',
        version: '1.0.0'
      });

      registry.registerService('scraper', {
        name: 'Scraper Service',
        version: '0.5.0'
      });

      registry.setApplicationConfig('figure-collector', '2.0.0', {
        requiredServices: [
          { serviceId: 'backend', versionRange: '>=1.0.0' },
          { serviceId: 'frontend', versionRange: '>=1.0.0' },
          { serviceId: 'scraper', versionRange: '>=0.6.0' }
        ]
      });
    });

    it('should return application services with compatibility info', () => {
      const result = registry.getApplicationServices('figure-collector', '2.0.0');

      expect(result.application).toBe('figure-collector');
      expect(result.version).toBe('2.0.0');
      expect(result.services).toHaveLength(3);
      expect(result.allCompatible).toBe(false);

      const scraperService = result.services.find(s => s.id === 'scraper');
      expect(scraperService.isCompatible).toBe(false);
      expect(scraperService.requiredVersionRange).toBe('>=0.6.0');
    });

    it('should return all services when no configuration exists', () => {
      const result = registry.getApplicationServices('unknown-app', '1.0.0');

      expect(result.application).toBe('unknown-app');
      expect(result.services).toHaveLength(3);
      expect(result.message).toContain('No specific application configuration found');
    });

    it('should validate application service combination', () => {
      const serviceVersions = {
        backend: '1.0.0',
        frontend: '1.0.0',
        scraper: '0.5.0'
      };

      const result = registry.validateApplicationServiceCombination(
        'figure-collector',
        '2.0.0',
        serviceVersions
      );

      expect(result.application).toBe('figure-collector');
      expect(result.allValid).toBe(false);
      expect(result.results).toHaveLength(3);

      const backendResult = result.results.find(r => r.serviceId === 'backend');
      expect(backendResult.status).toBe('valid');

      const scraperResult = result.results.find(r => r.serviceId === 'scraper');
      expect(scraperResult.status).toBe('invalid');
    });

    it('should handle unknown services in validation', () => {
      const serviceVersions = {
        unknown: '1.0.0'
      };

      const result = registry.validateApplicationServiceCombination(
        'figure-collector',
        '2.0.0',
        serviceVersions
      );

      expect(result.results[0].status).toBe('unknown');
      expect(result.results[0].message).toBe('Service not required for this application version');
    });
  });
});