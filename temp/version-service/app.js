const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const semver = require('semver');

// Create Express app
const createApp = (versionData) => {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());

  // Health check endpoints
  app.get('/', (req, res) => {
    res.json({ 
      status: 'healthy', 
      service: 'version-service',
      timestamp: new Date().toISOString()
    });
  });

  app.get('/health', (req, res) => {
    res.json({ 
      status: 'healthy', 
      service: 'version-service',
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