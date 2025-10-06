# 系統稽核日誌功能

**功能 ID**: 011-011-audit-log
**狀態**: ✅ 實作完成，待整合
**分支**: `011-011-audit-log`

---

## 📖 概述

系統稽核日誌功能提供自動化的 API 操作記錄和查詢能力。透過裝飾器標記需要稽核的端點，系統會自動攔截並記錄所有寫入操作（POST, PUT, PATCH, DELETE），包含完整的操作上下文、敏感資料遮罩、自動檔案清理等功能。

### 核心特性

- 🎯 **裝飾器驅動**: 使用 `@AuditLog()` 標記端點，避免硬編碼
- 🔒 **敏感資料保護**: 自動遞迴遮罩 password, token, secret, key 等欄位
- 📁 **檔案系統儲存**: JSON Lines 格式，支援日誌分析工具
- 🔍 **強大查詢功能**: 多維度過濾、分頁、7 天查詢範圍
- 🧹 **自動清理**: 30 天保留期限，每日自動清理
- 📊 **標準化錯誤**: Google RPC 錯誤代碼標準
- 🔗 **Request ID 追蹤**: 完整的請求追蹤鏈

---

## 🚀 快速開始

### 1. 執行自動化安裝腳本

```bash
# 在專案根目錄執行
./specs/011-011-audit-log/setup-and-verify.sh
```

此腳本會自動完成：
- ✅ 安裝 node-cron 依賴
- ✅ 建立日誌目錄
- ✅ 編譯專案
- ✅ 執行測試
- ✅ 驗證檔案結構

### 2. 整合到主應用

在您的主應用模組 (通常是 `api/app.module.ts`) 中加入：

```typescript
import { AuditLogModule } from './modules/audit-log/audit-log.module';

@Module({
  imports: [
    // ... 其他模組
    AuditLogModule,  // ← 加入這行
  ],
})
export class AppModule {}
```

### 3. 啟動應用

```bash
npm run start:dev
```

### 4. 測試功能

```bash
# 執行一個需要稽核的操作
curl -X PATCH "http://localhost:3000/api/v1/shops/12345/suppliers" \
  -H "Content-Type: application/json" \
  -H "ny-operator: test@91app.com" \
  -d '{"market": "TW", "oldSupplierId": 100, "newSupplierId": 200}'

# 查詢稽核日誌
curl "http://localhost:3000/api/v1/audit-logs?limit=10" \
  -H "ny-operator: test@91app.com"

# 檢查日誌檔案
cat logs/audit/audit-$(date +%Y%m%d).jsonl | jq '.'
```

---

## 📚 文檔索引

### 規格文件
- **[功能規格](./spec.md)** - 完整的功能需求和驗收標準
- **[實作計劃](./plan.md)** - 技術選型和實作策略
- **[資料模型](./data-model.md)** - 實體定義和檔案格式
- **[技術研究](./research.md)** - 技術決策和風險評估

### API 文檔
- **[API 合約](./contracts/audit-log-api.yaml)** - OpenAPI 規範
- **[快速開始](./quickstart.md)** - 功能驗證指南 (15-20 分鐘)

### 實作文檔
- **[任務清單](./tasks.md)** - 詳細的實作任務分解
- **[實作完成報告](./IMPLEMENTATION_COMPLETE.md)** - 完整的實作摘要

---

## 🎯 使用範例

### 標記 API 端點需要稽核

```typescript
import { AuditLog } from '../../common/decorators/audit-log.decorator';

@Controller('api/v1/shops/:shopId/suppliers')
export class SuppliersController {
  @Patch()
  @AuditLog({ page: 'supplier-management', action: 'update-supplier' })
  async updateSupplierId(
    @Param('shopId') shopId: number,
    @Body() dto: UpdateSupplierDto,
  ) {
    // 實作邏輯...
  }
}
```

### 查詢稽核日誌

```typescript
// 按操作者查詢
GET /api/v1/audit-logs?operatorFilter=admin@91app.com

// 按時間範圍查詢
GET /api/v1/audit-logs?startDate=2025-10-01T00:00:00Z&endDate=2025-10-06T23:59:59Z

// 按業務頁面和動作查詢
GET /api/v1/audit-logs?pageFilter=supplier-management&action=update-supplier

// 分頁查詢
GET /api/v1/audit-logs?limit=50&offset=100
```

---

## 🏗️ 架構設計

### 系統架構

```
┌─────────────────────────────────────────────┐
│          HTTP Request (POST/PUT/...)        │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│     AuditLogInterceptor (檢查 @AuditLog)    │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│         SensitiveDataMasker (遮罩)          │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│  FileSystemAuditLogService (寫入檔案)       │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│    logs/audit/audit-YYYYMMDD.jsonl          │
└─────────────────────────────────────────────┘

          ┌──────────────────────┐
          │  Cron Job (每日2:00)  │
          └──────────┬───────────┘
                     │
                     ▼
          ┌──────────────────────┐
          │   清理 30 天前檔案    │
          └──────────────────────┘
```

### 檔案結構

```
api/modules/audit-log/
├── audit-log.module.ts              # 模組定義
├── audit-log.controller.ts          # 查詢 API
├── audit-log.service.ts             # 主服務
├── interfaces/
│   └── audit-log.interface.ts       # 介面定義
├── services/
│   └── file-system-audit-log.service.ts  # 檔案系統實作
├── interceptors/
│   └── audit-log.interceptor.ts     # 攔截器
├── dto/
│   ├── audit-log-query.dto.ts       # 查詢 DTO
│   └── audit-log-response.dto.ts    # 回應 DTO
└── integration/
    ├── audit-cleanup.integration.spec.ts
    └── audit-masking.integration.spec.ts

api/common/
├── constants/
│   ├── audit-log.constants.ts       # 稽核常數
│   └── file-paths.constants.ts      # 路徑常數
├── decorators/
│   └── audit-log.decorator.ts       # @AuditLog 裝飾器
├── exceptions/
│   └── audit-storage.exception.ts   # 儲存異常
└── utils/
    ├── sensitive-data-masker.ts     # 敏感資料遮罩
    └── audit-log-file-manager.ts    # 檔案管理
```

---

## 🔧 設定選項

### 環境變數 (可選)

```bash
# 保留天數 (預設: 30)
AUDIT_LOG_RETENTION_DAYS=30

# 最大查詢天數 (預設: 7)
AUDIT_LOG_MAX_QUERY_DAYS=7

# 預設每頁筆數 (預設: 50)
AUDIT_LOG_DEFAULT_LIMIT=50

# 最大每頁筆數 (預設: 100)
AUDIT_LOG_MAX_LIMIT=100
```

### 常數自訂

如需自訂敏感欄位模式，修改 `api/common/constants/audit-log.constants.ts`:

```typescript
export const SENSITIVE_PATTERNS = [
  /password/i,
  /token/i,
  /secret/i,
  /key/i,
  /auth/i,
  // 加入自訂模式...
] as const;
```

---

## 📊 效能指標

### 預期效能
- **寫入延遲**: ~1-5ms (SSD)
- **查詢時間**: <100ms (7 天內資料)
- **單筆大小**: ~1-2KB
- **日檔案大小**: ~100-200KB
- **30 天總容量**: ~3-6MB

### 適用場景
- 寫入操作頻率: ≤1 ops/sec
- 查詢頻率: 無特定限制
- 單次查詢結果: ≤600 筆記錄

---

## 🧪 測試

### 執行所有測試

```bash
npm test -- audit-log
```

### 測試覆蓋率

```bash
npm run test:cov
```

### 測試類型
- ✅ **合約測試**: 驗證 API 回應格式符合 OpenAPI 規範
- ✅ **整合測試**: 端到端流程測試
- ✅ **單元測試**: 核心工具類別測試

---

## ⚠️ 注意事項

### 安全性
- 敏感資料遮罩不可逆，請確認模式設定正確
- 日誌檔案包含操作資訊，應設定適當權限
- 建議定期備份稽核日誌

### 效能
- 同步寫入適合低容量場景
- 高容量場景建議遷移至資料庫
- 監控磁碟空間使用

### 維護
- 定期檢查日誌檔案大小
- 驗證自動清理機制運作正常
- 根據實際使用調整保留天數

---

## 🔄 後續擴展

### 短期
- [ ] 新增更多 API 端點的稽核標記
- [ ] 實作前端管理介面
- [ ] 新增稽核統計功能

### 中期
- [ ] 遷移至 PostgreSQL (利用抽象介面)
- [ ] 實作全文搜尋功能
- [ ] 新增稽核報表功能

### 長期
- [ ] 整合 ELK Stack
- [ ] 實作即時告警機制
- [ ] 新增異常檢測功能

---

## 📞 支援與問題回報

### 相關資源
- **專案憲章**: `.specify/memory/constitution.md`
- **開發規範**: `CLAUDE.md`
- **GitHub Issues**: [專案問題追蹤](https://github.com/your-org/upd3-ops-platform/issues)

### 常見問題

**Q: 如何新增更多需要稽核的 API？**
A: 在 Controller 方法上加入 `@AuditLog({ page, action })` 裝飾器即可。

**Q: 敏感資料遮罩規則可以自訂嗎？**
A: 可以，修改 `api/common/constants/audit-log.constants.ts` 中的 `SENSITIVE_PATTERNS`。

**Q: 如何調整檔案保留天數？**
A: 修改環境變數 `AUDIT_LOG_RETENTION_DAYS` 或常數 `AUDIT_LOG_RETENTION.RETENTION_DAYS`。

**Q: 查詢效能不理想怎麼辦？**
A: 考慮遷移至資料庫儲存，利用現有的 `IAuditLogService` 抽象介面實作 DatabaseAuditLogService。

---

## ✅ 驗收清單

實作完成後，請確認以下項目：

- [ ] 執行 `setup-and-verify.sh` 腳本成功
- [ ] AuditLogModule 已整合到主應用
- [ ] 應用可以正常啟動
- [ ] 執行寫入操作時自動產生稽核日誌
- [ ] 查詢 API 可正常運作
- [ ] 敏感資料已正確遮罩
- [ ] 日誌檔案格式符合 JSON Lines 規範
- [ ] 測試覆蓋率達標 (單元 ≥95%, 整合 ≥80%)

---

**實作完成日期**: 2025-10-06
**版本**: 1.0.0
**狀態**: ✅ Ready for Integration
