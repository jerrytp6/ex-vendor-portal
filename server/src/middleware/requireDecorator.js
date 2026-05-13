import { verifyToken } from "../lib/jwt.js";

// 裝潢商 token 守門：scope === "decorator" 才放行
// payload: { scope: "decorator", decoratorId, tenantId, exp }
// 注入 req.decorator
export function requireDecorator(req, res, next) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ error: "missing_token" });
  }
  try {
    const payload = verifyToken(token);
    if (payload.scope !== "decorator") {
      return res.status(403).json({ error: "decorator_token_required" });
    }
    req.decorator = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: "invalid_token", detail: err.message });
  }
}
