import { Injectable, Logger, Inject } from '@nestjs/common';
import { MemberDevicesData } from './dto/member-devices-response.dto';
import {
  IMarketingCloudApiService,
  MARKETING_CLOUD_API_SERVICE_TOKEN,
} from './interfaces/marketing-cloud-api.interface';
import {
  maskPhoneNumber,
  createSafeLogMessage,
} from '../../common/utils/privacy.util';

/**
 * Marketing Cloud Service
 * Handles business logic for Marketing Cloud Device integration
 */
@Injectable()
export class MarketingCloudService {
  private readonly logger = new Logger(MarketingCloudService.name);

  constructor(
    @Inject(MARKETING_CLOUD_API_SERVICE_TOKEN)
    private readonly marketingCloudApiService: IMarketingCloudApiService,
  ) {}

  /**
   * Get member devices from Marketing Cloud API
   */
  async getMemberDevices(
    shopId: number,
    phone: string,
    operator: string,
  ): Promise<MemberDevicesData> {
    const maskedPhone = maskPhoneNumber(phone);

    this.logger.log(
      createSafeLogMessage('Processing member devices request', {
        shopId,
        phone: maskedPhone,
        operator,
      }),
    );

    // Delegate to the marketing cloud API service
    const apiResponse = await this.marketingCloudApiService.getMemberDevices(
      shopId,
      phone,
      operator,
    );

    const result: MemberDevicesData = {
      shopId,
      phone,
      devices: apiResponse.devices,
      totalCount: apiResponse.devices.length,
    };

    this.logger.log(
      createSafeLogMessage('Member devices request completed successfully', {
        shopId,
        phone: maskedPhone,
        deviceCount: result.totalCount,
        operator,
      }),
    );

    return result;
  }

}
