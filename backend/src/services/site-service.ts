import { prisma } from '../lib/prisma.js';

// 站点设置使用单行模式，固定 id = 1
const SITE_SETTINGS_ID = 1;

const DEFAULT_SETTINGS = {
  siteTitle: 'Zora Blog',
  siteDescription: '程序员猫奴露营博客',
  logo: null as string | null,
  commentModerationEnabled: true,
};

export interface SiteSettingsInput {
  siteTitle?: string;
  siteDescription?: string | null;
  logo?: string | null;
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
    },
  });
}

function serializeSiteSettings(settings: Awaited<ReturnType<typeof ensureSiteSettings>>) {
  return {
    siteTitle: settings.siteTitle,
    siteDescription: settings.siteDescription,
    logo: settings.logo,
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

  const updated = await prisma.siteSettings.update({
    where: { id: SITE_SETTINGS_ID },
    data: {
      ...(input.siteTitle !== undefined ? { siteTitle: input.siteTitle.trim() || DEFAULT_SETTINGS.siteTitle } : {}),
      ...(input.siteDescription !== undefined
        ? { siteDescription: input.siteDescription?.trim() || null }
        : {}),
      ...(input.logo !== undefined ? { logo: input.logo?.trim() || null } : {}),
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
