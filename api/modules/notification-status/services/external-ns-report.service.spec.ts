import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { of, throwError } from 'rxjs';
import { AxiosResponse } from 'axios';
import { ExternalNSReportService } from './external-ns-report.service';
import { StatusReportRequestDto } from '../dto/status-report-request.dto';

/**
 * 單元測試：外部 NS Report Service
 *
 * 測試 ExternalNSReportService 的所有功能：
 * - 成功調用外部 NS Report API
 * - HTTP 錯誤處理 (4xx, 5xx)
 * - 超時錯誤處理
 * - 連接失敗處理
 * - 回應格式驗證
 * - 配置參數注入
 *
 * 注意：此測試會在實作前失敗 (TDD 紅燈階段)
 * 使用 mocked HttpService，絕對禁止真實 HTTP 請求
 */
describe('ExternalNSReportService', () => {
  let service: ExternalNSReportService;
  let httpService: HttpService;
  let configService: ConfigService;

  // Mock HttpService
  const mockHttpService = {
    post: jest.fn(),
  };

  // Mock ConfigService
  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExternalNSReportService,
        { provide: HttpService, useValue: mockHttpService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<ExternalNSReportService>(ExternalNSReportService);
    httpService = module.get<HttpService>(HttpService);
    configService = module.get<ConfigService>(ConfigService);
  });

  beforeEach(() => {
    jest.clearAllMocks();

    // Default config setup
    mockConfigService.get.mockImplementation((key: string) => {
      const config = {
        'nsReport.baseUrl': 'https://api.nsreport.example.com',
        'nsReport.timeout': 30000,
        'nsReport.version': 'v3',
        'nsReport.endpoint': '/v3/GetNotificationStatusReport',
      };
      return config[key];
    });
  });

  describe('getStatusReport', () => {
    const validRequest: StatusReportRequestDto = {
      nsId: 'd68e720f-62ed-4955-802b-8e3f04c56a19',
      notificationDate: '2024/01/15',
      notificationType: 'push',
    };

    it('should successfully call NS Report API and return download data', async () => {
      // Arrange: Mock successful HTTP response
      const mockResponseData = {
        downloadUrl: 'https://s3.amazonaws.com/reports/test-report.tsv?signature=abc123',
        expiredTime: 3600,
      };
      const mockAxiosResponse: AxiosResponse = {
        data: mockResponseData,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };
      mockHttpService.post.mockReturnValue(of(mockAxiosResponse));

      // Act
      const result = await service.getStatusReport(validRequest);

      // Assert: Correct API call
      expect(mockHttpService.post).toHaveBeenCalledWith(
        'https://api.nsreport.example.com/v3/GetNotificationStatusReport',
        {
          nsId: validRequest.nsId,
          notificationDate: validRequest.notificationDate,
          notificationType: validRequest.notificationType,
        },
        {
          timeout: 30000,
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'UPD3-OPS-Platform/1.0',
          },
        }
      );

      // Assert: Correct response transformation
      expect(result).toEqual({
        downloadUrl: mockResponseData.downloadUrl,
        expiredTime: mockResponseData.expiredTime,
      });
    });

    it('should handle different notification types correctly', async () => {
      // Arrange: Mock response
      const mockResponse: AxiosResponse = {
        data: { downloadUrl: 'https://s3.aws.com/sms-report.tsv', expiredTime: 1800 },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };
      mockHttpService.post.mockReturnValue(of(mockResponse));

      // Act: Test all valid notification types
      const notificationTypes = ['sms', 'push', 'line', 'email'];

      for (const type of notificationTypes) {
        const request = { ...validRequest, notificationType: type };
        await service.getStatusReport(request);

        // Assert: Correct type passed to API
        expect(mockHttpService.post).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({ notificationType: type }),
          expect.any(Object)
        );
      }
    });

    it('should throw ExternalApiException when NS Report API returns HTTP 500', async () => {
      // Arrange: Mock HTTP 500 error
      const httpError = {
        response: {
          status: 500,
          statusText: 'Internal Server Error',
          data: { error: 'Database connection failed' },
        },
        message: 'Request failed with status code 500',
      };
      mockHttpService.post.mockReturnValue(throwError(() => httpError));

      // Act & Assert
      await expect(service.getStatusReport(validRequest)).rejects.toThrow('外部 NS Report API 調用失敗');
      expect(mockHttpService.post).toHaveBeenCalledTimes(1);
    });

    it('should throw ExternalApiException when NS Report API returns HTTP 404', async () => {
      // Arrange: Mock HTTP 404 error
      const httpError = {
        response: {
          status: 404,
          statusText: 'Not Found',
          data: { message: 'Report not found for specified date' },
        },
        message: 'Request failed with status code 404',
      };
      mockHttpService.post.mockReturnValue(throwError(() => httpError));

      // Act & Assert
      await expect(service.getStatusReport(validRequest)).rejects.toThrow('外部 NS Report API 調用失敗');
    });

    it('should throw ExternalApiException when NS Report API returns HTTP 403', async () => {
      // Arrange: Mock HTTP 403 error (authentication failure)
      const httpError = {
        response: {
          status: 403,
          statusText: 'Forbidden',
          data: { error: 'API key invalid or expired' },
        },
        message: 'Request failed with status code 403',
      };
      mockHttpService.post.mockReturnValue(throwError(() => httpError));

      // Act & Assert
      await expect(service.getStatusReport(validRequest)).rejects.toThrow('外部 NS Report API 調用失敗');
    });

    it('should throw ExternalApiException on timeout', async () => {
      // Arrange: Mock timeout error
      const timeoutError = {
        code: 'ECONNABORTED',
        message: 'timeout of 30000ms exceeded',
      };
      mockHttpService.post.mockReturnValue(throwError(() => timeoutError));

      // Act & Assert
      await expect(service.getStatusReport(validRequest)).rejects.toThrow('外部 NS Report API 調用失敗');
    });

    it('should throw ExternalApiException on connection failure', async () => {
      // Arrange: Mock connection error
      const connectionError = {
        code: 'ECONNREFUSED',
        message: 'connect ECONNREFUSED 127.0.0.1:80',
      };
      mockHttpService.post.mockReturnValue(throwError(() => connectionError));

      // Act & Assert
      await expect(service.getStatusReport(validRequest)).rejects.toThrow('外部 NS Report API 調用失敗');
    });

    it('should throw ExternalApiException when response has invalid format', async () => {
      // Arrange: Mock response with missing required fields
      const invalidResponse: AxiosResponse = {
        data: {
          // Missing downloadUrl and expiredTime
          message: 'Success',
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };
      mockHttpService.post.mockReturnValue(of(invalidResponse));

      // Act & Assert
      await expect(service.getStatusReport(validRequest)).rejects.toThrow('外部 NS Report API 調用失敗');
    });

    it('should throw ExternalApiException when downloadUrl is null', async () => {
      // Arrange: Mock response with null downloadUrl
      const invalidResponse: AxiosResponse = {
        data: {
          downloadUrl: null,
          expiredTime: 3600,
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };
      mockHttpService.post.mockReturnValue(of(invalidResponse));

      // Act & Assert
      await expect(service.getStatusReport(validRequest)).rejects.toThrow('外部 NS Report API 調用失敗');
    });

    it('should throw ExternalApiException when expiredTime is not a number', async () => {
      // Arrange: Mock response with invalid expiredTime
      const invalidResponse: AxiosResponse = {
        data: {
          downloadUrl: 'https://s3.aws.com/test.tsv',
          expiredTime: 'invalid-time',
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };
      mockHttpService.post.mockReturnValue(of(invalidResponse));

      // Act & Assert
      await expect(service.getStatusReport(validRequest)).rejects.toThrow('外部 NS Report API 調用失敗');
    });
  });

  describe('Configuration handling', () => {
    it('should use configured base URL and endpoint', async () => {
      // Arrange: Custom configuration
      mockConfigService.get.mockImplementation((key: string) => {
        const config = {
          'nsReport.baseUrl': 'https://custom.nsreport.api.com',
          'nsReport.endpoint': '/custom/v4/GetReport',
          'nsReport.timeout': 45000,
        };
        return config[key];
      });

      const mockResponse: AxiosResponse = {
        data: { downloadUrl: 'https://test.com/report.tsv', expiredTime: 3600 },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };
      mockHttpService.post.mockReturnValue(of(mockResponse));

      const testRequest: StatusReportRequestDto = {
        nsId: 'd68e720f-62ed-4955-802b-8e3f04c56a19',
        notificationDate: '2024/01/15',
        notificationType: 'push',
      };

      // Act
      await service.getStatusReport(testRequest);

      // Assert: Uses custom configuration
      expect(mockHttpService.post).toHaveBeenCalledWith(
        'https://custom.nsreport.api.com/custom/v4/GetReport',
        expect.any(Object),
        expect.objectContaining({ timeout: 45000 })
      );
    });

    it('should use default values when configuration is missing', async () => {
      // Arrange: No configuration provided
      mockConfigService.get.mockReturnValue(undefined);

      const mockResponse: AxiosResponse = {
        data: { downloadUrl: 'https://test.com/report.tsv', expiredTime: 3600 },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };
      mockHttpService.post.mockReturnValue(of(mockResponse));

      const testRequest: StatusReportRequestDto = {
        nsId: 'd68e720f-62ed-4955-802b-8e3f04c56a19',
        notificationDate: '2024/01/15',
        notificationType: 'push',
      };

      // Act
      await service.getStatusReport(testRequest);

      // Assert: Uses default values
      expect(mockHttpService.post).toHaveBeenCalledWith(
        expect.stringContaining('default'),  // Default URL
        expect.any(Object),
        expect.objectContaining({ timeout: expect.any(Number) })
      );
    });
  });

  describe('Request payload validation', () => {
    it('should send exact request parameters to external API', async () => {
      // Arrange
      const mockResponse: AxiosResponse = {
        data: { downloadUrl: 'https://test.com/report.tsv', expiredTime: 3600 },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };
      mockHttpService.post.mockReturnValue(of(mockResponse));

      const testRequest: StatusReportRequestDto = {
        nsId: 'test-uuid-12345',
        notificationDate: '2024/12/25',
        notificationType: 'email',
      };

      // Act
      await service.getStatusReport(testRequest);

      // Assert: Exact payload sent
      expect(mockHttpService.post).toHaveBeenCalledWith(
        expect.any(String),
        {
          nsId: 'test-uuid-12345',
          notificationDate: '2024/12/25',
          notificationType: 'email',
        },
        expect.any(Object)
      );
    });

    it('should include correct headers in API request', async () => {
      // Arrange
      const mockResponse: AxiosResponse = {
        data: { downloadUrl: 'https://test.com/report.tsv', expiredTime: 3600 },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };
      mockHttpService.post.mockReturnValue(of(mockResponse));

      const testRequest: StatusReportRequestDto = {
        nsId: 'test-uuid-12345',
        notificationDate: '2024/12/25',
        notificationType: 'email',
      };

      // Act
      await service.getStatusReport(testRequest);

      // Assert: Correct headers included
      expect(mockHttpService.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object),
        expect.objectContaining({
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'UPD3-OPS-Platform/1.0',
          },
        })
      );
    });
  });
});