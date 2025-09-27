import { Injectable, Inject, Logger } from '@nestjs/common';
import type { INcDetailService, NotificationDetail } from './interfaces/nc-detail.interface';
import { NC_DETAIL_SERVICE_TOKEN } from './interfaces/nc-detail.interface';
import { ApiSuccessResponseDto } from './dto/notification-detail-response.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class NotificationStatusService {
  private readonly logger = new Logger(NotificationStatusService.name);

  constructor(
    @Inject(NC_DETAIL_SERVICE_TOKEN)
    private readonly ncDetailService: INcDetailService,
  ) {}

  async getNotificationDetail(
    shopId: number,
    ncId: string,
    operator: string,
  ): Promise<NotificationDetail | null> {
    const requestId = this.generateRequestId();

    this.logger.log(`Processing notification detail request - shopId: ${shopId}, ncId: ${ncId}, operator: ${operator}, requestId: ${requestId}`);

    try {
      const notificationDetail = await this.ncDetailService.getNotificationDetail(shopId, ncId);

      this.logger.log(`Successfully retrieved notification detail - requestId: ${requestId}, hasData: ${notificationDetail !== null}`);

      return notificationDetail;

    } catch (error) {
      this.logger.error(`Failed to get notification detail - shopId: ${shopId}, ncId: ${ncId}, operator: ${operator}, requestId: ${requestId}`, error);
      throw error;
    }
  }

  private generateRequestId(): string {
    const timestamp = Date.now();
    const uuid = uuidv4().split('-')[0];
    return `req-detail-${timestamp}-${uuid}`;
  }
}