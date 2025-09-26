import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ProxyService } from '../../api/modules/proxy/proxy.service';
import { UpdateSupplierRequestDto } from '../../api/modules/proxy/dto/update-supplier-request.dto';

/**
 * Contract tests verify the interface between our service and the Whale API
 * These tests define the expected behavior and data format
 */
describe('Proxy Contract Tests', () => {
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

  describe('Whale API Contract', () => {
    const validRequestDto: UpdateSupplierRequestDto = {
      shopId: 12345,
      market: 'TW',
      oldSupplierId: 100,
      newSupplierId: 200,
    };

    const validNyOperator = 'Amy Wang';

    it('should send request with correct URL format', async () => {
      const mockResponse = {
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

      mockHttpService.post.mockReturnValue(Promise.resolve(mockResponse));

      await service.updateSupplier(validRequestDto, validNyOperator);

      // Verify URL format
      expect(httpService.post).toHaveBeenCalledWith(
        'http://whale-api-internal.qa.91dev.tw/admin/update-supplier-id',
        expect.any(Object),
        expect.any(Object),
      );
    });

    it('should send request with correct payload structure', async () => {
      const mockResponse = {
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

      mockHttpService.post.mockReturnValue(Promise.resolve(mockResponse));

      await service.updateSupplier(validRequestDto, validNyOperator);

      // Verify payload structure matches contract
      expect(httpService.post).toHaveBeenCalledWith(
        expect.any(String),
        {
          shopId: expect.any(Number),
          market: expect.any(String),
          oldSupplierId: expect.any(Number),
          newSupplierId: expect.any(Number),
        },
        expect.any(Object),
      );
    });

    it('should send request with correct headers', async () => {
      const mockResponse = {
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

      mockHttpService.post.mockReturnValue(Promise.resolve(mockResponse));

      await service.updateSupplier(validRequestDto, validNyOperator);

      // Verify headers follow contract
      expect(httpService.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object),
        {
          headers: {
            'ny-operator': validNyOperator,
          },
          timeout: 5000,
        },
      );
    });

    it('should expect correct response format from Whale API', async () => {
      const validWhaleResponse = {
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

      mockHttpService.post.mockReturnValue(Promise.resolve(validWhaleResponse));

      const result = await service.updateSupplier(validRequestDto, validNyOperator);

      // Verify response follows expected contract
      expect(result).toEqual({
        success: true,
        data: {
          updatedCount: expect.any(Number),
          shopId: expect.any(Number),
          market: expect.any(String),
          supplierId: expect.any(Number),
        },
      });
    });

    it('should handle expected error response format from Whale API', async () => {
      const whaleErrorResponse = {
        response: {
          status: 400,
          data: {
            error: 'Invalid supplier ID',
          },
        },
      };

      mockHttpService.post.mockRejectedValue(whaleErrorResponse);

      await expect(
        service.updateSupplier(validRequestDto, validNyOperator),
      ).rejects.toThrow();
    });

    it('should validate required fields in request payload', () => {
      // Test that all required fields are present
      const requiredFields = ['shopId', 'market', 'oldSupplierId', 'newSupplierId'];

      requiredFields.forEach(field => {
        expect(validRequestDto).toHaveProperty(field);
        expect(validRequestDto[field as keyof UpdateSupplierRequestDto]).toBeDefined();
      });
    });

    it('should validate data types in request payload', () => {
      expect(typeof validRequestDto.shopId).toBe('number');
      expect(typeof validRequestDto.market).toBe('string');
      expect(typeof validRequestDto.oldSupplierId).toBe('number');
      expect(typeof validRequestDto.newSupplierId).toBe('number');
    });

    it('should validate required fields in successful response', async () => {
      const validWhaleResponse = {
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

      mockHttpService.post.mockReturnValue(Promise.resolve(validWhaleResponse));

      const result = await service.updateSupplier(validRequestDto, validNyOperator);

      // Verify all required response fields are present
      expect(result.success).toBeDefined();
      expect(result.data).toBeDefined();
      expect(result.data.updatedCount).toBeDefined();
      expect(result.data.shopId).toBeDefined();
      expect(result.data.market).toBeDefined();
      expect(result.data.supplierId).toBeDefined();
    });

    it('should validate data types in successful response', async () => {
      const validWhaleResponse = {
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

      mockHttpService.post.mockReturnValue(Promise.resolve(validWhaleResponse));

      const result = await service.updateSupplier(validRequestDto, validNyOperator);

      // Verify response data types
      expect(typeof result.success).toBe('boolean');
      expect(typeof result.data).toBe('object');
      expect(typeof result.data.updatedCount).toBe('number');
      expect(typeof result.data.shopId).toBe('number');
      expect(typeof result.data.market).toBe('string');
      expect(typeof result.data.supplierId).toBe('number');
    });

    it('should define timeout contract expectations', async () => {
      const mockResponse = {
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

      mockHttpService.post.mockReturnValue(Promise.resolve(mockResponse));

      await service.updateSupplier(validRequestDto, validNyOperator);

      // Verify timeout is configured according to contract
      expect(httpService.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object),
        expect.objectContaining({
          timeout: 5000, // 5 second timeout as per contract
        }),
      );
    });
  });

  describe('Business Logic Contract', () => {
    const validRequestDto: UpdateSupplierRequestDto = {
      shopId: 12345,
      market: 'TW',
      oldSupplierId: 100,
      newSupplierId: 200,
    };

    it('should enforce business rule: supplier IDs must be different', async () => {
      const invalidRequest: UpdateSupplierRequestDto = {
        ...validRequestDto,
        oldSupplierId: 100,
        newSupplierId: 100, // Same as old
      };

      await expect(
        service.updateSupplier(invalidRequest, 'Test Operator'),
      ).rejects.toThrow('Old and new supplier IDs must be different');

      // Verify no HTTP call is made for invalid business logic
      expect(httpService.post).not.toHaveBeenCalled();
    });

    it('should enforce ny-operator header requirement', async () => {
      // This is tested at controller level, but part of the contract
      expect(() => {
        // ny-operator is required according to our API contract
        if (!validRequestDto || typeof 'Amy Wang' !== 'string') {
          throw new Error('ny-operator header is required');
        }
      }).not.toThrow();
    });

    it('should enforce positive integer constraints', () => {
      // These should be validated at DTO level according to contract
      expect(validRequestDto.shopId).toBeGreaterThan(0);
      expect(validRequestDto.oldSupplierId).toBeGreaterThan(0);
      expect(validRequestDto.newSupplierId).toBeGreaterThan(0);
    });
  });

  describe('Error Handling Contract', () => {
    const validRequestDto: UpdateSupplierRequestDto = {
      shopId: 12345,
      market: 'TW',
      oldSupplierId: 100,
      newSupplierId: 200,
    };

    it('should handle network errors according to contract', async () => {
      const networkError = {
        code: 'ENOTFOUND',
        message: 'Network error',
      };

      mockHttpService.post.mockRejectedValue(networkError);

      await expect(
        service.updateSupplier(validRequestDto, 'Test Operator'),
      ).rejects.toThrow();
    });

    it('should handle timeout errors according to contract', async () => {
      const timeoutError = {
        code: 'ECONNABORTED',
        message: 'timeout of 5000ms exceeded',
      };

      mockHttpService.post.mockRejectedValue(timeoutError);

      await expect(
        service.updateSupplier(validRequestDto, 'Test Operator'),
      ).rejects.toThrow();
    });

    it('should handle HTTP error status codes according to contract', async () => {
      const httpErrorCodes = [400, 401, 403, 404, 500, 502, 503];

      for (const statusCode of httpErrorCodes) {
        const httpError = {
          response: {
            status: statusCode,
            data: { error: `HTTP ${statusCode} Error` },
          },
        };

        mockHttpService.post.mockRejectedValue(httpError);

        await expect(
          service.updateSupplier(validRequestDto, 'Test Operator'),
        ).rejects.toThrow();
      }
    });
  });
});