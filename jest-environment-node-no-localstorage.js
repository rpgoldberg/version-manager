/**
 * Custom Jest environment that extends node environment but disables localStorage
 * This fixes the "Cannot initialize local storage without a --localstorage-file path" error
 * that occurs in Node 25 with jest-environment-node
 */
const NodeEnvironment = require('jest-environment-node').TestEnvironment;

class NodeEnvironmentNoLocalStorage extends NodeEnvironment {
  constructor(config, context) {
    // Set localstorage option to false before calling parent constructor
    const modifiedConfig = {
      ...config,
      projectConfig: {
        ...config.projectConfig,
        testEnvironmentOptions: {
          ...config.projectConfig.testEnvironmentOptions,
          localstorage: false
        }
      }
    };

    super(modifiedConfig, context);
  }
}

module.exports = NodeEnvironmentNoLocalStorage;
