import { Link, useParams } from "react-router-dom";
import { SceneHead, Panel, StatGrid } from "../../components/Scene";
import { Icon } from "../../components/Icon";

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

export default function DecoratorDashboard({ data }) {
  const { decoratorId } = useParams();
  const { decorator, projects } = data;

  const counts = {
    total: projects.length,
    pending: projects.filter((p) => ["pending", "draft"].includes(p.status)).length,
    designing: projects.filter((p) => ["designing", "review"].includes(p.status)).length,
    done: projects.filter((p) => ["done", "completed"].includes(p.status)).length,
  };

  return (
    <>
      <SceneHead
        tag="DECORATOR DASHBOARD"
        title={decorator.name}
        desc="管理您正在執行的所有展位裝潢專案。"
      />

      <StatGrid
        stats={[
          { label: "全部專案", value: counts.total },
          { label: "待開始", value: counts.pending },
          { label: "設計中", value: counts.designing },
          { label: "已完成", value: counts.done },
        ]}
      />

      <Panel title="專案列表">
        {projects.length === 0 ? (
          <div className="py-12 text-center text-[13px]" style={{ color: "var(--text-tertiary)" }}>
            目前沒有專案。當廠商邀請您並接受後，專案會出現在這裡。
          </div>
        ) : (
          <div className="space-y-3">
            {projects.map((p) => {
              const st = PROJECT_STATUS[p.status] || PROJECT_STATUS.pending;
              const hasPending = p.designsPending > 0;
              return (
                <Link
                  key={p.id}
                  to={`/portal/decorator/${decoratorId}/project/${p.id}`}
                  className="block p-4 rounded-xl no-underline transition-all hover:shadow-sm"
                  style={{
                    background: "var(--bg-tinted)",
                    border: "1px solid var(--separator)",
                    color: "inherit",
                  }}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className="w-12 h-12 rounded-xl grid place-items-center flex-shrink-0"
                      style={{ background: "linear-gradient(135deg, #ff6a00, #ff2d92)" }}
                    >
                      <Icon name="building" className="icon" />
                      <style>{`.flex.items-start .icon { stroke: white; }`}</style>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-[15px] font-semibold">{p.vendor?.company}</h3>
                        <span className={`badge ${st.cls}`}>{st.label}</span>
                        {hasPending && (
                          <span className="badge badge-orange">{p.designsPending} 份待審</span>
                        )}
                      </div>
                      <div
                        className="text-[12px] font-display mb-2"
                        style={{ color: "var(--text-tertiary)" }}
                      >
                        {p.event?.name}
                        {p.vendor?.boothNumber && ` · 展位 ${p.vendor.boothNumber}`}
                      </div>
                      <div className="text-[12px]" style={{ color: "var(--text-secondary)" }}>
                        {p.designsCount} 份設計稿
                      </div>
                    </div>
                    <Icon name="arrow_right" className="icon w-4 h-4" style={{ stroke: "var(--text-tertiary)" }} />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </Panel>
    </>
  );
}
