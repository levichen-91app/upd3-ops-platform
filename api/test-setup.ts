// Jest 全域測試設定
// 禁用測試期間的 NestJS Logger 輸出，避免干擾測試結果顯示

import { Logger } from '@nestjs/common';

// 在測試環境中禁用 NestJS Logger
beforeAll(() => {
  // 只在測試環境中禁用 Logger 輸出
  if (process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID) {
    // 禁用 NestJS Logger
    Logger.overrideLogger(false);

    // 同時禁用 console 輸出
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'debug').mockImplementation(() => {});
  }
});

// 測試結束後恢復
afterAll(() => {
  jest.restoreAllMocks();
});

// 全域測試配置
beforeEach(() => {
  // 清除所有 mock 狀態（保留 console mocks）
  jest.clearAllMocks();
});

// 設定測試超時時間
jest.setTimeout(10000);