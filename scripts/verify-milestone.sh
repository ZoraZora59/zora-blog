#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FAILED=0

usage() {
  cat <<'EOF'
用法：
  ./scripts/verify-milestone.sh M1
  ./scripts/verify-milestone.sh M2
  ./scripts/verify-milestone.sh --list
EOF
}

note() {
  printf '\n[%s] %s\n' "INFO" "$1"
}

ok() {
  printf '[%s] %s\n' " OK " "$1"
}

fail() {
  printf '[%s] %s\n' "FAIL" "$1"
  FAILED=1
}

require_path() {
  local path="$1"
  local label="$2"
  if [ -e "$path" ]; then
    ok "$label"
  else
    fail "$label (缺少: $path)"
  fi
}

require_any_path() {
  local label="$1"
  shift

  local path
  for path in "$@"; do
    if [ -e "$path" ]; then
      ok "$label -> $path"
      return
    fi
  done

  fail "$label (候选路径均不存在)"
}

run_npm_script() {
  local dir="$1"
  local script="$2"
  local label="$3"

  if [ ! -f "$dir/package.json" ]; then
    fail "$label (缺少 package.json: $dir)"
    return
  fi

  note "执行: (cd $dir && npm run $script)"
  if (cd "$dir" && npm run "$script"); then
    ok "$label"
  else
    fail "$label"
  fi
}

print_manual_header() {
  printf '\n手动验证清单：\n'
}

list_milestones() {
  cat <<'EOF'
支持的里程碑：
  M1  后端基础
  M2  前端基础
  M3  B 端管理
  M4  评论系统
  M5  专题系统
  M6  扩展功能
  M7  打磨
  M8  部署
EOF
}

if [ "${1:-}" = "--list" ]; then
  list_milestones
  exit 0
fi

if [ $# -ne 1 ]; then
  usage
  exit 1
fi

MILESTONE="$1"

case "$MILESTONE" in
  M1)
    note "检查 M1 后端基础"
    require_path "$ROOT_DIR/backend/package.json" "backend/package.json"
    require_path "$ROOT_DIR/backend/tsconfig.json" "backend/tsconfig.json"
    require_path "$ROOT_DIR/backend/.env.example" "backend/.env.example"
    require_path "$ROOT_DIR/backend/src/index.ts" "backend/src/index.ts"
    require_path "$ROOT_DIR/backend/src/routes" "backend/src/routes"
    require_path "$ROOT_DIR/backend/src/services" "backend/src/services"
    require_path "$ROOT_DIR/backend/src/middleware" "backend/src/middleware"
    require_path "$ROOT_DIR/backend/src/lib" "backend/src/lib"
    require_path "$ROOT_DIR/backend/prisma/schema.prisma" "backend/prisma/schema.prisma"

    if [ -f "$ROOT_DIR/backend/package.json" ]; then
      run_npm_script "$ROOT_DIR/backend" "lint" "backend lint"
      run_npm_script "$ROOT_DIR/backend" "build" "backend build"
    fi

    print_manual_header
    cat <<'EOF'
  - 启动 backend：cd backend && npm run dev
  - curl GET /
  - curl 登录、生成 API Key、吊销 API Key
  - curl 创建草稿 -> 更新 -> 发布 -> C 端读取 -> 删除
  - 上传图片并在浏览器访问返回 URL
EOF
    ;;
  M2)
    note "检查 M2 前端基础"
    require_path "$ROOT_DIR/frontend/src/components/ui" "frontend/src/components/ui"
    require_path "$ROOT_DIR/frontend/src/components/layout" "frontend/src/components/layout"
    require_path "$ROOT_DIR/frontend/src/pages/Home.tsx" "frontend/src/pages/Home.tsx"
    require_path "$ROOT_DIR/frontend/src/pages/ArticleDetail.tsx" "frontend/src/pages/ArticleDetail.tsx"
    require_path "$ROOT_DIR/frontend/src/lib/api.ts" "frontend/src/lib/api.ts"
    require_path "$ROOT_DIR/frontend/src/hooks" "frontend/src/hooks"

    run_npm_script "$ROOT_DIR/frontend" "lint" "frontend lint"
    run_npm_script "$ROOT_DIR/frontend" "build" "frontend build"

    print_manual_header
    cat <<'EOF'
  - 浏览器访问 / 与 /articles/:slug
  - 检查首页、文章详情桌面端截图是否对齐 stitch
  - 检查移动端首页是否对齐 06-home-mobile
  - 检查 Markdown、TOC、代码块复制、阅读进度条
  - 检查 Light / Dark 模式
EOF
    ;;
  M3)
    note "检查 M3 B 端管理"
    require_path "$ROOT_DIR/frontend/src/components/layout/AdminLayout.tsx" "frontend/src/components/layout/AdminLayout.tsx"
    require_path "$ROOT_DIR/frontend/src/pages/Login.tsx" "frontend/src/pages/Login.tsx"
    require_path "$ROOT_DIR/frontend/src/pages/admin/Dashboard.tsx" "frontend/src/pages/admin/Dashboard.tsx"
    require_path "$ROOT_DIR/frontend/src/pages/admin/Posts.tsx" "frontend/src/pages/admin/Posts.tsx"
    require_path "$ROOT_DIR/frontend/src/pages/admin/PostEditor.tsx" "frontend/src/pages/admin/PostEditor.tsx"
    require_path "$ROOT_DIR/frontend/src/pages/admin/Settings.tsx" "frontend/src/pages/admin/Settings.tsx"

    run_npm_script "$ROOT_DIR/frontend" "lint" "frontend lint"
    run_npm_script "$ROOT_DIR/frontend" "build" "frontend build"

    if [ -f "$ROOT_DIR/backend/package.json" ]; then
      run_npm_script "$ROOT_DIR/backend" "lint" "backend lint"
      run_npm_script "$ROOT_DIR/backend" "build" "backend build"
    fi

    print_manual_header
    cat <<'EOF'
  - 未登录访问 /admin 是否跳转 /login
  - 登录后是否进入 Dashboard
  - Quick Draft 是否可保存
  - 从 Posts 进入编辑器并发布文章
  - 检查 login/dashboard/posts/editor/settings 的页面截图
EOF
    ;;
  M4)
    note "检查 M4 评论系统"
    require_path "$ROOT_DIR/frontend/src/pages/admin/Comments.tsx" "frontend/src/pages/admin/Comments.tsx"
    require_path "$ROOT_DIR/backend/src/routes" "backend/src/routes"

    run_npm_script "$ROOT_DIR/frontend" "lint" "frontend lint"
    run_npm_script "$ROOT_DIR/frontend" "build" "frontend build"

    if [ -f "$ROOT_DIR/backend/package.json" ]; then
      run_npm_script "$ROOT_DIR/backend" "lint" "backend lint"
      run_npm_script "$ROOT_DIR/backend" "build" "backend build"
    fi

    print_manual_header
    cat <<'EOF'
  - 在文章详情页提交评论
  - 在后台审核 approve / reject / delete
  - 返回 C 端确认 approved 评论可见
  - 对照 07-comment-mgmt 截图检查后台布局
EOF
    ;;
  M5)
    note "检查 M5 专题系统"
    require_path "$ROOT_DIR/frontend/src/pages/Topics.tsx" "frontend/src/pages/Topics.tsx"
    require_path "$ROOT_DIR/frontend/src/pages/TopicDetail.tsx" "frontend/src/pages/TopicDetail.tsx"
    require_path "$ROOT_DIR/frontend/src/pages/admin/Topics.tsx" "frontend/src/pages/admin/Topics.tsx"
    require_path "$ROOT_DIR/frontend/src/pages/admin/TopicEditor.tsx" "frontend/src/pages/admin/TopicEditor.tsx"

    run_npm_script "$ROOT_DIR/frontend" "lint" "frontend lint"
    run_npm_script "$ROOT_DIR/frontend" "build" "frontend build"

    if [ -f "$ROOT_DIR/backend/package.json" ]; then
      run_npm_script "$ROOT_DIR/backend" "lint" "backend lint"
      run_npm_script "$ROOT_DIR/backend" "build" "backend build"
    fi

    print_manual_header
    cat <<'EOF'
  - 后台创建专题并关联文章
  - 调整关联文章排序
  - 前台查看 /topics 与 /topics/:slug
  - 对照 08-sports-gear 截图检查专题详情布局
EOF
    ;;
  M6)
    note "检查 M6 扩展功能"
    require_path "$ROOT_DIR/frontend/src/pages/About.tsx" "frontend/src/pages/About.tsx"
    require_path "$ROOT_DIR/frontend/src/pages/Search.tsx" "frontend/src/pages/Search.tsx"
    require_any_path "frontend/src/hooks/useTheme" \
      "$ROOT_DIR/frontend/src/hooks/useTheme.ts" \
      "$ROOT_DIR/frontend/src/hooks/useTheme.tsx"

    run_npm_script "$ROOT_DIR/frontend" "lint" "frontend lint"
    run_npm_script "$ROOT_DIR/frontend" "build" "frontend build"

    if [ -f "$ROOT_DIR/backend/package.json" ]; then
      run_npm_script "$ROOT_DIR/backend" "lint" "backend lint"
      run_npm_script "$ROOT_DIR/backend" "build" "backend build"
    fi

    print_manual_header
    cat <<'EOF'
  - 检查 /about 数据展示
  - 检查 /search?q= 命中、高亮和空状态
  - 检查 Light / Dark / System 三种主题及 localStorage 持久化
EOF
    ;;
  M7)
    note "检查 M7 打磨"
    require_path "$ROOT_DIR/frontend/src/components/layout/MobileNav.tsx" "frontend/src/components/layout/MobileNav.tsx"

    run_npm_script "$ROOT_DIR/frontend" "lint" "frontend lint"
    run_npm_script "$ROOT_DIR/frontend" "build" "frontend build"

    if [ -f "$ROOT_DIR/backend/package.json" ]; then
      run_npm_script "$ROOT_DIR/backend" "lint" "backend lint"
      run_npm_script "$ROOT_DIR/backend" "build" "backend build"
    fi

    print_manual_header
    cat <<'EOF'
  - 在 375px、768px、1280px 断点检查页面无溢出
  - 检查首页、登录页、文章详情动效是否贴近 stitch 动效稿
  - 输出 Lighthouse Performance 与 Accessibility 报告
  - 检查键盘导航、焦点态、颜色对比度
EOF
    ;;
  M8)
    note "检查 M8 部署"
    require_any_path "CI/CD 或部署配置" \
      "$ROOT_DIR/.github/workflows" \
      "$ROOT_DIR/docker-compose.yml" \
      "$ROOT_DIR/deploy" \
      "$ROOT_DIR/ops" \
      "$ROOT_DIR/infra"

    print_manual_header
    cat <<'EOF'
  - 按部署文档走一遍部署流程
  - 检查域名访问、HTTPS、/api、/uploads
  - 检查数据库迁移、服务重启、日志和备份策略
  - 附 workflow 记录或部署日志摘要
EOF
    ;;
  *)
    usage
    exit 1
    ;;
esac

if [ "$FAILED" -ne 0 ]; then
  printf '\n结果：存在未通过项，请修复后重试。\n'
  exit 1
fi

printf '\n结果：自动检查通过。请继续完成手动验证清单。\n'
