import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { vendorApi, setVendorToken } from "../../lib/vendorAuth";
import { Icon } from "../../components/Icon";
import { toast } from "../../store/toast";

// 廠商首次登入頁
// 帳號與密碼皆為公司統一編號（8 碼）
export default function VendorLogin() {
  const navigate = useNavigate();
  const [taxId, setTaxId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e?.preventDefault();
    const acct = taxId.trim();
    const pwd = password.trim();
    if (!acct || !pwd) {
      toast.error("請輸入統一編號");
      return;
    }
    if (acct !== pwd) {
      toast.error("帳號與密碼須相同（皆為公司統編）");
      return;
    }
    setLoading(true);
    try {
      const { token, vendor } = await vendorApi.login(acct);
      setVendorToken(token);
      toast.success(`歡迎，${vendor.company}`);
      navigate(`/portal/vendor/${vendor.id}`);
    } catch (err) {
      if (err.status === 401) toast.error("統一編號錯誤或未授權");
      else toast.error(`登入失敗：${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid place-items-center p-8" style={{ background: "var(--bg)" }}>
      <div className="w-full max-w-md">
        <div className="flex items-center gap-3 mb-8">
          <div
            className="w-11 h-11 rounded-xl grid place-items-center"
            style={{ background: "linear-gradient(135deg, #0071e3, #5e5ce6)" }}
          >
            <Icon name="building" />
            <style>{`.grid .icon { stroke: white; }`}</style>
          </div>
          <div>
            <div className="font-display font-bold text-[15px]">Exhibition OS</div>
            <div className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>參展廠商後台</div>
          </div>
        </div>

        <div className="panel">
          <h2 className="text-2xl font-bold tracking-tight mb-2">廠商登入</h2>
          <p className="text-[14px] mb-6" style={{ color: "var(--text-secondary)" }}>
            請輸入公司統一編號登入贊助方案管理頁。
          </p>

          <form onSubmit={submit}>
            <label
              className="block text-[12px] font-display font-semibold uppercase tracking-wider mb-2"
              style={{ color: "var(--text-tertiary)" }}
            >
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

            <label
              className="block text-[12px] font-display font-semibold uppercase tracking-wider mb-2"
              style={{ color: "var(--text-tertiary)" }}
            >
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
                background: "linear-gradient(135deg, #0071e3, #5e5ce6)",
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
            提示：本系統採統一編號雙因素驗證——帳號 + 密碼皆為公司 8 碼統編。
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
