import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsPositive, IsString, IsNotEmpty } from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * DTO for GET /api/v1/shops/:shopId/members/by-phone/:phone/devices endpoint
 * Handles path parameters and header validation
 */
export class GetMemberDevicesQueryDto {
  @ApiProperty({
    description: '商店 ID',
    example: 12345,
    type: 'integer',
    minimum: 1,
  })
  @IsNumber({}, { message: 'Shop ID must be a valid number' })
  @IsPositive({ message: 'Shop ID must be a positive integer' })
  @Transform(({ value }: { value: any }) => parseInt(value, 10), {
    toClassOnly: true,
  })
  shopId!: number;

  @ApiProperty({
    description: '會員手機號碼',
    example: '0912345678',
    type: 'string',
    minLength: 1,
  })
  @IsString({ message: 'Phone number must be a string' })
  @IsNotEmpty({ message: 'Phone number cannot be empty' })
  phone!: string;

  @ApiProperty({
    description: '操作者識別 (Header: ny-operator)',
    example: 'system-admin',
    type: 'string',
    minLength: 1,
  })
  @IsString({ message: 'Operator must be a string' })
  @IsNotEmpty({ message: 'Operator cannot be empty' })
  operator!: string;
}

/**
 * Custom validation decorator to validate phone number format
 * Note: According to FR-015, we don't validate phone format, just ensure it's not empty
 */
export function IsValidPhone() {
  return IsNotEmpty();
}

/**
 * Custom validation decorator to validate shop ID
 */
export function IsValidShopId() {
  return IsPositive();
}
