import { prisma } from '../lib/prisma.js';
import { AppError } from '../lib/app-error.js';
import { slugify } from '../lib/slug.js';
import { resolveUniqueSlug } from '../lib/unique-slug.js';
import { ArticleStatus, type Article, type Category } from '@prisma/client';

export interface TopicSummary {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  coverImage: string | null;
  articleCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface TopicDetail extends TopicSummary {
  articles: TopicArticle[];
}

export interface TopicArticle {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  coverImage: string | null;
  publishedAt: string | null;
  viewCount: number;
  category: {
    id: number;
    name: string;
    slug: string;
  };
}

export interface TopicInput {
  title?: string;
  slug?: string;
  description?: string | null;
  coverImage?: string | null;
  articleIds?: number[];
}

type ArticleRecord = Article & {
  category: Category;
};

function serializeTopicArticle(article: ArticleRecord): TopicArticle {
  return {
    id: article.id,
    title: article.title,
    slug: article.slug,
    excerpt: article.excerpt,
    coverImage: article.coverImage,
    publishedAt: article.publishedAt?.toISOString() ?? null,
    viewCount: article.viewCount,
    category: {
      id: article.category.id,
      name: article.category.name,
      slug: article.category.slug,
    },
  };
}

async function buildTopicSlug(title: string, customSlug?: string, excludeId?: number) {
  const baseSlug = slugify(customSlug || title);
  return resolveUniqueSlug(baseSlug, async (candidate) => {
    const topic = await prisma.topic.findFirst({
      where: {
        slug: candidate,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      select: { id: true },
    });
    return Boolean(topic);
  });
}

// ---- C 端接口 ----

export async function listPublicTopics(): Promise<TopicSummary[]> {
  const topics = await prisma.topic.findMany({
    include: {
      topicArticles: {
        include: {
          article: {
            select: { status: true },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // 过滤只包含草稿文章的专题，只统计已发布文章
  return topics
    .map((topic) => {
      const publishedCount = topic.topicArticles.filter(
        (ta) => ta.article.status === ArticleStatus.PUBLISHED,
      ).length;
      return {
        id: topic.id,
        title: topic.title,
        slug: topic.slug,
        description: topic.description,
        coverImage: topic.coverImage,
        articleCount: publishedCount,
        createdAt: topic.createdAt.toISOString(),
        updatedAt: topic.updatedAt.toISOString(),
      };
    })
    .filter((topic) => topic.articleCount > 0);
}

export async function getPublicTopicBySlug(slug: string): Promise<TopicDetail> {
  const topic = await prisma.topic.findUnique({
    where: { slug },
    include: {
      topicArticles: {
        orderBy: { sortOrder: 'asc' },
        include: {
          article: {
            include: {
              category: true,
            },
          },
        },
      },
    },
  });

  if (!topic) {
    throw new AppError('专题不存在', 404);
  }

  const articles = topic.topicArticles
    .filter((ta) => ta.article.status === ArticleStatus.PUBLISHED)
    .map((ta) => serializeTopicArticle(ta.article as ArticleRecord));

  return {
    id: topic.id,
    title: topic.title,
    slug: topic.slug,
    description: topic.description,
    coverImage: topic.coverImage,
    articleCount: articles.length,
    createdAt: topic.createdAt.toISOString(),
    updatedAt: topic.updatedAt.toISOString(),
    articles,
  };
}

// ---- B 端接口 ----

export async function listAdminTopics(): Promise<TopicSummary[]> {
  const topics = await prisma.topic.findMany({
    include: {
      _count: {
        select: { topicArticles: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return topics.map((topic) => ({
    id: topic.id,
    title: topic.title,
    slug: topic.slug,
    description: topic.description,
    coverImage: topic.coverImage,
    articleCount: topic._count.topicArticles,
    createdAt: topic.createdAt.toISOString(),
    updatedAt: topic.updatedAt.toISOString(),
  }));
}

export async function getAdminTopicById(id: number): Promise<TopicDetail> {
  const topic = await prisma.topic.findUnique({
    where: { id },
    include: {
      topicArticles: {
        orderBy: { sortOrder: 'asc' },
        include: {
          article: {
            include: {
              category: true,
            },
          },
        },
      },
    },
  });

  if (!topic) {
    throw new AppError('专题不存在', 404);
  }

  const articles = topic.topicArticles.map((ta) =>
    serializeTopicArticle(ta.article as ArticleRecord),
  );

  return {
    id: topic.id,
    title: topic.title,
    slug: topic.slug,
    description: topic.description,
    coverImage: topic.coverImage,
    articleCount: articles.length,
    createdAt: topic.createdAt.toISOString(),
    updatedAt: topic.updatedAt.toISOString(),
    articles,
  };
}

export async function createTopic(input: TopicInput): Promise<TopicDetail> {
  const title = (input.title ?? '').trim();
  if (!title) {
    throw new AppError('标题不能为空');
  }

  const slug = await buildTopicSlug(title, input.slug);
  const articleIds = input.articleIds ?? [];

  return prisma.$transaction(async (tx) => {
    const topic = await tx.topic.create({
      data: {
        title,
        slug,
        description: input.description?.trim() || null,
        coverImage: input.coverImage?.trim() || null,
      },
    });

    if (articleIds.length > 0) {
      await tx.topicArticle.createMany({
        data: articleIds.map((articleId, index) => ({
          topicId: topic.id,
          articleId,
          sortOrder: index,
        })),
        skipDuplicates: true,
      });
    }

    const created = await tx.topic.findUniqueOrThrow({
      where: { id: topic.id },
      include: {
        topicArticles: {
          orderBy: { sortOrder: 'asc' },
          include: {
            article: {
              include: {
                category: true,
              },
            },
          },
        },
      },
    });

    const articles = created.topicArticles.map((ta) =>
      serializeTopicArticle(ta.article as ArticleRecord),
    );

    return {
      id: created.id,
      title: created.title,
      slug: created.slug,
      description: created.description,
      coverImage: created.coverImage,
      articleCount: articles.length,
      createdAt: created.createdAt.toISOString(),
      updatedAt: created.updatedAt.toISOString(),
      articles,
    };
  });
}

export async function updateTopic(id: number, input: TopicInput): Promise<TopicDetail> {
  const existing = await prisma.topic.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new AppError('专题不存在', 404);
  }

  const title = (input.title ?? existing.title).trim();
  if (!title) {
    throw new AppError('标题不能为空');
  }

  const slug = await buildTopicSlug(title, input.slug ?? existing.slug, id);
  const articleIds = input.articleIds;

  return prisma.$transaction(async (tx) => {
    await tx.topic.update({
      where: { id },
      data: {
        title,
        slug,
        description: input.description !== undefined ? input.description?.trim() || null : existing.description,
        coverImage: input.coverImage !== undefined ? input.coverImage?.trim() || null : existing.coverImage,
      },
    });

    if (articleIds !== undefined) {
      await tx.topicArticle.deleteMany({
        where: { topicId: id },
      });

      if (articleIds.length > 0) {
        await tx.topicArticle.createMany({
          data: articleIds.map((articleId, index) => ({
            topicId: id,
            articleId,
            sortOrder: index,
          })),
          skipDuplicates: true,
        });
      }
    }

    const updated = await tx.topic.findUniqueOrThrow({
      where: { id },
      include: {
        topicArticles: {
          orderBy: { sortOrder: 'asc' },
          include: {
            article: {
              include: {
                category: true,
              },
            },
          },
        },
      },
    });

    const articles = updated.topicArticles.map((ta) =>
      serializeTopicArticle(ta.article as ArticleRecord),
    );

    return {
      id: updated.id,
      title: updated.title,
      slug: updated.slug,
      description: updated.description,
      coverImage: updated.coverImage,
      articleCount: articles.length,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
      articles,
    };
  });
}

export async function deleteTopic(id: number): Promise<void> {
  const existing = await prisma.topic.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new AppError('专题不存在', 404);
  }

  await prisma.topic.delete({
    where: { id },
  });
}