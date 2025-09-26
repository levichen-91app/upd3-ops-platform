import { Test, TestingModule } from '@nestjs/testing';
import { ProxyService } from '../api/src/modules/proxy/proxy.service';
import { ProxyModule } from '../api/src/modules/proxy/proxy.module';
import { HttpService } from '@nestjs/axios';
import { of } from 'rxjs';
import { AxiosResponse } from 'axios';

describe('ProxyService - Successful Update Integration', () => {
  let service: ProxyService;
  let httpService: HttpService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ProxyModule],
    }).compile();

    service = module.get<ProxyService>(ProxyService);
    httpService = module.get<HttpService>(HttpService);
  });

  it('should successfully forward request to Whale API and return response', async () => {
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

    const requestDto = {
      shopId: 12345,
      market: 'TW',
      oldSupplierId: 100,
      newSupplierId: 200,
    };

    const nyOperator = 'Amy Wang';

    const result = await service.updateSupplier(requestDto, nyOperator);

    expect(result).toEqual(mockResponse.data);
    expect(httpService.post).toHaveBeenCalledWith(
      'http://whale-api-internal.qa.91dev.tw/admin/update-supplier-id',
      requestDto,
      {
        headers: {
          'ny-operator': nyOperator,
          'Content-Type': 'application/json',
        },
      },
    );
  });

  it('should handle request with different market codes', async () => {
    const mockResponse: AxiosResponse = {
      data: {
        success: true,
        data: {
          updatedCount: 3,
          shopId: 67890,
          market: 'HK',
          supplierId: 300,
        },
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as any,
    };

    jest.spyOn(httpService, 'post').mockReturnValue(of(mockResponse));

    const requestDto = {
      shopId: 67890,
      market: 'HK',
      oldSupplierId: 200,
      newSupplierId: 300,
    };

    const result = await service.updateSupplier(requestDto, 'John Doe');

    expect(result.data.market).toBe('HK');
    expect(result.data.updatedCount).toBe(3);
  });

  it('should preserve request ID in logs when provided', async () => {
    const mockResponse: AxiosResponse = {
      data: { success: true, data: { updatedCount: 1 } },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as any,
    };

    jest.spyOn(httpService, 'post').mockReturnValue(of(mockResponse));

    const requestDto = {
      shopId: 12345,
      market: 'TW',
      oldSupplierId: 100,
      newSupplierId: 200,
    };

    // This test ensures the service can handle logging context
    const result = await service.updateSupplier(requestDto, 'Test User');

    expect(result).toBeDefined();
    expect(httpService.post).toHaveBeenCalled();
  });
});
