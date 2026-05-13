import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { vendorApi, clearVendorToken } from "../../../lib/vendorAuth";
import { PAYMENT_STATUS } from "../../../constants/paymentStatus";
import { Icon } from "../../../components/Icon";
import { toast } from "../../../store/toast";

import { usePackageSelection } from "./usePackageSelection";
import PackageCard from "./components/PackageCard";
import PackageDetailView from "./components/PackageDetailView";
import SponsorshipSummary from "./components/SponsorshipSummary";

export default function SelectSponsorship() {
  const { vendorId } = useParams();
  const navigate = useNavigate();
  const [packages, setPackages] = useState([]);
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [detailPkg, setDetailPkg] = useState(null);

  const isApproved = vendor?.paymentStatus === PAYMENT_STATUS.APPROVED;
  const selection = usePackageSelection([], isApproved);

  // 載入 vendor + packages
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [{ vendor: v }, pkgs] = await Promise.all([vendorApi.me(), vendorApi.listPackages()]);
        if (!alive) return;
        if (v.id !== vendorId) {
          clearVendorToken();
          navigate("/portal/vendor-login", { replace: true });
          return;
        }
        setVendor(v);
        setPackages(pkgs);
        selection.reset(v.sponsorshipPackageIds || []);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vendorId, navigate]);

  const selectedPackages = useMemo(
    () => packages.filter((p) => selection.has(p.id)),
    [packages, selection]
  );
  const total = useMemo(
    () => selectedPackages.reduce((s, p) => s + Number(p.price), 0),
    [selectedPackages]
  );

  async function submit() {
    if (selection.size === 0) {
      toast.error("請至少選擇一個贊助方案");
      return;
    }
    setSubmitting(true);
    try {
      await vendorApi.setSponsorship(selection.selectedIds);
      toast.success("方案已確認，立即進入後台");
      await waitForVendorRefetch();
      navigate(`/portal/vendor/${vendorId}`);
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

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <PageHeader companyName={vendor?.company} />

      <div className="max-w-[1280px] mx-auto px-8 py-10">
        <PageTitle isApproved={isApproved} />
        {isApproved && <ApprovedBanner />}

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 items-start">
          {detailPkg ? (
            <PackageDetailView
              pkg={detailPkg}
              checked={selection.has(detailPkg.id)}
              onBack={() => setDetailPkg(null)}
              onToggle={() => selection.toggle(detailPkg.id)}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
              {packages.map((p) => (
                <PackageCard
                  key={p.id}
                  pkg={p}
                  checked={selection.has(p.id)}
                  onToggle={() => selection.toggle(p.id)}
                  onDetail={() => setDetailPkg(p)}
                />
              ))}
            </div>
          )}

          <SponsorshipSummary
            selectedPackages={selectedPackages}
            totalCount={packages.length}
            total={total}
            isApproved={isApproved}
            submitting={submitting}
            onSubmit={submit}
            onBackToDashboard={() => navigate(`/portal/vendor/${vendorId}`)}
          />
        </div>

        <HelpFooter />
      </div>
    </div>
  );
}

// 等父層 VendorPortal refetch 完成（避免 race condition）
function waitForVendorRefetch() {
  return new Promise((resolve) => {
    const done = () => {
      window.removeEventListener("vendor-refetched", done);
      resolve();
    };
    window.addEventListener("vendor-refetched", done);
    window.dispatchEvent(new Event("vendor-refetch"));
    setTimeout(done, 3000); // 保險
  });
}

function PageHeader({ companyName }) {
  return (
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
            <div className="font-display font-bold text-[15px]">{companyName}</div>
            <div className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>選擇贊助方案</div>
          </div>
        </div>
        <div className="text-[12px] font-display" style={{ color: "var(--text-tertiary)" }}>
          第 2 步，共 4 步
        </div>
      </div>
    </header>
  );
}

function PageTitle({ isApproved }) {
  return (
    <>
      <h1 className="text-3xl font-bold tracking-tight mb-2">
        {isApproved ? "您的贊助方案" : "選擇您的贊助方案"}
      </h1>
      <p className="text-[14px] mb-6" style={{ color: "var(--text-secondary)" }}>
        {isApproved
          ? "您的方案已通過確認，目前處於唯讀狀態。如需異動請聯絡客服。"
          : "可同時選擇多項方案。送出後在付款前仍可回來變更。"}
      </p>
    </>
  );
}

function ApprovedBanner() {
  return (
    <div
      className="rounded-xl p-4 mb-6 flex items-center gap-3"
      style={{ background: "rgba(48,209,88,0.08)", border: "1px solid rgba(48,209,88,0.3)" }}
    >
      <Icon name="check" className="icon w-5 h-5" style={{ color: "#1f8a3a" }} />
      <span className="text-[13px]" style={{ color: "#1f8a3a" }}>
        <strong>方案已鎖定</strong>　如需變更，請聯絡主辦方客服。
      </span>
    </div>
  );
}

function HelpFooter() {
  return (
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
  );
}
