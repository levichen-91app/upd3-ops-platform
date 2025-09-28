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
import { Device, isDevice } from '../entities/device.entity';
import {
  IMarketingCloudApiService,
  MarketingCloudApiResponse,
} from '../interfaces/marketing-cloud-api.interface';
import {
  maskPhoneNumber,
  sanitizeDevices,
  createSafeLogMessage,
} from '../../../common/utils/privacy.util';

@Injectable()
export class MarketingCloudApiService implements IMarketingCloudApiService {
  private readonly logger = new Logger(MarketingCloudApiService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async getMemberDevices(
    shopId: number,
    phone: string,
    operator: string,
  ): Promise<MarketingCloudApiResponse> {
    const requestId = this.generateRequestId();
    const maskedPhone = maskPhoneNumber(phone);

    this.logger.log(
      createSafeLogMessage('Starting Marketing Cloud API request', {
        shopId,
        phone: maskedPhone,
        operator,
        requestId,
      }),
    );

    try {
      const config = this.getApiConfiguration();
      const apiUrl = `${config.baseUrl}/v1/shops/${shopId}/phones/${phone}/devices`;

      this.logger.debug(
        createSafeLogMessage('Making external API call', {
          url: this.maskSensitiveUrl(apiUrl),
          timeout: config.timeout,
          requestId,
        }),
      );

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

      const devices = this.validateAndTransformDevices(response, requestId);

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

      return { devices };
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

      if (
        error instanceof NotFoundException ||
        error instanceof BadGatewayException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

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

    return { baseUrl, timeout };
  }

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

    return new BadGatewayException(
      'Marketing Cloud service is temporarily unavailable',
      {
        cause: error,
        description: error.message || 'Unknown network error',
      },
    );
  }

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

        continue;
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

  private generateRequestId(): string {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 8);
    return `mc-${timestamp}-${randomStr}`;
  }

  private maskSensitiveUrl(url: string): string {
    return url.replace(/phones\/(\d{10})/g, (match, phone) => {
      return `phones/${maskPhoneNumber(phone)}`;
    });
  }
}
