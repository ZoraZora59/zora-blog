/**
 * Phase 2 验证：Markdown 处理器
 * - frontmatter 解析/回写
 * - 图片扫描 + dry-run（不上传）
 * - 真实上传（一张 1x1 PNG，通过 SDK 上传到七牛）
 * - 缓存命中（二次处理同一文件，不再上传）
 */
import { mkdtempSync, rmSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { ZoraBlog } from "../dist/index.js";
import {
  parseFrontmatter,
  stringifyFrontmatter,
  processMarkdown,
  processMarkdownFile,
  ImageCache,
} from "../dist/markdown/index.js";

const baseUrl = process.env.ZORA_BASE_URL;
const token = process.env.ZORA_TOKEN;
if (!baseUrl || !token) {
  console.error("缺少 ZORA_BASE_URL / ZORA_TOKEN");
  process.exit(1);
}
const sdk = new ZoraBlog({ baseUrl, token });

// 预制：1x1 透明 PNG（67 字节）
const TINY_PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
const tinyPng = Buffer.from(TINY_PNG_BASE64, "base64");

const tmp = mkdtempSync(path.join(tmpdir(), "zora-md-"));
const imagePath = path.join(tmp, "demo.png");
const mdPath = path.join(tmp, "post.md");
writeFileSync(imagePath, tinyPng);

const MD = `---
title: "Phase 2 自动化测试"
slug: phase2-test
tags: [sdk, test]
category: tech-blog
status: draft
cover: ./demo.png
---

# 标题

一段正文，下面是一张本地图片：

![demo](./demo.png)

还有一张外链图：

![外链](https://example.com/x.png)
`;
writeFileSync(mdPath, MD);

console.log(`tmp dir: ${tmp}\n`);
const results = [];
function log(name, ok, detail = "") {
  results.push({ name, ok });
  console.log(`${ok ? "✓" : "✗"} ${name}${detail ? "  " + detail : ""}`);
}

async function main() {
  console.log("[1] frontmatter 解析/回写");
  {
    const parsed = parseFrontmatter(MD);
    const okParse =
      parsed.frontmatter.title === "Phase 2 自动化测试" &&
      parsed.frontmatter.slug === "phase2-test" &&
      Array.isArray(parsed.frontmatter.tags) &&
      parsed.frontmatter.cover === "./demo.png";
    log("parseFrontmatter 字段正确", okParse, JSON.stringify(parsed.frontmatter));

    const dumped = stringifyFrontmatter(parsed.frontmatter, parsed.content);
    const reparsed = parseFrontmatter(dumped);
    log(
      "stringify → reparse 等价",
      reparsed.frontmatter.title === parsed.frontmatter.title &&
        reparsed.frontmatter.cover === parsed.frontmatter.cover,
    );
  }

  console.log("\n[2] dry-run 扫描（不上传）");
  {
    const result = await processMarkdownFile(mdPath, { sdk, dryRun: true, useCache: false });
    const hasLocal = result.uploadedImages.some((u) => u.relativePath === "./demo.png");
    log("扫描到本地 demo.png", hasLocal, `uploads=${result.uploadedImages.length}`);
    log(
      "dry-run URL 为占位",
      result.uploadedImages.every((u) => u.url.startsWith("[DRYRUN:")),
    );
    log("外链保留", /https:\/\/example\.com\/x\.png/.test(result.content));
    log("frontmatter.cover 已改写", result.frontmatter.cover?.startsWith("[DRYRUN:"));
    log("错误为空", result.errors.length === 0);
  }

  console.log("\n[3] 真实上传 + 缓存");
  let firstUrl = null;
  {
    const result = await processMarkdownFile(mdPath, { sdk });
    const uploaded = result.uploadedImages.find((u) => u.relativePath === "./demo.png");
    firstUrl = uploaded?.url;
    log("上传成功", Boolean(firstUrl?.startsWith("https://")), firstUrl ?? "");
    log(
      "content 中 ![demo] 已替换为 CDN URL",
      firstUrl ? result.content.includes(firstUrl) : false,
    );
    log(
      "frontmatter.cover 已替换为 CDN URL",
      firstUrl ? result.frontmatter.cover === firstUrl : false,
    );
    log("缓存文件已写入", existsSync(path.join(tmp, ".zora-cache.json")));
    const reused = result.uploadedImages.filter((u) => u.reused).length;
    log("首次运行无复用", reused === 0);
  }

  console.log("\n[4] 二次处理命中缓存");
  {
    const result = await processMarkdownFile(mdPath, { sdk });
    const uploaded = result.uploadedImages.find((u) => u.relativePath === "./demo.png");
    log("URL 与首次一致（缓存复用）", uploaded?.url === firstUrl);
    log("reused=true", uploaded?.reused === true);
  }

  console.log("\n[5] 图片缺失的错误收集");
  {
    const broken = MD + "\n![missing](./does-not-exist.png)\n";
    const result = await processMarkdown(broken, { baseDir: tmp, sdk, dryRun: true });
    log("产生错误", result.errors.length >= 1, result.errors[0] ?? "");
    log("未阻断处理", typeof result.content === "string");
  }

  console.log("\n[6] 汇总");
  const ok = results.filter((r) => r.ok).length;
  const fail = results.length - ok;
  console.log(`通过 ${ok} / 失败 ${fail}`);
  if (fail > 0) process.exit(1);
}

main()
  .catch((err) => {
    console.error("\n未预期异常:", err);
    process.exit(1);
  })
  .finally(() => {
    rmSync(tmp, { recursive: true, force: true });
  });
