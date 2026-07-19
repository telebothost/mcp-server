/**
 * TeleBotHost MCP Server — Vercel Serverless Endpoint.
 *
 * Implements the MCP Streamable HTTP transport (JSON-RPC 2.0 over HTTP POST)
 * using Vercel's traditional (req, res) handler pattern for maximum reliability.
 *
 * POST /api/mcp  →  JSON-RPC request → JSON-RPC response
 *
 * Supported methods: initialize, ping, tools/list, tools/call
 *
 * Auth:
 *   - Optional MCP_AUTH_TOKEN env var: if set, clients must send
 *     "Authorization: Bearer <MCP_AUTH_TOKEN>" to access the MCP.
 *   - TELEBOTHOST_API_KEY env var: used by the TBH client for upstream calls.
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { TbhClient } from "../lib/client.js";
import { TbhApiError } from "../lib/types.js";
import { allTools } from "../lib/tools.js";

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
// Vercel serverless entry point (traditional req/res pattern)
// ---------------------------------------------------------------------------

export const config = { maxDuration: 60 };

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  // CORS preflight
  if (req.method === "OPTIONS") {
    for (const [k, v] of Object.entries(CORS_HEADERS)) res.setHeader(k, v);
    res.status(204).end();
    return;
  }

  if (req.method !== "POST") {
    for (const [k, v] of Object.entries(CORS_HEADERS)) res.setHeader(k, v);
    res.setHeader("Allow", "POST, OPTIONS");
    res.status(405).json({
      error: "Method not allowed",
      hint: "Stateless MCP endpoint — use POST. SSE streaming (GET) is not supported.",
    });
    return;
  }

  // Optional MCP-level auth
  const mcpToken = process.env.MCP_AUTH_TOKEN;
  if (mcpToken) {
    const auth = req.headers["authorization"] ?? "";
    if (auth !== `Bearer ${mcpToken}`) {
      for (const [k, v] of Object.entries(CORS_HEADERS)) res.setHeader(k, v);
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
  }

  // Set CORS headers on all responses
  for (const [k, v] of Object.entries(CORS_HEADERS)) res.setHeader(k, v);

  // Parse JSON-RPC body
  const msg = req.body as {
    jsonrpc?: string;
    id?: string | number | null;
    method?: string;
    params?: Record<string, unknown>;
  };

  if (!msg || msg.jsonrpc !== "2.0" || !msg.method) {
    rpcError(res, msg?.id ?? null, -32600, "Invalid Request: jsonrpc must be '2.0' and method is required");
    return;
  }

  const id = msg.id ?? null;

  // Route to handler
  try {
    // --- notifications (no response) ---
    if (msg.method.startsWith("notifications/")) {
      res.status(202).end();
      return;
    }

    // --- initialize ---
    if (msg.method === "initialize") {
      rpcResult(res, id, {
        protocolVersion: PROTOCOL_VERSION,
        capabilities: {
          tools: { listChanged: false },
        },
        serverInfo: { name: SERVER_NAME, version: SERVER_VERSION },
      });
      return;
    }

    // --- ping ---
    if (msg.method === "ping") {
      rpcResult(res, id, {});
      return;
    }

    // --- tools/list ---
    if (msg.method === "tools/list") {
      rpcResult(res, id, {
        tools: allTools.map((t) => ({
          name: t.name,
          description: t.description,
          inputSchema: t.inputSchema,
        })),
      });
      return;
    }

    // --- tools/call ---
    if (msg.method === "tools/call") {
      const params = msg.params ?? {};
      const name = params.name as string;
      const args = (params.arguments as Record<string, unknown>) ?? {};

      const tool = allTools.find((t) => t.name === name);
      if (!tool) {
        rpcError(res, id, -32602, `Unknown tool: ${name}`);
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
        rpcResult(res, id, result);
        return;
      } catch (err) {
        if (err instanceof TbhApiError) {
          const detail = err.data ? `\n${JSON.stringify(err.data, null, 2)}` : "";
          rpcResult(res, id, {
            content: [
              {
                type: "text",
                text: `TeleBotHost API error ${err.status}: ${err.message}${detail}`,
              },
            ],
            isError: true,
          });
          return;
        }
        rpcResult(res, id, {
          content: [{ type: "text", text: `Error: ${(err as Error).message}` }],
          isError: true,
        });
        return;
      }
    }

    // --- unknown method ---
    rpcError(res, id, -32601, `Method not found: ${msg.method}`);
  } catch (err) {
    rpcError(res, id, -32603, `Internal error: ${(err as Error).message}`);
  }
}

// ---------------------------------------------------------------------------
// JSON-RPC response helpers
// ---------------------------------------------------------------------------

function rpcResult(res: VercelResponse, id: string | number | null, result: unknown): void {
  res.status(200).json({ jsonrpc: "2.0", id, result });
}

function rpcError(
  res: VercelResponse,
  id: string | number | null,
  code: number,
  message: string,
): void {
  res.status(200).json({ jsonrpc: "2.0", id, error: { code, message } });
}
