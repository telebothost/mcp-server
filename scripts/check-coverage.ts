/**
 * Automated tool coverage check.
 *
 * Asserts that lib/tools.ts exposes exactly EXPECTED_TOOL_COUNT tools,
 * each with a unique snake_case name and required MCP fields.
 *
 * Usage: npm run test:coverage
 * Exit 0 on success, 1 on failure.
 */

import { allTools } from "../lib/tools.js";

const EXPECTED_TOOL_COUNT = 68;

let failed = 0;

function assert(condition: boolean, message: string): void {
  if (condition) {
    console.log(`  ✅ ${message}`);
  } else {
    console.error(`  ❌ ${message}`);
    failed += 1;
  }
}

console.log("════════════════════════════════════════════════════════════════");
console.log("  TeleBotHost MCP — Tool Coverage Check");
console.log("════════════════════════════════════════════════════════════════");
console.log("");

assert(
  allTools.length === EXPECTED_TOOL_COUNT,
  `Tool count = ${EXPECTED_TOOL_COUNT} (found ${allTools.length})`,
);

const names = allTools.map((t) => t.name);
const unique = new Set(names);
assert(unique.size === names.length, `All tool names are unique (${unique.size})`);

const snakeCase = /^[a-z][a-z0-9_]*$/;
const badNames = names.filter((n) => !snakeCase.test(n));
assert(badNames.length === 0, `All tool names are snake_case${badNames.length ? ` (bad: ${badNames.join(", ")})` : ""}`);

const prefixed = names.filter((n) => n.startsWith("telebothost_"));
assert(prefixed.length === 0, "No tools use the telebothost_ prefix");

const incomplete = allTools.filter(
  (t) => !t.name || !t.description || !t.inputSchema || typeof t.handler !== "function",
);
assert(incomplete.length === 0, "All tools have name + description + inputSchema + handler");

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
for (const name of required) {
  assert(names.includes(name), `Required tool '${name}' present`);
}

console.log("");
console.log("════════════════════════════════════════════════════════════════");
if (failed > 0) {
  console.error(`  FAILED: ${failed} check(s)`);
  console.log("════════════════════════════════════════════════════════════════");
  process.exit(1);
}
console.log("  All coverage checks passed!");
console.log("════════════════════════════════════════════════════════════════");
