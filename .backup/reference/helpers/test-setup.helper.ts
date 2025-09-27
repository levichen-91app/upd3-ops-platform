import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { of, throwError } from 'rxjs';
import { AxiosResponse } from 'axios';
import { AppModule } from '../../api/app.module';

export interface MockHttpResponse {
  data: any;
  status: number;
  statusText?: string;
}

export class TestSetupHelper {
  private app: INestApplication;
  private httpService: HttpService;

  async createTestApp(): Promise<INestApplication> {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(HttpService)
      .useFactory({
        factory: () => ({
          post: jest.fn(),
          get: jest.fn(),
          put: jest.fn(),
          delete: jest.fn(),
          patch: jest.fn(),
        }),
        inject: [],
      })
      .compile();

    this.app = moduleFixture.createNestApplication();
    this.httpService = moduleFixture.get<HttpService>(HttpService);

    // Configure validation pipe
    this.app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );

    // Configure Swagger for tests that need it
    const config = new DocumentBuilder()
      .setTitle('UPD3 Operations Platform API')
      .setDescription('Standardized API for supplier operations and management')
      .setVersion('1.0')
      .addTag('Suppliers', 'Supplier management operations')
      .addApiKey(
        {
          type: 'apiKey',
          name: 'ny-operator',
          in: 'header',
          description: 'Operator identification header',
        },
        'operator-auth',
      )
      .build();

    const document = SwaggerModule.createDocument(this.app, config);
    SwaggerModule.setup('api-docs', this.app, document);

    this.app.getHttpAdapter().get('/api-json', (req, res) => {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.send(document);
    });

    await this.app.init();
    return this.app;
  }

  mockWhaleApiSuccess(updatedCount: number = 5): void {
    const mockResponse: AxiosResponse = {
      data: { updatedCount },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as any,
    };

    (this.httpService.post as jest.Mock).mockReturnValue(of(mockResponse));
  }

  mockWhaleApiError(error: any): void {
    (this.httpService.post as jest.Mock).mockReturnValue(
      throwError(() => error),
    );
  }

  mockWhaleApiNetworkError(): void {
    const networkError = {
      code: 'ENOTFOUND',
      message: 'getaddrinfo ENOTFOUND api.whale.example.com',
    };
    this.mockWhaleApiError(networkError);
  }

  mockWhaleApiTimeout(): void {
    const timeoutError = {
      code: 'ECONNABORTED',
      message: 'timeout of 10000ms exceeded',
    };
    this.mockWhaleApiError(timeoutError);
  }

  mockWhaleApi400Error(): void {
    const badRequestError = {
      response: {
        status: 400,
        data: { error: 'Invalid request data' },
      },
      message: 'Request failed with status code 400',
    };
    this.mockWhaleApiError(badRequestError);
  }

  mockWhaleApi500Error(): void {
    const serverError = {
      response: {
        status: 500,
        data: { error: 'Internal server error' },
      },
      message: 'Request failed with status code 500',
    };
    this.mockWhaleApiError(serverError);
  }

  // Notification History API Mock Methods
  mockWhaleApiNotificationHistorySuccess(notificationData: any): void {
    const mockResponse: AxiosResponse = {
      data: notificationData,
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as any,
    };

    (this.httpService.get as jest.Mock).mockReturnValue(of(mockResponse));
  }

  mockWhaleApiNotificationNotFound(): void {
    const notFoundError = {
      response: {
        status: 404,
        data: { error: 'Notification not found' },
      },
      message: 'Request failed with status code 404',
    };
    this.mockWhaleApiNotificationError(notFoundError);
  }

  mockWhaleApiServiceUnavailable(): void {
    const serviceError = {
      response: {
        status: 502,
        data: { error: 'Service temporarily unavailable' },
      },
      message: 'Request failed with status code 502',
    };
    this.mockWhaleApiNotificationError(serviceError);
  }

  mockWhaleApiNotificationError(error: any): void {
    (this.httpService.get as jest.Mock).mockReturnValue(
      throwError(() => error),
    );
  }

  private mockWhaleApiNotificationErrorInternal(error: any): void {
    this.mockWhaleApiNotificationError(error);
  }

  getHttpServiceMock(): HttpService {
    return this.httpService;
  }

  async closeApp(): Promise<void> {
    if (this.app) {
      await this.app.close();
    }
  }
}
