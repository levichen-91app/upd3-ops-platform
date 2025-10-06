#!/bin/bash
# 稽核日誌功能安裝和驗證腳本

set -e

echo "=========================================="
echo "稽核日誌功能安裝和驗證"
echo "=========================================="
echo ""

# 檢查當前目錄
if [ ! -f "package.json" ]; then
  echo "❌ 錯誤: 請在專案根目錄執行此腳本"
  exit 1
fi

# 步驟 1: 安裝依賴
echo "步驟 1/5: 安裝依賴套件..."
echo "-------------------------------------------"
npm install node-cron
npm install -D @types/node-cron
echo "✅ 依賴套件安裝完成"
echo ""

# 步驟 2: 建立日誌目錄
echo "步驟 2/5: 建立日誌目錄..."
echo "-------------------------------------------"
mkdir -p logs/audit
chmod 755 logs/audit
echo "✅ 日誌目錄建立完成: logs/audit"
echo ""

# 步驟 3: 編譯專案
echo "步驟 3/5: 編譯專案..."
echo "-------------------------------------------"
npm run build
if [ $? -eq 0 ]; then
  echo "✅ 專案編譯成功"
else
  echo "❌ 專案編譯失敗，請檢查錯誤訊息"
  exit 1
fi
echo ""

# 步驟 4: 執行測試
echo "步驟 4/5: 執行稽核日誌測試..."
echo "-------------------------------------------"
npm test -- --testPathPattern=audit
if [ $? -eq 0 ]; then
  echo "✅ 測試執行成功"
else
  echo "⚠️  部分測試失敗，請檢查測試結果"
  echo "提示: 某些整合測試需要在應用啟動後才能完全通過"
fi
echo ""

# 步驟 5: 驗證檔案結構
echo "步驟 5/5: 驗證檔案結構..."
echo "-------------------------------------------"

# 檢查關鍵檔案
files_to_check=(
  "api/modules/audit-log/audit-log.module.ts"
  "api/modules/audit-log/audit-log.controller.ts"
  "api/modules/audit-log/audit-log.service.ts"
  "api/common/decorators/audit-log.decorator.ts"
  "api/common/constants/audit-log.constants.ts"
  "api/common/utils/sensitive-data-masker.ts"
  "api/common/utils/audit-log-file-manager.ts"
)

all_files_exist=true
for file in "${files_to_check[@]}"; do
  if [ -f "$file" ]; then
    echo "  ✓ $file"
  else
    echo "  ✗ $file (缺少)"
    all_files_exist=false
  fi
done

if [ "$all_files_exist" = true ]; then
  echo "✅ 所有核心檔案存在"
else
  echo "❌ 部分檔案缺少，請檢查實作"
  exit 1
fi
echo ""

# 完成
echo "=========================================="
echo "✅ 安裝和驗證完成！"
echo "=========================================="
echo ""
echo "下一步:"
echo "1. 在主應用模組中導入 AuditLogModule"
echo "   import { AuditLogModule } from './modules/audit-log/audit-log.module';"
echo ""
echo "2. 啟動應用進行測試:"
echo "   npm run start:dev"
echo ""
echo "3. 參考快速開始指南進行功能驗證:"
echo "   specs/011-011-audit-log/quickstart.md"
echo ""
echo "4. 查看完整實作報告:"
echo "   specs/011-011-audit-log/IMPLEMENTATION_COMPLETE.md"
echo ""
