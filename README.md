# Zora Blog

个人博客网站，包含前端和后端代码。

## 项目结构

```
zora-blog/
├── frontend/          # 前端项目 (React + Vite + Tailwind CSS)
│   ├── src/
│   │   ├── App.tsx              # 主应用，路由/视图切换
│   │   ├── main.tsx             # 入口文件
│   │   ├── index.css            # Tailwind 入口
│   │   └── components/
│   │       ├── Sidebar.tsx          # 左侧导航栏（头像、导航、登录/关于）
│   │       ├── Discover.tsx         # C端探索页（新闻 + 文章列表）
│   │       ├── ContentManagement.tsx # B端内容管理（文章表格、搜索、筛选）
│   │       ├── ArticleDetail.tsx    # 文章详情阅读页
│   │       ├── ArticleEditor.tsx    # 文章编辑器（Markdown、设置面板）
│   │       └── Configuration.tsx    # 自定义界面（个人资料、外观主题）
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── .env.example
│   └── .gitignore
├── backend/           # 后端项目 (TODO)
└── README.md
```

## 技术栈

### 前端
- **框架**: React 19 + TypeScript
- **构建**: Vite 6
- **样式**: Tailwind CSS 4 (Vite 插件模式)
- **图标**: Lucide React
- **动画**: Motion (Framer Motion)
- **AI**: @google/genai (预留)

## Changelog

### 2026-04-13 - 初始化前端项目
- 从 Google AI Studio 导出前端原型，整理至 `frontend/` 目录
- 包含 6 个核心页面组件：探索页、内容管理、文章详情、文章编辑器、自定义界面、侧边栏
- 使用 mock 数据，尚未接入后端 API
- 重命名项目标识（package name、页面 title）

## 开发

```bash
cd frontend
npm install
npm run dev   # 启动开发服务器 http://localhost:3000
```

## 部署

TODO
