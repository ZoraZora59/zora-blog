import { Menu, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import AdminSidebar from '@/components/layout/AdminSidebar';
import ThemeToggle from '@/components/ui/ThemeToggle';
import { useAuth } from '@/hooks/useAuth';

export default function AdminLayout() {
  const { isAuthenticated, isChecking } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  // 路由切换时自动关闭移动端抽屉
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  if (isChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface text-muted">
        正在校验登录态…
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return (
    <div className="flex min-h-screen bg-surface text-foreground">
      <AdminSidebar />

      {mobileOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full w-72 bg-surface-raised shadow-xl">
            <AdminSidebar />
          </div>
        </div>
      ) : null}

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="flex items-center justify-between gap-3 border-b border-border/60 bg-surface-raised px-4 py-3 lg:hidden">
          <button
            aria-label="展开菜单"
            className="rounded-full p-2 text-muted hover:bg-surface-sunken hover:text-foreground"
            onClick={() => setMobileOpen((prev) => !prev)}
            type="button"
          >
            {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
          <p className="font-heading font-bold text-foreground">Zora 管理台</p>
          <ThemeToggle />
        </header>

        <main className="flex-1 overflow-y-auto px-4 py-6 md:px-8 lg:px-10 lg:py-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
