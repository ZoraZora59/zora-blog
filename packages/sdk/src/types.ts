// ============ 通用包装 ============
export interface ApiEnvelope<T = unknown> {
  code: number;
  data: T;
  message: string;
}

export interface PaginationMeta {
  limit: number;
  offset: number;
  total: number;
}

export interface Paginated<T> {
  items: T[];
  pagination: PaginationMeta;
}

// ============ 认证 ============
export interface Admin {
  id: number;
  username: string;
  displayName: string;
  avatar: string | null;
  bio: string | null;
  role: string | null;
  apiKeyPrefix: string | null;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  admin: Admin;
}

export interface ApiKeyResponse {
  apiKey: string;
  prefix: string;
}

// ============ 文章 ============
export type ArticleStatus = "draft" | "published";

export interface ArticleTagRef {
  id: number;
  name: string;
  slug: string;
}

export interface ArticleCategoryRef {
  id: number;
  name: string;
  slug: string;
  description: string | null;
}

export interface ArticleAuthorRef {
  id: number;
  username: string;
  displayName: string;
  avatar: string | null;
  role: string | null;
}

export interface Article {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  coverImage: string | null;
  status: ArticleStatus;
  viewCount: number;
  likeCount: number;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  category: ArticleCategoryRef;
  tags: ArticleTagRef[];
  author: ArticleAuthorRef;
  topicIds: number[];
}

export interface ArticleInput {
  title?: string;
  content?: string;
  excerpt?: string | null;
  coverImage?: string | null;
  status?: ArticleStatus;
  slug?: string;
  categoryId?: number;
  tagIds?: number[];
  tags?: string[];
  topicIds?: number[];
}

export interface ArticleListQuery {
  status?: ArticleStatus | "all";
  sort?: "title" | "createdAt" | "publishedAt" | "updatedAt" | "viewCount";
  order?: "asc" | "desc";
  limit?: number;
  offset?: number;
  search?: string;
}

// ============ 分类 ============
export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  articleCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryInput {
  name: string;
  slug?: string;
  description?: string | null;
}

// ============ 标签 ============
export interface Tag {
  id: number;
  name: string;
  slug: string;
  articleCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface TagInput {
  name: string;
  slug?: string;
}

export interface TagMergeResult {
  sourceId: number;
  targetId: number;
  migratedCount: number;
}

// ============ 专题 ============
export interface Topic {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  coverImage: string | null;
  articleCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface TopicInput {
  title?: string;
  slug?: string;
  description?: string | null;
  coverImage?: string | null;
  articleIds?: number[];
}

// ============ 评论 ============
export type CommentStatus = "pending" | "approved" | "rejected";

export interface Comment {
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

export interface CommentStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

export interface CommentListQuery {
  status?: CommentStatus | "all";
  articleId?: number;
  limit?: number;
  offset?: number;
  search?: string;
}

export interface CommentListResponse extends Paginated<Comment> {
  stats: CommentStats;
  articles: Array<{ id: number; title: string; slug: string }>;
}

// ============ 上传 ============
export interface UploadResult {
  key: string;
  filename: string;
  url: string;
}
