import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import { useTopics } from '@/hooks/useTopics';
import { resolveMediaUrl } from '@/lib/api';

export default function TopicsPage() {
  const { topics, isLoading, error } = useTopics();

  return (
    <div className="bg-surface">
      <section className="border-b border-border/60 bg-surface">
        <div className="mx-auto max-w-5xl px-4 py-12 md:px-8 lg:px-16 lg:py-16">
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
            initial={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            <Badge className="w-fit" variant="category">
              Topics
            </Badge>
            <h1 className="text-3xl font-heading font-bold text-foreground md:text-4xl">
              挑一个主题继续深入
            </h1>
            <p className="max-w-2xl text-base leading-relaxed text-muted">
              从工程现场到户外装备，把长期观察整理成更完整的专题阅读路径。
            </p>
          </motion.div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-10 md:px-8 lg:px-16 lg:py-16">
        {error ? (
          <Card className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">专题暂时不可用</h2>
            <p className="text-sm text-muted">{error}</p>
          </Card>
        ) : null}

        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2">
            <div className="h-[280px] animate-pulse rounded-xl bg-surface-raised" />
            <div className="h-[280px] animate-pulse rounded-xl bg-surface-raised" />
          </div>
        ) : null}

        {!isLoading && topics.length > 0 ? (
          <motion.div
            animate={{ opacity: 1 }}
            className="grid gap-6 md:grid-cols-2"
            initial={{ opacity: 0 }}
            transition={{ staggerChildren: 0.08 }}
          >
            {topics.map((topic) => (
              <motion.div
                animate={{ opacity: 1, y: 0 }}
                initial={{ opacity: 0, y: 16 }}
                key={topic.id}
                transition={{ duration: 0.3, ease: 'easeOut' }}
              >
                <Link
                  className="group block overflow-hidden rounded-xl bg-surface-raised shadow-sm transition-all duration-200 hover:shadow-md"
                  to={`/topics/${topic.slug}`}
                >
                  {topic.coverImage ? (
                    <div className="aspect-[21/9] overflow-hidden">
                      <img
                        alt={topic.title}
                        className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                        referrerPolicy="no-referrer"
                        src={resolveMediaUrl(topic.coverImage)}
                      />
                    </div>
                  ) : null}
                  <div className="p-6">
                    <div className="mb-3 flex items-center gap-3">
                      <h2 className="text-lg font-semibold text-foreground group-hover:text-primary">
                        {topic.title}
                      </h2>
                      <span className="rounded-full bg-surface-sunken px-2.5 py-1 text-xs font-medium text-subtle">
                        {topic.articleCount} 篇
                      </span>
                    </div>
                    {topic.description ? (
                      <p className="text-sm leading-relaxed text-muted">{topic.description}</p>
                    ) : null}
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        ) : null}

        {!isLoading && topics.length === 0 && !error ? (
          <Card className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">还没有专题</h2>
            <p className="text-sm text-muted">暂时没有可展示的专题内容。</p>
          </Card>
        ) : null}
      </section>
    </div>
  );
}