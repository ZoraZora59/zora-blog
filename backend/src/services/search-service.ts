import { Prisma } from '@prisma/client';
import { parseNumberParam } from '../lib/pagination.js';
import { prisma } from '../lib/prisma.js';
import { escapeHtml } from '../lib/sanitize.js';
import { buildExcerpt, stripMarkdown } from '../lib/text.js';

interface SearchOptions {
  q?: string;
  page?: string;
  limit?: string;
}

interface SearchCountRow {
  total: number;
}

interface SearchRankingRow {
  id: number;
  rank: number | null;
}

interface SearchArticleRecord {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  coverImage: string | null;
  publishedAt: Date | null;
  viewCount: number;
  category: {
    id: number;
    name: string;
    slug: string;
  };
}

const SEARCH_LIMIT_MAX = 20;
const SEARCH_SNIPPET_LENGTH = 180;

function normalizeQuery(value: string) {
  return value.replace(/\s+/g, ' ').trim();
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function extractTerms(query: string) {
  return [...new Set(query.split(/\s+/).map((item) => item.trim()).filter(Boolean))].slice(0, 10);
}

function highlightText(value: string, terms: string[]) {
  const escaped = escapeHtml(value);

  if (terms.length === 0) {
    return escaped;
  }

  const pattern = new RegExp(
    `(${terms
      .slice()
      .sort((left, right) => right.length - left.length)
      .map((item) => escapeRegExp(item))
      .join('|')})`,
    'giu',
  );

  return escaped.replace(pattern, '<mark>$1</mark>');
}

function buildHighlightedSnippet(excerpt: string | null, content: string, terms: string[]) {
  const excerptText = excerpt?.trim() ?? '';
  const contentText = stripMarkdown(content);
  const excerptHasMatch = terms.some((term) => excerptText.toLowerCase().includes(term.toLowerCase()));
  const source = excerptHasMatch || !contentText ? excerptText : contentText;

  if (!source) {
    return '';
  }

  const lowerSource = source.toLowerCase();
  const firstMatchIndex = terms
    .map((term) => lowerSource.indexOf(term.toLowerCase()))
    .filter((index) => index >= 0)
    .sort((left, right) => left - right)[0];

  if (firstMatchIndex === undefined) {
    return highlightText(buildExcerpt(source, SEARCH_SNIPPET_LENGTH), terms);
  }

  const start = Math.max(0, firstMatchIndex - 60);
  const end = Math.min(source.length, firstMatchIndex + 120);
  const prefix = start > 0 ? '...' : '';
  const suffix = end < source.length ? '...' : '';

  return highlightText(`${prefix}${source.slice(start, end).trim()}${suffix}`, terms);
}

export async function searchPublicArticles(options: SearchOptions) {
  const query = normalizeQuery(options.q ?? '');
  const page = parseNumberParam(options.page, 1, 1);
  const limit = Math.min(parseNumberParam(options.limit, 10, 1), SEARCH_LIMIT_MAX);

  if (!query) {
    return {
      query: '',
      items: [],
      pagination: {
        page,
        limit,
        total: 0,
        totalPages: 0,
      },
    };
  }

  const offset = (page - 1) * limit;
  const like = `%${query}%`;
  const terms = extractTerms(query);
  const tsQuery = Prisma.sql`websearch_to_tsquery('simple', ${query})`;
  const whereClause = Prisma.sql`
    a.status = 'published'::"ArticleStatus"
    AND (
      (a.search_vector IS NOT NULL AND a.search_vector @@ ${tsQuery})
      OR a.title ILIKE ${like}
      OR COALESCE(a.excerpt, '') ILIKE ${like}
      OR a.content ILIKE ${like}
    )
  `;

  const [countRows, rankingRows] = await Promise.all([
    prisma.$queryRaw<SearchCountRow[]>(Prisma.sql`
      SELECT COUNT(*)::int AS total
      FROM "articles" a
      WHERE ${whereClause}
    `),
    prisma.$queryRaw<SearchRankingRow[]>(Prisma.sql`
      SELECT
        a.id,
        CASE
          WHEN a.search_vector IS NOT NULL THEN ts_rank_cd(a.search_vector, ${tsQuery})
          ELSE 0
        END AS rank
      FROM "articles" a
      WHERE ${whereClause}
      ORDER BY rank DESC, a."publishedAt" DESC NULLS LAST, a.id DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `),
  ]);

  const total = countRows[0]?.total ?? 0;

  if (rankingRows.length === 0) {
    return {
      query,
      items: [],
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  const ids = rankingRows.map((item) => item.id);
  const articles = await prisma.article.findMany({
    where: {
      id: {
        in: ids,
      },
    },
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      content: true,
      coverImage: true,
      publishedAt: true,
      viewCount: true,
      category: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
  });

  const articleMap = new Map(articles.map((article) => [article.id, article as SearchArticleRecord]));

  return {
    query,
    items: rankingRows
      .map((ranking) => {
        const article = articleMap.get(ranking.id);

        if (!article) {
          return null;
        }

        return {
          id: article.id,
          title: article.title,
          slug: article.slug,
          excerpt: article.excerpt ?? buildExcerpt(article.content, SEARCH_SNIPPET_LENGTH),
          highlightedTitle: highlightText(article.title, terms),
          highlightedExcerpt: buildHighlightedSnippet(article.excerpt, article.content, terms),
          coverImage: article.coverImage,
          publishedAt: article.publishedAt,
          viewCount: article.viewCount,
          rank: ranking.rank ?? 0,
          category: article.category,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}
