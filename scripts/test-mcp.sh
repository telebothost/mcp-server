#!/usr/bin/env bash
#
# TeleBotHost MCP Server — Compliance & Smoke Tests
#
# Verifies that the deployed MCP endpoint correctly implements the MCP spec
# (JSON-RPC 2.0 over HTTP) and exposes all expected tools.
#
# Usage:
#   MCP_URL=https://your-deployed-url/api/mcp ./scripts/test-mcp.sh
#   MCP_URL=https://your-deployed-url/api/mcp MCP_TOKEN=xxx ./scripts/test-mcp.sh
#
# Exits 0 on success, 1 on any failure.

set -euo pipefail

MCP_URL="${MCP_URL:-http://localhost:3000/api/mcp}"
MCP_TOKEN="${MCP_TOKEN:-}"
AUTH_HEADER=()
if [[ -n "$MCP_TOKEN" ]]; then
  AUTH_HEADER=(-H "Authorization: Bearer $MCP_TOKEN")
fi

PASS=0
FAIL=0
TOTAL_TOOLS_EXPECTED=68

green() { printf "\033[32m%s\033[0m\n" "$1"; }
red()   { printf "\033[31m%s\033[0m\n" "$1"; }

check() {
  local name="$1"
  if [[ "$2" == "0" ]]; then
    green "  ✅ $name"
    PASS=$((PASS+1))
  else
    red "  ❌ $name"
    FAIL=$((FAIL+1))
  fi
}

echo "════════════════════════════════════════════════════════════════"
echo "  TeleBotHost MCP — Compliance Test Suite"
echo "  Endpoint: $MCP_URL"
echo "════════════════════════════════════════════════════════════════"
echo ""

# --- 1. initialize ---
echo "Test 1: initialize handshake"
INIT_RESP=$(curl -sf --max-time 15 -X POST "$MCP_URL" \
  -H "Content-Type: application/json" \
  "${AUTH_HEADER[@]}" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test-suite","version":"1.0"}}}')

PROTO_VER=$(echo "$INIT_RESP" | python3 -c "import json,sys; print(json.load(sys.stdin)['result']['protocolVersion'])" 2>/dev/null || echo "")
SRV_NAME=$(echo "$INIT_RESP" | python3 -c "import json,sys; print(json.load(sys.stdin)['result']['serverInfo']['name'])" 2>/dev/null || echo "")
SRV_VER=$(echo "$INIT_RESP" | python3 -c "import json,sys; print(json.load(sys.stdin)['result']['serverInfo']['version'])" 2>/dev/null || echo "")

[[ "$PROTO_VER" == "2024-11-05" ]]; check "Returns protocolVersion 2024-11-05" $?
[[ -n "$SRV_NAME" ]];              check "Returns serverInfo.name ($SRV_NAME)" $?
[[ -n "$SRV_VER" ]];               check "Returns serverInfo.version ($SRV_VER)" $?
echo ""

# --- 2. ping ---
echo "Test 2: ping"
PING_RESP=$(curl -sf --max-time 15 -X POST "$MCP_URL" \
  -H "Content-Type: application/json" \
  "${AUTH_HEADER[@]}" \
  -d '{"jsonrpc":"2.0","id":2,"method":"ping","params":{}}')
PING_OK=$(echo "$PING_RESP" | python3 -c "import json,sys; d=json.load(sys.stdin); print('0' if 'result' in d else '1')" 2>/dev/null || echo "1")
check "ping returns result" "$PING_OK"
echo ""

# --- 3. tools/list ---
echo "Test 3: tools/list"
LIST_RESP=$(curl -sf --max-time 15 -X POST "$MCP_URL" \
  -H "Content-Type: application/json" \
  "${AUTH_HEADER[@]}" \
  -d '{"jsonrpc":"2.0","id":3,"method":"tools/list","params":{}}')

TOOL_COUNT=$(echo "$LIST_RESP" | python3 -c "import json,sys; print(len(json.load(sys.stdin)['result']['tools']))" 2>/dev/null || echo "0")
echo "  Found $TOOL_COUNT tools (expected $TOTAL_TOOLS_EXPECTED)"
[[ "$TOOL_COUNT" == "$TOTAL_TOOLS_EXPECTED" ]]; check "Tool count = $TOTAL_TOOLS_EXPECTED" $?

NO_PREFIX=$(echo "$LIST_RESP" | python3 -c "
import json,sys
tools=json.load(sys.stdin)['result']['tools']
print('0' if all(not t['name'].startswith('telebothost_') for t in tools) else '1')
" 2>/dev/null || echo "1")
check "All tools use clean names (no telebothost_ prefix)" "$NO_PREFIX"

SCHEMA_OK=$(echo "$LIST_RESP" | python3 -c "
import json,sys
tools=json.load(sys.stdin)['result']['tools']
ok = all(t.get('name') and t.get('description') and t.get('inputSchema') for t in tools)
print('0' if ok else '1')
" 2>/dev/null || echo "1")
check "All tools have name + description + inputSchema" "$SCHEMA_OK"
echo ""

# --- 4. tools/call rejects unknown tool ---
echo "Test 4: tools/call rejects unknown tool"
ERR_RESP=$(curl -sf --max-time 15 -X POST "$MCP_URL" \
  -H "Content-Type: application/json" \
  "${AUTH_HEADER[@]}" \
  -d '{"jsonrpc":"2.0","id":4,"method":"tools/call","params":{"name":"nonexistent_tool","arguments":{}}}')
ERR_CODE=$(echo "$ERR_RESP" | python3 -c "import json,sys; print(json.load(sys.stdin).get('error',{}).get('code',''))" 2>/dev/null || echo "")
[[ "$ERR_CODE" == "-32602" ]]; check "Unknown tool returns JSON-RPC error -32602" $?
echo ""

# --- 5. Invalid JSON ---
echo "Test 5: invalid JSON handling"
# Send invalid JSON. The server (or its host platform) must reject it.
# We accept either: HTTP 4xx, OR a JSON-RPC -32700 error response.
PARSE_HTTP_CODE=$(curl -s -o /tmp/mcp_parse_resp.txt -w "%{http_code}" --max-time 15 -X POST "$MCP_URL" \
  -H "Content-Type: application/json" \
  "${AUTH_HEADER[@]}" \
  -d 'not-valid-json' || echo "000")
PARSE_BODY=$(cat /tmp/mcp_parse_resp.txt 2>/dev/null || echo "")
PARSE_CODE=$(echo "$PARSE_BODY" | python3 -c "import json,sys; print(json.load(sys.stdin).get('error',{}).get('code',''))" 2>/dev/null || echo "")

if [[ "$PARSE_HTTP_CODE" == "400" || "$PARSE_CODE" == "-32700" ]]; then
  check "Invalid JSON rejected (HTTP $PARSE_HTTP_CODE, code=$PARSE_CODE)" 0
else
  check "Invalid JSON rejected (HTTP $PARSE_HTTP_CODE, code=$PARSE_CODE)" 1
fi
echo ""

# --- 6. Method not allowed ---
echo "Test 6: GET method not allowed (only POST)"
GET_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 15 "$MCP_URL")
[[ "$GET_STATUS" == "405" ]]; check "GET returns HTTP 405" $?
echo ""

# --- 7. Required tools present ---
echo "Test 7: Required tools present"
REQUIRED_TOOLS="get_status list_bots register_bot get_bot create_command start_broadcast get_quota export_bot download_bot import_bot"
for t in $REQUIRED_TOOLS; do
  PRESENT=$(echo "$LIST_RESP" | python3 -c "
import json,sys
tools=json.load(sys.stdin)['result']['tools']
print('0' if any(tool['name']=='$t' for tool in tools) else '1')
" 2>/dev/null || echo "1")
  check "Tool '$t' present" "$PRESENT"
done
echo ""

# --- Summary ---
echo "════════════════════════════════════════════════════════════════"
green "  PASSED: $PASS"
if [[ "$FAIL" -gt 0 ]]; then
  red "  FAILED: $FAIL"
  echo "════════════════════════════════════════════════════════════════"
  exit 1
else
  echo "════════════════════════════════════════════════════════════════"
  green "  All tests passed! 🎉"
  exit 0
fi
