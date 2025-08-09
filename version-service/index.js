const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3020;

// Middleware
app.use(cors());
app.use(express.json());

// Load version.json at startup
let versionData = null;
try {
  const versionPath = path.join(__dirname, './version.json');
  versionData = JSON.parse(fs.readFileSync(versionPath, 'utf8'));
  console.log('Loaded version data:', versionData.application);
} catch (error) {
  console.error('Failed to load version.json:', error.message);
  process.exit(1);
}

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
  
  // Check if this combination exists in tested combinations
  const testedCombinations = versionData.compatibility.testedCombinations || [];
  const matchingCombo = testedCombinations.find(combo => 
    combo.backend === backend && 
    combo.frontend === frontend && 
    combo.scraper === scraper
  );
  
  if (matchingCombo) {
    return res.json({
      valid: true,
      status: 'tested',
      verified: matchingCombo.verified,
      message: 'This service combination has been tested and verified'
    });
  }
  
  // Check individual service versions against expected ranges
  const dependencies = versionData.dependencies || {};
  const warnings = [];
  
  // Check if versions meet dependency requirements (simplified semver check)
  if (dependencies.backend && dependencies.backend.scraper) {
    const requiredScraperVersion = dependencies.backend.scraper.replace('^', '');
    if (scraper !== requiredScraperVersion) {
      warnings.push(`Backend expects scraper ${dependencies.backend.scraper}, got ${scraper}`);
    }
  }
  
  if (dependencies.frontend && dependencies.frontend.backend) {
    const requiredBackendVersion = dependencies.frontend.backend.replace('^', '');
    if (backend !== requiredBackendVersion) {
      warnings.push(`Frontend expects backend ${dependencies.frontend.backend}, got ${backend}`);
    }
  }
  
  res.json({
    valid: warnings.length === 0,
    status: warnings.length === 0 ? 'compatible' : 'warning',
    warnings: warnings,
    message: warnings.length === 0 
      ? 'Service versions appear compatible but untested'
      : 'Service versions may have compatibility issues'
  });
});

// Get all version info (for debugging)
app.get('/version-info', (req, res) => {
  res.json(versionData);
});

// Start server
app.listen(PORT, () => {
  console.log(`[VERSION-SERVICE] Server running on port ${PORT}`);
  console.log(`[VERSION-SERVICE] Health check: http://localhost:${PORT}/health`);
  console.log(`[VERSION-SERVICE] App version: http://localhost:${PORT}/app-version`);
  console.log(`[VERSION-SERVICE] Validate versions: http://localhost:${PORT}/validate-versions`);
  console.log(`[VERSION-SERVICE] App info loaded:`, {
    name: versionData?.application?.name,
    version: versionData?.application?.version,
    releaseDate: versionData?.application?.releaseDate
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[VERSION-SERVICE] Received SIGTERM, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('[VERSION-SERVICE] Received SIGINT, shutting down gracefully');
  process.exit(0);
});