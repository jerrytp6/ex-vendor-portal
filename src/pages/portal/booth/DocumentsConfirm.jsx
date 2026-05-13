import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { SceneHead } from "../../../components/Scene";
import { Icon } from "../../../components/Icon";
import { vendorApi } from "../../../lib/vendorAuth";
import { toast } from "../../../store/toast";

function fmtDate(d) {
  if (!d) return null;
  try { return new Date(d).toLocaleDateString("zh-TW"); } catch { return String(d).slice(0, 10); }
}

export default function DocumentsConfirm({ event }) {
  const { vendorId } = useParams();
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acking, setAcking] = useState(new Set());

  async function load() {
    try {
      const list = await vendorApi.listEventDocuments();
      setDocs(list);
    } catch (err) {
      toast.error(`載入失敗：${err.body?.error || err.message}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function ack(templateId) {
    setAcking((s) => new Set(s).add(templateId));
    try {
      const r = await vendorApi.ackDocument(templateId);
      setDocs((list) => list.map((d) => d.templateId === templateId ? { ...d, ackedAt: r.ackedAt } : d));
      toast.success("已確認");
    } catch (err) {
      toast.error(`確認失敗：${err.body?.error || err.message}`);
    } finally {
      setAcking((s) => { const n = new Set(s); n.delete(templateId); return n; });
    }
  }

  const stats = useMemo(() => {
    const total = docs.length;
    const acked = docs.filter((d) => d.ackedAt).length;
    const requiredTotal = docs.filter((d) => d.required).length;
    const requiredAcked = docs.filter((d) => d.required && d.ackedAt).length;
    return { total, acked, requiredTotal, requiredAcked };
  }, [docs]);

  const base = `/portal/vendor/${vendorId}`;

  return (
    <>
      <div className="mb-6">
        <Link
          to={`${base}/booth`}
          className="text-[13px] font-display no-underline inline-flex items-center gap-1"
          style={{ color: "var(--text-tertiary)" }}
        >
          <Icon name="arrow_left" className="icon w-3 h-3" />
          返回攤位贊助
        </Link>
      </div>

      <SceneHead
        tag="DOCUMENTS"
        title="展覽文件確認"
        desc={event ? `${event.name} · 請確認以下展覽相關文件` : "請確認以下展覽相關文件"}
      />

      {/* 統計 banner */}
      <div
        className="rounded-2xl p-5 mb-6 flex items-center gap-4"
        style={{
          background: stats.requiredAcked === stats.requiredTotal && stats.requiredTotal > 0 ? "rgba(48,209,88,0.08)" : "rgba(0,113,227,0.06)",
          border: `1px solid ${stats.requiredAcked === stats.requiredTotal && stats.requiredTotal > 0 ? "rgba(48,209,88,0.3)" : "rgba(0,113,227,0.2)"}`,
        }}
      >
        <div
          className="w-12 h-12 rounded-full grid place-items-center"
          style={{
            background: stats.requiredAcked === stats.requiredTotal && stats.requiredTotal > 0 ? "#30d158" : "#0071e3",
            color: "white",
          }}
        >
          <Icon name={stats.requiredAcked === stats.requiredTotal && stats.requiredTotal > 0 ? "check" : "clipboard"} className="icon w-6 h-6" />
          <style>{`.grid .icon { stroke: white; }`}</style>
        </div>
        <div className="flex-1">
          <div className="text-[14px] font-semibold mb-0.5">
            必填文件已確認 {stats.requiredAcked} / {stats.requiredTotal}
          </div>
          <div className="text-[12px]" style={{ color: "var(--text-secondary)" }}>
            全部 {stats.total} 份文件，已確認 {stats.acked} 份
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-[13px] py-10 text-center" style={{ color: "var(--text-tertiary)" }}>
          載入中…
        </div>
      ) : docs.length === 0 ? (
        <div
          className="rounded-2xl p-10 text-center"
          style={{ background: "var(--bg-elevated)", border: "1px dashed var(--separator)" }}
        >
          <div className="text-[15px] font-semibold mb-1">目前沒有待確認的文件</div>
          <p className="text-[13px]" style={{ color: "var(--text-secondary)" }}>
            主辦方公告文件後將在此顯示。
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {docs.map((d) => (
            <DocumentRow
              key={d.templateId}
              doc={d}
              loading={acking.has(d.templateId)}
              onAck={() => ack(d.templateId)}
            />
          ))}
        </div>
      )}
    </>
  );
}

function DocumentRow({ doc, loading, onAck }) {
  const confirmed = !!doc.ackedAt;
  return (
    <div
      className="rounded-2xl p-5 flex items-center gap-4"
      style={{
        background: "var(--bg-elevated)",
        border: confirmed ? "1px solid rgba(48,209,88,0.4)" : "1px solid var(--separator)",
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
      }}
    >
      <div
        className="w-10 h-10 rounded-full grid place-items-center flex-shrink-0"
        style={{ background: confirmed ? "rgba(48,209,88,0.15)" : "rgba(0,113,227,0.1)", color: confirmed ? "#1f8a3a" : "#0071e3" }}
      >
        <Icon name={confirmed ? "check" : "document"} className="icon w-5 h-5" />
        <style>{`.grid .icon { stroke: currentColor; }`}</style>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span
            className="text-[10px] font-display uppercase tracking-wider px-2 py-0.5 rounded-pill"
            style={{ background: "var(--bg-tinted)", color: "var(--text-tertiary)" }}
          >
            {doc.category || "文件"}
          </span>
          {doc.required && (
            <span
              className="text-[10px] font-display font-semibold px-2 py-0.5 rounded-pill"
              style={{ background: "rgba(255,69,58,0.1)", color: "#c5180c" }}
            >
              必填
            </span>
          )}
        </div>
        <div className="text-[15px] font-semibold tracking-tight">{doc.name}</div>
        <div className="text-[12px] mt-0.5" style={{ color: "var(--text-tertiary)" }}>
          格式：{doc.formats}
          {doc.deadline && ` · 截止 ${fmtDate(doc.deadline)}`}
          {confirmed && ` · 已於 ${fmtDate(doc.ackedAt)} 確認`}
        </div>
      </div>
      <button
        type="button"
        onClick={onAck}
        disabled={loading || confirmed}
        className="px-4 py-2 rounded-lg text-[13px] font-medium flex-shrink-0"
        style={
          confirmed
            ? { background: "rgba(48,209,88,0.12)", color: "#1f8a3a", border: 0, cursor: "default" }
            : { background: "linear-gradient(135deg, #0071e3, #5e5ce6)", color: "white", border: 0, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.6 : 1 }
        }
      >
        {confirmed ? "✓ 已確認" : loading ? "確認中…" : "確認"}
      </button>
    </div>
  );
}
