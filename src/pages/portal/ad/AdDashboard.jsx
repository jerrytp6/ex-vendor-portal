import { SceneHead, Panel } from "../../../components/Scene";
import { Icon } from "../../../components/Icon";

// 廣告贊助管理（最小骨架）— 後續迭代補素材上傳 + 版位選擇
export default function AdDashboard({ vendor, event }) {
  return (
    <>
      <SceneHead
        tag="AD SPONSORSHIP"
        title="廣告管理"
        desc={event ? `${event.name} · 官網 banner / EDM / 社群曝光` : "廣告贊助專區"}
      />

      <div
        className="rounded-2xl p-8 text-center"
        style={{
          background: "linear-gradient(135deg, rgba(191,90,242,0.08), rgba(255,159,10,0.08))",
          border: "1px dashed rgba(191,90,242,0.3)",
        }}
      >
        <div
          className="w-14 h-14 rounded-full grid place-items-center mx-auto mb-4"
          style={{ background: "rgba(191,90,242,0.15)", color: "#bf5af2" }}
        >
          <Icon name="layers" className="icon w-7 h-7" />
          <style>{`.grid .icon { stroke: currentColor; }`}</style>
        </div>
        <h3 className="text-[18px] font-bold mb-2">廣告管理功能準備中</h3>
        <p className="text-[13px] max-w-md mx-auto" style={{ color: "var(--text-secondary)" }}>
          下一輪將開放素材上傳、版位選擇（官網首頁 banner / EDM / 社群貼文）、排程預覽等功能。<br />
          已記錄您的廣告贊助方案，主辦方會主動與您聯繫確認素材規格。
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
