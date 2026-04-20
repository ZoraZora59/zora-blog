import matter from "gray-matter";
import type { ArticleStatus } from "../types.js";

/**
 * 博客文章 Markdown 文件支持的 frontmatter 字段。
 * 所有字段都是可选的，缺失字段由后端兜底（自动生成 slug/excerpt 等）。
 */
export interface ArticleFrontmatter {
  title?: string;
  slug?: string;
  /** 分类：name 或 id；未知名字会按 name 传给后端，后端找不到会报错 */
  category?: string | number;
  /** 标签：数组，name 或 id 混写。name 形式后端会自动创建 */
  tags?: Array<string | number>;
  /** 专题：数组，name 或 id 混写 */
  topics?: Array<string | number>;
  /** 封面图：本地路径或 http(s) URL；本地路径会在处理时上传 */
  cover?: string;
  /** 发布状态 */
  status?: ArticleStatus;
  /** 摘要：省略则后端自动截取正文前 150 字 */
  excerpt?: string;
}

export interface ParsedMarkdown {
  frontmatter: ArticleFrontmatter;
  content: string;
  /** 原始 frontmatter 块（含 --- 分隔符），用于 dump 回写时保留注释 */
  rawFrontmatter: string;
}

export function parseFrontmatter(markdown: string): ParsedMarkdown {
  const parsed = matter(markdown);
  return {
    frontmatter: (parsed.data ?? {}) as ArticleFrontmatter,
    content: parsed.content,
    rawFrontmatter: parsed.matter ?? "",
  };
}

export function stringifyFrontmatter(
  frontmatter: ArticleFrontmatter,
  content: string,
): string {
  return matter.stringify(content, frontmatter as Record<string, unknown>);
}
