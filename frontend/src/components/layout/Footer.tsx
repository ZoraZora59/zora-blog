import { ExternalLink, Github, Instagram, Linkedin, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSiteInfo } from '@/hooks/useSiteInfo';

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
      <div className="mx-auto max-w-7xl px-4 py-12 md:px-8 lg:px-16 lg:py-16">
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
      </div>
    </footer>
  );
}
