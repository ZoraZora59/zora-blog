import { homedir } from "node:os";
import path from "node:path";
import { existsSync, mkdirSync, readFileSync, writeFileSync, chmodSync } from "node:fs";

export interface CliConfig {
  baseUrl: string;
  token: string;
  /** 可选：自定义默认 status、排序等 */
  defaults?: {
    articleStatus?: "draft" | "published" | "all";
  };
}

export function configDir(): string {
  const xdg = process.env.XDG_CONFIG_HOME;
  return xdg
    ? path.join(xdg, "zora-blog")
    : path.join(homedir(), ".config", "zora-blog");
}

export function configPath(): string {
  return path.join(configDir(), "config.json");
}

export function loadConfig(): CliConfig | null {
  const file = configPath();
  if (!existsSync(file)) return null;
  try {
    const raw = readFileSync(file, "utf8");
    const parsed = JSON.parse(raw) as CliConfig;
    if (!parsed.baseUrl || !parsed.token) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveConfig(config: CliConfig): string {
  const dir = configDir();
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true, mode: 0o700 });
  const file = configPath();
  writeFileSync(file, JSON.stringify(config, null, 2) + "\n", { encoding: "utf8" });
  try {
    chmodSync(file, 0o600);
  } catch {
    // Windows 或其他无法改权限的平台忽略
  }
  return file;
}

/**
 * 优先级：显式参数 > 环境变量 > 配置文件
 */
export function resolveConfig(overrides: Partial<CliConfig> = {}): CliConfig | null {
  const file = loadConfig();
  const baseUrl = overrides.baseUrl ?? process.env.ZORA_BASE_URL ?? file?.baseUrl;
  const token = overrides.token ?? process.env.ZORA_TOKEN ?? file?.token;
  if (!baseUrl || !token) return null;
  return { baseUrl, token, defaults: file?.defaults };
}
