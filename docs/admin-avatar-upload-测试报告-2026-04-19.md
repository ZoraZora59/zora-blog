# 管理端管理员头像上传功能测试报告（2026-04-19）

## 1. 目标

- 初始化当前云端容器中的本地开发环境。
- 创建并初始化本地测试数据库。
- 配置前后端本地 `.env`。
- 验证管理端“管理员头像上传”链路是否可用，并定位潜在故障环节。

## 2. 环境初始化过程

### 2.1 安装运行依赖

1. 安装 PostgreSQL 16（服务端 + 客户端）。
2. 启动数据库集群：`pg_ctlcluster 16 main start`。
3. 安装前后端 npm 依赖：
   - `cd frontend && npm install`
   - `cd backend && npm install`

### 2.2 创建本地测试数据库

已在本机 PostgreSQL 中创建并确认以下资源：

- 用户：`postgres`（密码已设置为 `postgres`，用于本地开发连接）
- 数据库：`zora_blog`
- 连接地址与项目默认配置一致：`postgresql://postgres:postgres@localhost:5432/zora_blog?schema=public`

### 2.3 本地 .env 配置

已基于示例文件生成：

- `backend/.env`（从 `backend/.env.example` 复制）
- `frontend/.env`（从 `frontend/.env.example` 复制）

并完成以下关键配置：

- `DATABASE_URL` 指向本地 PostgreSQL `zora_blog`
- `JWT_SECRET`、`API_KEY_SALT` 已替换为随机安全字符串
- 前端 `VITE_API_BASE_URL` 保持 `http://localhost:3001/api`

> 说明：`.env` 为本地敏感配置，不纳入 Git 提交。

### 2.4 数据库迁移与种子数据

在 `backend/` 执行：

- `npm run prisma:migrate`
- `npm run seed`

结果：

- Prisma 三个迁移已成功应用
- Seed 成功，默认管理员账号可登录（`admin / admin123456`）

## 3. 管理员头像上传功能验证

## 3.1 测试方法

采用后端真实服务 + HTTP 接口联调方式，覆盖“登录 -> 上传 -> 更新管理员头像 -> 访问图片”完整链路。

### 3.2 正向链路测试（通过）

1. `POST /api/auth/login`
   - 使用 `admin / admin123456` 登录成功（200）
   - 获取到认证 Cookie

2. `POST /api/admin/upload`（`multipart/form-data`，字段名 `file`）
   - 上传 PNG 成功（201）
   - 返回 `url`：`/uploads/1776610556614-d1806523-d528-4521-8cb3-de334c8e7b18.png`

3. `GET /uploads/{filename}`
   - 返回 200，`Content-Type: image/png`
   - 文件可被后端静态路由正常访问

4. `PUT /api/admin/profile`
   - 提交 `avatar: "/uploads/...png"`
   - 返回 200，管理员 `avatar` 字段已更新

结论：**管理员头像上传功能在本地环境可用，核心链路畅通。**

## 3.3 异常场景测试（用于定位可能故障点）

1. 未登录直接上传
   - `POST /api/admin/upload`
   - 返回 `401 未认证`
   - 说明：认证中间件生效

2. 上传非图片类型（`text/plain`）
   - 返回 `400 仅支持 jpg/png/webp/gif 图片`
   - 说明：MIME 白名单校验生效

3. 表单字段名错误（`avatar` 而非 `file`）
   - 返回 `400 缺少文件字段 file`
   - 说明：后端字段约定校验生效

## 4. 若线上出现“头像上传不可用”优先排查建议

按出现概率从高到低建议排查：

1. **请求是否带登录态（Cookie / Token）**
   - 现象：401 未认证

2. **前端上传字段名是否为 `file`**
   - 现象：400 缺少文件字段 file

3. **文件 MIME 类型是否在白名单**
   - 现象：400 仅支持 jpg/png/webp/gif 图片

4. **上传目录写权限与磁盘空间**
   - 本地通过，若线上失败需检查 `backend/uploads/` 挂载与权限

5. **反向代理是否放行 `/uploads/*`**
   - 现象：上传成功但头像 URL 无法访问

## 5. 最终结论

- 本次在云端容器中已完成本地环境初始化、数据库创建与 `.env` 配置。
- 管理端管理员头像上传功能在当前环境中验证 **可用**。
- 本次未复现功能缺陷；同时已通过异常用例明确各关键校验环节与错误返回，便于后续线上故障快速定位。
