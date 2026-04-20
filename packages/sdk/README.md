# @zora-blog/sdk

Internal TypeScript SDK wrapping the Zora Blog admin REST API. Consumed by `@zora-blog/cli` and `@zora-blog/mcp`.

## Quick usage

```ts
import { ZoraBlog } from "@zora-blog/sdk";

const sdk = new ZoraBlog({
  baseUrl: "https://www.zorazora.cn/api",
  token: "zora_xxx",
});

const articles = await sdk.articles.list({ status: "published", limit: 10 });
const article = await sdk.articles.getBySlug("my-post");
const created = await sdk.articles.create({
  title: "Hello",
  content: "# Hi",
  status: "draft",
});
```

## Surface

- `sdk.auth.me()` — verify token / current admin
- `sdk.articles` — list / get / getBySlug / create / update / delete / publish / unpublish
- `sdk.categories`, `sdk.tags`, `sdk.topics`, `sdk.comments` — CRUD/list
- `sdk.uploads.upload({ data, filename, mimeType })` — push image to 七牛 via backend

## Markdown helper

```ts
import { processMarkdownFile } from "@zora-blog/sdk/markdown";

const { content, frontmatter, uploadedImages, errors } = await processMarkdownFile(
  "./post.md",
  { sdk },
);
```

Scans markdown (and `frontmatter.cover`) for local image paths, uploads each to the backend, rewrites URLs to CDN, and caches hashes in `.zora-cache.json` to avoid re-uploading.

## Errors

All network errors surface as `ZoraApiError(code, message, data)`. `code` is the HTTP status (or backend `code` field).
