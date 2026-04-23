import { ArrowUpRight, Github, Mail } from 'lucide-react';
import MarkdownArticle from '@/components/markdown/MarkdownArticle';
import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import { useSiteInfo } from '@/hooks/useSiteInfo';
import { useTheme } from '@/hooks/useTheme';
import { resolveMediaUrl } from '@/lib/api';

export default function AboutPage() {
  const { siteInfo, isLoading, error } = useSiteInfo();
  const { resolvedTheme } = useTheme();

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 md:px-8 lg:py-16">
        <div className="space-y-6">
          <div className="h-4 w-24 animate-pulse rounded-full bg-surface-raised" />
          <div className="h-10 w-2/3 animate-pulse rounded-xl bg-surface-raised" />
          <div className="h-80 animate-pulse rounded-xl bg-surface-raised" />
          <div className="h-64 animate-pulse rounded-xl bg-surface-raised" />
        </div>
      </div>
    );
  }

  if (error || !siteInfo) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 md:px-8 lg:py-16">
        <Card className="space-y-3">
          <p className="text-xs font-medium uppercase tracking-[0.24em] text-subtle">About</p>
          <h1 className="text-3xl font-heading font-bold text-foreground md:text-4xl">关于页暂时不可用</h1>
          <p className="text-sm leading-relaxed text-muted">{error || '站点信息加载失败。'}</p>
        </Card>
      </div>
    );
  }

  const { site, admin } = siteInfo;
  const socialLinks = [
    site.githubUrl
      ? { label: 'GitHub', href: site.githubUrl, icon: Github }
      : null,
    site.email
      ? { label: '邮箱', href: `mailto:${site.email}`, icon: Mail }
      : null,
  ].filter((item): item is NonNullable<typeof item> => item !== null);
  const displayName = admin?.displayName || 'ZoraGK';
  const role = admin?.role || '独立写作者';
  const slogan = site.slogan || site.siteDescription || '在代码和山野之间来回穿梭。';
  const aboutContent =
    site.aboutContent ||
    admin?.bio ||
    '这里会持续记录技术实践、户外路线、装备体验，以及那些值得复盘的现场经验。';

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 md:px-8 lg:py-16">
      <div className="space-y-10">
        <section className="space-y-6">
          <p className="text-xs font-medium uppercase tracking-[0.24em] text-subtle">About</p>
          <div className="grid gap-6 rounded-xl bg-surface-raised p-6 shadow-sm md:grid-cols-[120px_minmax(0,1fr)] md:items-center">
            <img
              alt={displayName}
              className="size-28 rounded-full object-cover shadow-sm"
              referrerPolicy="no-referrer"
              src={resolveMediaUrl(admin?.avatar) || undefined}
            />
            <div className="space-y-4">
              <div className="space-y-2">
                <h1 className="text-3xl font-heading font-bold text-foreground md:text-4xl">
                  {displayName}
                </h1>
                <p className="text-sm font-medium uppercase tracking-[0.2em] text-subtle">{role}</p>
                <p className="max-w-2xl text-base leading-relaxed text-muted">{slogan}</p>
              </div>

              {socialLinks.length > 0 ? (
                <div className="flex flex-wrap gap-3">
                  {socialLinks.map(({ href, icon: Icon, label }) => (
                    <a
                      className="inline-flex items-center gap-2 rounded-full bg-surface-sunken px-4 py-2 text-sm font-medium text-foreground transition-colors duration-150 hover:bg-border"
                      href={href}
                      key={label}
                      rel={href.startsWith('mailto:') ? undefined : 'noreferrer'}
                      target={href.startsWith('mailto:') ? undefined : '_blank'}
                    >
                      <Icon className="size-4" />
                      {label}
                      {!href.startsWith('mailto:') ? <ArrowUpRight className="size-3.5" /> : null}
                    </a>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-subtle">Profile</p>
            <h2 className="text-2xl font-heading font-bold text-foreground">长期写，长期做，长期在现场</h2>
          </div>
          <div className="space-y-6 rounded-xl bg-surface-raised p-6 shadow-sm">
            <MarkdownArticle content={aboutContent} theme={resolvedTheme} />
          </div>
        </section>

        <section className="space-y-4">
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-subtle">Focus</p>
            <h2 className="text-2xl font-heading font-bold text-foreground">技术栈与兴趣领域</h2>
          </div>
          <div className="flex flex-wrap gap-3">
            {(site.skills.length > 0 ? site.skills : ['TypeScript', 'React', 'Node.js']).map((skill) => (
              <Badge className="px-4 py-2 text-sm" key={skill} variant="tech">
                {skill}
              </Badge>
            ))}
          </div>
        </section>

        {site.email ? (
          <section className="rounded-xl bg-primary px-6 py-6 text-white shadow-md">
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-white/65">Contact</p>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1">
                <h2 className="text-2xl font-heading font-bold">保持联系</h2>
                <p className="text-sm text-white/80">{site.email}</p>
              </div>
              <a
                className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-medium text-primary transition-colors duration-150 hover:bg-white/90"
                href={`mailto:${site.email}`}
              >
                <Mail className="size-4" />
                发邮件
              </a>
            </div>
          </section>
        ) : null}

        <section className="space-y-3 rounded-xl bg-surface-sunken px-6 py-5 text-sm leading-relaxed text-muted">
          <p className="text-xs font-medium uppercase tracking-[0.24em] text-subtle">Privacy</p>
          <h2 className="text-base font-medium text-foreground">关于流量统计</h2>
          <p>
            为了了解读者偏好与改进选题，本站会自建轻量的访问统计。我们的隐私承诺：
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>不投放任何 cookie，访客标识使用浏览器 localStorage 中的随机 UUID。</li>
            <li>IP 地址仅做哈希后存储，原始 IP 立即丢弃；地理信息使用 MaxMind GeoLite2 离线数据库解析。</li>
            <li>不接入任何第三方分析 SDK，所有数据仅存储在本站自有服务器。</li>
            <li>尊重浏览器 <code>Do Not Track</code> 信号，启用时不上报任何数据。</li>
            <li>不采集表单内容、键盘输入、鼠标点击坐标或任何可识别个人身份的信息。</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
