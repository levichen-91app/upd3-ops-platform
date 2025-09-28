# Data Model: Notification Status Devices API

**Feature**: 008-docs-notification-status
**Date**: 2025-09-28

## Core Entities

### Device
Represents a customer's mobile device registered for push notifications.

**Fields**:
- `guid: string` - Device unique identifier (UUID format)
- `udid: string` - Device UDID identifier
- `token: string` - Push notification token
- `shopId: number` - Associated shop identifier
- `platformDef: "iOS" | "Android"` - Device platform type
- `memberId: number` - Associated member/customer ID
- `advertiseId: string` - Advertising tracking ID
- `appVersion: string` - Application version
- `createdDateTime: string` - Device registration timestamp (ISO 8601)
- `updatedDateTime: string` - Last update timestamp (ISO 8601)

**Validation Rules**:
- `guid` must be UUID format
- `shopId` must be positive integer > 0
- `platformDef` must be either "iOS" or "Android"
- `memberId` must be positive integer
- Date strings must be ISO 8601 format

**Relationships**:
- Belongs to Customer (identified by shopId + phone)
- Belongs to Shop (identified by shopId)

### Customer
Represents a customer identified by shop and phone combination.

**Fields**:
- `shopId: number` - Shop identifier
- `phone: string` - Customer phone number

**Validation Rules**:
- `shopId` must be positive integer > 0
- `phone` must match pattern `^[0-9+\\-\\s()]+$` with length 8-15 characters

**Relationships**:
- Has many Devices (0 to 10 expected range)
- Belongs to Shop

### Shop
Represents a business entity.

**Fields**:
- `id: number` - Shop identifier

**Validation Rules**:
- `id` must be positive integer > 0

**Relationships**:
- Has many Customers
- Has many Devices (through Customers)

## Request/Response Models

### DeviceQueryRequest
Input parameters for device lookup.

**Fields**:
- `shopId: number` - Shop identifier (query parameter)
- `phone: string` - Customer phone number (query parameter)

**Validation**:
- `shopId` required, positive integer > 0
- `phone` required, pattern validation, length 8-15

### DeviceQueryResponse
Standardized success response format.

**Structure**:
```typescript
{
  success: true;
  data: Device[];
  timestamp: string;
  requestId: string;
}
```

**Fields**:
- `success: true` - Fixed success indicator
- `data: Device[]` - Array of device objects (may be empty)
- `timestamp: string` - Response generation time (ISO 8601)
- `requestId: string` - Unique request tracking ID

### ErrorResponse
Standardized error response format.

**Structure**:
```typescript
{
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
  requestId: string;
}
```

**Error Codes**:
- `VALIDATION_ERROR` - Input parameter validation failure
- `DEVICE_NOT_FOUND` - No devices found for given parameters
- `EXTERNAL_API_ERROR` - Marketing Cloud API failure
- `TIMEOUT_ERROR` - Request processing timeout (10 seconds)
- `RATE_LIMIT_ERROR` - External service rate limiting
- `INTERNAL_SERVER_ERROR` - Unexpected server error
- `UNAUTHORIZED` - Missing or invalid 'ny-operator' header

## State Transitions

### Device Lifecycle
Devices are read-only from this API perspective:
1. **Retrieved** - Device data fetched from Marketing Cloud
2. **Returned** - Device data included in API response
3. **Not Found** - No devices exist for customer

No state mutations occur within this service (proxy API pattern).

## Data Flow

### Successful Query Flow
1. Receive query parameters (shopId, phone)
2. Validate input parameters
3. Authenticate request ('ny-operator' header)
4. Query Marketing Cloud Device API
5. Transform response to standardized format
6. Return device array with metadata

### Error Flow
1. Receive invalid input OR authentication failure OR external API error
2. Generate appropriate error response
3. Return standardized error format with tracking ID

## Constraints

### Performance Constraints
- Maximum 10 devices per customer query (expected range)
- 10-second timeout for external API calls
- No retry logic on failures

### Data Constraints
- Device data is read-only (no mutations)
- No local data persistence (proxy pattern)
- All data sourced from Marketing Cloud API

### Security Constraints
- All requests must include 'ny-operator' header
- Input validation prevents injection attacks
- No sensitive data exposure in error messages