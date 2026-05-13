import { Router } from "express";
import path from "node:path";
import fs from "node:fs";
import { UPLOAD_DIR } from "../middleware/upload.js";
import { verifyToken } from "../lib/jwt.js";

// 下載：/files/{tenantId}/{YYYY-MM}/{filename}
// 要求 vendor 或 decorator JWT；tenant 路徑必須對應 token 內的 tenantId
export const filesRouter = Router();

function readFileAuth(req, res, next) {
  let token = null;
  const header = req.headers.authorization || "";
  if (header.startsWith("Bearer ")) token = header.slice(7);
  else if (req.query.token) token = req.query.token;
  if (!token) return res.status(401).json({ error: "missing_token" });
  try {
    req.tokenPayload = verifyToken(token);
    next();
  } catch (err) {
    return res.status(401).json({ error: "invalid_token" });
  }
}

filesRouter.get("/:tenantId/:ym/:filename", readFileAuth, (req, res) => {
  const { tenantId, ym, filename } = req.params;
  if (filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
    return res.status(400).json({ error: "invalid_filename" });
  }
  if (!/^\d{4}-\d{2}$/.test(ym)) {
    return res.status(400).json({ error: "invalid_ym" });
  }
  // tenant 比對：vendor / decorator token 的 tenantId 必須對應路徑
  if (req.tokenPayload.tenantId !== tenantId) {
    return res.status(403).json({ error: "forbidden_tenant" });
  }
  const filePath = path.join(UPLOAD_DIR, tenantId, ym, filename);
  if (!filePath.startsWith(UPLOAD_DIR)) {
    return res.status(400).json({ error: "invalid_path" });
  }
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "not_found" });
  }
  res.sendFile(filePath);
});
