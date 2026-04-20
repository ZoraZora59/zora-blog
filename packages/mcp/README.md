# zora-blog MCP server

Model Context Protocol server exposing the Zora Blog admin API to AI agents (Claude Desktop, Cursor, etc.). Counterpart to the `zora-blog` CLI—same SDK underneath.

## Install

```bash
npm run build:sdk && npm run build:mcp
# entry point
node packages/mcp/dist/index.js --help
```

## Modes

### stdio (default, for desktop clients)

```bash
ZORA_BASE_URL=https://www.zorazora.cn/api \
ZORA_TOKEN=zora_xxx \
node packages/mcp/dist/index.js
```

Claude Desktop config snippet (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "zora-blog": {
      "command": "node",
      "args": ["/abs/path/to/zora-blog/packages/mcp/dist/index.js"],
      "env": {
        "ZORA_BASE_URL": "https://www.zorazora.cn/api",
        "ZORA_TOKEN": "zora_xxx"
      }
    }
  }
}
```

### HTTP (Streamable HTTP transport)

```bash
node packages/mcp/dist/index.js --http --port 3030 --host 0.0.0.0
# endpoint: http://<host>:3030/mcp
```

Use when the agent can't spawn a local process (remote deployments, multiple users). Client config depends on the agent.

## Tools exposed

| Tool | Purpose |
|------|---------|
| `list_articles` | Paged list with status / search filters |
| `get_article` | Full article incl. Markdown body (by id or slug) |
| `create_article` | Create from Markdown string; auto-uploads local images when `base_dir` is given (stdio only) |
| `update_article` | Partial update; pass `markdown` to rewrite body |
| `delete_article` | |
| `upload_image` | Either local `path` (stdio) or `base64` + `mime_type` + `filename` (HTTP-safe) |
| `list_taxonomy` | One tool for `category` / `tag` / `topic` listings |
| `list_pending_comments` | |
| `moderate_comment` | `approve` \| `reject` \| `delete` |

## Image upload in `create_article`

- **stdio mode**: agent passes `markdown` + `base_dir` (absolute path). Server reads local files, uploads, rewrites URLs, then submits.
- **HTTP mode**: server can't read client-side files. Agent should upload each image via `upload_image` with `base64` first, then assemble full CDN URLs in the `markdown` body it sends to `create_article`.
