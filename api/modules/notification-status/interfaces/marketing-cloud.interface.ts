import { DeviceDto } from '../dto/device.dto';

export interface IMarketingCloudService {
  /**
   * Retrieves devices for a customer identified by shop ID and phone number
   * @param shopId - The shop identifier
   * @param phone - The customer's phone number
   * @returns Promise resolving to array of devices
   * @throws Error when external API fails or times out
   */
  getDevices(shopId: number, phone: string): Promise<DeviceDto[]>;
}

export const MARKETING_CLOUD_SERVICE_TOKEN = 'IMarketingCloudService';
