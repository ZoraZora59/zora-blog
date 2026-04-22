// Zora Blog 前端埋点 SDK
//
// 隐私保证：
// - 不种 cookie，访客标识使用 localStorage 匿名 UUID
// - 尊重浏览器 Do Not Track 信号
// - 仅采集页面 path、referrer、屏幕尺寸、语言等不可识别个人身份的信息
// - IP 由后端在写库前哈希，原始 IP 不留存

const VISITOR_KEY = 'zb_vid';
const SESSION_KEY = 'zb_sid';
const SESSION_LAST_ACTIVE_KEY = 'zb_sid_last_active';
const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 分钟
const DEDUP_WINDOW_MS = 5_000;

// 同 path 5 秒内重复触发只发一次
let lastSentPath: string | null = null;
let lastSentAt = 0;

function safeRandomUuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // 简易回落
  return `xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx`.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function getOrCreateVisitorId(): { id: string; isNew: boolean } {
  try {
    const existing = localStorage.getItem(VISITOR_KEY);
    if (existing) return { id: existing, isNew: false };
    const fresh = safeRandomUuid();
    localStorage.setItem(VISITOR_KEY, fresh);
    return { id: fresh, isNew: true };
  } catch {
    // localStorage 被禁，每次返回随机 id
    return { id: safeRandomUuid(), isNew: true };
  }
}

function getOrCreateSessionId(): { id: string; isNew: boolean } {
  try {
    const now = Date.now();
    const existing = sessionStorage.getItem(SESSION_KEY);
    const lastActiveRaw = sessionStorage.getItem(SESSION_LAST_ACTIVE_KEY);
    const lastActive = lastActiveRaw ? Number.parseInt(lastActiveRaw, 10) : 0;

    if (existing && now - lastActive < SESSION_TIMEOUT_MS) {
      sessionStorage.setItem(SESSION_LAST_ACTIVE_KEY, String(now));
      return { id: existing, isNew: false };
    }

    const fresh = safeRandomUuid();
    sessionStorage.setItem(SESSION_KEY, fresh);
    sessionStorage.setItem(SESSION_LAST_ACTIVE_KEY, String(now));
    return { id: fresh, isNew: true };
  } catch {
    return { id: safeRandomUuid(), isNew: true };
  }
}

function isDoNotTrack(): boolean {
  const nav = navigator as Navigator & { msDoNotTrack?: string };
  // window.doNotTrack 在某些浏览器是字符串
  const win = window as Window & { doNotTrack?: string };
  return nav.doNotTrack === '1' || nav.msDoNotTrack === '1' || win.doNotTrack === '1';
}

function isAdminPath(path: string): boolean {
  return path.startsWith('/admin') || path === '/login';
}

function parseUtm(search: string): { source?: string; medium?: string; campaign?: string } | undefined {
  if (!search) return undefined;
  const params = new URLSearchParams(search);
  const source = params.get('utm_source') ?? undefined;
  const medium = params.get('utm_medium') ?? undefined;
  const campaign = params.get('utm_campaign') ?? undefined;
  if (!source && !medium && !campaign) return undefined;
  return { source, medium, campaign };
}

export interface TrackPageViewOptions {
  path?: string;
  isAdmin?: boolean;
}

export function trackPageView(options: TrackPageViewOptions = {}): void {
  if (typeof window === 'undefined') return;
  if (isDoNotTrack()) return;

  const path = options.path ?? window.location.pathname;
  if (isAdminPath(path)) return;

  const now = Date.now();
  if (lastSentPath === path && now - lastSentAt < DEDUP_WINDOW_MS) return;
  lastSentPath = path;
  lastSentAt = now;

  const visitor = getOrCreateVisitorId();
  const session = getOrCreateSessionId();

  const payload = {
    path,
    referrer: document.referrer || undefined,
    screenWidth: window.screen?.width,
    screenHeight: window.screen?.height,
    viewportWidth: window.innerWidth,
    language: navigator.language,
    visitorId: visitor.id,
    sessionId: session.id,
    isNewVisitor: visitor.isNew,
    isNewSession: session.isNew,
    isAdmin: options.isAdmin === true,
    utm: parseUtm(window.location.search),
  };

  const body = JSON.stringify(payload);
  const url = '/api/track/pageview';

  try {
    if (typeof navigator.sendBeacon === 'function') {
      const ok = navigator.sendBeacon(url, new Blob([body], { type: 'application/json' }));
      if (ok) return;
    }
  } catch {
    // ignore，回落到 fetch
  }

  // 回落
  void fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    keepalive: true,
  }).catch(() => {
    // 静默失败
  });
}
