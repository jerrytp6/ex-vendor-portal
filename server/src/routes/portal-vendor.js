import { Router } from "express";
import { z } from "zod";
import crypto from "node:crypto";
import { prisma } from "../lib/prisma.js";
import { signToken } from "../lib/jwt.js";
import { requireVendor } from "../middleware/requireVendor.js";

export const portalVendorRouter = Router();

// 廠商側資料序列化（不洩漏內部欄位）
function serializeVendor(v) {
  return {
    id: v.id,
    tenantId: v.tenantId,
    eventId: v.eventId,
    company: v.company,
    taxId: v.taxId,
    contact: v.contact,
    email: v.email,
    phone: v.phone,
    sponsorshipPackageIds: Array.isArray(v.sponsorshipPackageIds) ? v.sponsorshipPackageIds : [],
    paymentStatus: v.paymentStatus || "not_started",
    paymentAmount: v.paymentAmount != null ? Number(v.paymentAmount) : null,
    paymentProofUrl: v.paymentProofUrl,
    paymentSubmittedAt: v.paymentSubmittedAt,
    paymentReviewedAt: v.paymentReviewedAt,
    paymentRejectReason: v.paymentRejectReason,
  };
}

// ─────────────────────────────────────────────────────────────
// 公開：廠商登入
// 帳號與密碼皆為公司統一編號
// ─────────────────────────────────────────────────────────────
const loginSchema = z.object({
  vendorId: z.string().min(1).optional(),
  taxId: z.string().min(1),
});

portalVendorRouter.post("/vendor/login", async (req, res, next) => {
  try {
    const body = loginSchema.parse(req.body);
    // 帳號與密碼皆為統編：vendorId 與 taxId 必須相等（介面上同一欄位送 2 次）
    if (body.vendorId && body.vendorId !== body.taxId) {
      // 也允許 vendorId 是 Vendor.id（深連結場景）— 先試 id+taxId
      const byId = await prisma.vendor.findFirst({
        where: { id: body.vendorId, taxId: body.taxId },
      });
      if (byId) return res.json(makeLoginResponse(byId));
      return res.status(401).json({ error: "invalid_credentials" });
    }
    // 標準：用 taxId 找最新一筆 Vendor
    const vendor = await prisma.vendor.findFirst({
      where: { taxId: body.taxId },
      orderBy: { createdAt: "desc" },
    });
    if (!vendor) return res.status(401).json({ error: "invalid_credentials" });
    res.json(makeLoginResponse(vendor));
  } catch (err) { next(err); }
});

function makeLoginResponse(vendor) {
  const token = signToken({
    scope: "vendor",
    vendorId: vendor.id,
    tenantId: vendor.tenantId,
    eventId: vendor.eventId,
  });
  return { token, vendor: serializeVendor(vendor) };
}

// ─────────────────────────────────────────────────────────────
// 以下端點需要 requireVendor
// ─────────────────────────────────────────────────────────────

// GET /portal/vendor/me — 取自己資料
portalVendorRouter.get("/vendor/me", requireVendor, async (req, res, next) => {
  try {
    const vendor = await prisma.vendor.findUnique({ where: { id: req.vendor.vendorId } });
    if (!vendor) return res.status(404).json({ error: "vendor_not_found" });
    const event = await prisma.event.findUnique({
      where: { id: vendor.eventId },
      select: { id: true, name: true, location: true, startDate: true, endDate: true, type: true },
    });
    res.json({ vendor: serializeVendor(vendor), event });
  } catch (err) { next(err); }
});

// GET /portal/sponsorship-packages — 列出 tenant 下 active 方案
portalVendorRouter.get("/sponsorship-packages", requireVendor, async (req, res, next) => {
  try {
    const pkgs = await prisma.sponsorshipPackage.findMany({
      where: { tenantId: req.vendor.tenantId, active: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });
    res.json(pkgs.map((p) => ({
      ...p,
      price: Number(p.price),
      benefits: Array.isArray(p.benefits) ? p.benefits : [],
    })));
  } catch (err) { next(err); }
});

// PATCH /portal/vendor/sponsorship — 變更選擇（僅 not_started / rejected 可改）
const sponsorshipBody = z.object({
  packageIds: z.array(z.string().min(1)).min(1),
});

portalVendorRouter.patch("/vendor/sponsorship", requireVendor, async (req, res, next) => {
  try {
    const body = sponsorshipBody.parse(req.body);
    const vendor = await prisma.vendor.findUnique({ where: { id: req.vendor.vendorId } });
    if (!vendor) return res.status(404).json({ error: "vendor_not_found" });
    const status = vendor.paymentStatus || "not_started";
    // 已通過後鎖定；其餘狀態（未開始/已提交/退件）皆可變更
    if (status === "approved") {
      return res.status(409).json({ error: "payment_locked", paymentStatus: status });
    }
    // 驗證 packageIds 屬於同 tenant 且 active
    const pkgs = await prisma.sponsorshipPackage.findMany({
      where: { id: { in: body.packageIds }, tenantId: vendor.tenantId, active: true },
    });
    if (pkgs.length !== body.packageIds.length) {
      return res.status(400).json({ error: "invalid_package_ids" });
    }
    const total = pkgs.reduce((sum, p) => sum + Number(p.price), 0);
    // [自助流程] 方案送出 → 直接通過，立即解鎖功能（無需 admin 審核）
    const now = new Date();
    const updated = await prisma.vendor.update({
      where: { id: vendor.id },
      data: {
        sponsorshipPackageIds: body.packageIds,
        paymentAmount: total,
        paymentStatus: "approved",
        paymentSubmittedAt: now,
        paymentReviewedAt: now,
        paymentReviewedBy: "auto-approval",
        paymentProofUrl: null,
        paymentRejectReason: null,
      },
    });
    res.json(serializeVendor(updated));
  } catch (err) { next(err); }
});

// [自助流程] 不需上傳匯款證明，方案送出時自動通過

// ─────────────────────────────────────────────────────────────
// 裝潢模式 + 裝潢商邀請
// ─────────────────────────────────────────────────────────────

// PATCH /portal/vendor/decoration-mode — 設定 self / booth-vendor
const decorationModeBody = z.object({
  mode: z.enum(["self", "booth-vendor"]),
});

portalVendorRouter.patch("/vendor/decoration-mode", requireVendor, async (req, res, next) => {
  try {
    const body = decorationModeBody.parse(req.body);
    const updated = await prisma.vendor.update({
      where: { id: req.vendor.vendorId },
      data: { decorationMode: body.mode },
    });
    res.json({
      decorationMode: updated.decorationMode,
      ...serializeVendor(updated),
    });
  } catch (err) { next(err); }
});

// GET /portal/vendor/decorator-invitation — 取現有邀請（無則 404）
portalVendorRouter.get("/vendor/decorator-invitation", requireVendor, async (req, res, next) => {
  try {
    const inv = await prisma.decoratorInvitation.findFirst({
      where: { fromVendorId: req.vendor.vendorId, status: { in: ["sent", "accepted"] } },
      orderBy: { createdAt: "desc" },
    });
    if (!inv) return res.status(404).json({ error: "no_invitation" });
    res.json({
      token: inv.token,
      status: inv.status,
      expiresAt: inv.expiresAt,
      createdAt: inv.createdAt,
      decoratorCompany: inv.decoratorCompany,
      decoratorEmail: inv.decoratorEmail,
    });
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────────────────────
// 展覽文件確認（EventDocument + 廠商確認狀態）
// ─────────────────────────────────────────────────────────────

// GET /portal/vendor/event-documents — 列出該活動需確認文件 + 已確認狀態
portalVendorRouter.get("/vendor/event-documents", requireVendor, async (req, res, next) => {
  try {
    const vendor = await prisma.vendor.findUnique({ where: { id: req.vendor.vendorId } });
    if (!vendor) return res.status(404).json({ error: "vendor_not_found" });

    const docs = await prisma.eventDocument.findMany({
      where: { eventId: vendor.eventId },
      include: { template: true },
    });
    const acks = (vendor.documentAcks && typeof vendor.documentAcks === "object") ? vendor.documentAcks : {};
    // 依 template.sortOrder 排序（include 內無法 orderBy include 子欄位）
    const sorted = docs.sort((a, b) => (a.template?.sortOrder || 0) - (b.template?.sortOrder || 0));
    res.json(sorted.map((d) => ({
      templateId: d.templateId,
      category: d.template?.category,
      name: d.template?.name,
      formats: d.template?.formats,
      fileName: d.template?.fileName,
      required: d.required,
      deadline: d.deadline,
      ackedAt: acks[d.templateId] || null,
    })));
  } catch (err) { next(err); }
});

// POST /portal/vendor/event-documents/:templateId/ack — 確認單一文件
portalVendorRouter.post("/vendor/event-documents/:templateId/ack", requireVendor, async (req, res, next) => {
  try {
    const vendor = await prisma.vendor.findUnique({ where: { id: req.vendor.vendorId } });
    if (!vendor) return res.status(404).json({ error: "vendor_not_found" });
    const tplId = req.params.templateId;

    const doc = await prisma.eventDocument.findFirst({
      where: { eventId: vendor.eventId, templateId: tplId },
    });
    if (!doc) return res.status(404).json({ error: "document_not_found" });

    const acks = (vendor.documentAcks && typeof vendor.documentAcks === "object") ? { ...vendor.documentAcks } : {};
    acks[tplId] = new Date().toISOString();
    await prisma.vendor.update({
      where: { id: vendor.id },
      data: { documentAcks: acks },
    });
    res.json({ templateId: tplId, ackedAt: acks[tplId] });
  } catch (err) { next(err); }
});

// POST /portal/vendor/decorator-invitation — 產生（或重新產生）邀請 token
portalVendorRouter.post("/vendor/decorator-invitation", requireVendor, async (req, res, next) => {
  try {
    const vendor = await prisma.vendor.findUnique({ where: { id: req.vendor.vendorId } });
    if (!vendor) return res.status(404).json({ error: "vendor_not_found" });
    if (vendor.decorationMode !== "self") {
      return res.status(409).json({ error: "self_decoration_required" });
    }
    const token = crypto.randomBytes(16).toString("hex");
    const expiresAt = new Date(Date.now() + 14 * 86400_000); // 14 天

    // 把舊邀請 mark expired，建新的
    await prisma.decoratorInvitation.updateMany({
      where: { fromVendorId: vendor.id, status: "sent" },
      data: { status: "declined" },
    });
    const inv = await prisma.decoratorInvitation.create({
      data: {
        token,
        tenantId: vendor.tenantId,
        eventId: vendor.eventId,
        fromVendorId: vendor.id,
        decoratorEmail: `pending-${token.slice(0, 8)}@invite.local`,
        decoratorCompany: null,
        status: "sent",
        expiresAt,
      },
    });
    res.status(201).json({
      token: inv.token,
      status: inv.status,
      expiresAt: inv.expiresAt,
      createdAt: inv.createdAt,
    });
  } catch (err) { next(err); }
});
