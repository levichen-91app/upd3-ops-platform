import { Injectable, Inject, Logger, NotFoundException } from '@nestjs/common';
import type {
  INcDetailService,
  NotificationDetail,
} from './interfaces/nc-detail.interface';
import { NC_DETAIL_SERVICE_TOKEN } from './interfaces/nc-detail.interface';
import type { IMarketingCloudService } from './interfaces/marketing-cloud.interface';
import { MARKETING_CLOUD_SERVICE_TOKEN } from './interfaces/marketing-cloud.interface';
import type { IWhaleApiService } from './interfaces/whale-api.interface';
import { WHALE_API_SERVICE_TOKEN } from './interfaces/whale-api.interface';
import { ApiSuccessResponseDto } from './dto/notification-detail-response.dto';
import { DeviceDto } from './dto/device.dto';
import {
  DeviceQueryResponseDto,
  ErrorResponseDto,
} from './dto/device-response.dto';
import { NotificationHistoryResponse } from './dto/notification-history-response.dto';
import { NotificationHistory, NotificationStatus } from './dto/notification-history.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class NotificationStatusService {
  private readonly logger = new Logger(NotificationStatusService.name);

  constructor(
    @Inject(NC_DETAIL_SERVICE_TOKEN)
    private readonly ncDetailService: INcDetailService,
    @Inject(MARKETING_CLOUD_SERVICE_TOKEN)
    private readonly marketingCloudService: IMarketingCloudService,
    @Inject(WHALE_API_SERVICE_TOKEN)
    private readonly whaleApiService: IWhaleApiService,
  ) {}

  async getNotificationDetail(
    shopId: number,
    ncId: string,
    operator: string,
    requestId: string,
  ): Promise<NotificationDetail | null> {

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
    requestId: string,
  ): Promise<DeviceQueryResponseDto> {
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


  async getNotificationHistory(notificationId: number, requestId: string): Promise<NotificationHistoryResponse> {
    const timestamp = new Date().toISOString();

    this.logger.log(`Processing notification history request - notificationId: ${notificationId}, requestId: ${requestId}`);

    try {
      const whaleApiResponse = await this.whaleApiService.getNotificationHistory(notificationId);

      if (!whaleApiResponse || !whaleApiResponse.data) {
        this.logger.log(`Notification ${notificationId} not found in Whale API - requestId: ${requestId}`);
        throw new NotFoundException({
          code: 'NOTIFICATION_NOT_FOUND',
          message: '找不到指定的通知',
          details: {
            notificationId,
          },
        });
      }

      // Transform Whale API response to internal format
      const notificationHistory: NotificationHistory = {
        id: whaleApiResponse.data.id,
        channel: whaleApiResponse.data.channel,
        bookDatetime: whaleApiResponse.data.bookDatetime,
        sentDatetime: whaleApiResponse.data.sentDatetime,
        ncId: whaleApiResponse.data.ncId,
        ncExtId: whaleApiResponse.data.ncExtId,
        status: whaleApiResponse.data.status as NotificationStatus,
        isSettled: whaleApiResponse.data.isSettled,
        originalAudienceCount: whaleApiResponse.data.originalAudienceCount,
        filteredAudienceCount: whaleApiResponse.data.filteredAudienceCount,
        sentAudienceCount: whaleApiResponse.data.sentAudienceCount,
        receivedAudienceCount: whaleApiResponse.data.receivedAudienceCount,
        sentFailedCount: whaleApiResponse.data.sentFailedCount,
        report: {
          Total: whaleApiResponse.data.report.Total,
          Sent: whaleApiResponse.data.report.Sent,
          Success: whaleApiResponse.data.report.Success,
          Fail: whaleApiResponse.data.report.Fail,
          NoUser: whaleApiResponse.data.report.NoUser,
        },
      };

      this.logger.log(`Successfully retrieved notification history - notificationId: ${notificationId}, requestId: ${requestId}`);

      return {
        success: true,
        data: notificationHistory,
        timestamp,
        requestId,
      };
    } catch (error: any) {
      this.logger.error(`Failed to get notification history - notificationId: ${notificationId}, requestId: ${requestId}`, error.stack);

      // Handle timeout errors specifically
      if (error.message && error.message.includes('Timeout')) {
        throw new Error('TIMEOUT_ERROR');
      }

      // Handle axios errors (HTTP errors from Whale API)
      if (error.name === 'AxiosError' && error.response) {
        throw new Error('EXTERNAL_API_ERROR');
      }

      // Handle connection errors
      if (error.message && (error.message.includes('ECONNREFUSED') || error.message.includes('ENOTFOUND'))) {
        throw new Error('EXTERNAL_API_ERROR');
      }

      // If it's already a NotFoundException, just re-throw
      if (error instanceof NotFoundException) {
        throw error;
      }

      // Otherwise, treat as external API error
      throw new Error('EXTERNAL_API_ERROR');
    }
  }

}
