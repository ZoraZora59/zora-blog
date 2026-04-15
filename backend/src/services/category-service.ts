import { prisma } from '../lib/prisma.js';
import { AppError } from '../lib/app-error.js';
import { slugify } from '../lib/slug.js';
import { resolveUniqueSlug } from '../lib/unique-slug.js';

export interface CategoryInput {
  name: string;
  slug?: string;
  description?: string | null;
}

const DEFAULT_CATEGORY = {
  name: '未分类',
  slug: 'uncategorized',
  description: '默认分类',
};

async function buildCategorySlug(name: string, customSlug?: string, excludeId?: number) {
  const baseSlug = slugify(customSlug || name);
  return resolveUniqueSlug(baseSlug, async (candidate) => {
    const category = await prisma.category.findFirst({
      where: {
        slug: candidate,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      select: { id: true },
    });
    return Boolean(category);
  });
}

export async function getOrCreateDefaultCategory() {
  const existing = await prisma.category.findUnique({
    where: { slug: DEFAULT_CATEGORY.slug },
  });

  if (existing) {
    return existing;
  }

  return prisma.category.create({
    data: DEFAULT_CATEGORY,
  });
}

export async function listPublicCategories() {
  const categories = await prisma.category.findMany({
    orderBy: { name: 'asc' },
    include: {
      _count: {
        select: {
          articles: {
            where: {
              status: 'PUBLISHED',
            },
          },
        },
      },
    },
  });

  return categories.map((category) => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description,
    articleCount: category._count.articles,
  }));
}

export async function listAdminCategories() {
  const categories = await prisma.category.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: {
          articles: true,
        },
      },
    },
  });

  return categories.map((category) => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description,
    articleCount: category._count.articles,
    createdAt: category.createdAt,
    updatedAt: category.updatedAt,
  }));
}

export async function createCategory(input: CategoryInput) {
  const name = input.name.trim();
  if (!name) {
    throw new AppError('分类名称不能为空');
  }

  const slug = await buildCategorySlug(name, input.slug);
  return prisma.category.create({
    data: {
      name,
      slug,
      description: input.description?.trim() || null,
    },
  });
}

export async function updateCategory(id: number, input: CategoryInput) {
  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) {
    throw new AppError('分类不存在', 404);
  }

  const name = input.name.trim();
  if (!name) {
    throw new AppError('分类名称不能为空');
  }

  const slug = await buildCategorySlug(name, input.slug, id);
  return prisma.category.update({
    where: { id },
    data: {
      name,
      slug,
      description: input.description?.trim() || null,
    },
  });
}

export async function deleteCategory(id: number) {
  const articleCount = await prisma.article.count({
    where: { categoryId: id },
  });

  if (articleCount > 0) {
    throw new AppError('该分类下仍有文章，无法删除');
  }

  await prisma.category.delete({
    where: { id },
  });
}
