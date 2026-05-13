import { useState } from "react";

// 管理「已勾選的方案 id」集合
// disabled=true 時所有 toggle 變 no-op（用於通過後鎖定）
export function usePackageSelection(initial = [], disabled = false) {
  const [selected, setSelected] = useState(() => new Set(initial));

  function toggle(id) {
    if (disabled) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function reset(ids = []) {
    setSelected(new Set(ids));
  }

  return {
    selected,
    selectedIds: Array.from(selected),
    has: (id) => selected.has(id),
    size: selected.size,
    toggle,
    reset,
  };
}
