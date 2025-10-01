import { BusinessNotFoundException } from './business-logic.exception';
import { ERROR_CODES } from '../../constants/error-codes.constants';
import { ERROR_DETAIL_TYPES } from '../../constants/error-types.constants';

describe('BusinessNotFoundException', () => {
  it('should create exception with correct status code', () => {
    const exception = new BusinessNotFoundException('找不到指定的設備', {
      shopId: 123,
      phone: '0912345678',
    });

    expect(exception.getStatus()).toBe(404);
  });

  it('should include error code, message and details in response', () => {
    const message = '找不到指定的通知';
    const details = { notificationId: 12345 };

    const exception = new BusinessNotFoundException(message, details);
    const response = exception.getResponse() as any;

    expect(response.code).toBe(ERROR_CODES.NOT_FOUND);
    expect(response.message).toBe(message);
    expect(response.details).toHaveLength(1);
    expect(response.details[0]).toEqual({
      '@type': ERROR_DETAIL_TYPES.RESOURCE_INFO,
      ...details,
    });
  });

  it('should work without details parameter', () => {
    const message = '找不到設備';

    const exception = new BusinessNotFoundException(message);
    const response = exception.getResponse() as any;

    expect(response.code).toBe(ERROR_CODES.NOT_FOUND);
    expect(response.message).toBe(message);
    expect(response.details).toEqual([]);
  });

  it('should be instance of Error and HttpException', () => {
    const exception = new BusinessNotFoundException('測試錯誤');

    expect(exception).toBeInstanceOf(Error);
    expect(exception.name).toBe('BusinessNotFoundException');
  });
});
