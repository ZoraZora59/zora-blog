import { ArticleStatus } from '@prisma/client';
import { env } from '../src/lib/env.js';
import { hashPassword } from '../src/lib/auth.js';
import { prisma } from '../src/lib/prisma.js';

async function main() {
  const passwordHash = await hashPassword(env.seedAdminPassword);

  const admin = await prisma.admin.upsert({
    where: { username: 'admin' },
    update: {
      passwordHash,
      displayName: 'ZoraGK',
      role: '程序员 / 户外爱好者',
      bio: '一个融合科技与户外生活方式的博客博主。',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
    },
    create: {
      username: 'admin',
      passwordHash,
      displayName: 'ZoraGK',
      role: '程序员 / 户外爱好者',
      bio: '一个融合科技与户外生活方式的博客博主。',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
    },
  });

  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: 'tech-blog' },
      update: { name: '技术博客', description: '技术文章与工程实践' },
      create: {
        name: '技术博客',
        slug: 'tech-blog',
        description: '技术文章与工程实践',
      },
    }),
    prisma.category.upsert({
      where: { slug: 'outdoor-journal' },
      update: { name: '户外手记', description: '露营、徒步与装备体验' },
      create: {
        name: '户外手记',
        slug: 'outdoor-journal',
        description: '露营、徒步与装备体验',
      },
    }),
    prisma.category.upsert({
      where: { slug: 'uncategorized' },
      update: { name: '未分类', description: '默认分类' },
      create: {
        name: '未分类',
        slug: 'uncategorized',
        description: '默认分类',
      },
    }),
  ]);

  const tags = await Promise.all([
    prisma.tag.upsert({
      where: { name: 'TypeScript' },
      update: { slug: 'typescript' },
      create: { name: 'TypeScript', slug: 'typescript' },
    }),
    prisma.tag.upsert({
      where: { name: 'React' },
      update: { slug: 'react' },
      create: { name: 'React', slug: 'react' },
    }),
    prisma.tag.upsert({
      where: { name: '露营' },
      update: { slug: 'camping' },
      create: { name: '露营', slug: 'camping' },
    }),
  ]);

  const article = await prisma.article.upsert({
    where: { slug: 'developer-by-day-adventurer-by-night' },
    update: {
      title: 'Developer by day, adventurer by night',
      content: `# Developer by day, adventurer by night

这是一篇用于初始化博客的示例文章。

## 为什么做这个博客

因为技术与户外并不冲突，它们都是探索未知的方式。

\`\`\`ts
export const hello = 'zora-blog';
\`\`\`
`,
      excerpt: '这是一篇用于初始化博客的示例文章。',
      status: ArticleStatus.PUBLISHED,
      categoryId: categories[0].id,
      authorId: admin.id,
      publishedAt: new Date(),
      coverImage: 'https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&w=1200&q=80',
    },
    create: {
      title: 'Developer by day, adventurer by night',
      slug: 'developer-by-day-adventurer-by-night',
      content: `# Developer by day, adventurer by night

这是一篇用于初始化博客的示例文章。

## 为什么做这个博客

因为技术与户外并不冲突，它们都是探索未知的方式。

\`\`\`ts
export const hello = 'zora-blog';
\`\`\`
`,
      excerpt: '这是一篇用于初始化博客的示例文章。',
      status: ArticleStatus.PUBLISHED,
      categoryId: categories[0].id,
      authorId: admin.id,
      publishedAt: new Date(),
      coverImage: 'https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&w=1200&q=80',
    },
  });

  await prisma.articleTag.deleteMany({
    where: {
      articleId: article.id,
    },
  });

  await prisma.articleTag.createMany({
    data: [
      { articleId: article.id, tagId: tags[0].id },
      { articleId: article.id, tagId: tags[1].id },
    ],
    skipDuplicates: true,
  });

  console.log('Seed 完成');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
