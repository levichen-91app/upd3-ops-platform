/**
 * Device Entity
 * Represents a mobile device registered in Marketing Cloud system
 */
export interface Device {
  /** Device unique identifier (UUID format) */
  guid: string;

  /** Device UDID (optional) */
  udid?: string;

  /** Push notification token */
  token: string;

  /** Shop ID */
  shopId: number;

  /** Platform definition ("iOS" | "Android") */
  platformDef: string;

  /** Member ID */
  memberId: number;

  /** Advertising tracking ID (optional) */
  advertiseId?: string;

  /** App version (optional) */
  appVersion?: string;

  /** Last updated timestamp (ISO 8601) */
  updatedDateTime: string;

  /** Creation timestamp (ISO 8601) */
  createdDateTime: string;
}

/**
 * Validation constraints for Device entity
 */
export const DeviceValidation = {
  guid: {
    required: true,
    format: 'uuid',
  },
  token: {
    required: true,
    minLength: 1,
  },
  shopId: {
    required: true,
    type: 'positive-integer',
  },
  platformDef: {
    required: true,
    enum: ['iOS', 'Android'],
  },
  memberId: {
    required: true,
    type: 'positive-integer',
  },
  createdDateTime: {
    required: true,
    format: 'iso-8601',
  },
  updatedDateTime: {
    required: true,
    format: 'iso-8601',
  },
} as const;

/**
 * Type guard to check if an object is a valid Device
 */
export function isDevice(obj: any): obj is Device {
  return (
    obj &&
    typeof obj.guid === 'string' &&
    typeof obj.token === 'string' &&
    typeof obj.shopId === 'number' &&
    typeof obj.platformDef === 'string' &&
    ['iOS', 'Android'].includes(obj.platformDef) &&
    typeof obj.memberId === 'number' &&
    typeof obj.createdDateTime === 'string' &&
    typeof obj.updatedDateTime === 'string' &&
    obj.shopId > 0 &&
    obj.memberId > 0 &&
    obj.token.length > 0 &&
    obj.guid.length > 0
  );
}
