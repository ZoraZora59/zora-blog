import { Command } from "commander";
import { loadConfig, saveConfig, configPath } from "../config.js";
import { success, info, error } from "../ui.js";

export function createConfigCommand(): Command {
  const cmd = new Command("config").description("查看/修改本地配置");

  cmd
    .command("show")
    .description("显示配置文件内容（token 会遮蔽）")
    .action(() => {
      const c = loadConfig();
      if (!c) {
        info("尚未初始化");
        return;
      }
      console.log(`path:  ${configPath()}`);
      console.log(`url:   ${c.baseUrl}`);
      console.log(`token: ${c.token.slice(0, 5)}…${c.token.slice(-4)}`);
    });

  cmd
    .command("set <key> <value>")
    .description("修改单个字段：url 或 token")
    .action((key: string, value: string) => {
      const existing = loadConfig();
      if (!existing) {
        error("请先运行 `zora-blog auth login`");
        process.exit(4);
      }
      const next = { ...existing };
      if (key === "url") next.baseUrl = value;
      else if (key === "token") next.token = value;
      else {
        error(`未知字段：${key}（支持 url / token）`);
        process.exit(2);
      }
      saveConfig(next);
      success(`已更新 ${key}`);
    });

  return cmd;
}
