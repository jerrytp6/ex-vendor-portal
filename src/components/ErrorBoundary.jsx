import { Component } from "react";

// 全站 Error Boundary — 任何元件 throw 進 render 時不會白屏
//
// 用法：包在 App 最外層
//   <ErrorBoundary>
//     <HashRouter>...</HashRouter>
//   </ErrorBoundary>
export class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // 後續可接 Sentry / Datadog 等
    console.error("[ErrorBoundary]", error, info?.componentStack);
  }

  reset = () => {
    this.setState({ error: null });
    // 強制 reload — 簡單但有效，重置所有 state
    window.location.reload();
  };

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="min-h-screen grid place-items-center p-8" style={{ background: "var(--bg)" }}>
        <div className="max-w-md text-center">
          <div
            className="w-14 h-14 rounded-full mx-auto mb-5 grid place-items-center text-white font-bold text-2xl"
            style={{ background: "linear-gradient(135deg, #ff453a, #c5180c)" }}
          >
            !
          </div>
          <h1 className="text-2xl font-bold tracking-tight mb-2">發生未預期的錯誤</h1>
          <p className="text-[14px] mb-6" style={{ color: "var(--text-secondary)" }}>
            畫面遇到問題無法正常顯示。可嘗試重新整理頁面，或聯絡技術支援。
          </p>

          <details className="mb-6 text-left text-[12px] font-display p-3 rounded-lg"
            style={{ background: "var(--bg-tinted)", color: "var(--text-tertiary)" }}>
            <summary className="cursor-pointer">技術細節</summary>
            <pre className="mt-2 whitespace-pre-wrap break-all">
              {String(this.state.error?.message || this.state.error)}
            </pre>
          </details>

          <button
            onClick={this.reset}
            className="px-5 py-2.5 rounded-xl text-white font-medium text-[14px]"
            style={{ background: "linear-gradient(135deg, #0071e3, #5e5ce6)", cursor: "pointer" }}
          >
            重新載入頁面
          </button>
        </div>
      </div>
    );
  }
}
