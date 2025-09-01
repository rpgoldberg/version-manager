# Version Manager Service Claude Configuration

## Technology Stack
- Node.js
- JavaScript
- Lightweight Version Coordination Service
- Jest for Testing

## Service-Specific Testing Approaches

### Testing Configurations
- Comprehensive configuration handling tests
- Version validation and comparison
- Error handling scenarios
- Inter-service communication tests

### Test Modes
- Unit Tests: Version logic validation
- Configuration Tests: Environment settings
- Integration Tests: Service communication
- Error Handling Tests: Resilience scenarios
- Signal Handling Tests: SIGTERM/SIGINT verification
- Enhanced Index.js Coverage: Startup and shutdown validation

## Development Workflow

### Key Development Commands
- `npm run dev`: Start development server
- `npm run test`: Run all tests
- `npm run test:unit`: Run unit tests
- `npm run test:config`: Test configuration handling
- `npm run test:integration`: Test inter-service communication
- `npm run lint`: Run JavaScript linter

### Port Configuration Improvements
- Removed hardcoded port defaults
- Full environment-variable driven configuration
- Standard port mappings:
  - Development: 3006
  - Test: 3011
  - Production: 3001
- Dynamic port configuration for flexibility and security

## Available Sub-Agents

### Atomic Task Agents (Haiku Model)
- **`test-generator-version-manager`**: Jest + Supertest test generation for version service
  - Version comparison logic testing
  - Configuration validation tests
  - Error handling scenarios
  - Inter-service communication tests
  
- **`documentation-manager`**: Documentation synchronization specialist
  - Updates README and API docs after code changes
  - Maintains documentation accuracy
  - Synchronizes docs with code modifications
  
- **`validation-gates`**: Testing and validation specialist
  - Runs comprehensive test suites
  - Validates code quality gates
  - Iterates on fixes until all tests pass
  - Ensures production readiness

## Agent Invocation Instructions

### Manual Orchestration Pattern (Required)
Use TodoWrite to plan tasks, then call sub-agents directly with proper Haiku configuration:

```
Task:
subagent_type: test-generator-version-manager
description: Generate comprehensive version service tests
prompt:
MODEL_OVERRIDE: claude-3-haiku-20240307
AGENT_MODEL: haiku

ATOMIC TASK: Create comprehensive Jest test suite for version-manager service

REQUIREMENTS:
- Generate tests for all API endpoints
- Mock file system operations  
- Test configuration loading and error handling
- Achieve >90% code coverage
- Follow existing test patterns

Start with: I am using claude-3-haiku-20240307 to generate comprehensive tests for version-manager service.
```

### Post-Implementation Validation
Always call validation-gates after implementing features:

```
Task:
subagent_type: validation-gates
description: Validate version service implementation
prompt:
MODEL_OVERRIDE: claude-3-haiku-20240307

ATOMIC TASK: Validate all tests pass and quality gates are met

FEATURES IMPLEMENTED: [Specify what was implemented]
VALIDATION NEEDED: Run test suite, check coverage, ensure quality

Start with: I am using claude-3-haiku-20240307 to validate implementation quality.
```

### Documentation Updates
Call documentation-manager after code changes:

```
Task:
subagent_type: documentation-manager  
description: Update documentation after changes
prompt:
MODEL_OVERRIDE: claude-3-haiku-20240307

ATOMIC TASK: Synchronize documentation with code changes

FILES CHANGED: [List of modified files]
CHANGES MADE: [Brief description of changes]

Start with: I am using claude-3-haiku-20240307 to update documentation.
```

## Atomic Task Principles
- Test individual version validation functions
- Validate configuration parsing
- Simulate various version scenarios
- Ensure robust error handling
- Test inter-service version communication

## Version Validation Test Example
```javascript
describe('Version Service', () => {
  it('correctly compares semantic versions', () => {
    const versionService = new VersionService();
    
    expect(versionService.isGreaterThan('1.2.3', '1.2.2')).toBe(true);
    expect(versionService.isGreaterThan('1.2.3', '1.3.0')).toBe(false);
  });
});
```

## File Structure

```
.claude/
├── agents/
│   ├── test-generator-version-manager.md
│   ├── documentation-manager.md
│   └── validation-gates.md
└── commands/
    └── primer.md
```

## Quality Assurance Workflow

1. **Implementation**: Write code changes
2. **Testing**: Call `test-generator-version-manager` if new tests needed
3. **Validation**: Call `validation-gates` to ensure quality
4. **Documentation**: Call `documentation-manager` to update docs
5. **Verification**: Confirm all tests pass and docs are current