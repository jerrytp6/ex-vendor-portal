import { useEffect, useState } from "react";
import { Navigate, useParams, Routes, Route, Link, useNavigate } from "react-router-dom";
import { decoratorApi, clearDecoratorToken, getDecoratorToken } from "../../lib/decoratorAuth";
import { Icon } from "../../components/Icon";
import { toast } from "../../store/toast";
import DecoratorDashboard from "./DecoratorDashboard";
import DecoratorProject from "./DecoratorProject";

export default function DecoratorPortal() {
  const { decoratorId } = useParams();
  const [data, setData] = useState(null); // { decorator, projects }
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(false);

  useEffect(() => {
    let alive = true;
    if (!getDecoratorToken()) {
      setAuthError(true);
      setLoading(false);
      return;
    }
    async function load(initial = false) {
      try {
        const r = await decoratorApi.me();
        if (!alive) return;
        if (r.decorator.id !== decoratorId) {
          clearDecoratorToken();
          setAuthError(true);
          return;
        }
        setData(r);
      } catch (err) {
        if (err.status === 401 || err.status === 403) {
          clearDecoratorToken();
          setAuthError(true);
        } else if (initial) {
          toast.error(`載入失敗：${err.message}`);
        }
      } finally {
        if (alive && initial) setLoading(false);
      }
    }
    load(true);
    const refetch = () => load(false);
    window.addEventListener("decorator-refetch", refetch);
    return () => {
      alive = false;
      window.removeEventListener("decorator-refetch", refetch);
    };
  }, [decoratorId]);

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center" style={{ background: "var(--bg)" }}>
        <div className="text-[13px] font-display" style={{ color: "var(--text-tertiary)" }}>載入中…</div>
      </div>
    );
  }
  if (authError || !data) {
    return <Navigate to="/portal/decorator-login" replace />;
  }

  return (
    <Routes>
      <Route index element={<DecoratorStandalone data={data} />} />
      <Route path="project/:projectId" element={<DecoratorProject decorator={data.decorator} />} />
      <Route path="*" element={<Navigate to={`/portal/decorator/${decoratorId}`} replace />} />
    </Routes>
  );
}

function DecoratorStandalone({ data }) {
  const navigate = useNavigate();
  const { decorator } = data;
  function logout() {
    clearDecoratorToken();
    navigate("/portal/decorator-login");
  }
  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }} data-role="decorator">
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
              style={{ background: "linear-gradient(135deg, #ff6a00, #ff2d92)" }}
            >
              <Icon name="sparkles" />
              <style>{`header > div .grid .icon { stroke: white; }`}</style>
            </div>
            <div>
              <div className="font-display font-bold text-[15px]">{decorator.name}</div>
              <div className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>
                裝潢公司後台
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[13px] font-display" style={{ color: "var(--text-secondary)" }}>
              {decorator.contact || decorator.name}
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
        <DecoratorDashboard data={data} />
      </div>
    </div>
  );
}
