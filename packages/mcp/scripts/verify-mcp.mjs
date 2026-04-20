/**
 * Phase 4 MCP 验证。
 * 1) 启动 stdio 模式，列出 tools，调用 list_articles / list_taxonomy
 * 2) 启动 HTTP 模式，连接，列出 tools，调用一次
 */
import { spawn } from "node:child_process";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MCP_BIN = path.resolve(__dirname, "../dist/index.js");

const baseUrl = process.env.ZORA_BASE_URL;
const token = process.env.ZORA_TOKEN;
if (!baseUrl || !token) {
  console.error("缺少 ZORA_BASE_URL / ZORA_TOKEN");
  process.exit(1);
}

const results = [];
function log(name, ok, detail = "") {
  results.push({ name, ok });
  console.log(`${ok ? "✓" : "✗"} ${name}${detail ? "  " + detail : ""}`);
}

async function verifyStdio() {
  console.log("\n== stdio 模式 ==");
  const client = new Client({ name: "verify", version: "0.0.0" }, { capabilities: {} });
  const transport = new StdioClientTransport({
    command: "node",
    args: [MCP_BIN],
    env: { ...process.env, ZORA_BASE_URL: baseUrl, ZORA_TOKEN: token },
  });
  await client.connect(transport);

  const tools = await client.listTools();
  log("listTools 返回非空", tools.tools.length >= 8, `count=${tools.tools.length}`);
  const names = tools.tools.map((t) => t.name).sort();
  console.log("  tools:", names.join(", "));
  const expected = [
    "list_articles",
    "get_article",
    "create_article",
    "update_article",
    "delete_article",
    "upload_image",
    "list_taxonomy",
    "list_pending_comments",
    "moderate_comment",
  ];
  for (const name of expected) {
    log(`tool 存在：${name}`, names.includes(name));
  }

  const res1 = await client.callTool({
    name: "list_articles",
    arguments: { status: "all", limit: 3 },
  });
  log(
    "调用 list_articles 成功",
    !res1.isError && Array.isArray(res1.content) && res1.content[0]?.type === "text",
  );

  const res2 = await client.callTool({
    name: "list_taxonomy",
    arguments: { type: "category" },
  });
  log("调用 list_taxonomy(category) 成功", !res2.isError);

  const res3 = await client.callTool({
    name: "get_article",
    arguments: { id: 1 },
  });
  log("调用 get_article 成功", !res3.isError);

  await client.close();
}

async function verifyHttp() {
  console.log("\n== HTTP 模式 ==");
  const server = spawn(
    "node",
    [MCP_BIN, "--http", "--port", "3301", "--host", "127.0.0.1"],
    {
      env: { ...process.env, ZORA_BASE_URL: baseUrl, ZORA_TOKEN: token },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  server.stderr.on("data", (b) => process.stderr.write(`[srv] ${b}`));

  // 等端口起来
  await new Promise((r) => setTimeout(r, 800));

  const client = new Client({ name: "verify-http", version: "0.0.0" }, { capabilities: {} });
  const transport = new StreamableHTTPClientTransport(new URL("http://127.0.0.1:3301/mcp"));
  try {
    await client.connect(transport);
    const tools = await client.listTools();
    log("HTTP listTools 非空", tools.tools.length >= 8, `count=${tools.tools.length}`);

    const res = await client.callTool({
      name: "list_taxonomy",
      arguments: { type: "tag" },
    });
    log("HTTP list_taxonomy(tag) 成功", !res.isError);

    // 测试上传：base64 模式
    const TINY_PNG =
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
    const upRes = await client.callTool({
      name: "upload_image",
      arguments: {
        base64: TINY_PNG,
        mime_type: "image/png",
        filename: `mcp-verify-${Date.now()}.png`,
      },
    });
    const upText = upRes.content?.[0]?.text ?? "";
    const upOk = !upRes.isError && upText.includes("https://");
    log("HTTP upload_image(base64) 成功", upOk, upOk ? upText.split("\n")[3]?.trim() ?? "" : upText);

    await client.close();
  } finally {
    server.kill();
    await new Promise((r) => setTimeout(r, 100));
  }
}

async function main() {
  await verifyStdio();
  await verifyHttp();
  const ok = results.filter((r) => r.ok).length;
  const fail = results.length - ok;
  console.log(`\n== 通过 ${ok} / 失败 ${fail} ==`);
  if (fail > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
