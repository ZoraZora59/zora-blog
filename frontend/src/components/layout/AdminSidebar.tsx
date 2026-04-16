import {
  ChevronLeft,
  FileText,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Settings,
  Sparkles,
} from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { resolveMediaUrl } from '@/lib/api';
import { cn } from '@/lib/utils';

// B 端侧边栏：Dashboard / Posts / Comments / Topics / Settings
const navItems = [
  { label: 'Dashboard', to: '/admin', icon: LayoutDashboard, end: true },
  { label: '文章管理', to: '/admin/posts', icon: FileText },
  { label: '评论管理', to: '/admin/comments', icon: MessageSquare },
  { label: '专题管理', to: '/admin/topics', icon: Sparkles, disabled: true },
  { label: '系统设置', to: '/admin/settings', icon: Settings },
];

export default function AdminSidebar() {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-border/60 bg-surface-raised lg:flex">
      <div className="flex items-center gap-3 px-6 py-6">
        <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-white font-heading font-bold">
          Z
        </div>
        <div>
          <p className="font-heading text-base font-bold text-foreground">Zora 管理台</p>
          <p className="text-xs text-subtle">程序员猫奴露营博客</p>
        </div>
      </div>

      <div className="mx-4 mb-4 flex items-center gap-3 rounded-xl bg-surface-sunken px-4 py-3">
        {admin?.avatar ? (
          <img
            alt={admin.displayName}
            className="size-10 rounded-full object-cover"
            referrerPolicy="no-referrer"
            src={resolveMediaUrl(admin.avatar)}
          />
        ) : (
          <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary font-heading font-semibold">
            {admin?.displayName.slice(0, 1) ?? 'A'}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">{admin?.displayName ?? '管理员'}</p>
          <p className="truncate text-xs text-muted">{admin?.role ?? '博客博主'}</p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3">
        {navItems.map((item) => {
          const Icon = item.icon;

          if (item.disabled) {
            return (
              <span
                className="flex cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2 text-sm text-subtle"
                key={item.to}
                title="即将上线"
              >
                <Icon className="size-4" />
                <span className="flex-1">{item.label}</span>
                <span className="rounded-full bg-surface-sunken px-2 py-0.5 text-[10px] uppercase tracking-wide text-subtle">
                  Soon
                </span>
              </span>
            );
          }

          return (
            <NavLink
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150',
                  isActive
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-muted hover:bg-surface-sunken hover:text-foreground',
                )
              }
              end={item.end}
              key={item.to}
              to={item.to}
            >
              <Icon className="size-4" />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-2 border-t border-border/60 px-3 py-4 text-sm">
        <NavLink
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted transition-colors duration-150 hover:bg-surface-sunken hover:text-foreground"
          to="/"
        >
          <ChevronLeft className="size-4" />
          返回 C 端首页
        </NavLink>
        <button
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-left text-muted transition-colors duration-150 hover:bg-error/10 hover:text-error"
          onClick={handleLogout}
          type="button"
        >
          <LogOut className="size-4" />
          退出登录
        </button>
      </div>
    </aside>
  );
}
