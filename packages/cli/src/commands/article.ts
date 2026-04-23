import { Command } from "commander";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { confirm } from "@inquirer/prompts";
import type { ArticleInput, ArticleStatus } from "@zora-blog/sdk";
import {
  processMarkdownFile,
  stringifyFrontmatter,
  type ArticleFrontmatter,
} from "@zora-blog/sdk/markdown";
import { getSdk, handleApiError, type CliGlobalOptions } from "../context.js";
import { printTable, printJson, success, info, warn, error, parseJsonFields } from "../ui.js";

type GlobalOpts = CliGlobalOptions;

function parentOpts(cmd: Command): GlobalOpts {
  let c: Command | null | undefined = cmd;
  while (c && !c.opts().baseUrl && !c.opts().token && c.parent) c = c.parent;
  return (c?.opts() as GlobalOpts) ?? {};
}

export function createArticleCommand(): Command {
  const cmd = new Command("article").alias("a").description("文章管理");

  cmd
    .command("list")
    .description("列出文章")
    .option("--status <status>", "draft | published | all", "all")
    .option("--search <kw>", "关键字搜索")
    .option("--limit <n>", "每页数量", "20")
    .option("--offset <n>", "偏移量", "0")
    .option("--json [fields]", "JSON 输出，可选字段：id,title,slug,status,category,tags")
    .action(async (options, cmdCtx) => {
      const sdk = await getSdk(parentOpts(cmdCtx));
      try {
        const result = await sdk.articles.list({
          status: options.status,
          search: options.search,
          limit: Number(options.limit),
          offset: Number(options.offset),
        });
        if (options.json !== undefined) {
          const fields = parseJsonFields(options.json);
          printJson(result.items, fields);
          return;
        }
        printTable(
          result.items.map((a) => ({
            id: a.id,
            title: a.title.slice(0, 40),
            slug: a.slug,
            status: a.status,
            category: a.category.name,
            tags: a.tags.map((t) => t.name).join(","),
            updated: a.updatedAt.slice(0, 10),
          })),
        );
        info(`总计 ${result.pagination.total} 篇`);
      } catch (err) {
        handleApiError(err);
      }
    });

  cmd
    .command("view <idOrSlug>")
    .description("查看单篇文章")
    .option("--json [fields]", "JSON 输出")
    .option("--content-only", "仅输出 Markdown 正文")
    .action(async (idOrSlug: string, options, cmdCtx) => {
      const sdk = await getSdk(parentOpts(cmdCtx));
      try {
        const article = /^\d+$/.test(idOrSlug)
          ? await sdk.articles.get(Number(idOrSlug))
          : await sdk.articles.getBySlug(idOrSlug);
        if (!article) {
          error(`未找到：${idOrSlug}`);
          process.exit(1);
        }
        if (options.contentOnly) {
          process.stdout.write(article.content);
          return;
        }
        if (options.json !== undefined) {
          printJson(article, parseJsonFields(options.json));
          return;
        }
        console.log(`# ${article.title}`);
        console.log(`id=${article.id}  slug=${article.slug}  status=${article.status}`);
        console.log(`分类: ${article.category.name}`);
        console.log(`标签: ${article.tags.map((t) => t.name).join(", ") || "（无）"}`);
        console.log(`封面: ${article.coverImage ?? "（无）"}`);
        console.log(`创建: ${article.createdAt}  更新: ${article.updatedAt}`);
        console.log(`发布: ${article.publishedAt ?? "未发布"}`);
        console.log(`\n--- 正文 ---\n`);
        console.log(article.content);
      } catch (err) {
        handleApiError(err);
      }
    });

  cmd
    .command("create <file>")
    .description("从 markdown 文件创建文章（支持 frontmatter + 本地图片上传）")
    .option("--status <status>", "覆盖 frontmatter 的 status")
    .option("--dry-run", "只扫描不上传不创建")
    .option("--no-cache", "忽略图片缓存")
    .option("--json [fields]", "JSON 输出")
    .action(async (file: string, options, cmdCtx) => {
      const sdk = await getSdk(parentOpts(cmdCtx));
      try {
        const processed = await processMarkdownFile(file, {
          sdk,
          dryRun: Boolean(options.dryRun),
          useCache: options.cache !== false,
        });

        // 报告图片
        if (processed.uploadedImages.length) {
          info(`图片：${processed.uploadedImages.length} 张`);
          for (const img of processed.uploadedImages) {
            const tag = img.reused ? "cached" : options.dryRun ? "would upload" : "uploaded";
            console.log(`  [${tag}] ${img.relativePath} → ${img.url}`);
          }
        }
        if (processed.errors.length) {
          for (const e of processed.errors) warn(e);
        }

        const input = await buildArticleInput(sdk, processed.frontmatter, processed.content, options.status);

        if (options.dryRun) {
          info("dry-run，不会创建文章。将提交：");
          console.log(JSON.stringify({ ...input, content: `[${input.content?.length} chars]` }, null, 2));
          return;
        }

        const created = await sdk.articles.create(input);
        if (options.json !== undefined) {
          printJson(created, parseJsonFields(options.json));
        } else {
          success(`已创建 id=${created.id} slug=${created.slug} status=${created.status}`);
        }
      } catch (err) {
        handleApiError(err);
      }
    });

  cmd
    .command("edit <idOrSlug> [file]")
    .description("更新文章（file 可选，只改状态时可省略）")
    .option("--publish", "更新后设为 published")
    .option("--unpublish", "更新后设为 draft")
    .option("--dry-run", "只扫描不更新")
    .option("--no-cache", "忽略图片缓存")
    .option("--status <status>", "明确设置 status")
    .action(async (idOrSlug: string, file: string | undefined, options, cmdCtx) => {
      const sdk = await getSdk(parentOpts(cmdCtx));
      try {
        const article = /^\d+$/.test(idOrSlug)
          ? await sdk.articles.get(Number(idOrSlug))
          : await sdk.articles.getBySlug(idOrSlug);
        if (!article) {
          error(`未找到：${idOrSlug}`);
          process.exit(1);
        }

        let input: ArticleInput = {};
        if (file) {
          const processed = await processMarkdownFile(file, {
            sdk,
            dryRun: Boolean(options.dryRun),
            useCache: options.cache !== false,
          });
          if (processed.errors.length) {
            for (const e of processed.errors) warn(e);
          }
          input = await buildArticleInput(sdk, processed.frontmatter, processed.content);
        }
        if (options.publish) input.status = "published";
        if (options.unpublish) input.status = "draft";
        if (options.status) input.status = options.status as ArticleStatus;

        if (options.dryRun) {
          info("dry-run。将提交：");
          console.log(JSON.stringify(input, null, 2));
          return;
        }

        const updated = await sdk.articles.update(article.id, input);
        success(`已更新 id=${updated.id} status=${updated.status}`);
      } catch (err) {
        handleApiError(err);
      }
    });

  cmd
    .command("pull <idOrSlug>")
    .description("导出文章到本地 markdown 文件")
    .option("--out <dir>", "输出目录", ".")
    .action(async (idOrSlug: string, options, cmdCtx) => {
      const sdk = await getSdk(parentOpts(cmdCtx));
      try {
        const article = /^\d+$/.test(idOrSlug)
          ? await sdk.articles.get(Number(idOrSlug))
          : await sdk.articles.getBySlug(idOrSlug);
        if (!article) {
          error(`未找到：${idOrSlug}`);
          process.exit(1);
        }
        const fm = Object.fromEntries(
          Object.entries({
          title: article.title,
          slug: article.slug,
          category: article.category.slug,
          tags: article.tags.map((t) => t.slug),
          status: article.status,
          cover: article.coverImage ?? undefined,
          excerpt: article.excerpt ?? undefined,
          }).filter(([, value]) => value !== undefined),
        );
        const md = stringifyFrontmatter(fm, article.content);
        await mkdir(options.out, { recursive: true });
        const file = path.join(options.out, `${article.slug}.md`);
        await writeFile(file, md, "utf8");
        success(`已写入 ${file}`);
      } catch (err) {
        handleApiError(err);
      }
    });

  cmd
    .command("delete <id>")
    .description("删除文章")
    .option("-y, --yes", "跳过确认")
    .action(async (id: string, options, cmdCtx) => {
      const sdk = await getSdk(parentOpts(cmdCtx));
      try {
        const numId = Number(id);
        if (!options.yes) {
          const ok = await confirm({
            message: `确定删除文章 id=${numId}？该操作不可逆`,
            default: false,
          });
          if (!ok) {
            info("已取消");
            return;
          }
        }
        await sdk.articles.delete(numId);
        success(`已删除 id=${numId}`);
      } catch (err) {
        handleApiError(err);
      }
    });

  cmd
    .command("publish <id>")
    .description("发布草稿")
    .action(async (id: string, _options, cmdCtx) => {
      const sdk = await getSdk(parentOpts(cmdCtx));
      try {
        const r = await sdk.articles.publish(Number(id));
        success(`已发布 id=${r.id} slug=${r.slug}`);
      } catch (err) {
        handleApiError(err);
      }
    });

  cmd
    .command("unpublish <id>")
    .description("下架（转草稿）")
    .action(async (id: string, _options, cmdCtx) => {
      const sdk = await getSdk(parentOpts(cmdCtx));
      try {
        const r = await sdk.articles.unpublish(Number(id));
        success(`已下架 id=${r.id} slug=${r.slug}`);
      } catch (err) {
        handleApiError(err);
      }
    });

  return cmd;
}

/**
 * 把 frontmatter 转成后端期望的 ArticleInput。
 * - category: 传 name 或 slug 时，查找 list 匹配；都没匹配到则原样传（后端可能报错）
 * - tags: 支持 name 或 id 混写
 */
async function buildArticleInput(
  sdk: import("@zora-blog/sdk").ZoraBlog,
  fm: ArticleFrontmatter,
  content: string,
  overrideStatus?: string,
): Promise<ArticleInput> {
  const input: ArticleInput = {
    title: typeof fm.title === "string" ? fm.title : undefined,
    slug: typeof fm.slug === "string" ? fm.slug : undefined,
    excerpt: typeof fm.excerpt === "string" ? fm.excerpt : undefined,
    coverImage: typeof fm.cover === "string" ? fm.cover : undefined,
    status: (overrideStatus as ArticleStatus | undefined) ??
      (fm.status === "published" || fm.status === "draft" ? fm.status : undefined),
    content,
  };

  // 分类
  if (fm.category !== undefined) {
    if (typeof fm.category === "number") {
      input.categoryId = fm.category;
    } else if (typeof fm.category === "string") {
      const all = await sdk.categories.list();
      const found = all.find((c) => c.name === fm.category || c.slug === fm.category);
      if (found) input.categoryId = found.id;
      else warn(`未找到分类 "${fm.category}"，将使用默认分类`);
    }
  }

  // 标签
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

  // 专题
  if (Array.isArray(fm.topics)) {
    const ids: number[] = [];
    for (const t of fm.topics) {
      if (typeof t === "number") ids.push(t);
      else if (typeof t === "string") {
        const all = await sdk.topics.list();
        const found = all.find((x) => x.title === t || x.slug === t);
        if (found) ids.push(found.id);
        else warn(`未找到专题 "${t}"`);
      }
    }
    if (ids.length) input.topicIds = ids;
  }

  return input;
}
