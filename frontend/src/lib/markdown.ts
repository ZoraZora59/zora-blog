import type { ReactNode } from 'react';
import GithubSlugger from 'github-slugger';
import { toString } from 'mdast-util-to-string';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import { unified } from 'unified';
import { visit } from 'unist-util-visit';

export interface TocHeading {
  id: string;
  text: string;
  level: 2 | 3;
}

export interface EmbedDirective {
  type: 'youtube' | 'bilibili';
  id: string;
}

export function extractTableOfContents(markdown: string) {
  const slugger = new GithubSlugger();
  const tree = unified().use(remarkParse).use(remarkGfm).parse(markdown);
  const items: TocHeading[] = [];

  visit(tree, 'heading', (node) => {
    if (node.depth !== 2 && node.depth !== 3) {
      return;
    }

    const text = toString(node).trim();
    if (!text) {
      return;
    }

    items.push({
      id: slugger.slug(text),
      text,
      level: node.depth,
    });
  });

  return items;
}

export function extractTextFromNode(node: ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') {
    return String(node);
  }

  if (Array.isArray(node)) {
    return node.map((item) => extractTextFromNode(item)).join('');
  }

  if (node && typeof node === 'object' && 'props' in node) {
    const candidate = node as { props?: { children?: ReactNode } };
    return extractTextFromNode(candidate.props?.children ?? '');
  }

  return '';
}

export function parseEmbedDirective(value: string) {
  const trimmed = value.trim();
  const matched = trimmed.match(/^::(youtube|bilibili)\[([^\]]+)\]$/);

  if (!matched) {
    return null;
  }

  return {
    type: matched[1] as EmbedDirective['type'],
    id: matched[2],
  };
}
