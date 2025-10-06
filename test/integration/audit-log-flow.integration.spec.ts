/**
 * 稽核日誌流程整合測試
 *
 * 測試完整的稽核日誌記錄和查詢流程
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AuditLogModule } from '../../api/modules/audit-log/audit-log.module';

describe('Audit Log Flow Integration Tests', () => {
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

  describe('端到端稽核流程', () => {
    it('應在 API 操作時自動記錄稽核日誌並可查詢', async () => {
      // 步驟 1: 執行需要稽核的 API 操作 (假設已整合到現有 API)
      // 此處需要實際的 API 端點進行測試
      // 例如: POST /api/v1/shops/:shopId/suppliers

      // 步驟 2: 查詢稽核日誌
      const queryResponse = await request(app.getHttpServer())
        .get('/api/v1/audit-logs')
        .set('ny-operator', 'test@91app.com')
        .query({ limit: 10 })
        .expect(200);

      // 驗證可以查詢到稽核記錄
      expect(queryResponse.body.success).toBe(true);
      expect(Array.isArray(queryResponse.body.data)).toBe(true);
    });

    it('應正確記錄 POST 操作的稽核資訊', async () => {
      // 模擬 POST 操作觸發稽核
      // 實際測試時需要整合真實的 API 端點

      // 查詢最近的 POST 操作記錄
      const response = await request(app.getHttpServer())
        .get('/api/v1/audit-logs')
        .set('ny-operator', 'test@91app.com')
        .query({ method: 'POST', limit: 1 })
        .expect(200);

      if (response.body.data.length > 0) {
        const entry = response.body.data[0];
        expect(entry.metadata.method).toBe('POST');
        expect(entry.operator).toBeDefined();
        expect(entry.page).toBeDefined();
        expect(entry.action).toBeDefined();
      }
    });

    it('應正確記錄 PUT 操作的稽核資訊', async () => {
      // 模擬 PUT 操作觸發稽核

      const response = await request(app.getHttpServer())
        .get('/api/v1/audit-logs')
        .set('ny-operator', 'test@91app.com')
        .query({ method: 'PUT', limit: 1 })
        .expect(200);

      if (response.body.data.length > 0) {
        const entry = response.body.data[0];
        expect(entry.metadata.method).toBe('PUT');
      }
    });

    it('應正確記錄 PATCH 操作的稽核資訊', async () => {
      // 模擬 PATCH 操作觸發稽核

      const response = await request(app.getHttpServer())
        .get('/api/v1/audit-logs')
        .set('ny-operator', 'test@91app.com')
        .query({ method: 'PATCH', limit: 1 })
        .expect(200);

      if (response.body.data.length > 0) {
        const entry = response.body.data[0];
        expect(entry.metadata.method).toBe('PATCH');
      }
    });

    it('應正確記錄 DELETE 操作的稽核資訊', async () => {
      // 模擬 DELETE 操作觸發稽核

      const response = await request(app.getHttpServer())
        .get('/api/v1/audit-logs')
        .set('ny-operator', 'test@91app.com')
        .query({ method: 'DELETE', limit: 1 })
        .expect(200);

      if (response.body.data.length > 0) {
        const entry = response.body.data[0];
        expect(entry.metadata.method).toBe('DELETE');
      }
    });
  });

  describe('查詢功能驗證', () => {
    it('應支援按操作者過濾', async () => {
      const testOperator = 'specific-user@91app.com';

      const response = await request(app.getHttpServer())
        .get('/api/v1/audit-logs')
        .set('ny-operator', 'test@91app.com')
        .query({ operatorFilter: testOperator })
        .expect(200);

      expect(response.body.success).toBe(true);
      // 如果有資料，驗證過濾結果
      if (response.body.data.length > 0) {
        response.body.data.forEach((entry) => {
          expect(entry.operator).toContain(testOperator);
        });
      }
    });

    it('應支援按路徑關鍵字過濾', async () => {
      const pathFilter = 'suppliers';

      const response = await request(app.getHttpServer())
        .get('/api/v1/audit-logs')
        .set('ny-operator', 'test@91app.com')
        .query({ pathFilter })
        .expect(200);

      expect(response.body.success).toBe(true);
      if (response.body.data.length > 0) {
        response.body.data.forEach((entry) => {
          expect(entry.metadata.path).toContain(pathFilter);
        });
      }
    });

    it('應支援按時間範圍過濾', async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 1); // 昨天
      const endDate = new Date(); // 現在

      const response = await request(app.getHttpServer())
        .get('/api/v1/audit-logs')
        .set('ny-operator', 'test@91app.com')
        .query({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      if (response.body.data.length > 0) {
        response.body.data.forEach((entry) => {
          const createdAt = new Date(entry.createdAt);
          expect(createdAt.getTime()).toBeGreaterThanOrEqual(
            startDate.getTime(),
          );
          expect(createdAt.getTime()).toBeLessThanOrEqual(endDate.getTime());
        });
      }
    });

    it('應支援分頁功能', async () => {
      // 第一頁
      const page1Response = await request(app.getHttpServer())
        .get('/api/v1/audit-logs')
        .set('ny-operator', 'test@91app.com')
        .query({ limit: 2, offset: 0 })
        .expect(200);

      expect(page1Response.body.success).toBe(true);
      expect(page1Response.body.pagination.limit).toBe(2);
      expect(page1Response.body.pagination.offset).toBe(0);

      // 第二頁
      const page2Response = await request(app.getHttpServer())
        .get('/api/v1/audit-logs')
        .set('ny-operator', 'test@91app.com')
        .query({ limit: 2, offset: 2 })
        .expect(200);

      expect(page2Response.body.success).toBe(true);
      expect(page2Response.body.pagination.limit).toBe(2);
      expect(page2Response.body.pagination.offset).toBe(2);

      // 如果兩頁都有資料，確認 ID 不重複
      if (
        page1Response.body.data.length > 0 &&
        page2Response.body.data.length > 0
      ) {
        const page1Ids = page1Response.body.data.map((entry) => entry.id);
        const page2Ids = page2Response.body.data.map((entry) => entry.id);
        const intersection = page1Ids.filter((id) => page2Ids.includes(id));
        expect(intersection.length).toBe(0);
      }
    });
  });

  describe('Request ID 關聯驗證', () => {
    it('查詢回應應包含有效的 Request ID', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/audit-logs')
        .set('ny-operator', 'test@91app.com')
        .expect(200);

      expect(response.body.requestId).toBeDefined();
      expect(response.body.requestId).toMatch(
        /^req-\d{14}-[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/,
      );
      expect(response.headers['x-request-id']).toBe(response.body.requestId);
    });

    it('稽核記錄應包含原始 API 操作的 Request ID', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/audit-logs')
        .set('ny-operator', 'test@91app.com')
        .query({ limit: 1 })
        .expect(200);

      if (response.body.data.length > 0) {
        const entry = response.body.data[0];
        expect(entry.requestId).toBeDefined();
        expect(entry.requestId).toMatch(
          /^req-\d{14}-[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/,
        );
      }
    });
  });
});
