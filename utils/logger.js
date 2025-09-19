/**
 * Production-safe debug logging utility for Version Manager Service
 *
 * Enable debug logging by setting environment variables:
 * - DEBUG=* (all debug logs)
 * - DEBUG=version:* (all version-manager logs)
 * - DEBUG=version:registry (service registry logs)
 * - DEBUG=version:compatibility (compatibility checking logs)
 * - DEBUG=version:auth (authentication logs)
 * - SERVICE_AUTH_TOKEN_DEBUG=true (show partial token for debugging, NEVER full token)
 */

class DebugLogger {
  constructor() {
    this.enabledNamespaces = this.parseDebugEnv();
    this.tokenDebug = process.env.SERVICE_AUTH_TOKEN_DEBUG === 'true';
  }

  parseDebugEnv() {
    const debugEnv = process.env.DEBUG || '';
    if (!debugEnv) return new Set();

    if (debugEnv === '*') {
      return new Set(['*']);
    }

    return new Set(
      debugEnv.split(',')
        .map(ns => ns.trim())
        .filter(ns => ns.length > 0)
    );
  }

  isNamespaceEnabled(namespace) {
    if (this.enabledNamespaces.has('*')) return true;
    if (this.enabledNamespaces.has(namespace)) return true;

    // Check for wildcard patterns like version:*
    for (const pattern of this.enabledNamespaces) {
      if (pattern.endsWith(':*')) {
        const prefix = pattern.slice(0, -1); // Remove the *
        if (namespace.startsWith(prefix)) return true;
      }
    }

    return false;
  }

  sanitizeData(data) {
    if (!data) return data;

    // Create a deep copy to avoid modifying the original
    const sanitized = JSON.parse(JSON.stringify(data));

    // Sanitize sensitive fields
    const sensitiveFields = ['token', 'password', 'secret', 'key', 'authorization'];

    const sanitizeObject = (obj) => {
      for (const key in obj) {
        const lowerKey = key.toLowerCase();

        if (sensitiveFields.some(field => lowerKey.includes(field))) {
          if (typeof obj[key] === 'string' && obj[key].length > 0) {
            // For tokens, show partial if debug enabled
            if (lowerKey.includes('token') && this.tokenDebug) {
              obj[key] = obj[key].substring(0, 8) + '...' + obj[key].slice(-4);
            } else {
              obj[key] = '[REDACTED]';
            }
          }
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
          sanitizeObject(obj[key]);
        }
      }
    };

    if (typeof sanitized === 'object' && sanitized !== null) {
      sanitizeObject(sanitized);
    }

    return sanitized;
  }

  debug(namespace, message, data) {
    if (!this.isNamespaceEnabled(namespace)) return;

    const timestamp = new Date().toISOString();
    const sanitizedData = this.sanitizeData(data);

    console.log(`[${timestamp}] [DEBUG] [${namespace}] ${message}`,
      sanitizedData ? JSON.stringify(sanitizedData, null, 2) : '');
  }

  info(message, data) {
    const timestamp = new Date().toISOString();
    const sanitizedData = this.sanitizeData(data);

    console.log(`[${timestamp}] [INFO] ${message}`,
      sanitizedData ? JSON.stringify(sanitizedData, null, 2) : '');
  }

  warn(message, data) {
    const timestamp = new Date().toISOString();
    const sanitizedData = this.sanitizeData(data);

    console.warn(`[${timestamp}] [WARN] ${message}`,
      sanitizedData ? JSON.stringify(sanitizedData, null, 2) : '');
  }

  error(message, error) {
    const timestamp = new Date().toISOString();

    // Handle Error objects specially
    let errorData;
    if (error instanceof Error) {
      errorData = {
        message: error.message,
        stack: error.stack,
        name: error.name
      };
    } else {
      errorData = this.sanitizeData(error);
    }

    console.error(`[${timestamp}] [ERROR] ${message}`,
      errorData ? JSON.stringify(errorData, null, 2) : '');
  }
}

// Export singleton instance
const logger = new DebugLogger();

// Export debug helpers for specific namespaces
const versionDebug = {
  registry: (message, data) => logger.debug('version:registry', message, data),
  compatibility: (message, data) => logger.debug('version:compatibility', message, data),
  auth: (message, data) => logger.debug('version:auth', message, data),
  api: (message, data) => logger.debug('version:api', message, data),
};

module.exports = {
  logger,
  versionDebug
};