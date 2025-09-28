import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt, IsString, Min, Matches, Length } from 'class-validator';

export class DeviceQueryRequestDto {
  @ApiProperty({
    description: 'Shop identifier',
    example: 12345,
    minimum: 1,
  })
  @Transform(({ value }) => parseInt(value))
  @IsInt({ message: 'shopId must be an integer' })
  @Min(1, { message: 'shopId must be greater than 0' })
  shopId!: number;

  @ApiProperty({
    description: 'Customer phone number',
    example: '0912345678',
    pattern: '^[0-9+\\-\\s()]+$',
    minLength: 8,
    maxLength: 15,
  })
  @IsString({ message: 'phone must be a string' })
  @Length(8, 15, { message: 'phone must be between 8 and 15 characters' })
  @Matches(/^[0-9+\-\s()]+$/, {
    message: 'phone must match pattern ^[0-9+\\-\\s()]+$',
  })
  phone!: string;
}
