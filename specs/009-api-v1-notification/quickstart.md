# Quickstart Guide: 通知活動歷程查詢 API

**Feature**: `/api/v1/notification-status/history/{notificationId}`
**Date**: 2025-09-28
**Branch**: `009-api-v1-notification`

## Prerequisites

1. **Development Environment**:
   - Node.js 18+
   - NestJS CLI installed
   - Access to existing notification-status module

2. **External Dependencies**:
   - Whale API access credentials
   - ny-operator authentication mechanism

3. **Testing Requirements**:
   - Jest testing framework
   - Supertest for integration testing
   - Mock implementations for external services

## Quick Validation Steps

### 1. API Contract Validation

```bash
# Verify API contract matches OpenAPI specification
npm run test:contract -- --testPathPattern=history
```

**Expected**: All contract tests pass, validating request/response schemas

### 2. Authentication Testing

```bash
# Test ny-operator header validation
curl -X GET "http://localhost:3000/api/v1/notification-status/history/12345" \
  -H "ny-operator: operations-team"
```

**Expected**:
- Without header: 401 Unauthorized
- With valid header: 200 OK or 404 Not Found (depending on data)

### 3. Input Validation Testing

```bash
# Test parameter validation
curl -X GET "http://localhost:3000/api/v1/notification-status/history/invalid" \
  -H "ny-operator: operations-team"
```

**Expected**: 400 Bad Request with validation error details

### 4. Success Scenario Testing

```bash
# Test successful notification history retrieval
curl -X GET "http://localhost:3000/api/v1/notification-status/history/12345" \
  -H "ny-operator: operations-team" \
  -H "Accept: application/json"
```

**Expected Response Format**:
```json
{
  "success": true,
  "data": {
    "id": 12345,
    "channel": "Push",
    "bookDatetime": "2024-01-15T10:30:00Z",
    "sentDatetime": "2024-01-15T10:35:00Z",
    "ncId": "a4070188-050d-47f7-ab24-2523145408cf",
    "ncExtId": 67890,
    "status": "Success",
    "isSettled": true,
    "originalAudienceCount": 1000,
    "filteredAudienceCount": 950,
    "sentAudienceCount": 900,
    "receivedAudienceCount": 850,
    "sentFailedCount": 50,
    "report": {
      "Total": 1000,
      "Sent": 950,
      "Success": 900,
      "Fail": 50,
      "NoUser": 50
    }
  },
  "timestamp": "2024-01-15T10:35:00Z",
  "requestId": "req-history-123457"
}
```

### 5. Error Handling Testing

#### External API Failure
```bash
# Test when Whale API is unavailable
# (Simulate by stopping external service or using invalid credentials)
```

**Expected**: 500 Internal Server Error with EXTERNAL_API_ERROR code

#### Not Found Scenario
```bash
# Test non-existent notification ID
curl -X GET "http://localhost:3000/api/v1/notification-status/history/99999" \
  -H "ny-operator: operations-team"
```

**Expected**: 404 Not Found with NOTIFICATION_NOT_FOUND code

### 6. Performance Validation

```bash
# Test response time requirement (< 5 seconds)
time curl -X GET "http://localhost:3000/api/v1/notification-status/history/12345" \
  -H "ny-operator: operations-team"
```

**Expected**: Response time under 5 seconds

## Integration Test Scenarios

### Scenario 1: Successful History Retrieval
```typescript
describe('Notification History Success', () => {
  it('should return notification history for valid ID', async () => {
    // Given: Valid notification ID exists in Whale API
    mockWhaleApiService.getNotificationHistory.mockResolvedValue(mockHistoryData);

    // When: GET /api/v1/notification-status/history/12345
    const response = await request(app.getHttpServer())
      .get('/api/v1/notification-status/history/12345')
      .set('ny-operator', 'operations-team')
      .expect(200);

    // Then: Returns formatted notification history
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('id', 12345);
    expect(response.body.requestId).toMatch(/^req-history-/);
  });
});
```

### Scenario 2: Authentication Validation
```typescript
describe('Authentication Requirements', () => {
  it('should reject requests without ny-operator header', async () => {
    // Given: No authentication header provided

    // When: GET /api/v1/notification-status/history/12345
    const response = await request(app.getHttpServer())
      .get('/api/v1/notification-status/history/12345')
      .expect(401);

    // Then: Returns unauthorized error
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('UNAUTHORIZED');
  });
});
```

### Scenario 3: External API Error Handling
```typescript
describe('External API Error Handling', () => {
  it('should return 500 when Whale API is unavailable', async () => {
    // Given: Whale API service throws error
    mockWhaleApiService.getNotificationHistory.mockRejectedValue(
      new Error('EXTERNAL_API_ERROR: Service unavailable')
    );

    // When: GET /api/v1/notification-status/history/12345
    const response = await request(app.getHttpServer())
      .get('/api/v1/notification-status/history/12345')
      .set('ny-operator', 'operations-team')
      .expect(500);

    // Then: Returns external API error
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('EXTERNAL_API_ERROR');
  });
});
```

### Scenario 4: Input Validation
```typescript
describe('Input Validation', () => {
  it('should validate notification ID format', async () => {
    // Given: Invalid notification ID format

    // When: GET /api/v1/notification-status/history/invalid
    const response = await request(app.getHttpServer())
      .get('/api/v1/notification-status/history/invalid')
      .set('ny-operator', 'operations-team')
      .expect(400);

    // Then: Returns validation error
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });
});
```

### Scenario 5: Not Found Handling
```typescript
describe('Not Found Scenarios', () => {
  it('should return 404 for non-existent notification', async () => {
    // Given: Whale API returns null/empty for notification ID
    mockWhaleApiService.getNotificationHistory.mockResolvedValue(null);

    // When: GET /api/v1/notification-status/history/99999
    const response = await request(app.getHttpServer())
      .get('/api/v1/notification-status/history/99999')
      .set('ny-operator', 'operations-team')
      .expect(404);

    // Then: Returns not found error
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('NOTIFICATION_NOT_FOUND');
  });
});
```

## Environment Configuration

### Required Environment Variables
```env
# Whale API Configuration
WHALE_API_BASE_URL=https://whale-api.example.com
WHALE_API_TIMEOUT=5000
WHALE_API_KEY=your_api_key_here

# Request ID Configuration
REQUEST_ID_PREFIX=req-history
```

### Configuration Validation
```typescript
// Verify all required environment variables are set
const requiredEnvVars = [
  'WHALE_API_BASE_URL',
  'WHALE_API_TIMEOUT',
  'WHALE_API_KEY'
];

requiredEnvVars.forEach(varName => {
  if (!process.env[varName]) {
    throw new Error(`Missing required environment variable: ${varName}`);
  }
});
```

## Troubleshooting

### Common Issues

1. **Authentication Failures**:
   - Verify ny-operator header is present and not empty
   - Check header name case sensitivity

2. **External API Timeouts**:
   - Verify Whale API endpoint accessibility
   - Check timeout configuration (5 seconds)
   - Validate API credentials

3. **Validation Errors**:
   - Ensure notificationId is a positive integer
   - Check parameter format in path

4. **Performance Issues**:
   - Monitor response times (should be < 5 seconds)
   - Check external API response times
   - Verify no unnecessary processing delays

### Debug Commands
```bash
# Check API health
curl -X GET "http://localhost:3000/health"

# Verify module registration
npm run start:dev -- --verbose

# Test with different notification IDs
for id in 1 12345 99999; do
  curl -X GET "http://localhost:3000/api/v1/notification-status/history/$id" \
    -H "ny-operator: operations-team" \
    -w "Time: %{time_total}s\n"
done
```

## Success Criteria Checklist

- [ ] API endpoint responds to GET requests at correct path
- [ ] Authentication header validation works correctly
- [ ] Input validation rejects invalid notification IDs
- [ ] External API integration retrieves notification history
- [ ] Response format matches OpenAPI specification
- [ ] Error handling covers all specified scenarios (400, 401, 404, 500)
- [ ] Performance meets requirement (< 5 seconds response time)
- [ ] Request tracking with unique requestId works
- [ ] All integration test scenarios pass
- [ ] External API failure handling returns 500 errors immediately