import { input, password, confirm } from "@inquirer/prompts";
import { ZoraBlog, ZoraApiError } from "@zora-blog/sdk";
import { loadConfig, resolveConfig, saveConfig, type CliConfig } from "./config.js";
import { info, success, error } from "./ui.js";

export interface CliGlobalOptions {
  baseUrl?: string;
  token?: string;
  interactive?: boolean;
}

async function interactiveInit(): Promise<CliConfig> {
  info("未检测到配置，启动初始化…\n");
  const baseUrl = await input({
    message: "Blog API URL (例如 https://www.zorazora.cn/api):",
    validate: (v) => (/^https?:\/\/.+/.test(v.trim()) ? true : "需要完整 URL 含 http(s)://"),
  });
  const token = await password({
    message: "API Token (zora_xxx):",
    mask: "*",
    validate: (v) => (v.trim().length > 0 ? true : "不能为空"),
  });
  const config: CliConfig = { baseUrl: baseUrl.trim(), token: token.trim() };

  // 验证
  try {
    const sdk = new ZoraBlog(config);
    await sdk.categories.list();
  } catch (err) {
    const msg = err instanceof ZoraApiError ? `code=${err.code} ${err.message}` : String(err);
    error(`验证失败：${msg}`);
    const retry = await confirm({ message: "要不要重新输入？", default: true });
    if (retry) return interactiveInit();
    process.exit(4);
  }

  const file = saveConfig(config);
  success(`验证通过，配置已保存到 ${file}`);
  return config;
}

export async function getConfig(
  opts: CliGlobalOptions,
  { allowInit = true }: { allowInit?: boolean } = {},
): Promise<CliConfig> {
  const resolved = resolveConfig({ baseUrl: opts.baseUrl, token: opts.token });
  if (resolved) return resolved;

  const existing = loadConfig();
  if (existing) return existing;

  if (!allowInit || opts.interactive === false) {
    error("缺少配置。使用 `zora-blog auth login` 初始化，或设置 ZORA_BASE_URL/ZORA_TOKEN");
    process.exit(4);
  }

  return interactiveInit();
}

export async function getSdk(opts: CliGlobalOptions): Promise<ZoraBlog> {
  const config = await getConfig(opts);
  return new ZoraBlog(config);
}

export function handleApiError(err: unknown): never {
  if (err instanceof ZoraApiError) {
    error(`API 错误 (code=${err.code}): ${err.message}`);
    process.exit(err.code === 401 || err.code === 403 ? 4 : 1);
  }
  error(String(err));
  process.exit(1);
}
