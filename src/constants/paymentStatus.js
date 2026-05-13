// 廠商贊助方案付款狀態（與後端 prisma.vendor.paymentStatus 對應）
export const PAYMENT_STATUS = {
  NOT_STARTED: "not_started",
  SUBMITTED:   "submitted",
  APPROVED:    "approved",
  REJECTED:    "rejected",
};

// 自動審核標記（與真實審核者區分）
export const AUTO_APPROVAL_REVIEWER = "auto-approval";
