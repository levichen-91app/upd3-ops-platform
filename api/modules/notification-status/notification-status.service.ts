import { Injectable, Inject, Logger, NotFoundException } from '@nestjs/common';
import type {
  INcDetailService,
  NotificationDetail,
} from './interfaces/nc-detail.interface';
import { NC_DETAIL_SERVICE_TOKEN } from './interfaces/nc-detail.interface';
import type { IMarketingCloudService } from './interfaces/marketing-cloud.interface';
import { MARKETING_CLOUD_SERVICE_TOKEN } from './interfaces/marketing-cloud.interface';
import { ApiSuccessResponseDto } from './dto/notification-detail-response.dto';
import { DeviceDto } from './dto/device.dto';
import {
  DeviceQueryResponseDto,
  ErrorResponseDto,
} from './dto/device-response.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class NotificationStatusService {
  private readonly logger = new Logger(NotificationStatusService.name);

  constructor(
    @Inject(NC_DETAIL_SERVICE_TOKEN)
    private readonly ncDetailService: INcDetailService,
    @Inject(MARKETING_CLOUD_SERVICE_TOKEN)
    private readonly marketingCloudService: IMarketingCloudService,
  ) {}

  async getNotificationDetail(
    shopId: number,
    ncId: string,
    operator: string,
  ): Promise<NotificationDetail | null> {
    const requestId = this.generateRequestId();

    this.logger.log(
      `Processing notification detail request - shopId: ${shopId}, ncId: ${ncId}, operator: ${operator}, requestId: ${requestId}`,
    );

    try {
      const notificationDetail =
        await this.ncDetailService.getNotificationDetail(shopId, ncId);

      this.logger.log(
        `Successfully retrieved notification detail - requestId: ${requestId}, hasData: ${notificationDetail !== null}`,
      );

      return notificationDetail;
    } catch (error) {
      this.logger.error(
        `Failed to get notification detail - shopId: ${shopId}, ncId: ${ncId}, operator: ${operator}, requestId: ${requestId}`,
        error,
      );
      throw error;
    }
  }

  async getDevices(
    shopId: number,
    phone: string,
  ): Promise<DeviceQueryResponseDto> {
    const requestId = this.generateDeviceRequestId();
    const timestamp = new Date().toISOString();

    this.logger.log(
      `Processing device query request - shopId: ${shopId}, phone: ${phone}, requestId: ${requestId}`,
    );

    try {
      const devices = await this.marketingCloudService.getDevices(
        shopId,
        phone,
      );

      if (!devices || devices.length === 0) {
        this.logger.log(
          `No devices found for shopId: ${shopId}, phone: ${phone}, requestId: ${requestId}`,
        );

        // Throw custom exception with details
        throw new NotFoundException({
          code: 'DEVICE_NOT_FOUND',
          message: 'No devices found for the specified customer',
          details: {
            shopId,
            phone,
          },
        });
      }

      this.logger.log(
        `Successfully retrieved ${devices.length} devices - shopId: ${shopId}, requestId: ${requestId}`,
      );

      return {
        success: true,
        data: devices,
        timestamp,
        requestId,
      };
    } catch (error: any) {
      this.logger.error(
        `Failed to get devices - shopId: ${shopId}, phone: ${phone}, requestId: ${requestId}`,
        error.stack,
      );

      // If it's already a NotFoundException, just re-throw
      if (error instanceof NotFoundException) {
        throw error;
      }

      // Otherwise, re-throw the original error for the filter to handle
      throw error;
    }
  }

  private generateRequestId(): string {
    const timestamp = Date.now();
    const uuid = uuidv4().split('-')[0];
    return `req-detail-${timestamp}-${uuid}`;
  }

  private generateDeviceRequestId(): string {
    const timestamp = Date.now();
    const uuid = uuidv4().split('-')[0];
    return `req-devices-${timestamp}-${uuid}`;
  }
}
