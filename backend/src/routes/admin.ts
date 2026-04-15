import { Hono } from 'hono';
import { randomUUID } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { AppError } from '../lib/app-error.js';
import { parseIdParam, parseOrder } from '../lib/pagination.js';
import { success } from '../lib/response.js';
import { allowedMimeTypes, ensureUploadsDir, uploadsDir } from '../lib/uploads.js';
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
  listAdminArticles,
  updateArticle,
} from '../services/article-service.js';
import type { AppBindings } from '../lib/types.js';

export const adminRoutes = new Hono<AppBindings>();

adminRoutes.use('*', requireAuth);

adminRoutes.get('/articles', async (c) => {
  const result = await listAdminArticles({
    status: c.req.query('status'),
    sort: c.req.query('sort'),
    order: parseOrder(c.req.query('order')),
    limit: c.req.query('limit'),
    offset: c.req.query('offset'),
  });

  return success(c, result);
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
  });

  return success(c, article, '文章更新成功');
});

adminRoutes.delete('/articles/:id', async (c) => {
  const id = parseIdParam(c.req.param('id'));
  await deleteArticle(id);
  return success(c, null, '文章删除成功');
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

  await ensureUploadsDir();
  const extension = allowedMimeTypes[value.type];
  const fileName = `${Date.now()}-${randomUUID()}${extension}`;
  const filePath = path.join(uploadsDir, fileName);

  const buffer = Buffer.from(await value.arrayBuffer());
  await writeFile(filePath, buffer);

  return success(c, {
    filename: fileName,
    url: `/uploads/${fileName}`,
  }, '上传成功', 201);
});
