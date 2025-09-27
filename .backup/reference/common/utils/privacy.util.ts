/**
 * Privacy Utility Functions
 * Handles sensitive data masking and sanitization for logging
 */

/**
 * Mask phone number in format 091****678
 * Keeps first 3 and last 3 digits, masks the middle
 */
export function maskPhoneNumber(phone: string): string {
  if (!phone || phone.length < 6) {
    return phone; // Return as-is if too short to mask properly
  }

  const cleaned = phone.replace(/\s+/g, ''); // Remove whitespace

  if (cleaned.length < 6) {
    return phone; // Return original if still too short
  }

  const start = cleaned.substring(0, 3);
  const end = cleaned.substring(cleaned.length - 3);
  const maskLength = cleaned.length - 6;
  const mask = '*'.repeat(maskLength);

  return `${start}${mask}${end}`;
}

/**
 * Sanitize object for logging by removing/masking sensitive fields
 */
export function sanitizeForLogging(obj: any): any {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeForLogging(item));
  }

  const sanitized = { ...obj };

  // Mask phone numbers
  if (sanitized.phone && typeof sanitized.phone === 'string') {
    sanitized.phone = maskPhoneNumber(sanitized.phone);
  }

  // Remove sensitive device data
  if (sanitized.token) {
    sanitized.token = '[REDACTED]';
  }

  if (sanitized.udid) {
    sanitized.udid = '[REDACTED]';
  }

  if (sanitized.advertiseId) {
    sanitized.advertiseId = '[REDACTED]';
  }

  // Recursively sanitize nested objects
  Object.keys(sanitized).forEach((key) => {
    if (sanitized[key] && typeof sanitized[key] === 'object') {
      sanitized[key] = sanitizeForLogging(sanitized[key]);
    }
  });

  return sanitized;
}

/**
 * Sanitize device object for logging
 * Specifically handles device entity structure
 */
export function sanitizeDevice(device: any): any {
  if (!device) {
    return device;
  }

  return {
    ...device,
    token: '[REDACTED]',
    udid: device.udid ? '[REDACTED]' : undefined,
    advertiseId: device.advertiseId ? '[REDACTED]' : undefined,
    // Keep non-sensitive fields
    guid: device.guid,
    shopId: device.shopId,
    platformDef: device.platformDef,
    memberId: device.memberId,
    appVersion: device.appVersion,
    createdDateTime: device.createdDateTime,
    updatedDateTime: device.updatedDateTime,
  };
}

/**
 * Sanitize array of devices for logging
 */
export function sanitizeDevices(devices: any[]): any[] {
  if (!Array.isArray(devices)) {
    return devices;
  }

  return devices.map((device) => sanitizeDevice(device));
}

/**
 * Generate safe log message with masked sensitive data
 */
export function createSafeLogMessage(
  message: string,
  data: Record<string, any> = {},
): string {
  const sanitizedData = sanitizeForLogging(data);

  if (Object.keys(sanitizedData).length === 0) {
    return message;
  }

  return `${message} | Data: ${JSON.stringify(sanitizedData)}`;
}

/**
 * Check if a field contains sensitive data that should be redacted
 */
export function isSensitiveField(fieldName: string): boolean {
  const sensitiveFields = [
    'token',
    'udid',
    'advertiseId',
    'advertisingId',
    'pushToken',
    'deviceToken',
    'password',
    'secret',
    'key',
    'auth',
    'credential',
  ];

  return sensitiveFields.some((sensitiveField) =>
    fieldName.toLowerCase().includes(sensitiveField),
  );
}

/**
 * Mask sensitive field value based on field type
 */
export function maskSensitiveValue(value: any, fieldName: string): any {
  if (value === null || value === undefined) {
    return value;
  }

  // Phone number specific masking
  if (fieldName.toLowerCase().includes('phone')) {
    return typeof value === 'string' ? maskPhoneNumber(value) : value;
  }

  // Generic sensitive field masking
  if (isSensitiveField(fieldName)) {
    return '[REDACTED]';
  }

  return value;
}
