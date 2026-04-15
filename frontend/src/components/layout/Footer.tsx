import { ExternalLink, Github, Instagram, Linkedin, Rss } from 'lucide-react';
import Card from '@/components/ui/Card';

const footerLinks = [
  {
    label: 'GitHub',
    href: 'https://github.com/',
    icon: Github,
  },
  {
    label: 'LinkedIn',
    href: 'https://www.linkedin.com/',
    icon: Linkedin,
  },
  {
    label: 'Instagram',
    href: 'https://www.instagram.com/',
    icon: Instagram,
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-border/60 bg-surface">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 md:px-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] lg:px-16 lg:py-16">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="space-y-4 md:col-span-2">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-subtle">
              THE ACTIVE DEV
            </p>
            <div className="space-y-3">
              <h2 className="text-2xl font-heading font-bold text-foreground">
                Developer by day, adventurer by night.
              </h2>
              <p className="max-w-md text-sm leading-relaxed text-muted">
                技术实践、户外手记与装备体验，会持续在这里更新。
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-subtle">Explore</p>
            <ul className="space-y-3 text-sm text-muted">
              <li><a className="transition-colors duration-150 hover:text-foreground" href="/">Latest Dispatch</a></li>
              <li><a className="transition-colors duration-150 hover:text-foreground" href="/topics">Topics</a></li>
              <li><a className="transition-colors duration-150 hover:text-foreground" href="/about">About</a></li>
            </ul>
          </div>

          <div className="space-y-4">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-subtle">Connect</p>
            <ul className="space-y-3 text-sm text-muted">
              {footerLinks.map(({ href, icon: Icon, label }) => (
                <li key={label}>
                  <a
                    className="inline-flex items-center gap-2 transition-colors duration-150 hover:text-foreground"
                    href={href}
                    rel="noreferrer"
                    target="_blank"
                  >
                    <Icon className="size-4" />
                    {label}
                    <ExternalLink className="size-3.5" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <Card className="space-y-5 bg-primary p-8 text-white shadow-md">
          <div className="space-y-3">
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-white/65">
              JOIN THE EXPEDITION
            </p>
            <h3 className="text-2xl font-heading font-bold">Sync your outdoor stack.</h3>
            <p className="text-sm leading-relaxed text-white/75">
              新文章、装备更新和实地记录会直接出现在订阅源里。
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <a
              className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-2.5 text-sm font-medium text-primary transition-colors duration-150 hover:bg-white/90"
              href="/feed.xml"
            >
              <Rss className="size-4" />
              订阅 RSS
            </a>
            <a
              className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/10 px-6 py-2.5 text-sm font-medium text-white transition-colors duration-150 hover:bg-white/15"
              href="mailto:hello@theactivedev.blog"
            >
              联系作者
            </a>
          </div>
        </Card>
      </div>
    </footer>
  );
}
