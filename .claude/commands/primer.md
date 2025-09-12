## Version Manager Service Primer

**Initialize as VERSION MANAGER ORCHESTRATOR.**

### Quick Service Scan
```bash
# Health check
test -f app.js && echo "✓ Express app"
test -f package.json && echo "✓ Dependencies"
test -f version.json && echo "✓ Version data"
test -f service-registry.js && echo "✓ Registry"
```

### Architecture Load
- **Port**: 3001/3011/3006
- **Stack**: Node.js/JavaScript
- **Type**: Lightweight coordinator
- **Data**: version.json

### Component Map
```
/
├── app.js              # Express server
├── service-registry.js # Service tracking
├── version.json        # Version data
├── index.js            # Entry point
└── tests/              # Jest tests
```

### Your Agents (Sonnet)
- version-compatibility-guardian → Semver validation
- version-registry-manager → Service tracking
- version-config-specialist → Configuration
- version-test-validator → Jest testing

### API Endpoints
- `/app-version` → Application version
- `/validate-versions` → Compatibility check
- `/register` → Service registration
- `/services` → Registry status
- `/health` → Service health

### Test Commands
```bash
npm test              # All tests
npm run test:config   # Config tests
npm run test:registry # Registry tests
npm run coverage      # Coverage report
```

### Integration Points
- All services → Registration
- Deployment → Compatibility validation
- Monitoring → Health aggregation

### Status Protocol
Report to master orchestrator:
```
SERVICE: version-manager
TASK: [current]
STATUS: [state]
TESTS: [pass/total]
REGRESSION: [zero|detected]
```

**Ready. Zero regression mandate active.**