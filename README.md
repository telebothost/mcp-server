# TeleBotHost MCP Server

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/telebothost/mcp-server&env=TELEBOTHOST_API_KEY&envDescription=Your%20TeleBotHost%20Developer%20API%20key&project-name=telebothost-mcp)
[![MCP](https://img.shields.io/badge/MCP-2024--11--05-blue.svg)](https://modelcontextprotocol.io)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178c6.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-%E2%89%A520-339933.svg)](https://nodejs.org/)

**A [Model Context Protocol](https://modelcontextprotocol.io) server for the [TeleBotHost Developer API](https://telebothost.com) — 68 tools to manage Telegram bots from AI assistants like Claude, Cursor, and Copilot.**

---

## Features

- **68 Tools** — Full coverage of the TeleBotHost Developer API + 3 docs search tools
- **Multi-Platform** — Deploys on Vercel, Render, Railway, Fly.io, or any Node host
- **Secure** — Bearer token auth, optional MCP endpoint protection, key-tier awareness (`sk_*` vs `pub_*`)
- **Resilient** — Automatic 429 retry with exponential backoff, rate-limit header tracking
- **Binary-Safe** — Base64-encoded ZIP download/upload for `download_bot` and `import_bot`
- **Safe by Design** — Broadcast tool requires explicit `confirm: true` flag
- **Tested** — Compliance test suite verifies MCP spec adherence (`scripts/test-mcp.sh`)
- **Type-Safe** — Strict TypeScript throughout, clean compile
- **Zero-Config** — Single env var (`TELEBOTHOST_API_KEY`) to get started

---

## Table of Contents

- [Architecture](#architecture)
- [Quick Start](#quick-start)
- [Deployment](#deployment)
  - [Vercel](#vercel-recommended)
  - [Render](#render)
  - [Railway / Fly.io / Self-Host](#railway--flyio--self-host)
- [Connecting Your AI Client](#connecting-your-ai-client)
- [Available Tools (68)](#available-tools-68)
- [MCP Protocol](#mcp-protocol)
- [Error Handling](#error-handling)
- [Testing](#testing)
- [API Coverage](#api-coverage)
- [Environment Variables](#environment-variables)
- [Rate Limits](#rate-limits)
- [Local Development](#local-development)
- [Project Structure](#project-structure)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)

---

## Architecture

```
┌─────────────────┐      POST /api/mcp       ┌─────────────────────┐      Bearer sk_*      ┌─────────────────────┐
│                 │      JSON-RPC 2.0        │  MCP Server         │      HTTPS            │  TeleBotHost API    │
│  Claude Desktop │  ───────────────────▶   │  (stateless)        │  ───────────────────▶ │  api.telebothost.com│
│  Cursor         │                          │  68 tools           │                       │                     │
│  Continue       │  ◀───────────────────   │  JSON-RPC router    │  ◀─────────────────── │  64 endpoints       │
│  Cline          │      JSON response      │  TBH API client     │      JSON             │                     │
└─────────────────┘                          └─────────────────────┘                       └─────────────────────┘
                                                      │
                                                      ▼
                                             ┌─────────────────┐
                                             │  Vercel         │  ← api/mcp.ts (serverless)
                                             │  OR Render      │  ← server.ts (Node HTTP)
                                             │  OR Railway     │
                                             │  OR Fly.io      │
                                             └─────────────────┘
```

**Transport:** Streamable HTTP (stateless JSON-RPC 2.0 over HTTP POST)
**Runtime:** Node.js 20+ · TypeScript 5.7 · @modelcontextprotocol/sdk 1.x

---

## Quick Start

### 1. Get your TeleBotHost API key

1. Log in to [TeleBotHost](https://telebothost.com)
2. Go to **Developer Settings** → **API Keys**
3. Generate a key:
   - `sk_*` — **Secret key** (full write access) — keep private
   - `pub_*` — **Public key** (read-only) — safe for client-side

### 2. Deploy (pick a platform)

| Platform | One-click | Difficulty |
|----------|-----------|------------|
| **Vercel** | [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/telebothost/mcp-server&env=TELEBOTHOST_API_KEY&envDescription=Your%20TeleBotHost%20Developer%20API%20key&project-name=telebothost-mcp) | Easiest |
| **Render** | [Blueprint ready](#render) | Easy |
| **Railway** | `railway up` | Medium |
| **Fly.io** | `fly launch` | Medium |
| **Self-host** | `npm start` | Medium |

### 3. Connect your AI client

See [Connecting Your AI Client](#-connecting-your-ai-client) below.

---

## Deployment

### Vercel (Recommended)

**One-click deploy:**

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/telebothost/mcp-server&env=TELEBOTHOST_API_KEY&envDescription=Your%20TeleBotHost%20Developer%20API%20key&project-name=telebothost-mcp)

**Manual deploy:**

```bash
# Clone
git clone https://github.com/telebothost/mcp-server.git
cd telebothost-mcp
npm install

# Set env var
vercel env add TELEBOTHOST_API_KEY production
# Paste your sk_* key when prompted

# Deploy
vercel --prod
```

Your MCP endpoint: `https://your-project.vercel.app/api/mcp`

---

### Render

This repo includes a `render.yaml` blueprint.

**Option A — Dashboard (easiest):**

1. Push this repo to your GitHub
2. Go to [Render Dashboard](https://dashboard.render.com) → **New** → **Blueprint**
3. Select your repo — Render auto-detects `render.yaml`
4. Add `TELEBOTHOST_API_KEY` as a secret env var
5. Click **Apply**

**Option B — CLI:**

```bash
# Install Render CLI
npm i -g @render-ai/render-cli

# Link & deploy
render blueprint deploy
```

Your MCP endpoint: `https://telebothost-mcp.onrender.com/api/mcp`

---

### Railway / Fly.io / Self-Host

These platforms use the generic Node server (`server.ts`) via `npm start`.

```bash
# Clone & install
git clone https://github.com/telebothost/mcp-server.git
cd telebothost-mcp
npm install

# Set env vars
export TELEBOTHOST_API_KEY=sk_your_key_here
# Optional: export MCP_AUTH_TOKEN=your_mcp_protection_token

# Start
npm start
# → [telebothost-mcp v1.0.0] MCP server listening on :3000
```

**Railway:**

```bash
railway init
railway up
# Set TELEBOTHOST_API_KEY in Railway dashboard
```

**Fly.io:**

```bash
fly launch --no-deploy
fly secrets set TELEBOTHOST_API_KEY=sk_your_key_here
fly deploy
```

**Docker (any host):**

```bash
docker build -t telebothost-mcp .
docker run -p 3000:3000 -e TELEBOTHOST_API_KEY=sk_xxx telebothost-mcp
```

> **Note:** Create a `Dockerfile` if you need container builds — the Node server is runtime-agnostic.

---

## Connecting Your AI Client

Once deployed, point any MCP-compatible client at your endpoint. **Pass your TeleBotHost API key in the `X-Tbh-Api-Key` header** so each call uses your own TBH quota — the server never stores your key.

### Claude Desktop

Edit `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "telebothost": {
      "url": "https://your-deployed-url/api/mcp",
      "transport": "http",
      "headers": {
        "X-Tbh-Api-Key": "sk_your_telebothost_key_here"
      }
    }
  }
}
```

### Cursor

Settings → MCP → Add Server:

```json
{
  "mcpServers": {
    "telebothost": {
      "url": "https://your-deployed-url/api/mcp",
      "headers": {
        "X-Tbh-Api-Key": "sk_your_telebothost_key_here"
      }
    }
  }
}
```

### VS Code (with Cline / Continue)

Add to your MCP settings:

```json
{
  "mcp.servers": {
    "telebothost": {
      "url": "https://your-deployed-url/api/mcp",
      "headers": {
        "X-Tbh-Api-Key": "sk_your_telebothost_key_here"
      }
    }
  }
}
```

### With `MCP_AUTH_TOKEN` protection (server-side access control)

If the server has `MCP_AUTH_TOKEN` set (to restrict WHO can call the MCP), add **both** headers:

```json
{
  "mcpServers": {
    "telebothost": {
      "url": "https://your-deployed-url/api/mcp",
      "headers": {
        "Authorization": "Bearer your-mcp-auth-token",
        "X-Tbh-Api-Key": "sk_your_telebothost_key_here"
      }
    }
  }
}
```

- `Authorization: Bearer ...` → authenticates you to the **MCP server** (the `MCP_AUTH_TOKEN`)
- `X-Tbh-Api-Key: ...` → your **TeleBotHost** API key (forwarded to TBH API)

### Test with curl

```bash
# List all tools (no TBH key needed)
curl -X POST https://your-deployed-url/api/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'

# Call a public tool (no TBH key needed)
curl -X POST https://your-deployed-url/api/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"get_status","arguments":{}}}'

# Call an authenticated tool (pass your TBH key)
curl -X POST https://your-deployed-url/api/mcp \
  -H "Content-Type: application/json" \
  -H "X-Tbh-Api-Key: sk_your_key_here" \
  -d '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"list_bots","arguments":{}}}'
```

### API Key Resolution (Priority Order)

When a `tools/call` request arrives, the server resolves the TBH API key in this order:

| Priority | Source | When to use |
|----------|--------|-------------|
| 1 | `X-Tbh-Api-Key` header | **Recommended** — each user passes their own key per-request |
| 2 | `Authorization: Bearer sk_*` header | Only used if `MCP_AUTH_TOKEN` is NOT set (otherwise Authorization is for MCP auth) |
| 3 | `TELEBOTHOST_API_KEY` env var | Server-side fallback for single-user / self-hosted setups |

**Best practice:** Don't set `TELEBOTHOST_API_KEY` on the server. Let each client pass `X-Tbh-Api-Key` so everyone uses their own TBH quota.

---

## Available Tools (68)

### Health (1)

| Tool | Description |
|------|-------------|
| `get_status` | API health & version probe |

### Public Discovery (9) — no auth required

| Tool | Description |
|------|-------------|
| `get_public_user` | Get a user's public profile |
| `list_public_user_bots` | List a user's published bots & templates |
| `get_public_user_bot` | Get a published bot by Telegram username |
| `get_public_user_bot_readme` | Get published bot README only |
| `list_templates` | Browse shareable bot templates |
| `get_template` | Get a template by ID |
| `get_template_readme` | Get template README |
| `list_public_store_bots` | Browse community store (public) |
| `get_public_store_bot` | Get a store listing (public) |
| `get_public_ads` | Fetch active ads feed (public) |

### Bot Lifecycle (20) — `sk_*` key required for writes

| Tool | Description |
|------|-------------|
| `list_bots` | List your bots + statistics |
| `register_bot` | Register a new bot |
| `delete_bots` | Soft-delete bots (10-day backup) |
| `list_deleted_bots` | List soft-deleted bots |
| `recover_deleted_bot` | Recover a soft-deleted bot |
| `purge_deleted_bot` | Permanently delete from backup |
| `pin_bots` | Pin / unpin bots |
| `get_bot` | Get single bot details |
| `update_bot` | Update bot config |
| `export_bot` | Generate temp JWT download URL |
| `download_bot` | Download bot ZIP (base64-encoded binary) |
| `import_bot` | Import bot from base64-encoded ZIP |
| `clone_bot` | Clone a bot or template |
| `clone_bot_as_child` | Clone as child (inherits env/commands) |
| `list_bot_children` | List child bots of a parent |
| `transfer_bot` | Transfer bot to another user |
| `reset_bot` | Reset logs & sessions |
| `toggle_bot_template` | Toggle template status |
| `get_bot_readme` | Get bot README (owner) |
| `update_bot_readme` | Update README (template only) |

### Bot Storage (4)

| Tool | Description |
|------|-------------|
| `get_bot_storage_stats` | Sync/async storage size & metrics |
| `get_bot_storage_keys` | List storage keys (no values) |
| `clear_bot_storage` | Clear all storage (irreversible) |
| `migrate_bot_storage` | Migrate sync → async storage |

### Broadcasts (6)

| Tool | Description |
|------|-------------|
| `start_broadcast` | Start a broadcast (`confirm=true` required) |
| `get_broadcast_stats` | Real-time broadcast progress |
| `stop_broadcast` | Stop an active broadcast |
| `modify_broadcast` | Modify message body mid-run |
| `delete_broadcast` | Delete broadcast history record |
| `list_broadcasts` | List broadcasts for a bot |

### Commands (13) — full CRUD + folder management

| Tool | Description |
|------|-------------|
| `list_commands` | List commands & folders |
| `create_command` | Create a new command |
| `get_command` | Get a single command by ID |
| `update_command` | Update command code, answer, aliases, folder |
| `delete_command` | Soft-delete a command (7-day recovery) |
| `delete_commands` | Batch soft-delete commands |
| `permanently_delete_command` | Permanently delete a soft-deleted command |
| `list_deleted_commands` | List soft-deleted commands |
| `recover_deleted_command` | Recover a deleted command |
| `list_command_folders` | List command folders |
| `create_command_folder` | Create a command folder |
| `update_command_folder` | Rename a command folder |
| `delete_command_folder` | Delete a folder (unassigns commands) |

### Environment Variables (5)

| Tool | Description |
|------|-------------|
| `list_env_vars` | List all env vars for a bot |
| `create_env_var` | Create an env var |
| `get_env_var` | Get a single env var |
| `update_env_var` | Update an env var |
| `delete_env_var` | Delete an env var |

### Logs & Analytics (3)

| Tool | Description |
|------|-------------|
| `get_bot_logs` | Get runtime/error logs |
| `clear_bot_logs` | Clear all logs (irreversible) |
| `get_bot_analytics` | User growth, activity & chat-type stats |

### Community Store (2)

| Tool | Description |
|------|-------------|
| `list_store_bots` | Browse store (authenticated) |
| `install_store_bot` | Install a store bot |

### Quota (1)

| Tool | Description |
|------|-------------|
| `get_quota` | Check daily / per-minute / monthly limits |

### Docs Search (3) — no auth required

| Tool | Description |
|------|-------------|
| `search_tbh_api_docs` | Search TeleBotHost Developer API (OpenAPI spec) by keyword |
| `search_tbl_docs` | Search TBL scripting language documentation |
| `search_telegram_docs` | Search Telegram Bot API docs at core.telegram.org |

---

## MCP Protocol

This server implements the [Model Context Protocol](https://modelcontextprotocol.io) **Streamable HTTP transport** in **stateless mode** — perfect for serverless platforms.

### JSON-RPC 2.0 Methods Supported

| Method | Behavior |
|--------|----------|
| `initialize` | Returns `protocolVersion: 2024-11-05`, server capabilities, and server info |
| `notifications/initialized` | Returns HTTP 202 (acknowledged, no body) |
| `ping` | Returns empty `{result: {}}` — health check |
| `tools/list` | Returns all 68 tool definitions (name, description, inputSchema) |
| `tools/call` | Executes a tool by name with arguments; returns `{content, isError}` |

### Stateless Design

Each HTTP request creates a fresh server instance — no session persistence, no in-memory state. This means:

- Works on Vercel serverless, AWS Lambda, Cloudflare Workers
- Horizontally scalable (any number of replicas)
- No cold-start session affinity issues
- No server-initiated notifications (clients must poll)
- No SSE streaming (single JSON response per request)

### Request/Response Format

**Request:**
```http
POST /api/mcp HTTP/1.1
Content-Type: application/json

{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "list_bots",
    "arguments": {}
  }
}
```

**Success response:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "content": [{ "type": "text", "text": "{...bot data as JSON...}" }]
  }
}
```

**Error response (tool-level):**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "content": [{ "type": "text", "text": "TeleBotHost API error 403: ..." }],
    "isError": true
  }
}
```

**Error response (protocol-level):**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "error": { "code": -32601, "message": "Method not found: foo/bar" }
}
```

---

## Error Handling

The server implements a layered error handling strategy:

### Layer 1: Protocol Errors (JSON-RPC)

Returned as `{error: {code, message}}` per the JSON-RPC 2.0 spec:

| Code | Meaning | When |
|------|---------|------|
| `-32700` | Parse error | Invalid JSON in request body |
| `-32600` | Invalid Request | Missing `jsonrpc: "2.0"` or `method` |
| `-32601` | Method not found | Unknown JSON-RPC method |
| `-32602` | Invalid params | Unknown tool name |
| `-32603` | Internal error | Unexpected exception in handler |

### Layer 2: Tool Errors (MCP `isError`)

When a tool executes but the upstream TBH API returns an error, the response includes `isError: true` with the error details in the `content` text field. The AI client can read this and decide how to proceed (retry, ask user, etc.).

```json
{
  "content": [{
    "type": "text",
    "text": "TeleBotHost API error 429: Rate limit exceeded. Retry after 60s."
  }],
  "isError": true
}
```

### Layer 3: Automatic Retry

HTTP 429 responses from the TBH API are automatically retried up to 3 times with exponential backoff:

| Attempt | Delay |
|---------|-------|
| 1 | 2s (or `Retry-After` header) |
| 2 | 4s |
| 3 | 8s |

After 3 retries, the 429 is surfaced as a tool error.

### Layer 4: Cloudflare Detection

The TBH API is behind Cloudflare, which may challenge datacenter IPs. The client detects Cloudflare challenge responses (HTTP 403 + `cf_chl` in body) and returns a user-friendly message instead of the raw HTML challenge page.

---

## Testing

### Compliance Test Suite

The repo includes a bash-based compliance test suite that verifies MCP spec adherence:

```bash
# Test against local server
npm start &
sleep 2
MCP_URL=http://localhost:3000/api/mcp ./scripts/test-mcp.sh

# Test against production
MCP_URL=https://tbh-mcp.vercel.app/api/mcp ./scripts/test-mcp.sh

# With auth token
MCP_URL=https://your-url/api/mcp MCP_TOKEN=xxx ./scripts/test-mcp.sh
```

**What it verifies:**

1. `initialize` handshake returns correct protocol version & server info
2. `ping` returns a result
3. `tools/list` returns exactly 68 tools
4. All tools have `name` + `description` + `inputSchema`
5. All tools use clean names (no `telebothost_` prefix)
6. `tools/call` rejects unknown tools with error `-32602`
7. Invalid JSON returns `-32700` parse error
8. GET method returns HTTP 405 (only POST allowed)
9. All required tools are present (10 critical tools checked)

### Type Safety

```bash
npm run typecheck
# → tsc --noEmit (strict mode, zero errors)
```

### Manual Smoke Test

```bash
# Initialize
curl -X POST $MCP_URL -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}}}'

# List tools
curl -X POST $MCP_URL -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}'

# Call a tool
curl -X POST $MCP_URL -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"get_status","arguments":{}}}'
```

---

## API Coverage

This MCP server covers **100% of the TeleBotHost Developer API** — every endpoint in the [OpenAPI 3.0.3 spec](https://api.telebothost.com/api/v1/docs/openapi.json) is mapped to a tool.

| Group | Endpoints | Tools | Coverage |
|-------|-----------|-------|----------|
| Health | 1 | 1 | 100% |
| Public Discovery | 10 | 10 | 100% |
| Bot Lifecycle | 20 | 20 | 100% |
| Bot Storage | 4 | 4 | 100% |
| Broadcasts | 6 | 6 | 100% |
| Commands + Folders | 13 | 13 | 100% |
| Env Vars | 5 | 5 | 100% |
| Logs & Analytics | 3 | 3 | 100% |
| Community Store | 2 | 2 | 100% |
| Quota (helper) | — | 1 | N/A (reuses `GET /bot`) |
| Docs Search | — | 3 | N/A (fetches external docs) |
| **Total** | **64** | **68** | **Full coverage** |

### Binary Endpoints (Expert Implementation)

Two endpoints involve binary data (ZIP files) which MCP's JSON model doesn't natively support. They're handled via base64 encoding:

| Endpoint | Tool | Approach |
|----------|------|----------|
| `GET /bot/download` | `download_bot` | Downloads ZIP as `ArrayBuffer`, returns base64-encoded string with metadata (size, content-type, filename) |
| `POST /bot/import` | `import_bot` | Accepts base64-encoded ZIP, decodes to `Uint8Array`, uploads as `multipart/form-data` |

**Example `download_bot` response:**
```json
{
  "success": true,
  "content_type": "application/zip",
  "filename": "my-bot.zip",
  "size_bytes": 4523,
  "size_kb": 4.42,
  "encoding": "base64",
  "base64": "UEsDBBQACAgA..."
}
```

The AI client can then write the base64 to a file and decode it to get the actual ZIP.

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `TELEBOTHOST_API_KEY` | **No** (optional) | Server-side fallback TBH API key. **Recommended: leave unset** — let each client pass `X-Tbh-Api-Key` header per-request. Only set this for single-user self-hosted setups. |
| `MCP_AUTH_TOKEN` | No | If set, clients must send `Authorization: Bearer <token>` to access the MCP itself (separate from TBH API key). Use to restrict WHO can call your MCP. |
| `TELEBOTHOST_API_BASE` | No | Override API base URL (default: `https://api.telebothost.com/api/v1`) |
| `PORT` | No | Port for `server.ts` (default: `3000`, auto-set by Render/Railway/Fly) |

### Two Layers of Auth (Important!)

This MCP has **two independent auth layers** — don't confuse them:

| Layer | Header | Env Var | Purpose |
|-------|--------|---------|---------|
| **MCP access control** | `Authorization: Bearer <MCP_AUTH_TOKEN>` | `MCP_AUTH_TOKEN` | Restrict WHO can call your MCP endpoint |
| **TeleBotHost API auth** | `X-Tbh-Api-Key: <sk_*>` | `TELEBOTHOST_API_KEY` (fallback) | Authenticate to the upstream TBH API |

**Typical setups:**

1. **Public MCP, per-user TBH keys** (recommended for shared deployments):
   - Don't set `MCP_AUTH_TOKEN`, don't set `TELEBOTHOST_API_KEY`
   - Each client passes `X-Tbh-Api-Key: sk_their_own_key` in their MCP config
   - Server stores no secrets

2. **Protected MCP, per-user TBH keys** (recommended for team deployments):
   - Set `MCP_AUTH_TOKEN` on server
   - Don't set `TELEBOTHOST_API_KEY`
   - Clients pass both `Authorization: Bearer <mcp_token>` AND `X-Tbh-Api-Key: sk_their_own_key`

3. **Personal MCP, server-side key** (simplest for solo use):
   - Set `TELEBOTHOST_API_KEY` on server
   - Don't set `MCP_AUTH_TOKEN`
   - Clients don't need any headers (server uses its env var for all calls)

---

## Rate Limits

The TeleBotHost API enforces plan-based limits. This MCP server automatically retries on HTTP 429 with exponential backoff (up to 3 retries).

| Plan | Daily | Per-min | Monthly |
|------|-------|---------|---------|
| FREE / FREEMIUM | 1,000 | 15 | 15,000 |
| PREMIUM | 5,000 | 60 | 75,000 |
| ELITE | 10,000 | 120 | 150,000 |

> `pub_*` keys are always capped at 1,000/day, 15/min, 15,000/month regardless of plan.

Use `get_quota` to check remaining quota at any time.

---

## Local Development

```bash
# Install deps
npm install

# Set env vars
cp .env.example .env
# Edit .env with your TELEBOTHOST_API_KEY

# Run locally (generic Node server)
npm run dev
# → http://localhost:3000/api/mcp

# OR run as Vercel dev (simulates serverless)
npm run vercel:dev

# Type-check
npm run typecheck

# Test
curl -X POST http://localhost:3000/api/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}}}'
```

---

## Project Structure

```
telebothost-mcp/
├── api/
│   ├── index.ts            # GET /         → Docs page (root)
│   ├── docs.ts             # GET /docs     → Docs page (alias)
│   ├── health.ts           # GET /api/health → JSON health probe
│   └── mcp.ts              # POST /api/mcp → MCP JSON-RPC endpoint
├── lib/
│   ├── types.ts            # Shared types & TbhApiError
│   ├── client.ts           # TeleBotHost API client (auth, retry, binary, errors)
│   ├── tools.ts            # All 68 MCP tool definitions
│   └── docs.ts             # HTML docs page generator
├── scripts/
│   └── test-mcp.sh         # Compliance test suite
├── server.ts               # Generic Node HTTP server (Render/Railway/Fly)
├── render.yaml             # Render.com Blueprint config
├── vercel.json             # Vercel serverless config + routes
├── .env.example            # Environment variable template
├── .nvmrc                  # Node version pin
├── package.json
├── tsconfig.json
├── LICENSE
├── CONTRIBUTING.md
└── README.md
```

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/` | Documentation page (HTML) — tool list, quick start, configs |
| `GET` | `/docs` | Alias for `/` |
| `GET` | `/api/health` | JSON health probe — `{"status":"ok","tools":48,...}` |
| `POST` | `/api/mcp` | MCP JSON-RPC endpoint (initialize, tools/list, tools/call) |

---

## Roadmap

- [x] **v1.0.0** — Initial release: 46 tools, Vercel deployment
- [x] **v1.1.0** — Cleaner tool names (dropped `telebothost_` prefix)
- [x] **v1.2.0** — 100% API coverage: `download_bot` & `import_bot` (binary base64), compliance test suite, multi-platform deploy configs
- [x] **v1.3.0** — Per-request API key via `X-Tbh-Api-Key` header — multi-user support, each user uses own TBH quota
- [x] **v2.0.0** — 68 tools: full CRUD for commands + folders, env vars, logs, analytics, docs search (TBH API, TBL lang, Telegram Bot API)
- [ ] **v2.1.0** — Docker support, GitHub Actions CI, automated coverage check in CI
- [ ] **v2.2.0** — SSE streaming transport for stateful deployments (Render/Railway)
- [ ] **v3.0.0** — Tool-level RBAC, audit logging, multi-region deployment guide

---

## Contributing

Contributions welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for setup, conventions, and PR guidelines.

### Adding a new tool

1. Open `lib/tools.ts`
2. Add a `ToolDef` to the appropriate group
3. Use a clear `snake_case` name, short description, JSON-Schema input
4. Run `npm run typecheck`
5. Open a PR

---

## Acknowledgements

Special thanks to **Cyber** ([@CyberXCoding](https://t.me/CyberXCoding)) for creating the base version of this MCP server that this project was built upon.

---

## License

[MIT](LICENSE) © Muiz Ahmed ([mmuizahmed](https://github.com/mmuizahmed))

---

## Links

- **TeleBotHost:** [telebothost.com](https://telebothost.com)
- **Developer API Docs:** [api.telebothost.com/api/v1/docs](https://api.telebothost.com/api/v1/docs)
- **MCP Specification:** [modelcontextprotocol.io](https://modelcontextprotocol.io)
- **GitHub:** [github.com/telebothost/mcp-server](https://github.com/telebothost/mcp-server)
- **Issues:** [GitHub Issues](https://github.com/telebothost/mcp-server/issues)

---

Built for the TeleBotHost community by [Muiz Ahmed](https://github.com/mmuizahmed)
