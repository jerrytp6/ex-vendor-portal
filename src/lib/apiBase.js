// API base URL — 一個地方控制 dev / prod / Zeabur 部署
//
// dev：未設 env 時，預設 `/api`（vite proxy 會代理到 localhost:7002）
// prod 同網域：設 `/`（後端 + 前端在同個 domain）
// prod 跨網域：設 backend 的完整 URL，例如 `https://ex-api.zeabur.app`
//
// build 時可用 `VITE_API_BASE_URL=https://... vite build` 注入
export const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api";
