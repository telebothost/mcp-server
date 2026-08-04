/**
 * TeleBotHost MCP — Documentation Page Generator.
 *
 * Generates a self-contained HTML docs page that:
 *   - Lists all 68 tools (auto-generated from tools.ts)
 *   - Provides copy-paste MCP client configs (Claude Desktop, Cursor, VS Code, curl)
 *   - Explains the two-layer auth model (X-Tbh-Api-Key + optional MCP_AUTH_TOKEN)
 *   - Shows curl examples for testing
 *   - Supports light / dark themes (system preference + manual toggle)
 *   - Is fully responsive
 *
 * Served at:
 *   - GET /          (root, primary entry point)
 *   - GET /docs      (alias)
 */

import { allTools } from "./tools.js";

const SERVER_NAME = "telebothost-mcp";
const SERVER_VERSION = "2.0.0";
const PROTOCOL_VERSION = "2024-11-05";

const GITHUB_URL = "https://github.com/telebothost/mcp-server";
const TBH_DOCS_URL = "https://api.telebothost.com/api/v1/docs";
const MCP_SPEC_URL = "https://modelcontextprotocol.io";

type RequestHeaders = Record<string, string | string[] | undefined>;

/** Build the public origin from proxy-aware request headers. */
export function resolveRequestOrigin(headers: RequestHeaders): string {
  const host =
    (headers["x-forwarded-host"] as string | undefined) ??
    (headers.host as string | undefined) ??
    "localhost:3000";
  const forwarded = headers["x-forwarded-proto"] as string | undefined;
  const proto =
    forwarded ??
    (/^localhost(:\d+)?$|^127\.0\.0\.1(:\d+)?$/.test(host) ? "http" : "https");
  return normalizeOrigin(`${proto}://${host}`);
}

/** Force https for non-local deployments (fixes hardcoded http:// in docs configs). */
export function normalizeOrigin(origin: string): string {
  try {
    const url = new URL(origin);
    if (
      url.protocol === "http:" &&
      url.hostname !== "localhost" &&
      url.hostname !== "127.0.0.1"
    ) {
      url.protocol = "https:";
    }
    return url.origin;
  } catch {
    return origin;
  }
}

/** Inline stroke icons (Lucide-style). No emoji. */
const ICO: Record<string, string> = {
  activity: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>`,
  globe: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`,
  bot: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="8" width="18" height="12" rx="2"/><path d="M12 2v4M8 14h.01M16 14h.01M9 18h6"/><path d="M7 8V6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2"/></svg>`,
  database: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/><path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3"/></svg>`,
  megaphone: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11v2a1 1 0 0 0 1 1h2l5 4V6L6 10H4a1 1 0 0 0-1 1z"/><path d="M15.5 8.5a4.5 4.5 0 0 1 0 7"/><path d="M18 6a8 8 0 0 1 0 12"/></svg>`,
  terminal: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>`,
  key: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="7.5" cy="15.5" r="5.5"/><path d="M21 2l-9.6 9.6M15.5 7.5l3 3L22 7l-3-3"/></svg>`,
  chart: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="M7 16l4-6 4 3 5-8"/></svg>`,
  store: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l1.5-6h15L21 9"/><path d="M3 9h18v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9z"/><path d="M9 22V12h6v10"/></svg>`,
  gauge: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 14l4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/><circle cx="12" cy="14" r="1.5"/></svg>`,
  search: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>`,
  layers: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>`,
  check: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>`,
  code: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`,
  shield: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
  plug: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22v-5"/><path d="M9 8V2"/><path d="M15 8V2"/><path d="M9 8a3 3 0 0 0 6 0"/><path d="M6 12h12v2a6 6 0 0 1-12 0v-2z"/></svg>`,
  arrow: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M13 6l6 6-6 6"/></svg>`,
  github: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.58 2 12.26c0 4.52 2.87 8.35 6.84 9.7.5.1.68-.22.68-.48 0-.24-.01-.87-.01-1.7-2.78.62-3.37-1.37-3.37-1.37-.45-1.18-1.11-1.5-1.11-1.5-.91-.64.07-.63.07-.63 1 .07 1.53 1.06 1.53 1.06.89 1.56 2.34 1.11 2.91.85.09-.66.35-1.11.63-1.37-2.22-.26-4.55-1.14-4.55-5.07 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.7 0 0 .84-.27 2.75 1.05A9.3 9.3 0 0 1 12 6.84c.85 0 1.71.12 2.51.35 1.9-1.32 2.74-1.05 2.74-1.05.55 1.4.2 2.44.1 2.7.64.72 1.03 1.63 1.03 2.75 0 3.94-2.34 4.8-4.57 5.06.36.32.68.94.68 1.9 0 1.37-.01 2.47-.01 2.81 0 .26.18.58.69.48A10.27 10.27 0 0 0 22 12.26C22 6.58 17.52 2 12 2z"/></svg>`,
  heartPulse: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/><path d="M3.22 12H9.5l.5-1 2 4.5 2-7 1.5 3.5H21"/></svg>`,
  copy: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`,
  zap: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
  fileCode: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="m10 13-2 2 2 2"/><path d="m14 17 2-2-2-2"/></svg>`,
  refresh: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-2.64-6.36"/><polyline points="21 3 21 9 15 9"/></svg>`,
};

function icon(name: keyof typeof ICO | string, cls = "ico"): string {
  const svg = ICO[name] ?? ICO.layers;
  return `<span class="${cls}" aria-hidden="true">${svg}</span>`;
}

// Tool group metadata (order matters for display)
const GROUPS: Array<{ name: string; icon: string; description: string }> = [
  { name: "Health", icon: "activity", description: "API status and version probe" },
  { name: "Public Discovery", icon: "globe", description: "Browse public profiles, templates, and store — no auth required" },
  { name: "Bot Lifecycle", icon: "bot", description: "Register, clone, transfer, import/export, and delete bots" },
  { name: "Bot Storage", icon: "database", description: "Sync/async storage stats, migration, and clearing" },
  { name: "Broadcasts", icon: "megaphone", description: "Send messages to bot subscribers in bulk" },
  { name: "Commands", icon: "terminal", description: "Full CRUD for commands and command folders" },
  { name: "Env Vars", icon: "key", description: "Manage environment variables for a bot" },
  { name: "Logs & Analytics", icon: "chart", description: "Access runtime logs and user analytics" },
  { name: "Community Store", icon: "store", description: "Browse and install community-published bots" },
  { name: "Quota", icon: "gauge", description: "Check rate-limit quota usage" },
  { name: "Docs Search", icon: "search", description: "Search TBH API, TBL language, and Telegram Bot API docs" },
];

/** Generate the full HTML docs page. */
export function generateDocsHtml(origin: string): string {
  const base = normalizeOrigin(origin);
  const mcpUrl = `${base}/api/mcp`;
  const healthUrl = `${base}/api/health`;
  const grouped = groupToolsBySection();

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
<title>TeleBotHost MCP Server</title>
<meta name="description" content="MCP server for the TeleBotHost Developer API. ${allTools.length} tools covering bot lifecycle, storage, broadcasts, commands, and community store.">
<meta name="color-scheme" content="light dark">
<meta name="theme-color" content="#f8f7fb" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#000000" media="(prefers-color-scheme: dark)">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='6' fill='%236d28d9'/%3E%3Cpath d='M8 10h16v2.5H8V10zm0 5h10v2.5H8V15zm0 5h13v2.5H8V20z' fill='%23fff'/%3E%3C/svg%3E">
<style>
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}

  :root{
    --bg:#f3f1f8;
    --bg-raised:#fcfbfe;
    --bg-card:#ffffff;
    --bg-soft:#ebe7f3;
    --bg-code:#f0edf6;
    --border:#e0dbea;
    --border-strong:#cdc5dd;
    --text:#1a1724;
    --text-secondary:#5b5568;
    --text-mute:#8a8498;
    --accent:#6d28d9;
    --accent-hover:#7c3aed;
    --accent-soft:rgba(109,40,217,.09);
    --accent-border:rgba(109,40,217,.28);
    --warn:#b45309;
    --warn-soft:rgba(180,83,9,.08);
    --warn-border:rgba(180,83,9,.22);
    --ok:#15803d;
    --ok-soft:rgba(21,128,61,.08);
    --ok-border:rgba(21,128,61,.22);
    --shadow:0 1px 2px rgba(88,60,140,.06);
    --radius:10px;
    --radius-sm:6px;
    --nav-h:56px;
    --sans:'IBM Plex Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
    --mono:'IBM Plex Mono',ui-monospace,Menlo,Consolas,monospace;
    color-scheme:light;
  }

  html[data-theme="dark"]{
    --bg:#000000;
    --bg-raised:#0d0d0d;
    --bg-card:#141414;
    --bg-soft:#1a1a1a;
    --bg-code:#0a0a0a;
    --border:#262626;
    --border-strong:#3a3a3a;
    --text:#f0f0f0;
    --text-secondary:#a3a3a3;
    --text-mute:#737373;
    --accent:#a78bfa;
    --accent-hover:#c4b5fd;
    --accent-soft:rgba(167,139,250,.14);
    --accent-border:rgba(167,139,250,.35);
    --warn:#fbbf24;
    --warn-soft:rgba(251,191,36,.1);
    --warn-border:rgba(251,191,36,.28);
    --ok:#4ade80;
    --ok-soft:rgba(74,222,128,.1);
    --ok-border:rgba(74,222,128,.28);
    --shadow:0 1px 0 rgba(255,255,255,.03);
    color-scheme:dark;
  }

  html{scroll-behavior:smooth}
  body{
    background:var(--bg);color:var(--text);
    font-family:var(--sans);line-height:1.6;font-size:16px;
    -webkit-font-smoothing:antialiased;min-height:100vh;
    transition:background .2s ease,color .2s ease;
  }
  a{color:var(--accent);text-decoration:none}
  a:hover{color:var(--accent-hover)}
  code{
    font-family:var(--mono);font-size:.875em;
    background:var(--bg-soft);padding:.12em .4em;border-radius:4px;
    color:var(--text);border:1px solid var(--border);
  }
  .ico,.ico-sm,.ico-md{
    display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;
    line-height:0;
  }
  .ico svg,.ico-sm svg,.ico-md svg{display:block;width:100%;height:100%}
  .ico{width:16px;height:16px}
  .ico-sm{width:14px;height:14px}
  .ico-md{width:18px;height:18px}
  .ico-box{
    width:32px;height:32px;border-radius:8px;
    display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;
    background:var(--accent-soft);color:var(--accent);border:1px solid var(--accent-border);
  }
  .ico-box .ico{width:16px;height:16px}
  .chip .ico-sm{color:var(--accent)}
  .btn .ico{width:15px;height:15px}
  .step-head{display:flex;align-items:center;gap:10px;margin-bottom:8px}
  .step-head h3{margin-bottom:0}
  .auth-card h3 .ico-box{margin-right:2px}
  .tool-group-head{align-items:center}
  .tool-group-title{display:flex;align-items:center;gap:10px;min-width:0}
  .copy-btn{display:inline-flex;align-items:center;gap:5px}
  .copy-btn .ico-sm{width:12px;height:12px}

  /* Nav */
  .nav{
    position:sticky;top:0;z-index:50;height:var(--nav-h);
    background:color-mix(in srgb,var(--bg) 86%,transparent);
    backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);
    border-bottom:1px solid var(--border);
  }
  .nav-inner{
    max-width:none;margin:0;padding:0 20px;height:100%;
    display:flex;align-items:center;justify-content:space-between;gap:16px;
  }
  .brand{display:flex;align-items:center;gap:10px;color:inherit;font-weight:600;font-size:15px}
  .brand-mark{
    width:28px;height:28px;border-radius:7px;background:var(--accent);
    display:grid;place-items:center;flex-shrink:0;
  }
  .brand-mark svg{display:block}
  .brand-ver{
    font-size:11px;font-weight:500;color:var(--text-mute);
    border:1px solid var(--border);padding:2px 7px;border-radius:999px;
    font-family:var(--mono);
  }
  .nav-right{display:flex;align-items:center;gap:4px}
  .nav-links{display:flex;align-items:center;gap:2px}
  .nav-links a{
    color:var(--text-secondary);font-size:13.5px;font-weight:500;
    padding:6px 10px;border-radius:6px;transition:color .15s,background .15s;
  }
  .nav-links a:hover{color:var(--text);background:var(--bg-soft)}
  .theme-btn{
    width:36px;height:36px;border-radius:8px;border:1px solid var(--border);
    background:var(--bg-card);color:var(--text-secondary);cursor:pointer;
    display:grid;place-items:center;margin-left:8px;transition:all .15s;
  }
  .theme-btn:hover{border-color:var(--border-strong);color:var(--text)}
  .theme-btn svg{width:16px;height:16px}
  .icon-sun{display:none}
  html[data-theme="dark"] .icon-moon{display:none}
  html[data-theme="dark"] .icon-sun{display:block}
  @media(max-width:720px){
    .nav-links a[data-hide-sm]{display:none}
  }

  /* Hero */
  .hero{padding:40px 20px 32px;border-bottom:1px solid var(--border);text-align:center}
  .hero-inner{max-width:640px;margin:0 auto}
  .hero-kicker{
    font-size:12px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;
    color:var(--accent);margin-bottom:10px;
    display:inline-flex;align-items:center;justify-content:center;gap:6px;
  }
  .hero h1{
    font-size:clamp(2rem,4.5vw,2.75rem);font-weight:700;letter-spacing:-.03em;
    line-height:1.15;margin-bottom:10px;
    background:linear-gradient(115deg,#7c3aed 0%,#a78bfa 40%,#c084fc 65%,#818cf8 100%);
    -webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;
    color:transparent;
  }
  html[data-theme="dark"] .hero h1{
    background:linear-gradient(115deg,#c4b5fd 0%,#a78bfa 40%,#e879f9 70%,#818cf8 100%);
    -webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;
  }
  .hero-lead{
    font-size:1.0625rem;color:var(--text-secondary);margin:0 auto 18px;
    max-width:520px;line-height:1.65;
  }
  .hero-meta{
    display:flex;flex-wrap:wrap;gap:8px;margin-bottom:18px;justify-content:center;
  }
  .chip{
    display:inline-flex;align-items:center;gap:6px;
    font-size:12px;font-weight:500;color:var(--text-secondary);
    background:var(--bg-card);border:1px solid var(--border);
    padding:5px 10px;border-radius:999px;box-shadow:var(--shadow);
  }
  .chip strong{color:var(--text);font-weight:600}
  .hero-actions{display:flex;flex-wrap:wrap;gap:10px;justify-content:center}
  .btn{
    display:inline-flex;align-items:center;justify-content:center;gap:8px;
    padding:10px 18px;border-radius:8px;font-size:14px;font-weight:550;
    border:1px solid transparent;cursor:pointer;transition:all .15s;font-family:var(--sans);
  }
  .btn-primary{background:var(--accent);color:#fff}
  .btn-primary:hover{background:var(--accent-hover);color:#fff}
  html[data-theme="dark"] .btn-primary{color:#1e1035}
  .btn-ghost{
    background:var(--bg-card);color:var(--text);border-color:var(--border);
    box-shadow:var(--shadow);
  }
  .btn-ghost:hover{border-color:var(--border-strong)}

  /* Sections */
  section{padding:36px 20px;border-bottom:1px solid var(--border)}
  .wrap{max-width:none;margin:0}
  .section-label{
    font-size:12px;font-weight:600;letter-spacing:.05em;text-transform:uppercase;
    color:var(--text-mute);margin-bottom:6px;
  }
  .section-title{
    font-size:clamp(1.4rem,2.5vw,1.75rem);font-weight:700;letter-spacing:-.02em;
    margin-bottom:6px;
  }
  .section-desc{color:var(--text-secondary);font-size:15px;margin-bottom:20px;max-width:560px}

  /* Steps */
  .steps{display:grid;gap:12px;grid-template-columns:1fr;margin-bottom:20px}
  @media(min-width:840px){.steps{grid-template-columns:repeat(3,1fr)}}
  .step{
    background:var(--bg-card);border:1px solid var(--border);
    border-radius:var(--radius);padding:22px;box-shadow:var(--shadow);
  }
  .step-n{
    font-family:var(--mono);font-size:11px;font-weight:500;color:var(--accent);
    margin-bottom:12px;display:flex;align-items:center;gap:8px;
  }
  .step h3{font-size:15px;font-weight:600}
  .step p{color:var(--text-secondary);font-size:13.5px;line-height:1.55}
  .step a{font-size:13px;font-weight:500;display:inline-flex;align-items:center;gap:5px;margin-top:12px}

  /* Tabs */
  .panel{
    background:var(--bg-card);border:1px solid var(--border);
    border-radius:var(--radius);overflow:hidden;box-shadow:var(--shadow);
  }
  .tabs{
    display:flex;border-bottom:1px solid var(--border);
    overflow-x:auto;scrollbar-width:none;background:var(--bg-soft);
  }
  .tabs::-webkit-scrollbar{display:none}
  .tab{
    flex:0 0 auto;padding:12px 16px;background:transparent;border:none;
    color:var(--text-mute);font-size:13px;font-weight:500;cursor:pointer;
    font-family:var(--sans);border-bottom:2px solid transparent;margin-bottom:-1px;
    transition:color .15s,border-color .15s,background .15s;
  }
  .tab:hover{color:var(--text-secondary)}
  .tab.active{color:var(--accent);border-bottom-color:var(--accent);background:var(--bg-card)}
  .tab-pane{display:none;padding:18px 16px}
  .tab-pane.active{display:block}
  .tab-pane.flash pre{
    animation:codeFlash .55s ease;
  }
  @keyframes codeFlash{
    0%{border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-soft);background:color-mix(in srgb,var(--accent-soft) 55%,var(--bg-code))}
    100%{border-color:var(--border);box-shadow:none;background:var(--bg-code)}
  }
  .tab-note{font-size:13px;color:var(--text-secondary);margin-top:12px;line-height:1.5}
  pre{
    background:var(--bg-code);border:1px solid var(--border);border-radius:var(--radius-sm);
    padding:16px;overflow-x:auto;font-family:var(--mono);font-size:12.5px;
    line-height:1.55;color:var(--text);position:relative;
    transition:border-color .2s,box-shadow .2s,background .2s;
  }
  .copy-btn{
    position:absolute;top:8px;right:8px;
    background:var(--bg-card);border:1px solid var(--border);color:var(--text-secondary);
    padding:4px 10px;font-size:11px;font-weight:500;border-radius:5px;cursor:pointer;
    font-family:var(--sans);transition:all .15s;
  }
  .copy-btn:hover{color:var(--text);border-color:var(--border-strong)}
  .copy-btn.copied{color:var(--ok);border-color:var(--ok-border);background:var(--ok-soft)}
  .comment{color:var(--text-mute)}

  /* Tools */
  .tools-toolbar{margin-bottom:18px;max-width:420px}
  .search{
    position:relative;display:flex;align-items:center;
  }
  .search svg{
    position:absolute;left:12px;width:16px;height:16px;color:var(--text-mute);pointer-events:none;
  }
  .search input{
    width:100%;padding:11px 14px 11px 38px;
    background:var(--bg-card);border:1px solid var(--border);border-radius:8px;
    color:var(--text);font-size:14px;font-family:var(--sans);box-shadow:var(--shadow);
    transition:border-color .15s,box-shadow .15s;
  }
  .search input:focus{outline:none;border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-soft)}
  .search input::placeholder{color:var(--text-mute)}

  .tool-group{margin-bottom:20px}
  .tool-group-head{
    display:flex;align-items:center;flex-wrap:wrap;gap:8px 14px;
    margin-bottom:12px;padding-bottom:10px;border-bottom:1px solid var(--border);
  }
  .tool-group-name{font-size:15px;font-weight:600}
  .tool-group-desc{color:var(--text-mute);font-size:13px;flex:1;min-width:180px}
  .tool-group-count{
    font-family:var(--mono);font-size:11px;color:var(--text-mute);
    background:var(--bg-soft);border:1px solid var(--border);
    padding:2px 8px;border-radius:999px;
  }
  .tools-grid{display:grid;gap:10px;grid-template-columns:1fr}
  @media(min-width:700px){.tools-grid{grid-template-columns:1fr 1fr}}
  @media(min-width:1000px){.tools-grid{grid-template-columns:1fr 1fr 1fr}}
  .tool{
    background:var(--bg-card);border:1px solid var(--border);
    border-radius:var(--radius-sm);padding:14px 15px;
    transition:border-color .15s,transform .15s,box-shadow .15s;
    box-shadow:var(--shadow);
  }
  .tool:hover{border-color:var(--border-strong);transform:translateY(-1px)}
  .tool-name{
    font-family:var(--mono);font-size:12.5px;font-weight:500;
    color:var(--accent);margin-bottom:5px;word-break:break-all;
  }
  .tool-desc{color:var(--text-secondary);font-size:12.5px;line-height:1.45}
  .tool-tag{
    display:inline-block;font-size:10px;font-weight:600;padding:2px 6px;
    border-radius:4px;margin-top:8px;text-transform:uppercase;letter-spacing:.04em;
  }
  .tool-tag-write{background:var(--warn-soft);color:var(--warn);border:1px solid var(--warn-border)}
  .tool-tag-public{background:var(--ok-soft);color:var(--ok);border:1px solid var(--ok-border)}
  .tool-tag-binary{background:var(--accent-soft);color:var(--accent);border:1px solid var(--accent-border)}
  .no-results{text-align:center;padding:48px 20px;color:var(--text-mute);font-size:14px;display:none}
  .hidden{display:none !important}

  /* Auth */
  .auth-grid{display:grid;gap:14px;grid-template-columns:1fr}
  @media(min-width:840px){.auth-grid{grid-template-columns:1fr 1fr}}
  .auth-card{
    background:var(--bg-card);border:1px solid var(--border);
    border-radius:var(--radius);padding:22px;box-shadow:var(--shadow);
  }
  .auth-card h3{
    font-size:14px;font-weight:600;margin-bottom:8px;
    display:flex;align-items:center;flex-wrap:wrap;gap:8px;
  }
  .auth-card h3 code{font-size:12.5px}
  .pill{
    font-size:11px;font-weight:500;color:var(--text-mute);
    border:1px solid var(--border);padding:2px 7px;border-radius:999px;
  }
  .auth-card p{color:var(--text-secondary);font-size:13.5px;margin-bottom:10px;line-height:1.55}
  .auth-card p:last-child{margin-bottom:0}
  .key-row{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px}
  .key-chip{
    font-size:11px;font-weight:500;padding:4px 9px;border-radius:999px;
    font-family:var(--mono);
  }
  .key-chip.sk{background:var(--warn-soft);color:var(--warn);border:1px solid var(--warn-border)}
  .key-chip.pub{background:var(--ok-soft);color:var(--ok);border:1px solid var(--ok-border)}

  /* Try */
  .try-stack{display:grid;gap:12px}
  .try-stack pre{margin:0}

  /* Footer */
  footer{
    padding:36px 20px 28px;
    border-top:1px solid var(--border);
    background:linear-gradient(180deg,var(--bg-soft) 0%,var(--bg) 55%);
  }
  .footer-inner{max-width:none;margin:0}
  .footer-main{
    display:flex;flex-wrap:wrap;align-items:flex-start;justify-content:space-between;
    gap:24px 40px;margin-bottom:24px;
  }
  .footer-brand{display:flex;flex-direction:column;gap:10px;max-width:360px}
  .footer-brand-row{display:flex;align-items:center;gap:10px}
  .footer-brand-name{font-size:15px;font-weight:600;color:var(--text)}
  .footer-brand p{color:var(--text-secondary);font-size:13.5px;line-height:1.55}
  .footer-cols{display:flex;flex-wrap:wrap;gap:28px 48px}
  .footer-col{min-width:120px}
  .footer-col h4{
    font-size:11px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;
    color:var(--text-mute);margin-bottom:12px;
  }
  .footer-col a{
    display:flex;align-items:center;gap:8px;
    color:var(--text-secondary);font-size:13.5px;font-weight:500;
    padding:5px 0;transition:color .15s;
  }
  .footer-col a:hover{color:var(--accent)}
  .footer-col a .ico-sm{color:var(--text-mute)}
  .footer-col a:hover .ico-sm{color:var(--accent)}
  .footer-bottom{
    display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;
    gap:12px 20px;padding-top:18px;border-top:1px solid var(--border);
  }
  .footer-meta{color:var(--text-mute);font-size:12.5px;line-height:1.5}
  .footer-badges{display:flex;flex-wrap:wrap;gap:8px}
  .footer-badge{
    display:inline-flex;align-items:center;gap:6px;
    font-size:11px;font-weight:500;font-family:var(--mono);
    color:var(--text-secondary);background:var(--bg-card);
    border:1px solid var(--border);padding:4px 9px;border-radius:999px;
  }
  .footer-badge .dot{
    width:6px;height:6px;border-radius:50%;background:var(--ok);flex-shrink:0;
  }

  @media(max-width:640px){
    .hero{padding:28px 14px 24px}
    section{padding:28px 14px}
    .nav-inner{padding:0 14px}
    footer{padding:28px 14px 24px}
    .footer-main{gap:22px}
    .footer-cols{gap:22px 32px}
    .tab-pane{padding:12px}
    pre{font-size:11.5px}
  }

  @media(prefers-reduced-motion:reduce){
    html{scroll-behavior:auto}
    *,*::before,*::after{transition:none !important;animation:none !important}
  }
</style>
<script>
  (function(){
    var stored = localStorage.getItem('tbh-theme');
    var theme = stored || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', theme);
  })();
</script>
</head>
<body>

<nav class="nav">
  <div class="nav-inner">
    <a class="brand" href="/">
      <span class="brand-mark" aria-hidden="true">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 3h10v1.6H2V3zm0 3.2h6.5V7.8H2V6.2zm0 3.2h8V11H2v-1.6z" fill="#fff"/></svg>
      </span>
      <span>TeleBotHost MCP</span>
      <span class="brand-ver">v${SERVER_VERSION}</span>
    </a>
    <div class="nav-right">
      <div class="nav-links">
        <a href="#quickstart">Start</a>
        <a href="#tools" data-hide-sm>Tools</a>
        <a href="#auth" data-hide-sm>Auth</a>
        <a href="${GITHUB_URL}" target="_blank" rel="noopener">GitHub</a>
      </div>
      <button class="theme-btn" id="themeToggle" type="button" aria-label="Toggle color theme" title="Toggle theme">
        <svg class="icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
        <svg class="icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>
      </button>
    </div>
  </div>
</nav>

<header class="hero">
  <div class="hero-inner">
    <p class="hero-kicker">${icon("layers", "ico-sm")} Model Context Protocol</p>
    <h1>TeleBotHost MCP Server</h1>
    <p class="hero-lead">A production MCP server for the TeleBotHost Developer API. Manage Telegram bots from Claude, Cursor, Copilot, and other AI clients.</p>
    <div class="hero-meta">
      <span class="chip">${icon("zap", "ico-sm")} <strong>${allTools.length}</strong> tools</span>
      <span class="chip">${icon("plug", "ico-sm")} MCP ${PROTOCOL_VERSION}</span>
      <span class="chip">${icon("check", "ico-sm")} Full API coverage</span>
      <span class="chip">${icon("code", "ico-sm")} TypeScript</span>
    </div>
    <div class="hero-actions">
      <a href="#quickstart" class="btn btn-primary">${icon("arrow")} Get started</a>
      <a href="${GITHUB_URL}" target="_blank" rel="noopener" class="btn btn-ghost">${icon("github")} View source</a>
      <a href="${healthUrl}" class="btn btn-ghost">${icon("heartPulse")} Health</a>
    </div>
  </div>
</header>

<section id="quickstart">
  <div class="wrap">
    <p class="section-label">Setup</p>
    <h2 class="section-title">Quick start</h2>
    <p class="section-desc">Connect an AI client in a few minutes. Your API key stays on the client — the server does not store it.</p>

    <div class="steps">
      <div class="step">
        <div class="step-n"><span class="ico-box">${icon("key")}</span> 01</div>
        <div class="step-head"><h3>Get a TeleBotHost API key</h3></div>
        <p>Open Developer Settings → API Keys. Use an <code>sk_*</code> key for full access, or <code>pub_*</code> for read-only.</p>
        <a href="https://telebothost.com" target="_blank" rel="noopener">telebothost.com ${icon("arrow", "ico-sm")}</a>
      </div>
      <div class="step">
        <div class="step-n"><span class="ico-box">${icon("fileCode")}</span> 02</div>
        <div class="step-head"><h3>Add the client config</h3></div>
        <p>Pick your client below, paste the JSON, and replace <code>sk_YOUR_KEY_HERE</code> with your key. The endpoint URL is already filled in.</p>
      </div>
      <div class="step">
        <div class="step-n"><span class="ico-box">${icon("refresh")}</span> 03</div>
        <div class="step-head"><h3>Restart and ask</h3></div>
        <p>Restart the client, then try “list my TeleBotHost bots” or “create a new command”. It will use this MCP server automatically.</p>
      </div>
    </div>

    <div class="panel">
      <div class="tabs" role="tablist">
        <button class="tab active" data-tab="claude" type="button">Claude Desktop</button>
        <button class="tab" data-tab="cursor" type="button">Cursor</button>
        <button class="tab" data-tab="vscode" type="button">VS Code</button>
        <button class="tab" data-tab="curl" type="button">curl</button>
      </div>

      <div class="tab-pane active" data-pane="claude">
        <pre><button class="copy-btn" type="button">${icon("copy", "ico-sm")} Copy</button>{
  "mcpServers": {
    "telebothost": {
      "url": "${mcpUrl}",
      "transport": "http",
      "headers": {
        "X-Tbh-Api-Key": "sk_YOUR_KEY_HERE"
      }
    }
  }
}</pre>
        <p class="tab-note">Edit <code>~/Library/Application Support/Claude/claude_desktop_config.json</code> (macOS) or <code>%APPDATA%\\Claude\\claude_desktop_config.json</code> (Windows).</p>
      </div>

      <div class="tab-pane" data-pane="cursor">
        <pre><button class="copy-btn" type="button">${icon("copy", "ico-sm")} Copy</button>{
  "mcpServers": {
    "telebothost": {
      "url": "${mcpUrl}",
      "headers": {
        "X-Tbh-Api-Key": "sk_YOUR_KEY_HERE"
      }
    }
  }
}</pre>
        <p class="tab-note">Settings → MCP → Add Server. Paste this config.</p>
      </div>

      <div class="tab-pane" data-pane="vscode">
        <pre><button class="copy-btn" type="button">${icon("copy", "ico-sm")} Copy</button>{
  "mcp.servers": {
    "telebothost": {
      "url": "${mcpUrl}",
      "headers": {
        "X-Tbh-Api-Key": "sk_YOUR_KEY_HERE"
      }
    }
  }
}</pre>
        <p class="tab-note">Add to your VS Code MCP settings (Cline or Continue).</p>
      </div>

      <div class="tab-pane" data-pane="curl">
        <pre><button class="copy-btn" type="button">${icon("copy", "ico-sm")} Copy</button><span class="comment"># List available tools</span>
curl -X POST ${mcpUrl} \\
  -H "Content-Type: application/json" \\
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'

<span class="comment"># Call a tool with your API key</span>
curl -X POST ${mcpUrl} \\
  -H "Content-Type: application/json" \\
  -H "X-Tbh-Api-Key: sk_YOUR_KEY_HERE" \\
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"list_bots","arguments":{}}}'</pre>
      </div>
    </div>
  </div>
</section>

<section id="tools">
  <div class="wrap">
    <p class="section-label">Reference</p>
    <h2 class="section-title">Available tools (${allTools.length})</h2>
    <p class="section-desc">Full coverage of the TeleBotHost Developer API — 64 endpoints mapped to ${allTools.length} tools.</p>

    <div class="tools-toolbar">
      <div class="search">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>
        <input type="search" id="toolSearch" placeholder="Search tools…" autocomplete="off" aria-label="Search tools">
      </div>
    </div>

    <div id="toolsList">
      ${grouped.map((g) => `
      <div class="tool-group" data-group="${g.name}">
        <div class="tool-group-head">
          <span class="tool-group-title">
            <span class="ico-box">${icon(g.icon)}</span>
            <span class="tool-group-name">${g.name}</span>
          </span>
          <span class="tool-group-desc">${g.description}</span>
          <span class="tool-group-count">${g.tools.length}</span>
        </div>
        <div class="tools-grid">
          ${g.tools.map((t) => `
          <div class="tool" data-name="${t.name.toLowerCase()}" data-desc="${escapeHtml(t.description.toLowerCase())}">
            <div class="tool-name">${t.name}</div>
            <div class="tool-desc">${escapeHtml(t.description.split(".")[0])}.</div>
            ${t.tags.map((tag) => `<span class="tool-tag ${tag.class}">${tag.label}</span>`).join("")}
          </div>`).join("")}
        </div>
      </div>`).join("")}
    </div>

    <div class="no-results" id="noResults">No tools match your search.</div>
  </div>
</section>

<section id="auth">
  <div class="wrap">
    <p class="section-label">Security</p>
    <h2 class="section-title">Authentication</h2>
    <p class="section-desc">Two independent layers. Most users only need the TeleBotHost API key.</p>

    <div class="auth-grid">
      <div class="auth-card">
        <h3><span class="ico-box">${icon("key")}</span> <code>X-Tbh-Api-Key</code> <span class="pill">Required</span></h3>
        <p>Your TeleBotHost API key, sent per request. The server forwards it to the TBH API and does not store it.</p>
        <p>Get it from <a href="https://telebothost.com" target="_blank" rel="noopener">telebothost.com → Developer Settings → API Keys</a>.</p>
        <div class="key-row">
          <span class="key-chip sk">sk_* full access</span>
          <span class="key-chip pub">pub_* read-only</span>
        </div>
      </div>
      <div class="auth-card">
        <h3><span class="ico-box">${icon("shield")}</span> <code>MCP_AUTH_TOKEN</code> <span class="pill">Optional</span></h3>
        <p>If the server operator sets this env var, clients must also send <code>Authorization: Bearer &lt;token&gt;</code> to reach the MCP endpoint.</p>
        <p>Use it to control who can call your deployment. End users connecting to a shared instance usually can ignore this.</p>
      </div>
    </div>
  </div>
</section>

<section id="try">
  <div class="wrap">
    <p class="section-label">Verify</p>
    <h2 class="section-title">Try it live</h2>
    <p class="section-desc">Smoke-test the endpoint from your terminal. Endpoint: <code>${mcpUrl}</code></p>

    <div class="try-stack">
      <pre><button class="copy-btn" type="button">${icon("copy", "ico-sm")} Copy</button><span class="comment"># Initialize (no auth)</span>
curl -X POST ${mcpUrl} \\
  -H "Content-Type: application/json" \\
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"${PROTOCOL_VERSION}","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}}}'</pre>

      <pre><button class="copy-btn" type="button">${icon("copy", "ico-sm")} Copy</button><span class="comment"># List all ${allTools.length} tools</span>
curl -X POST ${mcpUrl} \\
  -H "Content-Type: application/json" \\
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}'</pre>

      <pre><button class="copy-btn" type="button">${icon("copy", "ico-sm")} Copy</button><span class="comment"># Public store browse (no key)</span>
curl -X POST ${mcpUrl} \\
  -H "Content-Type: application/json" \\
  -d '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"list_public_store_bots","arguments":{"limit":"5"}}}'</pre>

      <pre><button class="copy-btn" type="button">${icon("copy", "ico-sm")} Copy</button><span class="comment"># List your bots (requires TBH key)</span>
curl -X POST ${mcpUrl} \\
  -H "Content-Type: application/json" \\
  -H "X-Tbh-Api-Key: sk_YOUR_KEY_HERE" \\
  -d '{"jsonrpc":"2.0","id":4,"method":"tools/call","params":{"name":"list_bots","arguments":{}}}'</pre>
    </div>
  </div>
</section>

<footer>
  <div class="footer-inner">
    <div class="footer-main">
      <div class="footer-brand">
        <div class="footer-brand-row">
          <span class="brand-mark" aria-hidden="true">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 3h10v1.6H2V3zm0 3.2h6.5V7.8H2V6.2zm0 3.2h8V11H2v-1.6z" fill="#fff"/></svg>
          </span>
          <span class="footer-brand-name">TeleBotHost MCP</span>
          <span class="brand-ver">v${SERVER_VERSION}</span>
        </div>
        <p>Production MCP server for the TeleBotHost Developer API — ${allTools.length} tools for AI clients.</p>
      </div>
      <div class="footer-cols">
        <div class="footer-col">
          <h4>Product</h4>
          <a href="#quickstart">${icon("arrow", "ico-sm")} Quick start</a>
          <a href="#tools">${icon("layers", "ico-sm")} Tools</a>
          <a href="#auth">${icon("shield", "ico-sm")} Auth</a>
          <a href="#try">${icon("terminal", "ico-sm")} Try it</a>
        </div>
        <div class="footer-col">
          <h4>Resources</h4>
          <a href="${GITHUB_URL}" target="_blank" rel="noopener">${icon("github", "ico-sm")} GitHub</a>
          <a href="${TBH_DOCS_URL}" target="_blank" rel="noopener">${icon("fileCode", "ico-sm")} TBH API Docs</a>
          <a href="${MCP_SPEC_URL}" target="_blank" rel="noopener">${icon("plug", "ico-sm")} MCP Spec</a>
          <a href="https://telebothost.com" target="_blank" rel="noopener">${icon("globe", "ico-sm")} TeleBotHost</a>
        </div>
        <div class="footer-col">
          <h4>Status</h4>
          <a href="${healthUrl}">${icon("heartPulse", "ico-sm")} Health check</a>
          <a href="${mcpUrl}">${icon("zap", "ico-sm")} MCP endpoint</a>
        </div>
      </div>
    </div>
    <div class="footer-bottom">
      <p class="footer-meta">MIT License · Built for the TeleBotHost community</p>
      <div class="footer-badges">
        <span class="footer-badge"><span class="dot" aria-hidden="true"></span> ${SERVER_NAME}</span>
        <span class="footer-badge">v${SERVER_VERSION}</span>
        <span class="footer-badge">${allTools.length} tools</span>
      </div>
    </div>
  </div>
</footer>

<script>
  (function () {
    var root = document.documentElement;
    var toggle = document.getElementById('themeToggle');
    toggle.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      localStorage.setItem('tbh-theme', next);
    });

    document.querySelectorAll('.tab').forEach(function (tab) {
      tab.addEventListener('click', function () {
        var target = tab.getAttribute('data-tab');
        var current = document.querySelector('.tab.active');
        if (current && current.getAttribute('data-tab') === target) return;
        document.querySelectorAll('.tab').forEach(function (t) { t.classList.remove('active'); });
        document.querySelectorAll('.tab-pane').forEach(function (p) {
          p.classList.remove('active', 'flash');
        });
        tab.classList.add('active');
        var pane = document.querySelector('[data-pane="' + target + '"]');
        if (pane) {
          pane.classList.add('active');
          // Force reflow so the highlight animation restarts on each switch
          void pane.offsetWidth;
          pane.classList.add('flash');
          setTimeout(function () { pane.classList.remove('flash'); }, 560);
        }
      });
    });

    document.querySelectorAll('.copy-btn').forEach(function (btn) {
      btn.addEventListener('click', async function (e) {
        e.preventDefault();
        var pre = btn.closest('pre');
        var code = pre ? pre.innerText.replace(/^(Copy|Copied)\\n/, '').trim() : '';
        try {
          await navigator.clipboard.writeText(code);
          var orig = btn.innerHTML;
          btn.innerHTML = ${JSON.stringify(icon("check", "ico-sm") + " Copied")};
          btn.classList.add('copied');
          setTimeout(function () { btn.innerHTML = orig; btn.classList.remove('copied'); }, 1600);
        } catch (err) {
          var fallback = ${JSON.stringify(icon("copy", "ico-sm") + " Copy")};
          btn.textContent = 'Failed';
          setTimeout(function () { btn.innerHTML = fallback; }, 1600);
        }
      });
    });

    var search = document.getElementById('toolSearch');
    var noResults = document.getElementById('noResults');
    var groups = document.querySelectorAll('.tool-group');

    search.addEventListener('input', function (e) {
      var q = e.target.value.toLowerCase().trim();
      var totalVisible = 0;
      groups.forEach(function (group) {
        var groupVisible = 0;
        group.querySelectorAll('.tool').forEach(function (tool) {
          var name = tool.getAttribute('data-name') || '';
          var desc = tool.getAttribute('data-desc') || '';
          var match = !q || name.indexOf(q) !== -1 || desc.indexOf(q) !== -1;
          tool.classList.toggle('hidden', !match);
          if (match) groupVisible++;
        });
        group.classList.toggle('hidden', groupVisible === 0);
        totalVisible += groupVisible;
      });
      noResults.style.display = totalVisible === 0 ? 'block' : 'none';
    });
  })();
</script>

</body>
</html>`;
}

/** Generate a minimal JSON health response. */
export function generateHealthJson(origin: string): string {
  const base = normalizeOrigin(origin);
  return JSON.stringify(
    {
      status: "ok",
      server: SERVER_NAME,
      version: SERVER_VERSION,
      protocol: PROTOCOL_VERSION,
      tools: allTools.length,
      endpoints: {
        mcp: `${base}/api/mcp`,
        docs: `${base}/`,
        health: `${base}/api/health`,
      },
      coverage: "100%",
      timestamp: new Date().toISOString(),
    },
    null,
    2,
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

interface ToolWithTags {
  name: string;
  description: string;
  tags: Array<{ label: string; class: string }>;
}

interface ToolGroup {
  name: string;
  icon: string;
  description: string;
  tools: ToolWithTags[];
}

/** Group tools into display sections based on name patterns. */
function groupToolsBySection(): ToolGroup[] {
  const groups: Record<string, ToolWithTags[]> = {};
  for (const g of GROUPS) groups[g.name] = [];

  for (const tool of allTools) {
    const name = tool.name;
    let groupName: string;
    const tags: Array<{ label: string; class: string }> = [];

    if (name === "get_status") {
      groupName = "Health";
    } else if (
      name.startsWith("get_public_") ||
      name.startsWith("list_public_") ||
      name.startsWith("list_templates") ||
      name.startsWith("get_template") ||
      name === "get_public_ads"
    ) {
      groupName = "Public Discovery";
      tags.push({ label: "public", class: "tool-tag-public" });
    } else if (
      name.startsWith("get_bot_storage") ||
      name === "clear_bot_storage" ||
      name === "migrate_bot_storage"
    ) {
      groupName = "Bot Storage";
    } else if (name.includes("broadcast")) {
      groupName = "Broadcasts";
      if (name === "start_broadcast") tags.push({ label: "write", class: "tool-tag-write" });
    } else if (name.includes("command") || name.includes("_folder")) {
      groupName = "Commands";
      if (
        [
          "create_command",
          "delete_commands",
          "delete_command",
          "permanently_delete_command",
          "recover_deleted_command",
          "create_command_folder",
          "update_command_folder",
          "delete_command_folder",
        ].includes(name)
      ) {
        tags.push({ label: "write", class: "tool-tag-write" });
      }
    } else if (name.includes("_env_")) {
      groupName = "Env Vars";
      if (["create_env_var", "update_env_var", "delete_env_var"].includes(name)) {
        tags.push({ label: "write", class: "tool-tag-write" });
      }
    } else if (
      name === "get_bot_logs" ||
      name === "clear_bot_logs" ||
      name === "get_bot_analytics"
    ) {
      groupName = "Logs & Analytics";
      if (name === "clear_bot_logs") tags.push({ label: "write", class: "tool-tag-write" });
    } else if (name === "list_store_bots" || name === "install_store_bot") {
      groupName = "Community Store";
      if (name === "install_store_bot") tags.push({ label: "write", class: "tool-tag-write" });
    } else if (name === "get_quota") {
      groupName = "Quota";
    } else if (name.startsWith("search_")) {
      groupName = "Docs Search";
      tags.push({ label: "public", class: "tool-tag-public" });
    } else {
      groupName = "Bot Lifecycle";
      if (["download_bot", "import_bot"].includes(name)) {
        tags.push({ label: "binary", class: "tool-tag-binary" });
      } else if (
        [
          "register_bot",
          "delete_bots",
          "purge_deleted_bot",
          "update_bot",
          "pin_bots",
          "clone_bot",
          "clone_bot_as_child",
          "transfer_bot",
          "reset_bot",
          "toggle_bot_template",
          "update_bot_readme",
          "export_bot",
        ].includes(name)
      ) {
        tags.push({ label: "write", class: "tool-tag-write" });
      }
    }

    if (groups[groupName]) {
      groups[groupName].push({ name: tool.name, description: tool.description, tags });
    }
  }

  return GROUPS.map((g) => ({
    name: g.name,
    icon: g.icon,
    description: g.description,
    tools: groups[g.name] || [],
  })).filter((g) => g.tools.length > 0);
}
