const semver = require('semver');

class ServiceRegistry {
  constructor() {
    this.services = new Map();
    this.compatibilityMatrix = new Map();
    this.applicationConfigs = new Map();
  }

  registerService(serviceId, serviceData) {
    const { name, version, endpoints, dependencies = {} } = serviceData;
    
    if (!semver.valid(version)) {
      throw new Error(`Invalid semantic version: ${version}`);
    }

    const service = {
      id: serviceId,
      name,
      version,
      endpoints,
      dependencies,
      registeredAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };

    this.services.set(serviceId, service);
    return service;
  }

  updateServiceVersion(serviceId, version) {
    const service = this.services.get(serviceId);
    if (!service) {
      throw new Error(`Service ${serviceId} not found`);
    }

    if (!semver.valid(version)) {
      throw new Error(`Invalid semantic version: ${version}`);
    }

    service.version = version;
    service.lastUpdated = new Date().toISOString();
    
    this.services.set(serviceId, service);
    return service;
  }

  getService(serviceId) {
    return this.services.get(serviceId);
  }

  getAllServices() {
    return Array.from(this.services.values());
  }

  unregisterService(serviceId) {
    return this.services.delete(serviceId);
  }

  setCompatibilityMatrix(matrix) {
    if (matrix instanceof Map) {
      this.compatibilityMatrix = new Map(matrix);
    } else {
      this.compatibilityMatrix = new Map(Object.entries(matrix));
    }
  }

  validateCompatibility(serviceA, versionA, serviceB, versionB) {
    const key = `${serviceA}:${serviceB}`;
    const reverseKey = `${serviceB}:${serviceA}`;
    
    let compatibility = this.compatibilityMatrix.get(key) || this.compatibilityMatrix.get(reverseKey);
    
    if (!compatibility) {
      return {
        compatible: false,
        status: 'unknown',
        message: `No compatibility data available for ${serviceA} and ${serviceB}`
      };
    }

    const isACompatible = semver.satisfies(versionA, compatibility.versionRangeA || '*');
    const isBCompatible = semver.satisfies(versionB, compatibility.versionRangeB || '*');
    
    if (!isACompatible || !isBCompatible) {
      return {
        compatible: false,
        status: 'incompatible',
        message: `Version compatibility check failed`,
        requirements: {
          [serviceA]: compatibility.versionRangeA || '*',
          [serviceB]: compatibility.versionRangeB || '*'
        }
      };
    }

    return {
      compatible: true,
      status: compatibility.tested ? 'tested' : 'compatible',
      message: compatibility.tested ? 'Combination has been tested' : 'Versions appear compatible',
      testedDate: compatibility.testedDate
    };
  }

  getValidVersionsForService(targetService, dependentService, dependentVersion) {
    const targetServiceData = this.services.get(targetService);
    if (!targetServiceData) {
      throw new Error(`Service ${targetService} not found`);
    }

    const key = `${targetService}:${dependentService}`;
    const reverseKey = `${dependentService}:${targetService}`;
    
    let compatibility = this.compatibilityMatrix.get(key) || this.compatibilityMatrix.get(reverseKey);
    
    if (!compatibility) {
      return {
        service: targetService,
        validVersions: [targetServiceData.version],
        message: 'No compatibility constraints defined'
      };
    }

    // Check if dependent version satisfies its required range
    const dependentServiceData = this.services.get(dependentService);
    if (dependentServiceData && !semver.satisfies(dependentVersion, compatibility.versionRangeB || '*')) {
      return {
        service: targetService,
        validVersions: [],
        message: `Dependent service version ${dependentVersion} is not compatible`
      };
    }

    // Check if target service version satisfies its required range  
    if (!semver.satisfies(targetServiceData.version, compatibility.versionRangeA || '*')) {
      return {
        service: targetService,
        validVersions: [],
        message: `Target service version ${targetServiceData.version} is not compatible`
      };
    }

    return {
      service: targetService,
      validVersions: [targetServiceData.version],
      compatibleRange: compatibility.versionRangeA || '*',
      message: 'Based on current compatibility matrix'
    };
  }

  setApplicationConfig(applicationId, applicationVersion, config) {
    const appKey = `${applicationId}:${applicationVersion}`;
    this.applicationConfigs.set(appKey, {
      ...config,
      lastUpdated: new Date().toISOString()
    });
  }

  getApplicationServices(applicationId, applicationVersion) {
    const appKey = `${applicationId}:${applicationVersion}`;
    const config = this.applicationConfigs.get(appKey);
    
    if (!config) {
      return {
        application: applicationId,
        version: applicationVersion,
        services: this.getAllServices(),
        message: 'No specific application configuration found, showing all services'
      };
    }

    const requiredServices = config.requiredServices || [];
    const services = requiredServices.map(req => {
      const service = this.services.get(req.serviceId);
      return {
        ...service,
        requiredVersionRange: req.versionRange,
        isCompatible: service ? semver.satisfies(service.version, req.versionRange) : false
      };
    }).filter(Boolean);

    return {
      application: applicationId,
      version: applicationVersion,
      services,
      allCompatible: services.every(s => s.isCompatible)
    };
  }

  validateApplicationServiceCombination(applicationId, applicationVersion, serviceVersions) {
    const appServices = this.getApplicationServices(applicationId, applicationVersion);
    const results = [];
    let allValid = true;

    for (const [serviceId, version] of Object.entries(serviceVersions)) {
      const requiredService = appServices.services.find(s => s.id === serviceId);
      
      if (!requiredService) {
        results.push({
          serviceId,
          version,
          status: 'unknown',
          message: 'Service not required for this application version'
        });
        continue;
      }

      const isValid = semver.satisfies(version, requiredService.requiredVersionRange);
      if (!isValid) {
        allValid = false;
      }

      results.push({
        serviceId,
        version,
        status: isValid ? 'valid' : 'invalid',
        requiredRange: requiredService.requiredVersionRange,
        message: isValid ? 'Version meets requirements' : 'Version does not meet requirements'
      });
    }

    return {
      application: applicationId,
      version: applicationVersion,
      allValid,
      results
    };
  }
}

module.exports = ServiceRegistry;