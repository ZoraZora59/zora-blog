import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkStringify from "remark-stringify";
import { visit } from "unist-util-visit";
import type { Root, Image } from "mdast";
import type { ZoraBlog } from "../index.js";
import {
  parseFrontmatter,
  stringifyFrontmatter,
  type ArticleFrontmatter,
} from "./frontmatter.js";
import { ImageCache, sha256 } from "./cache.js";

const MIME_BY_EXT: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
};

export interface UploadedImageRecord {
  relativePath: string;
  absolutePath: string;
  url: string;
  reused: boolean;
  sizeBytes: number;
}

export interface ProcessedMarkdown {
  content: string;
  frontmatter: ArticleFrontmatter;
  uploadedImages: UploadedImageRecord[];
  errors: string[];
}

export interface ProcessOptions {
  /** markdown 文件所在目录，用于解析相对路径；可传 markdown 文件本身也 OK */
  baseDir: string;
  /** 已实例化的 SDK；上传走 sdk.uploads.upload */
  sdk: ZoraBlog;
  /** 如果为 true，不真正上传，仅扫描并返回预计操作 */
  dryRun?: boolean;
  /** 自定义缓存；默认会在 baseDir 下用 .zora-cache.json */
  cache?: ImageCache | null;
  /** false 时强制重传，忽略缓存 */
  useCache?: boolean;
}

function isHttpUrl(src: string): boolean {
  return /^https?:\/\//i.test(src);
}

function isDataUrl(src: string): boolean {
  return src.startsWith("data:");
}

export async function processMarkdown(
  markdown: string,
  options: ProcessOptions,
): Promise<ProcessedMarkdown> {
  const baseDir = (await import("node:fs/promises"))
    .stat(options.baseDir)
    .then((s) => (s.isDirectory() ? options.baseDir : path.dirname(options.baseDir)));
  const resolvedBase = await baseDir;

  const parsed = parseFrontmatter(markdown);
  const frontmatter = { ...parsed.frontmatter };
  const uploadedImages: UploadedImageRecord[] = [];
  const errors: string[] = [];

  const cache =
    options.useCache === false
      ? null
      : (options.cache ?? new ImageCache(resolvedBase));
  if (cache) await cache.load();

  const uploadedBySrc = new Map<string, string>();

  async function processOne(src: string): Promise<string> {
    if (!src || isHttpUrl(src) || isDataUrl(src)) return src;
    if (uploadedBySrc.has(src)) return uploadedBySrc.get(src)!;

    const abs = path.isAbsolute(src) ? src : path.resolve(resolvedBase, src);
    if (!existsSync(abs)) {
      errors.push(`图片不存在：${src} (解析为 ${abs})`);
      return src;
    }

    const ext = path.extname(abs).toLowerCase();
    const mime = MIME_BY_EXT[ext];
    if (!mime) {
      errors.push(`不支持的图片格式：${src}（需 jpg/png/webp/gif）`);
      return src;
    }

    const buffer = await readFile(abs);
    const hash = sha256(buffer);

    const cached = cache?.get(src);
    if (cached && cached.sha256 === hash) {
      uploadedImages.push({
        relativePath: src,
        absolutePath: abs,
        url: cached.url,
        reused: true,
        sizeBytes: buffer.length,
      });
      uploadedBySrc.set(src, cached.url);
      return cached.url;
    }

    if (options.dryRun) {
      const placeholder = `[DRYRUN:${src}]`;
      uploadedImages.push({
        relativePath: src,
        absolutePath: abs,
        url: placeholder,
        reused: false,
        sizeBytes: buffer.length,
      });
      uploadedBySrc.set(src, placeholder);
      return placeholder;
    }

    const filename = path.basename(abs);
    const result = await options.sdk.uploads.upload({
      data: buffer,
      filename,
      mimeType: mime,
    });
    cache?.set(src, {
      sha256: hash,
      url: result.url,
      uploadedAt: new Date().toISOString(),
    });
    uploadedImages.push({
      relativePath: src,
      absolutePath: abs,
      url: result.url,
      reused: false,
      sizeBytes: buffer.length,
    });
    uploadedBySrc.set(src, result.url);
    return result.url;
  }

  // 1) 处理 frontmatter.cover
  if (frontmatter.cover) {
    frontmatter.cover = await processOne(frontmatter.cover);
  }

  // 2) 处理正文中所有 image 节点
  const processor = unified().use(remarkParse).use(remarkStringify, {
    bullet: "-",
    emphasis: "_",
    fences: true,
    listItemIndent: "one",
    rule: "-",
  });

  const tree = processor.parse(parsed.content) as Root;

  const imageNodes: Image[] = [];
  visit(tree, "image", (node) => {
    imageNodes.push(node as Image);
  });

  for (const node of imageNodes) {
    if (typeof node.url === "string") {
      node.url = await processOne(node.url);
    }
  }

  const newContent = processor.stringify(tree).toString().trimEnd() + "\n";

  if (cache && !options.dryRun) await cache.save();

  return {
    content: newContent,
    frontmatter,
    uploadedImages,
    errors,
  };
}

/**
 * 组合：读文件 → 处理 → 返回结果
 */
export async function processMarkdownFile(
  filePath: string,
  options: Omit<ProcessOptions, "baseDir"> & { baseDir?: string },
): Promise<ProcessedMarkdown & { sourcePath: string }> {
  const source = await readFile(filePath, "utf8");
  const baseDir = options.baseDir ?? path.dirname(path.resolve(filePath));
  const result = await processMarkdown(source, { ...options, baseDir });
  return { ...result, sourcePath: filePath };
}

export { stringifyFrontmatter };
