import { ApiProperty } from '@nestjs/swagger';
import { NotificationHistory } from './notification-history.dto';

export class NotificationHistoryResponse {
  @ApiProperty({
    description: '操作成功標記',
    type: 'boolean',
    enum: [true],
  })
  success!: true;

  @ApiProperty({
    description: '通知歷程資料',
    type: () => NotificationHistory,
  })
  data!: NotificationHistory;

  @ApiProperty({
    description: '回應時間戳',
    type: 'string',
    format: 'date-time',
    example: '2024-01-15T10:35:00Z',
  })
  timestamp!: string;

  @ApiProperty({
    description: '請求追蹤ID',
    type: 'string',
    pattern: '^req-history-[0-9]+-[a-zA-Z0-9]+$',
    example: 'req-history-123457',
  })
  requestId!: string;
}
