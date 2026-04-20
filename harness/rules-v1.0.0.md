# Zora Blog v1.0.0 — Harness 规则总册

> 目标：固化 v1.0.0 的所有交付、验证、工具链与协作规则，让任何贡献者（人或 LLM）都能据此独立完成一个里程碑 PR。
>
> 入口文件：
> - 本文：[`harness/rules-v1.0.0.md`](/Users/didi/CodeBase/GithubCode/zora-blog/harness/rules-v1.0.0.md)
> - 自动验证脚本：[`scripts/verify-milestone.sh`](/Users/didi/CodeBase/GithubCode/zora-blog/scripts/verify-milestone.sh)
> - PR 模板：[`.github/pull_request_template.md`](/Users/didi/CodeBase/GithubCode/zora-blog/.github/pull_request_template.md)
> - 里程碑拆分：[`docs/milestone-pr-plan.md`](/Users/didi/CodeBase/GithubCode/zora-blog/docs/milestone-pr-plan.md)
> - 开发计划：[`docs/development-plan.md`](/Users/didi/CodeBase/GithubCode/zora-blog/docs/development-plan.md)
> - 需求：[`docs/PRD.md`](/Users/didi/CodeBase/GithubCode/zora-blog/docs/PRD.md)
> - 设计系统：[`docs/design-system.md`](/Users/didi/CodeBase/GithubCode/zora-blog/docs/design-system.md)

---

## 0. 范围与基线

- v1.0.0 = M1 后端基础 → M8 部署运维的完整闭环
- 所有交流、注释、commit message 使用中文
- 所有代码 TypeScript `strict: true`，前后端统一
- 产品定位、视觉风格以 PRD 与 design-system 为准，不在本文件重复

---

## 1. 仓库结构（npm workspaces monorepo）

```
zora-blog/
├── backend/                 Hono + Prisma + PostgreSQL 服务
├── frontend/                Vite + React 19 前台 + 管理后台
├── packages/
│   ├── sdk/                 @zora-blog/sdk   admin REST 客户端
│   ├── cli/                 @zora-blog/cli   zora-blog CLI
│   └── mcp/                 @zora-blog/mcp   MCP server（stdio + HTTP）
├── docs/                    PRD / design-system / milestone 计划 / stitch 原型
├── harness/                 里程碑 harness（本目录）
├── scripts/verify-milestone.sh
├── deploy/                  部署脚本 / nginx / pm2 / init-db
├── .github/workflows/       CI/CD
└── .claude/                 hooks 与项目级 Claude 设定
```

前后端内部目录：
- `frontend/src/`：`pages/`、`components/`、`components/ui/`、`components/layout/`、`hooks/`、`lib/`；`@/` → `src/`
- `backend/src/`：`routes/`、`services/`、`middleware/`、`lib/`；`@/` → `src/`；Prisma schema 在 `backend/prisma/`

---

## 2. 技术栈（v1.0.0 固定）

| 维度 | 前端 | 后端 |
| --- | --- | --- |
| 语言 | TypeScript 5（strict） | TypeScript 5（strict） |
| 运行时 / 框架 | React 19 + Vite 6 | Node.js 20+ + Hono |
| 数据 | — | Prisma + PostgreSQL |
| 样式 | Tailwind CSS 4（Vite 插件模式） | — |
| 图标 / 动画 | Lucide React / Motion | — |
| 认证 | Cookie + JWT | JWT + bcrypt，API Key 前缀 `zora_` |
| Markdown | react-markdown + remark-gfm + shiki | — |
| Lint | ESLint 9（typescript-eslint + react-hooks + react-refresh） | ESLint 9（typescript-eslint） |
| 格式化 | 根目录 `.prettierrc` | 根目录 `.prettierrc` |

---

## 3. 代码规范

### 通用
- commit message：`<type>: <描述>`，type ∈ feat / fix / refactor / docs / chore / ci
- 禁止提交 `.env`，以 `.env.example` 为准
- 提交前必须通过 `tsc --noEmit` 与 `eslint`（见第 6 节 hooks）
- 路径别名统一使用 `@/`

### 前端
- 函数式组件 + TypeScript；不使用 class 组件
- React 19 不需要 `import React`，按需导入 hooks
- 样式只用 Tailwind utility class，不写自定义 CSS
- 视觉 token 以 [`docs/design-system.md`](/Users/didi/CodeBase/GithubCode/zora-blog/docs/design-system.md) 为准
- 共享 UI 组件放 `src/components/ui/`，布局放 `src/components/layout/`，页面放 `src/pages/`
- 图标统一用 Lucide React

### 后端
- 路由放 `src/routes/`，业务逻辑放 `src/services/`
- 数据模型只在 `prisma/schema.prisma` 定义
- API 响应统一：`{ code: number, data: T, message: string }`
- 日志用 `console.warn`（信息）/ `console.error`（错误），禁用 `console.log`
- 认证中间件同时接受 Cookie JWT 与 `Authorization: Bearer`

---

## 4. 里程碑交付矩阵

依赖：M2、M3 依赖 M1；M4、M5 依赖 M2+M3；M6 依赖 M2+M3；M7 依赖 M2-M6；M8 依赖 M1-M7。
M2 与 M3 可并行；M4 与 M5 可并行。

| M | 分支 | 标题 | 必交付关键件 | 自动验证 | 手动证据 |
| --- | --- | --- | --- | --- | --- |
| M1 | `codex/m1-backend-foundation` | `feat: M1 后端基础` | `backend/` 脚手架、Prisma schema/seed、认证中间件、文章/分类/标签/上传 API | `verify-milestone.sh M1` + backend `lint/build` | curl 登录→签发 Token→文章 CRUD→上传；prisma studio |
| M2 | `codex/m2-frontend-foundation` | `feat: M2 前端基础` | React Router、API client、hooks、UI/Layout 组件、Home、ArticleDetail、Markdown+TOC+进度条 | `verify-milestone.sh M2` + frontend `lint/build` | 首页 / 详情 桌面+移动端截图对照 01/02/06 |
| M3 | `codex/m3-admin-console` | `feat: M3 B 端管理` | AdminLayout、路由守卫、Login、Dashboard、Posts、PostEditor、Settings | `verify-milestone.sh M3` + 前后端 `lint/build` | 未登录重定向；Quick Draft；编辑器发布到 C 端可见；对照 03/04/05 |
| M4 | `codex/m4-comments` | `feat: M4 评论系统` | 评论 API、C 端评论区、B 端评论管理 | `verify-milestone.sh M4` + 前后端 `lint/build` | 提交→pending→审核→C 端可见；对照 07 |
| M5 | `codex/m5-topics` | `feat: M5 专题系统` | Topic API、`/topics`、`/topics/:slug`、`admin/Topics`、`admin/TopicEditor` | `verify-milestone.sh M5` + 前后端 `lint/build` | 创建专题→关联文章→排序→前台展示；对照 08 |
| M6 | `codex/m6-extended-features` | `feat: M6 扩展功能` | `About`、`Search`（PG 全文搜索）、`useTheme`（Light/Dark/System） | `verify-milestone.sh M6` + 前后端 `lint/build` | 搜索命中+空状态；主题切换 localStorage 持久化 |
| M7 | `codex/m7-polish` | `feat: M7 体验打磨` | 移动端布局、MobileNav、动效、性能/无障碍 | `verify-milestone.sh M7` + 前后端 `lint/build` | 375/768/1280 断点巡检；Lighthouse Perf≥90、A11y≥90；动效对照 09/10/11 |
| M8 | `codex/m8-deploy` | `feat: M8 部署与运维` | CI/CD workflow、部署脚本、Nginx、PM2、备份/日志/监控说明 | `verify-milestone.sh M8` + workflow 配置检查 | 域名/HTTPS/`/api`/`/uploads`；迁移与重启步骤；workflow 运行记录 |

每个里程碑的 Stitch 原型映射见 [`docs/milestone-pr-plan.md`](/Users/didi/CodeBase/GithubCode/zora-blog/docs/milestone-pr-plan.md#原型图映射)。

---

## 5. Harness 工作流

### 5.1 脚本入口
```bash
./scripts/verify-milestone.sh --list
./scripts/verify-milestone.sh M1   # M1..M8
```
脚本产出两类结果：
- **自动检查**：关键目录/文件存在性 + `npm run lint` + `npm run build`
- **手动验证清单**：对应里程碑需要补的 curl / 截图 / 录屏 / Lighthouse

### 5.2 PR 证据清单（模板字段必填）
- [ ] 对应里程碑勾选
- [ ] `verify-milestone.sh Mx` 输出贴入"自动验证"
- [ ] 补充命令（如 frontend/backend `lint && build`）
- [ ] 手动验证结果
- [ ] 视觉/交互证据：截图 / 录屏 / Stitch 对照点
- [ ] 风险与未覆盖
- [ ] 回归关注点

### 5.3 PR 粒度约定
- 每个 M 单 PR，不跨里程碑混提
- 标题用表格中统一格式
- 分支名用表格中统一前缀

---

## 6. 质量闸门（Claude Code hooks）

配置在 [`.claude/settings.json`](/Users/didi/CodeBase/GithubCode/zora-blog/.claude/settings.json)。

| 时机 | 匹配 | 行为 |
| --- | --- | --- |
| PostToolUse | `Edit \| Write` 修改 `frontend/src/**/*.ts(x)` 或 `backend/src/**/*.ts(x)` | 自动跑 `tsc --noEmit` + `eslint <文件>`，输出尾部片段 |
| PreToolUse | `Bash` 且命令含 `git commit` | 在 frontend（有 backend 则并行）跑 `tsc --noEmit` + `eslint src/`，失败阻止提交（exit 2） |

提交前也可显式调用：
```bash
npm run lint         # 前后端全量 tsc + eslint
npm run format:check
```

### 6.1 CI 强制闸门
- Workflow：[`.github/workflows/harness.yml`](/Users/didi/CodeBase/GithubCode/zora-blog/.github/workflows/harness.yml)
- 触发：PR → `master`
- 行为：从 PR 标题解析 `M1..M8`，执行 `./scripts/verify-milestone.sh Mx`，失败则阻止合并
- 绕过：给 PR 打 `skip-harness` label（仅限 hotfix / 纯文档 / 工具链微调）
- 建议配合 branch protection：将 `Milestone Harness / verify-milestone.sh` 设为 required check

---

## 7. 命令速查

```bash
# monorepo 根
npm install
npm run dev:frontend         # http://localhost:3000
npm run dev:backend          # http://localhost:3001
npm run build:sdk            # CLI/MCP 依赖
npm run build:cli
npm run build:mcp
npm run lint                 # 前后端 tsc + eslint
npm run format
npm run format:check

# 里程碑验证
./scripts/verify-milestone.sh M1
```

---

## 8. API 与数据基线（v1.0.0）

- 认证：`POST /api/auth/login`、`POST /api/auth/logout`、`POST /api/auth/token`、`DELETE /api/auth/token`
- 文章：
  - C 端 `GET /api/articles`、`GET /api/articles/:slug`
  - B 端 `GET/POST/PUT/DELETE /api/admin/articles`
- 分类/标签：`GET /api/categories`、`GET /api/tags` + `/api/admin/*` CRUD
- 评论：`GET/POST /api/articles/:slug/comments`、`/api/admin/comments`（单条 + batch）
- 专题：`GET /api/topics`、`GET /api/topics/:slug`、`/api/admin/topics` CRUD（支持 `articleIds[]` + `sortOrder`）
- 搜索：`GET /api/search?q=&page=&limit=`（PostgreSQL `tsvector` + GIN）
- 站点：`GET /api/site`
- 上传：`POST /api/admin/upload`（multipart，jpg/png/webp/gif，≤5MB，返回 `/uploads/...`）

数据模型（Prisma）：`Admin`、`Article`、`Category`、`Tag`、`Topic`、`Comment`；多对多 `article_tags`（隐式）、`topic_articles`（显式含 `sortOrder`）。

---

## 9. 部署基线（M8）

- 服务器：Node.js 20+ / PostgreSQL / Nginx；后端以 pm2 或 systemd 守护
- Nginx 路由：`/api/*` → 后端；`/uploads/*` → 本地文件；其余 → SPA fallback `index.html`
- HTTPS：Let's Encrypt / Certbot
- CI/CD：GitHub Actions（`push` to `master` → 类型检查 → 构建 → SSH 部署 → 迁移 → 重启）
- 对象存储：七牛云（见 `deploy/` 与 `backend/src/routes/admin.ts` 上传链路）
- 备份：`pg_dump` 定时；日志：文件 + logrotate；监控：进程存活 + 磁盘

入口文件：[`deploy/deploy.sh`](/Users/didi/CodeBase/GithubCode/zora-blog/deploy/deploy.sh)、[`deploy/nginx.conf`](/Users/didi/CodeBase/GithubCode/zora-blog/deploy/nginx.conf)、[`deploy/ecosystem.config.js`](/Users/didi/CodeBase/GithubCode/zora-blog/deploy/ecosystem.config.js)、[`.github/workflows/deploy.yml`](/Users/didi/CodeBase/GithubCode/zora-blog/.github/workflows/deploy.yml)、[`docs/deploy-guide.md`](/Users/didi/CodeBase/GithubCode/zora-blog/docs/deploy-guide.md)。

---

## 10. v1.0.0 发版就绪 Checklist

- [ ] M1–M8 全部 PR 已合并，各 PR 证据齐备
- [ ] `npm run lint` 全绿
- [ ] `./scripts/verify-milestone.sh` 在 M1–M8 全通过
- [ ] Lighthouse：Performance ≥ 90、Accessibility ≥ 90
- [ ] 数据库迁移在生产环境完成一次演练
- [ ] `.env` 生产配置已备份，且未进仓库
- [ ] 七牛云 / 对象存储 key 生效
- [ ] 域名 + HTTPS + `/api` + `/uploads` 全部可访问
- [ ] 数据库备份脚本与日志轮转就位
- [ ] `README.md` changelog 新增 v1.0.0 条目

---

## 11. 后续演进（v1.0.0 之后）

harness 当前为轻量版，后续按需补：
- Playwright 页面冒烟与视觉回归
- 后端 curl / HTTPie smoke 脚本
- 基于 seed 数据的固定验收集
- CI 中按 M 分层跑 harness
