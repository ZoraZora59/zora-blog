# 数据分析模块设计 (Analytics Design)

> **项目**：Zora Blog — 数据分析能力
> **日期**：2026-04-22
> **作者**：ZoraGK + Claude
> **关联文档**：[PRD](./PRD.md) · [开发计划 M9](./development-plan.md)

---

## 1. 目标与范围

### 1.1 目标

为博主提供**自建、零外部费用、隐私友好**的流量与内容分析能力，覆盖以下四类维度（编号沿用脑暴讨论）：

- **维度一 · 读者**：谁在看（地域、设备、屏幕、语言、新老访客、访问深度）
- **维度二 · 内容**：看什么（热门 Top N、长尾、分类/标签热度、专题完读率、发布时段、生命周期）
- **维度四 · 来源**：从哪来（referrer host、UTM、搜索引擎、入口页面）
- **维度五 · 时间**：什么时候（小时/日/周/月趋势、周内分布、节假日）

### 1.2 非目标（V1 暂不做）

- 维度三（行为：滚动深度、热力点击、复制行为、搜索词）
- 维度六（性能/质量：LCP、404、API 错误率）
- 维度七（增长：订阅、转化漏斗、留存曲线）
- 实时分析（V1 接受日级 + 5 分钟级延迟，不要求秒级）
- 多用户/多账号视角（本博客单博主，不需要权限分级）

### 1.3 设计原则

| 原则 | 说明 |
|------|------|
| **零外部依赖** | Geo 用 MaxMind GeoLite2 离线库，不调用任何付费 API |
| **隐私优先** | 不存原始 IP、不投放 cookie、不接入第三方 SDK |
| **轻量上线** | MVP 阶段直接用 PostgreSQL 存原始事件 + 按需聚合，不引入时序库 |
| **可演进** | 表结构预留扩展空间，后续加聚合表 / 时序库 / 维度三时不需要重建 |
| **业务融合** | 数据维度对齐博客业务模型（文章、分类、标签、专题），而非通用 PV/UV |

---

## 2. 整体架构

```
┌──────────────┐  sendBeacon   ┌─────────────────┐    ┌──────────────┐
│  C 端浏览器  │ ─────────────▶│ POST /api/track │───▶│  page_views  │
│  (埋点 SDK)  │               │   (Hono)        │    │  (原始事件)  │
└──────────────┘               └─────────────────┘    └──────┬───────┘
                                       │                     │
                                       ▼                     │
                               ┌─────────────────┐           │
                               │   UA 解析       │           │
                               │   IP→Geo (mmdb) │           │
                               │   Bot 过滤      │           │
                               └─────────────────┘           │
                                                             │
                          ┌──────────────────────────────────┤
                          │                                  │
                          ▼                                  ▼
              ┌────────────────────────┐         ┌────────────────────┐
              │  实时查询（≤30 天）     │         │ 定时聚合 (cron 5m) │
              │  直接查 page_views     │         │ → daily_* 聚合表    │
              └────────────────────────┘         └─────────┬──────────┘
                          │                                │
                          └──────────────┬─────────────────┘
                                         ▼
                            ┌────────────────────────┐
                            │ GET /api/admin/        │
                            │   analytics/*          │
                            └─────────┬──────────────┘
                                      ▼
                            ┌────────────────────────┐
                            │  B 端 Analytics 面板   │
                            │  (React + recharts)    │
                            └────────────────────────┘
```

**核心数据流**：
1. 前端在每个 C 端页面挂载埋点，进入页面时通过 `navigator.sendBeacon` 发送一条事件
2. 后端 `/api/track/pageview` 同步落原始事件表，UA / Geo 解析在写入前完成
3. 短期窗口（≤30 天）查询直接走 `page_views`；长期看板走 `daily_*` 聚合表
4. 一个 cron 每 5 分钟跑增量聚合，把昨天 + 今天的数据更新到聚合表

---

## 3. 数据模型

### 3.1 原始事件表 `page_views`

```prisma
model PageView {
  id           BigInt   @id @default(autoincrement())

  // 路径与业务关联
  path         String                    // 完整 path，如 /articles/my-post
  pageType     PageType                  // home | article | category | topic | about | other
  articleId    Int?                      // 仅文章页填充，便于关联聚合
  categoryId   Int?
  topicId      Int?

  // 访客与会话
  visitorId    String   @db.VarChar(36)  // 前端 localStorage uuid，匿名
  sessionId    String   @db.VarChar(36)  // 30 分钟无活动重生
  isNewVisitor Boolean                   // 当次会话是否首次访问
  isNewSession Boolean                   // 是否为本次会话首条 PV

  // 来源
  referrer     String?                   // 完整 referrer URL（截断 1KB）
  referrerHost String?                   // 解析后的 host，便于聚合
  referrerType ReferrerType              // direct | search | social | external | internal
  utmSource    String?
  utmMedium    String?
  utmCampaign  String?

  // 设备 / 客户端
  userAgent    String   @db.VarChar(512)
  device       String?                   // desktop | mobile | tablet | bot
  os           String?                   // macOS, iOS, Windows, Android, Linux
  osVersion    String?
  browser      String?                   // Chrome, Safari, Firefox, Edge
  browserVersion String?
  screenWidth  Int?
  screenHeight Int?
  viewportWidth Int?
  language     String?                   // 浏览器语言主标签，如 zh-CN

  // 地理（IP 不留原文）
  ipHash       String   @db.VarChar(64)  // HMAC-SHA256(ip, ANALYTICS_SALT)
  country      String?                   // ISO Alpha-2，如 CN, US
  region       String?                   // 省份/州
  city         String?
  timezone     String?

  // 标记位
  isBot        Boolean  @default(false)  // UA 黑名单 / 行为可疑
  isAdmin      Boolean  @default(false)  // 当时持有管理员 cookie，统计时排除

  createdAt    DateTime @default(now())

  @@index([createdAt])
  @@index([articleId, createdAt])
  @@index([categoryId, createdAt])
  @@index([country, createdAt])
  @@index([referrerHost, createdAt])
  @@index([visitorId, createdAt])
  @@map("page_views")
}

enum PageType {
  HOME      @map("home")
  ARTICLE   @map("article")
  CATEGORY  @map("category")
  TOPIC     @map("topic")
  ABOUT     @map("about")
  SEARCH    @map("search")
  OTHER     @map("other")
}

enum ReferrerType {
  DIRECT   @map("direct")
  SEARCH   @map("search")
  SOCIAL   @map("social")
  EXTERNAL @map("external")
  INTERNAL @map("internal")
}
```

**容量预估**：单条记录约 0.5–1KB。若日 PV 1 万，年 ~3.5GB；若日 PV 10 万，年 ~35GB。配合 90 天滚动窗口（见 §6.3）和聚合表，PostgreSQL 完全可承载。

### 3.2 聚合表 `daily_*`

聚合粒度：**日 + 维度**。每个维度独立一张表，避免单表字段爆炸。

```prisma
// 站点级日聚合（趋势图主数据源）
model DailySiteStat {
  date         DateTime @db.Date @id
  pv           Int      @default(0)
  uv           Int      @default(0)        // 当日 distinct visitorId
  sessions     Int      @default(0)        // distinct sessionId
  newVisitors  Int      @default(0)
  bounceRate   Float?                      // 单 PV 会话占比 (0~1)
  avgPagesPerSession Float?
  updatedAt    DateTime @updatedAt
  @@map("daily_site_stats")
}

// 文章级日聚合
model DailyArticleStat {
  date         DateTime @db.Date
  articleId    Int
  pv           Int      @default(0)
  uv           Int      @default(0)
  updatedAt    DateTime @updatedAt
  @@id([date, articleId])
  @@index([articleId, date])
  @@map("daily_article_stats")
}

// 来源（referrerHost）日聚合
model DailyReferrerStat {
  date         DateTime @db.Date
  referrerHost String                       // 'direct' 表示直接访问
  referrerType ReferrerType
  pv           Int      @default(0)
  uv           Int      @default(0)
  updatedAt    DateTime @updatedAt
  @@id([date, referrerHost])
  @@map("daily_referrer_stats")
}

// 地域日聚合
model DailyGeoStat {
  date         DateTime @db.Date
  country      String                       // ISO Alpha-2
  region       String   @default("")        // 空字符串表示仅按国家聚合
  pv           Int      @default(0)
  uv           Int      @default(0)
  updatedAt    DateTime @updatedAt
  @@id([date, country, region])
  @@map("daily_geo_stats")
}

// 设备日聚合
model DailyDeviceStat {
  date         DateTime @db.Date
  device       String                       // desktop | mobile | tablet
  os           String   @default("")
  browser      String   @default("")
  pv           Int      @default(0)
  uv           Int      @default(0)
  updatedAt    DateTime @updatedAt
  @@id([date, device, os, browser])
  @@map("daily_device_stats")
}

// 分类日聚合（从文章聚合而来，避免每次 join）
model DailyCategoryStat {
  date         DateTime @db.Date
  categoryId   Int
  pv           Int      @default(0)
  uv           Int      @default(0)
  updatedAt    DateTime @updatedAt
  @@id([date, categoryId])
  @@map("daily_category_stats")
}
```

**为什么不用 PostgreSQL 物化视图（MATERIALIZED VIEW）？**
- 增量刷新需要 `REFRESH MATERIALIZED VIEW CONCURRENTLY`，对索引和唯一键有要求，复杂度不低于自己写聚合
- 物化视图的 schema 难以通过 Prisma 管理
- 自维护表 + cron 增量更新更直观，调试方便

---

## 4. 采集端（前端）

### 4.1 触发时机

- **每次 SPA 路由切换**：通过 React Router 的 `useLocation` 监听 pathname 变化
- **首次加载**：`useEffect` 在挂载时触发一次
- **过滤**：B 端路由（`/admin/*`、`/login`）一律不上报；预渲染或爬虫 UA 默认不上报

### 4.2 上报字段

```typescript
interface TrackPayload {
  path: string;              // window.location.pathname
  referrer: string;          // document.referrer
  screenWidth: number;       // screen.width
  screenHeight: number;      // screen.height
  viewportWidth: number;     // window.innerWidth
  language: string;          // navigator.language
  visitorId: string;         // localStorage 持久化 uuid
  sessionId: string;         // sessionStorage / 时间窗口
  utm?: {                    // 解析自 location.search
    source?: string;
    medium?: string;
    campaign?: string;
  };
}
```

**不上报的字段**（由后端补全）：
- IP（请求自带）
- UA（请求 Header 自带）
- 国家 / 城市（后端 mmdb 解析）
- pageType / articleId 等业务关联（后端从 path 反查）

### 4.3 关键行为约定

| 行为 | 实现 |
|------|------|
| visitorId 生成 | 首次访问 `crypto.randomUUID()` 写入 localStorage，键名 `zb_vid` |
| sessionId 生成 | sessionStorage 存 `zb_sid` + `zb_sid_last_active`；30 分钟无活动重生 |
| 上报方式 | 优先 `navigator.sendBeacon('/api/track/pageview', JSON)`，回落 `fetch(..., { keepalive: true })` |
| 失败处理 | 静默丢弃（不影响用户体验），不重试 |
| DNT 尊重 | 检测 `navigator.doNotTrack === '1'` 时不上报 |
| 管理员标识 | 若存在 admin JWT cookie，附带 `isAdmin: true`，后端聚合时排除 |
| 单页面去重 | 同一 pathname 在 5 秒内多次触发只发一次（防止 React strict mode / re-render） |

### 4.4 SDK 封装位置

- 路径：`frontend/src/lib/analytics.ts`
- 在 `frontend/src/App.tsx`（或 C 端 Layout）挂载一次性的 `useAnalytics()` hook

---

## 5. 采集端（后端）

### 5.1 接收路由

```
POST /api/track/pageview
Content-Type: application/json
Body: TrackPayload (见 §4.2)
Response: 204 No Content（无需返回数据，减小体积）
```

**特性**：
- **无需认证**，对外公开
- **限流**：基于 IP 的简单令牌桶（如 60 req/min/IP），防恶意刷量
- **CORS**：开发环境放开 `localhost:3000`；生产环境同源
- **大小限制**：Body ≤ 2KB，超出直接 413

### 5.2 处理流水线

```
请求进入
  ↓
[1] Bot 过滤（UA 正则黑名单：bot/spider/crawler/curl/wget/headless ...）
  ↓ 命中 bot → 仍写库但 isBot=true（用于审计），不进聚合
[2] UA 解析（ua-parser-js → device/os/browser）
  ↓
[3] Referrer 解析
    - 提取 host
    - 分类：search (google.*, bing.*, baidu.*, duckduckgo.*) /
            social (twitter.com, t.co, weibo.com, x.com, facebook.com 等) /
            internal (host == 本站) / direct (空) / external (其他)
  ↓
[4] IP 处理
    - HMAC-SHA256(ip, ANALYTICS_SALT) → ipHash
    - mmdb.lookup(ip) → country / region / city / timezone
    - 原始 IP 立即丢弃（不写库、不进日志）
  ↓
[5] 业务关联
    - 根据 path 匹配 pageType，articleId/categoryId/topicId 反查
    - 文章页：path = /articles/:slug → 查 articleId 缓存（LRU）
  ↓
[6] 写入 page_views
```

### 5.3 Geo 实现细节

- 库：`@maxmind/geoip2-node`（纯 JS，无原生依赖）
- 数据：MaxMind GeoLite2-City.mmdb（[免费下载](https://www.maxmind.com/en/geolite2/signup)，需注册）
- 文件位置：`backend/data/GeoLite2-City.mmdb`，**加入 .gitignore**
- 加载：进程启动时 `Reader.open()` 一次，常驻内存（约 70MB）
- 更新：每月一次手动更新或写脚本拉取，部署时通过 deploy 脚本下载

### 5.4 失败 / 退化策略

| 场景 | 处理 |
|------|------|
| mmdb 文件缺失 | 启动告警，写入时 country/region 为 null，其他字段正常 |
| UA 解析异常 | device/os/browser 为 null |
| visitorId 为空 | 拒绝写入（400），属于客户端 bug |
| 数据库写入超时 | 异步队列重试（V1 暂不做，直接丢弃，失败不影响接口响应） |

---

## 6. 聚合任务

### 6.1 触发方式

- **方式**：`backend/src/jobs/analytics-aggregator.ts` + `node-cron` 注册任务
- **频率**：每 5 分钟运行一次，覆盖 `今天 + 昨天` 的数据
- **历史回填**：提供 npm script `npm run analytics:rebuild -- --from=2026-04-01 --to=2026-04-22`

### 6.2 聚合 SQL 思路

以 `daily_site_stats` 为例：

```sql
INSERT INTO daily_site_stats (date, pv, uv, sessions, new_visitors, bounce_rate, avg_pages_per_session, updated_at)
SELECT
  date_trunc('day', created_at)::date AS date,
  COUNT(*) AS pv,
  COUNT(DISTINCT visitor_id) AS uv,
  COUNT(DISTINCT session_id) AS sessions,
  COUNT(DISTINCT visitor_id) FILTER (WHERE is_new_visitor) AS new_visitors,
  -- 单 PV 会话 / 总会话
  (
    SELECT COUNT(*)::float / NULLIF(COUNT(DISTINCT session_id), 0)
    FROM (
      SELECT session_id FROM page_views
      WHERE created_at::date = date_trunc('day', pv.created_at)::date
        AND NOT is_bot AND NOT is_admin
      GROUP BY session_id HAVING COUNT(*) = 1
    ) s
  ) AS bounce_rate,
  COUNT(*)::float / NULLIF(COUNT(DISTINCT session_id), 0) AS avg_pages_per_session,
  NOW()
FROM page_views pv
WHERE created_at >= :from
  AND created_at < :to
  AND NOT is_bot
  AND NOT is_admin
GROUP BY 1
ON CONFLICT (date) DO UPDATE SET
  pv = EXCLUDED.pv,
  uv = EXCLUDED.uv,
  sessions = EXCLUDED.sessions,
  new_visitors = EXCLUDED.new_visitors,
  bounce_rate = EXCLUDED.bounce_rate,
  avg_pages_per_session = EXCLUDED.avg_pages_per_session,
  updated_at = NOW();
```

其他聚合表逻辑类似，只是 `GROUP BY` 的维度不同。

### 6.3 数据保留策略

- **page_views**：滚动保留 90 天（cron 每天清理 `created_at < now() - 90d`）
- **daily_***：永久保留（数据量小，每个维度每天一行）
- **超出 90 天的明细查询**：降级为聚合表数据（不再支持任意维度交叉）

---

## 7. 查询 API

所有 API 走 `/api/admin/analytics/*`，需要管理员认证，统一响应格式 `{ code, data, message }`。

### 7.1 通用查询参数

| 参数 | 类型 | 说明 |
|------|------|------|
| `range` | enum | `today` / `7d` / `30d` / `90d` / `custom` |
| `from` | date | range=custom 时必填，YYYY-MM-DD |
| `to` | date | range=custom 时必填，YYYY-MM-DD |
| `compare` | bool | 是否带上一周期对比数据，默认 false |
| `limit` | int | 列表类 API 的返回条数，默认 10，上限 100 |

### 7.2 端点清单

| 方法 | 路径 | 说明 | 数据源 |
|------|------|------|------|
| GET | `/api/admin/analytics/overview` | 总览：PV/UV/sessions/bounce/avgPages + 同比 | daily_site_stats |
| GET | `/api/admin/analytics/timeline?granularity=hour\|day\|week` | 时间趋势曲线 | daily_site_stats / page_views（hour 粒度） |
| GET | `/api/admin/analytics/articles?sort=pv\|uv\|trending` | 文章 Top N + 长尾 | daily_article_stats + articles |
| GET | `/api/admin/analytics/articles/:id` | 单篇文章趋势曲线（生命周期） | daily_article_stats |
| GET | `/api/admin/analytics/categories` | 分类热度排行 | daily_category_stats + categories |
| GET | `/api/admin/analytics/topics` | 专题热度（专题下文章 PV 汇总） | daily_article_stats + topic_articles |
| GET | `/api/admin/analytics/sources` | referrer 分布（按 host / 按 type） | daily_referrer_stats |
| GET | `/api/admin/analytics/utm` | UTM 渠道效果排行 | page_views（聚合查询） |
| GET | `/api/admin/analytics/entry-pages` | 入口页面 Top N（每个 session 第一个 PV） | page_views |
| GET | `/api/admin/analytics/geo?level=country\|region` | 地域分布 | daily_geo_stats |
| GET | `/api/admin/analytics/devices?dimension=device\|os\|browser` | 设备分布 | daily_device_stats |
| GET | `/api/admin/analytics/visitors` | 新老访客比、平均会话页数等 | daily_site_stats |
| GET | `/api/admin/analytics/publish-time` | 发布时段 vs 流量散点（指导选题） | articles + daily_article_stats |

### 7.3 响应示例

`GET /api/admin/analytics/overview?range=30d&compare=true`

```json
{
  "code": 200,
  "data": {
    "range": { "from": "2026-03-23", "to": "2026-04-22" },
    "current": { "pv": 12450, "uv": 4830, "sessions": 5210, "bounceRate": 0.42, "avgPagesPerSession": 2.39 },
    "previous": { "pv": 9870, "uv": 3920, "sessions": 4180, "bounceRate": 0.45, "avgPagesPerSession": 2.36 },
    "delta": { "pv": "+26.1%", "uv": "+23.2%", "sessions": "+24.6%" }
  },
  "message": "success"
}
```

---

## 8. 前端面板

### 8.1 路由

新增 `src/pages/admin/Analytics.tsx`，路由 `/admin/analytics`，挂在 B 端侧边栏「Dashboard」之下。

### 8.2 信息架构

页面顶部：**时间范围筛选器**（today / 7d / 30d / 90d / 自定义）+ **新鲜度提示**（"数据更新于 2 分钟前"）

下方使用 Tab 分区，避免单页内容过载：

| Tab | 内容 |
|-----|------|
| **总览** | 4 张大数字卡（PV/UV/Sessions/Bounce）+ 折线图（PV/UV 趋势）+ 同比环比 |
| **内容** | 热门文章 Top 10 表格、分类热度柱状图、长尾文章列表、单文章生命周期曲线（点击文章打开） |
| **来源** | Referrer 分布饼图、Top 10 来源 host 表格、UTM 渠道效果、入口页面 Top 10 |
| **地域** | 国家维度世界地图（D3 / react-simple-maps）+ Top 10 国家/省份表格 |
| **设备** | Device / OS / Browser 分布饼图，屏幕宽度直方图 |
| **时间** | 周内热力图（7×24 小时）、发布时段 vs 流量散点图 |

### 8.3 图表库选择

- **基础图表**：`recharts`（已在开发计划中提及）— 折线、柱状、饼图、散点
- **世界地图**：`react-simple-maps` + topojson（轻量、纯 SVG，~80KB gzip）
- **热力图**：自己用 grid + Tailwind 实现（24 列 × 7 行的矩形格子，透明度按值映射）

### 8.4 体验细节

- 加载用 skeleton，空数据用插画 + "暂无数据，等等就有了"
- 所有数字使用 `Intl.NumberFormat` 千分位格式化
- 折线图悬停显示精确数值
- 表格每行可点击跳到对应文章 / 分类详情页

---

## 9. 隐私与安全

| 项 | 措施 |
|-----|------|
| **IP 处理** | 不存原文，仅存 `HMAC-SHA256(ip, ANALYTICS_SALT)`；地理信息从 mmdb 离线解析 |
| **Cookie** | 不种任何 cookie；visitorId 走 localStorage |
| **跨站追踪** | 不接入任何第三方 SDK，所有数据存自有数据库 |
| **DNT 信号** | 检测 `navigator.doNotTrack === '1'` 时前端直接跳过上报 |
| **管理员排除** | 持有 admin JWT 的请求标记 `isAdmin=true`，聚合时过滤 |
| **数据脱敏** | referrer 截断 1KB；utm 参数截断 256 字符 |
| **隐私页面** | 在「关于」页底部增加一段「隐私说明」，告知收集的数据范围 |
| **限流防刷** | `/api/track/pageview` 60 req/min/IP；超限 429 |
| **CSRF** | track 接口无副作用 + 无认证，不需要 CSRF 防护 |

环境变量新增：
- `ANALYTICS_SALT`：HMAC 密钥，至少 32 字节随机串，**生产环境必须自定义**
- `MAXMIND_DB_PATH`：mmdb 文件路径，默认 `./data/GeoLite2-City.mmdb`

---

## 10. 性能与容量

### 10.1 写入侧

- 单条事件写入 ~3ms（含 mmdb 查询 + UA 解析 + 索引更新）
- 假设峰值 100 QPS：单核足够；后续可加 Redis 队列异步落库
- mmdb Reader 内存占用 ~70MB，单实例加载

### 10.2 查询侧

- 聚合表查询：单查询 < 50ms（行数小，date PK 走索引）
- 原始表查询（30 天范围）：< 500ms（依赖 `(article_id, created_at)` 等复合索引）
- 长查询（如 hour 粒度时间趋势）：限制最长 7 天，超过强制走 day 粒度

### 10.3 存储

| 表 | 估算（日 1 万 PV） | 估算（日 10 万 PV） |
|----|------|------|
| page_views（90 天） | ~900MB | ~9GB |
| daily_* 全部 | < 100MB / 年 | < 1GB / 年 |

---

## 11. 配置与运维

### 11.1 新增 .env.example 字段

```bash
# Analytics
ANALYTICS_SALT=please-change-me-to-a-32-byte-random-string
ANALYTICS_PV_RETENTION_DAYS=90
MAXMIND_DB_PATH=./data/GeoLite2-City.mmdb
ANALYTICS_AGGREGATE_CRON="*/5 * * * *"
```

### 11.2 部署文档增量

`docs/deploy-guide.md` 需补充：
- MaxMind 账号注册 + GeoLite2-City.mmdb 下载脚本
- mmdb 文件每月更新提醒（写一个 `scripts/update-geoip.sh`）
- ANALYTICS_SALT 生成命令：`openssl rand -hex 32`

### 11.3 监控

- 后端日志记录每分钟 `/api/track` 请求数 + 失败数
- 聚合任务执行后写一条 `console.warn` 记录耗时与处理行数
- pg_dump 备份策略已存在，不需额外动作

---

## 12. 演进路径（V1 之后）

| 阶段 | 计划 | 触发条件 |
|------|------|---------|
| V1.1 | 维度三：滚动深度、外链点击、复制行为 | 单博主自己想看时 |
| V1.2 | 站内搜索词分析（M6.2 搜索功能上线后） | 搜索功能稳定运行 |
| V1.3 | 异步队列：Redis Stream + worker 落库 | 单实例 QPS > 100 |
| V1.4 | 时序库迁移（ClickHouse / TimescaleDB） | page_views 单表 > 1 亿行 |
| V1.5 | 实时看板（WebSocket 推送） | 有运营活动需要实时观测 |
| V2.0 | 增长漏斗 / 留存曲线 | 加入订阅/会员功能后 |

---

## 13. 风险清单

| 风险 | 影响 | 缓解 |
|------|------|------|
| 客户端禁用 JS / sendBeacon | 漏采数据 | 数据偏向技术友好读者，可接受；后端日志可作为兜底统计 |
| mmdb 数据过时 | Geo 分析不准 | 每月更新脚本 + CI 检查 mmdb 文件年龄 |
| Bot 漏过滤 | 数据虚高 | UA 黑名单可迭代；UV 通过 visitorId 去重已部分缓解 |
| visitorId 被清除 | UV 重复计数 | 已知限制，与所有匿名分析方案一致；不引入 fingerprinting |
| 聚合任务挂掉 | 看板数据延迟 | cron 失败重试 + 启动时检查最近一次成功时间，超 1 小时报警 |
| `/api/track` 被刷 | 数据污染 + DB 压力 | 限流 60/min/IP + Bot 过滤 + ANALYTICS_SALT 防伪 |
