import { Icon } from "../../../../components/Icon";
import { getMeta, fmtTWD } from "../../../../constants/sponsorshipMeta";

// 右側 sticky 摘要面板
// - 通過後（isApproved）顯示「返回 Dashboard」綠色 CTA
// - 未通過時顯示「確認並前往付款」藍紫色 CTA
export default function SponsorshipSummary({
  selectedPackages,
  totalCount,
  total,
  isApproved,
  submitting,
  onSubmit,
  onBackToDashboard,
}) {
  return (
    <aside className="lg:sticky lg:top-24">
      <div
        className="rounded-2xl overflow-hidden flex flex-col"
        style={{
          background: "var(--bg-elevated)",
          border: "1px solid var(--separator)",
          boxShadow: "0 4px 16px rgba(0,0,0,0.04)",
        }}
      >
        {/* 漸層 header */}
        <div
          className="px-5 py-4 flex items-center gap-3 text-white"
          style={{ background: "linear-gradient(135deg, #0071e3, #5e5ce6)" }}
        >
          <div
            className="w-9 h-9 rounded-lg grid place-items-center"
            style={{ background: "rgba(255,255,255,0.2)" }}
          >
            <Icon name="clipboard" className="icon w-5 h-5" />
            <style>{`aside .grid .icon { stroke: white; }`}</style>
          </div>
          <div>
            <div className="font-display font-semibold text-[14px]">方案摘要</div>
            <div className="text-[11px] opacity-85">已選 {selectedPackages.length} / {totalCount} 項</div>
          </div>
        </div>

        <div className="p-5">
          {selectedPackages.length === 0 ? (
            <div
              className="rounded-xl py-6 text-center text-[13px]"
              style={{ background: "var(--bg-tinted)", color: "var(--text-tertiary)" }}
            >
              請從左側選擇方案
            </div>
          ) : (
            <div className="space-y-2.5 mb-1">
              {selectedPackages.map((p) => {
                const meta = getMeta(p.type);
                return (
                  <div
                    key={p.id}
                    className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg"
                    style={{ background: `${meta.accent}0d` }}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: meta.accent }} />
                      <span className="text-[13px] truncate">{p.name}</span>
                    </div>
                    <span className="text-[13px] font-display font-semibold">{fmtTWD(p.price)}</span>
                  </div>
                );
              })}
            </div>
          )}

          <div
            className="mt-4 pt-4 flex items-center justify-between"
            style={{ borderTop: "1px solid var(--separator)" }}
          >
            <span className="text-[12px] font-display uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>
              應付總額
            </span>
            <span className="text-[22px] font-bold tracking-tight" style={{ color: "#0071e3" }}>
              {fmtTWD(total)}
            </span>
          </div>

          {isApproved ? (
            <button
              onClick={onBackToDashboard}
              className="w-full mt-4 py-3 rounded-xl text-white font-medium text-[14px]"
              style={{ background: "linear-gradient(135deg, #30d158, #0bb850)", cursor: "pointer" }}
            >
              返回 Dashboard →
            </button>
          ) : (
            <>
              <button
                onClick={onSubmit}
                disabled={submitting || selectedPackages.length === 0}
                className="w-full mt-4 py-3 rounded-xl text-white font-medium text-[14px]"
                style={{
                  background: "linear-gradient(135deg, #0071e3, #5e5ce6)",
                  opacity: submitting || selectedPackages.length === 0 ? 0.5 : 1,
                  cursor: submitting || selectedPackages.length === 0 ? "not-allowed" : "pointer",
                }}
              >
                {submitting ? "儲存中…" : "確認並前往付款"}
              </button>
              <div className="mt-4 text-[11px] font-display text-center" style={{ color: "var(--text-tertiary)" }}>
                確認後仍可在付款前回來變更
              </div>
            </>
          )}
        </div>
      </div>
    </aside>
  );
}
