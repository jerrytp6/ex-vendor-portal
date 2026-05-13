# EX 廠商 / 裝潢商 Portal（精簡部署版）

純 vendor + decorator 流程，無 admin。方案選擇後**自動通過**，立即解鎖功能。

## 結構

```
ex-vendor-portal/
├── src/                  # React + Vite 前端
│   ├── pages/portal/     # 廠商 / 裝潢商頁面
│   ├── pages/decor/      # 裝潢商邀請接受頁
│   ├── lib/              # apiBase / vendorAuth / decoratorAuth
│   └── components/       # UI 元件
├── server/               # Express + Prisma 後端
│   ├── src/routes/       # health / portal-vendor / portal-decorator / decorators(公開) / uploads
│   └── prisma/           # schema + seed
├── ZEABUR-DEPLOY.md      # Zeabur 部署 SOP（3 服務：MySQL + Backend + Frontend）
└── package.json
```

## 功能

### 廠商側 (`/portal/vendor-login`)
- 統編登入（帳號 = 密碼 = 公司統編）
- 選擇贊助方案（攤位 / 演講 / 廣告，可多選 + 詳情頁）→ **自動通過**
- Dashboard：綠色 banner「方案已通過」+ 功能卡片
  - 贊助方案（可變更，但通過後鎖定）
  - 攤位贊助（含 BoothHub：裝潢方案 + 文件確認）
  - 演講贊助 / 廣告贊助（骨架）

### 裝潢商側
- 從廠商邀請連結進入（`/decor-invite/:token`）
- 統編 lookup → 若已存在自動帶入公司資訊
- 註冊後可透過 `/portal/decorator-login` 統編登入
- Dashboard：專案列表 + 進入單一專案
- 專案頁：上傳設計稿 + 訊息討論

### 後端 API
- `/portal/vendor/*` — 廠商 token 流程
- `/portal/decorator/*` — 裝潢商 token 流程
- `/public/decor-invite/:token/*` — 公開邀請接受流程

## 開發

```bash
# 後端
cd server
cp .env.example .env  # 編輯 DATABASE_URL, JWT_SECRET
npm install
npx prisma db push       # 首次建表
npm run seed             # 建範例資料
npm run dev              # http://localhost:7002

# 前端（另開 terminal）
npm install
npm run dev              # http://localhost:5173
```

## 部署

見 [ZEABUR-DEPLOY.md](./ZEABUR-DEPLOY.md)
