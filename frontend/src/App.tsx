import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import CLayout from '@/components/layout/CLayout';
import { AuthProvider } from '@/hooks/useAuth';
import { ConfirmProvider } from '@/hooks/useConfirm';
import { ThemeProvider } from '@/hooks/useTheme';
import { ToastProvider } from '@/hooks/useToast';
import Home from '@/pages/Home';

// 访客侧次级页面按路由懒加载，首屏只下载 Home
const AboutPage = lazy(() => import('@/pages/About'));
const ArticleDetailPage = lazy(() => import('@/pages/ArticleDetail'));
const SearchPage = lazy(() => import('@/pages/Search'));
const TopicsPage = lazy(() => import('@/pages/Topics'));
const TopicDetailPage = lazy(() => import('@/pages/TopicDetail'));

// 登录 + 整块 admin 按需加载，避免访客下载后台代码
const LoginPage = lazy(() => import('@/pages/Login'));
const AdminLayout = lazy(() => import('@/components/layout/AdminLayout'));
const AdminAnalyticsPage = lazy(() => import('@/pages/admin/Analytics'));
const AdminCommentsPage = lazy(() => import('@/pages/admin/Comments'));
const AdminDashboardPage = lazy(() => import('@/pages/admin/Dashboard'));
const AdminPostsPage = lazy(() => import('@/pages/admin/Posts'));
const AdminPostEditorPage = lazy(() => import('@/pages/admin/PostEditor'));
const AdminSettingsPage = lazy(() => import('@/pages/admin/Settings'));
const AdminTopicsPage = lazy(() => import('@/pages/admin/Topics'));
const AdminTopicEditorPage = lazy(() => import('@/pages/admin/TopicEditor'));

function NotFoundPage() {
  return <Navigate to="/" replace />;
}

function RouteFallback() {
  return null;
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <ConfirmProvider>
          <BrowserRouter>
            <Suspense fallback={<RouteFallback />}>
              <Routes>
                <Route element={<CLayout />}>
                  <Route index element={<Home />} />
                  <Route path="/articles/:slug" element={<ArticleDetailPage />} />
                  <Route path="/topics" element={<TopicsPage />} />
                  <Route path="/topics/:slug" element={<TopicDetailPage />} />
                  <Route path="/about" element={<AboutPage />} />
                  <Route path="/search" element={<SearchPage />} />
                </Route>
                <Route
                  path="/login"
                  element={(
                    <AuthProvider>
                      <LoginPage />
                    </AuthProvider>
                  )}
                />
                <Route
                  path="/admin"
                  element={(
                    <AuthProvider>
                      <AdminLayout />
                    </AuthProvider>
                  )}
                >
                  <Route index element={<AdminDashboardPage />} />
                  <Route path="analytics" element={<AdminAnalyticsPage />} />
                  <Route path="posts" element={<AdminPostsPage />} />
                  <Route path="posts/new" element={<AdminPostEditorPage />} />
                  <Route path="posts/:id/edit" element={<AdminPostEditorPage />} />
                  <Route path="comments" element={<AdminCommentsPage />} />
                  <Route path="topics" element={<AdminTopicsPage />} />
                  <Route path="topics/new" element={<AdminTopicEditorPage />} />
                  <Route path="topics/:id/edit" element={<AdminTopicEditorPage />} />
                  <Route path="settings" element={<AdminSettingsPage />} />
                </Route>
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </ConfirmProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
