// 廠商首次登入流程：獨立的 vendor token（與 admin/operator 用的 ex.jwt 分離）
//
// 後端：POST /portal/vendor/login 簽 JWT { scope: "vendor", vendorId, tenantId, eventId, exp(24h) }
// 前端：localStorage exhibition-os.vendor-token 存 JWT 字串

import { API_BASE } from "./apiBase.js";

const TOKEN_KEY = "exhibition-os.vendor-token";

export function getVendorToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setVendorToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export function clearVendorToken() {
  localStorage.removeItem(TOKEN_KEY);
}

class VendorApiError extends Error {
  constructor(status, body) {
    super(body?.error || `http_${status}`);
    this.status = status;
    this.body = body;
  }
}

async function request(method, path, { body, headers } = {}) {
  const token = getVendorToken();
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(headers || {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 204) return null;
  const ct = res.headers.get("content-type") || "";
  const data = ct.includes("application/json") ? await res.json() : await res.text();
  if (!res.ok) {
    if (res.status === 401 || res.status === 403) clearVendorToken();
    throw new VendorApiError(res.status, data);
  }
  return data;
}

async function uploadFile(path, file) {
  const fd = new FormData();
  fd.append("file", file);
  const token = getVendorToken();
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: fd,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    if (res.status === 401 || res.status === 403) clearVendorToken();
    throw new VendorApiError(res.status, err);
  }
  return res.json();
}

export const vendorApi = {
  // 登入 / 自己資料
  login:          (taxId)      => request("POST",  "/portal/vendor/login", { body: { vendorId: taxId, taxId } }),
  me:             ()           => request("GET",   "/portal/vendor/me"),

  // 贊助方案
  listPackages:   ()           => request("GET",   "/portal/sponsorship-packages"),
  setSponsorship: (packageIds) => request("PATCH", "/portal/vendor/sponsorship", { body: { packageIds } }),
  uploadProof:    (file)       => uploadFile("/portal/vendor/payment-proof", file),

  // 裝潢方案
  getDecoratorInvitation:    ()     => request("GET",   "/portal/vendor/decorator-invitation"),
  createDecoratorInvitation: ()     => request("POST",  "/portal/vendor/decorator-invitation"),
  setDecorationMode:         (mode) => request("PATCH", "/portal/vendor/decoration-mode", { body: { mode } }),

  // 展覽文件確認
  listEventDocuments: ()       => request("GET",  "/portal/vendor/event-documents"),
  ackDocument:        (tplId)  => request("POST", `/portal/vendor/event-documents/${tplId}/ack`),
};

// 廠商 packageTypes 派生：用方案 id 去 packages 對照表查 type
export function derivePackageTypes(packageIds = [], packages = []) {
  if (!Array.isArray(packageIds) || !Array.isArray(packages)) return [];
  const byId = new Map(packages.map((p) => [p.id, p]));
  const types = new Set();
  for (const id of packageIds) {
    const p = byId.get(id);
    if (p) types.add(p.type);
  }
  return Array.from(types);
}

export { VendorApiError };
