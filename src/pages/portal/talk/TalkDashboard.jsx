import { SceneHead, Panel } from "../../../components/Scene";
import { Icon } from "../../../components/Icon";

// 演講贊助管理（最小骨架）— 後續迭代補講者資料 + 簡報上傳
export default function TalkDashboard({ vendor, event }) {
  return (
    <>
      <SceneHead
        tag="TALK SPONSORSHIP"
        title="演講管理"
        desc={event ? `${event.name} · 30 分鐘專題演講` : "演講贊助專區"}
      />

      <div
        className="rounded-2xl p-8 text-center"
        style={{
          background: "linear-gradient(135deg, rgba(94,92,230,0.08), rgba(191,90,242,0.08))",
          border: "1px dashed rgba(94,92,230,0.3)",
        }}
      >
        <div
          className="w-14 h-14 rounded-full grid place-items-center mx-auto mb-4"
          style={{ background: "rgba(94,92,230,0.15)", color: "#5e5ce6" }}
        >
          <Icon name="sparkles" className="icon w-7 h-7" />
          <style>{`.grid .icon { stroke: currentColor; }`}</style>
        </div>
        <h3 className="text-[18px] font-bold mb-2">演講管理功能準備中</h3>
        <p className="text-[13px] max-w-md mx-auto" style={{ color: "var(--text-secondary)" }}>
          下一輪將開放講者資料設定、簡報檔案上傳、官網講者頁同步等功能。<br />
          已記錄您的演講贊助方案，主辦方會主動與您聯繫安排時段。
        </p>
      </div>

      <Panel title="目前資訊" className="mt-6">
        <div className="grid grid-cols-2 gap-4 text-[13px]">
          <Info label="公司" value={vendor.company} />
          <Info label="聯絡人" value={vendor.contact || "—"} />
          <Info label="Email" value={vendor.email} />
          <Info label="電話" value={vendor.phone || "—"} />
        </div>
      </Panel>
    </>
  );
}

function Info({ label, value }) {
  return (
    <div>
      <div className="text-[11px] font-display uppercase tracking-wider mb-1" style={{ color: "var(--text-tertiary)" }}>
        {label}
      </div>
      <div className="text-[14px] font-medium">{value}</div>
    </div>
  );
}
