// 日期格式化工具 — 全站統一使用
// 後端回傳的日期通常是 ISO 字串（如 "2026-06-04T00:00:00.000Z"）或 Date 物件

// "2026-06-04"
export function fmtDate(d) {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString("zh-TW"); } catch { return String(d).slice(0, 10); }
}

// "2026-06-04 14:30"
export function fmtDateTime(d) {
  if (!d) return "—";
  try { return new Date(d).toLocaleString("zh-TW", { hour12: false }); } catch { return String(d).slice(0, 16); }
}

// 「2026-06-04」短日期（沒地區化），給檔名/系統用
export function fmtDateISO(d) {
  if (!d) return "";
  try { return new Date(d).toISOString().slice(0, 10); } catch { return String(d).slice(0, 10); }
}

// 「2026-06-04 – 2026-06-07」或「2026-06-04」（同日不顯示尾段）
export function fmtDateRange(start, end) {
  if (!start) return "—";
  const s = fmtDateISO(start);
  if (!end || fmtDateISO(end) === s) return s;
  return `${s} – ${fmtDateISO(end)}`;
}
