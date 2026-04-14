# 设计系统规范 (Design System Specification)

> **用途**：本文档是前端实现的唯一视觉真相来源。AI 编程助手和开发者应直接引用本文档中的 token 值和 Tailwind class，不要凭感觉猜测。
>
> **设计语言**：Organic Brutalism — "Tech-Outdoor Fusion / The Kinetic Naturalist"
>
> **设计稿参考**：`docs/stitch/` 目录下的 11 张截图

---

## 1. 色彩系统 (Color Tokens)

### 1.1 品牌色

| Token 名称 | 用途 | HEX | Tailwind 自定义色 |
|-----------|------|-----|-------------------|
| `primary` | 主色，CTA 按钮、链接、强调 | `#002455` | `bg-primary` / `text-primary` |
| `primary-light` | 主色悬停态 | `#003580` | `bg-primary-light` |
| `secondary` | 辅助色，标签、分类徽章、装饰 | `#3f6653` | `bg-secondary` / `text-secondary` |
| `secondary-light` | 辅助色悬停态 | `#4d7d64` | `bg-secondary-light` |
| `tertiary` | 第三色，警告、特殊标注 | `#3f1d00` | `bg-tertiary` / `text-tertiary` |
| `accent` | 电光蓝，高亮、徽章 | `#2563eb` | `bg-accent` / `text-accent` |

### 1.2 中性色（Light Mode）

| Token 名称 | 用途 | HEX | Tailwind class |
|-----------|------|-----|----------------|
| `surface` | 页面背景 | `#f8faf9` | `bg-surface` |
| `surface-raised` | 卡片/面板背景 | `#ffffff` | `bg-surface-raised` |
| `surface-sunken` | 输入框/代码块背景 | `#f1f5f4` | `bg-surface-sunken` |
| `border` | 边框、分割 | `#e2e8f0` | `border-border` |
| `border-light` | 次要边框 | `#f1f5f9` | `border-border-light` |
| `text-primary` | 标题、正文 | `#0f172a` | `text-foreground` |
| `text-secondary` | 次要文字、描述 | `#475569` | `text-muted` |
| `text-tertiary` | 辅助文字、时间戳 | `#94a3b8` | `text-subtle` |

### 1.3 中性色（Dark Mode）

| Token 名称 | 用途 | HEX | Tailwind class |
|-----------|------|-----|----------------|
| `surface` | 页面背景 | `#0f1419` | `dark:bg-surface` |
| `surface-raised` | 卡片/面板背景 | `#1a2332` | `dark:bg-surface-raised` |
| `surface-sunken` | 输入框/代码块背景 | `#0a0f14` | `dark:bg-surface-sunken` |
| `border` | 边框 | `#2a3441` | `dark:border-border` |
| `text-primary` | 标题、正文 | `#e2e8f0` | `dark:text-foreground` |
| `text-secondary` | 次要文字 | `#94a3b8` | `dark:text-muted` |
| `text-tertiary` | 辅助文字 | `#64748b` | `dark:text-subtle` |

### 1.4 语义色

| Token 名称 | 用途 | HEX |
|-----------|------|-----|
| `success` | 成功状态 | `#16a34a` |
| `warning` | 警告状态 | `#ca8a04` |
| `error` | 错误状态 | `#dc2626` |
| `info` | 信息提示 | `#2563eb` |

### 1.5 CSS Variables 实现

```css
/* 在 index.css 中定义，Tailwind 通过 @theme 引用 */
:root {
  --color-primary: #002455;
  --color-primary-light: #003580;
  --color-secondary: #3f6653;
  --color-secondary-light: #4d7d64;
  --color-tertiary: #3f1d00;
  --color-accent: #2563eb;
  --color-surface: #f8faf9;
  --color-surface-raised: #ffffff;
  --color-surface-sunken: #f1f5f4;
  --color-border: #e2e8f0;
  --color-border-light: #f1f5f9;
  --color-foreground: #0f172a;
  --color-muted: #475569;
  --color-subtle: #94a3b8;
}

.dark {
  --color-surface: #0f1419;
  --color-surface-raised: #1a2332;
  --color-surface-sunken: #0a0f14;
  --color-border: #2a3441;
  --color-foreground: #e2e8f0;
  --color-muted: #94a3b8;
  --color-subtle: #64748b;
}
```

---

## 2. 字体系统 (Typography)

### 2.1 字体家族

| 用途 | 字体 | Tailwind class | 备注 |
|------|------|----------------|------|
| 标题（H1-H3） | Space Grotesk | `font-heading` | Google Fonts 引入，weight 700 |
| 正文/UI | Inter | `font-sans` | Google Fonts 引入，weight 400/500/600 |
| 代码 | JetBrains Mono | `font-mono` | 代码块和行内代码 |

### 2.2 字号/行高/字重速查表

> **规则**：直接使用下表中的 Tailwind class，不要自定义 `text-[Xpx]`。

| 层级 | 场景 | Tailwind class | 字号 | 行高 | 字重 |
|------|------|----------------|------|------|------|
| Display | Hero 标题、专题大标题 | `text-5xl md:text-7xl font-heading font-bold` | 48/72px | 1.1 | 700 |
| H1 | 文章标题、页面主标题 | `text-3xl md:text-4xl font-heading font-bold` | 30/36px | 1.2 | 700 |
| H2 | 章节标题 | `text-2xl font-heading font-bold` | 24px | 1.3 | 700 |
| H3 | 子章节标题 | `text-xl font-heading font-semibold` | 20px | 1.4 | 600 |
| H4 | 卡片标题 | `text-lg font-semibold` | 18px | 1.5 | 600 |
| Body | 正文段落 | `text-base leading-relaxed` | 16px | 1.625 | 400 |
| Body Small | 摘要、描述 | `text-sm leading-relaxed` | 14px | 1.625 | 400 |
| Caption | 时间戳、辅助信息 | `text-xs text-subtle` | 12px | 1.5 | 400 |
| Label | 按钮、标签文字 | `text-sm font-medium` | 14px | 1.5 | 500 |

### 2.3 文章正文排版（Prose）

```
正文容器最大宽度：max-w-prose（720px）
正文字号：text-base（16px）
正文行高：leading-relaxed（1.625）
段落间距：space-y-6
标题上间距：mt-10
标题下间距：mb-4
代码块圆角：rounded-xl（12px）
代码块内边距：p-4
引用块左边框：border-l-4 border-primary
```

---

## 3. 间距系统 (Spacing)

### 3.1 基础间距

> **规则**：使用 Tailwind 的 4px 基准间距系统（1 = 4px），不要使用任意值。

| Token | 值 | Tailwind | 常见用途 |
|-------|-----|----------|---------|
| `spacing-1` | 4px | `p-1` / `gap-1` | 图标与文字间距 |
| `spacing-2` | 8px | `p-2` / `gap-2` | 紧凑元素间距 |
| `spacing-3` | 12px | `p-3` / `gap-3` | 标签内边距、小间距 |
| `spacing-4` | 16px | `p-4` / `gap-4` | 卡片内边距（移动端） |
| `spacing-5` | 20px | `p-5` / `gap-5` | — |
| `spacing-6` | 24px | `p-6` / `gap-6` | 卡片内边距（桌面端）、区块间距 |
| `spacing-8` | 32px | `p-8` / `gap-8` | 大区块间距 |
| `spacing-10` | 40px | `py-10` | 页面区块纵向间距 |
| `spacing-12` | 48px | `py-12` | Section 间距 |
| `spacing-16` | 64px | `py-16` | Hero 区域纵向内边距 |
| `spacing-20` | 80px | `py-20` | 大型 Hero 内边距 |

### 3.2 页面布局间距

| 场景 | Tailwind class | 说明 |
|------|----------------|------|
| 页面水平内边距 | `px-4 md:px-8 lg:px-16` | 移动 16px / 平板 32px / 桌面 64px |
| 页面最大宽度 | `max-w-7xl mx-auto` | 1280px 居中 |
| 正文最大宽度 | `max-w-prose mx-auto` | 720px（文章详情） |
| 侧边栏宽度（B端） | `w-60` | 240px 固定 |
| 卡片网格间距 | `gap-6 md:gap-8` | 24px / 32px |
| Section 纵向间距 | `py-12 md:py-16` | 48px / 64px |

---

## 4. 圆角系统 (Border Radius)

| 场景 | 值 | Tailwind class |
|------|-----|----------------|
| 容器/卡片 | 12px | `rounded-xl` |
| 代码块 | 12px | `rounded-xl` |
| 输入框 | 8px | `rounded-lg` |
| 按钮（主要/次要） | 9999px（胶囊） | `rounded-full` |
| 头像 | 9999px（圆形） | `rounded-full` |
| 标签/徽章 | 9999px（胶囊） | `rounded-full` |
| 图片 | 12px | `rounded-xl` |
| 弹窗/对话框 | 16px | `rounded-2xl` |

> **核心规则**：容器和图片用 `rounded-xl`（12px），按钮和标签用 `rounded-full`（胶囊）。不使用 `rounded-md`（6px）或其他中间值。

---

## 5. 阴影系统 (Elevation)

| 层级 | 场景 | Tailwind class |
|------|------|----------------|
| Level 0 | 页面底色、平面元素 | 无阴影 |
| Level 1 | 卡片、面板 | `shadow-sm` |
| Level 2 | 悬停态卡片、下拉菜单 | `shadow-md` |
| Level 3 | 对话框、弹窗 | `shadow-lg` |
| Level 4 | 导航栏（滚动时 Glassmorphism） | `shadow-lg backdrop-blur-md bg-white/80 dark:bg-surface/80` |

> **No-Line Rule**：不使用 `border` 分割区域，用背景色阶差（`surface` vs `surface-raised`）或阴影区分。仅在输入框、表格等特定场景使用细边框。

---

## 6. 组件规范 (Component Specs)

### 6.1 按钮 (Button)

| 变体 | Tailwind class |
|------|----------------|
| Primary | `bg-primary text-white rounded-full px-6 py-2.5 text-sm font-medium hover:bg-primary-light transition-colors` |
| Secondary | `bg-surface-sunken text-foreground rounded-full px-6 py-2.5 text-sm font-medium hover:bg-border transition-colors` |
| Ghost | `text-muted rounded-full px-4 py-2 text-sm font-medium hover:bg-surface-sunken transition-colors` |
| Danger | `bg-error text-white rounded-full px-6 py-2.5 text-sm font-medium hover:opacity-90 transition-colors` |
| Icon Button | `p-2 rounded-full hover:bg-surface-sunken transition-colors` |

**尺寸**：

| 尺寸 | padding | 字号 |
|------|---------|------|
| sm | `px-4 py-1.5` | `text-xs` |
| md（默认） | `px-6 py-2.5` | `text-sm` |
| lg | `px-8 py-3` | `text-base` |

### 6.2 卡片 (Card)

```
基础卡片：
bg-surface-raised rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow

文章卡片（Featured 大卡）：
bg-surface-raised rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow
  └─ 封面图：aspect-[16/9] object-cover w-full
  └─ 内容区：p-6 space-y-3
      └─ 分类标签：text-xs font-medium text-secondary bg-secondary/10 rounded-full px-3 py-1
      └─ 标题：text-xl font-heading font-bold text-foreground
      └─ 摘要：text-sm text-muted line-clamp-2
      └─ 底部：text-xs text-subtle（日期 + 阅读量）

文章卡片（标准）：
同上结构，封面图 aspect-[4/3]，标题 text-lg
```

### 6.3 标签/徽章 (Tag / Badge)

| 变体 | Tailwind class |
|------|----------------|
| 分类标签 | `text-xs font-medium text-secondary bg-secondary/10 rounded-full px-3 py-1` |
| 技术标签 | `text-xs font-medium text-primary bg-primary/10 rounded-full px-3 py-1` |
| 状态：已发布 | `text-xs font-medium text-success bg-success/10 rounded-full px-2.5 py-0.5` |
| 状态：草稿 | `text-xs font-medium text-warning bg-warning/10 rounded-full px-2.5 py-0.5` |
| 状态：待审核 | `text-xs font-medium text-accent bg-accent/10 rounded-full px-2.5 py-0.5` |

### 6.4 输入框 (Input)

```
文本输入框：
w-full rounded-lg border border-border bg-surface-raised px-4 py-2.5 text-sm text-foreground
placeholder:text-subtle
focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary
transition-colors

文本域（Textarea）：
同上，添加 min-h-[120px] resize-y

搜索框：
同上，左侧带搜索图标（pl-10），右侧可带清除按钮
```

### 6.5 导航栏 (Navigation)

```
C端顶部导航（桌面）：
fixed top-0 w-full z-50
bg-white/80 dark:bg-surface/80 backdrop-blur-md shadow-sm
h-16 px-8 flex items-center justify-between
  └─ 左：Logo（font-heading font-bold text-lg）
  └─ 中：nav links（text-sm font-medium text-muted hover:text-foreground）
  └─ 右：搜索图标 + Dark Mode 切换 + 登录入口

B端侧边栏：
w-60 h-screen bg-surface-raised border-r border-border-light
  └─ Logo 区：px-6 py-5
  └─ 导航项：px-4 py-2.5 rounded-xl text-sm font-medium
      └─ 默认态：text-muted hover:bg-surface-sunken
      └─ 激活态：bg-primary text-white
  └─ 底部：新建按钮 + 用户头像

移动端底部导航：
fixed bottom-0 w-full z-50
bg-white/95 dark:bg-surface/95 backdrop-blur-md border-t border-border
h-16 flex items-center justify-around
  └─ 图标 + 文字标签（text-xs）
  └─ 激活态：text-primary
```

### 6.6 阅读进度条 (Reading Progress Bar)

```
fixed top-0 left-0 z-[60] h-0.5 bg-primary transition-all duration-150
宽度通过 JavaScript 计算：scrollTop / (scrollHeight - clientHeight) * 100%
```

### 6.7 代码块 (Code Block)

```
容器：
relative rounded-xl bg-surface-sunken dark:bg-[#1a1b26] overflow-hidden

头部栏（语言标签 + 复制按钮）：
flex items-center justify-between px-4 py-2 bg-border/30 text-xs text-subtle
  └─ 左：语言名称
  └─ 右：复制按钮（Icon Button，点击后显示 "已复制" 反馈）

代码区域：
p-4 overflow-x-auto text-sm font-mono leading-relaxed
Shiki 主题：Light → vitesse-light / Dark → vitesse-dark
行号：text-subtle mr-4 select-none（可选显示）
```

### 6.8 评论区 (Comment Section)

```
评论输入表单：
space-y-4 p-6 bg-surface-raised rounded-xl
  └─ 双栏：昵称 + 邮箱（grid grid-cols-2 gap-4）
  └─ 评论内容：Textarea
  └─ 提交按钮：Primary Button

评论列表项：
flex gap-4 py-6 border-b border-border last:border-0
  └─ 头像：w-10 h-10 rounded-full bg-surface-sunken
  └─ 内容：
      └─ 昵称 + 时间：text-sm font-medium + text-xs text-subtle
      └─ 评论正文：text-sm text-foreground mt-1
```

### 6.9 表格 (Table)

```
容器（移动端可滚动）：
overflow-x-auto rounded-xl border border-border

表格：
w-full text-sm text-left

表头：
bg-surface-sunken text-xs font-medium text-muted uppercase tracking-wider
th: px-4 py-3

表体行：
even:bg-surface-sunken/50 hover:bg-surface-sunken transition-colors
td: px-4 py-3 text-foreground
```

---

## 7. 动效规范 (Motion)

### 7.1 基础过渡

| 场景 | 属性 | 时长 | 缓动 | Tailwind class |
|------|------|------|------|----------------|
| 颜色/背景变化 | color, background | 150ms | ease | `transition-colors duration-150` |
| 阴影变化 | box-shadow | 200ms | ease | `transition-shadow duration-200` |
| 缩放/位移 | transform | 200ms | ease-out | `transition-transform duration-200` |
| 全属性 | all | 200ms | ease | `transition-all duration-200` |
| Dark Mode 切换 | colors | 300ms | ease | `transition-colors duration-300` |

### 7.2 Motion (Framer Motion) 预设

```typescript
// 页面入场
export const pageTransition = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: { duration: 0.3, ease: 'easeOut' },
};

// 卡片入场（列表中的 stagger）
export const cardStagger = {
  container: {
    animate: { transition: { staggerChildren: 0.08 } },
  },
  item: {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.3, ease: 'easeOut' },
  },
};

// 悬停缩放
export const hoverScale = {
  whileHover: { scale: 1.02 },
  transition: { duration: 0.2 },
};

// 导航栏滚动 Glassmorphism
// 监听 scrollY > 50 时添加 backdrop-blur + shadow
```

---

## 8. 响应式断点 (Breakpoints)

| 名称 | 最小宽度 | Tailwind 前缀 | 目标设备 |
|------|---------|---------------|---------|
| 默认 | 0px | （无前缀） | 手机竖屏 |
| `sm` | 640px | `sm:` | 手机横屏 |
| `md` | 768px | `md:` | 平板 |
| `lg` | 1024px | `lg:` | 小桌面/平板横屏 |
| `xl` | 1280px | `xl:` | 桌面 |
| `2xl` | 1536px | `2xl:` | 大桌面 |

### 8.1 关键响应式模式

```
文章卡片网格：
grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8

首页 Hero 标题：
text-4xl md:text-5xl lg:text-7xl

导航切换：
桌面（lg+）：顶部水平导航
移动端（<lg）：汉堡菜单 + 底部 Tab 栏

文章侧边栏 TOC：
lg 以上显示（hidden lg:block），移动端隐藏

B端侧边栏：
桌面固定显示，移动端抽屉式（overlay）
```

---

## 9. 图标规范 (Icons)

- **图标库**：Lucide React（唯一来源，不混用）
- **默认尺寸**：`w-5 h-5`（20px）
- **小图标**：`w-4 h-4`（16px），用于标签内、行内
- **大图标**：`w-6 h-6`（24px），用于导航、空状态
- **颜色**：继承父元素 `currentColor`，不单独设色
- **描边宽度**：默认 2px（Lucide 默认值）

常用图标映射：

| 场景 | 图标名称 | 引入方式 |
|------|---------|---------|
| 搜索 | `Search` | `import { Search } from 'lucide-react'` |
| 菜单 | `Menu` | `import { Menu } from 'lucide-react'` |
| 关闭 | `X` | `import { X } from 'lucide-react'` |
| 太阳（Light Mode） | `Sun` | `import { Sun } from 'lucide-react'` |
| 月亮（Dark Mode） | `Moon` | `import { Moon } from 'lucide-react'` |
| 复制 | `Copy` / `Check` | 代码块复制按钮 |
| RSS | `Rss` | Footer RSS 链接 |
| 返回 | `ArrowLeft` | 文章详情返回 |
| 外部链接 | `ExternalLink` | 社交链接 |
| 评论 | `MessageCircle` | 评论区图标 |
| 点赞 | `Heart` | 文章点赞 |
| 日历 | `Calendar` | 发布日期 |
| 眼睛 | `Eye` | 阅读量 |
| 编辑 | `Pencil` | 编辑操作 |
| 删除 | `Trash2` | 删除操作 |
| 加号 | `Plus` | 新建操作 |

---

## 10. Tailwind 配置参考

> 以下为 `tailwind.config` 或 Tailwind CSS 4 `@theme` 中需要注册的自定义 token。

```css
/* index.css — Tailwind CSS 4 @theme 方式 */
@import "tailwindcss";

@theme {
  /* 品牌色 */
  --color-primary: var(--color-primary);
  --color-primary-light: var(--color-primary-light);
  --color-secondary: var(--color-secondary);
  --color-secondary-light: var(--color-secondary-light);
  --color-tertiary: var(--color-tertiary);
  --color-accent: var(--color-accent);

  /* 语义色 */
  --color-success: #16a34a;
  --color-warning: #ca8a04;
  --color-error: #dc2626;
  --color-info: #2563eb;

  /* 表面色 */
  --color-surface: var(--color-surface);
  --color-surface-raised: var(--color-surface-raised);
  --color-surface-sunken: var(--color-surface-sunken);

  /* 文字色 */
  --color-foreground: var(--color-foreground);
  --color-muted: var(--color-muted);
  --color-subtle: var(--color-subtle);

  /* 边框色 */
  --color-border: var(--color-border);
  --color-border-light: var(--color-border-light);

  /* 字体 */
  --font-heading: 'Space Grotesk', sans-serif;
  --font-sans: 'Inter', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
}
```

---

## 附录 A：LLM 快速参考（Cheat Sheet）

> 当你需要快速决策时，查阅此表。

| 我要做… | 用这个 |
|---------|--------|
| 页面背景 | `bg-surface` |
| 卡片背景 | `bg-surface-raised rounded-xl p-6 shadow-sm` |
| 主要按钮 | `bg-primary text-white rounded-full px-6 py-2.5 text-sm font-medium` |
| 次要按钮 | `bg-surface-sunken text-foreground rounded-full px-6 py-2.5 text-sm font-medium` |
| 输入框 | `w-full rounded-lg border border-border px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20` |
| 标题字体 | `font-heading font-bold` |
| 正文字体 | `font-sans text-base leading-relaxed` |
| 代码字体 | `font-mono text-sm` |
| 分类标签 | `text-xs font-medium text-secondary bg-secondary/10 rounded-full px-3 py-1` |
| 时间/辅助文字 | `text-xs text-subtle` |
| 区域分割 | 不用 border，用背景色差（`bg-surface` vs `bg-surface-raised`） |
| 图片圆角 | `rounded-xl`（12px） |
| 按钮圆角 | `rounded-full`（胶囊） |
| 页面内边距 | `px-4 md:px-8 lg:px-16` |
| 页面最大宽度 | `max-w-7xl mx-auto` |
| 正文最大宽度 | `max-w-prose mx-auto` |
| 卡片网格 | `grid grid-cols-1 md:grid-cols-2 gap-6` |
| 悬停效果 | `hover:shadow-md transition-shadow` |
| 图标尺寸 | `w-5 h-5`（默认 20px） |
