import { prisma } from '../lib/prisma.js';

// 站点设置使用单行模式，固定 id = 1
const SITE_SETTINGS_ID = 1;

const DEFAULT_SETTINGS = {
  siteTitle: 'Zora Blog',
  siteDescription: '程序员猫奴露营博客',
  logo: null as string | null,
  slogan: '在代码和山野之间来回穿梭，记录值得反复回看的现场经验。',
  aboutContent: `## 关于我

我是一个长期在工程现场与户外路线之间来回切换的开发者。

- 写前端，也写后端
- 关心体验，也关心可维护性
- 喜欢把技术问题拆到足够清楚，再把它们做成稳定可交付的东西

这里会持续记录技术实践、装备体验和山野现场。`,
  skills: ['TypeScript', 'React', 'Node.js', '露营', '徒步', '猫咪'],
  githubUrl: null as string | null,
  email: null as string | null,
  heroBadge: null as string | null,
  heroTitle: null as string | null,
  heroSubtitle: null as string | null,
  heroPrimaryText: null as string | null,
  heroPrimaryHref: null as string | null,
  heroSecondaryText: null as string | null,
  heroSecondaryHref: null as string | null,
  heroImages: [] as string[],
  commentModerationEnabled: true,
};

export interface SiteSettingsInput {
  siteTitle?: string;
  siteDescription?: string | null;
  logo?: string | null;
  slogan?: string | null;
  aboutContent?: string | null;
  skills?: string[];
  githubUrl?: string | null;
  email?: string | null;
  heroBadge?: string | null;
  heroTitle?: string | null;
  heroSubtitle?: string | null;
  heroPrimaryText?: string | null;
  heroPrimaryHref?: string | null;
  heroSecondaryText?: string | null;
  heroSecondaryHref?: string | null;
  heroImages?: string[];
  commentModerationEnabled?: boolean;
}

export interface AdminProfileInput {
  displayName?: string;
  avatar?: string | null;
  bio?: string | null;
  role?: string | null;
}

// 确保站点设置行存在，首次访问时自动创建
async function ensureSiteSettings() {
  const existing = await prisma.siteSettings.findUnique({
    where: { id: SITE_SETTINGS_ID },
  });

  if (existing) {
    return existing;
  }

  return prisma.siteSettings.create({
    data: {
      id: SITE_SETTINGS_ID,
      siteTitle: DEFAULT_SETTINGS.siteTitle,
      siteDescription: DEFAULT_SETTINGS.siteDescription,
      slogan: DEFAULT_SETTINGS.slogan,
      aboutContent: DEFAULT_SETTINGS.aboutContent,
      skills: DEFAULT_SETTINGS.skills,
      githubUrl: DEFAULT_SETTINGS.githubUrl,
      email: DEFAULT_SETTINGS.email,
    },
  });
}

function serializeSiteSettings(settings: Awaited<ReturnType<typeof ensureSiteSettings>>) {
  return {
    siteTitle: settings.siteTitle,
    siteDescription: settings.siteDescription,
    logo: settings.logo,
    slogan: settings.slogan,
    aboutContent: settings.aboutContent,
    skills: settings.skills,
    githubUrl: settings.githubUrl,
    email: settings.email,
    heroBadge: settings.heroBadge,
    heroTitle: settings.heroTitle,
    heroSubtitle: settings.heroSubtitle,
    heroPrimaryText: settings.heroPrimaryText,
    heroPrimaryHref: settings.heroPrimaryHref,
    heroSecondaryText: settings.heroSecondaryText,
    heroSecondaryHref: settings.heroSecondaryHref,
    heroImages: settings.heroImages,
    commentModerationEnabled: settings.commentModerationEnabled,
  };
}

// C 端访问站点公开信息：站点元数据 + 博主公开资料
export async function getSitePublicInfo() {
  const [settings, admin] = await Promise.all([
    ensureSiteSettings(),
    prisma.admin.findFirst({
      orderBy: { id: 'asc' },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatar: true,
        bio: true,
        role: true,
      },
    }),
  ]);

  return {
    site: serializeSiteSettings(settings),
    admin,
  };
}

// B 端访问：同时返回站点设置和当前登录博主资料，便于 Settings 页面统一回填
export async function getAdminSettings(adminId: number) {
  const [settings, admin] = await Promise.all([
    ensureSiteSettings(),
    prisma.admin.findUnique({
      where: { id: adminId },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatar: true,
        bio: true,
        role: true,
        apiKeyPrefix: true,
      },
    }),
  ]);

  return {
    site: serializeSiteSettings(settings),
    admin,
  };
}

export async function updateSiteSettings(input: SiteSettingsInput) {
  await ensureSiteSettings();

  const normalizedSkills =
    input.skills?.map((item) => item.trim()).filter(Boolean).slice(0, 24) ?? undefined;

  const normalizedHeroImages =
    input.heroImages?.map((item) => item.trim()).filter(Boolean).slice(0, 6) ?? undefined;

  const updated = await prisma.siteSettings.update({
    where: { id: SITE_SETTINGS_ID },
    data: {
      ...(input.siteTitle !== undefined ? { siteTitle: input.siteTitle.trim() || DEFAULT_SETTINGS.siteTitle } : {}),
      ...(input.siteDescription !== undefined
        ? { siteDescription: input.siteDescription?.trim() || null }
        : {}),
      ...(input.logo !== undefined ? { logo: input.logo?.trim() || null } : {}),
      ...(input.slogan !== undefined ? { slogan: input.slogan?.trim() || null } : {}),
      ...(input.aboutContent !== undefined
        ? { aboutContent: input.aboutContent?.trim() || null }
        : {}),
      ...(normalizedSkills !== undefined ? { skills: normalizedSkills } : {}),
      ...(input.githubUrl !== undefined ? { githubUrl: input.githubUrl?.trim() || null } : {}),
      ...(input.email !== undefined ? { email: input.email?.trim() || null } : {}),
      ...(input.heroBadge !== undefined ? { heroBadge: input.heroBadge?.trim() || null } : {}),
      ...(input.heroTitle !== undefined ? { heroTitle: input.heroTitle?.trim() || null } : {}),
      ...(input.heroSubtitle !== undefined ? { heroSubtitle: input.heroSubtitle?.trim() || null } : {}),
      ...(input.heroPrimaryText !== undefined
        ? { heroPrimaryText: input.heroPrimaryText?.trim() || null }
        : {}),
      ...(input.heroPrimaryHref !== undefined
        ? { heroPrimaryHref: input.heroPrimaryHref?.trim() || null }
        : {}),
      ...(input.heroSecondaryText !== undefined
        ? { heroSecondaryText: input.heroSecondaryText?.trim() || null }
        : {}),
      ...(input.heroSecondaryHref !== undefined
        ? { heroSecondaryHref: input.heroSecondaryHref?.trim() || null }
        : {}),
      ...(normalizedHeroImages !== undefined ? { heroImages: normalizedHeroImages } : {}),
      ...(input.commentModerationEnabled !== undefined
        ? { commentModerationEnabled: input.commentModerationEnabled }
        : {}),
    },
  });

  return serializeSiteSettings(updated);
}

export async function updateAdminProfile(adminId: number, input: AdminProfileInput) {
  const updated = await prisma.admin.update({
    where: { id: adminId },
    data: {
      ...(input.displayName !== undefined ? { displayName: input.displayName.trim() } : {}),
      ...(input.avatar !== undefined ? { avatar: input.avatar?.trim() || null } : {}),
      ...(input.bio !== undefined ? { bio: input.bio?.trim() || null } : {}),
      ...(input.role !== undefined ? { role: input.role?.trim() || null } : {}),
    },
    select: {
      id: true,
      username: true,
      displayName: true,
      avatar: true,
      bio: true,
      role: true,
      apiKeyPrefix: true,
    },
  });

  return updated;
}
