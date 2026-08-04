# Contributing to TeleBotHost MCP

Thanks for your interest in improving this project! 🚀

## Development Setup

```bash
git clone https://github.com/telebothost/mcp-server.git
cd telebothost-mcp
npm install
cp .env.example .env  # fill in your TELEBOTHOST_API_KEY
npm run dev
```

## Project Structure

```
api/mcp.ts     → Vercel serverless endpoint (JSON-RPC over HTTP)
server.ts      → Generic Node HTTP server (Render, Railway, Fly.io, self-host)
lib/client.ts  → TeleBotHost API client (auth, retry, error handling)
lib/tools.ts   → All 68 MCP tool definitions
lib/types.ts   → Shared TypeScript types
```

## Adding a New Tool

1. Open `lib/tools.ts`
2. Add a new `ToolDef` object to the appropriate group array
3. Follow the existing patterns — short snake_case names (no prefix), clear description, JSON-Schema input
4. Run `npm run typecheck` and `npm run test:coverage`
5. Test locally with `npm run dev` + `npm run test:mcp`

```typescript
{
  name: "your_new_tool",
  description: "What it does, clearly.",
  inputSchema: {
    type: "object",
    properties: { /* ... */ },
    required: ["param1"],
  },
  handler: async (a, c) => json((await c.get("/your/endpoint")).data),
}
```

## Guidelines

- **Naming**: Short snake_case names, no prefix (e.g. `get_bot`, `start_broadcast`)
- **Descriptions**: First line = one-sentence summary. Add ⚠️ for dangerous ops
- **Errors**: Let `TbhApiError` bubble up — the handler converts it to a clean MCP error
- **Types**: Strict mode is on. No `any` (except the handler return type, which is intentional)
- **Tests**: `npm run test:coverage` (tool count) and `npm run test:mcp` (compliance smoke suite against a running server)

## Submitting Changes

1. Fork → branch → commit
2. Open a PR with a clear description of what & why
3. Make sure `npm run typecheck` and `npm run test:coverage` pass (CI runs these automatically)

## Reporting Issues

Use [GitHub Issues](https://github.com/telebothost/mcp-server/issues) with:
- What you expected
- What happened
- Your deployment platform (Vercel / Render / other)
- Redacted error output
