import { useEffect, useState } from "react";
import { Navigate, useParams, Routes, Route, useNavigate, Link } from "react-router-dom";
import { vendorApi, clearVendorToken, getVendorToken, derivePackageTypes } from "../../lib/vendorAuth";
import { PortalLayout } from "../../components/PortalLayout";
import { Icon } from "../../components/Icon";
import { toast } from "../../store/toast";

import SelectSponsorship from "./onboarding/SelectSponsorship";
import VendorDashboard from "./VendorDashboard";
import BoothHub from "./booth/BoothHub";
import DecorationSetup from "./booth/DecorationSetup";
import DocumentsConfirm from "./booth/DocumentsConfirm";
import TalkDashboard from "./talk/TalkDashboard";
import AdDashboard from "./ad/AdDashboard";

// 側邊選單（僅出現在功能子頁，不在 Dashboard）
//
// 永遠顯示：儀表板 / 贊助方案 / 公司檔案
// booth → 攤位贊助(hub) / 裝潢方案 / 文件確認
// talk  → 演講贊助
// ad    → 廣告贊助
function buildMenu(base, packageTypes) {
  const items = [];
  const has = (t) => packageTypes.includes(t);

  items.push({ to: base,                         label: "儀表板",   icon: "activity",  end: true });
  items.push({ to: `${base}/onboarding/select`,  label: "贊助方案", icon: "clipboard" });

  if (has("booth")) {
    items.push({ to: `${base}/booth`,            label: "攤位贊助", icon: "building", end: true });
    items.push({ to: `${base}/booth/decoration`, label: "裝潢方案", icon: "sparkles" });
    items.push({ to: `${base}/booth/documents`,  label: "文件確認", icon: "clipboard" });
  }
  if (has("talk")) {
    items.push({ to: `${base}/talk`, label: "演講贊助", icon: "sparkles" });
  }
  if (has("ad")) {
    items.push({ to: `${base}/ad`, label: "廣告贊助", icon: "layers" });
  }

  return items;
}

export default function VendorPortal() {
  const { vendorId } = useParams();
  const [vendor, setVendor] = useState(null);
  const [event, setEvent] = useState(null);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(false);

  useEffect(() => {
    let alive = true;
    if (!getVendorToken()) {
      setAuthError(true);
      setLoading(false);
      return;
    }
    async function load(initial = false) {
      try {
        const [{ vendor: v, event: ev }, pkgs] = await Promise.all([
          vendorApi.me(),
          vendorApi.listPackages(),
        ]);
        if (!alive) return;
        if (v.id !== vendorId) {
          clearVendorToken();
          setAuthError(true);
          return;
        }
        setVendor(v);
        setEvent(ev);
        setPackages(pkgs);
      } catch (err) {
        if (err.status === 401 || err.status === 403) {
          clearVendorToken();
          setAuthError(true);
        } else if (initial) {
          toast.error(`載入失敗：${err.message}`);
        }
      } finally {
        if (alive && initial) setLoading(false);
      }
    }
    load(true);
    // 監聽 vendor 資料變動事件（子頁面操作完成後 dispatch）
    const refetchHandler = () => load(false);
    window.addEventListener("vendor-refetch", refetchHandler);
    return () => {
      alive = false;
      window.removeEventListener("vendor-refetch", refetchHandler);
    };
  }, [vendorId]);

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center" style={{ background: "var(--bg)" }}>
        <div className="text-[13px] font-display" style={{ color: "var(--text-tertiary)" }}>載入中…</div>
      </div>
    );
  }

  if (authError || !vendor) {
    return <Navigate to="/portal/vendor-login" replace />;
  }

  const base = `/portal/vendor/${vendorId}`;

  // ── 路由分流邏輯 ──
  // - 未選方案 → /onboarding/select（強制）
  // - 已選方案 → 進入儀表板（不論審核狀態）；審核狀態以 banner 顯示
  // - 已通過 → 解鎖全部子分區
  const hasPackages = (vendor.sponsorshipPackageIds || []).length > 0;

  return (
    <Routes>
      <Route path="onboarding/select" element={<SelectSponsorship />} />
      <Route index element={
        !hasPackages
          ? <Navigate to={`${base}/onboarding/select`} replace />
          : <DashboardStandalone vendor={vendor} event={event} packages={packages} />
      } />
      <Route path="*" element={
        !hasPackages
          ? <Navigate to={`${base}/onboarding/select`} replace />
          : <VendorWorkspace vendor={vendor} event={event} packages={packages} base={base} />
      } />
    </Routes>
  );
}

// 儀表板獨立全寬頁（無 side-bar）
function DashboardStandalone({ vendor, event, packages }) {
  const navigate = useNavigate();
  function logout() {
    clearVendorToken();
    navigate("/portal/vendor-login");
  }
  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
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
              style={{ background: "linear-gradient(135deg, #bf5af2, #5e5ce6)" }}
            >
              <Icon name="building" />
              <style>{`header > div .grid .icon { stroke: white; }`}</style>
            </div>
            <div>
              <div className="font-display font-bold text-[15px]">{vendor.company}</div>
              <div className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>
                {event?.name || "參展廠商後台"}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[13px] font-display" style={{ color: "var(--text-secondary)" }}>
              {vendor.contact || vendor.company}
            </span>
            <button
              type="button"
              onClick={logout}
              className="text-[12px] font-display px-3 py-1.5 rounded-lg"
              style={{ background: "var(--bg-tinted)", color: "var(--text-secondary)", border: 0, cursor: "pointer" }}
            >
              離開後台
            </button>
          </div>
        </div>
      </header>
      <div className="max-w-[1280px] mx-auto px-8 py-10">
        <VendorDashboard vendor={vendor} event={event} packages={packages} />
      </div>
    </div>
  );
}

function VendorWorkspace({ vendor, event, packages, base }) {
  const packageTypes = derivePackageTypes(vendor.sponsorshipPackageIds || [], packages);
  const menu = buildMenu(base, packageTypes);

  return (
    <PortalLayout
      brand={{ name: vendor.company, subtitle: event?.name || "參展廠商", role: "vendor" }}
      user={{ name: vendor.contact || vendor.company, title: "參展聯絡人", company: vendor.company }}
      menu={menu}
      basePath={base}
    >
      <Routes>
        {packageTypes.includes("booth") && <>
          {/* 攤位贊助 hub + 子頁（已重寫成 vendor token 模式） */}
          <Route path="booth" element={<BoothHub vendor={vendor} event={event} />} />
          <Route path="booth/decoration" element={<DecorationSetup vendor={vendor} event={event} />} />
          <Route path="booth/documents" element={<DocumentsConfirm vendor={vendor} event={event} />} />
          {/* TODO 待重寫成 vendor token 的舊頁面（暫不掛載）：
              VendorBooth / VendorNotices / VendorForms / VendorEquipment / VendorSubmissions / VendorDecoration */}
        </>}
        {packageTypes.includes("talk") && (
          <Route path="talk" element={<TalkDashboard vendor={vendor} event={event} />} />
        )}
        {packageTypes.includes("ad") && (
          <Route path="ad" element={<AdDashboard vendor={vendor} event={event} />} />
        )}
        <Route path="*" element={<Navigate to={base} replace />} />
      </Routes>
    </PortalLayout>
  );
}
