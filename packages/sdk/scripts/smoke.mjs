// 使用已编译的 dist 产物，走纯 Node（无需 tsx）
import { ZoraBlog, ZoraApiError } from "../dist/index.js";

const baseUrl = process.env.ZORA_BASE_URL;
const token = process.env.ZORA_TOKEN;

if (!baseUrl || !token) {
  console.error("缺少环境变量 ZORA_BASE_URL / ZORA_TOKEN");
  process.exit(1);
}

const sdk = new ZoraBlog({ baseUrl, token });

async function run() {
  console.log(`→ Base URL: ${baseUrl}\n`);

  console.log("== 分类 ==");
  const categories = await sdk.categories.list();
  console.table(
    categories.slice(0, 5).map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      articles: c.articleCount,
    })),
  );

  console.log("\n== 标签（前 5）==");
  const tags = await sdk.tags.list();
  console.table(
    tags.slice(0, 5).map((t) => ({ id: t.id, name: t.name, articles: t.articleCount })),
  );

  console.log("\n== 文章列表（limit=3）==");
  const articles = await sdk.articles.list({ limit: 3, status: "all" });
  console.table(
    articles.items.map((a) => ({
      id: a.id,
      title: a.title.slice(0, 30),
      status: a.status,
      category: a.category.name,
    })),
  );
  console.log(`总计 ${articles.pagination.total} 篇`);

  if (articles.items[0]) {
    console.log("\n== 单篇详情 ==");
    const full = await sdk.articles.get(articles.items[0].id);
    console.log({
      id: full.id,
      title: full.title,
      slug: full.slug,
      status: full.status,
      contentLength: full.content.length,
      coverImage: full.coverImage,
    });
  }

  console.log("\n✓ 全部通过");
}

run().catch((err) => {
  if (err instanceof ZoraApiError) {
    console.error(`\n✗ API 错误 (code=${err.code}): ${err.message}`);
    console.error("  data:", err.data);
  } else {
    console.error("\n✗ 异常:", err);
  }
  process.exit(1);
});
