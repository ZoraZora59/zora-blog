#!/usr/bin/env node
import { Command } from "commander";
import { createAuthCommand } from "./commands/auth.js";
import { createArticleCommand } from "./commands/article.js";
import {
  createCategoryCommand,
  createTagCommand,
  createTopicCommand,
} from "./commands/taxonomy.js";
import { createCommentCommand } from "./commands/comment.js";
import { createImageCommand } from "./commands/image.js";
import { createConfigCommand } from "./commands/config.js";

const program = new Command();
program
  .name("zora-blog")
  .description("Zora Blog CLI — 管理博客的文章、标签、评论、图片")
  .version("0.1.0")
  .option("--base-url <url>", "API base URL（覆盖配置 + 环境变量）")
  .option("--token <token>", "Bearer Token（覆盖配置 + 环境变量）")
  .option("--no-interactive", "禁用交互式首次初始化");

program.addCommand(createAuthCommand());
program.addCommand(createArticleCommand());
program.addCommand(createCategoryCommand());
program.addCommand(createTagCommand());
program.addCommand(createTopicCommand());
program.addCommand(createCommentCommand());
program.addCommand(createImageCommand());
program.addCommand(createConfigCommand());

program.parseAsync(process.argv).catch((err) => {
  console.error(err);
  process.exit(1);
});
