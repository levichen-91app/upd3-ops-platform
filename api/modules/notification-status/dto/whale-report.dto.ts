import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class WhaleReport {
  @ApiProperty({
    description: '總數',
    type: 'integer',
    minimum: 0,
    example: 1000,
  })
  @IsInt()
  @Min(0)
  Total!: number;

  @ApiProperty({
    description: '已發送',
    type: 'integer',
    minimum: 0,
    example: 950,
  })
  @IsInt()
  @Min(0)
  Sent!: number;

  @ApiProperty({
    description: '成功數',
    type: 'integer',
    minimum: 0,
    example: 900,
  })
  @IsInt()
  @Min(0)
  Success!: number;

  @ApiProperty({
    description: '失敗數',
    type: 'integer',
    minimum: 0,
    example: 50,
  })
  @IsInt()
  @Min(0)
  Fail!: number;

  @ApiProperty({
    description: '無用戶數',
    type: 'integer',
    minimum: 0,
    example: 50,
  })
  @IsInt()
  @Min(0)
  NoUser!: number;
}
