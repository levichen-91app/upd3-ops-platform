import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { MarketingCloudService } from './marketing-cloud.service';
import { of, throwError } from 'rxjs';
import { AxiosResponse, AxiosError } from 'axios';
import { ExternalApiException } from '../../../common/exceptions/external-api.exception';
import { ERROR_CODES } from '../../../constants/error-codes.constants';

describe('MarketingCloudService', () => {
  let service: MarketingCloudService;
  let httpService: HttpService;
  let configService: ConfigService;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'marketingCloud') {
        return {
          baseUrl: 'https://marketing-cloud.example.com',
          timeout: 10000,
        };
      }
      return undefined;
    }),
  };

  const mockHttpService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MarketingCloudService,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: HttpService, useValue: mockHttpService },
      ],
    }).compile();

    service = module.get<MarketingCloudService>(MarketingCloudService);
    httpService = module.get<HttpService>(HttpService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getDevices', () => {
    const shopId = 12345;
    const phone = '0912345678';

    it('應該成功獲取設備列表', async () => {
      const mockDevices = [
        {
          id: 'device-1',
          deviceId: 'abc123',
          platform: 'iOS',
        },
        {
          id: 'device-2',
          deviceId: 'def456',
          platform: 'Android',
        },
      ];

      const mockResponse: AxiosResponse = {
        data: mockDevices,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      mockHttpService.get.mockReturnValue(of(mockResponse));

      const result = await service.getDevices(shopId, phone);

      expect(result).toEqual(mockDevices);
      expect(mockHttpService.get).toHaveBeenCalledWith(
        'https://marketing-cloud.example.com/devices',
        {
          params: {
            shopId: shopId.toString(),
            phone,
          },
        },
      );
    });

    it('應該處理空陣列回應', async () => {
      const mockResponse: AxiosResponse = {
        data: [],
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      mockHttpService.get.mockReturnValue(of(mockResponse));

      const result = await service.getDevices(shopId, phone);

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('應該處理 null 回應', async () => {
      const mockResponse: AxiosResponse = {
        data: null,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      mockHttpService.get.mockReturnValue(of(mockResponse));

      const result = await service.getDevices(shopId, phone);

      expect(result).toEqual([]);
    });

    it('應該處理 undefined 回應', async () => {
      const mockResponse: AxiosResponse = {
        data: undefined,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      mockHttpService.get.mockReturnValue(of(mockResponse));

      const result = await service.getDevices(shopId, phone);

      expect(result).toEqual([]);
    });

    it('應該處理非陣列回應', async () => {
      const mockResponse: AxiosResponse = {
        data: { message: 'Invalid response format' },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      mockHttpService.get.mockReturnValue(of(mockResponse));

      const result = await service.getDevices(shopId, phone);

      expect(result).toEqual([]);
    });

    it('應該拋出 ExternalApiException 當請求超時（DEADLINE_EXCEEDED）', async () => {
      const timeoutError = {
        name: 'TimeoutError',
        message: 'Timeout has occurred',
        code: 'ECONNABORTED',
      };

      mockHttpService.get.mockReturnValue(throwError(() => timeoutError));

      await expect(service.getDevices(shopId, phone)).rejects.toThrow(
        ExternalApiException,
      );

      await expect(service.getDevices(shopId, phone)).rejects.toMatchObject({
        response: {
          code: ERROR_CODES.DEADLINE_EXCEEDED,
        },
      });
    });

    it('應該拋出 ExternalApiException 當 HTTP 400 錯誤（INVALID_ARGUMENT）', async () => {
      const axiosError: AxiosError = {
        name: 'AxiosError',
        message: 'Request failed with status code 400',
        response: {
          status: 400,
          statusText: 'Bad Request',
          data: { error: 'Invalid parameters' },
          headers: {},
          config: {} as any,
        },
        config: {} as any,
        code: 'ERR_BAD_REQUEST',
        isAxiosError: true,
        toJSON: () => ({}),
      };

      mockHttpService.get.mockReturnValue(throwError(() => axiosError));

      await expect(service.getDevices(shopId, phone)).rejects.toThrow(
        ExternalApiException,
      );

      await expect(service.getDevices(shopId, phone)).rejects.toMatchObject({
        response: {
          code: ERROR_CODES.INVALID_ARGUMENT,
        },
      });
    });

    it('應該拋出 ExternalApiException 當 HTTP 401 錯誤（PERMISSION_DENIED）', async () => {
      const axiosError: AxiosError = {
        name: 'AxiosError',
        message: 'Request failed with status code 401',
        response: {
          status: 401,
          statusText: 'Unauthorized',
          data: { error: 'Invalid credentials' },
          headers: {},
          config: {} as any,
        },
        config: {} as any,
        code: 'ERR_BAD_REQUEST',
        isAxiosError: true,
        toJSON: () => ({}),
      };

      mockHttpService.get.mockReturnValue(throwError(() => axiosError));

      await expect(service.getDevices(shopId, phone)).rejects.toThrow(
        ExternalApiException,
      );

      await expect(service.getDevices(shopId, phone)).rejects.toMatchObject({
        response: {
          code: ERROR_CODES.PERMISSION_DENIED,
        },
      });
    });

    it('應該拋出 ExternalApiException 當 HTTP 403 錯誤（PERMISSION_DENIED）', async () => {
      const axiosError: AxiosError = {
        name: 'AxiosError',
        message: 'Request failed with status code 403',
        response: {
          status: 403,
          statusText: 'Forbidden',
          data: { error: 'Access denied' },
          headers: {},
          config: {} as any,
        },
        config: {} as any,
        code: 'ERR_BAD_REQUEST',
        isAxiosError: true,
        toJSON: () => ({}),
      };

      mockHttpService.get.mockReturnValue(throwError(() => axiosError));

      await expect(service.getDevices(shopId, phone)).rejects.toThrow(
        ExternalApiException,
      );

      await expect(service.getDevices(shopId, phone)).rejects.toMatchObject({
        response: {
          code: ERROR_CODES.PERMISSION_DENIED,
        },
      });
    });

    it('應該拋出 ExternalApiException 當 HTTP 404 錯誤（NOT_FOUND）', async () => {
      const axiosError: AxiosError = {
        name: 'AxiosError',
        message: 'Request failed with status code 404',
        response: {
          status: 404,
          statusText: 'Not Found',
          data: { error: 'Resource not found' },
          headers: {},
          config: {} as any,
        },
        config: {} as any,
        code: 'ERR_BAD_REQUEST',
        isAxiosError: true,
        toJSON: () => ({}),
      };

      mockHttpService.get.mockReturnValue(throwError(() => axiosError));

      await expect(service.getDevices(shopId, phone)).rejects.toThrow(
        ExternalApiException,
      );

      await expect(service.getDevices(shopId, phone)).rejects.toMatchObject({
        response: {
          code: ERROR_CODES.NOT_FOUND,
        },
      });
    });

    it('應該拋出 ExternalApiException 當 HTTP 429 錯誤（RESOURCE_EXHAUSTED）', async () => {
      const axiosError: AxiosError = {
        name: 'AxiosError',
        message: 'Request failed with status code 429',
        response: {
          status: 429,
          statusText: 'Too Many Requests',
          data: { error: 'Rate limit exceeded' },
          headers: {},
          config: {} as any,
        },
        config: {} as any,
        code: 'ERR_BAD_REQUEST',
        isAxiosError: true,
        toJSON: () => ({}),
      };

      mockHttpService.get.mockReturnValue(throwError(() => axiosError));

      await expect(service.getDevices(shopId, phone)).rejects.toThrow(
        ExternalApiException,
      );

      await expect(service.getDevices(shopId, phone)).rejects.toMatchObject({
        response: {
          code: ERROR_CODES.RESOURCE_EXHAUSTED,
        },
      });
    });

    it('應該拋出 ExternalApiException 當 HTTP 500 錯誤（UNAVAILABLE）', async () => {
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

      await expect(service.getDevices(shopId, phone)).rejects.toThrow(
        ExternalApiException,
      );

      await expect(service.getDevices(shopId, phone)).rejects.toMatchObject({
        response: {
          code: ERROR_CODES.UNAVAILABLE,
        },
      });
    });

    it('應該拋出 ExternalApiException 當 HTTP 503 錯誤（UNAVAILABLE）', async () => {
      const axiosError: AxiosError = {
        name: 'AxiosError',
        message: 'Request failed with status code 503',
        response: {
          status: 503,
          statusText: 'Service Unavailable',
          data: { error: 'Service temporarily unavailable' },
          headers: {},
          config: {} as any,
        },
        config: {} as any,
        code: 'ERR_BAD_RESPONSE',
        isAxiosError: true,
        toJSON: () => ({}),
      };

      mockHttpService.get.mockReturnValue(throwError(() => axiosError));

      await expect(service.getDevices(shopId, phone)).rejects.toThrow(
        ExternalApiException,
      );

      await expect(service.getDevices(shopId, phone)).rejects.toMatchObject({
        response: {
          code: ERROR_CODES.UNAVAILABLE,
        },
      });
    });

    it('應該拋出 ExternalApiException 當網路連線錯誤（UNAVAILABLE）', async () => {
      const networkError: any = new Error('ECONNREFUSED: Connection refused');
      networkError.code = 'ECONNREFUSED';

      mockHttpService.get.mockReturnValue(throwError(() => networkError));

      await expect(service.getDevices(shopId, phone)).rejects.toThrow(
        ExternalApiException,
      );

      await expect(service.getDevices(shopId, phone)).rejects.toMatchObject({
        response: {
          code: ERROR_CODES.UNAVAILABLE,
        },
      });
    });

    it('應該正確載入配置參數', () => {
      expect(mockConfigService.get).toHaveBeenCalledWith('marketingCloud');
    });

    it('應該使用正確的 URL 和參數格式', async () => {
      const mockResponse: AxiosResponse = {
        data: [],
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      mockHttpService.get.mockReturnValue(of(mockResponse));

      await service.getDevices(shopId, phone);

      expect(mockHttpService.get).toHaveBeenCalledWith(
        'https://marketing-cloud.example.com/devices',
        {
          params: {
            shopId: '12345',
            phone: '0912345678',
          },
        },
      );
    });
  });

  describe('configuration', () => {
    it('應該從 ConfigService 正確載入配置', () => {
      expect(mockConfigService.get).toHaveBeenCalledWith('marketingCloud');
    });
  });
});
