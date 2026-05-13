import { verifyToken } from "../lib/jwt.js";

// 廠商 token 守門：scope === "vendor" 才放行
// payload: { scope: "vendor", vendorId, tenantId, eventId, exp }
// 注入 req.vendor
export function requireVendor(req, res, next) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ error: "missing_token" });
  }
  try {
    const payload = verifyToken(token);
    if (payload.scope !== "vendor") {
      return res.status(403).json({ error: "vendor_token_required" });
    }
    req.vendor = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: "invalid_token", detail: err.message });
  }
}
