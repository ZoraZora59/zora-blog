import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import CLayout from '@/components/layout/CLayout';
import { ThemeProvider } from '@/hooks/useTheme';
import Home from '@/pages/Home';
import ArticleDetailPage from '@/pages/ArticleDetail';
import AboutPage from '@/pages/About';
import SearchPage from '@/pages/Search';
import TopicsPage from '@/pages/Topics';

function NotFoundPage() {
  return <Navigate to="/" replace />;
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<CLayout />}>
            <Route index element={<Home />} />
            <Route path="/articles/:slug" element={<ArticleDetailPage />} />
            <Route path="/topics" element={<TopicsPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/search" element={<SearchPage />} />
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}
