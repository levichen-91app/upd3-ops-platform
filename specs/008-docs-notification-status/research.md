# Research: Notification Status Devices API

**Feature**: 008-docs-notification-status
**Date**: 2025-09-28

## Technical Decisions

### HTTP Client for External API Integration

**Decision**: Use `@nestjs/axios` with `HttpService`
**Rationale**:
- Built-in NestJS integration with proper dependency injection
- RxJS observable support for timeout handling
- Easy mocking for unit tests
- Constitutional requirement for dependency abstraction support

**Alternatives considered**:
- Native `fetch` - Less NestJS integration
- `node-fetch` - Additional dependency, no RxJS support
- `got` - Good features but not NestJS native

### Authentication Strategy

**Decision**: Custom header guard for 'ny-operator' validation
**Rationale**:
- Simple implementation matching clarified requirements
- No complex JWT/OAuth overhead needed for internal operations API
- Easy to implement as NestJS guard

**Alternatives considered**:
- JWT tokens - Overkill for internal operations
- API key database - Unnecessary complexity for single header value

### Error Handling Pattern

**Decision**: Use NestJS exception filters with standardized error response format
**Rationale**:
- Consistent with constitutional API design standards
- Centralized error handling for all endpoint responses
- Easy to implement standard success/error response structure

**Alternatives considered**:
- Manual error handling in controller - Less consistent
- Third-party error libraries - Unnecessary dependency

### Validation Strategy

**Decision**: Use `class-validator` with DTOs for request validation
**Rationale**:
- Built-in NestJS support
- Declarative validation rules
- Automatic Swagger documentation generation
- Constitutional requirement for API documentation

**Alternatives considered**:
- Manual validation - More code, less maintainable
- Joi validation - Extra dependency when class-validator is NestJS standard

### Timeout Implementation

**Decision**: Configure timeout at HttpService level with per-request override
**Rationale**:
- Clean separation of concerns
- Easy to test timeout scenarios
- Configurable through environment variables following constitutional patterns

**Alternatives considered**:
- Promise.race with setTimeout - More complex, less maintainable
- Request library timeout - Would require different HTTP client

### Configuration Management

**Decision**: Use NestJS `@nestjs/config` with `registerAs` pattern
**Rationale**:
- Constitutional requirement for strong-typed configuration
- Environment variable validation with Joi
- Easy dependency injection

**Alternatives considered**:
- Direct process.env access - No validation, not following constitution
- Custom configuration service - Reinventing NestJS patterns

## Integration Patterns

### Marketing Cloud API Integration

**Pattern**: Interface abstraction with concrete implementation
**Implementation**:
```typescript
interface IMarketingCloudService {
  getDevices(shopId: number, phone: string): Promise<Device[]>;
}

@Injectable()
class MarketingCloudService implements IMarketingCloudService {
  // Concrete implementation
}
```

**Rationale**: Follows constitutional dependency abstraction requirement

### Request/Response Logging

**Pattern**: NestJS interceptor for structured logging
**Implementation**: Custom interceptor that logs at INFO level with request ID, parameters, and response status
**Rationale**: Centralized logging following clarified requirements

## Test Strategy

### Unit Testing Approach

**Pattern**: Mock external dependencies using Jest mocks
**Tools**: `@nestjs/testing` with `Test.createTestingModule()`
**Coverage**: All service methods with positive, negative, and edge cases

### Integration Testing Approach

**Pattern**: End-to-end API testing with mocked external services
**Tools**: Supertest for HTTP requests, Jest for assertions
**Scope**: Full request/response cycle including validation, authentication, and error handling

## Performance Considerations

### Timeout Handling

**Approach**: 10-second timeout with immediate failure (no retries)
**Rationale**: Matches clarified requirements for fast failure feedback

### Device Limit Handling

**Approach**: No artificial limiting, handle up to 10 devices efficiently as per clarified expectations
**Implementation**: Direct array mapping from Marketing Cloud response

## Security Considerations

### Input Validation

**Approach**: Strict validation of shopId (positive integer) and phone (regex pattern)
**Implementation**: class-validator decorators with custom error messages

### Authentication

**Approach**: Simple header validation guard
**Implementation**: Custom NestJS guard that validates 'ny-operator' header presence

## Dependencies

### Production Dependencies
- `@nestjs/common` - Core NestJS functionality
- `@nestjs/axios` - HTTP client integration
- `@nestjs/config` - Configuration management
- `@nestjs/swagger` - API documentation
- `class-validator` - Request validation
- `class-transformer` - DTO transformation

### Development Dependencies
- `@nestjs/testing` - Testing utilities
- `jest` - Test runner
- `supertest` - HTTP integration testing

All dependencies align with constitutional tech stack requirements and existing project structure.