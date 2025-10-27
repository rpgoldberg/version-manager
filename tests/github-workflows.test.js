/**
 * GitHub Actions Workflow Configuration Tests
 *
 * Validates CI/CD pipeline configurations align with infrastructure:
 * - Node.js version consistency with Dockerfile
 * - Docker multi-stage build validation (test + production stages)
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

describe('GitHub Actions Workflows Configuration', () => {
  describe('build.yml - Build and Test Workflow', () => {
    let buildWorkflow;

    beforeAll(() => {
      const workflowPath = path.join(__dirname, '../.github/workflows/build.yml');
      const workflowContent = fs.readFileSync(workflowPath, 'utf8');
      buildWorkflow = yaml.load(workflowContent);
    });

    it('should use Node.js 25 to match Dockerfile', () => {
      const setupNodeStep = buildWorkflow.jobs.build.steps.find(
        step => step.name === 'Setup Node.js'
      );

      expect(setupNodeStep).toBeDefined();
      expect(setupNodeStep.with['node-version']).toBe('25');
    });

    it('should run tests as part of the build', () => {
      const testStep = buildWorkflow.jobs.build.steps.find(
        step => step.name === 'Run tests'
      );

      expect(testStep).toBeDefined();
      expect(testStep.run).toBe('npm test');
    });

    it('should generate coverage reports', () => {
      const coverageStep = buildWorkflow.jobs.build.steps.find(
        step => step.name === 'Run test coverage'
      );

      expect(coverageStep).toBeDefined();
      expect(coverageStep.run).toBe('npm run test:coverage');
    });
  });

  describe('docker-publish.yml - Docker Build and Security Workflow', () => {
    let dockerWorkflow;

    beforeAll(() => {
      const workflowPath = path.join(__dirname, '../.github/workflows/docker-publish.yml');
      const workflowContent = fs.readFileSync(workflowPath, 'utf8');
      dockerWorkflow = yaml.load(workflowContent);
    });

    it('should build and validate production stage', () => {
      const buildStep = dockerWorkflow.jobs['build-and-push'].steps.find(
        step => step.name === 'Build and push Docker image'
      );

      expect(buildStep).toBeDefined();
      expect(buildStep.with.target).toBe('production');
    });

    it('should include test stage validation job', () => {
      // Test stage validation ensures Docker test stage builds successfully
      // This prevents deployment of broken test infrastructure
      const testStageJob = dockerWorkflow.jobs['test-stage-validation'];

      expect(testStageJob).toBeDefined();
      expect(testStageJob['runs-on']).toBe('ubuntu-latest');
    });

    it('should validate test stage builds successfully', () => {
      const testStageJob = dockerWorkflow.jobs['test-stage-validation'];

      const buildTestStageStep = testStageJob.steps.find(
        step => step.name === 'Build Docker test stage'
      );

      expect(buildTestStageStep).toBeDefined();
      expect(buildTestStageStep.uses).toContain('docker/build-push-action');
      expect(buildTestStageStep.with.target).toBe('test');
      expect(buildTestStageStep.with.push).toBe(false); // Don't push test stage
      expect(buildTestStageStep.with.load).toBe(true);  // Load for local validation
    });

    it('should run test stage validation before production build', () => {
      const buildAndPushJob = dockerWorkflow.jobs['build-and-push'];

      // If test stage validation exists, it should be a dependency
      if (dockerWorkflow.jobs['test-stage-validation']) {
        expect(buildAndPushJob.needs).toContain('test-stage-validation');
      }
    });
  });

  describe('Workflow Consistency', () => {
    it('should align Node version across build workflow and Dockerfile', () => {
      // Read Dockerfile to extract Node version
      const dockerfilePath = path.join(__dirname, '../Dockerfile');
      const dockerfileContent = fs.readFileSync(dockerfilePath, 'utf8');

      // Extract Node version from FROM node:XX-alpine line
      const nodeVersionMatch = dockerfileContent.match(/FROM node:(\d+)-alpine/);
      expect(nodeVersionMatch).toBeTruthy();

      const dockerfileNodeVersion = nodeVersionMatch[1];

      // Read build.yml workflow
      const buildWorkflowPath = path.join(__dirname, '../.github/workflows/build.yml');
      const buildWorkflowContent = fs.readFileSync(buildWorkflowPath, 'utf8');
      const buildWorkflow = yaml.load(buildWorkflowContent);

      const setupNodeStep = buildWorkflow.jobs.build.steps.find(
        step => step.name === 'Setup Node.js'
      );

      const workflowNodeVersion = setupNodeStep.with['node-version'];

      // Versions should match
      expect(workflowNodeVersion).toBe(dockerfileNodeVersion);
      expect(dockerfileNodeVersion).toBe('25');
    });
  });
});
