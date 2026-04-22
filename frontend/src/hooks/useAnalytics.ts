import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageView } from '@/lib/analytics';

// 监听 React Router 路径变化，每次进入新页面发一条 PV 事件。
// 在 CLayout 顶层挂一次即可（C 端访问才上报，B 端 path 自动跳过）。
export function useAnalytics() {
  const location = useLocation();

  useEffect(() => {
    trackPageView({ path: location.pathname + location.search });
  }, [location.pathname, location.search]);
}
