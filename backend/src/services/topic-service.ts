import { prisma } from '../lib/prisma.js';

export interface TopicSummary {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  coverImage: string | null;
  articleCount: number;
}

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
  }));
}