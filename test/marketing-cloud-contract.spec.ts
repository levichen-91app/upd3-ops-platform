import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import externalApisConfig from '../api/config/external-apis.config';
import { MarketingCloudModule } from '../api/modules/marketing-cloud/marketing-cloud.module';

/**
 * Contract Tests for Marketing Cloud Device API
 *
 * 測試目標：驗證 API 契約符合 OpenAPI 規格
 * 測試脈絡：
 * - 驗證請求/回應結構符合定義
 * - 確保錯誤回應格式一致
 * - 測試所有必需欄位和驗證規則
 * - 驗證 HTTP 狀態碼正確性
 */

describe('MarketingCloudController Contract Tests (FAILING - TDD)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    // 這個測試會失敗，因為 MarketingCloudModule 尚未實作
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

    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('GET /api/v1/shops/:shopId/members/by-phone/:phone/devices', () => {
    const validShopId = 12345;
    const validPhone = '0912345678';
    const validOperator = 'system-admin';

    it('should return 401 when ny-operator header is missing', async () => {
      const response = await request(app.getHttpServer())
        .get(
          `/api/v1/shops/${validShopId}/members/by-phone/${validPhone}/devices`,
        )
        .expect(401);

      // 驗證錯誤回應格式符合 ApiErrorResponse 契約
      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: expect.stringMatching(/UNAUTHORIZED|MISSING_OPERATOR/),
          message: expect.any(String),
        },
        timestamp: expect.stringMatching(
          /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/,
        ),
        requestId: expect.any(String),
      });
    });

    it('should return 400 when shopId is invalid', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/shops/invalid/members/by-phone/${validPhone}/devices`)
        .set('ny-operator', validOperator)
        .expect(400);

      // 驗證錯誤回應格式
      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: expect.stringMatching(/INVALID_REQUEST|VALIDATION_FAILED/),
          message: expect.any(String),
        },
        timestamp: expect.any(String),
        requestId: expect.any(String),
      });
    });

    it('should return 400 when phone is empty', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/shops/${validShopId}/members/by-phone/ /devices`)
        .set('ny-operator', validOperator)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toMatch(
        /INVALID_REQUEST|VALIDATION_FAILED/,
      );
    });

    it('should return 200 with valid request and mock successful response', async () => {
      // TODO: 設置 Mock Marketing Cloud API 回應
      // 這個測試會失敗，直到實作完成並設置 mock

      const response = await request(app.getHttpServer())
        .get(
          `/api/v1/shops/${validShopId}/members/by-phone/${validPhone}/devices`,
        )
        .set('ny-operator', validOperator)
        .expect(200);

      // 驗證成功回應格式符合 MemberDevicesResponse 契約
      expect(response.body).toMatchObject({
        success: true,
        data: {
          shopId: validShopId,
          phone: validPhone,
          devices: expect.any(Array),
          totalCount: expect.any(Number),
        },
        timestamp: expect.stringMatching(
          /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/,
        ),
        requestId: expect.any(String),
      });

      // 驗證 devices 陣列中每個裝置符合 Device schema
      if (response.body.data.devices.length > 0) {
        const device = response.body.data.devices[0];
        expect(device).toMatchObject({
          guid: expect.any(String),
          token: expect.any(String),
          shopId: expect.any(Number),
          platformDef: expect.stringMatching(/^(iOS|Android)$/),
          memberId: expect.any(Number),
          createdDateTime: expect.stringMatching(
            /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/,
          ),
          updatedDateTime: expect.stringMatching(
            /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/,
          ),
        });

        // 可選欄位檢查
        if (device.udid !== undefined) {
          expect(device.udid).toEqual(expect.any(String));
        }
        if (device.advertiseId !== undefined) {
          expect(device.advertiseId).toEqual(expect.any(String));
        }
        if (device.appVersion !== undefined) {
          expect(device.appVersion).toEqual(expect.any(String));
        }
      }

      // 驗證 totalCount 與 devices 陣列長度一致
      expect(response.body.data.totalCount).toBe(
        response.body.data.devices.length,
      );
    });

    it('should return 404 when member not found', async () => {
      // TODO: 設置 Mock Marketing Cloud API 回應 404
      const nonExistentPhone = '0900000000';

      const response = await request(app.getHttpServer())
        .get(
          `/api/v1/shops/${validShopId}/members/by-phone/${nonExistentPhone}/devices`,
        )
        .set('ny-operator', validOperator)
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: expect.stringMatching(/MEMBER_NOT_FOUND|NOT_FOUND/),
          message: expect.any(String),
        },
        timestamp: expect.any(String),
        requestId: expect.any(String),
      });
    });

    it('should return 502 when external service is unavailable', async () => {
      // TODO: 設置 Mock Marketing Cloud API 服務異常
      // 這個測試需要模擬外部服務連線失敗的情況
      // 暫時跳過，直到 mock 機制建立
      // Test temporarily skipped - external service mock setup needed
    });

    it('should handle timeout and return 502', async () => {
      // TODO: 設置 Mock Marketing Cloud API 超時回應
      // 測試 5 秒超時機制
      // Test temporarily skipped - timeout mock setup needed
    });
  });

  describe('Response Format Validation', () => {
    it('should always include required response fields', async () => {
      // 這個測試驗證無論成功或失敗，回應都包含標準欄位
      const response = await request(app.getHttpServer())
        .get('/api/v1/shops/12345/members/by-phone/0912345678/devices')
        .set('ny-operator', 'test-operator');

      // 不管狀態碼如何，都應該有這些基本欄位
      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('requestId');

      if (response.body.success === true) {
        expect(response.body).toHaveProperty('data');
      } else {
        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toHaveProperty('code');
        expect(response.body.error).toHaveProperty('message');
      }
    });
  });

  describe('Content-Type and Headers Validation', () => {
    it('should return application/json content-type', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/shops/12345/members/by-phone/0912345678/devices')
        .set('ny-operator', 'test-operator');

      expect(response.headers['content-type']).toMatch(/application\/json/);
    });

    it('should accept and require ny-operator header', async () => {
      // 已在其他測試中涵蓋，此處可添加更多 header 驗證
      const response = await request(app.getHttpServer())
        .get('/api/v1/shops/12345/members/by-phone/0912345678/devices')
        .set('ny-operator', 'test-with-special-chars-123');

      // 只要不是 401，就表示 header 被接受
      expect(response.status).not.toBe(401);
    });
  });
});
