import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { BadRequestException, BadGatewayException } from '@nestjs/common';
import { ProxyService } from './proxy.service';
import { UpdateSupplierRequestDto } from './dto/update-supplier-request.dto';
import { of, throwError } from 'rxjs';
import { AxiosResponse, AxiosError } from 'axios';

describe('ProxyService', () => {
  let service: ProxyService;
  let httpService: HttpService;

  const mockHttpService = {
    post: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProxyService,
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
      ],
    }).compile();

    service = module.get<ProxyService>(ProxyService);
    httpService = module.get<HttpService>(HttpService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('updateSupplier', () => {
    const validRequestDto: UpdateSupplierRequestDto = {
      shopId: 12345,
      market: 'TW',
      oldSupplierId: 100,
      newSupplierId: 200,
    };

    const validNyOperator = 'Amy Wang';

    it('should successfully forward request to Whale API', async () => {
      const mockResponse: AxiosResponse = {
        data: {
          success: true,
          data: {
            updatedCount: 5,
            shopId: 12345,
            market: 'TW',
            supplierId: 200,
          },
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      mockHttpService.post.mockReturnValue(of(mockResponse));

      const result = await service.updateSupplier(
        validRequestDto,
        validNyOperator,
      );

      expect(result).toEqual(mockResponse.data);
      expect(httpService.post).toHaveBeenCalledWith(
        'http://whale-api-internal.qa.91dev.tw/admin/update-supplier-id',
        validRequestDto,
        {
          headers: {
            'ny-operator': validNyOperator,
            'Content-Type': 'application/json',
          },
        },
      );
    });

    it('should validate business logic - same supplier IDs', async () => {
      const invalidDto: UpdateSupplierRequestDto = {
        shopId: 12345,
        market: 'TW',
        oldSupplierId: 100,
        newSupplierId: 100, // Same as oldSupplierId
      };

      await expect(
        service.updateSupplier(invalidDto, validNyOperator),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.updateSupplier(invalidDto, validNyOperator),
      ).rejects.toThrow('Old and new supplier IDs must be different');

      expect(httpService.post).not.toHaveBeenCalled();
    });

    it('should handle HTTP errors from Whale API', async () => {
      const axiosError = new AxiosError('Request failed');
      axiosError.response = {
        status: 400,
        data: { error: 'Bad request' },
        statusText: 'Bad Request',
        headers: {},
        config: {} as any,
      };

      mockHttpService.post.mockReturnValue(throwError(() => axiosError));

      await expect(
        service.updateSupplier(validRequestDto, validNyOperator),
      ).rejects.toThrow(BadGatewayException);
    });

    it('should handle network errors', async () => {
      const networkError = new AxiosError('Network Error');
      networkError.code = 'ENOTFOUND';

      mockHttpService.post.mockReturnValue(throwError(() => networkError));

      await expect(
        service.updateSupplier(validRequestDto, validNyOperator),
      ).rejects.toThrow(BadGatewayException);

      await expect(
        service.updateSupplier(validRequestDto, validNyOperator),
      ).rejects.toThrow('External API unreachable');
    });

    it('should validate response format from Whale API', async () => {
      const invalidResponse: AxiosResponse = {
        data: 'Invalid response format',
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      mockHttpService.post.mockReturnValue(of(invalidResponse));

      await expect(
        service.updateSupplier(validRequestDto, validNyOperator),
      ).rejects.toThrow(BadGatewayException);

      await expect(
        service.updateSupplier(validRequestDto, validNyOperator),
      ).rejects.toThrow('External API response format is invalid');
    });

    it('should handle response with only essential fields', async () => {
      const essentialFieldsResponse: AxiosResponse = {
        data: {
          success: true,
          data: {
            updatedCount: 5,
            shopId: 12345,
            // market and supplierId will be defaulted by our logic
          },
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      mockHttpService.post.mockReturnValue(of(essentialFieldsResponse));

      const result = await service.updateSupplier(validRequestDto, validNyOperator);

      expect(result).toEqual({
        success: true,
        data: {
          updatedCount: 5,
          shopId: 12345,
          market: 'TW', // Default value
          supplierId: undefined, // No default available
        },
      });
    });

    it('should handle different market codes correctly', async () => {
      const hkRequestDto: UpdateSupplierRequestDto = {
        shopId: 67890,
        market: 'HK',
        oldSupplierId: 200,
        newSupplierId: 300,
      };

      const mockResponse: AxiosResponse = {
        data: {
          success: true,
          data: {
            updatedCount: 3,
            shopId: 67890,
            market: 'HK',
            supplierId: 300,
          },
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      mockHttpService.post.mockReturnValue(of(mockResponse));

      const result = await service.updateSupplier(hkRequestDto, 'John Doe');

      expect(result.data.market).toBe('HK');
      expect(httpService.post).toHaveBeenCalledWith(
        'http://whale-api-internal.qa.91dev.tw/admin/update-supplier-id',
        hkRequestDto,
        {
          headers: {
            'ny-operator': 'John Doe',
            'Content-Type': 'application/json',
          },
        },
      );
    });

    it('should handle zero updated count', async () => {
      const mockResponse: AxiosResponse = {
        data: {
          success: true,
          data: {
            updatedCount: 0,
            shopId: 12345,
            market: 'TW',
            supplierId: 200,
          },
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      mockHttpService.post.mockReturnValue(of(mockResponse));

      const result = await service.updateSupplier(
        validRequestDto,
        validNyOperator,
      );

      expect(result.data.updatedCount).toBe(0);
      expect(result.success).toBe(true);
    });

    it('should preserve all response data from Whale API', async () => {
      const mockResponse: AxiosResponse = {
        data: {
          success: true,
          data: {
            updatedCount: 5,
            shopId: 12345,
            market: 'TW',
            supplierId: 200,
            additionalField: 'extra data', // Additional field from Whale API
          },
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      mockHttpService.post.mockReturnValue(of(mockResponse));

      const result = await service.updateSupplier(
        validRequestDto,
        validNyOperator,
      );

      expect(result).toEqual(mockResponse.data);
      expect(result.data.additionalField).toBe('extra data');
    });

    it('should handle very large shop IDs', async () => {
      const largeShopIdRequest: UpdateSupplierRequestDto = {
        shopId: 999999999,
        market: 'TW',
        oldSupplierId: 100,
        newSupplierId: 200,
      };

      const mockResponse: AxiosResponse = {
        data: {
          success: true,
          data: {
            updatedCount: 1,
            shopId: 999999999,
            market: 'TW',
            supplierId: 200,
          },
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      mockHttpService.post.mockReturnValue(of(mockResponse));

      const result = await service.updateSupplier(
        largeShopIdRequest,
        validNyOperator,
      );

      expect(result).toEqual(mockResponse.data);
      expect(result.data.shopId).toBe(999999999);
    });

    it('should handle different market codes beyond TW', async () => {
      const markets = ['US', 'JP', 'KR', 'SG', 'MY'];

      for (const market of markets) {
        const requestDto: UpdateSupplierRequestDto = {
          ...validRequestDto,
          market,
        };

        const mockResponse: AxiosResponse = {
          data: {
            success: true,
            data: {
              updatedCount: 3,
              shopId: 12345,
              market,
              supplierId: 200,
            },
          },
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {} as any,
        };

        mockHttpService.post.mockReturnValue(of(mockResponse));

        const result = await service.updateSupplier(requestDto, validNyOperator);

        expect(result.data.market).toBe(market);
        expect(httpService.post).toHaveBeenCalledWith(
          'http://whale-api-internal.qa.91dev.tw/admin/update-supplier-id',
          requestDto,
          {
            headers: {
              'ny-operator': validNyOperator,
              'Content-Type': 'application/json',
            },
          },
        );
      }
    });

    it('should handle HTTP 500 errors from Whale API', async () => {
      const mockError: AxiosError = {
        message: 'Internal Server Error',
        name: 'AxiosError',
        response: {
          status: 500,
          data: { error: 'Internal server error' },
          statusText: 'Internal Server Error',
          headers: {},
          config: {} as any,
        },
        config: {} as any,
        isAxiosError: true,
        toJSON: () => ({}),
      };

      mockHttpService.post.mockReturnValue(throwError(() => mockError));

      await expect(
        service.updateSupplier(validRequestDto, validNyOperator),
      ).rejects.toThrow(BadGatewayException);
    });

    it('should handle HTTP 401 Unauthorized errors', async () => {
      const mockError: AxiosError = {
        message: 'Unauthorized',
        name: 'AxiosError',
        response: {
          status: 401,
          data: { error: 'Unauthorized' },
          statusText: 'Unauthorized',
          headers: {},
          config: {} as any,
        },
        config: {} as any,
        isAxiosError: true,
        toJSON: () => ({}),
      };

      mockHttpService.post.mockReturnValue(throwError(() => mockError));

      await expect(
        service.updateSupplier(validRequestDto, validNyOperator),
      ).rejects.toThrow(BadGatewayException);
    });

    it('should handle very long ny-operator values', async () => {
      const longOperatorName = 'A'.repeat(1000);

      const mockResponse: AxiosResponse = {
        data: {
          success: true,
          data: {
            updatedCount: 2,
            shopId: 12345,
            market: 'TW',
            supplierId: 200,
          },
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      mockHttpService.post.mockReturnValue(of(mockResponse));

      const result = await service.updateSupplier(
        validRequestDto,
        longOperatorName,
      );

      expect(result).toEqual(mockResponse.data);
      expect(httpService.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object),
        {
          headers: {
            'ny-operator': longOperatorName,
            'Content-Type': 'application/json',
          },
        },
      );
    });

    it('should validate that oldSupplierId and newSupplierId are different even when very similar', async () => {
      const sameIdRequest: UpdateSupplierRequestDto = {
        shopId: 12345,
        market: 'TW',
        oldSupplierId: 999,
        newSupplierId: 999,
      };

      await expect(
        service.updateSupplier(sameIdRequest, validNyOperator),
      ).rejects.toThrow(BadRequestException);

      expect(httpService.post).not.toHaveBeenCalled();
    });

    it('should handle response with truly invalid structure', async () => {
      const invalidResponse: AxiosResponse = {
        data: {
          success: true,
          data: {
            // Missing essential fields: updatedCount and shopId
            someOtherField: 'value',
          },
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      mockHttpService.post.mockReturnValue(of(invalidResponse));

      await expect(
        service.updateSupplier(validRequestDto, validNyOperator),
      ).rejects.toThrow(BadGatewayException);
    });

    it('should handle concurrent requests properly', async () => {
      const mockResponse: AxiosResponse = {
        data: {
          success: true,
          data: {
            updatedCount: 1,
            shopId: 12345,
            market: 'TW',
            supplierId: 200,
          },
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      mockHttpService.post.mockReturnValue(of(mockResponse));

      // Execute multiple requests concurrently
      const promises = Array.from({ length: 5 }, () =>
        service.updateSupplier(validRequestDto, `Operator-${Math.random()}`),
      );

      const results = await Promise.all(promises);

      expect(results).toHaveLength(5);
      expect(httpService.post).toHaveBeenCalledTimes(5);
      results.forEach(result => {
        expect(result).toEqual(mockResponse.data);
      });
    });
  });
});
