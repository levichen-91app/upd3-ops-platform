import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../api/app.module';
import { TestSetupHelper } from '../helpers/test-setup.helper';

describe('Notification History API Contract Tests - Not Found Scenarios', () => {
  let app: INestApplication;
  let testHelper: TestSetupHelper;

  beforeAll(async () => {
    testHelper = new TestSetupHelper();
    app = await testHelper.createTestApp();
  });

  afterAll(async () => {
    await testHelper.closeApp();
  });

  describe('GET /api/v1/shops/{shopId}/notifications/{notificationId}/history', () => {
    const shopId = 12345;
    const operatorHeader = 'system-admin';

    describe('Not Found Response Contract (404)', () => {
      beforeEach(() => {
        // Mock Whale API to return not found
        testHelper.mockWhaleApiNotificationNotFound();
      });

      it('should return 404 with correct ApiErrorResponse structure when notification does not exist in Whale API', async () => {
        const nonExistentNotificationId = 99999;

        const response = await request(app.getHttpServer())
          .get(`/api/v1/shops/${shopId}/notifications/${nonExistentNotificationId}/history`)
          .set('ny-operator', operatorHeader)
          .expect(404);

        // Assert error response structure matches ApiErrorResponse schema
        expect(response.body).toMatchObject({
          success: false,
          error: {
            code: 'NOTIFICATION_NOT_FOUND',
            message: expect.any(String),
            details: expect.objectContaining({
              notificationId: nonExistentNotificationId,
              shopId: shopId,
            }),
          },
          timestamp: expect.stringMatching(
            /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
          ),
          requestId: expect.stringMatching(/^req-\d{14}-[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/),
        });

        // Verify error message content
        expect(response.body.error.message.toLowerCase()).toMatch(/notification.*not.*found/i);
      });

      it('should return 404 with proper Content-Type header', async () => {
        const nonExistentNotificationId = 88888;

        await request(app.getHttpServer())
          .get(`/api/v1/shops/${shopId}/notifications/${nonExistentNotificationId}/history`)
          .set('ny-operator', operatorHeader)
          .expect('Content-Type', /application\/json/)
          .expect(404);
      });

      it('should maintain consistent response format for different non-existent notification IDs', async () => {
        const testCases = [77777, 66666, 55555];

        for (const notificationId of testCases) {
          const response = await request(app.getHttpServer())
            .get(`/api/v1/shops/${shopId}/notifications/${notificationId}/history`)
            .set('ny-operator', operatorHeader)
            .expect(404);

          // Verify consistent structure
          expect(response.body.success).toBe(false);
          expect(response.body.error.code).toBe('NOTIFICATION_NOT_FOUND');
          expect(response.body.error.details.notificationId).toBe(notificationId);
          expect(response.body.error.details.shopId).toBe(shopId);
          expect(response.body.requestId).toMatch(/^req-\d{14}-[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/);
        }
      });

      it('should include complete error details with notificationId and shopId', async () => {
        const notificationId = 11111;
        const testShopId = 54321;

        const response = await request(app.getHttpServer())
          .get(`/api/v1/shops/${testShopId}/notifications/${notificationId}/history`)
          .set('ny-operator', operatorHeader)
          .expect(404);

        // Verify error details contain both IDs
        expect(response.body.error.details).toEqual(
          expect.objectContaining({
            notificationId: notificationId,
            shopId: testShopId,
          }),
        );

        // Ensure no additional unexpected properties in details
        const detailKeys = Object.keys(response.body.error.details).sort();
        expect(detailKeys).toEqual(['notificationId', 'shopId']);
      });
    });

    describe('Mock Mode Special Scenario - 404 Suffix Pattern', () => {
      it('should return 404 when notificationId ends with 404 (mock mode behavior)', async () => {
        // Test various notificationId values ending with 404
        const testCases = [404, 1404, 12404, 999404, 123404];

        for (const notificationId of testCases) {
          // Mock the special 404 scenario for this test
          testHelper.mockWhaleApiNotificationNotFound();

          const response = await request(app.getHttpServer())
            .get(`/api/v1/shops/${shopId}/notifications/${notificationId}/history`)
            .set('ny-operator', operatorHeader)
            .expect(404);

          expect(response.body).toMatchObject({
            success: false,
            error: {
              code: 'NOTIFICATION_NOT_FOUND',
              message: expect.stringMatching(/notification.*not.*found/i),
              details: {
                notificationId: notificationId,
                shopId: shopId,
              },
            },
            timestamp: expect.stringMatching(
              /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
            ),
            requestId: expect.stringMatching(/^req-\d{14}-[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/),
          });
        }
      });

      it('should handle mock mode 404 pattern with different shop IDs consistently', async () => {
        const notificationId = 999404; // Ends with 404
        const testShopIds = [12345, 67890, 11111];

        for (const testShopId of testShopIds) {
          testHelper.mockWhaleApiNotificationNotFound();

          const response = await request(app.getHttpServer())
            .get(`/api/v1/shops/${testShopId}/notifications/${notificationId}/history`)
            .set('ny-operator', operatorHeader)
            .expect(404);

          // Verify the shop ID in details matches the request
          expect(response.body.error.details.shopId).toBe(testShopId);
          expect(response.body.error.details.notificationId).toBe(notificationId);
        }
      });
    });

    describe('OpenAPI Contract Compliance for 404 Responses', () => {
      beforeEach(() => {
        testHelper.mockWhaleApiNotificationNotFound();
      });

      it('should comply with OpenAPI 404 response schema', async () => {
        const notificationId = 404;

        const response = await request(app.getHttpServer())
          .get(`/api/v1/shops/${shopId}/notifications/${notificationId}/history`)
          .set('ny-operator', operatorHeader)
          .expect(404);

        // Verify OpenAPI contract compliance
        // Response should match ApiErrorResponse schema exactly
        const responseKeys = Object.keys(response.body).sort();
        expect(responseKeys).toEqual(['error', 'requestId', 'success', 'timestamp']);

        // Verify error object structure matches OpenAPI schema
        const errorKeys = Object.keys(response.body.error).sort();
        expect(errorKeys).toEqual(['code', 'details', 'message']);

        // Verify details object structure
        const detailsKeys = Object.keys(response.body.error.details).sort();
        expect(detailsKeys).toEqual(['notificationId', 'shopId']);

        // Verify data types match OpenAPI specification
        expect(typeof response.body.success).toBe('boolean');
        expect(typeof response.body.error.code).toBe('string');
        expect(typeof response.body.error.message).toBe('string');
        expect(typeof response.body.error.details.notificationId).toBe('number');
        expect(typeof response.body.error.details.shopId).toBe('number');
        expect(typeof response.body.timestamp).toBe('string');
        expect(typeof response.body.requestId).toBe('string');
      });

      it('should return valid ISO 8601 timestamp in 404 responses', async () => {
        const notificationId = 1404;

        const response = await request(app.getHttpServer())
          .get(`/api/v1/shops/${shopId}/notifications/${notificationId}/history`)
          .set('ny-operator', operatorHeader)
          .expect(404);

        // Verify timestamp is valid ISO 8601
        const timestamp = response.body.timestamp;
        expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);

        // Verify timestamp can be parsed as valid Date
        const parsedDate = new Date(timestamp);
        expect(parsedDate.toISOString()).toBe(timestamp);

        // Verify timestamp is recent (within last minute for test execution)
        const now = new Date();
        const timeDiff = Math.abs(now.getTime() - parsedDate.getTime());
        expect(timeDiff).toBeLessThan(60000); // Less than 1 minute
      });
    });

    describe('Error Handling Edge Cases for 404 Scenarios', () => {
      beforeEach(() => {
        testHelper.mockWhaleApiNotificationNotFound();
      });

      it('should handle 404 response with special characters in operator header', async () => {
        const notificationId = 2404;
        const specialOperators = ['user@domain.com', 'system-admin-123', 'test_user'];

        for (const operator of specialOperators) {
          const response = await request(app.getHttpServer())
            .get(`/api/v1/shops/${shopId}/notifications/${notificationId}/history`)
            .set('ny-operator', operator)
            .expect(404);

          expect(response.body.error.code).toBe('NOTIFICATION_NOT_FOUND');
        }
      });

      it('should generate unique request IDs for multiple 404 requests', async () => {
        const notificationId = 3404;
        const concurrentRequests = 5;

        const requests = Array(concurrentRequests)
          .fill(null)
          .map(() =>
            request(app.getHttpServer())
              .get(`/api/v1/shops/${shopId}/notifications/${notificationId}/history`)
              .set('ny-operator', operatorHeader)
              .expect(404),
          );

        const responses = await Promise.all(requests);
        const requestIds = responses.map((res) => res.body.requestId);

        // All request IDs should be unique
        expect(new Set(requestIds).size).toBe(requestIds.length);

        // All should match the expected pattern
        requestIds.forEach((id) => {
          expect(id).toMatch(/^req-\d{14}-[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/);
        });
      });

      it('should maintain 404 error format consistency across different scenarios', async () => {
        // Test different combinations that should all result in 404
        const testScenarios = [
          { shopId: 12345, notificationId: 404 },
          { shopId: 99999, notificationId: 1404 },
          { shopId: 1, notificationId: 999404 },
        ];

        for (const scenario of testScenarios) {
          const response = await request(app.getHttpServer())
            .get(`/api/v1/shops/${scenario.shopId}/notifications/${scenario.notificationId}/history`)
            .set('ny-operator', operatorHeader)
            .expect(404);

          // All 404 responses should have identical structure
          expect(response.body).toMatchObject({
            success: false,
            error: {
              code: 'NOTIFICATION_NOT_FOUND',
              message: expect.any(String),
              details: {
                notificationId: scenario.notificationId,
                shopId: scenario.shopId,
              },
            },
            timestamp: expect.any(String),
            requestId: expect.any(String),
          });
        }
      });
    });
  });
});