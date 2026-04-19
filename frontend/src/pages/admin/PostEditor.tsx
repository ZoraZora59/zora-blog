import {
  ArrowLeft,
  Eye,
  ImagePlus,
  Loader2,
  Save,
  Send,
  Trash2,
  Youtube,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import MarkdownArticle from '@/components/markdown/MarkdownArticle';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { Input, Textarea } from '@/components/ui/Input';
import { useConfirm } from '@/hooks/useConfirm';
import { useTheme } from '@/hooks/useTheme';
import { useToast } from '@/hooks/useToast';
import {
  ApiError,
  createAdminArticle,
  deleteAdminArticle,
  getAdminArticle,
  listAdminCategories,
  listAdminTags,
  listAdminTopics,
  resolveMediaUrl,
  updateAdminArticle,
  uploadImage,
  type ArticleMutationInput,
  type ArticleSummary,
  type Category,
  type Tag,
  type TopicSummary,
} from '@/lib/api';
import { cn, formatDate } from '@/lib/utils';

// 编辑器草稿状态：仅用于组件内部表单，不直接提交
interface EditorDraft {
  title: string;
  content: string;
  excerpt: string;
  slug: string;
  coverImage: string;
  categoryId: number | null;
  status: 'draft' | 'published';
  tagsInput: string;
  topicIds: number[];
}

const EMPTY_DRAFT: EditorDraft = {
  title: '',
  content: '',
  excerpt: '',
  slug: '',
  coverImage: '',
  categoryId: null,
  status: 'draft',
  tagsInput: '',
  topicIds: [],
};

const AUTOSAVE_DELAY_MS = 30_000;

function draftFromArticle(article: ArticleSummary): EditorDraft {
  return {
    title: article.title,
    content: article.content,
    excerpt: article.excerpt ?? '',
    slug: article.slug,
    coverImage: article.coverImage ?? '',
    categoryId: article.category.id,
    status: article.status,
    tagsInput: article.tags.map((tag) => tag.name).join(', '),
    topicIds: article.topicIds ?? [],
  };
}

function parseTags(value: string) {
  return value
    .split(/[,，\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function buildMutationInput(draft: EditorDraft, overrides?: Partial<ArticleMutationInput>): ArticleMutationInput {
  return {
    title: draft.title.trim(),
    content: draft.content,
    excerpt: draft.excerpt.trim() || null,
    slug: draft.slug.trim() || undefined,
    coverImage: draft.coverImage.trim() || null,
    categoryId: draft.categoryId ?? undefined,
    tags: parseTags(draft.tagsInput),
    topicIds: draft.topicIds,
    status: draft.status,
    ...overrides,
  };
}

export default function PostEditor() {
  const params = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const { resolvedTheme } = useTheme();
  const toast = useToast();
  const confirm = useConfirm();

  const articleId = useMemo(() => {
    if (!params.id) {
      return null;
    }
    const parsed = Number(params.id);
    return Number.isFinite(parsed) ? parsed : null;
  }, [params.id]);

  const isEdit = articleId !== null;

  const [draft, setDraft] = useState<EditorDraft>(EMPTY_DRAFT);
  const [baseline, setBaseline] = useState<EditorDraft>(EMPTY_DRAFT);
  const [loadedArticle, setLoadedArticle] = useState<ArticleSummary | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [topics, setTopics] = useState<TopicSummary[]>([]);
  const [isLoading, setIsLoading] = useState(isEdit);
  const [isSaving, setIsSaving] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const currentIdRef = useRef<number | null>(articleId);
  const draftRef = useRef<EditorDraft>(EMPTY_DRAFT);
  const baselineRef = useRef<EditorDraft>(EMPTY_DRAFT);

  useEffect(() => {
    draftRef.current = draft;
  }, [draft]);

  useEffect(() => {
    baselineRef.current = baseline;
  }, [baseline]);

  useEffect(() => {
    let cancelled = false;

    Promise.all([listAdminCategories(), listAdminTags(), listAdminTopics()])
      .then(([categoryList, tagList, topicList]) => {
        if (cancelled) {
          return;
        }
        setCategories(categoryList);
        setTags(tagList);
        setTopics(topicList);
        setDraft((prev) => {
          if (prev.categoryId !== null) {
            return prev;
          }
          const firstCategoryId = categoryList[0]?.id ?? null;
          if (firstCategoryId === null) {
            return prev;
          }
          const next = { ...prev, categoryId: firstCategoryId };
          setBaseline((current) =>
            current.categoryId === null ? { ...current, categoryId: firstCategoryId } : current,
          );
          return next;
        });
      })
      .catch((err: unknown) => {
        if (cancelled) {
          return;
        }
        const message = err instanceof ApiError ? err.message : '元数据加载失败';
        setError(message);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isEdit || articleId === null) {
      currentIdRef.current = null;
      setDraft(EMPTY_DRAFT);
      setBaseline(EMPTY_DRAFT);
      setLoadedArticle(null);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    currentIdRef.current = articleId;
    setIsLoading(true);

    getAdminArticle(articleId)
      .then((article) => {
        if (cancelled) {
          return;
        }
        const next = draftFromArticle(article);
        setDraft(next);
        setBaseline(next);
        setLoadedArticle(article);
        setError(null);
        setLastSavedAt(new Date(article.updatedAt));
      })
      .catch((err: unknown) => {
        if (cancelled) {
          return;
        }
        const message = err instanceof ApiError ? err.message : '文章加载失败';
        setError(message);
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [articleId, isEdit]);

  const isDirty = useMemo(() => {
    return JSON.stringify(draft) !== JSON.stringify(baseline);
  }, [baseline, draft]);

  // 保存主入口：既服务于手动保存/发布，也服务于 30s 自动保存
  const performSave = useCallback(
    async (
      options: { silent?: boolean; overrides?: Partial<ArticleMutationInput> } = {},
    ): Promise<ArticleSummary | null> => {
      const currentDraft = draftRef.current;
      if (!currentDraft.title.trim()) {
        if (!options.silent) {
          setError('标题不能为空');
        }
        return null;
      }

      const payload = buildMutationInput(currentDraft, options.overrides);

      if (options.silent) {
        setIsAutoSaving(true);
      } else {
        setIsSaving(true);
      }

      try {
        const activeId = currentIdRef.current;
        const result = activeId
          ? await updateAdminArticle(activeId, payload)
          : await createAdminArticle(payload);

        const nextDraft = draftFromArticle(result);
        setDraft(nextDraft);
        setBaseline(nextDraft);
        setLoadedArticle(result);
        setLastSavedAt(new Date(result.updatedAt));
        setError(null);

        if (!activeId) {
          currentIdRef.current = result.id;
          navigate(`/admin/posts/${result.id}/edit`, { replace: true });
        }

        return result;
      } catch (err) {
        const message = err instanceof ApiError ? err.message : '保存失败';
        setError(message);
        return null;
      } finally {
        if (options.silent) {
          setIsAutoSaving(false);
        } else {
          setIsSaving(false);
        }
      }
    },
    [navigate],
  );

  // 30 秒自动保存：仅在有改动 + 标题不为空时触发
  useEffect(() => {
    if (!isDirty) {
      return;
    }
    if (!draft.title.trim()) {
      return;
    }

    const timer = window.setTimeout(() => {
      void performSave({ silent: true });
    }, AUTOSAVE_DELAY_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, [draft, isDirty, performSave]);

  // 离开前提示未保存
  useEffect(() => {
    const handler = (event: BeforeUnloadEvent) => {
      if (!isDirty) {
        return;
      }
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  const handleChange = <Key extends keyof EditorDraft>(key: Key, value: EditorDraft[Key]) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const handleSaveDraft = async () => {
    await performSave({ overrides: { status: 'draft' } });
    setDraft((prev) => ({ ...prev, status: 'draft' }));
  };

  const handlePublish = async () => {
    const saved = await performSave({ overrides: { status: 'published' } });
    if (saved) {
      setDraft((prev) => ({ ...prev, status: 'published' }));
    }
  };

  const handlePreview = () => {
    if (!loadedArticle) {
      toast.warning('请先保存草稿后再预览');
      return;
    }
    window.open(`/articles/${loadedArticle.slug}`, '_blank', 'noreferrer');
  };

  const handleDelete = async () => {
    if (!articleId) {
      return;
    }
    const confirmed = await confirm({
      title: '删除文章',
      description: '确定删除这篇文章？该操作不可撤销。',
      confirmText: '删除',
      tone: 'danger',
    });
    if (!confirmed) {
      return;
    }
    try {
      await deleteAdminArticle(articleId);
      toast.success('文章已删除');
      navigate('/admin/posts', { replace: true });
    } catch (err) {
      const message = err instanceof ApiError ? err.message : '删除失败';
      toast.error(message);
    }
  };

  const handleCoverUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setUploading(true);
    try {
      const result = await uploadImage(file);
      setDraft((prev) => ({ ...prev, coverImage: result.url }));
    } catch (err) {
      const message = err instanceof ApiError ? err.message : '上传失败';
      toast.error(message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleInsertEmbed = (type: 'youtube' | 'bilibili') => {
    const placeholder = type === 'youtube' ? 'VIDEO_ID' : 'BV1xx41xxXxX';
    const snippet = `\n\n::${type}[${placeholder}]\n\n`;
    setDraft((prev) => ({ ...prev, content: `${prev.content}${snippet}` }));
  };

  const selectedCategory = useMemo(
    () => categories.find((item) => item.id === draft.categoryId) ?? null,
    [categories, draft.categoryId],
  );

  const autoSaveLabel = useMemo(() => {
    if (isAutoSaving) {
      return '自动保存中…';
    }
    if (lastSavedAt) {
      return `上次保存 ${formatDate(lastSavedAt)} ${lastSavedAt.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`;
    }
    return '尚未保存';
  }, [isAutoSaving, lastSavedAt]);

  if (isEdit && isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-60 animate-pulse rounded-full bg-surface-raised" />
        <div className="h-[60vh] animate-pulse rounded-xl bg-surface-raised" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-3">
          <Link
            className="inline-flex w-fit items-center gap-2 text-sm font-medium text-muted hover:text-foreground"
            to="/admin/posts"
          >
            <ArrowLeft className="size-4" />
            返回文章管理
          </Link>
          <div className="flex items-center gap-3">
            <Badge variant={draft.status === 'published' ? 'published' : 'draft'}>
              {draft.status === 'published' ? '已发布' : '草稿'}
            </Badge>
            <p className="text-xs text-subtle">
              {isEdit ? `文章 #${articleId}` : '新文章'} · {autoSaveLabel}
              {isDirty ? ' · 有未保存更改' : ''}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={handlePreview} variant="ghost">
            <Eye className="size-4" />
            预览
          </Button>
          <Button disabled={isSaving} onClick={() => void handleSaveDraft()} variant="secondary">
            {isSaving && draft.status === 'draft' ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            保存草稿
          </Button>
          <Button disabled={isSaving} onClick={() => void handlePublish()}>
            {isSaving && draft.status === 'published' ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            {draft.status === 'published' ? '更新发布' : '立即发布'}
          </Button>
          {isEdit ? (
            <Button onClick={() => void handleDelete()} variant="danger">
              <Trash2 className="size-4" />
              删除
            </Button>
          ) : null}
        </div>
      </header>

      {error ? (
        <div className="rounded-lg border border-error/30 bg-error/5 px-4 py-3 text-sm text-error">
          {error}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-5">
          <Card className="space-y-4">
            <input
              aria-label="文章标题"
              className="w-full border-0 bg-transparent p-0 font-heading text-3xl font-bold leading-tight text-foreground outline-none placeholder:text-subtle focus:outline-none md:text-4xl"
              onChange={(event) => handleChange('title', event.target.value)}
              placeholder="在这里写下吸引人的标题…"
              value={draft.title}
            />
            <div className="flex flex-wrap items-center gap-2 text-xs text-subtle">
              <button
                className="inline-flex items-center gap-1 rounded-full bg-surface-sunken px-3 py-1 font-medium text-muted transition-colors duration-150 hover:text-foreground"
                onClick={() => handleInsertEmbed('youtube')}
                type="button"
              >
                <Youtube className="size-3.5" />
                插入 YouTube
              </button>
              <button
                className="inline-flex items-center gap-1 rounded-full bg-surface-sunken px-3 py-1 font-medium text-muted transition-colors duration-150 hover:text-foreground"
                onClick={() => handleInsertEmbed('bilibili')}
                type="button"
              >
                📺 插入 Bilibili
              </button>
            </div>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="flex flex-col gap-3 p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">Markdown 编辑</h3>
                <span className="text-xs text-subtle">支持 GFM · 代码块自动高亮</span>
              </div>
              <Textarea
                className="min-h-[60vh] font-mono text-sm leading-relaxed"
                onChange={(event) => handleChange('content', event.target.value)}
                placeholder={'# 开始写你的第一段…\n\n可以使用 ```ts 代码块、表格、列表，以及 ::youtube[ID] 嵌入。'}
                value={draft.content}
              />
            </Card>

            <Card className="flex flex-col gap-3 overflow-hidden p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">实时预览</h3>
                <span className="text-xs text-subtle">与 C 端一致的渲染</span>
              </div>
              <div className="max-h-[60vh] overflow-y-auto rounded-lg border border-border/60 bg-surface p-4">
                {draft.content.trim() ? (
                  <MarkdownArticle content={draft.content} theme={resolvedTheme} />
                ) : (
                  <p className="text-sm text-subtle">写点什么，预览会实时更新。</p>
                )}
              </div>
            </Card>
          </div>
        </div>

        <aside className="space-y-5">
          <Card className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">分类</h3>
            <div className="flex flex-wrap gap-2">
              {categories.length === 0 ? (
                <p className="text-xs text-subtle">暂无分类，可在 API 中创建。</p>
              ) : (
                categories.map((category) => (
                  <button
                    className={cn(
                      'rounded-full px-3 py-1.5 text-xs font-medium transition-colors duration-150',
                      draft.categoryId === category.id
                        ? 'bg-primary text-white'
                        : 'bg-surface-sunken text-muted hover:bg-border hover:text-foreground',
                    )}
                    key={category.id}
                    onClick={() => handleChange('categoryId', category.id)}
                    type="button"
                  >
                    {category.name}
                  </button>
                ))
              )}
            </div>
            {selectedCategory?.description ? (
              <p className="text-xs text-subtle">{selectedCategory.description}</p>
            ) : null}
          </Card>

          <Card className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">标签</h3>
            <Textarea
              className="min-h-[72px]"
              onChange={(event) => handleChange('tagsInput', event.target.value)}
              placeholder="用逗号分隔，例如：TypeScript, React, 露营"
              value={draft.tagsInput}
            />
            {tags.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {tags.slice(0, 10).map((tag) => (
                  <button
                    className="rounded-full bg-surface-sunken px-2.5 py-1 text-[11px] text-muted transition-colors hover:bg-border hover:text-foreground"
                    key={tag.id}
                    onClick={() =>
                      setDraft((prev) => {
                        const existing = parseTags(prev.tagsInput);
                        if (existing.some((value) => value.toLowerCase() === tag.name.toLowerCase())) {
                          return prev;
                        }
                        return { ...prev, tagsInput: [...existing, tag.name].join(', ') };
                      })
                    }
                    type="button"
                  >
                    + {tag.name}
                  </button>
                ))}
              </div>
            ) : null}
          </Card>

          <Card className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">封面图</h3>
            {draft.coverImage ? (
              <div className="relative overflow-hidden rounded-lg border border-border">
                <img
                  alt="封面"
                  className="aspect-video w-full object-cover"
                  referrerPolicy="no-referrer"
                  src={resolveMediaUrl(draft.coverImage)}
                />
                <button
                  className="absolute right-2 top-2 rounded-full bg-foreground/60 p-1.5 text-white hover:bg-foreground"
                  onClick={() => handleChange('coverImage', '')}
                  type="button"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            ) : (
              <button
                className="flex w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-surface-sunken/60 px-4 py-8 text-sm text-muted transition-colors hover:text-foreground"
                onClick={() => fileInputRef.current?.click()}
                type="button"
              >
                <ImagePlus className="size-5" />
                {uploading ? '上传中…' : '选择图片上传'}
              </button>
            )}
            <Input
              onChange={(event) => handleChange('coverImage', event.target.value)}
              placeholder="或直接粘贴外部图片 URL"
              value={draft.coverImage}
            />
            <input
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={(event) => void handleCoverUpload(event)}
              ref={fileInputRef}
              type="file"
            />
          </Card>

          <Card className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">摘要</h3>
            <Textarea
              className="min-h-[100px]"
              onChange={(event) => handleChange('excerpt', event.target.value)}
              placeholder="60 字以内的摘要，留空将自动生成。"
              value={draft.excerpt}
            />
          </Card>

          <Card className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">URL Slug</h3>
            <Input
              onChange={(event) => handleChange('slug', event.target.value)}
              placeholder="留空时将由标题自动生成"
              value={draft.slug}
            />
            <p className="text-xs text-subtle">C 端访问路径：/articles/{draft.slug || '<自动生成>'}</p>
          </Card>

          <Card className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">关联专题</h3>
            {topics.length === 0 ? (
              <p className="text-xs text-subtle">暂无专题，可在后台创建。</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {topics.map((topic) => {
                  const isSelected = draft.topicIds.includes(topic.id);
                  return (
                    <button
                      className={cn(
                        'rounded-full px-3 py-1.5 text-xs font-medium transition-colors duration-150',
                        isSelected
                          ? 'bg-primary text-white'
                          : 'bg-surface-sunken text-muted hover:bg-border hover:text-foreground',
                      )}
                      key={topic.id}
                      onClick={() => {
                        setDraft((prev) => ({
                          ...prev,
                          topicIds: isSelected
                            ? prev.topicIds.filter((id) => id !== topic.id)
                            : [...prev.topicIds, topic.id],
                        }));
                      }}
                      type="button"
                    >
                      {topic.title}
                      {topic.articleCount > 0 ? ` (${topic.articleCount})` : ''}
                    </button>
                  );
                })}
              </div>
            )}
          </Card>
        </aside>
      </div>
    </div>
  );
}
