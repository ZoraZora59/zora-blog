# zora-blog CLI

Command-line companion for the Zora Blog admin API. Think `gh` for your own blog.

## Install (GitHub only, no npm publish)

```bash
git clone https://github.com/ZoraGK/zora-blog.git
cd zora-blog
npm install
npm run build:sdk && npm run build:cli

# option A: global symlink
npm link -w packages/cli
zora-blog --help

# option B: direct invocation
node packages/cli/dist/index.js --help
```

## First run

No default API URL is baked in. The first time you run any command without a config, the CLI prompts for URL + token and saves them to `~/.config/zora-blog/config.json` (mode 0600).

```
$ zora-blog article list
未检测到配置，启动初始化…
? Blog API URL: https://www.zorazora.cn/api
? API Token (zora_xxx): ****************
✓ 验证通过，配置已保存
```

Non-interactive alternative:

```bash
zora-blog auth login --url https://www.zorazora.cn/api --token zora_xxx
# or env vars (override config file)
export ZORA_BASE_URL=https://...
export ZORA_TOKEN=zora_xxx
```

## Commands

```
zora-blog auth login | status | logout
zora-blog config show | set url <...> | set token <...>

zora-blog article list [--status draft|published|all] [--search kw] [--limit 20] [--json [fields]]
zora-blog article view <id|slug> [--content-only] [--json]
zora-blog article create <file.md> [--dry-run] [--no-cache] [--status ...]
zora-blog article edit <id|slug> [file.md] [--publish] [--unpublish] [--status ...] [--dry-run]
zora-blog article pull <id|slug> [--out ./posts]
zora-blog article delete <id> [--yes]
zora-blog article publish <id>
zora-blog article unpublish <id>

zora-blog category list | create <name> | delete <id>
zora-blog tag      list | create <name> | delete <id>
zora-blog topic    list | delete <id>

zora-blog comment list [--status pending|approved|rejected|all] [--article <id>] [--json]
zora-blog comment approve | reject | delete <id>

zora-blog image upload <file> [--json]
```

## Markdown frontmatter

`article create` / `edit` reads YAML frontmatter. All fields optional:

```markdown
---
title: 我的新文章
slug: my-new-post          # 缺省由后端从 title 生成
category: tech-blog        # 名字或 slug 或 id
tags: [react, typescript]  # 名字（自动创建）或 id 混写
topics: []
status: draft              # draft | published
cover: ./assets/cover.jpg  # 本地路径会自动上传；http(s) URL 保持不变
excerpt: 可选，不写后端自动从正文截取前 150 字
---

# 正文

嵌入本地图片：

![截图](./assets/screenshot.png)
```

**图片上传**：CLI 扫描 markdown 正文和 `frontmatter.cover` 的所有本地引用，上传到七牛，把 URL 改回来再提交。哈希缓存写在同目录的 `.zora-cache.json`，下次不再重传未变更的图片。

`--dry-run` 只扫描不上传不提交，`--no-cache` 强制重传。

## Exit codes

- `0` — 成功
- `1` — 未知错误
- `2` — 参数错误
- `4` — 鉴权错误（token 失效或缺失）
