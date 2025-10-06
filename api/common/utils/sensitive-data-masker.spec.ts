/**
 * SensitiveDataMasker 單元測試
 */

import { SensitiveDataMasker } from './sensitive-data-masker';
import { MASKED_VALUE } from '../constants/audit-log.constants';

describe('SensitiveDataMasker', () => {
  describe('mask', () => {
    it('應遮罩 password 欄位', () => {
      const data = {
        username: 'testuser',
        password: 'super-secret',
        email: 'test@example.com',
      };

      const masked = SensitiveDataMasker.mask(data);

      expect(masked.username).toBe('testuser');
      expect(masked.password).toBe(MASKED_VALUE);
      expect(masked.email).toBe('test@example.com');
    });

    it('應遮罩各種 token 欄位', () => {
      const data = {
        apiToken: 'token1',
        accessToken: 'token2',
        refreshToken: 'token3',
        userId: 123,
      };

      const masked = SensitiveDataMasker.mask(data);

      expect(masked.apiToken).toBe(MASKED_VALUE);
      expect(masked.accessToken).toBe(MASKED_VALUE);
      expect(masked.refreshToken).toBe(MASKED_VALUE);
      expect(masked.userId).toBe(123);
    });

    it('應遮罩 secret 相關欄位', () => {
      const data = {
        clientSecret: 'secret1',
        apiSecret: 'secret2',
        name: 'Test',
      };

      const masked = SensitiveDataMasker.mask(data);

      expect(masked.clientSecret).toBe(MASKED_VALUE);
      expect(masked.apiSecret).toBe(MASKED_VALUE);
      expect(masked.name).toBe('Test');
    });

    it('應遮罩 key 相關欄位', () => {
      const data = {
        apiKey: 'key1',
        privateKey: 'key2',
        publicKey: 'key3',
        id: 456,
      };

      const masked = SensitiveDataMasker.mask(data);

      expect(masked.apiKey).toBe(MASKED_VALUE);
      expect(masked.privateKey).toBe(MASKED_VALUE);
      expect(masked.publicKey).toBe(MASKED_VALUE);
      expect(masked.id).toBe(456);
    });

    it('應遮罩 authorization 相關欄位', () => {
      const data = {
        authorization: 'Bearer token',
        auth: 'Basic xxx',
        user: 'testuser',
      };

      const masked = SensitiveDataMasker.mask(data);

      expect(masked.authorization).toBe(MASKED_VALUE);
      expect(masked.auth).toBe(MASKED_VALUE);
      expect(masked.user).toBe('testuser');
    });

    it('應處理巢狀物件的敏感資料', () => {
      const data = {
        user: {
          id: 123,
          username: 'testuser',
          credentials: {
            password: 'secret-password',
            apiKey: 'api-key-xyz',
          },
        },
        metadata: {
          timestamp: '2025-10-06T14:30:00Z',
        },
      };

      const masked = SensitiveDataMasker.mask(data);

      expect(masked.user.id).toBe(123);
      expect(masked.user.username).toBe('testuser');
      expect(masked.user.credentials.password).toBe(MASKED_VALUE);
      expect(masked.user.credentials.apiKey).toBe(MASKED_VALUE);
      expect(masked.metadata.timestamp).toBe('2025-10-06T14:30:00Z');
    });

    it('應處理陣列中的敏感資料', () => {
      const data = {
        users: [
          { id: 1, username: 'user1', password: 'pass1' },
          { id: 2, username: 'user2', token: 'token2' },
        ],
      };

      const masked = SensitiveDataMasker.mask(data);

      expect(masked.users[0].id).toBe(1);
      expect(masked.users[0].username).toBe('user1');
      expect(masked.users[0].password).toBe(MASKED_VALUE);
      expect(masked.users[1].id).toBe(2);
      expect(masked.users[1].username).toBe('user2');
      expect(masked.users[1].token).toBe(MASKED_VALUE);
    });

    it('應處理不同命名風格的敏感欄位', () => {
      const data = {
        apiKey: 'value1',
        api_secret: 'value2',
        API_TOKEN: 'value3',
        user_password: 'value4',
        normalField: 'value5',
      };

      const masked = SensitiveDataMasker.mask(data);

      expect(masked.apiKey).toBe(MASKED_VALUE);
      expect(masked.api_secret).toBe(MASKED_VALUE);
      expect(masked.API_TOKEN).toBe(MASKED_VALUE);
      expect(masked.user_password).toBe(MASKED_VALUE);
      expect(masked.normalField).toBe('value5');
    });

    it('應保留原始資料結構', () => {
      const data = {
        level1: {
          level2: {
            level3: {
              password: 'secret',
              data: 'public',
            },
          },
        },
      };

      const masked = SensitiveDataMasker.mask(data);

      expect(masked).toHaveProperty('level1.level2.level3.password');
      expect(masked).toHaveProperty('level1.level2.level3.data');
      expect(masked.level1.level2.level3.password).toBe(MASKED_VALUE);
      expect(masked.level1.level2.level3.data).toBe('public');
    });

    it('應處理 null 值', () => {
      const data = {
        password: null,
        name: 'test',
      };

      const masked = SensitiveDataMasker.mask(data);

      expect(masked.password).toBe(MASKED_VALUE);
      expect(masked.name).toBe('test');
    });

    it('應處理 undefined 值', () => {
      const data = {
        token: undefined,
        name: 'test',
      };

      const masked = SensitiveDataMasker.mask(data);

      expect(masked.token).toBe(MASKED_VALUE);
      expect(masked.name).toBe('test');
    });

    it('應處理空物件', () => {
      const data = {};
      const masked = SensitiveDataMasker.mask(data);
      expect(masked).toEqual({});
    });

    it('應處理空陣列', () => {
      const data = { items: [] };
      const masked = SensitiveDataMasker.mask(data);
      expect(masked.items).toEqual([]);
    });

    it('應處理基本型別', () => {
      expect(SensitiveDataMasker.mask('string')).toBe('string');
      expect(SensitiveDataMasker.mask(123)).toBe(123);
      expect(SensitiveDataMasker.mask(true)).toBe(true);
      expect(SensitiveDataMasker.mask(null)).toBe(null);
      expect(SensitiveDataMasker.mask(undefined)).toBe(undefined);
    });
  });

  describe('maskBatch', () => {
    it('應批量遮罩多個物件', () => {
      const dataArray = [
        { username: 'user1', password: 'pass1' },
        { username: 'user2', token: 'token2' },
      ];

      const masked = SensitiveDataMasker.maskBatch(dataArray);

      expect(masked[0].username).toBe('user1');
      expect(masked[0].password).toBe(MASKED_VALUE);
      expect(masked[1].username).toBe('user2');
      expect(masked[1].token).toBe(MASKED_VALUE);
    });

    it('應處理空陣列', () => {
      const masked = SensitiveDataMasker.maskBatch([]);
      expect(masked).toEqual([]);
    });
  });

  describe('containsSensitiveData', () => {
    it('應檢測包含敏感欄位的物件', () => {
      const data = { username: 'test', password: 'secret' };
      expect(SensitiveDataMasker.containsSensitiveData(data)).toBe(true);
    });

    it('應檢測不包含敏感欄位的物件', () => {
      const data = { username: 'test', email: 'test@example.com' };
      expect(SensitiveDataMasker.containsSensitiveData(data)).toBe(false);
    });

    it('應檢測巢狀物件中的敏感欄位', () => {
      const data = {
        user: {
          name: 'test',
          credentials: {
            apiKey: 'secret',
          },
        },
      };
      expect(SensitiveDataMasker.containsSensitiveData(data)).toBe(true);
    });

    it('應檢測陣列中的敏感欄位', () => {
      const data = {
        users: [{ name: 'user1', password: 'pass1' }],
      };
      expect(SensitiveDataMasker.containsSensitiveData(data)).toBe(true);
    });

    it('應處理 null 和 undefined', () => {
      expect(SensitiveDataMasker.containsSensitiveData(null)).toBe(false);
      expect(SensitiveDataMasker.containsSensitiveData(undefined)).toBe(false);
    });

    it('應處理基本型別', () => {
      expect(SensitiveDataMasker.containsSensitiveData('string')).toBe(false);
      expect(SensitiveDataMasker.containsSensitiveData(123)).toBe(false);
    });
  });

  describe('效能測試', () => {
    it('應在合理時間內完成大型物件的遮罩', () => {
      const largeObject: any = {};
      for (let i = 0; i < 1000; i++) {
        largeObject[`field${i}`] = `value${i}`;
        if (i % 10 === 0) {
          largeObject[`password${i}`] = `secret${i}`;
        }
      }

      const startTime = Date.now();
      const masked = SensitiveDataMasker.mask(largeObject);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(100);
      expect(masked.field0).toBe('value0');
      expect(masked.password0).toBe(MASKED_VALUE);
    });
  });
});
