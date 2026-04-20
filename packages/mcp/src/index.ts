#!/usr/bin/env node
import { ZoraBlog } from "@zora-blog/sdk";
import { buildMcpServer } from "./server.js";

function parseArgs(argv: string[]) {
  const args: { http: boolean; port: number; host: string; baseUrl?: string; token?: string } = {
    http: false,
    port: 3030,
    host: "127.0.0.1",
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]!;
    if (a === "--http") args.http = true;
    else if (a === "--port") args.port = Number(argv[++i]);
    else if (a === "--host") args.host = String(argv[++i]);
    else if (a === "--base-url") args.baseUrl = String(argv[++i]);
    else if (a === "--token") args.token = String(argv[++i]);
    else if (a === "--help" || a === "-h") {
      console.log(
        `Usage: zora-blog-mcp [options]
  --http               启用 HTTP (Streamable) 传输，默认 stdio
  --port <n>           HTTP 端口（默认 3030）
  --host <h>           HTTP 监听地址（默认 127.0.0.1）
  --base-url <url>     覆盖 ZORA_BASE_URL
  --token <t>          覆盖 ZORA_TOKEN
`,
      );
      process.exit(0);
    }
  }
  return args;
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const baseUrl = opts.baseUrl ?? process.env.ZORA_BASE_URL;
  const token = opts.token ?? process.env.ZORA_TOKEN;
  if (!baseUrl || !token) {
    console.error("需要 ZORA_BASE_URL 和 ZORA_TOKEN（或 --base-url / --token）");
    process.exit(4);
  }
  const sdk = new ZoraBlog({ baseUrl, token });
  const server = buildMcpServer(sdk);

  if (opts.http) {
    const { StreamableHTTPServerTransport } = await import(
      "@modelcontextprotocol/sdk/server/streamableHttp.js"
    );
    const http = await import("node:http");
    const { randomUUID } = await import("node:crypto");

    const transports = new Map<string, InstanceType<typeof StreamableHTTPServerTransport>>();

    const httpServer = http.createServer(async (req, res) => {
      if (!req.url?.startsWith("/mcp")) {
        res.statusCode = 404;
        res.end("Not found");
        return;
      }
      const sessionId = req.headers["mcp-session-id"] as string | undefined;
      let transport = sessionId ? transports.get(sessionId) : undefined;

      if (!transport) {
        transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => randomUUID(),
          onsessioninitialized: (id) => {
            transports.set(id, transport!);
          },
        });
        transport.onclose = () => {
          if (transport?.sessionId) transports.delete(transport.sessionId);
        };
        await server.connect(transport);
      }

      // 读取请求体
      let body: unknown = undefined;
      if (req.method === "POST") {
        const chunks: Buffer[] = [];
        for await (const c of req) chunks.push(c as Buffer);
        const raw = Buffer.concat(chunks).toString("utf8");
        try {
          body = raw ? JSON.parse(raw) : undefined;
        } catch {
          res.statusCode = 400;
          res.end("Invalid JSON");
          return;
        }
      }
      try {
        await transport.handleRequest(req, res, body);
      } catch (err) {
        console.error("[mcp http] request error:", err);
        if (!res.headersSent) {
          res.statusCode = 500;
          res.end("Internal error");
        }
      }
    });

    httpServer.listen(opts.port, opts.host, () => {
      console.error(`[zora-blog-mcp] HTTP listening on http://${opts.host}:${opts.port}/mcp`);
    });
  } else {
    const { StdioServerTransport } = await import("@modelcontextprotocol/sdk/server/stdio.js");
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("[zora-blog-mcp] stdio transport ready");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
