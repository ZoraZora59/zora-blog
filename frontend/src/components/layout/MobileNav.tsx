import { Compass, Home, Search } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';

const items = [
  { label: 'Home', to: '/', icon: Home },
  { label: 'Topics', to: '/topics', icon: Compass },
  { label: 'Search', to: '/search', icon: Search },
];

export default function MobileNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-white/95 backdrop-blur-md dark:bg-surface/95 lg:hidden">
      <div className="grid h-16 grid-cols-3">
        {items.map(({ icon: Icon, label, to }) => (
          <NavLink
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center justify-center gap-1 text-xs font-medium transition-colors duration-150',
                isActive ? 'text-primary' : 'text-muted',
              )
            }
            key={to}
            to={to}
          >
            <Icon className="size-5" />
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
