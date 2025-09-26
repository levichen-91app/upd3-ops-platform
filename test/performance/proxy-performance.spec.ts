import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import request from 'supertest';
import { of } from 'rxjs';
import { AppModule } from '../../api/app.module';

describe('Proxy Performance Tests', () => {
  let app: INestApplication;
  let httpService: HttpService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();

    // Configure validation pipe like in main.ts
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );

    httpService = module.get<HttpService>(HttpService);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('Response Time Performance', () => {
    it('should respond within 200ms for successful requests', async () => {
      // Mock Whale API response
      const mockWhaleResponse = {
        success: true,
        data: {
          updatedCount: 3,
          shopId: 12345,
          market: 'TW',
          supplierId: 200,
        },
      };

      jest.spyOn(httpService, 'post').mockReturnValue(
        of({
          data: mockWhaleResponse,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {} as any,
        }),
      );

      const validPayload = {
        shopId: 12345,
        market: 'TW',
        oldSupplierId: 100,
        newSupplierId: 200,
      };

      const startTime = Date.now();

      const response = await request(app.getHttpServer())
        .post('/proxy/whale/update-supplier-id')
        .set('ny-operator', 'Performance Test User')
        .send(validPayload)
        .expect(201);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(responseTime).toBeLessThan(200);
      expect(response.body).toEqual(mockWhaleResponse);
    });

    it('should respond within 100ms for validation errors', async () => {
      const invalidPayload = {
        shopId: -1, // Invalid: negative value
        market: 'TW',
        oldSupplierId: 100,
        newSupplierId: 200,
      };

      const startTime = Date.now();

      await request(app.getHttpServer())
        .post('/proxy/whale/update-supplier-id')
        .set('ny-operator', 'Performance Test User')
        .send(invalidPayload)
        .expect(400);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      // Validation errors should be faster than external API calls
      expect(responseTime).toBeLessThan(100);
    });

    it('should respond within 50ms for missing header errors', async () => {
      const validPayload = {
        shopId: 12345,
        market: 'TW',
        oldSupplierId: 100,
        newSupplierId: 200,
      };

      const startTime = Date.now();

      await request(app.getHttpServer())
        .post('/proxy/whale/update-supplier-id')
        // Missing ny-operator header
        .send(validPayload)
        .expect(400);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      // Header validation should be very fast
      expect(responseTime).toBeLessThan(50);
    });
  });

  describe('Concurrent Request Performance', () => {
    it('should handle 10 concurrent requests within reasonable time', async () => {
      // Mock Whale API response
      const mockWhaleResponse = {
        success: true,
        data: {
          updatedCount: 3,
          shopId: 12345,
          market: 'TW',
          supplierId: 200,
        },
      };

      jest.spyOn(httpService, 'post').mockReturnValue(
        of({
          data: mockWhaleResponse,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {} as any,
        }),
      );

      const validPayload = {
        shopId: 12345,
        market: 'TW',
        oldSupplierId: 100,
        newSupplierId: 200,
      };

      const startTime = Date.now();

      // Create 10 concurrent requests
      const requests = Array.from({ length: 10 }, (_, index) =>
        request(app.getHttpServer())
          .post('/proxy/whale/update-supplier-id')
          .set('ny-operator', `Concurrent Test User ${index}`)
          .send(validPayload)
          .expect(201),
      );

      const responses = await Promise.all(requests);
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // All 10 requests should complete within 2 seconds
      expect(totalTime).toBeLessThan(2000);

      // Each response should be valid
      responses.forEach((response) => {
        expect(response.body).toEqual(mockWhaleResponse);
      });

      // HttpService should have been called 10 times
      expect(httpService.post).toHaveBeenCalledTimes(10);
    });

    it('should handle mixed valid and invalid concurrent requests', async () => {
      const mockWhaleResponse = {
        success: true,
        data: {
          updatedCount: 3,
          shopId: 12345,
          market: 'TW',
          supplierId: 200,
        },
      };

      jest.spyOn(httpService, 'post').mockReturnValue(
        of({
          data: mockWhaleResponse,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {} as any,
        }),
      );

      const validPayload = {
        shopId: 12345,
        market: 'TW',
        oldSupplierId: 100,
        newSupplierId: 200,
      };

      const invalidPayload = {
        shopId: -1, // Invalid
        market: 'TW',
        oldSupplierId: 100,
        newSupplierId: 200,
      };

      const startTime = Date.now();

      // Create mix of valid and invalid requests
      const requests = [
        // 5 valid requests
        ...Array.from({ length: 5 }, () =>
          request(app.getHttpServer())
            .post('/proxy/whale/update-supplier-id')
            .set('ny-operator', 'Valid Test User')
            .send(validPayload)
            .expect(201),
        ),
        // 5 invalid requests
        ...Array.from({ length: 5 }, () =>
          request(app.getHttpServer())
            .post('/proxy/whale/update-supplier-id')
            .set('ny-operator', 'Invalid Test User')
            .send(invalidPayload)
            .expect(400),
        ),
      ];

      await Promise.all(requests);
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // All requests should complete within 2 seconds
      expect(totalTime).toBeLessThan(2000);

      // Only valid requests should call the HTTP service
      expect(httpService.post).toHaveBeenCalledTimes(5);
    });
  });

  describe('Memory and Resource Usage', () => {
    it('should not leak memory after multiple requests', async () => {
      const mockWhaleResponse = {
        success: true,
        data: {
          updatedCount: 3,
          shopId: 12345,
          market: 'TW',
          supplierId: 200,
        },
      };

      jest.spyOn(httpService, 'post').mockReturnValue(
        of({
          data: mockWhaleResponse,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {} as any,
        }),
      );

      const validPayload = {
        shopId: 12345,
        market: 'TW',
        oldSupplierId: 100,
        newSupplierId: 200,
      };

      const initialMemory = process.memoryUsage().heapUsed;

      // Make 50 requests to check for memory leaks
      for (let i = 0; i < 50; i++) {
        await request(app.getHttpServer())
          .post('/proxy/whale/update-supplier-id')
          .set('ny-operator', `Memory Test User ${i}`)
          .send(validPayload)
          .expect(201);
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be reasonable (less than 10MB for 50 requests)
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
    });
  });
});
