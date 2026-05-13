// 裝潢商 token + API helper（與 vendor 並行的獨立認證）
import { API_BASE } from "./apiBase.js";

const TOKEN_KEY = "exhibition-os.decorator-token";

export function getDecoratorToken() {
  return localStorage.getItem(TOKEN_KEY);
}
export function setDecoratorToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}
export function clearDecoratorToken() {
  localStorage.removeItem(TOKEN_KEY);
}

class DecoratorApiError extends Error {
  constructor(status, body) {
    super(body?.error || `http_${status}`);
    this.status = status;
    this.body = body;
  }
}

async function request(method, path, { body, headers } = {}) {
  const token = getDecoratorToken();
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
    if (res.status === 401 || res.status === 403) clearDecoratorToken();
    throw new DecoratorApiError(res.status, data);
  }
  return data;
}

async function uploadFile(path, file, extra = {}) {
  const fd = new FormData();
  fd.append("file", file);
  for (const [k, v] of Object.entries(extra)) fd.append(k, v);
  const token = getDecoratorToken();
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: fd,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    if (res.status === 401 || res.status === 403) clearDecoratorToken();
    throw new DecoratorApiError(res.status, err);
  }
  return res.json();
}

export const decoratorApi = {
  login: (taxId) => request("POST", "/portal/decorator/login", { body: { taxId } }),
  me: () => request("GET", "/portal/decorator/me"),
  project: (id) => request("GET", `/portal/decorator/projects/${id}`),
  sendMessage: (id, content) => request("POST", `/portal/decorator/projects/${id}/messages`, { body: { content } }),
  uploadDesign: (id, file, title, description) =>
    uploadFile(`/portal/decorator/projects/${id}/designs`, file, { title, description: description || "" }),
};

export { DecoratorApiError };
