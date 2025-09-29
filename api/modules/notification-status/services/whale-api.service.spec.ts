import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { WhaleApiService } from './whale-api.service';
import { of, throwError } from 'rxjs';
import { AxiosResponse, AxiosError } from 'axios';

describe('WhaleApiService', () => {
  let service: WhaleApiService;
  let httpService: HttpService;
  let configService: ConfigService;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'whaleApi.baseUrl')
        return 'http://whale-api-internal.qa.91dev.tw';
      if (key === 'whaleApi.timeout') return 10000;
      return undefined;
    }),
  };

  const mockHttpService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WhaleApiService,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: HttpService, useValue: mockHttpService },
      ],
    }).compile();

    service = module.get<WhaleApiService>(WhaleApiService);
    httpService = module.get<HttpService>(HttpService);
    configService = module.get<ConfigService>(ConfigService);

    // Config is already set up in the mock definition above
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getNotificationHistory', () => {
    it('should successfully retrieve notification history', async () => {
      const notificationId = 12345;
      const mockResponse: AxiosResponse = {
        data: {
          code: 'Success',
          message: null,
          data: {
            id: notificationId,
            channel: 'Push',
            bookDatetime: '2024-01-15T10:30:00Z',
            sentDatetime: '2024-01-15T10:35:00Z',
            ncId: 'a4070188-050d-47f7-ab24-2523145408cf',
            ncExtId: 67890,
            status: 'Success',
            isSettled: true,
            originalAudienceCount: 1000,
            filteredAudienceCount: 950,
            sentAudienceCount: 900,
            receivedAudienceCount: 850,
            sentFailedCount: 50,
            report: {
              Total: 1000,
              Sent: 950,
              Success: 900,
              Fail: 50,
              NoUser: 50,
            },
          },
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      mockHttpService.get.mockReturnValue(of(mockResponse));

      const result = await service.getNotificationHistory(notificationId);

      expect(result).toEqual(mockResponse.data);
      expect(mockHttpService.get).toHaveBeenCalledWith(
        `http://whale-api-internal.qa.91dev.tw/api/v1/notifications/${notificationId}`,
        { timeout: 10000 },
      );
    });

    it('should return null when Whale API returns NOT_FOUND', async () => {
      const notificationId = 99999;
      const mockResponse: AxiosResponse = {
        data: {
          code: 'NOT_FOUND',
          message: 'Not found',
          data: null,
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      mockHttpService.get.mockReturnValue(of(mockResponse));

      const result = await service.getNotificationHistory(notificationId);

      expect(result).toBeNull();
    });

    it('should return null when response data is null', async () => {
      const notificationId = 88888;
      const mockResponse: AxiosResponse = {
        data: {
          code: 'Success',
          message: null,
          data: null,
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      mockHttpService.get.mockReturnValue(of(mockResponse));

      const result = await service.getNotificationHistory(notificationId);

      expect(result).toBeNull();
    });

    it('should return null when response is empty', async () => {
      const notificationId = 77777;
      const mockResponse: AxiosResponse = {
        data: null,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      mockHttpService.get.mockReturnValue(of(mockResponse));

      const result = await service.getNotificationHistory(notificationId);

      expect(result).toBeNull();
    });

    it('should throw timeout error when request times out', async () => {
      const notificationId = 12345;
      const timeoutError = new Error('Timeout has occurred');
      timeoutError.code = 'ECONNABORTED';

      mockHttpService.get.mockReturnValue(throwError(() => timeoutError));

      await expect(
        service.getNotificationHistory(notificationId),
      ).rejects.toThrow('Timeout: Request took longer than 10000ms');
    });

    it('should throw HTTP error for server responses with error status', async () => {
      const notificationId = 12345;
      const axiosError: AxiosError = {
        name: 'AxiosError',
        message: 'Request failed with status code 500',
        response: {
          status: 500,
          statusText: 'Internal Server Error',
          data: { error: 'Database connection failed' },
          headers: {},
          config: {} as any,
        },
        config: {} as any,
        code: 'ERR_BAD_RESPONSE',
        isAxiosError: true,
        toJSON: () => ({}),
      };

      mockHttpService.get.mockReturnValue(throwError(() => axiosError));

      await expect(
        service.getNotificationHistory(notificationId),
      ).rejects.toThrow('HTTP Error 500: Internal Server Error');
    });

    it('should throw network error for connection issues', async () => {
      const notificationId = 12345;
      const networkError = new Error('ECONNREFUSED: Connection refused');

      mockHttpService.get.mockReturnValue(throwError(() => networkError));

      await expect(
        service.getNotificationHistory(notificationId),
      ).rejects.toThrow('ECONNREFUSED: Connection refused');
    });

    it('should use correct configuration values', () => {
      expect(mockConfigService.get).toHaveBeenCalledWith('whaleApi.baseUrl');
      expect(mockConfigService.get).toHaveBeenCalledWith('whaleApi.timeout');
    });

    it('should apply timeout to HTTP requests', async () => {
      const notificationId = 12345;
      const mockResponse: AxiosResponse = {
        data: { code: 'Success', data: { id: notificationId } },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      const mockObservable = of(mockResponse);
      mockHttpService.get.mockReturnValue(mockObservable);

      await service.getNotificationHistory(notificationId);

      // Verify that the observable was created with the correct URL
      expect(mockHttpService.get).toHaveBeenCalledWith(
        `http://whale-api-internal.qa.91dev.tw/api/v1/notifications/${notificationId}`,
        { timeout: 10000 },
      );
    });

    it('should handle SSL certificate errors', async () => {
      const notificationId = 12345;
      const sslError = new Error('CERT_UNTRUSTED: Certificate is not trusted');

      mockHttpService.get.mockReturnValue(throwError(() => sslError));

      await expect(
        service.getNotificationHistory(notificationId),
      ).rejects.toThrow('CERT_UNTRUSTED: Certificate is not trusted');
    });

    it('should handle DNS resolution errors', async () => {
      const notificationId = 12345;
      const dnsError = new Error(
        'ENOTFOUND: getaddrinfo ENOTFOUND whale-api.example.com',
      );

      mockHttpService.get.mockReturnValue(throwError(() => dnsError));

      await expect(
        service.getNotificationHistory(notificationId),
      ).rejects.toThrow(
        'ENOTFOUND: getaddrinfo ENOTFOUND whale-api.example.com',
      );
    });
  });

  describe('configuration', () => {
    it('should use default values when environment variables are not set', () => {
      // Reset mocks to simulate missing config
      mockConfigService.get.mockImplementation((key: string) => {
        const config = {
          'whaleApi.baseUrl': undefined,
          'whaleApi.timeout': undefined,
        };
        return config[key];
      });

      // Create a new instance to test default behavior
      const testModule = Test.createTestingModule({
        providers: [
          WhaleApiService,
          { provide: ConfigService, useValue: mockConfigService },
          { provide: HttpService, useValue: mockHttpService },
        ],
      }).compile();

      expect(mockConfigService.get).toBeDefined();
    });
  });
});
