import { Test, TestingModule } from '@nestjs/testing';
import { ProxyService } from '../api/src/modules/proxy/proxy.service';
import { ProxyModule } from '../api/src/modules/proxy/proxy.module';
import { HttpService } from '@nestjs/axios';
import { BadGatewayException } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { AxiosError } from 'axios';

describe('ProxyService - Upstream Error Handling Integration', () => {
  let service: ProxyService;
  let httpService: HttpService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ProxyModule],
    }).compile();

    service = module.get<ProxyService>(ProxyService);
    httpService = module.get<HttpService>(HttpService);
  });

  it('should handle Whale API connection timeout', async () => {
    const timeoutError = new AxiosError('timeout of 5000ms exceeded');
    timeoutError.code = 'ECONNABORTED';

    jest
      .spyOn(httpService, 'post')
      .mockReturnValue(throwError(() => timeoutError));

    const requestDto = {
      shopId: 12345,
      market: 'TW',
      oldSupplierId: 100,
      newSupplierId: 200,
    };

    await expect(
      service.updateSupplier(requestDto, 'Amy Wang'),
    ).rejects.toThrow(BadGatewayException);

    await expect(
      service.updateSupplier(requestDto, 'Amy Wang'),
    ).rejects.toThrow('Whale API unreachable or error');
  });

  it('should handle Whale API 400 error response', async () => {
    const badRequestError = new AxiosError(
      'Request failed with status code 400',
    );
    badRequestError.response = {
      status: 400,
      data: { error: 'Invalid input parameters' },
      statusText: 'Bad Request',
      headers: {},
      config: {} as any,
    };

    jest
      .spyOn(httpService, 'post')
      .mockReturnValue(throwError(() => badRequestError));

    const requestDto = {
      shopId: 12345,
      market: 'TW',
      oldSupplierId: 100,
      newSupplierId: 200,
    };

    await expect(
      service.updateSupplier(requestDto, 'Amy Wang'),
    ).rejects.toThrow(BadGatewayException);
  });

  it('should handle Whale API 500 error response', async () => {
    const serverError = new AxiosError('Request failed with status code 500');
    serverError.response = {
      status: 500,
      data: { error: 'Internal server error' },
      statusText: 'Internal Server Error',
      headers: {},
      config: {} as any,
    };

    jest
      .spyOn(httpService, 'post')
      .mockReturnValue(throwError(() => serverError));

    const requestDto = {
      shopId: 12345,
      market: 'TW',
      oldSupplierId: 100,
      newSupplierId: 200,
    };

    await expect(
      service.updateSupplier(requestDto, 'Amy Wang'),
    ).rejects.toThrow(BadGatewayException);
  });

  it('should handle network connection errors', async () => {
    const networkError = new AxiosError('Network Error');
    networkError.code = 'ENOTFOUND';

    jest
      .spyOn(httpService, 'post')
      .mockReturnValue(throwError(() => networkError));

    const requestDto = {
      shopId: 12345,
      market: 'TW',
      oldSupplierId: 100,
      newSupplierId: 200,
    };

    await expect(
      service.updateSupplier(requestDto, 'Amy Wang'),
    ).rejects.toThrow(BadGatewayException);
  });

  it('should handle invalid response format from Whale API', async () => {
    // Simulate successful HTTP response but invalid format
    const invalidResponse = {
      data: 'Invalid response format', // Should be object with success/data
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as any,
    };

    jest.spyOn(httpService, 'post').mockReturnValue(of(invalidResponse));

    const requestDto = {
      shopId: 12345,
      market: 'TW',
      oldSupplierId: 100,
      newSupplierId: 200,
    };

    await expect(
      service.updateSupplier(requestDto, 'Amy Wang'),
    ).rejects.toThrow(BadGatewayException);

    await expect(
      service.updateSupplier(requestDto, 'Amy Wang'),
    ).rejects.toThrow('Whale API response format is invalid');
  });

  it('should handle response missing required fields', async () => {
    const incompleteResponse = {
      data: {
        success: true,
        // Missing 'data' field
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as any,
    };

    jest.spyOn(httpService, 'post').mockReturnValue(of(incompleteResponse));

    const requestDto = {
      shopId: 12345,
      market: 'TW',
      oldSupplierId: 100,
      newSupplierId: 200,
    };

    await expect(
      service.updateSupplier(requestDto, 'Amy Wang'),
    ).rejects.toThrow(BadGatewayException);
  });

  it('should handle successful response with missing data fields', async () => {
    const responseWithMissingFields = {
      data: {
        success: true,
        data: {
          updatedCount: 5,
          shopId: 12345,
          // Missing market and supplierId
        },
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as any,
    };

    jest
      .spyOn(httpService, 'post')
      .mockReturnValue(of(responseWithMissingFields));

    const requestDto = {
      shopId: 12345,
      market: 'TW',
      oldSupplierId: 100,
      newSupplierId: 200,
    };

    await expect(
      service.updateSupplier(requestDto, 'Amy Wang'),
    ).rejects.toThrow(BadGatewayException);
  });

  it('should log error details for debugging', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    const networkError = new AxiosError('Connection refused');
    networkError.code = 'ECONNREFUSED';

    jest
      .spyOn(httpService, 'post')
      .mockReturnValue(throwError(() => networkError));

    const requestDto = {
      shopId: 12345,
      market: 'TW',
      oldSupplierId: 100,
      newSupplierId: 200,
    };

    try {
      await service.updateSupplier(requestDto, 'Amy Wang');
    } catch (error) {
      expect(error).toBeInstanceOf(BadGatewayException);
    }

    // Verify error was logged (implementation detail)
    // Note: This may need adjustment based on actual logging implementation
    expect(consoleErrorSpy).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });
});
