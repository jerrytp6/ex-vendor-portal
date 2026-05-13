import { Icon } from "../../../../components/Icon";
import { getMeta, DETAILS, fmtTWD } from "../../../../constants/sponsorshipMeta";

// 點卡片「了解更多」後切換的詳情頁（取代原本的 modal）
export default function PackageDetailView({ pkg, checked, onBack, onToggle }) {
  const meta = getMeta(pkg.type);
  const detail = DETAILS[pkg.type] || {};

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: "var(--bg-elevated)",
        border: "1px solid var(--separator)",
        boxShadow: "0 4px 16px rgba(0,0,0,0.04)",
      }}
    >
      <div className="px-6 pt-5 pb-2 flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 text-[13px] font-display"
          style={{ color: "var(--text-secondary)", background: "transparent", border: 0, padding: 0, cursor: "pointer" }}
        >
          <Icon name="arrow_left" className="icon w-4 h-4" />
          <style>{`button .icon { stroke: currentColor; }`}</style>
          返回方案列表
        </button>
        <span className="text-[11px] font-display uppercase tracking-widest" style={{ color: meta.accent }}>
          方案詳情
        </span>
      </div>

      <div className="px-8 py-6">
        <div className="flex items-start gap-4 mb-5">
          <div
            className="w-14 h-14 rounded-full grid place-items-center flex-shrink-0"
            style={{ background: `${meta.accent}15`, color: meta.accent }}
          >
            <Icon name={meta.icon} className="icon w-7 h-7" />
            <style>{`.grid .icon { stroke: currentColor; }`}</style>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-[22px] font-bold tracking-tight">{pkg.name}</h3>
            <div className="text-[26px] font-bold mt-1" style={{ color: meta.accent }}>
              {fmtTWD(pkg.price)}
            </div>
          </div>
        </div>

        <p className="text-[14px] leading-relaxed mb-6" style={{ color: "var(--text-secondary)" }}>
          {detail.intro || pkg.description}
        </p>

        <DetailSection title="包含項目" accent={meta.accent}>
          <ul className="space-y-2 text-[13px]" style={{ color: "var(--text-secondary)" }}>
            {(pkg.benefits || []).map((b, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="mt-0.5" style={{ color: meta.accent }}>✓</span>
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </DetailSection>

        {detail.spec?.length > 0 && (
          <DetailSection title="規格詳情" accent={meta.accent}>
            <div className="grid grid-cols-2 gap-3">
              {detail.spec.map((s, i) => (
                <div key={i} className="text-[13px]">
                  <div className="text-[11px] font-display uppercase tracking-wider mb-0.5"
                    style={{ color: "var(--text-tertiary)" }}>
                    {s.k}
                  </div>
                  <div>{s.v}</div>
                </div>
              ))}
            </div>
          </DetailSection>
        )}

        {detail.audience?.length > 0 && (
          <DetailSection title="適合對象" accent={meta.accent}>
            <div className="flex flex-wrap gap-2">
              {detail.audience.map((a, i) => (
                <span key={i} className="px-3 py-1 rounded-pill text-[12px] font-display"
                  style={{ background: `${meta.accent}10`, color: meta.accent }}>
                  {a}
                </span>
              ))}
            </div>
          </DetailSection>
        )}

        {detail.notes?.length > 0 && (
          <DetailSection title="注意事項" accent={meta.accent}>
            <ul className="space-y-1.5 text-[13px]" style={{ color: "var(--text-secondary)" }}>
              {detail.notes.map((n, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-1 w-1 h-1 rounded-full flex-shrink-0" style={{ background: "var(--text-tertiary)" }} />
                  <span>{n}</span>
                </li>
              ))}
            </ul>
          </DetailSection>
        )}

        <div className="flex gap-3 mt-8 pt-6" style={{ borderTop: "1px solid var(--separator)" }}>
          <button
            type="button"
            onClick={onBack}
            className="px-5 py-2.5 rounded-xl text-[13px] font-medium"
            style={{ background: "var(--bg-tinted)", color: "var(--text-secondary)" }}
          >
            返回列表
          </button>
          <button
            type="button"
            onClick={onToggle}
            className="flex-1 py-2.5 rounded-xl text-white font-medium text-[13px]"
            style={{ background: checked ? "#8e8e93" : meta.accent }}
          >
            {checked ? "取消選擇此方案" : "選擇此方案"}
          </button>
        </div>
      </div>
    </div>
  );
}

function DetailSection({ title, accent, children }) {
  return (
    <div className="mb-5">
      <div
        className="text-[11px] font-display font-semibold uppercase tracking-widest mb-2"
        style={{ color: accent }}
      >
        {title}
      </div>
      {children}
    </div>
  );
}
