import { Injectable, Inject, Logger, NotFoundException } from '@nestjs/common';
import { BusinessNotFoundException } from '../../common/exceptions/business-logic.exception';
import { ExternalApiException } from '../../common/exceptions/external-api.exception';
import { ERROR_CODES } from '../../constants/error-codes.constants';
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
import {
  NotificationHistory,
  NotificationStatus,
} from './dto/notification-history.dto';
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

        // 使用業務邏輯異常處理找不到設備的情況
        throw new BusinessNotFoundException('找不到指定客戶的設備', {
          shopId,
          phone,
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

      // 如果是業務邏輯異常，直接重新拋出
      if (error instanceof BusinessNotFoundException) {
        throw error;
      }

      // 其他錯誤重新拋出（已由 MarketingCloudService 處理）
      throw error;
    }
  }

  async getNotificationHistory(
    notificationId: number,
    requestId: string,
  ): Promise<NotificationHistoryResponse> {
    const timestamp = new Date().toISOString();

    this.logger.log(
      `Processing notification history request - notificationId: ${notificationId}, requestId: ${requestId}`,
    );

    try {
      const whaleApiResponse =
        await this.whaleApiService.getNotificationHistory(notificationId);

      if (!whaleApiResponse || !whaleApiResponse.data) {
        this.logger.log(
          `Notification ${notificationId} not found in Whale API - requestId: ${requestId}`,
        );
        throw new BusinessNotFoundException('找不到指定的通知', {
          notificationId,
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

      this.logger.log(
        `Successfully retrieved notification history - notificationId: ${notificationId}, requestId: ${requestId}`,
      );

      return {
        success: true,
        data: notificationHistory,
        timestamp,
        requestId,
      };
    } catch (error: any) {
      this.logger.error(
        `Failed to get notification history - notificationId: ${notificationId}, requestId: ${requestId}`,
        error.stack,
      );

      // 如果是業務邏輯異常，直接重新拋出
      if (error instanceof BusinessNotFoundException) {
        throw error;
      }

      // 其他錯誤重新拋出（已由 WhaleApiService 處理）
      throw error;
    }
  }
}
