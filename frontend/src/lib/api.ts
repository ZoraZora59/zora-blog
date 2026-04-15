const DEFAULT_API_BASE_URL = 'http://localhost:3001/api';

export class ApiError extends Error {
  readonly code: number;

  constructor(message: string, code = 500) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
  }
}

export interface ApiResponse<T> {
  code: number;
  data: T;
  message: string;
}

export interface Author {
  id: number;
  username: string;
  displayName: string;
  avatar: string | null;
  role: string | null;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
}

export interface Tag {
  id: number;
  name: string;
  slug: string;
}

export interface ArticleSummary {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  coverImage: string | null;
  status: 'draft' | 'published';
  viewCount: number;
  likeCount: number;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  category: Category;
  tags: Tag[];
  author: Author;
}

export interface AdjacentArticle {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  coverImage: string | null;
  publishedAt: string | null;
  category: Category;
}

export interface ArticleDetail extends ArticleSummary {
  previousArticle?: AdjacentArticle | null;
  nextArticle?: AdjacentArticle | null;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ArticleListResult {
  items: ArticleSummary[];
  pagination: Pagination;
}

export interface ArticleListParams {
  category?: string;
  tag?: string;
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

function getApiBaseUrl() {
  const configured = import.meta.env.VITE_API_BASE_URL?.trim();
  return (configured || DEFAULT_API_BASE_URL).replace(/\/$/, '');
}

export const API_BASE_URL = getApiBaseUrl();
export const API_ORIGIN = (() => {
  try {
    return new URL(API_BASE_URL).origin;
  } catch {
    return 'http://localhost:3001';
  }
})();

type QueryParams = Record<string, string | number | undefined> | ArticleListParams;

function buildUrl(path: string, params?: QueryParams) {
  const url = new URL(`${API_BASE_URL}${path}`);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === '') {
        return;
      }
      url.searchParams.set(key, String(value));
    });
  }

  return url.toString();
}

async function request<T>(path: string, init?: RequestInit, params?: QueryParams) {
  const response = await fetch(buildUrl(path, params), {
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  let payload: ApiResponse<T> | null = null;

  try {
    payload = (await response.json()) as ApiResponse<T>;
  } catch {
    throw new ApiError('服务端返回了不可解析的响应', response.status || 500);
  }

  if (!response.ok) {
    throw new ApiError(payload.message || '请求失败', payload.code || response.status || 500);
  }

  return payload.data;
}

export function resolveMediaUrl(value?: string | null) {
  if (!value) {
    return '';
  }

  if (/^https?:\/\//.test(value)) {
    return value;
  }

  return new URL(value, `${API_ORIGIN}/`).toString();
}

export function listArticles(params: ArticleListParams = {}) {
  return request<ArticleListResult>('/articles', undefined, params);
}

export function getArticle(slug: string) {
  return request<ArticleDetail>(`/articles/${slug}`);
}

export function getCategories() {
  return request<Category[]>('/categories');
}
