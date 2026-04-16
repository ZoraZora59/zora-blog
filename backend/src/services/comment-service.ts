import { createHash } from 'node:crypto';
import { CommentStatus, Prisma, type Comment } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../lib/app-error.js';
import { parseNumberParam } from '../lib/pagination.js';
import { isValidEmail } from '../lib/sanitize.js';

export interface CommentInput {
  nickname?: string;
  email?: string;
  content?: string;
}

export interface AdminCommentListOptions {
  status?: string;
  articleId?: string;
  limit?: string;
  offset?: string;
  search?: string;
}

export type CommentModerateAction = 'approve' | 'reject';

type CommentWithArticle = Comment & {
  article: {
    id: number;
    title: string;
    slug: string;
  };
};

const NICKNAME_MAX = 40;
const EMAIL_MAX = 120;
const CONTENT_MAX = 1000;

function lowercaseStatus(status: CommentStatus) {
  return status.toLowerCase() as Lowercase<CommentStatus>;
}

function serializePublicComment(comment: Comment) {
  return {
    id: comment.id,
    nickname: comment.nickname,
    emailHash: hashEmail(comment.email),
    content: comment.content,
    createdAt: comment.createdAt,
  };
}

function serializeAdminComment(comment: CommentWithArticle) {
  return {
    id: comment.id,
    nickname: comment.nickname,
    email: comment.email,
    emailHash: hashEmail(comment.email),
    content: comment.content,
    status: lowercaseStatus(comment.status),
    createdAt: comment.createdAt,
    updatedAt: comment.updatedAt,
    article: {
      id: comment.article.id,
      title: comment.article.title,
      slug: comment.article.slug,
    },
  };
}

// 基于 email 计算 Gravatar 所需的 MD5 哈希；
// 评论展示时不暴露原始邮箱，只暴露哈希供客户端渲染头像。
function hashEmail(email: string) {
  return createHash('md5').update(email.trim().toLowerCase()).digest('hex');
}

function normalizeStatusFilter(value?: string) {
  if (!value || value === 'all') {
    return undefined;
  }
  const upper = value.toUpperCase();
  if (upper === CommentStatus.PENDING) {
    return CommentStatus.PENDING;
  }
  if (upper === CommentStatus.APPROVED) {
    return CommentStatus.APPROVED;
  }
  if (upper === CommentStatus.REJECTED) {
    return CommentStatus.REJECTED;
  }
  throw new AppError('评论状态不合法');
}

async function getArticleBySlug(slug: string) {
  const article = await prisma.article.findFirst({
    where: { slug },
    select: { id: true, status: true },
  });

  if (!article) {
    throw new AppError('文章不存在', 404);
  }

  return article;
}

// C 端：列出某篇已发布文章的公开评论（仅 APPROVED），按时间倒序
export async function listPublicCommentsByArticleSlug(slug: string) {
  const article = await getArticleBySlug(slug);

  // 只返回已发布文章的评论
  if (article.status !== 'PUBLISHED') {
    throw new AppError('文章不存在', 404);
  }

  const comments = await prisma.comment.findMany({
    where: {
      articleId: article.id,
      status: CommentStatus.APPROVED,
    },
    orderBy: { createdAt: 'desc' },
  });

  return {
    items: comments.map(serializePublicComment),
    total: comments.length,
  };
}

// C 端：访客提交评论。根据 SiteSettings.commentModerationEnabled 决定默认状态。
export async function submitArticleComment(slug: string, input: CommentInput) {
  const nickname = (input.nickname ?? '').trim();
  const email = (input.email ?? '').trim();
  const rawContent = (input.content ?? '').trim();

  if (!nickname) {
    throw new AppError('昵称不能为空');
  }
  if (nickname.length > NICKNAME_MAX) {
    throw new AppError(`昵称长度不能超过 ${NICKNAME_MAX} 个字符`);
  }
  if (!email) {
    throw new AppError('邮箱不能为空');
  }
  if (email.length > EMAIL_MAX || !isValidEmail(email)) {
    throw new AppError('邮箱格式不正确');
  }
  if (!rawContent) {
    throw new AppError('评论内容不能为空');
  }
  if (rawContent.length > CONTENT_MAX) {
    throw new AppError(`评论内容不能超过 ${CONTENT_MAX} 个字符`);
  }

  const article = await getArticleBySlug(slug);

  // 未发布的文章不接受评论
  if (article.status !== 'PUBLISHED') {
    throw new AppError('文章尚未发布，暂不可评论', 403);
  }

  const settings = await prisma.siteSettings.findUnique({
    where: { id: 1 },
    select: { commentModerationEnabled: true },
  });

  const moderationEnabled = settings?.commentModerationEnabled ?? true;
  const status = moderationEnabled ? CommentStatus.PENDING : CommentStatus.APPROVED;

  // 不在数据库中做 HTML 转义：前端通过 React 文本节点 `{text}` 渲染，
  // 天然会转义 <>& 等字符，避免在展示层二次转义导致字面量 `&lt;`。
  // 这里只做内容首尾去空 + 压缩过多连续换行，保持数据整洁。
  const normalizedContent = rawContent.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n');

  const comment = await prisma.comment.create({
    data: {
      articleId: article.id,
      nickname,
      email,
      content: normalizedContent,
      status,
    },
  });

  return {
    status: lowercaseStatus(comment.status),
    // APPROVED 时直接返回完整评论数据供前端立即插入列表
    comment: status === CommentStatus.APPROVED ? serializePublicComment(comment) : null,
  };
}

// B 端：后台评论列表，支持按状态 / 文章 / 搜索 / 分页筛选
export async function listAdminComments(options: AdminCommentListOptions) {
  const limit = Math.min(parseNumberParam(options.limit, 20, 1), 100);
  const offset = parseNumberParam(options.offset, 0, 0);
  const statusFilter = normalizeStatusFilter(options.status);
  const articleIdRaw = Number(options.articleId);
  const articleId =
    Number.isInteger(articleIdRaw) && articleIdRaw > 0 ? articleIdRaw : undefined;
  const search = (options.search ?? '').trim();

  const where: Prisma.CommentWhereInput = {
    ...(statusFilter ? { status: statusFilter } : {}),
    ...(articleId ? { articleId } : {}),
    ...(search
      ? {
          OR: [
            { nickname: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { content: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  const [items, total, pendingCount, approvedCount, rejectedCount, articleRefs] =
    await prisma.$transaction([
      prisma.comment.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
        include: {
          article: {
            select: {
              id: true,
              title: true,
              slug: true,
            },
          },
        },
      }),
      prisma.comment.count({ where }),
      prisma.comment.count({ where: { status: CommentStatus.PENDING } }),
      prisma.comment.count({ where: { status: CommentStatus.APPROVED } }),
      prisma.comment.count({ where: { status: CommentStatus.REJECTED } }),
      // 最近有评论的文章，用于筛选下拉
      prisma.article.findMany({
        where: {
          comments: { some: {} },
        },
        select: {
          id: true,
          title: true,
          slug: true,
        },
        orderBy: { updatedAt: 'desc' },
        take: 50,
      }),
    ]);

  return {
    items: items.map(serializeAdminComment),
    pagination: {
      limit,
      offset,
      total,
    },
    stats: {
      total: pendingCount + approvedCount + rejectedCount,
      pending: pendingCount,
      approved: approvedCount,
      rejected: rejectedCount,
    },
    articles: articleRefs.map((article) => ({
      id: article.id,
      title: article.title,
      slug: article.slug,
    })),
  };
}

function resolveStatusForAction(action: CommentModerateAction) {
  if (action === 'approve') {
    return CommentStatus.APPROVED;
  }
  if (action === 'reject') {
    return CommentStatus.REJECTED;
  }
  throw new AppError('操作类型不合法');
}

export async function moderateComment(id: number, action: CommentModerateAction) {
  const status = resolveStatusForAction(action);

  const existing = await prisma.comment.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!existing) {
    throw new AppError('评论不存在', 404);
  }

  const updated = await prisma.comment.update({
    where: { id },
    data: { status },
    include: {
      article: {
        select: { id: true, title: true, slug: true },
      },
    },
  });

  return serializeAdminComment(updated);
}

export async function batchModerateComments(ids: number[], action: CommentModerateAction) {
  if (!Array.isArray(ids) || ids.length === 0) {
    throw new AppError('请选择至少一条评论');
  }
  const validIds = ids.filter((id) => Number.isInteger(id) && id > 0);
  if (validIds.length === 0) {
    throw new AppError('评论 ID 不合法');
  }

  const status = resolveStatusForAction(action);

  const result = await prisma.comment.updateMany({
    where: { id: { in: validIds } },
    data: { status },
  });

  return { count: result.count };
}

export async function deleteComment(id: number) {
  const existing = await prisma.comment.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!existing) {
    throw new AppError('评论不存在', 404);
  }

  await prisma.comment.delete({
    where: { id },
  });
}
