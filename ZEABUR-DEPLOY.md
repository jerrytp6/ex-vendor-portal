# Zeabur 部署指引

> 三服務架構：MySQL（managed）+ Backend（Node from `/server`）+ Frontend（Static from `/`）
> 同一個 Zeabur 專案內，三個服務串接。

---

## 前置作業

1. **GitHub repo**：把本 repo push 到你的 GitHub
2. **Zeabur 帳號**：[zeabur.com](https://zeabur.com) 註冊，連結 GitHub
3. **建立 Zeabur 專案**：Dashboard → New Project → 取個名字（例如 `exhibition-os-prod`）

---

## 步驟 1：建 MySQL 服務

1. 專案頁 → **Add Service** → **Marketplace** → 搜尋 `MySQL` → **Deploy**
2. 等待狀態變綠（約 30 秒）
3. 點該服務 → **Connect** 分頁 → 看到自動產生的環境變數：
   - `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_DATABASE`
   - 以及 `MYSQL_CONNECTION_STRING` / `DATABASE_URL`（這個之後給後端用）

---

## 步驟 2：建 Backend 服務

1. 專案頁 → **Add Service** → **Git** → 選你的 repo
2. Zeabur 應該自動偵測為 Node.js；若沒有，手動設定：
   - **Root Directory**: `/server`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Framework**: Node.js
3. 切到 **Variables** 分頁，加環境變數：

| 變數 | 值 | 說明 |
|------|-----|------|
| `DATABASE_URL` | `${MYSQL.DATABASE_URL}` | 引用 MySQL 服務的連線字串（Zeabur 變數參考語法）|
| `JWT_SECRET` | `<隨機 64 字元>` | 用 `openssl rand -base64 48` 產生 |
| `JWT_EXPIRES_IN` | `7d` | token 有效期 |
| `CORS_ORIGIN` | `https://ex-web.zeabur.app` | 前端的 domain（**步驟 3 部署完成後回來填**）|
| `NODE_ENV` | `production` | |
| `APP_BASE_URL` | `https://ex-web.zeabur.app` | 前端 domain（給 email 連結用）|

> ⚠️ `${MYSQL.DATABASE_URL}` 是 Zeabur 的變數引用，會自動帶入該服務內部 URL。如果你的 MySQL 服務名不是 `MYSQL`，要改成對應名稱。

4. **Networking** 分頁 → 開啟 **Domain**（自動產生 `ex-api.zeabur.app` 或類似）
5. 點 **Redeploy**。打開 `https://ex-api.zeabur.app/healthz` 應該看到 `{"status":"ok","db":"ok"}`

> 第一次啟動時 `npm start` 會自動執行 `prisma db push` 建表。Log 應該看到 "🚀 Your database is now in sync with your Prisma schema"。

---

## 步驟 3：首次 Seed 資料（一次性）

1. Backend 服務頁 → **Console**（或 SSH 進容器）
2. 執行：
   ```bash
   cd /src && npm run seed
   ```
3. 看到 `✓ Seed complete` + counts 統計就是成功

> seed 是冪等的（用 upsert），重跑也不會壞。但只有第一次需要，之後升版不要再跑。

---

## 步驟 4：建 Frontend 服務

1. 專案頁 → **Add Service** → **Git** → 選同個 repo
2. Zeabur 應該偵測為 Vite/Static。確認設定：
   - **Root Directory**: `/`（repo 根目錄）
   - **Build Command**: `npm install && npm run build`
   - **Output Directory**: `dist`
   - **Framework**: Static / Vite
3. **Variables** 分頁加：

| 變數 | 值 |
|------|-----|
| `VITE_API_BASE_URL` | `https://ex-api.zeabur.app`（步驟 2 的 backend domain）|
| `VITE_BASE` | `/` |

4. **Networking** 分頁 → 開啟 Domain（自動產生 `ex-web.zeabur.app`）
5. **回到 Backend 服務的 Variables**，更新 `CORS_ORIGIN` 為這個前端 domain
6. Backend Redeploy（套用 CORS 設定）
7. Frontend Redeploy（套用 VITE_API_BASE_URL）

---

## 步驟 5：驗證

打開 `https://ex-web.zeabur.app`：

1. ✓ 看到 Mock Portal 入口頁
2. 點「以 demo 身分進入」測試 SSO 流程
3. 開 `https://ex-web.zeabur.app/#/portal/vendor-login` 用 `22099131 / 22099131` 登入測試

如果有 CORS 錯誤，檢查：
- Backend `CORS_ORIGIN` 是否等於前端 domain（含 `https://`，無尾斜線）
- Backend 有 redeploy

---

## 升版流程

每次 push 到 GitHub 主分支：
- Zeabur 會自動偵測，rebuild 並 redeploy
- 也可在 Dashboard 手動點 **Redeploy**

schema 變動：
- 後端啟動時會自動跑 `prisma db push`
- 嚴重 schema 變動（drop column 等）建議手動先處理

---

## 自訂網域

1. 在 Zeabur 服務 → **Networking** → **Add Domain**
2. 輸入你的網域，例如 `app.yourcompany.com`
3. 在你的 DNS 設 CNAME 指到 Zeabur 提供的目標
4. SSL 證書由 Zeabur 自動申請

記得用自訂網域後：
- 更新 backend 的 `CORS_ORIGIN` 為新前端 domain
- 更新 frontend 的 `VITE_API_BASE_URL` 為新後端 domain
- 兩個服務都 Redeploy

---

## 環境變數總清單

### Backend (`ex-api`)

```ini
DATABASE_URL=mysql://...        # Zeabur MySQL 引用
JWT_SECRET=<64 char random>
JWT_EXPIRES_IN=7d
CORS_ORIGIN=https://ex-web.zeabur.app
APP_BASE_URL=https://ex-web.zeabur.app
NODE_ENV=production

# 可選
PORTAL_SSO_PUBLIC_KEY=<PEM>     # 業主 Portal SSO 公鑰
PORTAL_SSO_ISSUER=https://...
PDF_CJK_FONT_PATH=              # PDF 字型（生產建議放 server/assets/fonts/NotoSansTC-Regular.otf）
```

### Frontend (`ex-web`)

```ini
VITE_API_BASE_URL=https://ex-api.zeabur.app
VITE_BASE=/
```

---

## 常見問題

**Q: build 失敗，prisma generate 找不到 binary？**
A: Zeabur Node 容器有時缺 OpenSSL。在 `server/prisma/schema.prisma` 的 generator 區塊加：
```prisma
generator client {
  provider      = "prisma-client-js"
  binaryTargets = ["native", "linux-musl-openssl-3.0.x"]
}
```
然後 commit + redeploy。

**Q: CORS 一直被擋？**
A: 確認 `CORS_ORIGIN` 跟瀏覽器網址 origin 完全一致。Console F12 看實際 origin 字串。多個 origin 用逗號分隔。

**Q: 上傳檔案沒了？**
A: Zeabur 容器是無狀態的，重啟後 `server/uploads/` 會被清掉。需要外掛 **Volume**：
- 服務頁 → **Volumes** → Add → Mount `/src/uploads`
- 或改用 S3 / Zeabur Object Storage（要改 `server/src/middleware/upload.js`）

**Q: 想看 backend log？**
A: 服務頁 → **Logs** 分頁，real-time tail。

---

## 成本估算

每月（小流量）：
- MySQL: ~$5
- Backend (256MB RAM): ~$3
- Frontend (Static, 全免費)
- **小計：~$8/月**

中等流量（每天千級訪問）：
- MySQL 升 1GB: ~$15
- Backend 升 512MB + 高可用: ~$10
- **小計：~$25/月**

實際依 Zeabur 當下計費，請以 Dashboard 顯示為準。
