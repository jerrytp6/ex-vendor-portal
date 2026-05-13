import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { signToken } from "../lib/jwt.js";
import { requireDecorator } from "../middleware/requireDecorator.js";
import { upload } from "../middleware/upload.js";

export const portalDecoratorRouter = Router();

function serialize(d) {
  return {
    id: d.id,
    tenantId: d.tenantId,
    name: d.name,
    taxId: d.taxId,
    email: d.email,
    phone: d.phone,
    contact: d.contact,
    status: d.status,
  };
}

// ─────────────────────────────────────────────────────────────
// 公開：裝潢商登入（統編）
// ─────────────────────────────────────────────────────────────
const loginSchema = z.object({
  taxId: z.string().regex(/^\d{8}$/, "invalid_tax_id"),
});

portalDecoratorRouter.post("/decorator/login", async (req, res, next) => {
  try {
    const { taxId } = loginSchema.parse(req.body);
    // 跨租戶找：實務上同個統編只會在一個 tenant 內，但保守地取最新一筆
    const decorator = await prisma.decorator.findFirst({
      where: { taxId, status: "active" },
      orderBy: { createdAt: "desc" },
    });
    if (!decorator) return res.status(401).json({ error: "invalid_credentials" });

    const token = signToken({
      scope: "decorator",
      decoratorId: decorator.id,
      tenantId: decorator.tenantId,
    });
    res.json({ token, decorator: serialize(decorator) });
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────────────────────
// 以下需要 requireDecorator
// ─────────────────────────────────────────────────────────────

// GET /portal/decorator/me — 本人 + 全部專案
portalDecoratorRouter.get("/decorator/me", requireDecorator, async (req, res, next) => {
  try {
    const decorator = await prisma.decorator.findUnique({ where: { id: req.decorator.decoratorId } });
    if (!decorator) return res.status(404).json({ error: "decorator_not_found" });

    const projects = await prisma.decorationProject.findMany({
      where: { decoratorId: decorator.id },
      include: {
        event: { select: { id: true, name: true, startDate: true, endDate: true, location: true } },
        vendor: { select: { id: true, company: true, contact: true, email: true, phone: true, boothNumber: true } },
        designs: { select: { id: true, status: true, version: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json({
      decorator: serialize(decorator),
      projects: projects.map((p) => ({
        id: p.id,
        title: p.title,
        status: p.status,
        budget: p.budget != null ? Number(p.budget) : null,
        deadline: p.deadline,
        createdAt: p.createdAt,
        event: p.event,
        vendor: p.vendor,
        designsCount: p.designs.length,
        designsPending: p.designs.filter((d) => d.status === "pending").length,
      })),
    });
  } catch (err) { next(err); }
});

// GET /portal/decorator/projects/:id — 單一專案詳情（含設計稿、訊息）
portalDecoratorRouter.get("/decorator/projects/:id", requireDecorator, async (req, res, next) => {
  try {
    const project = await prisma.decorationProject.findFirst({
      where: { id: req.params.id, decoratorId: req.decorator.decoratorId },
      include: {
        event: { select: { id: true, name: true, startDate: true, endDate: true, location: true } },
        vendor: { select: { id: true, company: true, contact: true, email: true, phone: true, boothNumber: true } },
        designs: { orderBy: { uploadedAt: "desc" } },
        messages: { orderBy: { at: "asc" } },
      },
    });
    if (!project) return res.status(404).json({ error: "project_not_found" });
    res.json({
      ...project,
      budget: project.budget != null ? Number(project.budget) : null,
    });
  } catch (err) { next(err); }
});

// POST /portal/decorator/projects/:id/messages — 發訊息
const messageSchema = z.object({ content: z.string().min(1) });
portalDecoratorRouter.post("/decorator/projects/:id/messages", requireDecorator, async (req, res, next) => {
  try {
    const { content } = messageSchema.parse(req.body);
    const project = await prisma.decorationProject.findFirst({
      where: { id: req.params.id, decoratorId: req.decorator.decoratorId },
    });
    if (!project) return res.status(404).json({ error: "project_not_found" });
    const decorator = await prisma.decorator.findUnique({ where: { id: req.decorator.decoratorId } });
    const msg = await prisma.message.create({
      data: {
        tenantId: project.tenantId,
        projectId: project.id,
        sender: "decorator",
        senderName: decorator?.name || "裝潢商",
        content,
      },
    });
    res.status(201).json(msg);
  } catch (err) { next(err); }
});

// POST /portal/decorator/projects/:id/designs — 上傳設計稿（multipart file）
portalDecoratorRouter.post(
  "/decorator/projects/:id/designs",
  requireDecorator,
  (req, _res, next) => { req.tenantId = req.decorator.tenantId; next(); },
  upload.single("file"),
  async (req, res, next) => {
    try {
      const project = await prisma.decorationProject.findFirst({
        where: { id: req.params.id, decoratorId: req.decorator.decoratorId },
      });
      if (!project) return res.status(404).json({ error: "project_not_found" });
      const { title, description } = req.body || {};
      if (!title) return res.status(400).json({ error: "title_required" });

      // 計算版本號
      const last = await prisma.design.findFirst({
        where: { projectId: project.id },
        orderBy: { version: "desc" },
      });
      const version = (last?.version || 0) + 1;

      const design = await prisma.design.create({
        data: {
          tenantId: project.tenantId,
          projectId: project.id,
          title,
          description: description || null,
          version,
          status: "pending",
        },
      });
      res.status(201).json(design);
    } catch (err) { next(err); }
  }
);
