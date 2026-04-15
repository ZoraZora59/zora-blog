import { prisma } from '../lib/prisma.js';
import { AppError } from '../lib/app-error.js';
import { slugify } from '../lib/slug.js';
import { resolveUniqueSlug } from '../lib/unique-slug.js';

export interface TagInput {
  name: string;
  slug?: string;
}

async function buildTagSlug(name: string, customSlug?: string, excludeId?: number) {
  const baseSlug = slugify(customSlug || name);
  return resolveUniqueSlug(baseSlug, async (candidate) => {
    const tag = await prisma.tag.findFirst({
      where: {
        slug: candidate,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      select: { id: true },
    });
    return Boolean(tag);
  });
}

export async function listPublicTags() {
  const articleTags = await prisma.articleTag.findMany({
    where: {
      article: {
        status: 'PUBLISHED',
      },
    },
    include: {
      tag: true,
    },
  });

  const tagCountMap = new Map<number, { id: number; name: string; slug: string; articleCount: number }>();

  for (const item of articleTags) {
    const existing = tagCountMap.get(item.tagId);
    if (existing) {
      existing.articleCount += 1;
      continue;
    }

    tagCountMap.set(item.tagId, {
      id: item.tag.id,
      name: item.tag.name,
      slug: item.tag.slug,
      articleCount: 1,
    });
  }

  return Array.from(tagCountMap.values()).sort((a, b) => b.articleCount - a.articleCount || a.name.localeCompare(b.name));
}

export async function listAdminTags() {
  const tags = await prisma.tag.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: {
          articleTags: true,
        },
      },
    },
  });

  return tags.map((tag) => ({
    id: tag.id,
    name: tag.name,
    slug: tag.slug,
    articleCount: tag._count.articleTags,
    createdAt: tag.createdAt,
    updatedAt: tag.updatedAt,
  }));
}

export async function createTag(input: TagInput) {
  const name = input.name.trim();
  if (!name) {
    throw new AppError('标签名称不能为空');
  }

  const slug = await buildTagSlug(name, input.slug);
  return prisma.tag.create({
    data: {
      name,
      slug,
    },
  });
}

export async function updateTag(id: number, input: TagInput) {
  const tag = await prisma.tag.findUnique({ where: { id } });
  if (!tag) {
    throw new AppError('标签不存在', 404);
  }

  const name = input.name.trim();
  if (!name) {
    throw new AppError('标签名称不能为空');
  }

  const slug = await buildTagSlug(name, input.slug, id);
  return prisma.tag.update({
    where: { id },
    data: {
      name,
      slug,
    },
  });
}

export async function deleteTag(id: number) {
  await prisma.tag.delete({
    where: { id },
  });
}

export async function resolveTagIds(inputTagIds?: number[], tagNames?: string[]) {
  const resolvedIds = new Set<number>();

  for (const tagId of inputTagIds ?? []) {
    const tag = await prisma.tag.findUnique({ where: { id: tagId } });
    if (!tag) {
      throw new AppError(`标签不存在: ${tagId}`, 404);
    }
    resolvedIds.add(tag.id);
  }

  for (const rawName of tagNames ?? []) {
    const name = rawName.trim();
    if (!name) {
      continue;
    }

    const existing = await prisma.tag.findUnique({
      where: { name },
    });

    if (existing) {
      resolvedIds.add(existing.id);
      continue;
    }

    const slug = await buildTagSlug(name);
    const created = await prisma.tag.create({
      data: {
        name,
        slug,
      },
    });
    resolvedIds.add(created.id);
  }

  return Array.from(resolvedIds);
}
