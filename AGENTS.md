# Zora Blog

个人博客项目，前后端分离架构。中文开发者为主，所有交流、注释、commit message 使用中文。

## 技术栈

### 前端 (`frontend/`)
- **框架**: React 19 + TypeScript
- **构建**: Vite 6
- **样式**: Tailwind CSS 4 (Vite 插件模式)
- **图标**: Lucide React
- **动画**: Motion (Framer Motion)

### 后端 (`backend/`) — 规划中
- **运行时**: Node.js + TypeScript
- **框架**: Hono
- **ORM**: Prisma
- **数据库**: PostgreSQL（开发 / 生产）

## 开发命令

```bash
# 前端
cd frontend && npm run dev      # 启动开发服务器 http://localhost:3000
cd frontend && npm run build    # 构建生产版本
cd frontend && npm run lint     # TypeScript 类型检查 (tsc --noEmit)

# 后端（backend 目录就绪后）
cd backend && npm run dev       # 启动开发服务器
cd backend && npm run build     # 构建
cd backend && npm run lint      # TypeScript 类型检查 (tsc --noEmit)
```

## 代码规范

### 通用
- 使用中文注释和 commit message
- commit message 格式: `<type>: <描述>`，type 为 feat/fix/refactor/docs/chore 等
- 不要提交 .env 文件，环境变量参考 .env.example

### 前端
- React 组件使用函数式组件 + TypeScript，不使用 class 组件
- 样式统一使用 Tailwind CSS utility classes，**不写自定义 CSS**
- 保持各页面组件的视觉风格一致：共用间距、圆角、配色、字体大小等设计 token
- 如果多个组件有相同的 UI 模式（卡片、按钮、输入框等），提取为共享组件放在 `src/components/ui/` 目录
- 页面级组件放在 `src/components/`，通用 UI 组件放在 `src/components/ui/`
- 图标统一使用 Lucide React，不混用其他图标库

### 后端（待实施）
- 路由定义放 `src/routes/`，业务逻辑放 `src/services/`
- 数据模型在 `prisma/schema.prisma` 中定义
- API 响应格式统一：`{ code: number, data: T, message: string }`

## 项目结构

```
zora-blog/
├── frontend/                # 前端项目
│   ├── src/
│   │   ├── components/      # 页面级组件
│   │   │   └── ui/          # 共享 UI 组件（按钮、卡片、输入框等）
│   │   ├── App.tsx          # 主应用，路由/视图切换
│   │   ├── main.tsx         # 入口文件
│   │   └── index.css        # Tailwind 入口
│   ├── package.json
│   └── vite.config.ts
├── backend/                 # 后端项目（规划中）
│   ├── src/
│   │   ├── index.ts         # 入口
│   │   ├── routes/          # 路由定义
│   │   ├── services/        # 业务逻辑
│   │   ├── middleware/       # 中间件
│   │   └── lib/             # 工具函数
│   ├── prisma/
│   │   └── schema.prisma
│   └── package.json
└── AGENTS.md
```
