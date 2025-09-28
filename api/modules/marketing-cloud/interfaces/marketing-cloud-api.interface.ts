import { Device } from '../entities/device.entity';

export interface MarketingCloudApiResponse {
  devices: Device[];
}

export interface IMarketingCloudApiService {
  getMemberDevices(
    shopId: number,
    phone: string,
    operator: string,
  ): Promise<MarketingCloudApiResponse>;
}

export const MARKETING_CLOUD_API_SERVICE_TOKEN = 'IMarketingCloudApiService';
