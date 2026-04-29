import { Command } from "commander";
import { getSdk, handleApiError, type CliGlobalOptions } from "../context.js";
import { printTable, printJson, success, parseJsonFields } from "../ui.js";

function parentOpts(cmd: Command): CliGlobalOptions {
  let c: Command | null | undefined = cmd;
  while (c && !c.opts().baseUrl && !c.opts().token && c.parent) c = c.parent;
  return (c?.opts() as CliGlobalOptions) ?? {};
}

export function createCategoryCommand(): Command {
  const cmd = new Command("category").description("分类管理");

  cmd
    .command("list")
    .option("--json [fields]")
    .action(async (options, cmdCtx) => {
      const sdk = await getSdk(parentOpts(cmdCtx));
      try {
        const list = await sdk.categories.list();
        if (options.json !== undefined) {
          printJson(list, parseJsonFields(options.json));
          return;
        }
        printTable(list.map((c) => ({ id: c.id, name: c.name, slug: c.slug, articles: c.articleCount })));
      } catch (err) {
        handleApiError(err);
      }
    });

  cmd
    .command("create <name>")
    .option("--slug <slug>")
    .option("--description <text>")
    .action(async (name: string, options, cmdCtx) => {
      const sdk = await getSdk(parentOpts(cmdCtx));
      try {
        const c = await sdk.categories.create({ name, slug: options.slug, description: options.description });
        success(`已创建 id=${c.id} slug=${c.slug}`);
      } catch (err) {
        handleApiError(err);
      }
    });

  cmd
    .command("delete <id>")
    .action(async (id: string, _options, cmdCtx) => {
      const sdk = await getSdk(parentOpts(cmdCtx));
      try {
        await sdk.categories.delete(Number(id));
        success(`已删除 id=${id}`);
      } catch (err) {
        handleApiError(err);
      }
    });

  return cmd;
}

export function createTagCommand(): Command {
  const cmd = new Command("tag").description("标签管理");

  cmd
    .command("list")
    .option("--json [fields]")
    .action(async (options, cmdCtx) => {
      const sdk = await getSdk(parentOpts(cmdCtx));
      try {
        const list = await sdk.tags.list();
        if (options.json !== undefined) {
          printJson(list, parseJsonFields(options.json));
          return;
        }
        printTable(list.map((t) => ({ id: t.id, name: t.name, slug: t.slug, articles: t.articleCount })));
      } catch (err) {
        handleApiError(err);
      }
    });

  cmd
    .command("create <name>")
    .option("--slug <slug>")
    .action(async (name: string, options, cmdCtx) => {
      const sdk = await getSdk(parentOpts(cmdCtx));
      try {
        const t = await sdk.tags.create({ name, slug: options.slug });
        success(`已创建 id=${t.id} slug=${t.slug}`);
      } catch (err) {
        handleApiError(err);
      }
    });

  cmd
    .command("delete <id>")
    .action(async (id: string, _options, cmdCtx) => {
      const sdk = await getSdk(parentOpts(cmdCtx));
      try {
        await sdk.tags.delete(Number(id));
        success(`已删除 id=${id}`);
      } catch (err) {
        handleApiError(err);
      }
    });

  cmd
    .command("rename <id> <newName>")
    .description("重命名标签")
    .option("--slug <slug>", "自定义 slug（默认从名称生成）")
    .action(async (id: string, newName: string, options, cmdCtx) => {
      const sdk = await getSdk(parentOpts(cmdCtx));
      try {
        const t = await sdk.tags.update(Number(id), { name: newName, slug: options.slug });
        success(`已重命名 id=${t.id} name=${t.name} slug=${t.slug}`);
      } catch (err) {
        handleApiError(err);
      }
    });

  cmd
    .command("merge <sourceId> <targetId>")
    .description("合并标签：将源标签的文章迁移到目标标签，然后删除源标签")
    .action(async (sourceId: string, targetId: string, _options, cmdCtx) => {
      const sdk = await getSdk(parentOpts(cmdCtx));
      try {
        const result = await sdk.tags.merge(Number(sourceId), Number(targetId));
        success(`已合并：源标签 ${result.sourceId} → 目标标签 ${result.targetId}，迁移了 ${result.migratedCount} 篇文章`);
      } catch (err) {
        handleApiError(err);
      }
    });

  return cmd;
}

export function createTopicCommand(): Command {
  const cmd = new Command("topic").description("专题管理");

  cmd
    .command("list")
    .option("--json [fields]")
    .action(async (options, cmdCtx) => {
      const sdk = await getSdk(parentOpts(cmdCtx));
      try {
        const list = await sdk.topics.list();
        if (options.json !== undefined) {
          printJson(list, parseJsonFields(options.json));
          return;
        }
        printTable(list.map((t) => ({ id: t.id, title: t.title, slug: t.slug, articles: t.articleCount })));
      } catch (err) {
        handleApiError(err);
      }
    });

  cmd
    .command("delete <id>")
    .action(async (id: string, _options, cmdCtx) => {
      const sdk = await getSdk(parentOpts(cmdCtx));
      try {
        await sdk.topics.delete(Number(id));
        success(`已删除 id=${id}`);
      } catch (err) {
        handleApiError(err);
      }
    });

  return cmd;
}
