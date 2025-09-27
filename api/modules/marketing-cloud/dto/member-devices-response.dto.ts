import { ApiProperty } from '@nestjs/swagger';
import { Device } from '../entities/device.entity';

/**
 * Device DTO for API responses
 * Used in MemberDevicesResponse to represent device data
 */
export class DeviceDto {
  @ApiProperty({
    description: '裝置唯一識別碼',
    example: '550e8400-e29b-41d4-a716-446655440000',
    format: 'uuid',
  })
  guid!: string;

  @ApiProperty({
    description: '裝置 UDID',
    example: 'A1B2C3D4E5F6',
    required: false,
  })
  udid?: string;

  @ApiProperty({
    description: '推播 Token',
    example: 'abc123def456...',
  })
  token!: string;

  @ApiProperty({
    description: '商店 ID',
    example: 12345,
    type: 'integer',
  })
  shopId!: number;

  @ApiProperty({
    description: '平台定義',
    example: 'iOS',
    enum: ['iOS', 'Android'],
  })
  platformDef!: string;

  @ApiProperty({
    description: '會員 ID',
    example: 67890,
    type: 'integer',
  })
  memberId!: number;

  @ApiProperty({
    description: '廣告追蹤 ID',
    example: '12345678-1234-5678-9012-123456789012',
    required: false,
  })
  advertiseId?: string;

  @ApiProperty({
    description: 'App 版本',
    example: '1.2.3',
    required: false,
  })
  appVersion?: string;

  @ApiProperty({
    description: '更新時間',
    example: '2025-09-27T10:30:00.000Z',
    format: 'date-time',
  })
  updatedDateTime!: string;

  @ApiProperty({
    description: '建立時間',
    example: '2025-09-01T08:15:00.000Z',
    format: 'date-time',
  })
  createdDateTime!: string;
}

/**
 * Data structure for successful member devices response
 */
export class MemberDevicesData {
  @ApiProperty({
    description: '商店 ID',
    example: 12345,
    type: 'integer',
  })
  shopId!: number;

  @ApiProperty({
    description: '會員手機號碼',
    example: '0912345678',
  })
  phone!: string;

  @ApiProperty({
    description: '裝置清單',
    type: [DeviceDto],
    isArray: true,
  })
  devices!: DeviceDto[];

  @ApiProperty({
    description: '裝置總數',
    example: 1,
    type: 'integer',
  })
  totalCount!: number;
}

/**
 * Complete API response for successful member devices query
 */
export class MemberDevicesResponse {
  @ApiProperty({
    description: '請求是否成功',
    example: true,
    type: 'boolean',
  })
  success!: true;

  @ApiProperty({
    description: '查詢結果資料',
    type: MemberDevicesData,
  })
  data!: MemberDevicesData;

  @ApiProperty({
    description: '回應時間戳記',
    example: '2025-09-27T10:45:00.000Z',
    format: 'date-time',
  })
  timestamp!: string;

  @ApiProperty({
    description: '請求追蹤 ID',
    example: 'req-20250927104500-uuid',
  })
  requestId!: string;
}

/**
 * Factory function to create successful response
 */
export function createMemberDevicesResponse(
  shopId: number,
  phone: string,
  devices: Device[],
  requestId: string,
): MemberDevicesResponse {
  return {
    success: true,
    data: {
      shopId,
      phone,
      devices: devices.map(deviceToDto),
      totalCount: devices.length,
    },
    timestamp: new Date().toISOString(),
    requestId,
  };
}

/**
 * Convert Device entity to DeviceDto
 */
function deviceToDto(device: Device): DeviceDto {
  return {
    guid: device.guid,
    udid: device.udid,
    token: device.token,
    shopId: device.shopId,
    platformDef: device.platformDef,
    memberId: device.memberId,
    advertiseId: device.advertiseId,
    appVersion: device.appVersion,
    updatedDateTime: device.updatedDateTime,
    createdDateTime: device.createdDateTime,
  };
}
