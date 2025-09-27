import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsInt,
  Min,
  IsNotEmpty,
  Matches,
  NotEquals,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class SupplierUpdateRequestDto {
  @ApiProperty({
    description: 'Market code (e.g., TW, HK, JP)',
    example: 'TW',
    pattern: '^[A-Z]{2,4}$',
    minLength: 2,
    maxLength: 4,
  })
  @IsString({ message: 'Market must be a string' })
  @IsNotEmpty({ message: 'Market is required' })
  @Matches(/^[A-Z]{2,4}$/, { message: 'Market must be 2-4 uppercase letters' })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  public readonly market: string;

  @ApiProperty({
    description: 'Original supplier ID',
    example: 100,
    minimum: 1,
    type: 'integer',
  })
  @IsInt({ message: 'Old supplier ID must be an integer' })
  @Min(1, { message: 'Old supplier ID must be greater than 0' })
  @Transform(({ value }) => parseInt(value))
  public readonly oldSupplierId: number;

  @ApiProperty({
    description: 'New supplier ID',
    example: 200,
    minimum: 1,
    type: 'integer',
  })
  @IsInt({ message: 'New supplier ID must be an integer' })
  @Min(1, { message: 'New supplier ID must be greater than 0' })
  @Transform(({ value }) => parseInt(value))
  public readonly newSupplierId: number;

  constructor(market: string, oldSupplierId: number, newSupplierId: number) {
    this.market = market;
    this.oldSupplierId = oldSupplierId;
    this.newSupplierId = newSupplierId;
  }

  /**
   * Business logic validation: supplier IDs must be different
   */
  public validateSupplierIds(): void {
    if (this.oldSupplierId === this.newSupplierId) {
      throw new Error('Old and new supplier IDs must be different');
    }
  }
}
