import { useEffect, useState } from 'react';
import { ApiError, getSiteInfo, type SitePublicInfo } from '@/lib/api';

interface SiteInfoState {
  siteInfo: SitePublicInfo | null;
  isLoading: boolean;
  error: string | null;
}

export function useSiteInfo() {
  const [state, setState] = useState<SiteInfoState>({
    siteInfo: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;

    setState({
      siteInfo: null,
      isLoading: true,
      error: null,
    });

    getSiteInfo()
      .then((siteInfo) => {
        if (cancelled) {
          return;
        }

        setState({
          siteInfo,
          isLoading: false,
          error: null,
        });
      })
      .catch((error: unknown) => {
        if (cancelled) {
          return;
        }

        setState({
          siteInfo: null,
          isLoading: false,
          error: error instanceof ApiError ? error.message : '站点信息加载失败',
        });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
