import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { decoratorApi, setDecoratorToken } from "../../lib/decoratorAuth";
import { Icon } from "../../components/Icon";
import { toast } from "../../store/toast";

// 裝潢商登入頁 — 統編 + 統編（雙因素，跟廠商一致）
export default function DecoratorLogin() {
  const navigate = useNavigate();
  const [taxId, setTaxId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e?.preventDefault();
    const acct = taxId.trim();
    const pwd = password.trim();
    if (!acct || !pwd) { toast.error("請輸入統一編號"); return; }
    if (acct !== pwd) { toast.error("帳號與密碼須相同（皆為公司統編）"); return; }
    setLoading(true);
    try {
      const { token, decorator } = await decoratorApi.login(acct);
      setDecoratorToken(token);
      toast.success(`歡迎，${decorator.name}`);
      navigate(`/portal/decorator/${decorator.id}`);
    } catch (err) {
      if (err.status === 401) toast.error("統一編號錯誤或裝潢商未啟用");
      else toast.error(`登入失敗：${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid place-items-center p-8" style={{ background: "var(--bg)" }} data-role="decorator">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-3 mb-8">
          <div
            className="w-11 h-11 rounded-xl grid place-items-center"
            style={{ background: "linear-gradient(135deg, #ff6a00, #ff2d92)" }}
          >
            <Icon name="sparkles" stroke="white" />
          </div>
          <div>
            <div className="font-display font-bold text-[15px]">Exhibition OS</div>
            <div className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>裝潢公司後台</div>
          </div>
        </div>

        <div className="panel">
          <h2 className="text-2xl font-bold tracking-tight mb-2">裝潢商登入</h2>
          <p className="text-[14px] mb-6" style={{ color: "var(--text-secondary)" }}>
            請輸入公司統一編號登入後台管理您的裝潢專案。
          </p>

          <form onSubmit={submit}>
            <label className="block text-[12px] font-display font-semibold uppercase tracking-wider mb-2"
              style={{ color: "var(--text-tertiary)" }}>
              帳號（統一編號 8 碼）
            </label>
            <input
              type="text"
              value={taxId}
              onChange={(e) => setTaxId(e.target.value.replace(/\D/g, "").slice(0, 8))}
              placeholder="請輸入公司統編"
              className="w-full px-4 py-3 rounded-xl text-[14px] outline-none mb-3"
              style={{ background: "var(--bg-tinted)", border: "1px solid var(--separator)" }}
              maxLength={8}
              autoFocus
            />

            <label className="block text-[12px] font-display font-semibold uppercase tracking-wider mb-2"
              style={{ color: "var(--text-tertiary)" }}>
              密碼（再次輸入統編）
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value.replace(/\D/g, "").slice(0, 8))}
              placeholder="與帳號相同"
              className="w-full px-4 py-3 rounded-xl text-[14px] outline-none mb-4"
              style={{ background: "var(--bg-tinted)", border: "1px solid var(--separator)" }}
              maxLength={8}
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-white font-medium text-[14px]"
              style={{
                background: "linear-gradient(135deg, #ff6a00, #ff2d92)",
                opacity: loading ? 0.6 : 1,
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "登入中…" : "登入"}
            </button>
          </form>

          <div
            className="text-[11px] font-display mt-4 p-3 rounded-lg"
            style={{ background: "var(--bg-tinted)", color: "var(--text-tertiary)" }}
          >
            提示：尚未註冊？請使用廠商提供的邀請連結首次加入。
          </div>
        </div>

        <div className="text-center mt-6">
          <Link to="/login" className="text-[12px] font-display no-underline" style={{ color: "var(--text-tertiary)" }}>
            ← 回到首頁
          </Link>
        </div>
      </div>
    </div>
  );
}
