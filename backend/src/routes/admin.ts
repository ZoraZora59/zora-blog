import { Hono } from 'hono';
import { AppError } from '../lib/app-error.js';
import { parseIdParam, parseOrder } from '../lib/pagination.js';
import { success } from '../lib/response.js';
import { uploadImageToCloud } from '../lib/media-storage.js';
import { allowedMimeTypes } from '../lib/uploads.js';
import { requireAuth } from '../middleware/auth.js';
import {
  createCategory,
  deleteCategory,
  listAdminCategories,
  updateCategory,
} from '../services/category-service.js';
import {
  createTag,
  deleteTag,
  listAdminTags,
  updateTag,
} from '../services/tag-service.js';
import {
  createArticle,
  deleteArticle,
  getAdminArticleById,
  getAdminArticleBySlug,
  getAdminArticleStats,
  listAdminArticles,
  updateArticle,
} from '../services/article-service.js';
import {
  batchModerateComments,
  deleteComment,
  listAdminComments,
  moderateComment,
  type CommentModerateAction,
} from '../services/comment-service.js';
import { getDashboardStats } from '../services/dashboard-service.js';
import {
  createTopic,
  deleteTopic,
  getAdminTopicById,
  listAdminTopics,
  updateTopic,
} from '../services/topic-service.js';
import {
  getAdminSettings,
  updateAdminProfile,
  updateSiteSettings,
} from '../services/site-service.js';
import type { AppBindings } from '../lib/types.js';

export const adminRoutes = new Hono<AppBindings>();

adminRoutes.use('*', requireAuth);

adminRoutes.get('/dashboard', async (c) => {
  const stats = await getDashboardStats();
  return success(c, stats);
});

adminRoutes.get('/settings', async (c) => {
  const admin = c.get('admin');
  const settings = await getAdminSettings(admin.id);
  return success(c, settings);
});

adminRoutes.put('/settings', async (c) => {
  const body = await c.req.json<{
    siteTitle?: string;
    siteDescription?: string | null;
    logo?: string | null;
    slogan?: string | null;
    aboutContent?: string | null;
    skills?: string[];
    githubUrl?: string | null;
    email?: string | null;
    heroBadge?: string | null;
    heroTitle?: string | null;
    heroSubtitle?: string | null;
    heroPrimaryText?: string | null;
    heroPrimaryHref?: string | null;
    heroSecondaryText?: string | null;
    heroSecondaryHref?: string | null;
    heroImages?: string[];
    commentModerationEnabled?: boolean;
  }>().catch(() => {
    throw new AppError('请求体必须是 JSON');
  });

  const site = await updateSiteSettings({
    siteTitle: body.siteTitle,
    siteDescription: body.siteDescription,
    logo: body.logo,
    slogan: body.slogan,
    aboutContent: body.aboutContent,
    skills: body.skills,
    githubUrl: body.githubUrl,
    email: body.email,
    heroBadge: body.heroBadge,
    heroTitle: body.heroTitle,
    heroSubtitle: body.heroSubtitle,
    heroPrimaryText: body.heroPrimaryText,
    heroPrimaryHref: body.heroPrimaryHref,
    heroSecondaryText: body.heroSecondaryText,
    heroSecondaryHref: body.heroSecondaryHref,
    heroImages: body.heroImages,
    commentModerationEnabled: body.commentModerationEnabled,
  });
  return success(c, site, '站点设置已更新');
});

adminRoutes.put('/profile', async (c) => {
  const admin = c.get('admin');
  const body = await c.req.json<{
    displayName?: string;
    avatar?: string | null;
    bio?: string | null;
    role?: string | null;
  }>().catch(() => {
    throw new AppError('请求体必须是 JSON');
  });

  const updated = await updateAdminProfile(admin.id, body);
  return success(c, updated, '个人资料已更新');
});

adminRoutes.get('/articles', async (c) => {
  const result = await listAdminArticles({
    status: c.req.query('status'),
    sort: c.req.query('sort'),
    order: parseOrder(c.req.query('order')),
    limit: c.req.query('limit'),
    offset: c.req.query('offset'),
    search: c.req.query('search'),
  });

  return success(c, result);
});

adminRoutes.get('/articles/stats', async (c) => {
  const stats = await getAdminArticleStats();
  return success(c, stats);
});

adminRoutes.get('/articles/by-slug/:slug', async (c) => {
  const slug = c.req.param('slug');
  const article = await getAdminArticleBySlug(slug);
  return success(c, article);
});

adminRoutes.get('/articles/:id', async (c) => {
  const id = parseIdParam(c.req.param('id'));
  const article = await getAdminArticleById(id);
  return success(c, article);
});

adminRoutes.post('/articles', async (c) => {
  const body = await c.req.json<{
    title?: string;
    content?: string;
    excerpt?: string | null;
    coverImage?: string | null;
    status?: string;
    slug?: string;
    categoryId?: number;
    tagIds?: number[];
    tags?: string[];
    topicIds?: number[];
  }>().catch(() => {
    throw new AppError('请求体必须是 JSON');
  });

  const article = await createArticle(c.get('admin').id, {
    title: body.title ?? '',
    content: body.content,
    excerpt: body.excerpt,
    coverImage: body.coverImage,
    status: body.status,
    slug: body.slug,
    categoryId: body.categoryId,
    tagIds: body.tagIds,
    tags: body.tags,
    topicIds: body.topicIds,
  });

  return success(c, article, '文章创建成功', 201);
});

adminRoutes.put('/articles/:id', async (c) => {
  const id = parseIdParam(c.req.param('id'));
  const body = await c.req.json<{
    title?: string;
    content?: string;
    excerpt?: string | null;
    coverImage?: string | null;
    status?: string;
    slug?: string;
    categoryId?: number;
    tagIds?: number[];
    tags?: string[];
    topicIds?: number[];
  }>().catch(() => {
    throw new AppError('请求体必须是 JSON');
  });

  const article = await updateArticle(id, {
    title: body.title,
    content: body.content,
    excerpt: body.excerpt,
    coverImage: body.coverImage,
    status: body.status,
    slug: body.slug,
    categoryId: body.categoryId,
    tagIds: body.tagIds,
    tags: body.tags,
    topicIds: body.topicIds,
  });

  return success(c, article, '文章更新成功');
});

adminRoutes.delete('/articles/:id', async (c) => {
  const id = parseIdParam(c.req.param('id'));
  await deleteArticle(id);
  return success(c, null, '文章删除成功');
});

function parseAction(value: unknown): CommentModerateAction {
  if (value === 'approve' || value === 'reject') {
    return value;
  }
  throw new AppError('操作类型不合法');
}

adminRoutes.get('/comments', async (c) => {
  const result = await listAdminComments({
    status: c.req.query('status'),
    articleId: c.req.query('articleId'),
    limit: c.req.query('limit'),
    offset: c.req.query('offset'),
    search: c.req.query('search'),
  });
  return success(c, result);
});

adminRoutes.put('/comments/batch', async (c) => {
  const body = await c
    .req.json<{ ids?: number[]; action?: string }>()
    .catch(() => {
      throw new AppError('请求体必须是 JSON');
    });

  const action = parseAction(body.action);
  const result = await batchModerateComments(body.ids ?? [], action);
  return success(c, result, '批量操作已完成');
});

adminRoutes.put('/comments/:id', async (c) => {
  const id = parseIdParam(c.req.param('id'));
  const body = await c
    .req.json<{ action?: string }>()
    .catch(() => {
      throw new AppError('请求体必须是 JSON');
    });

  const action = parseAction(body.action);
  const comment = await moderateComment(id, action);
  const message = action === 'approve' ? '评论已通过' : '评论已拒绝';
  return success(c, comment, message);
});

adminRoutes.delete('/comments/:id', async (c) => {
  const id = parseIdParam(c.req.param('id'));
  await deleteComment(id);
  return success(c, null, '评论已删除');
});

adminRoutes.get('/categories', async (c) => {
  const categories = await listAdminCategories();
  return success(c, categories);
});

adminRoutes.post('/categories', async (c) => {
  const body = await c.req.json<{ name?: string; slug?: string; description?: string | null }>().catch(() => {
    throw new AppError('请求体必须是 JSON');
  });

  const category = await createCategory({
    name: body.name ?? '',
    slug: body.slug,
    description: body.description,
  });
  return success(c, category, '分类创建成功', 201);
});

adminRoutes.put('/categories/:id', async (c) => {
  const id = parseIdParam(c.req.param('id'));
  const body = await c.req.json<{ name?: string; slug?: string; description?: string | null }>().catch(() => {
    throw new AppError('请求体必须是 JSON');
  });

  const category = await updateCategory(id, {
    name: body.name ?? '',
    slug: body.slug,
    description: body.description,
  });
  return success(c, category, '分类更新成功');
});

adminRoutes.delete('/categories/:id', async (c) => {
  const id = parseIdParam(c.req.param('id'));
  await deleteCategory(id);
  return success(c, null, '分类删除成功');
});

adminRoutes.get('/tags', async (c) => {
  const tags = await listAdminTags();
  return success(c, tags);
});

adminRoutes.get('/topics', async (c) => {
  const topics = await listAdminTopics();
  return success(c, topics);
});

adminRoutes.get('/topics/:id', async (c) => {
  const id = parseIdParam(c.req.param('id'));
  const topic = await getAdminTopicById(id);
  return success(c, topic);
});

adminRoutes.post('/topics', async (c) => {
  const body = await c.req.json<{
    title?: string;
    slug?: string;
    description?: string | null;
    coverImage?: string | null;
    articleIds?: number[];
  }>().catch(() => {
    throw new AppError('请求体必须是 JSON');
  });

  const topic = await createTopic({
    title: body.title,
    slug: body.slug,
    description: body.description,
    coverImage: body.coverImage,
    articleIds: body.articleIds,
  });

  return success(c, topic, '专题创建成功', 201);
});

adminRoutes.put('/topics/:id', async (c) => {
  const id = parseIdParam(c.req.param('id'));
  const body = await c.req.json<{
    title?: string;
    slug?: string;
    description?: string | null;
    coverImage?: string | null;
    articleIds?: number[];
  }>().catch(() => {
    throw new AppError('请求体必须是 JSON');
  });

  const topic = await updateTopic(id, {
    title: body.title,
    slug: body.slug,
    description: body.description,
    coverImage: body.coverImage,
    articleIds: body.articleIds,
  });

  return success(c, topic, '专题更新成功');
});

adminRoutes.delete('/topics/:id', async (c) => {
  const id = parseIdParam(c.req.param('id'));
  await deleteTopic(id);
  return success(c, null, '专题删除成功');
});

adminRoutes.post('/tags', async (c) => {
  const body = await c.req.json<{ name?: string; slug?: string }>().catch(() => {
    throw new AppError('请求体必须是 JSON');
  });

  const tag = await createTag({
    name: body.name ?? '',
    slug: body.slug,
  });
  return success(c, tag, '标签创建成功', 201);
});

adminRoutes.put('/tags/:id', async (c) => {
  const id = parseIdParam(c.req.param('id'));
  const body = await c.req.json<{ name?: string; slug?: string }>().catch(() => {
    throw new AppError('请求体必须是 JSON');
  });

  const tag = await updateTag(id, {
    name: body.name ?? '',
    slug: body.slug,
  });
  return success(c, tag, '标签更新成功');
});

adminRoutes.delete('/tags/:id', async (c) => {
  const id = parseIdParam(c.req.param('id'));
  await deleteTag(id);
  return success(c, null, '标签删除成功');
});

adminRoutes.post('/upload', async (c) => {
  const formData = await c.req.formData().catch(() => {
    throw new AppError('请求必须是 multipart/form-data');
  });

  const value = formData.get('file');
  if (!(value instanceof File)) {
    throw new AppError('缺少文件字段 file');
  }

  if (!(value.type in allowedMimeTypes)) {
    throw new AppError('仅支持 jpg/png/webp/gif 图片');
  }

  if (value.size > 5 * 1024 * 1024) {
    throw new AppError('图片大小不能超过 5MB');
  }

  const result = await uploadImageToCloud(value);

  return success(c, result, '上传成功', 201);
});
