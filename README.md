# 在线展厅预约管理系统

本项目基于《在线展厅预约管理系统 PRD》开发，技术栈为 Next.js、TypeScript、Tailwind CSS、Prisma 和 App Router。

当前已完成：

- 阶段 1：项目初始化、基础路由、用户端导航、后台侧边栏和静态占位页面。
- 阶段 2：Prisma 数据模型和初始 seed 数据。

尚未实现页面业务功能、登录逻辑、预约提交、后台审批、留资管理交互或展厅编辑逻辑。

## 启动项目

1. 安装依赖：

```bash
npm install
```

2. 创建环境变量文件：

```bash
cp .env.example .env
```

Windows PowerShell 可使用：

```powershell
Copy-Item .env.example .env
```

3. 初始化数据库并写入初始数据：

```bash
npm run prisma:deploy
npm run prisma:seed
```

## 展厅封面图上传

后台展厅管理页支持上传展厅封面图，图片会保存到服务器本地目录：

```text
public/uploads/showrooms
```

数据库 `showrooms.coverImage` 字段只保存可访问路径，例如：

```text
/uploads/showrooms/xxx.webp
```

上传限制：

- 推荐图片尺寸：1600×900px。
- 最低建议尺寸：1200×675px。
- 建议使用 16:9 横版图片。
- 支持格式：JPG、PNG、WebP。
- 最大文件大小：5MB。

公司服务器部署时，需要确保 `public/uploads/showrooms` 目录存在并具备写入权限。如果使用 PM2/Nginx 部署，需要确认 `/uploads/showrooms/*` 静态资源可以被正常访问。

4. 启动开发服务器：

```bash
npm run dev
```

5. 打开浏览器访问：

```text
http://localhost:3000
```

## 数据库命令

生成 Prisma Client：

```bash
npm run prisma:generate
```

创建或应用本地迁移：

```bash
npm run prisma:migrate -- --name init_database
```

应用已提交的迁移：

```bash
npm run prisma:deploy
```

阶段 9.5-3 新增迁移：

```text
20260519150000_add_customer_and_reception_fields
```

本迁移为 `appointments` 增加客户类型、关注方向、方案交流及内部接待安排字段，为 `leads` 增加客户线索沉淀字段。所有新增业务字段均为可选字段，已有预约、审批、留资和展厅数据可直接保留。更新代码后请先执行：

```bash
npm run prisma:deploy
npm run prisma:generate
```

执行 seed：

```bash
npm run prisma:seed
```

## 初始数据

seed 会预置 4 个展厅：

- 北京公司展厅
- 西安公司展厅
- 阜阳实训基地展厅
- 新疆实训基地展厅

seed 会预置 1 个后台管理员：

- 用户名：`admin`
- 初始密码：`Admin@123456`

密码使用 PBKDF2 哈希后写入 `passwordHash` 字段，不保存明文密码。

## 阶段 1 验收路由

- 用户端首页：`/`
- 展厅列表：`/showrooms`
- 展厅详情：`/showrooms/1`
- 在线预约：`/appointment`
- 预约成功：`/appointment/success`
- 后台登录：`/admin/login`
- 预约管理：`/admin/appointments`
- 预约详情：`/admin/appointments/1`
- 留资管理：`/admin/leads`
- 展厅管理：`/admin/showrooms`

## 可用命令

```bash
npm run dev
npm run build
npm run lint
npm run prisma:generate
npm run prisma:migrate -- --name init_database
npm run prisma:deploy
npm run prisma:seed
```
