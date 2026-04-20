/**
 * SDK 完整验证脚本：
 * - 只读接口：articles / categories / tags / topics / comments / getBySlug
 * - 写入接口：创建临时 tag/article → 立即删除（不污染生产）
 * - 错误处理：访问不存在的 id 应抛 ZoraApiError(code=404)
 */
import { ZoraBlog, ZoraApiError } from "../dist/index.js";

const baseUrl = process.env.ZORA_BASE_URL;
const token = process.env.ZORA_TOKEN;
if (!baseUrl || !token) {
  console.error("缺少 ZORA_BASE_URL / ZORA_TOKEN");
  process.exit(1);
}

const sdk = new ZoraBlog({ baseUrl, token });
const STAMP = Date.now();
const results = [];

function record(name, ok, detail = "") {
  results.push({ name, ok, detail });
  console.log(`${ok ? "✓" : "✗"} ${name}${detail ? "  " + detail : ""}`);
}

async function safe(name, fn) {
  try {
    const out = await fn();
    record(name, true, typeof out === "string" ? out : "");
    return out;
  } catch (err) {
    const msg = err instanceof ZoraApiError ? `code=${err.code} ${err.message}` : String(err);
    record(name, false, msg);
    return null;
  }
}

async function main() {
  console.log(`→ ${baseUrl}\n[1] 只读接口`);

  await safe("articles.list(all)", async () => {
    const r = await sdk.articles.list({ status: "all", limit: 5 });
    return `total=${r.pagination.total}`;
  });

  await safe("articles.list(draft)", async () => {
    const r = await sdk.articles.list({ status: "draft", limit: 5 });
    return `draft=${r.pagination.total}`;
  });

  await safe("articles.list(search=developer)", async () => {
    const r = await sdk.articles.list({ search: "developer", limit: 3 });
    return `hits=${r.pagination.total}`;
  });

  const firstArticle = await safe("articles.get(1)", async () => {
    const a = await sdk.articles.get(1);
    return `${a.slug}`;
  });

  await safe("articles.getBySlug(developer-by-day-adventurer-by-night)", async () => {
    const a = await sdk.articles.getBySlug("developer-by-day-adventurer-by-night");
    return a ? `id=${a.id}` : "not found";
  });

  await safe("categories.list", async () => {
    const r = await sdk.categories.list();
    return `count=${r.length}`;
  });

  await safe("tags.list", async () => {
    const r = await sdk.tags.list();
    return `count=${r.length}`;
  });

  await safe("topics.list", async () => {
    const r = await sdk.topics.list();
    return `count=${r.length}`;
  });

  await safe("comments.list(all)", async () => {
    const r = await sdk.comments.list({ limit: 5 });
    return `total=${r.pagination.total}, stats=${JSON.stringify(r.stats)}`;
  });

  await safe("comments.list(pending)", async () => {
    const r = await sdk.comments.list({ status: "pending", limit: 5 });
    return `pending=${r.pagination.total}`;
  });

  console.log("\n[2] 错误处理");

  await safe("articles.get(999999) 应 404", async () => {
    try {
      await sdk.articles.get(999999);
      throw new Error("未抛错");
    } catch (err) {
      if (err instanceof ZoraApiError && err.code === 404) return `抛出 404 OK`;
      throw err;
    }
  });

  console.log("\n[3] 写入接口（创建后立即删除）");

  let tagId = null;
  await safe("tags.create(sdk-smoke-*)", async () => {
    const tag = await sdk.tags.create({ name: `sdk-smoke-${STAMP}` });
    tagId = tag.id;
    return `id=${tag.id} slug=${tag.slug}`;
  });

  if (tagId) {
    await safe("tags.delete(临时 tag)", async () => {
      await sdk.tags.delete(tagId);
      return `已删`;
    });
  }

  let articleId = null;
  await safe("articles.create(draft)", async () => {
    const art = await sdk.articles.create({
      title: `SDK 冒烟测试 ${STAMP}`,
      content: "# Hello\n\nSDK verify script generated, will be deleted.",
      status: "draft",
    });
    articleId = art.id;
    return `id=${art.id} slug=${art.slug} status=${art.status}`;
  });

  if (articleId) {
    await safe("articles.update(同一篇)", async () => {
      const art = await sdk.articles.update(articleId, {
        excerpt: "updated by verify script",
      });
      return `excerpt="${art.excerpt}"`;
    });

    await safe("articles.delete(临时草稿)", async () => {
      await sdk.articles.delete(articleId);
      return `已删`;
    });
  }

  console.log("\n[4] 汇总");
  const ok = results.filter((r) => r.ok).length;
  const fail = results.filter((r) => !r.ok).length;
  console.log(`通过 ${ok} / 失败 ${fail}`);
  if (fail > 0) {
    console.log("\n失败项：");
    for (const r of results.filter((r) => !r.ok)) {
      console.log(`  ✗ ${r.name}: ${r.detail}`);
    }
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("\n未预期异常:", err);
  process.exit(1);
});
