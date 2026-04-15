import Card from '@/components/ui/Card';

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 md:px-8 lg:px-16 lg:py-16">
      <div className="space-y-8">
        <div className="space-y-3">
          <p className="text-xs font-medium uppercase tracking-[0.24em] text-subtle">About</p>
          <h1 className="text-3xl font-heading font-bold text-foreground md:text-4xl">The Kinetic Naturalist</h1>
          <p className="max-w-2xl text-base leading-relaxed text-muted">
            在代码和山野之间来回穿梭，记录那些值得反复回看的现场经验。
          </p>
        </div>

        <Card className="space-y-4">
          <h2 className="text-xl font-heading font-bold text-foreground">ZoraGK</h2>
          <p className="text-base leading-relaxed text-muted">
            程序员、户外爱好者、长期写作者。技术和山野，都是理解世界的方式。
          </p>
        </Card>
      </div>
    </div>
  );
}
