import { motion } from 'motion/react';
import { useEffect, useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import Button from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import ThemeToggle from '@/components/ui/ThemeToggle';
import { useAuth } from '@/hooks/useAuth';
import { ApiError } from '@/lib/api';

interface LocationState {
  from?: string;
}

export default function Login() {
  const { isAuthenticated, isChecking, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as LocationState | null)?.from ?? '/admin';

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isChecking && isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [from, isAuthenticated, isChecking, navigate]);

  if (!isChecking && isAuthenticated) {
    return <Navigate to={from} replace />;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) {
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      await login(username.trim(), password);
      navigate(from, { replace: true });
    } catch (err) {
      const message = err instanceof ApiError ? err.message : '登录失败，请稍后重试';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid min-h-screen grid-cols-1 bg-surface lg:grid-cols-2">
      <motion.section
        animate={{ opacity: 1, x: 0 }}
        className="relative hidden overflow-hidden bg-gradient-to-br from-primary via-primary to-secondary text-white lg:flex lg:flex-col lg:justify-between"
        initial={{ opacity: 0, x: -24 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        <div className="relative z-10 flex flex-col gap-6 p-12">
          <span className="w-fit rounded-full bg-white/15 px-4 py-1 text-xs font-medium uppercase tracking-[0.24em]">
            Zora Admin
          </span>
          <h1 className="max-w-md font-heading text-4xl font-bold leading-tight">
            把一天的山野与代码，写进自己的博客。
          </h1>
          <p className="max-w-md text-sm text-white/80">
            管理你的文章、专题和读者反馈——一次登录，多端可用。
          </p>
        </div>
        <div className="relative z-10 flex items-center justify-between p-12 text-sm text-white/80">
          <span>© {new Date().getFullYear()} Zora Blog</span>
          <Link className="underline-offset-4 hover:underline" to="/">
            返回博客首页
          </Link>
        </div>
      </motion.section>

      <section className="flex items-center justify-center px-6 py-12 lg:px-16">
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md space-y-8"
          initial={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
        >
          <div className="flex items-center justify-between">
            <Link className="font-heading text-lg font-bold text-foreground" to="/">
              Zora Blog
            </Link>
            <ThemeToggle />
          </div>

          <div className="space-y-3">
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-subtle">Welcome back</p>
            <h2 className="font-heading text-3xl font-bold text-foreground">登录到管理后台</h2>
            <p className="text-sm text-muted">使用你的用户名和密码继续编辑文章、管理评论。</p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="username">
                用户名
              </label>
              <Input
                autoComplete="username"
                autoFocus
                id="username"
                onChange={(event) => setUsername(event.target.value)}
                placeholder="admin"
                required
                value={username}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="password">
                密码
              </label>
              <Input
                autoComplete="current-password"
                id="password"
                onChange={(event) => setPassword(event.target.value)}
                placeholder="请输入密码"
                required
                type="password"
                value={password}
              />
            </div>

            {error ? (
              <div className="rounded-lg border border-error/30 bg-error/5 px-4 py-3 text-sm text-error">
                {error}
              </div>
            ) : null}

            <Button className="w-full" disabled={submitting} size="lg" type="submit">
              {submitting ? '登录中…' : '登录'}
            </Button>
          </form>

          <p className="text-xs text-subtle">
            登录即代表你已阅读并同意 Zora Blog 的管理员使用条款。
          </p>
        </motion.div>
      </section>
    </div>
  );
}
