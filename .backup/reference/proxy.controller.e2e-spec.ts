import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import request from 'supertest';
import { AppModule } from '../api/app.module';
import { of, throwError } from 'rxjs';
import { AxiosResponse, AxiosError } from 'axios';

describe('ProxyController (e2e)', () => {
  let app: INestApplication;
  let httpService: HttpService;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

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

    httpService = moduleFixture.get<HttpService>(HttpService);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
    jest.clearAllMocks();
  });

  describe('POST /proxy/whale/update-supplier-id', () => {
    it('should accept valid request with ny-operator header', async () => {
      const requestBody = {
        shopId: 12345,
        market: 'TW',
        oldSupplierId: 100,
        newSupplierId: 200,
      };

      // Mock successful Whale API response
      const mockResponse: AxiosResponse = {
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

      jest.spyOn(httpService, 'post').mockReturnValue(of(mockResponse));

      const response = await request(app.getHttpServer())
        .post('/proxy/whale/update-supplier-id')
        .set('ny-operator', 'Amy Wang')
        .send(requestBody)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('updatedCount');
      expect(response.body.data).toHaveProperty('shopId', 12345);
      expect(response.body.data).toHaveProperty('market', 'TW');
      expect(response.body.data).toHaveProperty('supplierId', 200);
    });

    it('should return 400 when ny-operator header is missing', async () => {
      const requestBody = {
        shopId: 12345,
        market: 'TW',
        oldSupplierId: 100,
        newSupplierId: 200,
      };

      const response = await request(app.getHttpServer())
        .post('/proxy/whale/update-supplier-id')
        .send(requestBody)
        .expect(400);

      expect(response.body).toHaveProperty(
        'errorCode',
        'MISSING_REQUIRED_HEADER',
      );
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('ny-operator');
    });

    it('should return 400 for invalid request body', async () => {
      const requestBody = {
        shopId: -1, // Invalid: must be positive
        market: 'TW',
        oldSupplierId: 100,
        newSupplierId: 200,
      };

      // No need to mock HTTP service for validation errors (they happen before HTTP call)
      const response = await request(app.getHttpServer())
        .post('/proxy/whale/update-supplier-id')
        .set('ny-operator', 'Amy Wang')
        .send(requestBody)
        .expect(400);

      expect(response.body).toHaveProperty('message');
      expect(Array.isArray(response.body.message)).toBe(true);
    });

    it('should return 400 for missing required fields', async () => {
      const requestBody = {
        shopId: 12345,
        market: 'TW',
        oldSupplierId: 100,
        // newSupplierId missing
      };

      // No need to mock HTTP service for validation errors (they happen before HTTP call)
      const response = await request(app.getHttpServer())
        .post('/proxy/whale/update-supplier-id')
        .set('ny-operator', 'Amy Wang')
        .send(requestBody)
        .expect(400);

      expect(response.body).toHaveProperty('message');
      expect(Array.isArray(response.body.message)).toBe(true);
    });

    it('should return 400 for additional properties', async () => {
      const requestBody = {
        shopId: 12345,
        market: 'TW',
        oldSupplierId: 100,
        newSupplierId: 200,
        extraField: 'not allowed',
      };

      // No need to mock HTTP service for validation errors (they happen before HTTP call)
      const response = await request(app.getHttpServer())
        .post('/proxy/whale/update-supplier-id')
        .set('ny-operator', 'Amy Wang')
        .send(requestBody)
        .expect(400);

      expect(response.body).toHaveProperty('message');
      expect(Array.isArray(response.body.message)).toBe(true);
    });

    it('should handle same supplier IDs (business logic validation)', async () => {
      const requestBody = {
        shopId: 12345,
        market: 'TW',
        oldSupplierId: 100,
        newSupplierId: 100, // Same as old
      };

      const response = await request(app.getHttpServer())
        .post('/proxy/whale/update-supplier-id')
        .set('ny-operator', 'Amy Wang')
        .send(requestBody)
        .expect(400);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('different');
    });

    it('should handle Whale API 400 errors', async () => {
      const requestBody = {
        shopId: 12345,
        market: 'TW',
        oldSupplierId: 100,
        newSupplierId: 200,
      };

      // Mock Whale API 400 error
      const mockError = {
        response: {
          status: 400,
          data: { error: 'Invalid supplier ID' },
        },
      };
      jest
        .spyOn(httpService, 'post')
        .mockReturnValue(throwError(() => mockError));

      const response = await request(app.getHttpServer())
        .post('/proxy/whale/update-supplier-id')
        .set('ny-operator', 'Amy Wang')
        .send(requestBody)
        .expect(502);

      expect(response.body).toHaveProperty('error');
    });

    it('should handle Whale API 500 errors', async () => {
      const requestBody = {
        shopId: 12345,
        market: 'TW',
        oldSupplierId: 100,
        newSupplierId: 200,
      };

      // Mock Whale API 500 error
      const mockError = {
        response: {
          status: 500,
          data: { error: 'Internal server error' },
        },
      };
      jest
        .spyOn(httpService, 'post')
        .mockReturnValue(throwError(() => mockError));

      const response = await request(app.getHttpServer())
        .post('/proxy/whale/update-supplier-id')
        .set('ny-operator', 'Amy Wang')
        .send(requestBody)
        .expect(502);

      expect(response.body).toHaveProperty('error');
    });

    it('should handle network timeouts', async () => {
      const requestBody = {
        shopId: 12345,
        market: 'TW',
        oldSupplierId: 100,
        newSupplierId: 200,
      };

      // Mock network timeout
      const mockError = {
        code: 'ECONNABORTED',
        message: 'timeout of 5000ms exceeded',
      };
      jest
        .spyOn(httpService, 'post')
        .mockReturnValue(throwError(() => mockError));

      const response = await request(app.getHttpServer())
        .post('/proxy/whale/update-supplier-id')
        .set('ny-operator', 'Amy Wang')
        .send(requestBody)
        .expect(502);

      expect(response.body).toHaveProperty('error');
    });

    it('should handle invalid response format from Whale API', async () => {
      const requestBody = {
        shopId: 12345,
        market: 'TW',
        oldSupplierId: 100,
        newSupplierId: 200,
      };

      // Mock invalid response format
      const mockResponse: AxiosResponse = {
        data: {
          // Missing 'success' and 'data' fields
          result: 'OK',
          count: 5,
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      jest.spyOn(httpService, 'post').mockReturnValue(of(mockResponse));

      const response = await request(app.getHttpServer())
        .post('/proxy/whale/update-supplier-id')
        .set('ny-operator', 'Amy Wang')
        .send(requestBody)
        .expect(502);

      expect(response.body).toHaveProperty('error');
    });

    it('should accept different market codes', async () => {
      const markets = ['US', 'JP', 'KR'];

      for (const market of markets) {
        const requestBody = {
          shopId: 12345,
          market,
          oldSupplierId: 100,
          newSupplierId: 200,
        };

        // Mock successful response
        const mockResponse: AxiosResponse = {
          data: {
            success: true,
            data: {
              updatedCount: 2,
              shopId: 12345,
              market,
              supplierId: 200,
            },
          },
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {} as any,
        };

        jest.spyOn(httpService, 'post').mockReturnValue(of(mockResponse));

        const response = await request(app.getHttpServer())
          .post('/proxy/whale/update-supplier-id')
          .set('ny-operator', 'Amy Wang')
          .send(requestBody)
          .expect(201);

        expect(response.body.data.market).toBe(market);
      }
    });

    it('should handle large supplier IDs', async () => {
      const requestBody = {
        shopId: 999999999,
        market: 'TW',
        oldSupplierId: 2147483647, // Max 32-bit int
        newSupplierId: 2147483646,
      };

      // Mock successful response
      const mockResponse: AxiosResponse = {
        data: {
          success: true,
          data: {
            updatedCount: 1,
            shopId: 999999999,
            market: 'TW',
            supplierId: 2147483646,
          },
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      jest.spyOn(httpService, 'post').mockReturnValue(of(mockResponse));

      const response = await request(app.getHttpServer())
        .post('/proxy/whale/update-supplier-id')
        .set('ny-operator', 'Amy Wang')
        .send(requestBody)
        .expect(201);

      expect(response.body.data.shopId).toBe(999999999);
      expect(response.body.data.supplierId).toBe(2147483646);
    });

    it('should handle zero updated count response', async () => {
      const requestBody = {
        shopId: 12345,
        market: 'TW',
        oldSupplierId: 100,
        newSupplierId: 200,
      };

      // Mock zero updated count response
      const mockResponse: AxiosResponse = {
        data: {
          success: true,
          data: {
            updatedCount: 0,
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

      jest.spyOn(httpService, 'post').mockReturnValue(of(mockResponse));

      const response = await request(app.getHttpServer())
        .post('/proxy/whale/update-supplier-id')
        .set('ny-operator', 'Amy Wang')
        .send(requestBody)
        .expect(201);

      expect(response.body.data.updatedCount).toBe(0);
    });
  });
});
