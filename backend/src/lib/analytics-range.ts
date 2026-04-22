// 分析查询通用时间范围解析
//
// range 取值：today | 7d | 30d | 90d | custom
// custom 必须配合 from/to (YYYY-MM-DD)

export interface AnalyticsRange {
  from: Date;
  to: Date;
  // 紧邻的上一周期，用于同比
  previousFrom: Date;
  previousTo: Date;
  // 标识本范围的天数
  days: number;
}

// 所有边界使用 UTC 0 点对齐，避免 PG DATE 类型与本地时区混合时被截断
function utcStartOfDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function parseDateOnly(value: string | undefined): Date | null {
  if (!value) return null;
  const m = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

export function parseAnalyticsRange(query: {
  range?: string;
  from?: string;
  to?: string;
}): AnalyticsRange {
  const today = utcStartOfDay(new Date());
  // exclusive end: 明天 UTC 00:00
  const tomorrow = new Date(today.getTime() + 24 * 3600_000);

  let from: Date;
  let to: Date = tomorrow;

  switch (query.range ?? '7d') {
    case 'today':
      from = today;
      break;
    case '7d':
      from = new Date(today.getTime() - 6 * 24 * 3600_000); // 含今天共 7 天
      break;
    case '30d':
      from = new Date(today.getTime() - 29 * 24 * 3600_000);
      break;
    case '90d':
      from = new Date(today.getTime() - 89 * 24 * 3600_000);
      break;
    case 'custom': {
      const f = parseDateOnly(query.from);
      const t = parseDateOnly(query.to);
      if (!f || !t) {
        throw new Error('range=custom 必须提供 from 和 to (YYYY-MM-DD)');
      }
      from = f;
      to = new Date(t.getTime() + 24 * 3600_000); // exclusive
      break;
    }
    default:
      throw new Error(`未知 range: ${query.range}`);
  }

  const days = Math.max(1, Math.round((to.getTime() - from.getTime()) / (24 * 3600_000)));
  const previousTo = from;
  const previousFrom = new Date(from.getTime() - days * 24 * 3600_000);

  return { from, to, previousFrom, previousTo, days };
}

export function formatDelta(current: number, previous: number): string {
  if (previous === 0) return current === 0 ? '0%' : '+∞%';
  const pct = ((current - previous) / previous) * 100;
  const sign = pct >= 0 ? '+' : '';
  return `${sign}${pct.toFixed(1)}%`;
}
