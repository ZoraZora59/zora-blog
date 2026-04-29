import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../lib/prisma.js', () => {
  const mockPrisma = {
    tag: {
      findUnique: vi.fn(),
      delete: vi.fn(),
    },
    articleTag: {
      findMany: vi.fn(),
      deleteMany: vi.fn(),
      updateMany: vi.fn(),
    },
    $transaction: vi.fn((fn: (tx: unknown) => Promise<unknown>) => fn(mockPrisma)),
  };
  return { prisma: mockPrisma };
});

import { mergeTags } from '../services/tag-service.js';
import { prisma } from '../lib/prisma.js';

const mockPrisma = prisma as unknown as {
  tag: { findUnique: ReturnType<typeof vi.fn>; delete: ReturnType<typeof vi.fn> };
  articleTag: {
    findMany: ReturnType<typeof vi.fn>;
    deleteMany: ReturnType<typeof vi.fn>;
    updateMany: ReturnType<typeof vi.fn>;
  };
  $transaction: ReturnType<typeof vi.fn>;
};

describe('mergeTags', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.$transaction.mockImplementation((fn: (tx: unknown) => Promise<unknown>) => fn(mockPrisma));
  });

  it('throws when source tag does not exist', async () => {
    mockPrisma.tag.findUnique.mockResolvedValueOnce(null);
    await expect(mergeTags(999, 1)).rejects.toThrow('源标签不存在');
  });

  it('throws when target tag does not exist', async () => {
    mockPrisma.tag.findUnique
      .mockResolvedValueOnce({ id: 1, name: 'ai-2', slug: 'ai-2' })
      .mockResolvedValueOnce(null);
    await expect(mergeTags(1, 999)).rejects.toThrow('目标标签不存在');
  });

  it('throws when source and target are the same', async () => {
    await expect(mergeTags(1, 1)).rejects.toThrow('不能合并相同的标签');
  });

  it('migrates article associations and deletes source tag', async () => {
    mockPrisma.tag.findUnique
      .mockResolvedValueOnce({ id: 2, name: 'ai-2', slug: 'ai-2' })
      .mockResolvedValueOnce({ id: 1, name: 'ai', slug: 'ai' });
    mockPrisma.articleTag.findMany
      .mockResolvedValueOnce([{ articleId: 10, tagId: 2 }, { articleId: 20, tagId: 2 }])
      .mockResolvedValueOnce([{ articleId: 20, tagId: 1 }]);
    mockPrisma.articleTag.deleteMany.mockResolvedValue({ count: 2 });
    mockPrisma.articleTag.updateMany.mockResolvedValue({ count: 1 });
    mockPrisma.tag.delete.mockResolvedValue({ id: 2 });

    const result = await mergeTags(2, 1);

    expect(result).toEqual({ sourceId: 2, targetId: 1, migratedCount: 1 });
    expect(mockPrisma.articleTag.deleteMany).toHaveBeenCalledWith({
      where: { tagId: 2, articleId: { in: [20] } },
    });
    expect(mockPrisma.articleTag.updateMany).toHaveBeenCalledWith({
      where: { tagId: 2 },
      data: { tagId: 1 },
    });
    expect(mockPrisma.tag.delete).toHaveBeenCalledWith({ where: { id: 2 } });
  });

  it('handles source with no articles', async () => {
    mockPrisma.tag.findUnique
      .mockResolvedValueOnce({ id: 2, name: 'ai-2', slug: 'ai-2' })
      .mockResolvedValueOnce({ id: 1, name: 'ai', slug: 'ai' });
    mockPrisma.articleTag.findMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
    mockPrisma.articleTag.updateMany.mockResolvedValue({ count: 0 });
    mockPrisma.tag.delete.mockResolvedValue({ id: 2 });

    const result = await mergeTags(2, 1);
    expect(result).toEqual({ sourceId: 2, targetId: 1, migratedCount: 0 });
  });
});
