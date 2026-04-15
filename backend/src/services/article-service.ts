import {
  ArticleStatus,
  Prisma,
  type Article,
  type ArticleTag,
  type Category,
  type TopicArticle,
} from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../lib/app-error.js';
import { parseNumberParam } from '../lib/pagination.js';
import { slugify } from '../lib/slug.js';
import { buildExcerpt } from '../lib/text.js';
import { resolveUniqueSlug } from '../lib/unique-slug.js';
import { getOrCreateDefaultCategory } from './category-service.js';
import { resolveTagIds } from './tag-service.js';

type ArticleRecord = Article & {
  category: Category;
  articleTags: (ArticleTag & {
    tag: {
      id: number;
      name: string;
      slug: string;
    };
  })[];
  author: {
    id: number;
    username: string;
    displayName: string;
    avatar: string | null;
    role: string | null;
  };
  topicArticles?: TopicArticle[];
};

export interface ArticleInput {
  title?: string;
  content?: string;
  excerpt?: string | null;
  coverImage?: string | null;
  status?: string;
  slug?: string;
  categoryId?: number;
  tagIds?: number[];
  tags?: string[];
}

interface ArticleListOptions {
  category?: string;
  tag?: string;
  page?: string;
  limit?: string;
  sort?: string;
  order?: 'asc' | 'desc';
}

interface AdminArticleListOptions {
  status?: string;
  limit?: string;
  offset?: string;
  sort?: string;
  order?: 'asc' | 'desc';
}

type AdjacentArticleRecord = Article & {
  category: Category;
};

function serializeArticle(article: ArticleRecord) {
  return {
    id: article.id,
    title: article.title,
    slug: article.slug,
    content: article.content,
    excerpt: article.excerpt,
    coverImage: article.coverImage,
    status: article.status.toLowerCase(),
    viewCount: article.viewCount,
    likeCount: article.likeCount,
    publishedAt: article.publishedAt,
    createdAt: article.createdAt,
    updatedAt: article.updatedAt,
    category: {
      id: article.category.id,
      name: article.category.name,
      slug: article.category.slug,
      description: article.category.description,
    },
    tags: article.articleTags.map((item) => ({
      id: item.tag.id,
      name: item.tag.name,
      slug: item.tag.slug,
    })),
    author: {
      id: article.author.id,
      username: article.author.username,
      displayName: article.author.displayName,
      avatar: article.author.avatar,
      role: article.author.role,
    },
  };
}

function serializeAdjacentArticle(article: AdjacentArticleRecord | null) {
  if (!article) {
    return null;
  }

  return {
    id: article.id,
    title: article.title,
    slug: article.slug,
    excerpt: article.excerpt,
    coverImage: article.coverImage,
    publishedAt: article.publishedAt,
    category: {
      id: article.category.id,
      name: article.category.name,
      slug: article.category.slug,
      description: article.category.description,
    },
  };
}

function normalizeStatus(value?: string) {
  if (!value || value.toLowerCase() === 'draft') {
    return ArticleStatus.DRAFT;
  }

  if (value.toLowerCase() === 'published') {
    return ArticleStatus.PUBLISHED;
  }

  throw new AppError('文章状态不合法');
}

function resolvePublicOrderBy(sort?: string, order: 'asc' | 'desc' = 'desc'): Prisma.ArticleOrderByWithRelationInput {
  if (sort === 'viewCount') {
    return { viewCount: order };
  }

  if (sort === 'createdAt') {
    return { createdAt: order };
  }

  return { publishedAt: order };
}

function resolveAdminOrderBy(sort?: string, order: 'asc' | 'desc' = 'desc'): Prisma.ArticleOrderByWithRelationInput {
  if (sort === 'title') {
    return { title: order };
  }

  if (sort === 'createdAt') {
    return { createdAt: order };
  }

  if (sort === 'publishedAt') {
    return { publishedAt: order };
  }

  if (sort === 'viewCount') {
    return { viewCount: order };
  }

  return { updatedAt: order };
}

async function buildArticleSlug(title: string, customSlug?: string, excludeId?: number) {
  const baseSlug = slugify(customSlug || title);
  return resolveUniqueSlug(baseSlug, async (candidate) => {
    const article = await prisma.article.findFirst({
      where: {
        slug: candidate,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      select: { id: true },
    });
    return Boolean(article);
  });
}

async function resolveCategoryId(categoryId?: number) {
  if (categoryId) {
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      select: { id: true },
    });

    if (!category) {
      throw new AppError('分类不存在', 404);
    }

    return category.id;
  }

  const defaultCategory = await getOrCreateDefaultCategory();
  return defaultCategory.id;
}

async function connectArticleTags(tx: Prisma.TransactionClient, articleId: number, tagIds: number[]) {
  if (tagIds.length === 0) {
    return;
  }

  await tx.articleTag.createMany({
    data: tagIds.map((tagId) => ({
      articleId,
      tagId,
    })),
    skipDuplicates: true,
  });
}

const articleInclude = {
  category: true,
  articleTags: {
    include: {
      tag: true,
    },
  },
  author: {
    select: {
      id: true,
      username: true,
      displayName: true,
      avatar: true,
      role: true,
    },
  },
} satisfies Prisma.ArticleInclude;

export async function listPublicArticles(options: ArticleListOptions) {
  const page = parseNumberParam(options.page, 1, 1);
  const limit = Math.min(parseNumberParam(options.limit, 10, 1), 50);
  const skip = (page - 1) * limit;

  const where: Prisma.ArticleWhereInput = {
    status: ArticleStatus.PUBLISHED,
    ...(options.category
      ? {
          category: {
            slug: options.category,
          },
        }
      : {}),
    ...(options.tag
      ? {
          articleTags: {
            some: {
              tag: {
                OR: [
                  { slug: options.tag },
                  { name: options.tag },
                ],
              },
            },
          },
        }
      : {}),
  };

  const [items, total] = await prisma.$transaction([
    prisma.article.findMany({
      where,
      include: articleInclude,
      orderBy: resolvePublicOrderBy(options.sort, options.order),
      skip,
      take: limit,
    }),
    prisma.article.count({ where }),
  ]);

  return {
    items: items.map((item) => serializeArticle(item as ArticleRecord)),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getPublicArticleBySlug(slug: string) {
  return prisma.$transaction(async (tx) => {
    const article = await tx.article.findFirst({
      where: {
        slug,
        status: ArticleStatus.PUBLISHED,
      },
      include: articleInclude,
    });

    if (!article) {
      throw new AppError('文章不存在', 404);
    }

    await tx.article.update({
      where: { id: article.id },
      data: {
        viewCount: {
          increment: 1,
        },
      },
    });

    const [previousArticle, nextArticle] = await Promise.all([
      tx.article.findFirst({
        where: {
          status: ArticleStatus.PUBLISHED,
          publishedAt: {
            lt: article.publishedAt ?? new Date(),
          },
        },
        include: {
          category: true,
        },
        orderBy: {
          publishedAt: 'desc',
        },
      }),
      tx.article.findFirst({
        where: {
          status: ArticleStatus.PUBLISHED,
          publishedAt: {
            gt: article.publishedAt ?? new Date(0),
          },
        },
        include: {
          category: true,
        },
        orderBy: {
          publishedAt: 'asc',
        },
      }),
    ]);

    return {
      ...serializeArticle({
        ...(article as ArticleRecord),
        viewCount: article.viewCount + 1,
      }),
      previousArticle: serializeAdjacentArticle(previousArticle as AdjacentArticleRecord | null),
      nextArticle: serializeAdjacentArticle(nextArticle as AdjacentArticleRecord | null),
    };
  });
}

export async function listAdminArticles(options: AdminArticleListOptions) {
  const limit = Math.min(parseNumberParam(options.limit, 20, 1), 100);
  const offset = parseNumberParam(options.offset, 0, 0);
  const normalizedStatus = options.status?.toLowerCase();

  const where: Prisma.ArticleWhereInput =
    normalizedStatus && normalizedStatus !== 'all'
      ? {
          status: normalizeStatus(normalizedStatus),
        }
      : {};

  const [items, total] = await prisma.$transaction([
    prisma.article.findMany({
      where,
      include: articleInclude,
      orderBy: resolveAdminOrderBy(options.sort, options.order),
      skip: offset,
      take: limit,
    }),
    prisma.article.count({ where }),
  ]);

  return {
    items: items.map((item) => serializeArticle(item as ArticleRecord)),
    pagination: {
      limit,
      offset,
      total,
    },
  };
}

export async function getAdminArticleById(id: number) {
  const article = await prisma.article.findUnique({
    where: { id },
    include: articleInclude,
  });

  if (!article) {
    throw new AppError('文章不存在', 404);
  }

  return serializeArticle(article as ArticleRecord);
}

export async function createArticle(adminId: number, input: ArticleInput) {
  const title = (input.title ?? '').trim();
  if (!title) {
    throw new AppError('标题不能为空');
  }

  const content = input.content ?? '';
  const status = normalizeStatus(input.status);
  const categoryId = await resolveCategoryId(input.categoryId);
  const tagIds = await resolveTagIds(input.tagIds, input.tags);
  const slug = await buildArticleSlug(title, input.slug);

  return prisma.$transaction(async (tx) => {
    const article = await tx.article.create({
      data: {
        title,
        slug,
        content,
        excerpt: input.excerpt?.trim() || buildExcerpt(content),
        coverImage: input.coverImage?.trim() || null,
        status,
        categoryId,
        authorId: adminId,
        publishedAt: status === ArticleStatus.PUBLISHED ? new Date() : null,
      },
      include: articleInclude,
    });

    await connectArticleTags(tx, article.id, tagIds);

    const created = await tx.article.findUniqueOrThrow({
      where: { id: article.id },
      include: articleInclude,
    });

    return serializeArticle(created as ArticleRecord);
  });
}

export async function updateArticle(id: number, input: ArticleInput) {
  const existing = await prisma.article.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new AppError('文章不存在', 404);
  }

  const title = (input.title ?? existing.title).trim();
  if (!title) {
    throw new AppError('标题不能为空');
  }

  const content = input.content ?? existing.content;
  const status = normalizeStatus(input.status ?? existing.status.toLowerCase());
  const categoryId = await resolveCategoryId(input.categoryId ?? existing.categoryId);
  const tagIds = await resolveTagIds(input.tagIds, input.tags);
  const slug = await buildArticleSlug(title, input.slug ?? existing.slug, id);

  return prisma.$transaction(async (tx) => {
    await tx.article.update({
      where: { id },
      data: {
        title,
        slug,
        content,
        excerpt: input.excerpt?.trim() || buildExcerpt(content),
        coverImage: input.coverImage?.trim() || null,
        status,
        categoryId,
        publishedAt:
          status === ArticleStatus.PUBLISHED
            ? existing.publishedAt ?? new Date()
            : null,
      },
    });

    await tx.articleTag.deleteMany({
      where: { articleId: id },
    });
    await connectArticleTags(tx, id, tagIds);

    const updated = await tx.article.findUniqueOrThrow({
      where: { id },
      include: articleInclude,
    });

    return serializeArticle(updated as ArticleRecord);
  });
}

export async function deleteArticle(id: number) {
  await prisma.article.delete({
    where: { id },
  });
}
