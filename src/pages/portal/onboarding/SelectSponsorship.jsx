import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { vendorApi, clearVendorToken } from "../../../lib/vendorAuth";
import { Icon } from "../../../components/Icon";
import { toast } from "../../../store/toast";

const TYPE_META = {
  booth: { icon: "building", accent: "#0071e3" },
  talk:  { icon: "sparkles", accent: "#5e5ce6" },
  ad:    { icon: "layers",   accent: "#bf5af2" },
};

// 方案詳情（前端硬編，依 type 對應）
const DETAILS = {
  booth: {
    intro: "於活動現場設置實體展攤，與參展者面對面互動，最大化品牌曝光與商機開發。攤位團隊將協助規劃位置、裝潢與動線。",
    spec: [
      { k: "展位面積", v: "9 m²（3m × 3m）" },
      { k: "標配", v: "桌椅、聚光燈、3 個 110V 插座" },
      { k: "活動時數", v: "全展期可進駐（含早鳥布置日）" },
      { k: "海報背板", v: "高 2.5m × 寬 3m，可加購輸出" },
    ],
    audience: ["想推實體產品或服務體驗的廠商", "B2B 客戶開發導向", "希望蒐集潛在客戶名單的品牌"],
    notes: [
      "如需特殊裝潢請於開展前 14 天提交圖樣",
      "可額外加購電力升級（220V / 3-phase）",
      "進駐布置日為展前一日下午 13:00 開放",
    ],
  },
  talk: {
    intro: "於大會主舞台或專題場安排 30 分鐘專題演講，展現專業見解、建立品牌權威形象。本場演講將同步直播並收錄於官方影片庫。",
    spec: [
      { k: "演講長度", v: "30 分鐘（含 5 分鐘 Q&A）" },
      { k: "場地", v: "主舞台（200 人）或專題場（80 人）" },
      { k: "錄影/直播", v: "官方錄影 + Live 串流" },
      { k: "簡報設備", v: "雙螢幕、無線麥克風、後台 Confidence Monitor" },
    ],
    audience: ["想做技術 / 思想領導的公司", "希望提升品牌專業度的服務商", "新產品 / 新技術發表場景"],
    notes: [
      "講者題目與簡介須於展前 30 天確認",
      "簡報檔須於展前 7 天上傳審核",
      "演講可同步發送錄影連結給未到場參與者",
    ],
  },
  ad: {
    intro: "透過多元廣告版位曝光（官網 banner、EDM、社群媒體），強化品牌能見度與市場影響力。版位排程由主辦方統一調度，確保最大觸及。",
    spec: [
      { k: "官網 banner", v: "首頁置頂 1200×300，連續 30 天" },
      { k: "EDM 廣告", v: "活動官方 EDM 露出 2 次（觸及 ~20k 訂閱戶）" },
      { k: "社群貼文", v: "FB / IG 聯合貼文 1 則 + 連結導流" },
      { k: "效果報表", v: "活動結束後提供露出/點擊統計報告" },
    ],
    audience: ["想擴大品牌觸及與新客戶開發", "預算有限但希望多管道曝光", "電商 / B2C 品牌"],
    notes: [
      "素材須於活動前 14 天提供（規格另寄）",
      "EDM 發送時段由主辦方排程",
      "如需設計協助可加購（另計費）",
    ],
  },
};

function fmt(n) {
  return `NT$ ${Number(n).toLocaleString("zh-TW")}`;
}

export default function SelectSponsorship() {
  const { vendorId } = useParams();
  const navigate = useNavigate();
  const [packages, setPackages] = useState([]);
  const [vendor, setVendor] = useState(null);
  const [selected, setSelected] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [detailPkg, setDetailPkg] = useState(null); // 顯示詳情用的 package object

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [{ vendor: v }, pkgs] = await Promise.all([vendorApi.me(), vendorApi.listPackages()]);
        if (!alive) return;
        if (v.id !== vendorId) {
          // token 與 URL 廠商不符
          clearVendorToken();
          navigate("/portal/vendor-login", { replace: true });
          return;
        }
        setVendor(v);
        setPackages(pkgs);
        setSelected(new Set(v.sponsorshipPackageIds || []));
      } catch (err) {
        if (err.status === 401 || err.status === 403) {
          navigate("/portal/vendor-login", { replace: true });
        } else {
          toast.error(`載入失敗：${err.message}`);
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [vendorId, navigate]);

  const total = useMemo(
    () => packages.filter((p) => selected.has(p.id)).reduce((s, p) => s + Number(p.price), 0),
    [packages, selected]
  );

  function toggle(id) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  }

  async function submit() {
    if (selected.size === 0) {
      toast.error("請至少選擇一個贊助方案");
      return;
    }
    setSubmitting(true);
    try {
      await vendorApi.setSponsorship(Array.from(selected));
      toast.success("方案已確認，立即進入後台");
      // 通知父層（VendorPortal）重新抓 vendor / packages 後再導向
      window.dispatchEvent(new Event("vendor-refetch"));
      // 給 state 一點點時間 propagate 再 navigate
      setTimeout(() => navigate(`/portal/vendor/${vendorId}`), 100);
    } catch (err) {
      if (err.status === 409) toast.error("付款已完成，無法變更方案");
      else toast.error(`送出失敗：${err.message}`);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center" style={{ background: "var(--bg)" }}>
        <div className="text-[13px] font-display" style={{ color: "var(--text-tertiary)" }}>載入方案中…</div>
      </div>
    );
  }

  const selectedPackages = packages.filter((p) => selected.has(p.id));

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      {/* Header */}
      <header
        className="sticky top-0 z-20 backdrop-blur"
        style={{
          background: "rgba(245, 245, 247, 0.85)",
          borderBottom: "1px solid var(--separator)",
          WebkitBackdropFilter: "saturate(180%) blur(20px)",
        }}
      >
        <div className="max-w-[1280px] mx-auto px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-[10px] grid place-items-center"
              style={{ background: "linear-gradient(135deg, #0071e3, #5e5ce6)" }}
            >
              <Icon name="building" />
              <style>{`header > div .grid .icon { stroke: white; }`}</style>
            </div>
            <div>
              <div className="font-display font-bold text-[15px]">{vendor?.company}</div>
              <div className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>選擇贊助方案</div>
            </div>
          </div>
          <div className="text-[12px] font-display" style={{ color: "var(--text-tertiary)" }}>
            第 2 步，共 4 步
          </div>
        </div>
      </header>

      <div className="max-w-[1280px] mx-auto px-8 py-10">
        <h1 className="text-3xl font-bold tracking-tight mb-2">選擇您的贊助方案</h1>
        <p className="text-[14px] mb-8" style={{ color: "var(--text-secondary)" }}>
          可同時選擇多項方案。送出後在付款前仍可回來變更。
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 items-start">
          {/* Left：方案卡片或詳情 */}
          {detailPkg ? (
            <PackageDetailView
              pkg={detailPkg}
              checked={selected.has(detailPkg.id)}
              onBack={() => setDetailPkg(null)}
              onToggle={() => { toggle(detailPkg.id); }}
            />
          ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
            {packages.map((p) => {
              const meta = TYPE_META[p.type] || TYPE_META.booth;
              const checked = selected.has(p.id);
              return (
                <div
                  key={p.id}
                  onClick={() => toggle(p.id)}
                  className="relative rounded-2xl p-6 cursor-pointer transition-all flex flex-col h-full"
                  style={{
                    background: "var(--bg-elevated)",
                    border: checked
                      ? `2px solid ${meta.accent}`
                      : "1px solid var(--separator)",
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
                  <h3 className="text-[18px] font-bold tracking-tight mb-1">{p.name}</h3>
                  <div className="text-[22px] font-bold mb-3" style={{ color: meta.accent }}>
                    {fmt(p.price)}
                  </div>
                  <p className="text-[13px] leading-relaxed mb-4" style={{ color: "var(--text-secondary)" }}>
                    {p.description}
                  </p>
                  <ul className="text-[12px] mb-5 space-y-1.5" style={{ color: "var(--text-secondary)" }}>
                    {(p.benefits || []).map((b, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span style={{ color: meta.accent }}>✓</span>
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>

                  {/* 更多資訊：打開詳情 Modal */}
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setDetailPkg(p); }}
                    className="text-[12px] font-display mb-4 self-start"
                    style={{ color: meta.accent, background: "transparent", border: 0, padding: 0, cursor: "pointer" }}
                  >
                    了解更多 →
                  </button>

                  {/* 底部按鈕 — mt-auto 讓所有卡片按鈕對齊 */}
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); toggle(p.id); }}
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
            })}
          </div>
          )}

          {/* Right：方案摘要 sticky — 跟卡片頂端對齊（grid items-start），漸層 header + 圖示加強存在感 */}
          <aside className="lg:sticky lg:top-24">
            <div
              className="rounded-2xl overflow-hidden flex flex-col"
              style={{ background: "var(--bg-elevated)", border: "1px solid var(--separator)", boxShadow: "0 4px 16px rgba(0,0,0,0.04)" }}
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
                  <div className="text-[11px] opacity-85">已選 {selectedPackages.length} / {packages.length} 項</div>
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
                      const meta = TYPE_META[p.type] || TYPE_META.booth;
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
                          <span className="text-[13px] font-display font-semibold">{fmt(p.price)}</span>
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
                  <span className="text-[22px] font-bold tracking-tight" style={{ color: "#0071e3" }}>{fmt(total)}</span>
                </div>

                <button
                  onClick={submit}
                  disabled={submitting || selected.size === 0}
                  className="w-full mt-4 py-3 rounded-xl text-white font-medium text-[14px]"
                  style={{
                    background: "linear-gradient(135deg, #0071e3, #5e5ce6)",
                    opacity: submitting || selected.size === 0 ? 0.5 : 1,
                    cursor: submitting || selected.size === 0 ? "not-allowed" : "pointer",
                  }}
                >
                  {submitting ? "儲存中…" : "確認並前往付款"}
                </button>

                <div className="mt-4 text-[11px] font-display text-center" style={{ color: "var(--text-tertiary)" }}>
                  確認後仍可在付款前回來變更
                </div>
              </div>
            </div>
          </aside>
        </div>

        {/* 底部 info 條 — 移到卡片區下方，跨越整個 max-width */}
        <div
          className="mt-8 p-4 rounded-xl flex items-center justify-between"
          style={{ background: "var(--bg-tinted)", border: "1px solid var(--separator)" }}
        >
          <div className="flex items-center gap-3">
            <span
              className="w-6 h-6 rounded-full grid place-items-center text-[12px] font-bold"
              style={{ background: "rgba(0,113,227,0.15)", color: "#0071e3" }}
            >
              ?
            </span>
            <span className="text-[13px] font-display" style={{ color: "var(--text-secondary)" }}>
              不確定哪種方案最適合您？
            </span>
          </div>
          <a
            href="mailto:support@exhibitos.com"
            className="text-[13px] font-medium no-underline"
            style={{ color: "#0071e3" }}
          >
            聯絡客服 →
          </a>
        </div>
      </div>
    </div>
  );
}

function PackageDetailView({ pkg, checked, onBack, onToggle }) {
  const meta = TYPE_META[pkg.type] || TYPE_META.booth;
  const detail = DETAILS[pkg.type] || {};
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: "var(--bg-elevated)", border: "1px solid var(--separator)", boxShadow: "0 4px 16px rgba(0,0,0,0.04)" }}
    >
      {/* 返回 + 標頭 banner */}
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
        {/* 標頭 */}
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
            <div className="text-[26px] font-bold mt-1" style={{ color: meta.accent }}>{fmt(pkg.price)}</div>
          </div>
        </div>

        {/* 介紹 */}
        <p className="text-[14px] leading-relaxed mb-6" style={{ color: "var(--text-secondary)" }}>
          {detail.intro || pkg.description}
        </p>

        {/* 包含項目 */}
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

        {/* 規格 */}
        {detail.spec?.length > 0 && (
          <DetailSection title="規格詳情" accent={meta.accent}>
            <div className="grid grid-cols-2 gap-3">
              {detail.spec.map((s, i) => (
                <div key={i} className="text-[13px]">
                  <div className="text-[11px] font-display uppercase tracking-wider mb-0.5" style={{ color: "var(--text-tertiary)" }}>
                    {s.k}
                  </div>
                  <div>{s.v}</div>
                </div>
              ))}
            </div>
          </DetailSection>
        )}

        {/* 適合對象 */}
        {detail.audience?.length > 0 && (
          <DetailSection title="適合對象" accent={meta.accent}>
            <div className="flex flex-wrap gap-2">
              {detail.audience.map((a, i) => (
                <span
                  key={i}
                  className="px-3 py-1 rounded-pill text-[12px] font-display"
                  style={{ background: `${meta.accent}10`, color: meta.accent }}
                >
                  {a}
                </span>
              ))}
            </div>
          </DetailSection>
        )}

        {/* 注意事項 */}
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

        {/* 底部 action */}
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
