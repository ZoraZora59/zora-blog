import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { ZoraBlog } from "@zora-blog/sdk";
import { processMarkdown } from "@zora-blog/sdk/markdown";

const MIME_BY_EXT: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
};

function json(value: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(value, null, 2) }] };
}

function errorContent(message: string) {
  return { content: [{ type: "text" as const, text: `ERROR: ${message}` }], isError: true };
}

export function buildMcpServer(sdk: ZoraBlog): McpServer {
  const server = new McpServer({
    name: "zora-blog-mcp",
    version: "0.1.0",
  });

  // ---------- 文章 ----------

  server.tool(
    "list_articles",
    "列出博客文章。支持按状态过滤和关键字搜索，返回分页结果。",
    {
      status: z.enum(["draft", "published", "all"]).optional(),
      search: z.string().optional(),
      limit: z.number().int().min(1).max(100).optional(),
      offset: z.number().int().min(0).optional(),
    },
    async (args) => {
      try {
        const r = await sdk.articles.list(args);
        return json({
          total: r.pagination.total,
          items: r.items.map((a) => ({
            id: a.id,
            title: a.title,
            slug: a.slug,
            status: a.status,
            category: a.category.name,
            tags: a.tags.map((t) => t.name),
            publishedAt: a.publishedAt,
            updatedAt: a.updatedAt,
          })),
        });
      } catch (err) {
        return errorContent((err as Error).message);
      }
    },
  );

  server.tool(
    "get_article",
    "获取单篇文章的完整内容（含 Markdown 正文）。传入 id 或 slug 任一。",
    {
      id: z.number().int().optional(),
      slug: z.string().optional(),
    },
    async ({ id, slug }) => {
      try {
        if (!id && !slug) return errorContent("必须提供 id 或 slug");
        const article = id ? await sdk.articles.get(id) : await sdk.articles.getBySlug(slug!);
        if (!article) return errorContent(`未找到：${slug ?? id}`);
        return json(article);
      } catch (err) {
        return errorContent((err as Error).message);
      }
    },
  );

  server.tool(
    "create_article",
    `新建文章。markdown 参数是完整 Markdown（可含 YAML frontmatter）。
若正文或 frontmatter.cover 引用了本地图片路径（./xxx.png）且提供了 base_dir，
server 会自动读取本地文件、上传到七牛、把 URL 改回 markdown 再提交。`,
    {
      markdown: z.string().describe("Markdown 内容，建议带 frontmatter（title/slug/category/tags/status/cover）"),
      base_dir: z
        .string()
        .optional()
        .describe("相对路径解析根目录。仅本地 MCP 进程有效；http 模式请用绝对 URL"),
      status_override: z.enum(["draft", "published"]).optional(),
    },
    async ({ markdown, base_dir, status_override }) => {
      try {
        const processed = await processMarkdown(markdown, {
          sdk,
          baseDir: base_dir ?? process.cwd(),
        });
        if (processed.errors.length && !base_dir) {
          return errorContent(
            `Markdown 引用了本地图片但未提供 base_dir：\n${processed.errors.join("\n")}`,
          );
        }
        const fm = processed.frontmatter;
        const input: Parameters<typeof sdk.articles.create>[0] = {
          title: fm.title,
          slug: fm.slug,
          excerpt: fm.excerpt,
          coverImage: fm.cover ?? null,
          status: status_override ?? fm.status,
          content: processed.content,
        };
        if (typeof fm.category === "number") input.categoryId = fm.category;
        else if (typeof fm.category === "string") {
          const cats = await sdk.categories.list();
          const found = cats.find((c) => c.name === fm.category || c.slug === fm.category);
          if (found) input.categoryId = found.id;
        }
        if (Array.isArray(fm.tags)) {
          const ids: number[] = [];
          const names: string[] = [];
          for (const t of fm.tags) {
            if (typeof t === "number") ids.push(t);
            else if (typeof t === "string") names.push(t);
          }
          if (ids.length) input.tagIds = ids;
          if (names.length) input.tags = names;
        }
        const created = await sdk.articles.create(input);
        return json({
          id: created.id,
          slug: created.slug,
          status: created.status,
          uploaded: processed.uploadedImages.map((u) => ({ src: u.relativePath, url: u.url, reused: u.reused })),
          warnings: processed.errors,
        });
      } catch (err) {
        return errorContent((err as Error).message);
      }
    },
  );

  server.tool(
    "update_article",
    "更新文章。可局部传字段；markdown 传入时会重新处理图片并整体覆盖内容。",
    {
      id: z.number().int(),
      markdown: z.string().optional(),
      base_dir: z.string().optional(),
      status: z.enum(["draft", "published"]).optional(),
      title: z.string().optional(),
      slug: z.string().optional(),
      excerpt: z.string().nullable().optional(),
    },
    async (args) => {
      try {
        const input: Parameters<typeof sdk.articles.update>[1] = {
          status: args.status,
          title: args.title,
          slug: args.slug,
          excerpt: args.excerpt,
        };
        if (args.markdown) {
          const processed = await processMarkdown(args.markdown, {
            sdk,
            baseDir: args.base_dir ?? process.cwd(),
          });
          input.content = processed.content;
          if (processed.frontmatter.cover !== undefined) {
            input.coverImage = processed.frontmatter.cover;
          }
        }
        const r = await sdk.articles.update(args.id, input);
        return json({ id: r.id, slug: r.slug, status: r.status });
      } catch (err) {
        return errorContent((err as Error).message);
      }
    },
  );

  server.tool(
    "delete_article",
    "删除一篇文章。",
    { id: z.number().int() },
    async ({ id }) => {
      try {
        await sdk.articles.delete(id);
        return json({ deleted: id });
      } catch (err) {
        return errorContent((err as Error).message);
      }
    },
  );

  // ---------- 图片 ----------

  server.tool(
    "upload_image",
    "上传图片到七牛 CDN，返回公共 URL。path 读本地文件（仅 stdio 模式）；base64 用于 HTTP 模式或 AI 直接传字节。",
    {
      path: z.string().optional().describe("本地文件绝对或相对路径"),
      base64: z.string().optional().describe("Base64 编码的图片数据"),
      mime_type: z
        .enum(["image/jpeg", "image/png", "image/gif", "image/webp"])
        .optional(),
      filename: z.string().optional().describe("base64 模式必填；path 模式可留空"),
    },
    async ({ path: filePath, base64, mime_type, filename }) => {
      try {
        let buffer: Buffer;
        let mime: string;
        let name: string;
        if (filePath) {
          if (!existsSync(filePath)) return errorContent(`文件不存在：${filePath}`);
          const ext = path.extname(filePath).toLowerCase();
          mime = MIME_BY_EXT[ext] ?? mime_type ?? "";
          if (!mime) return errorContent(`无法推断 MIME，指定 mime_type`);
          buffer = await readFile(filePath);
          name = filename ?? path.basename(filePath);
        } else if (base64) {
          if (!mime_type || !filename) return errorContent("base64 模式必须提供 mime_type 和 filename");
          buffer = Buffer.from(base64, "base64");
          mime = mime_type;
          name = filename;
        } else {
          return errorContent("必须提供 path 或 base64 之一");
        }
        const result = await sdk.uploads.upload({ data: buffer, filename: name, mimeType: mime });
        return json(result);
      } catch (err) {
        return errorContent((err as Error).message);
      }
    },
  );

  // ---------- 分类/标签/专题 ----------

  server.tool(
    "list_taxonomy",
    "列出分类、标签或专题。type 指定种类。",
    {
      type: z.enum(["category", "tag", "topic"]),
    },
    async ({ type }) => {
      try {
        if (type === "category") return json(await sdk.categories.list());
        if (type === "tag") return json(await sdk.tags.list());
        return json(await sdk.topics.list());
      } catch (err) {
        return errorContent((err as Error).message);
      }
    },
  );

  // ---------- 评论 ----------

  server.tool(
    "list_pending_comments",
    "列出待审核评论。",
    { limit: z.number().int().min(1).max(100).optional() },
    async ({ limit }) => {
      try {
        const r = await sdk.comments.list({ status: "pending", limit });
        return json({
          total: r.pagination.total,
          items: r.items.map((c) => ({
            id: c.id,
            nickname: c.nickname,
            article: c.article.slug,
            content: c.content,
            createdAt: c.createdAt,
          })),
        });
      } catch (err) {
        return errorContent((err as Error).message);
      }
    },
  );

  server.tool(
    "moderate_comment",
    "审核评论：通过、驳回或删除。",
    {
      id: z.number().int(),
      action: z.enum(["approve", "reject", "delete"]),
    },
    async ({ id, action }) => {
      try {
        if (action === "delete") {
          await sdk.comments.delete(id);
          return json({ deleted: id });
        }
        const statusMap = { approve: "approved", reject: "rejected" } as const;
        const c = await sdk.comments.moderate(id, statusMap[action]);
        return json({ id: c.id, status: c.status });
      } catch (err) {
        return errorContent((err as Error).message);
      }
    },
  );

  return server;
}
