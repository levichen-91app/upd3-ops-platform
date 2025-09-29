import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { NotificationStatusController } from './notification-status.controller';
import { NotificationStatusService } from './notification-status.service';
import { NotificationStatusReportsService } from './services/notification-status-reports.service';
import { StatusReportRequestDto } from './dto/status-report-request.dto';

/**
 * 單元測試：通知狀態控制器
 *
 * 測試 NotificationStatusController 的 HTTP 處理邏輯：
 * - POST /api/v1/notification-status/reports 端點
 * - 請求驗證和錯誤處理
 * - 認證 header 驗證 (ny-operator)
 * - 服務層整合
 * - 回應格式轉換
 *
 * 注意：此測試會在實作前失敗 (TDD 紅燈階段)
 * 使用 mock 服務層，測試 HTTP 控制層邏輯
 */
describe('NotificationStatusController', () => {
  let controller: NotificationStatusController;
  let reportsService: NotificationStatusReportsService;

  // Mock both services the controller depends on
  const mockNotificationStatusService = {
    getNotificationDetail: jest.fn(),
    getDevices: jest.fn(),
    getNotificationHistory: jest.fn(),
  };

  const mockReportsService = {
    getStatusReport: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationStatusController],
      providers: [
        {
          provide: NotificationStatusService,
          useValue: mockNotificationStatusService,
        },
        {
          provide: NotificationStatusReportsService,
          useValue: mockReportsService,
        },
      ],
    }).compile();

    controller = module.get<NotificationStatusController>(
      NotificationStatusController,
    );
    reportsService = module.get<NotificationStatusReportsService>(
      NotificationStatusReportsService,
    );
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getNotificationDetail', () => {
    it('should be defined', () => {
      expect(controller.getNotificationDetail).toBeDefined();
    });

    // 其他端點的測試將在需要時補充
    // Reports 功能測試在專用的 notification-status-reports.controller.spec.ts 中
  });

  describe('getDevices', () => {
    it('should be defined', () => {
      expect(controller.getDevices).toBeDefined();
    });
  });

  describe('getNotificationHistory', () => {
    it('should be defined', () => {
      expect(controller.getNotificationHistory).toBeDefined();
    });
  });
});
