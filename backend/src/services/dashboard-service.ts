import { ArticleStatus, CommentStatus } from '@prisma/client';
import { prisma } from '../lib/prisma.js';

const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

// Dashboard 顶部四张统计卡片需要的聚合数据 + 最近发布 + 最近评论
export async function getDashboardStats() {
  const weekAgo = new Date(Date.now() - ONE_WEEK_MS);

  const [
    totalArticles,
    publishedArticles,
    draftArticles,
    totalViewsAgg,
    totalLikesAgg,
    articlesThisWeek,
    viewsThisWeekAgg,
    lastPublished,
    topArticles,
    totalComments,
    approvedComments,
    pendingComments,
    commentsThisWeek,
    recentComments,
  ] = await prisma.$transaction([
    prisma.article.count(),
    prisma.article.count({ where: { status: ArticleStatus.PUBLISHED } }),
    prisma.article.count({ where: { status: ArticleStatus.DRAFT } }),
    prisma.article.aggregate({
      _sum: { viewCount: true },
      where: { status: ArticleStatus.PUBLISHED },
    }),
    prisma.article.aggregate({
      _sum: { likeCount: true },
      where: { status: ArticleStatus.PUBLISHED },
    }),
    prisma.article.count({
      where: {
        status: ArticleStatus.PUBLISHED,
        publishedAt: { gte: weekAgo },
      },
    }),
    prisma.article.aggregate({
      _sum: { viewCount: true },
      where: {
        status: ArticleStatus.PUBLISHED,
        publishedAt: { gte: weekAgo },
      },
    }),
    prisma.article.findFirst({
      where: { status: ArticleStatus.PUBLISHED },
      orderBy: { publishedAt: 'desc' },
      include: {
        category: true,
      },
    }),
    prisma.article.findMany({
      where: { status: ArticleStatus.PUBLISHED },
      orderBy: { viewCount: 'desc' },
      take: 5,
      select: {
        id: true,
        title: true,
        slug: true,
        viewCount: true,
        likeCount: true,
        publishedAt: true,
      },
    }),
    // 评论统计
    prisma.comment.count(),
    prisma.comment.count({ where: { status: CommentStatus.APPROVED } }),
    prisma.comment.count({ where: { status: CommentStatus.PENDING } }),
    prisma.comment.count({
      where: {
        createdAt: { gte: weekAgo },
      },
    }),
    // 最近 5 条评论（含文章信息）
    prisma.comment.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        nickname: true,
        content: true,
        status: true,
        createdAt: true,
        article: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
      },
    }),
  ]);

  return {
    totals: {
      articles: totalArticles,
      published: publishedArticles,
      drafts: draftArticles,
      views: totalViewsAgg._sum.viewCount ?? 0,
      likes: totalLikesAgg._sum.likeCount ?? 0,
      comments: totalComments,
      approvedComments,
      pendingComments,
    },
    weeklyGrowth: {
      articles: articlesThisWeek,
      views: viewsThisWeekAgg._sum.viewCount ?? 0,
      comments: commentsThisWeek,
    },
    lastPublished: lastPublished
      ? {
          id: lastPublished.id,
          title: lastPublished.title,
          slug: lastPublished.slug,
          excerpt: lastPublished.excerpt,
          coverImage: lastPublished.coverImage,
          publishedAt: lastPublished.publishedAt,
          viewCount: lastPublished.viewCount,
          likeCount: lastPublished.likeCount,
          category: {
            id: lastPublished.category.id,
            name: lastPublished.category.name,
            slug: lastPublished.category.slug,
          },
        }
      : null,
    topArticles,
    recentComments: recentComments.map((comment) => ({
      id: comment.id,
      nickname: comment.nickname,
      content: comment.content,
      status: comment.status.toLowerCase(),
      createdAt: comment.createdAt,
      article: comment.article,
    })),
  };
}
