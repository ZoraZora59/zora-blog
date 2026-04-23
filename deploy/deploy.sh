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
  # prerender 走内网回环直连后端，避免构建时 nginx 正在 reload/配置不一致导致 502
  PRERENDER_API_BASE="http://127.0.0.1:3001" npm run build

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

# 同步并重载 Nginx 配置
# - 把仓库内的 deploy/nginx.conf 覆盖到宝塔 vhost 路径
# - 如果线上 nginx 未编译 ngx_brotli 模块，自动去除 brotli 指令后再 reload
# - nginx -t 失败时回滚到备份，避免 reload 把站点搞挂
reload_nginx() {
  log "同步 Nginx 配置..."

  local src="$DEPLOY_DIR/deploy/nginx.conf"
  local vhost_dir="/www/server/panel/vhost/nginx"
  local dst="$vhost_dir/www.zorazora.cn.conf"
  local backup="$vhost_dir/www.zorazora.cn.conf.bak"

  if [ ! -f "$src" ]; then
    warn "未找到 $src，跳过 nginx 配置同步"
    nginx -t && nginx -s reload
    return 0
  fi

  # 宝塔默认会根据站点类型生成 html_<domain>.conf，里面带 `expires 12h` 且声明相同
  # server_name，按字母顺序排在我们的 www.zorazora.cn.conf 之前被 nginx 加载，导致
  # 我们自定义的缓存/安全头被忽略（"conflicting server name ... ignored"）。
  # 统一把这些冲突文件改名为 .disabled，nginx 的 include *.conf 就不会再匹配到它们。
  for conflict in "$vhost_dir/html_www.zorazora.cn.conf" "$vhost_dir/html_zorazora.cn.conf"; do
    if [ -f "$conflict" ]; then
      warn "禁用冲突 vhost: $conflict"
      mv -f "$conflict" "$conflict.disabled"
    fi
  done

  # 备份当前线上配置
  if [ -f "$dst" ]; then
    cp -f "$dst" "$backup"
  fi

  cp -f "$src" "$dst"

  # 探测 brotli 模块是否可用；不可用时把 brotli* 指令注释掉，保证 nginx -t 能过
  if ! nginx -V 2>&1 | grep -q 'brotli'; then
    warn "nginx 未编译 ngx_brotli，暂时注释 brotli 指令"
    sed -i -E 's/^(\s*brotli[[:alnum:]_]*\s+.*;)/# \1/' "$dst"
  fi

  log "校验 Nginx 配置..."
  if ! nginx -t; then
    error_msg="nginx -t 失败，回滚配置"
    if [ -f "$backup" ]; then
      cp -f "$backup" "$dst"
      nginx -t
    fi
    error "$error_msg"
  fi

  log "重载 Nginx 配置..."
  nginx -s reload
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
