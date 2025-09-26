import { IsInt, IsPositive, IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class UpdateSupplierRequestDto {
  @ApiProperty({
    description: 'Shop ID to filter stories',
    example: 12345,
    minimum: 1,
  })
  @IsInt({ message: 'shopId must be an integer' })
  @IsPositive({ message: 'shopId must be a positive integer' })
  @Transform(({ value }) => parseInt(value, 10))
  shopId: number;

  @ApiProperty({
    description: 'System market identifier',
    example: 'TW',
    minLength: 1,
  })
  @IsString({ message: 'market must be a string' })
  @IsNotEmpty({ message: 'market cannot be empty' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  market: string;

  @ApiProperty({
    description: 'Current supplier ID to be replaced',
    example: 100,
    minimum: 1,
  })
  @IsInt({ message: 'oldSupplierId must be an integer' })
  @IsPositive({ message: 'oldSupplierId must be a positive integer' })
  @Transform(({ value }) => parseInt(value, 10))
  oldSupplierId: number;

  @ApiProperty({
    description: 'New supplier ID to replace with',
    example: 200,
    minimum: 1,
  })
  @IsInt({ message: 'newSupplierId must be an integer' })
  @IsPositive({ message: 'newSupplierId must be a positive integer' })
  @Transform(({ value }) => parseInt(value, 10))
  newSupplierId: number;
}
