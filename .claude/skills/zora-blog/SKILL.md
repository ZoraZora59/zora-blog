---
name: zora-blog
description: Manage Zora Blog articles, categories, tags, topics, and comments through the `zora-blog` CLI or `@zora-blog/mcp` MCP server. Use whenever the user mentions 博客 / Zora Blog / 发文章 / 管理文章 / 博客评论审核 / 上传博客图片, or asks to draft, publish, edit, pull, or moderate content on this specific blog. Covers configuration, frontmatter schema, image-upload pipeline, and tool selection (CLI vs MCP).
user-invocable: true
---

# Zora Blog Skill

Operate the author's personal blog through two equivalent tools built on the same SDK:

- **`zora-blog` CLI** — shell companion, think `gh` for this blog. Best for local authoring workflows (write a `.md` file → publish).
- **`@zora-blog/mcp` MCP server** — exposes the same surface as MCP tools. Best when the agent is driving the workflow end-to-end inside a chat.

Both wrap the backend REST API (`<BLOG_API_BASE_URL>`) with Bearer token auth. Source: `packages/cli`, `packages/mcp`, `packages/sdk` in the monorepo.

## When to use which

| Situation | Pick |
|---|---|
| User runs commands in their terminal / scripting | **CLI** |
| Agent inside Claude Desktop / Cursor driving the blog | **MCP (stdio)** |
| Remote agent / cloud workflow, no local process spawn | **MCP (HTTP)** |
| Bulk image upload from a local folder | **CLI** or **MCP stdio** (both can read local files) |
| Agent must assemble article in-memory and publish | **MCP** with `upload_image` (base64) + `create_article` |

If both are viable, default to **CLI** when the user already has a local `.md` file, and **MCP** when the agent is composing the article itself.

## Prerequisites

1. **Clone & build** (one-time):
   ```bash
   git clone https://github.com/ZoraGK/zora-blog.git
   cd zora-blog
   npm install
   npm run build:sdk && npm run build:cli && npm run build:mcp
   ```
2. **API token** — format `zora_xxx`. Admin-only. Ask the user to generate one from the blog admin panel if missing.
3. **Base URL** — configure from environment (for example `https://blog.example.com/api`). Local dev is typically `http://localhost:3001/api`.

## CLI setup

### First run (interactive)
```bash
zora-blog article list
# → prompts for Blog API URL + token, saves to ~/.config/zora-blog/config.json (mode 0600)
```

### Non-interactive
```bash
zora-blog auth login --url https://blog.example.com/api --token zora_xxx
# or env (overrides config file):
export ZORA_BASE_URL=https://blog.example.com/api
export ZORA_TOKEN=zora_xxx
```

Global CLI flags: `--base-url`, `--token`, `--no-interactive`, `--json`.

### Key commands
```
zora-blog auth    login | status | logout
zora-blog config  show | set url <...> | set token <...>

zora-blog article list   [--status draft|published|all] [--search kw] [--limit 20] [--json]
zora-blog article view   <id|slug> [--content-only] [--json]
zora-blog article create <file.md> [--dry-run] [--no-cache] [--status ...]
zora-blog article edit   <id|slug> [file.md] [--publish] [--unpublish] [--status ...]
zora-blog article pull   <id|slug> [--out ./posts]
zora-blog article delete <id> [--yes]
zora-blog article publish|unpublish <id>

zora-blog category|tag|topic list | create <name> | delete <id>
zora-blog comment list [--status pending|approved|rejected|all] [--article <id>]
zora-blog comment approve|reject|delete <id>
zora-blog image upload <file> [--json]
```

### CLI exit codes
`0` success · `1` unknown · `2` arg error · `4` auth error (token invalid/missing).

## MCP setup

### stdio (desktop clients — Claude Desktop, Cursor)

Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json`):
```json
{
  "mcpServers": {
    "zora-blog": {
      "command": "node",
        "args": ["/abs/path/to/zora-blog/packages/mcp/dist/index.js"],
        "env": {
        "ZORA_BASE_URL": "https://blog.example.com/api",
        "ZORA_TOKEN": "zora_xxx"
      }
    }
  }
}
```

### HTTP (remote agents)
```bash
ZORA_BASE_URL=... ZORA_TOKEN=... \
node packages/mcp/dist/index.js --http --port 3030 --host 0.0.0.0
# endpoint: http://<host>:3030/mcp
```

### MCP tools

| Tool | Use when |
|---|---|
| `list_articles` | Browse / search — supports `status`, `search`, `limit`, `page` |
| `get_article` | Fetch full Markdown body by `id` **or** `slug` |
| `create_article` | New post. stdio: pass `markdown` + `base_dir` → auto-uploads local images. HTTP: pre-upload via `upload_image` then send rewritten `markdown` |
| `update_article` | Partial update; pass `markdown` to rewrite body |
| `delete_article` | |
| `upload_image` | stdio: `path`. HTTP: `base64` + `mime_type` + `filename` |
| `list_taxonomy` | Unified list for `category` / `tag` / `topic` |
| `list_pending_comments` | Moderation queue |
| `moderate_comment` | `approve` \| `reject` \| `delete` |

## Markdown frontmatter schema

CLI `article create` / `edit` and MCP `create_article` / `update_article` read YAML frontmatter:

```markdown
---
title: 我的新文章
slug: my-new-post          # optional — backend derives from title
category: tech-blog        # name | slug | id
tags: [react, typescript]  # names (auto-created) or ids
topics: []
status: draft              # draft | published
cover: ./assets/cover.jpg  # local path auto-uploaded; http(s) URL kept as-is
excerpt: 可选摘要            # omit → backend takes first 150 chars
---

# 正文

![截图](./assets/screenshot.png)
```

## Image upload pipeline

Both CLI and MCP (stdio) perform the same automatic flow:

1. Parse frontmatter → process `frontmatter.cover`.
2. Walk Markdown AST → collect local `![](...)` references.
3. Skip `http(s)://` URLs.
4. For each local path: hash (SHA-256) → check `.zora-cache.json` sibling → if unchanged, reuse cached CDN URL; else upload via `/admin/upload` to CDN (`<CDN_BASE_URL>/zora_blog/{prod|non-prod}/...`).
5. Rewrite URLs in-memory and submit.

Flags: `--dry-run` (scan only, no upload, no submit), `--no-cache` (force re-upload).

**MCP HTTP mode caveat**: server can't see client-side files. Agent must call `upload_image` with `base64` + `mime_type` + `filename` for each asset first, collect the returned CDN URLs, then send fully-resolved `markdown` to `create_article`.

## Common workflows

### Publish a local draft
```bash
zora-blog article create ./posts/hello.md --status published
```

### Pull an existing post to edit
```bash
zora-blog article pull my-post --out ./posts
# edit ./posts/my-post.md
zora-blog article edit my-post ./posts/my-post.md
```

### Moderate comments
```bash
zora-blog comment list --status pending --json
zora-blog comment approve <id>
```

### Agent flow via MCP (stdio)
1. `list_articles({ status: "published", limit: 5 })` to see recent.
2. Compose Markdown, save to a temp file or keep in memory with `base_dir`.
3. `create_article({ markdown, base_dir: "/abs/path/to/assets" })`.

## Troubleshooting

| Symptom | Cause / fix |
|---|---|
| CLI exit code `4`, MCP tool error `401` | Token missing or expired. `zora-blog auth login` or refresh `ZORA_TOKEN`. |
| `404 文章不存在` on `getBySlug` | Slug doesn't exist; SDK also falls back to a paginated scan if the `/admin/articles/by-slug/:slug` endpoint isn't deployed yet. |
| Image shows as broken after publish | Check `.zora-cache.json`; rerun with `--no-cache` to force re-upload. Verify local path resolves relative to the `.md` file. |
| MCP HTTP `create_article` fails on images | HTTP server can't read local files. Use `upload_image` with `base64` first, then send rewritten markdown. |
| Category/tag not found | Pass the name as-is — backend auto-creates tags; categories must pre-exist (create via `zora-blog category create <name>`). |

## Don'ts

- Do **not** publish npm packages (`@zora-blog/*` are workspace-internal only).
- Do **not** upload images directly to 七牛 — always go through `/admin/upload` so backend records ownership and applies the correct `prod|non-prod` prefix.
- Do **not** hard-code a default base URL in tooling — CLI is intentionally URL-less until first run.
- Do **not** use `--dry-run` output as a signal the post was published; it skips the submit.

## References

- CLI source & README: `packages/cli/`
- MCP source & README: `packages/mcp/`
- SDK source & README: `packages/sdk/`
- Backend admin routes: `backend/src/routes/admin.ts`, `backend/src/routes/auth.ts`
