import { Icon } from "../../../../components/Icon";
import { getMeta, fmtTWD } from "../../../../constants/sponsorshipMeta";

// 單張贊助方案卡片
//
// 點卡片本身或底部按鈕 → onToggle
// 點「了解更多 →」→ onDetail
export default function PackageCard({ pkg, checked, onToggle, onDetail }) {
  const meta = getMeta(pkg.type);
  return (
    <div
      onClick={onToggle}
      className="relative rounded-2xl p-6 cursor-pointer transition-all flex flex-col h-full"
      style={{
        background: "var(--bg-elevated)",
        border: checked ? `2px solid ${meta.accent}` : "1px solid var(--separator)",
        boxShadow: checked ? `0 8px 24px ${meta.accent}25` : "0 1px 3px rgba(0,0,0,0.04)",
      }}
    >
      <div
        className="w-12 h-12 rounded-full grid place-items-center mb-4"
        style={{ background: `${meta.accent}15`, color: meta.accent }}
      >
        <Icon name={meta.icon} className="icon w-6 h-6" />
        <style>{`.grid .icon { stroke: currentColor; }`}</style>
      </div>

      <h3 className="text-[18px] font-bold tracking-tight mb-1">{pkg.name}</h3>
      <div className="text-[22px] font-bold mb-3" style={{ color: meta.accent }}>
        {fmtTWD(pkg.price)}
      </div>

      <p className="text-[13px] leading-relaxed mb-4" style={{ color: "var(--text-secondary)" }}>
        {pkg.description}
      </p>

      <ul className="text-[12px] mb-5 space-y-1.5" style={{ color: "var(--text-secondary)" }}>
        {(pkg.benefits || []).map((b, i) => (
          <li key={i} className="flex items-start gap-2">
            <span style={{ color: meta.accent }}>✓</span>
            <span>{b}</span>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onDetail(); }}
        className="text-[12px] font-display mb-4 self-start"
        style={{ color: meta.accent, background: "transparent", border: 0, padding: 0, cursor: "pointer" }}
      >
        了解更多 →
      </button>

      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onToggle(); }}
        className="w-full py-2.5 rounded-xl font-medium text-[13px] transition-all mt-auto"
        style={
          checked
            ? { background: meta.accent, color: "#fff" }
            : { background: "var(--bg-tinted)", color: meta.accent, border: `1px solid ${meta.accent}40` }
        }
      >
        {checked ? "✓ 已選擇" : "選擇方案"}
      </button>
    </div>
  );
}
