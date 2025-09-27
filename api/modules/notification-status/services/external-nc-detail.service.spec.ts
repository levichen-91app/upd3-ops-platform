import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { ExternalNcDetailService } from './external-nc-detail.service';
import { of, throwError } from 'rxjs';
import { AxiosResponse } from 'axios';

describe('ExternalNcDetailService', () => {
  let service: ExternalNcDetailService;
  let httpService: HttpService;
  let configService: ConfigService;

  beforeEach(async () => {
    const mockHttpService = {
      get: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn().mockReturnValue({
        baseUrl: 'http://test-nc-api.example.com',
        timeout: 10000,
        retries: 3,
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExternalNcDetailService,
        { provide: HttpService, useValue: mockHttpService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<ExternalNcDetailService>(ExternalNcDetailService);
    httpService = module.get<HttpService>(HttpService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getNotificationDetail', () => {
    const shopId = 12345;
    const ncId = 'a4070188-050d-47f7-ab24-2523145408cf';

    it('should return notification detail when API responds with data', async () => {
      const mockResponseData = {
        RequestId: '00f2eeb1-670d-4313-a792-2af157bb80c3',
        StatusCode: 200,
        Message: '',
        Data: {
          NCId: ncId,
          NSId: 'd68e720f-62ed-4955-802b-8e3f04c56a19',
          Status: 'Completed',
          ChannelType: 'Push',
          CreateDateTime: '2025-09-15T01:58:31.117',
          Report: {
            Total: 1,
            NoUserData: 0,
            InBlackList: 0,
            DontWantToReceiveThisMessageType: 0,
            Sent: 1,
            Fail: 0,
            DidNotSend: 0,
            Cancel: 0,
            NoTokenData: 0,
            Received: 0,
          },
          ShortMessageReportLink: '',
        },
      };

      const mockResponse: AxiosResponse = {
        data: mockResponseData,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {},
      } as AxiosResponse;

      (httpService.get as jest.Mock).mockReturnValue(of(mockResponse));

      const result = await service.getNotificationDetail(shopId, ncId);

      expect(result).toEqual(mockResponseData.Data);
      expect(httpService.get).toHaveBeenCalledWith(
        `http://test-nc-api.example.com/api/v1/notifications/detail/${shopId}/${ncId}`,
        { timeout: 10000 }
      );
    });

    it('should return null when API responds with null data', async () => {
      const mockResponseData = {
        RequestId: '00f2eeb1-670d-4313-a792-2af157bb80c3',
        StatusCode: 200,
        Message: '',
        Data: null,
      };

      const mockResponse: AxiosResponse = {
        data: mockResponseData,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {},
      } as AxiosResponse;

      (httpService.get as jest.Mock).mockReturnValue(of(mockResponse));

      const result = await service.getNotificationDetail(shopId, ncId);

      expect(result).toBeNull();
    });

    it('should throw error when API returns 400 status', async () => {
      const error = {
        response: {
          status: 400,
          data: { error: 'NCId Should be Guid' },
        },
      };

      (httpService.get as jest.Mock).mockReturnValue(throwError(() => error));

      await expect(service.getNotificationDetail(shopId, 'invalid-uuid'))
        .rejects.toThrow();
    });

    it('should throw error when API returns 500 status', async () => {
      const error = {
        response: {
          status: 500,
          data: { error: 'Internal Server Error' },
        },
      };

      (httpService.get as jest.Mock).mockReturnValue(throwError(() => error));

      await expect(service.getNotificationDetail(shopId, ncId))
        .rejects.toThrow();
    });

    it('should throw error when API request times out', async () => {
      const timeoutError = {
        code: 'ECONNABORTED',
        message: 'timeout of 10000ms exceeded',
      };

      (httpService.get as jest.Mock).mockReturnValue(throwError(() => timeoutError));

      await expect(service.getNotificationDetail(shopId, ncId))
        .rejects.toThrow();
    });

    it('should handle malformed response data', async () => {
      const mockResponse: AxiosResponse = {
        data: { malformed: 'response' },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {},
      } as AxiosResponse;

      (httpService.get as jest.Mock).mockReturnValue(of(mockResponse));

      await expect(service.getNotificationDetail(shopId, ncId))
        .rejects.toThrow();
    });
  });
});