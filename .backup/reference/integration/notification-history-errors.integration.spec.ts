import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../api/app.module';
import { TestSetupHelper } from '../helpers/test-setup.helper';

describe('Notification History Error Handling Integration Tests', () => {
  let app: INestApplication;
  let testHelper: TestSetupHelper;

  beforeAll(async () => {
    testHelper = new TestSetupHelper();
    app = await testHelper.createTestApp();
  });

  afterAll(async () => {
    await testHelper.closeApp();
  });

  beforeEach(() => {
    // Ensure Mock mode is disabled for error testing
    delete process.env.WHALE_NOTIFICATION_MOCK_MODE;
    delete process.env.MOCK_MODE;
  });

  describe('Whale API Unavailable (502 Bad Gateway)', () => {
    const shopId = 12345;
    const notificationId = 67890;
    const operatorHeader = 'test-operator@91app.com';

    it('should return 502 when Whale API is unreachable', async () => {
      // Mock Whale API network error (ENOTFOUND, ECONNREFUSED, etc.)
      testHelper.mockWhaleApiNotificationError({
        code: 'ENOTFOUND',
        message: 'getaddrinfo ENOTFOUND whale-api-internal.qa.91dev.tw',
        errno: -3008,
        syscall: 'getaddrinfo',
        hostname: 'whale-api-internal.qa.91dev.tw',
      });

      const response = await request(app.getHttpServer())
        .get(`/api/v1/shops/${shopId}/notifications/${notificationId}/history`)
        .set('ny-operator', operatorHeader)
        .expect(502);

      // Verify error response structure
      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: expect.stringMatching(
            /WHALE_API_UNAVAILABLE|EXTERNAL_SERVICE_ERROR|NETWORK_ERROR/,
          ),
          message: expect.stringMatching(
            /whale.*api.*unavailable|service.*unavailable|network.*error/i,
          ),
          details: expect.any(Object),
        },
        timestamp: expect.stringMatching(
          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
        ),
        requestId: expect.stringMatching(/^req-\d{14}-[a-f0-9-]{36}$/),
      });

      // Verify error details contain the network error information
      expect(response.body.error.details).toHaveProperty('notificationId', notificationId);
      expect(response.body.error.details).toHaveProperty('shopId', shopId);
    });

    it('should return 502 when Whale API returns server error', async () => {
      // Mock Whale API 500 server error
      testHelper.mockWhaleApiNotificationError({
        response: {
          status: 500,
          data: { error: 'Internal Server Error' },
          statusText: 'Internal Server Error',
        },
        message: 'Request failed with status code 500',
      });

      const response = await request(app.getHttpServer())
        .get(`/api/v1/shops/${shopId}/notifications/${notificationId}/history`)
        .set('ny-operator', operatorHeader)
        .expect(502);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: expect.stringMatching(
            /WHALE_API_ERROR|EXTERNAL_SERVICE_ERROR|SERVER_ERROR/,
          ),
          message: expect.stringMatching(
            /whale.*api.*error|external.*service.*error|server.*error/i,
          ),
          details: expect.objectContaining({
            notificationId,
            shopId,
            upstreamStatus: 500,
          }),
        },
        timestamp: expect.any(String),
        requestId: expect.any(String),
      });
    });

    it('should return 502 when Whale API returns bad gateway', async () => {
      // Mock Whale API 502 Bad Gateway
      testHelper.mockWhaleApiNotificationError({
        response: {
          status: 502,
          data: { error: 'Bad Gateway' },
          statusText: 'Bad Gateway',
        },
        message: 'Request failed with status code 502',
      });

      const response = await request(app.getHttpServer())
        .get(`/api/v1/shops/${shopId}/notifications/${notificationId}/history`)
        .set('ny-operator', operatorHeader)
        .expect(502);

      expect(response.body.error.code).toMatch(
        /WHALE_API_ERROR|EXTERNAL_SERVICE_ERROR|BAD_GATEWAY/,
      );
    });
  });

  describe('Timeout Handling (NFR-001: 10-second timeout)', () => {
    const shopId = 12345;
    const notificationId = 67890;
    const operatorHeader = 'test-operator@91app.com';

    it('should timeout after 10 seconds and return 502', async () => {
      // Mock Whale API timeout error
      testHelper.mockWhaleApiNotificationError({
        code: 'ECONNABORTED',
        message: 'timeout of 10000ms exceeded',
        config: {
          timeout: 10000,
        },
      });

      const startTime = Date.now();
      const response = await request(app.getHttpServer())
        .get(`/api/v1/shops/${shopId}/notifications/${notificationId}/history`)
        .set('ny-operator', operatorHeader)
        .expect(502);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      // Verify timeout behavior
      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: expect.stringMatching(
            /TIMEOUT|WHALE_API_TIMEOUT|EXTERNAL_SERVICE_TIMEOUT/,
          ),
          message: expect.stringMatching(
            /timeout|exceeded.*time.*limit|request.*timed.*out/i,
          ),
          details: expect.objectContaining({
            notificationId,
            shopId,
            timeoutMs: 10000,
          }),
        },
        timestamp: expect.any(String),
        requestId: expect.any(String),
      });

      // Response should be fast since it's a mocked timeout
      // In real scenario, it should take close to 10 seconds
      expect(responseTime).toBeLessThan(5000); // Mock response should be immediate
    });

    it('should handle connection timeout specifically', async () => {
      // Mock connection timeout (different from request timeout)
      testHelper.mockWhaleApiNotificationError({
        code: 'ECONNABORTED',
        message: 'Connection timeout after 10000ms',
        errno: -60,
        syscall: 'connect',
      });

      const response = await request(app.getHttpServer())
        .get(`/api/v1/shops/${shopId}/notifications/${notificationId}/history`)
        .set('ny-operator', operatorHeader)
        .expect(502);

      expect(response.body.error.code).toMatch(
        /TIMEOUT|CONNECTION_TIMEOUT|EXTERNAL_SERVICE_TIMEOUT/,
      );
      expect(response.body.error.message).toMatch(
        /connection.*timeout|timeout.*connection/i,
      );
    });

    it('should handle read timeout during response', async () => {
      // Mock read timeout during response processing
      testHelper.mockWhaleApiNotificationError({
        code: 'ECONNABORTED',
        message: 'socket hang up',
        errno: -32,
        syscall: 'read',
      });

      const response = await request(app.getHttpServer())
        .get(`/api/v1/shops/${shopId}/notifications/${notificationId}/history`)
        .set('ny-operator', operatorHeader)
        .expect(502);

      expect(response.body.error.code).toMatch(
        /TIMEOUT|READ_TIMEOUT|CONNECTION_ERROR/,
      );
    });
  });

  describe('No Retry Behavior (FR-011)', () => {
    const shopId = 12345;
    const notificationId = 67890;
    const operatorHeader = 'test-operator@91app.com';

    it('should fail immediately on network error without retry', async () => {
      const mockCall = jest.fn();

      // Mock network error with call tracking
      testHelper.mockWhaleApiNotificationError({
        code: 'ECONNREFUSED',
        message: 'connect ECONNREFUSED 127.0.0.1:80',
        errno: -61,
        syscall: 'connect',
      });

      // Track how many times the HTTP service is called
      const httpServiceMock = testHelper.getHttpServiceMock();
      (httpServiceMock.get as jest.Mock).mockImplementation((...args) => {
        mockCall();
        return testHelper.getHttpServiceMock().get(...args);
      });

      const startTime = Date.now();
      const response = await request(app.getHttpServer())
        .get(`/api/v1/shops/${shopId}/notifications/${notificationId}/history`)
        .set('ny-operator', operatorHeader)
        .expect(502);
      const endTime = Date.now();

      // Verify no retry behavior
      expect(mockCall).toHaveBeenCalledTimes(1); // Only one call, no retries

      // Response should be immediate (no retry delays)
      expect(endTime - startTime).toBeLessThan(1000);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: expect.stringMatching(
            /NETWORK_ERROR|CONNECTION_REFUSED|EXTERNAL_SERVICE_ERROR/,
          ),
          message: expect.stringMatching(
            /connection.*refused|network.*error|service.*unavailable/i,
          ),
          details: expect.objectContaining({
            notificationId,
            shopId,
            retryAttempts: 0,
          }),
        },
      });
    });

    it('should fail immediately on DNS resolution error without retry', async () => {
      const mockCall = jest.fn();

      testHelper.mockWhaleApiNotificationError({
        code: 'ENOTFOUND',
        message: 'getaddrinfo ENOTFOUND invalid-whale-api.com',
        errno: -3008,
        syscall: 'getaddrinfo',
      });

      const httpServiceMock = testHelper.getHttpServiceMock();
      (httpServiceMock.get as jest.Mock).mockImplementation((...args) => {
        mockCall();
        return testHelper.getHttpServiceMock().get(...args);
      });

      await request(app.getHttpServer())
        .get(`/api/v1/shops/${shopId}/notifications/${notificationId}/history`)
        .set('ny-operator', operatorHeader)
        .expect(502);

      // Verify single call with no retries
      expect(mockCall).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error Logging and Phone Number Masking', () => {
    const shopId = 12345;
    const notificationId = 67890;
    const operatorHeader = 'test-operator@91app.com';

    // This test verifies logging behavior - in a real scenario, you would check logs
    it('should log errors with proper request correlation', async () => {
      testHelper.mockWhaleApiNotificationError({
        code: 'ECONNREFUSED',
        message: 'Connection refused',
      });

      const response = await request(app.getHttpServer())
        .get(`/api/v1/shops/${shopId}/notifications/${notificationId}/history`)
        .set('ny-operator', operatorHeader)
        .expect(502);

      // Verify requestId is generated for error correlation
      expect(response.body.requestId).toMatch(/^req-\d{14}-[a-f0-9-]{36}$/);
      expect(response.body.timestamp).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
      );

      // In a real implementation, you would verify that logs contain:
      // - requestId for correlation
      // - masked sensitive data (phone numbers, if any)
      // - error details without exposing internal system information
      expect(response.body.error.details).not.toContain('password');
      expect(response.body.error.details).not.toContain('secret');
      expect(response.body.error.details).not.toContain('token');
    });

    it('should mask phone numbers in error logs when present', async () => {
      // Mock scenario where phone number might be in the request/response
      const notificationIdWithPhone = 886912345678; // Phone number pattern

      testHelper.mockWhaleApiNotificationError({
        response: {
          status: 400,
          data: {
            error: 'Invalid phone number: +886912345678',
            phoneNumber: '+886912345678'
          },
        },
        message: 'Request failed with status code 400',
      });

      const response = await request(app.getHttpServer())
        .get(`/api/v1/shops/${shopId}/notifications/${notificationIdWithPhone}/history`)
        .set('ny-operator', operatorHeader)
        .expect(502); // Should be 502 for upstream error, not 400

      // Verify phone numbers are masked in response (not directly exposed)
      const responseString = JSON.stringify(response.body);
      expect(responseString).not.toMatch(/\+?886\d{9}/); // Taiwan phone pattern
      expect(responseString).not.toMatch(/09\d{8}/); // Local Taiwan mobile pattern

      // However, notificationId should still be present (as it's not sensitive in this context)
      expect(response.body.error.details.notificationId).toBe(notificationIdWithPhone);
    });
  });

  describe('Error Scenarios from Quickstart.md', () => {
    const shopId = 12345;
    const notificationId = 67890;
    const operatorHeader = 'test-operator@91app.com';

    it('should handle scenario: Missing ny-operator header', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/shops/${shopId}/notifications/${notificationId}/history`)
        // Note: no ny-operator header
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'UNAUTHORIZED_ACCESS',
          message: expect.stringMatching(
            /missing.*operator|unauthorized|authentication.*required/i,
          ),
        },
        timestamp: expect.any(String),
        requestId: expect.any(String),
      });
    });

    it('should handle scenario: Invalid shopId parameter', async () => {
      const invalidShopId = -1;

      const response = await request(app.getHttpServer())
        .get(`/api/v1/shops/${invalidShopId}/notifications/${notificationId}/history`)
        .set('ny-operator', operatorHeader)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: expect.stringMatching(/VALIDATION_ERROR|INVALID_PARAMETER/),
          message: expect.stringMatching(/shop.*id.*invalid|positive.*integer/i),
          details: expect.objectContaining({
            field: 'shopId',
            value: invalidShopId,
          }),
        },
      });
    });

    it('should handle scenario: Invalid notificationId parameter', async () => {
      const invalidNotificationId = 0;

      const response = await request(app.getHttpServer())
        .get(`/api/v1/shops/${shopId}/notifications/${invalidNotificationId}/history`)
        .set('ny-operator', operatorHeader)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: expect.stringMatching(/VALIDATION_ERROR|INVALID_PARAMETER/),
          message: expect.stringMatching(/notification.*id.*invalid|positive.*integer/i),
          details: expect.objectContaining({
            field: 'notificationId',
            value: invalidNotificationId,
          }),
        },
      });
    });

    it('should handle scenario: Whale API returns 404 Not Found', async () => {
      testHelper.mockWhaleApiNotificationNotFound();

      const response = await request(app.getHttpServer())
        .get(`/api/v1/shops/${shopId}/notifications/${notificationId}/history`)
        .set('ny-operator', operatorHeader)
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'NOTIFICATION_NOT_FOUND',
          message: expect.stringMatching(
            /notification.*not.*found|notification.*does.*not.*exist/i,
          ),
          details: expect.objectContaining({
            notificationId,
            shopId,
          }),
        },
        timestamp: expect.any(String),
        requestId: expect.any(String),
      });
    });

    it('should handle scenario: Whale API returns invalid response format', async () => {
      // Mock Whale API returning invalid/unexpected format
      testHelper.mockWhaleApiNotificationError({
        response: {
          status: 200,
          data: 'Invalid JSON response', // String instead of object
        },
        message: 'Invalid response format',
      });

      const response = await request(app.getHttpServer())
        .get(`/api/v1/shops/${shopId}/notifications/${notificationId}/history`)
        .set('ny-operator', operatorHeader)
        .expect(502);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: expect.stringMatching(
            /WHALE_API_INVALID_RESPONSE|RESPONSE_FORMAT_ERROR|EXTERNAL_SERVICE_ERROR/,
          ),
          message: expect.stringMatching(
            /invalid.*response.*format|unexpected.*response/i,
          ),
          details: expect.objectContaining({
            notificationId,
            shopId,
          }),
        },
      });
    });

    it('should handle scenario: Whale API service temporarily unavailable', async () => {
      testHelper.mockWhaleApiServiceUnavailable();

      const response = await request(app.getHttpServer())
        .get(`/api/v1/shops/${shopId}/notifications/${notificationId}/history`)
        .set('ny-operator', operatorHeader)
        .expect(502);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: expect.stringMatching(
            /SERVICE_UNAVAILABLE|WHALE_API_UNAVAILABLE|EXTERNAL_SERVICE_ERROR/,
          ),
          message: expect.stringMatching(
            /service.*unavailable|temporarily.*unavailable/i,
          ),
          details: expect.objectContaining({
            notificationId,
            shopId,
            upstreamStatus: 502,
          }),
        },
      });
    });
  });

  describe('Response Format Consistency', () => {
    const shopId = 12345;
    const notificationId = 67890;
    const operatorHeader = 'test-operator@91app.com';

    it('should maintain consistent error response structure across all error types', async () => {
      const errorScenarios = [
        {
          name: 'Network Error',
          setup: () => testHelper.mockWhaleApiNotificationError({
            code: 'ENOTFOUND',
            message: 'Network error',
          }),
          expectedStatus: 502,
        },
        {
          name: 'Timeout Error',
          setup: () => testHelper.mockWhaleApiNotificationError({
            code: 'ECONNABORTED',
            message: 'timeout exceeded',
          }),
          expectedStatus: 502,
        },
        {
          name: 'Server Error',
          setup: () => testHelper.mockWhaleApiNotificationError({
            response: { status: 500, data: { error: 'Internal Error' } },
            message: 'Server error',
          }),
          expectedStatus: 502,
        },
      ];

      for (const scenario of errorScenarios) {
        scenario.setup();

        const response = await request(app.getHttpServer())
          .get(`/api/v1/shops/${shopId}/notifications/${notificationId}/history`)
          .set('ny-operator', operatorHeader)
          .expect(scenario.expectedStatus);

        // All error responses should have the same structure
        expect(response.body).toMatchObject({
          success: false,
          error: {
            code: expect.any(String),
            message: expect.any(String),
            details: expect.any(Object),
          },
          timestamp: expect.stringMatching(
            /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
          ),
          requestId: expect.stringMatching(/^req-\d{14}-[a-f0-9-]{36}$/),
        });

        // Verify required fields are present
        expect(Object.keys(response.body)).toEqual([
          'success',
          'error',
          'timestamp',
          'requestId',
        ]);

        expect(response.body.success).toBe(false);
        expect(typeof response.body.error.code).toBe('string');
        expect(typeof response.body.error.message).toBe('string');
        expect(response.body.error.code.length).toBeGreaterThan(0);
        expect(response.body.error.message.length).toBeGreaterThan(0);
      }
    });

    it('should include Content-Type header for all error responses', async () => {
      testHelper.mockWhaleApiNotificationError({
        code: 'ECONNREFUSED',
        message: 'Connection refused',
      });

      await request(app.getHttpServer())
        .get(`/api/v1/shops/${shopId}/notifications/${notificationId}/history`)
        .set('ny-operator', operatorHeader)
        .expect('Content-Type', /application\/json/)
        .expect(502);
    });
  });
});