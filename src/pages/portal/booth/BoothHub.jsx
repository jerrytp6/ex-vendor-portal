import { useNavigate, useParams } from "react-router-dom";
import { SceneHead } from "../../../components/Scene";
import { Icon } from "../../../components/Icon";

// 攤位贊助 hub：目前 2 張完整卡片
// 大會公告 / 表單簽署 待重寫成 vendor token 模式後再加入
const CARDS = [
  {
    key: "decoration",
    title: "裝潢方案",
    icon: "sparkles",
    accent: "#ff6a00",
    desc: "選擇主辦方裝潢或自行裝潢，自行裝潢可邀請裝潢商加入。",
    path: "/booth/decoration",
  },
  {
    key: "documents",
    title: "展覽文件確認",
    icon: "clipboard",
    accent: "#5e5ce6",
    desc: "確認展覽相關文件並回覆。",
    path: "/booth/documents",
  },
];

export default function BoothHub({ vendor, event }) {
  const navigate = useNavigate();
  const { vendorId } = useParams();
  const base = `/portal/vendor/${vendorId}`;

  return (
    <>
      <SceneHead
        tag="BOOTH SPONSORSHIP"
        title="攤位贊助管理"
        desc={event ? `${event.name} · 攤位相關事項` : "攤位贊助專區"}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {CARDS.map((c) => (
          <button
            key={c.key}
            type="button"
            onClick={() => navigate(`${base}${c.path}`)}
            className="rounded-2xl p-6 text-left transition-all hover:shadow-md"
            style={{
              background: "var(--bg-elevated)",
              border: "1px solid var(--separator)",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
              cursor: "pointer",
            }}
          >
            <div className="flex items-start gap-4">
              <div
                className="w-12 h-12 rounded-full grid place-items-center flex-shrink-0"
                style={{ background: `${c.accent}15`, color: c.accent }}
              >
                <Icon name={c.icon} className="icon w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-[17px] font-bold tracking-tight mb-1">{c.title}</h3>
                <p className="text-[13px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                  {c.desc}
                </p>
                <div
                  className="text-[13px] font-display font-medium mt-3"
                  style={{ color: c.accent }}
                >
                  進入 →
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </>
  );
}
