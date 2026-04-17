import { ExternalLink, Github, Instagram, Linkedin, Mail, Rss } from 'lucide-react';
import { Link } from 'react-router-dom';
import Card from '@/components/ui/Card';
import { useSiteInfo } from '@/hooks/useSiteInfo';
import { RSS_FEED_URL } from '@/lib/api';

export default function Footer() {
  const { siteInfo } = useSiteInfo();
  const site = siteInfo?.site;
  const footerLinks = [
    site?.githubUrl
      ? {
          label: 'GitHub',
          href: site.githubUrl,
          icon: Github,
        }
      : null,
    site?.linkedinUrl
      ? {
          label: 'LinkedIn',
          href: site.linkedinUrl,
          icon: Linkedin,
        }
      : null,
    site?.instagramUrl
      ? {
          label: 'Instagram',
          href: site.instagramUrl,
          icon: Instagram,
        }
      : null,
    site?.email
      ? {
          label: '邮箱',
          href: `mailto:${site.email}`,
          icon: Mail,
        }
      : null,
  ].filter((item): item is NonNullable<typeof item> => item !== null);

  return (
    <footer className="border-t border-border/60 bg-surface">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 md:px-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] lg:px-16 lg:py-16">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="space-y-4 md:col-span-2">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-subtle">
              {site?.siteTitle || 'Zora Blog'}
            </p>
            <div className="space-y-3">
              <h2 className="text-2xl font-heading font-bold text-foreground">
                {site?.slogan || 'Developer by day, adventurer by night.'}
              </h2>
              <p className="max-w-md text-sm leading-relaxed text-muted">
                {site?.siteDescription || '技术实践、户外手记与装备体验，会持续在这里更新。'}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-subtle">Explore</p>
            <ul className="space-y-3 text-sm text-muted">
              <li><Link className="transition-colors duration-150 hover:text-foreground" to="/">Latest Dispatch</Link></li>
              <li><Link className="transition-colors duration-150 hover:text-foreground" to="/topics">Topics</Link></li>
              <li><Link className="transition-colors duration-150 hover:text-foreground" to="/about">About</Link></li>
            </ul>
          </div>

          <div className="space-y-4">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-subtle">Connect</p>
            <ul className="space-y-3 text-sm text-muted">
              {footerLinks.length > 0 ? (
                footerLinks.map(({ href, icon: Icon, label }) => (
                  <li key={label}>
                    <a
                      className="inline-flex items-center gap-2 transition-colors duration-150 hover:text-foreground"
                      href={href}
                      rel={href.startsWith('mailto:') ? undefined : 'noreferrer'}
                      target={href.startsWith('mailto:') ? undefined : '_blank'}
                    >
                      <Icon className="size-4" />
                      {label}
                      {!href.startsWith('mailto:') ? <ExternalLink className="size-3.5" /> : null}
                    </a>
                  </li>
                ))
              ) : (
                <li className="text-sm text-subtle">社交链接会在后台设置中补充。</li>
              )}
            </ul>
          </div>
        </div>

        <Card className="space-y-5 bg-primary p-8 text-white shadow-md">
          <div className="space-y-3">
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-white/65">
              RSS SUBSCRIPTION
            </p>
            <h3 className="text-2xl font-heading font-bold">订阅最新更新</h3>
            <p className="text-sm leading-relaxed text-white/75">
              新文章、装备更新和实地记录会直接出现在订阅源里。
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <a
              className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-2.5 text-sm font-medium text-primary transition-colors duration-150 hover:bg-white/90"
              href={RSS_FEED_URL}
              rel="noreferrer"
              target="_blank"
            >
              <Rss className="size-4" />
              订阅 RSS
            </a>
            {site?.email ? (
              <a
                className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/10 px-6 py-2.5 text-sm font-medium text-white transition-colors duration-150 hover:bg-white/15"
                href={`mailto:${site.email}`}
              >
                联系作者
              </a>
            ) : null}
          </div>
        </Card>
      </div>
    </footer>
  );
}
