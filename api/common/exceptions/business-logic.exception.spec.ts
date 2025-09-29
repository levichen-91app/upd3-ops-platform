import { BusinessNotFoundException } from './business-logic.exception';
import { ERROR_CODES } from '../../constants/error-codes.constants';

describe('BusinessNotFoundException', () => {
  it('should create exception with correct status code', () => {
    const exception = new BusinessNotFoundException(
      ERROR_CODES.DEVICE_NOT_FOUND,
      '找不到指定的設備',
      { shopId: 123, phone: '0912345678' },
    );

    expect(exception.getStatus()).toBe(404);
  });

  it('should include error code, message and details in response', () => {
    const code = ERROR_CODES.NOTIFICATION_NOT_FOUND;
    const message = '找不到指定的通知';
    const details = { notificationId: 12345 };

    const exception = new BusinessNotFoundException(code, message, details);
    const response = exception.getResponse();

    expect(response).toEqual({
      code,
      message,
      details,
    });
  });

  it('should work without details parameter', () => {
    const code = ERROR_CODES.DEVICE_NOT_FOUND;
    const message = '找不到設備';

    const exception = new BusinessNotFoundException(code, message);
    const response = exception.getResponse();

    expect(response).toEqual({
      code,
      message,
      details: undefined,
    });
  });

  it('should be instance of Error and HttpException', () => {
    const exception = new BusinessNotFoundException(
      ERROR_CODES.DEVICE_NOT_FOUND,
      '測試錯誤',
    );

    expect(exception).toBeInstanceOf(Error);
    expect(exception.name).toBe('BusinessNotFoundException');
  });
});
