/**
 * Phase 5 验证：后端新增端点是否注册 + SDK 能正确调用
 *
 * 测试策略：
 * - 针对本地后端 http://localhost:3001/api 用无效 token 探路由是否存在
 *   （合法路由：401；不存在的路由：404）
 * - 针对生产 URL + 有效 token 验证 fallback 路径不会炸
 *   （生产端点尚未部署，应该走到 getBySlug 的 scan 兜底）
 */
import { ZoraBlog, ZoraApiError } from "../dist/index.js";

const prodUrl = "https://www.zorazora.cn/api";
const localUrl = "http://localhost:3001/api";
const prodToken = process.env.ZORA_TOKEN;
const results = [];
function log(name, ok, detail = "") {
  results.push({ name, ok });
  console.log(`${ok ? "✓" : "✗"} ${name}${detail ? "  " + detail : ""}`);
}

async function probeLocal(path) {
  const res = await fetch(`${localUrl}${path}`, {
    headers: { Authorization: "Bearer invalid-token-for-route-probe" },
  });
  return res.status;
}

async function main() {
  console.log("[1] 本地后端 路由注册");
  const s1 = await probeLocal("/auth/me");
  log("GET /auth/me 路由存在（401 != 404）", s1 === 401, `status=${s1}`);

  const s2 = await probeLocal("/admin/articles/by-slug/not-a-real-slug");
  log("GET /admin/articles/by-slug/:slug 路由存在", s2 === 401, `status=${s2}`);

  const s3 = await probeLocal("/admin/articles/by-slug/xxx-definitely-not-existing-yyy");
  log("（同上，二次确认）", s3 === 401, `status=${s3}`);

  const s4 = await probeLocal("/nonexistent-endpoint-zzz");
  log("不存在的路由返回 404 做对照", s4 === 404, `status=${s4}`);

  if (!prodToken) {
    console.log("\n[2] 跳过生产验证（缺少 ZORA_TOKEN）");
  } else {
    console.log("\n[2] 生产 URL + SDK fallback");
    const sdk = new ZoraBlog({ baseUrl: prodUrl, token: prodToken });

    try {
      await sdk.auth.me();
      log("auth.me() 在生产可用", true);
    } catch (err) {
      const is404 = err instanceof ZoraApiError && err.code === 404;
      log("auth.me() 在生产返回 404（端点待部署，行为符合预期）", is404, err?.message ?? "");
    }

    const existing = await sdk.articles.getBySlug("developer-by-day-adventurer-by-night");
    log("getBySlug 能找到已存在的文章（无论端点在否）", Boolean(existing?.id), existing ? `id=${existing.id}` : "null");

    const missing = await sdk.articles.getBySlug("definitely-not-a-real-slug-xxx");
    log("getBySlug 不存在时返回 null", missing === null);
  }

  console.log("\n[3] 汇总");
  const ok = results.filter((r) => r.ok).length;
  const fail = results.length - ok;
  console.log(`通过 ${ok} / 失败 ${fail}`);
  if (fail > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
