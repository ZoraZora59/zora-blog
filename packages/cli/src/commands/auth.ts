import { Command } from "commander";
import { ZoraBlog, ZoraApiError } from "@zora-blog/sdk";
import { loadConfig, saveConfig, type CliConfig } from "../config.js";
import { handleApiError, type CliGlobalOptions } from "../context.js";
import { success, info, error } from "../ui.js";
import { existsSync, rmSync } from "node:fs";
import { configPath } from "../config.js";

export function createAuthCommand(): Command {
  const cmd = new Command("auth").description("登录、查看、清除凭证");

  cmd
    .command("login")
    .description("保存 API URL 和 Token（覆盖已有配置）")
    .option("--url <url>", "API base URL")
    .option("--token <token>", "Bearer token")
    .action(async (options: { url?: string; token?: string }, cmdCtx: Command) => {
      const parent = cmdCtx.parent?.parent?.opts() as CliGlobalOptions;
      const { input, password } = await import("@inquirer/prompts");
      const url =
        options.url ??
        parent?.baseUrl ??
        (await input({
          message: "Blog API URL:",
          validate: (v) => /^https?:\/\/.+/.test(v.trim()) || "需要完整 URL",
        }));
      const token =
        options.token ??
        parent?.token ??
        (await password({
          message: "API Token:",
          mask: "*",
          validate: (v) => v.trim().length > 0 || "不能为空",
        }));
      const config: CliConfig = { baseUrl: url.trim(), token: token.trim() };
      try {
        const sdk = new ZoraBlog(config);
        await sdk.categories.list();
      } catch (err) {
        if (err instanceof ZoraApiError) {
          error(`验证失败：code=${err.code} ${err.message}`);
          process.exit(4);
        }
        handleApiError(err);
      }
      const file = saveConfig(config);
      success(`已保存到 ${file}`);
    });

  cmd
    .command("status")
    .description("显示当前配置（隐藏 token）")
    .action(async () => {
      const config = loadConfig();
      if (!config) {
        info("尚未配置，请运行 `zora-blog auth login`");
        return;
      }
      const masked = config.token.length > 10
        ? `${config.token.slice(0, 5)}…${config.token.slice(-4)}`
        : "***";
      console.log(`URL:   ${config.baseUrl}`);
      console.log(`Token: ${masked}`);
      try {
        const sdk = new ZoraBlog(config);
        const cats = await sdk.categories.list();
        success(`连接正常（分类 ${cats.length} 项）`);
      } catch (err) {
        if (err instanceof ZoraApiError) {
          error(`API 验证失败：code=${err.code} ${err.message}`);
          process.exitCode = 4;
        } else {
          handleApiError(err);
        }
      }
    });

  cmd
    .command("logout")
    .description("删除本地配置文件")
    .action(() => {
      const file = configPath();
      if (existsSync(file)) {
        rmSync(file);
        success(`已删除 ${file}`);
      } else {
        info("本来就没有配置文件");
      }
    });

  return cmd;
}
