#!/usr/bin/env bash
# 更新 MaxMind GeoLite2-City.mmdb 数据库
#
# 使用方式：
#   export MAXMIND_LICENSE_KEY=your_key   # 在 https://www.maxmind.com 注册免费账号获取
#   ./scripts/update-geoip.sh
#
# 输出：backend/data/GeoLite2-City.mmdb （会覆盖旧文件）

set -euo pipefail

if [[ -z "${MAXMIND_LICENSE_KEY:-}" ]]; then
  echo "错误：未设置 MAXMIND_LICENSE_KEY 环境变量"
  echo "请到 https://www.maxmind.com/en/accounts/current/license-key 申请免费 license key"
  exit 1
fi

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DATA_DIR="$REPO_ROOT/backend/data"
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

mkdir -p "$DATA_DIR"

echo "[1/3] 下载 GeoLite2-City..."
curl -fsSL -o "$TMP_DIR/geoip.tar.gz" \
  "https://download.maxmind.com/app/geoip_download?edition_id=GeoLite2-City&license_key=${MAXMIND_LICENSE_KEY}&suffix=tar.gz"

echo "[2/3] 解压..."
tar -xzf "$TMP_DIR/geoip.tar.gz" -C "$TMP_DIR"

MMDB_FILE="$(find "$TMP_DIR" -name 'GeoLite2-City.mmdb' | head -n 1)"
if [[ -z "$MMDB_FILE" ]]; then
  echo "错误：未在解压结果中找到 GeoLite2-City.mmdb"
  exit 1
fi

SIZE=$(stat -f%z "$MMDB_FILE" 2>/dev/null || stat -c%s "$MMDB_FILE")
if [[ "$SIZE" -lt 50000000 ]]; then
  echo "警告：mmdb 文件大小 ${SIZE} 字节，疑似异常（正常 ≥ 70MB）"
  exit 1
fi

echo "[3/3] 安装到 $DATA_DIR/GeoLite2-City.mmdb (${SIZE} 字节)"
mv "$MMDB_FILE" "$DATA_DIR/GeoLite2-City.mmdb"

echo "完成"
