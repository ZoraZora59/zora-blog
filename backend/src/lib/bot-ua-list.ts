// 常见 bot / crawler / scraper UA 关键词（小写匹配）
// 命中后写入 page_views 时 isBot=true，聚合任务会过滤掉
const BOT_KEYWORDS = [
  'bot',
  'spider',
  'crawler',
  'crawl',
  'scrape',
  'fetch',
  'curl',
  'wget',
  'httpie',
  'python-requests',
  'go-http-client',
  'node-fetch',
  'axios',
  'okhttp',
  'java/',
  'headless',
  'phantom',
  'puppeteer',
  'playwright',
  'lighthouse',
  'pagespeed',
  'preview',
  'monitor',
  'pingdom',
  'uptimerobot',
  'feedly',
  'rss',
  'archive.org',
  'facebookexternalhit',
  'whatsapp',
  'telegram',
  'slackbot',
  'twitterbot',
  'linkedinbot',
  'discordbot',
  'embedly',
  'bingpreview',
  'applebot',
  'yandex',
  'baiduspider',
  'sogou',
  'sm-tubebot',
];

export function isBotUserAgent(userAgent: string | undefined | null): boolean {
  if (!userAgent) return true;
  const lower = userAgent.toLowerCase();
  return BOT_KEYWORDS.some((keyword) => lower.includes(keyword));
}
