import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";

import { healthRouter } from "./routes/health.js";
import { publicDecoratorsRouter } from "./routes/decorators.js";
import { filesRouter } from "./routes/uploads.js";
import { portalVendorRouter } from "./routes/portal-vendor.js";
import { portalDecoratorRouter } from "./routes/portal-decorator.js";
import { errorHandler } from "./middleware/error.js";

const app = express();
const PORT = parseInt(process.env.PORT || "7002", 10);
// CORS_ORIGIN 可填多個 origin，逗號分隔
const CORS_ORIGINS = (process.env.CORS_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.use(helmet());
app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    if (CORS_ORIGINS.includes(origin) || CORS_ORIGINS.includes("*")) return cb(null, true);
    cb(new Error(`cors_blocked: ${origin}`));
  },
  credentials: true,
}));
app.use(express.json({ limit: "10mb" }));
app.use(morgan("dev"));

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "too_many_requests" },
});

app.use("/", healthRouter);
app.use(apiLimiter);

// 廠商：login(公開) + me/sponsorship/event-documents/decorator-invitation (vendor token)
app.use("/portal", portalVendorRouter);
// 裝潢商：login(公開) + me/projects/designs/messages (decorator token)
app.use("/portal", portalDecoratorRouter);

// 公開：裝潢商接受邀請 token endpoints
app.use("/public", publicDecoratorsRouter);

// 下載上傳的檔案
app.use("/files", filesRouter);

app.use((req, res) => res.status(404).json({ error: "not_found", path: req.path }));
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`[ex-api] listening on http://localhost:${PORT}`);
  console.log(`[ex-api] cors origins: ${CORS_ORIGINS.join(", ")}`);
});
