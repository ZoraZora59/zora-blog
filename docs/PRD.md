# 产品需求文档 (PRD)

**项目名称**：Zora Blog — 程序员猫奴露营博客
**版本**：V1.1
**最后更新**：2026-04-22
**作者**：ZoraGK + Claude

---

## 1. 产品概述

### 1.1 一句话定义

一个融合科技与户外生活方式的个人博客，用于发布技术文章、户外装备评测和生活随笔，支持读者评论互动。

### 1.2 产品定位

- **类型**：个人博客（单博主，多读者）
- **博主**：ZoraGK（唯一内容创作者和管理员）
- **读者**：任何人均可浏览，评论需提供昵称和邮箱
- **内容方向**：技术博客 + 户外运动 + 装备评测 + 生活随笔
- **设计理念**：Tech-Outdoor Fusion —— "The Kinetic Naturalist"

### 1.3 设计语言

采用 **Organic Brutalism** 风格：

- 重型技术排版 + 宽松通透的布局
- 有意的不对称性，大标题可偏移出网格
- 配色以深森林绿（secondary）和电光蓝（primary）为主，花岗岩灰（surface）为中性底色
- 无线条分割（No-Line Rule）：使用背景色阶差区分区域
- 12px 圆角容器，按钮使用全圆角（胶囊形）
- 字体：Space Grotesk（标题）+ Inter（正文）
- **Dark Mode**：
  - 支持 Light / Dark / 跟随系统 三种模式切换
  - 切换入口：顶部导航栏主题切换按钮（太阳/月亮图标）
  - 用户偏好持久化存储（localStorage）
  - Dark 模式配色：深色背景（如 #0f1419）+ 降低亮度的文字和卡片，保持品牌色（primary/secondary）的可辨识度
  - 切换时带平滑过渡动画（CSS transition）

---

## 2. 用户角色

| 角色 | 权限 | 认证方式 |
|------|------|---------|
| **博主（Admin）** | 全部：发布/编辑/删除文章，管理专题，审核评论，查看数据 | 登录（用户名 + 密码） |
| **读者（Visitor）** | 浏览文章、浏览专题、发表评论 | 无需注册，评论时填写昵称+邮箱 |

---

## 3. 功能模块

### 3.1 C端 — 读者侧

#### 3.1.1 首页 (Home)

**对应设计稿**：`01-home.png`、`10-home-transitions.png`

- **Hero 区域**：全宽大图 + 博主 Slogan "Developer by day, adventurer by night"
- **最新文章流**：按发布时间倒序展示文章卡片
  - 卡片包含：封面图、标题、摘要、分类标签、发布日期
  - 第一篇文章使用大尺寸特色卡片（Featured）
  - 其余文章使用标准卡片，2 列网格
- **分类快捷入口**：Tech Blog / Outdoor Journal 等分类标签，点击进入分类筛选
- **搜索**：顶部导航栏集成全局搜索，支持按标题和内容全文检索
- **底部**：Footer（GitHub / 邮箱 链接）

**交互**：
- 点击文章卡片 → 进入文章详情页
- 点击分类标签 → 首页按分类筛选文章
- 滚动时顶部导航栏使用 Glassmorphism 效果
- 搜索框：输入关键词后展示搜索结果列表，支持高亮匹配词

#### 3.1.2 文章详情页 (Article Detail)

**对应设计稿**：`02-article-detail.png`、`11-article-motion.png`

- **文章头部**：
  - 分类标签 + 发布日期 + 阅读量
  - 文章标题（Display 级大字）
  - 作者信息（头像 + 昵称 + 职业描述）
- **封面图**：全宽，12px 圆角
- **阅读进度条**：页面顶部固定一条细进度条，随滚动实时更新，指示当前阅读位置
- **正文区域**：
  - 支持的内容格式：标题（H2-H4）、段落、加粗/斜体、有序/无序列表、引用块、代码块（行内+区块）、图片、表格、分割线
  - **代码块增强**：语法高亮（Shiki）、语言标签、行号、一键复制按钮
  - **表格**：支持 Markdown 表格渲染，带表头样式、斑马纹、水平滚动（移动端）
  - **嵌入内容**：支持嵌入 Bilibili 和 YouTube 视频，通过 Markdown 扩展语法（如 `::bilibili[BV1xxxxx]`、`::youtube[dQw4w9WgXcQ]`），渲染为响应式 iframe
  - 正文最大宽度约 720px，居中显示
  - 行高 1.6，确保长文阅读舒适
- **侧边栏**（桌面端右侧）：
  - 文章目录（Table of Contents，根据 H2/H3 自动生成，点击平滑滚动到对应锚点，当前阅读位置高亮）
  - 订阅 CTA 区块
- **评论区**（文章底部）：
  - 评论输入框：昵称（必填）、邮箱（必填，不公开显示）、评论内容（必填）
  - 评论列表：头像（基于邮箱生成 Gravatar 或默认头像）、昵称、时间、内容
  - 按时间倒序排列
  - 不支持嵌套回复（V1 简化）
- **文章底部**：标签列表、上一篇/下一篇导航

#### 3.1.3 关于页 (About)

- **路由**：`/about`
- **布局**：单栏长页面，最大宽度 720px 居中
- **内容区块**：
  - **博主头像 + 昵称 + 职业描述**：大尺寸头像，配合 Slogan
  - **个人介绍**：Markdown 渲染的自由格式长文，支持图片、列表等
  - **技能/兴趣标签云**：展示技术栈和兴趣领域（如 TypeScript、露营、猫咪）
  - **社交链接**：GitHub / 邮箱等，图标按钮
  - **联系方式**：邮箱（可选展示）
- **数据来源**：复用 Admin Settings 中的博主个人资料 + 扩展字段
- **交互**：纯展示页，无复杂交互

#### 3.1.4 搜索 (Search)

- **入口**：顶部导航栏搜索框（全局可用）、移动端底部导航搜索图标
- **搜索范围**：文章标题 + 正文内容全文检索
- **搜索结果页**：
  - URL：`/search?q=关键词`
  - 结果列表：文章卡片形式展示，标题和摘要中高亮匹配关键词
  - 结果数量提示："找到 N 篇相关文章"
  - 空结果状态：友好提示 + 推荐热门文章
  - 支持分页
- **搜索体验**：
  - 输入框支持 debounce（300ms），减少请求频率
  - 搜索历史（localStorage 存储最近 10 条，可清除）
- **技术实现**：后端使用 PostgreSQL 全文搜索（`tsvector` / `tsquery`）

#### 3.1.5 专题页 (Topic)

**对应设计稿**：`08-sports-gear.png`

- **专题系统**：博主可创建多个专题，每个专题有独立的：
  - 专题标题（Display 级大字，如 "KINETIC SYNTAX."）
  - 专题描述
  - 专题封面图
  - 关联文章列表
- **专题列表页**：展示所有专题，卡片式布局
- **专题详情页**：
  - 顶部 Hero：专题标题 + 描述
  - 文章网格：支持不规则布局（大小混排的卡片），体现 Organic Brutalism 设计感
  - 每篇文章卡片：封面图 + 标题 + 摘要

#### 3.1.7 首页移动版

**对应设计稿**：`06-home-mobile.png`

- 响应式设计，非独立页面
- 顶部导航简化（汉堡菜单 + Logo）
- 卡片改为单列纵向排列
- 底部固定导航栏（首页 / 专题 / 搜索）
- Hero 区域高度适配移动端

#### 3.1.8 登录页 (Login)

**对应设计稿**：`05-login.png`、`09-login-motion.png`

- **仅供博主使用**（不对读者开放注册）
- **布局**：左右分栏
  - 左侧：全高户外帐篷背景图 + 博客 Slogan "Code the climb. Live the peak."
  - 右侧：登录表单
- **表单字段**：
  - 用户名/邮箱
  - 密码
  - "记住我" 复选框
  - "Sign in to Dashboard" 按钮
- **登录成功** → 跳转到 Admin Dashboard

---

### 3.2 B端 — 管理侧

> 以下页面均需要博主登录后才能访问

#### 3.2.1 Admin Dashboard (管理后台首页)

**对应设计稿**：`03-admin-dashboard.png`

- **左侧导航栏**：
  - Dashboard（数据看板）
  - Posts（文章管理）
  - Comments（评论管理）
  - Topics（专题管理）— 设计稿为 Settings，调整为 Topics
  - Settings（系统设置）
  - 底部：新建文章按钮 + 博主头像/昵称
- **数据看板**：
  - 统计卡片：总浏览量、总点赞数、评论数（支持增长率百分比）
  - 周增长趋势数字
  - Quick Draft（快速草稿）：标题 + 核心内容 + 保存按钮
  - Reach Analysis（触达分析图表）：按日统计，区分 Tech Blog / Outdoor Journal 两条线
  - Recent Feedback（最近评论/反馈）：昵称 + 评论摘要 + 回复按钮
  - Last Published（最近发布）：文章卡片预览

#### 3.2.2 Content Manager (内容管理)

**对应设计稿**：`04-content-manager.png`

- **顶部统计**：总文章数、已发布数、草稿数、总阅读量
- **文章表格**：
  - 列：缩略图 + 标题、状态（Published/Draft）、发布日期、浏览量、点赞数、操作
  - 操作按钮：编辑、查看、删除
- **工具栏**：
  - 搜索框（按标题搜索）
  - 筛选（按状态/分类）
- **分页**：底部分页控件
- **Performance Tip**：底部提示卡片
- **Recent Activity**：右侧最近操作记录

#### 3.2.3 文章编辑器 (Article Editor)

- **基于设计稿和产品需求设计**
- **编辑器**：
  - 标题输入（大字号，无边框）
  - Markdown 编辑器，支持：粗体、斜体、标题（H2-H4）、列表、引用、代码块、链接、图片插入
  - 实时 Markdown 预览（右侧面板，可切换）
- **侧边栏设置面板**：
  - 分类选择（下拉）
  - 标签管理（添加/删除标签）
  - 封面图上传
  - 摘要输入
  - 关联专题（多选）
  - SEO：自定义 URL slug
- **操作按钮**：
  - 保存草稿
  - 发布 / 更新
  - 预览（新窗口打开 C 端预览）
- **自动保存**：每 30 秒自动保存草稿

#### 3.2.4 评论管理 (Comment Management)

**对应设计稿**：`07-comment-mgmt.png`

- **评论列表**：
  - 每条评论显示：评论者昵称、邮箱（仅管理员可见）、评论时间、评论内容、来源文章
  - 状态：待审核 / 已通过 / 已拒绝
- **操作**：通过、拒绝、删除
- **筛选**：按状态、按文章筛选
- **Engagement 统计面板**（右侧）：
  - 总评论数
  - 通过率
  - 待审核数量
  - 最活跃文章排名

#### 3.2.5 专题管理 (Topic Management)

- **专题列表**：所有专题的卡片列表
- **新建/编辑专题**：
  - 专题标题
  - 专题描述
  - 专题封面图上传
  - 关联文章（从已发布文章中多选）
  - 专题 URL slug
- **删除专题**：确认对话框后删除（不删除关联文章）

#### 3.2.6 系统设置 (Settings)

- **个人资料**：昵称、职业描述、头像上传、个人简介
- **博客设置**：博客标题、博客描述、Logo
- **评论设置**：是否开启评论审核（默认开启）

#### 3.2.7 数据分析 (Analytics)

> **详细技术设计**：[`docs/analytics-design.md`](./analytics-design.md)
> **开发计划**：见 `docs/development-plan.md` M9 章节

- **目标**：自建轻量分析能力，零外部费用、隐私友好（不投放 cookie、不接入第三方 SDK、不存原始 IP）
- **页面入口**：B 端侧边栏「Analytics」（位于 Dashboard 之下），路由 `/admin/analytics`
- **覆盖维度**（V1）：
  - **读者维度**：地域分布（国家/省份）、设备类型（PC/移动/平板）、操作系统、浏览器、屏幕宽度、浏览器语言、新老访客比、会话页数
  - **内容维度**：热门文章 Top N、长尾文章、分类/标签热度、专题热度、单篇文章生命周期曲线、发布时段 vs 流量
  - **来源维度**：referrer 分布（直接/搜索/社交/外链/站内）、Top 来源 host、UTM 渠道效果、入口页面 Top N
  - **时间维度**：按日/周/月趋势、周内 7×24 热力图、同比环比对比
- **V1 暂不实现**：滚动深度 / 热力点击 / 性能指标（LCP）/ 转化漏斗 / 留存曲线 / 实时秒级面板（接受 ≤5 分钟延迟）
- **关键功能**：
  - 顶部时间范围筛选器：today / 7d / 30d / 90d / 自定义
  - Tab 分区展示：总览 / 内容 / 来源 / 地域 / 设备 / 时间
  - 同比环比 delta 百分比（PV/UV/Sessions）
  - 世界地图可视化国家分布
  - 表格行可点击跳转到文章 / 分类详情页
  - 数据新鲜度提示："数据更新于 X 分钟前"
- **隐私承诺**（在「关于」页底部公开）：
  - 不种 cookie，访客标识使用浏览器 localStorage 匿名 UUID
  - IP 仅做 HMAC 哈希后存储，原始 IP 立即丢弃
  - 地理信息使用 MaxMind GeoLite2 离线数据库解析，不调用任何外部 API
  - 尊重 `Do Not Track` 浏览器信号，启用时不上报
  - 管理员自身访问自动从统计中排除

---

## 4. 数据模型

### 4.1 实体关系

```
Admin (博主) ──1:N──> Article (文章)
Article ──1:N──> Comment (评论)
Article ──N:M──> Tag (标签)
Article ──N:M──> Topic (专题)
Article ──N:1──> Category (分类)

PageView (原始访问事件) ──N:1──> Article / Category / Topic（可选关联）
DailySiteStat / DailyArticleStat / DailyReferrerStat / DailyGeoStat /
DailyDeviceStat / DailyCategoryStat（聚合表，由 PageView 派生）
```

> 数据分析相关的 6 张聚合表 + PageView 原始表的字段定义见 [`docs/analytics-design.md`](./analytics-design.md) §3，本节不再展开。

### 4.2 核心实体

#### Article (文章)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | int | 主键 |
| title | string | 标题 |
| slug | string | URL 别名，唯一 |
| content | text | Markdown 正文 |
| excerpt | string | 摘要（可选，为空时自动截取前 200 字） |
| coverImage | string | 封面图 URL |
| status | enum | draft / published |
| categoryId | int | 分类 ID |
| viewCount | int | 浏览量 |
| likeCount | int | 点赞数 |
| publishedAt | datetime | 发布时间（可 null） |
| createdAt | datetime | 创建时间 |
| updatedAt | datetime | 更新时间 |

#### Category (分类)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | int | 主键 |
| name | string | 分类名（如"技术"、"户外"） |
| slug | string | URL 别名 |
| description | string | 分类描述（可选） |

#### Tag (标签)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | int | 主键 |
| name | string | 标签名 |

#### Topic (专题)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | int | 主键 |
| title | string | 专题标题 |
| slug | string | URL 别名 |
| description | text | 专题描述 |
| coverImage | string | 专题封面图 URL |
| createdAt | datetime | 创建时间 |
| updatedAt | datetime | 更新时间 |

#### Comment (评论)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | int | 主键 |
| articleId | int | 关联文章 ID |
| nickname | string | 评论者昵称 |
| email | string | 评论者邮箱（不公开） |
| content | text | 评论内容 |
| status | enum | pending / approved / rejected |
| createdAt | datetime | 评论时间 |

#### Admin (管理员)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | int | 主键 |
| username | string | 用户名 |
| passwordHash | string | 密码哈希 |
| displayName | string | 显示昵称 |
| avatar | string | 头像 URL |
| bio | text | 个人简介 |
| role | string | 职业描述 |
| apiKey | string | API Key 哈希（Bearer Token 认证用，可 null） |
| apiKeyPrefix | string | API Key 前 8 位明文（用于识别，如 `zora_a1b2...`） |

### 4.3 关联表

- **article_tags**：articleId + tagId
- **topic_articles**：topicId + articleId + sortOrder（排序）

---

## 5. API 设计概要

### 5.1 C端 API（公开）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/articles | 文章列表（分页、分类筛选、标签筛选） |
| GET | /api/articles/:slug | 文章详情 |
| GET | /api/articles/:slug/comments | 文章评论列表（仅 approved） |
| POST | /api/articles/:slug/comments | 提交评论 |
| POST | /api/articles/:slug/like | 点赞文章 |
| GET | /api/categories | 分类列表 |
| GET | /api/topics | 专题列表 |
| GET | /api/topics/:slug | 专题详情（含关联文章） |
| GET | /api/search?q=&page= | 全文搜索文章（标题+内容） |
| GET | /api/site | 博客基础信息（标题、描述、博主信息） |
| POST | /api/track/pageview | 数据分析埋点上报（无需认证、限流 60/min/IP） |

### 5.2 B端 API（需认证）

> **认证方式（二选一）**：
> 1. **Cookie**：Web UI 使用，通过 `POST /api/auth/login` 获取 HttpOnly JWT Cookie
> 2. **Bearer Token**：CLI / LLM 使用，请求头 `Authorization: Bearer <API_KEY>`，API Key 在后台 Settings 中生成
>
> 两种方式访问同一套 API，权限完全一致。

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/auth/login | 登录（返回 JWT Cookie） |
| POST | /api/auth/logout | 登出 |
| POST | /api/auth/token | 生成 API Key（仅 Cookie 认证可调用） |
| DELETE | /api/auth/token | 吊销 API Key |
| GET | /api/admin/dashboard | 数据看板统计 |
| GET | /api/admin/articles | 文章列表（含草稿） |
| POST | /api/admin/articles | 创建文章 |
| PUT | /api/admin/articles/:id | 更新文章 |
| DELETE | /api/admin/articles/:id | 删除文章 |
| POST | /api/admin/upload | 图片上传 |
| GET | /api/admin/comments | 全部评论（含待审核） |
| PUT | /api/admin/comments/:id | 审核评论（通过/拒绝） |
| DELETE | /api/admin/comments/:id | 删除评论 |
| CRUD | /api/admin/categories | 分类管理 |
| CRUD | /api/admin/tags | 标签管理 |
| CRUD | /api/admin/topics | 专题管理 |
| PUT | /api/admin/settings | 更新博客设置 |
| GET | /api/admin/analytics/* | 数据分析查询（13 个端点，详见 analytics-design.md §7） |

### 5.3 响应格式

```json
{
  "code": 200,
  "data": { ... },
  "message": "success"
}
```

错误响应：

```json
{
  "code": 400,
  "data": null,
  "message": "标题不能为空"
}
```

### 5.4 CLI / LLM 友好设计

B 端 API 设计遵循以下原则，确保通过 Claude Code（curl / fetch）管理博客时体验顺畅：

- **全功能 API 覆盖**：所有管理操作（发布文章、审核评论、管理专题等）均可通过 API 完成，不存在"必须通过 UI 才能做"的操作
- **Markdown 原文传输**：`POST /api/admin/articles` 的 `content` 字段直接接受 Markdown 原文，无需预处理
- **批量操作**：评论审核、文章删除等支持批量 ID 操作（`PUT /api/admin/comments/batch`），减少多次调用
- **列表 API 支持过滤和排序**：`?status=draft&sort=updatedAt&order=desc&limit=20`，方便 CLI 精确查询
- **幂等性**：PUT 操作幂等，重复调用安全（网络抖动不会导致重复创建）
- **详细的错误信息**：错误响应包含具体字段名和原因，LLM 可直接定位问题修复
- **创建文章支持 slug 自动生成**：如果不传 `slug`，后端根据标题自动生成，减少 CLI 调用的参数负担

---

## 6. 页面路由

### C端

| 路由 | 页面 |
|------|------|
| `/` | 首页 |
| `/articles/:slug` | 文章详情 |
| `/categories/:slug` | 分类文章列表 |
| `/topics` | 专题列表 |
| `/topics/:slug` | 专题详情 |
| `/about` | 关于页 |
| `/search?q=` | 搜索结果页 |
| `/login` | 博主登录 |

### B端

| 路由 | 页面 |
|------|------|
| `/admin` | Admin Dashboard |
| `/admin/posts` | 内容管理 |
| `/admin/posts/new` | 新建文章 |
| `/admin/posts/:id/edit` | 编辑文章 |
| `/admin/comments` | 评论管理 |
| `/admin/topics` | 专题管理 |
| `/admin/topics/new` | 新建专题 |
| `/admin/topics/:id/edit` | 编辑专题 |
| `/admin/settings` | 系统设置 |
| `/admin/analytics` | 数据分析面板（六个 Tab：总览/内容/来源/地域/设备/时间） |

---

## 7. 技术架构

### 7.1 技术栈

| 层 | 技术 |
|-----|------|
| 前端 | React 19 + TypeScript + Vite 6 + Tailwind CSS 4 |
| Markdown 渲染 | react-markdown + remark/rehype 插件生态 |
| 代码高亮 | Shiki（支持多主题，Dark Mode 适配） |
| 图标 | Lucide React |
| 动画 | Motion (Framer Motion) |
| 后端 | Node.js + TypeScript + Hono |
| ORM | Prisma |
| 数据库 | PostgreSQL（开发 / 生产） |
| 认证 | JWT (HttpOnly Cookie) + Bearer Token (API Key) |
| 文件存储 | 本地磁盘（生产可对接 S3/OSS） |
| 部署 | 自有服务器 |

### 7.2 架构概览

```
浏览器
  │
  ├── C端 SPA (React) ──── GET /api/* ──── Hono Server ──── Prisma ──── DB
  │                                              │
  └── B端 SPA (React) ──── Cookie Auth ─────────┤
                                                 │
Claude Code / CLI ──── Bearer Token Auth ────────┘
  (curl / fetch)                                 │
                                            本地文件存储
                                           (图片上传)
```

- 前后端分离，前端构建为静态文件，由 Hono 静态服务托管
- 或独立部署前端（Nginx）+ 后端（Node.js 进程）
- Web UI 使用 JWT HttpOnly Cookie 认证
- CLI / LLM 使用 Bearer Token（API Key）认证，访问同一套 B 端 API

---

## 8. 非功能需求

### 8.1 性能

- 首页首屏加载 < 2s（含图片懒加载）
- 文章详情页 TTFB < 500ms
- 图片上传支持压缩，限制单张 5MB

### 8.2 SEO

- 服务端渲染（SSR）或预渲染关键 C 端页面（首页、文章详情）
- 每篇文章生成 Open Graph / Twitter Card meta 标签
- 自动生成 sitemap.xml
- 语义化 HTML 结构

### 8.3 安全

- 密码使用 bcrypt 哈希存储
- JWT 过期时间 7 天，支持刷新
- 评论内容做 XSS 过滤
- 图片上传校验文件类型和大小
- B端 API 全部需要认证中间件保护
- CSRF 防护

### 8.4 响应式

- 断点：移动端 (<768px) / 平板 (768-1024px) / 桌面 (>1024px)
- 移动端使用底部导航栏代替侧边栏
- 图片响应式加载（srcset）

### 8.5 Dark Mode

- 使用 CSS 自定义属性（CSS Variables）实现主题切换，所有颜色通过变量引用
- Tailwind CSS `dark:` 变体配合 `class` 策略（非 `media`），支持手动切换
- Shiki 代码高亮使用双主题：Light（如 vitesse-light）/ Dark（如 vitesse-dark）
- 图片和封面不做反色处理，但可降低亮度（`brightness(0.9)`）
- 所有组件必须同时测试 Light 和 Dark 两种模式

### 8.6 无障碍 (Accessibility)

- 语义化 HTML 标签（`<article>`、`<nav>`、`<main>`、`<aside>` 等）
- 图片提供 `alt` 描述
- 颜色对比度符合 WCAG AA 标准（Dark Mode 下同样适用）
- 键盘可导航：Tab 顺序合理，焦点状态可见

---

## 9. 设计稿参考

所有设计稿截图保存在 `docs/stitch/` 目录：

| 文件 | 页面 |
|------|------|
| `01-home.png` | 首页 |
| `02-article-detail.png` | 文章详情 |
| `03-admin-dashboard.png` | Admin Dashboard |
| `04-content-manager.png` | Content Manager |
| `05-login.png` | 登录页 |
| `06-home-mobile.png` | 首页移动版 |
| `07-comment-mgmt.png` | 评论管理 |
| `08-sports-gear.png` | Sports & Gear 专题 |
| `09-login-motion.png` | 登录动效版 |
| `10-home-transitions.png` | 首页动效版 |
| `11-article-motion.png` | 文章详情动效版 |

设计系统详细规范见：`docs/design-system.md`
开发计划见：`docs/development-plan.md`

---

## 10. 里程碑

| 阶段 | 内容 | 依赖 |
|------|------|------|
| M1 | 后端基础：项目初始化、数据库模型、认证 API、文章 CRUD API | 无 |
| M2 | 前端基础：路由、设计系统组件库、首页、文章详情页（含 Shiki 代码高亮、Markdown 渲染） | M1 |
| M3 | B端管理：Dashboard、Content Manager、文章编辑器 | M1 |
| M4 | 评论系统：评论 API + C 端评论区 + B 端评论管理 | M2, M3 |
| M5 | 专题系统：专题 CRUD + 专题列表/详情页 + B 端专题管理 | M2, M3 |
| M6 | 扩展功能：关于页、搜索（全文检索）、Dark Mode | M2, M3 |
| M7 | 打磨：移动端适配、动效、SEO、图片优化、无障碍 | M2-M6 |
| M8 | 部署：服务器配置、CI/CD、域名 | M1-M7 |
| M9 | 数据分析：埋点采集、聚合任务、查询 API、Analytics 面板 | M8（线上有真实流量） |
