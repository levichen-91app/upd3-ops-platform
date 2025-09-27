import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../api/app.module';
import { TestSetupHelper } from '../helpers/test-setup.helper';

describe('Notification History Mock Mode Special Scenarios Integration Tests', () => {
  let app: INestApplication;
  let testHelper: TestSetupHelper;

  beforeAll(async () => {
    testHelper = new TestSetupHelper();
    app = await testHelper.createTestApp();
  });

  afterAll(async () => {
    await testHelper.closeApp();
  });

  describe('Mock Mode Special Scenarios', () => {
    const shopId = 12345;
    const operatorHeader = 'system-admin';

    beforeEach(() => {
      // Ensure we're in mock mode for these tests
      process.env.WHALE_NOTIFICATION_MOCK_MODE = 'true';
      process.env.MOCK_MODE = 'true';
    });

    afterEach(() => {
      // Clean up environment variables
      delete process.env.WHALE_NOTIFICATION_MOCK_MODE;
      delete process.env.MOCK_MODE;
    });

    describe('Test Case 4: 404 Special Scenario (notificationId ending with 404)', () => {
      it('should return 404 when notificationId ends with 404 in mock mode', async () => {
        const notificationId404 = 99404;

        const response = await request(app.getHttpServer())
          .get(`/api/v1/shops/${shopId}/notifications/${notificationId404}/history`)
          .set('ny-operator', operatorHeader)
          .expect(404);

        // Verify response structure matches API contract
        expect(response.body).toMatchObject({
          success: false,
          error: {
            code: 'NOTIFICATION_NOT_FOUND',
            message: expect.stringMatching(/notification.*not.*found.*whale.*api/i),
            details: {
              notificationId: notificationId404,
              shopId: shopId,
            },
          },
          timestamp: expect.stringMatching(
            /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
          ),
          requestId: expect.stringMatching(/^req-\d{14}-[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/),
        });

        expect(response.headers['content-type']).toMatch(/application\/json/);
      });

      it('should return 404 for different notificationIds ending with 404', async () => {
        const testCases = [1404, 12404, 789404, 999999404];

        for (const notificationId of testCases) {
          await request(app.getHttpServer())
            .get(`/api/v1/shops/${shopId}/notifications/${notificationId}/history`)
            .set('ny-operator', operatorHeader)
            .expect(404);
        }
      });

      it('should maintain request tracking for 404 mock scenarios', async () => {
        const notificationId404 = 55404;

        const response = await request(app.getHttpServer())
          .get(`/api/v1/shops/${shopId}/notifications/${notificationId404}/history`)
          .set('ny-operator', operatorHeader)
          .expect(404);

        // Verify request ID is generated and follows pattern
        expect(response.body.requestId).toMatch(/^req-\d{14}-[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/);

        // Verify timestamp is recent (within last 5 seconds)
        const responseTime = new Date(response.body.timestamp);
        const now = new Date();
        const timeDiff = Math.abs(now.getTime() - responseTime.getTime());
        expect(timeDiff).toBeLessThan(5000); // 5 seconds
      });
    });

    describe('Test Case 5: Minimal Data Special Scenario (notificationId ending with 000)', () => {
      it('should return minimal but complete data when notificationId ends with 000', async () => {
        const notificationId000 = 1000;

        const response = await request(app.getHttpServer())
          .get(`/api/v1/shops/${shopId}/notifications/${notificationId000}/history`)
          .set('ny-operator', operatorHeader)
          .expect(200);

        // Verify response structure matches successful contract
        expect(response.body).toMatchObject({
          success: true,
          data: expect.any(Object),
          timestamp: expect.stringMatching(
            /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
          ),
          requestId: expect.stringMatching(/^req-\d{14}-[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/),
        });

        // Verify all required fields are present (minimal but complete)
        const data = response.body.data;
        expect(data).toMatchObject({
          shopId: shopId,
          notificationId: notificationId000,
          ncId: expect.stringMatching(/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/),
          bookDateTime: expect.stringMatching(
            /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/,
          ),
          status: expect.stringMatching(/^(Scheduled|Booked|Sent|Error|Success|Fail|PartialFail|NoUser)$/),
          channel: expect.any(String),
          isSettled: expect.any(Boolean),
          originalAudienceCount: expect.any(Number),
          sentAudienceCount: expect.any(Number),
          receivedAudienceCount: expect.any(Number),
          createdAt: expect.stringMatching(
            /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/,
          ),
          updatedAt: expect.stringMatching(
            /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/,
          ),
        });

        // Verify audience count constraints for minimal data
        expect(data.originalAudienceCount).toBeGreaterThanOrEqual(0);
        expect(data.sentAudienceCount).toBeLessThanOrEqual(data.originalAudienceCount);
        expect(data.receivedAudienceCount).toBeLessThanOrEqual(data.sentAudienceCount);

        // Verify minimal data characteristics (should have small but valid values)
        expect(data.originalAudienceCount).toBeLessThanOrEqual(10); // Minimal data should have small counts
        expect(data.channel).toBeTruthy();
        expect(data.ncId).toBeTruthy();
        expect(data.bookDateTime).toBeTruthy();
      });

      it('should return minimal data for different notificationIds ending with 000', async () => {
        const testCases = [2000, 13000, 789000, 999999000];

        for (const notificationId of testCases) {
          const response = await request(app.getHttpServer())
            .get(`/api/v1/shops/${shopId}/notifications/${notificationId}/history`)
            .set('ny-operator', operatorHeader)
            .expect(200);

          expect(response.body.success).toBe(true);
          expect(response.body.data.notificationId).toBe(notificationId);
          expect(response.body.data.shopId).toBe(shopId);

          // Should still have all required fields even with minimal data
          expect(response.body.data.ncId).toBeTruthy();
          expect(response.body.data.bookDateTime).toBeTruthy();
          expect(response.body.data.status).toBeTruthy();
        }
      });

      it('should provide minimal but realistic data for 000 scenarios', async () => {
        const notificationId000 = 5000;

        const response = await request(app.getHttpServer())
          .get(`/api/v1/shops/${shopId}/notifications/${notificationId000}/history`)
          .set('ny-operator', operatorHeader)
          .expect(200);

        const data = response.body.data;

        // Minimal data should still be realistic
        expect(data.channel).toMatch(/^(Email|SMS|Push|Line)$/);
        expect(['Scheduled', 'Booked', 'Sent', 'Error', 'Success', 'Fail', 'PartialFail', 'NoUser'])
          .toContain(data.status);

        // Timestamps should be valid and consistent
        const createdAt = new Date(data.createdAt);
        const updatedAt = new Date(data.updatedAt);
        const bookDateTime = new Date(data.bookDateTime);

        expect(createdAt.getTime()).toBeLessThanOrEqual(updatedAt.getTime());
        expect(createdAt.getTime()).toBeLessThanOrEqual(bookDateTime.getTime());
      });
    });

    describe('Mock Mode vs Real API Mode Behavior Differences', () => {
      it('should behave differently in mock mode vs non-mock mode for 404 scenarios', async () => {
        const notificationId404 = 77404;

        // Test in mock mode
        process.env.WHALE_NOTIFICATION_MOCK_MODE = 'true';
        const mockResponse = await request(app.getHttpServer())
          .get(`/api/v1/shops/${shopId}/notifications/${notificationId404}/history`)
          .set('ny-operator', operatorHeader)
          .expect(404);

        expect(mockResponse.body.error.code).toBe('NOTIFICATION_NOT_FOUND');

        // Test in non-mock mode (should behave differently)
        process.env.WHALE_NOTIFICATION_MOCK_MODE = 'false';
        delete process.env.MOCK_MODE;

        // Mock the actual Whale API call to return not found
        testHelper.mockWhaleApiNotificationNotFound();

        const realResponse = await request(app.getHttpServer())
          .get(`/api/v1/shops/${shopId}/notifications/${notificationId404}/history`)
          .set('ny-operator', operatorHeader)
          .expect(404);

        expect(realResponse.body.error.code).toBe('NOTIFICATION_NOT_FOUND');

        // Both should return 404 but potentially with different internal handling
        expect(mockResponse.body.error.code).toBe(realResponse.body.error.code);
      });

      it('should behave differently for regular notificationIds in mock vs real mode', async () => {
        const regularNotificationId = 12345;

        // Test in mock mode - should return mock data
        process.env.WHALE_NOTIFICATION_MOCK_MODE = 'true';
        process.env.MOCK_MODE = 'true';

        // In mock mode, should not call external API
        const mockResponse = await request(app.getHttpServer())
          .get(`/api/v1/shops/${shopId}/notifications/${regularNotificationId}/history`)
          .set('ny-operator', operatorHeader)
          .expect(200);

        expect(mockResponse.body.success).toBe(true);
        expect(mockResponse.body.data.notificationId).toBe(regularNotificationId);

        // Test in non-mock mode - should attempt real API call
        process.env.WHALE_NOTIFICATION_MOCK_MODE = 'false';
        delete process.env.MOCK_MODE;

        // Mock successful Whale API response
        testHelper.mockWhaleApiNotificationHistorySuccess({
          shopId: shopId,
          notificationId: regularNotificationId,
          ncId: "real-api-uuid-12345678-1234-1234-1234-123456789abc",
          bookDateTime: "2024-01-15T10:30:00Z",
          status: "Success",
          channel: "Email",
          sentDateTime: "2024-01-15T10:35:00Z",
          isSettled: true,
          originalAudienceCount: 1000,
          sentAudienceCount: 900,
          receivedAudienceCount: 850,
          createdAt: "2024-01-15T10:00:00Z",
          updatedAt: "2024-01-15T10:35:00Z"
        });

        const realResponse = await request(app.getHttpServer())
          .get(`/api/v1/shops/${shopId}/notifications/${regularNotificationId}/history`)
          .set('ny-operator', operatorHeader)
          .expect(200);

        expect(realResponse.body.success).toBe(true);
        expect(realResponse.body.data.notificationId).toBe(regularNotificationId);
        expect(realResponse.body.data.ncId).toBe("real-api-uuid-12345678-1234-1234-1234-123456789abc");
      });
    });

    describe('Consistent Mock Behavior Across Environment Setups', () => {
      it('should behave consistently with WHALE_NOTIFICATION_MOCK_MODE=true', async () => {
        process.env.WHALE_NOTIFICATION_MOCK_MODE = 'true';
        delete process.env.MOCK_MODE;

        const notificationId404 = 33404;
        const notificationId000 = 7000;

        // 404 scenario
        await request(app.getHttpServer())
          .get(`/api/v1/shops/${shopId}/notifications/${notificationId404}/history`)
          .set('ny-operator', operatorHeader)
          .expect(404);

        // 000 scenario
        await request(app.getHttpServer())
          .get(`/api/v1/shops/${shopId}/notifications/${notificationId000}/history`)
          .set('ny-operator', operatorHeader)
          .expect(200);
      });

      it('should behave consistently with global MOCK_MODE=true', async () => {
        delete process.env.WHALE_NOTIFICATION_MOCK_MODE;
        process.env.MOCK_MODE = 'true';

        const notificationId404 = 88404;
        const notificationId000 = 9000;

        // 404 scenario
        await request(app.getHttpServer())
          .get(`/api/v1/shops/${shopId}/notifications/${notificationId404}/history`)
          .set('ny-operator', operatorHeader)
          .expect(404);

        // 000 scenario
        await request(app.getHttpServer())
          .get(`/api/v1/shops/${shopId}/notifications/${notificationId000}/history`)
          .set('ny-operator', operatorHeader)
          .expect(200);
      });

      it('should handle edge cases consistently in mock mode', async () => {
        process.env.WHALE_NOTIFICATION_MOCK_MODE = 'true';

        // Edge case: exactly 404
        await request(app.getHttpServer())
          .get(`/api/v1/shops/${shopId}/notifications/404/history`)
          .set('ny-operator', operatorHeader)
          .expect(404);

        // Edge case: exactly 000
        const response000 = await request(app.getHttpServer())
          .get(`/api/v1/shops/${shopId}/notifications/0/history`)
          .set('ny-operator', operatorHeader);

        // Note: This might fail validation due to 0 being invalid notificationId
        // But if it passes validation, it should return minimal data
        if (response000.status === 200) {
          expect(response000.body.success).toBe(true);
          expect(response000.body.data.notificationId).toBe(0);
        } else {
          // If validation fails, should return 400
          expect(response000.status).toBe(400);
        }

        // Edge case: long number ending with 404
        await request(app.getHttpServer())
          .get(`/api/v1/shops/${shopId}/notifications/123456789404/history`)
          .set('ny-operator', operatorHeader)
          .expect(404);

        // Edge case: long number ending with 000
        await request(app.getHttpServer())
          .get(`/api/v1/shops/${shopId}/notifications/987654321000/history`)
          .set('ny-operator', operatorHeader)
          .expect(200);
      });
    });

    describe('Mock Mode Performance and Response Time', () => {
      it('should respond quickly in mock mode (< 1 second)', async () => {
        process.env.WHALE_NOTIFICATION_MOCK_MODE = 'true';

        const testCases = [
          { id: 12345, description: 'regular notification' },
          { id: 77404, description: '404 scenario' },
          { id: 8000, description: '000 minimal data scenario' },
        ];

        for (const testCase of testCases) {
          const startTime = Date.now();

          await request(app.getHttpServer())
            .get(`/api/v1/shops/${shopId}/notifications/${testCase.id}/history`)
            .set('ny-operator', operatorHeader);

          const endTime = Date.now();
          const responseTime = endTime - startTime;

          // Mock mode should be fast (< 1000ms)
          expect(responseTime).toBeLessThan(1000);
        }
      });

      it('should maintain consistent response times for mock scenarios', async () => {
        process.env.WHALE_NOTIFICATION_MOCK_MODE = 'true';

        const measurements = [];
        const notificationId404 = 99404;

        // Take multiple measurements
        for (let i = 0; i < 5; i++) {
          const startTime = Date.now();

          await request(app.getHttpServer())
            .get(`/api/v1/shops/${shopId}/notifications/${notificationId404}/history`)
            .set('ny-operator', operatorHeader)
            .expect(404);

          measurements.push(Date.now() - startTime);
        }

        // All measurements should be reasonable and consistent
        measurements.forEach(time => {
          expect(time).toBeLessThan(500); // Very fast for mock
        });

        const avgTime = measurements.reduce((a, b) => a + b) / measurements.length;
        expect(avgTime).toBeLessThan(200); // Average should be very fast
      });
    });
  });

  describe('Authentication and Authorization in Mock Mode', () => {
    const shopId = 12345;

    beforeEach(() => {
      process.env.WHALE_NOTIFICATION_MOCK_MODE = 'true';
    });

    afterEach(() => {
      delete process.env.WHALE_NOTIFICATION_MOCK_MODE;
    });

    it('should still enforce authentication in mock mode for 404 scenarios', async () => {
      const notificationId404 = 55404;

      // Should fail without operator header
      await request(app.getHttpServer())
        .get(`/api/v1/shops/${shopId}/notifications/${notificationId404}/history`)
        .expect(401);

      // Should succeed with operator header
      await request(app.getHttpServer())
        .get(`/api/v1/shops/${shopId}/notifications/${notificationId404}/history`)
        .set('ny-operator', 'system-admin')
        .expect(404);
    });

    it('should still enforce authentication in mock mode for 000 scenarios', async () => {
      const notificationId000 = 6000;

      // Should fail without operator header
      await request(app.getHttpServer())
        .get(`/api/v1/shops/${shopId}/notifications/${notificationId000}/history`)
        .expect(401);

      // Should succeed with operator header
      await request(app.getHttpServer())
        .get(`/api/v1/shops/${shopId}/notifications/${notificationId000}/history`)
        .set('ny-operator', 'system-admin')
        .expect(200);
    });
  });
});