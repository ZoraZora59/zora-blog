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
  articleCount?: number;
}

export interface Tag {
  id: number;
  name: string;
  slug: string;
  articleCount?: number;
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
  topicIds: number[];
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

export interface AdminProfile {
  id: number;
  username: string;
  displayName: string;
  avatar: string | null;
  bio: string | null;
  role: string | null;
  apiKeyPrefix?: string | null;
}

export interface SiteSettings {
  siteTitle: string;
  siteDescription: string | null;
  logo: string | null;
  commentModerationEnabled: boolean;
}

export interface SitePublicInfo {
  site: SiteSettings;
  admin: Pick<AdminProfile, 'id' | 'username' | 'displayName' | 'avatar' | 'bio' | 'role'> | null;
}

export interface AdminSettingsResponse {
  site: SiteSettings;
  admin: AdminProfile | null;
}

export interface DashboardStats {
  totals: {
    articles: number;
    published: number;
    drafts: number;
    views: number;
    likes: number;
    comments: number;
    approvedComments: number;
    pendingComments: number;
  };
  weeklyGrowth: {
    articles: number;
    views: number;
    comments: number;
  };
  lastPublished: {
    id: number;
    title: string;
    slug: string;
    excerpt: string | null;
    coverImage: string | null;
    publishedAt: string | null;
    viewCount: number;
    likeCount: number;
    category: Pick<Category, 'id' | 'name' | 'slug'>;
  } | null;
  topArticles: Array<{
    id: number;
    title: string;
    slug: string;
    viewCount: number;
    likeCount: number;
    publishedAt: string | null;
  }>;
  recentComments: Array<{
    id: number;
    nickname: string;
    content: string;
    status: 'pending' | 'approved' | 'rejected';
    createdAt: string;
    article: {
      id: number;
      title: string;
      slug: string;
    };
  }>;
}

export interface AdminArticleListParams {
  status?: 'all' | 'draft' | 'published';
  sort?: string;
  order?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
  search?: string;
}

export interface AdminArticleStats {
  total: number;
  published: number;
  drafts: number;
  totalViews: number;
}

export interface AdminArticleListResult {
  items: ArticleSummary[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
  };
}

export interface ArticleMutationInput {
  title?: string;
  content?: string;
  excerpt?: string | null;
  coverImage?: string | null;
  status?: 'draft' | 'published';
  slug?: string;
  categoryId?: number;
  tagIds?: number[];
  tags?: string[];
  topicIds?: number[];
}

export interface TopicSummary {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  coverImage: string | null;
  articleCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface TopicArticle {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  coverImage: string | null;
  publishedAt: string | null;
  viewCount: number;
  category: {
    id: number;
    name: string;
    slug: string;
  };
}

export interface TopicDetail extends TopicSummary {
  articles: TopicArticle[];
}

export interface TopicMutationInput {
  title?: string;
  slug?: string;
  description?: string | null;
  coverImage?: string | null;
  articleIds?: number[];
}

export type CommentStatus = 'pending' | 'approved' | 'rejected';

export interface PublicComment {
  id: number;
  nickname: string;
  emailHash: string;
  content: string;
  createdAt: string;
}

export interface PublicCommentListResult {
  items: PublicComment[];
  total: number;
}

export interface CommentSubmitInput {
  nickname: string;
  email: string;
  content: string;
}

export interface CommentSubmitResult {
  status: CommentStatus;
  comment: PublicComment | null;
}

export interface AdminComment {
  id: number;
  nickname: string;
  email: string;
  emailHash: string;
  content: string;
  status: CommentStatus;
  createdAt: string;
  updatedAt: string;
  article: {
    id: number;
    title: string;
    slug: string;
  };
}

export interface AdminCommentListParams {
  status?: 'all' | CommentStatus;
  articleId?: number;
  limit?: number;
  offset?: number;
  search?: string;
}

export interface AdminCommentStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

export interface AdminCommentArticleRef {
  id: number;
  title: string;
  slug: string;
}

export interface AdminCommentListResult {
  items: AdminComment[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
  };
  stats: AdminCommentStats;
  articles: AdminCommentArticleRef[];
}

export type CommentModerateAction = 'approve' | 'reject';

export interface ApiKeyPayload {
  apiKey: string;
  prefix: string;
}

export interface UploadResult {
  filename: string;
  url: string;
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

type PrimitiveValue = string | number | boolean | undefined;
type QueryParams = Record<string, PrimitiveValue> | ArticleListParams | AdminArticleListParams;

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

function requestJson<T>(
  path: string,
  method: 'POST' | 'PUT' | 'DELETE',
  body?: unknown,
) {
  return request<T>(path, {
    method,
    headers: body === undefined || body === null ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined || body === null ? undefined : JSON.stringify(body),
  });
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

// ---- C 端接口 ----
export function listArticles(params: ArticleListParams = {}) {
  return request<ArticleListResult>('/articles', undefined, params);
}

export function getArticle(slug: string) {
  return request<ArticleDetail>(`/articles/${slug}`);
}

export function listArticleComments(slug: string) {
  return request<PublicCommentListResult>(`/articles/${slug}/comments`);
}

export function submitArticleComment(slug: string, input: CommentSubmitInput) {
  return requestJson<CommentSubmitResult>(`/articles/${slug}/comments`, 'POST', input);
}

export function getCategories() {
  return request<Category[]>('/categories');
}

export function getTags() {
  return request<Tag[]>('/tags');
}

export function getSiteInfo() {
  return request<SitePublicInfo>('/site');
}

// ---- 认证接口 ----
export function login(username: string, password: string) {
  return requestJson<{ admin: AdminProfile }>('/auth/login', 'POST', { username, password });
}

export function logout() {
  return requestJson<null>('/auth/logout', 'POST');
}

export function generateApiKey() {
  return requestJson<ApiKeyPayload>('/auth/token', 'POST');
}

export function revokeApiKey() {
  return requestJson<null>('/auth/token', 'DELETE');
}

// ---- B 端接口 ----
export function getAdminSettings() {
  return request<AdminSettingsResponse>('/admin/settings');
}

export function updateAdminSiteSettings(input: Partial<SiteSettings>) {
  return requestJson<SiteSettings>('/admin/settings', 'PUT', input);
}

export function updateAdminProfile(input: {
  displayName?: string;
  avatar?: string | null;
  bio?: string | null;
  role?: string | null;
}) {
  return requestJson<AdminProfile>('/admin/profile', 'PUT', input);
}

export function getDashboard() {
  return request<DashboardStats>('/admin/dashboard');
}

export function listAdminArticles(params: AdminArticleListParams = {}) {
  return request<AdminArticleListResult>('/admin/articles', undefined, params);
}

export function getAdminArticleStats() {
  return request<AdminArticleStats>('/admin/articles/stats');
}

export function getAdminArticle(id: number) {
  return request<ArticleSummary>(`/admin/articles/${id}`);
}

export function createAdminArticle(input: ArticleMutationInput) {
  return requestJson<ArticleSummary>('/admin/articles', 'POST', input);
}

export function updateAdminArticle(id: number, input: ArticleMutationInput) {
  return requestJson<ArticleSummary>(`/admin/articles/${id}`, 'PUT', input);
}

export function deleteAdminArticle(id: number) {
  return requestJson<null>(`/admin/articles/${id}`, 'DELETE');
}

export function listAdminCategories() {
  return request<Category[]>('/admin/categories');
}

export function listAdminTags() {
  return request<Tag[]>('/admin/tags');
}

export function listAdminTopics() {
  return request<TopicSummary[]>('/admin/topics');
}

export function getAdminTopic(id: number) {
  return request<TopicDetail>(`/admin/topics/${id}`);
}

export function createAdminTopic(input: TopicMutationInput) {
  return requestJson<TopicDetail>('/admin/topics', 'POST', input);
}

export function updateAdminTopic(id: number, input: TopicMutationInput) {
  return requestJson<TopicDetail>(`/admin/topics/${id}`, 'PUT', input);
}

export function deleteAdminTopic(id: number) {
  return requestJson<null>(`/admin/topics/${id}`, 'DELETE');
}

// ---- C 端专题接口 ----
export function listTopics() {
  return request<TopicSummary[]>('/topics');
}

export function getTopic(slug: string) {
  return request<TopicDetail>(`/topics/${slug}`);
}

export function listAdminComments(params: AdminCommentListParams = {}) {
  return request<AdminCommentListResult>('/admin/comments', undefined, params);
}

export function moderateComment(id: number, action: CommentModerateAction) {
  return requestJson<AdminComment>(`/admin/comments/${id}`, 'PUT', { action });
}

export function batchModerateComments(ids: number[], action: CommentModerateAction) {
  return requestJson<{ count: number }>('/admin/comments/batch', 'PUT', { ids, action });
}

export function deleteAdminComment(id: number) {
  return requestJson<null>(`/admin/comments/${id}`, 'DELETE');
}

export async function uploadImage(file: File) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(buildUrl('/admin/upload'), {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });

  let payload: ApiResponse<UploadResult> | null = null;
  try {
    payload = (await response.json()) as ApiResponse<UploadResult>;
  } catch {
    throw new ApiError('服务端返回了不可解析的响应', response.status || 500);
  }

  if (!response.ok) {
    throw new ApiError(payload.message || '上传失败', payload.code || response.status || 500);
  }

  return payload.data;
}
