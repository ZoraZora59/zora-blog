#!/bin/bash
# Zora Blog 一键部署脚本
# 在服务器上运行: ./deploy.sh

set -e

# 配置
DEPLOY_DIR="/www/wwwroot/zora-blog"
REPO_DIR="$DEPLOY_DIR/repo"
BACKEND_DIR="$DEPLOY_DIR/backend"
FRONTEND_DIR="$DEPLOY_DIR/frontend"
LOG_FILE="/www/wwwlogs/zora-blog-deploy.log"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
  echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
  echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
  exit 1
}

warn() {
  echo -e "${YELLOW}[WARN]${NC} $1" | tee -a "$LOG_FILE"
}

# 检查必要工具
check_requirements() {
  log "检查部署环境..."
  command -v node >/dev/null 2>&1 || error "Node.js 未安装"
  command -v npm >/dev/null 2>&1 || error "npm 未安装"
  command -v pm2 >/dev/null 2>&1 || error "pm2 未安装"
  log "环境检查通过"
}

# 拉取最新代码（首次自动 clone；后续强制同步 origin/master，避免工作区漂移导致 merge 失败）
pull_code() {
  log "拉取最新代码..."
  if [ -d "$REPO_DIR/.git" ]; then
    cd "$REPO_DIR"
    git fetch origin master
    git reset --hard origin/master
    git clean -fd
  else
    log "首次部署，克隆仓库..."
    git clone https://github.com/ZoraZora59/zora-blog.git "$REPO_DIR"
  fi
}

# 同步代码到部署目录
sync_code() {
  log "同步代码到部署目录..."
  # 保留历史本地图片，供迁移脚本处理

  # 同步后端
  rsync -av --delete \
    --exclude 'node_modules' \
    --exclude '.env' \
    --exclude 'dist' \
    --exclude 'uploads/*' \
    --exclude 'data/*.mmdb' \
    --exclude 'data/*.tar.gz' \
    "$REPO_DIR/backend/" "$BACKEND_DIR/"

  # 同步前端
  rsync -av --delete \
    --exclude 'node_modules' \
    --exclude 'dist' \
    "$REPO_DIR/frontend/" "$FRONTEND_DIR/"

  # 同步部署配置
  rsync -av "$REPO_DIR/deploy/" "$DEPLOY_DIR/deploy/"

  log "代码同步完成"
}

# 安装依赖
install_dependencies() {
  log "安装后端依赖..."
  cd "$BACKEND_DIR"
  npm install   # 包含 devDependencies（构建需要 tsc/prisma 等）

  log "安装前端依赖..."
  cd "$FRONTEND_DIR"
  npm install

  log "依赖安装完成"
}

# 构建项目
build_project() {
  log "构建后端..."
  cd "$BACKEND_DIR"
  npm run build

  log "构建前端..."
  cd "$FRONTEND_DIR"
  npm run build

  log "构建完成"
}

# 数据库迁移
migrate_database() {
  log "执行数据库迁移..."
  cd "$BACKEND_DIR"
  npx prisma migrate deploy
  log "数据库迁移完成"
}

# 迁移历史本地图片到七牛云（非致命：未配置七牛或迁移失败时仅告警，不中断部署）
migrate_legacy_media() {
  log "迁移历史本地图片到七牛云..."
  cd "$BACKEND_DIR"
  if [ -z "${QINIU_ACCESS_KEY:-}" ] && ! grep -q '^QINIU_ACCESS_KEY=' .env 2>/dev/null; then
    warn "未配置 QINIU_ACCESS_KEY，跳过本地图片迁移"
    return 0
  fi
  if npm run media:migrate-to-qiniu; then
    log "历史本地图片迁移完成"
  else
    warn "历史本地图片迁移失败，继续部署（请稍后手动排查）"
  fi
}

# 重启服务
restart_service() {
  log "重启后端服务..."
  pm2 restart zora-blog-backend 2>/dev/null || {
    warn "服务未运行，启动新服务..."
    pm2 start /www/wwwroot/zora-blog/deploy/ecosystem.config.js --env production
  }
  pm2 save
  log "服务重启完成"
}

# 重载 Nginx
reload_nginx() {
  log "重载 Nginx 配置..."
  nginx -t && nginx -s reload
  log "Nginx 重载完成"
}

# 检查 MaxMind GeoLite2 数据库（M9 数据分析依赖）
check_geoip_db() {
  local mmdb="$BACKEND_DIR/data/GeoLite2-City.mmdb"
  if [ ! -f "$mmdb" ]; then
    warn "未发现 GeoLite2-City.mmdb，地理分析将为空"
    warn "如需启用，请运行: MAXMIND_LICENSE_KEY=xxx ./scripts/update-geoip.sh"
    return 0
  fi

  # 文件超过 45 天提醒更新
  if find "$mmdb" -mtime +45 | grep -q .; then
    warn "GeoLite2 数据库已超过 45 天未更新，建议运行 ./scripts/update-geoip.sh"
  fi

  local size
  size=$(stat -f%z "$mmdb" 2>/dev/null || stat -c%s "$mmdb")
  log "GeoLite2 数据库就绪（$((size / 1024 / 1024)) MB）"
}

# 主流程
main() {
  log "========== 开始部署 Zora Blog =========="

  check_requirements
  pull_code
  sync_code
  install_dependencies
  build_project
  migrate_database
  migrate_legacy_media
  check_geoip_db
  restart_service
  reload_nginx

  log "========== 部署完成 =========="
  log "访问: https://www.zorazora.cn"
}

main "$@"
