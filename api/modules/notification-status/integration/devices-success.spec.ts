import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { NotificationStatusModule } from '../notification-status.module';
import { MARKETING_CLOUD_SERVICE_TOKEN } from '../interfaces/marketing-cloud.interface';
import { NC_DETAIL_SERVICE_TOKEN } from '../interfaces/nc-detail.interface';

describe('Devices Success Scenarios (e2e)', () => {
  let app: INestApplication;
  let mockMarketingCloudService: any;

  beforeEach(async () => {
    mockMarketingCloudService = {
      getDevices: jest.fn(),
    };

    const mockNcDetailService = {
      getNotificationDetail: jest.fn(),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [NotificationStatusModule],
    })
      .overrideProvider(MARKETING_CLOUD_SERVICE_TOKEN)
      .useValue(mockMarketingCloudService)
      .overrideProvider(NC_DETAIL_SERVICE_TOKEN)
      .useValue(mockNcDetailService)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
    jest.clearAllMocks();
  });

  it('should return devices when Marketing Cloud returns valid data', async () => {
    // Mock Marketing Cloud response
    const mockDevices = [
      {
        guid: '123e4567-e89b-12d3-a456-426614174000',
        udid: 'device_udid_123',
        token: 'device_token_123',
        shopId: 12345,
        platformDef: 'iOS',
        memberId: 67890,
        advertiseId: 'ad_id_123',
        appVersion: '1.2.3',
        createdDateTime: '2024-01-15T10:00:00Z',
        updatedDateTime: '2024-01-15T10:30:00Z',
      },
    ];

    mockMarketingCloudService.getDevices.mockResolvedValue(mockDevices);

    const response = await request(app.getHttpServer())
      .get('/api/v1/notification-status/devices')
      .set('ny-operator', 'operations-team')
      .query({
        shopId: '12345',
        phone: '0912345678',
      })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0]).toMatchObject({
      guid: '123e4567-e89b-12d3-a456-426614174000',
      udid: 'device_udid_123',
      token: 'device_token_123',
      shopId: 12345,
      platformDef: 'iOS',
      memberId: 67890,
      advertiseId: 'ad_id_123',
      appVersion: '1.2.3',
    });
    expect(response.body.timestamp).toBeDefined();
    expect(response.body.requestId).toMatch(/^req-devices-[0-9]+-[a-zA-Z0-9]+$/);
  });

  it('should return multiple devices for customer with multiple registrations', async () => {
    const mockDevices = [
      {
        guid: '123e4567-e89b-12d3-a456-426614174000',
        udid: 'device_udid_123',
        token: 'device_token_123',
        shopId: 12345,
        platformDef: 'iOS',
        memberId: 67890,
        advertiseId: 'ad_id_123',
        appVersion: '1.2.3',
        createdDateTime: '2024-01-15T10:00:00Z',
        updatedDateTime: '2024-01-15T10:30:00Z',
      },
      {
        guid: '456e7890-e12b-34c5-d678-901234567890',
        udid: 'device_udid_456',
        token: 'device_token_456',
        shopId: 12345,
        platformDef: 'Android',
        memberId: 67890,
        advertiseId: 'ad_id_456',
        appVersion: '1.1.0',
        createdDateTime: '2024-01-10T08:00:00Z',
        updatedDateTime: '2024-01-10T08:15:00Z',
      },
    ];

    mockMarketingCloudService.getDevices.mockResolvedValue(mockDevices);

    const response = await request(app.getHttpServer())
      .get('/api/v1/notification-status/devices')
      .set('ny-operator', 'operations-team')
      .query({
        shopId: '12345',
        phone: '0912345678',
      })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveLength(2);
    expect(
      response.body.data.find((d: any) => d.platformDef === 'iOS'),
    ).toBeDefined();
    expect(
      response.body.data.find((d: any) => d.platformDef === 'Android'),
    ).toBeDefined();
  });

  it('should handle up to 10 devices within timeout limit', async () => {
    const mockDevices = Array.from({ length: 10 }, (_, i) => ({
      guid: `${i}23e4567-e89b-12d3-a456-426614174000`,
      udid: `device_udid_${i}`,
      token: `device_token_${i}`,
      shopId: 12345,
      platformDef: i % 2 === 0 ? 'iOS' : 'Android',
      memberId: 67890 + i,
      advertiseId: `ad_id_${i}`,
      appVersion: '1.2.3',
      createdDateTime: '2024-01-15T10:00:00Z',
      updatedDateTime: '2024-01-15T10:30:00Z',
    }));

    mockMarketingCloudService.getDevices.mockResolvedValue(mockDevices);

    const response = await request(app.getHttpServer())
      .get('/api/v1/notification-status/devices')
      .set('ny-operator', 'operations-team')
      .query({
        shopId: '12345',
        phone: '0912345678',
      })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveLength(10);
  });
});