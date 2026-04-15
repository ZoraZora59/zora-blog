import { Hono } from 'hono';
import { parseOrder } from '../lib/pagination.js';
import { success } from '../lib/response.js';
import { listPublicCategories } from '../services/category-service.js';
import { getPublicArticleBySlug, listPublicArticles } from '../services/article-service.js';
import { listPublicTags } from '../services/tag-service.js';

export const publicRoutes = new Hono();

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

publicRoutes.get('/categories', async (c) => {
  const categories = await listPublicCategories();
  return success(c, categories);
});

publicRoutes.get('/tags', async (c) => {
  const tags = await listPublicTags();
  return success(c, tags);
});
