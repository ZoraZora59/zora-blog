import { Hono } from 'hono';
import { AppError } from '../lib/app-error.js';
import { parseOrder } from '../lib/pagination.js';
import { success } from '../lib/response.js';
import { listPublicCategories } from '../services/category-service.js';
import { getPublicArticleBySlug, listPublicArticles } from '../services/article-service.js';
import {
  listPublicCommentsByArticleSlug,
  submitArticleComment,
} from '../services/comment-service.js';
import { getSitePublicInfo } from '../services/site-service.js';
import { listPublicTags } from '../services/tag-service.js';

export const publicRoutes = new Hono();

publicRoutes.get('/site', async (c) => {
  const site = await getSitePublicInfo();
  return success(c, site);
});

publicRoutes.get('/articles', async (c) => {
  const result = await listPublicArticles({
    category: c.req.query('category') ?? c.req.query('categorySlug'),
    tag: c.req.query('tag') ?? c.req.query('tagSlug'),
    page: c.req.query('page'),
    limit: c.req.query('limit'),
    sort: c.req.query('sort'),
    order: parseOrder(c.req.query('order')),
  });

  return success(c, result);
});

publicRoutes.get('/articles/:slug', async (c) => {
  const article = await getPublicArticleBySlug(c.req.param('slug'));
  return success(c, article);
});

publicRoutes.get('/articles/:slug/comments', async (c) => {
  const comments = await listPublicCommentsByArticleSlug(c.req.param('slug'));
  return success(c, comments);
});

publicRoutes.post('/articles/:slug/comments', async (c) => {
  const body = await c
    .req.json<{ nickname?: string; email?: string; content?: string }>()
    .catch(() => {
      throw new AppError('请求体必须是 JSON');
    });

  const result = await submitArticleComment(c.req.param('slug'), body);
  const message = result.status === 'approved' ? '评论发布成功' : '评论已提交，等待审核';
  return success(c, result, message, 201);
});

publicRoutes.get('/categories', async (c) => {
  const categories = await listPublicCategories();
  return success(c, categories);
});

publicRoutes.get('/tags', async (c) => {
  const tags = await listPublicTags();
  return success(c, tags);
});
