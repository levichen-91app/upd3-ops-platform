import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../api/app.module';
import { TestSetupHelper } from '../helpers/test-setup.helper';

describe('Performance Requirements Integration Tests', () => {
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
    testHelper.mockWhaleApiSuccess(5);
  });

  describe('API Response Time Requirements', () => {
    const validRequest = {
      market: 'TW',
      oldSupplierId: 100,
      newSupplierId: 200,
    };
    const shopId = 12345;
    const operatorHeader = 'test-operator@91app.com';

    it('should respond within acceptable time limits for successful requests', async () => {
      const startTime = Date.now();

      await request(app.getHttpServer())
        .patch(`/api/v1/shops/${shopId}/suppliers`)
        .set('ny-operator', operatorHeader)
        .send(validRequest)
        .expect(200);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      // Response should be reasonably fast (under 5 seconds for integration tests)
      // Note: Actual performance baseline would be established from current system
      expect(responseTime).toBeLessThan(5000);

      console.log(`API Response Time: ${responseTime}ms`);
    });

    it('should maintain consistent response times across multiple requests', async () => {
      const responseTimes: number[] = [];
      const numberOfRequests = 5;

      for (let i = 0; i < numberOfRequests; i++) {
        const startTime = Date.now();

        await request(app.getHttpServer())
          .patch(`/api/v1/shops/${shopId}/suppliers`)
          .set('ny-operator', operatorHeader)
          .send({ ...validRequest, newSupplierId: 200 + i })
          .expect(200);

        const endTime = Date.now();
        responseTimes.push(endTime - startTime);
      }

      // Calculate statistics
      const avgResponseTime =
        responseTimes.reduce((sum, time) => sum + time, 0) /
        responseTimes.length;
      const maxResponseTime = Math.max(...responseTimes);
      const minResponseTime = Math.min(...responseTimes);

      console.log(`Response Time Stats:`, {
        average: `${avgResponseTime.toFixed(2)}ms`,
        max: `${maxResponseTime}ms`,
        min: `${minResponseTime}ms`,
        all: responseTimes.map((t) => `${t}ms`),
      });

      // All requests should complete within reasonable time
      expect(maxResponseTime).toBeLessThan(5000);

      // Response times should be relatively consistent (max shouldn't be more than 5x min, allowing for variance)
      expect(maxResponseTime).toBeLessThan(Math.max(minResponseTime * 5, 100));
    });

    it('should respond quickly for validation errors', async () => {
      const invalidRequest = {
        market: '',
        oldSupplierId: 100,
        newSupplierId: 200,
      };

      const startTime = Date.now();

      await request(app.getHttpServer())
        .patch(`/api/v1/shops/${shopId}/suppliers`)
        .set('ny-operator', operatorHeader)
        .send(invalidRequest)
        .expect(400);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      // Validation errors should be very fast (under 1 second)
      expect(responseTime).toBeLessThan(1000);

      console.log(`Validation Error Response Time: ${responseTime}ms`);
    });

    it('should respond quickly for authentication errors', async () => {
      const startTime = Date.now();

      await request(app.getHttpServer())
        .patch(`/api/v1/shops/${shopId}/suppliers`)
        .send(validRequest)
        .expect(401);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      // Auth errors should be very fast (under 500ms)
      expect(responseTime).toBeLessThan(500);

      console.log(`Auth Error Response Time: ${responseTime}ms`);
    });
  });

  describe('Multiple Request Handling', () => {
    const validRequest = {
      market: 'TW',
      oldSupplierId: 100,
      newSupplierId: 200,
    };
    const shopId = 12345;
    const operatorHeader = 'test-operator@91app.com';

    it('should handle multiple sequential requests without performance degradation', async () => {
      const numberOfRequests = 5;
      const startTime = Date.now();
      const responses = [];

      // Execute requests sequentially to avoid connection issues
      for (let index = 0; index < numberOfRequests; index++) {
        const response = await request(app.getHttpServer())
          .patch(`/api/v1/shops/${shopId}/suppliers`)
          .set('ny-operator', operatorHeader)
          .send({ ...validRequest, newSupplierId: 200 + index });

        expect(response.status).toBe(200);
        responses.push(response);
      }

      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // Total time for sequential requests should be reasonable
      expect(totalTime).toBeLessThan(5000); // 5 seconds for 5 requests

      console.log(`Sequential Requests (${numberOfRequests}):`, {
        totalTime: `${totalTime}ms`,
        avgTimePerRequest: `${(totalTime / numberOfRequests).toFixed(2)}ms`,
      });

      // Each request should have unique requestIds
      const requestIds = responses.map((res) => res.body.requestId);
      const uniqueRequestIds = new Set(requestIds);
      expect(uniqueRequestIds.size).toBe(numberOfRequests);
    });

    it('should maintain response quality under sequential load', async () => {
      const numberOfRequests = 3;
      const responses = [];

      // Execute requests sequentially with different data
      for (let index = 0; index < numberOfRequests; index++) {
        const response = await request(app.getHttpServer())
          .patch(`/api/v1/shops/${shopId}/suppliers`)
          .set('ny-operator', `operator${index}@test.com`)
          .send({
            market: index % 2 === 0 ? 'TW' : 'HK',
            oldSupplierId: 100 + index,
            newSupplierId: 200 + index,
          });

        expect(response.status).toBe(200);
        responses.push(response);
      }

      // All responses should maintain the same quality standards
      responses.forEach((response, index) => {
        expect(response.body).toMatchObject({
          success: true,
          data: expect.any(Object),
          timestamp: expect.stringMatching(
            /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
          ),
          requestId: expect.stringMatching(/^req-\d{14}-[a-f0-9-]{36}$/),
        });

        // Verify request-specific data integrity
        expect(response.body.data.supplierId).toBe(200 + index);
        expect(response.body.data.market).toBe(index % 2 === 0 ? 'TW' : 'HK');
      });
    });
  });

  describe('Memory and Resource Usage', () => {
    const validRequest = {
      market: 'TW',
      oldSupplierId: 100,
      newSupplierId: 200,
    };
    const shopId = 12345;
    const operatorHeader = 'test-operator@91app.com';

    it('should not have memory leaks during repeated requests', async () => {
      const initialMemory = process.memoryUsage();
      const numberOfRequests = 20;

      // Make repeated requests
      for (let i = 0; i < numberOfRequests; i++) {
        await request(app.getHttpServer())
          .patch(`/api/v1/shops/${shopId}/suppliers`)
          .set('ny-operator', operatorHeader)
          .send({ ...validRequest, newSupplierId: 200 + i })
          .expect(200);
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;

      console.log('Memory Usage:', {
        initial: `${(initialMemory.heapUsed / 1024 / 1024).toFixed(2)}MB`,
        final: `${(finalMemory.heapUsed / 1024 / 1024).toFixed(2)}MB`,
        increase: `${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`,
      });

      // Memory increase should be reasonable (less than 50MB for 20 requests)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });
  });

  describe('Error Response Performance', () => {
    const shopId = 12345;
    const operatorHeader = 'test-operator@91app.com';

    it('should handle validation errors efficiently', async () => {
      const errorCases = [
        { oldSupplierId: 100, newSupplierId: 200 }, // Missing market
        { market: '', oldSupplierId: 100, newSupplierId: 200 }, // Empty market
        { market: 'TW', oldSupplierId: 100, newSupplierId: 100 }, // Identical IDs
        { market: 'TW', oldSupplierId: -1, newSupplierId: 200 }, // Invalid ID
      ];

      const errorResponseTimes: number[] = [];

      for (const errorCase of errorCases) {
        const startTime = Date.now();

        await request(app.getHttpServer())
          .patch(`/api/v1/shops/${shopId}/suppliers`)
          .set('ny-operator', operatorHeader)
          .send(errorCase)
          .expect(400);

        const endTime = Date.now();
        errorResponseTimes.push(endTime - startTime);
      }

      // All error responses should be fast
      errorResponseTimes.forEach((time) => {
        expect(time).toBeLessThan(1000);
      });

      const avgErrorResponseTime =
        errorResponseTimes.reduce((sum, time) => sum + time, 0) /
        errorResponseTimes.length;

      console.log('Error Response Performance:', {
        average: `${avgErrorResponseTime.toFixed(2)}ms`,
        max: `${Math.max(...errorResponseTimes)}ms`,
        all: errorResponseTimes.map((t) => `${t}ms`),
      });
    });
  });

  describe('Performance Baseline Establishment', () => {
    const validRequest = {
      market: 'TW',
      oldSupplierId: 100,
      newSupplierId: 200,
    };
    const shopId = 12345;
    const operatorHeader = 'test-operator@91app.com';

    it('should establish performance baseline for future comparisons', async () => {
      const numberOfSamples = 10;
      const responseTimes: number[] = [];

      for (let i = 0; i < numberOfSamples; i++) {
        const startTime = Date.now();

        await request(app.getHttpServer())
          .patch(`/api/v1/shops/${shopId}/suppliers`)
          .set('ny-operator', operatorHeader)
          .send({ ...validRequest, newSupplierId: 200 + i })
          .expect(200);

        const endTime = Date.now();
        responseTimes.push(endTime - startTime);

        // Small delay between requests to avoid overwhelming the system
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      // Calculate performance metrics
      const avgResponseTime =
        responseTimes.reduce((sum, time) => sum + time, 0) /
        responseTimes.length;
      const maxResponseTime = Math.max(...responseTimes);
      const minResponseTime = Math.min(...responseTimes);
      const stdDev = Math.sqrt(
        responseTimes.reduce(
          (sum, time) => sum + Math.pow(time - avgResponseTime, 2),
          0,
        ) / responseTimes.length,
      );

      const performanceBaseline = {
        samples: numberOfSamples,
        average: Number(avgResponseTime.toFixed(2)),
        max: maxResponseTime,
        min: minResponseTime,
        standardDeviation: Number(stdDev.toFixed(2)),
        p95:
          responseTimes.sort((a, b) => a - b)[
            Math.ceil(numberOfSamples * 0.95) - 1
          ] || maxResponseTime,
        timestamp: new Date().toISOString(),
      };

      console.log('Performance Baseline Established:', performanceBaseline);

      // Store baseline for reference (in actual implementation, this might be saved to a file or database)
      expect(performanceBaseline.average).toBeLessThan(5000);
      expect(performanceBaseline.max).toBeLessThan(10000);

      // Future implementations should compare against this baseline
      // Performance should not exceed baseline * 1.1 (10% degradation limit)
      const maxAllowedResponseTime = performanceBaseline.average * 1.1;
      console.log(
        `Future performance threshold: ${maxAllowedResponseTime.toFixed(2)}ms (110% of baseline)`,
      );
    });
  });
});
