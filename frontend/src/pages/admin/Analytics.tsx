import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import {
  getAnalyticsCategoryStats,
  getAnalyticsDevices,
  getAnalyticsEntryPages,
  getAnalyticsGeo,
  getAnalyticsOverview,
  getAnalyticsPublishTime,
  getAnalyticsSources,
  getAnalyticsTimeline,
  getAnalyticsTopArticles,
  getAnalyticsUtm,
  getAnalyticsVisitors,
  type AnalyticsRangeKey,
  type CategoryStat,
  type DeviceStat,
  type EntryPageStat,
  type GeoCountryStat,
  type OverviewResponse,
  type PublishTimeStat,
  type ReferrerStat,
  type TimelinePoint,
  type TopArticleStat,
  type UtmStat,
  type VisitorBreakdown,
} from '@/lib/analytics-api';
import { ApiError } from '@/lib/api';
import { formatNumber } from '@/lib/utils';

type TabKey = 'overview' | 'content' | 'sources' | 'geo' | 'devices' | 'time';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'overview', label: '总览' },
  { key: 'content', label: '内容' },
  { key: 'sources', label: '来源' },
  { key: 'geo', label: '地域' },
  { key: 'devices', label: '设备' },
  { key: 'time', label: '时间' },
];

const RANGES: { key: AnalyticsRangeKey; label: string }[] = [
  { key: 'today', label: '今天' },
  { key: '7d', label: '最近 7 天' },
  { key: '30d', label: '最近 30 天' },
  { key: '90d', label: '最近 90 天' },
];

const PIE_COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#06B6D4', '#8B5CF6', '#EC4899'];
const WEEKDAY_LABELS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

function formatPercent(value: number | null | undefined): string {
  if (value == null) return '—';
  return `${(value * 100).toFixed(1)}%`;
}

export default function AdminAnalyticsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [range, setRange] = useState<AnalyticsRangeKey>('30d');

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-[0.24em] text-subtle">Analytics</p>
          <h1 className="font-heading text-3xl font-bold text-foreground">访问数据看板</h1>
          <p className="text-sm text-muted">
            自建的隐私友好分析，覆盖读者、内容、来源和时间四类维度。数据每 5 分钟汇总一次。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {RANGES.map((r) => (
            <button
              className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
                range === r.key
                  ? 'bg-primary text-white'
                  : 'bg-surface-sunken text-muted hover:bg-border'
              }`}
              key={r.key}
              onClick={() => setRange(r.key)}
              type="button"
            >
              {r.label}
            </button>
          ))}
        </div>
      </header>

      <nav className="flex flex-wrap gap-2 border-b border-border pb-3">
        {TABS.map((t) => (
          <button
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              activeTab === t.key
                ? 'bg-foreground text-surface'
                : 'text-muted hover:bg-surface-sunken'
            }`}
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            type="button"
          >
            {t.label}
          </button>
        ))}
      </nav>

      {activeTab === 'overview' ? <OverviewTab range={range} /> : null}
      {activeTab === 'content' ? <ContentTab range={range} /> : null}
      {activeTab === 'sources' ? <SourcesTab range={range} /> : null}
      {activeTab === 'geo' ? <GeoTab range={range} /> : null}
      {activeTab === 'devices' ? <DevicesTab range={range} /> : null}
      {activeTab === 'time' ? <TimeTab range={range} /> : null}
    </div>
  );
}

// ===== 通用 hooks =====

function useAsync<T>(loader: () => Promise<T>, deps: unknown[]): { data: T | null; loading: boolean; error: string | null } {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    loader()
      .then((value) => {
        if (!cancelled) setData(value);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : '加载失败');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, loading, error };
}

function CardSkeleton() {
  return <Card className="h-32 animate-pulse" />;
}

function ErrorBlock({ message }: { message: string }) {
  return <Card className="border border-error/30 bg-error/5 text-error">{message}</Card>;
}

function EmptyBlock({ message }: { message: string }) {
  return (
    <Card className="flex h-48 items-center justify-center text-sm text-muted">
      {message}
    </Card>
  );
}

// ===== 总览 Tab =====

function OverviewTab({ range }: { range: AnalyticsRangeKey }) {
  const overview = useAsync<OverviewResponse>(
    () => getAnalyticsOverview({ range, compare: true }),
    [range],
  );
  const timeline = useAsync<TimelinePoint[]>(
    () => getAnalyticsTimeline({ range, granularity: 'day' }),
    [range],
  );

  if (overview.loading || timeline.loading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }
  if (overview.error) return <ErrorBlock message={overview.error} />;
  if (!overview.data) return <EmptyBlock message="暂无数据" />;

  const { current, previous, delta } = overview.data;
  const cards = [
    { label: 'PV 浏览量', value: current.pv, deltaText: delta?.pv ?? null, previous: previous?.pv ?? 0 },
    { label: 'UV 独立访客', value: current.uv, deltaText: delta?.uv ?? null, previous: previous?.uv ?? 0 },
    { label: '会话数', value: current.sessions, deltaText: delta?.sessions ?? null, previous: previous?.sessions ?? 0 },
    {
      label: '新访客',
      value: current.newVisitors,
      deltaText: delta?.newVisitors ?? null,
      previous: previous?.newVisitors ?? 0,
    },
  ];

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((c) => (
          <Card className="flex flex-col gap-4" key={c.label}>
            <p className="text-sm text-muted">{c.label}</p>
            <p className="font-heading text-3xl font-bold text-foreground">{formatNumber(c.value)}</p>
            <p className="text-xs text-subtle">
              对比上一周期 {formatNumber(c.previous)}
              {c.deltaText ? (
                <span
                  className={`ml-2 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                    c.deltaText.startsWith('+') || c.deltaText === '+∞%'
                      ? 'bg-success/10 text-success'
                      : 'bg-error/10 text-error'
                  }`}
                >
                  {c.deltaText}
                </span>
              ) : null}
            </p>
          </Card>
        ))}
      </section>

      <Card className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-lg font-bold text-foreground">每日趋势</h2>
          <div className="flex items-center gap-3 text-xs text-subtle">
            <span>跳出率 {formatPercent(current.bounceRate)}</span>
            <span>平均会话页数 {current.avgPagesPerSession?.toFixed(2) ?? '—'}</span>
          </div>
        </div>
        <div className="h-80 w-full">
          <ResponsiveContainer height="100%" width="100%">
            <LineChart data={timeline.data ?? []}>
              <CartesianGrid opacity={0.2} strokeDasharray="3 3" />
              <XAxis dataKey="bucket" stroke="#94a3b8" tick={{ fontSize: 12 }} />
              <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Line dataKey="pv" name="PV" stroke="#4F46E5" strokeWidth={2} type="monotone" />
              <Line dataKey="uv" name="UV" stroke="#10B981" strokeWidth={2} type="monotone" />
              <Line dataKey="sessions" name="Sessions" stroke="#F59E0B" strokeWidth={2} type="monotone" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}

// ===== 内容 Tab =====

function ContentTab({ range }: { range: AnalyticsRangeKey }) {
  const top = useAsync<TopArticleStat[]>(() => getAnalyticsTopArticles({ range, limit: 10 }), [range]);
  const cats = useAsync<CategoryStat[]>(() => getAnalyticsCategoryStats({ range, limit: 20 }), [range]);

  if (top.loading || cats.loading) return <Card className="h-64 animate-pulse" />;
  if (top.error) return <ErrorBlock message={top.error} />;

  return (
    <div className="space-y-6">
      <Card className="space-y-4">
        <h2 className="font-heading text-lg font-bold text-foreground">热门文章 Top 10</h2>
        {(top.data ?? []).length === 0 ? (
          <EmptyBlock message="区间内暂无文章访问数据" />
        ) : (
          <table className="min-w-full text-sm">
            <thead className="text-xs uppercase tracking-wider text-subtle">
              <tr className="border-b border-border">
                <th className="py-2 text-left">标题</th>
                <th className="py-2 text-right">PV</th>
                <th className="py-2 text-right">UV</th>
              </tr>
            </thead>
            <tbody>
              {(top.data ?? []).map((row) => (
                <tr className="border-b border-border/40" key={row.articleId}>
                  <td className="py-2 pr-4">
                    {row.article ? (
                      <Link className="text-foreground hover:text-primary" to={`/articles/${row.article.slug}`}>
                        {row.article.title}
                      </Link>
                    ) : (
                      <span className="text-muted">文章 {row.articleId}</span>
                    )}
                  </td>
                  <td className="py-2 text-right text-foreground">{formatNumber(row.pv)}</td>
                  <td className="py-2 text-right text-muted">{formatNumber(row.uv)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Card className="space-y-4">
        <h2 className="font-heading text-lg font-bold text-foreground">分类热度</h2>
        {(cats.data ?? []).length === 0 ? (
          <EmptyBlock message="暂无分类数据" />
        ) : (
          <div className="h-72 w-full">
            <ResponsiveContainer height="100%" width="100%">
              <BarChart
                data={(cats.data ?? []).map((c) => ({
                  name: c.category?.name ?? `分类 ${c.categoryId}`,
                  pv: c.pv,
                  uv: c.uv,
                }))}
              >
                <CartesianGrid opacity={0.2} strokeDasharray="3 3" />
                <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 12 }} />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="pv" fill="#4F46E5" name="PV" />
                <Bar dataKey="uv" fill="#10B981" name="UV" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>
    </div>
  );
}

// ===== 来源 Tab =====

function SourcesTab({ range }: { range: AnalyticsRangeKey }) {
  const sources = useAsync<ReferrerStat[]>(() => getAnalyticsSources({ range, limit: 20 }), [range]);
  const utm = useAsync<UtmStat[]>(() => getAnalyticsUtm({ range, limit: 20 }), [range]);
  const entry = useAsync<EntryPageStat[]>(() => getAnalyticsEntryPages({ range, limit: 10 }), [range]);

  if (sources.loading) return <Card className="h-64 animate-pulse" />;
  if (sources.error) return <ErrorBlock message={sources.error} />;

  const typeAgg = new Map<string, number>();
  for (const r of sources.data ?? []) {
    typeAgg.set(r.type, (typeAgg.get(r.type) ?? 0) + r.pv);
  }
  const pieData = Array.from(typeAgg.entries()).map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.2fr)]">
        <Card className="space-y-4">
          <h2 className="font-heading text-lg font-bold text-foreground">来源类型分布</h2>
          {pieData.length === 0 ? (
            <EmptyBlock message="暂无来源数据" />
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer height="100%" width="100%">
                <PieChart>
                  <Pie cx="50%" cy="50%" data={pieData} dataKey="value" label nameKey="name" outerRadius={80}>
                    {pieData.map((_, idx) => (
                      <Cell fill={PIE_COLORS[idx % PIE_COLORS.length]} key={idx} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        <Card className="space-y-4">
          <h2 className="font-heading text-lg font-bold text-foreground">Top 来源 host</h2>
          <table className="min-w-full text-sm">
            <thead className="text-xs uppercase tracking-wider text-subtle">
              <tr className="border-b border-border">
                <th className="py-2 text-left">Host</th>
                <th className="py-2 text-left">类型</th>
                <th className="py-2 text-right">PV</th>
                <th className="py-2 text-right">UV</th>
              </tr>
            </thead>
            <tbody>
              {(sources.data ?? []).map((r) => (
                <tr className="border-b border-border/40" key={r.host + r.type}>
                  <td className="py-2 pr-4 text-foreground">{r.host}</td>
                  <td className="py-2 pr-4">
                    <Badge variant="neutral">{r.type.toLowerCase()}</Badge>
                  </td>
                  <td className="py-2 text-right text-foreground">{formatNumber(r.pv)}</td>
                  <td className="py-2 text-right text-muted">{formatNumber(r.uv)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>

      <Card className="space-y-4">
        <h2 className="font-heading text-lg font-bold text-foreground">UTM 渠道</h2>
        {utm.loading ? (
          <div className="h-24 animate-pulse rounded bg-surface-sunken" />
        ) : (utm.data ?? []).length === 0 ? (
          <p className="text-sm text-muted">暂无 UTM 参数记录</p>
        ) : (
          <table className="min-w-full text-sm">
            <thead className="text-xs uppercase tracking-wider text-subtle">
              <tr className="border-b border-border">
                <th className="py-2 text-left">source</th>
                <th className="py-2 text-left">medium</th>
                <th className="py-2 text-left">campaign</th>
                <th className="py-2 text-right">PV</th>
                <th className="py-2 text-right">UV</th>
              </tr>
            </thead>
            <tbody>
              {(utm.data ?? []).map((r, i) => (
                <tr className="border-b border-border/40" key={i}>
                  <td className="py-2 pr-4 text-foreground">{r.source ?? '—'}</td>
                  <td className="py-2 pr-4 text-foreground">{r.medium ?? '—'}</td>
                  <td className="py-2 pr-4 text-foreground">{r.campaign ?? '—'}</td>
                  <td className="py-2 text-right text-foreground">{formatNumber(r.pv)}</td>
                  <td className="py-2 text-right text-muted">{formatNumber(r.uv)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Card className="space-y-4">
        <h2 className="font-heading text-lg font-bold text-foreground">入口页面 Top 10</h2>
        {entry.loading ? (
          <div className="h-24 animate-pulse rounded bg-surface-sunken" />
        ) : (entry.data ?? []).length === 0 ? (
          <EmptyBlock message="暂无入口页数据" />
        ) : (
          <table className="min-w-full text-sm">
            <thead className="text-xs uppercase tracking-wider text-subtle">
              <tr className="border-b border-border">
                <th className="py-2 text-left">路径</th>
                <th className="py-2 text-right">PV</th>
                <th className="py-2 text-right">UV</th>
              </tr>
            </thead>
            <tbody>
              {(entry.data ?? []).map((r) => (
                <tr className="border-b border-border/40" key={r.path}>
                  <td className="py-2 pr-4 font-mono text-xs text-foreground">{r.path}</td>
                  <td className="py-2 text-right text-foreground">{formatNumber(r.pv)}</td>
                  <td className="py-2 text-right text-muted">{formatNumber(r.uv)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}

// ===== 地域 Tab =====

function GeoTab({ range }: { range: AnalyticsRangeKey }) {
  const countries = useAsync<GeoCountryStat[]>(
    () => getAnalyticsGeo({ range, level: 'country', limit: 50 }) as Promise<GeoCountryStat[]>,
    [range],
  );
  const regions = useAsync(
    () => getAnalyticsGeo({ range, level: 'region', limit: 50 }),
    [range],
  );

  if (countries.loading) return <Card className="h-64 animate-pulse" />;
  if (countries.error) return <ErrorBlock message={countries.error} />;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Card className="space-y-4">
        <h2 className="font-heading text-lg font-bold text-foreground">国家 / 地区 Top 20</h2>
        {(countries.data ?? []).length === 0 ? (
          <EmptyBlock message="尚未启用地理解析（需安装 MaxMind GeoLite2）" />
        ) : (
          <table className="min-w-full text-sm">
            <thead className="text-xs uppercase tracking-wider text-subtle">
              <tr className="border-b border-border">
                <th className="py-2 text-left">国家</th>
                <th className="py-2 text-right">PV</th>
                <th className="py-2 text-right">UV</th>
              </tr>
            </thead>
            <tbody>
              {(countries.data ?? []).slice(0, 20).map((r) => (
                <tr className="border-b border-border/40" key={r.country}>
                  <td className="py-2 pr-4 text-foreground">{r.country}</td>
                  <td className="py-2 text-right text-foreground">{formatNumber(r.pv)}</td>
                  <td className="py-2 text-right text-muted">{formatNumber(r.uv)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Card className="space-y-4">
        <h2 className="font-heading text-lg font-bold text-foreground">省 / 州 Top 20</h2>
        {regions.loading ? (
          <div className="h-24 animate-pulse rounded bg-surface-sunken" />
        ) : (regions.data ?? []).length === 0 ? (
          <p className="text-sm text-muted">暂无省/州级数据</p>
        ) : (
          <table className="min-w-full text-sm">
            <thead className="text-xs uppercase tracking-wider text-subtle">
              <tr className="border-b border-border">
                <th className="py-2 text-left">区域</th>
                <th className="py-2 text-right">PV</th>
                <th className="py-2 text-right">UV</th>
              </tr>
            </thead>
            <tbody>
              {(regions.data ?? []).slice(0, 20).map((r, i) => (
                <tr className="border-b border-border/40" key={i}>
                  <td className="py-2 pr-4 text-foreground">
                    {r.country}
                    {'region' in r ? ` / ${r.region}` : ''}
                  </td>
                  <td className="py-2 text-right text-foreground">{formatNumber(r.pv)}</td>
                  <td className="py-2 text-right text-muted">{formatNumber(r.uv)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}

// ===== 设备 Tab =====

function DevicesTab({ range }: { range: AnalyticsRangeKey }) {
  const device = useAsync<DeviceStat[]>(() => getAnalyticsDevices({ range, dimension: 'device' }), [range]);
  const os = useAsync<DeviceStat[]>(() => getAnalyticsDevices({ range, dimension: 'os' }), [range]);
  const browser = useAsync<DeviceStat[]>(() => getAnalyticsDevices({ range, dimension: 'browser' }), [range]);
  const visitors = useAsync<VisitorBreakdown>(() => getAnalyticsVisitors({ range }), [range]);

  if (device.loading || os.loading || browser.loading) return <Card className="h-64 animate-pulse" />;

  const toPie = (rows: DeviceStat[] | null, key: keyof DeviceStat) =>
    (rows ?? []).map((r) => ({ name: String(r[key] ?? 'unknown'), value: r.pv }));

  return (
    <div className="space-y-6">
      <Card className="space-y-4">
        <h2 className="font-heading text-lg font-bold text-foreground">访客概况</h2>
        {visitors.loading ? (
          <div className="h-24 animate-pulse rounded bg-surface-sunken" />
        ) : visitors.data ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <Stat label="UV" value={formatNumber(visitors.data.uv)} />
            <Stat label="新访客" value={formatNumber(visitors.data.newVisitors)} hint={`占比 ${formatPercent(visitors.data.newRatio)}`} />
            <Stat label="回访" value={formatNumber(visitors.data.returningVisitors)} />
            <Stat label="会话数" value={formatNumber(visitors.data.sessions)} hint={`跳出率 ${formatPercent(visitors.data.bounceRate)}`} />
          </div>
        ) : null}
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <DeviceChart data={toPie(device.data, 'device')} title="设备类型" />
        <DeviceChart data={toPie(os.data, 'os')} title="操作系统" />
        <DeviceChart data={toPie(browser.data, 'browser')} title="浏览器" />
      </div>
    </div>
  );
}

function DeviceChart({ data, title }: { data: { name: string; value: number }[]; title: string }) {
  return (
    <Card className="space-y-4">
      <h3 className="text-sm font-bold text-foreground">{title}</h3>
      {data.length === 0 ? (
        <p className="text-sm text-muted">暂无数据</p>
      ) : (
        <div className="h-64">
          <ResponsiveContainer height="100%" width="100%">
            <PieChart>
              <Pie cx="50%" cy="50%" data={data} dataKey="value" label nameKey="name" outerRadius={70}>
                {data.map((_, idx) => (
                  <Cell fill={PIE_COLORS[idx % PIE_COLORS.length]} key={idx} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-lg bg-surface-sunken px-4 py-3">
      <p className="text-xs text-subtle">{label}</p>
      <p className="mt-1 font-heading text-2xl font-bold text-foreground">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
    </div>
  );
}

// ===== 时间 Tab =====

function TimeTab({ range }: { range: AnalyticsRangeKey }) {
  const timeline = useAsync<TimelinePoint[]>(() => getAnalyticsTimeline({ range, granularity: 'day' }), [range]);
  const publishTime = useAsync<PublishTimeStat[]>(() => getAnalyticsPublishTime({ range }), [range]);

  if (timeline.loading) return <Card className="h-64 animate-pulse" />;
  if (timeline.error) return <ErrorBlock message={timeline.error} />;

  // 构建 7x24 热力图：按周内每天 + 每小时统计 PV 总数
  // 由于 timeline 是日级，没有小时维度，作为 V1 占位：用发布时间维度表现
  const heatmap = Array.from({ length: 7 }, () => Array.from({ length: 24 }, () => 0));
  for (const p of publishTime.data ?? []) {
    const weekdayIdx = (p.publishedWeekday + 6) % 7; // JS Sunday=0 → 周日 index 6
    heatmap[weekdayIdx][p.publishedHour] += p.pv;
  }
  const maxHeat = heatmap.flat().reduce((m, v) => Math.max(m, v), 0) || 1;

  return (
    <div className="space-y-6">
      <Card className="space-y-4">
        <h2 className="font-heading text-lg font-bold text-foreground">每日 PV / UV 趋势</h2>
        <div className="h-80 w-full">
          <ResponsiveContainer height="100%" width="100%">
            <LineChart data={timeline.data ?? []}>
              <CartesianGrid opacity={0.2} strokeDasharray="3 3" />
              <XAxis dataKey="bucket" stroke="#94a3b8" tick={{ fontSize: 12 }} />
              <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Line dataKey="pv" name="PV" stroke="#4F46E5" strokeWidth={2} type="monotone" />
              <Line dataKey="uv" name="UV" stroke="#10B981" strokeWidth={2} type="monotone" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="space-y-4">
        <h2 className="font-heading text-lg font-bold text-foreground">发布时段 vs 流量</h2>
        <p className="text-xs text-muted">
          热力图展示每篇文章按发布时间落到 "周几 × 小时" 格子后的累计 PV；颜色越深表示该时段发布的文章后续流量越高，可用于指导选题 / 发布节奏。
        </p>
        <div className="overflow-x-auto">
          <table className="text-xs">
            <thead>
              <tr>
                <th className="sticky left-0 bg-surface px-2 py-1" />
                {Array.from({ length: 24 }, (_, h) => (
                  <th className="px-1 text-subtle" key={h}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {heatmap.map((row, wi) => (
                <tr key={wi}>
                  <td className="sticky left-0 bg-surface px-2 py-1 text-subtle">{WEEKDAY_LABELS[wi]}</td>
                  {row.map((cell, hi) => {
                    const intensity = cell / maxHeat;
                    return (
                      <td className="px-1 py-1" key={hi}>
                        <div
                          className="size-5 rounded"
                          style={{
                            backgroundColor: cell === 0 ? 'var(--color-surface-sunken)' : `rgba(79, 70, 229, ${0.15 + intensity * 0.75})`,
                          }}
                          title={`${WEEKDAY_LABELS[wi]} ${hi}:00 · 累计 ${cell} PV`}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
