import {
  Check,
  Copy,
  ImagePlus,
  KeyRound,
  Loader2,
  RotateCw,
  Save,
  Trash2,
} from 'lucide-react';
import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { Input, Textarea } from '@/components/ui/Input';
import { useAuth } from '@/hooks/useAuth';
import { useConfirm } from '@/hooks/useConfirm';
import { useToast } from '@/hooks/useToast';
import {
  ApiError,
  generateApiKey,
  getAdminSettings,
  resolveMediaUrl,
  revokeApiKey,
  updateAdminProfile,
  updateAdminSiteSettings,
  uploadImage,
  type AdminProfile,
  type SiteSettings,
} from '@/lib/api';

interface ProfileForm {
  displayName: string;
  avatar: string;
  bio: string;
  role: string;
}

interface SiteForm {
  siteTitle: string;
  siteDescription: string;
  logo: string;
  slogan: string;
  aboutContent: string;
  skills: string;
  githubUrl: string;
  linkedinUrl: string;
  instagramUrl: string;
  email: string;
  commentModerationEnabled: boolean;
}

function profileFromAdmin(admin: AdminProfile | null): ProfileForm {
  return {
    displayName: admin?.displayName ?? '',
    avatar: admin?.avatar ?? '',
    bio: admin?.bio ?? '',
    role: admin?.role ?? '',
  };
}

function siteFromSettings(site: SiteSettings): SiteForm {
  return {
    siteTitle: site.siteTitle,
    siteDescription: site.siteDescription ?? '',
    logo: site.logo ?? '',
    slogan: site.slogan ?? '',
    aboutContent: site.aboutContent ?? '',
    skills: site.skills.join(', '),
    githubUrl: site.githubUrl ?? '',
    linkedinUrl: site.linkedinUrl ?? '',
    instagramUrl: site.instagramUrl ?? '',
    email: site.email ?? '',
    commentModerationEnabled: site.commentModerationEnabled,
  };
}

export default function AdminSettings() {
  const { setAdmin } = useAuth();
  const toast = useToast();
  const confirm = useConfirm();

  const [profile, setProfile] = useState<ProfileForm>({ displayName: '', avatar: '', bio: '', role: '' });
  const [site, setSite] = useState<SiteForm>({
    siteTitle: '',
    siteDescription: '',
    logo: '',
    slogan: '',
    aboutContent: '',
    skills: '',
    githubUrl: '',
    linkedinUrl: '',
    instagramUrl: '',
    email: '',
    commentModerationEnabled: true,
  });
  const [apiKeyPrefix, setApiKeyPrefix] = useState<string | null>(null);
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [keyCopied, setKeyCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isProfileSaving, setIsProfileSaving] = useState(false);
  const [isSiteSaving, setIsSiteSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [siteMessage, setSiteMessage] = useState<string | null>(null);
  const [keyMessage, setKeyMessage] = useState<string | null>(null);
  const [keyWorking, setKeyWorking] = useState<null | 'generate' | 'revoke'>(null);
  const [error, setError] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    getAdminSettings()
      .then((data) => {
        if (cancelled) {
          return;
        }
        setProfile(profileFromAdmin(data.admin));
        setSite(siteFromSettings(data.site));
        setApiKeyPrefix(data.admin?.apiKeyPrefix ?? null);
        setError(null);
      })
      .catch((err: unknown) => {
        if (cancelled) {
          return;
        }
        const message = err instanceof ApiError ? err.message : '设置加载失败';
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
  }, []);

  const handleProfileSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isProfileSaving) {
      return;
    }

    setIsProfileSaving(true);
    setProfileMessage(null);

    try {
      const updated = await updateAdminProfile({
        displayName: profile.displayName.trim(),
        avatar: profile.avatar.trim() || null,
        bio: profile.bio.trim() || null,
        role: profile.role.trim() || null,
      });
      setAdmin(updated);
      setProfileMessage('个人资料已更新');
    } catch (err) {
      const message = err instanceof ApiError ? err.message : '保存失败';
      setProfileMessage(message);
    } finally {
      setIsProfileSaving(false);
    }
  };

  const handleSiteSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSiteSaving) {
      return;
    }

    setIsSiteSaving(true);
    setSiteMessage(null);

    try {
      const updated = await updateAdminSiteSettings({
        siteTitle: site.siteTitle.trim(),
        siteDescription: site.siteDescription.trim() || null,
        logo: site.logo.trim() || null,
        slogan: site.slogan.trim() || null,
        aboutContent: site.aboutContent.trim() || null,
        skills: site.skills
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean),
        githubUrl: site.githubUrl.trim() || null,
        linkedinUrl: site.linkedinUrl.trim() || null,
        instagramUrl: site.instagramUrl.trim() || null,
        email: site.email.trim() || null,
        commentModerationEnabled: site.commentModerationEnabled,
      });
      setSite(siteFromSettings(updated));
      setSiteMessage('站点设置已更新');
    } catch (err) {
      const message = err instanceof ApiError ? err.message : '保存失败';
      setSiteMessage(message);
    } finally {
      setIsSiteSaving(false);
    }
  };

  const handleAvatarUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    setAvatarUploading(true);
    try {
      const result = await uploadImage(file);
      setProfile((prev) => ({ ...prev, avatar: result.url }));
    } catch (err) {
      const message = err instanceof ApiError ? err.message : '上传失败';
      toast.error(message);
    } finally {
      setAvatarUploading(false);
      if (avatarInputRef.current) {
        avatarInputRef.current.value = '';
      }
    }
  };

  const handleLogoUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    setLogoUploading(true);
    try {
      const result = await uploadImage(file);
      setSite((prev) => ({ ...prev, logo: result.url }));
    } catch (err) {
      const message = err instanceof ApiError ? err.message : '上传失败';
      toast.error(message);
    } finally {
      setLogoUploading(false);
      if (logoInputRef.current) {
        logoInputRef.current.value = '';
      }
    }
  };

  const handleGenerateKey = async () => {
    if (keyWorking) {
      return;
    }

    if (apiKeyPrefix) {
      const confirmed = await confirm({
        title: '重新生成 API Key',
        description: '重新生成将使现有 API Key 立即失效，确定继续吗？',
        confirmText: '重新生成',
        tone: 'danger',
      });
      if (!confirmed) {
        return;
      }
    }

    setKeyWorking('generate');
    setKeyMessage(null);

    try {
      const result = await generateApiKey();
      setGeneratedKey(result.apiKey);
      setApiKeyPrefix(result.prefix);
      setKeyCopied(false);
      setKeyMessage('请妥善保存新 Key，此后将无法再次查看明文');
    } catch (err) {
      const message = err instanceof ApiError ? err.message : '生成失败';
      setKeyMessage(message);
    } finally {
      setKeyWorking(null);
    }
  };

  const handleRevokeKey = async () => {
    if (keyWorking) {
      return;
    }
    const confirmed = await confirm({
      title: '吊销 API Key',
      description: '吊销后对应 Key 将立即失效，是否继续？',
      confirmText: '吊销',
      tone: 'danger',
    });
    if (!confirmed) {
      return;
    }

    setKeyWorking('revoke');
    setKeyMessage(null);

    try {
      await revokeApiKey();
      setApiKeyPrefix(null);
      setGeneratedKey(null);
      setKeyCopied(false);
      setKeyMessage('API Key 已吊销');
    } catch (err) {
      const message = err instanceof ApiError ? err.message : '吊销失败';
      setKeyMessage(message);
    } finally {
      setKeyWorking(null);
    }
  };

  const handleCopyKey = async () => {
    if (!generatedKey) {
      return;
    }
    try {
      await navigator.clipboard.writeText(generatedKey);
      setKeyCopied(true);
      window.setTimeout(() => setKeyCopied(false), 2000);
    } catch {
      toast.error('复制失败，请手动选中文本复制');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded-full bg-surface-raised" />
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="h-80 animate-pulse rounded-xl bg-surface-raised" />
          <div className="h-80 animate-pulse rounded-xl bg-surface-raised" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-[0.24em] text-subtle">System Settings</p>
        <h1 className="font-heading text-3xl font-bold text-foreground">系统设置</h1>
        <p className="text-sm text-muted">管理个人资料、About 页面内容、评论策略和 CLI / AI 使用的 API Key。</p>
      </header>

      {error ? (
        <div className="rounded-lg border border-error/30 bg-error/5 px-4 py-3 text-sm text-error">{error}</div>
      ) : null}

      <section className="grid gap-6 lg:grid-cols-2">
        <Card className="space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-lg font-bold text-foreground">个人资料</h2>
            <Badge variant="neutral">C 端 /about 同步</Badge>
          </div>

          <form className="space-y-4" onSubmit={handleProfileSubmit}>
            <div className="flex items-center gap-4">
              {profile.avatar ? (
                <img
                  alt="头像"
                  className="size-16 rounded-full object-cover"
                  referrerPolicy="no-referrer"
                  src={resolveMediaUrl(profile.avatar)}
                />
              ) : (
                <div className="flex size-16 items-center justify-center rounded-full bg-surface-sunken text-subtle">
                  <ImagePlus className="size-5" />
                </div>
              )}
              <div className="flex flex-col gap-2">
                <Button
                  disabled={avatarUploading}
                  onClick={() => avatarInputRef.current?.click()}
                  size="sm"
                  type="button"
                  variant="secondary"
                >
                  {avatarUploading ? '上传中…' : '上传头像'}
                </Button>
                <button
                  className="text-left text-xs text-subtle hover:text-foreground"
                  onClick={() => setProfile((prev) => ({ ...prev, avatar: '' }))}
                  type="button"
                >
                  移除头像
                </button>
                <input
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={(event) => void handleAvatarUpload(event)}
                  ref={avatarInputRef}
                  type="file"
                />
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <label className="space-y-1 text-sm">
                <span className="font-medium text-foreground">昵称</span>
                <Input
                  onChange={(event) => setProfile((prev) => ({ ...prev, displayName: event.target.value }))}
                  placeholder="ZoraGK"
                  value={profile.displayName}
                />
              </label>
              <label className="space-y-1 text-sm">
                <span className="font-medium text-foreground">职业描述</span>
                <Input
                  onChange={(event) => setProfile((prev) => ({ ...prev, role: event.target.value }))}
                  placeholder="程序员 / 户外爱好者"
                  value={profile.role}
                />
              </label>
            </div>

            <label className="space-y-1 text-sm">
              <span className="font-medium text-foreground">个人简介</span>
              <Textarea
                onChange={(event) => setProfile((prev) => ({ ...prev, bio: event.target.value }))}
                placeholder="一段话介绍自己，会展示在 /about 页面。"
                rows={4}
                value={profile.bio}
              />
            </label>

            <label className="space-y-1 text-sm">
              <span className="font-medium text-foreground">头像 URL</span>
              <Input
                onChange={(event) => setProfile((prev) => ({ ...prev, avatar: event.target.value }))}
                placeholder="若使用外链头像可直接填写"
                value={profile.avatar}
              />
            </label>

            {profileMessage ? <p className="text-xs text-muted">{profileMessage}</p> : null}

            <div className="flex items-center justify-end">
              <Button disabled={isProfileSaving} type="submit">
                {isProfileSaving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                保存资料
              </Button>
            </div>
          </form>
        </Card>

        <Card className="space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-lg font-bold text-foreground">博客设置</h2>
            <Badge variant="neutral">/api/site 数据源</Badge>
          </div>

          <form className="space-y-4" onSubmit={handleSiteSubmit}>
            <label className="space-y-1 text-sm">
              <span className="font-medium text-foreground">博客标题</span>
              <Input
                onChange={(event) => setSite((prev) => ({ ...prev, siteTitle: event.target.value }))}
                placeholder="Zora Blog"
                value={site.siteTitle}
              />
            </label>

            <label className="space-y-1 text-sm">
              <span className="font-medium text-foreground">博客描述</span>
              <Textarea
                onChange={(event) => setSite((prev) => ({ ...prev, siteDescription: event.target.value }))}
                placeholder="一段话描述博客定位，会出现在 SEO 和导航"
                rows={3}
                value={site.siteDescription}
              />
            </label>

            <label className="space-y-1 text-sm">
              <span className="font-medium text-foreground">Slogan</span>
              <Input
                onChange={(event) => setSite((prev) => ({ ...prev, slogan: event.target.value }))}
                placeholder="一句话概括博客和作者气质"
                value={site.slogan}
              />
            </label>

            <div className="space-y-2 text-sm">
              <span className="font-medium text-foreground">博客 Logo</span>
              <div className="flex items-center gap-3">
                {site.logo ? (
                  <img
                    alt="Logo"
                    className="size-14 rounded-lg border border-border object-cover"
                    referrerPolicy="no-referrer"
                    src={resolveMediaUrl(site.logo)}
                  />
                ) : (
                  <div className="flex size-14 items-center justify-center rounded-lg border border-dashed border-border text-subtle">
                    <ImagePlus className="size-5" />
                  </div>
                )}
                <Button
                  disabled={logoUploading}
                  onClick={() => logoInputRef.current?.click()}
                  size="sm"
                  type="button"
                  variant="secondary"
                >
                  {logoUploading ? '上传中…' : '上传新 Logo'}
                </Button>
                {site.logo ? (
                  <button
                    className="text-xs text-subtle hover:text-foreground"
                    onClick={() => setSite((prev) => ({ ...prev, logo: '' }))}
                    type="button"
                  >
                    移除
                  </button>
                ) : null}
              </div>
              <Input
                onChange={(event) => setSite((prev) => ({ ...prev, logo: event.target.value }))}
                placeholder="或直接填写 Logo 图片 URL"
                value={site.logo}
              />
              <input
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={(event) => void handleLogoUpload(event)}
                ref={logoInputRef}
                type="file"
              />
            </div>

            <label className="space-y-1 text-sm">
              <span className="font-medium text-foreground">关于页正文（Markdown）</span>
              <Textarea
                onChange={(event) => setSite((prev) => ({ ...prev, aboutContent: event.target.value }))}
                placeholder="支持标题、列表、图片等 Markdown 语法，会展示在 /about 页面。"
                rows={10}
                value={site.aboutContent}
              />
            </label>

            <label className="space-y-1 text-sm">
              <span className="font-medium text-foreground">技能 / 兴趣标签</span>
              <Input
                onChange={(event) => setSite((prev) => ({ ...prev, skills: event.target.value }))}
                placeholder="TypeScript, React, 露营, 徒步, 猫咪"
                value={site.skills}
              />
            </label>

            <div className="grid gap-3 md:grid-cols-2">
              <label className="space-y-1 text-sm">
                <span className="font-medium text-foreground">GitHub 链接</span>
                <Input
                  onChange={(event) => setSite((prev) => ({ ...prev, githubUrl: event.target.value }))}
                  placeholder="https://github.com/your-name"
                  value={site.githubUrl}
                />
              </label>
              <label className="space-y-1 text-sm">
                <span className="font-medium text-foreground">LinkedIn 链接</span>
                <Input
                  onChange={(event) => setSite((prev) => ({ ...prev, linkedinUrl: event.target.value }))}
                  placeholder="https://www.linkedin.com/in/your-name"
                  value={site.linkedinUrl}
                />
              </label>
              <label className="space-y-1 text-sm">
                <span className="font-medium text-foreground">Instagram 链接</span>
                <Input
                  onChange={(event) => setSite((prev) => ({ ...prev, instagramUrl: event.target.value }))}
                  placeholder="https://www.instagram.com/your-name"
                  value={site.instagramUrl}
                />
              </label>
              <label className="space-y-1 text-sm">
                <span className="font-medium text-foreground">公开邮箱</span>
                <Input
                  onChange={(event) => setSite((prev) => ({ ...prev, email: event.target.value }))}
                  placeholder="hello@example.com"
                  value={site.email}
                />
              </label>
            </div>

            <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-surface-sunken/60 p-3">
              <input
                checked={site.commentModerationEnabled}
                className="mt-1 size-4 accent-primary"
                onChange={(event) =>
                  setSite((prev) => ({ ...prev, commentModerationEnabled: event.target.checked }))
                }
                type="checkbox"
              />
              <span className="space-y-0.5 text-sm">
                <span className="block font-medium text-foreground">评论需要审核后才会展示</span>
                <span className="block text-xs text-muted">
                  关闭后读者评论将立即公开（适合信任读者群的场景）。
                </span>
              </span>
            </label>

            {siteMessage ? <p className="text-xs text-muted">{siteMessage}</p> : null}

            <div className="flex items-center justify-end">
              <Button disabled={isSiteSaving} type="submit">
                {isSiteSaving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                保存设置
              </Button>
            </div>
          </form>
        </Card>
      </section>

      <Card className="space-y-5">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="font-heading text-lg font-bold text-foreground">API Key 管理</h2>
            <p className="text-sm text-muted">
              生成后可用于 CLI / 自动化工具的 Bearer Token，例如 LLM 通过 /api/admin 接口读写内容。
            </p>
          </div>
          <KeyRound className="size-6 text-primary" />
        </div>

        <div className="grid gap-3 rounded-xl bg-surface-sunken/60 p-4 text-sm md:grid-cols-[auto_1fr]">
          <span className="font-medium text-foreground">当前 Key</span>
          <span className="font-mono text-muted">
            {apiKeyPrefix ? `${apiKeyPrefix}••••••••••••` : '尚未生成'}
          </span>
        </div>

        {generatedKey ? (
          <div className="space-y-2 rounded-xl border border-success/30 bg-success/5 p-4 text-sm text-success">
            <p className="font-medium">新 Key 已生成，立即复制保存：</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 overflow-x-auto rounded-lg bg-foreground/90 px-3 py-2 font-mono text-xs text-white">
                {generatedKey}
              </code>
              <Button onClick={() => void handleCopyKey()} size="sm" variant="secondary">
                {keyCopied ? <Check className="size-4" /> : <Copy className="size-4" />}
                {keyCopied ? '已复制' : '复制'}
              </Button>
            </div>
            <p className="text-xs">离开页面后将无法再次查看明文，请妥善保存。</p>
          </div>
        ) : null}

        {keyMessage ? <p className="text-xs text-muted">{keyMessage}</p> : null}

        <div className="flex flex-wrap items-center gap-3">
          <Button disabled={keyWorking === 'generate'} onClick={() => void handleGenerateKey()}>
            {keyWorking === 'generate' ? <Loader2 className="size-4 animate-spin" /> : <RotateCw className="size-4" />}
            {apiKeyPrefix ? '重新生成' : '生成 Key'}
          </Button>
          {apiKeyPrefix ? (
            <Button disabled={keyWorking === 'revoke'} onClick={() => void handleRevokeKey()} variant="danger">
              {keyWorking === 'revoke' ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
              吊销 Key
            </Button>
          ) : null}
        </div>
      </Card>
    </div>
  );
}
