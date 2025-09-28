# Quickstart: Notification Status Devices API

**Feature**: 008-docs-notification-status
**Date**: 2025-09-28

## Prerequisites

1. **Environment Setup**
   - Node.js 18+ installed
   - NestJS CLI installed (`npm i -g @nestjs/cli`)
   - Environment variables configured (see Configuration section)

2. **Authentication**
   - Obtain `ny-operator` header value for API access

3. **External Dependencies**
   - Marketing Cloud Device API accessible
   - Proper network connectivity to external services

## Configuration

Set the following environment variables in `.env`:

```bash
# Marketing Cloud API
MARKETING_CLOUD_BASE_URL=http://marketing-cloud-service.qa.91dev.tw
MARKETING_CLOUD_TIMEOUT=10000
MARKETING_CLOUD_RETRIES=0

# Application
PORT=3000
```

## Quick Start Guide

### 1. Start the Application

```bash
cd api
npm install
npm run start:dev
```

### 2. Verify Health

```bash
curl http://localhost:3000/health
```

### 3. Test Device Query (Success Case)

```bash
curl -X GET "http://localhost:3000/api/v1/notification-status/devices?shopId=12345&phone=0912345678" \
  -H "ny-operator: operations-team" \
  -H "Content-Type: application/json"
```

**Expected Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "guid": "123e4567-e89b-12d3-a456-426614174000",
      "udid": "device_udid_123",
      "token": "device_token_123",
      "shopId": 12345,
      "platformDef": "iOS",
      "memberId": 67890,
      "advertiseId": "ad_id_123",
      "appVersion": "1.2.3",
      "createdDateTime": "2024-01-15T10:00:00Z",
      "updatedDateTime": "2024-01-15T10:30:00Z"
    }
  ],
  "timestamp": "2024-01-15T10:35:00Z",
  "requestId": "req-devices-123456"
}
```

### 4. Test Validation Error

```bash
curl -X GET "http://localhost:3000/api/v1/notification-status/devices?shopId=-1&phone=invalid" \
  -H "ny-operator: operations-team" \
  -H "Content-Type: application/json"
```

**Expected Response** (400 Bad Request):
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Input parameter validation failed",
    "details": [
      {
        "field": "shopId",
        "message": "must be greater than 0"
      },
      {
        "field": "phone",
        "message": "must match phone number pattern"
      }
    ]
  },
  "timestamp": "2024-01-15T10:35:00Z",
  "requestId": "req-devices-123456"
}
```

### 5. Test Authentication Error

```bash
curl -X GET "http://localhost:3000/api/v1/notification-status/devices?shopId=12345&phone=0912345678" \
  -H "Content-Type: application/json"
```

**Expected Response** (401 Unauthorized):
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "ny-operator header required"
  },
  "timestamp": "2024-01-15T10:35:00Z",
  "requestId": "req-devices-123456"
}
```

### 6. Test Not Found Case

```bash
curl -X GET "http://localhost:3000/api/v1/notification-status/devices?shopId=99999&phone=0000000000" \
  -H "ny-operator: operations-team" \
  -H "Content-Type: application/json"
```

**Expected Response** (404 Not Found):
```json
{
  "success": false,
  "error": {
    "code": "DEVICE_NOT_FOUND",
    "message": "No devices found for the specified customer",
    "details": {
      "shopId": 99999,
      "phone": "0000000000"
    }
  },
  "timestamp": "2024-01-15T10:35:00Z",
  "requestId": "req-devices-123456"
}
```

## Integration Test Scenarios

### Scenario 1: Valid Customer with Multiple Devices

**Given**: A customer exists with multiple registered devices
**When**: Query with valid shopId and phone
**Then**: Return all devices in standardized format

### Scenario 2: Valid Customer with No Devices

**Given**: A customer exists but has no registered devices
**When**: Query with valid shopId and phone
**Then**: Return 404 with appropriate error message

### Scenario 3: Invalid Parameters

**Given**: Invalid shopId (negative) and malformed phone
**When**: Query with invalid parameters
**Then**: Return 400 with validation error details

### Scenario 4: Missing Authentication

**Given**: Request without ny-operator header
**When**: Query any endpoint
**Then**: Return 401 with authentication error

### Scenario 5: External API Timeout

**Given**: Marketing Cloud API responds slowly (>10 seconds)
**When**: Query any valid customer
**Then**: Return 500 with timeout error

### Scenario 6: External API Unavailable

**Given**: Marketing Cloud API returns 500 error
**When**: Query any valid customer
**Then**: Return 500 with external API error

## Performance Verification

### Response Time Test

```bash
# Test response time is under 10 seconds
time curl -X GET "http://localhost:3000/api/v1/notification-status/devices?shopId=12345&phone=0912345678" \
  -H "ny-operator: operations-team"
```

Expected: Response within 10 seconds (actual time depends on Marketing Cloud API)

### Load Test (Optional)

```bash
# Basic concurrent request test
for i in {1..10}; do
  curl -X GET "http://localhost:3000/api/v1/notification-status/devices?shopId=12345&phone=091234567$i" \
    -H "ny-operator: operations-team" &
done
wait
```

## Troubleshooting

### Common Issues

1. **"Marketing Cloud API not responding"**
   - Check MARKETING_CLOUD_BASE_URL environment variable
   - Verify network connectivity to external API
   - Check Marketing Cloud service status

2. **"ny-operator header required"**
   - Ensure `ny-operator` header is included in all requests
   - Check header spelling and case sensitivity

3. **"Validation errors"**
   - Verify shopId is positive integer
   - Verify phone matches pattern `^[0-9+\-\s()]+$`
   - Check parameter lengths (phone: 8-15 characters)

4. **"Timeout errors"**
   - Check external API response time
   - Consider adjusting MARKETING_CLOUD_TIMEOUT if needed
   - Verify no network connectivity issues

### Debug Logging

Enable debug logging by setting environment variable:
```bash
LOG_LEVEL=debug npm run start:dev
```

This will show:
- Incoming request details
- External API call timing
- Response transformation steps
- Error details

## API Documentation

Once running, access interactive API documentation at:
- Swagger UI: http://localhost:3000/api
- OpenAPI JSON: http://localhost:3000/api-json

## Next Steps

1. Run full test suite: `npm run test`
2. Run integration tests: `npm run test:e2e`
3. Check code coverage: `npm run test:cov`
4. Verify all acceptance scenarios pass
5. Deploy to staging environment