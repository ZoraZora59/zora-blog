#!/usr/bin/env bash
# Phase 3 CLI 验证。使用已构建的 dist/index.js，避开 npm link。
set -e

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
CLI="$ROOT/packages/cli/dist/index.js"
export ZORA_BASE_URL="${ZORA_BASE_URL:-https://www.zorazora.cn/api}"
: "${ZORA_TOKEN:?缺少 ZORA_TOKEN}"

TMP=$(mktemp -d -t zora-cli-verify-XXXX)
trap 'rm -rf "$TMP"' EXIT

pass=0
fail=0
check() {
  local name="$1"; shift
  if "$@" > /tmp/zora_out 2>&1; then
    echo "✓ $name"
    pass=$((pass+1))
  else
    echo "✗ $name"
    cat /tmp/zora_out | sed 's/^/    /'
    fail=$((fail+1))
  fi
}

echo "== Phase 3: CLI 验证 =="
echo "CLI: $CLI"
echo ""

check "--version" node "$CLI" --version
check "--help 无异常" node "$CLI" --help

echo ""
echo "-- 只读命令 --"
check "article list" node "$CLI" article list --limit 3
check "article list --json" node "$CLI" article list --limit 2 --json id,title,status
check "category list" node "$CLI" category list
check "tag list" node "$CLI" tag list
check "topic list" node "$CLI" topic list
check "comment list" node "$CLI" comment list --limit 3

echo ""
echo "-- article view --"
check "article view 1" node "$CLI" article view 1
check "article view by slug" node "$CLI" article view developer-by-day-adventurer-by-night
check "article view --content-only" node "$CLI" article view 1 --content-only

echo ""
echo "-- 写入流程：create (dry-run) --"
# 造一个 markdown
cat > "$TMP/post.md" <<EOF
---
title: "CLI 冒烟 $(date +%s)"
slug: cli-verify-$(date +%s)
category: tech-blog
tags: [cli-verify]
status: draft
---

# hello

正文 cli verify.
EOF
check "article create --dry-run" node "$CLI" article create "$TMP/post.md" --dry-run

echo ""
echo "-- 完整 create → edit → delete --"
SLUG="cli-verify-$(date +%s)"
cat > "$TMP/full.md" <<EOF
---
title: "CLI 完整流程 $SLUG"
slug: $SLUG
category: tech-blog
tags: [cli-verify]
status: draft
---

# 完整流程测试
EOF
CREATE_JSON=$(node "$CLI" article create "$TMP/full.md" --json id,slug,status)
echo "$CREATE_JSON"
ID=$(echo "$CREATE_JSON" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{console.log(JSON.parse(d).id)})")
echo "created id=$ID"
check "edit publish" node "$CLI" article edit "$ID" --publish
check "view 查看发布状态" node "$CLI" article view "$ID" --json id,status
check "delete --yes" node "$CLI" article delete "$ID" --yes

echo ""
echo "-- tag 流程 --"
TAGNAME="cli-smoke-$(date +%s)"
CREATE=$(node "$CLI" tag create "$TAGNAME" 2>&1)
TAGID=$(node "$CLI" tag list --json id,name | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{const a=JSON.parse(d);const found=a.find(t=>t.name==='$TAGNAME');console.log(found?found.id:'')})")
if [ -n "$TAGID" ]; then
  check "tag delete" node "$CLI" tag delete "$TAGID"
fi

echo ""
echo "== 通过 $pass / 失败 $fail =="
exit "$fail"
