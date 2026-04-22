// 回填分析聚合表
//
// 用法：
//   npx tsx backend/scripts/rebuild-analytics.ts --from=2026-04-01 --to=2026-04-22
//   不指定时默认从最早 page_view 到现在

import { prisma } from '../src/lib/prisma.js';
import { runAllAggregations } from '../src/jobs/analytics-aggregator.js';

function parseArg(name: string): string | undefined {
  const prefix = `--${name}=`;
  const found = process.argv.find((a) => a.startsWith(prefix));
  return found ? found.slice(prefix.length) : undefined;
}

function parseDate(value: string | undefined, fallback: () => Date): Date {
  if (!value) return fallback();
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    throw new Error(`无效日期: ${value}`);
  }
  return d;
}

async function main() {
  const fromArg = parseArg('from');
  const toArg = parseArg('to');

  const earliest = await prisma.pageView.findFirst({ orderBy: { createdAt: 'asc' }, select: { createdAt: true } });
  const from = parseDate(fromArg, () => earliest?.createdAt ?? new Date());
  const to = parseDate(toArg, () => new Date());

  console.warn(`[rebuild] 区间: ${from.toISOString()} → ${to.toISOString()}`);

  await runAllAggregations({ from, to });

  console.warn('[rebuild] 完成');
  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
