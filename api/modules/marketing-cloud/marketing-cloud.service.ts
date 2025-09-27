import {
  Injectable,
  Logger,
  NotFoundException,
  BadGatewayException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { AxiosError } from 'axios';
import { catchError, map, timeout } from 'rxjs/operators';
import { firstValueFrom, throwError } from 'rxjs';
import { Device, isDevice } from './entities/device.entity';
import { MemberDevicesData } from './dto/member-devices-response.dto';
import {
  maskPhoneNumber,
  sanitizeDevices,
  createSafeLogMessage,
} from '../../common/utils/privacy.util';

/**
 * Marketing Cloud Service
 * Handles integration with external Marketing Cloud Device API
 */
@Injectable()
export class MarketingCloudService {
  private readonly logger = new Logger(MarketingCloudService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Get member devices from Marketing Cloud API
   */
  async getMemberDevices(
    shopId: number,
    phone: string,
    operator: string,
  ): Promise<MemberDevicesData> {
    const requestId = this.generateRequestId();
    const maskedPhone = maskPhoneNumber(phone);

    // Check if mock mode is enabled
    const mockMode = process.env.MARKETING_CLOUD_MOCK_MODE === 'true';

    if (mockMode) {
      return this.getMockDevicesData(shopId, phone, operator, requestId, maskedPhone);
    }

    this.logger.log(
      createSafeLogMessage('Starting Marketing Cloud API request', {
        shopId,
        phone: maskedPhone,
        operator,
        requestId,
      }),
    );

    try {
      // Get configuration
      const config = this.getApiConfiguration();

      // Build API URL
      const apiUrl = `${config.baseUrl}/v1/shops/${shopId}/phones/${phone}/devices`;

      this.logger.debug(
        createSafeLogMessage('Making external API call', {
          url: this.maskSensitiveUrl(apiUrl),
          timeout: config.timeout,
          requestId,
        }),
      );

      // Make HTTP request with timeout
      const response = await firstValueFrom(
        this.httpService
          .get(apiUrl, {
            timeout: config.timeout,
            headers: {
              'User-Agent': 'upd3-ops-platform/1.0',
              'X-Request-ID': requestId,
            },
          })
          .pipe(
            timeout(config.timeout),
            map((res: any) => res.data),
            catchError((error: AxiosError) => {
              return throwError(() =>
                this.handleApiError(error, requestId, maskedPhone, shopId),
              );
            }),
          ),
      );

      // Validate and transform response
      const devices = this.validateAndTransformDevices(response, requestId);

      const result: MemberDevicesData = {
        shopId,
        phone,
        devices,
        totalCount: devices.length,
      };

      this.logger.log(
        createSafeLogMessage(
          'Marketing Cloud API request completed successfully',
          {
            shopId,
            phone: maskedPhone,
            deviceCount: devices.length,
            operator,
            requestId,
          },
        ),
      );

      return result;
    } catch (error) {
      this.logger.error(
        createSafeLogMessage('Marketing Cloud API request failed', {
          shopId,
          phone: maskedPhone,
          operator,
          requestId,
          error: error instanceof Error ? error.message : String(error),
        }),
      );

      // Re-throw if it's already a NestJS exception
      if (
        error instanceof NotFoundException ||
        error instanceof BadGatewayException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      // Wrap unexpected errors as BadGatewayException
      throw new BadGatewayException(
        'Marketing Cloud service is temporarily unavailable',
        {
          cause: error,
          description:
            'Unexpected error occurred while calling Marketing Cloud API',
        },
      );
    }
  }

  /**
   * Get API configuration from ConfigService
   */
  private getApiConfiguration() {
    const marketingCloudConfig = this.configService.get(
      'externalApis.marketingCloudApi',
    );

    if (!marketingCloudConfig) {
      throw new BadGatewayException(
        'Marketing Cloud API configuration not found',
      );
    }

    const environment = process.env.NODE_ENV || 'development';
    const market = process.env.MARKET || 'TW';

    // Check for environment variable overrides
    const baseUrl =
      process.env.MARKETING_CLOUD_API_URL_OVERRIDE ||
      marketingCloudConfig[environment]?.[market]?.url;

    const timeout = process.env.MARKETING_CLOUD_API_TIMEOUT
      ? parseInt(process.env.MARKETING_CLOUD_API_TIMEOUT, 10)
      : marketingCloudConfig[environment]?.[market]?.timeout || 5000;

    if (!baseUrl) {
      throw new BadGatewayException(
        `Marketing Cloud API configuration not found for environment: ${environment}, market: ${market}`,
      );
    }

    return {
      baseUrl,
      timeout,
    };
  }

  /**
   * Handle API errors and convert to appropriate NestJS exceptions
   */
  private handleApiError(
    error: AxiosError,
    requestId: string,
    maskedPhone: string,
    shopId: number,
  ): Error {
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      return new BadGatewayException(
        'Marketing Cloud service request timeout',
        {
          cause: error,
          description: `Request timed out after ${this.getApiConfiguration().timeout}ms`,
        },
      );
    }

    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      return new BadGatewayException(
        'Marketing Cloud service is temporarily unavailable',
        {
          cause: error,
          description: 'Cannot connect to Marketing Cloud service',
        },
      );
    }

    if (error.response) {
      const status = error.response.status;

      switch (status) {
        case 404:
          return new NotFoundException(
            'Member not found or has no registered devices',
            {
              cause: error,
              description: `No devices found for member with phone ${maskedPhone} in shop ${shopId}`,
            },
          );

        case 400:
          return new BadRequestException('Invalid request parameters', {
            cause: error,
            description: 'Marketing Cloud API rejected the request parameters',
          });

        case 401:
        case 403:
          return new BadGatewayException(
            'Marketing Cloud service authentication failed',
            {
              cause: error,
              description:
                'Authentication or authorization failed with Marketing Cloud API',
            },
          );

        case 500:
        case 502:
        case 503:
        case 504:
          return new BadGatewayException(
            'Marketing Cloud service is experiencing issues',
            {
              cause: error,
              description: `Marketing Cloud API returned ${status} status`,
            },
          );

        default:
          return new BadGatewayException(
            'Marketing Cloud service returned an error',
            {
              cause: error,
              description: `Marketing Cloud API returned ${status} status`,
            },
          );
      }
    }

    // Generic network error
    return new BadGatewayException(
      'Marketing Cloud service is temporarily unavailable',
      {
        cause: error,
        description: error.message || 'Unknown network error',
      },
    );
  }

  /**
   * Validate and transform API response to Device entities
   */
  private validateAndTransformDevices(
    response: any,
    requestId: string,
  ): Device[] {
    if (!Array.isArray(response)) {
      this.logger.warn(
        createSafeLogMessage(
          'Marketing Cloud API returned non-array response',
          {
            responseType: typeof response,
            requestId,
          },
        ),
      );

      throw new BadGatewayException(
        'Marketing Cloud service returned invalid response format',
        {
          description: 'Expected array of devices, got ' + typeof response,
        },
      );
    }

    const devices: Device[] = [];

    for (let i = 0; i < response.length; i++) {
      const item = response[i];

      if (!isDevice(item)) {
        this.logger.warn(
          createSafeLogMessage('Marketing Cloud API returned invalid device', {
            deviceIndex: i,
            deviceData: sanitizeDevices([item])[0],
            requestId,
          }),
        );

        continue; // Skip invalid devices instead of failing the entire request
      }

      devices.push(item);
    }

    this.logger.debug(
      createSafeLogMessage('Validated devices from Marketing Cloud API', {
        totalReceived: response.length,
        validDevices: devices.length,
        requestId,
      }),
    );

    return devices;
  }

  /**
   * Generate unique request ID for tracking
   */
  private generateRequestId(): string {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 8);
    return `mc-${timestamp}-${randomStr}`;
  }

  /**
   * Mask sensitive parts of URL for logging
   */
  private maskSensitiveUrl(url: string): string {
    // Mask phone numbers in URLs
    return url.replace(/phones\/(\d{10})/g, (match, phone) => {
      return `phones/${maskPhoneNumber(phone)}`;
    });
  }

  /**
   * Generate mock device data for F2E integration
   */
  private async getMockDevicesData(
    shopId: number,
    phone: string,
    operator: string,
    requestId: string,
    maskedPhone: string,
  ): Promise<MemberDevicesData> {
    this.logger.log(
      createSafeLogMessage('Using Mock Marketing Cloud API data', {
        shopId,
        phone: maskedPhone,
        operator,
        requestId,
        mode: 'MOCK',
      }),
    );

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100));

    // Generate mock devices based on phone number for consistency
    const devices: Device[] = [];
    const phoneLastDigit = parseInt(phone.slice(-1), 10);

    // Generate 1-3 devices based on phone number
    const deviceCount = (phoneLastDigit % 3) + 1;

    for (let i = 0; i < deviceCount; i++) {
      const platforms = ['iOS', 'Android'];
      const platform = platforms[i % platforms.length];

      devices.push({
        guid: `mock-${shopId}-${phone}-device-${i + 1}-${Date.now()}`,
        udid: `MOCK${platform.toUpperCase()}${i + 1}${phoneLastDigit}`,
        token: `mock_push_token_${platform}_${i + 1}_${phoneLastDigit}_${requestId.slice(-8)}`,
        shopId,
        platformDef: platform,
        memberId: 100000 + (phoneLastDigit * 1000) + i,
        advertiseId: `mock-ad-${phoneLastDigit}${i}-1234-5678-9012-${requestId.slice(-12)}`,
        appVersion: `${2 + i}.${phoneLastDigit}.${i}`,
        updatedDateTime: new Date(Date.now() - (i * 24 * 60 * 60 * 1000)).toISOString(),
        createdDateTime: new Date(Date.now() - (30 + i * 10) * 24 * 60 * 60 * 1000).toISOString(),
      });
    }

    // Special cases for testing different scenarios
    if (phone.endsWith('000')) {
      // Return empty array for phones ending in 000
      return { shopId, phone, devices: [], totalCount: 0 };
    }

    if (phone.endsWith('404')) {
      // Simulate member not found
      throw new NotFoundException(
        'Member not found or has no registered devices',
        {
          cause: new Error('Mock 404 scenario'),
          description: `No devices found for member with phone ${maskedPhone} in shop ${shopId}`,
        },
      );
    }

    const result: MemberDevicesData = {
      shopId,
      phone,
      devices,
      totalCount: devices.length,
    };

    this.logger.log(
      createSafeLogMessage(
        'Mock Marketing Cloud API request completed successfully',
        {
          shopId,
          phone: maskedPhone,
          deviceCount: devices.length,
          operator,
          requestId,
          mode: 'MOCK',
        },
      ),
    );

    return result;
  }
}
