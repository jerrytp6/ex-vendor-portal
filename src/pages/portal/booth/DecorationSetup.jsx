import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { SceneHead, Panel } from "../../../components/Scene";
import { Icon } from "../../../components/Icon";
import { getVendorToken } from "../../../lib/vendorAuth";
import { API_BASE } from "../../../lib/apiBase";
import { toast } from "../../../store/toast";

async function api(method, path, body) {
  const token = getVendorToken();
  const r = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!r.ok) {
    const err = await r.json().catch(() => ({}));
    throw Object.assign(new Error(err.error || `http_${r.status}`), { status: r.status, body: err });
  }
  return r.status === 204 ? null : await r.json();
}

const MODE_META = {
  "booth-vendor": {
    label: "主辦方裝潢",
    icon: "shield",
    accent: "#0071e3",
    desc: "由主辦方指定的官方裝潢廠商統一負責，標準規格、省心省時。",
    benefits: [
      "標準展位裝潢配置（含背板、桌椅、照明）",
      "由主辦方統一施工，無須對接裝潢商",
      "適合預算有限或第一次參展的廠商",
    ],
  },
  "self": {
    label: "自行裝潢",
    icon: "sparkles",
    accent: "#bf5af2",
    desc: "您可自行邀請裝潢廠商，自由設計展位風格與動線。",
    benefits: [
      "客製化設計，展現品牌特色",
      "可邀請合作多年的裝潢廠商",
      "需自行協調進場時段與消防、保險等規定",
    ],
  },
};

export default function DecorationSetup({ vendor: vendorProp, event }) {
  const { vendorId } = useParams();
  const [vendor, setVendor] = useState(vendorProp);
  const [invitation, setInvitation] = useState(null);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);

  // 拿取目前邀請（若已有）
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const inv = await api("GET", "/portal/vendor/decorator-invitation");
        if (alive) setInvitation(inv);
      } catch (err) {
        if (err.status !== 404) console.warn("load invitation failed", err);
      }
    })();
    return () => { alive = false; };
  }, []);

  async function setMode(mode) {
    if (vendor?.decorationMode === mode) return;
    setSaving(true);
    try {
      const updated = await api("PATCH", "/portal/vendor/decoration-mode", { mode });
      setVendor((v) => ({ ...v, ...updated }));
      window.dispatchEvent(new Event("vendor-refetch"));
      toast.success(mode === "self" ? "已切換為自行裝潢" : "已選擇主辦方裝潢");
    } catch (err) {
      toast.error(`儲存失敗：${err.message}`);
    } finally {
      setSaving(false);
    }
  }

  async function generateInvitation() {
    setGenerating(true);
    try {
      const inv = await api("POST", "/portal/vendor/decorator-invitation");
      setInvitation(inv);
      toast.success("邀請連結已產生");
    } catch (err) {
      toast.error(`產生失敗：${err.message}`);
    } finally {
      setGenerating(false);
    }
  }

  const mode = vendor?.decorationMode || null;
  const base = `/portal/vendor/${vendorId}`;
  const inviteUrl = invitation
    ? `${window.location.origin}${window.location.pathname}#/decor-invite/${invitation.token}`
    : null;

  return (
    <>
      <div className="mb-6">
        <Link
          to={`${base}/booth`}
          className="text-[13px] font-display no-underline inline-flex items-center gap-1"
          style={{ color: "var(--text-tertiary)" }}
        >
          <Icon name="arrow_left" className="icon w-3 h-3" />
          返回攤位贊助
        </Link>
      </div>

      <SceneHead
        tag="DECORATION"
        title="裝潢方案"
        desc="選擇裝潢方式並管理裝潢商邀請"
      />

      {/* 選擇模式 — 兩張並排卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
        {Object.entries(MODE_META).map(([key, m]) => {
          const selected = mode === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setMode(key)}
              disabled={saving}
              className="rounded-2xl p-6 text-left transition-all"
              style={{
                background: "var(--bg-elevated)",
                border: selected ? `2px solid ${m.accent}` : "1px solid var(--separator)",
                boxShadow: selected ? `0 8px 24px ${m.accent}25` : "0 1px 3px rgba(0,0,0,0.04)",
                cursor: saving ? "not-allowed" : "pointer",
                opacity: saving ? 0.7 : 1,
              }}
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-12 h-12 rounded-full grid place-items-center flex-shrink-0"
                  style={{ background: `${m.accent}15`, color: m.accent }}
                >
                  <Icon name={m.icon} className="icon w-6 h-6" />
                  <style>{`.grid .icon { stroke: currentColor; }`}</style>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-[17px] font-bold tracking-tight">{m.label}</h3>
                    {selected && (
                      <span
                        className="text-[10px] font-display px-2 py-0.5 rounded-pill"
                        style={{ background: m.accent, color: "white" }}
                      >
                        已選擇
                      </span>
                    )}
                  </div>
                  <p className="text-[13px] leading-relaxed mb-3" style={{ color: "var(--text-secondary)" }}>
                    {m.desc}
                  </p>
                  <ul className="text-[12px] space-y-1" style={{ color: "var(--text-secondary)" }}>
                    {m.benefits.map((b, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span style={{ color: m.accent }}>✓</span>
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* 主辦方裝潢確認 */}
      {mode === "booth-vendor" && (
        <Panel title="已選擇：主辦方裝潢">
          <div className="flex items-center gap-3 p-4 rounded-xl" style={{ background: "rgba(0,113,227,0.08)" }}>
            <Icon name="check_circle" className="icon w-6 h-6" style={{ color: "#0071e3" }} />
            <div className="flex-1 text-[13px]" style={{ color: "var(--text-secondary)" }}>
              主辦方將安排官方裝潢廠商為您施作展位裝潢。後續主辦方會主動聯繫確認進場時段與細節。
            </div>
          </div>
        </Panel>
      )}

      {/* 自行裝潢：邀請裝潢商 */}
      {mode === "self" && (
        <Panel title="邀請裝潢商">
          <p className="text-[13px] mb-4" style={{ color: "var(--text-secondary)" }}>
            產生邀請連結後分享給您的合作裝潢商。裝潢商透過連結登入後即可進入裝潢專案進行設計稿上傳與管理。
          </p>

          {!invitation ? (
            <button
              type="button"
              onClick={generateInvitation}
              disabled={generating}
              className="px-5 py-2.5 rounded-xl text-white font-medium text-[13px]"
              style={{
                background: "linear-gradient(135deg, #bf5af2, #5e5ce6)",
                opacity: generating ? 0.6 : 1,
                cursor: generating ? "not-allowed" : "pointer",
              }}
            >
              {generating ? "產生中…" : "+ 產生邀請連結"}
            </button>
          ) : (
            <div className="space-y-3">
              <div
                className="p-4 rounded-xl flex items-center gap-3"
                style={{ background: "var(--bg-tinted)", border: "1px solid var(--separator)" }}
              >
                <div
                  className="w-9 h-9 rounded-lg grid place-items-center flex-shrink-0"
                  style={{ background: "rgba(191,90,242,0.15)", color: "#bf5af2" }}
                >
                  <Icon name="link" className="icon w-5 h-5" />
                  <style>{`.panel .grid .icon { stroke: currentColor; }`}</style>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-display uppercase tracking-wider mb-0.5" style={{ color: "var(--text-tertiary)" }}>
                    邀請連結
                  </div>
                  <div className="text-[12px] font-display break-all">{inviteUrl}</div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(inviteUrl);
                    toast.success("已複製連結");
                  }}
                  className="px-3 py-1.5 rounded-lg text-[12px] font-medium"
                  style={{ background: "white", color: "#5e5ce6", border: "1px solid var(--separator)" }}
                >
                  複製
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 text-[13px]">
                <Info
                  label="狀態"
                  value={
                    invitation.status === "accepted"
                      ? "已接受"
                      : invitation.status === "declined"
                        ? "已拒絕"
                        : "等待裝潢商接受"
                  }
                />
                <Info
                  label="有效期限"
                  value={invitation.expiresAt ? new Date(invitation.expiresAt).toLocaleDateString("zh-TW") : "—"}
                />
              </div>

              <button
                type="button"
                onClick={generateInvitation}
                disabled={generating}
                className="text-[12px] font-display"
                style={{ background: "transparent", border: 0, padding: 0, color: "var(--text-tertiary)", cursor: "pointer" }}
              >
                {generating ? "重新產生中…" : "重新產生邀請連結 →"}
              </button>
            </div>
          )}
        </Panel>
      )}
    </>
  );
}

function Info({ label, value }) {
  return (
    <div>
      <div
        className="text-[11px] font-display uppercase tracking-wider mb-1"
        style={{ color: "var(--text-tertiary)" }}
      >
        {label}
      </div>
      <div className="text-[14px] font-medium">{value}</div>
    </div>
  );
}
