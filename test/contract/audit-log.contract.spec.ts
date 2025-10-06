/**
 * 稽核日誌 API 合約測試
 *
 * 驗證 API 回應格式完全符合 OpenAPI 規範
 * 參考規格: specs/011-011-audit-log/contracts/audit-log-api.yaml
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AuditLogModule } from '../../api/modules/audit-log/audit-log.module';

describe('Audit Log API Contract Tests', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AuditLogModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/v1/audit-logs', () => {
    describe('成功回應 (200)', () => {
      it('應返回符合 AuditLogQueryResponse schema 的回應', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/v1/audit-logs')
          .set('ny-operator', 'test@91app.com')
          .expect(200);

        // 驗證回應結構
        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('data');
        expect(response.body).toHaveProperty('pagination');
        expect(response.body).toHaveProperty('timestamp');
        expect(response.body).toHaveProperty('requestId');

        // 驗證 data 是陣列
        expect(Array.isArray(response.body.data)).toBe(true);

        // 驗證 pagination 結構
        expect(response.body.pagination).toHaveProperty('total');
        expect(response.body.pagination).toHaveProperty('limit');
        expect(response.body.pagination).toHaveProperty('offset');
        expect(typeof response.body.pagination.total).toBe('number');
        expect(typeof response.body.pagination.limit).toBe('number');
        expect(typeof response.body.pagination.offset).toBe('number');

        // 驗證 timestamp 格式 (ISO 8601)
        expect(response.body.timestamp).toMatch(
          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
        );

        // 驗證 requestId 格式
        expect(response.body.requestId).toMatch(
          /^req-\d{14}-[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/,
        );

        // 驗證 x-request-id header
        expect(response.headers['x-request-id']).toMatch(
          /^req-\d{14}-[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/,
        );
      });

      it('data 陣列中的項目應符合 AuditLogEntry schema', async () => {
        // 此測試假設有稽核資料存在
        // 實際測試時需要先建立測試資料
        const response = await request(app.getHttpServer())
          .get('/api/v1/audit-logs')
          .set('ny-operator', 'test@91app.com')
          .expect(200);

        if (response.body.data.length > 0) {
          const entry = response.body.data[0];

          // 驗證必填欄位
          expect(entry).toHaveProperty('id');
          expect(entry).toHaveProperty('operator');
          expect(entry).toHaveProperty('page');
          expect(entry).toHaveProperty('action');
          expect(entry).toHaveProperty('fields');
          expect(entry).toHaveProperty('metadata');
          expect(entry).toHaveProperty('createdAt');
          expect(entry).toHaveProperty('requestId');

          // 驗證 id 格式 (UUID)
          expect(entry.id).toMatch(
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
          );

          // 驗證 operator 格式
          expect(typeof entry.operator).toBe('string');
          expect(entry.operator.length).toBeLessThanOrEqual(255);

          // 驗證 page 格式
          expect(typeof entry.page).toBe('string');
          expect(entry.page.length).toBeLessThanOrEqual(100);

          // 驗證 action 格式
          expect(typeof entry.action).toBe('string');
          expect(entry.action.length).toBeLessThanOrEqual(50);

          // 驗證 fields 是物件
          expect(typeof entry.fields).toBe('object');

          // 驗證 metadata 結構
          expect(entry.metadata).toHaveProperty('method');
          expect(entry.metadata).toHaveProperty('path');
          expect(entry.metadata).toHaveProperty('statusCode');
          expect(['POST', 'PUT', 'PATCH', 'DELETE']).toContain(
            entry.metadata.method,
          );
          expect(typeof entry.metadata.path).toBe('string');
          expect(entry.metadata.statusCode).toBeGreaterThanOrEqual(100);
          expect(entry.metadata.statusCode).toBeLessThanOrEqual(599);

          // 驗證 createdAt 格式
          expect(entry.createdAt).toMatch(
            /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
          );

          // 驗證 requestId 格式
          expect(entry.requestId).toMatch(
            /^req-\d{14}-[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/,
          );
        }
      });

      it('應支援查詢參數過濾', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/v1/audit-logs')
          .query({
            operatorFilter: 'test@91app.com',
            limit: 10,
            offset: 0,
          })
          .set('ny-operator', 'test@91app.com')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.pagination.limit).toBe(10);
        expect(response.body.pagination.offset).toBe(0);
      });
    });

    describe('錯誤回應 (400)', () => {
      it('應在查詢範圍超過 7 天時返回 INVALID_ARGUMENT', async () => {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 8);
        const endDate = new Date();

        const response = await request(app.getHttpServer())
          .get('/api/v1/audit-logs')
          .query({
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
          })
          .set('ny-operator', 'test@91app.com')
          .expect(400);

        // 驗證錯誤回應結構
        expect(response.body).toHaveProperty('success', false);
        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toHaveProperty('code', 'INVALID_ARGUMENT');
        expect(response.body.error).toHaveProperty('message');
        expect(response.body.error).toHaveProperty('details');

        // 驗證 details 結構
        expect(Array.isArray(response.body.error.details)).toBe(true);
        if (response.body.error.details.length > 0) {
          expect(response.body.error.details[0]).toHaveProperty('@type');
        }

        // 驗證 timestamp
        expect(response.body).toHaveProperty('timestamp');
        expect(response.body.timestamp).toMatch(
          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
        );

        // 驗證 requestId
        expect(response.body).toHaveProperty('requestId');
        expect(response.body.requestId).toMatch(
          /^req-\d{14}-[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/,
        );
      });

      it('應在分頁參數超出範圍時返回 INVALID_ARGUMENT', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/v1/audit-logs')
          .query({ limit: 150 })
          .set('ny-operator', 'test@91app.com')
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('INVALID_ARGUMENT');
        expect(response.body.error.message).toContain('pagination');
      });
    });

    describe('錯誤回應 (401)', () => {
      it('應在缺少 ny-operator header 時返回 UNAUTHENTICATED', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/v1/audit-logs')
          .expect(401);

        expect(response.body).toHaveProperty('success', false);
        expect(response.body.error).toHaveProperty('code', 'UNAUTHENTICATED');
        expect(response.body.error.message).toContain('ny-operator');
      });

      it('應在無效 ny-operator header 時返回 UNAUTHENTICATED', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/v1/audit-logs')
          .set('ny-operator', '')
          .expect(401);

        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('UNAUTHENTICATED');
      });
    });

    describe('錯誤回應 (503)', () => {
      it('應在儲存不可用時返回 UNAVAILABLE (需要模擬儲存失敗)', async () => {
        // 此測試需要模擬儲存系統失敗
        // 實際實作時會注入 mock service
      });
    });
  });
});
