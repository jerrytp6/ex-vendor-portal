import { useMemo } from "react";
import { Link } from "react-router-dom";
import { SceneHead, Panel } from "../../components/Scene";
import { Icon } from "../../components/Icon";
import { derivePackageTypes } from "../../lib/vendorAuth";
import { PAYMENT_STATUS } from "../../constants/paymentStatus";

const WAITING_META = {
  label: "等待主辦方審核",
  desc: "您的贊助方案已送出。主辦方專員將透過 email 或電話與您聯絡，確認付款方式與後續流程。",
  accent: "#0071e3",
  bg: "rgba(0,113,227,0.08)",
  border: "rgba(0,113,227,0.3)",
  icon: "activity",
};

const STATUS_META = {
  [PAYMENT_STATUS.NOT_STARTED]: WAITING_META,
  [PAYMENT_STATUS.SUBMITTED]:   WAITING_META,
  [PAYMENT_STATUS.APPROVED]: {
    label: "方案已通過",
    desc: "全部後台功能已開通，可開始管理您的參展內容。",
    accent: "#1f8a3a",
    bg: "rgba(48,209,88,0.08)",
    border: "rgba(48,209,88,0.3)",
    icon: "check",
  },
  [PAYMENT_STATUS.REJECTED]: {
    label: "已退件",
    desc: "您的方案被退件，請參考退件原因後重新選擇或聯繫主辦方。",
    accent: "#c5180c",
    bg: "rgba(255,69,58,0.08)",
    border: "rgba(255,69,58,0.3)",
    icon: "x_close",
  },
};

function fmt(n) {
  return n == null ? "—" : `NT$ ${Number(n).toLocaleString("zh-TW")}`;
}

const PKG_TYPE_COLOR = {
  booth: "#0071e3",
  talk: "#5e5ce6",
  ad: "#bf5af2",
};

export default function VendorDashboard({ vendor, event, packages = [] }) {
  const status = vendor.paymentStatus || PAYMENT_STATUS.NOT_STARTED;
  const meta = STATUS_META[status] || STATUS_META[PAYMENT_STATUS.NOT_STARTED];
  const approved = status === PAYMENT_STATUS.APPROVED;
  const canChange = !approved;
  const base = `/portal/vendor/${vendor.id}`;

  const selectedPackages = useMemo(
    () => packages.filter((p) => (vendor.sponsorshipPackageIds || []).includes(p.id)),
    [packages, vendor.sponsorshipPackageIds]
  );
  const total = selectedPackages.reduce((s, p) => s + Number(p.price), 0);
  const packageTypes = useMemo(
    () => derivePackageTypes(vendor.sponsorshipPackageIds || [], packages),
    [packages, vendor.sponsorshipPackageIds]
  );

  const daysUntil = event
    ? Math.ceil((new Date(event.startDate) - new Date()) / (1000 * 60 * 60 * 24))
    : 0;

  // 功能卡片定義
  const cards = [
    {
      key: "sponsorship",
      title: "贊助方案",
      icon: "clipboard",
      accent: "#0071e3",
      desc: selectedPackages.length > 0 ? (
        <>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {selectedPackages.map((p) => (
              <span
                key={p.id}
                className="text-[11px] font-display font-medium px-2 py-0.5 rounded-pill"
                style={{
                  background: `${PKG_TYPE_COLOR[p.type] || "#0071e3"}15`,
                  color: PKG_TYPE_COLOR[p.type] || "#0071e3",
                }}
              >
                {p.name}
              </span>
            ))}
          </div>
          <div className="text-[12px] font-display" style={{ color: "var(--text-tertiary)" }}>
            應付總額 <strong style={{ color: "var(--text-primary)" }}>{fmt(total)}</strong>
          </div>
        </>
      ) : "尚未選擇方案",
      href: `${base}/onboarding/select`,
      locked: false,                                  // 永遠可用
      actionText: null,                               // 不顯示底部連結 — 變更方案統一走上方 banner
      show: true,
    },
    {
      key: "booth-sponsor",
      title: "攤位贊助",
      icon: "building",
      accent: "#0071e3",
      desc: vendor.boothNumber
        ? `展位 ${vendor.boothNumber} · 裝潢 / 表單 / 設備管理`
        : "展位資訊 · 裝潢方案 · 表單 · 設備申請",
      href: `${base}/booth`,
      locked: !approved,
      show: packageTypes.includes("booth"),
    },
    {
      key: "talk-sponsor",
      title: "演講贊助",
      icon: "sparkles",
      accent: "#5e5ce6",
      desc: "30 分鐘專題演講 · 講者資料 · 簡報上傳",
      href: `${base}/talk`,
      locked: !approved,
      show: packageTypes.includes("talk"),
    },
    {
      key: "ad-sponsor",
      title: "廣告贊助",
      icon: "layers",
      accent: "#bf5af2",
      desc: "Banner · EDM · 社群曝光",
      href: `${base}/ad`,
      locked: !approved,
      show: packageTypes.includes("ad"),
    },
  ].filter((c) => c.show);

  return (
    <>
      <SceneHead
        tag="VENDOR DASHBOARD"
        title={`歡迎，${vendor.contact || vendor.company}`}
        desc={event ? `${event.name} · 距離開展還有 ${Math.max(daysUntil, 0)} 天` : "參展廠商後台"}
      />

      {/* 審核狀態 banner */}
      <div
        className="rounded-2xl p-6 mb-6 flex items-start gap-5"
        style={{ background: meta.bg, border: `1px solid ${meta.border}` }}
      >
        <div
          className="w-14 h-14 rounded-full grid place-items-center flex-shrink-0"
          style={{ background: meta.accent, color: "white" }}
        >
          <Icon name={meta.icon} className="icon w-7 h-7" />
          <style>{`.grid .icon { stroke: white; }`}</style>
        </div>
        <div className="flex-1 min-w-0">
          <div
            className="text-[11px] font-display uppercase tracking-widest mb-1"
            style={{ color: meta.accent }}
          >
            審核狀態
          </div>
          <h3 className="text-[20px] font-bold tracking-tight mb-1" style={{ color: meta.accent }}>
            {meta.label}
          </h3>
          <p className="text-[14px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            {meta.desc}
          </p>
          {status === PAYMENT_STATUS.REJECTED && vendor.paymentRejectReason && (
            <div
              className="mt-3 text-[13px] p-3 rounded-lg"
              style={{ background: "rgba(255,255,255,0.6)" }}
            >
              <strong>退件原因：</strong>
              {vendor.paymentRejectReason}
            </div>
          )}
          {canChange && (
            <div className="flex flex-wrap gap-2 mt-4">
              <Link
                to={`${base}/onboarding/select`}
                className="px-4 py-2 rounded-lg text-[13px] font-medium no-underline"
                style={{
                  background: "white",
                  color: meta.accent,
                  border: `1px solid ${meta.border}`,
                }}
              >
                {status === PAYMENT_STATUS.REJECTED ? "重新選擇方案 →" : "變更方案 →"}
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* 功能卡片 grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {cards.map(({ key, show: _show, ...rest }) => (
          <FeatureCard key={key} {...rest} />
        ))}
      </div>

      {/* 底部：展覽資訊 + 廠商資料 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Panel title="展覽資訊">
          {event ? (
            <dl className="space-y-3 text-[14px]">
              {[
                ["活動名稱", event.name],
                ["類型", event.type],
                [
                  "日期",
                  event.startDate
                    ? `${String(event.startDate).slice(0, 10)}${
                        event.endDate && event.endDate !== event.startDate
                          ? ` – ${String(event.endDate).slice(0, 10)}`
                          : ""
                      }`
                    : "—",
                ],
                ["地點", event.location],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3">
                  <dt style={{ color: "var(--text-tertiary)" }}>{k}</dt>
                  <dd className="font-medium text-right">{v || "—"}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <div className="text-[13px]" style={{ color: "var(--text-tertiary)" }}>
              找不到活動資料
            </div>
          )}
        </Panel>

        <Panel title="廠商資料">
          <div className="grid grid-cols-2 gap-3 text-[13px]">
            <Info label="公司" value={vendor.company} />
            <Info label="統編" value={vendor.taxId} />
            <Info label="聯絡人" value={vendor.contact} />
            <Info label="Email" value={vendor.email} />
            <Info label="電話" value={vendor.phone} />
          </div>
        </Panel>
      </div>
    </>
  );
}

function FeatureCard({ title, icon, accent, desc, href, locked, actionText = "進入 →" }) {
  const inner = (
    <>
      <div className="flex items-start justify-between mb-3">
        <div
          className="w-11 h-11 rounded-full grid place-items-center flex-shrink-0"
          style={{ background: `${accent}15`, color: accent }}
        >
          <Icon name={icon} className="icon w-5 h-5" />
          <style>{`.grid .icon { stroke: currentColor; }`}</style>
        </div>
        {locked && (
          <span
            className="text-[11px] font-display px-2 py-1 rounded-pill flex items-center gap-1"
            style={{ background: "rgba(0,0,0,0.06)", color: "var(--text-tertiary)" }}
          >
            🔒 等待審核
          </span>
        )}
      </div>
      <h4 className="text-[16px] font-bold tracking-tight mb-2">{title}</h4>
      <div className="text-[13px] mb-4 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
        {desc}
      </div>
      {(locked || actionText) && (
        <div
          className="text-[13px] font-display font-medium"
          style={{ color: locked ? "var(--text-tertiary)" : accent }}
        >
          {locked ? "完成審核後解鎖" : actionText}
        </div>
      )}
    </>
  );

  const baseClass = "rounded-2xl p-5 transition-all";
  const baseStyle = {
    background: "var(--bg-elevated)",
    border: "1px solid var(--separator)",
    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
  };

  if (locked) {
    return (
      <div className={baseClass} style={{ ...baseStyle, opacity: 0.65 }}>
        {inner}
      </div>
    );
  }
  return (
    <Link
      to={href}
      className={`${baseClass} block no-underline hover:shadow-md`}
      style={{ ...baseStyle, color: "inherit" }}
    >
      {inner}
    </Link>
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
      <div className="text-[14px] font-medium">{value || "—"}</div>
    </div>
  );
}
