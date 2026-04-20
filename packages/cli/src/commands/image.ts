import { Command } from "commander";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { getSdk, handleApiError, type CliGlobalOptions } from "../context.js";
import { success, error, info, printJson, parseJsonFields } from "../ui.js";

const MIME_BY_EXT: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
};

function parentOpts(cmd: Command): CliGlobalOptions {
  let c: Command | null | undefined = cmd;
  while (c && !c.opts().baseUrl && !c.opts().token && c.parent) c = c.parent;
  return (c?.opts() as CliGlobalOptions) ?? {};
}

export function createImageCommand(): Command {
  const cmd = new Command("image").description("图片上传");

  cmd
    .command("upload <file>")
    .description("上传单张图片到七牛，返回 CDN URL")
    .option("--json [fields]")
    .action(async (file: string, options, cmdCtx) => {
      const sdk = await getSdk(parentOpts(cmdCtx));
      try {
        const abs = path.resolve(file);
        const s = await stat(abs);
        if (!s.isFile()) {
          error("不是文件");
          process.exit(1);
        }
        const ext = path.extname(abs).toLowerCase();
        const mime = MIME_BY_EXT[ext];
        if (!mime) {
          error(`不支持的扩展名 ${ext}（需 jpg/png/webp/gif）`);
          process.exit(1);
        }
        const buffer = await readFile(abs);
        const result = await sdk.uploads.upload({
          data: buffer,
          filename: path.basename(abs),
          mimeType: mime,
        });
        if (options.json !== undefined) {
          printJson(result, parseJsonFields(options.json));
          return;
        }
        info(`key:      ${result.key}`);
        info(`filename: ${result.filename}`);
        success(result.url);
      } catch (err) {
        handleApiError(err);
      }
    });

  return cmd;
}
