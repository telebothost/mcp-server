/**
 * TeleBotHost MCP Server — Compliance & Smoke Tests (cross-platform)
 *
 * Node equivalent of test-mcp.sh. Works on Windows, macOS, and Linux.
 *
 * Usage:
 *   MCP_URL=http://localhost:3000/api/mcp npm run test:mcp
 *   node scripts/test-mcp.mjs
 *
 * Exits 0 on success, 1 on any failure.
 */

const MCP_URL = process.env.MCP_URL ?? "http://127.0.0.1:3000/api/mcp";
const MCP_TOKEN = process.env.MCP_TOKEN ?? "";
const TOTAL_TOOLS_EXPECTED = 68;

let pass = 0;
let fail = 0;

function check(name, ok) {
  if (ok) {
    console.log(`  ✅ ${name}`);
    pass += 1;
  } else {
    console.log(`  ❌ ${name}`);
    fail += 1;
  }
}

async function rpc(body, { raw = false } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (MCP_TOKEN) headers.Authorization = `Bearer ${MCP_TOKEN}`;

  const res = await fetch(MCP_URL, {
    method: "POST",
    headers,
    body: raw ? body : JSON.stringify(body),
  });

  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* ignore */
  }
  return { status: res.status, text, json };
}

console.log("════════════════════════════════════════════════════════════════");
console.log("  TeleBotHost MCP — Compliance Test Suite");
console.log(`  Endpoint: ${MCP_URL}`);
console.log("════════════════════════════════════════════════════════════════");
console.log("");

// 1. initialize
console.log("Test 1: initialize handshake");
const init = await rpc({
  jsonrpc: "2.0",
  id: 1,
  method: "initialize",
  params: {
    protocolVersion: "2024-11-05",
    capabilities: {},
    clientInfo: { name: "test-suite", version: "1.0" },
  },
});
check("Returns protocolVersion 2024-11-05", init.json?.result?.protocolVersion === "2024-11-05");
check(
  `Returns serverInfo.name (${init.json?.result?.serverInfo?.name ?? ""})`,
  Boolean(init.json?.result?.serverInfo?.name),
);
check(
  `Returns serverInfo.version (${init.json?.result?.serverInfo?.version ?? ""})`,
  Boolean(init.json?.result?.serverInfo?.version),
);
console.log("");

// 2. ping
console.log("Test 2: ping");
const ping = await rpc({ jsonrpc: "2.0", id: 2, method: "ping", params: {} });
check("ping returns result", ping.json != null && "result" in ping.json);
console.log("");

// 3. tools/list
console.log("Test 3: tools/list");
const list = await rpc({ jsonrpc: "2.0", id: 3, method: "tools/list", params: {} });
const tools = list.json?.result?.tools ?? [];
console.log(`  Found ${tools.length} tools (expected ${TOTAL_TOOLS_EXPECTED})`);
check(`Tool count = ${TOTAL_TOOLS_EXPECTED}`, tools.length === TOTAL_TOOLS_EXPECTED);
check(
  "All tools use clean names (no telebothost_ prefix)",
  tools.every((t) => !String(t.name).startsWith("telebothost_")),
);
check(
  "All tools have name + description + inputSchema",
  tools.every((t) => t.name && t.description && t.inputSchema),
);
console.log("");

// 4. unknown tool
console.log("Test 4: tools/call rejects unknown tool");
const unknown = await rpc({
  jsonrpc: "2.0",
  id: 4,
  method: "tools/call",
  params: { name: "nonexistent_tool", arguments: {} },
});
check("Unknown tool returns JSON-RPC error -32602", unknown.json?.error?.code === -32602);
console.log("");

// 5. invalid JSON
console.log("Test 5: invalid JSON handling");
const bad = await rpc("not-valid-json", { raw: true });
check(
  `Invalid JSON rejected (HTTP ${bad.status}, code=${bad.json?.error?.code ?? ""})`,
  bad.status === 400 || bad.json?.error?.code === -32700,
);
console.log("");

// 6. GET not allowed
console.log("Test 6: GET method not allowed (only POST)");
const getRes = await fetch(MCP_URL, { method: "GET" });
check("GET returns HTTP 405", getRes.status === 405);
console.log("");

// 7. required tools
console.log("Test 7: Required tools present");
const required = [
  "get_status",
  "list_bots",
  "register_bot",
  "get_bot",
  "create_command",
  "start_broadcast",
  "get_quota",
  "export_bot",
  "download_bot",
  "import_bot",
];
const names = new Set(tools.map((t) => t.name));
for (const t of required) {
  check(`Tool '${t}' present`, names.has(t));
}
console.log("");

console.log("════════════════════════════════════════════════════════════════");
console.log(`  PASSED: ${pass}`);
if (fail > 0) {
  console.log(`  FAILED: ${fail}`);
  console.log("════════════════════════════════════════════════════════════════");
  process.exit(1);
}
console.log("════════════════════════════════════════════════════════════════");
console.log("  All tests passed!");
process.exit(0);
