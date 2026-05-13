# EX 廠商 / 裝潢商 Portal（精簡部署版）

純 vendor + decorator 流程，無 admin。方案選擇後**自動通過**，立即解鎖功能。

---

## 🚀 快速開始

### 線上 Demo

打開即可試用：**https://expo.zeabur.app**

### 測試帳號

帳號與密碼皆為公司統一編號（皆 8 碼），輸入兩次相同數字。

| 角色 | 登入頁 | 統編可用 |
|------|-------|---------|
| 廠商 | `/portal/vendor-login` | `22099131`, `24566673`, `85171161`, `70725830` |
| 裝潢商 | `/portal/decorator-login` | `44556677`, `55667700`, `66778800` |

裝潢商也可以從廠商邀請連結（自行裝潢方案）首次註冊，自填新統編 + 公司名 + 負責人。

### 本機開發

```bash
# 1. clone repo
git clone https://github.com/jerrytp6/ex-vendor-portal.git
cd ex-vendor-portal

# 2. 後端
cd server
cp .env.example .env       # 編輯 .env：DATABASE_URL（本機 MySQL）+ JWT_SECRET
npm install
npx prisma db push          # 建表
npm run seed                # 建範例資料（廠商 / 裝潢商 / 方案 / 文件）
npm run dev                 # 啟動，預設 http://localhost:7002

# 3. 前端（另開 terminal）
cd ..
npm install
npm run dev                 # 啟動，預設 http://localhost:5173/EXPO/
```

`server/.env` 範例：

```ini
PORT=7002
DATABASE_URL="mysql://user:password@localhost:3306/ex"
JWT_SECRET="隨機 64 字元，例：openssl rand -base64 48"
JWT_EXPIRES_IN="7d"
CORS_ORIGIN="http://localhost:5173"
```

### 部署到 Zeabur

詳細 SOP 見 [ZEABUR-DEPLOY.md](./ZEABUR-DEPLOY.md)（3 服務：MySQL + Backend + Frontend）

---

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
├── ZEABUR-DEPLOY.md      # Zeabur 部署 SOP
└── package.json
```

## 功能

### 廠商側 (`/portal/vendor-login`)
- 統編登入（帳號 = 密碼 = 公司統編）
- 選擇贊助方案（攤位 / 演講 / 廣告，可多選 + 詳情頁）→ **自動通過**
- Dashboard：綠色 banner「方案已通過」+ 功能卡片
  - 贊助方案（通過後唯讀）
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
- `/healthz` — 健康檢查（含 DB 連線測試）

---

## 技術棧

- **前端**：React 19 + Vite + React Router (HashRouter) + Tailwind + Zustand（toast）
- **後端**：Node 20 + Express + Prisma 5 + MySQL 8 + JWT 雙 scope（vendor / decorator）
- **部署**：Zeabur（Frontend nginx + Backend Node + Marketplace MySQL）
