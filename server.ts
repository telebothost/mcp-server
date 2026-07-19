/**
 * Generic Node.js HTTP server entry point.
 *
 * Used for self-hosting on platforms that aren't Vercel — Render, Railway,
 * Fly.io, DigitalOcean App Platform, or any plain Node host.
 *
 * - Vercel: uses `api/mcp.ts` (serverless function) — this file is ignored.
 * - Other platforms: run `npm start` which invokes this file.
 *
 * Listens on $PORT (defaults to 3000). Implements the same JSON-RPC 2.0
 * over HTTP POST protocol as the Vercel endpoint.
 */

import http from "node:http";
import { TbhClient } from "./lib/client.js";
import { TbhApiError } from "./lib/types.js";
import { allTools } from "./lib/tools.js";
import { generateDocsHtml, generateHealthJson, resolveRequestOrigin } from "./lib/docs.js";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SERVER_NAME = "telebothost-mcp";
const SERVER_VERSION = "2.0.0";
const PROTOCOL_VERSION = "2024-11-05";

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Tbh-Api-Key, MCP-Session-Id, MCP-Protocol-Version",
};

// ---------------------------------------------------------------------------
// HTTP server
// ---------------------------------------------------------------------------

const PORT = parseInt(process.env.PORT ?? "3000", 10);

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);
  const path = url.pathname;
  const origin = resolveRequestOrigin(req.headers);

  // ─── CORS preflight ───
  if (req.method === "OPTIONS") {
    for (const [k, v] of Object.entries(CORS_HEADERS)) res.setHeader(k, v);
    res.writeHead(204);
    res.end();
    return;
  }

  // ─── GET routes: docs + health ───
  if (req.method === "GET") {
    // Health endpoint
    if (path === "/api/health" || path === "/health") {
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
      res.end(generateHealthJson(origin));
      return;
    }
    // Docs endpoint (root + /docs)
    if (path === "/" || path === "/docs" || path === "/index.html") {
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, max-age=300" });
      res.end(generateDocsHtml(origin));
      return;
    }
    // MCP Streamable HTTP: clients probe GET for an SSE stream. This server is
    // stateless (POST-only). MCP spec requires 405 here — 404 makes Cursor fail.
    if (path === "/api/mcp" || path === "/mcp") {
      for (const [k, v] of Object.entries(CORS_HEADERS)) res.setHeader(k, v);
      res.writeHead(405, { "Content-Type": "application/json", Allow: "POST, OPTIONS" });
      res.end(
        JSON.stringify({
          error: "Method not allowed",
          hint: "Stateless MCP endpoint — use POST. SSE streaming (GET) is not supported.",
        }),
      );
      return;
    }
    // Unknown GET → 404 with helpful message
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Not found", hint: "POST to /api/mcp for MCP, GET / for docs" }));
    return;
  }

  // ─── MCP endpoint (POST /api/mcp or /) ───
  if (req.method !== "POST") {
    for (const [k, v] of Object.entries(CORS_HEADERS)) res.setHeader(k, v);
    res.writeHead(405, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Method not allowed. Use POST." }));
    return;
  }

  // Optional MCP-level auth
  const mcpToken = process.env.MCP_AUTH_TOKEN;
  if (mcpToken) {
    const auth = req.headers["authorization"] ?? "";
    if (auth !== `Bearer ${mcpToken}`) {
      for (const [k, v] of Object.entries(CORS_HEADERS)) res.setHeader(k, v);
      res.writeHead(401, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Unauthorized" }));
      return;
    }
  }

  // Read body
  let bodyStr = "";
  for await (const chunk of req) bodyStr += chunk;

  let msg: {
    jsonrpc?: string;
    id?: string | number | null;
    method?: string;
    params?: Record<string, unknown>;
  };
  try {
    msg = JSON.parse(bodyStr);
  } catch {
    sendRpc(res, null, -32700, "Parse error: invalid JSON");
    return;
  }

  if (!msg || msg.jsonrpc !== "2.0" || !msg.method) {
    sendRpc(res, msg?.id ?? null, -32600, "Invalid Request: jsonrpc must be '2.0' and method is required");
    return;
  }

  const id = msg.id ?? null;
  for (const [k, v] of Object.entries(CORS_HEADERS)) res.setHeader(k, v);

  try {
    // Notifications (no response)
    if (msg.method.startsWith("notifications/")) {
      res.writeHead(202);
      res.end();
      return;
    }

    // initialize
    if (msg.method === "initialize") {
      sendResult(res, id, {
        protocolVersion: PROTOCOL_VERSION,
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: SERVER_NAME, version: SERVER_VERSION },
      });
      return;
    }

    // ping
    if (msg.method === "ping") {
      sendResult(res, id, {});
      return;
    }

    // tools/list
    if (msg.method === "tools/list") {
      sendResult(res, id, {
        tools: allTools.map((t) => ({
          name: t.name,
          description: t.description,
          inputSchema: t.inputSchema,
        })),
      });
      return;
    }

    // tools/call
    if (msg.method === "tools/call") {
      const params = msg.params ?? {};
      const name = params.name as string;
      const args = (params.arguments as Record<string, unknown>) ?? {};

      const tool = allTools.find((t) => t.name === name);
      if (!tool) {
        sendRpc(res, id, -32602, `Unknown tool: ${name}`);
        return;
      }

      // Per-request API key resolution (priority order):
      //   1. X-Tbh-Api-Key header (per-call, user's own key)
      //   2. Authorization header IF it looks like a TBH key (sk_* or pub_*)
      //      and MCP_AUTH_TOKEN is NOT set (otherwise Authorization is for MCP auth)
      //   3. TELEBOTHOST_API_KEY env var (server-side fallback)
      const headerKey = (req.headers["x-tbh-api-key"] as string | undefined) ?? undefined;
      let authHeaderKey: string | undefined;
      if (!process.env.MCP_AUTH_TOKEN) {
        const auth = req.headers["authorization"] ?? "";
        if (auth.startsWith("Bearer sk_") || auth.startsWith("Bearer pub_")) {
          authHeaderKey = auth.slice(7);
        }
      }
      const client = new TbhClient({
        apiKey: headerKey ?? authHeaderKey ?? process.env.TELEBOTHOST_API_KEY,
      });

      try {
        const result = await tool.handler(args, client);
        sendResult(res, id, result);
        return;
      } catch (err) {
        if (err instanceof TbhApiError) {
          const detail = err.data ? `\n${JSON.stringify(err.data, null, 2)}` : "";
          sendResult(res, id, {
            content: [{ type: "text", text: `TeleBotHost API error ${err.status}: ${err.message}${detail}` }],
            isError: true,
          });
          return;
        }
        sendResult(res, id, {
          content: [{ type: "text", text: `Error: ${(err as Error).message}` }],
          isError: true,
        });
        return;
      }
    }

    // Unknown method
    sendRpc(res, id, -32601, `Method not found: ${msg.method}`);
  } catch (err) {
    sendRpc(res, id, -32603, `Internal error: ${(err as Error).message}`);
  }
});

server.listen(PORT, () => {
  console.log(`[${SERVER_NAME} v${SERVER_VERSION}] MCP server listening on :${PORT}`);
  if (process.env.TELEBOTHOST_API_KEY) {
    console.log("  TELEBOTHOST_API_KEY is set — will be used as fallback for requests without per-call key.");
  } else {
    console.log("  TELEBOTHOST_API_KEY not set — clients must pass their own key via X-Tbh-Api-Key header.");
  }
});

// ---------------------------------------------------------------------------
// Response helpers
// ---------------------------------------------------------------------------

function sendResult(res: http.ServerResponse, id: string | number | null, result: unknown): void {
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ jsonrpc: "2.0", id, result }));
}

function sendRpc(
  res: http.ServerResponse,
  id: string | number | null,
  code: number,
  message: string,
): void {
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ jsonrpc: "2.0", id, error: { code, message } }));
}
