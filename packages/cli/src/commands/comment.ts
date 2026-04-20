import { Command } from "commander";
import { getSdk, handleApiError, type CliGlobalOptions } from "../context.js";
import { printTable, printJson, success, info, parseJsonFields } from "../ui.js";

function parentOpts(cmd: Command): CliGlobalOptions {
  let c: Command | null | undefined = cmd;
  while (c && !c.opts().baseUrl && !c.opts().token && c.parent) c = c.parent;
  return (c?.opts() as CliGlobalOptions) ?? {};
}

export function createCommentCommand(): Command {
  const cmd = new Command("comment").description("评论管理");

  cmd
    .command("list")
    .option("--status <status>", "pending|approved|rejected|all", "all")
    .option("--article <id>", "按文章筛选")
    .option("--limit <n>", "每页", "20")
    .option("--json [fields]")
    .action(async (options, cmdCtx) => {
      const sdk = await getSdk(parentOpts(cmdCtx));
      try {
        const r = await sdk.comments.list({
          status: options.status,
          articleId: options.article ? Number(options.article) : undefined,
          limit: Number(options.limit),
        });
        if (options.json !== undefined) {
          printJson(r.items, parseJsonFields(options.json));
          return;
        }
        printTable(
          r.items.map((c) => ({
            id: c.id,
            status: c.status,
            nickname: c.nickname,
            article: c.article.slug,
            content: c.content.slice(0, 30),
            created: c.createdAt.slice(0, 10),
          })),
        );
        info(`统计：total=${r.stats.total} pending=${r.stats.pending} approved=${r.stats.approved} rejected=${r.stats.rejected}`);
      } catch (err) {
        handleApiError(err);
      }
    });

  cmd
    .command("approve <id>")
    .action(async (id: string, _options, cmdCtx) => {
      const sdk = await getSdk(parentOpts(cmdCtx));
      try {
        const c = await sdk.comments.moderate(Number(id), "approved");
        success(`评论 ${c.id} 已通过`);
      } catch (err) {
        handleApiError(err);
      }
    });

  cmd
    .command("reject <id>")
    .action(async (id: string, _options, cmdCtx) => {
      const sdk = await getSdk(parentOpts(cmdCtx));
      try {
        const c = await sdk.comments.moderate(Number(id), "rejected");
        success(`评论 ${c.id} 已驳回`);
      } catch (err) {
        handleApiError(err);
      }
    });

  cmd
    .command("delete <id>")
    .action(async (id: string, _options, cmdCtx) => {
      const sdk = await getSdk(parentOpts(cmdCtx));
      try {
        await sdk.comments.delete(Number(id));
        success(`已删除 ${id}`);
      } catch (err) {
        handleApiError(err);
      }
    });

  return cmd;
}
