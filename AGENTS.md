# Zora Blog

个人博客项目，前后端分离架构。中文开发者为主，所有交流、注释、commit message 使用中文。

## 技术栈

### 前端 (`frontend/`)
- **框架**: React 19 + TypeScript (strict mode)
- **构建**: Vite 6
- **样式**: Tailwind CSS 4 (Vite 插件模式)
- **图标**: Lucide React
- **动画**: Motion (Framer Motion)
- **Lint**: ESLint 9 (typescript-eslint + react-hooks + react-refresh)
- **格式化**: Prettier（根目录 `.prettierrc` 统一配置）

### 后端 (`backend/`)
- **运行时**: Node.js + TypeScript (strict mode)
- **框架**: Hono
- **ORM**: Prisma
- **数据库**: PostgreSQL（开发 / 生产）
- **Lint**: ESLint 9 (typescript-eslint)
- **格式化**: Prettier（根目录 `.prettierrc` 统一配置）

## 开发命令

```bash
# 根目录统一命令
npm run lint              # 前后端全量检查（tsc + ESLint）
npm run format            # 前后端代码格式化
npm run format:check      # 格式检查（不修改文件）

# 前端
cd frontend && npm run dev          # 启动开发服务器 http://localhost:3000
cd frontend && npm run build        # tsc 检查 + 构建生产版本
cd frontend && npm run lint         # TypeScript 类型检查 (tsc --noEmit)
cd frontend && npm run lint:eslint  # ESLint 检查
cd frontend && npm run lint:all     # tsc + ESLint 全量检查

# 后端
cd backend && npm run dev           # 启动开发服务器 http://localhost:3001
cd backend && npm run build         # 构建
cd backend && npm run lint          # TypeScript 类型检查 (tsc --noEmit)
cd backend && npm run lint:eslint   # ESLint 检查
cd backend && npm run lint:all      # tsc + ESLint 全量检查
```

## 代码规范

### 通用
- 使用中文注释和 commit message
- commit message 格式: `<type>: <描述>`，type 为 feat/fix/refactor/docs/chore 等
- 不要提交 .env 文件，环境变量参考 .env.example
- 所有代码提交前必须通过 `tsc --noEmit` 和 `eslint`（Claude Code hooks 自动执行）
- 代码格式化使用 Prettier，配置在根目录 `.prettierrc`

### 前端
- React 组件使用函数式组件 + TypeScript，不使用 class 组件
- React 19 不需要 `import React`，仅按需导入 hooks（`import { useState } from 'react'`）
- 样式统一使用 Tailwind CSS utility classes，**不写自定义 CSS**
- 视觉实现参考 `docs/design-system.md`，使用其中定义的 token 和 Tailwind class
- 如果多个组件有相同的 UI 模式（卡片、按钮、输入框等），提取为共享组件放在 `src/components/ui/` 目录
- 页面级组件放在 `src/components/`（后续迁移到 `src/pages/`），通用 UI 组件放在 `src/components/ui/`
- 图标统一使用 Lucide React，不混用其他图标库
- 路径别名：`@/` 指向 `src/`

### 后端
- 路由定义放 `src/routes/`，业务逻辑放 `src/services/`
- 数据模型在 `prisma/schema.prisma` 中定义
- API 响应格式统一：`{ code: number, data: T, message: string }`
- 不使用 `console.log`，使用 `console.warn`（信息）或 `console.error`（错误）
- 路径别名：`@/` 指向 `src/`

## 项目结构

```
zora-blog/
├── package.json             # 根目录统一 scripts（lint/format）
├── .prettierrc              # Prettier 统一配置
├── AGENTS.md
├── docs/
│   ├── PRD.md               # 产品需求文档
│   ├── design-system.md     # 设计系统规范（LLM 友好）
│   ├── development-plan.md  # 开发计划（M1-M8）
│   └── stitch/              # 设计稿截图（11 张）
├── frontend/                # 前端项目
│   ├── src/
│   │   ├── components/      # 页面级组件
│   │   │   └── ui/          # 共享 UI 组件（按钮、卡片、输入框等）
│   │   ├── App.tsx          # 主应用，路由/视图切换
│   │   ├── main.tsx         # 入口文件
│   │   └── index.css        # Tailwind 入口
│   ├── eslint.config.js
│   ├── package.json
│   ├── tsconfig.json        # strict: true
│   └── vite.config.ts
├── backend/                 # 后端项目
│   ├── src/
│   │   ├── index.ts         # Hono 入口
│   │   ├── routes/          # 路由定义
│   │   ├── services/        # 业务逻辑
│   │   ├── middleware/       # 中间件（认证、日志、错误处理）
│   │   └── lib/             # 工具函数（env、prisma、jwt 等）
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   ├── eslint.config.js
│   ├── package.json
│   └── tsconfig.json        # strict: true
└── .claude/
    └── settings.json        # Claude Code hooks（PostToolUse + PreToolUse）
```
