import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import AdminLayout from '@/components/layout/AdminLayout';
import CLayout from '@/components/layout/CLayout';
import { AuthProvider } from '@/hooks/useAuth';
import { ThemeProvider } from '@/hooks/useTheme';
import Home from '@/pages/Home';
import AboutPage from '@/pages/About';
import ArticleDetailPage from '@/pages/ArticleDetail';
import LoginPage from '@/pages/Login';
import SearchPage from '@/pages/Search';
import TopicsPage from '@/pages/Topics';
import TopicDetailPage from '@/pages/TopicDetail';
import AdminCommentsPage from '@/pages/admin/Comments';
import AdminDashboardPage from '@/pages/admin/Dashboard';
import AdminPostsPage from '@/pages/admin/Posts';
import AdminPostEditorPage from '@/pages/admin/PostEditor';
import AdminSettingsPage from '@/pages/admin/Settings';
import AdminTopicsPage from '@/pages/admin/Topics';
import AdminTopicEditorPage from '@/pages/admin/TopicEditor';

function NotFoundPage() {
  return <Navigate to="/" replace />;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<CLayout />}>
              <Route index element={<Home />} />
              <Route path="/articles/:slug" element={<ArticleDetailPage />} />
              <Route path="/topics" element={<TopicsPage />} />
              <Route path="/topics/:slug" element={<TopicDetailPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/search" element={<SearchPage />} />
            </Route>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboardPage />} />
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
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
