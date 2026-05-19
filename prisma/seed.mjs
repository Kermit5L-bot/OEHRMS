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
    name: "北京公司展厅",
    city: "北京",
    type: "company",
    summary: "展示公司核心业务、产品方案与典型案例",
    description: "面向客户集中展示公司核心业务、产品方案、行业能力与典型案例。",
    address: "北京公司展厅地址待补充",
    openingHours: "工作日 09:00-17:00",
    suggestedDuration: "1-2 小时",
    status: "open",
    sortOrder: 1,
  },
  {
    name: "西安公司展厅",
    city: "西安",
    type: "company",
    summary: "展示区域业务能力、行业解决方案与客户案例",
    description: "面向区域客户展示本地化业务能力、行业解决方案和客户案例。",
    address: "西安公司展厅地址待补充",
    openingHours: "工作日 09:00-17:00",
    suggestedDuration: "1-2 小时",
    status: "open",
    sortOrder: 2,
  },
  {
    name: "阜阳实训基地展厅",
    city: "阜阳",
    type: "training_base",
    summary: "展示实训环境、教学设施与实践培训能力",
    description: "集中展示实训环境、教学设施、实操场景与实践培训能力。",
    address: "阜阳实训基地展厅地址待补充",
    openingHours: "工作日 09:00-17:00",
    suggestedDuration: "1-2 小时",
    status: "open",
    sortOrder: 3,
  },
  {
    name: "新疆实训基地展厅",
    city: "新疆",
    type: "training_base",
    summary: "展示基地建设成果、实训场景与区域服务能力",
    description: "展示基地建设成果、实训场景、区域服务能力和接待能力。",
    address: "新疆实训基地展厅地址待补充",
    openingHours: "工作日 09:00-17:00",
    suggestedDuration: "1-2 小时",
    status: "open",
    sortOrder: 4,
  },
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
      realName: "系统管理员",
      role: "admin",
      status: "active",
    },
    create: {
      username: "admin",
      passwordHash: createPasswordHash("Admin@123456"),
      realName: "系统管理员",
      role: "admin",
      status: "active",
    },
  });
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
