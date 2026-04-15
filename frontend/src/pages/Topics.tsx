import Card from '@/components/ui/Card';

export default function TopicsPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 md:px-8 lg:px-16 lg:py-16">
      <div className="space-y-8">
        <div className="space-y-3">
          <p className="text-xs font-medium uppercase tracking-[0.24em] text-subtle">Topics</p>
          <h1 className="text-3xl font-heading font-bold text-foreground md:text-4xl">挑一个主题继续深入</h1>
          <p className="max-w-2xl text-base leading-relaxed text-muted">
            从工程现场到户外装备，把长期观察整理成更完整的专题阅读路径。
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">Tech Field Notes</h2>
            <p className="text-sm leading-relaxed text-muted">
              工程调试、前端架构、系统设计与交付记录。
            </p>
          </Card>
          <Card className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">Outdoor Journal</h2>
            <p className="text-sm leading-relaxed text-muted">
              装备评测、营地观察、徒步路线与生活随笔。
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
