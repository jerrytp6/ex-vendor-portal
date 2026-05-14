// 後端常數 — 與前端 src/constants/paymentStatus.js 保持同步
//
// 廠商贊助方案付款狀態（與 prisma.vendor.paymentStatus 對應）
export const PAYMENT_STATUS = {
  NOT_STARTED: "not_started",
  SUBMITTED:   "submitted",
  APPROVED:    "approved",
  REJECTED:    "rejected",
};

// 自動審核標記（與真實審核者的 user.name 區分，方便日後 audit log 區分人工 vs 系統）
export const AUTO_APPROVAL_REVIEWER = "auto-approval";
