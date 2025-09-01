const { createApp, loadVersionData } = require('./app');

const PORT = process.env.PORT;

// Load version data
const versionData = loadVersionData();

// Create app with version data
const app = createApp(versionData);

// Start server
app.listen(PORT, () => {
  console.log(`[VERSION-MANAGER] Server running on port ${PORT}`);
  console.log(`[VERSION-MANAGER] Health check: http://localhost:${PORT}/health`);
  console.log(`[VERSION-MANAGER] App version: http://localhost:${PORT}/app-version`);
  console.log(`[VERSION-MANAGER] Validate versions: http://localhost:${PORT}/validate-versions`);
  console.log(`[VERSION-MANAGER] App info loaded:`, {
    name: versionData?.application?.name,
    version: versionData?.application?.version,
    releaseDate: versionData?.application?.releaseDate
  });
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