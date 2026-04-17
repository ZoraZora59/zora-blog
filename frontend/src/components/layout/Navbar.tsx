import { Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import Button from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import ThemeToggle from '@/components/ui/ThemeToggle';
import { useSiteInfo } from '@/hooks/useSiteInfo';
import { resolveMediaUrl } from '@/lib/api';
import { cn } from '@/lib/utils';

const navItems = [
  { label: 'Home', to: '/' },
  { label: 'Topics', to: '/topics' },
  { label: 'About', to: '/about' },
];

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { siteInfo } = useSiteInfo();
  const [query, setQuery] = useState(searchParams.get('q') ?? '');
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    setQuery(searchParams.get('q') ?? '');
  }, [searchParams]);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  const isSearchPage = useMemo(() => location.pathname === '/search', [location.pathname]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const normalized = query.trim();
      const current = (searchParams.get('q') ?? '').trim();

      if (normalized === current) {
        return;
      }

      if (!normalized) {
        if (isSearchPage) {
          navigate('/search', { replace: true });
        }
        return;
      }

      navigate(`/search?q=${encodeURIComponent(normalized)}`, { replace: true });
    }, 300);

    return () => {
      window.clearTimeout(timer);
    };
  }, [isSearchPage, navigate, query, searchParams]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = query.trim();
    navigate(trimmed ? `/search?q=${encodeURIComponent(trimmed)}` : '/search');
  };

  const siteTitle = siteInfo?.site.siteTitle || 'Zora Blog';
  const logoUrl = resolveMediaUrl(siteInfo?.site.logo);

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 border-b border-transparent transition-all duration-200',
        scrolled
          ? 'bg-white/80 shadow-lg backdrop-blur-md dark:bg-surface/80'
          : 'bg-surface/95 dark:bg-surface/95',
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 md:px-8 lg:px-16">
        <div className="flex items-center gap-6">
          <Link className="flex items-center gap-3 text-lg font-heading font-bold text-foreground" to="/">
            {logoUrl ? (
              <img
                alt={siteTitle}
                className="size-9 rounded-lg object-cover"
                referrerPolicy="no-referrer"
                src={logoUrl}
              />
            ) : (
              <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-sm text-white">
                {siteTitle.slice(0, 1)}
              </span>
            )}
            <span>{siteTitle}</span>
          </Link>

          <nav className="hidden items-center gap-5 lg:flex">
            {navItems.map((item) => (
              <NavLink
                className={({ isActive }) =>
                  cn(
                    'text-sm font-medium transition-colors duration-150 hover:text-foreground',
                    isActive ? 'text-foreground' : 'text-muted',
                  )
                }
                key={item.to}
                to={item.to}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <form className="hidden items-center lg:flex" onSubmit={handleSubmit}>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subtle" />
              <Input
                className="w-64 border-transparent bg-surface-raised pl-10 shadow-sm"
                onChange={(event) => setQuery(event.target.value)}
                placeholder={isSearchPage ? '继续搜索文章' : '搜索标题或关键词'}
                value={query}
              />
            </div>
          </form>

          <Button
            aria-label="打开搜索页"
            className="lg:hidden"
            onClick={() => navigate('/search')}
            variant="icon"
          >
            <Search className="size-5" />
          </Button>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
