# Feature Specification: Notification Status Devices API

**Feature Branch**: `008-docs-notification-status`
**Created**: 2025-09-28
**Status**: Draft
**Input**: User description: "參考 @docs/notification-status-proxy-api.yaml @docs/notification-status-error-handling.md @docs/notification-status-config-simple.md

我要開發 /api/v1/notification-status/devices 這支 API"

## Execution Flow (main)
```
1. Parse user description from Input
   → Analyzed: User wants to develop a notification status devices API
2. Extract key concepts from description
   → Identified: device query API, notification status, shop and phone parameters
3. For each unclear aspect:
   → No major clarifications needed - documentation is comprehensive
4. Fill User Scenarios & Testing section
   → Clear user flow: query devices by shop ID and phone number
5. Generate Functional Requirements
   → Each requirement is testable based on provided specs
6. Identify Key Entities (device data)
7. Run Review Checklist
   → SUCCESS: All requirements clear from documentation
8. Return: SUCCESS (spec ready for planning)
```

---

## ⚡ Quick Guidelines
- ✅ Focus on WHAT users need and WHY
- ❌ Avoid HOW to implement (no tech stack, APIs, code structure)
- 👥 Written for business stakeholders, not developers

---

## User Scenarios & Testing *(mandatory)*

### Primary User Story
Operations team members need to query device information for specific shop customers to investigate notification delivery issues. When a customer reports not receiving push notifications, the operations team uses the customer's shop ID and phone number to retrieve all registered devices for that customer.

### Acceptance Scenarios
1. **Given** a valid shop ID and phone number, **When** requesting device information, **Then** the system returns all registered devices for that customer including device tokens, platform types, and registration details
2. **Given** an invalid shop ID (negative or zero), **When** requesting device information, **Then** the system returns a validation error with clear error message
3. **Given** a valid shop ID but non-existent phone number, **When** requesting device information, **Then** the system returns a "not found" response indicating no devices were found
4. **Given** a malformed phone number, **When** requesting device information, **Then** the system returns a validation error specifying the correct phone format

### Edge Cases
- What happens when the Marketing Cloud service is temporarily unavailable?
- How does system handle timeout scenarios when external API is slow?
- What response format is returned when a customer has no registered devices?
- How are rate limiting scenarios from external services handled?

## Requirements *(mandatory)*

### Functional Requirements
- **FR-001**: System MUST accept shop ID and phone number as query parameters for device lookup
- **FR-002**: System MUST validate that shop ID is a positive integer greater than 0
- **FR-003**: System MUST validate phone number format using pattern '^[0-9+\\-\\s()]+$' with length between 8-15 characters
- **FR-004**: System MUST query Marketing Cloud Device API to retrieve customer device information
- **FR-005**: System MUST return device data including GUID, UDID, token, platform, member ID, app version, and timestamps
- **FR-006**: System MUST return standardized success response format with success flag, data array, timestamp, and request ID
- **FR-007**: System MUST return standardized error response format for validation failures, not found scenarios, and external service errors
- **FR-008**: System MUST handle external API timeouts (10 seconds) gracefully with appropriate error messaging
- **FR-009**: System MUST generate unique request IDs for tracking and debugging purposes
- **FR-010**: System MUST return HTTP 200 for successful device retrieval
- **FR-011**: System MUST return HTTP 400 for parameter validation failures
- **FR-012**: System MUST return HTTP 404 when no devices are found for the given parameters
- **FR-013**: System MUST return HTTP 500 for internal server errors or external service failures
- **FR-014**: System MUST require 'ny-operator' header for authentication and return HTTP 401 if missing or invalid
- **FR-015**: System MUST fail immediately on Marketing Cloud API errors without retry attempts
- **FR-016**: System MUST log all device query requests and responses at INFO level including request ID, parameters, and response status
- **FR-017**: System MUST handle up to 10 devices per customer query within the 10-second timeout and return all found devices within this expected range

### Key Entities *(include if feature involves data)*
- **Device**: Represents a customer's mobile device registered for push notifications, containing unique identifiers (GUID, UDID), push token, platform type (iOS/Android), associated member ID, app version, and creation/update timestamps
- **Customer**: Identified by combination of shop ID and phone number, can have multiple registered devices
- **Shop**: Business entity identified by shop ID, contains multiple customers with their devices

## Clarifications

### Session 2025-09-28
- Q: What specific timeout value should trigger the "graceful timeout handling" mentioned in FR-008? → A: 10 seconds (balanced approach)
- Q: What authentication/authorization method should the operations team use to access this API? → A: only use 'ny-operator' header
- Q: How many retry attempts should the system make when the Marketing Cloud API fails before giving up? → A: No retries (fail immediately)
- Q: What logging level should be used for tracking device query requests and responses? → A: INFO (basic request/response tracking)
- Q: What is the expected maximum number of devices that could be returned for a single customer query? → A: 10 devices (power user with multiple devices)

---

## Review & Acceptance Checklist
*GATE: Automated checks run during main() execution*

### Content Quality
- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

### Requirement Completeness
- [x] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous
- [x] Success criteria are measurable
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified

---

## Execution Status
*Updated by main() during processing*

- [x] User description parsed
- [x] Key concepts extracted
- [x] Ambiguities marked
- [x] User scenarios defined
- [x] Requirements generated
- [x] Entities identified
- [x] Review checklist passed

---