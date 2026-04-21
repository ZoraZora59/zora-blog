# 里程碑 PR 计划与验收基线

> 目标：将 [`development-plan.md`](/Users/didi/CodeBase/GithubCode/zora-blog/docs/development-plan.md) 的 `M1-M8` 固化为可执行的 PR 拆分、交付标准和验证方式，并与 `PRD`、`design-system`、`docs/stitch/` 原型图对齐。

## 原型图映射

- `M2`：[`01-home.png`](/Users/didi/CodeBase/GithubCode/zora-blog/docs/stitch/01-home.png)、[`02-article-detail.png`](/Users/didi/CodeBase/GithubCode/zora-blog/docs/stitch/02-article-detail.png)、[`06-home-mobile.png`](/Users/didi/CodeBase/GithubCode/zora-blog/docs/stitch/06-home-mobile.png)、[`10-home-transitions.png`](/Users/didi/CodeBase/GithubCode/zora-blog/docs/stitch/10-home-transitions.png)、[`11-article-motion.png`](/Users/didi/CodeBase/GithubCode/zora-blog/docs/stitch/11-article-motion.png)
- `M3`：[`03-admin-dashboard.png`](/Users/didi/CodeBase/GithubCode/zora-blog/docs/stitch/03-admin-dashboard.png)、[`04-content-manager.png`](/Users/didi/CodeBase/GithubCode/zora-blog/docs/stitch/04-content-manager.png)、[`05-login.png`](/Users/didi/CodeBase/GithubCode/zora-blog/docs/stitch/05-login.png)、[`09-login-motion.png`](/Users/didi/CodeBase/GithubCode/zora-blog/docs/stitch/09-login-motion.png)
- `M4`：[`02-article-detail.png`](/Users/didi/CodeBase/GithubCode/zora-blog/docs/stitch/02-article-detail.png) 的评论区块、[`07-comment-mgmt.png`](/Users/didi/CodeBase/GithubCode/zora-blog/docs/stitch/07-comment-mgmt.png)
- `M5`：[`08-sports-gear.png`](/Users/didi/CodeBase/GithubCode/zora-blog/docs/stitch/08-sports-gear.png)
- `M6`：以 [`PRD.md`](/Users/didi/CodeBase/GithubCode/zora-blog/docs/PRD.md) 和 [`design-system.md`](/Users/didi/CodeBase/GithubCode/zora-blog/docs/design-system.md) 为主，无单独 stitch 图
- `M7`：综合参考 `06/09/10/11`
- `M1`、`M8`：以接口、运维和部署文档为主，无 stitch 图

## 通用 PR 约定

- 每个 `M` 单独一个 PR，不跨里程碑混提。
- 分支名建议：
  - `codex/m1-backend-foundation`
  - `codex/m2-frontend-foundation`
  - `codex/m3-admin-console`
  - `codex/m4-comments`
  - `codex/m5-topics`
  - `codex/m6-extended-features`
  - `codex/m7-polish`
  - `codex/m8-deploy`
- PR 标题建议统一为：`feat: Mx <里程碑名称>`
- 每个 PR 必须附带：
  - 与当前里程碑相关的 `lint/build` 命令输出摘要
  - 对应页面的截图或录屏
  - 手动验证记录
  - 未覆盖风险和后续补充项

## M1 — 后端基础

- PR 标题：`feat: M1 后端基础`
- 目标：后端项目可独立启动，数据库模型、认证、文章 CRUD、上传链路可跑通。
- 必交付：
  - `backend/` 脚手架、TypeScript 配置、环境变量示例
  - Prisma schema、迁移、seed
  - 统一响应格式、中间件、认证机制
  - 文章 / 分类 / 标签 / 上传 API
- 交付标准：
  - `backend` 可执行 `dev/build/lint`
  - `GET /` 返回 API 标识
  - `POST /api/auth/login`、`POST /api/auth/token`、`DELETE /api/auth/token` 可用
  - `GET/POST/PUT/DELETE /api/admin/articles` 可完成文章生命周期
  - 上传后的图片 URL 可直接访问
- 自动验证：
  - `cd backend && npm run lint`
  - `cd backend && npm run build`
- 手动验证：
  - `curl` 验证登录、发 token、文章 CRUD、上传
  - `prisma studio` 查看表结构和 seed 数据
- PR 证据：
  - 关键 `curl` 请求和响应摘要
  - 数据模型截图或迁移说明

## M2 — 前端基础

- PR 标题：`feat: M2 前端基础`
- 目标：前端从原型态进入正式结构，C 端首页和文章详情页对接真实 API。
- 必交付：
  - React Router、API client、hooks、Markdown 渲染链
  - 设计 token、Google Fonts、Dark Mode 基础
  - `src/components/ui/` 和 `src/components/layout/`
  - `Home`、`ArticleDetail` 页面
- 交付标准：
  - `/`、`/articles/:slug` 可正常访问
  - 首页结构与 [`01-home.png`](/Users/didi/CodeBase/GithubCode/zora-blog/docs/stitch/01-home.png) 对齐
  - 文章详情与 [`02-article-detail.png`](/Users/didi/CodeBase/GithubCode/zora-blog/docs/stitch/02-article-detail.png) 对齐
  - 移动端首页不溢出，接近 [`06-home-mobile.png`](/Users/didi/CodeBase/GithubCode/zora-blog/docs/stitch/06-home-mobile.png)
  - Markdown、代码块、目录、阅读进度条可用
- 自动验证：
  - `cd frontend && npm run lint`
  - `cd frontend && npm run build`
- 手动验证：
  - 浏览器访问首页、文章详情
  - Light/Dark 模式切换
  - 桌面端与移动端截图对照 stitch
- PR 证据：
  - 首页、文章详情桌面端/移动端截图
  - 关键交互动图或录屏

## M3 — B 端管理

- PR 标题：`feat: M3 B 端管理`
- 目标：后台登录、Dashboard、文章管理、编辑器和设置页可用。
- 必交付：
  - `AdminLayout`、后台路由守卫、登录页
  - Dashboard、Posts、PostEditor、Settings
  - 文章编辑、发布、草稿保存链路
- 交付标准：
  - 未登录访问 `/admin` 重定向到 `/login`
  - 登录页与 [`05-login.png`](/Users/didi/CodeBase/GithubCode/zora-blog/docs/stitch/05-login.png) 对齐
  - Dashboard 与 [`03-admin-dashboard.png`](/Users/didi/CodeBase/GithubCode/zora-blog/docs/stitch/03-admin-dashboard.png) 对齐
  - Content Manager 与 [`04-content-manager.png`](/Users/didi/CodeBase/GithubCode/zora-blog/docs/stitch/04-content-manager.png) 对齐
  - 编辑器可创建草稿、预览和发布文章
- 自动验证：
  - `cd frontend && npm run lint`
  - `cd frontend && npm run build`
  - `cd backend && npm run lint`
  - `cd backend && npm run build`
- 手动验证：
  - 登录、跳转、登出
  - Quick Draft
  - 编辑器创建文章并在 C 端查看
- PR 证据：
  - 登录页、Dashboard、Posts、Editor、Settings 截图

## M4 — 评论系统

- PR 标题：`feat: M4 评论系统`
- 目标：读者可评论，管理员可审核。
- 必交付：
  - 评论 API
  - 文章详情评论区
  - 后台评论管理页
- 交付标准：
  - 评论提交后进入 `pending`
  - 管理员可 approve / reject / delete
  - 审核通过后 C 端可见
  - 后台评论管理接近 [`07-comment-mgmt.png`](/Users/didi/CodeBase/GithubCode/zora-blog/docs/stitch/07-comment-mgmt.png)
- 自动验证：
  - `npm run lint`
  - `npm run build:frontend`
  - `npm run build:backend`
- 手动验证：
  - 提交评论
  - 后台审核
  - 返回 C 端确认显示状态
- PR 证据：
  - 评论提交前后、审核前后截图

## M5 — 专题系统

- PR 标题：`feat: M5 专题系统`
- 目标：专题列表、专题详情和后台专题管理链路闭环。
- 必交付：
  - Topic API
  - `/topics`、`/topics/:slug`
  - `admin/Topics`、`admin/TopicEditor`
- 交付标准：
  - 可创建专题并关联文章
  - 专题详情页风格接近 [`08-sports-gear.png`](/Users/didi/CodeBase/GithubCode/zora-blog/docs/stitch/08-sports-gear.png)
  - 关联文章排序生效
- 自动验证：
  - `npm run lint`
  - `npm run build:frontend`
  - `npm run build:backend`
- 手动验证：
  - 新建专题、关联文章、排序、前台展示
- PR 证据：
  - 专题列表页、专题详情页、后台编辑页截图

## M6 — 扩展功能

- PR 标题：`feat: M6 扩展功能`
- 目标：关于页、搜索、Dark Mode 完成闭环。
- 必交付：
  - `About`、`Search`
  - PostgreSQL 全文搜索
  - `useTheme` 和主题切换组件
- 交付标准：
  - `/about` 展示后台配置内容
  - `/search?q=` 可搜索并高亮
  - Light / Dark / System 三模式正常工作
- 自动验证：
  - `npm run lint`
  - `npm run build:frontend`
  - `npm run build:backend`
- 手动验证：
  - 搜索关键词命中和空状态
  - 主题切换持久化
- PR 证据：
  - About、Search、Theme 切换截图

## M7 — 打磨

- PR 标题：`feat: M7 体验打磨`
- 目标：移动端、动效、性能、无障碍收口。
- 必交付：
  - 移动端布局和导航
  - 关键动效
  - 性能与无障碍优化
- 交付标准：
  - 375px-768px 无明显溢出
  - 动效与 [`09-login-motion.png`](/Users/didi/CodeBase/GithubCode/zora-blog/docs/stitch/09-login-motion.png)、[`10-home-transitions.png`](/Users/didi/CodeBase/GithubCode/zora-blog/docs/stitch/10-home-transitions.png)、[`11-article-motion.png`](/Users/didi/CodeBase/GithubCode/zora-blog/docs/stitch/11-article-motion.png) 的节奏一致
  - Lighthouse Performance >= 90
  - Lighthouse Accessibility >= 90
- 自动验证：
  - `npm run lint`
  - `npm run build:frontend`
  - `npm run build:backend`
- 手动验证：
  - 手机断点巡检
  - Lighthouse 报告
  - 键盘导航、焦点态和对比度检查
- PR 证据：
  - 移动端截图
  - Lighthouse 报告
  - 关键动效录屏

## M8 — 部署

- PR 标题：`feat: M8 部署与运维`
- 目标：部署脚本、CI/CD、运行文档和运维基线到位。
- 必交付：
  - 服务器部署方案
  - CI/CD workflow 或 Docker Compose
  - 环境变量说明
  - 备份 / 日志 / 基础监控说明
- 交付标准：
  - 能按文档完成一次完整部署
  - 反向代理、HTTPS、静态资源、API、上传目录路由说明完整
  - 数据库迁移和服务重启步骤清晰
- 自动验证：
  - `npm run lint`
  - `npm run build:frontend`
  - `npm run build:backend`
  - CI workflow 配置检查
- 手动验证：
  - 按部署文档走一遍
  - 验证域名访问、API、静态资源、上传
- PR 证据：
  - 部署文档
  - workflow 运行记录或部署日志摘要

## 推荐执行顺序

1. `M1` 合并后再做 `M2` / `M3`
2. `M2`、`M3` 合并后再做 `M4`、`M5`
3. `M6` 在 `M2`、`M3` 基础上收口
4. `M7` 集中做质量与体验
5. `M8` 最后落部署

## 备注

- 这份文档负责定义 PR 颗粒度和验收口径，不替代更细的任务分解。
- 具体命令和检查入口见 [`harness/README.md`](/Users/didi/CodeBase/GithubCode/zora-blog/harness/README.md)。
