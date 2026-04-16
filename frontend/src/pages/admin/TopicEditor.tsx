import {
  ArrowDown,
  ArrowUp,
  ArrowLeft,
  GripVertical,
  ImagePlus,
  Loader2,
  Save,
  Trash2,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { Input, Textarea } from '@/components/ui/Input';
import {
  ApiError,
  createAdminTopic,
  deleteAdminTopic,
  getAdminTopic,
  listAdminArticles,
  resolveMediaUrl,
  updateAdminTopic,
  uploadImage,
  type ArticleSummary,
  type TopicDetail,
  type TopicMutationInput,
} from '@/lib/api';
import { formatDate } from '@/lib/utils';

interface EditorDraft {
  title: string;
  slug: string;
  description: string;
  coverImage: string;
  articleIds: number[];
}

const EMPTY_DRAFT: EditorDraft = {
  title: '',
  slug: '',
  description: '',
  coverImage: '',
  articleIds: [],
};

function draftFromTopic(topic: TopicDetail): EditorDraft {
  return {
    title: topic.title,
    slug: topic.slug,
    description: topic.description ?? '',
    coverImage: topic.coverImage ?? '',
    articleIds: topic.articles.map((a) => a.id),
  };
}

function buildMutationInput(draft: EditorDraft): TopicMutationInput {
  return {
    title: draft.title.trim(),
    slug: draft.slug.trim() || undefined,
    description: draft.description.trim() || null,
    coverImage: draft.coverImage.trim() || null,
    articleIds: draft.articleIds,
  };
}

export default function TopicEditorPage() {
  const params = useParams<{ id?: string }>();
  const navigate = useNavigate();

  const topicId = useMemo(() => {
    if (!params.id) {
      return null;
    }
    const parsed = Number(params.id);
    return Number.isFinite(parsed) ? parsed : null;
  }, [params.id]);

  const isEdit = topicId !== null;

  const [draft, setDraft] = useState<EditorDraft>(EMPTY_DRAFT);
  const [baseline, setBaseline] = useState<EditorDraft>(EMPTY_DRAFT);
  const [articles, setArticles] = useState<ArticleSummary[]>([]);
  const [isLoading, setIsLoading] = useState(isEdit);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const currentIdRef = useRef<number | null>(topicId);
  const draftRef = useRef<EditorDraft>(EMPTY_DRAFT);
  const baselineRef = useRef<EditorDraft>(EMPTY_DRAFT);

  useEffect(() => {
    draftRef.current = draft;
  }, [draft]);

  useEffect(() => {
    baselineRef.current = baseline;
  }, [baseline]);

  // 加载已发布文章列表（用于关联选择）
  useEffect(() => {
    let cancelled = false;

    listAdminArticles({ status: 'published', limit: 200 })
      .then((result) => {
        if (cancelled) {
          return;
        }
        setArticles(result.items);
      })
      .catch((err: unknown) => {
        if (cancelled) {
          return;
        }
        const message = err instanceof ApiError ? err.message : '文章列表加载失败';
        setError(message);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // 加载专题详情（编辑模式）
  useEffect(() => {
    if (!isEdit || topicId === null) {
      currentIdRef.current = null;
      setDraft(EMPTY_DRAFT);
      setBaseline(EMPTY_DRAFT);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    currentIdRef.current = topicId;
    setIsLoading(true);

    getAdminTopic(topicId)
      .then((topic) => {
        if (cancelled) {
          return;
        }
        const next = draftFromTopic(topic);
        setDraft(next);
        setBaseline(next);
        setError(null);
        setLastSavedAt(new Date(topic.updatedAt));
      })
      .catch((err: unknown) => {
        if (cancelled) {
          return;
        }
        const message = err instanceof ApiError ? err.message : '专题加载失败';
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
  }, [topicId, isEdit]);

  const isDirty = useMemo(() => {
    return JSON.stringify(draft) !== JSON.stringify(baseline);
  }, [baseline, draft]);

  const performSave = useCallback(async (): Promise<TopicDetail | null> => {
    const currentDraft = draftRef.current;
    if (!currentDraft.title.trim()) {
      setError('标题不能为空');
      return null;
    }

    const payload = buildMutationInput(currentDraft);
    setIsSaving(true);

    try {
      const activeId = currentIdRef.current;
      const result = activeId
        ? await updateAdminTopic(activeId, payload)
        : await createAdminTopic(payload);

      const nextDraft = draftFromTopic(result);
      setDraft(nextDraft);
      setBaseline(nextDraft);
      setLastSavedAt(new Date(result.updatedAt));
      setError(null);

      if (!activeId) {
        currentIdRef.current = result.id;
        navigate(`/admin/topics/${result.id}/edit`, { replace: true });
      }

      return result;
    } catch (err) {
      const message = err instanceof ApiError ? err.message : '保存失败';
      setError(message);
      return null;
    } finally {
      setIsSaving(false);
    }
  }, [navigate]);

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

  const handleSave = async () => {
    await performSave();
  };

  const handleDelete = async () => {
    if (!topicId) {
      return;
    }
    const confirmed = window.confirm('确定删除这个专题？该操作不可撤销。');
    if (!confirmed) {
      return;
    }
    try {
      await deleteAdminTopic(topicId);
      navigate('/admin/topics', { replace: true });
    } catch (err) {
      const message = err instanceof ApiError ? err.message : '删除失败';
      window.alert(message);
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
      window.alert(message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // 文章排序操作
  const handleMoveArticle = (index: number, direction: 'up' | 'down') => {
    const newIds = [...draft.articleIds];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newIds.length) {
      return;
    }
    [newIds[index], newIds[targetIndex]] = [newIds[targetIndex], newIds[index]];
    handleChange('articleIds', newIds);
  };

  const handleRemoveArticle = (articleId: number) => {
    handleChange('articleIds', draft.articleIds.filter((id) => id !== articleId));
  };

  const handleAddArticle = (articleId: number) => {
    if (draft.articleIds.includes(articleId)) {
      return;
    }
    handleChange('articleIds', [...draft.articleIds, articleId]);
  };

  // 已选中的文章列表（按顺序）
  const selectedArticles = useMemo(() => {
    return draft.articleIds
      .map((id) => articles.find((a) => a.id === id))
      .filter(Boolean) as ArticleSummary[];
  }, [articles, draft.articleIds]);

  // 未选中的文章列表
  const availableArticles = useMemo(() => {
    return articles.filter((a) => !draft.articleIds.includes(a.id));
  }, [articles, draft.articleIds]);

  const autoSaveLabel = useMemo(() => {
    if (lastSavedAt) {
      return `上次保存 ${formatDate(lastSavedAt)} ${lastSavedAt.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`;
    }
    return '尚未保存';
  }, [lastSavedAt]);

  if (isEdit && isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-60 animate-pulse rounded-full bg-surface-raised" />
        <div className="h-[50vh] animate-pulse rounded-xl bg-surface-raised" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-3">
          <Link
            className="inline-flex w-fit items-center gap-2 text-sm font-medium text-muted hover:text-foreground"
            to="/admin/topics"
          >
            <ArrowLeft className="size-4" />
            返回专题管理
          </Link>
          <div className="flex items-center gap-3">
            <Badge variant="category">
              {isEdit ? '编辑专题' : '新建专题'}
            </Badge>
            <p className="text-xs text-subtle">
              {isEdit ? `专题 #${topicId}` : '新专题'} · {autoSaveLabel}
              {isDirty ? ' · 有未保存更改' : ''}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button disabled={isSaving} onClick={() => void handleSave()}>
            {isSaving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            保存
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

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-5">
          <Card className="space-y-4">
            <input
              aria-label="专题标题"
              className="w-full border-0 bg-transparent p-0 font-heading text-3xl font-bold leading-tight text-foreground outline-none placeholder:text-subtle focus:outline-none md:text-4xl"
              onChange={(event) => handleChange('title', event.target.value)}
              placeholder="专题标题"
              value={draft.title}
            />
          </Card>

          <Card className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">专题描述</h3>
            <Textarea
              className="min-h-[120px]"
              onChange={(event) => handleChange('description', event.target.value)}
              placeholder="描述这个专题的内容和目标读者..."
              value={draft.description}
            />
          </Card>

          <Card className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">关联文章 ({selectedArticles.length})</h3>
              <p className="text-xs text-subtle">拖拽或使用箭头调整顺序</p>
            </div>

            {selectedArticles.length === 0 ? (
              <p className="text-sm text-subtle">暂未关联文章，从右侧选择添加。</p>
            ) : (
              <div className="space-y-2">
                {selectedArticles.map((article, index) => (
                  <div
                    className="flex items-center gap-3 rounded-lg border border-border/60 bg-surface-sunken p-3"
                    key={article.id}
                  >
                    <GripVertical className="size-4 shrink-0 text-subtle" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{article.title}</p>
                      <p className="text-xs text-subtle">{article.category.name}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        className="inline-flex size-7 items-center justify-center rounded-full text-muted hover:bg-surface-raised hover:text-foreground disabled:opacity-30"
                        disabled={index === 0}
                        onClick={() => handleMoveArticle(index, 'up')}
                        type="button"
                      >
                        <ArrowUp className="size-3.5" />
                      </button>
                      <button
                        className="inline-flex size-7 items-center justify-center rounded-full text-muted hover:bg-surface-raised hover:text-foreground disabled:opacity-30"
                        disabled={index === selectedArticles.length - 1}
                        onClick={() => handleMoveArticle(index, 'down')}
                        type="button"
                      >
                        <ArrowDown className="size-3.5" />
                      </button>
                      <button
                        className="inline-flex size-7 items-center justify-center rounded-full text-muted hover:bg-error/10 hover:text-error"
                        onClick={() => handleRemoveArticle(article.id)}
                        type="button"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <aside className="space-y-5">
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
            <h3 className="text-sm font-semibold text-foreground">URL Slug</h3>
            <Input
              onChange={(event) => handleChange('slug', event.target.value)}
              placeholder="留空时将由标题自动生成"
              value={draft.slug}
            />
            <p className="text-xs text-subtle">C 端访问路径：/topics/{draft.slug || '<自动生成>'}</p>
          </Card>

          <Card className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">添加文章</h3>
            {availableArticles.length === 0 ? (
              <p className="text-xs text-subtle">
                {articles.length === 0 ? '暂无已发布文章' : '所有文章已添加'}
              </p>
            ) : (
              <div className="max-h-[400px] space-y-2 overflow-y-auto">
                {availableArticles.map((article) => (
                  <button
                    className="flex w-full items-center gap-3 rounded-lg border border-border/40 bg-surface-sunken p-3 text-left transition-colors hover:border-border hover:bg-surface-raised"
                    key={article.id}
                    onClick={() => handleAddArticle(article.id)}
                    type="button"
                  >
                    {article.coverImage ? (
                      <img
                        alt={article.title}
                        className="size-10 shrink-0 rounded object-cover"
                        referrerPolicy="no-referrer"
                        src={resolveMediaUrl(article.coverImage)}
                      />
                    ) : (
                      <div className="flex size-10 shrink-0 items-center justify-center rounded bg-surface text-subtle">
                        📄
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{article.title}</p>
                      <p className="text-xs text-subtle">{article.category.name}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </Card>
        </aside>
      </div>
    </div>
  );
}