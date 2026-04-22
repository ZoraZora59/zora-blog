# 开发计划 (Development Plan)

> **项目**：Zora Blog — 程序员猫奴露营博客
> **日期**：2026-04-14
> **参考文档**：[PRD](./PRD.md) · [设计系统](./design-system.md) · 设计稿 `docs/stitch/`
>
> **阅读说明**：本文档供 Claude Code 和开发者使用。每个任务标注了输入产物、输出产物和验收标准，LLM 可据此判断任务是否完成。

---

## 总览

```
M1 后端基础        ████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  独立可运行
M2 前端基础        ░░░░░░░░████████░░░░░░░░░░░░░░░░░░░░░░░░  依赖 M1
M3 B端管理         ░░░░░░░░████████░░░░░░░░░░░░░░░░░░░░░░░░  依赖 M1，与 M2 并行
M4 评论系统        ░░░░░░░░░░░░░░░░████░░░░░░░░░░░░░░░░░░░░  依赖 M2+M3
M5 专题系统        ░░░░░░░░░░░░░░░░████░░░░░░░░░░░░░░░░░░░░  依赖 M2+M3，与 M4 并行
M6 扩展功能        ░░░░░░░░░░░░░░░░░░░░████░░░░░░░░░░░░░░░░  依赖 M2+M3
M7 打磨            ░░░░░░░░░░░░░░░░░░░░░░░░████░░░░░░░░░░░░  依赖 M2-M6
M8 部署            ░░░░░░░░░░░░░░░░░░░░░░░░░░░░████░░░░░░░░  依赖 M1-M7
M9 数据分析        ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░████████  依赖 M8（线上有真实流量）
```

**并行关系**：M2 与 M3 可并行；M4 与 M5 可并行。M9 通常在 M8 部署上线后启动，但 M9.1（数据模型）和 M9.2（采集 API）可在 M8 之前提前完成。

---

## M1 — 后端基础

> 目标：后端项目从零搭建，数据库就绪，认证和文章 CRUD API 可通过 curl 测试。

### M1.1 项目初始化

- [ ] 创建 `backend/` 目录结构（遵循 AGENTS.md 规范）
  ```
  backend/
  ├── src/
  │   ├── index.ts          # Hono 入口
  │   ├── routes/            # 路由定义
  │   ├── services/          # 业务逻辑
  │   ├── middleware/         # 中间件（认证、错误处理）
  │   └── lib/               # 工具函数（密码哈希、JWT、分页等）
  ├── prisma/
  │   └── schema.prisma
  ├── package.json
  └── tsconfig.json
  ```
- [ ] 初始化 `package.json`，安装依赖：
  - 运行时：`hono`、`@hono/node-server`
  - ORM：`prisma`、`@prisma/client`
  - 认证：`jsonwebtoken`（或 `hono/jwt`）、`bcrypt`
  - 开发：`typescript`、`tsx`（开发热重载）、`@types/node`
- [ ] 配置 `tsconfig.json`（strict mode，paths alias）
- [ ] 配置 `package.json` scripts：`dev`、`build`、`lint`（tsc --noEmit）
- [ ] 创建 `.env.example`：`DATABASE_URL`、`JWT_SECRET`、`API_KEY_SALT`

**验收**：`cd backend && npm run dev` 启动成功，访问 `http://localhost:3001` 返回 `{ "message": "Zora Blog API" }`

### M1.2 数据库模型

- [ ] 编写 `prisma/schema.prisma`，定义全部 6 个实体 + 2 个关联表：
  - `Admin`（含 apiKey、apiKeyPrefix 字段）
  - `Article`、`Category`、`Tag`、`Topic`、`Comment`
  - `article_tags`（隐式多对多）
  - `topic_articles`（显式多对多，含 sortOrder）
- [ ] 配置 PostgreSQL 连接（开发环境本地或 Docker）
- [ ] `npx prisma migrate dev --name init` 生成初始迁移
- [ ] 编写 `prisma/seed.ts`：创建默认 Admin 账户 + 几篇示例文章 + 分类 + 标签

**验收**：`npx prisma studio` 可查看所有表结构，seed 数据已入库

### M1.3 通用中间件

- [ ] 错误处理中间件：统一 `{ code, data, message }` 响应格式
- [ ] 认证中间件：
  - 解析 Cookie 中的 JWT **或** `Authorization: Bearer <token>` 头
  - 校验通过后将 admin 信息注入 context
- [ ] 请求日志中间件（可选，开发环境）
- [ ] CORS 中间件（开发环境允许 `localhost:3000`）

**验收**：无 token 访问 `/api/admin/*` 返回 `{ code: 401, message: "未认证" }`

### M1.4 认证 API

- [ ] `POST /api/auth/login` — 用户名+密码登录，返回 JWT（HttpOnly Cookie）
- [ ] `POST /api/auth/logout` — 清除 Cookie
- [ ] `POST /api/auth/token` — 生成 API Key（仅 Cookie 认证可调用），返回明文 key（仅此一次）
- [ ] `DELETE /api/auth/token` — 吊销 API Key
- [ ] JWT 工具函数：签发、验证、刷新

**验收**：
```bash
# Cookie 登录
curl -c cookies.txt -X POST localhost:3001/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"xxx"}'
# 生成 API Key
curl -b cookies.txt -X POST localhost:3001/api/auth/token
# Bearer Token 访问
curl -H 'Authorization: Bearer zora_xxxx' localhost:3001/api/admin/articles
```

### M1.5 文章 CRUD API

- [ ] C端：
  - `GET /api/articles` — 分页、分类/标签筛选、排序
  - `GET /api/articles/:slug` — 文章详情（含标签、分类，浏览量 +1）
- [ ] B端：
  - `GET /api/admin/articles` — 含草稿，支持 `?status=&sort=&order=&limit=&offset=`
  - `POST /api/admin/articles` — 创建文章，`content` 接受 Markdown 原文，slug 可选（自动生成）
  - `PUT /api/admin/articles/:id` — 更新文章（幂等）
  - `DELETE /api/admin/articles/:id` — 删除文章
- [ ] 辅助 API：
  - `GET /api/categories`、`CRUD /api/admin/categories`
  - `GET /api/tags`（自动从文章标签聚合）、`CRUD /api/admin/tags`

**验收**：通过 curl 完成完整的文章生命周期——创建草稿 → 更新内容 → 发布 → C端查看 → 删除

### M1.6 图片上传 API

- [ ] `POST /api/admin/upload` — multipart/form-data 上传
- [ ] 校验文件类型（jpg/png/webp/gif）和大小（≤5MB）
- [ ] 存储到本地磁盘 `uploads/` 目录
- [ ] 返回可访问的 URL（`/uploads/filename.jpg`）
- [ ] Hono 配置静态文件服务 `uploads/`

**验收**：上传图片后，返回的 URL 可在浏览器直接访问

---

## M2 — 前端基础

> 目标：重构现有前端原型为正式项目结构，实现设计系统组件库、前端路由、首页和文章详情页，对接后端 API。
>
> **现状**：`frontend/src/components/` 已有 6 个原型组件（Discover、ArticleDetail、ArticleEditor、ContentManagement、Configuration、Sidebar），使用 mock 数据，无路由，通过 App.tsx 的 state 切换视图。

### M2.1 前端架构升级

- [ ] 安装路由：`react-router-dom`
- [ ] 将 App.tsx 从 state 切换改为 React Router（`/`、`/articles/:slug`、`/topics`、`/about` 等）
- [ ] 创建 API 客户端层 `src/lib/api.ts`（封装 fetch，统一错误处理）
- [ ] 创建 `src/hooks/` 目录，抽取通用 hooks（`useArticles`、`useArticle` 等）
- [ ] 安装 Markdown 渲染链：`react-markdown`、`remark-gfm`、`rehype-shiki`（或 `shiki`）

**验收**：`npm run dev` 启动，浏览器访问 `/` 和 `/articles/test` 能正确路由

### M2.2 设计系统实现

- [ ] 更新 `index.css`：注册 CSS Variables（Light + Dark）和 `@theme` 自定义 token
- [ ] 引入 Google Fonts：Space Grotesk + Inter + JetBrains Mono
- [ ] 创建 `src/components/ui/` 共享组件：
  - `Button.tsx` — Primary / Secondary / Ghost / Danger / Icon 变体，sm / md / lg 尺寸
  - `Card.tsx` — 基础卡片容器
  - `Input.tsx` — 文本输入框 + Textarea
  - `Badge.tsx` — 标签/状态徽章
  - `ArticleCard.tsx` — 文章卡片（Featured 大卡 + 标准卡）
  - `ThemeToggle.tsx` — Dark Mode 切换按钮
- [ ] 创建 `src/components/layout/` 布局组件：
  - `Navbar.tsx` — C端顶部导航栏（Glassmorphism、搜索入口、Dark Mode 切换）
  - `Footer.tsx` — 底部（社交链接）
  - `MobileNav.tsx` — 移动端底部导航
  - `CLayout.tsx` — C端统一布局（Navbar + main + Footer）

**验收**：UI 组件在 Light/Dark 两种模式下视觉正确，符合 `docs/design-system.md` 规范

### M2.3 首页 (Home)

- [ ] 重构 `Discover.tsx` → `src/pages/Home.tsx`
- [ ] Hero 区域：全宽大图 + Slogan + 动效入场
- [ ] 文章列表：对接 `GET /api/articles`，Featured 大卡 + 标准卡片 2 列网格
- [ ] 分类快捷筛选标签
- [ ] 搜索框（导航栏内，跳转到 `/search?q=`）
- [ ] 滚动加载更多 / 分页

**验收**：对照 `docs/stitch/01-home.png` 视觉还原，文章数据来自后端 API

### M2.4 文章详情页 (Article Detail)

- [ ] 重构 `ArticleDetail.tsx` → `src/pages/ArticleDetail.tsx`
- [ ] 文章头部：分类标签、日期、阅读量、标题、作者信息
- [ ] 封面图：全宽 `rounded-xl`
- [ ] 阅读进度条：顶部固定，滚动更新
- [ ] 正文渲染：`react-markdown` + `remark-gfm` + Shiki 代码高亮
  - 代码块：语言标签 + 行号 + 一键复制
  - 表格：表头样式、斑马纹、移动端水平滚动
  - 嵌入内容：`::bilibili[BVxxx]` / `::youtube[xxx]` 自定义 remark 插件
- [ ] 侧边栏 TOC：自动生成、点击平滑滚动、当前位置高亮
- [ ] 文章底部：标签列表 + 上/下一篇导航

**验收**：对照 `docs/stitch/02-article-detail.png` 视觉还原，Markdown 各格式渲染正确，代码块复制功能正常

---

## M3 — B端管理

> 目标：管理后台完整可用，博主可通过 Web UI 管理文章、查看数据。
>
> **与 M2 并行开发**，共享 M2.2 的 UI 组件库。

### M3.1 B端布局与路由

- [ ] 创建 `src/components/layout/AdminLayout.tsx`（左侧边栏 + 主内容区）
- [ ] 重构 `Sidebar.tsx` 为 B 端侧边栏（Dashboard / Posts / Comments / Topics / Settings）
- [ ] B 端路由守卫：未登录跳转 `/login`
- [ ] 登录页 `src/pages/Login.tsx`（对照 `docs/stitch/05-login.png`）

**验收**：未登录访问 `/admin` 重定向到 `/login`，登录后进入 Dashboard

### M3.2 Admin Dashboard

- [ ] 重构 `Configuration.tsx` → `src/pages/admin/Dashboard.tsx`
- [ ] 对接 `GET /api/admin/dashboard`：总浏览量、点赞数、评论数、周增长
- [ ] Quick Draft 区块：标题 + 内容 → 调用 `POST /api/admin/articles`
- [ ] Reach Analysis 图表（可用轻量图表库如 recharts）
- [ ] Recent Feedback 列表
- [ ] Last Published 卡片

**验收**：对照 `docs/stitch/03-admin-dashboard.png` 视觉还原，统计数据来自后端

### M3.3 Content Manager

- [ ] 重构 `ContentManagement.tsx` → `src/pages/admin/Posts.tsx`
- [ ] 顶部统计卡片：总文章数、已发布、草稿、总阅读量
- [ ] 文章表格：缩略图+标题、状态、日期、浏览量、操作
- [ ] 工具栏：搜索、状态筛选
- [ ] 分页
- [ ] 操作：编辑（跳转编辑器）、查看（新窗口打开 C 端）、删除（确认对话框）

**验收**：对照 `docs/stitch/04-content-manager.png`，表格数据来自 `GET /api/admin/articles`

### M3.4 文章编辑器

- [ ] 重构 `ArticleEditor.tsx` → `src/pages/admin/PostEditor.tsx`
- [ ] 标题输入（大字号，无边框）
- [ ] Markdown 编辑器 + 实时预览（复用 M2.4 的 Markdown 渲染组件）
- [ ] 侧边栏设置：分类、标签、封面图上传、摘要、关联专题、URL slug
- [ ] 操作：保存草稿、发布/更新、预览
- [ ] 自动保存（30 秒间隔）
- [ ] 嵌入内容语法提示（工具栏按钮插入 `::bilibili[]`、`::youtube[]` 模板）

**验收**：创建文章 → Markdown 预览正确 → 上传封面图 → 发布 → C 端可见

### M3.5 系统设置

- [ ] `src/pages/admin/Settings.tsx`
- [ ] 个人资料编辑：昵称、职业描述、头像、简介
- [ ] 博客设置：标题、描述、Logo
- [ ] 评论设置：是否开启审核
- [ ] API Key 管理：生成/吊销，显示 key 前缀

**验收**：修改设置后 C 端 `/api/site` 返回更新后的数据；API Key 生成后可用 Bearer Token 访问 API

---

## M4 — 评论系统

> 目标：读者可在文章下评论，博主可在后台审核。

### M4.1 评论 API

- [ ] `GET /api/articles/:slug/comments` — 仅返回 approved 评论
- [ ] `POST /api/articles/:slug/comments` — 提交评论（昵称+邮箱+内容）
  - 邮箱格式校验
  - 内容 XSS 过滤
  - 默认状态：pending
- [ ] `GET /api/admin/comments` — 全部评论，支持状态/文章筛选
- [ ] `PUT /api/admin/comments/:id` — 审核（approve / reject）
- [ ] `PUT /api/admin/comments/batch` — 批量审核
- [ ] `DELETE /api/admin/comments/:id` — 删除

**验收**：提交评论 → 后台可见待审核 → 审核通过 → C 端可见

### M4.2 C端评论区

- [ ] 评论输入表单：昵称 + 邮箱 + 内容 + 提交
- [ ] 提交后提示"评论已提交，等待审核"
- [ ] 评论列表：头像（Gravatar / 默认）、昵称、时间、内容
- [ ] 按时间倒序

**验收**：在文章详情页底部，评论表单和列表正常工作

### M4.3 B端评论管理

- [ ] `src/pages/admin/Comments.tsx`
- [ ] 评论列表：评论者、邮箱、内容、来源文章、状态、操作
- [ ] 筛选：按状态、按文章
- [ ] 右侧 Engagement 统计面板
- [ ] 批量审核操作

**验收**：对照 `docs/stitch/07-comment-mgmt.png`，审核操作实时生效

---

## M5 — 专题系统

> 目标：博主可创建专题并关联文章，读者可浏览专题页。与 M4 并行。

### M5.1 专题 API

- [ ] C端：`GET /api/topics`、`GET /api/topics/:slug`（含关联文章）
- [ ] B端：`CRUD /api/admin/topics`
  - 创建/编辑：标题、描述、封面图、slug
  - 关联文章：传入 `articleIds[]` + `sortOrder`

### M5.2 C端专题页

- [ ] 专题列表页 `/topics`：卡片布局
- [ ] 专题详情页 `/topics/:slug`：
  - Hero：专题标题 + 描述
  - 文章网格：不规则布局（大小混排），体现 Organic Brutalism

**验收**：对照 `docs/stitch/08-sports-gear.png` 视觉还原

### M5.3 B端专题管理

- [ ] `src/pages/admin/Topics.tsx` — 专题列表
- [ ] `src/pages/admin/TopicEditor.tsx` — 新建/编辑专题
  - 标题、描述、封面图上传
  - 关联文章多选（从已发布文章中选择，支持搜索）
  - 拖拽排序关联文章

**验收**：创建专题 → 关联文章 → C 端专题页展示正确

---

## M6 — 扩展功能

> 目标：关于页、搜索、Dark Mode 全部就绪。

### M6.1 关于页 (About)

- [ ] `src/pages/About.tsx`
- [ ] 博主头像 + 昵称 + Slogan
- [ ] 个人介绍（Markdown 渲染，复用文章正文渲染组件）
- [ ] 技能/兴趣标签云
- [ ] 社交链接图标按钮
- [ ] 数据来源：`GET /api/site`

**验收**：`/about` 页面展示完整，数据来自后台设置

### M6.2 搜索

- [ ] 后端：PostgreSQL 全文搜索
  - 给 Article 表添加 `tsvector` 列和 GIN 索引
  - `GET /api/search?q=&page=&limit=` — 返回匹配文章 + 高亮片段
- [ ] 前端：
  - `src/pages/Search.tsx` — 搜索结果页
  - 结果卡片：标题和摘要高亮关键词
  - 结果数量 + 空状态处理
  - 搜索历史（localStorage，最近 10 条）
  - 导航栏搜索框 debounce（300ms）

**验收**：输入关键词 → 搜索结果正确返回并高亮 → 空结果有友好提示

### M6.3 Dark Mode

- [ ] 实现主题切换逻辑：
  - `src/hooks/useTheme.ts` — Light / Dark / System 三模式
  - 读取/存储 localStorage，监听 `prefers-color-scheme` 媒体查询
  - 在 `<html>` 标签上切换 `dark` class
- [ ] `ThemeToggle.tsx` 组件：Sun / Moon 图标切换，带动画
- [ ] 全局 CSS transition：`transition-colors duration-300`
- [ ] 逐一检查所有页面和组件的 Dark Mode 样式

**验收**：三种模式切换正常，刷新后保持选择，所有页面 Dark 模式下无可读性问题

---

## M7 — 打磨

> 目标：移动端适配、动效、SEO、性能优化、无障碍。

### M7.1 移动端适配

- [ ] 所有 C 端页面在 375px-768px 宽度下布局正确
- [ ] 移动端底部导航栏（首页 / 专题 / 搜索）
- [ ] 汉堡菜单（导航抽屉）
- [ ] 文章卡片单列
- [ ] 文章详情 TOC 改为抽屉式或可折叠
- [ ] B 端侧边栏改为抽屉式（overlay）
- [ ] 表格/代码块移动端水平滚动

**验收**：对照 `docs/stitch/06-home-mobile.png`，Chrome DevTools 手机模拟无布局溢出

### M7.2 动效

- [ ] 首页：卡片 stagger 入场（Motion `staggerChildren`）
- [ ] 页面切换：fade + slide 过渡（`AnimatePresence`）
- [ ] 导航栏：滚动时 Glassmorphism 渐显
- [ ] 登录页：左侧图片视差 / 表单 slide-in
- [ ] 文章详情：封面图 parallax、正文 fade-in
- [ ] 卡片悬停：`scale(1.02)` + shadow 提升
- [ ] 参考 `docs/stitch/09-login-motion.png`、`10-home-transitions.png`、`11-article-motion.png`

**验收**：动效流畅（60fps），不影响首屏加载性能

### M7.3 性能优化

- [ ] 图片懒加载（`loading="lazy"` 或 Intersection Observer）
- [ ] 图片响应式（`srcset`）
- [ ] 代码分割：React.lazy 按路由分割
- [ ] Vite 构建优化：chunk 拆分策略
- [ ] 首屏关键 CSS 内联

**验收**：Lighthouse Performance 评分 ≥ 90

### M7.4 无障碍

- [ ] 所有图片有 `alt`
- [ ] 颜色对比度 WCAG AA（Light + Dark）
- [ ] 键盘导航：Tab 顺序、焦点可见（`focus-visible`）
- [ ] ARIA 标签：导航、对话框、按钮

**验收**：Lighthouse Accessibility 评分 ≥ 90

---

## M8 — 部署 ✅

> 目标：博客上线运行在自有服务器上。
> **状态**：已上线，访问 https://www.zorazora.cn 可用。

### M8.1 服务端配置 ✅

- [x] 服务器环境准备：Node.js 20+、PostgreSQL、Nginx
- [x] 后端以 Node.js 进程运行（使用 `pm2` 守护，配置见 [`deploy/ecosystem.config.js`](../deploy/ecosystem.config.js)）
- [x] 前端构建为静态文件，Nginx 反向代理（配置见 [`deploy/nginx.conf`](../deploy/nginx.conf)）：
  - `/api/*` → 后端
  - 其余 → 前端静态文件（SPA fallback `index.html`）
- [x] HTTPS（宝塔面板 + Let's Encrypt）
- [x] 环境变量配置：`.env` 生产版（DATABASE_URL、JWT_SECRET 等）
- [x] **图片存储升级**：从本地磁盘 `uploads/` 改为七牛云对象存储（详见 commit `e4631fe`）

### M8.2 CI/CD ✅

- [x] GitHub Actions workflow（`.github/workflows/`，commit `9c45fbb`）：
  - push to master → 类型检查 → 构建前端 → 构建后端 → 部署到服务器
- [x] 部署脚本 [`deploy/deploy.sh`](../deploy/deploy.sh)：SSH → 拉代码 → 安装依赖 → 构建 → 迁移数据库 → 重启服务

### M8.3 日志运维

> **范围说明（V1）**：仅做日志相关工作，**进程存活监控与数据库备份暂不纳入**。后续按需另立任务。

- [x] **应用层访问日志**：[`backend/src/middleware/logger.ts`](../backend/src/middleware/logger.ts) 全局挂载 `requestLogger`，每个请求记录 `method + path + status + 耗时`
- [x] **错误日志**：[`backend/src/middleware/error.ts:21`](../backend/src/middleware/error.ts) 用 `console.error` 输出未捕获错误
- [x] **进程级日志持久化**：pm2 配置 `error_file` / `out_file` 写入 `/www/wwwlogs/zora-blog-backend.{error,out}.log`，带时间戳
- [ ] **日志轮转**（需在生产服务器执行一次性配置）：
  ```bash
  pm2 install pm2-logrotate
  pm2 set pm2-logrotate:max_size 10M
  pm2 set pm2-logrotate:retain 7
  pm2 set pm2-logrotate:compress true
  ```

**本地验证**：临时改 `backend/.env` 端口启动后，curl 多个端点可见以下输出（已验证 2026-04-22）：
```
Zora Blog API running at http://localhost:3099
GET / -> 200 (1ms)
GET /api/articles -> 200 (248ms)
GET /api/admin/articles -> 401 (1ms)
GET /non-exist-xyz -> 404 (0ms)
```

**生产验收**：登录服务器后 `tail -f /www/wwwlogs/zora-blog-backend.out.log` 应能看到实时访问日志。

**整体验收**：域名 https://www.zorazora.cn 可访问，HTTPS 正常，C 端和 B 端全功能可用。

---

## M9 — 数据分析

> 目标：自建轻量分析能力，覆盖 PRD §3.2.7 描述的"读者 / 内容 / 来源 / 时间"四类维度，零外部依赖、隐私友好。
>
> **详细技术设计见**：[`docs/analytics-design.md`](./analytics-design.md)
>
> **依赖**：M8 部署完成（有真实流量验证）。M9.1 和 M9.2 可在 M8 之前提前开发；M9.3 之后建议线上有数据后再上看板。

### M9.1 数据模型与 Geo 库准备

- [ ] 在 `prisma/schema.prisma` 新增模型：`PageView`、`DailySiteStat`、`DailyArticleStat`、`DailyReferrerStat`、`DailyGeoStat`、`DailyDeviceStat`、`DailyCategoryStat`，以及 `PageType`、`ReferrerType` 枚举（字段见 analytics-design.md §3）
- [ ] 生成迁移：`npx prisma migrate dev --name analytics_init`
- [ ] 注册 MaxMind 账号，下载 `GeoLite2-City.mmdb` 到 `backend/data/`
- [ ] `.gitignore` 加入 `backend/data/*.mmdb`
- [ ] 编写 `scripts/update-geoip.sh`：拉取最新 mmdb 并校验大小
- [ ] 在 `backend/.env.example` 增加：`ANALYTICS_SALT`、`ANALYTICS_PV_RETENTION_DAYS`、`MAXMIND_DB_PATH`、`ANALYTICS_AGGREGATE_CRON`

**验收**：`npx prisma studio` 可见全部分析表；`Reader.open(MAXMIND_DB_PATH)` 在后端启动时能成功加载

### M9.2 后端采集 API

- [ ] 安装依赖：`@maxmind/geoip2-node`、`ua-parser-js`、`node-cron`
- [ ] 新增 `backend/src/lib/geoip.ts`：单例 Reader，提供 `lookup(ip)` 方法
- [ ] 新增 `backend/src/lib/analytics.ts`：`hashIp(ip)`（HMAC-SHA256）、`classifyReferrer(referrer, selfHost)`、`parsePagePath(path)` 等工具
- [ ] 新增 `backend/src/services/analytics-service.ts`：`recordPageView(payload, ctx)`，处理 bot 过滤 / UA 解析 / Geo 解析 / 业务关联 / 写库
- [ ] 新增 `backend/src/routes/track.ts`：`POST /api/track/pageview`，接受 `TrackPayload`，返回 204
- [ ] 接入限流中间件：基于 IP 的令牌桶（60 req/min/IP），新增 `backend/src/middleware/rate-limit.ts`
- [ ] Bot UA 黑名单：维护 `backend/src/lib/bot-ua-list.ts`（bot/spider/crawler/curl/wget/headless/preview 等）

**验收**：
```bash
curl -X POST localhost:3001/api/track/pageview \
  -H 'Content-Type: application/json' \
  -d '{"path":"/articles/hello","visitorId":"u1","sessionId":"s1","referrer":"","screenWidth":1920,"screenHeight":1080,"viewportWidth":1440,"language":"zh-CN"}'
# → 204
# 数据库 page_views 表新增一行，geo / device 字段已解析
```

### M9.3 聚合任务

- [ ] 新增 `backend/src/jobs/analytics-aggregator.ts`：实现 site / article / referrer / geo / device / category 六个维度的增量聚合 SQL（见 analytics-design.md §6.2）
- [ ] 在 `backend/src/index.ts` 启动时通过 `node-cron` 注册任务（默认 `*/5 * * * *`）
- [ ] 历史回填脚本：`backend/scripts/rebuild-analytics.ts`，支持 `--from` `--to` 参数
- [ ] 数据保留任务：每天 03:00 删除 `page_views` 中 `created_at < now() - ANALYTICS_PV_RETENTION_DAYS` 的数据
- [ ] 聚合失败告警：连续 3 次失败时 `console.error` 输出明显标记（生产可对接监控）

**验收**：手动写入 100 条 page_views → 触发聚合 → `daily_site_stats` 等表数据正确；运行回填脚本可重新生成历史聚合

### M9.4 查询 API

- [ ] 新增 `backend/src/routes/analytics.ts`，挂在 `/api/admin/analytics/*` 下，统一应用管理员认证中间件
- [ ] 实现 13 个端点（清单见 analytics-design.md §7.2）：
  - `overview` / `timeline` / `articles` / `articles/:id` / `categories` / `topics` / `sources` / `utm` / `entry-pages` / `geo` / `devices` / `visitors` / `publish-time`
- [ ] 通用查询参数解析：`range` / `from` / `to` / `compare` / `limit`，封装为 `parseAnalyticsRange()` 工具
- [ ] 同比/环比逻辑：当 `compare=true` 时，自动查询上一周期数据并计算 delta 百分比
- [ ] SDK 同步：`packages/sdk/` 新增 `analytics.*` 方法

**验收**：每个端点 curl 可返回正确结构；`overview?range=30d&compare=true` 同比百分比计算准确

### M9.5 前端埋点 SDK

- [ ] 新增 `frontend/src/lib/analytics.ts`：导出 `initAnalytics()` 与 `trackPageView()` 函数
  - 实现 visitorId 持久化（localStorage `zb_vid`）
  - 实现 sessionId 30 分钟无活动重生（sessionStorage `zb_sid` + `zb_sid_last_active`）
  - 实现 5 秒去重（同一 path 短时多次只发一次）
  - 实现 DNT 检测、`isAdmin` 标记
  - 上报使用 `navigator.sendBeacon`，回落 `fetch(..., { keepalive: true })`
  - 解析 UTM 参数自 `location.search`
- [ ] 新增 `frontend/src/hooks/useAnalytics.ts`：监听 `useLocation()` 路径变化触发上报
- [ ] 在 C 端 Layout（`CLayout.tsx`）顶层挂载一次 `useAnalytics()`
- [ ] 排除规则：`/admin/*`、`/login` 路径不上报
- [ ] 在「关于」页底部增加一段「隐私说明」文案

**验收**：C 端访问首页 / 文章页时，浏览器 Network 面板可见 `/api/track/pageview` 204；管理员登录后访问 C 端时，`isAdmin` 字段为 true

### M9.6 前端分析面板

- [ ] 安装：`react-simple-maps`（世界地图）、`topojson-client`、`d3-geo`（如未安装）
- [ ] 新增 `frontend/src/pages/admin/Analytics.tsx`，路由 `/admin/analytics`
- [ ] B 端侧边栏「Dashboard」之下新增「Analytics」入口
- [ ] 顶部组件：`<TimeRangeFilter />`（today / 7d / 30d / 90d / 自定义）+ 「数据更新于 X 分钟前」提示
- [ ] Tab 容器：总览 / 内容 / 来源 / 地域 / 设备 / 时间
  - **总览**：4 张大数字卡 + PV/UV 折线图（recharts `LineChart`）+ 同比环比
  - **内容**：热门文章 Top 10 表格 + 分类柱状图 + 长尾文章列表 + 单文章生命周期曲线
  - **来源**：referrerType 饼图 + Top 10 host 表格 + UTM 渠道表 + 入口页面 Top 10
  - **地域**：世界地图（react-simple-maps）+ Top 10 国家 / 省份表
  - **设备**：device / os / browser 三个饼图 + 屏幕宽度直方图
  - **时间**：7×24 周内热力图（自实现 grid + Tailwind）+ 发布时段散点图
- [ ] 通用：skeleton 加载、空状态、`Intl.NumberFormat` 千分位
- [ ] 表格行可点击跳转文章详情 / 分类详情

**验收**：六个 Tab 全部能正确渲染；切换时间范围数据实时变化；世界地图悬停显示国家名 + PV

### M9.7 部署与运维补充

- [ ] 更新 `docs/deploy-guide.md`：补充 mmdb 下载步骤、`ANALYTICS_SALT` 生成、cron 验证
- [ ] 部署脚本（`deploy/deploy.sh`）增加 mmdb 文件检查与下载逻辑
- [ ] CI 增加：mmdb 文件年龄检查（>45 天告警）
- [ ] README 增加分析模块章节，链接到 analytics-design.md

**验收**：生产环境 `/admin/analytics` 看板有真实数据；mmdb 文件最新；cron 任务正常运行

---

## 附录：依赖安装清单

### 后端 (`backend/`)

```bash
# 生产依赖
npm install hono @hono/node-server @prisma/client bcrypt jsonwebtoken

# 开发依赖
npm install -D typescript tsx @types/node @types/bcrypt @types/jsonwebtoken prisma
```

### 前端 (`frontend/`)

```bash
# 新增依赖（现有基础上）
npm install react-router-dom react-markdown remark-gfm rehype-shiki shiki react-helmet-async recharts

# 现有依赖（已安装）
# react, react-dom, lucide-react, motion, tailwindcss, vite, typescript
```

### M9 新增依赖

```bash
# 后端
cd backend && npm install @maxmind/geoip2-node ua-parser-js node-cron
cd backend && npm install -D @types/node-cron

# 前端
cd frontend && npm install react-simple-maps topojson-client d3-geo
cd frontend && npm install -D @types/react-simple-maps @types/d3-geo @types/topojson-client
```
