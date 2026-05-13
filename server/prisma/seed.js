// 精簡 seed — 只建立 vendor + decorator flow 需要的資料
// 不需要 bcrypt / users / admin 相關
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // ─── Tenant ───
  console.log("→ tenant");
  await prisma.tenant.upsert({
    where: { id: "c-1" },
    update: { name: "群揚資通股份有限公司" },
    create: {
      id: "c-1",
      name: "群揚資通股份有限公司",
      taxId: "12345678",
      industry: "資訊服務業",
      status: "active",
    },
  });

  // ─── Event ───
  console.log("→ event");
  await prisma.event.upsert({
    where: { id: "e-1" },
    update: { name: "2026 台北國際電腦展" },
    create: {
      id: "e-1", tenantId: "c-1",
      name: "2026 台北國際電腦展", type: "實體展覽",
      startDate: new Date("2026-06-04"),
      endDate: new Date("2026-06-07"),
      location: "TWTC 南港展覽館一館",
      status: "active",
    },
  });

  // ─── Sponsorship Packages ───
  console.log("→ sponsorship_packages");
  const packages = [
    {
      id: "sp-booth-c1", type: "booth", name: "攤位贊助", price: 80000,
      description: "於活動現場設置展攤，與參與者直接互動，提升品牌曝光。",
      benefits: ["標準展位 9 m²", "參展手冊 logo 露出", "電源/桌椅基本配置"],
      sortOrder: 1,
    },
    {
      id: "sp-talk-c1", type: "talk", name: "演講贊助", price: 120000,
      description: "於大會中安排專題演講，展現專業見解，建立品牌權威形象。",
      benefits: ["30 分鐘專題演講", "官網講者頁露出", "簡報檔案散發"],
      sortOrder: 2,
    },
    {
      id: "sp-ad-c1", type: "ad", name: "廣告贊助", price: 50000,
      description: "透過多元廣告版位曝光，強化品牌能見度與市場影響力。",
      benefits: ["官網首頁 banner 30 天", "EDM 廣告露出 2 次", "社群媒體聯合貼文"],
      sortOrder: 3,
    },
  ];
  for (const p of packages) {
    await prisma.sponsorshipPackage.upsert({
      where: { id: p.id },
      update: { ...p, tenantId: "c-1", active: true, recommended: false },
      create: { ...p, tenantId: "c-1", active: true, recommended: false },
    });
  }

  // ─── Vendors（給統編登入用） ───
  console.log("→ vendors");
  const vendors = [
    { id: "v-1",  company: "台灣積體電路製造", taxId: "22099131", contact: "李建國", email: "jianguo.li@tsmc.com",  phone: "03-5636688" },
    { id: "v-2",  company: "聯發科技",         taxId: "24566673", contact: "陳家豪", email: "jiahao.chen@mtk.com", phone: "03-5670766" },
    { id: "v-10", company: "技嘉科技",         taxId: "85171161", contact: "劉光宇", email: "guangyu@gigabyte.com", phone: "02-89124000" },
    { id: "v-11", company: "威剛科技",         taxId: "70725830", contact: "黃德偉", email: "dewei@adata.com",      phone: "02-87528800" },
  ];
  for (const v of vendors) {
    await prisma.vendor.upsert({
      where: { id: v.id },
      update: { ...v, tenantId: "c-1", eventId: "e-1" },
      create: { ...v, tenantId: "c-1", eventId: "e-1", status: "registered" },
    });
  }

  // ─── Decorators（用於 taxId lookup 測試 / 既有裝潢商登入） ───
  console.log("→ decorators");
  const decorators = [
    { id: "d-1", name: "築境空間設計", taxId: "44556677", email: "jian@zhuying-design.com", phone: "02-2706-8899", contact: "蔡建築" },
    { id: "d-2", name: "設計工坊",     taxId: "55667700", email: "info@designstudio.com",   phone: "02-1234-5678", contact: "張設計" },
    { id: "d-3", name: "創藝展場",     taxId: "66778800", email: "hi@creative-arts.com",    phone: "02-8765-4321", contact: "林展場" },
  ];
  for (const d of decorators) {
    await prisma.decorator.upsert({
      where: { id: d.id },
      update: { ...d, tenantId: "c-1" },
      create: { ...d, tenantId: "c-1", status: "active" },
    });
  }

  // ─── Document Templates + EventDocument 連結 ───
  console.log("→ document_templates + event_documents");
  const templates = [
    { id: "dt-1", category: "基本資料", name: "公司 Logo（高解析）", formats: ".png,.svg,.ai", required: true,  sortOrder: 1 },
    { id: "dt-2", category: "基本資料", name: "公司簡介 PDF",         formats: ".pdf",          required: true,  sortOrder: 2 },
    { id: "dt-3", category: "基本資料", name: "產品型錄",              formats: ".pdf,.pptx",   required: true,  sortOrder: 3 },
    { id: "dt-4", category: "展位相關", name: "攤位設計圖",           formats: ".pdf,.dwg,.png", required: true, sortOrder: 4 },
    { id: "dt-5", category: "展位相關", name: "施工申請",              formats: ".pdf",          required: false, sortOrder: 5 },
    { id: "dt-6", category: "法規文件", name: "切結書",                formats: ".pdf",          required: true,  sortOrder: 6 },
  ];
  for (const t of templates) {
    await prisma.documentTemplate.upsert({
      where: { id: t.id },
      update: { category: t.category, name: t.name, formats: t.formats, required: t.required, sortOrder: t.sortOrder },
      create: { id: t.id, tenantId: "c-1", ...t },
    });
    await prisma.eventDocument.upsert({
      where: { eventId_templateId: { eventId: "e-1", templateId: t.id } },
      update: { required: t.required, deadline: new Date("2026-05-01") },
      create: {
        eventId: "e-1", templateId: t.id, tenantId: "c-1",
        required: t.required, deadline: new Date("2026-05-01"),
      },
    });
  }

  // ─── Counts ───
  const c = await Promise.all([
    prisma.tenant.count(),
    prisma.event.count(),
    prisma.vendor.count(),
    prisma.decorator.count(),
    prisma.sponsorshipPackage.count(),
    prisma.documentTemplate.count(),
    prisma.eventDocument.count(),
  ]);
  console.log("\n✓ Seed complete");
  console.log("counts:", {
    tenants: c[0], events: c[1], vendors: c[2],
    decorators: c[3], packages: c[4],
    docTemplates: c[5], eventDocs: c[6],
  });
  console.log("\nDemo logins:");
  console.log("  Vendor:   taxId=22099131 / 24566673 / 85171161 / 70725830");
  console.log("  Decorator: taxId=44556677 / 55667700 / 66778800");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
