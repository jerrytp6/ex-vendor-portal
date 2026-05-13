import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { API_BASE } from "../../lib/apiBase";
import { setDecoratorToken } from "../../lib/decoratorAuth";
import { Icon } from "../../components/Icon";
import { toast } from "../../store/toast";

// 公開 API helper（無需 token）
async function publicGet(path, params) {
  const url = new URL(`${API_BASE}${path}`, window.location.origin);
  if (params) for (const [k, v] of Object.entries(params))
    if (v != null) url.searchParams.set(k, v);
  const r = await fetch(url.toString());
  if (!r.ok) {
    const body = await r.json().catch(() => ({}));
    throw Object.assign(new Error(body.error || `http_${r.status}`), { status: r.status, body });
  }
  return r.json();
}
async function publicPost(path, body) {
  const r = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!r.ok) {
    const respBody = await r.json().catch(() => ({}));
    throw Object.assign(new Error(respBody.error || `http_${r.status}`), { status: r.status, body: respBody });
  }
  return r.json();
}

// 裝潢公司接收邀請 — 公開頁，無需登入
// 流程：看到邀請資訊 → 輸入統編 + 公司名 + 專案負責人 → 註冊 → 顯示成功畫面
export default function DecoratorInvitation() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [autoLoggingIn, setAutoLoggingIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [invitation, setInvitation] = useState(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [lookingUp, setLookingUp] = useState(false);
  const [result, setResult] = useState(null); // { decorator, project } — 註冊成功後

  const [taxId, setTaxId] = useState("");
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [taxIdLocked, setTaxIdLocked] = useState(false); // 是否從 taxId lookup 取得既有資料
  const [matchedExisting, setMatchedExisting] = useState(false);

  useEffect(() => {
    if (!token) return;
    publicGet(`/public/decor-invite/${token}`)
      .then(setInvitation)
      .catch((err) => setError(err.body?.error || err.message))
      .finally(() => setLoading(false));
  }, [token]);

  // 統編 blur → lookup
  async function onTaxIdBlur() {
    const cleaned = taxId.trim();
    if (!/^\d{8}$/.test(cleaned)) {
      setMatchedExisting(false);
      return;
    }
    setLookingUp(true);
    try {
      const existing = await publicGet(`/public/decor-invite/${token}/lookup-tax`, { taxId: cleaned });
      if (existing) {
        setName(existing.name || "");
        setMatchedExisting(true);
        setTaxIdLocked(true);
        toast.success(`已自動帶入：${existing.name}`);
      }
    } catch (err) {
      if (err.status === 404) {
        setMatchedExisting(false);
        // 首次註冊：使用者自行填寫公司名
      } else {
        toast.error(`統編查詢失敗：${err.body?.error || err.message}`);
      }
    } finally {
      setLookingUp(false);
    }
  }

  async function submit() {
    if (!/^\d{8}$/.test(taxId.trim())) {
      toast.error("請輸入有效的 8 碼統一編號");
      return;
    }
    if (!name.trim() || !contact.trim()) {
      toast.error("請完整填寫公司名稱與專案負責人");
      return;
    }
    setSubmitting(true);
    try {
      const r = await publicPost(`/public/decor-invite/${token}/register`, {
        taxId: taxId.trim(),
        name: name.trim(),
        contact: contact.trim(),
      });
      toast.success(matchedExisting ? "已接受邀請" : "註冊成功");
      // 後端回傳 token，立即存入 localStorage，後續一鍵進後台
      if (r.token) setDecoratorToken(r.token);
      setResult(r);
    } catch (err) {
      toast.error(`註冊失敗：${err.body?.error || err.message}`);
    } finally {
      setSubmitting(false);
    }
  }

  // 已註冊 → 點邀請連結重新登入（魔法連結）
  async function autoLogin() {
    setAutoLoggingIn(true);
    try {
      const r = await publicPost(`/public/decor-invite/${token}/auto-login`);
      setDecoratorToken(r.token);
      toast.success(`歡迎回來，${r.decorator.name}`);
      navigate(`/portal/decorator/${r.decorator.id}`);
    } catch (err) {
      toast.error(`登入失敗：${err.body?.error || err.message}`);
      setAutoLoggingIn(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center p-8" style={{ background: "var(--bg)" }}>
        <div className="text-[14px]" style={{ color: "var(--text-tertiary)" }}>載入中…</div>
      </div>
    );
  }
  if (error || !invitation) {
    return (
      <div className="min-h-screen grid place-items-center p-8" style={{ background: "var(--bg)" }}>
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-bold mb-2">邀請連結無效</h1>
          <p className="text-[14px] mb-6" style={{ color: "var(--text-secondary)" }}>
            {error === "expired" ? "此連結已過期。" : "此連結不存在或已過期，請聯繫邀請您的廠商。"}
          </p>
          <Link to="/login" className="text-[13px] font-display no-underline" style={{ color: "var(--text-tertiary)" }}>
            ← 回到首頁
          </Link>
        </div>
      </div>
    );
  }

  const event = invitation.event;
  const alreadyAccepted = invitation.status === "accepted";

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }} data-role="decorator">
      <div className="max-w-[720px] mx-auto p-6 md:p-12">
        <div className="flex items-center gap-3 mb-8">
          <div
            className="w-11 h-11 rounded-xl grid place-items-center"
            style={{ background: "linear-gradient(135deg, #ff6a00, #ff2d92)" }}
          >
            <Icon name="sparkles" className="icon" />
            <style>{`.flex.items-center > div:first-child .icon { stroke: white; }`}</style>
          </div>
          <div>
            <div className="font-display font-bold text-[15px]">Exhibition OS</div>
            <div className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>
              裝潢公司合作邀請
            </div>
          </div>
        </div>

        {/* 邀請 banner */}
        <div
          className="rounded-3xl p-8 md:p-10 text-white relative overflow-hidden mb-6"
          style={{ background: "linear-gradient(135deg, #ff6a00 0%, #ff2d92 50%, #bf5af2 100%)" }}
        >
          <div className="text-[11px] font-display uppercase tracking-[0.2em] opacity-80 mb-3">
            Decoration Partnership Invitation
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
            您獲得參展廠商邀請
          </h1>
          <div className="text-[14px] font-display opacity-90">
            {event?.name}
            {event?.startDate && ` · ${String(event.startDate).slice(0, 10)}`}
            {event?.location && ` · ${event.location}`}
          </div>
          <div className="absolute -bottom-24 -right-24 w-64 h-64 rounded-full bg-white/10 blur-3xl" />
        </div>

        {/* 成功畫面 */}
        {result ? (
          <div className="panel">
            <div className="text-center py-6 mb-4">
              <div
                className="w-16 h-16 rounded-full mx-auto mb-4 grid place-items-center"
                style={{ background: "linear-gradient(135deg, #30d158, #0bb850)" }}
              >
                <Icon name="check" className="icon" />
                <style>{`.text-center .icon { stroke: white; width: 32px; height: 32px; }`}</style>
              </div>
              <h2 className="text-2xl font-bold tracking-tight mb-2">
                {matchedExisting ? "已接受邀請" : "註冊成功"}
              </h2>
              <p className="text-[14px]" style={{ color: "var(--text-secondary)" }}>
                {result.decorator.name} 與廠商的合作專案已建立。<br />
                主辦方與廠商會與您聯繫後續設計與施工事宜。
              </p>
            </div>

            <div
              className="rounded-xl p-4 space-y-2.5"
              style={{ background: "var(--bg-tinted)", border: "1px solid var(--separator)" }}
            >
              <Row k="公司名稱" v={result.decorator.name} />
              <Row k="統一編號" v={result.decorator.taxId} />
              <Row k="專案負責人" v={result.decorator.contact} />
              <Row k="專案" v={result.project.title} />
            </div>

            <button
              type="button"
              onClick={() => result.token && navigate(`/portal/decorator/${result.decorator.id}`)}
              disabled={!result.token}
              className="mt-4 block w-full text-center px-5 py-3 rounded-xl text-white font-medium text-[14px]"
              style={{
                background: "linear-gradient(135deg, #ff6a00, #ff2d92)",
                cursor: result.token ? "pointer" : "not-allowed",
                opacity: result.token ? 1 : 0.6,
              }}
            >
              進入裝潢商後台 →
            </button>
            <div
              className="text-[11px] font-display mt-3 p-3 rounded-lg"
              style={{ background: "rgba(0,113,227,0.06)", color: "var(--text-secondary)" }}
            >
              💡 <strong>把此邀請連結存到書籤</strong>，下次直接點進來就會自動登入後台 — 不用記網址也不用密碼。
              <br />或到 <Link to="/portal/decorator-login" style={{ color: "#0071e3" }}>裝潢商登入頁</Link> 用統編登入。
            </div>
          </div>
        ) : alreadyAccepted ? (
          <div className="panel text-center py-10">
            <div
              className="w-16 h-16 rounded-full mx-auto mb-4 grid place-items-center"
              style={{ background: "linear-gradient(135deg, #30d158, #0bb850)" }}
            >
              <Icon name="check" className="icon" />
              <style>{`.text-center .icon { stroke: white; width: 32px; height: 32px; }`}</style>
            </div>
            <h2 className="text-xl font-bold mb-2 tracking-tight">歡迎回來</h2>
            <p className="text-[14px] mb-5" style={{ color: "var(--text-secondary)" }}>
              {invitation.decoratorCompany || "您"} 已是此專案的裝潢商。<br />
              點下方按鈕一鍵進入後台。
            </p>
            <button
              type="button"
              onClick={autoLogin}
              disabled={autoLoggingIn}
              className="block w-full text-center px-5 py-3 rounded-xl text-white font-medium text-[14px] mb-3"
              style={{
                background: "linear-gradient(135deg, #ff6a00, #ff2d92)",
                cursor: autoLoggingIn ? "wait" : "pointer",
                opacity: autoLoggingIn ? 0.7 : 1,
              }}
            >
              {autoLoggingIn ? "登入中…" : "進入裝潢商後台 →"}
            </button>
            <div
              className="text-[11px] font-display p-3 rounded-lg"
              style={{ background: "rgba(0,113,227,0.06)", color: "var(--text-secondary)" }}
            >
              💡 此邀請連結是您的<strong>永久魔法登入連結</strong>，建議存到書籤。也可改至 <Link to="/portal/decorator-login" style={{ color: "#0071e3" }}>裝潢商登入頁</Link> 用統編登入。
            </div>
          </div>
        ) : (
          <div className="panel">
            <h2 className="text-2xl font-bold tracking-tight mb-2">註冊 / 登入</h2>
            <p className="text-[14px] mb-6" style={{ color: "var(--text-secondary)" }}>
              填寫公司資料以接受邀請。若統編已存在系統，將自動帶入公司資訊。
            </p>

            <Field label="統一編號（8 碼）">
              <div className="relative">
                <input
                  type="text"
                  value={taxId}
                  onChange={(e) => {
                    setTaxId(e.target.value.replace(/\D/g, "").slice(0, 8));
                    setMatchedExisting(false);
                    setTaxIdLocked(false);
                  }}
                  onBlur={onTaxIdBlur}
                  placeholder="請輸入裝潢公司統編"
                  className="w-full px-4 py-3 rounded-xl text-[14px] outline-none"
                  style={{ background: "var(--bg-tinted)", border: "1px solid var(--separator)" }}
                  maxLength={8}
                />
                {lookingUp && (
                  <div
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-display"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    查詢中…
                  </div>
                )}
                {matchedExisting && !lookingUp && (
                  <div
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-display"
                    style={{ color: "#1f8a3a" }}
                  >
                    ✓ 已找到
                  </div>
                )}
              </div>
              {matchedExisting && (
                <div className="text-[11px] mt-1.5 font-display" style={{ color: "var(--text-tertiary)" }}>
                  系統已有此統編的裝潢商資料，公司名稱已自動帶入。
                </div>
              )}
            </Field>

            <Field label="公司名稱">
              <input
                type="text"
                value={name}
                onChange={(e) => !taxIdLocked && setName(e.target.value)}
                readOnly={taxIdLocked}
                placeholder="請輸入裝潢公司名稱"
                className="w-full px-4 py-3 rounded-xl text-[14px] outline-none"
                style={{
                  background: taxIdLocked ? "rgba(0,0,0,0.04)" : "var(--bg-tinted)",
                  border: "1px solid var(--separator)",
                  color: taxIdLocked ? "var(--text-tertiary)" : "inherit",
                }}
              />
            </Field>

            <Field label="專案負責人">
              <input
                type="text"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="請輸入此專案的負責人姓名"
                className="w-full px-4 py-3 rounded-xl text-[14px] outline-none"
                style={{ background: "var(--bg-tinted)", border: "1px solid var(--separator)" }}
              />
            </Field>

            <button
              type="button"
              onClick={submit}
              disabled={submitting || lookingUp}
              className="w-full py-3 rounded-xl text-white font-medium text-[14px] mt-2"
              style={{
                background: "linear-gradient(135deg, #ff6a00, #ff2d92)",
                opacity: submitting || lookingUp ? 0.6 : 1,
                cursor: submitting || lookingUp ? "not-allowed" : "pointer",
              }}
            >
              {submitting ? "送出中…" : matchedExisting ? "登入並接受邀請 →" : "註冊並接受邀請 →"}
            </button>

            <div
              className="text-[11px] font-display mt-4 p-3 rounded-lg"
              style={{ background: "var(--bg-tinted)", color: "var(--text-tertiary)" }}
            >
              邀請有效期至 {invitation.expiresAt ? new Date(invitation.expiresAt).toLocaleDateString("zh-TW") : "—"}。
            </div>
          </div>
        )}

        <div
          className="text-center mt-8 text-[11px] font-display"
          style={{ color: "var(--text-tertiary)" }}
        >
          Powered by Exhibition OS · 連結登入專屬頁面
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="mb-4">
      <label
        className="block text-[12px] font-display font-semibold uppercase tracking-wider mb-2"
        style={{ color: "var(--text-tertiary)" }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

function Row({ k, v }) {
  return (
    <div className="flex justify-between gap-3 text-[13px]">
      <span style={{ color: "var(--text-tertiary)" }}>{k}</span>
      <span className="font-medium">{v}</span>
    </div>
  );
}
