const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const semver = require('semver');
const crypto = require('crypto');
const ServiceRegistry = require('./service-registry');

// Create Express app
const createApp = (versionData) => {
  const app = express();
  const serviceRegistry = new ServiceRegistry();

  // Initialize compatibility matrix from version data
  if (versionData && versionData.compatibility) {
    serviceRegistry.setCompatibilityMatrix(versionData.compatibility);
  }

  // Middleware
  app.use(cors());
  app.use(express.json());

  // Health check endpoints
  app.get('/', (req, res) => {
    res.json({ 
      status: 'healthy', 
      service: 'version-manager',
      timestamp: new Date().toISOString()
    });
  });

  app.get('/health', (req, res) => {
    res.json({ 
      status: 'healthy', 
      service: 'version-manager',
      timestamp: new Date().toISOString(),
      versionData: versionData ? 'loaded' : 'missing'
    });
  });

  // Get app version and release date
  app.get('/app-version', (req, res) => {
    if (!versionData || !versionData.application) {
      return res.status(500).json({ error: 'Version data not available' });
    }
    
    res.json({
      name: versionData.application.name,
      version: versionData.application.version,
      releaseDate: versionData.application.releaseDate,
      description: versionData.application.description || null
    });
  });

  // Validate service version combination
  app.get('/validate-versions', (req, res) => {
    const { backend, frontend, scraper } = req.query;
    
    if (!versionData || !versionData.compatibility) {
      return res.status(500).json({ error: 'Compatibility data not available' });
    }
    
    const testedCombinations = versionData.compatibility.testedCombinations || [];
    const dependencies = versionData.dependencies || {};
    const warnings = [];
    let status = 'compatible';
    let message = 'Service versions appear compatible but untested';
    let valid = true;
    let verifiedDate = null;
    
    // Check individual service versions against expected ranges
    if (dependencies.backend && dependencies.backend.scraper) {
      const requiredScraperVersion = dependencies.backend.scraper;
      if (!scraper || !semver.satisfies(scraper, requiredScraperVersion)) {
        warnings.push(`Backend expects scraper ${requiredScraperVersion}, got ${scraper || 'no version'}`);
      }
    }
    
    if (dependencies.frontend && dependencies.frontend.backend) {
      const requiredBackendVersion = dependencies.frontend.backend;
      if (!backend || !semver.satisfies(backend, requiredBackendVersion)) {
        warnings.push(`Frontend expects backend ${requiredBackendVersion}, got ${backend || 'no version'}`);
      }
    }
    
    // Find matching tested combination
    const matchingCombo = testedCombinations.find(combo => 
      combo.backend === backend && 
      combo.frontend === frontend && 
      combo.scraper === scraper
    );
    
    // Set status based on warnings and matching combination
    if (warnings.length > 0) {
      status = 'warning';
      message = 'Service versions may have compatibility issues';
      valid = false;
    }

    if (matchingCombo) {
      status = matchingCombo.verified ? 'tested' : 'compatible';
      message = matchingCombo.verified 
        ? 'This service combination has been tested and verified'
        : 'Service versions appear compatible but untested';
      verifiedDate = matchingCombo.verified;
      // If we have a verified tested combination, it's valid regardless of warnings
      if (matchingCombo.verified) {
        valid = true;
      }
    }

    const responseData = {
      valid: valid,
      status: status,
      warnings: warnings,
      message: message
    };

    if (verifiedDate) {
      responseData.verified = verifiedDate;
    }

    res.json(responseData);
  });

  // Service Registry Endpoints
  
  // Register a new service (requires authentication)
  app.post('/services/register', (req, res) => {
    try {
      // Check for service authentication token
      const authHeader = req.headers.authorization;
      const expectedToken = process.env.SERVICE_AUTH_TOKEN;

      if (!expectedToken) {
        console.error('[REGISTER] SERVICE_AUTH_TOKEN not configured - registration disabled');
        return res.status(503).json({
          error: 'Service registration is not configured'
        });
      }

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          error: 'Missing or invalid authorization header'
        });
      }

      const providedToken = authHeader.substring(7); // Remove 'Bearer ' prefix

      const providedTokenBuffer = Buffer.from(providedToken, 'utf8');
      const expectedTokenBuffer = Buffer.from(expectedToken, 'utf8');

      if (providedTokenBuffer.length !== expectedTokenBuffer.length || !crypto.timingSafeEqual(providedTokenBuffer, expectedTokenBuffer)) {
        return res.status(401).json({
          error: 'Invalid service authentication token'
        });
      }

      // Token is valid, proceed with registration
      const { serviceId, name, version, endpoints, dependencies } = req.body;

      if (!serviceId || !name || !version) {
        return res.status(400).json({
          error: 'Missing required fields: serviceId, name, version'
        });
      }

      const service = serviceRegistry.registerService(serviceId, {
        name,
        version,
        endpoints,
        dependencies
      });

      console.log(`[REGISTER] Service registered: ${serviceId} v${version}`);
      res.status(201).json({
        message: 'Service registered successfully',
        service
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  // Update service version
  app.put('/services/:serviceId/version', (req, res) => {
    try {
      const { serviceId } = req.params;
      const { version } = req.body;
      
      if (!version) {
        return res.status(400).json({ error: 'Version is required' });
      }

      const service = serviceRegistry.updateServiceVersion(serviceId, version);
      res.json({
        message: 'Service version updated successfully',
        service
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  // Get all registered services
  app.get('/services', (req, res) => {
    const services = serviceRegistry.getAllServices();
    res.json({
      count: services.length,
      services
    });
  });

  // Get specific service
  app.get('/services/:serviceId', (req, res) => {
    const { serviceId } = req.params;
    const service = serviceRegistry.getService(serviceId);
    
    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }
    
    res.json(service);
  });

  // Unregister service
  app.delete('/services/:serviceId', (req, res) => {
    const { serviceId } = req.params;
    const deleted = serviceRegistry.unregisterService(serviceId);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Service not found' });
    }
    
    res.json({ message: 'Service unregistered successfully' });
  });

  // Compatibility Endpoints
  
  // Validate compatibility between two services
  app.get('/compatibility/validate', (req, res) => {
    try {
      const { serviceA, versionA, serviceB, versionB } = req.query;
      
      if (!serviceA || !versionA || !serviceB || !versionB) {
        return res.status(400).json({ 
          error: 'Missing required query parameters: serviceA, versionA, serviceB, versionB' 
        });
      }

      const result = serviceRegistry.validateCompatibility(serviceA, versionA, serviceB, versionB);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get valid versions for a service given another service+version constraint
  app.get('/compatibility/versions/:serviceId', (req, res) => {
    try {
      const { serviceId } = req.params;
      const { dependentService, dependentVersion } = req.query;
      
      if (!dependentService || !dependentVersion) {
        return res.status(400).json({ 
          error: 'Missing required query parameters: dependentService, dependentVersion' 
        });
      }

      const result = serviceRegistry.getValidVersionsForService(serviceId, dependentService, dependentVersion);
      res.json(result);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  // Get full compatibility matrix
  app.get('/compatibility/matrix', (req, res) => {
    const matrix = Object.fromEntries(serviceRegistry.compatibilityMatrix);
    res.json({
      compatibilityMatrix: matrix,
      services: serviceRegistry.getAllServices().map(s => ({
        id: s.id,
        name: s.name,
        version: s.version
      }))
    });
  });

  // Application Coordination Endpoints
  
  // Get all services and their versions for an application version
  app.get('/applications/:appId/services', (req, res) => {
    try {
      const { appId } = req.params;
      const { version } = req.query;
      
      if (!version) {
        return res.status(400).json({ 
          error: 'Application version is required as query parameter' 
        });
      }

      const result = serviceRegistry.getApplicationServices(appId, version);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Validate if a service combination is valid/tested for an application version
  app.post('/applications/:appId/validate', (req, res) => {
    try {
      const { appId } = req.params;
      const { applicationVersion, serviceVersions } = req.body;
      
      if (!applicationVersion || !serviceVersions) {
        return res.status(400).json({ 
          error: 'Missing required fields: applicationVersion, serviceVersions' 
        });
      }

      const result = serviceRegistry.validateApplicationServiceCombination(
        appId, 
        applicationVersion, 
        serviceVersions
      );
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get valid service versions for an application version
  app.get('/applications/:appId/versions', (req, res) => {
    try {
      const { appId } = req.params;
      const { version } = req.query;
      
      if (!version) {
        return res.status(400).json({ 
          error: 'Application version is required as query parameter' 
        });
      }

      const result = serviceRegistry.getApplicationServices(appId, version);
      const validVersions = result.services.reduce((acc, service) => {
        if (service && service.id) {
          acc[service.id] = {
            currentVersion: service.version,
            requiredRange: service.requiredVersionRange || '*',
            isCompatible: service.isCompatible
          };
        }
        return acc;
      }, {});

      res.json({
        application: appId,
        version,
        validServiceVersions: validVersions,
        allCompatible: result.allCompatible
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Set application configuration (admin endpoint)
  app.post('/applications/:appId/config', (req, res) => {
    try {
      const { appId } = req.params;
      const { applicationVersion, requiredServices } = req.body;
      
      if (!applicationVersion || !requiredServices) {
        return res.status(400).json({ 
          error: 'Missing required fields: applicationVersion, requiredServices' 
        });
      }

      serviceRegistry.setApplicationConfig(appId, applicationVersion, {
        requiredServices
      });

      res.json({
        message: 'Application configuration set successfully',
        application: appId,
        version: applicationVersion
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get all version info (for debugging)
  app.get('/version-info', (req, res) => {
    res.json(versionData);
  });

  return app;
};

// Load version data
const loadVersionData = (versionPath = null) => {
  const actualPath = versionPath || process.env.VERSION_JSON_PATH || path.join(__dirname, './version.json');
  
  try {
    const data = JSON.parse(fs.readFileSync(actualPath, 'utf8'));
    if (!process.env.NODE_ENV || process.env.NODE_ENV !== 'test') {
      console.log('Loaded version data:', data.application);
    }
    return data;
  } catch (error) {
    if (!process.env.NODE_ENV || process.env.NODE_ENV !== 'test') {
      console.error('Failed to load version.json:', error.message);
      process.exit(1);
    }
    throw error;
  }
};

module.exports = { createApp, loadVersionData };