import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { decoratorApi } from "../../lib/decoratorAuth";
import { fmtDateRange } from "../../lib/dateUtils";
import { SceneHead, Panel, Field } from "../../components/Scene";
import { Modal } from "../../components/Modal";
import { Icon } from "../../components/Icon";
import { toast } from "../../store/toast";

const PROJECT_STATUS = {
  pending:     { label: "待開始",   cls: "badge-gray" },
  draft:       { label: "草擬中",   cls: "badge-gray" },
  designing:   { label: "設計中",   cls: "badge-blue" },
  review:      { label: "待審稿",   cls: "badge-orange" },
  approved:    { label: "已核准",   cls: "badge-green" },
  "in-progress": { label: "施工中", cls: "badge-purple" },
  building:    { label: "施工中",   cls: "badge-purple" },
  done:        { label: "已完成",   cls: "badge-green" },
  completed:   { label: "已完成",   cls: "badge-green" },
};

const DESIGN_STATUS = {
  pending:  { label: "待客戶審核", cls: "badge-orange" },
  approved: { label: "已核准",     cls: "badge-green" },
  rejected: { label: "已退回",     cls: "badge-gray" },
};

export default function DecoratorProject({ decorator }) {
  const { decoratorId, projectId } = useParams();
  const navigate = useNavigate();
  const fileRef = useRef(null);
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);

  const [uploadOpen, setUploadOpen] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", file: null });
  const [uploading, setUploading] = useState(false);

  const [newMsg, setNewMsg] = useState("");
  const [sending, setSending] = useState(false);

  async function load() {
    try {
      const r = await decoratorApi.project(projectId);
      setProject(r);
    } catch (err) {
      if (err.status === 404) {
        toast.error("找不到專案");
        navigate(`/portal/decorator/${decoratorId}`, { replace: true });
      } else {
        toast.error(`載入失敗：${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [projectId]);

  if (loading) {
    return (
      <Wrapper>
        <div className="text-center py-12 text-[13px]" style={{ color: "var(--text-tertiary)" }}>載入中…</div>
      </Wrapper>
    );
  }
  if (!project) return null;

  const vendor = project.vendor;
  const event = project.event;
  const designs = project.designs || [];
  const messages = project.messages || [];

  async function uploadDesign() {
    if (!form.title.trim()) { toast.error("請輸入設計稿標題"); return; }
    if (!form.file) { toast.error("請選擇檔案"); return; }
    setUploading(true);
    try {
      await decoratorApi.uploadDesign(project.id, form.file, form.title.trim(), form.description.trim());
      toast.success("設計稿已上傳");
      setUploadOpen(false);
      setForm({ title: "", description: "", file: null });
      await load();
    } catch (err) {
      toast.error(`上傳失敗：${err.body?.error || err.message}`);
    } finally {
      setUploading(false);
    }
  }

  async function sendMsg() {
    const content = newMsg.trim();
    if (!content) return;
    setSending(true);
    try {
      await decoratorApi.sendMessage(project.id, content);
      setNewMsg("");
      await load();
    } catch (err) {
      toast.error(`傳送失敗：${err.body?.error || err.message}`);
    } finally {
      setSending(false);
    }
  }

  const st = PROJECT_STATUS[project.status] || PROJECT_STATUS.pending;

  return (
    <Wrapper>
      <div className="mb-4">
        <Link
          to={`/portal/decorator/${decoratorId}`}
          className="text-[13px] font-display no-underline inline-flex items-center gap-1"
          style={{ color: "var(--text-tertiary)" }}
        >
          <Icon name="arrow_left" className="icon w-3 h-3" />
          返回專案列表
        </Link>
      </div>

      <SceneHead
        tag="PROJECT"
        title={project.title || vendor?.company || "裝潢專案"}
        desc={
          <span className="inline-flex items-center gap-2">
            <span>{event?.name}</span>
            {vendor?.boothNumber && <span>· 展位 {vendor.boothNumber}</span>}
            <span className={`badge ${st.cls}`}>{st.label}</span>
          </span>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Panel title="廠商資訊">
          <dl className="space-y-3 text-[14px]">
            <Row k="公司" v={vendor?.company} />
            <Row k="聯絡人" v={vendor?.contact} />
            <Row k="Email" v={vendor?.email} />
            <Row k="電話" v={vendor?.phone} />
            <Row k="展位編號" v={vendor?.boothNumber || "未配置"} />
          </dl>
        </Panel>

        <Panel title="活動資訊">
          <dl className="space-y-3 text-[14px]">
            <Row k="活動名稱" v={event?.name} />
            <Row k="日期" v={fmtDateRange(event?.startDate, event?.endDate)} />
            <Row k="地點" v={event?.location || "—"} />
          </dl>
        </Panel>
      </div>

      <Panel
        title="設計稿"
        action={<button className="btn btn-primary !py-1 !text-xs" onClick={() => setUploadOpen(true)}>+ 上傳設計稿</button>}
      >
        {designs.length === 0 ? (
          <div className="py-8 text-center text-[13px]" style={{ color: "var(--text-tertiary)" }}>
            尚未上傳設計稿
          </div>
        ) : (
          <div className="space-y-2">
            {designs.map((d) => {
              const ds = DESIGN_STATUS[d.status] || DESIGN_STATUS.pending;
              return (
                <div
                  key={d.id}
                  className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ background: "var(--bg-tinted)" }}
                >
                  <div
                    className="w-9 h-9 rounded-lg grid place-items-center text-white font-display font-semibold text-[12px] flex-shrink-0"
                    style={{ background: "linear-gradient(135deg, #ff6a00, #ff2d92)" }}
                  >
                    v{d.version}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] font-medium">{d.title}</div>
                    {d.description && (
                      <div className="text-[12px] mt-0.5" style={{ color: "var(--text-tertiary)" }}>
                        {d.description}
                      </div>
                    )}
                    {d.feedback && (
                      <div className="text-[12px] mt-1 p-2 rounded-lg" style={{ background: "rgba(255,159,10,0.08)", color: "#a06400" }}>
                        客戶回覆：{d.feedback}
                      </div>
                    )}
                  </div>
                  <span className={`badge ${ds.cls}`}>{ds.label}</span>
                </div>
              );
            })}
          </div>
        )}
      </Panel>

      <Panel title="訊息" className="mt-6">
        <div className="space-y-3 mb-4 max-h-[400px] overflow-auto">
          {messages.length === 0 ? (
            <div className="py-6 text-center text-[13px]" style={{ color: "var(--text-tertiary)" }}>
              尚無訊息
            </div>
          ) : messages.map((m) => {
            const self = m.sender === "decorator";
            return (
              <div key={m.id} className={`flex ${self ? "justify-end" : "justify-start"}`}>
                <div
                  className="max-w-[70%] p-3 rounded-xl"
                  style={{
                    background: self ? "linear-gradient(135deg, #ff6a00, #ff2d92)" : "var(--bg-tinted)",
                    color: self ? "white" : "inherit",
                  }}
                >
                  <div className="text-[11px] font-display mb-1 opacity-80">
                    {m.senderName} · {m.at ? new Date(m.at).toLocaleString("zh-TW") : ""}
                  </div>
                  <div className="text-[14px] whitespace-pre-wrap">{m.content}</div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={newMsg}
            onChange={(e) => setNewMsg(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMsg()}
            placeholder="輸入訊息按 Enter 送出…"
            className="flex-1 px-4 py-2.5 rounded-xl text-[14px] outline-none"
            style={{ background: "var(--bg-tinted)", border: "1px solid var(--separator)" }}
            disabled={sending}
          />
          <button
            onClick={sendMsg}
            disabled={sending || !newMsg.trim()}
            className="px-4 py-2.5 rounded-xl text-white text-[13px] font-medium"
            style={{
              background: "linear-gradient(135deg, #ff6a00, #ff2d92)",
              opacity: sending || !newMsg.trim() ? 0.5 : 1,
              cursor: sending || !newMsg.trim() ? "not-allowed" : "pointer",
            }}
          >
            送出
          </button>
        </div>
      </Panel>

      <Modal
        open={uploadOpen}
        onClose={() => !uploading && setUploadOpen(false)}
        title="上傳設計稿"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setUploadOpen(false)} disabled={uploading}>取消</button>
            <button className="btn btn-primary" onClick={uploadDesign} disabled={uploading}>
              {uploading ? "上傳中…" : "上傳"}
            </button>
          </>
        }
      >
        <Field label="標題">
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="例如：初稿 v1 / 修改稿 v2"
            className="w-full px-3 py-2 rounded-lg text-[14px] outline-none"
            style={{ background: "var(--bg-tinted)", border: "1px solid var(--separator)" }}
          />
        </Field>
        <Field label="說明">
          <textarea
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            rows={3}
            placeholder="設計重點 / 修改說明…"
            className="w-full px-3 py-2 rounded-lg text-[14px] outline-none"
            style={{ background: "var(--bg-tinted)", border: "1px solid var(--separator)", resize: "vertical" }}
          />
        </Field>
        <Field label="檔案">
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,.dwg,.dxf,.svg,.ai"
            onChange={(e) => setForm((f) => ({ ...f, file: e.target.files?.[0] || null }))}
            className="w-full text-[13px]"
          />
        </Field>
      </Modal>
    </Wrapper>
  );
}

function Wrapper({ children }) {
  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }} data-role="decorator">
      <div className="max-w-[1080px] mx-auto px-8 py-8">{children}</div>
    </div>
  );
}

function Row({ k, v }) {
  return (
    <div className="flex justify-between gap-3">
      <dt style={{ color: "var(--text-tertiary)" }}>{k}</dt>
      <dd className="font-medium text-right">{v || "—"}</dd>
    </div>
  );
}
