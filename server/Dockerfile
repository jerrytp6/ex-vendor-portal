# Backend image — 跳過 Zeabur 預設的 `npm update -g npm` 步驟
FROM node:20-slim

# Prisma 需要 OpenSSL
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 依賴先裝（include devDeps，因為需要 prisma CLI 跑 generate）
COPY package.json package-lock.json* ./
RUN npm ci

# 程式碼（含 prisma/schema.prisma）
COPY . .

# 確保 Prisma client 為當前 OS 版本
RUN npx prisma generate

ENV NODE_ENV=production
EXPOSE 8080

# 啟動時自動套用 schema（首次部署建表）
CMD ["sh", "-c", "npx prisma db push --skip-generate --accept-data-loss || true && node src/index.js"]
