const { createApp, loadVersionData } = require('./app');

const PORT = process.env.PORT;

// Load version data
const versionData = loadVersionData();

// Create app with version data
const app = createApp(versionData);

// Function to register Version-Manager with itself
const registerSelf = async () => {
  const packageJson = require('./package.json');
  const serviceAuthToken = process.env.SERVICE_AUTH_TOKEN;

  if (!serviceAuthToken) {
    console.warn('[VERSION-MANAGER] SERVICE_AUTH_TOKEN not configured - skipping self-registration');
    return;
  }

  const registrationData = {
    serviceId: 'version-manager',
    name: 'Figure Collector Version Manager',
    version: packageJson.version,
    endpoints: {
      health: `http://version-manager:${PORT}/health`,
      appVersion: `http://version-manager:${PORT}/app-version`,
      validateVersions: `http://version-manager:${PORT}/validate-versions`,
      services: `http://version-manager:${PORT}/services`
    },
    dependencies: {}
  };

  try {
    const response = await fetch(`http://localhost:${PORT}/services/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceAuthToken}`
      },
      body: JSON.stringify(registrationData)
    });

    if (response.ok) {
      const result = await response.json();
      console.log(`[VERSION-MANAGER] Successfully self-registered:`, result.service);
    } else {
      const error = await response.text();
      console.warn(`[VERSION-MANAGER] Failed to self-register: ${response.status} - ${error}`);
    }
  } catch (error) {
    console.warn(`[VERSION-MANAGER] Self-registration failed:`, error.message);
  }
};

// Start server
app.listen(PORT, async () => {
  console.log(`[VERSION-MANAGER] Server running on port ${PORT}`);
  console.log(`[VERSION-MANAGER] Health check: http://localhost:${PORT}/health`);
  console.log(`[VERSION-MANAGER] App version: http://localhost:${PORT}/app-version`);
  console.log(`[VERSION-MANAGER] Validate versions: http://localhost:${PORT}/validate-versions`);
  console.log(`[VERSION-MANAGER] App info loaded:`, {
    name: versionData?.application?.name,
    version: versionData?.application?.version,
    releaseDate: versionData?.application?.releaseDate
  });

  // Register Version-Manager with itself after a short delay
  setTimeout(() => {
    console.log('[VERSION-MANAGER] Attempting self-registration...');
    registerSelf();
  }, 1000);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[VERSION-MANAGER] Received SIGTERM, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('[VERSION-MANAGER] Received SIGINT, shutting down gracefully');
  process.exit(0);
});