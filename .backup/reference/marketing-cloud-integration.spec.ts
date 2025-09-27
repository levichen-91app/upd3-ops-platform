import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { HttpModule, HttpService } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { of, throwError } from 'rxjs';
import { AxiosResponse, AxiosError } from 'axios';
import externalApisConfig from '../api/config/external-apis.config';
import { MarketingCloudModule } from '../api/modules/marketing-cloud/marketing-cloud.module';

/**
 * Integration Tests for Marketing Cloud API Complete Flow
 *
 * 測試目標：驗證模組間協作正確性
 * 測試脈絡：
 * - Controller → Service → External API 完整流程
 * - DTO 驗證機制
 * - Mock 外部 HTTP 呼叫
 * - 配置整合測試
 */

describe('Marketing Cloud Integration Tests (FAILING - TDD)', () => {
  let app: INestApplication;
  let httpService: HttpService;

  const mockDevice = {
    guid: '550e8400-e29b-41d4-a716-446655440000',
    udid: 'A1B2C3D4E5F6',
    token: 'abc123def456...',
    shopId: 12345,
    platformDef: 'iOS',
    memberId: 67890,
    advertiseId: '12345678-1234-5678-9012-123456789012',
    appVersion: '1.2.3',
    updatedDateTime: '2025-09-27T10:30:00.000Z',
    createdDateTime: '2025-09-01T08:15:00.000Z',
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        HttpModule,
        ConfigModule.forRoot({
          load: [externalApisConfig],
        }),
        MarketingCloudModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    httpService = moduleFixture.get<HttpService>(HttpService);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('Complete API Flow Integration', () => {
    const validShopId = 12345;
    const validPhone = '0912345678';
    const validOperator = 'system-admin';

    it('should complete full request-response cycle successfully', async () => {
      // Mock successful external API response
      const mockResponse: AxiosResponse = {
        data: [mockDevice],
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      jest.spyOn(httpService, 'get').mockReturnValue(of(mockResponse));

      const response = await request(app.getHttpServer())
        .get(
          `/api/v1/shops/${validShopId}/members/by-phone/${validPhone}/devices`,
        )
        .set('ny-operator', validOperator)
        .expect(200);

      // 驗證完整的 Controller → Service → External API 流程
      expect(response.body).toMatchObject({
        success: true,
        data: {
          shopId: validShopId,
          phone: validPhone,
          devices: expect.arrayContaining([
            expect.objectContaining({
              guid: mockDevice.guid,
              shopId: mockDevice.shopId,
              platformDef: mockDevice.platformDef,
            }),
          ]),
          totalCount: 1,
        },
      });

      // 驗證外部 API 呼叫參數正確
      expect(httpService.get).toHaveBeenCalledWith(
        expect.stringContaining(
          `/v1/shops/${validShopId}/phones/${validPhone}/devices`,
        ),
        expect.objectContaining({
          timeout: 5000,
        }),
      );

      // Test temporarily skipped - module is implemented
    });

    it('should handle DTO validation for invalid shopId', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/shops/abc/members/by-phone/0912345678/devices')
        .set('ny-operator', validOperator)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: expect.stringMatching(/INVALID_REQUEST|VALIDATION_FAILED/),
          message: expect.stringContaining('shopId'),
        },
      });

      // Test temporarily skipped - module is implemented
    });

    it('should handle ny-operator header validation', async () => {
      const response = await request(app.getHttpServer())
        .get(
          `/api/v1/shops/${validShopId}/members/by-phone/${validPhone}/devices`,
        )
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: expect.stringMatching(/UNAUTHORIZED|MISSING_OPERATOR/),
          message: expect.stringContaining('ny-operator'),
        },
      });

      // Test temporarily skipped - module is implemented
    });

    it('should handle external API 404 response', async () => {
      const mockError: AxiosError = {
        response: {
          status: 404,
          statusText: 'Not Found',
          data: {},
          headers: {},
          config: {} as any,
        },
        isAxiosError: true,
        name: 'AxiosError',
        message: 'Request failed with status code 404',
      } as AxiosError;

      jest
        .spyOn(httpService, 'get')
        .mockReturnValue(throwError(() => mockError));

      const response = await request(app.getHttpServer())
        .get(`/api/v1/shops/${validShopId}/members/by-phone/0900000000/devices`)
        .set('ny-operator', validOperator)
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: expect.stringMatching(/MEMBER_NOT_FOUND|NOT_FOUND/),
        },
      });

      // Test temporarily skipped - module is implemented
    });

    it('should handle external API timeout', async () => {
      const mockError: AxiosError = {
        code: 'ECONNABORTED',
        message: 'timeout of 5000ms exceeded',
        isAxiosError: true,
        name: 'AxiosError',
      } as AxiosError;

      jest
        .spyOn(httpService, 'get')
        .mockReturnValue(throwError(() => mockError));

      const response = await request(app.getHttpServer())
        .get(
          `/api/v1/shops/${validShopId}/members/by-phone/${validPhone}/devices`,
        )
        .set('ny-operator', validOperator)
        .expect(502);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: expect.stringMatching(/TIMEOUT|EXTERNAL_SERVICE_TIMEOUT/),
        },
      });

      // Test temporarily skipped - module is implemented
    });

    it('should handle multiple devices response', async () => {
      const mockDevices = [
        mockDevice,
        { ...mockDevice, guid: 'device-2-guid', platformDef: 'Android' },
      ];

      const mockResponse: AxiosResponse = {
        data: mockDevices,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      jest.spyOn(httpService, 'get').mockReturnValue(of(mockResponse));

      const response = await request(app.getHttpServer())
        .get(
          `/api/v1/shops/${validShopId}/members/by-phone/${validPhone}/devices`,
        )
        .set('ny-operator', validOperator)
        .expect(200);

      expect(response.body.data.totalCount).toBe(2);
      expect(response.body.data.devices).toHaveLength(2);

      // Test temporarily skipped - module is implemented
    });
  });

  describe('Configuration Integration', () => {
    it('should use correct environment-based configuration', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'test';

      // Mock successful response
      const mockResponse: AxiosResponse = {
        data: [mockDevice],
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      jest.spyOn(httpService, 'get').mockReturnValue(of(mockResponse));

      await request(app.getHttpServer())
        .get('/api/v1/shops/12345/members/by-phone/0912345678/devices')
        .set('ny-operator', 'test-operator');

      // 驗證使用了測試環境的配置
      expect(httpService.get).toHaveBeenCalledWith(
        expect.stringContaining('marketing-cloud-service.qa.91dev.tw'),
        expect.any(Object),
      );

      // Restore environment
      process.env.NODE_ENV = originalEnv;

      // Test temporarily skipped - module is implemented
    });

    it('should respect environment variable overrides', async () => {
      process.env.MARKETING_CLOUD_API_URL_OVERRIDE = 'http://custom-url.com';

      const mockResponse: AxiosResponse = {
        data: [mockDevice],
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      jest.spyOn(httpService, 'get').mockReturnValue(of(mockResponse));

      await request(app.getHttpServer())
        .get('/api/v1/shops/12345/members/by-phone/0912345678/devices')
        .set('ny-operator', 'test-operator');

      expect(httpService.get).toHaveBeenCalledWith(
        expect.stringContaining('custom-url.com'),
        expect.any(Object),
      );

      // Cleanup
      delete process.env.MARKETING_CLOUD_API_URL_OVERRIDE;

      // Test temporarily skipped - module is implemented
    });
  });

  describe('Request ID and Timestamp Validation', () => {
    it('should generate unique request ID for each request', async () => {
      const mockResponse: AxiosResponse = {
        data: [mockDevice],
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      jest.spyOn(httpService, 'get').mockReturnValue(of(mockResponse));

      const response1 = await request(app.getHttpServer())
        .get('/api/v1/shops/12345/members/by-phone/0912345678/devices')
        .set('ny-operator', 'test-operator');

      const response2 = await request(app.getHttpServer())
        .get('/api/v1/shops/12345/members/by-phone/0912345678/devices')
        .set('ny-operator', 'test-operator');

      expect(response1.body.requestId).toBeDefined();
      expect(response2.body.requestId).toBeDefined();
      expect(response1.body.requestId).not.toBe(response2.body.requestId);

      // Test temporarily skipped - module is implemented
    });

    it('should include proper timestamp in responses', async () => {
      const mockResponse: AxiosResponse = {
        data: [mockDevice],
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      jest.spyOn(httpService, 'get').mockReturnValue(of(mockResponse));

      const beforeRequest = new Date().toISOString();

      const response = await request(app.getHttpServer())
        .get('/api/v1/shops/12345/members/by-phone/0912345678/devices')
        .set('ny-operator', 'test-operator');

      const afterRequest = new Date().toISOString();

      expect(response.body.timestamp).toBeDefined();
      expect(
        new Date(response.body.timestamp).getTime(),
      ).toBeGreaterThanOrEqual(new Date(beforeRequest).getTime());
      expect(new Date(response.body.timestamp).getTime()).toBeLessThanOrEqual(
        new Date(afterRequest).getTime(),
      );

      // Test temporarily skipped - module is implemented
    });
  });
});
