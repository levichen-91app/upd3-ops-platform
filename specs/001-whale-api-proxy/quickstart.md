# Quickstart: Whale API Proxy Testing

**Date**: 2025-09-25
**Feature**: 001-whale-api-proxy

## Prerequisites

1. API server running on `http://localhost:3000`
2. Whale API TW QA server accessible at `http://whale-api-internal.qa.91dev.tw/`
3. Network connectivity to external API

## Test Scenarios

### Scenario 1: Successful Supplier ID Update

**Purpose**: Verify successful request forwarding and response handling

**Steps**:
1. Send POST request to `/proxy/whale/update-supplier-id`
2. Include required `ny-operator` header
3. Provide valid request payload

**Request**:
```bash
curl -X POST http://localhost:3000/proxy/whale/update-supplier-id \
  -H "Content-Type: application/json" \
  -H "ny-operator: Amy Wang" \
  -d '{
    "shopId": 12345,
    "market": "TW",
    "oldSupplierId": 100,
    "newSupplierId": 200
  }'
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "updatedCount": 5,
    "shopId": 12345,
    "market": "TW",
    "supplierId": 200
  }
}
```

**Validation**:
- HTTP status: 200 OK
- Response matches Whale API format exactly
- Logs contain request and response with timestamp and requestId
- Response time < 200ms

### Scenario 2: Missing ny-operator Header

**Purpose**: Verify header validation

**Steps**:
1. Send request without `ny-operator` header
2. Verify appropriate error response

**Request**:
```bash
curl -X POST http://localhost:3000/proxy/whale/update-supplier-id \
  -H "Content-Type: application/json" \
  -d '{
    "shopId": 12345,
    "market": "TW",
    "oldSupplierId": 100,
    "newSupplierId": 200
  }'
```

**Expected Response**:
```json
{
  "error": "Missing required header: ny-operator"
}
```

**Validation**:
- HTTP status: 400 Bad Request
- Error message is descriptive
- Request logged with error details

### Scenario 3: Invalid Request Payload

**Purpose**: Verify input validation

**Steps**:
1. Send request with invalid data (negative shopId)
2. Verify validation error response

**Request**:
```bash
curl -X POST http://localhost:3000/proxy/whale/update-supplier-id \
  -H "Content-Type: application/json" \
  -H "ny-operator: Amy Wang" \
  -d '{
    "shopId": -1,
    "market": "TW",
    "oldSupplierId": 100,
    "newSupplierId": 200
  }'
```

**Expected Response**:
```json
{
  "error": "Validation failed: shopId must be a positive integer"
}
```

**Validation**:
- HTTP status: 400 Bad Request
- Specific validation error message
- Request not forwarded to Whale API

### Scenario 4: Missing Required Fields

**Purpose**: Verify required field validation

**Request**:
```bash
curl -X POST http://localhost:3000/proxy/whale/update-supplier-id \
  -H "Content-Type: application/json" \
  -H "ny-operator: Amy Wang" \
  -d '{
    "shopId": 12345,
    "market": "TW",
    "oldSupplierId": 100
  }'
```

**Expected Response**:
```json
{
  "error": "Validation failed: newSupplierId is required"
}
```

**Validation**:
- HTTP status: 400 Bad Request
- Missing field identified in error message

### Scenario 5: Additional Properties Rejected

**Purpose**: Verify strict schema validation

**Request**:
```bash
curl -X POST http://localhost:3000/proxy/whale/update-supplier-id \
  -H "Content-Type: application/json" \
  -H "ny-operator: Amy Wang" \
  -d '{
    "shopId": 12345,
    "market": "TW",
    "oldSupplierId": 100,
    "newSupplierId": 200,
    "extraField": "not allowed"
  }'
```

**Expected Response**:
```json
{
  "error": "Additional properties are not allowed"
}
```

**Validation**:
- HTTP status: 400 Bad Request
- Extra fields rejected

### Scenario 6: Whale API Unavailable

**Purpose**: Verify upstream error handling

**Prerequisites**: Mock or temporarily disable Whale API connectivity

**Expected Response**:
```json
{
  "error": "Whale API unreachable or error"
}
```

**Validation**:
- HTTP status: 502 Bad Gateway
- Error logged with upstream failure details
- Client receives appropriate error message

### Scenario 7: Whale API Invalid Response

**Purpose**: Verify response format validation

**Prerequisites**: Mock Whale API to return unexpected format

**Expected Response**:
```json
{
  "error": "Whale API response format is invalid"
}
```

**Validation**:
- HTTP status: 502 Bad Gateway
- Invalid response logged
- Error handling prevents client confusion

## Logging Verification

### Log Entry Format

Each request should generate log entries with:
```json
{
  "timestamp": "2025-09-25T10:30:00.000Z",
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "method": "POST",
  "path": "/proxy/whale/update-supplier-id",
  "headers": {
    "ny-operator": "Amy Wang",
    "content-type": "application/json"
  },
  "body": {
    "shopId": 12345,
    "market": "TW",
    "oldSupplierId": 100,
    "newSupplierId": 200
  },
  "responseStatus": 200,
  "responseBody": {
    "success": true,
    "data": {
      "updatedCount": 5,
      "shopId": 12345,
      "market": "TW",
      "supplierId": 200
    }
  },
  "duration": 150
}
```

### Log Verification Steps

1. **Check log format**: All entries should be valid JSON
2. **Verify required fields**: timestamp, requestId present in all entries
3. **Validate correlation**: Same requestId for request/response pair
4. **Confirm error logging**: Error scenarios generate appropriate log entries

## Performance Testing

### Response Time Validation

**Test**: Send multiple requests and measure response times

**Command**:
```bash
# Using Apache Bench (ab) for basic performance testing
ab -n 100 -c 10 -T application/json -H "ny-operator: Test User" \
   -p request-body.json \
   http://localhost:3000/proxy/whale/update-supplier-id
```

**Expected Results**:
- Average response time < 200ms
- 95th percentile < 300ms (allowing for network latency)
- No timeout errors

### Load Testing (Optional)

**Test**: Verify system behavior under moderate load

**Expected Behavior**:
- Graceful handling of concurrent requests
- No memory leaks or resource exhaustion
- Consistent error handling under load

## Manual Testing Checklist

- [ ] Successful request forwarding (Scenario 1)
- [ ] Missing header validation (Scenario 2)
- [ ] Invalid payload validation (Scenario 3)
- [ ] Required field validation (Scenario 4)
- [ ] Additional properties rejection (Scenario 5)
- [ ] Upstream error handling (Scenario 6)
- [ ] Response format validation (Scenario 7)
- [ ] Log format verification
- [ ] Performance requirements met
- [ ] Error messages are user-friendly
- [ ] All responses include proper HTTP status codes

## Integration Testing Notes

When implementing automated tests:

1. **Mock external API** for unit tests
2. **Use test containers** for integration tests with real HTTP calls
3. **Verify log output** in test assertions
4. **Test error conditions** thoroughly
5. **Validate performance** requirements in CI/CD pipeline

## Troubleshooting

### Common Issues

1. **Connection refused**: Check Whale API server accessibility
2. **Validation errors**: Verify request payload format
3. **Missing logs**: Check logging configuration and output destination
4. **Slow responses**: Monitor network latency to Whale API server

### Debug Commands

```bash
# Check API connectivity
curl -I http://whale-api-internal.qa.91dev.tw/admin/update-supplier-id

# Monitor logs in real-time (if using file logging)
tail -f logs/application.log

# Test with verbose curl output
curl -v -X POST http://localhost:3000/proxy/whale/update-supplier-id \
  -H "Content-Type: application/json" \
  -H "ny-operator: Debug User" \
  -d '{"shopId":1,"market":"TW","oldSupplierId":1,"newSupplierId":2}'
```