import { PrismaClient } from "@prisma/client";
import { pbkdf2Sync, randomBytes } from "node:crypto";

const prisma = new PrismaClient();

function createPasswordHash(password) {
  const salt = randomBytes(16).toString("hex");
  const iterations = 210000;
  const keyLength = 64;
  const digest = "sha512";
  const hash = pbkdf2Sync(password, salt, iterations, keyLength, digest).toString("hex");

  return `pbkdf2:${digest}:${iterations}:${salt}:${hash}`;
}

const showrooms = [
  {
    name: "\u5317\u4eac\u516c\u53f8\u5c55\u5385",
    city: "\u5317\u4eac",
    type: "company",
    summary: "\u5c55\u793a\u516c\u53f8\u6838\u5fc3\u4e1a\u52a1\u3001\u4ea7\u54c1\u65b9\u6848\u4e0e\u5178\u578b\u6848\u4f8b",
    description: "\u9762\u5411\u5ba2\u6237\u96c6\u4e2d\u5c55\u793a\u516c\u53f8\u6838\u5fc3\u4e1a\u52a1\u3001\u4ea7\u54c1\u65b9\u6848\u3001\u884c\u4e1a\u80fd\u529b\u4e0e\u5178\u578b\u6848\u4f8b\u3002",
    address: "\u5317\u4eac\u516c\u53f8\u5c55\u5385\u5730\u5740\u5f85\u8865\u5145",
    openingHours: "\u5de5\u4f5c\u65e5 09:00-17:00",
    suggestedDuration: "1-2 \u5c0f\u65f6",
    status: "open",
    sortOrder: 1,
  },
  {
    name: "\u897f\u5b89\u516c\u53f8\u5c55\u5385",
    city: "\u897f\u5b89",
    type: "company",
    summary: "\u5c55\u793a\u533a\u57df\u4e1a\u52a1\u80fd\u529b\u3001\u884c\u4e1a\u89e3\u51b3\u65b9\u6848\u4e0e\u5ba2\u6237\u6848\u4f8b",
    description: "\u9762\u5411\u533a\u57df\u5ba2\u6237\u5c55\u793a\u672c\u5730\u5316\u4e1a\u52a1\u80fd\u529b\u3001\u884c\u4e1a\u89e3\u51b3\u65b9\u6848\u548c\u5ba2\u6237\u6848\u4f8b\u3002",
    address: "\u897f\u5b89\u516c\u53f8\u5c55\u5385\u5730\u5740\u5f85\u8865\u5145",
    openingHours: "\u5de5\u4f5c\u65e5 09:00-17:00",
    suggestedDuration: "1-2 \u5c0f\u65f6",
    status: "open",
    sortOrder: 2,
  },
  {
    name: "\u961c\u9633\u5b9e\u8bad\u57fa\u5730\u5c55\u5385",
    city: "\u961c\u9633",
    type: "training_base",
    summary: "\u5c55\u793a\u5b9e\u8bad\u73af\u5883\u3001\u6559\u5b66\u8bbe\u65bd\u4e0e\u5b9e\u8df5\u57f9\u8bad\u80fd\u529b",
    description: "\u96c6\u4e2d\u5c55\u793a\u5b9e\u8bad\u73af\u5883\u3001\u6559\u5b66\u8bbe\u65bd\u3001\u5b9e\u64cd\u573a\u666f\u4e0e\u5b9e\u8df5\u57f9\u8bad\u80fd\u529b\u3002",
    address: "\u961c\u9633\u5b9e\u8bad\u57fa\u5730\u5c55\u5385\u5730\u5740\u5f85\u8865\u5145",
    openingHours: "\u5de5\u4f5c\u65e5 09:00-17:00",
    suggestedDuration: "1-2 \u5c0f\u65f6",
    status: "open",
    sortOrder: 3,
  },
  {
    name: "\u65b0\u7586\u5b9e\u8bad\u57fa\u5730\u5c55\u5385",
    city: "\u65b0\u7586",
    type: "training_base",
    summary: "\u5c55\u793a\u57fa\u5730\u5efa\u8bbe\u6210\u679c\u3001\u5b9e\u8bad\u573a\u666f\u4e0e\u533a\u57df\u670d\u52a1\u80fd\u529b",
    description: "\u5c55\u793a\u57fa\u5730\u5efa\u8bbe\u6210\u679c\u3001\u5b9e\u8bad\u573a\u666f\u3001\u533a\u57df\u670d\u52a1\u80fd\u529b\u548c\u63a5\u5f85\u80fd\u529b\u3002",
    address: "\u65b0\u7586\u5b9e\u8bad\u57fa\u5730\u5c55\u5385\u5730\u5740\u5f85\u8865\u5145",
    openingHours: "\u5de5\u4f5c\u65e5 09:00-17:00",
    suggestedDuration: "1-2 \u5c0f\u65f6",
    status: "open",
    sortOrder: 4,
  },
];

const regions = [
  { name: "\u534e\u5357\u5927\u533a", color: "#0891b2", sortOrder: 1, provinces: ["\u5e7f\u4e1c\u7701", "\u798f\u5efa\u7701", "\u5e7f\u897f\u58ee\u65cf\u81ea\u6cbb\u533a"] },
  { name: "\u534e\u5317\u5927\u533a", color: "#2563eb", sortOrder: 2, provinces: ["\u5317\u4eac\u5e02", "\u6cb3\u5317\u7701", "\u5929\u6d25\u5e02", "\u5185\u8499\u53e4\u81ea\u6cbb\u533a"] },
  { name: "\u897f\u5317\u5927\u533a", color: "#7c3aed", sortOrder: 3, provinces: ["\u9655\u897f\u7701", "\u5b81\u590f\u56de\u65cf\u81ea\u6cbb\u533a", "\u7518\u8083\u7701", "\u65b0\u7586\u7ef4\u543e\u5c14\u81ea\u6cbb\u533a"] },
  { name: "\u534e\u4e2d\u5927\u533a", color: "#16a34a", sortOrder: 4, provinces: ["\u6e56\u5357\u7701", "\u6e56\u5317\u7701", "\u6c5f\u897f\u7701"] },
  { name: "\u534e\u4e2d\u4e8c\u533a", color: "#ca8a04", sortOrder: 5, provinces: ["\u5c71\u4e1c\u7701", "\u6cb3\u5357\u7701", "\u5c71\u897f\u7701"] },
  { name: "\u4e1c\u5317\u5927\u533a", color: "#0f766e", sortOrder: 6, provinces: ["\u9ed1\u9f99\u6c5f\u7701", "\u5409\u6797\u7701", "\u8fbd\u5b81\u7701"] },
  { name: "\u534e\u4e1c\u5927\u533a", color: "#dc2626", sortOrder: 7, provinces: ["\u5b89\u5fbd\u7701", "\u6c5f\u82cf\u7701", "\u6d59\u6c5f\u7701"] },
  { name: "\u897f\u5357\u5927\u533a", color: "#ea580c", sortOrder: 8, provinces: ["\u56db\u5ddd\u7701", "\u91cd\u5e86\u5e02", "\u4e91\u5357\u7701", "\u8d35\u5dde\u7701"] },
];

async function main() {
  for (const showroom of showrooms) {
    await prisma.showroom.upsert({
      where: { name: showroom.name },
      update: showroom,
      create: showroom,
    });
  }

  await prisma.adminUser.upsert({
    where: { username: "admin" },
    update: {
      realName: "\u7cfb\u7edf\u7ba1\u7406\u5458",
      role: "admin",
      status: "active",
    },
    create: {
      username: "admin",
      passwordHash: createPasswordHash("Admin@123456"),
      realName: "\u7cfb\u7edf\u7ba1\u7406\u5458",
      role: "admin",
      status: "active",
    },
  });

  for (const region of regions) {
    await prisma.$executeRaw`
      INSERT INTO regions (name, color, sort_order, created_at, updated_at)
      VALUES (${region.name}, ${region.color}, ${region.sortOrder}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT(name) DO UPDATE SET
        color = excluded.color,
        sort_order = excluded.sort_order,
        updated_at = CURRENT_TIMESTAMP
    `;

    const rows = await prisma.$queryRaw`
      SELECT id FROM regions WHERE name = ${region.name} LIMIT 1
    `;
    const regionId = rows[0]?.id;
    if (!regionId) continue;

    for (const province of region.provinces) {
      await prisma.$executeRaw`
        INSERT INTO province_regions (province, region_id, created_at, updated_at)
        VALUES (${province}, ${regionId}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT(province) DO UPDATE SET
          region_id = excluded.region_id,
          updated_at = CURRENT_TIMESTAMP
      `;
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });