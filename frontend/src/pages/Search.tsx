import { Search } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import Card from '@/components/ui/Card';

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') ?? '';

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 md:px-8 lg:px-16 lg:py-16">
      <div className="space-y-6">
        <div className="space-y-3">
          <p className="text-xs font-medium uppercase tracking-[0.24em] text-subtle">Search</p>
          <h1 className="text-3xl font-heading font-bold text-foreground md:text-4xl">搜索文章</h1>
          <p className="text-base leading-relaxed text-muted">
            当前关键词：{query ? `“${query}”` : '尚未输入关键词'}。
          </p>
        </div>

        <Card className="space-y-4">
          <div className="flex items-center gap-3 text-foreground">
            <Search className="size-5" />
            <h2 className="text-lg font-semibold">输入一个标题、标签或正文关键词开始探索</h2>
          </div>
          <p className="text-sm leading-relaxed text-muted">
            热门技术主题、户外手记和装备记录都会逐步汇总到这里。
          </p>
        </Card>
      </div>
    </div>
  );
}
