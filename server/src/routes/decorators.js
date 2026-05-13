import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { signToken } from "../lib/jwt.js";

export const publicDecoratorsRouter = Router();

function signDecoratorToken(d) {
  return signToken({ scope: "decorator", decoratorId: d.id, tenantId: d.tenantId });
}
function serializeDec(d) {
  return {
    id: d.id, tenantId: d.tenantId,
    name: d.name, taxId: d.taxId,
    email: d.email, phone: d.phone, contact: d.contact,
    status: d.status,
  };
}

// ═══════════════════════════════════════════════════════════════════════
// 公開 token endpoints（裝潢商接收邀約）
// ═══════════════════════════════════════════════════════════════════════

publicDecoratorsRouter.get("/decor-invite/:token", async (req, res, next) => {
  try {
    const inv = await prisma.decoratorInvitation.findUnique({
      where: { token: req.params.token },
      include: { event: { select: { id: true, name: true, location: true, startDate: true, endDate: true } } },
    });
    if (!inv) return res.status(404).json({ error: "invalid_token" });
    if (inv.expiresAt < new Date()) return res.status(410).json({ error: "expired" });
    res.json(inv);
  } catch (err) { next(err); }
});

publicDecoratorsRouter.post("/decor-invite/:token/respond", async (req, res, next) => {
  try {
    const { status } = z.object({ status: z.enum(["accepted", "declined"]) }).parse(req.body);
    const inv = await prisma.decoratorInvitation.update({
      where: { token: req.params.token },
      data: { status },
    });
    res.json(inv);
  } catch (err) { next(err); }
});

// 統編查詢 — 給邀請頁的 auto-fill 用
// GET /public/decor-invite/:token/lookup-tax?taxId=xxx
publicDecoratorsRouter.get("/decor-invite/:token/lookup-tax", async (req, res, next) => {
  try {
    const inv = await prisma.decoratorInvitation.findUnique({ where: { token: req.params.token } });
    if (!inv) return res.status(404).json({ error: "invalid_token" });
    const taxId = String(req.query.taxId || "").trim();
    if (!/^\d{8}$/.test(taxId)) return res.status(400).json({ error: "invalid_tax_id" });

    const existing = await prisma.decorator.findFirst({
      where: { tenantId: inv.tenantId, taxId },
    });
    if (!existing) return res.status(404).json({ error: "not_found" });
    res.json({
      id: existing.id,
      name: existing.name,
      taxId: existing.taxId,
      email: existing.email,
      phone: existing.phone,
      address: existing.address,
      contact: existing.contact,
    });
  } catch (err) { next(err); }
});

// 裝潢商接受邀請 + 註冊 / 登入
// POST /public/decor-invite/:token/register
// body: { taxId, name, contact, email?, phone? }
const decoratorRegisterSchema = z.object({
  taxId: z.string().regex(/^\d{8}$/, "invalid_tax_id"),
  name: z.string().min(1),
  contact: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
});

publicDecoratorsRouter.post("/decor-invite/:token/register", async (req, res, next) => {
  try {
    const body = decoratorRegisterSchema.parse(req.body);
    const inv = await prisma.decoratorInvitation.findUnique({ where: { token: req.params.token } });
    if (!inv) return res.status(404).json({ error: "invalid_token" });
    if (inv.expiresAt < new Date()) return res.status(410).json({ error: "expired" });

    // 找既有 Decorator 或建新的
    let decorator = await prisma.decorator.findFirst({
      where: { tenantId: inv.tenantId, taxId: body.taxId },
    });
    if (!decorator) {
      decorator = await prisma.decorator.create({
        data: {
          tenantId: inv.tenantId,
          name: body.name,
          taxId: body.taxId,
          email: body.email || `${body.taxId}@decorator.local`,
          phone: body.phone || null,
          contact: body.contact,
          status: "active",
        },
      });
    } else {
      // 既有 → 更新本次的負責人聯絡資訊
      const updates = {};
      if (body.contact && decorator.contact !== body.contact) updates.contact = body.contact;
      if (body.name && decorator.name !== body.name) updates.name = body.name;
      if (Object.keys(updates).length) {
        decorator = await prisma.decorator.update({ where: { id: decorator.id }, data: updates });
      }
    }

    // 建立或取現有的裝潢專案（per vendor+decorator+event）
    let project = await prisma.decorationProject.findFirst({
      where: { eventId: inv.eventId, vendorId: inv.fromVendorId, decoratorId: decorator.id },
    });
    if (!project) {
      project = await prisma.decorationProject.create({
        data: {
          tenantId: inv.tenantId,
          eventId: inv.eventId,
          vendorId: inv.fromVendorId,
          decoratorId: decorator.id,
          title: "預設裝潢專案",
          status: "pending",
        },
      });
    }

    // 標邀請為已接受
    await prisma.decoratorInvitation.update({
      where: { token: inv.token },
      data: {
        status: "accepted",
        decoratorEmail: decorator.email,
        decoratorCompany: decorator.name,
      },
    });

    // 把廠商的 decoratorId 設好
    await prisma.vendor.update({
      where: { id: inv.fromVendorId },
      data: { decoratorId: decorator.id, decorationMode: "self" },
    });

    // 同時發 decorator JWT，方便前端註冊後一鍵進後台
    const token = signDecoratorToken(decorator);
    res.status(201).json({
      decorator: serializeDec(decorator),
      project: { id: project.id, title: project.title, status: project.status },
      token,
    });
  } catch (err) { next(err); }
});

// 已註冊的裝潢商再次點同邀請連結 → 自動簽 token（魔法登入）
// POST /public/decor-invite/:token/auto-login
publicDecoratorsRouter.post("/decor-invite/:token/auto-login", async (req, res, next) => {
  try {
    const inv = await prisma.decoratorInvitation.findUnique({ where: { token: req.params.token } });
    if (!inv) return res.status(404).json({ error: "invalid_token" });
    if (inv.expiresAt < new Date()) return res.status(410).json({ error: "expired" });
    if (inv.status !== "accepted") return res.status(409).json({ error: "not_registered" });

    // 用 invitation 記錄的 email 找對應 decorator
    const decorator = await prisma.decorator.findFirst({
      where: {
        tenantId: inv.tenantId,
        OR: [
          { email: inv.decoratorEmail },
          { name: inv.decoratorCompany ?? undefined },
        ].filter((c) => Object.values(c).every((v) => v !== undefined)),
      },
    });
    if (!decorator) return res.status(404).json({ error: "decorator_not_found" });

    const token = signDecoratorToken(decorator);
    res.json({ token, decorator: serializeDec(decorator) });
  } catch (err) { next(err); }
});
