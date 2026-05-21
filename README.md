# 在线展厅预约管理系统（OEHRMS）

本项目是一个基于 Next.js App Router 的在线展厅预约管理系统，覆盖“用户预约 + 后台审核 + 线索管理 + 展厅管理 + 经营看板”主流程。

技术栈：
- Next.js 16（App Router）
- React 19
- TypeScript
- Tailwind CSS 4
- Prisma 6 + SQLite

---

## 一、当前实现范围（基于代码现状）

### 1) 用户端
- 首页：`/`
- 展厅列表：`/showrooms`
- 展厅详情：`/showrooms/[id]`
- 在线预约：`/appointment`
- 预约成功页：`/appointment/success`

### 2) 管理后台
- 后台登录：`/admin/login`
- 后台入口：`/admin`（进入仪表盘）
- 经营看板：`/admin/dashboard`
- 预约管理：`/admin/appointments`
- 预约详情：`/admin/appointments/[id]`
- 线索管理：`/admin/leads`
- 展厅管理：`/admin/showrooms`

### 3) 主要后台 API（已存在）
- 用户预约提交：`POST /api/appointments`
- 后台登录：`POST /api/admin/login`
- 后台登出：`POST /api/admin/logout`
- 后台预约列表：`GET /api/admin/appointments`
- 预约详情更新：`PATCH /api/admin/appointments/[id]`
- 审批动作：
  - `POST /api/admin/appointments/[id]/approve`
  - `POST /api/admin/appointments/[id]/reject`
  - `POST /api/admin/appointments/[id]/complete`
  - `POST /api/admin/appointments/[id]/reception-note`
- 线索列表：`GET /api/admin/leads`
- 线索跟进备注：`PATCH /api/admin/leads/[id]/follow-up-note`
- 展厅管理：
  - `GET /api/admin/showrooms`
  - `POST /api/admin/showrooms`
  - `PUT /api/admin/showrooms/[id]`
  - `PATCH /api/admin/showrooms/[id]/status`
- 看板汇总：`GET /api/admin/dashboard/summary`
- 展厅封面上传：`POST /api/admin/upload/showroom-cover`

---

## 二、快速启动

### 1) 安装依赖
```bash
npm install
```

### 2) 配置环境变量
```bash
cp .env.example .env
```

Windows PowerShell：
```powershell
Copy-Item .env.example .env
```

`.env.example` 当前示例：
```env
DATABASE_URL="file:./dev.db"
```

### 3) 初始化数据库与种子数据
```bash
npm run prisma:deploy
npm run prisma:generate
npm run prisma:seed
```

### 4) 启动开发环境
```bash
npm run dev
```

访问：`http://localhost:3000`

---

## 三、可用脚本

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run prisma:generate
npm run prisma:migrate -- --name <migration_name>
npm run prisma:deploy
npm run prisma:seed
```

说明：
- 本地开发新增字段时，通常使用 `prisma:migrate`。
- 线上/部署环境应用已提交迁移，使用 `prisma:deploy`。

---

## 四、数据库模型与关键状态

### 1) 展厅状态（ShowroomStatus）
- `open`：开放预约，对用户可见，可提交预约
- `closed`：暂停预约，对用户可见，不可提交预约
- `hidden`：后台可见，用户端隐藏
- `deleted`：软删除状态，默认不在后台列表展示（可筛选）

### 2) 预约状态（AppointmentStatus）
- `pending`
- `approved`
- `rejected`
- `completed`
- `cancelled`

### 3) 其他关键点
- 后台账号角色：`admin` / `marketer`
- 后台登录态：Cookie Session（服务端校验）
- 预约、线索、展厅之间存在关联关系（见 `prisma/schema.prisma`）

---

## 五、展厅封面上传说明

- 上传目录：`public/uploads/showrooms`
- 数据库存储：`showrooms.coverImage` 保存可访问路径（例如 `/uploads/showrooms/xxx.webp`）
- 建议运维检查：
  - 目录存在并具备写权限
  - 反向代理/静态资源配置允许访问 `/uploads/showrooms/*`

---

## 六、Seed 初始数据

`npm run prisma:seed` 会写入：
- 4 个示例展厅（北京、西安、阜阳、新乡）
- 1 个后台管理员账号：
  - 用户名：`admin`
  - 初始密码：`Admin@123456`

安全说明：密码写入数据库时为哈希值，不保存明文。

---

## 七、已知注意事项（客观）

- 历史文件曾出现中文编码错配导致乱码。当前 README 已改为 UTF-8 文本。
- 如果页面仍出现中文乱码，请确认编辑器/终端文件编码均为 UTF-8。

---

## 八、项目目录（核心）

```text
src/
  app/                    # 页面与 API 路由（App Router）
  components/             # UI 与表单组件
  lib/                    # 业务逻辑、鉴权、数据访问
prisma/
  schema.prisma           # 数据模型
  migrations/             # 迁移脚本
  seed.mjs                # 初始化数据
public/
  uploads/showrooms/      # 展厅封面上传目录
```
