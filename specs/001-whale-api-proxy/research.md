# 研究：Whale API 代理服務

**日期**: 2025-09-25
**功能**: 001-whale-api-proxy

## 技術決策

### HTTP Client Library
**Decision**: Use NestJS built-in HttpModule (@nestjs/axios)
**Rationale**:
- Native integration with NestJS dependency injection
- Built-in support for interceptors and error handling
- Axios-based with observable support
- Consistent with NestJS architectural patterns

**Alternatives considered**:
- node-fetch: Lacks NestJS integration and interceptors
- axios directly: Would require manual DI setup and configuration

### Logging Implementation
**Decision**: Use NestJS built-in Logger with JSON format
**Rationale**:
- Built-in support for structured logging
- Configurable output format (JSON for production)
- Automatic request context tracking available
- Minimal additional dependencies

**Alternatives considered**:
- winston: More complex setup, unnecessary for simple proxy
- pino: Fast but requires additional configuration

### Request ID Generation
**Decision**: Use built-in NestJS request context or UUID library
**Rationale**:
- NestJS provides request correlation ID mechanisms
- UUID v4 for unique request identification
- Standard approach for distributed request tracking

**Alternatives considered**:
- Custom timestamp-based IDs: Less collision-resistant
- Incremental counters: Not suitable for distributed systems

### Error Handling Strategy
**Decision**: Use NestJS exception filters and HTTP exceptions
**Rationale**:
- Consistent with constitutional requirements for structured error responses
- Built-in support for HTTP status codes
- Automatic JSON error formatting
- Integration with logging interceptors

**Alternatives considered**:
- Manual try-catch: Less consistent and harder to maintain
- Custom error classes: Unnecessary complexity for simple proxy

### Validation Approach
**Decision**: class-validator with ValidationPipe
**Rationale**:
- Constitutional requirement for input validation
- Declarative validation rules in DTOs
- Automatic error response generation
- Integration with Swagger/OpenAPI documentation

**Alternatives considered**:
- Joi validation: Not TypeScript-native
- Manual validation: Error-prone and inconsistent

## Integration Patterns

### Whale API Integration
**Pattern**: HTTP proxy with request forwarding
**Key considerations**:
- Preserve original request headers (ny-operator)
- Forward exact request payload
- Handle upstream API errors gracefully
- Maintain response format fidelity

### Logging Pattern
**Pattern**: Structured logging with interceptors
**Key considerations**:
- Log request/response at controller level
- Include timestamp and requestId in all log entries
- Separate error logging from normal flow
- JSON format for machine readability

### Module Organization
**Pattern**: Feature module with controller and service separation
**Key considerations**:
- Single ProxyModule for organization
- ProxyController for endpoint definition
- ProxyService for business logic and HTTP calls
- Separate DTOs for request/response validation

## Best Practices Applied

### NestJS Patterns
- Module-based architecture
- Dependency injection for all services
- Interceptors for cross-cutting concerns (logging)
- Exception filters for error handling
- DTOs with validation decorators

### TypeScript Patterns
- Strict type checking enabled
- Interface definitions for external API responses
- Proper error type handling
- No 'any' types allowed

### Testing Patterns
- Unit tests for service layer
- Integration tests for controller layer
- E2E tests for complete request flow
- Mock external HTTP calls in unit tests

## Configuration Requirements

### Environment Variables
None required - Whale API URL is hardcoded per specification

### Dependencies to Add
- @nestjs/axios: For HTTP client functionality
- uuid: For request ID generation (if not using built-in context)

### Module Dependencies
- HttpModule: For external API calls
- Built-in Logger: For structured logging
- ValidationPipe: For request validation (already configured)

## Risk Assessment

### Low Risk Items
- Simple proxy functionality
- Well-defined API contract
- No database interactions
- No authentication complexity

### Medium Risk Items
- External API dependency (Whale API availability)
- Error response format consistency
- Request/response logging volume

### Mitigation Strategies
- Comprehensive error handling for upstream failures
- Timeout handling (though not explicitly required)
- Structured error responses with appropriate status codes
- Log level configuration to manage volume