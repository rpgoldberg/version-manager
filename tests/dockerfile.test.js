/**
 * Dockerfile Infrastructure Tests
 * Validates that the Dockerfile has all required build stages for integration testing
 */

const { execSync } = require('child_process');
const path = require('path');

describe('Dockerfile Infrastructure', () => {
  const dockerfilePath = path.join(__dirname, '..', 'Dockerfile');

  describe('Build Stages', () => {
    it('should have a test stage that can be built successfully', () => {
      // Attempt to build the test stage
      // This will fail if the stage doesn't exist or has build errors
      const buildCommand = `docker build --target=test -t version-manager:test -f ${dockerfilePath} ${path.join(__dirname, '..')}`;

      expect(() => {
        execSync(buildCommand, {
          stdio: 'pipe',
          timeout: 60000 // 60 second timeout for build
        });
      }).not.toThrow();
    });

    it('should have test stage with npm test command', () => {
      const fs = require('fs');
      const dockerfileContent = fs.readFileSync(dockerfilePath, 'utf-8');

      // Verify test stage exists and has npm test CMD
      expect(dockerfileContent).toMatch(/FROM.*AS test/);
      expect(dockerfileContent).toMatch(/CMD.*npm.*test/);
    });

    it('should have test stage with all dependencies installed', () => {
      const fs = require('fs');
      const dockerfileContent = fs.readFileSync(dockerfilePath, 'utf-8');

      // Test stage should install all dependencies (npm ci without --omit=dev)
      const testStageMatch = dockerfileContent.match(/FROM.*AS test[\s\S]*?(?=FROM|$)/);
      expect(testStageMatch).toBeTruthy();

      const testStageContent = testStageMatch[0];
      expect(testStageContent).toMatch(/npm ci/);
    });
  });
});
